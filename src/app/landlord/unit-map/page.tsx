"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { MapSetupWizard } from "@/components/landlord/visual-planner/MapSetupWizard";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";
import { Map } from "lucide-react";
import { VisualPlannerSkeleton } from "@/components/landlord/visual-planner/components/VisualPlannerSkeleton";
import { useLanguageContext } from "@/context/LanguageContext";

function UnitMapContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const allowDesktop = searchParams.get("desktop") === "1";
    const [isRedirectingToMobile, setIsRedirectingToMobile] = useState(false);

    useEffect(() => {
        if (allowDesktop) {
            setIsRedirectingToMobile(false);
            return;
        }

        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const checkViewportAndRedirect = () => {
            if (mediaQuery.matches || window.innerWidth < 768) {
                setIsRedirectingToMobile(true);
                router.replace("/mobile/landlord/unit-map");
            }
        };

        checkViewportAndRedirect();
        mediaQuery.addEventListener("change", checkViewportAndRedirect);
        window.addEventListener("resize", checkViewportAndRedirect);

        return () => {
            mediaQuery.removeEventListener("change", checkViewportAndRedirect);
            window.removeEventListener("resize", checkViewportAndRedirect);
        };
    }, [allowDesktop, router]);

    const preview = searchParams.get("preview");
    const isPreviewEmptyFloor = preview === "empty-floor" || preview === "setup" || preview === "true";

    const { selectedPropertyId, loading, properties, setSelectedPropertyId } = useProperty();
    const { t } = useLanguageContext();

    if (isRedirectingToMobile) {
        return <VisualPlannerSkeleton />;
    }

    // When "All Properties" is selected, always show the property picker
    if (selectedPropertyId === "all") {
        return (
            <PropertySelectorHub 
                title={t("2D Room Map")}
                description={t("Select a property to view and manage its unit map layout.")}
                buttonText={t("Open Room Map")}
                icon={<Map className="size-6" />}
                badgeText={t("Unit Map")}
            />
        );
    }

    const paramPropertyId = searchParams.get("propertyId");
    const unconfiguredProperty = properties.find((p) => !p.isMapSetupComplete);
    const activePropertyId =
        selectedPropertyId && selectedPropertyId !== "all"
            ? selectedPropertyId
            : paramPropertyId || unconfiguredProperty?.id || (properties.length === 1 ? properties[0]?.id : null);

    if (isPreviewEmptyFloor) {
        return (
            <div className="flex flex-col h-full">
                <MapSetupWizard
                    propertyId="preview-property"
                    propertyName={t("Skyline Residences (Preview)")}
                    previewEmptyFloors={true}
                    onSetupComplete={() => {}}
                />
            </div>
        );
    }

    if (loading && properties.length === 0) {
        return <VisualPlannerSkeleton />;
    }

    if (!activePropertyId) {
        return (
            <PropertySelectorHub 
                title={t("2D Room Map")}
                description={t("Select a property to view and manage its unit map layout.")}
                buttonText={t("Open Room Map")}
                icon={<Map className="size-6" />}
                badgeText={t("Unit Map")}
            />
        );
    }

    return (
        <div className="h-full">
            <VisualBuilder key={activePropertyId} propertyId={activePropertyId} />
        </div>
    );
}

export default function UnitMapPage() {
    return (
        <Suspense fallback={<VisualPlannerSkeleton />}>
            <UnitMapContent />
        </Suspense>
    );
}
