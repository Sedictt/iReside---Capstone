import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ─── Auth guard mock ─────────────────────────────────────────────────────
const mockRequireAuth = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: mockRequireAuth,
  requireRole: vi.fn((ctx: unknown) => ctx),
  requireLandlordOwnsProperty: vi.fn(),
  requireAccessToLease: vi.fn(),
}));

// ─── Supabase from mock ──────────────────────────────────────────────────
const mockFrom = vi.fn();

function resetMocks() {
  vi.clearAllMocks();
  mockFrom.mockReset();
  mockRequireAuth.mockReset();
}

function authSuccess(userId = "l1", role = "landlord") {
  return {
    userId,
    userEmail: "test@example.com",
    userRole: role,
    supabase: { from: mockFrom },
  };
}

function authUnauthorized() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

const LEASE_ID = "11111111-1111-4111-8111-111111111111";

function makeContext(leaseId: string) {
  return { params: Promise.resolve({ leaseId }) };
}

function makeRequest(body?: unknown) {
  return new Request(`http://localhost/api/landlord/leases/${LEASE_ID}/term`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Chain for the lease lookup: select().eq().maybeSingle(). */
function selectChain(lease: Record<string, unknown> | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: lease, error: null }),
  };
}

/** Chain for the update: update().eq().eq().select().single(). Captures the payload. */
function updateChain(updated: Record<string, unknown>) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updated, error: null }),
        }),
      }),
    }),
  });
  return { chain: { update }, update };
}

/** Chain for the approved move-out lookup: select().eq().eq().order().limit().maybeSingle(). */
function moveOutChain(requestedDate: string | null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: requestedDate ? { requested_date: requestedDate } : null,
      error: null,
    }),
  };
}

const activeFixedLease = {
  id: LEASE_ID,
  landlord_id: "l1",
  status: "active",
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  term_type: "fixed",
};

async function loadRoute() {
  return import("@/app/api/landlord/leases/[leaseId]/term/route");
}

describe("PATCH /api/landlord/leases/[leaseId]/term", () => {
  beforeEach(resetMocks);

  it("returns 404 for a non-id lease param before any lookup", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext("abc"));
    expect(res.status).toBe(404);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValue(authUnauthorized());
    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a tenant caller", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess("t1", "tenant"));
    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
    expect(res.status).toBe(403);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown term type and for a fixed term without an end date", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const { PATCH } = await loadRoute();

    const bad = await PATCH(makeRequest({ term_type: "yearly" }), makeContext(LEASE_ID));
    expect(bad.status).toBe(400);

    const missing = await PATCH(makeRequest({ term_type: "fixed" }), makeContext(LEASE_ID));
    expect(missing.status).toBe(400);
    const json = await missing.json();
    expect(json.fieldErrors.end_date).toBeTruthy();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 404 when the lease belongs to another landlord", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess("l2"));
    mockFrom.mockReturnValue(selectChain(activeFixedLease));
    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
    expect(res.status).toBe(404);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when the lease is expired or terminated", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const { PATCH } = await loadRoute();

    for (const status of ["expired", "terminated"]) {
      mockFrom.mockReturnValue(selectChain({ ...activeFixedLease, status }));
      const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
      expect(res.status, status).toBe(409);
    }
  });

  it("switches a fixed lease to open-ended and clears the end date", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const updatedRow = { ...activeFixedLease, term_type: "open_ended", end_date: null };
    const { chain, update } = updateChain(updatedRow);
    mockFrom
      .mockReturnValueOnce(selectChain(activeFixedLease))
      .mockReturnValueOnce(moveOutChain(null))
      .mockReturnValueOnce(chain);

    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ term_type: "open_ended", end_date: null });
    const json = await res.json();
    expect(json.lease.term_type).toBe("open_ended");
    expect(json.lease.end_date).toBeNull();
  });

  it("keeps an approved move-out date when switching to open-ended", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const updatedRow = { ...activeFixedLease, term_type: "open_ended", end_date: "2026-11-30" };
    const { chain, update } = updateChain(updatedRow);
    mockFrom
      .mockReturnValueOnce(selectChain(activeFixedLease))
      .mockReturnValueOnce(moveOutChain("2026-11-30"))
      .mockReturnValueOnce(chain);

    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "open_ended" }), makeContext(LEASE_ID));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ term_type: "open_ended", end_date: "2026-11-30" });
  });

  it("switches an open-ended lease to a fixed term with the given end date", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const openEnded = { ...activeFixedLease, term_type: "open_ended", end_date: null };
    const updatedRow = { ...openEnded, term_type: "fixed", end_date: "2027-01-01" };
    const { chain, update } = updateChain(updatedRow);
    mockFrom.mockReturnValueOnce(selectChain(openEnded)).mockReturnValueOnce(chain);

    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "fixed", end_date: "2027-01-01" }), makeContext(LEASE_ID));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ term_type: "fixed", end_date: "2027-01-01" });
    const json = await res.json();
    expect(json.lease.term_type).toBe("fixed");
    expect(json.lease.end_date).toBe("2027-01-01");
  });

  it("rejects a fixed end date on or before the lease start date", async () => {
    mockRequireAuth.mockResolvedValue(authSuccess());
    const openEnded = { ...activeFixedLease, term_type: "open_ended", end_date: null };
    const { chain, update } = updateChain(openEnded);
    mockFrom.mockReturnValueOnce(selectChain(openEnded)).mockReturnValueOnce(chain);

    const { PATCH } = await loadRoute();
    const res = await PATCH(makeRequest({ term_type: "fixed", end_date: "2026-01-01" }), makeContext(LEASE_ID));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fieldErrors.end_date).toMatch(/after/);
    expect(update).not.toHaveBeenCalled();
  });
});
