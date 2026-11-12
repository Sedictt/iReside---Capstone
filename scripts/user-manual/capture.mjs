/**
 * Captures the step pictures for the print manual from a running dev server,
 * with the part each step talks about ringed, into docs/manual/shots/<lang>/<task>-<step>.jpg.
 *
 *   node scripts/user-manual/capture.mjs en            (every task, English screens)
 *   node scripts/user-manual/capture.mjs fil gcash     (one task, Filipino screens)
 *
 * Needs the defense demo data (scripts/seed-defense-demo.mjs) and a dev server
 * (BASE_URL, default http://localhost:3000). Nothing is submitted, paid, signed or
 * approved: scenes only open pages and dialogs and type into fields. Steps with no
 * scene (things done outside iReside, like the GCash app) get no picture.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const LANG = process.argv[2] === "fil" ? "fil" : "en";
const ONLY = (process.argv[3] || "").split(",").filter(Boolean);
const OUT = join(ROOT, "docs", "manual", "shots", LANG);
const VIEW = { width: 1280, height: 800 };
const SCALE = 1.5;

// Demo logins live in the seeder; read them from there instead of repeating them.
const seed = readFileSync(join(ROOT, "scripts", "seed-defense-demo.mjs"), "utf8");
const PASSWORD = seed.match(/const PASSWORD = "([^"]+)"/)[1];
const LANDLORD_EMAIL = seed.match(/const LANDLORD = \{[\s\S]*?email:\s*"([^"]+)"/)[1];
const EMAILS = {
    landlord: LANDLORD_EMAIL,
    maria: "maria.santos@ireside.ph",
    ronald: "ronald.bautista@ireside.ph",
    katrina: "katrina.villanueva@ireside.ph",
    mark: "mark.lim@ireside.ph",
    angelo: "angelo.fernandez@ireside.ph",
    joshua: "joshua.delacruz@ireside.ph",
};

/* ---------------------------------------------------------------- Filipino labels */

// Same phrase-keyed dictionaries the app uses (src/lib/i18n); core fil.ts wins.
const FIL = {};
{
    const STR = String.raw`"((?:[^"\\]|\\.)*)"`;
    const re = new RegExp(String.raw`^\s*(?:${STR}|([A-Za-z_][\w.]*))\s*:\s*${STR}`, "gm");
    const dir = join(ROOT, "src", "lib", "i18n");
    const files = [join(dir, "dictionaries", "fil.ts"), ...readdirSync(join(dir, "modules")).map((f) => join(dir, "modules", f))];
    for (const file of files) {
        for (const m of readFileSync(file, "utf8").matchAll(re)) {
            const key = m[1] ?? m[2];
            if (!(key in FIL)) FIL[key] = m[3];
        }
    }
}
const T = (en) => (LANG === "fil" ? FIL[en] ?? en : en);
const exact = (s) => new RegExp(`^\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");

/* ---------------------------------------------------------------- page helpers */

const HIDE_CSS = `
  nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast], #__next-build-watcher,
  [data-sonner-toaster], .driver-popover, .driver-overlay { display: none !important; }
  *, *::before, *::after { caret-color: transparent !important; }
