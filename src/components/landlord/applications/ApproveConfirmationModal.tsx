"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Home, Loader2, ShieldCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollableWithHint } from "@/components/ui/ScrollableWithHint";
import { useLanguageContext } from "@/context/LanguageContext";

interface ApproveConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    submitting?: boolean;
    applicantName: string;
    applicantOccupation?: string | null;
    monthlyIncomeFormatted?: string | null;
    propertyName: string;
    unitLabel: string;
    monthlyRentFormatted: string;
    competingApplicantsCount?: number;
    errorMessage?: string | null;
}

export function ApproveConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    submitting = false,
    applicantName,
    applicantOccupation,
    monthlyIncomeFormatted,
    propertyName,
    unitLabel,
    monthlyRentFormatted,
    competingApplicantsCount = 0,
    errorMessage = null,
}: ApproveConfirmationModalProps) {
    const { t } = useLanguageContext();
    const [mounted, setMounted] = useState(false);
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        setAcknowledged(false);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) {
                onClose();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose, submitting]);

    if (!mounted || !isOpen) return null;

    const firstName = applicantName.trim().split(/\s+/)[0] || applicantName;

    const handleConfirmClick = () => {
        if (submitting || !acknowledged) return;
        void onConfirm();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[320] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
            onClick={() => {
                if (!submitting) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-confirm-title"
        >
            <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-card border border-border/70 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-muted sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/60 shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            <ShieldCheck className="size-6" />
                        </div>
                        <div className="min-w-0">
                            <h2
                                id="approve-confirm-title"
                                className="text-lg sm:text-xl font-black tracking-tight text-foreground"
                            >
                                {t("Confirm Tenant Approval")}
                            </h2>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {t("Please review the details carefully before confirming.")}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        aria-label={t("Close")}
                        className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <ScrollableWithHint
                    className="overscroll-contain"
                    contentClassName="px-6 py-5 space-y-4"
                    fadeColor="card"
                    resetKey={isOpen ? applicantName : "closed"}
                    hintText={t("More details below • Scroll down")}
                >
                    {/* Verification Summary Box */}
                    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 divide-y divide-border/50 text-sm">
                        <div className="flex items-center justify-between gap-4 pb-2.5">
                            <span className="text-muted-foreground shrink-0">{t("Applicant")}</span>
                            <div className="text-right min-w-0">
                                <p className="font-black text-foreground truncate">{applicantName}</p>
                                {(applicantOccupation || monthlyIncomeFormatted) && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {applicantOccupation || t("Not stated")}
                                        {monthlyIncomeFormatted ? ` • ${monthlyIncomeFormatted}/mo` : ""}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-2.5">
                            <span className="text-muted-foreground shrink-0 flex items-center gap-1.5">
                                <Home className="size-4 text-primary shrink-0" />
                                {t("Room")}
                            </span>
                            <div className="text-right min-w-0">
                                <p className="font-bold text-foreground truncate">{unitLabel}</p>
                                <p className="text-xs text-muted-foreground truncate">{propertyName}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2.5">
                            <span className="text-muted-foreground shrink-0">{t("Monthly Rent")}</span>
                            <span className="font-black text-foreground tabular-nums text-base">
                                {monthlyRentFormatted}
                            </span>
                        </div>
                    </div>

                    {/* Competing Applicants Warning */}
                    {competingApplicantsCount > 0 && (
                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
                            <Users className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 text-sm">
                                <p className="font-bold text-foreground">
                                    {t("{count} other person(s) also applied for {unit}.", {
                                        count: competingApplicantsCount,
                                        unit: unitLabel,
                                    })}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("Right after approving, you will be able to offer another vacant room or politely decline the remaining applicant(s).")}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Plain-English Effects */}
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            {t("What happens when you confirm:")}
                        </p>
                        <ul className="space-y-1.5 text-sm text-foreground/90">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{t("Creates the tenant account right away without waiting for online payment.")}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{t("Marks {unit} as occupied so new applicants cannot book it.", { unit: unitLabel })}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Explicit Double-Check Box */}
                    <div className="space-y-2">
                        <label
                            className={cn(
                                "flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors min-h-[56px]",
                                acknowledged
                                    ? "border-emerald-500/50 bg-emerald-500/10"
                                    : "border-border bg-muted/20 hover:bg-muted/40"
                            )}
                        >
                            <input
                                type="checkbox"
                                checked={acknowledged}
                                disabled={submitting}
                                onChange={(e) => setAcknowledged(e.target.checked)}
                                className="mt-0.5 size-5 rounded border-border text-emerald-600 focus:ring-emerald-600 shrink-0"
                            />
                            <span className="text-sm font-bold text-foreground leading-snug">
                                {t("Yes, I reviewed the details above and want to approve {name} for {unit}.", {
                                    name: applicantName,
                                    unit: unitLabel,
                                })}
                            </span>
                        </label>

                        {errorMessage && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                    </div>
                </ScrollableWithHint>

                {/* Footer */}
                <div className="border-t border-border/60 bg-card px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="flex-1 min-h-[48px] rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {t("No, Go Back")}
                    </button>
                    <button
                        type="button"
                        disabled={submitting || !acknowledged}
                        aria-busy={submitting}
                        onClick={handleConfirmClick}
                        className={cn(
                            "flex-[1.5] min-h-[48px] rounded-xl px-5 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                            acknowledged
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-60"
                                : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-70"
                        )}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin shrink-0" />
                                <span>{t("Approving...")}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4 shrink-0" />
                                <span>{t("Approve {name}", { name: firstName })}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
