"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickSettlementResult, ActiveLeaseSummary } from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";

export interface InvoiceOption {
  id: string; // payment/invoice ID
  leaseId: string;
  tenantName: string;
  unitName: string;
  propertyName: string;
  balanceRemaining: number;
  totalAmount: number;
  dueDate?: string;
  invoiceNumber?: string;
}

export interface QuickSettlementCardProps {
  invoices?: InvoiceOption[];
  leases?: ActiveLeaseSummary[];
  preselectedInvoiceId?: string;
  preselectedLeaseId?: string;
  onSettlementSuccess?: (result: QuickSettlementResult) => void;
  onCancel?: () => void;
  className?: string;
}

export function QuickSettlementCard({
  invoices = [],
  leases = [],
  preselectedInvoiceId,
  preselectedLeaseId,
  onSettlementSuccess,
  onCancel,
  className,
}: QuickSettlementCardProps) {
  // Available invoices or synthetic invoice options from leases
  const selectableOptions: InvoiceOption[] = useMemo(() => {
    if (invoices.length > 0) return invoices;
    return leases
      .filter((l) => l.outstandingBalance > 0)
      .map((l) => ({
        id: l.id, // fallback to lease id if separate invoice not provided
        leaseId: l.id,
        tenantName: l.tenantName,
        unitName: l.unitName,
        propertyName: l.propertyName,
        balanceRemaining: l.outstandingBalance,
        totalAmount: l.outstandingBalance,
        dueDate: l.dueDate,
        invoiceNumber: `INV-${l.unitName}`,
      }));
  }, [invoices, leases]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(() => {
    if (preselectedInvoiceId) return preselectedInvoiceId;
    if (preselectedLeaseId) {
      const match = selectableOptions.find((o) => o.leaseId === preselectedLeaseId);
      if (match) return match.id;
    }
    return selectableOptions[0]?.id || "";
  });

  useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId);
    } else if (preselectedLeaseId) {
      const match = selectableOptions.find((o) => o.leaseId === preselectedLeaseId);
      if (match) setSelectedInvoiceId(match.id);
    } else if (!selectedInvoiceId && selectableOptions.length > 0) {
      setSelectedInvoiceId(selectableOptions[0].id);
    }
  }, [preselectedInvoiceId, preselectedLeaseId, selectableOptions, selectedInvoiceId]);

  const currentOption = useMemo(
    () => selectableOptions.find((o) => o.id === selectedInvoiceId),
    [selectableOptions, selectedInvoiceId]
  );

  const currentBalance = currentOption?.balanceRemaining || 0;

  // Form states
  const [amountStr, setAmountStr] = useState<string>("");
  const [preset, setPreset] = useState<"full" | "half" | "custom">("full");
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "in_person">("cash");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<QuickSettlementResult | null>(null);

  // Set default full balance on invoice change
  useEffect(() => {
    if (currentBalance > 0) {
      setAmountStr(currentBalance.toFixed(2));
      setPreset("full");
    } else {
      setAmountStr("");
    }
    setErrorMsg(null);
  }, [selectedInvoiceId, currentBalance]);

  // Handle Preset Clicks
  const handleSelectPreset = (p: "full" | "half" | "custom") => {
    setPreset(p);
    setErrorMsg(null);
    if (p === "full") {
      setAmountStr(currentBalance > 0 ? currentBalance.toFixed(2) : "");
    } else if (p === "half") {
      const half = Math.round((currentBalance / 2) * 100) / 100;
      setAmountStr(half > 0 ? half.toFixed(2) : "");
    } else {
      // custom: clear or keep current
    }
  };

  // Real-time currency sanitization
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = sanitized.split(".");
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += "." + parts.slice(1).join("").substring(0, 2);
    }

    if (formatted.length <= 10) {
      setAmountStr(formatted);
      setPreset("custom");
      setErrorMsg(null);
    }
  };

  const numericAmount = parseFloat(amountStr) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedInvoiceId) {
      setErrorMsg("Please select an invoice or active balance to settle.");
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg("Settlement amount must be greater than zero.");
      return;
    }

    if (numericAmount > currentBalance && currentBalance > 0) {
      setErrorMsg(
        `Amount (₱${numericAmount.toFixed(2)}) cannot exceed the balance of ₱${currentBalance.toFixed(2)}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/landlord/iris/payments/quick-settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: numericAmount,
          method,
          referenceNumber: referenceNumber.trim() || undefined,
          paymentDate,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record settlement.");
      }

      setResult(data);
      onSettlementSuccess?.(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error recording settlement.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success View
  if (result) {
    return (
      <div
        className={cn(
          "neumorphic-panel rounded-3xl p-6 sm:p-8 space-y-6 text-foreground",
          className
        )}
      >
        <div className="flex items-center gap-4 border-b border-border/40 pb-5">
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Payment Settled Successfully</h3>
            <p className="text-xs text-muted-foreground">
              Official receipt generated and tenant notified.
            </p>
          </div>
        </div>

        <div className="rounded-2xl neumorphic-inset p-5 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
              Receipt Number
            </span>
            <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              {result.receiptNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
              Amount Paid
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatPhpCurrency(result.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
              Remaining Balance
            </span>
            <span className="font-bold tabular-nums">
              {formatPhpCurrency(result.remainingBalance)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
              Status
            </span>
            <span className="font-sans capitalize font-bold text-foreground">
              {result.status === "completed" ? "Fully Paid" : "Partial Payment"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
              Payment Method
            </span>
            <span className="font-sans capitalize">
              {result.method.replace("_", " ")}
            </span>
          </div>
          {result.referenceNumber && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase font-sans text-[11px] font-semibold">
                Reference No.
              </span>
              <span>{result.referenceNumber}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setAmountStr("");
              setReferenceNumber("");
              setNote("");
            }}
            className="flex-1 min-h-[44px] rounded-xl neumorphic-extruded font-semibold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="size-4" />
            Record Another
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] px-6 rounded-xl neumorphic-primary font-semibold text-sm hover:opacity-90 active:scale-95 transition-all text-white"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn(
        "neumorphic-panel rounded-3xl p-6 sm:p-8 space-y-6 text-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Receipt className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Record Payment Settlement</h3>
            <p className="text-xs text-muted-foreground">
              Record cash, in-person, or direct bank transfer payment.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account / Invoice Selection */}
      <div className="space-y-2">
        <label
          htmlFor="invoice-select"
          className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          Select Resident / Unit
        </label>
        {selectableOptions.length === 0 ? (
          <div className="rounded-xl neumorphic-inset p-4 text-xs text-muted-foreground text-center">
            No pending balances found for active residents.
          </div>
        ) : (
          <select
            id="invoice-select"
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {selectableOptions.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-card text-foreground">
                {opt.tenantName} — Unit {opt.unitName} ({opt.propertyName}) — Outstanding: ₱
                {opt.balanceRemaining.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Balance Summary Display */}
      {currentOption && (
        <div className="rounded-2xl neumorphic-inset p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Total Balance Due:</span>
            <div className="text-base font-bold text-foreground tabular-nums">
              {formatPhpCurrency(currentBalance)}
            </div>
          </div>
          {currentOption.dueDate && (
            <div className="text-right">
              <span className="text-muted-foreground">Due Date:</span>
              <div className="font-semibold text-foreground">{currentOption.dueDate}</div>
            </div>
          )}
        </div>
      )}

      {/* Amount and Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="settlement-amount"
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Payment Amount (₱)
          </label>
          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset("full")}
              className={cn(
                "min-h-[32px] px-2.5 rounded-full text-xs font-bold transition-all",
                preset === "full"
                  ? "bg-primary text-white shadow-xs"
                  : "neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
            >
              Full Balance
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("half")}
              className={cn(
                "min-h-[32px] px-2.5 rounded-full text-xs font-bold transition-all",
                preset === "half"
                  ? "bg-primary text-white shadow-xs"
                  : "neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("custom")}
              className={cn(
                "min-h-[32px] px-2.5 rounded-full text-xs font-bold transition-all",
                preset === "custom"
                  ? "bg-primary text-white shadow-xs"
                  : "neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
            >
              Custom
            </button>
          </div>
        </div>

        <input
          id="settlement-amount"
          type="text"
          inputMode="decimal"
          maxLength={10}
          value={amountStr}
          onChange={handleAmountChange}
          placeholder="0.00"
          className="w-full min-h-[48px] rounded-xl neumorphic-inset px-4 text-base font-bold tabular-nums text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Method selector */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Settlement Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "cash", label: "Cash" },
              { key: "bank_transfer", label: "Bank Transfer" },
              { key: "in_person", label: "In-Person" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={cn(
                "min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                method === m.key
                  ? "neumorphic-primary text-white shadow-xs"
                  : "neumorphic-extruded text-muted-foreground hover:text-foreground"
              )}
            >
              {method === m.key && <Check className="size-3.5" />}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date & Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="payment-date"
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Payment Date
          </label>
          <input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="ref-number"
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Reference No. (Optional)
          </label>
          <input
            id="ref-number"
            type="text"
            maxLength={60}
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. BDO-98212938"
            className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Note textarea with character counter */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label
            htmlFor="settlement-note"
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            Note / Transaction Memo (Optional)
          </label>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {note.length} / 250
          </span>
        </div>
        <textarea
          id="settlement-note"
          maxLength={250}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Handed cash directly at property office..."
          className="w-full rounded-xl neumorphic-inset p-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-[44px] px-5 rounded-xl neumorphic-extruded text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || selectableOptions.length === 0}
          aria-busy={isSubmitting}
          className="flex-1 min-h-[48px] rounded-xl neumorphic-primary font-bold text-sm text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Recording Receipt...
            </>
          ) : (
            <>
              Issue Receipt & Settle
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
