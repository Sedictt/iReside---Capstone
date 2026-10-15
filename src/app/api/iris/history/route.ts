import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { IrisService } from "@/lib/services/iris";
import { parseSearchParams } from "@/lib/validation/server";
import { irisHistoryQuerySchema } from "@/lib/validation/schemas/operations.schema";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const parsedQuery = parseSearchParams(new URL(request.url).searchParams, irisHistoryQuerySchema);
    if (!parsedQuery.ok) return parsedQuery.response;
    const limitParam = parsedQuery.data.limit;

    try {
        const irisService = new IrisService(supabase);
        const messages = await irisService.getChatHistory(userId, limitParam);

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error("[GET /api/iris/history]", error);
        return NextResponse.json(
            { error: "Failed to fetch iRis chat history." },
            { status: 500 }
        );
    }
}

