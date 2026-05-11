"use client";

import React, { useState } from "react";
import { DocsHeader } from "./DocsHeader";
import { DocsSidebar, DOCS_NAV } from "./DocsSidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, m as motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Home, X } from "lucide-react";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const prevPathname = React.useRef(pathname);

  // Close sidebar when route changes on mobile
  if (pathname !== prevPathname.current) {
    prevPathname.current = pathname;
    setIsSidebarOpen(false);
  }

  // Breadcrumbs calculation
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
    return { title, href };
  });

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        isMenuOpen={isSidebarOpen} 
      />
      
      <div className="mx-auto flex max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <DocsSidebar />
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-0 p-6 lg:hidden"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xl font-bold text-text-high">Navigation</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 hover:bg-surface-2">
                    <span className="sr-only">Close menu</span>
                    <X className="size-5" />
                  </button>
                </div>
                <div className="h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar-premium">
                  {DOCS_NAV.map((section) => (
                    <div key={section.title} className="mb-8">
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-disabled">
                        {section.title}
                      </h4>
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive ? "bg-primary/10 text-primary" : "text-text-medium hover:bg-surface-2 hover:text-text-high"
                              )}
                            >
                              {item.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 lg:pl-64">
          <div className="mx-auto max-w-4xl py-8 lg:py-12">
            {/* Breadcrumbs */}
            <nav className="mb-8 flex items-center gap-2 text-sm text-text-disabled" aria-label="Breadcrumb">
              <Link href="/docs" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Home className="size-5" />
                <span>Docs</span>
              </Link>
              {breadcrumbs.slice(1).map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <ChevronRight className="size-3.5" />
                  <Link 
                    href={crumb.href}
                    className={cn(
                      "hover:text-primary transition-colors",
                      index === breadcrumbs.length - 2 ? "text-text-medium font-medium" : ""
                    )}
                  >
                    {crumb.title}
                  </Link>
                </React.Fragment>
              ))}
            </nav>

            <div className="animate-view-list">
              {children}
            </div>

            {/* Pagination & Feedback Footer would go here */}
          </div>
        </main>
      </div>
    </div>
  );
}
