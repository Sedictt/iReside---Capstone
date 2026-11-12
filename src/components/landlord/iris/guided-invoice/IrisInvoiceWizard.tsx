"use client";

import React, { useReducer, useEffect, useState } from "react";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  RotateCcw,
  Home,
  Droplets,
  Zap,
  Plus,
  Send,
} from "lucide-react";

import {
  irisFsmReducer,
  initialIrisInvoiceState,
  getInvoiceTotalPreview,
  type IrisInvoiceState,
  type IrisFsmEvent,
  type InvoiceBuildContext,
  type CustomItem,
} from "@/lib/services/iris/iris-fsm";
import type { ActiveLeaseSummary } from "@/lib/services/iris/iris-operations.service";
import { formatPhpCurrency } from "@/lib/services/iris/iris-invoice-flow";

import { UnitSelectorStep } from "./UnitSelectorStep";
import { MeterReadingInputStep } from "./MeterReadingInputStep";
import { CustomItemsStep } from "./CustomItemsStep";
import { InvoiceReviewCard } from "./InvoiceReviewCard";

export interface IrisInvoiceWizardProps {
  initialLeases?: ActiveLeaseSummary[];
  initialContext?: InvoiceBuildContext;
  onSuccess?: (result: {
    invoiceId: string;
    invoiceNumber: string;
    totalAmount: number;
    tenantName: string;
  }) => void;
  onCancel?: () => void;
}

interface StepDefinition {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WIZARD_STEPS: StepDefinition[] = [
  { id: 1, label: "Select Unit", icon: Home },
  { id: 2, label: "Water Submeter", icon: Droplets },
  { id: 3, label: "Electricity Submeter", icon: Zap },
  { id: 4, label: "Extra Charges", icon: Plus },
  { id: 5, label: "Review & Send", icon: Send },
];

export function IrisInvoiceWizard({
  initialLeases,
  initialContext,
  onSuccess,
  onCancel,
}: IrisInvoiceWizardProps) {
  const [state, dispatch] = useReducer(irisFsmReducer, initialIrisInvoiceState);
  const [leases, setLeases] = useState<ActiveLeaseSummary[]>(initialLeases ?? []);
  const [loadingLeases, setLoadingLeases] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Local state for meter readings within current step before dispatch
  const [waterReading, setWaterReading] = useState<number | undefined>(undefined);
  const [waterMeterReset, setWaterMeterReset] = useState(false);
  const [waterSkipped, setWaterSkipped] = useState(false);

  const [electricReading, setElectricReading] = useState<number | undefined>(undefined);
  const [electricMeterReset, setElectricMeterReset] = useState(false);
  const [electricSkipped, setElectricSkipped] = useState(false);

  // Initialize wizard with context or start selection
  useEffect(() => {
    if (initialContext) {
      dispatch({ type: "START_INVOICE" });
      dispatch({ type: "CONTEXT_LOADED", payload: initialContext });
      if (initialContext.water?.currentReading !== undefined) {
        setWaterReading(initialContext.water.currentReading);
      }
      if (initialContext.water?.allowMeterReset) {
        setWaterMeterReset(true);
      }
      if (initialContext.electricity?.currentReading !== undefined) {
        setElectricReading(initialContext.electricity.currentReading);
      }
      if (initialContext.electricity?.allowMeterReset) {
        setElectricMeterReset(true);
      }
    } else {
      dispatch({ type: "START_INVOICE" });
      if (!initialLeases || initialLeases.length === 0) {
        loadLandlordContext();
      }
    }
  }, [initialContext, initialLeases]);

  // Load landlord leases if not provided
  const loadLandlordContext = async () => {
    setLoadingLeases(true);
    try {
      const res = await fetch("/api/landlord/iris/context");
      if (res.ok) {
        const json = await res.json();
        const activeLeases: ActiveLeaseSummary[] = json.data?.activeLeases ?? [];
        setLeases(activeLeases);
      } else {
        setStepError("Failed to load active leases. Please refresh or try again.");
      }
    } catch {
      setStepError("Network error while loading leases.");
    } finally {
      setLoadingLeases(false);
    }
  };

  // When a unit/lease is selected, fetch its prefilled invoice context
  const handleSelectLease = async (leaseId: string) => {
    setStepError(null);
    dispatch({ type: "SELECT_LEASE", payload: { leaseId } });

    try {
      const res = await fetch("/api/landlord/iris/invoice-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setStepError(errJson.error || "Failed to load lease billing details.");
        return;
      }

      const json = await res.json();
      const ctx: InvoiceBuildContext = json.context;

      // Populate local reading defaults
      if (ctx.water) {
        setWaterReading(ctx.water.currentReading);
        setWaterMeterReset(Boolean(ctx.water.allowMeterReset));
        setWaterSkipped(Boolean(ctx.water.skipped));
      } else {
        setWaterSkipped(true);
      }

      if (ctx.electricity) {
        setElectricReading(ctx.electricity.currentReading);
        setElectricMeterReset(Boolean(ctx.electricity.allowMeterReset));
        setElectricSkipped(Boolean(ctx.electricity.skipped));
      } else {
        setElectricSkipped(true);
      }

      dispatch({ type: "CONTEXT_LOADED", payload: ctx });
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "Error fetching lease context.");
    }
  };

