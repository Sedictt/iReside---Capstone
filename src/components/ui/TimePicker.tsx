"use client";

import { useState, useRef, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { Clock, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    value?: string | null; // "HH:mm" (24h format, e.g. "22:00")
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: "sm" | "md";
    presets?: string[]; // e.g. ["20:00", "21:00", "22:00", "23:00", "00:00"]
}

// Helper to convert 24h "HH:mm" to { hour: 1-12, minute: "00"-"55", period: "AM"|"PM" }
function parse24HourTime(timeStr?: string | null) {
    if (!timeStr || !timeStr.includes(":")) {
        return { hour: 10, minute: "00", period: "PM" as const };
    }
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.padStart(2, "0") : "00";

    if (isNaN(h)) h = 10;
    const period = h >= 12 ? ("PM" as const) : ("AM" as const);
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    return { hour: hour12, minute: m, period };
}

// Helper to convert { hour: 1-12, minute: "00", period: "AM"|"PM" } to 24h "HH:mm"
function formatTo24HourTime(hour: number, minute: string, period: "AM" | "PM"): string {
    let h = hour;
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12) h += 12;
    return `${h.toString().padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

// Format "HH:mm" to "10:00 PM"
export function formatDisplayTime(timeStr?: string | null): string {
    if (!timeStr) return "--:--";
    const { hour, minute, period } = parse24HourTime(timeStr);
    return `${hour}:${minute} ${period}`;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ["00", "15", "30", "45"];
const DEFAULT_PRESETS = ["06:00", "07:00", "08:00", "20:00", "21:00", "22:00", "23:00", "00:00"];

export function TimePicker({
    value,
    onChange,
    placeholder = "Select time",
    className,
    size = "md",
    presets = DEFAULT_PRESETS,
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const parsed = parse24HourTime(value);
    const [selectedHour, setSelectedHour] = useState(parsed.hour);
    const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
    const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(parsed.period);

    // Sync internal state when external value changes
    useEffect(() => {
        const p = parse24HourTime(value);
        setSelectedHour(p.hour);
        setSelectedMinute(p.minute);
        setSelectedPeriod(p.period);
    }, [value]);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectHour = (h: number) => {
        setSelectedHour(h);
        const new24 = formatTo24HourTime(h, selectedMinute, selectedPeriod);
        onChange(new24);
    };

    const handleSelectMinute = (m: string) => {
        setSelectedMinute(m);
        const new24 = formatTo24HourTime(selectedHour, m, selectedPeriod);
        onChange(new24);
    };

    const handleTogglePeriod = (p: "AM" | "PM") => {
        setSelectedPeriod(p);
        const new24 = formatTo24HourTime(selectedHour, selectedMinute, p);
        onChange(new24);
    };

    const handlePresetClick = (preset24: string) => {
        const p = parse24HourTime(preset24);
        setSelectedHour(p.hour);
        setSelectedMinute(p.minute);
        setSelectedPeriod(p.period);
        onChange(preset24);
    };

    return (
        <div ref={containerRef} className={cn("relative inline-block", className)}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "neumorphic-inset flex items-center justify-between gap-2.5 rounded-xl border border-white/5 px-3 py-2 text-xs font-bold text-white transition-all hover:border-white/20 active:scale-[0.98]",
                    size === "sm" ? "py-1.5 px-2.5 text-[11px]" : "py-2 px-3 text-xs",
                    isOpen && "border-primary/50 ring-2 ring-primary/20",
                    !value && "text-neutral-400"
                )}
            >
                <div className="flex items-center gap-2">
                    <Clock className={cn("size-3.5 text-primary", size === "sm" && "size-3")} />
                    <span>{value ? formatDisplayTime(value) : placeholder}</span>
                </div>
                <ChevronDown
                    className={cn(
                        "size-3 text-neutral-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-primary"
                    )}
                />
            </button>

            {/* Popover Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="neumorphic-panel absolute right-0 top-full z-50 mt-2 w-72 rounded-3xl border border-white/10 p-4 shadow-2xl backdrop-blur-2xl"
                    >
                        {/* Time Display Header */}
                        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/[0.03] p-2.5 border border-white/5">
                            <div className="flex items-center gap-1">
                                <span className="text-xl font-black text-white">
                                    {selectedHour.toString().padStart(2, "0")}
                                </span>
                                <span className="text-lg font-bold text-primary animate-pulse">:</span>
                                <span className="text-xl font-black text-white">{selectedMinute}</span>
                            </div>

                            {/* AM / PM Segmented Control */}
                            <div className="neumorphic-inset flex rounded-xl p-0.5 border border-white/5">
                                {(["AM", "PM"] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleTogglePeriod(p)}
                                        className={cn(
                                            "rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider transition-all",
                                            selectedPeriod === p
                                                ? "bg-primary text-black shadow-sm"
                                                : "text-neutral-400 hover:text-white"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="mb-3">
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                Common Hours
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {presets.map((preset) => {
                                    const isCurrent = value === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => handlePresetClick(preset)}
                                            className={cn(
                                                "rounded-lg px-2 py-1 text-[10px] font-bold transition-all",
                                                isCurrent
                                                    ? "bg-primary text-black"
                                                    : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {formatDisplayTime(preset)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Hours Grid */}
                        <div className="mb-3 border-t border-white/5 pt-3">
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                Hour
                            </p>
                            <div className="grid grid-cols-6 gap-1">
                                {HOURS.map((h) => {
                                    const isSelected = selectedHour === h;
                                    return (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => handleSelectHour(h)}
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-all",
                                                isSelected
                                                    ? "bg-primary text-black font-black shadow-md shadow-primary/20"
                                                    : "bg-white/[0.02] text-neutral-300 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {h}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Minutes Grid */}
                        <div className="border-t border-white/5 pt-3">
                            <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                Minute
                            </p>
                            <div className="grid grid-cols-4 gap-1.5">
                                {MINUTES.map((m) => {
                                    const isSelected = selectedMinute === m;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleSelectMinute(m)}
                                            className={cn(
                                                "flex h-7 items-center justify-center rounded-xl text-xs font-bold transition-all",
                                                isSelected
                                                    ? "bg-primary text-black font-black shadow-md shadow-primary/20"
                                                    : "bg-white/[0.02] text-neutral-300 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            :{m}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Done Button */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="w-full rounded-xl bg-white/10 py-1.5 text-center text-xs font-bold text-white hover:bg-primary hover:text-black transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
