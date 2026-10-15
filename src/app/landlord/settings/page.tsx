"use client";

import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:py-12">
                <LandlordSettings />
            </div>
        </div>
    );
}
