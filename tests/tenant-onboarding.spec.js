// @ts-check
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const TENANT_EMAIL = process.env.PLAYWRIGHT_TENANT_ONBOARDING_EMAIL || "";
const TENANT_PASSWORD = process.env.PLAYWRIGHT_TENANT_ONBOARDING_PASSWORD || "";

test.describe("tenant guided onboarding", () => {
    test.skip(!TENANT_EMAIL || !TENANT_PASSWORD, "PLAYWRIGHT_TENANT_ONBOARDING_EMAIL/PASSWORD are required");

    test("tenant can complete onboarding and resume mid-flow", async ({ page }) => {
        await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

        await page.getByLabel("Email", { exact: true }).fill(TENANT_EMAIL);
        await page.getByLabel("Password").fill(TENANT_PASSWORD);
        await page.getByRole("button", { name: /Sign into Account|Log In/i }).click();

        await expect(page).toHaveURL(/\/tenant\/onboarding/);

        await page.locator("#full-name").fill("Playwright Tenant");
        await page.locator("#phone").fill("+639171234567");
        await page.getByRole("button", { name: /Save and Continue/i }).click();

        await expect(page.getByText("Lease Acknowledgement")).toBeVisible();

        // Resume-path check: reload and ensure we stay on the next incomplete step.
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.getByText("Lease Acknowledgement")).toBeVisible();

        await page.getByRole("button", { name: /Acknowledge and Continue/i }).click();
        await expect(page.getByText("Payment Readiness")).toBeVisible();

        await page.getByRole("button", { name: /Confirm and Continue/i }).click();
        await expect(page.getByText("Support Handoff")).toBeVisible();

        await page.getByRole("button", { name: /Confirm Guidance/i }).click();
        await expect(page.getByText("Onboarding complete")).toBeVisible();

        await page.getByRole("button", { name: /Go to Tenant Dashboard/i }).click();
        await expect(page).toHaveURL(/\/tenant\/(dashboard|community)/);
    });
});
