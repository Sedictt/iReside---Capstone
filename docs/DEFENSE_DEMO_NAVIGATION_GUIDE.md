# iReside Defense Demo — Navigation Guide

**Client:** John Peter Gonzales · **Property:** Fernando Gonzales Dormitory (24 rooms, 3 floors, Marulas, Valenzuela City)
**Password for every demo account:** `Defense2026!`

> **Fastest way: open `/demo-console`.** It is a private launcher with one button per scenario below. A click signs you in as the right account and opens the screen in a second "demo" window (shift-click opens it in the same tab). It also has a **Reset demo data** button. The page only exists while `DEMO_CONSOLE_ENABLED=true` is in `.env` (already set locally); never set that on a public deployment because the page carries the demo password.
>
> Keep this document open as the fallback. Find the panel's question in **Section 3**, log in as the account it names, follow the click path.
> Before the defense (and after every rehearsal) run the reset in **Section 5** so every scenario is back at its starting point.

---

## 1. Accounts and what each one is for

| Login as | Email | Room | Why this account exists (the state it is parked in) |
|---|---|---|---|
| **Landlord** John Peter Gonzales | `john.gonzales@ireside.ph` | — | Owner. Everything on the landlord side. 4 alerts waiting. |
| Maria Angelica Santos | `maria.santos@ireside.ph` | 101 | **Model tenant.** Jan–Oct 2026 all paid (GCash), receipts, utilities, resolved ticket, community posts, 5-star review. Use for "show me a normal tenant". |
| Joshua Miguel Dela Cruz | `joshua.delacruz@ireside.ph` | 102 | **GCash proof awaiting landlord review.** October overdue with ₱200 late fee; he uploaded a GCash screenshot on Oct 12. Plumbing ticket in progress (3rd-party plumber). |
| Katrina Mae Villanueva | `katrina.villanueva@ireside.ph` | 201 | **Digital lease signing.** Application approved, lease generated, waiting for HER e-signature (move-in Nov 1). |
| Ronald Bautista | `ronald.bautista@ireside.ph` | 202 | **Move-out request pending** (Nov 30, Cebu). October unpaid, reminder already sent. Also has a self-repair request. |
| Christine Joy Reyes | `christine.reyes@ireside.ph` | 203 | **Fixed-term lease ending Nov 30 → renewal request pending.** Pays cash. Study Hall booking pending. Wi-Fi ticket assigned. |
| Mark Anthony Lim | `mark.lim@ireside.ph` | 301 | **New tenant, first login.** Moved in Oct 10 via remote e-signature (full audit trail). **Guided tour not yet taken** (logging in starts it). **Urgent electrical ticket** (sparking outlet). First invoice = November (upcoming). |
| Angelo Fernandez | `angelo.fernandez@ireside.ph` | 302 | **Cash / in-person payment intent** for October (landlord must collect). **Unit transfer request** to Room 303 pending. |
| Daniel Ocampo | `daniel.ocampo@ireside.ph` | 303 (former) | **Archived.** Moved out Aug 31; completed move-out with inspection + deposit refund breakdown. Use for "what happens after a tenant leaves". |

Other residents (settled, all paid up, same password, use them only if the panel wants "another tenant"): 105 Jericho Navarro, 106 Lea Marie Castillo, 108 Ramon Aquino Jr., 205 Hazel Ann Domingo, 207 Kristoffer Santiago, 208 Ma. Theresa Gutierrez, 305 Vincent Tan, 306 Bea Concepcion, 307 Arvin Salvador, 308 Nicole Ramos. Their logins are `firstname.lastname@ireside.ph` (for example `jericho.navarro@ireside.ph`).

Rooms without app accounts (realistic): 104 Bernard Mendoza and 204 Aljon Rivera are occupied walk-in residents not yet onboarded. 103, 107, 206 and 303 are vacant; 304 is under maintenance (repainting).

**Prospects (no login needed):**

| Name | State | Where |
|---|---|---|
| Jerome Pascual | Walk-in application, **pending review** (Room 103) | Landlord → Applications → Pending |
| Patricia Anne Cruz | Online application, **reviewing**, income verified (Room 103) | Landlord → Applications → Reviewing |
| Kevin Torres | **Approved, waiting for move-in payment** (Room 303) | Prospect payment portal link below |
| Rico Salazar | Rejected (history) | Landlord → Applications → All |

---

## 2. Links you will type

Local dev server: `http://localhost:3000` (production: `https://ireside.app`, same database).

