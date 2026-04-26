"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, MoreHorizontal, MessageSquare, X, Send, Maximize2, Check, CheckCheck, Clock3, MoreVertical, File } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    fetchConversationMessages,
    fetchConversations,
    markConversationAsRead,
    sendConversationMessage,
    uploadConversationFile,
    type ConversationSummary,
} from "@/lib/messages/client";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";
import { ProfileCardTrigger } from "@/components/ui/ProfileCardTrigger";

interface ChatUser {
    id: string;
    participantUserId: string | null;
    name: string;
    role: BadgeRole | null;
    avatar: string;
    avatarBgColor: string | null;
    lastMessage: string;
    time: string;
    unit: string;
    relationshipStatus: ConversationSummary["relationshipStatus"];
    unread?: boolean;
}

type OpenChatUser = ChatUser & {
    isActive: boolean;
};

type MiniChatMessage = {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    isOwn: boolean;
    status?: "sending" | "delivered" | "seen";
    messageType?: "text" | "system" | "image" | "file";
    fileUrl?: string | null;
    fileMimeType?: string | null;
};

type MiniChatState = {
    messages: MiniChatMessage[];
    draft: string;
    isLoading: boolean;
    isSending: boolean;
    isUploading: boolean;
    isOtherUserTyping: boolean;
    error: string | null;
};

const DEFAULT_CHAT_STATE: MiniChatState = {
    messages: [],
    draft: "",
    isLoading: false,
    isSending: false,
    isUploading: false,
    isOtherUserTyping: false,
    error: null,
};

const MESSAGE_CACHE_TTL_MS = 2 * 60 * 1000;

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

