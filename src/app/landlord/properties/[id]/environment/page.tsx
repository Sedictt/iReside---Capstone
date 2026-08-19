"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import {
    Building2,
    Shield,
    Users,
    Clock,
    Moon,
    VenusAndMars,
    Zap,
    DollarSign,
    ArrowLeft,
    Save,
    Check,
    Minus,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { TimePicker } from "@/components/ui/TimePicker";
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

const GENDER_OPTIONS: { value: GenderRestrictionMode; label: string }[] = [
    { value: "none", label: "No Restriction (All Genders)" },
    { value: "male_only", label: "Male Only" },
    { value: "female_only", label: "Female Only" },
    { value: "custom", label: "Custom Rules / By Clause" },
];

const UTILITY_OPTIONS: { value: UtilityPolicyMode; label: string; description: string }[] = [
    { value: "included_in_rent", label: "Included in Rent (All-Inclusive)", description: "Utilities are already covered in the monthly rent" },
    { value: "separate_metered", label: "Separate Meter (Tenant Pays Usage)", description: "Tenant pays electric & water bills directly based on actual meter readings" },
    { value: "mixed", label: "Mixed (Fixed Monthly Fee + Metered)", description: "Fixed base utility fee with sub-metered overages" },
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

            await supabase
                .from("properties")
                .update({ type: mode })
                .eq("id", propertyId);

            toast.success("Environment policies updated!");
        } catch (err: any) {
            console.error("Error saving policy:", err);
            toast.error(err?.message || "Failed to save environment settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageLoader message="Loading Environment Settings" />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header Navigation & Single Save Action */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <button
                            onClick={() => push(`/landlord/properties`)}
                            className="neumorphic-extruded size-10 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-all active:scale-95 shrink-0"
                            title="Back to Properties"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-white">
                                    Environment Scope
                                </h1>
                                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider">
                                    {mode.replace("_", " ")}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400 font-medium truncate max-w-md">
                                Operating rules, tenant constraints, and billing for <span className="text-white font-bold">{propertyName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => push(`/landlord/properties`)}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="neumorphic-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50"
                        >
                            <Save className="size-3.5" />
                            <span>{saving ? "Saving…" : "Save Policy"}</span>
                        </button>
                    </div>
                </div>

                {/* Operating Environment Descriptive Cards */}
                <div className="neumorphic-panel rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                                <Building2 className="size-4 text-primary" />
                                <span>Operating Environment Mode</span>
                            </h2>
                            <p className="text-xs text-neutral-400 font-medium mt-0.5">
                                Select how this property operates to auto-calibrate occupancy rules, curfews, and metering defaults.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        {MODE_CARDS.map((card) => {
                            const Icon = card.icon;
                            const isSelected = mode === card.id;

                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => handleModeChange(card.id)}
                                    className={cn(
                                        "group relative flex flex-col justify-between rounded-2xl p-5 text-left transition-all duration-300",
                                        isSelected
                                            ? "neumorphic-inset border-2 border-primary/50 bg-primary/[0.04] shadow-md shadow-primary/10"
                                            : "neumorphic-panel hover:border-white/20 active:scale-[0.99]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div
                                                className={cn(
                                                    "neumorphic-inset-card size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                    isSelected ? "text-primary" : "text-neutral-400"
                                                )}
                                            >
                                                <Icon className="size-5" />
                                            </div>
                                            {isSelected ? (
                                                <div className="size-5 rounded-full bg-primary text-black flex items-center justify-center shadow-sm">
                                                    <Check className="size-3 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="size-5 rounded-full border border-white/10" />
                                            )}
                                        </div>

                                        <h3 className="text-sm font-black text-white group-hover:text-primary transition-colors">
                                            {card.label}
                                        </h3>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-0.5">
                                            {card.tagline}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-medium">
                                            {card.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", card.badgeColor)}>
                                            {card.id.replace("_", " ")}
                                        </span>
                                        <span className="text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors">
                                            {isSelected ? "Active Mode" : "Switch Mode →"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Compact 2-Column Bento Form Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Occupancy & Billing Policies */}
                    <div className="neumorphic-panel rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                            <div className="neumorphic-inset-card size-8 rounded-xl flex items-center justify-center text-primary">
                                <Users className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">Occupancy & Billing</h3>
                                <p className="text-[11px] text-neutral-400 font-medium">Capacity and utility metering</p>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            {/* Max Occupants Stepper */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                    Max Occupants Per Unit
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, max_occupants_per_unit: Math.max(1, prev.max_occupants_per_unit - 1) }))}
                                        className="neumorphic-extruded size-9 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 shrink-0"
                                    >
                                        <Minus className="size-3.5" />
                                    </button>
                                    <div className="neumorphic-inset flex-1 rounded-xl py-2 text-center text-sm font-black text-white">
                                        {formData.max_occupants_per_unit} {formData.max_occupants_per_unit === 1 ? "Person" : "Persons"}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, max_occupants_per_unit: Math.min(20, prev.max_occupants_per_unit + 1) }))}
                                        className="neumorphic-extruded size-9 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 shrink-0"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Gender Restriction */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                    <VenusAndMars className="size-3 text-primary" />
                                    <span>Gender Policy</span>
                                </label>
                                <select
                                    value={formData.gender_restriction_mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gender_restriction_mode: e.target.value as GenderRestrictionMode }))}
                                    className="neumorphic-inset w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                                >
                                    {GENDER_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-[#141414] text-white">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Utility Billing Mode */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                    <Zap className="size-3 text-amber-400" />
                                    <span>Electricity & Water Billing</span>
                                </label>
                                <select
                                    value={formData.utility_policy_mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, utility_policy_mode: e.target.value as UtilityPolicyMode }))}
                                    className="neumorphic-inset w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-400/40 appearance-none cursor-pointer"
                                >
                                    {UTILITY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-[#141414] text-white">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Optional Fixed Charge */}
                            {formData.utility_policy_mode === "mixed" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="space-y-1.5 pt-1"
                                >
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                                        <DollarSign className="size-3 text-amber-400" />
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
                                        placeholder="e.g. 500"
                                        className="neumorphic-inset w-full rounded-xl px-3.5 py-2 text-xs font-bold text-white placeholder:text-neutral-600 outline-none focus:ring-2 focus:ring-amber-400/40"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Building Rules, Curfews & Quiet Hours */}
                    <div className="neumorphic-panel rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                                <div className="neumorphic-inset-card size-8 rounded-xl flex items-center justify-center text-primary">
                                    <Clock className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white">Access & Curfew Rules</h3>
                                    <p className="text-[11px] text-neutral-400 font-medium">Gate access & quiet periods</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {/* Curfew Setting */}
                                <div className="neumorphic-inset rounded-2xl p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black text-white">Curfew Restriction</p>
                                        <p className="text-[10px] text-neutral-500 font-medium">Enforce gate lock time</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        {formData.curfew_enabled && (
                                            <TimePicker
                                                size="sm"
                                                value={formData.curfew_time}
                                                onChange={(val) => setFormData(prev => ({ ...prev, curfew_time: val }))}
                                                placeholder="Curfew Time"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, curfew_enabled: !prev.curfew_enabled }))}
                                            className={cn(
                                                "relative h-6 w-11 rounded-full transition-colors shrink-0",
                                                formData.curfew_enabled ? "bg-primary" : "bg-white/10"
                                            )}
                                        >
                                            <motion.span
                                                layout
                                                className={cn(
                                                    "absolute top-0.5 size-5 rounded-full bg-white shadow-sm",
                                                    formData.curfew_enabled ? "left-5" : "left-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Visitor Cutoff Setting */}
                                <div className="neumorphic-inset rounded-2xl p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black text-white">Visitor Cutoff</p>
                                        <p className="text-[10px] text-neutral-500 font-medium">Guest exit deadline</p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        {formData.visitor_cutoff_enabled && (
                                            <TimePicker
                                                size="sm"
                                                value={formData.visitor_cutoff_time}
                                                onChange={(val) => setFormData(prev => ({ ...prev, visitor_cutoff_time: val }))}
                                                placeholder="Cutoff Time"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, visitor_cutoff_enabled: !prev.visitor_cutoff_enabled }))}
                                            className={cn(
                                                "relative h-6 w-11 rounded-full transition-colors shrink-0",
                                                formData.visitor_cutoff_enabled ? "bg-primary" : "bg-white/10"
                                            )}
                                        >
                                            <motion.span
                                                layout
                                                className={cn(
                                                    "absolute top-0.5 size-5 rounded-full bg-white shadow-sm",
                                                    formData.visitor_cutoff_enabled ? "left-5" : "left-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Quiet Hours Range */}
                                <div className="neumorphic-inset rounded-2xl p-3 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <Moon className="size-3.5 text-primary" />
                                        <p className="text-xs font-black text-white">Quiet Hours Period</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <TimePicker
                                            size="sm"
                                            className="flex-1"
                                            value={formData.quiet_hours_start}
                                            onChange={(val) => setFormData(prev => ({ ...prev, quiet_hours_start: val }))}
                                            placeholder="Start Time"
                                        />
                                        <span className="text-[10px] font-black uppercase text-neutral-500 shrink-0">to</span>
                                        <TimePicker
                                            size="sm"
                                            className="flex-1"
                                            value={formData.quiet_hours_end}
                                            onChange={(val) => setFormData(prev => ({ ...prev, quiet_hours_end: val }))}
                                            placeholder="End Time"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}