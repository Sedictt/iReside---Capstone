export type DocAudience = "tenant" | "landlord" | "it" | "user" | "all";

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
  | "tenant_safety"
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
  | "disaster_recovery"
  | "system_specifications"
  | "user_roles_access"
  | "installation_guide"
  | "turnover_handover";

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
    description: "Submitting repair tickets with photos, tracking technician dispatch, and rating work.",
  },
  tenant_utilities: {
    label: "Utilities & Submeters",
    iconName: "Zap",
    audience: "tenant",
    description: "Tracking electricity and water meter readings, tariffs, and monthly consumption trends.",
  },
  tenant_community: {
    label: "Community & Building Map",
    iconName: "Users",
    audience: "tenant",
    description: "Building notice board, interactive unit map, amenities, and house rules.",
  },
  tenant_messaging: {
    label: "Direct Messaging",
    iconName: "MessageSquare",
    audience: "tenant",
    description: "Communicating directly with property management, office hours, and file attachments.",
  },
  tenant_moveout: {
    label: "Move-Out & Deposits",
    iconName: "Home",
    audience: "tenant",
    description: "Notice of intent to vacate, move-out inspections, and security deposit settlements.",
  },
  tenant_safety: {
    label: "Safety & Emergencies",
    iconName: "ShieldAlert",
    audience: "tenant",
    description: "Fire safety, power outages, pipe bursts, and 24/7 emergency hotlines.",
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
  system_specifications: {
    label: "System Specs & Requirements",
    iconName: "Cpu",
    audience: "it",
    description: "Hardware, software, browser, and network prerequisites for client and host.",
  },
  user_roles_access: {
    label: "User Types & RBAC Matrix",
    iconName: "Users",
    audience: "it",
    description: "Different user roles, privileges, and feature-by-feature access control matrix.",
  },
  installation_guide: {
    label: "Step-by-Step Installation",
    iconName: "Terminal",
    audience: "it",
    description: "Complete setup procedure from repository clone to database migration and cloud launch.",
  },
  turnover_handover: {
    label: "System Turnover & Defense",
    iconName: "Award",
    audience: "it",
    description: "Formal sign-off acceptance, oral defense checklists, and commissioning protocol.",
  },
};

