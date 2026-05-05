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

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(body?: Record<string, unknown>, method = "PUT") {
  return new Request("http://localhost/api/landlord/move-out/test-id/approve", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── PUT /api/landlord/move-out/[id]/approve ─────────────────────────────

describe("PUT /api/landlord/move-out/[id]/approve", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/approve/route");
    const res = await PUT(makeRequest(), makeContext("req-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when request not found or not owned by landlord", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/approve/route");
    const res = await PUT(makeRequest(), makeContext("nonexistent"));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("not found");
  });

  it("returns 400 when request status is not pending", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "approved", lease_id: "lease-1", tenant_id: "t1", requested_date: "2099-12-31" },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/approve/route");
    const res = await PUT(makeRequest(), makeContext("req-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Cannot approve");
  });

  it("approves a pending request and updates lease end_date", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", lease_id: "lease-1", tenant_id: "t1", requested_date: "2099-12-31", landlord_id: "l1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "req-1", status: "approved" }, error: null }),
          }),
        }),
      }),
    };
    const leaseUpdateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(leaseUpdateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/approve/route");
    const res = await PUT(makeRequest({ inspection_date: "2099-11-01" }), makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("approved");
  });

  it("notifies tenant after approval", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", lease_id: "lease-1", tenant_id: "t1", requested_date: "2099-12-31", landlord_id: "l1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "req-1", status: "approved" }, error: null }),
          }),
        }),
      }),
    };
    const leaseUpdateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(leaseUpdateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/approve/route");
    await PUT(makeRequest(), makeContext("req-1"));
    expect(mockFrom).toHaveBeenNthCalledWith(4, "notifications");
  });
});

// ─── PUT /api/landlord/move-out/[id]/deny ────────────────────────────────

describe("PUT /api/landlord/move-out/[id]/deny", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    const res = await PUT(makeRequest({ denial_reason: "Not allowed" }), makeContext("req-1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 when denial_reason is missing", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    const res = await PUT(makeRequest({}), makeContext("req-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Denial reason is required");
  });

  it("returns 404 when request not found", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    const res = await PUT(makeRequest({ denial_reason: "Too early" }), makeContext("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when request is not in pending status", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "approved", tenant_id: "t1" },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    const res = await PUT(makeRequest({ denial_reason: "Nope" }), makeContext("req-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Cannot deny");
  });

  it("denies a pending request with valid reason", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", tenant_id: "t1", landlord_id: "l1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "req-1", status: "denied" }, error: null }),
          }),
        }),
      }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    const res = await PUT(makeRequest({ denial_reason: "Minimum stay not met" }), makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("denied");
  });

  it("notifies tenant after denial", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", tenant_id: "t1", landlord_id: "l1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "req-1", status: "denied" }, error: null }),
          }),
        }),
      }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/deny/route");
    await PUT(makeRequest({ denial_reason: "Nope" }), makeContext("req-1"));
    expect(mockFrom).toHaveBeenNthCalledWith(3, "notifications");
  });
});

// ─── POST /api/landlord/move-out/[id]/inspection ─────────────────────────

describe("POST /api/landlord/move-out/[id]/inspection", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { POST } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspection_date: "2099-11-01", inspection_notes: "Good condition" }),
    });
    const res = await POST(req, makeContext("req-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when request not found", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { POST } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspection_date: "2099-11-01" }),
    });
    const res = await POST(req, makeContext("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when request is not in approved status", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", tenant_id: "t1", landlord_id: "l1" },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { POST } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspection_date: "2099-11-01" }),
    });
    const res = await POST(req, makeContext("req-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Must be 'approved'");
  });

  it("records inspection for an approved request", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "approved", tenant_id: "t1", landlord_id: "l1" },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "req-1", inspection_date: "2099-11-01" },
              error: null,
            }),
          }),
        }),
      }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(notifChain);

    const { POST } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const req = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspection_date: "2099-11-01", inspection_notes: "Unit in good condition" }),
    });
    const res = await POST(req, makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("Inspection recorded");
  });
});

// ─── GET /api/landlord/move-out/[id]/inspection (clearance) ──────────────

