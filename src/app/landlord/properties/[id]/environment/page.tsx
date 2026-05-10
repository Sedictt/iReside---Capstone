"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Building2,
    Shield,
    Users,
    Clock,
    Eye,
    Moon,
    VenusAndMars,
    Zap,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Save,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyEnvironmentBanner } from "@/components/landlord/PropertyEnvironmentBanner";
import { createClient } from "@/lib/supabase/client";

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
    utility_split_method: string | null;
    utility_fixed_charge_amount: number | null;
    needs_review: boolean;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}

type GenderRestrictionMode = "none" | "male_only" | "female_only" | "custom";
type UtilityPolicyMode = "included_in_rent" | "separate_metered" | "mixed";

const GENDER_OPTIONS: { value: GenderRestrictionMode; label: string; description: string }[] = [
    { value: "none", label: "No Restriction", description: "Open to all genders" },
    { value: "male_only", label: "Male Only", description: "Only male tenants allowed" },
    { value: "female_only", label: "Female Only", description: "Only female tenants allowed" },
    { value: "custom", label: "Custom", description: "Custom policy defined in notes" },
];

const UTILITY_OPTIONS: { value: UtilityPolicyMode; label: string; description: string }[] = [
    { value: "included_in_rent", label: "Included in Rent", description: "Utilities are bundled into monthly rent" },
    { value: "separate_metered", label: "Separate & Metered", description: "Tenants pay utilities directly based on usage" },
    { value: "mixed", label: "Mixed Policy", description: "Some utilities included, some metered separately" },
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

const MODE_INFO: Record<EnvironmentMode, { label: string; description: string; icon: typeof Shield }> = {
    apartment: { label: "Apartment", description: "Standard residential property with flexible occupancy", icon: Building2 },
    dormitory: { label: "Dormitory", description: "Structured living with strict rules - student/ institutional style", icon: Shield },
    boarding_house: { label: "Boarding House", description: "Private rooms with shared common areas - independent living", icon: Users },
};

export default function PropertyEnvironmentPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const propertyId = params.id as string;

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
        async function fetchPolicy() {
            try {
                const { data: propData, error: propError } = await supabase
                    .from("properties")
                    .select("name")
                    .eq("id", propertyId)
                    .single();

                if (propError) throw propError;
                setPropertyName(propData.name);

                const { data: policyData, error: policyError } = await supabase
                    .from("property_environment_policies")
                    .select("*")
                    .eq("property_id", propertyId)
                    .single();

                if (policyError && policyError.code !== "PGRST116") {
                    throw policyError;
                }

                if (policyData) {
                    setPolicy(policyData as PropertyPolicy);
                    setFormData({
                        max_occupants_per_unit: policyData.max_occupants_per_unit ?? getDefaultsForMode(mode).max_occupants_per_unit,
                        curfew_enabled: policyData.curfew_enabled ?? getDefaultsForMode(mode).curfew_enabled,
                        curfew_time: policyData.curfew_time ?? getDefaultsForMode(mode).curfew_time ?? "",
                        visitor_cutoff_enabled: policyData.visitor_cutoff_enabled ?? getDefaultsForMode(mode).visitor_cutoff_enabled,
                        visitor_cutoff_time: policyData.visitor_cutoff_time ?? getDefaultsForMode(mode).visitor_cutoff_time ?? "",
                        quiet_hours_start: policyData.quiet_hours_start ?? getDefaultsForMode(mode).quiet_hours_start ?? "",
                        quiet_hours_end: policyData.quiet_hours_end ?? getDefaultsForMode(mode).quiet_hours_end ?? "",
                        gender_restriction_mode: (policyData.gender_restriction_mode as GenderRestrictionMode) ?? "none",
                        utility_policy_mode: (policyData.utility_policy_mode as UtilityPolicyMode) ?? "included_in_rent",
                        utility_fixed_charge_amount: policyData.utility_fixed_charge_amount ?? null,
                    });
                    setMode((policyData.environment_mode as EnvironmentMode) || mode);
                } else {
                    const defaults = getDefaultsForMode(mode);
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
            } catch (err) {
                console.error("Error fetching policy:", err);
                setError("Failed to load property environment settings");
            } finally {
                setLoading(false);
            }
        }

        if (propertyId) {
            fetchPolicy();
        }
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
            const payload = {
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
                utility_fixed_charge_amount: formData.utility_fixed_charge_amount,
                needs_review: false,
                reviewed_at: new Date().toISOString(),
            };

            const { error: upsertError } = await supabase
                .from("property_environment_policies")
                .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "property_id" })
                .select();

            if (upsertError) throw upsertError;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving policy:", err);
            setError("Failed to save environment settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full flex-col gap-8 bg-background p-6 md:p-8">
                <div className="rounded-2xl border border-border bg-muted/40 p-4 animate-pulse">
                    Loading environment settings...
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col gap-8 bg-background p-6 text-foreground md:p-8">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push(`/landlord/properties`)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Properties
                </button>
            </div>

            <PropertyEnvironmentBanner
                environmentMode={mode}
                needsReview={policy?.needs_review}
                propertyId={propertyId}
                className="w-full"
            />

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Environment Configuration</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Configure the operating environment for {propertyName}. This affects occupancy rules, policies, and billing defaults.
                </p>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Property Type
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                    {(["apartment", "dormitory", "boarding_house"] as EnvironmentMode[]).map((m) => {
                        const info = MODE_INFO[m];
                        const Icon = info.icon;
                        const isSelected = mode === m;
                        return (
                            <button
                                key={m}
                                onClick={() => handleModeChange(m)}
                                className={cn(
                                    "flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                                )}
                            >
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{info.label}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{info.description}</p>
                                </div>
                                {isSelected && (
                                    <CheckCircle2 className="h-5 w-5 text-primary mt-2" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Occupancy Settings
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">
                                Max Occupants per Unit
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={formData.max_occupants_per_unit}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_occupants_per_unit: parseInt(e.target.value) || 1 }))}
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                Maximum number of occupants allowed per unit under this property
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <VenusAndMars className="h-4 w-4" />
                                Gender Restriction
                            </label>
                            <select
                                value={formData.gender_restriction_mode}
                                onChange={(e) => setFormData(prev => ({ ...prev, gender_restriction_mode: e.target.value as GenderRestrictionMode }))}
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            >
                                {GENDER_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} - {opt.description}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Utility Policy
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Utility Billing Mode
                            </label>
                            <select
                                value={formData.utility_policy_mode}
                                onChange={(e) => setFormData(prev => ({ ...prev, utility_policy_mode: e.target.value as UtilityPolicyMode }))}
                                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                            >
                                {UTILITY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} - {opt.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.utility_policy_mode === "mixed" && (
                            <div>
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Fixed Monthly Charge (Optional)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={formData.utility_fixed_charge_amount ?? ""}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        utility_fixed_charge_amount: e.target.value ? parseFloat(e.target.value) : null
                                    }))}
                                    placeholder="0.00"
                                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Rules & Curfew Settings
                </h2>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">Curfew</p>
                                <p className="text-xs text-muted-foreground">Enable overnight quiet hours</p>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, curfew_enabled: !prev.curfew_enabled }))}
                                className={cn(
                                    "relative h-6 w-11 rounded-full transition-colors",
                                    formData.curfew_enabled ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                                    formData.curfew_enabled ? "left-6" : "left-1"
                                )} />
                            </button>
                        </div>

                        {formData.curfew_enabled && (
                            <div>
                                <label className="text-xs text-muted-foreground">Curfew Time</label>
                                <input
                                    type="time"
                                    value={formData.curfew_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, curfew_time: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">Visitor Cutoff</p>
                                <p className="text-xs text-muted-foreground">Last allowed time for visitors</p>
                            </div>
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, visitor_cutoff_enabled: !prev.visitor_cutoff_enabled }))}
                                className={cn(
                                    "relative h-6 w-11 rounded-full transition-colors",
                                    formData.visitor_cutoff_enabled ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform",
                                    formData.visitor_cutoff_enabled ? "left-6" : "left-1"
                                )} />
                            </button>
                        </div>

                        {formData.visitor_cutoff_enabled && (
                            <div>
                                <label className="text-xs text-muted-foreground">Visitor Cutoff Time</label>
                                <input
                                    type="time"
                                    value={formData.visitor_cutoff_time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, visitor_cutoff_time: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 border-t border-border pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-foreground">Quiet Hours</p>
                                <p className="text-xs text-muted-foreground">Mandatory silence period</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={formData.quiet_hours_start}
                                onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                                className="w-28 rounded-xl border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                            />
                            <span className="text-muted-foreground">to</span>
                            <input
                                type="time"
                                value={formData.quiet_hours_end}
                                onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                                className="w-28 rounded-xl border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-300">
                    <AlertCircle className="mr-2 inline h-4 w-4" />
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    Environment settings saved successfully
                </div>
            )}

            <div className="flex justify-end gap-3 pb-8">
                <button
                    onClick={() => router.push(`/landlord/properties`)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}