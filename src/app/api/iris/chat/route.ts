import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { IrisService } from "@/lib/services/iris";
import {
    IrisRateLimitError,
    IrisValidationError,
} from "@/lib/services/iris/iris.errors";

export async function POST(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        const body = await request.json();
        const { message } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required and must be a string." },
                { status: 400 }
            );
        }

        const irisService = new IrisService(supabase);
        const result = await irisService.processChatMessage(userId, message);

        return NextResponse.json(result);
    } catch (error: any) {
        if (error instanceof IrisValidationError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof IrisRateLimitError) {
            return NextResponse.json({ error: error.message }, { status: 429 });
        }

        return NextResponse.json(
            { error: error?.message || "An error occurred while processing your request." },
            { status: 500 }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "iRis Chat API",
        version: "1.0.0",
    });
}


