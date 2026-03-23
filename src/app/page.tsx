"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex min-h-screen bg-[#0f1218] text-white font-sans">
            {/* Left Panel - Hero Image & Branding */}
            <div className="relative hidden w-[55%] flex-col justify-end overflow-hidden lg:flex">
                <img
                    src="/hero-images/apartment-03.png"
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
                            Property Management,<br />Reimagined.
                        </h1>
                        <p className="text-lg text-slate-200 drop-shadow-md">
                            A private property management system built for landlords.
                            Manage your units, tenants, and operations — all in one place.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Redirect */}
            <div className="flex w-full flex-col items-center justify-center px-8 lg:w-[45%] lg:px-24">
                <div className="mx-auto w-full max-w-[400px] space-y-8 text-center">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">iReside</span>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            Welcome to iReside
                        </h2>
                        <p className="text-slate-400">
                            Sign in to access your dashboard and manage your properties.
                        </p>
                    </div>

                    <Link
                        href="/login"
                        className="block w-full rounded-lg bg-blue-600 py-3.5 font-bold text-white text-center shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98]"
                    >
                        Log In
                    </Link>

                    <p className="text-sm text-slate-500">
                        Don&apos;t have an account? Contact your system administrator.
                    </p>

                    <div className="pt-8">
                        <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                            © {new Date().getFullYear()} iReside Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
