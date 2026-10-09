import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { escapeLikePattern, passwordResetRequestSchema } from "@/lib/validation/schemas/account.schema";
import { parseJsonBody } from "@/lib/validation/server";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, passwordResetRequestSchema);
        if (!parsed.ok) return parsed.response;

        const { email } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        // The recovery link must point at *our* configured origin. The Origin
        // header is attacker-controlled and is only used when no app URL is set.
        const origin =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            request.headers.get("origin") ||
            "http://localhost:3000";
        const redirectTo = `${origin.replace(/\/+$/, "")}/auth/callback?type=recovery&next=/auth/reset-password`;

        const supabaseAdmin = createServiceRoleSupabaseClient();

        // Check if user exists in profiles or auth metadata
        let userName: string | undefined;

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .ilike("email", escapeLikePattern(normalizedEmail))
            .maybeSingle();

        if (profile?.full_name?.trim()) {
            userName = profile.full_name.trim();
        }

        // Generate recovery link using admin API
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email: normalizedEmail,
            options: {
                redirectTo,
            },
        });

        if (linkError) {
            console.error("[ForgotPasswordAPI] Error generating reset link:", linkError);
            // Even if user not found in auth, avoid email enumeration by returning 200
            return NextResponse.json({ success: true });
        }

        if (!userName && linkData?.user?.user_metadata) {
            const meta = linkData.user.user_metadata;
            userName = meta.full_name || meta.name || meta.first_name || undefined;
        }

        const resetLink = linkData?.properties?.action_link;

        if (resetLink) {
            await sendPasswordResetEmail({
                to: normalizedEmail,
                resetLink,
                userName,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[ForgotPasswordAPI] Unexpected error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
