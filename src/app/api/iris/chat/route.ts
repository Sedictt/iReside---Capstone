import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { IrisService } from "@/lib/services/iris";
import {
    IrisRateLimitError,
    IrisValidationError,
} from "@/lib/services/iris/iris.errors";
import { parseJsonBody } from "@/lib/validation/server";
import { irisChatSchema } from "@/lib/validation/schemas/operations.schema";

export async function POST(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId, supabase } = authContext;

        const parsed = await parseJsonBody(request, irisChatSchema);
        if (!parsed.ok) return parsed.response;
        const { message } = parsed.data;

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

        console.error("[POST /api/iris/chat]", error);
        return NextResponse.json(
            { error: "An error occurred while processing your request." },
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


