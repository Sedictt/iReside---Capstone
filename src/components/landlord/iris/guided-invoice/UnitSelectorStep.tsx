"use client";

import React, { useState, useMemo } from "react";
import { Search, Home, User, CheckCircle2, AlertCircle } from "lucide-react";
import type { ActiveLeaseSummary } from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris/iris-invoice-flow";

export interface UnitSelectorStepProps {
  leases: ActiveLeaseSummary[];
  selectedLeaseId: string | null;
  onSelectLease: (leaseId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function UnitSelectorStep({
  leases,
  selectedLeaseId,
  onSelectLease,
  loading = false,
  error = null,
}: UnitSelectorStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leases;
    return leases.filter((lease) => {
      const unit = (lease.unitName || "").toLowerCase();
      const tenant = (lease.tenantName || "").toLowerCase();
      const property = (lease.propertyName || "").toLowerCase();
      return unit.includes(q) || tenant.includes(q) || property.includes(q);
    });
  }, [leases, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Select Unit & Tenant</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose an occupied unit to generate this month&apos;s billing statement.
        </p>
      </div>

      {/* Error alert if any */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to proceed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Real-time Search Input */}
      <div className="relative">
        <label htmlFor="unit-search-input" className="sr-only">
          Search units or tenants
        </label>
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="size-4" />
        </div>
        <input
          id="unit-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search unit, tenant, or property..."
          maxLength={60}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/70 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-busy="true">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-border/50 bg-muted/30 animate-pulse space-y-3 min-h-[96px]"
            >
              <div className="h-5 w-24 bg-muted/60 rounded" />
              <div className="h-4 w-36 bg-muted/50 rounded" />
              <div className="h-4 w-20 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLeases.length === 0 && (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
          <Home className="size-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="font-medium text-foreground">
            {searchQuery ? "No units match your search." : "No active leases found."}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search query or clear the filter."
              : "Active rental agreements are required to generate automated invoices."}
          </p>
        </div>
      )}

      {/* Unit / Lease Cards */}
      {!loading && filteredLeases.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Occupied Units"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {filteredLeases.map((lease) => {
            const isSelected = selectedLeaseId === lease.id;
            return (
              <button
                type="button"
                key={lease.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectLease(lease.id)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all min-h-[104px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                    : "border-border/70 hover:border-primary/50 bg-card hover:bg-muted/30 shadow-xs"
                }`}
              >
                {/* Top row: Unit name & Selected checkmark */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Home className="size-4" />
                    </span>
                    <span className="font-semibold text-foreground truncate text-base">
                      Unit {lease.unitName}
                    </span>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                  ) : (
                    <div className="size-5 rounded-full border border-border/80 shrink-0" />
                  )}
                </div>

                {/* Tenant & Property info */}
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <User className="size-3.5 shrink-0" />
                    <span className="truncate">{lease.tenantName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 truncate pl-5">
                    {lease.propertyName}
                  </p>
                </div>

                {/* Bottom row: Monthly Rent (quantitative right alignment) */}
                <div className="mt-3 pt-2 border-t border-border/40 flex items-baseline justify-between w-full">
                  <span className="text-xs text-muted-foreground">Monthly Rent</span>
                  <span className="font-mono text-sm font-bold text-foreground tabular-nums text-right">
                    {formatPhpCurrency(lease.monthlyRent)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
