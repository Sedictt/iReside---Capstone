/**
 * Curated situational cases and demo accounts for the Defense Console (/demo-console).
 */

export type DemoAccountKey =
    | "landlord"
    | "melanie"
    | "shannea"
    | "arnold"
    | "starter"
    | "maria"
    | "joshua"
    | "katrina"
    | "ronald"
    | "christine"
    | "mark"
    | "angelo"
    | "daniel"
    | "public";

export type DemoCategory =
    | "In-Chat Cards"
    | "Payments & GCash"
    | "Leases & E-Sign"
    | "Applications"
    | "Maintenance & Utilities"
    | "Onboarding & AI"
    | "Tenant Portal & Mobile";

export interface DemoAccount {
    key: DemoAccountKey;
    label: string;
    email: string | null;
    password: string | null;
    role: "landlord" | "tenant" | "public";
    room?: string;
    state: string;
    group: "landlord" | "key_tenant";
}

export interface ExtraResident {
    key: string;
    label: string;
    email: string;
    room: string;
    state: string;
}

export interface DemoScenario {
    id: string;
    category: DemoCategory;
    title: string;
    description: string;
    /** Clear situational trigger shown prominently on the card ("Use this when..."). */
    useWhen: string;
    as: DemoAccountKey;
    path: string;
    /** Optional POST /api/demo-console/actions key to seed/reset state before switching. */
    prepareAction?: string;
    /** Optional quick tip shown on the card. */
    tip?: string;
}

export const DEMO_PASSWORD = "Defense2026!";
export const STARTER_LANDLORD_PASSWORD = "LandlordDemo2026!";

export const DEMO_CATEGORIES: DemoCategory[] = [
    "In-Chat Cards",
    "Payments & GCash",
    "Leases & E-Sign",
    "Applications",
    "Maintenance & Utilities",
    "Onboarding & AI",
    "Tenant Portal & Mobile",
];

export const DEMO_ACCOUNTS: DemoAccount[] = [
    {
        key: "landlord",
        label: "John Peter Gonzales",
        email: "john.gonzales@ireside.ph",
        password: DEMO_PASSWORD,
        role: "landlord",
        state: "Client Landlord 1 · Fernando Gonzales Dormitory (Brgy. Marulas, 12 units)",
        group: "landlord",
    },
    {
        key: "melanie",
        label: "Melanie Tolentino",
        email: "melanie.tolentino@ireside.ph",
        password: DEMO_PASSWORD,
        role: "landlord",
        state: "Client Landlord 2 · Tolentino Apartments (Brgy. Malinta, 2 tenants)",
        group: "landlord",
    },
    {
        key: "shannea",
        label: "Shannea Joelle F. Joven",
        email: "shannea.joven@ireside.ph",
        password: DEMO_PASSWORD,
        role: "landlord",
        state: "Client Landlord 3 · Joven Boarding House (Brgy. Canumay, 2 tenants)",
        group: "landlord",
    },
    {
        key: "arnold",
        label: "Arnold F. Ferrer",
        email: "arnold.ferrer@ireside.ph",
        password: DEMO_PASSWORD,
        role: "landlord",
        state: "Client Landlord 4 · Ferrer Apartment (Brgy. Maysan, 2 tenants)",
        group: "landlord",
    },
    {
        key: "starter",
        label: "Practice Landlord 1",
        email: "practice.landlord1@ireside.ph",
        password: STARTER_LANDLORD_PASSWORD,
        role: "landlord",
        state: "Clean starter account for 5-stage onboarding",
        group: "landlord",
    },
    {
        key: "public",
        label: "Public Guest (Signed Out)",
        email: null,
        password: null,
        role: "public",
        state: "Signs out current session for public application & portal links",
        group: "landlord",
    },
    {
        key: "maria",
        label: "Maria Angelica Santos",
        email: "maria.santos@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "101",
        state: "Model tenant, all bills paid",
        group: "key_tenant",
    },
    {
        key: "joshua",
        label: "Joshua Miguel Dela Cruz",
        email: "joshua.delacruz@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "102",
        state: "GCash proof under review, plumber on site",
        group: "key_tenant",
    },
    {
        key: "katrina",
        label: "Katrina Mae Villanueva",
        email: "katrina.villanueva@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "201",
        state: "Lease waiting for her e-signature",
        group: "key_tenant",
    },
    {
        key: "ronald",
        label: "Ronald Bautista",
        email: "ronald.bautista@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "202",
        state: "October overdue, move-out pending, self-repair",
        group: "key_tenant",
    },
    {
        key: "christine",
        label: "Christine Joy Reyes",
        email: "christine.reyes@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "203",
        state: "Fixed term ending, renewal & Study Hall booking pending",
        group: "key_tenant",
    },
    {
        key: "mark",
        label: "Mark Anthony Lim",
        email: "mark.lim@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "301",
        state: "New tenant, first-time tour, urgent electrical ticket",
        group: "key_tenant",
    },
    {
        key: "angelo",
        label: "Angelo Fernandez",
        email: "angelo.fernandez@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "302",
        state: "Pays cash at office, transfer request to Room 303",
        group: "key_tenant",
    },
    {
        key: "daniel",
        label: "Daniel Ocampo",
        email: "daniel.ocampo@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant",
        room: "303 (former)",
        state: "Archived resident, moved out Aug 31 with refund breakdown",
        group: "key_tenant",
    },
];

