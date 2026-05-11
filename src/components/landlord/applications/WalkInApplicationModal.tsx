"use client";

import { useState, useEffect, useCallback, useMemo, type ChangeEvent, type ElementType, type InputHTMLAttributes, type ReactNode } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import {
    X,
    User,
    Phone,
    Mail,
    Briefcase,
    Building2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Loader2,
    FileCheck,
    Save,
    Fingerprint,
    ShieldCheck,
    Contact,
    Building,
    Check,
    MapPin,
    Wallet,
    PenTool,
    DollarSign,
} from "lucide-react";

const SignaturePad = dynamic(() => import("./SignaturePad").then(mod => mod.SignaturePad), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted/50 rounded-2xl animate-pulse flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loading Signer...</div>
});

import { generateLeasePdf } from "@/lib/lease-pdf";
import { Logo } from "@/components/ui/Logo";
import { SigningModeSelector } from "./SigningModeSelector";
import { PaymentRecordForm } from "./PaymentRecordForm";
import { ToolAccessBar } from "./ToolAccessBar";
import type { PaymentMethod } from "@/types/database";
import {
    DEFAULT_CHECKLIST,
    DEFAULT_EMPLOYMENT,
    applyLiveFieldValidation,
    type EmploymentInfo,
    type FormErrorKey,
    type RequirementsChecklist,
    type WalkInFormData,
    type WalkInUnit,
    validateFormStep,
} from "./application-intake-shared";
import {
    pickTemplateAmount,
    ADVANCE_TEMPLATE_KEYS,
    DEPOSIT_TEMPLATE_KEYS,
} from "@/lib/application-payment-pending";

// ─── Types ────────────────────────────────────────────────────────────
interface LeaseData {
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    terms: Record<string, unknown>;
    signing_mode: "in_person" | "remote" | null;
    tenant_signature: string | null;
    landlord_signature: string | null;
    signed_document_url: string | null;
    signed_document_path: string | null;
}

interface PaymentData {
    amount: number;
    method: PaymentMethod | null;
    reference_number: string;
    paid_at: string | null;
    status: "pending" | "completed";
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
        move_in_date?: string;
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
        employment_info: EmploymentInfo;
        requirements_checklist: RequirementsChecklist;
        message?: string;
    } | null;
    onSuccess?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────
const STEPS = [
    { label: "Identity", sub: "Applicant Info", icon: User, color: "text-blue-400" },
    { label: "Profile", sub: "Work Details", icon: Briefcase, color: "text-primary" },
    { label: "Verify", sub: "Checklist", icon: ShieldCheck, color: "text-amber-400" },
    { label: "Lease", sub: "Sign Agreement", icon: FileCheck, color: "text-purple-400" },
    { label: "Payment", sub: "Collect Fees", icon: Wallet, color: "text-green-400" },
    { label: "Finalize", sub: "Summary", icon: CheckCircle2, color: "text-emerald-400" },
];

const REQUIREMENT_LABELS: Record<string, string> = {
    valid_id: "Identity Verification",
    proof_of_income: "Source of Income",
};
const ACTIVE_REQUIREMENT_KEYS = Object.keys(REQUIREMENT_LABELS);

const STEP_FIELD_KEYS: Record<number, FormErrorKey[]> = {
    0: ["unit", "applicant_name", "applicant_email", "applicant_phone", "move_in_date", "emergency_contact_name", "emergency_contact_phone"],
    1: ["occupation", "employer", "monthly_income", "message"],
    2: [],
    3: [], // Lease signing step - no form errors
    4: [], // Payment collection step - no form errors
    5: [], // Finalize step - no form errors
};

const parseIncome = (v: string | number) => Number(String(v).replace(/,/g, "")) || 0;

// ─── Sub-Components ──────────────────────────────────────────────────

function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    missingFields, 
    isSubmitting 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
    missingFields: string[]; 
    isSubmitting: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.button 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            aria-label="Close Confirmation" />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-lg rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8">
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={24}/></button>
                </div>
                <div className="space-y-8">
                    <div className="flex items-center gap-5 text-amber-500">
                        <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-3xl font-semibold italic tracking-tight">Final Approval</h2>
                    </div>

                    {missingFields.length > 0 ? (
                        <div className="space-y-6">
                            <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                System detected that the application is not yet 100% complete. Do you want to override and approve anyway?
                            </p>
                            <div className="space-y-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">Missing Requirements:</p>
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                    {missingFields.map(field => (
                                        <span key={field} className="px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                            Verification threshold met. Finalizing this will immediately allocate the asset and prepare the lease contract.
                        </p>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 h-16 rounded-2xl border border-border bg-background font-semibold text-xs uppercase tracking-widest hover:bg-muted transition-all"
                        >
                            Back
                        </button>
                        <button 
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className={cn(
                                "flex-[1.5] h-16 rounded-2xl font-semibold text-xl uppercase tracking-tighter italic transition-all flex items-center justify-center gap-3",
                                missingFields.length > 0 ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-emerald-500 text-black hover:bg-emerald-400"
                            )}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={24} />}
                            {missingFields.length > 0 ? "Confirm Override" : "Confirm & Finish"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const Noise = () => null;

const BackgroundGlow = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute left-[-12%] top-[-14%] h-[45%] w-[45%] rounded-full bg-primary/12 blur-[90px]" />
        <div className="absolute bottom-[-12%] right-[-12%] h-[42%] w-[42%] rounded-full bg-sky-500/10 blur-[90px] dark:bg-blue-500/15" />
    </div>
);

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: ElementType;
    label?: string;
    error?: string;
    id: string;
    nextFieldId?: string;
}

const GlassInput = ({ icon: Icon, label, error, id, nextFieldId, onKeyDown, ...props }: GlassInputProps) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && nextFieldId) {
            e.preventDefault();
            document.getElementById(nextFieldId)?.focus();
        }
        onKeyDown?.(e);
    };

    return (
        <div className="space-y-2.5 group">
            {label && (
                <label 
                    htmlFor={id} 
                    className="ml-1 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-all duration-300 group-focus-within:text-primary"
                >
                    {label}
                </label>
            )}
            <div className="relative isolate">
                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90 transition-all duration-300 group-hover:bg-card group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/20" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-500 transform group-focus-within:rotate-[5deg] group-focus-within:scale-110 group-focus-within:text-primary">
                    <Icon size={18} strokeWidth={1.5} />
                </div>
                <input
                    {...props}
                    id={id}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "h-15 w-full rounded-2xl bg-transparent py-4 pl-12 pr-4 text-sm font-medium tracking-tight text-foreground outline-none transition-all placeholder:text-muted-foreground",
                        "focus-visible:ring-0"
                    )}
                />
            </div>
            {error && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{error}</p>}
        </div>
    );
};

interface CardFrameProps {
    children: ReactNode;
    className?: string;
    glow?: boolean;
}

