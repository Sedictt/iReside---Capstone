"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { playSound } from "@/hooks/useSound";
import {
    createOrGetDirectConversation,
    fetchConversationMessages,
    fetchConversations,
    markConversationAsRead,
    searchMessageUsers,
    sendConversationMessage,
    uploadConversationFile,
    type ConversationMessage,
    type MessageUserSearchResult,
} from "@/lib/messages/client";
import { redactMessageForSend } from "@/lib/messages/redaction-client";
import type { BadgeRole } from "@/components/profile/RoleBadge";
import type { MiniChatContact, MiniChatMenuAction, MiniChatMessage, MiniChatRole, MiniChatState, OpenMiniChat } from "./types";
import {
    DEFAULT_CHAT_STATE,
    MAX_OPEN_CHATS,
    MESSAGE_CACHE_TTL_MS,
    MESSAGE_PAGE_SIZE,
    mapConversationMessage,
    mapConversationToContact,
    mergeWithPendingMessages,
} from "./utils";

type MessageRow = {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: "text" | "system" | "image" | "file";
    metadata: Record<string, unknown> | string | null;
    read_at: string | null;
    created_at: string;
};

type PersistedWindow = { id: string; isMinimized: boolean };

const CONVERSATION_POLL_MS = 30_000;
const TYPING_IDLE_MS = 1_200;
const REMOTE_TYPING_TTL_MS = 2_000;
const SEARCH_DEBOUNCE_MS = 250;

const storageKey = (role: MiniChatRole) => `ireside.mini-chat.${role}.windows`;

const readPersistedWindows = (role: MiniChatRole): PersistedWindow[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.sessionStorage.getItem(storageKey(role));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((entry): entry is PersistedWindow => Boolean(entry) && typeof entry.id === "string")
            .map((entry) => ({ id: entry.id, isMinimized: Boolean(entry.isMinimized) }))
            .slice(0, MAX_OPEN_CHATS);
    } catch {
        return [];
    }
};

const writePersistedWindows = (role: MiniChatRole, chats: OpenMiniChat[]) => {
    if (typeof window === "undefined") return;
    try {
        const payload: PersistedWindow[] = chats.map((chat) => ({ id: chat.id, isMinimized: chat.isMinimized }));
        window.sessionStorage.setItem(storageKey(role), JSON.stringify(payload));
    } catch {
        // Storage can be unavailable (private mode, quota). The dock still works for this page view.
    }
};

const parseRowMetadata = (raw: MessageRow["metadata"]): Record<string, unknown> | null => {
    if (!raw) return null;
    if (typeof raw !== "string") return raw;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
        return null;
    }
};

const rowToConversationMessage = (row: MessageRow): ConversationMessage => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    sender: null,
    type: row.type,
    content: row.content,
    metadata: parseRowMetadata(row.metadata),
    readAt: row.read_at,
    createdAt: row.created_at,
});

const isDocumentVisible = () => typeof document === "undefined" || document.visibilityState === "visible";

/** Evict the oldest window that is not `keepId` so the dock never exceeds MAX_OPEN_CHATS. */
const capOpenChats = (chats: OpenMiniChat[], keepId: string) => {
    if (chats.length <= MAX_OPEN_CHATS) return chats;
    const evictIndex = chats.findIndex((chat) => chat.id !== keepId && !chat.isActive);
    const index = evictIndex >= 0 ? evictIndex : chats.findIndex((chat) => chat.id !== keepId);
    return chats.filter((_, i) => i !== index);
};

export interface UseMiniChatOptions {
    role: MiniChatRole;
}

