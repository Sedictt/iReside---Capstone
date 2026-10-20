/**
 * Captures the mission slide screenshots from a running dev server, with the part
 * each slide talks about ringed in amber, into public/missions/<mission>/<slide>.webp.
 *
 *   node scripts/mission-shots/capture.mjs            (all slides)
 *   node scripts/mission-shots/capture.mjs finance    (slides whose file starts with "finance")
 *
 * Needs the defense demo data (scripts/seed-defense-demo.mjs) and a dev server
 * (BASE_URL, default http://localhost:3000). Nothing is saved or submitted: the
 * script only opens pages, tabs and dialogs. Each slide in src/lib/missions-config.ts
 * points at a file written here.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "missions");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ONLY = process.argv[2] || "";

// The demo landlord login lives in the seeder; read it from there instead of repeating it.
const seed = readFileSync(join(ROOT, "scripts", "seed-defense-demo.mjs"), "utf8");
const EMAIL = process.env.MISSION_SHOTS_EMAIL || seed.match(/const LANDLORD = \{[\s\S]*?email:\s*"([^"]+)"/)[1];
const PASSWORD = process.env.MISSION_SHOTS_PASSWORD || seed.match(/const PASSWORD = "([^"]+)"/)[1];

const HIDE_CSS = `
  nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast], #__next-build-watcher,
  [data-sonner-toaster], .driver-popover, .driver-overlay { display: none !important; }
  *, *::before, *::after { caret-color: transparent !important; }
`;

async function settle(page, ms = 1500) {
    await page.waitForLoadState("domcontentloaded");
    try {
        await page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch {
        // Pages with live subscriptions never go idle; the fixed wait below covers them.
    }
    await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
    await page.waitForTimeout(ms);
}

async function open(page, route, ms) {
    await page.goto(BASE + route);
    await settle(page, ms);
}

/** Smallest element that contains `inner` and also contains every one of `texts`. */
const around = (inner, ...texts) =>
    inner.locator(`xpath=ancestor-or-self::*[${texts.map((t) => `contains(normalize-space(.), ${JSON.stringify(t)})`).join(" and ")}][1]`);

/**
 * Dims the page except for the given elements and rings each one in amber.
 * With more than one element, each ring gets a number.
 */
const button = (page, name) => page.getByRole("button", { name }).first();
async function mark(page, targets, { pad = 8 } = {}) {
    const boxes = [];
    for (const target of targets.flat()) {
        await target.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});
    }
    for (const target of targets) {
        // An array of locators is ringed as one area around all of them.
        const parts = [];
        for (const loc of [target].flat()) {
            const box = await loc.boundingBox({ timeout: 10000 });
            if (!box) throw new Error(`Could not find ${loc}`);
            parts.push(box);
        }
        const x = Math.min(...parts.map((b) => b.x));
        const y = Math.min(...parts.map((b) => b.y));
        const r = Math.max(...parts.map((b) => b.x + b.width));
        const bottom = Math.max(...parts.map((b) => b.y + b.height));
        boxes.push({ x, y, width: r - x, height: bottom - y });
    }
    await page.evaluate(({ boxes, pad }) => {
        document.querySelectorAll("[data-mission-mark]").forEach((el) => el.remove());
        const ns = "http://www.w3.org/2000/svg";
        const w = window.innerWidth;
        const h = window.innerHeight;
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("data-mission-mark", "");
        svg.setAttribute("width", w);
        svg.setAttribute("height", h);
        svg.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
        const rects = boxes.map((b) => ({
            x: Math.max(4, b.x - pad),
            y: Math.max(4, b.y - pad),
            w: Math.min(b.width + pad * 2, w - 8),
            h: Math.min(b.height + pad * 2, h - 8),
        }));
        let holes = "";
        let rings = "";
        rects.forEach((r, i) => {
            holes += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="16" fill="black"/>`;
            rings += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="16" fill="none" stroke="#fbbf24" stroke-width="10" opacity="0.3"/>`;
            rings += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="16" fill="none" stroke="#fbbf24" stroke-width="4"/>`;
            if (rects.length > 1) {
                const cx = Math.max(18, r.x);
                const cy = Math.max(18, r.y);
                rings += `<circle cx="${cx}" cy="${cy}" r="15" fill="#fbbf24" stroke="#fff" stroke-width="3"/>`;
                rings += `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Inter,Segoe UI,sans-serif" font-size="16" font-weight="900" fill="#1e1b4b">${i + 1}</text>`;
            }
        });
        svg.innerHTML =
            `<defs><mask id="mission-hole"><rect width="${w}" height="${h}" fill="white"/>${holes}</mask></defs>` +
            `<rect width="${w}" height="${h}" fill="rgba(15,12,40,0.42)" mask="url(#mission-hole)"/>` +
            rings;
        document.body.appendChild(svg);
    }, { boxes, pad });
}

