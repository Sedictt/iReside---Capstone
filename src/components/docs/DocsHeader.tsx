"use client";

import React from "react";
import Link from "next/link";
import { Search, Menu, X, Github, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface DocsHeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function DocsHeader({ onMenuToggle, isMenuOpen }: DocsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-divider bg-surface-0/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={onMenuToggle}
            className="flex items-center justify-center rounded-lg p-2 text-text-medium hover:bg-surface-2 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            <Logo className="h-8 w-auto" />
            <span className="hidden text-xl font-bold tracking-tight text-text-high sm:inline-block">
              iReside <span className="text-primary font-medium">Docs</span>
            </span>
          </Link>
          
          <nav className="hidden items-center gap-6 lg:flex">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-text-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link 
              href="/landlord" 
              className="text-sm font-medium text-text-medium transition-colors hover:text-primary"
            >
              Landlord Portal
            </Link>
            <Link 
              href="/tenant" 
              className="text-sm font-medium text-text-medium transition-colors hover:text-primary"
            >
              Tenant Portal
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="h-10 w-64 rounded-full border border-divider bg-surface-1 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-divider bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-text-disabled">
              ⌘K
            </div>
          </div>
          
          <div className="flex items-center gap-1 border-l border-divider pl-4">
            <ThemeToggle variant="sidebar" className="h-9 w-9" />
            <Button variant="ghost" size="icon" className="h-9 w-9 text-text-medium" asChild>
              <a href="https://github.com/ireside" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-text-medium hidden sm:flex">
              <ExternalLink className="h-5 w-5" />
            </Button>
            <div className="ml-2 hidden lg:block">
              <Button size="sm" className="bg-primary hover:bg-primary-dark text-white rounded-full px-5">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
