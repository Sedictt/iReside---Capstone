"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SignUpPage() {
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
                        <Logo theme="dark" className="h-10 w-auto" />
                    </div>

                    <div className="space-y-4 max-w-lg">
                        <h1 className="text-5xl font-bold leading-tight tracking-tight drop-shadow-lg">
                            Private Property Management
                        </h1>
                        <p className="text-lg text-slate-200 drop-shadow-md">
                            iReside is a private system built for authorized landlords and tenants.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex w-full flex-col items-center justify-center px-8 lg:w-[45%] lg:px-24">
                <div className="mx-auto w-full max-w-[400px] space-y-8 text-center">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
                        <Logo theme="dark" className="h-10 w-auto" />
                    </div>

                    <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <ShieldAlert className="h-10 w-10 text-amber-400" />
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight text-white">
                            Registration Not Available
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            iReside is a private system. Landlord accounts are created by the
                            system administrator, and tenant accounts are automatically created
                            only after landlord approval and lease finalization. Tenant invite
                            links or QR codes may be used for private application intake, but
                            they do not create an account by themselves.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-left space-y-3">
                        <p className="text-sm text-slate-300 font-medium">Need access?</p>
                        <ul className="text-sm text-slate-400 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">•</span>
                                <span><strong className="text-white">Landlords:</strong> Contact the system administrator to get your account set up.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">•</span>
                                <span><strong className="text-white">Tenants:</strong> Your account will be created automatically when your landlord finalizes your lease agreement.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold mt-0.5">â€¢</span>
                                <span><strong className="text-white">Private invite holders:</strong> Use your landlord-issued application link or QR code instead of signing up here.</span>
                            </li>
                        </ul>
                    </div>

                    <Link
                        href="/login"
                        className="block w-full rounded-lg bg-blue-600 py-3.5 font-bold text-white text-center shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.98]"
                    >
                        Go to Login
                    </Link>

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
