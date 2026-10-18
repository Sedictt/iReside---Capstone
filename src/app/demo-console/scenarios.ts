/**
 * Scenario catalogue for the private defense console (/demo-console).
 * Mirrors docs/DEFENSE_DEMO_NAVIGATION_GUIDE.md; keep the two in sync.
 */

export type DemoAccountKey =
    | "landlord"
    | "maria"
    | "joshua"
    | "katrina"
    | "ronald"
    | "christine"
    | "mark"
    | "angelo"
    | "daniel"
    | "public";

export interface DemoAccount {
    key: DemoAccountKey;
    label: string;
    email: string | null;
    role: "landlord" | "tenant" | "public";
    room?: string;
    state: string;
}

export interface DemoScenario {
    id: string;
    group: string;
    title: string;
    as: DemoAccountKey;
    path: string;
    /** What to click once the page is open. */
    steps?: string;
    /** One line to say to the panel. */
    say?: string;
}

export const DEMO_PASSWORD = "Defense2026!";

export const DEMO_ACCOUNTS: DemoAccount[] = [
    { key: "landlord", label: "John Peter Gonzales", email: "john.gonzales@ireside.ph", role: "landlord", state: "Owner of Fernando Gonzales Dormitory" },
    { key: "maria", label: "Maria Angelica Santos", email: "maria.santos@ireside.ph", role: "tenant", room: "101", state: "Model tenant, everything paid" },
    { key: "joshua", label: "Joshua Miguel Dela Cruz", email: "joshua.delacruz@ireside.ph", role: "tenant", room: "102", state: "GCash proof under review, plumber on site" },
    { key: "katrina", label: "Katrina Mae Villanueva", email: "katrina.villanueva@ireside.ph", role: "tenant", room: "201", state: "Lease waiting for her e-signature" },
    { key: "ronald", label: "Ronald Bautista", email: "ronald.bautista@ireside.ph", role: "tenant", room: "202", state: "Move-out pending, October overdue" },
    { key: "christine", label: "Christine Joy Reyes", email: "christine.reyes@ireside.ph", role: "tenant", room: "203", state: "Fixed term ending, renewal pending" },
    { key: "mark", label: "Mark Anthony Lim", email: "mark.lim@ireside.ph", role: "tenant", room: "301", state: "New tenant, urgent electrical ticket" },
    { key: "angelo", label: "Angelo Fernandez", email: "angelo.fernandez@ireside.ph", role: "tenant", room: "302", state: "Pays cash, wants to transfer to 303" },
    { key: "daniel", label: "Daniel Ocampo", email: "daniel.ocampo@ireside.ph", role: "tenant", room: "303 (former)", state: "Archived, moved out Aug 31" },
    { key: "public", label: "No login (public page)", email: null, role: "public", state: "Signs you out first" },
];

