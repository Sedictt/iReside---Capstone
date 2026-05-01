"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, AlertOctagon, X, ArrowRight } from "lucide-react";

interface MoveOutRequestProps {
    variant?: "sidebar" | "quickAction" | "hub";
}

export default function MoveOutRequest({ variant = "sidebar" }: MoveOutRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [reason, setReason] = useState("");
    const [requestedDate, setRequestedDate] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestedDate) {
            toast.error("Please select a target move-out date");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/tenant/lease/move-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, requestedDate }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit request");

            toast.success("Move-out request submitted successfully");
            setIsOpen(false);
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {variant === "hub" ? (
                /* Hub Section Variant - Matches the new grid style */
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between ring-1 ring-border group hover:border-red-500/30 transition-all relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] select-none pointer-events-none">
                        <LogOut className="w-16 h-16" />
                    </div>
                    <div className="space-y-6">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-foreground tracking-tight">End of Lease</h4>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                Planning to move out? Initiate a digital clearance request and manage your move-out timeline.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="w-full mt-8 py-4 rounded-xl bg-muted text-[10px] font-black uppercase tracking-widest border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        Request Move-Out
                    </button>
                </div>
            ) : variant === "sidebar" ? (
                /* Sidebar Card Trigger */
                <div className="rounded-[2rem] border border-border/60 bg-card p-8 relative overflow-hidden group flex-shrink-0 shadow-sm backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-transparent to-transparent opacity-80" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">End of Lease</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            Planning to move out? You must initiate a digital clearance request before leaving the property.
                        </p>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/15 transition-all border border-red-500/20 shadow-sm"
                        >
                            Request Move-Out
                        </button>
                    </div>
                </div>
            ) : (
                /* Quick Action Trigger */
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-card/50 border border-border hover:border-red-500/40 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1 group backdrop-blur-sm"
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 bg-red-500/10 text-red-500">
                        <LogOut className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black text-center group-hover:text-red-500 transition-colors uppercase tracking-widest">Move Out</span>
                </button>
            )}

            {/* Modal */}
            {mounted && isOpen ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="p-8 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                                    <LogOut className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">Move-Out Clearance</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Residency Termination Protocol</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleRequest} className="p-8 space-y-6">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex gap-4">
                                <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-[11px] font-medium text-red-600/80 leading-relaxed uppercase tracking-wider">
                                    Submitting this request initiates the digital clearance process. Your landlord will review your account for any pending balances and inspect the unit condition.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Target Move-Out Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={requestedDate}
                                        onChange={(e) => setRequestedDate(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Reason for Leaving (Optional)</label>
                                    <textarea 
                                        rows={3}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Briefly explain your reason for moving out..."
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Submit Request <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body) : null}
        </>
    );
}

import { toast } from "sonner";
import { Loader2 } from "lucide-react";