const CardFrame = ({ children, className, glow = true }: CardFrameProps) => (
    <div className={cn(
        "relative overflow-hidden rounded-[2.5rem] border border-border bg-card/92 backdrop-blur-2xl transition-all shadow-sm",
        glow && "hover:border-primary/20 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.35)]",
        className
    )}>
        <Noise />
        <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);

export function WalkInApplicationModal({
    isOpen,
    onClose,
    units,
    selectedUnitId,
    existingApplication,
    onSuccess,
}: WalkInApplicationModalProps) {
    const resetCreateWizard = useCallback(() => {
        setStep(0);
        setSelectedUnit(selectedUnitId || "");
        setFormData({
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
        setFormErrors({});
        setTouchedFields({});
        setError(null);
    }, [selectedUnitId]);

    const [step, setStep] = useState(0);
    const [paymentSubStep, setPaymentSubStep] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState(selectedUnitId || "");
    const [submitting, setSubmitting] = useState(false);
    const [confirmApproval, setConfirmApproval] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setConfirmApproval(false);
    }, [step]);
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

    // Lease and payment state
    const [leaseData, setLeaseData] = useState<LeaseData>({
        start_date: "",
        end_date: "",
        monthly_rent: 0,
        security_deposit: 0,
        terms: {},
        signing_mode: null,
        tenant_signature: null,
        landlord_signature: null,
        signed_document_url: null,
        signed_document_path: null,
    });

    const [leasePdfBlob, setLeasePdfBlob] = useState<Blob | null>(null);

    const [paymentData, setPaymentData] = useState<{
        advance_payment: PaymentData;
        security_deposit_payment: PaymentData;
    }>({
        advance_payment: {
            amount: 0,
            method: null,
            reference_number: "",
            paid_at: null,
            status: "pending",
        },
        security_deposit_payment: {
            amount: 0,
            method: null,
            reference_number: "",
            paid_at: null,
            status: "pending",
        },
    });

    // Derive currentUnit from selectedUnit
    const currentUnit = units.find((u) => u.id === selectedUnit);

    // Generate PDF for signing
    useEffect(() => {
        const generate = async () => {
            if (!currentUnit || !leaseData.start_date || !leaseData.end_date) {
                setLeasePdfBlob(null);
                return;
            }

            try {
                const blob = await generateLeasePdf({
                    id: `WALK-${Date.now()}`,
                    tenant: {
                        name: formData.applicant_name || "Prospective Tenant",
                        email: formData.applicant_email || "N/A",
                    },
                    landlord: {
                        name: "Property Management", // Placeholder
                        email: "mgmt@ireside.com", // Placeholder
                    },
                    property: {
                        name: currentUnit.property_name,
                        address: "Property Address", // Placeholder
                    },
                    unit: {
                        name: currentUnit.name,
                    },
                    startDate: leaseData.start_date,
                    endDate: leaseData.end_date,
                    monthlyRent: leaseData.monthly_rent,
                    securityDeposit: leaseData.security_deposit,
                });
                setLeasePdfBlob(blob);
            } catch (err) {
                console.error("PDF generation failed:", err);
            }
        };

        generate();
    }, [leaseData, formData, currentUnit]);

    // For create mode, preserve in-progress draft across close/reopen.
    // For edit mode, always rehydrate from the existing application payload.
    useEffect(() => {
        if (isOpen) {
            if (existingApplication) {
                setFormData({
                    applicant_name: existingApplication.applicant_name || "",
                    applicant_phone: existingApplication.applicant_phone || "",
                    applicant_email: existingApplication.applicant_email || "",
                    move_in_date: existingApplication.move_in_date || "",
                    emergency_contact_name: existingApplication.emergency_contact_name || "",
                    emergency_contact_phone: existingApplication.emergency_contact_phone || "",
                    employment_info: existingApplication.employment_info || { ...DEFAULT_EMPLOYMENT },
                    requirements_checklist: { ...DEFAULT_CHECKLIST, ...(existingApplication.requirements_checklist || {}) },
                    message: existingApplication.message || "",
                });
                setStep(0);
                setSelectedUnit("");
            } else {
                if (!selectedUnit && selectedUnitId) {
                    setSelectedUnit(selectedUnitId);
                }
            }
            setError(null);
            setFormErrors({});
            setTouchedFields({});
        }
    }, [isOpen, existingApplication, selectedUnitId, selectedUnit]);

    useEffect(() => {
        if (existingApplication) return;
        if (!selectedUnit) return;

        const hasSelectedUnit = units.some((unit) => unit.id === selectedUnit);
        if (!hasSelectedUnit) {
            setSelectedUnit("");
            setFormErrors((prev) => ({ ...prev, unit: "Please select a valid unit." }));
            setTouchedFields((prev) => ({ ...prev, unit: true }));
        }
    }, [existingApplication, selectedUnit, units]);

    // Initialize lease and payment data when unit or move-in date changes
    useEffect(() => {
        if (!currentUnit || !formData.move_in_date) return;

        const startDate = new Date(formData.move_in_date);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const rentAmount = currentUnit.rent_amount ?? 0;
        const contractTemplate = currentUnit.property_contract_template ?? null;

        // Use contract_template to compute security deposit and advance rent (like invite system does)
        const securityDepositAmount = pickTemplateAmount(contractTemplate, DEPOSIT_TEMPLATE_KEYS, rentAmount) ?? rentAmount;
        const advanceRentAmount = pickTemplateAmount(contractTemplate, ADVANCE_TEMPLATE_KEYS, rentAmount) ?? rentAmount;

        setLeaseData((prev) => ({
            ...prev,
            start_date: formData.move_in_date,
            end_date: endDate.toISOString().split("T")[0],
            monthly_rent: rentAmount,
            security_deposit: securityDepositAmount,
        }));

        setPaymentData((prev) => ({
            advance_payment: {
                ...prev.advance_payment,
                amount: advanceRentAmount,
            },
            security_deposit_payment: {
                ...prev.security_deposit_payment,
                amount: securityDepositAmount,
            },
        }));
    }, [currentUnit, formData.move_in_date]);

    const updateField = useCallback((
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
                requireUnit: !existingApplication,
            });
        }
    }, [existingApplication, formData, selectedUnit, step]);

    const toggleRequirement = useCallback((key: string) => {
        setFormData((prev) => ({
            ...prev,
            requirements_checklist: {
                ...prev.requirements_checklist,
                [key]: !prev.requirements_checklist[key],
            },
        }));
    }, []);

    const allRequirementsMet = useMemo(
        () => 
            ACTIVE_REQUIREMENT_KEYS.every((key) => Boolean(formData.requirements_checklist[key])) &&
            Boolean(leaseData.landlord_signature),
        [formData.requirements_checklist, leaseData.landlord_signature]
    );

    const missingFields = useMemo(() => {
        const missing: string[] = [];
        if (!formData.applicant_name) missing.push("Applicant Name");
        if (!formData.applicant_phone) missing.push("Phone Number");
        if (!formData.applicant_email) missing.push("Email Address");
        if (!formData.move_in_date) missing.push("Move-in Date");
        if (!formData.emergency_contact_name) missing.push("Emergency Contact Name");
        if (!formData.emergency_contact_phone) missing.push("Emergency Contact Phone");
        if (!formData.employment_info.occupation) missing.push("Occupation");
        if (!formData.employment_info.employer) missing.push("Employer");
        if (!formData.employment_info.monthly_income) missing.push("Monthly Income");
        
        ACTIVE_REQUIREMENT_KEYS.forEach(key => {
            if (!formData.requirements_checklist[key]) {
                missing.push(REQUIREMENT_LABELS[key]);
            }
        });

        if (!leaseData.landlord_signature) missing.push("Landlord Signature");
        if (paymentData.advance_payment.status !== 'completed') missing.push("Advance Payment");
        if (paymentData.security_deposit_payment.status !== 'completed') missing.push("Security Deposit");

        return missing;
    }, [formData, leaseData, paymentData]);

    const validateStep = (currentStep: number) => {
        const errors = validateFormStep(currentStep, selectedUnit, formData, { requireUnit: !existingApplication });
        const stepKeys = STEP_FIELD_KEYS[currentStep] || [];

        setTouchedFields((prev) => {
            const next = { ...prev };
            stepKeys.forEach((key) => {
                next[key] = true;
            });
            return next;
        });

        setFormErrors((prev) => {
            const next = { ...prev };
            stepKeys.forEach((key) => {
                next[key] = errors[key];
            });
            return next;
        });

        return Object.keys(errors).length === 0;
    };

    const handleContinue = () => {
        if (validateStep(step)) {
            if (step === 4 && paymentSubStep === 0) {
                setPaymentSubStep(1);
            } else {
                setStep(s => s + 1);
                // When moving into step 4 from step 3, ensure we start at substep 0
                if (step === 3) setPaymentSubStep(0);
            }
        }
    };

    const handleSubmit = async (asPending = false) => {
        if (!existingApplication) {
            const hasSelectedUnit = units.some((unit) => unit.id === selectedUnit);
            if (!hasSelectedUnit) {
                setFormErrors((prev) => ({ ...prev, unit: "Please select a valid unit." }));
                setTouchedFields((prev) => ({ ...prev, unit: true }));
                setStep(0);
                setError("Selected unit is no longer valid. Please re-select a unit.");
                return;
            }
        }

        const stepZeroErrors = validateFormStep(0, selectedUnit, formData, { requireUnit: !existingApplication });
        const stepOneErrors = validateFormStep(1, selectedUnit, formData, { requireUnit: !existingApplication });
        const allErrors = { ...stepZeroErrors, ...stepOneErrors };

        if (Object.keys(allErrors).length > 0) {
            setFormErrors(allErrors);
            setTouchedFields((prev) => ({
                ...prev,
                ...Object.fromEntries(Object.keys(allErrors).map((key) => [key, true])),
            }));
            if (Object.keys(stepZeroErrors).length > 0) {
                setStep(0);
            } else if (Object.keys(stepOneErrors).length > 0) {
                setStep(1);
            }
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const endpoint = "/api/landlord/applications/tenant-application";
            const method = existingApplication ? "PATCH" : "POST";

            // Guardrail for final approval
            if (!asPending && step === 5 && !confirmApproval) {
                setConfirmApproval(true);
                return;
            }
            const normalizedChecklist = Object.fromEntries(
                ACTIVE_REQUIREMENT_KEYS.map((key) => [key, Boolean(formData.requirements_checklist[key])])
            );

            const payload = existingApplication ? {
                application_id: existingApplication.id,
                requirements_checklist: normalizedChecklist,
                employment_info: { ...formData.employment_info, monthly_income: parseIncome(formData.employment_info.monthly_income) },
                status: asPending ? "pending" : allRequirementsMet ? "reviewing" : "pending",
            } : {
                unit_id: selectedUnit,
                applicant_name: formData.applicant_name,
                applicant_phone: formData.applicant_phone,
                applicant_email: formData.applicant_email,
                move_in_date: formData.move_in_date || null,
                emergency_contact_name: formData.emergency_contact_name || null,
                emergency_contact_phone: formData.emergency_contact_phone || null,
                employment_info: { ...formData.employment_info, monthly_income: parseIncome(formData.employment_info.monthly_income) },
                requirements_checklist: normalizedChecklist,
                message: formData.message,
                status: asPending ? "pending" : "reviewing",
                lease_data: {
                    start_date: leaseData.start_date,
                    end_date: leaseData.end_date,
                    monthly_rent: leaseData.monthly_rent,
                    security_deposit: leaseData.security_deposit,
                    terms: leaseData.terms,
                    landlord_signature: leaseData.landlord_signature,
                    signing_mode: leaseData.signing_mode,
                    signed_document_url: leaseData.signed_document_url,
                    signed_document_path: leaseData.signed_document_path,
                },
                advance_payment: {
                    method: paymentData.advance_payment.method,
                    reference_number: paymentData.advance_payment.reference_number,
                    paid_at: paymentData.advance_payment.paid_at,
                    status: paymentData.advance_payment.status,
                },
                security_deposit_payment: {
                    method: paymentData.security_deposit_payment.method,
                    reference_number: paymentData.security_deposit_payment.reference_number,
                    paid_at: paymentData.security_deposit_payment.paid_at,
                    status: paymentData.security_deposit_payment.status,
                },
            };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to save.");

            onSuccess?.();
            if (!existingApplication) {
                resetCreateWizard();
            }
            onClose();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save.";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            aria-label="Close Modal" />

            {currentUnit?.property_id && step !== 3 ? <ToolAccessBar propertyId={currentUnit.property_id} /> : null}
             
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 150 }}
                className={cn(
                    "relative w-full max-w-5xl h-[90vh] flex flex-col sm:flex-row z-10",
                    "overflow-hidden rounded-[2.5rem] border border-border bg-card/98 shadow-[0_0_80px_rgba(0,0,0,0.4)]",
                    "backdrop-blur-[60px]"
                )}
            >
                <Noise />

                {/* Left Rails / Navigation */}
                <aside className="relative z-20 hidden w-full shrink-0 flex-col overflow-hidden border-b border-border bg-background/80 p-8 sm:flex sm:w-80 sm:border-b-0 sm:border-r">
                    <div className="mb-8 flex flex-col items-start gap-1">
                        <p className="text-primary font-semibold text-[10px] uppercase tracking-[0.4em] opacity-80">MASTER PANEL</p>
                    </div>

                    <nav className="space-y-4">
                        {STEPS.map((s, i) => {
                            const isActive = i === step;
                            const isCompleted = i < step;
                            const isLocked = i > step && !currentUnit;
                            
                            return (
                                <button
                                    key={s.label}
                                    onClick={() => isCompleted && setStep(i)}
                                    disabled={isLocked}
                                    className={cn(
                                        "group relative w-full flex items-center gap-5 p-4 rounded-2xl transition-all duration-500 text-left outline-none overflow-hidden",
                                        isActive ? "translate-x-1 bg-card/95" : "opacity-55 hover:bg-muted/50 hover:opacity-85"
                                    )}
                                >
                                    <div className={cn(
                                        "relative size-11 rounded-xl flex items-center justify-center z-10 transition-all duration-500 overflow-hidden",
                                        isActive ? "scale-105 bg-primary text-primary-foreground shadow-[0_0_24px_rgba(var(--primary-rgb),0.24)]" : 
                                        isCompleted ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                                        "border border-border bg-background text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check size={20} strokeWidth={3} /> : <s.icon size={19} strokeWidth={isActive ? 2.5 : 1.5} />}
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <p className={cn("font-semibold text-sm tracking-tight transition-all", isActive ? "text-foreground" : "text-muted-foreground")}>
                                            {s.label}
                                        </p>
                                        <p className={cn("text-[9px] uppercase tracking-widest font-bold", isActive ? "text-primary opacity-80" : "text-zinc-500 dark:text-neutral-600")}>
                                            {s.sub}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_rgba(109,152,56,0.65)]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Primary Content Container */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                     <div className="relative border-b border-border bg-card/95 backdrop-blur-md sm:hidden">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold uppercase tracking-tighter text-foreground">{STEPS[step].label}</h2>
                                <p className="text-[9px] text-primary font-semibold uppercase tracking-widest">Step {step + 1} of 6</p>
                            </div>
                            <button onClick={onClose} className="flex size-10 items-center justify-center rounded-xl bg-background text-foreground"><X size={20}/></button>
                        </div>
                        {/* Mobile Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden bg-border">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                            />
                        </div>
                    </div>

                    {/* Desktop Status Bar */}
                    <div className="hidden sm:flex px-12 py-8 items-center justify-between pointer-events-none relative z-20">
                         <div className="flex items-center gap-8">
                             <div>
                                 <h1 className="text-3xl font-semibold tracking-tighter italic text-foreground">
                                     {STEPS[step].label.toUpperCase()} <span className="text-primary">STEP</span>
                                 </h1>
                                 <p className="ml-1 mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">Tenant Application Wizard</p>
                             </div>

                             {/* Relocated Payment Progress Indicator */}
                             {step === 4 && (
                                <div className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/40 border border-border/50 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-left-4 duration-700">
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">Ledger Page</p>
                                    {[0, 1].map((idx) => (
                                        <button 
                                            key={`payment-step-${idx}`}
                                            onClick={() => setPaymentSubStep(idx)}
                                            className={cn(
                                                "h-1 transition-all duration-500 rounded-full",
                                                paymentSubStep === idx ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-primary/40"
                                            )}
                                        />
                                    ))}
                                    <span className="ml-2 text-[10px] font-semibold text-foreground italic">{paymentSubStep + 1} / 2</span>
                                </div>
                             )}
                         </div>
                          <button 
                             onClick={onClose} 
                             className="pointer-events-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-all hover:scale-110 hover:bg-red-500/10 hover:text-red-500 active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500/50 outline-none"
                         >
                             <X size={20} />
                         </button>
                    </div>

                    {/* Step Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 sm:px-12 pb-10 custom-scrollbar-premium">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full"
                            >
                                {error && (
                                    <div className="mb-10 flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm font-bold text-red-700 backdrop-blur-sm animate-shake dark:text-red-400">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}

                                {step === 0 && (
                                    <div className="space-y-10 max-w-3xl">
                                        <div className="space-y-8">
                                            <section className="space-y-6">
                                                  <div className="flex items-center gap-4 text-primary">
                                                     <MapPin size={18} strokeWidth={2.5} />
                                                  <label htmlFor="unit-select" className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Select Unit</label>
                                                 </div>
                                                
                                                <CardFrame className="!p-0" glow={false}>
                                                    <div className="relative group">
                                                     <Building className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-300 group-focus-within:text-primary" size={20} />
                                                         <select
                                                             id="unit-select"
                                                             value={selectedUnit}
                                                             onChange={(e) => {
                                                                                     const nextUnit = e.target.value;
                                                                                     setSelectedUnit(nextUnit);
                                                                                     setTouchedFields((prev) => ({ ...prev, unit: true }));
                                                                                     const liveErrors = validateFormStep(step, nextUnit, formData, { requireUnit: !existingApplication });
                                                                                     setFormErrors((prev) => ({ ...prev, unit: liveErrors.unit }));
                                                             }}
                                                             disabled={!!existingApplication}
                                                             className={cn(
                                                                 "w-full h-20 appearance-none cursor-pointer bg-transparent pl-16 pr-12 text-lg font-semibold tracking-tighter text-foreground outline-none transition-all disabled:opacity-50",
                                                                 "focus-visible:ring-4 focus-visible:ring-primary/10",
                                                                 formErrors.unit && "text-red-400"
                                                             )}
                                                         >
                                                            <option value="" className="bg-card text-sm text-foreground">Select Target Unit...</option>
                                                             {units.map((u) => (
                                                                <option key={u.id} value={u.id} className="bg-card py-4 text-sm text-foreground">
                                                                    {u.name} — {u.property_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ArrowRight size={20} className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground" />
                                                    </div>
                                                </CardFrame>
                                                {formErrors.unit && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.unit}</p>}
                                                {currentUnit && (
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                                                         <span className="text-[10px] font-semibold uppercase text-primary tracking-widest">Monthly Rent</span>
                                                        <span className="text-lg font-semibold italic text-foreground">₱{currentUnit.rent_amount.toLocaleString()}</span>
                                                    </motion.div>
                                                )}
                                            </section>

                                            <section className="space-y-6">
                                                 <div className="flex items-center gap-4 text-blue-400">
                                                     <User size={18} strokeWidth={2.5} />
                                                     <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Applicant Information</h3>
                                                 </div>
                                                 <GlassInput 
                                                     id="applicant-name"
                                                     icon={Contact} 
                                                     label="Full Legal Name" 
                                                     placeholder="Maria Mercedes"
                                                     value={formData.applicant_name}
                                                     error={formErrors.applicant_name}
                                                     nextFieldId="applicant-email"
                                                     onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("applicant_name", e.target.value, ["applicant_name"])}
                                                 />
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                      <GlassInput 
                                                          id="applicant-email"
                                                          icon={Mail} 
                                                          label="Email Address" 
                                                         type="email"
                                                         placeholder="maria@digital.ph"
                                                         value={formData.applicant_email}
                                                         error={formErrors.applicant_email}
                                                         nextFieldId="applicant-phone"
                                                         onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("applicant_email", e.target.value, ["applicant_email"])}
                                                     />
                                                      <GlassInput 
                                                          id="applicant-phone"
                                                          icon={Phone} 
                                                          label="Phone Number" 
                                                         placeholder="+63 9xx xxx xxxx"
                                                         value={formData.applicant_phone}
                                                         error={formErrors.applicant_phone}
                                                         nextFieldId="move-in-date"
                                                         onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("applicant_phone", e.target.value, ["applicant_phone"])}
                                                     />
                                                 </div>

                                                 {/* Move-in Date */}
                                                 <div className="space-y-2.5 group">
                                                     <label htmlFor="move-in-date" className="ml-1 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-all duration-300 group-focus-within:text-primary">
                                                         Move-in Date
                                                     </label>
                                                     <div className="relative isolate">
                                                         <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90 transition-all duration-300 group-hover:bg-card group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/20" />
                                                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-500 group-focus-within:text-primary">
                                                             <MapPin size={18} strokeWidth={1.5} />
                                                         </div>
                                                         <input
                                                             id="move-in-date"
                                                             type="date"
                                                             value={formData.move_in_date}
                                                             onChange={(e) => updateField("move_in_date", e.target.value, ["move_in_date"])}
                                                             className="h-15 w-full rounded-2xl bg-transparent py-4 pl-12 pr-4 text-sm font-medium tracking-tight text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-0 [color-scheme:light] dark:[color-scheme:dark]"
                                                         />
                                                     </div>
                                                     {formErrors.move_in_date && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.move_in_date}</p>}
                                                 </div>
                                            </section>

                                            {/* Emergency Contact */}
                                            <section className="space-y-6">
                                                 <div className="flex items-center gap-4 text-red-400">
                                                     <Phone size={18} strokeWidth={2.5} />
                                                     <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Emergency Contact</h3>
                                                 </div>
                                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                     <GlassInput
                                                         id="emergency-contact-name"
                                                         icon={Contact}
                                                         label="Contact Name"
                                                         placeholder="Juan dela Cruz"
                                                         value={formData.emergency_contact_name}
                                                         error={formErrors.emergency_contact_name}
                                                         nextFieldId="emergency-contact-phone"
                                                         onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("emergency_contact_name", e.target.value, ["emergency_contact_name"])}
                                                     />
                                                     <GlassInput
                                                         id="emergency-contact-phone"
                                                         icon={Phone}
                                                         label="Contact Number"
                                                         placeholder="+63 9xx xxx xxxx"
                                                         value={formData.emergency_contact_phone}
                                                         error={formErrors.emergency_contact_phone}
                                                         onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("emergency_contact_phone", e.target.value, ["emergency_contact_phone"])}
                                                     />
                                                 </div>
                                            </section>
                                        </div>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="space-y-10 max-w-3xl">
                                        <section className="space-y-8">
                                             <div className="flex items-center gap-4 text-primary">
                                                 <Wallet size={18} strokeWidth={2.5} />
                                                 <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Financial Details</h3>
                                             </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                 <GlassInput 
                                                     id="occupation"
                                                     icon={Briefcase} 
                                                     label="Current Occupation" 
                                                     placeholder="Software Engineer"
                                                     value={formData.employment_info.occupation}
                                                     error={formErrors.occupation}
                                                     nextFieldId="employer"
                                                     onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("employment_info", { ...formData.employment_info, occupation: e.target.value }, ["occupation"])}
                                                 />
                                                  <GlassInput 
                                                      id="employer"
                                                      icon={Building2} 
                                                      label="Company Name" 
                                                     placeholder="Stark Industries"
                                                     value={formData.employment_info.employer}
                                                     error={formErrors.employer}
                                                     nextFieldId="income"
                                                     onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("employment_info", { ...formData.employment_info, employer: e.target.value }, ["employer"])}
                                                 />
                                             </div>

                                            <div className="relative isolate group">
                                                 <div className="absolute inset-x-0 -inset-y-4 bg-primary/5 rounded-[2.5rem] -z-10 border border-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
