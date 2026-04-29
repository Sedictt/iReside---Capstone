"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Droplets, Loader2, Plus, QrCode, Save, Smartphone, Zap, CheckCircle2, Globe, Target, Trash2 } from "lucide-react";
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
  // UI-only helper for the new modes
  responsibility_mode?: "landlord_bills" | "tenant_direct";
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
  responsibility_mode: seed.responsibility_mode ?? "landlord_bills"
});

const utilityMeta = {
  water: { label: "Water", icon: Droplets, tint: "text-sky-500", unit: "cubic_meter" as const },
  electricity: { label: "Electricity", icon: Zap, tint: "text-amber-500", unit: "kwh" as const },
};

export function BillingOperationsPanel({ 
  viewMode = "rates", 
  propertyId = "all" 
}: { 
  viewMode?: "rates" | "gcash",
  propertyId?: string
}) {
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
    load();
    return () => { alive = false; };
  }, []);

  const updateConfig = (localId: string, patch: Partial<UtilityConfigDraft>) => {
    setConfigs((prev) => prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c)));
  };

  const addOverride = (pId: string, type: "water" | "electricity") => {
    setConfigs((prev) => [...prev, makeDraft({ property_id: pId, utility_type: type, unit_label: utilityMeta[type].unit, unit_id: "" })]);
  };

  const removeConfig = (localId: string) => {
    setConfigs((prev) => prev.filter((c) => c.localId !== localId));
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
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
      setMessage({ type: "success", value: "Billing settings saved successfully." });
    } catch {
      setMessage({ type: "error", value: "Unable to save billing settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-[2rem] border border-border bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Synchronizing billing engine...</p>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="space-y-10">
      {/* Save Trigger - Floating or Sticky Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-foreground">
            {viewMode === "rates" ? "Rent & Utility Configuration" : "Payment Methods"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {viewMode === "rates" ? "Configure billing logic and consumption rates." : "Manage your financial collection channels."}
          </p>
        </div>
        <button 
          onClick={save} 
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update Engine
        </button>
      </div>

      {message && (
        <div className={cn(
          "flex items-center gap-3 rounded-2xl border p-4 animate-in fade-in slide-in-from-top-2",
          message.type === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-red-500/20 bg-red-500/5 text-red-600"
        )}>
          {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="text-sm font-bold">{message.value}</span>
        </div>
      )}

      {/* GCASH MODE */}
      {viewMode === "gcash" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-[2.5rem] border border-border bg-card p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                  <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-foreground tracking-tight">GCash Collection</h4>
                    <p className="text-sm font-medium text-muted-foreground">Digital wallet for real-time rental payments.</p>
                  </div>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  <Field label="Account Holder Name">
                    <input 
                      value={accountName} 
                      placeholder="e.g. Juan Dela Cruz"
                      onChange={(event) => setAccountName(event.target.value)} 
                      className="w-full rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                    />
                  </Field>
                  <Field label="GCash Mobile Number">
                    <input 
                      value={accountNumber} 
                      placeholder="0917 XXX XXXX"
                      onChange={(event) => setAccountNumber(event.target.value)} 
                      className="w-full rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10" 
                    />
                  </Field>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-6">
                  <label className={cn(
                    "flex flex-1 min-w-[240px] cursor-pointer items-center justify-between rounded-[2rem] border p-6 transition-all",
                    isEnabled ? "border-primary/50 bg-primary/5 shadow-inner" : "border-border bg-muted/20"
                  )}>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black uppercase tracking-widest text-foreground">Accept Payments</span>
                      <p className="text-[10px] font-medium text-muted-foreground">Make this available to all tenants</p>
                    </div>
                    <div className={cn("flex h-6 w-12 items-center rounded-full px-1.5 transition-colors", isEnabled ? "bg-primary" : "bg-muted-foreground/30")}>
                      <div className={cn("h-4 w-4 rounded-full bg-white transition-transform shadow-sm", isEnabled ? "translate-x-5" : "translate-x-0")} />
                    </div>
                    <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled((current) => !current)} className="hidden" />
                  </label>

                  <label className="flex flex-1 min-w-[240px] cursor-pointer items-center justify-center gap-3 rounded-[2rem] border border-dashed border-border p-6 text-sm font-black text-muted-foreground transition-all hover:bg-muted/30 hover:text-foreground">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; setQrFile(file); if (file) { setQrPreview(URL.createObjectURL(file)); setRemoveQr(false); } }} />
                    <QrCode className="h-6 w-6" />
                    {qrPreview ? "Change QR Code" : "Upload QR Code"}
                  </label>
                </div>

                {qrPreview && (
                  <button 
                    type="button" 
                    onClick={() => { setRemoveQr(true); setQrFile(null); setQrPreview(null); }} 
                    className="mt-6 w-full rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/10"
                  >
                    Delete QR Asset
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="sticky top-8 rounded-[3rem] border border-primary/20 bg-[linear-gradient(180deg,rgba(var(--primary-rgb),0.1),transparent)] p-10 text-center shadow-2xl shadow-primary/5">
                <p className="mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-primary">Live Checkout Preview</p>
                
                <div className="relative mx-auto mb-8 aspect-square w-56 overflow-hidden rounded-[3rem] bg-white p-8 shadow-2xl">
                  {qrPreview ? (
                    <Image src={qrPreview} alt="GCash QR preview" width={224} height={224} unoptimized className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-[2.5rem] border-4 border-dashed border-slate-100 text-slate-200">
                      <QrCode className="h-12 w-12" />
                      <span className="text-[10px] font-black uppercase tracking-widest">No QR Data</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-[3rem] border border-black/5 pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <h5 className="text-xl font-black tracking-tight text-foreground truncate">{accountName || "Juan Dela Cruz"}</h5>
                  <p className="font-mono text-base font-black text-primary">{accountNumber || "0000 000 0000"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RENT CONFIG MODE */}
      {viewMode === "rates" && (
        <section className="space-y-12 animate-in fade-in duration-700">
          {workspace.properties
            .filter(p => propertyId === "all" || p.id === propertyId)
            .map(property => (
              <div key={property.id} className="space-y-8">
                {/* Property Identity Bar */}
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-muted p-3">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-foreground tracking-tight">{property.name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Property Scope</p>
                  </div>
                </div>

                {/* Utility Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {(["water", "electricity"] as const).map(type => {
                    const baseConfig = configs.find(c => c.property_id === property.id && c.utility_type === type && c.unit_id === null)!;
                    const overrides = configs.filter(c => c.property_id === property.id && c.utility_type === type && c.unit_id !== null);
                    
                    return (
                      <div key={type} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <div className={cn("flex items-center gap-2", utilityMeta[type].tint)}>
                            {type === "water" ? <Droplets className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                            <span className="text-sm font-black uppercase tracking-widest">{utilityMeta[type].label}</span>
                          </div>
                          <button 
                            onClick={() => addOverride(property.id, type)}
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                          >
                            + Add Unit Override
                          </button>
                        </div>

                        {/* Global/Default Editor */}
                        <UtilityConfigEditor 
                          config={baseConfig} 
                          units={property.units} 
                          isOverride={false} 
                          onChange={updateConfig} 
                        />

                        {/* Targeted Overrides */}
                        {overrides.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-border/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 pl-2">Targeted Unit Overrides</p>
                            {overrides.map((ov) => (
                              <UtilityConfigEditor 
                                key={ov.localId} 
                                config={ov} 
                                units={property.units} 
                                isOverride 
                                onChange={updateConfig} 
                                onRemove={() => removeConfig(ov.localId)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
          ))}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">{label}</span>
      {children}
    </label>
  );
}

function UtilityConfigEditor({
  config,
  units,
  isOverride,
  onChange,
  onRemove
}: {
  config: UtilityConfigDraft;
  units: Array<{ id: string; name: string }>;
  isOverride: boolean;
  onChange: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className={cn(
      "rounded-[2.5rem] border p-8 transition-all relative overflow-hidden",
      isOverride ? "border-amber-500/20 bg-amber-500/[0.02]" : "border-border bg-card shadow-sm"
    )}>
      {/* Decorative Badge */}
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-muted/10 opacity-10" />

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isOverride ? (
            <Target className="h-4 w-4 text-amber-500" />
          ) : (
            <Globe className="h-4 w-4 text-primary" />
          )}
          <p className={cn(
            "text-[10px] font-black uppercase tracking-[0.15em]",
            isOverride ? "text-amber-600" : "text-primary"
          )}>
            {isOverride ? "Unit-Specific Configuration" : "Global Property Default"}
          </p>
        </div>

        {isOverride && (
          <div className="flex items-center gap-3">
            <select 
              value={config.unit_id ?? ""} 
              onChange={(e) => onChange(config.localId, { unit_id: e.target.value || null })}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs font-black text-amber-600 outline-none"
            >
              <option value="">Select Unit...</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button 
              onClick={onRemove}
              className="rounded-xl p-2 text-red-500 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Step 1: Billing Mode & Responsibility */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Billing Structure">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
              <button 
                onClick={() => onChange(config.localId, { billing_mode: "included_in_rent" })}
                className={cn(
                  "rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  config.billing_mode === "included_in_rent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50"
                )}
              >
                Included
              </button>
              <button 
                onClick={() => onChange(config.localId, { billing_mode: "tenant_paid" })}
                className={cn(
                  "rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  config.billing_mode === "tenant_paid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50"
                )}
              >
                Separate
              </button>
            </div>
          </Field>

          {config.billing_mode === "tenant_paid" && (
            <Field label="Payment Responsibility">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-1">
                <button 
                  onClick={() => onChange(config.localId, { responsibility_mode: "landlord_bills" })}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    config.responsibility_mode !== "tenant_direct" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50"
                  )}
                >
                  Landlord Bills
                </button>
                <button 
                  onClick={() => onChange(config.localId, { responsibility_mode: "tenant_direct" })}
                  className={cn(
                    "rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    config.responsibility_mode === "tenant_direct" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-card/50"
                  )}
                >
                  Direct Pay
                </button>
              </div>
            </Field>
          )}
        </div>

        {/* Step 2: Rate Logic */}
        {config.billing_mode === "tenant_paid" && config.responsibility_mode !== "tenant_direct" && (
          <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
            <Field label={config.utility_type === "water" ? "Rate per Cubic Meter" : "Rate per kWh"}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40">₱</span>
                <input 
                  type="number" 
                  step="0.01"
                  value={config.rate_per_unit}
                  onChange={(e) => onChange(config.localId, { rate_per_unit: parseFloat(e.target.value) })}
                  className="w-full rounded-2xl border border-border bg-muted/20 py-4 pl-10 pr-5 text-sm font-black text-foreground outline-none focus:border-primary"
                />
              </div>
            </Field>
            <Field label="Effective From">
              <input 
                type="date"
                value={config.effective_from}
                onChange={(e) => onChange(config.localId, { effective_from: e.target.value })}
                className="w-full rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm font-black text-foreground outline-none focus:border-primary"
              />
            </Field>
          </div>
        )}

        {/* Informational Alerts */}
        <div className="rounded-2xl bg-muted/30 p-4 flex gap-3 items-start">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-[11px] font-medium leading-relaxed text-muted-foreground/80">
            {config.billing_mode === "included_in_rent" && "Landlord pays the utility provider. No separate meter readings are required for tenants."}
            {config.billing_mode === "tenant_paid" && config.responsibility_mode === "landlord_bills" && "Landlord pays the provider and recovers costs from tenants via monthly metered invoices."}
            {config.billing_mode === "tenant_paid" && config.responsibility_mode === "tenant_direct" && "Tenants pay utility providers (Meralco/Maynilad) directly. Meter reading in this app is disabled for this unit."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );
}
