"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

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
    destination: {
        accountName: string | null;
        accountNumber: string | null;
        qrImageUrl: string | null;
    } | null;
    requests: PaymentRequestItem[];
    methods: Array<"gcash" | "cash">;
};

type RequestFormState = {
    method: "gcash" | "cash";
    referenceNumber: string;
    note: string;
    proofFile: File | null;
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

function statusLabel(status: PaymentRequestItem["status"]) {
    switch (status) {
        case "pending":
            return "Pending Submission";
        case "processing":
            return "Under Landlord Review";
        case "completed":
            return "Confirmed";
        case "rejected":
            return "Needs Re-Submission";
        case "expired":
            return "Expired";
        default:
            return status;
    }
}

export function ProspectPaymentPortalClient({ token }: { token: string }) {
    const [payload, setPayload] = useState<PortalPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingRequestId, setSavingRequestId] = useState<string | null>(null);
    const [requestForms, setRequestForms] = useState<Record<string, RequestFormState>>({});

    const fullyConfirmed = useMemo(() => {
        if (!payload) return false;
        return payload.requests.every((request) => request.status === "completed");
    }, [payload]);

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
                setRequestForms(
                    Object.fromEntries(
                        data.requests.map((request) => [
                            request.id,
                            {
                                method: request.method === "cash" ? "cash" : "gcash",
                                referenceNumber: request.referenceNumber ?? "",
                                note: request.note ?? "",
                                proofFile: null,
                            },
                        ])
                    )
                );
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

    const updateForm = (requestId: string, next: Partial<RequestFormState>) => {
        const defaultForm: RequestFormState = {
            method: "gcash",
            referenceNumber: "",
            note: "",
            proofFile: null,
        };

        setRequestForms((prev) => ({
            ...prev,
            [requestId]: {
                ...defaultForm,
                ...(prev[requestId] ?? {}),
                ...next,
            },
        }));
    };

    const submitRequest = async (request: PaymentRequestItem) => {
        const state = requestForms[request.id] ?? {
            method: "gcash" as const,
            referenceNumber: "",
            note: "",
            proofFile: null,
        };

        setSavingRequestId(request.id);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("paymentRequestId", request.id);
            formData.append("method", state.method);
            formData.append("referenceNumber", state.referenceNumber);
            formData.append("note", state.note);
            if (state.proofFile) {
                formData.append("proof", state.proofFile);
            }

            const response = await fetch(`/api/application-payments/${token}`, {
                method: "POST",
                body: formData,
            });
            const result = (await response.json()) as {
                error?: string;
                request?: PaymentRequestItem;
            };

            if (!response.ok || !result.request) {
                throw new Error(result.error || "Failed to submit payment request.");
            }

            setPayload((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    requests: prev.requests.map((item) =>
                        item.id === request.id
                            ? {
                                  ...item,
                                  ...result.request,
                              }
                            : item
                    ),
                };
            });
            updateForm(request.id, { proofFile: null });
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Failed to submit request.");
        } finally {
            setSavingRequestId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center p-6">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !payload) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center p-6">
                <div className="max-w-lg w-full rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
                    <ShieldAlert className="mx-auto size-10 text-red-400" />
                    <h1 className="mt-3 text-2xl font-bold">Payment Portal Unavailable</h1>
                    <p className="mt-3 text-sm text-red-200">{error || "This link is invalid or expired."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1218] text-white">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold">Move-in Payment Portal</p>
                    <h1 className="mt-3 text-3xl font-bold">{payload.application.propertyName}</h1>
                    <p className="mt-2 text-sm text-zinc-300">
                        Unit: {payload.application.unitName} | Applicant: {payload.application.applicantName}
                    </p>
                    <p className="mt-2 text-xs text-amber-300">
                        Payment window ends on {formatDateTime(payload.application.deadline)}.
                    </p>
                </div>

                {payload.destination && (
                    <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm">
                        <p className="font-bold text-blue-200">GCash Destination</p>
                        <p className="mt-1 text-blue-100">
                            Account: {payload.destination.accountName || "Not set"} | Number: {payload.destination.accountNumber || "Not set"}
                        </p>
                        {payload.destination.qrImageUrl && (
                            <a
                                href={payload.destination.qrImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block text-xs underline text-blue-200"
                            >
                                View QR code
                            </a>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
                )}

                <div className="mt-6 space-y-4">
                    {payload.requests.map((request) => {
                        const state = requestForms[request.id] ?? {
                            method: request.method === "cash" ? "cash" : "gcash",
                            referenceNumber: request.referenceNumber ?? "",
                            note: request.note ?? "",
                            proofFile: null,
                        };
                        const readOnly = request.status === "completed" || request.status === "expired";

                        return (
                            <section key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="text-lg font-bold">{request.label}</h2>
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                                        {statusLabel(request.status)}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-zinc-300">
                                    Amount: {peso.format(request.amount)} | Due: {request.dueAt || "Before move-in"}
                                </p>
                                {request.reviewNote && (
                                    <p className="mt-2 text-xs text-amber-200">Landlord note: {request.reviewNote}</p>
                                )}

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Method
                                        <select
                                            value={state.method}
                                            disabled={readOnly || savingRequestId === request.id}
                                            onChange={(event) =>
                                                updateForm(request.id, {
                                                    method: event.target.value === "cash" ? "cash" : "gcash",
                                                })
                                            }
                                            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm"
                                        >
                                            <option value="gcash">GCash</option>
                                            <option value="cash">Cash (in person)</option>
                                        </select>
                                    </label>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                        Reference Number
                                        <input
                                            value={state.referenceNumber}
                                            disabled={readOnly || savingRequestId === request.id}
                                            onChange={(event) => updateForm(request.id, { referenceNumber: event.target.value })}
                                            placeholder={state.method === "cash" ? "Optional for cash" : "GCash reference"}
                                            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm"
                                        />
                                    </label>
                                </div>

                                <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Note
                                    <textarea
                                        value={state.note}
                                        disabled={readOnly || savingRequestId === request.id}
                                        onChange={(event) => updateForm(request.id, { note: event.target.value })}
                                        rows={2}
                                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm"
                                        placeholder={state.method === "cash" ? "Add your in-person handoff details" : "Optional transfer note"}
                                    />
                                </label>

                                <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                                    Proof Upload {state.method === "gcash" ? "(Required for GCash)" : "(Optional for cash)"}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        disabled={readOnly || savingRequestId === request.id}
                                        onChange={(event) =>
                                            updateForm(request.id, {
                                                proofFile: event.target.files?.[0] ?? null,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm"
                                    />
                                </label>
                                {request.proofUrl && (
                                    <a
                                        href={request.proofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-2 inline-block text-xs underline text-blue-300"
                                    >
                                        View current proof
                                    </a>
                                )}

                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-xs text-zinc-400">
                                        Submitted: {formatDateTime(request.submittedAt)} | Reviewed: {formatDateTime(request.reviewedAt)}
                                    </p>
                                    <button
                                        type="button"
                                        disabled={readOnly || savingRequestId === request.id}
                                        onClick={() => void submitRequest(request)}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-black disabled:opacity-50"
                                    >
                                        {savingRequestId === request.id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="size-4" />
                                        )}
                                        {request.status === "rejected" ? "Resubmit" : "Submit"}
                                    </button>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {fullyConfirmed && (
                    <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                        Both required payments are confirmed. The landlord can now perform final approval.
                    </div>
                )}
            </div>
        </div>
    );
}


