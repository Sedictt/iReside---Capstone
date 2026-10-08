"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, m as motion, useReducedMotion } from "framer-motion";
import { FileText, FolderOpen, X } from "lucide-react";
import type { MiniChatContact, MiniChatMessage } from "./types";
import { formatFullTimestamp, isImageMessage } from "./utils";

interface MiniChatSharedFilesPanelProps {
    chat: MiniChatContact | null;
    files: MiniChatMessage[];
    onClose: () => void;
}

export function MiniChatSharedFilesPanel({ chat, files, onClose }: MiniChatSharedFilesPanelProps) {
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const isOpen = Boolean(chat);

    useEffect(() => {
        if (!isOpen) return;
        closeButtonRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const images = files.filter(isImageMessage);
    const documents = files.filter((file) => !isImageMessage(file));

    return (
        <AnimatePresence>
            {chat && (
                <>
                    <motion.div
                        key="shared-files-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-[2px]"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        key="shared-files-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="mini-chat-shared-files-title"
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="fixed bottom-6 right-6 z-[80] flex max-h-[72vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FolderOpen className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <h2 id="mini-chat-shared-files-title" className="truncate text-sm font-bold text-foreground">Shared files</h2>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {files.length === 0 ? chat.name : `${files.length} with ${chat.name}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={onClose}
                                aria-label="Close shared files"
                                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
                            {files.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-10 text-center">
                                    <FileText className="size-6 text-muted-foreground/60" aria-hidden="true" />
                                    <p className="text-sm font-semibold text-foreground">Nothing shared yet</p>
                                    <p className="text-xs text-muted-foreground">Photos and documents from this chat will show up here.</p>
                                </div>
                            )}

                            {images.length > 0 && (
                                <section className="mb-5" aria-label="Photos">
                                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Photos</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {images.map((file) => (
                                            <a
                                                key={file.id}
                                                href={file.fileUrl ?? "#"}
                                                target="_blank"
                                                rel="noreferrer"
                                                title={formatFullTimestamp(file.createdAt)}
                                                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                                            >
                                                <Image
                                                    src={file.fileUrl ?? ""}
                                                    alt={file.fileName ?? "Shared photo"}
                                                    fill
                                                    sizes="120px"
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {documents.length > 0 && (
                                <section aria-label="Documents">
                                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Documents</h3>
                                    <ul className="space-y-1.5">
                                        {documents.map((file) => (
                                            <li key={file.id}>
                                                <a
                                                    href={file.fileUrl ?? "#"}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 transition-colors hover:bg-muted"
                                                >
                                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <FileText className="size-4" aria-hidden="true" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-xs font-semibold text-foreground">{file.fileName || file.content || "Attachment"}</span>
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            {file.isOwn ? "You" : chat.name.split(" ")[0]} · {formatFullTimestamp(file.createdAt)}
                                                        </span>
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
