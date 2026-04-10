"use client";

import { useState, useEffect, useCallback, useMemo, type ChangeEvent, type ElementType, type InputHTMLAttributes, type ReactNode } from "react";
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
import { SignaturePad } from "./SignaturePad";
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
    valid_id: "Government ID",
    proof_of_income: "Proof of Income",
    background_reference: "References",
    application_form: "Application Form",
    move_in_payment: "Advance Payment",
};

const STEP_FIELD_KEYS: Record<number, FormErrorKey[]> = {
    0: ["unit", "applicant_name", "applicant_email", "applicant_phone", "move_in_date", "emergency_contact_name", "emergency_contact_phone"],
    1: ["occupation", "employer", "monthly_income", "message"],
    2: [],
    3: [], // Lease signing step - no form errors
    4: [], // Payment collection step - no form errors
    5: [], // Finalize step - no form errors
};

// ─── Sub-Components ──────────────────────────────────────────────────

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
                    className="ml-1 cursor-pointer text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground transition-all duration-300 group-focus-within:text-primary"
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
    const [selectedUnit, setSelectedUnit] = useState(selectedUnitId || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
    });

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

        setLeaseData((prev) => ({
            ...prev,
            start_date: formData.move_in_date,
            end_date: endDate.toISOString().split("T")[0],
            monthly_rent: currentUnit.rent_amount,
            security_deposit: currentUnit.rent_amount, // Default to one month's rent
        }));

        setPaymentData((prev) => ({
            advance_payment: {
                ...prev.advance_payment,
                amount: currentUnit.rent_amount,
            },
            security_deposit_payment: {
                ...prev.security_deposit_payment,
                amount: currentUnit.rent_amount,
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

    const allRequirementsMet = useMemo(() => 
        Object.values(formData.requirements_checklist).every(Boolean), 
    [formData.requirements_checklist]);

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
            setStep(s => s + 1);
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
            const shouldWarnIncomplete =
                !existingApplication && !asPending && step === 5 && !allRequirementsMet;

            if (shouldWarnIncomplete) {
                const ok = window.confirm(
                    "Some requirements are still missing. Finish anyway and mark this application as Approved?"
                );
                if (!ok) return;
            }
            const payload = existingApplication ? {
                application_id: existingApplication.id,
                requirements_checklist: formData.requirements_checklist,
                employment_info: { ...formData.employment_info, monthly_income: Number(formData.employment_info.monthly_income) || 0 },
                status: asPending ? "pending" : allRequirementsMet ? "approved" : "pending",
            } : {
                unit_id: selectedUnit,
                applicant_name: formData.applicant_name,
                applicant_phone: formData.applicant_phone,
                applicant_email: formData.applicant_email,
                move_in_date: formData.move_in_date || null,
                emergency_contact_name: formData.emergency_contact_name || null,
                emergency_contact_phone: formData.emergency_contact_phone || null,
                employment_info: { ...formData.employment_info, monthly_income: Number(formData.employment_info.monthly_income) || 0 },
                requirements_checklist: formData.requirements_checklist,
                message: formData.message,
                status: asPending ? "pending" : "approved",
                lease_data: {
                    start_date: leaseData.start_date,
                    end_date: leaseData.end_date,
                    monthly_rent: leaseData.monthly_rent,
                    security_deposit: leaseData.security_deposit,
                    terms: leaseData.terms,
                    landlord_signature: leaseData.landlord_signature,
                    signing_mode: leaseData.signing_mode,
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />

            {currentUnit?.property_id ? <ToolAccessBar propertyId={currentUnit.property_id} /> : null}
             
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 150 }}
                className={cn(
                    "relative w-full max-w-5xl h-[85vh] flex flex-col sm:flex-row z-10",
                    "overflow-hidden rounded-[2.5rem] border border-border bg-card/98 shadow-[0_0_80px_rgba(15,23,42,0.16)]",
                    "backdrop-blur-[60px]"
                )}
            >
                <BackgroundGlow />
                <Noise />

                {/* Left Rails / Navigation */}
                <aside className="relative z-20 hidden w-full shrink-0 flex-col overflow-hidden border-b border-border bg-background/80 p-10 sm:flex sm:w-80 sm:border-b-0 sm:border-r">
                    <div className="mb-14 flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                            <Building2 className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter leading-none text-foreground">iReside</h2>
                            <p className="text-primary font-black text-[9px] uppercase tracking-[0.4em] opacity-80 mt-1">MASTER PANEL</p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-2">
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
                                        "relative w-11 h-11 rounded-xl flex items-center justify-center z-10 transition-all duration-500 overflow-hidden",
                                        isActive ? "scale-105 bg-primary text-primary-foreground shadow-[0_0_24px_rgba(var(--primary-rgb),0.24)]" : 
                                        isCompleted ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                                        "border border-border bg-background text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check size={20} strokeWidth={3} /> : <s.icon size={19} strokeWidth={isActive ? 2.5 : 1.5} />}
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <p className={cn("font-black text-sm tracking-tight transition-all", isActive ? "text-foreground" : "text-muted-foreground")}>
                                            {s.label}
                                        </p>
                                        <p className={cn("text-[9px] uppercase tracking-widest font-bold", isActive ? "text-primary opacity-80" : "text-slate-500 dark:text-neutral-600")}>
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
                                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">{STEPS[step].label}</h2>
                                <p className="text-[9px] text-primary font-black uppercase tracking-widest">Step {step + 1} of 6</p>
                            </div>
                            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground"><X size={20}/></button>
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
                         <div>
                             <h1 className="text-3xl font-black tracking-tighter italic text-foreground">
                                 {STEPS[step].label.toUpperCase()} <span className="text-primary">STEP</span>
                             </h1>
                             <p className="ml-1 mt-1 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Tenant Application Wizard</p>
                         </div>
                          <button 
                             onClick={onClose} 
                             className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-all hover:scale-110 hover:bg-red-500/10 hover:text-red-500 active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500/50 outline-none"
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
                                                  <label htmlFor="unit-select" className="cursor-pointer text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Select Unit</label>
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
                                                                 "w-full h-20 appearance-none cursor-pointer bg-transparent pl-16 pr-12 text-lg font-black tracking-tighter text-foreground outline-none transition-all disabled:opacity-50",
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
                                                         <span className="text-[10px] font-black uppercase text-primary tracking-widest">Monthly Rent</span>
                                                        <span className="text-lg font-black italic text-foreground">₱{currentUnit.rent_amount.toLocaleString()}</span>
                                                    </motion.div>
                                                )}
                                            </section>

                                            <section className="space-y-6">
                                                 <div className="flex items-center gap-4 text-blue-400">
                                                     <User size={18} strokeWidth={2.5} />
                                                     <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Applicant Information</h3>
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
                                                     <label htmlFor="move-in-date" className="ml-1 cursor-pointer text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground transition-all duration-300 group-focus-within:text-primary">
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
                                                     <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Emergency Contact</h3>
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
                                                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Financial Details</h3>
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
                                                     icon={() => <span className="font-black text-primary/80">₱</span>} 
                                                     label="Monthly Net Income" 
                                                     type="number"
                                                     placeholder="0.00"
                                                     value={formData.employment_info.monthly_income}
                                                     error={formErrors.monthly_income}
                                                     nextFieldId="additional-notes"
                                                     onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("employment_info", { ...formData.employment_info, monthly_income: e.target.value }, ["monthly_income"])}
                                                 />
                                            </div>
                                        </section>

                                        <section className="space-y-6">
                                              <div className="flex items-center gap-4 text-muted-foreground">
                                                  <FileCheck size={18} strokeWidth={2.5} />
                                                 <label htmlFor="additional-notes" className="cursor-pointer text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Additional Notes</label>
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
                                    <div className="space-y-10">
                                        <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 text-amber-200 text-xs font-bold leading-relaxed flex gap-6 items-center shadow-[0_15px_30px_rgba(245,158,11,0.05)] backdrop-blur-sm">
                                            <div className="shrink-0 w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                                <AlertCircle className="text-amber-500" size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                 <p className="text-[11px] uppercase tracking-widest font-black text-amber-500/80">Requirement Checklist</p>
                                                 <p className="opacity-80">Full approval requires all items below to be checked. Incomplete entries will be saved but marked as <span className="text-amber-400 italic underline decoration-2">Pending Review</span>.</p>
                                             </div>
                                        </div>

                                             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                 {Object.entries(formData.requirements_checklist).map(([key, value], idx) => (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={key}
                                                    onClick={() => toggleRequirement(key)}
                                                    className={cn(
                                                        "w-full h-24 rounded-[2rem] border transition-all duration-500 flex items-center justify-between px-8 group relative overflow-hidden text-left",
                                                            value 
                                                                ? "bg-emerald-500/5 border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.1)]" 
                                                                : "bg-card/90 border-border hover:bg-card hover:border-primary/20"
                                                        )}
                                                    >
                                                    <div className="relative z-10 flex items-center gap-6">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                            value ? "bg-emerald-500 text-black shadow-lg" : "bg-background text-muted-foreground"
                                                        )}>
                                                            {value ? <Check size={20} strokeWidth={3} /> : <FileCheck size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-base font-black tracking-tight transition-colors", value ? "text-foreground" : "text-muted-foreground")}>
                                                                {REQUIREMENT_LABELS[key]}
                                                            </p>
                                                            <p className={cn("mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em]", value ? "text-emerald-700/70 dark:text-emerald-500/70" : "text-slate-500 dark:text-neutral-600")}>
                                                                {value ? "Verified Success" : "Awaiting Audit"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10">
                                                        {value ? (
                                                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/30">
                                                                <Check size={14} strokeWidth={4} />
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full border-2 border-dashed border-border transition-all duration-700 group-hover:rotate-180 group-hover:border-primary/50" />
                                                        )}
                                                    </div>
                                                    
                                                    {/* Background Success Effect */}
                                                    {value && (
                                                        <motion.div 
                                                            layoutId={`check-bg-${key}`}
                                                            className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] to-transparent -z-10" 
                                                        />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-10 max-w-4xl">
                                        <div className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/10 text-purple-200 text-xs font-bold leading-relaxed flex gap-6 items-center shadow-[0_15px_30px_rgba(168,85,247,0.05)] backdrop-blur-sm">
                                            <div className="shrink-0 w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                                <PenTool className="text-purple-500" size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] uppercase tracking-widest font-black text-purple-500/80">Lease Agreement & Signing</p>
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
                                            onChange={(mode) => setLeaseData({ ...leaseData, signing_mode: mode })}
                                            disabled={!!(leaseData.tenant_signature || leaseData.landlord_signature)}
                                        />

                                        {/* Show lease terms and signatures only after mode is selected */}
                                        {leaseData.signing_mode && (
                                            <>
                                                {/* Lease Terms Display */}
                                                <section className="space-y-6">
                                                    <div className="flex items-center gap-4 text-purple-400">
                                                        <FileCheck size={18} strokeWidth={2.5} />
                                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Lease Terms</h3>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                                                Start Date
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <input
                                                                    type="date"
                                                                    value={leaseData.start_date}
                                                                    onChange={(e) => setLeaseData({ ...leaseData, start_date: e.target.value })}
                                                                    className="h-15 w-full rounded-2xl bg-transparent px-4 py-4 text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                                                End Date
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <input
                                                                    type="date"
                                                                    value={leaseData.end_date}
                                                                    onChange={(e) => setLeaseData({ ...leaseData, end_date: e.target.value })}
                                                                    className="h-15 w-full rounded-2xl bg-transparent px-4 py-4 text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                                                Monthly Rent
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₱</div>
                                                                <input
                                                                    type="number"
                                                                    value={leaseData.monthly_rent}
                                                                    onChange={(e) => setLeaseData({ ...leaseData, monthly_rent: parseFloat(e.target.value) || 0 })}
                                                                    className="h-15 w-full rounded-2xl bg-transparent py-4 pl-8 pr-4 text-sm font-medium text-foreground outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 group">
                                                            <label className="ml-1 text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                                                                Security Deposit
                                                            </label>
                                                            <div className="relative isolate">
                                                                <div className="absolute inset-0 -z-10 rounded-2xl border border-border bg-card/90" />
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₱</div>
                                                                <input
                                                                    type="number"
                                                                    value={leaseData.security_deposit}
                                                                    onChange={(e) => setLeaseData({ ...leaseData, security_deposit: parseFloat(e.target.value) || 0 })}
                                                                    className="h-15 w-full rounded-2xl bg-transparent py-4 pl-8 pr-4 text-sm font-medium text-foreground outline-none"
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
                                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Tenant Signature</h3>
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
                                                                        onSave={(dataUrl) => setLeaseData({ ...leaseData, tenant_signature: dataUrl })}
                                                                        onClear={() => setLeaseData({ ...leaseData, tenant_signature: null })}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                                                                        <img src={leaseData.tenant_signature} alt="Tenant Signature" className="max-h-40 mx-auto" />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLeaseData({ ...leaseData, tenant_signature: null, landlord_signature: null })}
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
                                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Landlord Signature</h3>
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
                                                                    onSave={(dataUrl) => setLeaseData({ ...leaseData, landlord_signature: dataUrl })}
                                                                    onClear={() => setLeaseData({ ...leaseData, landlord_signature: null })}
                                                                />
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
                                                                        <img src={leaseData.landlord_signature} alt="Landlord Signature" className="max-h-40 mx-auto" />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setLeaseData({ ...leaseData, landlord_signature: null })}
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
                                                    <p className="text-xs leading-relaxed text-slate-500 dark:text-neutral-500">
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
                                    <div className="space-y-10 max-w-4xl">
                                        <div className="p-8 rounded-[2.5rem] bg-green-500/5 border border-green-500/10 text-green-200 text-xs font-bold leading-relaxed flex gap-6 items-center shadow-[0_15px_30px_rgba(34,197,94,0.05)] backdrop-blur-sm">
                                            <div className="shrink-0 w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                                                <DollarSign className="text-green-500" size={28} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] uppercase tracking-widest font-black text-green-500/80">Payment Collection</p>
                                                <p className="opacity-80">Record advance rent and security deposit payments. You can mark them as pending if not yet received.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Advance Payment */}
                                            <PaymentRecordForm
                                                label="Advance Rent Payment"
                                                amount={paymentData.advance_payment.amount}
                                                allowAmountEdit={false}
                                                paymentMethod={paymentData.advance_payment.method}
                                                onMethodChange={(method) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        advance_payment: { ...paymentData.advance_payment, method },
                                                    })
                                                }
                                                referenceNumber={paymentData.advance_payment.reference_number}
                                                onReferenceChange={(ref) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        advance_payment: { ...paymentData.advance_payment, reference_number: ref },
                                                    })
                                                }
                                                paidAt={paymentData.advance_payment.paid_at}
                                                onPaidAtChange={(date) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        advance_payment: { ...paymentData.advance_payment, paid_at: date },
                                                    })
                                                }
                                                status={paymentData.advance_payment.status}
                                                onStatusChange={(status) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        advance_payment: { ...paymentData.advance_payment, status },
                                                    })
                                                }
                                            />

                                            {/* Security Deposit */}
                                            <PaymentRecordForm
                                                label="Security Deposit Payment"
                                                amount={paymentData.security_deposit_payment.amount}
                                                onAmountChange={(amount) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        security_deposit_payment: { ...paymentData.security_deposit_payment, amount },
                                                    })
                                                }
                                                allowAmountEdit={true}
                                                paymentMethod={paymentData.security_deposit_payment.method}
                                                onMethodChange={(method) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        security_deposit_payment: { ...paymentData.security_deposit_payment, method },
                                                    })
                                                }
                                                referenceNumber={paymentData.security_deposit_payment.reference_number}
                                                onReferenceChange={(ref) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        security_deposit_payment: { ...paymentData.security_deposit_payment, reference_number: ref },
                                                    })
                                                }
                                                paidAt={paymentData.security_deposit_payment.paid_at}
                                                onPaidAtChange={(date) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        security_deposit_payment: { ...paymentData.security_deposit_payment, paid_at: date },
                                                    })
                                                }
                                                status={paymentData.security_deposit_payment.status}
                                                onStatusChange={(status) =>
                                                    setPaymentData({
                                                        ...paymentData,
                                                        security_deposit_payment: { ...paymentData.security_deposit_payment, status },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="space-y-10 pb-12">
                                        <CardFrame className={cn(
                                            "!p-0 !min-h-[220px] transition-all duration-1000",
                                            allRequirementsMet ? "border-emerald-500/30 shadow-emerald-500/5" : "border-amber-500/30 shadow-amber-500/5"
                                        )}>
                                             <div className="absolute right-0 top-0 w-1/3 h-full overflow-hidden opacity-20 select-none pointer-events-none">
                                                 <Fingerprint size={300} strokeWidth={1} className={cn(allRequirementsMet ? "text-emerald-500" : "text-amber-500")} />
                                             </div>
                                             
                                             <div className="p-10 flex flex-col sm:flex-row gap-10 items-center relative z-10">
                                                 <div className={cn(
                                                     "shrink-0 w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-4 shadow-2xl relative",
                                                     allRequirementsMet ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-amber-500/10 border-amber-500 text-amber-500"
                                                 )}>
                                                     {allRequirementsMet ? <CheckCircle2 size={40} strokeWidth={2.5}/> : <AlertCircle size={40} strokeWidth={2.5} />}
                                                     <div className={cn("absolute inset-0 rounded-[2.5rem] border-inherit blur-xl opacity-35", allRequirementsMet ? "bg-emerald-500" : "bg-amber-500")} />
                                                 </div>
                                                 <div className="text-center sm:text-left space-y-3">
                                                     <div className="flex items-center gap-3 justify-center sm:justify-start">
                                                         <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border", allRequirementsMet ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400")}>
                                                              {allRequirementsMet ? "Ready to Move In" : "Pending Review"}
                                                         </span>
                                                     </div>
                                                      <h3 className="text-5xl font-black tracking-tight italic text-foreground">
                                                          {allRequirementsMet ? "APPROVED" : "PENDING"}
                                                      </h3>
                                                     <p className="max-w-lg text-sm font-bold leading-relaxed text-muted-foreground">
                                                         {allRequirementsMet 
                                                             ? "Verification pass complete. Finalizing this will immediately allocate the asset and generate relevant legal documentation." 
                                                             : "Verification threshold not met. System will store applicant data but require physical documents before asset handover."}
                                                     </p>
                                                 </div>
                                             </div>
                                        </CardFrame>

                                             <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                                                 <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unit Name</p>
                                                 <p className="text-2xl font-black tracking-tighter text-foreground">{currentUnit?.name || "N/A"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">{currentUnit?.property_name}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applicant Name</p>
                                                 <p className="text-2xl font-black tracking-tighter text-foreground">{formData.applicant_name || "Guest"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] break-all">{formData.applicant_email}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Income</p>
                                                 <p className="text-2xl font-black uppercase italic tracking-tighter text-foreground">₱{Number(formData.employment_info.monthly_income).toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Verified Monthly</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-primary/10 border border-primary/20 space-y-4 shadow-lg shadow-primary/5">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Monthly Rent</p>
                                                 <p className="text-2xl font-black tracking-tighter italic text-foreground">₱{leaseData.monthly_rent.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Locked Rate</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lease Period</p>
                                                 <p className="text-lg font-black tracking-tighter text-foreground">{leaseData.start_date} to {leaseData.end_date}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">12 Months</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Deposit</p>
                                                 <p className="text-2xl font-black tracking-tighter text-foreground">₱{leaseData.security_deposit.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{paymentData.security_deposit_payment.status === "completed" ? "Paid" : "Pending"}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Advance Payment</p>
                                                 <p className="text-2xl font-black tracking-tighter text-foreground">₱{paymentData.advance_payment.amount.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{paymentData.advance_payment.status === "completed" ? "Paid" : "Pending"}</p>
                                                 </div>
                                             </div>
                                             <div className="space-y-4 rounded-[2rem] border border-border bg-card/90 p-7">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Emergency Contact</p>
                                                 <p className="text-xl font-black tracking-tighter text-foreground">{formData.emergency_contact_name || "—"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em]">{formData.emergency_contact_phone || "—"}</p>
                                                 </div>
                                             </div>
                                        </div>

                                        {/* Lease Signature Status */}
                                        {leaseData.landlord_signature && (
                                            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center gap-4">
                                                <Check className="text-purple-500" size={24} />
                                                <div>
                                                    <p className="text-sm font-black text-foreground">Landlord Signature Captured</p>
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
                                    onClick={() => setStep(step - 1)}
                                    className="group relative flex h-16 items-center justify-center gap-3 overflow-hidden rounded-[1.25rem] border border-border bg-background px-10 font-black text-foreground transition-all hover:bg-muted active:scale-95"
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
                                    className="group relative flex h-16 flex-1 items-center justify-center gap-4 overflow-hidden rounded-[1.25rem] bg-primary font-black text-primary-foreground shadow-[0_15px_45px_rgba(var(--primary-rgb),0.25)] transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98]"
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
                                            className="group flex h-16 items-center justify-center gap-3 rounded-[1.25rem] border border-amber-500/20 bg-amber-500/10 px-8 font-black text-amber-700 transition-all hover:bg-amber-500/20 active:scale-95 dark:text-amber-500"
                                        >
                                            <Save size={20} className="group-hover:scale-110 transition-transform" />                                             <span className="uppercase tracking-tight text-xs">Save as Draft</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={submitting}
                                        className={cn(
                                            "flex-1 h-16 rounded-[1.25rem] font-black transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl group overflow-hidden relative",
                                            allRequirementsMet 
                                                ? "bg-emerald-500 text-black shadow-emerald-500/20" 
                                                : "bg-primary text-primary-foreground shadow-primary/20"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500" />
                                        {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="group-hover:rotate-[360deg] transition-transform duration-700" />}
                                         <span className="text-xl uppercase tracking-tighter italic relative z-10">
                                             {allRequirementsMet ? "Finish & Approve" : "Save & Finish"}
                                         </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
