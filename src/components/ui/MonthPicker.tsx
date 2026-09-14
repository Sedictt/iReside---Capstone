"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
	value?: string; // "YYYY-MM", e.g. "2026-09"
	onChange: (value: string) => void;
	className?: string;
	align?: "left" | "right";
}

const MONTH_NAMES_SHORT = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_FULL = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

function parseYearMonth(val?: string): { year: number; month: number } {
	if (!val || !val.includes("-")) {
		const now = new Date();
		return { year: now.getFullYear(), month: now.getMonth() };
	}
	const [yStr, mStr] = val.split("-");
	const y = parseInt(yStr, 10);
	const m = parseInt(mStr, 10) - 1; // 0-indexed
	return {
		year: isNaN(y) ? new Date().getFullYear() : y,
		month: isNaN(m) ? new Date().getMonth() : Math.max(0, Math.min(11, m))
	};
}

function formatYearMonth(year: number, month: number): string {
	const mm = String(month + 1).padStart(2, "0");
	return `${year}-${mm}`;
}

export function MonthPicker({
	value,
	onChange,
	className,
	align = "right"
}: MonthPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const parsed = parseYearMonth(value);
	const [viewYear, setViewYear] = useState(parsed.year);

	// Synchronize viewYear when value changes externally
	useEffect(() => {
		setViewYear(parsed.year);
	}, [parsed.year]);

	// Close on outside click or Escape
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const handlePrevMonth = useCallback(() => {
		let newMonth = parsed.month - 1;
		let newYear = parsed.year;
		if (newMonth < 0) {
			newMonth = 11;
			newYear -= 1;
		}
		onChange(formatYearMonth(newYear, newMonth));
	}, [parsed, onChange]);

	const handleNextMonth = useCallback(() => {
		let newMonth = parsed.month + 1;
		let newYear = parsed.year;
		if (newMonth > 11) {
			newMonth = 0;
			newYear += 1;
		}
		onChange(formatYearMonth(newYear, newMonth));
	}, [parsed, onChange]);

	const handleSelectMonth = (monthIndex: number) => {
		onChange(formatYearMonth(viewYear, monthIndex));
		setIsOpen(false);
	};

	const handleSetThisMonth = () => {
		const now = new Date();
		setViewYear(now.getFullYear());
		onChange(formatYearMonth(now.getFullYear(), now.getMonth()));
		setIsOpen(false);
	};

	const now = new Date();
	const isCurrentMonth = parsed.year === now.getFullYear() && parsed.month === now.getMonth();

	return (
		<div ref={containerRef} className={cn("relative z-50 inline-flex items-center", className)}>
			{/* Combined Stepper & Trigger Box */}
			<div className="flex h-9.5 items-center rounded-xl border border-border/70 bg-card/60 shadow-sm transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
				{/* Step Previous Month */}
				<button
					type="button"
					onClick={handlePrevMonth}
					className="flex h-full w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-l-xl transition-colors cursor-pointer"
					title="Previous Month"
					aria-label="Previous month"
				>
					<ChevronLeft className="size-3.5" />
				</button>

				<div className="h-4 w-px bg-border/60 shrink-0" />

				{/* Main Trigger Button */}
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					className="flex h-full items-center gap-1.5 px-2.5 text-xs font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
					title="Open Month Picker"
					aria-haspopup="dialog"
					aria-expanded={isOpen}
				>
					<Calendar className="size-3.5 text-primary shrink-0" />
					<span className="whitespace-nowrap">
						{MONTH_NAMES_SHORT[parsed.month]} {parsed.year}
					</span>
					<ChevronDown className={cn("size-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
				</button>

				<div className="h-4 w-px bg-border/60 shrink-0" />

				{/* Step Next Month */}
				<button
					type="button"
					onClick={handleNextMonth}
					className="flex h-full w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-r-xl transition-colors cursor-pointer"
					title="Next Month"
					aria-label="Next month"
				>
					<ChevronRight className="size-3.5" />
				</button>
			</div>

			{/* Month Picker Popover */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 6 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 6 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
						className={cn(
							"absolute top-full mt-2 z-[100] w-64 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xl text-foreground",
							align === "right" ? "right-0" : "left-0"
						)}
						role="dialog"
						aria-label="Select billing month"
					>
						{/* Popover Header: Year Selector */}
						<div className="flex items-center justify-between pb-3 border-b border-border/60">
							<button
								type="button"
								onClick={() => setViewYear((y) => y - 1)}
								className="flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
								title="Previous Year"
								aria-label="Previous year"
							>
								<ChevronLeft className="size-3.5" />
							</button>

							<span className="text-xs font-bold tracking-wider text-foreground">
								{viewYear}
							</span>

							<button
								type="button"
								onClick={() => setViewYear((y) => y + 1)}
								className="flex size-7 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
								title="Next Year"
								aria-label="Next year"
							>
								<ChevronRight className="size-3.5" />
							</button>
						</div>

						{/* Month Grid (3x4) */}
						<div className="grid grid-cols-3 gap-1.5 py-3">
							{MONTH_NAMES_SHORT.map((name, idx) => {
								const isSelected = parsed.year === viewYear && parsed.month === idx;
								const isCurrent = now.getFullYear() === viewYear && now.getMonth() === idx;

								return (
									<button
										key={name}
										type="button"
										onClick={() => handleSelectMonth(idx)}
										className={cn(
											"flex h-9 items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer",
											isSelected
												? "bg-primary text-primary-foreground font-bold shadow-sm"
												: isCurrent
													? "bg-primary/10 text-primary font-semibold border border-primary/30 hover:bg-primary/20"
													: "text-foreground hover:bg-muted/60 hover:text-foreground"
										)}
									>
										{name}
									</button>
								);
							})}
						</div>

						{/* Quick Action Footer */}
						<div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px]">
							<span className="text-muted-foreground">
								{MONTH_NAMES_FULL[parsed.month]} {parsed.year}
							</span>
							<button
								type="button"
								onClick={handleSetThisMonth}
								disabled={isCurrentMonth}
								className="font-semibold text-primary hover:underline disabled:opacity-40 disabled:hover:no-underline cursor-pointer"
							>
								This Month
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