export const DOCS_ARTICLES: DocArticle[] = [
  // =========================================================================
  // 1. TENANT DEDICATED MANUAL (16 COMPREHENSIVE FOOLPROOF CHAPTERS)
  // =========================================================================
  {
    id: "tenant-install-app",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started & Profile",
    title: "How to install the iReside App on Android (Dedicated APK) & iPhone",
    summary: "Download the official Android native APK installer or add iReside directly to your smartphone home screen to get instant rent reminders, payment receipts, and repair alerts.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["app", "install", "apk", "android", "pwa", "iphone", "ios", "safari", "chrome", "home screen", "notifications", "download", "package"],
    actionShortcut: {
      label: "Open App Download Hub",
      href: "/download",
    },
    relatedArticleIds: ["tenant-profile-emergency", "tenant-sign-lease"],
    steps: [
      {
        title: "Download Dedicated Android Package (.apk)",
        description: "Tap 'Open App Download Hub' below (or visit /download), tap 'Download for Android (.apk)', then tap the downloaded file to install.",
        tip: "If prompted, tap 'Allow from this source'. The dedicated APK includes direct camera access for fast payment & repair uploads.",
      },
      {
        title: "Install on iPhone (Safari) or Android Web (Chrome)",
        description: "iPhone: Open Safari > tap Share > 'Add to Home Screen' > 'Add'. Android Web: Open Chrome > tap 3-dots (⋮) > 'Install App' / 'Add to Home screen'.",
        tip: "On iPhone, you must use Apple Safari. Chrome on iOS does not support the home screen shortcut.",
      },
      {
        title: "Enable Instant Push Notifications",
        description: "Tap 'Allow' when prompted for notification permissions so you receive instant payment confirmations, receipts, and repair updates.",
      },
    ],
  },
  {
    id: "tenant-profile-emergency",
    audience: "tenant",
    category: "tenant_onboarding",
    categoryLabel: "Getting Started & Profile",
    title: "Setting up your profile & emergency contacts",
    summary: "Keep your contact information updated and add trusted emergency contacts so building staff know who to call if you are ever unavailable.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["profile", "emergency", "contact", "phone", "email", "name", "account", "settings", "guard"],
    actionShortcut: {
      label: "Edit Profile & Contacts",
      href: "/tenant/profile",
    },
    relatedArticleIds: ["tenant-install-app", "tenant-sign-lease"],
    steps: [
      {
        title: "Open Your Profile Settings",
        description: "Tap on your avatar or name at the bottom of the left sidebar, or click on Settings > Profile in your navigation menu.",
      },
      {
        title: "Verify Your Mobile Number & Email",
        description: "Check that your primary contact number and email are accurate. This is where your monthly invoices and official receipts are automatically delivered.",
      },
      {
        title: "Add a Trusted Emergency Contact",
        description: "Enter the full name, relationship (e.g. Parent, Sibling, Spouse), and active phone number of your emergency contact.",
        tip: "In case of water leaks, lockouts, or medical emergencies while you are away, building security will immediately reach out to this person.",
      },
      {
        title: "Save Profile Changes",
        description: "Tap the black 'Save Changes' button at the bottom of the form. A green alert will confirm your profile is updated.",
      },
    ],
  },
  {
    id: "tenant-sign-lease",
    audience: "tenant",
    category: "tenant_leasing",
    categoryLabel: "Lease & E-Signatures",
    title: "How to review and sign your digital lease agreement",
    summary: "Follow this easy step-by-step guide to review your rental terms and draw your legally binding electronic signature using your finger or mouse.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["lease", "sign", "signature", "contract", "tenant", "rent", "agreement", "pdf", "draw"],
    actionShortcut: {
      label: "Open Lease Signing Page",
      href: "/tenant/sign-lease",
    },
    relatedArticleIds: ["tenant-download-lease-pdf", "tenant-pay-rent-online"],
    steps: [
      {
        title: "Find Your Pending Lease Banner",
        description: "When your landlord issues your contract, an alert banner appears on your Dashboard saying 'You have a pending lease to sign'. Click the black 'Sign Lease Now' button.",
      },
      {
        title: "Carefully Inspect Rent & Due Dates",
        description: "Look at the summary box: verify your monthly rental rate (e.g. ₱15,000), payment due day (e.g. 5th of every month), security deposit, and house rules.",
      },
      {
        title: "Draw Your Digital Signature",
        description: "Use your finger (on mobile or tablet) or your mouse cursor (on desktop) to draw your signature inside the white signature box.",
        tip: "If your hand slipped or it looks messy, just tap the gray 'Clear Signature' button to redraw it fresh!",
      },
      {
        title: "Check Agreement Box & Submit",
        description: "Click the checkbox that says 'I have read and agree to the lease terms and house rules', then tap 'Confirm & Sign Lease'. Your digital lease is immediately activated.",
      },
    ],
  },
  {
    id: "tenant-download-lease-pdf",
    audience: "tenant",
    category: "tenant_leasing",
    categoryLabel: "Lease & E-Signatures",
    title: "Where to find & download your signed lease contract (PDF)",
    summary: "Access your legally binding signed tenancy agreement anytime directly from your phone for bank requirements, proof of billing, or government IDs.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["lease", "pdf", "download", "contract", "copy", "legal", "proof of address", "agreement", "vault"],
    actionShortcut: {
      label: "View Active Leases",
      href: "/tenant/lease",
    },
    relatedArticleIds: ["tenant-sign-lease", "tenant-move-out-settlement"],
    steps: [
      {
        title: "Go to the Leases Tab",
        description: "Click on 'Leases' in the left navigation menu to view your active tenancy contract.",
      },
      {
        title: "View Lease Details & Active Status",
        description: "You will see your unit number, lease start date, expiration date, monthly rent, and the green 'Active' badge.",
      },
      {
        title: "Tap 'Download Signed Contract'",
        description: "Click the black 'Download PDF' button. Your browser will immediately download a complete, printable copy of the contract featuring both your and your landlord's digital signatures.",
        tip: "Keep this PDF on your phone or Google Drive—it serves as valid legal proof of residency for government IDs, bank accounts, and visa applications.",
      },
    ],
  },
  {
    id: "tenant-pay-rent-online",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Payments & Receipts",
    title: "How to pay rent and utility bills online (GCash, Maya, Cards)",
    summary: "Settle your monthly rent and submetered utilities in under 60 seconds using GCash QR, Maya, Bank Transfer, or Debit/Credit Cards.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["pay", "payment", "rent", "gcash", "maya", "card", "invoice", "receipt", "billing", "qr"],
    actionShortcut: {
      label: "Open Finance Hub",
      href: "/tenant/payments",
    },
    relatedArticleIds: ["tenant-upload-payment-proof", "tenant-download-receipt"],
    steps: [
      {
        title: "Navigate to Finance Hub",
        description: "Tap 'Finance Hub' in the sidebar to view your current bill, previous payments, and pending dues.",
      },
      {
        title: "Select the Bill & Tap 'Pay Now'",
        description: "Look for the red or orange card marked 'Unpaid' or 'Due Soon' and click the black 'Pay Now' button.",
      },
      {
        title: "Scan the Official GCash QR Code",
        description: "Open your GCash or Maya app on your phone, tap 'Scan QR', and scan the landlord's official QR code displayed on your screen.",
        tip: "Make sure you send the EXACT amount indicated on your invoice (including centavos). Never send money to personal numbers that differ from the official QR screen.",
      },
      {
        title: "Save Your Payment Screenshot",
        description: "Immediately after sending money in GCash/Maya, take a clear screenshot of the 'Payment Successful' screen showing the 13-digit Reference Number.",
      },
    ],
  },
  {
    id: "tenant-upload-payment-proof",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Payments & Receipts",
    title: "Uploading payment proof & why your bill says 'Pending'",
    summary: "Learn exactly which screenshot to upload, how reference numbers are verified, and what to do if you upload the wrong receipt.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["proof", "screenshot", "receipt", "reference number", "pending", "verification", "gcash", "maya", "upload"],
    actionShortcut: {
      label: "Go to Payments",
      href: "/tenant/payments",
    },
    relatedArticleIds: ["tenant-pay-rent-online", "tenant-download-receipt"],
    steps: [
      {
        title: "Upload Your Payment Screenshot",
        description: "In the payment checkout window, tap 'Upload Receipt Image' and choose the clean screenshot you just took from your photo gallery.",
      },
      {
        title: "Type in the 13-Digit Reference Number",
        description: "Enter the exact Reference No. (e.g. 1002 9384 1234) printed on your GCash/Maya receipt into the Reference Number box.",
        tip: "Double-check the digits! An accurate reference number speeds up landlord verification from hours to just a few minutes.",
      },
      {
        title: "Tap 'Submit Payment Proof'",
        description: "Click the submit button. Your invoice status will immediately change from 'Unpaid' to an orange badge that says 'Pending Verification'.",
      },
      {
        title: "What 'Pending Verification' Means",
        description: "Don't worry! This means your payment proof has been successfully recorded and sent to the landlord for 1-click verification. Once verified, your status turns green 'Paid' and an Official Receipt is generated.",
      },
    ],
  },
  {
    id: "tenant-download-receipt",
    audience: "tenant",
    category: "tenant_payments",
    categoryLabel: "Payments & Receipts",
    title: "Downloading Official Receipts (OR) & payment history",
    summary: "View your lifetime payment ledger, verify zero remaining balances, and download official payment receipt vouchers.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["receipt", "official receipt", "or", "voucher", "history", "download", "ledger", "invoice", "tax"],
    actionShortcut: {
      label: "View Payment Ledger",
      href: "/tenant/payments",
    },
    relatedArticleIds: ["tenant-pay-rent-online", "tenant-upload-payment-proof"],
    steps: [
      {
        title: "Open Payment History",
        description: "In the Finance Hub, scroll down to the 'Payment History & Ledger' section.",
      },
      {
        title: "Find the Desired Month",
        description: "Locate the invoice month you want to view (marked with a green 'Paid' badge).",
      },
      {
        title: "Click 'Download Official Receipt'",
        description: "Click the printer or download icon next to the payment to save a high-resolution, itemized PDF receipt with your landlord's official sign-off.",
        tip: "These PDF receipts are tamper-proof and include date, time, reference number, and breakdown of rent versus electric/water charges.",
      },
    ],
  },
  {
    id: "tenant-utility-readings",
    audience: "tenant",
    category: "tenant_utilities",
    categoryLabel: "Utilities & Submeters",
    title: "Understanding your electricity (kWh) & water (m³) submeter bills",
    summary: "A simple guide to how submetered electricity and water are calculated, how to check your own meter, and tips to prevent surprise high bills.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["utilities", "electric", "water", "meter", "submeter", "consumption", "kwh", "cubic meter", "reading", "bill"],
    actionShortcut: {
      label: "View Facilities & Utilities",
      href: "/tenant/utilities",
    },
    relatedArticleIds: ["tenant-pay-rent-online", "tenant-submit-maintenance"],
    steps: [
      {
        title: "How the Math Works (Simple Formula)",
        description: "Your utility bill is simple: (New Meter Reading - Old Meter Reading) × Rate = Total Charge. You only pay for what you actually consume in your unit!",
      },
      {
        title: "Where to Check Your Readings",
        description: "Go to 'Facilities' or 'Utilities' in the left menu. You will see your exact start reading, end reading, and total units consumed (kWh for electricity, m³ for water).",
      },
      {
        title: "How to Verify Your Meter Dial",
        description: "Your physical submeter is usually located near your unit doorway or in the floor utility closet. You can compare the number on the dial with the numbers on your screen.",
        tip: "To keep electricity bills low: set your air conditioner to 24°C-25°C instead of 16°C, clean the AC filter monthly, and check that bathroom faucets/bidet sprayers are completely closed without dripping.",
      },
    ],
  },
  {
    id: "tenant-submit-maintenance",
    audience: "tenant",
    category: "tenant_maintenance",
    categoryLabel: "Maintenance & Repairs",
    title: "How to report a broken item & file a repair request",
    summary: "Step-by-step guide to reporting plumbing leaks, electrical problems, or broken appliances with clear photos for fast technician dispatch.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["maintenance", "repair", "plumbing", "leak", "electric", "ac", "ticket", "photo", "handyman", "broken"],
    actionShortcut: {
      label: "New Maintenance Ticket",
      href: "/tenant/maintenance",
    },
    relatedArticleIds: ["tenant-track-repair", "tenant-direct-messaging"],
    steps: [
      {
        title: "Open Maintenance & Tap '+ New Request'",
        description: "Click 'Maintenance' in the left sidebar and tap the black '+ New Request' button.",
      },
      {
        title: "Select Category & Urgency",
        description: "Pick the category (Plumbing, Electrical, Aircon/Appliances, or Structural). Choose the urgency: select 'Emergency' ONLY for active flooding or sparking wires, otherwise choose 'Normal' or 'High'.",
      },
      {
        title: "Take 2 Clear Photos",
        description: "Take one wide photo showing the whole fixture/room, and one close-up photo showing the exact crack, leak, or damage.",
        tip: "Good lighting and clear photos allow the handyman to purchase the exact replacement parts before arriving, saving you hours of waiting!",
      },
      {
        title: "Describe What Happened & Submit",
        description: "Write a brief explanation (e.g. 'Bathroom sink pipe started dripping under the cabinet yesterday') and click 'Submit Request'.",
      },
    ],
  },
  {
    id: "tenant-track-repair",
    audience: "tenant",
    category: "tenant_maintenance",
    categoryLabel: "Maintenance & Repairs",
    title: "Tracking your repair request & rating the handyman",
    summary: "Understand what ticket statuses mean, how to coordinate technician access to your room, and how to rate the finished repair.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["repair", "status", "technician", "handyman", "tracking", "resolved", "rate", "feedback", "rating"],
    actionShortcut: {
      label: "Track Repair Requests",
      href: "/tenant/maintenance",
    },
    relatedArticleIds: ["tenant-submit-maintenance", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Understanding Status Badges",
        description: "• Yellow 'Pending' = Management received your request and is reviewing it. • Blue 'In Progress' = A technician is assigned and scheduled. • Green 'Resolved' = The repair work has been completed.",
      },
      {
        title: "Coordinating Handyman Arrival",
        description: "When the technician is dispatched, you will receive a notification. Ensure someone is in the unit to grant access, or coordinate with the building guard.",
      },
      {
        title: "Confirming the Fix & Rating Service",
        description: "Once the work is done, test the fixture (turn on the tap, test the light). Click 'Confirm Resolved' in your app and leave a star rating to help maintain building quality.",
        tip: "If the issue is still leaking or broken, do not mark it resolved! Leave a note in the ticket comments asking the technician to re-inspect.",
      },
    ],
  },
  {
    id: "tenant-building-map",
    audience: "tenant",
    category: "tenant_community",
    categoryLabel: "Community & Building Map",
    title: "Using the interactive building map & finding amenities",
    summary: "Explore your building floor plan to easily locate your unit, emergency fire exit staircases, trash chutes, mailboxes, and parking.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["map", "unit map", "floor plan", "fire exit", "trash chute", "amenities", "gym", "pool", "parking", "stairs"],
    actionShortcut: {
      label: "Open Unit Map",
      href: "/tenant/unit-map",
    },
    relatedArticleIds: ["tenant-community-rules", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Open Unit Map in Sidebar",
        description: "Click 'Unit Map' in the navigation menu to launch the visual building layout.",
      },
      {
        title: "Switch Floors & Explore Rooms",
        description: "Use the floor selector at the top (e.g. 2nd Floor, 3rd Floor) to view color-coded units and common areas.",
      },
      {
        title: "Locate Critical Safety Facilities",
        description: "Look for the red fire exit markers on your floor plan to know the nearest staircase from your door. Also locate the nearest fire extinguisher, electrical room, and waste disposal area.",
        tip: "Take a few minutes on your first week to physically walk the fire exit path shown on the map so you are prepared in any power outage or emergency.",
      },
    ],
  },
  {
    id: "tenant-community-rules",
    audience: "tenant",
    category: "tenant_community",
    categoryLabel: "Community & Building Map",
    title: "Building notices, garbage schedule & quiet hours",
    summary: "Stay up-to-date with essential building rules, quiet hour guidelines, trash segregation schedules, and community announcements.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["community", "rules", "quiet hours", "garbage", "trash", "notice", "visitors", "noise", "announcements", "pool", "gym"],
    actionShortcut: {
      label: "Open Community Hub",
      href: "/tenant/community",
    },
    relatedArticleIds: ["tenant-building-map", "tenant-direct-messaging"],
    steps: [
      {
        title: "Check Pinned Announcements Daily",
        description: "Go to 'Community Hub' to check important advisories regarding elevator maintenance, scheduled water tank cleanings, or holiday desk hours.",
      },
      {
        title: "Observe Quiet Hours (10:00 PM – 7:00 AM)",
        description: "To ensure everyone gets restful sleep, keep television volumes, loud music, and hallway conversations low during designated quiet hours.",
      },
      {
        title: "Follow Trash Disposal & Segregation Rules",
        description: "Separate biodegradable (food waste) from non-biodegradable (plastic, paper, cans). Tie trash bags securely before placing them in the designated floor trash bin or chute.",
        tip: "Never leave trash bags outside your door in the common hallway—this causes odors and violates building sanitation rules.",
      },
    ],
  },
  {
    id: "tenant-direct-messaging",
    audience: "tenant",
    category: "tenant_messaging",
    categoryLabel: "Direct Messaging",
    title: "How to message property management & landlords directly",
    summary: "Communicate directly with building management, ask general questions, send document attachments, and check office response hours.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["messages", "chat", "landlord", "admin", "contact", "support", "inquiry", "attachment", "conversation"],
    actionShortcut: {
      label: "Open Messages",
      href: "/tenant/messages",
    },
    relatedArticleIds: ["tenant-community-rules", "tenant-emergency-hotlines"],
    steps: [
      {
        title: "Open Messages in Navigation",
        description: "Tap 'Messages' in the left menu to view your direct chat thread with property management.",
      },
      {
        title: "Type Your Question or Inquiry",
        description: "Type your message clearly in the text box. If you have questions about move-in passes, visitor permits, or billing inquiries, type them here.",
      },
      {
        title: "Attach Photos or PDFs if Needed",
        description: "Click the paperclip icon next to the message box to attach screenshots, guest ID photos, or payment slips.",
        tip: "Management typical reply hours are 8:00 AM to 6:00 PM Monday through Saturday. For urgent middle-of-the-night emergencies like burst pipes or fire, call the building emergency hotline immediately.",
      },
    ],
  },
  {
    id: "tenant-move-out-settlement",
    audience: "tenant",
    category: "tenant_moveout",
    categoryLabel: "Move-Out & Deposits",
    title: "Moving out: 30-day notice, cleaning checklist & deposit refund",
    summary: "Everything you need to know about submitting your move-out notice, passing walkthrough inspections, and receiving your security deposit refund.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["move out", "vacate", "deposit", "inspection", "refund", "checklist", "keys", "settlement", "clearance"],
    actionShortcut: {
      label: "View Move-Out Guide",
      href: "/tenant/lease",
    },
    relatedArticleIds: ["tenant-sign-lease", "tenant-download-lease-pdf"],
    steps: [
      {
        title: "Submit 30-Day Advance Notice",
        description: "Under standard lease agreements, submit your notice of intent to vacate at least 30 days before your intended departure date via the tenant portal or direct message.",
      },
      {
        title: "Complete the Move-Out Cleaning Checklist",
        description: "Remove all personal belongings and trash. Deep clean the refrigerator, stove, bathroom tiles, and patch any small nail holes in the walls.",
      },
      {
        title: "Conduct the Walkthrough Inspection",
        description: "On your move-out day, walk through the room with building staff. Final electric and water submeter readings are recorded, and all door keys/RFID access cards are returned.",
      },
      {
        title: "Receive Itemized Settlement & Deposit Refund",
        description: "Management will generate a transparent Move-Out Settlement deducting only outstanding final utility bills. Your remaining security deposit balance will be sent via bank transfer or GCash within 15 to 30 days.",
      },
    ],
  },
  {
    id: "tenant-emergency-hotlines",
    audience: "tenant",
    category: "tenant_safety",
    categoryLabel: "Safety & Emergencies",
    title: "Emergency safety guide: Power outages, water leaks & fire safety",
    summary: "Crucial safety instructions on what to do immediately during power outages, pipe bursts, smoke alarms, and who to call 24/7.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["emergency", "fire", "water leak", "blackout", "power outage", "safety", "hotline", "breaker", "valve", "guard"],
    actionShortcut: {
      label: "Emergency Contacts",
      href: "/tenant/dashboard",
    },
    relatedArticleIds: ["tenant-building-map", "tenant-submit-maintenance"],
    steps: [
      {
        title: "What to Do If Water Is Flooding (Burst Pipe)",
        description: "Immediately locate the unit main water shutoff valve (usually under the bathroom sink or behind the toilet) and turn it CLOCKWISE to shut off water. Then file an Emergency maintenance request and call the guard.",
      },
      {
        title: "What to Do If Electricity Trips (Blackout in Your Unit Only)",
        description: "If other rooms have lights but yours is dark, find your circuit breaker panel (near the main entrance) and check if any switch flipped to 'OFF'. Flip it firmly back to 'ON'. If it sparks or trips again immediately, leave it off and submit an Electrical ticket.",
      },
      {
        title: "What to Do In Case of Fire or Smoke",
        description: "Do not panic. Pull the nearest hallway fire alarm. Exit your unit immediately, close your door behind you, and ALWAYS use the fire exit stairs. NEVER use the elevator during a fire emergency.",
        tip: "Save the Building Guardhouse and Local Emergency Hotlines (911, BFP, PNP) directly in your mobile phone contacts right now!",
      },
    ],
  },
  {
    id: "tenant-faqs-troubleshooting",
    audience: "tenant",
    category: "tenant_faqs",
    categoryLabel: "Resident FAQs & Help",
    title: "Resident FAQs & 'Help! Something's wrong' troubleshooting",
    summary: "Instant solutions for common mistakes: forgot password, app screen not updating, wrong payment screenshot, and visitor rules.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["faq", "help", "troubleshooting", "password", "blank screen", "refresh", "visitors", "pets", "wrong receipt", "mistake"],
    actionShortcut: {
      label: "Contact Management",
      href: "/tenant/messages",
    },
    relatedArticleIds: ["tenant-install-app", "tenant-pay-rent-online"],
    steps: [
      {
        title: "'I forgot my password or can't log in'",
        description: "Click 'Forgot Password' on the login screen, enter your registered email, and check your inbox (and Spam folder) for the 1-click password reset link.",
      },
      {
        title: "'The app is blank or won't load the latest update'",
        description: "On your phone or browser, perform a hard refresh: swipe down to refresh or clear your browser cache. If on iPhone/Android PWA, close the app completely from your multitasking screen and reopen it.",
      },
      {
        title: "'I accidentally uploaded the wrong payment screenshot'",
        description: "Don't panic! Simply go to Messages and send a chat message to your landlord with the correct GCash screenshot and reference number. They will manually attach and verify it.",
      },
      {
        title: "'Can I have overnight guests or pets?'",
        description: "Check the House Rules tab under Community Hub. Most buildings allow registered guests but require a visitor pass at the guardhouse after 10 PM. Pet policies vary by unit type.",
      },
    ],
  },

  // =========================================================================
  // 2. LANDLORD DEDICATED MANUAL (16 COMPREHENSIVE FOOLPROOF CHAPTERS)
  // =========================================================================
  {
    id: "property-setup-guide",
    audience: "landlord",
    category: "property_setup",
    categoryLabel: "Property & Unit Setup",
    title: "How to create properties, configure floors & rental units",
    summary: "Set up your property profile, configure total floor count, create units/rooms, and specify base monthly rental prices.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["property", "unit", "floor", "building", "rooms", "rent", "pricing", "setup"],
    actionShortcut: {
      label: "Manage Properties",
      href: "/landlord/properties",
    },
    relatedArticleIds: ["visual-unit-map-guide", "invite-tenants-magic-link"],
    steps: [
      {
        title: "Click '+ Add Property'",
        description: "Open Properties from the left sidebar and tap '+ Add Property' to input your building name, complete address, and total floors.",
      },
      {
        title: "Add Floors & Configure Rooms",
        description: "Select the property, open Floor Configuration, and generate units per floor (e.g. 101, 102, 201, 202).",
        tip: "Use standard 3-digit or 4-digit numbering so tenants easily locate their room on the visual map.",
      },
      {
        title: "Set Base Monthly Rent & Amenities",
        description: "Assign monthly rental rates, bedroom/bathroom counts, and unit amenities (e.g., Balcony, Aircon, Furnished) for each unit.",
      },
    ],
  },
  {
    id: "visual-unit-map-guide",
    audience: "landlord",
    category: "visual_unit_map",
    categoryLabel: "Interactive Unit Map",
    title: "Using the interactive 2D/3D floor plan & unit mapper",
    summary: "Monitor occupancy status in real-time, view color-coded units (Vacant, Occupied, Maintenance), and batch-rename room labels.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["map", "unit map", "visual builder", "floor plan", "3d", "occupancy", "vacant", "occupied"],
    actionShortcut: {
      label: "Open Interactive Map",
      href: "/landlord/unit-map",
    },
    relatedArticleIds: ["property-setup-guide", "invite-tenants-magic-link"],
    steps: [
      {
        title: "Explore Color-Coded Room Cards",
        description: "Green = Vacant & Ready to Lease, Blue = Occupied with Active Tenant, Orange = Maintenance / Repair in Progress.",
      },
      {
        title: "Click Any Unit for Quick Actions",
        description: "Click any room box to immediately view tenant profile, lease expiry countdown, latest utility readings, or invite a new tenant.",
      },
      {
        title: "Batch Renaming & Floor Rearrangement",
        description: "Use the visual builder toolbar to re-order rooms or batch-rename numbering schemes in one click.",
        tip: "Switch to the 3D Perspective view at the top right to get an architectural exterior visualization of your building.",
      },
    ],
  },
  {
    id: "invite-tenants-magic-link",
    audience: "landlord",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "How to onboard new residents using magic registration links",
    summary: "Connect new residents to their specific unit without manual account registration or complicated paperwork.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["invite", "tenant", "resident", "onboarding", "magic link", "register", "unit", "email"],
    actionShortcut: {
      label: "View Units & Occupancy",
      href: "/landlord/properties",
    },
    relatedArticleIds: ["digital-lease-creation", "setup-gcash-qr"],
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
        tip: "Magic links expire after 7 days for security. You can re-send or regenerate a fresh link anytime from the unit card.",
      },
    ],
  },
  {
    id: "digital-lease-creation",
    audience: "landlord",
    category: "tenants_leases",
    categoryLabel: "Tenants & Leases",
    title: "Creating digital lease agreements & collecting e-signatures",
    summary: "Issue legally binding digital contracts, set security deposit amounts, customize payment due days, and track signing progress.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["lease", "contract", "signature", "e-sign", "agreement", "deposit", "renewal", "terms"],
    actionShortcut: {
      label: "Manage Leases",
      href: "/landlord/leases",
    },
    relatedArticleIds: ["invite-tenants-magic-link", "setup-gcash-qr"],
    steps: [
      {
        title: "Draft New Lease Agreement",
        description: "Go to Leases > Click '+ Create Lease'. Choose the property, unit, tenant name, start date, and lease duration (e.g. 6 or 12 months).",
      },
      {
        title: "Set Financial Terms & Due Days",
        description: "Enter monthly rent (e.g. ₱15,000), security deposit, advance rental, and the payment due day (e.g. 5th of every month).",
      },
      {
        title: "Send for Tenant Signature",
        description: "Click 'Send for E-Signature'. The tenant receives an alert to draw their signature. Once signed, you countersign with 1-click to activate the contract.",
        tip: "Both parties can download the finalized, tamper-proof signed PDF anytime directly from the portal.",
      },
    ],
  },
  {
    id: "setup-gcash-qr",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to set up your GCash QR code and bank payment details",
    summary: "Upload your merchant or personal GCash QR code and configure your account number so residents can pay rent directly.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["gcash", "qr", "payment", "bank", "billing", "account", "rent", "money", "merchant"],
    actionShortcut: {
      label: "Finance Settings",
      tabId: "Finance",
    },
    relatedArticleIds: ["issue-monthly-invoices", "verify-payment-proofs"],
    steps: [
      {
        title: "Open Finance & Utilities Settings",
        description: "Navigate to Settings in the sidebar and select the 'Finance & Utilities' tab.",
      },
      {
        title: "Enter GCash Account Name & Number",
        description: "Type in your official GCash Registered Name (e.g. Juan Dela Cruz) and Registered Mobile Number (0917-XXX-XXXX).",
        tip: "Ensure the account name matches your GCash profile exactly to prevent resident confusion.",
      },
      {
        title: "Upload Clear QR Code Image",
        description: "Save your official QR code from your GCash app and upload the image. It will automatically attach to all tenant invoices!",
      },
    ],
  },
  {
    id: "issue-monthly-invoices",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "Automated rent invoicing & recording submeter utility readings",
    summary: "Understand automated 1st-of-the-month billing and how to record electricity (kWh) and water (m³) meter readings.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["invoice", "bill", "electricity", "water", "submeter", "kwh", "meter", "billing"],
    actionShortcut: {
      label: "Open Invoices Ledger",
      href: "/landlord/invoices",
    },
    relatedArticleIds: ["setup-gcash-qr", "verify-payment-proofs"],
    steps: [
      {
        title: "Automated 1st-of-the-Month Generation",
        description: "On the 1st of every month at midnight, iReside automatically creates rent invoices for all active leases.",
      },
      {
        title: "Record Submeter Utility Readings",
        description: "Go to Utilities > Enter current electric (kWh) and water (m³) numbers. The system automatically computes: (Current - Previous) × Tariff Rate.",
        tip: "Always enter readings before issuing the final monthly statement so electricity and water are combined into a single easy bill.",
      },
      {
        title: "Invoices Delivered Automatically",
        description: "Invoices are instantly pushed to tenant portals with your GCash QR code and payment due date countdown.",
      },
    ],
  },
  {
    id: "verify-payment-proofs",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "How to verify tenant GCash payments & issue official receipts",
    summary: "Review uploaded payment screenshots, match 13-digit reference numbers, and generate Official Receipts with 1 click.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["verify", "payment", "proof", "receipt", "official receipt", "gcash", "reference number", "ledger"],
    actionShortcut: {
      label: "Review Payments",
      href: "/landlord/invoices",
    },
    relatedArticleIds: ["issue-monthly-invoices", "partial-payments-guide"],
    steps: [
      {
        title: "Check 'Pending Verification' Invoices",
        description: "When a tenant uploads their GCash receipt, an alert badge appears on your Dashboard and Invoice Ledger.",
      },
      {
        title: "Inspect Screenshot & Match Reference No.",
        description: "Click 'Review Payment Proof' to view the screenshot. Verify that the 13-digit GCash Reference Number matches your bank/GCash SMS confirmation.",
        tip: "Never approve a payment without checking your actual GCash balance or transaction history.",
      },
      {
        title: "Click 'Approve & Issue Receipt'",
        description: "Click the green 'Approve Payment' button. The invoice turns green 'Paid' and an Official Receipt PDF is automatically delivered to the tenant.",
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
    relatedArticleIds: ["setup-gcash-qr", "verify-payment-proofs"],
    steps: [
      {
        title: "Open Finance & Utilities Settings",
        description: "Navigate to Settings > Finance & Utilities in your Landlord Dashboard.",
      },
      {
        title: "Toggle Partial Payments Option",
        description: "Switch the 'Allow Partial Payments' toggle to ON or OFF according to your property policy.",
      },
      {
        title: "Set Minimum Installment Threshold",
        description: "Specify minimum installment amounts (e.g. at least ₱2,000). When enabled, tenants can pay in flexible chunks while the balance tracks in real-time.",
      },
    ],
  },
  {
    id: "manage-maintenance-tickets",
    audience: "landlord",
    category: "maintenance_tickets",
    categoryLabel: "Maintenance & Repairs",
    title: "How to manage maintenance tickets and dispatch handymen",
    summary: "Track plumbing, electrical, and structural repair requests submitted by residents with photo attachments.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["maintenance", "repairs", "ticket", "plumbing", "electrician", "leak", "work order", "handyman"],
    actionShortcut: {
      label: "Open Maintenance Hub",
      href: "/landlord/maintenance",
    },
    relatedArticleIds: ["troubleshoot-notifications"],
    steps: [
      {
        title: "Review Incoming Repair Tickets",
        description: "When a resident reports an issue, inspect their uploaded damage photos and marked urgency (Emergency, High, Normal).",
      },
      {
        title: "Assign Status & Handyman Contractor",
        description: "Update status to 'In Progress', assign your trusted electrician/plumber, and coordinate unit access times with the tenant.",
      },
      {
        title: "Resolve & Log Expenses",
        description: "Once repaired, upload completion photo/receipt and mark as 'Resolved'. The repair cost can be automatically logged into your Expense Tracker.",
      },
    ],
  },
  {
    id: "generate-lobby-flyer",
    audience: "landlord",
    category: "marketing_flyers",
    categoryLabel: "Marketing & Posters",
    title: "Customizing and downloading printable lobby QR posters",
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
        description: "Open Flyer Studio from the sidebar or dashboard quick action printer icon.",
      },
      {
        title: "Click Directly on Text to Edit (WYSIWYG)",
        description: "Customize property contact numbers, building rules, office hours, and lobby Wi-Fi network credentials directly on the canvas.",
      },
      {
        title: "Upload Background Photo & Download 300 DPI",
        description: "Upload a photo of your building façade, adjust opacity, and click 'Download PNG' to print high-quality posters for your elevator and lobby notice board.",
      },
    ],
  },
  {
    id: "move-out-deposit-guide",
    audience: "landlord",
    category: "move_out_deposit",
    categoryLabel: "Move-Out Settlement",
    title: "Move-out inspections, damage deductions & deposit settlements",
    summary: "Conduct room walkthroughs, calculate final submeter bills, deduct repair damages, and process security deposit refunds.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["move out", "deposit", "inspection", "damage", "deduction", "settlement", "refund", "clearance"],
    actionShortcut: {
      label: "Move-Out Requests",
      href: "/landlord/move-out",
    },
    relatedArticleIds: ["digital-lease-creation", "manage-maintenance-tickets"],
    steps: [
      {
        title: "Review 30-Day Vacate Requests",
        description: "When a tenant submits notice, schedule the walkthrough inspection date and review their current billing balance.",
      },
      {
        title: "Perform Digital Room Inspection",
        description: "Walk through the room, verify final electric and water meter readings, check for wall damages or missing keys, and take inspection photos.",
      },
      {
        title: "Itemize Deductions & Issue Net Refund",
        description: "The settlement wizard computes: Security Deposit - (Final Utilities + Repair Costs) = Net Refund. Send remaining balance via bank transfer or GCash.",
      },
    ],
  },
  {
    id: "community-announcements",
    audience: "landlord",
    category: "property_setup",
    categoryLabel: "Property & Unit Setup",
    title: "Publishing building advisories & community notice board",
    summary: "Broadcast essential announcements (water interruption, fumigation, elevator maintenance) directly to all resident phones.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["community", "announcement", "advisory", "notice", "broadcast", "maintenance", "elevator"],
    actionShortcut: {
      label: "Open Community Hub",
      href: "/landlord/community",
    },
    relatedArticleIds: ["direct-messaging-landlord", "generate-lobby-flyer"],
    steps: [
      {
        title: "Go to Community Hub",
        description: "Click 'Community' in the left menu and tap '+ Post Announcement'.",
      },
      {
        title: "Compose Title, Category & Details",
        description: "Select advisory category (Scheduled Maintenance, Water Interruption, Building Event) and pin urgent notices to the top.",
      },
      {
        title: "Broadcast to Residents",
        description: "Click 'Publish'. All active residents immediately receive a push notification and in-app banner advisory.",
      },
    ],
  },
  {
    id: "direct-messaging-landlord",
    audience: "landlord",
    category: "property_setup",
    categoryLabel: "Property & Unit Setup",
    title: "Communicating with residents via direct messaging & attachments",
    summary: "Manage unified tenant chat threads, share documents/images, track unread inquiries, and maintain professional records.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["messages", "chat", "inquiries", "residents", "communication", "attachments", "support"],
    actionShortcut: {
      label: "Open Messages",
      href: "/landlord/messages",
    },
    relatedArticleIds: ["community-announcements", "manage-maintenance-tickets"],
    steps: [
      {
        title: "Access Centralized Chat Hub",
        description: "Open 'Messages' in the sidebar to see all tenant conversations sorted by latest activity and unread status.",
      },
      {
        title: "Send Messages & Attach Files",
        description: "Respond to tenant questions, send invoice reminders, or attach PDF gate passes and lease documents directly in the thread.",
      },
      {
        title: "Maintain Archival Records",
        description: "All chat history is securely timestamped and archived, providing clear documentation for any tenancy disputes.",
      },
    ],
  },
  {
    id: "financial-reports-expenses",
    audience: "landlord",
    category: "billing_payments",
    categoryLabel: "GCash & Billing",
    title: "Tracking revenue, collection rates & logging property expenses",
    summary: "Monitor monthly gross income, occupancy collection rates, log maintenance expenses, and export financial summaries.",
    difficulty: "intermediate",
    readTime: "3 min",
    keywords: ["analytics", "finance", "revenue", "income", "expenses", "collection", "report", "accounting"],
    actionShortcut: {
      label: "View Analytics Hub",
      href: "/landlord/analytics",
    },
    relatedArticleIds: ["issue-monthly-invoices", "verify-payment-proofs"],
    steps: [
      {
        title: "Review Key Financial Metrics",
        description: "Check total monthly rental revenue, on-time collection percentage (e.g. 96%), and total outstanding balances on your Dashboard.",
      },
      {
        title: "Log Property Expenses",
        description: "Go to Invoices > Expenses and click '+ Record Expense' (plumbing parts, building insurance, janitorial supplies).",
      },
      {
        title: "Export Accounting Reports",
        description: "Generate monthly profit-and-loss summaries comparing gross rental revenue against operational maintenance costs.",
      },
    ],
  },
  {
    id: "install-mobile-app",
    audience: "landlord",
    category: "mobile_pwa",
    categoryLabel: "Mobile App & Portal",
    title: "Installing iReside for Landlords (Windows Desktop EXE, Android & iOS)",
    summary: "Download the native Windows 10/11 desktop installer, Android native APK, or add the portal directly to your iPhone.",
    difficulty: "beginner",
    readTime: "2 min",
    keywords: ["app", "download", "apk", "pwa", "install", "iphone", "ios", "android", "homescreen", "safari", "chrome", "windows", "desktop", "exe"],
    actionShortcut: {
      label: "View App Download Hub",
      href: "/download",
    },
    relatedArticleIds: ["generate-lobby-flyer", "setup-gcash-qr"],
    steps: [
      {
        title: "Windows Desktop Client (.exe)",
        description: "Go to /download on your PC and click 'Download for Windows (.exe)'. Install the desktop app for multi-monitor support and hardware-accelerated floor planning.",
      },
      {
        title: "Android Mobile App (.apk)",
        description: "On your Android device, tap 'Download for Android (.apk)', open the downloaded package, and tap 'Install'.",
        tip: "If prompted, enable 'Allow from this source' in your device settings to permit APK installation.",
      },
      {
        title: "iPhone & iPad (Apple Safari)",
        description: "Open Safari > tap Share > 'Add to Home Screen' > 'Add' to launch iReside like a native iOS app.",
      },
    ],
  },
  {
    id: "troubleshoot-notifications",
    audience: "landlord",
    category: "troubleshooting_faqs",
    categoryLabel: "Troubleshooting & FAQs",
    title: "Landlord FAQs, overdue collections & troubleshooting",
    summary: "Quick fixes for overdue rent reminders, disputed submeter readings, email delivery diagnostics, and password resets.",
    difficulty: "beginner",
    readTime: "3 min",
    keywords: ["troubleshooting", "faq", "email", "overdue", "reminders", "smtp", "password", "help"],
    actionShortcut: {
      label: "Technical Commissioning Doctor",
      href: "/setup/technical",
    },
    relatedArticleIds: ["setup-gcash-qr", "issue-monthly-invoices"],
    steps: [
      {
        title: "What to Do If a Tenant Has Overdue Rent",
        description: "Go to Invoices > Locate the overdue bill > Click 'Send Payment Reminder'. The tenant receives an automated SMS/email alert.",
      },
      {
        title: "Handling Disputed Submeter Readings",
        description: "Go to Utilities > Check previous reading history and upload a photo of the physical meter dial for transparent verification.",
      },
      {
        title: "Fixing Email Delivery (Gmail SMTP Diagnostic)",
        description: "If automatic invoice emails are not arriving, open /setup/technical to run the automated mailer commissioning test.",
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
  {
    id: "it-system-requirements-specs",
    audience: "it",
    category: "system_specifications",
    categoryLabel: "System Specs & Requirements",
    title: "System Requirements, Hardware/Software Specs & Prerequisites",
    summary: "Detailed hardware and software specifications for Desktop, Mobile, and Cloud hosting, along with prerequisite accounts before using the platform.",
    difficulty: "intermediate",
    readTime: "5 min",
    keywords: ["specifications", "hardware", "software", "requirements", "prerequisites", "browser", "mobile", "network", "client", "server"],
    actionShortcut: {
      label: "View Hardware Inventory",
      href: "/setup/technical",
    },
    relatedArticleIds: ["it-user-roles-access-matrix", "it-step-by-step-installation"],
    steps: [
      {
        title: "Client-Side Hardware Requirements",
        description: "Desktop/Laptop: Intel Core i3 / AMD Ryzen 3, 4GB RAM minimum (8GB recommended with WebGL GPU). Mobile: Quad-core 1.8GHz, 3GB RAM, Android 9.0+ or iOS 14.0+ with modern touchscreen.",
      },
      {
        title: "Client-Side Software & Browser Support",
        description: "Google Chrome v110+, Mozilla Firefox v115+, Microsoft Edge v110+, Apple Safari v15.4+, Samsung Internet v20+. JavaScript and WebGL must be enabled.",
      },
      {
        title: "Server & Cloud Infrastructure Specifications",
        description: "Vercel Serverless Edge Platform (1024MB-2048MB execution limit, Node.js 20+ runtime), Supabase Managed PostgreSQL 15 with connection pooling, and S3-compatible storage buckets.",
      },
      {
        title: "Requirements Before Installing or Using the System",
        description: "1. Landlord Prerequisites: Building room inventory, GCash Merchant QR image, physical submeter hardware (kWh and m³). 2. Tenant Prerequisites: Active personal email, mobile smartphone with camera, funded GCash account. 3. IT Prerequisites: GitHub repo access, Supabase admin project, Google SMTP App Password.",
      },
    ],
    contentMarkdown: `
### Complete Specifications Overview Table

| Environment | Minimum Specification | Recommended Specification |
|---|---|---|
| **Client Desktop** | Core i3 / Ryzen 3, 4GB RAM, 1366x768 | Core i5 / Apple Silicon M1+, 8GB RAM, 1080p Full HD |
| **Client Smartphone** | Quad-Core 1.8GHz, 3GB RAM, Android 9 / iOS 14 | Octa-Core 2.4GHz, 6GB RAM, Android 12+ / iOS 16+ |
| **Server / Cloud Host** | Vercel Edge Serverless, Node 20+, 1GB RAM | Supabase PostgreSQL 15, PgBouncer, 50GB NVMe SSD |
| **Network & Bandwidth** | 1.5 Mbps broadband/cellular, < 150ms latency | 5 Mbps+ Fiber/5G, TLS 1.3 HTTPS, WSS WebSocket |
`,
  },
  {
    id: "it-user-roles-access-matrix",
    audience: "it",
    category: "user_roles_access",
    categoryLabel: "User Types & RBAC Matrix",
    title: "User Types, Role Capabilities & Role-Based Access Control (RBAC) Matrix",
    summary: "Exhaustive permissions matrix defining capabilities for Landlords, Tenants, System Administrators, and Applicants across all platform modules.",
    difficulty: "intermediate",
    readTime: "6 min",
    keywords: ["roles", "rbac", "permissions", "access control", "landlord", "tenant", "admin", "applicant", "security"],
    relatedArticleIds: ["it-system-requirements-specs", "it-database-schema"],
    steps: [
      {
        title: "Landlord / Property Manager Role",
        description: "Full governance over real estate assets: creates properties, configures units, sends onboarding magic links, issues leases, verifies GCash payments, logs utility submeters, and dispatches repair work orders.",
      },
      {
        title: "Tenant / Resident Role",
        description: "Restricted to their leased unit: signs lease contracts with digital e-signatures, pays monthly rent via GCash, uploads payment proof screenshots, submits maintenance requests with photos, chats with landlord, and queries iRis AI.",
      },
      {
        title: "System Administrator / IT Role",
        description: "Platform infrastructure guardian: manages environment variables, oversees database schema migrations via source-of-truth-db.sql, monitors automated crons, and executes disaster recovery.",
      },
      {
        title: "Applicant / Public Guest Role",
        description: "Browses public vacancy catalogs, explores floorplans, submits rental screening applications with proof of income, and tracks application review status.",
      },
    ],
    contentMarkdown: `
### Access Control Matrix (Feature-by-Feature)

| Module / System Capability | Administrator | Landlord | Tenant | Applicant | Public Guest |
|---|:---:|:---:|:---:|:---:|:---:|
| **Database Schema & Serverless Crons** | **FULL** | NONE | NONE | NONE | NONE |
| **Property & Unit Creation / Editing** | READ | **FULL** | NONE | NONE | NONE |
| **2D / 3D Interactive Map Customization** | READ | **FULL** | VIEW | NONE | NONE |
| **Tenant Onboarding & Magic Links** | NONE | **FULL** | NONE | NONE | NONE |
| **Digital Lease Generation & Signing** | NONE | **FULL** | SIGN | NONE | NONE |
| **Invoice Generation & Submeter Logging** | NONE | **FULL** | VIEW | NONE | NONE |
| **GCash Proof Upload & Verification** | NONE | VERIFY | UPLOAD | NONE | NONE |
| **Maintenance Work Orders & Dispatch** | NONE | MANAGE | SUBMIT | NONE | NONE |
| **Community Notice Board Broadcast** | NONE | POST | COMMENT | NONE | NONE |
| **iRis AI Property Concierge Chat** | **TEST** | **FULL** | **FULL** | FAQ | NONE |
| **Move-Out Settlement & Deposit Refund** | NONE | **FULL** | VIEW | NONE | NONE |
| **Vacant Unit Catalog Browsing** | VIEW | VIEW | VIEW | **FULL** | **FULL** |
`,
  },
  {
    id: "it-step-by-step-installation",
    audience: "it",
    category: "installation_guide",
    categoryLabel: "Step-by-Step Installation",
    title: "Complete System Installation, Database Setup & Cloud Deployment Guide",
    summary: "End-to-end installation runbook: Git repository cloning, npm package installation, .env.local configuration, Supabase migration via source-of-truth-db.sql, and Vercel cloud deployment.",
    difficulty: "advanced",
    readTime: "8 min",
    keywords: ["installation", "setup", "deploy", "git", "npm", "supabase", "database", "sql", "migration", "vercel", "env", "configuration"],
    actionShortcut: {
      label: "Open Technical Commissioning",
      href: "/setup/technical",
    },
    relatedArticleIds: ["it-environment-inventory", "it-database-schema", "it-system-turnover-defense"],
    steps: [
      {
        title: "Step 1: Clone Repository & Workspace Setup",
        description: "Run 'git clone https://github.com/Sedictt/iReside---Capstone.git iReside' and navigate into the folder: 'cd iReside'.",
        codeSnippet: `git clone https://github.com/Sedictt/iReside---Capstone.git iReside\ncd iReside`,
      },
      {
        title: "Step 2: Install Node.js Dependencies",
        description: "Install all required packages using npm with legacy peer dependency resolution: 'npm install --legacy-peer-deps'.",
        codeSnippet: `npm install --legacy-peer-deps`,
      },
      {
        title: "Step 3: Configure Environment Variables (.env.local)",
        description: "Create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and GROQ_API_KEY.",
      },
      {
        title: "Step 4: Execute Database Migration (source-of-truth-db.sql)",
        description: "Open Supabase Dashboard > SQL Editor > Paste and execute 'source-of-truth-db.sql'. This establishes all tables, enums, triggers, and Row-Level Security (RLS) policies.",
      },
      {
        title: "Step 5: Configure Supabase Storage Buckets",
        description: "In Supabase Storage, create 4 buckets: 'property-images' (Public: ON), 'billing' (Public: OFF), 'avatars' (Public: ON), and 'maintenance' (Public: OFF).",
      },
      {
        title: "Step 6: Launch Local Server & Verify",
        description: "Run 'npm run dev' to launch the Next.js server with expanded HTTP header buffer on http://localhost:3000.",
        codeSnippet: `npm run dev`,
      },
      {
        title: "Step 7: Cloud Deployment to Vercel",
        description: "Import repository into Vercel, populate all environment variables, confirm framework preset is Next.js, and deploy. Vercel crons in vercel.json will activate automatically.",
      },
    ],
  },
  {
    id: "it-system-turnover-defense",
    audience: "it",
    category: "turnover_handover",
    categoryLabel: "System Turnover & Defense",
    title: "Capstone Oral Defense & Client System Turnover Acceptance Protocol",
    summary: "Guidelines and checklist for defense presentation, printed user manual availability, client turnover acceptance sheet, and final commissioning verification.",
    difficulty: "intermediate",
    readTime: "4 min",
    keywords: ["defense", "turnover", "acceptance", "handover", "commissioning", "checklist", "oral defense", "capstone"],
    actionShortcut: {
      label: "Download Full Manual PDF",
      href: "/landlord/docs",
    },
    relatedArticleIds: ["it-step-by-step-installation", "it-user-roles-access-matrix"],
    steps: [
      {
        title: "Printed Copy Availability During Defense",
        description: "A hardcopy printed edition of the User Manual (generated via the in-app PDF Download button or printed from docs/USER_MANUAL.md) must be on the examination table during oral defense.",
      },
      {
        title: "System Turnover Requirements",
        description: "System handover to the property client requires: 1. Full source code repository access. 2. Supabase project ownership transfer. 3. Vercel deployment transfer. 4. Master administrative credentials. 5. Signed Acceptance Sheet.",
      },
      {
        title: "Live Defense Demonstration Runbook",
        description: "Demonstrate: 1. Landlord inviting tenant via magic link. 2. Tenant digital lease signing. 3. Invoicing with utility submeter calculation. 4. GCash payment upload and approval. 5. Maintenance ticket dispatch. 6. iRis AI resident query.",
      },
      {
        title: "Sign-Off Acceptance Protocol",
        description: "Both the student development team lead, academic panel chair, and client representative must execute the formal Handover Acceptance Table in docs/USER_MANUAL.md and docs/INSTALLATION_GUIDE.md.",
      },
    ],
  },
];

