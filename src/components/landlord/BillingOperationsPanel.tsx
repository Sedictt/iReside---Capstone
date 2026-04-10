"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Droplets, Loader2, Plus, QrCode, Save, Smartphone, Zap } from "lucide-react";
import Image from "next/image";

import type { BillingWorkspace } from "@/lib/billing/server";
import { cn } from "@/lib/utils";

type UtilityConfigDraft = {
  localId: string;
  id?: string;
  property_id: string;
  unit_id: string | null;
  utility_type: "water" | "electricity";
  billing_mode: "included_in_rent" | "tenant_paid";
  rate_per_unit: number;
  unit_label: "kwh" | "cubic_meter";
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
};

const today = new Date().toISOString().slice(0, 10);

const makeDraft = (seed: Partial<UtilityConfigDraft>): UtilityConfigDraft => ({
  localId: seed.localId ?? crypto.randomUUID(),
  property_id: seed.property_id ?? "",
  unit_id: seed.unit_id ?? null,
  utility_type: seed.utility_type ?? "water",
  billing_mode: seed.billing_mode ?? "included_in_rent",
  rate_per_unit: seed.rate_per_unit ?? 0,
  unit_label: seed.unit_label ?? "cubic_meter",
  is_active: seed.is_active ?? true,
  effective_from: seed.effective_from ?? today,
  effective_to: seed.effective_to ?? null,
  note: seed.note ?? null,
  id: seed.id,
});

const utilityMeta = {
  water: { label: "Water", icon: Droplets, tint: "text-sky-200", unit: "cubic_meter" as const },
  electricity: { label: "Electricity", icon: Zap, tint: "text-amber-200", unit: "kwh" as const },
};

