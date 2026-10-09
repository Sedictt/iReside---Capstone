import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  amenityBookingSchema,
  analyticsOverviewQuerySchema,
  analyticsReportSchema,
  auditLogQuerySchema,
  bookingDateRule,
  calendarNoteSchema,
  communityCommentSchema,
  communityPollSchema,
  communityReactionSchema,
  conversationCreateSchema,
  irisChatSchema,
  isSafeImageMimeType,
  landlordExportQuerySchema,
  landlordMaintenanceCreateSchema,
  landlordMaintenanceUpdateSchema,
  messageMetadataError,
  messageReportSchema,
  messagesListQuerySchema,
  pollOptionsRule,
  sanitizeSearchTerm,
  tenantMaintenanceCreateSchema,
  timeRangesOverlap,
  unitMessagesQuerySchema,
} from "@/lib/validation/schemas/operations.schema";
import { todayIsoDate } from "@/lib/validation/rules";

const UUID = "11111111-1111-4111-8111-111111111111";
const UUID_2 = "22222222-2222-4222-8222-222222222222";
const today = todayIsoDate();
const future = "2099-06-15";

describe("maintenance schemas", () => {
  it("accepts a valid tenant request and trims text", () => {
    const result = tenantMaintenanceCreateSchema.safeParse({ title: "  Leak  ", description: " Sink drips ", category: "plumbing" });
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("Leak");
  });

  it("rejects whitespace-only and over-long text", () => {
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "   ", description: "x" }).success).toBe(false);
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "a".repeat(151), description: "x" }).success).toBe(false);
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "a".repeat(150), description: "x" }).success).toBe(true);
  });

  it("rejects unknown priority, too many images and non-image links", () => {
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "t", description: "d", priority: "extreme" }).success).toBe(false);
    const six = Array.from({ length: 6 }, (_, i) => `https://x.supabase.co/img${i}.png`);
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "t", description: "d", images: six }).success).toBe(false);
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "t", description: "d", images: ["javascript:alert(1)"] }).success).toBe(false);
    expect(tenantMaintenanceCreateSchema.safeParse({ title: "t", description: "d", images: ["data:image/png;base64,AAAA"] }).success).toBe(true);
  });

  it("validates landlord create/update enums and ids", () => {
    expect(landlordMaintenanceCreateSchema.safeParse({ unitId: UUID, title: "t", description: "d", priority: "High", propertyId: "all" }).success).toBe(true);
    expect(landlordMaintenanceCreateSchema.safeParse({ unitId: "unit-1", title: "t", description: "d", priority: "High" }).success).toBe(false);
    expect(landlordMaintenanceCreateSchema.safeParse({ unitId: UUID, title: "t", description: "d", priority: "urgent" }).success).toBe(false);
    expect(landlordMaintenanceUpdateSchema.safeParse({ requestId: UUID, status: "resolved" }).success).toBe(true);
    expect(landlordMaintenanceUpdateSchema.safeParse({ requestId: UUID, status: "done" }).success).toBe(false);
  });
});

describe("amenity bookings", () => {
  const base = { amenity_id: UUID, booking_date: future, start_time: "14:00:00", end_time: "16:00:00" };

  it("accepts a valid future booking", () => {
    expect(amenityBookingSchema.safeParse(base).success).toBe(true);
  });

  it("rejects past, impossible dates and reversed times", () => {
    expect(amenityBookingSchema.safeParse({ ...base, booking_date: "2020-01-01" }).success).toBe(false);
    expect(amenityBookingSchema.safeParse({ ...base, booking_date: "2099-02-30" }).success).toBe(false);
    const reversed = amenityBookingSchema.safeParse({ ...base, start_time: "16:00", end_time: "14:00" });
    expect(reversed.success).toBe(false);
    expect(reversed.error?.issues[0].path).toEqual(["end_time"]);
    expect(amenityBookingSchema.safeParse({ ...base, end_time: "25:00" }).success).toBe(false);
  });

  it("treats today as bookable and detects overlaps", () => {
    expect(bookingDateRule(today)).toBeUndefined();
    expect(timeRangesOverlap("14:00", "16:00", "15:00:00", "17:00:00")).toBe(true);
    expect(timeRangesOverlap("14:00", "16:00", "16:00:00", "18:00:00")).toBe(false);
  });
});

