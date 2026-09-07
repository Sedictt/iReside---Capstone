import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { otpVerifySchema } from "@/lib/validation/schemas/auth.schema";
import { createPasswordResetToken } from "@/lib/auth/reset-token";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = otpVerifySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid email or OTP code. Code must be 6 digits." },
                { status: 400 }
            );
        }

        const { email, otp } = validation.data;
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();

        const supabaseAdmin = createServiceRoleSupabaseClient();

        // Check user profile
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("email", normalizedEmail)
            .maybeSingle();

        if (!profile?.id) {
            return NextResponse.json(
                { error: "Invalid or expired verification code." },
                { status: 400 }
            );
        }

        // Verify from user_security_settings
        const { data: securitySettings } = await (supabaseAdmin as any)
            .from("user_security_settings")
            .select("otp_code, otp_expiry")
            .eq("profile_id", profile.id)
            .maybeSingle();

        const storedOtp = securitySettings?.otp_code;
        const storedExpiry = securitySettings?.otp_expiry ? new Date(securitySettings.otp_expiry) : null;

        if (!storedOtp || storedOtp !== normalizedOtp) {
            return NextResponse.json(
                { error: "Invalid verification code. Please check and try again." },
                { status: 400 }
            );
        }

        if (!storedExpiry || new Date() > storedExpiry) {
            return NextResponse.json(
                { error: "Verification code has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Generate temporary signed reset token valid for 10 minutes
        const resetToken = createPasswordResetToken(normalizedEmail, profile.id);

        return NextResponse.json({
            success: true,
            resetToken,
        });
    } catch (err) {
        console.error("[OTP Verify Error]:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
