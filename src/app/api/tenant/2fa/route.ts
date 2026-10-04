import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { TwoFactorService } from "@/lib/services/auth/two-factor.service";

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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    try {
        const body = await request.json();
        const { action } = body;
        const twoFactorService = new TwoFactorService();

        if (action === "send-otp") {
            const result = await twoFactorService.sendOTP(userId, { action: "enable" });
            return NextResponse.json(result);
        }

        if (action === "verify-otp") {
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

        if (action === "disable") {
            const { password } = body;
            const result = await twoFactorService.disable(userId, password);
            if (!result.success) {
                return NextResponse.json({ error: result.error }, { status: 401 });
            }
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        console.error("[Tenant 2FA] Error:", err);
        return NextResponse.json(
            { error: err.message || "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
