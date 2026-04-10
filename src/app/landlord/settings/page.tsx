"use client";

import { LandlordSettings } from "@/components/landlord/LandlordSettings";

export default function LandlordSettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(var(--primary-rgb),0.18),transparent_58%)]" />
                <div className="pointer-events-none absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-[-5rem] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-7xl">
                    <LandlordSettings />
                </div>
            </div>
        </div>
    );
}
