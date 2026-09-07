import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { verifyPasswordResetToken } from "@/lib/auth/reset-token";
import { sendPasswordResetConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, resetToken, newPassword } = body;

        if (!email || !resetToken || !newPassword) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        // Validate cryptographic reset token
        const verification = verifyPasswordResetToken(resetToken);
        if (!verification.valid || !verification.userId || verification.email !== email.trim().toLowerCase()) {
            return NextResponse.json(
                { error: "Session expired or invalid. Please verify your OTP code again." },
                { status: 401 }
            );
        }

        const supabaseAdmin = createServiceRoleSupabaseClient();
        const userId = verification.userId;

        // 1. Update user password in Supabase Auth via admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error("[ResetPassword API] Auth update error:", updateError);
            return NextResponse.json(
                { error: updateError.message || "Failed to update password." },
                { status: 500 }
            );
        }

        // 2. Mark account as claimed (has_changed_password = true) and clear the OTP
        await (supabaseAdmin as any)
            .from("user_security_settings")
            .upsert(
                {
                    profile_id: userId,
                    has_changed_password: true,
                    otp_code: null,
                    otp_expiry: null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "profile_id" }
            );

        // Also update legacy profile columns if present
        const { data: updatedProfile } = await supabaseAdmin
            .from("profiles")
            .update({
                has_changed_password: true,
                otp_code: null,
                otp_expiry: null,
            } as any)
            .eq("id", userId)
            .select("full_name, email")
            .maybeSingle();

        // 3. Send in-app notification
        try {
            const { error: notifError } = await supabaseAdmin.from("notifications").insert({
                user_id: userId,
                type: "announcement",
                title: "Password Updated",
                message: "Your password was successfully updated. If you did not make this change, please contact support immediately.",
                read: false,
                data: {
                    category: "security",
                    action: "password_reset",
                },
            });
            if (notifError) {
                console.error("[ResetPassword API] In-app notification error:", notifError);
            }
        } catch (notifErr) {
            console.error("[ResetPassword API] In-app notification error:", notifErr);
        }

        // 4. Send email security confirmation notification
        try {
            const recipientEmail = updatedProfile?.email || email;
            const userName = updatedProfile?.full_name || undefined;
            await sendPasswordResetConfirmationEmail({
                to: recipientEmail,
                userName,
            });
        } catch (emailErr) {
            console.error("[ResetPassword API] Confirmation email error:", emailErr);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[ResetPassword API Error]:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
