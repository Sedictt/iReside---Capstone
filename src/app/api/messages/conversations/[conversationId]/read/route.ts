import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserInConversation } from "@/lib/messages/engine";
import { MessageService } from "@/lib/services/messaging";

export async function PATCH(
    request: Request,
    context: { params: Promise<{ conversationId: string }> }
) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const { conversationId } = await context.params;

    try {
        const supabase = createServiceRoleSupabaseClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, userId);
        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const messageService = new MessageService(supabase);
        await messageService.markMessagesAsRead(conversationId, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to mark conversation as read:", error);
        return NextResponse.json({ error: "Failed to update read status." }, { status: 500 });
    }
}
