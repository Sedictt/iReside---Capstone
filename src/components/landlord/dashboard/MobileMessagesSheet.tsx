"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Users, X, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, m as motion } from "framer-motion";
import {
    fetchConversations,
    type ConversationSummary,
} from "@/lib/messages/client";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";

interface ChatUser {
    id: string;
    participantUserId: string | null;
    name: string;
    role: BadgeRole | null;
    avatar: string;
    avatarBgColor: string | null;
    lastMessage: string;
    time: string;
    unread?: boolean;
}

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

const formatConversationTimestamp = (iso: string | null) => {
    if (!iso) return "No messages yet";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const mapConversationToUser = (conversation: ConversationSummary): ChatUser => {
    const other = conversation.otherParticipants[0];
    return {
        id: conversation.id,
        participantUserId: other?.id ?? null,
        name: other?.fullName ?? "Conversation",
        role: other?.role ?? null,
        avatar: other?.avatarUrl || FALLBACK_AVATAR,
        avatarBgColor: other?.avatarBgColor || null,
        lastMessage: conversation.lastMessage?.content ?? "No messages yet",
        time: formatConversationTimestamp(conversation.lastMessage?.createdAt ?? conversation.updatedAt),
        unread: conversation.unreadCount > 0,
    };
};

export function MobileMessagesSheet() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"messages" | "contacts">("messages");
    const [conversations, setConversations] = useState<ChatUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const loadConversations = useCallback(async () => {
        setIsLoading(true);
        const { data } = await fetchConversations();
        const mapped = (data ?? []).map(mapConversationToUser);
        setConversations(mapped);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            void loadConversations();
        }
    }, [isOpen, loadConversations]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.lastMessage.toLowerCase().includes(q)
        );
    }, [conversations, searchQuery]);

    const hasUnread = useMemo(
        () => conversations.some((c) => c.unread),
        [conversations]
    );

    return (
        <>
            {/* Floating Action Button - Mobile Only */}
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Open messages"
                className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(var(--primary-rgb),0.35)] transition-all hover:scale-105 active:scale-95 md:hidden"
            >
                <div className="relative">
                    <MessageSquare className="size-6" />
                    {hasUnread && (
                        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 animate-pulse" />
                    )}
                </div>
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Slide-Up Sheet */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        className="fixed inset-x-4 bottom-4 z-[61] max-h-[75vh] overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-[0_30px_60px_rgba(0,0,0,0.4)] md:hidden"
                    >
                        {/* Drag Handle */}
                        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-muted" />

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <MessageSquare className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-foreground">Messages</h2>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 px-5 pt-2">
                            <button
                                onClick={() => setActiveTab("messages")}
                                className={cn(
                                    "relative flex items-center gap-2 px-1 py-3 text-sm font-black transition-colors",
                                    activeTab === "messages"
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <MessageSquare className="size-4" />
                                Messages
                                {hasUnread && (
                                    <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                                        {conversations.filter((c) => c.unread).length}
                                    </span>
                                )}
                                {activeTab === "messages" && (
                                    <motion.div
                                        layoutId="mobile-sheet-tabs"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("contacts")}
                                className={cn(
                                    "relative flex items-center gap-2 px-1 py-3 text-sm font-black transition-colors ml-4",
                                    activeTab === "contacts"
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Users className="size-4" />
                                Contacts
                                {activeTab === "contacts" && (
                                    <motion.div
                                        layoutId="mobile-sheet-tabs"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </button>
                        </div>

                        {/* Search (only for messages tab) */}
                        {activeTab === "messages" && (
                            <div className="px-5 py-3">
                                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-muted/50 px-3 py-2">
                                    <Search className="size-4 text-muted-foreground shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Conversation List */}
                        <div className="max-h-[calc(75vh-220px)] overflow-y-auto custom-scrollbar-premium px-4 pb-4">
                            {isLoading ? (
                                <div className="space-y-3 pt-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-card/50 p-3 animate-pulse">
                                            <div className="size-10 rounded-full bg-muted/40 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 rounded bg-muted/40" />
                                                <div className="h-2 w-1/2 rounded bg-muted/30" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-card text-muted-foreground">
                                        <MessageSquare className="size-6" />
                                    </div>
                                    <p className="text-sm font-black text-muted-foreground">
                                        {searchQuery ? "No messages found" : "No conversations yet"}
                                    </p>
                                    {!searchQuery && (
                                        <p className="mt-1 text-xs font-medium text-muted-foreground/60">
                                            Messages with tenants will appear here
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2 pt-2">
                                    {filteredConversations.map((conversation) => (
                                        <Link
                                            key={conversation.id}
                                            href="/landlord/messages"
                                            onClick={() => setIsOpen(false)}
                                            className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-card/60 p-3 transition-all hover:bg-card"
                                        >
                                            <div className="relative shrink-0">
                                                <div
                                                    className="size-11 rounded-full border-2 border-background overflow-hidden"
                                                    style={{
                                                        backgroundColor: conversation.avatarBgColor || "#171717",
                                                    }}
                                                >
                                                    <Image
                                                        src={conversation.avatar}
                                                        alt={conversation.name}
                                                        width={44}
                                                        height={44}
                                                        className="object-cover"
                                                    />
                                                </div>
                                                {conversation.unread && (
                                                    <div className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card bg-red-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <h4
                                                            className={cn(
                                                                "truncate text-sm",
                                                                conversation.unread
                                                                    ? "font-black text-foreground"
                                                                    : "font-medium text-foreground/80"
                                                            )}
                                                        >
                                                            {conversation.name}
                                                        </h4>
                                                        <RoleBadge role={conversation.role} />
                                                    </div>
                                                    <span className="shrink-0 text-[10px] text-muted-foreground">
                                                        {conversation.time}
                                                    </span>
                                                </div>
                                                <p
                                                    className={cn(
                                                        "truncate text-xs",
                                                        conversation.unread
                                                            ? "font-medium text-foreground/70"
                                                            : "text-muted-foreground"
                                                    )}
                                                >
                                                    {conversation.lastMessage}
                                                </p>
                                            </div>
                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/10 px-5 py-4">
                            <Link
                                href="/landlord/messages"
                                onClick={() => setIsOpen(false)}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-3 text-sm font-black tracking-tight text-background transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                                View All Messages
                                <ChevronRight className="size-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}