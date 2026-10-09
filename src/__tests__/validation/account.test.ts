// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  accountClaimSchema,
  avatarAppearanceSchema,
  checkImageUpload,
  currentPasswordRule,
  escapeLikePattern,
  IMAGE_UPLOAD_POLICIES,
  imageReferenceRule,
  landlordProfilePatchSchema,
  passwordResetOtpVerifySchema,
  passwordResetSchema,
  securityKeyRecoverSchema,
  securityKeyRule,
  sessionRevokeSchema,
  sniffImageKind,
  tenantProfilePatchSchema,
  twoFactorActionSchema,
  twoFactorChallengeSchema,
} from "@/lib/validation/schemas/account.schema";
import { loginSchema, changePasswordSchema } from "@/lib/validation/schemas/auth.schema";
import { setupLaunchSchema } from "@/lib/validation/brand-setup";

const UUID = "3e4f5a6b-7c8d-4e9f-8a1b-2c3d4e5f6a7c";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

describe("password policy", () => {
  it("new-password flows require 8+ chars with letters and a number/symbol", () => {
    const base = { email: "a@b.co", resetToken: "tok" };
    expect(passwordResetSchema.safeParse({ ...base, newPassword: "abc12" }).success).toBe(false);
    expect(passwordResetSchema.safeParse({ ...base, newPassword: "abcdefgh" }).success).toBe(false);
    expect(passwordResetSchema.safeParse({ ...base, newPassword: "abcdefg1" }).success).toBe(true);
    expect(passwordResetSchema.safeParse({ ...base, newPassword: "a1".repeat(37) }).success).toBe(false); // 74 > 72
    expect(changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "short1" }).success).toBe(false);
  });

  it("login only requires a password (no strength rules)", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "123" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(currentPasswordRule("")).toBe("Password is required.");
    expect(currentPasswordRule("abc")).toBeUndefined();
  });

  it("account claim requires matching confirmation (cross-field)", () => {
    const base = { fullName: "Juan Dela Cruz", newEmail: "Juan@Example.com", otp: "123456", newPassword: "Secure123!" };
    const mismatch = accountClaimSchema.safeParse({ ...base, confirmPassword: "Secure123?" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(["confirmPassword"]);
    const ok = accountClaimSchema.safeParse({ ...base, confirmPassword: "Secure123!" });
    expect(ok.success && ok.data.newEmail).toBe("juan@example.com");
  });

  it("setup launch accepts the unchanged placeholder but rejects weak new passwords", () => {
    const branding = { propertyName: "Acme Lofts", primaryColor: "#112233", secondaryColor: "#445566" };
    expect(setupLaunchSchema.safeParse({ branding, admin: { password: "••••••••••••" } }).success).toBe(true);
    expect(setupLaunchSchema.safeParse({ branding, admin: { password: "abc123" } }).success).toBe(false);
    expect(setupLaunchSchema.safeParse({ branding, admin: { password: "abcdef12" } }).success).toBe(true);
  });
});

describe("OTP and security key", () => {
  it("accepts exactly 6 digits", () => {
    const ok = (otp: unknown) => passwordResetOtpVerifySchema.safeParse({ email: "a@b.co", otp }).success;
    expect(ok("123456")).toBe(true);
    expect(ok(" 123456 ")).toBe(true);
    expect(ok("12345")).toBe(false);
    expect(ok("1234567")).toBe(false);
    expect(ok("12a456")).toBe(false);
    expect(ok(123456)).toBe(false);
  });

  it("security key must be 16 characters after removing separators", () => {
    expect(securityKeyRule("ABCD-EFGH-JKMN-PQRS")).toBeUndefined();
    expect(securityKeyRule("ABCD-EFGH")).toMatch(/16-character/);
    const parsed = securityKeyRecoverSchema.safeParse({ email: "A@B.co", securityKey: "abcd-efgh-jkmn-pqrs", newPassword: "Secure123!", newEmail: "" });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.newEmail).toBeNull();
    expect(securityKeyRecoverSchema.safeParse({ email: "a@b.co", securityKey: "abcd-efgh-jkmn-pqrs", newPassword: "Secure123!", newEmail: "bad" }).success).toBe(false);
  });
});

