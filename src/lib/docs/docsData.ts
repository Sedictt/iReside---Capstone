export type DocAudience = "user" | "it";

export type DocCategory =
  | "property_setup"
  | "billing_payments"
  | "tenants_leases"
  | "maintenance_tickets"
  | "mobile_pwa"
  | "troubleshooting_faqs"
  | "architecture_cloud"
  | "environment_security"
  | "database_schema"
  | "cron_maintenance"
  | "disaster_recovery";

export interface DocArticle {
  id: string;
  audience: DocAudience;
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
  { label: string; iconName: string; audience: DocAudience; description: string }
> = {
  property_setup: {
    label: "Property & Unit Setup",
    iconName: "Building2",
    audience: "user",
    description: "Adding units, pricing, custom branding, and lobby flyer posters.",
  },
  billing_payments: {
    label: "GCash & Billing",
    iconName: "CreditCard",
    audience: "user",
    description: "GCash QR setup, utility readings, invoicing, and rent receipts.",
  },
  tenants_leases: {
    label: "Tenants & Leases",
    iconName: "Users",
    audience: "user",
    description: "Tenant onboarding magic links, digital contracts, and move-in/out.",
  },
  maintenance_tickets: {
    label: "Maintenance & Repairs",
    iconName: "Wrench",
    audience: "user",
    description: "Managing repair requests, assigning vendors, and photo proofs.",
  },
  mobile_pwa: {
    label: "Mobile App & Portal",
    iconName: "Smartphone",
    audience: "user",
    description: "Installing the resident app on iOS/Android and push notifications.",
  },
  troubleshooting_faqs: {
    label: "Troubleshooting & FAQs",
    iconName: "HelpCircle",
    audience: "user",
    description: "Instant solutions to common landlord and resident questions.",
  },
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
  // USER MANUAL - NON-TECHNICAL
  // =========================================================================
  {
    id: "setup-gcash-qr",
    audience: "user",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to set up your GCash QR code and payment details",
    summary:
      "Upload your merchant or personal GCash QR code and configure your account number so residents can pay rent directly.",
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
    audience: "user",
    category: "property_setup",
    categoryLabel: "Property & Unit Setup",
    title: "How to customize and download lobby QR posters for residents",
    summary:
      "Generate high-resolution printable posters with Wi-Fi details, property contacts, and resident portal QR codes.",
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
    audience: "user",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "How to invite new residents using magic registration links",
    summary:
      "Connect new residents to their specific unit without manual account registration or complicated paperwork.",
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
    audience: "user",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "Understanding automated rent invoicing & utility charges",
    summary:
      "Learn how iReside calculates submetered water and electricity, issues invoices, and verifies payment receipts.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["invoice", "bill", "electricity", "water", "utilities", "receipt", "rent", "ledger"],
    actionShortcut: {
      label: "Open Invoices Ledger",
      href: "/landlord/billing",
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
    audience: "user",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to allow or disallow partial rent installments",
    summary:
      "Configure whether tenants can pay in split installments or must settle the full balance in one payment.",
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
    audience: "user",
    category: "maintenance_tickets",
    categoryLabel: "Maintenance & Repairs",
    title: "How to manage maintenance tickets and repair requests",
    summary:
      "Track plumbing, electrical, and structural repair requests submitted by residents with photo attachments.",
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
    audience: "user",
    category: "mobile_pwa",
    categoryLabel: "Mobile App & Portal",
    title: "How tenants install the iReside App on iPhone & Android",
    summary:
      "Step-by-step instructions for residents to add iReside directly to their phone's home screen without app store downloads.",
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
    audience: "user",
    category: "troubleshooting_faqs",
    categoryLabel: "Troubleshooting & FAQs",
    title: "Troubleshooting: Why am I or my tenants not receiving emails?",
    summary:
      "Quick fixes for email delivery issues, spam folder checks, and Gmail SMTP sender verification.",
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
  // IT PERSONNEL & FREELANCER DOCUMENTATION
  // =========================================================================
  {
    id: "it-system-architecture",
    audience: "it",
    category: "architecture_cloud",
    categoryLabel: "Architecture & Hosting",
    title: "System Architecture: Next.js 16, Vercel & Supabase Cloud",
    summary:
      "High-level technical architecture overview, serverless request lifecycle, real-time WebSocket subscriptions, and edge CDN.",
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
    summary:
      "Complete inventory of required and optional environment variables in .env.local and Vercel Project Settings.",
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
    summary:
      "Database tables structure, relational foreign keys, RLS security policies, and migration runbook using source-of-truth-db.sql.",
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
    summary:
      "How Vercel cron jobs handle monthly recurring invoice generation and automated pings to prevent database sleep.",
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
    summary:
      "Guide to generating Gmail App Passwords or wiring SendGrid/Resend SMTP for automated system email delivery.",
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
    summary:
      "Step-by-step recovery guide for exporting SQL dumps, rehydrating databases, and transferring Vercel project ownership.",
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
