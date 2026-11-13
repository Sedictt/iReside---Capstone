"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguageContext } from "@/context/LanguageContext";
import { LandlordHistoryPanel, type HistoryTabId } from "@/components/landlord/history/LandlordHistoryPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function LandlordActivityContent() {
    const { t } = useLanguageContext();
    const router = useRouter();
    const searchParams = useSearchParams();

    const urlTab = searchParams.get("tab") === "actions" ? "actions" : "payments";
    const [tab, setTab] = useState<HistoryTabId>(urlTab);

    useEffect(() => {
        setTab(urlTab);
    }, [urlTab]);

    const handleTabChange = (next: HistoryTabId) => {
        setTab(next);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", next);
        router.replace(`/landlord/activity?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-12 sm:px-6 lg:px-8 space-y-6">
            {/* Calm, uncluttered page title */}
            <header className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {t("Payment & Actions History")}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground max-w-prose">
                    {t("See rent payments from your tenants and a clear record of what you did.")}
                </p>
            </header>

            <LandlordHistoryPanel
                mode="page"
                initialTab={tab}
                onTabChange={handleTabChange}
            />
        </div>
    );
}

export default function LandlordActivityPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner className="size-8 text-primary animate-spin" />
                </div>
            }
        >
            <LandlordActivityContent />
        </Suspense>
    );
}
