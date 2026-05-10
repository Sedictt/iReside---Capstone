"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  ChevronRight, 
  BookOpen, 
  User, 
  Settings, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  CreditCard,
  Wrench,
  Rocket,
  Home,
  ClipboardList,
  LayoutGrid,
  History,
  ArrowRightLeft
} from "lucide-react";

import { AnimatePresence, motion } from "framer-motion";

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  subItems?: { title: string; href: string }[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const DOCS_NAV: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { 
        title: "Introduction", 
        href: "/docs", 
        icon: BookOpen,
        subItems: [
          { title: "What is iReside?", href: "/docs#what-is-ireside" },
          { title: "Who is This For?", href: "/docs#who-is-this-for" },
          { title: "Platform Features", href: "/docs#features" },
          { title: "How it Works", href: "/docs#how-it-works" },
        ]
      },
      {
        title: "Core Features",
        href: "/docs/features",
        icon: Rocket,
        subItems: [
          { title: "Unit Map", href: "/docs/features#unit-map" },
          { title: "Document & Lease", href: "/docs/features#document-manager" },
          { title: "Financial Hub", href: "/docs/features#financial-hub" },
          { title: "Communication", href: "/docs/features#communication" },
          { title: "Maintenance", href: "/docs/features#maintenance" },
        ]
      },
      { 
        title: "Account Setup", 
        href: "/docs/getting-started/account-setup", 
        icon: User,
        subItems: [
          { title: "Getting Started as a Landlord", href: "/docs/getting-started/account-setup#roles" },
          { title: "1. Start Your Registration", href: "/docs/getting-started/account-setup#registration" },
          { title: "2. Verify Your Email", href: "/docs/getting-started/account-setup#email-verification" },
          { title: "3. Create a Strong Password", href: "/docs/getting-started/account-setup#password" },
          { title: "4. Complete Your Profile", href: "/docs/getting-started/account-setup#profile" },
          { title: "5. Add a Photo (Optional)", href: "/docs/getting-started/account-setup#photo" },
          { title: "6. Contact Information", href: "/docs/getting-started/account-setup#contact" },
          { title: "7. Notification Preferences", href: "/docs/getting-started/account-setup#notifications" },
          { title: "8. Security Settings", href: "/docs/getting-started/account-setup#security" },
          { title: "9. Review & Accept Terms", href: "/docs/getting-started/account-setup#terms" },
          { title: "10. Confirm and Complete", href: "/docs/getting-started/account-setup#confirmation" },
          { title: "What Happens Next", href: "/docs/getting-started/account-setup#next-steps" },
        ]
      },
      { 
        title: "Quick Start", 
        href: "/docs/getting-started/quick-start", 
        icon: Settings,
        subItems: [
          { title: "For Tenants", href: "/docs/getting-started/quick-start#tenants" },
          { title: "For Landlords", href: "/docs/getting-started/quick-start#landlords" },
        ]
      },
    ],
  },
  {
    title: "Tenant Guide",
    items: [
      { 
        title: "Submitting Applications", 
        href: "/docs/tenant/applications", 
        icon: ClipboardList,
        subItems: [
          { title: "Two Ways to Apply", href: "/docs/tenant/applications#two-ways-to-apply" },
          { title: "Before Applying", href: "/docs/tenant/applications#before-applying" },
          { title: "Online Process", href: "/docs/tenant/applications#method-1-online" },
          { title: "In-Person Process", href: "/docs/tenant/applications#method-2-factoface" },
          { title: "Required Info", href: "/docs/tenant/applications#what-information" },
          { title: "Documents", href: "/docs/tenant/applications#documents-explained" },
          { title: "Tips for Success", href: "/docs/tenant/applications#tips-for-success" },
        ]
      },
      { 
        title: "Paying Rent", 
        href: "/docs/tenant/payments", 
        icon: CreditCard,
        subItems: [
          { title: "1. GCash (E-Wallet)", href: "/docs/tenant/payments#gcash" },
          { title: "2. Cash (In-Person)", href: "/docs/tenant/payments#cash" },
          { title: "Verification Process", href: "/docs/tenant/payments#verification" },
          { title: "Partial Payments", href: "/docs/tenant/payments#partial-payments" },
          { title: "Audit Trail", href: "/docs/tenant/payments#audit-trail" },
          { title: "Security Reminders", href: "/docs/tenant/payments#security" },
        ]
      },
      { 
        title: "Maintenance Requests", 
        href: "/docs/tenant/maintenance", 
        icon: Wrench,
        subItems: [
          { title: "What is a Maintenance Request?", href: "/docs/tenant/maintenance#overview" },
          { title: "What NOT to Report", href: "/docs/tenant/maintenance#when-not-to-report" },
          { title: "Issue Types & Examples", href: "/docs/tenant/maintenance#issue-types" },
          { title: "Emergency Protocol", href: "/docs/tenant/maintenance#emergency" },
          { title: "Setting Priority Levels", href: "/docs/tenant/maintenance#step-6" },
          { title: "How to Submit (7 Steps)", href: "/docs/tenant/maintenance#how-to-submit" },
          { title: "Self-Repair Option", href: "/docs/tenant/maintenance#self-repair" },
          { title: "Tracking Status", href: "/docs/tenant/maintenance#status-tracking" },
          { title: "Communication & Messaging", href: "/docs/tenant/maintenance#communication" },
          { title: "Request History", href: "/docs/tenant/maintenance#request-history" },
          { title: "FAQ", href: "/docs/tenant/maintenance#faq" },
          { title: "Tips for Success", href: "/docs/tenant/maintenance#tips-for-success" },
        ]
      },
      { 
        title: "Lease & Documents", 
        href: "/docs/tenant/lease", 
        icon: FileText,
        subItems: [
          { title: "What is a Lease?", href: "/docs/tenant/lease#what-is-a-lease" },
          { title: "Accessing Your Documents", href: "/docs/tenant/lease#accessing-documents" },
          { title: "Lease Signing Process", href: "/docs/tenant/lease#lease-signing" },
          { title: "Document Types", href: "/docs/tenant/lease#document-types" },
          { title: "Lease Amendments", href: "/docs/tenant/lease#lease-amendments" },
          { title: "Security & Privacy", href: "/docs/tenant/lease#security" },
          { title: "Common Questions", href: "/docs/tenant/lease#common-questions" },
          { title: "Best Practices", href: "/docs/tenant/lease#best-practices" },
        ]
      },
      { 
        title: "Moving In & Out", 
        href: "/docs/tenant/moving", 
        icon: ArrowRightLeft,
        subItems: [
          { title: "Moving In", href: "/docs/tenant/moving#moving-in" },
          { title: "Moving Out", href: "/docs/tenant/moving#moving-out" },
          { title: "Common Questions", href: "/docs/tenant/moving#common-questions" },
          { title: "Best Practices", href: "/docs/tenant/moving#best-practices" },
        ]
      },
    ],
  },
  {
    title: "Landlord Guide",
    items: [
      { 
        title: "Property Management", 
        href: "/docs/landlord/properties", 
        icon: Home,
        subItems: [
          { title: "What is Property Management?", href: "/docs/landlord/properties#overview" },
          { title: "Adding a New Property", href: "/docs/landlord/properties#adding-properties" },
          { title: "Managing Units", href: "/docs/landlord/properties#managing-units" },
          { title: "Using the Unit Map", href: "/docs/landlord/properties#unit-map" },
          { title: "Unit Details", href: "/docs/landlord/properties#listing-details" },
          { title: "Renewal Settings", href: "/docs/landlord/properties#renewal-settings" },
          { title: "Property Settings", href: "/docs/landlord/properties#property-settings" },
          { title: "Monitoring Your Portfolio", href: "/docs/landlord/properties#monitoring" },
          { title: "Common Questions", href: "/docs/landlord/properties#common-questions" },
        ]
      },
      { 
        title: "Tenant Screening", 
        href: "/docs/landlord/screening", 
        icon: ShieldCheck,
        subItems: [
          { title: "What is Tenant Screening?", href: "/docs/landlord/screening#overview" },
          { title: "Receiving Applications", href: "/docs/landlord/screening#receiving-applications" },
          { title: "Reviewing Applications", href: "/docs/landlord/screening#reviewing-applications" },
          { title: "Document Verification", href: "/docs/landlord/screening#document-verification" },
          { title: "Communicating with Applicants", href: "/docs/landlord/screening#communicating" },
          { title: "Approving or Declining", href: "/docs/landlord/screening#approval-process" },
          { title: "Setting Screening Criteria", href: "/docs/landlord/screening#screening-criteria" },
          { title: "Common Questions", href: "/docs/landlord/screening#common-questions" },
        ]
      },
      { 
        title: "Financial Overview", 
        href: "/docs/landlord/finance", 
        icon: CreditCard,
        subItems: [
          { title: "Financial Management Overview", href: "/docs/landlord/finance#overview" },
          { title: "Managing Invoices", href: "/docs/landlord/finance#invoices" },
          { title: "Payment Methods", href: "/docs/landlord/finance#payment-methods" },
          { title: "Payment Reconciliation", href: "/docs/landlord/finance#payment-reconciliation" },
          { title: "Tracking Expenses", href: "/docs/landlord/finance#expenses" },
          { title: "Financial Reports and Analytics", href: "/docs/landlord/finance#financial-reports" },
          { title: "Common Questions", href: "/docs/landlord/finance#common-questions" },
        ]
      },
      { 
        title: "Maintenance Control", 
        href: "/docs/landlord/maintenance", 
        icon: Wrench,
        subItems: [
          { title: "Maintenance Management Overview", href: "/docs/landlord/maintenance#overview" },
          { title: "Receiving Maintenance Requests", href: "/docs/landlord/maintenance#receiving-requests" },
          { title: "Issue Categories", href: "/docs/landlord/maintenance#issue-categories" },
          { title: "Understanding Priority Levels", href: "/docs/landlord/maintenance#priority-levels" },
          { title: "Managing Requests", href: "/docs/landlord/maintenance#managing-requests" },
          { title: "Tracking Status Changes", href: "/docs/landlord/maintenance#tracking-status" },
          { title: "Maintenance History", href: "/docs/landlord/maintenance#maintenance-history" },
          { title: "Common Questions", href: "/docs/landlord/maintenance#common-questions" },
        ]
      },
      { 
        title: "Lease Management", 
        href: "/docs/landlord/documents", 
        icon: FileText,
        subItems: [
          { title: "What is Lease Management?", href: "/docs/landlord/documents#overview" },
          { title: "Lease Agreement Basics", href: "/docs/landlord/documents#lease-basics" },
          { title: "Creating a Lease", href: "/docs/landlord/documents#creating-leases" },
          { title: "Digital Signature Process", href: "/docs/landlord/documents#digital-signatures" },
          { title: "Lease Status Types", href: "/docs/landlord/documents#lease-status" },
          { title: "Secure Document Storage", href: "/docs/landlord/documents#document-storage" },
          { title: "Lease Amendments", href: "/docs/landlord/documents#lease-amendments" },
          { title: "Lease Renewals", href: "/docs/landlord/documents#renewals" },
          { title: "Common Questions", href: "/docs/landlord/documents#common-questions" },
        ]
      },
    ],
  },
  {
    title: "Support",
    items: [
      { 
        title: "FAQ", 
        href: "/docs/support/faq", 
        icon: HelpCircle,
        subItems: [
          { title: "General Questions", href: "/docs/support/faq#general" },
          { title: "Account Questions", href: "/docs/support/faq#account" },
          { title: "Payment Questions", href: "/docs/support/faq#payments" },
          { title: "Application Questions", href: "/docs/support/faq#applications" },
          { title: "Maintenance Questions", href: "/docs/support/faq#maintenance" },
          { title: "Lease and Document Questions", href: "/docs/support/faq#leases" },
          { title: "Questions for Landlords", href: "/docs/support/faq#landlord-questions" },
        ]
      },
      { 
        title: "Troubleshooting", 
        href: "/docs/support/troubleshooting", 
        icon: Settings,
        subItems: [
          { title: "Login and Access Issues", href: "/docs/support/troubleshooting#login-issues" },
          { title: "Payment Issues", href: "/docs/support/troubleshooting#payment-issues" },
          { title: "Document Issues", href: "/docs/support/troubleshooting#document-issues" },
          { title: "Notification Issues", href: "/docs/support/troubleshooting#notification-issues" },
          { title: "App Performance Issues", href: "/docs/support/troubleshooting#app-issues" },
          { title: "Maintenance Request Issues", href: "/docs/support/troubleshooting#maintenance-issues" },
          { title: "Data and Sync Issues", href: "/docs/support/troubleshooting#data-issues" },
          { title: "Still Need Help?", href: "/docs/support/troubleshooting#contact-support" },
        ]
      },
      { 
        title: "Contact Us", 
        href: "/docs/support/contact", 
        icon: User,
        subItems: [
          { title: "How to Contact Support", href: "/docs/support/contact#how-to-reach" },
          { title: "What to Include in Your Request", href: "/docs/support/contact#what-to-include" },
          { title: "Response Time Expectations", href: "/docs/support/contact#response-time" },
          { title: "What We Can Help With", href: "/docs/support/contact#types-of-help" },
          { title: "What We Cannot Help With", href: "/docs/support/contact#limitations" },
          { title: "Feedback and Suggestions", href: "/docs/support/contact#feedback" },
          { title: "Other Ways to Reach Us", href: "/docs/support/contact#contact-info" },
          { title: "Need to Escalate?", href: "/docs/support/contact#escalation" },
          { title: "Before You Contact Us", href: "/docs/support/contact#self-help" },
        ]
      },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [isManualCollapse, setIsManualCollapse] = useState(false);

  // Reset manual collapse when navigating to a new page
  useEffect(() => {
    setIsManualCollapse(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsManualCollapse((prev) => !prev);
  };

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-divider bg-surface-0/50 backdrop-blur-md lg:block custom-scrollbar-premium">
      <div className="flex flex-col gap-8 p-6">
        {DOCS_NAV.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-text-disabled">
              {section.title}
            </h4>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon || ChevronRight;
                const isExpanded = isActive && !isManualCollapse;

                return (
                  <div key={item.href} className="flex flex-col gap-1">
                    <div className="group relative flex items-center">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 state-layer",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-medium hover:text-text-high"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "text-text-disabled group-hover:text-text-medium"
                        )} />
                        {item.title}
                        {isActive && (
                          <div className="ml-auto mr-8 h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
                        )}
                      </Link>

                      {isActive && item.subItems && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCollapse();
                          }}
                          className={cn(
                            "absolute right-2 flex h-7 w-7 items-center justify-center rounded-md hover:bg-surface-2 transition-all",
                            isExpanded ? "rotate-90" : "rotate-0"
                          )}
                        >
                          <ChevronRight className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            isExpanded ? "text-primary" : "text-text-disabled"
                          )} />
                        </button>
                      )}
                    </div>

                    {/* Sub-items (Outline) */}
                    <AnimatePresence>
                      {isExpanded && item.subItems && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mb-2 ml-4 flex flex-col border-l border-divider pl-4 mt-1 gap-1">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className="py-1.5 text-xs font-medium text-text-disabled hover:text-primary transition-colors flex items-center gap-2 group/sub"
                              >
                                <div className="h-1 w-1 rounded-full bg-text-disabled group-hover/sub:bg-primary transition-colors" />
                                {subItem.title}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
