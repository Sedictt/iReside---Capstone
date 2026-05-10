"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, CheckCircle2, X, Calendar, ArrowRight, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProperty } from "@/context/PropertyContext";
import RenewalSettingsModal from "./RenewalSettingsModal";
import { Settings2 } from "lucide-react";

interface RenewalRequest {
    id: string;
    status: string;
    created_at: string;
    proposed_start_date: string;
    proposed_end_date: string;
    proposed_monthly_rent: number;
    proposed_security_deposit: number;
    current_lease: {
        id: string;
        start_date: string;
        end_date: string;
        monthly_rent: number;
        security_deposit: number;
        unit: {
            name: string;
            beds: number;
            baths: number;
            property: {
                name: string;
                address: string;
            };
        };
    };
    tenant: {
        id: string;
        full_name: string;
        email: string;
        phone: string;
    };
}

export default function LandlordRenewalReview() {
    const searchParams = useSearchParams();
    const isPreview = searchParams.get("preview_requests") === "true";

    const { selectedPropertyId } = useProperty();
    const [requests, setRequests] = useState<RenewalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [rejectNotes, setRejectNotes] = useState("");
    
    // Form state for editing terms
    const [proposedStartDate, setProposedStartDate] = useState("");
    const [proposedEndDate, setProposedEndDate] = useState("");
    const [proposedRent, setProposedRent] = useState("");
    const [proposedDeposit, setProposedDeposit] = useState("");

    const formatWithCommas = (val: string) => {
        const num = val.replace(/[^0-9.]/g, '');
        const parts = num.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const handleMoneyInput = (val: string, setter: (v: string) => void) => {
        setter(formatWithCommas(val));
    };

    const parseMoney = (val: string) => {
        return parseFloat(val.replace(/,/g, '')) || 0;
    };

    useEffect(() => {
        fetchRequests();
    }, [selectedPropertyId]);

    const fetchRequests = async () => {
        if (isPreview) {
            setRequests([
                {
                    id: "mock-1",
                    status: "pending",
                    created_at: new Date().toISOString(),
                    proposed_start_date: "2027-01-01",
                    proposed_end_date: "2027-12-31",
                    proposed_monthly_rent: 15500,
                    proposed_security_deposit: 15500,
                    current_lease: {
                        id: "current-1",
                        start_date: "2026-01-01",
                        end_date: "2026-12-31",
                        monthly_rent: 15000,
                        security_deposit: 15000,
                        unit: {
                            name: "Unit 402",
                            beds: 2,
                            baths: 2,
                            property: {
                                name: "Skyline Apartments",
                                address: "456 Urban Ave, Metro City"
                            }
                        }
                    },
                    tenant: {
                        id: "tenant-1",
                        full_name: "Alexander Thompson",
                        email: "alex.t@example.com",
                        phone: "+1 (555) 012-3456"
                    }
                },
                {
                    id: "mock-2",
                    status: "pending",
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    proposed_start_date: "2026-09-15",
                    proposed_end_date: "2027-09-14",
                    proposed_monthly_rent: 8750,
                    proposed_security_deposit: 8750,
                    current_lease: {
                        id: "current-2",
                        start_date: "2025-09-15",
                        end_date: "2026-09-14",
                        monthly_rent: 8500,
                        security_deposit: 8500,
                        unit: {
                            name: "Studio 101",
                            beds: 1,
                            baths: 1,
                            property: {
                                name: "Green Gardens",
                                address: "123 Nature Dr, Suburbia"
                            }
                        }
                    },
                    tenant: {
                        id: "tenant-2",
                        full_name: "Sarah Jenkins",
                        email: "s.jenkins@example.com",
                        phone: "+1 (555) 987-6543"
                    }
                }
            ]);
            setLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({ 
                status: "pending",
                propertyId: selectedPropertyId 
            });
            const res = await fetch(`/api/landlord/renewals?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch renewal requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/landlord/renewals/${selectedRequest.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "approve",
                    ...(proposedStartDate && { proposed_start_date: proposedStartDate }),
                    ...(proposedEndDate && { proposed_end_date: proposedEndDate }),
                    ...(proposedRent && { proposed_monthly_rent: parseMoney(proposedRent) }),
                    ...(proposedDeposit && { proposed_security_deposit: parseMoney(proposedDeposit) }),
                })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Failed to approve", { description: data.error });
                return;
            }
            toast.success("Renewal approved", {
                description: "New lease created. Tenant will be notified."
            });
            setSelectedRequest(null);
            fetchRequests();
        } catch (error) {
            toast.error("Failed to approve request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/landlord/renewals/${selectedRequest.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reject",
                    landlord_notes: rejectNotes
                })
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error("Failed to reject", { description: data.error });
                return;
            }
            toast.success("Renewal rejected", {
                description: "Tenant will be notified."
            });
            setSelectedRequest(null);
            setRejectNotes("");
            fetchRequests();
        } catch (error) {
            toast.error("Failed to reject request");
        } finally {
            setSubmitting(false);
        }
    };

    const openReview = (request: RenewalRequest) => {
        setSelectedRequest(request);
        setProposedStartDate(request.proposed_start_date || "");
        setProposedEndDate(request.proposed_end_date || "");
        setProposedRent(formatWithCommas(request.proposed_monthly_rent?.toString() || ""));
        setProposedDeposit(formatWithCommas(request.proposed_security_deposit?.toString() || ""));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="p-4 rounded-3xl bg-primary/5">
                    <RefreshCw className="size-8 animate-spin text-primary" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
                    Loading Requests...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold text-foreground tracking-tight">Pending Renewals</h3>
                    {isPreview && (
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-widest border border-primary/20">
                            Preview Mode
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        disabled={!selectedPropertyId || selectedPropertyId === "all"}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:bg-muted hover:text-foreground transition-all disabled:opacity-30"
                        title={(!selectedPropertyId || selectedPropertyId === "all") ? "Select a property to configure its renewal policy" : "Configure Renewal Policy"}
                    >
                        <Settings2 className="size-3.5" />
                        Renewal Policy
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                            {requests.length} Pending
                        </span>
                    </div>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-[2.5rem] bg-muted/5">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <CheckCircle2 className="size-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-foreground">All Caught Up</p>
                    <p className="text-sm text-muted-foreground">No new renewal requests to process at this time.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {requests.map((request) => (
                        <div key={request.id} className="group relative bg-card border border-border rounded-[2.5rem] p-8 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-black/5">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-semibold text-xl">
                                        {request.tenant.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{request.tenant.full_name}</h4>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                            {request.current_lease.unit.property.name} • Unit {request.current_lease.unit.name}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-semibold uppercase tracking-widest border border-amber-500/20">
                                    Pending Review
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Current End Date</p>
                                    <p className="font-bold text-foreground">{new Date(request.current_lease.end_date).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Proposed Length</p>
                                    <p className="font-bold text-foreground">
                                        {Math.round((new Date(request.proposed_end_date).getTime() - new Date(request.proposed_start_date).getTime()) / (86400000 * 30.44))} Months
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Proposed Rent</p>
                                    <p className="font-bold text-foreground">PHP {request.proposed_monthly_rent?.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Submitted On</p>
                                    <p className="font-bold text-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => openReview(request)}
                                className="w-full py-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <FileText className="size-4" />
                                Review Request
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                    <div className="relative w-full max-w-2xl bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-8 border-b border-border flex justify-between items-center bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                    <RefreshCw className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">Review Renewal Terms</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                        Reviewing request for {selectedRequest.tenant.full_name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-3 rounded-xl hover:bg-muted transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 rounded-3xl p-6 border border-border/50">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-4">Current Lease</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Expires</span>
                                            <span className="text-sm font-bold">{new Date(selectedRequest.current_lease.end_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-muted-foreground">Monthly Rent</span>
                                            <span className="text-sm font-bold">PHP {selectedRequest.current_lease.monthly_rent?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20">
                                    <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-black mb-4">Tenant Proposal</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-primary/70">Target Start</span>
                                            <span className="text-sm font-black text-primary">{new Date(selectedRequest.proposed_start_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-primary/70">Target Rent</span>
                                            <span className="text-sm font-black text-primary">PHP {selectedRequest.proposed_monthly_rent?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Editing Form */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">Finalize New Terms</h4>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="new-start-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Start Date</label>
                                        <input
                                            id="new-start-date"
                                            type="date"
                                            value={proposedStartDate}
                                            onChange={(e) => setProposedStartDate(e.target.value)}
                                            className="w-full p-4 rounded-2xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="new-end-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New End Date</label>
                                        <input
                                            id="new-end-date"
                                            type="date"
                                            value={proposedEndDate}
                                            onChange={(e) => setProposedEndDate(e.target.value)}
                                            className="w-full p-4 rounded-2xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="monthly-rent" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Rent (PHP)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                                            <input
                                                id="monthly-rent"
                                                type="text"
                                                value={proposedRent}
                                                onChange={(e) => handleMoneyInput(e.target.value, setProposedRent)}
                                                className="w-full p-4 pl-8 rounded-2xl border border-border bg-background text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="security-deposit" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit (PHP)</label>
                                            <button 
                                                onClick={() => setProposedDeposit(formatWithCommas(selectedRequest.current_lease.security_deposit?.toString() || "0"))}
                                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter"
                                            >
                                                Use Current Balance
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₱</span>
                                            <input
                                                type="text"
                                                value={proposedDeposit}
                                                onChange={(e) => handleMoneyInput(e.target.value, setProposedDeposit)}
                                                className="w-full p-4 pl-8 rounded-2xl border border-border bg-background text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase">Current Held:</span>
                                            <span className="text-[9px] font-black text-foreground">PHP {selectedRequest.current_lease.security_deposit?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="space-y-2">
                                <label htmlFor="landlord-notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Landlord Notes (Optional)</label>
                                <textarea
                                    id="landlord-notes"
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    placeholder="Explain your decision or adjustments..."
                                    className="w-full p-4 rounded-2xl border border-border bg-background text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-muted/20 flex gap-4">
                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className="px-6 py-4 rounded-2xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs transition-all flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="size-4" />
                                Reject Request
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="px-6 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all flex flex-[1.5] items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {submitting ? "Creating Lease..." : "Approve & Generate Lease"}
                                <CheckCircle2 className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {selectedPropertyId && selectedPropertyId !== "all" && (
                <RenewalSettingsModal
                    propertyId={selectedPropertyId}
                    propertyName="Active Property" // You could fetch the real name if needed
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
}

