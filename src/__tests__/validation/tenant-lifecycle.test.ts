import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addDaysIso,
  applicantNameRule,
  applicationActionSchema,
  inviteApplicationSchema,
  inviteCreateSchema,
  inviteExpiryRule,
  isId,
  isMoveOutChecklistComplete,
  isUrlToken,
  landlordApplicationCreateSchema,
  landlordApplicationUpdateSchema,
  leaseEndDateRule,
  leaseFinalizeSchema,
  leaseStartDateRule,
  manualTenantSchema,
  moveInDateRule,
  moveOutChecklistSchema,
  moveOutDateRule,
  moveOutInspectionSchema,
  moveOutRequestSchema,
  paymentBypassSchema,
  paymentReviewSchema,
  phMobileRule,
  renewalDecisionSchema,
  renewalTermDatesRule,
  renewalTermRule,
  tenantRenewalRequestSchema,
  landlordLeaseListQuerySchema,
} from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { mapApplicationFieldErrors, validateFormStep, DEFAULT_CHECKLIST, DEFAULT_EMPLOYMENT } from "@/lib/application-intake";

const UNIT = "11111111-1111-4111-8111-111111111111";
const PROPERTY = "22222222-2222-4222-8222-222222222222";
const TODAY = "2026-10-09";

const validApplication = {
  unit_id: UNIT,
  applicant_name: "Maria Dela Cruz",
  applicant_email: " Maria@Example.com ",
  applicant_phone: "09171234567",
  employment_info: { occupation: "Engineer", employer: "Stark Industries", monthly_income: "45,000" },
  requirements_checklist: { valid_id: true, proof_of_income: false },
  message: "",
};

