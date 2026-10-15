import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { escapeLikePattern, passwordResetOtpVerifySchema } from "@/lib/validation/schemas/account.schema";
import { parseJsonBody } from "@/lib/validation/server";
import { createPasswordResetToken } from "@/lib/auth/reset-token";
import { evaluateOtpAttempt, persistOtpAttempt } from "@/lib/security/otp-verification";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, passwordResetOtpVerifySchema);
        if (!parsed.ok) return parsed.response;

        const { email, otp } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedOtp = otp.trim();

        const supabaseAdmin = createServiceRoleSupabaseClient();

        // Check user profile
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .ilike("email", escapeLikePattern(normalizedEmail))
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

        // Constant-time comparison plus a hard ceiling on guesses per code: a
        // 6-digit code is trivially brute-forced when attempts are unlimited.
        const attempt = evaluateOtpAttempt({
            storedCode: securitySettings?.otp_code,
            storedExpiry: securitySettings?.otp_expiry,
            providedOtp: normalizedOtp,
        });

        if (!attempt.ok) {
            await persistOtpAttempt(supabaseAdmin as any, profile.id, attempt.nextStoredCode);
            const message =
                attempt.reason === "mismatch"
                    ? "Invalid verification code. Please check and try again."
                    : attempt.reason === "expired"
                        ? "Verification code has expired. Please request a new one."
                        : attempt.reason === "locked"
                            ? "Too many failed attempts. Please request a new verification code."
                            : "Invalid or expired verification code.";
            return NextResponse.json(
                { error: message, remainingAttempts: attempt.remainingAttempts },
                { status: attempt.reason === "locked" ? 429 : 400 }
            );
        }

        // The code is single-use: clear it before handing out the reset token.
        await persistOtpAttempt(supabaseAdmin as any, profile.id, null);

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
