import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { generateSecurityKey, encryptSecurityKey } from "@/lib/security/recovery-keys";

// Mock auth guard
const mockRequireAuthenticatedUser = vi.fn();
vi.mock("@/lib/api/auth-guard", () => ({
    requireAuthenticatedUser: (...args: any[]) => mockRequireAuthenticatedUser(...args),
}));

// Mock Supabase admin
const mockAdminFrom = vi.fn();
const mockUpdateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock("@/lib/supabase/admin", () => ({
    createServiceRoleSupabaseClient: () => ({
        from: mockAdminFrom,
        auth: {
            admin: {
                updateUserById: mockUpdateUserById,
            },
        },
    }),
}));

// Mock Supabase JS client for password verification
const mockSignInWithPassword = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    }),
}));

// Mock audit logger
vi.mock("@/lib/audit/audit-logger", () => ({
    logUserActivity: vi.fn().mockResolvedValue(true),
}));

import { GET as securityKeyGet, POST as securityKeyPost } from "@/app/api/auth/security-key/route";
import { POST as recoverPost } from "@/app/api/auth/security-key/recover/route";
import { POST as rotatePost } from "@/app/api/auth/security-key/rotate/route";

describe("Security Recovery Key API Endpoints", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("GET /api/auth/security-key", () => {
        it("returns hasSecurityKey: false when no key exists", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "user-1",
                userRole: "tenant",
            });

            mockAdminFrom.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            });

            const req = new NextRequest("http://localhost:3000/api/auth/security-key");
            const res = await securityKeyGet(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.hasSecurityKey).toBe(false);
            expect(json.updatedAt).toBeNull();
        });

        it("returns hasSecurityKey: true when key exists", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "user-1",
                userRole: "tenant",
            });

            mockAdminFrom.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: {
                                security_key_encrypted: "enc123",
                                security_key_updated_at: "2026-09-19T10:00:00Z",
                            },
                            error: null,
                        }),
                    }),
                }),
            });

            const req = new NextRequest("http://localhost:3000/api/auth/security-key");
            const res = await securityKeyGet(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.hasSecurityKey).toBe(true);
            expect(json.updatedAt).toBe("2026-09-19T10:00:00Z");
        });
    });

    describe("POST /api/auth/security-key", () => {
        it("generates, encrypts, and stores a new security key", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "user-1",
                userRole: "landlord",
            });

            const mockUpsert = vi.fn().mockResolvedValue({ error: null });
            mockAdminFrom.mockReturnValue({
                upsert: mockUpsert,
            });

            const req = new NextRequest("http://localhost:3000/api/auth/security-key", {
                method: "POST",
            });

            const res = await securityKeyPost(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.securityKey).toBeDefined();
            expect(json.securityKey).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
            expect(mockUpsert).toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/security-key/recover", () => {
        it("rejects request if missing required fields", async () => {
            const req = new NextRequest("http://localhost:3000/api/auth/security-key/recover", {
                method: "POST",
                body: JSON.stringify({ email: "user@example.com" }),
            });

            const res = await recoverPost(req);
            expect(res.status).toBe(400);
            const json = await res.json();
            expect(json.error).toContain("required");
        });

        it("recovers account successfully with valid key, updates credentials and returns replacement key", async () => {
            const originalKey = generateSecurityKey();
            const encrypted = encryptSecurityKey(originalKey);

            // Mock profile query
            const mockSelectProfile = vi.fn().mockReturnValue({
                ilike: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                            id: "user-rec-1",
                            role: "tenant",
                            email: "recovery@example.com",
                            full_name: "Recovered User",
                        },
                        error: null,
                    }),
                }),
            });

            // Mock security settings query & update
            const mockSelectSec = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                            profile_id: "user-rec-1",
                            security_key_encrypted: encrypted.encrypted,
                            security_key_iv: encrypted.iv,
                            security_key_auth_tag: encrypted.authTag,
                            security_key_failed_attempts: 0,
                            security_key_locked_until: null,
                        },
                        error: null,
                    }),
                }),
            });

            const mockUpdate = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            mockAdminFrom.mockImplementation((table: string) => {
                if (table === "profiles") {
                    return { select: mockSelectProfile, update: mockUpdate };
                }
                if (table === "user_security_settings") {
                    return { select: mockSelectSec, update: mockUpdate };
                }
                return {};
            });

            const req = new NextRequest("http://localhost:3000/api/auth/security-key/recover", {
                method: "POST",
                body: JSON.stringify({
                    email: "recovery@example.com",
                    securityKey: originalKey,
                    newPassword: "NewSecurePassword123!",
                    newEmail: "new-email@example.com",
                }),
            });

            const res = await recoverPost(req);
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.success).toBe(true);
            expect(json.newSecurityKey).toBeDefined();
            // Old key should not be the same as new key
            expect(json.newSecurityKey).not.toBe(originalKey);

            // Supabase auth update checked
            expect(mockUpdateUserById).toHaveBeenCalledWith("user-rec-1", {
                password: "NewSecurePassword123!",
                email: "new-email@example.com",
            });
        });
    });

    describe("POST /api/auth/security-key/rotate", () => {
        it("rejects rotation if password verification fails", async () => {
            mockRequireAuthenticatedUser.mockResolvedValue({
                userId: "user-rot-1",
                userRole: "landlord",
            });

            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: table === "profiles" ? { email: "landlord@example.com" } : { otp_code: "123456" },
                            error: null,
                        }),
                    }),
                }),
            }));

            mockSignInWithPassword.mockResolvedValue({
                error: { message: "Invalid credentials" },
            });

            const req = new NextRequest("http://localhost:3000/api/auth/security-key/rotate", {
                method: "POST",
                body: JSON.stringify({
                    currentPassword: "wrongpassword",
                    otpCode: "123456",
                }),
            });

            const res = await rotatePost(req);
            expect(res.status).toBe(401);
            const json = await res.json();
            expect(json.error).toContain("Incorrect current password");
        });
    });
});