/* ---------------------------------------------------------------- scenes */

const SCENES = {
    "properties/portfolio": async (page) => {
        await open(page, "/landlord/properties");
        const occupancy = page.getByText("Occupancy", { exact: true }).first();
        await mark(page, [around(occupancy, "Occupancy", "Maintenance")]);
    },
    "properties/filters": async (page) => {
        await open(page, "/landlord/properties");
        await mark(page, [
            around(page.getByText("All Portfolio", { exact: true }).first(), "All Portfolio", "Action Required"),
            page.getByPlaceholder(/Filter portfolio/i),
            page.getByRole("button", { name: /Export Portfolio/i }),
        ]);
    },
    "properties/actions": async (page) => {
        await open(page, "/landlord/properties");
        await page.getByRole("button", { name: /^Manage$/ }).first().click();
        await page.waitForTimeout(900);
        const edit = page.getByText("Edit Property", { exact: true }).first();
        await mark(page, [around(edit, "Edit Property", "View Floor Plan", "View Tenants", "Maintenance")]);
    },
    "unit-map/canvas": async (page) => {
        await open(page, "/landlord/unit-map", 3000);
        await page.getByText("Floor Overview").locator("xpath=ancestor::*[.//button][1]").getByRole("button").last().click().catch(() => {});
        await page.waitForTimeout(500);
        await mark(page, [
            around(page.getByRole("heading", { name: "Room 101" }), "Room 101", "Maria"),
            around(page.getByRole("heading", { name: "Room 102" }), "Room 102", "Joshua"),
            [page.getByText("Available", { exact: true }).first(), page.getByText("Occupied", { exact: true }).last()],
        ], { pad: 6 });
    },
    "unit-map/inspector": async (page) => {
        await open(page, "/landlord/unit-map", 3000);
        await page.getByRole("heading", { name: "Room 101" }).click();
        await page.waitForTimeout(1500);
        await mark(page, [page.getByText(/^Command Center$/i).first().locator("xpath=ancestor::*[count(.//button)>=4][1]")]);
    },
    "tenants/roster": async (page) => {
        await open(page, "/landlord/tenants", 2500);
        await mark(page, [
            page.getByPlaceholder(/Search residents/i),
            around(page.getByText("Moving Out", { exact: true }).first(), "All", "Active", "Moving Out"),
        ]);
    },
    "tenants/screening": async (page) => {
        await open(page, "/landlord/applications", 2500);
        await page.getByText(/Patricia/).first().click();
        await page.waitForTimeout(1500);
        await mark(page, [around(button(page, /quick approve/i), "Request Payment")]);
    },
    "tenants/lease": async (page) => {
        await open(page, "/landlord/applications", 2500);
        await page.getByText(/Katrina/).first().click();
        await page.waitForTimeout(1500);
        await mark(page, [around(page.getByText(/sign/i).first(), "Lease")]);
    },
    "finance/hub": async (page) => {
        await open(page, "/landlord/invoices", 2500);
        await page.getByText(/^Invoices$/i).first().click();
        await page.waitForTimeout(1500);
        await mark(page, [
            [around(page.getByText(/^Net Cash Flow/i).first(), "₱"), around(page.getByText(/^Total Expenses/i).first(), "₱")],
            around(page.getByText(/^Unified Ledger$/i).first(), "Expenses"),
            around(page.getByText("Needs Verification", { exact: true }).first(), "Overdue", "Paid"),
        ]);
    },
    "finance/proof": async (page) => {
        await open(page, "/landlord/invoices", 2500);
        await page.getByText(/^Invoices$/i).first().click();
        await page.waitForTimeout(1200);
        await page.getByText("Needs Verification", { exact: true }).first().click();
        await page.waitForTimeout(1200);
        await page.getByText(/Joshua/).first().click();
        await page.waitForTimeout(2000);
        await mark(page, [page.getByText(/Proof of Payment|Uploaded Receipt/i).first().locator("xpath=ancestor::*[.//img][1]")]);
    },
    "finance/utilities": async (page) => {
        await open(page, "/landlord/utility-billing", 3000);
        await page.getByTitle("Inspect or adjust room details").first().click();
        await page.waitForTimeout(1500);
        await mark(page, [
            around(page.getByText(/Water Submeter/i).first(), "Electricity"),
            button(page, /Save & Bill This Unit/i),
        ]);
    },
    "finance/reports": async (page) => {
        await open(page, "/landlord/analytics", 3000);
        await button(page, /Export Report/i).click();
        await page.waitForTimeout(800);
        await mark(page, [
            [button(page, /^7D$/i), button(page, /^Custom$/i)],
            [button(page, /^PDF$/i), button(page, /^CSV$/i)],
        ]);
    },
    "operations/maintenance": async (page) => {
        await open(page, "/landlord/maintenance", 2500);
        await page.getByText(/Wall outlet/i).first().click();
        await page.waitForTimeout(1800);
        await mark(page, [
            // the list behind the dialog has badges too; the dialog's own badge is last
            page.getByText(/^High Priority$/i).last(),
            around(page.locator("#select-action"), "Action Required"),
        ]);
    },
    "operations/announcements": async (page) => {
        await open(page, "/landlord/community", 2500);
        await page.getByRole("button", { name: /^Announcement$/ }).click();
        await page.waitForTimeout(700);
        await mark(page, [around(page.getByRole("button", { name: /^Announcement$/ }), "Announcement", "Publish")]);
    },
    "operations/messaging": async (page) => {
        await open(page, "/landlord/messages", 2500);
        await page.getByText(/Maria Angelica Santos/).first().click();
        await page.waitForTimeout(2000);
        await mark(page, [page.getByPlaceholder(/Type a message/i).locator("xpath=ancestor::*[.//button][1]")]);
    },
};

