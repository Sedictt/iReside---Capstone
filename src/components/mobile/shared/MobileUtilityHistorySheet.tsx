'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Droplets, History, Loader2, X, Zap } from 'lucide-react';
import { useLanguageContext } from '@/context/LanguageContext';
import { formatRoomDisplayName } from '@/lib/billing/utility-drafts';
import { cn } from '@/lib/utils';

interface RawHistoryReading {
	unit_id?: string;
	property_id?: string;
	propertyId?: string;
	utility_type?: string;
	previous_reading?: number | string | null;
	current_reading?: number | string | null;
	usage?: number | string | null;
	computed_charge?: number | string | null;
	payment_id?: string | null;
	invoice_id?: string | null;
	is_posted?: boolean;
	unit?: { name?: string | null } | null;
	lease?: { tenant?: { full_name?: string | null } | null } | null;
}

interface AuditRecord {
	unit_name: string;
	tenant_name: string;
	utility_type: string;
	previous_reading: number;
	current_reading: number;
	usage: number;
	computed_charge: number;
	is_billed: boolean;
}

const EMPTY_RECORD: Record<string, string> = {};

interface MobileUtilityHistorySheetProps {
	month: string | null;
	selectedPropertyId?: string;
	unitNameById?: Record<string, string>;
	unitPropertyIdById?: Record<string, string>;
	tenantNameByUnitId?: Record<string, string>;
	onClose: () => void;
}

/**
 * Mobile bottom-sheet breakdown for past monthly utility readings.
 * Renders stacked cards instead of cramped multi-column tables.
 */