export function useMiniChat({ role }: UseMiniChatOptions) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const supabase = useMemo(() => createSupabaseClient(), []);
    const messagesHref = `/${role}/messages`;

    const [conversations, setConversations] = useState<MiniChatContact[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [conversationsError, setConversationsError] = useState<string | null>(null);
    const [openChats, setOpenChats] = useState<OpenMiniChat[]>([]);
    const [chatStateById, setChatStateById] = useState<Record<string, MiniChatState>>({});
    const [menuActionId, setMenuActionId] = useState<string | null>(null);
    const [sharedFilesChatId, setSharedFilesChatId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<MessageUserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

    const openChatsRef = useRef<OpenMiniChat[]>([]);
    const chatStateByIdRef = useRef<Record<string, MiniChatState>>({});
    const conversationsRef = useRef<MiniChatContact[]>([]);
    const refreshInFlightRef = useRef<Promise<MiniChatContact[]> | null>(null);
    const messageLoadedAtRef = useRef<Record<string, number>>({});
    const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
    const typingStopTimeoutRef = useRef<Map<string, number>>(new Map());
    const remoteTypingTimeoutRef = useRef<Map<string, number>>(new Map());
    const lastTypingBroadcastRef = useRef<Map<string, boolean>>(new Map());
    const hasRestoredWindowsRef = useRef(false);

    useEffect(() => {
        openChatsRef.current = openChats;
        if (hasRestoredWindowsRef.current) {
            writePersistedWindows(role, openChats);
        }
    }, [openChats, role]);

    useEffect(() => {
        chatStateByIdRef.current = chatStateById;
    }, [chatStateById]);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const patchChatState = useCallback((conversationId: string, patch: Partial<MiniChatState> | ((prev: MiniChatState) => Partial<MiniChatState>)) => {
        setChatStateById((prev) => {
            const existing = prev[conversationId] ?? DEFAULT_CHAT_STATE;
            const resolved = typeof patch === "function" ? patch(existing) : patch;
            return { ...prev, [conversationId]: { ...existing, ...resolved } };
        });
    }, []);

    const ensureChatState = useCallback((conversationId: string) => {
        setChatStateById((prev) => (prev[conversationId] ? prev : { ...prev, [conversationId]: DEFAULT_CHAT_STATE }));
    }, []);

    // ---------------------------------------------------------------------
    // Conversations
    // ---------------------------------------------------------------------

    const refreshConversations = useCallback(async (showLoader = false) => {
        if (!showLoader && refreshInFlightRef.current) {
            return refreshInFlightRef.current;
        }

        const request = (async () => {
            if (showLoader) setIsLoadingConversations(true);
            const { data, error } = await fetchConversations();
            setConversationsError(error);
            const mapped = data.map((conversation) => {
                const contact = mapConversationToContact(conversation, userId);
                // The server-side summary cache can lag a read receipt by a few seconds;
                // a window the user is actively reading is never shown as unread.
                const isReading = openChatsRef.current.some((chat) => chat.id === contact.id && chat.isActive && !chat.isMinimized);
                return isReading ? { ...contact, unread: false, unreadCount: 0 } : contact;
            });
            setConversations(mapped);
            setOpenChats((prev) => prev.map((chat) => {
                const latest = mapped.find((conversation) => conversation.id === chat.id);
                return latest ? { ...chat, ...latest } : chat;
            }));
            if (showLoader) setIsLoadingConversations(false);
            return mapped;
        })();

        refreshInFlightRef.current = request;
        try {
            return await request;
        } finally {
            if (refreshInFlightRef.current === request) {
                refreshInFlightRef.current = null;
            }
        }
    }, [userId]);

    const markRead = useCallback(async (conversationId: string) => {
        setConversations((prev) => prev.map((conversation) => (
            conversation.id === conversationId ? { ...conversation, unread: false, unreadCount: 0 } : conversation
        )));
        setOpenChats((prev) => prev.map((chat) => (
            chat.id === conversationId ? { ...chat, unread: false, unreadCount: 0, pendingCount: 0 } : chat
        )));
        await markConversationAsRead(conversationId);
    }, []);

    // ---------------------------------------------------------------------
    // Messages
    // ---------------------------------------------------------------------

    const loadChatMessages = useCallback(async (conversationId: string, options?: { force?: boolean }) => {
        const force = Boolean(options?.force);
        const cached = chatStateByIdRef.current[conversationId];
        const loadedAt = messageLoadedAtRef.current[conversationId] ?? 0;
        const hasFreshCache = !force && Boolean(cached) && cached!.messages.length > 0 && Date.now() - loadedAt < MESSAGE_CACHE_TTL_MS;
        if (hasFreshCache) return;

        const showLoader = !cached || cached.messages.length === 0;
        patchChatState(conversationId, { isLoading: showLoader, error: null });

        const { data, error } = await fetchConversationMessages(conversationId, MESSAGE_PAGE_SIZE);
        const mapped = data.map((message) => mapConversationMessage(message, userId));

        patchChatState(conversationId, (prev) => ({
            messages: error ? prev.messages : mergeWithPendingMessages(mapped, prev.messages),
            isLoading: false,
            error,
        }));

        if (!error) {
            messageLoadedAtRef.current[conversationId] = Date.now();
        }
    }, [patchChatState, userId]);

    const appendIncomingMessage = useCallback((conversationId: string, row: MessageRow) => {
        const mapped = mapConversationMessage(rowToConversationMessage(row), userId);
        patchChatState(conversationId, (prev) => {
            if (prev.messages.some((message) => message.id === mapped.id)) return {};
            // A message we sent from this window is already present as an optimistic entry.
            if (mapped.isOwn) {
                const optimisticIndex = prev.messages.findIndex((message) => (
                    message.id.startsWith("local-") && message.status === "sending" && message.content === mapped.content
                ));
                if (optimisticIndex >= 0) {
                    const next = [...prev.messages];
                    next[optimisticIndex] = mapped;
                    return { messages: next };
                }
            }
            return { messages: [...prev.messages, mapped], isOtherUserTyping: mapped.isOwn ? prev.isOtherUserTyping : false };
        });
    }, [patchChatState, userId]);

    const applyReadReceipt = useCallback((conversationId: string, row: MessageRow) => {
        if (!row.read_at) return;
        patchChatState(conversationId, (prev) => ({
            messages: prev.messages.map((message) => (
                message.id === row.id && message.isOwn && message.status !== "failed" ? { ...message, status: "seen" } : message
            )),
        }));
    }, [patchChatState]);

    // ---------------------------------------------------------------------
    // Window management
    // ---------------------------------------------------------------------

    const activateChat = useCallback((conversationId: string) => {
        const target = openChatsRef.current.find((chat) => chat.id === conversationId);
        if (!target) return;
        setOpenChats((prev) => prev.map((chat) => ({
            ...chat,
            isActive: chat.id === conversationId,
            isMinimized: chat.id === conversationId ? false : chat.isMinimized,
        })));
        if (target.unread || target.pendingCount > 0 || !target.isActive || target.isMinimized) {
            void markRead(conversationId);
        }
    }, [markRead]);

    const openChat = useCallback(async (contact: MiniChatContact, options?: { minimized?: boolean; silent?: boolean }) => {
        const minimized = Boolean(options?.minimized);
        ensureChatState(contact.id);

        setOpenChats((prev) => {
            const existing = prev.find((chat) => chat.id === contact.id);
            if (existing) {
                if (minimized) return prev.map((chat) => (chat.id === contact.id ? { ...chat, ...contact } : chat));
                return prev.map((chat) => ({
                    ...chat,
                    ...(chat.id === contact.id ? contact : {}),
                    isActive: chat.id === contact.id,
                    isMinimized: chat.id === contact.id ? false : chat.isMinimized,
                }));
            }

            const next: OpenMiniChat[] = [
                ...prev.map((chat) => ({ ...chat, isActive: minimized ? chat.isActive : false })),
                {
                    ...contact,
                    isActive: !minimized,
                    isMinimized: minimized,
                    pendingCount: minimized ? contact.unreadCount : 0,
                },
            ];
            return capOpenChats(next, contact.id);
        });

        await loadChatMessages(contact.id);
        if (!minimized && !options?.silent) {
            void markRead(contact.id);
        }
    }, [ensureChatState, loadChatMessages, markRead]);

    const closeChat = useCallback((conversationId: string) => {
        setOpenChats((prev) => {
            const remaining = prev.filter((chat) => chat.id !== conversationId);
            const closedWasActive = prev.find((chat) => chat.id === conversationId)?.isActive;
            if (closedWasActive && remaining.length > 0 && !remaining.some((chat) => chat.isActive)) {
                const fallback = [...remaining].reverse().find((chat) => !chat.isMinimized) ?? remaining[remaining.length - 1];
                return remaining.map((chat) => ({ ...chat, isActive: chat.id === fallback.id }));
            }
            return remaining;
        });
        setSharedFilesChatId((current) => (current === conversationId ? null : current));
    }, []);

    const toggleMinimize = useCallback((conversationId: string) => {
        const target = openChatsRef.current.find((chat) => chat.id === conversationId);
        if (!target) return;
        if (target.isMinimized) {
            activateChat(conversationId);
            return;
        }
        setOpenChats((prev) => {
            const next = prev.map((chat) => (chat.id === conversationId ? { ...chat, isMinimized: true, isActive: false } : chat));
            if (target.isActive) {
                const fallback = [...next].reverse().find((chat) => !chat.isMinimized);
                if (fallback) {
                    return next.map((chat) => ({ ...chat, isActive: chat.id === fallback.id }));
                }
            }
            return next;
        });
    }, [activateChat]);

    // ---------------------------------------------------------------------
    // Composer
    // ---------------------------------------------------------------------

    const broadcastTyping = useCallback((conversationId: string, isTyping: boolean) => {
        const channel = channelsRef.current.get(conversationId);
        if (!channel || !userId) return;
        const previous = lastTypingBroadcastRef.current.get(conversationId) ?? false;
        if (previous === isTyping) return;
        lastTypingBroadcastRef.current.set(conversationId, isTyping);
        void channel.send({
            type: "broadcast",
            event: "typing",
            payload: { conversationId, userId, isTyping },
        });
    }, [userId]);

    const updateDraft = useCallback((conversationId: string, draft: string) => {
        patchChatState(conversationId, { draft });

        const isTyping = draft.trim().length > 0;
        broadcastTyping(conversationId, isTyping);

        const existingTimeout = typingStopTimeoutRef.current.get(conversationId);
        if (existingTimeout) {
            window.clearTimeout(existingTimeout);
            typingStopTimeoutRef.current.delete(conversationId);
        }
        if (isTyping) {
            const timeoutId = window.setTimeout(() => {
                broadcastTyping(conversationId, false);
                typingStopTimeoutRef.current.delete(conversationId);
            }, TYPING_IDLE_MS);
            typingStopTimeoutRef.current.set(conversationId, timeoutId);
        }
    }, [broadcastTyping, patchChatState]);

    const deliverText = useCallback(async (conversationId: string, localId: string, text: string) => {
        patchChatState(conversationId, { isSending: true, error: null });
        try {
            const moderation = await redactMessageForSend(text);
            const created = await sendConversationMessage(conversationId, text, {
                isRedacted: moderation.isSensitive,
                redactedContent: moderation.redactedMessage,
                isConfirmedDisclosed: false,
                isPhishing: moderation.isPhishing,
                redactionCategory: moderation.redactionCategory,
                disclosureAllowed: moderation.disclosureAllowed,
            });
            const mapped = mapConversationMessage({ ...created, sender: null }, userId);
            patchChatState(conversationId, (prev) => ({
                isSending: false,
                messages: prev.messages.some((message) => message.id === mapped.id)
                    ? prev.messages.filter((message) => message.id !== localId)
                    : prev.messages.map((message) => (message.id === localId ? mapped : message)),
            }));
            messageLoadedAtRef.current[conversationId] = Date.now();
            void refreshConversations();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to send message.";
            patchChatState(conversationId, (prev) => ({
                isSending: false,
                error: message,
                messages: prev.messages.map((entry) => (entry.id === localId ? { ...entry, status: "failed" } : entry)),
            }));
        }
    }, [patchChatState, refreshConversations, userId]);

    const sendMessage = useCallback(async (conversationId: string) => {
        const current = chatStateByIdRef.current[conversationId] ?? DEFAULT_CHAT_STATE;
        const text = current.draft.trim();
        if (!text || current.isSending) return;

        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const optimistic: MiniChatMessage = {
            id: localId,
            senderId: userId ?? "",
            content: text,
            createdAt: new Date().toISOString(),
            isOwn: true,
            status: "sending",
            messageType: "text",
            fileUrl: null,
            fileName: null,
            fileMimeType: null,
            isRedacted: false,
            redactedContent: null,
        };

        patchChatState(conversationId, (prev) => ({ draft: "", messages: [...prev.messages, optimistic] }));

        const typingTimeout = typingStopTimeoutRef.current.get(conversationId);
        if (typingTimeout) {
            window.clearTimeout(typingTimeout);
            typingStopTimeoutRef.current.delete(conversationId);
        }
        broadcastTyping(conversationId, false);

        await deliverText(conversationId, localId, text);
    }, [broadcastTyping, deliverText, patchChatState, userId]);

    const retryMessage = useCallback(async (conversationId: string, messageId: string) => {
        const current = chatStateByIdRef.current[conversationId];
        const failed = current?.messages.find((message) => message.id === messageId && message.status === "failed");
        if (!failed || current?.isSending) return;
        patchChatState(conversationId, (prev) => ({
            messages: prev.messages.map((message) => (message.id === messageId ? { ...message, status: "sending", createdAt: new Date().toISOString() } : message)),
        }));
        await deliverText(conversationId, messageId, failed.content);
    }, [deliverText, patchChatState]);

    const discardMessage = useCallback((conversationId: string, messageId: string) => {
        patchChatState(conversationId, (prev) => ({
            error: null,
            messages: prev.messages.filter((message) => message.id !== messageId),
        }));
    }, [patchChatState]);

    const uploadFile = useCallback(async (conversationId: string, file: File) => {
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : null;
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const optimistic: MiniChatMessage = {
            id: localId,
            senderId: userId ?? "",
            content: isImage ? "" : file.name,
            createdAt: new Date().toISOString(),
            isOwn: true,
            status: "sending",
            messageType: isImage ? "image" : "file",
            fileUrl: previewUrl,
            fileName: file.name,
            fileMimeType: file.type || null,
            isRedacted: false,
            redactedContent: null,
        };

        patchChatState(conversationId, (prev) => ({
            messages: [...prev.messages, optimistic],
            isUploading: true,
            uploadProgress: 0,
            error: null,
        }));

        try {
            const result = await uploadConversationFile(conversationId, file, (percent) => {
                patchChatState(conversationId, { uploadProgress: percent });
            });
            const mapped = mapConversationMessage({ ...result.message, sender: null }, userId);
            const confirmed: MiniChatMessage = {
                ...mapped,
                fileUrl: mapped.fileUrl ?? result.file.url,
                fileName: mapped.fileName ?? result.file.name,
                fileMimeType: mapped.fileMimeType ?? result.file.mimeType,
            };
            patchChatState(conversationId, (prev) => ({
                messages: prev.messages.some((message) => message.id === confirmed.id)
                    ? prev.messages.filter((message) => message.id !== localId)
                    : prev.messages.map((message) => (message.id === localId ? confirmed : message)),
            }));
            messageLoadedAtRef.current[conversationId] = Date.now();
            void refreshConversations();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to upload file.";
            patchChatState(conversationId, (prev) => ({
                error: message,
                messages: prev.messages.filter((entry) => entry.id !== localId),
            }));
            toast.error("Upload failed", { description: message });
        } finally {
            if (previewUrl) {
                // Give the confirmed image a moment to swap in before the blob URL is released.
                window.setTimeout(() => URL.revokeObjectURL(previewUrl), 5_000);
            }
            patchChatState(conversationId, { isUploading: false, uploadProgress: 0 });
        }
    }, [patchChatState, refreshConversations, userId]);

    const clearError = useCallback((conversationId: string) => {
        patchChatState(conversationId, { error: null });
    }, [patchChatState]);

    // ---------------------------------------------------------------------
    // Initial load + window restoration
    // ---------------------------------------------------------------------

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        void (async () => {
            const mapped = await refreshConversations(true);
            if (cancelled || hasRestoredWindowsRef.current) return;

            const persisted = readPersistedWindows(role);
            const restored: OpenMiniChat[] = persisted
                .map((entry) => {
                    const contact = mapped.find((conversation) => conversation.id === entry.id);
                    return contact ? { ...contact, isActive: false, isMinimized: entry.isMinimized, pendingCount: 0 } : null;
                })
                .filter((chat): chat is OpenMiniChat => chat !== null);

            hasRestoredWindowsRef.current = true;
            if (restored.length === 0) return;

            setOpenChats(restored);
            restored.forEach((chat) => ensureChatState(chat.id));
            await Promise.all(restored.map((chat) => loadChatMessages(chat.id)));
        })();

        return () => {
            cancelled = true;
        };
    }, [ensureChatState, loadChatMessages, refreshConversations, role, userId]);

    // ---------------------------------------------------------------------
    // Realtime: inbox (new conversations / windows that are not open)
    // ---------------------------------------------------------------------

    const handleInboxInsert = useCallback(async (row: MessageRow) => {
        const conversationId = row.conversation_id;
        if (!conversationId || row.sender_id === userId) {
            void refreshConversations();
            return;
        }

        const alreadyOpen = openChatsRef.current.some((chat) => chat.id === conversationId);
        const updated = await refreshConversations();
        if (alreadyOpen) return; // The conversation channel handles open windows.

        const contact = updated.find((conversation) => conversation.id === conversationId);
        if (!contact || contact.isArchived || contact.isBlocked) return;

        playSound("message", 0.35);
        void openChat(contact, { minimized: true });
    }, [openChat, refreshConversations, userId]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`${role}-mini-chat-inbox-${userId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
                void handleInboxInsert(payload.new as MessageRow);
            })
            .subscribe();

        return () => {
            void channel.unsubscribe();
            void supabase.removeChannel(channel);
        };
    }, [handleInboxInsert, role, supabase, userId]);

    // ---------------------------------------------------------------------
    // Realtime: one channel per open window (messages, typing, presence)
    // ---------------------------------------------------------------------

    const openChatIds = useMemo(() => openChats.map((chat) => chat.id), [openChats]);
    const openChatIdsKey = openChatIds.join("|");

    useEffect(() => {
        if (!userId) return;
        const ids = openChatIdsKey ? openChatIdsKey.split("|") : [];
        const channels = channelsRef.current;

        // Tear down channels for windows that were closed.
        channels.forEach((channel, conversationId) => {
            if (ids.includes(conversationId)) return;
            channels.delete(conversationId);
            lastTypingBroadcastRef.current.delete(conversationId);
            void channel.unsubscribe();
            void supabase.removeChannel(channel);
        });

        ids.forEach((conversationId) => {
            if (channels.has(conversationId)) return;

            const channel = supabase
                .channel(`messages-${conversationId}`)
                .on(
                    "postgres_changes",
                    { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                    (payload) => {
                        const row = payload.new as MessageRow;
                        appendIncomingMessage(conversationId, row);
                        if (row.sender_id === userId) return;

                        const chat = openChatsRef.current.find((entry) => entry.id === conversationId);
                        const isReading = Boolean(chat?.isActive) && !chat?.isMinimized && isDocumentVisible();
                        if (isReading) {
                            void markRead(conversationId);
                        } else {
                            playSound("message", 0.35);
                            setOpenChats((prev) => prev.map((entry) => (
                                entry.id === conversationId ? { ...entry, pendingCount: entry.pendingCount + 1, unread: true } : entry
                            )));
                        }
                        void refreshConversations();
                    }
                )
                .on(
                    "postgres_changes",
                    { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                    (payload) => applyReadReceipt(conversationId, payload.new as MessageRow)
                )
                .on("broadcast", { event: "typing" }, ({ payload }) => {
                    const candidate = payload as { conversationId?: string; userId?: string; isTyping?: boolean } | null;
                    if (!candidate || candidate.conversationId !== conversationId || !candidate.userId || candidate.userId === userId) return;

                    patchChatState(conversationId, { isOtherUserTyping: Boolean(candidate.isTyping) });

                    const existing = remoteTypingTimeoutRef.current.get(conversationId);
                    if (existing) window.clearTimeout(existing);
                    if (candidate.isTyping) {
                        const timeoutId = window.setTimeout(() => {
                            patchChatState(conversationId, { isOtherUserTyping: false });
                            remoteTypingTimeoutRef.current.delete(conversationId);
                        }, REMOTE_TYPING_TTL_MS);
                        remoteTypingTimeoutRef.current.set(conversationId, timeoutId);
                    } else {
                        remoteTypingTimeoutRef.current.delete(conversationId);
                    }
                })
                .on("presence", { event: "sync" }, () => {
                    const otherUserId = openChatsRef.current.find((entry) => entry.id === conversationId)?.participantUserId;
                    if (!otherUserId) return;
                    const state = channel.presenceState();
                    const isOnline = (Object.values(state).flat() as Array<{ userId?: string }>).some((entry) => entry.userId === otherUserId);
                    patchChatState(conversationId, { isOtherUserOnline: isOnline });
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        await channel.track({ userId, onlineAt: new Date().toISOString() });
                    }
                });

            channels.set(conversationId, channel);
        });
    }, [appendIncomingMessage, applyReadReceipt, markRead, openChatIdsKey, patchChatState, refreshConversations, supabase, userId]);

    useEffect(() => {
        const channels = channelsRef.current;
        const typingTimeouts = typingStopTimeoutRef.current;
        const remoteTimeouts = remoteTypingTimeoutRef.current;
        return () => {
            channels.forEach((channel) => {
                void channel.unsubscribe();
                void supabase.removeChannel(channel);
            });
            channels.clear();
            typingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
            remoteTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
            typingTimeouts.clear();
            remoteTimeouts.clear();
        };
    }, [supabase]);

    // ---------------------------------------------------------------------
    // Fallback polling + visibility resync
    // ---------------------------------------------------------------------

    useEffect(() => {
        if (!userId) return;

        const resync = () => {
            if (!isDocumentVisible()) return;
            void refreshConversations();
            const active = openChatsRef.current.find((chat) => chat.isActive && !chat.isMinimized);
            if (active) void loadChatMessages(active.id, { force: true });
        };

        const intervalId = window.setInterval(resync, CONVERSATION_POLL_MS);
        document.addEventListener("visibilitychange", resync);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", resync);
        };
    }, [loadChatMessages, refreshConversations, userId]);

    // ---------------------------------------------------------------------
    // Search / directory
    // ---------------------------------------------------------------------

    useEffect(() => {
        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            setSearchError(null);
            return;
        }

        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const { data, error } = await searchMessageUsers(trimmed, 8);
                if (cancelled) return;
                setSearchResults(data);
                setSearchError(error);
            } catch {
                if (!cancelled) setSearchError("Failed to search directory.");
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    const visibleConversations = useMemo(
        () => conversations.filter((conversation) => !conversation.isArchived && !conversation.isBlocked),
        [conversations]
    );

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return visibleConversations;
        return visibleConversations.filter((conversation) => (
            conversation.name.toLowerCase().includes(query)
            || conversation.unit.toLowerCase().includes(query)
            || conversation.lastMessage.toLowerCase().includes(query)
        ));
    }, [searchQuery, visibleConversations]);

    const directoryUsers = useMemo(() => {
        const knownIds = new Set(conversations.map((conversation) => conversation.participantUserId).filter(Boolean));
        if (userId) knownIds.add(userId);
        return searchResults.filter((result) => !knownIds.has(result.id));
    }, [conversations, searchResults, userId]);

    const hasUnreadConversations = useMemo(
        () => visibleConversations.some((conversation) => conversation.unread),
        [visibleConversations]
    );

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setSearchError(null);
    }, []);

    const startConversationWithUser = useCallback(async (target: MessageUserSearchResult) => {
        const existing = conversationsRef.current.find((conversation) => conversation.participantUserId === target.id);
        if (existing) {
            await openChat(existing);
            clearSearch();
            return;
        }

        setStartingChatUserId(target.id);
        try {
            const conversationId = await createOrGetDirectConversation(target.id);
            const updated = await refreshConversations();
            const found = updated.find((conversation) => conversation.id === conversationId);
            const contact: MiniChatContact = found ?? {
                id: conversationId,
                participantUserId: target.id,
                name: target.fullName,
                role: target.role as BadgeRole,
                avatar: target.avatarUrl || "",
                avatarBgColor: target.avatarBgColor,
                lastMessage: "No messages yet",
                lastMessageAt: null,
                time: "",
                unit: target.role === "landlord" ? "Landlord" : "Tenant",
                relationshipStatus: "stranger",
                unreadCount: 0,
                unread: false,
                isArchived: false,
                isBlocked: false,
            };
            await openChat(contact);
            clearSearch();
        } catch (error) {
            console.error("Failed to start conversation:", error);
            toast.error("Could not start a conversation with this user.");
        } finally {
            setStartingChatUserId(null);
        }
    }, [clearSearch, openChat, refreshConversations]);

    // ---------------------------------------------------------------------
    // Contact actions (archive / block / report)
    // ---------------------------------------------------------------------

    const submitMenuAction = useCallback(async (chat: OpenMiniChat, action: MiniChatMenuAction) => {
        if (!chat.participantUserId) {
            toast.error("This contact cannot be identified for that action.");
            return;
        }

        const token = `${chat.id}:${action}`;
        setMenuActionId(token);

        try {
            const endpoint = action === "report"
                ? `/api/messages/users/${chat.participantUserId}/reports`
                : `/api/messages/users/${chat.participantUserId}/actions`;
            const body = action === "report"
                ? { conversationId: chat.id, category: "other", details: "Submitted from the mini chat window." }
                : { action };

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "The action could not be completed.");
            }

            if (action === "report") {
                toast.success("Report submitted", { description: "Our team will review this conversation." });
            } else {
                closeChat(chat.id);
                await refreshConversations();
                toast.success(action === "archive" ? "Conversation archived" : `${chat.name} has been blocked`, {
                    description: "You can manage this from the full messaging page.",
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "The action could not be completed.";
            toast.error(message);
        } finally {
            setMenuActionId(null);
        }
    }, [closeChat, refreshConversations]);

    const sharedFiles = useMemo(() => {
        if (!sharedFilesChatId) return [] as MiniChatMessage[];
        return (chatStateById[sharedFilesChatId]?.messages ?? []).filter((message) => Boolean(message.fileUrl) && !message.id.startsWith("local-"));
    }, [chatStateById, sharedFilesChatId]);

    const sharedFilesChat = useMemo(
        () => (sharedFilesChatId ? openChats.find((chat) => chat.id === sharedFilesChatId) ?? null : null),
        [openChats, sharedFilesChatId]
    );

    return {
        userId,
        role,
        messagesHref,

        conversations: visibleConversations,
        filteredConversations,
        isLoadingConversations,
        conversationsError,
        hasUnreadConversations,
        refreshConversations,

        openChats,
        chatStateById,
        openChat,
        closeChat,
        activateChat,
        toggleMinimize,

        updateDraft,
        sendMessage,
        retryMessage,
        discardMessage,
        uploadFile,
        clearError,
        reloadMessages: (conversationId: string) => loadChatMessages(conversationId, { force: true }),

        searchQuery,
        setSearchQuery,
        clearSearch,
        directoryUsers,
        isSearching,
        searchError,
        startingChatUserId,
        startConversationWithUser,

        menuActionId,
        submitMenuAction,

        sharedFilesChatId,
        sharedFilesChat,
        sharedFiles,
        setSharedFilesChatId,
    };
}

export type MiniChatController = ReturnType<typeof useMiniChat>;
