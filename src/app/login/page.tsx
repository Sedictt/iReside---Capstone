"use client";

import Image from "next/image";
import Link from "next/link";
import { 
    Eye, 
    ArrowRight, 
    ShieldCheck, 
    UserCircle,
    ArrowUpRight,
    Info,
    Building2,
    Lock
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
            setLoading(false);
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
        <div className="min-h-svh w-full flex items-center justify-center bg-background relative overflow-y-auto selection:bg-primary/30 font-sans py-20 lg:py-0">
            {/* Ambient Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <Image 
                    src="/hero-images/apartment-03.png" 
                    alt="Background" 
                    fill 
                    sizes="100vw"
                    className="object-cover opacity-15 dark:opacity-10 grayscale-[60%]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Top Utility Header */}
            <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 md:p-8 flex items-center justify-between z-50">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                    <Logo className="h-9 md:h-10 w-auto drop-shadow-xl" />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                    <ThemeToggle className="shadow-lg" />
                </motion.div>
            </header>

            {/* Main Auth Grid */}
            <motion.main 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 px-4 sm:px-6 items-center"
            >
                {/* Left Side: Brand Narrative */}
                <div className="hidden lg:flex flex-col space-y-8">
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tighter text-foreground drop-shadow-xs">
                            Dedicated <br />
                            <span className="text-primary italic underline decoration-primary/20 decoration-8 underline-offset-8">property</span> <br /> 
                            operations.
                        </h1>

                        <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-md">
                            Unified workspace for portfolio operations, automated financials, and direct resident engagement.
                        </p>
                    </div>

                    {/* Features Highlights */}
                    <div className="grid grid-cols-1 gap-3.5 max-w-lg">
                        <div className="p-4.5 rounded-2xl neumorphic-panel flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <Lock className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-foreground">Isolated Private Workspace</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Property and tenant records are completely protected with private role-based access.
                                </p>
                            </div>
                        </div>

                        <div className="p-4.5 rounded-2xl neumorphic-panel flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm text-foreground">Centralized Operations</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Streamlined rent tracking, maintenance dispatching, and direct resident communication.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sign-In Card */}
                <div className="relative w-full">
                    <section className="relative rounded-3xl sm:rounded-[2.5rem] neumorphic-panel p-6 sm:p-10 lg:p-12 space-y-6 shadow-2xl">
                        <div className="space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none">Sign In</h2>
                            <p className="text-sm sm:text-base text-muted-foreground font-medium">
                                Enter your credentials to access your workspace.
                            </p>
                        </div>

                        {/* Error Handling */}
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 overflow-hidden"
                                >
                                    <ShieldCheck className="size-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs font-black text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="h-14 w-full rounded-2xl neumorphic-inset px-5 text-sm focus:ring-2 focus:ring-primary/30 transition-all outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground" htmlFor="password">Password</label>
                                        <Link href="/forgot-password" title="Forgot Password?" className="text-[11px] font-black text-primary hover:underline">Forgot Password?</Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={isPasswordVisible ? "text" : "password"}
                                            required
                                            placeholder="••••••••"
                                            className="h-14 w-full rounded-2xl neumorphic-inset px-5 pr-12 text-sm focus:ring-2 focus:ring-primary/30 transition-all outline-none font-medium"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1"
                                            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                        >
                                            <Eye className={cn("size-5", isPasswordVisible && "text-primary")} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 w-full rounded-2xl neumorphic-primary font-black text-base transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 cursor-pointer shadow-lg"
                            >
                                {loading ? "Authenticating..." : "Sign into Workspace"}
                                {!loading && <ArrowRight className="size-5" />}
                            </button>
                        </form>

                        <div className="relative flex items-center gap-4 pt-1">
                            <div className="h-[1px] flex-1 bg-border/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">OR CONTINUE WITH</span>
                            <div className="h-[1px] flex-1 bg-border/50" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="h-14 w-full flex items-center justify-center gap-3.5 rounded-2xl neumorphic-extruded opacity-85 hover:opacity-100 transition-all font-black text-sm active:scale-95 cursor-pointer"
                        >
                            <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={22} height={22} alt="Google" />
                            Google Account
                        </button>

                        {/* Resident Onboarding Join */}
                        <div className="pt-2">
                            <div className="relative group/hint">
                                <Link 
                                    href="/signup/tenant" 
                                    className="flex items-center justify-between p-4 rounded-2xl neumorphic-extruded opacity-85 hover:opacity-100 transition-all group overflow-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <UserCircle className="size-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 leading-none">Resident Portal</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[8px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">Private</span>
                                                    <Info className="size-2.5 text-blue-600/50" />
                                                </div>
                                            </div>
                                            <span className="text-sm font-black">Join with Invite Code</span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                                
                                {/* Hint Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 w-56 p-3 rounded-xl neumorphic-panel opacity-0 translate-y-2 pointer-events-none group-hover/hint:opacity-100 group-hover/hint:translate-y-0 transition-all z-[60] shadow-xl border border-border">
                                    <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                                        <span className="text-blue-600 dark:text-blue-400 font-black">Invite Only:</span> Resident onboarding requires a private invite link or QR code issued by your property manager.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </motion.main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-center opacity-40 select-none pointer-events-none">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em]">
                    © 2026 iReside • Property Operations Platform
                </p>
            </footer>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="h-svh bg-background flex items-center justify-center animate-pulse"><Logo className="h-12 w-44" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
