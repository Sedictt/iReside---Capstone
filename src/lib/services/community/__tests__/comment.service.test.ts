import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommentService } from "../comment.service";
import { CommunityAccessError, CommunityValidationError } from "../community.errors";

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
      chain.order = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("CommentService", () => {
  let service: CommentService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new CommentService(mockSupabase);
  });

  describe("addComment", () => {
    it("inserts and returns comment id", async () => {
      const chain = getTableChain("community_comments");
      chain.single.mockResolvedValue({ data: { id: "comm-1" }, error: null });

      const result = await service.addComment("post-1", "user-1", "Great announcement!");
      expect(result).toEqual({ id: "comm-1" });
    });

    it("throws CommunityValidationError if content is empty", async () => {
      await expect(service.addComment("post-1", "user-1", "   ")).rejects.toBeInstanceOf(
        CommunityValidationError,
      );
    });
  });

  describe("getPostComments", () => {
    it("fetches and maps comments", async () => {
      const mockCommentRow = {
        id: "comm-1",
        post_id: "post-1",
        author_id: "user-1",
        content: "Awesome!",
        parent_comment_id: null,
        created_at: "2026-08-01",
        updated_at: "2026-08-01",
        profiles: { full_name: "Tenant A", avatar_url: null },
      };

      const chain = getTableChain("community_comments");
      chain.order.mockResolvedValue({ data: [mockCommentRow], error: null });

      const result = await service.getPostComments("post-1");
      expect(result).toHaveLength(1);
      expect(result[0].author_name).toBe("Tenant A");
    });
  });

  describe("deleteComment", () => {
    it("deletes comment when user is author", async () => {
      const chain = getTableChain("community_comments");
      chain.maybeSingle.mockResolvedValue({ data: { id: "comm-1", author_id: "user-1" }, error: null });

      await service.deleteComment("comm-1", "user-1");
      expect(chain.delete).toHaveBeenCalled();
    });

    it("throws CommunityAccessError when user is not author", async () => {
      const chain = getTableChain("community_comments");
      chain.maybeSingle.mockResolvedValue({ data: { id: "comm-1", author_id: "other-user" }, error: null });

      await expect(service.deleteComment("comm-1", "user-1")).rejects.toBeInstanceOf(
        CommunityAccessError,
      );
    });
  });
});
