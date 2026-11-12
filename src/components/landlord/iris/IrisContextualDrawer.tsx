"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Bot,
  Receipt,
  CreditCard,
  Wrench,
  User,
  Zap,
  Phone,
  Mail,
  Home,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
  LandlordOperationsContext,
} from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";
import { QuickSettlementCard, MaintenanceTicketCard } from "./tools";
import { IrisInvoiceWizard } from "./guided-invoice";

export type DrawerTab = "quick_pay" | "issue_bill" | "repairs" | "details";

export interface IrisContextualDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenantId?: string;
  activeLeaseId?: string;
  activeUnitName?: string;
  activeTenantName?: string;
  className?: string;
}

export function IrisContextualDrawer({
  isOpen,
  onClose,
  activeTenantId,
  activeLeaseId,
  activeUnitName,
  activeTenantName,
  className,
}: IrisContextualDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("quick_pay");
  const [context, setContext] = useState<LandlordOperationsContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch landlord context when drawer opens
  const loadContext = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/landlord/iris/context");
      const json = await res.json();
      if (res.ok && json.data) {
        setContext(json.data);
      }
    } catch (err) {
      console.warn("Failed to load operations context in drawer:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [isOpen, loadContext]);

  // Find matching lease for this active tenant or leaseId
  const matchingLease = useMemo(() => {
    if (!context?.activeLeases) return undefined;
    if (activeLeaseId) {
      return context.activeLeases.find((l) => l.id === activeLeaseId);
    }
    if (activeTenantId) {
      return context.activeLeases.find((l) => l.tenantId === activeTenantId);
    }
    if (activeUnitName) {
      return context.activeLeases.find(
        (l) => l.unitName.toLowerCase() === activeUnitName.toLowerCase()
      );
    }
    return undefined;
  }, [context, activeLeaseId, activeTenantId, activeUnitName]);

  // Find matching maintenance tickets for this unit
  const unitTickets = useMemo(() => {
    if (!context?.openTickets) return [];
    if (matchingLease) {
      return context.openTickets.filter(
        (t) => t.unitId === matchingLease.unitId || t.unitName === matchingLease.unitName
      );
    }
    if (activeUnitName) {
      return context.openTickets.filter(
        (t) => t.unitName.toLowerCase() === activeUnitName.toLowerCase()
      );
    }
    return context.openTickets;
  }, [context, matchingLease, activeUnitName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container: bottom sheet on <640px, slide-over from right on >=640px */}
      <div
        className={cn(
          "fixed bg-card shadow-2xl transition-all duration-300 flex flex-col",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 max-h-[90vh] rounded-t-[2.5rem] border-t border-border",
          // Desktop: slide over from right
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:max-h-none sm:rounded-l-[2.5rem] sm:rounded-t-none sm:border-l sm:border-t-0",
          className
        )}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: "#8B5CF6" }}
            >
              <Bot className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">
                  {activeTenantName || matchingLease?.tenantName || "Resident Tools"}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Unit {activeUnitName || matchingLease?.unitName || "Unit"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                iRis Unit Assistant & Quick Operations
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            title="Close Drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 p-3 border-b border-border/40 bg-surface-1/40 overflow-x-auto custom-scrollbar-premium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("quick_pay")}
            className={cn(
              "min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeTab === "quick_pay"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="size-3.5" />
            Record Cash
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("issue_bill")}
            className={cn(
              "min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeTab === "issue_bill"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-3.5" />
            Issue Bill
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("repairs")}
            className={cn(
              "min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeTab === "repairs"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <Wrench className="size-3.5" />
            Repairs ({unitTickets.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={cn(
              "min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeTab === "details"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="size-3.5" />
            Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-4 sm:p-5 space-y-4">
          {isLoading && !context ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading unit data...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: RECORD CASH / QUICK PAY */}
              {activeTab === "quick_pay" && (
                <div className="space-y-4">
                  {matchingLease && (
                    <div className="rounded-2xl neumorphic-inset p-4 space-y-1 text-xs">
                      <span className="text-muted-foreground block text-[11px]">
                        Current Unpaid Balance
                      </span>
                      <div className="text-xl font-bold tabular-nums font-mono text-rose-600 dark:text-rose-400">
                        {formatPhpCurrency(matchingLease.outstandingBalance)}
                      </div>
                      <span className="text-[11px] text-muted-foreground block">
                        Monthly Rent: {formatPhpCurrency(matchingLease.monthlyRent)}
                      </span>
                    </div>
                  )}

                  <QuickSettlementCard
                    leases={matchingLease ? [matchingLease] : context?.activeLeases}
                    preselectedLeaseId={matchingLease?.id || activeLeaseId}
                    onSettlementSuccess={() => {
                      loadContext();
                    }}
                  />
                </div>
              )}

              {/* TAB 2: ISSUE BILL */}
              {activeTab === "issue_bill" && (
                <div className="space-y-4">
                  <div className="rounded-2xl neumorphic-panel p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-foreground">
                      Issue Bill for Unit {activeUnitName || matchingLease?.unitName}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Record water and electricity meter readings and create a formal invoice.
                    </p>
                  </div>

                  <IrisInvoiceWizard
                    initialLeases={
                      matchingLease ? [matchingLease] : context?.activeLeases ?? []
                    }
                    onSuccess={() => {
                      loadContext();
                      setActiveTab("details");
                    }}
                  />
                </div>
              )}

              {/* TAB 3: UNIT REPAIRS */}
              {activeTab === "repairs" && (
                <div className="space-y-4">
                  <MaintenanceTicketCard
                    tickets={unitTickets}
                    onTicketUpdated={() => {
                      loadContext();
                    }}
                  />
                </div>
              )}

              {/* TAB 4: TENANT DETAILS */}
              {activeTab === "details" && (
                <div className="rounded-2xl neumorphic-panel p-5 space-y-4 text-xs">
                  <div className="flex items-center gap-3 border-b border-border/30 pb-3">
                    <div className="size-10 rounded-full neumorphic-inset flex items-center justify-center font-bold text-primary">
                      {(activeTenantName || matchingLease?.tenantName || "T").charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {activeTenantName || matchingLease?.tenantName || "Resident"}
                      </h4>
                      <span className="text-muted-foreground">
                        Unit {activeUnitName || matchingLease?.unitName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {matchingLease?.tenantPhone && (
                      <div className="flex justify-between items-center py-1 border-b border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Phone className="size-3.5 text-primary" /> Phone
                        </span>
                        <span className="font-semibold text-foreground">
                          {matchingLease.tenantPhone}
                        </span>
                      </div>
                    )}

                    {matchingLease?.tenantEmail && (
                      <div className="flex justify-between items-center py-1 border-b border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Mail className="size-3.5 text-primary" /> Email
                        </span>
                        <span className="font-semibold text-foreground truncate max-w-[180px]">
                          {matchingLease.tenantEmail}
                        </span>
                      </div>
                    )}

                    {matchingLease?.propertyName && (
                      <div className="flex justify-between items-center py-1 border-b border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Home className="size-3.5 text-primary" /> Property
                        </span>
                        <span className="font-semibold text-foreground">
                          {matchingLease.propertyName}
                        </span>
                      </div>
                    )}

                    {matchingLease?.monthlyRent !== undefined && (
                      <div className="flex justify-between items-center py-1 border-b border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Receipt className="size-3.5 text-primary" /> Monthly Rent
                        </span>
                        <span className="font-bold text-foreground tabular-nums">
                          {formatPhpCurrency(matchingLease.monthlyRent)}
                        </span>
                      </div>
                    )}

                    {matchingLease?.startDate && (
                      <div className="flex justify-between items-center py-1 border-b border-border/20">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-primary" /> Lease Period
                        </span>
                        <span className="font-semibold text-foreground">
                          {matchingLease.startDate} to {matchingLease.endDate || "Ongoing"}
                        </span>
                      </div>
                    )}

                    {matchingLease?.outstandingBalance !== undefined && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <CreditCard className="size-3.5 text-primary" /> Balance Due
                        </span>
                        <span
                          className={cn(
                            "font-bold tabular-nums font-mono",
                            matchingLease.outstandingBalance > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {formatPhpCurrency(matchingLease.outstandingBalance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
