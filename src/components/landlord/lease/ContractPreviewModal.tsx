"use client";

import { useEffect, useMemo, useState } from "react";
import { m as motion } from "framer-motion";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useLanguageContext } from "@/context/LanguageContext";

import {
    ContractHeader,
    ApplicationInfo,
    LeaseFormFields,
    PolicyConfirmation,
    ContractActions,
} from "./components";

import {
    CheckCircle2,
    AlertCircle,
    Copy,
    Check,
} from "lucide-react";
import type { InvitePaymentTerms } from "@/lib/tenant-invite-payment-terms";
import { useFormValidation } from "@/hooks/useFormValidation";
import type { LeaseFormValues } from "./components/LeaseFormFields";
import {
    advanceAmountRule,
    leaseStartDateRule,
    leaseTermEndDateRule,
    monthlyRentRule,
    securityDepositRule,
} from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { DEFAULT_LEASE_TERM_TYPE, type LeaseTermType } from "@/lib/lease-term";

type ContractTemplateLike = Record<string, unknown>;

interface ContractData {
    application_id: string;
    application_status: "pending" | "reviewing" | "payment_pending" | "approved" | "rejected" | "withdrawn";
    unit_name: string;
    property_name: string;
    property_contract_template: ContractTemplateLike | null;
    applicant_name: string;
    applicant_email: string;
    requested_move_in: string | null;
    monthly_rent: number;
    invite_payment_terms?: InvitePaymentTerms | null;
}

type ApprovalResult = {
    success?: boolean;
    status?: string;
    reviewedAt?: string;
    payment_portal_url?: string;
    payment_pending_expires_at?: string;
    payment_portal_max_uses?: number;
    lease_id?: string;
    payment_ids?: { advance: string; deposit: string };
    tenant_account?: { email: string; tempPassword?: string | null; inviteUrl?: string | null };
    error?: string;
};

interface ContractPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractData: ContractData | null;
    onSuccess?: (result: ApprovalResult) => void;
}

const ADVANCE_TEMPLATE_KEYS = [
    "advance",
    "advance_amount",
    "advance_payment",
    "advance_rent",
    "first_month_advance",
];

const DEPOSIT_TEMPLATE_KEYS = [
    "deposit",
    "security_deposit",
    "security_deposit_amount",
];

function isoDateToday() {
    return new Date().toISOString().split("T")[0];
}

function parseAmount(value: unknown, monthlyRent: number): number | null {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }

    if (typeof value !== "string") return null;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    const monthMatch = normalized.match(/(\d+(?:\.\d+)?)\s*month/);
    if (monthMatch && monthlyRent > 0) {
        const months = Number(monthMatch[1]);
        return Number.isFinite(months) && months > 0 ? months * monthlyRent : null;
    }

    if (normalized.includes("month") && monthlyRent > 0) {
        return monthlyRent;
    }

    const numeric = Number(normalized.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
    }

    return null;
}

function pickTemplateAmount(
    template: ContractTemplateLike | null,
    keys: string[],
    monthlyRent: number
): number | null {
    if (!template) return null;

    const pools: Array<Record<string, unknown>> = [];
    pools.push(template);

    const answers = template["answers"];
    if (answers && typeof answers === "object" && !Array.isArray(answers)) {
        pools.push(answers as Record<string, unknown>);
    }

    const defaults = template["defaults"];
    if (defaults && typeof defaults === "object" && !Array.isArray(defaults)) {
        pools.push(defaults as Record<string, unknown>);
    }

    const paymentDefaults = template["payment_defaults"];
    if (paymentDefaults && typeof paymentDefaults === "object" && !Array.isArray(paymentDefaults)) {
        pools.push(paymentDefaults as Record<string, unknown>);
    }

    for (const pool of pools) {
        for (const key of keys) {
            const parsed = parseAmount(pool[key], monthlyRent);
            if (parsed && parsed > 0) {
                return parsed;
            }
        }
    }

    return null;
}

