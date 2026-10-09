"use client";

import Image from "next/image";
import { useState, useReducer, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Check, Upload, Loader2, RefreshCcw, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import {
    MAX_FILE_SIZE_MB,
    getSafeAvatarBgColor,
    DEFAULT_AVATAR_BG_COLOR,
    DEFAULT_AVATAR_URL,
    DEFAULT_AVATARS_COUNT,
    DEFAULT_AVATARS_BUCKET_URL,
} from "@/lib/constants";
import { handleMediaSelection } from "@/lib/validation/media-validation";

interface AvatarPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarUrl: string | null;
    currentBgColor: string | null;
    onSelect?: (url: string, color: string) => void;
    onProfileUpdate?: () => void;
}

const BUCKET_URL = DEFAULT_AVATARS_BUCKET_URL;

// Curated 24 high-contrast, accessible swatches (NO pitch-black #171717 per system invariants)
const PRESET_COLORS = [
    DEFAULT_AVATAR_BG_COLOR, // #8B5CF6 (Brand Violet)
    "#7C3AED", // Violet Dark
    "#6366F1", // Indigo
    "#4F46E5", // Indigo Dark
    "#3B82F6", // Blue
    "#2563EB", // Blue Dark
    "#0EA5E9", // Sky
    "#06B6D4", // Cyan
    "#0891B2", // Cyan Dark
    "#14B8A6", // Teal
    "#10B981", // Emerald
    "#059669", // Emerald Dark
    "#84CC16", // Lime
    "#EAB308", // Yellow
    "#F59E0B", // Amber
    "#D97706", // Amber Dark
    "#F97316", // Orange
    "#EA580C", // Orange Dark
    "#EF4444", // Red
    "#DC2626", // Red Dark
    "#EC4899", // Pink
    "#DB2777", // Pink Dark
    "#64748B", // Slate
    "#334155", // Slate Dark
];

interface AvatarPickerState {
    selectedAvatar: string;
    customAvatarUrl: string | null;
    selectedColor: string;
    isUploading: boolean;
    isUpdating: boolean;
    error: string | null;
}

type AvatarPickerAction =
    | { type: "SET_AVATAR"; payload: string }
    | { type: "SET_UPLOADED_AVATAR"; payload: string }
    | { type: "SET_COLOR"; payload: string }
    | { type: "SET_UPLOADING"; payload: boolean }
    | { type: "SET_UPDATING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | {
          type: "RESET_FROM_PROPS";
          payload: { avatar: string | null; color: string | null; defaultAvatars: string[] };
      }
    | { type: "RESET_ON_CLOSE" };

