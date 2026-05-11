import React, { useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Unit } from "../types";

interface TransferRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: Unit | null;
}

export const TransferRequestModal = ({
    isOpen,
    onClose,
    unit
}: TransferRequestModalProps) => {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!unit) return null;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Mock submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
        } catch (err) {
            setError("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/60 backdrop-blur-md" 
                        onClick={onClose}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg flex flex-col rounded-[2.5rem] border border-border bg-card shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="absolute right-6 top-6 z-10">
                            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-muted text-muted-foreground">
                                <X className="size-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <span className="material-icons-round text-3xl">move_down</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                                        Transfer Request
                                    </h2>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Target Unit {unit.name}</p>
                                </div>
                            </div>

                            {success ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 px-6 text-center"
                                >
                                    <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                        <span className="material-icons-round text-5xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Request Submitted</h3>
                                    <p className="text-muted-foreground">Your transfer request for Unit {unit.name} has been sent to the administration for review.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={onSubmit} className="space-y-8">
                                    <div className="p-5 rounded-2xl bg-muted/30 border border-border">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            You are requesting to transfer your current lease to <span className="font-bold text-foreground">Unit {unit.name}</span>. This request is subject to eligibility checks and landlord approval.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground ml-1">Transfer Justification</label>
                                        <textarea
                                            required
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Please explain why you'd like to transfer (e.g., needing more space, preferred floor...)"
                                            className="w-full min-h-[140px] rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                                            <span className="material-icons-round text-lg">error_outline</span>
                                            <p className="text-xs font-bold">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-[0.2em] transition-all hover:opacity-90 active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="material-icons-round animate-spin">refresh</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Submit Request
                                                <span className="material-icons-round">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                        <div className="h-4 bg-primary/10 w-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
