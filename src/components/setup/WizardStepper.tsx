"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  label: string;
}

interface WizardStepperProps {
  currentStep: number;
  totalSteps: number;
  steps: StepItem[];
  maxStepReached: number;
  onStepClick: (stepId: number) => void;
  timeEstimate?: string;
  className?: string;
}

export function WizardStepper({
  currentStep,
  totalSteps,
  steps,
  maxStepReached,
  onStepClick,
  timeEstimate = "About 2 minutes left",
  className,
}: WizardStepperProps) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div
      className={cn("w-full max-w-2xl mx-auto space-y-2 select-none", className)}
      role="region"
      aria-label="Setup progress"
    >
      {/* Top Text Indicator: Step X of Y + Time left */}
      <div className="flex items-center justify-between text-sm sm:text-base font-bold text-foreground">
        <div className="flex items-center gap-2">
          <span className="text-primary font-black text-base sm:text-lg">
            {`Step ${currentStep} of ${totalSteps}`}
          </span>
          <span className="text-muted-foreground/50 mx-1 hidden sm:inline" aria-hidden="true">
            •
          </span>
          <span className="text-foreground/90 font-bold hidden sm:inline">
            {steps[currentStep - 1]?.label}
          </span>
        </div>

        {timeEstimate && (
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60">
            {timeEstimate}
          </span>
        )}
      </div>

      {/* Progress Bar with accessible ARIA */}
      <div
        className="w-full h-2.5 sm:h-3 bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/80 shadow-inner"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`Step ${currentStep} of ${totalSteps}: ${steps[currentStep - 1]?.label}`}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Clickable step tabs spanning full width */}
      <nav aria-label="Completed setup steps" className="pt-1">
        <ol className="grid grid-cols-3 gap-2 sm:gap-2.5 w-full">
          {steps.map((st) => {
            const isCurrent = st.id === currentStep;
            const isCompleted = st.id < currentStep;
            const isAccessible = st.id <= maxStepReached;

            return (
              <li key={st.id} className="w-full">
                <button
                  type="button"
                  disabled={!isAccessible || isCurrent}
                  onClick={() => onStepClick(st.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${st.label}${isCompleted ? " (Completed, click to edit)" : ""}`}
                  className={cn(
                    "w-full min-h-[40px] px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40 cursor-default"
                      : isCompleted
                      ? "bg-muted/70 text-foreground border border-border/80 hover:bg-muted hover:border-primary/50 cursor-pointer active:scale-95"
                      : "text-muted-foreground/50 cursor-not-allowed border border-border/40 bg-muted/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400 stroke-[3] shrink-0" />
                  ) : (
                    <span
                      className={cn(
                        "size-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0",
                        isCurrent
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-foreground/10 text-foreground"
                      )}
                    >
                      {st.id}
                    </span>
                  )}
                  <span className="truncate">{st.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
