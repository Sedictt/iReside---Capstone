/**
 * @deprecated [DEPRECATED - Turnkey Architecture]
 * Legacy multi-tenant admin portal layout.
 * Retained for non-destructive technical reference only.
 * Excluded from active turnkey system architecture, documentation, and diagrams.
 * All requests are automatically redirected to /landlord/dashboard.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/LoadingSpinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        router.replace("/landlord/dashboard");
    }, [router]);

    return <PageLoader message="Redirecting to Landlord Dashboard…" />;
}
