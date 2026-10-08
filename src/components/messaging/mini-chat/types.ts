import type { BadgeRole } from "@/components/profile/RoleBadge";
import type { ConversationSummary } from "@/lib/messages/client";

export type MiniChatRole = "landlord" | "tenant";

/** A conversation as shown in the sidebar list and in a chat window header. */
export interface MiniChatContact {
    id: string;
    participantUserId: string | null;
    name: string;
    role: BadgeRole | null;
    avatar: string;
    avatarBgColor: string | null;
    lastMessage: string;
    lastMessageAt: string | null;
    time: string;
    unit: string;
    relationshipStatus: ConversationSummary["relationshipStatus"];
    unreadCount: number;
    unread: boolean;
    isArchived: boolean;
    isBlocked: boolean;
}

export type OpenMiniChat = MiniChatContact & {
    /** The window that currently receives keyboard focus and read receipts. */
    isActive: boolean;
    /** Collapsed to its header bar. */
    isMinimized: boolean;
    /** Messages received while the window was inactive or minimized. */
    pendingCount: number;
};

export type MiniChatOutboundStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

export type MiniChatMessage = {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    isOwn: boolean;
    status?: MiniChatOutboundStatus;
    messageType: "text" | "system" | "image" | "file";
    fileUrl: string | null;
    fileName: string | null;
    fileMimeType: string | null;
    isRedacted: boolean;
    redactedContent: string | null;
    // System message fields
    systemType?: string;
    metadata?: Record<string, unknown> | null;
    workflowStatus?: string;
    issueType?: string;
    invoiceId?: string;
};

export type MiniChatState = {
    messages: MiniChatMessage[];
    draft: string;
    isLoading: boolean;
    isSending: boolean;
    isUploading: boolean;
    uploadProgress: number;
    isOtherUserTyping: boolean;
    isOtherUserOnline: boolean;
    error: string | null;
};

export type MiniChatMenuAction = "archive" | "block" | "report";
