import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";
import { parseJsonBody } from "@/lib/validation/server";
import { twoFactorActionSchema } from "@/lib/validation/schemas/account.schema";
import {
    TWO_FACTOR_VERIFIED_COOKIE,
    createTwoFactorVerifiedCookieValue,
    twoFactorVerifiedCookieOptions,
} from "@/lib/security/two-factor-cookie";
import {
    OAUTH_STATE_COOKIE,
    OAUTH_STATE_COOKIE_PATH,
    OAUTH_STATE_MAX_AGE_SECONDS,
} from "@/lib/security/oauth-state";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/landlord/2fa/callback";

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

        // A random nonce stored in an HttpOnly cookie must round-trip through the
        // `state` parameter. Without it an attacker could complete the OAuth flow
        // with their own Google account inside the victim's session and have the
        // victim's 2FA codes routed to the attacker's mailbox.
        const nonce = randomBytes(24).toString("base64url");
        const state = Buffer.from(JSON.stringify({ userId, nonce })).toString("base64url");
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent("openid email profile")}` +
            `&access_type=offline` +
            `&prompt=consent` +
            `&state=${encodeURIComponent(state)}`;

        const response = NextResponse.json({ authUrl });
        response.cookies.set(OAUTH_STATE_COOKIE, nonce, {
            path: OAUTH_STATE_COOKIE_PATH,
            httpOnly: true,
            sameSite: "lax",
            maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
            secure: process.env.NODE_ENV === "production",
        });
        return response;
    }

    // The OAuth callback is handled exclusively by /api/landlord/2fa/callback,
    // which validates the signed-in user and the state nonce.
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
            // 2FA is now enforced for this account: mark the current device as
            // verified so the user is not locked out of the API mid-session.
            const response = NextResponse.json(result);
            response.cookies.set(
                TWO_FACTOR_VERIFIED_COOKIE,
                await createTwoFactorVerifiedCookieValue(userId),
                twoFactorVerifiedCookieOptions(),
            );
            return response;
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
