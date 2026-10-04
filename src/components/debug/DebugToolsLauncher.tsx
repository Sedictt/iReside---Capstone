"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Terminal, X, RotateCcw, UserPlus, Trash2, Database, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DebugToolsLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Only render in development
  if (!isClient || process.env.NODE_ENV === "production") {
    return null;
  }

  const handleQuickRun = async (scriptId: string, scriptName: string, params: Record<string, string> = {}) => {
    setRunningAction(scriptId);
    toast.info(`Executing ${scriptName}...`);

    try {
      const res = await fetch("/api/debug/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, params }),
      });

      if (!res.ok) {
        throw new Error(`Failed to execute ${scriptName}`);
      }

      toast.success(`${scriptName} launched. Opening console...`);
      window.location.href = "/debug";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[999] select-none font-sans">
      {isOpen ? (
        <div className="w-80 rounded-2xl bg-card border border-border/80 p-4 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150 text-foreground">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center shrink-0">
                <Terminal className="size-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground">Developer Scripts</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-snug">
            Quickly trigger backend seeders, account resets, or open the full live streaming terminal.
          </p>

          {/* Quick Script Triggers */}
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={Boolean(runningAction)}
              onClick={() => handleQuickRun("reset-starter", "Reset Starter")}
              className="w-full h-8 px-2.5 rounded-xl text-xs font-medium bg-muted/50 hover:bg-muted text-foreground transition-colors flex items-center justify-between cursor-pointer border border-border/50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="size-3 text-violet-500" />
                <span>Reset Starter Landlord</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">1-click</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningAction)}
              onClick={() => handleQuickRun("create-claimable", "Create Claimable Landlord")}
              className="w-full h-8 px-2.5 rounded-xl text-xs font-medium bg-muted/50 hover:bg-muted text-foreground transition-colors flex items-center justify-between cursor-pointer border border-border/50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="size-3 text-emerald-500" />
                <span>Gen Claimable Account</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">1-click</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningAction)}
              onClick={() => handleQuickRun("db-inventory", "Database Inventory")}
              className="w-full h-8 px-2.5 rounded-xl text-xs font-medium bg-muted/50 hover:bg-muted text-foreground transition-colors flex items-center justify-between cursor-pointer border border-border/50 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Database className="size-3 text-amber-500" />
                <span>Database Inventory</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">1-click</span>
            </button>
          </div>

          {/* Full Console Link */}
          <div className="pt-1 border-t border-border/60">
            <Link
              href="/debug"
              onClick={() => setIsOpen(false)}
              className="w-full h-8.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Open Full Debug Console</span>
              <ExternalLink className="size-3.5" />
            </Link>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span>Shortcut:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono border border-border text-[9px]">
                Ctrl + Shift + D
              </kbd>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Open Debug Scripts Console (Ctrl+Shift+D)"
          className="h-8 px-2.5 rounded-full bg-zinc-900/90 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-700/80 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer backdrop-blur-md"
        >
          <Terminal className="size-3.5 text-violet-400 dark:text-violet-600" />
          <span>Debug Scripts</span>
        </button>
      )}
    </div>
  );
}
