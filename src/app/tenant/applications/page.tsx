"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Clock,
    ChevronRight,
    Home,
    MapPin,
    Calendar,
    AlertTriangle,
    Filter,
    ArrowRight,
    Zap,
    History,
    Heart,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ApplicationData = {
    applications: Array<any>;
    savedProperties: Array<any>;
    recentActivity: Array<any>;
};

export default function MyApplicationsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("recently-updated");
    
    const [data, setData] = useState<ApplicationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const res = await fetch("/api/tenant/applications", { cache: "no-store"});
                if (!res.ok) throw new Error("Failed to load");
                const payload = await res.json();
                if (isMounted) setData(payload);
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    const getStatusStyles = (color: string) => {
        switch (color) {
            case "red":
                return "bg-red-500/20 text-red-400 border-red-500/20";
            case "yellow":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/20";
            case "primary":
                return "bg-primary/20 text-primary border-primary/20";
            default:
                return "bg-blue-500/20 text-blue-400 border-blue-500/20";
        }
    };

    const getProgressColor = (color: string) => {
        switch (color) {
            case "red": return "#ef4444";
            case "yellow": return "#fbbf24";
            default: return "#6d9838";
        }
    };

    const mapStatus = (status: string) => {
        switch(status?.toLowerCase()) {
            case "pending": return { subStatus: "Awaiting Review", detail: "Waiting for landlord review", progress: 30, color: "yellow", displayStatus: "Landlord Review" };
            case "reviewing": return { subStatus: "In Review", detail: "Landlord is reviewing documents.", progress: 60, color: "primary", displayStatus: "In Review" };
            case "approved": return { subStatus: "Approved", detail: "Ready to sign lease.", progress: 100, color: "primary", displayStatus: "Approved" };
            case "rejected": return { subStatus: "Declined", detail: "Application not approved.", progress: 100, color: "red", displayStatus: "Rejected" };
            case "withdrawn": return { subStatus: "Withdrawn", detail: "Application withdrawn.", progress: 0, color: "red", displayStatus: "Withdrawn" };
            default: return { subStatus: "Unknown", detail: "Status unavailable", progress: 0, color: "primary", displayStatus: status };
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    };

    const formatRelativeTime = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Recently";
        const diffMs = Date.now() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 1) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    };

    const fallbackImage = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=2600";

    const attentionNeededCount = data?.applications?.filter(a => a.status === 'pending' || a.status === 'reviewing')?.length || 0;

    return (
        <div className="relative min-h-screen pb-10">
            {/* Ambient Animated Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {attentionNeededCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-[#0d0d0d]/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl border-l-4 border-l-red-500/50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-2xl shadow-red-500/10 shrink-0 border border-red-500/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white text-xl font-extrabold tracking-tight">Active Attention Needed</h3>
                                <p className="text-white/50 text-sm mt-1">You have <span className="text-red-400 font-bold">{attentionNeededCount} item{attentionNeededCount > 1 ? 's' : ''}</span> requiring attention.</p>
                            </div>
                        </div>
                        <button className="relative z-10 w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 transition-all text-sm shadow-xl active:scale-95">
                            Resolve Issues
                        </button>
                    </motion.div>
                )}

                {/* Page Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-1 w-6 bg-primary rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Applications Portfolio</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">My <span className="text-primary italic">Journey</span></h1>
                        <p className="text-white/40 font-medium max-w-md">Track the status of your future homes and manage active lease negotiations.</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                        {[
                            { id: "recently-updated", label: "Recently Updated" },
                            { id: "rent-price", label: "Rent Price" },
                            { id: "status", label: "Status" },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                    filter === item.id
                                        ? "bg-primary text-black shadow-lg shadow-primary/20"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <button className="p-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main List */}
                    <div className="lg:col-span-8 space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 opacity-50">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                <span className="text-sm font-bold uppercase tracking-widest text-white/50">Loading Applications...</span>
                            </div>
                        ) : data?.applications?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 border border-white/5 bg-[#111]/80 backdrop-blur-md rounded-[3rem] text-center">
                                <AlertTriangle className="w-10 h-10 text-white/20 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
                                <p className="text-sm text-white/40">You haven't applied to any properties yet.</p>
                                <Link href="/search" className="mt-6 px-6 py-3 bg-primary text-black font-bold uppercase tracking-widest text-[10px] rounded-2xl">
                                    Browse Properties
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {data?.applications?.map((app, idx) => {
                                        const mapped = mapStatus(app.status);
                                        const radius = 45;
                                        const circumference = 2 * Math.PI * radius;
                                        const offset = circumference - (mapped.progress / 100) * circumference;
                                        
                                        const property = app.unit?.property;
                                        const imgUrl = property?.images?.[0] || fallbackImage;
                                        const submittedAt = new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                                        return (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <Link
                                                    href={`/tenant/applications/${app.id}`}
                                                    className="group bg-[#111111]/80 border border-white/5 rounded-[3rem] overflow-hidden hover:border-primary/30 transition-all duration-500 shadow-2xl flex flex-col h-full relative"
                                                >
                                                    <div className="relative h-56 overflow-hidden bg-white/5">
                                                        <Image
                                                            src={imgUrl}
                                                            alt={property?.name || "Property"}
                                                            fill
                                                            className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:grayscale-0 grayscale-[0.3]"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                            <span className={cn(
                                                                "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl shadow-2xl",
                                                                getStatusStyles(mapped.color)
                                                            )}>
                                                                {mapped.displayStatus}
                                                            </span>
                                                            {mapped.progress > 75 && (
                                                                <div className="px-3 py-1.5 rounded-xl bg-primary text-black flex items-center gap-1.5 w-fit shadow-lg shadow-primary/40 animate-pulse">
                                                                    <Zap className="w-3 h-3 fill-black" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest">Priority</span>
                                                                </div>
                                                            )}
                                                            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 w-fit">
                                                                <Calendar className="w-3 h-3 text-white/40" />
                                                                <span className="text-[9px] font-bold text-white/60">{submittedAt}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 flex-1 flex flex-col gap-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                                                                    {property?.name || "Unknown Property"}
                                                                </h3>
                                                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{property?.city || 'Location'} • {property?.type || 'Property'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white text-xl font-black">₱{formatCurrency(app.unit?.rent_amount || 0)}<span className="text-white/20 text-xs font-bold uppercase">/mo</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent pointer-events-none" />
                                                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                                    <circle cx="50" cy="50" fill="none" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                                                    <motion.circle
                                                                        cx="50" cy="50" fill="none" r={radius}
                                                                        stroke={getProgressColor(mapped.color)}
                                                                        strokeDasharray={circumference}
                                                                        initial={{ strokeDashoffset: circumference }}
                                                                        animate={{ strokeDashoffset: offset }}
                                                                        transition={{ duration: 2, ease: "circOut" }}
                                                                        strokeLinecap="round" strokeWidth="10"
                                                                        className={cn(mapped.color === 'primary' && "drop-shadow-[0_0_8px_rgba(109,152,56,0.6)]")}
                                                                    />
                                                                </svg>
                                                                <span className="absolute text-[10px] font-black text-white leading-none">{mapped.progress}%</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-black text-white italic tracking-tight">{mapped.subStatus}</p>
                                                                <p className="text-[10px] text-white/40 font-medium line-clamp-1 mt-0.5">{mapped.detail}</p>
                                                            </div>
                                                        </div>

                                                        <button className="w-full h-14 rounded-2xl bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/10 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3">
                                                            Expand Details
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Premium Components */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Recent Activity Card */}
                        <div className="bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <History className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-white font-extrabold text-lg tracking-tight">Timeline</h3>
                                </div>
                                <span className={cn("h-1.5 w-1.5 rounded-full", loading ? "bg-white/20" : "bg-primary animate-ping")} />
                            </div>

                            <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                {loading ? (
                                    <div className="animate-pulse space-y-6">
                                        {[1,2,3].map(i => (
                                            <div key={i} className="space-y-2">
                                                <div className="h-3 w-32 bg-white/10 rounded" />
                                                <div className="h-2 w-48 bg-white/5 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : data?.recentActivity?.length === 0 ? (
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center py-4">No recent activity</p>
                                ) : (
                                    data?.recentActivity?.map((activity, i) => (
                                        <div key={i} className="relative group cursor-default">
                                            <div className={cn(
                                                "box-content absolute -left-[27.5px] top-1 h-2 w-2 rounded-full border-2 border-[#111111] transition-all",
                                                !activity.read ? "bg-primary scale-125 shadow-[0_0_12px_rgba(109,152,56,0.8)]" : "bg-white/10"
                                            )} />
                                            <p className="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight line-clamp-1">{activity.title}</p>
                                            <p className="text-xs text-white/40 font-medium mt-1 leading-relaxed line-clamp-2">{activity.message}</p>
                                            <div className="flex items-center gap-1.5 mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">{formatRelativeTime(activity.created_at)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Saved for Later - Enhanced */}
                        <div className="bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <Heart className="w-32 h-32 rotate-12" />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white font-extrabold text-lg tracking-tight">Vaulted</h3>
                                <span className="text-[10px] font-black bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-white/40 uppercase tracking-widest">
                                    {data?.savedProperties?.length || 0} Items
                                </span>
                            </div>

                            <div className="space-y-6">
                                {loading ? (
                                    <div className="animate-pulse space-y-4">
                                        {[1,2].map(i => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5" />
                                                <div className="flex-1 space-y-2 py-2">
                                                    <div className="h-3 w-2/3 bg-white/10 rounded" />
                                                    <div className="h-2 w-1/3 bg-white/5 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : data?.savedProperties?.length === 0 ? (
                                    <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center py-4">Nothing vaulted yet</p>
                                ) : (
                                    data?.savedProperties?.map((savedItem, i) => {
                                        const prop = savedItem.property;
                                        if (!prop) return null;
                                        
                                        const unitPrices = prop.units?.map((u: any) => Number(u.rent_amount) || 0) || [];
                                        const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : 0;

                                        return (
                                            <div key={i} className="flex gap-5 group cursor-pointer transition-all">
                                                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-[#1a1a1a] shrink-0 border border-white/5">
                                                    <Image
                                                        src={prop.images?.[0] || fallbackImage}
                                                        alt={prop.name}
                                                        width={80}
                                                        height={80}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                                    <h4 className="text-white font-black text-sm truncate group-hover:text-primary transition-colors tracking-tight">{prop.name}</h4>
                                                    <p className="text-primary font-bold text-xs leading-none">₱{formatCurrency(minPrice)}<span className="text-white/20 font-black text-[9px] ml-1">/mo upward</span></p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Link
                                                            href={`/search`}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-black bg-primary px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-primary/10 active:scale-95"
                                                        >
                                                            <Zap className="w-2.5 h-2.5" />
                                                            Apply
                                                        </Link>
                                                        <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-red-400 transition-colors">
                                                            <Heart className="w-3 h-3 fill-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <Link href="/search" className="block w-full mt-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-dashed border-white/10 rounded-3xl hover:border-primary/50 hover:text-primary transition-all text-center">
                                Discover More Properties
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
