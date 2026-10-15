"use client";

import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useLanguageContext } from "@/context/LanguageContext";

export default function LandlordLoading() {
    const { t } = useLanguageContext();
    return <PageLoader message={t("Loading")} />;
}
