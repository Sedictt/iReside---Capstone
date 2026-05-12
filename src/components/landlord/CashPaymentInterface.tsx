"use client";

import { useState } from "react";
import {
    X,
    HandCoins,
    ShieldCheck,
    Home,
    Wallet,
    AlertTriangle,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CashPaymentInterfaceProps {
    isOpen: boolean;
    onClose: () => void;
    payment: {
        id: string;
        tenantName: string;
        unit: string;
        amount: string;
        invoiceNumber: string;
        description: string;
    } | null;
    onConfirm: (paymentId: string) => Promise<void>;
}

export function CashPaymentInterface({ isOpen, onClose, payment, onConfirm }: CashPaymentInterfaceProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !payment) return null;

    const handleOpenInvoiceReview = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await onConfirm(payment.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to open invoice review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-md animate-in fade-in duration-300 dark:bg-black/80 sm:p-6">
            <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-1 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 z-20 rounded-2xl bg-surface-2 p-2 text-medium transition-all hover:bg-surface-3 hover:text-high border border-divider"
                >
                    <X className="size-5" />
                </button>

                <div className="relative overflow-hidden border-b border-white/5 bg-card/40 px-8 py-10 backdrop-blur-2xl">
                    <div className="absolute right-0 top-0 -mr-10 -mt-10 size-64 rounded-full bg-primary/5 blur-3xl" />
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-card/50 backdrop-blur-xl border border-white/10 shadow-lg">
                            <HandCoins className="size-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Cash Payment</h2>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Face-to-Face Transaction</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-divider bg-surface-2/50 p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-disabled">In-Person Handover</p>
                                    <h3 className="text-lg font-black text-high">{payment.tenantName}</h3>
                                    <div className="flex items-center gap-2 text-xs text-medium">
                                        <Home className="size-3" />
                                        <span>{payment.unit}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="rounded-xl bg-amber-500/10 px-3 py-1 border border-amber-500/20">
                                        <span className="text-[10px] font-black text-amber-500 uppercase">{payment.invoiceNumber}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-divider w-full" />

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-2xl bg-surface-1 flex items-center justify-center border border-divider">
                                        <Wallet className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Amount to Receive</p>
                                        <p className="text-xl font-black text-primary">PHP {payment.amount}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Description</p>
                                    <p className="text-xs font-medium text-medium truncate max-w-[120px]">{payment.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
                            <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-high">Verification Protocol</p>
                                <p className="text-[11px] text-medium leading-relaxed">
                                    Continue to invoice review before approval. This keeps the full verification checklist and helps prevent accidental confirmation.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
                            <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-amber-500">Physical Cash Check Required</p>
                                <p className="text-[11px] text-medium leading-relaxed italic">
                                    Ensure you have the cash in hand before continuing. Recording this settlement will update the tenant's balance immediately.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3 animate-in slide-in-from-top-2">
                                <AlertTriangle className="size-5 text-red-500 shrink-0" />
                                <p className="text-xs font-medium text-red-500">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={() => void handleOpenInvoiceReview()}
                            disabled={isSubmitting}
                            className={cn(
                                "w-full group relative overflow-hidden rounded-2xl bg-primary py-4 font-black text-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20",
                                isSubmitting && "flex items-center justify-center"
                            )}
                        >
                            <span className="relative z-10">{isSubmitting ? "Opening Invoice Review..." : "Open Invoice Review"}</span>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                        </button>
                    </div>
                </div>

                <div className="bg-surface-2 px-8 py-5 flex justify-between items-center border-t border-divider">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-disabled">iReside Secure Payment Node</p>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <div className="size-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-medium">Live Connection</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

