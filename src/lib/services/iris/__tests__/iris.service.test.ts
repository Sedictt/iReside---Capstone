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

  it("fetches tenant profile, active lease, unit, property, landlord, maintenance, and payments", async () => {
    const mockProfile = { id: "tenant-1", full_name: "Alice Tenant", email: "alice@example.com" };
    const mockLandlord = {
      id: "landlord-1",
      full_name: "Mr. Juan Dela Cruz",
      email: "juan@skyline.ph",
      phone: "+639171234567",
      business_name: "Skyline Properties Inc.",
    };
    const mockLease = {
      id: "lease-1",
      landlord_id: "landlord-1",
      status: "active",
      monthly_rent: 15000,
      landlord: mockLandlord,
      unit: {
        id: "unit-1",
        name: "302",
        property: {
          id: "prop-1",
          name: "Skyline Residences",
          amenities: ["High Speed WiFi"],
        },
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
    expect(context.landlord?.full_name).toBe("Mr. Juan Dela Cruz");
    expect(context.landlord?.business_name).toBe("Skyline Properties Inc.");
    expect(context.wifiInfo?.ssid).toBe("SkylineResidences_Guest");
    expect(context.wifiInfo?.password).toBe("WelcomeHome2024");
  });

  it("formats context into system prompt string with landlord and wifi details", () => {
    const prompt = contextService.formatContextForAi({
      profile: { id: "tenant-1", full_name: "Alice", email: "alice@example.com" } as any,
      landlord: {
        id: "landlord-1",
        full_name: "Juan Dela Cruz",
        business_name: "Skyline Realty",
        phone: "+639171234567",
        email: "juan@skyline.ph",
      },
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
      wifiInfo: {
        ssid: "GreenPark_Guest",
        password: "WelcomeHome2024",
      },
    });

    expect(prompt).toContain("Green Park");
    expect(prompt).toContain("Alice");
    expect(prompt).toContain("Juan Dela Cruz");
    expect(prompt).toContain("Skyline Realty");
    expect(prompt).toContain("GreenPark_Guest");
    expect(prompt).toContain("WelcomeHome2024");
    expect(prompt).toContain("LANGUAGE MATCHING");
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
            choices: [{ message: { content: "Hello! Here is the information." } }],
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

  it("processes chat message and returns dynamic wifi card", async () => {
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

    expect(result.response).toBe("Hello! Here is the information.");
    expect(result.hasDataCard).toBe(true);
    expect(result.card?.type).toBe("wifi");
    expect((result.card as any)?.ssid).toBe("SunsetView_Guest");
    expect((result.card as any)?.password).toBe("WelcomeHome2024");
    expect(result.metadata.tokens).toBe(42);
  });

  it("detects landlord query in Tagalog and returns landlord contact card", async () => {
    const mockLandlord = {
      id: "landlord-1",
      full_name: "Maria Santos",
      business_name: "Skyline Lofts Management",
      phone: "+639181234567",
      email: "maria@skylinelofts.ph",
    };
    const mockProfile = { id: "user-1", full_name: "Bob" };
    const mockProperty = { name: "Skyline Lofts" };

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
          limit: vi.fn().mockResolvedValue({
            data: [{ landlord: mockLandlord, unit: { property: mockProperty } }],
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

    const result = await irisService.processChatMessage("user-1", "ano pangalan ng landlord namin?");

    expect(result.hasDataCard).toBe(true);
    expect(result.card?.type).toBe("landlord");
    expect((result.card as any)?.name).toBe("Maria Santos");
    expect((result.card as any)?.phone).toBe("+639181234567");
    expect((result.card as any)?.email).toBe("maria@skylinelofts.ph");
  });

  it("detects rent query and returns rent card", async () => {
    const mockProfile = { id: "user-1", full_name: "Bob" };
    const mockLease = {
      id: "lease-1",
      monthly_rent: 18000,
      security_deposit: 36000,
      status: "active",
      terms: { paymentDueDay: 5 },
      unit: { property: { name: "The Lofts" } },
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
          limit: vi.fn().mockResolvedValue({
            data: [mockLease],
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

    const result = await irisService.processChatMessage("user-1", "What is my rent status?");

    expect(result.hasDataCard).toBe(true);
    expect(result.card?.type).toBe("rent");
    expect((result.card as any)?.monthlyRent).toBe(18000);
    expect((result.card as any)?.securityDeposit).toBe(36000);
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

