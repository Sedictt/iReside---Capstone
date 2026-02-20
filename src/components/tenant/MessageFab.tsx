"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChatWidget } from "./ChatWidget";

export function MessageFab() {
    const pathname = usePathname();
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Don't show on the concierge page itself to avoid redundancy
    if (pathname === "/tenant/dashboard/ai-concierge") return null;

    return (
        <>
            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(109,152,56,0.3)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group border border-white/20",
                    "animate-in slide-in-from-bottom-4 fade-in duration-700",
                    isChatOpen && "scale-90 opacity-0 pointer-events-none"
                )}
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    <div className="absolute -top-1 -right-1">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                    </div>
                </div>
                <span className="font-semibold text-sm pr-1">Chat with iRis</span>
            </button>

            <ChatWidget
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </>
    );
}

