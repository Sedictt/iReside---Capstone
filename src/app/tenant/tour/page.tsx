"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * @deprecated The interactive walkthrough has been replaced by the dashboard slideshows.
 * Redirects tenants back to their primary dashboard.
 */
export default function TenantTourPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/tenant/dashboard");
    }, [router]);

    return (
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
            Redirecting to dashboard...
        </div>
    );
}
