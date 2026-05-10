"use client";

import Image from "next/image";
import Link from "next/link";
import { 
    Eye, 
    ArrowRight, 
    ShieldCheck, 
    Sparkles,
    Building2,
    UserCircle,
    ArrowUpRight,
    Info
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
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
            setError(error.message);
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

        const target = role === "admin" ? "/admin/dashboard" : (role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard");
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
        <div className="h-svh w-full flex items-center justify-center bg-background relative overflow-hidden selection:bg-primary/30 font-sans">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/hero-images/apartment-03.png" 
                    alt="Background" 
                    fill 
                    className="object-cover opacity-20 dark:opacity-10 grayscale-[50%]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />
                <div className="absolute top-[-20%] left-[-10%] w-[60rem] h-[60rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none dark:bg-primary/10" />
            </div>

            {/* Utility Header */}
            <header className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-50">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Logo className="h-10 w-36 drop-shadow-2xl" />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <ThemeToggle className="shadow-xl" />
                </motion.div>
            </header>

            {/* Main Auth Container */}
            <motion.main 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 px-6 items-center"
            >
                {/* Left Side: Brand Narrative */}
                <div className="hidden lg:flex flex-col space-y-8">
                    <div className="space-y-6">
                        <h1 className="text-7xl font-semibold leading-[1.05] tracking-tighter text-foreground drop-shadow-sm">
                            Welcome to <br />
                            the <span className="text-primary italic underline decoration-primary/20 decoration-8 underline-offset-8">next era</span> <br /> 
                            of living.
                        </h1>
                        <div className="space-y-4">
                            <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-md">
                                A seamless ecosystem designed for modern property owners and discerning residents.
                            </p>
                            <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary hover:gap-3 transition-all group">
                                Learn more about iReside
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-lg pt-4">
                        <div className="p-6 rounded-[2rem] bg-surface-1/30 border border-border/50 backdrop-blur-sm">
                            <ShieldCheck className="size-8 text-primary mb-4" />
                            <h3 className="font-semibold text-foreground">Secure Access</h3>
                            <p className="text-xs text-muted-foreground mt-1">Reliable and secure digital protection.</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-surface-1/30 border border-border/50 backdrop-blur-sm">
                            <ArrowRight className="size-8 text-primary mb-4" />
                            <h3 className="font-semibold text-foreground">Smart Flows</h3>
                            <p className="text-xs text-muted-foreground mt-1">Operational excellence at your fingertips.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Card */}
                <div className="relative">
                    <section className="relative rounded-[3rem] border border-white/10 bg-background/60 dark:bg-surface-1/40 backdrop-blur-3xl shadow-2xl p-10 lg:p-12 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-semibold tracking-tight leading-none">Sign In</h2>
                            <p className="text-base text-muted-foreground font-medium">Access your personalized portal.</p>
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
                                    <ShieldCheck className="size-5 text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="h-14 w-full rounded-2xl border border-border bg-background/50 px-5 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground" htmlFor="password">Password</label>
                                        <Link href="/forgot-password" title="Forgot Password?" className="text-[10px] font-semibold text-primary hover:underline">Forgot?</Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={isPasswordVisible ? "text" : "password"}
                                            required
                                            placeholder="••••••••"
                                            className="h-14 w-full rounded-2xl border border-border bg-background/50 px-5 pr-12 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Eye className={cn("size-5", isPasswordVisible && "text-primary")} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-14 w-full rounded-2xl bg-primary font-semibold text-primary-foreground text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? "Authenticating..." : "Sign into Account"}
                                {!loading && <ArrowRight className="size-5" />}
                            </button>
                        </form>

                        <div className="relative flex items-center gap-4 pt-2">
                            <div className="h-[1px] flex-1 bg-border/50" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">OR CONTINUE WITH</span>
                            <div className="h-[1px] flex-1 bg-border/50" />
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="h-14 w-full flex items-center justify-center gap-4 rounded-2xl border border-border bg-background/50 hover:bg-surface-1 transition-all font-semibold text-sm active:scale-[0.98]"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="size-6" alt="Google" />
                            Google Account
                        </button>

                        {/* Registration Pathway: Final Discovery */}
                        <div className="space-y-4 pt-4">
                            <div className="relative flex items-center gap-4 py-2">
                                <div className="h-[1px] flex-1 bg-border/50" />
                                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">NEW TO IRESIDE?</span>
                                <div className="h-[1px] flex-1 bg-border/50" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Link 
                                    href="/signup" 
                                    className="flex items-center justify-between p-4 rounded-2xl bg-surface-1/50 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Building2 className="size-5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 leading-none mb-1">Landlord</span>
                                            <span className="text-sm font-semibold">Register</span>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>

                                <div className="relative group/hint">
                                    <Link 
                                        href="/signup/tenant" 
                                        className="flex items-center justify-between p-4 rounded-2xl bg-surface-1/50 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <UserCircle className="size-5" />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70 leading-none">Resident</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[8px] font-semibold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/10">Private</span>
                                                        <Info className="size-2.5 text-amber-600/50" />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold">Join</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Link>
                                    
                                    {/* Hint Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-3 rounded-xl bg-surface-2 border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/hint:opacity-100 group-hover/hint:translate-y-0 transition-all z-[60]">
                                        <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
                                            <span className="text-amber-600 font-bold">Invite Only:</span> Access requires a private link or QR code provided by your landlord.
                                        </p>
                                        <div className="absolute top-full left-6 -translate-y-[1px] border-8 border-transparent border-t-surface-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </motion.main>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 right-0 p-8 text-center opacity-30 select-none pointer-events-none">
                <p className="text-[10px] font-semibold uppercase tracking-[0.4em]">© 2026 iReside Technologies. Global Operations.</p>
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
