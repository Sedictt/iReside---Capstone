"use client";

import React from "react";
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

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const DOCS_NAV: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs", icon: BookOpen },
      { title: "Account Setup", href: "/docs/getting-started/account-setup", icon: User },
      { title: "Quick Start", href: "/docs/getting-started/quick-start", icon: Settings },
    ],
  },
  {
    title: "Tenant Guide",
    items: [
      { title: "Submitting Applications", href: "/docs/tenant/applications", icon: FileText },
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

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 state-layer",
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
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
