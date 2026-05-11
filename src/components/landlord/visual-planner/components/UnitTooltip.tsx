import React from "react";
import { m as motion } from "framer-motion";
import { Unit } from "../types";

interface UnitTooltipProps {
    unit: Unit;
    onClose: () => void;
    onAction: (action: "transfer" | "complain") => void;
    isDark: boolean;
}

export const UnitTooltip = ({
    unit,
    onClose,
    onAction,
    isDark
}: UnitTooltipProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`absolute z-50 min-w-[220px] rounded-2xl border border-white/10 bg-[#1a1c23]/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] pointer-events-auto`}
            data-tooltip="true"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
                left: unit.x + unit.w / 2,
                top: unit.y - 10,
                transform: "translateX(-50%) translateY(-100%)"
            }}
        >
            <div className="flex flex-col gap-1">
                <div className="px-3 py-2 mb-1 border-b border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Unit {unit.name}</p>
                    <p className="text-xs font-bold text-white mt-0.5">Quick Actions</p>
                </div>
                
                {unit.status === 'vacant' && (
                    <button
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
                            <p className="text-xs font-bold tracking-tight">Transfer Request</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Move into this unit</p>
                        </div>
                    </button>
                )}

                <button
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
                        <p className="text-xs font-bold tracking-tight">Report / Complain</p>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">Report an issue</p>
                    </div>
                </button>
            </div>

            {/* Tooltip arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 size-3 bg-[#1a1c23] rotate-45 border-r border-b border-white/10" />
        </motion.div>
    );
};
