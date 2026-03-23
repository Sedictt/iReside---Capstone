"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    FileText,
    Pen,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Calendar,
    Banknote,
    User,
    Home,
    Copy,
    Mail,
} from "lucide-react";

interface ContractData {
    application_id: string;
    unit_id: string;
    unit_name: string;
    property_name: string;
    applicant_name: string;
    applicant_email: string;
    monthly_rent: number;
}

interface ContractPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractData: ContractData | null;
    onSuccess?: (result: { tenant: { email: string; tempPassword: string | null }; message: string }) => void;
}

export function ContractPreviewModal({
    isOpen,
    onClose,
    contractData,
    onSuccess,
}: ContractPreviewModalProps) {
    const [leaseStart, setLeaseStart] = useState("");
    const [leaseEnd, setLeaseEnd] = useState("");
    const [securityDeposit, setSecurityDeposit] = useState("");
    const [landlordSigned, setLandlordSigned] = useState(false);
    const [tenantSigned, setTenantSigned] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        tenant: { email: string; tempPassword: string | null };
        message: string;
    } | null>(null);

    if (!isOpen || !contractData) return null;

    const bothSigned = landlordSigned && tenantSigned;
    const canSubmit = bothSigned && leaseStart && leaseEnd;

    const handleFinalize = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/landlord/lease/finalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    application_id: contractData.application_id,
                    unit_id: contractData.unit_id,
                    lease_start: leaseStart,
                    lease_end: leaseEnd,
                    monthly_rent: contractData.monthly_rent,
                    security_deposit: Number(securityDeposit) || 0,
                    landlord_signature: "digital_signature_landlord",
                    tenant_signature: "digital_signature_tenant",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to finalize lease.");
            }

            setResult({
                tenant: data.tenant,
                message: data.message,
            });
            onSuccess?.(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
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
                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#111] border-b border-white/5 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Lease Agreement</h2>
                            <p className="text-xs text-neutral-400">Review and sign to finalize</p>
                        </div>
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

                    {/* Success State */}
                    {result ? (
                        <div className="space-y-6">
                            <div className="text-center py-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Lease Finalized!</h3>
                                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                                    {result.message}
                                </p>
                            </div>

                            {result.tenant.tempPassword && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 space-y-4">
                                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Tenant Account Credentials
                                    </h4>
                                    <p className="text-xs text-neutral-400">
                                        Share these credentials with the new tenant so they can log in:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                                            <div>
                                                <p className="text-xs text-neutral-500">Email</p>
                                                <p className="text-white font-mono text-sm">{result.tenant.email}</p>
                                            </div>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(result.tenant.email)}
                                                className="p-2 text-neutral-400 hover:text-white transition-colors"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-3">
                                            <div>
                                                <p className="text-xs text-neutral-500">Temporary Password</p>
                                                <p className="text-white font-mono text-sm">{result.tenant.tempPassword}</p>
                                            </div>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(result.tenant.tempPassword!)}
                                                className="p-2 text-neutral-400 hover:text-white transition-colors"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Contract Preview */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                                    Contract Details
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 text-neutral-300">
                                        <Home className="h-4 w-4 text-neutral-500" />
                                        <span className="font-medium text-white">{contractData.property_name}</span>
                                        <span className="text-neutral-500">—</span>
                                        <span>{contractData.unit_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-neutral-300">
                                        <User className="h-4 w-4 text-neutral-500" />
                                        <span>Tenant: <span className="text-white font-medium">{contractData.applicant_name}</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-neutral-300">
                                        <Banknote className="h-4 w-4 text-neutral-500" />
                                        <span>Monthly Rent: <span className="text-white font-medium">₱{contractData.monthly_rent.toLocaleString()}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Lease Terms */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Lease Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={leaseStart}
                                        onChange={(e) => setLeaseStart(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Lease End Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={leaseEnd}
                                        onChange={(e) => setLeaseEnd(e.target.value)}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-2">
                                    <Banknote className="h-3.5 w-3.5" />
                                    Security Deposit (₱)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 20000"
                                    value={securityDeposit}
                                    onChange={(e) => setSecurityDeposit(e.target.value)}
                                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-neutral-600"
                                />
                            </div>

                            {/* Digital Signatures */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400 flex items-center gap-2">
                                    <Pen className="h-3.5 w-3.5" />
                                    Digital Signatures
                                </h3>
                                <p className="text-xs text-neutral-500">
                                    Both the landlord and the tenant must sign the agreement on this device.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setLandlordSigned(!landlordSigned)}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-6 rounded-xl border transition-all",
                                            landlordSigned
                                                ? "bg-emerald-500/10 border-emerald-500/20"
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        {landlordSigned ? (
                                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                        ) : (
                                            <Pen className="h-8 w-8 text-neutral-500" />
                                        )}
                                        <div className="text-center">
                                            <p className={cn("font-bold text-sm", landlordSigned ? "text-emerald-400" : "text-white")}>
                                                {landlordSigned ? "Landlord Signed ✓" : "Tap to Sign"}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1">Landlord Signature</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setTenantSigned(!tenantSigned)}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-6 rounded-xl border transition-all",
                                            tenantSigned
                                                ? "bg-emerald-500/10 border-emerald-500/20"
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        {tenantSigned ? (
                                            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                        ) : (
                                            <Pen className="h-8 w-8 text-neutral-500" />
                                        )}
                                        <div className="text-center">
                                            <p className={cn("font-bold text-sm", tenantSigned ? "text-emerald-400" : "text-white")}>
                                                {tenantSigned ? "Tenant Signed ✓" : "Tap to Sign"}
                                            </p>
                                            <p className="text-xs text-neutral-500 mt-1">Tenant Signature</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleFinalize}
                                disabled={!canSubmit || submitting}
                                className={cn(
                                    "w-full h-14 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed",
                                    canSubmit
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                                        : "bg-white/10 text-neutral-500"
                                )}
                            >
                                {submitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5" />
                                )}
                                {submitting ? "Finalizing..." : "Finalize Lease & Create Tenant Account"}
                            </button>

                            {!bothSigned && (
                                <p className="text-xs text-center text-neutral-500">
                                    Both signatures are required to finalize the lease.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