  // Water step progression
  const handleProceedWater = () => {
    setStepError(null);
    const ctx = state.context;
    if (!ctx) return;

    if (waterSkipped || !ctx.water || ctx.water.billingMode === "included_in_rent") {
      dispatch({ type: "SKIP_WATER" });
      return;
    }

    if (waterReading === undefined) {
      setStepError("Please enter a water meter reading or check the skip option.");
      return;
    }

    if (waterReading < ctx.water.previousReading && !waterMeterReset) {
      setStepError(
        `Water reading (${waterReading}) cannot be less than previous (${ctx.water.previousReading}) without meter reset checked.`
      );
      return;
    }

    dispatch({
      type: "SET_WATER_READING",
      payload: {
        currentReading: waterReading,
        allowMeterReset: waterMeterReset,
        skipped: false,
      },
    });
  };

  // Electricity step progression
  const handleProceedElectric = () => {
    setStepError(null);
    const ctx = state.context;
    if (!ctx) return;

    if (electricSkipped || !ctx.electricity || ctx.electricity.billingMode === "included_in_rent") {
      dispatch({ type: "SKIP_ELECTRIC" });
      return;
    }

    if (electricReading === undefined) {
      setStepError("Please enter an electricity meter reading or check the skip option.");
      return;
    }

    if (electricReading < ctx.electricity.previousReading && !electricMeterReset) {
      setStepError(
        `Electricity reading (${electricReading}) cannot be less than previous (${ctx.electricity.previousReading}) without meter reset checked.`
      );
      return;
    }

    dispatch({
      type: "SET_ELECTRIC_READING",
      payload: {
        currentReading: electricReading,
        allowMeterReset: electricMeterReset,
        skipped: false,
      },
    });
  };

  // Custom Items handlers
  const handleAddCustomItem = (item: CustomItem) => {
    setStepError(null);
    dispatch({ type: "ADD_CUSTOM_ITEM", payload: item });
  };

  const handleRemoveCustomItem = (id: string) => {
    setStepError(null);
    dispatch({ type: "REMOVE_CUSTOM_ITEM", payload: { id } });
  };

  const handleProceedCustomItems = () => {
    setStepError(null);
    dispatch({ type: "PROCEED_TO_REVIEW" });
  };

