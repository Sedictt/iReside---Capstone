/**
 * PollService — handles voting on poll posts.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CommunityValidationError, PostNotFoundError } from "./community.errors";

export class PollService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Cast or change a vote on a poll post.
   *
   * @param postId - Poll post ID.
   * @param userId - User ID casting vote.
   * @param optionIndex - Selected option index (0-based).
   * @returns Object containing user's recorded vote and poll votes array.
   */
  async votePoll(
    postId: string,
    userId: string,
    optionIndex: number,
  ): Promise<{ optionIndex: number; votes: Array<{ option_index: number; user_id: string }> }> {
    const { data: post, error: fetchError } = await (this.supabase as any)
      .from("community_posts")
      .select("id, type, metadata")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError || !post) {
      throw new PostNotFoundError(postId);
    }

    if (post.type !== "poll") {
      throw new CommunityValidationError("Post is not a poll.");
    }

    const options = (post.metadata?.options as string[]) || [];
    if (optionIndex < 0 || optionIndex >= options.length) {
      throw new CommunityValidationError("Invalid option index for poll.");
    }

    const { data: existingVote } = await (this.supabase as any)
      .from("community_poll_votes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingVote) {
      await (this.supabase as any)
        .from("community_poll_votes")
        .update({ option_index: optionIndex })
        .eq("id", existingVote.id);
    } else {
      await (this.supabase as any)
        .from("community_poll_votes")
        .insert({
          post_id: postId,
          user_id: userId,
          option_index: optionIndex,
        });
    }

    const { data: allVotes } = await (this.supabase as any)
      .from("community_poll_votes")
      .select("option_index, user_id")
      .eq("post_id", postId);

    return {
      optionIndex,
      votes: allVotes || [],
    };
  }
}
