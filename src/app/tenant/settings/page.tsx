"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TenantSettings } from '@/components/tenant/TenantSettings';

export default function TenantSettingsPage() {
    const router = useRouter();

    return (
        <div>
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
                <ChevronLeft className="h-4 w-4" />
                Back
            </button>
            <TenantSettings />
        </div>
    );
}
