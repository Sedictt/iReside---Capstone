// @ts-check
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const LANDLORD_EMAIL = 'landlord.one@ireside.local';
const LANDLORD_PASSWORD = 'Passw0rd!';
const TENANT_EMAIL = 'tenant.maple.a@ireside.local';
const TENANT_PASSWORD = 'Passw0rd!';

/**
 * Helper function to hide the Next.js dev overlay, toasts, product tours, and cookie dialogs
 * @param {import('@playwright/test').Page} page
 */
async function hideOverlaysAndBanners(page) {
  await page.evaluate(() => {
    // 1. Inject global styles to target typical Next.js Dev/Error Elements, Toasts, Product Tours, and Cookie Banners
    const styleElement = document.createElement('style');
    styleElement.id = 'hide-portfolio-overlays';
    styleElement.textContent = `
      /* Next.js Developer portals, build indicators, and toast error wrappers */
      nextjs-portal,
      #nextjs-portal,
      [data-nextjs-dialog-overlay],
      [data-nextjs-toast],
      .nextjs-toast-errors-parent,
      #__next-build-watcher,
      #__next-prerender-indicator,
      #webhook-overlay-warning,
      .nextjs-dialog-overlay,

      /* Cookie Consent banner containers */
      div.fixed[class*="z-[100]"],
      div.fixed[class*="z-100"],
      [id*="cookie"],
      [class*="cookie-consent"],
      
      /* Product Tour highlighting boxes, focal point backdrops, and active steps */
      [class*="z-[90]"],
      [class*="z-[95]"],
      [class*="z-90"],
      [class*="z-95"],
      [data-tour-id],
      div.fixed:has(p:text-is("Guided Tour")),
      div.fixed:has(h3:has-text("Tour")),
      .driver-popover,
      .driver-overlay {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(styleElement);

    // 2. Clear any shadow DOM elements that contain developer portals
    document.querySelectorAll('nextjs-portal').forEach(el => {
      if (el.shadowRoot) {
        const shadowStyle = document.createElement('style');
        shadowStyle.textContent = `
          div, dialog, iframe, [role="dialog"], .nextjs-toast-errors-parent {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
        `;
        el.shadowRoot.appendChild(shadowStyle);
      }
    });
  });
}

/**
 * Intelligent helper to wait until client hydration and API requests are fully completed,
 * without letting Next.js hot-reload websockets block the execution.
 * @param {import('@playwright/test').Page} page
 */
async function safeWaitForPageLoad(page) {
  // 1. Wait for main HTML DOM loading
  await page.waitForLoadState('domcontentloaded');
  
  // 2. Hide any active overlays immediately to prevent them flashing
  await hideOverlaysAndBanners(page);
  
  // 3. Wait for network to settle (max 4.5 seconds to handle supabase/HMR active sockets)
  try {
    await page.waitForLoadState('networkidle', { timeout: 4500 });
  } catch (e) {
    // Network idle timeout reached (normal for active Supabase listeners or Next.js hot reload sockets)
  }

  // 4. Give React client hydration and chart canvas animation 2 seconds to complete
  await page.waitForTimeout(2000);
  
  // 5. Hide overlays one final time in case they hydrated late
  await hideOverlaysAndBanners(page);
}

test.describe('iReside Portfolio Screenshot Exporter', () => {
  // Set consistent 1440x900 viewport for a clean, premium laptop feel
  test.use({ viewport: { width: 1440, height: 900 } });

  // Extend test timeout to allow complete loading and data hydration
  test.setTimeout(45000);

  test.beforeAll(async () => {
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }
  });

  test.beforeEach(async ({ page, context }) => {
    // Proactively initialize localStorage to suppress the cookie consent popup
    await context.addInitScript(() => {
      window.localStorage.setItem('ireside-consent-v1', JSON.stringify({ essential: true, analytics: false, marketing: false }));
      
      // Also suppress tenant/landlord guided tours if they check localStorage
      window.localStorage.setItem('ireside-tenant-tour-skipped', 'true');
      window.localStorage.setItem('ireside-landlord-tour-skipped', 'true');
      window.localStorage.setItem('ireside-tour-state', JSON.stringify({ status: 'completed' }));
    });
  });

  test('Public Screens & Landing Page', async ({ page }) => {
    // 1. Landing Page (Home)
    await page.goto(BASE_URL);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/01_landing_page.png', fullPage: true });

    // 2. Login Page
    await page.goto(`${BASE_URL}/login`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/02_login_page.png' });

    // 3. Signup Page
    await page.goto(`${BASE_URL}/signup`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/03_signup_page.png' });

    // 4. About Page
    await page.goto(`${BASE_URL}/about`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/04_about_page.png', fullPage: true });
  });

  test('Tenant Dashboard & Support Screens', async ({ page }) => {
    // Login as Tenant
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Email', { exact: true }).fill(TENANT_EMAIL);
    await page.getByLabel('Password').fill(TENANT_PASSWORD);
    await page.getByRole('button', { name: /Sign into Account|Log In/i }).click();

    // Give dashboard time to load and render the main elements
    await page.waitForURL(/\/tenant\//);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/05_tenant_dashboard.png' });

    // Tenant Community page
    await page.goto(`${BASE_URL}/tenant/community`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/06_tenant_community.png' });

    // Tenant Payments page
    await page.goto(`${BASE_URL}/tenant/payments`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/07_tenant_payments.png' });
  });

  test('Landlord Management Screens', async ({ page }) => {
    // Login as Landlord
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel('Email', { exact: true }).fill(LANDLORD_EMAIL);
    await page.getByLabel('Password').fill(LANDLORD_PASSWORD);
    await page.getByRole('button', { name: /Sign into Account|Log In/i }).click();

    // Landlord Dashboard
    await page.waitForURL(/\/landlord\//);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/08_landlord_dashboard.png' });

    // Landlord Tenants/Properties list
    await page.goto(`${BASE_URL}/landlord/tenants`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/09_landlord_tenants.png' });

    // Landlord Applications page
    await page.goto(`${BASE_URL}/landlord/applications`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/10_landlord_applications.png' });

    // Landlord Leases
    await page.goto(`${BASE_URL}/landlord/leases`);
    await safeWaitForPageLoad(page);
    await page.screenshot({ path: 'screenshots/11_landlord_leases.png' });
  });
});
