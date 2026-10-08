"use client";

import { useCallback, useState } from "react";
import {
    MiniChatSharedFilesPanel,
    MiniChatSidebar,
    MiniChatTray,
    getTrayRightOffset,
    useMiniChat,
} from "@/components/messaging/mini-chat";

/**
 * Landlord messaging rail: a hover-expanding conversation list on the right edge
 * plus the docked mini chat windows anchored beside it.
 */
export function ContactsSidebar() {
    const controller = useMiniChat({ role: "landlord" });
    const { setSharedFilesChatId } = controller;
    const [isExpanded, setIsExpanded] = useState(false);
    const closeSharedFiles = useCallback(() => setSharedFilesChatId(null), [setSharedFilesChatId]);

    return (
        <>
            <MiniChatSidebar controller={controller} onExpandedChange={setIsExpanded} />
            <MiniChatTray controller={controller} rightOffset={getTrayRightOffset(isExpanded)} />
            <MiniChatSharedFilesPanel chat={controller.sharedFilesChat} files={controller.sharedFiles} onClose={closeSharedFiles} />
        </>
    );
}
