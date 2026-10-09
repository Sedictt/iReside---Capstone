import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    amenityNameRule,
    batchRenameSchema,
    findDuplicateName,
    flyerTemplateSaveSchema,
    floorConfigCreateSchema,
    gcashSettingsSchema,
    houseRuleTextRule,
    imageUploadRule,
    propertyCreateSchema,
    propertyUpdateSchema,
    renewalAdjustmentRule,
    renewalSettingsPatchSchema,
    sniffImageMime,
    unitConfigSchema,
    unitFloorSchema,
    unitMapSaveSchema,
    unitStatusSchema,
    utilityConfigItemSchema,
    PROPERTY_LIMITS,
} from "@/lib/validation/schemas/properties.schema";

// ---------------------------------------------------------------------------
// Route mocks (hoisted). Routes are imported lazily inside the route tests.
// ---------------------------------------------------------------------------

const mockRequireAuthenticatedUser = vi.fn();

vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
    requireRole: (ctx: { userRole: string }, ...roles: string[]) => {
        if (!roles.includes(ctx.userRole)) {
            throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
        }
        return ctx;
    },
}));

const mockAdminFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
    createServiceRoleSupabaseClient: () => ({ from: mockAdminFrom }),
    createAdminClient: () => ({ from: mockAdminFrom }),
}));

const PROPERTY_ID = "8d0f7a52-5d7a-4b8e-9d55-0f4f8a0c1b11";
const UNIT_ID = "1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d";

const validProperty = {
    name: "Sunrise Apartments",
    address: "123 MacArthur Highway, Karuhatan, Valenzuela City",
    type: "apartment",
    total_units: "12",
    total_floors: "3",
    base_rent_amount: 6500,
    description: "",
    amenities: ["Wi-Fi", "Parking"],
    house_rules: ["No Smoking"],
    images: [],
    contract_mode: "generate",
    contract_file: null,
    occupancy_limit: "4",
    utility_billing: "fixed_charge",
    unit_prefix: "Unit",
    numbering_style: "floor_based",
    starting_number: 101,
};

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
    result.success ? undefined : result.error?.issues[0]?.message;

// ---------------------------------------------------------------------------
// Property create / update
// ---------------------------------------------------------------------------

