"use client";

import React, { useState } from "react";
import { ArrowLeft, Send, AlertCircle, Calendar, FileText, CheckCircle2 } from "lucide-react";
import type { InvoiceBuildContext } from "@/lib/services/iris";
import {
  buildDraftInvoiceItems,
  formatPhpCurrency,
} from "@/lib/services/iris/iris-invoice-flow";

export interface InvoiceReviewCardProps {
  context: InvoiceBuildContext;
  onConfirm: (data: { dueDate: string; notes?: string }) => void;
  onBack: () => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function InvoiceReviewCard({
  context,
  onConfirm,
  onBack,
  onCancel,
  submitting = false,
  error = null,
}: InvoiceReviewCardProps) {
  const [dueDate, setDueDate] = useState<string>(context.dueDate || "");
  const [notes, setNotes] = useState<string>(context.notes || "");
  const [dateError, setDateError] = useState<string | null>(null);

  // Compute draft item breakdown
  const draft = buildDraftInvoiceItems(context);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      setDateError("Please select a payment due date.");
      return;
    }
    setDateError(null);
    onConfirm({
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Review & Issue Statement</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review itemized charges for <span className="font-semibold text-foreground">Unit {context.unitName}</span> (
          {context.tenantName}) before dispatching.
        </p>
      </div>

      {/* Top Error Alert if any */}
      {(error || dateError) && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Invoice submission error</p>
            <p className="mt-0.5">{error || dateError}</p>
          </div>
        </div>
      )}

      {/* Structured Neumorphic Review Card */}
      <div className="neumorphic-panel rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-6">
        {/* Invoice Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/60">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">
              Official Billing Statement
            </span>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              Unit {context.unitName} &bull; {context.propertyName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Resident: <span className="font-medium text-foreground">{context.tenantName}</span>
            </p>
          </div>
          <div className="sm:text-right">
            <span className="text-xs text-muted-foreground font-medium">Billing Period</span>
            <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
              {context.billingMonth}
            </p>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Itemized Charges
          </h4>
          <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/50 bg-background/50">
            {draft.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 sm:px-4 text-sm"
              >
                <div className="min-w-0 pr-4">
                  <span className="font-medium text-foreground block truncate">{item.label}</span>
                  {item.metadata?.details && (
                    <span className="text-xs text-muted-foreground block truncate mt-0.5">
                      {item.metadata.details}
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    {formatPhpCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}

            {/* Subtotal & Grand Total Row */}
            <div className="p-4 bg-muted/40 flex items-baseline justify-between border-t-2 border-border/70">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block">
                  Total Amount Due
                </span>
                <span className="text-xs text-muted-foreground/80 mt-0.5 block">
                  Philippine Pesos (PHP)
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  {formatPhpCurrency(draft.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls: Due Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
          {/* Due Date Selector */}
          <div>
            <label
              htmlFor="invoice-due-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1.5"
            >
              <Calendar className="size-3.5 text-muted-foreground" />
              Payment Due Date
            </label>
            <input
              id="invoice-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (dateError) setDateError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Standard 15-day grace period or per lease terms.
            </p>
          </div>

          {/* Landlord Memo / Note with Character Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="invoice-notes"
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <FileText className="size-3.5 text-muted-foreground" />
                Landlord Note (Optional)
              </label>
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {notes.length} / 250
              </span>
            </div>
            <textarea
              id="invoice-notes"
              maxLength={250}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please send GCash/bank transfer proof to chat once settled."
              className="w-full px-3.5 py-2 rounded-xl border border-border/80 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Wizard Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 hover:bg-muted/40 text-foreground font-semibold text-sm transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
          >
            <ArrowLeft className="size-4" />
            <span>Back</span>
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground font-semibold text-sm transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all cursor-pointer shadow-sm disabled:opacity-60"
        >
          {submitting ? (
            <>
              <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Issuing & Sending Invoice...</span>
            </>
          ) : (
            <>
              <Send className="size-4" />
              <span>Issue & Send Invoice</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
