"use client";

import { useProperty } from "@/context/PropertyContext";
import { CalendarView } from "@/components/calendar/CalendarView";
import { useLanguageContext } from "@/context/LanguageContext";

export default function LandlordCalendarPage() {
    const { selectedPropertyId } = useProperty();
    const { t } = useLanguageContext();

    return (
        <CalendarView
            role="landlord"
            eventsEndpoint="/api/landlord/calendar/events"
            propertyId={selectedPropertyId}
            title={t("Operations Calendar")}
            subtitle={t("Track upcoming payments, lease milestones, and maintenance events across properties.")}
        />
    );
}
