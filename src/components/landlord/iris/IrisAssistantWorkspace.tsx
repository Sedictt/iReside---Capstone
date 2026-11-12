"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Zap,
  Bell,
  CreditCard,
  Wrench,
  FileText,
  Search,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LandlordOperationsContext,
  ActiveLeaseSummary,
  MaintenanceTicketSummary,
} from "@/lib/services/iris";
import { formatPhpCurrency } from "@/lib/services/iris";
import {
  QuickSettlementCard,
  MaintenanceTicketCard,
  LeaseRenewalCard,
  TenantDirectoryCard,
} from "./tools";
import { IrisInvoiceWizard } from "./guided-invoice";
import { IrisBroadcastModal } from "./broadcast";

export type IrisActiveView =
  | "dashboard"
  | "settlement"
  | "maintenance"
  | "renewals"
  | "directory";

export interface IrisAssistantWorkspaceProps {
  initialContext?: LandlordOperationsContext;
  onOpenConversation?: (participantUserId: string) => void;
  onBack?: () => void;
  className?: string;
}

export function IrisAssistantWorkspace({
  initialContext,
  onOpenConversation,
  onBack,
  className,
}: IrisAssistantWorkspaceProps) {
  const [context, setContext] = useState<LandlordOperationsContext | null>(
    initialContext ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialContext);
  const [activeView, setActiveView] = useState<IrisActiveView>("dashboard");

  // Preselected context states when jumping between tools
  const [preselectedLeaseId, setPreselectedLeaseId] = useState<string | undefined>(
    undefined
  );

  // Modals state
  const [isInvoiceWizardOpen, setIsInvoiceWizardOpen] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  // Load operational context
  const loadContext = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/landlord/iris/context");
      const json = await res.json();
      if (res.ok && json.data) {
        setContext(json.data);
      }
    } catch (err) {
      console.warn("Failed to load operations context:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialContext) {
      loadContext();
    }
  }, [initialContext, loadContext]);

  const activeLeases = context?.activeLeases ?? [];
  const openTickets = context?.openTickets ?? [];
  const expiringLeases = context?.expiringLeases ?? [];
  const overdueLeases = context?.overdueLeases ?? [];
  const totalReceivables = context?.totalReceivables ?? 0;
  const occupancyRate = context?.occupancyRate ?? 0;

  // Handlers for cross-tool shortcuts
  const handleRecordPaymentForLease = (leaseId: string) => {
    setPreselectedLeaseId(leaseId);
    setActiveView("settlement");
  };

  const handleIssueBillForLease = (leaseId: string) => {
    setPreselectedLeaseId(leaseId);
    setIsInvoiceWizardOpen(true);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-background text-foreground",
        className
      )}
    >
      {/* Top Header */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-border/40 p-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl neumorphic-extruded active:scale-95 transition-all"
              title="Back"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}

          <div
            className="size-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: "#8B5CF6" }}
          >
            <Bot className="size-6 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                iRis Operations Assistant
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Operations Hub
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated property assistant & zero-lag landlord operations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadContext}
          disabled={isLoading}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          title="Refresh Operations Data"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin text-primary")} />
        </button>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="shrink-0 border-b border-border/40 bg-surface-1/40 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar-premium pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveView("dashboard");
              setPreselectedLeaseId(undefined);
            }}
            className={cn(
              "min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeView === "dashboard"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setIsInvoiceWizardOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 neumorphic-extruded text-foreground hover:text-primary active:scale-95"
          >
            <Zap className="size-3.5 text-amber-500 fill-amber-500" />
            Create Invoice
          </button>

          <button
            type="button"
            onClick={() => setIsBroadcastModalOpen(true)}
            className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 neumorphic-extruded text-foreground hover:text-primary active:scale-95"
          >
            <Bell className="size-3.5 text-purple-500" />
            Broadcast Notice
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveView("settlement");
            }}
            className={cn(
              "min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeView === "settlement"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <CreditCard className="size-3.5 text-emerald-500" />
            Record Payment
          </button>

          <button
            type="button"
            onClick={() => setActiveView("maintenance")}
            className={cn(
              "min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeView === "maintenance"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <Wrench className="size-3.5 text-amber-500" />
            Maintenance Triage
            {openTickets.length > 0 && (
              <span className="size-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView("renewals")}
            className={cn(
              "min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeView === "renewals"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="size-3.5 text-blue-500" />
            Lease Expiry Check
            {expiringLeases.length > 0 && (
              <span className="size-2 rounded-full bg-blue-500 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView("directory")}
            className={cn(
              "min-h-[44px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5",
              activeView === "directory"
                ? "neumorphic-primary text-white shadow-xs"
                : "neumorphic-extruded text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="size-3.5 text-purple-500" />
            Resident Lookup
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-4 sm:p-6 space-y-6">
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeView === "dashboard" && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Operational Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl neumorphic-panel p-4 sm:p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Total Unpaid Balance
                </span>
                <div className="text-lg sm:text-2xl font-black text-foreground tabular-nums font-mono">
                  {formatPhpCurrency(totalReceivables)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {overdueLeases.length} {overdueLeases.length === 1 ? "unit" : "units"} overdue
                </div>
              </div>

              <div className="rounded-2xl neumorphic-panel p-4 sm:p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Open Repairs
                </span>
                <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {openTickets.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active maintenance tickets
                </div>
              </div>

              <div className="rounded-2xl neumorphic-panel p-4 sm:p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Expiring Leases
                </span>
                <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {expiringLeases.length}
                </div>
                <div className="text-xs text-muted-foreground">Within 60 days</div>
              </div>

              <div className="rounded-2xl neumorphic-panel p-4 sm:p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Occupancy Rate
                </span>
                <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {occupancyRate}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeLeases.length} active leases
                </div>
              </div>
            </div>

            {/* Quick Assistant Shortcuts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overdue Rent Card */}
              <div className="rounded-3xl neumorphic-panel p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <CreditCard className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Unpaid Rent Collection</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Residents with outstanding balance
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("settlement")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="size-3" />
                  </button>
                </div>

                {overdueLeases.length === 0 ? (
                  <div className="rounded-xl neumorphic-inset p-5 text-center text-xs text-muted-foreground space-y-1">
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                    <p className="font-bold text-foreground">All Rent Up to Date</p>
                    <p>No overdue balances among active residents.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueLeases.slice(0, 3).map((l) => (
                      <div
                        key={l.id}
                        className="rounded-xl neumorphic-inset p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-foreground">{l.tenantName}</span>
                          <span className="text-muted-foreground block text-[11px]">
                            Unit {l.unitName} ({l.daysOverdue}d overdue)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                            {formatPhpCurrency(l.outstandingBalance)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRecordPaymentForLease(l.id)}
                            className="min-h-[36px] px-3 rounded-lg neumorphic-primary text-white text-[11px] font-bold active:scale-95 transition-all"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Maintenance Urgent Triage Card */}
              <div className="rounded-3xl neumorphic-panel p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Wrench className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Repairs & Maintenance</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Open tickets needing action
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView("maintenance")}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="size-3" />
                  </button>
                </div>

                {openTickets.length === 0 ? (
                  <div className="rounded-xl neumorphic-inset p-5 text-center text-xs text-muted-foreground space-y-1">
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto" />
                    <p className="font-bold text-foreground">No Open Tickets</p>
                    <p>All maintenance requests are resolved.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {openTickets.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl neumorphic-inset p-3 flex items-center justify-between text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold text-foreground truncate block">
                            {t.title}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            Unit {t.unitName} • {t.tenantName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {t.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveView("maintenance")}
                            className="min-h-[36px] px-2.5 rounded-lg neumorphic-extruded text-primary text-[11px] font-bold active:scale-95 transition-all"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Resident Directory Preview */}
            <div className="rounded-3xl neumorphic-panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Active Resident Directory</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Search, message, or issue bill to residents
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView("directory")}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Open Full Directory
                  <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeLeases.slice(0, 6).map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl neumorphic-inset p-4 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-foreground block text-sm">
                          {l.tenantName}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          Unit {l.unitName} ({l.propertyName})
                        </span>
                      </div>
                      <span
                        className={cn(
                          "font-bold font-mono tabular-nums text-xs",
                          l.outstandingBalance > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {formatPhpCurrency(l.outstandingBalance)}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-border/20">
                      {onOpenConversation && (
                        <button
                          type="button"
                          onClick={() => onOpenConversation(l.tenantId)}
                          className="flex-1 min-h-[36px] rounded-lg neumorphic-extruded text-[11px] font-bold text-primary flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          Chat
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleIssueBillForLease(l.id)}
                        className="flex-1 min-h-[36px] rounded-lg neumorphic-extruded text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SETTLEMENT */}
        {activeView === "settlement" && (
          <div className="max-w-2xl mx-auto">
            <QuickSettlementCard
              leases={activeLeases}
              preselectedLeaseId={preselectedLeaseId}
              onSettlementSuccess={() => {
                loadContext();
              }}
              onCancel={() => {
                setActiveView("dashboard");
                setPreselectedLeaseId(undefined);
              }}
            />
          </div>
        )}

        {/* VIEW 3: MAINTENANCE */}
        {activeView === "maintenance" && (
          <div className="max-w-3xl mx-auto">
            <MaintenanceTicketCard
              tickets={openTickets}
              onTicketUpdated={() => {
                loadContext();
              }}
            />
          </div>
        )}

        {/* VIEW 4: RENEWALS */}
        {activeView === "renewals" && (
          <div className="max-w-2xl mx-auto">
            <LeaseRenewalCard
              expiringLeases={expiringLeases}
              preselectedLeaseId={preselectedLeaseId}
              onOfferSent={() => {
                loadContext();
              }}
            />
          </div>
        )}

        {/* VIEW 5: TENANT DIRECTORY */}
        {activeView === "directory" && (
          <div className="max-w-3xl mx-auto">
            <TenantDirectoryCard
              leases={activeLeases}
              onMessageResident={(tenantId) => {
                onOpenConversation?.(tenantId);
              }}
              onIssueBill={(leaseId) => {
                handleIssueBillForLease(leaseId);
              }}
              onRecordPayment={(leaseId) => {
                handleRecordPaymentForLease(leaseId);
              }}
            />
          </div>
        )}
      </div>

      {/* Invoice Wizard Modal */}
      {isInvoiceWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl neumorphic-panel p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIsInvoiceWizardOpen(false);
                setPreselectedLeaseId(undefined);
              }}
              className="absolute right-5 top-5 p-2 rounded-full neumorphic-extruded text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Close Wizard"
            >
              <X className="size-4" />
            </button>

            <IrisInvoiceWizard
              initialLeases={activeLeases}
              onSuccess={() => {
                setIsInvoiceWizardOpen(false);
                setPreselectedLeaseId(undefined);
                loadContext();
              }}
              onCancel={() => {
                setIsInvoiceWizardOpen(false);
                setPreselectedLeaseId(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <IrisBroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={() => {
          setIsBroadcastModalOpen(false);
          loadContext();
        }}
      />
    </div>
  );
}
