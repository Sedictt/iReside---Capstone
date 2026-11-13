'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Droplets, Loader2, Save, SkipForward, WifiOff, X, Zap } from 'lucide-react';
import { useLanguageContext } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { FieldError, fieldErrorClass } from '@/components/ui/field-error';
import {
	computeDraftBill,
	formatRoomDisplayName,
	isMeterSubmetered,
	readingCellError,
	sanitizeMeterInput,
	type ReadingDraft,
} from '@/lib/billing/utility-drafts';

interface MobileUtilityRoomSheetProps {
	isOpen: boolean;
	draft: ReadingDraft | null;
	monthLabel: string;
	saving: boolean;
	initialFocus?: 'water' | 'electricity';
	roomPositionLabel?: string;
	hasPrevRoom?: boolean;
	hasNextRoom?: boolean;
	isWalkthroughMode?: boolean;
	walkthroughIndex?: number;
	walkthroughTotal?: number;
	isOnline?: boolean;
	pendingQueueCount?: number;
	onClose: () => void;
	onChangeMeter: (unitId: string, utilityType: 'water' | 'electricity', value: string) => void;
	onSaveRoom: (draft: ReadingDraft) => Promise<boolean>;
	onSaveAndNext?: (draft: ReadingDraft) => Promise<boolean>;
	onPrevRoom?: () => void;
	onNextRoom?: () => void;
}

/**
 * Bottom-sheet editor for entering both water and electricity readings for a single room
 * from the "All Rooms" list view, preserving last month's reading and validation rules.
 */
