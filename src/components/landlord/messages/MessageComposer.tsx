"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
    Send, 
    Paperclip, 
    Image as ImageIcon, 
    X, 
    Zap,
    Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingAttachment } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';


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
    otherUserName
}: MessageComposerProps) {
    const { resolvedTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const handleEmojiSelect = (emoji: { native: string }) => {
        setMessageInput(messageInput + emoji.native);
        textAreaRef.current?.focus();
    };

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
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
        }
    }, [messageInput]);

    return (
        <div className="p-4 bg-surface-1 border-t border-divider relative">
            <AnimatePresence>
                {isOtherUserTyping && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-8 left-6 flex items-center gap-2"
                    >
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                        </div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {otherUserName || "Someone"} is typing...
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
                            {pendingAttachments.map((att) => (
                                <div key={att.id} className="relative group">
                                    <div className="h-16 w-16 rounded-xl overflow-hidden border border-divider bg-surface-3 relative">
                                        {att.isImage && att.previewUrl ? (
                                            <img src={att.previewUrl} className="h-full w-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Paperclip className="h-6 w-6 text-medium" />
                                            </div>
                                        )}
                                        
                                        {att.status === 'uploading' && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="absolute bottom-1 text-[8px] font-black text-white">{att.progress}%</span>
                                            </div>
                                        )}


                                        {att.status === 'error' && (
                                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                                <X className="h-5 w-5 text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {att.status !== 'uploading' && (
                                        <button 
                                            onClick={() => removePendingAttachment(att.id)}
                                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform z-10"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                                        <span className="text-[8px] text-white font-bold uppercase truncate px-1 max-w-full">
                                            {att.file.name.split('.').pop()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-3 bg-surface-2 border border-divider rounded-[2rem] p-2 pl-4 pr-2 focus-within:border-primary/40 focus-within:bg-surface-1 focus-within:ring-4 focus-within:ring-primary/10 transition-all relative overflow-visible group/composer">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-full hover:bg-surface-3 transition-colors text-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        title="Attach files"
                    >
                        <ImageIcon className="h-5 w-5" />
                    </button>
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
                        placeholder={pendingAttachments.length > 0 ? "Add a caption..." : "Type a message..."}
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
                            <Smile className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={onSendMessage}
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || isUploadingFile || isSending}
                            className={cn(
                                "p-2.5 rounded-full transition-all flex items-center justify-center min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                (messageInput.trim() || pendingAttachments.length > 0) && !isUploadingFile && !isSending
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95" 
                                    : "bg-surface-3 text-disabled"
                            )}
                        >
                            <Send className="h-5 w-5" />
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
                    <div className="flex items-center gap-4 text-[10px] font-bold text-disabled uppercase tracking-widest">
                        {isUploadingFile ? (
                            <span className="text-primary animate-pulse flex items-center gap-2">
                                <Zap className="w-3 h-3" />
                                Processing uploads...
                            </span>
                        ) : pendingAttachments.length > 0 ? (
                            <span className="text-primary font-black">
                                {pendingAttachments.length} {pendingAttachments.length === 1 ? 'file' : 'files'} selected
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-primary" />
                                Shift+Enter for newline
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
