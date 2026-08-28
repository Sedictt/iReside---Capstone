export type DocAudience = "tenant" | "landlord" | "it" | "user";

export type DocCategory =
  // Tenant Categories
  | "tenant_onboarding"
  | "tenant_leasing"
  | "tenant_payments"
  | "tenant_maintenance"
  | "tenant_utilities"
  | "tenant_community"
  | "tenant_messaging"
  | "tenant_moveout"
  | "tenant_faqs"
  // Landlord Categories
  | "property_setup"
  | "billing_payments"
  | "tenants_leases"
  | "maintenance_tickets"
  | "visual_unit_map"
  | "marketing_flyers"
  | "move_out_deposit"
  | "mobile_pwa"
  | "troubleshooting_faqs"
  // IT / Technical Categories
  | "architecture_cloud"
  | "environment_security"
  | "database_schema"
  | "cron_maintenance"
  | "disaster_recovery";

export interface DocArticle {
  id: string;
  audience: "tenant" | "landlord" | "it";
  category: DocCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: string;
  keywords: string[];
  actionShortcut?: {
    label: string;
    href?: string;
    tabId?: string;
  };
  relatedArticleIds: string[];
  steps?: {
    title: string;
    description: string;
    codeSnippet?: string;
    tip?: string;
  }[];
  contentMarkdown?: string;
}

export const CATEGORY_DEFINITIONS: Record<
  DocCategory,
  { label: string; iconName: string; audience: "tenant" | "landlord" | "it"; description: string }
> = {
  // Tenant Categories
  tenant_onboarding: {
    label: "Getting Started & Profile",
    iconName: "Smartphone",
    audience: "tenant",
    description: "Account access, mobile PWA installation, and managing emergency contacts.",
  },
  tenant_leasing: {
    label: "Lease & E-Signatures",
    iconName: "FileText",
    audience: "tenant",
    description: "Reviewing lease terms, digital signature signing, and downloading signed contracts.",
  },
  tenant_payments: {
    label: "Payments & Receipts",
    iconName: "CreditCard",
    audience: "tenant",
    description: "Paying rent via GCash/Card, tracking billing history, and downloading Official Receipts.",
  },
  tenant_maintenance: {
    label: "Maintenance & Repairs",
    iconName: "Wrench",
    audience: "tenant",
    description: "Submitting repair tickets with photos, self-repair options, and rating completed work.",
  },
  tenant_utilities: {
    label: "Utilities & Submeters",
    iconName: "Zap",
    audience: "tenant",
    description: "Tracking electricity and water meter readings, tariffs, and monthly consumption trends.",
  },
  tenant_community: {
    label: "Community & House Rules",
    iconName: "Users",
    audience: "tenant",
    description: "Building notice board, neighbor discussions, and reviewing community house rules.",
  },
  tenant_messaging: {
    label: "Direct Messaging",
    iconName: "MessageSquare",
    audience: "tenant",
    description: "Communicating directly with property management and file attachments.",
  },
  tenant_moveout: {
    label: "Move-Out & Deposits",
    iconName: "Home",
    audience: "tenant",
    description: "Notice of intent to vacate, move-out inspections, and security deposit settlements.",
  },
  tenant_faqs: {
    label: "Resident FAQs & Help",
    iconName: "HelpCircle",
    audience: "tenant",
    description: "Frequently asked questions for residents and quick troubleshooting.",
  },

  // Landlord Categories
  property_setup: {
    label: "Property & Unit Setup",
    iconName: "Building2",
    audience: "landlord",
    description: "Adding properties, floor configurations, pricing, and unit amenities.",
  },
  billing_payments: {
    label: "GCash & Billing",
    iconName: "CreditCard",
    audience: "landlord",
    description: "GCash QR setup, utility submeter readings, invoicing, and rent receipts.",
  },
  tenants_leases: {
    label: "Tenants & Leases",
    iconName: "Users",
    audience: "landlord",
    description: "Tenant onboarding magic links, digital contracts, and lease administration.",
  },
  maintenance_tickets: {
    label: "Maintenance & Repairs",
    iconName: "Wrench",
    audience: "landlord",
    description: "Managing repair requests, assigning vendors, and photo proofs.",
  },
  visual_unit_map: {
    label: "Interactive Unit Map",
    iconName: "Map",
    audience: "landlord",
    description: "2D color-coded floorplans and 3D visual building explorer.",
  },
  marketing_flyers: {
    label: "Marketing & Posters",
    iconName: "Sparkles",
    audience: "landlord",
    description: "Generating QR lobby posters and social media vacancy flyers.",
  },
  move_out_deposit: {
    label: "Move-Out Settlement",
    iconName: "ShieldCheck",
    audience: "landlord",
    description: "Move-out inspections, photo checklists, itemized deductions, and refunds.",
  },
  mobile_pwa: {
    label: "Mobile App & Portal",
    iconName: "Smartphone",
    audience: "landlord",
    description: "Installing the resident and landlord app on iOS/Android.",
  },
  troubleshooting_faqs: {
    label: "Troubleshooting & FAQs",
    iconName: "HelpCircle",
    audience: "landlord",
    description: "Instant solutions to common landlord operational questions.",
  },

  // IT Categories
  architecture_cloud: {
    label: "Architecture & Hosting",
    iconName: "Server",
    audience: "it",
    description: "Next.js 16 App Router, Vercel Serverless, and Supabase integration.",
  },
  environment_security: {
    label: "Env Secrets & Auth",
    iconName: "Key",
    audience: "it",
    description: "Environment variables inventory, Supabase JWT, and SMTP mailer.",
  },
  database_schema: {
    label: "Database & RLS Policies",
    iconName: "Database",
    audience: "it",
    description: "PostgreSQL schema, Row Level Security (RLS), and migration runbook.",
  },
  cron_maintenance: {
    label: "Cron & Keep-Alive",
    iconName: "RefreshCw",
    audience: "it",
    description: "Automated monthly invoice generator and Supabase keep-alive cron.",
  },
  disaster_recovery: {
    label: "Backup & Recovery",
    iconName: "ShieldAlert",
    audience: "it",
    description: "Database export dumps, failover recovery, and client handover.",
  },
};

