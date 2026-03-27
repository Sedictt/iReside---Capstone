"use client";

import { useState, useEffect, useCallback, useMemo, type ChangeEvent, type ElementType, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
    move_in_date: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
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
    { label: "Finalize", sub: "Summary", icon: FileCheck, color: "text-emerald-400" },
];

const DEFAULT_CHECKLIST: RequirementsChecklist = {
    valid_id: false,
    proof_of_income: false,
    background_reference: false,
    application_form: false,
    move_in_payment: false,
};

const REQUIREMENT_LABELS: Record<string, string> = {
    valid_id: "Government ID",
    proof_of_income: "Proof of Income",
    background_reference: "References",
    application_form: "Application Form",
    move_in_payment: "Advance Payment",
};

const DEFAULT_EMPLOYMENT: EmploymentInfo = {
    occupation: "",
    employer: "",
    monthly_income: "",
};

type FormErrorKey =
    | "unit"
    | "applicant_name"
    | "applicant_phone"
    | "applicant_email"
    | "move_in_date"
    | "emergency_contact_name"
    | "emergency_contact_phone"
    | "occupation"
    | "employer"
    | "monthly_income"
    | "message";

const STEP_FIELD_KEYS: Record<number, FormErrorKey[]> = {
    0: ["unit", "applicant_name", "applicant_email", "applicant_phone", "move_in_date", "emergency_contact_name", "emergency_contact_phone"],
    1: ["occupation", "employer", "monthly_income", "message"],
    2: [],
    3: [],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_REGEX = /^[+()\-\s\d]+$/;

function getPhoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

function validateFormStep(
    currentStep: number,
    selectedUnit: string,
    formData: WalkInFormData,
    existingApplication?: WalkInApplicationModalProps["existingApplication"]
): Partial<Record<FormErrorKey, string>> {
    const errors: Partial<Record<FormErrorKey, string>> = {};

    if (currentStep === 0) {
        const name = formData.applicant_name.trim();
        const email = formData.applicant_email.trim();
        const phone = formData.applicant_phone.trim();

        if (!existingApplication && !selectedUnit) {
            errors.unit = "Please select a unit.";
        }

        if (!name) {
            errors.applicant_name = "Applicant name is required.";
        } else if (name.length < 2 || name.length > 100) {
            errors.applicant_name = "Name must be between 2 and 100 characters.";
        }

        if (!email) {
            errors.applicant_email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email)) {
            errors.applicant_email = "Enter a valid email address.";
        }

        if (phone) {
            const digits = getPhoneDigits(phone);
            if (!PHONE_ALLOWED_REGEX.test(phone)) {
                errors.applicant_phone = "Phone contains invalid characters.";
            } else if (digits.length < 10 || digits.length > 15) {
                errors.applicant_phone = "Phone number must have 10 to 15 digits.";
            }
        }

        if (!formData.move_in_date) {
            errors.move_in_date = "Move-in date is required.";
        }

        const ecName = formData.emergency_contact_name.trim();
        if (!ecName) {
            errors.emergency_contact_name = "Emergency contact name is required.";
        } else if (ecName.length < 2 || ecName.length > 100) {
            errors.emergency_contact_name = "Name must be between 2 and 100 characters.";
        }

        const ecPhone = formData.emergency_contact_phone.trim();
        if (!ecPhone) {
            errors.emergency_contact_phone = "Emergency contact number is required.";
        } else {
            const ecDigits = getPhoneDigits(ecPhone);
            if (!PHONE_ALLOWED_REGEX.test(ecPhone)) {
                errors.emergency_contact_phone = "Phone contains invalid characters.";
            } else if (ecDigits.length < 10 || ecDigits.length > 15) {
                errors.emergency_contact_phone = "Phone number must have 10 to 15 digits.";
            }
        }
    }

    if (currentStep === 1) {
        const occupation = formData.employment_info.occupation.trim();
        const employer = formData.employment_info.employer.trim();
        const incomeRaw = String(formData.employment_info.monthly_income).trim();
        const incomeNumber = Number(incomeRaw);
        const messageLength = formData.message.trim().length;

        if (!occupation) {
            errors.occupation = "Occupation is required.";
        } else if (occupation.length < 2 || occupation.length > 100) {
            errors.occupation = "Occupation must be 2 to 100 characters.";
        }

        if (!employer) {
            errors.employer = "Employer is required.";
        } else if (employer.length < 2 || employer.length > 100) {
            errors.employer = "Employer must be 2 to 100 characters.";
        }

        if (!incomeRaw) {
            errors.monthly_income = "Monthly income is required.";
        } else if (!Number.isFinite(incomeNumber) || incomeNumber <= 0) {
            errors.monthly_income = "Monthly income must be a positive number.";
        } else if (incomeNumber > 10_000_000) {
            errors.monthly_income = "Monthly income looks too high.";
        }

        if (messageLength > 1000) {
            errors.message = "Notes must not exceed 1000 characters.";
        }
    }

    return errors;
}

