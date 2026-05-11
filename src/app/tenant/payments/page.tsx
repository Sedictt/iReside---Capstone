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
    UserCircle, 
    Download,
    FileJson,
    FileSpreadsheet,
    FileCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

import type { InvoiceListItem, InvoiceReadingDetail } from "@/lib/billing/server";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

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
    upcomingMonths: Array<{
        month: string;
        monthLabel: string;
        amount: number;
        dueDate: string;
        invoiceId: string | null;
        isForecast: boolean;
        status: string | null;
    }>;
};

type TabId = "bill" | "consumption" | "history";

export default function FinanceHubPage() {
    const { push } = useRouter();
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
        console.log("handlePayInAdvance triggered");
        setCreatingAdvance(true);
        try {
            const response = await fetch("/api/tenant/payments/advance", {
                method: "POST",
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error creating advance payment:", errorData);
                alert(`Error: ${errorData.error || "Failed to create advance payment"}`);
                return;
            }

            const data = await response.json();
            console.log("Advance payment created:", data);
            
            // Handle new multi-month format (data.invoices) or old format (data.id)
            const invoiceId = data.id || (data.invoices?.[0]?.invoiceId);
            
            if (invoiceId) {
                const checkoutUrl = `/tenant/payments/${invoiceId}/checkout`;
                console.log("Redirecting to:", checkoutUrl);
                push(checkoutUrl);
            } else {
                console.error("No ID returned from advance payment API", data);
                alert("Critical error: Server did not return a valid invoice ID.");
            }
        } catch (error) {
            console.error("Network or execution error in handlePayInAdvance:", error);
            alert("Network error: Could not connect to the billing service.");
        } finally {
            setCreatingAdvance(false);
        }
    };

    const handleExportCSV = () => {
        if (!payload?.history || payload.history.length === 0) return;

        const headers = ["Invoice #", "Type", "Status", "Due Date", "Amount"];
        const rows = payload.history.map(inv => [
            inv.invoiceNumber,
            inv.type,
            inv.status,
            inv.dueDate,
            inv.amount.toString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ireside_payment_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!payload?.history || payload.history.length === 0) return;

        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        
        // Branding Header
        doc.setFontSize(22);
        doc.setTextColor(109, 152, 56); // Primary Color (Sage Green)
        doc.text("iReside", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("TENANT PAYMENT HISTORY STATEMENT", 14, 28);
        doc.text(`Generated on: ${dateStr}`, 14, 34);

        // Property Info
        doc.setDrawColor(230);
        doc.line(14, 40, 196, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(payload.lease?.propertyName || "Property Name", 14, 50);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Unit: ${payload.lease?.unitName || "N/A"}`, 14, 56);
        doc.text(`Lease ID: ${payload.lease?.id || "N/A"}`, 14, 62);

        // Table Header
        let yPos = 75;
        doc.setFillColor(245, 245, 245);
        doc.rect(14, yPos - 5, 182, 8, "F");
        
        doc.setFont("helvetica", "bold");
        doc.text("Invoice #", 16, yPos);
        doc.text("Type", 60, yPos);
        doc.text("Status", 100, yPos);
        doc.text("Due Date", 140, yPos);
        doc.text("Amount", 175, yPos);

        doc.line(14, yPos + 3, 196, yPos + 3);
        yPos += 12;

        // Table Content
        doc.setFont("helvetica", "normal");
        payload.history.forEach((inv, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.text(inv.invoiceNumber, 16, yPos);
            doc.text(inv.type, 60, yPos);
            
            // Color code status
            if (inv.status === 'paid') doc.setTextColor(0, 150, 0);
            else if (inv.status === 'overdue') doc.setTextColor(200, 0, 0);
            else doc.setTextColor(100);
            
            doc.text(inv.status.toUpperCase(), 100, yPos);
            doc.setTextColor(0);
            
            doc.text(inv.dueDate, 140, yPos);
            doc.text(formatPhpCurrency(inv.amount), 175, yPos);
            
            doc.setDrawColor(245);
            doc.line(14, yPos + 3, 196, yPos + 3);
            yPos += 10;
        });

        // Summary
        yPos += 10;
        const totalPaid = payload.history
            .filter(h => h.status === 'paid')
            .reduce((sum, h) => sum + h.amount, 0);
            
        doc.setFillColor(245, 250, 245);
        doc.rect(130, yPos - 5, 66, 15, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Total Settled:", 135, yPos + 4);
        doc.setTextColor(109, 152, 56);
        doc.text(formatPhpCurrency(totalPaid), 165, yPos + 4);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("This is a system-generated statement. No signature required.", 105, 285, { align: "center" });

        doc.save(`ireside_payment_history_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest">Synchronizing Hub...</p>
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
                    <h1 className="text-4xl font-bold text-foreground tracking-tighter">
                        Finance Hub
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm max-w-2xl">
                        Monitor your standard rent, utility consumption, and end-to-end payment history.
                    </p>
                </div>

                {nextPayment ? (
                    <div className="bg-card border border-border rounded-[1.5rem] p-3 shadow-sm flex items-center gap-6 ring-1 ring-primary/5 animate-in fade-in zoom-in duration-500">
                        <div className="px-1 border-r border-border/50">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Balance Due</p>
                            <p className="text-lg font-bold text-foreground tracking-tight">
                                {formatPhpCurrency(nextPayment.balanceRemaining)}
                            </p>
                        </div>
                        <Link 
                            href={`/tenant/payments/${nextPayment.id}/checkout`}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 flex items-center gap-2 shrink-0"
                        >
                            Pay Now <ArrowRight className="size-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="bg-primary/[0.03] border border-primary/20 rounded-[1.5rem] p-3 flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="px-1 border-r border-primary/10">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-0.5">Next Cycle Early</p>
                            <p className="text-lg font-bold text-foreground tracking-tight">
                                {formatPhpCurrency(lease?.monthlyRent ?? 0)}
                            </p>
                        </div>
                        <button 
                            onClick={handlePayInAdvance}
                            disabled={creatingAdvance}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 shrink-0 disabled:opacity-50"
                        >
                            {creatingAdvance ? <Loader2 className="size-4 animate-spin" /> : <>Pay Next Cycle Now <ArrowRight className="size-4" /></>}
                        </button>
                    </div>
                )}
            </div>

            {/* Upcoming Months Preview */}
            {payload?.upcomingMonths && payload.upcomingMonths.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {payload.upcomingMonths.map((month) => (
                        <div 
                            key={month.month}
                            className={cn(
                                "rounded-2xl p-4 border",
                                month.isForecast 
                                    ? "bg-muted/30 border-border/50" 
                                    : "bg-primary/5 border-primary/20"
                            )}
                        >
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {month.monthLabel}
                            </p>
                            <p className="text-lg font-bold text-foreground mt-1">
                                {formatPhpCurrency(month.amount)}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                                {month.isForecast ? (
                                    <span className="text-[9px] font-medium text-muted-foreground">Estimated</span>
                                ) : (
                                    <span className="text-[9px] font-medium text-primary">Ready to Pay</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Unified Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0",
                            activeTab === tab.id 
                                ? "bg-card text-primary shadow-sm border border-border" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <tab.icon className="size-4" />
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
                                    <Receipt className="size-48" />
                                </div>
                                
                                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-0.5">Statement Cycle</p>
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                            {nextPayment ? nextPayment.invoiceNumber : `Upcoming Cycle: ${getNextBillingMonth()}`}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            {nextPayment ? (
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                                                    nextPayment.status === 'overdue' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                                )}>
                                                    {nextPayment.status}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-muted text-muted-foreground border-border">
                                                    Forecasted
                                                </span>
                                            )}
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {nextPayment ? "Active Bill" : "Forecasted Obligation"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-0.5">Estimated Due</p>
                                        <p className="text-base font-bold text-foreground">
                                            {nextPayment ? nextPayment.dueDate : "1st of the Month"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-3 group border-b border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                <Home className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Monthly Base Rent</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Fixed Lease Obligation</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-foreground">
                                            {nextPayment 
                                                ? formatPhpCurrency(nextPayment.paymentItems?.find(i => i.category === 'rent')?.amount ?? lease?.monthlyRent ?? 0)
                                                : formatPhpCurrency(lease?.monthlyRent ?? 0)}
                                        </p>
                                    </div>

                                    {nextPayment?.paymentItems?.filter(i => i.category !== 'rent').map((item) => (
                                        <div key={item.id} className="flex items-center justify-between py-3 group border-b border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                    {item.label.toLowerCase().includes('electric') ? <Zap className="size-5" /> : <Droplets className="size-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Calculated via Submeter</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">{formatPhpCurrency(item.amount)}</p>
                                        </div>
                                    ))}

                                    {!nextPayment && (
                                        <>
                                            <div className="flex items-center justify-between py-3 opacity-40">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                        <Zap className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">Electricity Bill</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Awaiting Meter Reading</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-foreground italic">Pending...</p>
                                            </div>
                                            <div className="flex items-center justify-between py-3 opacity-40">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border">
                                                        <Droplets className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">Water Bill</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">Awaiting Meter Reading</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-foreground italic">Pending...</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-primary uppercase tracking-[0.3em]">
                                                {nextPayment ? "Total Balance Due" : "Estimated Total Obligation"}
                                            </p>
                                            {!nextPayment && <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Excludes pending utility computations</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <p className="text-4xl font-bold text-primary tracking-tighter">
                                                {nextPayment ? formatPhpCurrency(nextPayment.amount) : formatPhpCurrency(lease?.monthlyRent ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "consumption" && (
                            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[400px]">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] select-none pointer-events-none">
                                    <TrendingUp className="size-48" />
                                </div>
                                <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-0.5">Utility Analysis</p>
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Consumption Metrics</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-0.5">Last Reading</p>
                                        <p className="text-base font-bold text-foreground">{activeReadings.length > 0 ? <ClientOnlyDate date={activeReadings[0].billing_period_end} /> : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {activeReadings.length > 0 ? (
                                        activeReadings.map((reading) => (
                                            <div key={reading.id} className="p-6 rounded-3xl bg-muted/20 border border-border/50 group hover:border-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "size-10 rounded-2xl flex items-center justify-center shadow-inner border",
                                                            reading.utility_type === 'electricity' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                        )}>
                                                            {reading.utility_type === 'electricity' ? <Zap className="size-5" /> : <Droplets className="size-5" />}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-bold text-foreground capitalize tracking-tight">{reading.utility_type}</h3>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">₱{reading.billed_rate.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-foreground tracking-tighter">{reading.usage.toFixed(1)}</p>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Units</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 border-t border-border/30 pt-4 mb-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Prev</p>
                                                        <p className="text-base font-bold text-foreground/40">{reading.previous_reading.toFixed(1)}</p>
                                                    </div>
                                                    <div className="space-y-0.5 text-right">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Curr</p>
                                                        <p className="text-base font-bold text-foreground">{reading.current_reading.toFixed(1)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 group-hover:bg-primary/[0.02] transition-colors">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Charge</p>
                                                    <p className="text-lg font-bold text-foreground">{formatPhpCurrency(reading.computed_charge)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-24 text-center opacity-40">
                                            <TrendingUp className="size-12 mx-auto mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No consumption records found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="bg-card border border-border rounded-[2.5rem] p-0 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[400px]">
                                <div className="p-8 border-b border-border bg-muted/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mb-0.5">Audit Trail</p>
                                        <h3 className="text-2xl font-bold text-foreground tracking-tight">Payment Ledger</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-background border border-border p-1 rounded-full">
                                            <button 
                                                onClick={handleExportPDF}
                                                className="flex items-center gap-1.5 hover:bg-muted text-foreground px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all"
                                                title="Professional Statement"
                                            >
                                                <FileText className="size-3 text-primary" />
                                                PDF
                                            </button>
                                            <button 
                                                onClick={handleExportCSV}
                                                className="flex items-center gap-1.5 hover:bg-muted text-foreground px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all"
                                                title="Data Spreadsheet"
                                            >
                                                <FileSpreadsheet className="size-3 text-muted-foreground" />
                                                CSV
                                            </button>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-background border border-border px-4 py-1.5 rounded-full">{history.length} Records</span>
                                    </div>
                                </div>
                                
                                <div className="divide-y divide-border/50">
                                    {history.length > 0 ? (
                                        history.map((invoice) => (
                                            <div key={invoice.id} className="p-6 hover:bg-primary/[0.01] transition-all flex items-center justify-between gap-8 group">
                                                <div className="flex items-center gap-6">
                                                    <div className="size-12 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                                                        <FileText className="size-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{invoice.invoiceNumber}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{invoice.type}</span>
                                                            <span className="size-1 rounded-full bg-border" />
                                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{invoice.dueDate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold text-foreground tracking-tighter">{formatPhpCurrency(invoice.amount)}</p>
                                                        <div className="flex items-center justify-end gap-2 mt-1.5">
                                                            {invoice.hasReceipt && (
                                                                <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase tracking-widest" title="Official Receipt Available">
                                                                    <FileCheck className="size-3" />
                                                                    Receipted
                                                                </div>
                                                            )}
                                                            <div className={cn(
                                                                "inline-block px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                                                                invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                                                            )}>
                                                                {invoice.status}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link 
                                                        href={`/tenant/payments/${invoice.id}/checkout`}
                                                        className={cn(
                                                            "size-10 rounded-xl border flex items-center justify-center transition-all",
                                                            invoice.status === 'paid' 
                                                                ? "bg-muted/50 border-border hover:bg-primary/10 hover:border-primary/20 hover:text-primary" 
                                                                : "bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white"
                                                        )}
                                                        title={invoice.status === 'paid' ? "View Summary" : "Pay Now"}
                                                    >
                                                        {invoice.status === 'paid' ? <ArrowUpRight className="size-5" /> : <CreditCard className="size-4" />}
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-32 text-center opacity-40">
                                            <History className="size-12 mx-auto mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No historical records found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uniform Sidebar Column (Right) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contextual Action/Info Card */}
                        <div className="bg-card border border-border rounded-[2rem] p-10 flex flex-col gap-8 shadow-sm ring-1 ring-border">
                            {activeTab === 'bill' && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Clock className="size-4 text-primary" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Planning Guide</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Budgeting for next cycle</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Billing Policy</p>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="size-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <p className="text-[9px] text-foreground font-bold uppercase tracking-wider leading-tight">Fixed Rent: {formatPhpCurrency(lease?.monthlyRent ?? 0)}</p>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="size-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <p className="text-[9px] text-foreground font-bold uppercase tracking-wider leading-tight">Submetered Utilities Monthly</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                                <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-[9px] text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider leading-relaxed">
                                                    Pro-tip: Set aside {formatPhpCurrency((lease?.monthlyRent ?? 0) * 1.1)} for utilities.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'consumption' && (
                                <>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Zap className="size-4 text-primary" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Rate Information</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Understanding Charges</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Landlord-set Rates</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Electricity</p>
                                                    <p className="text-xs font-bold text-foreground">₱12.50 / kWh</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Water</p>
                                                    <p className="text-xs font-bold text-foreground">₱45.00 / m³</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
                                            <div className="flex items-start gap-3">
                                                <UserCircle className="size-4 text-primary shrink-0 mt-0.5" />
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
                                            <History className="size-4 text-primary" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Ledger Overview</h3>
                                        </div>
                                        <p className="text-xs font-bold text-foreground">Financial Standing</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-5 rounded-3xl bg-muted/30 border border-border">
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Stats</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Paid Invoices</p>
                                                    <p className="text-xs font-bold text-foreground">{history.filter(h => h.status === 'paid').length}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Total Settle</p>
                                                    <p className="text-xs font-bold text-primary">₱{history.filter(h => h.status === 'paid').reduce((sum, h) => sum + h.amount, 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Link 
                                            href="/tenant/messages"
                                            className="w-full bg-muted hover:bg-muted-dark text-foreground py-6 px-8 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] border border-border transition-all flex items-center justify-center gap-4"
                                        >
                                            Contact Support <HelpCircle className="size-5" />
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Property Context Card */}
                        <div className="bg-muted/20 border border-dashed border-border rounded-[2rem] p-6 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Managed Unit</p>
                            <p className="text-sm font-bold text-foreground">{lease?.unitName ?? '...'}</p>
                            <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{lease?.propertyName ?? '...'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

