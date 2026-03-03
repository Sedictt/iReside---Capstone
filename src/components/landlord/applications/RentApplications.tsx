"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    FileText,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    ChevronRight,
    User,
    Home,
    Calendar,
    Banknote,
    Mail,
    Phone,
    Briefcase,
    Star,
    ArrowUpRight,
    ArrowRight,
    X,
    Shield,
    AlertCircle,
    TrendingUp,
    Users
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────
type ApplicationStatus = "pending" | "reviewing" | "approved" | "rejected";

interface Applicant {
    name: string;
    email: string;
    phone: string;
    occupation: string;
    monthlyIncome: number;
    creditScore: number;
    avatar?: string;
}

interface RentApplication {
    id: string;
    applicant: Applicant;
    propertyName: string;
    unitNumber: string;
    propertyImage: string;
    requestedMoveIn: string;
    monthlyRent: number;
    leaseTerm: string;
    status: ApplicationStatus;
    submittedDate: string;
    notes?: string;
    documents: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────
const MOCK_APPLICATIONS: RentApplication[] = [
    {
        id: "APP-001",
        applicant: {
            name: "Isabella Torres",
            email: "isabella.torres@email.com",
            phone: "+63 917 123 4567",
            occupation: "Software Engineer",
            monthlyIncome: 120000,
            creditScore: 750,
        },
        propertyName: "Skyline Tower",
        unitNumber: "Unit 402",
        propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
        requestedMoveIn: "March 1, 2026",
        monthlyRent: 28000,
        leaseTerm: "12 months",
        status: "pending",
        submittedDate: "Feb 15, 2026",
        notes: "Relocating from Cebu for work. Currently employed at a tech company. Has one pet cat.",
        documents: ["ID Verification", "Proof of Income", "Employment Letter"],
    },
    {
        id: "APP-002",
        applicant: {
            name: "Marco Reyes",
            email: "marco.reyes@email.com",
            phone: "+63 918 234 5678",
            occupation: "Marketing Director",
            monthlyIncome: 95000,
            creditScore: 710,
        },
        propertyName: "Garden View Apartments",
        unitNumber: "B-12",
        propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
        requestedMoveIn: "March 15, 2026",
        monthlyRent: 22000,
        leaseTerm: "6 months",
        status: "reviewing",
        submittedDate: "Feb 12, 2026",
        notes: "Looking for a quiet place to work from home. Needs stable internet connection.",
        documents: ["ID Verification", "Proof of Income", "Previous Landlord Reference"],
    },
    {
        id: "APP-003",
        applicant: {
            name: "Camille Santos",
            email: "camille.santos@email.com",
            phone: "+63 919 345 6789",
            occupation: "Registered Nurse",
            monthlyIncome: 65000,
            creditScore: 690,
        },
        propertyName: "Downtown Loft",
        unitNumber: "503",
        propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop",
        requestedMoveIn: "April 1, 2026",
        monthlyRent: 18000,
        leaseTerm: "12 months",
        status: "approved",
        submittedDate: "Feb 8, 2026",
        documents: ["ID Verification", "Proof of Income", "Employment Letter", "Background Check"],
    },
    {
        id: "APP-004",
        applicant: {
            name: "Daniel Kim",
            email: "daniel.kim@email.com",
            phone: "+63 920 456 7890",
            occupation: "Freelance Designer",
            monthlyIncome: 45000,
            creditScore: 580,
        },
        propertyName: "Riverside Condos",
        unitNumber: "#208",
        propertyImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop",
        requestedMoveIn: "March 1, 2026",
        monthlyRent: 25000,
        leaseTerm: "12 months",
        status: "rejected",
        submittedDate: "Feb 5, 2026",
        notes: "Insufficient income-to-rent ratio. Recommended reapplying with a co-signer.",
        documents: ["ID Verification", "Proof of Income"],
    },
    {
        id: "APP-005",
        applicant: {
            name: "Angela Cruz",
            email: "angela.c@email.com",
            phone: "+63 921 567 8901",
            occupation: "Financial Analyst",
            monthlyIncome: 110000,
            creditScore: 780,
        },
        propertyName: "Skyline Tower",
        unitNumber: "Unit 801",
        propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
        requestedMoveIn: "March 10, 2026",
        monthlyRent: 35000,
        leaseTerm: "24 months",
        status: "pending",
        submittedDate: "Feb 16, 2026",
        documents: ["ID Verification", "Proof of Income", "Employment Letter", "Bank Statements"],
    },
    {
        id: "APP-006",
        applicant: {
            name: "Rafael Mendoza",
            email: "r.mendoza@email.com",
            phone: "+63 922 678 9012",
            occupation: "Restaurant Manager",
            monthlyIncome: 55000,
            creditScore: 660,
        },
        propertyName: "Garden View Apartments",
        unitNumber: "A-7",
        propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
        requestedMoveIn: "April 15, 2026",
        monthlyRent: 20000,
        leaseTerm: "12 months",
        status: "reviewing",
        submittedDate: "Feb 14, 2026",
        notes: "Plans to move in with spouse and one child. Looking for family-friendly environment.",
        documents: ["ID Verification", "Proof of Income", "Marriage Certificate"],
    },
];

// ─── Status Config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
    pending: {
        label: "Pending Review",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        icon: Clock,
    },
    reviewing: {
        label: "Under Review",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        icon: Eye,
    },
    approved: {
        label: "Approved",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        icon: CheckCircle2,
    },
    rejected: {
        label: "Rejected",
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        icon: XCircle,
    },
};

