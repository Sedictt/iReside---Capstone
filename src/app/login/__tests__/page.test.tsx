import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginPage from "../page";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Mocks Setup
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
    useSearchParams: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
    createClient: vi.fn(),
}));

vi.mock("@/components/auth/AccountActivationModal", () => ({
    AccountActivationModal: ({ isOpen, onComplete }: any) => {
        if (!isOpen) return null;
        return (
            <div data-testid="activation-modal">
                <button
                    data-testid="claim-and-proceed-btn"
                    onClick={() => onComplete("claimed.landlord@example.com", "NewPassword123!")}
                >
                    Proceed to Sign In
                </button>
                <button
                    data-testid="claim-no-pass-btn"
                    onClick={() => onComplete("claimed.landlord@example.com")}
                >
                    Proceed No Pass
                </button>
            </div>
        );
    },
}));

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function mockRouter(push: Mock) {
    const router = { push: push, refresh: vi.fn() };
    (useRouter as Mock).mockReturnValue(router);
    return router;
}

function mockSearchParams(redirectUrl: string | null = null, extraParams: Record<string, string> = {}) {
    const searchParams = new URLSearchParams();
    if (redirectUrl) {
        searchParams.set("redirect", redirectUrl);
    }
    Object.entries(extraParams).forEach(([k, v]) => searchParams.set(k, v));
    (useSearchParams as Mock).mockReturnValue({
        get: vi.fn((key: string) => searchParams.get(key)),
    });
    return searchParams;
}

function mockSupabaseClient(signInWithPassword: any = { data: null, error: null }, signInWithOAuth: any = { error: null }) {
    const supabase = {
        auth: {
            signInWithPassword: vi.fn().mockResolvedValue(signInWithPassword),
            signInWithOAuth: vi.fn().mockResolvedValue(signInWithOAuth),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { role: "tenant" }, error: null }),
                })),
            })),
        })),
    };
    (createClient as Mock).mockReturnValue(supabase);
    return supabase;
}

const getEmailInput = () => screen.getByLabelText(/^Email Address$/i);
const getPasswordInput = () => screen.getByLabelText(/^Password$/i);

// ---------------------------------------------------------------------------
// Unit Tests - UI and Form Validation
// ---------------------------------------------------------------------------

describe("LoginPage - UI and Form Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouter(vi.fn() as any);
        mockSearchParams();
        mockSupabaseClient({ data: null, error: null });
    });

    it("renders login form with all required elements", () => {
        render(<LoginPage />);

        // Check heading
        expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();

        // Check form fields by exact label
        expect(getEmailInput()).toBeInTheDocument();
        expect(getPasswordInput()).toBeInTheDocument();

        // Check buttons
        const submitButton = screen.getByRole("button", { name: "Sign In" });
        expect(screen.getByText("Google Account")).toBeInTheDocument();

        // Check forgot password link
        expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
    });

    it("email field has correct HTML attributes", () => {
        render(<LoginPage />);
        const emailInput = getEmailInput();
        expect(emailInput).toHaveAttribute("type", "email");
        expect(emailInput).toHaveAttribute("name", "email");
        expect(emailInput).toHaveAttribute("required");
    });

    it("password field has correct HTML attributes", () => {
        render(<LoginPage />);
        const passwordInput = getPasswordInput();
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(passwordInput).toHaveAttribute("name", "password");
        expect(passwordInput).toHaveAttribute("required");
    });

    it("displays brand and operational copy", () => {
        render(<LoginPage />);
        expect(screen.getByText(/Dedicated/i)).toBeInTheDocument();
        expect(screen.getAllByText(/property/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Download iReside App/i)).toBeInTheDocument();
    });

    it("shows loading state on form submission", async () => {
        const mockSignIn = vi.fn().mockReturnValue(new Promise(() => {}));
        (createClient as Mock).mockReturnValue({
            auth: { signInWithPassword: mockSignIn, signInWithOAuth: vi.fn() },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockReturnValue(new Promise(() => {})),
                    })),
                })),
            })),
        });

        render(<LoginPage />);

        const emailInput = getEmailInput();
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole("button", { name: "Sign In" });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();
        });
    });
});

