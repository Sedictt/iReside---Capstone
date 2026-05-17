"use client";

import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function TenantLoginPage() {
    return (
        <div className="flex min-h-screen bg-[#0f1218] text-white font-sans">
            {/* Left Panel - Hero Image & Branding */}
            <div className="relative hidden w-[55%] flex-col justify-end overflow-hidden lg:flex">
                <img
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2000&auto=format&fit=crop"
                    alt="Cozy Apartment Interior"
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
                            Your home, at your fingertips.
                        </h1>
                        <p className="text-lg text-slate-200 drop-shadow-md">
                            Pay rent, submit maintenance requests, and stay in touch with your landlord — all from one simple dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Tenant Login Form */}
            <div className="flex w-full flex-col justify-center px-8 lg:w-[45%] lg:px-24">
                <div className="mx-auto w-full max-w-[400px] space-y-8">

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Tenant Login</h2>
                        <p className="text-slate-400">
                            Sign in with the credentials provided by your landlord.
                        </p>
                    </div>

                    <LoginForm showForgotPassword={false} />

                    <div className="pt-8 text-center">
                        <p className="text-xs text-slate-500">
                            Your account was created by your property manager. If you need help signing in, please contact your landlord directly.
                        </p>
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                            &copy; {new Date().getFullYear()} iReside Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}