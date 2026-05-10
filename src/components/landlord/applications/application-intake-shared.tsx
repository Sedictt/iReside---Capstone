"use client";

import { startTransition, type ChangeEvent, type Dispatch, type ElementType, type InputHTMLAttributes, type ReactNode, type SetStateAction } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    validateFormStep,
    type FormErrorKey,
    type WalkInFormData,
    type WalkInUnit,
} from "@/lib/application-intake";
import {
    Briefcase,
    Building,
    Building2,
    Contact,
    FileCheck,
    Mail,
    MapPin,
    Phone,
    User,
    Wallet,
    ArrowRight,
} from "lucide-react";
export {
    DEFAULT_CHECKLIST,
    DEFAULT_EMPLOYMENT,
    validateFormStep,
    type EmploymentInfo,
    type FormErrorKey,
    type RequirementsChecklist,
    type WalkInFormData,
    type WalkInUnit,
} from "@/lib/application-intake";

const DATE_MIN = new Date().toISOString().split("T")[0];
const DATE_MAX = "2099-12-31";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon: ElementType;
    label?: string;
    error?: string;
    id: string;
    nextFieldId?: string;
    blockNumbers?: boolean;
}

function GlassInput({ icon: Icon, label, error, id, nextFieldId, onKeyDown, blockNumbers, ...props }: GlassInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && nextFieldId) {
            e.preventDefault();
            document.getElementById(nextFieldId)?.focus();
        }
        if (blockNumbers && e.key.length === 1 && /\d/.test(e.key)) {
            e.preventDefault();
            return;
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
}

function CardFrame({ children, className, glow = true }: { children: ReactNode; className?: string; glow?: boolean }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-[2.5rem] border border-border bg-card/92 backdrop-blur-2xl transition-all shadow-sm",
                glow && "hover:border-primary/20 hover:shadow-[0_18px_38px_-28px_rgba(15,23,42,0.35)]",
                className
            )}
        >
            <div className="relative z-10 p-8 sm:p-10 h-full flex flex-col">{children}</div>
        </div>
    );
}

type SharedStepProps = {
    formData: WalkInFormData;
    formErrors: Partial<Record<FormErrorKey, string>>;
    selectedUnit: string;
    units: WalkInUnit[];
    currentUnit?: WalkInUnit;
    lockUnit?: boolean;
    showUnitSelector?: boolean;
    messageLabel?: string;
    messagePlaceholder?: string;
    onSelectedUnitChange: (value: string) => void;
    onTouchedUnit?: () => void;
    onFieldChange: (
        field: keyof WalkInFormData,
        value: WalkInFormData[keyof WalkInFormData],
        validateKeys?: FormErrorKey[]
    ) => void;
    onValidateUnit?: (nextUnit: string) => string | undefined;
};

export function ApplicationIdentityStep({
    formData,
    formErrors,
    selectedUnit,
    units,
    currentUnit,
    lockUnit,
    showUnitSelector = true,
    onSelectedUnitChange,
    onTouchedUnit,
    onFieldChange,
    onValidateUnit,
}: SharedStepProps) {
    return (
        <div className="space-y-10 max-w-3xl">
            <div className="space-y-8">
                {showUnitSelector && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 text-primary">
                            <MapPin size={18} strokeWidth={2.5} />
                            <label htmlFor="unit-select" className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                                Select Unit
                            </label>
                        </div>

                        <CardFrame className="!p-0" glow={false}>
                            <div className="relative group">
                                <Building className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-300 group-focus-within:text-primary" size={20} />
                                <select
                                    id="unit-select"
                                    value={selectedUnit}
                                    onChange={(e) => {
                                        const nextUnit = e.target.value;
                                        onSelectedUnitChange(nextUnit);
                                        onTouchedUnit?.();
                                        onValidateUnit?.(nextUnit);
                                    }}
                                    disabled={lockUnit}
                                    className={cn(
                                        "w-full h-20 appearance-none cursor-pointer bg-transparent pl-16 pr-12 text-lg font-semibold tracking-tighter text-foreground outline-none transition-all disabled:opacity-50",
                                        "focus-visible:ring-4 focus-visible:ring-primary/10",
                                        formErrors.unit && "text-red-400"
                                    )}
                                >
                                    <option value="" className="bg-card text-sm text-foreground">
                                        Select Target Unit...
                                    </option>
                                    {units.map((u) => (
                                        <option key={u.id} value={u.id} className="bg-card py-4 text-sm text-foreground">
                                            {u.name} - {u.property_name}
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
                                <span className="text-lg font-semibold italic text-foreground">P{currentUnit.rent_amount.toLocaleString()}</span>
                            </motion.div>
                        )}
                    </section>
                )}

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
                        maxLength={100}
                        pattern="[a-zA-Z\s.,'-]+"
                        blockNumbers
                        nextFieldId="applicant-email"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange("applicant_name", e.target.value, ["applicant_name"])}
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
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange("applicant_email", e.target.value, ["applicant_email"])}
                        />
                        <GlassInput
                            id="applicant-phone"
                            icon={Phone}
                            label="Phone Number"
                            type="tel"
                            inputMode="tel"
                            maxLength={11}
                            placeholder="09171234567"
                            value={formData.applicant_phone}
                            error={formErrors.applicant_phone}
                            nextFieldId="move-in-date"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange("applicant_phone", e.target.value.replace(/\s/g, ""), ["applicant_phone"])}
                        />
                    </div>

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
                                min={DATE_MIN}
                                max={DATE_MAX}
                                onChange={(e) => onFieldChange("move_in_date", e.target.value, ["move_in_date"])}
                                className="h-15 w-full rounded-2xl bg-transparent py-4 pl-12 pr-4 text-sm font-medium tracking-tight text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-0 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                        {formErrors.move_in_date && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.move_in_date}</p>}
                    </div>
                </section>

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
                            maxLength={100}
                            pattern="[a-zA-Z\s.,'-]+"
                            blockNumbers
                            nextFieldId="emergency-contact-phone"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange("emergency_contact_name", e.target.value, ["emergency_contact_name"])}
                        />
                        <GlassInput
                            id="emergency-contact-phone"
                            icon={Phone}
                            label="Contact Number"
                            type="tel"
                            inputMode="tel"
                            maxLength={11}
                            placeholder="09171234567"
                            value={formData.emergency_contact_phone}
                            error={formErrors.emergency_contact_phone}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onFieldChange("emergency_contact_phone", e.target.value.replace(/\s/g, ""), ["emergency_contact_phone"])}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