| Purpose | URL |
|---|---|
| Sign in | `/login` |
| Public online application (QR / invite link) | `/apply/fgd-apply-online-2026` |
| Walk-in invite for Room 103 (face-to-face, single use) | `/apply/fgd-room103-walkin-2026` |
| Existing-resident onboarding link (Room 104, Bernard) | `/apply/fgd-room104-existing-2026` |
| Prospect payment portal (Kevin, ₱11,000 advance + deposit) | `/apply/payments/fgd-pay-kevin-portal-2026` |
| Tenant invite-code activation | `/signup/tenant` |
| Public docs / manual | `/docs`, `/landlord/docs`, `/tenant/docs` |
| Mobile app shell (resize the window to phone width) | `/mobile/landlord/overview`, `/mobile/tenant/home` |
| Android APK download page | `/download` |
| Privacy / Terms | `/privacy`, `/terms` |

Exact record IDs (lease IDs, payment IDs) are in `output/defense-demo-ids.json` after each seed run.

---

## 3. "Panel asks → do this"

Format: **Login as** → **Go to** → **Click** → **Say**.

### A. Tenant intake (applications)

**"How does a prospect apply?"**
Login: none → `/apply/fgd-apply-online-2026` → walk through Personal Details → Employment → Documents → Review & Submit.
Say: the landlord prints this QR on the lobby flyer; applicants never need an account to apply; the link can be property-wide or locked to one room, with required documents configurable per link.

**"How does the landlord create / manage invite links or QR codes?"**
Login: landlord → `/landlord/applications` → **Invite Manager** (top right).
Say: three link types — online (self-service), face-to-face (walk-in, single use), and existing-resident (onboard tenants who already live there). Each has **Copy Link**, **View QR**, usage count, expiry, and **Revoke**.

**"What about walk-ins?"**
Login: landlord → `/landlord/applications` → **Walk-in Intake** → fill the form for someone at the office.
Say: same pipeline, the landlord enters the data on the applicant's behalf.

**"How is an application reviewed / approved?"**
Login: landlord → `/landlord/applications` → **Pending** tab → open **Jerome Pascual** (Room 103). Show the compliance checklist, income, references, documents.
→ Click **Quick Approve** (or Approve) → choose signing mode (in-person vs remote e-signature) → record advance + deposit (or request payment through the portal) → confirm.
Say: approval creates the tenant account, the lease, the move-in invoices and the signing link in one transaction; the tenant receives credentials by e-mail.
(Patricia Anne Cruz is the "reviewing" example: income verified, waiting for an ID.)

**"How does the applicant pay the advance and deposit before moving in?"**
Login: none → `/apply/payments/fgd-pay-kevin-portal-2026`.
Say: Kevin was approved; the landlord generated two requirements (₱5,500 advance, ₱5,500 deposit). The prospect sees the landlord's GCash details, uploads proof, and the landlord confirms in Applications → **Payment Pending** → **Kevin Torres**. If cash was received in person the landlord uses the bypass (**Confirm Bypass**). Links expire automatically.

**"Can you reject?"** Open Jerome → **Reject** (ask the panel first; the reset restores him). Rico Salazar is a historical rejection.

### B. Digital lease signing

**"Show me how digital lease signing works." (most likely question)**
1. Login: **katrina.villanueva@ireside.ph** → dashboard shows the orange banner **"Your lease is waiting for your signature"** → click **Review & Sign**.
2. The e-signing viewer opens the generated Residential Lease Agreement (parties, Room 201, ₱5,000, rules, clauses). Click **Sign Document**, draw or type the signature, then **Finalize**.
3. Log out → login as **landlord** → `/landlord/leases` → the lease is now **pending landlord signature** → open it → countersign.
4. Lease becomes **Active**; Katrina gets a "Lease activated" notification; `/landlord/leases` → Mark Anthony Lim → **Audit Trail** shows the full trail (link generated → opened on iPhone/Android with IP → tenant signed → landlord signed → activated).
Say: links are signed JWTs (30-day expiry) stored as a hash; every step is written to `lease_signing_audit` with IP and user agent; the PDF is generated from the property's contract template plus custom clauses (curfew, visitors, utilities, notice to vacate).
Also: Katrina's lease is **remote** mode (link by e-mail / in-app). For **in-person** signing the landlord signs on the same device during approval.

**"Where does the tenant see the contract later?"** Login: any active tenant → `/tenant/lease` → **Download PDF** / **View Lease**, tabs Agreement · The Residence · Governance.

**"Can the landlord change the lease term?"** `/landlord/leases` → open a lease → switch term (open-ended ↔ fixed). Say: leases are month-to-month by default because that is how the client operates; fixed terms are opt-in and drive the renewal workflow.

