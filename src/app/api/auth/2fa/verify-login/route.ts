import { NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { twoFactorVerifyLoginSchema } from "@/lib/validation/schemas/account.schema";
import {
    TWO_FACTOR_PENDING_COOKIE,
    TWO_FACTOR_VERIFIED_COOKIE,
    createTwoFactorVerifiedCookieValue,
    twoFactorVerifiedCookieOptions,
} from "@/lib/security/two-factor-cookie";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, twoFactorVerifyLoginSchema);
        if (!parsed.ok) return parsed.response;
        const { userId, otp } = parsed.data;

        // The verified cookie is bound to a user id, so it may only be issued
        // for the user who is actually signed in on this browser. The device is
        // not verified yet, so pending 2FA must be allowed for this endpoint.
        const authContext = await requireAuthenticatedUser(request, { allowPendingTwoFactor: true });
        if (!("userId" in authContext)) return authContext as Response;
        if (authContext.userId !== userId) {
            return NextResponse.json({ error: "You can only verify your own sign-in." }, { status: 403 });
        }

        const twoFactorService = new TwoFactorService();
        const result = await twoFactorService.verifyOTP(userId, otp, { enableOnSuccess: false });

        if (!result.success) {
            return NextResponse.json(
                {
                    error: result.error,
                    code: result.code,
                    remainingAttempts: result.remainingAttempts,
                },
                { status: 400 }
            );
        }

        const response = NextResponse.json({
            success: true,
            message: "Two-factor verification successful.",
        });

        // Clear the pending 2FA cookie now that verification is complete
        response.cookies.set(TWO_FACTOR_PENDING_COOKIE, "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 0,
            expires: new Date(0),
        });

        // Issue the signed verified-device cookie for this user. The signature is
        // what the middleware and API guard check; a bare user id is rejected.
        response.cookies.set(
            TWO_FACTOR_VERIFIED_COOKIE,
            await createTwoFactorVerifiedCookieValue(userId),
            twoFactorVerifiedCookieOptions(),
        );

        return response;
    } catch (err: any) {
        console.error("[2FA Verify Login] Error:", err);
        return NextResponse.json(
            { error: "Failed to verify two-factor code" },
            { status: 500 }
        );
    }
}