function avatarPickerReducer(state: AvatarPickerState, action: AvatarPickerAction): AvatarPickerState {
    switch (action.type) {
        case "SET_AVATAR":
            return { ...state, selectedAvatar: action.payload };
        case "SET_UPLOADED_AVATAR":
            return {
                ...state,
                selectedAvatar: action.payload,
                customAvatarUrl: action.payload,
            };
        case "SET_COLOR":
            return { ...state, selectedColor: action.payload };
        case "SET_UPLOADING":
            return { ...state, isUploading: action.payload };
        case "SET_UPDATING":
            return { ...state, isUpdating: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        case "RESET_FROM_PROPS": {
            const initialAvatar = action.payload.avatar?.trim() || DEFAULT_AVATAR_URL;
            const isCustom = !action.payload.defaultAvatars.includes(initialAvatar);
            return {
                ...state,
                selectedAvatar: initialAvatar,
                customAvatarUrl: isCustom ? initialAvatar : state.customAvatarUrl,
                selectedColor: getSafeAvatarBgColor(action.payload.color),
            };
        }
        case "RESET_ON_CLOSE":
            return {
                ...state,
                isUpdating: false,
                isUploading: false,
                error: null,
            };
        default:
            return state;
    }
}

export function AvatarPicker({
    isOpen,
    onClose,
    currentAvatarUrl,
    currentBgColor,
    onSelect,
    onProfileUpdate,
}: AvatarPickerProps) {
    const { profile, loading, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const defaultAvatars = useMemo(
        () => Array.from({ length: DEFAULT_AVATARS_COUNT }, (_, i) => `${BUCKET_URL}${i + 3}.png`),
        []
    );

    const initialAvatar = currentAvatarUrl?.trim() || DEFAULT_AVATAR_URL;
    const isInitialCustom = !defaultAvatars.includes(initialAvatar);

    const [state, dispatch] = useReducer(avatarPickerReducer, {
        selectedAvatar: initialAvatar,
        customAvatarUrl: isInitialCustom ? initialAvatar : null,
        selectedColor: getSafeAvatarBgColor(currentBgColor),
        isUploading: false,
        isUpdating: false,
        error: null,
    });

    const supabase = createClient();

    // Sync state whenever dialog opens or props change
    useEffect(() => {
        if (isOpen) {
            dispatch({
                type: "RESET_FROM_PROPS",
                payload: {
                    avatar: currentAvatarUrl,
                    color: currentBgColor,
                    defaultAvatars,
                },
            });
        } else {
            dispatch({ type: "RESET_ON_CLOSE" });
        }
    }, [isOpen, currentAvatarUrl, currentBgColor, defaultAvatars]);

    // Keyboard Escape listener
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const isCurrentCustom = useMemo(() => {
        return !defaultAvatars.includes(state.selectedAvatar);
    }, [state.selectedAvatar, defaultAvatars]);

    const handleSave = async () => {
        if (!state.selectedAvatar) {
            toast.error("Please select an avatar first");
            return;
        }

        if (onSelect) {
            onSelect(state.selectedAvatar, state.selectedColor);
            onClose();
            return;
        }

        dispatch({ type: "SET_UPDATING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        try {
            // 1. Authoritative Server-side update via dedicated endpoint
            let saved = false;
            try {
                const response = await fetch("/api/profile/avatar", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        avatar_url: state.selectedAvatar,
                        avatar_bg_color: state.selectedColor,
                    }),
                });

                if (response.ok) {
                    saved = true;
                } else {
                    const errData = await response.json().catch(() => ({}));
                    console.warn("[AvatarPicker] API route returned error:", errData);
                    // A validation rejection must not be bypassed by the direct client write below.
                    if (response.status >= 400 && response.status < 500) {
                        const rejection = new Error(errData.error || "Invalid avatar selection.");
                        (rejection as Error & { isValidationRejection?: boolean }).isValidationRejection = true;
                        throw rejection;
                    }
                }
            } catch (fetchErr) {
                if ((fetchErr as { isValidationRejection?: boolean })?.isValidationRejection) throw fetchErr;
                console.warn("[AvatarPicker] Fetch error, attempting client fallback:", fetchErr);
            }

            // 2. Client fallback with strict timeout to prevent indefinite hangs
            if (!saved) {
                if (!profile?.id) {
                    throw new Error("Unable to save appearance. User profile not loaded.");
                }
                const updatePromise = supabase
                    .from("profiles")
                    .update({
                        avatar_url: state.selectedAvatar,
                        avatar_bg_color: state.selectedColor,
                    })
                    .eq("id", profile.id);

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Save request timed out. Please try again.")), 5000)
                );

                const { error: updateError } = (await Promise.race([updatePromise, timeoutPromise])) as any;
                if (updateError) throw updateError;
            }

            // 3. Fire-and-forget non-blocking refresh
            void refreshProfile().catch(() => {});
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("profile-updated"));
            }

            toast.success("Profile appearance updated");
            onProfileUpdate?.();
            onClose();
        } catch (err: any) {
            console.error("[AvatarPicker] Failed to update appearance:", err);
            const msg = err.message || "Failed to update appearance. Please try again.";
            dispatch({ type: "SET_ERROR", payload: msg });
            toast.error(msg);
        } finally {
            dispatch({ type: "SET_UPDATING", payload: false });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isValid = handleMediaSelection({
            files: file,
            options: { preset: "image", maxSizeMb: MAX_FILE_SIZE_MB, customLabel: "Profile Avatar" },
            inputElement: e.target,
            onValid: () => {},
            onBlocked: (msg) => {
                dispatch({ type: "SET_ERROR", payload: msg });
            },
        });

        if (!isValid) {
            e.target.value = "";
            return;
        }

        dispatch({ type: "SET_UPLOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload avatar");
            }

            const data = await response.json();
            dispatch({ type: "SET_UPLOADED_AVATAR", payload: data.avatarUrl });
            void refreshProfile().catch(() => {});
            toast.success("Photo uploaded successfully");
        } catch (err: any) {
            console.error("[AvatarPicker] Upload error:", err);
            const msg = err.message || "Failed to upload avatar";
            dispatch({ type: "SET_ERROR", payload: msg });
            toast.error(msg);
        } finally {
            dispatch({ type: "SET_UPLOADING", payload: false });
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="avatar-picker-dialog-title"
            >
                {/* Full Viewport Backdrop with Blur (covers and blurs sidebars and topbars) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Dialog Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl z-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card shrink-0">
                        <div className="min-w-0 pr-4">
                            <h2
                                id="avatar-picker-dialog-title"
                                className="text-base sm:text-lg font-bold text-foreground tracking-tight"
                            >
                                Customize Profile Appearance
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                Choose an illustration or upload your photo, and set your signature color.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="size-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border/60"
                            aria-label="Close dialog"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* Main Split: Left Preview / Right Controls */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
                        {/* Left Preview Pane: Clean, crisp, neutral container without glowing blobs */}
                        <div className="w-full md:w-72 lg:w-80 shrink-0 bg-muted/25 p-6 sm:p-7 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-border/60 relative">
                            {/* Section Eyebrow */}
                            <div className="w-full text-center">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Live Preview
                                </span>
                            </div>

                            {/* Crisp Circular Avatar Preview */}
                            <div className="my-5 md:my-0 flex flex-col items-center">
                                <div
                                    className="relative size-36 sm:size-40 rounded-full border-4 border-background shadow-lg transition-transform duration-200 overflow-hidden flex items-center justify-center"
                                    style={{ backgroundColor: state.selectedColor }}
                                >
                                    <Image
                                        key={state.selectedAvatar}
                                        src={state.selectedAvatar || DEFAULT_AVATAR_URL}
                                        alt="Avatar preview"
                                        fill
                                        sizes="160px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>

                                {/* Active Hex Indicator */}
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border shadow-xs text-xs font-mono font-bold text-foreground">
                                    <span
                                        className="size-2.5 rounded-full border border-black/10 dark:border-white/10"
                                        style={{ backgroundColor: state.selectedColor }}
                                    />
                                    <span>{state.selectedColor.toUpperCase()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="w-full space-y-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={state.isUpdating}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                                >
                                    {state.isUpdating ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Saving Appearance...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="size-4 stroke-[2.5]" />
                                            <span>Save Appearance</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Right Controls Pane */}
                        <div className="flex-1 min-h-0 md:overflow-y-auto p-6 sm:p-7 space-y-6">
                            {state.error && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-500">
                                    {state.error}
                                </div>
                            )}

                            {/* 1. Custom Upload Card */}
                            <div className="space-y-2.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Profile Photo
                                </h3>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-border/80 bg-muted/15 transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                            {state.customAvatarUrl ? (
                                                <div className="relative size-9 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={state.customAvatarUrl}
                                                        alt="Custom upload"
                                                        fill
                                                        sizes="36px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <Camera className="size-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">
                                                {state.customAvatarUrl
                                                    ? isCurrentCustom
                                                        ? "Custom Photo Active"
                                                        : "Saved Custom Photo"
                                                    : "Upload Custom Photo"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                PNG, JPG or WebP up to 5MB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {state.customAvatarUrl && !isCurrentCustom && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    dispatch({
                                                        type: "SET_AVATAR",
                                                        payload: state.customAvatarUrl!,
                                                    })
                                                }
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                                            >
                                                Use Custom
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            onChange={handleFileUpload}
                                            disabled={state.isUploading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={state.isUploading}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-background border border-border/80 text-foreground hover:bg-muted/50 hover:border-primary/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                                        >
                                            {state.isUploading ? (
                                                <>
                                                    <Loader2 className="size-3.5 animate-spin text-primary" />
                                                    <span>Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="size-3.5 text-muted-foreground" />
                                                    <span>
                                                        {state.customAvatarUrl ? "Replace" : "Browse Image"}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Character Illustrations Grid: All 16 live-previewed in the active background color */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Or Choose an Illustration
                                    </h3>
                                    <span className="text-[11px] text-muted-foreground">
                                        16 Character Styles
                                    </span>
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                                    {defaultAvatars.map((url, idx) => {
                                        const isSelected = state.selectedAvatar === url;
                                        return (
                                            <button
                                                key={url}
                                                type="button"
                                                onClick={() => dispatch({ type: "SET_AVATAR", payload: url })}
                                                className={cn(
                                                    "group relative aspect-square rounded-2xl p-1.5 transition-all duration-150 cursor-pointer border flex items-center justify-center",
                                                    isSelected
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-md border-white/50 z-10"
                                                        : "border-black/10 dark:border-white/10 opacity-85 hover:opacity-100 hover:scale-105 hover:shadow-md hover:border-white/50"
                                                )}
                                                style={{ backgroundColor: state.selectedColor }}
                                                aria-label={`Select avatar ${idx + 1}`}
                                            >
                                                <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center">
                                                    <Image
                                                        src={url}
                                                        alt={`Avatar ${idx + 1}`}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover transition-transform duration-200 group-hover:scale-110"
                                                    />
                                                </div>

                                                {/* Unclipped Badge */}
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md z-20 border-2 border-background">
                                                        <Check className="size-2.5 stroke-[3]" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Background Color Section */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Background Color
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            dispatch({
                                                type: "SET_COLOR",
                                                payload: DEFAULT_AVATAR_BG_COLOR,
                                            })
                                        }
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                                        title="Reset to default brand violet"
                                    >
                                        <RefreshCcw className="size-3" />
                                        <span>Reset</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                                    {/* Color Picker Box (5 cols) */}
                                    <div className="lg:col-span-5 space-y-3">
                                        <div className="custom-color-picker-container rounded-2xl overflow-hidden border border-border/80 p-2.5 bg-card shadow-sm">
                                            <HexColorPicker
                                                color={state.selectedColor}
                                                onChange={(color) =>
                                                    dispatch({ type: "SET_COLOR", payload: color })
                                                }
                                                className="!w-full !h-32"
                                            />
                                        </div>
                                        <div className="h-10 w-full rounded-xl bg-background border border-border/80 flex items-center px-3 gap-2.5 focus-within:border-primary transition-colors shadow-sm">
                                            <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                                HEX
                                            </span>
                                            <input
                                                type="text"
                                                value={state.selectedColor.toUpperCase()}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                                                        dispatch({ type: "SET_COLOR", payload: val });
                                                    }
                                                }}
                                                maxLength={7}
                                                className="bg-transparent border-none outline-none text-xs font-mono font-bold text-foreground w-full uppercase"
                                            />
                                            <div
                                                className="size-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                                                style={{ backgroundColor: state.selectedColor }}
                                            />
                                        </div>
                                    </div>

                                    {/* Preset Swatches (7 cols: 4 rows x 6 cols = 24 swatches) */}
                                    <div className="lg:col-span-7">
                                        <div className="grid grid-cols-6 gap-2">
                                            {PRESET_COLORS.map((color) => {
                                                const isSelected =
                                                    state.selectedColor.toLowerCase() ===
                                                    color.toLowerCase();
                                                return (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() =>
                                                            dispatch({ type: "SET_COLOR", payload: color })
                                                        }
                                                        className={cn(
                                                            "group relative aspect-square rounded-xl transition-all duration-150 cursor-pointer border flex items-center justify-center",
                                                            isSelected
                                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md border-white/40 z-10"
                                                                : "border-black/10 dark:border-white/10 hover:scale-105 hover:shadow-sm"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                        aria-label={`Select background color ${color}`}
                                                    >
                                                        {isSelected && (
                                                            <Check className="size-3.5 text-white drop-shadow stroke-[3]" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <style jsx global>{`
                    .custom-color-picker-container .react-colorful {
                        width: 100% !important;
                        height: 130px !important;
                        border-radius: 12px !important;
                    }
                    .custom-color-picker-container .react-colorful__saturation {
                        border-radius: 10px 10px 0 0 !important;
                    }
                    .custom-color-picker-container .react-colorful__hue {
                        height: 12px !important;
                        border-radius: 0 0 10px 10px !important;
                        margin-top: 6px !important;
                    }
                    .custom-color-picker-container .react-colorful__pointer {
                        width: 18px !important;
                        height: 18px !important;
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
