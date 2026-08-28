"use client";

import React, { useState, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Link2,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const CURATED_BANNER_PRESETS = [
  {
    id: "glass_tower",
    name: "Modern Glass High-Rise",
    category: "Commercial & High-Rise",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "contemporary_apartments",
    name: "Urban Residential Complex",
    category: "Apartments",
    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "scandinavian_studio",
    name: "Minimalist Loft & Studio",
    category: "Lofts & Dorms",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "warm_townhouse",
    name: "Warm Brick Townhouses",
    category: "Townhouses & Units",
    url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "tropical_oasis",
    name: "Tropical Residential Oasis",
    category: "Villa & Estates",
    url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "obsidian_skyline",
    name: "Obsidian Metropolis Skyline",
    category: "Night Skyline",
    url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2070&auto=format&fit=crop",
  },
];

export const DEFAULT_BANNER_URL = CURATED_BANNER_PRESETS[0].url;

interface BannerCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBanner: string;
  onBannerChange: (newBannerUrl: string) => void;
}

export function BannerCustomizerModal({
  isOpen,
  onClose,
  currentBanner,
  onBannerChange,
}: BannerCustomizerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBanner, setSelectedBanner] = useState(currentBanner);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Sync with currentBanner when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedBanner(currentBanner);
    }
  }, [isOpen, currentBanner]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large. Maximum size is 8MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedBanner(dataUrl);
      setIsUploading(false);
      toast.success("Custom banner photo loaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setSelectedBanner(customUrlInput.trim());
    toast.success("Image URL applied!");
    setCustomUrlInput("");
  };

  const handleSave = () => {
    onBannerChange(selectedBanner);
    try {
      localStorage.setItem("ireside_landlord_custom_banner_url", selectedBanner);
      window.dispatchEvent(new CustomEvent("banner-updated", { detail: selectedBanner }));
    } catch {
      // Ignore storage errors
    }
    toast.success("Dashboard banner updated successfully!");
    onClose();
  };

  const handleReset = () => {
    setSelectedBanner(DEFAULT_BANNER_URL);
    onBannerChange(DEFAULT_BANNER_URL);
    try {
      localStorage.removeItem("ireside_landlord_custom_banner_url");
      window.dispatchEvent(new CustomEvent("banner-updated", { detail: DEFAULT_BANNER_URL }));
    } catch {
      // Ignore storage errors
    }
    toast.info("Banner restored to default glass high-rise.");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png, image/jpeg, image/webp, image/jpg"
        className="hidden"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Camera className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                Customize Dashboard Banner
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upload your property photography or choose from curated architect presets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Live Banner Preview Card */}
        <div className="relative h-32 sm:h-36 w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedBanner}
            alt="Banner Preview"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded w-fit mb-1">
              Active Preview
            </span>
            <p className="text-xs font-bold text-white">
              Welcome back, Landlord · Dashboard Header Preview
            </p>
          </div>
        </div>

        {/* Upload Custom Action */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <Upload className="size-4 text-primary" />
            <span>{isUploading ? "Loading photo..." : "Upload Property Photo (PNG / JPG)"}</span>
          </button>

          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs">
              <Link2 className="size-3.5 text-zinc-400 shrink-0" />
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Or paste direct image URL…"
                className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 dark:text-zinc-100 focus:ring-0"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              disabled={!customUrlInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all active:scale-95"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Curated Presets Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Curated Property Architecture Presets</span>
            </label>
            <span className="text-[10px] text-zinc-400">High Definition</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CURATED_BANNER_PRESETS.map((preset) => {
              const isSelected = selectedBanner === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedBanner(preset.url)}
                  className={cn(
                    "relative h-20 rounded-xl overflow-hidden text-left border-2 transition-all group active:scale-95",
                    isSelected
                      ? "border-primary shadow-md ring-2 ring-primary/20"
                      : "border-transparent opacity-75 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                    <p className="text-[10px] font-bold text-white truncate leading-tight">
                      {preset.name}
                    </p>
                    <span className="text-[8px] text-zinc-300 truncate opacity-80">
                      {preset.category}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
            >
              <Check className="size-3.5 stroke-[3]" />
              <span>Apply Banner Photo</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
