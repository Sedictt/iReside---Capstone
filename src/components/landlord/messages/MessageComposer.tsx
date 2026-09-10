"use client";

import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
    Send, 
    Paperclip, 
    Image as ImageIcon, 
    X, 
    Zap,
    Smile,
    Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingAttachment } from "./types";
import { m as motion, AnimatePresence } from "framer-motion";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Skeleton } from "@/components/ui/Skeleton";


interface MessageComposerProps {
    messageInput: string;
    setMessageInput: (val: string) => void;
    onSendMessage: () => void;
    onFileUpload: (files: File[]) => void;
    pendingAttachments: PendingAttachment[];
    removePendingAttachment: (id: string) => void;
    isUploadingFile: boolean;
    isSending?: boolean;
    isOtherUserTyping: boolean;
    otherUserName?: string;
    isLoading?: boolean;
    onOpenAttachInvoice?: () => void;
    onOpenQuickActions?: () => void;
}

export function MessageComposer({
    messageInput,
    setMessageInput,
    onSendMessage,
    onFileUpload,
    pendingAttachments,
    removePendingAttachment,
    isUploadingFile,
    isSending = false,
    isOtherUserTyping,
    otherUserName,
    isLoading = false,
    onOpenAttachInvoice,
    onOpenQuickActions,
}: MessageComposerProps) {
    const { resolvedTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    const handleEmojiSelect = (emoji: { native: string }) => {
        setMessageInput(messageInput + emoji.native);
        textAreaRef.current?.focus();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
                setShowAttachMenu(false);
            }
        };
        if (showAttachMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAttachMenu]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textAreaRef.current) {
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.cssText = `height: ${Math.min(scrollHeight, 120)}px;`;
        }
    }, [messageInput]);

    if (isLoading) {
        return (
            <div className="z-20 flex flex-col gap-2 p-4 sm:p-6 pb-6 pt-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 w-full p-2.5 rounded-[2rem] neumorphic-inset-card opacity-70">
                    <Skeleton className="size-10 rounded-full shrink-0 opacity-60" />
                    <Skeleton className="h-9 flex-1 rounded-2xl opacity-40" />
                    <Skeleton className="size-10 rounded-full shrink-0 opacity-60" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 relative mt-2">
            <AnimatePresence>
                {isOtherUserTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-8 left-6 flex items-center gap-2"
                    >
                        <div className="flex gap-1">
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                            {otherUserName || "Someone"} is typing…
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <AnimatePresence>
                    {pendingAttachments.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-wrap gap-2 p-3 rounded-2xl bg-surface-2 border border-divider shadow-inner max-h-[160px] overflow-y-auto custom-scrollbar-premium"
                        >
                            {pendingAttachments.map((att, idx) => (
                                <div key={att.id || `pending-att-${idx}`} className="relative group">
                                    <div className="size-16 rounded-xl overflow-hidden border border-divider bg-surface-3 relative">
                                        {att.isImage && att.previewUrl ? (
                                            <Image src={att.previewUrl} fill sizes="80px" className="object-cover" alt="Preview" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Paperclip className="size-6 text-medium" />
                                            </div>
                                        )}
                                        
                                        {att.status === 'uploading' && (
                                            <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center backdrop-blur-[1px] text-white">
                                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1" />
                                                <span className="text-[8px] font-black uppercase tracking-wider">
                                                    {typeof att.progress === 'number' && att.progress > 0 && att.progress < 100 ? `${att.progress}%` : "Readying…"}
                                                </span>
                                            </div>
                                        )}

                                        {att.status === 'error' && (
                                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                                <X className="size-5 text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => removePendingAttachment(att.id)}
                                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform z-10"
                                    >
                                        <X className="size-3" />
                                    </button>
                                    
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                                        <span className="text-[8px] text-white font-black uppercase truncate px-1 max-w-full">
                                            {att.file.name.split('.').pop()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-3 neumorphic-inset rounded-[2rem] p-2 pl-4 pr-2 transition-all relative overflow-visible group/composer">
                    {/* Attachment & Actions Dropdown */}
                    <div className="relative" ref={attachMenuRef}>
                        <button 
                            type="button"
                            onClick={() => setShowAttachMenu((prev) => !prev)}
                            className={cn(
                                "p-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                showAttachMenu 
                                    ? "bg-primary/20 text-primary scale-105" 
                                    : "hover:bg-surface-3 text-medium hover:text-high"
                            )}
                            title="Attach files, invoices, or quick actions"
                            aria-label="Attachment options"
                        >
                            <Paperclip className="size-5" />
                        </button>

                        <AnimatePresence>
                            {showAttachMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 mb-3 z-50 w-64 rounded-3xl border border-border bg-card p-2 shadow-2xl animate-in fade-in zoom-in-95 backdrop-blur-md"
                                >
                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-disabled">
                                        Attachments & Actions
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAttachMenu(false);
                                            fileInputRef.current?.click();
                                        }}
                                        className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all hover:bg-surface-2 group"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-black text-high group-hover:text-primary transition-colors">
                                                Upload File or Photo
                                            </div>
                                            <div className="text-[10px] font-medium text-disabled">
                                                Images, documents, or PDFs
                                            </div>
                                        </div>
                                    </button>

                                    {onOpenAttachInvoice && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAttachMenu(false);
                                                onOpenAttachInvoice();
                                            }}
                                            className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all hover:bg-surface-2 group"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                                                <Receipt className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-black text-high group-hover:text-primary transition-colors">
                                                    Attach Bill / Invoice
                                                </div>
                                                <div className="text-[10px] font-medium text-disabled">
                                                    Send invoice directly to chat
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    {onOpenQuickActions && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAttachMenu(false);
                                                onOpenQuickActions();
                                            }}
                                            className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all hover:bg-surface-2 group"
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                                                <Zap className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-black text-high group-hover:text-primary transition-colors">
                                                    Quick Actions
                                                </div>
                                                <div className="text-[10px] font-medium text-disabled">
                                                    Payment request, notice, repairs
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) onFileUpload(files);
                            e.target.value = ''; // Reset for same file selection
                        }}
                    />
                    
                    <textarea
                        ref={textAreaRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={pendingAttachments.length > 0 ? "Add a caption…" : "Type a message…"}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 max-h-[120px] resize-none text-high placeholder:text-disabled appearance-none shadow-none"
                        style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                        rows={1}
                    />

                    <div className="flex items-center gap-1 relative">
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={cn(
                                "p-2.5 rounded-full transition-colors text-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                showEmojiPicker ? "bg-primary/20 text-primary" : "hover:bg-surface-3"
                            )}
                            title="Add emoji"
                        >
                            <Smile className="size-5" />
                        </button>
                        <button 
                            onClick={onSendMessage}
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isSending}
                            className={cn(
                                "p-2.5 rounded-full transition-all flex items-center justify-center min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                (messageInput.trim() || pendingAttachments.length > 0) && !isSending
                                    ? "neumorphic-primary text-white hover:scale-105 active:scale-95" 
                                    : "bg-surface-3 text-disabled"
                            )}
                        >
                            <Send className="size-5" />
                        </button>

                        {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    className="absolute bottom-full right-0 mb-4 z-[100] shadow-2xl rounded-2xl overflow-hidden"
                                >
                                <Picker 
                                    id="ireside-emoji-picker"
                                    data={data} 
                                    onEmojiSelect={handleEmojiSelect} 
                                    theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                                    set="native"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                    navPosition="bottom"
                                    perLine={8}
                                    maxFrequentRows={1}
                                />
                                </div>
                            )}
                    </div>
                </div>
                
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4 text-[10px] font-black text-disabled uppercase tracking-widest">
                        {isUploadingFile ? (
                            <span className="text-primary animate-pulse flex items-center gap-2">
                                <Zap className="size-3" />
                                Processing uploads…
                            </span>
                        ) : pendingAttachments.length > 0 ? (
                            <span className="text-primary font-black">
                                {pendingAttachments.length} {pendingAttachments.length === 1 ? 'file' : 'files'} selected
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Zap className="size-3 text-primary" />
                                Shift+Enter for newline
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


