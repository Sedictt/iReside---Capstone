/**
 * CommentService — handles post comments lifecycle and retrieval.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CommentItem } from "./community.types";
import {
  CommunityAccessError,
  CommunityValidationError,
} from "./community.errors";

export class CommentService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Add a comment to a community post.
   *
   * @param postId - Post ID.
   * @param authorId - Comment author ID.
   * @param content - Comment text content.
   * @param parentCommentId - Optional nested parent comment ID.
   * @returns Created comment record.
   */
  async addComment(
    postId: string,
    authorId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<{ id: string }> {
    if (!content?.trim()) {
      throw new CommunityValidationError("Comment content cannot be empty.");
    }

    const { data, error } = await (this.supabase as any)
      .from("community_comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to add comment: ${error?.message}`);
    }

    return { id: data.id };
  }

  /**
   * Fetch all comments for a post ordered chronologically.
   *
   * @param postId - Post ID.
   * @returns Array of CommentItem items.
   */
  async getPostComments(postId: string): Promise<CommentItem[]> {
    const { data, error } = await (this.supabase as any)
      .from("community_comments")
      .select(`
        id,
        post_id,
        author_id,
        content,
        parent_comment_id,
        created_at,
        updated_at,
        profiles!community_comments_author_id_fkey(full_name, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load comments: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      post_id: row.post_id,
      author_id: row.author_id,
      author_name: row.profiles?.full_name || "Unknown",
      author_avatar: row.profiles?.avatar_url || null,
      content: row.content,
      parent_comment_id: row.parent_comment_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Update comment content owned by author.
   *
   * @param commentId - Comment ID.
   * @param authorId - Author ID for permission verification.
   * @param content - New comment text.
   */
  async updateComment(commentId: string, authorId: string, content: string): Promise<void> {
    if (!content?.trim()) {
      throw new CommunityValidationError("Comment content cannot be empty.");
    }

    const { data: comment, error: fetchError } = await (this.supabase as any)
      .from("community_comments")
      .select("id, author_id")
      .eq("id", commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      throw new Error("Comment not found.");
    }

    if (comment.author_id !== authorId) {
      throw new CommunityAccessError("You can only edit your own comments.");
    }

    const { error: updateError } = await (this.supabase as any)
      .from("community_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (updateError) {
      throw new Error(`Failed to update comment: ${updateError.message}`);
    }
  }

  /**
   * Delete comment owned by author.
   *
   * @param commentId - Comment ID.
   * @param authorId - Author ID.
   */
  async deleteComment(commentId: string, authorId: string): Promise<void> {
    const { data: comment, error: fetchError } = await (this.supabase as any)
      .from("community_comments")
      .select("id, author_id")
      .eq("id", commentId)
      .maybeSingle();

    if (fetchError || !comment) {
      throw new Error("Comment not found.");
    }

    if (comment.author_id !== authorId) {
      throw new CommunityAccessError("You can only delete your own comments.");
    }

    const { error: deleteError } = await (this.supabase as any)
      .from("community_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      throw new Error(`Failed to delete comment: ${deleteError.message}`);
    }
  }
}
