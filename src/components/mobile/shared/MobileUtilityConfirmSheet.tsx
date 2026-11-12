'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Loader2, Send, X } from 'lucide-react';
import { useLanguageContext } from '@/context/LanguageContext';
import {
	computeDraftBill,
	formatRoomDisplayName,
	type ReadingDraft,
} from '@/lib/billing/utility-drafts';

interface MobileUtilityConfirmSheetProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	saving: boolean;
	monthLabel: string;
	readyDrafts: ReadingDraft[];
	missingOccupiedDrafts: ReadingDraft[];
}

/**
 * Bottom-sheet confirmation before issuing monthly utility + rent bills to tenants.
 * Prevents accidental sends by summarizing ready rooms, totals, and skipped rooms.
 */
export function MobileUtilityConfirmSheet({
	isOpen,
	onClose,
	onConfirm,
	saving,
	monthLabel,
	readyDrafts,
	missingOccupiedDrafts,
}: MobileUtilityConfirmSheetProps) {
	const { t } = useLanguageContext();

	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !saving) onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isOpen, onClose, saving]);

	const totalBatchAmount = useMemo(
		() => readyDrafts.reduce((sum, d) => sum + computeDraftBill(d).totalBill, 0),
		[readyDrafts],
	);

	if (!isOpen || typeof document === 'undefined') return null;

	return createPortal(
		<div
			className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
			role="dialog"
			aria-modal="true"
			aria-labelledby="mobile-confirm-send-title"
			onClick={() => !saving && onClose()}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="w-full max-w-lg max-h-[88vh] rounded-t-3xl bg-card border-t border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,0px)]"
			>
				{/* Drag Handle */}
				<div className="flex justify-center pt-3 pb-1 shrink-0">
					<span className="h-1.5 w-12 rounded-full bg-muted-foreground/25" aria-hidden="true" />
				</div>

				{/* Header */}
				<div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
					<div className="space-y-1 min-w-0">
						<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
							<Send className="size-3.5" />
							<span>{monthLabel}</span>
						</span>
						<h2 id="mobile-confirm-send-title" className="text-lg font-bold text-foreground">
							{t('Review & Send Monthly Bills')}
						</h2>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{t('Please check the summary below before sending bills to your tenants.')}
						</p>
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

				{/* Body */}
				<div className="flex-1 overflow-y-auto overscroll-y-contain p-5 space-y-3">
					{readyDrafts.length === 0 ? (
						<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
							<AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-bold">{t('No rooms are ready to send yet.')}</p>
								<p className="text-xs leading-relaxed">
									{t('Please enter both water and electricity meter readings for at least one room first.')}
								</p>
							</div>
						</div>
					) : (
						<>
							<div className="space-y-2.5">
								{readyDrafts.map((d) => {
									const bill = computeDraftBill(d);
									return (
										<div
											key={d.unitId}
											className="rounded-2xl border border-border/70 bg-background px-4 py-3 flex items-center justify-between gap-3"
										>
											<div className="min-w-0">
												<p className="text-sm font-bold text-foreground truncate">
													{formatRoomDisplayName(d.unitName)}
													{d.tenantName ? ` • ${d.tenantName}` : ''}
												</p>
												<p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
													{t('Water')} {bill.waterUsage.toFixed(1)} m³ + {t('Electric')}{' '}
													{bill.elecUsage.toFixed(1)} kWh
												</p>
											</div>
											<div className="text-base font-bold font-mono tabular-nums text-foreground text-right shrink-0">
												₱{bill.totalBill.toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</div>
										</div>
									);
								})}
							</div>

							<div className="rounded-2xl bg-muted/50 border border-border/80 px-4 py-3.5 flex items-center justify-between gap-3">
								<span className="text-sm font-bold text-foreground">
									{t('Total for {count} room(s)', { count: readyDrafts.length })}
								</span>
								<span className="text-lg font-bold font-mono tabular-nums text-primary">
									₱{totalBatchAmount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						</>
					)}

					{missingOccupiedDrafts.length > 0 && (
						<div className="rounded-2xl border border-border/80 bg-muted/25 p-3.5 text-xs text-muted-foreground leading-relaxed">
							<strong className="text-foreground">{t('Note:')} </strong>
							{t(
								'{count} occupied room(s) ({rooms}) do not have meter readings yet and will be skipped for now.',
								{
									count: missingOccupiedDrafts.length,
									rooms: missingOccupiedDrafts.map((m) => formatRoomDisplayName(m.unitName)).join(', '),
								},
							)}
						</div>
					)}
				</div>

				{/* Footer Actions */}
				<div className="p-5 pt-3 border-t border-border/60 flex items-center gap-2.5 shrink-0 bg-card">
					<button
						type="button"
						disabled={saving}
						onClick={onClose}
						className="flex-1 min-h-[48px] px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground transition-all active:scale-98 cursor-pointer disabled:opacity-50"
					>
						{t('Go Back')}
					</button>
					<button
						type="button"
						disabled={saving || readyDrafts.length === 0}
						onClick={onConfirm}
						className="flex-[1.5] min-h-[48px] px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all active:scale-98 shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
						<span>{t('Yes, Send {count} Bills Now', { count: readyDrafts.length })}</span>
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