describe("2FA and sessions", () => {
  it("rejects non-UUID user ids and unknown actions", () => {
    expect(twoFactorChallengeSchema.safeParse({ userId: "user-1" }).success).toBe(false);
    expect(twoFactorChallengeSchema.safeParse({ userId: UUID, resend: true }).success).toBe(true);
    expect(twoFactorActionSchema.safeParse({ action: "delete-everything" }).success).toBe(false);
    expect(twoFactorActionSchema.safeParse({ action: "verify-otp", otp: "12" }).success).toBe(false);
    expect(twoFactorActionSchema.safeParse({ action: "disable", password: "" }).success).toBe(false);
    expect(twoFactorActionSchema.safeParse({ action: "disable", password: "anything" }).success).toBe(true);
  });

  it("session revoke needs a UUID or a known scope", () => {
    expect(sessionRevokeSchema.safeParse({}).success).toBe(false);
    expect(sessionRevokeSchema.safeParse({ sessionId: "abc" }).success).toBe(false);
    expect(sessionRevokeSchema.safeParse({ scope: "everyone" }).success).toBe(false);
    expect(sessionRevokeSchema.safeParse({ scope: "others" }).success).toBe(true);
    expect(sessionRevokeSchema.safeParse({ sessionId: UUID }).success).toBe(true);
  });
});

describe("profile schemas", () => {
  it("tenant profile: absent fields stay absent, blank phone clears, bad phone rejected", () => {
    const onlyFlag = tenantProfilePatchSchema.parse({ has_changed_password: true });
    expect(onlyFlag.phone).toBeUndefined();
    expect(onlyFlag.address).toBeUndefined();
    expect(tenantProfilePatchSchema.parse({ phone: "" }).phone).toBeNull();
    expect(tenantProfilePatchSchema.safeParse({ phone: "0917-12" }).success).toBe(false);
    expect(tenantProfilePatchSchema.safeParse({ full_name: "   " }).success).toBe(false);
    expect(tenantProfilePatchSchema.safeParse({ bio: "x".repeat(501) }).success).toBe(false);
    expect(tenantProfilePatchSchema.safeParse({ has_changed_password: "yes" }).success).toBe(false);
  });

  it("landlord profile mirrors the settings form rules", () => {
    expect(landlordProfilePatchSchema.safeParse({ full_name: "Juan Dela Cruz", phone: "09171234567", website: "example.com" }).success).toBe(true);
    expect(landlordProfilePatchSchema.safeParse({ website: "not a site" }).success).toBe(false);
    expect(landlordProfilePatchSchema.safeParse({ business_permit_number: "<script>" }).success).toBe(false);
    expect(landlordProfilePatchSchema.safeParse({ socials: { instagram: "javascript:alert(1)" } }).success).toBe(false);
    expect(landlordProfilePatchSchema.parse({ email: " Owner@Example.COM " }).email).toBe("owner@example.com");
    // Blank email keeps the stored address (route ignores it).
    expect(landlordProfilePatchSchema.safeParse({ email: "" }).success).toBe(true);
  });

  it("avatar appearance: only colors and http(s)/app-path URLs; absent url untouched", () => {
    expect(avatarAppearanceSchema.parse({ avatar_bg_color: "#8B5CF6" }).avatar_url).toBeUndefined();
    expect(avatarAppearanceSchema.safeParse({ avatar_url: "javascript:alert(1)" }).success).toBe(false);
    expect(avatarAppearanceSchema.safeParse({ avatar_bg_color: "red; background:url(x)" }).success).toBe(false);
    expect(avatarAppearanceSchema.safeParse({ avatar_url: "https://cdn.example.com/a.png" }).success).toBe(true);
  });

  it("brand image references allow data URLs only when enabled", () => {
    expect(imageReferenceRule("data:image/png;base64,iVBORw0KGgo=", { allowDataUrl: true })).toBeUndefined();
    expect(imageReferenceRule("data:image/png;base64,iVBORw0KGgo=")).toBeDefined();
    expect(imageReferenceRule("data:text/html;base64,PHNjcmlwdD4=", { allowDataUrl: true })).toBeDefined();
    expect(imageReferenceRule("//evil.example/x.png")).toBeDefined();
    expect(imageReferenceRule("/images/banner.jpg")).toBeUndefined();
  });

  it("escapes LIKE wildcards in email lookups", () => {
    expect(escapeLikePattern("john_doe%@x.com")).toBe("john\\_doe\\%@x.com");
  });
});

