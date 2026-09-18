"use client";

import React, { useState } from "react";
import { Plus, X, Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomAmenities } from "@/hooks/useCustomAmenities";
import { DEFAULT_PROPERTY_AMENITIES } from "@/lib/constants/amenities";
import { toast } from "sonner";

interface PropertyAmenitiesSelectorProps {
    selectedAmenities: string[];
    onChange: (amenities: string[]) => void;
    landlordId?: string | null;
    variant?: "default" | "dark";
    className?: string;
}

export function PropertyAmenitiesSelector({
    selectedAmenities,
    onChange,
    landlordId,
    variant = "default",
    className,
}: PropertyAmenitiesSelectorProps) {
    const isDarkVariant = variant === "dark";
    const [inputValue, setInputValue] = useState("");

    const {
        defaultAmenities,
        customAmenities,
        addCustomAmenity,
        removeCustomAmenity,
    } = useCustomAmenities({
        landlordId,
        initialCustomAmenities: selectedAmenities.filter(
            (a) => !DEFAULT_PROPERTY_AMENITIES.some((d) => d.toLowerCase() === a.toLowerCase())
        ),
    });

    const toggleAmenity = (amenity: string) => {
        const isSelected = selectedAmenities.some(
            (a) => a.toLowerCase() === amenity.toLowerCase()
        );
        if (isSelected) {
            onChange(selectedAmenities.filter((a) => a.toLowerCase() !== amenity.toLowerCase()));
        } else {
            onChange([...selectedAmenities, amenity]);
        }
    };

    const handleAddCustom = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        const result = addCustomAmenity(trimmed);
        if (!result.success) {
            toast.error(result.error || "Unable to add custom amenity.");
            return;
        }

        const addedName = result.name || trimmed;
        // Automatically select the newly created amenity for this property
        if (!selectedAmenities.some((a) => a.toLowerCase() === addedName.toLowerCase())) {
            onChange([...selectedAmenities, addedName]);
        }

        setInputValue("");
        toast.success(`"${addedName}" added! It is now saved as a choice for all your properties.`);
    };

    const handleRemoveCustomChoice = (amenityName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeCustomAmenity(amenityName);
        // Also unselect it if currently selected
        if (selectedAmenities.some((a) => a.toLowerCase() === amenityName.toLowerCase())) {
            onChange(selectedAmenities.filter((a) => a.toLowerCase() !== amenityName.toLowerCase()));
        }
        toast.info(`"${amenityName}" removed from your custom choices.`);
    };

    return (
        <div
            className={cn(
                "rounded-[2rem] p-7 space-y-6 border transition-all",
                isDarkVariant
                    ? "bg-white/[0.02] border-white/10"
                    : "neumorphic-panel border-border/60",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <h3
                        className={cn(
                            "text-xs font-black uppercase tracking-[0.2em]",
                            isDarkVariant ? "text-white/60" : "text-muted-foreground"
                        )}
                    >
                        Amenities & Facilities
                    </h3>
                </div>
                <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20 uppercase tracking-widest">
                    {selectedAmenities.length} Selected
                </span>
            </div>

            {/* Standard Amenities */}
            <div className="space-y-2.5">
                <p
                    className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-1",
                        isDarkVariant ? "text-white/40" : "text-muted-foreground"
                    )}
                >
                    Standard Amenities
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {defaultAmenities.map((amenity) => {
                        const isSelected = selectedAmenities.some(
                            (a) => a.toLowerCase() === amenity.toLowerCase()
                        );
                        return (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => toggleAmenity(amenity)}
                                aria-pressed={isSelected}
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-center flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40",
                                    isSelected
                                        ? "bg-primary text-black border-primary shadow-md shadow-primary/20 font-black"
                                        : isDarkVariant
                                        ? "bg-white/5 border-white/5 text-white/40 hover:text-white/80 hover:border-white/20"
                                        : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                                )}
                            >
                                {isSelected && <Check className="size-3 shrink-0 stroke-[3]" />}
                                <span className="truncate">{amenity}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Amenities Section (if any have been remembered) */}
            {customAmenities.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between px-1">
                        <p
                            className={cn(
                                "text-[10px] font-black uppercase tracking-wider",
                                isDarkVariant ? "text-white/40" : "text-muted-foreground"
                            )}
                        >
                            Your Custom Amenities
                        </p>
                        <span
                            className={cn(
                                "text-[9px] font-medium tracking-normal",
                                isDarkVariant ? "text-white/30" : "text-muted-foreground/60"
                            )}
                        >
                            Saved for your account
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {customAmenities.map((amenity) => {
                            const isSelected = selectedAmenities.some(
                                (a) => a.toLowerCase() === amenity.toLowerCase()
                            );
                            return (
                                <div
                                    key={amenity}
                                    className="relative group flex items-center"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleAmenity(amenity)}
                                        aria-pressed={isSelected}
                                        className={cn(
                                            "w-full px-4 py-3 pr-8 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all text-left truncate flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40",
                                            isSelected
                                                ? "bg-primary text-black border-primary shadow-md shadow-primary/20 font-black"
                                                : isDarkVariant
                                                ? "bg-white/5 border-white/5 text-white/40 hover:text-white/80 hover:border-white/20"
                                                : "neumorphic-inset-card border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                                        )}
                                    >
                                        {isSelected && <Check className="size-3 shrink-0 stroke-[3]" />}
                                        <span className="truncate">{amenity}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveCustomChoice(amenity, e)}
                                        title={`Delete "${amenity}" from choices`}
                                        aria-label={`Delete custom amenity choice ${amenity}`}
                                        className={cn(
                                            "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity",
                                            isSelected
                                                ? "text-black/60 hover:text-black hover:bg-black/10"
                                                : isDarkVariant
                                                ? "text-white/40 hover:text-rose-400 hover:bg-white/10"
                                                : "text-muted-foreground hover:text-rose-500 hover:bg-muted"
                                        )}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Custom Amenity Input */}
            <div className="space-y-2 pt-2 border-t border-border/40">
                <label
                    htmlFor="custom-amenity-input"
                    className={cn(
                        "block text-[10px] font-black uppercase tracking-wider px-1",
                        isDarkVariant ? "text-white/40" : "text-muted-foreground"
                    )}
                >
                    Add Custom Amenity
                </label>
                <form onSubmit={handleAddCustom} className="flex gap-2">
                    <input
                        id="custom-amenity-input"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. Rooftop Lounge, Study Hall..."
                        maxLength={40}
                        className={cn(
                            "flex-1 rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-all",
                            isDarkVariant
                                ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                                : "neumorphic-inset text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/40 border border-border/30"
                        )}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className={cn(
                            "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
                            inputValue.trim()
                                ? "bg-primary text-black hover:brightness-105 active:scale-95 shadow-sm"
                                : "opacity-40 cursor-not-allowed bg-muted text-muted-foreground border border-border/40"
                        )}
                    >
                        <Plus className="size-3.5 stroke-[3]" />
                        <span>Add</span>
                    </button>
                </form>
                <p
                    className={cn(
                        "text-[10px] px-1",
                        isDarkVariant ? "text-white/30" : "text-muted-foreground/60"
                    )}
                >
                    Custom amenities are automatically saved to your account so you can reuse them in future properties.
                </p>
            </div>
        </div>
    );
}
