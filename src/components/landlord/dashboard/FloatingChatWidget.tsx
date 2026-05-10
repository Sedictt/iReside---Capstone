"use client";

import { useState } from "react";
import { MessageSquare, X, Minus, Send, MoreHorizontal, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function HeaderChatWidget() {
    const [isListOpen, setIsListOpen] = useState(false);
    const [openChats, setOpenChats] = useState<ChatUser[]>([]);

    const toggleList = () => setIsListOpen(!isListOpen);

    const openChat = (user: ChatUser) => {
        if (!openChats.find((c) => c.id === user.id)) {
            // max 3 open chats to fit the screen roughly, if more, remove the oldest one
            setOpenChats((prev) => {
                const newChats = [...prev, user];
                if (newChats.length > 3) newChats.shift();
                return newChats;
            });
        }
        setIsListOpen(false); // Optionally close the list when opening a chat
    };

    const closeChat = (id: string) => {
        setOpenChats((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <>
            {/* The Header Chat Button */}
            <div className="relative">
                <button
                    onClick={toggleList}
                    className={cn(
                        "relative p-2.5 rounded-full transition-all group backdrop-blur-md border",
                        mockMessages.some(m => m.unread)
                            ? "bg-primary border-primary/50 hover:bg-primary/90 shadow-[0_0_20px_rgba(132,204,22,0.4)]"
                            : "bg-black/20 border-white/5 hover:bg-black/40"
                    )}
                >
                    <MessageSquare className={cn(
                        "size-5 transition-colors",
                        mockMessages.some(m => m.unread) ? "text-white" : "text-white/70 group-hover:text-white"
                    )} />

                    {/* Unread badge indicator */}
                    {mockMessages.some(m => m.unread) && (
                        <span className="absolute top-0 right-0 size-3 rounded-full bg-red-500 ring-2 ring-primary animate-pulse"></span>
                    )}
                </button>

                {/* The Recent Messages List Popover */}
                <AnimatePresence>
                    {isListOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-[calc(100%+12px)] right-0 w-80 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[70]"
                        >
                            <div className="p-4 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between">
                                <h3 className="font-semibold text-white">Recent Messages</h3>
                                <button onClick={toggleList} className="text-neutral-500 hover:text-white transition-colors">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                                {mockMessages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => openChat(msg)}
                                        className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.02] last:border-0 group"
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={msg.avatar}
                                                alt={msg.name}
                                                className="size-10 rounded-full object-cover border border-white/10"
                                            />
                                            {msg.unread && (
                                                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-primary border-2 border-neutral-900" />
                                            )}
                                        </div>
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
                                    </button>
                                ))}
                            </div>
                            <div className="p-3 bg-neutral-900 text-center border-t border-white/5">
                                <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                                    View All Messages
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Render Multiple Chatboxes Horizontally */}
            <div className="fixed bottom-0 right-28 flex items-end gap-4 z-[55] pointer-events-none pr-4">
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
                                        <img src={chat.avatar} alt={chat.name} className="size-8 rounded-full object-cover border border-white/10" />
                                        <div className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <h4 className="text-sm font-semibold text-white truncate hover:underline">{chat.name}</h4>
                                        <p className="text-[10px] text-emerald-400">Active Now</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 text-neutral-400">
                                    <button className="p-1 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <Phone className="size-4" />
                                    </button>
                                    <button className="p-1 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <Video className="size-4" />
                                    </button>
                                    <button onClick={() => closeChat(chat.id)} className="p-1 hover:bg-white/10 rounded-lg hover:text-white transition-colors">
                                        <X className="size-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Chatbox Body (Dummy Content) */}
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#0a0a0a]/50">
                                <div className="text-center">
                                    <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800 px-2 py-1 rounded-full">{chat.time}</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <img src={chat.avatar} className="size-6 rounded-full shrink-0" alt="avatar" />
                                    <div className="bg-neutral-800 text-neutral-200 text-sm px-4 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">
                                        {chat.lastMessage}
                                    </div>
                                </div>
                            </div>

                            {/* Chatbox Input */}
                            <div className="p-3 border-t border-white/10 bg-neutral-900 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <button className="text-neutral-400 hover:text-white p-1.5 transition-colors">
                                        <MoreHorizontal className="size-4" />
                                    </button>
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-full flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-neutral-500"
                                        />
                                    </div>
                                    <button className="text-primary hover:text-primary/80 p-1.5 transition-colors">
                                        <Send className="size-4" />
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

