import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Supabase mock ──────────────────────────────────────────────────────
const mockFrom = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockAuthGetUser },
    })
  ),
}));

function resetMocks() {
  vi.clearAllMocks();
  mockFrom.mockReset();
  mockAuthGetUser.mockReset();
}

function makeRequest(body: Record<string, unknown>, method = "POST") {
  return new Request("http://localhost/api/tenant/lease/move-out", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/tenant/lease/move-out ─────────────────────────────────────

describe("POST /api/tenant/lease/move-out (submit request)", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const res = await POST(makeRequest({ requestedDate: "2099-12-31" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when requestedDate is missing", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const res = await POST(makeRequest({ reason: "moving" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Requested date is required");
  });

  it("returns 400 when date is less than 30 days from now", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await POST(makeRequest({ requestedDate: tomorrow.toISOString() }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("30 days notice");
  });

  it("returns 404 when tenant has no active lease", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(leaseChain);
    const { POST } = await import("@/app/api/tenant/lease/move-out/route");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    const res = await POST(makeRequest({ requestedDate: futureDate.toISOString() }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("No active lease");
  });

  it("returns 400 when a pending request already exists", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    // Lease found
    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "lease-1", landlord_id: "l1" }, error: null }),
    };
    // Existing pending request
    const existingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "existing-req" } }),
    };
    mockFrom
      .mockReturnValueOnce(leaseChain)
      .mockReturnValueOnce(existingChain);

    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    const res = await POST(makeRequest({ requestedDate: futureDate.toISOString() }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("already pending");
  });

  it("creates request and returns success on valid input", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "lease-1", landlord_id: "l1" }, error: null }),
    };
    const existingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const insertChain = {
      insert: vi.fn().mockReturnValue({ error: null }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    mockFrom
      .mockReturnValueOnce(leaseChain)
      .mockReturnValueOnce(existingChain)
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(notifChain);

    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    const res = await POST(makeRequest({ reason: "relocating", requestedDate: futureDate.toISOString() }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("sends notification to landlord after creating request", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "lease-1", landlord_id: "l1" }, error: null }),
    };
    const existingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const insertChain = {
      insert: vi.fn().mockReturnValue({ error: null }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    mockFrom
      .mockReturnValueOnce(leaseChain)
      .mockReturnValueOnce(existingChain)
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(notifChain);

    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    await POST(makeRequest({ reason: "relocating", requestedDate: futureDate.toISOString() }));
    expect(mockFrom).toHaveBeenNthCalledWith(4, "notifications");
  });

  it("returns 500 when insert fails", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "lease-1", landlord_id: "l1" }, error: null }),
    };
    const existingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const insertChain = {
      insert: vi.fn().mockReturnValue({ error: { message: "DB insert error" } }),
    };
    mockFrom
      .mockReturnValueOnce(leaseChain)
      .mockReturnValueOnce(existingChain)
      .mockReturnValueOnce(insertChain);

    const { POST } = await import("@/app/api/tenant/lease/move-out/route");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    const res = await POST(makeRequest({ reason: "relocating", requestedDate: futureDate.toISOString() }));
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/tenant/lease/move-out/status ───────────────────────────────

describe("GET /api/tenant/lease/move-out/status", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { GET } = await import("@/app/api/tenant/lease/move-out/status/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns hasRequest: false when no active request exists", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { GET } = await import("@/app/api/tenant/lease/move-out/status/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasRequest).toBe(false);
    expect(json.request).toBeNull();
  });

  it("returns request data when a pending/approved request exists", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const mockRequest = {
      id: "req-1",
      status: "pending",
      requested_date: "2099-12-31",
      reason: "relocating",
      created_at: "2025-01-01T00:00:00Z",
      approved_at: null,
      inspection_date: null,
      inspection_notes: null,
      deposit_deductions: null,
      deposit_refund_amount: null,
      checklist_completed: false,
      checklist_data: null,
      landlord: { id: "l1", full_name: "Landlord", email: "ll@test.com" },
    };
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockRequest, error: null }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { GET } = await import("@/app/api/tenant/lease/move-out/status/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasRequest).toBe(true);
    expect(json.request.id).toBe("req-1");
    expect(json.request.status).toBe("pending");
    expect(json.request.landlord_name).toBe("Landlord");
  });
});

// ─── PUT /api/tenant/lease/move-out/checklist ────────────────────────────

describe("PUT /api/tenant/lease/move-out/checklist", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_data: { items: [] } }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when checklist_data is missing", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Checklist data is required");
  });

  it("returns 404 when no approved move-out request exists", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_data: { items: [{ id: "keys", completed: true }] } }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("No approved move-out request");
  });

  it("updates checklist and returns success", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const existingRequest = {
      id: "req-1",
      checklist_data: { items: [{ id: "keys", completed: false }] },
    };
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existingRequest, error: null }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const newChecklist = { items: [{ id: "keys", completed: true }] };
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_data: newChecklist }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("sets checklist_completed to true when all items are completed", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const existingRequest = { id: "req-1", checklist_data: {} };
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existingRequest, error: null }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const notifChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const allDone = {
      keys: { completed: true },
      bills: { completed: true },
      clean: { completed: true },
      address: { completed: true },
    };
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_data: allDone }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checklist_completed).toBe(true);
  });

  it("sets checklist_completed to false when some items are incomplete", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "t1" } }, error: null });
    const existingRequest = { id: "req-1", checklist_data: {} };
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: existingRequest, error: null }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain);

    const { PUT } = await import("@/app/api/tenant/lease/move-out/checklist/route");
    const partial = {
      keys: { completed: true },
      bills: { completed: false },
    };
    const req = new Request("http://localhost/api/tenant/lease/move-out/checklist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist_data: partial }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checklist_completed).toBe(false);
  });
});