### C. Rent, utilities, invoices, payments

**"How are monthly bills produced?"**
Login: landlord → `/landlord/utility-billing` → **Meter Readings** tab, cycle **Oct 2026**. Show previous/current readings per room (water m³, electricity kWh) → **Save Readings** → **Send Monthly Bills**.
Say: rates are ₱13.50/kWh and ₱35/m³ (pass-through, set in Settings → Utilities); the system computes rent + usage per room and issues itemised invoices; a cron does this on the 1st automatically.

**"Show me an invoice / receipt."**
Login: **maria.santos@ireside.ph** → `/tenant/payments` → **Payment History** → open October 2026 → line items (base rent, water with readings, electricity with readings), GCash reference, receipt number.
Landlord view: `/landlord/invoices` → **Invoices** tab → same invoice → receipt.

**"How does a tenant pay with GCash?"**
Login: **ronald.bautista@ireside.ph** → `/tenant/payments` → the current bill (October, overdue, ₱200 late fee) → **Pay Now** → GCash: shows the landlord's GCash name/number → enter reference number, upload screenshot → submit.
Say: no payment gateway fees; the proof goes to the landlord for verification.

**"How does the landlord verify a GCash payment?"**
Login: landlord → `/landlord/invoices` → **Invoices** tab → filter chip **Needs Verification** → card **Joshua Miguel Dela Cruz · INV-202610-… (Verify payment · Proof attached)** → the Invoice Specification modal opens → scroll to **Payment Verification**: the **Uploaded Receipt** (GCash screenshot) and reference number → **Confirm & Issue Receipt** (other review actions: accept as partial, ask for completion, reject with a reason) → receipt is issued and Joshua is notified.

**"What about tenants who pay cash?"**
Login: **angelo.fernandez@ireside.ph** → `/tenant/payments` → his October bill shows **"Pay in person"** intent (expires in ~2 days).
Landlord: `/landlord/dashboard` → **Record Payment** (or `/landlord/payments`) → choose Angelo → amount → **Collect Payment** → receipt.
Say: in-person intents auto-expire so the landlord's board stays honest.

**"How do reminders / late fees work?"**
`/landlord/invoices` → **Invoices** → chip **Overdue** → Ronald's October invoice (reminder sent Oct 8, ₱200 late fee applied after the due day, the 5th). Open it to send another reminder (e-mail + in-app).

**"Can the landlord issue a one-off charge?"** `/landlord/invoices` → **Issue Invoice** (e.g., key replacement).

**"Where are expenses?"** `/landlord/invoices` → **Expenses** tab (12 entries: permit renewal, CCTV drive, repaint, common-area electricity…) → **Record Expense**. The Unified Ledger merges income and expenses; **Export Ledger (CSV)**.

**"How does the landlord receive the money?"** `/landlord/settings?section=payments` → GCash payout account (John Peter Gonzales, 0917 111 2222), optional QR image.

### D. Maintenance

**"How does a tenant report a repair?"**
Login: **mark.lim@ireside.ph** → `/tenant/maintenance` → **New Request** (category, priority, photos) — or show his existing ticket **"Wall outlet sparking"** with the photo.

