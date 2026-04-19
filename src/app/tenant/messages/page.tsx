"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
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
import { MessagesTour } from "@/components/tenant/MessagesTour";
import { useAuth } from "@/hooks/useAuth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    createOrGetDirectConversation,
    fetchConversationMessages,
    fetchConversations,
    fetchConversationPaymentHistory,
    markConversationAsRead,
    searchMessageUsers,
    sendConversationMessage,
    uploadConversationFile,
    type ConversationMessage,
    type ConversationSummary,
    type MessageUserSearchResult,
    type PaymentHistoryEntry,
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
    isPhishing?: boolean;
};

const IRIS_CONTACT: ContactItem = {
    id: "iris",
    participantUserId: null,
    name: "iRis Assistant",
    unit: "AI Concierge",
    unread: 0,
    lastContact: "Always Available",
    avatar: "/logos/favicon.png",
    isAI: true,
    relationshipStatus: "stranger",
    hasPaymentHistory: false,
    isArchived: false,
    isBlocked: false,
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";
const MESSAGE_CACHE_KEY_PREFIX = "ireside:tenant:messages-cache";
const CONVERSATIONS_CACHE_KEY_PREFIX = "ireside:tenant:conversations-cache";
const CONVERSATIONS_CACHE_TTL_MS = 60_000;

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
    const panelFromUrl = searchParams.get("panel")?.trim() || null;

    const [contacts, setContacts] = useState<ContactItem[]>([IRIS_CONTACT]);
    const [activeConversationId, setActiveConversationId] = useState<string>(() => conversationFromUrl ?? "iris");
    const [messagesState, setMessagesState] = useState<UiMessage[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState("all");
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
    const [paymentHistoryTotal, setPaymentHistoryTotal] = useState(0);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
    const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null);
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
    const [showModerationModal, setShowModerationModal] = useState(false);
    const [moderationMessage, setModerationMessage] = useState("");
    const [showChatRulesModal, setShowChatRulesModal] = useState(false);

    const activeChannelRef = useRef<RealtimeChannel | null>(null);
    const typingStopTimeoutRef = useRef<number | null>(null);
    const remoteTypingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dragDepthRef = useRef(0);
    const messagesCacheRef = useRef<Map<string, UiMessage[]>>(new Map());
    const paymentHistoryCacheRef = useRef<Map<string, { payments: PaymentHistoryEntry[]; totalPaid: number }>>(new Map());
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
        if (!conversationFromUrl) {
            return;
        }

        const isConversationKnown = contacts.some((contact) => contact.id === conversationFromUrl);
        if (!isConversationKnown) {
            return;
        }

        // Use ref to compare without causing re-run
        if (conversationFromUrl === activeConversationIdRef.current) {
            return;
        }

        setActiveConversationId(conversationFromUrl);
    }, [conversationFromUrl, contacts]); // Removed activeConversationId to prevent override loop

    useEffect(() => {
        if (panelFromUrl !== "files") {
            return;
        }

        if (!conversationFromUrl || activeConversationId !== conversationFromUrl || activeConversationId === "iris") {
            return;
        }

        setShowInfoSidebar(false);
        setShowFilesSidebar(true);

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("panel");
        const nextQuery = nextParams.toString();
        const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
        router.replace(nextHref, { scroll: false });
    }, [activeConversationId, conversationFromUrl, panelFromUrl, pathname, router, searchParams]);

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

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        try {
            const raw = sessionStorage.getItem(`${CONVERSATIONS_CACHE_KEY_PREFIX}:${user.id}`);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as { cachedAt?: number; contacts?: ContactItem[] };
            if (!Array.isArray(parsed.contacts)) {
                return;
            }

            if (typeof parsed.cachedAt === "number" && Date.now() - parsed.cachedAt > CONVERSATIONS_CACHE_TTL_MS) {
                return;
            }

            const cachedConversations = parsed.contacts
                .filter((contact): contact is ContactItem => Boolean(contact && typeof contact === "object" && typeof contact.id === "string"))
                .filter((contact) => contact.id !== "iris");
            const hydratedContacts: ContactItem[] = [IRIS_CONTACT, ...cachedConversations];

            setContacts(hydratedContacts);
            setIsSidebarLoading(false);

            setActiveConversationId((current) => {
                if (hydratedContacts.some((contact) => contact.id === current)) {
                    return current;
                }
                if (conversationFromUrl && hydratedContacts.some((contact) => contact.id === conversationFromUrl)) {
                    return conversationFromUrl;
                }
                return hydratedContacts[0]?.id ?? "iris";
            });
        } catch {
            // Ignore cache parse errors and continue with network fetch.
        }
    }, [conversationFromUrl, user?.id]);

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

    const loadPaymentHistory = useCallback(async (conversationId: string) => {
        const cached = paymentHistoryCacheRef.current.get(conversationId);
        if (cached) {
            setPaymentHistory(cached.payments);
            setPaymentHistoryTotal(cached.totalPaid);
            return;
        }

        setPaymentHistoryLoading(true);
        setPaymentHistoryError(null);

        try {
            const { data, error } = await fetchConversationPaymentHistory(conversationId, 50);
            if (error) {
                setPaymentHistoryError(error);
            }
            paymentHistoryCacheRef.current.set(conversationId, data);
            setPaymentHistory(data.payments);
            setPaymentHistoryTotal(data.totalPaid);
        } finally {
            setPaymentHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!activeConversationId || !canShowPaymentHistory || activeConversationId === "iris") {
            setPaymentHistory([]);
            setPaymentHistoryTotal(0);
            setPaymentHistoryError(null);
            return;
        }

        if (!showInfoSidebar && !showPaymentHistoryModal) {
            return;
        }

        void loadPaymentHistory(activeConversationId);
    }, [activeConversationId, canShowPaymentHistory, loadPaymentHistory, showInfoSidebar, showPaymentHistoryModal]);

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

    const formatAmount = (value: number | null) => {
        if (!Number.isFinite(value ?? NaN)) return "0";
        return new Intl.NumberFormat("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
            Number(value)
        );
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

            if (user.id) {
                try {
                    sessionStorage.setItem(
                        `${CONVERSATIONS_CACHE_KEY_PREFIX}:${user.id}`,
                        JSON.stringify({ cachedAt: Date.now(), contacts: mapped })
                    );
                } catch {
                    // Ignore storage errors; live data is already in memory.
                }
            }

            setActiveConversationId((current) => {
                if (mapped.some((contact) => contact.id === current)) {
                    return current;
                }
                if (conversationFromUrl && mapped.some((contact) => contact.id === conversationFromUrl)) {
                    return conversationFromUrl;
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
            .replace(/â–ˆ{3,}/g, '*****')
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
            let isPhishing = false;
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
                    isPhishing = !!data.isPhishing;
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
                    isPhishing,
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
                                isPhishing: isPhishing,
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
                if (message.includes("blocked by AI") || message.includes("violation")) {
                    setShowModerationModal(true);
                    setModerationMessage(message);
                    setMessagesState((prev) => prev.filter((msg) => msg.id !== optimisticId));
                } else {
                    setMessagesError(message);
                    setMessagesState((prev) =>
                        prev.map((msg) => (msg.id === optimisticId ? { ...msg, status: "failed" } : msg))
                    );
                }
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
                        <span className="text-neutral-600">â€¢ {timestamp}</span>
                    </>
                );
            case "sent":
                return (
                    <>
                        <Check className="h-3 w-3" />
                        <span>Sent</span>
                        <span className="text-neutral-600">â€¢ {timestamp}</span>
                    </>
                );
            case "delivered":
                return (
                    <>
                        <CheckCheck className="h-3 w-3" />
                        <span>Delivered</span>
                        <span className="text-neutral-600">â€¢ {timestamp}</span>
                    </>
                );
            case "seen":
                return (
                    <>
                        <CheckCheck className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Seen</span>
                        <span className="text-neutral-600">â€¢ {timestamp}</span>
                    </>
                );
            case "failed":
                return (
                    <>
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="text-red-400">Failed</span>
                        <span className="text-neutral-600">â€¢ {timestamp}</span>
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
        (Boolean(conversationFromUrl) && activeConversationId !== conversationFromUrl);

    return (
        <div className="flex h-full w-full overflow-hidden p-6 gap-6 animate-in fade-in duration-700 relative bg-[radial-gradient(circle_at_top_left,_rgba(173,200,125,0.16),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,242,0.96))] text-foreground dark:bg-[radial-gradient(circle_at_top_left,_rgba(109,152,56,0.14),_transparent_28%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(23,23,23,0.96))]">
            <MessagesTour />
            {shouldShowLoadingOverlay && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/95 px-8 py-6 text-center shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-primary" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-semibold text-foreground">Loading conversation...</p>
                            <p className="mt-1 text-xs text-muted-foreground">Preparing your messages.</p>
                        </div>
                    </div>
                </div>
            )}

            {isGlobalFileDrag && (
                <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <div className="rounded-3xl border border-primary/25 bg-card/95 px-10 py-8 shadow-[0_30px_80px_-35px_rgba(90,122,52,0.35)] text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                            <Paperclip className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-lg font-bold text-foreground">
                            {activeConversationId === "iris" ? "File sharing unavailable in Iris chat" : "Drop here to upload"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Release to add this file to the composer</p>
                    </div>
                </div>
            )}

            {/* Sidebar Contact List */}
            <div
                className="w-80 lg:w-96 rounded-2xl border border-border bg-card/95 flex flex-col shrink-0 h-full overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl"
                data-tour-id="tour-messages-sidebar"
            >
                {/* Header */}
                <div className="p-6 border-b border-border shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/tenant/dashboard"
                            className="bg-background hover:bg-muted p-2 rounded-xl border border-border transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <h2 className="text-xl font-bold text-foreground leading-none mt-0.5">Messages</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users to message..."
                            className="w-full bg-background/80 border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
                        />

                        {searchQuery.trim().length >= 2 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.28)] backdrop-blur">
                                {isSearchingUsers && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">Searching users...</div>
                                )}
                                {!isSearchingUsers && userSearchError && (
                                    <div className="px-3 py-2 text-xs text-red-600">{userSearchError}</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">No matching users found.</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleStartConversation(result.id)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                                    >
                                        <img
                                            src={result.avatarUrl || FALLBACK_AVATAR}
                                            alt={result.fullName}
                                            className="h-8 w-8 rounded-full border border-border object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-foreground">{result.fullName}</div>
                                            <div className="truncate text-[11px] text-muted-foreground">{result.role} • {result.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {conversationsError && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            <div className="flex-1 leading-relaxed">{conversationsError}</div>
                            <button
                                onClick={() => setConversationsError(null)}
                                className="rounded p-0.5 text-red-600/80 hover:bg-red-500/10 hover:text-red-700"
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
                                <div key={`sidebar-skeleton-${index}`} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/40 animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-slate-300/80" />
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="h-3.5 w-1/2 rounded bg-slate-300/80" />
                                        <div className="h-2.5 w-2/3 rounded bg-slate-200/90" />
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
                                        activeConversationId === contact.id
                                            ? "bg-primary/10 border border-primary/20 shadow-sm"
                                            : "hover:bg-muted/50 border border-transparent"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border",
                                            contact.isAI ? "border-primary bg-primary/10" : "border-border bg-background"
                                        )}>
                                            <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                                        </div>
                                        {contact.unread > 0 && (
                                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-card flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-white">{contact.unread}</span>
                                            </div>
                                        )}
                                        {contact.isAI && (
                                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-card border-2 border-card flex items-center justify-center shadow-sm">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className={cn("font-bold text-sm truncate pr-2", contact.isAI ? "text-primary" : "text-foreground")}>{contact.name}</h4>
                                            <span className={cn("text-[10px] shrink-0", contact.isAI ? "text-primary uppercase tracking-widest font-bold" : "text-muted-foreground")}>{contact.lastContact}</span>
                                        </div>
                                        <p className={cn("text-xs font-medium truncate", contact.isAI ? "text-slate-600 dark:text-primary/70" : "text-muted-foreground")}>{contact.unit}</p>
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
                    <div className="flex-1 flex flex-col min-w-0 h-full rounded-2xl border border-border bg-[radial-gradient(circle_at_top,_rgba(173,200,125,0.14),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,243,0.96))] overflow-hidden shadow-[0_30px_80px_-35px_rgba(15,23,42,0.3)] dark:border-white/5 dark:bg-[radial-gradient(circle_at_top,_rgba(109,152,56,0.12),_transparent_26%),linear-gradient(180deg,rgba(23,23,23,0.98),rgba(10,10,10,0.96))] dark:shadow-[0_30px_80px_-35px_rgba(0,0,0,0.65)]" data-tour-id="tour-messages-chat">
                        {/* Chat Header */}
                        <div className="h-20 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card/90 backdrop-blur-md z-10">
                            <div className="flex items-center gap-4">
                                <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover border border-border shadow-sm" />
                                <div>
                                    <h3 className="font-bold text-foreground text-base">{activeContact.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">{activeContact.unit}</span>

                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2" data-tour-id="tour-messages-tools">

                                <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                                    <Search className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowFilesSidebar(!showFilesSidebar);
                                        setShowInfoSidebar(false);
                                    }}
                                    className={cn(
                                            "p-2 hover:text-foreground rounded-lg transition-colors",
                                            showFilesSidebar ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
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
                                            "p-2 hover:text-foreground rounded-lg transition-colors",
                                            showInfoSidebar ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {messagesError && (
                            <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                <div className="flex-1 leading-relaxed">{messagesError}</div>
                                <button
                                    onClick={() => setMessagesError(null)}
                                    className="rounded p-0.5 text-red-600/80 hover:bg-red-500/10 hover:text-red-700"
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
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background/90 px-4 py-1.5 rounded-full border border-border shadow-sm">
                                        Conversation Started â€¢ February 1, 2026
                                    </span>
                                </div>

                                {isMessagesLoading ? (
                                    <div className="w-full space-y-4" aria-live="polite" aria-busy="true">
                                        {Array.from({ length: 6 }).map((_, index) => {
                                            const isMe = index % 3 === 2;

                                            return (
                                                <div key={`message-skeleton-${index}`} className={cn("flex items-end gap-3 w-full", isMe ? "justify-end" : "justify-start")}>
                                                    {!isMe && <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0" />}
                                                    <div
                                                        className={cn(
                                                            "animate-pulse border",
                                                            isMe
                                                                ? "h-14 w-[45%] max-w-sm rounded-3xl rounded-br-sm bg-primary/25 border-primary/20"
                                                                : "h-16 w-[55%] max-w-md rounded-3xl rounded-bl-sm bg-card border-border"
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
                                                    <div className="flex flex-col gap-0 bg-card overflow-hidden border border-primary/20 rounded-3xl shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] max-w-sm w-full transition-all hover:border-primary/35 group pb-4">
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
                                                            <div className="flex justify-between items-center bg-muted/40 rounded-2xl p-4 border border-border">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Amount Paid</span>
                                                                    <span className="text-2xl font-black text-primary">â‚±{msg.paymentAmount}</span>
                                                                </div>
                                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                                    <Wallet className="h-4 w-4 text-primary" />
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-xl border border-border">
                                                                {msg.content}
                                                            </p>

                                                            {msg.receiptImg && (
                                                                <div className="flex flex-col gap-2 mt-1">
                                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Proof of Payment</span>
                                                                    <div className="rounded-2xl overflow-hidden border border-border relative cursor-pointer shadow-inner">
                                                                        <img src={msg.receiptImg} alt="Receipt" className="w-full h-32 object-cover opacity-90 transition-opacity" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : msg.systemType === "invoice" ? (
                                                    <div id={`invoice-${msg.id}`} className="flex flex-col w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-[0_30px_70px_-35px_rgba(15,23,42,0.35)] animate-in zoom-in-95 duration-500">
                                                        {/* Invoice Watermark Header */}
                                                        <div className="bg-gradient-to-br from-muted/70 to-card p-6 border-b border-border relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                                <Receipt size={120} className="-rotate-12" />
                                                            </div>
                                                            <div className="relative z-10 flex justify-between items-start">
                                                                <div>
                                                                    <Logo theme="dark" className="h-6 w-auto mb-1" />
                                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Digital Payment Invoice</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                                        Status: Paid
                                                                    </span>
                                                                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">{msg.invoiceId}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Invoice Content */}
                                                        <div className="p-6 space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Billed To</p>
                                                                    <p className="text-sm font-bold text-foreground leading-tight">{msg.tenantName}</p>
                                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{msg.unit}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Date Issued</p>
                                                                    <p className="text-sm font-bold text-foreground leading-tight">{msg.date}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-background/80 rounded-2xl border border-border overflow-hidden">
                                                                <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider px-1">Description</span>
                                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider px-1">Amount</span>
                                                                </div>
                                                                <div className="p-4 flex items-center justify-between">
                                                                    <p className="text-xs text-foreground font-medium">{msg.description}</p>
                                                                    <p className="text-sm font-black text-foreground">â‚±{msg.amount}</p>
                                                                </div>
                                                                <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-t border-border">
                                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Paid</span>
                                                                    <span className="text-lg font-black text-primary">â‚±{msg.amount}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    disabled={isDownloading}
                                                                    onClick={() => handleDownloadImage(`invoice-${msg.id}`, `Invoice-${msg.invoiceId}`)}
                                                                    className={cn(
                                                                        "flex-1 bg-muted/50 hover:bg-muted text-foreground py-3 rounded-2xl text-[11px] font-bold transition-all border border-border flex items-center justify-center gap-2 group",
                                                                        isDownloading && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                                    {isDownloading ? "Generating..." : "Download Image"}
                                                                </button>
                                                                <button className="w-12 h-12 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center rounded-2xl transition-all border border-border">
                                                                    <ShieldCheck className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="px-6 py-3 bg-muted/40 border-t border-border text-center">
                                                            <p className="text-[9px] text-muted-foreground font-medium tracking-wide">Securely generated by iReside Iris Intelligence System</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-card/90 border border-border backdrop-blur-sm px-5 py-3 rounded-2xl shadow-sm text-center">
                                                        <div className="bg-background/90 p-2 rounded-full border border-border shrink-0">
                                                            {renderSystemIcon(msg.systemType || '')}
                                                        </div>
                                                        <div className="text-left flex flex-col justify-center">
                                                            <p className="text-xs text-foreground font-medium leading-relaxed">{msg.content}</p>
                                                            <p className="text-[9px] text-muted-foreground mt-0.5 tracking-wider uppercase">{msg.timestamp}</p>
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
                                                    <img src={activeContact.avatar} className="w-8 h-8 rounded-full border border-border shrink-0" alt="avatar" />
                                                )}
                                                <div className={cn(
                                                    "px-5 py-3.5 max-w-[85%] sm:max-w-[70%] shadow-lg relative transition-all duration-500",
                                                    isMe
                                                        ? "bg-primary text-black rounded-3xl rounded-br-sm font-medium border border-primary mr-2"
                                                        : "bg-card text-foreground rounded-3xl rounded-bl-sm border border-border",
                                                    hasFileAttachment && "px-0 py-0 bg-transparent border-none shadow-none mr-0"
                                                )}>
                                                    {hasImageAttachment && (
                                                        <button
                                                            onClick={() => setPreviewImageUrl(msg.fileUrl || null)}
                                                            className="block mb-2 rounded-2xl overflow-hidden border border-border bg-background/80 w-full"
                                                        >
                                                            <img src={msg.fileUrl} alt={msg.fileName || "Shared image"} className="w-full max-h-64 object-contain" />
                                                        </button>
                                                    )}

                                                    {hasFileAttachment && (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mb-2 flex items-center gap-3 rounded-2xl border p-3 border-border bg-card/90"
                                                        >
                                                            <div className="p-2 rounded-lg bg-muted">
                                                                <File className="w-4 h-4 text-foreground" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold truncate text-foreground">{msg.fileName || msg.content}</p>
                                                                <p className="text-[10px] text-muted-foreground">
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

                                            <div className={cn("px-2 text-[10px] flex items-center gap-1", isMe ? "text-muted-foreground" : "text-slate-500 dark:text-neutral-400")}>
                                                {isMe ? renderOutgoingStatus(msg.status, msg.timestamp) : <span>{msg.timestamp}</span>}
                                            </div>

                                            {msg.isRedacted && !msg.isConfirmedDisclosed && (
                                                <div className="w-full flex justify-center mt-2 mb-4">
                                                    <div className={cn(
                                                        "max-w-[75%] sm:max-w-[60%] text-[11px] p-4 rounded-3xl border backdrop-blur-md shadow-lg text-center",
                                                        msg.isPhishing 
                                                            ? "text-red-300 bg-red-900/40 border-red-500/40 shadow-red-500/10" 
                                                            : "text-amber-950 bg-amber-50 border-amber-200 shadow-amber-500/5 dark:text-amber-100 dark:bg-amber-500/10 dark:border-amber-500/30 dark:shadow-amber-500/10"
                                                    )}>
                                                        <div className="flex items-center justify-center gap-1.5 mb-2">
                                                            <AlertTriangle className={cn("w-4 h-4", msg.isPhishing ? "text-red-500" : "text-amber-500")} />
                                                            <strong className={cn("text-xs", msg.isPhishing ? "text-red-500" : "text-amber-500")}>
                                                                {msg.isPhishing ? "Malicious Content Detected" : "Iris AI Intercepted"}
                                                            </strong>
                                                        </div>
                                                        <p className="leading-relaxed opacity-90 text-current">
                                                            {msg.isPhishing 
                                                                ? "Warning: This message has been flagged for phishing. It may be attempting to steal your credentials or lead you to a fraudulent site."
                                                                : "This message contains sensitive credentials. If you proceed to disclose this, iReside will not be held accountable for any resulting damages (see Terms & Conditions)."}
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
                                        <img src={activeContact.avatar} className="w-8 h-8 rounded-full border border-border shrink-0" alt="avatar" />
                                        <div className="px-4 py-3 bg-card text-foreground rounded-3xl rounded-bl-sm border border-border shadow-lg">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                                                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
                                                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
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
                        <div className="p-4 md:p-6 bg-card/85 border-t border-border shrink-0 flex justify-center w-full" data-tour-id="tour-messages-input">
                            <div className="w-full max-w-4xl flex flex-col gap-3">
                                {/* Security Announcement Banner */}
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center justify-between gap-3 shrink-0 mb-1">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-200 hidden sm:inline">
                                            <strong className="text-amber-500 mr-1">Security Warning:</strong>
                                            Never share sensitive credentials or passwords. Admins will NEVER ask for this.
                                        </span>
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-200 sm:hidden">
                                            Keep credentials private.
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowChatRulesModal(true)}
                                        className="text-[10px] md:text-xs shrink-0 font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors whitespace-nowrap"
                                    >
                                        Chat Rules
                                    </button>
                                </div>

                                {pendingAttachment && (
                                    <div className="relative w-36 rounded-2xl border border-border bg-background/90 p-2 shadow-sm">
                                        <button
                                            onClick={clearPendingAttachment}
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                                            aria-label="Remove attachment"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        {pendingAttachment.isImage && pendingAttachment.previewUrl ? (
                                            <img
                                                src={pendingAttachment.previewUrl}
                                                alt="Attachment preview"
                                                className="h-24 w-full rounded-xl bg-muted/40 object-contain"
                                            />
                                        ) : (
                                            <div className="h-24 w-full rounded-xl border border-border bg-muted/40 p-3 flex flex-col justify-center">
                                                <File className="w-4 h-4 text-primary mb-2" />
                                                <p className="text-[10px] text-foreground font-semibold truncate">{pendingAttachment.file.name}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div
                                    onDragOver={handleComposerDragOver}
                                    onDragLeave={handleComposerDragLeave}
                                    onDrop={handleComposerDrop}
                                    className={cn(
                                        "flex items-end gap-3 rounded-3xl bg-background/95 border border-border p-2 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm",
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
                                        className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none max-h-32 py-2.5 custom-scrollbar"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-1 shrink-0 pb-1">
                                        <button
                                            onClick={handleFilePickerOpen}
                                            disabled={isUploadingFile || activeConversationId === "iris"}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-150"
                                            style={{ width: `${uploadProgress ?? 0}%` }}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Secure connection
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {isUploadingFile
                                            ? `Uploading file... ${uploadProgress ?? 0}%`
                                            : isComposerDragOver
                                                ? "Drop file to upload"
                                                : "Press Enter to send, Shift + Enter for new line"}
                                    </span>
                                </div>
                                {fileUploadError && (
                                    <p className="text-[11px] text-red-600 px-2">{fileUploadError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Info Sidebar (Slide out panel) - TENANT FOCUSED */}
                    {showInfoSidebar && (
                        <div className="w-72 shrink-0 rounded-2xl border border-border bg-card/90 flex flex-col h-full overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.3)] animate-in slide-in-from-right-8 duration-300 backdrop-blur-xl">
                            <div className="h-20 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card/95">
                                <h3 className="font-bold text-foreground">
                                    {activeRelationshipStatus === "tenant_landlord"
                                        ? "Landlord Info"
                                        : activeRelationshipStatus === "prospective"
                                            ? "Prospect Info"
                                            : "Contact Info"}
                                </h3>
                                <button
                                    onClick={() => setShowInfoSidebar(false)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                                {/* Quick Actions - TENANT SPECIFIC */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
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
                                                    className="flex flex-col items-center justify-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-all group"
                                                >
                                                    <div className={cn("p-2 rounded-lg group-hover:scale-110 transition-transform", action.iconContainerClassName)}>
                                                        <ActionIcon className={cn("w-4 h-4", action.iconClassName)} />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground font-medium text-center leading-tight">
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
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <History className="w-4 h-4 text-primary" /> Payment History
                                            </h4>
                                            <button
                                                onClick={() => setShowPaymentHistoryModal(true)}
                                                className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                            >
                                                View All
                                            </button>
                                        </div>
                                        {paymentHistoryLoading ? (
                                            <p className="text-xs text-muted-foreground">Loading payment history...</p>
                                        ) : paymentHistoryError ? (
                                            <p className="text-xs text-red-600">{paymentHistoryError}</p>
                                        ) : paymentHistory.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No payment history yet.</p>
                                        ) : (
                                            <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                                {paymentHistory.slice(0, 3).map((payment) => {
                                                    const isPaid = payment.statusTone === "paid";

                                                    return (
                                                        <div key={payment.id} className="relative flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    className={cn(
                                                                        "h-5 w-5 rounded-full bg-background border-2 flex items-center justify-center relative z-10",
                                                                        isPaid
                                                                            ? "border-border"
                                                                            : "border-primary shadow-[0_0_10px_rgba(200,255,0,0.2)]"
                                                                    )}
                                                                >
                                                                    {isPaid ? (
                                                                        <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                                                                    ) : (
                                                                        <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className={cn(
                                                                            "text-[11px] font-bold",
                                                                            isPaid ? "text-slate-600" : "text-foreground"
                                                                        )}
                                                                    >
                                                                        {payment.monthLabel} {payment.typeLabel}
                                                                    </span>
                                                                    <span
                                                                        className={cn(
                                                                            "text-[10px]",
                                                                            isPaid ? "text-muted-foreground" : "text-primary"
                                                                        )}
                                                                    >
                                                                        {isPaid ? payment.dateLabel : payment.statusLabel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    "text-xs font-bold",
                                                                    isPaid ? "text-muted-foreground" : "text-foreground"
                                                                )}
                                                            >
                                                                ₱{formatAmount(payment.amount)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shared Files Sidebar (Slide out panel) */}
                    {showFilesSidebar && (
                        <div className="w-80 shrink-0 rounded-2xl border border-border bg-card/90 flex flex-col h-full overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.3)] animate-in slide-in-from-right-8 duration-300 backdrop-blur-xl">
                            {/* Header */}
                            <div className="h-20 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card/95 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Folder size={80} className="-rotate-12" />
                                </div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                        <Folder className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-base">Shared Files</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            {sharedFiles.length} Items â€¢ {formatFileSize(totalSharedSize)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFilesSidebar(false)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors relative z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="px-6 py-4 border-b border-border shrink-0">
                                <div className="flex p-1 bg-muted/60 rounded-xl border border-border">
                                    {['all', 'media', 'docs'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setFileFilter(filter)}
                                            className={cn(
                                                "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                                fileFilter === filter
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/70"
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
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-blue-400" /> Recent Media
                                            </h4>
                                        </div>
                                        {sharedFiles.filter((item) => item.isMedia).length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No media shared in this conversation yet.</p>
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
                                                            className="group relative rounded-2xl overflow-hidden border border-border aspect-square cursor-pointer bg-muted/50"
                                                        >
                                                            <img src={item.url} alt={item.name} className="w-full h-full object-contain bg-background/80 opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 dark:from-black/90 dark:via-black/45">
                                                                <div className="w-full flex justify-between items-center">
                                                                    <span className="text-[9px] text-foreground font-semibold truncate max-w-[70%]">{item.name}</span>
                                                                    <div className="bg-card/90 hover:bg-card p-1.5 rounded-lg border border-border backdrop-blur-md transition-colors">
                                                                        <Download className="w-4 h-4 text-foreground" />
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
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" /> Shared Documents
                                            </h4>
                                        </div>
                                        {sharedFiles.filter((item) => !item.isMedia).length === 0 ? (
                                            <p className="text-xs text-muted-foreground">No documents shared in this conversation yet.</p>
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
                                                            className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-background/70 hover:bg-muted/50 cursor-pointer transition-all group"
                                                        >
                                                            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                                                                <File className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs text-foreground font-bold truncate group-hover:text-foreground transition-colors">{item.name}</p>
                                                                <div className="flex items-center gap-2 mt-1 blur-0">
                                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{formatFileSize(item.size)}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{item.timestampLabel}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                                <Download className="w-4 h-4" />
                                                            </div>
                                                        </a>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {sharedFiles.length === 0 && fileFilter === "all" && (
                                    <div className="rounded-2xl border border-border bg-background/70 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">No shared files yet.</p>
                                        <p className="mt-1 text-[10px] text-slate-500 dark:text-neutral-400">Use the paperclip button in chat to upload files.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Payment History Full Modal Overlay */}
            {showPaymentHistoryModal && canShowPaymentHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/75 backdrop-blur-md animate-in fade-in duration-300">
                    <div id="payment-statement" className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card/95">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <History className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Full Payment history</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{activeContact.name} â€¢ {activeContact.unit}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPaymentHistoryModal(false)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Detailed List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-4">
                                {paymentHistoryLoading ? (
                                    <p className="text-xs text-muted-foreground">Loading payment history...</p>
                                ) : paymentHistoryError ? (
                                    <p className="text-xs text-red-600">{paymentHistoryError}</p>
                                ) : paymentHistory.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No payment history yet.</p>
                                ) : (
                                    paymentHistory.map((payment) => {
                                        const isPaid = payment.statusTone === "paid";

                                        return (
                                            <div key={payment.id} className="flex items-center justify-between p-4 bg-background/70 border border-border rounded-2xl hover:bg-muted/40 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            "p-2 rounded-xl border",
                                                            isPaid ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                                                        )}
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{payment.monthLabel}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{payment.typeLabel} via {payment.methodLabel}</span>
                                                            <span className="w-1 h-1 rounded-full bg-border"></span>
                                                            <span className="text-[10px] text-muted-foreground">{payment.dateLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-base font-black text-foreground">₱{formatAmount(payment.amount)}</span>
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1",
                                                            isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                                                        )}
                                                    >
                                                        {payment.statusLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border bg-card/95 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Total Paid (Lifetime)</span>
                                <span className="text-lg font-black text-foreground">{paymentHistoryLoading ? "—" : `₱${formatAmount(paymentHistoryTotal)}`}</span>
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
                <div className="fixed inset-0 z-[90] bg-background/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
                        <h4 className="text-lg font-bold text-foreground">
                            {pendingConfirmAction === "archive" ? "Archive this conversation?" : "Block this contact?"}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {pendingConfirmAction === "archive"
                                ? "Archived chats are hidden from your list but can be restored later by support."
                                : "Blocked contacts are removed from your message list and future direct messaging should be restricted."}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setPendingConfirmAction(null)}
                                disabled={isSubmittingConfirmAction}
                                className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
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

            {showModerationModal && (
                <div className="fixed inset-0 z-[100] bg-background/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-card overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] animate-in zoom-in-95 duration-200">
                        <div className="bg-red-500/10 p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-black text-foreground mb-2">Message Blocked</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                                {moderationMessage || "Your message violated our community guidelines."}
                            </p>
                        </div>
                        <div className="p-6 bg-card border-t border-border space-y-4">
                            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed text-center">
                                <strong className="text-foreground">Warning:</strong> Repeated violations of our chat policies—including hate speech, severe profanity, harassment, or spam—may lead to formal account offense or permanent suspension.
                            </div>
                            <button
                                onClick={() => setShowModerationModal(false)}
                                className="w-full py-3 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChatRulesModal && (
                <div className="fixed inset-0 z-[100] bg-background/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-xl font-black text-foreground">Chat Rules & Policy</h4>
                            </div>
                            <button
                                onClick={() => setShowChatRulesModal(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">1. Professional Conduct</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    All communications must remain professional, respectful, and courteous. Hate speech, discrimination, harassment, and severe profanity are strictly prohibited.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">2. Prohibited Content</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    You may not send spam, unauthorized advertisements, explicit media, or any illegal content. Our AI moderation system actively intercepts and blocks such content.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">3. Platform Safety</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Do not attempt to bypass platform processes. Sharing external payment links, requesting off-platform security deposits, or phishing for sensitive credentials (passwords, bank details) is forbidden.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold text-foreground uppercase tracking-wider">4. Reporting Violations</h5>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    If you encounter a user violating these rules, please use the "Report User" feature. Repeated violations will result in permanent suspension of the offending account.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-card border-t border-border shrink-0 flex justify-end">
                            <button
                                onClick={() => setShowChatRulesModal(false)}
                                className="px-6 py-2.5 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all focus:outline-none"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportWizard && (
                <div className="fixed inset-0 z-[95] bg-background/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 space-y-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold text-foreground">Report User</h4>
                            <button
                                onClick={() => setShowReportWizard(false)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Category</label>
                            <select
                                value={reportCategory}
                                onChange={(event) => setReportCategory(event.target.value)}
                                className="w-full rounded-xl bg-background border border-border text-sm text-foreground px-3 py-2"
                            >
                                <option value="spam">Spam</option>
                                <option value="harassment">Harassment</option>
                                <option value="scam_or_fraud">Scam or Fraud</option>
                                <option value="impersonation">Impersonation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">What happened?</label>
                            <textarea
                                value={reportDetails}
                                onChange={(event) => setReportDetails(event.target.value)}
                                rows={5}
                                placeholder="Describe the issue with enough detail for moderation review."
                                className="w-full rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 resize-none"
                            />
                        </div>

                        {reportWizardError && <p className="text-xs text-red-600">{reportWizardError}</p>}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowReportWizard(false)}
                                disabled={isSubmittingReport}
                                className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
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
