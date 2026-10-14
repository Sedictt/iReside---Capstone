"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m as motion } from "framer-motion";
import { AlertCircle, CalendarRange, Infinity as InfinityIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { LeaseDurationPresets } from "@/components/landlord/lease/LeaseTermTypeField";
import {
    formatLeaseDate,
    formatTenure,
    leaseEndDate,
    normalizeTermType,
    type LeaseTermLike,
    type LeaseTermType,
} from "@/lib/lease-term";
import { leaseTermEndDateRule } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { tr } from "@/hooks/useLanguage";

export interface LeaseTermSwitchTarget extends LeaseTermLike {
    id: string;
    tenantName?: string | null;
}

export interface LeaseTermUpdate {
    id: string;
    term_type: LeaseTermType;
    end_date: string | null;
}

interface LeaseTermSwitchDialogProps {
    open: boolean;
    lease: LeaseTermSwitchTarget | null;
    /** Which direction the switch goes. */
    mode: "to_open_ended" | "to_fixed";
    onClose: () => void;
    /** Called with the updated lease returned by the API. */
    onUpdated: (lease: LeaseTermUpdate) => void;
}

function readTermType(payload: Record<string, unknown>): LeaseTermType {
    return normalizeTermType(payload.term_type ?? payload.termType ?? payload.lease_term);
}

/**
 * Confirms switching a lease between open-ended and fixed term and calls
 * PATCH /api/landlord/leases/{id}/term. Fixed terms collect an end date inline.
 */
export function LeaseTermSwitchDialog({ open, lease, mode, onClose, onUpdated }: LeaseTermSwitchDialogProps) {
    const { t, language } = useLanguageContext();
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Reset the form whenever the dialog (re)opens or targets a different lease/mode.
    const resetKey = open ? `${mode}:${lease?.id ?? ""}` : "";
    const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
    if (resetKey !== appliedResetKey) {
        setAppliedResetKey(resetKey);
        setEndDate(mode === "to_fixed" ? leaseEndDate(lease) ?? "" : "");
        setError(null);
        setSubmitting(false);
    }

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, submitting]);

    if (!open || !lease || typeof document === "undefined") return null;

    const toFixed = mode === "to_fixed";
    const startDate = lease.start_date ?? "";
    const tenure = formatTenure(startDate, undefined, language);

    const handleConfirm = async () => {
        if (submitting) return;
        if (toFixed) {
            const message = leaseTermEndDateRule("fixed", endDate, startDate);
            if (message) {
                setError(tr(message));
                return;
            }
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/landlord/leases/${lease.id}/term`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toFixed ? { term_type: "fixed", end_date: endDate } : { term_type: "open_ended" }),
            });
            const payload = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
                error?: string;
                fieldErrors?: Record<string, string>;
                lease?: Record<string, unknown>;
            };
            if (!res.ok) {
                throw new Error(payload.fieldErrors?.end_date || payload.error || t("Failed to update the lease term."));
            }
            const updated = (payload.lease ?? payload) as Record<string, unknown>;
            const nextTermType = readTermType(updated);
            const nextEnd = typeof updated.end_date === "string" ? updated.end_date : nextTermType === "fixed" ? endDate : null;
            onUpdated({ id: lease.id, term_type: nextTermType, end_date: nextTermType === "fixed" ? nextEnd : null });
            toast.success(toFixed ? t("Fixed term set. Lease now ends {date}.", { date: formatLeaseDate(nextEnd, undefined, language) }) : t("Lease switched to open-ended."));
            onClose();
        } catch (err) {
            setError(err instanceof Error ? tr(err.message) : t("Failed to update the lease term."));
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="lease-term-switch-title">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={submitting ? undefined : onClose}
                    className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    onClick={(event) => event.stopPropagation()}
                    className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-card neumorphic-panel border border-border/40 shadow-2xl"
                >
                    <div className="flex items-start justify-between gap-4 border-b border-white/5 neumorphic-inset px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", toFixed ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary")}>
                                {toFixed ? <CalendarRange className="size-5" /> : <InfinityIcon className="size-5" />}
                            </div>
                            <div>
                                <h3 id="lease-term-switch-title" className="text-base font-black tracking-tight text-foreground">
                                    {toFixed ? t("Set a fixed end date") : t("Switch to open-ended")}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    {lease.tenantName ? t("Lease for {name}", { name: lease.tenantName }) : t("Lease term")}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            aria-label={t("Close")}
                            className="rounded-xl neumorphic-inset p-2 text-muted-foreground transition-all hover:text-foreground cursor-pointer disabled:opacity-50"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <div className="space-y-4 px-6 py-5">
                        {toFixed ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    {t("The lease will end on the date you pick and renewal reminders will apply.")}
                                    {startDate
                                        ? " " +
                                          (tenure
                                              ? t("It started {date} ({tenure}).", { date: formatLeaseDate(startDate, undefined, language), tenure })
                                              : t("It started {date}.", { date: formatLeaseDate(startDate, undefined, language) }))
                                        : ""}
                                </p>
                                <div className="space-y-1.5">
                                    <label htmlFor="lease-term-switch-end" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        {t("End Date")}
                                    </label>
                                    <input
                                        id="lease-term-switch-end"
                                        type="date"
                                        autoFocus
                                        min={startDate || "1990-01-01"}
                                        max="2100-12-31"
                                        value={endDate}
                                        onChange={(event) => {
                                            setEndDate(event.target.value);
                                            setError(null);
                                        }}
                                        className={cn(
                                            "w-full rounded-2xl neumorphic-inset px-4 py-3.5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                            error && "border border-red-500/50 ring-2 ring-red-500/20"
                                        )}
                                    />
                                </div>
                                <LeaseDurationPresets
                                    startDate={startDate}
                                    endDate={endDate}
                                    onSelect={(iso) => {
                                        setEndDate(iso);
                                        setError(null);
                                    }}
                                />
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t("The end date will be removed. The tenancy continues month-to-month for as long as rent is paid and ends through the move-out flow with 30 days' notice. No renewal reminders will be sent.")}
                            </p>
                        )}

                        {error && (
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500" role="alert">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{error}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 border-t border-border/50 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 rounded-2xl neumorphic-inset py-3 text-xs font-black uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground cursor-pointer disabled:opacity-50"
                        >
                            {t("Cancel")}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={submitting || (toFixed && !endDate)}
                            className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl neumorphic-primary py-3 text-xs font-black uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                            {toFixed ? t("Set End Date") : t("Switch to Open-ended")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
