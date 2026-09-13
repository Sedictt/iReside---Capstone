import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TenantMapNotReady } from "../TenantMapNotReady";

describe("TenantMapNotReady", () => {
    it("renders coming soon greeting and property information", () => {
        render(
            <TenantMapNotReady
                propertyName="Pinecrest Residences"
                propertyAddress="123 Mountain View Ave, Baguio City"
                currentUnitName="Unit 302"
            />
        );

        expect(screen.getByText("Interactive Map Coming Soon")).toBeDefined();
        expect(screen.getAllByText("Pinecrest Residences").length).toBeGreaterThan(0);
        expect(screen.getByText("123 Mountain View Ave, Baguio City")).toBeDefined();
        expect(screen.getAllByText("Unit 302").length).toBeGreaterThan(0);
        expect(screen.getByText("Pending Landlord Setup")).toBeDefined();
        expect(screen.getByText("Setup in Progress")).toBeDefined();
    });

    it("has links to return to dashboard and message landlord", () => {
        render(
            <TenantMapNotReady
                propertyName="Pinecrest Residences"
            />
        );

        const dashboardLinks = screen.getAllByRole("link").filter(a => a.getAttribute("href") === "/tenant/dashboard");
        expect(dashboardLinks.length).toBeGreaterThan(0);

        const messageLinks = screen.getAllByRole("link").filter(a => a.getAttribute("href") === "/tenant/messages");
        expect(messageLinks.length).toBeGreaterThan(0);
    });

    it("triggers onRefresh callback when refresh button is clicked", () => {
        const onRefresh = vi.fn();
        render(
            <TenantMapNotReady
                propertyName="Pinecrest Residences"
                onRefresh={onRefresh}
            />
        );

        const refreshButton = screen.getByTitle("Check if the landlord has completed map setup");
        fireEvent.click(refreshButton);
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });
});