export function ApplicationProfileStep({
    formData,
    formErrors,
    onFieldChange,
    messageLabel = "Additional Notes",
    messagePlaceholder = "Add internal notes about the applicant's character, urgent requests, or specific unit adjustments here...",
}: SharedStepProps) {
    return (
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
                        maxLength={100}
                        nextFieldId="employer"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            onFieldChange("employment_info", { ...formData.employment_info, occupation: e.target.value }, ["occupation"])
                        }
                    />
                    <GlassInput
                        id="employer"
                        icon={Building2}
                        label="Company Name"
                        placeholder="Stark Industries"
                        value={formData.employment_info.employer}
                        error={formErrors.employer}
                        maxLength={100}
                        nextFieldId="income"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            onFieldChange("employment_info", { ...formData.employment_info, employer: e.target.value }, ["employer"])
                        }
                    />
                </div>

                <div className="relative isolate group">
                    <div className="absolute inset-x-0 -inset-y-4 bg-primary/5 rounded-[2.5rem] -z-10 border border-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <GlassInput
                        id="income"
                        icon={() => <span className="font-semibold text-primary/80">P</span>}
                        label="Monthly Net Income"
                        type="text"
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="50000"
                        className="font-mono"
                        value={formData.employment_info.monthly_income ?? ""}
                        error={formErrors.monthly_income}
                        nextFieldId="additional-notes"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                            onFieldChange("employment_info", { ...formData.employment_info, monthly_income: raw }, ["monthly_income"]);
                        }}
                        onBlur={(e) => {
                            const raw = String(formData.employment_info.monthly_income ?? "").replace(/[^0-9.]/g, "");
                            if (!raw) return;
                            const num = Number(raw);
                            if (Number.isFinite(num)) {
                                const formatted = num.toLocaleString("en-US");
                                e.target.value = formatted;
                                onFieldChange("employment_info", { ...formData.employment_info, monthly_income: formatted }, ["monthly_income"]);
                            }
                        }}
                    />
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-4 text-muted-foreground">
                    <FileCheck size={18} strokeWidth={2.5} />
                    <label htmlFor="additional-notes" className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                        {messageLabel}
                    </label>
                </div>
                <div className="relative isolate">
                    <div className="absolute inset-0 -z-10 rounded-[2rem] border border-border bg-card/90 transition-all duration-300 hover:bg-card" />
                    <textarea
                        id="additional-notes"
                        placeholder={messagePlaceholder}
                        maxLength={1000}
                        className={cn(
                            "min-h-[180px] w-full resize-none bg-transparent p-7 text-sm font-medium leading-relaxed text-foreground outline-none transition-all placeholder:text-muted-foreground",
                            "focus-visible:ring-4 focus-visible:ring-primary/20"
                        )}
                        value={formData.message}
                        onChange={(e) => onFieldChange("message", e.target.value, ["message"])}
                    />
                </div>
                {formErrors.message && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">{formErrors.message}</p>}
            </section>
        </div>
    );
}

export function applyLiveFieldValidation(params: {
    nextFormData: WalkInFormData;
    step: number;
    selectedUnit: string;
    setTouchedFields: Dispatch<SetStateAction<Partial<Record<FormErrorKey, boolean>>>>;
    setFormErrors: Dispatch<SetStateAction<Partial<Record<FormErrorKey, string>>>>;
    validateKeys: FormErrorKey[];
    requireUnit?: boolean;
}) {
    const { nextFormData, step, selectedUnit, setTouchedFields, setFormErrors, validateKeys, requireUnit } = params;
    const liveErrors = validateFormStep(step, selectedUnit, nextFormData, { requireUnit });

    startTransition(() => {
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
    });
}
