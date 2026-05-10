"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import {
    FileText,
    Download,
    CheckCircle2,
    Clock,
    Home,
    ShieldCheck,
    ScrollText,
    Loader2,
    Building2,
    MessageSquare,
    Shield,
    ArrowUpRight,
    History,
    CheckCircle,
    FileSearch,
    Maximize,
    Layers,
    Bed,
    Bath,
    LucideIcon,
    X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";
import UnitTransferRequest from "@/components/tenant/UnitTransferRequest";
import { LeaseTour } from "@/components/tenant/LeaseTour";
import LeaseModal from "@/components/tenant/LeaseModal";
import LeaseRenewalRequest from "@/components/tenant/LeaseRenewalRequest";
import LeaseRenewalReminder from "@/components/tenant/LeaseRenewalReminder";
import { PropertyAmenities } from "@/components/tenant/PropertyAmenities";
import { LeaseData } from "@/types/lease";

type TabId = "agreement" | "property" | "services";

function LeaseHubContent() {
    const searchParams = useSearchParams();
    const previewDays = searchParams.get("preview_days");
    
    const [lease, setLease] = useState<LeaseData | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Add mock data for previewing different move-out states
    const previewParam = searchParams.get("preview");
    const moveOutPreviewStatus = searchParams.get("moveOutStatus") || (previewParam !== null ? "approved" : null);

    const [activeTab, setActiveTab] = useState<TabId>(moveOutPreviewStatus ? "services" : "agreement");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [renewalRequest, setRenewalRequest] = useState<any>(null);

    // Add mock data for previewing different move-out states
    const mockMoveOutRequest = useMemo(() => {
        if (!moveOutPreviewStatus) return null;
        
        const base = {
            id: "mock-id",
            requested_date: new Date(Date.now() + 30 * 86400000).toISOString(),
            reason: "Moving closer to work",
            denial_reason: null,
            checklist_data: {
                "Return Keys": false,
                "Clean Unit": false,
                "Remove Trash": true
            },
            deposit_deductions: [],
            deposit_refund_amount: 15000,
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            approved_at: null,
            denied_at: null,
            inspection_date: null,
            completed_at: null,
        };

        switch (moveOutPreviewStatus) {
            case "pending":
                return { ...base, status: "pending" as const };
            case "approved":
                return { 
                    ...base, 
                    status: "approved" as const, 
                    approved_at: new Date(Date.now() - 1 * 86400000).toISOString() 
                };
            case "denied":
                return { 
                    ...base, 
                    status: "denied" as const, 
                    denied_at: new Date(Date.now() - 1 * 86400000).toISOString(),
                    denial_reason: "Notice period too short (minimum 30 days required)."
                };
            case "inspection":
                return { 
                    ...base, 
                    status: "approved" as const, 
                    approved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
                    inspection_date: new Date().toISOString(),
                    deposit_deductions: [
                        { description: "Wall Painting Touch-up", amount: 2500 },
                        { description: "Cleaning Fee", amount: 1500 },
                        { description: "Unpaid Electricity Bill", amount: 1250 }
                    ],
                    deposit_refund_amount: 9750
                };
            case "completed":
                return { 
                    ...base, 
                    status: "completed" as const, 
                    approved_at: new Date(Date.now() - 5 * 86400000).toISOString(),
                    inspection_date: new Date(Date.now() - 2 * 86400000).toISOString(),
                    completed_at: new Date().toISOString(),
                    deposit_refund_amount: 15000
                };
            default:
                return null;
        }
    }, [moveOutPreviewStatus]);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const res = await fetch("/api/tenant/lease", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load lease");
                const payload = await res.json();
                if (isMounted && payload.lease) {
                    setLease(payload.lease as LeaseData);
                    
                    // Fetch renewal requests for this lease
                    try {
                        const renewRes = await fetch("/api/tenant/renewals", { cache: "no-store" });
                        if (renewRes.ok) {
                            const renewData = await renewRes.json();
                            const leaseRenewal = renewData?.find((r: { current_lease_id: string }) => r.current_lease_id === payload.lease.id);
                            if (isMounted) setRenewalRequest(leaseRenewal);
                        }
                    } catch (e) {
                        console.error("Failed to fetch renewal requests:", e);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };

    const progressData = useMemo(() => {
        if (previewDays) {
            const days = parseInt(previewDays);
            const total = 365;
            return { 
                daysRemaining: days, 
                totalDays: total, 
                percent: Math.max(0, Math.min(100, ((total - days) / total) * 100)), 
                dayCount: Math.max(1, total - days) 
            };
        }

        if (!lease?.start_date || !lease?.end_date) return { daysRemaining: 0, totalDays: 1, percent: 0, dayCount: 0 };
        const start = new Date(lease.start_date).getTime();
        const end = new Date(lease.end_date).getTime();
        const now = Date.now();

        const totalMs = end - start;
        const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
        const remainingMs = Math.max(0, end - now);

        const totalDays = Math.max(1, Math.round(totalMs / 86400000));
        const daysRemaining = Math.max(0, Math.round(remainingMs / 86400000));
        const percent = Math.min(100, (elapsedMs / totalMs) * 100);
        const dayCount = Math.round(elapsedMs / 86400000) + 1;

        return { daysRemaining, totalDays, percent, dayCount };
    }, [lease, previewDays]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">Validating Lease Registry...</p>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center space-y-6">
                <div className="size-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <FileSearch className="size-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Registry Empty</h2>
                    <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
                        We couldn&apos;t find an active lease associated with your profile. This usually happens if your move-in is still pending approval.
                    </p>
                </div>
                <Link href="/search" className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-primary/20 transition-all">
                    Discover Properties
                </Link>
            </div>
        );
    }



    const imgUrl = lease.unit.property.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop";
    const shortHash = lease.id.replace(/-/g, "").substring(0, 8).toUpperCase();

    const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
        { id: "agreement", label: "Agreement", icon: ScrollText },
        { id: "property", label: "The Residence", icon: Home },
        { id: "services", label: "Governance", icon: Shield },
    ];

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <LeaseTour />
            <LeaseRenewalReminder daysRemaining={progressData.daysRemaining} leaseId={lease?.id} />
            
            {/* Consistent Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">
                            Lease Hub
                        </h1>
                        {(previewDays || moveOutPreviewStatus) && (
                            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                                Preview Mode: {previewDays ? `${previewDays} Days` : `Move-Out ${moveOutPreviewStatus}`}
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground font-medium text-sm max-w-2xl">
                        Your digital source of truth for your residency, agreement terms, and unit specifications.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-[1.5rem] p-3 shadow-sm flex items-center gap-6 ring-1 ring-primary/5">
                    <div className="px-1 border-r border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Contract Status</p>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm font-black text-foreground uppercase tracking-wider">Active</p>
                        </div>
                    </div>
                    <div className="px-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Lease Hash</p>
                        <p className="text-sm font-mono text-muted-foreground">0x{shortHash}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
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

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    
                    {/* Main Content Column */}
                    <div className="lg:col-span-3 space-y-8">
                        
                        {activeTab === "agreement" && (
                            <div className="space-y-8">
                                {/* Hero Card - The Agreement */}
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[300px] flex flex-col justify-between">
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={imgUrl}
                                            alt="Property"
                                            fill
                                            className="object-cover opacity-[0.08] grayscale"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-transparent" />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Source of Truth</p>
                                                <h2 className="text-4xl font-black text-foreground tracking-tighter">Master Lease Agreement</h2>
                                                <p className="text-muted-foreground font-medium text-sm mt-1">{lease.unit.property.name} • Unit {lease.unit.name}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="h-10 px-4 rounded-xl border border-border bg-background text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2 shadow-sm">
                                                    <Download className="size-3" /> Download PDF
                                                </button>
                                                <button 
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="h-10 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/10"
                                                >
                                                    <FileText className="size-3" /> View Lease
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                                                <p className="text-base font-black text-foreground">{formatDate(lease.start_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">End Date</p>
                                                <p className="text-base font-black text-foreground">{formatDate(lease.end_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Monthly Rent</p>
                                                <p className="text-base font-black text-primary">{formatCurrency(lease.monthly_rent)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Security Deposit</p>
                                                <p className="text-base font-black text-foreground">{formatCurrency(lease.security_deposit)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                                                <CheckCircle2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-foreground">Legally Signed</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Signed on {formatDate(lease.signed_at || lease.start_date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Encrypted & Stored in Vault</p>
                                            <div className="size-2 rounded-full bg-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Renewal Status Banner */}
                                {renewalRequest && (
                                    <div className={cn(
                                        "border rounded-[2rem] p-6 shadow-sm flex items-center gap-4",
                                        renewalRequest.status === "pending" && "bg-amber-500/5 border-amber-500/20",
                                        renewalRequest.status === "approved" && "bg-emerald-500/5 border-emerald-500/20",
                                        renewalRequest.status === "rejected" && "bg-red-500/5 border-red-500/20"
                                    )}>
                                        <div className={cn(
                                            "size-10 rounded-xl flex items-center justify-center",
                                            renewalRequest.status === "pending" && "bg-amber-500/10 text-amber-600",
                                            renewalRequest.status === "approved" && "bg-emerald-500/10 text-emerald-600",
                                            renewalRequest.status === "rejected" && "bg-red-500/10 text-red-600"
                                        )}>
                                            {renewalRequest.status === "pending" && <Clock className="size-5" />}
                                            {renewalRequest.status === "approved" && <CheckCircle2 className="size-5" />}
                                            {renewalRequest.status === "rejected" && <X className="size-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">
                                                {renewalRequest.status === "pending" && "Renewal Request Pending"}
                                                {renewalRequest.status === "approved" && "Renewal Approved!"}
                                                {renewalRequest.status === "rejected" && "Renewal Request Rejected"}
                                            </p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {renewalRequest.status === "pending" && "Awaiting landlord response"}
                                                {renewalRequest.status === "approved" && "New lease ready for signing"}
                                                {renewalRequest.status === "rejected" && (renewalRequest.landlord_notes || "Contact your landlord")}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Lease Lifecycle Section */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm ring-1 ring-border relative overflow-hidden flex flex-col justify-center">
                                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] select-none pointer-events-none">
                                            <Clock className="size-24" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-6">Residency Lifecycle</p>
                                        
                                        <div className="space-y-8">
                                            <div className="relative">
                                                <div className="h-4 w-full bg-muted rounded-full overflow-hidden border border-border">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                                        style={{ width: `${progressData.percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Day {progressData.dayCount}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="size-3 text-primary" />
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{progressData.daysRemaining} Days Remaining</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-8 items-center pt-4 border-t border-border/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                                        <CheckCircle className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Move-in Verified</p>
                                                        <p className="text-sm font-black text-foreground">{formatDate(lease.start_date)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                                        <History className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Move-out Target</p>
                                                        <p className="text-sm font-black text-foreground">{formatDate(lease.end_date)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                         <LeaseRenewalRequest 
                                             daysRemaining={progressData.daysRemaining} 
                                             leaseId={lease?.id} 
                                             renewalSettings={lease?.unit.property.renewal_settings}
                                         />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "property" && (
                            <div className="space-y-8">
                                {/* Unit Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
                                            <Building2 className="size-32" />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-4">Unit Specifications</p>
                                        <div className="grid grid-cols-2 gap-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                    <Maximize className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Floor Area</p>
                                                    <p className="text-base font-black text-foreground">{lease.unit.sqft || '35'} SQFT</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                    <Layers className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Level</p>
                                                    <p className="text-base font-black text-foreground">Floor {lease.unit.floor}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                    <Bed className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Bedrooms</p>
                                                    <p className="text-base font-black text-foreground">{lease.unit.beds} Bedroom</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                                                    <Bath className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Bathrooms</p>
                                                    <p className="text-base font-black text-foreground">{lease.unit.baths} Private</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-1 space-y-10">
                                        {/* Building Amenities */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                                                    <Building2 className="size-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-foreground tracking-tight">Building Amenities</h4>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Exclusive Residency Benefits</p>
                                                </div>
                                            </div>
                                            <PropertyAmenities amenities={lease.unit.property.amenities || []} />
                                        </div>
                                    </div>
                                </div>

                                {/* House Rules Section */}
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm ring-1 ring-border">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-6">Building Regulations</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                        {lease.unit.property.house_rules.length > 0 ? (
                                            lease.unit.property.house_rules.map((rule, i) => (
                                                <div key={i} className="flex items-start gap-4 group">
                                                    <div className="size-6 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-all">
                                                        <p className="text-[10px] font-black">{i + 1}</p>
                                                    </div>
                                                    <p className="text-xs font-bold text-foreground leading-relaxed">{rule}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">Refer to the master lease for building-specific guidelines.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "services" && (
                            <div className="space-y-12">
                                {/* Service Requests Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Operational Requests</h3>
                                        <div className="h-px flex-1 bg-border/50 mx-6 hidden md:block" />
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <Shield className="size-3" /> Managed by Protocol
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {/* Move Out Request Wrapper */}
                                          <div className="lg:col-span-1">
                                              <MoveOutRequest variant="hub" initialRequest={mockMoveOutRequest} />
                                          </div>

                                         {/* Unit Transfer Request */}
                                         <div className="lg:col-span-1">
                                             <UnitTransferRequest currentUnitId={lease.unit.id} />
                                         </div>
                                     </div>
                                </div>

                                {/* Management Support Card */}
                                <div className="bg-card border border-border rounded-[3rem] p-12 shadow-sm ring-1 ring-border relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-80" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" />
                                    
                                    <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
                                        <div 
                                            className="size-28 rounded-full border-4 border-card mx-auto overflow-hidden shadow-2xl ring-4 ring-primary/5 mb-8"
                                            style={{ backgroundColor: lease.landlord?.avatar_bg_color || '#171717' }}
                                        >
                                            <Image
                                                src={lease.landlord?.avatar_url || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80"}
                                                alt="Landlord"
                                                width={112}
                                                height={112}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                        
                                        <div className="space-y-4 mb-10">
                                            <div>
                                                <h3 className="text-3xl font-black text-foreground tracking-tighter">{lease.landlord?.full_name || "Your Property Manager"}</h3>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-2 flex items-center justify-center gap-2">
                                                    <ShieldCheck className="size-4" /> Landlord
                                                </p>
                                            </div>
                                            <p className="text-base text-muted-foreground leading-relaxed">
                                                Have a question about your unit or need to discuss your agreement? You can send a secure message directly to your landlord through the iReside chat.
                                            </p>
                                        </div>

                                        <div className="w-full max-w-sm mx-auto">
                                            <Link href="/tenant/messages" className="w-full py-5 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                                                <MessageSquare className="size-5" /> Send a Message
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Reference Card */}
                        <div className="bg-muted/20 border border-dashed border-border rounded-[2rem] p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                            <div className="size-12 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground mb-4">
                                <Building2 className="size-6" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Assigned Unit</p>
                            <p className="text-lg font-black text-foreground tracking-tight">{lease.unit.name}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{lease.unit.property.name}</p>
                            <div className="mt-6 pt-6 border-t border-border/50 w-full">
                                <Link href="/tenant/dashboard" className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center justify-center gap-2">
                                    Return to Dashboard <ArrowUpRight className="size-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lease Modal */}
            {lease && (
                <LeaseModal 
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    leaseData={lease}
                />
            )}
        </div>
    );
}

export default function LeasesPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">Initializing Vault...</p>
            </div>
        }>
            <LeaseHubContent />
        </Suspense>
    );
}

