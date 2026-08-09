/**
 * ReactionService — handles post emoji/like reactions.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CommunityReactionType } from "./community.types";

export class ReactionService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Toggle a reaction on a post for a user.
   * If the user already reacted with the same type, removes it.
   * If the user reacted with a different type or has not reacted, sets the new reaction.
   *
   * @param postId - Post ID.
   * @param userId - User ID reacting.
   * @param reactionType - Reaction type ("like" | "heart" | "thumbs_up" | etc.).
   * @returns Object describing action ("added" | "removed" | "updated") and new state.
   */
  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: CommunityReactionType,
  ): Promise<{ action: "added" | "removed" | "updated"; reactionType: CommunityReactionType | null }> {
    const { data: existing } = await (this.supabase as any)
      .from("community_reactions")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.reaction_type === reactionType) {
        await (this.supabase as any)
          .from("community_reactions")
          .delete()
          .eq("id", existing.id);
        return { action: "removed", reactionType: null };
      } else {
        await (this.supabase as any)
          .from("community_reactions")
          .update({ reaction_type: reactionType })
          .eq("id", existing.id);
        return { action: "updated", reactionType };
      }
    }

    await (this.supabase as any)
      .from("community_reactions")
      .insert({
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType,
      });

    return { action: "added", reactionType };
  }
}
