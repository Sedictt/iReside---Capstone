"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, AlertOctagon, X, ArrowRight, Calendar, Clock, CheckCircle2, XCircle, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { MoveOutChecklist } from "./MoveOutChecklist";

type MoveOutStatus = "pending" | "approved" | "denied" | "completed";

interface MoveOutRequestData {
    id: string;
    status: MoveOutStatus;
    requested_date: string;
    reason: string | null;
    denial_reason: string | null;
    checklist_data: any;
    deposit_deductions: any;
    deposit_refund_amount: number | null;
    created_at: string;
    approved_at: string | null;
    denied_at: string | null;
    inspection_date: string | null;
    completed_at: string | null;
}

interface MoveOutRequestProps {
    variant?: "sidebar" | "quickAction" | "hub";
    initialRequest?: MoveOutRequestData | null;
}

export default function MoveOutRequest({ variant = "sidebar", initialRequest = null }: MoveOutRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(!initialRequest);
    const [existingRequest, setExistingRequest] = useState<MoveOutRequestData | null>(initialRequest);
    const [reason, setReason] = useState("");
    const [requestedDate, setRequestedDate] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync state with initialRequest prop for previewing
    useEffect(() => {
        if (initialRequest) {
            setExistingRequest(initialRequest);
            setLoading(false);
        } else {
            fetchExistingRequest();
        }
    }, [initialRequest]);

    const fetchExistingRequest = async () => {
        try {
            const res = await fetch("/api/tenant/lease/move-out/status");
            if (res.ok) {
                const data = await res.json();
                setExistingRequest(data.request);
            }
        } catch (err) {
            console.error("Failed to fetch move-out status", err);
        } finally {
            setLoading(false);
        }
    };

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
            fetchExistingRequest();
        } catch (err: unknown) {
            const error = err as Error;
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {existingRequest ? (
                /* Existing Request State */
                variant === "hub" ? (
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between ring-1 ring-border transition-all relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] select-none pointer-events-none">
                            <Clock className="size-16" />
                        </div>
                        <div className="space-y-6">
                            <div className={cn(
                                "size-12 rounded-2xl border flex items-center justify-center",
                                existingRequest.status === "pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                existingRequest.status === "approved" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                                existingRequest.status === "denied" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}>
                                {existingRequest.status === "pending" ? <Clock className="size-6" /> :
                                 existingRequest.status === "approved" ? <CheckCircle2 className="size-6" /> :
                                 existingRequest.status === "denied" ? <XCircle className="size-6" /> :
                                 <LogOut className="size-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-lg font-black text-foreground tracking-tight">Move-Out: {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    {existingRequest.status === "pending" ? "Your request is currently being reviewed by the landlord." :
                                     existingRequest.status === "approved" ? "Your request has been approved. Please prepare for inspection." :
                                     existingRequest.status === "denied" ? `Your request was denied. Reason: ${existingRequest.denial_reason}` :
                                     "Your move-out clearance is complete."}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Calendar className="size-3" />
                                    Target Date: {new Date(existingRequest.requested_date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(true)}
                            className="w-full mt-8 py-4 rounded-xl bg-muted text-[10px] font-black uppercase tracking-widest border border-border hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                        >
                            View Timeline & Checklist
                        </button>
                    </div>
                ) : (
                    /* Sidebar/QuickAction Variant for Existing Request */
                    <div className="rounded-[2rem] border border-border/60 bg-card p-8 relative overflow-hidden group flex-shrink-0 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl border",
                                existingRequest.status === "pending" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-500"
                            )}>
                                <Clock className="size-5" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">Move-Out Status</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            Your request for {new Date(existingRequest.requested_date).toLocaleDateString()} is <strong>{existingRequest.status}</strong>.
                        </p>
                        <button
                            onClick={() => setIsOpen(true)}
                            className="w-full py-4 rounded-2xl bg-muted text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all border border-border shadow-sm"
                        >
                            View Progress
                        </button>
                    </div>
                )
            ) : variant === "hub" ? (
                /* Hub Section Variant - Matches the new grid style */
                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between ring-1 ring-border group hover:border-red-500/30 transition-all relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] select-none pointer-events-none">
                        <LogOut className="size-16" />
                    </div>
                    <div className="space-y-6">
                        <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <LogOut className="size-6" />
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
                                <LogOut className="size-5" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">End of Lease</h3>
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
                    <div className="size-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 bg-red-500/10 text-red-500">
                        <LogOut className="size-7" />
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
                                    <LogOut className="size-6" />
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
                        {existingRequest ? (
                            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-6">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Clearance Progress</h4>
                                    
                                    <div className="relative space-y-8">
                                        {/* Vertical line */}
                                        <div className="absolute left-[15px] top-2 h-[calc(100%-16px)] w-0.5 bg-muted" />

                                        {/* Step 1: Submission */}
                                        <div className="relative flex items-start gap-6">
                                            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                                                <Clock className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-sm font-black text-foreground">Request Submitted</p>
                                                <p className="text-xs font-medium text-muted-foreground">{new Date(existingRequest.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Approval */}
                                        <div className="relative flex items-start gap-6">
                                            <div className={cn(
                                                "z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                                                existingRequest.status !== "pending" && existingRequest.status !== "denied" ? "bg-primary text-white shadow-lg shadow-primary/20" : 
                                                existingRequest.status === "denied" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
                                            )}>
                                                {existingRequest.status === "denied" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className={cn("text-sm font-black", existingRequest.status === "pending" ? "text-muted-foreground" : "text-foreground")}>
                                                    {existingRequest.status === "denied" ? "Request Denied" : "Landlord Approval"}
                                                </p>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {existingRequest.approved_at ? new Date(existingRequest.approved_at).toLocaleDateString() : 
                                                     existingRequest.denied_at ? new Date(existingRequest.denied_at).toLocaleDateString() : "Awaiting review"}
                                                </p>
                                                {existingRequest.status === "denied" && (
                                                    <div className="mt-2 rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-[11px] font-medium text-red-600">
                                                        Reason: {existingRequest.denial_reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Step 3: Inspection */}
                                        <div className="relative flex items-start gap-6">
                                            <div className={cn(
                                                "z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                                                existingRequest.inspection_date ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                                            )}>
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className={cn("text-sm font-black", !existingRequest.inspection_date ? "text-muted-foreground" : "text-foreground")}>Physical Inspection</p>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {existingRequest.inspection_date ? new Date(existingRequest.inspection_date).toLocaleDateString() : "Scheduled after approval"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Step 4: Finalization */}
                                        <div className="relative flex items-start gap-6">
                                            <div className={cn(
                                                "z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                                                existingRequest.status === "completed" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground"
                                            )}>
                                                <LogOut className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <p className={cn("text-sm font-black", existingRequest.status !== "completed" ? "text-muted-foreground" : "text-foreground")}>Lease Terminated</p>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {existingRequest.completed_at ? new Date(existingRequest.completed_at).toLocaleDateString() : "Final step"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {existingRequest.inspection_date && (
                                    <div className="pt-6 border-t border-border space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Security Deposit Summary</h4>
                                        <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                                            {existingRequest.deposit_deductions && Array.isArray(existingRequest.deposit_deductions) && existingRequest.deposit_deductions.map((d: any, i: number) => (
                                                <div key={i} className="flex justify-between text-xs font-medium">
                                                    <span className="text-muted-foreground">{d.description}</span>
                                                    <span className="text-red-500 font-bold">- ₱{d.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                            <div className="pt-3 border-t border-border/50 flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Estimated Refund</span>
                                                <span className="text-lg font-black text-primary">₱{(existingRequest.deposit_refund_amount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {existingRequest.status === "approved" && (
                                    <MoveOutChecklist 
                                        requestId={existingRequest.id} 
                                        initialData={existingRequest.checklist_data} 
                                    />
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleRequest} className="p-8 space-y-6">
                                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex gap-4">
                                    <AlertOctagon className="size-5 text-red-500 shrink-0" />
                                    <p className="text-[11px] font-medium text-red-600/80 leading-relaxed uppercase tracking-wider">
                                        Submitting this request initiates the digital clearance process. Your landlord will review your account for any pending balances and inspect the unit condition.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="moveOutDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Target Move-Out Date</label>
                                        <input 
                                            id="moveOutDate"
                                            type="date" 
                                            required
                                            value={requestedDate}
                                            onChange={(e) => setRequestedDate(e.target.value)}
                                            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="moveOutReason" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Reason for Leaving (Optional)</label>
                                        <textarea 
                                            id="moveOutReason"
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
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <>Submit Request <ArrowRight className="size-4" /></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            , document.body) : null}
        </>
    );
}


