"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  MessageSquare,
  Receipt,
  CreditCard,
  Phone,
  Mail,
  Home,
  Calendar,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveLeaseSummary } from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";

export interface TenantDirectoryCardProps {
  leases?: ActiveLeaseSummary[];
  onMessageResident?: (tenantId: string, tenantName: string) => void;
  onIssueBill?: (leaseId: string) => void;
  onRecordPayment?: (leaseId: string) => void;
  className?: string;
}

export function TenantDirectoryCard({
  leases = [],
  onMessageResident,
  onIssueBill,
  onRecordPayment,
  className,
}: TenantDirectoryCardProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLeases = useMemo(() => {
    if (!searchQuery.trim()) return leases;
    const q = searchQuery.trim().toLowerCase();
    return leases.filter((l) => {
      const nameMatch = l.tenantName.toLowerCase().includes(q);
      const unitMatch = l.unitName.toLowerCase().includes(q);
      const propMatch = l.propertyName.toLowerCase().includes(q);
      const phoneMatch = l.tenantPhone ? l.tenantPhone.toLowerCase().includes(q) : false;
      const emailMatch = l.tenantEmail ? l.tenantEmail.toLowerCase().includes(q) : false;
      return nameMatch || unitMatch || propMatch || phoneMatch || emailMatch;
    });
  }, [leases, searchQuery]);

  return (
    <div
      className={cn(
        "neumorphic-panel rounded-3xl p-6 sm:p-8 space-y-6 text-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Resident Directory</h3>
            <p className="text-xs text-muted-foreground">
              Instant contact info, lease status, and quick operations shortcuts.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-full">
          {leases.length} {leases.length === 1 ? "resident" : "residents"}
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          maxLength={60}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search resident name, unit number, or phone..."
          className="w-full min-h-[44px] rounded-xl neumorphic-inset pl-10 pr-9 text-xs text-foreground bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar-premium pr-1">
        {filteredLeases.length === 0 ? (
          <div className="rounded-2xl neumorphic-inset p-8 text-center space-y-1 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">No Residents Found</p>
            <p>
              {searchQuery
                ? `No active resident matches "${searchQuery}".`
                : "No active resident contracts available."}
            </p>
          </div>
        ) : (
          filteredLeases.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl neumorphic-inset p-4 space-y-3 transition-all hover:bg-surface-2/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{l.tenantName}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-foreground">Unit {l.unitName}</span>
                    <span>•</span>
                    <span>{l.propertyName}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-muted-foreground block">
                    Outstanding Balance
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums font-mono",
                      l.outstandingBalance > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {formatPhpCurrency(l.outstandingBalance)}
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/20">
                {l.tenantPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3 text-primary" />
                    <span>{l.tenantPhone}</span>
                  </span>
                )}
                {l.tenantEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3 text-primary" />
                    <span className="truncate max-w-[160px]">{l.tenantEmail}</span>
                  </span>
                )}
                {l.endDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3 text-primary" />
                    <span>Lease ends: {l.endDate}</span>
                  </span>
                )}
              </div>

              {/* Action Shortcuts */}
              <div className="flex flex-wrap gap-2 pt-1">
                {onMessageResident && (
                  <button
                    type="button"
                    onClick={() => onMessageResident(l.tenantId, l.tenantName)}
                    className="min-h-[44px] px-3.5 rounded-xl neumorphic-extruded text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 text-primary"
                  >
                    <MessageSquare className="size-3.5" />
                    Message
                  </button>
                )}

                {onIssueBill && (
                  <button
                    type="button"
                    onClick={() => onIssueBill(l.id)}
                    className="min-h-[44px] px-3.5 rounded-xl neumorphic-extruded text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Receipt className="size-3.5 text-blue-500" />
                    Issue Bill
                  </button>
                )}

                {onRecordPayment && (
                  <button
                    type="button"
                    onClick={() => onRecordPayment(l.id)}
                    className="min-h-[44px] px-3.5 rounded-xl neumorphic-extruded text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                  >
                    <CreditCard className="size-3.5" />
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
