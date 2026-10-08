"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, MessageSquareDashed, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MiniChatSkeleton } from "@/components/messaging/MiniChatSkeleton";
import { MiniChatBubble } from "./MiniChatBubble";
import { MiniChatSystemMessage } from "./MiniChatSystemMessage";
import type { MiniChatContact, MiniChatMessage, MiniChatRole } from "./types";
import { formatDayLabel, shouldGroupWithPrevious, startsNewDay } from "./utils";

const NEAR_BOTTOM_PX = 56;

interface MiniChatMessageListProps {
    contact: MiniChatContact;
    messages: MiniChatMessage[];
    isLoading: boolean;
    isOtherUserTyping: boolean;
    error: string | null;
    viewerRole: MiniChatRole;
    onRetry: (messageId: string) => void;
    onDiscard: (messageId: string) => void;
    onReload: () => void;
    onDismissError: () => void;
}

type Row =
    | { kind: "day"; key: string; label: string }
    | { kind: "message"; key: string; message: MiniChatMessage; isFirstInGroup: boolean; isLastInGroup: boolean };

export function MiniChatMessageList({
    contact,
    messages,
    isLoading,
    isOtherUserTyping,
    error,
    viewerRole,
    onRetry,
    onDiscard,
    onReload,
    onDismissError,
}: MiniChatMessageListProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isNearBottomRef = useRef(true);
    const previousCountRef = useRef(0);
    const previousLastIdRef = useRef<string | null>(null);
    const [unseenCount, setUnseenCount] = useState(0);
    const [announcement, setAnnouncement] = useState("");

    const rows = useMemo<Row[]>(() => {
        const result: Row[] = [];
        messages.forEach((message, index) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            if (startsNewDay(previous, message)) {
                result.push({ kind: "day", key: `day-${message.createdAt}-${message.id}`, label: formatDayLabel(message.createdAt) });
            }
            result.push({
                kind: "message",
                key: message.id,
                message,
                isFirstInGroup: !shouldGroupWithPrevious(previous, message),
                isLastInGroup: !next || !shouldGroupWithPrevious(message, next),
            });
        });
        return result;
    }, [messages]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
        isNearBottomRef.current = true;
        setUnseenCount(0);
    }, []);

    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
        const nearBottom = distance <= NEAR_BOTTOM_PX;
        isNearBottomRef.current = nearBottom;
        if (nearBottom) setUnseenCount(0);
    }, []);

    // Keep the viewport anchored to the newest message unless the reader scrolled up.
    useLayoutEffect(() => {
        const count = messages.length;
        const last = messages[count - 1];
        const lastId = last?.id ?? null;
        const previousCount = previousCountRef.current;
        const isInitial = previousCount === 0 && count > 0;
        const appended = count > previousCount && lastId !== previousLastIdRef.current;

        if (isInitial) {
            scrollToBottom("auto");
        } else if (appended) {
            if (isNearBottomRef.current || last?.isOwn) {
                scrollToBottom("smooth");
            } else {
                setUnseenCount((value) => value + (count - previousCount));
            }
        }

        if (appended && last && !last.isOwn && last.messageType !== "system") {
            setAnnouncement(`New message from ${contact.name}: ${last.fileUrl ? "attachment" : (last.redactedContent ?? last.content)}`);
        }

        previousCountRef.current = count;
        previousLastIdRef.current = lastId;
    }, [contact.name, messages, scrollToBottom]);

    useEffect(() => {
        if (isOtherUserTyping && isNearBottomRef.current) {
            scrollToBottom("smooth");
        }
    }, [isOtherUserTyping, scrollToBottom]);

    const showEmpty = !isLoading && messages.length === 0 && !error;

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-2 pt-3"
                role="log"
                aria-label={`Messages with ${contact.name}`}
                aria-busy={isLoading}
            >
                {isLoading && <MiniChatSkeleton />}

                {showEmpty && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageSquareDashed className="size-5" aria-hidden="true" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">Say hello to {contact.name.split(" ")[0]}</p>
                        <p className="text-xs text-muted-foreground">Messages you send here also appear on the full messaging page.</p>
                    </div>
                )}

                {!isLoading && rows.map((row) => {
                    if (row.kind === "day") {
                        return (
                            <div key={row.key} className="my-3 flex items-center gap-2 first:mt-0" role="separator" aria-label={row.label}>
                                <span className="h-px flex-1 bg-border/70" />
                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {row.label}
                                </span>
                                <span className="h-px flex-1 bg-border/70" />
                            </div>
                        );
                    }

                    if (row.message.messageType === "system") {
                        return (
                            <div key={row.key} className="my-3 flex w-full justify-center px-1">
                                <MiniChatSystemMessage message={row.message} viewerRole={viewerRole} />
                            </div>
                        );
                    }

                    return (
                        <MiniChatBubble
                            key={row.key}
                            message={row.message}
                            contact={contact}
                            isFirstInGroup={row.isFirstInGroup}
                            isLastInGroup={row.isLastInGroup}
                            onRetry={onRetry}
                            onDiscard={onDiscard}
                        />
                    );
                })}

                {isOtherUserTyping && (
                    <div className="mt-2 flex items-end gap-2 animate-in fade-in slide-in-from-left-1 duration-200" aria-label={`${contact.name} is typing`}>
                        <span className="w-6 shrink-0" />
                        <div className="rounded-2xl rounded-bl-sm border border-zinc-200/90 bg-zinc-100/95 px-3 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-800/90">
                            <div className="flex items-center gap-1">
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400" role="alert">
                        <span className="min-w-0 truncate" title={error}>{error}</span>
                        <span className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={onReload}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold hover:bg-red-500/15"
                            >
                                <RefreshCw className="size-3" aria-hidden="true" /> Retry
                            </button>
                            <button
                                type="button"
                                onClick={onDismissError}
                                className="rounded-md px-1.5 py-0.5 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                Dismiss
                            </button>
                        </span>
                    </div>
                )}
            </div>

            {unseenCount > 0 && (
                <button
                    type="button"
                    onClick={() => scrollToBottom("smooth")}
                    className={cn(
                        "absolute bottom-2 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/40 bg-card px-3 py-1 text-[11px] font-semibold text-foreground shadow-md",
                        "animate-in fade-in slide-in-from-bottom-2 duration-200 hover:bg-muted"
                    )}
                >
                    <ArrowDown className="size-3 text-primary" aria-hidden="true" />
                    {unseenCount} new {unseenCount === 1 ? "message" : "messages"}
                </button>
            )}

            <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
        </div>
    );
}
