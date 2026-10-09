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
        console.error("[Tenant 2FA] Error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
