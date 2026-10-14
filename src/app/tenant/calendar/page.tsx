"use client";

import { CalendarView } from "@/components/calendar/CalendarView";
import { TenantContactsSidebar } from "@/components/tenant/TenantContactsSidebar";
import { useLanguageContext } from "@/context/LanguageContext";

export default function TenantCalendarPage() {
    const { t } = useLanguageContext();
    return (
        <div className="w-full relative md:pr-[104px] lg:pr-[112px]">
            <CalendarView
                role="tenant"
                eventsEndpoint="/api/tenant/calendar/events"
                notesEndpoint="/api/tenant/calendar/notes"
                title={t("My Schedule")}
                subtitle={t("Keep track of your rent dues, lease dates, maintenance visits, and personal notes.")}
                emptyTitle={t("All Clear")}
                emptySubtitle={t("No upcoming bills due, maintenance visits, or milestones for this date.")}
            />
            <TenantContactsSidebar />
        </div>
    );
}
