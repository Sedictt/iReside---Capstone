"use client";

import { useProperty } from "@/context/PropertyContext";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function LandlordCalendarPage() {
    const { selectedPropertyId } = useProperty();

    return (
        <CalendarView
            role="landlord"
            eventsEndpoint="/api/landlord/calendar/events"
            propertyId={selectedPropertyId}
            title="Operations Calendar"
            subtitle="Track upcoming payments, lease milestones, and maintenance events across properties."
        />
    );
}
