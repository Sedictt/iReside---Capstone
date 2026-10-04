"use client";

import React, { useRef, useEffect, useState } from "react";
import { Terminal, Copy, Check, Trash2, ArrowDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebugConsoleProps {
  logs: string;
  status: "idle" | "running" | "success" | "error";
  exitCode: number | null;
  duration: number | null;
  commandName: string | null;
  onClear: () => void;
}

// Convert ANSI escape sequences to styled spans
function formatAnsi(text: string): React.ReactNode[] {
  const parts = text.split(/(\x1b\[[0-9;]*m)/);
  let currentClass = "";
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (part.startsWith("\x1b[")) {
      if (part === "\x1b[0m") {
        currentClass = "";
      } else if (part.includes("31")) {
        currentClass = "text-rose-400";
      } else if (part.includes("32")) {
        currentClass = "text-emerald-400";
      } else if (part.includes("33")) {
        currentClass = "text-amber-400";
      } else if (part.includes("36")) {
        currentClass = "text-cyan-400";
      } else if (part.includes("34") || part.includes("35")) {
        currentClass = "text-violet-400";
      } else if (part.includes("1m")) {
        currentClass += " font-bold";
      }
    } else if (part) {
      nodes.push(
        <span key={idx} className={currentClass || undefined}>
          {part}
        </span>
      );
    }
  });

  return nodes;
}

export function DebugConsole({
  logs,
  status,
  exitCode,
  duration,
  commandName,
  onClear,
}: DebugConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    if (!logs) return;
    // Strip ANSI escape codes for clean clipboard text
    const clean = logs.replace(/\x1b\[[0-9;]*m/g, "");
    void navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono shadow-xl overflow-hidden">
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80" />
            <span className="size-2.5 rounded-full bg-amber-500/80" />
            <span className="size-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 truncate">
            <Terminal className="size-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{commandName || "Terminal Console"}</span>
          </span>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-2">
          {status === "running" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <Loader2 className="size-3 animate-spin" />
              <span>RUNNING</span>
            </span>
          )}

          {status === "success" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="size-3" />
              <span>EXIT 0 {duration ? `(${Math.round(duration)}ms)` : ""}</span>
            </span>
          )}

          {status === "error" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertCircle className="size-3" />
              <span>EXIT {exitCode ?? 1}</span>
            </span>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!logs}
            title="Copy logs"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </button>

          {/* Auto-scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll((prev) => !prev)}
            title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              autoScroll
                ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/20"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80"
            )}
          >
            <ArrowDown className="size-3.5" />
          </button>

          {/* Clear Console */}
          <button
            type="button"
            onClick={onClear}
            disabled={!logs && status === "idle"}
            title="Clear terminal output"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto text-xs leading-relaxed select-text whitespace-pre-wrap break-all min-h-[320px] max-h-[640px]"
      >
        {logs ? (
          formatAnsi(logs)
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center select-none py-12">
            <Terminal className="size-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">Ready to run scripts.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Click any script card on the left to execute it and stream live output here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
