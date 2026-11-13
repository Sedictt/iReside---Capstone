"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
    MiniChatSharedFilesPanel,
    MiniChatSidebar,
    MiniChatTray,
    getTrayRightOffset,
    useMiniChat,
} from "@/components/messaging/mini-chat";
import { IrisAssistantWorkspace } from "@/components/landlord/iris";
import { useLanguageContext } from "@/context/LanguageContext";

/** CSS custom property on <html> holding the messaging rail's current width (+ gap), in px. */
export const MINI_CHAT_SIDEBAR_EXTENT_VAR = "--mini-chat-sidebar-extent";

/**
 * Landlord messaging rail: a hover-expanding conversation list on the right edge
 * with iRis Assistant pinned at the top, plus docked mini chat windows beside it.
 */
export function ContactsSidebar() {
    const { t } = useLanguageContext();
    const controller = useMiniChat({ role: "landlord" });
    const { setSharedFilesChatId } = controller;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isIrisOpen, setIsIrisOpen] = useState(false);
    const [isIrisMinimized, setIsIrisMinimized] = useState(false);
    const closeSharedFiles = useCallback(() => setSharedFilesChatId(null), [setSharedFilesChatId]);

    const openIris = useCallback(() => {
        setIsIrisOpen(true);
        setIsIrisMinimized(false);
    }, []);

    // Publish the rail's extent so the Quick Tools FAB slides clear of it when it expands.
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty(MINI_CHAT_SIDEBAR_EXTENT_VAR, `${getTrayRightOffset(isExpanded)}px`);
        return () => {
            root.style.removeProperty(MINI_CHAT_SIDEBAR_EXTENT_VAR);
        };
    }, [isExpanded]);

    return (
        <>
            <MiniChatSidebar
                controller={controller}
                onExpandedChange={setIsExpanded}
                renderLeading={({ isExpanded: expanded }) => {
                    const button = (
                        <button
                            type="button"
                            onClick={openIris}
                            aria-label={t("Open iRis Assistant")}
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
                                        <span className="truncate pr-2 text-sm font-bold text-primary">{t("iRis Assistant")}</span>
                                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary/80">AI</span>
                                    </span>
                                    <span className="block truncate text-xs font-medium text-foreground/80">{t("AI Property Assistant")}</span>
                                </span>
                            )}
                        </button>
                    );

                    return (
                        <div className={cn(expanded ? "mb-1" : "mb-0")}>
                            {expanded ? button : <Tooltip content={t("iRis Assistant")} side="left">{button}</Tooltip>}
                        </div>
                    );
                }}
            />

            <MiniChatTray controller={controller} rightOffset={getTrayRightOffset(isExpanded)}>
                {isIrisOpen && (
                    isIrisMinimized ? (
                        <div className="pointer-events-auto flex w-[236px] items-center justify-between gap-2 rounded-t-2xl border border-b-0 border-primary/40 bg-card px-2.5 py-1.5 text-foreground shadow-2xl">
                            <button
                                type="button"
                                onClick={() => setIsIrisMinimized(false)}
                                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-muted/60"
                                aria-label={t("Expand iRis Assistant")}
                            >
                                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
                                    <Image src="/logos/favicon.png" alt="" width={28} height={28} className="object-cover" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">{t("iRis Assistant")}</span>
                                    <span className="block truncate text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">{t("Online")}</span>
                                </span>
                            </button>
                            <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                                <button
                                    type="button"
                                    onClick={() => setIsIrisMinimized(false)}
                                    aria-label={t("Expand iRis Assistant")}
                                    className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <ChevronUp className="size-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsIrisOpen(false);
                                        setIsIrisMinimized(false);
                                    }}
                                    aria-label={t("Close iRis Assistant")}
                                    className="flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pointer-events-auto flex h-[460px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-2xl">
                            <IrisAssistantWorkspace
                                compact
                                onBroadcastSuccess={() => {
                                    void controller.refreshConversations();
                                }}
                                onMinimize={() => setIsIrisMinimized(true)}
                                onClose={() => {
                                    setIsIrisOpen(false);
                                    setIsIrisMinimized(false);
                                }}
                                className="flex-1"
                            />
                        </div>
                    )
                )}
            </MiniChatTray>

            <MiniChatSharedFilesPanel chat={controller.sharedFilesChat} files={controller.sharedFiles} onClose={closeSharedFiles} />
        </>
    );
}
