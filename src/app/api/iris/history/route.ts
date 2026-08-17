import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { IrisService } from "@/lib/services/iris";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? 100);

    try {
        const irisService = new IrisService(supabase);
        const messages = await irisService.getChatHistory(userId, limitParam);

        return NextResponse.json({ messages });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Failed to fetch iRis chat history." },
            { status: 500 }
        );
    }
}

