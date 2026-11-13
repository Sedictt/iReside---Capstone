"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MiniChatWindow } from "./MiniChatWindow";
import type { MiniChatController } from "./useMiniChat";
import { WINDOW_GAP_PX } from "./utils";

/**
 * CSS custom property published on <html> while expanded chat windows are docked.
 * Other floating UI (e.g. the Quick Tools FAB) reads it to stay clear of the dock:
 *   right: max(7rem, calc(var(--mini-chat-dock-extent, 0px) + 1rem))
 */
export const MINI_CHAT_DOCK_EXTENT_VAR = "--mini-chat-dock-extent";

/**
 * CSS custom property published on <html> when all docked chat windows are minimized,
 * holding the minimized bar height in px so floating UI can sit cleanly above them.
 */
export const MINI_CHAT_DOCK_BOTTOM_OFFSET_VAR = "--mini-chat-dock-bottom-offset";

const MINIMIZED_DOCK_MAX_HEIGHT_PX = 96;

interface MiniChatTrayProps {
    controller: MiniChatController;
    /** Distance from the viewport's right edge to the dock's right edge, in px. */
    rightOffset: number;
    /** Extra docked panels rendered after the chat windows (e.g. an assistant widget). */
    children?: ReactNode;
    className?: string;
}

export function MiniChatTray({ controller, rightOffset, children, className }: MiniChatTrayProps) {
    const trayRef = useRef<HTMLDivElement | null>(null);
    const {
        openChats,
        chatStateById,
        role,
        messagesHref,
        menuActionId,
        activateChat,
        closeChat,
        toggleMinimize,
        updateDraft,
        sendMessage,
        retryMessage,
        discardMessage,
        uploadFile,
        stageFiles,
        unstageFile,
        reloadMessages,
        clearError,
        setSharedFilesChatId,
        submitMenuAction,
    } = controller;

    // Publish the dock's horizontal extent so other fixed elements can avoid it.
    useEffect(() => {
        const node = trayRef.current;
        const root = document.documentElement;
        if (!node) return;

        const publish = () => {
            const rect = node.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0 || node.childElementCount === 0) {
                root.style.removeProperty(MINI_CHAT_DOCK_EXTENT_VAR);
                root.style.removeProperty(MINI_CHAT_DOCK_BOTTOM_OFFSET_VAR);
                return;
            }

            // When all docked windows are minimized, keep the FAB at its normal right edge
            // and lift it above the minimized header bars instead of pushing it sideways.
            if (rect.height <= MINIMIZED_DOCK_MAX_HEIGHT_PX) {
                root.style.removeProperty(MINI_CHAT_DOCK_EXTENT_VAR);
                root.style.setProperty(MINI_CHAT_DOCK_BOTTOM_OFFSET_VAR, `${Math.round(rect.height)}px`);
                return;
            }

            root.style.removeProperty(MINI_CHAT_DOCK_BOTTOM_OFFSET_VAR);
            root.style.setProperty(MINI_CHAT_DOCK_EXTENT_VAR, `${Math.round(rightOffset + rect.width)}px`);
        };

        publish();
        const observer = new ResizeObserver(publish);
        observer.observe(node);
        return () => {
            observer.disconnect();
            root.style.removeProperty(MINI_CHAT_DOCK_EXTENT_VAR);
            root.style.removeProperty(MINI_CHAT_DOCK_BOTTOM_OFFSET_VAR);
        };
    }, [rightOffset, openChats.length]);

    return (
        <div
            ref={trayRef}
            className={cn(
                "pointer-events-none fixed bottom-0 z-[55] hidden items-end md:flex",
                "transition-[right] duration-500 ease-in-out",
                className
            )}
            style={{
                right: rightOffset,
                gap: WINDOW_GAP_PX,
                bottom: "max(0px, env(safe-area-inset-bottom))",
            }}
        >
            <AnimatePresence initial={false}>
                {openChats.map((chat) => (
                    <MiniChatWindow
                        key={chat.id}
                        chat={chat}
                        state={chatStateById[chat.id]}
                        viewerRole={role}
                        messagesHref={messagesHref}
                        menuActionId={menuActionId}
                        onActivate={activateChat}
                        onClose={closeChat}
                        onToggleMinimize={toggleMinimize}
                        onDraftChange={updateDraft}
                        onSend={(id) => void sendMessage(id)}
                        onRetry={(id, messageId) => void retryMessage(id, messageId)}
                        onDiscard={discardMessage}
                        onAttach={(id, file) => void uploadFile(id, file)}
                        onStageFiles={stageFiles}
                        onUnstageFile={unstageFile}
                        onReload={(id) => void reloadMessages(id)}
                        onDismissError={clearError}
                        onOpenSharedFiles={setSharedFilesChatId}
                        onMenuAction={(chat, action) => void submitMenuAction(chat, action)}
                    />
                ))}
            </AnimatePresence>
            {children}
        </div>
    );
}
