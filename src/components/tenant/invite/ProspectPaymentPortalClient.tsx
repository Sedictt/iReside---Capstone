"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    ExternalLink,
    FileCheck,
    FileText,
    Loader2,
    QrCode,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    UploadCloud,
    User,
    X,
} from "lucide-react";
import { applyBrandCssVariables, getContrastTextColor, getMonogramInitials } from "@/lib/branding/colors";

type PaymentRequestItem = {
    id: string;
    requirementType: "advance_rent" | "security_deposit";
    label: string;
    amount: number;
    dueAt: string | null;
    status: "pending" | "processing" | "completed" | "rejected" | "expired";
    method: "gcash" | "cash" | null;
    referenceNumber: string | null;
    note: string | null;
    proofUrl: string | null;
    reviewNote: string | null;
    bypassed: boolean;
    submittedAt: string | null;
    reviewedAt: string | null;
};

type PortalPayload = {
    application: {
        id: string;
        applicantName: string;
        propertyName: string;
        unitName: string;
        deadline: string | null;
    };
    branding?: {
        primaryColor: string;
        secondaryColor: string;
        logoUrl: string | null;
        propertyName: string;
    } | null;
    destination: {
        accountName: string | null;
        accountNumber: string | null;
        qrImageUrl: string | null;
    } | null;
    requests: PaymentRequestItem[];
    methods: Array<"gcash" | "cash">;
};

const peso = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
});

