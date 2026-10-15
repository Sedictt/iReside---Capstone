"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Calendar, X, CheckCircle2, ArrowRight, ShieldCheck, Clock, Info, Loader2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    EXPIRING_SOON_DAYS,
    OPEN_ENDED_NOTICE_DAYS,
    daysUntilLeaseEnd,
    isOpenEnded,
    type LeaseTermLike,
} from "@/lib/lease-term";
import { useLanguageContext } from "@/context/LanguageContext";
import MoveOutRequest from "./MoveOutRequest";

export interface ActiveRenewalRequestInfo {
    id?: string;
    status: "pending" | "approved" | "rejected" | "signed" | string;
    proposed_start_date?: string | null;
    proposed_end_date?: string | null;
    proposed_monthly_rent?: number | null;
    created_at?: string;
    landlord_notes?: string | null;
    current_lease_id?: string;
}

interface LeaseRenewalRequestProps {
    variant?: "sidebar" | "quickAction" | "none";
    /**
     * The lease this request is for. Open-ended leases have nothing to renew, so the
     * card explains that and points to the move-out flow instead of showing the form.
     */
    lease?: LeaseTermLike | null;
    /** Days until the lease ends. Derived from `lease` when omitted. */
    daysRemaining?: number;
    leaseId?: string;
    autoOpen?: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
    existingRequest?: ActiveRenewalRequestInfo | null;
    renewalSettings?: {
        base_rent_adjustment: number;
        adjustment_type: "percentage" | "fixed";
        new_rules: string[];
        landlord_memo: string;
        is_enabled: boolean;
        renewal_terms?: Array<{
            months: number;
            label: string;
            price_label: string;
            is_popular?: boolean;
        }>;
    };
}

// Default term options when not provided by renewalSettings
const DEFAULT_RENEWAL_TERMS = [
    { months: 6, label: "6 Months Extension", price_label: "Standard Rent" },
    { months: 12, label: "1 Year Extension", price_label: "Standard Rent" },
    { months: 24, label: "2 Years Extension", price_label: "Standard Rent" }
];

function formatDisplayDate(dateStr?: string | null, locale: string = "en-US"): string {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}

