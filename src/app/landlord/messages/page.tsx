"use client";

import { MessageSquare, ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

export default function MessagesPage() {
    return (
        <div className="flex h-full w-full bg-[#0a0a0a] text-white p-6 animate-in fade-in duration-700">
            <div className="w-full rounded-2xl border border-white/5 bg-neutral-900/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/landlord/dashboard"
                        className="bg-neutral-800 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-neutral-300" />
                    </Link>
                    <h2 className="text-xl font-bold text-white">Messages</h2>
                </div>
                <EmptyState
                    icon={MessageSquare}
                    title="No messages yet"
                    description="When tenants send you messages, they'll appear here."
                    action={{ label: "Back to Dashboard", href: "/landlord/dashboard" }}
                />
            </div>
        </div>
    );
}