export function ContractPreviewModal({
    isOpen,
    onClose,
    contractData,
    onSuccess,
}: ContractPreviewModalProps) {
    const { t, locale } = useLanguageContext();
    const [leaseStart, setLeaseStart] = useState("");
    const [termType, setTermType] = useState<LeaseTermType>(DEFAULT_LEASE_TERM_TYPE);
    const [leaseEnd, setLeaseEnd] = useState("");
    const [monthlyRent, setMonthlyRent] = useState(0);
    const [securityDeposit, setSecurityDeposit] = useState(0);
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [portalMaxUses, setPortalMaxUses] = useState<number>(3);
    const [isCustomPortalUses, setIsCustomPortalUses] = useState<boolean>(false);
    const [customPortalUsesInput, setCustomPortalUsesInput] = useState<string>("3");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ApprovalResult | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (!isOpen || !contractData) return;

        const initialStart = contractData.requested_move_in || isoDateToday();
        const initialRent = Number(contractData.monthly_rent || 0);

        const templateAdvance =
            pickTemplateAmount(contractData.property_contract_template, ADVANCE_TEMPLATE_KEYS, initialRent) ??
            initialRent;
        const templateDeposit =
            pickTemplateAmount(contractData.property_contract_template, DEPOSIT_TEMPLATE_KEYS, initialRent) ??
            initialRent;

        const inviteTerms = contractData.invite_payment_terms;
        let initialAdvance = templateAdvance;
        let initialDeposit = templateDeposit;

        if (inviteTerms) {
            if (inviteTerms.customAdvanceAmount !== undefined && inviteTerms.customAdvanceAmount !== null) {
                initialAdvance = Math.max(0, inviteTerms.customAdvanceAmount);
            } else if (typeof inviteTerms.advanceMonths === "number") {
                initialAdvance = Math.max(0, inviteTerms.advanceMonths * initialRent);
            }

            if (inviteTerms.customSecurityDepositAmount !== undefined && inviteTerms.customSecurityDepositAmount !== null) {
                initialDeposit = Math.max(0, inviteTerms.customSecurityDepositAmount);
            } else if (typeof inviteTerms.securityDepositMonths === "number") {
                initialDeposit = Math.max(0, inviteTerms.securityDepositMonths * initialRent);
            }
        }

        setLeaseStart(initialStart);
        // Open-ended (month-to-month) is the default; an end date is only set for fixed terms.
        setTermType(DEFAULT_LEASE_TERM_TYPE);
        setLeaseEnd("");
        setMonthlyRent(initialRent);
        setAdvanceAmount(initialAdvance);
        setSecurityDeposit(initialDeposit);
        setPortalMaxUses(3);
        setIsCustomPortalUses(false);
        setCustomPortalUsesInput("3");
        setSubmitting(false);
        setError(null);
        setResult(null);
    }, [contractData, isOpen]);

    const handleTermTypeChange = (next: LeaseTermType) => {
        setTermType(next);
        if (next !== "fixed") setLeaseEnd("");
    };

    const isFinalApproval = contractData?.application_status === "payment_pending";

    const effectivePortalMaxUses = useMemo(() => {
        if (!isCustomPortalUses) return portalMaxUses;
        const parsed = Number.parseInt(customPortalUsesInput, 10);
        if (!Number.isFinite(parsed) || parsed < 1) return 0;
        return Math.min(50, parsed);
    }, [isCustomPortalUses, portalMaxUses, customPortalUsesInput]);

    // Same rules as the actions API (lease_data / payment amounts).
    const leaseForm = useFormValidation<LeaseFormValues>(
        { leaseStart, termType, leaseEnd, monthlyRent, advanceAmount, securityDeposit },
        {
            leaseStart: (value) => leaseStartDateRule(value),
            leaseEnd: (value, all) => leaseTermEndDateRule(all.termType, value, all.leaseStart),
            monthlyRent: (value) => monthlyRentRule(value),
            advanceAmount: (value) => advanceAmountRule(value),
            securityDeposit: (value) => securityDepositRule(value),
        }
    );

    const canSubmit = useMemo(() => {
        if (isFinalApproval) {
            return !submitting;
        }
        return (
            Boolean(leaseStart) &&
            monthlyRent > 0 &&
            advanceAmount >= 0 &&
            securityDeposit >= 0 &&
            effectivePortalMaxUses >= 1 &&
            effectivePortalMaxUses <= 50 &&
            !submitting
        );
    }, [advanceAmount, effectivePortalMaxUses, isFinalApproval, leaseStart, monthlyRent, securityDeposit, submitting]);

    if (!isOpen || !contractData) return null;

    const handleFinalize = async () => {
        if (!contractData || !canSubmit) return;
        if (!isFinalApproval && !leaseForm.validateAll()) return;
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/landlord/applications/${contractData.application_id}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: isFinalApproval ? "approved" : "payment_pending",
                    ...(!isFinalApproval ? { payment_portal_max_uses: effectivePortalMaxUses } : {}),
                    lease_data: {
                        start_date: leaseStart,
                        term_type: termType,
                        end_date: termType === "fixed" ? leaseEnd : undefined,
                        monthly_rent: monthlyRent,
                        security_deposit: securityDeposit,
                        terms: {
                            payment_policy: {
                                collect_payment_on_application: false,
                                require_landlord_confirmation_for_uploaded_proof: true,
                            },
                        },
                        landlord_signature: `landlord-approval-${Date.now()}`,
                    },
                    advance_payment: {
                        amount: advanceAmount,
                        method: "cash" as const,
                        reference_number: `ADVANCE-${Date.now()}`,
                        paid_at: new Date().toISOString(),
                        status: isFinalApproval ? "completed" : "pending",
                    },
                    security_deposit_payment: {
                        amount: securityDeposit,
                        method: "cash" as const,
                        reference_number: `DEPOSIT-${Date.now()}`,
                        paid_at: new Date().toISOString(),
                        status: isFinalApproval ? "completed" : "pending",
                    },
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as ApprovalResult & { fieldErrors?: Record<string, string> };
            if (!response.ok) {
                if (payload.fieldErrors) {
                    const fe = payload.fieldErrors;
                    const mapped: Record<string, string> = {};
                    if (fe["lease_data.start_date"]) mapped.leaseStart = fe["lease_data.start_date"];
                    if (fe["lease_data.end_date"]) mapped.leaseEnd = fe["lease_data.end_date"];
                    if (fe["lease_data.monthly_rent"]) mapped.monthlyRent = fe["lease_data.monthly_rent"];
                    if (fe["advance_payment.amount"]) mapped.advanceAmount = fe["advance_payment.amount"];
                    if (fe["lease_data.security_deposit"] || fe["security_deposit_payment.amount"]) {
                        mapped.securityDeposit = fe["lease_data.security_deposit"] || fe["security_deposit_payment.amount"];
                    }
                    leaseForm.setServerErrors(mapped);
                }
                throw new Error(
                    payload.error ||
                        (isFinalApproval
                            ? t("Failed to finalize approval.")
                            : t("Failed to request payment submissions."))
                );
            }

            setResult(payload);
            onSuccess?.(payload);
        } catch (submissionError) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : t("Unable to finalize approval right now.")
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/65"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10 }}
                className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-2xl"
            >
                <ContractHeader isFinalApproval={isFinalApproval} onClose={onClose} />

                <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                            <AlertCircle className="size-5 shrink-0 text-rose-500" />
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                        </div>
                    )}

                    {result ? (
                        <div className="space-y-5">
                            <div className="py-4 text-center">
                                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/15">
                                    <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-1.5">
                                    {result.status === "approved" ? t("Tenant Approved") : t("Payment Link Sent")}
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                                    {result.status === "approved"
                                        ? t("Tenant approval has been finalized after payment confirmation.")
                                        : t("A private payment link has been sent to {email}.", { email: contractData.applicant_email })}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                                    {result.payment_pending_expires_at && (
                                        <span>
                                            {t("Deadline:")}{" "}
                                            <ClientOnlyDate
                                                date={result.payment_pending_expires_at}
                                                locale={locale}
                                                format={{ dateStyle: "medium", timeStyle: "short" }}
                                            />
                                        </span>
                                    )}
                                    {result.payment_portal_max_uses && (
                                        <span>
                                            · {t("Valid for up to {count} uses", { count: result.payment_portal_max_uses })}
                                        </span>
                                    )}
                                </div>
                                {result.payment_portal_url && (
                                    <div className="mt-5 space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-left">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-foreground">
                                                {t("Payment Portal Link")}
                                            </span>
                                            <a
                                                href={result.payment_portal_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs font-semibold text-primary hover:underline"
                                            >
                                                {t("Open in Tab →")}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                maxLength={500}
                                                readOnly
                                                value={result.payment_portal_url}
                                                className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-mono text-foreground select-all focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(result.payment_portal_url!);
                                                    setCopiedLink(true);
                                                    setTimeout(() => setCopiedLink(false), 2000);
                                                }}
                                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                                            >
                                                {copiedLink ? <Check className="size-4" /> : <Copy className="size-4" />}
                                                <span>{copiedLink ? t("Copied!") : t("Copy")}</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t("You can share this link directly with the applicant if they cannot check their email right now.")}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-12 w-full rounded-xl border border-border bg-background font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                                {t("Done")}
                            </button>
                        </div>
                    ) : (
                        <>
                            <ApplicationInfo
                                propertyName={contractData.property_name}
                                unitName={contractData.unit_name}
                                applicantName={contractData.applicant_name}
                                applicantEmail={contractData.applicant_email}
                            />

                            {contractData.invite_payment_terms && (
                                <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-xs font-medium text-primary">
                                    {t("Amounts below were pre-filled from the invite link. You can adjust them if needed.")}
                                </div>
                            )}

                            <LeaseFormFields
                                leaseStart={leaseStart}
                                termType={termType}
                                leaseEnd={leaseEnd}
                                monthlyRent={monthlyRent}
                                advanceAmount={advanceAmount}
                                securityDeposit={securityDeposit}
                                portalMaxUses={portalMaxUses}
                                isCustomPortalUses={isCustomPortalUses}
                                customPortalUsesInput={customPortalUsesInput}
                                isFinalApproval={isFinalApproval}
                                onLeaseStartChange={setLeaseStart}
                                onTermTypeChange={handleTermTypeChange}
                                onLeaseEndChange={setLeaseEnd}
                                onMonthlyRentChange={setMonthlyRent}
                                onAdvanceAmountChange={setAdvanceAmount}
                                onSecurityDepositChange={setSecurityDeposit}
                                onPortalMaxUsesPreset={(uses) => {
                                    setIsCustomPortalUses(false);
                                    setPortalMaxUses(uses);
                                    setCustomPortalUsesInput(String(uses));
                                }}
                                onPortalCustomUsesToggle={() => setIsCustomPortalUses(true)}
                                onCustomPortalUsesInputChange={setCustomPortalUsesInput}
                                form={isFinalApproval ? undefined : leaseForm}
                            />

                            <PolicyConfirmation
                                isFinalApproval={isFinalApproval}
                                applicantEmail={contractData.applicant_email}
                            />
                        </>
                    )}
                </div>

                {!result && (
                    <ContractActions
                        canSubmit={canSubmit}
                        submitting={submitting}
                        isFinalApproval={isFinalApproval}
                        onClick={handleFinalize}
                        onCancel={onClose}
                    />
                )}
            </motion.div>
        </div>
    );
}

