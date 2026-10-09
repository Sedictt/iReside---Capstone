import { NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { twoFactorVerifyLoginSchema } from "@/lib/validation/schemas/account.schema";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, twoFactorVerifyLoginSchema);
        if (!parsed.ok) return parsed.response;
        const { userId, otp } = parsed.data;

        // The verified cookie is bound to a user id, so it may only be issued
        // for the user who is actually signed in on this browser.
        const authContext = await requireAuthenticatedUser(request);
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
        response.cookies.set("ireside_2fa_pending", "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 0,
            expires: new Date(0),
        });

        // Issue verified 2FA cookie for this user session
        response.cookies.set("ireside_2fa_verified", userId, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            secure: process.env.NODE_ENV === "production",
        });

        return response;
    } catch (err: any) {
        console.error("[2FA Verify Login] Error:", err);
        return NextResponse.json(
            { error: "Failed to verify two-factor code" },
            { status: 500 }
        );
    }
}