// ---------------------------------------------------------------------------
// Unit Tests - Authentication Logic
// ---------------------------------------------------------------------------

describe("LoginPage - Authentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("successfully logs in with valid credentials", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { id: "user-123", email: "test@example.com", user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = getEmailInput();
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole("button", { name: "Sign In" });

        fireEvent.change(emailInput, { target: { value: "tenant@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "securepassword" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createClient).toHaveBeenCalled();
        });
    });

    it("redirects tenant user to tenant dashboard after login", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = getEmailInput();
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole("button", { name: "Sign In" });

        fireEvent.change(emailInput, { target: { value: "tenant@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/tenant/dashboard");
        });
    });

    it("redirects landlord user to landlord dashboard after login", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();

        const supabase = {
            auth: {
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: {
                        user: { user_metadata: { role: "landlord" } },
                        session: { access_token: "token", refresh_token: "refresh" },
                    },
                    error: null,
                }),
                signInWithOAuth: vi.fn(),
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: { role: "landlord" }, error: null }),
                    })),
                })),
            })),
        };
        (createClient as Mock).mockReturnValue(supabase);

        render(<LoginPage />);

        const emailInput = getEmailInput();
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole("button", { name: "Sign In" });

        fireEvent.change(emailInput, { target: { value: "landlord@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/landlord/dashboard");
        });
    });

    it("displays error message when login fails", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams();
        mockSupabaseClient({
            data: null,
            error: { message: "Invalid login credentials" },
        });

        render(<LoginPage />);

        const emailInput = getEmailInput();
        const passwordInput = getPasswordInput();
        const submitButton = screen.getByRole("button", { name: "Sign In" });

        fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
        });
    });
});

