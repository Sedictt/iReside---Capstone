"use client";

import { MessageSquare, Clock, Home, ArrowRight, Mail, MoreVertical, Eye, Archive, Trash2, CheckCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Inquiry {
    id: string;
    prospectName: string;
    prospectAvatar?: string;
    propertyName: string;
    propertyImage: string;
    messagePreview: string;
    timestamp: string;
    isUnread: boolean;
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

export function RecentInquiries({ simplifiedMode = false }: { simplifiedMode?: boolean }) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const [activeChat, setActiveChat] = useState<Inquiry | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [sentMessages, setSentMessages] = useState<Record<string, string[]>>({});
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const applyInquiryAction = async (inquiryId: string, action: "read" | "unread" | "archive" | "delete") => {
        try {
            const response = await fetch(`/api/landlord/inquiries/${inquiryId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!response.ok) {
                return;
            }

            setInquiries((prev) => {
                if (action === "archive" || action === "delete") {
                    return prev.filter((item) => item.id !== inquiryId);
                }

                return prev.map((item) =>
                    item.id === inquiryId
                        ? {
                              ...item,
                              isUnread: action === "unread",
                          }
                        : item
                );
            });

            if (activeChat?.id === inquiryId && (action === "archive" || action === "delete")) {
                setActiveChat(null);
                setMessageInput("");
            }
        } catch {
            // Keep UI state unchanged when action persistence fails.
        } finally {
            setOpenMenuId(null);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        const loadInquiries = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/landlord/inquiries/recent", {
                    method: "GET",
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Failed to load recent inquiries");
                }

                const payload = (await response.json()) as { inquiries?: Inquiry[] };
                setInquiries(Array.isArray(payload.inquiries) ? payload.inquiries : []);
            } catch (fetchError) {
                if ((fetchError as Error).name === "AbortError") {
                    return;
                }

                setError("Unable to load inquiries right now.");
                setInquiries([]);
            } finally {
                setLoading(false);
            }
        };

        void loadInquiries();

        return () => {
            controller.abort();
        };
    }, []);

    const handleMenuOpen = (inquiryId: string) => {
        if (openMenuId === inquiryId) {
            setOpenMenuId(null);
            return;
        }
        const btn = document.getElementById(`menu-btn-${inquiryId}`);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 8,
                left: rect.right - 192, // 192px = w-48
            });
        }
        setOpenMenuId(inquiryId);
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('[id^="menu-btn-"]')) {
                    setOpenMenuId(null);
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="w-full rounded-3xl bg-gradient-to-br from-[#171717] to-[#0a0a0a] border border-white/5 shadow-xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {simplifiedMode ? "Messages from People" : "Recent Inquiries"}
                                </h2>
                                <p className="text-sm text-neutral-400">
                                    {simplifiedMode ? "Talk to people interested in your house" : "Respond quickly to convert more prospects"}
                                </p>
                            </div>
                        </div>
                        <a
                            href="/landlord/messages"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-300 hover:text-white transition-all group"
                        >
                            <span>{simplifiedMode ? "See All Messages" : "View All"}</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Inquiries Grid - Compact Card Layout */}
                <div className="p-6">
                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                            <p className="text-sm text-neutral-400">Loading recent inquiries...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    ) : inquiries.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {inquiries.map((inquiry, index) => (
                            <motion.div
                                key={inquiry.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className="group relative rounded-2xl bg-neutral-900 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-lime-900/20"
                            >
                                {/* Header Section with Property Image Background */}
                                <div className="relative h-32 overflow-hidden rounded-t-2xl">
                                    {/* Property Background Image */}
                                    <img
                                        src={inquiry.propertyImage}
                                        alt={inquiry.propertyName}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />

                                    {/* Gradient Overlays */}
                                    {inquiry.isUnread ? (
                                        // Green gradient overlay for unread
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-lime-600/60 via-emerald-700/50 to-neutral-900/70" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
                                        </>
                                    ) : (
                                        // Neutral dark overlay for read
                                        <>
                                            <div className="absolute inset-0 bg-neutral-900/50" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
                                        </>
                                    )}

                                    {/* Three-dot Menu Button */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <button
                                            id={`menu-btn-${inquiry.id}`}
                                            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 transition-all group/menu"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMenuOpen(inquiry.id);
                                            }}
                                        >
                                            <MoreVertical className="h-4 w-4 text-white group-hover/menu:scale-110 transition-transform" />
                                        </button>
                                    </div>

                                    {/* Unread Badge */}
                                    {inquiry.isUnread && (
                                        <div className="absolute top-3 right-14 flex items-center gap-1.5 bg-lime-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
                                            <Mail className="h-3 w-3" />
                                            New
                                        </div>
                                    )}

                                    {/* Avatar positioned at bottom */}
                                    <div className="absolute bottom-3 left-4 flex items-center gap-3 z-10">
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                                            {inquiry.prospectAvatar ? (
                                                <img
                                                    src={inquiry.prospectAvatar}
                                                    alt={inquiry.prospectName}
                                                    className="h-14 w-14 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-white">
                                                    {inquiry.prospectName.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 space-y-3">
                                    {/* Name and Property */}
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1 truncate">
                                            {inquiry.prospectName}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                            <Home className="h-3.5 w-3.5 flex-shrink-0" />
                                            <p className="truncate font-medium">{inquiry.propertyName}</p>
                                        </div>
                                    </div>

                                    {/* Message Preview */}
                                    <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                                        {inquiry.messagePreview}
                                    </p>

                                    {/* Footer with Time and Action */}
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{inquiry.timestamp}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button 
                                        onClick={() => setActiveChat(inquiry)}
                                        className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 text-sm font-bold transition-all shadow-lg hover:shadow-xl"
                                    >
                                        {simplifiedMode ? "Answer Now" : "Reply now"}
                                    </button>
                                </div>
                            </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center rounded-2xl border border-dashed border-white/10 bg-black/20">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-800/50 mb-4">
                                <MessageSquare className="h-8 w-8 text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Recent Inquiries</h3>
                            <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                                When potential tenants message you through applications, they will appear here.
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Portal Dropdown Menu */}
            {openMenuId && createPortal(
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="fixed w-48 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl backdrop-blur-xl z-[9999]"
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    <div className="py-1">
                        <button
                            onClick={() => {
                                const inquiry = inquiries.find((item) => item.id === openMenuId);
                                if (!inquiry) {
                                    setOpenMenuId(null);
                                    return;
                                }

                                void applyInquiryAction(inquiry.id, inquiry.isUnread ? "read" : "unread");
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <CheckCircle className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                {simplifiedMode ? "Got it" : (inquiries.find(i => i.id === openMenuId)?.isUnread ? 'Mark as Read' : 'Mark as Unread')}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('View property');
                                setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <Eye className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                {simplifiedMode ? "See House" : "View Property"}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                if (!openMenuId) {
                                    setOpenMenuId(null);
                                    return;
                                }

                                void applyInquiryAction(openMenuId, "archive");
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group/item"
                        >
                            <Archive className="h-4 w-4 text-neutral-400 group-hover/item:text-white transition-colors" />
                            <span className="text-sm text-neutral-300 group-hover/item:text-white transition-colors">
                                {simplifiedMode ? "Save" : "Archive"}
                            </span>
                        </button>

                        <div className="border-t border-white/5 my-1" />
                        <button
                            onClick={() => {
                                if (!openMenuId) {
                                    setOpenMenuId(null);
                                    return;
                                }

                                void applyInquiryAction(openMenuId, "delete");
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left group/item"
                        >
                            <Trash2 className="h-4 w-4 text-red-400 group-hover/item:text-red-300 transition-colors" />
                            <span className="text-sm text-red-400 group-hover/item:text-red-300 transition-colors">
                                {simplifiedMode ? "Remove" : "Delete"}
                            </span>
                        </button>
                    </div>
                </motion.div>,
                document.body
            )}

            {/* Chatbox Modal */}
            <AnimatePresence>
                {activeChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 w-full max-w-[360px] bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[9999] overflow-hidden"
                        style={{ height: "450px" }}
                    >
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 bg-neutral-800/80 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-600 to-emerald-800 flex items-center justify-center text-white font-bold text-sm">
                                    {activeChat.prospectAvatar ? (
                                        <img
                                            src={activeChat.prospectAvatar || FALLBACK_AVATAR}
                                            alt={activeChat.prospectName}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        activeChat.prospectName.split(' ').map(n => n[0]).join('')
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">{activeChat.prospectName}</span>
                                    <span className="text-neutral-400 text-xs truncate max-w-[150px]">{activeChat.propertyName}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setActiveChat(null);
                                    setMessageInput("");
                                }}
                                className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0a]">
                            <div className="flex flex-col gap-1 items-start">
                                <span className="text-[10px] text-neutral-500 ml-1">{activeChat.timestamp}</span>
                                <div className="bg-neutral-800 border border-white/5 text-neutral-200 text-sm p-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                                    {activeChat.messagePreview}
                                </div>
                            </div>

                            {sentMessages[activeChat.id]?.map((msg, idx) => (
                                <div key={idx} className="flex flex-col gap-1 items-end">
                                    <div className="bg-gradient-to-br from-lime-600 to-emerald-700 text-white text-sm p-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                                        {msg}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chat Input */}
                        <div className="p-3 border-t border-white/10 bg-neutral-900">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!messageInput.trim()) return;
                                    setSentMessages(prev => ({
                                        ...prev,
                                        [activeChat.id]: [...(prev[activeChat.id] || []), messageInput]
                                    }));
                                    setMessageInput("");
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50 placeholder:text-neutral-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className="p-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
