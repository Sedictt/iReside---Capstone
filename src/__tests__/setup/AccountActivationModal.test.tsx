import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { AccountActivationModal } from "@/components/auth/AccountActivationModal";

const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockSignInWithPassword = vi.fn().mockResolvedValue({
  data: { session: { user: { id: "test-user" } } },
  error: null,
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("AccountActivationModal Component", () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("does not render when isOpen is false", () => {
    render(<AccountActivationModal isOpen={false} onComplete={mockOnComplete} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("completes claim flow, displays Security Recovery Key modal, and triggers onComplete when clicking Proceed to Property Setup", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/setup/email/send-otp")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: "Code sent" }),
        });
      }
      if (url.includes("/api/setup/email/verify-otp")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, verified: true }),
        });
      }
      if (url.includes("/api/setup/account/claim")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            email: "eduardo@santosproperties.ph",
            securityKey: "SEC-KEY-RECOVERY-9999",
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<AccountActivationModal isOpen={true} onComplete={mockOnComplete} />);

    // Step 1: Fill Profile & Email
    const nameInput = screen.getByPlaceholderText("e.g. Roberto Reyes");
    const emailInput = screen.getByPlaceholderText("landlord@example.com");

    fireEvent.change(nameInput, { target: { value: "Eduardo Santos" } });
    fireEvent.change(emailInput, { target: { value: "eduardo@santosproperties.ph" } });

    // Send OTP
    const sendOtpButton = screen.getByRole("button", { name: /Send Code/i });
    fireEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeInTheDocument();
    });

    // Enter 6-digit OTP (automatically triggers verification and advances to Step 2)
    const otpInput = screen.getByPlaceholderText("Enter 6-digit code");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    // Step 2: Set New Password
    await waitFor(() => {
      expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
    });

    const passInput = screen.getByPlaceholderText("At least 8 characters");
    const confirmInput = screen.getByPlaceholderText("Re-enter your password");

    fireEvent.change(passInput, { target: { value: "StrongPass123!" } });
    fireEvent.change(confirmInput, { target: { value: "StrongPass123!" } });

    // Claim Account
    const claimButton = screen.getByRole("button", { name: /Claim Account/i });
    fireEvent.click(claimButton);

    // Security Recovery Code & Success Screen
    await waitFor(() => {
      expect(screen.getByText(/Account Claimed Successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Landlord Security Recovery Key/i)).toBeInTheDocument();
      expect(screen.getByText("eduardo@santosproperties.ph")).toBeInTheDocument();
    });

    const proceedButton = screen.getByRole("button", { name: /Proceed to Property Setup/i });
    expect(proceedButton).toBeInTheDocument();

    // Copy or download key
    const copyButton = screen.getByRole("button", { name: /Copy Key/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/Copied to Clipboard/i)).toBeInTheDocument();
    });

    // Click Proceed to Property Setup
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith("eduardo@santosproperties.ph", "StrongPass123!");
    });
  });

  it("allows proceeding to setup after acknowledging security recovery key checkbox", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/setup/email/send-otp")) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (url.includes("/api/setup/email/verify-otp")) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (url.includes("/api/setup/account/claim")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            email: "ack@example.ph",
            securityKey: "SEC-KEY-RECOVERY-ACK",
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<AccountActivationModal isOpen={true} onComplete={mockOnComplete} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Roberto Reyes"), { target: { value: "Ack Landlord" } });
    fireEvent.change(screen.getByPlaceholderText("landlord@example.com"), { target: { value: "ack@example.ph" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Code/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter 6-digit code"), { target: { value: "654321" } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "SecurePass123!" } });
    fireEvent.change(screen.getByPlaceholderText("Re-enter your password"), { target: { value: "SecurePass123!" } });

    fireEvent.click(screen.getByRole("button", { name: /Claim Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Account Claimed Successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Landlord Security Recovery Key/i)).toBeInTheDocument();
    });

    // Check acknowledgment checkbox
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    const proceedButton = screen.getByRole("button", { name: /Proceed to Property Setup/i });
    fireEvent.click(proceedButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith("ack@example.ph", "SecurePass123!");
    });
  });
});