describe("LoginPage - Account Activation (No Auto Sign-In)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("signs out stale session and shows manual login banner after account claiming (with password)", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            });

        const mockSignOut = vi.fn().mockResolvedValue({ error: null });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: mockSignOut,
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: { role: "landlord", is_account_claimed: false }, error: null }),
                    })),
                })),
            })),
        };
        (createClient as Mock).mockReturnValue(supabase);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        // Simulate clicking "Proceed" which calls onComplete with email + password
        fireEvent.click(screen.getByTestId("claim-and-proceed-btn"));

        await waitFor(() => {
            // Should sign out the stale session (password change invalidated tokens)
            expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
            // Should NOT attempt a second signInWithPassword (no auto sign-in)
            expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
            // Should show banner telling user to sign in manually
            expect(screen.getByText(/Account claimed successfully! Please sign in with your new credentials as claimed.landlord@example.com./i)).toBeInTheDocument();
        });
    });

    it("signs out stale session and shows manual login banner after account claiming (without password)", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            });

        const mockSignOut = vi.fn().mockResolvedValue({ error: null });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: mockSignOut,
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: { role: "landlord", is_account_claimed: false }, error: null }),
                    })),
                })),
            })),
        };
        (createClient as Mock).mockReturnValue(supabase);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        // Simulate clicking "Proceed" without password
        fireEvent.click(screen.getByTestId("claim-no-pass-btn"));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
            // Should NOT attempt auto sign-in
            expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
            expect(screen.getByText(/Account claimed successfully! Please sign in with your new credentials as claimed.landlord@example.com./i)).toBeInTheDocument();
        });
    });

    it("still shows banner even if signOut throws an error", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            });

        const mockSignOut = vi.fn().mockRejectedValue(new Error("Session already expired"));

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: mockSignOut,
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: { role: "landlord", is_account_claimed: false }, error: null }),
                    })),
                })),
            })),
        };
        (createClient as Mock).mockReturnValue(supabase);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("claim-and-proceed-btn"));

        await waitFor(() => {
            // Even though signOut failed, the banner should still appear
            expect(screen.getByText(/Account claimed successfully!/i)).toBeInTheDocument();
        });
    });

    it("renders Security Recovery Key Lightbox on refreshed login page when pending recovery key is in storage and proceeds to setup", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();

        const mockSignIn = vi.fn().mockResolvedValue({
            data: { session: { user: { id: "user-123" } } },
            error: null,
        });

        const supabase = {
            auth: {
                signInWithPassword: mockSignIn,
                signInWithOAuth: vi.fn(),
            },
            from: vi.fn(),
        };
        (createClient as Mock).mockReturnValue(supabase);

        sessionStorage.setItem(
            "ireside_pending_recovery_key",
            JSON.stringify({
                securityKey: "RECOVERY-KEY-REFRESH-TEST",
                email: "claimed@example.ph",
                password: "MyCleanPassword123!",
            })
        );

        render(<LoginPage />);

        await waitFor(() => {
            expect(screen.getByText(/Account Claimed Successfully/i)).toBeInTheDocument();
            expect(screen.getByText(/Landlord Security Recovery Key/i)).toBeInTheDocument();
            expect(screen.getByText("claimed@example.ph")).toBeInTheDocument();
        });

        const proceedBtn = screen.getByRole("button", { name: /Proceed to Sign In/i });
        expect(proceedBtn).toBeDisabled();

        const downloadBtn = screen.getByRole("button", { name: /Download/i });
        fireEvent.click(downloadBtn);

        await waitFor(() => {
            expect(proceedBtn).not.toBeDisabled();
        });

        fireEvent.click(proceedBtn);

        await waitFor(() => {
            expect(screen.getByText(/Account claimed successfully! Please sign in with your new credentials/i)).toBeInTheDocument();
            expect(sessionStorage.getItem("ireside_pending_recovery_key")).toBeNull();
        });
    });

    it("displays activation banner and prefills email when mounted with ?activated=true&email=...", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams(null, { activated: "true", email: "fresh.landlord@example.ph" });
        mockSupabaseClient({ data: null, error: null });

        render(<LoginPage />);

        await waitFor(() => {
            expect(screen.getByText(/Account claimed successfully! Please sign in with your new credentials as fresh.landlord@example.ph to proceed to setup./i)).toBeInTheDocument();
            expect(getEmailInput()).toHaveValue("fresh.landlord@example.ph");
        });
    });

    it("triggers window.location.replace to reload the page with activated=true when proceeding from recovery modal in browser environment", async () => {
        const originalEnv = process.env.NODE_ENV;
        const replaceSpy = vi.fn();
        Object.defineProperty(window, "location", {
            writable: true,
            value: { ...window.location, replace: replaceSpy, href: "http://localhost:3000/login" },
        });

        try {
            // Simulate browser environment where NODE_ENV is production
            (process.env as any).NODE_ENV = "production";

            mockRouter(vi.fn() as any);
            mockSearchParams();
            const supabase = mockSupabaseClient();
            supabase.auth.signOut = vi.fn().mockResolvedValue({ error: null });

            sessionStorage.setItem(
                "ireside_pending_recovery_key",
                JSON.stringify({
                    securityKey: "RECOVERY-KEY-BROWSER-REPLACE-TEST",
                    email: "browser.refresh@example.ph",
                    password: "SecretPassword123!",
                })
            );

            render(<LoginPage />);

            await waitFor(() => {
                expect(screen.getByText(/Account Claimed Successfully/i)).toBeInTheDocument();
            });

            const downloadBtn = screen.getByRole("button", { name: /Download/i });
            fireEvent.click(downloadBtn);

            const proceedBtn = screen.getByRole("button", { name: /Proceed to Sign In/i });
            await waitFor(() => {
                expect(proceedBtn).not.toBeDisabled();
            });

            fireEvent.click(proceedBtn);

            await waitFor(() => {
                expect(replaceSpy).toHaveBeenCalledWith("/login?activated=true&email=browser.refresh%40example.ph");
                expect(sessionStorage.getItem("ireside_pending_recovery_key")).toBeNull();
            });
        } finally {
            (process.env as any).NODE_ENV = originalEnv;
        }
    });
});
