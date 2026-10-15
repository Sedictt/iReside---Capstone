"use client";

import { useCallback, useEffect, useState } from "react";
import {
    MiniChatSharedFilesPanel,
    MiniChatSidebar,
    MiniChatTray,
    getTrayRightOffset,
    useMiniChat,
} from "@/components/messaging/mini-chat";

/** CSS custom property on <html> holding the messaging rail's current width (+ gap), in px. */
export const MINI_CHAT_SIDEBAR_EXTENT_VAR = "--mini-chat-sidebar-extent";

/**
 * Landlord messaging rail: a hover-expanding conversation list on the right edge
 * plus the docked mini chat windows anchored beside it.
 */
export function ContactsSidebar() {
    const controller = useMiniChat({ role: "landlord" });
    const { setSharedFilesChatId } = controller;
    const [isExpanded, setIsExpanded] = useState(false);
    const closeSharedFiles = useCallback(() => setSharedFilesChatId(null), [setSharedFilesChatId]);

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
            <MiniChatSidebar controller={controller} onExpandedChange={setIsExpanded} />
            <MiniChatTray controller={controller} rightOffset={getTrayRightOffset(isExpanded)} />
            <MiniChatSharedFilesPanel chat={controller.sharedFilesChat} files={controller.sharedFiles} onClose={closeSharedFiles} />
        </>
    );
}
