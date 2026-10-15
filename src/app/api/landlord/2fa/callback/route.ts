import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { OAUTH_STATE_COOKIE, OAUTH_STATE_COOKIE_PATH } from "@/lib/security/oauth-state";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function saveGmailTwoFactorState(
    adminClient: ReturnType<typeof createAdminClient>,
    userId: string,
    googleEmail: string,
    tokens: { access_token?: string; refresh_token?: string; expires_in?: number },
) {
    const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;

    return Promise.all([
        (adminClient as any)
            .from("external_account_tokens")
            .upsert({
                profile_id: userId,
                provider: "gmail",
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: "profile_id,provider" }),
        (adminClient as any)
            .from("user_security_settings")
            .upsert({
                profile_id: userId,
                two_factor_email: googleEmail,
                updated_at: new Date().toISOString(),
            }, { onConflict: "profile_id" }),
    ]);
}

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
        const cookieStore = await cookies();
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=not_authenticated`);
        const { userId } = authContext;

        // The OAuth state is client-visible data: never let it pick the account
        // being modified. It must name the signed-in user AND carry the nonce that
        // was set in this browser's HttpOnly cookie when the flow started, so a
        // callback URL crafted by someone else cannot bind their Google account
        // (and therefore their mailbox) to this user's 2FA.
        const invalidStateRedirect = () =>
            NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=invalid_state`);

        let decoded: { userId?: unknown; nonce?: unknown } = {};
        if (!state) return invalidStateRedirect();
        try {
            decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        } catch {
            return invalidStateRedirect();
        }
        const expectedNonce = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
        if (
            decoded.userId !== userId ||
            typeof decoded.nonce !== "string" ||
            !expectedNonce ||
            decoded.nonce.length !== expectedNonce.length ||
            !timingSafeEqual(Buffer.from(decoded.nonce), Buffer.from(expectedNonce))
        ) {
            return invalidStateRedirect();
        }
        const callbackUserId = userId;

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

        const [{ error: tokenError }, { error: settingsError }] = await saveGmailTwoFactorState(
            adminClient,
            callbackUserId,
            googleEmail,
            tokens,
        );

        if (tokenError || settingsError) {
            console.error("[2fa-callback] 2FA state update error:", tokenError || settingsError);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=save_failed`);
        }

        const successResponse = NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&gmail_connected=true&auto_send_otp=true`);
        // The nonce is single-use.
        successResponse.cookies.set(OAUTH_STATE_COOKIE, "", { path: OAUTH_STATE_COOKIE_PATH, maxAge: 0, expires: new Date(0) });
        return successResponse;
    } catch (err) {
        console.error("[2fa-callback] Error:", err);
        return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=callback_failed`);
    }
}
