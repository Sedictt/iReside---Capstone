"use client";

import { TenantSettings } from "@/components/tenant/TenantSettings";

export default function TenantSettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:py-12">
                <TenantSettings />
            </div>
        </div>
    );
}
