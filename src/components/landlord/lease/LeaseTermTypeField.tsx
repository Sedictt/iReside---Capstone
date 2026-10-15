"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import { CalendarRange, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import {
    addMonthsIso,
    termLengthMonths,
    toIsoDate,
    type LeaseTermType,
} from "@/lib/lease-term";

/** Visual tone: `theme` follows the app tokens; `dark` matches the hard-coded dark contract modals. */
export type LeaseTermFieldAppearance = "theme" | "dark";

interface LeaseTermTypeFieldProps {
    value: LeaseTermType;
    onChange: (value: LeaseTermType) => void;
    disabled?: boolean;
    /** Tighter padding and a single-line helper for side-by-side layouts. */
    compact?: boolean;
    appearance?: LeaseTermFieldAppearance;
    /** Visible label above the options. Pass `null` to hide it. */
    label?: string | null;
    className?: string;
    id?: string;
}

const OPTIONS: Array<{
    value: LeaseTermType;
    title: string;
    helper: string;
    icon: typeof InfinityIcon;
    recommended?: boolean;
}> = [
    {
        value: "open_ended",
        title: "Open-ended",
        helper: "Month-to-month. Tenant stays as long as rent is paid; ends through move-out with 30 days' notice.",
        icon: InfinityIcon,
        recommended: true,
    },
    {
        value: "fixed",
        title: "Fixed term",
        helper: "Set an end date. Renewal reminders apply.",
        icon: CalendarRange,
    },
];

/**
 * Two-option choice between an open-ended (default) and a fixed-term lease.
 * Consumers reveal their end-date input only when `value === "fixed"`.
 */
export function LeaseTermTypeField({
    value,
    onChange,
    disabled = false,
    compact = false,
    appearance = "theme",
    label = "Lease Term",
    className,
    id = "lease-term-type",
}: LeaseTermTypeFieldProps) {
    const { t } = useLanguageContext();
    const dark = appearance === "dark";

    return (
        <div className={cn("space-y-1.5", className)}>
            {label !== null && (
                <p
                    id={`${id}-label`}
                    className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        dark ? "text-neutral-300" : "text-muted-foreground/60"
                    )}
                >
                    {t(label)}
                </p>
            )}
            <div
                role="radiogroup"
                aria-labelledby={label !== null ? `${id}-label` : undefined}
                aria-label={label === null ? t("Lease term") : undefined}
                className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}
            >
                {OPTIONS.map((option) => {
                    const selected = value === option.value;
                    const Icon = option.icon;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={t(option.title)}
                            disabled={disabled}
                            onClick={() => {
                                if (!selected) onChange(option.value);
                            }}
                            className={cn(
                                "group relative flex w-full items-start gap-2.5 rounded-2xl text-left outline-none transition-all",
                                compact ? "px-3 py-2.5" : "px-3.5 py-3",
                                dark
                                    ? "border border-white/10 bg-white/5 focus-visible:ring-4 focus-visible:ring-primary/20"
                                    : "neumorphic-inset ring-primary/20 focus-visible:ring-4",
                                selected
                                    ? dark
                                        ? "border-primary/60 bg-primary/10"
                                        : "border border-primary/50 ring-4 ring-primary/15"
                                    : dark
                                        ? "hover:border-white/20"
                                        : "border border-transparent",
                                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            )}
                        >
                            <span
                                className={cn(
                                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl transition-colors",
                                    selected
                                        ? "bg-primary text-primary-foreground"
                                        : dark
                                            ? "bg-white/10 text-neutral-300"
                                            : "bg-muted text-muted-foreground"
                                )}
                            >
                                <Icon className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                    <span
                                        className={cn(
                                            "text-xs font-black",
                                            dark ? "text-white" : "text-foreground"
                                        )}
                                    >
                                        {t(option.title)}
                                    </span>
                                    {option.recommended && (
                                        <span
                                            className={cn(
                                                "rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-normal transition-colors",
                                                selected ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
                                            )}
                                        >
                                            {t("Recommended")}
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        "mt-0.5 block text-[11px] font-medium leading-snug",
                                        compact && "line-clamp-2",
                                        dark ? "text-neutral-400" : "text-muted-foreground"
                                    )}
                                >
                                    {t(option.helper)}
                                </span>
                            </span>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "mt-1 size-3.5 shrink-0 rounded-full border-2 transition-all",
                                    selected
                                        ? "border-primary bg-primary shadow-[inset_0_0_0_2px_var(--card,#fff)]"
                                        : dark
                                            ? "border-white/20"
                                            : "border-border"
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface LeaseTermRevealProps {
    /** Render children (end-date input, presets) only when true, with a smooth height reveal. */
    show: boolean;
    children: React.ReactNode;
    className?: string;
}

/** Smooth reveal for the end-date controls when a fixed term is chosen. */
export function LeaseTermReveal({ show, children, className }: LeaseTermRevealProps) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div
                    key="lease-term-reveal"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={cn("overflow-hidden", className)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export const LEASE_DURATION_PRESETS = [
    { label: "6 Mo", months: 6 },
    { label: "1 Year", months: 12 },
    { label: "2 Years", months: 24 },
] as const;

interface LeaseDurationPresetsProps {
    startDate: string;
    endDate: string;
    onSelect: (endDateIso: string) => void;
    disabled?: boolean;
    appearance?: LeaseTermFieldAppearance;
    className?: string;
}

/** Quick 6 mo / 1 yr / 2 yr chips that set the end date relative to the start date. */
export function LeaseDurationPresets({
    startDate,
    endDate,
    onSelect,
    disabled = false,
    appearance = "theme",
    className,
}: LeaseDurationPresetsProps) {
    const { t } = useLanguageContext();
    const dark = appearance === "dark";
    const currentMonths = termLengthMonths(startDate, endDate);

    return (
        <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            <span
                className={cn(
                    "mr-1 text-[10px] font-black uppercase tracking-wider",
                    dark ? "text-neutral-400" : "text-muted-foreground/60"
                )}
            >
                {t("Duration:")}
            </span>
            {LEASE_DURATION_PRESETS.map((preset) => {
                const isMatched = currentMonths !== null && currentMonths === preset.months;
                return (
                    <button
                        key={preset.label}
                        type="button"
                        disabled={disabled}
                        aria-pressed={isMatched}
                        onClick={() => {
                            const base = startDate || toIsoDate(new Date());
                            onSelect(addMonthsIso(base, preset.months));
                        }}
                        className={cn(
                            "rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all",
                            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                            isMatched
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : dark
                                    ? "border border-white/10 bg-white/5 text-neutral-300 hover:text-white"
                                    : "neumorphic-inset text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t(preset.label)}
                    </button>
                );
            })}
        </div>
    );
}
