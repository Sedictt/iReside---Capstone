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

    const { selectedPropertyId, loading, properties, setSelectedPropertyId } = useProperty();

    // When "All Properties" is selected, always show the property picker
    if (selectedPropertyId === "all") {
        return (
            <PropertySelectorHub 
                title="2D Room Map"
                description="Select a property to view and manage its unit map layout."
                buttonText="Open Room Map"
                icon={<Map className="size-6" />}
                badgeText="Unit Map"
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

    if (!activePropertyId) {
        return (
            <PropertySelectorHub 
                title="2D Room Map"
                description="Select a property to view and manage its unit map layout."
                buttonText="Open Room Map"
                icon={<Map className="size-6" />}
                badgeText="Unit Map"
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