export function MobileUtilityHistorySheet({
	month,
	selectedPropertyId,
	unitNameById = EMPTY_RECORD,
	unitPropertyIdById = EMPTY_RECORD,
	tenantNameByUnitId = EMPTY_RECORD,
	onClose,
}: MobileUtilityHistorySheetProps) {
	const { t, locale } = useLanguageContext();
	const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
	const [rawRows, setRawRows] = useState<RawHistoryReading[]>([]);

	useEffect(() => {
		if (!month) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [month, onClose]);

	useEffect(() => {
		if (!month) return;
		let alive = true;
		const load = async () => {
			try {
				const res = await fetch(`/api/landlord/utility-readings?month=${encodeURIComponent(month)}`, {
					cache: 'no-store',
				});
				if (!res.ok) throw new Error('Failed to load readings');
				const json: { readings?: unknown } = await res.json();
				const rows = Array.isArray(json.readings)
					? (json.readings as RawHistoryReading[])
					: [];
				if (alive) {
					setRawRows(rows);
					setLoadedMonth(month);
				}
			} catch (err) {
				console.error('[MobileUtilityHistorySheet] Error:', err);
				if (alive) {
					setRawRows([]);
					setLoadedMonth(month);
				}
			}
		};
		void load();
		return () => {
			alive = false;
		};
	}, [month]);

	const loading = Boolean(month && loadedMonth !== month);

	const records = useMemo<AuditRecord[]>(() => {
		if (!month || loadedMonth !== month) return [];
		const scopedRows =
			selectedPropertyId && selectedPropertyId !== 'all'
				? rawRows.filter((r) => {
						const rowPropId =
							r.property_id ||
							r.propertyId ||
							(r.unit_id ? unitPropertyIdById[r.unit_id] : undefined);
						return rowPropId === selectedPropertyId;
				  })
				: rawRows;

		return scopedRows.map((r) => {
			const unitId = r.unit_id;
			const resolvedUnitName =
				r.unit?.name ||
				(unitId ? unitNameById[unitId] : undefined) ||
				unitId ||
				t('Unknown Unit');
			const resolvedTenant =
				r.lease?.tenant?.full_name ||
				(unitId ? tenantNameByUnitId[unitId] : undefined) ||
				'';
			const prev = Number(r.previous_reading) || 0;
			const curr = Number(r.current_reading) || 0;
			const usageVal =
				r.usage !== undefined && r.usage !== null
					? Number(r.usage) || 0
					: Math.max(0, curr - prev);
			return {
				unit_name: resolvedUnitName,
				tenant_name: resolvedTenant,
				utility_type: String(r.utility_type ?? ''),
				previous_reading: prev,
				current_reading: curr,
				usage: usageVal,
				computed_charge: Number(r.computed_charge) || 0,
				is_billed: Boolean(r.payment_id || r.invoice_id || r.is_posted),
			};
		});
	}, [
		month,
		loadedMonth,
		rawRows,
		selectedPropertyId,
		unitPropertyIdById,
		unitNameById,
		tenantNameByUnitId,
		t,
	]);

	if (!month || typeof document === 'undefined') return null;

	const [y, m] = month.split('-').map(Number);
	const dateObj = new Date(y, m - 1, 1);
	const monthFormatted = dateObj.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

	let totalElec = 0;
	let totalWater = 0;
	let totalCost = 0;
	records.forEach((r) => {
		if (r.utility_type === 'electricity') totalElec += r.usage;
		else if (r.utility_type === 'water') totalWater += r.usage;
		totalCost += r.computed_charge;
	});

	return createPortal(
		<div
			className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
			role="dialog"
			aria-modal="true"
			aria-labelledby="mobile-history-sheet-title"
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-lg max-h-[88vh] rounded-t-3xl bg-card border-t border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,0px)]"
			>
				<div className="flex justify-center pt-3 pb-1 shrink-0">
					<span className="h-1.5 w-12 rounded-full bg-muted-foreground/25" aria-hidden="true" />
				</div>

				<div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
					<div className="flex items-center gap-3 min-w-0">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<History className="size-5" />
						</div>
						<div className="min-w-0">
							<h2 id="mobile-history-sheet-title" className="text-base font-bold text-foreground truncate">
								{t('{month} Breakdown', { month: monthFormatted })}
							</h2>
							<p className="text-xs text-muted-foreground">{t('Recorded meter readings')}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label={t('Close')}
						className="size-11 flex items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
					>
						<X className="size-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-4">
					<div className="grid grid-cols-3 gap-2">
						<div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
							<span className="block text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
								{t('Electricity')}
							</span>
							<span className="block text-sm font-bold font-mono tabular-nums text-foreground mt-1">
								{totalElec.toFixed(1)} kWh
							</span>
						</div>
						<div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
							<span className="block text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300">
								{t('Water')}
							</span>
							<span className="block text-sm font-bold font-mono tabular-nums text-foreground mt-1">
								{totalWater.toFixed(1)} m³
							</span>
						</div>
						<div className="rounded-xl border border-border bg-muted/40 p-3">
							<span className="block text-[10px] font-bold uppercase text-muted-foreground">
								{t('Total Billed')}
							</span>
							<span className="block text-sm font-bold font-mono tabular-nums text-foreground mt-1">
								₱{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
							</span>
						</div>
					</div>

					{loading ? (
						<div className="flex py-12 items-center justify-center">
							<Loader2 className="size-7 animate-spin text-primary" />
						</div>
					) : records.length === 0 ? (
						<div className="rounded-2xl border border-border/70 bg-background p-6 text-center text-xs text-muted-foreground">
							{t('No utility readings recorded for this month.')}
						</div>
					) : (
						<div className="space-y-2.5">
							{records.map((r, idx) => {
								const isWater = r.utility_type === 'water';
								const unitSuffix = isWater ? 'm³' : 'kWh';
								return (
									<div
										key={`${r.unit_name}-${r.utility_type}-${idx}`}
										className="rounded-2xl border border-border/70 bg-background p-3.5 flex items-center justify-between gap-3"
									>
										<div className="flex items-center gap-3 min-w-0">
											<div
												className={cn(
													'flex size-9 shrink-0 items-center justify-center rounded-xl',
													isWater
														? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
														: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
												)}
											>
												{isWater ? <Droplets className="size-4" /> : <Zap className="size-4" />}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-bold text-foreground truncate">
													{formatRoomDisplayName(r.unit_name)} •{' '}
													{isWater ? t('Water') : t('Electric')}
												</p>
												{r.tenant_name && (
													<p className="text-[11px] font-medium text-muted-foreground truncate">
														{r.tenant_name}
													</p>
												)}
												<p className="text-xs text-muted-foreground font-mono tabular-nums mt-0.5">
													{r.previous_reading} → {r.current_reading} ({r.usage.toFixed(1)}{' '}
													{unitSuffix})
												</p>
											</div>
										</div>
										<div className="text-sm font-bold font-mono tabular-nums text-foreground text-right shrink-0">
											₱{r.computed_charge.toFixed(2)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className="p-5 pt-3 border-t border-border/60 shrink-0 bg-card">
					<button
						type="button"
						onClick={onClose}
						className="w-full min-h-[48px] rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all cursor-pointer"
					>
						{t('Close')}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
