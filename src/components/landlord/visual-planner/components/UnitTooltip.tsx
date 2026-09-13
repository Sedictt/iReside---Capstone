import React from "react";
import { m as motion } from "framer-motion";
import { Unit } from "../types";

interface UnitTooltipProps {
    unit: Unit;
    onClose: () => void;
    onAction: (action: "transfer" | "complain") => void;
    isDark: boolean;
    zoom?: number;
}

export const UnitTooltip = ({
    unit,
    onClose,
    onAction,
    isDark,
    zoom = 1,
}: UnitTooltipProps) => {
    // If unit is close to the top boundary of the blueprint, place below so it doesn't get clipped
    const isPlacedBottom = unit.y < 220;
    const invZoom = 1 / Math.max(zoom, 0.1);

    // Prevent duplicate "Unit Unit 113"
    const trimmedName = unit.name?.trim() || "";
    const unitDisplayName = trimmedName.toLowerCase().startsWith("unit")
        ? trimmedName
        : `Unit ${trimmedName}`;

    return (
        <motion.div
            data-tooltip="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 pointer-events-none"
            style={{
                left: unit.x + unit.w / 2,
                top: isPlacedBottom ? unit.y + unit.h + 12 : unit.y - 12,
            }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div
                className="pointer-events-auto relative min-w-[230px] rounded-2xl border border-white/10 bg-[#1a1c23]/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                style={{
                    transform: `translate(-50%, ${isPlacedBottom ? "0%" : "-100%"}) scale(${invZoom})`,
                    transformOrigin: isPlacedBottom ? "top center" : "bottom center",
                }}
            >
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-3 py-2 mb-1 border-b border-white/5">
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{unitDisplayName}</p>
                            <p className="text-xs font-black text-white mt-0.5">Quick Actions</p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="flex size-6 items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-2"
                            title="Close"
                        >
                            <span className="material-icons-round text-sm">close</span>
                        </button>
                    </div>
                    
                    {unit.status === 'vacant' && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction("transfer");
                                onClose();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                        >
                            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-icons-round text-lg">move_down</span>
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-tight">Transfer Request</p>
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">Move into this unit</p>
                            </div>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction("complain");
                            onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all text-left"
                    >
                        <div className="size-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                            <span className="material-icons-round text-lg">report_problem</span>
                        </div>
                        <div>
                            <p className="text-xs font-black tracking-tight">Report / Complain</p>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">Report an issue</p>
                        </div>
                    </button>
                </div>

                {/* Tooltip arrow */}
                <div 
                    className={`absolute left-1/2 -translate-x-1/2 size-3 bg-[#1a1c23] rotate-45 pointer-events-none ${
                        isPlacedBottom
                            ? "-top-[6px] border-t border-l border-white/10"
                            : "-bottom-[6px] border-r border-b border-white/10"
                    }`} 
                />
            </div>
        </motion.div>
    );
};
