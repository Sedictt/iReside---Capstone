"use client";

import React, { useState } from "react";
import { Plus, Trash2, AlertCircle, Tag } from "lucide-react";
import type { CustomItem } from "@/lib/services/iris";
import { formatPhpCurrency, roundCentavos } from "@/lib/services/iris/iris-invoice-flow";

export interface CustomItemsStepProps {
  items: CustomItem[];
  onAddItem: (item: CustomItem) => void;
  onRemoveItem: (id: string) => void;
  error?: string | null;
}

interface PresetCharge {
  label: string;
  category: "penalty" | "maintenance" | "other";
  defaultAmount?: number;
}

const PRESET_CHARGES: PresetCharge[] = [
  { label: "Late Payment Fee", category: "penalty", defaultAmount: 500 },
  { label: "Parking Slot", category: "other", defaultAmount: 1500 },
  { label: "Aircon Cleaning", category: "maintenance", defaultAmount: 1200 },
  { label: "Key Replacement", category: "penalty", defaultAmount: 300 },
  { label: "Trash Disposal Fee", category: "other", defaultAmount: 200 },
];

export function CustomItemsStep({
  items,
  onAddItem,
  onRemoveItem,
  error = null,
}: CustomItemsStepProps) {
  const [label, setLabel] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<"maintenance" | "penalty" | "other">("other");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Running total of custom charges
  const totalCustomAmount = items.reduce((sum, it) => roundCentavos(sum + (it.amount || 0)), 0);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, "");
    const parts = rawVal.split(".");
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : rawVal;

    // Check 9,999,999.99 max clamp
    if (parseFloat(sanitized) > 9999999.99) {
      return;
    }

    setAmountStr(sanitized);
    if (fieldError) setFieldError(null);
  };

  const handleAddCustomItem = () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setFieldError("Please enter an item description or choose a preset.");
      return;
    }
    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFieldError("Please enter a valid amount greater than ₱0.00.");
      return;
    }

    const newItem: CustomItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: trimmedLabel,
      amount: roundCentavos(parsedAmount),
      category,
    };

    onAddItem(newItem);
    setLabel("");
    setAmountStr("");
    setCategory("other");
    setFieldError(null);
  };

  const applyPreset = (preset: PresetCharge) => {
    setLabel(preset.label);
    setCategory(preset.category);
    if (preset.defaultAmount) {
      setAmountStr(preset.defaultAmount.toString());
    }
    if (fieldError) setFieldError(null);
  };

  const getCategoryBadgeClass = (cat: CustomItem["category"]) => {
    switch (cat) {
      case "penalty":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "maintenance":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "other":
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Extra Charges & Fees</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add one-time fees, parking fees, penalties, or maintenance adjustments if applicable.
        </p>
      </div>

      {/* Top Error Alert */}
      {(error || fieldError) && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to add item</p>
            <p className="mt-0.5">{error || fieldError}</p>
          </div>
        </div>
      )}

      {/* Quick Preset Chips */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Presets (1-Tap Fill)
        </span>
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESET_CHARGES.map((preset) => (
            <button
              type="button"
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 hover:border-primary/60 bg-muted/40 hover:bg-primary/5 text-xs font-medium text-foreground transition-all cursor-pointer min-h-[36px]"
            >
              <Tag className="size-3 text-muted-foreground" />
              <span>{preset.label}</span>
              {preset.defaultAmount && (
                <span className="font-mono text-muted-foreground tabular-nums">
                  ({formatPhpCurrency(preset.defaultAmount)})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Item Input Box */}
      <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Add Custom Line Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Item Description */}
          <div className="sm:col-span-6">
            <label htmlFor="custom-item-label" className="block text-xs font-medium text-muted-foreground mb-1">
              Description (max 50 chars)
            </label>
            <input
              id="custom-item-label"
              type="text"
              maxLength={50}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              placeholder="e.g. Parking slot #4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Category */}
          <div className="sm:col-span-3">
            <label htmlFor="custom-item-category" className="block text-xs font-medium text-muted-foreground mb-1">
              Category
            </label>
            <select
              id="custom-item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-border/80 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            >
              <option value="other">Other</option>
              <option value="penalty">Penalty / Late Fee</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Amount */}
          <div className="sm:col-span-3">
            <label htmlFor="custom-item-amount" className="block text-xs font-medium text-muted-foreground mb-1">
              Amount (₱)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground text-sm font-mono">
                ₱
              </span>
              <input
                id="custom-item-amount"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-border/80 bg-background text-sm font-mono tabular-nums text-right text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleAddCustomItem}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all cursor-pointer shadow-xs"
          >
            <Plus className="size-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Added Items List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Added Extra Charges ({items.length})</h3>

        {items.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
            <p className="text-sm font-medium text-muted-foreground">
              No additional charges added.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              You can proceed directly if this invoice only covers base rent and utilities.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/50">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 gap-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <span className="font-medium text-foreground truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-mono font-bold text-foreground tabular-nums text-right">
                    {formatPhpCurrency(item.amount)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Running Total Row */}
            <div className="p-4 bg-muted/30 flex items-center justify-between font-semibold">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Total Extra Charges
              </span>
              <span className="font-mono text-base font-bold text-foreground tabular-nums text-right">
                {formatPhpCurrency(totalCustomAmount)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
