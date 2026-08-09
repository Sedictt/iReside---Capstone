import { describe, it, expect, vi, beforeEach } from "vitest";
import { IrisContextService } from "../iris-context.service";
import { IrisService } from "../iris.service";
import { IrisValidationError } from "../iris.errors";

describe("IrisContextService", () => {
  let mockSupabase: any;
  let contextService: IrisContextService;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    contextService = new IrisContextService(mockSupabase);
  });

  it("fetches tenant profile, active lease, unit, property, maintenance, and payments", async () => {
    const mockProfile = { id: "tenant-1", full_name: "Alice Tenant", email: "alice@example.com" };
    const mockLease = {
      id: "lease-1",
      status: "active",
      monthly_rent: 15000,
      unit: {
        id: "unit-1",
        name: "302",
        property: { id: "prop-1", name: "Skyline Residences" },
      },
    };

    mockSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        };
      }
      if (tableName === "leases") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [mockLease], error: null }),
        };
      }
      if (tableName === "maintenance_requests" || tableName === "payments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const context = await contextService.getTenantContext("tenant-1");

    expect(context.profile?.full_name).toBe("Alice Tenant");
    expect(context.lease?.id).toBe("lease-1");
    expect(context.property?.name).toBe("Skyline Residences");
  });

  it("formats context into system prompt string", () => {
    const prompt = contextService.formatContextForAi({
      profile: { id: "tenant-1", full_name: "Alice", email: "alice@example.com" } as any,
      lease: {
        id: "lease-1",
        status: "active",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        monthly_rent: 20000,
        security_deposit: 40000,
      } as any,
      unit: { name: "101", floor: 1, beds: 2, baths: 1 } as any,
      property: { name: "Green Park", address: "123 Main St", city: "Manila", type: "apartment", amenities: ["High Speed WiFi"] } as any,
      maintenanceRequests: [],
      payments: [],
    });

    expect(prompt).toContain("Green Park");
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("High Speed WiFi");
  });
});

describe("IrisService", () => {
  let mockSupabase: any;
  let mockAiClient: any;
  let irisService: IrisService;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    mockAiClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "Hello! How can I help you with the WiFi?" } }],
            usage: { total_tokens: 42 },
          }),
        },
      },
    };
    irisService = new IrisService(mockSupabase, mockAiClient);
  });

  it("validates empty message input", async () => {
    await expect(irisService.processChatMessage("user-1", "")).rejects.toThrow(
      IrisValidationError,
    );
  });

  it("processes chat message and detects wifi card trigger", async () => {
    const mockContextData = {
      profile: { id: "user-1", full_name: "Bob" },
      property: { name: "Sunset View", amenities: ["Free WiFi in lobby"] },
      lease: null,
      unit: null,
      maintenanceRequests: [],
      payments: [],
    };

    mockSupabase.from.mockImplementation((tableName: string) => {
      if (tableName === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: mockContextData.profile, error: null }),
        };
      }
      if (tableName === "leases") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ unit: { property: mockContextData.property } }],
            error: null,
          }),
        };
      }
      if (tableName === "maintenance_requests" || tableName === "payments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (tableName === "iris_chat_messages") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    });

    const result = await irisService.processChatMessage("user-1", "What is the wifi password?");

    expect(result.response).toBe("Hello! How can I help you with the WiFi?");
    expect(result.hasDataCard).toBe(true);
    expect(result.metadata.tokens).toBe(42);
  });

  it("retrieves chat history", async () => {
    const mockHistory = [
      { id: "msg-1", role: "user", content: "Hi", metadata: null, created_at: "2026-08-01" },
      { id: "msg-2", role: "assistant", content: "Hello", metadata: null, created_at: "2026-08-01" },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
    });

    const history = await irisService.getChatHistory("user-1", 50);

    expect(history).toEqual(mockHistory);
  });
});