describe("calendar notes", () => {
  it("requires a title and a real date", () => {
    expect(calendarNoteSchema.safeParse({ date: "2026-10-09", title: "Call plumber" }).success).toBe(true);
    expect(calendarNoteSchema.safeParse({ date: "2026-13-01", title: "x" }).success).toBe(false);
    expect(calendarNoteSchema.safeParse({ date: "2026-10-09", title: "  " }).success).toBe(false);
    expect(calendarNoteSchema.safeParse({ date: "2026-10-09", title: "x", id: "../../etc" }).success).toBe(false);
    expect(calendarNoteSchema.safeParse({ date: "2026-10-09", title: "x", description: "d".repeat(1001) }).success).toBe(false);
  });
});

describe("community", () => {
  it("validates poll options: count, blanks, uniqueness", () => {
    expect(pollOptionsRule(["Yes", "No"])).toBeUndefined();
    expect(pollOptionsRule(["Yes", "  "])).toMatch(/at least 2/);
    expect(pollOptionsRule(["Yes", "yes"])).toMatch(/unique/);
    expect(pollOptionsRule(["a", "b", "c", "d", "e", "f"])).toMatch(/at most 5/);
    const parsed = communityPollSchema.safeParse({ title: "Pool hours?", content: "", options: [" A ", "B", ""] });
    expect(parsed.success).toBe(true);
    expect(parsed.data?.options).toEqual(["A", "B"]);
  });

  it("validates comments and reactions", () => {
    expect(communityCommentSchema.safeParse({ postId: UUID, content: "  " }).success).toBe(false);
    expect(communityCommentSchema.safeParse({ postId: UUID, content: "c".repeat(1001) }).success).toBe(false);
    expect(communityCommentSchema.safeParse({ postId: "1 or 1=1", content: "hi" }).success).toBe(false);
    expect(communityReactionSchema.safeParse({ postId: UUID, reactionType: "angry" }).success).toBe(false);
  });
});

describe("messaging", () => {
  it("only accepts file references inside the sender's conversation folder", () => {
    expect(messageMetadataError({ filePath: `${UUID}/${UUID_2}/a.png` }, UUID, UUID_2)).toBeUndefined();
    expect(messageMetadataError({ filePath: "other-conv/x/secret.pdf" }, UUID, UUID_2)).toMatch(/does not belong/);
    expect(messageMetadataError({ filePath: `${UUID}/${UUID_2}/a.png`, bucket: "private-docs" }, UUID, UUID_2)).toMatch(/storage location/);
    expect(messageMetadataError({ attachments: [{ filePath: "x/y.png" }] }, UUID, UUID_2)).toMatch(/does not belong/);
    expect(messageMetadataError([1, 2], UUID, UUID_2)).toMatch(/object/);
    expect(messageMetadataError({ isRedacted: false, systemType: "invoice" }, UUID, UUID_2)).toBeUndefined();
  });

  it("validates participants, list params and reports", () => {
    expect(conversationCreateSchema.safeParse({ participantIds: [UUID] }).success).toBe(true);
    expect(conversationCreateSchema.safeParse({ participantIds: ["abc"] }).success).toBe(false);
    expect(messagesListQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(messagesListQuerySchema.safeParse({ limit: "2.5" }).success).toBe(false);
    expect(messagesListQuerySchema.safeParse({}).data?.limit).toBe(20);
    expect(messageReportSchema.safeParse({ category: "rude" }).success).toBe(false);
    expect(messageReportSchema.safeParse({ category: "spam", reportedMessageId: "not-an-id" }).success).toBe(false);
    expect(unitMessagesQuerySchema.safeParse({ unitId: "draft-unit-3", tenantName: "Ana" }).data?.unitId).toBeNull();
  });

  it("caps IRIS messages", () => {
    expect(irisChatSchema.safeParse({ message: "  " }).success).toBe(false);
    expect(irisChatSchema.safeParse({ message: "m".repeat(2001) }).success).toBe(false);
  });

  it("rejects SVG and non-image uploads", () => {
    expect(isSafeImageMimeType("image/png")).toBe(true);
    expect(isSafeImageMimeType("image/svg+xml")).toBe(false);
    expect(isSafeImageMimeType("text/html")).toBe(false);
  });
});

describe("analytics, exports, search, audit", () => {
  it("orders and bounds analytics date ranges", () => {
    expect(analyticsOverviewQuerySchema.safeParse({ start: "2026-01-01", end: "2026-01-31" }).success).toBe(true);
    expect(analyticsOverviewQuerySchema.safeParse({ start: "2026-02-01", end: "2026-01-31" }).success).toBe(false);
    expect(analyticsOverviewQuerySchema.safeParse({ start: "1999-12-31" }).success).toBe(false);
    expect(analyticsOverviewQuerySchema.safeParse({ propertyId: "nope" }).success).toBe(false);
    expect(analyticsOverviewQuerySchema.safeParse({ propertyId: "all" }).data?.propertyId).toBeNull();
  });

  it("validates report format/mode enums", () => {
    const row = { metric: "m", value: "v", change: "c", trend: "t" };
    expect(analyticsReportSchema.safeParse({ format: "csv", mode: "Simplified", range: "r", rows: [row] }).success).toBe(true);
    expect(analyticsReportSchema.safeParse({ format: "xlsx", mode: "Simplified", range: "r", rows: [] }).success).toBe(false);
    expect(analyticsReportSchema.safeParse({ format: "csv", mode: "Full", range: "r", rows: [] }).success).toBe(false);
  });

  it("validates export, audit params and sanitizes search", () => {
    expect(landlordExportQuerySchema.safeParse({}).data).toEqual({ category: "financials", range: "ytd" });
    expect(landlordExportQuerySchema.safeParse({ category: "secrets" }).success).toBe(false);
    expect(auditLogQuerySchema.safeParse({ limit: "abc" }).success).toBe(false);
    expect(auditLogQuerySchema.safeParse({ severity: "debug" }).success).toBe(false);
    expect(auditLogQuerySchema.safeParse({ search: "s".repeat(201) }).success).toBe(false);
    expect(sanitizeSearchTerm("a%,b),title.eq.x")).not.toMatch(/[%,()]/);
  });
});

// ---------------------------------------------------------------------------
// Route-level: bad payloads become 400s before any database work.
// ---------------------------------------------------------------------------

const requireAuthenticatedUserMock = vi.fn();
const requireUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({ requireAuthenticatedUser: requireAuthenticatedUserMock }));
vi.mock("@/lib/supabase/auth", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabaseClient: () => ({ from: fromMock }),
  createAdminClient: () => ({ from: fromMock }),
}));

