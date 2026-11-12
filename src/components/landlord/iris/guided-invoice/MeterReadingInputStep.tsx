"use client";

import React from "react";
import { Droplets, Zap, AlertCircle, Info, RotateCcw } from "lucide-react";
import { formatPhpCurrency, roundCentavos } from "@/lib/services/iris/iris-invoice-flow";

export interface MeterReadingInputStepProps {
  utilityType: "water" | "electricity";
  unitName: string;
  previousReading: number;
  currentReading: number | undefined;
  ratePerUnit: number;
  billingMode: "included_in_rent" | "tenant_paid";
  allowMeterReset: boolean;
  skipped: boolean;
  onChangeReading: (val: number | undefined) => void;
  onToggleMeterReset: (allow: boolean) => void;
  onToggleSkip: (skipped: boolean) => void;
  error?: string | null;
}

export function MeterReadingInputStep({
  utilityType,
  unitName,
  previousReading,
  currentReading,
  ratePerUnit,
  billingMode,
  allowMeterReset,
  skipped,
  onChangeReading,
  onToggleMeterReset,
  onToggleSkip,
  error = null,
}: MeterReadingInputStepProps) {
  const isWater = utilityType === "water";
  const unitLabel = isWater ? "m³" : "kWh";
  const utilityTitle = isWater ? "Water Submeter Reading" : "Electricity Submeter Reading";
  const UtilityIcon = isWater ? Droplets : Zap;
  const isIncluded = billingMode === "included_in_rent";

  // Calculate live usage and estimated charge
  let usage = 0;
  let estimatedCharge = 0;
  const hasReading = currentReading !== undefined && !isNaN(currentReading);

  if (hasReading && !skipped && !isIncluded) {
    const rawUsage = allowMeterReset
      ? currentReading
      : Math.max(0, currentReading - previousReading);
    usage = roundCentavos(rawUsage);
    estimatedCharge = roundCentavos(usage * ratePerUnit);
  }

  // Sanitized numeric input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal dot
    const parts = rawVal.split(".");
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : rawVal;

    if (sanitized === "") {
      onChangeReading(undefined);
    } else {
      const num = parseFloat(sanitized);
      onChangeReading(isNaN(num) ? undefined : num);
    }
  };

  // Check if current reading is less than previous without reset flag
  const isRegression =
    hasReading &&
    !skipped &&
    !allowMeterReset &&
    currentReading < previousReading;

  return (
    <div className="space-y-6">
      {/* Title & Icon Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl ${
            isWater
              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          <UtilityIcon className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{utilityTitle}</h2>
          <p className="text-sm text-muted-foreground">
            Enter meter reading for <span className="font-medium text-foreground">Unit {unitName}</span>
          </p>
        </div>
      </div>

      {/* Top error alert from FSM or parent if present */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm"
        >
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Reading Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Billing Mode Notice if Included in Rent */}
      {isIncluded && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-border/80 bg-muted/30 text-sm">
          <Info className="size-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Included in Monthly Rent</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              This property&apos;s lease agreement specifies that {utilityType} is included in the base
              rent. No additional utility charge will be billed.
            </p>
          </div>
        </div>
      )}

      {/* Meter Reading Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5">
        {/* Previous Reading Display */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Previous Reading
            </span>
            <p className="text-xs text-muted-foreground/80 mt-0.5">Recorded last billing cycle</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-foreground tabular-nums">
              {previousReading.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5 font-medium">{unitLabel}</span>
          </div>
        </div>

        {/* Current Reading Input Row */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={`${utilityType}-current-reading-input`}
              className="text-sm font-semibold text-foreground"
            >
              Current Meter Reading
            </label>
            <span className="text-xs text-muted-foreground">
              Rate: <span className="font-mono font-medium">{formatPhpCurrency(ratePerUnit)}</span>/{unitLabel}
            </span>
          </div>

          <div className="relative">
            <input
              id={`${utilityType}-current-reading-input`}
              type="text"
              inputMode="decimal"
              maxLength={7}
              disabled={skipped || isIncluded}
              value={currentReading !== undefined ? currentReading : ""}
              onChange={handleInputChange}
              placeholder={previousReading.toString()}
              className="w-full pl-4 pr-16 py-3 rounded-xl border border-border/80 bg-background text-base font-mono tabular-nums text-right text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 disabled:bg-muted/40 transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-sm font-medium text-muted-foreground">
              {unitLabel}
            </div>
          </div>
        </div>

        {/* Meter Reset / Dial Rollover Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={allowMeterReset}
              onChange={(e) => onToggleMeterReset(e.target.checked)}
              disabled={skipped || isIncluded}
              className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary/30 disabled:opacity-50"
            />
            <div className="text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                <RotateCcw className="size-3.5" />
                Meter replaced or dial rolled over
              </span>
              <p className="text-muted-foreground mt-0.5">
                Check this if a new meter was installed or numbers rolled past 99,999 (starts count from 0).
              </p>
            </div>
          </label>
        </div>

        {/* Inline Regression Warning Alert */}
        {isRegression && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reading lower than previous</p>
              <p className="mt-0.5">
                Current reading ({currentReading} {unitLabel}) is lower than previous (
                {previousReading} {unitLabel}). If the meter rolled over or was replaced, enable the meter
                reset option above.
              </p>
            </div>
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        {hasReading && !skipped && !isIncluded && !isRegression && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Billed Consumption</span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                Usage: <span className="font-mono tabular-nums text-primary">{usage}</span> {unitLabel}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground font-medium">Utility Charge</span>
              <p className="text-base font-bold font-mono tabular-nums text-foreground mt-0.5">
                {formatPhpCurrency(estimatedCharge)}
              </p>
            </div>
          </div>
        )}

        {/* Option to Skip Reading */}
        <div className="pt-2 border-t border-border/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipped}
              onChange={(e) => onToggleSkip(e.target.checked)}
              disabled={isIncluded}
              className="size-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Skip {utilityType} reading for this billing cycle (0 charge)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
