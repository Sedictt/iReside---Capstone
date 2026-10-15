"use client";

import { RentApplications } from "@/components/landlord/applications/RentApplications";
import { Suspense } from "react";
import { useLanguageContext } from "@/context/LanguageContext";

export default function ApplicationsPage() {
    const { t } = useLanguageContext();
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8 text-muted-foreground">{t("Loading applications...")}</div>}>
            <RentApplications />
        </Suspense>
    );
}