export const DOCS_ARTICLES: DocArticle[] = [
  // =========================================================================
  // 1. TENANT DEDICATED MANUAL
  // =========================================================================
  {
    id: "tenant-sign-lease",
    audience: "tenant",
    category: "tenant_leasing",
    categoryLabel: "Lease & E-Signatures",
    title: "How to review and sign your digital lease agreement",
    summary: "Step-by-step guide to reviewing lease terms and drawing your legally binding electronic signature.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["lease", "sign", "signature", "contract", "tenant", "rent", "agreement", "pdf"],
    actionShortcut: {
      label: "Open Lease Signing Page",
      href: "/tenant/sign-lease",
    },
    relatedArticleIds: ["tenant-pay-rent-online", "tenant-download-lease-pdf"],
    steps: [
      {
        title: "Access Pending Lease",
        description: "Click 'Sign Lease' in your dashboard banner or navigate to Leases from the sidebar.",
      },
      {
        title: "Review Lease Terms & Clauses",
        description: "Carefully inspect your monthly rental amount, payment due day, security deposit, and house rules.",
      },
      {
        title: "Draw Your Digital Signature",
        description: "Use your finger (on mobile/tablet) or mouse (on desktop) to draw your signature in the signature box.",
        tip: "You can click 'Clear Signature' anytime to redraw before confirming.",
      },
      {
        title: "Confirm & Submit",
        description: "Check the legal acknowledgment checkbox and click 'Confirm & Sign Lease'. A copy is instantly saved to your vault.",
      },
    ],
  },
  {
    id: "tenant-pay-rent-online",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Payments & Receipts",
    title: "How to pay rent and utility bills online (GCash, Maya, Cards)",
    summary: "Learn how to pay your active invoices online, upload payment screenshots, and receive official receipts.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["pay", "payment", "rent", "gcash", "maya", "card", "invoice", "receipt", "billing"],
    actionShortcut: {
      label: "Open Payments Hub",
      href: "/tenant/payments",
    },
    relatedArticleIds: ["tenant-download-receipt", "tenant-utility-readings"],
    steps: [
      {
        title: "Navigate to Finance Hub",
        description: "Open the Payments section in the sidebar to view all outstanding and pending invoices.",
      },
      {
        title: "Select Invoice & Click 'Pay Now'",
        description: "Choose the active monthly invoice and click 'Pay Now' to launch the payment checkout.",
      },
      {
        title: "Scan GCash QR or Pay via Card",
        description: "Scan the landlord's official GCash QR code, or authenticate with Maya, QR Ph, or Debit/Credit Card.",
      },
      {
        title: "Instant Verification & Receipt",
        description: "Upon settlement, your invoice updates to 'Paid' immediately and an Official Receipt PDF is issued.",
      },
    ],
  },
  {
    id: "tenant-submit-maintenance",
    audience: "tenant",
    category: "tenant_maintenance",
    categoryLabel: "Maintenance & Repairs",
    title: "How to submit repair requests and upload damage photos",
    summary: "Quickly report plumbing, electrical, or appliance issues with photos to get prompt technician service.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["maintenance", "repair", "plumbing", "leak", "electric", "ac", "ticket", "photo"],
    actionShortcut: {
      label: "New Maintenance Ticket",
      href: "/tenant/maintenance",
    },
    relatedArticleIds: ["tenant-direct-messaging", "tenant-faqs-repairs"],
    steps: [
      {
        title: "Open Maintenance in Sidebar",
        description: "Go to Maintenance > Click '+ New Maintenance Request'.",
      },
      {
        title: "Select Category & Urgency",
        description: "Choose Plumbing, Electrical, Appliance, or Structural, and mark urgency (Low, Medium, High, Emergency).",
      },
      {
        title: "Upload Photos of the Issue",
        description: "Take clear photos of the damaged fixture or leak so the technician brings the exact replacement parts.",
      },
      {
        title: "Track Status in Real Time",
        description: "Watch your ticket progress from 'Pending' to 'In Progress' to 'Resolved', and rate technician performance upon completion.",
      },
    ],
  },
  {
    id: "tenant-utility-readings",
    audience: "tenant",
    category: "tenant_utilities",
    categoryLabel: "Utilities & Submeters",
    title: "Understanding your electric & water submeter readings",
    summary: "View monthly meter consumption logs, tariff rate calculations, and meter dial verification photos.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["utilities", "electric", "water", "meter", "submeter", "consumption", "kwh", "cubic meter"],
    actionShortcut: {
      label: "View Facilities & Utilities",
      href: "/tenant/utilities",
    },
    relatedArticleIds: ["tenant-pay-rent-online"],
    steps: [
      {
        title: "Open Facilities & Utilities",
        description: "Navigate to Facilities in the sidebar to review your unit's meter history.",
      },
      {
        title: "Check Current vs. Previous Reading",
        description: "See your start reading, end reading, and total consumed units (kWh for electricity, m³ for water).",
      },
      {
        title: "Verify Calculation Formula",
        description: "iReside multiplies your net consumption by the property rate: (Current Reading - Previous Reading) × Tariff Rate.",
      },
    ],
  },
  {
    id: "tenant-community-rules",
    audience: "tenant",
    category: "tenant_community",
    categoryLabel: "Community & House Rules",
    title: "Building notice board, house rules & community feed",
    summary: "Stay informed about building advisories, power interruptions, amenity schedules, and connect with neighbors.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["community", "announcement", "rules", "pool", "gym", "garbage", "quiet hours", "neighbor"],
    actionShortcut: {
      label: "Open Community Hub",
      href: "/tenant/community",
    },
    relatedArticleIds: ["tenant-direct-messaging"],
    steps: [
      {
        title: "Check Pinned Announcements",
        description: "Important advisories (tank cleaning, elevator maintenance, holiday hours) are pinned at the top.",
      },
      {
        title: "Review House Rules",
        description: "Click 'House Rules' to review quiet hours (e.g. 10 PM - 7 AM), visitor policies, and trash disposal schedules.",
      },
      {
        title: "Engage with Neighbors",
        description: "Share positive updates, ask for local recommendations, or RSVP to building events in the feed.",
      },
    ],
  },
  {
    id: "tenant-move-out-settlement",
    audience: "tenant",
    category: "tenant_moveout",
    categoryLabel: "Move-Out & Deposits",
    title: "Notice to vacate, inspection checklist & security deposit refund",
    summary: "The complete guide to submitting move-out notices, passing walkthrough inspections, and receiving your deposit.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["move out", "vacate", "deposit", "inspection", "refund", "checklist", "keys", "settlement"],
    actionShortcut: {
      label: "View Move-Out Guide",
      href: "/tenant/lease",
    },
    relatedArticleIds: ["tenant-sign-lease"],
    steps: [
      {
        title: "Submit 30-Day Notice of Intent",
        description: "Notify management at least 30 days prior to your target departure date via the tenant portal.",
      },
      {
        title: "Prepare Unit with Move-Out Checklist",
        description: "Clean the unit, remove all personal items, repair tenant-caused wall holes, and collect all keys/keycards.",
      },
      {
        title: "Conduct Walkthrough Inspection",
        description: "Inspect the unit with property staff and record final electricity and water meter readings.",
      },
      {
        title: "Receive Itemized Deposit Refund",
        description: "Review your final settlement statement with any unpaid utility deductions, and receive your net refund via bank transfer.",
      },
    ],
  },
  {
    id: "tenant-install-app",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started & Profile",
    title: "Installing iReside as an App on iPhone & Android (PWA)",
    summary: "Install iReside directly to your smartphone home screen without searching through app stores.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["app", "install", "ios", "iphone", "android", "pwa", "download", "homescreen"],
    actionShortcut: {
      label: "Open Download Page",
      href: "/download",
    },
    relatedArticleIds: ["tenant-sign-lease"],
    steps: [
      {
        title: "For iPhone Users (Safari)",
        description: "Open iReside in Safari > Tap the 'Share' icon (box with upward arrow) > Tap 'Add to Home Screen' > Tap 'Add'.",
      },
      {
        title: "For Android Users (Chrome)",
        description: "Open iReside in Chrome > Tap the 3-dot menu or click the 'Install App' banner > Tap 'Install'.",
      },
      {
        title: "Enable Instant Push Alerts",
        description: "Launch the app from your home screen and allow notifications for instant payment receipts and repair updates.",
      },
    ],
  },

  // =========================================================================
  // 2. LANDLORD DEDICATED MANUAL
  // =========================================================================
  {
    id: "setup-gcash-qr",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to set up your GCash QR code and payment details",
    summary: "Upload your merchant or personal GCash QR code and configure your account number so residents can pay rent directly.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["gcash", "qr", "payment", "bank", "billing", "account", "rent", "money", "merchant"],
    actionShortcut: {
      label: "Open Finance Settings",
      tabId: "Finance",
    },
    relatedArticleIds: ["issue-monthly-invoices", "partial-payments-guide"],
    steps: [
      {
        title: "Navigate to Finance Settings",
        description: "Open the Landlord Dashboard, click on Settings in the sidebar, and select 'Finance & Utilities'.",
      },
      {
        title: "Enter your GCash Account Details",
        description: "Type in your official GCash Account Name (e.g. Juan Dela Cruz) and Registered Mobile Number (e.g. 0917-XXX-XXXX).",
        tip: "Ensure the account name matches your GCash profile exactly to avoid tenant confusion.",
      },
      {
        title: "Upload your GCash QR Code Image",
        description: "Take a clear screenshot or save your QR code from the GCash app, then upload the photo in the QR upload box.",
      },
      {
        title: "Save Changes",
        description: "Click 'Save Changes'. Your QR code is now live and will automatically appear inside every resident invoice!",
      },
    ],
  },
  {
    id: "generate-lobby-flyer",
    audience: "landlord",
    category: "marketing_flyers",
    categoryLabel: "Marketing & Posters",
    title: "How to customize and download lobby QR posters for residents",
    summary: "Generate high-resolution printable posters with Wi-Fi details, property contacts, and resident portal QR codes.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["flyer", "poster", "qr", "print", "download", "lobby", "wifi", "building", "photo", "canvas"],
    actionShortcut: {
      label: "Open Lobby Flyer Studio",
      href: "/landlord/flyer",
    },
    relatedArticleIds: ["invite-tenants-magic-link", "install-mobile-app"],
    steps: [
      {
        title: "Launch Lobby Flyer Studio",
        description: "Click the printer quick action icon on the dashboard or open the Flyer Studio.",
      },
      {
        title: "Click Directly on Text to Edit (WYSIWYG)",
        description: "Toggle Edit Mode and click on headings, property phone numbers, office hours, or Wi-Fi passwords to customize your text.",
      },
      {
        title: "Upload a Building Photo Background",
        description: "Use the floating Canvas Inspector tool to upload a photo of your property, adjusting Brightness, Saturation, and Card Opacity.",
      },
      {
        title: "Download or Save Template",
        description: "Click 'Save Template' to sync your design to the cloud, then click 'Download' to get a print-ready 300 DPI PNG poster.",
      },
    ],
  },
  {
    id: "invite-tenants-magic-link",
    audience: "landlord",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "How to invite new residents using magic registration links",
    summary: "Connect new residents to their specific unit without manual account registration or complicated paperwork.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["invite", "tenant", "resident", "onboarding", "magic link", "register", "unit", "email"],
    actionShortcut: {
      label: "View Units & Occupancy",
      href: "/landlord/properties",
    },
    relatedArticleIds: ["setup-gcash-qr", "install-mobile-app"],
    steps: [
      {
        title: "Select the Vacant Unit",
        description: "Go to Properties > Select your property > Open the vacant unit card.",
      },
      {
        title: "Generate Tenant Invite Link",
        description: "Click 'Invite Tenant' and enter the resident's full name, email, and monthly rent agreement.",
      },
      {
        title: "Share Link or Let them Scan the Lobby QR",
        description: "Copy the unique onboarding link or let the resident scan the lobby poster. When they sign up, their profile instantly attaches to the unit!",
      },
    ],
  },
  {
    id: "issue-monthly-invoices",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "Understanding automated rent invoicing & utility charges",
    summary: "Learn how iReside calculates submetered water and electricity, issues invoices, and verifies payment receipts.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["invoice", "bill", "electricity", "water", "utilities", "receipt", "rent", "ledger"],
    actionShortcut: {
      label: "Open Invoices Ledger",
      href: "/landlord/invoices",
    },
    relatedArticleIds: ["setup-gcash-qr", "partial-payments-guide"],
    steps: [
      {
        title: "Automated 1st-of-the-Month Invoices",
        description: "On the 1st of every month, iReside generates rent invoices automatically with your GCash payment QR code attached.",
      },
      {
        title: "Recording Utility Meter Readings",
        description: "In the Billing Operations panel, enter the monthly kWh electricity and m³ water readings. The system multiplies by your set rates.",
      },
      {
        title: "Approving Payment Proofs",
        description: "When residents pay via GCash and upload their screenshot proof, you receive a notification to verify with 1-click receipt generation.",
      },
    ],
  },
  {
    id: "partial-payments-guide",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to allow or disallow partial rent installments",
    summary: "Configure whether tenants can pay in split installments or must settle the full balance in one payment.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["partial", "installment", "split", "billing", "downpayment", "balance", "policy"],
    actionShortcut: {
      label: "Configure Billing Rules",
      tabId: "Finance",
    },
    relatedArticleIds: ["setup-gcash-qr", "issue-monthly-invoices"],
    steps: [
      {
        title: "Open Finance & Utilities Settings",
        description: "Navigate to Settings > Finance & Utilities in your Landlord Dashboard.",
      },
      {
        title: "Toggle Partial Payments",
        description: "Switch the 'Allow Partial Payments' toggle to ON or OFF according to your property rules.",
      },
      {
        title: "Save Rules",
        description: "When enabled, tenants can enter any amount greater than the minimum deposit; their balance updates in real-time.",
      },
    ],
  },
  {
    id: "manage-maintenance-tickets",
    audience: "landlord",
    category: "maintenance_tickets",
    categoryLabel: "Maintenance & Repairs",
    title: "How to manage maintenance tickets and repair requests",
    summary: "Track plumbing, electrical, and structural repair requests submitted by residents with photo attachments.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["maintenance", "repairs", "ticket", "plumbing", "electrician", "leak", "work order"],
    actionShortcut: {
      label: "Open Maintenance Hub",
      href: "/landlord/maintenance",
    },
    relatedArticleIds: ["troubleshoot-notifications"],
    steps: [
      {
        title: "Receiving a Ticket",
        description: "When a tenant files a maintenance issue, an alert appears with high/normal priority and uploaded damage photos.",
      },
      {
        title: "Updating Status & Dispatching",
        description: "Change status to 'In Progress' and log notes or assign external service contractors.",
      },
      {
        title: "Resolution & Tenant Sign-Off",
        description: "Upload the completion receipt or repair photo and mark as 'Resolved'.",
      },
    ],
  },
  {
    id: "install-mobile-app",
    audience: "landlord",
    category: "mobile_pwa",
    categoryLabel: "Mobile App & Portal",
    title: "How landlords and tenants install the iReside App on iPhone & Android",
    summary: "Step-by-step instructions to add iReside directly to your phone's home screen without app store downloads.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["app", "download", "pwa", "install", "iphone", "ios", "android", "homescreen", "safari", "chrome"],
    actionShortcut: {
      label: "View App Download Hub",
      href: "/download",
    },
    relatedArticleIds: ["generate-lobby-flyer", "setup-gcash-qr"],
    steps: [
      {
        title: "Open the App Link in Mobile Browser",
        description: "Scan the lobby QR code or visit your property portal link in Safari (iOS) or Chrome (Android).",
      },
      {
        title: "For iPhone (Safari)",
        description: "Tap the Share button at the bottom of the screen > Select 'Add to Home Screen' > Tap 'Add'.",
        tip: "iReside installs instantly like a native app with push notifications enabled.",
      },
      {
        title: "For Android (Chrome)",
        description: "Tap the 3-dot menu or click the 'Install App' prompt at the bottom > Tap 'Install'.",
      },
    ],
  },
  {
    id: "troubleshoot-notifications",
    audience: "landlord",
    category: "troubleshooting_faqs",
    categoryLabel: "Troubleshooting & FAQs",
    title: "Troubleshooting: Why am I or my tenants not receiving emails?",
    summary: "Quick fixes for email delivery issues, spam folder checks, and Gmail SMTP sender verification.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["email", "smtp", "notifications", "spam", "password", "alerts", "troubleshoot"],
    actionShortcut: {
      label: "Technical Commissioning Doctor",
      href: "/setup/technical",
    },
    relatedArticleIds: ["it-smtp-setup", "setup-gcash-qr"],
    steps: [
      {
        title: "Check Spam or Junk Folders",
        description: "Ensure the tenant checks their Spam folder and marks emails from your system as 'Not Spam'.",
      },
      {
        title: "Verify Notification Toggles",
        description: "In Settings > Notifications, verify that 'Email Notifications' and 'Payment Alerts' are toggled ON.",
      },
      {
        title: "Run SMTP Mailer Self-Test",
        description: "If no emails arrive at all, run the Technical Commissioning Doctor at /setup/technical to verify SMTP credentials.",
      },
    ],
  },

  // =========================================================================
  // 3. IT PERSONNEL & TECHNICAL GUIDE
  // =========================================================================
  {
    id: "it-system-architecture",
    audience: "it",
    category: "architecture_cloud",
    categoryLabel: "Architecture & Hosting",
    title: "System Architecture: Next.js 16, Vercel & Supabase Cloud",
    summary: "High-level technical architecture overview, serverless request lifecycle, real-time WebSocket subscriptions, and edge CDN.",
    difficulty: "intermediate",
    readTime: "5 min",
    keywords: ["architecture", "nextjs", "vercel", "supabase", "serverless", "edge", "database", "it"],
    relatedArticleIds: ["it-environment-inventory", "it-database-schema"],
    steps: [
      {
        title: "Frontend & API Framework",
        description: "Built on Next.js 16 (App Router) deployed to Vercel Serverless Edge network. All routes in /src/app/api utilize NextRequest/NextResponse with auth-guard middlewares.",
      },
      {
        title: "Database & Authentication",
        description: "Powered by Supabase Managed PostgreSQL. Authentication utilizes Supabase Auth JWT tokens stored in secure HttpOnly cookies.",
      },
      {
        title: "File Storage CDN",
        description: "Public assets, payment screenshots, and background flyer photos are stored in Supabase Storage buckets ('property-images', 'billing').",
      },
    ],
    contentMarkdown: `
### System Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Browser / PWA)                 │
│  - Landlord Master Dashboard (/landlord)                    │
│  - Resident Portal & Mobile App (/tenant, /download)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────┐
│            Vercel Serverless Hosting (Next.js 16)           │
│  - App Router SSR & Static Edge Rendering                   │
│  - Auth Guard Middleware (requireAuthenticatedUser)         │
│  - Background Cron Engine (/api/cron/*)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ TLS 1.3 / REST & SQL
┌──────────────────────────────▼──────────────────────────────┐
│                 Supabase Cloud Infrastructure               │
│  - PostgreSQL 15 Database with Row Level Security (RLS)     │
│  - Auth JWT Engine & User Metadata                          │
│  - S3-Compatible Storage CDN (property-images, billing)     │
└─────────────────────────────────────────────────────────────┘
\`\`\`
`,
  },
  {
    id: "it-environment-inventory",
    audience: "it",
    category: "environment_security",
    categoryLabel: "Env Secrets & Auth",
    title: "Environment Variables Inventory & Secret Keys Configuration",
    summary: "Complete inventory of required and optional environment variables in .env.local and Vercel Project Settings.",
    difficulty: "advanced",
    readTime: "4 min",
    keywords: ["env", "environment", "variables", "secrets", "api key", "supabase", "smtp", "vercel"],
    actionShortcut: {
      label: "Open Technical Commissioning Hub",
      href: "/setup/technical",
    },
    relatedArticleIds: ["it-system-architecture", "it-smtp-setup"],
    steps: [
      {
        title: "Core Supabase Keys (Required)",
        description: "NEXT_PUBLIC_SUPABASE_URL (Project API URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY (Public Anon Key).",
        codeSnippet: `NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`,
      },
      {
        title: "Service Role Admin Key (Required for Crons)",
        description: "SUPABASE_SERVICE_ROLE_KEY enables backend API endpoints and automated cron jobs to bypass RLS for administrative invoicing tasks.",
        codeSnippet: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...`,
      },
      {
        title: "SMTP Mailer Variables (Required for Emails)",
        description: "Configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS for automated invoice delivery and password resets.",
        codeSnippet: `SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=property.ireside@gmail.com\nSMTP_PASS=abcd-efgh-ijkl-mnop`,
      },
    ],
  },
  {
    id: "it-database-schema",
    audience: "it",
    category: "database_schema",
    categoryLabel: "Database & RLS Policies",
    title: "PostgreSQL Database Schema & Row-Level Security (RLS)",
    summary: "Database tables structure, relational foreign keys, RLS security policies, and migration runbook using source-of-truth-db.sql.",
    difficulty: "advanced",
    readTime: "6 min",
    keywords: ["database", "schema", "postgres", "sql", "rls", "security", "migrations", "supabase"],
    relatedArticleIds: ["it-system-architecture", "it-disaster-recovery"],
    steps: [
      {
        title: "Source of Truth Reference",
        description: "The complete authoritative database schema is located at 'source-of-truth-db.sql' in the project root.",
      },
      {
        title: "Key Database Tables",
        description: "users (Auth profiles), properties (Building listings), units (Room allocations), leases (Tenant contracts), invoices (Billing ledger), and maintenance_requests (Ticket system).",
      },
      {
        title: "Row-Level Security (RLS) Policy Model",
        description: "Every table has RLS enabled. Landlords can only query data matching their landlord_id. Tenants can only query data linked to their tenant_id or unit.",
      },
    ],
  },
  {
    id: "it-cron-maintenance",
    audience: "it",
    category: "cron_maintenance",
    categoryLabel: "Cron & Keep-Alive",
    title: "Automated Crons & Supabase Free-Tier Keep-Alive Engine",
    summary: "How Vercel cron jobs handle monthly recurring invoice generation and automated pings to prevent database sleep.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["cron", "keep-alive", "automation", "invoice", "schedule", "vercel", "sleep"],
    relatedArticleIds: ["it-environment-inventory", "it-system-architecture"],
    steps: [
      {
        title: "Monthly Invoicing Cron",
        description: "Runs automatically on the 1st of every month at midnight UTC via /api/cron/monthly-invoices.",
      },
      {
        title: "Supabase Keep-Alive Health Ping",
        description: "Runs daily via /api/cron/keep-alive to query a lightweight heartbeat table, preventing Supabase free tier from pausing.",
      },
      {
        title: "Vercel Cron Configuration",
        description: "Defined in 'vercel.json' in the project root. Fully managed by Vercel with zero server maintenance.",
      },
    ],
  },
  {
    id: "it-smtp-setup",
    audience: "it",
    category: "environment_security",
    categoryLabel: "Env Secrets & Auth",
    title: "Configuring Gmail SMTP or Custom Domain Mailer",
    summary: "Guide to generating Gmail App Passwords or wiring SendGrid/Resend SMTP for automated system email delivery.",
    difficulty: "intermediate",
    readTime: "4 min",
    keywords: ["smtp", "gmail", "email", "app password", "sendgrid", "resend", "notifications"],
    actionShortcut: {
      label: "Run Mailer Diagnostic",
      href: "/setup/technical",
    },
    relatedArticleIds: ["troubleshoot-notifications", "it-environment-inventory"],
    steps: [
      {
        title: "Google Account 2-Step Verification",
        description: "Enable 2-Step Verification on the Gmail account dedicated to the property.",
      },
      {
        title: "Generate 16-Character App Password",
        description: "Go to Google Account Security > App Passwords > Create 'iReside Mailer' > Copy the 16-character password.",
      },
      {
        title: "Update SMTP_PASS in Vercel",
        description: "Paste the password without spaces into your SMTP_PASS environment variable in Vercel.",
      },
    ],
  },
  {
    id: "it-disaster-recovery",
    audience: "it",
    category: "disaster_recovery",
    categoryLabel: "Backup & Recovery",
    title: "Database Backup, Disaster Recovery & Client Handover Runbook",
    summary: "Step-by-step recovery guide for exporting SQL dumps, rehydrating databases, and transferring Vercel project ownership.",
    difficulty: "advanced",
    readTime: "5 min",
    keywords: ["backup", "restore", "disaster recovery", "handover", "dump", "export", "transfer", "it"],
    relatedArticleIds: ["it-database-schema", "it-system-architecture"],
    steps: [
      {
        title: "Exporting Daily / Weekly SQL Dumps",
        description: "Run 'supabase db dump -f backup.sql' or download automated daily backups from the Supabase Dashboard > Database > Backups.",
      },
      {
        title: "Rehydrating a Fresh Instance",
        description: "To deploy to a new Supabase project, run the migration scripts in /supabase/migrations or execute 'source-of-truth-db.sql'.",
      },
      {
        title: "Vercel Ownership Transfer",
        description: "Go to Vercel Project Settings > General > Transfer Project to hand over the production deployment to the client's Vercel team.",
      },
    ],
  },
];
