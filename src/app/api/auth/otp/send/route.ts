import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { otpRequestSchema } from "@/lib/validation/schemas/auth.schema";
import { sendPasswordResetOtpEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = otpRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        const { email } = validation.data;
        const normalizedEmail = email.trim().toLowerCase();

        const supabaseAdmin = createServiceRoleSupabaseClient();

        // Check if user exists in profiles or auth
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .ilike("email", normalizedEmail)
            .maybeSingle();

        // Generate 6-digit numeric OTP
        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        if (profile?.id) {
            // Save OTP in user_security_settings
            await (supabaseAdmin as any)
                .from("user_security_settings")
                .upsert(
                    {
                        profile_id: profile.id,
                        otp_code: otpCode,
                        otp_expiry: expiresAt,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            // Also keep legacy profile columns in sync if they exist
            await supabaseAdmin
                .from("profiles")
                .update({
                    otp_code: otpCode,
                    otp_expiry: expiresAt,
                } as any)
                .eq("id", profile.id);

            // Dispatch clean email
            await sendPasswordResetOtpEmail({
                to: normalizedEmail,
                otp: otpCode,
                userName: profile.full_name || undefined,
            });
        }

        // Always return success to protect against email enumeration
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[OTP Send Error]:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