function firstMessage(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe("identifier and token guards", () => {
  it("accepts UUID-shaped ids including hand-seeded ones", () => {
    expect(isId(UNIT)).toBe(true);
    expect(isId("00000000-0000-0000-0000-000000000001")).toBe(true);
  });

  it("rejects non-id values before any DB lookup", () => {
    expect(isId("req-1")).toBe(false);
    expect(isId("")).toBe(false);
    expect(isId("' OR 1=1 --")).toBe(false);
  });

  it("validates URL token format and length", () => {
    expect(isUrlToken("abcDEF123_-abcDEF123_-abcDEF123_")).toBe(true);
    expect(isUrlToken(crypto.randomUUID())).toBe(true);
    expect(isUrlToken("short")).toBe(false);
    expect(isUrlToken("x".repeat(200))).toBe(false);
    expect(isUrlToken("has spaces in it 123456")).toBe(false);
  });
});

describe("applicant field rules", () => {
  it("applicantNameRule enforces required, digits, length and characters", () => {
    expect(applicantNameRule("")).toBe("Applicant name is required.");
    expect(applicantNameRule("   ")).toBe("Applicant name is required.");
    expect(applicantNameRule("Juan 2")).toBe("Name must not contain numbers.");
    expect(applicantNameRule("J")).toMatch(/between 2 and 100/);
    expect(applicantNameRule("J".repeat(101))).toMatch(/between 2 and 100/);
    expect(applicantNameRule("Juan <script>")).toMatch(/only contain letters/);
    expect(applicantNameRule("José Dela Cruz-Peña")).toBeUndefined();
  });

  it("phMobileRule accepts local, 10-digit and +63 formats", () => {
    expect(phMobileRule("09171234567")).toBeUndefined();
    expect(phMobileRule("9171234567")).toBeUndefined();
    expect(phMobileRule("+639171234567")).toBeUndefined();
    expect(phMobileRule("0917123456")).toMatch(/valid Philippine mobile/);
    expect(phMobileRule("02-8123-4567")).toMatch(/valid Philippine mobile/);
    expect(phMobileRule("", { required: true })).toBe("Phone number is required.");
  });

  it("moveInDateRule rejects impossible and past dates unless allowed", () => {
    expect(moveInDateRule("2026-02-30", { today: TODAY })).toBe("Move-in date must be a valid date.");
    expect(moveInDateRule("2026-10-08", { today: TODAY })).toBe("Move-in date cannot be in the past.");
    expect(moveInDateRule("2026-10-09", { today: TODAY })).toBeUndefined();
    expect(moveInDateRule("2026-10-08", { today: TODAY, allowPast: true })).toBeUndefined();
  });
});

describe("landlord application schemas", () => {
  it("normalises a valid walk-in application", () => {
    const result = landlordApplicationCreateSchema.safeParse(validApplication);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.applicant_email).toBe("maria@example.com");
      expect(result.data.employment_info.monthly_income).toBe(45000);
      expect(result.data.message).toBeNull();
    }
  });

  it("rejects bad unit ids, NaN income, decimals beyond centavos and over-limit income", () => {
    expect(firstMessage(landlordApplicationCreateSchema.safeParse({ ...validApplication, unit_id: "unit-1" }))).toBe("Unit is invalid.");
    for (const monthly_income of ["abc", "0", "-5", "100.555", "10000001"]) {
      const result = landlordApplicationCreateSchema.safeParse({
        ...validApplication,
        employment_info: { ...validApplication.employment_info, monthly_income },
      });
      expect(result.success, monthly_income).toBe(false);
    }
  });

  it("rejects non-boolean checklist values and decimal occupant counts", () => {
    expect(landlordApplicationCreateSchema.safeParse({ ...validApplication, requirements_checklist: { valid_id: "yes" } }).success).toBe(false);
    expect(landlordApplicationCreateSchema.safeParse({ ...validApplication, occupant_count: 1.5 }).success).toBe(false);
    expect(landlordApplicationCreateSchema.safeParse({ ...validApplication, occupant_count: 0 }).success).toBe(false);
    expect(landlordApplicationCreateSchema.safeParse({ ...validApplication, occupant_count: "3" }).success).toBe(true);
  });

  it("rejects status tampering on create and blocks direct approval on update", () => {
    expect(landlordApplicationCreateSchema.safeParse({ ...validApplication, status: "approved" }).success).toBe(false);
    const update = landlordApplicationUpdateSchema.safeParse({ application_id: UNIT, status: "approved" });
    expect(firstMessage(update)).toBe("Direct approval is disabled. Move application to payment pending first.");
    expect(firstMessage(landlordApplicationUpdateSchema.safeParse({ application_id: UNIT, status: "hacked" }))).toBe("Invalid status value.");
    expect(landlordApplicationUpdateSchema.safeParse({ application_id: UNIT, status: "rejected" }).success).toBe(true);
  });
});

describe("invite application schema (public)", () => {
  const base = {
    applicant_name: "Maria Dela Cruz",
    applicant_email: "maria@example.com",
    applicant_phone: "09171234567",
    move_in_date: addDaysIso(new Date().toISOString().slice(0, 10), 10),
    emergency_contact_name: "Juan Dela Cruz",
    emergency_contact_phone: "09181112222",
    employment_info: { occupation: "Nurse", employer: "St. Luke's", monthly_income: 30000 },
  };

  it("accepts a complete submission", () => {
    expect(inviteApplicationSchema.safeParse(base).success).toBe(true);
  });

  it("requires a valid email and emergency contact", () => {
    expect(inviteApplicationSchema.safeParse({ ...base, applicant_email: "not-an-email" }).success).toBe(false);
    expect(firstMessage(inviteApplicationSchema.safeParse({ ...base, emergency_contact_phone: "" }))).toMatch(/required/);
  });

  it("rejects non-http document links and unknown requirement keys", () => {
    expect(inviteApplicationSchema.safeParse({ ...base, uploaded_documents: [{ requirementKey: "valid_id", url: "javascript:alert(1)" }] }).success).toBe(false);
    expect(inviteApplicationSchema.safeParse({ ...base, uploaded_documents: [{ requirementKey: "passport", url: "https://x.test/a.png" }] }).success).toBe(false);
  });
});

