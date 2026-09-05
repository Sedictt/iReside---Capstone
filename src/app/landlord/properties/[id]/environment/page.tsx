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
    ArrowLeft,
    Save,
    Check,
    Minus,
    Plus,
    HelpCircle,
    Info,
    X,
    Lightbulb,
    FileText,
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

const UTILITY_GUIDE_DETAILS: Record<UtilityPolicyMode, {
    title: string;
    tagline: string;
    howItWorks: string;
    invoicing: string;
    bestFor: string;
    pros: string[];
    accentColor: string;
}> = {
    included_in_rent: {
        title: "Included in Rent (All-Inclusive)",
        tagline: "Zero Meter Logging • Flat Monthly Rent",
        howItWorks: "The landlord pays the utility provider directly. No separate utility bills are issued to tenants—rent is flat and covers power and water.",
        invoicing: "Tenants receive 1 monthly invoice containing only their standard base rent.",
        bestFor: "High-end apartments, studio flats without dedicated sub-meters, and short-term leases.",
        pros: ["Zero monthly meter reading effort", "Predictable monthly bills for tenants", "Simpler bookkeeping"],
        accentColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    },
    separate_metered: {
        title: "Separate Meter (Tenant Pays Usage)",
        tagline: "Sub-Metered • Pay What You Consume",
        howItWorks: "Each unit has dedicated electricity and water sub-meters. You log meter readings each cycle, and iReside automatically calculates the exact consumption costs.",
        invoicing: "Tenants receive an itemized monthly invoice breakdown: Base Rent + Exact Electric (kWh) + Exact Water (m³).",
        bestFor: "Apartment complexes, dormitory rooms with individual air conditioning, and commercial units.",
        pros: ["100% fair consumption billing", "Protects landlords from excessive AC usage", "Automatic rate-per-kWh calculation"],
        accentColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    },
    mixed: {
        title: "Mixed (Fixed Monthly Fee + Metered)",
        tagline: "Hybrid Billing • Base Fee + Overages",
        howItWorks: "A fixed base amount (e.g. ₱500/month) is automatically included in every invoice for baseline utilities or common areas, plus any sub-metered charges if applicable.",
        invoicing: "Tenants receive an invoice with: Base Rent + Fixed Utility Charge (₱) + Optional Overages.",
        bestFor: "Boarding houses, student dormitories, and co-living units with shared common kitchens and bathrooms.",
        pros: ["Guaranteed baseline utility cost recovery", "Covers shared amenity electricity", "Simple budgeting for tenants"],
        accentColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    },
};

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
        badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
        id: "dormitory",
        label: "Dormitory",
        tagline: "Structured Community",
        description: "Student & institutional accommodation with curfew hours, visitor rules, and per-bed occupancy.",
        icon: Shield,
        badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
        id: "boarding_house",
        label: "Boarding House",
        tagline: "Shared Co-Living",
        description: "Private single rooms with shared common amenities, hybrid billing, and quiet hour guidelines.",
        icon: Users,
        badgeColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
];

