import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../notification.service";
import { NotificationValidationError } from "../notification.errors";

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
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.then = (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve);
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("NotificationService", () => {
  let service: NotificationService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new NotificationService(mockSupabase);
  });

  describe("getNotifications", () => {
    it("fetches notifications ordered by created_at descending", async () => {
      const mockNotifications = [
        { id: "n-1", user_id: "user-1", title: "Rent Due", message: "Reminder", read: false },
      ];

      const chain = getTableChain("notifications");
      chain.order.mockResolvedValue({ data: mockNotifications, error: null });

      const result = await service.getNotifications("user-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("notifications");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(result).toEqual(mockNotifications);
    });
  });

  describe("createNotification", () => {
    it("creates a single notification", async () => {
      const mockNotification = { id: "n-1", user_id: "user-1", title: "Notice", message: "Hello" };

      const chain = getTableChain("notifications");
      chain.single.mockResolvedValue({ data: mockNotification, error: null });

      const result = await service.createNotification({
        userId: "user-1",
        type: "announcement",
        title: "Notice",
        message: "Hello",
      });

      expect(chain.insert).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it("throws NotificationValidationError if title is empty", async () => {
      await expect(
        service.createNotification({
          userId: "user-1",
          type: "announcement",
          title: "",
          message: "Hello",
        }),
      ).rejects.toBeInstanceOf(NotificationValidationError);
    });
  });

  describe("createBatchNotifications", () => {
    it("inserts multiple notification rows", async () => {
      const chain = getTableChain("notifications");
      chain.then = (resolve: any) => Promise.resolve({ error: null }).then(resolve);

      await service.createBatchNotifications([
        { userId: "user-1", type: "announcement", title: "Title 1", message: "Msg 1" },
        { userId: "user-2", type: "announcement", title: "Title 2", message: "Msg 2" },
      ]);

      expect(chain.insert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ user_id: "user-1" }),
        expect.objectContaining({ user_id: "user-2" }),
      ]));
    });
  });

  describe("markAsRead", () => {
    it("updates read flag to true", async () => {
      const chain = getTableChain("notifications");

      await service.markAsRead("n-1", "user-1");

      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ read: true }));
      expect(chain.eq).toHaveBeenCalledWith("id", "n-1");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("getUnreadCount", () => {
    it("queries exact head count of unread notifications", async () => {
      const chain = getTableChain("notifications");
      chain.eq.mockReturnValue(chain);
      chain.then = (resolve: any) => Promise.resolve({ count: 4, error: null }).then(resolve);

      const count = await service.getUnreadCount("user-1");
      expect(count).toBe(4);
    });
  });
});
