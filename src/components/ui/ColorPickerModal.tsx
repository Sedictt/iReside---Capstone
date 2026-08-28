"use client";

import React, { useState, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { X, Check, Pipette, RotateCcw, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  color: string;
  onChange: (hex: string) => void;
  presetColors?: { label?: string; hex: string }[];
}

export function ColorPickerModal({
  isOpen,
  onClose,
  title = "Select Color",
  subtitle = "Choose a curated preset or customize your exact shade",
  color,
  onChange,
  presetColors = [
    { label: "Obsidian Slate", hex: "#18181b" },
    { label: "Royal Purple", hex: "#8b5cf6" },
    { label: "Electric Blue", hex: "#2563eb" },
    { label: "Emerald Green", hex: "#059669" },
    { label: "Sunset Amber", hex: "#d97706" },
    { label: "Crimson Rose", hex: "#e11d48" },
    { label: "Pure White", hex: "#ffffff" },
    { label: "Dark Surface", hex: "#121217" },
    { label: "Slate Blue", hex: "#334155" },
    { label: "Warm Ivory", hex: "#fafaf6" },
  ],
}: ColorPickerModalProps) {
  const [localColor, setLocalColor] = useState(color);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  const handleApply = () => {
    onChange(localColor);
    onClose();
  };

  const handleCopyHex = () => {
    navigator.clipboard.writeText(localColor.toUpperCase());
    toast.success(`Copied ${localColor.toUpperCase()} to clipboard`);
  };

  // Helper to determine text readability on top of the live color
  const isLight = (() => {
    try {
      const cleanHex = localColor.replace("#", "");
      const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
      const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
      const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 135;
    } catch {
      return true;
    }
  })();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md neumorphic-panel rounded-3xl border border-border/50 overflow-hidden shadow-2xl flex flex-col bg-background"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-8 rounded-xl flex items-center justify-center shadow-inner border border-white/10 transition-colors"
                style={{ backgroundColor: localColor }}
              >
                <Pipette className={cn("size-4", isLight ? "text-zinc-900" : "text-white")} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  {title}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Colorful Canvas Container */}
            <div className="custom-colorful-wrapper rounded-2xl overflow-hidden shadow-inner border border-border/40 p-2 bg-muted/20">
              <HexColorPicker
                color={localColor}
                onChange={(c) => {
                  setLocalColor(c);
                  onChange(c); // real-time preview
                }}
              />
            </div>

            {/* Live Color Preview & Hex Input */}
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-xl shadow-md border border-white/20 shrink-0 transition-colors flex items-center justify-center"
                style={{ backgroundColor: localColor }}
              >
                <Check className={cn("size-4", isLight ? "text-zinc-900 stroke-[3]" : "text-white stroke-[3]")} />
              </div>

              <div className="flex-1 neumorphic-inset rounded-xl h-10 px-3 flex items-center justify-between border border-border/40">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">HEX</span>
                <input
                  type="text"
                  value={localColor.toUpperCase()}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!val.startsWith("#")) val = "#" + val;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setLocalColor(val);
                      if (val.length === 7) onChange(val);
                    }
                  }}
                  className="bg-transparent text-right font-mono font-black text-xs text-foreground uppercase outline-none flex-1 ml-2"
                  maxLength={7}
                />
              </div>

              <button
                type="button"
                onClick={handleCopyHex}
                title="Copy HEX Code"
                className="size-10 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              >
                <Copy className="size-4" />
              </button>
            </div>

            {/* Presets Swatches */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Quick Presets
              </p>
              <div className="grid grid-cols-5 gap-2">
                {presetColors.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    title={p.label || p.hex}
                    onClick={() => {
                      setLocalColor(p.hex);
                      onChange(p.hex);
                    }}
                    className={cn(
                      "h-8 rounded-xl border border-white/20 transition-all active:scale-95 relative flex items-center justify-center shadow-xs",
                      localColor.toLowerCase() === p.hex.toLowerCase() && "ring-2 ring-primary ring-offset-1 scale-105"
                    )}
                    style={{ backgroundColor: p.hex }}
                  >
                    {localColor.toLowerCase() === p.hex.toLowerCase() && (
                      <Check
                        className={cn(
                          "size-3.5 stroke-[3]",
                          p.hex === "#ffffff" || p.hex === "#fafaf6" ? "text-zinc-900" : "text-white"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border/40 bg-muted/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground neumorphic-inset transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white shadow-lg active:scale-95 transition-all"
            >
              Apply Color
            </button>
          </div>
        </motion.div>

        {/* Global Styles for react-colorful */}
        <style jsx global>{`
          .custom-colorful-wrapper .react-colorful {
            width: 100% !important;
            height: 160px !important;
            border-radius: 14px !important;
          }
          .custom-colorful-wrapper .react-colorful__saturation {
            border-radius: 12px 12px 0 0 !important;
          }
          .custom-colorful-wrapper .react-colorful__hue {
            height: 14px !important;
            border-radius: 0 0 12px 12px !important;
            margin-top: 8px !important;
          }
          .custom-colorful-wrapper .react-colorful__pointer {
            width: 22px !important;
            height: 22px !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
          }
        `}</style>
      </div>
    </AnimatePresence>
  );
}
