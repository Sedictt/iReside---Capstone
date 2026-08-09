import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModerationService } from "../moderation.service";
import { CommunityValidationError, PostNotFoundError } from "../community.errors";

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
      chain.limit = vi.fn().mockReturnValue(chain);
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

describe("ModerationService", () => {
  let service: ModerationService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new ModerationService(mockSupabase);
  });

  describe("approveResidentPost", () => {
    it("approves and publishes post", async () => {
      const chain = getTableChain("community_posts");
      chain.maybeSingle.mockResolvedValue({ data: { id: "post-1" }, error: null });

      await service.approveResidentPost("post-1", true);

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_approved: true, is_moderated: true, status: "published" }),
      );
    });

    it("throws PostNotFoundError if post does not exist", async () => {
      const chain = getTableChain("community_posts");
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.approveResidentPost("missing-post", true)).rejects.toBeInstanceOf(
        PostNotFoundError,
      );
    });
  });

  describe("reportPost", () => {
    it("creates report successfully", async () => {
      const chain = getTableChain("community_reports");
      chain.single.mockResolvedValue({ data: { id: "rep-1" }, error: null });

      const result = await service.reportPost("post-1", "user-1", "Inappropriate content");
      expect(result).toEqual({ id: "rep-1" });
    });

    it("throws CommunityValidationError on empty reason", async () => {
      await expect(service.reportPost("post-1", "user-1", "   ")).rejects.toBeInstanceOf(
        CommunityValidationError,
      );
    });
  });
});
