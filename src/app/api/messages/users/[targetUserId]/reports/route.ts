import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReportBody = {
    conversationId?: string | null;
    category?: string;
    details?: string;
};

const MAX_DETAILS_LENGTH = 3000;

export async function POST(
    request: Request,
    context: { params: Promise<{ targetUserId: string }> }
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await context.params;

    if (!targetUserId || targetUserId === user.id) {
        return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as ReportBody | null;
    const category = (body?.category ?? "").trim();
    const details = (body?.details ?? "").trim();

    if (!category) {
        return NextResponse.json({ error: "Report category is required." }, { status: 400 });
    }

    if (details.length < 10) {
        return NextResponse.json({ error: "Please provide at least 10 characters of details." }, { status: 400 });
    }

    if (details.length > MAX_DETAILS_LENGTH) {
        return NextResponse.json({ error: "Report details are too long." }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from("message_user_reports")
            .insert({
                reporter_user_id: user.id,
                target_user_id: targetUserId,
                conversation_id: body?.conversationId ?? null,
                category,
                details,
                metadata: {
                    source: "messages_quick_action_wizard",
                },
            })
            .select("id, status, created_at")
            .single();

        if (error) {
            console.error("Failed to submit message user report:", error);
            return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
        }

        return NextResponse.json({
            report: {
                id: data.id,
                status: data.status,
                createdAt: data.created_at,
            },
        });
    } catch (error) {
        console.error("Failed to submit message user report:", error);
        return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
    }
}
