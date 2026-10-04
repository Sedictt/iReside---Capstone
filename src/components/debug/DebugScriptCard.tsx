"use client";

import React, { useState } from "react";
import { Play, Loader2, AlertTriangle, Terminal, Sparkles, CheckCircle2 } from "lucide-react";
import { DebugScriptDefinition } from "@/lib/debug/scripts-registry";
import { cn } from "@/lib/utils";

interface DebugScriptCardProps {
  script: DebugScriptDefinition;
  isRunning: boolean;
  onRun: (script: DebugScriptDefinition, params: Record<string, string>) => void;
}

export function DebugScriptCard({ script, isRunning, onRun }: DebugScriptCardProps) {
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    script.inputs?.forEach((inp) => {
      if (inp.defaultValue) initial[inp.id] = inp.defaultValue;
    });
    return initial;
  });

  const [confirmDangerous, setConfirmDangerous] = useState(false);

  const handleInputChange = (id: string, val: string) => {
    setParams((prev) => ({ ...prev, [id]: val }));
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (script.dangerous && !confirmDangerous) {
      setConfirmDangerous(true);
      return;
    }
    setConfirmDangerous(false);
    onRun(script, params);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "cleanup":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "accounts":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "database":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "quality":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between gap-4 bg-card shadow-xs",
        script.dangerous
          ? "border-rose-500/30 hover:border-rose-500/50"
          : "border-border/80 hover:border-border hover:shadow-sm"
      )}
    >
      <div className="space-y-2.5">
        {/* Header with category and command */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              getCategoryBadge(script.category)
            )}
          >
            {script.category}
          </span>

          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]" title={script.command}>
            {script.runner}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
            {script.dangerous && <AlertTriangle className="size-3.5 text-rose-500 shrink-0" />}
            <span>{script.name}</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{script.description}</p>
        </div>

        {/* Command Preview Pill */}
        <div className="p-2 rounded-xl bg-muted/40 border border-border/60 font-mono text-[11px] text-muted-foreground truncate select-all">
          <code>{script.command}</code>
        </div>

        {/* Dynamic Inputs */}
        {script.inputs && script.inputs.length > 0 && (
          <form onSubmit={handleExecute} className="space-y-2 pt-1">
            {script.inputs.map((inp) => (
              <div key={inp.id} className="space-y-1">
                <label htmlFor={`${script.id}-${inp.id}`} className="text-[11px] font-semibold text-foreground">
                  {inp.label}
                  {inp.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
                <input
                  id={`${script.id}-${inp.id}`}
                  type={inp.type}
                  placeholder={inp.placeholder}
                  value={params[inp.id] || ""}
                  onChange={(e) => handleInputChange(inp.id, e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg text-xs bg-background border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            ))}
          </form>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
        {confirmDangerous ? (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmDangerous(false)}
              className="flex-1 h-8 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={(e) => handleExecute(e)}
              className="flex-1 h-8 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? <Loader2 className="size-3.5 animate-spin" /> : <span>Confirm Purge</span>}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isRunning}
            onClick={(e) => handleExecute(e)}
            className={cn(
              "w-full h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
              script.dangerous
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="size-3 fill-current" />
                <span>Run Script</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
