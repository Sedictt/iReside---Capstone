"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, Phone, MoreHorizontal, MessageSquare, Video, X, Send, Maximize2, Check, CheckCheck, Clock3, MoreVertical, File, HandCoins, Bell, TrendingUp, AlertTriangle, CheckCircle2, History, Zap, Wallet, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChatWidget } from "./ChatWidget";
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
import { NotificationCard } from "@/components/messaging/NotificationCard";
import { OfficialReceipt } from "@/components/messaging/OfficialReceipt";

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
    systemType?: string;
    metadata?: Record<string, any> | null;
    workflowStatus?: string;
    issueType?: string;
    invoiceId?: string;
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

export function TenantContactsSidebar() {
    const { user } = useAuth();
    const supabase = useMemo(() => createSupabaseClient(), []);
    const [isHovered, setIsHovered] = useState(false);
    const [activeTab, setActiveTab] = useState<"messages" | "contacts">("messages");
    const [openChats, setOpenChats] = useState<OpenChatUser[]>([]);
    const [isIrisOpen, setIsIrisOpen] = useState(false);
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
            unit: other?.role === "landlord" ? "Landlord" : other?.role === "tenant" ? "Tenant" : "Participant",
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
            systemType: message.metadata?.systemType as string | undefined,
            workflowStatus: message.metadata?.workflowStatus as string | undefined,
            issueType: message.metadata?.issueType as string | undefined,
            invoiceId: message.metadata?.invoiceId as string | undefined,
            metadata: message.metadata,
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
            .channel(`tenant-sidebar-incoming-${user.id}`)
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
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
            case "delivered":
                return (
                    <>
                        <CheckCheck className="h-3 w-3" />
                        <span>Delivered</span>
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
            case "seen":
                return (
                    <>
                        <CheckCheck className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Seen</span>
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
            default:
                return (
                    <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
        }
    };

    return (
        <>
            {/* Sidebar */}
            <div
                data-tour-id="tour-messages-sidebar"
                className={cn(
                    "hidden md:flex fixed top-0 right-0 h-screen bg-card/60 border-l border-border z-50 transition-all duration-500 ease-in-out flex-col shadow-2xl overflow-hidden backdrop-blur-2xl",
                    isHovered ? "w-80" : "w-[88px]"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Header Toggle */}
                <div className="p-6 border-b border-border flex flex-col shrink-0 min-h-[88px] justify-center">
                    {!isHovered && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative p-2.5 bg-muted rounded-xl cursor-default border border-border">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                {hasUnreadConversations && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-card animate-pulse"></span>
                                )}
                            </div>
                        </div>
                    )}

                    {isHovered && (
                        <div className="flex w-full bg-muted rounded-xl p-1 relative animate-in fade-in duration-500 border border-border">
                            <button
                                onClick={() => setActiveTab("messages")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "messages" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                Messages
                            </button>
                            <button
                                onClick={() => setActiveTab("contacts")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all relative z-10",
                                    activeTab === "contacts" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Contacts
                            </button>

                            {/* Sliding Active Background */}
                            <div
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-card rounded-lg border border-border shadow-sm transition-transform duration-300 ease-out z-0"
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
                                {/* Pinned iRis Assistant */}
                                <button
                                    onClick={() => setIsIrisOpen(true)}
                                    className={cn(
                                        "flex items-center gap-3 transition-colors text-left group rounded-2xl border border-primary/20",
                                        isHovered ? "p-3 bg-primary/5 hover:bg-primary/10" : "p-1 justify-center hover:scale-110"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white overflow-hidden border-2 border-card">
                                            <img src="/logos/favicon.png" alt="iRis" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary animate-pulse border-2 border-card" />
                                    </div>
                                    {isHovered && (
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="text-sm font-bold text-primary truncate pr-2 transition-colors">
                                                    iRis Assistant
                                                </h4>
                                                <span className="text-[10px] text-primary shrink-0 opacity-80 uppercase tracking-widest font-black">AI</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium truncate">
                                                How can I help you today?
                                            </p>
                                        </div>
                                    )}
                                </button>

                                {conversations.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => openChat(msg)}
                                        className={cn(
                                            "flex items-center gap-3 transition-colors text-left group rounded-2xl",
                                            isHovered ? "p-3 hover:bg-muted/60" : "p-1 justify-center hover:scale-110"
                                        )}
                                    >
                                        <ProfileCardTrigger 
                                            userId={msg.participantUserId || ""} 
                                            initialData={{ full_name: msg.name, avatar_url: msg.avatar, role: msg.role as any }}
                                            asChild
                                        >
                                            <div className="relative shrink-0">
                                                <div
                                                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-card"
                                                    style={{ backgroundColor: msg.avatarBgColor || '#171717' }}
                                                >
                                                    <img
                                                        src={msg.avatar}
                                                        alt={msg.name}
                                                        className="w-10 h-10 object-cover"
                                                    />
                                                </div>
                                                {msg.unread && (
                                                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-card" />
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
                                                            <h4 className={cn("text-sm truncate transition-colors group-hover:text-primary", msg.unread ? "font-bold text-foreground dark:text-white" : "font-medium text-slate-700 dark:text-neutral-200")}>
                                                                {msg.name}
                                                            </h4>
                                                        </ProfileCardTrigger>
                                                        <RoleBadge role={msg.role} />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                                                </div>
                                                <p className={cn("text-xs truncate", msg.unread ? "text-slate-600 dark:text-neutral-300 font-medium" : "text-muted-foreground dark:text-neutral-400")}>
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
                                    <div className={cn("text-xs text-red-600", isHovered ? "px-2 pt-2" : "text-center")}>{conversationsError}</div>
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
                    <div className="p-4 border-t border-border shrink-0 bg-card/95 animate-in fade-in duration-500">
                        <Link href="/tenant/messages" className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-sm font-bold text-primary-foreground transition-colors border border-primary/30 flex items-center justify-center shadow-sm">
                            Open Full Messaging
                        </Link>
                    </div>
                )}
            </div>

            {/* Render Multiple Chatboxes Horizontally (Anchored next to Sidebar) */}
            <div className={cn(
                "hidden md:flex fixed bottom-0 items-end gap-4 z-[55] pointer-events-none transition-all duration-500 ease-in-out",
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
                                "w-[320px] h-[400px] border border-b-0 rounded-t-2xl shadow-[0_-18px_40px_rgba(0,0,0,0.32)] flex flex-col pointer-events-auto overflow-hidden transition-all",
                                chat.isActive
                                    ? "bg-card border-border"
                                    : "bg-card/95 border-border opacity-95"
                            )}
                        >
                            {/* Chatbox Header */}
                            <div
                                className={cn(
                                    "flex items-center justify-between p-3 border-b rounded-t-2xl cursor-pointer transition-colors",
                                    chat.isActive
                                        ? "border-emerald-400/25 bg-emerald-500/12 hover:bg-emerald-500/20"
                                        : "border-amber-400/20 bg-amber-500/10 hover:bg-amber-500/15"
                                )}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="relative shrink-0">
                                        <div
                                            className="w-8 h-8 rounded-full overflow-hidden border border-border"
                                            style={{ backgroundColor: chat.avatarBgColor || '#171717' }}
                                        >
                                            <img src={chat.avatar} alt={chat.name} className="w-8 h-8 object-cover" />
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <h4 className="text-sm font-bold text-foreground truncate hover:underline">{chat.name}</h4>
                                            <RoleBadge role={chat.role} />
                                        </div>
                                        {chat.isActive && (
                                            <p className="text-[10px] text-emerald-400">Active</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground relative">
                                    <Link href="/tenant/messages" className="p-1.5 hover:bg-muted rounded-lg hover:text-foreground transition-colors">
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </Link>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                            }}
                                            className="p-1.5 hover:bg-muted rounded-lg hover:text-foreground transition-colors"
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
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                                    <Link 
                                                        href={chat.participantUserId ? `/visitor/${chat.participantUserId}` : "/tenant/messages"}
                                                        onClick={() => setOpenMenuId(null)}
                                                        className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors block"
                                                    >
                                                        View Profile
                                                    </Link>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setSharedFilesChatId(chat.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors block"
                                                    >
                                                        View Shared Files
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuAction(chat, "archive");
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {menuActionId === `${chat.id}:archive` ? "Archiving..." : "Archive Chat"}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuReport(chat);
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-colors border-t border-border mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {menuActionId === `${chat.id}:report` ? "Reporting..." : "Report User"}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void submitMenuAction(chat, "block");
                                                        }}
                                                        disabled={menuActionId !== null}
                                                        className="w-full text-left px-4 py-2 text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {menuActionId === `${chat.id}:block` ? "Blocking..." : "Block Contact"}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={() => closeChat(chat.id)} className="p-1.5 hover:bg-muted rounded-lg hover:text-foreground transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Chatbox Body (Dummy Content) */}
                            <div
                                ref={(node) => {
                                    chatScrollRef.current[chat.id] = node;
                                }}
                                className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-background/60"
                            >
                                {chatState.isLoading && (
                                    <p className="text-xs text-muted-foreground text-center">Loading conversation...</p>
                                )}
                                {!chatState.isLoading && chatState.messages.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center">No messages yet</p>
                                )}
                                {chatState.messages.map((message) => {
                                    if (message.messageType === "system") {
                                        return (
                                            <div key={message.id} className="flex w-full justify-center my-6 px-2">
                                                <MiniSystemMessage message={message} router={router} />
                                            </div>
                                        );
                                    }
                                    const hasImage = Boolean(message.fileUrl && message.fileMimeType?.startsWith("image/"));
                                    const hasFile = Boolean(message.fileUrl && !message.fileMimeType?.startsWith("image/"));

                                    return (
                                    <div key={message.id} className={cn("flex flex-col w-full gap-1 mb-2 animate-in fade-in duration-300", message.isOwn ? "items-end slide-in-from-right-2" : "items-start slide-in-from-left-2")}>
                                        <div className={cn(
                                            "text-sm px-4 py-2.5 rounded-2xl max-w-[85%] border break-words [overflow-wrap:anywhere]",
                                            message.isOwn
                                                ? "bg-primary text-primary-foreground border-primary/30 rounded-br-sm font-medium shadow-sm transition-all"
                                                : "bg-card text-foreground border-border rounded-bl-sm",
                                            hasFile && "px-0 py-0 bg-transparent border-none shadow-none text-foreground mr-0",
                                            hasImage && "p-1 bg-card border-border"
                                        )}>
                                            {hasImage && message.fileUrl && (
                                                <a href={message.fileUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden w-full bg-background">
                                                    <img src={message.fileUrl} alt="Shared image" className="w-full max-h-48 object-contain" />
                                                </a>
                                            )}

                                            {hasFile && message.fileUrl && (
                                                <a
                                                    href={message.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 rounded-2xl border p-3 border-border bg-card"
                                                >
                                                    <div className="p-2 rounded-lg bg-muted shrink-0">
                                                        <File className="w-4 h-4 text-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold truncate text-foreground">{message.content || "Attachment"}</p>
                                                    </div>
                                                </a>
                                            )}

                                            {!message.fileUrl && (
                                                <span className="leading-relaxed whitespace-pre-wrap">{message.content}</span>
                                            )}
                                        </div>
                                        <div className={cn("text-[10px] flex items-center gap-1", message.isOwn ? "text-muted-foreground" : "text-muted-foreground px-1")}>
                                            {message.isOwn
                                                ? renderOutgoingStatus(message.status, formatMiniTimestamp(message.createdAt))
                                                : <span>{formatMiniTimestamp(message.createdAt)}</span>
                                            }
                                        </div>
                                    </div>
                                )})}
                                {chatState.isOtherUserTyping && (
                                    <div className="flex items-end gap-2 w-full justify-start max-w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="px-3 py-2 bg-card text-foreground rounded-2xl rounded-bl-sm border border-border shadow-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.2s]" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.1s]" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {chatState.error && (
                                    <p className="text-xs text-red-600 text-center">{chatState.error}</p>
                                )}
                            </div>

                            {/* Chatbox Input */}
                            <div className="p-3 border-t border-border bg-card flex flex-col gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <label className={cn("p-1.5 transition-colors", chat.isActive ? "text-muted-foreground hover:text-foreground cursor-pointer" : "text-slate-400 cursor-not-allowed")}>
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
                                    <div className="flex-1 bg-background border border-border rounded-full flex items-center px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
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
                                            className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    <button
                                        disabled={!chat.isActive || chatState.isSending || chatState.isUploading}
                                        onClick={() => void sendMiniMessage(chat.id)}
                                        className={cn(
                                            "p-1.5 transition-colors",
                                            chat.isActive && !chatState.isSending && !chatState.isUploading ? "text-primary hover:text-primary/80" : "text-slate-400 cursor-not-allowed"
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

                {/* iRis Chatbox rendered inside the same horizontal tray */}
                <ChatWidget
                    isOpen={isIrisOpen}
                    onClose={() => setIsIrisOpen(false)}
                    embedded
                />
            </div>

            <AnimatePresence>
                {sharedFilesChatId && (
                    <>
                        <motion.button
                            type="button"
                            className="fixed inset-0 bg-slate-950/35 z-[75] backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSharedFilesChatId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            className="fixed z-[80] right-6 bottom-6 w-[360px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/95">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">Shared Files</p>
                                    <p className="text-[11px] text-muted-foreground truncate">
                                        {openChats.find((chat) => chat.id === sharedFilesChatId)?.name ?? "Conversation"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSharedFilesChatId(null)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-[calc(70vh-62px)] overflow-y-auto custom-scrollbar p-3 space-y-2">
                                {sharedFiles.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-5">No shared files in this chat yet.</p>
                                )}
                                {sharedFiles.map((message) => {
                                    const isImage = Boolean(message.fileMimeType?.startsWith("image/"));
                                    return (
                                        <a
                                            key={message.id}
                                            href={message.fileUrl ?? "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-xl border border-border bg-background/70 hover:bg-muted/50 transition-colors p-2"
                                        >
                                            {isImage && message.fileUrl ? (
                                                <img
                                                    src={message.fileUrl}
                                                    alt="Shared file"
                                                    className="w-full max-h-36 object-contain rounded-lg bg-background"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <span className="p-2 rounded-lg bg-muted"><File className="w-4 h-4" /></span>
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

function renderSystemIcon(type: string) {
    switch (type) {
        case 'awaiting_in_person': return <HandCoins className="h-5 w-5" />;
        case 'reminder_sent': return <Bell className="h-5 w-5" />;
        case 'invoice': return <Receipt className="h-5 w-5" />;
        case 'landlord_review': return <History className="h-5 w-5" />;
        default: return <Zap className="h-5 w-5" />;
    }
}

function MiniSystemMessage({ message, router }: { message: MiniChatMessage; router: any }) {
    const isOverpayment = message.issueType === "excessive_amount";
    const isRejected = message.workflowStatus === "rejected";
    const isResolved = message.metadata?.isResolved;

    if (message.systemType === "invoice") {
        return (
            <div className="flex flex-col gap-2 items-center w-full">
                <OfficialReceipt 
                    message={message as any} 
                    isCompact={true}
                    role="tenant"
                />
            </div>
        );
    }

    if (message.systemType === "landlord_review") {
        return (
            <NotificationCard
                message={message}
                icon={isOverpayment ? <TrendingUp className="h-6 w-6 text-white" /> : (isRejected ? <AlertTriangle className="h-6 w-6 text-white" /> : <CheckCircle2 className="h-6 w-6 text-white" />)}
                title={isOverpayment 
                    ? (isResolved ? "Reconciliation Complete" : "Overpayment Detected")
                    : (isRejected ? "Payment Rejected" : "Payment Confirmed")
                }
                subtitle={isResolved ? "Transaction Settled" : "Action Logged"}
                variant={isOverpayment ? (isResolved ? "success" : "warning") : (isRejected ? "error" : "success")}
                refundImg={message.metadata?.refundProofUrl as string}
                isCompact={true}
            />
        );
    }

    if (message.systemType === "awaiting_in_person" || message.workflowStatus === "awaiting_in_person") {
        return (
            <NotificationCard
                message={message}
                icon={<HandCoins className="h-6 w-6 text-white" />}
                title="In-Person Payment"
                subtitle="Verification Required"
                variant="warning"
                isCompact={true}
            />
        );
    }

    if (message.systemType === "reminder_sent") {
        return (
            <NotificationCard
                message={message}
                icon={<Bell className="h-6 w-6 text-white" />}
                title="Payment Reminder"
                subtitle="Notification Sent"
                variant="default"
                isCompact={true}
            />
        );
    }

    return (
        <NotificationCard
            message={message}
            icon={renderSystemIcon(message.systemType || "")}
            title="System Notification"
            subtitle={formatMiniTimestamp(message.createdAt)}
            variant="default"
            isCompact={true}
        />
    );
}

function ContactCard({ name, role, unit, avatar, avatarBgColor, status, isExpanded }: ContactCardProps) {
    const isIssue = status === "Late Payment" || status === "Notice Given";

    return (
        <div className={cn(
            "flex items-center gap-4 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border transition-all cursor-pointer group shrink-0",
            isExpanded ? "p-3" : "p-1 justify-center hover:scale-110"
        )}>
            <div className="relative shrink-0">
                <div
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-card shadow-sm group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundColor: avatarBgColor || '#171717' }}
                >
                    <img
                        src={avatar}
                        alt={name}
                        className="w-10 h-10 object-cover"
                    />
                </div>
                <div className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                    isIssue ? "bg-red-500" : status === "Moving In" ? "bg-amber-500" : "bg-emerald-500"
                )} />
            </div>

            {isExpanded && (
                <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-0.5">
                        <div className="flex min-w-0 items-center gap-2">
                            <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">{name}</h4>
                            <RoleBadge role={role} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium truncate pr-2">{unit}</p>
                        <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                            <span className="text-[10px] text-muted-foreground">{status}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

