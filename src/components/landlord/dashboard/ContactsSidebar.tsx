"use client";

import { useState } from "react";
import { Users, Phone, MoreHorizontal, ChevronLeft, MessageSquare, Video, X, Send, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface ChatUser {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread?: boolean;
}

const mockMessages: ChatUser[] = [
    {
        id: "usr_1",
        name: "John Doe",
        avatar: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=150&q=80",
        lastMessage: "Is it possible to move in earlier than the agreed date?",
        time: "15m ago",
        unread: true
    },
    {
        id: "usr_2",
        name: "Sarah Wilson",
        avatar: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80",
        lastMessage: "Thank you for the quick repair on the faucet!",
        time: "1h ago"
    },
    {
        id: "usr_3",
        name: "Alex Reyes",
        avatar: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150&q=80",
        lastMessage: "I'll be paying the rent this Friday.",
        time: "Yesterday"
    }
];

export function ContactsSidebar() {
    const [isHovered, setIsHovered] = useState(false);
    const [activeTab, setActiveTab] = useState<"messages" | "contacts">("messages");
    const [openChats, setOpenChats] = useState<ChatUser[]>([]);

    const openChat = (user: ChatUser) => {
        if (!openChats.find((c) => c.id === user.id)) {
            // max 3 open chats to fit the screen roughly, if more, remove the oldest one
            setOpenChats((prev) => {
                const newChats = [...prev, user];
                if (newChats.length > 3) newChats.shift();
                return newChats;
            });
        }
    };

    const closeChat = (id: string) => {
        setOpenChats((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full bg-neutral-900 border-l border-white/5 z-50 transition-all duration-500 ease-in-out flex flex-col shadow-2xl overflow-hidden",
                    isHovered ? "w-80" : "w-[88px]"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header Toggle */}
                <div className="p-6 border-b border-white/5 flex flex-col shrink-0 min-h-[88px] justify-center">
                    {!isHovered && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative p-2.5 bg-white/5 rounded-xl cursor-default">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                {mockMessages.some(m => m.unread) && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-neutral-900 animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    )}

                    {isHovered && (
                        <div className="flex w-full bg-black/40 rounded-xl p-1 relative animate-in fade-in duration-500">
                            <button
                                onClick={() => setActiveTab("messages")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "messages" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Messages
                            </button>
                            <button
                                onClick={() => setActiveTab("contacts")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "contacts" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Contacts
                            </button>

                            {/* Sliding Active Background */}
                            <div
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neutral-800 rounded-lg transition-transform duration-300 ease-out z-0"
                                style={{ transform: activeTab === "contacts" ? "translateX(100%)" : "translateX(0)" }}
                            />
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-4 relative">
                    <AnimatePresence mode="wait">
                        {activeTab === "messages" && (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className={cn("flex flex-col", isHovered ? "gap-2" : "gap-4 items-center")}
                            >
                                {mockMessages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => openChat(msg)}
                                        className={cn(
                                            "flex items-center gap-3 transition-colors text-left group rounded-2xl",
                                            isHovered ? "p-3 hover:bg-white/[0.04]" : "p-1 justify-center hover:scale-110"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={msg.avatar}
                                                alt={msg.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-[#0a0a0a]"
                                            />
                                            {msg.unread && (
                                                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-neutral-900" />
                                            )}
                                        </div>
                                        {isHovered && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className={cn("text-sm truncate pr-2 transition-colors group-hover:text-primary", msg.unread ? "font-bold text-white" : "font-medium text-neutral-200")}>
                                                        {msg.name}
                                                    </h4>
                                                    <span className="text-[10px] text-neutral-500 shrink-0">{msg.time}</span>
                                                </div>
                                                <p className={cn("text-xs truncate", msg.unread ? "text-neutral-300 font-medium" : "text-neutral-500")}>
                                                    {msg.lastMessage}
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === "contacts" && (
                            <motion.div
                                key="contacts"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className={cn("flex flex-col", isHovered ? "gap-2" : "gap-4 items-center")}
                            >
                                <ContactCard
                                    name="Maria Clara"
                                    unit="Unit 105"
                                    phone="+63 912 345 6789"
                                    avatar="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80"
                                    status="Active"
                                    isExpanded={isHovered}
                                />
                                <ContactCard
                                    name="Juan Dela Cruz"
                                    unit="Unit 402"
                                    phone="+63 998 765 4321"
                                    avatar="https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=150&q=80"
                                    status="Active"
                                    isExpanded={isHovered}
                                />
                                <ContactCard
                                    name="Sarah Wilson"
                                    unit="Studio A"
                                    phone="+63 917 111 2222"
                                    avatar="https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80"
                                    status="Moving In"
                                    isExpanded={isHovered}
                                />
                                <ContactCard
                                    name="Alex Reyes"
                                    unit="Unit 201"
                                    phone="+63 920 333 4444"
                                    avatar="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150&q=80"
                                    status="Late Payment"
                                    isExpanded={isHovered}
                                />
                                <ContactCard
                                    name="Michael Chen"
                                    unit="Unit 305"
                                    phone="+63 915 555 6666"
                                    avatar="https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80"
                                    status="Active"
                                    isExpanded={isHovered}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer View All */}
                {isHovered && (
                    <div className="p-4 border-t border-white/5 shrink-0 bg-neutral-900 animate-in fade-in duration-500">
                        <Link href="/landlord/tenants" className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-colors border border-white/10 flex items-center justify-center">
                            {activeTab === "messages" ? "View All Messages" : "View All Tenants"}
                        </Link>
                    </div>
                )}
            </div>

            {/* Render Multiple Chatboxes Horizontally (Anchored next to Sidebar) */}
            <div className={cn(
                "fixed bottom-0 flex items-end gap-4 z-[55] pointer-events-none transition-all duration-500 ease-in-out",
                isHovered ? "right-[340px]" : "right-[110px]"
            )}>
                <AnimatePresence>
                    {openChats.map((chat) => (
                        <motion.div
                            key={chat.id}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="w-[320px] h-[400px] bg-neutral-900 border border-white/10 rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto"
                        >
                            {/* Chatbox Header */}
                            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-neutral-800/50 rounded-t-2xl cursor-pointer hover:bg-neutral-800 transition-colors">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative shrink-0">
                                        <img src={chat.avatar} alt={chat.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-sm font-bold text-white truncate hover:underline">{chat.name}</h4>
                                        <p className="text-[10px] text-emerald-400">Active Now</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 text-neutral-400">
                                    <Link href="/landlord/messages" className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </Link>
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <Video className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => closeChat(chat.id)} className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Chatbox Body (Dummy Content) */}
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#0a0a0a]/50">
                                <div className="text-center">
                                    <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800 px-2 py-1 rounded-full">{chat.time}</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <img src={chat.avatar} className="w-6 h-6 rounded-full shrink-0" alt="avatar" />
                                    <div className="bg-neutral-800 text-neutral-200 text-sm px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                                        {chat.lastMessage}
                                    </div>
                                </div>
                            </div>

                            {/* Chatbox Input */}
                            <div className="p-3 border-t border-white/10 bg-neutral-900 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <button className="text-neutral-400 hover:text-white p-1.5 transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-full flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                        <input
                                            type="text"
                                            placeholder="Aa"
                                            className="w-full bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-neutral-500"
                                        />
                                    </div>
                                    <button className="text-primary hover:text-primary/80 p-1.5 transition-colors">
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}

function ContactCard({ name, unit, phone, avatar, status, isExpanded }: any) {
    const isIssue = status === "Late Payment" || status === "Notice Given";

    return (
        <div className={cn(
            "flex items-center gap-4 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all cursor-pointer group shrink-0",
            isExpanded ? "p-3" : "p-1 justify-center hover:scale-110"
        )}>
            <div className="relative shrink-0">
                <img
                    src={avatar}
                    alt={name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#0a0a0a] shadow-sm group-hover:scale-105 transition-transform duration-300"
                />
                <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0a0a]",
                    isIssue ? "bg-red-500" : status === "Moving In" ? "bg-amber-500" : "bg-emerald-500"
                )} />
            </div>

            {isExpanded && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors truncate">{name}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-400 font-medium truncate pr-2">{unit}</p>
                        <div className="flex items-center gap-1.5 text-neutral-500 group-hover:text-white transition-colors shrink-0">
                            <span className="text-[10px] text-neutral-500">{status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
