"use client";

import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MessageFab() {
    const pathname = usePathname();

    // Don't show on the concierge page itself to avoid redundancy
    if (pathname === "/tenant/dashboard/ai-concierge") return null;

    return (
        <Link
            href="/tenant/dashboard/ai-concierge"
            className={cn(
                "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group",
                "animate-in slide-in-from-bottom-4 fade-in duration-700"
            )}
        >
            <div className="relative">
                <MessageSquare className="w-5 h-5" />
                <div className="absolute -top-1 -right-1">
                    <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                </div>
            </div>
            <span className="font-semibold text-sm pr-1">Chat with iRis</span>
        </Link>
    );
}
