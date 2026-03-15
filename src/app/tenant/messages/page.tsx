"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Search,
    MoreVertical,
    Send,
    Paperclip,
    ShieldCheck,
    Download,
    CheckCircle2,
    CalendarClock,
    Wrench,
    FileText,
    AlertTriangle,
    Receipt,
    Wallet,
    X,
    History,
    ArrowLeft,
    Zap,
    CreditCard,
    Home,
    AlertCircle,
    ImageIcon,
    Folder,
    File,
    Check,
    CheckCheck,
    Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { TenantIrisChat } from "@/components/tenant/TenantIrisChat";
import { useAuth } from "@/hooks/useAuth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    createOrGetDirectConversation,
    fetchConversationMessages,
    fetchConversations,
    markConversationAsRead,
    searchMessageUsers,
    sendConversationMessage,
    uploadConversationFile,
    type ConversationMessage,
    type ConversationSummary,
    type MessageUserSearchResult,
} from "@/lib/messages/client";

type ContactItem = {
    id: string;
    participantUserId: string | null;
    name: string;
    unit: string;
    unread: number;
    lastContact: string;
    avatar: string;
    isAI: boolean;
    relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
    hasPaymentHistory: boolean;
    isArchived: boolean;
    isBlocked: boolean;
};

type OutboundStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

type UiMessage = {
    id: string;
    type: "tenant" | "landlord" | "system";
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
    unit?: string;
    amount?: string;
    date?: string;
    description?: string;
    status?: OutboundStatus;
};