describe("invite creation schema", () => {
  const future = new Date(Date.now() + 7 * 86_400_000).toISOString();

  it("accepts a property-scoped invite", () => {
    expect(inviteCreateSchema.safeParse({ mode: "property", applicationType: "face_to_face", propertyId: PROPERTY, expiresAt: future }).success).toBe(true);
  });

  it("requires a unit for unit-scoped invites", () => {
    const result = inviteCreateSchema.safeParse({ mode: "unit", applicationType: "online", propertyId: PROPERTY, requiredRequirements: ["valid_id"], expiresAt: future });
    expect(firstMessage(result)).toBe("Unit is required for unit-scoped invites.");
  });

  it("rejects past or invalid expiry and unknown modes", () => {
    expect(firstMessage(inviteCreateSchema.safeParse({ mode: "property", applicationType: "online", propertyId: PROPERTY, expiresAt: "2020-01-01T00:00:00Z" }))).toBe("Expiration must be in the future.");
    expect(inviteExpiryRule("not a date")).toBe("Invalid expiration date.");
    expect(firstMessage(inviteCreateSchema.safeParse({ mode: "everyone", applicationType: "online", propertyId: PROPERTY }))).toBe("Invalid invite mode.");
  });

  it("requires the custom amount when 'Custom' terms are chosen and rejects negatives", () => {
    const missing = inviteCreateSchema.safeParse({ mode: "property", applicationType: "face_to_face", propertyId: PROPERTY, paymentTerms: { advanceMonths: -1, securityDepositMonths: 1 } });
    expect(firstMessage(missing)).toBe("Enter the custom advance amount.");
    const negative = inviteCreateSchema.safeParse({ mode: "property", applicationType: "face_to_face", propertyId: PROPERTY, paymentTerms: { advanceMonths: 1, securityDepositMonths: -1, customSecurityDepositAmount: -100 } });
    expect(negative.success).toBe(false);
    const decimals = inviteCreateSchema.safeParse({ mode: "property", applicationType: "face_to_face", propertyId: PROPERTY, paymentTerms: { advanceMonths: 1.5, securityDepositMonths: 1 } });
    expect(decimals.success).toBe(false);
  });
});

describe("lease date and money rules", () => {
  it("enforces end date strictly after start date (lease_dates_valid)", () => {
    expect(leaseEndDateRule("2026-10-09", "2026-10-09")).toMatch(/must be after/);
    expect(leaseEndDateRule("2026-10-08", "2026-10-09")).toMatch(/must be after/);
    expect(leaseEndDateRule("2027-10-09", "2026-10-09")).toBeUndefined();
  });

  it("flags 2-digit-year typos and impossible dates", () => {
    expect(leaseStartDateRule("0019-10-09")).toBe("Dates must include a valid 4-digit year (e.g., 2026).");
    expect(leaseStartDateRule("2026-02-30")).toMatch(/valid date/);
  });

  it("action schema validates lease_data cross-field and money rules", () => {
    const lease = { start_date: "2026-11-01", end_date: "2027-11-01", monthly_rent: 15000, security_deposit: 15000 };
    expect(applicationActionSchema.safeParse({ status: "payment_pending", lease_data: lease }).success).toBe(true);
    expect(applicationActionSchema.safeParse({ status: "payment_pending", lease_data: { ...lease, end_date: "2026-11-01" } }).success).toBe(false);
    expect(applicationActionSchema.safeParse({ status: "payment_pending", lease_data: { ...lease, monthly_rent: 0 } }).success).toBe(false);
    expect(applicationActionSchema.safeParse({ status: "payment_pending", lease_data: { ...lease, security_deposit: -1 } }).success).toBe(false);
    expect(firstMessage(applicationActionSchema.safeParse({ status: "completed" }))).toBe("Invalid application status.");
    expect(applicationActionSchema.safeParse({ status: "rejected", advance_payment: { method: "bitcoin" } }).success).toBe(false);
  });

  it("finalize schema rejects equal dates and missing signatures", () => {
    const base = { application_id: UNIT, unit_id: UNIT, lease_start: "2026-11-01", lease_end: "2027-11-01", monthly_rent: 12000, landlord_signature: "sig", tenant_signature: "sig" };
    expect(leaseFinalizeSchema.safeParse(base).success).toBe(true);
    expect(leaseFinalizeSchema.safeParse({ ...base, lease_end: base.lease_start }).success).toBe(false);
    expect(leaseFinalizeSchema.safeParse({ ...base, tenant_signature: "" }).success).toBe(false);
  });
});

