"use client";

import React from "react";
import Link from "next/link";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface WizardShellProps {
  children: React.ReactNode;
  modePreference: "light" | "dark";
  onToggleMode: (mode: "light" | "dark") => void;
  isSystemLocked?: boolean;
  onLockedLogoClick?: () => void;
  className?: string;
}

export function WizardShell({
  children,
  modePreference,
  onToggleMode,
  isSystemLocked,
  onLockedLogoClick,
  className,
}: WizardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans transition-colors duration-200">
      {/* Top Header Navigation */}
      <header
        role="banner"
        className="sticky top-0 z-40 flex min-h-[64px] shrink-0 items-center justify-between bg-card/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 shadow-xs"
      >
        <div className="flex items-center gap-3">
          {isSystemLocked ? (
            <button
              type="button"
              onClick={onLockedLogoClick}
              aria-label="Setup must be completed first"
              className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0 focus-visible:ring-3 focus-visible:ring-primary focus-visible:outline-none rounded-lg cursor-not-allowed min-h-[48px] min-w-[48px]"
            >
              <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go to iReside home"
              className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0 focus-visible:ring-3 focus-visible:ring-primary focus-visible:outline-none rounded-lg min-h-[48px] min-w-[48px]"
            >
              <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
            </Link>
          )}
          <span className="text-muted-foreground/40 hidden sm:inline text-lg" aria-hidden="true">
            /
          </span>
          <span className="text-sm sm:text-base font-bold text-muted-foreground hidden sm:inline">
            Setup Wizard
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Light / Dark Mode Switch */}
          <button
            type="button"
            onClick={() => onToggleMode(modePreference === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${modePreference === "dark" ? "light" : "dark"} appearance mode`}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold bg-muted/60 border border-border/80 hover:bg-muted text-foreground transition-all flex items-center gap-2 active:scale-95 focus-visible:ring-3 focus-visible:ring-primary focus-visible:outline-none cursor-pointer shrink-0"
          >
            {modePreference === "dark" ? (
              <>
                <Sun className="size-4 text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="size-4 text-muted-foreground shrink-0" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Single-Column Content Area */}
      <main
        id="main-content"
        className={cn(
          "w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center gap-5 sm:gap-6",
          className
        )}
      >
        {children}
      </main>

      {/* Accessible Footer with Safe Spacing */}
      <footer className="w-full border-t border-border/40 py-4 text-center text-xs text-muted-foreground select-none bg-background/50">
        <p>© 2026 iReside Technologies. Secure property setup.</p>
      </footer>
    </div>
  );
}
