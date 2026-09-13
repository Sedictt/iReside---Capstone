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
import { ThemeToggle } from "@/components/theme-toggle";

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

    // Submit disabled unless proof of payment submitted (for GCash)
    const canSubmit = useMemo(() => {
        if (method === "gcash") {
            return hasProof && hasReference;
        }
        return true;
    }, [method, hasProof, hasReference]);

    const brandPrimary = payload?.branding?.primaryColor || "#c4b0ff";
    const contrastColor = getContrastTextColor(brandPrimary);

    // Resolves landlord's custom uploaded QR code, or autogenerates a scannable QR code for the GCash number
    const qrCodeUrl = useMemo(() => {
        if (payload?.destination?.qrImageUrl) {
            return payload.destination.qrImageUrl;
        }
        if (payload?.destination?.accountNumber) {
            return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
                payload.destination.accountNumber
            )}`;
        }
        return null;
    }, [payload]);

    // Clean unit string (guarantees no "Unit Unit 108" duplication)
    const displayUnit = useMemo(() => {
        const raw = payload?.application?.unitName?.trim() || "";
        if (!raw) return "";
        const stripped = raw.replace(/^(unit\s*)+/i, "").trim();
        return stripped ? `Unit ${stripped}` : raw;
    }, [payload]);

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
            <div className="min-h-screen bg-zinc-50 dark:bg-[#090b10] text-zinc-900 dark:text-white flex flex-col items-center justify-center p-6 transition-colors">
                <Loader2 className="size-10 animate-spin text-zinc-400" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Loading Secure Payment Portal...
                </p>
            </div>
        );
    }

    if (error && !payload) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-[#090b10] text-zinc-900 dark:text-white flex items-center justify-center p-6 transition-colors">
                <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-white dark:bg-zinc-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <ShieldAlert className="size-6" />
                    </div>
                    <h1 className="mt-4 text-xl font-bold tracking-tight">Payment Portal Unavailable</h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {error || "This payment link is invalid, expired, or has already been fulfilled."}
                    </p>
                    <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
                        Please reach out directly to the property manager or landlord to receive an updated link.
                    </p>
                </div>
            </div>
        );
    }

    if (!payload) return null;

    return (
        <div
            className="min-h-screen bg-zinc-50 dark:bg-[#090b10] text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-200 selection:bg-primary/20"
            style={{
                ["--primary" as string]: brandPrimary,
                ["--primary-foreground" as string]: contrastColor,
            }}
        >
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-primary/10 dark:bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Top Brand Header */}
            <header className="border-b border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-30 transition-colors">
                <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        {payload.branding?.logoUrl ? (
                            <img
                                src={payload.branding.logoUrl}
                                alt={payload.branding.propertyName}
                                className="size-9 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shadow-sm"
                            />
                        ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm">
                                {getMonogramInitials(payload.application.propertyName)}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white truncate">
                                {payload.application.propertyName}
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {displayUnit ? `${displayUnit} • ` : ""}{payload.application.applicantName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            <Clock className="size-3 text-amber-500 dark:text-amber-400" />
                            <span>Due {formatDateTime(payload.application.deadline)}</span>
                        </span>

                        {/* Theme Toggle (Light / Dark) */}
                        <ThemeToggle className="size-9 rounded-xl border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-zinc-900/80 shadow-sm" />

                        <div
                            className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100/80 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 shadow-sm"
                            title="Protected Checkout"
                        >
                            <ShieldCheck className="size-4 text-emerald-500" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 relative z-10">
                {/* Deadline reminder banner on mobile */}
                <div className="sm:hidden mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-amber-500" />
                    <span>Payment window ends on {formatDateTime(payload.application.deadline)}</span>
                </div>

                {/* Notifications & Error Banners */}
                {error && (
                    <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-900 dark:text-red-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <AlertCircle className="size-4 shrink-0 text-red-500" />
                            <p className="text-xs font-medium text-red-900 dark:text-red-200 truncate">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 shrink-0">
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                            <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 truncate">{successMessage}</p>
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0">
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* Rejection Notice if applicable */}
                {hasAnyRejected && rejectionNotes.length > 0 && (
                    <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
                        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 mb-1">
                            <AlertCircle className="size-4 text-amber-500" />
                            <span>Action Required: Landlord Requested Re-submission</span>
                        </div>
                        <div className="space-y-1 pl-6">
                            {rejectionNotes.map((item, idx) => (
                                <p key={idx}>
                                    <strong className="text-amber-950 dark:text-amber-100">{item.label}:</strong> {item.note}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main 2-Column Responsive Layout - Symmetrical in Height */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* LEFT COLUMN: Summary & GCash Destination (5 cols, flex layout for equal height) */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-5">
                        {/* Order & Requirements Breakdown */}
                        <section className="rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/5 pb-2.5">
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Required Items
                                    </h2>
                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                        {payload.requests.length} {payload.requests.length === 1 ? "Requirement" : "Requirements"}
                                    </span>
                                </div>

                                <div className="divide-y divide-zinc-100 dark:divide-white/5 mt-1">
                                    {payload.requests.map((item) => {
                                        const isItemCompleted = item.status === "completed";
                                        const isItemProcessing = item.status === "processing";
                                        const isItemRejected = item.status === "rejected";

                                        return (
                                            <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{item.label}</span>
                                                    <span className="text-xs text-zinc-400 shrink-0">({formatDate(item.dueAt)})</span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-sm font-black text-zinc-900 dark:text-white">
                                                        {peso.format(item.amount)}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                            isItemCompleted
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                                : isItemProcessing
                                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                                : isItemRejected
                                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5"
                                                        }`}
                                                    >
                                                        {isItemCompleted
                                                            ? "Confirmed"
                                                            : isItemProcessing
                                                            ? "Review"
                                                            : isItemRejected
                                                            ? "Revision"
                                                            : "Pending"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Total Due Callout (Single Line) */}
                            <div className="mt-3 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-950/60 px-4 py-3 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Total Amount Due
                                </span>
                                <span className="text-xl font-black text-zinc-900 dark:text-white" style={{ color: brandPrimary }}>
                                    {peso.format(totalAmount)}
                                </span>
                            </div>
                        </section>

                        {/* GCash Destination Card with Clickable Inline QR Code */}
                        {payload.destination && (
                            <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-50/40 via-white/90 to-white/90 dark:from-blue-950/20 dark:via-zinc-900/60 dark:to-zinc-900/60 p-5 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors flex-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/5 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-black text-white shadow-sm">
                                            G
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                            Official GCash Destination
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                        Verified
                                    </span>
                                </div>

                                {/* QR Code & Account Info */}
                                <div className="my-auto py-2 flex items-center gap-4">
                                    {qrCodeUrl ? (
                                        <div
                                            onClick={() => setShowQrModal(true)}
                                            className="group relative size-24 shrink-0 overflow-hidden rounded-2xl bg-white p-1.5 border border-zinc-200 dark:border-white/10 shadow-sm cursor-pointer transition hover:scale-105"
                                            title="Click to zoom QR code"
                                        >
                                            <img
                                                src={qrCodeUrl}
                                                alt="GCash QR Code"
                                                className="size-full object-contain"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-2xl">
                                                <span className="rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
                                                    <QrCode className="size-2.5" /> Zoom
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="size-24 shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400">
                                            <QrCode className="size-6" />
                                            <span className="text-[9px] mt-1 font-bold">No QR</span>
                                        </div>
                                    )}

                                    {/* Account Name & Number Details (Single-Line Key-Values) */}
                                    <div className="flex-1 min-w-0 space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between gap-2 border-b border-blue-500/10 dark:border-white/5 pb-2">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium shrink-0">Account</span>
                                            <span className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate text-right">
                                                {payload.destination.accountName || "Official Landlord"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium shrink-0">Number</span>
                                            <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
                                                <span>{payload.destination.accountNumber || "Not provided"}</span>
                                                {payload.destination.accountNumber && (
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyNumber}
                                                        className="flex size-5 items-center justify-center rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 transition shrink-0"
                                                        title="Copy number"
                                                    >
                                                        {copiedNumber ? (
                                                            <Check className="size-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="size-3" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Unified Payment Form / Under Review Receipt (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col justify-between">
                        {/* STATE 1: ALL COMPLETED */}
                        {allCompleted && (
                            <section className="rounded-3xl border border-emerald-500/20 bg-white/90 dark:bg-zinc-900/60 p-6 backdrop-blur-xl shadow-sm dark:shadow-xl text-center h-full flex flex-col justify-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                                    <CheckCircle2 className="size-8" />
                                </div>
                                <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-white">All Payments Confirmed!</h2>
                                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                                    Your advance rent and security deposit have been verified and confirmed by your landlord.
                                </p>
                                <div className="mt-4 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/60 p-4 text-left max-w-md mx-auto text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                                    <p><strong className="text-zinc-900 dark:text-zinc-200">Property:</strong> {payload.application.propertyName}</p>
                                    <p><strong className="text-zinc-900 dark:text-zinc-200">Unit:</strong> {displayUnit}</p>
                                    <p><strong className="text-zinc-900 dark:text-zinc-200">Total Confirmed:</strong> {peso.format(totalAmount)}</p>
                                </div>
                            </section>
                        )}

                        {/* STATE 2: UNDER LANDLORD REVIEW */}
                        {!allCompleted && allProcessing && !isEditingAfterSubmit && (
                            <section className="rounded-3xl border border-blue-500/20 bg-white/90 dark:bg-zinc-900/60 p-6 backdrop-blur-xl shadow-sm dark:shadow-xl h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 border-b border-zinc-200/70 dark:border-white/5 pb-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Clock className="size-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Payment Under Review</h2>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Proof of payment is awaiting landlord verification.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2.5 rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/60 p-4 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Status</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">Under Landlord Review</span>
                                        </div>
                                        {referenceNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-zinc-500 dark:text-zinc-400">GCash Ref No.</span>
                                                <span className="font-mono font-bold text-zinc-900 dark:text-white">{referenceNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Total Submitted</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{peso.format(totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500 dark:text-zinc-400">Submitted At</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">
                                                {formatDateTime(payload.requests[0]?.submittedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {existingProofUrl && (
                                        <div className="mt-3 flex items-center justify-between rounded-2xl border border-zinc-200/80 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <FileCheck className="size-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Payment receipt attached</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowProofModal(existingProofUrl)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition"
                                            >
                                                <span>View Receipt</span>
                                                <ExternalLink className="size-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-zinc-200/70 dark:border-white/5 pt-3">
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                        Need to update your receipt?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingAfterSubmit(true)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                    >
                                        <RefreshCw className="size-3" />
                                        <span>Update Submission</span>
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* STATE 3: UNIFIED PAYMENT FORM */}
                        {!allCompleted && (!allProcessing || isEditingAfterSubmit) && (
                            <section className="rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-sm dark:shadow-xl transition-colors h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-white/5 pb-2.5">
                                        <h2 className="text-sm font-black text-zinc-900 dark:text-white">Payment Submission</h2>
                                        {isEditingAfterSubmit && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingAfterSubmit(false)}
                                                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-3.5 space-y-3">
                                        {/* Payment Method Selector */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMethod("gcash")}
                                                className={`flex items-center justify-center gap-2 rounded-2xl py-2 px-3 text-xs font-bold transition ${
                                                    method === "gcash"
                                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 border border-blue-500"
                                                        : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/5 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
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
                                                className={`flex items-center justify-center gap-2 rounded-2xl py-2 px-3 text-xs font-bold transition ${
                                                    method === "cash"
                                                        ? "bg-zinc-800 text-white shadow-md border border-zinc-700 dark:bg-zinc-700"
                                                        : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/5 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
                                                }`}
                                            >
                                                <CreditCard className="size-3.5" />
                                                <span>Cash (In Person)</span>
                                            </button>
                                        </div>

                                        {/* Reference Number Field */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                {method === "gcash" ? "13-Digit GCash Reference Number *" : "Reference Number (Optional)"}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={referenceNumber}
                                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                                    placeholder={method === "gcash" ? "e.g. 1002 9384 1029 1" : "Optional cash memo or receipt number"}
                                                    className="w-full rounded-2xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/70 px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                                />
                                                {referenceNumber.trim().length > 0 && (
                                                    <Check className="absolute right-3 top-2.5 size-3.5 text-emerald-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* File Upload Dropzone (Single-Line Compact) */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                                                Proof of Payment Receipt {method === "gcash" ? "*" : "(Optional)"}
                                            </label>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
                                                className="hidden"
                                            />

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
                                                    className={`group flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3 text-center cursor-pointer transition ${
                                                        isDragging
                                                            ? "border-blue-500 bg-blue-500/10"
                                                            : "border-zinc-300 dark:border-white/10 bg-zinc-50/60 dark:bg-zinc-950/50 hover:border-zinc-400 dark:hover:border-white/20 hover:bg-zinc-100/60 dark:hover:bg-zinc-950/80"
                                                    }`}
                                                >
                                                    <UploadCloud className="size-4 text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-white transition" />
                                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                        Click or drop receipt (PNG, JPG, PDF up to 10MB)
                                                    </span>
                                                </div>
                                            ) : (
                                                /* Active file preview card */
                                                <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/70 p-2.5 flex items-center justify-between gap-2.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {proofPreviewUrl ? (
                                                            <img
                                                                src={proofPreviewUrl}
                                                                alt="Proof preview"
                                                                className="size-9 rounded-lg object-cover border border-zinc-200 dark:border-white/10 shrink-0 cursor-pointer shadow-sm"
                                                                onClick={() => setShowProofModal(proofPreviewUrl)}
                                                            />
                                                        ) : (
                                                            <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                                                                <FileText className="size-4" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                                {proofFile ? proofFile.name : "Current Attached Proof"}
                                                            </p>
                                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                                                <CheckCircle2 className="size-2.5" />
                                                                <span>{proofFile ? `${(proofFile.size / 1024).toFixed(0)} KB ready` : "Uploaded"}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition shadow-sm"
                                                        >
                                                            Replace
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setProofFile(null);
                                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                                            }}
                                                            className="flex size-6 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 transition"
                                                            title="Remove file"
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Optional Transfer Note */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
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
                                                className="w-full rounded-2xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/70 px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Unified Single Submit Button */}
                                <div className="pt-3">
                                    <button
                                        type="button"
                                        disabled={!canSubmit || isSubmitting}
                                        onClick={() => setShowConfirmModal(true)}
                                        className="w-full relative flex items-center justify-center gap-2 rounded-2xl py-3 px-4 font-bold text-xs tracking-wide transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.01] active:scale-[0.99]"
                                        style={{
                                            backgroundColor: brandPrimary,
                                            color: contrastColor,
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                <span>Submitting Payment Proof...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="size-4" />
                                                <span>Submit Payment Proof ({peso.format(totalAmount)})</span>
                                                <ArrowRight className="size-3.5 opacity-70" />
                                            </>
                                        )}
                                    </button>

                                    {/* Status guidance note under button */}
                                    {!canSubmit && method === "gcash" && (
                                        <p className="mt-1.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                                            Please upload your GCash receipt and enter the reference number to proceed.
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            {/* CONFIRMATION MODAL BEFORE FINAL SUBMISSION */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
                    <div className="max-w-md w-full rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Confirm Payment Submission</h3>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Please verify your submission details. Once submitted, your payment proof will be locked and routed to the landlord for verification.
                        </p>

                        <div className="mt-4 space-y-2 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/70 p-4 text-xs">
                            <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">Property &amp; Unit</span>
                                <span className="font-bold text-zinc-900 dark:text-white">
                                    {payload.application.propertyName} ({displayUnit})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">Total Amount</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{peso.format(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">Payment Method</span>
                                <span className="font-bold text-zinc-900 dark:text-white capitalize">{method}</span>
                            </div>
                            {referenceNumber && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 dark:text-zinc-400">Reference Number</span>
                                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{referenceNumber}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-zinc-500 dark:text-zinc-400">Attached Proof</span>
                                <span className="text-zinc-700 dark:text-zinc-200 font-medium truncate max-w-[200px]">
                                    {proofFile?.name || "Attached receipt"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setShowConfirmModal(false)}
                                className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                            >
                                Review Again
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => void executeSubmit()}
                                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition shadow-md disabled:opacity-50"
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

            {/* QR CODE MODAL (HIGH RES) */}
            {showQrModal && qrCodeUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
                    <div className="max-w-sm w-full rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl text-center">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">GCash Official QR Code</h3>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white p-4 inline-block shadow-md border border-zinc-200/80">
                            <img
                                src={qrCodeUrl}
                                alt="GCash QR Code"
                                className="size-60 object-contain"
                            />
                        </div>

                        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <p className="font-bold text-zinc-900 dark:text-white">{payload.destination?.accountName || "Landlord GCash"}</p>
                            <p className="font-mono mt-0.5">{payload.destination?.accountNumber}</p>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <a
                                href={qrCodeUrl}
                                download="gcash-qr.png"
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                            >
                                Open Full Size
                            </a>
                            <button
                                type="button"
                                onClick={() => setShowQrModal(false)}
                                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROOF VIEWER MODAL */}
            {showProofModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="max-w-lg w-full rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/10">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white">Submitted Payment Receipt</span>
                            <button
                                onClick={() => setShowProofModal(null)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="mt-3 max-h-[70vh] overflow-auto rounded-2xl bg-zinc-100 dark:bg-black/40 flex items-center justify-center p-2">
                            <img
                                src={showProofModal}
                                alt="Payment proof"
                                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-sm"
                            />
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                type="button"
                                onClick={() => setShowProofModal(null)}
                                className="rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
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
