"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
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
    Users,
    Plus,
    ClipboardList,
    Loader2,
    Pencil,
} from "lucide-react";
import { WalkInApplicationModal } from "./WalkInApplicationModal";
import { ContractPreviewModal } from "@/components/landlord/lease/ContractPreviewModal";

// ─── Types ────────────────────────────────────────────────────────────
type ApplicationStatus = "pending" | "reviewing" | "approved" | "rejected" | "withdrawn";

interface Applicant {
    name: string;
    email: string;
    phone: string;
    occupation: string;
    monthlyIncome: number | null;
    creditScore: number | null;
    avatar?: string | null;
}

interface RentApplication {
    id: string;
    applicant: Applicant;
    propertyName: string;
    unitNumber: string;
    propertyImage: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: ApplicationStatus;
    submittedDate: string;
    notes?: string | null;
    documents: string[];
    emergencyContact?: {
        name: string | null;
        phone: string | null;
    };
    reference?: {
        name: string | null;
        contact: string | null;
    };
    complianceChecklist?: {
        valid_id: boolean;
        income_verified: boolean;
        application_completed: boolean;
        background_checked: boolean;
        payment_received: boolean;
        lease_signed: boolean;
        inspection_done: boolean;
    };
}

// ─── Mock Data ────────────────────────────────────────────────────────
const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

const formatCurrency = (value: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Not provided";
    }

    return `₱${value.toLocaleString()}`;
};

const formatDate = (value: string | null) => {
    if (!value) return "Not specified";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not specified";

    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatDocumentLabel = (value: string) => {
    if (!value) return "Document";
    const trimmed = value.trim();
    if (!trimmed) return "Document";
    const lastSlash = trimmed.lastIndexOf("/");
    const fileName = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
    try {
        return decodeURIComponent(fileName || trimmed);
    } catch {
        return fileName || trimmed;
    }
};

const formatRatio = (income: number | null, rent: number | null) => {
    if (typeof income !== "number" || !Number.isFinite(income)) return "N/A";
    if (typeof rent !== "number" || !Number.isFinite(rent) || rent <= 0) return "N/A";
    return `${(income / rent).toFixed(1)}x`;
};

const resolveImage = (value: string | null | undefined) => {
    if (typeof value !== "string" || value.trim().length === 0) {
        return FALLBACK_PROPERTY_IMAGE;
    }

    return value;
};

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
    withdrawn: {
        label: "Withdrawn",
        color: "text-neutral-400",
        bgColor: "bg-white/5",
        borderColor: "border-white/10",
        icon: AlertCircle,
    },
};

// ─── Helper ───────────────────────────────────────────────────────────
function getCreditScoreColor(score: number | null) {
    if (score === null || Number.isNaN(score)) return "text-neutral-500";
    if (score >= 750) return "text-emerald-400";
    if (score >= 700) return "text-lime-400";
    if (score >= 650) return "text-amber-400";
    return "text-red-400";
}

function getCreditScoreLabel(score: number | null) {
    if (score === null || Number.isNaN(score)) return "Not provided";
    if (score >= 750) return "Excellent";
    if (score >= 700) return "Good";
    if (score >= 650) return "Fair";
    return "Poor";
}

