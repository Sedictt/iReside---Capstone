"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RevenueChart from "@/components/RevenueChart";
import {
    Search,
    Plus,
    Filter,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Zap,
    TrendingUp,
    Settings,
    MoreVertical,
    Wallet,
    Home,
    Wrench,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// Expanded Mock Data
const properties = [
    {
        id: "PROP-001",
        name: "Grand View Residences",
        address: "123 Skyline Avenue, Metro Manila",
        type: "Apartment Complex",
        capRate: "7.2%",
        noi: "₱12.5M",
        valuation: "₱175M",
        metrics: {
            occupied: 42,
            total: 45,
            maintenance: 2
        },
        recentActivity: "Lease renewed for Unit 401 (+5% increase)",
        status: "Performing",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
        color: "from-emerald-500/20 to-emerald-500/0",
        iconColor: "text-emerald-500",
        bgIcon: "bg-emerald-500/10",
    },
    {
        id: "PROP-002",
        name: "Oasis Lofts & Studios",
        address: "45 Greenfield Subd, Quezon City",
        type: "Condominium",
        capRate: "6.8%",
        noi: "₱28.2M",
        valuation: "₱415M",
        metrics: {
            occupied: 110,
            total: 120,
            maintenance: 5
        },
        recentActivity: "HVAC repair completed in Lobby",
        status: "Stable",
        image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&auto=format&fit=crop&q=80",
        color: "from-blue-500/20 to-blue-500/0",
        iconColor: "text-blue-500",
        bgIcon: "bg-blue-500/10",
    },
    {
        id: "PROP-003",
        name: "The Heights Serviced Apts",
        address: "202 Peak Drive, Makati City",
        type: "Serviced Apartment",
        capRate: "8.5%",
        noi: "₱18.8M",
        valuation: "₱220M",
        metrics: {
            occupied: 25,
            total: 30,
            maintenance: 8
        },
        recentActivity: "3 new maintenance requests (Plumbing)",
        status: "Attention Required",
        image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&auto=format&fit=crop&q=80",
        color: "from-amber-500/20 to-amber-500/0",
        iconColor: "text-amber-500",
        bgIcon: "bg-amber-500/10",
    }
];

export function PropertiesDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"All" | "Performing" | "Attention Required">("All");
    const [expandedStatsId, setExpandedStatsId] = useState<string | null>(null);

    const filteredProperties = properties.filter(prop => {
        const matchesSearch = prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prop.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "All" ||
            (activeTab === "Performing" && (prop.status === "Performing" || prop.status === "Stable")) ||
            (activeTab === "Attention Required" && prop.status === "Attention Required");
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-8 min-h-screen pb-12">
            {/* Command Center / Header */}
            <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 p-8 relative overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-50" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-30" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neutral-300 mb-6 backdrop-blur-md">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span>Portfolio Management</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Property Portfolio
                        </h1>
                        <p className="text-neutral-400 text-lg max-w-xl">
                            Real-time performance metrics and operational health for your entire real estate portfolio.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center gap-2 backdrop-blur-md">
                            <Filter className="h-4 w-4" />
                            Analytics
                        </button>
                        <Link href="/landlord/properties/new" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Plus className="h-5 w-5" />
                            New Asset
                        </Link>
                    </div>
                </div>


            </div>

            {/* View Controls & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-[#111] p-1 rounded-xl border border-white/5 w-full sm:w-auto">
                    {["All", "Performing", "Attention Required"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search properties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-[#111] border border-white/5 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-neutral-600"
                    />
                </div>
            </div>

            {/* Assets Stack View */}
            <div className="space-y-6">
                {filteredProperties.map((property) => (
                    <div key={property.id} className="group relative bg-[#111] border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500">
                        {/* Ambient Glow */}
                        <div className={cn("absolute top-0 left-0 w-full h-32 bg-gradient-to-b opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40", property.color)} />

                        <div className="flex flex-col lg:flex-row relative z-10">
                            {/* Left Image Section */}
                            <div className="lg:w-[380px] shrink-0 min-h-[200px] h-[240px] lg:h-auto relative overflow-hidden">
                                <Image
                                    src={property.image}
                                    alt={property.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#111] via-[#111]/80 lg:via-[#111]/60 to-transparent" />

                                <div className="absolute top-6 left-6">
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border",
                                        property.status === "Performing" || property.status === "Stable"
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                                            : "bg-amber-500/20 text-amber-400 border-amber-500/20"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full animate-pulse",
                                            property.status === "Performing" || property.status === "Stable" ? "bg-emerald-400" : "bg-amber-400"
                                        )} />
                                        {property.status}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 pr-6">
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{property.name}</h3>
                                    <div className="flex items-center text-neutral-300 text-sm gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>{property.address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content Section */}
                            <div className="flex-1 p-6 lg:p-8 flex items-center">
                                {/* Operational Metrics & Activities */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 w-full">
                                    <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                                        {/* Occupancy Mini-Visual */}
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-14 h-14">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="28" cy="28" r="24" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                                    <circle
                                                        cx="28" cy="28" r="24"
                                                        fill="custom"
                                                        stroke="currentColor"
                                                        className="text-primary"
                                                        strokeWidth="4"
                                                        strokeDasharray="150"
                                                        strokeDashoffset={150 - (150 * (property.metrics.occupied / property.metrics.total))}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-primary" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Occupancy</p>
                                                <p className="text-white text-lg font-bold">{property.metrics.occupied} <span className="text-neutral-500 text-sm font-normal">/ {property.metrics.total} Units</span></p>
                                            </div>
                                        </div>

                                        <div className="w-px h-12 bg-white/10 hidden sm:block" />

                                        {/* Maintenance Status */}
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", property.bgIcon)}>
                                                <Wrench className={cn("h-6 w-6", property.iconColor)} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Maintenance</p>
                                                <p className={cn(
                                                    "text-lg font-bold",
                                                    property.metrics.maintenance > 3 ? "text-amber-500" : "text-white"
                                                )}>
                                                    {property.metrics.maintenance} <span className="text-neutral-500 text-sm font-normal">Active Requests</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 w-full lg:w-auto self-end lg:self-auto">
                                        <button 
                                            onClick={() => setExpandedStatsId(expandedStatsId === property.id ? null : property.id)}
                                            className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors border border-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <TrendingUp className="h-4 w-4" />
                                            {expandedStatsId === property.id ? "Hide Stats" : "View Stats"}
                                        </button>
                                        <button className="flex-1 lg:flex-none h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/5 flex items-center justify-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Manage Hub
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Stats Panel */}
                        <AnimatePresence>
                            {expandedStatsId === property.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="border-t border-white/5 overflow-hidden"
                                >
                                    <div className="p-6 lg:p-8 bg-[#151515] grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Financial Highlights */}
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Wallet className="h-4 w-4 text-neutral-400" />
                                                    <h4 className="text-sm font-medium text-neutral-400">Financial Highlights</h4>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Net Operating Income (NOI)</p>
                                                            <p className="text-white font-bold text-xl">{property.noi}</p>
                                                        </div>
                                                        <div className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" /> +12% y/y
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Estimated Valuation</p>
                                                            <p className="text-white font-bold text-xl">{property.valuation}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs text-neutral-500 mb-1">Capitalization Rate</p>
                                                            <p className="text-white font-bold text-xl">{property.capRate}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Revenue Chart */}
                                        <div className="lg:col-span-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-neutral-400" />
                                                    <h4 className="text-sm font-medium text-neutral-400">Revenue Trend (YTD)</h4>
                                                </div>
                                            </div>
                                            <div className="h-[300px] w-full bg-[#111] rounded-xl border border-white/5 p-4">
                                                <RevenueChart />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {filteredProperties.length === 0 && (
                    <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                        <Building2 className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No matching assets</h3>
                        <p className="text-neutral-500">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

