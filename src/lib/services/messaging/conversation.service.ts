/**
 * ConversationService — manages conversations, participant relationships, and statuses.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildConversationSummaries } from "@/lib/messages/engine";
import type { ConversationSummary } from "./messaging.types";
import { ConversationNotFoundError, MessagingAccessError } from "./messaging.errors";

export class ConversationService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch all enriched conversation summaries for a user.
   *
   * @param userId - Current authenticated user ID.
   * @returns Array of ConversationSummary items.
   */
  async getConversations(userId: string): Promise<ConversationSummary[]> {
    return (await buildConversationSummaries(this.supabase, userId)) as ConversationSummary[];
  }


  /**
   * Fetch a single conversation by ID with participant access verification.
   *
   * @param conversationId - Conversation record ID.
   * @param userId - User ID requesting access.
   * @returns ConversationSummary or null.
   */
  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationSummary | null> {
    const conversations = await this.getConversations(userId);
    return conversations.find((c) => c.id === conversationId) ?? null;
  }

  /**
   * Create or locate an existing direct 1-on-1 conversation between two users.
   *
   * @param creatorId - Authenticated creator ID.
   * @param recipientId - Partner user ID.
   * @returns Conversation ID.
   */
  async getOrCreateDirectConversation(creatorId: string, recipientId: string): Promise<string> {
    // 1. Check if direct conversation already exists
    const { data: existingParticipants } = await this.supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", creatorId);

    const candidateConversationIds = (existingParticipants || []).map((p) => p.conversation_id);

    if (candidateConversationIds.length > 0) {
      const { data: matchingPartners } = await this.supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", recipientId)
        .in("conversation_id", candidateConversationIds);

      if (matchingPartners && matchingPartners.length > 0) {
        return matchingPartners[0].conversation_id;
      }
    }

    // 2. Create new conversation
    const { data: newConv, error: convError } = await this.supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single();

    if (convError || !newConv) {
      throw new Error(`Failed to create conversation: ${convError?.message}`);
    }

    // 3. Add participants
    const { error: partError } = await this.supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: newConv.id, user_id: creatorId },
        { conversation_id: newConv.id, user_id: recipientId },
      ]);

    if (partError) {
      throw new Error(`Failed to add participants: ${partError.message}`);
    }

    return newConv.id;
  }

  /**
   * Archive or unarchive a conversation for a specific user.
   *
   * @param conversationId - Conversation ID.
   * @param userId - User ID archiving.
   * @param isArchived - Boolean archive state.
   */
  async setArchivedStatus(
    conversationId: string,
    userId: string,
    isArchived: boolean,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("conversation_participants")
      .update({ is_archived: isArchived } as any)
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update archive status: ${error.message}`);
    }
  }

  /**
   * Block or unblock a conversation for a specific user.
   *
   * @param conversationId - Conversation ID.
   * @param userId - User ID blocking.
   * @param isBlocked - Boolean block state.
   */
  async setBlockedStatus(
    conversationId: string,
    userId: string,
    isBlocked: boolean,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("conversation_participants")
      .update({ is_blocked: isBlocked } as any)
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update blocked status: ${error.message}`);
    }
  }
}
