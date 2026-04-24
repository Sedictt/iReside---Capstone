"use client";

import VisualBuilder from "@/components/landlord/visual-planner/VisualBuilder";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";
import { Map } from "lucide-react";

export default function UnitMapPage() {
    const { selectedPropertyId, loading, properties } = useProperty();

    if (loading && properties.length === 0) {
        return (
            <PropertySelectorHub 
                title="Visual Planner"
                description="Initialize the architectural layout and unit map for your property portfolio."
                buttonText="Open Visual Planner"
                icon={<Map className="h-6 w-6" />}
                badgeText="Architecture Hub"
            />
        );
    }

    if (selectedPropertyId === "all") {
        return (
            <PropertySelectorHub 
                title="Visual Planner"
                description="Initialize the architectural layout and unit map for your property portfolio."
                buttonText="Open Visual Planner"
                icon={<Map className="h-6 w-6" />}
                badgeText="Architecture Hub"
            />
        );
    }

    return <VisualBuilder />;
}
