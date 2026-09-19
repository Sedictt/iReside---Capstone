import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { generateSecurityKey, encryptSecurityKey } from "@/lib/security/recovery-keys";
import { logUserActivity } from "@/lib/audit/audit-logger";
import { sendRegistrationOTP } from "@/lib/email";

/**
 * POST /api/auth/security-key/rotate
 * Re-generates a user's security key from Settings.
 * Requires:
 * 1. Authenticated session
 * 2. Verification of current password
 * 3. Verification of 2FA/Email OTP code
 *
 * Can also be called with `{ action: "send-otp" }` to dispatch a verification code to user's registered email.
 */
export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    try {
        const body = await request.json();

        // Dispatch OTP code if requested
        if (body.action === "send-otp") {
            const adminClient = createServiceRoleSupabaseClient();
            const { data: profile } = await adminClient
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .maybeSingle();

            if (!profile?.email) {
                return NextResponse.json({ error: "User profile not found." }, { status: 404 });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await (adminClient as any)
                .from("user_security_settings")
                .upsert({
                    profile_id: userId,
                    otp_code: otp,
                    otp_expiry: expiry,
                    updated_at: new Date().toISOString(),
                });

            try {
                await sendRegistrationOTP({ to: profile.email, otp });
            } catch (mailErr) {
                console.warn("[SecurityKey rotate] Failed to send OTP email:", mailErr);
            }

            return NextResponse.json({
                success: true,
                message: `Verification code sent to ${profile.email}`,
            });
        }

        const { currentPassword, otpCode } = body;

        if (!currentPassword || !otpCode) {
            return NextResponse.json(
                { error: "Current password and verification code are required to rotate your security key." },
                { status: 400 }
            );
        }

        const adminClient = createServiceRoleSupabaseClient();

        // 1. Fetch user's email and security settings
        const [{ data: profile }, { data: secSettings }] = await Promise.all([
            adminClient
                .from("profiles")
                .select("email")
                .eq("id", userId)
                .maybeSingle(),
            (adminClient as any)
                .from("user_security_settings")
                .select("otp_code, otp_expiry")
                .eq("profile_id", userId)
                .maybeSingle(),
        ]);

        if (!profile?.email) {
            return NextResponse.json({ error: "User profile not found." }, { status: 404 });
        }

        // 2. Verify current password
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const verifyClient = createClient(supabaseUrl, supabaseAnonKey);

        const { error: authError } = await verifyClient.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword,
        });

        if (authError) {
            return NextResponse.json(
                { error: "Incorrect current password." },
                { status: 401 }
            );
        }

        // 3. Verify OTP code
        const cleanOtp = otpCode.trim();
        if (!secSettings?.otp_code || secSettings.otp_code !== cleanOtp) {
            return NextResponse.json(
                { error: "Invalid verification code." },
                { status: 400 }
            );
        }

        if (secSettings.otp_expiry && new Date(secSettings.otp_expiry).getTime() < Date.now()) {
            return NextResponse.json(
                { error: "Verification code has expired. Please request a new code." },
                { status: 400 }
            );
        }

        // 4. Generate & Encrypt new replacement security key
        const newKey = generateSecurityKey();
        const encrypted = encryptSecurityKey(newKey);
        const timestamp = new Date().toISOString();

        await (adminClient as any)
            .from("user_security_settings")
            .update({
                security_key_encrypted: encrypted.encrypted,
                security_key_iv: encrypted.iv,
                security_key_auth_tag: encrypted.authTag,
                security_key_updated_at: timestamp,
                security_key_failed_attempts: 0,
                security_key_locked_until: null,
                otp_code: null, // Consume OTP
                otp_expiry: null,
                updated_at: timestamp,
            })
            .eq("profile_id", userId);

        // 5. Log audit trail
        await logUserActivity({
            userId,
            userRole: (userRole as any) || "tenant",
            action: "security_key_rotated",
            category: "security",
            title: "Security Recovery Key Rotated",
            description: "User verified their credentials and rotated their single-use security recovery key.",
            severity: "warning",
        });

        return NextResponse.json({
            success: true,
            newSecurityKey: newKey,
            updatedAt: timestamp,
        });
    } catch (err: any) {
        console.error("[SecurityKey Rotate] Error rotating key:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
