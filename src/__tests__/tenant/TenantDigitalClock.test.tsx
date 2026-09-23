import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { TenantDigitalClock } from "@/components/tenant/dashboard/TenantDigitalClock";

describe("TenantDigitalClock", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it("toggles between 12h and 24h using segmented toggle buttons and clock face", () => {
    // Set time to 10:44 PM (22:44)
    vi.setSystemTime(new Date(2026, 8, 21, 22, 44, 0));

    render(<TenantDigitalClock />);

    // Advance timers so mounted becomes true
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Default is 12h, so it should show 10:44 PM
    expect(screen.getByText("10:44")).toBeDefined();
    expect(screen.getByText("PM")).toBeDefined();

    const btn12 = screen.getByRole("button", { name: "12H" });
    const btn24 = screen.getByRole("button", { name: "24H" });

    expect(btn12.getAttribute("aria-pressed")).toBe("true");
    expect(btn24.getAttribute("aria-pressed")).toBe("false");

    // Click the 24H segmented button
    fireEvent.click(btn24);

    // Now it should be 24h: 22:44 and 24H active
    expect(screen.getByText("22:44")).toBeDefined();
    expect(screen.queryByText("PM")).toBeNull();
    expect(btn24.getAttribute("aria-pressed")).toBe("true");
    expect(btn12.getAttribute("aria-pressed")).toBe("false");

    // Click 12H button to switch back
    fireEvent.click(btn12);
    expect(screen.getByText("10:44")).toBeDefined();
    expect(screen.getByText("PM")).toBeDefined();
    expect(btn12.getAttribute("aria-pressed")).toBe("true");

    // Clicking the clock face itself also toggles
    const clockFace = screen.getByLabelText(/Current time is/);
    fireEvent.click(clockFace);
    expect(screen.getByText("22:44")).toBeDefined();
    expect(btn24.getAttribute("aria-pressed")).toBe("true");
  });
});