export const EXTRA_RESIDENTS: ExtraResident[] = [
    { key: "jericho", label: "Jericho Navarro", email: "jericho.navarro@ireside.ph", room: "105", state: "Settled tenant, good standing" },
    { key: "lea", label: "Lea Marie Castillo", email: "lea.castillo@ireside.ph", room: "106", state: "Settled tenant, good standing" },
    { key: "ramon", label: "Ramon Aquino Jr.", email: "ramon.aquino@ireside.ph", room: "108", state: "Settled tenant, good standing" },
    { key: "hazel", label: "Hazel Ann Domingo", email: "hazel.domingo@ireside.ph", room: "205", state: "Settled tenant, good standing" },
    { key: "kristoffer", label: "Kristoffer Santiago", email: "kristoffer.santiago@ireside.ph", room: "207", state: "Settled tenant, good standing" },
    { key: "theresa", label: "Ma. Theresa Gutierrez", email: "theresa.gutierrez@ireside.ph", room: "208", state: "Settled tenant, good standing" },
    { key: "vincent", label: "Vincent Tan", email: "vincent.tan@ireside.ph", room: "305", state: "Settled tenant, good standing" },
    { key: "bea", label: "Bea Concepcion", email: "bea.concepcion@ireside.ph", room: "306", state: "Settled tenant, good standing" },
    { key: "arvin", label: "Arvin Salvador", email: "arvin.salvador@ireside.ph", room: "307", state: "Settled tenant, good standing" },
    { key: "nicole", label: "Nicole Ramos", email: "nicole.ramos@ireside.ph", room: "308", state: "Settled tenant, good standing" },
    { key: "nixon", label: "Nixon Sent Jr.", email: "nixon.sent@ireside.ph", room: "Tolentino 101", state: "Assigned to Melanie Tolentino (Brgy. Malinta)" },
    { key: "gian", label: "Gian Carlo Quintano", email: "gian.quintano@ireside.ph", room: "Tolentino 102", state: "Assigned to Melanie Tolentino (Brgy. Malinta)" },
    { key: "franchesca", label: "Franchesca Faith De Guzman", email: "franchesca.deguzman@ireside.ph", room: "Joven 101", state: "Assigned to Shannea Joelle F. Joven (Brgy. Canumay)" },
    { key: "jake", label: "Jake Manreal", email: "jake.manreal@ireside.ph", room: "Joven 102", state: "Assigned to Shannea Joelle F. Joven (Brgy. Canumay)" },
    { key: "estella", label: "Estella Marie P. Dacara", email: "estella.dacara@ireside.ph", room: "Ferrer 101", state: "Assigned to Arnold F. Ferrer (Brgy. Maysan)" },
    { key: "adrian", label: "Adrian Molina", email: "adrian.molina@ireside.ph", room: "Ferrer 102", state: "Assigned to Arnold F. Ferrer (Brgy. Maysan)" },
];

