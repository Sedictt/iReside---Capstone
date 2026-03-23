"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    X,
    User,
    Phone,
    Mail,
    Briefcase,
    Building2,
    CheckCircle2,
    Circle,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Loader2,
    FileCheck,
    Save,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────
interface WalkInUnit {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
}

interface RequirementsChecklist {
    valid_id: boolean;
    proof_of_income: boolean;
    background_reference: boolean;
    application_form: boolean;
    move_in_payment: boolean;
    [key: string]: boolean;
}

interface EmploymentInfo {
    occupation: string;
    employer: string;
    monthly_income: number | string;
}

interface WalkInFormData {
    applicant_name: string;
    applicant_phone: string;
    applicant_email: string;
    employment_info: EmploymentInfo;
    requirements_checklist: RequirementsChecklist;
    message: string;
}

interface WalkInApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    units: WalkInUnit[];
    selectedUnitId?: string;
    existingApplication?: {
        id: string;
        applicant_name: string;
        applicant_phone: string;
        applicant_email: string;
        employment_info: EmploymentInfo;
        requirements_checklist: RequirementsChecklist;
        message?: string;
    } | null;
    onSuccess?: () => void;
}

const STEPS = [
    { label: "Personal Info", icon: User },
    { label: "Employment", icon: Briefcase },
    { label: "Requirements", icon: FileCheck },
    { label: "Summary", icon: CheckCircle2 },
];

const DEFAULT_CHECKLIST: RequirementsChecklist = {
    valid_id: false,
    proof_of_income: false,
    background_reference: false,
    application_form: false,
    move_in_payment: false,
};

const REQUIREMENT_LABELS: Record<string, string> = {
    valid_id: "Valid Government ID",
    proof_of_income: "Proof of Income / Employment",
    background_reference: "Background / Character Reference",
    application_form: "Application Form Completed",
    move_in_payment: "Move-in Payment Ready",
};

const DEFAULT_EMPLOYMENT: EmploymentInfo = {
    occupation: "",
    employer: "",
    monthly_income: "",
};

