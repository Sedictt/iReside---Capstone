
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Building,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    FileText,
    Home,
    Info,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Upload,
    User,
    X,
    Zap
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
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
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/Logo";
import { toast } from "sonner";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";

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
    const router = useRouter();
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
        () => invite?.units.find((u) => u.id === selectedUnit),
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

    const stepDefinitions = isOnlineInvite ? [
        { id: 0, title: "Personal Details", icon: User, desc: "Your basic identity and contact information" },
        { id: 1, title: "Employment", icon: Briefcase, desc: "Verify your source of income and professional background" },
        { id: 2, title: "Documents", icon: FileText, desc: "Upload necessary proofs for your application" },
        { id: 3, title: "Review & Submit", icon: ShieldCheck, desc: "Final check and official submission" },
    ] : [
        { id: 0, title: "Personal Details", icon: User, desc: "Your basic identity and contact information" },
        { id: 1, title: "Profile Notes", icon: Briefcase, desc: "Additional context about your household and move-in" },
        { id: 2, title: "Review & Submit", icon: ShieldCheck, desc: "Final check and official submission" },
    ];

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

    const handleUploadRequirementFiles = async (requirementKey: string, files: FileList | null | File[]) => {
        if (!files || files.length === 0) return;

        const validFiles = handleMediaSelection(files, {
            preset: "image",
            multiple: true,
            maxFiles: 5,
            maxSizeBytes: 10 * 1024 * 1024,
            notify: (message, description) => {
                setSubmitError(`${message}: ${description}`);
                toast.error(message, { description });
            },
        });

        if (!validFiles || validFiles.length === 0) {
            return;
        }

        setSubmitError(null);
        setUploadingRequirementKey(requirementKey);

        try {
            const form = new FormData();
            form.append("requirementKey", requirementKey);
            validFiles.forEach((file) => form.append("files", file));

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
                const next = [...prev, ...(payload.documents || [])];
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

    const handleNext = () => {
        if (step <= 1) {
            if (validateCurrentStep(step)) {
                setStep((current) => current + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } else {
            setStep((current) => current + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep((current) => current - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
                        monthly_income: Number(String(formData.employment_info.monthly_income).replace(/,/g, "")) || 0,
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
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center">
                            <Logo className="h-8 w-28" />
                        </Link>
                        <ThemeToggle className="size-9 rounded-xl border-border bg-background shadow-sm" />
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-bold tracking-wide text-muted-foreground">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        Loading invitation...
                    </div>
                </div>
            </div>
        );
    }

    if (loadError || !invite) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center">
                            <Logo className="h-8 w-28" />
                        </Link>
                        <ThemeToggle className="size-9 rounded-xl border-border bg-background shadow-sm" />
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 blur-[150px] rounded-full" />
                    </div>
                    <div className="relative z-10 max-w-lg w-full rounded-[2.5rem] border border-border bg-card/90 backdrop-blur-3xl p-10 text-center shadow-2xl">
                        <div className="mx-auto size-20 bg-red-500/10 rounded-2xl flex items-center justify-center shadow-inner mb-6 border border-red-500/20">
                            <ShieldAlert className="size-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-3">
                            Invite <span className="text-red-500 italic">unavailable</span>
                        </h1>
                        <p className="text-sm leading-relaxed text-muted-foreground mb-8">
                            {loadError || "This invite is no longer available."}
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-muted hover:bg-muted/80 border border-border px-8 py-3.5 text-sm font-black text-foreground transition-all active:scale-95"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center">
                            <Logo className="h-8 w-28" />
                        </Link>
                        <ThemeToggle className="size-9 rounded-xl border-border bg-background shadow-sm" />
                    </div>
                </header>
                <div className="flex-1 relative flex flex-col items-center justify-center p-6 overflow-hidden">
                    {/* Background Blobs for Success */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                        className="relative z-10 text-center max-w-2xl px-8 py-14 rounded-[3rem] border border-border bg-card/90 backdrop-blur-3xl shadow-2xl"
                    >
                        <motion.div
                            initial={{ rotate: -10, scale: 0.5 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="mx-auto size-20 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center shadow-lg mb-8 text-primary"
                        >
                            <CheckCircle2 className="size-10" />
                        </motion.div>

                        <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight text-foreground leading-tight">
                            Application <br /><span className="text-primary italic">Successfully</span> Sent
                        </h1>

                        <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-lg mx-auto">
                            Your application for <span className="text-foreground font-black">{invite.propertyName}</span> has been received and is now being reviewed. You&apos;ll be contacted as soon as your application is processed.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-primary/20"
                            >
                                <User className="size-4" />
                                Return Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] -right-[5%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full"
                />
            </div>

            {/* Header / Brand Nav */}
            <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <Logo className="h-8 w-28" />
                        </Link>
                        {invite.propertyName && (
                            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/60">
                                <span className="text-xs font-bold text-muted-foreground truncate max-w-[200px]">
                                    {invite.propertyName}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle (Light / Dark) */}
                        <ThemeToggle className="size-9 rounded-xl border-border bg-background shadow-sm" />

                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-muted"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Exit</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left Panel: Context & Navigation */}
                    <div className="w-full lg:w-[360px] space-y-6 flex-shrink-0">
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-none">
                                Application <br />
                                <span className="text-primary italic">Process</span>
                            </h1>
                            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                                Complete these steps to secure your future home at {invite.propertyName}.
                            </p>
                        </div>

                        {/* Progress Stepper */}
                        <div className="space-y-2.5">
                            {stepDefinitions.map((stepDef) => {
                                const isActive = step === stepDef.id;
                                const isCompleted = step > stepDef.id;
                                return (
                                    <div
                                        key={stepDef.id}
                                        className={cn(
                                            "relative flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-300 cursor-default overflow-hidden",
                                            isActive
                                                ? "bg-primary/10 border-primary/30 shadow-md dark:bg-white/10 dark:border-white/20"
                                                : isCompleted
                                                    ? "bg-muted/40 border-border/60 opacity-90"
                                                    : "bg-muted/10 border-border/30 opacity-50 hover:opacity-75"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "size-9 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
                                                isActive
                                                    ? "bg-primary text-primary-foreground scale-105 shadow-sm"
                                                    : isCompleted
                                                        ? "bg-primary/20 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {isCompleted ? <CheckCircle2 className="size-4" /> : <stepDef.icon className="size-4" />}
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    "text-sm font-black transition-colors leading-tight",
                                                    isActive ? "text-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                {stepDef.title}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px]">
                                                {isActive ? "Currently editing" : stepDef.desc}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <div
                                                className="absolute right-3.5 size-2 rounded-full bg-primary"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="rounded-3xl bg-card border border-border p-5 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                Invitation Details
                            </h3>
                            <div className="space-y-1">
                                <p className="text-sm font-black text-foreground tracking-tight">{invite.propertyName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {isOnlineInvite ? "Online Document Processing" : "Face-to-face Document Checking"}
                                </p>
                            </div>
                            {invite.expiresAt && (
                                <div className="pt-3 border-t border-border/60">
                                    <p className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400">Expires At</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        <ClientOnlyDate date={invite.expiresAt} format={{ dateStyle: 'full', timeStyle: 'short' }} />
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Main Flow Panel */}
                    <div className="flex-1">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-[2.5rem] p-6 lg:p-10 shadow-lg relative overflow-hidden flex flex-col min-h-[500px]"
                        >
                            {/* Decorative Background Icons */}
                            <div className="absolute -top-10 -right-10 opacity-[0.03] select-none pointer-events-none text-foreground">
                                {(() => {
                                    const Icon = stepDefinitions[step].icon;
                                    return <Icon className="size-80 rotate-12" />;
                                })()}
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                <header className="mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                                            {(() => {
                                                const Icon = stepDefinitions[step].icon;
                                                return <Icon className="size-4" />;
                                            })()}
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                                            Step {step + 1} of {totalSteps}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
                                        {stepDefinitions[step].title}
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                                        {stepDefinitions[step].desc}. Accuracy accelerates the landlord approval window.
                                    </p>
                                </header>
                                
                                {submitError && (
                                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-500">
                                        {submitError}
                                    </div>
                                )}

                                {/* Form Content */}
                                <div className="space-y-6 flex-1">
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
                                        <div className="space-y-4 max-w-2xl">
                                            <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                                                Upload at least one clear photo for each required document. Maximum file size 5MB each.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {requiredRequirementKeys.map((key) => {
                                                    const docs = uploadedDocuments.filter((doc) => doc.requirementKey === key);
                                                    const checked = Boolean(formData.requirements_checklist[key]);
                                                    return (
                                                        <div key={key} className="rounded-2xl border border-border bg-muted/30 p-5 relative group hover:border-primary/40 transition-colors">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <p className="text-xs font-black uppercase tracking-[0.1em] text-foreground">
                                                                        {REQUIREMENT_LABELS[key] ?? key}
                                                                    </p>
                                                                    {key !== "application_form" && (
                                                                       <p className="text-[10px] text-muted-foreground mt-1">Photo Upload</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col gap-2 relative z-10">
                                                                    {key !== "application_form" && (
                                                                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors text-foreground">
                                                                            <Upload className="size-3" />
                                                                            {uploadingRequirementKey === key ? "WAIT..." : "UPLOAD"}
                                                                            <input
                                                                                type="file"
                                                                                accept={MEDIA_ACCEPT_STRINGS.image}
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
                                                                            "rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                                                                            checked
                                                                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                                                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        {checked ? "READY" : "SET READY"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 mt-4 pt-4 border-t border-border/60">
                                                                {key === "application_form" ? (
                                                                    <p className="text-[10px] text-primary italic font-medium">Included digitally in this app</p>
                                                                ) : docs.length === 0 ? (
                                                                    <p className="text-[10px] text-muted-foreground italic">No files attached yet</p>
                                                                ) : (
                                                                    docs.map((doc) => (
                                                                        <div key={doc.url} className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-xs border border-border">
                                                                            <a className="truncate text-primary hover:underline max-w-[120px]" href={doc.url} target="_blank" rel="noreferrer">
                                                                                {doc.fileName}
                                                                            </a>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeUploadedDocument(doc.url)}
                                                                                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors bg-muted rounded-lg"
                                                                            >
                                                                                <X className="size-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {step === finalStepIndex && (
                                        <div className="space-y-6 max-w-2xl">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <SummaryCard label="Property" value={invite.propertyName} icon={Building} />
                                                <SummaryCard label="Unit" value={currentUnit?.name ?? "Not selected"} icon={Home} />
                                                <SummaryCard label="Applicant" value={formData.applicant_name || "Not provided"} icon={User} />
                                                <SummaryCard label="Email" value={formData.applicant_email || "Not provided"} icon={Mail} />
                                                <SummaryCard label="Move-in date" value={formData.move_in_date || "Not provided"} icon={Calendar} />
                                                <SummaryCard label="Income" value={formData.employment_info.monthly_income ? `₱${Number(String(formData.employment_info.monthly_income).replace(/,/g, "")).toLocaleString()}` : "Not provided"} icon={Briefcase} />
                                            </div>
                                            
                                            <div className="rounded-3xl border border-border bg-muted/30 p-6 lg:p-8">
                                                <div className="flex items-center gap-3 opacity-70 mb-3">
                                                    <FileText className="size-4 text-muted-foreground" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Detailed Notes</p>
                                                </div>
                                                <p className="text-sm leading-relaxed text-foreground">{formData.message || "No additional notes provided."}</p>
                                            </div>

                                            <div className="rounded-3xl bg-emerald-500/[0.05] border border-emerald-500/20 p-6 flex flex-col md:flex-row items-center gap-6">
                                                <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-sm">
                                                    <CheckCircle2 className="size-7 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-foreground font-black text-base mb-1">Final Review</h4>
                                                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                                        By proceeding, you grant permission for basic background validation based on the requirements provided.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Navigation */}
                                <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95",
                                            step === 0 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        onClick={step === finalStepIndex ? handleSubmit : handleNext}
                                        disabled={submitting}
                                        className="h-13 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm transition-all shadow-md flex items-center gap-2.5 disabled:opacity-50 active:scale-[0.98] relative overflow-hidden group"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                {step === finalStepIndex ? "Submit Application" : "Continue"}
                                                {step === finalStepIndex ? <CheckCircle2 className="size-4" /> : <ChevronRight className="size-4" />}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-40">
                            <Seal icon={ShieldCheck} label="Bank-Level Encryption" />
                            <Seal icon={Lock} label="DPA Compliance" />
                            <Seal icon={Zap} label="Instant Verification" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="rounded-2xl border border-border bg-muted/30 p-5 hover:bg-muted/50 transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Icon className="size-16 text-foreground" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="size-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                </div>
                <p className="text-base font-black tracking-tight text-foreground line-clamp-1">{value}</p>
            </div>
        </div>
    );
}

function Seal({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-default">
            <Icon className="size-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
    );
}
