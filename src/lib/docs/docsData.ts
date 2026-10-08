/**
 * Interactive manual content.
 *
 * Writing standards applied to every article (see docs/README in this folder's tests):
 * - One task per article. Titles are imperative ("Pay rent with GCash"), not marketing copy.
 * - Each step is a single action. UI labels are quoted exactly as they appear in the app.
 * - `prerequisites` tell the reader what they need before starting; `result` tells them how
 *   to confirm the task worked.
 * - No property-specific policy is hard-coded (quiet hours, refund windows, office hours).
 *   Those live in the lease, house rules, or landlord settings and are referenced instead.
 * - Every `actionShortcut.href` must be a real route (verified by the docsData test).
 */

export type DocAudience = "tenant" | "landlord" | "it" | "user" | "all";

export type ManualAudience = "tenant" | "landlord" | "it";

export type DocCategory =
  // Tenant categories
  | "tenant_onboarding"
  | "tenant_leasing"
  | "tenant_payments"
  | "tenant_maintenance"
  | "tenant_facilities"
  | "tenant_community"
  | "tenant_messaging"
  | "tenant_moveout"
  | "tenant_safety"
  | "tenant_faqs"
  // Landlord categories
  | "property_setup"
  | "landlord_settings"
  | "tenants_leases"
  | "billing_payments"
  | "maintenance_tickets"
  | "visual_unit_map"
  | "community_tools"
  | "marketing_flyers"
  | "move_out_deposit"
  | "reports_documents"
  | "mobile_pwa"
  | "troubleshooting_faqs"
  // Technical categories
  | "architecture_cloud"
  | "environment_security"
  | "database_schema"
  | "cron_maintenance"
  | "disaster_recovery"
  | "system_specifications"
  | "user_roles_access"
  | "installation_guide"
  | "turnover_handover";

export interface DocStep {
  title: string;
  description: string;
  codeSnippet?: string;
  tip?: string;
}

export interface DocArticle {
  id: string;
  audience: ManualAudience;
  category: DocCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: string;
  keywords: string[];
  /** What the reader needs before starting. */
  prerequisites?: string[];
  /** Deep link into the app. Must be a real route. */
  actionShortcut?: {
    label: string;
    href: string;
  };
  relatedArticleIds: string[];
  steps?: DocStep[];
  /** How the reader can confirm the task succeeded. */
  result?: string;
  contentMarkdown?: string;
}

/** Shown on covers and in the PDF export. Bump when content changes materially. */
export const DOCS_EDITION = "October 2026";

export const MANUAL_TITLES: Record<ManualAudience, { short: string; cover: string; tagline: string }> = {
  tenant: {
    short: "Tenant Manual",
    cover: "Tenant User Manual",
    tagline: "Sign your lease, pay rent, report repairs, and stay in touch with your landlord.",
  },
  landlord: {
    short: "Landlord Manual",
    cover: "Landlord Operations Manual",
    tagline: "Set up properties, onboard tenants, bill utilities, verify payments, and run day-to-day operations.",
  },
  it: {
    short: "Technical Manual",
    cover: "Installation and Technical Manual",
    tagline: "Deploy, configure, secure, back up, and hand over an iReside installation.",
  },
};

export const CATEGORY_DEFINITIONS: Record<
  DocCategory,
  { label: string; iconName: string; audience: ManualAudience; description: string }
> = {
  // Tenant
  tenant_onboarding: {
    label: "Getting Started",
    iconName: "Smartphone",
    audience: "tenant",
    description: "Install the app, sign in securely, and complete your profile.",
  },
  tenant_leasing: {
    label: "Lease & Signatures",
    iconName: "FileText",
    audience: "tenant",
    description: "Review, sign, download, and renew your lease.",
  },
  tenant_payments: {
    label: "Bills & Payments",
    iconName: "CreditCard",
    audience: "tenant",
    description: "Understand invoices, pay with GCash or cash, and get receipts.",
  },
  tenant_maintenance: {
    label: "Maintenance",
    iconName: "Wrench",
    audience: "tenant",
    description: "Report issues and follow repairs through to completion.",
  },
  tenant_facilities: {
    label: "Facilities",
    iconName: "LayoutGrid",
    audience: "tenant",
    description: "Book shared amenities and track your bookings.",
  },
  tenant_community: {
    label: "Community & Unit Map",
    iconName: "Users",
    audience: "tenant",
    description: "Announcements, polls, albums, house rules, and the building map.",
  },
  tenant_messaging: {
    label: "Messages",
    iconName: "MessageSquare",
    audience: "tenant",
    description: "Chat with your landlord, share files, and stay safe online.",
  },
  tenant_moveout: {
    label: "Renewal & Move-Out",
    iconName: "Home",
    audience: "tenant",
    description: "Request a renewal, give notice, and settle your deposit.",
  },
  tenant_safety: {
    label: "Safety",
    iconName: "ShieldAlert",
    audience: "tenant",
    description: "What to do in an emergency and who to call.",
  },
  tenant_faqs: {
    label: "Help & FAQs",
    iconName: "HelpCircle",
    audience: "tenant",
    description: "Quick answers to common problems.",
  },

  // Landlord
  property_setup: {
    label: "Property Setup",
    iconName: "Building2",
    audience: "landlord",
    description: "Register properties, floors, and units.",
  },
  landlord_settings: {
    label: "Settings & Branding",
    iconName: "Settings",
    audience: "landlord",
    description: "Payment channels, utility tariffs, branding, security, and notifications.",
  },
  tenants_leases: {
    label: "Tenants & Leases",
    iconName: "Users",
    audience: "landlord",
    description: "Invite applicants, screen applications, and manage lease signing.",
  },
  billing_payments: {
    label: "Billing & Payments",
    iconName: "CreditCard",
    audience: "landlord",
    description: "Utility readings, monthly invoices, payment review, and receipts.",
  },
  maintenance_tickets: {
    label: "Maintenance",
    iconName: "Wrench",
    audience: "landlord",
    description: "Triage tickets, choose a repair method, and close them out.",
  },
  visual_unit_map: {
    label: "Unit Map",
    iconName: "Map",
    audience: "landlord",
    description: "Lay out floors and monitor occupancy visually.",
  },
  community_tools: {
    label: "Community & Facilities",
    iconName: "Megaphone",
    audience: "landlord",
    description: "Announcements, polls, albums, and amenity bookings.",
  },
  marketing_flyers: {
    label: "Posters & QR Codes",
    iconName: "Sparkles",
    audience: "landlord",
    description: "Print lobby posters that link tenants to the portal.",
  },
  move_out_deposit: {
    label: "Move-Out",
    iconName: "ShieldCheck",
    audience: "landlord",
    description: "Handle move-out requests and deposit settlement.",
  },
  reports_documents: {
    label: "Reports & Documents",
    iconName: "BarChart3",
    audience: "landlord",
    description: "Analytics, exports, and the document vault.",
  },
  mobile_pwa: {
    label: "Apps & Devices",
    iconName: "Smartphone",
    audience: "landlord",
    description: "Install iReside on Windows, Android, and iOS.",
  },
  troubleshooting_faqs: {
    label: "Troubleshooting",
    iconName: "HelpCircle",
    audience: "landlord",
    description: "Fixes for common operational problems.",
  },

  // Technical
  architecture_cloud: {
    label: "Architecture",
    iconName: "Server",
    audience: "it",
    description: "How the Next.js app, Supabase, and Vercel fit together.",
  },
  environment_security: {
    label: "Configuration & Secrets",
    iconName: "Key",
    audience: "it",
    description: "Environment variables, mail transport, and authentication.",
  },
  database_schema: {
    label: "Database & Storage",
    iconName: "Database",
    audience: "it",
    description: "Schema, Row Level Security, migrations, and storage buckets.",
  },
  cron_maintenance: {
    label: "Scheduled Jobs",
    iconName: "RefreshCw",
    audience: "it",
    description: "The monthly invoicing cron and health checks.",
  },
  disaster_recovery: {
    label: "Backup & Recovery",
    iconName: "ShieldAlert",
    audience: "it",
    description: "Backups, restores, and ownership transfer.",
  },
  system_specifications: {
    label: "Requirements",
    iconName: "Cpu",
    audience: "it",
    description: "Supported browsers, devices, and hosting prerequisites.",
  },
  user_roles_access: {
    label: "Roles & Access",
    iconName: "Users",
    audience: "it",
    description: "What landlords and tenants can do, and how routes are protected.",
  },
  installation_guide: {
    label: "Installation",
    iconName: "Terminal",
    audience: "it",
    description: "From repository clone to production deployment.",
  },
  turnover_handover: {
    label: "Handover",
    iconName: "Award",
    audience: "it",
    description: "Acceptance checklist for transferring the system to its owner.",
  },
};

