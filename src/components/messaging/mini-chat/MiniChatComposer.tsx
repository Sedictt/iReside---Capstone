"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { ATTACHMENT_MAX_BYTES, DRAFT_MAX_LENGTH } from "./utils";

const MAX_ROWS = 4;
const COUNTER_THRESHOLD = DRAFT_MAX_LENGTH - 80;

interface MiniChatComposerProps {
    draft: string;
    isSending: boolean;
    isUploading: boolean;
    uploadProgress: number;
    disabled?: boolean;
    autoFocus?: boolean;
    contactName: string;
    onChange: (draft: string) => void;
    onSend: () => void;
    onAttach: (file: File) => void;
    onFocus?: () => void;
}

export function MiniChatComposer({
    draft,
    isSending,
    isUploading,
    uploadProgress,
    disabled = false,
    autoFocus = false,
    contactName,
    onChange,
    onSend,
    onAttach,
    onFocus,
}: MiniChatComposerProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputId = useId();
    const canSend = draft.trim().length > 0 && !isSending && !disabled;
    const showCounter = draft.length >= COUNTER_THRESHOLD;

    const resize = useCallback(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.style.height = "0px";
        const lineHeight = parseFloat(getComputedStyle(node).lineHeight) || 20;
        const maxHeight = lineHeight * MAX_ROWS + 16;
        node.style.height = `${Math.min(node.scrollHeight, maxHeight)}px`;
        node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    useEffect(() => {
        resize();
    }, [draft, resize]);

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend();
        }
    };

    return (
        <div className="relative shrink-0 border-t border-border/80 bg-card px-2.5 pb-2.5 pt-2">
            {isUploading && (
                <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} aria-label="Uploading attachment">
                    <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(8, uploadProgress)}%` }} />
                </div>
            )}

            <div className="flex items-end gap-1.5">
                <Tooltip content={isUploading ? "Uploading…" : "Attach a file"} side="top">
                    <label
                        htmlFor={fileInputId}
                        className={cn(
                            "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors",
                            "hover:bg-muted hover:text-foreground focus-within:ring-2 focus-within:ring-primary/40",
                            (disabled || isUploading) && "pointer-events-none opacity-40"
                        )}
                    >
                        <Paperclip className="size-4" aria-hidden="true" />
                        <span className="sr-only">Attach a file</span>
                        <input
                            id={fileInputId}
                            type="file"
                            className="sr-only"
                            disabled={disabled || isUploading}
                            accept={MEDIA_ACCEPT_STRINGS.chat_attachment}
                            onChange={(event) => {
                                const file = handleMediaSelection(event, {
                                    preset: "chat_attachment",
                                    maxSizeBytes: ATTACHMENT_MAX_BYTES,
                                    notify: (message, description) => toast.error(message, { description }),
                                });
                                if (file) onAttach(file);
                                event.currentTarget.value = "";
                            }}
                        />
                    </label>
                </Tooltip>

                <div
                    className={cn(
                        "flex min-w-0 flex-1 items-end rounded-2xl border border-border bg-background/80 px-3 py-1.5 transition-all",
                        "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20",
                        disabled && "opacity-60"
                    )}
                >
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={draft}
                        maxLength={DRAFT_MAX_LENGTH}
                        disabled={disabled}
                        placeholder={`Message ${contactName.split(" ")[0]}…`}
                        aria-label={`Message ${contactName}`}
                        onChange={(event) => onChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={onFocus}
                        className="max-h-[96px] w-full resize-none border-none bg-transparent py-1 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
                    />
                </div>

                <Tooltip content={canSend ? "Send (Enter)" : "Type a message to send"} side="top">
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={!canSend}
                        aria-label="Send message"
                        className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full transition-all",
                            canSend
                                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:scale-105 active:scale-95"
                                : "bg-muted text-muted-foreground/60"
                        )}
                    >
                        <SendHorizontal className="size-4" aria-hidden="true" />
                    </button>
                </Tooltip>
            </div>

            {showCounter && (
                <p className={cn("mt-1 pr-11 text-right text-[10px] tabular-nums", draft.length >= DRAFT_MAX_LENGTH ? "text-red-500" : "text-muted-foreground")} aria-live="polite">
                    {draft.length}/{DRAFT_MAX_LENGTH}
                </p>
            )}
        </div>
    );
}
