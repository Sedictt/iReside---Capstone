"use client";

import { TenantSettings } from "@/components/tenant/TenantSettings";

export default function TenantSettingsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="relative overflow-hidden p-3.5 sm:p-6 md:p-10 lg:p-12">
                <div className="relative mx-auto max-w-6xl">
                    <TenantSettings />
                </div>
            </div>
        </div>
    );
}
