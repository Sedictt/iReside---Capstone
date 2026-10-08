"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Github, BookOpen } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";

const REPOSITORY_URL = "https://github.com/Sedictt/iReside---Capstone";

interface DocsHeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function DocsHeader({ onMenuToggle, isMenuOpen }: DocsHeaderProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [query, setQuery] = useState("");

  const portalHref = profile?.role === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/docs?q=${encodeURIComponent(trimmed)}` : "/docs");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-divider bg-surface-0/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex items-center justify-center rounded-lg p-2 text-text-medium hover:bg-surface-2 lg:hidden"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>

          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <Logo className="h-8 w-auto" />
            <span className="hidden text-xl font-black tracking-tight text-text-high sm:inline-block">
              iReside <span className="text-primary font-medium">Docs</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Documentation">
            <Link href="/docs/introduction" className="text-sm font-medium text-text-medium transition-colors hover:text-primary">
              Guides
            </Link>
            <Link href="/docs" className="text-sm font-medium text-text-medium transition-colors hover:text-primary">
              Interactive Manual
            </Link>
            <Link href="/docs/technical" className="text-sm font-medium text-text-medium transition-colors hover:text-primary">
              Technical
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <form onSubmit={submitSearch} role="search" className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-disabled" aria-hidden="true" />
            <input
              type="search"
              maxLength={60}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the manual…"
              aria-label="Search the manual"
              className="h-10 w-64 rounded-full border border-divider bg-surface-1 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
            />
          </form>

          <div className="flex items-center gap-1 border-l border-divider pl-4">
            <ThemeToggle variant="sidebar" className="size-9" />
            <Button variant="ghost" size="icon" className="size-9 text-text-medium" asChild>
              <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" aria-label="Source code on GitHub">
                <Github className="size-5" aria-hidden="true" />
              </a>
            </Button>
            <div className="ml-2 hidden lg:block">
              <Button size="sm" className="bg-primary hover:bg-primary-dark text-white rounded-full px-5" asChild>
                {user ? (
                  <Link href={portalHref}>
                    <BookOpen className="mr-1.5 size-4" aria-hidden="true" />
                    Open portal
                  </Link>
                ) : (
                  <Link href="/login">Sign in</Link>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
