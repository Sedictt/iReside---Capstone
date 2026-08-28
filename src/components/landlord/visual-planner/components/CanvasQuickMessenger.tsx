"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { m as motion } from "framer-motion";

interface MessageItem {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_outgoing?: boolean;
}

interface CanvasQuickMessengerProps {
    unitId: string;
    unitName: string;
    tenantName: string;
    unitY?: number;
    onClose: () => void;
    primaryColor?: string;
}

// Module-level in-memory cache for instant zero-latency opening
const messageCache = new Map<string, { conversationId: string | null; tenantUserId: string | null; messages: MessageItem[]; timestamp: number }>();

export const CanvasQuickMessenger: React.FC<CanvasQuickMessengerProps> = ({
    unitId,
    unitName,
    tenantName,
    unitY = 0,
    onClose,
    primaryColor = "#3b82f6",
}) => {
    // Check instant cache first
    const cached = messageCache.get(unitId);

    const [messages, setMessages] = useState<MessageItem[]>(cached?.messages || []);
    const [conversationId, setConversationId] = useState<string | null>(cached?.conversationId || null);
    const [tenantUserId, setTenantUserId] = useState<string | null>(cached?.tenantUserId || null);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(!cached);
    const [isSending, setIsSending] = useState(false);
    const feedRef = useRef<HTMLDivElement>(null);

    // Render below the unit if the unit is near top of canvas, else render above
    const isPlacedBottom = unitY < 220;

    useEffect(() => {
        let isMounted = true;

        const loadConversation = async () => {
            if (!cached) {
                setIsLoading(true);
            }
            try {
                // Direct fast fetch for this specific unit & tenant (1 single request)
                const res = await fetch(
                    `/api/landlord/unit-messages?unitId=${encodeURIComponent(unitId)}&tenantName=${encodeURIComponent(tenantName)}`
                );
                if (!res.ok) throw new Error("Failed to load messages");
                const data = await res.json();
                
                const convId = data.conversationId || null;
                const tUserId = data.tenantUserId || null;
                const fetchedMessages = data.messages || [];

                // Store in fast cache
                messageCache.set(unitId, {
                    conversationId: convId,
                    tenantUserId: tUserId,
                    messages: fetchedMessages,
                    timestamp: Date.now(),
                });

                if (isMounted) {
                    setConversationId(convId);
                    setTenantUserId(tUserId);
                    setMessages(fetchedMessages);
                }
            } catch (err) {
                console.warn("[CanvasQuickMessenger] Fast fetch fallback:", err);
                if (isMounted && !cached) {
                    setMessages([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadConversation();
        return () => {
            isMounted = false;
        };
    }, [unitId, unitName, tenantName]);

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed || isSending) return;

        const tempId = `temp-${Date.now()}`;
        const newMsg: MessageItem = {
            id: tempId,
            sender_id: "me",
            content: trimmed,
            created_at: new Date().toISOString(),
            is_outgoing: true,
        };

        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setInputText("");
        setIsSending(true);

        // Update local cache optimistically
        messageCache.set(unitId, {
            conversationId,
            tenantUserId,
            messages: updatedMessages,
            timestamp: Date.now(),
        });

        try {
            const res = await fetch("/api/landlord/unit-messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unitId,
                    tenantUserId,
                    conversationId,
                    content: trimmed,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversationId) {
                    setConversationId(data.conversationId);
                    messageCache.set(unitId, {
                        conversationId: data.conversationId,
                        tenantUserId,
                        messages: updatedMessages,
                        timestamp: Date.now(),
                    });
                }
            }
        } catch (err) {
            console.error("[CanvasQuickMessenger] Send error:", err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            data-no-pan="true"
            initial={{ opacity: 0, y: isPlacedBottom ? -10 : 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isPlacedBottom ? -10 : 10, scale: 0.94 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute ${
                isPlacedBottom ? "top-[calc(100%+14px)]" : "bottom-[calc(100%+14px)]"
            } left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw] cursor-default select-text rounded-2xl border border-zinc-300 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900`}
            style={{ opacity: 1 }}
        >
            {/* Arrow Notch */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 size-4 rotate-45 ${
                    isPlacedBottom
                        ? "-top-2 border-t border-l border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                        : "-bottom-2 border-b border-r border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                }`}
            />

            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <span className="material-icons-round text-sm">person</span>
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-black text-zinc-900 dark:text-white">
                            {tenantName}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {unitName} • Quick Chat
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Link
                        href={`/landlord/messages?unitId=${encodeURIComponent(unitId)}`}
                        className="flex size-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-primary dark:hover:bg-zinc-800"
                        title="Open Full Messenger"
                    >
                        <span className="material-icons-round text-sm">open_in_new</span>
                    </Link>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="flex size-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        <span className="material-icons-round text-sm">close</span>
                    </button>
                </div>
            </div>

            {/* Message Feed */}
            <div
                ref={feedRef}
                className="my-2.5 flex h-44 flex-col gap-2 overflow-y-auto pr-1 text-xs custom-scrollbar"
            >
                {isLoading && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-zinc-400 text-[11px] font-medium">
                        <span className="material-icons-round animate-spin mr-1 text-sm">refresh</span>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center px-4 text-zinc-400">
                        <span className="material-icons-round text-xl mb-1 text-zinc-300 dark:text-zinc-700">chat_bubble_outline</span>
                        <p className="text-[11px] font-bold">No recent messages</p>
                        <p className="text-[10px] text-zinc-500">Send a quick note directly to {tenantName}.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.is_outgoing || msg.sender_id === "me";
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
                                        isMe
                                            ? "text-white rounded-br-xs"
                                            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-xs border border-zinc-200 dark:border-zinc-700/60"
                                    }`}
                                    style={isMe ? { backgroundColor: primaryColor, color: "#ffffff" } : undefined}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Reply Form */}
            <form onSubmit={handleSend} className="flex items-center gap-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-zinc-750"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                    title="Send message"
                >
                    <span className="material-icons-round text-base">send</span>
                </button>
            </form>
        </motion.div>
    );
};
