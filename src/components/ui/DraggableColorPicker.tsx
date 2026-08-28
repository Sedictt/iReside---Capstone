"use client";

import React, { useRef } from "react";
import { m as motion, AnimatePresence, useDragControls } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import { X, Pipette, GripVertical, Check, Sliders } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraggableColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  color: string;
  onChangeColor: (hex: string) => void;
  opacity?: number; // 10 to 100
  onChangeOpacity?: (val: number) => void;
  presetColors?: { label?: string; hex: string }[];
}

export function DraggableColorPicker({
  isOpen,
  onClose,
  title,
  color,
  onChangeColor,
  opacity,
  onChangeOpacity,
  presetColors = [
    { hex: "#ffffff" },
    { hex: "#18181f" },
    { hex: "#334155" },
    { hex: "#8b5cf6" },
    { hex: "#2563eb" },
    { hex: "#059669" },
    { hex: "#d97706" },
    { hex: "#e11d48" },
  ],
}: DraggableColorPickerProps) {
  const dragControls = useDragControls();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.92, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed top-24 right-8 z-[160] w-64 neumorphic-panel rounded-2xl border border-border/60 shadow-2xl p-3.5 bg-background/95 backdrop-blur-xl flex flex-col gap-3 print:hidden select-none"
      >
        {/* Dedicated Drag Handle Header (ONLY this area initiates dragging) */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex items-center justify-between pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing hover:bg-muted/20 rounded-t-lg -mx-1 px-1 py-0.5 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
            <GripVertical className="size-3.5 text-muted-foreground" />
            <Pipette className="size-3.5 text-primary" />
            <span className="text-[11px] truncate max-w-[140px]">{title}</span>
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="size-6 rounded-lg neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <X className="size-3" />
          </button>
        </div>

        {/* Compact HexColorPicker - Pointer events are isolated */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="mini-colorful-container rounded-xl overflow-hidden border border-border/40 p-1.5 bg-muted/20"
        >
          <HexColorPicker
            color={color}
            onChange={onChangeColor}
          />
        </div>

        {/* Color HEX Input */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          <div
            className="size-6 rounded-md shadow-xs border border-white/20 shrink-0 transition-colors"
            style={{ backgroundColor: color }}
          />

          <div className="flex-1 neumorphic-inset rounded-lg h-7 px-2 flex items-center justify-between border border-border/40">
            <span className="text-[9px] font-mono font-bold text-muted-foreground">HEX</span>
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => {
                let val = e.target.value;
                if (!val.startsWith("#")) val = "#" + val;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onChangeColor(val);
                }
              }}
              className="bg-transparent text-right font-mono font-black text-[11px] text-foreground uppercase outline-none w-20"
              maxLength={7}
            />
          </div>
        </div>

        {/* Opacity Slider */}
        {opacity !== undefined && onChangeOpacity !== undefined && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="flex flex-col gap-1 neumorphic-inset rounded-xl p-2"
          >
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sliders className="size-2.5" />
                <span>Surface Opacity</span>
              </span>
              <span className="font-mono font-bold text-foreground w-9 text-right tabular-nums inline-block shrink-0">
                {opacity}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={opacity}
              onChange={(e) => onChangeOpacity(Number(e.target.value))}
              className="w-full h-1 rounded appearance-none cursor-pointer bg-muted"
            />
          </div>
        )}

        {/* Mini Swatches */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="grid grid-cols-8 gap-1 pt-1 border-t border-border/30"
        >
          {presetColors.map((p) => (
            <button
              key={p.hex}
              type="button"
              title={p.hex}
              onClick={() => onChangeColor(p.hex)}
              className={cn(
                "size-5 rounded-md border border-white/20 transition-transform active:scale-95 relative flex items-center justify-center",
                color.toLowerCase() === p.hex.toLowerCase() && "scale-110 ring-2 ring-primary ring-offset-1"
              )}
              style={{ backgroundColor: p.hex }}
            >
              {color.toLowerCase() === p.hex.toLowerCase() && (
                <Check className="size-2.5 text-zinc-900 stroke-[3]" />
              )}
            </button>
          ))}
        </div>

        <style jsx global>{`
          .mini-colorful-container .react-colorful {
            width: 100% !important;
            height: 100px !important;
            border-radius: 10px !important;
          }
          .mini-colorful-container .react-colorful__saturation {
            border-radius: 8px 8px 0 0 !important;
          }
          .mini-colorful-container .react-colorful__hue {
            height: 10px !important;
            border-radius: 0 0 8px 8px !important;
            margin-top: 6px !important;
          }
          .mini-colorful-container .react-colorful__pointer {
            width: 16px !important;
            height: 16px !important;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
