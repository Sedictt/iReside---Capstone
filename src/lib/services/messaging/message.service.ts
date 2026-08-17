/**
 * MessageService — handles message queries, delivery, redaction/moderation checks, and read state.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json, MessageType } from "@/types/database";
import type { MessageRow, SendMessageInput } from "./messaging.types";
import { MessagingValidationError } from "./messaging.errors";

export class MessageService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch all messages within a conversation ordered chronologically.
   *
   * @param conversationId - Conversation record ID.
   * @param limit - Maximum messages to retrieve.
   * @returns Array of MessageRow items.
   */
  async getMessages(conversationId: string, limit = 100): Promise<MessageRow[]> {
    const { data: messages, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load messages: ${error.message}`);
    }

    return messages ?? [];
  }

  /**
   * Send a new message in a conversation.
   *
   * @param input - Message creation payload.
   * @returns Created MessageRow record.
   */
  async sendMessage(input: SendMessageInput): Promise<MessageRow> {
    if (!input.content?.trim() && (!input.type || input.type === "text")) {
      throw new MessagingValidationError("Message content cannot be empty.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: message, error: insertError } = await this.supabase
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content.trim(),
        type: input.type ?? "text",
        metadata: (input.metadata ?? {}) as Json,
        created_at: currentTimestamp,
      })
      .select("*")
      .single();

    if (insertError || !message) {
      throw new Error(`Failed to send message: ${insertError?.message}`);
    }

    // Touch conversation updated_at
    await this.supabase
      .from("conversations")
      .update({ updated_at: currentTimestamp })
      .eq("id", input.conversationId);

    return message;
  }

  /**
   * Mark all unread messages in a conversation as read by the user.
   *
   * @param conversationId - Conversation record ID.
   * @param readerUserId - Current authenticated user ID.
   */
  async markMessagesAsRead(conversationId: string, readerUserId: string): Promise<void> {
    const currentTimestamp = new Date().toISOString();

    await this.supabase
      .from("messages")
      .update({ read_at: currentTimestamp })
      .eq("conversation_id", conversationId)
      .neq("sender_id", readerUserId)
      .is("read_at", null);
  }

  /**
   * Get total unread message count across all conversations for a user.
   *
   * @param userId - User ID.
   * @returns Total unread count.
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const { data: userConvs, error: convError } = await this.supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (convError || !userConvs || userConvs.length === 0) {
      return 0;
    }

    const conversationIds = userConvs.map((c) => c.conversation_id);

    const { count, error } = await this.supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count ?? 0;
  }
}
