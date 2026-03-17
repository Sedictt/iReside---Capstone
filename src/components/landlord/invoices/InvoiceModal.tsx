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
            case "paid": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "overdue": return "bg-red-500/10 text-red-400 border-red-500/20";
            case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            default: return "bg-white/5 text-neutral-400 border-white/10";
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
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Decorative header glow matching system UI */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/20 blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Invoice <span className="text-neutral-400 font-medium">#{invoice.id.split('-').pop()}</span></h2>
                            <span className={cn("inline-flex px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider items-center gap-1.5", getStatusStyle(invoice.status))}>
                                {getStatusIcon(invoice.status)} {invoice.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors bg-black/20 border border-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-8 hide-scrollbar">
                    
                    {/* Invoice Meta Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-white/5">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-neutral-500/50" /> Billed From
                            </h3>
                            <div>
                                <p className="font-bold text-white text-lg flex items-center gap-2">
                                    iReside Properties
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </p>
                                <p className="text-neutral-400 mt-1 text-sm leading-relaxed">
                                    123 Corporate Ave, Suite 400<br />
                                    Makati City, Metro Manila<br />
                                    <span className="text-primary mt-1 inline-block">billing@ireside.com</span>
                                </p>
                            </div>
                        </div>
                        <div className="md:text-left space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/50" /> Billed To
                            </h3>
                            <div>
                                <p className="font-bold text-white text-lg">{invoice.tenant}</p>
                                <p className="text-neutral-400 mt-1 text-sm leading-relaxed">
                                    {invoice.property}<br />
                                    <span className="text-white font-medium">{invoice.unit}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Data */}
                    <div className="flex flex-wrap gap-4 mb-10">
                        <div className="flex-1 min-w-[140px] bg-[#0a0a0a] rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Clock className="w-16 h-16" /></div>
                            <p className="text-xs text-neutral-500 uppercase font-black tracking-wider mb-2">Issue Date</p>
                            <p className="font-bold text-white text-lg">{new Date(invoice.issuedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="flex-1 min-w-[140px] bg-[#0a0a0a] rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><AlertCircle className="w-16 h-16" /></div>
                            <p className="text-xs text-neutral-500 uppercase font-black tracking-wider mb-2">Due Date</p>
                            <p className={cn("font-bold text-lg", invoice.status === 'overdue' ? 'text-red-400' : 'text-white')}>
                                {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="flex-[2] min-w-[200px] bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20 flex flex-col justify-end">
                            <p className="text-xs text-primary/70 uppercase font-black tracking-wider mb-1">Total Due</p>
                            <p className="font-black text-primary text-3xl">₱{(invoice.status === 'overdue' ? invoice.amount * 1.05 : invoice.amount).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0a0a0a]">
                        <table className="w-full text-left">
                            <thead className="bg-[#111] border-b border-white/10">
                                <tr>
                                    <th className="p-5 text-xs tracking-widest text-neutral-500 uppercase font-black">Description & Period</th>
                                    <th className="p-5 text-xs tracking-widest text-neutral-500 uppercase font-black text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="p-5">
                                        <p className="font-bold text-white text-[15px]">{invoice.type} For {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                        <p className="text-sm text-neutral-400 mt-1.5 flex items-center gap-2">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-neutral-600" />
                                            {new Date(invoice.issuedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                                        </p>
                                    </td>
                                    <td className="p-5 text-right font-black text-white text-lg">
                                        ₱{invoice.amount.toLocaleString()}
                                    </td>
                                </tr>
                                {invoice.status === 'overdue' && (
                                    <tr className="bg-red-500/[0.02]">
                                        <td className="p-5">
                                            <p className="font-bold text-red-400 text-[15px] flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" /> Late Payment Penalty
                                            </p>
                                            <p className="text-sm text-red-400/70 mt-1.5">5% penalty applied for overdue balance.</p>
                                        </td>
                                        <td className="p-5 text-right font-black text-red-400 text-lg">
                                            ₱{(invoice.amount * 0.05).toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-8 flex justify-end">
                        <div className="w-full md:w-[320px] rounded-2xl p-6 border border-white/5 space-y-4 bg-[#111]">
                            <div className="flex justify-between items-center text-neutral-400 font-medium">
                                <span>Subtotal</span>
                                <span className="text-white">₱{invoice.amount.toLocaleString()}</span>
                            </div>
                            {invoice.status === 'overdue' && (
                                <div className="flex justify-between items-center text-red-400 font-medium pt-2 border-t border-white/5">
                                    <span>Late Fee (5%)</span>
                                    <span>+ ₱{(invoice.amount * 0.05).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="h-px w-full bg-white/10" />
                            <div className="flex justify-between items-end">
                                <span className="text-neutral-300 font-bold">Total Due</span>
                                <span className="text-white font-black text-2xl">₱{(invoice.status === 'overdue' ? invoice.amount * 1.05 : invoice.amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex flex-wrap justify-end gap-3">
                    <button onClick={onClose} className="h-11 px-5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 flex items-center gap-2 transition-colors">
                        Close
                    </button>
                    <button className="h-11 px-5 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 flex items-center gap-2 transition-colors">
                        <Download className="w-4 h-4" /> Download
                    </button>
                    {invoice.status === 'overdue' && (
                        <button className="h-11 px-6 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 flex items-center gap-2 transition-colors border border-red-500/20">
                            <Send className="w-4 h-4" /> Send Reminder
                        </button>
                    )}
                    {invoice.status === 'pending' && (
                        <button className="h-11 px-6 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Mark as Paid
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
