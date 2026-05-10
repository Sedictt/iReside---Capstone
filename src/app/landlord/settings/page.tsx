"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-400">
            <div className="relative overflow-hidden p-6 md:p-12 lg:p-16">
                {/* Background Decorations */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(var(--primary-rgb),0.15),transparent_60%)]" />
                <div className="pointer-events-none absolute left-[-10%] top-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="pointer-events-none absolute right-[-5%] bottom-[10%] h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[100px]" />

                <div className="relative mx-auto max-w-6xl">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-10 group"
                    >
                        <div className="size-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
                            <ChevronLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold tracking-wide">Back to Dashboard</span>
                    </button>
                    <LandlordSettings />
                </div>
            </div>
        </div>
    );
}

