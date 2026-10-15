import { NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { parseJsonBody } from "@/lib/validation/server";
import { twoFactorChallengeSchema } from "@/lib/validation/schemas/account.schema";

export async function POST(request: Request) {
    try {
        const parsed = await parseJsonBody(request, twoFactorChallengeSchema);
        if (!parsed.ok) return parsed.response;
        const { userId, resend } = parsed.data;

        // The challenge runs right after password sign-in, so a session exists.
        // Only the signed-in user may trigger (and receive) their own login code.
        // The device is not verified yet at this point, so pending 2FA is allowed here.
        const authContext = await requireAuthenticatedUser(request, { allowPendingTwoFactor: true });
        if (!("userId" in authContext)) return authContext as Response;
        if (authContext.userId !== userId) {
            return NextResponse.json({ error: "You can only verify your own sign-in." }, { status: 403 });
        }

        const twoFactorService = new TwoFactorService();
        const status = await twoFactorService.getStatus(userId);

        if (!status.enabled) {
            return NextResponse.json({ required: false });
        }

        const sendResult = await twoFactorService.sendOTP(userId, { action: "login" });

        const response = NextResponse.json({
            required: true,
            email: sendResult.email,
            userId,
            message: resend ? "A fresh verification code has been dispatched." : "Verification code dispatched.",
        });

        // Set HttpOnly pending cookie so middleware enforces 2FA verification
        response.cookies.set("ireside_2fa_pending", "true", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 600, // 10 minutes
            secure: process.env.NODE_ENV === "production",
        });

        // Ensure any previous verified cookie is cleared while challenge is active
        response.cookies.set("ireside_2fa_verified", "", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 0,
            expires: new Date(0),
        });

        return response;
    } catch (err: any) {
        console.error("[2FA Challenge] Error:", err);
        return NextResponse.json(
            { error: "Failed to initiate two-factor verification" },
            { status: 500 }
        );
    }
}
