"use client";

import Image from 'next/image';
import { useState, useEffect, Suspense, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    Home,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Camera,
    Upload,
    Check,
    Grid,
    Layers,
    FileText,
    ClipboardList,
    ShieldCheck,
    Zap,
    Users,
    Settings,
    X,
    Wallet,
    Sparkles,
    FilePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartContractPreviewModal } from "@/components/landlord/properties/SmartContractPreviewModal";
import ClickSpark from "@/components/ui/ClickSpark";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { playSound } from "@/hooks/useSound";
import { useAppToast } from "@/hooks/useAppToast";

type Step = 1 | 2 | 3 | 4;

type SupportedPropertyEnum = "apartment" | "dormitory" | "boarding_house";

const PROPERTY_TYPE_TO_ENUM: Record<string, SupportedPropertyEnum> = {
    "Apartment": "apartment",
    "Dormitory": "dormitory",
    "Boarding House": "boarding_house",
};

const ENUM_TO_PROPERTY_TYPE: Record<string, string> = {
    apartment: "Apartment",
    dormitory: "Dormitory",
    boarding_house: "Boarding House",
};

const DEFAULT_OCCUPANCY: Record<SupportedPropertyEnum, number> = {
    apartment: 5,
    dormitory: 4,
    boarding_house: 2,
};

const MAX_PROPERTY_UPLOAD_FILES = 12;
const SAVE_SAFETY_TIMEOUT_MS = 45_000;
const MEDIA_UPLOAD_TIMEOUT_MS = 25_000;
const PROPERTY_LOAD_TIMEOUT_MS = 12_000;

