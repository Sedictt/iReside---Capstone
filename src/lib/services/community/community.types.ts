/**
 * Domain types for Community Service.
 */
import type { Database } from "@/types/database";

export type CommunityPostType = "announcement" | "poll" | "photo_album" | "discussion";
export type CommunityPostStatus = "draft" | "published" | "archived";
export type CommunityReactionType = "like" | "heart" | "thumbs_up" | "clap" | "celebration";
export type CommunityReportReason = string;
export type CommunityRole = "tenant" | "landlord" | "admin";

export interface CommunityPost {
  id: string;
  property_id: string;
  author_id: string;
  author_role: "tenant" | "landlord";
  type: CommunityPostType;
  title: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  is_pinned: boolean;
  is_moderated: boolean;
  is_approved: boolean;
  status: CommunityPostStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  author_avatar_bg_color: string | null;
  reactions: Record<string, number>;
  userReactions: Array<{ reaction_type: string }>;
  commentCount: number;
  pollVotes: Array<{ option_index: number; user_id: string }>;
  userPollVote: number | null;
  album: {
    id: string;
    cover_photo_url: string | null;
    photo_count: number;
    photos: Array<{ id: string; url: string }>;
  } | null;
}

export interface PostRowWithRelations {
  id: string;
  property_id: string;
  author_id: string;
  author_role: "tenant" | "landlord";
  type: "announcement" | "poll" | "photo_album" | "discussion";
  title: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  is_pinned: boolean | null;
  is_moderated: boolean | null;
  is_approved: boolean | null;
  status: CommunityPostStatus | null;
  view_count: number | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name?: string | null; avatar_url?: string | null; avatar_bg_color?: string | null } | null;
  community_reactions?: Array<{ reaction_type: string; user_id: string }> | null;
  community_comments?: Array<{ id: string }> | null;
  community_poll_votes?: Array<{ option_index: number; user_id: string }> | null;
  community_albums?: {
    id: string;
    cover_photo_url: string | null;
    photo_count: number | null;
    community_photos?: Array<{ id: string; url: string }> | null;
  } | null;
}

export interface CreatePostInput {
  propertyId: string;
  authorId: string;
  authorRole: "tenant" | "landlord";
  type: CommunityPostType;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  isApproved?: boolean;
}

export interface CreatePollInput {
  propertyId: string;
  authorId: string;
  authorRole: "tenant" | "landlord";
  title: string;
  content: string;
  options: string[];
  isApproved?: boolean;
}

export interface CreateAlbumInput {
  propertyId: string;
  authorId: string;
  authorRole: "tenant" | "landlord";
  title: string;
  content: string;
  imageUrls: string[];
  isApproved?: boolean;
}

export interface CommentItem {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}
