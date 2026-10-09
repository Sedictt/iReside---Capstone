import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";
import { parseJsonBody } from "@/lib/validation/server";
import { twoFactorActionSchema } from "@/lib/validation/schemas/account.schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const twoFactorService = new TwoFactorService();

    if (action === "status") {
        const state = await twoFactorService.getStatus(userId);
        return NextResponse.json(state);
    }

    if (action === "google-auth") {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
        }

        const state = Buffer.from(JSON.stringify({ userId: userId })).toString("base64");
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=openid email profile` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${state}`;

        return NextResponse.json({ authUrl });
    }

    if (action === "callback") {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=oauth_failed`);
        }

        if (!code) {
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=missing_code`);
        }

        try {
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

            const adminClient = createAdminClient();
            await (adminClient as any)
                .from("external_account_tokens")
                .upsert({
                    profile_id: userId,
                    provider: "gmail",
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: "profile_id,provider" });

            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&gmail_connected=true`);
        } catch (err) {
            console.error("[2fa-callback] Error:", err);
            return NextResponse.redirect(`${APP_BASE_URL}/landlord/settings?category=Security&subtab=Protection&error=callback_failed`);
        }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    try {
        const parsed = await parseJsonBody(request, twoFactorActionSchema);
        if (!parsed.ok) return parsed.response;
        const body = parsed.data;
        const { action } = body;
        const twoFactorService = new TwoFactorService();

        if (action === "send-otp") {
            const result = await twoFactorService.sendOTP(userId, { action: "enable" });
            return NextResponse.json(result);
        }

        if (body.action === "verify-otp") {
            const { otp } = body;
            const result = await twoFactorService.verifyOTP(userId, otp, { enableOnSuccess: true });
            if (!result.success) {
                return NextResponse.json(
                    { error: result.error, code: result.code, remainingAttempts: result.remainingAttempts },
                    { status: 400 }
                );
            }
            return NextResponse.json(result);
        }

        if (body.action === "disable") {
            const { password } = body;
            const result = await twoFactorService.disable(userId, password);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 401 });
            }
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("[Landlord 2FA] Error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
