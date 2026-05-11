"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    X,
    Send,
    MessageSquare,
    Sparkles,
    Wifi,
    Copy,
    Maximize2,
    Brain,
    ShieldCheck,
    Info,
    ArrowUp
} from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { fetchIrisHistory, getCachedIrisHistory, setCachedIrisHistory, type IrisHistoryMessage } from "@/lib/iris/client";

interface Message {
    id: string;
    role: "user" | "iris";
    content: string;
    type?: "text" | "data_card";
    data?: any;
    timestamp: Date;
}

const getFirstName = (fullName?: string | null) => {
    if (!fullName) return null;
    return fullName.trim().split(/\s+/)[0] ?? null;
};

const buildWelcomeMessage = (firstName?: string | null) => {
    const nameSegment = firstName ? `, ${firstName}` : "";
    return `Welcome back${nameSegment}! 👋 How can I help you settle in or manage your apartment today?`;
};

export function ChatWidget({
    isOpen,
    onClose,
    embedded = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    embedded?: boolean;
}) {
    const INITIAL_CHAT_SKELETON_COUNT = 6;
    const { profile, user } = useAuth();

    const firstName = getFirstName(profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isChatInitializing, setIsChatInitializing] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    useEffect(() => {
        let isCancelled = false;

        const loadHistory = async () => {
            if (!user?.id) {
                setMessages([
                    {
                        id: "1",
                        role: "iris",
                        content: buildWelcomeMessage(firstName),
                        timestamp: new Date(),
                    },
                ]);
                setIsChatInitializing(false);
                return;
            }

            const cached = getCachedIrisHistory(user.id);
            if (cached && cached.length > 0) {
                setMessages(
                    cached.map((msg) => ({
                        id: msg.id,
                        role: msg.role === "assistant" ? "iris" : "user",
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                    }))
                );
                setIsChatInitializing(false);
                return;
            }

            setIsChatInitializing(true);
            const { data } = await fetchIrisHistory(100, { userId: user.id, useCache: true });
            if (isCancelled) return;

            if (data.length > 0) {
                setMessages(
                    data.map((msg) => ({
                        id: msg.id,
                        role: msg.role === "assistant" ? "iris" : "user",
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                    }))
                );
                setIsChatInitializing(false);
                return;
            }

            setMessages([
                {
                    id: "1",
                    role: "iris",
                    content: buildWelcomeMessage(firstName),
                    timestamp: new Date(),
                },
            ]);
            setIsChatInitializing(false);
        };

        loadHistory();

        return () => {
            isCancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || messages.length === 0) {
            return;
        }

        const normalizedMessages: IrisHistoryMessage[] = messages.map((msg) => ({
            id: msg.id,
            role: msg.role === "iris" ? "assistant" : "user",
            content: msg.content,
            metadata: null,
            created_at: msg.timestamp.toISOString(),
        }));

        setCachedIrisHistory(user.id, normalizedMessages);
    }, [messages, user?.id]);

    useEffect(() => {
        setMessages((prev) => {
            const [first, ...rest] = prev;
            if (!first || first.role !== "iris" || !first.content.toLowerCase().includes("welcome back")) {
                return prev;
            }

            return [
                {
                    ...first,
                    content: buildWelcomeMessage(firstName),
                },
                ...rest,
            ];
        });
    }, [firstName]);

    const handleSend = async () => {
        if (isChatInitializing) return;
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        const userInput = input;
        setInput("");
        setIsTyping(true);

        try {
            // Call the iRis API
            const response = await fetch('/api/iris/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userInput,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from iRis');
            }

            const data = await response.json();

            const irisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, irisMsg]);
        } catch (error) {
            console.error('Error calling iRis API:', error);

            // Show error message to user
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                    style={embedded ? undefined : { bottom: "max(0px, env(safe-area-inset-bottom))" }}
                    className={cn(
                        "w-[380px] h-[580px] bg-card/95 backdrop-blur-xl rounded-t-2xl border border-b-0 border-border flex flex-col pointer-events-auto overflow-hidden",
                        "shadow-[0_-18px_40px_rgba(0,0,0,0.28)]",
                        embedded ? "" : "fixed bottom-0 left-6 z-[60]"
                    )}
                >
                    {/* Header */}
                    <header className="bg-primary/95 p-5 text-white flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative size-11 rounded-full bg-white/20 p-0.5">
                                    <div className="h-full w-full rounded-full bg-white overflow-hidden">
                                        <Image
                                            src="/logos/favicon.png"
                                            alt="iRis"
                                            width={44} height={44}
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 border-2 border-primary"></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-base tracking-tight">iRis Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-white/60 animate-pulse"></span>
                                    <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Ask iRis</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href="/tenant/messages"
                                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110"
                                title="Open full chat"
                            >
                                <Maximize2 className="size-4" />
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </header>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-background/60">
                        {isChatInitializing ? (
                            <div className="space-y-4" aria-live="polite" aria-busy="true">
                                {Array.from({ length: INITIAL_CHAT_SKELETON_COUNT }).map((_, index) => {
                                    const isRight = index % 3 === 2;

                                    return (
                                        <div
                                            key={`skeleton-${index}`}
                                            className={cn("flex gap-3 max-w-[88%]", isRight ? "ml-auto flex-row-reverse" : "")}
                                        >
                                            {!isRight && (
                                                <div className="size-7 rounded-full bg-zinc-300/80 animate-pulse flex-shrink-0 mt-auto mb-1" />
                                            )}
                                            <div
                                                className={cn(
                                                    "rounded-[1.25rem] animate-pulse",
                                                    isRight
                                                        ? "bg-primary/25 rounded-br-none h-16 w-40"
                                                        : "bg-card border border-border rounded-bl-none h-20 w-52"
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex gap-3 max-w-[88%]",
                                            msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        {msg.role === "iris" && (
                                            <div className="flex-shrink-0 mt-auto mb-1">
                                                <div className="size-7 rounded-full overflow-hidden bg-primary/10 border border-primary/20">
                                                    <Image
                                                        src="/logos/favicon.png"
                                                        alt="iRis"
                                                        width={28} height={28}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className={cn(
                                            "px-4 py-3 rounded-[1.25rem] text-sm leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-none shadow-primary/20"
                                                : "bg-card text-foreground rounded-bl-none border border-border"
                                        )}>
                                            <p>{msg.content}</p>
                                            <span className={cn(
                                                "text-[9px] mt-1 block opacity-50 font-medium",
                                                msg.role === "user" ? "text-right" : ""
                                            )}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3"
                            >
                                <div className="size-7 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0 mt-auto">
                                    <Image src="/logos/favicon.png" alt="iRis" width={28} height={28} />
                                </div>
                                <div className="bg-card px-4 py-3 rounded-[1.25rem] rounded-bl-none border border-border shadow-sm flex items-center gap-1">
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="size-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Features */}
                    <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-border bg-card/80 backdrop-blur-sm">
                        {["WiFi Password", "Maintenance", "Rent Status", "Amenity Hours"].map((feature) => (
                            <button
                                key={feature}
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary transition-all active:scale-95"
                                onClick={() => {
                                    setInput(feature);
                                    // Optionally auto-send
                                }}
                            >
                                {feature}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-5 bg-card border-t border-border">
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-full blur opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    disabled={isChatInitializing}
                                    className="relative w-full bg-background/80 border border-transparent focus:border-primary/20 rounded-full px-5 py-3 text-sm text-foreground focus:ring-0 outline-none placeholder:text-muted-foreground transition-all backdrop-blur-sm"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isChatInitializing}
                                className="size-11 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_5px_15px_rgba(109,152,56,0.3)] transition-all hover:scale-110 active:scale-90 disabled:opacity-50 disabled:scale-100"
                            >
                                <ArrowUp className="size-5" />
                            </button>
                        </div>
                    </div>


                    <style jsx>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #e2e8f0;
                            border-radius: 2px;
                        }
                        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #374151;
                        }
                    `}</style>
                </motion.div>
            )}
        </AnimatePresence>
    );
}


