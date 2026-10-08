"use client";

import Image from "next/image";
import { AlertCircle, Check, CheckCheck, Clock3, FileText, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageMarkdown } from "@/components/ui/ChatMessageMarkdown";
import { getSafeAvatarBgColor } from "@/lib/constants";
import type { MiniChatContact, MiniChatMessage, MiniChatOutboundStatus } from "./types";
import { formatFullTimestamp, formatTime, isImageMessage } from "./utils";

interface MiniChatBubbleProps {
    message: MiniChatMessage;
    contact: MiniChatContact;
    isFirstInGroup: boolean;
    isLastInGroup: boolean;
    onRetry?: (messageId: string) => void;
    onDiscard?: (messageId: string) => void;
}

function StatusIcon({ status }: { status: MiniChatOutboundStatus | undefined }) {
    switch (status) {
        case "sending":
            return <Clock3 className="size-3 text-muted-foreground" aria-label="Sending" />;
        case "seen":
            return <CheckCheck className="size-3 text-emerald-500" aria-label="Seen" />;
        case "delivered":
            return <CheckCheck className="size-3 text-muted-foreground" aria-label="Delivered" />;
        case "failed":
            return <AlertCircle className="size-3 text-red-500" aria-label="Not sent" />;
        default:
            return <Check className="size-3 text-muted-foreground" aria-label="Sent" />;
    }
}

export function MiniChatBubble({ message, contact, isFirstInGroup, isLastInGroup, onRetry, onDiscard }: MiniChatBubbleProps) {
    const isOwn = message.isOwn;
    const hasImage = isImageMessage(message);
    const hasFile = Boolean(message.fileUrl) && !hasImage;
    const isFailed = message.status === "failed";
    const isSending = message.status === "sending";
    const showMeta = isLastInGroup || isFailed;
    const fullTimestamp = formatFullTimestamp(message.createdAt);

    return (
        <div
            className={cn(
                "group/message flex w-full flex-col",
                isOwn ? "items-end" : "items-start",
                isFirstInGroup ? "mt-2" : "mt-0.5"
            )}
            data-message-id={message.id}
        >
            <div className={cn("flex max-w-[88%] items-end gap-2", isOwn ? "justify-end" : "justify-start")}>
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
                    title={fullTimestamp}
                    className={cn(
                        "relative text-sm leading-relaxed transition-opacity",
                        isSending && "opacity-70",
                        hasImage
                            ? "overflow-hidden rounded-2xl border border-border/80 bg-muted p-0.5 shadow-xs"
                            : hasFile
                                ? ""
                                : cn(
                                    "break-words px-3.5 py-2 [overflow-wrap:anywhere]",
                                    isOwn
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/15"
                                        : "border border-zinc-200/90 bg-zinc-100/95 text-foreground shadow-xs dark:border-zinc-700/80 dark:bg-zinc-800/90",
                                    // Group-aware corner radii so consecutive bubbles read as one thread.
                                    "rounded-2xl",
                                    isOwn
                                        ? cn(!isFirstInGroup && "rounded-tr-md", !isLastInGroup && "rounded-br-md", isLastInGroup && "rounded-br-sm")
                                        : cn(!isFirstInGroup && "rounded-tl-md", !isLastInGroup && "rounded-bl-md", isLastInGroup && "rounded-bl-sm")
                                ),
                        isFailed && "ring-1 ring-red-500/60"
                    )}
                >
                    {hasImage && message.fileUrl && (
                        <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="relative block overflow-hidden rounded-[14px] bg-black/5 dark:bg-white/5"
                            aria-label="Open image in a new tab"
                        >
                            <Image
                                src={message.fileUrl}
                                alt={message.fileName ?? "Shared image"}
                                width={320}
                                height={240}
                                unoptimized={message.fileUrl.startsWith("blob:")}
                                className="h-auto max-h-[200px] w-auto max-w-full object-cover"
                            />
                            {isSending && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                                        <div className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Sending
                                    </div>
                                </div>
                            )}
                        </a>
                    )}

                    {hasFile && message.fileUrl && (
                        <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                                "flex max-w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition-colors",
                                isOwn
                                    ? "border-primary/40 bg-primary/15 text-foreground hover:bg-primary/25"
                                    : "border-border bg-card text-foreground hover:bg-muted"
                            )}
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                <FileText className="size-4" />
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold">{message.fileName || message.content || "Attachment"}</span>
                                <span className="block text-[10px] text-muted-foreground">Open attachment</span>
                            </span>
                        </a>
                    )}

                    {!message.fileUrl && (
                        message.isRedacted ? (
                            <p className="flex items-start gap-1.5 whitespace-pre-wrap" title="Sensitive content was hidden">
                                <ShieldAlert className="mt-0.5 size-3.5 shrink-0 opacity-70" aria-hidden="true" />
                                <span>{message.redactedContent || "••••••••"}</span>
                            </p>
                        ) : (
                            <ChatMessageMarkdown content={message.content} isUser={isOwn} className="text-sm" />
                        )
                    )}
                </div>
            </div>

            {showMeta && (
                <div className={cn("mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground", isOwn ? "flex-row-reverse" : "ml-8")}>
                        {isFailed ? (
                            <span className="flex items-center gap-1.5 text-red-500">
                                <StatusIcon status="failed" />
                                <span className="font-semibold">Not sent</span>
                                <button
                                    type="button"
                                    onClick={() => onRetry?.(message.id)}
                                    className="inline-flex items-center gap-0.5 rounded px-1 font-semibold text-foreground hover:bg-muted"
                                >
                                    <RotateCcw className="size-3" aria-hidden="true" /> Retry
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDiscard?.(message.id)}
                                    className="inline-flex items-center gap-0.5 rounded px-1 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <Trash2 className="size-3" aria-hidden="true" /> Delete
                                </button>
                            </span>
                        ) : (
                            <>
                                {isOwn && <StatusIcon status={message.status} />}
                                <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                            </>
                        )}
                    </div>
                )}
        </div>
    );
}
