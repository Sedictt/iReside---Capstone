"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { MapSetupWizard } from "@/components/landlord/visual-planner/MapSetupWizard";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";
import { Map } from "lucide-react";
import { VisualPlannerSkeleton } from "@/components/landlord/visual-planner/components/VisualPlannerSkeleton";

function UnitMapContent() {
    const searchParams = useSearchParams();
    const preview = searchParams.get("preview");
    const isPreviewEmptyFloor = preview === "empty-floor" || preview === "setup" || preview === "true";

    const { selectedPropertyId, selectedProperty, loading, properties } = useProperty();

    if (isPreviewEmptyFloor) {
        return (
            <div className="flex flex-col h-full">
                <MapSetupWizard
                    propertyId="preview-property"
                    propertyName="Skyline Residences (Preview)"
                    previewEmptyFloors={true}
                    onSetupComplete={() => {}}
                />
            </div>
        );
    }

    if (loading && properties.length === 0) {
        return <VisualPlannerSkeleton />;
    }

    if (!selectedPropertyId || selectedPropertyId === "all") {
        return (
            <PropertySelectorHub 
                title="Visual Planner"
                description="Initialize the architectural layout and unit map for your property portfolio."
                buttonText="Open Visual Planner"
                icon={<Map className="size-6" />}
                badgeText="Architecture Hub"
            />
        );
    }

    return (
        <div className="h-full">
            <VisualBuilder key={selectedPropertyId} propertyId={selectedPropertyId} />
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