export function BillingOperationsPanel({ activeSection = "gcash" }: { activeSection?: "gcash" | "water" | "electricity" }) {
  const [workspace, setWorkspace] = useState<BillingWorkspace | null>(null);
  const [configs, setConfigs] = useState<UtilityConfigDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; value: string } | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [removeQr, setRemoveQr] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/landlord/payment-settings", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = (await response.json()) as BillingWorkspace;
        if (!alive) return;
        setWorkspace(payload);
        const seededConfigs = payload.utilityConfigs.map((config) =>
          makeDraft({
            localId: config.id,
            id: config.id,
            property_id: config.property_id,
            unit_id: config.unit_id,
            utility_type: config.utility_type,
            billing_mode: config.billing_mode,
            rate_per_unit: Number(config.rate_per_unit),
            unit_label: config.unit_label,
            is_active: config.is_active,
            effective_from: config.effective_from,
            effective_to: config.effective_to,
            note: config.note,
          }),
        );
        for (const property of payload.properties) {
          for (const utility of ["water", "electricity"] as const) {
            const exists = seededConfigs.some((config) => config.property_id === property.id && config.utility_type === utility && config.unit_id === null);
            if (!exists) {
              seededConfigs.push(makeDraft({ property_id: property.id, utility_type: utility, unit_label: utilityMeta[utility].unit }));
            }
          }
        }
        setConfigs(seededConfigs);
        setAccountName(payload.paymentDestination?.account_name ?? "");
        setAccountNumber(payload.paymentDestination?.account_number ?? "");
        setIsEnabled(payload.paymentDestination?.is_enabled ?? true);
        setQrPreview(payload.paymentDestination?.qr_image_url ?? null);
      } catch {
        if (alive) setMessage({ type: "error", value: "Unable to load billing settings." });
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const propertyMap = useMemo(() => new Map((workspace?.properties ?? []).map((property) => [property.id, property])), [workspace]);

  const updateConfig = (localId: string, patch: Partial<UtilityConfigDraft>) => {
    setConfigs((current) => current.map((config) => (config.localId === localId ? { ...config, ...patch } : config)));
  };

  const addOverride = (propertyId: string, utilityType: "water" | "electricity") => {
    const property = propertyMap.get(propertyId);
    setConfigs((current) => [
      ...current,
      makeDraft({
        property_id: propertyId,
        unit_id: property?.units[0]?.id ?? null,
        utility_type: utilityType,
        unit_label: utilityMeta[utilityType].unit,
      }),
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("accountName", accountName);
      formData.append("accountNumber", accountNumber);
      formData.append("isEnabled", String(isEnabled));
      formData.append("removeQr", String(removeQr));
      formData.append(
        "utilityConfigs",
        JSON.stringify(
          configs.map((config) => ({
            id: config.id,
            property_id: config.property_id,
            unit_id: config.unit_id,
            utility_type: config.utility_type,
            billing_mode: config.billing_mode,
            rate_per_unit: config.rate_per_unit,
            unit_label: config.unit_label,
            is_active: config.is_active,
            effective_from: config.effective_from,
            effective_to: config.effective_to,
            note: config.note,
          })),
        ),
      );
      if (qrFile) formData.append("qr", qrFile);

      const response = await fetch("/api/landlord/payment-settings", { method: "POST", body: formData });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as BillingWorkspace;
      setWorkspace(payload);
      setQrFile(null);
      setRemoveQr(false);
      setQrPreview(payload.paymentDestination?.qr_image_url ?? null);
      setMessage({ type: "success", value: "Billing settings saved." });
    } catch {
      setMessage({ type: "error", value: "Unable to save billing settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-[#111111] p-10 text-center text-slate-300"><Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />Loading billing workspace...</div>;
  }

  if (!workspace) {
    return <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">Billing workspace is unavailable right now.</div>;
  }

  return (
    <div className="space-y-6 pb-10 font-sans">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.18),rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/80">Billing Command Center</p>
          <h3 className="mt-2 text-lg font-bold text-white">Billing Configuration</h3>
          <p className="mt-1 text-sm text-slate-400">Polish payout details and utility charging rules from one branded workspace.</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-70">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={cn(
          "rounded-xl border px-5 py-3 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          message.type === "error"
            ? "border-red-500/20 bg-red-500/10 text-red-200"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        )}>
          {message.type === "error" ? <div className="h-2 w-2 rounded-full bg-red-500" /> : <div className="h-2 w-2 rounded-full bg-emerald-500" />}
          {message.value}
        </div>
      )}

      {/* GCASH SUBSECTION */}
      {activeSection === "gcash" && (
        <section className="rounded-[1.75rem] border border-white/10 bg-[#171717] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">GCash Destination</h4>
              <p className="text-sm text-slate-400">Main wallet used for tenant payments.</p>
            </div>
          </div>

          <div className="flex flex-col-reverse lg:flex-row gap-8 border-t border-white/5 pt-6">
            <div className="flex-1 space-y-5">
              <Field label="Account name"><input value={accountName} onChange={(event) => setAccountName(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-2.5 text-sm font-medium text-white placeholder-slate-600 outline-none transition-colors hover:border-white/20 focus:border-primary focus:bg-[#0f120d] focus:ring-1 focus:ring-primary" /></Field>
              <Field label="GCash mobile number"><input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-2.5 text-sm font-medium text-white placeholder-slate-600 outline-none transition-colors hover:border-white/20 focus:border-primary focus:bg-[#0f120d] focus:ring-1 focus:ring-primary" /></Field>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
                  <div className={cn("flex h-4 w-8 items-center rounded-full transition-colors", isEnabled ? "bg-primary" : "bg-slate-600")}>
                    <div className={cn("h-3 w-3 rounded-full bg-white transition-transform", isEnabled ? "translate-x-4" : "translate-x-1")} />
                  </div>
                  <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled((current) => !current)} className="hidden" />
                  Accept GCash
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#101010] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5">
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; setQrFile(file); if (file) { setQrPreview(URL.createObjectURL(file)); setRemoveQr(false); } }} />
                  <QrCode className="h-4 w-4" />Upload QR
                </label>
                {qrPreview && <button type="button" onClick={() => { setRemoveQr(true); setQrFile(null); setQrPreview(null); }} className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">Remove QR</button>}
              </div>
            </div>

            <div className="h-fit shrink-0 rounded-[1.5rem] border border-primary/15 bg-[linear-gradient(180deg,rgba(var(--primary-rgb),0.12),rgba(16,16,16,0.92))] p-5 text-center lg:w-64">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tenant Preview</p>
              <div className="mx-auto aspect-square w-32 overflow-hidden rounded-xl border border-white/20 bg-white p-1.5 shadow-sm mb-4">
                {qrPreview ? <Image src={qrPreview} alt="GCash QR preview" width={128} height={128} unoptimized className="h-full w-full object-cover rounded-lg" /> : <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-slate-300 border border-dashed border-slate-200"><QrCode className="h-6 w-6" /></div>}
              </div>
              <p className="text-sm font-bold text-white truncate">{accountName || "Account name"}</p>
              <p className="mt-1 text-xs text-slate-400">{accountNumber || "Number pending"}</p>
            </div>
          </div>
        </section>
      )}

      {/* WATER SUBSECTION */}
      {activeSection === "water" && (
        <section className="rounded-[1.75rem] border border-white/10 bg-[#171717] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-400">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Water Billing</h4>
              <p className="text-sm text-slate-400">Configure water defaults and overrides per property.</p>
            </div>
          </div>

          <div className="space-y-6 border-t border-white/5 pt-6">
            {workspace.properties.map(property => {
              const baseConfig = configs.find(c => c.property_id === property.id && c.utility_type === "water" && c.unit_id === null)!;
              const overrides = configs.filter(c => c.property_id === property.id && c.utility_type === "water" && c.unit_id !== null);

              return (
                <div key={property.id} className="rounded-[1.4rem] border border-white/10 bg-[#101010] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/5 p-2"><Building2 className="h-4 w-4 text-slate-400" /></div>
                      <p className="text-sm font-bold text-white">{property.name}</p>
                    </div>
                    <button type="button" onClick={() => addOverride(property.id, "water")} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10">
                      <Plus className="h-3 w-3" /> Add Unit Override
                    </button>
                  </div>
                  <UtilityConfigEditor config={baseConfig} units={property.units} isOverride={false} onChange={updateConfig} />
                  {overrides.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                      {overrides.map((config) => (
                        <UtilityConfigEditor key={config.localId} config={config} units={property.units} isOverride onChange={updateConfig} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ELECTRICITY SUBSECTION */}
      {activeSection === "electricity" && (
        <section className="rounded-[1.75rem] border border-white/10 bg-[#171717] p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Electricity Billing</h4>
              <p className="text-sm text-slate-400">Configure electricity defaults and overrides per property.</p>
            </div>
          </div>

          <div className="space-y-6 border-t border-white/5 pt-6">
            {workspace.properties.map(property => {
              const baseConfig = configs.find(c => c.property_id === property.id && c.utility_type === "electricity" && c.unit_id === null)!;
              const overrides = configs.filter(c => c.property_id === property.id && c.utility_type === "electricity" && c.unit_id !== null);

              return (
                <div key={property.id} className="rounded-[1.4rem] border border-white/10 bg-[#101010] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/5 p-2"><Building2 className="h-4 w-4 text-slate-400" /></div>
                      <p className="text-sm font-bold text-white">{property.name}</p>
                    </div>
                    <button type="button" onClick={() => addOverride(property.id, "electricity")} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10">
                      <Plus className="h-3 w-3" /> Add Unit Override
                    </button>
                  </div>
                  <UtilityConfigEditor config={baseConfig} units={property.units} isOverride={false} onChange={updateConfig} />
                  {overrides.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                      {overrides.map((config) => (
                        <UtilityConfigEditor key={config.localId} config={config} units={property.units} isOverride onChange={updateConfig} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>;
}

function UtilityConfigEditor({
  config,
  units,
  isOverride,
  onChange,
}: {
  config: UtilityConfigDraft;
  units: Array<{ id: string; name: string }>;
  isOverride: boolean;
  onChange: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
}) {
  return (
    <div className={cn("rounded-[1.25rem] border p-4 transition-colors", isOverride ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-white/[0.03]")}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", isOverride ? "text-amber-400" : "text-slate-400")}>{isOverride ? "Unit Override" : "Property Default"}</p>
        {isOverride && (
          <select value={config.unit_id ?? ""} onChange={(event) => onChange(config.localId, { unit_id: event.target.value || null })} className="cursor-pointer appearance-none rounded-xl border border-amber-500/20 bg-[#1c160a] px-3 py-1.5 text-xs font-bold text-amber-100 outline-none transition-colors">
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
          </select>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Billing mode"><select value={config.billing_mode} onChange={(event) => onChange(config.localId, { billing_mode: event.target.value as UtilityConfigDraft["billing_mode"] })} className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm font-medium text-white outline-none hover:bg-[#141414]"><option value="included_in_rent">Included in rent</option><option value="tenant_paid">Tenant paid</option></select></Field>
        <Field label="Rate per unit"><input type="number" min="0" step="0.01" value={config.rate_per_unit} onChange={(event) => onChange(config.localId, { rate_per_unit: Number(event.target.value) })} className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm font-bold text-white outline-none focus:border-primary focus:bg-[#0f120d] focus:ring-1 focus:ring-primary" /></Field>
        <Field label="Effective from"><input type="date" value={config.effective_from} onChange={(event) => onChange(config.localId, { effective_from: event.target.value })} className="w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm font-bold text-white outline-none focus:border-primary focus:bg-[#0f120d] focus:ring-1 focus:ring-primary" /></Field>
        <Field label="Status"><select value={config.is_active ? "active" : "paused"} onChange={(event) => onChange(config.localId, { is_active: event.target.value === "active" })} className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm font-medium text-white outline-none hover:bg-[#141414]"><option value="active">Active</option><option value="paused">Paused</option></select></Field>
      </div>
    </div>
  );
}
