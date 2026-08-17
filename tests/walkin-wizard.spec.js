// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const LANDLORD_EMAIL = process.env.PLAYWRIGHT_LANDLORD_EMAIL || 'landlord.one@ireside.local';
const LANDLORD_PASSWORD = process.env.PLAYWRIGHT_LANDLORD_PASSWORD || 'Passw0rd!';

test('landlord can submit a walk-in application through the wizard', async ({ page }) => {
  const uniqueStamp = Date.now();
  const applicantName = `Walkin E2E ${uniqueStamp}`;
  const applicantEmail = `walkin.e2e.${uniqueStamp}@example.com`;

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  await page.getByLabel('Email', { exact: true }).fill(LANDLORD_EMAIL);
  await page.getByLabel('Password').fill(LANDLORD_PASSWORD);
  await page.getByRole('button', { name: /Sign into Account|Log In/i }).click();

  await page.goto(`${BASE_URL}/landlord/applications?action=walk-in`, { waitUntil: 'networkidle' });
  await expect(page.getByText(/Tenant Application Wizard|Walk-in Application Wizard/i)).toBeVisible({ timeout: 15000 });

  await page.locator('#unit-select').selectOption({ index: 1 });
  await page.locator('#applicant-name').fill(applicantName);
  await page.locator('#applicant-email').fill(applicantEmail);
  await page.locator('#applicant-phone').fill('+639171234567');
  await page.locator('#move-in-date').fill('2026-04-15');
  await page.locator('#emergency-contact-name').fill('Emergency Contact');
  await page.locator('#emergency-contact-phone').fill('+639179876543');

  await page.getByRole('button', { name: /Continue/i }).click();

  await page.locator('#occupation').fill('QA Engineer');
  await page.locator('#employer').fill('iReside QA Team');
  await page.locator('#income').fill('65000');
  await page.locator('#additional-notes').fill('Created by Playwright E2E walk-in wizard test.');

  await page.getByRole('button', { name: /Continue/i }).click();

  // Complete all requirement checklist items so the flow can finish as approved.
  const requirementButtons = page.locator('button:has-text("Awaiting Audit")');
  const requirementCount = await requirementButtons.count();
  await Promise.all(
    Array.from({ length: requirementCount }, (_, i) => requirementButtons.nth(i).click())
  );

  await page.getByRole('button', { name: /Continue/i }).click();

  await page.getByRole('button', { name: /Finish & Approve|Save & Finish/i }).click();

  await expect(page.getByText(/Tenant Application Wizard|Walk-in Application Wizard/i)).toBeHidden({ timeout: 20000 });
  await expect(page.getByText(applicantName)).toBeVisible({ timeout: 20000 });
});