<GlassInput
                                                      id="income"
                                                      icon={() => <span className="font-semibold text-primary/80">₱</span>}
                                                      label="Monthly Net Income"
                                                      type="text"
                                                      inputMode="numeric"
                                                      placeholder="0.00"
                                                      className="font-mono"
                                                      value={formData.employment_info.monthly_income ? Number(String(formData.employment_info.monthly_income).replace(/,/g, "")).toLocaleString("en-US") : ""}
                                                      error={formErrors.monthly_income}
                                                      nextFieldId="additional-notes"
                                                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                          const raw = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                                          updateField("employment_info", { ...formData.employment_info, monthly_income: raw }, ["monthly_income"]);
                                                      }}
                                                      onBlur={(e) => {
                                                          const raw = String(formData.employment_info.monthly_income ?? "").replace(/[^0-9.]/g, "");
                                                          if (!raw) return;
                                                          const num = Number(raw);
                                                          if (Number.isFinite(num)) {
                                                              const formatted = num.toLocaleString("en-US");
                                                              e.target.value = formatted;
                                                              updateField("employment_info", { ...formData.employment_info, monthly_income: formatted }, ["monthly_income"]);
                                                          }
                                                      }}
                                                  />
                                            </div>
                                        </section>

                                        <section className="space-y-6">
                                              <div className="flex items-center gap-4 text-muted-foreground">
                                                  <FileCheck size={18} strokeWidth={2.5} />
                                                 <label htmlFor="additional-notes" className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Additional Notes</label>
                                              </div>
                                            <div className="relative isolate">
                                                <div className="absolute inset-0 -z-10 rounded-[2rem] border border-border bg-card/90 transition-all duration-300 hover:bg-card" />
                                                <textarea
                                                     id="additional-notes"
                                                     placeholder="Add internal notes about the applicant's character, urgent requests, or specific unit adjustments here..."
                                                     className={cn(
                                                         "min-h-[180px] w-full resize-none bg-transparent p-7 text-sm font-medium leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground",
                                                         "focus-visible:ring-4 focus-visible:ring-primary/20"
                                                     )}
                                                     value={formData.message}
                                                     onChange={(e) => updateField("message", e.target.value, ["message"])}
                                                 />
                                            </div>
                                            {formErrors.message && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.message}</p>}
                                        </section>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8 max-w-4xl mx-auto">
                                        {/* Verification Header Section - Scaled Down */}
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-primary/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative p-7 rounded-[2rem] bg-card/40 border border-border/50 backdrop-blur-md flex flex-col md:flex-row gap-6 items-center">
                                                <div className="shrink-0 size-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                                                    <ShieldCheck className="text-amber-500" size={30} strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1.5 text-center md:text-left">
                                                     <h3 className="text-base font-semibold uppercase tracking-[0.3em] text-amber-500/90">Verification Protocol</h3>
                                                     <p className="text-xs font-medium text-muted-foreground leading-relaxed max-w-xl">
                                                         Every applicant must pass through our compliance audit. Select the documents you have physically inspected and verified from the tenant.
                                                     </p>
                                                 </div>
                                            </div>
                                        </div>

                                        {/* Requirement Buttons - Compact Layout */}
                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            {ACTIVE_REQUIREMENT_KEYS.map((key, idx) => {
                                                const value = Boolean(formData.requirements_checklist[key]);
                                                return (
                                                    <motion.button
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1, type: "spring", damping: 20 }}
                                                        key={key}
                                                        onClick={() => toggleRequirement(key)}
                                                        className={cn(
                                                            "group relative w-full min-h-[7rem] py-4 rounded-[2rem] border transition-all duration-500 flex items-center px-8",
                                                            value 
                                                                ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_12px_32px_-8px_rgba(16,185,129,0.12)]" 
                                                                : "bg-card/50 border-border/80 hover:bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                                                        )}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                                                        
                                                        <div className="relative z-10 flex items-center gap-6 w-full">
                                                            {/* Icon Container - Fixed Sizing */}
                                                            <div className={cn(
                                                                "size-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                                                                value ? "bg-emerald-500 text-black shadow-lg scale-105" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                            )}>
                                                                {value ? <Check size={24} strokeWidth={3} /> : <Fingerprint size={24} strokeWidth={1.5} />}
                                                            </div>
                                                            
                                                            <div className="flex-1 text-left">
                                                                <p className={cn("text-lg font-semibold tracking-tighter transition-colors leading-tight", value ? "text-foreground" : "text-muted-foreground")}>
                                                                    {REQUIREMENT_LABELS[key]}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className={cn("size-1.5 rounded-full", value ? "bg-emerald-500 animate-pulse" : "bg-amber-400")} />
                                                                    <p className={cn("text-[9px] font-semibold uppercase tracking-[0.2em] leading-none", value ? "text-emerald-500" : "text-amber-500/70")}>
                                                                        {value ? "Audit Passed" : "Pending Verification"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className={cn(
                                                                "size-7 rounded-full flex items-center justify-center transition-all duration-500 shrink-0",
                                                                value ? "bg-emerald-500 text-black" : "border-2 border-dashed border-border group-hover:border-primary/50 group-hover:rotate-90"
                                                            )}>
                                                                {value && <Check size={12} strokeWidth={4} />}
                                                            </div>
                                                        </div>
                                                        
                                                        {value && (
                                                            <motion.div 
                                                                layoutId={`check-glow-${key}`}
                                                                className="absolute inset-0 bg-emerald-500/5 -z-10" 
                                                            />
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>

                                        {/* Footer Alert - Scaled Down */}
                                        {!allRequirementsMet && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="p-5 rounded-[1.5rem] bg-amber-500/5 border border-dashed border-amber-500/20 text-center"
                                            >
                                                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-500/50">
                                                    Unchecked items will be flagged as &quot;Pending Review&quot; in the application dossier
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-10 max-w-4xl">
                                        <div className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/10 text-purple-200 text-xs font-bold leading-relaxed flex gap-6 items-center shadow-[0_15px_30px_rgba(168,85,247,0.05)] backdrop-blur-sm">
                                            <div className="shrink-0 size-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                                <PenTool className="text-purple-500" size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] uppercase tracking-widest font-semibold text-purple-500/80">Lease Agreement & Signing</p>
                                                <p className="opacity-80">
                                                    {leaseData.signing_mode === "remote" 
                                                        ? "Review lease terms and tenant will receive a signing link via email."
                                                        : leaseData.signing_mode === "in_person"
                                                        ? "Review lease terms. Tenant signs first, then landlord countersigns."
                                                        : "Select signing mode and review lease terms before proceeding."
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Signing Mode Selection */}
                                        <SigningModeSelector
                                            value={leaseData.signing_mode}
                                            onChange={(mode) => setLeaseData(prev => ({ ...prev, signing_mode: mode  }))}
                                            disabled={!!(leaseData.tenant_signature || leaseData.landlord_signature)}
                                        />

                                        {/* Show lease terms and signatures only after mode is selected */}
                                        {leaseData.signing_mode && (
                                            <>
                                                {/* Lease Terms Display */}
                                                <section className="space-y-6">
                                                    <div className="flex items-center gap-4 text-purple-400">
                                                        <FileCheck size={18} strokeWidth={2.5} />
                                                        <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Lease Terms</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                                                Start Date
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <input
                                                                    type="date"
                                                                    value={leaseData.start_date}
                                                                    onChange={(e) => setLeaseData(prev => ({ ...prev, start_date: e.target.value  }))}
                                                                    className="h-15 w-full rounded-2xl bg-transparent px-4 py-4 text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                                                End Date
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <input
                                                                    type="date"
                                                                    value={leaseData.end_date}
                                                                    onChange={(e) => setLeaseData(prev => ({ ...prev, end_date: e.target.value  }))}
                                                                    className="h-15 w-full rounded-2xl bg-transparent px-4 py-4 text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                                                Monthly Rent
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₱</div>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    className="h-15 w-full rounded-2xl bg-transparent py-4 pl-8 pr-4 text-sm font-medium font-mono text-foreground outline-none"
                                                                    value={leaseData.monthly_rent ? leaseData.monthly_rent.toLocaleString("en-US", { maximumFractionDigits: 2 }) : ""}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                                                                        setLeaseData(prev => ({ ...prev, monthly_rent: parseFloat(raw) || 0  }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                                                Security Deposit
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₱</div>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    className="h-15 w-full rounded-2xl bg-transparent py-4 pl-8 pr-4 text-sm font-medium font-mono text-foreground outline-none"
                                                                    value={leaseData.security_deposit ? leaseData.security_deposit.toLocaleString("en-US", { maximumFractionDigits: 2 }) : ""}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                                                                        setLeaseData(prev => ({ ...prev, security_deposit: parseFloat(raw) || 0  }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                {/* In-Person Dual Signing */}
                                                {leaseData.signing_mode === "in_person" && (
                                                    <>
                                                        {/* Tenant Signature */}
                                                        <section className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-3 text-blue-400">
                                                                    <User size={18} strokeWidth={2.5} />
                                                                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Tenant Signature</h3>
                                                                </div>
                                                                {leaseData.tenant_signature && (
                                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Signed</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {!leaseData.tenant_signature ? (
                                                                <div className="space-y-3">
                                                            <p className="px-1 text-xs text-muted-foreground">Tenant must sign first before landlord can countersign</p>
                                                                    <SignaturePad
                                                                        onSave={(dataUrl) => setLeaseData(prev => ({ ...prev, tenant_signature: dataUrl  }))}
                                                                        onClear={() => setLeaseData(prev => ({ ...prev, tenant_signature: null  }))}
                                                                        pdfBlob={leasePdfBlob}
                                                                        documentTitle={`Lease - ${currentUnit?.property_name} ${currentUnit?.name}`}
                                                                        variant="button"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                                                                        <img src={leaseData.tenant_signature} alt="Tenant Signature" className="max-h-40 mx-auto" />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLeaseData(prev => ({ ...prev, tenant_signature: null, landlord_signature: null  }))}
                                                                        className="h-12 w-full rounded-xl border border-border bg-background text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:bg-muted"
                                                                    >
                                                                        Clear & Re-sign
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </section>

                                                        {/* Landlord Signature */}
                                                        <section className="space-y-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-3 text-purple-400">
                                                                    <PenTool size={18} strokeWidth={2.5} />
                                                                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Landlord Signature</h3>
                                                                </div>
                                                                {leaseData.landlord_signature && (
                                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Signed</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {!leaseData.tenant_signature ? (
                                                                <div className="p-6 rounded-2xl border border-neutral-500/30 bg-neutral-500/5">
                                                    <p className="text-center text-sm text-muted-foreground">Waiting for tenant signature first...</p>
                                                                </div>
                                                            ) : !leaseData.landlord_signature ? (
                                                                <SignaturePad
                                                                    onSave={async (dataUrl, blob) => {
                                                                        setLeaseData(prev => ({ ...prev, landlord_signature: dataUrl }));
                                                                        
                                                                        if (blob) {
                                                                            try {
                                                                                const supabase = createClient();
                                                                                const fileName = `lease_${Date.now()}.pdf`;
                                                                                const filePath = `signed-leases/${fileName}`;
                                                                                
                                                                                const { data, error: uploadError } = await supabase.storage
                                                                                    .from('tenant-invite-documents')
                                                                                    .upload(filePath, blob);
                                                                                    
                                                                                if (uploadError) throw uploadError;
                                                                                
                                                                                const { data: { publicUrl } } = supabase.storage
                                                                                    .from('tenant-invite-documents')
                                                                                    .getPublicUrl(filePath);
                                                                                    
                                                                                setLeaseData(prev => ({ 
                                                                                    ...prev, 
                                                                                    signed_document_url: publicUrl,
                                                                                    signed_document_path: data.path
                                                                                }));
                                                                                toast.success("Document uploaded to secure vault");
                                                                            } catch (err) {
                                                                                console.error("Failed to upload signed PDF:", err);
                                                                                toast.error("Signature saved locally, but cloud backup failed.");
                                                                            }
                                                                        }
                                                                    }}
                                                                    onClear={() => setLeaseData(prev => ({ ...prev, landlord_signature: null, signed_document_url: null, signed_document_path: null }))}
                                                                    pdfBlob={leasePdfBlob}
                                                                    documentTitle={`Lease - ${currentUnit?.property_name} ${currentUnit?.name}`}
                                                                    variant="button"
                                                                />
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                                                                        <img src={leaseData.landlord_signature} alt="Landlord Signature" className="max-h-40 mx-auto" />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLeaseData(prev => ({ ...prev, landlord_signature: null  }))}
                                                                        className="h-12 w-full rounded-xl border border-border bg-background text-sm font-bold uppercase tracking-wider text-foreground transition-all hover:bg-muted"
                                                                    >
                                                                        Clear & Re-sign
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </section>
                                                    </>
                                                )}

                                                {/* Remote Signing - Landlord Only */}
                                                {leaseData.signing_mode === "remote" && (
                                                    <section className="space-y-6">
                                                        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                                                            <div className="flex items-start gap-4">
                                                                <Mail className="text-blue-400 shrink-0 mt-1" size={20} />
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-blue-200">Remote Signing Selected</p>
                                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                                                        A signing link will be emailed to the tenant. The landlord signature will be added after the tenant signs remotely.
                                                                    </p>
                                                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-neutral-500">
                                                                        This option is available only after the application is approved.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </section>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                        <div className="pb-12">
                                            <AnimatePresence mode="wait">
                                                {paymentSubStep === 0 ? (
                                                    <motion.div
                                                        key="advance"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                                    >
                                                        <PaymentRecordForm
                                                            label="Advance Rent"
                                                            amount={paymentData.advance_payment.amount}
                                                            allowAmountEdit={false}
                                                            paymentMethod={paymentData.advance_payment.method}
                                                            onMethodChange={(method) =>
                                                                setPaymentData(prev => ({ ...prev, advance_payment: { ...prev.advance_payment, method  } }))
                                                            }
                                                            referenceNumber={paymentData.advance_payment.reference_number}
                                                            onReferenceChange={(ref) =>
                                                                setPaymentData(prev => ({ ...prev, advance_payment: { ...prev.advance_payment, reference_number: ref  } }))
                                                            }
                                                            paidAt={paymentData.advance_payment.paid_at}
                                                            onPaidAtChange={(date) =>
                                                                setPaymentData(prev => ({ ...prev, advance_payment: { ...prev.advance_payment, paid_at: date  } }))
                                                            }
                                                            status={paymentData.advance_payment.status}
                                                            onStatusChange={(status) =>
                                                                setPaymentData(prev => ({ ...prev, advance_payment: { ...prev.advance_payment, status  } }))
                                                            }
                                                        />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="security"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                                    >
                                                        <PaymentRecordForm
                                                            label="Security Deposit"
                                                            amount={paymentData.security_deposit_payment.amount}
                                                            onAmountChange={(amount) =>
                                                                setPaymentData(prev => ({ ...prev, security_deposit_payment: { ...prev.security_deposit_payment, amount  } }))
                                                            }
                                                            allowAmountEdit={true}
                                                            paymentMethod={paymentData.security_deposit_payment.method}
                                                            onMethodChange={(method) =>
                                                                setPaymentData(prev => ({ ...prev, security_deposit_payment: { ...prev.security_deposit_payment, method  } }))
                                                            }
                                                            referenceNumber={paymentData.security_deposit_payment.reference_number}
                                                            onReferenceChange={(ref) =>
                                                                setPaymentData(prev => ({ ...prev, security_deposit_payment: { ...prev.security_deposit_payment, reference_number: ref  } }))
                                                            }
                                                            paidAt={paymentData.security_deposit_payment.paid_at}
                                                            onPaidAtChange={(date) =>
                                                                setPaymentData(prev => ({ ...prev, security_deposit_payment: { ...prev.security_deposit_payment, paid_at: date  } }))
                                                            }
                                                            status={paymentData.security_deposit_payment.status}
                                                            onStatusChange={(status) =>
                                                                setPaymentData(prev => ({ ...prev, security_deposit_payment: { ...prev.security_deposit_payment, status  } }))
                                                            }
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="space-y-10 pb-12">
                                        <CardFrame className={cn(
                                            "!p-0 !min-h-[180px] transition-all duration-1000",
                                            allRequirementsMet ? "border-emerald-500/30 shadow-emerald-500/5" : "border-amber-500/30 shadow-amber-500/5"
                                        )}>
                                             <div className="absolute right-0 top-0 w-1/3 h-full overflow-hidden opacity-20 select-none pointer-events-none">
                                                 <Fingerprint size={240} strokeWidth={1} className={cn(allRequirementsMet ? "text-emerald-500" : "text-amber-500")} />
                                             </div>
                                             
                                             <div className="p-8 flex flex-col sm:flex-row gap-8 items-center relative z-10">
                                                 <div className={cn(
                                                     "shrink-0 size-20 rounded-[2rem] flex items-center justify-center border-4 shadow-2xl relative",
                                                     allRequirementsMet ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-amber-500/10 border-amber-500 text-amber-500"
                                                 )}>
                                                     {allRequirementsMet ? <CheckCircle2 size={32} strokeWidth={2.5}/> : <AlertCircle size={32} strokeWidth={2.5} />}
                                                     <div className={cn("absolute inset-0 rounded-[2rem] border-inherit blur-xl opacity-35", allRequirementsMet ? "bg-emerald-500" : "bg-amber-500")} />
                                                 </div>
                                                 <div className="text-center sm:text-left space-y-2">
                                                     <div className="flex items-center gap-3 justify-center sm:justify-start">
                                                         <span className={cn("px-4 py-1 rounded-full text-[9px] font-semibold uppercase tracking-[0.25em] border", allRequirementsMet ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400")}>
                                                              {allRequirementsMet ? "Verification Threshold Met" : "Awaiting Information"}
                                                         </span>
                                                     </div>
                                                      <h3 className="text-4xl font-semibold tracking-tight italic text-foreground leading-none">
                                                          {allRequirementsMet ? "Ready for Approval" : "Work in Progress"}
                                                      </h3>
                                                     <p className="max-w-lg text-xs font-bold leading-relaxed text-muted-foreground">
                                                         {allRequirementsMet 
                                                             ? "All critical verification checks have passed. Finalizing this will prepare the lease contract." 
                                                             : "The application is currently being built. You can save it as a draft or proceed with manual verification."}
                                                     </p>
                                                 </div>
                                             </div>
                                        </CardFrame>

                                             <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                                 <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Unit Name</p>
                                                 <p className="text-2xl font-semibold tracking-tighter text-foreground">{currentUnit?.name || "N/A"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-semibold text-primary uppercase tracking-[0.3em]">{currentUnit?.property_name}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Applicant Name</p>
                                                 <p className="text-2xl font-semibold tracking-tighter text-foreground">{formData.applicant_name || "Guest"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-[0.3em] break-all">{formData.applicant_email}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Monthly Income</p>
                                                 <p className="text-2xl font-semibold uppercase italic tracking-tighter text-foreground">₱{parseIncome(formData.employment_info.monthly_income).toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="size-1.5 rounded-full bg-primary" />
                                                     <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Verified Monthly</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-primary/10 border border-primary/20 space-y-4 shadow-lg shadow-primary/5">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Monthly Rent</p>
                                                 <p className="text-2xl font-semibold tracking-tighter italic text-foreground">₱{leaseData.monthly_rent.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                     <p className="text-[9px] font-semibold text-primary uppercase tracking-[0.3em]">Locked Rate</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Lease Period</p>
                                                 <p className="text-lg font-semibold tracking-tighter text-foreground">{leaseData.start_date} to {leaseData.end_date}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="size-1.5 rounded-full bg-purple-400" />
                                                     <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">12 Months</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Security Deposit</p>
                                                 <p className="text-2xl font-semibold tracking-tighter text-foreground">₱{leaseData.security_deposit.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="size-1.5 rounded-full bg-green-400" />
                                                     <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{paymentData.security_deposit_payment.status === "completed" ? "Paid" : "Pending"}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Advance Payment</p>
                                                 <p className="text-2xl font-semibold tracking-tighter text-foreground">₱{paymentData.advance_payment.amount.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="size-1.5 rounded-full bg-green-400" />
                                                     <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{paymentData.advance_payment.status === "completed" ? "Paid" : "Pending"}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Emergency Contact</p>
                                                 <p className="text-xl font-semibold tracking-tighter text-foreground">{formData.emergency_contact_name || "—"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-semibold text-red-400 uppercase tracking-[0.3em]">{formData.emergency_contact_phone || "—"}</p>
                                                 </div>
                                             </div>
                                        </div>

                                        {/* Lease Signature Status */}
                                        {leaseData.landlord_signature && (
                                            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-4">
                                                <Check className="text-purple-500" size={24} />
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">Landlord Signature Captured</p>
                                                    <p className="text-xs text-muted-foreground">Tenant will receive signing link via email</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer / Unified Action Bridge */}
                    <div className="relative z-30 flex items-center justify-between gap-6 border-t border-border bg-card/95 p-8 backdrop-blur-3xl sm:px-12">
                        <div className="flex gap-4 w-full sm:w-auto">
                            {step > 0 && (
                                <button
                                    onClick={() => {
                                        if (step === 4 && paymentSubStep === 1) {
                                            setPaymentSubStep(0);
                                        } else {
                                            const prevStep = step - 1;
                                            setStep(prevStep);
                                            // If going back from step 5 to step 4, start at last substep
                                            if (prevStep === 4) setPaymentSubStep(1);
                                        }
                                    }}
                                    className="group relative flex h-16 items-center justify-center gap-3 overflow-hidden rounded-[1.25rem] border border-border bg-background px-10 font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
                                >
                                    <div className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%] dark:via-white/5" />
                                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                                    <span className="hidden sm:inline tracking-tighter text-sm uppercase">Prev</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 max-w-2xl flex gap-4">
                            {step < 5 ? (
                                <button
                                    onClick={handleContinue}
                                    className="group relative flex h-16 flex-1 items-center justify-center gap-4 overflow-hidden rounded-[1.25rem] bg-primary font-semibold text-primary-foreground shadow-[0_15px_45px_rgba(var(--primary-rgb),0.25)] transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10 transition-all duration-300 group-hover:h-2" />
                                     <span className="text-lg uppercase tracking-tight italic">Continue</span>
                                    <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} strokeWidth={2.5} />
                                </button>
                            ) : (
                                <>
                                    {!allRequirementsMet && (
                                        <button
                                            onClick={() => handleSubmit(true)}
                                            disabled={submitting}
                                            className="group flex h-16 items-center justify-center gap-3 rounded-[1.25rem] border border-amber-500/20 bg-amber-500/10 px-8 font-semibold text-amber-700 transition-all hover:bg-amber-500/20 active:scale-95 dark:text-amber-500"
                                        >
                                            <Save size={20} className="group-hover:scale-110 transition-transform" />                                             <span className="uppercase tracking-tight text-xs">Save as Draft</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={submitting}
                                        className={cn(
                                            "flex-1 h-16 rounded-[1.25rem] font-semibold transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl group overflow-hidden relative",
                                            allRequirementsMet 
                                                ? "bg-emerald-500 text-black shadow-emerald-500/20" 
                                                : "bg-primary text-primary-foreground shadow-primary/20"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
                                        {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="group-hover:rotate-[360deg] transition-transform duration-700" />}
                                         <span className="text-xl uppercase tracking-tighter italic relative z-10">
                                             {allRequirementsMet 
                                                ? (confirmApproval ? "Are you sure?" : "Finish & Approve") 
                                                : "Save & Finish"}
                                         </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                <ConfirmationModal 
                    isOpen={confirmApproval}
                    onClose={() => setConfirmApproval(false)}
                    onConfirm={() => handleSubmit(false)}
                    missingFields={missingFields}
                    isSubmitting={submitting}
                />
            </AnimatePresence>
        </div>
    );
}