  // Commit invoice to backend
  const handleCommitInvoice = async (data: { dueDate: string; notes?: string }) => {
    if (!state.context) return;
    setStepError(null);
    dispatch({ type: "SUBMIT_INVOICE" });

    const finalContext: InvoiceBuildContext = {
      ...state.context,
      dueDate: data.dueDate,
      notes: data.notes,
    };

    try {
      const res = await fetch("/api/landlord/iris/invoices/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: finalContext }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json.error || "Failed to commit invoice.";
        dispatch({ type: "SUBMISSION_FAILED", payload: { error: errorMsg } });
        setStepError(errorMsg);
        return;
      }

      dispatch({
        type: "SUBMISSION_SUCCESS",
        payload: {
          invoiceId: json.invoiceId,
          receiptNumber: json.invoiceNumber,
        },
      });

      onSuccess?.({
        invoiceId: json.invoiceId,
        invoiceNumber: json.invoiceNumber,
        totalAmount: json.totalAmount,
        tenantName: state.context.tenantName,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error during invoice commit.";
      dispatch({ type: "SUBMISSION_FAILED", payload: { error: msg } });
      setStepError(msg);
    }
  };

  // Determine current active step number (1 - 5)
  const getCurrentStepNumber = (): number => {
    switch (state.status) {
      case "IDLE":
      case "SELECT_LEASE":
      case "SELECT_UNIT":
      case "FETCH_CONTEXT":
        return 1;
      case "INPUT_WATER":
        return 2;
      case "INPUT_ELECTRIC":
        return 3;
      case "INPUT_CUSTOM_ITEMS":
      case "CUSTOM_ITEMS":
        return 4;
      case "REVIEW_INVOICE":
      case "REVIEW":
      case "SUBMITTING":
        return 5;
      case "COMPLETED":
      case "COMMITTED":
        return 5;
      case "ERROR":
      default:
        return 1;
    }
  };

  const currentStepNum = getCurrentStepNumber();

  // Reset to create another invoice
  const handleResetToStart = () => {
    setWaterReading(undefined);
    setWaterMeterReset(false);
    setWaterSkipped(false);
    setElectricReading(undefined);
    setElectricMeterReset(false);
    setElectricSkipped(false);
    setStepError(null);
    dispatch({ type: "RESET" });
    dispatch({ type: "START_INVOICE" });
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 pb-24 sm:pb-12 space-y-6">
      {/* Step Indicator Header (Steps 1 to 5) */}
      {state.status !== "COMPLETED" && state.status !== "COMMITTED" && (
        <nav aria-label="Invoice Creation Progress" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>
              Step {currentStepNum} of {WIZARD_STEPS.length}:{" "}
              <strong className="text-foreground font-semibold">
                {WIZARD_STEPS[currentStepNum - 1]?.label}
              </strong>
            </span>
            {state.context && (
              <span className="font-mono tabular-nums text-foreground font-semibold">
                Preview: {formatPhpCurrency(getInvoiceTotalPreview(state))}
              </span>
            )}
          </div>

          {/* Stepper Dots & Line */}
          <div className="grid grid-cols-5 gap-2">
            {WIZARD_STEPS.map((step) => {
              const isPast = step.id < currentStepNum;
              const isCurrent = step.id === currentStepNum;
              return (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all ${
                    isPast
                      ? "bg-primary"
                      : isCurrent
                      ? "bg-primary/80 ring-2 ring-primary/20"
                      : "bg-muted"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                />
              );
            })}
          </div>
        </nav>
      )}

      {/* Main Wizard Content Area */}
      <div className="min-h-[380px]">
        {/* Step 1: Unit & Tenant Selection */}
        {(state.status === "IDLE" ||
          state.status === "SELECT_LEASE" ||
          state.status === "SELECT_UNIT" ||
          state.status === "FETCH_CONTEXT") && (
          <UnitSelectorStep
            leases={leases}
            selectedLeaseId={state.context?.leaseId ?? null}
            onSelectLease={handleSelectLease}
            loading={loadingLeases || state.status === "FETCH_CONTEXT"}
            error={stepError || state.error}
          />
        )}

        {/* Step 2: Water Reading */}
        {state.status === "INPUT_WATER" && state.context && (
          <div className="space-y-6">
            <MeterReadingInputStep
              utilityType="water"
              unitName={state.context.unitName}
              previousReading={state.context.water?.previousReading ?? 0}
              currentReading={waterReading}
              ratePerUnit={state.context.water?.ratePerUnit ?? 0}
              billingMode={state.context.water?.billingMode ?? "tenant_paid"}
              allowMeterReset={waterMeterReset}
              skipped={waterSkipped}
              onChangeReading={setWaterReading}
              onToggleMeterReset={setWaterMeterReset}
              onToggleSkip={setWaterSkipped}
              error={stepError || state.error}
            />

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "BACK" })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 hover:bg-muted/40 text-foreground font-semibold text-sm transition-all cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleProceedWater}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Electricity</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Electricity Reading */}
        {state.status === "INPUT_ELECTRIC" && state.context && (
          <div className="space-y-6">
            <MeterReadingInputStep
              utilityType="electricity"
              unitName={state.context.unitName}
              previousReading={state.context.electricity?.previousReading ?? 0}
              currentReading={electricReading}
              ratePerUnit={state.context.electricity?.ratePerUnit ?? 0}
              billingMode={state.context.electricity?.billingMode ?? "tenant_paid"}
              allowMeterReset={electricMeterReset}
              skipped={electricSkipped}
              onChangeReading={setElectricReading}
              onToggleMeterReset={setElectricMeterReset}
              onToggleSkip={setElectricSkipped}
              error={stepError || state.error}
            />

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "BACK" })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 hover:bg-muted/40 text-foreground font-semibold text-sm transition-all cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="size-4" />
                <span>Back to Water</span>
              </button>
              <button
                type="button"
                onClick={handleProceedElectric}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all cursor-pointer shadow-xs"
              >
                <span>Continue to Extra Charges</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Custom Items & Adjustments */}
        {(state.status === "INPUT_CUSTOM_ITEMS" || state.status === "CUSTOM_ITEMS") &&
          state.context && (
            <div className="space-y-6">
              <CustomItemsStep
                items={state.context.customItems ?? []}
                onAddItem={handleAddCustomItem}
                onRemoveItem={handleRemoveCustomItem}
                error={stepError || state.error}
              />

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "BACK" })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 hover:bg-muted/40 text-foreground font-semibold text-sm transition-all cursor-pointer min-h-[44px]"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back to Electricity</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedCustomItems}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] transition-all cursor-pointer shadow-xs"
                >
                  <span>Review Statement</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

        {/* Step 5: Review & Send Statement */}
        {(state.status === "REVIEW_INVOICE" ||
          state.status === "REVIEW" ||
          state.status === "SUBMITTING") &&
          state.context && (
            <InvoiceReviewCard
              context={state.context}
              onConfirm={handleCommitInvoice}
              onBack={() => dispatch({ type: "BACK" })}
              onCancel={onCancel}
              submitting={state.status === "SUBMITTING"}
              error={stepError || state.error}
            />
          )}

        {/* Step 6: Completion Screen */}
        {(state.status === "COMPLETED" || state.status === "COMMITTED") && (
          <div className="p-8 sm:p-10 rounded-2xl border border-border/80 bg-card shadow-sm text-center space-y-6">
            <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground">Invoice Issued Successfully!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Official billing statement has been generated and dispatched to the tenant&apos;s direct
                chat thread and notification feed.
              </p>
            </div>

            {/* Issued Statement Details Pill */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/30 max-w-sm mx-auto text-sm space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Invoice Number:</span>
                <span className="font-mono font-bold text-foreground">
                  #{state.submissionResult?.receiptNumber || "INV-NEW"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Tenant:</span>
                <span className="font-medium text-foreground">
                  {state.context?.tenantName || "Resident"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Unit:</span>
                <span className="font-medium text-foreground">Unit {state.context?.unitName}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground">Total Due:</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {formatPhpCurrency(getInvoiceTotalPreview(state))}
                </span>
              </div>
            </div>

            {/* Completion Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetToStart}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border/80 hover:bg-muted/40 font-semibold text-sm transition-all cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="size-4" />
                <span>Create Another Invoice</span>
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all cursor-pointer min-h-[44px]"
                >
                  <FileText className="size-4" />
                  <span>Done / Close</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Error Fallback Screen */}
        {state.status === "ERROR" && (
          <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base">An unexpected error occurred</h3>
                <p className="text-sm mt-1">{state.error || stepError}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: "BACK" })}
                className="px-4 py-2 rounded-xl bg-background text-foreground border border-border text-sm font-semibold hover:bg-muted cursor-pointer"
              >
                Back to Previous Step
              </button>
              <button
                type="button"
                onClick={handleResetToStart}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 cursor-pointer"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
