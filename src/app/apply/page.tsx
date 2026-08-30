"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, KeyRound, AlertCircle, Building2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ApplyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const unitParam = searchParams.get("unit") || searchParams.get("unitId");
    const codeParam = searchParams.get("code") || searchParams.get("token");

    const [inviteCode, setInviteCode] = useState(codeParam || "");
    const [loading, setLoading] = useState(false);
    const [isResolving, setIsResolving] = useState(Boolean(unitParam));
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // If a unit ID is provided in the URL, automatically resolve it into a direct application link
    useEffect(() => {
        if (!unitParam) return;

        let isCancelled = false;
        const autoResolveUnit = async () => {
            setIsResolving(true);
            try {
                const res = await fetch(`/api/invites/resolve?unitId=${encodeURIComponent(unitParam)}`);
                const data = await res.json();
                if (!isCancelled) {
                    if (data.ok && data.token) {
                        router.replace(`/apply/${encodeURIComponent(data.token)}`);
                        return;
                    }
                    if (data.error) {
                        setError(data.error);
                    }
                }
            } catch {
                if (!isCancelled) {
                    setError("Unable to automatically load the application for this unit. Please enter your invite code below.");
                }
            } finally {
                if (!isCancelled) {
                    setIsResolving(false);
                }
            }
        };

        autoResolveUnit();

        return () => {
            isCancelled = true;
        };
    }, [unitParam, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const trimmedCode = inviteCode.trim();
        if (!trimmedCode) {
            setError("Please enter your invite code");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/invites/${encodeURIComponent(trimmedCode)}`);
            const data = await response.json();

            if (!response.ok || data.error) {
                setError(data.error || "Invalid invite code. Please check and try again.");
                setLoading(false);
                return;
            }

            // Valid invite - redirect to the application page
            router.push(`/apply/${encodeURIComponent(trimmedCode)}`);
        } catch {
            setError("Unable to verify invite code. Please try again.");
            setLoading(false);
        }
    };

    if (!mounted) {
        return null;
    }

    if (isResolving) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
                <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-lg">
                    <Building2 className="size-8 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span>Loading unit application...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/" className="flex items-center">
                            <Logo className="h-8 w-28" />
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        <ThemeToggle />
                        <Link
                            href="/signup/tenant"
                            className="flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </Link>
                    </motion.div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="mx-auto max-w-md">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        {/* Invite Badge */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-8"
                        >
                            <KeyRound className="size-3.5" />
                            Invite Code Required
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-6">
                            Enter your<br />
                            <span className="text-primary">invite code</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                            Your invite code was provided by your landlord or property manager. Enter it below to start your application.
                        </p>
                    </motion.div>

                    {/* Invite Code Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label
                                    htmlFor="inviteCode"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Invite Code
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => {
                                            setInviteCode(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="Enter your invite code"
                                        className={cn(
                                            "w-full pl-12 pr-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground",
                                            "text-base font-medium",
                                            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                            "transition-all",
                                            error
                                                ? "border-red-500/50 focus:border-red-500"
                                                : "border-border hover:border-border/80"
                                        )}
                                        disabled={loading}
                                        autoFocus
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </div>
                                {error && (
                                    <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                                        <AlertCircle className="size-4" />
                                        {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30",
                                    loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="size-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-8">
                            Don&apos;t have an invite code?{" "}
                            <Link
                                href="/signup/tenant"
                                className="text-primary hover:underline font-medium"
                            >
                                Learn more about iReside
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

export default function ApplyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <ApplyForm />
        </Suspense>
    );
}