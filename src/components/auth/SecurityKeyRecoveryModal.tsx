"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import { cn } from "@/lib/utils";

export interface SecurityKeyRecoveryModalProps {
  isOpen: boolean;
  securityKey: string;
  accountEmail: string;
  onProceed: () => void | Promise<void>;
  isRedirecting?: boolean;
}

export function SecurityKeyRecoveryModal({
  isOpen,
  securityKey,
  accountEmail,
  onProceed,
  isRedirecting = false,
}: SecurityKeyRecoveryModalProps) {
  const [isSecurityKeyAcknowledged, setIsSecurityKeyAcknowledged] = useState(false);
  const [_hasSavedKey, setHasSavedKey] = useState(false);

  if (!isOpen || !securityKey) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-recovery-modal-title"
    >
      <div
        className="w-full max-w-[540px] bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 my-auto text-foreground transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-border/60">
          <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-0.5">
            <h2
              id="security-recovery-modal-title"
              className="text-base font-bold tracking-tight text-foreground"
            >
              Account Claimed Successfully
            </h2>
            <p className="text-xs text-muted-foreground leading-snug">
              Workspace linked to{" "}
              <span className="font-semibold text-foreground">{accountEmail}</span>
            </p>
          </div>
        </div>

        <SecurityKeyDisplayCard
          securityKey={securityKey}
          isAcknowledged={isSecurityKeyAcknowledged}
          onToggleAcknowledge={setIsSecurityKeyAcknowledged}
          onDownload={() => {
            setHasSavedKey(true);
            setIsSecurityKeyAcknowledged(true);
          }}
          onCopy={() => {
            setHasSavedKey(true);
            setIsSecurityKeyAcknowledged(true);
          }}
          title="Landlord Security Recovery Key"
          description="Save your single-use recovery key now in case you ever lose access to your email. You will need this to regain access to your property portal."
          accountEmail={accountEmail}
        />

        <div className="pt-2">
          <button
            type="button"
            disabled={isRedirecting}
            onClick={onProceed}
            className={cn(
              "w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-all hover:bg-primary/90 active:scale-[0.99] flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isRedirecting && "opacity-75 cursor-wait"
            )}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Connecting to Setup...</span>
              </>
            ) : (
              <>
                <span>Proceed to Property Setup</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
