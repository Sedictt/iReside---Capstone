"use client";

import React, { useState, useEffect } from "react";
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
  Send,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { evaluatePasswordStrength } from "@/lib/validation/landlord-settings";
import {
  validateAdminFullName,
  validateAdminEmail,
  validateAdminPassword,
  validateConfirmPassword,
} from "@/lib/validation/brand-setup";

interface AccountActivationModalProps {
  isOpen: boolean;
  onComplete: (newEmail: string) => void;
}

export function AccountActivationModal({
  isOpen,
  onComplete,
}: AccountActivationModalProps) {
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Sending States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [claimedEmail, setClaimedEmail] = useState("");

  // Cooldown timer effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  if (!isOpen) return null;

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const handleSendOtp = async () => {
    setError(null);
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
    } catch {
      setError("Network error while sending verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameCheck = validateAdminFullName(fullName);
    if (!nameCheck.isValid) {
      setError(nameCheck.error || "Please provide a valid full name.");
      return;
    }

    const emailCheck = validateAdminEmail(newEmail);
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Please provide a valid email address.");
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    const passCheck = validateAdminPassword(newPassword);
    if (!passCheck.isValid) {
      setError(passCheck.error || "Password does not meet security requirements.");
      return;
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) {
      setError(confirmCheck.error || "Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/setup/account/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          newEmail: newEmail.trim(),
          otp: otpCode.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to claim account. Please try again.");
        return;
      }

      setClaimedEmail(newEmail.trim());
      setIsSuccess(true);
    } catch {
      setError("An unexpected network error occurred while updating your account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activation-modal-title"
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isSuccess ? (
          /* Success & Prompt to Re-login Screen */
          <div className="text-center space-y-5 py-4 animate-in zoom-in-95 duration-300">
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-sm">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Setup Step 1 Complete
              </span>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Account Claimed Successfully!
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Your sovereign administrator account is now linked to{" "}
                <span className="font-bold text-foreground">{claimedEmail}</span>.
                For your security, please sign in with your new email and password
                to continue setting up your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onComplete(claimedEmail)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all hover:bg-primary/90 active:scale-98 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          /* Interactive Claim & Verification Form */
          <>
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Action Required
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Initial Setup
                  </span>
                </div>
                <h2
                  id="activation-modal-title"
                  className="text-xl font-black tracking-tight text-foreground"
                >
                  Welcome to iReside! Let&apos;s Claim Your Account
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We detected that you signed in with the system&apos;s temporary default credentials.
                  To protect your workspace, please update your account with your permanent administrator
                  email and password.
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleClaimAccount} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground select-none">
                  Legal / Business Full Name
                </label>
                <div className="relative">
                  <User className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Roberto Reyes"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Permanent Email & Send OTP */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground select-none">
                  Permanent Administrator Email
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="admin@yourdomain.com"
                      className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSendingOtp || otpCooldown > 0 || !newEmail.includes("@")}
                    onClick={handleSendOtp}
                    className="h-11 px-3.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : otpCooldown > 0 ? (
                      <span className="font-mono">{otpCooldown}s</span>
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span>{otpSent ? "Resend" : "Send Code"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 6-Digit Email OTP Verification Code */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-foreground select-none">
                    6-Digit Email Verification Code
                  </label>
                  {otpSent && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Code sent to inbox
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-mono tracking-widest text-center text-foreground placeholder:text-muted-foreground/40 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground select-none">
                  New Permanent Password
                </label>
                <div className="relative">
                  <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters with letters & numbers"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "flex-1 rounded-full transition-colors duration-300",
                            passwordStrength.score >= level
                              ? passwordStrength.score === 1
                                ? "bg-red-500"
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
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Strength:{" "}
                      <span
                        className={cn(
                          "font-bold",
                          passwordStrength.score >= 3 ? "text-emerald-500" : "text-amber-500"
                        )}
                      >
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground select-none">
                  Confirm Permanent Password
                </label>
                <div className="relative">
                  <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Claiming Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate & Update Account</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
