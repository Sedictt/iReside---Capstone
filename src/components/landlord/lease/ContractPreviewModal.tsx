"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Calendar,
    Banknote,
    User,
    Home,
    Mail,
    ShieldCheck,
} from "lucide-react";

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
}

type ApprovalResult = {
    success?: boolean;
    status?: string;
    reviewedAt?: string;
    payment_portal_url?: string;
    payment_pending_expires_at?: string;
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

function addOneYear(isoDate: string) {
    const base = new Date(isoDate);
    if (Number.isNaN(base.getTime())) return isoDateToday();
    const next = new Date(base);
    next.setFullYear(next.getFullYear() + 1);
    return next.toISOString().split("T")[0];
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
    const [leaseStart, setLeaseStart] = useState("");
    const [leaseEnd, setLeaseEnd] = useState("");
    const [monthlyRent, setMonthlyRent] = useState(0);
    const [securityDeposit, setSecurityDeposit] = useState(0);
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [policyConfirmed, setPolicyConfirmed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ApprovalResult | null>(null);

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

        setLeaseStart(initialStart);
        setLeaseEnd(addOneYear(initialStart));
        setMonthlyRent(initialRent);
        setAdvanceAmount(templateAdvance);
        setSecurityDeposit(templateDeposit);
        setPolicyConfirmed(false);
        setSubmitting(false);
        setError(null);
        setResult(null);
    }, [contractData, isOpen]);

    useEffect(() => {
        if (!leaseStart) return;
        setLeaseEnd(addOneYear(leaseStart));
    }, [leaseStart]);

    const isFinalApproval = contractData?.application_status === "payment_pending";

    const canSubmit = useMemo(() => {
        if (isFinalApproval) {
            return !submitting;
        }
        return (
            Boolean(leaseStart) &&
            monthlyRent > 0 &&
            advanceAmount > 0 &&
            securityDeposit > 0 &&
            policyConfirmed &&
            !submitting
        );
    }, [advanceAmount, isFinalApproval, leaseStart, monthlyRent, policyConfirmed, securityDeposit, submitting]);

    if (!isOpen || !contractData) return null;

    const handleFinalize = async () => {
        if (!contractData || !canSubmit) return;
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/landlord/applications/${contractData.application_id}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: isFinalApproval ? "approved" : "payment_pending",
                    ...(isFinalApproval
                        ? {}
                        : {
                              lease_data: {
                                  start_date: leaseStart,
                                  end_date: leaseEnd,
                                  monthly_rent: monthlyRent,
                                  security_deposit: securityDeposit,
                                  terms: {
                                      payment_policy: {
                                          collect_payment_on_application: false,
                                          require_landlord_confirmation_for_uploaded_proof: true,
                                      },
                                  },
                                  landlord_signature: `request-payments-${Date.now()}`,
                              },
                              advance_payment: {
                                  amount: advanceAmount,
                              },
                              security_deposit_payment: {
                                  amount: securityDeposit,
                              },
                          }),
                }),
            });

            const payload = (await response.json()) as ApprovalResult;
            if (!response.ok) {
                throw new Error(
                    payload.error ||
                        (isFinalApproval
                            ? "Failed to finalize approval."
                            : "Failed to request payment submissions.")
                );
            }

            setResult(payload);
            onSuccess?.(payload);
        } catch (submissionError) {
            setError(
                submissionError instanceof Error
                    ? submissionError.message
                    : "Unable to finalize approval right now."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111] border border-white/10 rounded-3xl shadow-2xl z-10"
            >
                <div className="sticky top-0 z-20 bg-[#111] border-b border-white/5 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {isFinalApproval ? "Finalize Approval" : "Request Payments"}
                        </h2>
                        <p className="text-xs text-neutral-400">
                            {isFinalApproval
                                ? "Complete approval after both payment requests are confirmed."
                                : "Move application to payment-pending and send secure portal link."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {result ? (
                        <div className="space-y-6">
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {result.status === "approved" ? "Approval Complete" : "Payment Request Sent"}
                                </h3>
                                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                                    {result.status === "approved"
                                        ? "Tenant approval has been finalized after payment confirmation."
                                        : "Prospect payment portal link generated. Await landlord-confirmed submissions before final approval."}
                                </p>
                                {result.payment_pending_expires_at && (
                                    <p className="mt-2 text-xs text-amber-300">
                                        Portal deadline: {new Date(result.payment_pending_expires_at).toLocaleString("en-PH")}
                                    </p>
                                )}
                                {result.payment_portal_url && (
                                    <a
                                        href={result.payment_portal_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-block text-xs underline text-blue-300"
                                    >
                                        View payment portal link
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-neutral-300">
                                    <Home className="h-4 w-4 text-neutral-500" />
                                    <span className="font-medium text-white">{contractData.property_name}</span>
                                    <span className="text-neutral-500">-</span>
                                    <span>{contractData.unit_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-neutral-300">
                                    <User className="h-4 w-4 text-neutral-500" />
                                    <span>Tenant: <span className="text-white font-medium">{contractData.applicant_name}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-neutral-300">
                                    <Mail className="h-4 w-4 text-neutral-500" />
                                    <span>{contractData.applicant_email}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Lease Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={leaseStart}
                                        onChange={(event) => setLeaseStart(event.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Lease End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={leaseEnd}
                                        disabled
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-neutral-400 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Banknote className="h-3.5 w-3.5" />
                                        Monthly Rent
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={monthlyRent}
                                        onChange={(event) => setMonthlyRent(Number(event.target.value) || 0)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Banknote className="h-3.5 w-3.5" />
                                        Advance Invoice
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={advanceAmount}
                                        onChange={(event) => setAdvanceAmount(Number(event.target.value) || 0)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Banknote className="h-3.5 w-3.5" />
                                        Security Deposit
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={securityDeposit}
                                        onChange={(event) => setSecurityDeposit(Number(event.target.value) || 0)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-100">
                                <p className="font-semibold mb-1">Policy enforcement</p>
                                <p>
                                    Approval creates pending invoices only. Move-in payment completion is counted after
                                    landlord-confirmed proof, not at application submission.
                                </p>
                            </div>

                            {!isFinalApproval && (
                                <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={policyConfirmed}
                                        onChange={(event) => setPolicyConfirmed(event.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent"
                                    />
                                    <span className="text-xs text-neutral-300 leading-relaxed">
                                        I confirm this should start payment-pending stage and send the payment portal
                                        link to the prospect.
                                    </span>
                                </label>
                            )}

                            <button
                                onClick={handleFinalize}
                                disabled={!canSubmit}
                                className={cn(
                                    "w-full h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed",
                                    canSubmit
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                        : "bg-white/10 text-neutral-500"
                                )}
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                                {submitting
                                    ? isFinalApproval
                                        ? "Finalizing..."
                                        : "Requesting..."
                                    : isFinalApproval
                                      ? "Finalize Approval"
                                      : "Request Payments"}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
