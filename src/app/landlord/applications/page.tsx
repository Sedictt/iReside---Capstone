"use client";

import { RentApplications } from "@/components/landlord/applications/RentApplications";
import { Suspense } from "react";

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div className="p-8 flex items-center justify-center text-neutral-400">Loading applications...</div>}>
            <RentApplications />
        </Suspense>
    );
}
