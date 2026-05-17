"use client";

import { User } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function LandlordProfilePage() {
    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
                <p className="text-neutral-400 text-sm font-medium mt-1">Manage your account and business details.</p>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-white/5 p-8">
                <EmptyState
                    icon={User}
                    title="Profile data coming soon"
                    description="Your profile information will be available here once account setup is complete."
                />
            </div>
        </div>
    );
}