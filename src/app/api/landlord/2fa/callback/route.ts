import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
        return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=oauth_failed`);
    }

    if (!code) {
        return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=missing_code`);
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=not_authenticated`);
        }

        const decoded = state ? JSON.parse(Buffer.from(state, "base64").toString()) : {};
        const userId = decoded.userId || user.id;

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                code,
                grant_type: "authorization_code",
                redirect_uri: GOOGLE_REDIRECT_URI,
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error("[2fa-callback] Token exchange error:", tokens.error);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=token_exchange_failed`);
        }

        // Get user's Google email from userinfo endpoint
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        const userInfo = await userInfoResponse.json();
        const googleEmail = userInfo.email;

        if (!googleEmail) {
            console.error("[2fa-callback] Failed to get Google email:", userInfo);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=no_google_email`);
        }

        const adminClient = createAdminClient();

        const { error: updateError } = await adminClient
            .from("profiles")
            .update({
                gmail_access_token: tokens.access_token,
                gmail_refresh_token: tokens.refresh_token,
                gmail_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                two_factor_email: googleEmail,
            })
            .eq("id", userId);

        if (updateError) {
            console.error("[2fa-callback] Profile update error:", updateError);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=save_failed`);
        }

        return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&gmail_connected=true&auto_send_otp=true`);
    } catch (err) {
        console.error("[2fa-callback] Error:", err);
        return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=callback_failed`);
    }
}