"use client";

import { MessageSquare, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

export default function TenantMessagesPage() {
    return (
        <div className="flex h-full w-full overflow-hidden p-6 animate-in fade-in duration-700">
            <div className="w-full rounded-2xl border border-border/50 bg-card/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/tenant/dashboard"
                        className="bg-neutral-800 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                    </Link>
                    <h2 className="text-xl font-bold text-white">Messages</h2>
                </div>
                <EmptyState
                    icon={MessageSquare}
                    title="No messages yet"
                    description="When your landlord or property manager sends you messages, they'll appear here."
                />
            </div>
        </div>
    );
}