'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Check, Droplets, Loader2, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { tr } from '@/hooks/useLanguage';
import { FieldError, fieldErrorClass } from '@/components/ui/field-error';
import { utilityRateRule } from '@/lib/validation/schemas/properties.schema';
import { sanitizeMeterInput } from '@/lib/billing/utility-drafts';
import type { BillingWorkspace } from '@/lib/billing/server';

type Strategy = 'included' | 'submetered' | 'direct';

interface RateDraft {
	id?: string;
	property_id: string;
	utility_type: 'water' | 'electricity';
	strategy: Strategy;
	rateText: string;
	effective_from: string;
	unit_label: 'cubic_meter' | 'kwh';
}

interface MobileUtilityRatesSectionProps {
	workspace: BillingWorkspace | null;
	selectedPropertyId: string;
	onDirtyChange?: (dirty: boolean) => void;
	onSaved: () => void;
}

function strategyFromConfig(config?: {
	billing_mode?: string;
	note?: string | null;
} | null): Strategy {
	if (!config) return 'included';
	if (config.billing_mode === 'tenant_paid') {
		if (config.note === 'responsibility:tenant_direct') return 'direct';
		return 'submetered';
	}
	return 'included';
}

/**
 * Elderly-friendly mobile Water & Electricity rate editor.
 * Uses plain-English choices ("Part of rent", "Charge by meter reading", "Paid directly")
 * and saves property-wide defaults directly via /api/landlord/payment-settings.
 */
