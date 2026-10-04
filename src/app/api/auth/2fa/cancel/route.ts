import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({
        success: true,
        message: "Two-factor verification challenge cancelled.",
    });

    // Clear the pending and verified 2FA cookies
    response.cookies.set("ireside_2fa_pending", "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0,
        expires: new Date(0),
    });

    response.cookies.set("ireside_2fa_verified", "", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0,
        expires: new Date(0),
    });

    return response;
}
