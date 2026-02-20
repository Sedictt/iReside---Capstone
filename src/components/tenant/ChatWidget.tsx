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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "iris";
    content: string;
    type?: "text" | "data_card";
    data?: any;
    timestamp: Date;
}

export function ChatWidget({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "iris",
            content: "Welcome back, Sarah! 👋 How can I help you settle in or manage your apartment today?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate iRis typing
        setTimeout(() => {
            const irisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: "I've checked the building records for that. Is there anything specific you'd like to know about it?",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, irisMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                    className="fixed bottom-6 right-6 z-[60] w-[400px] h-[600px] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <header className="bg-primary/95 dark:bg-primary/90 p-5 text-white flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative h-11 w-11 rounded-full bg-white/20 p-0.5">
                                    <div className="h-full w-full rounded-full bg-white overflow-hidden">
                                        <Image
                                            src="/iris-avatar.png"
                                            alt="iRis"
                                            width={44} height={44}
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-primary"></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-base tracking-tight">iRis Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-pulse"></span>
                                    <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">Ask iRis</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href="/tenant/dashboard/ai-concierge"
                                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110"
                                title="Open full chat"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all hover:rotate-90"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-black/20">
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
                                        <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 border border-primary/20">
                                            <Image
                                                src="/iris-avatar.png"
                                                alt="iRis"
                                                width={28} height={28}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className={cn(
                                    "px-4 py-3 rounded-[1.25rem] text-sm leading-relaxed shadow-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-white rounded-br-none shadow-primary/20"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700"
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

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3"
                            >
                                <div className="h-7 w-7 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0 mt-auto">
                                    <Image src="/iris-avatar.png" alt="iRis" width={28} height={28} />
                                </div>
                                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-[1.25rem] rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Features */}
                    <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        {["WiFi Password", "Maintenance", "Rent Status", "Amenity Hours"].map((feature) => (
                            <button
                                key={feature}
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary transition-all active:scale-95"
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
                    <div className="p-5 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800">
                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 relative group">
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-full blur opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    className="relative w-full bg-gray-100/80 dark:bg-gray-800/80 border border-transparent focus:border-primary/20 rounded-full px-5 py-3 text-sm focus:ring-0 outline-none placeholder-gray-400 dark:text-white transition-all backdrop-blur-sm"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-11 w-11 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_5px_15px_rgba(109,152,56,0.3)] transition-all hover:scale-110 active:scale-90 disabled:opacity-50 disabled:scale-100"
                            >
                                <ArrowUp className="w-5 h-5" />
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
