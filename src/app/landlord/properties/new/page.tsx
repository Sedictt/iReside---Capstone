"use client";

import Image from 'next/image';
import { useState, useEffect, useMemo, Suspense, type ChangeEvent } from "react";
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
    FilePlus,
    Hash,
    Eye,
    Save,
    Loader2,
    HelpCircle,
    MapPin
} from "lucide-react";
import { PropertyAmenitiesSelector } from "@/components/landlord/properties/PropertyAmenitiesSelector";
import { PropertyRulesSelector } from "@/components/landlord/properties/PropertyRulesSelector";
import { m as motion, AnimatePresence } from "framer-motion";
import { generateUnitList } from "@/lib/unit-naming";
import { cn } from "@/lib/utils";
import { SmartContractPreviewModal } from "@/components/landlord/properties/SmartContractPreviewModal";
import { BillingStrategyModal } from "@/components/landlord/properties/BillingStrategyModal";
import { AssetClassModal } from "@/components/landlord/properties/AssetClassModal";
import ClickSpark from "@/components/ui/ClickSpark";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/context/PropertyContext";
import { playSound } from "@/hooks/useSound";
import { useAppToast } from "@/hooks/useAppToast";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { useFormValidation } from "@/hooks/useFormValidation";
import { textRule } from "@/lib/validation/rules";
import {
    baseRentRule,
    occupancyLimitRule,
    propertyAddressRule,
    propertyNameRule,
    totalFloorsRule,
    totalUnitsRule,
    unitPrefixRule,
} from "@/lib/validation/schemas/properties.schema";
import { 
    VALENZUELA_BARANGAYS, 
    formatValenzuelaAddress, 
    parseValenzuelaAddress 
} from "@/lib/constants/valenzuela-address";

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
/** Matches the 8 MB per-image limit enforced by /api/landlord/properties/media. */
const MAX_PROPERTY_IMAGE_BYTES = 8 * 1024 * 1024;
const MANUAL_ADDRESS_MAX = 120;
const STREET_MAX = 100;

type WizardField = "propertyName" | "address" | "totalUnits" | "floorCount" | "occupancyLimit" | "unitPrefix" | "baseRent" | "contractFile";

const STEP_FIELDS: Record<Step, WizardField[]> = {
    1: ["propertyName", "address"],
    2: ["totalUnits", "floorCount", "occupancyLimit", "unitPrefix"],
    3: ["baseRent"],
    4: ["contractFile"],
};

