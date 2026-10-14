/**
 * @deprecated [DEPRECATED - Turnkey Architecture]
 * Legacy self-serve landlord signup route.
 * In the Turnkey architecture, landlord workspaces are pre-provisioned.
 * Automatically redirects to /login.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useLanguageContext } from "@/context/LanguageContext";

export default function SignUpPage() {
    const router = useRouter();
    const { t } = useLanguageContext();

    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return <PageLoader message={t("Redirecting to Login…")} />;
}
