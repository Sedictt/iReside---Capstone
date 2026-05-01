import { BadgeRole } from "@/components/profile/RoleBadge";
import { Hammer } from "lucide-react";

export type ContactItem = {
    id: string;
    participantUserId: string | null;
    name: string;
    role: BadgeRole | null;
    unit: string;
    unread: number;
    lastContact: string;
    avatarUrl: string | null;
    initials: string;
    avatarBgColor: string | null;
    relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
    hasPaymentHistory: boolean;
    isArchived: boolean;
    isBlocked: boolean;
    isOnline?: boolean;
};

export type OutboundStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

export type UiMessage = {
    id: string;
    type: "landlord" | "tenant" | "system";
    messageType?: "text" | "system" | "image" | "file";
    content: string;
    redactedContent?: string;
    timestamp: string;
    createdAt: string;
    isRedacted?: boolean;
    isConfirmedDisclosed?: boolean;
    systemType?: string;
    paymentAmount?: string;
    receiptImg?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMimeType?: string;
    filePath?: string;
    invoiceId?: string;
    tenantName?: string;
    landlordName?: string;
    propertyName?: string;
    unit?: string;
    amount?: string;
    date?: string;
    description?: string;
    workflowStatus?: string;
    expiresAt?: string;
    landlordTransactionPath?: string;
    paymentId?: string;
    invoiceNumber?: string;
    status?: OutboundStatus;
    isPhishing?: boolean;
    redactionCategory?: "none" | "credentials" | "profanity" | "phishing" | "spam";
    disclosureAllowed?: boolean;
    attachments?: UiMessage[];
    isAlbum?: boolean;
    issueType?: "insufficient_amount" | "excessive_amount" | "not_received" | "invalid_proof" | "other";
    shortfallAmount?: number;
    rejectionReason?: string;
    hasRefundDetails?: boolean;
    metadata?: Record<string, any>;
};

export type SharedFileItem = {
    id: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
    timestampLabel: string;
    isMedia: boolean;
};

export type PendingAttachment = {
    id: string;
    file: File;
    isImage: boolean;
    previewUrl: string | null;
    status: 'idle' | 'uploading' | 'uploaded' | 'error';
    url?: string;
    path?: string;
    progress?: number;
};

export type QuickAction = {
    key: string;
    icon: typeof Hammer;
    labelTop: string;
    labelBottom: string;
    iconClassName: string;
    iconContainerClassName: string;
};

export type ConfirmActionType = "archive" | "block";
