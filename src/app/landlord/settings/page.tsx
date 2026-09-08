"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="relative overflow-hidden p-3.5 sm:p-6 md:p-10 lg:p-12">
                <div className="relative mx-auto max-w-6xl">
                    <LandlordSettings />
                </div>
            </div>
        </div>
    );
}

