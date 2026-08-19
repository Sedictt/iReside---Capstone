"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Shield,
    Users,
    Clock,
    Moon,
    VenusAndMars,
    Zap,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Save,
    Sparkles,
    Check,
    Lock,
    Sliders,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useAppToast } from "@/hooks/useAppToast";

type EnvironmentMode = "apartment" | "dormitory" | "boarding_house";

interface PropertyPolicy {
    property_id: string;
    environment_mode: EnvironmentMode;
    max_occupants_per_unit: number | null;
    curfew_enabled: boolean;
    curfew_time: string | null;
    visitor_cutoff_enabled: boolean;
    visitor_cutoff_time: string | null;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    gender_restriction_mode: string;
    utility_policy_mode: string;
    utility_split_method?: string | null;
    utility_fixed_charge_amount?: number | null;
    needs_review: boolean;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}

type GenderRestrictionMode = "none" | "male_only" | "female_only" | "custom";
type UtilityPolicyMode = "included_in_rent" | "separate_metered" | "mixed";

const GENDER_OPTIONS: { value: GenderRestrictionMode; label: string; description: string }[] = [
    { value: "none", label: "No Restriction", description: "Open to all genders without restriction" },
    { value: "male_only", label: "Male Only", description: "Exclusive to male occupants only" },
    { value: "female_only", label: "Female Only", description: "Exclusive to female occupants only" },
    { value: "custom", label: "Custom Rules", description: "Subject to specialized lease clauses" },
];

const UTILITY_OPTIONS: { value: UtilityPolicyMode; label: string; description: string }[] = [
    { value: "included_in_rent", label: "Included in Rent", description: "Utilities are bundled into the flat monthly rental rate" },
    { value: "separate_metered", label: "Separate & Metered", description: "Occupants pay sub-metered electricity & water bills directly" },
    { value: "mixed", label: "Mixed / Hybrid Policy", description: "Base utilities included with sub-metered overages or fixed charges" },
];

const DORM_DEFAULTS = {
    curfew_enabled: true,
    curfew_time: "22:00",
    visitor_cutoff_enabled: true,
    visitor_cutoff_time: "21:00",
    quiet_hours_start: "21:00",
    quiet_hours_end: "07:00",
    gender_restriction_mode: "none",
    utility_policy_mode: "separate_metered",
    max_occupants_per_unit: 4,
};

const BOARDING_DEFAULTS = {
    curfew_enabled: false,
    curfew_time: null,
    visitor_cutoff_enabled: false,
    visitor_cutoff_time: null,
    quiet_hours_start: "23:00",
    quiet_hours_end: "07:00",
    gender_restriction_mode: "none",
    utility_policy_mode: "mixed",
    max_occupants_per_unit: 2,
};

const APARTMENT_DEFAULTS = {
    curfew_enabled: false,
    curfew_time: null,
    visitor_cutoff_enabled: false,
    visitor_cutoff_time: null,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    gender_restriction_mode: "none",
    utility_policy_mode: "included_in_rent",
    max_occupants_per_unit: 5,
};

function getDefaultsForMode(mode: EnvironmentMode) {
    switch (mode) {
        case "dormitory":
            return DORM_DEFAULTS;
        case "boarding_house":
            return BOARDING_DEFAULTS;
        default:
            return APARTMENT_DEFAULTS;
    }
}

const MODE_CARDS: {
    id: EnvironmentMode;
    label: string;
    tagline: string;
    description: string;
    icon: typeof Shield;
    badgeColor: string;
}[] = [
    {
        id: "apartment",
        label: "Apartment",
        tagline: "Standard Residential",
        description: "Autonomous private residences with flexible occupant limits and independent leases.",
        icon: Building2,
        badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    },
    {
        id: "dormitory",
        label: "Dormitory",
        tagline: "Structured Community",
        description: "Student & institutional accommodation with curfew hours, visitor rules, and per-bed occupancy.",
        icon: Shield,
        badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    },
    {
        id: "boarding_house",
        label: "Boarding House",
        tagline: "Shared Co-Living",
        description: "Private single rooms with shared common amenities, hybrid billing, and quiet hour guidelines.",
        icon: Users,
        badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    },
];

