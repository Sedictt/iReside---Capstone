import type { ConversationMessage, ConversationSummary } from "@/lib/messages/client";
import { DEFAULT_AVATAR_URL } from "@/lib/constants";
import type { MiniChatContact, MiniChatMessage, MiniChatState } from "./types";

export const MAX_OPEN_CHATS = 3;
export const MESSAGE_PAGE_SIZE = 80;
export const MESSAGE_CACHE_TTL_MS = 5 * 60 * 1000;
export const DRAFT_MAX_LENGTH = 500;
export const ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
/** Consecutive messages from the same sender within this window are visually grouped. */
export const GROUP_WINDOW_MS = 3 * 60 * 1000;
export const WINDOW_WIDTH_PX = 328;
export const WINDOW_GAP_PX = 12;

export const DEFAULT_CHAT_STATE: MiniChatState = Object.freeze({
    messages: [],
    draft: "",
    isLoading: false,
    isSending: false,
    isUploading: false,
    uploadProgress: 0,
    isOtherUserTyping: false,
    isOtherUserOnline: false,
    error: null,
}) as MiniChatState;

const isValidDate = (date: Date) => !Number.isNaN(date.getTime());

export const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "2:56 PM" */
export const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (!isValidDate(date)) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

/** "Today", "Yesterday", "Oct 4" or "Oct 4, 2025" for day separators. */
export const formatDayLabel = (iso: string, now: Date = new Date()) => {
    const date = new Date(iso);
    if (!isValidDate(date)) return "";
    if (isSameDay(date, now)) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });
};

/** Compact relative label for the sidebar list: "Now", "5m", "2h", "Yesterday", "Oct 4". */
export const formatRelativeTime = (iso: string | null, now: Date = new Date()) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (!isValidDate(date)) return "";

    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24 && isSameDay(date, now)) return `${hours}h`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

/** Full timestamp for tooltips / shared files: "Oct 4, 2:56 PM". */
export const formatFullTimestamp = (iso: string) => {
    const date = new Date(iso);
    if (!isValidDate(date)) return "";
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

export const summarizeLastMessage = (lastMessage: ConversationSummary["lastMessage"], currentUserId?: string | null) => {
    if (!lastMessage) return "No messages yet";
    const prefix = currentUserId && lastMessage.senderId === currentUserId ? "You: " : "";
    switch (lastMessage.type) {
        case "image":
            return `${prefix}Sent a photo`;
        case "file":
            return `${prefix}Sent a file`;
        case "system":
            return "System update";
        default:
            return `${prefix}${lastMessage.content}`;
    }
};

export const mapConversationToContact = (
    conversation: ConversationSummary,
    currentUserId?: string | null,
    now: Date = new Date()
): MiniChatContact => {
    const other = conversation.otherParticipants[0];
    const lastMessageAt = conversation.lastMessage?.createdAt ?? conversation.updatedAt ?? null;

    return {
        id: conversation.id,
        participantUserId: other?.id ?? null,
        name: other?.fullName ?? "Conversation",
        role: other?.role ?? null,
        avatar: other?.avatarUrl || DEFAULT_AVATAR_URL,
        avatarBgColor: other?.avatarBgColor || null,
        lastMessage: summarizeLastMessage(conversation.lastMessage, currentUserId),
        lastMessageAt,
        time: formatRelativeTime(lastMessageAt, now),
        unit: other?.unitName || (other?.role === "landlord" ? "Landlord" : other?.role === "tenant" ? "Tenant" : "Participant"),
        relationshipStatus: conversation.relationshipStatus,
        unreadCount: conversation.unreadCount,
        unread: conversation.unreadCount > 0,
        isArchived: conversation.isArchived,
        isBlocked: conversation.isBlocked,
    };
};

const readMetadata = (raw: ConversationMessage["metadata"] | string | null | undefined): Record<string, unknown> | null => {
    if (!raw) return null;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
        } catch {
            return null;
        }
    }
    return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
};

const readString = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null);

export const mapConversationMessage = (message: ConversationMessage, currentUserId?: string | null): MiniChatMessage => {
    const metadata = readMetadata(message.metadata);
    const isOwn = Boolean(currentUserId) && message.senderId === currentUserId;
    const fileUrl = readString(metadata?.fileUrl) ?? message.fileUrl ?? null;
    const fileMimeType = readString(metadata?.mimeType) ?? message.fileMimeType ?? null;
    const fileName = readString(metadata?.fileName) ?? message.fileName ?? null;

    return {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
        isOwn,
        status: isOwn ? (message.readAt ? "seen" : "delivered") : undefined,
        messageType: message.type,
        fileUrl,
        fileName,
        fileMimeType,
        isRedacted: Boolean(metadata?.isRedacted),
        redactedContent: readString(metadata?.redactedContent),
        systemType: readString(metadata?.systemType) ?? readString(metadata?.event) ?? undefined,
        workflowStatus: readString(metadata?.workflowStatus) ?? undefined,
        issueType: readString(metadata?.issueType) ?? undefined,
        invoiceId: readString(metadata?.invoiceId) ?? undefined,
        metadata,
    };
};

export const isImageMessage = (message: Pick<MiniChatMessage, "fileUrl" | "fileMimeType" | "messageType" | "content">) => {
    if (!message.fileUrl) return false;
    if (message.messageType === "image") return true;
    if (message.fileMimeType?.startsWith("image/")) return true;
    return /\.(jpe?g|gif|png|webp|avif)(\?|$)/i.test(message.fileUrl) || /\.(jpe?g|gif|png|webp|avif)(\?|$)/i.test(message.content);
};

/** Whether `message` should render as a continuation of `previous` (same sender, short gap, no day change). */
export const shouldGroupWithPrevious = (previous: MiniChatMessage | undefined, message: MiniChatMessage) => {
    if (!previous) return false;
    if (previous.messageType === "system" || message.messageType === "system") return false;
    if (previous.senderId !== message.senderId) return false;

    const prevDate = new Date(previous.createdAt);
    const date = new Date(message.createdAt);
    if (!isValidDate(prevDate) || !isValidDate(date)) return false;
    if (!isSameDay(prevDate, date)) return false;

    return date.getTime() - prevDate.getTime() < GROUP_WINDOW_MS;
};

/** Whether a day separator should be rendered before `message`. */
export const startsNewDay = (previous: MiniChatMessage | undefined, message: MiniChatMessage) => {
    if (!previous) return true;
    const prevDate = new Date(previous.createdAt);
    const date = new Date(message.createdAt);
    if (!isValidDate(prevDate) || !isValidDate(date)) return false;
    return !isSameDay(prevDate, date);
};

/** Merge a freshly fetched list with local optimistic messages that have not been confirmed yet. */
export const mergeWithPendingMessages = (fetched: MiniChatMessage[], existing: MiniChatMessage[]) => {
    const pending = existing.filter((message) => message.id.startsWith("local-") && (message.status === "sending" || message.status === "failed"));
    if (pending.length === 0) return fetched;
    return [...fetched, ...pending];
};

export const getInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "?";
