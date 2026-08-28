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

export default function SignUpPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return <PageLoader message="Redirecting to Login…" />;
}
