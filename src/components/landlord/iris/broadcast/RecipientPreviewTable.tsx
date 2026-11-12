"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Eye, X, Check, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSafeAvatarBgColor } from "@/lib/constants";
import type { ActiveLeaseSummary } from "@/lib/services/iris/iris-operations.service";
import {
  type IrisTemplateKey,
  renderTemplate,
  type TemplateContext,
} from "@/lib/services/iris/iris-templates";
import { formatPhpCurrency } from "@/lib/services/iris/iris-invoice-flow";

export interface RecipientPreviewTableProps {
  recipients: ActiveLeaseSummary[];
  selectedLeaseIds: Set<string> | string[];
  onToggleSelect: (leaseId: string) => void;
  onToggleAll: (selected: boolean) => void;
  templateKey: IrisTemplateKey;
  customMessage?: string;
  maintenanceDate?: string;
  dueDate?: string;
  isLoading?: boolean;
}

export function RecipientPreviewTable({
  recipients,
  selectedLeaseIds,
  onToggleSelect,
  onToggleAll,
  templateKey,
  customMessage,
  maintenanceDate,
  dueDate,
  isLoading = false,
}: RecipientPreviewTableProps) {
  const [previewRecipient, setPreviewRecipient] = useState<ActiveLeaseSummary | null>(null);
  const masterCheckboxRef = useRef<HTMLInputElement | null>(null);

  const selectedSet = useMemo(() => {
    return selectedLeaseIds instanceof Set ? selectedLeaseIds : new Set(selectedLeaseIds);
  }, [selectedLeaseIds]);

  const totalCount = recipients.length;
  const selectedCount = recipients.filter((r) => selectedSet.has(r.id)).length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Compute preview message context for modal
  const previewMessage = useMemo(() => {
    if (!previewRecipient) return "";
    const ctx: TemplateContext = {
      tenant_name: previewRecipient.tenantName,
      unit: previewRecipient.unitName,
      property_name: previewRecipient.propertyName,
      amount: formatPhpCurrency(
        previewRecipient.outstandingBalance > 0
          ? previewRecipient.outstandingBalance
          : previewRecipient.monthlyRent
      ),
      due_date: previewRecipient.dueDate || dueDate || "the due date",
      days_overdue: String(previewRecipient.daysOverdue || 0),
      lease_end_date: previewRecipient.endDate || "end of lease",
      maintenance_date: maintenanceDate || "scheduled date",
      custom_message: customMessage || "",
    };
    return renderTemplate(templateKey, ctx);
  }, [previewRecipient, templateKey, customMessage, maintenanceDate, dueDate]);

  if (isLoading) {
    return (
      <div className="neumorphic-panel rounded-2xl p-8 border border-border/60 text-center animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mx-auto mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div
        className="neumorphic-panel rounded-2xl p-8 border border-border/60 text-center flex flex-col items-center justify-center gap-3"
        data-testid="recipient-empty-state"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-foreground">
          All Good! No residents currently match this filter.
        </h4>
        <p className="text-sm text-muted-foreground max-w-sm">
          No reminders or notices need to be sent for this group at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="neumorphic-panel rounded-2xl border border-border/60 overflow-hidden shadow-sm">
      {/* Table Header Summary Bar */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              ref={masterCheckboxRef}
              type="checkbox"
              aria-label="Select all recipients"
              checked={isAllSelected}
              onChange={(e) => onToggleAll(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer"
            />
            <span className="font-semibold text-foreground">Select All</span>
          </label>
        </div>
        <div className="tabular-nums" data-testid="selected-counter">
          <span className="font-semibold text-foreground">{selectedCount}</span> of{" "}
          <span className="font-semibold text-foreground">{totalCount}</span> selected
        </div>
      </div>

      {/* Recipient Rows */}
      <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
        {recipients.map((recipient) => {
          const isSelected = selectedSet.has(recipient.id);
          const initials =
            recipient.tenantName
              .split(" ")
              .filter(Boolean)
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "R";

          // Calculate contextual metric
          let metricLabel = "";
          let metricClass = "bg-muted text-muted-foreground border-border/40";

          if (recipient.outstandingBalance > 0 && recipient.daysOverdue > 0) {
            metricLabel = `${formatPhpCurrency(recipient.outstandingBalance)} • ${recipient.daysOverdue} days unpaid`;
            metricClass = "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-semibold";
          } else if (recipient.endDate) {
            const endDate = new Date(recipient.endDate);
            const now = new Date();
            const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (templateKey === "lease_renewal" || (daysUntilExpiry >= 0 && daysUntilExpiry <= 60)) {
              metricLabel = `${daysUntilExpiry} days left`;
              metricClass = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold";
            } else if (recipient.dueDate) {
              metricLabel = `Due ${recipient.dueDate}`;
              metricClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
            } else {
              metricLabel = `${formatPhpCurrency(recipient.monthlyRent)}/mo`;
            }
          } else if (recipient.dueDate) {
            metricLabel = `Due ${recipient.dueDate}`;
            metricClass = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
          } else {
            metricLabel = `${formatPhpCurrency(recipient.monthlyRent)}/mo`;
          }

          return (
            <div
              key={recipient.id}
              className={cn(
                "p-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors",
                isSelected && "bg-primary/5"
              )}
              data-testid={`recipient-row-${recipient.id}`}
            >
              {/* Left: Checkbox + Avatar + Name & Unit */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  aria-label={`Select ${recipient.tenantName}`}
                  checked={isSelected}
                  onChange={() => onToggleSelect(recipient.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-background cursor-pointer flex-shrink-0"
                />

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: getSafeAvatarBgColor() }}
                  aria-hidden="true"
                >
                  {initials}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {recipient.tenantName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    Unit {recipient.unitName} • {recipient.propertyName}
                  </div>
                </div>
              </div>

              {/* Right: Metric badge + Preview Button */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg border tabular-nums text-right",
                    metricClass
                  )}
                  data-testid={`metric-badge-${recipient.id}`}
                >
                  {metricLabel}
                </span>

                <button
                  type="button"
                  onClick={() => setPreviewRecipient(recipient)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted/70 text-foreground transition-colors shadow-2xs cursor-pointer"
                  data-testid={`preview-btn-${recipient.id}`}
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Preview Message</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Preview Message Dialog */}
      {previewRecipient && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewRecipient(null)}
        >
          <div
            className="neumorphic-panel rounded-3xl bg-background border border-border/80 p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            data-testid="preview-dialog"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 id="preview-dialog-title" className="text-base font-bold text-foreground">
                  Message Preview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Recipient: <span className="font-semibold text-foreground">{previewRecipient.tenantName}</span> (Unit {previewRecipient.unitName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRecipient(null)}
                aria-label="Close preview"
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-sm leading-relaxed text-foreground whitespace-pre-wrap select-text mb-5">
              {previewMessage}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewRecipient(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
