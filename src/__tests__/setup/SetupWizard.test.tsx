import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import BusinessPersonalizationWizardPage from "@/app/setup/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockUpdateBranding = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    profile: { role: "landlord" },
    user: { id: "test-landlord", user_metadata: { is_setup_completed: false } },
    loading: false,
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/context/BrandContext", () => ({
  useBrand: () => ({
    propertyName: "",
    propertyTagline: "",
    primaryColor: "#7c3aed",
    secondaryColor: "#f43f5e",
    logoUrl: null,
    setupCompleted: false,
    isLoading: false,
    updateBranding: mockUpdateBranding,
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      refreshSession: vi.fn().mockResolvedValue({}),
    },
  }),
}));

describe("Setup Wizard Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "Workspace launched" }),
    });
  });

  it("renders Step 1 initially and requires valid property name to continue", async () => {
    render(<BusinessPersonalizationWizardPage />);

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("What is your property called?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Modern apartments & student living")).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtn);

    // Should display validation error because property name is empty
    await waitFor(() => {
      expect(screen.getByText(/Property trade name is required/i)).toBeInTheDocument();
    });

    // Enter valid property name and tagline
    const input = screen.getByPlaceholderText("e.g. Pinecrest Residences");
    fireEvent.change(input, { target: { value: "Pinecrest Heights" } });
    const taglineInput = screen.getByPlaceholderText("e.g. Modern apartments & student living");
    fireEvent.change(taglineInput, { target: { value: "Luxury living near the university" } });
    fireEvent.click(continueBtn);

    // Should advance to Step 2: Theme Color
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
      expect(screen.getByText("Choose a color style for your portal")).toBeInTheDocument();
    });
  });

  it("allows jumping back to Step 1 from Step 2 using the stepper or back button", async () => {
    render(<BusinessPersonalizationWizardPage />);

    const input = screen.getByPlaceholderText("e.g. Pinecrest Residences");
    fireEvent.change(input, { target: { value: "Grand Villa" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });

    // Click back button
    const backBtn = screen.getByRole("button", { name: /Back/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Grand Villa")).toBeInTheDocument();
    });
  });

  it("restores draft inputs from localStorage on mount", async () => {
    localStorage.setItem(
      "ireside_setup_inputs_draft",
      JSON.stringify({
        propertyName: "Restored Condominium",
        tagline: "Quality city living",
        currentStep: 1,
        maxStepReached: 1,
      })
    );

    render(<BusinessPersonalizationWizardPage />);

    await waitFor(() => {
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Quality city living")).toBeInTheDocument();
    });
  });

  it("navigates through all 3 steps, opens confirmation modal, and completes launch", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/setup/launch")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<BusinessPersonalizationWizardPage />);

    // Step 1: Property Name & Tagline
    fireEvent.change(screen.getByPlaceholderText("e.g. Pinecrest Residences"), {
      target: { value: "Sunny Palms Residences" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Modern apartments & student living"), {
      target: { value: "Comfortable urban living" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 2: Theme Color
    await waitFor(() => {
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 3: Logo (Skip to finish)
    await waitFor(() => {
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Review & Finish/i }));

    // Confirmation Modal opens
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Check your information")).toBeInTheDocument();
      expect(screen.getAllByText("Sunny Palms Residences").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("button", { name: /Save & Open My Dashboard/i })).toBeInTheDocument();
    });

    // Submit
    const submitBtn = screen.getByTestId("submit-setup-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/setup/launch",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Sunny Palms Residences"),
        })
      );
    });

    await waitFor(() => {
      expect(mockUpdateBranding).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Your Property Portal is Ready!/i)).toBeInTheDocument();
    });
  });
});
