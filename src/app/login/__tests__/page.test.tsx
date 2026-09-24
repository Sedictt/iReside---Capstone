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

function mockSearchParams(redirectUrl: string | null = null) {
    const searchParams = new URLSearchParams();
    if (redirectUrl) {
        searchParams.set("redirect", redirectUrl);
    }
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

describe("LoginPage - Account Activation Auto-SignIn", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("auto-authenticates and directs newly claimed landlord to /setup when branding setup is not complete", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "claimed.landlord@example.com", user_metadata: { role: "landlord", is_account_claimed: true } },
                    session: { access_token: "token2", refresh_token: "refresh2" },
                },
                error: null,
            });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: vi.fn(),
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

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ setupCompleted: false }),
        } as any);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("claim-and-proceed-btn"));

        await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledTimes(2);
            expect(mockSignInWithPassword).toHaveBeenLastCalledWith({
                email: "claimed.landlord@example.com",
                password: "NewPassword123!",
            });
            expect(mockPush).toHaveBeenCalledWith("/setup");
        });
    });

    it("auto-authenticates and directs claimed landlord to /landlord/dashboard when branding setup is already complete", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "claimed.landlord@example.com", user_metadata: { role: "landlord", is_account_claimed: true } },
                    session: { access_token: "token2", refresh_token: "refresh2" },
                },
                error: null,
            });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: vi.fn(),
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

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ setupCompleted: true }),
        } as any);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("claim-and-proceed-btn"));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/landlord/dashboard");
        });
    });

    it("respects redirect query param when auto-authenticating", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush as any);
        mockSearchParams("/landlord/properties");

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "claimed.landlord@example.com", user_metadata: { role: "landlord", is_account_claimed: true } },
                    session: { access_token: "token2", refresh_token: "refresh2" },
                },
                error: null,
            });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: vi.fn(),
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

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ setupCompleted: true }),
        } as any);

        render(<LoginPage />);

        fireEvent.change(getEmailInput(), { target: { value: "admin@turnkey.local" } });
        fireEvent.change(getPasswordInput(), { target: { value: "TurnkeyPass123!" } });
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

        await waitFor(() => {
            expect(screen.getByTestId("activation-modal")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("claim-and-proceed-btn"));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/landlord/properties");
        });
    });

    it("gracefully falls back to manual login if auto sign-in fails", async () => {
        mockRouter(vi.fn() as any);
        mockSearchParams();

        const mockSignInWithPassword = vi.fn()
            .mockResolvedValueOnce({
                data: {
                    user: { id: "starter-user-id", email: "admin@turnkey.local", user_metadata: { role: "landlord", is_account_claimed: false } },
                    session: { access_token: "token1", refresh_token: "refresh1" },
                },
                error: null,
            })
            .mockResolvedValueOnce({
                data: null,
                error: { message: "Auto sign-in network error" },
            });

        const supabase = {
            auth: {
                signInWithPassword: mockSignInWithPassword,
                signInWithOAuth: vi.fn(),
                signOut: vi.fn(),
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
            expect(screen.getByText(/Account successfully claimed! Please enter your password to sign in as claimed.landlord@example.com./i)).toBeInTheDocument();
        });
    });

    it("falls back to manual login if password is not provided to onComplete", async () => {
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

        fireEvent.click(screen.getByTestId("claim-no-pass-btn"));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
            expect(screen.getByText(/Account successfully claimed! Please enter your password to sign in as claimed.landlord@example.com./i)).toBeInTheDocument();
        });
    });
});
