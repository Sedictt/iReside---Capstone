// @ts-check
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const TENANT_EMAIL = process.env.PLAYWRIGHT_TENANT_ONBOARDING_EMAIL || "";
const TENANT_PASSWORD = process.env.PLAYWRIGHT_TENANT_ONBOARDING_PASSWORD || "";

async function loginAsTenant(page) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("Email", { exact: true }).fill(TENANT_EMAIL);
    await page.getByLabel("Password").fill(TENANT_PASSWORD);
    await page.getByRole("button", { name: /Sign into Account|Log In/i }).click();
}

test.describe("tenant product tour", () => {
    test.skip(!TENANT_EMAIL || !TENANT_PASSWORD, "PLAYWRIGHT_TENANT_ONBOARDING_EMAIL/PASSWORD are required");

    test("resume path survives page reload", async ({ page }) => {
        await loginAsTenant(page);
        await page.goto(`${BASE_URL}/tenant/tour`, { waitUntil: "networkidle" });

        if (await page.getByRole("button", { name: "Replay Tour" }).isVisible().catch(() => false)) {
            await page.getByRole("button", { name: "Replay Tour" }).click();
        }

        const startButton = page.getByRole("button", { name: /Start Tour|Resume Tour/i });
        await expect(startButton).toBeVisible();
        await startButton.click();

        await expect(page).not.toHaveURL(/\/tenant\/tour/);
        await expect(page.getByText("Guided Tour")).toBeVisible();

        const nextButton = page.getByRole("button", { name: /Next Step|Finish Tour/i }).first();
        await expect(nextButton).toBeVisible();
        await nextButton.click();

        await page.reload({ waitUntil: "networkidle" });
        await expect(page.getByText("Guided Tour")).toBeVisible();
    });

    test("tenant can skip tour from shell", async ({ page }) => {
        await loginAsTenant(page);
        await page.goto(`${BASE_URL}/tenant/tour`, { waitUntil: "networkidle" });

        if (await page.getByRole("button", { name: "Replay Tour" }).isVisible().catch(() => false)) {
            await page.getByRole("button", { name: "Replay Tour" }).click();
        }

        const skipButton = page.getByRole("button", { name: "Skip for Now" });
        await expect(skipButton).toBeVisible();
        await skipButton.click();

        await expect(page.getByText(/recently skipped/i)).toBeVisible();
    });

    test("tenant can complete happy path by stepping through guide", async ({ page }) => {
        await loginAsTenant(page);
        await page.goto(`${BASE_URL}/tenant/tour`, { waitUntil: "networkidle" });

        if (await page.getByRole("button", { name: /Replay Tour|Replay from Start/i }).isVisible().catch(() => false)) {
            await page.getByRole("button", { name: /Replay Tour|Replay from Start/i }).click();
        }

        await page.getByRole("button", { name: /Start Tour|Resume Tour/i }).click();

        for (let i = 0; i < 8; i += 1) {
            const goToStep = page.getByRole("button", { name: "Go to step" });
            if (await goToStep.isVisible().catch(() => false)) {
                await goToStep.click();
            }

            const nextOrFinish = page.getByRole("button", { name: /Next Step|Finish Tour/i }).first();
            if (await nextOrFinish.isVisible().catch(() => false)) {
                await nextOrFinish.click();
            }

            if (await page.getByRole("button", { name: "Replay Tour" }).isVisible().catch(() => false)) {
                break;
            }
        }

        await page.goto(`${BASE_URL}/tenant/tour`, { waitUntil: "networkidle" });
        await expect(page.getByRole("button", { name: "Replay Tour" })).toBeVisible();
    });
});
