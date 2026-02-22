"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Search,
    Home,
    MapPin,
    Calendar,
    ArrowLeft,
    AlertTriangle,
    Filter,
    ArrowRight,
    Star,
    Zap,
    History,
    Heart,
    Sparkles,
    ShieldCheck,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { properties } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

// Mock applications data expanded for the new design
const mockApplications = [
    {
        id: "APP-2026-89A4B",
        propertyId: "1",
        status: "Action Required",
        subStatus: "Missing Documents",
        detail: "Please upload your 2023 Tax Return.",
        progress: 65,
        submittedAt: "2026-02-22",
        price: "18,500",
        color: "red",
    },
    {
        id: "APP-2026-45X2C",
        propertyId: "4",
        status: "Landlord Review",
        subStatus: "In Review",
        detail: "Expected update within 24 hours.",
        progress: 80,
        submittedAt: "2026-02-15",
        price: "25,000",
        color: "primary",
    },
    {
        id: "APP-2025-12Z9F",
        propertyId: "2",
        status: "Under Negotiation",
        subStatus: "Lease Terms",
        detail: "Counter-offer received from owner.",
        progress: 90,
        submittedAt: "2025-11-10",
        price: "12,000",
        color: "yellow",
    }
];

const recentActivity = [
    { title: "Application Viewed", detail: "Landlord viewed \"The Obsidian Tower\"", time: "2 hours ago", active: true },
    { title: "Message Received", detail: "From Sarah Jenkins re: Unit 12B", time: "Yesterday, 4:30 PM", active: false },
    { title: "Status Updated", detail: "The Vertex moved to 'Negotiation'", time: "Oct 10, 9:00 AM", active: false },
];

