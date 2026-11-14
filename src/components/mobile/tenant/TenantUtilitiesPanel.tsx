"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Droplets, Gauge, Receipt, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLanguageContext } from "@/context/LanguageContext";

interface TenantUtilityReading {
	id: string;
	utility_type: "electricity" | "water";
	previous_reading: number | null;
	current_reading: number | null;
	usage: number | null;
	billed_rate: number | null;
	computed_charge: number | null;
	billing_period_start: string | null;
	billing_period_end: string | null;
	payment_id: string | null;
	created_at: string;
}

interface TenantUtilitiesResponse {
	lease: {
		id: string;
		unitId: string;
		propertyId: string;
		unitName: string | null;
		propertyName: string | null;
	} | null;
	readings: TenantUtilityReading[];
	rates: {
		electricity: number | null;
		water: number | null;
	};
}

function formatPeso(value: number): string {
	return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TenantUtilitiesPanel() {
	const { t } = useLanguageContext();
	const router = useRouter();
	const [data, setData] = useState<TenantUtilitiesResponse | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchUtilities = useCallback(async () => {
		try {
			const res = await fetch("/api/tenant/utilities", { cache: "no-store" });
			if (!res.ok) return;
			const json = (await res.json()) as TenantUtilitiesResponse;
			setData(json);
		} catch (err) {
			console.error("[TenantUtilitiesPanel] Failed to fetch:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchUtilities();
	}, [fetchUtilities]);

	// Real-time sync when landlord records new meter readings or issues utility bills
	useEffect(() => {
		const leaseId = data?.lease?.id;
		const supabase = createClient();
		const channel = supabase
			.channel(`tenant-utilities-${leaseId ?? "all"}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "utility_readings",
					...(leaseId ? { filter: `lease_id=eq.${leaseId}` } : {}),
				},
				() => {
					void fetchUtilities();
				}
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "utility_configs",
				},
				() => {
					void fetchUtilities();
				}
			)
			.subscribe();

		const timer = setInterval(() => {
			void fetchUtilities();
		}, 3500);

		return () => {
			clearInterval(timer);
			void supabase.removeChannel(channel);
		};
	}, [data?.lease?.id, fetchUtilities]);

	const { latestElectricity, latestWater, recentReadings, combinedLatestCharge } = useMemo(() => {
		const list = data?.readings ?? [];
		const elec = list.find((r) => r.utility_type === "electricity") ?? null;
		const wat = list.find((r) => r.utility_type === "water") ?? null;
		const total =
			(elec ? Number(elec.computed_charge ?? 0) : 0) +
			(wat ? Number(wat.computed_charge ?? 0) : 0);
		return {
			latestElectricity: elec,
			latestWater: wat,
			recentReadings: list.slice(0, 6),
			combinedLatestCharge: total,
		};
	}, [data?.readings]);

	if (loading && !data) {
		return (
			<div className="px-4 pt-3 pb-24 space-y-3">
				<div className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
				<div className="h-36 rounded-2xl bg-muted/40 animate-pulse" />
				<div className="h-36 rounded-2xl bg-muted/40 animate-pulse" />
			</div>
		);
	}

	if (!data?.lease) {
		return (
			<div className="px-4 py-10 max-w-md mx-auto">
				<div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3 shadow-sm">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Gauge className="h-6 w-6" />
					</div>
					<h2 className="text-lg font-bold text-foreground">{t("No Active Unit")}</h2>
					<p className="text-sm text-muted-foreground">
						{t("Your water and electricity readings will appear here once your lease is active.")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="px-4 pt-3 pb-28 space-y-4 max-w-md mx-auto">
			{/* Unit Summary Header */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{data.lease.propertyName || t("My Unit")}
					</p>
					<h2 className="text-lg font-bold text-foreground truncate">
						{data.lease.unitName || t("Unit")}
					</h2>
				</div>
				<div className="text-right shrink-0">
					<p className="text-[11px] font-semibold text-muted-foreground">{t("Latest Total")}</p>
					<p className="text-lg font-bold font-mono tabular-nums text-foreground">
						{formatPeso(combinedLatestCharge)}
					</p>
				</div>
			</div>

			{/* Electricity Card */}
			<div className="rounded-2xl border border-amber-500/25 bg-card p-4 shadow-xs space-y-3">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
							<Zap className="size-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-foreground">{t("Electricity (kWh)")}</h3>
							<p className="text-xs text-muted-foreground">
								{latestElectricity?.billing_period_end
									? t("Period ending {date}", { date: latestElectricity.billing_period_end })
									: t("Sub-meter reading")}
							</p>
						</div>
					</div>
					<span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 font-mono tabular-nums">
						₱{Number(latestElectricity?.billed_rate ?? data.rates.electricity ?? 0).toFixed(2)}/kWh
					</span>
				</div>

				<div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Previous")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-foreground">
							{latestElectricity?.previous_reading ?? 0}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Current")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-foreground">
							{latestElectricity?.current_reading ?? 0}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Usage")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300">
							+{Number(latestElectricity?.usage ?? 0).toFixed(1)} kWh
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between pt-1 border-t border-border/60">
					<span className="text-xs font-semibold text-muted-foreground">{t("Computed Charge")}</span>
					<span className="text-base font-bold font-mono tabular-nums text-foreground">
						{formatPeso(Number(latestElectricity?.computed_charge ?? 0))}
					</span>
				</div>
			</div>

			{/* Water Card */}
			<div className="rounded-2xl border border-sky-500/25 bg-card p-4 shadow-xs space-y-3">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2.5">
						<div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
							<Droplets className="size-5" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-foreground">{t("Water (m³)")}</h3>
							<p className="text-xs text-muted-foreground">
								{latestWater?.billing_period_end
									? t("Period ending {date}", { date: latestWater.billing_period_end })
									: t("Sub-meter reading")}
							</p>
						</div>
					</div>
					<span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-200 font-mono tabular-nums">
						₱{Number(latestWater?.billed_rate ?? data.rates.water ?? 0).toFixed(2)}/m³
					</span>
				</div>

				<div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Previous")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-foreground">
							{latestWater?.previous_reading ?? 0}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Current")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-foreground">
							{latestWater?.current_reading ?? 0}
						</p>
					</div>
					<div>
						<p className="text-[11px] font-medium text-muted-foreground">{t("Usage")}</p>
						<p className="text-sm font-bold font-mono tabular-nums text-sky-700 dark:text-sky-300">
							+{Number(latestWater?.usage ?? 0).toFixed(1)} m³
						</p>
					</div>
				</div>

				<div className="flex items-center justify-between pt-1 border-t border-border/60">
					<span className="text-xs font-semibold text-muted-foreground">{t("Computed Charge")}</span>
					<span className="text-base font-bold font-mono tabular-nums text-foreground">
						{formatPeso(Number(latestWater?.computed_charge ?? 0))}
					</span>
				</div>
			</div>

			{/* Go to Payments CTA */}
			<button
				type="button"
				onClick={() => router.push("/mobile/tenant/pay")}
				className="m-btn m-btn-primary w-full min-h-[48px] px-4 text-sm font-bold whitespace-nowrap inline-flex items-center justify-center gap-2"
			>
				<Receipt className="size-4 shrink-0" />
				<span>{t("View & Pay Bills")}</span>
				<ArrowRight className="size-4 shrink-0" />
			</button>

			{/* Recent Meter History */}
			{recentReadings.length > 0 && (
				<div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2.5">
					<h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{t("Recent Readings")}
					</h3>
					<div className="divide-y divide-border/60">
						{recentReadings.map((r) => (
							<div key={r.id} className="py-2 flex items-center justify-between gap-2 text-xs">
								<div className="min-w-0">
									<p className="font-bold text-foreground capitalize">
										{r.utility_type === "electricity" ? t("Electricity") : t("Water")} •{" "}
										<span className="font-mono tabular-nums">
											{r.previous_reading ?? 0} → {r.current_reading ?? 0}
										</span>
									</p>
									<p className="text-muted-foreground">
										{r.billing_period_end || r.created_at.slice(0, 10)}
									</p>
								</div>
								<div className="text-right shrink-0">
									<p className="font-bold font-mono tabular-nums text-foreground">
										{formatPeso(Number(r.computed_charge ?? 0))}
									</p>
									<p className="text-muted-foreground font-mono tabular-nums">
										+{Number(r.usage ?? 0).toFixed(1)} {r.utility_type === "electricity" ? "kWh" : "m³"}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