// ─── Sub-Components ──────────────────────────────────────────────────

const Noise = () => (
    <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0 mix-blend-soft-light" 
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2003/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
    />
);

const BackgroundGlow = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
            animate={{ 
                x: [0, 50, -50, 0], 
                y: [0, -30, 30, 0],
                scale: [1, 1.2, 0.8, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6d9838]/20 blur-[100px] rounded-full" 
        />
        <motion.div 
            animate={{ 
                x: [0, -40, 40, 0], 
                y: [0, 50, -50, 0],
                scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/15 blur-[100px] rounded-full" 
        />
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
                    className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400 group-focus-within:text-primary transition-all duration-300 ml-1 cursor-pointer"
                >
                    {label}
                </label>
            )}
            <div className="relative isolate">
                <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.12] rounded-2xl group-hover:bg-white/[0.09] transition-all duration-300 -z-10 group-focus-within:ring-4 group-focus-within:ring-primary/20 group-focus-within:border-primary/50 group-focus-within:bg-white/[0.1]" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary transition-all duration-500 transform group-focus-within:scale-110 group-focus-within:rotate-[5deg]">
                    <Icon size={18} strokeWidth={1.5} />
                </div>
                <input
                    {...props}
                    id={id}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "w-full h-15 bg-transparent rounded-2xl pl-12 pr-4 text-white text-sm outline-none transition-all py-4 placeholder:text-neutral-500 font-medium tracking-tight",
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
        "relative rounded-[2.5rem] border border-white/[0.12] overflow-hidden bg-white/[0.05] backdrop-blur-2xl transition-all",
        glow && "hover:border-white/25 hover:shadow-[0_0_50px_rgba(255,255,255,0.04)]",
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

    const updateField = useCallback((
        field: keyof WalkInFormData,
        value: WalkInFormData[keyof WalkInFormData],
        validateKeys: FormErrorKey[] = []
    ) => {
        const nextFormData = { ...formData, [field]: value };
        setFormData(nextFormData);

        if (validateKeys.length > 0) {
            const liveErrors = validateFormStep(step, selectedUnit, nextFormData, existingApplication);

            setTouchedFields((prev) => {
                const next = { ...prev };
                validateKeys.forEach((key) => {
                    next[key] = true;
                });
                return next;
            });

            setFormErrors((prev) => {
                const next = { ...prev };
                validateKeys.forEach((key) => {
                    next[key] = liveErrors[key];
                });
                return next;
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
        const errors = validateFormStep(currentStep, selectedUnit, formData, existingApplication);
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

        const stepZeroErrors = validateFormStep(0, selectedUnit, formData, existingApplication);
        const stepOneErrors = validateFormStep(1, selectedUnit, formData, existingApplication);
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
            const endpoint = "/api/landlord/applications/walk-in";
            const method = existingApplication ? "PATCH" : "POST";
            const shouldWarnIncomplete =
                !existingApplication && !asPending && step === 3 && !allRequirementsMet;

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
            };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error((await res.json()).error || "Failed to save.");
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

    const currentUnit = units.find((u) => u.id === selectedUnit);

    return (
        <LayoutGroup>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 150 }}
                className={cn(
                    "relative w-full max-w-5xl h-[85vh] flex flex-col sm:flex-row z-10",
                    "bg-[#141414] border border-white/[0.12] rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.7)] overflow-hidden",
                    "backdrop-blur-[60px]"
                )}
            >
                <BackgroundGlow />
                <Noise />

                {/* Left Rails / Navigation */}
                <aside className="w-full sm:w-80 p-10 border-b sm:border-b-0 sm:border-r border-white/[0.1] bg-white/[0.04] relative hidden sm:flex flex-col z-20 overflow-hidden shrink-0">
                    <div className="mb-14 flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                            <Building2 className="text-primary w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter leading-none">iReside</h2>
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
                                        isActive ? "bg-white/[0.04] translate-x-1" : "hover:bg-white/[0.02] opacity-40 hover:opacity-70"
                                    )}
                                >
                                    <div className={cn(
                                        "relative w-11 h-11 rounded-xl flex items-center justify-center z-10 transition-all duration-500 overflow-hidden",
                                        isActive ? "bg-primary text-black scale-110 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] animate-pulse" : 
                                        isCompleted ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                                        "bg-neutral-900 border border-white/5 text-neutral-600"
                                    )}>
                                        {isCompleted ? <Check size={20} strokeWidth={3} /> : <s.icon size={19} strokeWidth={isActive ? 2.5 : 1.5} />}
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <p className={cn("font-black text-sm tracking-tight transition-all", isActive ? "text-white" : "text-neutral-400")}>
                                            {s.label}
                                        </p>
                                        <p className={cn("text-[9px] uppercase tracking-widest font-bold", isActive ? "text-primary opacity-80" : "text-neutral-600")}>
                                            {s.sub}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <motion.div layoutId="rail-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full shadow-[0_0_20px_rgba(109,152,56,1)]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-auto">
                        <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] space-y-4">
                           <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                               <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">WIZARD ACTIVE</span>
                           </div>
                           <p className="text-[11px] text-neutral-400 font-bold leading-relaxed tracking-tight">
                               Completing this form manually adds a tenant to your system immediately.
                           </p>
                        </div>
                    </div>
                </aside>

                {/* Primary Content Container */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                     <div className="sm:hidden border-b border-white/[0.1] bg-[#1a1a1a] backdrop-blur-md relative">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{STEPS[step].label}</h2>
                                <p className="text-[9px] text-primary font-black uppercase tracking-widest">Step {step + 1} of 4</p>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white"><X size={20}/></button>
                        </div>
                        {/* Mobile Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-white/10 w-full overflow-hidden">
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
                             <h1 className="text-3xl font-black text-white tracking-tighter italic">
                                 {STEPS[step].label.toUpperCase()} <span className="text-primary">STEP</span>
                             </h1>
                             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1 mt-1">Walk-in Application Wizard</p>
                         </div>
                          <button 
                             onClick={onClose} 
                             className="pointer-events-auto h-12 w-12 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 flex items-center justify-center rounded-2xl transition-all hover:scale-110 active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500/50 outline-none"
                         >
                             <X size={20} />
                         </button>
                    </div>

                    {/* Step Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 sm:px-12 pb-10 custom-scrollbar-premium">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, scale: 0.95, y: 15, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.05, y: -15, filter: "blur(10px)" }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full"
                            >
                                {error && (
                                    <div className="mb-10 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 text-sm font-bold backdrop-blur-sm animate-shake">
                                        <AlertCircle size={20} /> {error}
                                    </div>
                                )}

                                {step === 0 && (
                                    <div className="space-y-10 max-w-3xl">
                                        <div className="space-y-8">
                                            <section className="space-y-6">
                                                  <div className="flex items-center gap-4 text-primary">
                                                     <MapPin size={18} strokeWidth={2.5} />
                                                     <label htmlFor="unit-select" className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 cursor-pointer">Select Unit</label>
                                                 </div>
                                                
                                                <CardFrame className="!p-0" glow={false}>
                                                    <div className="relative group">
                                                        <Building className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-all duration-300 pointer-events-none" size={20} />
                                                         <select
                                                             id="unit-select"
                                                             value={selectedUnit}
                                                             onChange={(e) => {
                                                                                     const nextUnit = e.target.value;
                                                                                     setSelectedUnit(nextUnit);
                                                                                     setTouchedFields((prev) => ({ ...prev, unit: true }));
                                                                                     const liveErrors = validateFormStep(step, nextUnit, formData, existingApplication);
                                                                                     setFormErrors((prev) => ({ ...prev, unit: liveErrors.unit }));
                                                             }}
                                                             disabled={!!existingApplication}
                                                             className={cn(
                                                                 "w-full h-20 bg-transparent pl-16 pr-12 text-white text-lg font-black outline-none transition-all appearance-none cursor-pointer tracking-tighter disabled:opacity-50",
                                                                 "focus-visible:ring-4 focus-visible:ring-primary/10",
                                                                 formErrors.unit && "text-red-400"
                                                             )}
                                                         >
                                                            <option value="" className="bg-[#1a1a1a] text-sm">Select Target Unit...</option>
                                                            {units.map((u) => (
                                                                <option key={u.id} value={u.id} className="bg-[#1a1a1a] text-sm py-4">
                                                                    {u.name} — {u.property_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ArrowRight size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-700 rotate-90 pointer-events-none" />
                                                    </div>
                                                </CardFrame>
                                                {formErrors.unit && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.unit}</p>}
                                                {currentUnit && (
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                                                         <span className="text-[10px] font-black uppercase text-primary tracking-widest">Monthly Rent</span>
                                                        <span className="text-lg font-black text-white italic">₱{currentUnit.rent_amount.toLocaleString()}</span>
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
                                                     <label htmlFor="move-in-date" className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-400 group-focus-within:text-primary transition-all duration-300 ml-1 cursor-pointer">
                                                         Move-in Date
                                                     </label>
                                                     <div className="relative isolate">
                                                         <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.12] rounded-2xl group-hover:bg-white/[0.09] transition-all duration-300 -z-10 group-focus-within:ring-4 group-focus-within:ring-primary/20 group-focus-within:border-primary/50 group-focus-within:bg-white/[0.1]" />
                                                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-primary transition-all duration-500">
                                                             <MapPin size={18} strokeWidth={1.5} />
                                                         </div>
                                                         <input
                                                             id="move-in-date"
                                                             type="date"
                                                             value={formData.move_in_date}
                                                             onChange={(e) => updateField("move_in_date", e.target.value, ["move_in_date"])}
                                                             className="w-full h-15 bg-transparent rounded-2xl pl-12 pr-4 text-white text-sm outline-none transition-all py-4 placeholder:text-neutral-500 font-medium tracking-tight focus-visible:ring-0 [color-scheme:dark]"
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
                                              <div className="flex items-center gap-4 text-neutral-400">
                                                 <FileCheck size={18} strokeWidth={2.5} />
                                                 <label htmlFor="additional-notes" className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 cursor-pointer">Additional Notes</label>
                                             </div>
                                            <div className="relative isolate">
                                                <div className="absolute inset-0 bg-white/[0.06] border border-white/[0.12] rounded-[2rem] -z-10 hover:bg-white/[0.08] transition-all duration-300" />
                                                <textarea
                                                     id="additional-notes"
                                                     placeholder="Add internal notes about the applicant's character, urgent requests, or specific unit adjustments here..."
                                                     className={cn(
                                                         "w-full bg-transparent p-7 text-white text-sm outline-none transition-all min-h-[180px] resize-none leading-relaxed font-medium placeholder:text-neutral-500",
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

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                            : "bg-white/[0.05] border-white/[0.12] hover:bg-white/[0.08] hover:border-white/25"
                                                    )}
                                                >
                                                    <div className="relative z-10 flex items-center gap-6">
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                            value ? "bg-emerald-500 text-black shadow-lg" : "bg-white/[0.1] text-neutral-400"
                                                        )}>
                                                            {value ? <Check size={20} strokeWidth={3} /> : <FileCheck size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className={cn("text-base font-black tracking-tight transition-colors", value ? "text-white" : "text-neutral-400")}>
                                                                {REQUIREMENT_LABELS[key]}
                                                            </p>
                                                            <p className={cn("text-[9px] uppercase tracking-[0.2em] font-bold mt-0.5", value ? "text-emerald-500/70" : "text-neutral-600")}>
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
                                                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 group-hover:border-primary/50 group-hover:rotate-180 transition-all duration-700" />
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
                                                     <motion.div 
                                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                        className={cn("absolute inset-0 rounded-[2.5rem] border-inherit blur-xl", allRequirementsMet ? "bg-emerald-500" : "bg-amber-500")}
                                                     />
                                                 </div>
                                                 <div className="text-center sm:text-left space-y-3">
                                                     <div className="flex items-center gap-3 justify-center sm:justify-start">
                                                         <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border", allRequirementsMet ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400")}>
                                                              {allRequirementsMet ? "Ready to Move In" : "Pending Review"}
                                                         </span>
                                                     </div>
                                                      <h3 className="text-5xl font-black text-white tracking-tight italic">
                                                          {allRequirementsMet ? "APPROVED" : "PENDING"}
                                                      </h3>
                                                     <p className="text-neutral-400 text-sm font-bold max-w-lg leading-relaxed mix-blend-plus-lighter opacity-80">
                                                         {allRequirementsMet 
                                                             ? "Verification pass complete. Finalizing this will immediately allocate the asset and generate relevant legal documentation." 
                                                             : "Verification threshold not met. System will store applicant data but require physical documents before asset handover."}
                                                     </p>
                                                 </div>
                                             </div>
                                        </CardFrame>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                             <div className="p-7 rounded-[2rem] bg-white/[0.06] border border-white/[0.12] space-y-4">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Unit Name</p>
                                                 <p className="text-2xl font-black text-white tracking-tighter">{currentUnit?.name || "N/A"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">{currentUnit?.property_name}</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-white/[0.06] border border-white/[0.12] space-y-4">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Applicant Name</p>
                                                 <p className="text-2xl font-black text-white tracking-tighter">{formData.applicant_name || "Guest"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] break-all">{formData.applicant_email}</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-white/[0.06] border border-white/[0.12] space-y-4">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Monthly Income</p>
                                                 <p className="text-2xl font-black text-white tracking-tighter uppercase italic">₱{Number(formData.employment_info.monthly_income).toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                     <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em]">Verified Monthly</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-primary/10 border border-primary/20 space-y-4 shadow-lg shadow-primary/5">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Monthly Rent</p>
                                                 <p className="text-2xl font-black text-white tracking-tighter italic">₱{currentUnit?.rent_amount.toLocaleString()}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Locked Rate</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-white/[0.06] border border-white/[0.12] space-y-4">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Move-in Date</p>
                                                 <p className="text-2xl font-black text-white tracking-tighter">{formData.move_in_date || "—"}</p>
                                                 <div className="pt-2 flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                     <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.3em]">Scheduled</p>
                                                 </div>
                                             </div>
                                             <div className="p-7 rounded-[2rem] bg-white/[0.06] border border-white/[0.12] space-y-4">
                                                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Emergency Contact</p>
                                                 <p className="text-xl font-black text-white tracking-tighter">{formData.emergency_contact_name || "—"}</p>
                                                 <div className="pt-2">
                                                     <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em]">{formData.emergency_contact_phone || "—"}</p>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer / Unified Action Bridge */}
                    <div className="p-8 sm:px-12 bg-[#1a1a1a] border-t border-white/[0.1] flex items-center justify-between gap-6 backdrop-blur-3xl relative z-30">
                        <div className="flex gap-4 w-full sm:w-auto">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="h-16 px-10 rounded-[1.25rem] bg-white/5 border border-white/10 text-white font-black transition-all flex items-center justify-center gap-3 active:scale-95 hover:bg-white/10 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                                    <span className="hidden sm:inline tracking-tighter text-sm uppercase">Prev</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 max-w-2xl flex gap-4">
                            {step < 3 ? (
                                <button
                                    onClick={handleContinue}
                                    className="group flex-1 h-16 rounded-[1.25rem] bg-primary text-black font-black transition-all flex items-center justify-center gap-4 shadow-[0_15px_45px_rgba(var(--primary-rgb),0.25)] hover:shadow-primary/40 active:scale-[0.98] relative overflow-hidden"
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
                                            className="group px-8 h-16 rounded-[1.25rem] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black transition-all flex items-center justify-center gap-3 hover:bg-amber-500/20 active:scale-95"
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
                                                : "bg-primary text-black shadow-primary/20"
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
        </LayoutGroup>
    );
}
