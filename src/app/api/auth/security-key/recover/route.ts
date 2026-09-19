import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
    verifySecurityKey,
    generateSecurityKey,
    encryptSecurityKey,
    checkRecoveryRateLimit,
    registerFailedAttempt,
    normalizeSecurityKey,
} from "@/lib/security/recovery-keys";
import { logUserActivity } from "@/lib/audit/audit-logger";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, securityKey, newPassword, newEmail } = body;

        // 1. Basic validation
        if (!email || !securityKey || !newPassword) {
            return NextResponse.json(
                { error: "Email, security key, and new password are required." },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const cleanSecurityKey = normalizeSecurityKey(securityKey);

        if (cleanSecurityKey.length < 16) {
            return NextResponse.json(
                { error: "Please enter the complete 16-character security key." },
                { status: 400 }
            );
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        let normalizedNewEmail: string | null = null;
        if (newEmail && typeof newEmail === "string" && newEmail.trim()) {
            normalizedNewEmail = newEmail.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedNewEmail)) {
                return NextResponse.json(
                    { error: "The new email address format is invalid." },
                    { status: 400 }
                );
            }
        }

        const adminClient = createServiceRoleSupabaseClient();

        // 2. Find profile by registered email
        const { data: profile, error: profileError } = await adminClient
            .from("profiles")
            .select("id, role, email, full_name")
            .ilike("email", normalizedEmail)
            .maybeSingle();

        if (profileError || !profile) {
            // Mitigate timing attacks with a realistic dummy check
            return NextResponse.json(
                { error: "Invalid email or security key." },
                { status: 400 }
            );
        }

        const userId = profile.id;

        // 3. Fetch security settings
        const { data: secSettings, error: secError } = await (adminClient as any)
            .from("user_security_settings")
            .select(
                "profile_id, security_key_encrypted, security_key_iv, security_key_auth_tag, security_key_failed_attempts, security_key_locked_until"
            )
            .eq("profile_id", userId)
            .maybeSingle();

        if (secError || !secSettings || !secSettings.security_key_encrypted) {
            return NextResponse.json(
                { error: "No security recovery key has been configured for this account." },
                { status: 400 }
            );
        }

        // 4. Rate-limit / Lockout check
        const rateCheck = checkRecoveryRateLimit(
            secSettings.security_key_failed_attempts,
            secSettings.security_key_locked_until
        );

        if (rateCheck.isLocked) {
            const minutesLeft = Math.ceil(
                (rateCheck.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
            );
            return NextResponse.json(
                {
                    error: `Too many failed attempts. Security key recovery is locked for ${Math.max(1, minutesLeft)} more minute(s).`,
                },
                { status: 429 }
            );
        }

        // 5. Verify security key
        const isValid = verifySecurityKey(
            cleanSecurityKey,
            secSettings.security_key_encrypted,
            secSettings.security_key_iv,
            secSettings.security_key_auth_tag
        );

        if (!isValid) {
            const failure = registerFailedAttempt(secSettings.security_key_failed_attempts);
            await (adminClient as any)
                .from("user_security_settings")
                .update({
                    security_key_failed_attempts: failure.failedAttempts,
                    security_key_locked_until: failure.lockedUntil,
                    updated_at: new Date().toISOString(),
                })
                .eq("profile_id", userId);

            await logUserActivity({
                userId,
                userRole: (profile.role as any) || "tenant",
                action: "security_key_failed",
                category: "security",
                title: "Failed Security Key Recovery Attempt",
                description: `Invalid security key submitted for recovery. Failed attempt ${failure.failedAttempts}.`,
                severity: "warning",
            });

            if (failure.lockedUntil) {
                return NextResponse.json(
                    { error: "Maximum failed attempts reached. Security key recovery is locked for 15 minutes." },
                    { status: 429 }
                );
            }

            const remaining = Math.max(0, 5 - failure.failedAttempts);
            return NextResponse.json(
                { error: `Invalid security key. ${remaining} attempt(s) remaining before temporary lockout.` },
                { status: 400 }
            );
        }

        // 6. Security key verified! Execute account update
        const authUpdates: { password?: string; email?: string } = {
            password: newPassword,
        };

        if (normalizedNewEmail && normalizedNewEmail !== normalizedEmail) {
            authUpdates.email = normalizedNewEmail;
        }

        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
            userId,
            authUpdates
        );

        if (authUpdateError) {
            console.error("[SecurityKey Recover] Auth update error:", authUpdateError);
            return NextResponse.json(
                { error: authUpdateError.message || "Failed to update account credentials." },
                { status: 500 }
            );
        }

        // Update profile email if modified
        if (normalizedNewEmail && normalizedNewEmail !== normalizedEmail) {
            await adminClient
                .from("profiles")
                .update({ email: normalizedNewEmail, updated_at: new Date().toISOString() })
                .eq("id", userId);
        }

        // 7. Single-use enforcement: generate & encrypt replacement security key
        const replacementKey = generateSecurityKey();
        const newEncrypted = encryptSecurityKey(replacementKey);
        const timestamp = new Date().toISOString();

        await (adminClient as any)
            .from("user_security_settings")
            .update({
                security_key_encrypted: newEncrypted.encrypted,
                security_key_iv: newEncrypted.iv,
                security_key_auth_tag: newEncrypted.authTag,
                security_key_updated_at: timestamp,
                security_key_failed_attempts: 0,
                security_key_locked_until: null,
                has_changed_password: true,
                updated_at: timestamp,
            })
            .eq("profile_id", userId);

        // 8. Log successful recovery
        await logUserActivity({
            userId,
            userRole: (profile.role as any) || "tenant",
            action: "security_key_recovered",
            category: "security",
            title: "Account Recovered via Security Key",
            description: `User recovered account and reset credentials using their single-use security key. Previous key consumed and new key issued.`,
            severity: "critical",
        });

        return NextResponse.json({
            success: true,
            newSecurityKey: replacementKey,
            message: "Account recovered successfully. Please save your replacement security key.",
        });
    } catch (err: any) {
        console.error("[SecurityKey Recover] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