function formatDateTime(value: string | null) {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return parsed.toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDate(value: string | null) {
    if (!value) return "Before move-in";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function ProspectPaymentPortalClient({ token }: { token: string }) {
    const [payload, setPayload] = useState<PortalPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form inputs
    const [method, setMethod] = useState<"gcash" | "cash">("gcash");
    const [referenceNumber, setReferenceNumber] = useState("");
    const [note, setNote] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Drag-and-drop state
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Modals & UI states
    const [copiedNumber, setCopiedNumber] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showProofModal, setShowProofModal] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isEditingAfterSubmit, setIsEditingAfterSubmit] = useState(false);

    useEffect(() => {
        let ignore = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/application-payments/${token}`);
                const data = (await response.json()) as PortalPayload & { error?: string };
                if (!response.ok || !data.application) {
                    throw new Error(data.error ?? "Payment portal is unavailable.");
                }
                if (ignore) return;
                setPayload(data);

                // Inject brand color variables dynamically
                if (data.branding?.primaryColor) {
                    applyBrandCssVariables(data.branding.primaryColor, data.branding.secondaryColor);
                }

                // Pre-fill method and reference if already present
                const firstSubmitted = data.requests.find((r) => r.referenceNumber || r.method);
                if (firstSubmitted?.method) {
                    setMethod(firstSubmitted.method);
                }
                if (firstSubmitted?.referenceNumber) {
                    setReferenceNumber(firstSubmitted.referenceNumber);
                }
                if (firstSubmitted?.note) {
                    setNote(firstSubmitted.note);
                }
            } catch (loadError) {
                if (ignore) return;
                setError(loadError instanceof Error ? loadError.message : "Payment portal is unavailable.");
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        void load();
        return () => {
            ignore = true;
        };
    }, [token]);

    // Cleanup object url for preview
    useEffect(() => {
        if (!proofFile) {
            setProofPreviewUrl(null);
            return;
        }
        if (proofFile.type.startsWith("image/")) {
            const url = URL.createObjectURL(proofFile);
            setProofPreviewUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        }
        setProofPreviewUrl(null);
    }, [proofFile]);

    // Handle file selection
    const handleFileSelected = (file: File | null) => {
        if (!file) {
            setProofFile(null);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("The selected file exceeds the 10MB upload limit. Please select a smaller file.");
            return;
        }
        setError(null);
        setProofFile(file);
    };

    const handleCopyNumber = () => {
        if (!payload?.destination?.accountNumber) return;
        void navigator.clipboard.writeText(payload.destination.accountNumber);
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2000);
    };

    // Derived states
    const totalAmount = useMemo(() => {
        if (!payload) return 0;
        return payload.requests.reduce((sum, req) => sum + req.amount, 0);
    }, [payload]);

    const allCompleted = useMemo(() => {
        if (!payload || payload.requests.length === 0) return false;
        return payload.requests.every((req) => req.status === "completed");
    }, [payload]);

    const allProcessing = useMemo(() => {
        if (!payload || payload.requests.length === 0) return false;
        return payload.requests.every((req) => req.status === "processing");
    }, [payload]);

    const hasAnyRejected = useMemo(() => {
        if (!payload) return false;
        return payload.requests.some((req) => req.status === "rejected");
    }, [payload]);

    const rejectionNotes = useMemo(() => {
        if (!payload) return [];
        return payload.requests
            .filter((r) => r.status === "rejected" && r.reviewNote)
            .map((r) => ({ label: r.label, note: r.reviewNote }));
    }, [payload]);

    const existingProofUrl = useMemo(() => {
        if (!payload) return null;
        return payload.requests.find((r) => r.proofUrl)?.proofUrl ?? null;
    }, [payload]);

    const hasProof = Boolean(proofFile || existingProofUrl);
    const hasReference = referenceNumber.trim().length > 0;

    // Requirement 2: Submit disabled unless proof of payment submitted (for GCash)
    const canSubmit = useMemo(() => {
        if (method === "gcash") {
            return hasProof && hasReference;
        }
        // For cash, reference & proof are optional
        return true;
    }, [method, hasProof, hasReference]);

    const brandPrimary = payload?.branding?.primaryColor || "#c4b0ff";
    const contrastColor = getContrastTextColor(brandPrimary);

    const executeSubmit = async () => {
        if (!payload) return;
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const formData = new FormData();
            formData.append("paymentRequestId", "all");
            formData.append("method", method);
            formData.append("referenceNumber", referenceNumber.trim());
            formData.append("note", note.trim());
            if (proofFile) {
                formData.append("proof", proofFile);
            }

            const response = await fetch(`/api/application-payments/${token}`, {
                method: "POST",
                body: formData,
            });

            const result = (await response.json()) as {
                error?: string;
                requests?: PaymentRequestItem[];
                request?: PaymentRequestItem;
            };

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit payment proof.");
            }

            const updatedRequests = result.requests ?? (result.request ? [result.request] : []);
            setPayload((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    requests: prev.requests.map((existing) => {
                        const match = updatedRequests.find((u) => u.id === existing.id);
                        return match ? { ...existing, ...match } : existing;
                    }),
                };
            });

            setShowConfirmModal(false);
            setIsEditingAfterSubmit(false);
            setSuccessMessage("Payment proof submitted successfully! Your landlord has been notified for review.");
        } catch (submitErr) {
            setError(submitErr instanceof Error ? submitErr.message : "Failed to submit payment proof.");
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090b10] text-white flex flex-col items-center justify-center p-6">
                <Loader2 className="size-10 animate-spin text-zinc-400" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Loading Secure Payment Portal...
                </p>
            </div>
        );
    }

    if (error && !payload) {
        return (
            <div className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-zinc-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                        <ShieldAlert className="size-6" />
                    </div>
                    <h1 className="mt-4 text-xl font-bold tracking-tight">Payment Portal Unavailable</h1>
                    <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                        {error || "This payment link is invalid, expired, or has already been fulfilled."}
                    </p>
                    <p className="mt-4 text-xs text-zinc-600">
                        Please reach out directly to the property manager or landlord to receive an updated link.
                    </p>
                </div>
            </div>
        );
    }

    if (!payload) return null;

    return (
        <div
            className="min-h-screen bg-[#090b10] text-zinc-100 antialiased selection:bg-white/20 selection:text-white"
            style={{
                ["--primary" as string]: brandPrimary,
                ["--primary-foreground" as string]: contrastColor,
            }}
        >
            {/* Top compact brand header */}
            <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
                <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {payload.branding?.logoUrl ? (
                            <img
                                src={payload.branding.logoUrl}
                                alt={payload.branding.propertyName}
                                className="size-8 rounded-lg object-cover border border-white/10"
                            />
                        ) : (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-black text-white border border-white/10">
                                {getMonogramInitials(payload.application.propertyName)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-base font-bold text-white truncate">
                                {payload.application.propertyName}
                            </h1>
                            <p className="text-xs text-zinc-400 truncate">
                                Unit {payload.application.unitName} &bull; {payload.application.applicantName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
                            <Clock className="size-3 text-amber-400" />
                            <span>Due {formatDateTime(payload.application.deadline)}</span>
                        </span>
                        <div className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-400" title="Protected Portal">
                            <ShieldCheck className="size-4 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                {/* Deadline reminder banner on mobile */}
                <div className="sm:hidden mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-amber-400" />
                    <span>Payment window ends on {formatDateTime(payload.application.deadline)}</span>
                </div>

                {/* Notifications & Error Banners */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 flex items-start gap-3">
                        <AlertCircle className="size-5 shrink-0 text-red-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-100">Unable to process submission</p>
                            <p className="mt-0.5 text-xs text-red-200/80">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 flex items-start gap-3">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-emerald-100">Submission Recorded</p>
                            <p className="mt-0.5 text-xs text-emerald-200/80">{successMessage}</p>
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-300">
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* Rejection Notice if applicable */}
                {hasAnyRejected && rejectionNotes.length > 0 && (
                    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                        <div className="flex items-center gap-2 font-bold text-amber-100">
                            <AlertCircle className="size-4 text-amber-400" />
                            <span>Action Required: Landlord Requested Re-submission</span>
                        </div>
                        <div className="mt-2 space-y-1.5 text-xs text-amber-200/90 pl-6">
                            {rejectionNotes.map((item, idx) => (
                                <p key={idx}>
                                    <strong className="text-amber-100">{item.label}:</strong> {item.note}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Summary & Destination Card (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Order & Requirements Breakdown */}
                        <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl shadow-lg">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Required Move-In Items
                                </h2>
                                <span className="text-[11px] text-zinc-500">
                                    {payload.requests.length} {payload.requests.length === 1 ? "Requirement" : "Requirements"}
                                </span>
                            </div>

                            <div className="mt-3 divide-y divide-white/5">
                                {payload.requests.map((item) => {
                                    const isItemCompleted = item.status === "completed";
                                    const isItemProcessing = item.status === "processing";
                                    const isItemRejected = item.status === "rejected";

                                    return (
                                        <div key={item.id} className="py-3 first:pt-1 last:pb-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{item.label}</p>
                                                    <p className="text-xs text-zinc-400">
                                                        Due: {formatDate(item.dueAt)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-white">
                                                        {peso.format(item.amount)}
                                                    </p>
                                                    <span
                                                        className={`inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            isItemCompleted
                                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                : isItemProcessing
                                                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                                : isItemRejected
                                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                                : "bg-zinc-800 text-zinc-400 border border-white/5"
                                                        }`}
                                                    >
                                                        {isItemCompleted
                                                            ? "Confirmed"
                                                            : isItemProcessing
                                                            ? "Under Review"
                                                            : isItemRejected
                                                            ? "Needs Revision"
                                                            : "Pending"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Due Callout */}
                            <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/60 p-3.5 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                        Total Amount Due
                                    </p>
                                    <p className="text-xs text-zinc-500">Includes all advance items</p>
                                </div>
                                <p className="text-xl font-black text-white" style={{ color: brandPrimary }}>
                                    {peso.format(totalAmount)}
                                </p>
                            </div>
                        </section>

                        {/* Payment Destination (GCash Account) */}
                        {payload.destination && (
                            <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-zinc-900/60 p-5 backdrop-blur-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-md bg-blue-500 text-[11px] font-black text-white">
                                            G
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                                            GCash Destination
                                        </span>
                                    </div>
                                    {payload.destination.qrImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setShowQrModal(true)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                                        >
                                            <QrCode className="size-3.5" />
                                            <span>Scan QR</span>
                                        </button>
                                    )}
                                </div>

                                <div className="mt-3.5 space-y-2 text-sm">
                                    <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 border border-white/5">
                                        <span className="text-xs text-zinc-400">Account Name</span>
                                        <span className="font-semibold text-white">
                                            {payload.destination.accountName || "Official Landlord"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 border border-white/5">
                                        <span className="text-xs text-zinc-400">Mobile Number</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-white tracking-wider">
                                                {payload.destination.accountNumber || "Not provided"}
                                            </span>
                                            {payload.destination.accountNumber && (
                                                <button
                                                    type="button"
                                                    onClick={handleCopyNumber}
                                                    className="flex size-7 items-center justify-center rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                                                    title="Copy phone number"
                                                >
                                                    {copiedNumber ? (
                                                        <Check className="size-3.5 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick instructions */}
                                <div className="mt-4 border-t border-white/5 pt-3">
                                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                                        Payment Instructions
                                    </p>
                                    <ol className="text-xs text-zinc-400 space-y-1 pl-4 list-decimal leading-relaxed">
                                        <li>Transfer the exact total of <strong className="text-zinc-200">{peso.format(totalAmount)}</strong> via GCash.</li>
                                        <li>Save or take a screenshot of the completed transaction receipt.</li>
                                        <li>Enter the 13-digit reference number and upload the receipt below.</li>
                                    </ol>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Unified Form / Under Review Receipt (7 cols) */}
                    <div className="lg:col-span-7">
                        {/* STATE 1: ALL COMPLETED */}
                        {allCompleted && (
                            <section className="rounded-2xl border border-emerald-500/20 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-lg text-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                                    <CheckCircle2 className="size-8" />
                                </div>
                                <h2 className="mt-4 text-xl font-bold text-white">All Payments Confirmed!</h2>
                                <p className="mt-2 text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                                    Your advance rent and security deposit have been successfully verified and confirmed by your landlord.
                                </p>
                                <div className="mt-6 rounded-xl border border-white/5 bg-zinc-950/60 p-4 text-left max-w-md mx-auto text-xs text-zinc-400 space-y-1.5">
                                    <p><strong className="text-zinc-200">Property:</strong> {payload.application.propertyName}</p>
                                    <p><strong className="text-zinc-200">Unit:</strong> {payload.application.unitName}</p>
                                    <p><strong className="text-zinc-200">Total Confirmed:</strong> {peso.format(totalAmount)}</p>
                                </div>
                                <p className="mt-6 text-xs text-zinc-500">
                                    You can proceed with move-in coordination. You will also receive an email with contract and arrival instructions.
                                </p>
                            </section>
                        )}

                        {/* STATE 2: UNDER LANDLORD REVIEW (all processing and not actively editing) */}
                        {!allCompleted && allProcessing && !isEditingAfterSubmit && (
                            <section className="rounded-2xl border border-blue-500/20 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Payment Under Review</h2>
                                        <p className="text-xs text-zinc-400">
                                            Your proof of payment has been submitted and is awaiting landlord verification.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 rounded-xl border border-white/5 bg-zinc-950/60 p-4 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Status</span>
                                        <span className="font-semibold text-blue-400">Under Landlord Review</span>
                                    </div>
                                    {referenceNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-zinc-400">GCash Reference No.</span>
                                            <span className="font-mono font-bold text-white">{referenceNumber}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Total Submitted</span>
                                        <span className="font-bold text-white">{peso.format(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Submitted At</span>
                                        <span className="text-zinc-300">
                                            {formatDateTime(payload.requests[0]?.submittedAt)}
                                        </span>
                                    </div>
                                </div>

                                {existingProofUrl && (
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="size-4 text-blue-400" />
                                            <span className="text-xs text-zinc-300">Payment receipt attached</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowProofModal(existingProofUrl)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                                        >
                                            <span>View Receipt</span>
                                            <ExternalLink className="size-3" />
                                        </button>
                                    </div>
                                )}

                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-4">
                                    <p className="text-[11px] text-zinc-500">
                                        Need to fix or update your receipt?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAfterSubmit(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                                    >
                                        <RefreshCw className="size-3" />
                                        <span>Update Submission</span>
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* STATE 3: UNIFIED PAYMENT FORM (pending, rejected, or editing) */}
                        {!allCompleted && (!allProcessing || isEditingAfterSubmit) && (
                            <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-lg">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-white">Payment Submission</h2>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Submit verified transfer details for all move-in requirements.
                                        </p>
                                    </div>
                                    {isEditingAfterSubmit && (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingAfterSubmit(false)}
                                            className="text-xs text-zinc-400 hover:text-zinc-200"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                <div className="mt-5 space-y-4">
                                    {/* Payment Method Selector */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                                            Payment Method
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMethod("gcash")}
                                                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                                                    method === "gcash"
                                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-400/40"
                                                        : "bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-800"
                                                }`}
                                            >
                                                <span className="flex size-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-blue-600">
                                                    G
                                                </span>
                                                <span>GCash (E-Wallet)</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setMethod("cash")}
                                                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                                                    method === "cash"
                                                        ? "bg-zinc-700 text-white shadow-md border border-white/20"
                                                        : "bg-zinc-800/60 text-zinc-400 border border-white/5 hover:bg-zinc-800"
                                                }`}
                                            >
                                                <CreditCard className="size-3.5" />
                                                <span>Cash (In Person)</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reference Number Field */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                {method === "gcash" ? "13-Digit GCash Reference Number *" : "Reference Number (Optional)"}
                                            </label>
                                            {method === "gcash" && (
                                                <span className="text-[10px] text-zinc-500">From GCash SMS / App receipt</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                placeholder={method === "gcash" ? "e.g. 1002 9384 1029 1" : "Optional cash memo or receipt number"}
                                                className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                            />
                                            {referenceNumber.trim().length > 0 && (
                                                <Check className="absolute right-3.5 top-3 size-4 text-emerald-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* File Upload Dropzone (Requirement 2 & 4) */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                                Proof of Payment Receipt {method === "gcash" ? "*" : "(Optional)"}
                                            </label>
                                            <span className="text-[10px] text-zinc-500">PNG, JPG, PDF up to 10MB</span>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,application/pdf"
                                            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                                            className="hidden"
                                        />

                                        {/* Dropzone Container */}
                                        {!proofFile && !existingProofUrl ? (
                                            <div
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(true);
                                                }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                    handleFileSelected(e.dataTransfer.files?.[0] ?? null);
                                                }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                                                    isDragging
                                                        ? "border-blue-500 bg-blue-500/10"
                                                        : "border-white/10 bg-zinc-950/50 hover:border-white/20 hover:bg-zinc-950/80"
                                                }`}
                                            >
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-white transition">
                                                    <UploadCloud className="size-5" />
                                                </div>
                                                <p className="mt-2.5 text-xs font-semibold text-zinc-300">
                                                    Click to browse or drag &amp; drop receipt
                                                </p>
                                                <p className="mt-1 text-[11px] text-zinc-500">
                                                    Attach screenshot from GCash showing transaction reference and amount
                                                </p>
                                            </div>
                                        ) : (
                                            /* Active file preview card */
                                            <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {proofPreviewUrl ? (
                                                        <img
                                                            src={proofPreviewUrl}
                                                            alt="Proof preview"
                                                            className="size-12 rounded-lg object-cover border border-white/10 shrink-0 cursor-pointer"
                                                            onClick={() => setShowProofModal(proofPreviewUrl)}
                                                        />
                                                    ) : (
                                                        <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 shrink-0 border border-white/5">
                                                            <FileText className="size-6" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-white truncate">
                                                            {proofFile ? proofFile.name : "Current Attached Proof"}
                                                        </p>
                                                        <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                                            <CheckCircle2 className="size-3" />
                                                            <span>
                                                                {proofFile
                                                                    ? `${(proofFile.size / 1024).toFixed(0)} KB • Ready to submit`
                                                                    : "Existing file uploaded"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="rounded-lg border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition"
                                                    >
                                                        Replace
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProofFile(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                        className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition"
                                                        title="Remove file"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Optional Transfer Note */}
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                                            Transfer Note (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder={
                                                method === "cash"
                                                    ? "e.g. Will pay upon key turnover on Saturday"
                                                    : "Any message or context for the landlord"
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                                        />
                                    </div>

                                    {/* Unified Single Submit Button (Requirements 2 & 3 & 5) */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            disabled={!canSubmit || isSubmitting}
                                            onClick={() => setShowConfirmModal(true)}
                                            className="w-full relative flex items-center justify-center gap-2 rounded-xl py-3 px-4 font-bold text-sm tracking-wide transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.01] active:scale-[0.99]"
                                            style={{
                                                backgroundColor: brandPrimary,
                                                color: contrastColor,
                                            }}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>Submitting Payment Proof...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="size-4" />
                                                    <span>
                                                        Submit Payment Proof ({peso.format(totalAmount)})
                                                    </span>
                                                    <ArrowRight className="size-4 opacity-70" />
                                                </>
                                            )}
                                        </button>

                                        {/* Helpful status note under button */}
                                        {!canSubmit && method === "gcash" && (
                                            <p className="mt-2 text-center text-[11px] text-zinc-500">
                                                {!hasProof && !hasReference
                                                    ? "Please upload your GCash receipt and enter the reference number to proceed."
                                                    : !hasProof
                                                    ? "Please upload your payment receipt to enable submission."
                                                    : "Please enter the 13-digit GCash reference number to enable submission."}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* CONFIRMATION MODAL BEFORE FINAL SUBMISSION */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="max-w-md w-full rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-base font-bold text-white">Confirm Payment Submission</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
                            Please verify your submission details. Once submitted, your payment proof will be locked and routed to the landlord for verification.
                        </p>

                        <div className="mt-4 space-y-2 rounded-xl border border-white/5 bg-zinc-950/70 p-3.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Property &amp; Unit</span>
                                <span className="font-semibold text-white">
                                    {payload.application.propertyName} ({payload.application.unitName})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Total Amount</span>
                                <span className="font-bold text-emerald-400">{peso.format(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Payment Method</span>
                                <span className="text-white capitalize">{method}</span>
                            </div>
                            {referenceNumber && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Reference Number</span>
                                    <span className="font-mono font-bold text-white">{referenceNumber}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Attached Proof</span>
                                <span className="text-zinc-200 truncate max-w-[200px]">
                                    {proofFile?.name || "Attached receipt"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setShowConfirmModal(false)}
                                className="rounded-xl border border-white/10 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
                            >
                                Review Again
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => void executeSubmit()}
                                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md disabled:opacity-50"
                                style={{
                                    backgroundColor: brandPrimary,
                                    color: contrastColor,
                                }}
                            >
                                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                                <span>Confirm &amp; Submit</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR CODE MODAL */}
            {showQrModal && payload.destination?.qrImageUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl text-center">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-sm font-bold text-white">GCash Official QR Code</h3>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-xl bg-white p-3 inline-block shadow-inner">
                            <img
                                src={payload.destination.qrImageUrl}
                                alt="GCash QR Code"
                                className="size-56 object-contain"
                            />
                        </div>

                        <div className="mt-3 text-xs text-zinc-400">
                            <p className="font-semibold text-white">{payload.destination.accountName}</p>
                            <p className="font-mono mt-0.5">{payload.destination.accountNumber}</p>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <a
                                href={payload.destination.qrImageUrl}
                                download="gcash-qr.png"
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 rounded-xl border border-white/10 bg-zinc-800 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                            >
                                Open Full Size
                            </a>
                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROOF VIEWER MODAL */}
            {showProofModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-zinc-900 p-4 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <span className="text-xs font-bold text-white">Submitted Payment Receipt</span>
                            <button
                                onClick={() => setShowProofModal(null)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="mt-3 max-h-[70vh] overflow-auto rounded-xl bg-black/40 flex items-center justify-center p-2">
                            <img
                                src={showProofModal}
                                alt="Payment proof"
                                className="max-h-[65vh] w-auto rounded-lg object-contain"
                            />
                        </div>
                        <div className="mt-3 text-right">
                            <button
                                type="button"
                                onClick={() => setShowProofModal(null)}
                                className="rounded-xl bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