export const DOCS_ARTICLES: DocArticle[] = [
  // =========================================================================
  // TENANT MANUAL
  // =========================================================================
  {
    id: "tenant-install-app",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started",
    title: "Install iReside on your phone",
    summary: "Install the Android app or add the portal to your iPhone home screen so you get invoice, receipt, and repair notifications.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["install", "app", "apk", "android", "iphone", "ios", "safari", "home screen", "download", "notifications"],
    prerequisites: ["Your login email and password from your landlord"],
    actionShortcut: { label: "Open the download page", href: "/download" },
    relatedArticleIds: ["tenant-sign-in-security", "tenant-profile-emergency"],
    steps: [
      {
        title: "Open the download page",
        description: "In the left menu choose \"Download App\", or visit /download in any browser.",
      },
      {
        title: "Android: install the APK",
        description: "Tap the Android download, open the downloaded file, and tap \"Install\". If Android asks, allow installs from this source.",
        tip: "The APK is a native wrapper around the same portal, so your data is identical on web and app.",
      },
      {
        title: "iPhone or iPad: add to Home Screen",
        description: "Open the portal in Safari, tap Share, choose \"Add to Home Screen\", then tap \"Add\".",
        tip: "Use Safari for this step. Other iOS browsers cannot add web apps to the home screen.",
      },
      {
        title: "Allow notifications",
        description: "When the app asks for notification permission, tap \"Allow\" so you receive new invoices, receipts, and repair updates.",
      },
    ],
    result: "An iReside icon appears on your home screen and opens straight to your dashboard.",
  },
  {
    id: "tenant-sign-in-security",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started",
    title: "Sign in and secure your account",
    summary: "Change the temporary password you were given, and turn on two-factor authentication from Settings.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["login", "sign in", "password", "two-factor", "2fa", "security", "settings", "forgot password"],
    prerequisites: ["The credentials your landlord sent when your application was approved"],
    actionShortcut: { label: "Open Settings", href: "/tenant/settings" },
    relatedArticleIds: ["tenant-install-app", "tenant-faqs-troubleshooting"],
    steps: [
      {
        title: "Sign in",
        description: "Go to /login, enter your email and the password you received, and choose \"Sign In\".",
      },
      {
        title: "Change your password",
        description: "Open \"Settings\" from the left menu, enter your current password and a new one, then save. Passwords must be at least 6 characters; longer passphrases are safer.",
      },
      {
        title: "Turn on two-factor authentication",
        description: "In \"Settings\", open the security section and enable two-factor authentication. After this, sign-ins from a new device ask for a second verification step.",
        tip: "Keep any recovery keys the app shows you somewhere safe. They are the only way back in if you lose your second factor.",
      },
      {
        title: "Recover a forgotten password",
        description: "On the login page choose \"Forgot Password?\", enter your email, and follow the link in the message. Check your spam folder if it does not arrive within a few minutes.",
      },
    ],
    result: "You can sign in with your own password, and new devices are challenged for a second factor.",
  },
  {
    id: "tenant-profile-emergency",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started",
    title: "Complete your profile and emergency contact",
    summary: "Keep your contact details current and add someone the building can reach if you are unavailable.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["profile", "emergency contact", "phone", "email", "avatar", "account"],
    actionShortcut: { label: "Open Profile", href: "/tenant/profile" },
    relatedArticleIds: ["tenant-sign-in-security", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Open your profile",
        description: "Choose \"Profile\" at the bottom of the left menu.",
      },
      {
        title: "Check your mobile number and email",
        description: "These are where invoices, receipts, and lease updates are sent, so make sure they are correct.",
      },
      {
        title: "Add an emergency contact",
        description: "Enter the person's full name, relationship, and an active phone number, then save.",
        tip: "Building staff use this contact for leaks, lockouts, or medical situations when they cannot reach you.",
      },
    ],
    result: "Your profile shows the updated details and the emergency contact is saved.",
  },
  {
    id: "tenant-sign-lease",
    audience: "tenant",
    category: "tenant_leasing",
    categoryLabel: "Lease & Signatures",
    title: "Review and sign your lease",
    summary: "Your landlord sends a secure signing link. Read the agreement, draw your signature, and submit it.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["lease", "sign", "signature", "contract", "agreement", "signing link", "countersign"],
    prerequisites: ["A signing link or a pending-lease notice on your dashboard"],
    actionShortcut: { label: "Open Leases", href: "/tenant/lease" },
    relatedArticleIds: ["tenant-download-lease-pdf", "tenant-pay-rent-gcash"],
    steps: [
      {
        title: "Open the agreement",
        description: "Follow the signing link your landlord sent, or open \"Leases\" and choose the lease marked as waiting for your signature.",
      },
      {
        title: "Read the terms",
        description: "Check the unit, monthly rent, due day, security deposit, lease dates, and house rules before you sign.",
        tip: "Ask questions through \"Messages\" before signing. Signed leases cannot be edited; your landlord would need to issue a new one.",
      },
      {
        title: "Draw your signature",
        description: "Sign inside the signature box with your finger or mouse. Use the clear option and try again if it looks wrong.",
      },
      {
        title: "Submit",
        description: "Confirm that you agree to the terms and submit. The lease stays pending until your landlord countersigns it.",
      },
    ],
    result: "The lease shows as awaiting the landlord's signature, then becomes active once countersigned.",
  },
  {
    id: "tenant-download-lease-pdf",
    audience: "tenant",
    category: "tenant_leasing",
    categoryLabel: "Lease & Signatures",
    title: "Download your signed lease",
    summary: "Keep a copy of the countersigned agreement for bank, employer, or government requirements.",
    difficulty: "beginner",
    readTime: "1 min",
    keywords: ["lease", "pdf", "download", "contract", "copy", "proof of address"],
    actionShortcut: { label: "Open Leases", href: "/tenant/lease" },
    relatedArticleIds: ["tenant-sign-lease", "tenant-renewal-moveout"],
    steps: [
      {
        title: "Open Leases",
        description: "Choose \"Leases\" in the left menu and select your active lease.",
      },
      {
        title: "Download the PDF",
        description: "Use the download option on the lease to save a PDF that includes both signatures.",
        tip: "Save it to cloud storage as well. It is accepted as proof of residence by many institutions.",
      },
    ],
    result: "A PDF of the agreement is saved to your device.",
  },
  {
    id: "tenant-understand-invoice",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Bills & Payments",
    title: "Understand your monthly invoice",
    summary: "Invoices are issued automatically each month and list rent plus any electricity and water charges from your submeter.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["invoice", "bill", "rent", "electricity", "water", "kwh", "submeter", "reading", "due date", "finance hub"],
    actionShortcut: { label: "Open Finance Hub", href: "/tenant/payments" },
    relatedArticleIds: ["tenant-pay-rent-gcash", "tenant-payment-status-receipts"],
    steps: [
      {
        title: "Find your current bill",
        description: "Open \"Finance Hub\" in the left menu. The current invoice and its due date are shown at the top; the dashboard also shows the amount due.",
      },
      {
        title: "Read the line items",
        description: "Each invoice lists base rent and, where your landlord records submeter readings, separate electricity and water lines.",
      },
      {
        title: "Check how utilities were computed",
        description: "Utility charges are (current reading minus previous reading) multiplied by the tariff your landlord set. The readings and rate used are shown with the charge.",
        tip: "If a reading looks wrong, message your landlord with a photo of your meter before paying so it can be corrected.",
      },
    ],
    result: "You know what each line on the invoice is for and when it is due.",
  },
  {
    id: "tenant-pay-rent-gcash",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Bills & Payments",
    title: "Pay with GCash",
    summary: "Scan your landlord's GCash QR code, then upload the payment screenshot and reference number for verification.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["pay", "payment", "gcash", "qr", "screenshot", "reference number", "proof", "checkout"],
    prerequisites: ["A GCash account with enough balance", "The invoice you want to pay open in Finance Hub"],
    actionShortcut: { label: "Open Finance Hub", href: "/tenant/payments" },
    relatedArticleIds: ["tenant-pay-cash-in-person", "tenant-payment-status-receipts"],
    steps: [
      {
        title: "Start checkout",
        description: "In \"Finance Hub\", open the unpaid invoice and choose the pay option. Select GCash as the method.",
      },
      {
        title: "Scan the QR code and send the exact amount",
        description: "Open GCash, choose scan, and scan the QR code shown on screen. Send exactly the amount on the invoice.",
        tip: "Only pay to the QR code or account shown inside iReside. Never send money to a number you received by text or chat.",
      },
      {
        title: "Upload your proof",
        description: "Take a screenshot of the GCash confirmation, then choose \"Upload Screenshot\" and select it.",
      },
      {
        title: "Enter the reference number and submit",
        description: "Type the reference number from the GCash receipt exactly as shown, then submit the payment.",
      },
    ],
    result: "The invoice changes to a review state and your landlord is notified. It becomes Paid once they confirm it.",
  },
  {
    id: "tenant-pay-cash-in-person",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Bills & Payments",
    title: "Pay in cash or in person",
    summary: "Tell your landlord through the app that you will pay in person so the invoice is tracked until they confirm receipt.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["cash", "in person", "in-person", "face to face", "pay", "settlement"],
    actionShortcut: { label: "Open Finance Hub", href: "/tenant/payments" },
    relatedArticleIds: ["tenant-pay-rent-gcash", "tenant-payment-status-receipts"],
    steps: [
      {
        title: "Choose the in-person option",
        description: "Open the invoice in \"Finance Hub\", start checkout, and select \"Cash / In-Person\".",
      },
      {
        title: "Submit the notice",
        description: "Confirm the in-person settlement. The invoice stays open and shows that you have notified your landlord.",
      },
      {
        title: "Hand over the payment",
        description: "Pay your landlord or their representative. They confirm the amount in their portal, which marks the invoice as paid and issues your receipt.",
        tip: "The in-person notice expires if the payment is not confirmed in time. Start a new one if that happens.",
      },
    ],
    result: "After your landlord confirms, the invoice shows as Paid and an official receipt is available.",
  },
  {
    id: "tenant-payment-status-receipts",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Bills & Payments",
    title: "Track payment status and download receipts",
    summary: "Know what each payment status means, what happens with partial or incorrect amounts, and where to get official receipts.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["status", "pending", "under review", "paid", "receipt", "official receipt", "partial", "rejected", "history"],
    actionShortcut: { label: "Open Finance Hub", href: "/tenant/payments" },
    relatedArticleIds: ["tenant-pay-rent-gcash", "tenant-understand-invoice"],
    steps: [
      {
        title: "Read the status",
        description: "Unpaid means no payment has been submitted. Under review means your proof is waiting for your landlord. Paid means it was confirmed and a receipt was issued.",
      },
      {
        title: "Partial or incorrect amounts",
        description: "If you paid less or more than the invoice, your landlord can accept it as a partial payment, ask you to complete the balance, or reject it with a reason. You are notified either way.",
      },
      {
        title: "Fix a rejected payment",
        description: "Open the invoice, read the rejection reason, and resubmit with the correct screenshot or reference number.",
      },
      {
        title: "Download official receipts",
        description: "In \"Finance Hub\", open a paid invoice from your history and use the receipt option to download the official receipt. Receipts are also posted into your conversation with the landlord.",
      },
    ],
    result: "You can explain every status on your ledger and have receipts for all confirmed payments.",
  },
  {
    id: "tenant-submit-maintenance",
    audience: "tenant",
    category: "tenant_maintenance",
    categoryLabel: "Maintenance",
    title: "Report a maintenance issue",
    summary: "File a request with a category, priority, description, and photos so it can be fixed quickly.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["maintenance", "repair", "request", "ticket", "plumbing", "electrical", "aircon", "hvac", "appliance", "structural", "photo", "priority"],
    actionShortcut: { label: "New maintenance request", href: "/tenant/maintenance/new" },
    relatedArticleIds: ["tenant-track-repair", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Start a request",
        description: "Open \"Maintenance\" in the left menu and choose the option to create a new request.",
      },
      {
        title: "Choose a category",
        description: "Pick the closest match: Plumbing, Electrical, HVAC (air-conditioning), Appliances, Structural, or Other.",
      },
      {
        title: "Set the priority",
        description: "Use the highest priority only for hazards such as flooding or sparking wiring. For immediate danger, use the emergency contact shown on the form as well.",
      },
      {
        title: "Describe the problem and add photos",
        description: "Write what happened, when it started, and where it is. Attach one wide photo and one close-up.",
        tip: "Clear photos let the repair person bring the right parts on the first visit.",
      },
      {
        title: "Submit",
        description: "Review the details and submit. Requests made while offline are saved on your device and sent when you reconnect.",
      },
    ],
    result: "The request appears in your Maintenance list with a Pending status and your landlord is notified.",
  },
  {
    id: "tenant-track-repair",
    audience: "tenant",
    category: "tenant_maintenance",
    categoryLabel: "Maintenance",
    title: "Follow a repair to completion",
    summary: "Respond to photo requests, report the repair person's progress, and confirm when the work is done.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["repair", "status", "in progress", "resolved", "self-repair", "photo request", "technician", "progress"],
    actionShortcut: { label: "Open Maintenance", href: "/tenant/maintenance" },
    relatedArticleIds: ["tenant-submit-maintenance", "tenant-direct-messaging"],
    steps: [
      {
        title: "Watch the status",
        description: "Pending means the landlord has not acted yet. Once they choose how to handle it, the ticket shows whether the landlord, a third-party contractor, or you will do the repair.",
      },
      {
        title: "Answer photo requests",
        description: "If your landlord asks for more photos, the ticket shows a request. Upload them from the ticket so the repair can proceed.",
      },
      {
        title: "Report progress on site",
        description: "When someone arrives, update the ticket as the work moves from arrived, to repairing, to done.",
      },
      {
        title: "Ask to fix it yourself",
        description: "For small issues you can request a self-repair. Your landlord approves or rejects it on the ticket; do not start work until it is approved.",
        tip: "Keep receipts for any approved self-repair so you can send them to your landlord.",
      },
      {
        title: "Confirm completion",
        description: "Test the fix before you mark the work done. If the problem returns, open a new request and mention the earlier ticket.",
      },
    ],
    result: "The ticket shows Resolved and the full history of the repair is kept for reference.",
  },
  {
    id: "tenant-book-facilities",
    audience: "tenant",
    category: "tenant_facilities",
    categoryLabel: "Facilities",
    title: "Book a shared facility",
    summary: "Reserve amenities your building offers, see the booking rate, and cancel bookings you no longer need.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["facilities", "amenities", "booking", "reserve", "cancel", "function room", "gym", "pool", "parking"],
    actionShortcut: { label: "Open Facilities", href: "/tenant/utilities" },
    relatedArticleIds: ["tenant-community-hub", "tenant-building-map"],
    steps: [
      {
        title: "Open Facilities",
        description: "Choose \"Facilities\" in the left menu to see the amenities your landlord has made available.",
      },
      {
        title: "Create a booking",
        description: "Select a facility, choose the date and time, and confirm. Any booking rate is shown before you confirm.",
      },
      {
        title: "Cancel if plans change",
        description: "Open the booking from the same page and cancel it so the slot is free for others.",
      },
    ],
    result: "Your booking is listed on the Facilities page and visible to your landlord.",
  },
  {
    id: "tenant-community-hub",
    audience: "tenant",
    category: "tenant_community",
    categoryLabel: "Community & Unit Map",
    title: "Use the Community Hub",
    summary: "Read building announcements, vote in polls, browse photo albums, comment, and check the house rules.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["community", "announcement", "advisory", "poll", "album", "comment", "house rules", "notice board"],
    actionShortcut: { label: "Open Community Hub", href: "/tenant/community" },
    relatedArticleIds: ["tenant-book-facilities", "tenant-direct-messaging"],
    steps: [
      {
        title: "Check announcements",
        description: "Open \"Community Hub\". Advisories about water interruptions, maintenance schedules, and events appear here, with important ones pinned at the top.",
      },
      {
        title: "Take part",
        description: "Vote in polls your landlord posts, open albums, and leave comments. Comments are visible to the whole building and are moderated.",
      },
      {
        title: "Read the house rules",
        description: "Quiet hours, guest policies, pets, and waste disposal rules are set by your landlord and shown here and in your lease.",
      },
    ],
    result: "You see the latest building notices and know where the rules that apply to you are kept.",
  },
  {
    id: "tenant-building-map",
    audience: "tenant",
    category: "tenant_community",
    categoryLabel: "Community & Unit Map",
    title: "Find your way with the Unit Map",
    summary: "See the floor layout, locate your unit, and find common areas and exits.",
    difficulty: "beginner",
    readTime: "1 min",
    keywords: ["unit map", "floor plan", "map", "floor", "exit", "common area", "amenities"],
    actionShortcut: { label: "Open Unit Map", href: "/tenant/unit-map" },
    relatedArticleIds: ["tenant-community-hub", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Open the map",
        description: "Choose \"Unit Map\" in the left menu.",
      },
      {
        title: "Switch floors",
        description: "Use the floor selector to view other levels. Your own unit is highlighted.",
      },
      {
        title: "Note the exits",
        description: "Locate the stairwells nearest your door and walk the route once so you know it in an emergency.",
      },
    ],
    result: "You can locate your unit and the nearest exits on every floor.",
  },
  {
    id: "tenant-direct-messaging",
    audience: "tenant",
    category: "tenant_messaging",
    categoryLabel: "Messages",
    title: "Message your landlord",
    summary: "Use Messages for questions and documents. Chats are kept as a record, and sensitive details are masked automatically.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["messages", "chat", "landlord", "attachment", "file", "photo", "mini chat", "report", "block", "iris"],
    actionShortcut: { label: "Open Messages", href: "/tenant/messages" },
    relatedArticleIds: ["tenant-community-hub", "tenant-faqs-troubleshooting"],
    steps: [
      {
        title: "Open a conversation",
        description: "Choose \"Messages\" in the left menu, or use the chat panel on the right edge of the dashboard to open a small chat window without leaving the page.",
      },
      {
        title: "Send text and attachments",
        description: "Type your message and press Enter. Use the paperclip to attach photos, PDFs, or documents such as a gate pass.",
      },
      {
        title: "Know what is masked",
        description: "Card numbers, passwords, and similar sensitive text are hidden automatically before a message is sent, and abusive or scam content is flagged. Do not share one-time codes in chat.",
      },
      {
        title: "Report or block",
        description: "Use the conversation menu to report a message, block a contact, or archive a chat. Reports are reviewed by the platform.",
      },
      {
        title: "Ask iRis for quick answers",
        description: "The \"Chat with iRis\" button at the bottom-left of the dashboard answers questions about your lease, dues, and house rules using your own records.",
      },
    ],
    result: "Your landlord receives the message immediately and the thread is kept for both parties.",
  },
  {
    id: "tenant-calendar",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Bills & Payments",
    title: "Keep track of due dates with the Calendar",
    summary: "See rent due dates and lease milestones in one place and add your own reminders.",
    difficulty: "beginner",
    readTime: "1 min",
    keywords: ["calendar", "due date", "reminder", "notes", "schedule"],
    actionShortcut: { label: "Open Calendar", href: "/tenant/calendar" },
    relatedArticleIds: ["tenant-understand-invoice", "tenant-renewal-moveout"],
    steps: [
      {
        title: "Open the Calendar",
        description: "Choose \"Calendar\" in the left menu to see upcoming due dates and lease dates.",
      },
      {
        title: "Add a personal note",
        description: "Select a day and add a note, for example a reminder to send your meter photo.",
      },
    ],
    result: "Upcoming dues and your own notes are visible on the month view.",
  },
  {
    id: "tenant-renewal-moveout",
    audience: "tenant",
    category: "tenant_moveout",
    categoryLabel: "Renewal & Move-Out",
    title: "Renew your lease or move out",
    summary: "Request a renewal before your lease ends, or give notice, complete the move-out checks, and settle your deposit.",
    difficulty: "intermediate",
    readTime: "4 min",
    keywords: ["renewal", "renew", "move out", "vacate", "notice", "deposit", "settlement", "inspection", "clearance", "refund"],
    actionShortcut: { label: "Open Leases", href: "/tenant/lease" },
    relatedArticleIds: ["tenant-download-lease-pdf", "tenant-payment-status-receipts"],
    steps: [
      {
        title: "Check your lease end date",
        description: "Open \"Leases\". The end date and any move-out target are shown on the lease card.",
      },
      {
        title: "Request a renewal",
        description: "If you want to stay, submit a renewal request from the lease. The card shows the request as pending until your landlord approves or rejects it.",
      },
      {
        title: "Give notice to move out",
        description: "If you are leaving, submit a move-out request from your dashboard or lease page with your intended date, following the notice period in your lease.",
        tip: "Notice periods and deposit terms come from your signed lease, not from the app. Read that section before setting a date.",
      },
      {
        title: "Prepare the unit",
        description: "Remove your belongings, clean the unit, and have final meter readings taken with your landlord on the move-out day.",
      },
      {
        title: "Review the settlement",
        description: "Your landlord issues a settlement that lists outstanding bills and any deductions against your deposit, and the resulting refund or balance due.",
      },
    ],
    result: "Your lease shows the renewal decision, or the move-out is completed with a settlement record you can download.",
  },
  {
    id: "tenant-emergency-hotlines",
    audience: "tenant",
    category: "tenant_safety",
    categoryLabel: "Safety",
    title: "Handle emergencies",
    summary: "What to do first for water leaks, electrical faults, and fire, and where to find emergency numbers.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["emergency", "fire", "leak", "flood", "power", "breaker", "valve", "hotline", "safety", "guard"],
    actionShortcut: { label: "Open Maintenance", href: "/tenant/maintenance" },
    relatedArticleIds: ["tenant-submit-maintenance", "tenant-building-map"],
    steps: [
      {
        title: "Burst pipe or flooding",
        description: "Close the unit's water shut-off valve, then file a maintenance request at the highest priority and contact the building guard.",
      },
      {
        title: "Power loss in your unit only",
        description: "Check your breaker panel and reset a tripped switch once. If it trips again or you see sparks, leave it off and file an Electrical request.",
      },
      {
        title: "Fire or smoke",
        description: "Leave immediately, close the door behind you, use the stairs, and call the fire service. Never use the elevator.",
        tip: "The new-request form in \"Maintenance\" lists local emergency numbers and a direct contact for urgent hazards. Save them in your phone.",
      },
    ],
    result: "You know the first action for each type of emergency and who to call.",
  },
  {
    id: "tenant-faqs-troubleshooting",
    audience: "tenant",
    category: "tenant_faqs",
    categoryLabel: "Help & FAQs",
    title: "Fix common problems",
    summary: "Quick answers for login trouble, a stale app screen, a wrong payment upload, and missing notifications.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["faq", "help", "troubleshooting", "password", "refresh", "blank", "wrong screenshot", "notifications", "offline"],
    actionShortcut: { label: "Message your landlord", href: "/tenant/messages" },
    relatedArticleIds: ["tenant-sign-in-security", "tenant-pay-rent-gcash"],
    steps: [
      {
        title: "I cannot sign in",
        description: "Use \"Forgot Password?\" on the login page. If two-factor authentication is on and you lost your device, use a recovery key or ask your landlord to help you contact support.",
      },
      {
        title: "The app looks out of date or blank",
        description: "Pull down to refresh, or close the app fully and reopen it. On the web, reload the page. An offline banner appears when you have no connection; your actions sync when you reconnect.",
      },
      {
        title: "I uploaded the wrong payment screenshot",
        description: "Open the invoice. If it is still under review, message your landlord with the correct screenshot and reference number. If it was rejected, resubmit from the invoice.",
      },
      {
        title: "I am not getting notifications",
        description: "Check that notifications are allowed for iReside in your phone settings, and confirm your email address in \"Profile\".",
      },
      {
        title: "Something else",
        description: "Send the details through \"Messages\". Include what you were doing, what you expected, and a screenshot if possible.",
      },
    ],
    result: "Most issues are resolved in place; anything else reaches your landlord with the context they need.",
  },

  // =========================================================================
  // LANDLORD MANUAL
  // =========================================================================
  {
    id: "landlord-first-time-setup",
    audience: "landlord",
    category: "property_setup",
    categoryLabel: "Property Setup",
    title: "Set up your first property",
    summary: "The setup wizard walks you through property details, floors and units, pricing, and house rules. Operations unlock as each stage completes.",
    difficulty: "beginner",
    readTime: "4 min",
    keywords: ["setup", "property", "add property", "floors", "units", "rooms", "pricing", "house rules", "wizard"],
    actionShortcut: { label: "Add a property", href: "/landlord/properties/new" },
    relatedArticleIds: ["landlord-unit-map", "landlord-settings-finance", "landlord-invite-tenants"],
    steps: [
      {
        title: "Register the property",
        description: "Choose \"Properties\" then \"Add Property\". Enter the building name, address, and an optional photo.",
      },
      {
        title: "Define floors and units",
        description: "Set the number of floors and the units on each. Use a consistent numbering scheme such as 101, 102, 201, so tenants find their unit on the map.",
      },
      {
        title: "Set rent and bills",
        description: "Enter the base monthly rent, security deposit rules, and which utilities are billed by submeter.",
      },
      {
        title: "Add rules and lease defaults",
        description: "Add house rules and choose whether standard lease terms are generated automatically for new tenants.",
      },
      {
        title: "Finish the remaining setup stages",
        description: "The dashboard setup guide shows what is still locked: configure the unit map, then payment channels and utility tariffs, then register your first tenant.",
        tip: "You can defer optional stages from the setup guide and return to them later.",
      },
    ],
    result: "The property appears under \"Properties\" and the dashboard setup guide advances to the next stage.",
  },
  {
    id: "landlord-unit-map",
    audience: "landlord",
    category: "visual_unit_map",
    categoryLabel: "Unit Map",
    title: "Lay out and use the Unit Map",
    summary: "Arrange units on a floor plan and read occupancy and payment status at a glance.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["unit map", "floor plan", "visual builder", "layout", "occupancy", "vacant", "occupied", "status"],
    actionShortcut: { label: "Open Unit Map", href: "/landlord/unit-map" },
    relatedArticleIds: ["landlord-first-time-setup", "landlord-invite-tenants"],
    steps: [
      {
        title: "Choose a layout preset",
        description: "The first time you open \"Unit Map\", pick a starting layout. You can rearrange units afterwards.",
      },
      {
        title: "Arrange units",
        description: "Drag units into position on each floor. Positions snap to a grid and are saved automatically.",
      },
      {
        title: "Read the colours",
        description: "Each unit's colour reflects its state: vacant, occupied and paid, due soon, overdue, or with an open maintenance alert.",
      },
      {
        title: "Act from a unit",
        description: "Select a unit to see its tenant, lease dates, latest readings, and shortcuts such as inviting a tenant to a vacant unit.",
      },
    ],
    result: "Every unit is placed on the map and its status is visible without opening a list.",
  },
  {
    id: "landlord-settings-finance",
    audience: "landlord",
    category: "landlord_settings",
    categoryLabel: "Settings & Branding",
    title: "Configure GCash and utility tariffs",
    summary: "Add the GCash details tenants pay to, and set the electricity and water rates used to compute utility charges.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["gcash", "qr", "payment channel", "tariff", "rate", "electricity", "water", "utilities", "settings", "finance"],
    actionShortcut: { label: "Open Finance settings", href: "/landlord/settings?category=Finance&subtab=GCash" },
    relatedArticleIds: ["landlord-utility-readings", "landlord-review-payments"],
    steps: [
      {
        title: "Open Finance settings",
        description: "Choose \"Settings\", then the \"Finance\" category and the \"GCash\" tab.",
      },
      {
        title: "Enter your GCash details",
        description: "Add the registered account name and mobile number, and upload a clear image of your GCash QR code. This is what tenants see at checkout.",
        tip: "Use the exact registered name so tenants can confirm they are paying the right account.",
      },
      {
        title: "Set utility tariffs",
        description: "Open the \"Utilities\" tab and enter your rate per kWh for electricity and per cubic metre for water. New readings use these rates.",
      },
    ],
    result: "Checkout shows your QR code, and utility readings convert to charges automatically.",
  },
  {
    id: "landlord-settings-brand-security",
    audience: "landlord",
    category: "landlord_settings",
    categoryLabel: "Settings & Branding",
    title: "Brand the portal and secure your account",
    summary: "Upload your logo and banner, pick a theme, enable two-factor authentication, review sessions, and set notification preferences.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["branding", "logo", "banner", "theme", "contrast", "two-factor", "2fa", "sessions", "notifications", "security", "audit log"],
    actionShortcut: { label: "Open Settings", href: "/landlord/settings" },
    relatedArticleIds: ["landlord-settings-finance", "landlord-reports-exports"],
    steps: [
      {
        title: "Personalise the portal",
        description: "In \"Settings\" open \"Personalization\". Upload a logo and dashboard banner and choose a theme. Tenants see your branding on their portal and on receipts.",
      },
      {
        title: "Harden sign-in",
        description: "Open \"Security\". Enable two-factor authentication, generate and store recovery keys, and review or end active sessions from \"Sessions\".",
      },
      {
        title: "Choose what you are notified about",
        description: "Open \"Notifications\" to control email and in-app alerts for payments, maintenance, and messages.",
      },
      {
        title: "Review activity",
        description: "\"Audit Logs\" lists security-relevant actions on your account so you can spot anything unexpected.",
      },
    ],
    result: "Your branding appears across both portals and new sign-ins require a second factor.",
  },
  {
    id: "landlord-invite-tenants",
    audience: "landlord",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "Invite applicants and screen applications",
    summary: "Create an invite for a unit, share the link or lobby QR code, and review the application and requirements before approving.",
    difficulty: "beginner",
    readTime: "4 min",
    keywords: ["invite", "applicant", "application", "screening", "requirements", "walk-in", "add tenant", "qr", "link", "expiry"],
    prerequisites: ["At least one vacant unit"],
    actionShortcut: { label: "Open Applications", href: "/landlord/applications" },
    relatedArticleIds: ["landlord-lease-signing", "landlord-lobby-flyer"],
    steps: [
      {
        title: "Create an invite",
        description: "From \"Tenants\" choose \"Add Tenant\", or select a vacant unit on the Unit Map. Pick the unit, the application type, and which requirement documents the applicant must upload.",
      },
      {
        title: "Set an expiry if you want one",
        description: "Invites can be left open or given an expiry date. Expired links stop accepting applications; you can issue a new one at any time.",
      },
      {
        title: "Share the link",
        description: "Copy the invite link and send it to the applicant, or let walk-ins scan the lobby poster QR code.",
      },
      {
        title: "Review the application",
        description: "Open \"Applications\". Check the submitted details and documents, request anything missing, and record the move-in payment when it is received.",
      },
      {
        title: "Approve and create the lease",
        description: "Finalising the approval provisions the tenant's login credentials and generates the lease for signing.",
        tip: "Credentials are emailed to the applicant. You can resend them from the application if they did not arrive.",
      },
    ],
    result: "The applicant becomes a tenant with login access and a lease waiting for signature.",
  },
  {
    id: "landlord-lease-signing",
    audience: "landlord",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "Get a lease signed",
    summary: "Send the signing link, wait for the tenant's signature, then countersign to activate the lease and mark the unit occupied.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["lease", "signing", "signature", "countersign", "activate", "signing link", "regenerate", "renewal"],
    actionShortcut: { label: "Open Leases", href: "/landlord/leases" },
    relatedArticleIds: ["landlord-invite-tenants", "landlord-move-out"],
    steps: [
      {
        title: "Send the signing link",
        description: "After approval the tenant receives a secure signing link by email. Regenerate it from the application if it expired.",
      },
      {
        title: "Wait for the tenant's signature",
        description: "\"Leases\" shows the lease as waiting for the tenant. You are notified when they sign.",
      },
      {
        title: "Countersign",
        description: "Open the lease and sign it yourself. Countersigning activates the lease, marks the unit occupied, and starts monthly invoicing.",
      },
      {
        title: "Handle renewals",
        description: "Tenants can request a renewal from their portal. Approve or reject the request from the lease; approving issues a new agreement to sign.",
      },
    ],
    result: "The lease shows as active and both parties can download the countersigned PDF.",
  },
  {
    id: "landlord-utility-readings",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "Billing & Payments",
    title: "Record submeter readings",
    summary: "Enter each unit's electricity and water readings so the next invoice includes accurate utility charges.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["utility billing", "reading", "submeter", "kwh", "water", "electricity", "meter", "tariff"],
    prerequisites: ["Utility tariffs set in Finance settings"],
    actionShortcut: { label: "Open Utility Billing", href: "/landlord/utility-billing" },
    relatedArticleIds: ["landlord-settings-finance", "landlord-monthly-invoices"],
    steps: [
      {
        title: "Open Utility Billing",
        description: "Choose \"Utility Billing\" in the left menu and select the billing period.",
      },
      {
        title: "Enter the current readings",
        description: "For each unit, enter the electricity (kWh) and water (m³) readings from the physical meter. The previous reading is shown for comparison.",
        tip: "Photograph each meter when you read it. It settles disputes quickly and can be shared in chat.",
      },
      {
        title: "Check the computed charges",
        description: "Consumption is current minus previous, multiplied by the tariff. Correct any reading that produces an unusual result before invoices are issued.",
      },
    ],
    result: "Each unit shows the consumption and charge that will appear on its next invoice.",
  },
  {
    id: "landlord-monthly-invoices",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "Billing & Payments",
    title: "Issue monthly invoices",
    summary: "Invoices are generated automatically on the first day of each month for every active lease. You can also create or adjust them manually.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["invoice", "billing", "monthly", "automatic", "cron", "due date", "finance hub", "reminder"],
    actionShortcut: { label: "Open Finance Hub", href: "/landlord/invoices" },
    relatedArticleIds: ["landlord-utility-readings", "landlord-review-payments"],
    steps: [
      {
        title: "Know the schedule",
        description: "A scheduled job runs at the start of every month and creates rent invoices for all active leases, adding utility lines from recorded readings.",
      },
      {
        title: "Review the ledger",
        description: "Open \"Finance Hub\" to see every invoice by status: unpaid, under review, paid, or with an issue.",
      },
      {
        title: "Create or adjust an invoice",
        description: "Use the Finance Hub tools to add a one-off charge or correct an invoice before the tenant pays it.",
      },
      {
        title: "Chase overdue invoices",
        description: "Send a payment reminder from the dashboard's collection tools or from the conversation with the tenant. Reminders are logged in the chat.",
      },
    ],
    result: "Tenants see their invoices in their Finance Hub with your GCash details attached.",
  },
  {
    id: "landlord-review-payments",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "Billing & Payments",
    title: "Review GCash payments and issue receipts",
    summary: "Check the uploaded proof against your GCash history, handle partial or incorrect amounts, and confirm to issue the official receipt.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["verify", "review", "payment proof", "screenshot", "reference number", "partial", "overpaid", "short paid", "reject", "receipt"],
    actionShortcut: { label: "Open Finance Hub", href: "/landlord/invoices" },
    relatedArticleIds: ["landlord-collect-cash", "landlord-monthly-invoices"],
    steps: [
      {
        title: "Open the payment for review",
        description: "Invoices under review are flagged on the dashboard and in \"Finance Hub\". Open one to see the screenshot and reference number.",
      },
      {
        title: "Match it to your GCash account",
        description: "Confirm the reference number and amount against your GCash transaction history before you approve anything.",
        tip: "Never approve from the screenshot alone. Screenshots can be edited; your GCash history cannot.",
      },
      {
        title: "Handle non-exact amounts",
        description: "If the amount is short or over, choose whether to accept it as a partial payment, ask the tenant to complete the balance, or reject it with a reason. Overpayments are tracked for reconciliation.",
      },
      {
        title: "Confirm and issue the receipt",
        description: "Choose the confirm option. The invoice is marked paid, an official receipt is generated, and the tenant is notified in chat.",
      },
    ],
    result: "The invoice shows as paid with a receipt number, and the tenant can download the receipt.",
  },
  {
    id: "landlord-collect-cash",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "Billing & Payments",
    title: "Record cash and in-person payments",
    summary: "Confirm cash handed to you so the invoice is settled and receipted like any other payment.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["cash", "in person", "in-person", "record payment", "collect", "receipt", "settle"],
    actionShortcut: { label: "Open Dashboard", href: "/landlord/dashboard" },
    relatedArticleIds: ["landlord-review-payments", "landlord-monthly-invoices"],
    steps: [
      {
        title: "Find the pending in-person payment",
        description: "When a tenant chooses cash at checkout, the invoice shows an in-person notice on your dashboard and in Finance Hub.",
      },
      {
        title: "Record a payment you received",
        description: "Use \"Record Cash or In-Person Rent Payment\" from the dashboard quick actions, pick the tenant and invoice, and enter the amount received.",
      },
      {
        title: "Settle and issue the receipt",
        description: "Confirm the settlement. The invoice becomes paid and the official receipt is issued to the tenant.",
      },
    ],
    result: "The cash payment appears in the ledger with a receipt, the same as a GCash payment.",
  },
  {
    id: "landlord-maintenance-tickets",
    audience: "landlord",
    category: "maintenance_tickets",
    categoryLabel: "Maintenance",
    title: "Manage maintenance tickets",
    summary: "Triage new requests, decide who repairs the issue, ask for photos when needed, and close tickets when the work is done.",
    difficulty: "beginner",
    readTime: "4 min",
    keywords: ["maintenance", "ticket", "repair", "priority", "contractor", "third party", "self-repair", "photo request", "resolve"],
    actionShortcut: { label: "Open Maintenance", href: "/landlord/maintenance" },
    relatedArticleIds: ["landlord-messaging", "landlord-reports-exports"],
    steps: [
      {
        title: "Triage new tickets",
        description: "Open \"Maintenance\". New requests show the category, the tenant's priority, photos, and description. Critical items are highlighted.",
      },
      {
        title: "Choose the repair method",
        description: "Decide whether you will handle it, assign a third-party contractor and record their name, or approve the tenant's self-repair request.",
      },
      {
        title: "Ask for more detail",
        description: "If the photos are not enough, request additional photos. The tenant sees the request on their ticket.",
      },
      {
        title: "Track progress",
        description: "Tenants can report when the repair person arrived, is working, and has finished. Use this to keep the ticket current.",
      },
      {
        title: "Resolve the ticket",
        description: "Mark the ticket resolved once the work is verified. Record the cost so it appears in your expense reporting.",
      },
    ],
    result: "The ticket is resolved with a full timeline, and the unit's maintenance alert clears on the Unit Map.",
  },
  {
    id: "landlord-community-facilities",
    audience: "landlord",
    category: "community_tools",
    categoryLabel: "Community & Facilities",
    title: "Publish announcements and manage facilities",
    summary: "Post advisories, polls, and albums to every tenant, and offer bookable amenities.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["community", "announcement", "advisory", "poll", "album", "comments", "facilities", "amenities", "booking"],
    actionShortcut: { label: "Open Community Hub", href: "/landlord/community" },
    relatedArticleIds: ["landlord-messaging", "landlord-lobby-flyer"],
    steps: [
      {
        title: "Post an announcement",
        description: "Open \"Community Hub\" and create a post. Pin urgent advisories such as water interruptions so they stay at the top.",
      },
      {
        title: "Run a poll or share an album",
        description: "Use polls to collect quick decisions from tenants and albums to share event or inspection photos. Comments are moderated automatically.",
      },
      {
        title: "Set up bookable facilities",
        description: "Open \"Facilities\" to add amenities, set any booking rate, and review or cancel tenant bookings.",
      },
    ],
    result: "Tenants see the post in their Community Hub and can book the facilities you listed.",
  },
  {
    id: "landlord-messaging",
    audience: "landlord",
    category: "community_tools",
    categoryLabel: "Community & Facilities",
    title: "Message tenants",
    summary: "Use Messages or the dashboard chat panel for tenant conversations, attachments, reminders, and moderation tools.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["messages", "chat", "mini chat", "attachment", "reminder", "report", "block", "archive", "redaction"],
    actionShortcut: { label: "Open Messages", href: "/landlord/messages" },
    relatedArticleIds: ["landlord-community-facilities", "landlord-review-payments"],
    steps: [
      {
        title: "Open a conversation",
        description: "Choose \"Messages\" for the full inbox, or hover the chat panel on the right edge of the dashboard to open a small chat window while you work.",
      },
      {
        title: "Send attachments and reminders",
        description: "Attach documents or photos with the paperclip. Payment reminders and receipts sent from Finance Hub appear in the same thread.",
      },
      {
        title: "Rely on automatic safeguards",
        description: "Sensitive details such as card numbers are masked before sending, and scam or abusive content is flagged for both parties.",
      },
      {
        title: "Moderate when needed",
        description: "From the conversation menu you can archive a chat, report a contact, or block them. Blocked contacts can no longer message you.",
      },
    ],
    result: "Every exchange with a tenant is kept in one timestamped thread.",
  },
  {
    id: "landlord-move-out",
    audience: "landlord",
    category: "move_out_deposit",
    categoryLabel: "Move-Out",
    title: "Process a move-out and settle the deposit",
    summary: "Review the tenant's move-out request, record final readings and deductions, and issue the settlement.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["move out", "move-out request", "deposit", "settlement", "deduction", "inspection", "final reading", "refund"],
    actionShortcut: { label: "Open Move-Out Requests", href: "/landlord/move-out" },
    relatedArticleIds: ["landlord-lease-signing", "landlord-utility-readings"],
    steps: [
      {
        title: "Review the request",
        description: "Open \"Move-Out Requests\". Each request shows the tenant, unit, intended date, and outstanding balance.",
      },
      {
        title: "Inspect the unit",
        description: "On the move-out date, take final meter readings, check for damage, and collect keys. Photograph anything you intend to deduct.",
      },
      {
        title: "Issue the settlement",
        description: "Enter final utility charges and any deductions. The settlement computes the refund or balance due from the security deposit and is shared with the tenant.",
      },
      {
        title: "Close the lease",
        description: "Completing the move-out ends the lease and returns the unit to vacant on the Unit Map.",
      },
    ],
    result: "The tenant receives an itemised settlement and the unit is ready to be relisted.",
  },
  {
    id: "landlord-reports-exports",
    audience: "landlord",
    category: "reports_documents",
    categoryLabel: "Reports & Documents",
    title: "Use Analytics, exports, and the Document Vault",
    summary: "Track collection and revenue, export CSV reports, read iRis insights, and keep important files in one place.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["analytics", "report", "export", "csv", "revenue", "collection", "expenses", "iris", "insights", "document vault", "data export"],
    actionShortcut: { label: "Open Analytics", href: "/landlord/analytics" },
    relatedArticleIds: ["landlord-monthly-invoices", "landlord-settings-brand-security"],
    steps: [
      {
        title: "Read the key figures",
        description: "\"Analytics\" shows revenue, collection rate, outstanding balances, and expenses over time.",
      },
      {
        title: "Export a report",
        description: "Use the export option in Analytics to download a CSV for your accountant. Broader data exports by category and date range are under \"Settings\" in the \"Data\" category.",
      },
      {
        title: "Ask iRis for insights",
        description: "The iRis analysis summarises trends and flags units or tenants that need attention.",
      },
      {
        title: "Store documents",
        description: "\"Document Vault\" keeps permits, signed leases, and other files you want available from any device.",
      },
    ],
    result: "You can produce a report for any period and find your records without searching email.",
  },
  {
    id: "landlord-lobby-flyer",
    audience: "landlord",
    category: "marketing_flyers",
    categoryLabel: "Posters & QR Codes",
    title: "Print a lobby poster with a QR code",
    summary: "Create a poster with your branding, contact details, and a QR code that opens the application or portal link.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["flyer", "poster", "qr code", "print", "lobby", "branding", "export"],
    actionShortcut: { label: "Open Flyer Studio", href: "/landlord/flyer" },
    relatedArticleIds: ["landlord-invite-tenants", "landlord-settings-brand-security"],
    steps: [
      {
        title: "Open Flyer Studio",
        description: "Choose \"Lobby QR Code Flyer Poster\" from the dashboard quick actions, or open /landlord/flyer.",
      },
      {
        title: "Edit the content",
        description: "Click any text on the poster to change contact numbers, office hours, or Wi-Fi details. Upload a background photo if you want one.",
      },
      {
        title: "Export and print",
        description: "Export the poster as an image and print it for the lobby, elevator, or notice board.",
      },
    ],
    result: "Scanning the printed QR code opens your invite or portal link on the visitor's phone.",
  },
  {
    id: "landlord-install-apps",
    audience: "landlord",
    category: "mobile_pwa",
    categoryLabel: "Apps & Devices",
    title: "Install iReside on Windows, Android, and iOS",
    summary: "Use the desktop installer for day-to-day operations, the Android app on the go, or add the portal to an iPhone home screen.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["install", "windows", "desktop", "android", "apk", "iphone", "ios", "safari", "download"],
    actionShortcut: { label: "Open the download page", href: "/download" },
    relatedArticleIds: ["landlord-first-time-setup", "landlord-troubleshooting"],
    steps: [
      {
        title: "Windows",
        description: "On the download page choose the Windows installer and run it. The desktop app opens the portal in its own window.",
        tip: "If the installer is still being prepared, the page tells you to try again shortly.",
      },
      {
        title: "Android",
        description: "Download the APK on your phone, open it, and tap \"Install\". Allow installs from this source if prompted.",
      },
      {
        title: "iPhone and iPad",
        description: "Open the portal in Safari, tap Share, then \"Add to Home Screen\".",
      },
    ],
    result: "iReside opens from an icon on each device and signs you into the same account.",
  },
  {
    id: "landlord-troubleshooting",
    audience: "landlord",
    category: "troubleshooting_faqs",
    categoryLabel: "Troubleshooting",
    title: "Fix common operational problems",
    summary: "What to do when a tenant cannot sign in, emails are not arriving, a reading is disputed, or an invoice is wrong.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["troubleshooting", "faq", "email", "smtp", "resend credentials", "disputed reading", "invoice", "health check", "support"],
    actionShortcut: { label: "Open Technical Commissioning", href: "/setup/technical" },
    relatedArticleIds: ["landlord-invite-tenants", "landlord-utility-readings"],
    steps: [
      {
        title: "A tenant never received their credentials",
        description: "Open the application and resend the credentials. Ask the tenant to check their spam folder.",
      },
      {
        title: "Emails are not being delivered",
        description: "Open /setup/technical. It checks the Supabase connection and the mail transport and reports what is missing. Share the result with whoever administers your installation.",
      },
      {
        title: "A tenant disputes a reading",
        description: "Compare the reading history in \"Utility Billing\" with a photo of the meter, correct the reading if needed, and reissue the invoice before it is paid.",
      },
      {
        title: "An invoice is wrong",
        description: "Adjust it from Finance Hub while it is unpaid. If it was already paid, record the correction on the next invoice and note it in chat.",
      },
      {
        title: "Something else",
        description: "Use the \"Documentation\" link in the left menu to search this manual, or contact your installation's administrator with the steps to reproduce the problem.",
      },
    ],
    result: "The problem is resolved or escalated with the information needed to fix it.",
  },

  // =========================================================================
  // TECHNICAL MANUAL
  // =========================================================================
  {
    id: "it-system-architecture",
    audience: "it",
    category: "architecture_cloud",
    categoryLabel: "Architecture",
    title: "System architecture",
    summary: "A Next.js App Router application hosted on Vercel, backed by Supabase for Postgres, authentication, realtime, and file storage.",
    difficulty: "intermediate",
    readTime: "4 min",
    keywords: ["architecture", "next.js", "vercel", "supabase", "postgres", "realtime", "storage", "middleware"],
    relatedArticleIds: ["it-environment-variables", "it-database-storage"],
    steps: [
      {
        title: "Web application",
        description: "Next.js 16 with React 19 and TypeScript. Pages live under src/app; API routes under src/app/api run on the Node.js runtime. Tailwind CSS v4 provides styling.",
      },
      {
        title: "Authentication and authorisation",
        description: "Supabase Auth issues sessions stored in HttpOnly cookies. src/middleware.ts refreshes the session, resolves the user's role, and enforces portal, two-factor, and documentation access rules before a page renders.",
      },
      {
        title: "Data and realtime",
        description: "Supabase Postgres with Row Level Security holds all records. Messaging, presence, and typing indicators use Supabase Realtime channels.",
      },
      {
        title: "Files and AI",
        description: "Uploads go to Supabase Storage buckets. The iRis assistant and analytics insights call Groq's hosted models through GROQ_API_KEY.",
      },
    ],
    contentMarkdown: `
Client (browser, Android app, Windows desktop app)
        |  HTTPS / WSS
Vercel: Next.js 16 App Router
        |  - Server components and API routes (Node.js runtime)
        |  - src/middleware.ts: session refresh, role resolution, route protection
        |  - Cron: /api/cron/monthly-invoices (vercel.json)
        |  TLS
Supabase: Postgres + RLS, Auth, Realtime, Storage
External: SMTP mail transport, Groq (iRis / insights)
`,
  },
  {
    id: "it-environment-variables",
    audience: "it",
    category: "environment_security",
    categoryLabel: "Configuration & Secrets",
    title: "Environment variables",
    summary: "Every variable the application reads, grouped by what stops working when it is missing.",
    difficulty: "advanced",
    readTime: "4 min",
    keywords: ["env", "environment", "variables", "secrets", "supabase", "smtp", "jwt", "groq", "cron secret", "vercel"],
    actionShortcut: { label: "Run the commissioning checks", href: "/setup/technical" },
    relatedArticleIds: ["it-system-architecture", "it-mail-transport"],
    steps: [
      {
        title: "Required: Supabase",
        description: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for client and server access; SUPABASE_SERVICE_ROLE_KEY for server-side admin operations such as provisioning tenant accounts and the invoicing cron.",
        codeSnippet: "NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=...\nSUPABASE_SERVICE_ROLE_KEY=...",
      },
      {
        title: "Required: application URLs and signing",
        description: "NEXT_PUBLIC_APP_URL is used in emailed links (signing, onboarding). JWT_SECRET signs lease-signing and onboarding tokens. SECURITY_KEY_SECRET protects account recovery keys. CRON_SECRET authorises the scheduled invoicing request.",
        codeSnippet: "NEXT_PUBLIC_APP_URL=https://app.example.com\nJWT_SECRET=<long random string>\nSECURITY_KEY_SECRET=<long random string>\nCRON_SECRET=<long random string>",
      },
      {
        title: "Required for email",
        description: "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM. Set SMTP_TLS_REJECT_UNAUTHORIZED=false only for self-signed relays in testing.",
        codeSnippet: "SMTP_HOST=smtp.gmail.com\nSMTP_PORT=587\nSMTP_USER=mailer@example.com\nSMTP_PASS=<app password>\nSMTP_FROM=\"iReside <mailer@example.com>\"",
      },
      {
        title: "Optional integrations",
        description: "GROQ_API_KEY enables iRis and analytics insights. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI enable Google-based two-factor enrolment for landlords. BLOB_READ_WRITE_TOKEN and the GITHUB_DESKTOP_BUILD_* variables are needed only to publish mobile and desktop installers.",
      },
    ],
    result: "/setup/technical reports every required variable as present and the mail transport as reachable.",
  },
  {
    id: "it-mail-transport",
    audience: "it",
    category: "environment_security",
    categoryLabel: "Configuration & Secrets",
    title: "Configure the mail transport",
    summary: "Outbound email uses SMTP through Nodemailer. Gmail with an app password is the simplest option; any SMTP relay works.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["smtp", "email", "gmail", "app password", "nodemailer", "relay", "health"],
    actionShortcut: { label: "Test the mailer", href: "/setup/technical" },
    relatedArticleIds: ["it-environment-variables", "landlord-troubleshooting"],
    steps: [
      {
        title: "Create credentials",
        description: "For Gmail, enable 2-Step Verification on the sending account and generate an app password. For other providers, create SMTP credentials in their console.",
      },
      {
        title: "Set the variables",
        description: "Fill SMTP_HOST, SMTP_PORT (587 for STARTTLS), SMTP_USER, SMTP_PASS, and SMTP_FROM in .env.local and in the Vercel project settings.",
      },
      {
        title: "Verify",
        description: "Open /setup/technical and run the mailer check, or call /api/health. Both report whether the transport can connect.",
      },
    ],
    result: "Password resets, credentials, signing links, and invoice notifications are delivered.",
  },
  {
    id: "it-database-storage",
    audience: "it",
    category: "database_schema",
    categoryLabel: "Database & Storage",
    title: "Database schema, RLS, and storage buckets",
    summary: "The schema is applied from source-of-truth-db.sql, every table is protected by Row Level Security, and uploads are separated into purpose-specific buckets.",
    difficulty: "advanced",
    readTime: "5 min",
    keywords: ["database", "schema", "sql", "rls", "row level security", "migration", "storage", "bucket", "supabase"],
    relatedArticleIds: ["it-system-architecture", "it-backup-recovery", "it-installation"],
    steps: [
      {
        title: "Apply the schema",
        description: "source-of-truth-db.sql in the repository root creates all tables, enums, functions, triggers, and RLS policies. Incremental changes live in supabase/migrations.",
      },
      {
        title: "Understand the core tables",
        description: "profiles (users and roles), properties, units, leases, invoices and payments, maintenance_requests, messages and conversations, community posts, facility bookings, renewal and move-out requests, and security settings.",
      },
      {
        title: "Row Level Security",
        description: "Policies restrict landlords to records they own and tenants to records linked to their lease or unit. Server routes that must cross those boundaries use the service role key and perform their own authorisation checks.",
      },
      {
        title: "Create the storage buckets",
        description: "Create these buckets in Supabase Storage before first use: profile-avatars, profile-covers, brand-logos, brand-banners, business-permits, property-images, maintenance-images, community-images, and message-files. Avatars, logos, banners, and property images are served publicly; the rest are private.",
      },
    ],
    result: "The SQL editor reports success, tables show RLS enabled, and uploads from each feature land in the expected bucket.",
  },
  {
    id: "it-scheduled-jobs",
    audience: "it",
    category: "cron_maintenance",
    categoryLabel: "Scheduled Jobs",
    title: "Scheduled jobs and health checks",
    summary: "One Vercel cron generates monthly invoices. A health endpoint and the commissioning page cover monitoring.",
    difficulty: "intermediate",
    readTime: "2 min",
    keywords: ["cron", "schedule", "monthly invoices", "vercel.json", "cron secret", "health", "monitoring"],
    relatedArticleIds: ["it-environment-variables", "landlord-monthly-invoices"],
    steps: [
      {
        title: "Monthly invoicing",
        description: "vercel.json schedules GET /api/cron/monthly-invoices at 00:00 UTC on the first of each month. The route requires the CRON_SECRET bearer token and creates invoices for every active lease.",
        codeSnippet: "{ \"crons\": [{ \"path\": \"/api/cron/monthly-invoices\", \"schedule\": \"0 0 1 * *\" }] }",
      },
      {
        title: "Run it manually",
        description: "Call the same route with the Authorization header set to the cron secret to backfill a month or test the job in staging.",
      },
      {
        title: "Monitor",
        description: "/api/health reports database and mail transport status. Point an uptime monitor at it. Supabase free-tier projects pause after inactivity; a scheduled ping of /api/health keeps them awake if you rely on that tier.",
      },
    ],
    result: "Invoices appear on the first of the month and the health endpoint returns a healthy status.",
  },
  {
    id: "it-backup-recovery",
    audience: "it",
    category: "disaster_recovery",
    categoryLabel: "Backup & Recovery",
    title: "Back up, restore, and transfer ownership",
    summary: "How to export the database and files, rebuild on a fresh project, and move the Supabase and Vercel projects to a new owner.",
    difficulty: "advanced",
    readTime: "4 min",
    keywords: ["backup", "restore", "disaster recovery", "dump", "export", "transfer", "ownership", "handover"],
    relatedArticleIds: ["it-database-storage", "it-handover-checklist"],
    steps: [
      {
        title: "Back up the database",
        description: "Use the Supabase dashboard's scheduled backups, or run a dump with the Supabase CLI and store it off-platform on a schedule.",
        codeSnippet: "supabase db dump -f backup.sql",
      },
      {
        title: "Back up storage",
        description: "Download each bucket from the dashboard or script it with the Storage API. Buckets are listed in the database and storage article.",
      },
      {
        title: "Restore to a new project",
        description: "Create a Supabase project, run source-of-truth-db.sql, restore the dump, recreate the buckets, update the environment variables, and redeploy.",
      },
      {
        title: "Transfer ownership",
        description: "Transfer the Supabase organisation or project and the Vercel project to the new owner's accounts, then rotate every secret listed in the environment variables article.",
      },
    ],
    result: "A restore drill brings up a working copy on a fresh project using only the backups.",
  },
  {
    id: "it-system-requirements",
    audience: "it",
    category: "system_specifications",
    categoryLabel: "Requirements",
    title: "System requirements",
    summary: "What users need to run the portals, and what the host needs to run the application.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["requirements", "browser", "device", "android", "ios", "windows", "node", "hosting", "network"],
    relatedArticleIds: ["it-installation", "it-system-architecture"],
    steps: [
      {
        title: "End users",
        description: "A current version of Chrome, Edge, Firefox, or Safari with JavaScript enabled. Android devices can install the APK; iOS devices use Safari's Add to Home Screen. A stable connection of about 2 Mbps or better is enough for all features including photo uploads.",
      },
      {
        title: "Landlord desktop",
        description: "The Windows installer runs on Windows 10 or later. Any desktop browser also works.",
      },
      {
        title: "Hosting",
        description: "Node.js 20 or later for local development and builds, a Vercel project (or any Node host that supports Next.js 16), a Supabase project, an SMTP account, and optionally a Groq API key.",
      },
    ],
    result: "Users on supported browsers can use every feature; the host builds and deploys without version warnings.",
  },
  {
    id: "it-roles-and-access",
    audience: "it",
    category: "user_roles_access",
    categoryLabel: "Roles & Access",
    title: "Roles and route protection",
    summary: "iReside has two active roles, landlord and tenant. Applicants interact through tokenised public links and become tenants on approval.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["roles", "rbac", "permissions", "landlord", "tenant", "applicant", "middleware", "access", "documentation"],
    relatedArticleIds: ["it-system-architecture", "it-database-storage"],
    steps: [
      {
        title: "Landlord",
        description: "Owns properties, units, leases, invoices, and settings. Routes under /landlord, /setup, and the full documentation set are available.",
      },
      {
        title: "Tenant",
        description: "Scoped to their own lease and unit. Routes under /tenant only. Requests to the landlord portal, the public documentation site, and the landlord manual are redirected to the tenant manual at /tenant/docs.",
      },
      {
        title: "Applicant and public",
        description: "Unauthenticated visitors can open /apply/<token> invite links, lease-signing links, the download page, and the public documentation. Accounts are created by the landlord on approval, not by self-registration.",
      },
      {
        title: "Where enforcement happens",
        description: "src/middleware.ts resolves the role from the session (cached in an HttpOnly cookie for an hour) and applies the redirects. API routes re-check authorisation server-side, and RLS enforces it at the database.",
      },
    ],
    contentMarkdown: `
| Capability                          | Landlord | Tenant | Applicant |
|-------------------------------------|----------|--------|-----------|
| Properties, units, unit map         | manage   | view   | none      |
| Invites and application screening   | manage   | none   | submit    |
| Lease signing                       | sign     | sign   | none      |
| Invoices and utility readings       | manage   | view   | none      |
| Payment proof                       | verify   | upload | none      |
| Maintenance tickets                 | manage   | submit | none      |
| Community posts and polls           | post     | react  | none      |
| Messages                            | yes      | yes    | none      |
| Documentation site and all manuals  | yes      | tenant manual only | public site |
`,
  },
  {
    id: "it-installation",
    audience: "it",
    category: "installation_guide",
    categoryLabel: "Installation",
    title: "Install and deploy",
    summary: "From a fresh clone to a production deployment on Vercel with Supabase.",
    difficulty: "advanced",
    readTime: "6 min",
    keywords: ["install", "setup", "clone", "npm", "env", "sql", "supabase", "vercel", "deploy", "build"],
    prerequisites: ["Node.js 20+", "A Supabase project", "A Vercel account", "SMTP credentials"],
    actionShortcut: { label: "Open Technical Commissioning", href: "/setup/technical" },
    relatedArticleIds: ["it-environment-variables", "it-database-storage", "it-scheduled-jobs"],
    steps: [
      {
        title: "Clone and install",
        description: "Clone the repository and install dependencies.",
        codeSnippet: "git clone https://github.com/Sedictt/iReside---Capstone.git iReside\ncd iReside\nnpm install",
      },
      {
        title: "Configure the environment",
        description: "Create .env.local with the variables from the environment variables article. The same values go into the Vercel project settings for production.",
      },
      {
        title: "Apply the database",
        description: "In the Supabase SQL editor run source-of-truth-db.sql, then create the storage buckets listed in the database and storage article.",
      },
      {
        title: "Run locally",
        description: "Start the development server and open http://localhost:3000. Use /setup/technical to confirm connectivity.",
        codeSnippet: "npm run dev",
      },
      {
        title: "Create the first landlord",
        description: "Provision an account with the bundled script, then sign in and complete the setup wizard.",
        codeSnippet: "npm run create:landlord -- --email owner@example.com --name \"Owner Name\"",
      },
      {
        title: "Deploy",
        description: "Import the repository into Vercel, set the environment variables, and deploy. The cron in vercel.json is registered automatically. Add NEXT_PUBLIC_APP_URL with the production domain.",
      },
      {
        title: "Verify",
        description: "Run the test suite before handing over, and confirm /api/health returns a healthy status on the deployed URL.",
        codeSnippet: "npm test",
      },
    ],
    result: "The production URL serves the login page, a landlord can sign in, and the commissioning page shows every check passing.",
  },
  {
    id: "it-handover-checklist",
    audience: "it",
    category: "turnover_handover",
    categoryLabel: "Handover",
    title: "Handover and acceptance checklist",
    summary: "What to deliver and verify when the installation is transferred to the property owner or their administrator.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["handover", "acceptance", "turnover", "checklist", "credentials", "ownership", "manual", "pdf"],
    actionShortcut: { label: "Open the landlord manual", href: "/landlord/docs" },
    relatedArticleIds: ["it-installation", "it-backup-recovery", "it-roles-and-access"],
    steps: [
      {
        title: "Access",
        description: "Transfer the repository, Supabase project, Vercel project, SMTP account, and any API keys to accounts the owner controls. Rotate every secret afterwards.",
      },
      {
        title: "Documentation",
        description: "Provide the three manuals as PDF using the download button in the interactive manual, and a copy of the environment variable list with values stored in the owner's password manager.",
      },
      {
        title: "Demonstrate the core flow",
        description: "Walk through: invite and approve an applicant, sign and countersign a lease, record readings and issue an invoice, verify a GCash payment, resolve a maintenance ticket, and send a message.",
      },
      {
        title: "Verify operations",
        description: "Confirm backups are scheduled, /api/health is monitored, the cron is registered in Vercel, and at least one restore drill has been completed.",
      },
      {
        title: "Record acceptance",
        description: "Have the owner's representative confirm each item above in writing, with the date and the deployed URL.",
      },
    ],
    result: "The owner can operate, back up, and recover the system without the original developers.",
  },
];

export const getArticlesForAudience = (audience: ManualAudience) =>
  DOCS_ARTICLES.filter((article) => article.audience === audience);