export function MobileUtilityRoomSheet({
	isOpen,
	draft,
	monthLabel,
	saving,
	initialFocus = 'electricity',
	roomPositionLabel,
	hasPrevRoom = false,
	hasNextRoom = false,
	isWalkthroughMode = false,
	walkthroughIndex = 0,
	walkthroughTotal = 0,
	isOnline = true,
	pendingQueueCount = 0,
	onClose,
	onChangeMeter,
	onSaveRoom,
	onSaveAndNext,
	onPrevRoom,
	onNextRoom,
}: MobileUtilityRoomSheetProps) {
	const { t } = useLanguageContext();
	const [touchedWater, setTouchedWater] = useState(false);
	const [touchedElec, setTouchedElec] = useState(false);

	const resetKey = isOpen ? (draft?.unitId ?? '__open__') : '__closed__';
	const [prevResetKey, setPrevResetKey] = useState(resetKey);
	if (resetKey !== prevResetKey) {
		setPrevResetKey(resetKey);
		setTouchedWater(false);
		setTouchedElec(false);
	}

	useEffect(() => {
		if (!isOpen) return;
		const timer = setTimeout(() => {
			const el = document.getElementById(`sheet-meter-${initialFocus}`);
			el?.focus();
		}, 120);
		return () => clearTimeout(timer);
	}, [isOpen, draft?.unitId, initialFocus]);

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !saving) onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isOpen, onClose, saving]);

	if (!isOpen || !draft || typeof document === 'undefined') return null;

	const bill = computeDraftBill(draft);
	const waterErr = readingCellError(draft.water, 'Water reading');
	const elecErr = readingCellError(draft.electricity, 'Electricity reading');
	const showWaterErr = touchedWater && Boolean(waterErr);
	const showElecErr = touchedElec && Boolean(elecErr);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setTouchedWater(true);
		setTouchedElec(true);
		if (waterErr) {
			document.getElementById('sheet-meter-water')?.focus();
			return;
		}
		if (elecErr) {
			document.getElementById('sheet-meter-electricity')?.focus();
			return;
		}
		if (isWalkthroughMode && hasNextRoom && onSaveAndNext) {
			await onSaveAndNext(draft);
			return;
		}
		const ok = await onSaveRoom(draft);
		if (ok) onClose();
	};

	return createPortal(
		<div
			className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
			role="dialog"
			aria-modal="true"
			aria-labelledby="mobile-room-sheet-title"
			onClick={() => !saving && onClose()}
		>
			<form
				noValidate
				onSubmit={handleSubmit}
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-lg max-h-[90vh] rounded-t-3xl bg-card border-t border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,0px)]"
			>
				{/* Drag Handle */}
				<div className="flex justify-center pt-3 pb-1 shrink-0">
					<span className="h-1.5 w-12 rounded-full bg-muted-foreground/25" aria-hidden="true" />
				</div>

				{/* Header */}
				<div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
					<div className="min-w-0 space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-xs font-bold text-primary">{monthLabel}</span>
							{roomPositionLabel && (
								<span className="text-[11px] font-semibold text-muted-foreground">
									• {roomPositionLabel}
								</span>
							)}
							{draft.occupancyStatus === 'occupied' ? (
								<span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
									{draft.tenantName ? draft.tenantName : t('Occupied')}
								</span>
							) : (
								<span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
									{t('Vacant')}
								</span>
							)}
						</div>
						<h2 id="mobile-room-sheet-title" className="text-lg font-bold text-foreground truncate">
							{formatRoomDisplayName(draft.unitName)}
						</h2>
						<p className="text-xs text-muted-foreground truncate">{draft.propertyName}</p>
						{(!isOnline || pendingQueueCount > 0 || isWalkthroughMode) && (
							<div className="pt-1 flex flex-wrap items-center gap-1.5">
								{!isOnline ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
										<WifiOff className="size-3 shrink-0" />
										{t('Offline · Saving on phone')}
									</span>
								) : pendingQueueCount > 0 ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
										<WifiOff className="size-3 shrink-0" />
										{`${pendingQueueCount} ${t('waiting to sync')}`}
									</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
										<CheckCircle2 className="size-3 shrink-0" />
										{t('1-by-1 Walkthrough · Auto-saved')}
									</span>
								)}
							</div>
						)}
					</div>
					<button
						type="button"
						disabled={saving}
						onClick={onClose}
						aria-label={t('Close')}
						className="size-11 flex items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
					>
						<X className="size-5" />
					</button>
				</div>

				{isWalkthroughMode && walkthroughTotal > 0 && (
					<div className="h-1.5 w-full bg-muted shrink-0 overflow-hidden" aria-hidden="true">
						<div
							className="h-full bg-primary transition-all duration-200"
							style={{
								width: `${Math.min(100, Math.round(((walkthroughIndex + 1) / walkthroughTotal) * 100))}%`,
							}}
						/>
					</div>
				)}

				{/* Inputs */}
				<div className="flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-4">
					{/* Water Meter */}
					<div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.04] p-4 space-y-3">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
									<Droplets className="size-4" />
								</div>
								<span className="text-sm font-bold text-foreground">{t('Water Meter (m³)')}</span>
							</div>
							<span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-200 whitespace-nowrap shrink-0">
								₱{draft.water.rate || 0}/m³
							</span>
						</div>

						<div className="rounded-xl bg-background/85 border border-border/70 px-3.5 py-2.5 flex items-center justify-between text-xs">
							<span className="font-medium text-muted-foreground">{t("Last Month's Reading:")}</span>
							<span className="font-bold font-mono tabular-nums text-foreground">{bill.waterPrev} m³</span>
						</div>

						<div className="space-y-1.5">
							<label htmlFor="sheet-meter-water" className="block text-xs font-bold text-foreground">
								{t("Type this month's water reading")}
							</label>
							<span id="sheet-meter-water-hint" className="block text-xs text-muted-foreground">
								{t('Enter a number {prev} or higher', { prev: bill.waterPrev })}
							</span>
							<div className="relative">
								<input
									id="sheet-meter-water"
									type="text"
									inputMode="decimal"
									maxLength={10}
									value={draft.water.current}
									placeholder={`${bill.waterPrev}`}
									aria-invalid={showWaterErr ? 'true' : 'false'}
									aria-describedby={
										showWaterErr
											? 'sheet-meter-water-hint sheet-meter-water-error'
											: 'sheet-meter-water-hint'
									}
									onBlur={() => setTouchedWater(true)}
									onChange={(e) =>
										onChangeMeter(draft.unitId, 'water', sanitizeMeterInput(e.target.value))
									}
									style={{ outline: 'none' }}
									className={cn(
										'w-full h-14 rounded-xl border-2 border-sky-400/80 dark:border-sky-500/70 bg-background pl-4 pr-14 text-xl font-mono font-bold tabular-nums text-foreground outline-none focus:outline-none focus-visible:outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-500/20 transition-all scroll-mb-8',
										showWaterErr && fieldErrorClass,
									)}
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 pointer-events-none">
									m³
								</span>
							</div>
							<FieldError
								id="sheet-meter-water-error"
								message={showWaterErr ? waterErr : undefined}
								className="text-xs"
							/>
						</div>

						{bill.hasWater && !showWaterErr && (
							<div className="rounded-xl bg-sky-500/10 border border-sky-500/20 px-3.5 py-2 flex items-center justify-between text-xs">
								<span className="font-semibold text-sky-900 dark:text-sky-200">
									{t('Used:')} <strong className="font-mono">{bill.waterUsage.toFixed(1)} m³</strong>
								</span>
								<span className="font-bold font-mono tabular-nums text-sky-950 dark:text-sky-100">
									₱{bill.waterCost.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						)}
					</div>

					{/* Electricity Meter */}
					<div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 space-y-3">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
									<Zap className="size-4" />
								</div>
								<span className="text-sm font-bold text-foreground">{t('Electricity Meter (kWh)')}</span>
							</div>
							<span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 whitespace-nowrap shrink-0">
								₱{draft.electricity.rate || 0}/kWh
							</span>
						</div>

						<div className="rounded-xl bg-background/85 border border-border/70 px-3.5 py-2.5 flex items-center justify-between text-xs">
							<span className="font-medium text-muted-foreground">{t("Last Month's Reading:")}</span>
							<span className="font-bold font-mono tabular-nums text-foreground">{bill.elecPrev} kWh</span>
						</div>

						<div className="space-y-1.5">
							<label htmlFor="sheet-meter-electricity" className="block text-xs font-bold text-foreground">
								{t("Type this month's electricity reading")}
							</label>
							<span id="sheet-meter-elec-hint" className="block text-xs text-muted-foreground">
								{t('Enter a number {prev} or higher', { prev: bill.elecPrev })}
							</span>
							<div className="relative">
								<input
									id="sheet-meter-electricity"
									type="text"
									inputMode="decimal"
									maxLength={10}
									value={draft.electricity.current}
									placeholder={`${bill.elecPrev}`}
									aria-invalid={showElecErr ? 'true' : 'false'}
									aria-describedby={
										showElecErr
											? 'sheet-meter-elec-hint sheet-meter-elec-error'
											: 'sheet-meter-elec-hint'
									}
									onBlur={() => setTouchedElec(true)}
									onChange={(e) =>
										onChangeMeter(draft.unitId, 'electricity', sanitizeMeterInput(e.target.value))
									}
									style={{ outline: 'none' }}
									className={cn(
										'w-full h-14 rounded-xl border-2 border-amber-400/80 dark:border-amber-500/70 bg-background pl-4 pr-16 text-xl font-mono font-bold tabular-nums text-foreground outline-none focus:outline-none focus-visible:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/20 transition-all scroll-mb-8',
										showElecErr && fieldErrorClass,
									)}
								/>
								<span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 pointer-events-none">
									kWh
								</span>
							</div>
							<FieldError
								id="sheet-meter-elec-error"
								message={showElecErr ? elecErr : undefined}
								className="text-xs"
							/>
						</div>

						{bill.hasElec && !showElecErr && (
							<div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 flex items-center justify-between text-xs">
								<span className="font-semibold text-amber-900 dark:text-amber-200">
									{t('Used:')} <strong className="font-mono">{bill.elecUsage.toFixed(1)} kWh</strong>
								</span>
								<span className="font-bold font-mono tabular-nums text-amber-950 dark:text-amber-100">
									₱{bill.elecCost.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						)}
					</div>

					{/* Estimated Bill Summary */}
					<div className="rounded-2xl bg-muted/40 border border-border/80 p-4 space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">{t('Room Rent:')}</span>
							<span className="font-mono font-bold tabular-nums text-foreground">
								₱{bill.roomRent.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">{t('Water + Electricity:')}</span>
							<span className="font-mono font-bold tabular-nums text-foreground">
								₱{(bill.waterCost + bill.elecCost).toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
						<div className="pt-2 border-t border-border/70 flex items-center justify-between">
							<span className="text-sm font-bold text-foreground">{t('Total Bill:')}</span>
							<span className="text-lg font-bold font-mono tabular-nums text-primary">
								₱{bill.totalBill.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</span>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-5 pt-3 border-t border-border/60 space-y-2 shrink-0 bg-card">
					{draft.occupancyStatus === 'occupied' &&
						isMeterSubmetered(draft.water) &&
						isMeterSubmetered(draft.electricity) &&
						(bill.hasWater !== bill.hasElec) && (
							<p className="text-[11px] font-medium text-amber-700 dark:text-amber-300 text-center">
								{t('Enter both water and electricity readings so this room is ready to bill.')}
							</p>
						)}
					<div className="flex items-center gap-2">
						{hasPrevRoom && onPrevRoom && (
							<button
								type="button"
								disabled={saving}
								onClick={() => {
									if (isWalkthroughMode) {
										onPrevRoom();
										return;
									}
									setTouchedWater(true);
									setTouchedElec(true);
									if (waterErr) {
										document.getElementById('sheet-meter-water')?.focus();
										return;
									}
									if (elecErr) {
										document.getElementById('sheet-meter-electricity')?.focus();
										return;
									}
									onPrevRoom();
								}}
								aria-label={t('Previous room')}
								className="size-12 shrink-0 flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-all active:scale-98 cursor-pointer disabled:opacity-50"
							>
								<ChevronLeft className="size-5" />
							</button>
						)}
						{isWalkthroughMode ? (
							<>
								{hasNextRoom && onNextRoom && (
									<button
										type="button"
										disabled={saving}
										onClick={onNextRoom}
										className="min-h-[48px] px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-sm font-bold transition-all active:scale-98 inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
									>
										<SkipForward className="size-4" />
										<span>{t('Skip')}</span>
									</button>
								)}
								<button
									type="submit"
									disabled={saving}
									className="flex-1 min-h-[48px] px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all active:scale-98 shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
								>
									{saving ? (
										<Loader2 className="size-4 animate-spin" />
									) : hasNextRoom ? (
										<ChevronRight className="size-4" />
									) : (
										<CheckCircle2 className="size-4" />
									)}
									<span>{hasNextRoom ? t('Save & Next Room') : t('Save & Finish')}</span>
								</button>
							</>
						) : (
							<>
								<button
									type="submit"
									disabled={saving}
									className={cn(
										'min-h-[48px] px-4 rounded-xl text-sm font-bold transition-all active:scale-98 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50',
										hasNextRoom && onNextRoom
											? 'flex-1 border border-border bg-background hover:bg-muted text-foreground'
											: 'flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
									)}
								>
									{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
									<span>{t('Save Readings')}</span>
								</button>
								{hasNextRoom && onNextRoom && (
									<button
										type="button"
										disabled={saving}
										onClick={() => {
											setTouchedWater(true);
											setTouchedElec(true);
											if (waterErr) {
												document.getElementById('sheet-meter-water')?.focus();
												return;
											}
											if (elecErr) {
												document.getElementById('sheet-meter-electricity')?.focus();
												return;
											}
											onNextRoom();
										}}
										className="flex-1 min-h-[48px] px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all active:scale-98 shadow-sm inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
									>
										<span>{t('Next Room')}</span>
										<ChevronRight className="size-4" />
									</button>
								)}
							</>
						)}
					</div>
				</div>
			</form>
		</div>,
		document.body,
	);
}
