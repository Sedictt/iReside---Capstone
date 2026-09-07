"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
    ArrowLeft, 
    ArrowRight,
    Mail, 
    KeyRound,
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    Eye,
    EyeOff
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { resetPasswordRequestSchema, otpVerifySchema } from "@/lib/validation/schemas/auth.schema";

type Step = "EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS";

function ForgotPasswordContent() {
    const searchParams = useSearchParams();
    const queryEmail = searchParams.get("email") || "";

    const [step, setStep] = useState<Step>("EMAIL");
    const [email, setEmail] = useState(queryEmail);
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [mounted, setMounted] = useState(false);

    const otpInputRef = useRef<HTMLInputElement>(null);

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
    // Step 1: Send OTP
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
    // Step 2: Verify OTP
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
    // Step 3: Set New Password
    // -------------------------------------------------------------
    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
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
                    {/* ---------------- STEP 1: EMAIL ---------------- */}
                    {step === "EMAIL" && (
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
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                        </div>
                    )}

                    {/* ---------------- STEP 2: OTP VERIFICATION ---------------- */}
                    {step === "OTP" && (
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
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Use different email
                                </button>

                                <button
                                    type="button"
                                    disabled={resendCooldown > 0 || loading}
                                    onClick={() => handleSendOtp(email)}
                                    className="text-primary hover:underline font-medium disabled:text-muted-foreground/60 disabled:no-underline disabled:cursor-not-allowed"
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- STEP 3: NEW PASSWORD ---------------- */}
                    {step === "NEW_PASSWORD" && (
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

                            <form className="space-y-4" onSubmit={handleResetPassword}>
                                <div className="space-y-1.5">
                                    <label htmlFor="newPassword" className="block text-xs font-semibold text-foreground/90 select-none">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                    <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-foreground/90 select-none">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || newPassword.length < 6}
                                    className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

                    {/* ---------------- STEP 4: SUCCESS ---------------- */}
                    {step === "SUCCESS" && (
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
