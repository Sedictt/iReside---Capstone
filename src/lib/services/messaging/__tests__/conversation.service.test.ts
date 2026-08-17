import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConversationService } from "../conversation.service";

vi.mock("@/lib/messages/engine", () => ({
  buildConversationSummaries: vi.fn(),
}));

function createMockSupabase() {
  const tableChains: Record<string, any> = {};

  function getTableChain(tableName: string) {
    if (!tableChains[tableName]) {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
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

describe("ConversationService", () => {
  let service: ConversationService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new ConversationService(mockSupabase);
  });

  describe("getConversations", () => {
    it("delegates to buildConversationSummaries", async () => {
      const { buildConversationSummaries } = await import("@/lib/messages/engine");
      const mockResult = [{ id: "conv-1", unreadCount: 0 }];
      vi.mocked(buildConversationSummaries).mockResolvedValue(mockResult as any);

      const result = await service.getConversations("user-1");

      expect(buildConversationSummaries).toHaveBeenCalledWith(mockSupabase, "user-1");
      expect(result).toEqual(mockResult);
    });
  });

  describe("getOrCreateDirectConversation", () => {
    it("creates a new conversation when none exists", async () => {
      const partChain = getTableChain("conversation_participants");
      const convChain = getTableChain("conversations");

      partChain.eq.mockResolvedValue({ data: [], error: null });
      convChain.single.mockResolvedValue({ data: { id: "conv-new-1" }, error: null });
      partChain.insert.mockResolvedValue({ error: null });

      const convId = await service.getOrCreateDirectConversation("user-1", "user-2");

      expect(convId).toBe("conv-new-1");
      expect(convChain.insert).toHaveBeenCalled();
      expect(partChain.insert).toHaveBeenCalledWith([
        { conversation_id: "conv-new-1", user_id: "user-1" },
        { conversation_id: "conv-new-1", user_id: "user-2" },
      ]);
    });
  });

  describe("setArchivedStatus", () => {
    it("updates participant is_archived state", async () => {
      const partChain = getTableChain("conversation_participants");
      partChain.eq.mockReturnValue(partChain);

      await service.setArchivedStatus("conv-1", "user-1", true);

      expect(partChain.update).toHaveBeenCalledWith({ is_archived: true });
    });
  });
});
