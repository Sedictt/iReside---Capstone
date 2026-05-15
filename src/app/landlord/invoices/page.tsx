"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, FileText, Loader2, Plus, Search, Filter, Download } from "lucide-react";

import { InvoiceModal } from "@/components/landlord/invoices/InvoiceModal";
import { RecordExpenseModal } from "@/components/landlord/invoices/RecordExpenseModal";
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
    const invoiceId = searchParams?.get("id");
    if (invoiceId) {
      setSelectedInvoiceId(invoiceId);
      setActiveTab("invoices");
    }
  }, [searchParams]);

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
        {(["ledger", "invoices", "expenses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2",
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
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Ledger</p>
              <h2 className="mt-2 text-2xl font-black text-foreground lg:text-3xl">Issued invoices</h2>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." className="w-full rounded-full border border-border/50 bg-background/80 py-3 pl-11 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-background shadow-sm" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-background/40 p-3">
            <div className="flex items-center gap-2 text-sm font-black text-muted-foreground border-r border-border/50 pr-4">
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
          {loading && <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border/50 bg-background/50 py-16 text-muted-foreground"><Loader2 className="mb-4 size-8 animate-spin text-primary" /><p className="text-sm font-black uppercase tracking-widest text-foreground">Loading invoices...</p></div>}
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
        <div className="flex min-h-[50vh] flex-col rounded-[2.5rem] border border-border/50 bg-card/60 p-8 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-6 flex shrink-0 flex-col gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Overview</p>
                <h2 className="mt-2 text-2xl font-black text-foreground lg:text-3xl">Financial Ledger</h2>
              </div>
              <button 
                onClick={handleExportCSV}
                className="group inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-background/80 px-6 py-3 text-sm font-black shadow-sm transition-all hover:bg-muted active:scale-95"
              >
                <Download className="size-4 text-primary" />
                Export Ledger (CSV)
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border/50 bg-background/50 p-8 shadow-inner custom-scrollbar overflow-y-auto max-h-[500px] space-y-4">
            {expenses.length === 0 && invoices.length === 0 ? (
                <div className="p-12 text-center text-sm font-medium text-muted-foreground">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                    <FileText className="size-8" />
                  </div>
                  <p className="text-lg font-black text-foreground">No entries yet.</p>
                  <p className="mt-2 max-w-md mx-auto">Your timeline of paid invoices and recorded expenses will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {[...expenses.map(expense => ({ id: expense.id, type: 'expense' as const, date: new Date(expense.date_incurred), amount: expense.amount, label: expense.category, desc: expense.description })), ...invoices.filter(invoice => invoice.status === 'paid' || invoice.status === 'receipted' || invoice.status === 'confirmed').map(invoice => ({ id: invoice.id, type: 'income' as const, date: new Date(invoice.issuedDate), amount: invoice.amount, label: `Rent Payment`, desc: `Invoice ${invoice.invoiceNumber}` }))]
                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                    .map((ledgerEntry) => (
                        <div key={`${ledgerEntry.type}-${ledgerEntry.id}`} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-5">
                            <div className="flex items-center gap-4">
                                <div className={cn("flex size-10 items-center justify-center rounded-full", ledgerEntry.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')}>
                                    {ledgerEntry.type === 'income' ? <Plus className="size-5" /> : <Filter className="size-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground capitalize">{ledgerEntry.label}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground" suppressHydrationWarning>{ledgerEntry.desc} ? <span suppressHydrationWarning>{ledgerEntry.date.toLocaleDateString()}</span></p>
                                </div>
                            </div>
                            <p className={cn("text-base font-black", ledgerEntry.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
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
