"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
    Calendar,
    Banknote,
    Mail,
    Phone,
    Briefcase,
    ArrowRight,
    X,
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
import dynamic from "next/dynamic";

const WalkInApplicationModal = dynamic(() => import("@/components/landlord/applications/WalkInApplicationModal").then(mod => mod.WalkInApplicationModal), {
    ssr: false,
});

import { TenantInviteManager } from "@/components/landlord/applications/TenantInviteManager";
import { ContractPreviewModal } from "@/components/landlord/lease/ContractPreviewModal";
import { LeaseStatusBadge } from "@/components/landlord/leases/LeaseStatusBadge";
import { LeaseAuditTrail, type LeaseAuditEvent } from "@/components/landlord/leases/LeaseAuditTrail";
import type { LeaseStatus } from "@/types/database";
const SignaturePad = dynamic(() => import("./SignaturePad").then(mod => mod.SignaturePad), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full bg-muted/50 rounded-2xl animate-pulse flex items-center justify-center text-xs font-black uppercase tracking-widest text-muted-foreground">Loading Signer...</div>
});
import { useProperty } from "@/context/PropertyContext";
import { generateLeasePdf } from "@/lib/lease-pdf";

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
    avatar?: string | null;
    avatarBgColor?: string | null;
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

// ─── Status Config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
    pending: {
        label: "Pending Review",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/20",
        icon: Clock,
    },
    reviewing: {
        label: "Under Review",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
        icon: Eye,
    },
    payment_pending: {
        label: "Payment Pending",
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-500/20",
        icon: Wallet,
    },
    approved: {
        label: "Approved",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        icon: CheckCircle2,
    },
    rejected: {
        label: "Rejected",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        icon: XCircle,
    },
    withdrawn: {
        label: "Withdrawn",
        color: "text-slate-500",
        bgColor: "bg-slate-500/10",
        borderColor: "border-slate-500/20",
        icon: AlertCircle,
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────
const FALLBACK_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

const formatCurrency = (value: number | null) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "Not provided";
    return `₱${value.toLocaleString()}`;
};

