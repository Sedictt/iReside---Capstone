import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReactionService } from "../reaction.service";

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

describe("ReactionService", () => {
  let service: ReactionService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new ReactionService(mockSupabase);
  });

  describe("toggleReaction", () => {
    it("adds reaction if none exists", async () => {
      const chain = getTableChain("community_reactions");
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.toggleReaction("post-1", "user-1", "like");

      expect(chain.insert).toHaveBeenCalled();
      expect(result).toEqual({ action: "added", reactionType: "like" });
    });

    it("removes reaction if same reaction exists", async () => {
      const chain = getTableChain("community_reactions");
      chain.maybeSingle.mockResolvedValue({ data: { id: "react-1", reaction_type: "like" }, error: null });

      const result = await service.toggleReaction("post-1", "user-1", "like");

      expect(chain.delete).toHaveBeenCalled();
      expect(result).toEqual({ action: "removed", reactionType: null });
    });

    it("updates reaction if different reaction exists", async () => {
      const chain = getTableChain("community_reactions");
      chain.maybeSingle.mockResolvedValue({ data: { id: "react-1", reaction_type: "like" }, error: null });

      const result = await service.toggleReaction("post-1", "user-1", "heart");

      expect(chain.update).toHaveBeenCalled();
      expect(result).toEqual({ action: "updated", reactionType: "heart" });
    });
  });
});
