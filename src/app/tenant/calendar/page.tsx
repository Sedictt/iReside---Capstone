"use client";

import { CalendarView } from "@/components/calendar/CalendarView";
import { TenantContactsSidebar } from "@/components/tenant/TenantContactsSidebar";

export default function TenantCalendarPage() {
    return (
        <div className="w-full relative md:pr-[104px] lg:pr-[112px]">
            <CalendarView
                role="tenant"
                eventsEndpoint="/api/tenant/calendar/events"
                notesEndpoint="/api/tenant/calendar/notes"
                title="My Schedule"
                subtitle="Keep track of your rent dues, lease dates, maintenance visits, and personal notes."
                emptyTitle="All Clear"
                emptySubtitle="No upcoming bills due, maintenance visits, or milestones for this date."
            />
            <TenantContactsSidebar />
        </div>
    );
}
