"use client";

import { useState, useRef, useEffect } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    value?: string | null; // "HH:mm" (24h format, e.g. "22:00")
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: "sm" | "md";
    presets?: string[]; // e.g. ["20:00", "21:00", "22:00", "23:00", "00:00"]
}

// Helper to convert 24h "HH:mm" to { hour: 1-12, minute: "00"-"59", period: "AM"|"PM" }
function parse24HourTime(timeStr?: string | null) {
    if (!timeStr || !timeStr.includes(":")) {
        return { hour: 10, minute: "00", period: "PM" as const };
    }
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.padStart(2, "0").slice(0, 2) : "00";

    if (isNaN(h)) h = 10;
    const period = h >= 12 ? ("PM" as const) : ("AM" as const);
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;

    return { hour: hour12, minute: m, period };
}

// Helper to convert { hour: 1-12, minute: "00"-"59", period: "AM"|"PM" } to 24h "HH:mm"
function formatTo24HourTime(hour: number, minute: string, period: "AM" | "PM"): string {
    let h = hour;
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h < 12) h += 12;
    const minInt = Math.max(0, Math.min(59, parseInt(minute, 10) || 0));
    return `${h.toString().padStart(2, "0")}:${minInt.toString().padStart(2, "0")}`;
}

// Format "HH:mm" to "10:00 PM"
export function formatDisplayTime(timeStr?: string | null): string {
    if (!timeStr) return "--:--";
    const { hour, minute, period } = parse24HourTime(timeStr);
    return `${hour}:${minute} ${period}`;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_PRESETS = ["00", "15", "30", "45"];
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

    const handleHourChange = (newHour: number) => {
        const clamped = Math.max(1, Math.min(12, newHour));
        setSelectedHour(clamped);
        onChange(formatTo24HourTime(clamped, selectedMinute, selectedPeriod));
    };

    const handleMinuteChange = (newMinuteStr: string) => {
        const sanitized = newMinuteStr.replace(/\D/g, "").slice(0, 2);
        setSelectedMinute(sanitized);
        if (sanitized.length > 0) {
            const num = Math.min(59, parseInt(sanitized, 10));
            onChange(formatTo24HourTime(selectedHour, num.toString().padStart(2, "0"), selectedPeriod));
        }
    };

    const handleMinuteBlur = () => {
        const num = Math.max(0, Math.min(59, parseInt(selectedMinute, 10) || 0));
        const formatted = num.toString().padStart(2, "0");
        setSelectedMinute(formatted);
        onChange(formatTo24HourTime(selectedHour, formatted, selectedPeriod));
    };

    const handleTogglePeriod = (p: "AM" | "PM") => {
        setSelectedPeriod(p);
        onChange(formatTo24HourTime(selectedHour, selectedMinute, p));
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
                        className="neumorphic-panel absolute right-0 top-full z-50 mt-2 w-80 rounded-3xl border border-white/10 p-4 shadow-2xl backdrop-blur-2xl"
                    >
                        {/* Direct Editable Time Digits (Type Any Precise Time) */}
                        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 border border-white/5">
                            <div className="flex items-center gap-1.5">
                                {/* Editable Hour Input */}
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={selectedHour}
                                        onChange={(e) => handleHourChange(parseInt(e.target.value, 10) || 1)}
                                        className="neumorphic-inset size-10 rounded-xl text-center text-lg font-black text-white outline-none focus:ring-2 focus:ring-primary/50"
                                        title="Type exact hour (1-12)"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 mt-1">Hour</span>
                                </div>

                                <span className="text-xl font-bold text-primary mb-3.5">:</span>

                                {/* Editable Minute Input */}
                                <div className="flex flex-col items-center">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={2}
                                        value={selectedMinute}
                                        onChange={(e) => handleMinuteChange(e.target.value)}
                                        onBlur={handleMinuteBlur}
                                        className="neumorphic-inset size-10 rounded-xl text-center text-lg font-black text-white outline-none focus:ring-2 focus:ring-primary/50"
                                        title="Type exact minute (00-59)"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-neutral-500 mt-1">Min</span>
                                </div>
                            </div>

                            {/* AM / PM Segmented Control */}
                            <div className="neumorphic-inset flex rounded-xl p-0.5 border border-white/5 self-start mt-1">
                                {(["AM", "PM"] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => handleTogglePeriod(p)}
                                        className={cn(
                                            "rounded-lg px-3 py-1.5 text-xs font-black tracking-wider transition-all",
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
                                Quick Pick
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
                                            onClick={() => handleHourChange(h)}
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

                        {/* Minute Presets */}
                        <div className="border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                    Minute Intervals
                                </p>
                                <span className="text-[9px] text-neutral-500 font-medium">Or type above</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {MINUTE_PRESETS.map((m) => {
                                    const isSelected = selectedMinute === m;
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => handleMinuteChange(m)}
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
                                className="w-full rounded-xl bg-white/10 py-2 text-center text-xs font-bold text-white hover:bg-primary hover:text-black transition-colors"
                            >
                                Apply Time
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
