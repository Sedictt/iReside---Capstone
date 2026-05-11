"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface MoveOutChecklistProps {
  requestId: string;
  initialData: any;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "keys", label: "Return all physical keys & fobs", completed: false },
  { id: "bills", label: "Clear all outstanding utility bills", completed: false },
  { id: "clean", label: "Clean unit and remove personal items", completed: false },
  { id: "address", label: "Confirm forwarding address", completed: false },
];

export function MoveOutChecklist({ requestId, initialData }: MoveOutChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (initialData && Array.isArray(initialData.items)) {
      return initialData.items;
    }
    return DEFAULT_CHECKLIST;
  });
  const [saving, setSaving] = useState(false);

  const toggleItem = async (id: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);

    setSaving(true);
    try {
      const res = await fetch("/api/tenant/lease/move-out/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist_data: { items: newItems } }),
      });

      if (!res.ok) throw new Error("Failed to save checklist");
    } catch (err) {
      toast.error("Failed to sync checklist");
      // Revert if failed? Or just let it be
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-6 border-t border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pre-Departure Checklist</h4>
          {saving && <Loader2 className="size-3 animate-spin text-primary/40" />}
        </div>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
          {items.filter(i => i.completed).length}/{items.length} Done
        </span>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            disabled={saving}
            className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
              item.completed 
                ? "bg-primary/5 border-primary/20 text-foreground" 
                : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "size-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
              item.completed ? "bg-primary border-primary text-white" : "border-primary/30"
            )}>
              {item.completed && <Check className="size-3" />}
            </div>
            <span className={cn("text-xs font-bold", item.completed && "line-through opacity-70")}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

