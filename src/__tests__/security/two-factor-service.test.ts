import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const mockAdminFrom = vi.fn();
const mockSendTwoFactorOTP = vi.fn().mockResolvedValue({ success: true });
const mockSignInWithPassword = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        from: mockAdminFrom,
    }),
}));

vi.mock("@/lib/email", () => ({
    sendTwoFactorOTP: (...args: any[]) => mockSendTwoFactorOTP(...args),
}));

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        auth: {
            signInWithPassword: mockSignInWithPassword,
        },
    }),
}));

import { TwoFactorService, maskEmail } from "@/lib/services/auth/two-factor.service";

describe("TwoFactorService", () => {
    let service: TwoFactorService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TwoFactorService();
        mockSendTwoFactorOTP.mockResolvedValue({ success: true });
    });

    describe("maskEmail helper", () => {
        it("correctly masks typical emails", () => {
            expect(maskEmail("john.doe@example.com")).toBe("jo***e@example.com");
            expect(maskEmail("ab@example.com")).toBe("a***@example.com");
            expect(maskEmail("")).toBe("");
        });
    });

    describe("getStatus", () => {
        it("returns disabled when neither table has 2FA enabled", async () => {
            const createChain = (data: any) => {
                const chain: any = {
                    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
                };
                chain.eq = vi.fn().mockReturnValue(chain);
                return chain;
            };

            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue(
                    createChain(
                        table === "profiles"
                            ? { id: "user-1", email: "user@domain.com", two_factor_enabled: false, two_factor_email: null }
                            : { two_factor_enabled: false, two_factor_email: null, otp_code: null, otp_expiry: null }
                    )
                ),
            }));

            const status = await service.getStatus("user-1");
            expect(status.enabled).toBe(false);
            expect(status.email).toBeNull();
            expect(status.userEmail).toBe("user@domain.com");
        });

        it("returns enabled when user_security_settings has 2FA enabled and syncs to profiles", async () => {
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });
            const upsertMock = vi.fn().mockResolvedValue({ error: null });

            const createChain = (data: any) => {
                const chain: any = {
                    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
                };
                chain.eq = vi.fn().mockReturnValue(chain);
                return chain;
            };

            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue(
                    createChain(
                        table === "profiles"
                            ? { id: "user-1", email: "user@domain.com", two_factor_enabled: false, two_factor_email: null }
                            : { two_factor_enabled: true, two_factor_email: "user@domain.com", otp_code: null, otp_expiry: null }
                    )
                ),
                update: updateMock,
                upsert: upsertMock,
            }));

            const status = await service.getStatus("user-1");
            expect(status.enabled).toBe(true);
            expect(status.email).toBe("user@domain.com");
            // Verifies proactive synchronization occurred
            expect(updateMock).toHaveBeenCalled();
        });
    });

    describe("sendOTP", () => {
        it("generates 6-digit OTP, updates both tables, and dispatches email", async () => {
            const upsertMock = vi.fn().mockResolvedValue({ error: null });
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: table === "profiles"
                                ? { id: "user-1", email: "user@domain.com", two_factor_email: "user@domain.com" }
                                : { two_factor_email: "user@domain.com" },
                            error: null,
                        }),
                    }),
                }),
                upsert: upsertMock,
                update: updateMock,
            }));

            const result = await service.sendOTP("user-1", { action: "enable" });
            expect(result.success).toBe(true);
            expect(result.email).toBe(maskEmail("user@domain.com"));

            // Check that user_security_settings upsert was called with 6-digit OTP
            expect(upsertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    profile_id: "user-1",
                    otp_code: expect.stringMatching(/^\d{6}$/),
                    otp_expiry: expect.any(String),
                }),
                expect.any(Object)
            );

            // Check that profiles update was also called in sync
            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    otp_code: expect.stringMatching(/^\d{6}$/),
                    otp_expiry: expect.any(String),
                })
            );

            // Check email dispatch
            expect(mockSendTwoFactorOTP).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "user@domain.com",
                    action: "enable",
                    otp: expect.stringMatching(/^\d{6}$/),
                })
            );
        });
    });

    describe("verifyOTP", () => {
        it("rejects non-numeric or invalid length OTP codes", async () => {
            const res1 = await service.verifyOTP("user-1", "123");
            expect(res1.success).toBe(false);
            expect(res1.code).toBe("INVALID_CODE");

            const res2 = await service.verifyOTP("user-1", "abcdef");
            expect(res2.success).toBe(false);
            expect(res2.code).toBe("INVALID_CODE");
        });

        it("rejects expired OTP codes", async () => {
            const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: {
                                id: "user-1",
                                email: "user@domain.com",
                                two_factor_email: "user@domain.com",
                                otp_code: "123456",
                                otp_expiry: pastDate,
                            },
                            error: null,
                        }),
                    }),
                }),
            }));

            const res = await service.verifyOTP("user-1", "123456");
            expect(res.success).toBe(false);
            expect(res.code).toBe("EXPIRED");
        });

        it("tracks remaining attempts on incorrect OTP and invalidates on 5th attempt", async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            mockAdminFrom.mockImplementation(() => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: {
                                otp_code: "654321",
                                otp_expiry: futureDate,
                                two_factor_email: "user@domain.com",
                            },
                            error: null,
                        }),
                    }),
                }),
                update: updateMock,
            }));

            // Attempt 1
            const res1 = await service.verifyOTP("user-lockout", "000000");
            expect(res1.success).toBe(false);
            expect(res1.code).toBe("INVALID_CODE");
            expect(res1.remainingAttempts).toBe(4);

            // Attempt 2, 3, 4
            await service.verifyOTP("user-lockout", "000000");
            await service.verifyOTP("user-lockout", "000000");
            await service.verifyOTP("user-lockout", "000000");

            // Attempt 5 -> lockout
            const res5 = await service.verifyOTP("user-lockout", "000000");
            expect(res5.success).toBe(false);
            expect(res5.code).toBe("TOO_MANY_ATTEMPTS");
            expect(res5.remainingAttempts).toBe(0);

            // Verified OTP was cleared in DB upon lockout
            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    otp_code: null,
                    otp_expiry: null,
                })
            );
        });

        it("enables 2FA and clears OTP in both tables on correct code with enableOnSuccess", async () => {
            const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            const upsertMock = vi.fn().mockResolvedValue({ error: null });
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });

            mockAdminFrom.mockImplementation((table: string) => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: {
                                id: "user-success",
                                email: "user@domain.com",
                                two_factor_email: "user@domain.com",
                                otp_code: "123456",
                                otp_expiry: futureDate,
                            },
                            error: null,
                        }),
                    }),
                }),
                upsert: upsertMock,
                update: updateMock,
            }));

            const res = await service.verifyOTP("user-success", "123456", { enableOnSuccess: true });
            expect(res.success).toBe(true);
            expect(res.email).toBe("user@domain.com");

            expect(upsertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    profile_id: "user-success",
                    two_factor_enabled: true,
                    two_factor_email: "user@domain.com",
                    otp_code: null,
                    otp_expiry: null,
                }),
                expect.any(Object)
            );

            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    two_factor_enabled: true,
                    two_factor_email: "user@domain.com",
                    otp_code: null,
                    otp_expiry: null,
                })
            );
        });
    });

    describe("disable", () => {
        it("rejects when password is not provided", async () => {
            const res = await service.disable("user-1", "");
            expect(res.success).toBe(false);
            expect(res.error).toContain("Password is required");
        });

        it("rejects when password verification fails", async () => {
            mockAdminFrom.mockImplementation(() => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: { email: "user@domain.com" },
                            error: null,
                        }),
                    }),
                }),
            }));

            mockSignInWithPassword.mockResolvedValue({
                data: null,
                error: new Error("Invalid login credentials"),
            });

            const res = await service.disable("user-1", "wrong-password");
            expect(res.success).toBe(false);
            expect(res.error).toContain("Incorrect account password");
        });

        it("successfully disables 2FA in both tables when password matches", async () => {
            const upsertMock = vi.fn().mockResolvedValue({ error: null });
            const updateMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            });
            const deleteMock = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ error: null }),
                }),
            });

            mockAdminFrom.mockImplementation(() => ({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                            data: { email: "user@domain.com" },
                            error: null,
                        }),
                    }),
                }),
                upsert: upsertMock,
                update: updateMock,
                delete: deleteMock,
            }));

            mockSignInWithPassword.mockResolvedValue({
                data: { user: { id: "user-1" } },
                error: null,
            });

            const res = await service.disable("user-1", "correct-password");
            expect(res.success).toBe(true);
            expect(res.message).toContain("disabled successfully");

            expect(upsertMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    profile_id: "user-1",
                    two_factor_enabled: false,
                    two_factor_email: null,
                    otp_code: null,
                    otp_expiry: null,
                }),
                expect.any(Object)
            );

            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    two_factor_enabled: false,
                    two_factor_email: null,
                    otp_code: null,
                    otp_expiry: null,
                })
            );
        });
    });
});
