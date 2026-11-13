"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TenantCommunityHubPage from "@/app/tenant/community/page";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";

function LandlordCommunityContent() {
    const { selectedPropertyId, setSelectedPropertyId, loading, properties } = useProperty();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab");

    useEffect(() => {
        if (tab && selectedPropertyId === "all" && properties.length > 0) {
            setSelectedPropertyId(properties[0].id);
        }
    }, [tab, selectedPropertyId, properties, setSelectedPropertyId]);

    if (loading && properties.length === 0) {
        return (
            <PropertySelectorHub 
                title="Community Hub"
                description="Access the exclusive community hub for this property. Manage resident interactions, announcements, and feedback."
                buttonText="Enter Community Hub"
                badgeText="Property Feed"
            />
        );
    }

    if (selectedPropertyId === "all" && !tab) {
        return (
            <PropertySelectorHub 
                title="Community Hub"
                description="Access the exclusive community hub for this property. Manage resident interactions, announcements, and feedback."
                buttonText="Enter Community Hub"
                badgeText="Property Feed"
            />
        );
    }

    return <TenantCommunityHubPage />;
}

export default function LandlordCommunityHubPage() {
    return (
        <Suspense fallback={null}>
            <LandlordCommunityContent />
        </Suspense>
    );
}
