import {
    Building2,
    Map,
    Users,
    CreditCard,
    Wrench,
    LucideIcon
} from "lucide-react";

export interface MissionSlide {
    id: string;
    title: string;
    description: string;
    tip?: string;
    image: string; // real screenshot from scripts/mission-shots/capture.mjs, e.g. '/missions/finance/hub.webp'
}

export interface MissionConfig {
    id: string;
    title: string;
    description: string;
    category: string;
    estimatedTime: string;
    iconName: "properties" | "unit_map" | "tenants" | "finance" | "operations";
    targetRoute: string;
    actionLabel: string;
    slides: MissionSlide[];
}

/**
 * Missions teach what onboarding does not. Onboarding already walks the landlord
 * through registering a property (amenities and rules included), building the unit
 * map, billing setup, inviting or walking in the first tenant, and the dashboard
 * tour (quick actions, cash payments, lobby flyer, sidebar). Keep those out of here.
 */
export const MISSIONS_CONFIG: MissionConfig[] = [
    // ─── MISSION 1: Managing Properties ─────────────────────────────────
    {
        id: "properties",
        title: "Managing Properties",
        description: "Read your property cards, find a building fast, and use quick actions.",
        category: "Portfolio",
        estimatedTime: "2 min",
        iconName: "properties",
        targetRoute: "/landlord/properties",
        actionLabel: "Go to Properties",
        slides: [
            {
                id: "properties_step_1",
                title: "Reading Your Property Cards",
                description: "Each building has its own card. It shows how many units are occupied out of the total, the percent occupied, and how many repairs are open.",
                tip: "A green badge means the building is doing well. Amber means it needs your attention.",
                image: "/missions/properties/portfolio.webp",
            },
            {
                id: "properties_step_2",
                title: "Finding a Property Fast",
                description: "Search by building name or location. Use the filters to show All Portfolio, Stable Assets, or only the buildings marked Action Required.",
                tip: "Click 'Export Portfolio' to save your property list as a CSV file.",
                image: "/missions/properties/filters.webp",
            },
            {
                id: "properties_step_3",
                title: "Manage & Quick Actions",
                description: "Click 'Manage' on a property card to open Quick Actions: Edit Property, View Floor Plan, View Tenants, or Maintenance.",
                tip: "Edit Property opens the same form you filled in when you added the building.",
                image: "/missions/properties/actions.webp",
            },
        ],
    },

    // ─── MISSION 2: Using Your Unit Map ─────────────────────────────────
    {
        id: "unit_map",
        title: "Using Your Unit Map",
        description: "Read the unit colors and manage any unit from its panel.",
        category: "Visual Setup",
        estimatedTime: "2 min",
        iconName: "unit_map",
        targetRoute: "/landlord/unit-map",
        actionLabel: "Open Unit Map",
        slides: [
            {
                id: "unit_map_step_1",
                title: "Reading the Unit Colors",
                description: "Each unit shows its name, the tenant's name if someone lives there, and a status badge. Green is available, blue is occupied, amber means rent is almost due, and red means maintenance.",
                tip: "A unit with an open repair request turns red automatically.",
                image: "/missions/unit-map/canvas.webp",
            },
            {
                id: "unit_map_step_2",
                title: "The Unit Details Panel",
                description: "Click any unit to open its panel. For an occupied unit, the buttons are View Lease, Start Repair, Create Invoice, and Service logs.",
                tip: "The buttons change with the unit's status. A vacant unit shows 'Mark occupied' instead of View Lease.",
                image: "/missions/unit-map/inspector.webp",
            },
        ],
    },

    // ─── MISSION 3: Managing Residents ──────────────────────────────────
    {
        id: "tenants",
        title: "Managing Residents",
        description: "Find tenants, review applications, and sign leases.",
        category: "Residents",
        estimatedTime: "2 min",
        iconName: "tenants",
        targetRoute: "/landlord/tenants",
        actionLabel: "Go to Tenant Hub",
        slides: [
            {
                id: "tenants_step_1",
                title: "Your Tenant Directory",
                description: "The Tenants page lists everyone who lives in your properties. Search by name, unit, or property, and filter by All, Active, or Moving Out.",
                tip: "Open the Lease Renewals tab to see whose lease is due for renewal.",
                image: "/missions/tenants/roster.webp",
            },
            {
                id: "tenants_step_2",
                title: "Reviewing Applications",
                description: "Open Applications in the sidebar to see each applicant's job, income, contact details, and uploaded files. Request the move-in payment, then approve.",
                tip: "'Quick Approve' skips the payment step and creates the tenant account right away.",
                image: "/missions/tenants/screening.webp",
            },
            {
                id: "tenants_step_3",
                title: "Signing the Lease",
                description: "After approval, send the lease signing link. The tenant signs on their phone, then you finish with 'Complete Execution' and the lease becomes active.",
                tip: "The tenant is told the lease is active once both of you have signed.",
                image: "/missions/tenants/lease.webp",
            },
        ],
    },

    // ─── MISSION 4: Financial Overview ──────────────────────────────────
    {
        id: "finance",
        title: "Financial Overview",
        description: "Track cash flow, check receipts, bill utilities, and export reports.",
        category: "Finance",
        estimatedTime: "2 min",
        iconName: "finance",
        targetRoute: "/landlord/invoices",
        actionLabel: "Go to Finance Hub",
        slides: [
            {
                id: "finance_step_1",
                title: "Finance Hub at a Glance",
                description: "See your Net Cash Flow, the money Collected in the last 30 days, and your Total Expenses. Switch between Unified Ledger, Invoices, and Expenses.",
                tip: "Use the filters to show Overdue, Needs Verification, Awaiting, or Paid invoices.",
                image: "/missions/finance/hub.webp",
            },
            {
                id: "finance_step_2",
                title: "Checking a Payment Receipt",
                description: "Open an invoice to see the receipt the tenant uploaded for a GCash or bank transfer payment. If it matches, click 'Confirm & Issue Receipt'.",
                tip: "If something looks wrong, use 'Report Issue' or 'Reject This Payment' instead.",
                image: "/missions/finance/proof.webp",
            },
            {
                id: "finance_step_3",
                title: "Monthly Water & Electric Readings",
                description: "Open Utility Billing and click the edit button on a room. Enter the current water and electricity readings next to last month's, and the charge is worked out from your rate. Then click 'Save & Bill This Unit'.",
                tip: "The 'Record Submeters' button in the Finance Hub takes you there too.",
                image: "/missions/finance/utilities.webp",
            },
            {
                id: "finance_step_4",
                title: "Reports & Exports",
                description: "In Analytics, click 'Export Report', pick a period, and choose PDF or CSV. In Settings, you can also export your money records, properties, and tenants.",
                tip: "Report periods: 7 days, 30 days, 90 days, 1 year, or your own dates.",
                image: "/missions/finance/reports.webp",
            },
        ],
    },

    // ─── MISSION 5: Maintenance & Operations ────────────────────────────
    {
        id: "operations",
        title: "Maintenance & Operations",
        description: "Handle repairs, post announcements, and chat with tenants.",
        category: "Operations",
        estimatedTime: "2 min",
        iconName: "operations",
        targetRoute: "/landlord/maintenance",
        actionLabel: "Go to Maintenance",
        slides: [
            {
                id: "operations_step_1",
                title: "Handling Repair Requests",
                description: "Tenants report problems with photos, and each request shows its priority. Open a request in Maintenance and choose who fixes it under Select Action: you, or a contractor you name.",
                tip: "Use the status and priority filters to find urgent repairs first.",
                image: "/missions/operations/maintenance.webp",
            },
            {
                id: "operations_step_2",
                title: "Posting Announcements",
                description: "Post building news in the Community Hub, such as a scheduled water or power interruption. Announcements are pinned, so they stay at the top of the feed.",
                tip: "Tenants see your latest announcement on their dashboard.",
                image: "/missions/operations/announcements.webp",
            },
            {
                id: "operations_step_3",
                title: "Messaging Tenants",
                description: "Chat one-on-one with any tenant from Messages, without giving out your personal number. You can send photos too.",
                tip: "Unread conversations show a number, so nothing gets missed.",
                image: "/missions/operations/messaging.webp",
            },
        ],
    },
];

export const getMissionById = (id: string): MissionConfig | undefined => {
    return MISSIONS_CONFIG.find((m) => m.id === id);
};

export const MISSION_ICONS: Record<MissionConfig["iconName"], LucideIcon> = {
    properties: Building2,
    unit_map: Map,
    tenants: Users,
    finance: CreditCard,
    operations: Wrench,
};

/** Tour-state metadata key holding the ids of finished missions (written only by the server). */
export const COMPLETED_MISSIONS_METADATA_KEY = "completed_mission_ids";

/** Finished mission ids from tour-state metadata, ignoring ids of missions that no longer exist. */
export const getCompletedMissionIds = (metadata: Record<string, unknown> | null | undefined): string[] => {
    const raw = metadata?.[COMPLETED_MISSIONS_METADATA_KEY];
    if (!Array.isArray(raw)) return [];
    return MISSIONS_CONFIG.filter((m) => raw.includes(m.id)).map((m) => m.id);
};

export const getMissionProgressPercent = (metadata: Record<string, unknown> | null | undefined): number =>
    Math.round((getCompletedMissionIds(metadata).length / MISSIONS_CONFIG.length) * 100);