export function MobileUtilityRatesSection({
	workspace,
	selectedPropertyId,
	onDirtyChange,
	onSaved,
}: MobileUtilityRatesSectionProps) {
	const { t } = useLanguageContext();
	const [today] = useState(() => new Date().toISOString().slice(0, 10));
	const [saving, setSaving] = useState(false);

	const visibleProperties = useMemo(() => {
		const list = workspace?.properties || [];
		if (!selectedPropertyId || selectedPropertyId === 'all') return list;
		return list.filter((p) => p.id === selectedPropertyId);
	}, [workspace?.properties, selectedPropertyId]);

	const baseDrafts = useMemo<RateDraft[]>(() => {
		if (!workspace) return [];
		const next: RateDraft[] = [];

		visibleProperties.forEach((prop) => {
			(['water', 'electricity'] as const).forEach((utilityType) => {
				const existing = (workspace.utilityConfigs || []).find(
					(c) =>
						c.property_id === prop.id &&
						c.utility_type === utilityType &&
						c.unit_id === null,
				);
				next.push({
					id: existing?.id,
					property_id: prop.id,
					utility_type: utilityType,
					strategy: strategyFromConfig(existing),
					rateText: existing ? String(existing.rate_per_unit ?? 0) : '0',
					effective_from: existing?.effective_from || today,
					unit_label: utilityType === 'water' ? 'cubic_meter' : 'kwh',
				});
			});
		});

		return next;
	}, [workspace, visibleProperties, today]);

	const baseSignature = useMemo(
		() => `${selectedPropertyId}|${workspace ? JSON.stringify(baseDrafts) : ''}`,
		[selectedPropertyId, workspace, baseDrafts],
	);

	const [prevBaseSignature, setPrevBaseSignature] = useState<string>(baseSignature);
	const [drafts, setDrafts] = useState<RateDraft[]>(baseDrafts);
	const [initialSnapshot, setInitialSnapshot] = useState(() =>
		workspace ? JSON.stringify(baseDrafts) : '',
	);
	const [touchedKeys, setTouchedKeys] = useState<Record<string, boolean>>({});

	if (baseSignature !== prevBaseSignature) {
		setPrevBaseSignature(baseSignature);
		if (workspace) {
			setDrafts(baseDrafts);
			setInitialSnapshot(JSON.stringify(baseDrafts));
			setTouchedKeys({});
		} else {
			setDrafts([]);
			setInitialSnapshot('');
			setTouchedKeys({});
		}
	}

	const isDirty = useMemo(
		() => initialSnapshot !== '' && JSON.stringify(drafts) !== initialSnapshot,
		[drafts, initialSnapshot],
	);

	useEffect(() => {
		onDirtyChange?.(isDirty);
	}, [isDirty, onDirtyChange]);

	const updateDraft = (propertyId: string, utilityType: 'water' | 'electricity', patch: Partial<RateDraft>) => {
		setDrafts((prev) =>
			prev.map((d) =>
				d.property_id === propertyId && d.utility_type === utilityType ? { ...d, ...patch } : d,
			),
		);
	};

	const handleSaveRates = async () => {
		const invalidKeyList: string[] = [];
		drafts.forEach((d) => {
			if (d.strategy === 'submetered') {
				const err = utilityRateRule(d.rateText);
				if (err) invalidKeyList.push(`${d.property_id}:${d.utility_type}`);
			}
		});

		if (invalidKeyList.length > 0) {
			setTouchedKeys((prev) => ({
				...prev,
				...Object.fromEntries(invalidKeyList.map((k) => [k, true])),
			}));
			toast.error(t('Please fix the highlighted rate before saving.'));
			document.getElementById(`mobile-rate-input-${invalidKeyList[0]}`)?.focus();
			return;
		}

		// Preserve any per-unit override configs already in workspace while saving building defaults
		const unitOverrides = (workspace?.utilityConfigs || []).filter(
			(c) =>
				c.unit_id !== null &&
				visibleProperties.some((p) => p.id === c.property_id),
		);

		const payloadConfigs = [
			...drafts.map((d) => ({
				...(d.id ? { id: d.id } : {}),
				property_id: d.property_id,
				unit_id: null,
				utility_type: d.utility_type,
				billing_mode: d.strategy === 'included' ? 'included_in_rent' : 'tenant_paid',
				rate_per_unit: d.strategy === 'submetered' ? parseFloat(d.rateText) || 0 : 0,
				unit_label: d.unit_label,
				is_active: true,
				effective_from: d.effective_from,
				effective_to: null,
				note: d.strategy === 'direct' ? 'responsibility:tenant_direct' : null,
			})),
			...unitOverrides.map((c) => ({
				id: c.id,
				property_id: c.property_id,
				unit_id: c.unit_id,
				utility_type: c.utility_type,
				billing_mode: c.billing_mode,
				rate_per_unit: c.rate_per_unit,
				unit_label: c.unit_label,
				is_active: c.is_active,
				effective_from: c.effective_from,
				effective_to: c.effective_to,
				note: c.note,
			})),
		];

		try {
			setSaving(true);
			const formData = new FormData();
			formData.set('saveType', 'rates');
			formData.set('utilityConfigs', JSON.stringify(payloadConfigs));
			formData.set('deletedConfigIds', JSON.stringify([]));

			const res = await fetch('/api/landlord/payment-settings', {
				method: 'POST',
				body: formData,
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || t('Failed to save utility rates'));
			}

			toast.success(t('Water and electricity rates saved!'));
			setInitialSnapshot(JSON.stringify(drafts));
			onSaved();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : t('Failed to save utility rates');
			toast.error(tr(msg));
		} finally {
			setSaving(false);
		}
	};

	if (visibleProperties.length === 0) {
		return (
			<div className="rounded-2xl border border-border/70 bg-card p-6 text-center space-y-2 shadow-xs">
				<Building2 className="size-10 text-muted-foreground/40 mx-auto" />
				<h3 className="text-base font-bold text-foreground">{t('No property yet')}</h3>
				<p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
					{t('Add a property first. Then you can set its water and electricity rates here.')}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-border/70 bg-card p-4 space-y-1 shadow-xs">
				<h2 className="text-base font-bold text-foreground">{t('Water & Electricity Rates')}</h2>
				<p className="text-xs text-muted-foreground leading-relaxed">
					{t('Set how much you charge per cubic meter (m³) of water and per kilowatt-hour (kWh) of electricity.')}
				</p>
			</div>

			{visibleProperties.map((property) => {
				const waterDraft = drafts.find(
					(d) => d.property_id === property.id && d.utility_type === 'water',
				);
				const elecDraft = drafts.find(
					(d) => d.property_id === property.id && d.utility_type === 'electricity',
				);

				return (
					<div key={property.id} className="space-y-3">
						{visibleProperties.length > 1 && (
							<div className="flex items-center gap-2 px-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
								<Building2 className="size-3.5 text-primary" />
								<span>{property.name}</span>
							</div>
						)}

						{[waterDraft, elecDraft].map((draft) => {
							if (!draft) return null;
							const isWater = draft.utility_type === 'water';
							const key = `${draft.property_id}:${draft.utility_type}`;
							const rateErr = draft.strategy === 'submetered' ? utilityRateRule(draft.rateText) : undefined;
							const showRateErr = Boolean(touchedKeys[key] && rateErr);
							const numericRate = parseFloat(draft.rateText) || 0;

							return (
								<div
									key={key}
									className="rounded-2xl border border-border/70 bg-card p-4 space-y-3.5 shadow-xs"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2.5">
											<div
												className={cn(
													'flex size-9 items-center justify-center rounded-xl',
													isWater
														? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
														: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
												)}
											>
												{isWater ? <Droplets className="size-5" /> : <Zap className="size-5" />}
											</div>
											<div>
												<h3 className="text-sm font-bold text-foreground">
													{isWater ? t('Water Price') : t('Electricity Price')}
												</h3>
												<p className="text-xs text-muted-foreground">{property.name}</p>
											</div>
										</div>
										<span className="text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-foreground font-mono tabular-nums">
											{draft.strategy === 'included'
												? t('In Rent')
												: draft.strategy === 'direct'
													? t('Direct Pay')
													: `₱${numericRate.toFixed(2)}/${isWater ? 'm³' : 'kWh'}`}
										</span>
									</div>

									{/* Plain-English Strategy Options */}
									<div className="space-y-2" role="radiogroup" aria-label={isWater ? t('Water billing choice') : t('Electricity billing choice')}>
										{(
											[
												{
													value: 'submetered',
													label: t('I charge by meter reading'),
													hint: t('Enter the price per unit below.'),
												},
												{
													value: 'included',
													label: t('Part of the monthly rent'),
													hint: t('No separate utility charge.'),
												},
												{
													value: 'direct',
													label: isWater
														? t('Tenants pay the water company directly')
														: t('Tenants pay the electric company directly'),
													hint: t('Not billed through iReside.'),
												},
											] as const
										).map((opt) => {
											const selected = draft.strategy === opt.value;
											return (
												<button
													key={opt.value}
													type="button"
													role="radio"
													aria-checked={selected}
													onClick={() =>
														updateDraft(property.id, draft.utility_type, {
															strategy: opt.value,
														})
													}
													className={cn(
														'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 min-h-[44px] cursor-pointer',
														selected
															? 'border-primary bg-primary/[0.06]'
															: 'border-border/70 bg-background hover:bg-muted/40',
													)}
												>
													<span
														className={cn(
															'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
															selected
																? 'border-primary bg-primary text-primary-foreground'
																: 'border-muted-foreground/40 bg-background',
														)}
													>
														{selected && <Check className="size-3" />}
													</span>
													<span className="min-w-0">
														<span className="block text-xs font-bold text-foreground">
															{opt.label}
														</span>
														<span className="block text-[11px] text-muted-foreground mt-0.5">
															{opt.hint}
														</span>
													</span>
												</button>
											);
										})}
									</div>

									{/* Rate Input when submetered */}
									{draft.strategy === 'submetered' && (
										<div className="space-y-1.5 pt-1">
											<label
												htmlFor={`mobile-rate-input-${key}`}
												className="block text-xs font-bold text-foreground"
											>
												{isWater
													? t('Price per cubic meter (m³)')
													: t('Price per kilowatt-hour (kWh)')}
											</label>
											<div className="relative">
												<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-foreground pointer-events-none">
													₱
												</span>
												<input
													id={`mobile-rate-input-${key}`}
													type="text"
													inputMode="decimal"
													maxLength={10}
													value={draft.rateText}
													aria-invalid={showRateErr ? 'true' : 'false'}
													aria-describedby={showRateErr ? `mobile-rate-err-${key}` : undefined}
													onBlur={() =>
														setTouchedKeys((prev) => ({ ...prev, [key]: true }))
													}
													onChange={(e) =>
														updateDraft(property.id, draft.utility_type, {
															rateText: sanitizeMeterInput(e.target.value),
														})
													}
													style={{ outline: 'none' }}
													className={cn(
														'w-full h-12 rounded-xl border-2 border-border bg-background pl-8 pr-16 text-lg font-mono font-bold tabular-nums text-foreground outline-none focus:outline-none focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all',
														showRateErr && fieldErrorClass,
													)}
												/>
												<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
													/ {isWater ? 'm³' : 'kWh'}
												</span>
											</div>
											<FieldError id={`mobile-rate-err-${key}`} message={showRateErr ? rateErr : undefined} className="text-xs" />
											{!showRateErr && numericRate <= 0 && (
												<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
													{t('The price is ₱0. Type your price so bills compute automatically.')}
												</p>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				);
			})}

			{/* Save Rates Button */}
			<button
				type="button"
				disabled={saving || !isDirty}
				onClick={handleSaveRates}
				className="w-full min-h-[48px] rounded-2xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 active:scale-98 transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
			>
				{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
				<span>{isDirty ? t('Save Water & Electric Rates') : t('Rates Up to Date')}</span>
			</button>
		</div>
	);
}
