"use client";

import { useState, useEffect, useCallback } from "react";
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
    ChevronDown,
    Eye,
    MapPin,
    Calendar,
    Banknote,
    Mail,
    Phone,
    Briefcase,
    ArrowRight,
    X,
    Shield,
    AlertCircle,
    TrendingUp,
    Users,
    Plus,
    QrCode,
    ClipboardList,
    Loader2,
    Pencil,
    Wallet,
    Save,
    Sparkles,
} from "lucide-react";
import { ToolAccessBar } from "./ToolAccessBar";
import { WalkInApplicationModal } from "./WalkInApplicationModal";
import { TenantInviteManager } from "./TenantInviteManager";
import { ContractPreviewModal } from "@/components/landlord/lease/ContractPreviewModal";
import { LeaseStatusBadge } from "@/components/landlord/leases/LeaseStatusBadge";
import { LeaseAuditTrail, type LeaseAuditEvent } from "@/components/landlord/leases/LeaseAuditTrail";
import type { LeaseStatus } from "@/types/database";
import { SignaturePad } from "./SignaturePad";

// ─── Types ────────────────────────────────────────────────────────────
type ApplicationStatus =
    | "pending"
    | "reviewing"
    | "payment_pending"
    | "approved"
    | "rejected"
    | "withdrawn";

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
    propertyId?: string | null;
    source?: "walk_in_application" | "invite_link";
    applicant: Applicant;
    propertyName: string;
    propertyContractTemplate?: Record<string, unknown> | null;
    unitNumber: string;
    propertyImage: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: ApplicationStatus;
    paymentPendingStartedAt?: string | null;
    paymentPendingExpiresAt?: string | null;
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
    lease?: {
        id: string;
        status: LeaseStatus;
        signing_mode: "in_person" | "remote" | null;
        tenant_signature: string | null;
        landlord_signature: string | null;
        tenant_signed_at: string | null;
        landlord_signed_at: string | null;
        signing_link_token_hash: string | null;
        signing_link_expires_at: string | null;
    } | null;
    leaseAuditEvents?: LeaseAuditEvent[];
    preApprovalPayments?: Array<{
        id: string;
        requirementType: "advance_rent" | "security_deposit";
        amount: number;
        dueAt: string | null;
        status: "pending" | "processing" | "completed" | "rejected" | "expired";
        method: "gcash" | "cash" | null;
        submittedAt: string | null;
        reviewedAt: string | null;
        proofUrl: string | null;
        reviewNote: string | null;
        bypassed: boolean;
    }>;
}

type PaymentReviewAction = "confirm" | "reject" | "needs_correction";

function ApplicationsSkeletonList() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={`skeleton-row-${index}`}
                    className="relative flex items-center overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm animate-pulse"
                >
                    <div className="absolute left-0 inset-y-0 w-1 bg-muted" />

                    <div className="h-24 w-32 shrink-0 bg-muted/60" />

                    <div className="flex-1 flex items-center gap-6 p-4 min-w-0">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="h-3.5 w-40 max-w-full rounded bg-muted" />
                                <div className="h-3 w-28 rounded bg-muted/80" />
                            </div>
                        </div>

                        <div className="hidden md:flex flex-col min-w-[180px] space-y-2">
                            <div className="h-2.5 w-16 rounded bg-muted/80" />
                            <div className="h-3.5 w-28 rounded bg-muted" />
                            <div className="h-3 w-20 rounded bg-muted/80" />
                        </div>

                        <div className="hidden lg:flex flex-col min-w-[140px] space-y-2">
                            <div className="h-2.5 w-20 rounded bg-muted/80" />
                            <div className="h-3.5 w-24 rounded bg-muted" />
                            <div className="h-3 w-18 rounded bg-muted/80" />
                        </div>

                        <div className="hidden xl:flex min-w-[100px] flex-col items-center space-y-1.5 rounded-xl border border-border bg-muted/20 px-4 py-2">
                            <div className="h-2.5 w-10 rounded bg-muted/80" />
                            <div className="h-5 w-8 rounded bg-muted" />
                            <div className="h-2.5 w-14 rounded bg-muted/80" />
                        </div>

                        <div className="min-w-[140px]">
                            <div className="h-7 w-32 rounded-lg bg-muted" />
                        </div>

                        <div className="h-8 w-24 rounded-lg bg-muted shrink-0" />
                    </div>
                </div>
            ))}
        </div>
    );
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
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; borderColor: string; darkColor?: string; darkBgColor?: string; darkBorderColor?: string; icon: React.ElementType }> = {
    pending: {
        label: "Pending Review",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
        borderColor: "border-amber-500/20 dark:border-amber-500/30",
        icon: Clock,
    },
    reviewing: {
        label: "Under Review",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
        borderColor: "border-blue-500/20 dark:border-blue-500/30",
        icon: Eye,
    },
    payment_pending: {
        label: "Payment Pending",
        color: "text-violet-700 dark:text-violet-300",
        bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
        borderColor: "border-violet-500/20 dark:border-violet-500/30",
        icon: Wallet,
    },
    approved: {
        label: "Approved",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
        borderColor: "border-emerald-500/20 dark:border-emerald-500/30",
        icon: CheckCircle2,
    },
    rejected: {
        label: "Rejected",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-500/10 dark:bg-red-500/20",
        borderColor: "border-red-500/20 dark:border-red-500/30",
        icon: XCircle,
    },
    withdrawn: {
        label: "Withdrawn",
        color: "text-slate-600 dark:text-neutral-400",
        bgColor: "bg-slate-100 dark:bg-white/5",
        borderColor: "border-slate-200 dark:border-white/10",
        icon: AlertCircle,
    },
};

// ─── Helper ───────────────────────────────────────────────────────────
function getCreditScoreColor(score: number | null) {
    if (score === null || Number.isNaN(score)) return "text-slate-500 dark:text-neutral-500";
    if (score >= 750) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 700) return "text-lime-600 dark:text-lime-400";
    if (score >= 650) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
}

