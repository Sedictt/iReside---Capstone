import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseJsonBody } from "@/lib/validation/server";
import { zUuid } from "@/lib/validation/zod-fields";
import { messageUserActionSchema } from "@/lib/validation/schemas/operations.schema";

type MessageUserAction = "archive" | "unarchive" | "block" | "unblock";

const getStateForAction = (action: MessageUserAction) => {
    switch (action) {
        case "archive":
            return { archived: true };
        case "unarchive":
            return { archived: false };
        case "block":
            return { blocked: true };
        case "unblock":
            return { blocked: false };
    }
};

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

    if (!targetUserId || targetUserId === user.id || !zUuid().safeParse(targetUserId).success) {
        return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
    }

    const parsed = await parseJsonBody(request, messageUserActionSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    try {
        const patch = getStateForAction(body.action);

        const { error } = await supabase
            .from("message_user_actions")
            .upsert(
                {
                    actor_user_id: user.id,
                    target_user_id: targetUserId,
                    ...patch,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "actor_user_id,target_user_id",
                }
            );

        if (error) {
            console.error("Failed to update message user action:", error);
            return NextResponse.json({ error: "Failed to update action." }, { status: 500 });
        }

        const { data: row } = await supabase
            .from("message_user_actions")
            .select("archived, blocked")
            .eq("actor_user_id", user.id)
            .eq("target_user_id", targetUserId)
            .maybeSingle();

        return NextResponse.json({
            action: body.action,
            state: {
                archived: Boolean(row?.archived),
                blocked: Boolean(row?.blocked),
            },
        });
    } catch (error) {
        console.error("Failed to update message user action:", error);
        return NextResponse.json({ error: "Failed to update action." }, { status: 500 });
    }
}