function NewAssetContent() {
    const { push } = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams?.get("mode");
    const id = searchParams?.get("id");
    const isEditMode = mode === "edit";

    const { user, profile } = useAuth();
    const supabase = createClient();
    const toast = useAppToast();
    
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveStage, setSaveStage] = useState<string | null>(null);
    const [isLoadingProperty, setIsLoadingProperty] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveWarning, setSaveWarning] = useState<string | null>(null);
    const [reloadPropertyKey, setReloadPropertyKey] = useState(0);
    const [isContractBuilderOpen, setIsContractBuilderOpen] = useState(false);
    const [customAmenity, setCustomAmenity] = useState("");
    const [customAmenities, setCustomAmenities] = useState<string[]>([]);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
    const [coverExistingUrl, setCoverExistingUrl] = useState<string | null>(null);
    const [coverNewIndex, setCoverNewIndex] = useState<number | null>(null);
    
    const [formData, setFormData] = useState({
        propertyName: "",
        address: "",
        totalUnits: "1",
        floorCount: "1",
        description: "",
        occupancyLimit: "5",
        utilityBilling: "fixed_charge" as any,
        baseRent: 0,
        buildingRules: [] as string[],
        amenities: [] as string[],
        contractMode: "generate" as "generate" | "upload",
        contractFile: null as string | null,
        propertyType: "apartment" as SupportedPropertyEnum,
    });

    const hasHydratedEditData = formData.propertyName.trim().length > 0 && formData.address.trim().length > 0;

    useEffect(() => {
        if (!isEditMode || !id) return;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), PROPERTY_LOAD_TIMEOUT_MS);

        const loadProperty = async () => {
            setIsLoadingProperty(true);
            setLoadError(null);
            try {
                const response = await fetch(`/api/landlord/properties/${id}`, { signal: controller.signal });
                const payload = await response.json();
                if (!response.ok || !payload.property) throw new Error(payload.error || "Failed to load property details.");

                const p = payload.property;
                let contractMode: "generate" | "upload" = "generate";
                let contractFile: string | null = null;
                
                if (p.contract_template && typeof p.contract_template === "object") {
                    const ct = p.contract_template as any;
                    if (ct.contract_mode) contractMode = ct.contract_mode;
                    if (ct.file_name) contractFile = ct.file_name;
                }

                setFormData({
                    propertyName: p.name,
                    address: p.address,
                    totalUnits: String(p.total_units ?? 1),
                    floorCount: String(p.total_floors ?? 1),
                    description: p.description ?? "",
                    occupancyLimit: String(p.env_policy?.max_occupants_per_unit ?? 5),
                    utilityBilling: (p.env_policy?.utility_split_method ?? "fixed_charge") as any,
                    baseRent: p.base_rent_amount ?? 0,
                    buildingRules: Array.isArray(p.house_rules) ? p.house_rules : [],
                    amenities: Array.isArray(p.amenities) ? p.amenities : [],
                    propertyType: (p.type ?? "apartment") as SupportedPropertyEnum,
                    contractMode,
                    contractFile
                });

                setExistingImageUrls(Array.isArray(p.images) ? p.images : []);
                setCoverExistingUrl(Array.isArray(p.images) ? p.images[0] : null);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load property details.");
            } finally {
                window.clearTimeout(timeout);
                setIsLoadingProperty(false);
            }
        };
        void loadProperty();
        return () => controller.abort();
    }, [isEditMode, id, reloadPropertyKey]);
    
    // Auto-select contract mode for new properties based on last used mode
    useEffect(() => {
        if (isEditMode || !user) return;
        
        const fetchLastContractMode = async () => {
            const { data, error } = await supabase
                .from("properties")
                .select("contract_template")
                .eq("landlord_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();
                
            if (data?.contract_template && typeof data.contract_template === "object") {
                const ct = data.contract_template as any;
                if (ct.contract_mode) {
                    setFormData(prev => ({ ...prev, contractMode: ct.contract_mode }));
                }
            }
        };
        
        void fetchLastContractMode();
    }, [isEditMode, user]);

    useEffect(() => {
        const nextPreviews = mediaFiles.map(f => URL.createObjectURL(f));
        setMediaPreviewUrls(nextPreviews);
        return () => nextPreviews.forEach(url => URL.revokeObjectURL(url));
    }, [mediaFiles]);

    const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));


    const handleMediaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const next = Array.from(files).slice(0, MAX_PROPERTY_UPLOAD_FILES - mediaFiles.length);
        setMediaFiles(prev => [...prev, ...next]);
        if (coverExistingUrl === null && coverNewIndex === null && next.length > 0) setCoverNewIndex(0);
    };

    const handleNext = () => {
        if (step < 4) setStep(s => (s + 1) as Step);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep(s => (s - 1) as Step);
        else push("/landlord/properties");
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSaveStage("Finalizing configuration...");
        try {
            if (!user) throw new Error("Session expired.");

            const propPayload = {
                name: formData.propertyName,
                address: formData.address,
                type: formData.propertyType,
                total_units: parseInt(formData.totalUnits),
                total_floors: parseInt(formData.floorCount),
                base_rent_amount: parseFloat(formData.baseRent.toString()) || 0,
                description: formData.description,
                amenities: formData.amenities,
                house_rules: formData.buildingRules,
                landlord_id: user.id,
                city: "Valenzuela",
                images: existingImageUrls,
            };

            let propId = id;
            if (isEditMode && id) {
                const { error: updateError } = await supabase
                    .from("properties")
                    .update(propPayload)
                    .eq("id", id)
                    .select()
                    .single();
                if (updateError) throw new Error(`Failed to update property: ${updateError.message}`);
            } else {
                const { data, error } = await supabase.from("properties").insert(propPayload).select("id").single();
                if (error) throw error;
                propId = data?.id;
            }

            if (propId) {
                // Map frontend choices to DB columns
                // Mapping: 
                // fixed_charge -> utility_policy_mode: included_in_rent, utility_split_method: fixed_charge
                // individual_meter -> utility_policy_mode: separate_metered, utility_split_method: individual_meter
                // equal_per_head -> utility_policy_mode: mixed, utility_split_method: equal_per_head

                const policyMapping: Record<string, { mode: string, split: string }> = {
                    fixed_charge: { mode: "included_in_rent", split: "fixed_charge" },
                    individual_meter: { mode: "separate_metered", split: "individual_meter" },
                    equal_per_head: { mode: "mixed", split: "equal_per_head" }
                };

                const mapping = policyMapping[formData.utilityBilling] || policyMapping.fixed_charge;

                // Save environment policy
                const { error: policyError } = await supabase.from("property_environment_policies").upsert({
                    property_id: propId,
                    environment_mode: "residential",
                    max_occupants_per_unit: parseInt(formData.occupancyLimit),
                    utility_policy_mode: mapping.mode as any,
                    updated_at: new Date().toISOString()
                } as any, { onConflict: "property_id" });
                if (policyError) throw new Error(`Failed to save environment policy: ${policyError.message}`);

                // Sync contract metadata if generated
                if (formData.contractMode === "generate") {
                    const { error: contractError } = await supabase.from("properties").update({
                        contract_template: {
                            answers: {
                                rent: formData.baseRent.toString(),
                                occupancy_limit: formData.occupancyLimit,
                                utility_split_method: formData.utilityBilling,
                                utilities: formData.amenities,
                            },
                            customClauses: formData.buildingRules.map((rule, idx) => ({
                                id: idx,
                                title: "Building Rule",
                                description: rule
                            })),
                            contract_mode: "generate",
                            last_updated: new Date().toISOString()
                        }
                    }).eq("id", propId);
                    if (contractError) throw new Error(`Failed to save contract template: ${contractError.message}`);
                } else if (formData.contractMode === "upload") {
                    const { error: uploadError } = await supabase.from("properties").update({
                        contract_template: {
                            contract_mode: "upload",
                            file_name: formData.contractFile,
                            last_updated: new Date().toISOString()
                        }
                    }).eq("id", propId);
                    if (uploadError) throw new Error(`Failed to save uploaded contract: ${uploadError.message}`);
                }

            }

            if (propId) {
                // ... (rest of the logic)
            }

            toast.success(isEditMode ? "Property updated successfully!" : "Property created successfully!");
            setIsSubmitting(false);
            push("/landlord/properties");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save property. Please try again.");
            setIsSubmitting(false);
        }
    };

    const STEPS = [
        { id: 1, label: "Identity", icon: Building2 },
        { id: 2, label: "Architecture", icon: Grid },
        { id: 3, label: "Financials", icon: "₱" },
        { id: 4, label: "Governance", icon: ShieldCheck }
    ];

    return (
        <div className="min-h-screen pb-20 relative selection:bg-primary/30">
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] size-[50rem] rounded-full bg-primary/10 blur-[150px] opacity-50 animate-pulse" />
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-8 space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <button onClick={handleBack} className="group flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-all bg-white/[0.03] px-5 py-2.5 rounded-full border border-white/5 backdrop-blur-xl">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        {step === 1 ? "Cancel" : "Back"}
                    </button>
                    <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] bg-primary/10 px-5 py-2 rounded-full border border-primary/20 backdrop-blur-xl">
                        {isEditMode ? "Asset Configuration" : "Expansion Wizard"}
                    </div>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/12 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="p-10 border-b border-white/5 bg-white/[0.01]">
                        <div className="flex flex-col md:row md:items-center justify-between gap-10">
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold text-white tracking-tight">Property Wizard</h1>
                                <p className="text-white/40 text-sm font-medium max-w-md">
                                    {isEditMode ? "Refining parameters for your asset." : "Establishing a new verified asset profile."}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {STEPS.map((s, idx) => (
                                    <div key={s.id} className="flex items-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "size-10 rounded-full flex items-center justify-center transition-all duration-500 border",
                                                step === s.id ? "bg-primary text-black border-primary shadow-lg ring-4 ring-primary/10" : "bg-white/5 text-white/20 border-white/5"
                                            )}>
                                                {step > s.id ? (
                                                    <Check className="size-5 text-primary" />
                                                ) : typeof s.icon === "string" ? (
                                                    <span className="text-sm font-bold">{s.icon}</span>
                                                ) : (
                                                    <s.icon className="size-4" />
                                                )}
                                            </div>
                                            <span className={cn("text-[9px] font-bold uppercase tracking-widest", step === s.id ? "text-primary" : "text-white/20")}>{s.label}</span>
                                        </div>
                                        {idx < STEPS.length - 1 && <div className="w-6 h-px bg-white/5 mx-2 -mt-6" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 min-h-[400px]">
                        {/* 1. Identity */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Property Identity</h2>
                                    <p className="text-white/40 text-sm font-medium mt-1">Establish the visual and formal identity of your asset.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <Camera className="size-3.5 text-primary" />
                                            <label htmlFor="cover-identity" className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cover Identity</label>
                                        </div>
                                        <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 aspect-[16/10]">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                {(mediaPreviewUrls.length > 0 || existingImageUrls.length > 0) ? (
                                                    <Image src={mediaPreviewUrls[0] || existingImageUrls[0]} alt="" fill className="object-cover" />
                                                ) : (
                                                    <Upload className="size-8 text-white/20" />
                                                )}
                                            </div>
                                            <input id="cover-identity" type="file" onChange={handleMediaFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                                        <div className="space-y-2 relative">
                                            <div className="flex items-center justify-between px-1">
                                                <label htmlFor="property-name" className="text-[9px] font-bold uppercase tracking-wider text-white/30">Designation</label>
                                                {isEditMode && <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="size-2.5" /> Locked by Admin</span>}
                                            </div>
                                            <input 
                                                id="property-name"
                                                type="text" 
                                                disabled={isEditMode}
                                                value={formData.propertyName} 
                                                onChange={e => handleInputChange("propertyName", e.target.value)} 
                                                className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50 ${isEditMode ? "opacity-50 cursor-not-allowed bg-black/20" : ""}`} 
                                                placeholder="e.g. Skyline Residences" 
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <div className="flex items-center justify-between px-1">
                                                <label htmlFor="property-address" className="text-[9px] font-bold uppercase tracking-wider text-white/30">Location</label>
                                                {isEditMode && <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="size-2.5" /> Locked by Admin</span>}
                                            </div>
                                            <textarea 
                                                id="property-address"
                                                rows={3} 
                                                disabled={isEditMode}
                                                value={formData.address} 
                                                onChange={e => handleInputChange("address", e.target.value)} 
                                                className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white/80 outline-none focus:border-primary/50 resize-none ${isEditMode ? "opacity-50 cursor-not-allowed bg-black/20" : ""}`} 
                                                placeholder="Full address…" 
                                            />
                                        </div>
                                        {isEditMode && (
                                            <button 
                                                type="button"
                                                onClick={() => push("/landlord/support?topic=property_info_change")}
                                                className="w-full py-4 rounded-2xl border border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck className="size-3.5" />
                                                Request Identity Modification
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Architecture */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Architectural Scope</h2>
                                    <p className="text-white/40 text-sm font-medium mt-1">Define the physical parameters and capacity.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Home className="size-4 text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Asset Class</h3>
                                        </div>
                                        <div className="grid gap-3">
                                            {[
                                                { id: "apartment", label: "Apartment", desc: "Multi-family residential unit" },
                                                { id: "dormitory", label: "Dormitory", desc: "Student housing / Shared rooms" },
                                                { id: "boarding_house", label: "Boarding House", desc: "Individual room rentals" },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleInputChange("propertyType", opt.id)}
                                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${formData.propertyType === opt.id ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-2.5 rounded-full ${formData.propertyType === opt.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" : "bg-white/10"}`} />
                                                        <div>
                                                            <p className={`text-sm font-bold tracking-tight ${formData.propertyType === opt.id ? "text-primary" : "text-white"}`}>{opt.label}</p>
                                                            <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{opt.desc}</p>
                                                        </div>
                                                    </div>
                                                    {formData.propertyType === opt.id && <CheckCircle2 className="size-5 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Grid className="size-4 text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Structural Specs</h3>
                                        </div>
                                        <div className="grid gap-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Units</label>
                                                    <input 
                                                        type="number" 
                                                        value={formData.totalUnits}
                                                        onChange={(e) => handleInputChange("totalUnits", e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Floors</label>
                                                    <input 
                                                        type="number" 
                                                        value={formData.floorCount}
                                                        onChange={(e) => handleInputChange("floorCount", e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Max Occupants per Unit</label>
                                                <input 
                                                    type="number" 
                                                    value={formData.occupancyLimit}
                                                    onChange={(e) => handleInputChange("occupancyLimit", e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Financials */}
                        {step === 3 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Financial Strategy</h2>
                                    <p className="text-white/40 text-sm font-medium mt-1">Configure billing logic and amenities.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">                                     
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="size-4 text-primary" />
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Billing Strategy</h3>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid gap-3">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Utility Management</label>
                                                <div className="grid gap-2">
                                                    {[
                                                        { id: "fixed_charge", label: "Bundled Utilities", desc: "All-inclusive monthly rate" },
                                                        { id: "individual_meter", label: "Metered Consumption", desc: "Pay-per-use direct billing" },
                                                        { id: "equal_per_head", label: "Hybrid Strategy", desc: "Fixed base + usage overhead" },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleInputChange("utilityBilling", opt.id)}
                                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${formData.utilityBilling === opt.id ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/5" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`size-2.5 rounded-full ${formData.utilityBilling === opt.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" : "bg-white/10"}`} />
                                                                <div>
                                                                    <p className={`text-sm font-bold tracking-tight ${formData.utilityBilling === opt.id ? "text-primary" : "text-white"}`}>{opt.label}</p>
                                                                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{opt.desc}</p>
                                                                </div>
                                                            </div>
                                                            {formData.utilityBilling === opt.id && <CheckCircle2 className="size-5 text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Standard Base Rent (PHP)</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-xl font-bold text-primary/40 group-focus-within:text-primary transition-colors">₱</div>
                                                    <input 
                                                        type="text" 
                                                        value={formData.baseRent === 0 ? "" : formData.baseRent.toLocaleString('en-US')}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/,/g, "");
                                                            const num = parseInt(val) || 0;
                                                            handleInputChange("baseRent", num);
                                                        }}
                                                        placeholder="0.00"
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-2xl font-bold text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="size-4 text-primary" />
                                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Amenities</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{formData.amenities.length} Selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {[
                                                "Wi-Fi", "Gym", "Pool", "Laundry", "Parking", 
                                                "Security", "CCTV", "Garden", "Elevator"
                                            ].map((amenity) => (
                                                <button
                                                    key={amenity}
                                                    onClick={() => {
                                                        const newAmenities = formData.amenities.includes(amenity)
                                                            ? formData.amenities.filter(a => a !== amenity)
                                                            : [...formData.amenities, amenity];
                                                        handleInputChange("amenities", newAmenities);
                                                    }}
                                                    className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all text-center ${formData.amenities.includes(amenity) ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 text-white/30 hover:text-white/50"}`}
                                                >
                                                    {amenity}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Rules & Policy */}
                        {step === 4 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Rules & Governance</h2>
                                    <p className="text-white/40 text-sm font-medium mt-1">Define property conduct and validate configuration.</p>
                                </div>
                                    {/* Building Rules - Spans 12 columns */}
                                    <div className="lg:col-span-12">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="size-4 text-primary" />
                                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Building Rules & Conduct</h3>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{formData.buildingRules.length} Defined</span>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        value={customAmenity}
                                                        onChange={(e) => setCustomAmenity(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && customAmenity.trim()) {
                                                                handleInputChange("buildingRules", [...formData.buildingRules, customAmenity.trim()]);
                                                                setCustomAmenity("");
                                                            }
                                                        }}
                                                        placeholder="Define a new property rule…"
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary/50 transition-all placeholder:text-white/10 outline-none"
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            if (customAmenity.trim()) {
                                                                handleInputChange("buildingRules", [...formData.buildingRules, customAmenity.trim()]);
                                                                setCustomAmenity("");
                                                            }
                                                        }}
                                                        className="px-6 py-2 bg-primary text-black rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                    >
                                                        Add Rule
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {formData.buildingRules.map((rule, index) => (
                                                        <div 
                                                            key={rule}
                                                            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 group hover:border-primary/30 transition-all"
                                                        >
                                                            <span className="text-xs font-bold text-white/80">{rule}</span>
                                                            <button 
                                                                onClick={() => handleInputChange("buildingRules", formData.buildingRules.filter((_, i) => i !== index))}
                                                                className="text-white/20 hover:text-red-400 transition-colors"
                                                            >
                                                                <X className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contract Preview - Span 5 */}
                                    <div className="lg:col-span-5">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-4 text-primary" />
                                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Final Validation</h3>
                                            </div>
                                            
                                            <div 
                                                onClick={() => {
                                                    if (formData.contractMode === "generate") {
                                                        setIsContractBuilderOpen(true);
                                                    } else {
                                                        document.getElementById('contract-upload-input')?.click();
                                                    }
                                                }}
                                                className="relative group cursor-pointer aspect-[16/11] rounded-[2rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/40"
                                            >
                                                <input 
                                                    id="contract-upload-input"
                                                    type="file" 
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            handleInputChange("contractFile", file.name);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-black/60 pointer-events-none" />
                                                
                                                {formData.contractMode === "generate" ? (
                                                    <>
                                                        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                                            <FileText className="size-8 text-primary" />
                                                        </div>
                                                        <div className="text-center px-4 relative z-10">
                                                            <span className="block text-xs font-bold text-white uppercase tracking-widest mb-1">Contract Preview</span>
                                                            <span className="block text-[8px] text-white/30 uppercase tracking-widest font-bold">
                                                                Draft Synchronized
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className={`size-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 duration-500 ${formData.contractFile ? "bg-primary/20 border-primary/40" : "bg-white/5 border-white/10"}`}>
                                                            {formData.contractFile ? <CheckCircle2 className="size-8 text-primary" /> : <Upload className="size-8 text-white/20" />}
                                                        </div>
                                                        <div className="text-center px-4">
                                                            <span className={`block text-xs font-bold uppercase tracking-widest ${formData.contractFile ? "text-primary" : "text-white/40"}`}>
                                                                {formData.contractFile ? "Upload Complete" : "Click to Upload"}
                                                            </span>
                                                            {formData.contractFile && <span className="block text-[8px] text-white/30 uppercase tracking-widest font-bold mt-1 truncate max-w-[150px] mx-auto">{formData.contractFile}</span>}
                                                        </div>
                                                    </>
                                                )}

                                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-white text-black px-5 py-2.5 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                        {formData.contractMode === "generate" ? <ShieldCheck className="size-4" /> : <Upload className="size-4" />}
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                            {formData.contractMode === "generate" ? "View Generated Draft" : (formData.contractFile ? "Change Document" : "Upload File")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lease Management Method - Span 7 */}
                                    <div className="lg:col-span-7">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-7 space-y-6 h-full flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FilePlus className="size-4 text-primary" />
                                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Lease Management Method</h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/20 rounded-lg">
                                                    <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Global Preference</span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid gap-5 flex-1">
                                                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                                    {[
                                                        { id: "generate", label: "Auto-Generate Digital Lease" },
                                                        { id: "upload", label: "Upload Proprietary Document" }
                                                    ].map((mode) => (
                                                        <button 
                                                            key={mode.id}
                                                            onClick={() => handleInputChange("contractMode", mode.id as any)}
                                                            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${formData.contractMode === mode.id ? "bg-primary text-black shadow-lg shadow-primary/10" : "text-white/30 hover:text-white/50"}`}
                                                        >
                                                            {mode.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex-1 flex flex-col items-center justify-center text-center space-y-3">
                                                    <div className="size-12 rounded-full bg-white/[0.03] flex items-center justify-center">
                                                        {formData.contractMode === "generate" ? <ShieldCheck className="size-6 text-primary/40" /> : <Upload className="size-6 text-white/20" />}
                                                    </div>
                                                    <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-xs">
                                                        {formData.contractMode === "generate" 
                                                            ? "Automatically bind your asset configuration into a legally-compliant digital agreement powered by iReside Smart Draft." 
                                                            : "Securely host and link your existing physical or PDF-based lease documentation to this property profile."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        )}
                    </div>

                    <div className="p-10 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <button onClick={handleBack} disabled={isSubmitting} className={cn("flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold uppercase text-[11px]", step === 1 ? "opacity-0 pointer-events-none" : "")}>
                            <ArrowLeft className="size-4" /><span>Back</span>
                        </button>
                        <button onClick={handleNext} disabled={isSubmitting} className="px-10 py-5 bg-primary text-black rounded-2xl font-bold uppercase text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                            {isSubmitting ? "Syncing..." : step === 4 ? "Finalize Profile" : "Continue"}
                        </button>
                    </div>
                </div>
            </div>

            <SmartContractPreviewModal
                isOpen={isContractBuilderOpen}
                onClose={() => setIsContractBuilderOpen(false)}
                landlordName={profile?.full_name || user?.email}
                data={{
                    propertyName: formData.propertyName,
                    propertyType: formData.propertyType,
                    baseRent: formData.baseRent,
                    occupancyLimit: formData.occupancyLimit,
                    utilityBilling: formData.utilityBilling,
                    amenities: formData.amenities,
                    buildingRules: formData.buildingRules
                }}
            />
        </div>
    );
}

export default function NewAssetPage() {
    return (
        <ClickSpark sparkColor="#7CA34D" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                <NewAssetContent />
            </Suspense>
        </ClickSpark>
    );
}

