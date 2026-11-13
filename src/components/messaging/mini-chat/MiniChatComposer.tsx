"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FileText, ImagePlus, Paperclip, Plus, SendHorizontal, Smile, X } from "lucide-react";
import { useTheme } from "next-themes";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { MEDIA_ACCEPT_STRINGS, validateMediaFile } from "@/lib/validation";
import type { StagedAttachment } from "./types";
import { ATTACHMENT_MAX_BYTES, DRAFT_MAX_LENGTH } from "./utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { tr } from "@/hooks/useLanguage";

const MAX_ROWS = 4;
const COUNTER_THRESHOLD = DRAFT_MAX_LENGTH - 80;

interface MiniChatComposerProps {
    draft: string;
    stagedAttachments?: StagedAttachment[];
    isSending: boolean;
    isUploading: boolean;
    uploadProgress: number;
    disabled?: boolean;
    autoFocus?: boolean;
    contactName: string;
    onChange: (draft: string) => void;
    onSend: () => void;
    onStageFiles?: (files: File[]) => void;
    onUnstageFile?: (attachmentId: string) => void;
    onAttach?: (file: File) => void;
    onFocus?: () => void;
}

export function MiniChatComposer({
    draft,
    stagedAttachments = [],
    isSending,
    isUploading,
    uploadProgress,
    disabled = false,
    autoFocus = false,
    contactName,
    onChange,
    onSend,
    onStageFiles,
    onUnstageFile,
    onAttach,
    onFocus,
}: MiniChatComposerProps) {
    const { t } = useLanguageContext();
    const { resolvedTheme } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement | null>(null);
    const photoInputId = useId();
    const fileInputId = useId();
    const [showToolsWhileTyping, setShowToolsWhileTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const hasStaged = stagedAttachments.length > 0;
    const isComposing = draft.trim().length > 0 || hasStaged;
    const canSend = isComposing && !isSending && !isUploading && !disabled;
    const showExpandedTools = !isComposing || showToolsWhileTyping;
    const showCounter = draft.length >= COUNTER_THRESHOLD;

    const resize = useCallback(() => {
        const node = textareaRef.current;
        if (!node) return;
        node.style.height = "0px";
        const lineHeight = parseFloat(getComputedStyle(node).lineHeight) || 18;
        const maxHeight = lineHeight * MAX_ROWS + 12;
        node.style.height = `${Math.min(node.scrollHeight, maxHeight)}px`;
        node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    useEffect(() => {
        resize();
    }, [draft, resize]);

    useEffect(() => {
        if (!isComposing) {
            setShowToolsWhileTyping(false);
        }
    }, [isComposing]);

    useEffect(() => {
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [autoFocus]);

    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    const handleEmojiSelect = useCallback((emoji: { native?: string }) => {
        if (!emoji?.native) return;
        const next = `${draft}${emoji.native}`.slice(0, DRAFT_MAX_LENGTH);
        onChange(next);
        textareaRef.current?.focus();
    }, [draft, onChange]);

    const handleFilesSelected = useCallback((fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        if (files.length === 0) return;

        const validFiles: File[] = [];
        for (const file of files) {
            const result = validateMediaFile(file, {
                preset: "chat_attachment",
                maxSizeBytes: ATTACHMENT_MAX_BYTES,
            });
            if (!result.isValid) {
                toast.error(tr(result.error || "Invalid file"));
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;
        if (onStageFiles) {
            onStageFiles(validFiles);
        } else if (onAttach) {
            onAttach(validFiles[0]);
        }
    }, [onAttach, onStageFiles]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) onSend();
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData?.files;
        if (items && items.length > 0) {
            event.preventDefault();
            handleFilesSelected(items);
        }
    };

    return (
        <div className="relative shrink-0 border-t border-border/70 bg-card px-2 pb-2 pt-1.5">
            {isUploading && (
                <div
                    className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/15"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                    aria-label={t("Uploading attachment")}
                >
                    <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${Math.max(8, uploadProgress)}%` }} />
                </div>
            )}

            {hasStaged && (
                <div className="mb-1.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                    {stagedAttachments.map((item) => (
                        <div
                            key={item.id}
                            className="group relative shrink-0"
                        >
                            {item.isImage && item.previewUrl ? (
                                <div className="relative size-12 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.previewUrl}
                                        alt={item.file.name}
                                        className="size-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="flex h-10 max-w-[140px] items-center gap-1.5 rounded-xl border border-border/80 bg-muted/70 px-2 text-[11px] text-foreground">
                                    <FileText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                                    <span className="truncate font-medium">{item.file.name}</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => onUnstageFile?.(item.id)}
                                aria-label={t("Remove {name}", { name: item.file.name })}
                                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-transform hover:scale-110 hover:bg-destructive hover:text-destructive-foreground"
                            >
                                <X className="size-2.5" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-1">
                {!showExpandedTools ? (
                    <Tooltip content={t("More actions")} side="top">
                        <button
                            type="button"
                            onClick={() => setShowToolsWhileTyping(true)}
                            disabled={disabled || isUploading}
                            aria-label={t("Show attachment options")}
                            className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full text-primary transition-all",
                                "hover:bg-muted active:scale-95",
                                (disabled || isUploading) && "pointer-events-none opacity-40"
                            )}
                        >
                            <Plus className="size-4" aria-hidden="true" />
                        </button>
                    </Tooltip>
                ) : (
                    <div className="flex shrink-0 items-center gap-0.5">
                        <Tooltip content={isUploading ? t("Uploading…") : t("Attach photos")} side="top">
                            <label
                                htmlFor={photoInputId}
                                className={cn(
                                    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors",
                                    "hover:bg-muted focus-within:ring-2 focus-within:ring-primary/40",
                                    (disabled || isUploading) && "pointer-events-none opacity-40"
                                )}
                            >
                                <ImagePlus className="size-4" aria-hidden="true" />
                                <span className="sr-only">{t("Attach photos")}</span>
                                <input
                                    id={photoInputId}
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    disabled={disabled || isUploading}
                                    accept={MEDIA_ACCEPT_STRINGS.image}
                                    onChange={(event) => {
                                        if (event.currentTarget.files) {
                                            handleFilesSelected(event.currentTarget.files);
                                        }
                                        event.currentTarget.value = "";
                                        setShowToolsWhileTyping(false);
                                    }}
                                />
                            </label>
                        </Tooltip>

                        <Tooltip content={isUploading ? t("Uploading…") : t("Attach files")} side="top">
                            <label
                                htmlFor={fileInputId}
                                className={cn(
                                    "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors",
                                    "hover:bg-muted hover:text-foreground focus-within:ring-2 focus-within:ring-primary/40",
                                    (disabled || isUploading) && "pointer-events-none opacity-40"
                                )}
                            >
                                <Paperclip className="size-4" aria-hidden="true" />
                                <span className="sr-only">{t("Attach files")}</span>
                                <input
                                    id={fileInputId}
                                    type="file"
                                    multiple
                                    className="sr-only"
                                    disabled={disabled || isUploading}
                                    accept={MEDIA_ACCEPT_STRINGS.chat_attachment}
                                    onChange={(event) => {
                                        if (event.currentTarget.files) {
                                            handleFilesSelected(event.currentTarget.files);
                                        }
                                        event.currentTarget.value = "";
                                        setShowToolsWhileTyping(false);
                                    }}
                                />
                            </label>
                        </Tooltip>
                    </div>
                )}

                <div
                    className={cn(
                        "relative flex min-w-0 flex-1 items-center gap-1 rounded-full border border-border/70 bg-muted/50 py-1 pl-3 pr-1.5 transition-all duration-200",
                        "focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/15",
                        hasStaged && "rounded-2xl",
                        disabled && "opacity-60"
                    )}
                >
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={draft}
                        maxLength={DRAFT_MAX_LENGTH}
                        disabled={disabled}
                        placeholder={hasStaged ? t("Add a caption…") : t("Aa")}
                        aria-label={t("Message {name}", { name: contactName })}
                        onChange={(event) => {
                            if (showToolsWhileTyping) setShowToolsWhileTyping(false);
                            onChange(event.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onFocus={onFocus}
                        className="max-h-[84px] w-full resize-none border-none bg-transparent py-0.5 text-[13px] leading-[18px] text-foreground outline-none placeholder:text-muted-foreground"
                    />

                    <div ref={emojiPickerRef} className="relative shrink-0">
                        <Tooltip content={t("Add emoji")} side="top">
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                aria-label={t("Add emoji")}
                                aria-expanded={showEmojiPicker}
                                className={cn(
                                    "flex size-6 items-center justify-center rounded-full transition-colors",
                                    showEmojiPicker
                                        ? "bg-primary/15 text-primary"
                                        : "text-primary/80 hover:bg-muted hover:text-primary",
                                    disabled && "pointer-events-none opacity-40"
                                )}
                            >
                                <Smile className="size-4" aria-hidden="true" />
                            </button>
                        </Tooltip>

                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 z-[100] mb-2 overflow-hidden rounded-2xl border border-border shadow-2xl">
                                <Picker
                                    data={data}
                                    onEmojiSelect={handleEmojiSelect}
                                    theme={resolvedTheme === "dark" ? "dark" : "light"}
                                    set="native"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                    navPosition="bottom"
                                    perLine={7}
                                    maxFrequentRows={1}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Tooltip content={canSend ? t("Send (Enter)") : t("Type a message to send")} side="top">
                    <button
                        type="button"
                        onClick={onSend}
                        disabled={!canSend}
                        aria-label={t("Send message")}
                        className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full transition-all",
                            canSend
                                ? "bg-primary text-primary-foreground shadow-xs hover:scale-105 active:scale-95"
                                : "text-muted-foreground/50 hover:bg-muted/40"
                        )}
                    >
                        <SendHorizontal className="size-4" aria-hidden="true" />
                    </button>
                </Tooltip>
            </div>

            {showCounter && (
                <p className={cn("mt-1 pr-10 text-right text-[10px] tabular-nums", draft.length >= DRAFT_MAX_LENGTH ? "text-red-500" : "text-muted-foreground")} aria-live="polite">
                    {draft.length}/{DRAFT_MAX_LENGTH}
                </p>
            )}
        </div>
    );
}