/** API field names → wizard field names, so server `fieldErrors` land on the right input. */
const SERVER_FIELD_MAP: Record<string, WizardField> = {
    name: "propertyName",
    address: "address",
    total_units: "totalUnits",
    total_floors: "floorCount",
    occupancy_limit: "occupancyLimit",
    unit_prefix: "unitPrefix",
    base_rent_amount: "baseRent",
    contract_file: "contractFile",
};
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
    const { properties, refreshProperties, setSelectedPropertyId } = useProperty();
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
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
    const [coverExistingUrl, setCoverExistingUrl] = useState<string | null>(null);
    const [coverNewIndex, setCoverNewIndex] = useState<number | null>(null);
    const [billingGuideOpen, setBillingGuideOpen] = useState(false);
    const [billingGuideInitialTab, setBillingGuideInitialTab] = useState<string>("fixed_charge");
    const [assetClassGuideOpen, setAssetClassGuideOpen] = useState(false);
    const [assetClassGuideInitialTab, setAssetClassGuideInitialTab] = useState<string>("apartment");
    
    const [isManualAddress, setIsManualAddress] = useState(false);
    const [addressCity, setAddressCity] = useState("Valenzuela City");
    const [addressBarangay, setAddressBarangay] = useState("Karuhatan");
    const [addressStreet, setAddressStreet] = useState("");
    const [isCustomPrefix, setIsCustomPrefix] = useState(false);

    const activeBarangay = VALENZUELA_BARANGAYS.find(b => b.name === addressBarangay) || VALENZUELA_BARANGAYS[0];

    const handleStructuredAddressChange = (newStreet: string, newBarangay: string, newCity: string) => {
        const clampedStreet = newStreet.slice(0, 100);
        setAddressStreet(clampedStreet);
        setAddressBarangay(newBarangay);
        setAddressCity(newCity);
        const selectedB = VALENZUELA_BARANGAYS.find(b => b.name === newBarangay) || activeBarangay;
        const full = clampedStreet.trim()
            ? formatValenzuelaAddress(clampedStreet, newBarangay, newCity, selectedB?.zipCode)
            : "";
        handleInputChange("address", full);
    };

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

    // Inline validation: same rules as POST/PUT /api/landlord/properties.
    const validationValues = useMemo(
        () => ({
            propertyName: formData.propertyName,
            address: isManualAddress ? formData.address : addressStreet,
            totalUnits: formData.totalUnits,
            floorCount: formData.floorCount,
            occupancyLimit: formData.occupancyLimit,
            unitPrefix: formData.unitPrefix,
            baseRent: formData.baseRent,
            contractFile: formData.contractFile,
            contractMode: formData.contractMode,
            isManualAddress,
            fullAddress: formData.address,
        }),
        [formData, isManualAddress, addressStreet]
    );
    const form = useFormValidation(validationValues, {
        propertyName: (v) => propertyNameRule(v),
        address: (v, all) => {
            if (all.isManualAddress) return propertyAddressRule(v, MANUAL_ADDRESS_MAX);
            if (!String(v ?? "").trim()) return "Please enter your house/building number and street name.";
            return textRule(v, { label: "Street address", max: STREET_MAX }) ?? propertyAddressRule(all.fullAddress);
        },
        totalUnits: (v) => totalUnitsRule(v),
        floorCount: (v) => totalFloorsRule(v),
        occupancyLimit: (v) => occupancyLimitRule(v),
        unitPrefix: (v) => (String(v ?? "").trim() ? unitPrefixRule(v) : "Please choose or type a room label (e.g. Room or Unit)."),
        baseRent: (v) => (!v ? "Please enter the standard monthly rent amount (greater than ₱0)." : baseRentRule(v)),
        contractFile: (v, all) =>
            all.contractMode === "upload" && !v
                ? "Please choose a lease contract file to upload or select Standard Digital Lease."
                : undefined,
    });
    const errors: Partial<Record<WizardField, string>> = {
        propertyName: form.errorFor("propertyName"),
        address: form.errorFor("address"),
        totalUnits: form.errorFor("totalUnits"),
        floorCount: form.errorFor("floorCount"),
        occupancyLimit: form.errorFor("occupancyLimit"),
        unitPrefix: form.errorFor("unitPrefix"),
        baseRent: form.errorFor("baseRent"),
        contractFile: form.errorFor("contractFile"),
    };

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

                const loadedPrefix = p.unit_prefix || (p.type === "dormitory" || p.type === "boarding_house" ? "Room" : "Unit");
                if (p.unit_prefix && !["Room", "Unit", "Studio", "Door", "Bed"].includes(p.unit_prefix)) {
                    setIsCustomPrefix(true);
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
                    unitPrefix: loadedPrefix,
                    numberingStyle: "floor_based",
                    startingNumber: 101,
                });

                const parsedAddr = parseValenzuelaAddress(p.address || "");
                if (parsedAddr.isValenzuela && parsedAddr.barangay) {
                    setAddressCity(parsedAddr.city || "Valenzuela City");
                    setAddressBarangay(parsedAddr.barangay);
                    setAddressStreet(parsedAddr.street);
                    setIsManualAddress(false);
                } else if (p.address) {
                    setIsManualAddress(true);
                    setAddressStreet(p.address);
                }

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
        // Inline errors are derived from the values, so they clear as soon as the input becomes valid.
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMediaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = handleMediaSelection(e, {
            preset: "image",
            maxSizeBytes: MAX_PROPERTY_IMAGE_BYTES,
            notify: (msg, desc) => toast.error(desc ? `${msg}: ${desc}` : msg),
        });
        if (!selectedFile) return;
        setMediaFiles([selectedFile]);
        setCoverNewIndex(0);
        toast.info("New cover photo selected! Click 'Save Changes' to update.");
    };

    const validateStep = (currentStep: Step): boolean => {
        const fields = STEP_FIELDS[currentStep];
        if (form.validateFields(fields)) return true;
        // Reveal + focus happen inline; the toast keeps the existing summary feedback.
        const firstError = fields.map((field) => form.errors[field]).find(Boolean);
        if (firstError) toast.error(firstError);
        return false;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        if (step < 4) setStep(s => (s + 1) as Step);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(s => (s - 1) as Step);
        } else if (properties.length === 0) {
            toast.info("Please set up your first property to access your dashboard.");
        } else {
            router.push("/landlord/properties");
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return; // double-click guard
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

            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                const serverFieldErrors: Record<string, string> = {};
                for (const [key, message] of Object.entries((result.fieldErrors ?? {}) as Record<string, string>)) {
                    const field = SERVER_FIELD_MAP[key.split(".")[0]];
                    if (field && !serverFieldErrors[field]) serverFieldErrors[field] = message;
                }
                if (Object.keys(serverFieldErrors).length > 0) {
                    const firstStep = ([1, 2, 3, 4] as Step[]).find((s) =>
                        STEP_FIELDS[s].some((field) => serverFieldErrors[field])
                    );
                    if (firstStep) setStep(firstStep);
                    form.setServerErrors(serverFieldErrors);
                }
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

            await refreshProperties();
            router.refresh();

            if (!isEditMode && result.propertyId) {
                if (typeof window !== "undefined") {
                    try {
                        window.sessionStorage.setItem(`ireside.unit_map_guidance_in_progress.${result.propertyId}`, "true");
                        window.dispatchEvent(new Event("unit-map-guidance-changed"));
                    } catch {}
                }
                setSelectedPropertyId(result.propertyId);
                toast.success("Property registered! Next, configure your unit map to place your units.");
                router.push(`/landlord/unit-map?propertyId=${result.propertyId}`);
            } else {
                toast.success(isEditMode ? "Property updated successfully!" : "Property created successfully!");
                router.push("/landlord/properties");
            }
        } catch (e) {
            console.error("Save error:", e);
            toast.error(e instanceof Error ? e.message : "Failed to save property. Please try again.");
        } finally {
            setIsSubmitting(false);
            setSaveStage(null);
        }
    };

    const STEPS = [
        { id: 1, label: "Basics", shortTitle: "Property Info", icon: Building2 },
        { id: 2, label: "Rooms & Floors", shortTitle: "Rooms & Floors", icon: Grid },
        { id: 3, label: "Rent & Bills", shortTitle: "Rent & Bills", icon: Wallet },
        { id: 4, label: "Rules & Lease", shortTitle: "Rules & Lease", icon: ShieldCheck }
    ];

    return (
        <div className="min-h-screen pb-24 relative selection:bg-primary/30">
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] size-[50rem] rounded-full bg-primary/10 blur-[150px] opacity-50" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4 space-y-3 sm:space-y-4 animate-in fade-in duration-500">
                {/* Top Navigation Bar */}
                <div className="flex items-center justify-between gap-4">
                    {properties.length > 0 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all bg-card/90 hover:bg-card px-3.5 py-1.5 rounded-full border border-border/80 shadow-xs cursor-pointer"
                        >
                            <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>{step === 1 ? "Cancel" : "Back"}</span>
                        </button>
                    ) : step > 1 ? (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-all bg-card/90 hover:bg-card px-3.5 py-1.5 rounded-full border border-border/80 shadow-xs cursor-pointer"
                        >
                            <ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/25">
                            <span>First-Time Property Setup</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 bg-card/90 px-3.5 py-1.5 rounded-full border border-border/80 shadow-xs text-xs font-bold text-foreground">
                        <span className="size-2 rounded-full bg-primary animate-pulse" />
                        <span>{isEditMode ? "Edit Property" : "New Property Setup"}</span>
                    </div>
                </div>

                {/* Main Card Container */}
                <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                    {/* Header with Title and Stepper */}
                    <div className="px-6 py-3.5 sm:px-8 sm:py-4 border-b border-border/70 bg-muted/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary mb-1">
                                    <span>Step {step} of 4</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span>{STEPS[step - 1].shortTitle}</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                                    {isEditMode ? "Edit Property" : "Add New Property"}
                                </h1>
                            </div>

                            {/* Stepper Progress Indicator */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                {STEPS.map((s, idx) => (
                                    <div key={s.id} className="flex items-center">
                                        <div className="flex flex-col items-center gap-0.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (s.id < step) setStep(s.id as Step);
                                                }}
                                                disabled={s.id > step}
                                                className={cn(
                                                    "size-8 sm:size-9 rounded-xl flex items-center justify-center transition-all font-bold text-xs",
                                                    step === s.id
                                                        ? "bg-primary text-black shadow-xs ring-3 ring-primary/20 scale-105"
                                                        : step > s.id
                                                            ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 cursor-pointer"
                                                            : "bg-muted/50 text-muted-foreground/50 border border-border/40 cursor-not-allowed"
                                                )}
                                                aria-label={`Step ${s.id}: ${s.label}`}
                                            >
                                                {step > s.id ? (
                                                    <Check className="size-3.5 text-primary stroke-[3]" />
                                                ) : (
                                                    <span>{s.id}</span>
                                                )}
                                            </button>
                                            <span className={cn(
                                                "text-[10px] sm:text-[11px] font-semibold whitespace-nowrap text-center transition-colors",
                                                step === s.id ? "text-primary font-bold" : step > s.id ? "text-foreground" : "text-muted-foreground/60"
                                            )}>
                                                {s.label}
                                            </span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <div className={cn(
                                                "w-3 sm:w-5 h-0.5 mx-1 -mt-3 transition-colors",
                                                step > s.id ? "bg-primary/50" : "bg-border/60"
                                            )} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content Area */}
                    <div className="p-5 sm:p-6 lg:p-7 min-h-[350px]">
                        {/* 1. Basics */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Property Details</h2>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                        Enter your property name and address so tenants know where they are moving in.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-1">
                                    {/* Left column: Name and Address (7 cols) */}
                                    <div className="lg:col-span-7 space-y-3.5">
                                        {/* Property Name */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="property-name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <span>Property Name</span>
                                                    <span className="text-rose-500 font-bold">*</span>
                                                </label>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {formData.propertyName.length}/60
                                                </span>
                                            </div>
                                            <input
                                                {...form.fieldProps("propertyName")}
                                                id="property-name"
                                                type="text"
                                                maxLength={60}
                                                value={formData.propertyName} 
                                                onInput={(e) => {
                                                    if (e.currentTarget.value.length > 60) {
                                                        e.currentTarget.value = e.currentTarget.value.slice(0, 60);
                                                    }
                                                }}
                                                onChange={e => handleInputChange("propertyName", e.target.value.slice(0, 60))} 
                                                className={cn(
                                                    "w-full bg-background border-2 border-border/80 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                    errors.propertyName && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                                                )}
                                                placeholder="e.g. Sunrise Apartments or Villa Teresa" 
                                            />
                                            {errors.propertyName ? (
                                                <p id={form.errorId("propertyName")} role="alert" className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                                                    {errors.propertyName}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground">
                                                    The name your tenants will see for this building. Max 60 characters.
                                                </p>
                                            )}
                                        </div>

                                        {/* Property Address */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 text-primary" />
                                                    <span>Complete Address</span>
                                                    <span className="text-rose-500 font-bold">*</span>
                                                </label>
                                                {!isManualAddress ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsManualAddress(true)}
                                                        className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        Outside Valenzuela? Click here
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsManualAddress(false);
                                                            const full = addressStreet.trim()
                                                                ? formatValenzuelaAddress(addressStreet, addressBarangay, addressCity, activeBarangay?.zipCode)
                                                                : "";
                                                            handleInputChange("address", full);
                                                        }}
                                                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                                    >
                                                        ← Valenzuela Address Helper
                                                    </button>
                                                )}
                                            </div>

                                            {!isManualAddress ? (
                                                <div className="space-y-2">
                                                    {/* City & Barangay Dropdowns */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                        {/* City */}
                                                        <div className="space-y-1 sm:col-span-1">
                                                            <label htmlFor="address-city" className="text-[11px] font-semibold text-muted-foreground">City</label>
                                                            <select
                                                                id="address-city"
                                                                value={addressCity}
                                                                onChange={(e) => {
                                                                    if (e.target.value === "other") {
                                                                        setIsManualAddress(true);
                                                                    } else {
                                                                        handleStructuredAddressChange(addressStreet, addressBarangay, e.target.value);
                                                                    }
                                                                }}
                                                                className="w-full bg-background border-2 border-border/80 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                                                            >
                                                                <option value="Valenzuela City">Valenzuela City</option>
                                                                <option value="other">Other (Manual)</option>
                                                            </select>
                                                        </div>

                                                        {/* Barangay (takes 2 columns for generous room) */}
                                                        <div className="space-y-1 sm:col-span-2">
                                                            <label htmlFor="address-barangay" className="text-[11px] font-semibold text-muted-foreground">Barangay</label>
                                                            <select
                                                                id="address-barangay"
                                                                value={addressBarangay}
                                                                onChange={(e) => handleStructuredAddressChange(addressStreet, e.target.value, addressCity)}
                                                                className="w-full bg-background border-2 border-border/80 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer truncate"
                                                            >
                                                                <optgroup label="District 1 (Polo / North)">
                                                                    {VALENZUELA_BARANGAYS.filter(b => b.district === 1).map(b => (
                                                                        <option key={b.name} value={b.name}>
                                                                            {b.name} (ZIP {b.zipCode})
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="District 2 (Central / East)">
                                                                    {VALENZUELA_BARANGAYS.filter(b => b.district === 2).map(b => (
                                                                        <option key={b.name} value={b.name}>
                                                                            {b.name} (ZIP {b.zipCode})
                                                                        </option>
                                                                    ))}
                                                                </optgroup>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Street Number & Name */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <label htmlFor="address-street" className="text-[11px] font-semibold text-muted-foreground">
                                                                House / Building No. & Street Name <span className="text-rose-500">*</span>
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                {activeBarangay?.popularStreets && activeBarangay.popularStreets.length > 0 && (
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        Suggestions available
                                                                    </span>
                                                                )}
                                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                                    {addressStreet.length}/100
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <input
                                                            {...form.fieldProps("address")}
                                                            id="address-street"
                                                            type="text"
                                                            list="valenzuela-popular-streets"
                                                            maxLength={100}
                                                            value={addressStreet}
                                                            onInput={(e) => {
                                                                if (e.currentTarget.value.length > 100) {
                                                                    e.currentTarget.value = e.currentTarget.value.slice(0, 100);
                                                                }
                                                            }}
                                                            onChange={(e) => handleStructuredAddressChange(e.target.value.slice(0, 100), addressBarangay, addressCity)}
                                                            placeholder="e.g. 123 MacArthur Highway or Block 4 Lot 12"
                                                            className={cn(
                                                                "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                                errors.address && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                                                            )}
                                                        />
                                                        <datalist id="valenzuela-popular-streets">
                                                            {activeBarangay?.popularStreets?.map((st) => (
                                                                <option key={st} value={st} />
                                                            ))}
                                                        </datalist>

                                                        {errors.address && (
                                                            <p id={form.errorId("address")} role="alert" className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                                                                {errors.address}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Manual Textarea Mode */
                                                <div className="space-y-1">
                                                    <textarea
                                                        {...form.fieldProps("address")}
                                                        id="property-address"
                                                        rows={2}
                                                        maxLength={MANUAL_ADDRESS_MAX}
                                                        value={formData.address} 
                                                        onChange={e => handleInputChange("address", e.target.value)} 
                                                        className={cn(
                                                            "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground outline-none resize-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                            errors.address && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                                                        )}
                                                        placeholder="e.g. 123 Rizal Street, Barangay Poblacion, Meycauayan, Bulacan" 
                                                    />
                                                    {errors.address && (
                                                        <p id={form.errorId("address")} role="alert" className="text-xs font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                                                            {errors.address}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center justify-end">
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {formData.address?.length || 0} / 120
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right column: Optional Cover Photo (5 cols) */}
                                    <div className="lg:col-span-5 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Camera className="size-3.5 text-primary" />
                                                <label className="text-xs font-bold text-foreground">Building Photo</label>
                                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                                                    Optional
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                                                    Max 10MB
                                                </span>
                                                {mediaFiles.length > 0 && (
                                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-border/80 hover:border-primary/60 transition-colors h-[160px] sm:h-[180px] bg-muted/10 flex flex-col items-center justify-center">
                                            {(mediaPreviewUrls.length > 0 || existingImageUrls.length > 0) ? (
                                                <>
                                                    <Image 
                                                        src={mediaPreviewUrls[0] || existingImageUrls[0]} 
                                                        alt="Property Cover" 
                                                        fill 
                                                        className="object-cover" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                                                        <label 
                                                            htmlFor="cover-identity"
                                                            className="bg-card text-foreground px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-card/90"
                                                        >
                                                            <Camera className="size-3.5 text-primary" />
                                                            <span>Change Photo</span>
                                                        </label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label 
                                                    htmlFor="cover-identity"
                                                    className="flex flex-col items-center justify-center gap-2 p-3 text-center cursor-pointer w-full h-full hover:bg-muted/20 transition-colors"
                                                >
                                                    <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                                        <Upload className="size-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-foreground block">Choose a Photo</span>
                                                        <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                                            JPG, PNG, or WebP (Max 10MB)
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                                                            skip and add later
                                                        </span>
                                                    </div>
                                                </label>
                                            )}
                                            <input 
                                                id="cover-identity" 
                                                type="file" 
                                                accept={MEDIA_ACCEPT_STRINGS.image} 
                                                onChange={handleMediaFileChange} 
                                                className="sr-only" 
                                            />
                                        </div>

                                        {(mediaPreviewUrls.length > 0 || existingImageUrls.length > 0) && (
                                            <div className="flex items-center justify-between pt-0.5">
                                                <label 
                                                    htmlFor="cover-identity"
                                                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                                                >
                                                    <Camera className="size-3" />
                                                    <span>Change</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMediaFiles([]);
                                                        setMediaPreviewUrls([]);
                                                        setExistingImageUrls([]);
                                                        setCoverExistingUrl(null);
                                                    }}
                                                    className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <X className="size-3" />
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Rooms & Floors */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Rooms & Floors</h2>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                        Choose your property type and enter how many rooms and floors your building has.
                                    </p>
                                </div>

                                {/* Property Type Selector - 3 horizontal cards */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Home className="size-3.5 text-primary" />
                                            <span>Property Type</span>
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAssetClassGuideInitialTab(formData.propertyType || "apartment");
                                                setAssetClassGuideOpen(true);
                                            }}
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <HelpCircle className="size-3.5" />
                                            <span>Type Guide</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {[
                                            { 
                                                id: "apartment", 
                                                label: "Apartment", 
                                                desc: "Private units with kitchen & bath" 
                                            },
                                            { 
                                                id: "dormitory", 
                                                label: "Dormitory", 
                                                desc: "Shared rooms or bedspaces" 
                                            },
                                            { 
                                                id: "boarding_house", 
                                                label: "Boarding House", 
                                                desc: "Private rooms in shared home" 
                                            },
                                        ].map((opt) => {
                                            const isSelected = formData.propertyType === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => handleInputChange("propertyType", opt.id)}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 transition-all text-left cursor-pointer flex flex-col justify-between",
                                                        isSelected
                                                            ? "bg-primary/10 border-primary shadow-xs"
                                                            : "bg-background border-border/80 hover:border-border"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between w-full mb-1">
                                                        <span className={cn("text-xs sm:text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>
                                                            {opt.label}
                                                        </span>
                                                        <div className={cn(
                                                            "size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                            isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                                        )}>
                                                            {isSelected && <div className="size-1.5 rounded-full bg-black" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                                        {opt.desc}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Building Size & Room Naming side by side */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start pt-2 border-t border-border/60">
                                    {/* Left: Building Size & Capacity (6 cols) */}
                                    <div className="lg:col-span-6 space-y-3">
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Grid className="size-3.5 text-primary" />
                                            <span>Building Size & Capacity</span>
                                        </h3>

                                        <div className="space-y-2.5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-foreground">
                                                        Total Units / Rooms <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input 
                                                        {...form.fieldProps("totalUnits")}
                                                        type="number" 
                                                        min="1"
                                                        max="99"
                                                        step="1"
                                                        inputMode="numeric"
                                                        maxLength={2}
                                                        value={formData.totalUnits}
                                                        onKeyDown={(e) => {
                                                            if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                                        }}
                                                        onInput={(e) => {
                                                            if (e.currentTarget.value.length > 2) {
                                                                e.currentTarget.value = e.currentTarget.value.slice(0, 2);
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                                            handleInputChange("totalUnits", raw);
                                                        }}
                                                        onBlur={() => {
                                                            form.touch("totalUnits");
                                                            if (!formData.totalUnits || parseInt(formData.totalUnits, 10) < 1) {
                                                                handleInputChange("totalUnits", "1");
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                            errors.totalUnits && "border-rose-500"
                                                        )}
                                                    />
                                                    {errors.totalUnits && (
                                                        <p id={form.errorId("totalUnits")} role="alert" className="text-[10px] font-semibold text-rose-500">{errors.totalUnits}</p>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-foreground">
                                                        Number of Floors <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input 
                                                        {...form.fieldProps("floorCount")}
                                                        type="number" 
                                                        min="1"
                                                        max="99"
                                                        step="1"
                                                        inputMode="numeric"
                                                        maxLength={2}
                                                        value={formData.floorCount}
                                                        onKeyDown={(e) => {
                                                            if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                                        }}
                                                        onInput={(e) => {
                                                            if (e.currentTarget.value.length > 2) {
                                                                e.currentTarget.value = e.currentTarget.value.slice(0, 2);
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                                            const num = parseInt(raw, 10);
                                                            const val = num > 99 ? "99" : raw;
                                                            handleInputChange("floorCount", val);
                                                        }}
                                                        onBlur={() => {
                                                            form.touch("floorCount");
                                                            if (!formData.floorCount || parseInt(formData.floorCount, 10) < 1) {
                                                                handleInputChange("floorCount", "1");
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                            errors.floorCount && "border-rose-500"
                                                        )}
                                                    />
                                                    {errors.floorCount && (
                                                        <p id={form.errorId("floorCount")} role="alert" className="text-[10px] font-semibold text-rose-500">{errors.floorCount}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-foreground">
                                                    Max Tenants per Room <span className="text-rose-500">*</span>
                                                </label>
                                                <input 
                                                    {...form.fieldProps("occupancyLimit")}
                                                    type="number" 
                                                    min="1"
                                                    max="99"
                                                    step="1"
                                                    inputMode="numeric"
                                                    maxLength={2}
                                                    value={formData.occupancyLimit}
                                                    onKeyDown={(e) => {
                                                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                                    }}
                                                    onInput={(e) => {
                                                        if (e.currentTarget.value.length > 2) {
                                                            e.currentTarget.value = e.currentTarget.value.slice(0, 2);
                                                        }
                                                    }}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                                        handleInputChange("occupancyLimit", raw);
                                                    }}
                                                    onBlur={() => {
                                                        form.touch("occupancyLimit");
                                                        if (!formData.occupancyLimit || parseInt(formData.occupancyLimit, 10) < 1) {
                                                            handleInputChange("occupancyLimit", "1");
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-2 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                                                        errors.occupancyLimit && "border-rose-500"
                                                    )}
                                                />
                                                <p className="text-[11px] text-muted-foreground">
                                                    Standard capacity per room (e.g. 1 to 5 people). Max 2 digits.
                                                </p>
                                                {errors.occupancyLimit && (
                                                    <p id={form.errorId("occupancyLimit")} role="alert" className="text-[10px] font-semibold text-rose-500">{errors.occupancyLimit}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Room Naming & Numbering (6 cols) */}
                                    <div className="lg:col-span-6 space-y-3">
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Hash className="size-3.5 text-primary" />
                                            <span>Room Naming & Numbering</span>
                                        </h3>

                                        <div className="space-y-2.5">
                                            {/* Room Label chips & custom input */}
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-bold text-foreground">Room Label</label>
                                                    {isCustomPrefix && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCustomPrefix(false);
                                                                handleInputChange("unitPrefix", "Unit");
                                                            }}
                                                            className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                                                        >
                                                            Reset to presets
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {["Room", "Unit", "Studio", "Door", "Bed"].map((preset) => (
                                                        <button
                                                            key={preset}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCustomPrefix(false);
                                                                handleInputChange("unitPrefix", preset);
                                                            }}
                                                            className={cn(
                                                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                                                !isCustomPrefix && formData.unitPrefix === preset
                                                                    ? "bg-primary text-black font-extrabold shadow-xs"
                                                                    : "bg-background text-foreground hover:bg-muted border border-border/80"
                                                            )}
                                                        >
                                                            {preset}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCustomPrefix(true);
                                                            if (["Room", "Unit", "Studio", "Door", "Bed"].includes(formData.unitPrefix)) {
                                                                handleInputChange("unitPrefix", "");
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                                            isCustomPrefix
                                                                ? "bg-primary text-black font-extrabold shadow-xs"
                                                                : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted border border-dashed border-border/90"
                                                        )}
                                                    >
                                                        + Custom
                                                    </button>
                                                </div>

                                                {isCustomPrefix && (
                                                    <div className="pt-0.5 space-y-1">
                                                        <div className="relative">
                                                            <input 
                                                                {...form.fieldProps("unitPrefix")}
                                                                type="text"
                                                                autoFocus
                                                                maxLength={10}
                                                                value={formData.unitPrefix}
                                                                onChange={(e) => handleInputChange("unitPrefix", e.target.value)}
                                                                placeholder="Type custom label (e.g. Suite, Apt, Pod)"
                                                                className={cn(
                                                                    "w-full bg-background border-2 border-border/80 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 pr-14",
                                                                    errors.unitPrefix && "border-rose-500"
                                                                )}
                                                            />
                                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold pointer-events-none">
                                                                {formData.unitPrefix.length}/10
                                                            </span>
                                                        </div>
                                                        {errors.unitPrefix && (
                                                            <p id={form.errorId("unitPrefix")} role="alert" className="text-[10px] font-semibold text-rose-500">{errors.unitPrefix}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Numbering Scheme */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-foreground">Numbering Style</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("numberingStyle", "floor_based")}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer",
                                                            formData.numberingStyle === "floor_based"
                                                                ? "bg-primary/10 border-primary"
                                                                : "bg-background border-border/80 hover:border-border"
                                                        )}
                                                    >
                                                        <p className="text-xs font-bold text-foreground">By Floor</p>
                                                        <p className="text-[10px] text-muted-foreground">101, 102 / 201</p>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange("numberingStyle", "sequential")}
                                                        className={cn(
                                                            "p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer",
                                                            formData.numberingStyle === "sequential"
                                                                ? "bg-primary/10 border-primary"
                                                                : "bg-background border-border/80 hover:border-border"
                                                        )}
                                                    >
                                                        <p className="text-xs font-bold text-foreground">In Order</p>
                                                        <p className="text-[10px] text-muted-foreground">1, 2, 3...</p>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Live Preview Pill */}
                                            <div className="rounded-xl border border-border/80 bg-muted/15 px-3 py-1.5 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                                    <Eye className="size-3.5 text-primary" />
                                                    <span>Preview:</span>
                                                </div>
                                                <div className="flex items-center gap-1 overflow-x-auto">
                                                    {generateUnitList(
                                                        Math.min(4, parseInt(formData.totalUnits) || 4),
                                                        parseInt(formData.floorCount) || 2,
                                                        {
                                                            prefix: formData.unitPrefix || "Unit",
                                                            numberingStyle: formData.numberingStyle,
                                                            startingNumber: formData.startingNumber,
                                                        }
                                                    ).map((item, idx) => (
                                                        <span key={idx} className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-xs font-bold text-primary whitespace-nowrap">
                                                            {item.name}
                                                        </span>
                                                    ))}
                                                    {(parseInt(formData.totalUnits) || 1) > 4 && (
                                                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                                            +{(parseInt(formData.totalUnits) || 1) - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Rent & Bills */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">Rent & Utility Bills</h2>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                        Set your standard monthly rent and choose how electricity and water will be billed.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-1">
                                    {/* Left: Rent & Utilities (6 cols) */}
                                    <div className="lg:col-span-6 space-y-3.5">
                                        {/* Standard Base Rent */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                                <span>Standard Monthly Rent</span>
                                                <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xl font-bold text-primary">
                                                    ₱
                                                </div>
                                                <input 
                                                    {...form.fieldProps("baseRent")}
                                                    type="text" 
                                                    inputMode="decimal"
                                                    maxLength={10}
                                                    value={formData.baseRent === 0 ? "" : formData.baseRent.toLocaleString('en-US')}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9.]/g, "");
                                                        const num = Math.min(9999999.99, parseFloat(val) || 0);
                                                        handleInputChange("baseRent", num);
                                                    }}
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "w-full bg-background border-2 border-border/80 rounded-xl pl-9 pr-4 py-2 text-xl font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40",
                                                        errors.baseRent && "border-rose-500"
                                                    )}
                                                />
                                            </div>
                                            {errors.baseRent ? (
                                                <p id={form.errorId("baseRent")} role="alert" className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.baseRent}</p>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground">
                                                    Base rent per room or unit. You can customize rates for specific rooms later.
                                                </p>
                                            )}
                                        </div>

                                        {/* Utility Billing Method */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-xs font-bold text-foreground">Electricity & Water Billing</label>
                                                    <p className="text-[10px] text-muted-foreground">How will utility bills be handled?</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBillingGuideInitialTab(formData.utilityBilling || "fixed_charge");
                                                        setBillingGuideOpen(true);
                                                    }}
                                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <HelpCircle className="size-3.5" />
                                                    <span>Billing Guide</span>
                                                </button>
                                            </div>

                                            <div className="grid gap-2">
                                                {[
                                                    {
                                                        id: "fixed_charge",
                                                        label: "Utilities Included in Rent",
                                                        desc: "Water & electricity covered in rent. No meter reading needed.",
                                                    },
                                                    {
                                                        id: "individual_meter",
                                                        label: "Separate Submeters (Pay per Use)",
                                                        desc: "Tenants pay monthly based on kWh and m³ submeters.",
                                                    },
                                                    {
                                                        id: "equal_per_head",
                                                        label: "Split Bills Equally",
                                                        desc: "Total electricity & water bills divided equally among tenants.",
                                                    },
                                                ].map((opt) => {
                                                    const isSelected = formData.utilityBilling === opt.id;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => handleInputChange("utilityBilling", opt.id)}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border-2 transition-all text-left cursor-pointer",
                                                                isSelected
                                                                    ? "bg-primary/10 border-primary shadow-xs"
                                                                    : "bg-background border-border/80 hover:border-border"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                                isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                                                            )}>
                                                                {isSelected && <div className="size-1.5 rounded-full bg-black" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <p className={cn("text-xs sm:text-sm font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                                                        {opt.label}
                                                                    </p>
                                                                    {isSelected && <CheckCircle2 className="size-3.5 text-primary shrink-0 ml-1" />}
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground truncate">
                                                                    {opt.desc}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Amenities (6 cols) */}
                                    <div className="lg:col-span-6 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Layers className="size-3.5 text-primary" />
                                                <h3 className="text-xs font-bold text-foreground">Property Amenities</h3>
                                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                                                    Optional
                                                </span>
                                            </div>
                                        </div>
                                        <PropertyAmenitiesSelector
                                            selectedAmenities={formData.amenities}
                                            onChange={(amenities) => handleInputChange("amenities", amenities)}
                                            landlordId={user?.id}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Rules & Lease */}
                        {step === 4 && (
                            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">House Rules & Lease Agreement</h2>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                                        Choose rules tenants must follow and how to handle rental agreements.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-1">
                                    {/* Building Rules */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="size-3.5 text-primary" />
                                            <h3 className="text-xs font-bold text-foreground">House Rules</h3>
                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/60">
                                                Optional
                                            </span>
                                        </div>
                                        <PropertyRulesSelector
                                            selectedRules={formData.buildingRules}
                                            onChange={(rules) => handleInputChange("buildingRules", rules)}
                                            landlordId={user?.id}
                                        />
                                    </div>

                                    {/* Lease Agreement Method */}
                                    <div className="space-y-2 pt-3 border-t border-border/60">
                                        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <FileText className="size-3.5 text-primary" />
                                            <span>Rental Contract / Lease Agreement</span>
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* Option 1: Auto-generate */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleInputChange("contractMode", "generate")}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleInputChange("contractMode", "generate");
                                                    }
                                                }}
                                                className={cn(
                                                    "p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2",
                                                    formData.contractMode === "generate"
                                                        ? "bg-primary/10 border-primary shadow-xs"
                                                        : "bg-background border-border/80 hover:border-border"
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "size-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                                formData.contractMode === "generate" ? "border-primary bg-primary" : "border-muted-foreground/40"
                                                            )}>
                                                                {formData.contractMode === "generate" && <div className="size-1.5 rounded-full bg-black" />}
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-bold text-foreground">Standard Digital Lease</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                            Recommended
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                                                        Auto-generated standard rental agreement with your rent amount and house rules. No paperwork needed.
                                                    </p>
                                                </div>

                                                <div className="pl-6">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsContractBuilderOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <Eye className="size-3.5" />
                                                        <span>Preview Standard Lease</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Option 2: Upload own */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleInputChange("contractMode", "upload")}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleInputChange("contractMode", "upload");
                                                    }
                                                }}
                                                className={cn(
                                                    "p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2",
                                                    formData.contractMode === "upload"
                                                        ? "bg-primary/10 border-primary shadow-xs"
                                                        : "bg-background border-border/80 hover:border-border"
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "size-4 rounded-full border-2 flex items-center justify-center shrink-0",
                                                                formData.contractMode === "upload" ? "border-primary bg-primary" : "border-muted-foreground/40"
                                                            )}>
                                                                {formData.contractMode === "upload" && <div className="size-1.5 rounded-full bg-black" />}
                                                            </div>
                                                            <span className="text-xs sm:text-sm font-bold text-foreground">Upload My Own Contract</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                                                        Have your own existing printed or PDF contract? Upload it to use for all leases in this property.
                                                    </p>
                                                </div>

                                                <div className="pl-6">
                                                    <label
                                                        htmlFor="contract-upload-input"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border/80 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                                    >
                                                        <Upload className="size-3 text-primary" />
                                                        <span>{formData.contractFile ? "File: " + formData.contractFile : "Choose PDF"}</span>
                                                    </label>
                                                    <input 
                                                        {...form.fieldProps("contractFile")}
                                                        id="contract-upload-input"
                                                        type="file" 
                                                        onChange={(e) => {
                                                            const file = handleMediaSelection(e, {
                                                                preset: "document_only",
                                                                notify: (msg, desc) => toast.error(desc ? `${msg}: ${desc}` : msg),
                                                            });
                                                            if (file) {
                                                                handleInputChange("contractFile", file.name);
                                                            }
                                                        }}
                                                        className="hidden"
                                                        accept={MEDIA_ACCEPT_STRINGS.document_only}
                                                    />
                                                    {errors.contractFile && (
                                                        <p id={form.errorId("contractFile")} role="alert" className="text-xs font-semibold text-rose-500 mt-1">{errors.contractFile}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-6 py-3 sm:px-8 sm:py-3.5 border-t border-border/70 bg-muted/10 flex items-center justify-between gap-4">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/80 text-foreground hover:bg-muted font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Back</span>
                            </button>
                        ) : properties.length > 0 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Cancel</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={isSubmitting} 
                            className="px-6 py-2.5 bg-primary text-black hover:bg-primary/90 rounded-xl font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin text-black" />
                                    <span>{saveStage || "Saving..."}</span>
                                </>
                            ) : step === 4 ? (
                                <>
                                    <span>{isEditMode ? "Save Changes" : "Complete & Save Property"}</span>
                                    <Check className="size-3.5 stroke-[3]" />
                                </>
                            ) : (
                                <>
                                    <span>Continue</span>
                                    <ArrowRight className="size-3.5 stroke-[3]" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Save Action Bar (visible in edit mode on steps 1, 2, and 3; disappears on step 4 or in new property setup) */}
            <AnimatePresence>
                {isEditMode && step < 4 && (
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
                                        : `Editing: ${formData.propertyName || "Property"}`}
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

            <BillingStrategyModal
                isOpen={billingGuideOpen}
                onClose={() => setBillingGuideOpen(false)}
                selectedStrategy={formData.utilityBilling}
                onSelectStrategy={(id) => handleInputChange("utilityBilling", id)}
                initialStrategyId={billingGuideInitialTab}
            />

            <AssetClassModal
                isOpen={assetClassGuideOpen}
                onClose={() => setAssetClassGuideOpen(false)}
                selectedClass={formData.propertyType}
                onSelectClass={(classId) => handleInputChange("propertyType", classId)}
                initialClassId={assetClassGuideInitialTab}
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

