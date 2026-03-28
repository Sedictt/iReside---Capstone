import { useState } from "react";
import { FileText, ShieldCheck, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolAccessBarProps = {
  propertyId?: string | null;
  className?: string;
};

const tools = [
  {
    key: "templates",
    label: "Contract Templates",
    icon: FileText,
  },
  {
    key: "policies",
    label: "Property Policies",
    icon: ShieldCheck,
  },
  {
    key: "amenities",
    label: "Amenities",
    icon: Sparkles,
  },
] as const;

export function ToolAccessBar({ propertyId, className }: ToolAccessBarProps) {
  const disabled = !propertyId;
  const [activeTool, setActiveTool] = useState<(typeof tools)[number] | null>(null);
  const activeHref =
    activeTool && propertyId ? `/landlord/properties/${propertyId}/${activeTool.key}` : null;

  return (
    <>
      <div
        className={cn(
          "w-full max-w-5xl mx-auto mb-3 rounded-2xl border border-white/10 bg-[#131313]/90 backdrop-blur-xl px-3 py-2.5",
          className
        )}
      >
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.key}
                type="button"
                aria-disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  setActiveTool(tool);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap",
                  disabled
                    ? "border-white/10 bg-white/[0.03] text-neutral-600 cursor-not-allowed"
                    : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                )}
                title={disabled ? "Select a unit first to open tools" : `Open ${tool.label} modal`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTool && activeHref && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close tool modal backdrop"
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveTool(null)}
          />

          <div className="relative z-10 w-full max-w-6xl h-[85vh] rounded-3xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl">
            <div className="h-14 border-b border-white/10 px-4 flex items-center justify-between">
              <p className="text-sm font-black text-white uppercase tracking-wider">
                {activeTool.label}
              </p>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <iframe
              title={`${activeTool.label} modal content`}
              src={activeHref}
              className="w-full h-[calc(85vh-56px)] bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}

