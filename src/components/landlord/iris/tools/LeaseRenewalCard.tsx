"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ArrowRight,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveLeaseSummary } from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";

export interface LeaseRenewalCardProps {
  expiringLeases?: ActiveLeaseSummary[];
  preselectedLeaseId?: string;
  onOfferSent?: (result: { success: boolean; message: string; leaseId: string }) => void;
  className?: string;
}

export function LeaseRenewalCard({
  expiringLeases = [],
  preselectedLeaseId,
  onOfferSent,
  className,
}: LeaseRenewalCardProps) {
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(() => {
    if (preselectedLeaseId) return preselectedLeaseId;
    return expiringLeases[0]?.id || "";
  });

  useEffect(() => {
    if (preselectedLeaseId) {
      setSelectedLeaseId(preselectedLeaseId);
    } else if (!selectedLeaseId && expiringLeases.length > 0) {
      setSelectedLeaseId(expiringLeases[0].id);
    }
  }, [preselectedLeaseId, expiringLeases, selectedLeaseId]);

  const selectedLease =
    expiringLeases.find((l) => l.id === selectedLeaseId) || expiringLeases[0];

  const [proposedRentStr, setProposedRentStr] = useState<string>("");
  const [termMonths, setTermMonths] = useState<number>(12);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize proposed rent with current monthly rent when lease changes
  useEffect(() => {
    if (selectedLease) {
      setProposedRentStr(selectedLease.monthlyRent.toFixed(2));
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [selectedLeaseId, selectedLease]);

  // Real-time decimal input sanitization
  const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^0-9.]/g, "");

    const parts = sanitized.split(".");
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += "." + parts.slice(1).join("").substring(0, 2);
    }

    if (formatted.length <= 10) {
      setProposedRentStr(formatted);
      setErrorMsg(null);
    }
  };

  const numericRent = parseFloat(proposedRentStr) || 0;

  // Calculate days remaining until expiry
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLease) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (numericRent <= 0) {
      setErrorMsg("Proposed monthly rent must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/landlord/iris/leases/renewal-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: selectedLease.id,
          proposedRent: numericRent,
          renewalTermMonths: termMonths,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send renewal offer.");
      }

      setSuccessMsg(
        `Renewal offer sent to ${selectedLease.tenantName} for Unit ${selectedLease.unitName}.`
      );
      onOfferSent?.(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error sending renewal offer.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Lease Expiry & Renewal Offers</h3>
            <p className="text-xs text-muted-foreground">
              Review leases expiring within 60 days and dispatch formal renewal proposals.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-full">
          {expiringLeases.length} expiring
        </span>
      </div>

      {expiringLeases.length === 0 ? (
        <div className="rounded-2xl neumorphic-inset p-8 text-center space-y-2">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-foreground">No Leases Expiring Soon</p>
          <p className="text-xs text-muted-foreground">
            All active residential leases have more than 60 days remaining on their term.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Lease Selector if multiple */}
          {expiringLeases.length > 1 && (
            <div className="space-y-1.5">
              <label
                htmlFor="lease-select"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Select Expiring Lease
              </label>
              <select
                id="lease-select"
                value={selectedLease?.id}
                onChange={(e) => {
                  setSelectedLeaseId(e.target.value);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full min-h-[44px] rounded-xl neumorphic-inset px-3 text-sm text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {expiringLeases.map((l) => (
                  <option key={l.id} value={l.id} className="bg-card text-foreground">
                    {l.tenantName} — Unit {l.unitName} (Ends {l.endDate}, {getDaysRemaining(l.endDate)}d left)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selected Lease Details Summary Card */}
          {selectedLease && (
            <div className="rounded-2xl neumorphic-inset p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {selectedLease.tenantName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Unit {selectedLease.unitName} • {selectedLease.propertyName}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Clock className="size-3" />
                    {getDaysRemaining(selectedLease.endDate)} Days Left
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Term ends: {selectedLease.endDate}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/30 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Current Monthly Rent:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatPhpCurrency(selectedLease.monthlyRent)}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Proposed Rent & Term Selection */}
          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <label
                htmlFor="proposed-rent"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Proposed Monthly Rent (₱)
              </label>
              <input
                id="proposed-rent"
                type="text"
                inputMode="decimal"
                maxLength={10}
                value={proposedRentStr}
                onChange={handleRentChange}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-xl neumorphic-inset px-4 text-base font-bold tabular-nums text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Term selector chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Renewal Term Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[6, 12, 24].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setTermMonths(term)}
                    className={cn(
                      "min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      termMonths === term
                        ? "neumorphic-primary text-white shadow-xs"
                        : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {termMonths === term && <Check className="size-3.5" />}
                    {term} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Custom message note */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="renewal-note"
                  className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Message to Resident (Optional)
                </label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {customMessage.length} / 250
                </span>
              </div>
              <textarea
                id="renewal-note"
                maxLength={250}
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. We would love to keep you as our resident. Rate fixed for next term..."
                className="w-full rounded-xl neumorphic-inset p-3 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !selectedLease}
              aria-busy={isSubmitting}
              className="w-full min-h-[48px] rounded-xl neumorphic-primary font-bold text-sm text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending Renewal Offer...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send Renewal Offer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