describe("image upload content checks", () => {
  const file = (name: string, size: number) => ({ name, size, type: "image/png" });

  it("sniffs the real format from the bytes", () => {
    expect(sniffImageKind(PNG)).toBe("png");
    expect(sniffImageKind(JPEG)).toBe("jpeg");
    expect(sniffImageKind(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBe("svg");
    expect(sniffImageKind(new TextEncoder().encode("<html>hi</html>"))).toBeNull();
  });

  it("rejects spoofed, mismatched, oversized and unsafe files", () => {
    expect(checkImageUpload(file("a.png", 16), new TextEncoder().encode("not an image!!!!"), IMAGE_UPLOAD_POLICIES.avatar).ok).toBe(false);
    expect(checkImageUpload(file("a.png", JPEG.length), JPEG, IMAGE_UPLOAD_POLICIES.avatar).ok).toBe(false); // extension mismatch
    expect(checkImageUpload(file("a.html", PNG.length), PNG, IMAGE_UPLOAD_POLICIES.avatar).ok).toBe(false);
    expect(checkImageUpload(file("a.png", 6 * 1024 * 1024), PNG, IMAGE_UPLOAD_POLICIES.avatar).ok).toBe(false);
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
    expect(checkImageUpload(file("logo.svg", svg.length), svg, IMAGE_UPLOAD_POLICIES.logo).ok).toBe(false);
    // SVG is never accepted for photos (stored XSS on the public bucket).
    const cleanSvg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(checkImageUpload(file("a.svg", cleanSvg.length), cleanSvg, IMAGE_UPLOAD_POLICIES.avatar).ok).toBe(false);
    expect(checkImageUpload(file("logo.svg", cleanSvg.length), cleanSvg, IMAGE_UPLOAD_POLICIES.logo).ok).toBe(true);
  });

  it("derives stored content type and extension from the content", () => {
    const result = checkImageUpload(file("photo.PNG", PNG.length), PNG, IMAGE_UPLOAD_POLICIES.cover);
    expect(result).toEqual({ ok: true, kind: "png", contentType: "image/png", extension: ".png" });
  });
});

// ---------------------------------------------------------------------------
// Route-level checks: bad payloads are rejected with 400 before any DB work.
// ---------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockUpdateUserById = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleSupabaseClient: () => ({ from: mockFrom, auth: { admin: { updateUserById: mockUpdateUserById } }, storage: {} }),
  createAdminClient: () => ({ from: mockFrom }),
}));
const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/api/auth-guard", () => ({
  requireAuthenticatedUser: (...args: unknown[]) => mockRequireAuthenticatedUser(...args),
  requireRole: () => undefined,
}));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendPasswordResetOtpEmail: vi.fn(),
  sendPasswordResetConfirmationEmail: vi.fn(),
  sendRegistrationOTP: vi.fn(),
  sendEmailVerificationOTP: vi.fn(),
}));

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/x", { method: "POST", headers: { "Content-Type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });

describe("route validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({ userId: UUID, userRole: "tenant", userEmail: "t@x.co", supabase: { from: mockFrom } });
  });

  it("reset-password rejects a 6-character password (was accepted before)", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(jsonRequest({ email: "a@b.co", resetToken: "tok", newPassword: "abc123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fieldErrors.newPassword).toMatch(/at least 8/);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("otp/verify rejects a non-numeric code and malformed JSON", async () => {
    const { POST } = await import("@/app/api/auth/otp/verify/route");
    expect((await POST(jsonRequest({ email: "a@b.co", otp: "12ab56" }))).status).toBe(400);
    expect((await POST(jsonRequest("{not json"))).status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("security-key/recover rejects weak new passwords", async () => {
    const { POST } = await import("@/app/api/auth/security-key/recover/route");
    const res = await POST(jsonRequest({ email: "a@b.co", securityKey: "ABCD-EFGH-JKMN-PQRS", newPassword: "123456" }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("tenant profile PATCH rejects invalid fields", async () => {
    const { PATCH } = await import("@/app/api/tenant/profile/route");
    const res = await PATCH(new Request("http://localhost/api/tenant/profile", { method: "PATCH", body: JSON.stringify({ phone: "12", has_changed_password: "true" }) }));
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("tenant 2FA rejects unknown actions and malformed codes", async () => {
    const { POST } = await import("@/app/api/tenant/2fa/route");
    expect((await POST(jsonRequest({ action: "nope" }))).status).toBe(400);
    expect((await POST(jsonRequest({ action: "verify-otp", otp: "1" }))).status).toBe(400);
  });

  it("avatar upload rejects a fake image that claims image/png", async () => {
    const { POST } = await import("@/app/api/profile/avatar/route");
    const form = new FormData();
    form.append("file", new File(["<html>not an image</html>"], "me.png", { type: "image/png" }));
    const res = await POST(new Request("http://localhost/api/profile/avatar", { method: "POST", body: form }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/valid/);
  });
});