export function WalkInApplicationModal({
    isOpen,
    onClose,
    units,
    selectedUnitId,
    existingApplication,
    onSuccess,
}: WalkInApplicationModalProps) {
    const [step, setStep] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState(selectedUnitId || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<WalkInFormData>({
        applicant_name: "",
        applicant_phone: "",
        applicant_email: "",
        employment_info: { ...DEFAULT_EMPLOYMENT },
        requirements_checklist: { ...DEFAULT_CHECKLIST },
        message: "",
    });

    // Pre-fill from existing application (resume flow)
    useEffect(() => {
        if (existingApplication) {
            setFormData({
                applicant_name: existingApplication.applicant_name || "",
                applicant_phone: existingApplication.applicant_phone || "",
                applicant_email: existingApplication.applicant_email || "",
                employment_info: existingApplication.employment_info || { ...DEFAULT_EMPLOYMENT },
                requirements_checklist: {
                    ...DEFAULT_CHECKLIST,
                    ...(existingApplication.requirements_checklist || {}),
                },
                message: existingApplication.message || "",
            });
        }
    }, [existingApplication]);

    // Reset on open
    useEffect(() => {
        if (isOpen && !existingApplication) {
            setStep(0);
            setSelectedUnit(selectedUnitId || "");
            setError(null);
            setFormData({
                applicant_name: "",
                applicant_phone: "",
                applicant_email: "",
                employment_info: { ...DEFAULT_EMPLOYMENT },
                requirements_checklist: { ...DEFAULT_CHECKLIST },
                message: "",
            });
        }
    }, [isOpen, existingApplication, selectedUnitId]);

    const updateField = useCallback((field: keyof WalkInFormData, value: unknown) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleRequirement = useCallback((key: string) => {
        setFormData((prev) => ({
            ...prev,
            requirements_checklist: {
                ...prev.requirements_checklist,
                [key]: !prev.requirements_checklist[key],
            },
        }));
    }, []);

    const allRequirementsMet = Object.values(formData.requirements_checklist).every(Boolean);

    const canAdvance = () => {
        if (step === 0) {
            return formData.applicant_name.trim() && formData.applicant_email.trim() && selectedUnit;
        }
        return true;
    };

    const handleSubmit = async (asPending = false) => {
        setSubmitting(true);
        setError(null);

        try {
            const endpoint = "/api/landlord/applications/walk-in";
            const method = existingApplication ? "PATCH" : "POST";

            const payload = existingApplication
                ? {
                      application_id: existingApplication.id,
                      requirements_checklist: formData.requirements_checklist,
                      employment_info: {
                          ...formData.employment_info,
                          monthly_income: Number(formData.employment_info.monthly_income) || 0,
                      },
                      status: asPending ? "pending" : allRequirementsMet ? "approved" : "pending",
                  }
                : {
                      unit_id: selectedUnit,
                      applicant_name: formData.applicant_name,
                      applicant_phone: formData.applicant_phone,
                      applicant_email: formData.applicant_email,
                      employment_info: {
                          ...formData.employment_info,
                          monthly_income: Number(formData.employment_info.monthly_income) || 0,
                      },
                      requirements_checklist: formData.requirements_checklist,
                      message: formData.message,
                  };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save application.");
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const currentUnit = units.find((u) => u.id === selectedUnit);

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
                <div className="sticky top-0 z-20 bg-[#111] border-b border-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {existingApplication ? "Resume Application" : "New Walk-in Application"}
                            </h2>
                            <p className="text-sm text-neutral-400 mt-1">
                                {existingApplication
                                    ? `Continuing for ${existingApplication.applicant_name}`
                                    : "Record a walk-in tenant inquiry"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.label}
                                onClick={() => i <= step && setStep(i)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-1 justify-center",
                                    i === step
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : i < step
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "bg-white/5 text-neutral-500 border border-white/5"
                                )}
                            >
                                <s.icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* STEP 0: Personal Info */}
                        {step === 0 && (
                            <motion.div
                                key="step-0"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-5"
                            >
                                {/* Unit Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                                        Assign to Unit *
                                    </label>
                                    <select
                                        value={selectedUnit}
                                        onChange={(e) => setSelectedUnit(e.target.value)}
                                        disabled={!!existingApplication}
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors disabled:opacity-50"
                                    >
                                        <option value="">Select a unit...</option>
                                        {units.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.property_name} — {u.name} (₱{u.rent_amount?.toLocaleString()}/mo)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {[
                                    { label: "Full Name *", field: "applicant_name", icon: User, type: "text", placeholder: "e.g. Juan Dela Cruz" },
                                    { label: "Phone Number", field: "applicant_phone", icon: Phone, type: "tel", placeholder: "e.g. 09171234567" },
                                    { label: "Email Address *", field: "applicant_email", icon: Mail, type: "email", placeholder: "e.g. juan@email.com" },
                                ].map((input) => (
                                    <div key={input.field} className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                                            {input.label}
                                        </label>
                                        <div className="relative">
                                            <input.icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                            <input
                                                type={input.type}
                                                placeholder={input.placeholder}
                                                value={formData[input.field as keyof WalkInFormData] as string}
                                                onChange={(e) =>
                                                    updateField(input.field as keyof WalkInFormData, e.target.value)
                                                }
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* STEP 1: Employment */}
                        {step === 1 && (
                            <motion.div
                                key="step-1"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-5"
                            >
                                {[
                                    { label: "Occupation", field: "occupation", icon: Briefcase, placeholder: "e.g. Software Engineer, Teacher" },
                                    { label: "Employer / Company", field: "employer", icon: Building2, placeholder: "e.g. ABC Corp, Self-employed" },
                                ].map((input) => (
                                    <div key={input.field} className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                                            {input.label}
                                        </label>
                                        <div className="relative">
                                            <input.icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                                            <input
                                                type="text"
                                                placeholder={input.placeholder}
                                                value={(formData.employment_info as any)[input.field] || ""}
                                                onChange={(e) =>
                                                    updateField("employment_info", {
                                                        ...formData.employment_info,
                                                        [input.field]: e.target.value,
                                                    })
                                                }
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-neutral-600"
                                            />
                                        </div>
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                                        Monthly Income (₱)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 30000"
                                        value={formData.employment_info.monthly_income}
                                        onChange={(e) =>
                                            updateField("employment_info", {
                                                ...formData.employment_info,
                                                monthly_income: e.target.value,
                                            })
                                        }
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-neutral-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide text-neutral-300">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        placeholder="Any additional information about the applicant..."
                                        value={formData.message}
                                        onChange={(e) => updateField("message", e.target.value)}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors placeholder:text-neutral-600 resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Requirements Checklist */}
                        {step === 2 && (
                            <motion.div
                                key="step-2"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-4"
                            >
                                <p className="text-sm text-neutral-400">
                                    Toggle each requirement as the applicant submits them. Applications with missing
                                    requirements will be saved as <span className="text-amber-400 font-medium">Pending</span>.
                                </p>
                                <div className="space-y-3">
                                    {Object.entries(formData.requirements_checklist).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => toggleRequirement(key)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                                value
                                                    ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            {value ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-neutral-500 shrink-0 group-hover:text-neutral-400" />
                                            )}
                                            <span
                                                className={cn(
                                                    "text-sm font-medium",
                                                    value ? "text-emerald-300" : "text-neutral-300"
                                                )}
                                            >
                                                {REQUIREMENT_LABELS[key] || key}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Summary */}
                        {step === 3 && (
                            <motion.div
                                key="step-3"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                className="space-y-5"
                            >
                                {/* Status badge */}
                                <div
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border",
                                        allRequirementsMet
                                            ? "bg-emerald-500/10 border-emerald-500/20"
                                            : "bg-amber-500/10 border-amber-500/20"
                                    )}
                                >
                                    {allRequirementsMet ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-400" />
                                    )}
                                    <div>
                                        <p
                                            className={cn(
                                                "text-sm font-bold",
                                                allRequirementsMet ? "text-emerald-400" : "text-amber-400"
                                            )}
                                        >
                                            {allRequirementsMet
                                                ? "All Requirements Complete — Ready for Approval"
                                                : "Incomplete Requirements — Will Be Saved as Pending"}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-0.5">
                                            {allRequirementsMet
                                                ? "This application will be marked as approved."
                                                : "The applicant can return later to complete missing items."}
                                        </p>
                                    </div>
                                </div>

                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                                            Applicant
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-white font-medium">{formData.applicant_name || "—"}</p>
                                            <p className="text-neutral-400 text-sm">{formData.applicant_email || "—"}</p>
                                            <p className="text-neutral-400 text-sm">{formData.applicant_phone || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                                            Unit & Employment
                                        </h4>
                                        <div className="space-y-2">
                                            <p className="text-white font-medium">{currentUnit?.name || "—"}</p>
                                            <p className="text-neutral-400 text-sm">
                                                {formData.employment_info.occupation || "No occupation"} @{" "}
                                                {formData.employment_info.employer || "—"}
                                            </p>
                                            <p className="text-neutral-400 text-sm">
                                                Income: ₱
                                                {Number(formData.employment_info.monthly_income || 0).toLocaleString()}
                                                /mo
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Requirements Summary */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">
                                        Requirements ({Object.values(formData.requirements_checklist).filter(Boolean).length}/
                                        {Object.keys(formData.requirements_checklist).length})
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(formData.requirements_checklist).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                {value ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <Circle className="h-4 w-4 text-red-400" />
                                                )}
                                                <span
                                                    className={cn(
                                                        "text-sm",
                                                        value ? "text-neutral-300" : "text-red-300"
                                                    )}
                                                >
                                                    {REQUIREMENT_LABELS[key] || key}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#111] border-t border-white/5 p-6 flex items-center justify-between gap-3">
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-3">
                        {step === 3 && !allRequirementsMet && (
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="h-11 px-5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                Save as Pending
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canAdvance()}
                                className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className={cn(
                                    "h-11 px-6 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50",
                                    allRequirementsMet
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                                        : "bg-primary hover:bg-primary/90 text-black"
                                )}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                {allRequirementsMet ? "Submit & Approve" : "Submit Application"}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
