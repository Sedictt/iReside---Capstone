/**
 * PostService — handles post lifecycle, feed queries, bookmarks, and views.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  CommunityPost,
  CreatePostInput,
  PostRowWithRelations,
} from "./community.types";
import {
  CommunityAccessError,
  CommunityValidationError,
  PostNotFoundError,
} from "./community.errors";

export function mapPostToDomain(row: PostRowWithRelations, userId: string): CommunityPost {
  const reactions = (row.community_reactions || []).reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const pollVotes = row.community_poll_votes || [];
  const userVote = pollVotes.find((vote) => vote.user_id === userId)?.option_index ?? null;

  return {
    id: row.id,
    property_id: row.property_id,
    author_id: row.author_id,
    author_role: row.author_role,
    type: row.type,
    title: row.title,
    content: row.content,
    metadata: row.metadata,
    is_pinned: Boolean(row.is_pinned),
    is_moderated: Boolean(row.is_moderated),
    is_approved: Boolean(row.is_approved),
    status: row.status || "published",
    view_count: row.view_count || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: row.profiles?.full_name || "Unknown",
    author_avatar: row.profiles?.avatar_url || null,
    author_avatar_bg_color: row.profiles?.avatar_bg_color || null,
    reactions,
    userReactions: (row.community_reactions || [])
      .filter((reaction) => reaction.user_id === userId)
      .map((reaction) => ({ reaction_type: reaction.reaction_type })),
    commentCount: row.community_comments?.length || 0,
    pollVotes,
    userPollVote: userVote,
    album: row.community_albums
      ? {
          id: row.community_albums.id,
          cover_photo_url: row.community_albums.cover_photo_url,
          photo_count: row.community_albums.photo_count || 0,
          photos: (row.community_albums.community_photos || []).map((p) => ({
            id: p.id,
            url: p.url,
          })),
        }
      : null,
  };
}

export class PostService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch a paginated feed of approved community posts for a property.
   *
   * @param propertyId - Property ID to fetch posts for.
   * @param viewerUserId - Current user ID for reaction and vote state mapping.
   * @param limit - Maximum posts to retrieve.
   * @param cursor - Pagination cursor (created_at timestamp).
   * @returns Array of CommunityPost domain items.
   */
  async getPosts(
    propertyId: string,
    viewerUserId: string,
    limit = 20,
    cursor?: string,
  ): Promise<CommunityPost[]> {
    let query = (this.supabase as any)
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
      .eq("status", "published")
      .eq("is_approved", true);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load community posts: ${error.message}`);
    }

    return (data || []).map((row: any) => mapPostToDomain(row, viewerUserId));
  }

  /**
   * Create a new community post.
   *
   * @param input - Post creation input.
   * @returns Created post ID.
   */
  async createPost(input: CreatePostInput): Promise<{ id: string }> {
    if (!input.title?.trim()) {
      throw new CommunityValidationError("Title is required.");
    }

    const isApproved = input.isApproved ?? (input.authorRole === "landlord");

    const { data, error } = await (this.supabase as any)
      .from("community_posts")
      .insert({
        property_id: input.propertyId,
        author_id: input.authorId,
        author_role: input.authorRole,
        type: input.type,
        title: input.title.trim(),
        content: input.content.trim(),
        metadata: input.metadata || {},
        is_approved: isApproved,
        status: "published",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create community post: ${error?.message}`);
    }

    return { id: data.id };
  }

  /**
   * Update an existing post owned by the author.
   *
   * @param postId - Post ID.
   * @param authorId - Author ID for permission verification.
   * @param input - Fields to update.
   */
  async updatePost(
    postId: string,
    authorId: string,
    input: { title?: string; content?: string },
  ): Promise<void> {
    const { data: post, error: fetchError } = await (this.supabase as any)
      .from("community_posts")
      .select("id, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError || !post) {
      throw new PostNotFoundError(postId);
    }

    if (post.author_id !== authorId) {
      throw new CommunityAccessError("You can only edit your own posts.");
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.content !== undefined) updatePayload.content = input.content.trim();

    const { error: updateError } = await (this.supabase as any)
      .from("community_posts")
      .update(updatePayload)
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Failed to update post: ${updateError.message}`);
    }
  }

  /**
   * Delete an existing post owned by the author.
   *
   * @param postId - Post ID.
   * @param authorId - Author ID.
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    const { data: post, error: fetchError } = await (this.supabase as any)
      .from("community_posts")
      .select("id, author_id")
      .eq("id", postId)
      .maybeSingle();

    if (fetchError || !post) {
      throw new PostNotFoundError(postId);
    }

    if (post.author_id !== authorId) {
      throw new CommunityAccessError("You can only delete your own posts.");
    }

    const { error: deleteError } = await (this.supabase as any)
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      throw new Error(`Failed to delete post: ${deleteError.message}`);
    }
  }

  /**
   * Record a post view count increment.
   *
   * @param postId - Post ID.
   * @param viewerUserId - User viewing the post.
   */
  async recordPostView(postId: string, viewerUserId: string): Promise<void> {
    await (this.supabase as any).rpc("increment_post_view_count", {
      post_id: postId,
      viewer_id: viewerUserId,
    });
  }

  /**
   * Toggle pinned state on a post (landlord / management feature).
   *
   * @param postId - Post ID.
   * @returns Updated pinned state.
   */
  async togglePinPost(postId: string): Promise<{ isPinned: boolean }> {
    const { data: post, error: fetchError } = await (this.supabase as any)
      .from("community_posts")
      .select("id, is_pinned")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new PostNotFoundError(postId);
    }

    const nextPinned = !post.is_pinned;

    const { error: updateError } = await (this.supabase as any)
      .from("community_posts")
      .update({ is_pinned: nextPinned, updated_at: new Date().toISOString() })
      .eq("id", postId);

    if (updateError) {
      throw new Error(`Failed to toggle pinned status: ${updateError.message}`);
    }

    return { isPinned: nextPinned };
  }

  /**
   * Toggle saved bookmark on a post for a user.
   *
   * @param postId - Post ID.
   * @param userId - User ID bookmarking.
   * @returns Saved state.
   */
  async toggleSavePost(postId: string, userId: string): Promise<{ saved: boolean }> {
    const { data: existing } = await (this.supabase as any)
      .from("community_saved_posts")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await (this.supabase as any)
        .from("community_saved_posts")
        .delete()
        .eq("id", existing.id);
      return { saved: false };
    }

    await (this.supabase as any)
      .from("community_saved_posts")
      .insert({ post_id: postId, user_id: userId });

    return { saved: true };
  }

  /**
   * Get all saved post IDs for a user.
   *
   * @param userId - User ID.
   * @returns Array of post IDs.
   */
  async getSavedPostIds(userId: string): Promise<string[]> {
    const { data, error } = await (this.supabase as any)
      .from("community_saved_posts")
      .select("post_id")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch saved posts: ${error.message}`);
    }

    return (data || []).map((row: any) => row.post_id);
  }
}
