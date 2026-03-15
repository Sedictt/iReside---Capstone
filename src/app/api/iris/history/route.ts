import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type IrisHistoryRow = {
    id: string;
    role: "user" | "assistant";
    content: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
};

export async function GET(request: Request) {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? 100);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 300) : 100;

    const db = authClient as any;

    const { data, error } = await db
        .from("iris_chat_messages")
        .select("id, role, content, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Failed to fetch iRis history:", error);
        return NextResponse.json({ error: "Failed to fetch iRis chat history." }, { status: 500 });
    }

    return NextResponse.json({
        messages: (data ?? []) as IrisHistoryRow[],
    });
}
