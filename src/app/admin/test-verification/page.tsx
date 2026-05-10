"use client";

import { useState } from "react";
import {
    ExternalLink,
    LoaderCircle,
    Search,
    ShieldCheck,
    ShieldX,
    CircleDashed,
} from "lucide-react";

interface VerificationResult {
    status: 'verified' | 'not_found' | 'error';
    data?: {
        businessName?: string;
        address?: string;
        owner?: string;
        permitNumber?: string;
        [key: string]: any;
    };
    error?: string;
    checkedAt: string;
    source: string;
}

const VERIFICATION_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    not_verified: { label: "Not Verified", color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.24)", icon: CircleDashed },
    verified: { label: "Verified", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.24)", icon: ShieldCheck },
    not_found: { label: "Not Found", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.24)", icon: ShieldX },
    error: { label: "Error", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.24)", icon: ShieldX },
};

export default function TestVerificationPage() {
    const [businessName, setBusinessName] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [manualSearchURL, setManualSearchURL] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!businessName.trim()) {
            setError("Business name is required");
            return;
        }

        setVerifying(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/admin/registrations/test-verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    businessName: businessName.trim(),
                    businessAddress: businessAddress.trim() || undefined,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || "Verification failed");
            }

            setResult(payload.verification);
            setManualSearchURL(payload.manualSearchURL || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed");
            setResult(null);
        } finally {
            setVerifying(false);
        }
    };

    const handleManualSearch = () => {
        if (manualSearchURL) {
            window.open(manualSearchURL, "_blank");
        }
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div
                            className="size-8 rounded-lg flex items-center justify-center"
                            style={{ background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.28)" }}
                        >
                            <Search className="size-5 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Business Verification Test</h1>
                    </div>
                    <p className="text-sm text-neutral-500 ml-10">
                        Test the Valenzuela City Business Directory verification feature without going through the full registration workflow.
                    </p>
                </div>

                <div
                    className="rounded-2xl p-6 mb-6"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                    <h2 className="text-lg font-semibold text-white mb-4">Test Configuration</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                Business Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Enter business name to verify"
                                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)" }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                Business Address (optional)
                            </label>
                            <input
                                type="text"
                                value={businessAddress}
                                onChange={(e) => setBusinessAddress(e.target.value)}
                                placeholder="Enter business address for more accurate results"
                                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ background: "#090909", border: "1px solid rgba(255,255,255,0.08)" }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={verifying}
                                onClick={handleVerify}
                                className="px-6 py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center gap-2"
                                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.22)", color: "#60a5fa" }}
                            >
                                {verifying ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="size-4" />
                                        Verify Business
                                    </>
                                )}
                            </button>

                            {manualSearchURL && (
                                <button
                                    type="button"
                                    onClick={handleManualSearch}
                                    className="px-6 py-3 rounded-xl text-sm font-semibold transition-opacity flex items-center gap-2"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8a8a8a" }}
                                >
                                    <ExternalLink className="size-4" />
                                    Manual Search
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div
                        className="rounded-2xl p-4 mb-6"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldX className="size-5" />
                            <span className="font-semibold">Error</span>
                        </div>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}

                {result && (
                    <div
                        className="rounded-2xl p-6"
                        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Verification Results</h2>
                        
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                {(() => {
                                    const StatusIcon = VERIFICATION_STATUS_META[result.status]?.icon || CircleDashed;
                                    const meta = VERIFICATION_STATUS_META[result.status] || VERIFICATION_STATUS_META.not_verified;
                                    return <StatusIcon className="size-5" style={{ color: meta.color }} />;
                                })()}
                                <span
                                    className="text-lg font-semibold"
                                    style={{ color: VERIFICATION_STATUS_META[result.status]?.color || "#6b7280" }}
                                >
                                    {VERIFICATION_STATUS_META[result.status]?.label || "Unknown"}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500">
                                Checked: {new Date(result.checkedAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-500">
                                Source: {result.source}
                            </p>
                        </div>

                        {result.data && (
                            <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                <p className="text-sm font-semibold text-white mb-2">Business Details</p>
                                <div className="space-y-1">
                                    <p className="text-sm text-neutral-200">
                                        <span className="text-neutral-500">Name:</span> {result.data.businessName || "N/A"}
                                    </p>
                                    <p className="text-sm text-neutral-200">
                                        <span className="text-neutral-500">Address:</span> {result.data.address || "N/A"}
                                    </p>
                                    {result.data.owner && (
                                        <p className="text-sm text-neutral-200">
                                            <span className="text-neutral-500">Owner:</span> {result.data.owner}
                                        </p>
                                    )}
                                    {result.data.permitNumber && (
                                        <p className="text-sm text-neutral-200">
                                            <span className="text-neutral-500">Permit #:</span> {result.data.permitNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {result.error && (
                            <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
                                <p className="text-sm font-semibold text-red-400 mb-1">Error Details</p>
                                <p className="text-sm text-neutral-300">{result.error}</p>
                            </div>
                        )}

                        <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                            <p className="text-xs font-semibold text-blue-400 mb-1">Raw Response Data</p>
                            <pre className="text-xs text-neutral-300 overflow-x-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div
                    className="rounded-2xl p-6 mt-6"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                    <h3 className="text-sm font-semibold text-white mb-3">Testing Tips</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">1.</span>
                            <span>Try entering a known Valenzuela business name (e.g., "Jollibee", "SM Supermalls")</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">2.</span>
                            <span>Test with businesses that don't exist to see "Not Found" status</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">3.</span>
                            <span>Use "Manual Search" to compare automated results with the official website</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">4.</span>
                            <span>Check browser console and network tab for detailed debugging information</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400">5.</span>
                            <span>Review the raw response data to understand the verification structure</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
