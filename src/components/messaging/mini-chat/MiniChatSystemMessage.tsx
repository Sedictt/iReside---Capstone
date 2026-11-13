"use client";

import { useState } from "react";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    HandCoins,
    History,
    Receipt,
    TrendingUp,
    X,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfficialReceipt } from "@/components/messaging/OfficialReceipt";
import type { MiniChatMessage, MiniChatRole } from "./types";
import { formatTime } from "./utils";
import { useLanguageContext } from "@/context/LanguageContext";

type CardVariant = "default" | "success" | "warning" | "error";

const VARIANT_STYLES: Record<CardVariant, { container: string; iconWrap: string; badge: string }> = {
    default: {
        container: "border-border/80 bg-muted/40",
        iconWrap: "bg-primary/10 text-primary",
        badge: "bg-muted text-muted-foreground",
    },
    success: {
        container: "border-emerald-500/25 bg-emerald-500/5",
        iconWrap: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    warning: {
        container: "border-amber-500/25 bg-amber-500/5",
        iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    error: {
        container: "border-red-500/25 bg-red-500/5",
        iconWrap: "bg-red-500/15 text-red-600 dark:text-red-400",
        badge: "bg-red-500/15 text-red-600 dark:text-red-400",
    },
};

const systemIcon = (type: string) => {
    switch (type) {
        case "awaiting_in_person":
            return <HandCoins className="size-3.5" />;
        case "reminder_sent":
            return <Bell className="size-3.5" />;
        case "invoice":
            return <Receipt className="size-3.5" />;
        case "landlord_review":
            return <History className="size-3.5" />;
        default:
            return <Zap className="size-3.5" />;
    }
};

interface MiniChatSystemMessageProps {
    message: MiniChatMessage;
    viewerRole: MiniChatRole;
}

export function MiniChatSystemMessage({ message, viewerRole }: MiniChatSystemMessageProps) {
    const { t } = useLanguageContext();
    const [expanded, setExpanded] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);

    const isOverpayment = message.issueType === "excessive_amount";
    const isRejected = message.workflowStatus === "rejected";
    const isResolved = Boolean(message.metadata?.isResolved);
    const refundProofUrl = typeof message.metadata?.refundProofUrl === "string" ? message.metadata.refundProofUrl : undefined;
    const timestamp = formatTime(message.createdAt);

    if (message.systemType === "invoice") {
        const meta = (message.metadata ?? {}) as Record<string, unknown>;
        const invoiceNumber =
            (typeof meta.invoiceNumber === "string" && meta.invoiceNumber) ||
            (typeof meta.invoice_number === "string" && meta.invoice_number) ||
            null;
        const rawAmount = meta.amount ?? meta.totalAmount ?? meta.paymentAmount;
        const formattedAmount =
            typeof rawAmount === "number"
                ? `₱${rawAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : typeof rawAmount === "string"
                    ? rawAmount
                    : null;

        return (
            <>
                <div className="w-full max-w-[272px] rounded-xl border border-emerald-500/25 bg-card/95 px-3 py-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Receipt className="size-3.5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-foreground">{t("Payment Receipt")}</p>
                                {invoiceNumber && (
                                    <p className="truncate font-mono text-[10px] text-muted-foreground">{invoiceNumber}</p>
                                )}
                            </div>
                        </div>
                        {formattedAmount ? (
                            <span className="shrink-0 text-[12px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {formattedAmount}
                            </span>
                        ) : (
                            <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {t("Issued")}
                            </span>
                        )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                        <span className="text-[10px] text-muted-foreground">{timestamp}</span>
                        <button
                            type="button"
                            onClick={() => setReceiptOpen(true)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                        >
                            {t("View Receipt")}
                            <ExternalLink className="size-3" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {receiptOpen && (
                    <div
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("Payment Receipt")}
                        onClick={() => setReceiptOpen(false)}
                    >
                        <div
                            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-3 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setReceiptOpen(false)}
                                aria-label={t("Close receipt")}
                                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs hover:bg-muted"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                            <OfficialReceipt message={message as never} role={viewerRole} />
                        </div>
                    </div>
                )}
            </>
        );
    }

    let icon = systemIcon(message.systemType ?? "");
    let title = t("System Notification");
    let badge = timestamp;
    let variant: CardVariant = "default";

    if (message.systemType === "landlord_review") {
        icon = isOverpayment ? (
            <TrendingUp className="size-3.5" />
        ) : isRejected ? (
            <AlertTriangle className="size-3.5" />
        ) : (
            <CheckCircle2 className="size-3.5" />
        );
        title = isOverpayment
            ? isResolved
                ? t("Reconciliation Complete")
                : t("Overpayment Detected")
            : isRejected
                ? t("Payment Rejected")
                : t("Payment Confirmed");
        badge = isResolved ? t("Settled") : t("Logged");
        variant = isOverpayment ? (isResolved ? "success" : "warning") : isRejected ? "error" : "success";
    } else if (message.systemType === "awaiting_in_person" || message.workflowStatus === "awaiting_in_person") {
        icon = <HandCoins className="size-3.5" />;
        title = t("In-Person Payment");
        badge = t("Verify");
        variant = "warning";
    } else if (message.systemType === "payment_submitted") {
        icon = <History className="size-3.5" />;
        title = t("Payment Under Review");
        badge = viewerRole === "landlord" ? t("Review") : t("Pending");
        variant = "warning";
    } else if (message.systemType === "reminder_sent") {
        icon = <Bell className="size-3.5" />;
        title = t("Notice Sent");
        badge = timestamp;
        variant = "default";
    }

    const styles = VARIANT_STYLES[variant];
    const bodyText = message.content?.trim() || "";
    const isLong = bodyText.length > 90 || Boolean(refundProofUrl);

    return (
        <div className={cn("w-full max-w-[272px] rounded-xl border px-3 py-2 shadow-xs", styles.container)}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg", styles.iconWrap)}>
                        {icon}
                    </span>
                    <span className="truncate text-[12px] font-semibold text-foreground">{title}</span>
                </div>
                <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold", styles.badge)}>
                    {badge}
                </span>
            </div>

            {bodyText && (
                <p
                    className={cn(
                        "mt-1.5 text-[11px] leading-snug text-muted-foreground whitespace-pre-wrap break-words",
                        !expanded && "line-clamp-2"
                    )}
                >
                    {bodyText}
                </p>
            )}

            {expanded && refundProofUrl && (
                <a
                    href={refundProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block overflow-hidden rounded-lg border border-border/70"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={refundProofUrl}
                        alt={t("Refund proof")}
                        className="max-h-28 w-full object-cover"
                    />
                </a>
            )}

            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline"
                >
                    {expanded ? (
                        <>
                            {t("Show less")}
                            <ChevronUp className="size-3" aria-hidden="true" />
                        </>
                    ) : (
                        <>
                            {t("Show details")}
                            <ChevronDown className="size-3" aria-hidden="true" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