/* ---------------------------------------------------------------- run */

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: "en-US" });
await context.addInitScript(() => {
    localStorage.setItem("ireside-consent-v1", JSON.stringify({ essential: true, analytics: false, marketing: false }));
    localStorage.setItem("ireside_language", "en");
});
const page = await context.newPage();

await open(page, "/login", 800);
await page.locator('input[type="email"]:visible').first().fill(EMAIL);
await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
await page.locator('button[type="submit"]:visible').first().click();
await page.waitForURL(/\/landlord\//, { timeout: 60000 });
await settle(page, 1500);

let failed = 0;
for (const [name, scene] of Object.entries(SCENES)) {
    if (ONLY && !name.startsWith(ONLY)) continue;
    try {
        await scene(page);
        const png = await page.screenshot();
        const file = join(OUT, `${name}.webp`);
        mkdirSync(dirname(file), { recursive: true });
        await sharp(png).webp({ quality: 82 }).toFile(file);
        console.log("captured", name);
    } catch (error) {
        failed++;
        console.error("FAILED", name, "-", error.message.split("\n")[0]);
        await page.screenshot({ path: join(OUT, `_failed-${name.replace("/", "-")}.png`) }).catch(() => {});
    }
    await page.keyboard.press("Escape").catch(() => {});
}

await browser.close();
process.exit(failed ? 1 : 0);