// ─── Component ────────────────────────────────────────────────────────
export function RentApplications() {
    const [mounted, setMounted] = useState(false);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<ApplicationStatus | "all">("all");
    const [selectedApp, setSelectedApp] = useState<RentApplication | null>(null);
    const [applications, setApplications] = useState<RentApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [showWalkInModal, setShowWalkInModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [contractData, setContractData] = useState<{
        application_id: string;
        unit_id: string;
        unit_name: string;
        property_name: string;
        applicant_name: string;
        applicant_email: string;
        monthly_rent: number;
    } | null>(null);
    const [availableUnits, setAvailableUnits] = useState<{
        id: string;
        name: string;
        rent_amount: number;
        property_id: string;
        property_name: string;
    }[]>([]);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        setMounted(true);
        if (searchParams?.get("action") === "walk-in") {
            setShowWalkInModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const controller = new AbortController();

        const loadApplications = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/applications", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load applications");
                }

                const payload = (await response.json()) as { applications?: RentApplication[] };
                setApplications(Array.isArray(payload.applications) ? payload.applications : []);
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load applications right now.");
                setApplications([]);
            } finally {
                setLoading(false);
            }
        };

        void loadApplications();

        return () => {
            controller.abort();
        };
    }, [reloadKey]);

    // Load actual units (not property IDs) so walk-in submissions use a valid unit_id.
    useEffect(() => {
        const loadUnits = async () => {
            try {
                const res = await fetch("/api/landlord/listings");
                if (!res.ok) return;

                const data = (await res.json()) as {
                    options?: Array<{
                        id: string;
                        name: string;
                        units?: Array<{
                            id: string;
                            name: string;
                            rentAmount?: number;
                        }>;
                    }>;
                };

                const options = Array.isArray(data.options) ? data.options : [];
                const unitsList: typeof availableUnits = options.flatMap((property) => {
                    const units = Array.isArray(property.units) ? property.units : [];
                    return units.map((unit) => ({
                        id: unit.id,
                        name: unit.name,
                        rent_amount: Number(unit.rentAmount ?? 0),
                        property_id: property.id,
                        property_name: property.name,
                    }));
                });

                setAvailableUnits(unitsList);
            } catch {
                // Silently fail
            }
        };

        void loadUnits();
    }, []);

    const [tenantCredentials, setTenantCredentials] = useState<{
        email: string;
        tempPassword: string | null;
        inviteUrl?: string | null;
        accountExisted?: boolean;
    } | null>(null);
    const [sendingCredentials, setSendingCredentials] = useState(false);

    // ── Dossier edit state ────────────────────────────────────────────
    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState<{
        applicant_name: string;
        applicant_email: string;
        applicant_phone: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
        move_in_date: string;
        occupation: string;
        employer: string;
        monthly_income: string;
        message: string;
    } | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const openEdit = (app: RentApplication) => {
        setEditDraft({
            applicant_name: app.applicant.name === "Unknown applicant" ? "" : app.applicant.name,
            applicant_email: app.applicant.email === "Not provided" ? "" : app.applicant.email,
            applicant_phone: app.applicant.phone === "Not provided" ? "" : app.applicant.phone,
            emergency_contact_name: app.emergencyContact?.name ?? "",
            emergency_contact_phone: app.emergencyContact?.phone ?? "",
            move_in_date: app.requestedMoveIn ?? "",
            occupation: app.applicant.occupation === "Not provided" ? "" : app.applicant.occupation,
            employer: "",
            monthly_income: app.applicant.monthlyIncome != null ? String(app.applicant.monthlyIncome) : "",
            message: app.notes ?? "",
        });
        setEditError(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditDraft(null);
        setEditError(null);
    };

    const saveEdit = async () => {
        if (!selectedApp || !editDraft) return;
        setSavingEdit(true);
        setEditError(null);
        try {
            const res = await fetch("/api/landlord/applications/walk-in", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    application_id: selectedApp.id,
                    applicant_name: editDraft.applicant_name,
                    applicant_email: editDraft.applicant_email,
                    applicant_phone: editDraft.applicant_phone || null,
                    emergency_contact_name: editDraft.emergency_contact_name || null,
                    emergency_contact_phone: editDraft.emergency_contact_phone || null,
                    move_in_date: editDraft.move_in_date || null,
                    message: editDraft.message || null,
                    ...(editDraft.occupation && editDraft.employer && editDraft.monthly_income ? {
                        employment_info: {
                            occupation: editDraft.occupation,
                            employer: editDraft.employer,
                            monthly_income: Number(editDraft.monthly_income),
                        },
                    } : {}),
                }),
            });
            const data = await res.json() as { error?: string };
            if (!res.ok) {
                setEditError(data.error ?? "Failed to save changes.");
                return;
            }
            // Optimistically update local state
            setApplications((prev) => prev.map((a) => a.id === selectedApp.id ? {
                ...a,
                applicant: {
                    ...a.applicant,
                    name: editDraft.applicant_name || a.applicant.name,
                    email: editDraft.applicant_email || a.applicant.email,
                    phone: editDraft.applicant_phone || a.applicant.phone,
                    occupation: editDraft.occupation || a.applicant.occupation,
                    monthlyIncome: editDraft.monthly_income ? Number(editDraft.monthly_income) : a.applicant.monthlyIncome,
                },
                emergencyContact: {
                    name: editDraft.emergency_contact_name || null,
                    phone: editDraft.emergency_contact_phone || null,
                },
                requestedMoveIn: editDraft.move_in_date || a.requestedMoveIn,
                notes: editDraft.message || a.notes,
            } : a));
            setSelectedApp((prev) => prev ? {
                ...prev,
                applicant: {
                    ...prev.applicant,
                    name: editDraft.applicant_name || prev.applicant.name,
                    email: editDraft.applicant_email || prev.applicant.email,
                    phone: editDraft.applicant_phone || prev.applicant.phone,
                    occupation: editDraft.occupation || prev.applicant.occupation,
                    monthlyIncome: editDraft.monthly_income ? Number(editDraft.monthly_income) : prev.applicant.monthlyIncome,
                },
                emergencyContact: {
                    name: editDraft.emergency_contact_name || null,
                    phone: editDraft.emergency_contact_phone || null,
                },
                requestedMoveIn: editDraft.move_in_date || prev.requestedMoveIn,
                notes: editDraft.message || prev.notes,
            } : prev);
            setIsEditing(false);
            setEditDraft(null);
        } catch {
            setEditError("Failed to save changes.");
        } finally {
            setSavingEdit(false);
        }
    };

    const handleSendCredentials = async (appId: string) => {
        setSendingCredentials(true);
        try {
            const res = await fetch(`/api/landlord/applications/${appId}/resend-credentials`, {
                method: "POST",
            });
            const data = await res.json() as {
                success?: boolean;
                email?: string;
                tempPassword?: string | null;
                inviteUrl?: string | null;
                accountExisted?: boolean;
                error?: string;
            };
            if (!res.ok) {
                setActionError(data.error ?? "Failed to send credentials.");
                return;
            }
            setTenantCredentials({
                email: data.email ?? "",
                tempPassword: data.tempPassword ?? null,
                inviteUrl: data.inviteUrl ?? null,
                accountExisted: data.accountExisted,
            });
        } catch {
            setActionError("Failed to send credentials.");
        } finally {
            setSendingCredentials(false);
        }
    };

    const updateApplicationStatus = async (
        applicationId: string,
        status: "approved" | "rejected" | "reviewing"
    ) => {
        setActionError(null);
        setUpdatingStatusId(applicationId);

        try {
            const response = await fetch(`/api/landlord/applications/${applicationId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            const result = await response.json() as {
                success: boolean;
                status: string;
                tenantAccount?: { email: string; tempPassword: string; inviteUrl?: string };
            };

            setApplications((prev) =>
                prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
            );
            setSelectedApp((prev) => (prev?.id === applicationId ? { ...prev, status } : prev));

            // Show credentials to landlord if a new tenant account was provisioned
            if (result.tenantAccount?.tempPassword) {
                setTenantCredentials(result.tenantAccount);
            }
        } catch {
            setActionError("Unable to update the application status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (!mounted) return null;

    // Derived data
    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "all" || app.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter((a) => a.status === "pending").length,
        reviewing: applications.filter((a) => a.status === "reviewing").length,
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
        withdrawn: applications.filter((a) => a.status === "withdrawn").length,
    };

    const filterTabs: { label: string; value: ApplicationStatus | "all"; count: number }[] = [
        { label: "All", value: "all", count: stats.total },
        { label: "Pending", value: "pending", count: stats.pending },
        { label: "Reviewing", value: "reviewing", count: stats.reviewing },
        { label: "Approved", value: "approved", count: stats.approved },
        { label: "Rejected", value: "rejected", count: stats.rejected },
        { label: "Withdrawn", value: "withdrawn", count: stats.withdrawn },
    ];

    const isUpdatingSelectedApp = selectedApp ? updatingStatusId === selectedApp.id : false;

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar relative">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
                        <ClipboardList className="h-8 w-8 text-primary/80" />
                        Walk-in Applications
                    </h1>
                    <p className="text-neutral-400 font-medium tracking-wide text-sm">
                        Create, manage, and track walk-in tenant inquiries and applications.
                    </p>
                </div>
                <button
                    onClick={() => setShowWalkInModal(true)}
                    className="flex items-center gap-2.5 bg-primary text-neutral-950 px-6 py-3 rounded-2xl font-black text-sm tracking-tight transition-all group shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.5)] hover:scale-105 active:scale-95 cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Plus className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">New Walk-in</span>
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
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-30 rounded-t-3xl">
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
                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-neutral-400">
                            Loading applications...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                            {error}
                        </div>
                    ) : (
                        <>
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
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    setActionError(null);
                                                }}
                                                className="group relative flex flex-col bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
                                            >
                                                {/* Status Glow Bar */}
                                                {isPending && (
                                                    <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10 animate-pulse" />
                                                )}

                                                {/* Top Card Section: Property Image bg */}
                                                <div className="relative h-28 w-full bg-neutral-900 overflow-hidden shrink-0">
                                                    <img
                                                        src={resolveImage(app.propertyImage)}
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
                                                                app.status === "approved" ? "bg-emerald-500/90 text-black border-emerald-400/50" :
                                                                    app.status === "withdrawn" ? "bg-white/10 text-neutral-200 border-white/20" : ""
                                                        )}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>

                                                    {/* Score Metric Top Right */}
                                                    <div className="absolute top-3 right-3 z-10 flex flex-col items-end">
                                                        <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Credit</span>
                                                        <span className={cn("text-lg font-black leading-none drop-shadow-md", getCreditScoreColor(app.applicant.creditScore))}>
                                                            {app.applicant.creditScore ?? "N/A"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Main Content Body */}
                                                <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-neutral-950 to-neutral-900 border-t border-white/5 relative">

                                                    {/* Floating Avatar */}
                                                    <div className="absolute -top-10 left-4 h-14 w-14 rounded-full bg-neutral-900 border-4 border-neutral-950 ring-1 ring-white/10 flex items-center justify-center overflow-hidden shadow-2xl z-20 group-hover:ring-primary/50 transition-colors">
                                                        {app.applicant.avatar ? (
                                                            <img
                                                                src={app.applicant.avatar}
                                                                alt={app.applicant.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-lg font-black text-primary">
                                                                {app.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Applicant Core Details */}
                                                    <div className="mt-4 mb-4">
                                                        <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-primary transition-colors">{app.applicant.name}</h3>
                                                        <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                                                            <Briefcase className="w-3 h-3" />
                                                            {app.applicant.occupation || "Not provided"}
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
                                                            <span className="text-xs font-bold text-white block">{formatCurrency(app.monthlyRent)}</span>
                                                            <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mt-0.5">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(app.requestedMoveIn)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-h-[8px]" />

                                                    {/* Footer Actions */}
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto gap-3">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 font-mono tracking-wider min-w-0">
                                                            <span className="truncate">{app.id}</span>
                                                        </div>

                                                        <button className="flex items-center gap-1.5 text-xs font-black text-white bg-white/5 hover:bg-white/10 hover:text-primary border border-white/10 px-3 py-1.5 rounded-lg transition-all shadow-sm shrink-0">
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
                        </>
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
                            onClick={() => {
                                setSelectedApp(null);
                                setActionError(null);
                                cancelEdit();
                            }}
                            className="fixed inset-0 h-screen w-screen bg-black/60 backdrop-blur-md z-[110]"
                        />

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="fixed right-0 top-0 h-screen w-full max-w-xl bg-neutral-950 border-l border-white/10 z-[120] overflow-y-auto custom-scrollbar shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-bold text-neutral-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">{selectedApp.id}</span>
                                    <h2 className="text-lg font-black text-white tracking-tight">Application Dossier</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => openEdit(selectedApp)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-primary/10 hover:text-primary border border-white/10 hover:border-primary/30 text-neutral-400 text-xs font-black transition-all"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={cancelEdit}
                                                disabled={savingEdit}
                                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 text-xs font-black transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                disabled={savingEdit}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-black text-xs font-black transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
                                            >
                                                {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {savingEdit ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => { setSelectedApp(null); setActionError(null); cancelEdit(); }}
                                        className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Dossier Body */}
                            <div className="p-6 md:p-8 space-y-8 flex-1">

                                {/* Hero Target Block */}
                                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                                    <div className="h-48 w-full bg-neutral-900 border-b border-white/5">
                                        <img
                                            src={resolveImage(selectedApp.propertyImage)}
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
                                                <span className="text-2xl font-black text-white">{formatCurrency(selectedApp.monthlyRent)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Applicant Profiling */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-2">Applicant Profile</h4>
                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-6 flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-neutral-950 border border-white/10 ring-2 ring-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                                <span className="text-2xl font-black text-primary">
                                                    {selectedApp.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing && editDraft ? (
                                                    <input
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-2 text-white text-base font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 mb-1"
                                                        value={editDraft.applicant_name}
                                                        onChange={(e) => setEditDraft({ ...editDraft, applicant_name: e.target.value })}
                                                        placeholder="Full name"
                                                    />
                                                ) : (
                                                    <h3 className="text-xl font-bold text-white">{selectedApp.applicant.name}</h3>
                                                )}
                                                {isEditing && editDraft ? (
                                                    <input
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-2 text-neutral-400 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                                                        value={editDraft.occupation}
                                                        onChange={(e) => setEditDraft({ ...editDraft, occupation: e.target.value })}
                                                        placeholder="Occupation"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-neutral-400 font-medium">{selectedApp.applicant.occupation}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-white/5" />

                                        {editError && (
                                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                                                {editError}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                                                    <Mail className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">Email</span>
                                                    {isEditing && editDraft ? (
                                                        <input
                                                            type="email"
                                                            className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                            value={editDraft.applicant_email}
                                                            onChange={(e) => setEditDraft({ ...editDraft, applicant_email: e.target.value })}
                                                            placeholder="email@example.com"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold text-neutral-300 block truncate">{selectedApp.applicant.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                                                    <Phone className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block">Phone</span>
                                                    {isEditing && editDraft ? (
                                                        <input
                                                            className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                            value={editDraft.applicant_phone}
                                                            onChange={(e) => setEditDraft({ ...editDraft, applicant_phone: e.target.value })}
                                                            placeholder="+63 9xx xxx xxxx"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold text-neutral-300 block truncate">{selectedApp.applicant.phone}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Move-in date edit */}
                                        {isEditing && editDraft && (
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                                                    <Calendar className="h-4 w-4 text-neutral-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Move-in Date</span>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]"
                                                        value={editDraft.move_in_date}
                                                        onChange={(e) => setEditDraft({ ...editDraft, move_in_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Employment edit fields */}
                                        {isEditing && editDraft && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Employer</span>
                                                    <input
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.employer}
                                                        onChange={(e) => setEditDraft({ ...editDraft, employer: e.target.value })}
                                                        placeholder="Company name"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Monthly Income (₱)</span>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.monthly_income}
                                                        onChange={(e) => setEditDraft({ ...editDraft, monthly_income: e.target.value })}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Emergency Contact */}
                                        {isEditing && editDraft ? (
                                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 block">Emergency Contact</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <input
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.emergency_contact_name}
                                                        onChange={(e) => setEditDraft({ ...editDraft, emergency_contact_name: e.target.value })}
                                                        placeholder="Contact name"
                                                    />
                                                    <input
                                                        className="w-full bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.emergency_contact_phone}
                                                        onChange={(e) => setEditDraft({ ...editDraft, emergency_contact_phone: e.target.value })}
                                                        placeholder="+63 9xx xxx xxxx"
                                                    />
                                                </div>
                                            </div>
                                        ) : selectedApp.emergencyContact?.name && (
                                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm animate-pulse-slow">
                                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 leading-none block mb-1">Emergency Contact</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-white">{selectedApp.emergencyContact.name}</span>
                                                        <span className="text-[11px] font-bold text-neutral-400 tracking-tight">{selectedApp.emergencyContact.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes edit */}
                                        {isEditing && editDraft && (
                                            <div>
                                                <span className="text-[9px] uppercase font-bold text-neutral-500 block mb-1">Internal Notes</span>
                                                <textarea
                                                    className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-3 py-2 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[80px] placeholder:text-neutral-600"
                                                    value={editDraft.message}
                                                    onChange={(e) => setEditDraft({ ...editDraft, message: e.target.value })}
                                                    placeholder="Internal notes..."
                                                />
                                            </div>
                                        )}

                                        {/* Reference Check */}
                                        {selectedApp.reference?.name && (
                                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm">
                                                    <Shield className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 leading-none block mb-1">Background Reference</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-white">{selectedApp.reference.name}</span>
                                                        <span className="text-[11px] font-bold text-neutral-400 tracking-tight">{selectedApp.reference.contact}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Requirements Roadmap Checklist */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Requirements Roadmap</h4>
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-widest">MANDATORY</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { key: 'valid_id', label: '1. Valid Identification', desc: 'Any govt-issued ID (Name match is mandatory)' },
                                            { key: 'proof_of_income', label: '2. Source of Income', desc: 'COE, Payslip, or Contract Verification' },
                                            { key: 'application_form', label: '3. Completed App Form', desc: 'Employment & Emergency Contact Details' },
                                            { key: 'background_reference', label: '4. Background / Reference Check', desc: 'Mandatory verification — references will be reached' },
                                            { key: 'move_in_payment', label: '5. Move-in Payments', desc: '1mo Advance + 2mo Deposit (No Installments)' },
                                        ].map((req) => {
                                            const checklist = selectedApp.complianceChecklist as Record<string, boolean> | null | undefined;
                                            const isDone = checklist?.[req.key] === true;
                                            return (
                                                <div key={req.key} className={cn(
                                                    "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 group",
                                                    isDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-neutral-900 border-white/5 opacity-50"
                                                )}>
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                                        isDone ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-neutral-950 border-white/5 text-neutral-700"
                                                    )}>
                                                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Shield className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-xs font-black tracking-tight", isDone ? "text-emerald-400" : "text-neutral-400")}>{req.label}</p>
                                                        <p className="text-[10px] text-neutral-600 font-bold leading-tight mt-0.5">{req.desc}</p>
                                                    </div>
                                                    {isDone && (
                                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Financial Underwriting Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Banknote className="h-6 w-6 text-emerald-400 mb-4" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Monthly Income</span>
                                        <span className="text-2xl font-black text-white">{formatCurrency(selectedApp.applicant.monthlyIncome)}</span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold text-neutral-400">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            Ratio: {formatRatio(selectedApp.applicant.monthlyIncome, selectedApp.monthlyRent)}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl bg-neutral-900 border border-white/5 p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Shield className="h-6 w-6 text-blue-400 mb-4" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Credit Score</span>
                                        <span className={cn("text-2xl font-black", getCreditScoreColor(selectedApp.applicant.creditScore))}>
                                            {selectedApp.applicant.creditScore ?? "N/A"}
                                        </span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] font-bold">
                                            <span className={cn("w-2 h-2 rounded-full", getCreditScoreColor(selectedApp.applicant.creditScore).replace('text-', 'bg-'))} />
                                            {getCreditScoreLabel(selectedApp.applicant.creditScore)}
                                            {selectedApp.applicant.creditScore === null ? "" : " Rating"}
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
                                        {selectedApp.documents.length === 0 ? (
                                            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs font-semibold text-neutral-500">
                                                No documents uploaded.
                                            </div>
                                        ) : (
                                            selectedApp.documents.map((doc) => (
                                                <div
                                                    key={doc}
                                                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-white/5 hover:border-primary/50 hover:bg-white/[0.02] transition-all cursor-pointer group shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-neutral-950 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors shrink-0">
                                                            <FileText className="h-4 w-4 text-neutral-500 group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <span className="text-xs font-bold text-neutral-300 truncate group-hover:text-white transition-colors">
                                                            {formatDocumentLabel(doc)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Docked Action Footer */}
                            <div className="p-6 md:p-8 bg-neutral-950 border-t border-white/5 mt-auto">
                                {actionError && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300">
                                        {actionError}
                                    </div>
                                )}
                                {selectedApp.status === "pending" || selectedApp.status === "reviewing" ? (
                                    <div className="flex items-center gap-4">
                                        <button
                                            disabled={isUpdatingSelectedApp}
                                            onClick={() => updateApplicationStatus(selectedApp.id, "rejected")}
                                            className={cn(
                                                "flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black hover:bg-red-500 hover:text-white transition-all focus:ring-4 focus:ring-red-500/20 active:scale-95",
                                                isUpdatingSelectedApp && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <XCircle className="h-5 w-5" />
                                            {isUpdatingSelectedApp ? "Updating..." : "Decline Profile"}
                                        </button>
                                        <button
                                            disabled={isUpdatingSelectedApp}
                                            onClick={() => updateApplicationStatus(selectedApp.id, "approved")}
                                            className={cn(
                                                "flex-1 flex justify-center items-center gap-2 py-4 rounded-2xl bg-primary text-black font-black hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:ring-4 focus:ring-primary/40 active:scale-95",
                                                isUpdatingSelectedApp && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                            {isUpdatingSelectedApp ? "Updating..." : "Approve & Proceed"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="w-full flex items-center justify-center p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                                            <span className={cn(
                                                "text-sm font-black flex items-center gap-2",
                                                selectedApp.status === "approved"
                                                    ? "text-emerald-500"
                                                    : selectedApp.status === "withdrawn"
                                                    ? "text-neutral-300"
                                                    : "text-red-500"
                                            )}>
                                                {selectedApp.status === "approved" ? (
                                                    <><CheckCircle2 className="w-5 h-5" /> Application Finalized: Approved</>
                                                ) : selectedApp.status === "withdrawn" ? (
                                                    <><AlertCircle className="w-5 h-5" /> Application Finalized: Withdrawn</>
                                                ) : (
                                                    <><XCircle className="w-5 h-5" /> Application Finalized: Rejected</>
                                                )}
                                            </span>
                                        </div>
                                        {selectedApp.status === "approved" && (
                                            <button
                                                disabled={sendingCredentials}
                                                onClick={() => handleSendCredentials(selectedApp.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-black text-sm transition-all active:scale-95",
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40",
                                                    sendingCredentials && "opacity-60 cursor-not-allowed"
                                                )}
                                            >
                                                {sendingCredentials ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Mail className="h-4 w-4" />
                                                )}
                                                {sendingCredentials ? "Sending..." : "Send User Credentials"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Walk-in Application Modal */}
            <WalkInApplicationModal
                isOpen={showWalkInModal}
                onClose={() => setShowWalkInModal(false)}
                units={availableUnits}
                onSuccess={() => setReloadKey((k) => k + 1)}
            />

            {/* Contract Preview Modal */}
            <ContractPreviewModal
                isOpen={showContractModal}
                onClose={() => {
                    setShowContractModal(false);
                    setContractData(null);
                }}
                contractData={contractData}
                onSuccess={() => setReloadKey((k) => k + 1)}
            />

            {/* Tenant Credentials Modal */}
            <AnimatePresence>
                {tenantCredentials && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTenantCredentials(null)}
                            className="fixed inset-0 h-screen w-screen bg-black/70 backdrop-blur-md z-[130]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-neutral-950 border border-emerald-500/30 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.15)] overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-white">
                                                {tenantCredentials.accountExisted ? "Credentials Resent" : "Tenant Account Created"}
                                            </h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Credentials for landlord records</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTenantCredentials(null)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                                        {tenantCredentials.accountExisted
                                            ? "This tenant already has an account. A fresh password reset link has been generated and an invite email sent."
                                            : "A tenant account has been provisioned and an invite email sent to the applicant. Keep these credentials as a backup in case the tenant did not receive their email."}
                                    </p>
                                    <div className="space-y-3">
                                        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">Email</span>
                                            <span className="text-sm font-bold text-white font-mono">{tenantCredentials.email}</span>
                                        </div>
                                        {tenantCredentials.tempPassword && (
                                            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">Temporary Password</span>
                                                <span className="text-sm font-bold text-emerald-400 font-mono tracking-widest">{tenantCredentials.tempPassword}</span>
                                            </div>
                                        )}
                                        {tenantCredentials.inviteUrl && (
                                            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-1">Password Reset Link</span>
                                                <a
                                                    href={tenantCredentials.inviteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-blue-400 hover:text-blue-300 break-all transition-colors"
                                                >
                                                    {tenantCredentials.inviteUrl}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-400/80 font-bold leading-relaxed">
                                            The tenant has been sent an invite email to set their own password. Share these credentials only if they did not receive it.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setTenantCredentials(null)}
                                        className="w-full py-3 rounded-2xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 transition-colors active:scale-95"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
