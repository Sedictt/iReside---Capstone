"use client";

import { useState } from "react";
import { 
    AlertTriangle, CheckCircle2, HandCoins, Info, 
    Receipt, X, ArrowUpRight,
    HelpCircle, TrendingUp, QrCode, Upload, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { UiMessage } from "../landlord/messages/types";
import { formatPhpCurrency } from "@/lib/billing/utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface PaymentIssueResolverProps {
    message: UiMessage | null;
    onClose: () => void;
    onResolved: () => void;
}

export function PaymentIssueResolver({ message, onClose, onResolved }: PaymentIssueResolverProps) {
    const router = useRouter();
    const [excessAction, setExcessAction] = useState<"credit" | "refund">("credit");
    const [gcashNumber, setGcashNumber] = useState("");
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!message) return null;

    const issueType = message.issueType || "other";
    const shortfall = message.shortfallAmount || 0;

    const handleExcessSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("action", excessAction);
            if (gcashNumber) formData.append("gcashNumber", gcashNumber);
            if (qrFile) formData.append("qrFile", qrFile);

            const response = await fetch(`/api/tenant/payments/${message.invoiceId}/refund-info`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Failed to submit refund info");

            onResolved();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-surface-0 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="shrink-0 border-b border-white/5 bg-surface-1/50 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-text-high tracking-tight">Resolve Payment Issue</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-disabled">Case ID: {message.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-surface-2 text-text-medium transition-all hover:bg-surface-3 active:scale-95 shadow-lg"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-8 space-y-8">
                    {/* Status Banner */}
                    <div className={cn(
                        "rounded-[2rem] border p-6 flex flex-col items-center text-center gap-4",
                        issueType === "insufficient_amount" ? "bg-amber-500/10 border-amber-500/20" :
                        issueType === "not_received" ? "bg-rose-500/10 border-rose-500/20" :
                        "bg-primary/10 border-primary/20"
                    )}>
                        <div className={cn(
                            "flex size-16 items-center justify-center rounded-[1.25rem] shadow-inner",
                            issueType === "insufficient_amount" ? "bg-amber-500/20 text-amber-500" :
                            issueType === "not_received" ? "bg-rose-500/20 text-rose-500" :
                            "bg-primary/20 text-primary"
                        )}>
                            {issueType === "insufficient_amount" ? <HandCoins className="size-8" /> :
                             issueType === "not_received" ? <AlertTriangle className="size-8" /> :
                             <Info className="size-8" />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-text-high">
                                {issueType === "insufficient_amount" ? "Insufficient Balance" :
                                 issueType === "excessive_amount" ? "Overpayment Detected" :
                                 issueType === "not_received" ? "Payment Not Found" :
                                 "Action Required"}
                            </h3>
                            <p className="text-xs font-medium text-text-medium leading-relaxed max-w-[280px]">
                                {message.content.replace("The payment request has been rejected. Reason: ", "")}
                            </p>
                        </div>
                    </div>

                    {/* Action Interface */}
                    <div className="space-y-6">
                        {issueType === "insufficient_amount" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-2xl border border-white/10 bg-surface-1 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-disabled">Remaining Balance</p>
                                        <p className="text-xl font-semibold text-amber-400">{formatPhpCurrency(shortfall)}</p>
                                    </div>
                                    <div className="h-[1px] bg-white/5" />
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-text-disabled">
                                            <Info className="size-2.5" />
                                        </div>
                                        <p className="text-[11px] text-text-disabled leading-relaxed">
                                            You previously paid a partial amount. To resolve this, you need to settle the remaining balance above.
                                        </p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => router.push(`/tenant/payments/${message.invoiceId}/checkout`)}
                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Pay Remaining Balance <ArrowUpRight className="size-5" />
                                </button>
                            </div>
                        )}

                        {issueType === "excessive_amount" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">Excess Amount</p>
                                        <p className="text-xl font-semibold text-emerald-500">{formatPhpCurrency(Math.abs(shortfall))}</p>
                                    </div>
                                    <p className="text-xs text-text-medium leading-relaxed font-medium">
                                        You have paid more than the required amount. How would you like to handle the excess?
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setExcessAction("credit")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all active:scale-95",
                                            excessAction === "credit" ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-surface-1 text-text-medium"
                                        )}
                                    >
                                        <TrendingUp className="size-5" />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-center">Credit to Next Bill</span>
                                    </button>
                                    <button 
                                        onClick={() => setExcessAction("refund")}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all active:scale-95",
                                            excessAction === "refund" ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-surface-1 text-text-medium"
                                        )}
                                    >
                                        <QrCode className="size-5" />
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-center">Request Refund</span>
                                    </button>
                                </div>

                                {excessAction === "refund" && (
                                    <div className="space-y-4 p-6 rounded-2xl border border-white/5 bg-surface-1 animate-in zoom-in-95 duration-300">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-disabled">GCash Number</p>
                                            <input 
                                                type="text"
                                                value={gcashNumber}
                                                onChange={(e) => setGcashNumber(e.target.value)}
                                                placeholder="09XX XXX XXXX"
                                                className="w-full rounded-xl border border-white/10 bg-surface-2 px-4 py-3 text-sm font-semibold text-text-high outline-none focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-disabled">Or Upload QR Code</p>
                                            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 bg-surface-2 py-4 text-text-disabled transition-colors hover:border-primary/30 hover:bg-surface-3">
                                                <Upload className="size-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">{qrFile ? qrFile.name : "Choose File"}</span>
                                                <input type="file" className="hidden" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    onClick={handleExcessSubmit}
                                    disabled={isSubmitting || (excessAction === "refund" && !gcashNumber && !qrFile)}
                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 className="size-5" />}
                                    {excessAction === "credit" ? "Confirm Credit Arrangement" : "Submit Refund Info"}
                                </button>
                            </div>
                        )}

                        {issueType === "not_received" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-6 space-y-4">
                                    <p className="text-[11px] text-rose-400 font-bold uppercase tracking-widest">Recommended Actions</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-xs text-text-medium font-medium">
                                            <div className="size-1 rounded-full bg-rose-400" />
                                            Double check your Reference Number
                                        </li>
                                        <li className="flex items-center gap-3 text-xs text-text-medium font-medium">
                                            <div className="size-1 rounded-full bg-rose-400" />
                                            Ensure the receipt screenshot is clear
                                        </li>
                                        <li className="flex items-center gap-3 text-xs text-text-medium font-medium">
                                            <div className="size-1 rounded-full bg-rose-400" />
                                            Verify destination account details
                                        </li>
                                    </ul>
                                </div>
                                
                                <button 
                                    onClick={() => router.push(`/tenant/payments/${message.invoiceId}/checkout`)}
                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Resubmit Payment Proof <Receipt className="size-5" />
                                </button>
                            </div>
                        )}

                        {(issueType === "other" || issueType === "invalid_proof") && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="rounded-2xl border border-white/10 bg-surface-1 p-6">
                                    <p className="text-xs text-text-medium leading-relaxed font-medium">
                                        Please review the rejection reason provided by your landlord and resubmit your payment details through the checkout.
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => router.push(`/tenant/payments/${message.invoiceId}/checkout`)}
                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Proceed to Checkout <ArrowUpRight className="size-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Support */}
                <div className="shrink-0 border-t border-white/5 bg-surface-1/50 px-8 py-6 flex items-center justify-center">
                    <button className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-text-disabled hover:text-primary transition-colors group">
                        <HelpCircle className="size-3 group-hover:text-primary" />
                        Still having trouble? Contact Support
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
