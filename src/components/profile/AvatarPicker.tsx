
"use client";

import Image from "next/image";
import { useReducer, useMemo, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Check, Upload, Loader2, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";

interface AvatarPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarUrl: string | null;
    currentBgColor: string | null;
    onSelect?: (url: string, color: string) => void;
    onProfileUpdate?: () => void;
}

const DEFAULT_AVATARS_COUNT = 16; // 3 to 18
const BUCKET_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co/storage/v1/object/public/profile-avatars/default_avatars/";

const PRESET_COLORS = [
    "#171717", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#d946ef", "#06b6d4", "#71717a",
    "#dc2626", "#ea580c", "#d97706", "#059669", "#2563eb", "#4f46e5", "#7c3aed", "#c026d3", "#db2777", "#0891b2", "#52525b", "#262626"
];

interface AvatarPickerState {
    selectedAvatar: string | null;
    selectedColor: string;
    isUploading: boolean;
    isUpdating: boolean;
    error: string | null;
    currentPage: number;
}

type AvatarPickerAction = 
    | { type: "SET_AVATAR"; payload: string | null }
    | { type: "SET_COLOR"; payload: string }
    | { type: "SET_UPLOADING"; payload: boolean }
    | { type: "SET_UPDATING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_PAGE"; payload: number }
    | { type: "RESET_FROM_PROPS"; payload: { avatar: string | null; color: string | null } }
    | { type: "RESET_ON_CLOSE" };

function avatarPickerReducer(state: AvatarPickerState, action: AvatarPickerAction): AvatarPickerState {
    switch (action.type) {
        case "SET_AVATAR":
            return { ...state, selectedAvatar: action.payload };
        case "SET_COLOR":
            return { ...state, selectedColor: action.payload };
        case "SET_UPLOADING":
            return { ...state, isUploading: action.payload };
        case "SET_UPDATING":
            return { ...state, isUpdating: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload };
        case "SET_PAGE":
            return { ...state, currentPage: action.payload };
        case "RESET_FROM_PROPS":
            return {
                ...state,
                selectedAvatar: action.payload.avatar,
                selectedColor: action.payload.color || "#171717"
            };
        case "RESET_ON_CLOSE":
            return {
                ...state,
                isUpdating: false,
                error: null
            };
        default:
            return state;
    }
}

