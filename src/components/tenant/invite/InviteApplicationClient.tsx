"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldAlert, Upload, X } from "lucide-react";
import Link from "next/link";
import {
    ApplicationIdentityStep,
    ApplicationProfileStep,
    DEFAULT_CHECKLIST,
    DEFAULT_EMPLOYMENT,
    applyLiveFieldValidation,
    type FormErrorKey,
    type WalkInFormData,
    type WalkInUnit,
    validateFormStep,
} from "@/components/landlord/applications/application-intake-shared";
import { cn } from "@/lib/utils";

type InvitePayload = {
    id: string;
    mode: "property" | "unit";
    applicationType: "online" | "face_to_face";
    requiredRequirements: string[];
    propertyId: string;
    propertyName: string;
    unitId: string | null;
    selectedUnit: WalkInUnit | null;
    units: WalkInUnit[];
    expiresAt: string | null;
};

type UploadedRequirementDocument = {
    requirementKey: string;
    url: string;
    fileName: string;
};

const REQUIREMENT_LABELS: Record<string, string> = {
    valid_id: "Government ID",
    proof_of_income: "Proof of Income",
    background_reference: "References",
    application_form: "Application Form",
    move_in_payment: "Advance Payment",
};

export function InviteApplicationClient({ token }: { token: string }) {
    const [invite, setInvite] = useState<InvitePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [uploadingRequirementKey, setUploadingRequirementKey] = useState<string | null>(null);
    const [uploadedDocuments, setUploadedDocuments] = useState<UploadedRequirementDocument[]>([]);
    const [formData, setFormData] = useState<WalkInFormData>({
        applicant_name: "",
        applicant_phone: "",
        applicant_email: "",
        move_in_date: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        employment_info: { ...DEFAULT_EMPLOYMENT },
        requirements_checklist: { ...DEFAULT_CHECKLIST },
        message: "",
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<FormErrorKey, string>>>({});
    const [, setTouchedFields] = useState<Partial<Record<FormErrorKey, boolean>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        const loadInvite = async () => {
            setLoading(true);
            setLoadError(null);
            try {
                const response = await fetch(`/api/invites/${token}`);
                const payload = (await response.json()) as { invite?: InvitePayload; error?: string };
                if (!response.ok || !payload.invite) {
                    throw new Error(payload.error || "Invite is no longer available.");
                }

                if (ignore) return;
                setInvite(payload.invite);
                const initialUnit = payload.invite.selectedUnit?.id ?? payload.invite.unitId ?? "";
                setSelectedUnit(initialUnit);
            } catch (error) {
                if (ignore) return;
                setLoadError(error instanceof Error ? error.message : "Invite is no longer available.");
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        void loadInvite();
        return () => {
            ignore = true;
        };
    }, [token]);

    const currentUnit = useMemo(
        () => invite?.units.find((unit) => unit.id === selectedUnit),
        [invite?.units, selectedUnit]
    );
    const isOnlineInvite = invite?.applicationType === "online";
    const requiredRequirementKeys = useMemo(() => {
        if (!invite || !isOnlineInvite) return [] as string[];
        const keys = invite.requiredRequirements.filter((key) => key in REQUIREMENT_LABELS);
        return keys.length > 0 ? keys : Object.keys(REQUIREMENT_LABELS);
    }, [invite, isOnlineInvite]);
    const totalSteps = isOnlineInvite ? 4 : 3;
    const finalStepIndex = totalSteps - 1;

    const updateField = (
        field: keyof WalkInFormData,
        value: WalkInFormData[keyof WalkInFormData],
        validateKeys: FormErrorKey[] = []
    ) => {
        const nextFormData = { ...formData, [field]: value };
        setFormData(nextFormData);

        if (validateKeys.length > 0) {
            applyLiveFieldValidation({
                nextFormData,
                step,
                selectedUnit,
                setTouchedFields,
                setFormErrors,
                validateKeys,
            });
        }
    };

    const validateCurrentStep = (currentStep: number) => {
        const errors = validateFormStep(currentStep, selectedUnit, formData);
        const stepKeys = currentStep === 0
            ? ["unit", "applicant_name", "applicant_email", "applicant_phone", "move_in_date", "emergency_contact_name", "emergency_contact_phone"]
            : ["occupation", "employer", "monthly_income", "message"];

        setTouchedFields((prev) => ({
            ...prev,
            ...Object.fromEntries(stepKeys.map((key) => [key, true])),
        }));
        setFormErrors((prev) => ({ ...prev, ...errors }));
        return Object.keys(errors).length === 0;
    };

    const toggleRequirement = (key: string) => {
        setFormData((prev) => ({
            ...prev,
            requirements_checklist: {
                ...prev.requirements_checklist,
                [key]: !prev.requirements_checklist[key],
            },
        }));
    };

    const handleUploadRequirementFiles = async (requirementKey: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setSubmitError(null);
        setUploadingRequirementKey(requirementKey);

        try {
            const form = new FormData();
            form.append("requirementKey", requirementKey);
            Array.from(files).forEach((file) => form.append("files", file));

            const response = await fetch(`/api/invites/${token}/documents`, {
                method: "POST",
                body: form,
            });
            const payload = (await response.json()) as {
                error?: string;
                documents?: UploadedRequirementDocument[];
            };

            if (!response.ok || !Array.isArray(payload.documents)) {
                throw new Error(payload.error || "Failed to upload files.");
            }

            setUploadedDocuments((prev) => {
                const next = [...prev, ...payload.documents];
                const dedup = new Map<string, UploadedRequirementDocument>();
                next.forEach((doc) => dedup.set(`${doc.requirementKey}-${doc.url}`, doc));
                return Array.from(dedup.values());
            });

            setFormData((prev) => ({
                ...prev,
                requirements_checklist: {
                    ...prev.requirements_checklist,
                    [requirementKey]: true,
                },
            }));
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to upload files.");
        } finally {
            setUploadingRequirementKey(null);
        }
    };

    const removeUploadedDocument = (docUrl: string) => {
        setUploadedDocuments((prev) => prev.filter((doc) => doc.url !== docUrl));
    };

    const handleSubmit = async () => {
        const stepZeroErrors = validateFormStep(0, selectedUnit, formData);
        const stepOneErrors = validateFormStep(1, selectedUnit, formData);
        const allErrors = { ...stepZeroErrors, ...stepOneErrors };
        if (Object.keys(allErrors).length > 0) {
            setFormErrors(allErrors);
            setTouchedFields((prev) => ({
                ...prev,
                ...Object.fromEntries(Object.keys(allErrors).map((key) => [key, true])),
            }));
            setStep(Object.keys(stepZeroErrors).length > 0 ? 0 : 1);
            return;
        }

        if (isOnlineInvite) {
            for (const key of requiredRequirementKeys) {
                const checked = Boolean(formData.requirements_checklist[key]);
                const hasDoc = uploadedDocuments.some((doc) => doc.requirementKey === key);
                const needsPhoto = key !== "application_form";
                if (!checked || (needsPhoto && !hasDoc)) {
                    setSubmitError(`Complete uploads for ${REQUIREMENT_LABELS[key]}.`);
                    setStep(2);
                    return;
                }
            }
        }

        setSubmitting(true);
        setSubmitError(null);
        try {
            const response = await fetch(`/api/invites/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unit_id: selectedUnit,
                    applicant_name: formData.applicant_name,
                    applicant_phone: formData.applicant_phone,
                    applicant_email: formData.applicant_email,
                    move_in_date: formData.move_in_date,
                    emergency_contact_name: formData.emergency_contact_name,
                    emergency_contact_phone: formData.emergency_contact_phone,
                    employment_info: {
                        ...formData.employment_info,
                        monthly_income: Number(formData.employment_info.monthly_income) || 0,
                    },
                    requirements_checklist: formData.requirements_checklist,
                    uploaded_documents: uploadedDocuments,
                    message: formData.message,
                }),
            });
            const payload = (await response.json()) as { error?: string };
            if (!response.ok) {
                throw new Error(payload.error || "Failed to submit application.");
            }
            setSubmitted(true);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to submit application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-bold tracking-wide text-slate-300">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading private invite...
                </div>
            </div>
        );
    }

    if (loadError || !invite) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center px-6">
                <div className="max-w-lg rounded-3xl border border-amber-500/20 bg-white/5 p-8 text-center">
                    <ShieldAlert className="mx-auto h-10 w-10 text-amber-400" />
                    <h1 className="mt-4 text-2xl font-black tracking-tight">Invite unavailable</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{loadError || "This invite is no longer available."}</p>
                    <Link href="/login" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0f1218] text-white flex items-center justify-center px-6">
                <div className="max-w-xl rounded-[2rem] border border-emerald-500/20 bg-white/5 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                    <h1 className="mt-4 text-3xl font-black tracking-tight">Application submitted</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                        Your application for {invite.propertyName} is now in the landlord&apos;s private review queue. You&apos;ll only receive an account after approval.
                    </p>
                    <Link href="/login" className="mt-6 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400">
                        Done
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1218] text-white">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
                <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300">Private tenant intake</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight">{invite.propertyName}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                        {isOnlineInvite
                            ? "This is an online application invite. Upload required requirement photos before final submission."
                            : "This is a face-to-face intake invite. Submit your details and the landlord will complete document verification in person."}
                    </p>
                </div>

                {submitError && (
                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
                        {submitError}
                    </div>
                )}

                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-10">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Step {step + 1} of {totalSteps}</p>
                            <h2 className="mt-2 text-2xl font-black tracking-tight">
                                {step === 0
                                    ? "Applicant details"
                                    : step === 1
                                        ? "Employment profile"
                                        : isOnlineInvite && step === 2
                                            ? "Upload requirements"
                                            : "Review and submit"}
                            </h2>
                        </div>
                    </div>

                    {step === 0 && (
                        <ApplicationIdentityStep
                            formData={formData}
                            formErrors={formErrors}
                            selectedUnit={selectedUnit}
                            units={invite.units}
                            currentUnit={currentUnit}
                            lockUnit={invite.mode === "unit"}
                            showUnitSelector={true}
                            onSelectedUnitChange={setSelectedUnit}
                            onTouchedUnit={() => setTouchedFields((prev) => ({ ...prev, unit: true }))}
                            onValidateUnit={(nextUnit) => {
                                const errors = validateFormStep(step, nextUnit, formData);
                                setFormErrors((prev) => ({ ...prev, unit: errors.unit }));
                                return errors.unit;
                            }}
                            onFieldChange={updateField}
                        />
                    )}

                    {step === 1 && (
                        <ApplicationProfileStep
                            formData={formData}
                            formErrors={formErrors}
                            selectedUnit={selectedUnit}
                            units={invite.units}
                            currentUnit={currentUnit}
                            onSelectedUnitChange={setSelectedUnit}
                            onFieldChange={updateField}
                            messageLabel="Additional Notes"
                            messagePlaceholder="Add anything the landlord should know about your move-in timing, household setup, or application context."
                        />
                    )}

                    {isOnlineInvite && step === 2 && (
                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-slate-300">
                                Upload at least one clear photo for each required document.
                            </p>
                            {requiredRequirementKeys.map((key) => {
                                const docs = uploadedDocuments.filter((doc) => doc.requirementKey === key);
                                const checked = Boolean(formData.requirements_checklist[key]);
                                return (
                                    <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">
                                                {REQUIREMENT_LABELS[key] ?? key}
                                            </p>
                                            <div className="flex gap-2">
                                                {key !== "application_form" && (
                                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] hover:bg-white/10">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        {uploadingRequirementKey === key ? "Uploading..." : "Upload"}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            disabled={uploadingRequirementKey !== null}
                                                            onChange={(event) => {
                                                                void handleUploadRequirementFiles(key, event.target.files);
                                                                event.target.value = "";
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRequirement(key)}
                                                    className={cn(
                                                        "rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.15em]",
                                                        checked
                                                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                                            : "border-white/10 bg-white/5 text-slate-300"
                                                    )}
                                                >
                                                    {checked ? "Ready" : "Mark Ready"}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            {key === "application_form" ? (
                                                <p className="text-xs text-slate-400">No photo upload required for this item.</p>
                                            ) : docs.length === 0 ? (
                                                <p className="text-xs text-slate-400">No uploaded photos yet.</p>
                                            ) : (
                                                docs.map((doc) => (
                                                    <div key={doc.url} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f1218] px-3 py-2 text-xs">
                                                        <a className="truncate text-blue-300 hover:text-blue-200" href={doc.url} target="_blank" rel="noreferrer">
                                                            {doc.fileName}
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUploadedDocument(doc.url)}
                                                            className="rounded-md border border-white/10 p-1 text-slate-300 hover:bg-white/10"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {step === finalStepIndex && (
                        <div className="grid gap-5 sm:grid-cols-2">
                            <SummaryCard label="Property" value={invite.propertyName} />
                            <SummaryCard label="Unit" value={currentUnit?.name ?? "Not selected"} />
                            <SummaryCard label="Applicant" value={formData.applicant_name || "Not provided"} />
                            <SummaryCard label="Email" value={formData.applicant_email || "Not provided"} />
                            <SummaryCard label="Move-in date" value={formData.move_in_date || "Not provided"} />
                            <SummaryCard label="Monthly income" value={formData.employment_info.monthly_income ? `P${Number(formData.employment_info.monthly_income).toLocaleString()}` : "Not provided"} />
                            {isOnlineInvite && (
                                <SummaryCard label="Uploaded Requirement Photos" value={`${uploadedDocuments.length} file(s)`} />
                            )}
                            <div className="sm:col-span-2 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Notes</p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-200">{formData.message || "No additional notes provided."}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                            {invite.expiresAt ? `Invite expires ${new Date(invite.expiresAt).toLocaleString()}` : "Single-use private invite"}
                        </div>
                        <div className="flex gap-3">
                            {step > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setStep((current) => current - 1)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </button>
                            )}
                            {step < finalStepIndex ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (step <= 1) {
                                            if (validateCurrentStep(step)) setStep((current) => current + 1);
                                            return;
                                        }
                                        setStep((current) => current + 1);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500"
                                >
                                    Continue
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400",
                                        submitting && "opacity-70"
                                    )}
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Submit Application
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</p>
            <p className="mt-3 text-lg font-black tracking-tight text-white">{value}</p>
        </div>
    );
}
