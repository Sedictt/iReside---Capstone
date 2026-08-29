"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FileText, Plus, Search, Filter, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { RecordExpenseModal } from "@/components/landlord/invoices/RecordExpenseModal";
import { Tooltip } from "@/components/ui/tooltip";
import type { InvoiceListItem } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  
  // Finance Hub Tabs
  const [activeTab, setActiveTab] = useState<"ledger" | "invoices" | "expenses">("ledger");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const invoiceParams = new URLSearchParams({ propertyId: selectedPropertyId });
      const [invoiceRes, expensesRes] = await Promise.all([
        fetch(`/api/landlord/invoices?${invoiceParams.toString()}`, { cache: "no-store" }),
        fetch(`/api/landlord/expenses?${invoiceParams.toString()}`, { cache: "no-store" }),
      ]);
      if (!invoiceRes.ok || !expensesRes.ok) throw new Error();

      const invoicePayload = await invoiceRes.json();
      const expensesPayload = await expensesRes.json();

      setInvoices(invoicePayload.invoices ?? []);
      setExpenses(expensesPayload.expenses ?? []);
      setMetrics(invoicePayload.metrics ?? { totalOutstanding: 0, overdueAmount: 0, collectedLast30Days: 0, totalInvoices: 0 });
    } catch {
      setMessage("Unable to load billing operations.");
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId]);

  const handleExportCSV = () => {
    const ledgerData = [
      ...expenses.map(expense => ({
        date: expense.date_incurred,
        type: 'Expense',
        category: expense.category,
        description: expense.description,
        amount: -expense.amount
      })),
      ...invoices
        .filter(invoice => ['paid', 'receipted', 'confirmed'].includes(invoice.status))
        .map(invoice => ({
          date: invoice.issuedDate,
          type: 'Income',
          category: 'Rent Payment',
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.tenant}`,
          amount: invoice.amount
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const headers = ["Date", "Type", "Category", "Description", "Amount (PHP)"];
    const csvContent = [
      headers.join(","),
      ...ledgerData.map(row => 
        [
          row.date,
          row.type,
          row.category,
          `"${row.description.replace(/"/g, '""')}"`,
          row.amount.toFixed(2)
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `iReside_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "invoices" || tabParam === "expenses" || tabParam === "ledger") {
      setActiveTab(tabParam);
    }

    const statusParam = searchParams?.get("status");
    if (statusParam) {
      setFilterStatus(statusParam);
      setActiveTab("invoices");
    }

    const searchParam = searchParams?.get("search");
    if (searchParam) {
      setSearch(searchParam);
      setActiveTab("invoices");
    }

    const invoiceId = searchParams?.get("id") || searchParams?.get("invoiceId");
    if (invoiceId) {
      setSelectedInvoiceId(invoiceId);
      setActiveTab("invoices");
    }
  }, [searchParams]);

  // Compute status summary counts for one-click pill filters
  const invoiceCounts = useMemo(() => {
    const overdue = invoices.filter((i) => i.status === "overdue" || i.workflowStatus === "overdue").length;
    const underReview = invoices.filter((i) => i.status === "under_review" || i.workflowStatus === "under_review" || i.proofStatus === "submitted").length;
    const pending = invoices.filter((i) => ["pending", "intent_submitted", "awaiting_in_person"].includes(i.status) || ["pending", "intent_submitted", "awaiting_in_person"].includes(i.workflowStatus || "")).length;
    const paid = invoices.filter((i) => ["paid", "receipted", "confirmed"].includes(i.status) || ["paid", "receipted", "confirmed"].includes(i.workflowStatus || "")).length;
    const total = invoices.length;
    return { total, overdue, underReview, pending, paid };
  }, [invoices]);

  const processedInvoices = useMemo(() => {
    let filteredInvoices = invoices.filter((invoice) =>
      `${invoice.invoiceNumber} ${invoice.tenant} ${invoice.property} ${invoice.unit}`.toLowerCase().includes(search.toLowerCase()),
    );

    if (filterMethod !== "all") {
      filteredInvoices = filteredInvoices.filter((i) => {
        if (filterMethod === "gcash") return i.paymentMethod === "gcash";
        if (filterMethod === "in_person") return i.paymentMethod === "in_person" || i.paymentMethod === "cash" || i.workflowStatus === "awaiting_in_person";
        return true;
      });
    }

    if (filterStatus !== "all") {
      filteredInvoices = filteredInvoices.filter((i) => {
        if (filterStatus === "refund_pending") return i.hasRefundRequest;
        if (filterStatus === "unpaid_all") {
          return !["paid", "receipted", "confirmed"].includes(i.status) && !["paid", "receipted", "confirmed"].includes(i.workflowStatus || "");
        }
        if (filterStatus === "paid_all" || filterStatus === "paid") {
          return ["paid", "receipted", "confirmed"].includes(i.status) || ["paid", "receipted", "confirmed"].includes(i.workflowStatus || "");
        }
        if (filterStatus === "under_review") {
          return i.status === "under_review" || i.workflowStatus === "under_review" || i.proofStatus === "submitted";
        }
        if (filterStatus === "pending") {
          return ["pending", "intent_submitted", "awaiting_in_person"].includes(i.status) || ["pending", "intent_submitted", "awaiting_in_person"].includes(i.workflowStatus || "");
        }
        return i.status === filterStatus || i.workflowStatus === filterStatus;
      });
    }

    filteredInvoices.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
      if (sortBy === "oldest") return new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime();
      if (sortBy === "tenant_az") return a.tenant.localeCompare(b.tenant);
      if (sortBy === "tenant_za") return b.tenant.localeCompare(a.tenant);
      if (sortBy === "highest_amount") return b.amount - a.amount;
      if (sortBy === "lowest_amount") return a.amount - b.amount;
      return 0;
    });

    return filteredInvoices;
  }, [invoices, search, filterMethod, filterStatus, sortBy]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; classes: string }> = {
      pending: { label: "Awaiting Payment", classes: "border-zinc-500/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400" },
      under_review: { label: "Verify Payment", classes: "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400" },
      intent_submitted: { label: "Payment Reported", classes: "border-primary/30 bg-primary/15 text-primary dark:text-primary" },
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

  return (
    <div className="mx-auto max-w-[1600px] space-y-10 px-4 py-8 md:px-8 lg:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm backdrop-blur-md">
            <FileText className="size-3.5" />
            Financial Center
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Finance Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your unified ledger, track expenses, and oversee rent invoices.</p>
        </div>
      </div>

      <div data-tour-id="tour-finance-hub" className="grid gap-4 sm:grid-cols-3">
        {(() => {
          const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
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

      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/50 pb-px">
        <Tooltip
          content="Combined chronological timeline of all collected rent payments and recorded property expenses."
          side="top"
        >
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2",
              activeTab === "ledger"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            Unified Ledger
          </button>
        </Tooltip>

        <Tooltip
          content="Track, filter, and review monthly rent dues, verify GCash payment proofs, and manage overdue tenant bills."
          side="top"
        >
          <button
            onClick={() => setActiveTab("invoices")}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2",
              activeTab === "invoices"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            Invoices
          </button>
        </Tooltip>

        <Tooltip
          content="Log operational costs such as building repairs, maintenance, utility bills, and contractor fees."
          side="top"
        >
          <button
            onClick={() => setActiveTab("expenses")}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2",
              activeTab === "expenses"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            Expenses
          </button>
        </Tooltip>
      </div>

      {activeTab === "invoices" && (
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-6 sm:p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            {/* Header Title & Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Ledger</p>
                <h2 className="mt-1 text-2xl font-black text-foreground lg:text-3xl">Issued Invoices</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tenant, unit, or invoice..."
                  className="w-full rounded-xl border border-border/50 bg-background/60 py-2.5 pl-10 pr-4 text-xs font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-background shadow-sm"
                />
              </div>
            </div>
            
            {/* Unified Filter & Sorting Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Sleek Segmented Status Pills */}
              <div className="inline-flex items-center gap-1 rounded-2xl bg-muted/40 p-1 border border-border/40 backdrop-blur-sm overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    filterStatus === "all"
                      ? "bg-background text-foreground shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>All</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                    filterStatus === "all" ? "bg-primary/15 text-primary font-bold" : "bg-muted text-muted-foreground"
                  )}>
                    {invoiceCounts.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("overdue")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    filterStatus === "overdue"
                      ? "bg-rose-500 text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                  )}
                >
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>Overdue</span>
                  {invoiceCounts.overdue > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                      filterStatus === "overdue" ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-400"
                    )}>
                      {invoiceCounts.overdue}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("under_review")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    filterStatus === "under_review"
                      ? "bg-amber-500 text-zinc-950 shadow-sm font-black"
                      : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <Clock className="size-3.5 shrink-0" />
                  <span>Needs Verification</span>
                  {invoiceCounts.underReview > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                      filterStatus === "under_review" ? "bg-black/20 text-zinc-950" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {invoiceCounts.underReview}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("pending")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    filterStatus === "pending"
                      ? "bg-background text-foreground shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>Awaiting</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                    filterStatus === "pending" ? "bg-muted-foreground/20 text-foreground font-bold" : "bg-muted text-muted-foreground"
                  )}>
                    {invoiceCounts.pending}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus("paid")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                    filterStatus === "paid" || filterStatus === "paid_all"
                      ? "bg-emerald-600 text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                  )}
                >
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>Paid</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold",
                    filterStatus === "paid" || filterStatus === "paid_all" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {invoiceCounts.paid}
                  </span>
                </button>
              </div>

              {/* Method & Sorting Filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="rounded-xl border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-all hover:bg-background hover:border-border focus:border-primary/50 shadow-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="gcash">GCash</option>
                  <option value="in_person">Cash / In-Person</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground outline-none transition-all hover:bg-background hover:border-border focus:border-primary/50 shadow-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="tenant_az">Tenant (A-Z)</option>
                  <option value="highest_amount">Highest Amount</option>
                  <option value="lowest_amount">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto pr-2">
          {loading && <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/50 bg-background/50 py-16 text-muted-foreground"><LoadingSpinner size="md" className="mb-4 text-primary" /><p className="text-sm font-black uppercase tracking-widest text-foreground">Loading invoices...</p></div>}
          {!loading && processedInvoices.map((invoice) => (
            <button key={invoice.id} onClick={() => setSelectedInvoiceId(invoice.id)} className="group w-full rounded-[2rem] border border-border/50 bg-background/80 p-6 shadow-sm backdrop-blur-md transition-all hover:scale-[1.01] hover:border-primary/30 hover:bg-card hover:shadow-md md:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-black tracking-tight text-foreground">{invoice.invoiceNumber}</p>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const config = getStatusConfig(invoice.workflowStatus ?? invoice.status);
                          return (
                            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm", config.classes)}>
                              <div className="mr-1.5 size-1 rounded-full bg-current animate-pulse" />
                              {config.label}
                            </span>
                          );
                        })()}
                        {invoice.proofStatus === "submitted" && (
                          <span className="relative overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-500 shadow-sm">
                            <span className="absolute inset-0 -translate-x-[100%] animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            Proof Attached
                          </span>
                        )}
                        {invoice.hasRefundRequest && (
                          <span className="relative overflow-hidden rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-500 shadow-sm">
                            <span className="absolute inset-0 -translate-x-[100%] animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            Refund Details Sent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-black text-muted-foreground">
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
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] neumorphic-panel p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all" tabIndex={-1} aria-labelledby="ledger-overview-heading">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-primary">Overview</p>
                <h2 id="ledger-overview-heading" className="mt-2 text-2xl font-black text-foreground lg:text-3xl">Financial Ledger</h2>
              </div>
              <button 
                type="button"
                onClick={handleExportCSV}
                className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-xs sm:text-sm font-black transition-all neumorphic-extruded active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-muted-foreground hover:text-foreground"
                aria-label="Export ledger data as CSV format"
              >
                <Download className="size-4 text-primary" aria-hidden="true" />
                Export Ledger (CSV)
              </button>
            </div>
          </div>
          <div className="rounded-[2.5rem] neumorphic-inset p-4 sm:p-6 md:p-8 custom-scrollbar overflow-y-auto max-h-[500px] space-y-4">
            {expenses.length === 0 && invoices.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-sm font-medium text-muted-foreground transition-transform hover:scale-105 duration-300">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl neumorphic-inset-card text-primary mb-5 transition-transform hover:rotate-3">
                    <FileText className="size-8" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-black text-foreground">No entries yet.</p>
                  <p className="mt-2 text-xs sm:text-sm max-w-md mx-auto">Your timeline of paid invoices and recorded expenses will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-5" role="feed" aria-label="Ledger entries timeline">
                    {[...expenses.map(expense => ({ id: expense.id, type: 'expense' as const, date: new Date(expense.date_incurred), amount: expense.amount, label: expense.category, desc: expense.description })), ...invoices.filter(invoice => invoice.status === 'paid' || invoice.status === 'receipted' || invoice.status === 'confirmed').map(invoice => ({ id: invoice.id, type: 'income' as const, date: new Date(invoice.issuedDate), amount: invoice.amount, label: `Rent Payment`, desc: `Invoice ${invoice.invoiceNumber}` }))]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((ledgerEntry) => (
                        <div key={`${ledgerEntry.type}-${ledgerEntry.id}`} className="group flex items-center justify-between rounded-2xl neumorphic-extruded p-4 sm:p-5 transition-all hover:scale-[1.01]" role="article" aria-label={`${ledgerEntry.type === 'income' ? 'Income' : 'Expense'} entry: ${ledgerEntry.label} for PHP ${ledgerEntry.amount}`}>
                            <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0 pr-4">
                                <div className={cn("flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl neumorphic-inset-card shadow-inner transition-transform group-hover:scale-110", ledgerEntry.type === 'income' ? 'text-emerald-500' : 'text-rose-500')} aria-hidden="true">
                                    {ledgerEntry.type === 'income' ? <Plus className="size-5 sm:size-6" /> : <Filter className="size-5 sm:size-6" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-black text-foreground capitalize truncate group-hover:text-primary transition-colors">{ledgerEntry.label}</p>
                                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5 truncate" suppressHydrationWarning>
                                      {ledgerEntry.desc} ? <span suppressHydrationWarning>{ledgerEntry.date.toLocaleDateString()}</span>
                                    </p>
                                </div>
                            </div>
                            <p className={cn("text-sm sm:text-base font-black shrink-0 whitespace-nowrap", ledgerEntry.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                                {ledgerEntry.type === 'income' ? '+' : '-'}{formatPhpCurrency(ledgerEntry.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Outflow</p>
                <h2 className="mt-2 text-2xl font-black text-foreground lg:text-3xl">Expense Log</h2>
              </div>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-sm transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
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
                  <p className="text-lg font-black text-foreground">No expenses recorded yet.</p>
                  <p className="mt-2 max-w-md mx-auto">Click &quot;Record Expense&quot; to log maintenance costs, utility bills you cover, and property taxes to keep your accounting accurate.</p>
                </div>
            ) : (
                expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-5 transition-all hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                                <Filter className="size-5" />
                            </div>
                            <div suppressHydrationWarning>
                                <p className="text-sm font-black text-foreground capitalize">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">{expense.description}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Incurred: <ClientOnlyDate date={expense.date_incurred} /></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-black text-foreground">{formatPhpCurrency(expense.amount)}</p>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

      <InvoiceModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} onUpdated={loadData} />
      <RecordExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSaved={loadData} />
    </div>
  );
}

function HeroStat({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="group rounded-[2rem] border border-border/50 bg-background/60 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-background/80 hover:border-border/80">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={cn("mt-3 text-3xl font-black md:text-2xl lg:text-3xl", highlight ?? "text-foreground")}>{value}</p>
    </div>
  );
}

function LedgerMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
      <p className={cn("whitespace-nowrap text-base font-black lg:text-lg tracking-tight", highlight ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}
