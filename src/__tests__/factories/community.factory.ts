/**
 * Community test factory.
 *
 * @module __tests__/factories/community.factory
 */
import type { Database } from "@/types/database";

export type CommunityPostRow = Database["public"]["Tables"]["community_posts"]["Row"];
export type CommunityCommentRow = Database["public"]["Tables"]["community_comments"]["Row"];

export function buildCommunityPost(
  overrides: Partial<CommunityPostRow> = {},
): CommunityPostRow {
  return {
    id: "post-123",
    author_id: "user-123",
    property_id: "property-123",
    title: "Community BBQ Event",
    content: "Join us this Saturday for a community barbecue at the rooftop garden!",
    type: "announcement",
    images: [],
    pinned: false,
    like_count: 5,
    comment_count: 2,
    status: "published",
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}

export function buildComment(
  overrides: Partial<CommunityCommentRow> = {},
): CommunityCommentRow {
  return {
    id: "comment-123",
    post_id: "post-123",
    author_id: "user-456",
    content: "Sounds great! Will be there.",
    created_at: new Date("2026-01-01T01:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T01:00:00Z").toISOString(),
    ...overrides,
  };
}
