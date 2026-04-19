/**
 * Test Suite for Login Page
 * Feature: user-authentication-login
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
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

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function mockRouter(push: vi.Mock) {
    const router = { push: push };
    (useRouter as vi.Mock).mockReturnValue(router);
    return router;
}

function mockSearchParams(redirectUrl: string | null = null) {
    const searchParams = new URLSearchParams();
    if (redirectUrl) {
        searchParams.set("redirect", redirectUrl);
    }
    (useSearchParams as vi.Mock).mockReturnValue({
        get: vi.fn((key: string) => searchParams.get(key)),
    });
    return searchParams;
}

function mockSupabaseClient(signInWithPassword: ReturnType<vi.Mock> = { data: null, error: null }, signInWithOAuth: ReturnType<vi.Mock> = { error: null }) {
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
    (createClient as vi.Mock).mockReturnValue(supabase);
    return supabase;
}

// ---------------------------------------------------------------------------
// Unit Tests - UI and Form Validation
// ---------------------------------------------------------------------------

describe("LoginPage - UI and Form Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouter(vi.fn());
        mockSearchParams();
        mockSupabaseClient({ data: null, error: null });
    });

    it("renders login form with all required elements", () => {
        render(<LoginPage />);

        // Check heading
        expect(screen.getByText("Welcome back")).toBeInTheDocument();

        // Check form fields by label
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

        // Check buttons
        expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getByText("Facebook")).toBeInTheDocument();

        // Check links
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
        expect(screen.getAllByText(/sign up/i).length).toBeGreaterThan(0);

        // Check remember me checkbox
        expect(screen.getByRole("checkbox", { name: /remember me/i })).toBeInTheDocument();
    });

    it("email field has correct HTML attributes", () => {
        render(<LoginPage />);
        const emailInput = screen.getByLabelText(/email address/i);
        expect(emailInput).toHaveAttribute("type", "email");
        expect(emailInput).toHaveAttribute("name", "email");
        expect(emailInput).toHaveAttribute("required");
    });

    it("password field has correct HTML attributes", () => {
        render(<LoginPage />);
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute("type", "password");
        expect(passwordInput).toHaveAttribute("name", "password");
        expect(passwordInput).toHaveAttribute("required");
    });

    it("displays brand and marketing copy", () => {
        render(<LoginPage />);
        expect(screen.getByText("The future of modern residency.")).toBeInTheDocument();
        expect(screen.getByText(/Join thousands of residents/i)).toBeInTheDocument();
        expect(screen.getByText("iReside")).toBeInTheDocument();
    });

    it("shows loading state on form submission", async () => {
        // Mock Supabase to never resolve
        mockSupabaseClient({ data: null, error: null });
        // Override to never resolve
        const mockSignIn = vi.fn().mockReturnValue(new Promise(() => {}));
        (createClient as vi.Mock).mockReturnValue({
            auth: { signInWithPassword: mockSignIn, signInWithOAuth: vi.fn() },
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Logging in/i)).toBeInTheDocument();
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
        mockRouter(mockPush);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { id: "user-123", email: "test@example.com", user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "tenant@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "securepassword" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(createClient).toHaveBeenCalled();
        });
    });

    it("redirects tenant user to tenant dashboard after login", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "tenant@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/tenant/dashboard");
        });
    });

    it("redirects landlord user to landlord dashboard after login", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "landlord" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "landlord@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/landlord/dashboard");
        });
    });

    it("redirects admin user to admin dashboard after login", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush);
        mockSearchParams();
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "admin" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "admin@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
        });
    });

    it("respects redirect URL from query params", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush);
        mockSearchParams("/custom/page");
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/custom/page");
        });
    });
});

// ---------------------------------------------------------------------------
// Unit Tests - Error Handling
// ---------------------------------------------------------------------------

describe("LoginPage - Error Handling", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouter(vi.fn());
        mockSearchParams();
    });

    it("displays error message for invalid credentials", async () => {
        mockSupabaseClient({
            data: null,
            error: { message: "Invalid login credentials", status: 400 },
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
        });
    });

    it("displays friendly message for database schema error", async () => {
        mockSupabaseClient({
            data: null,
            error: { message: "Database error querying schema", status: 500 },
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Login failed due to a Supabase auth schema issue/i)).toBeInTheDocument();
        });
    });

    it("displays generic error for unknown errors", async () => {
        mockSupabaseClient({
            data: null,
            error: { message: "Connection timeout", status: 0 },
        });

        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const submitButton = screen.getByRole("button", { name: /log in/i });

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Connection timeout")).toBeInTheDocument();
        });
    });
});

// ---------------------------------------------------------------------------
// Unit Tests - Google OAuth
// ---------------------------------------------------------------------------

describe("LoginPage - Google OAuth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete window.location;
        window.location = { origin: "http://localhost:3000" } as any;
        mockRouter(vi.fn());
        mockSearchParams();
    });

    it("initiates Google OAuth flow when Google button is clicked", async () => {
        mockSupabaseClient({ signInWithPassword: { data: null, error: null } }, {
            error: null,
        });

        render(<LoginPage />);

        const googleButton = screen.getByText("Google").closest("button")!;
        fireEvent.click(googleButton);

        await waitFor(() => {
            const supabase = (createClient as vi.Mock).mock.results[0].value;
            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: "google",
                options: {
                    redirectTo: "http://localhost:3000/auth/callback",
                },
            });
        });
    });

    it("includes redirect URL in Google OAuth callback", async () => {
        mockSearchParams("/landlord/dashboard");
        mockSupabaseClient({ signInWithPassword: { data: null, error: null } }, {
            error: null,
        });

        render(<LoginPage />);

        const googleButton = screen.getByText("Google").closest("button")!;
        fireEvent.click(googleButton);

        await waitFor(() => {
            const supabase = (createClient as vi.Mock).mock.results[0].value;
            expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
                provider: "google",
                options: {
                    redirectTo: "http://localhost:3000/auth/callback?next=/landlord/dashboard",
                },
            });
        });
    });

    it("displays error if Google OAuth fails", async () => {
        mockSupabaseClient({ signInWithPassword: { data: null, error: null } }, {
            error: { message: "OAuth provider unavailable" },
        });

        render(<LoginPage />);

        const googleButton = screen.getByText("Google").closest("button")!;
        fireEvent.click(googleButton);

        await waitFor(() => {
            expect(screen.getByText("OAuth provider unavailable")).toBeInTheDocument();
        });
    });
});

// ---------------------------------------------------------------------------
// Unit Tests - Accessibility and Navigation
// ---------------------------------------------------------------------------

describe("LoginPage - Accessibility and Navigation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouter(vi.fn());
        mockSearchParams();
        mockSupabaseClient({ data: null, error: null });
    });

    it("has proper form labels associated with inputs", () => {
        render(<LoginPage />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        expect(emailInput).toHaveAttribute("id", "email");
        expect(passwordInput).toHaveAttribute("id", "password");
    });

    it("has alt text for brand logo", () => {
        render(<LoginPage />);
        const logo = screen.getByAltText("Modern Residence");
        expect(logo).toBeInTheDocument();
    });

    it("provides link to signup page", () => {
        render(<LoginPage />);
        const signupLink = screen.getByText(/sign up/i).closest("a");
        expect(signupLink).toHaveAttribute("href", "/signup");
    });

    it("provides link to forgot password page", () => {
        render(<LoginPage />);
        const forgotPasswordLink = screen.getByText(/forgot password/i).closest("a");
        expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });

    it("remember me checkbox has associated label", () => {
        render(<LoginPage />);
        const checkbox = screen.getByRole("checkbox");
        const label = screen.getByText(/remember me/i);
        expect(checkbox).toHaveAttribute("id", "remember");
        expect(label).toHaveAttribute("for", "remember");
    });
});

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe("LoginPage - Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouter(vi.fn());
        mockSearchParams();
    });

    it("handles successful login flow end-to-end", async () => {
        const mockPush = vi.fn();
        mockRouter(mockPush);
        mockSupabaseClient({
            data: {
                user: { user_metadata: { role: "tenant" } },
                session: { access_token: "token", refresh_token: "refresh" },
            },
            error: null,
        });

        render(<LoginPage />);

        // Fill form
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        // Submit form
        const submitButton = screen.getByRole("button", { name: /log in/i });
        fireEvent.click(submitButton);

        // Verify client was called
        await waitFor(() => {
            expect(createClient).toHaveBeenCalled();
        });

        // Verify redirect
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/tenant/dashboard");
        });
    });
});
