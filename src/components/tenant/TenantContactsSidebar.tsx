"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
    MiniChatSharedFilesPanel,
    MiniChatSidebar,
    MiniChatTray,
    getTrayRightOffset,
    useMiniChat,
} from "@/components/messaging/mini-chat";
import { ChatWidget } from "./ChatWidget";

/**
 * Tenant messaging rail: hover-expanding conversation list with the iRis assistant
 * pinned on top, plus docked mini chat windows (iRis opens in the same dock).
 */
export function TenantContactsSidebar() {
    const controller = useMiniChat({ role: "tenant" });
    const { setSharedFilesChatId } = controller;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isIrisOpen, setIsIrisOpen] = useState(false);
    const closeSharedFiles = useCallback(() => setSharedFilesChatId(null), [setSharedFilesChatId]);

    return (
        <>
            <MiniChatSidebar
                controller={controller}
                onExpandedChange={setIsExpanded}
                dataTourId="tour-messages-sidebar"
                renderLeading={({ isExpanded: expanded }) => {
                    const button = (
                        <button
                            type="button"
                            onClick={() => setIsIrisOpen(true)}
                            aria-label="Open iRis Assistant"
                            className={cn(
                                "group flex items-center gap-3 rounded-2xl border border-primary/20 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                expanded ? "w-full bg-primary/5 p-3 hover:bg-primary/10" : "p-0.5 hover:scale-110"
                            )}
                        >
                            <span className="relative shrink-0">
                                <span className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-white">
                                    <Image src="/logos/favicon.png" alt="" width={40} height={40} className="object-cover" />
                                </span>
                                <span className="absolute right-0 top-0 size-3 animate-pulse rounded-full border-2 border-card bg-primary" aria-hidden="true" />
                            </span>
                            {expanded && (
                                <span className="min-w-0 flex-1">
                                    <span className="mb-0.5 flex items-center justify-between">
                                        <span className="truncate pr-2 text-sm font-bold text-primary">iRis Assistant</span>
                                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary/80">AI</span>
                                    </span>
                                    <span className="block truncate text-xs font-medium text-foreground/80">How can I help you today?</span>
                                </span>
                            )}
                        </button>
                    );

                    return (
                        <div className={cn(expanded ? "mb-1" : "mb-0")}>
                            {expanded ? button : <Tooltip content="iRis Assistant" side="left">{button}</Tooltip>}
                        </div>
                    );
                }}
            />

            <MiniChatTray controller={controller} rightOffset={getTrayRightOffset(isExpanded)}>
                <ChatWidget isOpen={isIrisOpen} onClose={() => setIsIrisOpen(false)} embedded />
            </MiniChatTray>

            <MiniChatSharedFilesPanel chat={controller.sharedFilesChat} files={controller.sharedFiles} onClose={closeSharedFiles} />
        </>
    );
}
