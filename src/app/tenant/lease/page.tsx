import {
    FileText,
    Download,
    Calendar,
    CheckCircle2,
    Clock,
    Home,
    ShieldCheck,
    AlertCircle,
    ChevronRight,
    MapPin,
    FileSignature,
    Key,
    ScrollText
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import MoveOutRequest from "@/components/tenant/MoveOutRequest";

export default function LeasesPage() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-4xl md:text-5xl font-display text-white mb-3 mt-4">Smart Lease Hub</h1>
                <p className="text-white/60 text-sm md:text-base max-w-2xl">
                    Your digital and cryptographic lease agreement vault. View contract terms, download authorized copies, and track your lease lifecycle.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content (Left) */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Active Lease Hero Card */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl group border border-white/10 mt-2">
                        {/* Background Image & Overlay */}
                        <div className="absolute inset-0 z-0">
                            <Image
                                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
                                alt="Property"
                                fill
                                className="object-cover opacity-30 group-hover:scale-105 group-hover:opacity-40 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between min-h-[380px]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md mb-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Active Smart Contract
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-display text-white mb-2 tracking-tight">
                                        The Skyline Loft
                                    </h2>
                                    <p className="text-white/70 flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4" /> Unit 402, The Towers Residence
                                    </p>
                                </div>

                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-1">Contract Hash</p>
                                    <p className="font-mono text-xs text-white/30 truncate w-32">0x8fB2...c9A1</p>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2">Monthly Rent</p>
                                        <p className="text-2xl font-display text-white tabular-nums">₱18,500</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2">Security Deposit</p>
                                        <p className="text-2xl font-display text-white tabular-nums">₱37,000</p>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2">Payment Cycle</p>
                                        <p className="text-2xl font-display text-white">1st of Month</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="h-12 px-6 rounded-full bg-white text-black hover:bg-white/90 transition-colors text-sm font-bold flex items-center gap-2 flex-shrink-0">
                                        <FileSignature className="w-4 h-4" /> Signatures
                                    </button>
                                    <button className="h-12 w-12 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white backdrop-blur-md transition-colors flex-shrink-0">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Terms Highlights */}
                    <div>
                        <h3 className="text-xl font-display text-white mb-4 flex items-center gap-2">
                            <ScrollText className="w-5 h-5 text-primary" /> Key Provisions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-3xl bg-card border border-border/50 hover:bg-white/[0.02] transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">Included Utilities</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Water and Internet (Up to 100Mbps) are included in the monthly rent. Electricity is sub-metered.</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-card border border-border/50 hover:bg-white/[0.02] transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Home className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">Maintenance</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">Landlord covers structural and major appliance repairs. Tenant handles minor wear & tear.</p>
                            </div>
                            <div className="p-5 rounded-3xl bg-card border border-border/50 hover:bg-white/[0.02] transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                    <Key className="w-5 h-5" />
                                </div>
                                <h4 className="text-sm font-bold text-white mb-1">Subletting & Guests</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">No subletting permitted. Guests staying over 14 consecutive days require landlord approval.</p>
                            </div>
                        </div>
                    </div>

                    {/* Document Vault */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-display text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" /> Document Vault
                            </h3>
                            <button className="text-[10px] font-bold tracking-widest text-primary uppercase hover:text-white transition-colors">
                                View All
                            </button>
                        </div>
                        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-xl shadow-black/20">
                            <div className="divide-y divide-border/50">
                                {[
                                    { title: "Master Lease Agreement", date: "Dec 15, 2023", type: "Contract", status: "Signed" },
                                    { title: "Move-In Condition Report", date: "Jan 01, 2024", type: "Report", status: "Verified", isNew: true },
                                    { title: "Building Rules & Regulations", date: "Dec 15, 2023", type: "Addendum", status: "Acknowledged" },
                                    { title: "Lease Renewal Option Notice", date: "Sep 01, 2024", type: "Notice", status: "Action Required" }
                                ].map((doc, i) => (
                                    <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 rounded-2xl bg-background border border-border flex items-center justify-center text-white/40 group-hover:text-primary group-hover:bg-primary/5 transition-colors group-hover:border-primary/20 shadow-sm">
                                                <FileText className="w-5 h-5" />
                                                {doc.isNew && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white group-hover:text-primary transition-colors flex items-center gap-2 text-sm md:text-base">
                                                    {doc.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{doc.date} • {doc.type}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                                doc.status === "Signed" || doc.status === "Verified" || doc.status === "Acknowledged"
                                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                            )}>
                                                {doc.status === "Signed" || doc.status === "Verified" || doc.status === "Acknowledged" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {doc.status}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                                <button className="p-2 text-white/50 hover:text-white bg-background border border-border rounded-xl hover:border-white/20 transition-all hover:bg-white/5">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-white/50 hover:text-white bg-background border border-border rounded-xl hover:border-white/20 transition-all hover:bg-white/5">
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-6">

                    {/* Timeline & Renewal Card */}
                    <div className="rounded-3xl border border-primary/20 bg-background/50 relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(var(--primary),0.05)] pt-6 pb-4 px-6">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                        <h3 className="text-lg font-display text-white mb-6">Lease Timeline</h3>

                        <div className="relative mb-8">
                            {/* Start/End labels */}
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Start Date</p>
                                    <p className="font-mono text-xs text-white">Jan 01, 2024</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">End Date</p>
                                    <p className="font-mono text-xs text-white">Dec 31, 2024</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                                <div className="h-full bg-gradient-to-r from-primary/50 to-primary w-[72%] rounded-full relative shadow-[0_0_10px_rgba(var(--primary),0.5)]">
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-white/80 tracking-wider">DAY 265</span>
                                <span className="text-sm font-medium text-white/60">
                                    <strong className="text-white">101 days</strong> remaining
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-2 text-center group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <p className="text-xs font-medium text-primary/90 mb-3">You are eligible to renew your lease.</p>
                            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]">
                                View Renewal Proposal
                            </button>
                        </div>
                    </div>

                    {/* Move-Out Component */}
                    <MoveOutRequest />

                    {/* Support Card */}
                    <div className="rounded-3xl border border-border/50 bg-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

                        <div className="w-20 h-20 rounded-full bg-background border-2 border-border/50 flex items-center justify-center mb-4 overflow-hidden relative shadow-lg group-hover:border-primary/50 transition-colors">
                            <Image
                                src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80"
                                alt="Property Manager"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h4 className="text-lg font-display text-white mb-0.5 group-hover:text-primary transition-colors">Marcus Thorne</h4>
                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4">Property Manager</p>

                        <p className="text-sm text-white/70 leading-relaxed mb-6">
                            Have questions regarding your lease terms, deposits, or require an addendum?
                        </p>

                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/10">
                                Message
                            </button>
                            <button className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/10">
                                Book Call
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
