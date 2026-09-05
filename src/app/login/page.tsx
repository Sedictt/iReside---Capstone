"use client";

import Link from "next/link";
import { 
    Eye, 
    EyeOff,
    ArrowRight, 
    Download,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function LoginContent() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const formData = new FormData(e.currentTarget);
            const email = (formData.get("email") as string | null)?.trim() ?? "";
            const password = (formData.get("password") as string | null) ?? "";

            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message?.toLowerCase().includes("schema")) {
                    setError("Login failed due to a Supabase auth schema issue. Please contact support.");
                } else {
                    setError(error.message);
                }
                return;
            }

            let role = data.user?.user_metadata?.role;
            if (!role && data.user?.id) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", data.user.id)
                    .single();
                role = profile?.role;
            }

            const target = role === "tenant" ? "/tenant/dashboard" : "/landlord/dashboard";
            router.push(redirectUrl || target);
        } catch (err) {
            console.error('[Login] Unexpected error:', err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback${redirectUrl ? `?next=${redirectUrl}` : ''}`,
            },
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-svh w-full flex flex-col justify-between bg-background text-foreground relative selection:bg-primary/25 font-sans">
            {/* Ambient SVG Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                {/* Soft Ambient Atmosphere Glows */}
                <div className="absolute -top-36 -left-36 w-[540px] h-[540px] bg-primary/10 dark:bg-primary/[0.08] rounded-full blur-[140px]" />
                <div className="absolute top-1/3 -right-36 w-[500px] h-[500px] bg-primary/8 dark:bg-primary/[0.05] rounded-full blur-[150px]" />
                <div className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] bg-primary/5 dark:bg-primary/[0.03] rounded-full blur-[130px]" />

                {/* Primary SVG Architectural Grid Pattern with Radial Falloff */}
                <svg 
                    className="absolute inset-0 h-full w-full stroke-foreground/[0.04] dark:stroke-white/[0.035] [mask-image:radial-gradient(ellipse_at_center,white_25%,transparent_80%)]" 
                    width="100%" 
                    height="100%"
                >
                    <defs>
                        <pattern id="login-base-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" strokeWidth="1" />
                            <circle cx="48" cy="0" r="1.5" className="fill-foreground/[0.06] dark:fill-white/[0.06]" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#login-base-grid)" />
                </svg>

                {/* Abstract Structural Topography & Cadence SVG Motifs */}
                <svg 
                    className="absolute inset-0 w-full h-full text-primary/20 dark:text-primary/15 opacity-80"
                    viewBox="0 0 1440 900" 
                    preserveAspectRatio="xMidYMid slice" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="bg-curve-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="bg-curve-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                            <stop offset="60%" stopColor="currentColor" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Isometric Contour / Flowing Architectural Waves */}
                    <path 
                        d="M-100 240 C 260 120, 520 380, 880 260 C 1180 160, 1380 320, 1600 240" 
                        stroke="url(#bg-curve-grad-1)" 
                        strokeWidth="1.5" 
                        strokeDasharray="6 8"
                    />
                    <path 
                        d="M-80 320 C 300 200, 560 460, 920 340 C 1220 240, 1420 400, 1620 320" 
                        stroke="url(#bg-curve-grad-1)" 
                        strokeWidth="1.2" 
                        opacity="0.6"
                    />
                    <path 
                        d="M-60 400 C 340 280, 600 540, 960 420 C 1260 320, 1460 480, 1640 400" 
                        stroke="url(#bg-curve-grad-1)" 
                        strokeWidth="1" 
                        opacity="0.35"
                    />

                    {/* Architectural Elevation & Structural Blueprint Lines */}
                    <path 
                        d="M 120 900 L 460 560 L 840 560 L 1020 740" 
                        stroke="url(#bg-curve-grad-2)" 
                        strokeWidth="1" 
                        strokeDasharray="4 6" 
                        opacity="0.4"
                    />
                    <path 
                        d="M 220 900 L 520 600 L 880 600 L 1080 800" 
                        stroke="url(#bg-curve-grad-2)" 
                        strokeWidth="0.8" 
                        opacity="0.25"
                    />

                    {/* Constellation Nodes & Technical Precision Markers */}
                    <circle cx="880" cy="260" r="3.5" fill="currentColor" opacity="0.8" />
                    <circle cx="880" cy="260" r="10" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
                    <circle cx="520" cy="380" r="2.5" fill="currentColor" opacity="0.6" />
                    <circle cx="1180" cy="160" r="3" fill="currentColor" opacity="0.7" />
                    <circle cx="1180" cy="160" r="14" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.25" />

                    {/* Coordinate Precision Crosshairs */}
                    <g opacity="0.35" stroke="currentColor" strokeWidth="1">
                        <path d="M 240 140 L 240 152 M 234 146 L 246 146" />
                        <path d="M 1280 180 L 1280 192 M 1274 186 L 1286 186" />
                        <path d="M 720 760 L 720 772 M 714 766 L 726 766" />
                        <path d="M 160 720 L 160 732 M 154 726 L 166 726" />
                    </g>
                </svg>
            </div>

            {/* Top Navigation Header */}
            <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
                    <Logo className="h-8 w-28 drop-shadow-sm" />
                </Link>
                <div className="flex items-center gap-4">
                    <Link
                        href="/docs"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
                    >
                        Documentation
                    </Link>
                    <ThemeToggle className="rounded-xl border border-border bg-card/80 shadow-xs" />
                </div>
            </header>

            {/* Main Auth Content */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 my-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    
                    {/* Left Column: Brand & Platform Value (Desktop) */}
                    <div className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-8 pr-8 relative overflow-hidden p-8 xl:p-12 rounded-3xl border border-border/40 bg-card/25 backdrop-blur-xs min-h-[500px]">
                        {/* Abstract Geometric Graphic Layer */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
                            {/* Ambient soft glow */}
                            <div className="absolute top-1/4 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-8 right-12 w-64 h-64 bg-primary/8 rounded-full blur-2xl" />

                            {/* Abstract Geometric Vector Elements */}
                            <svg 
                                className="absolute -right-16 top-1/2 -translate-y-1/2 w-[480px] h-[480px] text-primary/15 dark:text-primary/10 opacity-70"
                                viewBox="0 0 400 400" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <defs>
                                    <linearGradient id="geom-grad" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="currentColor" stopOpacity="0.8" />
                                        <stop offset="1" stopColor="currentColor" stopOpacity="0.1" />
                                    </linearGradient>
                                    <pattern id="grid-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="1" fill="currentColor" fillOpacity="0.4" />
                                    </pattern>
                                </defs>

                                {/* Geometric Matrix Background */}
                                <rect x="40" y="40" width="320" height="320" fill="url(#grid-dots)" opacity="0.3" />

                                {/* Concentric Precision Rings */}
                                <circle cx="200" cy="200" r="160" stroke="url(#geom-grad)" strokeWidth="1.2" strokeDasharray="4 6" />
                                <circle cx="200" cy="200" r="110" stroke="currentColor" strokeWidth="1" opacity="0.35" />
                                <circle cx="200" cy="200" r="65" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

                                {/* Modern Isometric Diamond Plane */}
                                <path d="M70 200 L200 70 L330 200 L200 330 Z" stroke="url(#geom-grad)" strokeWidth="1.5" fill="currentColor" fillOpacity="0.02" />
                                <path d="M120 200 L200 120 L280 200 L200 280 Z" stroke="currentColor" strokeWidth="1" opacity="0.4" />

                                {/* Technical Axis Guides */}
                                <line x1="40" y1="200" x2="360" y2="200" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.25" />
                                <line x1="200" y1="40" x2="200" y2="360" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.25" />

                                {/* Axis Precision Points */}
                                <circle cx="200" cy="70" r="3" fill="currentColor" opacity="0.6" />
                                <circle cx="330" cy="200" r="3" fill="currentColor" opacity="0.6" />
                                <circle cx="200" cy="330" r="3" fill="currentColor" opacity="0.6" />
                                <circle cx="70" cy="200" r="3" fill="currentColor" opacity="0.6" />
                                <circle cx="200" cy="200" r="4.5" fill="currentColor" opacity="0.8" />
                            </svg>
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 space-y-5">
                            <h1 className="text-4xl xl:text-6xl font-black tracking-tight text-foreground leading-[1.08]">
                                Dedicated <br />
                                <span className="text-primary underline decoration-primary/30 decoration-6 underline-offset-6">property</span> <br />
                                operations.
                            </h1>

                            <p className="text-lg text-muted-foreground font-normal leading-relaxed max-w-lg">
                                Unified workspace for portfolio operations, automated financials, and direct resident engagement.
                            </p>
                        </div>

                        {/* Noticeable & Pleasing CTA Button */}
                        <div className="relative z-10 pt-2">
                            <Link
                                href="/download"
                                className="group inline-flex items-center gap-3.5 px-5 py-3 rounded-xl bg-card/90 hover:bg-card border border-border/80 hover:border-primary/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                                    <Download className="size-4.5" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                        Download iReside App
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        For Windows & Android
                                    </span>
                                </div>
                                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-2 shrink-0" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Sign-In Card */}
                    <div className="w-full lg:col-span-5 max-w-md mx-auto">
                        <motion.section 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6"
                        >
                            {/* Card Header */}
                            <div className="space-y-1.5">
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                    Sign In
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Enter your credentials to access your workspace.
                                </p>
                            </div>

                            {/* Error Notification */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        role="alert"
                                        aria-live="polite"
                                        className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 overflow-hidden text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        <p className="text-xs font-medium leading-relaxed">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Authentication Form */}
                            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                                <div className="space-y-4">
                                    {/* Email Field */}
                                    <div className="space-y-1.5">
                                        <label 
                                            htmlFor="email"
                                            className="block text-xs font-semibold text-foreground/90 select-none"
                                        >
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            autoComplete="email"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            placeholder="name@example.com"
                                            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label 
                                                htmlFor="password"
                                                className="block text-xs font-semibold text-foreground/90 select-none"
                                            >
                                                Password
                                            </label>
                                            <Link 
                                                href="/forgot-password" 
                                                className="text-xs font-semibold text-primary hover:underline transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
                                            >
                                                Forgot Password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={isPasswordVisible ? "text" : "password"}
                                                required
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                                aria-pressed={isPasswordVisible}
                                            >
                                                {isPasswordVisible ? (
                                                    <EyeOff className="size-4.5" />
                                                ) : (
                                                    <Eye className="size-4.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all duration-200 hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign into Workspace</span>
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative flex items-center gap-3 py-1">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    OR CONTINUE WITH
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            {/* Google OAuth Login */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="h-11 w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background hover:bg-muted/50 text-foreground font-semibold text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <svg className="size-4.5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                <span>Google Account</span>
                            </button>

                            {/* Resident Activation Link (Single Clean Footnote) */}
                            <div className="pt-2 text-center">
                                <p className="text-xs text-muted-foreground">
                                    Invited as a resident?{" "}
                                    <Link 
                                        href="/signup/tenant" 
                                        className="font-semibold text-primary hover:underline transition-colors"
                                    >
                                        Activate with Invite Code
                                    </Link>
                                </p>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-20 w-full border-t border-border/40 py-5 text-center select-none bg-background/50 backdrop-blur-xs">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>© 2026 iReside Technologies</span>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">
                        Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-foreground transition-colors">
                        Terms of Service
                    </Link>
                    <span>•</span>
                    <Link href="/download" className="hover:text-foreground transition-colors">
                        Desktop & Mobile
                    </Link>
                </div>
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-svh bg-background flex items-center justify-center animate-pulse">
                <Logo className="h-10 w-36" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
