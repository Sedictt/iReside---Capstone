/**
 * ModerationService — handles post approval and reports for property moderation.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CommunityPost, CommunityReportReason } from "./community.types";
import { mapPostToDomain } from "./post.service";
import { CommunityValidationError, PostNotFoundError } from "./community.errors";

export class ModerationService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch unapproved resident posts pending moderation by landlord.
   *
   * @param propertyId - Property ID.
   * @param limit - Maximum posts to retrieve.
   * @returns Array of CommunityPost items.
   */
  async getPendingResidentPosts(propertyId: string, limit = 20): Promise<CommunityPost[]> {
    const { data, error } = await (this.supabase as any)
      .from("community_posts")
      .select(`
        id,
        property_id,
        author_id,
        author_role,
        type,
        title,
        content,
        metadata,
        is_pinned,
        is_moderated,
        is_approved,
        status,
        view_count,
        created_at,
        updated_at,
        profiles!community_posts_author_id_fkey(full_name, avatar_url, avatar_bg_color),
        community_reactions(reaction_type, user_id),
        community_comments(id),
        community_poll_votes(option_index, user_id),
        community_albums(
          id,
          cover_photo_url,
          photo_count,
          community_photos(id, url)
        )
      `)
      .eq("property_id", propertyId)
      .eq("author_role", "tenant")
      .eq("is_approved", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load pending moderation posts: ${error.message}`);
    }

    return (data || []).map((row: any) => mapPostToDomain(row, ""));
  }

  /**
   * Approve or reject a resident post.
   *
   * @param postId - Post ID.
   * @param approved - True to publish and approve; false to reject/archive.
   */
  async approveResidentPost(postId: string, approved = true): Promise<void> {
    const { data: post, error: fetchError } = await (this.supabase as any)
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError || !post) {
      throw new PostNotFoundError(postId);
    }

    const { error: updateError } = await (this.supabase as any)
      .from("community_posts")
      .update({
        is_approved: approved,
        is_moderated: true,
        status: approved ? "published" : "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Failed to update post moderation: ${updateError.message}`);
    }
  }

  /**
   * Submit a report against a community post.
   *
   * @param postId - Post ID being reported.
   * @param reporterUserId - User ID reporting.
   * @param reason - Reason for reporting.
   */
  async reportPost(
    postId: string,
    reporterUserId: string,
    reason: CommunityReportReason,
  ): Promise<{ id: string }> {
    if (!reason?.trim()) {
      throw new CommunityValidationError("Report reason is required.");
    }

    const { data, error } = await (this.supabase as any)
      .from("community_reports")
      .insert({
        post_id: postId,
        reporter_id: reporterUserId,
        reason: reason.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to submit report: ${error?.message}`);
    }

    return { id: data.id };
  }
}