export function AvatarPicker({ isOpen, onClose, currentAvatarUrl, currentBgColor, onSelect, onProfileUpdate }: AvatarPickerProps) {
    const { profile, loading, refreshProfile } = useAuth();
    
    const [state, dispatch] = useReducer(avatarPickerReducer, {
        selectedAvatar: currentAvatarUrl,
        selectedColor: currentBgColor || "#171717",
        isUploading: false,
        isUpdating: false,
        error: null,
        currentPage: 0
    });
    
    const supabase = createClient();

    // Sync local state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            dispatch({ type: "RESET_FROM_PROPS", payload: { avatar: currentAvatarUrl, color: currentBgColor } });
        } else {
            // Reset state when closed to avoid "stuck" state if opened again
            dispatch({ type: "RESET_ON_CLOSE" });
        }
    }, [isOpen, currentAvatarUrl, currentBgColor]);

    const defaultAvatars = useMemo(() => 
        Array.from({ length: DEFAULT_AVATARS_COUNT }, (_, i) => `${BUCKET_URL}${i + 3}.png`), 
    []);

    const totalPages = useMemo(() => {
        const remaining = defaultAvatars.length - 3;
        return 1 + Math.ceil(remaining / 4);
    }, [defaultAvatars]);
    
    const paginatedAvatars = useMemo(() => {
        if (state.currentPage === 0) {
            return defaultAvatars.slice(0, 3);
        }
        const start = 3 + (state.currentPage - 1) * 4;
        return defaultAvatars.slice(start, start + 4);
    }, [state.currentPage, defaultAvatars]);

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

        if (!profile) {
            toast.error("Profile not loaded. Please try again in a moment.");
            console.error("[AvatarPicker] No profile found");
            return;
        }

        dispatch({ type: "SET_UPDATING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });

        try {
            console.log("[AvatarPicker] Updating profile...", { 
                id: profile.id, 
                avatar_url: state.selectedAvatar, 
                avatar_bg_color: state.selectedColor 
            });

            const { error: updateError } = await supabase
                .from("profiles")
                .update({ 
                    avatar_url: state.selectedAvatar,
                    avatar_bg_color: state.selectedColor 
                })
                .eq("id", profile.id);

            if (updateError) throw updateError;

            console.log("[AvatarPicker] Profile updated in DB, refreshing context...");
            
            // Call refreshProfile but handle potential hangs
            try {
                // Set a timeout for refreshProfile just in case
                const refreshPromise = refreshProfile();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Refresh timeout")), 5000)
                );
                
                await Promise.race([refreshPromise, timeoutPromise]);
            } catch (refreshErr) {
                console.warn("[AvatarPicker] Profile refresh took too long or failed:", refreshErr);
                // We still continue because the DB update was successful
            }

            toast.success("Profile appearance updated");
            onProfileUpdate?.();
            onClose();
        } catch (err: any) {
            console.error("[AvatarPicker] Failed to update avatar:", err);
            const msg = err.message || "Failed to update appearance. Please try again.";
            dispatch({ type: "SET_ERROR", payload: msg });
            toast.error(msg);
        } finally {
            dispatch({ type: "SET_UPDATING", payload: false });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`
            });
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
            dispatch({ type: "SET_AVATAR", payload: data.avatarUrl });
            await refreshProfile();
        } catch (err: any) {
            console.error("Upload error:", err);
            dispatch({ type: "SET_ERROR", payload: err.message || "Failed to upload avatar" });
        } finally {
            dispatch({ type: "SET_UPLOADING", payload: false });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl h-[600px] flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/90 shadow-[0_40px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                >
                    {/* Visual Preview Pane */}
                    <div className="w-full md:w-[300px] shrink-0 bg-gradient-to-b from-white/[0.03] to-transparent p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative group">
                        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] transition-colors duration-700" style={{ "--primary": state.selectedColor } as any} />
                        </div>
                        
                        <div className="relative z-10 mb-8">
                            <div 
                                className="size-40 rounded-[2.5rem] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 overflow-hidden relative transition-all duration-700 ease-out group-hover:scale-105"
                                style={{ backgroundColor: state.selectedColor }}
                            >
                                {state.selectedAvatar ? (
                                    <motion.img 
                                        key={state.selectedAvatar}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        src={state.selectedAvatar} 
                                        alt="Preview" 
                                        className="h-full w-full object-cover relative z-10" 
                                    />
                                ) : (
                                    <div className="h-full w-full bg-white/5 animate-pulse" />
                                )}
                                <div className="absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 px-3.5 py-1 rounded-full shadow-xl flex items-center gap-2"
                            >
                                <div className="size-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: state.selectedColor }} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90 font-mono">{state.selectedColor.toUpperCase()}</span>
                            </motion.div>
                        </div>

                        <div className="w-full space-y-4 relative z-10">
                            <button
                                onClick={handleSave}
                                disabled={state.isUpdating || !state.selectedAvatar || loading}
                                className="group relative w-full flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-[0_15px_30px_-5px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_-5px_rgba(var(--primary-rgb),0.4)] active:scale-95 disabled:opacity-50 overflow-hidden"
                            >
                                {state.isUpdating || (loading && !profile) ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                                <span>{state.isUpdating ? "Saving..." : (loading && !profile ? "Loading..." : "Save Profile")}</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-1 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Controls Pane */}
                    <div className="flex-1 flex flex-col bg-black/40 min-h-0 p-8 space-y-12">
                        {state.error && (
                            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-[10px] font-black text-red-400">
                                {state.error}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Profile Photo</h3>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={`avatar-page-${i}`}
                                            onClick={() => dispatch({ type: "SET_PAGE", payload: i })}
                                            className={cn(
                                                "h-1 w-2.5 rounded-full transition-all",
                                                state.currentPage === i ? "bg-primary w-5" : "bg-white/10 hover:bg-white/20"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="relative group/grid px-4">
                                <div className="min-h-[100px]">
                                    <AnimatePresence mode="wait">
                                        <motion.div 
                                            key={state.currentPage}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-4 gap-4"
                                        >
                                            {state.currentPage === 0 && (
                                                <label className="group relative aspect-square flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.02] transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95">
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={state.isUploading} />
                                                    {state.isUploading ? <Loader2 className="size-5 animate-spin text-primary" /> : <Upload className="size-4 text-zinc-500 group-hover:text-primary transition-colors" />}
                                                </label>
                                            )}

                                            {paginatedAvatars.map((url, idx) => {
                                                const isSelected = state.selectedAvatar === url;
                                                return (
                                                    <button
                                                        key={url}
                                                        onClick={() => dispatch({ type: "SET_AVATAR", payload: url })}
                                                        className={cn(
                                                            "group relative aspect-square overflow-hidden rounded-2xl bg-white/[0.03] transition-all hover:scale-[1.05] active:scale-95",
                                                            isSelected ? "ring-2 ring-primary bg-primary/10 shadow-xl" : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        <Image src={url} alt="Avatar" sizes="100px" className={cn("object-cover transition-transform duration-500", isSelected ? "scale-110" : "group-hover:scale-110")} fill />
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                                <div className="bg-primary rounded-full p-1 shadow-xl border border-white/20">
                                                                    <Check className="size-3 text-white" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                
                                <div className="absolute inset-y-0 -left-2 flex items-center">
                                    <button 
                                        onClick={() => dispatch({ type: "SET_PAGE", payload: Math.max(0, state.currentPage - 1) })}
                                        disabled={state.currentPage === 0}
                                        className="p-1.5 rounded-full bg-[#171717] border border-white/10 hover:bg-white/5 disabled:opacity-0 transition-all shadow-xl"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                </div>
                                <div className="absolute inset-y-0 -right-2 flex items-center">
                                    <button 
                                        onClick={() => dispatch({ type: "SET_PAGE", payload: Math.min(totalPages - 1, state.currentPage + 1) })}
                                        disabled={state.currentPage === totalPages - 1}
                                        className="p-1.5 rounded-full bg-[#171717] border border-white/10 hover:bg-white/5 disabled:opacity-0 transition-all shadow-xl"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Color Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Background Color</h3>
                                <button 
                                    onClick={() => dispatch({ type: "SET_COLOR", payload: "#171717" })}
                                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity flex items-center gap-1.5"
                                >
                                    <RefreshCcw className="size-2.5" />
                                    Reset
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="custom-color-picker-container rounded-2xl overflow-hidden border border-white/10 p-3 bg-white/[0.02] shadow-xl">
                                        <HexColorPicker 
                                            color={state.selectedColor} 
                                            onChange={(color) => dispatch({ type: "SET_COLOR", payload: color })} 
                                            className="!w-full !h-36"
                                        />
                                    </div>
                                    <div className="h-10 w-full rounded-xl bg-white/5 border border-white/10 flex items-center px-3 gap-2 focus-within:border-primary/40 transition-colors">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase font-mono">HEX</span>
                                        <input 
                                            type="text" 
                                            value={state.selectedColor.toUpperCase()}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                                                    dispatch({ type: "SET_COLOR", payload: val });
                                                }
                                            }}
                                            className="bg-transparent border-none outline-none text-[10px] font-mono font-black text-white w-full uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-3">
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => dispatch({ type: "SET_COLOR", payload: color })}
                                                className={cn(
                                                    "aspect-square rounded-xl border transition-all hover:scale-110 relative",
                                                    state.selectedColor === color ? "border-primary scale-110 shadow-lg" : "border-white/5 hover:border-white/20"
                                                )}
                                                style={{ backgroundColor: color }}
                                            >
                                                {state.selectedColor === color && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Check className="size-3 text-white drop-shadow-md" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </motion.div>
                
                <style>{`
                    .custom-color-picker-container .react-colorful {
                        width: 100% !important;
                        height: 180px !important;
                        border-radius: 16px !important;
                    }
                    .custom-color-picker-container .react-colorful__saturation {
                        border-bottom: none !important;
                        border-radius: 16px 16px 0 0 !important;
                    }
                    .custom-color-picker-container .react-colorful__hue {
                        height: 14px !important;
                        border-radius: 0 0 16px 16px !important;
                    }
                    .custom-color-picker-container .react-colorful__pointer {
                        width: 20px !important;
                        height: 20px !important;
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
}

