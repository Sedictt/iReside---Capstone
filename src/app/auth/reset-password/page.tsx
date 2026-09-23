"use client";

import Link from "next/link";
import { 
    KeyRound, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    Loader2, 
    CheckCircle2, 
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateTenantPassword } from "@/lib/supabase/client-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import { cn } from "@/lib/utils";

function ResetPasswordContent() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [securityKey, setSecurityKey] = useState<string | null>(null);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function verifySession() {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    setHasSession(true);
                    let role = session.user.user_metadata?.role;
                    if (!role) {
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", session.user.id)
                            .single();
                        role = profile?.role ?? null;
                    }
                    setUserRole(role);
                } else {
                    setHasSession(false);
                }
            } catch (err) {
                console.error("[ResetPassword] Error inspecting session:", err);
                setHasSession(false);
            } finally {
                setCheckingSession(false);
            }
        }

        verifySession();
    }, []);

    useEffect(() => {
        // Only auto-redirect if there is no security key requiring user acknowledgement
        if (!isSuccess || securityKey) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    const targetDashboard = userRole === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";
                    router.push(targetDashboard);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSuccess, securityKey, userRole, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const errors: { newPassword?: string; confirmPassword?: string } = {};

        if (newPassword.length < 6) {
            errors.newPassword = "Password must be at least 6 characters long.";
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        if (errors.newPassword || errors.confirmPassword) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            if (userRole === "tenant") {
                const result = await updateTenantPassword(newPassword);
                if (!result.success) {
                    setError(result.error || "Failed to update password. Please try again.");
                    setLoading(false);
                    return;
                }
            } else {
                const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword,
                });

                if (updateError) {
                    setError(updateError.message);
                    setLoading(false);
                    return;
                }
            }

            // Generate initial single-use security recovery key for the user
            try {
                const keyRes = await fetch("/api/auth/security-key", { method: "POST" });
                if (keyRes.ok) {
                    const keyData = await keyRes.json();
                    if (keyData.securityKey) {
                        setSecurityKey(keyData.securityKey);
                    }
                }
            } catch (kErr) {
                console.warn("[ResetPassword] Could not generate initial security key:", kErr);
            }

            setIsSuccess(true);
        } catch (err: unknown) {
            console.error("[ResetPassword] Unexpected error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-svh w-full flex flex-col justify-between bg-background text-foreground font-sans px-4 sm:px-6">
            {/* Minimal Header */}
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

            {/* Simple Centered Box */}
            <main className="w-full max-w-md mx-auto my-auto py-8">
                <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                    {checkingSession ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            <p className="text-xs">Checking authorization...</p>
                        </div>
                    ) : !hasSession ? (
                        /* Simple Expired Guard */
                        <div className="space-y-4 text-center py-2">
                            <div className="mx-auto size-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <AlertCircle className="size-6" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-lg font-bold text-foreground">
                                    Link Expired or Invalid
                                </h1>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    This link has already been used or has expired.
                                </p>
                            </div>
                            <div className="pt-2">
                                <Link
                                    href="/forgot-password"
                                    className="inline-flex items-center justify-center w-full h-10 bg-primary text-primary-foreground font-medium rounded-xl text-xs transition-colors hover:bg-primary/90"
                                >
                                    Request a new reset link
                                </Link>
                            </div>
                        </div>
                    ) : isSuccess ? (
                        /* Success */
                        securityKey ? (
                            <div className="space-y-4 py-1">
                                <div className="space-y-1 text-center sm:text-left">
                                    <h1 className="text-lg font-bold text-foreground">
                                        Password Set Successfully
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Save your single-use security recovery key now before accessing your dashboard.
                                    </p>
                                </div>

                                <SecurityKeyDisplayCard
                                    securityKey={securityKey}
                                    isAcknowledged={isAcknowledged}
                                    onToggleAcknowledge={setIsAcknowledged}
                                    title="Your Security Recovery Key"
                                    description="This single-use recovery key allows you to regain access to your account if you ever lose access to your email."
                                />

                                <button
                                    type="button"
                                    disabled={!isAcknowledged}
                                    onClick={() => {
                                        const target = userRole === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";
                                        router.push(target);
                                    }}
                                    className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-xl text-xs transition-colors hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span>Continue to Dashboard</span>
                                    <ArrowRight className="size-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center py-2">
                                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-lg font-bold text-foreground">
                                        Password Updated
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Redirecting in {countdown}s...
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const target = userRole === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";
                                        router.push(target);
                                    }}
                                    className="w-full h-10 bg-primary text-primary-foreground font-medium rounded-xl text-xs transition-colors hover:bg-primary/90 flex items-center justify-center gap-1.5 mt-2"
                                >
                                    <span>Go to Dashboard</span>
                                    <ArrowRight className="size-3.5" />
                                </button>
                            </div>
                        )
                    ) : (
                        /* Reset Form */
                        <div className="space-y-5">
                            <div className="space-y-1.5 text-center sm:text-left">
                                <div className="inline-flex size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary mb-1">
                                    <KeyRound className="size-5" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Set New Password
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Choose a new password (min. 6 characters).
                                </p>
                            </div>

                            {error && (
                                <div 
                                    role="alert"
                                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs"
                                >
                                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                    <p className="font-medium leading-relaxed">{error}</p>
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                                <div className="space-y-1.5">
                                    <label 
                                        htmlFor="new-password"
                                        className={cn("block text-xs font-medium transition-colors", fieldErrors.newPassword ? "text-red-600 dark:text-red-400" : "text-foreground")}
                                    >
                                        New Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            id="new-password"
                                            name="new-password"
                                            type={isPasswordVisible ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: undefined }));
                                            }}
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.newPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background pl-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                        >
                                            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    {fieldErrors.newPassword && (
                                        <p role="alert" className="text-[11px] font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5">
                                            <AlertCircle className="size-3.5 shrink-0" />
                                            <span>{fieldErrors.newPassword}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label 
                                        htmlFor="confirm-password"
                                        className={cn("block text-xs font-medium transition-colors", fieldErrors.confirmPassword ? "text-red-600 dark:text-red-400" : "text-foreground")}
                                    >
                                        Confirm Password
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            id="confirm-password"
                                            name="confirm-password"
                                            type={isConfirmVisible ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setConfirmPassword(val);
                                                if (fieldErrors.confirmPassword) {
                                                    setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (confirmPassword && newPassword && confirmPassword !== newPassword) {
                                                    setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
                                                }
                                            }}
                                            autoComplete="new-password"
                                            placeholder="••••••••"
                                            aria-invalid={!!fieldErrors.confirmPassword}
                                            className={cn(
                                                "h-11 w-full rounded-xl border bg-background pl-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2",
                                                fieldErrors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border focus:border-primary focus:ring-primary/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                                            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                                            aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                                        >
                                            {isConfirmVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                                    className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>

            {/* Simple Footer */}
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-6 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