export default function MyApplicationsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("recently-updated");

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

    return (
        <div className="relative min-h-screen pb-10">
            {/* Ambient Animated Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Action Required Banner - Refined */}
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
                            <p className="text-white/50 text-sm mt-1">You have <span className="text-red-400 font-bold">2 items</span> requiring immediate document verification.</p>
                        </div>
                    </div>
                    <button className="relative z-10 w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-white/90 transition-all text-sm shadow-xl active:scale-95">
                        Resolve Issues
                    </button>
                </motion.div>

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <AnimatePresence mode="popLayout">
                                {mockApplications.map((app, idx) => {
                                    const property = properties.find(p => p.id === app.propertyId) || properties[0];
                                    const radius = 45;
                                    const circumference = 2 * Math.PI * radius;
                                    const offset = circumference - (app.progress / 100) * circumference;

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
                                                {/* Image Section */}
                                                <div className="relative h-56 overflow-hidden">
                                                    <Image
                                                        src={property.images[0]}
                                                        alt={property.name}
                                                        fill
                                                        className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:grayscale-0 grayscale-[0.3]"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                                                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                        <span className={cn(
                                                            "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl shadow-2xl",
                                                            getStatusStyles(app.color)
                                                        )}>
                                                            {app.status}
                                                        </span>
                                                        {app.progress > 75 && (
                                                            <div className="px-3 py-1.5 rounded-xl bg-primary text-black flex items-center gap-1.5 w-fit shadow-lg shadow-primary/40 animate-pulse">
                                                                <Zap className="w-3 h-3 fill-black" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Priority</span>
                                                            </div>
                                                        )}
                                                        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 w-fit">
                                                            <Calendar className="w-3 h-3 text-white/40" />
                                                            <span className="text-[9px] font-bold text-white/60">{app.submittedAt}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 flex-1 flex flex-col gap-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors tracking-tighter">
                                                                {property.name}
                                                            </h3>
                                                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{property.address.split(',')[0]} • {property.type}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-white text-xl font-black">₱{app.price}<span className="text-white/20 text-xs font-bold uppercase">/mo</span></p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent pointer-events-none" />
                                                        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                                <circle cx="50" cy="50" fill="none" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                                                <motion.circle
                                                                    cx="50" cy="50" fill="none" r={radius}
                                                                    stroke={getProgressColor(app.color)}
                                                                    strokeDasharray={circumference}
                                                                    initial={{ strokeDashoffset: circumference }}
                                                                    animate={{ strokeDashoffset: offset }}
                                                                    transition={{ duration: 2, ease: "circOut" }}
                                                                    strokeLinecap="round" strokeWidth="10"
                                                                    className={cn(app.color === 'primary' && "drop-shadow-[0_0_8px_rgba(109,152,56,0.6)]")}
                                                                />
                                                            </svg>
                                                            <span className="absolute text-[10px] font-black text-white leading-none">{app.progress}%</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-black text-white italic tracking-tight">{app.subStatus}</p>
                                                            <p className="text-[10px] text-white/40 font-medium line-clamp-1 mt-0.5">{app.detail}</p>
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

                        {/* Pagination or Empty State would go here */}
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
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                            </div>

                            <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="relative group cursor-default">
                                        <div className={cn(
                                            "box-content absolute -left-[27.5px] top-1 h-2 w-2 rounded-full border-2 border-[#111111] transition-all",
                                            activity.active ? "bg-primary scale-125 shadow-[0_0_12px_rgba(109,152,56,0.8)]" : "bg-white/10"
                                        )} />
                                        <p className="text-sm font-black text-white group-hover:text-primary transition-colors tracking-tight">{activity.title}</p>
                                        <p className="text-xs text-white/40 font-medium mt-1 leading-relaxed">{activity.detail}</p>
                                        <div className="flex items-center gap-1.5 mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">{activity.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Saved for Later - Enhanced */}
                        <div className="bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <Heart className="w-32 h-32 rotate-12" />
                            </div>

                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white font-extrabold text-lg tracking-tight">Vaulted</h3>
                                <span className="text-[10px] font-black bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-white/40 uppercase tracking-widest">3 Items</span>
                            </div>

                            <div className="space-y-6">
                                {properties.slice(2, 4).map((prop, i) => (
                                    <div key={i} className="flex gap-5 group cursor-pointer transition-all">
                                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-[#1a1a1a] shrink-0 border border-white/5">
                                            <Image
                                                src={prop.images[0]}
                                                alt={prop.name}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                            <h4 className="text-white font-black text-sm truncate group-hover:text-primary transition-colors tracking-tight">{prop.name}</h4>
                                            <p className="text-primary font-bold text-xs leading-none">₱{prop.price.replace('₱', '')}<span className="text-white/20 font-black text-[9px] ml-1">/mo</span></p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Link
                                                    href={`/tenant/applications/${prop.id}/apply`}
                                                    className="flex items-center gap-1.5 text-[9px] font-black text-black bg-primary px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-primary/10 active:scale-95"
                                                >
                                                    <Zap className="w-2.5 h-2.5" />
                                                    Apply
                                                </Link>
                                                <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-red-400 transition-colors">
                                                    <Heart className="w-3 h-3 fill-transparent" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Link href="/search" className="block w-full mt-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border border-dashed border-white/10 rounded-3xl hover:border-primary/50 hover:text-primary transition-all text-center">
                                Discover More Properties
                            </Link>
                        </div>

                        {/* Pro Subscription CTA - Refined */}
                        <div className="relative rounded-[3rem] p-10 overflow-hidden group shadow-2xl">
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/5 to-black transition-all group-hover:scale-110 duration-1000"></div>
                            <div className="absolute inset-0 backdrop-blur-3xl"></div>

                            {/* Mesh effect */}
                            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/20 blur-[100px] animate-pulse pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 mx-auto bg-black rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-primary/20 text-primary">
                                    <Sparkles className="w-8 h-8 fill-primary/20 animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-white text-2xl font-black tracking-tight mb-2">Priority Selection</h3>
                                    <p className="text-white/50 text-xs font-medium leading-relaxed max-w-[220px] mx-auto">Skip the line. Get instant landlord badges and early viewing slots.</p>
                                </div>
                                <button className="w-full bg-white text-black text-xs font-black py-5 rounded-[1.5rem] hover:bg-primary transition-all shadow-2xl active:scale-95 uppercase tracking-widest">
                                    Upgrade to Elite
                                </button>

                                <div className="flex items-center justify-center gap-4 opacity-30">
                                    <ShieldCheck className="w-4 h-4 text-white" />
                                    <div className="h-px w-4 bg-white/20" />
                                    <Lock className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