`;

async function settle(page, ms = 1500) {
    await page.waitForLoadState("domcontentloaded");
    try {
        await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
        // Pages with live subscriptions never go idle; the fixed wait below covers them.
    }
    await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
    await page.waitForTimeout(ms);
}

async function open(page, route, ms = 2000) {
    await page.goto(BASE + route);
    await settle(page, ms);
}

const text = (page, en, scope = page) => scope.getByText(exact(T(en))).locator("visible=true").first();
const btn = (page, en) => page.getByRole("button", { name: T(en) }).first();
const link = (page, en) => page.getByRole("link", { name: T(en) }).first();
const either = (a, b) => a.or(b).first();
const clickable = (page, en) => either(btn(page, en), link(page, en));
const sidebar = (page) => page.locator("aside").first();
const navItem = (page, en) => sidebar(page).getByText(exact(T(en))).first();

/** Smallest element that contains `inner` and also contains every one of `texts`. */
const around = (inner, ...texts) =>
    inner.locator(`xpath=ancestor-or-self::*[${texts.map((t) => `contains(normalize-space(.), ${JSON.stringify(T(t))})`).join(" and ")}][1]`);

async function boxOf(target) {
    const parts = [];
    for (const loc of [target].flat()) {
        await loc.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
    }
    for (const loc of [target].flat()) {
        const box = await loc.boundingBox({ timeout: 8000 });
        if (!box) throw new Error(`Could not find ${loc}`);
        parts.push(box);
    }
    const x = Math.min(...parts.map((b) => b.x));
    const y = Math.min(...parts.map((b) => b.y));
    return {
        x,
        y,
        width: Math.max(...parts.map((b) => b.x + b.width)) - x,
        height: Math.max(...parts.map((b) => b.y + b.height)) - y,
    };
}

/** Dims the page except the targets, rings each one, and returns the area to keep. */
async function mark(page, targets, pad = 8) {
    const boxes = [];
    for (const t of targets) boxes.push(await boxOf(t));
    await page.evaluate(({ boxes, pad }) => {
        document.querySelectorAll("[data-manual-mark]").forEach((el) => el.remove());
        const ns = "http://www.w3.org/2000/svg";
        const w = window.innerWidth;
        const h = window.innerHeight;
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("data-manual-mark", "");
        svg.setAttribute("width", w);
        svg.setAttribute("height", h);
        svg.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
        let holes = "";
        let rings = "";
        for (const b of boxes) {
            const x = Math.max(4, b.x - pad);
            const y = Math.max(4, b.y - pad);
            const rw = Math.min(b.width + pad * 2, w - x - 4);
            const rh = Math.min(b.height + pad * 2, h - y - 4);
            holes += `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="14" fill="black"/>`;
            rings += `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="14" fill="none" stroke="#d90429" stroke-width="5"/>`;
        }
        svg.innerHTML =
            `<defs><mask id="manual-hole"><rect width="${w}" height="${h}" fill="white"/>${holes}</mask></defs>` +
            `<rect width="${w}" height="${h}" fill="rgba(0,0,0,0.38)" mask="url(#manual-hole)"/>` +
            rings;
        document.body.appendChild(svg);
    }, { boxes, pad });
    return boxes;
}

/** Crop around the rings with a fixed 16:10 frame, so every picture has the same shape. */
function cropFor(boxes) {
    const minW = 720;
    if (!boxes.length) return { left: 0, top: 0, width: VIEW.width, height: VIEW.height };
    const x0 = Math.min(...boxes.map((b) => b.x)) - 40;
    const y0 = Math.min(...boxes.map((b) => b.y)) - 40;
    const x1 = Math.max(...boxes.map((b) => b.x + b.width)) + 40;
    const y1 = Math.max(...boxes.map((b) => b.y + b.height)) + 40;
    let w = Math.max(minW, x1 - x0, (y1 - y0) * 1.6);
    w = Math.min(w, VIEW.width);
    const h = Math.min(w / 1.6, VIEW.height);
    w = h * 1.6;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const left = Math.min(Math.max(0, cx - w / 2), VIEW.width - w);
    const top = Math.min(Math.max(0, cy - h / 2), VIEW.height - h);
    return { left, top, width: w, height: h };
}

/* ---------------------------------------------------------------- scenes
 * Each task: who signs in (null = signed out) and, per step number, a function that
 * gets the page ready and returns what to ring ([] = the whole screen).
 */


const SCENES = {
    open: {
        who: null,
        steps: {
            5: async (p) => { await open(p, "/login"); return [p.locator("form").first()]; },
        },
    },
    apply: {
        who: null,
        steps: {
            1: async (p) => { await open(p, "/login"); return [p.locator("form").first()]; },
            2: async (p) => [link(p, "Activate with Invite Code")],
            3: async (p) => { await open(p, "/signup/tenant"); return [clickable(p, "I have an invite")]; },
            4: async (p) => {
                await open(p, "/apply");
                await p.locator("#inviteCode").fill("fgd-apply-online-2026");
                return [p.locator("#inviteCode")];
            },
            5: async (p) => [btn(p, "Continue")],
            6: async (p) => {
                await open(p, "/apply/fgd-apply-online-2026", 3500);
                return [btn(p, "Continue")];
            },
        },
    },
    signin: {
        who: null,
        steps: {
            1: async (p) => { await open(p, "/login"); return [p.locator("form").first()]; },
            2: async (p) => {
                const email = p.locator('input[type="email"]:visible').first();
                await email.fill(EMAILS.maria);
                return [email];
            },
            3: async (p) => {
                const pw = p.locator('input[type="password"]:visible').first();
                await pw.fill(PASSWORD);
                return [pw];
            },
            4: async (p) => [p.locator('button[type="submit"]:visible').first()],
            5: async (p) => {
                await p.locator('button[type="submit"]:visible').first().click();
                await p.waitForURL(/\/tenant\//, { timeout: 90000 });
                await settle(p, 2500);
                return [];
            },
        },
    },
    menu: {
        who: "maria",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return [sidebar(p)]; },
            2: async (p) => [sidebar(p).locator("nav").first()],
            3: async (p) => [navItem(p, "Finance Hub")],
        },
    },
    language: {
        who: "maria",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return [navItem(p, "Settings")]; },
            2: async (p) => [navItem(p, "Settings")],
            3: async (p) => {
                await open(p, "/tenant/settings");
                return [around(text(p, "Text size and display"), "Text size and display", "language")];
            },
            4: async (p) => {
                await text(p, "Text size and display").click();
                await settle(p, 1500);
                return [around(text(p, "Text size"), "Text size", "Normal", "Bigger")];
            },
            5: async (p) => [around(p.getByText(/Filipino/).locator("visible=true").last(), "English", "Filipino")],
        },
    },
    lease: {
        who: "katrina",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard", 3000); return []; },
            2: async (p) => [around(text(p, "Your lease is waiting for your signature"), "Your lease is waiting for your signature", "Review & sign")],
            3: async (p) => [clickable(p, "Review & sign")],
            4: async (p) => {
                await clickable(p, "Review & sign").click();
                await p.waitForURL(/sign/, { timeout: 60000 }).catch(() => {});
                await settle(p, 4000);
                await p.getByRole("button", { name: T("Sign Document") }).first().waitFor({ timeout: 60000 }).catch(() => {});
                await p.waitForTimeout(1500);
                return [];
            },
            5: async (p) => [btn(p, "Sign Document")],
            6: async (p) => {
                await btn(p, "Sign Document").click();
                await p.waitForTimeout(1500);
                return [p.locator("canvas:visible").first()];
            },
            7: async (p) => [btn(p, "Finalize")],
        },
    },
    bill: {
        who: "ronald",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return []; },
            2: async (p) => [navItem(p, "Finance Hub")],
            3: async (p) => {
                await open(p, "/tenant/payments", 2500);
                return [around(text(p, "Balance Due"), "Balance Due", "₱")];
            },
            4: async (p) => [text(p, "Monthly Base Rent").locator("xpath=ancestor::*[count(.//*[contains(text(), '₱')]) >= 4][1]")],
            5: async (p) => [around(text(p, "Estimated Due"), "Estimated Due", "20")],
        },
    },
    gcash: {
        who: "ronald",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return [navItem(p, "Finance Hub")]; },
            2: async (p) => { await open(p, "/tenant/payments", 2500); return [clickable(p, "Pay Now")]; },
            3: async (p) => {
                await clickable(p, "Pay Now").click();
                await p.waitForURL(/checkout/, { timeout: 60000 });
                await settle(p, 3000);
                const gcash = p.locator('[data-method="gcash"]').first();
                await gcash.click().catch(() => {});
                await p.waitForTimeout(800);
                return [gcash];
            },
            4: async (p) => [around(p.getByText(/09\d{9}/).locator("visible=true").first(), "Copy")],
            7: async (p) => [around(text(p, "Upload Screenshot"), "Upload Screenshot", "JPG")],
            8: async (p) => {
                await p.locator('input[type="file"]').first().setInputFiles(join(ROOT, "scripts", "user-manual", "sample-proof.png"));
                await p.waitForTimeout(1500);
                return [around(p.getByText("sample-proof.png").first(), "sample-proof.png", "JPG")];
            },
            9: async (p) => {
                const ref = p.getByPlaceholder(T("13-digit GCash Ref #"));
                await ref.fill("1234567890123");
                return [ref];
            },
            10: async (p) => [btn(p, "Confirm & Settle Now")],
        },
    },
    bank: {
        who: "ronald",
        steps: {
            1: async (p) => { await open(p, "/tenant/payments", 2500); return [clickable(p, "Pay Now")]; },
            2: async (p) => {
                await clickable(p, "Pay Now").click();
                await p.waitForURL(/checkout/, { timeout: 60000 });
                await settle(p, 3000);
                const bank = p.locator('[data-method="bank_transfer"]').first();
                await bank.click();
                await p.waitForTimeout(1000);
                return [bank];
            },
            3: async (p) => [around(btn(p, "Copy account number"), "Account number", "Account name")],
            7: async (p) => [around(p.getByText(/Screenshot/).locator("visible=true").first(), "JPG")],
            8: async (p) => {
                const ref = p.getByPlaceholder(/ref/i).locator("visible=true").first();
                await ref.fill("BDO-20261102-0042");
                return [ref];
            },
            9: async (p) => [btn(p, "Confirm & Settle Now")],
        },
    },
    cash: {
        who: "ronald",
        steps: {
            1: async (p) => { await open(p, "/tenant/payments", 2500); return [clickable(p, "Pay Now")]; },
            2: async (p) => {
                await clickable(p, "Pay Now").click();
                await p.waitForURL(/checkout/, { timeout: 60000 });
                await settle(p, 3000);
                const cash = p.locator('[data-method="cash"]').first();
                await cash.click();
                await p.waitForTimeout(1000);
                return [cash];
            },
            3: async (p) => [btn(p, "Notify Landlord of Payment")],
        },
    },
    receipt: {
        who: "maria",
        steps: {
            1: async (p) => { await open(p, "/tenant/payments", 2500); return []; },
            2: async (p) => [clickable(p, "Payment History")],
            3: async (p) => {
                await clickable(p, "Payment History").click();
                await p.waitForTimeout(1500);
                return [around(p.getByText(/INV-2026/).locator("visible=true").first(), "₱", T("Receipted"))];
            },
            4: async (p) => [text(p, "Receipted")],
            5: async (p) => [clickable(p, "View Summary")],
        },
    },
    repair: {
        who: "mark",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard", 2500); return [clickable(p, "Request Repair")]; },
            2: async (p) => {
                await open(p, "/tenant/maintenance/new", 2500);
                const title = p.getByPlaceholder(T("e.g., Leaking faucet in the bathroom"));
                await title.fill(T("Leaking faucet in the bathroom"));
                return [title];
            },
            3: async (p) => {
                const d = p.getByPlaceholder(T("Please provide more details about the issue..."));
                await d.fill(LANG === "fil" ? "Tumutulo ang gripo sa banyo mula kahapon." : "The bathroom faucet has been dripping since yesterday.");
                return [d];
            },
            4: async (p) => [around(text(p, "Category"), "Category")],
            5: async (p) => [around(text(p, "Photos (Optional)"), "Photos (Optional)", "Upload")],
            6: async (p) => [btn(p, "Submit Request")],
        },
    },
    message: {
        who: "maria",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return [navItem(p, "Messages")]; },
            2: async (p) => {
                await open(p, "/tenant/messages", 3000);
                return [p.getByText(/John Peter Gonzales/).first()];
            },
            3: async (p) => {
                await p.getByText(/John Peter Gonzales/).first().click();
                await p.waitForTimeout(2500);
                return [p.locator("textarea:visible, input[type='text']:visible").last()];
            },
            4: async (p) => {
                const box = p.locator("textarea:visible, input[type='text']:visible").last();
                await box.fill(LANG === "fil" ? "Magandang umaga po. Kailan po ang inspeksyon?" : "Good morning. When is the inspection?");
                return [box];
            },
            5: async (p) => [p.getByRole("button", { name: new RegExp(T("Send message"), "i") }).last()],
        },
    },
    notify: {
        who: "maria",
        steps: {
            1: async (p) => {
                await open(p, "/tenant/dashboard");
                return [sidebar(p).getByRole("button", { name: T("Notifications") }).first()];
            },
            2: async (p) => {
                await sidebar(p).getByRole("button", { name: T("Notifications") }).first().click();
                await p.waitForTimeout(1500);
                return [text(p, "Mark all as read").locator("xpath=ancestor::*[.//li or count(.//button)>=2][1]")];
            },
            3: async (p) => [text(p, "Mark all as read").locator("xpath=ancestor::*[count(.//button)>=2][1]").locator("li, button").first()],
            4: async (p) => [clickable(p, "Mark all as read")],
        },
    },
    moveout: {
        who: "maria",
        steps: {
            1: async (p) => {
                await open(p, "/tenant/dashboard", 2500);
                return [around(text(p, "Quick Services"), "Quick Services", "Move Out")];
            },
            2: async (p) => [around(text(p, "Move Out"), "Move Out").locator("xpath=ancestor-or-self::button[1]")],
            3: async (p) => {
                await text(p, "Move Out").click();
                await p.waitForTimeout(1500);
                return [around(text(p, "Target Move-Out Date"), "Target Move-Out Date")];
            },
            4: async (p) => [around(text(p, "Reason for Leaving (Optional)"), "Reason for Leaving (Optional)")],
            5: async (p) => [btn(p, "Submit Request")],
        },
    },
    forgot: {
        who: null,
        steps: {
            1: async (p) => { await open(p, "/login"); return [link(p, "Forgot Password?")]; },
            2: async (p) => {
                await open(p, "/forgot-password");
                const email = p.locator('input[type="email"]:visible').first();
                await email.fill(EMAILS.maria);
                return [email, btn(p, "Send verification code")];
            },
        },
    },
    logout: {
        who: "maria",
        steps: {
            1: async (p) => { await open(p, "/tenant/dashboard"); return [navItem(p, "Log Out")]; },
            2: async (p) => [navItem(p, "Log Out")],
        },
    },
    "l-invite": {
        who: "landlord",
        steps: {
            1: async (p) => { await open(p, "/landlord/dashboard", 2500); return [navItem(p, "Applications")]; },
            2: async (p) => { await open(p, "/landlord/applications", 3000); return [clickable(p, "Invite Manager")]; },
            3: async (p) => {
                await clickable(p, "Invite Manager").click();
                await p.waitForTimeout(2500);
                return [around(p.getByText(/Generator/).locator("visible=true").first(), "Generate Invite")];
            },
            4: async (p) => [btn(p, "Generate Invite")],
            // History lists links made earlier, each with Copy Link and View QR.
            5: async (p) => {
                await p.getByRole("button", { name: /History/i }).first().click();
                await p.waitForTimeout(2000);
                return [btn(p, "Copy Link")];
            },
        },
    },
    "l-approve": {
        who: "landlord",
        steps: {
            1: async (p) => { await open(p, "/landlord/applications", 3000); return []; },
            2: async (p) => [clickable(p, "Pending")],
            3: async (p) => {
                await clickable(p, "Pending").click().catch(() => {});
                await p.waitForTimeout(1500);
                return [p.getByText(/Jerome Pascual/).first()];
            },
            4: async (p) => {
                await p.getByText(/Jerome Pascual/).first().click();
                await p.waitForTimeout(2500);
                return [around(p.getByText(/onboarding/i).locator("visible=true").first(), "%")];
            },
            5: async (p) => [btn(p, "Quick Approve"), btn(p, "Decline")],
        },
    },
    "l-bills": {
        who: "landlord",
        steps: {
            1: async (p) => { await open(p, "/landlord/dashboard", 2500); return [navItem(p, "Utility Billing")]; },
            2: async (p) => { await open(p, "/landlord/utility-billing", 4000); return [clickable(p, "Meter Readings")]; },
            3: async (p) => {
                await clickable(p, "Meter Readings").click().catch(() => {});
                await p.waitForTimeout(2000);
                return [p.getByText(/(Oct|Nov|Okt|Nob)[a-z]* 2026/i).first()];
            },
            4: async (p) => [p.locator("input[type='number']:visible").first()],
            5: async (p) => [clickable(p, "Save Readings")],
            6: async (p) => [clickable(p, "Send Monthly Bills")],
        },
    },
    "l-verify": {
        who: "landlord",
        steps: {
            1: async (p) => { await open(p, "/landlord/dashboard", 2500); return [navItem(p, "Finance Hub")]; },
            2: async (p) => {
                await open(p, "/landlord/invoices", 3000);
                await text(p, "Invoices").click().catch(() => {});
                await p.waitForTimeout(1500);
                return [text(p, "Needs Verification")];
            },
            3: async (p) => {
                await text(p, "Needs Verification").click();
                await p.waitForTimeout(1500);
                return [around(p.getByText(/Joshua/).first(), "₱")];
            },
            4: async (p) => {
                await p.getByText(/Joshua/).first().click();
                await p.waitForTimeout(3000);
                return [p.getByText(new RegExp(`${T("Proof of Payment")}|${T("Uploaded Receipt")}`, "i")).first().locator("xpath=ancestor::*[.//img][1]")];
            },
            6: async (p) => [btn(p, "Confirm & Issue Receipt")],
        },
    },
    "l-cash": {
        who: "landlord",
        steps: {
            2: async (p) => { await open(p, "/landlord/dashboard", 2500); return [navItem(p, "Finance Hub")]; },
            3: async (p) => {
                await open(p, "/landlord/invoices", 3000);
                await text(p, "Invoices").click().catch(() => {});
                await p.waitForTimeout(1500);
                return [around(p.getByText(/Angelo/).first(), "₱")];
            },
        },
    },
    "l-repair": {
        who: "landlord",
        steps: {
            1: async (p) => { await open(p, "/landlord/dashboard", 2500); return [navItem(p, "Maintenance")]; },
            2: async (p) => { await open(p, "/landlord/maintenance", 3000); return [p.getByText(/Wall outlet/i).first()]; },
            3: async (p) => {
                await p.getByText(/Wall outlet/i).first().click();
                await p.waitForTimeout(2500);
                return [];
            },
            4: async (p) => [around(p.locator("#select-action"), "Action Required")],
        },
    },
    "l-payout": {
        who: "landlord",
        steps: {
            1: async (p) => {
                await open(p, "/landlord/dashboard", 2500);
                await navItem(p, "System & Account").click();
                await p.waitForTimeout(1000);
                return [navItem(p, "System & Account"), navItem(p, "Settings")];
            },
            2: async (p) => {
                await open(p, "/landlord/settings", 3000);
                return [around(text(p, "Payment methods"), "Payment methods", "GCash")];
            },
            3: async (p) => {
                await open(p, "/landlord/settings?section=payments", 3500);
                return [around(p.getByText(/GCash/).first(), "GCash", "09")];
            },
            4: async (p) => [around(text(p, "Bank name"), "Name on your bank account")],
        },
    },
};

/* ---------------------------------------------------------------- run */

const browser = await chromium.launch();
const states = {};

async function newContext(who) {
    const context = await browser.newContext({
        viewport: VIEW,
        deviceScaleFactor: SCALE,
        locale: LANG === "fil" ? "fil-PH" : "en-US",
        reducedMotion: "reduce",
        storageState: who ? states[who] : undefined,
    });
    await context.addInitScript((lang) => {
        localStorage.setItem("ireside-consent-v1", JSON.stringify({ essential: true, analytics: false, marketing: false }));
        localStorage.setItem("ireside_language", lang);
    }, LANG);
    return context;
}

async function signIn(who) {
    if (!who || states[who]) return;
    const context = await newContext(null);
    const page = await context.newPage();
    await open(page, "/login", 800);
    await page.locator('input[type="email"]:visible').first().fill(EMAILS[who]);
    await page.locator('input[type="password"]:visible').first().fill(PASSWORD);
    await page.locator('button[type="submit"]:visible').first().click();
    await page.waitForURL(/\/(tenant|landlord)\//, { timeout: 90000 });
    await settle(page, 1500);
    states[who] = await context.storageState();
    await context.close();
}

mkdirSync(OUT, { recursive: true });
let failed = 0;
for (const [name, scene] of Object.entries(SCENES)) {
    const task = scene.task || name;
    if (ONLY.length && !ONLY.includes(task) && !ONLY.includes(name)) continue;
    await signIn(scene.who);
    const context = await newContext(scene.who);
    const page = await context.newPage();
    for (const [n, step] of Object.entries(scene.steps)) {
        const file = join(OUT, `${task}-${n}.jpg`);
        if (existsSync(file)) rmSync(file);
        try {
            const targets = await step(page);
            await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
            const boxes = targets.length ? await mark(page, targets) : [];
            const png = await page.screenshot();
            const c = cropFor(boxes);
            await sharp(png)
                .extract({
                    left: Math.round(c.left * SCALE),
                    top: Math.round(c.top * SCALE),
                    width: Math.round(c.width * SCALE),
                    height: Math.round(c.height * SCALE),
                })
                .resize({ width: 1200 })
                .jpeg({ quality: 82 })
                .toFile(file);
            console.log("captured", `${task}-${n}`);
        } catch (error) {
            failed++;
            console.error("FAILED", `${task}-${n}`, "-", error.message.split("\n")[0]);
            await page.screenshot({ path: join(OUT, `_failed-${task}-${n}.png`) }).catch(() => {});
        }
        await page.evaluate(() => document.querySelectorAll("[data-manual-mark]").forEach((el) => el.remove())).catch(() => {});
    }
    await context.close();
}

await browser.close();
console.log(failed ? `${failed} step(s) failed` : "all steps captured");
