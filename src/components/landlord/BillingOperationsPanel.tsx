"use client";

import { useEffect, useState, useReducer, useCallback, useMemo, type ReactNode } from "react";
import {
  Building2,
  Droplets,
  Loader2,
  Plus,
  QrCode,
  Save,
  Smartphone,
  Zap,
  CheckCircle2,
  Globe,
  Target,
  Trash2,
  Info,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MoreHorizontal,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X
} from "lucide-react";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import Image from "next/image";
import { m as motion, AnimatePresence } from "framer-motion";

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
  water: { label: "Water", icon: Droplets, tint: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  electricity: { label: "Electricity", icon: Zap, tint: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

type State = {
  workspace: BillingWorkspace | null;
  configs: UtilityConfigDraft[];
  loading: boolean;
  saving: boolean;
  message: { type: "error" | "success"; value: string } | null;
  isFooterExpanded: boolean;
  showBreakdown: boolean;
  helpContent: { title: string; content: ReactNode } | null;
  accountName: string;
  accountNumber: string;
  isEnabled: boolean;
  qrFile: File | null;
  qrPreview: string | null;
  removeQr: boolean;
};

type Action =
  | { type: "SET_WORKSPACE"; payload: BillingWorkspace }
  | { type: "SET_CONFIGS"; payload: UtilityConfigDraft[] }
  | { type: "UPDATE_CONFIG"; id: string; payload: Partial<UtilityConfigDraft> }
  | { type: "ADD_CONFIG"; payload: UtilityConfigDraft }
  | { type: "REMOVE_CONFIG"; id: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_MESSAGE"; payload: { type: "error" | "success"; value: string } | null }
  | { type: "SET_FOOTER_EXPANDED"; payload: boolean }
  | { type: "SET_SHOW_BREAKDOWN"; payload: boolean }
  | { type: "SET_HELP"; payload: { title: string; content: ReactNode } | null }
  | { type: "UPDATE_PAYMENT"; payload: Partial<Pick<State, 'accountName' | 'accountNumber' | 'isEnabled' | 'qrFile' | 'qrPreview' | 'removeQr'>> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_WORKSPACE":
      return { ...state, workspace: action.payload };
    case "SET_CONFIGS":
      return { ...state, configs: action.payload };
    case "UPDATE_CONFIG":
      return {
        ...state,
        configs: state.configs.map((c) =>
          c.localId === action.id ? { ...c, ...action.payload } : c
        ),
      };
    case "ADD_CONFIG":
      return { ...state, configs: [...state.configs, action.payload] };
    case "REMOVE_CONFIG":
      return {
        ...state,
        configs: state.configs.filter((c) => c.localId !== action.id),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_MESSAGE":
      return { ...state, message: action.payload };
    case "SET_FOOTER_EXPANDED":
      return { ...state, isFooterExpanded: action.payload };
    case "SET_SHOW_BREAKDOWN":
      return { ...state, showBreakdown: action.payload };
    case "SET_HELP":
      return { ...state, helpContent: action.payload };
    case "UPDATE_PAYMENT":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  workspace: null,
  configs: [],
  loading: true,
  saving: false,
  message: null,
  isFooterExpanded: true,
  showBreakdown: false,
  helpContent: null,
  accountName: "",
  accountNumber: "",
  isEnabled: true,
  qrFile: null,
  qrPreview: null,
  removeQr: false,
};

export function BillingOperationsPanel({
  viewMode = "rates",
  propertyId = "all",
  utilityType
}: {
  viewMode?: "rates" | "gcash",
  propertyId?: string,
  utilityType?: "water" | "electricity"
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    workspace,
    configs,
    loading,
    saving,
    message,
    isFooterExpanded,
    showBreakdown,
    helpContent,
    accountName,
    accountNumber,
    isEnabled,
    qrPreview,
    removeQr
  } = state;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/landlord/payment-settings", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const payload = (await response.json()) as BillingWorkspace;
        if (!alive) return;
        
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
            const exists = seededConfigs.some((config) => 
              config.property_id === property.id && 
              config.utility_type === utility && 
              config.unit_id === null
            );
            if (!exists) {
              seededConfigs.push(makeDraft({ 
                property_id: property.id, 
                utility_type: utility, 
                unit_label: utility === "water" ? "cubic_meter" : "kwh" 
              }));
            }
          }
        }
        
        dispatch({ type: "SET_WORKSPACE", payload });
        dispatch({ type: "SET_CONFIGS", payload: seededConfigs });
        dispatch({ 
          type: "UPDATE_PAYMENT", 
          payload: {
            accountName: payload.paymentDestination?.account_name ?? "",
            accountNumber: payload.paymentDestination?.account_number ?? "",
            isEnabled: payload.paymentDestination?.is_enabled ?? true,
            qrPreview: payload.paymentDestination?.qr_image_url ?? null
          }
        });
      } catch (err) {
        console.error(err);
        if (alive) dispatch({ type: "SET_MESSAGE", payload: { type: "error", value: "Unable to load billing settings." } });
      } finally {
        if (alive) dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const updateConfig = useCallback((localId: string, patch: Partial<UtilityConfigDraft>) => {
    dispatch({ type: "UPDATE_CONFIG", id: localId, payload: patch });
  }, []);

  const addOverride = useCallback((pId: string, type: "water" | "electricity") => {
    dispatch({ type: "ADD_CONFIG", payload: makeDraft({ property_id: pId, utility_type: type, unit_label: type === "water" ? "cubic_meter" : "kwh", unit_id: "" }) });
  }, []);

  const removeConfig = useCallback((localId: string) => {
    dispatch({ type: "REMOVE_CONFIG", id: localId });
  }, []);

  const save = async () => {
    try {
      dispatch({ type: "SET_SAVING", payload: true });
      dispatch({ type: "SET_MESSAGE", payload: null });
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
      if (state.qrFile) formData.append("qr", state.qrFile);

      const response = await fetch("/api/landlord/payment-settings", { method: "POST", body: formData });
      if (!response.ok) throw new Error();
      const payload = (await response.json()) as BillingWorkspace;
      
      dispatch({ type: "SET_WORKSPACE", payload });
      dispatch({ 
        type: "UPDATE_PAYMENT", 
        payload: {
          qrFile: null,
          removeQr: false,
          qrPreview: payload.paymentDestination?.qr_image_url ?? null
        }
      });
      dispatch({ type: "SET_MESSAGE", payload: { type: "success", value: "Settings saved successfully." } });
    } catch {
      dispatch({ type: "SET_MESSAGE", payload: { type: "error", value: "Failed to save settings." } });
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  };



  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-3xl border border-border bg-card">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  if (!workspace) return null;

  const pendingChangesCount = configs.length;

  return (
    <div className="space-y-12">
      <AnimatePresence>
        {showBreakdown && (
            <div className="fixed inset-0 z-[110] flex items-end justify-center p-6 sm:items-center">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-2xl flex flex-col max-h-[70vh]"
                >
                    <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                        <div>
                            <h3 className="text-xl font-black text-foreground">Configuration Breakdown</h3>
                            <p className="text-xs text-muted-foreground mt-1">Reviewing {pendingChangesCount} strategies being applied</p>
                        </div>
                        <button 
                            onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
                            className="size-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
                        >
                            <X className="size-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {configs.map((c) => {
                            const property = workspace.properties.find(p => p.id === c.property_id);
                            const unit = property?.units.find(u => u.id === c.unit_id);
                            const Meta = utilityMeta[c.utility_type];
                            const strategyLabel = c.billing_mode === "included_in_rent" 
                                ? "Included" 
                                : (c.responsibility_mode === "tenant_direct" ? "Direct" : "Submetered");

                            return (
                                <div key={c.localId} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("size-10 flex items-center justify-center rounded-xl border", Meta.bg, Meta.tint, Meta.border)}>
                                            <Meta.icon className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-foreground">
                                                {unit ? unit.name : property?.name || "Global"}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{c.utility_type}</span>
                                                <div className="size-1 rounded-full bg-border" />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest",
                                                    strategyLabel === "Included" ? "text-emerald-600" : (strategyLabel === "Direct" ? "text-blue-600" : "text-amber-600")
                                                )}>
                                                    {strategyLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {c.billing_mode === "tenant_paid" && c.responsibility_mode !== "tenant_direct" ? (
                                            <p className="text-sm font-black text-foreground">
                                                ₱{c.rate_per_unit}<span className="text-[10px] text-muted-foreground/40 ml-1">/{c.unit_label === "kwh" ? "kWh" : "m³"}</span>
                                            </p>
                                        ) : (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No Rate</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 border-t border-border bg-muted/5">
                        <button 
                            onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: false })}
                            className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Back to Editor
                        </button>
                    </div>
                </motion.div>
            </div>
        )}

        {helpContent && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 shadow-2xl"
            >
              <div className="absolute -right-12 -top-12 opacity-[0.03]">
                <HelpCircle className="size-48" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                    <Info className="size-3" />
                    Strategy Guide
                  </div>
                  <button 
                    onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
                    className="size-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
                  >
                    <X className="size-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2">
                    <h4 className="text-2xl font-black text-foreground">{helpContent.title}</h4>
                    <div className="size-12 bg-primary rounded-full" />
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed">
                  {helpContent.content}
                </div>

                <button
                  onClick={() => dispatch({ type: 'SET_HELP', payload: null })}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Collapsible Sticky Action Footer */}
      <div className="fixed -bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.div 
            layout
            initial={false}
            animate={{ 
                width: isFooterExpanded ? "auto" : "48px",
                height: isFooterExpanded ? "auto" : "48px"
            }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className={cn(
                "pointer-events-auto bg-background/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden",
                isFooterExpanded ? "px-3 py-3 rounded-[2rem]" : "rounded-full"
            )}
        >
          <AnimatePresence mode="wait">
            {isFooterExpanded ? (
                <motion.div 
                    key="expanded"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-6 pl-5 pr-2"
                >
                    <button 
                        onClick={() => dispatch({ type: 'SET_SHOW_BREAKDOWN', payload: true })}
                        className="hidden md:flex flex-col text-left hover:opacity-70 transition-opacity"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Review & Save</span>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                            Apply <span className="font-black text-foreground underline decoration-primary/30 underline-offset-4">{pendingChangesCount}</span> configurations to property.
                        </p>
                    </button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <button
                        onClick={save}
                        disabled={saving}
                        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.05] active:scale-95 disabled:opacity-50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                        Confirm Changes
                    </button>
                    <button 
                        onClick={() => dispatch({ type: 'SET_FOOTER_EXPANDED', payload: false })}
                        className="size-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors border border-border"
                    >
                        <ChevronDown className="size-4 text-muted-foreground" />
                    </button>
                </motion.div>
            ) : (
                <motion.button
                    key="collapsed"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={() => dispatch({ type: 'SET_FOOTER_EXPANDED', payload: true })}
                    className="flex size-12 items-center justify-center text-primary transition-all hover:bg-primary/5"
                    title="Expand Commit Console"
                >
                    <ChevronUp className="size-6" />
                </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4",
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          )}
        >
          {message.type === "success" ? <CheckCircle2 className="size-5" /> : <Info className="size-5" />}
          <span className="text-sm font-black">{message.value}</span>
        </motion.div>
      )}

      {/* GCASH MODE */}
      {viewMode === "gcash" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Smartphone className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground">GCash Integration</h4>
                    <p className="text-xs text-muted-foreground">Receive payments directly from tenants</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Account Name">
                    <input
                      value={accountName}
                      placeholder="e.g. Juan Dela Cruz"
                      onChange={(event) => dispatch({ type: 'UPDATE_PAYMENT', payload: { accountName: event.target.value } })}
                      className="w-full rounded-xl border border-border bg-muted/20 dark:bg-white/[0.03] px-4 py-3 text-sm font-black text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </Field>
                  <Field label="GCash Number">
                    <input
                      value={accountNumber}
                      placeholder="0917 XXX XXXX"
                      onChange={(event) => dispatch({ type: 'UPDATE_PAYMENT', payload: { accountNumber: event.target.value } })}
                      className="w-full rounded-xl border border-border bg-muted/20 dark:bg-white/[0.03] px-4 py-3 text-sm font-black text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </Field>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  <div className={cn(
                    "flex flex-1 w-full cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all",
                    isEnabled ? "border-primary/30 bg-primary/5 dark:bg-primary/[0.03]" : "border-border bg-muted/20 dark:bg-white/[0.02]"
                  )}>
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-foreground">Enable Payments</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">Allow tenants to use this method</p>
                    </div>
                    <div className={cn("flex h-6 w-11 items-center rounded-full px-1 transition-all", isEnabled ? "bg-primary" : "bg-muted-foreground/30")}>
                      <div className={cn("size-4 rounded-full bg-white transition-all", isEnabled ? "translate-x-5" : "translate-x-0")} />
                    </div>
                    <label htmlFor="enable-payments" className="sr-only">Enable Payments</label>
                    <input id="enable-payments" type="checkbox" checked={isEnabled} onChange={() => dispatch({ type: 'UPDATE_PAYMENT', payload: { isEnabled: !isEnabled } })} className="hidden" />
                  </div>

                  <label htmlFor="qr-upload" className="flex flex-1 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted/50 hover:border-primary/40 hover:text-primary">
                    <input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (file) { dispatch({ type: 'UPDATE_PAYMENT', payload: { qrFile: file, qrPreview: URL.createObjectURL(file), removeQr: false } }); } else { dispatch({ type: 'UPDATE_PAYMENT', payload: { qrFile: null } }); } }} />
                    <QrCode className="size-5 mb-1" />
                    {qrPreview ? "Change QR Code" : "Upload QR Code"}
                  </label>
                </div>

                <AnimatePresence>
                  {qrPreview && (
                    <motion.button
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      type="button"
                      onClick={() => { dispatch({ type: 'UPDATE_PAYMENT', payload: { removeQr: true, qrFile: null, qrPreview: null } }); }}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-xs font-black text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                    >
                      <Trash2 className="size-4 w-4" />
                      Remove QR Code
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Simple Preview Card */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Tenant View Preview</p>

                <div className="relative mx-auto mb-6 aspect-square w-48 overflow-hidden rounded-2xl bg-white/90 dark:bg-white/10 p-6 shadow-inner border border-border">
                  {qrPreview ? (
                    <Image src={qrPreview} alt="QR Preview" width={200} height={200} unoptimized className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/30">
                      <QrCode className="size-10" />
                      <span className="text-[10px] font-black">No QR Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 py-4 border-t border-border">
                  <h5 className="text-lg font-black text-foreground truncate">{accountName || "Juan Dela Cruz"}</h5>
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="size-3.5" />
                    <p className="font-mono text-sm font-black text-primary tracking-tight">{accountNumber || "0000 000 0000"}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center items-center gap-2 text-[10px] font-black text-muted-foreground/40">
                  <ShieldCheck className="size-3.5" />
                  <span>iReside Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RENT CONFIG MODE */}
      {viewMode === "rates" && (
        <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          {workspace.properties
            .filter(p => propertyId === "all" || p.id === propertyId)
            .map(property => (
              <div key={property.id} className="space-y-8">
                {/* Property Header */}
                <div className="relative group overflow-hidden rounded-[2.5rem] border border-border bg-card p-10 shadow-sm transition-all hover:shadow-md dark:bg-white/[0.01]">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                    <Building2 className="size-40" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="size-16 flex items-center justify-center rounded-[1.25rem] bg-muted/50 border border-border text-foreground shadow-inner">
                        <Building2 className="size-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl font-black text-foreground">{property.name}</h4>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Target className="size-3" />
                            {property.units.length} Units Active
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <ShieldCheck className="size-3" />
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all">
                        View Inventory
                      </button>
                      <button className="size-12 flex items-center justify-center rounded-xl hover:bg-muted transition-colors border border-border bg-card">
                        <MoreHorizontal className="size-5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Utility Grid */}
                <div className={cn(
                  "grid grid-cols-1 gap-8",
                  !utilityType && "lg:grid-cols-2"
                )}>
                  {(["water", "electricity"] as const)
                    .filter(type => !utilityType || type === utilityType)
                    .map(type => {
                    const baseConfig = configs.find(c => c.property_id === property.id && c.utility_type === type && c.unit_id === null)!;
                    const overrides = configs.filter(c => c.property_id === property.id && c.utility_type === type && c.unit_id !== null);
                    const meta = utilityMeta[type];

                    return (
                      <div key={type} className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                          <div className={cn("flex items-center gap-3 px-4 py-2 rounded-2xl border text-sm font-black uppercase tracking-wider shadow-sm", meta.tint, meta.bg, meta.border)}>
                            <meta.icon className="size-4" />
                            {meta.label} Management
                          </div>
                          <button
                            onClick={() => addOverride(property.id, type)}
                            className="group inline-flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-all"
                          >
                            <div className="size-8 flex items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
                              <Plus className="size-4" />
                            </div>
                            Set Unit-Specific Rule
                          </button>
                        </div>

                        {/* Default Logic */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pl-4">
                            <div className="size-1.5 rounded-full bg-primary" />
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Property Default</span>
                          </div>
                          <UtilityConfigEditor
                            config={baseConfig}
                            units={property.units}
                            isOverride={false}
                            onChange={updateConfig}
                            mounted={mounted}
                            onHelp={() => {
                              dispatch({
                                type: 'SET_HELP',
                                payload: {
                                  title: "Billing Strategy",
                                  content: (
                                    <div className="space-y-4">
                                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                        <p className="font-black text-foreground mb-1">Included in Rent</p>
                                        <p>The utility cost is part of the rent. Tenants don&apos;t pay anything extra.</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                        <p className="font-black text-foreground mb-1">Submetered (Landlord Managed)</p>
                                        <p>The property has one main bill that you pay. You use submeters to bill tenants for their specific usage through iReside.</p>
                                      </div>
                                      <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                        <p className="font-black text-foreground mb-1">Direct to Provider</p>
                                        <p>Tenants have their own separate accounts and meters. They receive and pay their own bills directly to the utility company.</p>
                                      </div>
                                    </div>
                                  )
                                }
                              });
                            }}
                          />
                        </div>

                        {/* Overrides */}
                        <div className="space-y-4 pt-6 border-t border-border mt-4 h-full flex flex-col">
                          <div className="flex items-center gap-2 pl-4">
                            <Target className={cn("size-4", overrides.length > 0 ? "text-amber-600" : "text-muted-foreground/30")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", overrides.length > 0 ? "text-amber-600" : "text-muted-foreground/30")}>
                              Unit Customizations
                            </span>
                          </div>

                          {overrides.length > 0 ? (
                            <div className="space-y-6">
                              {overrides.map((ov) => (
                                <UtilityConfigEditor
                                  key={ov.localId}
                                  config={ov}
                                  units={property.units}
                                  isOverride
                                  onChange={updateConfig}
                                  onRemove={() => removeConfig(ov.localId)}
                                  onHelp={() => {
                                    dispatch({
                                      type: 'SET_HELP',
                                      payload: {
                                        title: "Billing Strategy",
                                        content: (
                                          <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                              <p className="font-black text-foreground mb-1">Included in Rent</p>
                                              <p>Utilities are covered by the rent payment.</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                              <p className="font-black text-foreground mb-1">Submetered</p>
                                              <p>You bill tenants based on their submeter readings.</p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                              <p className="font-black text-foreground mb-1">Direct</p>
                                              <p>Tenants pay the utility company directly.</p>
                                            </div>
                                          </div>
                                        )
                                      }
                                    });
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex-1 min-h-[100px] flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/50 bg-muted/5 opacity-40">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">No customizations active</p>
                            </div>
                          )}
                        </div>
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

function Field({ 
  label, 
  children,
  onHelp
}: { 
  label: string; 
  children: ReactNode;
  onHelp?: () => void;
}) {
  return (
    <div className="block space-y-2">
      <div className="flex items-center gap-2 pl-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>
        {onHelp && (
          <button 
            type="button"
            onClick={onHelp}
            className="text-muted-foreground/40 hover:text-primary transition-colors"
          >
            <HelpCircle className="size-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function UtilityConfigEditor({
  config,
  units,
  isOverride,
  onChange,
  onRemove,
  onHelp,
  mounted
}: {
  config: UtilityConfigDraft;
  units: Array<{ id: string; name: string }>;
  isOverride: boolean;
  onChange: (localId: string, patch: Partial<UtilityConfigDraft>) => void;
  onRemove?: () => void;
  onHelp?: () => void;
  mounted?: boolean;
}) {
  const Icon = config.utility_type === "water" ? Droplets : Zap;
  
  // Unified derived state
  const strategy = config.billing_mode === "included_in_rent" 
    ? "included" 
    : (config.responsibility_mode === "tenant_direct" ? "direct" : "submetered");

  const isSubmetered = strategy === "submetered";

  return (
    <div className={cn(
      "group rounded-3xl border transition-all relative overflow-hidden",
      isOverride 
        ? "border-amber-500/20 bg-amber-500/[0.02] p-6" 
        : "border-border bg-card shadow-sm p-8"
    )}>
      {/* Decorative Watermark */}
      <div className={cn(
        "absolute -bottom-6 -right-6 opacity-[0.03] transition-opacity group-hover:opacity-[0.06]",
        config.utility_type === "water" ? "text-sky-500" : "text-amber-500"
      )}>
        <Icon className="size-28 rotate-12" />
      </div>

      <div className="relative z-10">
        <div className={cn(
          "mb-8 flex items-center justify-between",
          isOverride && "mb-6"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center justify-center rounded-2xl border transition-colors",
              isOverride 
                ? "size-10 bg-amber-500/10 text-amber-500 border-amber-500/20" 
                : "size-12 bg-primary/10 text-primary border-primary/20"
            )}>
              {isOverride ? <Target className="size-5" /> : <Globe className="size-6" />}
            </div>
            <div className="space-y-0.5">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em]",
                isOverride ? "text-amber-500" : "text-primary"
              )}>
                {isOverride ? "Unit Customization" : "Property Default"}
              </span>
              {!isOverride && (
                <p className="text-sm font-black text-foreground">
                  Global settings for this building
                </p>
              )}
            </div>
          </div>

          {isOverride && (
            <div className="flex items-center gap-3">
              <select
                value={config.unit_id ?? ""}
                onChange={(e) => onChange(config.localId, { unit_id: e.target.value || null })}
                className="rounded-xl border border-amber-500/30 bg-card px-4 py-2 text-xs font-black text-amber-600 outline-none focus:ring-4 focus:ring-amber-500/10 shadow-sm"
              >
                <option value="">Select Unit...</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button
                onClick={onRemove}
                className="size-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className={cn("space-y-8", isOverride && "space-y-6")}>
          {/* Step 1: Logic Configuration */}
          <div className="space-y-6">
            {!isOverride && (
              <div className="relative flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">1. Select Logic</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
            )}
            
            <div className="space-y-6">
              <Field 
                label="Billing Strategy"
                onHelp={onHelp}
              >
                <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-muted/10 p-1">
                  <button 
                    onClick={() => onChange(config.localId, { billing_mode: "included_in_rent", responsibility_mode: "landlord_bills" })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      strategy === "included" 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {strategy === "included" && <CheckCircle2 className="size-3" />}
                    Included
                  </button>
                  <button 
                    onClick={() => onChange(config.localId, { billing_mode: "tenant_paid", responsibility_mode: "landlord_bills" })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      strategy === "submetered" 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {strategy === "submetered" && <CheckCircle2 className="size-3" />}
                    Submetered
                  </button>
                  <button 
                    onClick={() => onChange(config.localId, { billing_mode: "tenant_paid", responsibility_mode: "tenant_direct" })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                      strategy === "direct" 
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                        : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    {strategy === "direct" && <CheckCircle2 className="size-3" />}
                    Direct
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Step 2: Rates & Billing */}
          <AnimatePresence mode="wait">
            {isSubmetered && (
              <motion.div 
                key="pricing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {!isOverride && (
                  <div className="relative flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">2. Rates & Billing</span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                )}

                <div className={cn(
                  "grid gap-6 sm:grid-cols-2 rounded-3xl border border-primary/10 bg-primary/[0.02] relative overflow-hidden",
                  isOverride ? "p-6" : "p-8"
                )}>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] grayscale">
                    <DollarSign className="size-20" />
                  </div>
                  
                  <Field label="Rate per Unit">
                    <div className="relative group">
                      <span className={cn(
                        "absolute top-1/2 -translate-y-1/2 font-black text-primary/40 transition-colors group-focus-within:text-primary",
                        isOverride ? "left-4 text-base" : "left-5 text-lg"
                      )}>₱</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={config.rate_per_unit}
                        onChange={(e) => onChange(config.localId, { rate_per_unit: parseFloat(e.target.value) })}
                        className={cn(
                          "w-full rounded-2xl border border-border bg-card font-black tracking-tight text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5",
                          isOverride ? "h-12 pl-8 pr-4 text-lg" : "h-16 pl-10 pr-4 text-2xl"
                        )}
                      />
                      <div className={cn("absolute top-1/2 -translate-y-1/2 flex flex-col items-end", isOverride ? "right-4" : "right-5")}>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{config.utility_type === "water" ? "m³" : "kWh"}</span>
                      </div>
                    </div>
                  </Field>
                  
                  <Field label="Start Date">
                    <div className="relative group">
                      {/* Custom UI Trigger */}
                      <div className={cn(
                        "flex items-center gap-4 w-full rounded-2xl border border-border bg-card font-black text-foreground transition-all group-focus-within:border-primary group-focus-within:ring-4 group-focus-within:ring-primary/5",
                        isOverride ? "h-12 px-4" : "h-16 px-5"
                      )}>
                        <Calendar className={cn(
                          "text-muted-foreground/30 transition-colors group-focus-within:text-primary shrink-0",
                          isOverride ? "size-4" : "size-5"
                        )} />
                        <span className={cn("flex-1 text-left", isOverride ? "text-xs" : "text-sm")}>
                          <ClientOnlyDate date={config.effective_from} format={{ month: '2-digit', day: '2-digit', year: 'numeric' }} />
                        </span>
                        <div className="h-6 w-px bg-border/40 hidden md:block" />
                        <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-primary/40 transition-all" />
                      </div>

                      {/* Hidden Native Picker */}
                      <input 
                        type="date"
                        value={config.effective_from}
                        onChange={(e) => onChange(config.localId, { effective_from: e.target.value })}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Strategy Insight */}
          {!isOverride && (
            <div className={cn(
                "flex gap-5 p-6 rounded-3xl border transition-colors",
                isSubmetered && config.rate_per_unit === 0 
                    ? "bg-amber-500/5 border-amber-500/20" 
                    : "bg-muted/10 border-border/50"
            )}>
              <div className={cn(
                  "size-11 flex items-center justify-center rounded-xl border shadow-sm shrink-0",
                  isSubmetered && config.rate_per_unit === 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-card border-border"
              )}>
                {isSubmetered && config.rate_per_unit === 0 ? (
                    <Info className="size-5 text-amber-500" />
                ) : (
                    <Info className="size-5 text-primary" />
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Operational Strategy</p>
                    {isSubmetered && config.rate_per_unit === 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[8px] font-black uppercase text-amber-600 tracking-tighter">Action Required</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {strategy === "included" && "Simplified strategy: This utility is fully subsidized within the base rent. No additional collections are processed."}
                  {strategy === "submetered" && (
                    config.rate_per_unit === 0 
                        ? "Warning: You've selected Submetered Billing but set the rate to ₱0. No revenue will be recovered from tenants unless a rate is defined."
                        : "Revenue Recovery: Landlord manages the primary utility account and recovers costs from tenants based on submeter consumption at the defined rate."
                  )}
                  {strategy === "direct" && "Zero-Liability: Tenants manage their own utility accounts and receive bills directly from the provider. iReside will not track or invoice these costs."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