export const DEMO_SCENARIOS: DemoScenario[] = [
    // --- Intake -------------------------------------------------------------
    { id: "apply-online", group: "Tenant intake", title: "Prospect applies online (QR / invite link)", as: "public", path: "/apply/fgd-apply-online-2026", steps: "Walk through Personal → Employment → Documents → Review.", say: "Applicants never need an account; the link can be property-wide or locked to one room." },
    { id: "invite-manager", group: "Tenant intake", title: "Invite links & QR codes", as: "landlord", path: "/landlord/applications", steps: "Click Invite Manager (top right).", say: "Online, walk-in and existing-resident links; copy, show QR, revoke." },
    { id: "walkin", group: "Tenant intake", title: "Walk-in intake form", as: "landlord", path: "/landlord/applications", steps: "Click Walk-in Intake.", say: "Same pipeline, landlord types it for the applicant at the office." },
    { id: "review-app", group: "Tenant intake", title: "Review / approve an application (Jerome, Room 103)", as: "landlord", path: "/landlord/applications", steps: "Pending tab → Jerome Pascual → Quick Approve → signing mode → record payments.", say: "Approval creates the account, the lease, move-in invoices and the signing link in one go. Reset afterwards." },
    { id: "app-reviewing", group: "Tenant intake", title: "Application under verification (Patricia)", as: "landlord", path: "/landlord/applications", steps: "Reviewing tab → Patricia Anne Cruz.", say: "Income verified, waiting for a valid ID." },
    { id: "prospect-portal", group: "Tenant intake", title: "Prospect pays advance + deposit (Kevin's portal)", as: "public", path: "/apply/payments/fgd-pay-kevin-portal-2026", say: "Approved applicant sees the GCash details, uploads proof; landlord confirms or bypasses for cash." },
    { id: "payment-pending", group: "Tenant intake", title: "Landlord side of Kevin's move-in payment", as: "landlord", path: "/landlord/applications", steps: "Payment Pending tab → Kevin Torres.", say: "Confirm the proof, or Confirm Bypass if cash was received." },

    // --- Lease signing ------------------------------------------------------
    { id: "sign-tenant", group: "Digital lease signing", title: "Tenant e-signs the lease (Katrina)", as: "katrina", path: "/tenant/lease", steps: "Orange banner → Review & Sign → Sign Document → Finalize.", say: "Signed JWT link, 30-day expiry, every step audited with IP and device. Do this once per reset." },
    { id: "sign-landlord", group: "Digital lease signing", title: "Landlord countersigns → lease active", as: "landlord", path: "/landlord/leases", steps: "After Katrina signs: open her lease (pending landlord signature) → sign.", say: "Lease becomes active; tenant gets a notification." },
    { id: "audit-trail", group: "Digital lease signing", title: "Signing audit trail (Mark, remote signing)", as: "landlord", path: "/landlord/leases", steps: "Mark Anthony Lim → Audit Trail.", say: "Link generated → opened on Android with IP → tenant signed → landlord signed → activated." },
    { id: "lease-view", group: "Digital lease signing", title: "Tenant views / downloads the contract", as: "maria", path: "/tenant/lease", steps: "Download PDF / View Lease; tabs Agreement, Residence, Governance.", say: "Generated from the property's contract template plus custom clauses." },
    { id: "lease-term", group: "Digital lease signing", title: "Open-ended vs fixed term", as: "landlord", path: "/landlord/leases", steps: "Open any active lease → switch term.", say: "Month-to-month by default because that is how the client operates; fixed terms are opt-in." },

    // --- Billing ------------------------------------------------------------
    { id: "utility-billing", group: "Rent & utilities", title: "Meter readings → monthly bills", as: "landlord", path: "/landlord/utility-billing", steps: "Meter Readings tab, Oct 2026 → Save Readings → Send Monthly Bills.", say: "₱13.50/kWh and ₱35/m³ sub-metered per room; a cron does this on the 1st." },
    { id: "invoice-tenant", group: "Rent & utilities", title: "Itemised invoice + receipt (tenant view)", as: "maria", path: "/tenant/payments", steps: "Payment History → October 2026.", say: "Base rent, water and electricity with readings, GCash reference, receipt number." },
    { id: "pay-gcash", group: "Rent & utilities", title: "Tenant pays via GCash (Ronald, overdue)", as: "ronald", path: "/tenant/payments", steps: "Current bill → Pay Now → GCash → reference + screenshot.", say: "No gateway fees; the proof goes to the landlord for verification." },
    { id: "verify-gcash", group: "Rent & utilities", title: "Landlord verifies a GCash payment (Joshua)", as: "landlord", path: "/landlord/invoices", steps: "Invoices tab → Needs Verification → Joshua → Uploaded Receipt → Confirm & Issue Receipt.", say: "Receipt issued automatically, tenant notified." },
    { id: "pay-cash-tenant", group: "Rent & utilities", title: "Tenant chooses to pay cash (Angelo)", as: "angelo", path: "/tenant/payments", say: "In-person intent with a 72-hour expiry so the board stays honest." },
    { id: "collect-cash", group: "Rent & utilities", title: "Landlord collects cash & issues receipt", as: "landlord", path: "/landlord/dashboard", steps: "Record Payment → Angelo Fernandez → amount → Collect Payment.", say: "Cash at the caretaker's office, receipted in the app." },
    { id: "reminder", group: "Rent & utilities", title: "Overdue invoice, late fee, reminders (Ronald)", as: "landlord", path: "/landlord/invoices", steps: "Invoices tab → Overdue chip → Ronald's October.", say: "₱200 late fee after the 5th; reminder already sent Oct 8." },
    { id: "issue-invoice", group: "Rent & utilities", title: "Issue a one-off invoice", as: "landlord", path: "/landlord/invoices", steps: "Issue Invoice.", say: "Example: key replacement." },
    { id: "expenses", group: "Rent & utilities", title: "Expenses & unified ledger (CSV export)", as: "landlord", path: "/landlord/invoices", steps: "Expenses tab → Record Expense; Unified Ledger → Export Ledger (CSV).", say: "12 expense entries: permit, CCTV drive, repaint, common-area power." },
    { id: "payout", group: "Rent & utilities", title: "Landlord GCash payout account", as: "landlord", path: "/landlord/settings?section=payments" },

    // --- Maintenance --------------------------------------------------------
    { id: "ticket-new", group: "Maintenance", title: "Tenant files a repair with photos (Mark)", as: "mark", path: "/tenant/maintenance", steps: "New Request, or open the sparking-outlet ticket.", say: "Category, priority, photo evidence, status updates." },
    { id: "ticket-triage", group: "Maintenance", title: "Landlord triage & assignment (Smart Triage)", as: "landlord", path: "/landlord/maintenance", steps: "Top card: Mark's outlet (iRis: urgent, fire hazard) → assign landlord / third party / self-repair.", say: "AI triage is advisory; Ronald's self-repair request is awaiting a decision." },
    { id: "ticket-progress", group: "Maintenance", title: "Ticket in progress with contractor (Joshua)", as: "joshua", path: "/tenant/maintenance", say: "Tenant reports 'personnel arrived / repairing / done' from their side." },

    // --- Lifecycle ----------------------------------------------------------
    { id: "renewal", group: "Tenant lifecycle", title: "Lease renewal review (Christine)", as: "landlord", path: "/landlord/tenants", steps: "Lease Renewals tab → Christine → Review Renewal Terms → Approve & Generate Lease.", say: "Fixed term ends Nov 30; +5% per property policy; 90-day window." },
    { id: "renewal-tenant", group: "Tenant lifecycle", title: "Tenant requests renewal", as: "christine", path: "/tenant/lease" },
    { id: "moveout", group: "Tenant lifecycle", title: "Move-out approval, inspection, deposit refund (Ronald)", as: "landlord", path: "/landlord/move-out", steps: "Pending → Ronald → Approve Move-Out → Start Inspection → Complete Move-Out. Completed tab: Daniel (refund ₱5,050).", say: "Deductions itemised; refund computed." },
    { id: "moveout-tenant", group: "Tenant lifecycle", title: "Tenant files move-out / checklist", as: "ronald", path: "/tenant/lease", steps: "Request Move-Out card." },
    { id: "transfer", group: "Tenant lifecycle", title: "Unit transfer request (Angelo 302 → 303)", as: "angelo", path: "/tenant/lease", steps: "Unit Transfer portal → Initiate Transfer Request." },
    { id: "tenants", group: "Tenant lifecycle", title: "Tenant directory & profiles", as: "landlord", path: "/landlord/tenants", steps: "Directory → open a card; Add Tenant for manual entry (Room 104 Bernard)." },
    { id: "archive", group: "Tenant lifecycle", title: "Former tenant (Daniel, archived)", as: "daniel", path: "/tenant/dashboard", say: "Moved out Aug 31; deposit returned with an itemised breakdown." },

    // --- Property -----------------------------------------------------------
    { id: "unit-map", group: "Property & rooms", title: "Interactive unit map / floor plan", as: "landlord", path: "/landlord/unit-map", steps: "Floors Ground / Second / Third → click Room 101.", say: "Green = vacant, 304 under maintenance; tenant, lease and tickets per room." },
    { id: "properties", group: "Property & rooms", title: "Property, amenities, rules, contract template", as: "landlord", path: "/landlord/properties" },
    { id: "environment", group: "Property & rooms", title: "Dormitory rules: curfew, visitors, quiet hours", as: "landlord", path: "/landlord/properties", steps: "Open the property → Environment.", say: "Curfew 11 PM, visitors until 9 PM, quiet 10 PM–6 AM, 2 occupants; injected into the lease." },
    { id: "amenities", group: "Property & rooms", title: "Amenity bookings (Study Hall, laundry)", as: "christine", path: "/tenant/lease", steps: "Amenities section → her pending Study Hall booking." },
    { id: "flyer", group: "Property & rooms", title: "Printable lobby flyer with QR codes", as: "landlord", path: "/landlord/flyer" },

    // --- Communication ------------------------------------------------------
    { id: "messages", group: "Communication", title: "Landlord ↔ tenant messaging", as: "landlord", path: "/landlord/messages", say: "Threads with Joshua (payment + plumber), Katrina (signing), Mark (unread)." },
    { id: "community", group: "Communication", title: "Community board: announcement, poll, album", as: "landlord", path: "/landlord/community", say: "Pinned water interruption, Christmas party poll (5 votes), fiesta album; Approvals tab = moderation." },
    { id: "community-tenant", group: "Communication", title: "Community board (tenant view)", as: "maria", path: "/tenant/community" },
    { id: "notifications", group: "Communication", title: "Notifications / alerts", as: "landlord", path: "/landlord/dashboard", steps: "Bell icon / Alerts (10 waiting)." },
    { id: "iris-landlord", group: "Communication", title: "iRis AI assistant (landlord)", as: "landlord", path: "/landlord/analytics", steps: "iRis panel; history already has 'Who hasn't paid for October yet?'.", say: "Reads only the landlord's own data; app works without it." },
    { id: "iris-tenant", group: "Communication", title: "iRis AI assistant (tenant)", as: "maria", path: "/tenant/messages" },

    // --- Analytics ----------------------------------------------------------
    { id: "dashboard", group: "Dashboard & analytics", title: "Landlord dashboard (today's overview)", as: "landlord", path: "/landlord/dashboard" },
    { id: "analytics", group: "Dashboard & analytics", title: "Analytics & export report", as: "landlord", path: "/landlord/analytics", steps: "Export Report (CSV/PDF)." },
    { id: "calendar", group: "Dashboard & analytics", title: "Operations calendar", as: "landlord", path: "/landlord/calendar" },
    { id: "documents", group: "Dashboard & analytics", title: "Document archive (permit, leases)", as: "landlord", path: "/landlord/documents" },
    { id: "tenant-dashboard", group: "Dashboard & analytics", title: "Tenant dashboard (new tenant, Mark)", as: "mark", path: "/tenant/dashboard" },

    // --- Settings & security ------------------------------------------------
    { id: "settings-landlord", group: "Settings & security", title: "Landlord settings hub (elderly-friendly)", as: "landlord", path: "/landlord/settings" },
    { id: "security", group: "Settings & security", title: "2-step sign-in, recovery key, devices", as: "landlord", path: "/landlord/settings?section=security", say: "Keep 2FA off on demo accounts." },
    { id: "activity", group: "Settings & security", title: "Activity / audit history", as: "landlord", path: "/landlord/settings?section=activity" },
    { id: "branding", group: "Settings & security", title: "White-label branding", as: "landlord", path: "/landlord/settings?section=branding" },
    { id: "settings-tenant", group: "Settings & security", title: "Tenant settings", as: "maria", path: "/tenant/settings" },
    { id: "privacy", group: "Settings & security", title: "Privacy policy (Data Privacy Act)", as: "public", path: "/privacy" },

    // --- Platform -----------------------------------------------------------
    { id: "login", group: "Platform", title: "Login page (EN / FIL, theme)", as: "public", path: "/login" },
    { id: "forgot", group: "Platform", title: "Forgot password (e-mail OTP)", as: "public", path: "/forgot-password" },
    { id: "mobile-tenant", group: "Platform", title: "Mobile app shell (tenant)", as: "maria", path: "/mobile/tenant/home", say: "Resize to phone width; Android APK at /download." },
    { id: "mobile-landlord", group: "Platform", title: "Mobile app shell (landlord)", as: "landlord", path: "/mobile/landlord/overview" },
    { id: "download", group: "Platform", title: "Android APK download page", as: "public", path: "/download" },
    { id: "docs", group: "Platform", title: "User manual / documentation", as: "public", path: "/docs" },
];