export default function LeaseRenewalRequest({ variant = "sidebar", lease, daysRemaining: daysRemainingProp, leaseId, autoOpen = false, onSuccess, onClose, existingRequest, renewalSettings }: LeaseRenewalRequestProps) {
    const { t, locale } = useLanguageContext();
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [step, setStep] = useState<"disclosure" | "request">("disclosure");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState<number>(12);
    const [acknowledged, setAcknowledged] = useState(false);
    const [activeRequest, setActiveRequest] = useState<ActiveRenewalRequestInfo | null>(existingRequest ?? null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync from prop if provided
    useEffect(() => {
        if (existingRequest !== undefined) {
            setActiveRequest(existingRequest);
        }
    }, [existingRequest]);

    // Fetch existing renewal request if not passed via prop to auto-detect on-going requests
    useEffect(() => {
        if (existingRequest !== undefined || !leaseId) return;
        let isMounted = true;
        fetch("/api/tenant/renewals", { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
                if (!isMounted || !Array.isArray(data)) return;
                const found = data.find((r: any) =>
                    r.current_lease_id === leaseId && (r.status === "pending" || r.status === "approved")
                ) || data.find((r: any) => r.current_lease_id === leaseId);
                if (found) {
                    setActiveRequest(found);
                }
            })
            .catch((err) => {
                console.error("[LeaseRenewalRequest] Error loading active renewals:", err);
            });
        return () => {
            isMounted = false;
        };
    }, [leaseId, existingRequest]);

    // Listen for custom event from other components or tabs
    useEffect(() => {
        const handleSubmitted = (e: Event) => {
            const customEvent = e as CustomEvent<{ leaseId?: string }>;
            if (!customEvent.detail?.leaseId || customEvent.detail.leaseId === leaseId) {
                setActiveRequest((prev) =>
                    prev
                        ? { ...prev, status: "pending" }
                        : { status: "pending", current_lease_id: leaseId, created_at: new Date().toISOString() }
                );
            }
        };
        window.addEventListener("lease-renewal-submitted", handleSubmitted);
        return () => window.removeEventListener("lease-renewal-submitted", handleSubmitted);
    }, [leaseId]);

    const handleSubmit = async () => {
        if (submitting) return;
        if (!leaseId) {
            toast.error(t("Lease ID not found"));
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/tenant/lease/${leaseId}/renew`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ term_months: selectedTerm })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                toast.error(t("Renewal Request Failed"), {
                    description: data.error || t("Something went wrong")
                });
                return;
            }

            setSubmitted(true);
            toast.success(t("Renewal Request Sent"), {
                description: t("Landlord has been notified of your {months}-month renewal intent.", { months: selectedTerm })
            });

            onSuccess?.();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("lease-renewal-submitted", { detail: { leaseId } }));
            }

            // Auto-close after 3 seconds
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                onClose?.();
            }, 3000);
        } catch {
            toast.error(t("Renewal Request Failed"), {
                description: t("Network error. Please try again.")
            });
        } finally {
            setSubmitting(false);
        }
    };

    const isPending = activeRequest?.status === "pending";
    const isApproved = activeRequest?.status === "approved";
    const hasOngoing = isPending || isApproved;
    // Open-ended (month-to-month) leases never need renewing; only a legacy in-flight request keeps the form reachable.
    const openEnded = Boolean(lease) && isOpenEnded(lease) && !hasOngoing;
    const daysRemaining = daysRemainingProp ?? daysUntilLeaseEnd(lease) ?? Number.POSITIVE_INFINITY;
    const isEligible = (daysRemaining <= EXPIRING_SOON_DAYS) || hasOngoing;
    const daysUntilEligible = Number.isFinite(daysRemaining) ? Math.max(0, Math.ceil(daysRemaining - EXPIRING_SOON_DAYS)) : null;

    if (openEnded) {
        if (variant !== "sidebar") return null;
        return (
            <div className="rounded-[2rem] p-8 relative overflow-hidden flex-shrink-0 backdrop-blur-sm neumorphic-panel" data-testid="renewal-not-needed">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent opacity-80" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-10 items-center justify-center rounded-xl text-primary neumorphic-inset-card">
                            <Home className="size-5" />
                        </div>
                        <h3 className="text-xl font-black text-foreground">{t("No renewal needed")}</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-[9px] font-black uppercase tracking-wider text-primary border border-primary/20 neumorphic-inset">
                        <span className="size-1.5 rounded-full bg-primary" />
                        {t("Open-ended · month-to-month")}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                        {t("Your lease is open-ended. You can stay for as long as rent is paid, and you can request a move-out at any time with {days} days' notice.", { days: OPEN_ENDED_NOTICE_DAYS })}
                    </p>
                    <MoveOutRequest variant="link" />
                </div>
            </div>
        );
    }

    return (
        <>
            {variant === "sidebar" ? (
                /* Sidebar Card Trigger */
                <div className={cn(
                    "rounded-[2rem] p-8 relative overflow-hidden group flex-shrink-0 backdrop-blur-sm transition-all neumorphic-panel",
                    isPending ? "border border-amber-500/20" : isApproved ? "border border-emerald-500/20" : (!isEligible && "grayscale opacity-80")
                )}>
                    {isPending ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-transparent opacity-80" />
                    ) : isApproved ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-transparent opacity-80" />
                    ) : isEligible && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-transparent opacity-80" />
                    )}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "flex size-10 items-center justify-center rounded-xl neumorphic-inset-card",
                                    isPending ? "text-amber-500" : isApproved ? "text-emerald-500" : isEligible ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {isPending ? (
                                        <Clock className="size-5 animate-pulse" />
                                    ) : isApproved ? (
                                        <CheckCircle2 className="size-5" />
                                    ) : (
                                        <RefreshCw className={cn("size-5", isEligible && "animate-spin-slow")} />
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-foreground">{t("Lease Renewal")}</h3>
                            </div>
                            {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/20 neumorphic-inset">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                                    {t("Under Review")}
                                </span>
                            )}
                            {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 neumorphic-inset">
                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                    {t("Approved")}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            {isPending
                                ? t("You have an ongoing renewal request under review by your landlord. Additional requests are paused to prevent duplicate submissions.")
                                : isApproved
                                ? t("Your renewal request has been approved! A new lease agreement is ready for you to review and sign.")
                                : isEligible
                                ? t("Your lease is eligible for renewal. Select a term below to notify your landlord of your intent to stay.")
                                : daysUntilEligible !== null
                                ? t("Renewal requests open when your lease has {days} days remaining (in {daysUntil} days).", { days: EXPIRING_SOON_DAYS, daysUntil: daysUntilEligible })
                                : t("Renewal requests open when your lease has {days} days remaining.", { days: EXPIRING_SOON_DAYS })}
                        </p>

                        {isPending ? (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all neumorphic-extruded text-foreground hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <Clock className="size-3.5 text-amber-500" />
                                <span>{t("View Request Status")}</span>
                            </button>
                        ) : isApproved ? (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all neumorphic-primary cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>{t("View Approved Request")}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsOpen(true)}
                                disabled={!isEligible}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                    isEligible 
                                        ? "neumorphic-primary" 
                                        : "neumorphic-extruded text-muted-foreground cursor-not-allowed opacity-50"
                                )}
                            >
                                {isEligible ? t("Request Renewal") : t("Locked")}
                            </button>
                        )}
                    </div>
                </div>
            ) : variant === "quickAction" ? (
                /* Quick Action Trigger */
                <button
                    onClick={() => setIsOpen(true)}
                    className="rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 transition-all hover:-translate-y-1 group backdrop-blur-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed neumorphic-extruded"
                >
                    <div className={cn(
                        "size-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 neumorphic-inset-card",
                        isPending ? "text-amber-500" : isApproved ? "text-emerald-500" : isEligible ? "text-primary" : "text-muted-foreground"
                    )}>
                        {isPending ? (
                            <Clock className="size-7 animate-pulse" />
                        ) : isApproved ? (
                            <CheckCircle2 className="size-7" />
                        ) : (
                            <RefreshCw className="size-7" />
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] font-black text-center transition-colors uppercase tracking-widest",
                        isPending ? "text-amber-600 dark:text-amber-400" : isApproved ? "text-emerald-600 dark:text-emerald-400" : "group-hover:text-primary"
                    )}>
                        {isPending ? t("Renewal Pending") : isApproved ? t("Renewal Ready") : t("Renew Lease")}
                    </span>
                </button>
            ) : variant === "none" ? null : null}

            {/* Modal */}
            {mounted && isOpen ? createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col neumorphic-panel">

                        {/* Header */}
                        <div className="p-6 flex justify-between items-center backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2.5 rounded-xl neumorphic-inset-card",
                                    isPending ? "text-amber-500" : isApproved ? "text-emerald-500" : "text-primary"
                                )}>
                                    {isPending ? <Clock className="size-5 animate-pulse" /> : isApproved ? <CheckCircle2 className="size-5" /> : <RefreshCw className="size-5" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground tracking-tight">
                                        {hasOngoing 
                                            ? (isPending ? t("Renewal Request Under Review") : t("Renewal Request Approved"))
                                            : (step === "disclosure" ? t("Latest Property Terms") : t("Lease Renewal Request"))}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    onClose?.();
                                }}
                                className="p-2 rounded-xl transition-colors text-muted-foreground hover:text-foreground neumorphic-extruded"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                            {submitted ? (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="size-20 mx-auto rounded-full flex items-center justify-center text-emerald-500 neumorphic-inset-card">
                                        <CheckCircle2 className="size-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black text-foreground">{t("Request Sent")}</h4>
                                        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                                            {t("Your request to renew for **{months} months** has been sent to your landlord for review.", { months: selectedTerm })}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest px-4 py-2 rounded-full neumorphic-inset">
                                        <Clock className="size-3" /> {t("Awaiting Landlord Response")}
                                    </div>
                                </div>
                            ) : hasOngoing ? (
                                <div className="text-center space-y-6 animate-in zoom-in-95 duration-500 w-full max-w-sm mx-auto">
                                    <div className={cn(
                                        "size-20 mx-auto rounded-full flex items-center justify-center neumorphic-inset-card",
                                        isPending ? "text-amber-500" : "text-emerald-500"
                                    )}>
                                        {isPending ? (
                                            <Clock className="size-10 animate-pulse" />
                                        ) : (
                                            <CheckCircle2 className="size-10" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black text-foreground">
                                            {isPending ? t("Request Under Review") : t("Renewal Approved")}
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {isPending
                                                ? t("You already have an on-going lease renewal request submitted. It is currently awaiting review by your landlord.")
                                                : t("Your lease renewal request was approved! A new lease agreement is ready for your signature.")}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl p-4 neumorphic-inset text-left space-y-2.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Status")}</span>
                                            <span className={cn(
                                                "font-black text-[11px] flex items-center gap-1.5",
                                                isPending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                            )}>
                                                {isPending && <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />}
                                                {isPending ? t("Pending Approval") : t("Approved")}
                                            </span>
                                        </div>
                                        {activeRequest?.proposed_start_date && activeRequest?.proposed_end_date && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Proposed Period")}</span>
                                                <span className="font-semibold text-foreground text-[11px]">
                                                    {formatDisplayDate(activeRequest.proposed_start_date, locale)} - {formatDisplayDate(activeRequest.proposed_end_date, locale)}
                                                </span>
                                            </div>
                                        )}
                                        {activeRequest?.proposed_monthly_rent ? (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Proposed Rent")}</span>
                                                <span className="font-black text-primary text-[11px]">
                                                    {t("PHP {amount}/mo", { amount: Number(activeRequest.proposed_monthly_rent).toLocaleString() })}
                                                </span>
                                            </div>
                                        ) : null}
                                        {activeRequest?.created_at && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t("Submitted On")}</span>
                                                <span className="font-semibold text-muted-foreground text-[11px]">
                                                    {formatDisplayDate(activeRequest.created_at, locale)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-2.5 p-3 rounded-xl neumorphic-inset text-left">
                                        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            {isPending 
                                                ? t("Additional submissions are locked to prevent duplicate processing. You will receive an in-app notification when your landlord responds.")
                                                : t("Navigate to your lease documents section to inspect and sign the renewed agreement.")}
                                        </p>
                                    </div>
                                </div>
                            ) : step === "disclosure" ? (
                                <div className="w-full animate-in slide-in-from-right-4 duration-500 space-y-6">
                                    <div className="rounded-[2rem] p-6 relative overflow-hidden neumorphic-inset">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                                            <ShieldCheck className="size-16" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">{t("Official Property Memo")}</p>
                                        <p className="text-sm font-medium text-foreground leading-relaxed">
                                            {renewalSettings?.landlord_memo || t("No specific updates have been posted by the landlord for this renewal window.")}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border pb-2">{t("Updated Terms")}</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex items-center justify-between p-4 rounded-2xl neumorphic-inset">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg flex items-center justify-center text-primary neumorphic-inset-card">
                                                        <ArrowRight className="size-4" />
                                                    </div>
                                                    <span className="text-xs font-black text-foreground uppercase tracking-widest">{t("Expected Rent Adjustment")}</span>
                                                </div>
                                                <span className="text-sm font-black text-primary">
                                                    {renewalSettings?.base_rent_adjustment ? (
                                                        renewalSettings.adjustment_type === "percentage" 
                                                            ? `+${renewalSettings.base_rent_adjustment}%` 
                                                            : `+PHP ${renewalSettings.base_rent_adjustment.toLocaleString()}`
                                                    ) : t("No change")}
                                                </span>
                                            </div>

                                            {renewalSettings?.new_rules && renewalSettings.new_rules.length > 0 && (
                                                <div className="space-y-3 pt-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("New Rules & Clauses")}</p>
                                                    {renewalSettings.new_rules.map((rule, i) => (
                                                        <div key={rule} className="flex items-start gap-3 p-3 rounded-xl neumorphic-inset">
                                                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                                            <p className="text-[11px] font-medium text-foreground">{rule}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 pt-2">
                                        <input 
                                            type="checkbox" 
                                            id="acknowledge"
                                            checked={acknowledged}
                                            onChange={(e) => setAcknowledged(e.target.checked)}
                                            className="size-5 rounded-lg text-primary focus:ring-primary/20 neumorphic-inset-card"
                                        />
                                        <label htmlFor="acknowledge" className="text-[11px] font-black text-muted-foreground cursor-pointer select-none">
                                            {t("I have reviewed the latest property terms and rules.")}
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full animate-in slide-in-from-right-4 duration-500 space-y-6">
                                    <div className="text-center space-y-2 mb-8">
                                        <h4 className="text-2xl font-black text-foreground">{t("Select Your Term")}</h4>
                                        <p className="text-sm text-muted-foreground">{t("Choose your preferred extension period.")}</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {(renewalSettings?.renewal_terms?.length ? renewalSettings.renewal_terms : DEFAULT_RENEWAL_TERMS).map((opt) => {
                                            const isSelected = selectedTerm === opt.months;
                                            return (
                                                <button
                                                    key={opt.months}
                                                    type="button"
                                                    onClick={() => setSelectedTerm(opt.months)}
                                                    className={cn(
                                                        "p-5 rounded-2xl text-left transition-all flex items-center justify-between group neumorphic-extruded cursor-pointer",
                                                        isSelected 
                                                            ? "ring-2 ring-primary text-primary" 
                                                            : "hover:border-primary/30"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "size-10 rounded-xl flex items-center justify-center transition-colors",
                                                            isSelected ? "neumorphic-primary" : "neumorphic-inset-card text-muted-foreground"
                                                        )}>
                                                            <Calendar className="size-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-foreground">{t("{months} Months", { months: opt.months })}</p>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t(opt.label)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            isSelected ? "text-primary" : "text-muted-foreground"
                                                        )}>{t(opt.price_label)}</span>
                                                        <div className={cn(
                                                            "size-6 rounded-full flex items-center justify-center transition-all",
                                                            isSelected ? "neumorphic-primary text-primary-foreground" : "neumorphic-inset-card text-transparent"
                                                        )}>
                                                            <CheckCircle2 className={cn("size-3.5", isSelected ? "opacity-100" : "opacity-0")} />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-start gap-3 p-4 rounded-xl neumorphic-inset">
                                        <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                            {t("Terms are based on the renewal policy disclosed in the previous step. Final approval is subject to landlord signature.")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {!submitted && (
                            <div className="p-6 flex gap-3">
                                {hasOngoing ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false);
                                            onClose?.();
                                        }}
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all neumorphic-extruded text-muted-foreground hover:text-foreground cursor-pointer active:scale-[0.98]"
                                    >
                                        {t("Close")}
                                    </button>
                                ) : step === "disclosure" ? (
                                    <button
                                        type="button"
                                        onClick={() => setStep("request")}
                                        disabled={!acknowledged}
                                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 neumorphic-primary cursor-pointer active:scale-[0.98]"
                                    >
                                        <span>{t("Accept & Proceed")}</span>
                                        <ArrowRight className="size-4" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setStep("disclosure")}
                                            className="px-6 py-4 rounded-2xl text-muted-foreground font-black uppercase tracking-widest text-[10px] transition-all flex-1 flex items-center justify-center gap-2 hover:text-foreground cursor-pointer neumorphic-extruded active:scale-[0.98]"
                                        >
                                            {t("Back")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex-[2] flex items-center justify-center gap-2 disabled:opacity-50 neumorphic-primary cursor-pointer active:scale-[0.98]"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>{t("Submitting...")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{t("Submit Request")}</span>
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            , document.body) : null}

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </>
    );
}


