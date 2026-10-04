"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Terminal,
  RotateCcw,
  UserPlus,
  Trash2,
  Database,
  CheckCircle2,
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { DebugConsole } from "@/components/debug/DebugConsole";
import { DebugScriptCard } from "@/components/debug/DebugScriptCard";
import { DebugScriptDefinition, SCRIPT_REGISTRY } from "@/lib/debug/scripts-registry";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DebugToolsPage() {
  const [scripts, setScripts] = useState<DebugScriptDefinition[]>(() => Object.values(SCRIPT_REGISTRY));
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [runningScriptId, setRunningScriptId] = useState<string | null>(null);

  // Terminal state
  const [logs, setLogs] = useState<string>("");
  const [consoleStatus, setConsoleStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [consoleCommand, setConsoleCommand] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    // Optionally fetch dynamic registry from server
    fetch("/api/debug/scripts")
      .then((res) => res.json())
      .then((data) => {
        if (data.scripts) {
          setScripts(data.scripts);
        }
      })
      .catch(() => {});
  }, []);

  const handleRunScript = async (script: DebugScriptDefinition, params: Record<string, string>) => {
    setRunningScriptId(script.id);
    setConsoleStatus("running");
    setConsoleCommand(script.name);
    setExitCode(null);
    setDuration(null);
    setLogs((prev) => (prev ? prev + `\n\n` : "") + `>>> Running: ${script.name}...\n`);
    toast.info(`Executing ${script.name}...`);

    try {
      const res = await fetch("/api/debug/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.id, params }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}: Failed to start script`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable response stream available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          if (evt.startsWith("data: ")) {
            try {
              const data = JSON.parse(evt.slice(6));
              if (data.type === "stdout" || data.type === "stderr") {
                setLogs((prev) => prev + data.text);
              } else if (data.type === "start") {
                setLogs((prev) => prev + `$ ${data.command}\n\n`);
              } else if (data.type === "exit") {
                setExitCode(data.code);
                setDuration(data.duration);
                setConsoleStatus(data.code === 0 ? "success" : "error");
                setLogs(
                  (prev) =>
                    prev +
                    `\n[Process finished with exit code ${data.code} in ${Math.round(data.duration)}ms]\n`
                );
                if (data.code === 0) {
                  toast.success(`${script.name} completed successfully!`);
                } else {
                  toast.error(`${script.name} failed with exit code ${data.code}`);
                }
              } else if (data.type === "error") {
                setConsoleStatus("error");
                setLogs((prev) => prev + `\n[Process Error]: ${data.error}\n`);
                toast.error(`Error: ${data.error}`);
              }
            } catch (_) {}
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setConsoleStatus("error");
      setLogs((prev) => prev + `\n[Execution Failure]: ${msg}\n`);
      toast.error(msg);
    } finally {
      setRunningScriptId(null);
    }
  };

  const filteredScripts = scripts.filter((s) => {
    const matchesCat = activeCategory === "all" || s.category === activeCategory;
    const matchesQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.command.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const categories = [
    { id: "all", label: "All Scripts" },
    { id: "cleanup", label: "Purge & Cleanup" },
    { id: "accounts", label: "Accounts & Auth" },
    { id: "database", label: "Database & Seeds" },
    { id: "quality", label: "Quality & Testing" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/landlord/dashboard"
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-20" />
            <span className="text-muted-foreground text-xs">•</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-bold">
              <Terminal className="size-3" />
              <span>Debug Console</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden sm:inline-block">Development Exclusive Tools</span>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
          >
            Go to Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Page Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Developer Script Console</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              1-click runner for seed scripts, account generators, database diagnostics, and instant user purges.
            </p>
          </div>

          {/* Quick Presets / Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={Boolean(runningScriptId)}
              onClick={() => {
                const s = scripts.find((x) => x.id === "reset-starter");
                if (s) handleRunScript(s, {});
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 border border-border text-foreground transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="size-3 text-violet-500" />
              <span>Reset Starter</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningScriptId)}
              onClick={() => {
                const s = scripts.find((x) => x.id === "create-claimable");
                if (s) handleRunScript(s, {});
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 border border-border text-foreground transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="size-3 text-emerald-500" />
              <span>Gen Claimable</span>
            </button>

            <button
              type="button"
              disabled={Boolean(runningScriptId)}
              onClick={() => {
                const s = scripts.find((x) => x.id === "db-inventory");
                if (s) handleRunScript(s, {});
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 border border-border text-foreground transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Database className="size-3 text-amber-500" />
              <span>DB Audit</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                  activeCategory === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-card hover:bg-muted border-border/80 text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-xl text-xs bg-card border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Split Grid Layout: Left Cards, Right Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Script Cards Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredScripts.map((script) => (
                <DebugScriptCard
                  key={script.id}
                  script={script}
                  isRunning={runningScriptId === script.id}
                  onRun={handleRunScript}
                />
              ))}
            </div>

            {filteredScripts.length === 0 && (
              <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-2">
                <SlidersHorizontal className="size-6 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No scripts match your filter</p>
                <p className="text-xs text-muted-foreground">Try clearing your search query or selecting &quot;All Scripts&quot;.</p>
              </div>
            )}
          </div>

          {/* Live Terminal Console Column */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <DebugConsole
              logs={logs}
              status={consoleStatus}
              exitCode={exitCode}
              duration={duration}
              commandName={consoleCommand}
              onClear={() => {
                setLogs("");
                setConsoleStatus("idle");
                setConsoleCommand(null);
                setExitCode(null);
                setDuration(null);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
