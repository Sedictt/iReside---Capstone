"use client";

import { useState } from "react";
import { 
    Plus, 
    Search, 
    MoreVertical, 
    Check, 
    X, 
    Clock, 
    Calendar,
    Users,
    Waves,
    Music,
    Coffee,
    LayoutGrid,
    History as HistoryIcon,
    ClipboardList,
    DollarSign,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
const MOCK_UTILITIES = [
    {
        id: "1",
        name: "Grand Function Hall",
        type: "Room",
        description: "Perfect for parties, seminars, and gatherings. Includes sound system and chairs.",
        price: 500,
        unit: "hour",
        status: "Active",
        capacity: 100,
        icon: Users,
    },
    {
        id: "2",
        name: "Sky Pool & Lounge",
        type: "Amenity",
        description: "Rooftop swimming pool with city view. Access limited to residents.",
        price: 0,
        unit: "free",
        status: "Active",
        capacity: 30,
        icon: Waves,
    },
    {
        id: "3",
        name: "Music Studio",
        type: "Utility",
        description: "Soundproof room for practice and recording. Instruments available on request.",
        price: 200,
        unit: "hour",
        status: "Maintenance",
        capacity: 5,
        icon: Music,
    },
    {
        id: "4",
        name: "Co-working Space",
        type: "Room",
        description: "Quiet area for work and study. High-speed Wi-Fi and coffee available.",
        price: 0,
        unit: "free",
        status: "Active",
        capacity: 20,
        icon: Coffee,
    }
];

const MOCK_REQUESTS = [
    {
        id: "req-1",
        utilityName: "Grand Function Hall",
        tenantName: "John Doe",
        date: "2024-05-15",
        startTime: "14:00",
        endTime: "18:00",
        totalPrice: 2000,
        status: "Pending",
        requestDate: "2024-04-25",
    },
    {
        id: "req-2",
        utilityName: "Music Studio",
        tenantName: "Alice Smith",
        date: "2024-05-10",
        startTime: "10:00",
        endTime: "12:00",
        totalPrice: 400,
        status: "Approved",
        requestDate: "2024-04-26",
    }
];

export default function LandlordUtilitiesPage() {
    const [activeTab, setActiveTab] = useState<"list" | "requests" | "history">("list");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUtilities = MOCK_UTILITIES.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full flex-col gap-8 bg-background p-6 text-foreground md:p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <section className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Utility Rooms & Amenities</h1>
                    <p className="text-sm text-muted-foreground">Manage property facilities, amenities, and resident booking requests.</p>
                </section>
                
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted">
                        <HistoryIcon className="h-4 w-4" />
                        Usage Logs
                    </button>
                    <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="h-4 w-4" />
                        Add New Utility
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <section className="grid gap-6 md:grid-cols-4">
                {[
                    { label: "Total Utilities", value: "12", sub: "Across 3 properties", color: "text-blue-500" },
                    { label: "Pending Requests", value: "8", sub: "Requires approval", color: "text-amber-500" },
                    { label: "Today's Bookings", value: "4", sub: "Current usage", color: "text-emerald-500" },
                    { label: "Monthly Revenue", value: "₱12,450", sub: "+12% from last month", color: "text-primary" },
                ].map((kpi, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={kpi.label} 
                        className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                    >
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                            <h3 className={cn("mt-2 text-3xl font-black", kpi.color)}>{kpi.value}</h3>
                            <p className="mt-1 text-xs text-muted-foreground/80">{kpi.sub}</p>
                        </div>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
                    </motion.div>
                ))}
            </section>

            {/* Main Content Area */}
            <div className="flex flex-col gap-6">
                {/* Tabs & Search */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-1 rounded-2xl bg-muted/50 p-1">
                        {[
                            { id: "list", label: "Utilities", icon: LayoutGrid },
                            { id: "requests", label: "Requests", icon: ClipboardList, badge: "8" },
                            { id: "history", label: "History", icon: HistoryIcon },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                                    activeTab === tab.id 
                                        ? "bg-card text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                {tab.badge && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search utilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 transition-all focus:ring-2"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "list" && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredUtilities.map((utility, idx) => (
                                <motion.div
                                    key={utility.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/20"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <utility.icon className="h-7 w-7" />
                                        </div>
                                        <div className={cn(
                                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                                            utility.status === "Active" 
                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                        )}>
                                            {utility.status}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h4 className="text-lg font-black text-foreground">{utility.name}</h4>
                                        <p className="mt-1 text-xs font-bold text-muted-foreground">{utility.type} • Up to {utility.capacity} people</p>
                                        <p className="mt-3 text-sm text-muted-foreground/90 line-clamp-2">{utility.description}</p>
                                    </div>

                                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Rate</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-foreground">
                                                    {utility.price === 0 ? "Free" : `₱${utility.price}`}
                                                </span>
                                                {utility.price > 0 && <span className="text-xs text-muted-foreground">/{utility.unit}</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            
                            {/* Empty Add Card */}
                            <button className="flex min-h-[250px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-muted/5 transition-all hover:bg-muted/10 hover:border-primary/50 group">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-foreground">Add New Utility</p>
                                    <p className="text-xs text-muted-foreground">Create a new facility or service</p>
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {activeTab === "requests" && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Tenant / Utility</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Schedule</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Payment</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Status</th>
                                            <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {MOCK_REQUESTS.map((req) => (
                                            <tr key={req.id} className="group hover:bg-muted/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{req.tenantName}</span>
                                                        <span className="text-xs text-muted-foreground">{req.utilityName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col text-sm">
                                                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                                            {req.date}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {req.startTime} - {req.endTime}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1 font-black text-foreground">
                                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                                        ₱{req.totalPrice.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn(
                                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold",
                                                        req.status === "Pending" 
                                                            ? "bg-amber-500/10 text-amber-600" 
                                                            : "bg-emerald-500/10 text-emerald-600"
                                                    )}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {req.status === "Pending" && (
                                                            <>
                                                                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white">
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                                <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition-all hover:bg-red-500 hover:text-white">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all hover:bg-muted-foreground hover:text-white">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-border bg-muted/5"
                        >
                            <HistoryIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="font-bold text-foreground">Usage history logs</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">Complete history of utility usage and resident bookings across all properties.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
