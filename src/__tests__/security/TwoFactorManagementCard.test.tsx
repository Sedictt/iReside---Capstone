import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { TwoFactorManagementCard } from "@/components/auth/TwoFactorManagementCard";

vi.mock("sonner", () => ({
    toast: {
        loading: vi.fn().mockReturnValue("toast-id"),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("TwoFactorManagementCard Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it("renders disabled state when 2FA is not active", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ enabled: false, email: null }),
        });

        render(
            <TwoFactorManagementCard
                apiEndpoint="/api/tenant/2fa"
                accountEmail="tenant@example.com"
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Two-Factor Authentication")).toBeDefined();
            expect(screen.getByText("Enable Two-Factor Authentication")).toBeDefined();
        });
    });

    it("transitions to pending_otp on clicking Enable, then enables on valid OTP", async () => {
        // 1. Initial status fetch
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ enabled: false, email: null }),
        });

        const mockOnStatusChange = vi.fn();
        render(
            <TwoFactorManagementCard
                apiEndpoint="/api/tenant/2fa"
                accountEmail="tenant@example.com"
                onStatusChange={mockOnStatusChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Enable Two-Factor Authentication")).toBeDefined();
        });

        // 2. Click Enable -> triggers send-otp
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, email: "te***t@example.com" }),
        });

        fireEvent.click(screen.getByText("Enable Two-Factor Authentication"));

        await waitFor(() => {
            expect(screen.getByText("Verification Required")).toBeDefined();
            expect(screen.getByPlaceholderText("000000")).toBeDefined();
        });

        // 3. Enter 6-digit OTP
        const otpInput = screen.getByPlaceholderText("000000");
        fireEvent.change(otpInput, { target: { value: "654321" } });

        // 4. Submit verify-otp
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, email: "tenant@example.com" }),
        });

        const verifyButton = screen.getByText("Verify & Enable 2FA");
        fireEvent.click(verifyButton);

        await waitFor(() => {
            expect(screen.getByText("Two-Factor Authentication is Active")).toBeDefined();
            expect(mockOnStatusChange).toHaveBeenCalledWith(true);
        });
    });

    it("renders active state and allows disabling with password", async () => {
        // Initial status fetch returning enabled
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ enabled: true, email: "landlord@example.com" }),
        });

        const mockOnStatusChange = vi.fn();
        render(
            <TwoFactorManagementCard
                apiEndpoint="/api/landlord/2fa"
                accountEmail="landlord@example.com"
                onStatusChange={mockOnStatusChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("Two-Factor Authentication is Active")).toBeDefined();
            expect(screen.getByText("Disable Protection")).toBeDefined();
        });

        // Enter password
        const passwordInput = screen.getByPlaceholderText("Enter current password");
        fireEvent.change(passwordInput, { target: { value: "mypassword123" } });

        // Click Disable 2FA
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, message: "Disabled" }),
        });

        const disableBtn = screen.getByText("Disable 2FA");
        fireEvent.click(disableBtn);

        await waitFor(() => {
            expect(screen.getByText("Enable Two-Factor Authentication")).toBeDefined();
            expect(mockOnStatusChange).toHaveBeenCalledWith(false);
        });
    });
});
