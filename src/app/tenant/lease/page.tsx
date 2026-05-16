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
    const [lease, setLease] = useState<LeaseData | null>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<TabId>("agreement");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    type RenewalStatus = "pending" | "approved" | "rejected";

    const [renewalRequest, setRenewalRequest] = useState<{
        status: RenewalStatus;
        landlord_notes?: string | null;
        requested_date?: string;
        created_at?: string;
    } | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchLeaseData = async () => {
            try {
                const response = await fetch("/api/tenant/lease", { cache: "no-store" });
                if (!response.ok) throw new Error("Failed to load lease");
                const responseData = await response.json();
                
                if (isMounted && responseData.lease) {
                    setLease(responseData.lease as LeaseData);
                    
                    try {
                        const renewalResponse = await fetch("/api/tenant/renewals", { cache: "no-store" });
                        if (renewalResponse.ok) {
                            const renewalRequests = await renewalResponse.json();
                            const activeLeaseRenewal = renewalRequests?.find((renewal: { current_lease_id: string }) => renewal.current_lease_id === responseData.lease.id);
                            if (isMounted) setRenewalRequest(activeLeaseRenewal);
                        }
                    } catch (error) {
                        console.error("Failed to fetch renewal requests:", error);
                    }
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchLeaseData();
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
        if (!lease?.start_date || !lease?.end_date) return { daysRemaining: 0, totalDays: 1, percent: 0, dayCount: 0 };
        const startTimestamp = new Date(lease.start_date).getTime();
        const endTimestamp = new Date(lease.end_date).getTime();
        const currentTimestamp = Date.now();

        const totalMs = endTimestamp - startTimestamp;
        const elapsedMs = Math.max(0, Math.min(currentTimestamp - startTimestamp, totalMs));
        const remainingMs = Math.max(0, endTimestamp - currentTimestamp);

        const totalDays = Math.max(1, Math.round(totalMs / 86400000));
        const daysRemaining = Math.max(0, Math.round(remainingMs / 86400000));
        const percent = Math.min(100, (elapsedMs / totalMs) * 100);
        const dayCount = Math.round(elapsedMs / 86400000) + 1;

        return { daysRemaining, totalDays, percent, dayCount };
    }, [lease]);

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

    const propertyThumbnailUrl = lease.unit.property.images?.[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop";
    const shortHash = lease.id.replace(/-/g, "").substring(0, 8).toUpperCase();

    const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
        { id: "agreement", label: "Agreement", icon: ScrollText },
        { id: "property", label: "The Residence", icon: Home },
        { id: "services", label: "Governance", icon: Shield },
    ];

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
            <LeaseTour />
            <LeaseRenewalReminder 
                daysRemaining={progressData.daysRemaining} 
                leaseId={lease?.id}
                teamMembers={lease?.landlord ? [{ avatar_url: lease.landlord.avatar_url, name: lease.landlord.full_name }] : undefined}
            />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-4xl font-black text-foreground tracking-tighter">
                            Lease Hub
                        </h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm max-w-2xl">
                        Your digital source of truth for your residency, agreement terms, and unit specifications.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-[1.5rem] p-3 shadow-sm flex items-center gap-6 ring-1 ring-primary/5">
                    <div className="px-1 border-r border-border/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Contract Status</p>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-sm font-black text-foreground uppercase tracking-wider">Active</p>
                        </div>
                    </div>
                    <div className="px-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Lease Hash</p>
                        <p className="text-sm font-mono text-muted-foreground">0x{shortHash}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-muted/30 border border-border rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.id}
                        onClick={() => setActiveTab(tabItem.id)}
                        className={cn(
                            "flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
                            activeTab === tabItem.id 
                                ? "bg-card text-primary shadow-sm border border-border" 
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <tabItem.icon className="size-4" />
                        {tabItem.label}
                    </button>
                ))}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-3 space-y-8">
                        {activeTab === "agreement" && (
                            <div className="space-y-8">
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border min-h-[300px] flex flex-col justify-between">
                                    <div className="absolute inset-0 z-0">
                                        <Image
                                            src={propertyThumbnailUrl}
                                            alt="Property"
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 850px"
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
                                                <p className="text-base font-black text-primary">₱{formatCurrency(lease.monthly_rent)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Security Deposit</p>
                                                <p className="text-base font-black text-foreground">₱{formatCurrency(lease.security_deposit)}</p>
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
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Signed on {formatDate(lease.signed_at || lease.start_date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Encrypted & Stored in Vault</p>
                                            <div className="size-2 rounded-full bg-emerald-500" />
                                        </div>
                                    </div>
                                </div>

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
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                {renewalRequest.status === "pending" && "Awaiting landlord response"}
                                                {renewalRequest.status === "approved" && "New lease ready for signing"}
                                                {renewalRequest.status === "rejected" && (renewalRequest.landlord_notes || "Contact your landlord")}
                                            </p>
                                        </div>
                                    </div>
                                )}

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
                                             renewalSettings={undefined}
                                         />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "property" && (
                            <div className="space-y-8">
                                {/* Unit Specifications */}
                                <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden ring-1 ring-border">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] select-none pointer-events-none">
                                        <Maximize className="size-64 -mt-16 -mr-16" />
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                                                <Layers className="size-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-foreground tracking-tight">Unit Specifications</h4>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5">Physical Configuration</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                                        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                            <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                                <Maximize className="size-5" />
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Floor Area</p>
                                                <p className="text-2xl font-black text-foreground">{lease.unit.sqft ? `${lease.unit.sqft} SQFT` : 'Contact'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                            <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                                <Layers className="size-5" />
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Level</p>
                                                <p className="text-2xl font-black text-foreground">Floor {lease.unit.floor}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                            <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                                <Bed className="size-5" />
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Bedrooms</p>
                                                <p className="text-2xl font-black text-foreground">{lease.unit.beds} Bed</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                            <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                                <Bath className="size-5" />
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Bathrooms</p>
                                                <p className="text-2xl font-black text-foreground">{lease.unit.baths} Bath</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities and Regulations */}
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                    <div className="md:col-span-3 space-y-6">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/5">
                                                <Building2 className="size-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-foreground tracking-tight">Facilities & Amenities</h4>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Exclusive Residency Benefits</p>
                                            </div>
                                        </div>
                                        <PropertyAmenities amenities={lease.unit.property.amenities || []} />
                                    </div>
                                    
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 shadow-sm shadow-amber-500/5">
                                                <ShieldCheck className="size-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-foreground tracking-tight">Building Regulations</h4>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">Community Guidelines</p>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm ring-1 ring-border h-fit">
                                            <div className="space-y-4">
                                                {lease.unit.property.house_rules.length > 0 ? (
                                                    lease.unit.property.house_rules.map((ruleText, ruleIndex) => (
                                                        <div key={ruleText} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:bg-muted/50 transition-colors">
                                                            <div className="size-7 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0 shadow-sm mt-0.5 group-hover:text-foreground transition-colors">
                                                                <p className="text-[11px] font-black">{ruleIndex + 1}</p>
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground leading-relaxed">{ruleText}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-center space-y-3 py-10">
                                                        <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                            <FileText className="size-5" />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground max-w-[200px]">Refer to the master lease for building-specific guidelines.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "services" && (
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Operational Requests</h3>
                                        <div className="h-px flex-1 bg-border/50 mx-6 hidden md:block" />
                                        <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                            <Shield className="size-3" /> Managed by Protocol
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="lg:col-span-1">
                                              <MoveOutRequest variant="hub" />
                                          </div>

                                         <div className="lg:col-span-1">
                                             <UnitTransferRequest currentUnitId={lease.unit.id} />
                                         </div>
                                     </div>
                                </div>

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

                    <div className="lg:col-span-1">
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm ring-1 ring-border relative overflow-hidden group transition-all hover:shadow-lg">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity select-none pointer-events-none">
                                <Building2 className="size-24" />
                            </div>
                            
                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                    <Building2 className="size-8" />
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Assigned Unit</p>
                                    <h3 className="text-2xl font-black text-foreground tracking-tighter">{lease.unit.name}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{lease.unit.property.name}</p>
                                </div>
                                
                                <div className="w-full pt-6 border-t border-border/50">
                                    <Link 
                                        href="/tenant/dashboard" 
                                        className="inline-flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group/link"
                                    >
                                        Return to Dashboard 
                                        <ArrowUpRight className="size-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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