describe("GET /api/landlord/move-out/[id]/inspection (clearance check)", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { GET } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const res = await GET(new Request("http://localhost"), makeContext("req-1"));
    expect(res.status).toBe(401);
  });

  it("returns clearance status with outstanding balances", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const moveOutChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { lease_id: "lease-1" }, error: null }),
    };
    const paymentsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ data: [{ balance_remaining: 5000 }], error: null }),
    };
    const readingsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({
        data: [
          { utility_type: "water", computed_charge: 200 },
          { utility_type: "electricity", computed_charge: 300 },
        ],
        error: null,
      }),
    };

    mockFrom
      .mockReturnValueOnce(moveOutChain)
      .mockReturnValueOnce(paymentsChain)
      .mockReturnValueOnce(readingsChain);

    const { GET } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const res = await GET(new Request("http://localhost"), makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rent_settled).toBe(false);
    expect(json.utilities_settled).toBe(false);
    expect(json.outstanding_balance).toBe(5000);
    expect(json.water_balance).toBe(200);
    expect(json.electricity_balance).toBe(300);
  });

  it("returns settled when no outstanding balances", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const moveOutChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { lease_id: "lease-1" }, error: null }),
    };
    const paymentsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const readingsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom
      .mockReturnValueOnce(moveOutChain)
      .mockReturnValueOnce(paymentsChain)
      .mockReturnValueOnce(readingsChain);

    const { GET } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const res = await GET(new Request("http://localhost"), makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.rent_settled).toBe(true);
    expect(json.utilities_settled).toBe(true);
  });
});

// ─── PUT /api/landlord/move-out/[id]/complete ────────────────────────────

describe("PUT /api/landlord/move-out/[id]/complete", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    const res = await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("req-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when request not found", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    const res = await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 400 when request is not approved or has no inspection", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "approved", inspection_date: null, lease_id: "lease-1", tenant_id: "t1", landlord_id: "l1", lease: { unit_id: "u1" } },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    const res = await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("req-1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Inspection must be recorded");
  });

  it("returns 400 when request is still pending", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "req-1", status: "pending", inspection_date: null, lease_id: "lease-1", tenant_id: "t1", landlord_id: "l1", lease: { unit_id: "u1" } },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    const res = await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("req-1"));
    expect(res.status).toBe(400);
  });

  it("completes move-out: terminates lease and marks unit vacant", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "req-1",
          status: "approved",
          inspection_date: "2099-11-01",
          lease_id: "lease-1",
          tenant_id: "t1",
          landlord_id: "l1",
          lease: { unit_id: "u1" },
        },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)   // move_out_requests update
      .mockReturnValueOnce(updateChain)   // leases update
      .mockReturnValueOnce(updateChain)   // units update
      .mockReturnValueOnce(notifChain);    // notifications

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    const res = await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("req-1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("completed successfully");
  });

  it("notifies tenant after completion", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: "req-1",
          status: "approved",
          inspection_date: "2099-11-01",
          lease_id: "lease-1",
          tenant_id: "t1",
          landlord_id: "l1",
          lease: { unit_id: "u1" },
        },
        error: null,
      }),
    };
    const updateChain = {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
    const notifChain = {
      insert: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(notifChain);

    const { PUT } = await import("@/app/api/landlord/move-out/[id]/complete/route");
    await PUT(new Request("http://localhost", { method: "PUT" }), makeContext("req-1"));
    expect(mockFrom).toHaveBeenNthCalledWith(5, "notifications");
  });
});

// ─── GET /api/landlord/move-out (list) ───────────────────────────────────

describe("GET /api/landlord/move-out (list requests)", () => {
  beforeEach(resetMocks);

  it("returns 401 when unauthenticated", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });
    const { GET } = await import("@/app/api/landlord/move-out/route");
    const res = await GET(new Request("http://localhost/api/landlord/move-out"));
    expect(res.status).toBe(401);
  });

  it("returns empty array when no requests exist", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });
    const listChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(listChain);
    const { GET } = await import("@/app/api/landlord/move-out/route");
    const res = await GET(new Request("http://localhost/api/landlord/move-out"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it("returns enriched list of requests", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "l1" } }, error: null });

    const mockRequests = [
      {
        id: "req-1",
        status: "pending",
        lease_id: "lease-1",
        tenant_id: "t1",
        requested_date: "2099-12-31",
        reason: "relocating",
        landlord_id: "l1",
        created_at: "2025-01-01T00:00:00Z",
        approved_at: null,
        denied_at: null,
        completed_at: null,
      },
    ];

    const listChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockRequests, error: null }),
    };

    const leaseChain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: "lease-1",
            start_date: "2024-01-01",
            end_date: "2025-01-01",
            monthly_rent: 10000,
            security_deposit: 5000,
            units: { name: "Unit 101", properties: { id: "p1", name: "Bldg A", address: "123 St" } },
            tenant: { id: "t1", full_name: "Tenant One", email: "t1@test.com", phone: null },
          },
        ],
        error: null,
      }),
    };

    mockFrom
      .mockReturnValueOnce(listChain)
      .mockReturnValueOnce(leaseChain);

    const { GET } = await import("@/app/api/landlord/move-out/route");
    const res = await GET(new Request("http://localhost/api/landlord/move-out"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.length).toBe(1);
    expect(json[0].id).toBe("req-1");
    expect(json[0].lease.tenant.full_name).toBe("Tenant One");
    expect(json[0].lease.unit.name).toBe("Unit 101");
  });
});