export default function PropertyEnvironmentPage() {
    const toast = useAppToast();
    const params = useParams();
    const { push } = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const propertyId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [propertyName, setPropertyName] = useState("");
    const [policy, setPolicy] = useState<PropertyPolicy | null>(null);
    const [mode, setMode] = useState<EnvironmentMode>("apartment");

    const [formData, setFormData] = useState({
        max_occupants_per_unit: 5,
        curfew_enabled: false,
        curfew_time: "",
        visitor_cutoff_enabled: false,
        visitor_cutoff_time: "",
        quiet_hours_start: "",
        quiet_hours_end: "",
        gender_restriction_mode: "none" as GenderRestrictionMode,
        utility_policy_mode: "included_in_rent" as UtilityPolicyMode,
        utility_fixed_charge_amount: null as number | null,
    });

    useEffect(() => {
        if (!propertyId) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        async function fetchPolicy() {
            try {
                const { data: propData, error: propError } = await supabase
                    .from("properties")
                    .select("name, type")
                    .eq("id", propertyId)
                    .maybeSingle();

                if (propError) {
                    console.warn("Error fetching property:", propError);
                }

                if (isMounted && propData) {
                    setPropertyName(propData.name || "Property");
                    if (propData.type && (propData.type === "apartment" || propData.type === "dormitory" || propData.type === "boarding_house")) {
                        setMode(propData.type as EnvironmentMode);
                    }
                }

                const { data: policyData, error: policyError } = await (supabase as any)
                    .from("property_environment_policies")
                    .select("*")
                    .eq("property_id", propertyId)
                    .maybeSingle();

                if (policyError && policyError.code !== "PGRST116") {
                    console.warn("Error fetching policy:", policyError);
                }

                if (isMounted) {
                    if (policyData) {
                        const targetMode = (policyData.environment_mode as EnvironmentMode) || (propData?.type as EnvironmentMode) || "apartment";
                        const defaults = getDefaultsForMode(targetMode);

                        setPolicy(policyData as PropertyPolicy);
                        setMode(targetMode);
                        setFormData({
                            max_occupants_per_unit: policyData.max_occupants_per_unit ?? defaults.max_occupants_per_unit,
                            curfew_enabled: policyData.curfew_enabled ?? defaults.curfew_enabled,
                            curfew_time: policyData.curfew_time ?? defaults.curfew_time ?? "",
                            visitor_cutoff_enabled: policyData.visitor_cutoff_enabled ?? defaults.visitor_cutoff_enabled,
                            visitor_cutoff_time: policyData.visitor_cutoff_time ?? defaults.visitor_cutoff_time ?? "",
                            quiet_hours_start: policyData.quiet_hours_start ?? defaults.quiet_hours_start ?? "",
                            quiet_hours_end: policyData.quiet_hours_end ?? defaults.quiet_hours_end ?? "",
                            gender_restriction_mode: (policyData.gender_restriction_mode as GenderRestrictionMode) ?? defaults.gender_restriction_mode,
                            utility_policy_mode: (policyData.utility_policy_mode as UtilityPolicyMode) ?? defaults.utility_policy_mode,
                            utility_fixed_charge_amount: (policyData as any).utility_fixed_charge_amount ?? null,
                        });
                    } else {
                        const targetMode = (propData?.type as EnvironmentMode) || "apartment";
                        const defaults = getDefaultsForMode(targetMode);
                        setMode(targetMode);
                        setFormData({
                            max_occupants_per_unit: defaults.max_occupants_per_unit ?? 5,
                            curfew_enabled: defaults.curfew_enabled,
                            curfew_time: defaults.curfew_time ?? "",
                            visitor_cutoff_enabled: defaults.visitor_cutoff_enabled,
                            visitor_cutoff_time: defaults.visitor_cutoff_time ?? "",
                            quiet_hours_start: defaults.quiet_hours_start ?? "",
                            quiet_hours_end: defaults.quiet_hours_end ?? "",
                            gender_restriction_mode: defaults.gender_restriction_mode as GenderRestrictionMode,
                            utility_policy_mode: defaults.utility_policy_mode as UtilityPolicyMode,
                            utility_fixed_charge_amount: null,
                        });
                    }
                }
            } catch (err) {
                console.error("Error fetching policy:", err);
                if (isMounted) setError("Failed to load property environment settings");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        void fetchPolicy();

        return () => {
            isMounted = false;
        };
    }, [propertyId, supabase]);

    const handleModeChange = (newMode: EnvironmentMode) => {
        setMode(newMode);
        const defaults = getDefaultsForMode(newMode);
        setFormData(prev => ({
            ...prev,
            max_occupants_per_unit: defaults.max_occupants_per_unit,
            curfew_enabled: defaults.curfew_enabled,
            curfew_time: defaults.curfew_time ?? "",
            visitor_cutoff_enabled: defaults.visitor_cutoff_enabled,
            visitor_cutoff_time: defaults.visitor_cutoff_time ?? "",
            quiet_hours_start: defaults.quiet_hours_start ?? "",
            quiet_hours_end: defaults.quiet_hours_end ?? "",
            gender_restriction_mode: defaults.gender_restriction_mode as GenderRestrictionMode,
            utility_policy_mode: defaults.utility_policy_mode as UtilityPolicyMode,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const payload: any = {
                property_id: propertyId,
                environment_mode: mode,
                max_occupants_per_unit: formData.max_occupants_per_unit,
                curfew_enabled: formData.curfew_enabled,
                curfew_time: formData.curfew_time || null,
                visitor_cutoff_enabled: formData.visitor_cutoff_enabled,
                visitor_cutoff_time: formData.visitor_cutoff_time || null,
                quiet_hours_start: formData.quiet_hours_start || null,
                quiet_hours_end: formData.quiet_hours_end || null,
                gender_restriction_mode: formData.gender_restriction_mode,
                utility_policy_mode: formData.utility_policy_mode,
                needs_review: false,
                reviewed_at: new Date().toISOString(),
            };

            const { error: upsertError } = await (supabase as any)
                .from("property_environment_policies")
                .upsert(payload, { onConflict: "property_id" })
                .select();

            if (upsertError) throw upsertError;

            // Also update property type in properties table to keep in sync
            await supabase
                .from("properties")
                .update({ type: mode })
                .eq("id", propertyId);

            setSuccess(true);
            toast.success("Environment configuration saved successfully!");
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error saving policy:", err);
            setError("Failed to save environment settings");
            toast.error(err?.message || "Failed to save environment settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageLoader message="Loading Environment Settings" />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Navigation & Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => push(`/landlord/properties`)}
                            className="neumorphic-extruded size-11 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-95 shrink-0"
                            title="Back to Properties"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    Environment Scope
                                </h1>
                                <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-[10px] font-black text-primary uppercase tracking-widest">
                                    {mode.replace("_", " ")}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 font-medium mt-1">
                                Configure occupancy rules, curfew guidelines, and billing policies for{" "}
                                <span className="text-white font-bold">{propertyName}</span>.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                            onClick={() => push(`/landlord/properties`)}
                            disabled={saving}
                            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="neumorphic-primary flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            <span>{saving ? "Saving..." : "Save Policy"}</span>
                        </button>
                    </div>
                </div>

                {/* Property Type Selection (Neumorphic Interactive Cards) */}
                <div className="neumorphic-panel rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2.5">
                                <Building2 className="size-5 text-primary" />
                                <span>Operating Environment Mode</span>
                            </h2>
                            <p className="text-xs text-neutral-400 font-medium mt-1">
                                Selecting an environment sets intelligent baseline defaults for occupancy and curfews.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {MODE_CARDS.map((card) => {
                            const Icon = card.icon;
                            const isSelected = mode === card.id;

                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => handleModeChange(card.id)}
                                    className={cn(
                                        "group relative flex flex-col justify-between rounded-3xl p-6 text-left transition-all duration-300",
                                        isSelected
                                            ? "neumorphic-inset border-2 border-primary/50 bg-primary/[0.03] shadow-lg shadow-primary/5"
                                            : "neumorphic-panel hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div
                                                className={cn(
                                                    "neumorphic-inset-card size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                                    isSelected ? "text-primary" : "text-neutral-400"
                                                )}
                                            >
                                                <Icon className="size-6" />
                                            </div>
                                            {isSelected ? (
                                                <div className="size-6 rounded-full bg-primary text-black flex items-center justify-center shadow-md">
                                                    <Check className="size-3.5 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="size-6 rounded-full border border-white/10" />
                                            )}
                                        </div>

                                        <h3 className="text-base font-black text-white group-hover:text-primary transition-colors">
                                            {card.label}
                                        </h3>
                                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                                            {card.tagline}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed font-medium">
                                            {card.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border", card.badgeColor)}>
                                            {card.id}
                                        </span>
                                        <span className="text-[11px] font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                            {isSelected ? "Active Mode" : "Switch Mode →"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Policy Configuration Matrix (Two-Column Layout) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Occupancy & Tenant Restrictions */}
                    <div className="neumorphic-panel rounded-[2.5rem] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="neumorphic-inset-card size-10 rounded-2xl flex items-center justify-center text-primary">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-white">
                                        Occupancy & Tenant Demographics
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Capacity limits and tenant restriction guidelines.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Max Occupants */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                                            Maximum Occupants per Unit
                                        </label>
                                        <span className="text-xs font-black text-primary px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                                            {formData.max_occupants_per_unit} {formData.max_occupants_per_unit === 1 ? "Person" : "Persons"}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={formData.max_occupants_per_unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_occupants_per_unit: parseInt(e.target.value) || 1 }))}
                                        className="neumorphic-inset w-full rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                    <p className="text-[11px] text-neutral-500 font-medium">
                                        Specifies the hard occupancy capacity enforced in tenant intake forms and contracts.
                                    </p>
                                </div>

                                {/* Gender Restriction */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                                        <VenusAndMars className="size-4 text-primary" />
                                        <span>Gender Restriction Policy</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.gender_restriction_mode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gender_restriction_mode: e.target.value as GenderRestrictionMode }))}
                                            className="neumorphic-inset w-full rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40 appearance-none transition-all cursor-pointer"
                                        >
                                            {GENDER_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-[#121212] text-white">
                                                    {opt.label} — {opt.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Utility Billing Policies */}
                    <div className="neumorphic-panel rounded-[2.5rem] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="neumorphic-inset-card size-10 rounded-2xl flex items-center justify-center text-amber-400">
                                    <Zap className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-white">
                                        Utility & Metering Structure
                                    </h2>
                                    <p className="text-xs text-neutral-400 font-medium">
                                        Electricity, water, and sub-meter billing policies.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Utility Billing Mode */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                                        Billing Framework
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.utility_policy_mode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, utility_policy_mode: e.target.value as UtilityPolicyMode }))}
                                            className="neumorphic-inset w-full rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-400/40 appearance-none transition-all cursor-pointer"
                                        >
                                            {UTILITY_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value} className="bg-[#121212] text-white">
                                                    {opt.label} — {opt.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Optional Fixed Charge for Mixed Mode */}
                                {formData.utility_policy_mode === "mixed" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                                            <DollarSign className="size-4 text-amber-400" />
                                            <span>Fixed Monthly Utility Fee (₱)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={50}
                                            value={formData.utility_fixed_charge_amount ?? ""}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                utility_fixed_charge_amount: e.target.value ? parseFloat(e.target.value) : null
                                            }))}
                                            placeholder="e.g. 500.00"
                                            className="neumorphic-inset w-full rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
                                        />
                                        <p className="text-[11px] text-neutral-500 font-medium">
                                            Fixed base amount added automatically to each month&apos;s invoice.
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Building Rules, Curfew & Quiet Hours */}
                <div className="neumorphic-panel rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="neumorphic-inset-card size-10 rounded-2xl flex items-center justify-center text-primary">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white">
                                Property Operating Rules & Curfews
                            </h2>
                            <p className="text-xs text-neutral-400 font-medium">
                                Gate access regulations and quiet hours displayed to residents on their portal.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Curfew Toggle & Time */}
                        <div className="neumorphic-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-white">Curfew Schedule</h4>
                                    <p className="text-xs text-neutral-400 mt-0.5">Enforce building entrance closing time</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, curfew_enabled: !prev.curfew_enabled }))}
                                    className={cn(
                                        "relative h-7 w-12 rounded-full transition-colors",
                                        formData.curfew_enabled ? "bg-primary" : "bg-white/10"
                                    )}
                                >
                                    <motion.span
                                        layout
                                        className={cn(
                                            "absolute top-1 size-5 rounded-full bg-white shadow-md",
                                            formData.curfew_enabled ? "left-6" : "left-1"
                                        )}
                                    />
                                </button>
                            </div>

                            {formData.curfew_enabled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-3 border-t border-white/5 space-y-1.5"
                                >
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                        Curfew Gate Close Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.curfew_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, curfew_time: e.target.value }))}
                                        className="neumorphic-inset w-full rounded-2xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Visitor Cutoff Toggle & Time */}
                        <div className="neumorphic-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-white">Visitor Cutoff</h4>
                                    <p className="text-xs text-neutral-400 mt-0.5">Non-resident guest departure deadline</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, visitor_cutoff_enabled: !prev.visitor_cutoff_enabled }))}
                                    className={cn(
                                        "relative h-7 w-12 rounded-full transition-colors",
                                        formData.visitor_cutoff_enabled ? "bg-primary" : "bg-white/10"
                                    )}
                                >
                                    <motion.span
                                        layout
                                        className={cn(
                                            "absolute top-1 size-5 rounded-full bg-white shadow-md",
                                            formData.visitor_cutoff_enabled ? "left-6" : "left-1"
                                        )}
                                    />
                                </button>
                            </div>

                            {formData.visitor_cutoff_enabled && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-3 border-t border-white/5 space-y-1.5"
                                >
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                        Guest Departure Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.visitor_cutoff_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visitor_cutoff_time: e.target.value }))}
                                        className="neumorphic-inset w-full rounded-2xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Quiet Hours Range */}
                    <div className="neumorphic-inset rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                                <Moon className="size-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">Quiet Hours Schedule</h4>
                                <p className="text-xs text-neutral-400 mt-0.5">Mandatory noise restriction interval</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="time"
                                value={formData.quiet_hours_start}
                                onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                                className="neumorphic-panel rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <span className="text-xs font-black uppercase text-neutral-500">to</span>
                            <input
                                type="time"
                                value={formData.quiet_hours_end}
                                onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                                className="neumorphic-panel rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}