describe("manual tenant schema", () => {
  const base = {
    fullName: "Lyle Cannon",
    email: "lyle@example.com",
    phone: "09123456789",
    propertyId: PROPERTY,
    unitId: UNIT,
    startDate: "2026-10-09",
    endDate: "2027-10-09",
    monthlyRent: 20000,
    securityDeposit: 20000,
  };

  it("keeps the established error messages", () => {
    expect(firstMessage(manualTenantSchema.safeParse({ ...base, endDate: "2026-07-31" }))).toBe("Lease end date must be after start date.");
    expect(firstMessage(manualTenantSchema.safeParse({ ...base, email: "nope" }))).toBe("Please enter a valid email address.");
    expect(firstMessage(manualTenantSchema.safeParse({ ...base, fullName: "Lyle 123" }))).toBe("Resident full name cannot contain numbers.");
    expect(firstMessage(manualTenantSchema.safeParse({ ...base, monthlyRent: 0 }))).toMatch(/greater than/);
  });

  it("rejects decimal month counts and negative deposits", () => {
    expect(manualTenantSchema.safeParse({ ...base, advanceMonths: 1.5 }).success).toBe(false);
    expect(manualTenantSchema.safeParse({ ...base, securityDeposit: -1 }).success).toBe(false);
  });
});