const IRIS_CONTACT: ContactItem = {
    id: "iris",
    participantUserId: null,
    name: "iRis Assistant",
    unit: "AI Concierge",
    unread: 0,
    lastContact: "Always Available",
    avatar: "/iris-avatar.png",
    isAI: true,
    relationshipStatus: "stranger",
    hasPaymentHistory: false,
    isArchived: false,
    isBlocked: false,
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";
const MESSAGE_CACHE_KEY_PREFIX = "ireside:tenant:messages-cache";

type SharedFileItem = {
    id: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
    timestampLabel: string;
    isMedia: boolean;
};

type PendingAttachment = {
    file: File;
    isImage: boolean;
    previewUrl: string | null;
};

type QuickAction = {
    key: string;
    icon: typeof AlertCircle;
    labelTop: string;
    labelBottom: string;
    iconClassName: string;
    iconContainerClassName: string;
};

type ConfirmActionType = "archive" | "block";

const TENANT_QUICK_ACTIONS_BY_RELATIONSHIP: Record<ContactItem["relationshipStatus"], QuickAction[]> = {
    tenant_landlord: [
        {
            key: "report-damage",
            icon: AlertCircle,
            labelTop: "Report",
            labelBottom: "Damage",
            iconClassName: "text-red-500",
            iconContainerClassName: "bg-red-500/10",
        },
        {
            key: "pay-rent",
            icon: CreditCard,
            labelTop: "Pay",
            labelBottom: "Rent",
            iconClassName: "text-emerald-500",
            iconContainerClassName: "bg-emerald-500/10",
        },
        {
            key: "view-lease",
            icon: FileText,
            labelTop: "View",
            labelBottom: "Lease",
            iconClassName: "text-blue-400",
            iconContainerClassName: "bg-blue-500/10",
        },
        {
            key: "property-rules",
            icon: Home,
            labelTop: "Property",
            labelBottom: "Rules",
            iconClassName: "text-amber-500",
            iconContainerClassName: "bg-amber-500/10",
        },
    ],
    prospective: [
        {
            key: "view-listing",
            icon: Home,
            labelTop: "View",
            labelBottom: "Listing",
            iconClassName: "text-amber-500",
            iconContainerClassName: "bg-amber-500/10",
        },
        {
            key: "application-status",
            icon: CalendarClock,
            labelTop: "Check",
            labelBottom: "Status",
            iconClassName: "text-blue-400",
            iconContainerClassName: "bg-blue-500/10",
        },
        {
            key: "request-tour",
            icon: Wrench,
            labelTop: "Request",
            labelBottom: "Tour",
            iconClassName: "text-primary",
            iconContainerClassName: "bg-primary/10",
        },
        {
            key: "share-docs",
            icon: FileText,
            labelTop: "Share",
            labelBottom: "Docs",
            iconClassName: "text-purple-400",
            iconContainerClassName: "bg-purple-500/10",
        },
    ],
    stranger: [
        {
            key: "view-profile",
            icon: Search,
            labelTop: "View",
            labelBottom: "Profile",
            iconClassName: "text-blue-400",
            iconContainerClassName: "bg-blue-500/10",
        },
        {
            key: "archive-chat",
            icon: FileText,
            labelTop: "Archive",
            labelBottom: "Chat",
            iconClassName: "text-neutral-300",
            iconContainerClassName: "bg-neutral-500/10",
        },
        {
            key: "report-user",
            icon: AlertTriangle,
            labelTop: "Report",
            labelBottom: "User",
            iconClassName: "text-red-500",
            iconContainerClassName: "bg-red-500/10",
        },
        {
            key: "block-contact",
            icon: X,
            labelTop: "Block",
            labelBottom: "Contact",
            iconClassName: "text-orange-400",
            iconContainerClassName: "bg-orange-500/10",
        },
    ],
};

export default function TenantMessagesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const supabase = useMemo(() => createSupabaseClient(), []);
    const conversationFromUrl = searchParams.get("conversation")?.trim() || null;

    const [contacts, setContacts] = useState<ContactItem[]>([IRIS_CONTACT]);
    const [activeConversationId, setActiveConversationId] = useState<string>(() => conversationFromUrl ?? "iris");
    const [messagesState, setMessagesState] = useState<UiMessage[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState("all");
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [conversationsError, setConversationsError] = useState<string | null>(null);
    const [messagesError, setMessagesError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<MessageUserSearchResult[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [userSearchError, setUserSearchError] = useState<string | null>(null);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [isSidebarLoading, setIsSidebarLoading] = useState(true);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [fileUploadError, setFileUploadError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isComposerDragOver, setIsComposerDragOver] = useState(false);
    const [isGlobalFileDrag, setIsGlobalFileDrag] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [pendingConfirmAction, setPendingConfirmAction] = useState<ConfirmActionType | null>(null);
    const [isSubmittingConfirmAction, setIsSubmittingConfirmAction] = useState(false);
    const [showReportWizard, setShowReportWizard] = useState(false);
    const [reportCategory, setReportCategory] = useState("spam");
    const [reportDetails, setReportDetails] = useState("");
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportWizardError, setReportWizardError] = useState<string | null>(null);

    const activeChannelRef = useRef<RealtimeChannel | null>(null);
    const typingStopTimeoutRef = useRef<number | null>(null);
    const remoteTypingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dragDepthRef = useRef(0);
    const messagesCacheRef = useRef<Map<string, UiMessage[]>>(new Map());
    const activeConversationIdRef = useRef<string>(conversationFromUrl ?? "iris");

    useEffect(() => {
        return () => {
            if (pendingAttachment?.previewUrl) {
                URL.revokeObjectURL(pendingAttachment.previewUrl);
            }
        };
    }, [pendingAttachment]);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        if (!conversationFromUrl || conversationFromUrl === activeConversationId) {
            return;
        }

        const isConversationKnown = contacts.some((contact) => contact.id === conversationFromUrl);
        if (!isConversationKnown) {
            return;
        }

        setActiveConversationId(conversationFromUrl);
    }, [activeConversationId, contacts, conversationFromUrl]);

    useEffect(() => {
        const currentConversationInUrl = searchParams.get("conversation")?.trim() || null;
        const nextConversationForUrl = activeConversationId === "iris" ? null : activeConversationId;

        if (currentConversationInUrl === nextConversationForUrl) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        if (!nextConversationForUrl) {
            nextParams.delete("conversation");
        } else {
            nextParams.set("conversation", nextConversationForUrl);
        }

        const nextQuery = nextParams.toString();
        const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextHref, { scroll: false });
    }, [activeConversationId, pathname, router, searchParams]);

    useEffect(() => {
        if (!user?.id) {
            messagesCacheRef.current.clear();
            return;
        }

        try {
            const raw = sessionStorage.getItem(`${MESSAGE_CACHE_KEY_PREFIX}:${user.id}`);
            if (!raw) {
                messagesCacheRef.current.clear();
                return;
            }

            const parsed = JSON.parse(raw) as Record<string, UiMessage[]>;
            const entries = Object.entries(parsed).filter((entry): entry is [string, UiMessage[]] => Array.isArray(entry[1]));
            messagesCacheRef.current = new Map(entries);
        } catch {
            messagesCacheRef.current.clear();
        }
    }, [user?.id]);

    const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
        if (!messagesEndRef.current || activeConversationId === "iris") {
            return;
        }

        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }, [activeConversationId]);

    const visibleContacts = useMemo(
        () => contacts.filter((contact) => contact.isAI || (!contact.isArchived && !contact.isBlocked)),
        [contacts]
    );

    const activeContact = useMemo(
        () => visibleContacts.find((contact) => contact.id === activeConversationId) ?? IRIS_CONTACT,
        [visibleContacts, activeConversationId]
    );

    const activeRelationshipStatus = activeContact.relationshipStatus;
    const activeQuickActions = TENANT_QUICK_ACTIONS_BY_RELATIONSHIP[activeRelationshipStatus];
    const canShowPaymentHistory =
        activeRelationshipStatus === "tenant_landlord" && activeContact.hasPaymentHistory;

    const mapConversationToContact = (conversation: ConversationSummary): ContactItem => {
        const other = conversation.otherParticipants[0];

        return {
            id: conversation.id,
            participantUserId: other?.id ?? null,
            name: other?.fullName ?? "Conversation",
            unit: other?.role === "landlord" ? "Landlord" : other?.role === "tenant" ? "Tenant" : "Participant",
            unread: conversation.unreadCount,
            lastContact: conversation.lastMessage
                ? new Date(conversation.lastMessage.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "No messages yet",
            avatar: other?.avatarUrl || FALLBACK_AVATAR,
            isAI: false,
            relationshipStatus: conversation.relationshipStatus,
            hasPaymentHistory: conversation.hasPaymentHistory,
            isArchived: conversation.isArchived,
            isBlocked: conversation.isBlocked,
        };
    };

    useEffect(() => {
        if (!canShowPaymentHistory && showPaymentHistoryModal) {
            setShowPaymentHistoryModal(false);
        }
    }, [canShowPaymentHistory, showPaymentHistoryModal]);

    useEffect(() => {
        if (activeConversationId === "iris") {
            return;
        }

        if (isSidebarLoading) {
            return;
        }

        const stillVisible = visibleContacts.some((contact) => contact.id === activeConversationId);
        if (stillVisible) {
            return;
        }

        setShowInfoSidebar(false);
        setShowFilesSidebar(false);
        setActiveConversationId("iris");
    }, [activeConversationId, isSidebarLoading, visibleContacts]);

    const updateActiveContactActionState = useCallback((nextState: { archived?: boolean; blocked?: boolean }) => {
        if (!activeConversationId || activeConversationId === "iris") {
            return;
        }

        setContacts((prev) => prev.map((contact) => {
            if (contact.id !== activeConversationId) {
                return contact;
            }

            return {
                ...contact,
                isArchived: nextState.archived ?? contact.isArchived,
                isBlocked: nextState.blocked ?? contact.isBlocked,
            };
        }));
    }, [activeConversationId]);

    const submitMessageUserAction = useCallback(async (action: "archive" | "block") => {
        if (!activeContact.participantUserId) {
            return;
        }

        setIsSubmittingConfirmAction(true);
        setUserSearchError(null);

        try {
            const response = await fetch(`/api/messages/users/${activeContact.participantUserId}/actions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action }),
            });

            const payload = (await response.json().catch(() => null)) as {
                error?: string;
                state?: { archived?: boolean; blocked?: boolean };
            } | null;

            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to update action.");
            }

            updateActiveContactActionState({
                archived: Boolean(payload?.state?.archived),
                blocked: Boolean(payload?.state?.blocked),
            });

            await refreshConversations();
            setPendingConfirmAction(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update action.";
            setUserSearchError(message);
        } finally {
            setIsSubmittingConfirmAction(false);
        }
    }, [activeContact.participantUserId, refreshConversations, updateActiveContactActionState]);

    const submitUserReport = useCallback(async () => {
        if (!activeContact.participantUserId) {
            return;
        }

        setReportWizardError(null);
        setIsSubmittingReport(true);

        try {
            const response = await fetch(`/api/messages/users/${activeContact.participantUserId}/reports`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    conversationId: activeConversationId,
                    category: reportCategory,
                    details: reportDetails,
                }),
            });

            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to submit report.");
            }

            setShowReportWizard(false);
            setReportCategory("spam");
            setReportDetails("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to submit report.";
            setReportWizardError(message);
        } finally {
            setIsSubmittingReport(false);
        }
    }, [activeContact.participantUserId, activeConversationId, reportCategory, reportDetails]);

    const handleTenantQuickAction = useCallback((actionKey: QuickAction["key"]) => {
        switch (actionKey) {
            case "report-damage":
                setMessageInput("Hi, I need to report a maintenance issue in my unit.\n\nIssue details: ");
                break;
            case "pay-rent":
                router.push("/tenant/payments");
                break;
            case "view-lease":
            case "property-rules":
                router.push("/tenant/lease");
                break;
            case "view-listing":
                router.push("/saved");
                break;
            case "application-status":
                router.push("/tenant/applications");
                break;
            case "request-tour":
                setMessageInput("Hi, I would like to request a property viewing schedule. What time slots are available?");
                break;
            case "share-docs":
                setShowInfoSidebar(false);
                setShowFilesSidebar(true);
                break;
            case "view-profile":
                if (activeContact.participantUserId) {
                    router.push(`/visitor/${activeContact.participantUserId}`);
                }
                break;
            case "archive-chat":
                setPendingConfirmAction("archive");
                break;
            case "report-user":
                setReportWizardError(null);
                setShowReportWizard(true);
                break;
            case "block-contact":
                setPendingConfirmAction("block");
                break;
            default:
                break;
        }
    }, [activeContact.participantUserId, router]);

    const mapMessageToUi = (message: ConversationMessage): UiMessage => {
        const metadata = (message.metadata && typeof message.metadata === "object")
            ? (message.metadata as Record<string, unknown>)
            : null;

        const isOwn = user?.id === message.senderId;
        const redactedContent = typeof metadata?.redactedContent === "string" ? metadata.redactedContent : message.content;
        const isRedacted = Boolean(metadata?.isRedacted);
        const isConfirmedDisclosed = metadata?.isConfirmedDisclosed === true;
        const fileUrl = typeof metadata?.fileUrl === "string" ? metadata.fileUrl : undefined;
        const fileName = typeof metadata?.fileName === "string" ? metadata.fileName : undefined;
        const filePath = typeof metadata?.filePath === "string" ? metadata.filePath : undefined;
        const fileMimeType = typeof metadata?.mimeType === "string" ? metadata.mimeType : undefined;
        const fileSize = typeof metadata?.fileSize === "number" ? metadata.fileSize : undefined;

        return {
            id: message.id,
            type: isOwn ? "tenant" : "landlord",
            messageType: message.type,
            content: message.content,
            redactedContent,
            timestamp: new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
            createdAt: message.createdAt,
            isRedacted,
            isConfirmedDisclosed,
            systemType: typeof metadata?.systemType === "string" ? metadata.systemType : undefined,
            paymentAmount: typeof metadata?.paymentAmount === "string" ? metadata.paymentAmount : undefined,
            receiptImg: typeof metadata?.receiptImg === "string" ? metadata.receiptImg : undefined,
            fileUrl,
            fileName,
            filePath,
            fileMimeType,
            fileSize,
            status: isOwn ? (message.readAt ? "seen" : "delivered") : undefined,
        };
    };

    const formatFileSize = (bytes: number) => {
        if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const sharedFiles = useMemo<SharedFileItem[]>(() => {
        return messagesState
            .filter((message) => Boolean(message.fileUrl))
            .map((message) => {
                const mimeType = message.fileMimeType ?? "application/octet-stream";
                const isMedia = mimeType.startsWith("image/");

                return {
                    id: message.id,
                    url: message.fileUrl as string,
                    name: message.fileName ?? message.content,
                    size: message.fileSize ?? 0,
                    mimeType,
                    createdAt: message.createdAt,
                    timestampLabel: new Date(message.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }),
                    isMedia,
                };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [messagesState]);

    const totalSharedSize = useMemo(
        () => sharedFiles.reduce((sum, file) => sum + file.size, 0),
        [sharedFiles]
    );

    async function refreshConversations() {
        if (!user) return;

        try {
            const { data: list, error } = await fetchConversations();
            setConversationsError(error);
            const mapped = [IRIS_CONTACT, ...list.map(mapConversationToContact)];
            setContacts(mapped);

            setActiveConversationId((current) => {
                if (conversationFromUrl && mapped.some((contact) => contact.id === conversationFromUrl)) {
                    return conversationFromUrl;
                }
                if (mapped.some((contact) => contact.id === current)) {
                    return current;
                }
                return mapped[0]?.id ?? "iris";
            });
        } finally {
            setIsSidebarLoading(false);
        }
    }

    const refreshMessages = async (conversationId: string) => {
        const { data: list, error } = await fetchConversationMessages(conversationId, 200);
        setMessagesError(error);
        const mapped: UiMessage[] = list.map(mapMessageToUi);
        messagesCacheRef.current.set(conversationId, mapped);

        if (user?.id) {
            try {
                sessionStorage.setItem(
                    `${MESSAGE_CACHE_KEY_PREFIX}:${user.id}`,
                    JSON.stringify(Object.fromEntries(messagesCacheRef.current.entries()))
                );
            } catch {
                // Ignore quota or serialization errors; in-memory cache still works for this session.
            }
        }

        if (activeConversationIdRef.current === conversationId) {
            setMessagesState((prev) => {
                const optimistic = prev.filter(
                    (msg) =>
                        msg.type === "tenant" &&
                        (msg.status === "sending" || msg.status === "sent") &&
                        !mapped.some((serverMessage) => serverMessage.id === msg.id)
                );
                return [...mapped, ...optimistic];
            });
        }

        if (error) {
            return;
        }

        await markConversationAsRead(conversationId);
    };

    const prettifyRedactedText = (text: string) => {
        return text
            .replace(/█{3,}/g, '*****')
            .replace(/\[REDACTED\]/g, '*****')
            .replace(/(\*{5}\s*){2,}/g, '***** ')
            .trim();
    };

    const handleDownloadImage = async (elementId: string, filename: string) => {
        try {
            setIsDownloading(true);
            const domtoimage = (await import('dom-to-image')).default;
            const element = document.getElementById(elementId);
            if (!element) return;

            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await domtoimage.toPng(element, {
                bgcolor: '#0a0a0a',
                height: element.offsetHeight,
                width: element.offsetWidth,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to generate image", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const fallbackRedact = (text: string) => {
        let redacted = text;
        const token = '*****';
        const patterns: RegExp[] = [
            /\b(?:password|passcode|pin|otp|cvv|cvc|gcash|bank\s?account|account\s?number|routing\s?number)\b\s*(?:is|:|=)?\s*([A-Za-z0-9!@#$%^&*()_+\-=]{3,})/gi,
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
            /\b09\d{9}\b/g,
            /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
        ];

        for (const pattern of patterns) {
            redacted = redacted.replace(pattern, token);
        }

        redacted = redacted.replace(/(\*{5}\s*){2,}/g, token + ' ').trim();

        return {
            isSensitive: redacted !== text,
            redactedMessage: redacted,
        };
    };

    const clearPendingAttachment = () => {
        setPendingAttachment((current) => {
            if (current?.previewUrl) {
                URL.revokeObjectURL(current.previewUrl);
            }
            return null;
        });
    };

    const queueSelectedFile = (file: File) => {
        if (!activeConversationId || activeConversationId === "iris") {
            setFileUploadError("File sharing is only available in direct conversations.");
            return;
        }

        setFileUploadError(null);
        setPendingAttachment((current) => {
            if (current?.previewUrl) {
                URL.revokeObjectURL(current.previewUrl);
            }

            const isImage = file.type.startsWith("image/");
            return {
                file,
                isImage,
                previewUrl: isImage ? URL.createObjectURL(file) : null,
            };
        });
    };

    const handleSendMessage = async () => {
        const textMessage = messageInput.trim();
        const hasText = textMessage.length > 0;
        const hasAttachment = Boolean(pendingAttachment);

        if ((!hasText && !hasAttachment) || activeConversationId === "iris") return;

        if (activeChannelRef.current && user?.id) {
            void activeChannelRef.current.send({
                type: "broadcast",
                event: "typing",
                payload: {
                    conversationId: activeConversationId,
                    userId: user.id,
                    isTyping: false,
                },
            });
        }

        if (hasText) {
            const optimisticId = `local-${Date.now()}`;
            const optimisticTimestamp = new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

            setMessageInput("");
            setMessagesState((prev) => [
                ...prev,
                {
                    id: optimisticId,
                    type: "tenant",
                    messageType: "text",
                    content: textMessage,
                    redactedContent: textMessage,
                    timestamp: optimisticTimestamp,
                    createdAt: new Date().toISOString(),
                    isRedacted: false,
                    isConfirmedDisclosed: false,
                    status: "sending",
                },
            ]);

            let isSensitive = false;
            let redactedMessage = textMessage;

            try {
                const response = await fetch('/api/iris/redact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: textMessage }),
                });

                if (response.ok) {
                    const data = await response.json();
                    isSensitive = !!data.isSensitive;
                    redactedMessage = typeof data.redactedMessage === 'string' ? data.redactedMessage : textMessage;
                } else {
                    const fallback = fallbackRedact(textMessage);
                    isSensitive = fallback.isSensitive;
                    redactedMessage = fallback.redactedMessage;
                }
            } catch {
                const fallback = fallbackRedact(textMessage);
                isSensitive = fallback.isSensitive;
                redactedMessage = fallback.redactedMessage;
            }

            try {
                const created = await sendConversationMessage(activeConversationId, textMessage, {
                    isRedacted: isSensitive,
                    redactedContent: redactedMessage,
                    isConfirmedDisclosed: false,
                });

                setMessagesState((prev) =>
                    prev.map((msg) =>
                        msg.id === optimisticId
                            ? {
                                ...msg,
                                id: created.id,
                                content: created.content,
                                redactedContent: redactedMessage,
                                timestamp: new Date(created.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                                createdAt: created.createdAt,
                                messageType: created.type,
                                isRedacted: isSensitive,
                                isConfirmedDisclosed: false,
                                status: "sent",
                            }
                            : msg
                    )
                );

                window.setTimeout(() => {
                    setMessagesState((prev) =>
                        prev.map((msg) => (msg.id === created.id && msg.status === "sent" ? { ...msg, status: "delivered" } : msg))
                    );
                }, 350);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to send message.";
                setMessagesError(message);
                setMessagesState((prev) =>
                    prev.map((msg) => (msg.id === optimisticId ? { ...msg, status: "failed" } : msg))
                );
            }
        }

        if (hasAttachment && pendingAttachment) {
            setFileUploadError(null);
            setMessagesError(null);
            setIsUploadingFile(true);
            setUploadProgress(0);

            try {
                const result = await uploadConversationFile(activeConversationId, pendingAttachment.file, (percent) => {
                    setUploadProgress(percent);
                });

                const created = result.message;
                const mapped = mapMessageToUi({
                    id: created.id,
                    conversationId: created.conversationId,
                    senderId: created.senderId,
                    sender: null,
                    type: created.type,
                    content: created.content,
                    metadata: created.metadata,
                    readAt: created.readAt,
                    createdAt: created.createdAt,
                });

                setMessagesState((prev) => [...prev, { ...mapped, status: "sent" }]);
                window.setTimeout(() => {
                    setMessagesState((prev) =>
                        prev.map((msg) => (msg.id === created.id && msg.status === "sent" ? { ...msg, status: "delivered" } : msg))
                    );
                }, 350);

                clearPendingAttachment();
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to upload file.";
                setFileUploadError(message);
            } finally {
                setIsUploadingFile(false);
                window.setTimeout(() => setUploadProgress(null), 500);
            }
        }

        void refreshConversations();
        void refreshMessages(activeConversationId);
    };

    const handleFilePickerOpen = () => {
        if (activeConversationId === "iris") {
            setFileUploadError("File sharing is only available in direct conversations.");
            return;
        }

        fileInputRef.current?.click();
    };

    const uploadSelectedFile = useCallback(async (selectedFile: File) => {
        queueSelectedFile(selectedFile);
    }, [activeConversationId]);

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        event.target.value = "";

        if (!selectedFile) {
            return;
        }

        await uploadSelectedFile(selectedFile);
    };

    const handleComposerDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (activeConversationId === "iris") {
            setFileUploadError("File sharing is only available in direct conversations.");
            return;
        }

        setIsComposerDragOver(true);
    };

    const handleComposerDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && event.currentTarget.contains(nextTarget)) {
            return;
        }

        setIsComposerDragOver(false);
    };

    const handleComposerDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsComposerDragOver(false);

        if (activeConversationId === "iris") {
            setFileUploadError("File sharing is only available in direct conversations.");
            return;
        }

        const file = event.dataTransfer.files?.[0];
        if (!file) {
            return;
        }

        await uploadSelectedFile(file);
    };

    useEffect(() => {
        const hasFiles = (event: DragEvent) => event.dataTransfer?.types?.includes("Files") ?? false;

        const handleWindowDragEnter = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            dragDepthRef.current += 1;
            setIsGlobalFileDrag(true);
        };

        const handleWindowDragOver = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "copy";
            }
        };

        const handleWindowDragLeave = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
                setIsGlobalFileDrag(false);
                setIsComposerDragOver(false);
            }
        };

        const handleWindowDrop = (event: DragEvent) => {
            if (!hasFiles(event)) return;
            event.preventDefault();
            dragDepthRef.current = 0;
            setIsGlobalFileDrag(false);
            setIsComposerDragOver(false);

            const file = event.dataTransfer?.files?.[0];
            if (!file) {
                return;
            }

            void uploadSelectedFile(file);
        };

        window.addEventListener("dragenter", handleWindowDragEnter);
        window.addEventListener("dragover", handleWindowDragOver);
        window.addEventListener("dragleave", handleWindowDragLeave);
        window.addEventListener("drop", handleWindowDrop);

        return () => {
            window.removeEventListener("dragenter", handleWindowDragEnter);
            window.removeEventListener("dragover", handleWindowDragOver);
            window.removeEventListener("dragleave", handleWindowDragLeave);
            window.removeEventListener("drop", handleWindowDrop);
        };
    }, [uploadSelectedFile]);

    const handleMessageInputChange = (value: string) => {
        setMessageInput(value);

        if (!activeConversationId || activeConversationId === "iris" || !user || !activeChannelRef.current) {
            return;
        }

        const isTyping = value.trim().length > 0;

        void activeChannelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: {
                conversationId: activeConversationId,
                userId: user.id,
                isTyping,
            },
        });

        if (!isTyping) {
            if (typingStopTimeoutRef.current) {
                window.clearTimeout(typingStopTimeoutRef.current);
                typingStopTimeoutRef.current = null;
            }
            return;
        }

        if (typingStopTimeoutRef.current) {
            window.clearTimeout(typingStopTimeoutRef.current);
        }

        typingStopTimeoutRef.current = window.setTimeout(() => {
            if (!activeChannelRef.current || !user?.id || !activeConversationId || activeConversationId === "iris") {
                return;
            }

            void activeChannelRef.current.send({
                type: "broadcast",
                event: "typing",
                payload: {
                    conversationId: activeConversationId,
                    userId: user.id,
                    isTyping: false,
                },
            });
            typingStopTimeoutRef.current = null;
        }, 1200);
    };

    const renderOutgoingStatus = (status: OutboundStatus | undefined, timestamp: string) => {
        switch (status) {
            case "sending":
                return (
                    <>
                        <Clock3 className="h-3 w-3" />
                        <span>Sending</span>
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
            case "sent":
                return (
                    <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
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
            case "failed":
                return (
                    <>
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="text-red-400">Failed</span>
                        <span className="text-neutral-600">• {timestamp}</span>
                    </>
                );
            default:
                return <span>{timestamp}</span>;
        }
    };

    const confirmDisclose = (id: string) => {
        setMessagesState(prev => prev.map(m =>
            m.id === id ? { ...m, isConfirmedDisclosed: true } : m
        ));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleStartConversation = async (targetUserId: string) => {
        try {
            const conversationId = await createOrGetDirectConversation(targetUserId);
            await refreshConversations();
            setActiveConversationId(conversationId);
            setSearchQuery("");
            setUserSearchResults([]);
            setUserSearchError(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to start conversation.";
            setUserSearchError(message);
        }
    };

    useEffect(() => {
        if (!user) return;
        refreshConversations();
    }, [user]);

    useEffect(() => {
        if (!activeConversationId || activeConversationId === "iris") {
            setMessagesState([]);
            setIsOtherUserTyping(false);
            setIsMessagesLoading(false);
            return;
        }

        const cached = messagesCacheRef.current.get(activeConversationId);
        if (cached) {
            setMessagesState(cached);
            setIsOtherUserTyping(false);
            setIsMessagesLoading(false);
            return;
        }

        setMessagesState([]);
        setIsOtherUserTyping(false);
        setIsMessagesLoading(true);

        let cancelled = false;
        void (async () => {
            await refreshMessages(activeConversationId);
            if (!cancelled) {
                setIsMessagesLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [activeConversationId]);

    useEffect(() => {
        if (!activeConversationId || activeConversationId === "iris") return;

        const channel = supabase
            .channel(`messages-${activeConversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${activeConversationId}`,
                },
                async () => {
                    await refreshMessages(activeConversationId);
                    await refreshConversations();
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
                    if (candidate.conversationId !== activeConversationId) {
                        return;
                    }
                    if (!candidate.userId || candidate.userId === user?.id) {
                        return;
                    }

                    setIsOtherUserTyping(Boolean(candidate.isTyping));

                    if (remoteTypingTimeoutRef.current) {
                        window.clearTimeout(remoteTypingTimeoutRef.current);
                        remoteTypingTimeoutRef.current = null;
                    }

                    if (candidate.isTyping) {
                        remoteTypingTimeoutRef.current = window.setTimeout(() => {
                            setIsOtherUserTyping(false);
                            remoteTypingTimeoutRef.current = null;
                        }, 1800);
                    }
                }
            )
            .subscribe();

        activeChannelRef.current = channel;

        return () => {
            activeChannelRef.current = null;
            supabase.removeChannel(channel);
        };
    }, [activeConversationId, supabase, user?.id]);

    useEffect(() => {
        if (activeConversationId === "iris") {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            scrollToLatest("auto");
        });
        const timeout = window.setTimeout(() => {
            scrollToLatest("auto");
        }, 80);

        return () => {
            window.cancelAnimationFrame(frame);
            window.clearTimeout(timeout);
        };
    }, [messagesState, isOtherUserTyping, activeConversationId, isMessagesLoading, scrollToLatest]);

    useEffect(() => {
        if (!user) return;

        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") {
                return;
            }

            void refreshConversations();
            if (activeConversationId && activeConversationId !== "iris") {
                void refreshMessages(activeConversationId);
            }
        }, 5000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [user, activeConversationId]);

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < 2) {
            setUserSearchResults([]);
            setUserSearchError(null);
            setIsSearchingUsers(false);
            return;
        }

        let cancelled = false;
        const timeout = setTimeout(async () => {
            setIsSearchingUsers(true);
            const { data, error } = await searchMessageUsers(query, 8);
            if (cancelled) return;
            setUserSearchResults(data);
            setUserSearchError(error);
            setIsSearchingUsers(false);
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [searchQuery]);

    const renderSystemIcon = (type: string) => {
        switch (type) {
            case 'payment_submitted': return <FileText className="h-4 w-4 text-primary" />;
            case 'payment': return <CheckCircle2 className="h-4 w-4 text-primary" />;
            case 'invoice': return <Receipt className="h-4 w-4 text-emerald-500" />;
            case 'maintenance': return <Wrench className="h-4 w-4 text-amber-500" />;
            case 'maintenance_resolved': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'lease': return <FileText className="h-4 w-4 text-purple-500" />;
            default: return <CalendarClock className="h-4 w-4 text-neutral-500" />;
        }
    };

    const shouldShowLoadingOverlay =
        isSidebarLoading ||
        (Boolean(conversationFromUrl) && activeConversationId !== conversationFromUrl) ||
        (activeConversationId !== "iris" && isMessagesLoading);

    return (
        <div className="flex h-full w-full bg-[#0a0a0a] text-white overflow-hidden p-6 gap-6 animate-in fade-in duration-700">
            {shouldShowLoadingOverlay && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/80 px-8 py-6 text-center shadow-2xl">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-primary" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-semibold text-white">Loading conversation...</p>
                            <p className="mt-1 text-xs text-neutral-400">Preparing your messages.</p>
                        </div>
                    </div>
                </div>
            )}

            {isGlobalFileDrag && (
                <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="rounded-3xl border border-primary/40 bg-neutral-900/90 px-10 py-8 shadow-2xl shadow-primary/20 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                            <Paperclip className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-lg font-bold text-white">
                            {activeConversationId === "iris" ? "File sharing unavailable in Iris chat" : "Drop here to upload"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">Release to add this file to the composer</p>
                    </div>
                </div>
            )}

            {/* Sidebar Contact List */}
            <div className="w-80 lg:w-96 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col shrink-0 h-full overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/5 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/tenant/dashboard"
                            className="bg-neutral-800 hover:bg-white/10 p-2 rounded-xl border border-white/10 transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 text-neutral-300" />
                        </Link>
                        <h2 className="text-xl font-bold text-white leading-none mt-0.5">Messages</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users to message..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary transition-all"
                        />

                        {searchQuery.trim().length >= 2 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-neutral-950/95 p-1 shadow-2xl backdrop-blur">
                                {isSearchingUsers && (
                                    <div className="px-3 py-2 text-xs text-neutral-400">Searching users...</div>
                                )}
                                {!isSearchingUsers && userSearchError && (
                                    <div className="px-3 py-2 text-xs text-red-300">{userSearchError}</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-neutral-400">No matching users found.</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleStartConversation(result.id)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/10"
                                    >
                                        <img
                                            src={result.avatarUrl || FALLBACK_AVATAR}
                                            alt={result.fullName}
                                            className="h-8 w-8 rounded-full border border-white/10 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-white">{result.fullName}</div>
                                            <div className="truncate text-[11px] text-neutral-400">{result.role} • {result.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {conversationsError && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                            <div className="flex-1 leading-relaxed">{conversationsError}</div>
                            <button
                                onClick={() => setConversationsError(null)}
                                className="rounded p-0.5 text-red-200/80 hover:bg-white/10 hover:text-red-100"
                                aria-label="Dismiss conversation error"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Contacts */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {isSidebarLoading ? (
                        <div className="space-y-2" aria-live="polite" aria-busy="true">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={`sidebar-skeleton-${index}`} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-neutral-700/70" />
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="h-3.5 w-1/2 rounded bg-neutral-700/70" />
                                        <div className="h-2.5 w-2/3 rounded bg-neutral-800/70" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {visibleContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => setActiveConversationId(contact.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                                        activeConversationId === contact.id ? "bg-white/10 border border-white/10" : "hover:bg-white/[0.03] border border-transparent"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border",
                                            contact.isAI ? "border-primary bg-primary/10" : "border-white/10"
                                        )}>
                                            <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                                        </div>
                                        {contact.unread > 0 && (
                                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-white">{contact.unread}</span>
                                            </div>
                                        )}
                                        {contact.isAI && (
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#0a0a0a] border-2 border-[#0a0a0a] flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className={cn("font-bold text-sm truncate pr-2", contact.isAI ? "text-primary" : "text-white")}>{contact.name}</h4>
                                            <span className={cn("text-[10px] shrink-0", contact.isAI ? "text-primary uppercase tracking-widest font-bold" : "text-neutral-500")}>{contact.lastContact}</span>
                                        </div>
                                        <p className={cn("text-xs font-medium truncate", contact.isAI ? "text-neutral-300" : "text-neutral-400")}>{contact.unit}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeConversationId === 'iris' ? (
                <TenantIrisChat />
            ) : (
                <>
                    <div className="flex-1 flex flex-col min-w-0 h-full rounded-2xl border border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden shadow-2xl">
                        {/* Chat Header */}
                        <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/20 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4">
                                <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                <div>
                                    <h3 className="font-bold text-white text-base">{activeContact.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-400 font-medium">{activeContact.unit}</span>
                                        <span className="w-1 h-1 rounded-full bg-neutral-600"></span>
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] text-emerald-500 tracking-wide">Encrypted Audit Trail Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-neutral-300 text-xs font-medium">
                                    <Download className="w-4 h-4" />
                                    <span className="hidden md:inline">Export Audit Log</span>
                                </button>
                                <button className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                    <Search className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowFilesSidebar(!showFilesSidebar);
                                        setShowInfoSidebar(false);
                                    }}
                                    className={cn(
                                        "p-2 hover:text-white rounded-lg transition-colors",
                                        showFilesSidebar ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                                    )}
                                    title="Shared Files"
                                >
                                    <Folder className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowInfoSidebar(!showInfoSidebar);
                                        setShowFilesSidebar(false);
                                    }}
                                    className={cn(
                                        "p-2 hover:text-white rounded-lg transition-colors",
                                        showInfoSidebar ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5"
                                    )}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {messagesError && (
                            <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                                <div className="flex-1 leading-relaxed">{messagesError}</div>
                                <button
                                    onClick={() => setMessagesError(null)}
                                    className="rounded p-0.5 text-red-200/80 hover:bg-white/10 hover:text-red-100"
                                    aria-label="Dismiss message error"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center w-full">
                            <div className="w-full max-w-4xl p-6 space-y-6">
                                <div className="text-center py-4">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest bg-neutral-900 px-4 py-1.5 rounded-full border border-white/5 shadow-sm">
                                        Conversation Started • February 1, 2026
                                    </span>
                                </div>

                                {isMessagesLoading ? (
                                    <div className="w-full space-y-4" aria-live="polite" aria-busy="true">
                                        {Array.from({ length: 6 }).map((_, index) => {
                                            const isMe = index % 3 === 2;

                                            return (
                                                <div key={`message-skeleton-${index}`} className={cn("flex items-end gap-3 w-full", isMe ? "justify-end" : "justify-start")}>
                                                    {!isMe && <div className="w-8 h-8 rounded-full bg-neutral-700/70 animate-pulse shrink-0" />}
                                                    <div
                                                        className={cn(
                                                            "animate-pulse border",
                                                            isMe
                                                                ? "h-14 w-[45%] max-w-sm rounded-3xl rounded-br-sm bg-primary/25 border-primary/20"
                                                                : "h-16 w-[55%] max-w-md rounded-3xl rounded-bl-sm bg-neutral-800 border-white/5"
                                                        )}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                <>
                                {messagesState.map((msg) => {
                                    if (msg.type === "system") {
                                        return (
                                            <div key={msg.id} className="flex justify-center max-w-4xl mx-auto my-6 px-4">
                                                {msg.systemType === "payment_submitted" ? (
                                                    <div className="flex flex-col gap-0 bg-neutral-900 overflow-hidden border border-primary/30 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-primary/10 max-w-sm w-full transition-all hover:border-primary/50 hover:shadow-primary/20 group pb-4">
                                                        <div className="bg-gradient-to-r from-primary/80 to-primary p-5 relative overflow-hidden h-24 flex items-center shrink-0">
                                                            <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 w-24 h-24 rounded-full blur-2xl"></div>
                                                            <div className="relative z-10 flex items-center gap-3">
                                                                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/10">
                                                                    <Receipt className="h-6 w-6 text-black" />
                                                                </div>
                                                                <div className="text-left flex flex-col justify-center text-black">
                                                                    <p className="text-lg font-bold leading-tight">Payment Sent</p>
                                                                    <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">{msg.timestamp}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Details Section */}
                                                        <div className="px-5 pt-5 pb-2 flex flex-col gap-4">
                                                            <div className="flex justify-between items-center bg-black/30 rounded-2xl p-4 border border-white/5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">Amount Paid</span>
                                                                    <span className="text-2xl font-black text-primary">₱{msg.paymentAmount}</span>
                                                                </div>
                                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                                    <Wallet className="h-4 w-4 text-primary" />
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-800/30 p-3 rounded-xl border border-white/5">
                                                                {msg.content}
                                                            </p>

                                                            {msg.receiptImg && (
                                                                <div className="flex flex-col gap-2 mt-1">
                                                                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold ml-1">Proof of Payment</span>
                                                                    <div className="rounded-2xl overflow-hidden border border-white/10 relative cursor-pointer shadow-inner">
                                                                        <img src={msg.receiptImg} alt="Receipt" className="w-full h-32 object-cover opacity-90 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : msg.systemType === "invoice" ? (
                                                    <div id={`invoice-${msg.id}`} className="flex flex-col w-full max-w-md bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                                                        {/* Invoice Watermark Header */}
                                                        <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 border-b border-white/5 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                                <Receipt size={120} className="-rotate-12" />
                                                            </div>
                                                            <div className="relative z-10 flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                                                                            <div className="w-3 h-3 bg-black rounded-sm rotate-45" />
                                                                        </div>
                                                                        <h2 className="text-primary font-black tracking-tighter text-lg italic">iReside</h2>
                                                                    </div>
                                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Digital Payment Invoice</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                                        Status: Paid
                                                                    </span>
                                                                    <p className="text-[10px] text-neutral-400 mt-2 font-medium">{msg.invoiceId}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Invoice Content */}
                                                        <div className="p-6 space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Billed To</p>
                                                                    <p className="text-sm font-bold text-white leading-tight">{msg.tenantName}</p>
                                                                    <p className="text-[11px] text-neutral-400 mt-0.5">{msg.unit}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Date Issued</p>
                                                                    <p className="text-sm font-bold text-white leading-tight">{msg.date}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                                                <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider px-1">Description</span>
                                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider px-1">Amount</span>
                                                                </div>
                                                                <div className="p-4 flex items-center justify-between">
                                                                    <p className="text-xs text-neutral-300 font-medium">{msg.description}</p>
                                                                    <p className="text-sm font-black text-white">₱{msg.amount}</p>
                                                                </div>
                                                                <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-t border-white/5">
                                                                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Total Paid</span>
                                                                    <span className="text-lg font-black text-primary">₱{msg.amount}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    disabled={isDownloading}
                                                                    onClick={() => handleDownloadImage(`invoice-${msg.id}`, `Invoice-${msg.invoiceId}`)}
                                                                    className={cn(
                                                                        "flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl text-[11px] font-bold transition-all border border-white/5 flex items-center justify-center gap-2 group",
                                                                        isDownloading && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                                                                    {isDownloading ? "Generating..." : "Download Image"}
                                                                </button>
                                                                <button className="w-12 h-12 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center rounded-2xl transition-all border border-white/5">
                                                                    <ShieldCheck className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="px-6 py-3 bg-neutral-900 border-t border-white/5 text-center">
                                                            <p className="text-[9px] text-neutral-600 font-medium tracking-wide">Securely generated by iReside Iris Intelligence System</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-neutral-900/60 border border-white/5 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm text-center">
                                                        <div className="bg-black/50 p-2 rounded-full border border-white/5 shrink-0">
                                                            {renderSystemIcon(msg.systemType || '')}
                                                        </div>
                                                        <div className="text-left flex flex-col justify-center">
                                                            <p className="text-xs text-neutral-300 font-medium leading-relaxed">{msg.content}</p>
                                                            <p className="text-[9px] text-neutral-500 mt-0.5 tracking-wider uppercase">{msg.timestamp}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    const isMe = msg.type === "tenant";
                                    const hasImageAttachment = Boolean(msg.fileUrl && msg.fileMimeType?.startsWith("image/"));
                                    const hasFileAttachment = Boolean(msg.fileUrl && !msg.fileMimeType?.startsWith("image/"));

                                    return (
                                        <div key={msg.id} className={cn("flex flex-col w-full gap-1.5 mb-2 animate-in fade-in duration-300", isMe ? "items-end slide-in-from-right-2" : "items-start slide-in-from-left-2")}>
                                            <div className="flex items-end gap-3 w-full justify-end max-w-full" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                {!isMe && (
                                                    <img src={activeContact.avatar} className="w-8 h-8 rounded-full border border-white/10 shrink-0" alt="avatar" />
                                                )}
                                                <div className={cn(
                                                    "px-5 py-3.5 max-w-[85%] sm:max-w-[70%] shadow-lg relative transition-all duration-500",
                                                    isMe
                                                        ? "bg-primary text-black rounded-3xl rounded-br-sm font-medium border border-primary mr-2"
                                                        : "bg-neutral-800 text-white rounded-3xl rounded-bl-sm border border-white/5",
                                                    hasFileAttachment && "px-0 py-0 bg-transparent border-none shadow-none mr-0"
                                                )}>
                                                    {hasImageAttachment && (
                                                        <button
                                                            onClick={() => setPreviewImageUrl(msg.fileUrl || null)}
                                                            className="block mb-2 rounded-2xl overflow-hidden border border-white/10 bg-black/40 w-full"
                                                        >
                                                            <img src={msg.fileUrl} alt={msg.fileName || "Shared image"} className="w-full max-h-64 object-contain" />
                                                        </button>
                                                    )}

                                                    {hasFileAttachment && (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mb-2 flex items-center gap-3 rounded-2xl border p-3 border-white/10 bg-neutral-900/80"
                                                        >
                                                            <div className="p-2 rounded-lg bg-white/10">
                                                                <File className="w-4 h-4 text-neutral-100" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold truncate text-neutral-100">{msg.fileName || msg.content}</p>
                                                                <p className="text-[10px] text-neutral-400">
                                                                    {formatFileSize(msg.fileSize ?? 0)}
                                                                </p>
                                                            </div>
                                                        </a>
                                                    )}

                                                    {!msg.fileUrl && (
                                                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                            {msg.isRedacted && !msg.isConfirmedDisclosed
                                                                ? prettifyRedactedText(msg.redactedContent || msg.content)
                                                                : msg.content
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={cn("px-2 text-[10px] flex items-center gap-1", isMe ? "text-neutral-500" : "text-neutral-600")}>
                                                {isMe ? renderOutgoingStatus(msg.status, msg.timestamp) : <span>{msg.timestamp}</span>}
                                            </div>

                                            {msg.isRedacted && !msg.isConfirmedDisclosed && (
                                                <div className="w-full flex justify-center mt-2 mb-4">
                                                    <div className="max-w-[75%] sm:max-w-[60%] text-[11px] text-neutral-300 bg-neutral-900/60 p-4 rounded-3xl border border-amber-500/20 backdrop-blur-md shadow-lg shadow-amber-500/5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5 mb-2">
                                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                            <strong className="text-amber-500 text-xs">Iris AI Intercepted</strong>
                                                        </div>
                                                        <p className="leading-relaxed opacity-90 text-neutral-400">
                                                            This message contains sensitive credentials. If you proceed to disclose this, iReside will not be held accountable for any resulting damages (see Terms & Conditions).
                                                        </p>
                                                        <div className="mt-4 flex items-center justify-center">
                                                            <button
                                                                onClick={() => confirmDisclose(msg.id)}
                                                                className="px-6 py-2 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 font-bold rounded-xl transition-all w-fit"
                                                            >
                                                                Confirm & Disclose
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {isOtherUserTyping && (
                                    <div className="flex items-end gap-3 w-full justify-start max-w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                        <img src={activeContact.avatar} className="w-8 h-8 rounded-full border border-white/10 shrink-0" alt="avatar" />
                                        <div className="px-4 py-3 bg-neutral-800 text-white rounded-3xl rounded-bl-sm border border-white/5 shadow-lg">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.2s]" />
                                                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.1s]" />
                                                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </>
                                )}

                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-6 bg-neutral-900/50 border-t border-white/5 shrink-0 flex justify-center w-full">
                            <div className="w-full max-w-4xl flex flex-col gap-3">
                                {/* Security Announcement Banner */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0 mb-1">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-xs font-medium text-amber-400/90">
                                        <strong className="text-amber-500 mr-1">Security Warning:</strong>
                                        Never share sensitive credentials, bank details, or passwords in this chat. Admins will NEVER ask for this information.
                                    </span>
                                </div>

                                {pendingAttachment && (
                                    <div className="relative w-36 rounded-2xl border border-white/10 bg-black/30 p-2">
                                        <button
                                            onClick={clearPendingAttachment}
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-neutral-900 border border-white/20 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800"
                                            aria-label="Remove attachment"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        {pendingAttachment.isImage && pendingAttachment.previewUrl ? (
                                            <img
                                                src={pendingAttachment.previewUrl}
                                                alt="Attachment preview"
                                                className="h-24 w-full rounded-xl bg-black/40 object-contain"
                                            />
                                        ) : (
                                            <div className="h-24 w-full rounded-xl border border-white/10 bg-neutral-900/50 p-3 flex flex-col justify-center">
                                                <File className="w-4 h-4 text-primary mb-2" />
                                                <p className="text-[10px] text-neutral-300 font-semibold truncate">{pendingAttachment.file.name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div
                                    onDragOver={handleComposerDragOver}
                                    onDragLeave={handleComposerDragLeave}
                                    onDrop={handleComposerDrop}
                                    className={cn(
                                        "flex items-end gap-3 rounded-3xl bg-black/40 border border-white/10 p-2 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all",
                                        isComposerDragOver && "border-primary/80 bg-primary/10"
                                    )}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileSelected}
                                    />
                                    <textarea
                                        value={messageInput}
                                        onChange={(e) => handleMessageInputChange(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type your message..."
                                        className="w-full bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-neutral-500 resize-none max-h-32 py-2.5 custom-scrollbar"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-1 shrink-0 pb-1">
                                        <button
                                            onClick={handleFilePickerOpen}
                                            disabled={isUploadingFile || activeConversationId === "iris"}
                                            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim() && !pendingAttachment}
                                            className="p-2 bg-primary text-black hover:bg-primary/90 hover:scale-105 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {isUploadingFile && (
                                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-150"
                                            style={{ width: `${uploadProgress ?? 0}%` }}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Secure connection
                                    </span>
                                    <span className="text-[10px] text-neutral-500">
                                        {isUploadingFile
                                            ? `Uploading file... ${uploadProgress ?? 0}%`
                                            : isComposerDragOver
                                                ? "Drop file to upload"
                                                : "Press Enter to send, Shift + Enter for new line"}
                                    </span>
                                </div>
                                {fileUploadError && (
                                    <p className="text-[11px] text-red-400 px-2">{fileUploadError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Info Sidebar (Slide out panel) - TENANT FOCUSED */}
                    {showInfoSidebar && (
                        <div className="w-72 shrink-0 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col h-full overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-300">
                            <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/30">
                                <h3 className="font-bold text-white">
                                    {activeRelationshipStatus === "tenant_landlord"
                                        ? "Landlord Info"
                                        : activeRelationshipStatus === "prospective"
                                            ? "Prospect Info"
                                            : "Contact Info"}
                                </h3>
                                <button
                                    onClick={() => setShowInfoSidebar(false)}
                                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                {/* Quick Actions - TENANT SPECIFIC */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-primary" /> Quick Actions
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeQuickActions.map((action) => {
                                            const ActionIcon = action.icon;

                                            return (
                                                <button
                                                    key={action.key}
                                                    onClick={() => handleTenantQuickAction(action.key)}
                                                    className="flex flex-col items-center justify-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                                                >
                                                    <div className={cn("p-2 rounded-lg group-hover:scale-110 transition-transform", action.iconContainerClassName)}>
                                                        <ActionIcon className={cn("w-4 h-4", action.iconClassName)} />
                                                    </div>
                                                    <span className="text-[10px] text-neutral-400 group-hover:text-white font-medium text-center leading-tight">
                                                        {action.labelTop}<br />{action.labelBottom}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>



                                {/* Payment History Section */}
                                {canShowPaymentHistory && (
                                <div className="pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                            <History className="w-4 h-4 text-primary" /> Payment History
                                        </h4>
                                        <button
                                            onClick={() => setShowPaymentHistoryModal(true)}
                                            className="text-[10px] uppercase font-bold text-neutral-500 cursor-pointer hover:text-white transition-colors"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">

                                        <div className="relative flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-primary flex items-center justify-center relative z-10 shadow-[0_0_10px_rgba(200,255,0,0.2)]">
                                                    <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-white">February Rent</span>
                                                    <span className="text-[10px] text-primary">Pending Verification</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-white">₱13,000</span>
                                        </div>

                                        <div className="relative flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-white/20 flex items-center justify-center relative z-10">
                                                    <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-neutral-300">January Rent</span>
                                                    <span className="text-[10px] text-neutral-500">Jan 1, 2026</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-neutral-400">₱13,000</span>
                                        </div>

                                        <div className="relative flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-5 w-5 rounded-full bg-neutral-900 border-2 border-white/20 flex items-center justify-center relative z-10">
                                                    <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-neutral-300">Security Deposit</span>
                                                    <span className="text-[10px] text-neutral-500">Dec 28, 2025</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-neutral-400">₱26,000</span>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shared Files Sidebar (Slide out panel) */}
                    {showFilesSidebar && (
                        <div className="w-80 shrink-0 rounded-2xl border border-white/5 bg-neutral-900/50 flex flex-col h-full overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-300">
                            {/* Header */}
                            <div className="h-20 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-neutral-900/40 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Folder size={80} className="-rotate-12" />
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                        <Folder className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">Shared Files</h3>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                                            {sharedFiles.length} Items • {formatFileSize(totalSharedSize)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFilesSidebar(false)}
                                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="px-6 py-4 border-b border-white/5 shrink-0">
                                <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
                                    {['all', 'media', 'docs'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setFileFilter(filter)}
                                            className={cn(
                                                "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                                fileFilter === filter
                                                    ? "bg-white/10 text-white shadow-sm"
                                                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                                            )}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                {/* Media Section */}
                                {(fileFilter === 'all' || fileFilter === 'media') && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-blue-400" /> Recent Media
                                            </h4>
                                        </div>
                                        {sharedFiles.filter((item) => item.isMedia).length === 0 ? (
                                            <p className="text-xs text-neutral-500">No media shared in this conversation yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {sharedFiles
                                                    .filter((item) => item.isMedia)
                                                    .map((item) => (
                                                        <a
                                                            key={item.id}
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-square cursor-pointer bg-neutral-800"
                                                        >
                                                            <img src={item.url} alt={item.name} className="w-full h-full object-contain bg-black/40 opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                                <div className="w-full flex justify-between items-center">
                                                                    <span className="text-[9px] text-white/90 font-semibold truncate max-w-[70%]">{item.name}</span>
                                                                    <div className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg border border-white/20 backdrop-blur-md transition-colors">
                                                                        <Download className="w-4 h-4 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Documents Section */}
                                {(fileFilter === 'all' || fileFilter === 'docs') && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" /> Shared Documents
                                            </h4>
                                        </div>
                                        {sharedFiles.filter((item) => !item.isMedia).length === 0 ? (
                                            <p className="text-xs text-neutral-500">No documents shared in this conversation yet.</p>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {sharedFiles
                                                    .filter((item) => !item.isMedia)
                                                    .map((item) => (
                                                        <a
                                                            key={item.id}
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/[0.05] hover:border-white/10 cursor-pointer transition-all group"
                                                        >
                                                            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                                                                <File className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs text-neutral-200 font-bold truncate group-hover:text-white transition-colors">{item.name}</p>
                                                                <div className="flex items-center gap-2 mt-1 blur-0">
                                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{formatFileSize(item.size)}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                                                                    <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">{item.timestampLabel}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                                <Download className="w-4 h-4" />
                                                            </div>
                                                        </a>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {sharedFiles.length === 0 && fileFilter === "all" && (
                                    <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-center">
                                        <p className="text-xs text-neutral-400">No shared files yet.</p>
                                        <p className="text-[10px] text-neutral-600 mt-1">Use the paperclip button in chat to upload files.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Payment History Full Modal Overlay */}
            {showPaymentHistoryModal && canShowPaymentHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div id="payment-statement" className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <History className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Full Payment history</h3>
                                    <p className="text-xs text-neutral-500 mt-1">{activeContact.name} • {activeContact.unit}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPaymentHistoryModal(false)}
                                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Detailed List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-4">
                                {[
                                    { month: "February 2026", type: "Rent", amount: "13,000", status: "Pending Verification", date: "Feb 28, 2026", method: "GCash" },
                                    { month: "January 2026", type: "Rent", amount: "13,000", status: "Paid", date: "Jan 1, 2026", method: "GCash" },
                                    { month: "December 2025", type: "Security Deposit", amount: "26,000", status: "Paid", date: "Dec 28, 2025", method: "Bank Transfer" },
                                    { month: "December 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Dec 2, 2025", method: "GCash" },
                                    { month: "November 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Nov 3, 2025", method: "GCash" },
                                    { month: "October 2025", type: "Rent", amount: "13,000", status: "Paid", date: "Oct 1, 2025", method: "GCash" },
                                ].map((payment, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2 rounded-xl border",
                                                payment.status === "Paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                                            )}>
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{payment.month}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">{payment.type} via {payment.method}</span>
                                                    <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                                                    <span className="text-[10px] text-neutral-500">{payment.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-base font-black text-white">₱{payment.amount}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1",
                                                payment.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                            )}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 bg-neutral-900/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Total Paid (Lifetime)</span>
                                <span className="text-lg font-black text-white">₱91,000</span>
                            </div>
                            <button
                                disabled={isDownloading}
                                onClick={() => handleDownloadImage('payment-statement', 'Payment-Statement')}
                                className={cn(
                                    "bg-primary text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20",
                                    isDownloading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                                )}
                            >
                                {isDownloading ? "Generating..." : "Download Statement (Image)"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pendingConfirmAction && (
                <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
                        <h4 className="text-lg font-bold text-white">
                            {pendingConfirmAction === "archive" ? "Archive this conversation?" : "Block this contact?"}
                        </h4>
                        <p className="text-sm text-neutral-300 leading-relaxed">
                            {pendingConfirmAction === "archive"
                                ? "Archived chats are hidden from your list but can be restored later by support."
                                : "Blocked contacts are removed from your message list and future direct messaging should be restricted."}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setPendingConfirmAction(null)}
                                disabled={isSubmittingConfirmAction}
                                className="px-3 py-2 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitMessageUserAction(pendingConfirmAction)}
                                disabled={isSubmittingConfirmAction}
                                className="px-3 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmittingConfirmAction ? "Applying..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportWizard && (
                <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-white">Report User</h4>
                            <button
                                onClick={() => setShowReportWizard(false)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Category</label>
                            <select
                                value={reportCategory}
                                onChange={(event) => setReportCategory(event.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 text-sm text-white px-3 py-2"
                            >
                                <option value="spam">Spam</option>
                                <option value="harassment">Harassment</option>
                                <option value="scam_or_fraud">Scam or Fraud</option>
                                <option value="impersonation">Impersonation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">What happened?</label>
                            <textarea
                                value={reportDetails}
                                onChange={(event) => setReportDetails(event.target.value)}
                                rows={5}
                                placeholder="Describe the issue with enough detail for moderation review."
                                className="w-full rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-neutral-500 px-3 py-2 resize-none"
                            />
                        </div>

                        {reportWizardError && <p className="text-xs text-red-400">{reportWizardError}</p>}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowReportWizard(false)}
                                disabled={isSubmittingReport}
                                className="px-3 py-2 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitUserReport()}
                                disabled={isSubmittingReport || reportDetails.trim().length < 10}
                                className="px-3 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-500/90 disabled:opacity-50"
                            >
                                {isSubmittingReport ? "Submitting..." : "Submit Report"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <button
                        onClick={() => setPreviewImageUrl(null)}
                        className="absolute top-5 right-5 p-2 rounded-xl border border-white/20 bg-black/50 text-white hover:bg-black/70"
                        aria-label="Close image preview"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={previewImageUrl}
                        alt="Full resolution preview"
                        className="max-w-[95vw] max-h-[90vh] object-contain"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
