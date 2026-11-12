"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    AlertCircle,
    ArrowRightLeft,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    DoorOpen,
    FileCheck2,
    FileSearch,
    Hash,
    Mail,
    PauseCircle,
    RefreshCw,
    XCircle,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguageContext } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import type {
    ApplicationPaymentStage,
    PublicApplicationStatusResponse,
} from "@/app/api/apply/status/route";

type StepVisualState = "completed" | "current" | "upcoming" | "halted";
type BadgeTone = "info" | "warning" | "success" | "danger" | "neutral";

interface MilestoneStep {
    id: string;
    label: string;
    sublabel: string;
    state: StepVisualState;
    icon: typeof CheckCircle2;
}

function formatSafeDate(value: string | null | undefined, locale: string): string {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    try {
        return new Intl.DateTimeFormat(locale || "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(parsed);
    } catch {
        return parsed.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }
}

function resolveStatusSummary(
    data: PublicApplicationStatusResponse,
    t: (phrase: string, params?: Record<string, string | number>) => string
): {
    badgeLabel: string;
    badgeTone: BadgeTone;
    badgeIcon: typeof Clock;
    nextMessage: string;
    stepReadout: string;
} {
    const isCancelledOffer = data.roomOffer?.status === "cancelled";

    if (data.status === "approved") {
        return {
            badgeLabel: t("Application Approved"),
            badgeTone: "success",
            badgeIcon: CheckCircle2,
            nextMessage: t(
                "Your application is approved. Check your email for your account details and next move-in steps."
            ),
            stepReadout: t("Step 4 of 4"),
        };
    }

    if (data.status === "rejected") {
        return {
            badgeLabel: t("Not Approved"),
            badgeTone: "danger",
            badgeIcon: XCircle,
            nextMessage: t(
                "This application was not approved. Check your email for the landlord's update."
            ),
            stepReadout: t("Closed"),
        };
    }

    if (data.status === "withdrawn" || isCancelledOffer) {
        return {
            badgeLabel: t("Application Cancelled"),
            badgeTone: "neutral",
            badgeIcon: XCircle,
            nextMessage: t(
                "This application has been cancelled and is no longer active."
            ),
            stepReadout: t("Closed"),
        };
    }

    if (data.status === "payment_pending") {
        const stage: ApplicationPaymentStage = data.paymentStage ?? "awaiting_upload";

        if (stage === "action_needed") {
            return {
                badgeLabel: t("Payment Needs Attention"),
                badgeTone: "danger",
                badgeIcon: AlertCircle,
                nextMessage: t(
                    "Your landlord requested a payment update. Check your email when action is needed."
                ),
                stepReadout: t("Step 3 of 4"),
            };
        }

        if (stage === "awaiting_verification") {
            return {
                badgeLabel: t("Awaiting Landlord Verification"),
                badgeTone: "info",
                badgeIcon: Clock,
                nextMessage: t(
                    "Your payment was uploaded and is waiting for your landlord to confirm it."
                ),
                stepReadout: t("Step 3 of 4"),
            };
        }

        if (stage === "verified") {
            return {
                badgeLabel: t("Payment Confirmed"),
                badgeTone: "success",
                badgeIcon: CheckCircle2,
                nextMessage: t(
                    "Your move-in payment is confirmed. Check your email for final approval."
                ),
                stepReadout: t("Step 3 of 4"),
            };
        }

        if (stage === "partial_submitted") {
            return {
                badgeLabel: t("Partial Payment Uploaded"),
                badgeTone: "warning",
                badgeIcon: CreditCard,
                nextMessage: t(
                    "One payment was received, and another payment still needs to be uploaded. Check your email for the link."
                ),
                stepReadout: t("Step 3 of 4"),
            };
        }

        return {
            badgeLabel: t("Awaiting Payment Upload"),
            badgeTone: "warning",
            badgeIcon: CreditCard,
            nextMessage: t(
                "Check your email for the payment link so you can upload your move-in payment."
            ),
            stepReadout: t("Step 3 of 4"),
        };
    }

    if (data.status === "reviewing") {
        return {
            badgeLabel: t("Under Landlord Review"),
            badgeTone: "info",
            badgeIcon: FileSearch,
            nextMessage: t(
                "Your landlord is reviewing your application. Check your email when action is needed."
            ),
            stepReadout: t("Step 2 of 4"),
        };
    }

    return {
        badgeLabel: t("Application Submitted"),
        badgeTone: "info",
        badgeIcon: Clock,
        nextMessage: t(
            "Your application has been received and is waiting for landlord review. Check your email when action is needed."
        ),
        stepReadout: t("Step 1 of 4"),
    };
}

function buildMilestoneSteps(
    data: PublicApplicationStatusResponse,
    t: (phrase: string, params?: Record<string, string | number>) => string
): { steps: MilestoneStep[]; railFillPercent: number } {
    const isCancelled = data.status === "withdrawn" || data.roomOffer?.status === "cancelled";
    const isRejected = data.status === "rejected";
    const isApproved = data.status === "approved";
    const isPaymentPending = data.status === "payment_pending";
    const isReviewing = data.status === "reviewing";

    const step1State: StepVisualState = "completed";

    const step2State: StepVisualState = isReviewing
        ? "current"
        : isPaymentPending || isApproved || isRejected
          ? "completed"
          : isCancelled
            ? "halted"
            : "upcoming";

    let paymentSublabel = t("After review");
    if (isPaymentPending) {
        if (data.paymentStage === "awaiting_verification") {
            paymentSublabel = t("Awaiting landlord verification");
        } else if (data.paymentStage === "action_needed") {
            paymentSublabel = t("Payment update needed");
        } else if (data.paymentStage === "verified") {
            paymentSublabel = t("Payment confirmed");
        } else if (data.paymentStage === "partial_submitted") {
            paymentSublabel = t("Awaiting remaining upload");
        } else {
            paymentSublabel = t("Awaiting payment upload");
        }
    } else if (isApproved) {
        paymentSublabel = t("Confirmed");
    } else if (isRejected || isCancelled) {
        paymentSublabel = t("Not required");
    }

    const step3State: StepVisualState = isPaymentPending
        ? "current"
        : isApproved
          ? "completed"
          : isRejected || isCancelled
            ? "halted"
            : "upcoming";

    let outcomeLabel = t("Final Outcome");
    let outcomeSublabel = t("Approval decision");
    let outcomeIcon = CheckCircle2;
    let step4State: StepVisualState = "upcoming";

    if (isApproved) {
        outcomeLabel = t("Approved");
        outcomeSublabel = t("Welcome to your new unit");
        step4State = "completed";
    } else if (isRejected) {
        outcomeLabel = t("Not Approved");
        outcomeSublabel = t("Application closed");
        outcomeIcon = XCircle;
        step4State = "halted";
    } else if (isCancelled) {
        outcomeLabel = t("Cancelled");
        outcomeSublabel = t("Application withdrawn");
        outcomeIcon = XCircle;
        step4State = "halted";
    }

    const steps: MilestoneStep[] = [
        {
            id: "submitted",
            label: t("Application Submitted"),
            sublabel: t("Received"),
            state: step1State,
            icon: FileCheck2,
        },
        {
            id: "review",
            label: t("Under Landlord Review"),
            sublabel: isReviewing
                ? t("In progress")
                : step2State === "completed"
                  ? t("Reviewed")
                  : t("Next step"),
            state: step2State,
            icon: FileSearch,
        },
        {
            id: "payment",
            label: t("Move-In Payment"),
            sublabel: paymentSublabel,
            state: step3State,
            icon: CreditCard,
        },
        {
            id: "outcome",
            label: outcomeLabel,
            sublabel: outcomeSublabel,
            state: step4State,
            icon: outcomeIcon,
        },
    ];

    const railFillPercent = isApproved
        ? 100
        : isPaymentPending
          ? 66.6667
          : isReviewing || isRejected
            ? 33.3333
            : 0;

    return { steps, railFillPercent };
}

const BADGE_STYLES: Record<BadgeTone, string> = {
    info: "border-violet-600/25 bg-violet-600/10 text-violet-800 dark:border-primary/30 dark:bg-primary/15 dark:text-primary",
    warning: "border-amber-600/25 bg-amber-500/12 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300",
    success: "border-emerald-600/25 bg-emerald-500/12 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    danger: "border-red-600/25 bg-red-500/12 text-red-800 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300",
    neutral: "border-border bg-muted text-foreground",
};

function StatusSkeleton() {
    return (
        <div
            aria-busy="true"
            aria-label="Loading application status"
            className="neumorphic-panel rounded-2xl p-6 sm:p-8 space-y-6 animate-pulse motion-reduce:animate-none"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                    <div className="size-12 shrink-0 rounded-xl bg-muted" />
                    <div className="space-y-2 pt-0.5">
                        <div className="h-3.5 w-28 rounded-md bg-muted" />
                        <div className="h-7 w-48 sm:w-56 rounded-lg bg-muted" />
                        <div className="h-4 w-40 rounded-md bg-muted" />
                    </div>
                </div>
                <div className="h-8 w-44 rounded-full bg-muted" />
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4 sm:p-5 space-y-2.5">
                <div className="h-3.5 w-32 rounded-md bg-muted" />
                <div className="h-4 w-full rounded-md bg-muted" />
                <div className="h-4 w-3/4 rounded-md bg-muted" />
            </div>

            <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-36 rounded-md bg-muted" />
                    <div className="h-3.5 w-16 rounded-md bg-muted" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="flex sm:flex-col items-center gap-3">
                            <div className="size-10 shrink-0 rounded-full bg-muted" />
                            <div className="space-y-1.5 sm:text-center">
                                <div className="h-4 w-24 rounded-md bg-muted" />
                                <div className="h-3 w-16 rounded-md bg-muted sm:mx-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <div className="h-3 w-20 rounded-md bg-muted" />
                        <div className="h-4 w-24 rounded-md bg-muted" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-3 w-24 rounded-md bg-muted" />
                        <div className="h-4 w-24 rounded-md bg-muted" />
                    </div>
                </div>
                <div className="h-11 w-full sm:w-36 rounded-xl bg-muted" />
            </div>
        </div>
    );
}

function ApplicationStatusContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token")?.trim() ?? "";
    const { t, locale } = useLanguageContext();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [justChecked, setJustChecked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusData, setStatusData] = useState<PublicApplicationStatusResponse | null>(null);
    const checkedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (checkedTimeoutRef.current) {
                clearTimeout(checkedTimeoutRef.current);
            }
        };
    }, []);

    const fetchStatus = useCallback(
        async (isManualRefresh = false) => {
            if (!token) {
                setError("Missing application status token.");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (isManualRefresh) {
                setRefreshing(true);
                setJustChecked(false);
            } else {
                setLoading(true);
            }

            try {
                const res = await fetch(
                    `/api/apply/status?token=${encodeURIComponent(token)}`,
                    { cache: "no-store" }
                );
                const payload = (await res.json().catch(() => ({}))) as PublicApplicationStatusResponse & {
                    error?: string;
                };

                if (!res.ok) {
                    setStatusData(null);
                    setError(payload.error || "Unable to load application status.");
                } else {
                    setError(null);
                    setStatusData(payload);
                    if (isManualRefresh) {
                        setJustChecked(true);
                        if (checkedTimeoutRef.current) {
                            clearTimeout(checkedTimeoutRef.current);
                        }
                        checkedTimeoutRef.current = setTimeout(() => {
                            setJustChecked(false);
                        }, 3500);
                    }
                }
            } catch {
                if (!isManualRefresh) {
                    setError("Unable to reach the server. Please try again.");
                }
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [token]
    );

    useEffect(() => {
        void fetchStatus(false);
    }, [fetchStatus]);

    const summary = statusData ? resolveStatusSummary(statusData, t) : null;
    const timeline = statusData ? buildMilestoneSteps(statusData, t) : null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <header className="sticky top-0 z-30 w-full border-b border-border/60 bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        <Logo className="h-8 w-28" />
                    </Link>
                    <ThemeToggle className="size-11 sm:size-9 rounded-xl border-border bg-background shadow-2xs" />
                </div>
            </header>

            <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
                {loading && <StatusSkeleton />}

                {!loading && error && (
                    <div className="neumorphic-panel rounded-2xl border-red-500/30 p-6 sm:p-8 text-center space-y-4">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300">
                            <AlertCircle className="size-6" aria-hidden="true" />
                        </div>
                        <div className="space-y-1.5">
                            <h1 className="text-xl font-bold tracking-tight text-foreground text-balance">
                                {t("Status Link Unavailable")}
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty">
                                {t(error)}
                            </p>
                        </div>
                        <div className="pt-2">
                            <Link
                                href="/"
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-violet-700 px-6 text-sm font-semibold text-white hover:bg-violet-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                {t("Back to Home")}
                            </Link>
                        </div>
                    </div>
                )}

                {!loading && statusData && summary && timeline && (
                    <div className="space-y-4">
                        <section
                            aria-label={t("Application Status")}
                            className="neumorphic-panel rounded-2xl p-6 sm:p-8 space-y-6"
                        >
                            {/* Identity & Status Header */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-violet-600/20 bg-violet-600/10 text-violet-700 dark:border-primary/25 dark:bg-primary/15 dark:text-primary">
                                        <Building2 className="size-6" aria-hidden="true" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {t("Application Status")}
                                        </p>
                                        <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-foreground leading-tight break-words text-balance">
                                            {statusData.propertyName}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-sm">
                                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                                                <DoorOpen
                                                    className="size-4 text-violet-700 dark:text-primary shrink-0"
                                                    aria-hidden="true"
                                                />
                                                <span>{statusData.unitName}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/70 px-2 py-0.5 font-mono text-xs sm:text-[13px] font-semibold text-foreground/85 tabular-nums">
                                                <Hash className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                                                <span>{statusData.referenceCode}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 sm:pt-0.5">
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap",
                                            BADGE_STYLES[summary.badgeTone]
                                        )}
                                    >
                                        <summary.badgeIcon className="size-4 shrink-0" aria-hidden="true" />
                                        <span>{summary.badgeLabel}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Plain 1-sentence "What happens next" box */}
                            <div className="rounded-xl border border-border/70 bg-muted/45 dark:bg-white/[0.03] p-4 sm:p-5 flex items-start gap-3.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-violet-700 dark:text-primary shadow-2xs">
                                    <Mail className="size-4" aria-hidden="true" />
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        {t("What happens next")}
                                    </p>
                                    <p className="text-sm sm:text-[15px] font-medium text-foreground leading-relaxed text-pretty">
                                        {summary.nextMessage}
                                    </p>
                                </div>
                            </div>

                            {/* Intermediate / Branching Notices (Read-Only) */}
                            {statusData.unitOnHold && (
                                <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-4 flex items-start gap-3.5">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-600/25 bg-background/80 text-amber-800 dark:text-amber-300">
                                        <PauseCircle className="size-4" aria-hidden="true" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                            {t("Room Temporarily on Hold")}
                                        </p>
                                        <p className="text-sm text-foreground/90 leading-relaxed text-pretty">
                                            {t(
                                                "Another applicant is finalizing payment for this room. Your application stays active, and your landlord will email you if it reopens or another room is offered."
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {statusData.roomOffer?.status === "pending" && (
                                <div className="rounded-xl border border-violet-600/25 bg-violet-600/[0.06] dark:border-primary/30 dark:bg-primary/10 p-4 flex items-start gap-3.5">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-violet-600/20 bg-background/80 text-violet-700 dark:border-primary/25 dark:text-primary">
                                        <ArrowRightLeft className="size-4" aria-hidden="true" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-bold text-violet-900 dark:text-primary">
                                            {statusData.roomOffer.offeredUnitName
                                                ? t("Alternative Room Offered: {unit}", {
                                                      unit: statusData.roomOffer.offeredUnitName,
                                                  })
                                                : t("Alternative Room Offered")}
                                        </p>
                                        <p className="text-sm text-foreground/90 leading-relaxed text-pretty">
                                            {t(
                                                "Your landlord offered you another room. Check your email to accept the offer or cancel your application."
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {statusData.roomOffer?.status === "accepted" &&
                                statusData.roomOffer.offeredUnitName && (
                                    <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4 flex items-start gap-3.5">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-600/25 bg-background/80 text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 className="size-4" aria-hidden="true" />
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                                                {t("Moved to {unit}", {
                                                    unit: statusData.roomOffer.offeredUnitName,
                                                })}
                                            </p>
                                            <p className="text-sm text-foreground/90 leading-relaxed text-pretty">
                                                {t(
                                                    "Your application was moved to your accepted room and remains active."
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Milestone Stepper: Vertical on < 640px, Continuous Horizontal Track on sm+ */}
                            <div className="pt-1 space-y-5">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-sm font-bold text-foreground">
                                        {t("Application Progress")}
                                    </h2>
                                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                                        {summary.stepReadout}
                                    </span>
                                </div>

                                <div className="relative">
                                    {/* Desktop continuous rail behind the 4 step circles */}
                                    <div
                                        aria-hidden="true"
                                        className="hidden sm:block absolute top-5 left-[12.5%] right-[12.5%] h-0.5 rounded-full bg-border overflow-hidden"
                                    >
                                        <div
                                            className="h-full bg-emerald-600 dark:bg-emerald-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
                                            style={{ width: `${timeline.railFillPercent}%` }}
                                        />
                                    </div>

                                    <ol className="flex flex-col sm:grid sm:grid-cols-4 gap-0 sm:gap-3">
                                        {timeline.steps.map((stepItem, index) => {
                                            const StepIcon = stepItem.icon;
                                            const nextStep = timeline.steps[index + 1];
                                            const isLast = index === timeline.steps.length - 1;
                                            const isCompleted = stepItem.state === "completed";
                                            const isCurrent = stepItem.state === "current";
                                            const isHalted = stepItem.state === "halted";
                                            const isRejectedOutcome =
                                                stepItem.id === "outcome" && statusData.status === "rejected";
                                            const mobileSegmentComplete =
                                                nextStep != null &&
                                                (nextStep.state === "completed" ||
                                                    nextStep.state === "current");

                                            return (
                                                <li
                                                    key={stepItem.id}
                                                    aria-current={isCurrent ? "step" : undefined}
                                                    className="relative flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-3 pb-6 sm:pb-0 last:pb-0 sm:text-center"
                                                >
                                                    {/* Mobile vertical rail */}
                                                    {!isLast && (
                                                        <span
                                                            aria-hidden="true"
                                                            className={cn(
                                                                "sm:hidden absolute left-[19px] top-10 bottom-0 w-0.5 rounded-full",
                                                                mobileSegmentComplete
                                                                    ? "bg-emerald-600 dark:bg-emerald-500"
                                                                    : "bg-border"
                                                            )}
                                                        />
                                                    )}

                                                    <div
                                                        className={cn(
                                                            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 motion-reduce:transition-none",
                                                            isCompleted &&
                                                                "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950",
                                                            isCurrent &&
                                                                "border-violet-700 bg-violet-700 text-white ring-4 ring-violet-600/15 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:ring-primary/20",
                                                            isHalted &&
                                                                (isRejectedOutcome
                                                                    ? "border-red-600/40 bg-red-500/12 text-red-700 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-300"
                                                                    : "border-border bg-muted text-muted-foreground"),
                                                            stepItem.state === "upcoming" &&
                                                                "border-border bg-card text-muted-foreground"
                                                        )}
                                                    >
                                                        {isCompleted ? (
                                                            <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                                                        ) : (
                                                            <StepIcon className="size-4" aria-hidden="true" />
                                                        )}
                                                    </div>

                                                    <div className="space-y-0.5 pt-1 sm:pt-0 min-w-0">
                                                        <p
                                                            className={cn(
                                                                "text-sm font-semibold leading-snug",
                                                                isCurrent || isCompleted
                                                                    ? "text-foreground"
                                                                    : isRejectedOutcome
                                                                      ? "text-red-700 dark:text-red-300"
                                                                      : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {stepItem.label}
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                "text-xs leading-snug",
                                                                isCurrent
                                                                    ? "font-semibold text-violet-700 dark:text-primary"
                                                                    : isCompleted
                                                                      ? "font-medium text-emerald-700 dark:text-emerald-400"
                                                                      : "text-muted-foreground"
                                                            )}
                                                        >
                                                            {stepItem.sublabel}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>
                            </div>

                            {/* Dates & Refresh Footer */}
                            <div className="border-t border-border/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <dl className="grid grid-cols-2 gap-6 text-sm">
                                    <div className="space-y-1">
                                        <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                                            <span>{t("Applied On")}</span>
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground tabular-nums">
                                            {formatSafeDate(statusData.appliedAt, locale)}
                                        </dd>
                                    </div>
                                    <div className="space-y-1">
                                        <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                                            <span>{t("Last Updated")}</span>
                                        </dt>
                                        <dd className="text-sm font-semibold text-foreground tabular-nums">
                                            {formatSafeDate(statusData.updatedAt, locale)}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="flex flex-col sm:items-end gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => void fetchStatus(true)}
                                        disabled={refreshing}
                                        aria-busy={refreshing}
                                        className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/60 active:scale-[0.99] disabled:opacity-60 transition-[background-color,transform] duration-150 motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 dark:focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                        <RefreshCw
                                            className={cn(
                                                "size-4 shrink-0",
                                                refreshing && "animate-spin motion-reduce:animate-none"
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span>{refreshing ? t("Checking...") : t("Refresh Status")}</span>
                                    </button>
                                    <span
                                        aria-live="polite"
                                        className={cn(
                                            "text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-opacity duration-200 motion-reduce:transition-none text-center sm:text-right",
                                            justChecked ? "opacity-100" : "opacity-0 select-none"
                                        )}
                                    >
                                        {t("Up to date")}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <p className="text-center text-sm text-muted-foreground px-2 leading-relaxed text-pretty">
                            {t(
                                "This page is view-only. Any required actions, payment steps, or room offers are sent directly to your email."
                            )}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ApplicationStatusPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
                    <div className="h-16 border-b border-border/60 bg-background/90" />
                    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
                        <StatusSkeleton />
                    </div>
                </div>
            }
        >
            <ApplicationStatusContent />
        </Suspense>
    );
}