const formatDate = (value: string | null) => {
    if (!value) return "Not specified";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not specified";
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDocumentLabel = (value: string) => {
    if (!value) return "Document";
    const trimmed = value.trim();
    const lastSlash = trimmed.lastIndexOf("/");
    const fileName = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
    try { return decodeURIComponent(fileName || trimmed); } catch { return fileName || trimmed; }
};

const formatRatio = (income: number | null, rent: number | null) => {
    if (typeof income !== "number" || !Number.isFinite(income)) return "N/A";
    if (typeof rent !== "number" || !Number.isFinite(rent) || rent <= 0) return "N/A";
    return `${(income / rent).toFixed(1)}x`;
};

const calculateApplicationProgress = (app: RentApplication) => {
    const items = [
        { label: "Full legal name", done: !!app.applicant.name },
        { label: "Valid email address", done: !!app.applicant.email },
        { label: "Contact phone number", done: !!app.applicant.phone },
        { label: "Current occupation", done: !!app.applicant.occupation },
        { label: "Monthly income disclosure", done: !!(app.applicant.monthlyIncome && app.applicant.monthlyIncome > 0) },
        { label: "Identity Verification", done: !!app.complianceChecklist?.valid_id },
        { label: "Proof of Income Check", done: !!app.complianceChecklist?.income_verified },
        { label: "Lease Execution", done: !!(app.lease?.tenant_signature || app.lease?.status === 'active' || app.status === 'approved') },
    ];
    
    const completed = items.filter(s => s.done).length;
    const total = items.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { percentage, missing: items.filter(s => !s.done).map(i => i.label) };
};

const resolveImage = (value: string | null | undefined) => value?.trim() ? value : FALLBACK_PROPERTY_IMAGE;



// ─── Sub-Components ──────────────────────────────────────────────────

function ApplicationsSkeletonList() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 w-full animate-pulse rounded-3xl border border-border bg-card/50" />
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────

export function RentApplications() {
    const { selectedPropertyId } = useProperty();
    const [mounted, setMounted] = useState(false);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilterState] = useState<ApplicationStatus | "all">("all");
    const [filterLoading, setFilterLoading] = useState(false);

    const setActiveFilter = (filter: ApplicationStatus | "all") => {
        if (filter !== activeFilter) {
            setFilterLoading(true);
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
    }>({ loading: false, message: null, error: null, signingUrl: null });
    const [countersignState, setCountersignState] = useState<{
        loading: boolean;
        error: string | null;
        message: string | null;
    }>({ loading: false, error: null, message: null });
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
    const [leasePdfBlob, setLeasePdfBlob] = useState<Blob | null>(null);

    // Generate PDF for countersigning
    useEffect(() => {
        const generate = async () => {
            if (!selectedApp || !selectedApp.lease) {
                setLeasePdfBlob(null);
                return;
            }

            try {
                // Recreate the PDF. In a real app, we'd fetch the existing PDF.
                const blob = await generateLeasePdf({
                    id: selectedApp.lease.id,
                    tenant: {
                        name: selectedApp.applicant.name,
                        email: selectedApp.applicant.email,
                    },
                    landlord: {
                        name: "Property Management",
                        email: "mgmt@ireside.com",
                    },
                    property: {
                        name: selectedApp.propertyName,
                        address: "Property Address",
                    },
                    unit: {
                        name: selectedApp.unitNumber,
                    },
                    startDate: "2024-05-01", // Placeholder
                    endDate: "2025-05-01", // Placeholder
                    monthlyRent: selectedApp.monthlyRent || 0,
                    securityDeposit: (selectedApp.monthlyRent || 0) * 2, // Placeholder
                });
                setLeasePdfBlob(blob);
            } catch (err) {
                console.error("PDF generation failed:", err);
            }
        };

        generate();
    }, [selectedApp]);

    useEffect(() => { if (previewUrl) setDocumentLoading(true); }, [previewUrl]);

    useEffect(() => {
        setBypassReason("");
        setBypassPassword("");
        setReviewingPaymentRequestId(null);
    }, [selectedApp?.id]);

    useEffect(() => {
        setMounted(true);
        setLoading(true);
        const action = searchParams?.get("action");
        if (action === "tenant-application" || action === "walk-in") {
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
                const params = new URLSearchParams({ propertyId: selectedPropertyId });
                const response = await fetch(`/api/landlord/applications?${params.toString()}`, {
                    method: "GET",
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error("Failed to load applications");
                const payload = (await response.json()) as { applications?: RentApplication[] };
                if (!controller.signal.aborted) {
                    const fetchedApps = Array.isArray(payload.applications) ? payload.applications : [];
                    setApplications(fetchedApps);
                    setDataFetched(true);

                    // Handle deep linking via ?id=
                    const deepLinkId = searchParams?.get("id");
                    if (deepLinkId) {
                        const targetApp = fetchedApps.find(a => a.id === deepLinkId);
                        if (targetApp) {
                            setSelectedApp(targetApp);
                        }
                    }
                }
            } catch (fetchError) {
                if ((fetchError as Error).name !== "AbortError" && !controller.signal.aborted) {
                    setError("Unable to load applications right now.");
                    setApplications([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    const elapsed = Date.now() - startTime;
                    const minTime = 400;
                    setTimeout(() => setLoading(false), Math.max(0, minTime - elapsed));
                }
            }
        };

        loadApplications();
        return () => controller.abort();
    }, [reloadKey, selectedPropertyId]);

    const toggleRequirement = async (applicationId: string, currentChecklist: Record<string, boolean>, key: string) => {
        const updatedChecklist = { ...currentChecklist, [key]: !currentChecklist[key] };
        const updateStates = (checklist: Record<string, boolean>) => {
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, complianceChecklist: checklist as RentApplication['complianceChecklist'] } : a));
            if (selectedApp?.id === applicationId) {
                setSelectedApp(prev => prev ? { ...prev, complianceChecklist: checklist as RentApplication['complianceChecklist'] } : null);
            }
        };
        updateStates(updatedChecklist);
        try {
            const res = await fetch("/api/landlord/applications/tenant-application", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ application_id: applicationId, requirements_checklist: updatedChecklist })
            });
            if (!res.ok) throw new Error("Failed update");
        } catch {
            updateStates(currentChecklist);
            setActionError("Failed to sync requirement status.");
        }
    };

    useEffect(() => {
        const loadUnits = async () => {
            try {
                const res = await fetch("/api/landlord/listings");
                if (!res.ok) return;
                const data = (await res.json()) as any;
                const options = Array.isArray(data.options) ? data.options : [];
                const unitsList = options.flatMap((property: any) => {
                    const units = Array.isArray(property.units) ? property.units : [];
                    return units.map((unit: any) => ({
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
            } catch {}
        };
        loadUnits();
    }, []);

    const loadInvites = useCallback(async () => {
        try {
            const response = await fetch("/api/landlord/invites");
            if (!response.ok) return;
            const payload = (await response.json()) as { invites?: typeof tenantInvites };
            setTenantInvites(Array.isArray(payload.invites) ? payload.invites : []);
        } catch {}
    }, []);

    useEffect(() => { void loadInvites(); }, [loadInvites]);

    const [tenantCredentials, setTenantCredentials] = useState<{
        email: string;
        tempPassword: string | null;
        inviteUrl?: string | null;
        accountExisted?: boolean;
    } | null>(null);
    const [sendingCredentials, setSendingCredentials] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editDraft, setEditDraft] = useState<{
        applicant_name: string; applicant_email: string; applicant_phone: string;
        emergency_contact_name: string; emergency_contact_phone: string;
        move_in_date: string; occupation: string; employer: string;
        monthly_income: string; message: string;
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
        setIsEditing(true);
    };

    const cancelEdit = () => { setIsEditing(false); setEditDraft(null); setEditError(null); };

    const saveEdit = async () => {
        if (!selectedApp || !editDraft) return;
        setSavingEdit(true);
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
                    employment_info: {
                        occupation: editDraft.occupation,
                        employer: editDraft.employer,
                        monthly_income: Number(editDraft.monthly_income),
                    },
                }),
            });
            if (!res.ok) throw new Error("Failed save");
            setReloadKey(k => k + 1);
            setIsEditing(false);
        } catch { setEditError("Failed to save changes."); } finally { setSavingEdit(false); }
    };

    const handleSendCredentials = async (appId: string) => {
        setSendingCredentials(true);
        try {
            const res = await fetch(`/api/landlord/applications/${appId}/resend-credentials`, { method: "POST" });
            const data = await res.json() as any;
            if (!res.ok) throw new Error("Failed send");
            setTenantCredentials(data);
        } catch { setActionError("Failed to send credentials."); } finally { setSendingCredentials(false); }
    };

    const updateApplicationStatus = async (applicationId: string, status: "rejected" | "reviewing") => {
        setActionError(null);
        setUpdatingStatusId(applicationId);
        try {
            const response = await fetch(`/api/landlord/applications/${applicationId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error("Failed update");
            setReloadKey(k => k + 1);
        } catch { setActionError("Unable to update application status."); } finally { setUpdatingStatusId(null); }
    };

    const handleQuickApprove = async () => {
        if (!selectedApp) return;
        setActionError(null);
        setUpdatingStatusId(selectedApp.id);
        try {
            const response = await fetch(`/api/landlord/applications/${selectedApp.id}/quick-approve`, {
                method: "POST",
            });
            const data = await response.json() as any;
            if (!response.ok) throw new Error(data.error || "Failed to quick approve");
            
            setTenantCredentials({
                email: data.tenant_account?.email || selectedApp.applicant.email,
                tempPassword: data.tenant_account?.tempPassword || null,
                inviteUrl: data.tenant_account?.inviteUrl,
            });
            setReloadKey(k => k + 1);
            
            setShowContractModal(false);
            setSelectedApp(null);
            alert(`Approved! Credentials:\nEmail: ${data.tenant_account?.email}\nTemp Password: ${data.tenant_account?.tempPassword}\n\nShare these with the tenant securely.`);
        } catch { setActionError("Quick approve failed."); } finally { setUpdatingStatusId(null); }
    };

    const openApprovalModal = (application: RentApplication) => {
        const monthlyRent = Number(application.monthlyRent ?? 0);
        if (application.status !== "payment_pending" && (!Number.isFinite(monthlyRent) || monthlyRent <= 0)) {
            setActionError("Valid monthly rent required. Update unit rent first.");
            return;
        }
        setContractData({
            application_id: application.id,
            unit_name: application.unitNumber,
            property_name: application.propertyName,
            property_contract_template: application.propertyContractTemplate ?? null,
            applicant_name: application.applicant.name,
            applicant_email: application.applicant.email,
            requested_move_in: application.requestedMoveIn,
            monthly_rent: monthlyRent,
            application_status: application.status,
        });
        setShowContractModal(true);
    };

    const reviewPreApprovalPayment = async (requestId: string, action: PaymentReviewAction) => {
        if (!selectedApp) return;
        setReviewingPaymentRequestId(requestId);
        try {
            const response = await fetch(`/api/landlord/applications/${selectedApp.id}/payment-requests/${requestId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!response.ok) throw new Error("Failed review");
            setReloadKey(k => k + 1);
        } catch { setActionError("Failed to review payment request."); } finally { setReviewingPaymentRequestId(null); }
    };

    const runPaymentBypass = async () => {
        if (!selectedApp || !bypassPassword.trim() || !bypassReason.trim()) {
            setActionError("Password and reason required.");
            return;
        }
        setBypassingPayments(true);
        try {
            const response = await fetch(`/api/landlord/applications/${selectedApp.id}/payment-bypass`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: bypassPassword, reason: bypassReason }),
            });
            if (!response.ok) throw new Error("Failed bypass");
            setReloadKey(k => k + 1);
        } catch { setActionError("Failed to run bypass."); } finally { setBypassingPayments(false); }
    };

    const handleGenerateSigningLink = async (applicationId: string) => {
        setSigningLinkState({ loading: true, message: null, error: null, signingUrl: null });
        try {
            const response = await fetch(`/api/landlord/applications/${applicationId}/signing-link`, { method: "POST" });
            const data = await response.json() as any;
            if (!response.ok) throw new Error(data.error || "Failed link gen");
            setSigningLinkState({ loading: false, message: "Link generated.", error: null, signingUrl: data.signing_url });
            setReloadKey(k => k + 1);
        } catch (err: any) { setSigningLinkState({ loading: false, message: null, error: err.message, signingUrl: null }); }
    };

    const handleCountersignLease = async (leaseId: string, landlordSignature: string) => {
        setCountersignState({ loading: true, error: null, message: null });
        try {
            const response = await fetch(`/api/landlord/leases/${leaseId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ landlord_signature: landlordSignature }),
            });
            if (!response.ok) throw new Error("Failed countersign");
            setCountersignState({ loading: false, error: null, message: "Lease signed." });
            setShowCountersignModal(false);
            setReloadKey(k => k + 1);
        } catch (err: any) { setCountersignState({ loading: false, error: err.message, message: null }); }
    };

    const scopedApplications = useMemo(() => selectedPropertyId === "all" ? applications : applications.filter(a => a.propertyId === selectedPropertyId), [applications, selectedPropertyId]);
    const scopedAvailableUnits = useMemo(() => selectedPropertyId === "all" ? availableUnits : availableUnits.filter(u => u.property_id === selectedPropertyId), [availableUnits, selectedPropertyId]);
    const scopedTenantInvites = useMemo(() => selectedPropertyId === "all" ? tenantInvites : tenantInvites.filter(i => i.propertyId === selectedPropertyId), [tenantInvites, selectedPropertyId]);

    const filteredApplications = scopedApplications.filter(app => {
        const matchesSearch = app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) || app.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === "all" || app.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: scopedApplications.length,
        pending: scopedApplications.filter(a => a.status === "pending").length,
        reviewing: scopedApplications.filter(a => a.status === "reviewing").length,
        approved: scopedApplications.filter(a => a.status === "approved").length,
        rejected: scopedApplications.filter(a => a.status === "rejected").length,
    };

    const filterTabs = [
        { label: "All", value: "all", count: stats.total },
        { label: "Pending", value: "pending", count: stats.pending },
        { label: "Reviewing", value: "reviewing", count: stats.reviewing },
        { label: "Approved", value: "approved", count: stats.approved },
    ];

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-8 px-6 py-10 md:px-10">
            {/* ─── Page Header ─────────────────────────────────────────── */}
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        Applications
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">
                        Manage prospective tenants and review residency profiles.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowInviteTools(true)}
                        className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-5 text-xs font-black uppercase tracking-widest text-foreground transition-all hover:border-primary/30 hover:bg-muted active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Invite Manager
                    </button>
                    <button
                        onClick={() => setShowTenantApplicationModal(true)}
                        className="flex h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                    >
                        <QrCode className="h-4 w-4" />
                        Walk-in Intake
                    </button>
                </div>
            </div>


            {/* ─── Main Application Container ────────────────────────────── */}
            <div className="flex flex-col rounded-[2.5rem] border border-border bg-card/50 shadow-sm overflow-hidden">
                {/* ─── Command Toolbar ─────────────────────────────────────── */}
                <div className="flex flex-col items-center justify-between gap-4 border-b border-border bg-card/80 p-4 md:p-6 backdrop-blur-xl xl:flex-row">
                    <div className="flex items-center gap-1 rounded-2xl border border-border bg-background/50 p-1">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveFilter(tab.value as any)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeFilter === tab.value
                                        ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                            >
                                {tab.label}
                                <span className={cn(
                                    "rounded-lg px-1.5 py-0.5 text-[9px]",
                                    activeFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex w-full items-center gap-3 xl:w-auto">
                        <div className="relative flex-1 xl:w-80">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search applications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-2xl border border-border bg-background/50 pl-10 pr-4 text-xs font-bold text-foreground focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <button className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-background px-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Advanced</span>
                        </button>
                    </div>
                </div>

                {/* ─── List Content ────────────────────────────────────────── */}
                <div className="p-6">
                    {loading || filterLoading ? (
                        <ApplicationsSkeletonList />
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-red-500/50 mb-4" />
                            <p className="text-sm font-black text-foreground">{error}</p>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-black text-foreground">No Applications Found</h3>
                            <p className="text-sm font-medium text-muted-foreground max-w-xs mt-2">
                                We couldn&apos;t find any applications matching your current criteria.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {filteredApplications.map((app, idx) => {
                                    const config = STATUS_CONFIG[app.status];
                                    return (
                                        <motion.div
                                            key={app.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => setSelectedApp(app)}
                                            className="group relative flex cursor-pointer items-center overflow-hidden rounded-3xl border border-border bg-background/50 p-3 transition-all hover:border-primary/20 hover:bg-card hover:shadow-lg active:scale-[0.99]"
                                        >
                                            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted">
                                                <img src={resolveImage(app.propertyImage)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <span className="absolute bottom-2 left-2 text-[10px] font-black text-white">{app.unitNumber}</span>
                                            </div>

                                            <div className="grid flex-1 grid-cols-1 items-center gap-6 px-6 lg:grid-cols-[1fr_120px_180px] xl:grid-cols-[1fr_120px_120px_180px]">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="h-12 w-12 shrink-0 rounded-full border-2 border-border bg-muted flex items-center justify-center font-black text-muted-foreground" style={{ backgroundColor: app.applicant.avatarBgColor || "" }}>
                                                        {app.applicant.avatar ? <img src={app.applicant.avatar} className="h-full w-full object-cover" /> : app.applicant.name[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-lg font-black tracking-tight text-foreground">{app.applicant.name}</h3>
                                                        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
                                                            <Briefcase className="h-3 w-3 shrink-0" />
                                                            {app.applicant.occupation || "Unspecified"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="hidden lg:flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rent</span>
                                                    <span className="text-sm font-black text-foreground">{formatCurrency(app.monthlyRent)}</span>
                                                </div>

                                                <div className="hidden xl:flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Move-in</span>
                                                    <span className="text-sm font-black text-foreground">{formatDate(app.requestedMoveIn)}</span>
                                                </div>

                                                <div className="flex items-center justify-end gap-3">
                                                    <div className={cn(
                                                        "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                                                        config.bgColor, config.borderColor, config.color
                                                    )}>
                                                        <config.icon className="h-3.5 w-3.5" />
                                                        {config.label}
                                                    </div>
                                                    <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-all hover:bg-primary hover:text-white hover:border-primary">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Application Detail Panel ────────────────────────────────── */}
            <AnimatePresence>
                {selectedApp && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedApp(null); cancelEdit(); }} className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md" />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 z-[120] flex h-screen w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-border p-8 bg-card/50 backdrop-blur-xl">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        Application Record
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground">
                                        Dossier <span className="text-muted-foreground/30">Review</span>
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setSelectedApp(null); cancelEdit(); }} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background transition-all hover:bg-muted active:scale-95">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {selectedApp.status !== "approved" && (
                                    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={() => handleQuickApprove()}
                                                disabled={updatingStatusId === selectedApp.id}
                                                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
                                            >
                                                {updatingStatusId === selectedApp.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4" />
                                                )}
                                                Quick Approve
                                            </button>
                                            <button
                                                onClick={() => openApprovalModal(selectedApp)}
                                                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20"
                                            >
                                                <Wallet className="h-4 w-4" />
                                                {selectedApp.status === "payment_pending" ? "Finalize" : "Request Payment"}
                                            </button>
                                        </div>
                                        <p className="mt-3 text-[10px] font-medium text-muted-foreground">
                                            Quick Approve skips payment and directly creates tenant account.
                                        </p>
                                    </div>
                                )}
                                {/* Hero Card */}
                                <div className="relative h-48 w-full overflow-hidden rounded-[2.5rem] border border-border bg-muted shadow-sm">
                                    <img src={resolveImage(selectedApp.propertyImage)} alt="" className="h-full w-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-6 left-8">
                                        <h3 className="text-2xl font-black text-white">{selectedApp.propertyName}</h3>
                                        <span className="mt-1 inline-block rounded-lg bg-primary px-3 py-1 text-xs font-black text-primary-foreground">{selectedApp.unitNumber}</span>
                                    </div>
                                    <div className="absolute bottom-6 right-8 text-right">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Monthly Rent</span>
                                        <p className="text-2xl font-black text-white">{formatCurrency(selectedApp.monthlyRent)}</p>
                                    </div>
                                </div>

                                {/* Application Progress */}
                                {(() => {
                                    const { percentage, missing } = calculateApplicationProgress(selectedApp);
                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Onboarding Progress</h4>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    percentage === 100 ? "text-emerald-500" : "text-primary"
                                                )}>
                                                    {percentage}% Complete
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border/50">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        percentage === 100 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]"
                                                    )}
                                                />
                                            </div>
                                            {missing.length > 0 && (
                                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-4">
                                                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                                    <div className="space-y-3">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Missing Prerequisites</p>
                                                        <ul className="space-y-1.5">
                                                            {missing.map((item, i) => (
                                                                <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                                                                    <div className="h-1 w-1 rounded-full bg-amber-500/40" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Applicant Profile */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Tenant Profile</h4>
                                    <div className="rounded-[2.5rem] border border-border bg-background/50 p-8 space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className="h-20 w-20 rounded-full border-4 border-border shadow-xl flex items-center justify-center text-3xl font-black text-white" style={{ backgroundColor: selectedApp.applicant.avatarBgColor || "#171717" }}>
                                                {selectedApp.applicant.avatar ? <img src={selectedApp.applicant.avatar} className="h-full w-full object-cover" /> : selectedApp.applicant.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground">{selectedApp.applicant.name}</h3>
                                                <p className="text-sm font-bold text-muted-foreground">{selectedApp.applicant.occupation || "Unspecified Occupation"}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Mail className="h-3 w-3" /> Email
                                                </span>
                                                <p className="text-sm font-black text-foreground">{selectedApp.applicant.email}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Phone className="h-3 w-3" /> Phone
                                                </span>
                                                <p className="text-sm font-black text-foreground">{selectedApp.applicant.phone || "Not provided"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Banknote className="h-3 w-3" /> Income
                                                </span>
                                                <p className="text-sm font-black text-foreground">{formatCurrency(selectedApp.applicant.monthlyIncome)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Clock className="h-3 w-3" /> Application Date
                                                </span>
                                                <p className="text-sm font-black text-foreground">{formatDate(selectedApp.submittedDate)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Calendar className="h-3 w-3" /> Preferred Move-in
                                                </span>
                                                <p className="text-sm font-black text-foreground">{formatDate(selectedApp.requestedMoveIn)}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Filter className="h-3 w-3" /> Intake Source
                                                </span>
                                                <p className="text-sm font-black text-foreground capitalize">
                                                    {selectedApp.source?.replace(/_/g, ' ') || "Online"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compliance Checklist */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Compliance Roadmap</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'valid_id', label: 'Identity Verify' },
                                            { key: 'income_verified', label: 'Income Check' },
                                        ].map((req) => {
                                            const isDone = (selectedApp.complianceChecklist as any)?.[req.key];
                                            return (
                                                <button
                                                    key={req.key}
                                                    onClick={() => toggleRequirement(selectedApp.id, selectedApp.complianceChecklist as any || {}, req.key)}
                                                    className={cn(
                                                        "flex h-14 items-center justify-between rounded-2xl border p-4 transition-all active:scale-95",
                                                        isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-background border-border text-muted-foreground hover:border-primary/30"
                                                    )}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{req.label}</span>
                                                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current opacity-20" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Supporting Files</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedApp.documents.map((doc, i) => (
                                            <button key={i} onClick={() => setPreviewUrl(doc)} className="flex items-center justify-between rounded-2xl border border-border bg-background p-4 hover:border-primary/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <span className="text-[11px] font-black text-foreground">{formatDocumentLabel(doc)}</span>
                                                </div>
                                                <Eye className="h-4 w-4 text-primary" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Lease Agreement (§6.4) */}
                                {selectedApp.status === "approved" && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Lease Agreement</h4>
                                        <div className="rounded-[2.5rem] border border-border bg-background/50 p-6 space-y-6">
                                            {selectedApp.lease ? (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                                                                <FileText className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-foreground">Digital Lease Contract</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {selectedApp.lease.id.slice(0, 8)}...</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <LeaseStatusBadge status={selectedApp.lease.status} />
                                                    </div>

                                                    {(selectedApp.lease.status === 'pending_signature' || selectedApp.lease.status === 'pending_tenant_signature') && (
                                                        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-5 flex items-start gap-4">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600">
                                                                <Clock className="h-4 w-4" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Awaiting Signature</p>
                                                                <p className="text-[11px] font-medium text-amber-600/70 leading-relaxed">
                                                                    The lease has been generated and is ready for the tenant to sign. You can use the button below to send or resend the signing magic link via email.
                                                                </p>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleGenerateSigningLink(selectedApp.id); }} 
                                                                    disabled={signingLinkState.loading}
                                                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-95 disabled:opacity-50"
                                                                >
                                                                    {signingLinkState.loading ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Mail className="h-3.5 w-3.5" />
                                                                    )}
                                                                    {selectedApp.lease.status === "pending_signature" ? "Send Signing Link" : "Resend Signing Link"}
                                                                </button>

                                                                {signingLinkState.message && (
                                                                    <p className="mt-2 text-[10px] font-black uppercase text-emerald-500 animate-pulse">
                                                                        {signingLinkState.message}
                                                                    </p>
                                                                )}
                                                                {signingLinkState.error && (
                                                                    <p className="mt-2 text-[10px] font-black uppercase text-red-500">
                                                                        {signingLinkState.error}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-muted/50 text-muted-foreground/30">
                                                        <FileText className="h-8 w-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-foreground">No Lease Generated</p>
                                                        <p className="text-[11px] font-medium text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                                                            This approved application doesn&apos;t have an active lease record linked. 
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleGenerateSigningLink(selectedApp.id)} 
                                                        disabled={signingLinkState.loading}
                                                        className="rounded-2xl bg-primary px-8 py-3 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {signingLinkState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate & Link Lease"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border bg-card/80 p-8 backdrop-blur-xl">
                                {selectedApp.status === "pending" || selectedApp.status === "reviewing" ? (
                                    <div className="flex gap-4">
                                        <button onClick={() => updateApplicationStatus(selectedApp.id, "rejected")} className="flex-1 rounded-2xl border border-red-500/20 bg-red-500/5 py-4 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                                            Decline
                                        </button>
                                        <button onClick={() => openApprovalModal(selectedApp)} className="flex-[2] rounded-2xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
                                            Move to Approval
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-center rounded-2xl border border-border bg-muted/50 p-4">
                                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Status: {selectedApp.status}</span>
                                        </div>
                                        {selectedApp.status === "approved" && (
                                            <div className="space-y-3">
                                                {!selectedApp.lease && (
                                                    <button 
                                                        onClick={() => handleGenerateSigningLink(selectedApp.id)} 
                                                        disabled={signingLinkState.loading}
                                                        className="w-full rounded-2xl border border-amber-500/20 bg-amber-500/10 py-4 text-xs font-black uppercase tracking-widest text-amber-500 hover:bg-amber-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {signingLinkState.loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Generate & Send Lease Signing Link"}
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleSendCredentials(selectedApp.id)} 
                                                    disabled={sendingCredentials}
                                                    className="w-full rounded-2xl border border-blue-500/20 bg-blue-500/10 py-4 text-xs font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {sendingCredentials ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Resend Access Portal Link"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Modals ─────────────────────────────────────────────────── */}
            <WalkInApplicationModal isOpen={showTenantApplicationModal} onClose={() => setShowTenantApplicationModal(false)} units={scopedAvailableUnits} onSuccess={() => setReloadKey(k => k + 1)} />
            <ContractPreviewModal isOpen={showContractModal} onClose={() => { setShowContractModal(false); setContractData(null); }} contractData={contractData} onSuccess={() => { setReloadKey(k => k + 1); setShowContractModal(false); }} />
            
            <AnimatePresence>
                {previewUrl && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewUrl(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-[210] flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-card shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 backdrop-blur-md">
                                <h3 className="text-xl font-black text-white">{formatDocumentLabel(previewUrl)}</h3>
                                <button onClick={() => setPreviewUrl(null)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex-1 bg-black/50 p-4">
                                {previewUrl.toLowerCase().endsWith(".pdf") ? (
                                    <iframe src={previewUrl} className="h-full w-full rounded-2xl border-0" title="Preview" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center"><img src={previewUrl} className="max-h-full max-w-full rounded-2xl object-contain" /></div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {tenantCredentials && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTenantCredentials(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-[310] w-full max-w-md rounded-[2.5rem] border border-emerald-500/20 bg-card p-8 shadow-2xl">
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground">Access Generated</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenant credentials provisioned</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-border bg-background p-4">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground">Tenant Email</span>
                                    <p className="font-mono text-sm font-bold text-foreground">{tenantCredentials.email}</p>
                                </div>
                                {tenantCredentials.tempPassword && (
                                    <div className="rounded-2xl border border-border bg-background p-4">
                                        <span className="text-[9px] font-black uppercase text-muted-foreground">Initial Password</span>
                                        <p className="font-mono text-sm font-bold text-emerald-500 tracking-widest">{tenantCredentials.tempPassword}</p>
                                    </div>
                                )}
                                <button onClick={() => setTenantCredentials(null)} className="w-full rounded-2xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                    Close Secure Panel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showInviteTools && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInviteTools(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative z-[160] h-[90vh] w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-border bg-background shadow-2xl">
                            <div className="flex items-center justify-between border-b border-border bg-card px-8 py-6">
                                <h3 className="text-xl font-black tracking-tighter text-foreground">Intake Manager</h3>
                                <button onClick={() => setShowInviteTools(false)} className="rounded-xl border border-border bg-background p-2 transition-all hover:bg-muted"><X className="h-6 w-6" /></button>
                            </div>
                            <div className="h-full overflow-y-auto p-8 pb-24"><TenantInviteManager availableUnits={scopedAvailableUnits} invites={scopedTenantInvites} onRefresh={loadInvites} /></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Countersign Modal */}
            <AnimatePresence>
                {showCountersignModal && selectedApp?.lease && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCountersignModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-[410] w-full max-w-2xl rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl">
                            <h3 className="text-2xl font-black text-foreground mb-6">Countersign Lease</h3>
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Tenant Signature</p>
                                    <img src={selectedApp.lease.tenant_signature || ""} alt="" className="max-h-24 object-contain" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Your Signature</p>
                                    <SignaturePad 
                                        onSave={setPendingCountersignature} 
                                        onClear={() => setPendingCountersignature(null)} 
                                        width={800} 
                                        height={180} 
                                        pdfBlob={leasePdfBlob}
                                        documentTitle={`Lease - ${selectedApp.propertyName} ${selectedApp.unitNumber}`}
                                    />
                                </div>
                                <button disabled={countersignState.loading || !pendingCountersignature} onClick={() => handleCountersignLease(selectedApp.lease!.id, pendingCountersignature!)} className="w-full rounded-2xl bg-emerald-500 py-4 text-xs font-black uppercase tracking-widest text-black hover:bg-emerald-400 disabled:opacity-50">
                                    {countersignState.loading ? "Signing..." : "Complete Execution"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