describe("propertyCreateSchema", () => {
    it("accepts a valid wizard payload and coerces numeric strings", () => {
        const parsed = propertyCreateSchema.parse(validProperty);
        expect(parsed.total_units).toBe(12);
        expect(parsed.total_floors).toBe(3);
        expect(parsed.occupancy_limit).toBe(4);
        expect(parsed.name).toBe("Sunrise Apartments");
    });

    it("applies the previous defaults when optional fields are omitted", () => {
        const parsed = propertyCreateSchema.parse({ name: "A", address: "B", base_rent_amount: 1 });
        expect(parsed).toMatchObject({
            type: "apartment",
            total_units: 1,
            total_floors: 1,
            occupancy_limit: 5,
            utility_billing: "fixed_charge",
            numbering_style: "floor_based",
            starting_number: 101,
            amenities: [],
            house_rules: [],
            images: [],
        });
    });

    it("rejects whitespace-only and over-long names", () => {
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, name: "   " }))).toBe("Property name is required.");
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, name: "x".repeat(61) }))).toBe(
            "Property name cannot exceed 60 characters."
        );
        expect(propertyCreateSchema.safeParse({ ...validProperty, name: "x".repeat(60) }).success).toBe(true);
    });

    it("trims name and address", () => {
        const parsed = propertyCreateSchema.parse({ ...validProperty, name: "  Villa Teresa  ", address: "  Street 1 " });
        expect(parsed.name).toBe("Villa Teresa");
        expect(parsed.address).toBe("Street 1");
    });

    it.each([
        ["total_units", "0", "Total units must be at least 1."],
        ["total_units", "100", "Total units cannot exceed 99."],
        ["total_units", "2.5", "Total units must be a whole number."],
        ["total_units", "abc", "Total units must be a number."],
        ["total_floors", 0, "Number of floors must be at least 1."],
        ["occupancy_limit", 100, "Max tenants per room cannot exceed 99."],
        ["starting_number", 10000, "Starting number cannot exceed 9999."],
    ])("rejects %s=%s", (field, value, message) => {
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, [field]: value }))).toBe(message);
    });

    it("requires a positive rent with at most 2 decimals", () => {
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, base_rent_amount: 0 }))).toBe(
            "Monthly rent must be greater than ₱0."
        );
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, base_rent_amount: -5 }))).toMatch(/greater than/);
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, base_rent_amount: 10.555 }))).toBe(
            "Monthly rent can have at most 2 decimal places."
        );
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, base_rent_amount: 100_000_000 }))).toMatch(/cannot exceed/);
        expect(propertyCreateSchema.safeParse({ ...validProperty, base_rent_amount: "6,500.50" }).success).toBe(true);
    });

    it("rejects unknown enum values", () => {
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, type: "castle" }))).toBe("Select a valid property type.");
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, utility_billing: "free" }))).toBe(
            "Select a valid utility billing method."
        );
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, numbering_style: "roman" }))).toBe(
            "Select a valid numbering style."
        );
    });

    it("rejects duplicate (case-insensitive) amenities and house rules", () => {
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, amenities: ["Wi-Fi", "wi-fi"] }))).toBe(
            'Amenity "wi-fi" is listed more than once.'
        );
        expect(firstError(propertyCreateSchema.safeParse({ ...validProperty, house_rules: ["No pets", " NO PETS "] }))).toMatch(
            /listed more than once/
        );
    });

    it("rejects non-http image URLs and too many images", () => {
        expect(propertyCreateSchema.safeParse({ ...validProperty, images: ["javascript:alert(1)"] }).success).toBe(false);
        const many = Array.from({ length: PROPERTY_LIMITS.maxImages + 1 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
        expect(propertyCreateSchema.safeParse({ ...validProperty, images: many }).success).toBe(false);
    });
});

describe("propertyUpdateSchema", () => {
    it("allows name/address to be omitted but never blanked", () => {
        const { name: _n, address: _a, ...rest } = validProperty;
        expect(propertyUpdateSchema.safeParse(rest).success).toBe(true);
        expect(firstError(propertyUpdateSchema.safeParse({ ...rest, name: "  " }))).toBe("Property name is required.");
    });
});

// ---------------------------------------------------------------------------
// Renewal settings
// ---------------------------------------------------------------------------

