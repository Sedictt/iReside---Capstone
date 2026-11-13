"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ChevronLeft, ChevronRight, ExternalLink, MessageSquareDashed, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSafeAvatarBgColor } from "@/lib/constants";
import { MiniChatSkeleton } from "@/components/messaging/MiniChatSkeleton";
import { MiniChatBubble } from "./MiniChatBubble";
import { MiniChatSystemMessage } from "./MiniChatSystemMessage";
import type { MiniChatContact, MiniChatMessage, MiniChatRole } from "./types";
import { formatDayLabel, formatFullTimestamp, formatTime, isImageMessage, shouldGroupWithPrevious, startsNewDay } from "./utils";
import { useLanguageContext } from "@/context/LanguageContext";

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
    | { kind: "message"; key: string; message: MiniChatMessage; isFirstInGroup: boolean; isLastInGroup: boolean }
    | { kind: "image_group"; key: string; messages: MiniChatMessage[]; isFirstInGroup: boolean; isLastInGroup: boolean };

type LightboxState = {
    items: { url: string; name: string }[];
    index: number;
};

function MiniChatImageGrid({
    messages,
    contact,
    isFirstInGroup,
    isLastInGroup,
    onOpenLightbox,
}: {
    messages: MiniChatMessage[];
    contact: MiniChatContact;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    onOpenLightbox: (items: { url: string; name: string }[], index: number) => void;
}) {
    const { t } = useLanguageContext();
    const first = messages[0];
    const last = messages[messages.length - 1];
    const isOwn = first.isOwn;
    const visible = messages.slice(0, 4);
    const overflow = messages.length - 4;
    const items = messages
        .filter((m) => Boolean(m.fileUrl))
        .map((m) => ({ url: m.fileUrl!, name: m.fileName || t("Shared image") }));

    return (
        <div
            className={cn(
                "group/message flex w-full flex-col",
                isOwn ? "items-end" : "items-start",
                isFirstInGroup ? "mt-2" : "mt-0.5"
            )}
        >
            <div className={cn("flex max-w-[84%] items-end gap-1.5", isOwn ? "justify-end" : "justify-start")}>
                {!isOwn && (
                    <div className="w-6 shrink-0">
                        {isLastInGroup && (
                            <div
                                className="size-6 overflow-hidden rounded-full border border-border/60"
                                style={{ backgroundColor: getSafeAvatarBgColor(contact.avatarBgColor) }}
                            >
                                <Image src={contact.avatar} alt="" width={24} height={24} className="size-full object-cover" />
                            </div>
                        )}
                    </div>
                )}

                <div
                    title={formatFullTimestamp(last.createdAt)}
                    className={cn(
                        "grid gap-1 overflow-hidden rounded-2xl border border-border/70 bg-muted/60 p-1 shadow-xs",
                        visible.length === 2 ? "w-[208px] grid-cols-2" : "w-[208px] grid-cols-2"
                    )}
                >
                    {visible.map((msg, idx) => {
                        const isLastTileWithOverflow = idx === 3 && overflow > 0;
                        const isThreeOddFirst = visible.length === 3 && idx === 0;
                        return (
                            <button
                                key={msg.id}
                                type="button"
                                onClick={() => onOpenLightbox(items, idx)}
                                aria-label={t("Preview image {index} of {total}", { index: idx + 1, total: items.length })}
                                className={cn(
                                    "relative overflow-hidden rounded-xl bg-black/5 transition-transform hover:brightness-95 dark:bg-white/5",
                                    isThreeOddFirst ? "col-span-2 h-24" : "h-[88px]"
                                )}
                            >
                                {msg.fileUrl && (
                                    <Image
                                        src={msg.fileUrl}
                                        alt={msg.fileName ?? t("Shared image")}
                                        fill
                                        sizes="110px"
                                        unoptimized={msg.fileUrl.startsWith("blob:")}
                                        className="object-cover"
                                    />
                                )}
                                {msg.status === "sending" && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                                        <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    </div>
                                )}
                                {isLastTileWithOverflow && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                                        +{overflow}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {isLastInGroup && (
                <div className={cn("mt-0.5 flex items-center gap-1 px-1 text-[10px] text-muted-foreground", isOwn ? "flex-row-reverse" : "ml-7")}>
                    <time dateTime={last.createdAt}>{formatTime(last.createdAt)}</time>
                </div>
            )}
        </div>
    );
}

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
    const { t } = useLanguageContext();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const isNearBottomRef = useRef(true);
    const previousCountRef = useRef(0);
    const previousLastIdRef = useRef<string | null>(null);
    const [unseenCount, setUnseenCount] = useState(0);
    const [announcement, setAnnouncement] = useState("");
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);

    const rows = useMemo<Row[]>(() => {
        const result: Row[] = [];
        let i = 0;
        while (i < messages.length) {
            const message = messages[i];
            const previous = messages[i - 1];
            if (startsNewDay(previous, message)) {
                result.push({ kind: "day", key: `day-${message.createdAt}-${message.id}`, label: formatDayLabel(message.createdAt) });
            }

            if (isImageMessage(message) && message.fileUrl) {
                const group: MiniChatMessage[] = [message];
                let j = i + 1;
                while (
                    j < messages.length &&
                    isImageMessage(messages[j]) &&
                    messages[j].fileUrl &&
                    !startsNewDay(messages[j - 1], messages[j]) &&
                    shouldGroupWithPrevious(messages[j - 1], messages[j])
                ) {
                    group.push(messages[j]);
                    j += 1;
                }

                if (group.length >= 2) {
                    const nextAfterGroup = messages[j];
                    const isFirstInGroup = !shouldGroupWithPrevious(previous, group[0]);
                    const isLastInGroup = !nextAfterGroup || !shouldGroupWithPrevious(group[group.length - 1], nextAfterGroup);
                    result.push({
                        kind: "image_group",
                        key: `img-group-${group[0].id}`,
                        messages: group,
                        isFirstInGroup,
                        isLastInGroup,
                    });
                    i = j;
                    continue;
                }
            }

            const next = messages[i + 1];
            result.push({
                kind: "message",
                key: message.id,
                message,
                isFirstInGroup: !shouldGroupWithPrevious(previous, message),
                isLastInGroup: !next || !shouldGroupWithPrevious(message, next),
            });
            i += 1;
        }
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
            setAnnouncement(t("New message from {name}: {content}", { name: contact.name, content: last.fileUrl ? t("attachment") : (last.redactedContent ?? last.content) }));
        }

        previousCountRef.current = count;
        previousLastIdRef.current = lastId;
    }, [contact.name, messages, scrollToBottom, t]);

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
                className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-2.5 pb-2 pt-2.5"
                role="log"
                aria-label={t("Messages with {name}", { name: contact.name })}
                aria-busy={isLoading}
            >
                {isLoading && <MiniChatSkeleton />}

                {showEmpty && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-8 text-center">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageSquareDashed className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[13px] font-semibold text-foreground">{t("Say hello to {name}", { name: contact.name.split(" ")[0] })}</p>
                        <p className="text-[11px] text-muted-foreground">{t("Messages you send here also appear on the full messaging page.")}</p>
                    </div>
                )}

                {!isLoading && rows.map((row) => {
                    if (row.kind === "day") {
                        return (
                            <div key={row.key} className="my-2 flex items-center gap-2 first:mt-0" role="separator" aria-label={row.label}>
                                <span className="h-px flex-1 bg-border/60" />
                                <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {row.label}
                                </span>
                                <span className="h-px flex-1 bg-border/60" />
                            </div>
                        );
                    }

                    if (row.kind === "image_group") {
                        return (
                            <MiniChatImageGrid
                                key={row.key}
                                messages={row.messages}
                                contact={contact}
                                isFirstInGroup={row.isFirstInGroup}
                                isLastInGroup={row.isLastInGroup}
                                onOpenLightbox={(items, index) => setLightbox({ items, index })}
                            />
                        );
                    }

                    if (row.message.messageType === "system") {
                        return (
                            <div key={row.key} className="my-2 flex w-full justify-center px-1">
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
                            onPreviewImage={(url, name) =>
                                setLightbox({ items: [{ url, name: name || t("Shared image") }], index: 0 })
                            }
                        />
                    );
                })}

                {isOtherUserTyping && (
                    <div className="mt-1.5 flex items-end gap-1.5 animate-in fade-in slide-in-from-left-1 duration-200" aria-label={t("{name} is typing", { name: contact.name })}>
                        <span className="w-6 shrink-0" />
                        <div className="rounded-2xl rounded-bl-sm border border-zinc-200/80 bg-zinc-100/95 px-3 py-2 dark:border-zinc-700/70 dark:bg-zinc-800/90">
                            <div className="flex items-center gap-1">
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-600 dark:text-red-400" role="alert">
                        <span className="min-w-0 truncate" title={error}>{error}</span>
                        <span className="flex shrink-0 items-center gap-1">
                            <button
                                type="button"
                                onClick={onReload}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold hover:bg-red-500/15"
                            >
                                <RefreshCw className="size-3" aria-hidden="true" /> {t("Retry")}
                            </button>
                            <button
                                type="button"
                                onClick={onDismissError}
                                className="rounded-md px-1.5 py-0.5 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                                {t("Dismiss")}
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
                    {unseenCount === 1 ? t("{count} new message", { count: unseenCount }) : t("{count} new messages", { count: unseenCount })}
                </button>
            )}

            {lightbox && lightbox.items[lightbox.index] && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("Image preview")}
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex w-full items-center justify-between gap-4 text-white">
                            <span className="truncate text-xs font-medium text-white/80">
                                {lightbox.items[lightbox.index].name}
                                {lightbox.items.length > 1 && ` (${lightbox.index + 1}/${lightbox.items.length})`}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <a
                                    href={lightbox.items[lightbox.index].url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
                                >
                                    <ExternalLink className="size-3.5" aria-hidden="true" />
                                    {t("Open")}
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setLightbox(null)}
                                    aria-label={t("Close preview")}
                                    className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-center">
                            {lightbox.items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setLightbox((prev) => prev ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length } : null)}
                                    aria-label={t("Previous image")}
                                    className="mr-2 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                                >
                                    <ChevronLeft className="size-5" aria-hidden="true" />
                                </button>
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={lightbox.items[lightbox.index].url}
                                alt={lightbox.items[lightbox.index].name}
                                className="max-h-[80vh] max-w-[82vw] rounded-xl object-contain shadow-2xl"
                            />
                            {lightbox.items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setLightbox((prev) => prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null)}
                                    aria-label={t("Next image")}
                                    className="ml-2 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                                >
                                    <ChevronRight className="size-5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
        </div>
    );
}