function getCreditScoreDotColor(score: number | null) {
    if (score === null || Number.isNaN(score)) return "bg-slate-400 dark:bg-neutral-500";
    if (score >= 750) return "bg-emerald-500";
    if (score >= 700) return "bg-lime-500";
    if (score >= 650) return "bg-amber-500";
    return "bg-red-500";
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
    const [activeFilter, setActiveFilterState] = useState<ApplicationStatus | "all">("all");
    const [filterLoading, setFilterLoading] = useState(false);

    const setActiveFilter = (filter: ApplicationStatus | "all") => {
        if (filter !== activeFilter) {
            setFilterLoading(true);
            // Delay the actual filter update to let skeleton render first
            setTimeout(() => {
                setActiveFilterState(filter);
                setTimeout(() => setFilterLoading(false), 150);
            }, 50);
        }
    };
    const [selectedApp, setSelectedApp] = useState<RentApplication | null>(null);
    const [applications, setApplications] = useState<RentApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataFetched, setDataFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [showTenantApplicationModal, setShowTenantApplicationModal] = useState(false);
    const [showKpiCards, setShowKpiCards] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [contractData, setContractData] = useState<{
        application_id: string;
        unit_name: string;
        property_name: string;
        property_contract_template: Record<string, unknown> | null;
        applicant_name: string;
        applicant_email: string;
        requested_move_in: string | null;
        monthly_rent: number;
        application_status: ApplicationStatus;
    } | null>(null);
    const [availableUnits, setAvailableUnits] = useState<{
        id: string;
        name: string;
        rent_amount: number;
        property_id: string;
        property_name: string;
        property_contract_template?: Record<string, unknown> | null;
        status?: string;
    }[]>([]);
    const [tenantInvites, setTenantInvites] = useState<Array<{
        id: string;
        mode: "property" | "unit";
        applicationType: "online" | "face_to_face";
        requiredRequirements: string[];
        status: string;
        propertyId: string;
        propertyName: string;
        unitId: string | null;
        unitName: string | null;
        expiresAt: string | null;
        useCount: number;
        maxUses: number;
        lastUsedAt: string | null;
        createdAt: string;
        paymentPreview?: {
            advanceAmount: number;
            securityDepositAmount: number;
            estimated: true;
            disclaimer: string;
        };
        shareUrl: string;
        qrUrl: string;
    }>>([]);
    const [reloadKey, setReloadKey] = useState(0);
    const [signingLinkState, setSigningLinkState] = useState<{
        loading: boolean;
        message: string | null;
        error: string | null;
        signingUrl: string | null;
    }>({
        loading: false,
        message: null,
        error: null,
        signingUrl: null,
    });
    const [countersignState, setCountersignState] = useState<{
        loading: boolean;
        error: string | null;
        message: string | null;
    }>({
        loading: false,
        error: null,
        message: null,
    });
    const [showCountersignModal, setShowCountersignModal] = useState(false);
    const [pendingCountersignature, setPendingCountersignature] = useState<string | null>(null);
    const [reviewingPaymentRequestId, setReviewingPaymentRequestId] = useState<string | null>(null);
    const [bypassingPayments, setBypassingPayments] = useState(false);
    const [bypassReason, setBypassReason] = useState("");
    const [bypassPassword, setBypassPassword] = useState("");

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [documentLoading, setDocumentLoading] = useState(true);
    const [showMoreFilters, setShowMoreFilters] = useState(false);
    const [showInviteTools, setShowInviteTools] = useState(false);

    useEffect(() => {
        if (previewUrl) setDocumentLoading(true);
    }, [previewUrl]);

    useEffect(() => {
        setBypassReason("");
        setBypassPassword("");
        setReviewingPaymentRequestId(null);
    }, [selectedApp?.id]);

    useEffect(() => {
        setMounted(true);
        setLoading(true);
        if (searchParams?.get("action") === "tenant-application") {
            setShowTenantApplicationModal(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const controller = new AbortController();
        const startTime = Date.now();

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
                if (!controller.signal.aborted) {
                    setApplications(Array.isArray(payload.applications) ? payload.applications : []);
                    setDataFetched(true);
                }
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                if (!controller.signal.aborted) {
                    setError("Unable to load applications right now.");
                    setApplications([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    // Ensure skeleton shows for minimum 400ms for smooth UX
                    const elapsed = Date.now() - startTime;
                    const minLoadingTime = 400;
                    if (elapsed < minLoadingTime) {
                        setTimeout(() => {
                            if (!controller.signal.aborted) {
                                setLoading(false);
                            }
                        }, minLoadingTime - elapsed);
                    } else {
                        setLoading(false);
                    }
                }
            }
        };

        loadApplications();

        return () => {
            controller.abort();
        };
    }, [reloadKey]);

    const toggleRequirement = async (applicationId: string, currentChecklist: Record<string, boolean>, key: string) => {
        const updatedChecklist = {
            ...currentChecklist,
            [key]: !currentChecklist[key]
        };

        // Helper to sync multiple pieces of state
        const updateAllStates = (checklist: Record<string, boolean>) => {
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, complianceChecklist: checklist as RentApplication['complianceChecklist'] } : a));
            if (selectedApp?.id === applicationId) {
                setSelectedApp(prev => prev ? { ...prev, complianceChecklist: checklist as RentApplication['complianceChecklist'] } : null);
            }
        };

        // 1. Optimistic UI update
        updateAllStates(updatedChecklist);

        try {
            const res = await fetch("/api/landlord/applications/tenant-application", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    application_id: applicationId,
                    requirements_checklist: updatedChecklist
                })
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                throw new Error(data.error || "Failed to update requirement status");
            }
        } catch (error) {
            console.error("Toggle requirement error:", error);
            setActionError("Failed to sync requirement status. Reverting change...");
            
            // 2. Rollback on failure
            updateAllStates(currentChecklist);
        }
    };

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
                        contractTemplate?: Record<string, unknown> | null;
                        units?: Array<{
                            id: string;
                            name: string;
                            status?: string;
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
                        property_contract_template: property.contractTemplate ?? null,
                        status: unit.status,
                    }));
                });

                setAvailableUnits(unitsList);
            } catch {
                // Silently fail
            }
        };

        void loadUnits();
    }, []);

    const loadInvites = useCallback(async () => {
        try {
            const response = await fetch("/api/landlord/invites");
            if (!response.ok) return;
            const payload = (await response.json()) as { invites?: typeof tenantInvites };
            setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
        } catch {
            // Silently fail
        }
    }, []);

    useEffect(() => {
        void loadInvites();
    }, [loadInvites]);

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
            const res = await fetch("/api/landlord/applications/tenant-application", {
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
        status: "rejected" | "reviewing"
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
                tenant_account?: { email: string; tempPassword: string; inviteUrl?: string };
            };

            setApplications((prev) =>
                prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
            );
            setSelectedApp((prev) => (prev?.id === applicationId ? { ...prev, status } : prev));

            // Show credentials to landlord if a new tenant account was provisioned
            if (result.tenant_account?.tempPassword) {
                setTenantCredentials(result.tenant_account);
            }
        } catch {
            setActionError("Unable to update the application status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const openApprovalModal = (application: RentApplication) => {
        const monthlyRent = Number(application.monthlyRent ?? 0);
        const requiresRentForRequest = application.status !== "payment_pending";
        if (requiresRentForRequest && (!Number.isFinite(monthlyRent) || monthlyRent <= 0)) {
            setActionError("This application is missing a valid monthly rent amount. Update the unit rent first.");
            return;
        }

        setActionError(null);
        setContractData({
            application_id: application.id,
            unit_name: application.unitNumber,
            property_name: application.propertyName,
            property_contract_template: application.propertyContractTemplate ?? null,
            applicant_name: application.applicant.name,
            applicant_email: application.applicant.email,
            requested_move_in: application.requestedMoveIn,
            monthly_rent: Number.isFinite(monthlyRent) ? monthlyRent : 0,
            application_status: application.status,
        });
        setShowContractModal(true);
    };

    const reviewPreApprovalPayment = async (requestId: string, action: PaymentReviewAction) => {
        if (!selectedApp) return;
        setActionError(null);
        setReviewingPaymentRequestId(requestId);
        try {
            const response = await fetch(
                `/api/landlord/applications/${selectedApp.id}/payment-requests/${requestId}/review`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action }),
                }
            );
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to review payment request.");
            }
            refreshApplications();
        } catch (reviewError) {
            setActionError(reviewError instanceof Error ? reviewError.message : "Failed to review payment request.");
        } finally {
            setReviewingPaymentRequestId(null);
        }
    };

    const runPaymentBypass = async () => {
        if (!selectedApp) return;
        if (!bypassPassword.trim() || !bypassReason.trim()) {
            setActionError("Password and bypass reason are both required.");
            return;
        }

        setActionError(null);
        setBypassingPayments(true);
        try {
            const response = await fetch(`/api/landlord/applications/${selectedApp.id}/payment-bypass`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: bypassPassword,
                    reason: bypassReason,
                }),
            });
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to run payment bypass.");
            }
            setBypassPassword("");
            setBypassReason("");
            refreshApplications();
        } catch (bypassError) {
            setActionError(bypassError instanceof Error ? bypassError.message : "Failed to run payment bypass.");
        } finally {
            setBypassingPayments(false);
        }
    };

    const refreshApplications = () => setReloadKey((k) => k + 1);

    const handleGenerateSigningLink = async (applicationId: string) => {
        setSigningLinkState({ loading: true, message: null, error: null, signingUrl: null });
        try {
            const response = await fetch(`/api/landlord/applications/${applicationId}/signing-link`, {
                method: "POST",
            });
            const data = (await response.json()) as {
                success?: boolean;
                signing_url?: string;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate signing link.");
            }

            setSigningLinkState({
                loading: false,
                message: "Signing link generated and email has been attempted.",
                error: null,
                signingUrl: data.signing_url ?? null,
            });
            refreshApplications();
        } catch (err) {
            setSigningLinkState({
                loading: false,
                message: null,
                error: err instanceof Error ? err.message : "Failed to generate signing link.",
                signingUrl: null,
            });
        }
    };

    const handleRegenerateSigningLink = async (applicationId: string) => {
        setSigningLinkState({ loading: true, message: null, error: null, signingUrl: null });
        try {
            const response = await fetch(`/api/landlord/applications/${applicationId}/signing-link/regenerate`, {
                method: "POST",
            });
            const data = (await response.json()) as {
                success?: boolean;
                signing_url?: string;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error || "Failed to regenerate signing link.");
            }

            setSigningLinkState({
                loading: false,
                message: "Signing link regenerated successfully.",
                error: null,
                signingUrl: data.signing_url ?? null,
            });
            refreshApplications();
        } catch (err) {
            setSigningLinkState({
                loading: false,
                message: null,
                error: err instanceof Error ? err.message : "Failed to regenerate signing link.",
                signingUrl: null,
            });
        }
    };

    const handleCountersignLease = async (leaseId: string, landlordSignature: string) => {
        setCountersignState({ loading: true, error: null, message: null });
        try {
            const response = await fetch(`/api/landlord/leases/${leaseId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    landlord_signature: landlordSignature,
                }),
            });
            const data = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(data.error || "Failed to countersign lease.");
            }
            setCountersignState({
                loading: false,
                error: null,
                message: "Lease countersigned successfully.",
            });
            setShowCountersignModal(false);
            setPendingCountersignature(null);
            refreshApplications();
        } catch (err) {
            setCountersignState({
                loading: false,
                error: err instanceof Error ? err.message : "Failed to countersign lease.",
                message: null,
            });
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
        payment_pending: applications.filter((a) => a.status === "payment_pending").length,
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
        withdrawn: applications.filter((a) => a.status === "withdrawn").length,
    };

    const filterTabs: { label: string; value: ApplicationStatus | "all"; count: number }[] = [
        { label: "All", value: "all", count: stats.total },
        { label: "Pending", value: "pending", count: stats.pending },
        { label: "Reviewing", value: "reviewing", count: stats.reviewing },
        { label: "Approved", value: "approved", count: stats.approved },
        { label: "Payment Pending", value: "payment_pending", count: stats.payment_pending },
        { label: "Rejected", value: "rejected", count: stats.rejected },
        { label: "Withdrawn", value: "withdrawn", count: stats.withdrawn },
    ];

    const isUpdatingSelectedApp = selectedApp ? updatingStatusId === selectedApp.id : false;
    const selectedAppPaymentsReady = selectedApp
        ? (() => {
              const requests = selectedApp.preApprovalPayments ?? [];
              const advanceConfirmed = requests.some(
                  (request) => request.requirementType === "advance_rent" && request.status === "completed"
              );
              const securityConfirmed = requests.some(
                  (request) =>
                      request.requirementType === "security_deposit" && request.status === "completed"
              );
              return advanceConfirmed && securityConfirmed;
          })()
        : false;

    return (
        <div className="relative flex h-full w-full animate-in fade-in flex-col space-y-8 overflow-y-auto bg-background p-6 text-foreground duration-700 custom-scrollbar md:p-8">

            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="mb-2 flex items-center gap-3 text-3xl font-black tracking-tight text-foreground">
                        <ClipboardList className="h-8 w-8 text-primary/80" />
                        Tenant Applications
                    </h1>
                    <p className="text-sm font-medium tracking-wide text-muted-foreground">
                        Create, manage, and track tenant inquiries and applications.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTenantApplicationModal(true)}
                        className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-sm font-black tracking-tight text-primary-foreground shadow-[0_14px_32px_-20px_rgba(var(--primary-rgb),0.65)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <Plus className="h-5 w-5 relative z-10" />
                        <span className="relative z-10">New Application</span>
                    </button>

                    <button
                        onClick={() => setShowInviteTools(true)}
                        className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl border border-border bg-card px-6 py-3 text-sm font-black tracking-tight transition-all hover:bg-muted active:scale-95"
                    >
                        <QrCode className="h-5 w-5" />
                        <span>Invite Manager</span>
                    </button>
                </div>
            </div>



            {/* KPI Stats Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowKpiCards(!showKpiCards)}
                    className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                    <div className={cn("h-1.5 w-1.5 rounded-full transition-all duration-500", showKpiCards ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
                    {showKpiCards ? "Hide" : "Show"} Metrics
                </button>
            </div>

            {/* Glowing KPI Dashboard */}
            {showKpiCards && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Action Required", subtitle: "Pending forms", value: stats.pending, icon: Clock, glow: "rgba(245,158,11,0.15)", border: "border-amber-500/20", color: "text-amber-500" },
                    { label: "Under Review", subtitle: "Background checks", value: stats.reviewing, icon: Eye, glow: "rgba(59,130,246,0.15)", border: "border-blue-500/20", color: "text-blue-500" },
                    { label: "Approved", subtitle: "Awaiting contracts", value: stats.approved, icon: CheckCircle2, glow: "rgba(16,185,129,0.15)", border: "border-emerald-500/20", color: "text-emerald-500" },
                    { label: "Rejected", subtitle: "Denied profiles", value: stats.rejected, icon: XCircle, glow: "rgba(239,68,68,0.15)", border: "border-red-500/20", color: "text-red-500" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={cn(
                            "group relative overflow-hidden rounded-3xl border bg-card/95 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1",
                            stat.border
                        )}
                    >
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(circle at center, ${stat.glow} 0%, transparent 70%)` }}
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</h3>
                                <div className="rounded-xl border border-border bg-background p-2">
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-4xl font-black tracking-tighter text-foreground">{stat.value}</span>
                                <span className="text-sm font-medium text-muted-foreground">{stat.subtitle}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Main Application Container */}
            <div className="flex flex-col rounded-3xl border border-border bg-card/95 pt-2 shadow-sm">

                {/* Unified Command Toolbar */}
                <div className="flex flex-col items-center justify-between gap-4 rounded-t-3xl border-b border-border bg-card/90 p-4 md:p-6 backdrop-blur-xl xl:flex-row">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/50 p-1.5 w-full xl:w-fit overflow-hidden">
                        <div className="no-scrollbar flex overflow-x-auto">
                            <div className="flex items-center gap-1">
                                {filterTabs.slice(0, 4).map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => { setActiveFilter(tab.value); setShowMoreFilters(false); }}
                                        className={cn(
                                            "group relative px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                                            activeFilter === tab.value
                                                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        )}
                                    >
                                        {tab.label}
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-lg text-[9px] font-black leading-none transition-all duration-300",
                                            activeFilter === tab.value 
                                                ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]" 
                                                : "bg-background border border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary"
                                        )}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-6 w-[1px] bg-border/60 mx-1 hidden sm:block" />

                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowMoreFilters(!showMoreFilters)}
                                className={cn(
                                    "group relative px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                                    filterTabs.slice(4).some(t => t.value === activeFilter)
                                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                                )}
                            >
                                More
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", showMoreFilters && "rotate-180")} />
                                {filterTabs.slice(4).some(t => t.value === activeFilter) && (
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showMoreFilters && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setShowMoreFilters(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-2 z-[70] min-w-[200px] overflow-hidden rounded-2xl border border-border bg-card/98 p-1.5 shadow-2xl backdrop-blur-xl"
                                        >
                                            <div className="p-2 mb-1">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Secondary Statuses</p>
                                            </div>
                                            {filterTabs.slice(4).map((tab) => (
                                                <button
                                                    key={tab.value}
                                                    onClick={() => {
                                                        setActiveFilter(tab.value);
                                                        setShowMoreFilters(false);
                                                    }}
                                                    className={cn(
                                                        "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all",
                                                        activeFilter === tab.value
                                                            ? "bg-primary/10 text-primary"
                                                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                                    )}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded-md text-[9px] font-black",
                                                        activeFilter === tab.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {tab.count}
                                                    </span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full xl:w-auto xl:flex-1 xl:justify-end">
                        <div className="relative group flex-1 xl:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-border bg-background/50 h-11 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm group-hover:border-primary/20"
                            />
                        </div>
                        
                        <button className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 shrink-0">
                            <Filter className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Advanced</span>
                        </button>
                    </div>
                </div>

                {/* Grid Format Interface */}
                <div className="p-6">
                    {!dataFetched || loading || filterLoading ? (
                        <ApplicationsSkeletonList />
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {filteredApplications.map((app, index) => {
                                        const statusConfig = STATUS_CONFIG[app.status];
                                        const StatusIcon = statusConfig.icon;
                                        const isPending = app.status === "pending";

                                        return (
                                            <motion.div
                                                key={app.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                                onClick={() => {
                                                    setSelectedApp(app);
                                                    setActionError(null);
                                                }}
                                                className="group relative flex cursor-pointer items-center overflow-hidden rounded-2xl border border-border bg-background/80 shadow-sm transition-all duration-300 hover:border-primary/20 hover:bg-card"
                                            >
                                                {/* Status Glow Bar */}
                                                {isPending && (
                                                    <div className="absolute left-0 inset-y-0 w-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] z-10 animate-pulse" />
                                                )}

                                                {/* Property Image Thumbnail */}
                                                <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-muted/50">
                                                    <img
                                                        src={resolveImage(app.propertyImage)}
                                                        alt={app.propertyName}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-90"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/50 dark:to-neutral-950/80" />
                                                </div>

                                                {/* Main Content */}
                                                <div className="flex-1 flex items-center gap-6 p-4 min-w-0">
                                                    
                                                    {/* Applicant Info */}
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        {/* Avatar */}
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-card ring-2 ring-primary/10 shadow-sm transition-colors group-hover:ring-primary/30">
                                                            {app.applicant.avatar ? (
                                                                <img
                                                                    src={app.applicant.avatar}
                                                                    alt={app.applicant.name}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-sm font-black text-primary">
                                                                    {app.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Name & Occupation */}
                                                        <div className="flex-[2] min-w-0">
                                                            <h3 className="mb-0.5 text-lg font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                                                                {app.applicant.name}
                                                            </h3>
                                                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                                                <Briefcase className="w-3 h-3 shrink-0" />
                                                                {app.applicant.occupation || "Unspecified Occupation"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Property Details */}
                                                    <div className="hidden md:flex flex-col min-w-[180px]">
                                                        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Property</span>
                                                        <span className="truncate text-sm font-bold text-foreground">{app.propertyName}</span>
                                                        <span className="text-xs font-bold text-primary mt-0.5">{app.unitNumber}</span>
                                                        {app.source === "invite_link" && (
                                                            <span className="mt-2 inline-flex w-fit rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
                                                                Invite
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rent & Date */}
                                                    <div className="hidden lg:flex flex-col min-w-[140px]">
                                                        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Rent</span>
                                                        <span className="text-sm font-bold text-foreground">{formatCurrency(app.monthlyRent)}</span>
                                                        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(app.requestedMoveIn)}
                                                        </span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex items-center gap-3 min-w-[140px]">
                                                        <span className={cn(
                                                            "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-sm transition-all duration-300",
                                                            statusConfig.bgColor,
                                                            statusConfig.borderColor,
                                                            statusConfig.color,
                                                            app.status === "pending" && "border-amber-400 bg-amber-500 text-black dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-400",
                                                            app.status === "approved" && "border-emerald-400/50 bg-emerald-500/90 text-black dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400",
                                                            app.status === "withdrawn" && "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200"
                                                        )}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button className="group/btn flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-black uppercase tracking-widest text-foreground shadow-sm transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95">
                                                        <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                        <span className="hidden sm:inline">Review</span>
                                                        <ArrowRight className="w-4 h-4 -ml-1 opacity-0 -translate-x-2 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                                                    </button>
                                                </div>

                                                {/* Hover Glow Effect */}
                                                <div className="absolute inset-y-0 right-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {dataFetched && filteredApplications.length === 0 && (
                                <div className="py-24 flex flex-col items-center justify-center text-center">
                                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-card ring-1 ring-border shadow-sm">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-black text-foreground">No Active Applications</h3>
                                    <p className="max-w-sm text-sm font-medium text-muted-foreground">
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
                            className="fixed inset-0 z-[110] h-screen w-screen bg-black/55 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="fixed right-0 top-0 z-[120] flex h-screen w-full max-w-xl flex-col border-l border-border bg-card/98 shadow-2xl"
                        >
                            {/* Outer Left Side Tools */}
                            {selectedApp.propertyId && (
                                <div className="absolute left-0 top-32 -translate-x-full pr-4 hidden sm:flex">
                                    <ToolAccessBar 
                                        variant="icons" 
                                        direction="vertical" 
                                        propertyId={selectedApp.propertyId} 
                                    />
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                                {/* Panel Header */}
                            <div className="sticky top-0 z-50 border-b border-border bg-card/95 px-8 pt-8 pb-6 shadow-sm backdrop-blur-3xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2.5 rounded-full border border-border bg-background/50 px-3 py-1 text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                            <span className="font-mono text-[9px] font-black tracking-[0.2em] uppercase leading-none">{selectedApp.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-muted-foreground">
                                            <Clock className="w-3 h-3 text-primary/60" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                Created: {formatDate(selectedApp.submittedDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedApp(null); setActionError(null); cancelEdit(); }}
                                        className="group h-10 w-10 flex items-center justify-center rounded-full border border-border bg-background transition-all hover:scale-110 hover:border-red-500/30 hover:bg-red-500/5"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground group-hover:text-red-500 group-hover:rotate-90 transition-all duration-300" />
                                    </button>
                                </div>

                                <div className="flex items-end justify-between gap-6">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                            <div className="h-px w-6 bg-primary/30" />
                                            Property Management
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight">
                                            Application <span className="text-muted-foreground/40">Dossier</span>
                                        </h2>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        {!isEditing ? (
                                            <button
                                                onClick={() => openEdit(selectedApp)}
                                                className="group flex h-12 items-center gap-2.5 rounded-xl border border-border bg-background px-6 text-xs font-black uppercase tracking-widest text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95"
                                            >
                                                <Pencil className="h-4 w-4 transition-transform group-hover:scale-110" />
                                                Edit Record
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={cancelEdit}
                                                    disabled={savingEdit}
                                                    className="h-12 rounded-xl border border-border bg-background px-6 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted active:scale-95"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={saveEdit}
                                                    disabled={savingEdit}
                                                    className="flex h-12 items-center gap-2.5 rounded-xl bg-primary px-8 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg transition-all hover:scale-[1.02] hover:shadow-primary/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    Commit Changes
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Dossier Body */}
                            <div className="p-6 md:p-8 space-y-8 flex-1">

                                {/* Hero Target Block */}
                                <div className="group relative overflow-hidden rounded-3xl border border-border shadow-sm">
                                    <div className="h-48 w-full border-b border-border bg-muted/40">
                                        <img
                                            src={resolveImage(selectedApp.propertyImage)}
                                            alt={selectedApp.propertyName}
                                            className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/58 via-slate-900/18 to-transparent dark:from-neutral-950 dark:via-neutral-950/50" />
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-white leading-none mb-2">{selectedApp.propertyName}</h3>
                                                <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg text-sm font-bold shadow-sm backdrop-blur-md">
                                                    {selectedApp.unitNumber}
                                                </span>
                                                 {selectedApp.source === "invite_link" && (
                                                    <span className="ml-3 inline-flex rounded-lg border border-blue-400/20 bg-blue-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-100 dark:text-blue-200">
                                                        Invite submission
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-200/85">Monthly Rent</span>
                                                <span className="text-2xl font-black text-white">{formatCurrency(selectedApp.monthlyRent)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Applicant Profiling */}
                                <div className="space-y-4">
                                    <h4 className="pl-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applicant Profile</h4>
                                    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-background/70 p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card ring-2 ring-primary/10 shadow-sm">
                                                <span className="text-2xl font-black text-primary">
                                                    {selectedApp.applicant.name.split(" ").map((n) => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isEditing && editDraft ? (
                                                    <input
                                                        className="mb-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-base font-bold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.applicant_name}
                                                        onChange={(e) => setEditDraft({ ...editDraft, applicant_name: e.target.value })}
                                                        placeholder="Full name"
                                                    />
                                                ) : (
                                                    <h3 className="text-xl font-bold text-foreground">{selectedApp.applicant.name}</h3>
                                                )}
                                                {isEditing && editDraft ? (
                                                    <input
                                                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.occupation}
                                                        onChange={(e) => setEditDraft({ ...editDraft, occupation: e.target.value })}
                                                        placeholder="Occupation"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-muted-foreground">{selectedApp.applicant.occupation}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-border" />

                                        {editError && (
                                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-bold text-red-700 dark:text-red-400">
                                                {editError}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="rounded-xl border border-border bg-card p-2 shrink-0">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="block text-[9px] font-bold uppercase text-muted-foreground">Email</span>
                                                    {isEditing && editDraft ? (
                                                        <input
                                                            type="email"
                                                            className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                                                            value={editDraft.applicant_email}
                                                            onChange={(e) => setEditDraft({ ...editDraft, applicant_email: e.target.value })}
                                                            placeholder="email@example.com"
                                                        />
                                                    ) : (
                                                        <span className="block truncate text-sm font-bold text-foreground">{selectedApp.applicant.email}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="rounded-xl border border-border bg-card p-2 shrink-0">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="block text-[9px] font-bold uppercase text-muted-foreground">Phone</span>
                                                    {isEditing && editDraft ? (
                                                        <input
                                                            className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                                                            value={editDraft.applicant_phone}
                                                            onChange={(e) => setEditDraft({ ...editDraft, applicant_phone: e.target.value })}
                                                            placeholder="+63 9xx xxx xxxx"
                                                        />
                                                    ) : (
                                                        <span className="block truncate text-sm font-bold text-foreground">{selectedApp.applicant.phone}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Move-in date edit */}
                                        {isEditing && editDraft && (
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-xl border border-border bg-card p-2 shrink-0">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">Move-in Date</span>
                                                    <input
                                                        type="date"
                                                        className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:light] dark:[color-scheme:dark]"
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
                                                    <span className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">Employer</span>
                                                    <input
                                                        className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.employer}
                                                        onChange={(e) => setEditDraft({ ...editDraft, employer: e.target.value })}
                                                        placeholder="Company name"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">Monthly Income (₱)</span>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
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
                                                <span className="block text-[10px] font-black uppercase tracking-widest text-amber-700/70 dark:text-amber-500/60">Emergency Contact</span>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <input
                                                        className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                                                        value={editDraft.emergency_contact_name}
                                                        onChange={(e) => setEditDraft({ ...editDraft, emergency_contact_name: e.target.value })}
                                                        placeholder="Contact name"
                                                    />
                                                    <input
                                                        className="w-full rounded-lg border border-border bg-card px-2 py-1 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30"
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
                                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest leading-none text-amber-700/70 dark:text-amber-500/60">Emergency Contact</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-foreground">{selectedApp.emergencyContact.name}</span>
                                                        <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{selectedApp.emergencyContact.phone}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes edit */}
                                        {isEditing && editDraft && (
                                            <div>
                                                <span className="mb-1 block text-[9px] font-bold uppercase text-muted-foreground">Internal Notes</span>
                                                <textarea
                                                    className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
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
                                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-widest leading-none text-blue-700/70 dark:text-blue-500/60">Background Reference</span>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-foreground">{selectedApp.reference.name}</span>
                                                        <span className="text-[11px] font-bold tracking-tight text-muted-foreground">{selectedApp.reference.contact}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                 {/* Requirements Roadmap Checklist */}
                                 <div className="space-y-6 border-t border-border pt-8">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Compliance Protocol</h4>
                                            <p className="text-xl font-black tracking-tight text-foreground">Requirements Roadmap</p>
                                        </div>
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 tracking-widest uppercase">Mandatory</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'valid_id', label: 'Valid Identification', desc: 'Govt-issued ID verify' },
                                            { key: 'income_verified', label: 'Source of Income', desc: 'COE or Payslip check' },
                                            { key: 'application_completed', label: 'Application Form', desc: 'Full details completed' },
                                            { key: 'payment_received', label: 'Move-in Payments', desc: 'Landlord confirmation' },
                                        ].map((req, idx) => {
                                            const checklist = selectedApp.complianceChecklist as Record<string, boolean> | null | undefined;
                                            const isDone = checklist?.[req.key] === true;
                                            return (
                                                <button 
                                                    key={req.key}
                                                    disabled={isEditing}
                                                    onClick={() => toggleRequirement(selectedApp.id, selectedApp.complianceChecklist as Record<string, boolean> || {}, req.key)}
                                                    className={cn(
                                                        "group relative flex flex-col items-start gap-4 rounded-2xl border p-5 transition-all duration-300",
                                                        isDone 
                                                            ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40" 
                                                            : "bg-card border-border hover:border-primary/20",
                                                        !isEditing && "hover:-translate-y-1 active:scale-95"
                                                    )}
                                                >
                                                    <div className="flex w-full items-center justify-between pointer-events-none">
                                                        <div className={cn(
                                                            "h-10 w-10 flex items-center justify-center rounded-xl transition-all duration-500",
                                                            isDone ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-muted text-muted-foreground"
                                                        )}>
                                                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-black text-xs">{idx + 1}</span>}
                                                        </div>
                                                        <div className={cn(
                                                            "rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest transition-opacity duration-300",
                                                            isDone ? "bg-emerald-500/20 text-emerald-600 opacity-100" : "opacity-0"
                                                        )}>
                                                            Verified
                                                        </div>
                                                    </div>
                                                    <div className="text-left pointer-events-none">
                                                        <p className={cn("text-[13px] font-black tracking-tight", isDone ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                                                            {req.label}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed mt-0.5">{req.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Continuation Workflow Center */}
                                    <div className="mt-8 rounded-[2rem] border border-primary/20 bg-primary/5 p-8 backdrop-blur-md overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                                            <Sparkles className="w-32 h-32 text-primary" />
                                        </div>
                                        
                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                            <div className="max-w-md">
                                                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-[8px] mb-3">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                    Transaction Continuity
                                                </div>
                                                <h4 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
                                                    {selectedApp.status === "pending" ? "Resume Application" : 
                                                     selectedApp.status === "reviewing" ? "Final Decision" : 
                                                     "Transaction Audit"}
                                                </h4>
                                                <p className="text-sm font-medium text-muted-foreground/70 mt-3 leading-relaxed">
                                                    {selectedApp.status === "pending" 
                                                        ? "Essential requirements are still pending verification. Complete the checklist above to move this applicant into the formal review stage."
                                                        : selectedApp.status === "reviewing"
                                                        ? "Internal verification is complete. You can now finalize the approval process which will automatically generate the legal lease documents."
                                                        : "Workflow complete. Historical compliance records and transaction details are locked for auditing purposes."}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                                {selectedApp.status === "pending" && (
                                                    <button 
                                                        disabled={Object.values(selectedApp.complianceChecklist as Record<string, boolean> || {}).filter(v => v).length < 3 || updatingStatusId === selectedApp.id}
                                                        onClick={() => updateApplicationStatus(selectedApp.id, "reviewing")}
                                                        className="flex items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95 disabled:grayscale disabled:opacity-50"
                                                    >
                                                        {updatingStatusId === selectedApp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Move to Review <ArrowRight className="w-4 h-4" /></>}
                                                    </button>
                                                )}
                                                {selectedApp.status === "reviewing" && (
                                                    <button 
                                                        disabled={updatingStatusId === selectedApp.id}
                                                        onClick={() => openApprovalModal(selectedApp)}
                                                        className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {updatingStatusId === selectedApp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Approve & Sign <CheckCircle2 className="w-4 h-4" /></>}
                                                    </button>
                                                )}
                                                {(selectedApp.status === "pending" || selectedApp.status === "reviewing") && (
                                                    <button 
                                                        disabled={updatingStatusId === selectedApp.id}
                                                        onClick={() => updateApplicationStatus(selectedApp.id, "rejected")}
                                                        className="rounded-xl border border-red-500/20 bg-red-500/5 px-8 py-4 text-xs font-black uppercase tracking-widest text-red-600 transition-all hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                                                    >
                                                        Decline Application
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                 </div>


                                 {/* Financial Underwriting Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group relative overflow-hidden rounded-3xl border border-border bg-background/70 p-5 transition-colors hover:border-emerald-500/30">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Banknote className="h-6 w-6 text-emerald-400 mb-4" />
                                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Income</span>
                                        <span className="text-2xl font-black text-foreground">{formatCurrency(selectedApp.applicant.monthlyIncome)}</span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-[10px] font-bold text-muted-foreground">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                            Ratio: {formatRatio(selectedApp.applicant.monthlyIncome, selectedApp.monthlyRent)}
                                        </div>
                                    </div>

                                    <div className="group relative overflow-hidden rounded-3xl border border-border bg-background/70 p-5 transition-colors hover:border-blue-500/30">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                        <Shield className="h-6 w-6 text-blue-400 mb-4" />
                                        <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credit Score</span>
                                        <span className={cn("text-2xl font-black", getCreditScoreColor(selectedApp.applicant.creditScore))}>
                                            {selectedApp.applicant.creditScore ?? "N/A"}
                                        </span>
                                        <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-border bg-card px-2 py-1 text-[10px] font-bold">
                                            <span className={cn("w-2 h-2 rounded-full", getCreditScoreDotColor(selectedApp.applicant.creditScore))} />
                                            {getCreditScoreLabel(selectedApp.applicant.creditScore)}
                                            {selectedApp.applicant.creditScore === null ? "" : " Rating"}
                                        </div>
                                    </div>
                                </div>

                                {/* Extractive Document View */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center justify-between pl-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Supporting Documents
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">{selectedApp.documents.length} Files</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedApp.documents.length === 0 ? (
                                            <p className="text-[10px] font-medium text-muted-foreground italic px-2">No documents uploaded</p>
                                        ) : (
                                            selectedApp.documents.map((doc, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPreviewUrl(doc)}
                                                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background/50 p-4 shadow-sm transition-all hover:border-primary/50 hover:bg-card hover:shadow-md active:scale-95"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="shrink-0 rounded-xl border border-border bg-card p-2.5 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                                                            <FileText className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                                        </div>
                                                        <div className="flex flex-col items-start overflow-hidden">
                                                            <span className="truncate text-[11px] font-black text-foreground transition-colors group-hover:text-primary">
                                                                {formatDocumentLabel(doc)}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Supporting File</span>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                            </div>

                            {/* Docked Action Footer */}
                            <div className="mt-auto border-t border-border bg-card/95 p-6 md:p-8">
                                {actionError && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
                                        {actionError}
                                    </div>
                                )}
                                {signingLinkState.error && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
                                        {signingLinkState.error}
                                    </div>
                                )}
                                {signingLinkState.message && (
                                    <div className="mb-4 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        <p>{signingLinkState.message}</p>
                                        {signingLinkState.signingUrl && (
                                            <button
                                                type="button"
                                                onClick={() => navigator.clipboard.writeText(signingLinkState.signingUrl!)}
                                                className="text-[11px] underline underline-offset-2 text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-white"
                                            >
                                                Copy Signing Link
                                            </button>
                                        )}
                                    </div>
                                )}
                                {countersignState.error && (
                                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
                                        {countersignState.error}
                                    </div>
                                )}
                                {countersignState.message && (
                                    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                        {countersignState.message}
                                    </div>
                                )}
                                {selectedApp.status === "pending" || selectedApp.status === "reviewing" ? (
                                    <div className="flex items-center gap-4">
                                        <button
                                            disabled={isUpdatingSelectedApp}
                                            onClick={() => updateApplicationStatus(selectedApp.id, "rejected")}
                                            className={cn(
                                                "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-4 font-black text-red-600 transition-all hover:bg-red-500 hover:text-white focus:ring-4 focus:ring-red-500/20 active:scale-95 dark:text-red-400",
                                                isUpdatingSelectedApp && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <XCircle className="h-5 w-5" />
                                            {isUpdatingSelectedApp ? "Updating..." : "Decline Profile"}
                                        </button>
                                        <button
                                            disabled={isUpdatingSelectedApp}
                                            onClick={() => openApprovalModal(selectedApp)}
                                            className={cn(
                                                "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-black text-primary-foreground transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-primary/90 focus:ring-4 focus:ring-primary/40 active:scale-95",
                                                isUpdatingSelectedApp && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                            {isUpdatingSelectedApp ? "Updating..." : "Request Payments"}
                                        </button>
                                    </div>
                                ) : selectedApp.status === "payment_pending" ? (
                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-xs text-violet-100">
                                            <p className="font-black uppercase tracking-wider">Payment Pending</p>
                                            <p className="mt-1">
                                                Deadline: {formatDate(selectedApp.paymentPendingExpiresAt ?? null)}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {(selectedApp.preApprovalPayments ?? []).map((request) => {
                                                const reviewBusy = reviewingPaymentRequestId === request.id;
                                                const canReview = request.status === "processing";
                                                return (
                                                    <div key={request.id} className="rounded-xl border border-border bg-background/70 p-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-black text-foreground">
                                                                {request.requirementType === "advance_rent"
                                                                    ? "Advance Rent"
                                                                    : "Security Deposit"}{" "}
                                                                - {formatCurrency(request.amount)}
                                                            </p>
                                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                                {request.status.replace("_", " ")}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                            Method: {request.method ?? "not submitted"} | Submitted:{" "}
                                                            {formatDate(request.submittedAt)}
                                                        </p>
                                                        {request.reviewNote && (
                                                            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-300">
                                                                Note: {request.reviewNote}
                                                            </p>
                                                        )}
                                                        {request.proofUrl && (
                                                            <a
                                                                href={request.proofUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-2 inline-block text-[11px] underline text-blue-600 dark:text-blue-300"
                                                            >
                                                                View proof
                                                            </a>
                                                        )}

                                                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                            <button
                                                                type="button"
                                                                disabled={!canReview || reviewBusy}
                                                                onClick={() => void reviewPreApprovalPayment(request.id, "confirm")}
                                                                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-[11px] font-black uppercase tracking-wider text-emerald-700 disabled:opacity-40 dark:text-emerald-300"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canReview || reviewBusy}
                                                                onClick={() => void reviewPreApprovalPayment(request.id, "needs_correction")}
                                                                className="rounded-lg border border-amber-500/30 bg-amber-500/10 py-2 text-[11px] font-black uppercase tracking-wider text-amber-700 disabled:opacity-40 dark:text-amber-300"
                                                            >
                                                                Needs Fix
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canReview || reviewBusy}
                                                                onClick={() => void reviewPreApprovalPayment(request.id, "reject")}
                                                                className="rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-[11px] font-black uppercase tracking-wider text-red-700 disabled:opacity-40 dark:text-red-300"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="rounded-xl border border-border bg-background/70 p-4 space-y-3">
                                            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                Controlled Bypass
                                            </p>
                                            <input
                                                type="password"
                                                value={bypassPassword}
                                                onChange={(event) => setBypassPassword(event.target.value)}
                                                placeholder="Re-enter landlord password"
                                                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm"
                                            />
                                            <textarea
                                                value={bypassReason}
                                                onChange={(event) => setBypassReason(event.target.value)}
                                                rows={2}
                                                placeholder="Reason for bypass (required)"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                            />
                                            <button
                                                type="button"
                                                disabled={bypassingPayments}
                                                onClick={() => void runPaymentBypass()}
                                                className="w-full rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-amber-700 disabled:opacity-60 dark:text-amber-300"
                                            >
                                                {bypassingPayments ? "Bypassing..." : "Apply Bypass"}
                                            </button>
                                        </div>

                                        <button
                                            disabled={isUpdatingSelectedApp || !selectedAppPaymentsReady}
                                            onClick={() => openApprovalModal(selectedApp)}
                                            className={cn(
                                                "w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95",
                                                (isUpdatingSelectedApp || !selectedAppPaymentsReady) && "opacity-60 cursor-not-allowed"
                                            )}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                            Final Approve
                                        </button>
                                        {!selectedAppPaymentsReady && (
                                            <p className="text-[11px] text-amber-300">
                                                Final approval unlocks only after both advance and security requests are confirmed
                                                or bypassed.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex w-full items-center justify-center rounded-2xl border border-border bg-background/70 p-4">
                                            <span className={cn(
                                                "text-sm font-black flex items-center gap-2",
                                                selectedApp.status === "approved"
                                                    ? "text-emerald-500"
                                                    : selectedApp.status === "withdrawn"
                                                    ? "text-slate-600 dark:text-neutral-300"
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
                                            <div className="space-y-3">
                                                <button
                                                    disabled={sendingCredentials}
                                                    onClick={() => handleSendCredentials(selectedApp.id)}
                                                    className={cn(
                                                        "w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-black text-sm transition-all active:scale-95",
                                                        "bg-blue-500/10 border-blue-500/20 text-blue-700 hover:bg-blue-500/20 hover:border-blue-500/40 dark:text-blue-400",
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

                                                {selectedApp.lease && (
                                                    <div className="space-y-3 rounded-2xl border border-border bg-background/70 p-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lease Signing Status</p>
                                                            <LeaseStatusBadge status={selectedApp.lease.status} />
                                                        </div>

                                                        {selectedApp.lease.signing_mode === "remote" && (
                                                            <div className="space-y-2">
                                                                {selectedApp.lease.status === "pending_signature" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGenerateSigningLink(selectedApp.id)}
                                                                        disabled={signingLinkState.loading}
                                                                        className="w-full rounded-xl border border-purple-500/30 bg-purple-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-purple-700 hover:bg-purple-500/20 disabled:opacity-60 dark:text-purple-300"
                                                                    >
                                                                        {signingLinkState.loading ? "Generating..." : "Send Signing Link"}
                                                                    </button>
                                                                )}

                                                                {(selectedApp.lease.status === "pending_tenant_signature" || selectedApp.lease.status === "pending_signature") && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRegenerateSigningLink(selectedApp.id)}
                                                                        disabled={signingLinkState.loading}
                                                                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-blue-700 hover:bg-blue-500/20 disabled:opacity-60 dark:text-blue-300"
                                                                    >
                                                                        {signingLinkState.loading ? "Regenerating..." : "Resend Signing Link"}
                                                                    </button>
                                                                )}

                                                                {selectedApp.lease.signing_link_expires_at && (
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Link expires on {formatDate(selectedApp.lease.signing_link_expires_at)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {selectedApp.lease.tenant_signature && (
                                                            <div className="space-y-2">
                                                                <p className="text-[11px] text-muted-foreground">Tenant signature captured</p>
                                                                <img
                                                                    src={selectedApp.lease.tenant_signature}
                                                                    alt="Tenant signature"
                                                                    className="w-full max-h-24 rounded-lg border border-border bg-muted/40 object-contain"
                                                                />
                                                                {selectedApp.lease.tenant_signed_at && (
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Signed at {formatDate(selectedApp.lease.tenant_signed_at)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {selectedApp.lease.status === "pending_landlord_signature" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowCountersignModal(true)}
                                                                disabled={countersignState.loading}
                                                                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-300"
                                                            >
                                                                {countersignState.loading ? "Countersigning..." : "Countersign Lease"}
                                                            </button>
                                                        )}

                                                        <LeaseAuditTrail events={selectedApp.leaseAuditEvents ?? []} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Tenant Application Modal */}
            <WalkInApplicationModal
                isOpen={showTenantApplicationModal}
                onClose={() => setShowTenantApplicationModal(false)}
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
                onSuccess={(result) => {
                    setReloadKey((k) => k + 1);
                    setShowContractModal(false);
                    setContractData(null);
                    if (result?.tenant_account?.email) {
                        setTenantCredentials({
                            email: result.tenant_account.email,
                            tempPassword: result.tenant_account.tempPassword ?? null,
                            inviteUrl: result.tenant_account.inviteUrl ?? null,
                            accountExisted: false,
                        });
                    }
                }}
            />

            <AnimatePresence>
                {previewUrl && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewUrl(null)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-[210] flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 backdrop-blur-md">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Document Inspection
                                    </div>
                                    <h3 className="text-xl font-black tracking-tighter text-white">
                                        {formatDocumentLabel(previewUrl)}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a 
                                        href={previewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hidden md:flex h-12 items-center gap-2 rounded-xl bg-white/10 px-6 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20 active:scale-95"
                                    >
                                        <Plus className="w-4 h-4 rotate-45" /> Open in New Tab
                                    </a>
                                    <button
                                        onClick={() => setPreviewUrl(null)}
                                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="relative flex-1 bg-neutral-900/50 p-2 md:p-6 overflow-hidden">
                                {documentLoading && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card">
                                        <div className="w-1/2 aspect-[3/4] max-h-[70%] rounded-2xl bg-neutral-800 animate-pulse flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
                                        </div>
                                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Retrieving Document...</p>
                                    </div>
                                )}
                                
                                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                                    <iframe 
                                        src={`${previewUrl}#toolbar=0`} 
                                        className={cn(
                                            "h-full w-full rounded-2xl border-0 bg-white transition-opacity duration-500",
                                            documentLoading ? "opacity-0" : "opacity-100"
                                        )}
                                        onLoad={() => setDocumentLoading(false)}
                                        title="Document Preview"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center overflow-auto custom-scrollbar">
                                        <img 
                                            src={previewUrl} 
                                            alt="Document Preview" 
                                            onLoad={() => setDocumentLoading(false)}
                                            className={cn(
                                                "max-h-full max-w-full rounded-xl object-contain shadow-2xl transition-all duration-700",
                                                documentLoading ? "opacity-0 scale-95 blur-xl" : "opacity-100 scale-100 blur-0"
                                            )}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Tenant Credentials Modal */}
            <AnimatePresence>
                {tenantCredentials && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTenantCredentials(null)}
                            className="fixed inset-0 z-[130] h-screen w-screen bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[140] flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-500/20 bg-card/98 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
                                <div className="flex items-center justify-between border-b border-border p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-foreground">
                                                {tenantCredentials.accountExisted ? "Credentials Resent" : "Tenant Account Created"}
                                            </h3>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credentials for landlord records</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setTenantCredentials(null)}
                                        className="rounded-lg bg-background p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                                        {tenantCredentials.accountExisted
                                            ? "This tenant already has an account. A fresh password reset link has been generated and an invite email sent."
                                            : "A tenant account has been provisioned and an invite email sent to the applicant. Keep these credentials as a backup in case the tenant did not receive their email."}
                                    </p>
                                    <div className="space-y-3">
                                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                                            <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</span>
                                            <span className="font-mono text-sm font-bold text-foreground">{tenantCredentials.email}</span>
                                        </div>
                                        {tenantCredentials.tempPassword && (
                                            <div className="rounded-2xl border border-border bg-background/70 p-4">
                                                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temporary Password</span>
                                                <span className="text-sm font-bold text-emerald-400 font-mono tracking-widest">{tenantCredentials.tempPassword}</span>
                                            </div>
                                        )}
                                        {tenantCredentials.inviteUrl && (
                                            <div className="rounded-2xl border border-border bg-background/70 p-4">
                                                <span className="mb-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password Reset Link</span>
                                                <a
                                                    href={tenantCredentials.inviteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-all text-xs font-bold text-blue-700 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    {tenantCredentials.inviteUrl}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                                            The tenant has been sent an invite email to set their own password. Share these credentials only if they did not receive it.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setTenantCredentials(null)}
                                        className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-black text-black transition-colors hover:bg-emerald-400 active:scale-95"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Countersign Lease Modal */}
            <AnimatePresence>
                {showCountersignModal && selectedApp?.lease && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
                            onClick={() => {
                                if (countersignState.loading) return;
                                setShowCountersignModal(false);
                                setPendingCountersignature(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            className="fixed inset-0 z-[160] flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-2xl space-y-4 rounded-3xl border border-border bg-card/98 p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-foreground">Countersign Lease</h3>
                                    <button
                                        type="button"
                                        className="rounded-full bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={() => {
                                            if (countersignState.loading) return;
                                            setShowCountersignModal(false);
                                            setPendingCountersignature(null);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {selectedApp.lease.tenant_signature && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant Signature</p>
                                        <img
                                            src={selectedApp.lease.tenant_signature}
                                            alt="Tenant signature"
                                            className="w-full max-h-24 rounded-lg border border-border bg-muted/40 object-contain"
                                        />
                                        {selectedApp.lease.tenant_signed_at && (
                                            <p className="text-[11px] text-muted-foreground">
                                                Signed at {formatDate(selectedApp.lease.tenant_signed_at)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Landlord Signature</p>
                                    <SignaturePad
                                        onSave={(dataUrl) => setPendingCountersignature(dataUrl)}
                                        onClear={() => setPendingCountersignature(null)}
                                        width={800}
                                        height={180}
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={countersignState.loading || !pendingCountersignature}
                                    onClick={() => handleCountersignLease(selectedApp.lease!.id, pendingCountersignature!)}
                                    className="w-full py-3 rounded-xl bg-emerald-500 text-black font-black text-sm uppercase tracking-wider hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {countersignState.loading ? "Submitting..." : "Confirm Countersignature"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Invite Manager Modal */}
            <AnimatePresence>
                {showInviteTools && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInviteTools(false)}
                            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[130] flex items-center justify-center p-4 py-8"
                        >
                            <div className="relative h-full max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2.5rem] border border-white/10 bg-background custom-scrollbar shadow-2xl">
                                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-8 py-6 backdrop-blur-md">
                                    <div>
                                        <h3 className="text-xl font-black tracking-tighter text-foreground px-1">Invite Manager</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Generate and manage intake links</p>
                                    </div>
                                    <button
                                        onClick={() => setShowInviteTools(false)}
                                        className="rounded-xl bg-background p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="p-4 md:p-8">
                                    <TenantInviteManager
                                        availableUnits={availableUnits}
                                        invites={tenantInvites}
                                        onRefresh={() => {
                                            void loadInvites();
                                        }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

