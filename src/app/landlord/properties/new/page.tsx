"use client";

import { useState, useEffect, Suspense, type ChangeEvent, type DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Home,
    Image as ImageIcon,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Camera,
    Upload,
    Check,
    Grid,
    Trees,
    FileText,
    ClipboardList,
    ShieldCheck,
    Trash2,
    ArrowUp,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SmartContractBuilderModal } from "@/components/landlord/properties/SmartContractBuilderModal";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

const PROPERTY_TYPE_TO_ENUM: Record<string, "apartment" | "condo" | "house" | "townhouse" | "studio"> = {
    "Apartment Complex": "apartment",
    Condominium: "condo",
    "Single Family Home": "house",
    Townhouse: "townhouse",
    Studio: "studio",
    "Commercial Space": "apartment",
};

const ENUM_TO_PROPERTY_TYPE: Record<string, string> = {
    apartment: "Apartment Complex",
    condo: "Condominium",
    house: "Single Family Home",
    townhouse: "Townhouse",
    studio: "Studio",
};

const PRESET_AMENITIES = [
    "PWD Friendly",
    "Gym Facility",
    "24/7 Security",
    "Parking",
    "Coworking Space",
    "Pet Friendly",
    "Roof Deck",
    "Lobby Lounge",
];

const MAX_PROPERTY_UPLOAD_FILES = 12;
const SAVE_SAFETY_TIMEOUT_MS = 45_000;

function NewAssetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isEditMode = mode === "edit";

    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveStage, setSaveStage] = useState<string | null>(null);
    const [isLoadingProperty, setIsLoadingProperty] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isContractBuilderOpen, setIsContractBuilderOpen] = useState(false);
    const [isContractGenerated, setIsContractGenerated] = useState(false);
    const [customAmenity, setCustomAmenity] = useState("");
    const [customAmenities, setCustomAmenities] = useState<string[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
    const [coverExistingUrl, setCoverExistingUrl] = useState<string | null>(null);
    const [coverNewIndex, setCoverNewIndex] = useState<number | null>(null);
    const [draggingExistingIndex, setDraggingExistingIndex] = useState<number | null>(null);
    const [dragOverExistingIndex, setDragOverExistingIndex] = useState<number | null>(null);
    const [draggingNewIndex, setDraggingNewIndex] = useState<number | null>(null);
    const [dragOverNewIndex, setDragOverNewIndex] = useState<number | null>(null);
    
    // Form fields mapped for prepopulating if editing
    const [formData, setFormData] = useState({
        propertyName: "",
        propertyType: "Apartment Complex",
        yearBuilt: "",
        address: "",
        totalUnits: "1",
        description: "" // Add other fields as necessary
    });

    const hasHydratedEditData = formData.propertyName.trim().length > 0 && formData.address.trim().length > 0;

    useEffect(() => {
        if (!isEditMode || !id) return;

        const loadProperty = async () => {
            setIsLoadingProperty(true);
            setLoadError(null);

            try {
                const supabase = createClient();
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    throw new Error("You must be logged in to edit a property.");
                }

                const { data: property, error: propertyError } = await supabase
                    .from("properties")
                    .select("id, name, type, address, description, amenities, images")
                    .eq("id", id)
                    .eq("landlord_id", user.id)
                    .maybeSingle();

                if (propertyError) {
                    throw new Error("Failed to load property details.");
                }

                if (!property) {
                    throw new Error("Property not found or access denied.");
                }

                const { count: unitCount, error: unitCountError } = await supabase
                    .from("units")
                    .select("id", { count: "exact", head: true })
                    .eq("property_id", property.id);

                if (unitCountError) {
                    throw new Error("Failed to load property units.");
                }

                setFormData({
                    propertyName: property.name,
                    propertyType: ENUM_TO_PROPERTY_TYPE[property.type] ?? "Apartment Complex",
                    yearBuilt: "",
                    address: property.address,
                    totalUnits: String(unitCount ?? 1),
                    description: property.description ?? "",
                });

                const incomingAmenities = Array.isArray(property.amenities)
                    ? property.amenities.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
                    : [];

                const presetAmenityLookup = new Set(PRESET_AMENITIES.map((item) => item.toLowerCase()));
                const nextCustomAmenities = incomingAmenities.filter(
                    (amenity) => !presetAmenityLookup.has(amenity.toLowerCase())
                );

                setSelectedAmenities(incomingAmenities);
                setCustomAmenities(nextCustomAmenities);
                setExistingImageUrls(
                    Array.isArray(property.images)
                        ? property.images.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
                        : []
                );
                const firstImage =
                    Array.isArray(property.images) && typeof property.images[0] === "string" && property.images[0].trim().length > 0
                        ? property.images[0]
                        : null;
                setCoverExistingUrl(firstImage);
                setCoverNewIndex(null);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load property details.");
            } finally {
                setIsLoadingProperty(false);
            }
        };

        void loadProperty();
    }, [isEditMode, id]);

    useEffect(() => {
        const nextPreviewUrls = mediaFiles.map((file) => URL.createObjectURL(file));
        setMediaPreviewUrls(nextPreviewUrls);

        return () => {
            nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [mediaFiles]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddCustomAmenity = () => {
        const value = customAmenity.trim();
        if (!value) return;

        const alreadyExists = customAmenities.some(
            (amenity) => amenity.toLowerCase() === value.toLowerCase()
        );
        if (!alreadyExists) {
            setCustomAmenities((prev) => [...prev, value]);
        }
        setSelectedAmenities((prev) => {
            if (prev.some((amenity) => amenity.toLowerCase() === value.toLowerCase())) {
                return prev;
            }

            return [...prev, value];
        });
        setCustomAmenity("");
    };

    const handleToggleAmenity = (amenity: string) => {
        setSelectedAmenities((prev) => {
            const exists = prev.some((item) => item.toLowerCase() === amenity.toLowerCase());

            if (exists) {
                return prev.filter((item) => item.toLowerCase() !== amenity.toLowerCase());
            }

            return [...prev, amenity];
        });
    };

    const handleMediaFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const nextFiles = Array.from(files);

        setMediaFiles((prev) => {
            const merged = [...prev, ...nextFiles];
            const capped = merged.slice(0, MAX_PROPERTY_UPLOAD_FILES);

            if (merged.length > MAX_PROPERTY_UPLOAD_FILES) {
                setLoadError(`You can upload up to ${MAX_PROPERTY_UPLOAD_FILES} images only.`);
            } else {
                setLoadError((current) =>
                    current === `You can upload up to ${MAX_PROPERTY_UPLOAD_FILES} images only.` ? null : current
                );
            }

            if (coverExistingUrl === null && coverNewIndex === null && capped.length > 0) {
                setCoverNewIndex(0);
            }

            return capped;
        });

        // Allow re-selecting the same file(s) in the next pick operation.
        event.target.value = "";
    };

    const moveExistingImage = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= existingImageUrls.length) return;

        const nextImages = [...existingImageUrls];
        const [moved] = nextImages.splice(index, 1);
        nextImages.splice(target, 0, moved);
        setExistingImageUrls(nextImages);
    };

    const reorderExistingImages = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= existingImageUrls.length) return;
        if (toIndex < 0 || toIndex >= existingImageUrls.length) return;

        const nextImages = [...existingImageUrls];
        const [moved] = nextImages.splice(fromIndex, 1);
        nextImages.splice(toIndex, 0, moved);
        setExistingImageUrls(nextImages);
    };

    const handleExistingDragStart = (index: number) => {
        setDraggingExistingIndex(index);
        setDragOverExistingIndex(index);
    };

    const handleExistingDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
        event.preventDefault();
        if (dragOverExistingIndex !== index) {
            setDragOverExistingIndex(index);
        }
    };

    const handleExistingDrop = (index: number) => {
        if (draggingExistingIndex === null) return;
        reorderExistingImages(draggingExistingIndex, index);
        setDraggingExistingIndex(null);
        setDragOverExistingIndex(null);
    };

    const handleExistingDragEnd = () => {
        setDraggingExistingIndex(null);
        setDragOverExistingIndex(null);
    };

    const reorderNewFiles = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        if (fromIndex < 0 || fromIndex >= mediaFiles.length) return;
        if (toIndex < 0 || toIndex >= mediaFiles.length) return;

        const nextFiles = [...mediaFiles];
        const [moved] = nextFiles.splice(fromIndex, 1);
        nextFiles.splice(toIndex, 0, moved);
        setMediaFiles(nextFiles);

        if (coverNewIndex === null) return;
        if (coverNewIndex === fromIndex) {
            setCoverNewIndex(toIndex);
            return;
        }

        if (fromIndex < toIndex && coverNewIndex > fromIndex && coverNewIndex <= toIndex) {
            setCoverNewIndex(coverNewIndex - 1);
            return;
        }

        if (fromIndex > toIndex && coverNewIndex >= toIndex && coverNewIndex < fromIndex) {
            setCoverNewIndex(coverNewIndex + 1);
        }
    };

    const handleNewDragStart = (index: number) => {
        setDraggingNewIndex(index);
        setDragOverNewIndex(index);
    };

    const handleNewDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
        event.preventDefault();
        if (dragOverNewIndex !== index) {
            setDragOverNewIndex(index);
        }
    };

    const handleNewDrop = (index: number) => {
        if (draggingNewIndex === null) return;
        reorderNewFiles(draggingNewIndex, index);
        setDraggingNewIndex(null);
        setDragOverNewIndex(null);
    };

    const handleNewDragEnd = () => {
        setDraggingNewIndex(null);
        setDragOverNewIndex(null);
    };

    const removeExistingImage = (urlToRemove: string) => {
        const nextImages = existingImageUrls.filter((url) => url !== urlToRemove);
        setExistingImageUrls(nextImages);

        if (coverExistingUrl === urlToRemove) {
            if (nextImages.length > 0) {
                setCoverExistingUrl(nextImages[0]);
                setCoverNewIndex(null);
            } else if (mediaFiles.length > 0) {
                setCoverExistingUrl(null);
                setCoverNewIndex(0);
            } else {
                setCoverExistingUrl(null);
                setCoverNewIndex(null);
            }
        }
    };

    const handleNext = () => {
        if (step < 4) setStep((s) => (s + 1) as Step);
        else handleSubmit();
    };

    const handleBack = () => {
        if (step > 1) setStep((s) => (s - 1) as Step);
        else router.push("/landlord/properties");
    };

    const syncUnits = async (
        supabase: ReturnType<typeof createClient>,
        propertyId: string,
        requestedTotalUnits: string
    ) => {
        const desiredUnitCount = Math.max(1, Math.floor(Number(requestedTotalUnits) || 1));

        const { data: existingUnits, error: unitsError } = await supabase
            .from("units")
            .select("id, status, created_at")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });

        if (unitsError) {
            throw new Error("Failed to load existing units.");
        }

        const unitCount = existingUnits?.length ?? 0;

        if (desiredUnitCount > unitCount) {
            const unitsToCreate = Array.from({ length: desiredUnitCount - unitCount }, (_, index) => ({
                property_id: propertyId,
                name: `Unit ${unitCount + index + 1}`,
                floor: 1,
                status: "vacant" as const,
                rent_amount: 0,
                beds: 1,
                baths: 1,
            }));

            const { error: insertUnitsError } = await supabase.from("units").insert(unitsToCreate);
            if (insertUnitsError) {
                throw new Error("Failed to create additional units.");
            }
            return;
        }

        if (desiredUnitCount < unitCount) {
            const unitsToRemove = unitCount - desiredUnitCount;
            const removableUnits = (existingUnits ?? []).filter((unit) => unit.status === "vacant").reverse();

            if (removableUnits.length < unitsToRemove) {
                throw new Error("Unable to reduce unit count because some units are occupied or under maintenance.");
            }

            const idsToDelete = removableUnits.slice(0, unitsToRemove).map((unit) => unit.id);
            const { error: deleteUnitsError } = await supabase.from("units").delete().in("id", idsToDelete);

            if (deleteUnitsError) {
                throw new Error("Failed to remove extra units.");
            }
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setLoadError(null);
        setSaveStage("Preparing save...");

        const safetyTimeout = window.setTimeout(() => {
            setLoadError("Saving is taking longer than expected. Please try again.");
            setIsSubmitting(false);
            setSaveStage(null);
        }, SAVE_SAFETY_TIMEOUT_MS);

        try {
            const supabase = createClient();
            setSaveStage("Verifying account...");
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error("You must be logged in to save a property.");
            }

            const payload = {
                name: formData.propertyName.trim(),
                type: PROPERTY_TYPE_TO_ENUM[formData.propertyType] ?? "apartment",
                address: formData.address.trim(),
                description: formData.description.trim() || null,
                amenities: selectedAmenities,
            };

            if (!payload.name || !payload.address) {
                throw new Error("Property name and address are required.");
            }

            let propertyId = id ?? "";

            if (isEditMode && id) {
                setSaveStage("Saving property details...");
                const { error } = await supabase
                    .from("properties")
                    .update(payload)
                    .eq("id", id)
                    .eq("landlord_id", user.id);

                if (error) {
                    throw new Error("Failed to update property.");
                }

                await syncUnits(supabase, id, formData.totalUnits);
                propertyId = id;
            } else {
                setSaveStage("Creating property...");
                const { data: insertedProperty, error } = await supabase
                    .from("properties")
                    .insert({
                        ...payload,
                        landlord_id: user.id,
                        city: "Valenzuela",
                    })
                    .select("id")
                    .single();

                if (error) {
                    throw new Error("Failed to create property.");
                }

                if (!insertedProperty?.id) {
                    throw new Error("Property was created but no id was returned.");
                }

                await syncUnits(supabase, insertedProperty.id, formData.totalUnits);
                propertyId = insertedProperty.id;
            }

            if (mediaFiles.length > 0) {
                setSaveStage("Uploading media...");
                if (!propertyId) {
                    throw new Error("Property id missing for media upload.");
                }

                const mediaFormData = new FormData();
                mediaFormData.append("propertyId", propertyId);

                mediaFiles.forEach((file) => {
                    mediaFormData.append("files", file);
                });

                const uploadResponse = await fetch("/api/landlord/properties/media", {
                    method: "POST",
                    body: mediaFormData,
                });

                const uploadPayload = (await uploadResponse.json()) as { imageUrls?: string[]; error?: string };

                if (!uploadResponse.ok || !Array.isArray(uploadPayload.imageUrls)) {
                    throw new Error(uploadPayload.error || "Failed to upload property media.");
                }

                let mergedImages = [
                    ...uploadPayload.imageUrls,
                    ...existingImageUrls.filter((url) => !uploadPayload.imageUrls?.includes(url)),
                ];

                if (coverExistingUrl && mergedImages.includes(coverExistingUrl)) {
                    mergedImages = [
                        coverExistingUrl,
                        ...mergedImages.filter((url) => url !== coverExistingUrl),
                    ];
                } else if (
                    coverNewIndex !== null &&
                    coverNewIndex >= 0 &&
                    coverNewIndex < uploadPayload.imageUrls.length
                ) {
                    const selectedUploadedUrl = uploadPayload.imageUrls[coverNewIndex];
                    mergedImages = [
                        selectedUploadedUrl,
                        ...mergedImages.filter((url) => url !== selectedUploadedUrl),
                    ];
                }

                const { error: imageUpdateError } = await supabase
                    .from("properties")
                    .update({ images: mergedImages })
                    .eq("id", propertyId)
                    .eq("landlord_id", user.id);

                if (imageUpdateError) {
                    throw new Error("Failed to save property image URLs.");
                }
            } else if (isEditMode && propertyId) {
                setSaveStage("Updating image order...");
                let orderedExisting = [...existingImageUrls];

                if (coverExistingUrl && orderedExisting.includes(coverExistingUrl)) {
                    orderedExisting = [
                        coverExistingUrl,
                        ...orderedExisting.filter((url) => url !== coverExistingUrl),
                    ];
                }

                const { error: imageUpdateError } = await supabase
                    .from("properties")
                    .update({ images: orderedExisting })
                    .eq("id", propertyId)
                    .eq("landlord_id", user.id);

                if (imageUpdateError) {
                    throw new Error("Failed to save property image URLs.");
                }
            }

            setSaveStage("Redirecting...");
            router.push("/landlord/properties");
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to save property.");
            setIsSubmitting(false);
            setSaveStage(null);
        } finally {
            window.clearTimeout(safetyTimeout);
        }
    };

    const STEPS = [
        { id: 1, label: "Details", icon: Building2 },
        { id: 2, label: "Units", icon: Grid },
        { id: 3, label: "Media & Docs", icon: ImageIcon },
        { id: 4, label: "Review", icon: CheckCircle2 }
    ];

    return (
        <div className="min-h-screen pb-20 relative selection:bg-primary/30">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute top-[30%] left-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-in fade-in duration-700">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {step === 1 ? "Cancel" : "Go Back"}
                    </button>
                    <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        {isEditMode ? "Asset Editor Wizard" : "Asset Creation Wizard"}
                    </div>
                </div>

                {/* Wizard Container */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                    {/* Top Progress Tracker */}
                    <div className="p-8 border-b border-white/5 relative overflow-hidden bg-white/[0.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-extrabold text-white tracking-tight">Property Wizard</h1>
                                <p className="text-neutral-400">
                                    {isEditMode 
                                        ? `Editing listing details for ${formData.propertyName || "your selected property"}.`
                                        : "Add a property to your portfolio in 4 simple steps."}
                                </p>
                            </div>

                            {/* Circular Progress (Visual only) */}
                            <div className="flex gap-2">
                                {STEPS.map((s) => (
                                    <div key={s.id} className="relative group cursor-default">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border relative overflow-hidden",
                                            step === s.id
                                                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-110"
                                                : step > s.id
                                                    ? "bg-primary/20 text-primary border-primary/30"
                                                    : "bg-white/5 text-neutral-600 border-white/5"
                                        )}>
                                            {step > s.id ? <Check className="w-5 h-5 absolute inset-0 m-auto animate-in zoom-in" /> : <s.icon className={cn("w-5 h-5 transition-transform", step === s.id && "scale-110")} />}

                                            {/* Glow effect for active step */}
                                            {step === s.id && (
                                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/20 blur-md pointer-events-none" />
                                            )}
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs font-semibold text-neutral-300 pointer-events-none">
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className={cn("p-8 sm:p-12", step === 2 ? "min-h-[260px]" : "min-h-[400px]")}>
                        {loadError && (
                            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {loadError}
                            </div>
                        )}

                        {isLoadingProperty && isEditMode && !hasHydratedEditData && (
                            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
                                Loading property details...
                            </div>
                        )}

                        {/* 1. Details */}
                        {step === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Basic Information</h2>
                                    <p className="text-sm text-neutral-400">Enter the essential details about the property.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Property Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Grand View Residences" 
                                            value={formData.propertyName}
                                            onChange={(e) => handleInputChange("propertyName", e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Property Type</label>
                                            <select 
                                                value={formData.propertyType}
                                                onChange={(e) => handleInputChange("propertyType", e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer"
                                            >
                                                <option>Apartment Complex</option>
                                                <option>Condominium</option>
                                                <option>Single Family Home</option>
                                                <option>Townhouse</option>
                                                <option>Commercial Space</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Year Built</label>
                                            <input 
                                                type="number" 
                                                placeholder="e.g. 2018" 
                                                value={formData.yearBuilt}
                                                onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Full Address</label>
                                    <div className="relative">
                                            <textarea 
                                                rows={3} 
                                                placeholder="123 Skyline Avenue, Metro Manila..." 
                                                value={formData.address}
                                                onChange={(e) => handleInputChange("address", e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium resize-none shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Units */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Unit Configuration</h2>
                                    <p className="text-sm text-neutral-400">Define the composition and layout of the asset.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                                                <Home className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Total Units</p>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="number" 
                                                        value={formData.totalUnits}
                                                        onChange={(e) => handleInputChange("totalUnits", e.target.value)}
                                                        min="1" 
                                                        className="w-20 bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-white/20 focus:border-primary transition-colors pb-1" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                                                <Grid className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-400 font-medium">Floor Count</p>
                                                <div className="flex items-center gap-3">
                                                    <input type="number" defaultValue="1" min="1" className="w-20 bg-transparent text-2xl font-bold text-white focus:outline-none border-b border-white/20 focus:border-blue-400 transition-colors pb-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Media */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Media & Documents</h2>
                                    <p className="text-sm text-neutral-400">Add photos, highlight amenities, and upload essential asset documents.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Camera className="w-4 h-4" /> Cover Photo</label>
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="mb-2 text-sm text-neutral-300"><span className="font-semibold text-white">Click to upload</span> high-res image</p>
                                            <p className="text-xs text-neutral-500 font-medium">You can select multiple images (max 12, 8 MB each)</p>
                                            {(mediaFiles.length > 0 || existingImageUrls.length > 0) && (
                                                <p className="mt-2 text-xs text-primary font-semibold">
                                                    {mediaFiles.length > 0
                                                        ? `${mediaFiles.length} new image${mediaFiles.length === 1 ? "" : "s"} queued`
                                                        : "No new uploads queued"}
                                                    {existingImageUrls.length > 0 ? ` • ${existingImageUrls.length} existing image${existingImageUrls.length === 1 ? "" : "s"}` : ""}
                                                </p>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleMediaFileChange} />
                                    </label>

                                    {existingImageUrls.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Existing Images</p>
                                            <p className="text-[11px] text-neutral-500">Drag cards to reorder. First image is used as default cover unless you set one.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {existingImageUrls.map((url, index) => {
                                                    const isCover = coverExistingUrl === url;
                                                    const isDragOver = dragOverExistingIndex === index && draggingExistingIndex !== null;
                                                    return (
                                                        <div
                                                            key={url}
                                                            draggable
                                                            onDragStart={() => handleExistingDragStart(index)}
                                                            onDragOver={(event) => handleExistingDragOver(event, index)}
                                                            onDrop={() => handleExistingDrop(index)}
                                                            onDragEnd={handleExistingDragEnd}
                                                            className={cn(
                                                                "rounded-xl border bg-white/[0.02] p-3 space-y-2 transition-colors",
                                                                isDragOver ? "border-primary/50" : "border-white/10"
                                                            )}
                                                        >
                                                            <img src={url} alt={`Property image ${index + 1}`} className="h-28 w-full rounded-lg object-cover" />
                                                            <div className="flex items-center justify-between gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCoverExistingUrl(url);
                                                                        setCoverNewIndex(null);
                                                                    }}
                                                                    className={cn(
                                                                        "text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1",
                                                                        isCover
                                                                            ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                                                                            : "border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-white/20"
                                                                    )}
                                                                >
                                                                    <Star className="w-3.5 h-3.5" />
                                                                    {isCover ? "Cover" : "Set Cover"}
                                                                </button>

                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveExistingImage(index, -1)}
                                                                        disabled={index === 0}
                                                                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white disabled:opacity-40"
                                                                        title="Move up"
                                                                    >
                                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveExistingImage(index, 1)}
                                                                        disabled={index === existingImageUrls.length - 1}
                                                                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-300 hover:text-white disabled:opacity-40 rotate-180"
                                                                        title="Move down"
                                                                    >
                                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeExistingImage(url)}
                                                                        className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                                        title="Remove image"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {mediaPreviewUrls.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">New Uploads</p>
                                            <p className="text-[11px] text-neutral-500">Drag cards to reorder upload order before saving.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {mediaPreviewUrls.map((url, index) => {
                                                    const isCover = coverExistingUrl === null && coverNewIndex === index;
                                                    const isDragOver = dragOverNewIndex === index && draggingNewIndex !== null;
                                                    return (
                                                        <div
                                                            key={`${url}-${index}`}
                                                            draggable
                                                            onDragStart={() => handleNewDragStart(index)}
                                                            onDragOver={(event) => handleNewDragOver(event, index)}
                                                            onDrop={() => handleNewDrop(index)}
                                                            onDragEnd={handleNewDragEnd}
                                                            className={cn(
                                                                "rounded-xl border bg-white/[0.02] p-3 space-y-2 transition-colors",
                                                                isDragOver ? "border-primary/50" : "border-white/10"
                                                            )}
                                                        >
                                                            <img src={url} alt={`New upload ${index + 1}`} className="h-28 w-full rounded-lg object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCoverExistingUrl(null);
                                                                    setCoverNewIndex(index);
                                                                }}
                                                                className={cn(
                                                                    "text-xs px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1",
                                                                    isCover
                                                                        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                                                                        : "border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-white/20"
                                                                )}
                                                            >
                                                                <Star className="w-3.5 h-3.5" />
                                                                {isCover ? "Cover" : "Set Cover"}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><Trees className="w-4 h-4" /> Key Amenities</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_AMENITIES.map((amenity, i) => {
                                            const isSelected = selectedAmenities.some(
                                                (item) => item.toLowerCase() === amenity.toLowerCase()
                                            );

                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleToggleAmenity(amenity)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                                                        isSelected
                                                            ? "border-primary/30 bg-primary/10 text-primary"
                                                            : "border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-primary hover:bg-primary/10"
                                                    )}
                                                >
                                                    {amenity}
                                                </button>
                                            );
                                        })}
                                        {customAmenities.map((amenity, i) => {
                                            const isSelected = selectedAmenities.some(
                                                (item) => item.toLowerCase() === amenity.toLowerCase()
                                            );

                                            return (
                                                <button
                                                    key={`${amenity}-${i}`}
                                                    type="button"
                                                    onClick={() => handleToggleAmenity(amenity)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                                                        isSelected
                                                            ? "border-primary/30 bg-primary/10 text-primary"
                                                            : "border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-primary hover:bg-primary/10"
                                                    )}
                                                >
                                                    {amenity}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <input
                                            type="text"
                                            value={customAmenity}
                                            onChange={(e) => setCustomAmenity(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddCustomAmenity();
                                                }
                                            }}
                                            placeholder="Add custom amenity (e.g. EV Charging Station)"
                                            className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomAmenity}
                                            className="px-5 py-2.5 rounded-xl bg-primary text-black text-sm font-bold hover:bg-primary/90 transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-4 h-4" /> Legal Documents</label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Upload Existing File</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, DOC, DOCX</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple />
                                        </label>

                                        <div
                                            onClick={() => setIsContractBuilderOpen(true)}
                                            className="flex flex-col items-center justify-center w-full h-32 border border-primary/20 rounded-2xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-all group overflow-hidden relative"
                                        >
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all" />
                                            <div className="flex flex-col items-center justify-center relative z-10 w-full">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 text-primary transition-all group-hover:scale-110 relative">
                                                    <ClipboardList className="w-4 h-4" />
                                                    {isContractGenerated && (
                                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-black flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-black" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mb-1 text-sm text-primary font-bold">Smart Contract Builder</p>
                                                {isContractGenerated ? (
                                                    <p className="text-xs text-emerald-400 font-bold text-center px-4 bg-emerald-500/10 py-1 rounded-full border border-emerald-500/20">
                                                        Standard Lease Configured
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-primary/70 font-medium text-center px-4">Interactive form to construct your lease easily</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Verification Documents</label>
                                    <p className="text-xs text-neutral-500 font-medium">Please provide your building and business permits for admin verification before publishing.</p>

                                    <div className="grid grid-cols-3 gap-4">
                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Building Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>

                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Business Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>

                                        <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all group overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 text-neutral-400 group-hover:text-primary transition-all group-hover:scale-110">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <p className="mb-1 text-sm text-neutral-300"><span className="font-semibold text-white">Occupancy Permit</span></p>
                                                <p className="text-xs text-neutral-500 font-medium">PDF, JPG, PNG</p>
                                            </div>
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Review */}
                        {step === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(var(--primary),0.2)] mb-2 inline-flex relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
                                    <Building2 className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white mb-2">{isEditMode ? "Review Changes" : "Submit for Verification"}</h2>
                                    <p className="text-neutral-400 max-w-md mx-auto">
                                        {isEditMode 
                                            ? "Review your updated property details before saving the changes to your portfolio."
                                            : "Your asset profile is complete. Once submitted, our admins will verify your business and building permits before your asset goes live and is ready for tenant onboarding."}
                                    </p>
                                </div>

                                <div className="w-full max-w-sm bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-sm text-neutral-400">Name</span>
                                        <span className="font-semibold text-white">{formData.propertyName || "Grand View Residences"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-sm text-neutral-400">Units</span>
                                        <span className="font-semibold text-white">{formData.totalUnits || "1"} Units</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-400">Status</span>
                                        {isEditMode ? (
                                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Published</span>
                                        ) : (
                                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">Pending Admin Verification</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="relative p-6 sm:px-12 sm:py-8 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between">
                        {isSubmitting && saveStage && (
                            <div className="absolute left-1/2 -translate-x-1/2 text-xs text-neutral-400">
                                {saveStage}
                            </div>
                        )}
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className={cn(
                                "px-6 py-3 rounded-xl font-bold transition-all text-sm sm:text-base",
                                step === 1 ? "opacity-0 pointer-events-none" : "text-white hover:bg-white/10"
                            )}
                        >
                            Back
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className={cn(
                                "px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center gap-2 hover:scale-105",
                                step === 4 && !isEditMode ? "bg-amber-500 hover:bg-amber-500/90 text-black shadow-[rgba(245,158,11,0.3)] hover:shadow-[rgba(245,158,11,0.5)]" : "bg-primary hover:bg-primary/90 text-black"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    {isEditMode ? "Saving Changes..." : "Submitting..."}
                                </>
                            ) : step === 4 ? (
                                isEditMode ? <>Save Changes <CheckCircle2 className="w-4 h-4" /></> : <>Submit for Verification <CheckCircle2 className="w-4 h-4" /></>
                            ) : (
                                <>Next Step <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <SmartContractBuilderModal
                isOpen={isContractBuilderOpen}
                onClose={() => setIsContractBuilderOpen(false)}
                onSave={() => setIsContractGenerated(true)}
            />
        </div>
    );
}

export default function NewAssetPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
            <NewAssetContent />
        </Suspense>
    );    
} 
