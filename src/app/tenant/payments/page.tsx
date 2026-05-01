"use client";

import { useEffect, useState } from "react";
import { 
    ArrowRight, 
    CheckCircle2, 
    History, 
    Loader2, 
    Receipt, 
    Droplets, 
    Zap, 
    Calendar,
    TrendingUp,
    FileText,
    CreditCard,
    ArrowUpRight,
    AlertCircle,
    LayoutDashboard,
    Home,
    Clock,
    Info,
    CreditCard as PaymentIcon,
    ShieldCheck,
    HelpCircle,
    UserCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { InvoiceListItem, InvoiceReadingDetail } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";

type EnrichedInvoice = InvoiceListItem & { 
    paymentItems?: Array<{ id: string; label: string; amount: number; category: string }>;
    readings?: InvoiceReadingDetail[];
};

type PaymentsPayload = {
    nextPayment: EnrichedInvoice | null;
    history: EnrichedInvoice[];
    lease: {
        id: string;
        monthlyRent: number;
        propertyName: string;
        unitName: string;
    } | null;
};

type TabId = "bill" | "consumption" | "history";

export default function FinanceHubPage() {
    const router = useRouter();
    const [payload, setPayload] = useState<PaymentsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingAdvance, setCreatingAdvance] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("bill");

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const response = await fetch("/api/tenant/payments", { cache: "no-store" });
                if (!response.ok) throw new Error();
                const next = (await response.json()) as PaymentsPayload;
                if (alive) setPayload(next);
            } catch (error) {
                console.error("Error fetching finance data:", error);
            } finally {
                if (alive) setLoading(false);
            }
        };
        void load();
        return () => {
            alive = false;
        };
    }, []);

    const handlePayInAdvance = async () => {
        setCreatingAdvance(true);
        try {
            const response = await fetch("/api/tenant/payments/advance", {
                method: "POST",
            });
            const data = await response.json();
            if (data.id) {
                router.push(`/tenant/payments/${data.id}/checkout`);
            }
        } catch (error) {
            console.error("Error creating advance payment:", error);
        } finally {
            setCreatingAdvance(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">Synchronizing Hub...</p>
            </div>
        );
    }

    const nextPayment = payload?.nextPayment ?? null;
    const history = payload?.history ?? [];
    const lease = payload?.lease ?? null;
    const latestHistoryWithReadings = history.find(h => h.readings && h.readings.length > 0);
    const activeReadings = nextPayment?.readings?.length ? nextPayment.readings : (latestHistoryWithReadings?.readings ?? []);

    const tabs: { id: TabId; label: string; icon: any }[] = [
        { id: "bill", label: "Current Bill", icon: Receipt },
        { id: "consumption", label: "Usage & Readings", icon: TrendingUp },
        { id: "history", label: "Payment History", icon: History },
    ];

    const getNextBillingMonth = () => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        return next.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            {/* Standard Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">
                        Finance Hub
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm max-w-2xl">
                        Monitor your standard rent, utility consumption, and end-to-end payment history.
                    </p>
                </div>

                {nextPayment && (
                    <div className="bg-card border border-border rounded-[1.5rem] p-3 shadow-sm flex items-center gap-6 ring-1 ring-primary/5">
                        <div className="px-1 border-r border-border/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Balance Due</p>
                            <p className="text-lg font-black text-foreground tracking-tight">
                                {formatPhpCurrency(nextPayment.balanceRemaining)}
                            </p>
                        </div>
                        <Link 
                            href={`/tenant/payments/${nextPayment.id}/checkout`}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 flex items-center gap-2 shrink-0"
                        >
                            Settle Now <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Unified Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
                            activeTab === tab.id 
                                ? "bg-card text-primary shadow-sm border border-border" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Unified Content Area */}
            <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    
                    {/* Main Content Column (Left) */}
                    <div className="lg:col-span-3 space-y-8">
                        {activeTab === "bill" && (
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] select-none pointer-events-none">
                                    <Receipt className="w-48 h-48" />
                                </div>
                                
                                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Statement Cycle</p>
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">
                                            {nextPayment ? nextPayment.invoiceNumber : `Upcoming Cycle: ${getNextBillingMonth()}`}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            {nextPayment ? (
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    nextPayment.status === 'overdue' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                                )}>
                                                    {nextPayment.status}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-muted text-muted-foreground border-border">
                                                    Forecasted
                                                </span>
                                            )}
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {nextPayment ? "Active Bill" : "Forecasted Obligation"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Estimated Due</p>
                                        <p className="text-base font-black text-foreground">
                                            {nextPayment ? nextPayment.dueDate : "1st of the Month"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-3 group border-b border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                <Home className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">Monthly Base Rent</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Fixed Lease Obligation</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-foreground">
                                            {nextPayment 
                                                ? formatPhpCurrency(nextPayment.paymentItems?.find(i => i.category === 'rent')?.amount ?? lease?.monthlyRent ?? 0)
                                                : formatPhpCurrency(lease?.monthlyRent ?? 0)}
                                        </p>
                                    </div>

                                    {nextPayment?.paymentItems?.filter(i => i.category !== 'rent').map((item) => (
                                        <div key={item.id} className="flex items-center justify-between py-3 group border-b border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                    {item.label.toLowerCase().includes('electric') ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Calculated via Submeter</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-black text-foreground">{formatPhpCurrency(item.amount)}</p>
                                        </div>
                                    ))}

                                    {!nextPayment && (
                                        <>
                                            <div className="flex items-center justify-between py-3 opacity-40">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                        <Zap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-foreground">Electricity Bill</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Awaiting Meter Reading</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-foreground italic">Pending...</p>
                                            </div>
                                            <div className="flex items-center justify-between py-3 opacity-40">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                        <Droplets className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-foreground">Water Bill</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Awaiting Meter Reading</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-foreground italic">Pending...</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">
                                                {nextPayment ? "Total Balance Due" : "Estimated Total Obligation"}
                                            </p>
                                            {!nextPayment && <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Excludes pending utility computations</p>}
                                        </div>
                                        <p className="text-4xl font-black text-primary tracking-tighter">
                                            {nextPayment ? formatPhpCurrency(nextPayment.amount) : formatPhpCurrency(lease?.monthlyRent ?? 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "consumption" && (
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[400px]">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] select-none pointer-events-none">
                                    <TrendingUp className="w-48 h-48" />
                                </div>
                                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Utility Analysis</p>
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">Consumption Metrics</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Last Reading</p>
                                        <p className="text-base font-black text-foreground">{activeReadings.length > 0 ? new Date(activeReadings[0].billing_period_end).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {activeReadings.length > 0 ? (
                                        activeReadings.map((reading) => (
                                            <div key={reading.id} className="p-6 rounded-3xl bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner border",
                                                            reading.utility_type === 'electricity' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                        )}>
                                                            {reading.utility_type === 'electricity' ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-foreground capitalize tracking-tight">{reading.utility_type}</h3>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">₱{reading.billed_rate.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-foreground tracking-tighter">{reading.usage.toFixed(1)}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Units</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 border-t border-border/30 pt-4 mb-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prev</p>
                                                        <p className="text-base font-black text-foreground/40">{reading.previous_reading.toFixed(1)}</p>
                                                    </div>
                                                    <div className="space-y-0.5 text-right">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Curr</p>
                                                        <p className="text-base font-black text-foreground">{reading.current_reading.toFixed(1)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 group-hover:bg-primary/[0.02] transition-colors">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Charge</p>
                                                    <p className="text-lg font-black text-foreground">{formatPhpCurrency(reading.computed_charge)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-24 text-center opacity-40">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">No consumption records found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="bg-card border border-border rounded-[2.5rem] p-0 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[400px]">
                                <div className="p-8 border-b border-border bg-muted/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-0.5">Audit Trail</p>
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">Payment Ledger</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground bg-background border border-border px-4 py-1.5 rounded-full">{history.length} Total Records</span>
                                </div>
                                
                                <div className="divide-y divide-border/50">
                                    {history.length > 0 ? (
                                        history.map((invoice) => (
                                            <div key={invoice.id} className="p-6 hover:bg-primary/[0.01] transition-all flex items-center justify-between gap-8 group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                                                        <FileText className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{invoice.invoiceNumber}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{invoice.type}</span>
                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{invoice.dueDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-foreground tracking-tighter">{formatPhpCurrency(invoice.amount)}</p>
                                                        <div className={cn(
                                                            "inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border mt-1.5",
                                                            invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                                                        )}>
                                                            {invoice.status}
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        href={`/tenant/payments/${invoice.id}`}
                                                        className="w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all"
                                                    >
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-32 text-center opacity-40">
                                            <History className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">No historical records found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uniform Sidebar Column (Right) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contextual Action/Info Card */}
                        <div className="bg-card border border-border rounded-[2rem] p-8 flex flex-col gap-6 shadow-sm ring-1 ring-border">
                            {activeTab === 'bill' && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Planning Guide</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Budgeting for next cycle</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Billing Policy</p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <p className="text-[9px] text-foreground font-black uppercase tracking-wider leading-tight">Fixed Rent: {formatPhpCurrency(lease?.monthlyRent ?? 0)}</p>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <p className="text-[9px] text-foreground font-black uppercase tracking-wider leading-tight">Submetered Utilities Monthly</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-[9px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                                                    Pro-tip: Set aside {formatPhpCurrency((lease?.monthlyRent ?? 0) * 1.1)} for utilities.
                                                </p>
                                            </div>
                                            {!nextPayment && (
                                                <button 
                                                    onClick={handlePayInAdvance}
                                                    disabled={creatingAdvance}
                                                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2.5 disabled:opacity-50"
                                                >
                                                    {creatingAdvance ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pay Rent in Advance <PaymentIcon className="w-4 h-4" /></>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'consumption' && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Zap className="w-4 h-4 text-primary" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rate Information</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Understanding Charges</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Landlord-set Rates</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Electricity</p>
                                                    <p className="text-xs font-black text-foreground">₱12.50 / kWh</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Water</p>
                                                    <p className="text-xs font-black text-foreground">₱45.00 / m³</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
                                            <div className="flex items-start gap-3">
                                                <UserCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                <p className="text-[9px] text-primary font-bold uppercase tracking-wider leading-relaxed">
                                                    Rates and meter readings are managed and provided directly by your Landlord.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'history' && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <History className="w-4 h-4 text-primary" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ledger Overview</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Financial Standing</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Stats</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Paid Invoices</p>
                                                    <p className="text-xs font-black text-foreground">{history.filter(h => h.status === 'paid').length}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Total Settle</p>
                                                    <p className="text-xs font-black text-primary">₱{history.filter(h => h.status === 'paid').reduce((sum, h) => sum + h.amount, 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Link 
                                            href="/tenant/messages"
                                            className="w-full bg-muted hover:bg-muted-dark text-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border transition-all flex items-center justify-center gap-2.5"
                                        >
                                            Inquiry? Contact Support <HelpCircle className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Property Context Card */}
                        <div className="bg-muted/20 border border-dashed border-border rounded-[2rem] p-6 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Managed Unit</p>
                            <p className="text-sm font-black text-foreground">{lease?.unitName ?? '...'}</p>
                            <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{lease?.propertyName ?? '...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
