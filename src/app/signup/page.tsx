"use client";

import Link from "next/link";
import { Building2, Facebook, Eye } from "lucide-react";
import { useState } from "react";
import { signUp } from "@/lib/supabase/auth";

export default function SignUpPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await signUp(formData);

        if (result?.error) {
            setError(result.error);
        }
        setLoading(false);
    };
    return (
        <div className="flex min-h-screen bg-[#0f1218] text-white font-sans">
            {/* Left Panel - Hero Image & Branding */}
            <div className="relative hidden w-[55%] flex-col justify-end overflow-hidden lg:flex">
                {/* Background Image */}
                <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop"
                    alt="Modern Residence"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative z-10 p-16 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">iReside</span>
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <h1 className="text-5xl font-bold leading-tight tracking-tight drop-shadow-lg">
                            The future of modern residency.
                        </h1>
                        <p className="text-lg text-slate-200 drop-shadow-md">
                            Join thousands of residents managing their homes with our seamless digital ecosystem.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Sign Up Form */}
            <div className="flex w-full flex-col justify-center px-8 lg:w-[45%] lg:px-24">
                <div className="mx-auto w-full max-w-[400px] space-y-8">

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Create an account</h2>
                        <p className="text-slate-400">Join iReside and find your next home.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                                <p className="text-sm font-medium text-red-500">{error}</p>
                            </div>
                        )}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-200" htmlFor="name">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="full_name"
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-200" htmlFor="email">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@email.com"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-slate-200" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="Create a password"
                                        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3.5 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                    <Eye className="absolute right-4 top-3.5 h-5 w-5 text-slate-500 cursor-pointer hover:text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <label htmlFor="terms" className="text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                                I agree to the <Link href="#" className="text-blue-500 hover:text-blue-400">Terms & Conditions</Link>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-[#0f1218] px-3 text-slate-500">Or sign up with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                            <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="h-5 w-5" alt="Facebook" />
                            Facebook
                        </button>
                    </div>

                    <div className="text-center text-sm text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="font-bold text-blue-500 hover:text-blue-400 hover:underline">
                            Log In
                        </Link>
                    </div>

                    <div className="pt-8 text-center">
                        <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                            © {new Date().getFullYear()} iReside Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