describe("renewal settings", () => {
    const base = { base_rent_adjustment: 5, adjustment_type: "percentage", new_rules: [], landlord_memo: "", is_enabled: true };

    it("accepts valid settings and coerces the adjustment", () => {
        const parsed = renewalSettingsPatchSchema.parse({ settings: { ...base, base_rent_adjustment: "7.5" } });
        expect(parsed.settings.base_rent_adjustment).toBe(7.5);
    });

    it("bounds percentage increases to 0–100", () => {
        expect(renewalAdjustmentRule(100, "percentage")).toBeUndefined();
        expect(renewalAdjustmentRule(100.01, "percentage")).toBe("Increase cannot exceed 100%.");
        expect(renewalAdjustmentRule(-1, "percentage")).toBe("Increase cannot be negative.");
        expect(renewalAdjustmentRule("", "percentage")).toBe("Increase is required.");
    });

    it("validates fixed increases as money", () => {
        expect(renewalAdjustmentRule(500, "fixed")).toBeUndefined();
        expect(renewalAdjustmentRule(500.123, "fixed")).toBe("Increase can have at most 2 decimal places.");
        expect(renewalAdjustmentRule(-10, "fixed")).toBe("Increase cannot be negative.");
    });

    it("reports the adjustment error on its field path", () => {
        const result = renewalSettingsPatchSchema.safeParse({ settings: { ...base, base_rent_adjustment: 150 } });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(["settings", "base_rent_adjustment"]);
    });

    it("rejects duplicate rules, long memos and unknown adjustment types", () => {
        expect(renewalSettingsPatchSchema.safeParse({ settings: { ...base, new_rules: ["A", "a"] } }).success).toBe(false);
        expect(renewalSettingsPatchSchema.safeParse({ settings: { ...base, landlord_memo: "x".repeat(501) } }).success).toBe(false);
        expect(renewalSettingsPatchSchema.safeParse({ settings: { ...base, adjustment_type: "compound" } }).success).toBe(false);
        expect(renewalSettingsPatchSchema.safeParse({ settings: { ...base, new_rules: ["   "] } }).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Units & unit map
// ---------------------------------------------------------------------------

describe("unit schemas", () => {
    it("restricts unit status to the enum", () => {
        expect(unitStatusSchema.safeParse({ status: "occupied" }).success).toBe(true);
        expect(firstError(unitStatusSchema.safeParse({ status: "demolished" }))).toBe("Select a valid unit status.");
    });

    it("unit config: baths must be whole numbers (integer column)", () => {
        expect(firstError(unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, unitId: UNIT_ID, baths: 2.5 }))).toBe(
            "Baths must be a whole number."
        );
        expect(unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, unitId: UNIT_ID, baths: 2, beds: 3, sqft: null }).success).toBe(true);
    });

    it("unit config: requires unitId unless applying to all", () => {
        const result = unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, beds: 1 });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(["unitId"]);
        expect(unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, applyToAll: true, beds: 1 }).success).toBe(true);
    });

    it("unit config: rejects out-of-range values and non-UUID ids", () => {
        expect(unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, applyToAll: true, beds: 100 }).success).toBe(false);
        expect(unitConfigSchema.safeParse({ propertyId: PROPERTY_ID, applyToAll: true, areaSqm: -1 }).success).toBe(false);
        expect(unitConfigSchema.safeParse({ propertyId: "not-a-uuid", applyToAll: true }).success).toBe(false);
    });

    it("unit floor: 0 (ground) to 99, whole numbers only", () => {
        expect(unitFloorSchema.parse({ floor: 0 })).toEqual({ floor: 0, autoRenumber: true });
        expect(unitFloorSchema.safeParse({ floor: -1 }).success).toBe(false);
        expect(unitFloorSchema.safeParse({ floor: 100 }).success).toBe(false);
        expect(unitFloorSchema.safeParse({ floor: 1.5 }).success).toBe(false);
        expect(unitFloorSchema.safeParse({}).success).toBe(false);
    });

    it("floor config create: validates floor number", () => {
        expect(floorConfigCreateSchema.safeParse({ propertyId: PROPERTY_ID, floorNumber: 3 }).success).toBe(true);
        expect(floorConfigCreateSchema.safeParse({ propertyId: PROPERTY_ID, floorNumber: "abc" }).success).toBe(false);
        expect(floorConfigCreateSchema.safeParse({ propertyId: PROPERTY_ID, floorNumber: 3, displayName: "x".repeat(41) }).success).toBe(false);
    });

    it("batch rename: defaults and limits", () => {
        expect(batchRenameSchema.parse({ propertyId: PROPERTY_ID })).toEqual({
            propertyId: PROPERTY_ID,
            prefix: "Unit",
            numberingStyle: "floor_based",
            startingNumber: 101,
        });
        expect(batchRenameSchema.safeParse({ propertyId: PROPERTY_ID, prefix: "x".repeat(11) }).success).toBe(false);
        expect(batchRenameSchema.safeParse({ propertyId: PROPERTY_ID, startingNumber: 0 }).success).toBe(false);
        expect(batchRenameSchema.safeParse({ propertyId: PROPERTY_ID, prefix: "" }).success).toBe(true);
    });

    it("unit map save: coordinates must be finite numbers", () => {
        const position = { unitId: UNIT_ID, floorKey: "floor1", x: 10, y: 20, w: 200, h: 140 };
        expect(unitMapSaveSchema.safeParse({ propertyId: PROPERTY_ID, positions: [position] }).success).toBe(true);
        expect(unitMapSaveSchema.safeParse({ propertyId: PROPERTY_ID, positions: [{ ...position, x: "10" }] }).success).toBe(false);
        expect(unitMapSaveSchema.safeParse({ propertyId: PROPERTY_ID, positions: [{ ...position, x: 5e7 }] }).success).toBe(false);
        expect(
            unitMapSaveSchema.safeParse({ propertyId: PROPERTY_ID, positions: [{ ...position, metadata: { baths: 1.5 } }] }).success
        ).toBe(false);
    });

    it("findDuplicateName is case- and whitespace-insensitive", () => {
        expect(findDuplicateName(["Unit 101", "Unit 102"])).toBeUndefined();
        expect(findDuplicateName(["Unit 101", " unit 101 "])).toBe("unit 101");
    });
});

