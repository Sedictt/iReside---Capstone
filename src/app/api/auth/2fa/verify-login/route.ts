import { NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, otp } = body;

        if (!userId || typeof userId !== "string") {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        if (!otp || typeof otp !== "string") {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
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
            { error: err.message || "Failed to verify two-factor code" },
            { status: 500 }
        );
    }
}
