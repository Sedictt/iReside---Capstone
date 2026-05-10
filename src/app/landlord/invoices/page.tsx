"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FileText, Loader2, Plus, Search, X, Filter } from "lucide-react";

import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { RecordExpenseModal } from "@/components/landlord/invoices/RecordExpenseModal";
import type { BillingWorkspace, InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";

type StudioStep = "rent" | "water" | "electricity";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date_incurred: string;
  description: string;
}

export default function InvoicesPage() {
  const { selectedPropertyId } = useProperty();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [metrics, setMetrics] = useState({ totalOutstanding: 0, overdueAmount: 0, collectedLast30Days: 0, totalInvoices: 0 });
  const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"generate" | "reading" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [generatorForm, setGeneratorForm] = useState({
    leaseId: "",
    billingMonth: new Date().toISOString().slice(0, 7),
  });
  const [studioStep, setStudioStep] = useState<StudioStep>("rent");
  const [readingForm, setReadingForm] = useState({
    leaseId: "",
    utilityType: "water",
    billingPeriodStart: new Date().toISOString().slice(0, 8) + "01",
    billingPeriodEnd: new Date().toISOString().slice(0, 10),
    previousReading: "0",
    currentReading: "0",
    note: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  
  // Finance Hub Tabs
  const [activeTab, setActiveTab] = useState<"ledger" | "invoices" | "expenses">("ledger");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const invoiceParams = new URLSearchParams({ propertyId: selectedPropertyId });
      const [invoiceRes, workspaceRes, expensesRes] = await Promise.all([
        fetch(`/api/landlord/invoices?${invoiceParams.toString()}`, { cache: "no-store" }),
        fetch("/api/landlord/payment-settings", { cache: "no-store" }),
        fetch(`/api/landlord/expenses?${invoiceParams.toString()}`, { cache: "no-store" }),
      ]);
      if (!invoiceRes.ok || !workspaceRes.ok || !expensesRes.ok) throw new Error();

      const invoicePayload = await invoiceRes.json();
      const workspacePayload = (await workspaceRes.json()) as BillingWorkspace;
      const expensesPayload = await expensesRes.json();

      setInvoices(invoicePayload.invoices ?? []);
      setExpenses(expensesPayload.expenses ?? []);
      setMetrics(invoicePayload.metrics ?? { totalOutstanding: 0, overdueAmount: 0, collectedLast30Days: 0, totalInvoices: 0 });
      setWorkspace(workspacePayload);
      setGeneratorForm((current) => ({ ...current, leaseId: current.leaseId || workspacePayload.activeLeases[0]?.id || "" }));
      setReadingForm((current) => ({ ...current, leaseId: current.leaseId || workspacePayload.activeLeases[0]?.id || "" }));
    } catch {
      setMessage("Unable to load billing operations.");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const id = searchParams?.get("id");
    if (id) {
      setSelectedInvoiceId(id);
      setActiveTab("invoices");
    }
  }, [searchParams]);

  const visibleActiveLeases = useMemo(() => {
    const leases = workspace?.activeLeases ?? [];
    if (selectedPropertyId === "all") return leases;
    return leases.filter((lease) => lease.property?.id === selectedPropertyId);
  }, [workspace, selectedPropertyId]);

  const processedInvoices = useMemo(() => {
    let result = invoices.filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.tenant} ${invoice.property} ${invoice.unit}`.toLowerCase().includes(search.toLowerCase()),
    );

    if (filterMethod !== "all") {
      result = result.filter((i) => {
        if (filterMethod === "gcash") return i.paymentMethod === "gcash";
        if (filterMethod === "in_person") return i.paymentMethod === "in_person" || i.paymentMethod === "cash" || i.workflowStatus === "awaiting_in_person";
        return true;
      });
    }

    if (filterStatus !== "all") {
      result = result.filter((i) => {
        if (filterStatus === "refund_pending") return i.hasRefundRequest;
        return i.status === filterStatus || i.workflowStatus === filterStatus;
      });
    }

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
      if (sortBy === "oldest") return new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime();
      if (sortBy === "tenant_az") return a.tenant.localeCompare(b.tenant);
      if (sortBy === "tenant_za") return b.tenant.localeCompare(a.tenant);
      if (sortBy === "highest_amount") return b.amount - a.amount;
      if (sortBy === "lowest_amount") return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [invoices, search, filterMethod, filterStatus, sortBy]);

  const selectedGeneratorLease = useMemo(
    () => visibleActiveLeases.find((lease) => lease.id === generatorForm.leaseId) ?? null,
    [generatorForm.leaseId, visibleActiveLeases],
  );

  const utilityStepState = useMemo(() => {
    const resolveConfig = (utilityType: "water" | "electricity") => {
      if (!workspace || !selectedGeneratorLease?.property?.id) return null;

      return (
        workspace.utilityConfigs.find((item) => item.property_id === selectedGeneratorLease.property?.id && item.unit_id === selectedGeneratorLease.unit?.id && item.utility_type === utilityType && item.is_active) ??
        workspace.utilityConfigs.find((item) => item.property_id === selectedGeneratorLease.property?.id && item.unit_id === null && item.utility_type === utilityType && item.is_active)
      );
    };

    const waterConfig = resolveConfig("water");
    const electricityConfig = resolveConfig("electricity");

    return {
      water: { config: waterConfig, enabled: waterConfig?.billing_mode === "tenant_paid" },
      electricity: { config: electricityConfig, enabled: electricityConfig?.billing_mode === "tenant_paid" },
    };
  }, [selectedGeneratorLease, workspace]);

  const enabledStudioSteps = useMemo(
    () => ["rent", utilityStepState.water.enabled ? "water" : null, utilityStepState.electricity.enabled ? "electricity" : null].filter((step): step is StudioStep => Boolean(step)),
    [utilityStepState.electricity.enabled, utilityStepState.water.enabled],
  );

  const isLastStudioStep = studioStep === enabledStudioSteps[enabledStudioSteps.length - 1];

  useEffect(() => {
    if (generatorForm.leaseId) {
      setReadingForm((current) => ({ ...current, leaseId: generatorForm.leaseId }));
    }
  }, [generatorForm.leaseId]);

  useEffect(() => {
    const firstVisibleLeaseId = visibleActiveLeases[0]?.id ?? "";
    setGeneratorForm((current) =>
      visibleActiveLeases.some((lease) => lease.id === current.leaseId)
        ? current
        : { ...current, leaseId: firstVisibleLeaseId },
    );
    setReadingForm((current) =>
      visibleActiveLeases.some((lease) => lease.id === current.leaseId)
        ? current
        : { ...current, leaseId: firstVisibleLeaseId },
    );
  }, [visibleActiveLeases]);

  useEffect(() => {
    if (!enabledStudioSteps.includes(studioStep)) {
      setStudioStep("rent");
    }
  }, [enabledStudioSteps, studioStep]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; classes: string }> = {
      pending: { label: "Awaiting Payment", classes: "border-zinc-500/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400" },
      under_review: { label: "Verify Payment", classes: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400" },
      intent_submitted: { label: "Payment Reported", classes: "border-indigo-500/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
      awaiting_in_person: { label: "Cash Collection", classes: "border-cyan-500/30 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
      paid: { label: "Settled", classes: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
      receipted: { label: "Finalized", classes: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
      confirmed: { label: "Confirmed", classes: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
      overdue: { label: "Late Payment", classes: "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400" },
      rejected: { label: "Issue Found", classes: "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400" },
      refund_pending: { label: "Refund Pending", classes: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    };
    return configs[status] || { label: status, classes: "border-border bg-muted text-muted-foreground" };
  };

  useEffect(() => {
    if (studioStep === "water" || studioStep === "electricity") {
      setReadingForm((current) => ({ ...current, utilityType: studioStep }));
    }
  }, [studioStep]);

  const createInvoices = async () => {
    setActionLoading("generate");
    setMessage(null);
    try {
      const response = await fetch("/api/landlord/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMonth: `${generatorForm.billingMonth}-01`,
          leaseIds: generatorForm.leaseId ? [generatorForm.leaseId] : undefined,
        }),
      });
      if (!response.ok) throw new Error();

      await loadData();
      setMessage("Invoice generated with rent prefilled from the active lease and tenant-paid utilities added when applicable.");
      setIsStudioOpen(false);
      setStudioStep("rent");
    } catch {
      setMessage("Unable to generate invoices right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const submitReading = async () => {
    setActionLoading("reading");
    setMessage(null);
    try {
      const formData = new FormData();
      Object.entries(readingForm).forEach(([key, value]) => formData.append(key, value));
      if (proofFile) formData.append("proof", proofFile);

      const response = await fetch("/api/landlord/utility-readings", { method: "POST", body: formData });
      if (!response.ok) throw new Error();

      setMessage(`${readingForm.utilityType === "water" ? "Water" : "Electricity"} reading recorded.`);
      await loadData();
      setProofFile(null);
    } catch {
      setMessage("Unable to record the utility reading.");
    } finally {
      setActionLoading(null);
    }
  };

  const goToPreviousStudioStep = () => {
    const currentIndex = enabledStudioSteps.indexOf(studioStep);
    if (currentIndex > 0) {
      setStudioStep(enabledStudioSteps[currentIndex - 1]);
    }
  };

  const goToNextStudioStep = () => {
    const currentIndex = enabledStudioSteps.indexOf(studioStep);
    if (currentIndex < enabledStudioSteps.length - 1) {
      setStudioStep(enabledStudioSteps[currentIndex + 1]);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 md:px-8 lg:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary shadow-sm backdrop-blur-md">
            <FileText className="size-3.5" />
            Financial Center
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Finance Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your unified ledger, track expenses, and oversee rent invoices.</p>
        </div>
        {/* Deprecated: Invoice Studio removed in favor of direct utility dashboard workflow */}
        {/* 
        <button onClick={() => setIsStudioOpen(true)} className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 active:scale-95">
          <Plus className="size-4 transition-transform group-hover:rotate-90" />
          Invoice Studio
        </button>
        */}
      </div>

      <div data-tour-id="tour-finance-hub" className="grid gap-4 sm:grid-cols-3">
        {(() => {
          const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
          const netCashFlow = metrics.collectedLast30Days - totalExpenses;
          return (
            <>
              <HeroStat label="Net Cash Flow (30d)" value={formatPhpCurrency(netCashFlow)} highlight={netCashFlow >= 0 ? "text-emerald-500" : "text-rose-500"} />
              <HeroStat label="Collected (30d)" value={formatPhpCurrency(metrics.collectedLast30Days)} highlight="text-primary" />
              <HeroStat label="Total Expenses" value={formatPhpCurrency(totalExpenses)} highlight="text-amber-500" />
            </>
          );
        })()}
      </div>

      {message && <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">{message}</div>}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/50 pb-px">
        {(["ledger", "invoices", "expenses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {tab === "ledger" && "Unified Ledger"}
            {tab === "invoices" && "Invoices"}
            {tab === "expenses" && "Expenses"}
          </button>
        ))}
      </div>

      {activeTab === "invoices" && (
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Ledger</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">Issued invoices</h2>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." className="w-full rounded-full border border-border/50 bg-background/80 py-3 pl-11 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-background shadow-sm" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-background/40 p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground border-r border-border/50 pr-4">
              <Filter className="size-4" /> Filters
            </div>
            
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-full border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground outline-none transition-all hover:border-border focus:border-primary/50">
              <option value="all">All Statuses</option>
              <optgroup label="Actionable">
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="intent_submitted">Intent Submitted</option>
                <option value="awaiting_in_person">Awaiting In-Person</option>
              </optgroup>
              <optgroup label="Completed">
                <option value="paid">Paid</option>
                <option value="receipted">Receipted</option>
                <option value="confirmed">Confirmed</option>
              </optgroup>
              <optgroup label="Issues">
                <option value="overdue">Overdue</option>
                <option value="rejected">Rejected</option>
                <option value="refund_pending">Refund Pending</option>
              </optgroup>
            </select>

            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="rounded-full border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground outline-none transition-all hover:border-border focus:border-primary/50">
              <option value="all">All Payment Methods</option>
              <option value="gcash">GCash</option>
              <option value="in_person">Face-to-Face / Cash</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ml-auto rounded-full border border-border/50 bg-card px-4 py-2 text-xs font-medium text-foreground outline-none transition-all hover:border-border focus:border-primary/50">
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="tenant_az">Sort: Tenant (A-Z)</option>
              <option value="tenant_za">Sort: Tenant (Z-A)</option>
              <option value="highest_amount">Sort: Highest Amount</option>
              <option value="lowest_amount">Sort: Lowest Amount</option>
            </select>
          </div>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto pr-2">
          {loading && <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/50 bg-background/50 py-16 text-muted-foreground"><Loader2 className="mb-4 size-8 animate-spin text-primary" /><p className="text-sm font-bold uppercase tracking-widest text-foreground">Loading invoices...</p></div>}
          {!loading && processedInvoices.map((invoice) => (
            <button key={invoice.id} onClick={() => setSelectedInvoiceId(invoice.id)} className="group w-full rounded-[2rem] border border-border/50 bg-background/80 p-6 shadow-sm backdrop-blur-md transition-all hover:scale-[1.01] hover:border-primary/30 hover:bg-card hover:shadow-md md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold tracking-tight text-foreground">{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const config = getStatusConfig(invoice.workflowStatus ?? invoice.status);
                          return (
                            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] shadow-sm", config.classes)}>
                              <div className="mr-1.5 size-1 rounded-full bg-current animate-pulse" />
                              {config.label}
                            </span>
                          );
                        })()}
                        {invoice.proofStatus === "submitted" && (
                          <span className="relative overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-500 shadow-sm">
                            <span className="absolute inset-0 -translate-x-[100%] animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            Proof Attached
                          </span>
                        )}
                        {invoice.hasRefundRequest && (
                          <span className="relative overflow-hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-500 shadow-sm">
                            <span className="absolute inset-0 -translate-x-[100%] animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            Refund Details Sent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-muted-foreground">
                      <span className="flex items-center gap-2 hover:text-foreground transition-colors">
                        <div className="size-1.5 rounded-full bg-primary/40" />
                        {invoice.tenant}
                      </span>
                      <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />
                      <span className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 opacity-40" />
                        {invoice.property}
                      </span>
                      <div className="h-4 w-[1px] bg-border/40 hidden sm:block" />
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] border border-white/5">
                        Unit {invoice.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-8 lg:gap-12 xl:shrink-0">
                    <LedgerMetric label="Total Payable" value={formatPhpCurrency(invoice.amount)} />
                    <LedgerMetric label="Remaining" value={formatPhpCurrency(invoice.balanceRemaining)} highlight={invoice.balanceRemaining > 0 && invoice.status !== "paid"} />
                    <LedgerMetric label="Due Date" value={invoice.dueDate} />
                  </div>
                </div>
            </button>
          ))}
          {!loading && processedInvoices.length === 0 && <div className="rounded-[2rem] border border-border/50 bg-background/50 p-12 text-center text-sm font-medium text-muted-foreground shadow-inner">No matching invoices found.</div>}
        </div>
      </div>
      )}

      {/* Prototype: Ledger Tab */}
      {activeTab === "ledger" && (
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Overview</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">Financial Ledger</h2>
              </div>
              <button className="group inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-background/80 px-6 py-3 text-sm font-bold shadow-sm transition-all hover:bg-muted active:scale-95">
                Download Statement
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border/50 bg-background/50 p-8 shadow-inner custom-scrollbar overflow-y-auto max-h-[500px] space-y-4">
            {expenses.length === 0 && invoices.length === 0 ? (
                <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                    <FileText className="size-8" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">No entries yet.</p>
                  <p className="mt-2 max-w-md mx-auto">Your timeline of paid invoices and recorded expenses will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Simplified Timeline View */}
                    {[...expenses.map(e => ({ type: 'expense' as const, date: new Date(e.date_incurred), amount: e.amount, label: e.category, desc: e.description })), ...invoices.filter(i => i.status === 'paid' || i.status === 'receipted' || i.status === 'confirmed').map(i => ({ type: 'income' as const, date: new Date(i.issuedDate), amount: i.amount, label: `Rent Payment`, desc: `Invoice ${i.invoiceNumber}` }))]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-5">
                            <div className="flex items-center gap-4">
                                <div className={cn("flex size-10 items-center justify-center rounded-full", item.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                                    {item.type === 'income' ? <Plus className="size-5" /> : <Filter className="size-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground capitalize">{item.label}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.desc} • {item.date.toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className={cn("text-base font-semibold", item.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                                {item.type === 'income' ? '+' : '-'}{formatPhpCurrency(item.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Prototype: Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Outflow</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">Expense Log</h2>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
              >
                <Plus className="size-4" />
                Record Expense
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border/50 bg-background/50 p-8 shadow-inner custom-scrollbar overflow-y-auto max-h-[500px] space-y-4">
            {expenses.length === 0 ? (
                <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4">
                    <Filter className="size-8" />
                  </div>
                  <p className="text-lg font-semibold text-foreground">No expenses recorded yet.</p>
                  <p className="mt-2 max-w-md mx-auto">Click &quot;Record Expense&quot; to log maintenance costs, utility bills you cover, and property taxes to keep your accounting accurate.</p>
                </div>
            ) : (
                expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-5 transition-all hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                                <Filter className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground capitalize">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">{expense.description}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Incurred: {new Date(expense.date_incurred).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-semibold text-foreground">{formatPhpCurrency(expense.amount)}</p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Deprecated: Invoice Studio Modal preserved but disabled in favor of Utility Billing Dashboard */}
      {/* 
      {isStudioOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="custom-scrollbar flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-[2.5rem] border border-border/60 bg-card p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Monthly billing</p>
                <h2 className="mt-2 text-3xl font-semibold text-foreground">Invoice studio</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Step through rent first, then review water and electricity only when they are billed separately from rent.
                </p>
              </div>
              <button onClick={() => setIsStudioOpen(false)} className="rounded-full border border-border/50 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-8 rounded-[2rem] border border-border/50 bg-background/60 p-6 shadow-inner backdrop-blur-md">
              <div className="mb-6 grid gap-3 md:grid-cols-3">
                {([
                  { key: "rent", label: "Base Rent", enabled: true },
                  { key: "water", label: "Water Bill", enabled: utilityStepState.water.enabled },
                  { key: "electricity", label: "Electricity Bill", enabled: utilityStepState.electricity.enabled },
                ] as const).map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    disabled={!step.enabled}
                    onClick={() => step.enabled && setStudioStep(step.key)}
                    className={cn(
                      "rounded-[1.5rem] border px-4 py-4 text-left transition-all",
                      studioStep === step.key
                        ? "border-primary/20 bg-primary/10 shadow-[0_18px_40px_-32px_rgba(var(--primary-rgb),0.8)]"
                        : step.enabled
                          ? "border-border/60 bg-card/70 hover:border-primary/15 hover:bg-card"
                          : "cursor-not-allowed border-border/50 bg-background/60 opacity-45",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Step {index + 1}</p>
                    <p className={cn("mt-2 text-base font-semibold", studioStep === step.key ? "text-primary" : "text-foreground")}>{step.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.enabled ? "Required in this invoice flow" : "Bundled into rent"}</p>
                  </button>
                ))}
              </div>

              {studioStep === "rent" && (
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <SelectField label="Lease" value={generatorForm.leaseId} onChange={(value) => setGeneratorForm((current) => ({ ...current, leaseId: value }))}>
                      {visibleActiveLeases.map((lease) => <option key={lease.id} value={lease.id}>{lease.tenant?.full_name ?? "Tenant"} - {lease.property?.name ?? "Property"} - {lease.unit?.name ?? "Unit"}</option>)}
                    </SelectField>
                    <InputField label="Billing month" type="month" value={generatorForm.billingMonth} onChange={(value) => setGeneratorForm((current) => ({ ...current, billingMonth: value }))} />
                  </div>

                  <div className="rounded-[1.75rem] border border-border/50 bg-card/80 p-5">
                    <div className="border-b border-border/50 pb-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">Step 1</p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">Verify lease rent details</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedGeneratorLease
                          ? `${selectedGeneratorLease.tenant?.full_name ?? "Tenant"} - ${selectedGeneratorLease.property?.name ?? "Property"} - ${selectedGeneratorLease.unit?.name ?? "Unit"}`
                          : "Select a lease to review the pre-populated base rent."}
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <StudioLineItem
                        title="Monthly rent"
                        description={selectedGeneratorLease ? "Verify that the lease amount is correct before continuing." : "Waiting for lease selection."}
                        amount={selectedGeneratorLease ? formatPhpCurrency(selectedGeneratorLease.monthly_rent) : "Pending lease selection"}
                        tone="primary"
                      />
                      <div className="rounded-[1.5rem] border border-border/50 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                        Water bill step: {utilityStepState.water.enabled ? "enabled as a separate utility charge." : "disabled because water is bundled into rent."}
                        <br />
                        Electricity bill step: {utilityStepState.electricity.enabled ? "enabled as a separate utility charge." : "disabled because electricity is bundled into rent."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {studioStep === "water" && (
                <div className="space-y-6">
                  <div className="rounded-[1.75rem] border border-sky-500/20 bg-sky-500/10 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400">Step 2</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Water bill review</h3>
                    <p className="mt-1 text-sm text-sky-100/80">
                      {utilityStepState.water.config
                        ? `Water is billed separately at ${formatPhpCurrency(Number(utilityStepState.water.config.rate_per_unit ?? 0))} per ${utilityStepState.water.config.unit_label === "cubic_meter" ? "cubic meter" : "kWh"}.`
                        : "No active water billing config found."}
                    </p>
                  </div>
                  <StudioLineItem
                    title="Water bill"
                    description="This utility appears as a separate invoice section because it is not bundled into rent."
                    amount="Calculated from meter reading"
                    tone="sky"
                  />
                  <UtilityReadingStep
                    readingForm={readingForm}
                    setReadingForm={setReadingForm}
                    proofFile={proofFile}
                    setProofFile={setProofFile}
                    actionLoading={actionLoading}
                    submitReading={submitReading}
                    utilityLabel="Water"
                  />
                </div>
              )}

              {studioStep === "electricity" && (
                <div className="space-y-6">
                  <div className="rounded-[1.75rem] border border-amber-500/20 bg-amber-500/10 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">Step 3</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Electricity bill review</h3>
                    <p className="mt-1 text-sm text-amber-100/80">
                      {utilityStepState.electricity.config
                        ? `Electricity is billed separately at ${formatPhpCurrency(Number(utilityStepState.electricity.config.rate_per_unit ?? 0))} per ${utilityStepState.electricity.config.unit_label === "cubic_meter" ? "cubic meter" : "kWh"}.`
                        : "No active electricity billing config found."}
                    </p>
                  </div>
                  <StudioLineItem
                    title="Electricity bill"
                    description="This utility appears as a separate invoice section because it is not bundled into rent."
                    amount="Calculated from meter reading"
                    tone="amber"
                  />
                  <UtilityReadingStep
                    readingForm={readingForm}
                    setReadingForm={setReadingForm}
                    proofFile={proofFile}
                    setProofFile={setProofFile}
                    actionLoading={actionLoading}
                    submitReading={submitReading}
                    utilityLabel="Electricity"
                  />
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={goToPreviousStudioStep}
                  disabled={studioStep === "rent"}
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  Previous step
                </button>
                {isLastStudioStep ? (
                  <button onClick={createInvoices} disabled={actionLoading === "generate" || !generatorForm.leaseId} className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-60">
                    {actionLoading === "generate" ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5 transition-transform group-hover:rotate-90" />}
                    Generate invoice
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goToNextStudioStep}
                    disabled={!generatorForm.leaseId}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
                  >
                    Next step
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      */}

      <InvoiceModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} onUpdated={loadData} />
      <RecordExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} />
    </div>
  );
}

function HeroStat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="group rounded-[2rem] border border-border/50 bg-background/60 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-background/80 hover:border-border/80">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold md:text-2xl lg:text-3xl", highlight ?? "text-foreground")}>{value}</p>
    </div>
  );
}

function LedgerMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
      <p className={cn("whitespace-nowrap text-base font-semibold lg:text-lg tracking-tight", highlight ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return <label className="space-y-2.5"><span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-2xl border border-border/50 bg-card px-5 py-4 text-sm font-medium text-foreground outline-none transition-all hover:border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10">{children}</select></label>;
}

function InputField({ label, type = "number", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-2.5"><span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-border/50 bg-card px-5 py-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground hover:border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10" /></label>;
}

function StudioLineItem({
  title,
  description,
  amount,
  tone,
}: {
  title: string;
  description: string;
  amount: string;
  tone: "primary" | "sky" | "amber";
}) {
  const toneClassName = tone === "primary"
    ? "border-primary/20 bg-primary/10 text-primary"
    : tone === "sky"
      ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-400";

  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border/50 bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className={cn("rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]", toneClassName)}>
        {amount}
      </div>
    </div>
  );
}

function UtilityReadingStep({
  readingForm,
  setReadingForm,
  proofFile,
  setProofFile,
  actionLoading,
  submitReading,
  utilityLabel,
}: {
  readingForm: {
    leaseId: string;
    utilityType: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    previousReading: string;
    currentReading: string;
    note: string;
  };
  setReadingForm: React.Dispatch<React.SetStateAction<{
    leaseId: string;
    utilityType: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    previousReading: string;
    currentReading: string;
    note: string;
  }>>;
  proofFile: File | null;
  setProofFile: (file: File | null) => void;
  actionLoading: "generate" | "reading" | null;
  submitReading: () => Promise<void>;
  utilityLabel: string;
}) {
  return (
    <div className="rounded-[2rem] border border-border/50 bg-background/60 p-6 shadow-inner backdrop-blur-md">
      <div className="mb-6 flex items-center gap-3 text-sm font-bold text-foreground">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary shadow-sm">
          <CalendarDays className="size-5" />
        </div>
        {utilityLabel} reading
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Capture the reading now so the {utilityLabel.toLowerCase()} charge can be added as a separate invoice section.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <InputField label="Previous" value={readingForm.previousReading} onChange={(value) => setReadingForm((current) => ({ ...current, previousReading: value }))} />
        <InputField label="Current" value={readingForm.currentReading} onChange={(value) => setReadingForm((current) => ({ ...current, currentReading: value }))} />
        <InputField label="Period start" type="date" value={readingForm.billingPeriodStart} onChange={(value) => setReadingForm((current) => ({ ...current, billingPeriodStart: value }))} />
        <InputField label="Period end" type="date" value={readingForm.billingPeriodEnd} onChange={(value) => setReadingForm((current) => ({ ...current, billingPeriodEnd: value }))} />
      </div>
      <label className="mt-5 block space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Note</span>
        <textarea rows={3} value={readingForm.note} onChange={(event) => setReadingForm((current) => ({ ...current, note: event.target.value }))} className="w-full rounded-2xl border border-border/50 bg-card px-5 py-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground hover:border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10" placeholder={`Any internal notes for this ${utilityLabel.toLowerCase()} reading...`} />
      </label>
      <label className="mt-5 block space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-rose-500">Required photo proof</span>
        <input type="file" accept="image/*" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className="w-full rounded-2xl border border-border/50 bg-card px-5 py-3 text-sm font-medium text-foreground outline-none transition-all file:mr-4 file:rounded-full file:border-0 file:bg-primary/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10" />
      </label>
      <button onClick={submitReading} disabled={actionLoading === "reading" || !proofFile} className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-60">
        {actionLoading === "reading" ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4 transition-transform group-hover:-translate-y-0.5" />}
        Save {utilityLabel.toLowerCase()} reading
      </button>
    </div>
  );
}