const jsonRequest = (url: string, body: unknown, method = "POST") =>
  new Request(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("route validation", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    requireAuthenticatedUserMock.mockResolvedValue({ userId: UUID_2, supabase: { from: fromMock } });
    requireUserMock.mockResolvedValue({ user: { id: UUID_2 }, supabase: { from: fromMock } });
  });

  it("tenant maintenance POST rejects a blank title", async () => {
    const { POST } = await import("@/app/api/tenant/maintenance/route");
    const res = await POST(jsonRequest("http://localhost/api/tenant/maintenance", { title: " ", description: "x" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fieldErrors.title).toBe("Title is required.");
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("tenant maintenance POST rejects malformed JSON", async () => {
    const { POST } = await import("@/app/api/tenant/maintenance/route");
    const res = await POST(new Request("http://localhost/api/tenant/maintenance", { method: "POST", body: "{oops" }));
    expect(res.status).toBe(400);
  });

  it("landlord maintenance PATCH rejects an unknown status", async () => {
    const { PATCH } = await import("@/app/api/landlord/maintenance/route");
    const res = await PATCH(jsonRequest("http://localhost/api/landlord/maintenance", { requestId: UUID, status: "deleted" }, "PATCH"));
    expect(res.status).toBe(400);
  });

  it("amenity booking POST rejects reversed times", async () => {
    const { POST } = await import("@/app/api/tenant/amenities/bookings/route");
    const res = await POST(
      jsonRequest("http://localhost/api/tenant/amenities/bookings", {
        amenity_id: UUID,
        booking_date: future,
        start_time: "18:00",
        end_time: "10:00",
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.end_time).toMatch(/after the start time/);
  });

  it("conversation message POST rejects foreign file references", async () => {
    const { POST } = await import("@/app/api/messages/conversations/[conversationId]/route");
    const res = await POST(
      jsonRequest(`http://localhost/api/messages/conversations/${UUID}`, {
        content: "see file",
        type: "file",
        metadata: { filePath: "someone-else/doc.pdf", bucket: "landlord-documents" },
      }),
      { params: Promise.resolve({ conversationId: UUID }) }
    );
    expect(res.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("analytics overview GET rejects an inverted range", async () => {
    const { GET } = await import("@/app/api/landlord/analytics/overview/route");
    const res = await GET(new Request("http://localhost/api/landlord/analytics/overview?start=2026-03-01&end=2026-01-01"));
    expect(res.status).toBe(400);
  });

});
