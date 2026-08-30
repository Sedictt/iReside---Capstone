import { 
    LayoutDashboard, 
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
    image: string; // e.g. '/missions/dashboard/step-1.png'
}

export interface MissionConfig {
    id: string;
    title: string;
    description: string;
    category: string;
    estimatedTime: string;
    iconName: "dashboard" | "properties" | "unit_map" | "tenants" | "finance" | "operations";
    targetRoute: string;
    actionLabel: string;
    slides: MissionSlide[];
}

export const MISSIONS_CONFIG: MissionConfig[] = [
    // ─── MISSION 1: Dashboard & Navigation ──────────────────────────────
    {
        id: "dashboard",
        title: "Dashboard & Navigation",
        description: "Master your command center, sidebar tools, and essential shortcuts.",
        category: "Orientation",
        estimatedTime: "2 min",
        iconName: "dashboard",
        targetRoute: "/landlord/dashboard",
        actionLabel: "Go to Dashboard",
        slides: [
            {
                id: "dashboard_step_1",
                title: "Welcome to Your Command Center",
                description: "The Landlord Dashboard gives you a complete 360° overview of your rental business: urgent alerts, pending payments, vacant units, and quick actions.",
                tip: "This is your starting point whenever you log into iReside.",
                image: "/missions/dashboard/step-1.png",
            },
            {
                id: "dashboard_step_2",
                title: "Sidebar & Navigation Hub",
                description: "The left sidebar gives you 1-click access to all modules: Dashboard, Analytics, Messaging, Properties, Unit Map, Applications, Tenants, and Invoices.",
                tip: "Hover over menu items to view module descriptions and notification badges.",
                image: "/missions/dashboard/step-2.png",
            },
            {
                id: "dashboard_step_3",
                title: "Global Property Selector",
                description: "Switch between specific buildings or select 'All Properties' using the dropdown at the top of your sidebar to filter your entire workspace.",
                tip: "All dashboard statistics instantly re-calculate based on your chosen property.",
                image: "/missions/dashboard/step-3.png",
            },
            {
                id: "dashboard_step_4",
                title: "Hero Banner & Instant Shortcuts",
                description: "Use the banner action buttons for everyday tasks: log Walk-in Applicants (Ctrl+K), generate Tenant Invite Links (Ctrl+I), or print Lobby QR Flyers.",
                tip: "You can also customize your banner background image using the camera button.",
                image: "/missions/dashboard/step-4.png",
            },
            {
                id: "dashboard_step_5",
                title: "Operational Metric Cards",
                description: "Monitor Past Due Rent, Rent Due in 7 Days, Open Units, and Active Invite Links. Click any card to inspect the full list of tenants or units.",
                tip: "Card numbers update live as payments and applications are processed.",
                image: "/missions/dashboard/step-5.png",
            },
            {
                id: "dashboard_step_6",
                title: "Action Required & Urgent Tasks",
                description: "Review pending tenant approvals, submitted proof of payments, and new maintenance tickets that require your immediate sign-off.",
                tip: "Items with high urgency badges are pinned to the top of your queue.",
                image: "/missions/dashboard/step-6.png",
            },
            {
                id: "dashboard_step_7",
                title: "Contacts Bar & Cash Payment Logging",
                description: "The right sidebar provides fast communication with tenants, chat shortcuts, and a one-click button to record In-Person Cash Payments.",
                tip: "Recording a cash payment automatically issues a digital receipt to the tenant.",
                image: "/missions/dashboard/step-7.png",
            },
        ],
    },

    // ─── MISSION 2: Managing Properties ─────────────────────────────────
    {
        id: "properties",
        title: "Managing Properties",
        description: "Learn how to register buildings, set amenities, and configure policies.",
        category: "Portfolio",
        estimatedTime: "2 min",
        iconName: "properties",
        targetRoute: "/landlord/properties",
        actionLabel: "Go to Properties",
        slides: [
            {
                id: "properties_step_1",
                title: "Portfolio Overview & Building Cards",
                description: "View all your registered buildings, total unit counts, occupancy percentages, and monthly revenue performance in one centralized hub.",
                tip: "Filter by property status or search by building name at the top.",
                image: "/missions/properties/step-1.png",
            },
            {
                id: "properties_step_2",
                title: "Adding a New Building (+ Add Property)",
                description: "Click '+ Add Property' to open the registration wizard. Specify building name, complete address, total floors, and default rental rules.",
                tip: "You can upload high-resolution hero photos to attract prospective tenants.",
                image: "/missions/properties/step-2.png",
            },
            {
                id: "properties_step_3",
                title: "Configuring Property Amenities",
                description: "Tag building amenities like High-Speed WiFi, Fitness Gym, 24/7 Security, Swimming Pool, and Parking Slots for each property.",
                tip: "Amenities attached to a property are displayed on tenant invite portals.",
                image: "/missions/properties/step-3.png",
            },
            {
                id: "properties_step_4",
                title: "Setting Rental Rules & Security Deposits",
                description: "Define standard security deposit months, advance rent requirements, pet policies, and house rules applicable to the property.",
                tip: "These terms automatically pre-fill into digital lease agreements.",
                image: "/missions/properties/step-4.png",
            },
            {
                id: "properties_step_5",
                title: "Property Settings & Action Menu",
                description: "Edit property details anytime, archive decommissioned buildings, or launch the Visual Unit Map directly from the property card menu.",
                tip: "Use the 3-dots action menu on any property card for fast management.",
                image: "/missions/properties/step-5.png",
            },
        ],
    },

    // ─── MISSION 3: Your Unit Map ───────────────────────────────────────
    {
        id: "unit_map",
        title: "Your Unit Map",
        description: "Set up your building layout and organize your units visually.",
        category: "Visual Setup",
        estimatedTime: "2 min",
        iconName: "unit_map",
        targetRoute: "/landlord/unit-map",
        actionLabel: "Open Unit Map",
        slides: [
            {
                id: "unit_map_step_1",
                title: "Floor Plan Setup Wizard",
                description: "When setting up a building's unit map for the first time, the organizer wizard helps you distribute units across multi-story levels.",
                tip: "Click 'Unit Map' in the left sidebar to open the planner.",
                image: "/missions/unit-map/step-1.png",
            },
            {
                id: "unit_map_step_2",
                title: "Floor Assignments & Lanes",
                description: "Drag and drop units between floor lanes (e.g. Ground Floor, 2nd Floor, Penthouse) to match your physical architecture.",
                tip: "Click '+ Add Floor' to create custom level names.",
                image: "/missions/unit-map/step-2.png",
            },
            {
                id: "unit_map_step_3",
                title: "Magic Bulk Organizer",
                description: "Managing many units? Use the Bulk Organizer sliders to distribute dozens of units across floors in seconds.",
                tip: "Adjust unit count per floor with simple slider controls.",
                image: "/missions/unit-map/step-3.png",
            },
            {
                id: "unit_map_step_4",
                title: "Launch 2D Visual Map",
                description: "Click 'Generate Map' to transform your floor assignments into a live, interactive 2D architectural layout.",
                tip: "Your layout is automatically preserved for subsequent sessions.",
                image: "/missions/unit-map/step-4.png",
            },
            {
                id: "unit_map_step_5",
                title: "Live Occupancy Canvas",
                description: "Inspect unit occupancy at a glance: vibrant green for vacant units, tenant avatar badges for occupied units, and amber for pending turnovers.",
                tip: "Hover over any unit box to view tenant name and monthly rent rate.",
                image: "/missions/unit-map/step-5.png",
            },
            {
                id: "unit_map_step_6",
                title: "Unit Inspector & Quick Actions",
                description: "Click any unit box to open the Unit Drawer. View active lease agreements, collect rent, assign tenants, or log maintenance tickets.",
                tip: "You can also change unit status (Vacant, Occupied, Under Maintenance) directly.",
                image: "/missions/unit-map/step-6.png",
            },
        ],
    },

    // ─── MISSION 4: Managing Residents & Invites ─────────────────────────
    {
        id: "tenants",
        title: "Managing Residents",
        description: "Invite residents, screen applicants, and sign digital leases.",
        category: "Residents",
        estimatedTime: "2 min",
        iconName: "tenants",
        targetRoute: "/landlord/tenants",
        actionLabel: "Go to Tenant Hub",
        slides: [
            {
                id: "tenants_step_1",
                title: "Tenant Hub Navigation & Roster",
                description: "The Tenant Hub centralizes your entire resident roster: active tenants, prospective applicants, pending leases, and move-out notices.",
                tip: "Use the search bar to locate tenants by name, unit number, or email.",
                image: "/missions/tenants/step-1.png",
            },
            {
                id: "tenants_step_2",
                title: "Generating Tenant Invite Links & QR Codes",
                description: "Create shareable invite links or QR codes. Applicants complete verification, upload government IDs, and submit proof of income online.",
                tip: "Invites can be property-wide or pre-locked to a specific unit number.",
                image: "/missions/tenants/step-2.png",
            },
            {
                id: "tenants_step_3",
                title: "Logging Walk-in Applicants (Ctrl + K)",
                description: "Have an applicant standing in front of you? Use the Walk-in Applicant modal to register their profile and assign a unit on the spot.",
                tip: "Press Ctrl+K (or Cmd+K on Mac) anywhere to open this modal instantly.",
                image: "/missions/tenants/step-3.png",
            },
            {
                id: "tenants_step_4",
                title: "Applicant Screening & ID Verification",
                description: "Review submitted government IDs, employment details, and emergency contacts before granting approval.",
                tip: "Click 'Approve Application' to automatically prepare their digital lease contract.",
                image: "/missions/tenants/step-4.png",
            },
            {
                id: "tenants_step_5",
                title: "Digital Lease Contracts & E-Signatures",
                description: "Generate legally compliant digital lease agreements with custom rental rates and deposit terms. Both landlord and tenant sign digitally.",
                tip: "Once signed, the tenant account is activated and assigned to their unit on the map.",
                image: "/missions/tenants/step-5.png",
            },
        ],
    },

    // ─── MISSION 5: Financial Overview & Invoices ────────────────────────
    {
        id: "finance",
        title: "Financial Overview",
        description: "Track rent cash flow, calculate utilities, and log cash receipts.",
        category: "Finance",
        estimatedTime: "2 min",
        iconName: "finance",
        targetRoute: "/landlord/invoices",
        actionLabel: "Go to Finance Hub",
        slides: [
            {
                id: "finance_step_1",
                title: "Finance & Invoices Hub Overview",
                description: "Monitor real-time cash flow, total collected revenue, outstanding balances, and invoice statuses (Paid, Overdue, Under Review).",
                tip: "Use the 1-click status pills (Overdue, Near Due, Paid) to filter invoices.",
                image: "/missions/finance/step-1.png",
            },
            {
                id: "finance_step_2",
                title: "Invoice Details & Payment Proof Verification",
                description: "Click any invoice to inspect tenant breakdown, rent amount, and review uploaded GCash / Maya transfer screenshots.",
                tip: "Click 'Approve Payment' to confirm proof and mark the invoice paid.",
                image: "/missions/finance/step-2.png",
            },
            {
                id: "finance_step_3",
                title: "Submeter Calculator & Utility Billing",
                description: "Easily calculate electricity and water charges by entering previous and current meter readings. Fees are auto-added to rent invoices.",
                tip: "Supports submeters per unit with automated kilowatt-hour rate calculation.",
                image: "/missions/finance/step-3.png",
            },
            {
                id: "finance_step_4",
                title: "Recording In-Person Cash Payments",
                description: "When a tenant pays in cash, log the payment with one click to immediately update their balance and issue an official digital receipt.",
                tip: "Instant receipts are sent to the tenant's mobile app and email.",
                image: "/missions/finance/step-4.png",
            },
            {
                id: "finance_step_5",
                title: "Financial Reports & Revenue Analytics",
                description: "Export monthly income statements, revenue summaries, and expense reports in PDF/CSV format for tax and accounting purposes.",
                tip: "Access historical revenue charts and occupancy trends anytime.",
                image: "/missions/finance/step-5.png",
            },
        ],
    },

    // ─── MISSION 6: Maintenance & Operations ────────────────────────────
    {
        id: "operations",
        title: "Maintenance & Operations",
        description: "Handle repairs, post announcements, and manage tenant chat.",
        category: "Operations",
        estimatedTime: "2 min",
        iconName: "operations",
        targetRoute: "/landlord/dashboard",
        actionLabel: "View Operations",
        slides: [
            {
                id: "operations_step_1",
                title: "Maintenance Ticket Management",
                description: "Receive repair requests directly from tenants with photos and issue descriptions (plumbing, electrical, appliance repairs).",
                tip: "Assign priority levels (Urgent, Medium, Low) and dispatch maintenance technicians.",
                image: "/missions/operations/step-1.png",
            },
            {
                id: "operations_step_2",
                title: "Community Announcements & Bulletins",
                description: "Broadcast important building updates, scheduled water/power interruptions, and community reminders directly to all residents.",
                tip: "Residents receive push notifications on their phones when an announcement is posted.",
                image: "/missions/operations/step-2.png",
            },
            {
                id: "operations_step_3",
                title: "Direct Tenant Messaging & Broadcast Channels",
                description: "Chat directly with individual residents or group channels from the Messaging hub without giving out personal phone numbers.",
                tip: "Keep all communication records organized in one secure audit trail.",
                image: "/missions/operations/step-3.png",
            },
            {
                id: "operations_step_4",
                title: "Printable Lobby QR Flyer",
                description: "Generate and print beautiful, professional lobby flyers with QR codes that prospective walk-in tenants can scan to apply on their phones.",
                tip: "Click 'Print Lobby Flyer' in your dashboard banner to export your custom flyer.",
                image: "/missions/operations/step-4.png",
            },
        ],
    },
];

export const getMissionById = (id: string): MissionConfig | undefined => {
    return MISSIONS_CONFIG.find((m) => m.id === id);
};

export const MISSION_ICONS: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    properties: Building2,
    unit_map: Map,
    tenants: Users,
    finance: CreditCard,
    operations: Wrench,
};
