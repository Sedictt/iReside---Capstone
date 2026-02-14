"use client";

import { Lock, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface LeaseHeaderProps {
    currentStep: number;
    steps: { id: number; label: string }[];
    leaseId: string;
}

export function LeaseHeader({ currentStep, steps, leaseId }: LeaseHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f172a] px-6 py-4 text-white shadow-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                {/* Left: Branding & Status */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold tracking-tight text-blue-400">iReside</span>
                        <span className="text-gray-400">|</span>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        <Lock className="h-3 w-3" />
                        <span>Secure Connection</span>
                    </div>
                </div>

                {/* Center: Progress Steps */}
                <div className="hidden md:flex items-center gap-4">
                    {steps.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = step.id < currentStep;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : isCompleted
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-slate-700 text-slate-400"
                                        )}
                                    >
                                        {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-sm font-medium transition-colors",
                                            isActive ? "text-blue-400" : "text-slate-400"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className="mx-3 h-px w-8 bg-slate-700" aria-hidden="true" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right: User Profile & Lease ID */}
                <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Lease ID</p>
                        <p className="text-sm font-medium text-white">{leaseId}</p>
                    </div>
                    <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-700">
                        {/* Placeholder Avatar */}
                        <div className="flex h-full w-full items-center justify-center bg-slate-600 font-bold text-white">
                            AR
                        </div>
                        {/* Ideally utilize Image component here if user image is available */}
                    </div>
                </div>
            </div>
        </header>
    );
}
