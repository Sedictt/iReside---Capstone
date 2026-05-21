"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    const { back } = useRouter();

    return (
        <div className="min-h-screen bg-background text-neutral-400">
            <div className="relative overflow-hidden p-6 md:p-12 lg:p-16">
                <div className="relative mx-auto max-w-6xl">
                    <button
                        onClick={() => back()}
                        className="flex items-center gap-2 text-neutral-500 hover:text-primary transition-colors mb-10 group"
                    >
                        <div className="size-8 rounded-full neumorphic-extruded flex items-center justify-center transition-all">
                            <ChevronLeft className="size-4" />
                        </div>
                        <span className="text-sm font-black tracking-wide">Back to Dashboard</span>
                    </button>
                    <LandlordSettings />
                </div>
            </div>
        </div>
    );
}

