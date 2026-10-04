import { NextResponse } from "next/server";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, resend } = body;

        if (!userId || typeof userId !== "string") {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
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
            { error: err.message || "Failed to initiate two-factor verification" },
            { status: 500 }
        );
    }
}