describe("renewals", () => {
  it("term months must be a whole number within range and an offered term", () => {
    expect(tenantRenewalRequestSchema.safeParse({ term_months: 12 }).success).toBe(true);
    expect(tenantRenewalRequestSchema.safeParse({ term_months: 0 }).success).toBe(false);
    expect(tenantRenewalRequestSchema.safeParse({ term_months: 6.5 }).success).toBe(false);
    expect(tenantRenewalRequestSchema.safeParse({ term_months: "abc" }).success).toBe(false);
    expect(renewalTermRule(18, [6, 12, 24])).toBe("Select one of the offered renewal terms.");
    expect(renewalTermRule(12, [6, 12, 24])).toBeUndefined();
  });

  it("new term must end after the current lease and after its own start", () => {
    expect(renewalTermDatesRule("2027-01-01", "2026-12-31", "2026-12-31")?.field).toBe("proposed_end_date");
    expect(renewalTermDatesRule("2026-06-01", "2027-06-01", "2026-12-31")?.field).toBe("proposed_start_date");
    expect(renewalTermDatesRule("2026-12-31", "2027-12-31", "2026-12-31")).toBeUndefined();
  });

  it("decision schema rejects unknown actions and bad amounts", () => {
    expect(firstMessage(renewalDecisionSchema.safeParse({ action: "maybe" }))).toMatch(/Invalid action/);
    expect(renewalDecisionSchema.safeParse({ action: "approve", proposed_monthly_rent: -1 }).success).toBe(false);
    expect(renewalDecisionSchema.safeParse({ action: "reject", landlord_notes: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("move-out", () => {
  it("requires 30 days notice and stays within the lease", () => {
    expect(moveOutDateRule("", { today: TODAY })).toBe("Requested date is required");
    expect(moveOutDateRule("2026-10-20", { today: TODAY })).toMatch(/30 days notice/);
    expect(moveOutDateRule("2026-11-08", { today: TODAY })).toBeUndefined();
    expect(moveOutDateRule("2027-12-01", { today: TODAY, leaseEndDate: "2027-06-30" })).toMatch(/after your lease end date/);
    expect(moveOutDateRule("2026-02-30", { today: TODAY })).toBe("Requested date must be a valid date.");
  });

  it("request schema normalises datetimes to a date", () => {
    const result = moveOutRequestSchema.safeParse({ requestedDate: "2099-12-31T00:00:00.000Z", reason: "  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requestedDate).toBe("2099-12-31");
      expect(result.data.reason).toBeNull();
    }
  });

  it("checklist completion understands the client's {items: [...]} shape", () => {
    expect(isMoveOutChecklistComplete({ items: [{ id: "keys", completed: true }] })).toBe(true);
    expect(isMoveOutChecklistComplete({ items: [{ id: "keys", completed: false }] })).toBe(false);
    expect(isMoveOutChecklistComplete({ items: [] })).toBe(false);
    expect(isMoveOutChecklistComplete({ keys: { completed: true }, bills: true })).toBe(true);
    expect(moveOutChecklistSchema.safeParse({ checklist_data: { keys: "done" } }).success).toBe(false);
  });

  it("inspection deductions need a description and positive amount", () => {
    expect(moveOutInspectionSchema.safeParse({ deposit_deductions: [{ description: "Broken tile", amount: 500 }] }).success).toBe(true);
    expect(moveOutInspectionSchema.safeParse({ deposit_deductions: [{ description: "", amount: 500 }] }).success).toBe(false);
    expect(moveOutInspectionSchema.safeParse({ deposit_deductions: [{ description: "Tile", amount: 0 }] }).success).toBe(false);
    expect(moveOutInspectionSchema.safeParse({ inspection_photos: ["ftp://x"] }).success).toBe(false);
    expect(moveOutInspectionSchema.safeParse({ inspection_date: "2026-13-01" }).success).toBe(false);
  });
});

describe("payments review / bypass", () => {
  it("bypass requires password and a 10+ character reason", () => {
    expect(firstMessage(paymentBypassSchema.safeParse({ password: "", reason: "long enough reason" }))).toBe("Password is required for bypass.");
    expect(firstMessage(paymentBypassSchema.safeParse({ password: "secret", reason: "short" }))).toMatch(/at least 10/);
  });

  it("review rejects unknown actions and malformed amounts", () => {
    expect(firstMessage(paymentReviewSchema.safeParse({ action: "approve_all" }))).toBe("Invalid review action.");
    expect(paymentReviewSchema.safeParse({ action: "request_shortfall", amount: "12.345" }).success).toBe(false);
    expect(paymentReviewSchema.safeParse({ action: "request_shortfall", amount: "1500.50", refundProofUrl: "GCASH-123" }).success).toBe(true);
  });
});

describe("list query filters", () => {
  it("accepts comma lists and 'all', rejects junk", () => {
    expect(landlordLeaseListQuerySchema.safeParse({ status: "active,expiring_soon", propertyId: "all" }).success).toBe(true);
    expect(landlordLeaseListQuerySchema.safeParse({ status: "active;drop" }).success).toBe(false);
    expect(landlordLeaseListQuerySchema.safeParse({ unitId: "unit-1" }).success).toBe(false);
  });
});

describe("wizard step validation (client)", () => {
  const form = {
    applicant_name: "Maria Dela Cruz",
    applicant_phone: "09171234567",
    applicant_email: "maria@example.com",
    move_in_date: "2020-01-01",
    emergency_contact_name: "Juan Dela Cruz",
    emergency_contact_phone: "09181112222",
    employment_info: { ...DEFAULT_EMPLOYMENT, occupation: "Engineer", employer: "Stark", monthly_income: "45,000" },
    requirements_checklist: { ...DEFAULT_CHECKLIST },
    message: "",
  };

  it("blocks a past move-in date on new applications but allows it when editing", () => {
    expect(validateFormStep(0, UNIT, form).move_in_date).toBe("Move-in date cannot be in the past.");
    expect(validateFormStep(0, UNIT, form, { allowPastMoveIn: true }).move_in_date).toBeUndefined();
  });

  it("uses the same income rule as the API", () => {
    expect(validateFormStep(1, UNIT, { ...form, employment_info: { ...form.employment_info, monthly_income: "1.234" } }).monthly_income).toMatch(/2 decimal/);
    expect(validateFormStep(1, UNIT, form).monthly_income).toBeUndefined();
  });

  it("maps API fieldErrors onto wizard steps", () => {
    const mapped = mapApplicationFieldErrors({ "employment_info.monthly_income": "Monthly income is required." });
    expect(mapped.errors.monthly_income).toBe("Monthly income is required.");
    expect(mapped.firstStep).toBe(1);
    expect(mapApplicationFieldErrors({ applicant_email: "bad" }).firstStep).toBe(0);
    expect(mapApplicationFieldErrors(undefined).firstStep).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Route-level: malformed payloads are rejected with 400 before any DB access
// ---------------------------------------------------------------------------

const mockRequireAuth = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuth(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockAdminFrom, auth: { admin: {} } }),
  createServiceRoleSupabaseClient: () => ({ from: mockAdminFrom, auth: { admin: {} } }),
}));

function jsonRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("route boundaries reject bad payloads with 400 + fieldErrors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ userId: "landlord-1", userEmail: "l@example.com", supabase: { from: mockAdminFrom } });
  });

  it("POST /api/landlord/applications/tenant-application rejects invalid email and income", async () => {
    const { POST } = await import("@/app/api/landlord/applications/tenant-application/route");
    const res = await POST(jsonRequest({ ...validApplication, applicant_email: "nope", employment_info: { occupation: "Eng", employer: "Co", monthly_income: "NaN" } }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.fieldErrors.applicant_email).toBeTruthy();
    expect(json.fieldErrors["employment_info.monthly_income"]).toBeTruthy();
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("POST /api/landlord/applications/walk-in rejects malformed JSON", async () => {
    const { POST } = await import("@/app/api/landlord/applications/walk-in/route");
    const res = await POST(jsonRequest("{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Request body must be valid JSON.");
  });

  it("POST /api/landlord/invites rejects a past expiry", async () => {
    const { POST } = await import("@/app/api/landlord/invites/route");
    const res = await POST(jsonRequest({ mode: "property", applicationType: "face_to_face", propertyId: PROPERTY, expiresAt: "2001-01-01T00:00:00Z" }));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.expiresAt).toBe("Expiration must be in the future.");
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("POST /api/landlord/lease/finalize rejects end date on/before start", async () => {
    const { POST } = await import("@/app/api/landlord/lease/finalize/route");
    const res = await POST(jsonRequest({ application_id: UNIT, unit_id: UNIT, lease_start: "2026-11-01", lease_end: "2026-11-01", monthly_rent: 10000, landlord_signature: "a", tenant_signature: "b" }));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.lease_end).toMatch(/after/);
  });

  it("POST /api/landlord/applications/[id]/payment-bypass rejects a short reason", async () => {
    const { POST } = await import("@/app/api/landlord/applications/[applicationId]/payment-bypass/route");
    const res = await POST(jsonRequest({ password: "secret", reason: "cash" }), { params: Promise.resolve({ applicationId: UNIT }) });
    expect(res.status).toBe(400);
    expect(mockAdminFrom).not.toHaveBeenCalled();
  });

  it("POST /api/landlord/applications/[id]/actions returns 404 for a non-id param", async () => {
    const { POST } = await import("@/app/api/landlord/applications/[applicationId]/actions/route");
    const res = await POST(jsonRequest({ status: "reviewing" }), { params: Promise.resolve({ applicationId: "abc" }) });
    expect(res.status).toBe(404);
  });

  it("POST /api/landlord/move-out/[id]/inspection rejects a zero-amount deduction", async () => {
    const { POST } = await import("@/app/api/landlord/move-out/[id]/inspection/route");
    const res = await POST(jsonRequest({ deposit_deductions: [{ description: "Tile", amount: 0 }] }), { params: Promise.resolve({ id: UNIT }) });
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors["deposit_deductions.0.amount"]).toMatch(/greater than/);
  });
});
