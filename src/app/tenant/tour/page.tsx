"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguageContext } from "@/context/LanguageContext";

/**
 * @deprecated The interactive walkthrough has been replaced by the dashboard slideshows.
 * Redirects tenants back to their primary dashboard.
 */
export default function TenantTourPage() {
    const router = useRouter();
    const { t } = useLanguageContext();

    useEffect(() => {
        router.replace("/tenant/dashboard");
    }, [router]);

    return (
        <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
            {t("Redirecting to dashboard...")}
        </div>
    );
}
