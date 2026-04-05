"use client";

import { X, FileText, Download, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface Invoice {
    id: string;
    tenant: string;
    property: string;
    unit: string;
    amount: number;
    dueDate: string;
    status: "paid" | "overdue" | "pending";
    type: string;
    issuedDate: string;
}

interface InvoiceModalProps {
    invoice: Invoice | null;
    onClose: () => void;
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
    useEffect(() => {
        if (invoice) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [invoice]);

    if (!invoice) return null;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "paid": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
            case "overdue": return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
            case "pending": return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
            default: return "border-border bg-muted text-muted-foreground";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "paid": return <CheckCircle2 className="w-4 h-4" />;
            case "overdue": return <AlertCircle className="w-4 h-4" />;
            case "pending": return <Clock className="w-4 h-4" />;
            default: return null;
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity dark:bg-black/80" onClick={onClose} />
            <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_28px_70px_-36px_rgba(15,23,42,0.45)] animate-in zoom-in-95 duration-200 dark:shadow-2xl">
                
                <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-[80%] -translate-x-1/2 bg-primary/16 blur-[100px] dark:bg-primary/20" />

                <div className="relative flex items-center justify-between border-b border-border bg-muted/35 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_10px_30px_-24px_rgba(var(--primary-rgb),0.65)]">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="mb-1 text-xl font-bold text-foreground">Invoice <span className="font-medium text-muted-foreground">#{invoice.id.split('-').pop()}</span></h2>
                            <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider", getStatusStyle(invoice.status))}>
                                {getStatusIcon(invoice.status)} {invoice.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl border border-border bg-background/75 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="relative flex-1 overflow-y-auto p-8 hide-scrollbar">
                    <div className="mb-10 grid grid-cols-1 gap-8 border-b border-border pb-8 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-muted-foreground/50" /> Billed From
                            </h3>
                            <div>
                                <p className="flex items-center gap-2 text-lg font-bold text-foreground">
                                    iReside Properties
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    123 Corporate Ave, Suite 400<br />
                                    Makati City, Metro Manila<br />
                                    <span className="mt-1 inline-block text-primary">billing@ireside.com</span>
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4 rounded-2xl border border-border bg-muted/35 p-5 md:text-left">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <span className="h-2 w-2 rounded-full bg-primary/50" /> Billed To
                            </h3>
                            <div>
                                <p className="text-lg font-bold text-foreground">{invoice.tenant}</p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    {invoice.property}<br />
                                    <span className="font-medium text-foreground">{invoice.unit}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10 flex flex-wrap gap-4">
                        <div className="group relative min-w-[140px] flex-1 overflow-hidden rounded-2xl border border-border bg-background/75 p-5 transition-colors hover:border-primary/15">
                            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.08] transition-transform group-hover:scale-110"><Clock className="h-16 w-16" /></div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Issue Date</p>
                            <p className="text-lg font-bold text-foreground">{new Date(invoice.issuedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        </div>
                        <div className="group relative min-w-[140px] flex-1 overflow-hidden rounded-2xl border border-border bg-background/75 p-5 transition-colors hover:border-primary/15">
                            <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-[0.08] transition-transform group-hover:scale-110"><AlertCircle className="h-16 w-16" /></div>
                            <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Due Date</p>
                            <p className={cn("text-lg font-bold", invoice.status === "overdue" ? "text-red-700 dark:text-red-300" : "text-foreground")}>
                                {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                        </div>
                        <div className="flex min-w-[200px] flex-[2] flex-col justify-end rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 to-primary/5 p-5">
                            <p className="mb-1 text-xs font-black uppercase tracking-wider text-primary/75">Total Due</p>
                            <p className="text-3xl font-black text-primary">₱{(invoice.status === "overdue" ? invoice.amount * 1.05 : invoice.amount).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-background/75">
                        <table className="w-full text-left">
                            <thead className="border-b border-border bg-muted/35">
                                <tr>
                                    <th className="p-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Description & Period</th>
                                    <th className="p-5 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr className="group transition-colors hover:bg-muted/20">
                                    <td className="p-5">
                                        <p className="text-[15px] font-bold text-foreground">{invoice.type} For {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                                        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                                            {new Date(invoice.issuedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </p>
                                    </td>
                                    <td className="p-5 text-right text-lg font-black text-foreground">
                                        ₱{invoice.amount.toLocaleString()}
                                    </td>
                                </tr>
                                {invoice.status === "overdue" && (
                                    <tr className="bg-red-500/[0.04] dark:bg-red-500/[0.02]">
                                        <td className="p-5">
                                            <p className="flex items-center gap-2 text-[15px] font-bold text-red-700 dark:text-red-300">
                                                <AlertCircle className="h-4 w-4" /> Late Payment Penalty
                                            </p>
                                            <p className="mt-1.5 text-sm text-red-700/80 dark:text-red-300/80">5% penalty applied for overdue balance.</p>
                                        </td>
                                        <td className="p-5 text-right text-lg font-black text-red-700 dark:text-red-300">
                                            ₱{(invoice.amount * 0.05).toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <div className="w-full space-y-4 rounded-2xl border border-border bg-muted/35 p-6 md:w-[320px]">
                            <div className="flex items-center justify-between font-medium text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="text-foreground">₱{invoice.amount.toLocaleString()}</span>
                            </div>
                            {invoice.status === "overdue" && (
                                <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-red-700 dark:text-red-300">
                                    <span>Late Fee (5%)</span>
                                    <span>+ ₱{(invoice.amount * 0.05).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="h-px w-full bg-border" />
                            <div className="flex items-end justify-between">
                                <span className="font-bold text-foreground">Total Due</span>
                                <span className="text-2xl font-black text-foreground">₱{(invoice.status === "overdue" ? invoice.amount * 1.05 : invoice.amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-muted/35 p-6">
                    <button onClick={onClose} className="flex h-11 items-center gap-2 rounded-xl border border-border px-5 font-medium text-foreground transition-colors hover:bg-muted">
                        Close
                    </button>
                    <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background/75 px-5 font-medium text-foreground transition-colors hover:bg-muted">
                        <Download className="h-4 w-4" /> Download
                    </button>
                    {invoice.status === "overdue" && (
                        <button className="flex h-11 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-6 font-bold text-red-700 transition-colors hover:bg-red-500/20 dark:text-red-300">
                            <Send className="h-4 w-4" /> Send Reminder
                        </button>
                    )}
                    {invoice.status === "pending" && (
                        <button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-[0_14px_30px_-18px_rgba(var(--primary-rgb),0.65)] transition-all hover:bg-primary/90">
                            <CheckCircle2 className="h-5 w-5" /> Mark as Paid
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
