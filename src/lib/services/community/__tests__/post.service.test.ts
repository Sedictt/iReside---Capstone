import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostService } from "../post.service";
import { CommunityAccessError, CommunityValidationError, PostNotFoundError } from "../community.errors";

function createMockSupabase() {
  const tableChains: Record<string, any> = {};

  function getTableChain(tableName: string) {
    if (!tableChains[tableName]) {
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.lt = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("PostService", () => {
  let service: PostService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new PostService(mockSupabase);
  });

  describe("getPosts", () => {
    it("retrieves published and approved posts for a property", async () => {
      const mockPost = {
        id: "post-1",
        property_id: "prop-1",
        author_id: "user-1",
        author_role: "landlord",
        type: "announcement",
        title: "Maintenance Notice",
        content: "Water shutdown tomorrow.",
        metadata: {},
        is_pinned: false,
        is_moderated: true,
        is_approved: true,
        status: "published",
        view_count: 5,
        created_at: "2026-08-01T12:00:00Z",
        updated_at: "2026-08-01T12:00:00Z",
        profiles: { full_name: "Admin User", avatar_url: null, avatar_bg_color: null },
        community_reactions: [{ reaction_type: "like", user_id: "user-2" }],
        community_comments: [{ id: "c-1" }],
        community_poll_votes: [],
        community_albums: null,
      };

      const chain = getTableChain("community_posts");
      chain.limit.mockResolvedValue({ data: [mockPost], error: null });

      const posts = await service.getPosts("prop-1", "user-2");

      expect(posts).toHaveLength(1);
      expect(posts[0].title).toBe("Maintenance Notice");
      expect(posts[0].reactions.like).toBe(1);
      expect(posts[0].userReactions).toHaveLength(1);
      expect(posts[0].commentCount).toBe(1);
    });
  });

  describe("createPost", () => {
    it("creates post successfully", async () => {
      const chain = getTableChain("community_posts");
      chain.single.mockResolvedValue({ data: { id: "new-post-1" }, error: null });

      const result = await service.createPost({
        propertyId: "prop-1",
        authorId: "user-1",
        authorRole: "landlord",
        type: "announcement",
        title: "New Post",
        content: "Hello residents",
      });

      expect(result).toEqual({ id: "new-post-1" });
    });

    it("throws CommunityValidationError on empty title", async () => {
      await expect(
        service.createPost({
          propertyId: "prop-1",
          authorId: "user-1",
          authorRole: "tenant",
          type: "discussion",
          title: "",
          content: "Hello",
        }),
      ).rejects.toBeInstanceOf(CommunityValidationError);
    });
  });

  describe("updatePost", () => {
    it("updates post when author matches", async () => {
      const chain = getTableChain("community_posts");
      chain.maybeSingle.mockResolvedValue({ data: { id: "post-1", author_id: "user-1" }, error: null });

      await service.updatePost("post-1", "user-1", { title: "Updated Title" });

      expect(chain.update).toHaveBeenCalled();
    });

    it("throws CommunityAccessError when user is not the author", async () => {
      const chain = getTableChain("community_posts");
      chain.maybeSingle.mockResolvedValue({ data: { id: "post-1", author_id: "other-user" }, error: null });

      await expect(
        service.updatePost("post-1", "user-1", { title: "Updated Title" }),
      ).rejects.toBeInstanceOf(CommunityAccessError);
    });
  });

  describe("togglePinPost", () => {
    it("toggles pinned status from false to true", async () => {
      const chain = getTableChain("community_posts");
      chain.single.mockResolvedValue({ data: { id: "post-1", is_pinned: false }, error: null });

      const result = await service.togglePinPost("post-1");
      expect(result).toEqual({ isPinned: true });
    });
  });
});