export default function PropertyEnvironmentPage() {
    const toast = useAppToast();
    const params = useParams();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const propertyId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUtilityGuideOpen, setIsUtilityGuideOpen] = useState(false);
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
            router.refresh();
            router.push("/landlord/properties");
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

    const currentUtilityGuide = UTILITY_GUIDE_DETAILS[formData.utility_policy_mode] || UTILITY_GUIDE_DETAILS.included_in_rent;

    return (
        <div className="min-h-screen bg-background text-foreground pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header Navigation & Single Save Action */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <button
                            onClick={() => router.push(`/landlord/properties`)}
                            className="neumorphic-extruded size-10 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
                            title="Back to Properties"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-foreground">
                                    Environment Scope
                                </h1>
                                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider">
                                    {mode.replace("_", " ")}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate max-w-md">
                                Operating rules, tenant constraints, and billing for <span className="text-foreground font-bold">{propertyName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => router.push(`/landlord/properties`)}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
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
                            <h2 className="text-sm font-black tracking-tight text-foreground flex items-center gap-2">
                                <Building2 className="size-4 text-primary" />
                                <span>Operating Environment Mode</span>
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
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
                                            : "neumorphic-panel hover:border-primary/20 active:scale-[0.99]"
                                    )}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div
                                                className={cn(
                                                    "neumorphic-inset-card size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                                                    isSelected ? "text-primary" : "text-muted-foreground"
                                                )}
                                            >
                                                <Icon className="size-5" />
                                            </div>
                                            {isSelected ? (
                                                <div className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                                                    <Check className="size-3 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="size-4 rounded-full border border-border" />
                                            )}
                                        </div>

                                        <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                            {card.label}
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                            {card.tagline}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                            {card.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                                        <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border", card.badgeColor)}>
                                            {card.id.replace("_", " ")}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
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
                        <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                            <div className="neumorphic-inset-card size-8 rounded-xl flex items-center justify-center text-primary">
                                <Users className="size-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground">Occupancy & Billing</h3>
                                <p className="text-[11px] text-muted-foreground font-medium">Capacity and utility metering</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Max Occupants Stepper */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Max Occupants Per Unit
                                </label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, max_occupants_per_unit: Math.max(1, prev.max_occupants_per_unit - 1) }))}
                                        className="neumorphic-extruded size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 shrink-0"
                                    >
                                        <Minus className="size-3.5" />
                                    </button>
                                    <div className="neumorphic-inset flex-1 rounded-xl py-2 text-center text-sm font-black text-foreground">
                                        {formData.max_occupants_per_unit} {formData.max_occupants_per_unit === 1 ? "Person" : "Persons"}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, max_occupants_per_unit: Math.min(20, prev.max_occupants_per_unit + 1) }))}
                                        className="neumorphic-extruded size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 shrink-0"
                                    >
                                        <Plus className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Gender Restriction */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <VenusAndMars className="size-3 text-primary" />
                                    <span>Gender Policy</span>
                                </label>
                                <select
                                    value={formData.gender_restriction_mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gender_restriction_mode: e.target.value as GenderRestrictionMode }))}
                                    className="neumorphic-inset w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground bg-card outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                                >
                                    {GENDER_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Electricity & Water Billing Selection + Live Explainer */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Zap className="size-3 text-amber-500" />
                                        <span>Electricity & Water Billing</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsUtilityGuideOpen(true)}
                                        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                                    >
                                        <HelpCircle className="size-3" />
                                        <span>Compare Styles</span>
                                    </button>
                                </div>

                                <select
                                    value={formData.utility_policy_mode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, utility_policy_mode: e.target.value as UtilityPolicyMode }))}
                                    className="neumorphic-inset w-full rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground bg-card outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none cursor-pointer"
                                >
                                    {UTILITY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Live Contextual Breakdown Banner */}
                                <motion.div
                                    key={formData.utility_policy_mode}
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-border/60 bg-surface-2/60 dark:bg-white/[0.02] p-3 space-y-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Lightbulb className="size-3.5 text-amber-500 shrink-0" />
                                            <span className="text-[11px] font-black text-foreground">
                                                {currentUtilityGuide.tagline}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                        {currentUtilityGuide.howItWorks}
                                    </p>
                                    <div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                        <FileText className="size-3 text-muted-foreground" />
                                        <span>Invoice: {currentUtilityGuide.invoicing}</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Optional Fixed Charge */}
                            {formData.utility_policy_mode === "mixed" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="space-y-1.5 pt-1"
                                >
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <DollarSign className="size-3 text-amber-500" />
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
                                        className="neumorphic-inset w-full rounded-xl px-3.5 py-2 text-xs font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Building Rules, Curfews & Quiet Hours */}
                    <div className="neumorphic-panel rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                                <div className="neumorphic-inset-card size-8 rounded-xl flex items-center justify-center text-primary">
                                    <Clock className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-foreground">Access & Curfew Rules</h3>
                                    <p className="text-[11px] text-muted-foreground font-medium">Gate access & quiet periods</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {/* Curfew Setting */}
                                <div className="neumorphic-inset rounded-2xl p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black text-foreground">Curfew Restriction</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">Enforce gate lock time</p>
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
                                                formData.curfew_enabled ? "bg-primary" : "bg-muted/80 border border-border/60"
                                            )}
                                        >
                                            <motion.span
                                                layout
                                                className={cn(
                                                    "absolute top-0.5 size-5 rounded-full bg-white dark:bg-white shadow-sm",
                                                    formData.curfew_enabled ? "left-5" : "left-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Visitor Cutoff Setting */}
                                <div className="neumorphic-inset rounded-2xl p-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-black text-foreground">Visitor Cutoff</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">Guest exit deadline</p>
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
                                                formData.visitor_cutoff_enabled ? "bg-primary" : "bg-muted/80 border border-border/60"
                                            )}
                                        >
                                            <motion.span
                                                layout
                                                className={cn(
                                                    "absolute top-0.5 size-5 rounded-full bg-white dark:bg-white shadow-sm",
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
                                        <p className="text-xs font-black text-foreground">Quiet Hours Period</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <TimePicker
                                            size="sm"
                                            className="flex-1"
                                            value={formData.quiet_hours_start}
                                            onChange={(val) => setFormData(prev => ({ ...prev, quiet_hours_start: val }))}
                                            placeholder="Start Time"
                                        />
                                        <span className="text-[10px] font-black uppercase text-muted-foreground shrink-0">to</span>
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

            {/* In-Page Utility Billing Styles Comparison Guide Modal */}
            <AnimatePresence>
                {isUtilityGuideOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsUtilityGuideOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="neumorphic-panel w-full max-w-3xl rounded-[2.5rem] p-6 sm:p-8 space-y-6 border border-border/80 max-h-[90vh] overflow-y-auto text-foreground"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                        <Zap className="size-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground tracking-tight">
                                            Utility Billing Styles Guide
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Understand how each electricity & water billing policy functions in iReside.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsUtilityGuideOpen(false)}
                                    className="neumorphic-extruded size-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(Object.entries(UTILITY_GUIDE_DETAILS) as [UtilityPolicyMode, typeof UTILITY_GUIDE_DETAILS[UtilityPolicyMode]][]).map(([key, item]) => {
                                    const isSelected = formData.utility_policy_mode === key;

                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all",
                                                isSelected
                                                    ? "neumorphic-inset border-2 border-amber-500/50 bg-amber-500/[0.04]"
                                                    : "neumorphic-panel border border-border/60"
                                            )}
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md border", item.accentColor)}>
                                                        {key.replace("_", " ")}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-black text-amber-500">Selected</span>
                                                    )}
                                                </div>

                                                <h4 className="text-sm font-black text-foreground">{item.title}</h4>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                                    {item.howItWorks}
                                                </p>

                                                <div className="space-y-1.5 pt-2 border-t border-border/40">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Key Benefits:</p>
                                                    <ul className="space-y-1">
                                                        {item.pros.map((pro, i) => (
                                                            <li key={i} className="text-[11px] text-foreground/90 flex items-center gap-1.5">
                                                                <Check className="size-3 text-primary shrink-0" />
                                                                <span>{pro}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, utility_policy_mode: key }));
                                                    setIsUtilityGuideOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full py-2 rounded-xl text-xs font-bold transition-all text-center",
                                                    isSelected
                                                        ? "bg-amber-500 text-white font-black shadow-md shadow-amber-500/20"
                                                        : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {isSelected ? "Current Policy" : "Choose This Style"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsUtilityGuideOpen(false)}
                                    className="px-6 py-2.5 rounded-xl neumorphic-extruded text-xs font-bold text-foreground hover:bg-surface-2 transition-all"
                                >
                                    Close Guide
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}