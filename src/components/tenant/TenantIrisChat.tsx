"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowUp, Wifi, Copy, Brain, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Message {
    id: string;
    role: "user" | "iris";
    content: string;
    timestamp: Date;
    hasDataCard?: boolean;
}

export function TenantIrisChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "iris",
            content: "Welcome back, Marcus! 👋 I am your virtual property assistant. How can I help you settle in or manage your apartment today?",
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
        scrollToBottom();
    }, [messages, isTyping]);

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

        // Simulate iRis response
        setTimeout(() => {
            const isWifi = userMsg.content.toLowerCase().includes("wifi") || userMsg.content.toLowerCase().includes("internet");

            const irisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: isWifi ? "I can help with that! Here are the details for the Lobby network:" : "I've checked the building records for that. Is there anything specific you'd like to know about it?",
                timestamp: new Date(),
                hasDataCard: isWifi
            };
            setMessages(prev => [...prev, irisMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-white/10 flex items-center justify-center">
                            <img src="/iris-avatar.png" alt="iRis" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">iRis Assistant</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-primary tracking-widest bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">AI Concierge</span>
                            <span className="text-[10px] text-neutral-400 font-medium">Always Available</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-6 flex flex-col">
                    <div className="text-center py-6 flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white/5 shadow-2xl">
                            <img src="/iris-avatar.png" alt="iRis" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
                            Conversation with iRis • Private & Secured
                        </span>
                    </div>

                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex w-full gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
                            {msg.role === "iris" && (
                                <div className="shrink-0 mt-auto">
                                    <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center border border-white/10">
                                        <img src="/iris-avatar.png" alt="iRis" className="w-7 h-7 object-cover" />
                                    </div>
                                </div>
                            )}

                            <div className={cn("flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%]", msg.role === "user" ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-primary text-black rounded-br-sm font-medium shadow-[0_4px_15px_rgb(109,152,56,0.3)]"
                                        : "bg-neutral-800 text-neutral-200 rounded-bl-sm border border-white/5"
                                )}>
                                    <p>{msg.content}</p>
                                </div>

                                {msg.hasDataCard && (
                                    <div className="w-full bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-lg mt-1 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="p-4 border-b border-white/5 flex justify-between items-center relative z-10">
                                            <div className="flex-1">
                                                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Network Name</p>
                                                <p className="text-primary font-mono font-medium text-sm md:text-base select-all">TheLofts_Guest</p>
                                            </div>
                                            <button className="p-2 text-neutral-500 hover:text-primary transition rounded-lg hover:bg-primary/10">
                                                <Wifi className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="p-4 flex justify-between items-center relative z-10 cursor-pointer hover:bg-white/[0.02] transition-colors">
                                            <div className="flex-1">
                                                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Password</p>
                                                <p className="text-primary font-mono font-medium text-sm md:text-base select-all">WelcomeHome2024</p>
                                            </div>
                                            <button className="p-2 text-neutral-500 hover:text-primary transition rounded-lg hover:bg-primary/10">
                                                <Copy className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <span className={cn("text-[10px] font-medium text-neutral-600 px-1", msg.role === "user" ? "text-right" : "text-left")}>
                                    {msg.role === "user" ? "Seen" : msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {msg.role === "user" && (
                                <div className="shrink-0 mt-auto">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-400 border border-white/10">
                                        MJ
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex w-full gap-4 justify-start">
                            <div className="shrink-0 mt-auto">
                                <div className="w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center border border-white/10">
                                    <img src="/iris-avatar.png" alt="iRis" className="w-7 h-7 object-cover" />
                                </div>
                            </div>
                            <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-neutral-800 border border-white/5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-6 bg-neutral-900/50 backdrop-blur-xl border-t border-white/5 z-10 w-full flex justify-center">
                <div className="max-w-4xl w-full flex flex-col gap-3 relative">
                    {/* Feature Suggester */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["WiFi Password", "Maintenance", "Rent Status", "Amenity Hours"].map((feature) => (
                            <button
                                key={feature}
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold bg-white/5 text-neutral-400 border border-white/10 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
                                onClick={() => {
                                    setInput(feature);
                                }}
                            >
                                {feature}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-end gap-2 bg-neutral-900/80 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-colors backdrop-blur-md">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Message iRis Assistant..."
                                className="flex-1 bg-transparent border-none outline-none resize-none pt-2.5 px-3 min-h-[44px] max-h-[120px] text-sm text-white placeholder:text-neutral-500 custom-scrollbar"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-black shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-primary"
                            >
                                <ArrowUp className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-center mt-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
                        <p className="text-[10px] text-neutral-500 font-medium">Conversations are monitored by AI specifically for building administration.</p>
                    </div>
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
            `}</style>
        </div>
    );
}
