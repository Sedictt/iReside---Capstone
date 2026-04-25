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
    Star,
    Zap,
    Users,
    DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SmartContractBuilderModal,
    type SmartContractTemplate,
} from "@/components/landlord/properties/SmartContractBuilderModal";
import ClickSpark from "@/components/ui/ClickSpark";
import { createClient } from "@/lib/supabase/client";
import type { UtilitySplitMethod } from "@/types/database";

type Step = 1 | 2 | 3 | 4;

type SupportedPropertyEnum = "apartment" | "dormitory" | "boarding_house";

const PROPERTY_TYPE_TO_ENUM: Record<string, SupportedPropertyEnum> = {
    "Apartment": "apartment",
    "Dormitory": "dormitory",
    "Boarding House": "boarding_house",
    // Legacy display names (edit-mode hydration compat)
    "Apartment Complex": "apartment",
    Condominium: "apartment",
    "Single Family Home": "apartment",
    Townhouse: "apartment",
    Studio: "apartment",
    "Commercial Space": "apartment",
};

const ENUM_TO_PROPERTY_TYPE: Record<string, string> = {
    apartment: "Apartment",
    dormitory: "Dormitory",
    boarding_house: "Boarding House",
};

// Default occupancy by type
const DEFAULT_OCCUPANCY: Record<SupportedPropertyEnum, number> = {
    apartment: 5,
    dormitory: 4,
    boarding_house: 2,
};

// Dynamic occupancy field label
const OCCUPANCY_LABEL: Record<SupportedPropertyEnum, string> = {
    apartment: "Household Capacity (Head Limit)",
    dormitory: "Head Limit (Bedspace Capacity)",
    boarding_house: "Room Limit (Head Limit)",
};

const SPLIT_OPTIONS: { value: UtilitySplitMethod; label: string; description: string }[] = [
    { value: "equal_per_head", label: "Split by Head", description: "Divide the shared utility bill equally among all occupants residing in the property." },
    { value: "fixed_charge", label: "Fixed Monthly Fee", description: "Charge a flat monthly utility fee per occupant, regardless of actual consumption." },
    { value: "individual_meter", label: "Individual Meter", description: "Each tenant manages their own meter and pays the utility company directly — no shared billing involved." },
];

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
const MEDIA_UPLOAD_TIMEOUT_MS = 25_000;
const PROPERTY_LOAD_TIMEOUT_MS = 12_000;

