"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { MapSetupWizard } from "@/components/landlord/visual-planner/MapSetupWizard";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";
import { Map } from "lucide-react";

type MapState = "loading" | "no-property" | "setup" | "ready";

function UnitMapContent() {
    const searchParams = useSearchParams();
    const preview = searchParams.get("preview");
    const isPreviewEmptyFloor = preview === "empty-floor" || preview === "setup" || preview === "true";

    const { selectedPropertyId, selectedProperty, loading, properties } = useProperty();
    const [mapState, setMapState] = useState<MapState>("loading");
    const [setupKey, setSetupKey] = useState(0);

    useEffect(() => {
        if (isPreviewEmptyFloor) {
            setMapState("setup");
            return;
        }

        if (loading && properties.length === 0) {
            setMapState("loading");
            return;
        }

        if (!selectedPropertyId || selectedPropertyId === "all") {
            setMapState("no-property");
            return;
        }

        // Check if the map has been set up for this property
        const checkSetup = async () => {
            setMapState("loading");
            try {
                const res = await fetch(`/api/landlord/unit-map?propertyId=${selectedPropertyId}`);
                if (!res.ok) {
                    setMapState("ready"); // fallback to canvas
                    return;
                }
                const data = await res.json() as { isSetupComplete: boolean; totalUnits: number };
                
                // If no units exist yet (property just created) or all are placed, go to canvas
                if (data.totalUnits === 0 || data.isSetupComplete) {
                    setMapState("ready");
                } else {
                    setMapState("setup");
                }
            } catch {
                setMapState("ready"); // fallback on error
            }
        };

        void checkSetup();
    }, [selectedPropertyId, loading, properties.length, setupKey, isPreviewEmptyFloor]);

    if (isPreviewEmptyFloor) {
        return (
            <div className="flex flex-col h-full">
                <MapSetupWizard
                    propertyId="preview-property"
                    propertyName="Skyline Residences (Preview)"
                    previewEmptyFloors={true}
                    onSetupComplete={() => setMapState("ready")}
                />
            </div>
        );
    }

    if (mapState === "loading") {
        return null;
    }

    if (mapState === "no-property") {
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

    if (mapState === "setup" && selectedPropertyId && selectedPropertyId !== "all") {
        return (
            <div className="flex flex-col h-full">
                <MapSetupWizard
                    propertyId={selectedPropertyId}
                    propertyName={selectedProperty?.name ?? "Your Property"}
                    onSetupComplete={() => setMapState("ready")}
                />
            </div>
        );
    }

    return (
        <div data-tour-id="tour-unit-map" className="h-full">
            <VisualBuilder />
        </div>
    );
}

export default function UnitMapPage() {
    return (
        <Suspense fallback={null}>
            <UnitMapContent />
        </Suspense>
    );
}