**"How does the landlord handle it?"**
Login: landlord → `/landlord/maintenance` (sort: **Smart Triage**). Top card: Mark's ticket, iRis triage = **urgent / distressed / fire hazard**.
Open it → assign: landlord repair, third-party contractor (Joshua's faucet: "Mang Dodong Plumbing"), or approve a tenant **self-repair** (Ronald's shower-head request has `self_repair_decision: pending`).
Say: statuses open → assigned → in progress → resolved → closed; the tenant confirms "personnel arrived / repairing / done" from their side (Joshua's shows *Personnel arrived*). AI triage is advisory only; the app works without it.

### E. Tenant lifecycle

**"Lease renewal?"**
Login: landlord → `/landlord/tenants` → **Lease Renewals** tab → **Christine Joy Reyes**: fixed term ends Nov 30, proposed ₱5,250 (+5% per property policy), Dec 2026 – Nov 2027 → **Review Renewal Terms** → **Approve & Generate Lease** (creates the new lease for signing) or **Reject Request** with notes.
Tenant side: **christine.reyes@ireside.ph** → `/tenant/lease` → renewal card / **Request Renewal**.
Renewal policy lives in `/landlord/properties` → property → Renewal Settings (window 90 days, 5% adjustment).

**"Move-out?"**
Login: landlord → `/landlord/move-out` → **Pending** → **Ronald Bautista** (Nov 30, Cebu) → **Approve Move-Out** (or **Deny Move-Out**) → **Start Inspection** (date, notes, photos, deductions) → **Complete Move-Out** → deposit refund computed.
Completed example: **Completed** tab → Daniel Ocampo (deductions ₱450, refund ₱5,050, checklist all ticked).
Tenant side: **ronald.bautista@ireside.ph** → `/tenant/lease` → **Request Move-Out** / move-out checklist.

**"Unit transfer?"**
Login: **angelo.fernandez@ireside.ph** → `/tenant/lease` → **Unit Transfer** portal (his request is pending: Room 302 → 303, noise); a new one is filed with **Initiate Transfer Request**.
Landlord: `/landlord/tenants` → Angelo → transfer request → approve/deny.

**"Tenant directory / profile?"** `/landlord/tenants` → **Directory** → open any card (lease, payments, activity, documents, contact, emergency contact).

**"Add a tenant without an application?"** `/landlord/tenants` → **Add Tenant** (manual entry for existing residents, e.g., Room 104 Bernard).

### F. Property, unit map, environment

**"Show the property / floor plan."** `/landlord/unit-map` → floors Ground / Second / Third, 8 rooms each along a central hallway with the stairs at the east end → click **Room 101** (Maria) → status, tenant, lease, open tickets. Vacant rooms are green; 304 is under maintenance. Show **Floor Overview** and the layout presets / building blocks on the right.
`/landlord/properties` → Fernando Gonzales Dormitory → amenities, house rules, contract template, environment policy.

**"Dormitory rules (curfew, visitors)?"** `/landlord/properties/<id>/environment` → environment mode **Dormitory**, curfew 11 PM, visitor cut-off 9 PM, quiet hours 10 PM – 6 AM, max 2 occupants, utilities sub-metered. These rules are injected into the generated lease.

**"Amenities / bookings?"** Landlord: `/landlord/properties` → Amenities (Study Hall, Laundry ₱60/hr, Common Kitchen, Rooftop). Tenant: **christine.reyes@ireside.ph** → `/tenant/lease` → Amenities → her Study Hall booking (pending). Maria has a confirmed laundry slot.

### G. Communication

**"Messaging?"** Login: landlord → `/landlord/messages` → Joshua thread (payment + plumber), Katrina thread (signing link), Mark (unread: sparking outlet). Tenant: `/tenant/messages`. Mini chat dock is on every page (bubble bottom-right).

**"Announcements / community?"** `/landlord/community` → pinned **water interruption Oct 21**, the **Christmas party poll** (5 votes), the fiesta **photo album**, tenant discussions (fan for sale, Wi-Fi). **Approvals** tab = moderation queue. Tenant: `/tenant/community`.

**"Notifications?"** Bell icon (landlord has 10, tenants 1–3 each). Landlord: `/landlord/dashboard` → **Alerts**. E-mail copies go out through SMTP (demo addresses are not real inboxes, so show the in-app bell).

**"AI assistant?"** Landlord `/landlord/dashboard` → iRis panel ("Who hasn't paid for October yet?" is already in history) or `/landlord/analytics` → iRis insights. Tenant `/tenant/messages` → iRis ("Kailan ang next due ko?").
Say: iRis only reads the landlord's own data; if the API key is missing the widget hides and nothing else breaks.

### H. Analytics, reports, documents, calendar

**"Analytics / reports?"** `/landlord/analytics` → occupancy (19 of 24), collections, expenses, trend charts → **Export Report** (CSV/PDF, simplified or detailed).

**"Calendar?"** `/landlord/calendar` → October: rent due dates, lease milestones (Katrina move-in Nov 1, Christine end Nov 30, Ronald move-out), maintenance visits.

**"Documents?"** `/landlord/documents` → business permit (VC-BP-2026-018734), lease PDFs, templates.

**"Printable flyer / QR poster?"** `/landlord/flyer` → Lobby Poster Studio: QR for the resident portal and the Android APK, Wi-Fi card, office hours → **Download**.

### I. Settings, security, onboarding

**"Settings?"** Landlord `/landlord/settings` (hub) → sections: `?section=profile|business|branding|payments|utilities|notifications|security|activity|records|display|comfort|data|help`. Tenant `/tenant/settings` → `profile|security|notifications|payments|privacy|display|comfort|money|account`.
Point out: large type and plain words (built for elderly landlords), EN/FIL toggle in the sidebar, light/dark theme.

**"Two-step sign-in / security?"** `/landlord/settings?section=security` → 2-step sign-in (Google OTP by e-mail), recovery key, signed-in devices. **Do not enable 2FA on the demo landlord unless you control the Gmail inbox.**

**"Audit trail / activity history?"** `/landlord/settings?section=activity` → activity log; lease audit trail under `/landlord/leases` → lease → **Audit Trail**; payment workflow events on each invoice.

**"How does a brand-new landlord set up the system?"** (first-run wizard)
Create a fresh starter account on the spot:
```bash
node scripts/create-starter-claimable-account.mjs
```
It prints an e-mail + password → log in → `/setup` wizard (business name, logo, colours, address, units, master credentials) → onboarding: register property → arrange unit map → billing (GCash + utility rates) → first tenant → dashboard tour. Nothing of the Gonzales demo is touched.

**"Tenant onboarding / guided tour?"** The guided tenant tour is behind a feature flag. To demo it, add `GUIDED_TENANT_PRODUCT_TOUR_ENABLED=true` to `.env` and restart the server; then login as **mark.lim@ireside.ph** → he is redirected to `/tenant/tour` (5-step guided tour) because his tour state is "not started" (every other tenant has completed it). With the flag off, Mark simply lands on his dashboard.
Landlord tour / quests: `/landlord/dashboard` → **Quick Tools** → **Mission Control** (quest board, **Start Mission** replays each guided mission).

**"Password reset / forgot password?"** `/forgot-password` (e-mail OTP). Tenants created by approval receive a temporary password and are asked to change it on first login.

**"Mobile?"** Resize to phone width or open `/mobile/tenant/home` and `/mobile/landlord/overview`; `/download` has the Android APK; the PWA installs from the browser menu. `/offline` is the offline fallback.

**"Filipino language?"** Sidebar **EN / FIL** toggle; everything including validation messages switches.

### J. Privacy and data

**"Where is the data? Who owns it?"** Supabase Postgres with Row-Level Security; each landlord sees only their own rows; service role only on the server. `/privacy` (Data Privacy Act RA 10173) and `/terms`.
**"Delete my data?"** by request (`npm run purge:user -- <email>` wipes an account end to end).

---

## 4. Numbers the panel may ask about (October 2026)

| Item | Value |
|---|---|
| Rooms | 24, 8 per floor (Ground ₱4,500 · Second ₱5,000 · Third A/C ₱5,500), 2 beds each |
| Occupancy | 19 of 24 (103, 107, 206, 303 vacant; 304 maintenance) |
| Utilities | ₱13.50/kWh electricity, ₱35/m³ water, sub-metered per room |
| Due day / late fee | 5th / ₱200 |
| Advance + deposit | 1 month + 1 month |
| October status | 12 of 15 invoices paid. Outstanding: 102 Joshua (GCash under review), 202 Ronald (overdue, reminded), 302 Angelo (cash intent). Mark (301) moved in Oct 10; his first invoice is November. |
| Collected last 30 days | ≈ ₱84k (Finance Hub) |
| Expenses YTD | ₱44,630 (12 entries) |

---

## 5. Reset / re-seed (do this before the defense and after rehearsals)

```bash
npm run seed:defense
```

- Takes ~1 minute. Deletes and rebuilds **only** the Gonzales demo data (same IDs every time). Other accounts in the database are untouched.
- **Everyone gets signed out** when it runs (passwords are re-applied). Log in again afterwards.
- `node scripts/seed-defense-demo.mjs --wipe` removes the demo data but keeps the accounts.
- Record IDs and the direct signing link are written to `output/defense-demo-ids.json`.

---

## 6. Gotchas

- **Do the signing demo once per reset.** After Katrina signs and the landlord countersigns, the lease is active; re-run the seeder to put it back.
- Approving Jerome creates a real account for `jerome.pascual@ireside.ph` (temporary password e-mailed to a non-existent inbox). The approved application card has a resend-credentials action if asked; otherwise reset.
- Demo e-mails (`@ireside.ph`) are not real inboxes: show e-mail-driven steps (signing link, credentials, reminders) through the in-app notification bell and the message threads instead.
- The direct signing link in `output/defense-demo-ids.json` only works on the server whose `JWT_SECRET` generated it (local). On production, use the in-app **Review & Sign** button — it generates its own link.
- The brand (logo, name, colours) is cached for 60 seconds per server. If a page briefly shows another property's name right after a restart, reload after a minute.
- The browser dev overlay ("1 issue", a React hydration warning from the sidebar animation) is cosmetic and pre-existing; run `npm run build && npm start` for a clean production-mode demo if you prefer.
- Two-factor sign-in is **off** on every demo account on purpose. Keep it off.
- Today's date matters: the seeder dates everything relative to the real clock (reminders "3 days ago", intents expiring "in 2 days"). Re-run it on defense day so the timeline reads naturally.