const isSmartContractTemplate = (value: unknown): value is SmartContractTemplate => {
    if (!value || typeof value !== "object") return false;

    const candidate = value as {
        answers?: unknown;
        customClauses?: unknown;
    };

    const answersValid =
        candidate.answers !== undefined &&
        typeof candidate.answers === "object" &&
        candidate.answers !== null;

    const clauses = candidate.customClauses;
    const clausesValid =
        Array.isArray(clauses) &&
        clauses.every(
            (item) =>
                item &&
                typeof item === "object" &&
                typeof (item as { id?: unknown }).id === "number" &&
                typeof (item as { title?: unknown }).title === "string" &&
                typeof (item as { description?: unknown }).description === "string"
        );

    return answersValid && clausesValid;
};

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
    const [saveWarning, setSaveWarning] = useState<string | null>(null);
    const [reloadPropertyKey, setReloadPropertyKey] = useState(0);
    const [isContractBuilderOpen, setIsContractBuilderOpen] = useState(false);
    const [isContractGenerated, setIsContractGenerated] = useState(false);
    const [contractTemplate, setContractTemplate] = useState<SmartContractTemplate | null>(null);
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
        propertyType: "Apartment",
        yearBuilt: "",
        address: "",
        totalUnits: "1",
        floorCount: "1",
        description: "",
        occupancyLimit: "5",
        utilitySplitMethod: "individual_meter" as UtilitySplitMethod,
        fixedChargeAmount: "500",
    });

    const hasHydratedEditData = formData.propertyName.trim().length > 0 && formData.address.trim().length > 0;

    // Derived property enum
    const resolvedPropertyEnum: SupportedPropertyEnum = PROPERTY_TYPE_TO_ENUM[formData.propertyType] ?? "apartment";

    useEffect(() => {
        if (!isEditMode || !id) return;

        const controller = new AbortController();
        let didTimeout = false;
        const timeout = window.setTimeout(() => {
            didTimeout = true;
            controller.abort();
        }, PROPERTY_LOAD_TIMEOUT_MS);

        const loadProperty = async () => {
            setIsLoadingProperty(true);
            setLoadError(null);

            try {
                const response = await fetch(`/api/landlord/properties/${id}`, {
                    method: "GET",
                    signal: controller.signal,
                    cache: "no-store",
                });

                const payload = (await response.json()) as {
                    property?: {
                        id: string;
                        name: string;
                        type: string;
                        address: string;
                        description: string | null;
                        amenities: string[] | null;
                        images: string[] | null;
                        contract_template: unknown;
                        unitCount: number;
                        env_policy?: {
                            utility_split_method?: string | null;
                            utility_fixed_charge_amount?: number | null;
                            max_occupants_per_unit?: number | null;
                        } | null;
                    };
                    error?: string;
                };

                if (!response.ok || !payload.property) {
                    throw new Error(payload.error || "Failed to load property details.");
                }

                const property = payload.property;

                const enumKey = (property.type ?? "apartment") as SupportedPropertyEnum;
                const displayType = ENUM_TO_PROPERTY_TYPE[enumKey] ?? "Apartment";
                const defaultOcc = DEFAULT_OCCUPANCY[enumKey] ?? 5;

                setFormData({
                    propertyName: property.name,
                    propertyType: displayType,
                    yearBuilt: "",
                    address: property.address,
                    totalUnits: String(property.unitCount ?? 1),
                    floorCount: "1",
                    description: property.description ?? "",
                    occupancyLimit: String(property.env_policy?.max_occupants_per_unit ?? defaultOcc),
                    utilitySplitMethod: (property.env_policy?.utility_split_method as UtilitySplitMethod) ?? "individual_meter",
                    fixedChargeAmount: String(property.env_policy?.utility_fixed_charge_amount ?? 500),
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
                const resolvedContractTemplate = isSmartContractTemplate(property.contract_template)
                    ? property.contract_template
                    : null;
                setContractTemplate(resolvedContractTemplate);
                setIsContractGenerated(Boolean(resolvedContractTemplate));
                setLoadError(null);
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    if (didTimeout) {
                        setLoadError("Loading property details timed out. Please retry.");
                    }
                    return;
                } else {
                setLoadError(error instanceof Error ? error.message : "Failed to load property details.");
                }
            } finally {
                window.clearTimeout(timeout);
                setIsLoadingProperty(false);
            }
        };

        void loadProperty();

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [isEditMode, id, reloadPropertyKey]);

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
        requestedTotalUnits: string,
        requestedFloorCount: string
    ) => {
        const desiredUnitCount = Math.max(1, Math.floor(Number(requestedTotalUnits) || 1));
        const floorCount = Math.max(1, Math.floor(Number(requestedFloorCount) || 1));

        const { data: existingUnits, error: unitsError } = await supabase
            .from("units")
            .select("id, status, floor, created_at")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });

        if (unitsError) throw new Error("Failed to load existing units.");

        const unitCount = existingUnits?.length ?? 0;

        if (desiredUnitCount > unitCount) {
            // Distribute new units across floors
            const unitsToCreate = Array.from({ length: desiredUnitCount - unitCount }, (_, index) => {
                const unitIndex = unitCount + index + 1;
                // Distribute evenly: unit 1 → floor 1, wrapping around floorCount
                const floorNumber = floorCount === 1 ? 1 : ((unitIndex - 1) % floorCount) + 1;
                return {
                    property_id: propertyId,
                    name: `Unit ${unitIndex}`,
                    floor: floorNumber,
                    status: "vacant" as const,
                    rent_amount: 0,
                    beds: 1,
                    baths: 1,
                };
            });

            const { error: insertUnitsError } = await supabase.from("units").insert(unitsToCreate);
            if (insertUnitsError) throw new Error("Failed to create additional units.");
        } else if (desiredUnitCount < unitCount) {
            const unitsToRemove = unitCount - desiredUnitCount;
            const removableUnits = (existingUnits ?? []).filter((unit) => unit.status === "vacant").reverse();

            if (removableUnits.length < unitsToRemove) {
                throw new Error("Unable to reduce unit count because some units are occupied or under maintenance.");
            }

            const idsToDelete = removableUnits.slice(0, unitsToRemove).map((unit) => unit.id);
            const { error: deleteUnitsError } = await supabase.from("units").delete().in("id", idsToDelete);
            if (deleteUnitsError) throw new Error("Failed to remove extra units.");
        }
    };

    /** Sync property_floor_configs rows based on the floor count from the wizard */
    const syncFloorConfigs = async (
        supabase: ReturnType<typeof createClient>,
        propertyId: string,
        requestedFloorCount: string
    ) => {
        const floorCount = Math.max(1, Math.floor(Number(requestedFloorCount) || 1));

        // Fetch existing floor configs
        const { data: existing } = await (supabase
            .from("property_floor_configs" as any)
            .select("floor_number, floor_key")
            .eq("property_id", propertyId) as any);

        const existingKeys = new Set((existing ?? []).map((f: any) => f.floor_key));

        // Build desired set: ground (0) + floor1..floorN
        const desired: Array<{ floor_number: number; floor_key: string; sort_order: number }> = [];
        // Always add ground floor as floor 0
        desired.push({ floor_number: 0, floor_key: "ground", sort_order: 0 });
        for (let i = 1; i <= floorCount; i++) {
            desired.push({ floor_number: i, floor_key: `floor${i}`, sort_order: i });
        }

        // Insert only missing configs (never delete existing ones — they may have custom names)
        const toInsert = desired
            .filter(d => !existingKeys.has(d.floor_key))
            .map(d => ({
                property_id: propertyId,
                floor_number: d.floor_number,
                floor_key: d.floor_key,
                display_name: null, // use default display name
                sort_order: d.sort_order,
            }));

        if (toInsert.length > 0) {
            const { error } = await (supabase
                .from("property_floor_configs" as any)
                .insert(toInsert) as any);
            if (error) throw new Error(`Failed to create floor configs: ${error.message}`);
        }
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        setLoadError(null);
        setSaveWarning(null);
        setSaveStage("Verifying credentials...");

        const safetyTimeout = window.setTimeout(() => {
            setLoadError("Saving is taking longer than expected. Please check your connection and try again.");
            setIsSubmitting(false);
            setSaveStage(null);
        }, SAVE_SAFETY_TIMEOUT_MS);

        try {
            const supabase = createClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) throw new Error("Authentication failed. Please log in again.");

            // Prepare property data
            const name = formData.propertyName.trim();
            const address = formData.address.trim();
            if (!name || !address) throw new Error("Property name and address are required.");

            let mergedImages = [...existingImageUrls];
            if (coverExistingUrl && mergedImages.includes(coverExistingUrl)) {
                mergedImages = [coverExistingUrl, ...mergedImages.filter(url => url !== coverExistingUrl)];
            }

            const envType = PROPERTY_TYPE_TO_ENUM[formData.propertyType] ?? "apartment";
            const occupancyLimit = Math.max(1, Math.floor(Number(formData.occupancyLimit) || DEFAULT_OCCUPANCY[envType]));
            const splitMethod: UtilitySplitMethod = formData.utilitySplitMethod;
            const fixedChargeAmount = splitMethod === "fixed_charge"
                ? (parseFloat(formData.fixedChargeAmount) || 500)
                : null;

            const payload = {
                name,
                type: envType,
                address,
                description: formData.description.trim() || null,
                amenities: selectedAmenities,
                contract_template: contractTemplate,
                images: mergedImages,
            };

            let propertyId = id ?? "";

            if (isEditMode && id) {
                setSaveStage("Updating property details...");
                const { error } = await supabase
                    .from("properties")
                    .update(payload)
                    .eq("id", id)
                    .eq("landlord_id", user.id);

                if (error) throw new Error(`Failed to update property: ${error.message}`);
                propertyId = id;

                // Update environment policy
                await supabase.from("property_environment_policies")
                    .update({
                        environment_mode: envType,
                        max_occupants_per_unit: occupancyLimit,
                        utility_split_method: splitMethod,
                        utility_fixed_charge_amount: fixedChargeAmount,
                    })
                    .eq("property_id", propertyId);
            } else {
                setSaveStage("Creating property profile...");
                const { data: insertedProperty, error } = await supabase
                    .from("properties")
                    .insert({
                        ...payload,
                        landlord_id: user.id,
                        city: "Valenzuela",
                    })
                    .select("id")
                    .single();

                if (error) throw new Error(`Failed to create property: ${error.message}`);
                if (!insertedProperty?.id) throw new Error("Property created but ID missing.");
                propertyId = insertedProperty.id;

                await supabase.from("property_environment_policies").insert({
                    property_id: propertyId,
                    environment_mode: envType,
                    needs_review: envType !== "apartment",
                    max_occupants_per_unit: occupancyLimit,
                    curfew_enabled: envType === "dormitory",
                    visitor_cutoff_enabled: envType === "dormitory",
                    quiet_hours_start: envType === "dormitory" ? "22:00:00" : null,
                    quiet_hours_end: envType === "dormitory" ? "06:00:00" : null,
                    gender_restriction_mode: "none",
                    utility_split_method: splitMethod,
                    utility_fixed_charge_amount: fixedChargeAmount,
                    utility_policy_mode: splitMethod === "individual_meter" ? "separate_metered" :
                                         splitMethod === "equal_per_head" ? "mixed" : "included_in_rent",
                });
            }

            // Sync units and floor configs
            setSaveStage("Configuring units...");
            await syncUnits(supabase, propertyId, formData.totalUnits, formData.floorCount);
            setSaveStage("Configuring floors...");
            await syncFloorConfigs(supabase, propertyId, formData.floorCount);


            // Handle media uploads if any
            let mediaSaveWarning: string | null = null;
            if (mediaFiles.length > 0) {
                try {
                    setSaveStage(`Uploading ${mediaFiles.length} images...`);
                    const mediaFormData = new FormData();
                    mediaFormData.append("propertyId", propertyId);
                    mediaFiles.forEach(file => mediaFormData.append("files", file));

                    const controller = new AbortController();
                    const mediaTimeout = window.setTimeout(() => controller.abort(), MEDIA_UPLOAD_TIMEOUT_MS);

                    const uploadResponse = await fetch("/api/landlord/properties/media", {
                        method: "POST",
                        body: mediaFormData,
                        signal: controller.signal,
                    });

                    window.clearTimeout(mediaTimeout);

                    const uploadPayload = await uploadResponse.json();
                    if (!uploadResponse.ok) throw new Error(uploadPayload.error || "Media upload failed.");

                    const finalImages = [...uploadPayload.imageUrls, ...mergedImages];

                    // Final update with all images including new ones
                    setSaveStage("Finalizing media...");
                    const { error: finalUpdateError } = await supabase
                        .from("properties")
                        .update({ images: finalImages })
                        .eq("id", propertyId)
                        .eq("landlord_id", user.id);

                    if (finalUpdateError) throw new Error("Failed to finalize image order.");
                } catch (mediaError) {
                    console.error("Media upload warning:", mediaError);
                    mediaSaveWarning = "Property details were saved, but image upload timed out or failed. Re-open edit and retry media upload.";
                }
            }

            if (mediaSaveWarning) {
                setSaveWarning(mediaSaveWarning);
                setIsSubmitting(false);
                setSaveStage(null);
                return;
            }

            setSaveStage("Success! Redirecting...");
            router.push("/landlord/properties");
            router.refresh();
        } catch (error) {
            console.error("Submit Error:", error);
            setLoadError(error instanceof Error ? error.message : "An unexpected error occurred while saving.");
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
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span>{loadError}</span>
                                    {isEditMode && id && (
                                        <button
                                            type="button"
                                            onClick={() => setReloadPropertyKey((value) => value + 1)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {saveWarning && (
                            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                {saveWarning}
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
                                                onChange={(e) => {
                                                    const newType = e.target.value;
                                                    const newEnum: SupportedPropertyEnum = PROPERTY_TYPE_TO_ENUM[newType] ?? "apartment";
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        propertyType: newType,
                                                        occupancyLimit: String(DEFAULT_OCCUPANCY[newEnum]),
                                                        utilitySplitMethod: newEnum === "apartment" ? "individual_meter" : "equal_per_head",
                                                    }));
                                                }}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer"
                                            >
                                                <option value="Apartment">Apartment</option>
                                                <option value="Dormitory">Dormitory</option>
                                                <option value="Boarding House">Boarding House</option>
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

                        {/* 2. Units & Billing */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Unit Configuration</h2>
                                    <p className="text-sm text-neutral-400">Define the composition, occupancy limits, and billing policy.</p>
                                </div>

                                {/* 3-column number steppers */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Total Units */}
                                    {([
                                        { key: "totalUnits" as const, label: "Total Units", icon: Home, color: "text-primary", accent: "border-primary/30 bg-primary/5", focusBorder: "focus:border-primary", min: 1 },
                                        { key: "floorCount" as const, label: "Floors", icon: Grid, color: "text-blue-400", accent: "border-blue-400/30 bg-blue-400/5", focusBorder: "focus:border-blue-400", min: 1 },
                                        { key: "occupancyLimit" as const, label: OCCUPANCY_LABEL[resolvedPropertyEnum], icon: Users, color: "text-amber-400", accent: "border-amber-400/30 bg-amber-400/5", focusBorder: "focus:border-amber-400", min: 1 },
                                    ] as const).map(({ key, label, icon: Icon, color, accent, focusBorder, min }) => (
                                        <div key={key} className={`rounded-2xl border ${accent} p-5 flex flex-col gap-3 min-w-0`}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-4 h-4 ${color} shrink-0`} />
                                                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest leading-none truncate">{label}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = Number(formData[key] ?? min);
                                                        if (cur > min) handleInputChange(key, String(cur - 1));
                                                    }}
                                                    className="w-9 h-9 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all text-lg font-bold leading-none select-none"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min={min}
                                                    value={formData[key] ?? min}
                                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                                    className={`w-full min-w-0 text-center bg-transparent text-2xl font-black text-white focus:outline-none border-b-2 border-white/10 ${focusBorder} transition-colors pb-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const cur = Number(formData[key] ?? min);
                                                        handleInputChange(key, String(cur + 1));
                                                    }}
                                                    className="w-9 h-9 shrink-0 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all text-lg font-bold leading-none select-none"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                </div>

                                {/* Billing & Utility Split Section */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Billing &amp; Utility Split</label>
                                    </div>
                                    <p className="text-xs text-neutral-500">
                                        {resolvedPropertyEnum === "apartment"
                                            ? "Apartments default to individual metering. Tenants pay their own meter bills."
                                            : "Choose how shared utility bills are split among occupants for this property."}
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        {SPLIT_OPTIONS
                                            .filter(opt =>
                                                resolvedPropertyEnum === "apartment"
                                                    ? opt.value === "individual_meter"
                                                    : opt.value !== "equal_per_unit"
                                            )
                                            .map(opt => {
                                                const isSelected = formData.utilitySplitMethod === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => handleInputChange("utilitySplitMethod", opt.value)}
                                                        className={cn(
                                                            "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                                                            isSelected
                                                                ? "bg-primary/10 border-primary text-white"
                                                                : "bg-white/[0.02] border-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/[0.05]"
                                                        )}
                                                    >
                                                        <div>
                                                            <p className="font-bold text-sm">{opt.label}</p>
                                                            <p className="text-xs text-neutral-500 mt-0.5">{opt.description}</p>
                                                        </div>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 transition-colors",
                                                            isSelected ? "border-primary bg-primary" : "border-white/20"
                                                        )}>
                                                            {isSelected && <Check className="w-3 h-3 text-black" />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        }
                                    </div>

                                    {/* Fixed Charge Amount input */}
                                    {formData.utilitySplitMethod === "fixed_charge" && (
                                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5" /> Fixed Monthly Fee per Occupant (₱)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-500">₱</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.fixedChargeAmount}
                                                    onChange={(e) => handleInputChange("fixedChargeAmount", e.target.value)}
                                                    placeholder="500"
                                                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-neutral-600"
                                                />
                                            </div>
                                        </div>
                                    )}
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
                initialTemplate={contractTemplate}
                propertyType={resolvedPropertyEnum}
                utilitySplitMethod={formData.utilitySplitMethod}
                fixedChargeAmount={formData.utilitySplitMethod === "fixed_charge" ? Number(formData.fixedChargeAmount) : undefined}
                onSave={(template) => {
                    setContractTemplate(template);
                    setIsContractGenerated(true);
                    // Sync occupancy limit from contract builder back into wizard state
                    if (template.answers.hard_occupancy_limit) {
                        setFormData(prev => ({ ...prev, occupancyLimit: String(template.answers.hard_occupancy_limit) }));
                    }
                }}
            />
        </div>
    );
}

export default function NewAssetPage() {
    return (
        <ClickSpark sparkColor="#7CA34D" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                <NewAssetContent />
            </Suspense>
        </ClickSpark>
    );    
} 
