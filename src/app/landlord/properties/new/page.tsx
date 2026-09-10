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
    FilePlus,
    Hash,
    Eye,
    Save,
    Loader2
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { generateUnitList } from "@/lib/unit-naming";
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
    const router = useRouter();
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
    const [errors, setErrors] = useState<Record<string, string>>({});
    
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
        unitPrefix: "Unit",
        numberingStyle: "floor_based" as "floor_based" | "sequential",
        startingNumber: 101,
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
                    totalUnits: String(Math.max(Number(p.total_units) || 0, Number(p.unitCount) || 0, 1)),
                    floorCount: String(p.total_floors ?? 1),
                    description: p.description ?? "",
                    occupancyLimit: String(p.env_policy?.max_occupants_per_unit ?? 5),
                    utilityBilling: (p.env_policy?.utility_split_method ?? "fixed_charge") as any,
                    baseRent: p.base_rent_amount ?? 0,
                    buildingRules: Array.isArray(p.house_rules) ? p.house_rules : [],
                    amenities: Array.isArray(p.amenities) ? p.amenities : [],
                    propertyType: (p.type ?? "apartment") as SupportedPropertyEnum,
                    contractMode,
                    contractFile,
                    unitPrefix: p.type === "dormitory" || p.type === "boarding_house" ? "Room" : "Unit",
                    numberingStyle: "floor_based",
                    startingNumber: 101,
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

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => {
            if (!prev[field] && !(field === "contractMode" && prev.contractFile)) return prev;
            const next = { ...prev };
            delete next[field];
            if (field === "contractMode" && value === "generate") {
                delete next.contractFile;
            }
            return next;
        });
    };

    const handleMediaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const selectedFile = files[0];
        setMediaFiles([selectedFile]);
        setCoverNewIndex(0);
        toast.info("New cover photo selected! Click 'Save Changes' to update.");
    };

    const validateStep = (currentStep: Step): boolean => {
        const nextErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!formData.propertyName.trim()) {
                nextErrors.propertyName = "Property designation / name is required.";
            }
            if (!formData.address.trim()) {
                nextErrors.address = "Property location / address is required.";
            }
        } else if (currentStep === 2) {
            const units = parseInt(formData.totalUnits, 10);
            if (isNaN(units) || units < 1) {
                nextErrors.totalUnits = "Total units must be at least 1.";
            }
            const floors = parseInt(formData.floorCount, 10);
            if (isNaN(floors) || floors < 1) {
                nextErrors.floorCount = "Floor count must be at least 1.";
            }
            const occupancy = parseInt(formData.occupancyLimit, 10);
            if (isNaN(occupancy) || occupancy < 1) {
                nextErrors.occupancyLimit = "Occupancy limit must be at least 1.";
            }
            if (!formData.unitPrefix.trim()) {
                nextErrors.unitPrefix = "Unit prefix is required.";
            }
        } else if (currentStep === 3) {
            if (!formData.baseRent || formData.baseRent <= 0) {
                nextErrors.baseRent = "Please enter a valid base rent amount greater than ₱0.";
            }
        } else if (currentStep === 4) {
            if (formData.contractMode === "upload" && !formData.contractFile) {
                nextErrors.contractFile = "Please upload a lease document or switch to Auto-Generate.";
            }
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            const firstErrorMessage = Object.values(nextErrors)[0];
            toast.error(firstErrorMessage);
            return false;
        }

        return true;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        if (step < 4) setStep(s => (s + 1) as Step);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep(s => (s - 1) as Step);
        else router.push("/landlord/properties");
    };

    const handleSubmit = async () => {
        for (let s = 1; s <= 4; s++) {
            if (!validateStep(s as Step)) {
                setStep(s as Step);
                return;
            }
        }
        setIsSubmitting(true);
        setSaveStage("Saving configuration...");
        try {
            if (!user) throw new Error("Session expired. Please log in again.");

            let currentImages = [...existingImageUrls];

            // 1. Upload new media files if any
            if (mediaFiles.length > 0) {
                setSaveStage("Uploading cover photo...");
                const targetPropId = id || "temp-property";
                const mediaFormData = new FormData();
                mediaFormData.append("propertyId", targetPropId);
                for (const file of mediaFiles) {
                    mediaFormData.append("files", file);
                }

                // If editing existing property, upload directly
                if (id) {
                    try {
                        const mediaRes = await fetch("/api/landlord/properties/media", {
                            method: "POST",
                            body: mediaFormData,
                        });
                        const mediaData = await mediaRes.json();
                        if (mediaRes.ok && Array.isArray(mediaData.imageUrls) && mediaData.imageUrls.length > 0) {
                            const newCoverUrl = mediaData.imageUrls[0];
                            // Replace cover photo at index 0 with the newly uploaded photo
                            const remainingImages = existingImageUrls.length > 0 ? existingImageUrls.slice(1) : [];
                            currentImages = [newCoverUrl, ...remainingImages];
                            setExistingImageUrls(currentImages);
                            setCoverExistingUrl(newCoverUrl);
                            setMediaFiles([]);
                        } else {
                            throw new Error(mediaData?.error || "Failed to upload cover photo.");
                        }
                    } catch (uploadErr) {
                        console.error("Cover photo upload error:", uploadErr);
                        throw uploadErr;
                    }
                }
            }

            setSaveStage("Saving property details...");

            const endpoint = isEditMode && id ? `/api/landlord/properties/${id}` : `/api/landlord/properties`;
            const method = isEditMode && id ? "PUT" : "POST";

            const payload = {
                name: formData.propertyName,
                address: formData.address,
                type: formData.propertyType,
                total_units: formData.totalUnits,
                total_floors: formData.floorCount,
                base_rent_amount: formData.baseRent,
                description: formData.description,
                amenities: formData.amenities,
                house_rules: formData.buildingRules,
                images: currentImages,
                contract_mode: formData.contractMode,
                contract_file: formData.contractFile,
                occupancy_limit: formData.occupancyLimit,
                utility_billing: formData.utilityBilling,
                unit_prefix: formData.unitPrefix,
                numbering_style: formData.numberingStyle,
                starting_number: formData.startingNumber,
            };

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to save property.");
            }

            // If new property was created and there were media files, upload them now with the real property ID
            if (!isEditMode && result.propertyId && mediaFiles.length > 0) {
                setSaveStage("Uploading photos...");
                try {
                    const mediaFormData = new FormData();
                    mediaFormData.append("propertyId", result.propertyId);
                    for (const file of mediaFiles) {
                        mediaFormData.append("files", file);
                    }
                    const mediaRes = await fetch("/api/landlord/properties/media", {
                        method: "POST",
                        body: mediaFormData,
                    });
                    const mediaData = await mediaRes.json();
                    if (mediaRes.ok && Array.isArray(mediaData.imageUrls) && mediaData.imageUrls.length > 0) {
                        await fetch(`/api/landlord/properties/${result.propertyId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ...payload,
                                images: [...currentImages, ...mediaData.imageUrls],
                            }),
                        });
                    }
                } catch (mediaErr) {
                    console.warn("Media upload post-create warning:", mediaErr);
                }
            }

            toast.success(isEditMode ? "Property updated successfully!" : "Property created successfully!");
            router.refresh();
            router.push("/landlord/properties");
        } catch (e) {
            console.error("Save error:", e);
            toast.error(e instanceof Error ? e.message : "Failed to save property. Please try again.");
        } finally {
            setIsSubmitting(false);
            setSaveStage(null);
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
                    <button onClick={handleBack} className="group flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground transition-all neumorphic-panel px-5 py-2.5 rounded-full border border-border/60 backdrop-blur-xl">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        {step === 1 ? "Cancel" : "Back"}
                    </button>
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-5 py-2 rounded-full border border-primary/20 backdrop-blur-xl shadow-sm">
                        {isEditMode ? "Asset Configuration" : "Expansion Wizard"}
                    </div>
                </div>

                <div className="bg-card/90 backdrop-blur-2xl border border-border/80 rounded-[2.5rem] overflow-hidden shadow-xl">
                    <div className="p-10 border-b border-border/60 bg-muted/20">
                        <div className="flex flex-col md:row md:items-center justify-between gap-10">
                            <div className="space-y-3">
                                <h1 className="text-4xl font-black text-foreground tracking-tight">Property Wizard</h1>
                                <p className="text-muted-foreground text-sm font-medium max-w-md">
                                    {isEditMode ? "Refining parameters for your asset." : "Establishing a new verified asset profile."}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {STEPS.map((s, idx) => (
                                    <div key={s.id} className="flex items-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className={cn(
                                                "size-10 rounded-full flex items-center justify-center transition-all duration-500 border font-black",
                                                step === s.id 
                                                    ? "bg-primary text-black border-primary shadow-lg ring-4 ring-primary/20" 
                                                    : step > s.id 
                                                        ? "neumorphic-inset-card text-primary border-primary/30"
                                                        : "neumorphic-inset-card text-muted-foreground/40 border-border/50"
                                            )}>
                                                {step > s.id ? (
                                                    <Check className="size-5 text-primary" />
                                                ) : typeof s.icon === "string" ? (
                                                    <span className="text-sm font-black">{s.icon}</span>
                                                ) : (
                                                    <s.icon className="size-4" />
                                                )}
                                            </div>
                                            <span className={cn("text-[9px] font-black uppercase tracking-widest", step === s.id ? "text-primary" : "text-muted-foreground/60")}>{s.label}</span>
                                        </div>
                                        {idx < STEPS.length - 1 && <div className="w-6 h-px bg-border/60 mx-2 -mt-6" />}
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
                                    <h2 className="text-3xl font-black tracking-tight text-foreground">Property Identity</h2>
                                    <p className="text-muted-foreground text-sm font-medium mt-1">Establish the visual and formal identity of your asset.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <Camera className="size-3.5 text-primary" />
                                                <label htmlFor="cover-identity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cover Photo</label>
                                            </div>
                                            {mediaFiles.length > 0 && (
                                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                                                    New Photo Staged
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-border/60 neumorphic-inset aspect-[16/10]">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                {(mediaPreviewUrls.length > 0 || existingImageUrls.length > 0) ? (
                                                    <Image src={mediaPreviewUrls[0] || existingImageUrls[0]} alt="Property Cover" fill className="object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/60">
                                                        <Upload className="size-8 text-muted-foreground/40" />
                                                        <span className="text-xs font-bold">Click to Upload Cover Photo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                                                <div className="neumorphic-panel bg-card/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-foreground shadow-lg">
                                                    <Camera className="size-4 text-primary" />
                                                    <span>Change Cover Photo</span>
                                                </div>
                                            </div>
                                            <input 
                                                id="cover-identity" 
                                                type="file" 
                                                accept="image/jpeg,image/png,image/webp,image/jpg" 
                                                onChange={handleMediaFileChange} 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6 neumorphic-panel border border-border/60 rounded-[2.5rem] p-8">
                                        <div className="space-y-2 relative">
                                            <div className="flex items-center justify-between px-1">
                                                <label htmlFor="property-name" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Designation</label>
                                            </div>
                                            <input 
                                                id="property-name"
                                                type="text" 
                                                value={formData.propertyName} 
                                                onChange={e => handleInputChange("propertyName", e.target.value)} 
                                                className={`w-full neumorphic-inset rounded-2xl px-6 py-4 text-sm font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50 ${errors.propertyName ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`} 
                                                placeholder="e.g. Skyline Residences" 
                                            />
                                            {errors.propertyName && (
                                                <p className="text-[11px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {errors.propertyName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2 relative">
                                            <div className="flex items-center justify-between px-1">
                                                <label htmlFor="property-address" className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Location</label>
                                            </div>
                                            <textarea 
                                                id="property-address"
                                                rows={3} 
                                                value={formData.address} 
                                                onChange={e => handleInputChange("address", e.target.value)} 
                                                className={`w-full neumorphic-inset rounded-2xl px-6 py-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-all placeholder:text-muted-foreground/50 ${errors.address ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`} 
                                                placeholder="Full address…" 
                                            />
                                            {errors.address && (
                                                <p className="text-[11px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {errors.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Architecture */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-black tracking-tight text-foreground">Architectural Scope</h2>
                                    <p className="text-muted-foreground text-sm font-medium mt-1">Define the physical parameters and capacity.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-8 space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Home className="size-4 text-primary" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Asset Class</h3>
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
                                                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${formData.propertyType === opt.id ? "bg-primary/10 border-primary/50 shadow-sm" : "neumorphic-inset-card border-border/40 hover:border-border"}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-2.5 rounded-full ${formData.propertyType === opt.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" : "bg-border"}`} />
                                                        <div>
                                                            <p className={`text-sm font-black tracking-tight ${formData.propertyType === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{opt.desc}</p>
                                                        </div>
                                                    </div>
                                                    {formData.propertyType === opt.id && <CheckCircle2 className="size-5 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-8 space-y-8">
                                        <div className="flex items-center gap-2">
                                            <Grid className="size-4 text-primary" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Structural Specs</h3>
                                        </div>
                                        <div className="grid gap-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Units</label>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={formData.totalUnits}
                                                        onChange={(e) => handleInputChange("totalUnits", e.target.value)}
                                                        className={`w-full neumorphic-inset rounded-2xl px-6 py-4 text-sm font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${errors.totalUnits ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`}
                                                    />
                                                    {errors.totalUnits && (
                                                        <p className="text-[10px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in duration-200">{errors.totalUnits}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Floors</label>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={formData.floorCount}
                                                        onChange={(e) => handleInputChange("floorCount", e.target.value)}
                                                        className={`w-full neumorphic-inset rounded-2xl px-6 py-4 text-sm font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${errors.floorCount ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`}
                                                    />
                                                    {errors.floorCount && (
                                                        <p className="text-[10px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in duration-200">{errors.floorCount}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Max Occupants per Unit</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={formData.occupancyLimit}
                                                    onChange={(e) => handleInputChange("occupancyLimit", e.target.value)}
                                                    className={`w-full neumorphic-inset rounded-2xl px-6 py-4 text-sm font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${errors.occupancyLimit ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`}
                                                />
                                                {errors.occupancyLimit && (
                                                    <p className="text-[10px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in duration-200">{errors.occupancyLimit}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Unit Identification & Numbering */}
                                    <div className="col-span-1 md:col-span-2 neumorphic-panel border border-border/60 rounded-[2rem] p-8 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Hash className="size-4 text-primary" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Unit Identification & Numbering</h3>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                                Customizable
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Prefix Selector */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Unit Prefix / Label</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Unit", "Room", "Studio", "Apt", "Suite", "Villa", "Bed"].map((preset) => (
                                                        <button
                                                            key={preset}
                                                            type="button"
                                                            onClick={() => handleInputChange("unitPrefix", preset)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                                formData.unitPrefix === preset
                                                                    ? "bg-primary text-black shadow-sm"
                                                                    : "neumorphic-inset-card text-muted-foreground hover:text-foreground"
                                                            }`}
                                                        >
                                                            {preset}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.unitPrefix}
                                                    onChange={(e) => handleInputChange("unitPrefix", e.target.value)}
                                                    placeholder="Or type custom prefix (e.g. Tower A-)"
                                                    className={`w-full neumorphic-inset rounded-2xl px-5 py-3 text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60 ${errors.unitPrefix ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`}
                                                />
                                                {errors.unitPrefix && (
                                                    <p className="text-[10px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in duration-200">{errors.unitPrefix}</p>
                                                )}
                                            </div>

                                            {/* Numbering Scheme */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Numbering Scheme</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("numberingStyle", "floor_based")}
                                                        className={`p-3 rounded-2xl border text-left transition-all ${
                                                            formData.numberingStyle === "floor_based"
                                                                ? "bg-primary/10 border-primary/50 text-foreground"
                                                                : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        <p className="text-xs font-black">Floor-Based</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">101, 102 / 201, 202</p>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("numberingStyle", "sequential")}
                                                        className={`p-3 rounded-2xl border text-left transition-all ${
                                                            formData.numberingStyle === "sequential"
                                                                ? "bg-primary/10 border-primary/50 text-foreground"
                                                                : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        <p className="text-xs font-black">Sequential</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">1, 2, 3... or from 101</p>
                                                    </button>
                                                </div>

                                                {formData.numberingStyle === "sequential" && (
                                                    <div className="pt-1">
                                                        <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">Starting Number</label>
                                                        <input
                                                            type="number"
                                                            value={formData.startingNumber}
                                                            onChange={(e) => handleInputChange("startingNumber", parseInt(e.target.value) || 1)}
                                                            className="w-full neumorphic-inset rounded-2xl px-5 py-2.5 text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dynamic Live Preview */}
                                        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <Eye className="size-3.5 text-primary" />
                                                <span>Live Preview of Generated Units:</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {generateUnitList(
                                                    Math.min(6, parseInt(formData.totalUnits) || 4),
                                                    parseInt(formData.floorCount) || 2,
                                                    {
                                                        prefix: formData.unitPrefix,
                                                        numberingStyle: formData.numberingStyle,
                                                        startingNumber: formData.startingNumber,
                                                    }
                                                ).map((item, idx) => (
                                                    <span key={idx} className="rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-[10px] font-black text-primary">
                                                        {item.name}
                                                    </span>
                                                ))}
                                                {(parseInt(formData.totalUnits) || 1) > 6 && (
                                                    <span className="text-[10px] font-bold text-muted-foreground">
                                                        +{(parseInt(formData.totalUnits) || 1) - 6} more
                                                    </span>
                                                )}
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
                                    <h2 className="text-3xl font-black tracking-tight text-foreground">Financial Strategy</h2>
                                    <p className="text-muted-foreground text-sm font-medium mt-1">Configure billing logic and amenities.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">                                     
                                    <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="size-4 text-primary" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Billing Strategy</h3>
                                        </div>

                                        <div className="grid gap-6">
                                            <div className="grid gap-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Utility Management</label>
                                                <div className="grid gap-2">
                                                    {[
                                                        { id: "fixed_charge", label: "Bundled Utilities", desc: "All-inclusive monthly rate" },
                                                        { id: "individual_meter", label: "Metered Consumption", desc: "Pay-per-use direct billing" },
                                                        { id: "equal_per_head", label: "Hybrid Strategy", desc: "Fixed base + usage overhead" },
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => handleInputChange("utilityBilling", opt.id)}
                                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left ${formData.utilityBilling === opt.id ? "bg-primary/10 border-primary/50 shadow-sm" : "neumorphic-inset-card border-border/40 hover:border-border"}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`size-2.5 rounded-full ${formData.utilityBilling === opt.id ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" : "bg-border"}`} />
                                                                <div>
                                                                    <p className={`text-sm font-black tracking-tight ${formData.utilityBilling === opt.id ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{opt.desc}</p>
                                                                </div>
                                                            </div>
                                                            {formData.utilityBilling === opt.id && <CheckCircle2 className="size-5 text-primary" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Standard Base Rent (PHP)</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-xl font-black text-primary/60 group-focus-within:text-primary transition-colors">₱</div>
                                                    <input 
                                                        type="text" 
                                                        value={formData.baseRent === 0 ? "" : formData.baseRent.toLocaleString('en-US')}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/,/g, "");
                                                            const num = parseInt(val) || 0;
                                                            handleInputChange("baseRent", num);
                                                        }}
                                                        placeholder="0.00"
                                                        className={`w-full neumorphic-inset rounded-2xl pl-12 pr-6 py-5 text-2xl font-black text-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/40 ${errors.baseRent ? "!border-rose-500 !ring-2 !ring-rose-500/20" : ""}`}
                                                    />
                                                </div>
                                                {errors.baseRent && (
                                                    <p className="text-[11px] font-bold text-rose-500 px-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {errors.baseRent}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-7 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="size-4 text-primary" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Amenities</h3>
                                            </div>
                                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{formData.amenities.length} Selected</span>
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
                                                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center ${formData.amenities.includes(amenity) ? "bg-primary text-black border-primary shadow-md shadow-primary/20" : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`}
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
                                    <h2 className="text-3xl font-black tracking-tight text-foreground">Rules & Governance</h2>
                                    <p className="text-muted-foreground text-sm font-medium mt-1">Define property conduct and validate configuration.</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Building Rules - Spans 12 columns */}
                                    <div className="lg:col-span-12">
                                        <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-7 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="size-4 text-primary" />
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Building Rules & Conduct</h3>
                                                </div>
                                                <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">{formData.buildingRules.length} Defined</span>
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
                                                        className="flex-1 neumorphic-inset rounded-xl p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50 outline-none"
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            if (customAmenity.trim()) {
                                                                handleInputChange("buildingRules", [...formData.buildingRules, customAmenity.trim()]);
                                                                setCustomAmenity("");
                                                            }
                                                        }}
                                                        className="px-6 py-2 bg-primary text-black rounded-xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                                                    >
                                                        Add Rule
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-3">
                                                    {formData.buildingRules.map((rule, index) => (
                                                        <div 
                                                            key={rule}
                                                            className="flex items-center gap-3 neumorphic-inset-card border border-border/60 rounded-xl px-4 py-2 group hover:border-primary/40 transition-all"
                                                        >
                                                            <span className="text-xs font-black text-foreground">{rule}</span>
                                                            <button 
                                                                onClick={() => handleInputChange("buildingRules", formData.buildingRules.filter((_, i) => i !== index))}
                                                                className="text-muted-foreground/60 hover:text-rose-500 transition-colors"
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
                                        <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-7 space-y-6">
                                            <div className="flex items-center gap-2">
                                                <FileText className="size-4 text-primary" />
                                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Final Validation</h3>
                                            </div>
                                            
                                            <div 
                                                onClick={() => {
                                                    if (formData.contractMode === "generate") {
                                                        setIsContractBuilderOpen(true);
                                                    } else {
                                                        document.getElementById('contract-upload-input')?.click();
                                                    }
                                                }}
                                                className={`relative group cursor-pointer aspect-[16/11] rounded-[2rem] border neumorphic-inset overflow-hidden shadow-xl flex flex-col items-center justify-center gap-3 transition-all hover:border-primary/50 ${errors.contractFile ? "!border-rose-500 !ring-2 !ring-rose-500/20" : "border-border/60"}`}
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
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-foreground/5 pointer-events-none" />
                                                
                                                {formData.contractMode === "generate" ? (
                                                    <>
                                                        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                                            <FileText className="size-8 text-primary" />
                                                        </div>
                                                        <div className="text-center px-4 relative z-10">
                                                            <span className="block text-xs font-black text-foreground uppercase tracking-widest mb-1">Contract Preview</span>
                                                            <span className="block text-[8px] text-muted-foreground uppercase tracking-widest font-black">
                                                                Draft Synchronized
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className={`size-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 duration-500 ${formData.contractFile ? "bg-primary/20 border-primary/40" : "neumorphic-panel border-border/60"}`}>
                                                            {formData.contractFile ? <CheckCircle2 className="size-8 text-primary" /> : <Upload className="size-8 text-muted-foreground" />}
                                                        </div>
                                                        <div className="text-center px-4">
                                                            <span className={`block text-xs font-black uppercase tracking-widest ${formData.contractFile ? "text-primary" : "text-muted-foreground"}`}>
                                                                {formData.contractFile ? "Upload Complete" : "Click to Upload"}
                                                            </span>
                                                            {formData.contractFile && <span className="block text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1 truncate max-w-[150px] mx-auto">{formData.contractFile}</span>}
                                                        </div>
                                                    </>
                                                )}

                                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                                    <div className="bg-foreground text-background px-5 py-2.5 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                                                        {formData.contractMode === "generate" ? <ShieldCheck className="size-4" /> : <Upload className="size-4" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                                            {formData.contractMode === "generate" ? "View Generated Draft" : (formData.contractFile ? "Change Document" : "Upload File")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {errors.contractFile && (
                                                <p className="text-[11px] font-bold text-rose-500 px-1 mt-1 text-center animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {errors.contractFile}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lease Management Method - Span 7 */}
                                    <div className="lg:col-span-7">
                                        <div className="neumorphic-panel border border-border/60 rounded-[2rem] p-7 space-y-6 h-full flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FilePlus className="size-4 text-primary" />
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Lease Management Method</h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 border border-primary/20 rounded-lg">
                                                    <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">Global Preference</span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid gap-5 flex-1">
                                                <div className="flex neumorphic-inset p-1.5 rounded-2xl border border-border/50">
                                                    {[
                                                        { id: "generate", label: "Auto-Generate Digital Lease" },
                                                        { id: "upload", label: "Upload Proprietary Document" }
                                                    ].map((mode) => (
                                                        <button 
                                                            key={mode.id}
                                                            onClick={() => handleInputChange("contractMode", mode.id as any)}
                                                            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.contractMode === mode.id ? "bg-primary text-black shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                                                        >
                                                            {mode.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="neumorphic-inset-card rounded-2xl p-6 border border-border/50 flex-1 flex flex-col items-center justify-center text-center space-y-3">
                                                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        {formData.contractMode === "generate" ? <ShieldCheck className="size-6 text-primary" /> : <Upload className="size-6 text-muted-foreground" />}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed max-w-xs">
                                                        {formData.contractMode === "generate" 
                                                            ? "Automatically bind your asset configuration into a legally-compliant digital agreement powered by iReside Smart Draft." 
                                                            : "Securely host and link your existing physical or PDF-based lease documentation to this property profile."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-10 border-t border-border/60 bg-muted/20 flex items-center justify-between">
                        <button onClick={handleBack} disabled={isSubmitting} className={cn("flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all font-black uppercase text-[11px]", step === 1 ? "opacity-0 pointer-events-none" : "")}>
                            <ArrowLeft className="size-4" /><span>Back</span>
                        </button>
                        <button 
                            onClick={handleNext} 
                            disabled={isSubmitting} 
                            className="px-10 py-5 bg-primary text-black rounded-2xl font-black uppercase text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    <span>{saveStage || "Saving..."}</span>
                                </>
                            ) : step === 4 ? (
                                <span>{isEditMode ? "Save Changes" : "Save Property"}</span>
                            ) : (
                                <span>Continue</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Save Action Bar (visible on steps 1, 2, and 3; disappears on step 4) */}
            <AnimatePresence>
                {step < 4 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[92vw]"
                    >
                        <div className="neumorphic-panel bg-card/95 backdrop-blur-xl border border-border/80 rounded-full py-2.5 px-4 sm:px-6 shadow-2xl flex items-center gap-3 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "size-2.5 rounded-full animate-pulse",
                                    mediaFiles.length > 0 ? "bg-amber-400" : "bg-primary"
                                )} />
                                <span className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-[140px] sm:max-w-none">
                                    {mediaFiles.length > 0 
                                        ? "New cover photo staged" 
                                        : isEditMode 
                                            ? `Editing: ${formData.propertyName || "Asset"}` 
                                            : `Step ${step} of 4: ${STEPS[step - 1]?.label}`}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="neumorphic-primary flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>{saveStage || "Saving..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
        <ClickSpark sparkColor="hsl(var(--primary))" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                <NewAssetContent />
            </Suspense>
        </ClickSpark>
    );
}

