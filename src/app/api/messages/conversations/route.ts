import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { buildConversationSummaries, findDirectConversation } from "@/lib/messages/engine";

type CreateConversationBody = {
    participantIds?: string[];
};

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    try {
        const supabase = createServiceRoleSupabaseClient();
        const conversations = await buildConversationSummaries(supabase, userId);
        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Failed to fetch conversations:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
        });
        const message = error instanceof Error ? error.message : "Failed to fetch conversations.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const body = (await request.json()) as CreateConversationBody;
    const participantIds = Array.isArray(body.participantIds) ? body.participantIds : [];

    const cleanedParticipantIds = Array.from(
        new Set(participantIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id) && id !== userId))
    );

    if (cleanedParticipantIds.length === 0) {
        return NextResponse.json({ error: "At least one participant is required." }, { status: 400 });
    }

    try {
        const supabase = createServiceRoleSupabaseClient();

        if (cleanedParticipantIds.length === 1) {
            const existingConversationId = await findDirectConversation(supabase, userId, cleanedParticipantIds[0]);
            if (existingConversationId) {
                return NextResponse.json({ conversationId: existingConversationId, reused: true });
            }
        }

        // Generate id client-side so we do not need SELECT on the new row.
        // With RLS, selecting a conversation before participants are inserted can fail.
        const conversationId = crypto.randomUUID();

        const { error: conversationError } = await supabase
            .from("conversations")
            .insert({ id: conversationId });

        if (conversationError) {
            console.error("Failed to create conversation:", {
                error: conversationError.message,
                code: conversationError.code,
                details: conversationError.details,
            });
            return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
        }

        const inserts = [userId, ...cleanedParticipantIds].map((participantId) => ({
            conversation_id: conversationId,
            user_id: participantId,
        }));

        const { error: participantsError } = await supabase.from("conversation_participants").insert(inserts);

        if (participantsError) {
            console.error("Failed to add conversation participants:", {
                error: participantsError.message,
                code: participantsError.code,
                details: participantsError.details,
            });
            return NextResponse.json({ error: "Failed to add conversation participants." }, { status: 500 });
        }

        return NextResponse.json({ conversationId, reused: false }, { status: 201 });
    } catch (error) {
        console.error("Failed to create conversation:", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            userId,
        });
        const message = error instanceof Error ? error.message : "Failed to create conversation.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

