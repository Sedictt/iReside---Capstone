"use client";

import Link from "next/link";
import { Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LandlordLoginPage() {
    const [googleLoading, setGoogleLoading] = useState(false);

    async function handleGoogleLogin() {
        setGoogleLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            console.error("Google login error:", error);
            setGoogleLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-[#0f1218] text-white font-sans">
            {/* Left Panel - Hero Image & Branding */}
            <div className="relative hidden w-[55%] flex-col justify-end overflow-hidden lg:flex">
                <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop"
                    alt="Modern Residence"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="relative z-10 p-16 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">iReside</span>
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <h1 className="text-5xl font-bold leading-tight tracking-tight drop-shadow-lg">
                            Manage your properties, all in one place.
                        </h1>
                        <p className="text-lg text-slate-200 drop-shadow-md">
                            Track rents, manage tenants, and grow your rental business with our all-in-one platform built for landlords.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex w-full flex-col justify-center px-8 lg:w-[45%] lg:px-24">
                <div className="mx-auto w-full max-w-[400px] space-y-8">

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
                        <p className="text-slate-400">Sign in to your landlord account to continue.</p>
                    </div>

                    <LoginForm />

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-[#0f1218] px-3 text-slate-500">Or log in with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {googleLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                        )}
                        {googleLoading ? "Connecting..." : "Google"}
                    </button>

                    <div className="text-center text-sm text-slate-400">
                        Don&apos;t have an account?{" "}
                        <Link href="/" className="font-bold text-blue-500 hover:text-blue-400 hover:underline">
                            Sign Up
                        </Link>
                    </div>

                    <div className="pt-8 text-center">
                        <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                            &copy; {new Date().getFullYear()} iReside Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
