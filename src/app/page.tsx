"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";

export default function RootTurnkeyEntryPage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        const role = profile?.role || (user.user_metadata as any)?.role || "landlord";

        if (role === "tenant") {
            router.replace("/tenant/dashboard");
        } else {
            // Both landlord and legacy admin accounts route directly to Landlord Dashboard
            router.replace("/landlord/dashboard");
        }
    }, [user, profile, loading, router]);

    return <PageLoader message="Entering iReside Workspace…" />;
}