const formatConversationTimestamp = (iso: string | null) => {
    if (!iso) {
        return "No messages yet";
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatMiniTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "Now";
    }

    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export function ContactsSidebar() {
    const { user } = useAuth();
    const supabase = useMemo(() => createSupabaseClient(), []);
    const [isHovered, setIsHovered] = useState(false);
    const [activeTab, setActiveTab] = useState<"messages" | "contacts">("messages");
    const [openChats, setOpenChats] = useState<OpenChatUser[]>([]);
    const [conversations, setConversations] = useState<ChatUser[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [conversationsError, setConversationsError] = useState<string | null>(null);
    const [chatStateById, setChatStateById] = useState<Record<string, MiniChatState>>({});
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuActionId, setMenuActionId] = useState<string | null>(null);
    const [sharedFilesChatId, setSharedFilesChatId] = useState<string | null>(null);
    const openChatsRef = useRef<OpenChatUser[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const refreshInFlightRef = useRef<Promise<ChatUser[]> | null>(null);
    const incomingQueueRef = useRef<Set<string>>(new Set());
    const lastTypingBroadcastRef = useRef<Map<string, boolean>>(new Map());
    const unreadSnapshotRef = useRef<Map<string, boolean>>(new Map());
    const hasUnreadSnapshotBootstrappedRef = useRef(false);
    const chatScrollRef = useRef<Record<string, HTMLDivElement | null>>({});
    const chatStateByIdRef = useRef<Record<string, MiniChatState>>({});
    const messageLoadedAtRef = useRef<Record<string, number>>({});

    const typingStopTimeoutRef = useRef<Map<string, number>>(new Map());
    const remoteTypingTimeoutRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        openChatsRef.current = openChats;
    }, [openChats]);

    useEffect(() => {
        chatStateByIdRef.current = chatStateById;
    }, [chatStateById]);

    useEffect(() => {
        openChats.forEach((chat) => {
            const container = chatScrollRef.current[chat.id];
            if (!container) {
                return;
            }

            container.scrollTop = container.scrollHeight;
        });
    }, [chatStateById, openChats]);

    const mapConversationToUser = useCallback((conversation: ConversationSummary): ChatUser => {
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
            unit: other?.role === "tenant" ? "Tenant" : other?.role === "landlord" ? "Landlord" : "Participant",
            relationshipStatus: conversation.relationshipStatus,
        };
    }, []);

    const refreshConversations = useCallback(async (showLoader = false) => {
        if (!showLoader && refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const requestPromise = (async () => {
        if (showLoader) {
            setIsLoadingConversations(true);
        }

        const { data, error } = await fetchConversations();

        if (error) {
            setConversationsError(error);
        } else {
            setConversationsError(null);
        }

        const mapped = data.map(mapConversationToUser);
        setConversations(mapped);

        if (showLoader) {
            setIsLoadingConversations(false);
        }

        return mapped;
        })();

        if (!showLoader) {
            refreshInFlightRef.current = requestPromise;
        }

        try {
            return await requestPromise;
        } finally {
            if (refreshInFlightRef.current === requestPromise) {
                refreshInFlightRef.current = null;
            }
        }
    }, [mapConversationToUser]);

    const activateChat = useCallback(async (conversationId: string) => {
        setOpenChats((prev) => prev.map((chat) => ({ ...chat, isActive: chat.id === conversationId })));
        setConversations((prev) => prev.map((conversation) => (
            conversation.id === conversationId ? { ...conversation, unread: false } : conversation
        )));
        await markConversationAsRead(conversationId);
    }, []);

    const ensureChatState = useCallback((conversationId: string) => {
        setChatStateById((prev) => {
            if (prev[conversationId]) {
                return prev;
            }

            return {
                ...prev,
                [conversationId]: DEFAULT_CHAT_STATE,
            };
        });
    }, []);

    const loadChatMessages = useCallback(async (conversationId: string, options?: { force?: boolean }) => {
        const force = Boolean(options?.force);
        const cachedState = chatStateByIdRef.current[conversationId];
        const cachedAt = messageLoadedAtRef.current[conversationId] ?? 0;
        const hasFreshCache = !force
            && Boolean(cachedState)
            && cachedState!.messages.length > 0
            && (Date.now() - cachedAt) < MESSAGE_CACHE_TTL_MS;

        if (hasFreshCache) {
            const activeChat = openChatsRef.current.find((chat) => chat.id === conversationId && chat.isActive);
            if (activeChat) {
                await markConversationAsRead(conversationId);
                setConversations((prev) => prev.map((conversation) => (
                    conversation.id === conversationId ? { ...conversation, unread: false } : conversation
                )));
            }
            return;
        }

        ensureChatState(conversationId);
        setChatStateById((prev) => ({
            ...prev,
            [conversationId]: {
                ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                isLoading: true,
                error: null,
            },
        }));

        const { data, error } = await fetchConversationMessages(conversationId, 80);
        const mapped: MiniChatMessage[] = data.map((message) => ({
            id: message.id,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
            isOwn: message.senderId === user?.id,
            status: message.senderId === user?.id ? (message.readAt ? "seen" : "delivered") : undefined,
            messageType: message.type,
            fileUrl: typeof message.metadata?.fileUrl === "string" ? message.metadata.fileUrl : null,
            fileMimeType: typeof message.metadata?.mimeType === "string" ? message.metadata.mimeType : null,
        }));

        setChatStateById((prev) => ({
            ...prev,
            [conversationId]: {
                ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                messages: mapped,
                isLoading: false,
                error,
            },
        }));

        if (!error) {
            messageLoadedAtRef.current[conversationId] = Date.now();
        }

        const activeChat = openChatsRef.current.find((chat) => chat.id === conversationId && chat.isActive);
        if (activeChat && !error) {
            await markConversationAsRead(conversationId);
            setConversations((prev) => prev.map((conversation) => (
                conversation.id === conversationId ? { ...conversation, unread: false } : conversation
            )));
        }
    }, [ensureChatState, user?.id]);

    const updateDraft = useCallback((conversationId: string, draft: string) => {
        setChatStateById((prev) => ({
            ...prev,
            [conversationId]: {
                ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                draft,
            },
        }));

        if (!user?.id || !channelRef.current) {
            return;
        }

        const isTyping = draft.trim().length > 0;
        const previouslyTyping = lastTypingBroadcastRef.current.get(conversationId) ?? false;
        if (isTyping !== previouslyTyping) {
            void channelRef.current.send({
                type: "broadcast",
                event: "typing",
                payload: {
                    conversationId,
                    userId: user.id,
                    isTyping,
                },
            });
            lastTypingBroadcastRef.current.set(conversationId, isTyping);
        }

        const existingTimeout = typingStopTimeoutRef.current.get(conversationId);
        if (existingTimeout) {
            window.clearTimeout(existingTimeout);
            typingStopTimeoutRef.current.delete(conversationId);
        }

        if (isTyping) {
            const timeoutId = window.setTimeout(() => {
                if (!channelRef.current || !user?.id) {
                    return;
                }

                void channelRef.current.send({
                    type: "broadcast",
                    event: "typing",
                    payload: {
                        conversationId,
                        userId: user.id,
                        isTyping: false,
                    },
                });
                lastTypingBroadcastRef.current.set(conversationId, false);
                typingStopTimeoutRef.current.delete(conversationId);
            }, 1100);
            typingStopTimeoutRef.current.set(conversationId, timeoutId);
        }
    }, [user?.id]);

    const sendMiniMessage = useCallback(async (conversationId: string) => {
        const current = chatStateById[conversationId] ?? DEFAULT_CHAT_STATE;
        const text = current.draft.trim();
        if (!text) {
            return;
        }

        const localId = `local-${Date.now()}`;
        setChatStateById((prev) => {
            const existing = prev[conversationId] ?? DEFAULT_CHAT_STATE;
            return {
                ...prev,
                [conversationId]: {
                    ...existing,
                    draft: "",
                    isSending: true,
                    error: null,
                    messages: [
                        ...existing.messages,
                        {
                            id: localId,
                            senderId: user?.id ?? "",
                            content: text,
                            createdAt: new Date().toISOString(),
                            isOwn: true,
                            status: "sending",
                            messageType: "text",
                        },
                    ],
                },
            };
        });

        try {
            await sendConversationMessage(conversationId, text);
            await loadChatMessages(conversationId, { force: true });
            await refreshConversations();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to send message.";
            setChatStateById((prev) => {
                const existing = prev[conversationId] ?? DEFAULT_CHAT_STATE;
                return {
                    ...prev,
                    [conversationId]: {
                        ...existing,
                        isSending: false,
                        error: message,
                        draft: text,
                        messages: existing.messages.filter((entry) => entry.id !== localId),
                    },
                };
            });
            return;
        }

        setChatStateById((prev) => ({
            ...prev,
            [conversationId]: {
                ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                isSending: false,
                error: null,
            },
        }));
    }, [chatStateById, loadChatMessages, refreshConversations, user?.id]);

    const uploadMiniFile = useCallback(async (conversationId: string, file: File) => {
        if (!file) {
            return;
        }

        setChatStateById((prev) => ({
            ...prev,
            [conversationId]: {
                ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                isUploading: true,
                error: null,
            },
        }));

        try {
            await uploadConversationFile(conversationId, file);
            await loadChatMessages(conversationId, { force: true });
            await refreshConversations();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to upload file.";
            setChatStateById((prev) => ({
                ...prev,
                [conversationId]: {
                    ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                    error: message,
                },
            }));
        } finally {
            setChatStateById((prev) => ({
                ...prev,
                [conversationId]: {
                    ...(prev[conversationId] ?? DEFAULT_CHAT_STATE),
                    isUploading: false,
                },
            }));
        }
    }, [loadChatMessages, refreshConversations]);

    useEffect(() => {
        let isCancelled = false;

        const loadConversations = async () => {
            const mapped = await refreshConversations(true);
            if (isCancelled) {
                return;
            }

            setOpenChats((prev) => prev.map((chat) => {
                const latest = mapped.find((conversation) => conversation.id === chat.id);
                return latest ? { ...chat, ...latest, isActive: chat.isActive } : chat;
            }));

            const openIds = openChatsRef.current.map((chat) => chat.id);
            await Promise.all(openIds.map((conversationId) => loadChatMessages(conversationId)));
        };

        loadConversations();

        return () => {
            isCancelled = true;
        };
    }, [loadChatMessages, refreshConversations]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        const channel = supabase
            .channel(`landlord-sidebar-incoming-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    const incoming = payload.new as { conversation_id?: string; sender_id?: string };
                    const conversationId = incoming.conversation_id;
                    if (!conversationId || incoming.sender_id === user.id) {
                        return;
                    }

                    if (incomingQueueRef.current.has(conversationId)) {
                        return;
                    }
                    incomingQueueRef.current.add(conversationId);

                    try {

                    const updatedConversations = await refreshConversations();
                    const updatedConversation = updatedConversations.find((item) => item.id === conversationId);
                    if (!updatedConversation) {
                        incomingQueueRef.current.delete(conversationId);
                        return;
                    }

                    const activeChat = openChatsRef.current.find((chat) => chat.id === conversationId && chat.isActive);
                    if (activeChat) {
                        setConversations((prev) => prev.map((conversation) => (
                            conversation.id === conversationId ? { ...conversation, unread: false } : conversation
                        )));
                        await markConversationAsRead(conversationId);
                    }

                    await loadChatMessages(conversationId, { force: true });

                    setOpenChats((prev) => {
                        const base = prev.map((chat) => ({ ...chat, isActive: false }));
                        const existingIndex = base.findIndex((chat) => chat.id === conversationId);
                        if (existingIndex >= 0) {
                            return base.map((chat, index) => (
                                index === existingIndex
                                    ? { ...chat, ...updatedConversation, isActive: true }
                                    : chat
                            ));
                        }

                        ensureChatState(conversationId);
                        const next = [...base, { ...updatedConversation, isActive: true }];
                        if (next.length > 3) {
                            next.shift();
                        }
                        return next;
                    });
                    } finally {
                        incomingQueueRef.current.delete(conversationId);
                    }
                }
            )
            .on(
                "broadcast",
                { event: "typing" },
                ({ payload }) => {
                    if (!payload || typeof payload !== "object") {
                        return;
                    }

                    const candidate = payload as { conversationId?: string; userId?: string; isTyping?: boolean };
                    if (!candidate.conversationId || !candidate.userId || candidate.userId === user.id) {
                        return;
                    }

                    setChatStateById((prev) => ({
                        ...prev,
                        [candidate.conversationId!]: {
                            ...(prev[candidate.conversationId!] ?? DEFAULT_CHAT_STATE),
                            isOtherUserTyping: Boolean(candidate.isTyping),
                        },
                    }));

                    const currentTimeout = remoteTypingTimeoutRef.current.get(candidate.conversationId);
                    if (currentTimeout) {
                        window.clearTimeout(currentTimeout);
                        remoteTypingTimeoutRef.current.delete(candidate.conversationId);
                    }

                    if (candidate.isTyping) {
                        const timeoutId = window.setTimeout(() => {
                            setChatStateById((prev) => ({
                                ...prev,
                                [candidate.conversationId!]: {
                                    ...(prev[candidate.conversationId!] ?? DEFAULT_CHAT_STATE),
                                    isOtherUserTyping: false,
                                },
                            }));
                            remoteTypingTimeoutRef.current.delete(candidate.conversationId!);
                        }, 1700);
                        remoteTypingTimeoutRef.current.set(candidate.conversationId, timeoutId);
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            channelRef.current = null;
            supabase.removeChannel(channel);
            typingStopTimeoutRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            remoteTypingTimeoutRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            typingStopTimeoutRef.current.clear();
            remoteTypingTimeoutRef.current.clear();
            lastTypingBroadcastRef.current.clear();
            incomingQueueRef.current.clear();
        };
    }, [ensureChatState, loadChatMessages, refreshConversations, supabase, user?.id]);

    const hasUnreadConversations = useMemo(
        () => conversations.some((conversation) => conversation.unread),
        [conversations]
    );

    const openChat = async (chatUser: ChatUser) => {
        ensureChatState(chatUser.id);
        setOpenChats((prev) => {
            const existing = prev.find((chat) => chat.id === chatUser.id);
            if (existing) {
                return prev.map((chat) => ({ ...chat, isActive: chat.id === chatUser.id }));
            }

            const next = [...prev.map((chat) => ({ ...chat, isActive: false })), { ...chatUser, isActive: true }];
            if (next.length > 3) {
                next.shift();
            }
            return next;
        });

        await loadChatMessages(chatUser.id);
        await activateChat(chatUser.id);
    };

    const closeChat = (id: string) => {
        setOpenChats((prev) => prev.filter((c) => c.id !== id));
        if (sharedFilesChatId === id) {
            setSharedFilesChatId(null);
        }
    };

    const popOutIncomingChat = useCallback((conversation: ChatUser, isActive: boolean) => {
        ensureChatState(conversation.id);
        setOpenChats((prev) => {
            const base = prev.map((chat) => ({ ...chat, isActive: isActive ? false : chat.isActive }));
            const existingIndex = base.findIndex((chat) => chat.id === conversation.id);

            if (existingIndex >= 0) {
                return base.map((chat, index) => (
                    index === existingIndex
                        ? { ...chat, ...conversation, isActive }
                        : chat
                ));
            }

            const next = [...base, { ...conversation, isActive }];
            if (next.length > 3) {
                next.shift();
            }
            return next;
        });
    }, [ensureChatState]);

    const sharedFiles = useMemo(() => {
        if (!sharedFilesChatId) {
            return [] as MiniChatMessage[];
        }

        const messages = chatStateById[sharedFilesChatId]?.messages ?? [];
        return messages.filter((message) => Boolean(message.fileUrl));
    }, [chatStateById, sharedFilesChatId]);

    useEffect(() => {
        const snapshot = new Map<string, boolean>();
        conversations.forEach((conversation) => {
            snapshot.set(conversation.id, Boolean(conversation.unread));
        });
        unreadSnapshotRef.current = snapshot;
        hasUnreadSnapshotBootstrappedRef.current = true;
    }, [conversations]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        const intervalId = window.setInterval(() => {
            void (async () => {
                const mapped = await refreshConversations(false);
                if (!hasUnreadSnapshotBootstrappedRef.current) {
                    return;
                }

                const previous = unreadSnapshotRef.current;
                const next = new Map<string, boolean>();

                mapped.forEach((conversation) => {
                    const nowUnread = Boolean(conversation.unread);
                    const wasUnread = previous.get(conversation.id) ?? false;
                    next.set(conversation.id, nowUnread);

                    if (!wasUnread && nowUnread) {
                        popOutIncomingChat(conversation, false);
                        void loadChatMessages(conversation.id, { force: true });
                    }
                });

                unreadSnapshotRef.current = next;
            })();
        }, 6000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [loadChatMessages, popOutIncomingChat, refreshConversations, user?.id]);

    const submitMenuAction = useCallback(async (chat: OpenChatUser, action: "archive" | "block") => {
        if (!chat.participantUserId) {
            setConversationsError("Unable to identify this user for the selected action.");
            setOpenMenuId(null);
            return;
        }

        const actionToken = `${chat.id}:${action}`;
        setMenuActionId(actionToken);
        setConversationsError(null);

        try {
            const response = await fetch(`/api/messages/users/${chat.participantUserId}/actions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action }),
            });

            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to update action.");
            }

            await refreshConversations();
            closeChat(chat.id);
            setOpenMenuId(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update action.";
            setConversationsError(message);
        } finally {
            setMenuActionId(null);
        }
    }, [refreshConversations]);

    const submitMenuReport = useCallback(async (chat: OpenChatUser) => {
        if (!chat.participantUserId) {
            setConversationsError("Unable to identify this user for reporting.");
            setOpenMenuId(null);
            return;
        }

        const actionToken = `${chat.id}:report`;
        setMenuActionId(actionToken);
        setConversationsError(null);

        try {
            const response = await fetch(`/api/messages/users/${chat.participantUserId}/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId: chat.id,
                    category: "other",
                    details: "Submitted from mini chat widget.",
                }),
            });

            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to submit report.");
            }

            setOpenMenuId(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to submit report.";
            setConversationsError(message);
        } finally {
            setMenuActionId(null);
        }
    }, []);

    const renderOutgoingStatus = (status: MiniChatMessage["status"], timestamp: string) => {
        switch (status) {
            case "sending":
                return (
                    <>
                        <Clock3 className="h-3 w-3" />
                        <span>Sending</span>
                        <span className="text-muted-foreground">• {timestamp}</span>
                    </>
                );
            case "delivered":
                return (
                    <>
                        <CheckCheck className="h-3 w-3" />
                        <span>Delivered</span>
                        <span className="text-muted-foreground">• {timestamp}</span>
                    </>
                );
            case "seen":
                return (
                    <>
                        <CheckCheck className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Seen</span>
                        <span className="text-muted-foreground">• {timestamp}</span>
                    </>
                );
            default:
                return (
                    <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
                        <span className="text-muted-foreground">• {timestamp}</span>
                    </>
                );
        }
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={cn(
                    "fixed top-0 right-0 z-50 flex h-full flex-col overflow-hidden border-l border-border bg-card text-foreground shadow-2xl transition-all duration-500 ease-in-out dark:border-white/5 dark:bg-neutral-900",
                    isHovered ? "w-80" : "w-[88px]"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header Toggle */}
                <div className="flex min-h-[88px] shrink-0 flex-col justify-center border-b border-border p-6 dark:border-white/5">
                    {!isHovered && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative cursor-default rounded-xl bg-muted p-2.5 dark:bg-white/5">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                {hasUnreadConversations && (
                                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500 ring-2 ring-card dark:ring-neutral-900"></span>
                                )}
                            </div>
                        </div>
                    )}

                    {isHovered && (
                        <div className="relative flex w-full rounded-xl bg-muted p-1 animate-in fade-in duration-500 dark:bg-black/40">
                            <button
                                onClick={() => setActiveTab("messages")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "messages" ? "text-foreground dark:text-white" : "text-muted-foreground hover:text-foreground dark:hover:text-neutral-300"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Messages
                            </button>
                            <button
                                onClick={() => setActiveTab("contacts")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "contacts" ? "text-foreground dark:text-white" : "text-muted-foreground hover:text-foreground dark:hover:text-neutral-300"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Contacts
                            </button>

                            {/* Sliding Active Background */}
                            <div
                                className="absolute top-1 bottom-1 z-0 w-[calc(50%-4px)] rounded-lg bg-card shadow-sm transition-transform duration-300 ease-out dark:bg-neutral-800"
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
                                {conversations.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => openChat(msg)}
                                        className={cn(
                                            "flex items-center gap-3 transition-colors text-left group rounded-2xl",
                                            isHovered ? "p-3 hover:bg-muted/80 dark:hover:bg-white/[0.04]" : "p-1 justify-center hover:scale-110"
                                        )}
                                    >
                                        <ProfileCardTrigger 
                                            userId={msg.participantUserId || ""} 
                                            initialData={{ full_name: msg.name, avatar_url: msg.avatar, role: msg.role as any }}
                                            asChild
                                        >
                                            <div className="relative shrink-0">
                                                <div 
                                                    className="h-10 w-10 rounded-full border-2 border-background overflow-hidden"
                                                    style={{ backgroundColor: msg.avatarBgColor || '#171717' }}
                                                >
                                                    <img
                                                        src={msg.avatar}
                                                        alt={msg.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                {msg.unread && (
                                                    <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-card bg-red-500 dark:border-neutral-900" />
                                                )}
                                            </div>
                                        </ProfileCardTrigger>
                                        {isHovered && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex min-w-0 items-center gap-2 pr-2">
                                                        <ProfileCardTrigger 
                                                            userId={msg.participantUserId || ""} 
                                                            initialData={{ full_name: msg.name, avatar_url: msg.avatar, role: msg.role as any }}
                                                        >
                                                            <h4 className={cn("text-sm truncate transition-colors group-hover:text-primary", msg.unread ? "font-bold text-foreground dark:text-white" : "font-medium text-foreground/80 dark:text-neutral-200")}>
                                                                {msg.name}
                                                            </h4>
                                                        </ProfileCardTrigger>
                                                        <RoleBadge role={msg.role} />
                                                    </div>
                                                    <span className="shrink-0 text-[10px] text-muted-foreground">{msg.time}</span>
                                                </div>
                                                <p className={cn("truncate text-xs", msg.unread ? "font-medium text-foreground/80 dark:text-neutral-300" : "text-muted-foreground")}>
                                                    {msg.lastMessage}
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {!isLoadingConversations && conversations.length === 0 && (
                                    <div className={cn("text-xs text-muted-foreground", isHovered ? "px-2 pt-2" : "text-center")}>No conversations yet</div>
                                )}

                                {!isLoadingConversations && conversationsError && (
                                    <div className={cn("text-xs text-red-500 dark:text-red-400", isHovered ? "px-2 pt-2" : "text-center")}>{conversationsError}</div>
                                )}
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
                                {conversations.map((contact) => (
                                    <ContactCard
                                        key={contact.id}
                                        name={contact.name}
                                        role={contact.role}
                                        unit={contact.unit}
                                        avatar={contact.avatar}
                                        avatarBgColor={contact.avatarBgColor}
                                        status={contact.relationshipStatus === "tenant_landlord" ? "Active" : contact.relationshipStatus === "prospective" ? "Prospective" : "Conversation"}
                                        isExpanded={isHovered}
                                    />
                                ))}

                                {!isLoadingConversations && conversations.length === 0 && (
                                    <div className={cn("text-xs text-muted-foreground", isHovered ? "px-2 pt-2" : "text-center")}>No contacts yet</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer View All */}
                {isHovered && (
                    <div className="shrink-0 border-t border-border bg-card p-4 animate-in fade-in duration-500 dark:border-white/5 dark:bg-neutral-900">
                        <Link href="/landlord/tenants" className="flex w-full items-center justify-center rounded-xl border border-border bg-muted py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                            {activeTab === "messages" ? "View All Messages" : "View All Tenants"}
                        </Link>
                    </div>
                )}
            </div>

            {/* Render Multiple Chatboxes Horizontally (Anchored next to Sidebar) */}
            <div className={cn(
                "fixed bottom-0 flex items-end gap-4 z-[55] pointer-events-none transition-all duration-500 ease-in-out",
                isHovered ? "right-[340px]" : "right-[110px]"
            )}
                style={{ bottom: "max(0px, env(safe-area-inset-bottom))" }}
            >
                <AnimatePresence>
                    {openChats.map((chat) => (
                        (() => {
                            const chatState = chatStateById[chat.id] ?? DEFAULT_CHAT_STATE;
                            return (
                        <motion.div
                            key={chat.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClickCapture={() => {
                                if (!chat.isActive) {
                                    void activateChat(chat.id);
                                }
                            }}
                            className={cn(
                                "pointer-events-auto flex h-[400px] w-[320px] flex-col rounded-t-2xl border border-b-0 shadow-[0_-18px_40px_rgba(0,0,0,0.18)] transition-all",
                                chat.isActive
                                    ? "border-border bg-card dark:border-white/10 dark:bg-neutral-900"
                                    : "border-border/80 bg-card/95 opacity-90 dark:border-white/20 dark:bg-neutral-900/90"
                            )}
                        >
                            {/* Chatbox Header */}
                            <div
                                className={cn(
                                    "flex items-center justify-between p-3 border-b rounded-t-2xl cursor-pointer transition-colors",
                                    chat.isActive
                                        ? "border-emerald-400/25 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/12 dark:hover:bg-emerald-500/20"
                                        : "border-amber-400/20 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
                                )}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative shrink-0">
                                        <div 
                                            className="h-8 w-8 rounded-full border border-border dark:border-white/10 overflow-hidden"
                                            style={{ backgroundColor: chat.avatarBgColor || '#171717' }}
                                        >
                                            <img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500 dark:border-neutral-900" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <h4 className="truncate text-sm font-bold text-foreground hover:underline dark:text-white">{chat.name}</h4>
                                            <RoleBadge role={chat.role} />
                                        </div>
                                        {chat.isActive && (
                                            <p className="text-[10px] text-emerald-400">Active</p>
                                        )}
                                    </div>
                                </div>
                                    <div className="relative flex shrink-0 items-center gap-0.5 text-muted-foreground">
                                    <Link href="/landlord/messages" className="rounded-lg p-1.5 transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </Link>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                            }}
                                            className="rounded-lg p-1.5 transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                        
                                        {/* Kebab Menu Dropdown */}
                                        {openMenuId === chat.id && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                    }} 
                                                />
                                                <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-neutral-800">
                                                    <Link 
                                                        href={chat.participantUserId ? `/visitor/${chat.participantUserId}` : "/landlord/messages"}
                                                        onClick={() => setOpenMenuId(null)}
                                                        className="block w-full px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
                                                    >
                                                        View Profile
                                                    </Link>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setSharedFilesChatId(chat.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="block w-full px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
                                                    >
                                                        View Shared Files
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuAction(chat, "archive");
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="w-full px-4 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
                                                    >
                                                        {menuActionId === `${chat.id}:archive` ? "Archiving..." : "Archive Chat"}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuReport(chat);
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="mt-1 w-full border-t border-border px-4 py-2 text-left text-xs text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        {menuActionId === `${chat.id}:report` ? "Reporting..." : "Report User"}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuAction(chat, "block");
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="w-full px-4 py-2 text-left text-xs text-orange-500 transition-colors hover:bg-orange-500/10 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
                                                    >
                                                        {menuActionId === `${chat.id}:block` ? "Blocking..." : "Block Contact"}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => closeChat(chat.id)} className="rounded-lg p-1.5 transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Chatbox Body */}
                            <div
                                ref={(node) => {
                                    chatScrollRef.current[chat.id] = node;
                                }}
                                className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto bg-background/80 p-4 dark:bg-[#0a0a0a]/50"
                            >
                                {chatState.isLoading && (
                                    <p className="text-center text-xs text-muted-foreground">Loading conversation...</p>
                                )}
                                {!chatState.isLoading && chatState.messages.length === 0 && (
                                    <p className="text-center text-xs text-muted-foreground">No messages yet</p>
                                )}
                                {chatState.messages.map((message) => {
                                    const hasImage = Boolean(message.fileUrl && (message.fileMimeType?.startsWith("image/") || message.content.match(/\.(jpeg|jpg|gif|png|webp)/i)));
                                    const hasFile = Boolean(message.fileUrl && !hasImage);

                                    return (
                                    <div key={message.id} className={cn("flex flex-col w-full gap-1 mb-2 animate-in fade-in duration-300", message.isOwn ? "items-end slide-in-from-right-2" : "items-start slide-in-from-left-2")}>
                                        <div className={cn(
                                            "text-sm px-4 py-2.5 rounded-2xl max-w-[85%] border break-words [overflow-wrap:anywhere]",
                                            message.isOwn
                                                ? "bg-primary text-primary-foreground border-primary/30 rounded-br-sm font-medium shadow-sm transition-all"
                                                : "rounded-bl-sm border-border bg-muted text-foreground dark:border-white/5 dark:bg-neutral-800 dark:text-neutral-200",
                                            hasFile && "mr-0 border-none bg-transparent px-0 py-0 text-foreground shadow-none dark:text-white",
                                            hasImage && "border-border bg-white/70 p-1 dark:border-white/10 dark:bg-black/40"
                                        )}>
                                            {hasImage && message.fileUrl && (
                                                <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block w-full overflow-hidden rounded-xl bg-white/70 dark:bg-black/40">
                                                    <img src={message.fileUrl} alt="Shared image" className="w-full max-h-48 object-contain" />
                                                </a>
                                            )}

                                            {hasFile && message.fileUrl && (
                                                <a
                                                    href={message.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 p-3 dark:border-white/10 dark:bg-neutral-900/80"
                                                >
                                                    <div className="shrink-0 rounded-lg bg-muted p-2 dark:bg-white/10">
                                                        <File className="h-4 w-4 text-foreground dark:text-neutral-100" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-foreground dark:text-neutral-100">{message.content || "Attachment"}</p>
                                                    </div>
                                                </a>
                                            )}

                                            {!message.fileUrl && (
                                                <span className="leading-relaxed whitespace-pre-wrap">{message.content}</span>
                                            )}
                                        </div>
                                        <div className={cn("flex items-center gap-1 text-[10px]", message.isOwn ? "text-muted-foreground" : "px-1 text-muted-foreground")}>
                                            {message.isOwn
                                                ? renderOutgoingStatus(message.status, formatMiniTimestamp(message.createdAt))
                                                : <span>{formatMiniTimestamp(message.createdAt)}</span>
                                            }
                                        </div>
                                    </div>
                                )})}
                                {chatState.isOtherUserTyping && (
                                    <div className="flex items-end gap-2 w-full justify-start max-w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="rounded-2xl rounded-bl-sm border border-border bg-muted px-3 py-2 text-foreground shadow-sm dark:border-white/5 dark:bg-neutral-800 dark:text-white">
                                            <div className="flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.2s]" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.1s]" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {chatState.error && (
                                    <p className="text-center text-xs text-red-500 dark:text-red-400">{chatState.error}</p>
                                )}
                            </div>

                            {/* Chatbox Input */}
                            <div className="flex flex-col gap-2 border-t border-border bg-card p-3 dark:border-white/10 dark:bg-neutral-900">
                                <div className="flex items-center gap-2">
                                    <label className={cn("p-1.5 transition-colors", chat.isActive ? "cursor-pointer text-muted-foreground hover:text-foreground dark:hover:text-white" : "cursor-not-allowed text-muted-foreground/60")}>
                                        <MoreHorizontal className="w-4 h-4" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            disabled={!chat.isActive || chatState.isUploading}
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                event.currentTarget.value = "";
                                                if (file) {
                                                    void uploadMiniFile(chat.id, file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <div className="flex flex-1 items-center rounded-full border border-border bg-background px-3 py-1.5 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary dark:border-white/10 dark:bg-white/5">
                                        <input
                                            type="text"
                                            placeholder={chat.isActive ? "Aa" : "Click header to activate"}
                                            disabled={!chat.isActive}
                                            value={chatState.draft}
                                            onChange={(event) => updateDraft(chat.id, event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" && !event.shiftKey) {
                                                    event.preventDefault();
                                                    void sendMiniMessage(chat.id);
                                                }
                                            }}
                                            className="w-full border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none dark:text-white dark:placeholder:text-neutral-500"
                                        />
                                    </div>
                                    <button
                                        disabled={!chat.isActive || chatState.isSending || chatState.isUploading}
                                        onClick={() => void sendMiniMessage(chat.id)}
                                        className={cn(
                                            "p-1.5 transition-colors",
                                            chat.isActive && !chatState.isSending && !chatState.isUploading ? "text-primary hover:text-primary/80" : "cursor-not-allowed text-muted-foreground/60"
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                {chatState.isUploading && <p className="text-[10px] text-muted-foreground">Uploading attachment...</p>}
                            </div>
                        </motion.div>
                            );
                        })()
                    ))}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {sharedFilesChatId && (
                    <>
                        <motion.button
                            type="button"
                            className="fixed inset-0 bg-black/60 z-[75]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSharedFilesChatId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            className="fixed bottom-6 right-6 z-[80] max-h-[70vh] w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl dark:border-white/10 dark:bg-neutral-900"
                        >
                            <div className="flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 dark:border-white/10 dark:bg-neutral-900/90">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground dark:text-white">Shared Files</p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        {openChats.find((chat) => chat.id === sharedFilesChatId)?.name ?? "Conversation"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSharedFilesChatId(null)}
                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-[calc(70vh-62px)] overflow-y-auto custom-scrollbar p-3 space-y-2">
                                {sharedFiles.length === 0 && (
                                    <p className="py-5 text-center text-xs text-muted-foreground">No shared files in this chat yet.</p>
                                )}
                                {sharedFiles.map((message) => {
                                    const isImage = Boolean(message.fileMimeType?.startsWith("image/"));
                                    return (
                                        <a
                                            key={message.id}
                                            href={message.fileUrl ?? "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border border-border bg-muted/40 p-2 transition-colors hover:bg-muted dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/50"
                                        >
                                            {isImage && message.fileUrl ? (
                                                <img
                                                    src={message.fileUrl}
                                                    alt="Shared file"
                                                    className="w-full max-h-36 rounded-lg bg-white/80 object-contain dark:bg-black/60"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-foreground dark:text-neutral-100">
                                                    <span className="rounded-lg bg-card p-2 dark:bg-white/10"><File className="h-4 w-4" /></span>
                                                    <span className="text-xs font-medium truncate">{message.content || "Attachment"}</span>
                                                </div>
                                            )}
                                            <p className="mt-2 text-[10px] text-muted-foreground">{formatMiniTimestamp(message.createdAt)}</p>
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

type ContactCardProps = {
    name: string;
    role: BadgeRole | null;
    unit: string;
    avatar: string;
    avatarBgColor: string | null;
    status: string;
    isExpanded: boolean;
};

function ContactCard({ name, role, unit, avatar, avatarBgColor, status, isExpanded }: ContactCardProps) {
    const isIssue = status === "Late Payment" || status === "Notice Given";

    return (
        <div className={cn(
            "group flex shrink-0 cursor-pointer items-center gap-4 rounded-2xl border border-transparent transition-all hover:border-border hover:bg-muted/70 dark:hover:border-white/5 dark:hover:bg-white/[0.04]",
            isExpanded ? "p-3" : "p-1 justify-center hover:scale-110"
        )}>
            <div className="relative shrink-0">
                <div 
                    className="h-10 w-10 rounded-full border-2 border-background overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: avatarBgColor || '#171717' }}
                >
                    <img
                        src={avatar}
                        alt={name}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    isIssue ? "bg-red-500" : status === "Moving In" ? "bg-amber-500" : "bg-emerald-500"
                )} />
            </div>

            {isExpanded && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary dark:text-white">{name}</h4>
                            <RoleBadge role={role} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="truncate pr-2 text-xs font-medium text-muted-foreground">{unit}</p>
                        <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground dark:group-hover:text-white">
                            <span className="text-[10px] text-muted-foreground">{status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
