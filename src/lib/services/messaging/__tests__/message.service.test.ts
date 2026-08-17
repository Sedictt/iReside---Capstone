import { describe, it, expect, vi, beforeEach } from "vitest";
import { MessageService } from "../message.service";
import { MessagingValidationError } from "../messaging.errors";

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
      chain.neq = vi.fn().mockReturnValue(chain);
      chain.is = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
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

describe("MessageService", () => {
  let service: MessageService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new MessageService(mockSupabase);
  });

  describe("getMessages", () => {
    it("fetches ordered messages for conversation", async () => {
      const mockMessages = [
        { id: "m-1", conversation_id: "conv-1", content: "Hello", sender_id: "user-1" },
      ];

      const chain = getTableChain("messages");
      chain.limit.mockResolvedValue({ data: mockMessages, error: null });

      const result = await service.getMessages("conv-1");
      expect(result).toEqual(mockMessages);
    });
  });

  describe("sendMessage", () => {
    it("inserts message and updates conversation timestamp", async () => {
      const mockMsg = { id: "m-new-1", conversation_id: "conv-1", content: "Test message" };

      const msgChain = getTableChain("messages");
      const convChain = getTableChain("conversations");

      msgChain.single.mockResolvedValue({ data: mockMsg, error: null });

      const result = await service.sendMessage({
        conversationId: "conv-1",
        senderId: "user-1",
        content: "Test message",
      });

      expect(msgChain.insert).toHaveBeenCalled();
      expect(convChain.update).toHaveBeenCalled();
      expect(result).toEqual(mockMsg);
    });

    it("throws MessagingValidationError on empty text content", async () => {
      await expect(
        service.sendMessage({
          conversationId: "conv-1",
          senderId: "user-1",
          content: "   ",
          type: "text",
        }),
      ).rejects.toBeInstanceOf(MessagingValidationError);
    });
  });

  describe("markMessagesAsRead", () => {
    it("updates read_at for unread messages", async () => {
      const chain = getTableChain("messages");

      await service.markMessagesAsRead("conv-1", "user-1");

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ read_at: expect.any(String) }));
      expect(chain.eq).toHaveBeenCalledWith("conversation_id", "conv-1");
      expect(chain.neq).toHaveBeenCalledWith("sender_id", "user-1");
      expect(chain.is).toHaveBeenCalledWith("read_at", null);
    });
  });
});