export const DEMO_SCENARIOS: DemoScenario[] = [
    // --- In-Chat Interactive Cards (All 5 types) ----------------------------
    {
        id: "chat-payment-submitted",
        category: "In-Chat Cards",
        title: "In-Chat: Payment Proof Submitted",
        description: "Shows Joshua's GCash payment proof card inside landlord chat with direct approve/reject controls.",
        useWhen: "Panelist asks to see the in-chat interactive payment proof card and landlord approval in real time.",
        as: "landlord",
        path: "/landlord/messages",
        prepareAction: "seed-chat-payment-submitted",
        tip: "Open Joshua Dela Cruz's thread to view the interactive GCash proof card.",
    },
    {
        id: "chat-reminder-card",
        category: "In-Chat Cards",
        title: "In-Chat: Rent Reminder with Pay Now",
        description: "Shows an interactive rent due reminder card inside Ronald's chat with a 1-tap Pay Now button.",
        useWhen: "Panelist asks how tenants get notified of unpaid rent inside chat and pay directly.",
        as: "ronald",
        path: "/tenant/messages",
        prepareAction: "seed-chat-reminder-card",
        tip: "Open the landlord thread to test the embedded Pay Now action.",
    },
    {
        id: "chat-cash-intent",
        category: "In-Chat Cards",
        title: "In-Chat: Cash Payment Intent",
        description: "Shows Angelo's 72-hour cash payment intent card so the landlord can record office collection.",
        useWhen: "Panelist asks how walk-in or cash-paying tenants are tracked without online payment.",
        as: "landlord",
        path: "/landlord/messages",
        prepareAction: "seed-chat-cash-intent",
        tip: "Open Angelo Fernandez's thread to see the pending cash intent card.",
    },
    {
        id: "chat-invoice-receipt",
        category: "In-Chat Cards",
        title: "In-Chat: Official Receipt Card",
        description: "Displays an official itemized payment receipt card delivered directly inside Maria's chat.",
        useWhen: "Panelist asks where tenants receive proof of payment or official itemized receipts.",
        as: "maria",
        path: "/tenant/messages",
        prepareAction: "seed-chat-invoice-receipt",
        tip: "Open the landlord thread to inspect or download the receipt summary.",
    },
    {
        id: "chat-payment-rejected",
        category: "In-Chat Cards",
        title: "In-Chat: Payment Rejected / Issue Resolver",
        description: "Demonstrates a rejected proof card in Joshua's chat with landlord note and quick re-upload resolution.",
        useWhen: "Panelist asks what happens if a tenant uploads a fake, blurry, or wrong GCash receipt.",
        as: "joshua",
        path: "/tenant/messages",
        prepareAction: "seed-chat-payment-rejected",
        tip: "Open the landlord thread to see the rejection reason and re-submit action.",
    },

    // --- Payments & GCash ---------------------------------------------------
    {
        id: "gcash-verify",
        category: "Payments & GCash",
        title: "GCash Payment Verification",
        description: "Landlord inspects Joshua's uploaded GCash screenshot and issues an official receipt.",
        useWhen: "Panelist asks how landlords verify GCash payments without paying third-party gateway fees.",
        as: "landlord",
        path: "/landlord/invoices",
        prepareAction: "quick-reset-joshua-bill",
        tip: "Go to Needs Verification → Joshua Dela Cruz → Confirm & Issue Receipt.",
    },
    {
        id: "tenant-pay-gcash",
        category: "Payments & GCash",
        title: "Tenant Pays Monthly Bill via GCash",
        description: "Tenant views itemized rent, kWh electricity, and m³ water charges and uploads GCash proof.",
        useWhen: "Panelist wants to see the full tenant billing breakdown and GCash proof submission flow.",
        as: "joshua",
        path: "/tenant/payments",
        prepareAction: "quick-reset-joshua-bill",
        tip: "Click Pay Now on November 2026 to walk through the GCash upload flow.",
    },
    {
        id: "cash-collection",
        category: "Payments & GCash",
        title: "Cash Payment Collection at Office",
        description: "Landlord records an in-person cash payment for Angelo (Room 302) and issues a digital receipt.",
        useWhen: "Panelist asks how senior or non-GCash tenants pay in cash and still get a digital receipt.",
        as: "landlord",
        path: "/landlord/dashboard?action=collect-payment",
        prepareAction: "seed-cash-collection",
        tip: "Opens Record Payment modal automatically with Angelo Fernandez pre-selected.",
    },
    {
        id: "overdue-expenses-ledger",
        category: "Payments & GCash",
        title: "Overdue Tracking, Expenses & CSV Ledger",
        description: "Shows Ronald's overdue October bill with ₱200 late fee, property expenses, and CSV export.",
        useWhen: "Panelist asks about late payment penalties, property expense tracking, or accounting exports.",
        as: "landlord",
        path: "/landlord/invoices?status=late",
        prepareAction: "seed-overdue-ledger",
        tip: "Switch between Invoices (Overdue), Expenses, and Unified Ledger tabs.",
    },

    // --- Leases & E-Sign ----------------------------------------------------
    {
        id: "tenant-esign-lease",
        category: "Leases & E-Sign",
        title: "Digital Lease E-Sign (Tenant)",
        description: "Katrina reviews her dormitory lease with custom clauses and signs with a 30-day JWT link.",
        useWhen: "Panelist asks to see how tenants digitally review and sign their lease contract.",
        as: "katrina",
        path: "/tenant/lease",
        prepareAction: "quick-reset-katrina",
        tip: "Click Review & Sign on the banner → draw signature → Finalize.",
    },
    {
        id: "landlord-countersign-audit",
        category: "Leases & E-Sign",
        title: "Landlord Countersign & Signing Audit Trail",
        description: "Landlord countersigns Katrina's lease to activate it, or inspects Mark's IP/device audit log.",
        useWhen: "Panelist asks how the landlord countersigns a lease or verifies legal e-sign audit logs.",
        as: "landlord",
        path: "/landlord/leases?id=ea37b3e5-e81c-4d19-b01e-747e4155cca8",
        prepareAction: "seed-katrina-countersign",
        tip: "Opens Katrina's pending-countersign lease directly. To view an active IP/device audit log, go to Active Leases and search Mark Lim.",
    },
    {
        id: "lease-renewal-transfer",
        category: "Leases & E-Sign",
        title: "Lease Renewal Request (+5% Policy)",
        description: "Review Christine's fixed-term lease renewal request with the +5% policy adjustment.",
        useWhen: "Panelist asks how expiring fixed-term leases and rent renewal adjustments are handled.",
        as: "landlord",
        path: "/landlord/tenants?tab=renewals",
        prepareAction: "seed-renewal-and-transfer",
        tip: "Opens Lease Renewals tab directly to review and approve Christine's renewal request.",
    },
    {
        id: "move-out-inspection",
        category: "Leases & E-Sign",
        title: "Move-Out Inspection & Deposit Refund",
        description: "Approve Ronald's move-out, record room deductions, and compute his security deposit refund.",
        useWhen: "Panelist asks how move-out checklists, damage deductions, and deposit refunds are computed.",
        as: "landlord",
        path: "/landlord/move-out",
        prepareAction: "seed-move-out-pending",
        tip: "Open Ronald Bautista under Pending → Approve → Start Inspection.",
    },

    // --- Applications -------------------------------------------------------
    {
        id: "competing-applicants",
        category: "Applications",
        title: "Competing Applicants Review & Approval",
        description: "Compare multiple applicants for Room 103, verify IDs, and approve in one step.",
        useWhen: "Panelist asks what happens when two applicants apply for the exact same vacant unit.",
        as: "landlord",
        path: "/landlord/applications",
        prepareAction: "seed-competing-applicants",
        tip: "Open Pending tab → select Jerome Pascual → Quick Approve.",
    },
    {
        id: "prospect-payment-portal",
        category: "Applications",
        title: "Prospect Move-In Payment Portal",
        description: "Approved applicant Kevin sees advance + deposit breakdown and uploads GCash proof without logging in.",
        useWhen: "Panelist asks how approved applicants pay their move-in deposit before getting an account.",
        as: "public",
        path: "/apply/payments/fgd-pay-kevin-portal-2026",
        prepareAction: "seed-competing-applicants",
        tip: "Shows the public token-gated portal before account activation.",
    },
    {
        id: "online-qr-application",
        category: "Applications",
        title: "Online QR Application Form (Public)",
        description: "Prospect scans a lobby QR code and submits personal, employment, and ID documents.",
        useWhen: "Panelist asks how walk-in or online prospects apply without downloading or logging in first.",
        as: "public",
        path: "/apply/fgd-apply-online-2026",
        prepareAction: "seed-competing-applicants",
        tip: "No account required; walks through the 4-step public intake wizard.",
    },
    {
        id: "application-status-tracker",
        category: "Applications",
        title: "Public Application Status Tracker",
        description: "Applicant checks live application milestones (submitted, under review, payment pending, approved) using a signed status link.",
        useWhen: "Panelist asks how applicants track their application progress without creating an account.",
        as: "public",
        path: "/apply/status",
        prepareAction: "prepare-application-tracker",
        tip: "Generates a live 30-day status token for Kevin (Payment Pending on Room 303) and opens /apply/status.",
    },

    // --- Maintenance & Utilities --------------------------------------------
    {
        id: "urgent-maintenance-triage",
        category: "Maintenance & Utilities",
        title: "Urgent Maintenance + iRis AI Triage",
        description: "Mark's sparking wall outlet ticket flagged as Urgent Fire Hazard with AI triage suggestions.",
        useWhen: "Panelist asks how emergency repairs are prioritized or how AI assists with maintenance triage.",
        as: "landlord",
        path: "/landlord/maintenance",
        prepareAction: "seed-urgent-maintenance",
        tip: "Open the top urgent ticket to assign a landlord, contractor, or self-repair.",
    },
    {
        id: "self-repair-ticket",
        category: "Maintenance & Utilities",
        title: "Tenant Self-Repair Request Flow",
        description: "Ronald's self-repair request awaiting landlord approval and cost/deduction decision.",
        useWhen: "Panelist asks how tenants can request to fix minor issues themselves with landlord approval.",
        as: "landlord",
        path: "/landlord/maintenance",
        prepareAction: "seed-self-repair-ticket",
        tip: "Review Ronald Bautista's self-repair ticket and approve/decline.",
    },
    {
        id: "utility-submeter-billing",
        category: "Maintenance & Utilities",
        title: "Utility Submeter Billing (kWh & m³)",
        description: "Enter monthly room electric and water meter readings and batch-generate itemized bills.",
        useWhen: "Panelist asks how electricity/water submeter readings are computed and billed per room.",
        as: "landlord",
        path: "/landlord/utility-billing",
        prepareAction: "seed-utility-cycle-ready",
        tip: "Save Readings → Send Monthly Bills (₱13.50/kWh & ₱35/m³).",
    },

    // --- Onboarding & AI ----------------------------------------------------
    {
        id: "iris-ai-broadcast",
        category: "Onboarding & AI",
        title: "iRis AI Assistant & Financial Analytics",
        description: "Ask iRis natural-language questions about unpaid rent, occupancy, and export PDF/CSV reports.",
        useWhen: "Panelist asks what AI capabilities or financial analytics reports the system provides.",
        as: "landlord",
        path: "/landlord/analytics?export=true",
        prepareAction: "seed-analytics-iris",
        tip: "Opens Financial Analytics with the Export Report modal ready for 1-click download.",
    },
    {
        id: "landlord-5stage-onboarding",
        category: "Onboarding & AI",
        title: "5-Stage Landlord Onboarding Wizard",
        description: "Walks a fresh landlord through Property Setup, Unit Map, Utility Rails, Tenants, and Tour.",
        useWhen: "Panelist asks what a brand-new landlord sees on their very first login.",
        as: "starter",
        path: "/setup",
        prepareAction: "prepare-starter-onboarding",
        tip: "Resets Practice Landlord 1 so you can demo /setup from scratch.",
    },
    {
        id: "unit-map-3floor",
        category: "Onboarding & AI",
        title: "Interactive 3-Floor Unit Map",
        description: "Visual floor plan showing occupied, vacant, and maintenance rooms across 3 floors.",
        useWhen: "Panelist asks how landlords visually manage rooms, occupancy, and floor layouts.",
        as: "landlord",
        path: "/landlord/unit-map",
        prepareAction: "seed-unit-map",
        tip: "Switch floors and click Room 101 or Room 304 for live unit details.",
    },

    // --- Tenant Portal & Mobile ---------------------------------------------
    {
        id: "first-time-tenant-tour",
        category: "Tenant Portal & Mobile",
        title: "First-Time Tenant Guided Tour",
        description: "Resets Mark Lim (Room 301) so his first-login walkthrough tour launches automatically.",
        useWhen: "Panelist asks how first-time or non-techy tenants learn to navigate the portal.",
        as: "mark",
        path: "/tenant/dashboard",
        prepareAction: "reset-tenant-tour",
        tip: "Wait 1–2 seconds on the dashboard for the welcome tour modal to appear.",
    },
    {
        id: "community-amenity-booking",
        category: "Tenant Portal & Mobile",
        title: "Community Board, Polls & Amenity Booking",
        description: "Pinned notices, dormitory polls, photo albums, and Study Hall amenity reservations.",
        useWhen: "Panelist asks about tenant engagement, announcements, polls, or shared amenity booking.",
        as: "landlord",
        path: "/landlord/community?tab=approvals",
        prepareAction: "seed-community-approvals",
        tip: "Check Approvals tab for moderation; Christine (203) has a pending Study Hall booking.",
    },
    {
        id: "mobile-app-shell",
        category: "Tenant Portal & Mobile",
        title: "Mobile App Shell (Tenant & Android APK)",
        description: "Responsive mobile-first shell used inside the native Android APK wrapper.",
        useWhen: "Panelist asks to see the mobile responsiveness or Android app experience.",
        as: "maria",
        path: "/mobile/tenant/home",
        prepareAction: "seed-mobile-shell",
        tip: "Resize browser to mobile width or open DevTools device toolbar.",
    },
];
