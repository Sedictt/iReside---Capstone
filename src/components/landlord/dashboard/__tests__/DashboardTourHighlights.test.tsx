import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DashboardMainContent } from "../DashboardMainContent";
import { DashboardHeaderActions } from "../DashboardHeaderActions";

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
    useAuth: () => ({
        user: { id: "test-user-id" },
        profile: { full_name: "Test Landlord" },
        loading: false,
    }),
}));

// Mock NotificationContext
vi.mock("@/context/NotificationContext", () => ({
    useNotifications: () => ({
        notifications: [],
        unreadCount: 0,
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
    }),
}));

describe("Dashboard Tour Highlighting Parity", () => {
    it("renders pulsating highlight and ping beacon on Step 1: Quick Action Launchpad", () => {
        const { container } = render(
            <DashboardMainContent
                title="Welcome back"
                subtitle="Here is what is happening"
                time={new Date()}
                isTourOpen={true}
                currentTourStep={0}
            />
        );

        const quickActions = container.querySelector('[data-tour-id="tour-quick-actions"]');
        expect(quickActions).not.toBeNull();
        expect(quickActions?.className).toContain("ring-4 ring-primary");
        expect(quickActions?.className).toContain("animate-pulse");

        // Verify beacon ping dot is rendered
        const beacon = quickActions?.querySelector(".animate-ping");
        expect(beacon).not.toBeNull();
    });

    it("does not render tour highlight on Quick Actions when tour is closed", () => {
        const { container } = render(
            <DashboardMainContent
                title="Welcome back"
                subtitle="Here is what is happening"
                time={new Date()}
                isTourOpen={false}
                currentTourStep={0}
            />
        );

        const quickActions = container.querySelector('[data-tour-id="tour-quick-actions"]');
        expect(quickActions).not.toBeNull();
        expect(quickActions?.className).not.toContain("ring-4 ring-primary");
        expect(quickActions?.querySelector(".animate-ping")).toBeNull();
    });

    it("renders pulsating highlight and ping beacon on Step 4: Header Actions container", () => {
        const { container } = render(
            <DashboardHeaderActions
                onQuestPanelOpen={vi.fn()}
                isTourHighlighted={true}
            />
        );

        const navContainer = container.querySelector('[data-tour-id="tour-dashboard-navigation"]');
        expect(navContainer).not.toBeNull();
        expect(navContainer?.className).toContain("ring-4 ring-primary");
        expect(navContainer?.className).toContain("animate-pulse");

        // Verify beacon ping dot is rendered
        const beacon = navContainer?.querySelector(".animate-ping");
        expect(beacon).not.toBeNull();
    });

    it("does not render tour highlight on Header Actions when isTourHighlighted is false", () => {
        const { container } = render(
            <DashboardHeaderActions
                onQuestPanelOpen={vi.fn()}
                isTourHighlighted={false}
            />
        );

        const navContainer = container.querySelector('[data-tour-id="tour-dashboard-navigation"]');
        expect(navContainer).not.toBeNull();
        expect(navContainer?.className).not.toContain("ring-4 ring-primary");
        expect(navContainer?.querySelector(".animate-ping")).toBeNull();
    });
});
