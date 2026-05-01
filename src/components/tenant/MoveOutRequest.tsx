"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, AlertOctagon, X, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveOutRequestProps {
    variant?: "sidebar" | "quickAction" | "hub";
}

export default function MoveOutRequest({ variant = "sidebar" }: MoveOutRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "scanning" | "blocked">("idle");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRequest = () => {
        setIsOpen(true);
        setStatus("scanning");

        // Simulate a system scan checking for pending balances
        setTimeout(() => {
            setStatus("blocked");
        }, 2500);
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
                        onClick={handleRequest}
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
                            onClick={handleRequest}
                            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-600 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/15 transition-all border border-red-500/20 shadow-sm"
                        >
                            Request Move-Out
                        </button>
                    </div>
                </div>
            ) : (
                /* Quick Action Trigger */
                <button
                    onClick={handleRequest}
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
                    <div className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Move-Out Clearance</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Protocol v4.2</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                            {status === "scanning" && (
                                <div className="text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-border" />
                                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                        <CheckCircle2 className="w-8 h-8 text-primary/50 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-foreground mb-2">Scanning Ledgers...</h4>
                                        <p className="text-sm text-muted-foreground">Checking for pending rent, utilities, and fees.</p>
                                    </div>
                                </div>
                            )}

                            {status === "blocked" && (
                                <div className="w-full animate-in zoom-in-95 duration-500">
                                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                        <div className="relative w-20 h-20 flex items-center justify-center bg-red-500/10 rounded-full">
                                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                                            <AlertOctagon className="w-10 h-10 text-red-500 relative z-10" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-foreground">Clearance Blocked</h4>
                                            <p className="text-sm text-red-500 font-medium mt-1">Pending Balances Detected</p>
                                        </div>
                                    </div>

                                    <div className="bg-background/50 rounded-xl p-5 border border-red-500/20 space-y-4">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unsettled Items</p>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-foreground/80">Overdue Rent (Feb)</span>
                                            <span className="font-mono text-red-500">₱4,500.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-foreground/80">Electric Utility (Estimated)</span>
                                            <span className="font-mono text-red-500">₱1,250.00</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-foreground/80">Late Fee</span>
                                            <span className="font-mono text-red-500">₱500.00</span>
                                        </div>

                                        <div className="pt-4 border-t border-border flex justify-between items-center">
                                            <span className="font-bold text-foreground">Total Required</span>
                                            <span className="font-bold font-mono text-red-500 text-lg">₱6,250.00</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground mt-6 text-center leading-relaxed">
                                        You cannot finalize your move-out request until all debts are settled. Your Trust Score may be affected if balances remain unpaid past the move-out date.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {status === "blocked" && (
                            <div className="p-4 border-t border-border bg-background/50 flex gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-3 rounded-xl text-muted-foreground font-semibold hover:bg-muted hover:text-foreground transition-all flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all flex flex-1 items-center justify-center gap-2"
                                >
                                    Settle Now <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            , document.body) : null}
        </>
    );
}