// ─── Helper ───────────────────────────────────────────────────────────
function getCreditScoreColor(score: number) {
    if (score >= 750) return "text-emerald-400";
    if (score >= 700) return "text-lime-400";
    if (score >= 650) return "text-amber-400";
    return "text-red-400";
}

function getCreditScoreLabel(score: number) {
    if (score >= 750) return "Excellent";
    if (score >= 700) return "Good";
    if (score >= 650) return "Fair";
    return "Poor";
}

// ─── Component ────────────────────────────────────────────────────────
export function RentApplications() {
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<ApplicationStatus | "all">("all");
    const [selectedApp, setSelectedApp] = useState<RentApplication | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Derived data
    const filteredApplications = MOCK_APPLICATIONS.filter((app) => {
        const matchesSearch =
            app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "all" || app.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: MOCK_APPLICATIONS.length,
        pending: MOCK_APPLICATIONS.filter((a) => a.status === "pending").length,
        reviewing: MOCK_APPLICATIONS.filter((a) => a.status === "reviewing").length,
        approved: MOCK_APPLICATIONS.filter((a) => a.status === "approved").length,
        rejected: MOCK_APPLICATIONS.filter((a) => a.status === "rejected").length,
    };

    const filterTabs: { label: string; value: ApplicationStatus | "all"; count: number }[] = [
        { label: "All", value: "all", count: stats.total },
        { label: "Pending", value: "pending", count: stats.pending },
        { label: "Reviewing", value: "reviewing", count: stats.reviewing },
        { label: "Approved", value: "approved", count: stats.approved },
        { label: "Rejected", value: "rejected", count: stats.rejected },
    ];

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar relative">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary/80" />
                        Application Control
                    </h1>
                    <p className="text-neutral-400 font-medium tracking-wide text-sm">
                        Review, process, and securely manage incoming residency applications.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-400 text-black px-6 py-3 rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 border border-primary/20">
                    <CheckCircle2 className="h-5 w-5" />
                    Auto-Screening
                </button>
            </div>

            {/* Glowing KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Action Required", subtitle: "Pending forms", value: stats.pending, icon: Clock, glow: "rgba(245,158,11,0.15)", border: "border-amber-500/20", color: "text-amber-500" },
                    { label: "Under Review", subtitle: "Background checks", value: stats.reviewing, icon: Eye, glow: "rgba(59,130,246,0.15)", border: "border-blue-500/20", color: "text-blue-500" },
                    { label: "Approved", subtitle: "Awaiting contracts", value: stats.approved, icon: CheckCircle2, glow: "rgba(16,185,129,0.15)", border: "border-emerald-500/20", color: "text-emerald-500" },
                    { label: "Rejected", subtitle: "Denied profiles", value: stats.rejected, icon: XCircle, glow: "rgba(239,68,68,0.15)", border: "border-red-500/20", color: "text-red-500" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={cn(
                            "relative overflow-hidden p-6 rounded-3xl bg-neutral-900 border transition-all duration-300 group hover:-translate-y-1",
                            stat.border
                        )}
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(circle at center, ${stat.glow} 0%, transparent 70%)` }}
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</h3>
                                <div className="p-2 rounded-xl bg-neutral-800 border border-white/5">
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-4xl font-black text-white tracking-tighter">{stat.value}</span>
                                <span className="text-sm font-medium text-neutral-500">{stat.subtitle}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Application Container */}
            <div className="rounded-3xl bg-neutral-900 border border-white/5 flex flex-col pt-2 shadow-2xl">

                {/* Advanced Command Toolbar */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-10 rounded-t-3xl">
                    <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveFilter(tab.value)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                    activeFilter === tab.value
                                        ? "bg-neutral-800 text-white shadow-lg border border-white/5"
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
                                )}
                            >
                                {tab.label}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black leading-none",
                                    activeFilter === tab.value ? "bg-primary/20 text-primary" : "bg-white/5 text-neutral-400"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search applicant, property..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <button className="p-2.5 rounded-xl bg-neutral-950 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid Format Interface */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredApplications.map((app, index) => {
                                const statusConfig = STATUS_CONFIG[app.status];
                                const StatusIcon = statusConfig.icon;
                                const isPending = app.status === "pending";

                                return (
                                    <motion.div
                                        key={app.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        onClick={() => setSelectedApp(app)}
                                        className="group relative flex flex-col bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                                    >
                                        {/* Status Glow Bar */}
                                        {isPending && (
                                            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10 animate-pulse" />
                                        )}

                                        {/* Top Card Section: Property Image bg */}
                                        <div className="relative h-28 w-full bg-neutral-900 overflow-hidden shrink-0">
                                            <img
                                                src={app.propertyImage}
                                                alt={app.propertyName}
                                                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/20" />

                                            {/* Top Status */}
                                            <div className="absolute top-3 left-3 z-10">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-lg",
                                                    statusConfig.bgColor,
                                                    statusConfig.borderColor,
                                                    statusConfig.color,
                                                    app.status === "pending" ? "bg-amber-500 text-black border-amber-400" :
                                                        app.status === "approved" ? "bg-emerald-500/90 text-black border-emerald-400/50" : ""
                                                )}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            {/* Score Metric Top Right */}
                                            <div className="absolute top-3 right-3 z-10 flex flex-col items-end">
                                                <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Credit</span>
                                                <span className={cn("text-lg font-black leading-none drop-shadow-md", getCreditScoreColor(app.applicant.creditScore))}>
                                                    {app.applicant.creditScore}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Main Content Body */}
                                        <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-neutral-950 to-neutral-900 border-t border-white/5 relative">

                                            {/* Floating Avatar */}
                                            <div className="absolute -top-10 left-4 h-14 w-14 rounded-full bg-neutral-900 border-4 border-neutral-950 ring-1 ring-white/10 flex items-center justify-center overflow-hidden shadow-2xl z-20 group-hover:ring-primary/50 transition-colors">
                                                <span className="text-lg font-black text-primary">
                                                    {app.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                </span>
                                            </div>

                                            {/* Applicant Core Details */}
                                            <div className="mt-4 mb-4">
                                                <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-primary transition-colors">{app.applicant.name}</h3>
                                                <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                                                    <Briefcase className="w-3 h-3" />
                                                    {app.applicant.occupation}
                                                </p>
                                            </div>

                                            {/* Critical Property Info */}
                                            <div className="grid grid-cols-2 gap-3 mb-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1 block">Property</span>
                                                    <span className="text-xs font-bold text-white truncate block">{app.propertyName}</span>
                                                    <span className="text-[10px] font-bold text-primary mt-0.5 block">{app.unitNumber}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1 block">Rental Rate</span>
                                                    <span className="text-xs font-bold text-white block">₱{app.monthlyRent.toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {app.requestedMoveIn}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-h-[8px]" />

                                            {/* Footer Actions */}
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 font-mono tracking-wider">
                                                    {app.id}
                                                </div>

                                                <button className="flex items-center gap-1.5 text-xs font-black text-white bg-white/5 hover:bg-white/10 hover:text-primary border border-white/10 px-3 py-1.5 rounded-lg transition-all shadow-sm">
                                                    Review
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {filteredApplications.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-5 ring-1 ring-white/10 shadow-xl">
                                <Users className="w-8 h-8 text-neutral-600" />
                            </div>
                            <h3 className="text-xl font-black text-white mb-2">No Active Applications</h3>
                            <p className="text-neutral-400 text-sm max-w-sm font-medium">
                                Everything is quiet. When prospective tenants apply for residency, their profiles will appear here for review.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Slide-Out Panel */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedApp(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-opacity"
                        />

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-neutral-950 border-l border-white/10 z-50 overflow-y-auto custom-scrollbar shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold text-neutral-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">{selectedApp.id}</span>
                                    <h2 className="text-lg font-black text-white tracking-tight">Application Dossier</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Dossier Body */}
                            <div className="p-6 md:p-8 space-y-8 flex-1">

                                {/* Hero Target Block */}
                                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                                    <div className="h-48 w-full bg-neutral-900 border-b border-white/5">
                                        <img
                                            src={selectedApp.propertyImage}
                                            alt={selectedApp.propertyName}
                                            className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-white leading-none mb-2">{selectedApp.propertyName}</h3>
                                                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg text-sm font-bold shadow-sm backdrop-blur-md">
                                                    {selectedApp.unitNumber}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-1">Monthly Rent</span>
                                                <span className="text-2xl font-black text-white">₱{selectedApp.monthlyRent.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Intelligence Profiling */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-2">Applicant Profile</h4>
                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-6 flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-neutral-950 border border-white/10 ring-2 ring-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                                <span className="text-2xl font-black text-primary">
                                                    {selectedApp.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{selectedApp.applicant.name}</h3>
                                                <p className="text-sm text-neutral-400 font-medium">{selectedApp.applicant.occupation}</p>
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-white/5" />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                                    <Mail className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">Email</span>
                                                    <span className="text-sm font-bold text-neutral-300">{selectedApp.applicant.email}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                                                    <Phone className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">Phone</span>
                                                    <span className="text-sm font-bold text-neutral-300">{selectedApp.applicant.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Underwriting Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Banknote className="h-6 w-6 text-emerald-400 mb-4" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Monthly Income</span>
                                        <span className="text-2xl font-black text-white">₱{selectedApp.applicant.monthlyIncome.toLocaleString()}</span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold text-neutral-400">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            Ratio: {(selectedApp.applicant.monthlyIncome / selectedApp.monthlyRent).toFixed(1)}x
                                        </div>
                                    </div>

                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Shield className="h-6 w-6 text-blue-400 mb-4" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Credit Score</span>
                                        <span className={cn("text-2xl font-black", getCreditScoreColor(selectedApp.applicant.creditScore))}>
                                            {selectedApp.applicant.creditScore}
                                        </span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold">
                                            <span className={cn("w-2 h-2 rounded-full", getCreditScoreColor(selectedApp.applicant.creditScore).replace('text-', 'bg-'))} />
                                            {getCreditScoreLabel(selectedApp.applicant.creditScore)} Rating
                                        </div>
                                    </div>
                                </div>

                                {/* Extractive Document View */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-2 flex items-center justify-between">
                                        Supporting Documents
                                        <span className="bg-white/10 text-white px-2 py-0.5 rounded-full">{selectedApp.documents.length} Files</span>
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedApp.documents.map((doc) => (
                                            <div
                                                key={doc}
                                                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-white/5 hover:border-primary/50 hover:bg-white/[0.02] transition-all cursor-pointer group shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-neutral-950 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors shrink-0">
                                                        <FileText className="h-4 w-4 text-neutral-500 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <span className="text-xs font-bold text-neutral-300 truncate group-hover:text-white transition-colors">{doc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Docked Action Footer */}
                            <div className="p-6 md:p-8 bg-neutral-950 border-t border-white/5 mt-auto">
                                {selectedApp.status === "pending" || selectedApp.status === "reviewing" ? (
                                    <div className="flex items-center gap-4">
                                        <button className="flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all focus:ring-4 focus:ring-red-500/20 active:scale-95">
                                            <XCircle className="h-5 w-5" />
                                            Decline Profile
                                        </button>
                                        <button className="flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl bg-primary text-black font-black hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:ring-4 focus:ring-primary/40 active:scale-95">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Approve & Proceed
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full flex items-center justify-center p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                        <span className={cn(
                                            "text-sm font-black flex items-center gap-2",
                                            selectedApp.status === "approved" ? "text-emerald-500" : "text-red-500"
                                        )}>
                                            {selectedApp.status === "approved" ? (
                                                <><CheckCircle2 className="w-5 h-5" /> Application Finalized: Approved</>
                                            ) : (
                                                <><XCircle className="w-5 h-5" /> Application Finalized: Rejected</>
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
