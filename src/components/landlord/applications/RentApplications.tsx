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
    Eye,
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
    ClipboardList,
    Loader2,
    Pencil,
    Wallet,
} from "lucide-react";
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
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
    pending: {
        label: "Pending Review",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        icon: Clock,
    },
    reviewing: {
        label: "Under Review",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        icon: Eye,
    },
    payment_pending: {
        label: "Payment Pending",
        color: "text-violet-700 dark:text-violet-300",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/20",
        icon: Wallet,
    },
    approved: {
        label: "Approved",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        icon: CheckCircle2,
    },
    rejected: {
        label: "Rejected",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
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
                setApplications(Array.isArray(payload.applications) ? payload.applications : []);
                setDataFetched(true);
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load applications right now.");
                setApplications([]);
            } finally {
                // Ensure skeleton shows for minimum 400ms for smooth UX
                const elapsed = Date.now() - startTime;
                const minLoadingTime = 400;
                if (elapsed < minLoadingTime) {
                    setTimeout(() => setLoading(false), minLoadingTime - elapsed);
                } else {
                    setLoading(false);
                }
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
        { label: "Payment Pending", value: "payment_pending", count: stats.payment_pending },
        { label: "Approved", value: "approved", count: stats.approved },
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
                <button
                    onClick={() => setShowTenantApplicationModal(true)}
                    className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 py-3 text-sm font-black tracking-tight text-primary-foreground shadow-[0_14px_32px_-20px_rgba(var(--primary-rgb),0.65)] transition-all hover:scale-[1.02] hover:bg-primary/90 active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <Plus className="h-5 w-5 relative z-10" />
                    <span className="relative z-10">New Application</span>
                </button>
            </div>

            <TenantInviteManager
                availableUnits={availableUnits}
                invites={tenantInvites}
                onRefresh={() => {
                    void loadInvites();
                }}
            />

            {/* KPI Stats Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowKpiCards(!showKpiCards)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                    {showKpiCards ? "Hide" : "Show"} Stats
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

                {/* Advanced Command Toolbar */}
                <div className="sticky top-0 z-30 flex flex-col items-start justify-between gap-4 rounded-t-3xl border-b border-border bg-card/90 p-6 backdrop-blur-xl sm:flex-row sm:items-center">
                    <div className="no-scrollbar flex w-full overflow-x-auto rounded-xl border border-border bg-background p-1.5 sm:w-auto">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveFilter(tab.value)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                    activeFilter === tab.value
                                        ? "border border-border bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                )}
                            >
                                {tab.label}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-black leading-none",
                                    activeFilter === tab.value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <input
                                type="text"
                                placeholder="Search applicant, property..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <button className="rounded-xl border border-border bg-background p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
                            <Filter className="w-5 h-5" />
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
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="mb-1 truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
                                                                {app.applicant.name}
                                                            </h3>
                                                            <p className="flex items-center gap-1.5 truncate text-xs font-medium text-muted-foreground">
                                                                <Briefcase className="w-3 h-3 shrink-0" />
                                                                {app.applicant.occupation || "Not provided"}
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

                                                    {/* Credit Score */}
                                                    <div className="hidden min-w-[100px] flex-col items-center rounded-xl border border-border bg-muted/20 px-4 py-2 xl:flex">
                                                        <span className="mb-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Credit</span>
                                                        <span className={cn("text-xl font-black leading-none", getCreditScoreColor(app.applicant.creditScore))}>
                                                            {app.applicant.creditScore ?? "N/A"}
                                                        </span>
                                                        <span className="mt-1 text-[9px] font-bold text-muted-foreground">
                                                            {getCreditScoreLabel(app.applicant.creditScore)}
                                                        </span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex items-center gap-3 min-w-[140px]">
                                                        <span className={cn(
                                                            "px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-sm",
                                                            statusConfig.bgColor,
                                                            statusConfig.borderColor,
                                                            statusConfig.color,
                                                            app.status === "pending" ? "border-amber-400 bg-amber-500 text-black" :
                                                                app.status === "approved" ? "border-emerald-400/50 bg-emerald-500/90 text-black" :
                                                                    app.status === "withdrawn" ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-neutral-200" : ""
                                                        )}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-black text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Review</span>
                                                    </button>
                                                </div>

                                                {/* Hover Indicator */}
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                                                </div>
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
                            className="fixed right-0 top-0 z-[120] flex h-screen w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-card/98 shadow-2xl custom-scrollbar"
                        >
                            {/* Panel Header */}
                            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/92 px-6 py-4 shadow-sm backdrop-blur-3xl">
                                <div className="flex items-center gap-3">
                                    <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs font-bold text-muted-foreground">{selectedApp.id}</span>
                                    <h2 className="text-lg font-black tracking-tight text-foreground">Application Dossier</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => openEdit(selectedApp)}
                                            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-black text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={cancelEdit}
                                                disabled={savingEdit}
                                                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-black text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                disabled={savingEdit}
                                                className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                                            >
                                                {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                {savingEdit ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    )}
                                        <button
                                            onClick={() => { setSelectedApp(null); setActionError(null); cancelEdit(); }}
                                            className="rounded-full border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                                        >
                                        <X className="h-4 w-4" />
                                    </button>
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
                                                    <span className="ml-3 inline-flex rounded-lg border border-blue-400/20 bg-blue-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
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
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requirements Roadmap</h4>
                                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 tracking-widest">MANDATORY</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { key: 'valid_id', label: '1. Valid Identification', desc: 'Any govt-issued ID (Name match is mandatory)' },
                                            { key: 'proof_of_income', label: '2. Source of Income', desc: 'COE, Payslip, or Contract Verification' },
                                            { key: 'application_form', label: '3. Completed App Form', desc: 'Employment & Emergency Contact Details' },
                                            { key: 'move_in_payment', label: '4. Move-in Payments', desc: 'Advance + security deposit invoices must be landlord-confirmed' },
                                        ].map((req) => {
                                            const checklist = selectedApp.complianceChecklist as Record<string, boolean> | null | undefined;
                                            const isDone = checklist?.[req.key] === true;
                                            return (
                                                <div key={req.key} className={cn(
                                                    "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 group",
                                                    isDone ? "bg-emerald-500/5 border-emerald-500/20" : "bg-background border-border opacity-60"
                                                )}>
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                                                        isDone ? "bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-card border-border text-muted-foreground"
                                                    )}>
                                                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Shield className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-xs font-black tracking-tight", isDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>{req.label}</p>
                                                        <p className="mt-0.5 text-[10px] font-bold leading-tight text-slate-500 dark:text-neutral-600">{req.desc}</p>
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedApp.documents.length === 0 ? (
                                            <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs font-semibold text-muted-foreground">
                                                No documents uploaded.
                                            </div>
                                        ) : (
                                            selectedApp.documents.map((doc) => (
                                                <div
                                                    key={doc}
                                                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background/70 p-3 shadow-sm transition-all hover:border-primary/50 hover:bg-card"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="shrink-0 rounded-xl border border-border bg-card p-2 transition-colors group-hover:border-primary/30">
                                                            <FileText className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                                                        </div>
                                                        <span className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
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
        </div>
    );
}