// ---------------------------------------------------------------------------
// Amenities / rules
// ---------------------------------------------------------------------------

describe("custom amenity and rule rules", () => {
    it("amenityNameRule enforces length and duplicates", () => {
        expect(amenityNameRule("a")).toBe("Amenity name must be at least 2 characters.");
        expect(amenityNameRule("x".repeat(41))).toBe("Amenity name cannot exceed 40 characters.");
        expect(amenityNameRule("wi-fi")).toBe('"Wi-fi" is already included in standard amenities.');
        expect(amenityNameRule("sauna", ["Sauna"])).toBe('"Sauna" is already in your custom amenities list.');
        expect(amenityNameRule("Rooftop Lounge")).toBeUndefined();
    });

    it("houseRuleTextRule enforces length and duplicates", () => {
        expect(houseRuleTextRule("ab")).toBe("Rule text must be at least 3 characters.");
        expect(houseRuleTextRule("no smoking")).toBe('"No smoking" is already included in standard rules.');
        expect(houseRuleTextRule("No videoke after 10pm")).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Payment settings
// ---------------------------------------------------------------------------

describe("payment settings", () => {
    it("gcash: validates account name and PH mobile number", () => {
        const ok = gcashSettingsSchema.parse({ accountName: " Marina Reyes ", accountNumber: "0917 123 4567", isEnabled: "true", removeQr: null });
        expect(ok).toEqual({ accountName: "Marina Reyes", accountNumber: "09171234567", isEnabled: true, removeQr: false });
        expect(gcashSettingsSchema.safeParse({ accountName: "M", accountNumber: "09171234567" }).success).toBe(false);
        expect(gcashSettingsSchema.safeParse({ accountName: "Marina <b>", accountNumber: "09171234567" }).success).toBe(false);
        expect(gcashSettingsSchema.safeParse({ accountName: "Marina", accountNumber: "08171234567" }).success).toBe(false);
        expect(gcashSettingsSchema.safeParse({ accountName: "Marina", accountNumber: "0917123456" }).success).toBe(false);
        expect(gcashSettingsSchema.safeParse({ accountName: "Marina", accountNumber: "09171234567", isEnabled: "maybe" }).success).toBe(false);
    });

    const config = {
        property_id: PROPERTY_ID,
        unit_id: null,
        utility_type: "water",
        billing_mode: "tenant_paid",
        rate_per_unit: 25.5,
        unit_label: "cubic_meter",
        is_active: true,
        effective_from: "2026-10-01",
        effective_to: null,
        note: null,
    };

    it("utility config: accepts a valid row", () => {
        expect(utilityConfigItemSchema.safeParse(config).success).toBe(true);
        expect(utilityConfigItemSchema.safeParse({ ...config, unit_id: "" }).success).toBe(true);
    });

    it("utility config: enforces the DB unit label pairing", () => {
        expect(firstError(utilityConfigItemSchema.safeParse({ ...config, unit_label: "kwh" }))).toBe("Unit does not match the utility type.");
    });

    it("utility config: rejects bad rates, dates and ids", () => {
        expect(utilityConfigItemSchema.safeParse({ ...config, rate_per_unit: -1 }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, rate_per_unit: 1.234 }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, effective_from: "2026-02-30" }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, effective_to: "2026-09-01" }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, property_id: "x" }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, id: "not-a-uuid" }).success).toBe(false);
        expect(utilityConfigItemSchema.safeParse({ ...config, utility_type: "gas" }).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Flyer + uploads
// ---------------------------------------------------------------------------

describe("flyer template", () => {
    it("accepts default and owned-property keys", () => {
        expect(flyerTemplateSaveSchema.safeParse({ template: { propertyName: "A" } }).success).toBe(true);
        expect(flyerTemplateSaveSchema.safeParse({ propertyId: PROPERTY_ID, template: {} }).success).toBe(true);
        expect(flyerTemplateSaveSchema.safeParse({ propertyId: "other", template: {} }).success).toBe(false);
    });

    it("rejects missing templates, unsafe backgrounds and oversized designs", () => {
        expect(flyerTemplateSaveSchema.safeParse({ propertyId: "default" }).success).toBe(false);
        expect(flyerTemplateSaveSchema.safeParse({ template: { customBgImage: "javascript:alert(1)" } }).success).toBe(false);
        expect(flyerTemplateSaveSchema.safeParse({ template: { customBgImage: "https://cdn.example.com/bg.jpg" } }).success).toBe(true);
        expect(flyerTemplateSaveSchema.safeParse({ template: { blob: "x".repeat(PROPERTY_LIMITS.maxFlyerTemplateBytes) } }).success).toBe(false);
    });
});

describe("image uploads", () => {
    const MB = 1024 * 1024;

    it("imageUploadRule checks type, extension and size", () => {
        expect(imageUploadRule({ name: "a.jpg", type: "image/jpeg", size: 1000 }, { maxBytes: MB })).toBeUndefined();
        expect(imageUploadRule({ name: "a.svg", type: "image/svg+xml", size: 1000 }, { maxBytes: MB })).toMatch(/must be PNG/);
        expect(imageUploadRule({ name: "a.php", type: "image/jpeg", size: 1000 }, { maxBytes: MB })).toMatch(/must be PNG/);
        expect(imageUploadRule({ name: "a.png", type: "image/png", size: 2 * MB }, { maxBytes: MB })).toMatch(/size limit/);
        expect(imageUploadRule({ name: "a.png", type: "image/png", size: 0 }, { maxBytes: MB })).toMatch(/empty/);
    });

    it("sniffImageMime recognises real image signatures only", () => {
        expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
        expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
        const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
        expect(sniffImageMime(webp)).toBe("image/webp");
        expect(sniffImageMime(new TextEncoder().encode("<svg xmlns="))).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Route-level checks: bad payloads never reach the database
// ---------------------------------------------------------------------------

function jsonRequest(url: string, method: string, body: unknown) {
    return new Request(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });
}

describe("route validation", () => {
    const supabaseFrom = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        supabaseFrom.mockImplementation(() => {
            throw new Error("database must not be reached for invalid input");
        });
        mockAdminFrom.mockImplementation(() => {
            throw new Error("database must not be reached for invalid input");
        });
        mockRequireAuthenticatedUser.mockResolvedValue({
            userId: "landlord-1",
            userRole: "landlord",
            supabase: { from: supabaseFrom },
        });
    });

    it("POST /api/landlord/properties → 400 with field errors", async () => {
        const { POST } = await import("@/app/api/landlord/properties/route");
        const res = await POST(jsonRequest("http://localhost/api/landlord/properties", "POST", { ...validProperty, total_units: "1.5" }));
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Total units must be a whole number.");
        expect(body.fieldErrors).toEqual({ total_units: "Total units must be a whole number." });
    });

    it("POST /api/landlord/properties → 400 on malformed JSON", async () => {
        const { POST } = await import("@/app/api/landlord/properties/route");
        const res = await POST(jsonRequest("http://localhost/api/landlord/properties", "POST", "{not json"));
        expect(res.status).toBe(400);
    });

    it("POST /api/landlord/properties → 403 for tenants", async () => {
        mockRequireAuthenticatedUser.mockResolvedValue({ userId: "t-1", userRole: "tenant", supabase: { from: supabaseFrom } });
        const { POST } = await import("@/app/api/landlord/properties/route");
        const res = await POST(jsonRequest("http://localhost/api/landlord/properties", "POST", validProperty));
        expect(res.status).toBe(403);
    });

    it("POST /api/landlord/properties → 409 on duplicate name + address", async () => {
        supabaseFrom.mockImplementation(() => ({
            select: () => ({
                eq: () => Promise.resolve({ data: [{ id: "p-1", name: "sunrise  apartments", address: validProperty.address.toUpperCase() }], error: null }),
            }),
        }));
        const { POST } = await import("@/app/api/landlord/properties/route");
        const res = await POST(jsonRequest("http://localhost/api/landlord/properties", "POST", validProperty));
        expect(res.status).toBe(409);
    });

    it("PUT /api/landlord/properties/[id] → 400 for a non-UUID id", async () => {
        const { PUT } = await import("@/app/api/landlord/properties/[id]/route");
        const res = await PUT(jsonRequest("http://localhost/x", "PUT", validProperty), { params: Promise.resolve({ id: "abc" }) });
        expect(res.status).toBe(400);
    });

    it("PATCH renewal-settings → 400 for a 150% increase", async () => {
        const { PATCH } = await import("@/app/api/landlord/properties/[id]/renewal-settings/route");
        const res = await PATCH(
            jsonRequest("http://localhost/x", "PATCH", { settings: { base_rent_adjustment: 150, adjustment_type: "percentage" } }),
            { params: Promise.resolve({ id: PROPERTY_ID }) }
        );
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.fieldErrors["settings.base_rent_adjustment"]).toBe("Increase cannot exceed 100%.");
    });

    it("PATCH units/[id]/status → 400 for unknown status", async () => {
        const { PATCH } = await import("@/app/api/landlord/units/[id]/status/route");
        const res = await PATCH(jsonRequest("http://localhost/x", "PATCH", { status: "demolished" }) as any, {
            params: Promise.resolve({ id: UNIT_ID }),
        });
        expect(res.status).toBe(400);
    });

    it("POST unit-map/config → 400 for fractional baths", async () => {
        const { POST } = await import("@/app/api/landlord/unit-map/config/route");
        const res = await POST(
            jsonRequest("http://localhost/x", "POST", { propertyId: PROPERTY_ID, unitId: UNIT_ID, baths: 2.5 }) as any
        );
        expect(res.status).toBe(400);
    });

    it("PUT unit-map/floor-configs → 403 when the property is not owned", async () => {
        supabaseFrom.mockImplementation((table: string) => {
            if (table !== "properties") throw new Error(`unexpected table ${table}`);
            return {
                select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
            };
        });
        const { PUT } = await import("@/app/api/landlord/unit-map/floor-configs/route");
        const res = await PUT(jsonRequest("http://localhost/x", "PUT", { propertyId: PROPERTY_ID, floorNumber: 2 }) as any);
        expect(res.status).toBe(403);
    });

    it("POST unit-map/batch-rename → 400 for an out-of-range starting number", async () => {
        const { POST } = await import("@/app/api/landlord/unit-map/batch-rename/route");
        const res = await POST(
            jsonRequest("http://localhost/x", "POST", { propertyId: PROPERTY_ID, numberingStyle: "sequential", startingNumber: 0 }) as any
        );
        expect(res.status).toBe(400);
    });
});
