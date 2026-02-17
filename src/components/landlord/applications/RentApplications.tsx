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
        <>
            <div className="flex flex-col min-h-screen w-full bg-[#0a0a0a] text-white overflow-y-auto p-6 md:p-8 space-y-6">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-lime-600/20 to-emerald-700/20 border border-lime-500/10">
                            <FileText className="h-7 w-7 text-lime-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Rent Applications
                            </h1>
                            <p className="text-sm text-neutral-400 mt-0.5">
                                Review and manage incoming tenant applications
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {[
                        { label: "Pending Review", value: stats.pending, icon: Clock, gradient: "from-amber-600/20 to-orange-700/20", iconColor: "text-amber-400", borderColor: "border-amber-500/10" },
                        { label: "Under Review", value: stats.reviewing, icon: Eye, gradient: "from-blue-600/20 to-indigo-700/20", iconColor: "text-blue-400", borderColor: "border-blue-500/10" },
                        { label: "Approved", value: stats.approved, icon: CheckCircle2, gradient: "from-emerald-600/20 to-green-700/20", iconColor: "text-emerald-400", borderColor: "border-emerald-500/10" },
                        { label: "Rejected", value: stats.rejected, icon: XCircle, gradient: "from-red-600/20 to-rose-700/20", iconColor: "text-red-400", borderColor: "border-red-500/10" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5",
                                stat.gradient,
                                stat.borderColor,
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={cn("p-2.5 rounded-xl bg-white/5", stat.borderColor)}>
                                    <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, property, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:border-lime-500/30 transition-all"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveFilter(tab.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                    activeFilter === tab.value
                                        ? "bg-lime-600 text-white shadow-lg shadow-lime-900/30"
                                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {tab.label}
                                <span className={cn(
                                    "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full",
                                    activeFilter === tab.value ? "bg-white/20" : "bg-white/5"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Applications List */}
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredApplications.map((app, index) => {
                            const statusConfig = STATUS_CONFIG[app.status];
                            const StatusIcon = statusConfig.icon;
                            return (
                                <motion.div
                                    key={app.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                    onClick={() => setSelectedApp(app)}
                                    className="group relative rounded-2xl bg-gradient-to-r from-[#171717] to-[#131313] border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-lime-900/10 overflow-hidden"
                                >
                                    {/* Status Accent Bar */}
                                    <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
                                        app.status === "pending" && "bg-amber-500",
                                        app.status === "reviewing" && "bg-blue-500",
                                        app.status === "approved" && "bg-emerald-500",
                                        app.status === "rejected" && "bg-red-500",
                                    )} />

                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-5 pl-6">
                                        {/* Left: Property Image + Applicant Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            {/* Property Image */}
                                            <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                                                <img
                                                    src={app.propertyImage}
                                                    alt={app.propertyName}
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                            </div>

                                            {/* Applicant Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base font-bold text-white truncate">
                                                        {app.applicant.name}
                                                    </h3>
                                                    <span className="text-xs text-neutral-500 font-mono">
                                                        {app.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-neutral-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Home className="h-3.5 w-3.5" />
                                                        {app.propertyName} — {app.unitNumber}
                                                    </span>
                                                    <span className="hidden sm:flex items-center gap-1.5">
                                                        <Briefcase className="h-3.5 w-3.5" />
                                                        {app.applicant.occupation}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center: Key Metrics */}
                                        <div className="flex items-center gap-6 flex-shrink-0">
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-neutral-500 mb-0.5">Rent</p>
                                                <p className="text-sm font-bold text-white">₱{app.monthlyRent.toLocaleString()}</p>
                                            </div>
                                            <div className="hidden md:block text-center">
                                                <p className="text-xs text-neutral-500 mb-0.5">Move-in</p>
                                                <p className="text-sm font-semibold text-neutral-300">{app.requestedMoveIn}</p>
                                            </div>
                                            <div className="hidden lg:block text-center">
                                                <p className="text-xs text-neutral-500 mb-0.5">Credit</p>
                                                <p className={cn("text-sm font-bold", getCreditScoreColor(app.applicant.creditScore))}>
                                                    {app.applicant.creditScore}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Status + Arrow */}
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                                                statusConfig.bgColor,
                                                statusConfig.borderColor
                                            )}>
                                                <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                                                <span className={cn("text-xs font-semibold", statusConfig.color)}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-neutral-600 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>

                                    {/* Submitted Date */}
                                    <div className="px-6 pb-3 flex items-center gap-1.5 text-[11px] text-neutral-500">
                                        <Calendar className="h-3 w-3" />
                                        Submitted {app.submittedDate}
                                        <span className="mx-1">·</span>
                                        {app.documents.length} document{app.documents.length !== 1 ? "s" : ""} attached
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Empty State */}
                    {filteredApplications.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <div className="p-4 rounded-2xl bg-neutral-800/50 mb-4">
                                <FileText className="h-10 w-10 text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">No Applications Found</h3>
                            <p className="text-sm text-neutral-500 max-w-sm">
                                {searchQuery
                                    ? "Try adjusting your search or filter criteria."
                                    : "When potential tenants submit applications, they'll appear here."}
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Detail Slide-Out Panel ───────────────────────────────────── */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedApp(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0f0f0f] border-l border-white/5 z-50 overflow-y-auto shadow-2xl"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/5">
                                <div className="flex items-center justify-between p-6">
                                    <div>
                                        <p className="text-xs text-neutral-500 font-mono">{selectedApp.id}</p>
                                        <h2 className="text-xl font-bold text-white mt-0.5">Application Details</h2>
                                    </div>
                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                                    >
                                        <X className="h-5 w-5 text-neutral-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Property Card */}
                                <div className="relative h-40 rounded-2xl overflow-hidden">
                                    <img
                                        src={selectedApp.propertyImage}
                                        alt={selectedApp.propertyName}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                    <div className="absolute bottom-4 left-4">
                                        <h3 className="text-lg font-bold text-white">{selectedApp.propertyName}</h3>
                                        <p className="text-sm text-neutral-300">{selectedApp.unitNumber}</p>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        {(() => {
                                            const sc = STATUS_CONFIG[selectedApp.status];
                                            const Icon = sc.icon;
                                            return (
                                                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm", sc.bgColor, sc.borderColor)}>
                                                    <Icon className={cn("h-3.5 w-3.5", sc.color)} />
                                                    <span className={cn("text-xs font-bold", sc.color)}>{sc.label}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Applicant Profile */}
                                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-lime-600/30 to-emerald-700/30 flex items-center justify-center ring-2 ring-white/10">
                                            <span className="text-base font-bold text-lime-300">
                                                {selectedApp.applicant.name.split(" ").map((n) => n[0]).join("")}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{selectedApp.applicant.name}</h3>
                                            <p className="text-sm text-neutral-400">{selectedApp.applicant.occupation}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                            <span className="text-neutral-300">{selectedApp.applicant.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                            <span className="text-neutral-300">{selectedApp.applicant.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center">
                                        <Banknote className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                                        <p className="text-xs text-neutral-500">Monthly Income</p>
                                        <p className="text-lg font-bold text-white">₱{selectedApp.applicant.monthlyIncome.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 text-center">
                                        <Shield className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                                        <p className="text-xs text-neutral-500">Credit Score</p>
                                        <p className={cn("text-lg font-bold", getCreditScoreColor(selectedApp.applicant.creditScore))}>
                                            {selectedApp.applicant.creditScore}
                                        </p>
                                        <p className={cn("text-xs font-medium mt-0.5", getCreditScoreColor(selectedApp.applicant.creditScore))}>
                                            {getCreditScoreLabel(selectedApp.applicant.creditScore)}
                                        </p>
                                    </div>
                                </div>

                                {/* Lease Details */}
                                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Lease Details</h4>
                                    <div className="space-y-2.5">
                                        {[
                                            { label: "Monthly Rent", value: `₱${selectedApp.monthlyRent.toLocaleString()}`, icon: Banknote },
                                            { label: "Lease Term", value: selectedApp.leaseTerm, icon: Calendar },
                                            { label: "Requested Move-in", value: selectedApp.requestedMoveIn, icon: Calendar },
                                            { label: "Income-to-Rent Ratio", value: `${(selectedApp.applicant.monthlyIncome / selectedApp.monthlyRent).toFixed(1)}x`, icon: TrendingUp },
                                        ].map((detail) => (
                                            <div key={detail.label} className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-neutral-400">
                                                    <detail.icon className="h-4 w-4" />
                                                    {detail.label}
                                                </span>
                                                <span className="font-semibold text-white">{detail.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Submitted Documents</h4>
                                    <div className="space-y-2">
                                        {selectedApp.documents.map((doc) => (
                                            <div
                                                key={doc}
                                                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                                            >
                                                <span className="flex items-center gap-3 text-sm text-neutral-300">
                                                    <FileText className="h-4 w-4 text-neutral-500" />
                                                    {doc}
                                                </span>
                                                <ArrowUpRight className="h-4 w-4 text-neutral-600 group-hover:text-lime-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedApp.notes && (
                                    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-2">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Notes</h4>
                                        <p className="text-sm text-neutral-400 leading-relaxed">{selectedApp.notes}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {selectedApp.status === "pending" || selectedApp.status === "reviewing" ? (
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all">
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </button>
                                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-lime-600 to-emerald-700 text-white text-sm font-bold hover:from-lime-700 hover:to-emerald-800 transition-all shadow-lg shadow-lime-900/20">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
