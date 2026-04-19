"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, Facebook, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useState, Suspense, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

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
            // Show friendlier guidance for the common Supabase schema query failure.
            if (error.message.toLowerCase().includes("database error querying schema")) {
                setError("Login failed due to a database sync issue. Please try Google login for now.");
            } else {
                setError(error.message);
            }
            setLoading(false);
            return;
        }

        const role = data.user?.user_metadata?.role || "tenant";
        const target = role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard";
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

    if (!mounted) return null; // Avoid hydration mismatch

    return (
        <div className="flex min-h-screen bg-[#07090D] text-white font-sans overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[40%] w-[35rem] h-[35rem] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

            {/* Left Panel - Hero Image & Branding */}
            <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden lg:flex border-r border-white/5">
                {/* Background Image with Slow Zoom */}
                <div className="absolute inset-0 scale-105 animate-[pulse_20s_ease-in-out_infinite] opacity-60">
                    <img
                        src="/hero-images/apartment-03.png"
                        alt="Modern Residence"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110"
                    />
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#07090D]/95 via-[#07090D]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-transparent" />

                {/* Top Branding */}
                <div className="relative z-10 p-12">
                    <div className="flex items-center">
                        <Logo theme="dark" className="h-12 w-auto drop-shadow-md" />
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-12 space-y-12 mb-12">
                    <div className="space-y-6 max-w-xl">
                        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-sm">
                            The future of modern residency.
                        </h1>
                        <p className="text-xl text-slate-300 font-medium leading-relaxed drop-shadow-xl">
                            Experience seamless living. Join thousands managing their homes with our intelligent digital ecosystem.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 max-w-md">
                        {[
                            "Automated rent payments and instant invoicing.",
                            "Real-time maintenance tracking and resolution.",
                            "Secure document storage and lease management."
                        ].map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-sm font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="relative flex w-full flex-col justify-center px-6 lg:w-[45%] lg:px-20 z-10">
                
                {/* Mobile Header Branding */}
                <div className="flex items-center justify-center mb-12 lg:hidden">
                        <Logo theme="dark" className="h-10 w-auto" />
                </div>

                <div className="mx-auto w-full max-w-[420px]">
                    <div className="mb-10 space-y-3">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white">Welcome back.</h2>
                        <p className="text-slate-400 text-base font-medium">Log in to your residency portal.</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="text-red-400 mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-red-200">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 group-focus-within:text-primary transition-colors" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-md"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 group-focus-within:text-primary transition-colors" htmlFor="password">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={isPasswordVisible ? "text" : "password"}
                                        required
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-slate-100 placeholder-slate-500 focus:border-primary focus:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all backdrop-blur-md"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                    >
                                        <Eye className={`h-5 w-5 ${isPasswordVisible ? 'text-primary' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 focus:ring-offset-[#07090D]"
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-300 hover:text-white cursor-pointer select-none transition-colors">
                                Keep me logged in
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-[0_0_20px_rgba(109,152,56,0.3)] transition-all hover:bg-primary-dark hover:shadow-[0_0_25px_rgba(109,152,56,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? "Authenticating..." : "Sign In"}
                                {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 -translate-x-full rotate-[45deg] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-extrabold tracking-widest">
                            <span className="bg-[#07090D] px-4 text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-sm disabled:opacity-50"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 backdrop-blur-sm">
                            <Facebook className="h-5 w-5 text-[#1877F2]" />
                            Facebook
                        </button>
                    </div>

                    <div className="mt-12 text-center text-sm font-medium text-slate-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-bold text-white hover:text-primary transition-colors">
                            Create one now
                        </Link>
                    </div>
                </div>

            </div>
            
            {/* Global shimmer animation for button */}
            <style jsx global>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(200%) rotate(45deg);
                    }
                }
            `}</style>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen bg-[#07090D] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/10"></div>
                    <div className="h-4 w-24 rounded bg-white/10"></div>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}