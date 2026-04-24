"use client";

import TenantCommunityHubPage from "@/app/tenant/community/page";
import { PropertySelectorHub } from "@/components/landlord/community/PropertySelectorHub";
import { useProperty } from "@/context/PropertyContext";

export default function LandlordCommunityHubPage() {
    const { selectedPropertyId, loading, properties } = useProperty();

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

    if (selectedPropertyId === "all") {
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
