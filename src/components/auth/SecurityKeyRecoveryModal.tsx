"use client";

import React, { useState } from "react";
import { CheckCircle2, ArrowRight, Loader2, Download } from "lucide-react";
import { SecurityKeyDisplayCard, downloadSecurityKeyFile } from "@/components/auth/SecurityKeyDisplayCard";
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
  const [hasDownloaded, setHasDownloaded] = useState(false);

  if (!isOpen || !securityKey) return null;

  const isProceedDisabled = !hasDownloaded || !isSecurityKeyAcknowledged || isRedirecting;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-recovery-modal-title"
    >
      <div
        className="w-full max-w-xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-foreground transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border/80">
          <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
            <CheckCircle2 className="size-8 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h2
              id="security-recovery-modal-title"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground"
            >
              Account Claimed Successfully
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Workspace linked to <span className="font-bold text-foreground break-all">{accountEmail}</span>
            </p>
          </div>
        </div>

        <SecurityKeyDisplayCard
          securityKey={securityKey}
          isAcknowledged={isSecurityKeyAcknowledged}
          onToggleAcknowledge={setIsSecurityKeyAcknowledged}
          onDownload={() => {
            setHasDownloaded(true);
            setIsSecurityKeyAcknowledged(true);
          }}
          title="Emergency Spare Key (Landlord Security Recovery Key)"
          description="Just like a spare key to your house, keep this safe so you never get locked out. If you ever forget your password or lose access to your email, this code lets you unlock your account."
          accountEmail={accountEmail}
        />

        <div className="pt-2">
          <button
            type="button"
            disabled={isProceedDisabled}
            onClick={onProceed}
            className={cn(
              "w-full min-h-[56px] rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-md",
              isProceedDisabled
                ? "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/60"
                : "bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary",
              isRedirecting && "opacity-75 cursor-wait"
            )}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Connecting to Sign In...</span>
              </>
            ) : (
              <>
                <span>Proceed to Sign In</span>
                <ArrowRight className="size-6 stroke-[3]" />
              </>
            )}
          </button>
          {!hasDownloaded && (
            <p className="mt-3 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
              Please click &ldquo;Download&rdquo; above to save your spare key file before signing in.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
