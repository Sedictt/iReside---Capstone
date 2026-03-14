import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildConversationSummaries, findDirectConversation } from "@/lib/messages/engine";

type CreateConversationBody = {
    participantIds?: string[];
};

export async function GET() {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const conversations = await buildConversationSummaries(supabase, user.id);
        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Failed to fetch conversations:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch conversations.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateConversationBody;
    const participantIds = Array.isArray(body.participantIds) ? body.participantIds : [];

    const cleanedParticipantIds = Array.from(
        new Set(participantIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id) && id !== user.id))
    );

    if (cleanedParticipantIds.length === 0) {
        return NextResponse.json({ error: "At least one participant is required." }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();

        if (cleanedParticipantIds.length === 1) {
            const existingConversationId = await findDirectConversation(supabase, user.id, cleanedParticipantIds[0]);
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
            return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
        }

        const inserts = [user.id, ...cleanedParticipantIds].map((participantId) => ({
            conversation_id: conversationId,
            user_id: participantId,
        }));

        const { error: participantsError } = await supabase.from("conversation_participants").insert(inserts);

        if (participantsError) {
            return NextResponse.json({ error: "Failed to add conversation participants." }, { status: 500 });
        }

        return NextResponse.json({ conversationId, reused: false }, { status: 201 });
    } catch (error) {
        console.error("Failed to create conversation:", error);
        const message = error instanceof Error ? error.message : "Failed to create conversation.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
