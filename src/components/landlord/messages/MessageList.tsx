"use client";

import { useRef, useEffect, useMemo } from "react";
import { UiMessage } from "./types";
import { MessageBubble } from "./MessageBubble";
import { MessageListSkeleton } from "./MessageListSkeleton";
import { cn } from "@/lib/utils";

interface MessageListProps {
    messages: UiMessage[];
    userId?: string;
    viewerRole?: "landlord" | "tenant";
    isMessagesLoading: boolean;
    onDownloadImage: (id: string, name: string) => void;
    onOpenF2F: (message: UiMessage) => void;
    onImageClick?: (images: { url: string; id: string }[], index: number) => void;
    isDownloading: boolean;
    updateShouldStickToBottom: () => void;
    messagesScrollRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onReportMessage?: (id: string) => void;
    onResolveIssue?: (message: UiMessage) => void;
}

export function MessageList({
    messages,
    userId,
    viewerRole = "landlord",
    isMessagesLoading,
    onDownloadImage,
    onOpenF2F,
    onImageClick,
    isDownloading,
    updateShouldStickToBottom,
    messagesScrollRef,
    messagesEndRef,
    onReportMessage,
    onResolveIssue
}: MessageListProps) {
    const groupedMessages = useMemo(() => {
        const result: UiMessage[] = [];
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (msg.messageType === 'image' && !msg.isRedacted && i + 2 < messages.length) {
                const album: UiMessage[] = [msg];
                let j = i + 1;
                while (j < messages.length) {
                    const next = messages[j];
                    const isSameSender = next.type === msg.type;
                    const isImage = next.messageType === 'image' && !next.isRedacted;
                    const timeDiff = Math.abs(new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime());
                    const isClose = timeDiff < 30000;
                    if (isSameSender && isImage && isClose) { album.push(next); j++; } else { break; }
                }
                if (album.length >= 3) {
                    result.push({ ...msg, id: `album-${msg.id}`, isAlbum: true, attachments: album, content: '', timestamp: album[album.length - 1].timestamp });
                    i = j - 1;
                    continue;
                }
            }
            result.push(msg);
        }
        return result;
    }, [messages]);

    return (
        <div
            ref={messagesScrollRef}
            onScroll={updateShouldStickToBottom}
            className="flex-1 overflow-y-auto custom-scrollbar-premium relative flex justify-center neumorphic-inset rounded-[2.5rem] mx-2 my-2"
        >
            <div className="w-full max-w-4xl p-6 pb-12">
                <div className="text-center py-8">
                    <span className="rounded-full neumorphic-inset-card px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-disabled">
                        Conversation History
                    </span>
                </div>

                {isMessagesLoading ? (
                    <MessageListSkeleton />
                ) : (
                    <div className="space-y-2">
                        {groupedMessages.map((msg, idx) => {
                            // Find if there is any landlord review (confirm or reject) for this same invoiceId that comes AFTER this message
                            const hasSubsequentReview = msg.invoiceId ? groupedMessages.slice(idx + 1).some(m => 
                                m.invoiceId === msg.invoiceId && 
                                m.systemType === "landlord_review"
                            ) : false;

                            return (
                                <MessageBubble
                                    key={msg.id || `msg-${msg.createdAt || idx}-${idx}`}
                                    message={msg}
                                    isMe={msg.type === viewerRole}
                                    viewerRole={viewerRole}
                                    onDownloadImage={onDownloadImage}
                                    onOpenF2F={onOpenF2F}
                                    onImageClick={onImageClick}
                                    isDownloading={isDownloading}
                                    onReportMessage={onReportMessage}
                                    isActionDisabled={hasSubsequentReview}
                                    onResolveIssue={onResolveIssue}
                                />
                            );
                        })}
                        <div ref={messagesEndRef} className="h-1" />
                    </div>
                )}
            </div>
        </div>
    );
}
