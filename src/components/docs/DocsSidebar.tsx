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
  Wrench
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
        title: "Account Setup", 
        href: "/docs/getting-started/account-setup", 
        icon: User,
        subItems: [
          { title: "1. Registration", href: "/docs/getting-started/account-setup#registration" },
          { title: "2. Choose Your Role", href: "/docs/getting-started/account-setup#roles" },
          { title: "3. Profile Completion", href: "/docs/getting-started/account-setup#profile" },
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
        icon: FileText,
        subItems: [
          { title: "1. Review Invitation", href: "/docs/tenant/applications#review" },
          { title: "2. Digital Submission", href: "/docs/tenant/applications#submission" },
          { title: "3. Real-time Tracking", href: "/docs/tenant/applications#tracking" },
        ]
      },
      { title: "Paying Rent", href: "/docs/tenant/payments", icon: CreditCard },
      { title: "Maintenance Requests", href: "/docs/tenant/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Landlord Guide",
    items: [
      { title: "Tenant Screening", href: "/docs/landlord/screening", icon: ShieldCheck },
      { title: "Financial Overview", href: "/docs/landlord/finance", icon: CreditCard },
      { title: "Document Management", href: "/docs/landlord/documents", icon: FileText },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "FAQ", href: "/docs/support/faq", icon: HelpCircle },
      { title: "Troubleshooting", href: "/docs/support/troubleshooting", icon: Settings },
      { title: "Contact Us", href: "/docs/support/contact", icon: User },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand the active section on mount and when pathname changes
  useEffect(() => {
    if (pathname && !expandedItems.includes(pathname)) {
      setExpandedItems((prev) => [...prev, pathname]);
    }
  }, [pathname]);

  const toggleItem = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((i) => i !== href) : [...prev, href]
    );
  };

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-divider bg-surface-0/50 backdrop-blur-md lg:block custom-scrollbar-premium">
      <div className="flex flex-col gap-8 p-6">
        {DOCS_NAV.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-disabled">
              {section.title}
            </h4>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon || ChevronRight;
                const isExpanded = expandedItems.includes(item.href) || isActive;

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

                      {item.subItems && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleItem(item.href);
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
