"use client";

import { RentApplications } from "@/components/landlord/applications/RentApplications";
import { Suspense } from "react";

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8 text-muted-foreground">Loading applications...</div>}>
            <RentApplications />
        </Suspense>
    );
}
