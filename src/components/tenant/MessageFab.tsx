"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";
import { ChatWidget } from "./ChatWidget";

export function MessageFab() {
    const pathname = usePathname();
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Don't show on the messages page to avoid redundancy
    if (pathname === "/tenant/messages" || pathname?.startsWith("/mobile/tenant/messages")) return null;

    const handleToggleChat = () => {
        triggerHaptic('light');
        setIsChatOpen(!isChatOpen);
    };

    return (
        <>
            <button
                onClick={handleToggleChat}
                className={cn(
                    "fixed bottom-20 right-4 md:bottom-6 md:right-auto md:left-[19.5rem] z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-primary text-white rounded-full shadow-[0_8px_30px_rgb(109,152,56,0.3)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group border border-white/20",
                    "animate-in slide-in-from-bottom-4 fade-in duration-700",
                    isChatOpen && "scale-90 opacity-0 pointer-events-none"
                )}
                aria-label="Chat with iRis Assistant"
            >
                <div className="relative">
                    <MessageSquare className="size-4 sm:size-5" />
                    <div className="absolute -top-1 -right-1">
                        <Sparkles className="size-2.5 text-yellow-300 animate-pulse" />
                    </div>
                </div>
                <span className="font-black text-xs sm:text-sm pr-1">Chat with iRis</span>
            </button>

            <ChatWidget
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </>
    );
}


