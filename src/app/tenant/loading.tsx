"use client";

import { PageLoader } from "@/components/ui/LoadingSpinner";
import { useLanguageContext } from "@/context/LanguageContext";

export default function TenantLoading() {
    const { t } = useLanguageContext();
    return <PageLoader message={t("Loading")} />;
}
