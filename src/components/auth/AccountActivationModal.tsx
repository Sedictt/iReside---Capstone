"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Send,
  Check,
  KeyRound,
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { evaluatePasswordStrength } from "@/lib/validation/landlord-settings";
import {
  DISALLOWED_PRESEEDED_DATA,
  validateAdminFullName,
  validateAdminEmail,
  validateAdminPassword,
  validateConfirmPassword,
  isStarterLoginEmail,
} from "@/lib/validation/brand-setup";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import { createClient } from "@/lib/supabase/client";
import { setupDictionary } from "@/lib/i18n/setup-translations";

interface AccountActivationModalProps {
  isOpen: boolean;
  onComplete: (newEmail: string, newPassword?: string) => Promise<void> | void;
  initialFullName?: string;
}

const CLAIM_STORAGE_KEY = "ireside_claim_draft";

export function AccountActivationModal({
  isOpen,
  onComplete,
  initialFullName,
}: AccountActivationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Sending States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // OTP Verification States
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [claimedEmail, setClaimedEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Security Recovery Key States
  const [securityKey, setSecurityKey] = useState<string | null>(null);
  const [isSecurityKeyAcknowledged, setIsSecurityKeyAcknowledged] = useState(false);
  const [hasDownloadedKey, setHasDownloadedKey] = useState(false);

  const markFieldTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleProceedToSetup = async () => {
    if (isRedirecting) return;
    if (securityKey && (!hasDownloadedKey || !isSecurityKeyAcknowledged)) {
      toast.warning("Please Download Your Spare Key", {
        description: setupDictionary.accountClaiming.step3SaveWarning,
        id: "save-recovery-key-warning",
      });
      return;
    }

    setIsRedirecting(true);
    try {
      const supabase = createClient();
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("[Account Claim] Sign out error:", err);
    }

    if (onComplete) {
      await onComplete(claimedEmail, newPassword);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const hasFocusedStep1Ref = useRef(false);
  const hasFocusedStep2Ref = useRef(false);
  const hasPrefilledRef = useRef(false);

  // Autofocus first interactive element on modal open and step transition
  useEffect(() => {
    if (!isOpen) {
      hasFocusedStep1Ref.current = false;
      hasFocusedStep2Ref.current = false;
      hasPrefilledRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (step === 1 && !hasFocusedStep1Ref.current) {
        hasFocusedStep1Ref.current = true;
        if (!fullName) {
          nameInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      } else if (step === 2 && !hasFocusedStep2Ref.current) {
        hasFocusedStep2Ref.current = true;
        passwordInputRef.current?.focus();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isOpen, step, fullName]);

  // Restore draft from storage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = sessionStorage.getItem(CLAIM_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.fullName) setFullName(draft.fullName);
        // Never restore a starter/practice login address into the email field.
        if (draft.newEmail && !isStarterLoginEmail(draft.newEmail)) setNewEmail(draft.newEmail);
        if (draft.otpCode) setOtpCode(draft.otpCode);
        if (draft.step) setStep(draft.step);
      }
    } catch {
      // storage unavailable
    }
  }, [isOpen]);

  // Persist draft to storage
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    try {
      if (fullName || newEmail || otpCode) {
        sessionStorage.setItem(
          CLAIM_STORAGE_KEY,
          JSON.stringify({ fullName, newEmail, otpCode, step })
        );
      }
    } catch {
      // storage quota
    }
  }, [isOpen, isSuccess, fullName, newEmail, otpCode, step]);

  // Prefill the full name once on modal open. The email is intentionally left
  // blank: the only address we know is the starter/practice login, and
  // pre-filling it led landlords to submit it as their real account email.
  useEffect(() => {
    if (!hasPrefilledRef.current && isOpen) {
      if (initialFullName) {
        const lower = initialFullName.trim().toLowerCase();
        const isPreseeded = DISALLOWED_PRESEEDED_DATA.adminNames.some((n) => lower.includes(n));
        if (!isPreseeded && initialFullName.trim().length >= 2) {
          setFullName(initialFullName.trim());
        }
      }
      hasPrefilledRef.current = true;
    }
  }, [isOpen, initialFullName]);

  if (!isOpen) return null;

  const passwordStrength = evaluatePasswordStrength(newPassword, { name: fullName, email: newEmail });
  const isPasswordAcceptable = newPassword.length > 0 && !passwordStrength.error;

  const handleSendOtp = async () => {
    setError(null);
    markFieldTouched("email");
    const emailValidation = validateAdminEmail(newEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/setup/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send verification code. Please try again.");
        return;
      }

      setOtpSent(true);
      setOtpCooldown(60);
      toast.success(`Verification code sent to ${newEmail.trim()}`);
      setTimeout(() => otpInputRef.current?.focus(), 150);
    } catch {
      setError("Network error while sending verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtpCode = async (code: string, emailToVerify: string): Promise<boolean> => {
    setError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/setup/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: emailToVerify.trim(),
          otp: code.trim(),
          validateOnly: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect verification code. Please check and try again.");
        setIsOtpVerified(false);
        return false;
      }

      setIsOtpVerified(true);
      return true;
    } catch {
      setError("Network error while validating verification code. Please try again.");
      setIsOtpVerified(false);
      return false;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = async (val: string) => {
    const cleanDigits = val.replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleanDigits);
    setIsOtpVerified(false);
    if (error) setError(null);

    // If 6 digits detected, automatically verify and advance to next step
    if (cleanDigits.length === 6) {
      const nameCheck = validateAdminFullName(fullName);
      if (!nameCheck.isValid) {
        setError(nameCheck.error || "Please enter your full name first.");
        return;
      }

      const emailCheck = validateAdminEmail(newEmail);
      if (!emailCheck.isValid) {
        setError(emailCheck.error || "Please enter a valid email address first.");
        return;
      }

      const isValid = await verifyOtpCode(cleanDigits, newEmail);
      if (isValid) {
        setStep(2);
      }
    }
  };

  const handleProceedToStep2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingOtp) return;
    setError(null);

    const nameCheck = validateAdminFullName(fullName);
    if (!nameCheck.isValid) {
      setError(nameCheck.error || "Please provide your full name.");
      nameInputRef.current?.focus();
      return;
    }

    const emailCheck = validateAdminEmail(newEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please provide a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Please enter the 6-digit verification code sent to your email.");
      otpInputRef.current?.focus();
      return;
    }

    if (isOtpVerified) {
      setStep(2);
      return;
    }

    const isValid = await verifyOtpCode(otpCode, newEmail);
    if (isValid) {
      setStep(2);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passCheck = validateAdminPassword(newPassword, false, { name: fullName, email: newEmail });
    if (!passCheck.isValid) {
      setError(passCheck.error || "Password does not meet security requirements.");
      passwordInputRef.current?.focus();
      return;
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) {
      setError(confirmCheck.error || "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch("/api/setup/account/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          fullName: fullName.trim(),
          newEmail: newEmail.trim(),
          otp: otpCode.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to complete account setup. Please try again.");
        return;
      }

      try {
        sessionStorage.removeItem(CLAIM_STORAGE_KEY);
      } catch {
        // best effort
      }

      if (data.securityKey) {
        const pendingData = {
          securityKey: data.securityKey,
          email: newEmail.trim(),
          password: newPassword,
        };
        try {
          sessionStorage.setItem("ireside_pending_recovery_key", JSON.stringify(pendingData));
          localStorage.setItem("ireside_pending_recovery_key", JSON.stringify(pendingData));
        } catch (storageErr) {
          console.warn("[Account Claim] Could not save pending recovery key to storage:", storageErr);
        }
      }

      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const name = c.split("=")[0].trim();
          if (name.startsWith("sb-") || name.includes("auth-token") || name.includes("session")) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
            if (typeof window !== "undefined" && window.location.hostname) {
              document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
            }
          }
        });
      }
      if (typeof localStorage !== "undefined") {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("sb-") || key.includes("supabase.auth.token")) {
              localStorage.removeItem(key);
            }
          });
        } catch {}
      }

      try {
        const supabase = createClient();
        await Promise.race([
          supabase.auth.signOut({ scope: "local" }).catch(() => null),
          new Promise((resolve) => setTimeout(resolve, 300)),
        ]);
      } catch {
        // ignore
      }

      if (onComplete) {
        try {
          await Promise.race([
            onComplete(newEmail.trim(), newPassword),
            new Promise((resolve) => setTimeout(resolve, 300)),
          ]);
        } catch {
          // ignore
        }
      }

      if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
        setIsRedirecting(true);
        window.location.href = "/login?claimed=true";
        return;
      }

      if (data.securityKey) {
        setSecurityKey(data.securityKey);
      }
      setClaimedEmail(newEmail.trim());
      setIsSuccess(true);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError("An unexpected network error occurred while updating your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activation-modal-title"
    >
      <div
        className={cn(
          "w-full bg-card border border-border/80 rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 my-auto text-foreground transition-all duration-200",
          isSuccess && securityKey ? "max-w-xl" : "max-w-xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          /* SUCCESS & EMERGENCY SPARE KEY PRESENTATION */
          <div className="space-y-6 py-1 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 pb-4 border-b border-border/80">
              <div className="size-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Account Claimed Successfully
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Workspace linked to <span className="font-bold text-foreground">{claimedEmail}</span>
                </p>
              </div>
            </div>

            {securityKey ? (
              <SecurityKeyDisplayCard
                securityKey={securityKey}
                isAcknowledged={isSecurityKeyAcknowledged}
                onToggleAcknowledge={setIsSecurityKeyAcknowledged}
                onDownload={() => {
                  setHasDownloadedKey(true);
                  setIsSecurityKeyAcknowledged(true);
                }}
                title="Emergency Spare Key (Landlord Security Recovery Key)"
                description={setupDictionary.accountClaiming.step3Subtitle}
                accountEmail={claimedEmail}
              />
            ) : (
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-base text-muted-foreground">
                Your credentials are saved. Please sign in with your updated credentials to start property setup.
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                disabled={Boolean(securityKey && (!hasDownloadedKey || !isSecurityKeyAcknowledged)) || isRedirecting}
                onClick={handleProceedToSetup}
                className={cn(
                  "w-full min-h-[56px] rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-md",
                  Boolean(securityKey && (!hasDownloadedKey || !isSecurityKeyAcknowledged))
                    ? "bg-muted text-muted-foreground/60 cursor-not-allowed border border-border/60"
                    : "bg-primary text-primary-foreground hover:bg-primary/95 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary",
                  isRedirecting && "opacity-75 cursor-wait"
                )}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>{setupDictionary.accountClaiming.connectingToSignIn}</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="size-6 stroke-[3]" />
                  </>
                )}
              </button>
              {securityKey && !hasDownloadedKey && (
                <p className="mt-3 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
                  Please click &ldquo;Download Key&rdquo; above to proceed to sign in.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* STEP-BASED FORM */
          <>
            {/* Header with Step Counter and Progress Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="size-6" />
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-muted-foreground">
                  <span className="text-primary font-black text-base sm:text-lg">
                    Step {step} of 2
                  </span>
                  <span>•</span>
                  <span>{step === 1 ? "~1 min" : "~30 sec"}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-2 gap-2 h-2.5 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/80">
                <div className="h-full bg-primary rounded-full transition-all duration-300" />
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    step === 2 ? "bg-primary" : "bg-transparent"
                  )}
                />
              </div>

              {/* Jump back pill if on Step 2 */}
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-muted/70 text-foreground border border-border/80 hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="size-4 text-emerald-600 stroke-[3]" />
                  <span>Step 1: {fullName || "Name & Email"} (Click to edit)</span>
                </button>
              )}

              <div>
                <h2
                  id="activation-modal-title"
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
                >
                  {step === 1
                    ? setupDictionary.accountClaiming.step1Title
                    : setupDictionary.accountClaiming.step2Title}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-1.5">
                  {step === 1
                    ? setupDictionary.accountClaiming.step1Instruction
                    : setupDictionary.accountClaiming.step2Instruction}
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm sm:text-base animate-in fade-in"
              >
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold leading-relaxed">{error}</p>
                  {step === 2 && /code|otp|expired|verification/i.test(error) && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep(1);
                      }}
                      className="text-xs sm:text-sm font-bold underline hover:no-underline text-rose-700 dark:text-rose-300 block cursor-pointer mt-1"
                    >
                      Return to verification step
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onSubmit={handleProceedToStep2}
                  className="space-y-5"
                  noValidate
                >
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-fullname-input"
                      className="block text-base sm:text-lg font-bold text-foreground cursor-pointer select-none"
                    >
                      {setupDictionary.accountClaiming.fullNameLabel}
                    </label>
                    <div className="relative">
                      <User className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-fullname-input"
                        ref={nameInputRef}
                        type="text"
                        required
                        autoComplete="name"
                        maxLength={70}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. Roberto Reyes"
                        className="w-full min-h-[54px] rounded-xl border border-border/90 bg-background pl-12 pr-4 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Email & Send Code Button */}
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-email-input"
                      className="block text-base sm:text-lg font-bold text-foreground cursor-pointer select-none"
                    >
                      {setupDictionary.accountClaiming.emailLabel}
                    </label>
                    <div className="flex gap-2.5">
                      <div className="relative flex-1">
                        <Mail className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="admin-email-input"
                          ref={emailInputRef}
                          type="email"
                          required
                          autoComplete="email"
                          maxLength={254}
                          value={newEmail}
                          onChange={(e) => {
                            setNewEmail(e.target.value);
                            setIsOtpVerified(false);
                            if (error) setError(null);
                          }}
                          placeholder="landlord@example.com"
                          className="w-full min-h-[54px] rounded-xl border border-border/90 bg-background pl-12 pr-4 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isSendingOtp || otpCooldown > 0 || !newEmail.includes("@")}
                        onClick={handleSendOtp}
                        className="min-h-[54px] px-5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground text-sm sm:text-base font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] cursor-pointer"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : otpCooldown > 0 ? (
                          <span className="font-mono text-sm">{otpCooldown}s</span>
                        ) : (
                          <>
                            <Send className="size-4" />
                            <span>{otpSent ? "Resend" : "Send Code"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 6-Digit Email Verification Code */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="admin-otp-input"
                        className="block text-base sm:text-lg font-bold text-foreground cursor-pointer select-none"
                      >
                        {setupDictionary.accountClaiming.codeLabel}
                      </label>
                      {isVerifyingOtp ? (
                        <span className="text-xs sm:text-sm font-bold text-primary flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          Verifying code...
                        </span>
                      ) : isOtpVerified ? (
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-4 stroke-[3]" />
                          Code verified
                        </span>
                      ) : otpSent ? (
                        <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="size-4 stroke-[3]" />
                          Code sent to inbox
                        </span>
                      ) : null}
                    </div>

                    <div className="relative">
                      <input
                        id="admin-otp-input"
                        ref={otpInputRef}
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        disabled={isVerifyingOtp}
                        value={otpCode}
                        onChange={(e) => handleOtpChange(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className={cn(
                          "w-full min-h-[54px] rounded-xl border bg-background px-4 text-center font-mono text-xl sm:text-2xl tracking-[0.3em] font-bold text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:text-sm sm:placeholder:text-base placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-3",
                          error && otpCode.length === 6
                            ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                            : isOtpVerified
                            ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                            : "border-border/90 focus:border-primary focus:ring-primary/20"
                        )}
                      />
                    </div>
                    {!otpSent && (
                      <p className="text-xs sm:text-sm text-muted-foreground pt-0.5">
                        Click &ldquo;Send Code&rdquo; above to receive your 6-digit confirmation code.
                      </p>
                    )}
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={
                        !fullName.trim() ||
                        !newEmail.trim() ||
                        otpCode.trim().length !== 6 ||
                        isVerifyingOtp
                      }
                      className="w-full min-h-[56px] rounded-2xl bg-primary text-primary-foreground font-black text-lg transition-all hover:bg-primary/95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Password</span>
                          <ArrowRight className="size-6 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onSubmit={handleClaimAccount}
                  className="space-y-5"
                  noValidate
                >
                  {/* New Password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="admin-new-password"
                      className="block text-base sm:text-lg font-bold text-foreground cursor-pointer select-none"
                    >
                      {setupDictionary.accountClaiming.passwordLabel}
                    </label>
                    <div className="relative">
                      <Lock className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-new-password"
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        maxLength={72}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="At least 8 characters"
                        className="w-full min-h-[54px] rounded-xl border border-border/90 bg-background pl-12 pr-14 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="min-h-[48px] min-w-[48px] absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center p-2 rounded-lg"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-1.5 h-2">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "flex-1 rounded-full transition-colors duration-200",
                                passwordStrength.score >= level
                                  ? passwordStrength.score === 1
                                    ? "bg-rose-500"
                                    : passwordStrength.score === 2
                                    ? "bg-amber-500"
                                    : passwordStrength.score === 3
                                    ? "bg-blue-500"
                                    : "bg-emerald-500"
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                          <span>
                            Strength:{" "}
                            <span
                              className={cn(
                                "font-bold",
                                passwordStrength.score >= 3
                                  ? "text-emerald-500"
                                  : passwordStrength.score === 2
                                  ? "text-amber-500"
                                  : "text-rose-500"
                              )}
                            >
                              {passwordStrength.label}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {passwordStrength.error
                              ? "Fix the items below to continue"
                              : passwordStrength.score >= 3
                              ? "Meets requirements"
                              : "Add length or variety to strengthen"}
                          </span>
                        </div>
                        <ul
                          className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm"
                          aria-label="Password requirements"
                        >
                          {[
                            { ok: passwordStrength.checks.hasMinLength, text: "At least 8 characters" },
                            { ok: passwordStrength.checks.hasLetter, text: "Includes letters" },
                            { ok: passwordStrength.checks.hasNumberOrSymbol, text: "Includes a number or symbol" },
                            {
                              ok:
                                passwordStrength.checks.isNotCommon &&
                                passwordStrength.checks.isNotRepetitive &&
                                passwordStrength.checks.isNotPersonal,
                              text: "Not common, repetitive, or your name/email",
                            },
                          ].map((item) => (
                            <li
                              key={item.text}
                              className={cn(
                                "flex items-center gap-1.5 font-medium",
                                item.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                              )}
                            >
                              <Check
                                className={cn("size-3.5 shrink-0 stroke-[3]", item.ok ? "" : "opacity-30")}
                                aria-hidden="true"
                              />
                              <span>{item.text}</span>
                            </li>
                          ))}
                        </ul>
                        {passwordStrength.error && (
                          <p className="text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400" role="alert">
                            {passwordStrength.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="admin-confirm-password"
                        className="block text-base sm:text-lg font-bold text-foreground cursor-pointer select-none"
                      >
                        {setupDictionary.accountClaiming.confirmPasswordLabel}
                      </label>
                      {confirmPassword && (
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-bold flex items-center gap-1",
                            confirmPassword === newPassword
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {confirmPassword === newPassword ? (
                            <>
                              <Check className="size-4 stroke-[3]" />
                              Passwords match
                            </>
                          ) : (
                            "Passwords do not match yet"
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="size-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        maxLength={72}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Re-enter your password"
                        className="w-full min-h-[54px] rounded-xl border border-border/90 bg-background pl-12 pr-14 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="min-h-[48px] min-w-[48px] absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center p-2 rounded-lg"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep(1);
                      }}
                      disabled={isSubmitting}
                      className="min-h-[56px] px-5 rounded-2xl border border-border bg-background hover:bg-muted text-foreground font-bold text-base transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <ArrowLeft className="size-4" />
                      <span>{setupDictionary.common.back}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isPasswordAcceptable || confirmPassword !== newPassword}
                      className="min-h-[56px] flex-1 rounded-2xl bg-primary text-primary-foreground font-black text-lg transition-all hover:bg-primary/95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-5 animate-spin" />
                          <span>{setupDictionary.accountClaiming.claimingButton}</span>
                        </>
                      ) : (
                        <>
                          <span>{setupDictionary.accountClaiming.claimButton}</span>
                          <ArrowRight className="size-6 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
