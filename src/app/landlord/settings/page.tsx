"use client";

import { LandlordNavbar } from "@/components/landlord/LandlordNavbar";
import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans">
            <LandlordNavbar />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <LandlordSettings />
            </main>
        </div>
    );
}
