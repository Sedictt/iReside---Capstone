"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    ArrowLeft, 
    ArrowRight,
    Mail, 
    KeyRound,
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    Eye,
    EyeOff,
    ShieldCheck
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { resetPasswordRequestSchema, otpVerifySchema } from "@/lib/validation/schemas/auth.schema";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import { formatSecurityKey, normalizeSecurityKey } from "@/lib/security/recovery-keys";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RecoveryMode = "EMAIL_OTP" | "SECURITY_KEY";
type Step = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS" | "KEY_RESET" | "KEY_NEW_KEY";

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryEmail = searchParams.get("email") || "";

    const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>("EMAIL_OTP");
    const [step, setStep] = useState<Step>("EMAIL");
    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    
    // Security key recovery states
    const [securityKeyInput, setSecurityKeyInput] = useState("");
    const [wantUpdateEmail, setWantUpdateEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [replacementKey, setReplacementKey] = useState("");
    const [isReplacementAcknowledged, setIsReplacementAcknowledged] = useState(false);

    // Password states
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [mounted, setMounted] = useState(false);

    const otpInputRef = useRef<HTMLInputElement>(null);

    const clearFieldError = (key: string) => {
        if (fieldErrors[key]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (queryEmail) {
            setEmail(queryEmail);
        }
    }, [queryEmail]);

    // Focus OTP input when step changes to OTP
    useEffect(() => {
        if (step === "OTP") {
            otpInputRef.current?.focus();
        }
    }, [step]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // -------------------------------------------------------------
    // Email OTP Flow: Send OTP
    // -------------------------------------------------------------
    const handleSendOtp = async (targetEmail: string) => {
        setError(null);
        setLoading(true);

        try {
            const validation = resetPasswordRequestSchema.safeParse({ email: targetEmail });
            if (!validation.success) {
                const issue = validation.error.issues[0];
                setError(issue ? issue.message : "Please enter a valid email address.");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: targetEmail }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                setError(result.error || "Failed to send code. Please try again.");
                return;
            }

            setEmail(targetEmail);
            setStep("OTP");
            setResendCooldown(60);
        } catch (err) {
            console.error("[ForgotPassword] Error sending OTP:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Email OTP Flow: Verify OTP
    // -------------------------------------------------------------
    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const cleanOtp = otp.trim().replace(/\s+/g, "");

        const validation = otpVerifySchema.safeParse({ email, otp: cleanOtp });
        if (!validation.success) {
            setError("Please enter the complete 6-digit code.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: cleanOtp }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                setError(result.error || "Invalid or expired verification code.");
                return;
            }

            setResetToken(result.resetToken);
            setStep("NEW_PASSWORD");
        } catch (err) {
            console.error("[ForgotPassword] Error verifying OTP:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Email OTP Flow: Set New Password
    // -------------------------------------------------------------
    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const newErrors: Record<string, string> = {};
        if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters long.";
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    resetToken,
                    newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                setError(result.error || "Failed to reset password. Please try again.");
                return;
            }

            setStep("SUCCESS");
        } catch (err) {
            console.error("[ForgotPassword] Error resetting password:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------
    // Security Key Flow: Recover with Key & Credentials
    // -------------------------------------------------------------
    const handleSecurityKeyRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const newErrors: Record<string, string> = {};
        const cleanKey = normalizeSecurityKey(securityKeyInput);
        if (cleanKey.length < 16) {
            newErrors.securityKey = "Please enter the complete 16-character security key.";
        }

        if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters long.";
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        if (wantUpdateEmail && !newEmail.trim().includes("@")) {
            newErrors.newEmail = "Please enter a valid new email address.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/security-key/recover", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.trim(),
                    securityKey: securityKeyInput,
                    newPassword,
                    newEmail: wantUpdateEmail ? newEmail.trim() : undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                setError(result.error || "Failed to recover account. Please check your credentials.");
                return;
            }

            setReplacementKey(result.newSecurityKey);
            setStep("KEY_NEW_KEY");
            toast.success("Account recovered successfully!");
        } catch (err) {
            console.error("[ForgotPassword] Security key recovery error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyInputChange = (value: string) => {
        const clean = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
        const formatted = formatSecurityKey(clean);
        setSecurityKeyInput(formatted);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-svh w-full flex flex-col justify-between bg-background text-foreground font-sans px-4 sm:px-6">
            {/* Header */}
            <header className="w-full max-w-lg mx-auto pt-8 pb-4 flex items-center justify-between">
                <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                    <Logo className="h-7 w-auto" />
                </Link>
                <div className="flex items-center gap-3">
                    <Link
                        href="/login"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                    >
                        <ArrowLeft className="size-3.5" />
                        Back to Login
                    </Link>
                    <ThemeToggle className="rounded-xl border border-border bg-card/80" />
                </div>
            </header>

            {/* Main Centered Container */}
            <main className="w-full max-w-md mx-auto my-auto py-8">
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                    {/* Mode Switcher Tabs (Only displayed on initial input step) */}
                    {(step === "EMAIL" || step === "KEY_RESET") && (
                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-2 border border-border/80 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setRecoveryMode("EMAIL_OTP");
                                    setStep("EMAIL");
                                    setError(null);
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                                    recoveryMode === "EMAIL_OTP"
                                        ? "bg-background text-foreground shadow-sm font-black"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <Mail className="size-3.5" />
                                <span>Email Code</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRecoveryMode("SECURITY_KEY");
                                    setStep("KEY_RESET");
                                    setError(null);
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                                    recoveryMode === "SECURITY_KEY"
                                        ? "bg-background text-foreground shadow-sm font-black"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <KeyRound className="size-3.5" />
                                <span>Security Key</span>
                            </button>
                        </div>
                    )}

                    {/* ---------------- EMAIL MODE: STEP 1 (EMAIL) ---------------- */}
                    {recoveryMode === "EMAIL_OTP" && step === "EMAIL" && (
                        <div className="space-y-6">
                            <div className="space-y-1.5 text-center sm:text-left">
                                <div className="inline-flex size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1">
                                    <Mail className="size-5" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Forgot Password
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Enter your email address and we'll send you a 6-digit verification code.
                                </p>
                            </div>

                            {error && (
                                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={(e) => {
                                e.preventDefault();
                                handleSendOtp(email.trim());
                            }}>
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="block text-xs font-medium text-foreground">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Sending code...</span>
                                        </>
                                    ) : (
                                        <span>Send verification code</span>
                                    )}
                                </button>
                            </form>

                            <div className="pt-2 text-center border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRecoveryMode("SECURITY_KEY");
                                        setStep("KEY_RESET");
                                        setError(null);
                                    }}
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
                                >
                                    Lost access to your email? <span className="underline font-bold">Recover with Security Key</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- EMAIL MODE: STEP 2 (OTP) ---------------- */}
                    {recoveryMode === "EMAIL_OTP" && step === "OTP" && (
                        <div className="space-y-6">
                            <div className="space-y-1.5 text-center sm:text-left">
                                <div className="inline-flex size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1">
                                    <KeyRound className="size-5" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Enter 6-Digit Code
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    We sent a verification code to <span className="font-medium text-foreground">{email}</span>.
                                </p>
                            </div>

                            {error && (
                                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleVerifyOtp}>
                                <div className="space-y-1.5">
                                    <label htmlFor="otp" className="block text-xs font-medium text-foreground">
                                        Verification Code
                                    </label>
                                    <input
                                        ref={otpInputRef}
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        placeholder="123456"
                                        className="h-12 w-full rounded-xl border border-border bg-background px-3 text-center text-xl font-mono font-bold tracking-[6px] text-foreground placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <span>Verify Code</span>
                                    )}
                                </button>
                            </form>

                            <div className="flex items-center justify-between text-xs pt-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("EMAIL");
                                        setOtp("");
                                        setError(null);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    Use different email
                                </button>

                                <button
                                    type="button"
                                    disabled={resendCooldown > 0 || loading}
                                    onClick={() => handleSendOtp(email)}
                                    className="text-primary hover:underline font-medium disabled:text-muted-foreground/60 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- EMAIL MODE: STEP 3 (NEW PASSWORD) ---------------- */}
                    {recoveryMode === "EMAIL_OTP" && step === "NEW_PASSWORD" && (
                        <div className="space-y-6">
                            <div className="space-y-1.5 text-center sm:text-left">
                                <div className="inline-flex size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1">
                                    <KeyRound className="size-5" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Set New Password
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Verification complete! Enter your new password below.
                                </p>
                            </div>

                            {error && (
                                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleResetPassword} noValidate>
                                <div className="space-y-1.5">
                                    <label htmlFor="newPassword" className={cn("block text-xs font-semibold select-none transition-colors", fieldErrors.newPassword ? "text-red-600 dark:text-red-400" : "text-foreground/90")}>
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                clearFieldError("newPassword");
                                            }}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.newPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                            aria-pressed={showNewPassword}
                                        >
                                            {showNewPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.newPassword ? (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.newPassword}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className={cn("block text-xs font-semibold select-none transition-colors", fieldErrors.confirmPassword ? "text-red-600 dark:text-red-400" : "text-foreground/90")}>
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setConfirmPassword(val);
                                                if (fieldErrors.confirmPassword) {
                                                    clearFieldError("confirmPassword");
                                                }
                                            }}
                                            onBlur={() => {
                                                if (confirmPassword && newPassword && confirmPassword !== newPassword) {
                                                    setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
                                                }
                                            }}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.confirmPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            aria-pressed={showConfirmPassword}
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirmPassword && (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.confirmPassword}</span>
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || newPassword.length < 6}
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Saving password...</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ---------------- SECURITY KEY MODE: RECOVERY & RESET ---------------- */}
                    {recoveryMode === "SECURITY_KEY" && step === "KEY_RESET" && (
                        <div className="space-y-6">
                            <div className="space-y-1.5 text-center sm:text-left">
                                <div className="inline-flex size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Security Key Recovery
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Use your single-use security key to verify your identity and regain access without needing your email inbox.
                                </p>
                            </div>

                            {error && (
                                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs">
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleSecurityKeyRecovery} noValidate>
                                <div className="space-y-1.5">
                                    <label htmlFor="sec-email" className="block text-xs font-semibold text-foreground">
                                        Registered Email Address
                                    </label>
                                    <input
                                        id="sec-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <p className="text-[11px] text-muted-foreground">The email address associated with your iReside account.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="sec-key" className={cn("block text-xs font-semibold transition-colors", fieldErrors.securityKey ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                        Security Recovery Key
                                    </label>
                                    <input
                                        id="sec-key"
                                        type="text"
                                        required
                                        maxLength={19}
                                        value={securityKeyInput}
                                        onChange={(e) => {
                                            handleKeyInputChange(e.target.value);
                                            clearFieldError("securityKey");
                                        }}
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                        aria-invalid={!!fieldErrors.securityKey}
                                        className={cn(
                                            "h-11 w-full rounded-xl border bg-background px-3.5 text-center font-mono text-base font-bold tracking-wider text-foreground placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 uppercase",
                                            fieldErrors.securityKey ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                        )}
                                    />
                                    {fieldErrors.securityKey ? (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.securityKey}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">Your 16-character single-use security key.</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <label htmlFor="sec-newPassword" className={cn("block text-xs font-semibold transition-colors", fieldErrors.newPassword ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="sec-newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                clearFieldError("newPassword");
                                            }}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.newPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer"
                                        >
                                            {showNewPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.newPassword ? (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.newPassword}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="sec-confirmPassword" className={cn("block text-xs font-semibold transition-colors", fieldErrors.confirmPassword ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="sec-confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setConfirmPassword(val);
                                                if (fieldErrors.confirmPassword) {
                                                    clearFieldError("confirmPassword");
                                                }
                                            }}
                                            onBlur={() => {
                                                if (confirmPassword && newPassword && confirmPassword !== newPassword) {
                                                    setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
                                                }
                                            }}
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.confirmPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer"
                                        >
                                            {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirmPassword && (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.confirmPassword}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Optional New Email Checkbox */}
                                <div className="pt-2 border-t border-border/40 space-y-3">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={wantUpdateEmail}
                                            onChange={(e) => setWantUpdateEmail(e.target.checked)}
                                            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-foreground">
                                            I lost permanent access to this email and want to update my email address
                                        </span>
                                    </label>

                                    {wantUpdateEmail && (
                                        <div className="space-y-1.5 pl-6 animate-in fade-in-50">
                                            <label htmlFor="newEmail" className={cn("block text-xs font-medium transition-colors", fieldErrors.newEmail ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                                New Email Address
                                            </label>
                                            <input
                                                id="newEmail"
                                                type="email"
                                                required={wantUpdateEmail}
                                                value={newEmail}
                                                onChange={(e) => {
                                                    setNewEmail(e.target.value);
                                                    clearFieldError("newEmail");
                                                }}
                                                placeholder="new-email@example.com"
                                                aria-invalid={!!fieldErrors.newEmail}
                                                className={cn(
                                                    "h-11 w-full rounded-xl border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                    fieldErrors.newEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                                )}
                                            />
                                            {fieldErrors.newEmail && (
                                                <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    <span>{fieldErrors.newEmail}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || securityKeyInput.replace(/[^a-zA-Z0-9]/g, "").length < 16 || newPassword.length < 6}
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Verifying & Recovering...</span>
                                        </>
                                    ) : (
                                        <span>Recover Account</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ---------------- SECURITY KEY MODE: REPLACEMENT KEY DISPLAY ---------------- */}
                    {recoveryMode === "SECURITY_KEY" && step === "KEY_NEW_KEY" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-1">
                                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Account Recovered Successfully
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Your password has been reset. As your previous security key was consumed, your new single-use security key has been generated.
                                </p>
                            </div>

                            <SecurityKeyDisplayCard
                                securityKey={replacementKey}
                                isAcknowledged={isReplacementAcknowledged}
                                onToggleAcknowledge={setIsReplacementAcknowledged}
                                title="Your New Security Key"
                                description="Save this new key immediately. It replaces your consumed key and will not be displayed again."
                                accountEmail={wantUpdateEmail ? newEmail : email}
                            />

                            <button
                                type="button"
                                disabled={!isReplacementAcknowledged}
                                onClick={() => {
                                    toast.success("Account recovery complete. Please sign in with your new credentials.");
                                    router.push("/login");
                                }}
                                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-colors hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <span>Proceed to Sign In</span>
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    )}

                    {/* ---------------- EMAIL MODE: SUCCESS ---------------- */}
                    {recoveryMode === "EMAIL_OTP" && step === "SUCCESS" && (
                        <div className="space-y-5 text-center py-2">
                            <div className="mx-auto size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-6" />
                            </div>

                            <div className="space-y-1.5">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Password Reset Complete
                                </h1>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Your password has been updated. You can now sign in with your new credentials.
                                </p>
                            </div>

                            <div className="pt-3">
                                <Link
                                    href="/login"
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
                                >
                                    <span>Sign In Now</span>
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-lg mx-auto py-6 flex items-center justify-between text-xs text-muted-foreground/70">
                <p>&copy; {new Date().getFullYear()} iReside</p>
                <div className="flex items-center gap-4">
                    <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                    <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
                </div>
            </footer>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-6 animate-spin text-primary" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    );
}
