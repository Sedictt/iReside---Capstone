import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../auth.service";
import { UserAccessError } from "../user.errors";

describe("AuthService", () => {
  let service: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signOut: vi.fn(),
      },
    };
    service = new AuthService(mockSupabase);
  });

  describe("getSession", () => {
    it("returns active session", async () => {
      const mockSession = { user: { id: "user-1" }, access_token: "token-123" };
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const result = await service.getSession();
      expect(result).toEqual(mockSession);
    });
  });

  describe("requireUser", () => {
    it("returns user if authenticated", async () => {
      const mockUser = { id: "user-1", email: "test@example.com" };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await service.requireUser();
      expect(result).toEqual(mockUser);
    });

    it("throws UserAccessError if not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

      await expect(service.requireUser()).rejects.toBeInstanceOf(UserAccessError);
    });
  });

  describe("signOut", () => {
    it("signs out successfully", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await expect(service.signOut()).resolves.toBeUndefined();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
