"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
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
    Image as ImageIcon,
    X,
    File,
    Folder,
    History,
    ArrowLeft,
    Zap,
    Hammer,
    CreditCard,
    Bell,
    Check,
    CheckCheck,
    Clock3,
    Copy,
    Flag,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
import { redactMessageForSend } from "@/lib/messages/redaction-client";

type ContactItem = {
    id: string;
    participantUserId: string | null;
    name: string;
    unit: string;
    unread: number;
    lastContact: string;
    avatar: string;
    relationshipStatus: "tenant_landlord" | "prospective" | "stranger";
    hasPaymentHistory: boolean;
    isArchived: boolean;
    isBlocked: boolean;
};

type OutboundStatus = "sending" | "sent" | "delivered" | "seen" | "failed";

type UiMessage = {
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
    unit?: string;
    amount?: string;
    date?: string;
    description?: string;
    status?: OutboundStatus;
    isPhishing?: boolean;
    redactionCategory?: "none" | "credentials" | "profanity" | "phishing" | "spam";
    disclosureAllowed?: boolean;
};

const redactionStrength = (message: UiMessage) => {
    const text = (message.redactedContent ?? message.content ?? "").toString();
    return (text.match(/\*{5}/g) ?? []).length;
};

const redactionCategoryRank = (category: UiMessage["redactionCategory"]) => {
    switch (category) {
        case "phishing":
            return 4;
        case "spam":
            return 3;
        case "profanity":
            return 2;
        case "credentials":
            return 1;
        default:
            return 0;
    }
};

const resolveStrictCategory = (
    previous?: UiMessage["redactionCategory"],
    incoming?: UiMessage["redactionCategory"]
): UiMessage["redactionCategory"] => {
    const prev = previous ?? "none";
    const next = incoming ?? "none";
    return redactionCategoryRank(prev) >= redactionCategoryRank(next) ? prev : next;
};

const resolveDisclosureAllowed = (
    category: UiMessage["redactionCategory"],
    previous?: boolean,
    incoming?: boolean
) => {
    if (category !== "credentials") {
        return false;
    }
    const prev = typeof previous === "boolean" ? previous : true;
    const next = typeof incoming === "boolean" ? incoming : true;
    return prev && next;
};

const mergeCensorshipState = (incoming: UiMessage, previous?: UiMessage): UiMessage => {
    if (!previous) {
        return incoming;
    }

    const strictCategory = resolveStrictCategory(previous.redactionCategory, incoming.redactionCategory);
    const strictDisclosureAllowed = resolveDisclosureAllowed(
        strictCategory,
        previous.disclosureAllowed,
        incoming.disclosureAllowed
    );

    if (!incoming.isRedacted && previous.isRedacted) {
        return {
            ...incoming,
            isRedacted: true,
            redactedContent: previous.redactedContent ?? incoming.redactedContent ?? incoming.content,
            isPhishing: previous.isPhishing || incoming.isPhishing,
            redactionCategory: strictCategory,
            disclosureAllowed: strictDisclosureAllowed,
        };
    }

    if (incoming.isRedacted && previous.isRedacted) {
        const incomingScore = redactionStrength(incoming);
        const previousScore = redactionStrength(previous);
        if (previousScore > incomingScore) {
            return {
                ...incoming,
                redactedContent: previous.redactedContent ?? incoming.redactedContent,
                isPhishing: previous.isPhishing || incoming.isPhishing,
                redactionCategory: strictCategory,
                disclosureAllowed: strictDisclosureAllowed,
            };
        }
    }

    return {
        ...incoming,
        redactionCategory: strictCategory,
        disclosureAllowed: strictDisclosureAllowed,
    };
};

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";
const MESSAGE_CACHE_KEY_PREFIX = "ireside:landlord:messages-cache";
const CONVERSATIONS_CACHE_KEY_PREFIX = "ireside:landlord:conversations-cache";
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
    icon: typeof Hammer;
    labelTop: string;
    labelBottom: string;
    iconClassName: string;
    iconContainerClassName: string;
};

type ConfirmActionType = "archive" | "block";

const LANDLORD_QUICK_ACTIONS_BY_RELATIONSHIP: Record<ContactItem["relationshipStatus"], QuickAction[]> = {
    tenant_landlord: [
        {
            key: "request-payment",
            icon: CreditCard,
            labelTop: "Request",
            labelBottom: "Payment",
            iconClassName: "text-emerald-500",
            iconContainerClassName: "bg-emerald-500/10",
        },
        {
            key: "schedule-repair",
            icon: Hammer,
            labelTop: "Schedule",
            labelBottom: "Repair",
            iconClassName: "text-amber-500",
            iconContainerClassName: "bg-amber-500/10",
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
            key: "send-notice",
            icon: Bell,
            labelTop: "Send",
            labelBottom: "Notice",
            iconClassName: "text-purple-400",
            iconContainerClassName: "bg-purple-500/10",
        },
    ],
    prospective: [
        {
            key: "review-application",
            icon: FileText,
            labelTop: "Review",
            labelBottom: "Application",
            iconClassName: "text-blue-400",
            iconContainerClassName: "bg-blue-500/10",
        },
        {
            key: "schedule-viewing",
            icon: CalendarClock,
            labelTop: "Schedule",
            labelBottom: "Viewing",
            iconClassName: "text-amber-500",
            iconContainerClassName: "bg-amber-500/10",
        },
        {
            key: "share-requirements",
            icon: Bell,
            labelTop: "Share",
            labelBottom: "Requirements",
            iconClassName: "text-primary",
            iconContainerClassName: "bg-primary/10",
        },
        {
            key: "share-listing",
            icon: Search,
            labelTop: "Share",
            labelBottom: "Listing",
            iconClassName: "text-neutral-300",
            iconContainerClassName: "bg-neutral-500/10",
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

export default function MessagesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const supabase = useMemo(() => createSupabaseClient(), []);
    const conversationFromUrl = searchParams.get("conversation")?.trim() || null;
    const panelFromUrl = searchParams.get("panel")?.trim() || null;

    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(() => conversationFromUrl);
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
    const [reportExactMessage, setReportExactMessage] = useState("");
    const [reportMessageId, setReportMessageId] = useState("");
    const [reportScreenshots, setReportScreenshots] = useState<File[]>([]);
    const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportWizardError, setReportWizardError] = useState<string | null>(null);
    const [showModerationModal, setShowModerationModal] = useState(false);
    const [moderationMessage, setModerationMessage] = useState("");
    const [showChatRulesModal, setShowChatRulesModal] = useState(false);
    const [showSecurityWarning, setShowSecurityWarning] = useState(true);

    const activeChannelRef = useRef<RealtimeChannel | null>(null);
    const typingStopTimeoutRef = useRef<number | null>(null);
    const remoteTypingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const reportFileInputRef = useRef<HTMLInputElement | null>(null);
    const copiedMessageTimeoutRef = useRef<number | null>(null);
    const dragDepthRef = useRef(0);
    const messagesCacheRef = useRef<Map<string, UiMessage[]>>(new Map());
    const paymentHistoryCacheRef = useRef<Map<string, { payments: PaymentHistoryEntry[]; totalPaid: number }>>(new Map());
    const activeConversationIdRef = useRef<string | null>(conversationFromUrl);
    const shouldStickToBottomRef = useRef(true);
    const shouldScrollOnConversationOpenRef = useRef(true);

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
        shouldStickToBottomRef.current = true;
        shouldScrollOnConversationOpenRef.current = true;
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
        if (panelFromUrl !== "files") {
            return;
        }

        if (!conversationFromUrl || activeConversationId !== conversationFromUrl) {
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
        const nextConversationForUrl = activeConversationId;

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
                .filter((contact): contact is ContactItem => Boolean(contact && typeof contact === "object" && typeof contact.id === "string"));

            setContacts(cachedConversations);
            setIsSidebarLoading(false);

            setActiveConversationId((current) => {
                if (conversationFromUrl && cachedConversations.some((contact) => contact.id === conversationFromUrl)) {
                    return conversationFromUrl;
                }
                if (current && cachedConversations.some((contact) => contact.id === current)) {
                    return current;
                }
                return cachedConversations[0]?.id ?? null;
            });
        } catch {
            // Ignore cache parse errors and continue with network fetch.
        }
    }, [conversationFromUrl, user?.id]);

    const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
        if (!messagesEndRef.current) {
            return;
        }

        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }, []);

    const updateShouldStickToBottom = useCallback(() => {
        const container = messagesScrollRef.current;
        if (!container) {
            return;
        }

        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottomRef.current = distanceFromBottom <= 96;
    }, []);

    const visibleContacts = useMemo(
        () => contacts.filter((contact) => !contact.isArchived && !contact.isBlocked),
        [contacts]
    );

    const activeContact = useMemo(
        () => visibleContacts.find((contact) => contact.id === activeConversationId) ?? null,
        [visibleContacts, activeConversationId]
    );

    const activeRelationshipStatus = activeContact?.relationshipStatus ?? "stranger";
    const activeQuickActions = LANDLORD_QUICK_ACTIONS_BY_RELATIONSHIP[activeRelationshipStatus];
    const canShowPaymentHistory =
        activeRelationshipStatus === "tenant_landlord" && (activeContact?.hasPaymentHistory ?? false);

    const displayContact = activeContact ?? {
        id: "",
        participantUserId: null,
        name: "No conversation selected",
        unit: "",
        unread: 0,
        lastContact: "",
        avatar: FALLBACK_AVATAR,
        relationshipStatus: "stranger",
        hasPaymentHistory: false,
        isArchived: false,
        isBlocked: false,
    };

    const mapConversationToContact = (conversation: ConversationSummary): ContactItem => {
        const other = conversation.otherParticipants[0];

        return {
            id: conversation.id,
            participantUserId: other?.id ?? null,
            name: other?.fullName ?? "Conversation",
            unit: other?.role === "tenant" ? "Tenant" : other?.role === "landlord" ? "Landlord" : "Participant",
            unread: conversation.unreadCount,
            lastContact: conversation.lastMessage
                ? new Date(conversation.lastMessage.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : "No messages yet",
            avatar: other?.avatarUrl || FALLBACK_AVATAR,
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
        if (!activeConversationId || !canShowPaymentHistory) {
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
        if (!activeConversationId) {
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
        setActiveConversationId(visibleContacts[0]?.id ?? null);
    }, [activeConversationId, isSidebarLoading, visibleContacts]);

    const updateActiveContactActionState = useCallback((nextState: { archived?: boolean; blocked?: boolean }) => {
        if (!activeConversationId) {
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
        if (!activeContact?.participantUserId) {
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
    }, [activeContact?.participantUserId, refreshConversations, updateActiveContactActionState]);

    const submitUserReport = useCallback(async () => {
        if (!activeContact?.participantUserId || !activeConversationId) {
            return;
        }

        setReportWizardError(null);
        setIsSubmittingReport(true);

        try {
            const formData = new FormData();
            formData.append("conversationId", activeConversationId);
            formData.append("category", reportCategory);
            formData.append("details", reportDetails);
            formData.append("exactMessage", reportExactMessage);
            formData.append("reportedMessageId", reportMessageId);
            reportScreenshots.forEach((screenshot) => formData.append("screenshots", screenshot));

            const response = await fetch(`/api/messages/users/${activeContact.participantUserId}/reports`, {
                method: "POST",
                body: formData,
            });

            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
                throw new Error(payload?.error ?? "Failed to submit report.");
            }

            setShowReportWizard(false);
            setReportCategory("spam");
            setReportDetails("");
            setReportExactMessage("");
            setReportMessageId("");
            setReportScreenshots([]);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to submit report.";
            setReportWizardError(message);
        } finally {
            setIsSubmittingReport(false);
        }
    }, [activeContact?.participantUserId, activeConversationId, reportCategory, reportDetails, reportExactMessage, reportMessageId, reportScreenshots]);

    const openReportWizard = useCallback(() => {
        setReportWizardError(null);
        setReportMessageId("");
        setShowReportWizard(true);
    }, []);

    const handleCopyMessageId = useCallback(async (messageId: string) => {
        try {
            await navigator.clipboard.writeText(messageId);
            setCopiedMessageId(messageId);
            setOpenMessageMenuId(null);
            if (copiedMessageTimeoutRef.current) {
                clearTimeout(copiedMessageTimeoutRef.current);
            }
            copiedMessageTimeoutRef.current = window.setTimeout(() => {
                setCopiedMessageId((current) => (current === messageId ? null : current));
            }, 1500);
        } catch {
            setMessagesError(`Unable to copy message ID automatically. Please copy manually: ${messageId}`);
        }
    }, []);

    const handleLandlordQuickAction = useCallback((actionKey: QuickAction["key"]) => {
        switch (actionKey) {
            case "request-payment":
                setMessageInput("Friendly reminder: please settle your outstanding rent balance by the due date.");
                break;
            case "schedule-repair":
                router.push("/landlord/maintenance");
                break;
            case "view-lease":
                router.push("/landlord/tenants");
                break;
            case "send-notice":
                setMessageInput("Notice: ");
                break;
            case "review-application":
                router.push("/landlord/applications");
                break;
            case "schedule-viewing":
                setMessageInput("Thanks for your interest. Please share your preferred dates and times for a property viewing.");
                break;
            case "share-requirements":
                setMessageInput("Before we proceed, please submit the required documents and references for screening.");
                break;
            case "share-listing":
                router.push("/landlord/listings");
                break;
            case "view-profile":
                if (activeContact?.participantUserId) {
                    router.push(`/visitor/${activeContact.participantUserId}`);
                }
                break;
            case "archive-chat":
                setPendingConfirmAction("archive");
                break;
            case "report-user":
                openReportWizard();
                break;
            case "block-contact":
                setPendingConfirmAction("block");
                break;
            default:
                break;
        }
    }, [activeContact?.participantUserId, openReportWizard, router]);

    useEffect(() => {
        return () => {
            if (copiedMessageTimeoutRef.current) {
                clearTimeout(copiedMessageTimeoutRef.current);
            }
        };
    }, []);

    const mapMessageToUi = (message: ConversationMessage): UiMessage => {
        const metadata = (message.metadata && typeof message.metadata === "object")
            ? (message.metadata as Record<string, unknown>)
            : null;

        const isOwn = user?.id === message.senderId;
        const redactedContent = typeof metadata?.redactedContent === "string" ? metadata.redactedContent : message.content;
        const isRedacted = Boolean(metadata?.isRedacted);
        const isConfirmedDisclosed = metadata?.isConfirmedDisclosed === true;
        const isPhishing = Boolean(metadata?.isPhishing);
        const explicitCategory =
            metadata?.redactionCategory === "credentials" ||
            metadata?.redactionCategory === "profanity" ||
            metadata?.redactionCategory === "phishing" ||
            metadata?.redactionCategory === "spam" ||
            metadata?.redactionCategory === "none"
                ? metadata.redactionCategory
                : undefined;
        const metadataDisclosureAllowed = typeof metadata?.disclosureAllowed === "boolean" ? metadata.disclosureAllowed : undefined;
        const redactionCategory = explicitCategory
            ?? (isPhishing
                ? "phishing"
                : isRedacted
                    ? (metadataDisclosureAllowed ? "credentials" : "profanity")
                    : "none");
        const disclosureAllowed =
            typeof metadata?.disclosureAllowed === "boolean"
                ? metadata.disclosureAllowed
                : redactionCategory === "credentials";
        const fileUrl = typeof metadata?.fileUrl === "string" ? metadata.fileUrl : undefined;
        const fileName = typeof metadata?.fileName === "string" ? metadata.fileName : undefined;
        const filePath = typeof metadata?.filePath === "string" ? metadata.filePath : undefined;
        const fileMimeType = typeof metadata?.mimeType === "string" ? metadata.mimeType : undefined;
        const fileSize = typeof metadata?.fileSize === "number" ? metadata.fileSize : undefined;

        return {
            id: message.id,
            type: isOwn ? "landlord" : "tenant",
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
            isPhishing,
            redactionCategory,
            disclosureAllowed,
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
            const mapped = list.map(mapConversationToContact);
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
                if (conversationFromUrl && mapped.some((contact) => contact.id === conversationFromUrl)) {
                    return conversationFromUrl;
                }
                if (current && mapped.some((contact) => contact.id === current)) {
                    return current;
                }
                return mapped[0]?.id ?? null;
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
                // Ignore storage errors; in-memory cache remains active for this session.
            }
        }

        if (activeConversationIdRef.current === conversationId) {
            setMessagesState((prev) => {
                const previousById = new Map(prev.map((message) => [message.id, message]));
                const stabilized = mapped.map((serverMessage) =>
                    mergeCensorshipState(serverMessage, previousById.get(serverMessage.id))
                );
                const optimistic = prev.filter(
                    (msg) =>
                        msg.type === "landlord" &&
                        (msg.status === "sending" || msg.status === "sent") &&
                        !stabilized.some((serverMessage) => serverMessage.id === msg.id)
                );
                return [...stabilized, ...optimistic];
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

            // Adding a small delay helps ensure all internal fonts/rendering is complete
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

    const clearPendingAttachment = () => {
        setPendingAttachment((current) => {
            if (current?.previewUrl) {
                URL.revokeObjectURL(current.previewUrl);
            }
            return null;
        });
    };

    const queueSelectedFile = (file: File) => {
        if (!activeConversationId) {
            setFileUploadError("Select a conversation first before sharing files.");
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

        if ((!hasText && !hasAttachment) || !activeConversationId) return;

        shouldStickToBottomRef.current = true;

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
                    type: "landlord",
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

            const moderation = await redactMessageForSend(textMessage);
            const isSensitive = moderation.isSensitive;
            const redactedMessage = moderation.redactedMessage;
            const isPhishing = moderation.isPhishing;
            const redactionCategory = moderation.redactionCategory;
            const disclosureAllowed = moderation.disclosureAllowed;

            try {
                const created = await sendConversationMessage(activeConversationId, textMessage, {
                    isRedacted: isSensitive,
                    redactedContent: redactedMessage,
                    isConfirmedDisclosed: false,
                    isPhishing,
                    redactionCategory,
                    disclosureAllowed,
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
                                isPhishing,
                                redactionCategory,
                                disclosureAllowed,
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
        if (!activeConversationId) {
            setFileUploadError("Select a conversation first before sharing files.");
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

        if (!activeConversationId) {
            setFileUploadError("Select a conversation first before sharing files.");
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

        if (!activeConversationId) {
            setFileUploadError("Select a conversation first before sharing files.");
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

        if (!activeConversationId || !user || !activeChannelRef.current) {
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
            if (!activeChannelRef.current || !user?.id || !activeConversationId) {
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
            m.id === id && m.disclosureAllowed ? { ...m, isConfirmedDisclosed: true } : m
        ));
    };

    const handleConfirmPayment = (id: string, amount?: string) => {
        const timestamp = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        setMessagesState(prev => {
            const updated = prev.map(m =>
                m.id === id ? {
                    ...m,
                    systemType: "payment",
                    content: `${displayContact.name} successfully paid ₱${amount || "13,000"} for Rent (February). Receipt ID: #PAY-${Math.floor(Math.random() * 10000)}.`
                } : m
            );

            const invoiceId = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
            const invoiceMessage: UiMessage = {
                id: `inv_${Date.now()}`,
                type: "system",
                messageType: "system",
                systemType: "invoice",
                invoiceId: invoiceId,
                tenantName: displayContact.name,
                unit: displayContact.unit,
                amount: amount || "13,000",
                date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                description: "Monthly Rent - February 2026",
                content: "Official Electronic Invoice Generated",
                timestamp: timestamp,
                createdAt: new Date().toISOString(),
            };

            return [...updated, invoiceMessage];
        });
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
        if (!activeConversationId) {
            setMessagesState([]);
            setIsOtherUserTyping(false);
            setIsMessagesLoading(false);
            return;
        }

        if (!user?.id) {
            // Wait for user to load so mapMessageToUi can correctly determine if user sent it.
            setIsMessagesLoading(true);
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
    }, [activeConversationId, user?.id]);

    useEffect(() => {
        if (!activeConversationId) return;

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
        if (!shouldStickToBottomRef.current && !shouldScrollOnConversationOpenRef.current) {
            return;
        }

        const behavior: ScrollBehavior = shouldScrollOnConversationOpenRef.current ? "auto" : "smooth";
        const frame = window.requestAnimationFrame(() => {
            scrollToLatest(behavior);
            shouldScrollOnConversationOpenRef.current = false;
        });
        const timeout = window.setTimeout(() => {
            scrollToLatest(behavior);
            shouldScrollOnConversationOpenRef.current = false;
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
            if (activeConversationId) {
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

    return (
        <div className="flex h-full w-full gap-6 overflow-hidden bg-surface-0 p-6 text-high animate-in fade-in duration-700">

            {isGlobalFileDrag && (
                <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 backdrop-blur-sm dark:bg-black/60">
                    <div className="rounded-3xl border border-primary/30 bg-card/95 px-10 py-8 text-center shadow-[0_24px_60px_-30px_rgba(15,23,42,0.28)] dark:border-primary/40 dark:bg-neutral-900/90 dark:shadow-2xl dark:shadow-primary/20">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                            <Paperclip className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-lg font-bold text-foreground dark:text-white">
                            {!activeConversationId ? "Select a conversation to upload" : "Drop here to upload"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-neutral-400">Release to add this file to the composer</p>
                    </div>
                </div>
            )}

            {/* Sidebar Contact List */}
            <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-1 shadow-sm dark:shadow-2xl lg:w-96">
                {/* Header */}
                <div className="flex shrink-0 flex-col gap-4 border-b border-divider p-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/landlord/dashboard"
                            className="rounded-xl border border-divider bg-surface-2 p-2 transition-colors hover:bg-surface-3"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="h-4 w-4 text-medium" />
                        </Link>
                        <div className="flex flex-1 items-center justify-between">
                            <h2 className="mt-0.5 text-xl font-bold leading-none text-high">Messages</h2>
                            <ThemeToggle variant="sidebar" className="h-9 w-9" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-medium" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users to message..."
                            className="w-full rounded-xl border border-divider bg-surface-2 py-2 pl-10 pr-4 text-sm text-high placeholder:text-disabled transition-all focus:border-primary focus:bg-surface-2 focus:outline-none"
                        />

                        {searchQuery.trim().length >= 2 && (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-64 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1 shadow-xl backdrop-blur dark:border-white/10 dark:bg-neutral-950/95 dark:shadow-2xl">
                                {isSearchingUsers && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground dark:text-neutral-400">Searching users...</div>
                                )}
                                {!isSearchingUsers && userSearchError && (
                                    <div className="px-3 py-2 text-xs text-red-300">{userSearchError}</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground dark:text-neutral-400">No matching users found.</div>
                                )}
                                {!isSearchingUsers && !userSearchError && userSearchResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleStartConversation(result.id)}
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted dark:hover:bg-white/10"
                                    >
                                        <img
                                            src={result.avatarUrl || FALLBACK_AVATAR}
                                            alt={result.fullName}
                                            className="h-8 w-8 rounded-full border border-border object-cover dark:border-white/10"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-semibold text-foreground dark:text-white">{result.fullName}</div>
                                            <div className="truncate text-[11px] text-muted-foreground dark:text-neutral-400">{result.role} • {result.email}</div>
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
                                <div key={`sidebar-skeleton-${index}`} className="flex w-full animate-pulse items-center gap-3 rounded-2xl border border-divider bg-surface-2/20 p-3">
                                    <div className="h-12 w-12 rounded-full bg-muted dark:bg-neutral-700/70" />
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="h-3.5 w-1/2 rounded bg-muted dark:bg-neutral-700/70" />
                                        <div className="h-2.5 w-2/3 rounded bg-muted/70 dark:bg-neutral-800/70" />
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
                                        activeConversationId === contact.id ? "border border-primary/20 bg-primary/8" : "border border-transparent hover:bg-muted/55 dark:hover:bg-white/[0.03]"
                                    )}
                                >
                                    <div className="relative shrink-0">
                                        <img src={contact.avatar} alt={contact.name} className="h-12 w-12 rounded-full border border-border object-cover dark:border-white/10" />
                                        {contact.unread > 0 && (
                                            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-red-500 dark:border-[#0a0a0a]">
                                                <span className="text-[9px] font-bold text-white">{contact.unread}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h4 className="truncate pr-2 text-sm font-bold text-foreground dark:text-white">{contact.name}</h4>
                                            <span className="shrink-0 text-[10px] text-muted-foreground dark:text-neutral-500">{contact.lastContact}</span>
                                        </div>
                                        <p className="truncate text-xs font-medium text-muted-foreground dark:text-neutral-400">{contact.unit}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface-0 shadow-sm dark:shadow-2xl">
                {/* Chat Header */}
                <div className="z-10 flex h-20 shrink-0 items-center justify-between border-b border-divider bg-surface-1/80 px-6 backdrop-blur-md dark:backdrop-blur-none">
                    <div className="flex items-center gap-4">
                        <img src={displayContact.avatar} alt={displayContact.name} className="h-10 w-10 rounded-full border border-border object-cover dark:border-white/10" />
                        <div>
                            <h3 className="text-base font-bold text-high">{displayContact.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-medium">{displayContact.unit}</span>

                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">

                        <button className="rounded-lg p-2 text-medium transition-colors hover:bg-surface-2 hover:text-high">
                            <Search className="w-4 h-4" />
                        </button>
                        <button
                            onClick={openReportWizard}
                            disabled={!activeContact?.participantUserId}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Report User"
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Report</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowFilesSidebar(!showFilesSidebar);
                                setShowInfoSidebar(false);
                            }}
                            className={cn(
                                "rounded-lg p-2 transition-colors hover:text-foreground dark:hover:text-white",
                                showFilesSidebar ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white" : "text-muted-foreground hover:bg-muted dark:text-neutral-400 dark:hover:bg-white/5"
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
                                "rounded-lg p-2 transition-colors hover:text-foreground dark:hover:text-white",
                                showInfoSidebar ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white" : "text-muted-foreground hover:bg-muted dark:text-neutral-400 dark:hover:bg-white/5"
                            )}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {messagesError && (
                    <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-200">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                        <div className="flex-1 leading-relaxed">{messagesError}</div>
                        <button
                            onClick={() => setMessagesError(null)}
                            className="rounded p-0.5 text-red-700/80 hover:bg-red-500/10 hover:text-red-800 dark:text-red-200/80 dark:hover:bg-white/10 dark:hover:text-red-100"
                            aria-label="Dismiss message error"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Messages List */}
                <div
                    ref={messagesScrollRef}
                    onScroll={updateShouldStickToBottom}
                    onClick={() => setOpenMessageMenuId(null)}
                    className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center w-full"
                >
                    <div className="w-full max-w-4xl p-6 space-y-6">
                        <div className="text-center py-4">
                            <span className="rounded-full border border-divider bg-surface-1 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-disabled shadow-sm">
                                Conversation Started • February 1, 2026
                            </span>
                        </div>

                        {isMessagesLoading ? (
                            <div className="w-full space-y-4" aria-live="polite" aria-busy="true">
                                {Array.from({ length: 6 }).map((_, index) => {
                                    const isMe = index % 3 === 2;

                                    return (
                                        <div key={`message-skeleton-${index}`} className={cn("flex items-end gap-3 w-full", isMe ? "justify-end" : "justify-start")}>
                                            {!isMe && <div className="w-8 h-8 rounded-full bg-surface-2 animate-pulse shrink-0" />}
                                            <div
                                                className={cn(
                                                    "animate-pulse border",
                                                    isMe
                                                        ? "h-14 w-[45%] max-w-sm rounded-3xl rounded-br-sm bg-primary/25 border-primary/20"
                                                        : "h-16 w-[55%] max-w-md rounded-3xl rounded-bl-sm border-divider bg-surface-2/40"
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
                                            <div className="flex flex-col gap-0 bg-surface-1 overflow-hidden border border-primary/30 rounded-3xl shadow-2xl max-w-sm w-full transition-all hover:border-primary/50 group pb-4">
                                                {/* Header Gradient */}
                                                <div className="bg-gradient-to-r from-primary/80 to-primary p-5 relative overflow-hidden h-24 flex items-center shrink-0">
                                                    <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 w-24 h-24 rounded-full blur-2xl"></div>
                                                    <div className="relative z-10 flex items-center gap-3">
                                                        <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/10">
                                                            <Receipt className="h-6 w-6 text-black" />
                                                        </div>
                                                        <div className="text-left flex flex-col justify-center text-black">
                                                            <p className="text-lg font-bold leading-tight">Payment Received</p>
                                                            <p className="text-[10px] font-bold tracking-wide uppercase opacity-70">{msg.timestamp}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Section */}
                                                <div className="px-5 pt-5 pb-2 flex flex-col gap-4">
                                                    <div className="flex justify-between items-center bg-surface-2 rounded-2xl p-4 border border-divider">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase tracking-wider text-medium font-bold mb-1">Amount Paid</span>
                                                            <span className="text-2xl font-black text-primary">₱{msg.paymentAmount}</span>
                                                        </div>
                                                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                                            <Wallet className="h-4 w-4 text-primary" />
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-medium leading-relaxed bg-surface-2/50 p-3 rounded-xl border border-divider">
                                                        {msg.content}
                                                    </p>

                                                    {msg.receiptImg && (
                                                        <div className="flex flex-col gap-2 mt-1">
                                                            <span className="text-[10px] uppercase tracking-wider text-medium font-bold ml-1">Proof of Payment</span>
                                                            <div className="rounded-2xl overflow-hidden border border-divider relative cursor-pointer shadow-inner">
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10 group/img">
                                                                    <div className="bg-white/10 border border-white/20 p-2 rounded-full transform scale-95 group-hover/img:scale-100 transition-all">
                                                                        <Search className="w-5 h-5 text-white" />
                                                                    </div>
                                                                </div>
                                                                <img src={msg.receiptImg} alt="Receipt" className="w-full h-32 object-cover opacity-90 transition-opacity" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <div className="px-5 mt-2">
                                                    <button
                                                        onClick={() => handleConfirmPayment(msg.id, msg.paymentAmount)}
                                                        className="w-full bg-primary hover:bg-primary/90 text-black py-3 rounded-xl text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(200,255,0,0.15)] transform hover:-translate-y-0.5"
                                                    >
                                                        Verify  & Confirm Payment
                                                    </button>
                                                </div>
                                            </div>
                                        ) : msg.systemType === "invoice" ? (
                                            <div id={`invoice-${msg.id}`} className="flex flex-col w-full max-w-md bg-surface-1 border border-divider rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                                                {/* Invoice Watermark Header */}
                                                <div className="bg-surface-2 p-6 border-b border-divider relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Receipt size={120} className="-rotate-12" />
                                                    </div>
                                                    <div className="relative z-10 flex justify-between items-start">
                                                        <div>
                                                            <Logo theme="dark" className="h-6 w-auto mb-1" />
                                                            <p className="text-[10px] text-medium font-bold uppercase tracking-widest">Digital Payment Invoice</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                                Status: Paid
                                                            </span>
                                                            <p className="text-[10px] text-medium mt-2 font-medium">{msg.invoiceId}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Invoice Content */}
                                                <div className="p-6 space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] text-medium uppercase font-bold tracking-wider mb-1">Billed To</p>
                                                            <p className="text-sm font-bold text-high leading-tight">{msg.tenantName}</p>
                                                            <p className="text-[11px] text-medium mt-0.5">{msg.unit}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] text-medium uppercase font-bold tracking-wider mb-1">Date Issued</p>
                                                            <p className="text-sm font-bold text-high leading-tight">{msg.date}</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-surface-2/40 rounded-2xl border border-divider overflow-hidden">
                                                        <div className="p-3 border-b border-divider bg-surface-2/20 flex items-center justify-between">
                                                            <span className="text-[9px] text-medium uppercase font-bold tracking-wider px-1">Description</span>
                                                            <span className="text-[9px] text-medium uppercase font-bold tracking-wider px-1">Amount</span>
                                                        </div>
                                                        <div className="p-4 flex items-center justify-between">
                                                            <p className="text-xs text-high font-medium">{msg.description}</p>
                                                            <p className="text-sm font-black text-high">₱{msg.amount}</p>
                                                        </div>
                                                        <div className="px-4 py-3 bg-primary/5 flex items-center justify-between border-t border-divider">
                                                            <span className="text-[10px] text-medium font-bold uppercase tracking-widest">Total Paid</span>
                                                            <span className="text-lg font-black text-primary">₱{msg.amount}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            disabled={isDownloading}
                                                            onClick={() => handleDownloadImage(`invoice-${msg.id}`, `Invoice-${msg.invoiceId}`)}
                                                            className={cn(
                                                                "flex-1 bg-surface-2 hover:bg-surface-3 text-high py-3 rounded-2xl text-[11px] font-bold transition-all border border-divider flex items-center justify-center gap-2 group",
                                                                isDownloading && "opacity-50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <Download className="w-3.5 h-3.5 text-medium group-hover:text-high transition-colors" />
                                                            {isDownloading ? "Generating..." : "Download Image"}
                                                        </button>
                                                        <button className="w-12 h-12 bg-surface-2 hover:bg-surface-3 text-medium hover:text-high flex items-center justify-center rounded-2xl transition-all border border-divider">
                                                            <ShieldCheck className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="px-6 py-3 bg-surface-1 border-t border-divider text-center">
                                                    <p className="text-[9px] text-disabled font-medium tracking-wide">Securely generated by iReside Iris Intelligence System</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-surface-1 border border-divider px-5 py-3 rounded-2xl shadow-sm text-center">
                                                <div className="bg-surface-2 p-2 rounded-full border border-divider shrink-0">
                                                    {renderSystemIcon(msg.systemType || '')}
                                                </div>
                                                <div className="text-left flex flex-col justify-center">
                                                    <p className="text-xs text-high font-medium leading-relaxed">{msg.content}</p>
                                                    <p className="text-[9px] text-medium mt-0.5 tracking-wider uppercase">{msg.timestamp}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const isMe = msg.type === "landlord";
                            const hasImageAttachment = Boolean(msg.fileUrl && msg.fileMimeType?.startsWith("image/"));
                            const hasFileAttachment = Boolean(msg.fileUrl && !msg.fileMimeType?.startsWith("image/"));

                            return (
                                <div key={msg.id} className={cn("group/message flex flex-col w-full gap-1.5 mb-2 animate-in fade-in duration-300", isMe ? "items-end slide-in-from-right-2" : "items-start slide-in-from-left-2")}>
                                    <div className="flex items-end gap-3 w-full justify-end max-w-full" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                        {!isMe && (
                                            <img src={displayContact.avatar} className="h-8 w-8 shrink-0 rounded-full border border-border dark:border-white/10" alt="avatar" />
                                        )}
                                        <div className={cn(
                                            "px-5 py-3.5 max-w-[85%] sm:max-w-[70%] shadow-lg relative transition-all duration-500",
                                            isMe
                                                ? "rounded-3xl rounded-br-sm bg-primary font-black uppercase tracking-widest text-[11px] text-black shadow-primary/20"
                                                : "rounded-3xl rounded-bl-sm border border-divider bg-surface-1 text-high",
                                            (hasImageAttachment || hasFileAttachment) && "px-0 py-0 bg-transparent border-none shadow-none"
                                        )}>
                                            {hasImageAttachment && (
                                                <button
                                                    onClick={() => setPreviewImageUrl(msg.fileUrl || null)}
                                                    className="mb-2 block w-full overflow-hidden rounded-2xl border border-border bg-muted/40 dark:border-white/10 dark:bg-black/40"
                                                >
                                                    <img src={msg.fileUrl} alt={msg.fileName || "Shared image"} className="w-full max-h-64 object-contain" />
                                                </button>
                                            )}

                                            {hasFileAttachment && (
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 dark:border-white/10 dark:bg-neutral-900/80"
                                                >
                                                    <div className="p-2 rounded-lg bg-white/10">
                                                        <File className="w-4 h-4 text-foreground dark:text-neutral-100" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-foreground dark:text-neutral-100">{msg.fileName || msg.content}</p>
                                                        <p className="text-[10px] text-muted-foreground dark:text-neutral-400">
                                                            {formatFileSize(msg.fileSize ?? 0)}
                                                        </p>
                                                    </div>
                                                </a>
                                            )}

                                            {!msg.fileUrl && (
                                                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                                    {msg.isRedacted && (!msg.isConfirmedDisclosed || !msg.disclosureAllowed)
                                                        ? prettifyRedactedText(msg.redactedContent || msg.content)
                                                        : msg.content
                                                    }
                                                </div>
                                            )}
                                        </div>
                                        <div className="relative shrink-0 self-start">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setOpenMessageMenuId((current) => (current === msg.id ? null : msg.id));
                                                }}
                                                className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover/message:opacity-100 focus:opacity-100"
                                                aria-label="Message actions"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {openMessageMenuId === msg.id && (
                                                <div
                                                    className={cn(
                                                        "absolute z-20 mt-1 min-w-[150px] rounded-xl border border-border bg-card p-1 shadow-xl",
                                                        isMe ? "right-0" : "left-0"
                                                    )}
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleCopyMessageId(msg.id)}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        Copy message ID
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={cn("flex items-center gap-1 px-2 text-[10px]", isMe ? "text-medium" : "text-medium/80")}>
                                        {isMe ? renderOutgoingStatus(msg.status, msg.timestamp) : <span>{msg.timestamp}</span>}
                                        {copiedMessageId === msg.id && <span className="text-emerald-500 font-semibold">ID copied</span>}
                                    </div>

                                    {msg.isRedacted && (!msg.isConfirmedDisclosed || !msg.disclosureAllowed) && (
                                        <div className="w-full flex justify-center mt-2 mb-4">
                                            <div className={cn(
                                                "max-w-[75%] sm:max-w-[60%] text-[11px] p-4 rounded-3xl border backdrop-blur-md shadow-lg text-center",
                                                msg.isPhishing 
                                                    ? "border-red-500/40 bg-red-500/10 text-red-700 shadow-red-500/10 dark:bg-red-900/40 dark:text-red-300" 
                                                    : "border-amber-500/20 bg-card/90 text-muted-foreground shadow-amber-500/5 dark:bg-neutral-900/60 dark:text-neutral-300"
                                            )}>
                                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                                    <AlertTriangle className={cn("w-4 h-4", msg.isPhishing || msg.redactionCategory === "spam" ? "text-red-500" : "text-amber-500")} />
                                                    <strong className={cn("text-xs", msg.isPhishing || msg.redactionCategory === "spam" ? "text-red-500" : "text-amber-500")}>
                                                        {msg.isPhishing || msg.redactionCategory === "spam" ? "Malicious Content Detected" : "Iris AI Intercepted"}
                                                    </strong>
                                                </div>
                                                <p className="leading-relaxed opacity-90 text-muted-foreground dark:text-neutral-400">
                                                    {msg.isPhishing
                                                        ? "Warning: This message has been flagged for phishing. It may be attempting to steal your credentials or lead you to a fraudulent site."
                                                        : msg.redactionCategory === "spam"
                                                            ? "This message matches spam/scam patterns and has been blocked from normal disclosure."
                                                        : msg.redactionCategory === "profanity"
                                                            ? "This message contains prohibited profanity and remains permanently censored."
                                                            : "This message contains sensitive credentials. If you proceed to disclose this, iReside will not be held accountable for any resulting damages (see Terms & Conditions)."}
                                                </p>
                                                {msg.disclosureAllowed && (
                                                    <div className="mt-4 flex items-center justify-center">
                                                        <button
                                                            onClick={() => confirmDisclose(msg.id)}
                                                            className="px-6 py-2 bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 font-bold rounded-xl transition-all w-fit"
                                                        >
                                                            Confirm & Disclose
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isOtherUserTyping && (
                            <div className="flex items-end gap-3 w-full justify-start max-w-full animate-in fade-in slide-in-from-left-2 duration-300">
                                <img src={displayContact.avatar} className="h-8 w-8 shrink-0 rounded-full border border-border dark:border-white/10" alt="avatar" />
                                <div className="rounded-3xl rounded-bl-sm border border-border bg-card px-4 py-3 text-foreground shadow-lg dark:border-white/5 dark:bg-neutral-800 dark:text-white">
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
                <div className="relative flex w-full shrink-0 justify-center border-t border-divider bg-surface-1/80">
                    <AnimatePresence>
                        {showSecurityWarning && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-none absolute left-1/2 -top-14 z-20 w-full max-w-4xl -translate-x-1/2 px-4 md:px-0"
                            >
                                <div className="pointer-events-auto bg-background/80 dark:bg-black/60 backdrop-blur-xl border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-between gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] pr-2">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 hidden sm:inline">
                                            <strong className="text-amber-500 dark:text-amber-400 mr-1">Security Warning:</strong>
                                            Never share sensitive credentials or passwords. Admins will NEVER ask for this.
                                        </span>
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 sm:hidden">
                                            Keep credentials private.
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowChatRulesModal(true)}
                                            className="text-[10px] md:text-xs shrink-0 font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                                        >
                                            Rules
                                        </button>
                                        <button
                                            onClick={() => setShowSecurityWarning(false)}
                                            className="p-1.5 rounded-lg text-amber-600/50 hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                                            aria-label="Dismiss warning"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="w-full max-w-4xl flex flex-col gap-3 p-4 md:p-6">
                        {pendingAttachment && (
                            <div className="relative w-36 rounded-2xl border border-border bg-card/80 p-2 dark:border-white/10 dark:bg-black/30">
                                <button
                                    onClick={clearPendingAttachment}
                                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                                    aria-label="Remove attachment"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                {pendingAttachment.isImage && pendingAttachment.previewUrl ? (
                                    <img
                                        src={pendingAttachment.previewUrl}
                                        alt="Attachment preview"
                                        className="h-24 w-full rounded-xl bg-muted/30 object-contain dark:bg-black/40"
                                    />
                                ) : (
                                    <div className="flex h-24 w-full flex-col justify-center rounded-xl border border-border bg-card p-3 dark:border-white/10 dark:bg-neutral-900/50">
                                        <File className="w-4 h-4 text-primary mb-2" />
                                        <p className="truncate text-[10px] font-semibold text-foreground dark:text-neutral-300">{pendingAttachment.file.name}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            onDragOver={handleComposerDragOver}
                            onDragLeave={handleComposerDragLeave}
                            onDrop={handleComposerDrop}
                            className={cn(
                                "flex items-end gap-3 rounded-[2rem] border border-border bg-background/85 p-2 pl-5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.15)] focus-within:ring-0 dark:border-white/10 dark:bg-black/40",
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
                                placeholder="Type a message..."
                                className="custom-scrollbar max-h-32 w-full resize-none bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground border-none !ring-0 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!ring-0 focus-visible:!outline-none dark:text-white dark:placeholder:text-neutral-500"
                                rows={1}
                            />
                            <div className="flex items-center gap-1 shrink-0 pb-1">
                                <button
                                    onClick={handleFilePickerOpen}
                                    disabled={isUploadingFile || !activeConversationId}
                                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
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
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/10">
                                <div
                                    className="h-full bg-primary transition-all duration-150"
                                    style={{ width: `${uploadProgress ?? 0}%` }}
                                />
                            </div>
                        )}
                        <div className="flex items-center justify-between px-2">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground dark:text-neutral-500">
                                <ShieldCheck className="w-3 h-3" /> Secure connection
                            </span>
                            <span className="text-[10px] text-muted-foreground dark:text-neutral-500">
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

            {/* Right Info Sidebar (Slide out panel) */}
            {showInfoSidebar && (
                <div className="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm animate-in slide-in-from-right-8 duration-300 dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-2xl">
                    <div className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-card/80 px-6 dark:border-white/5 dark:bg-neutral-900/30">
                        <h3 className="font-bold text-foreground dark:text-white">
                            {activeRelationshipStatus === "tenant_landlord"
                                ? "Tenant Details"
                                : activeRelationshipStatus === "prospective"
                                    ? "Applicant Details"
                                    : "Contact Details"}
                        </h3>
                        <button
                            onClick={() => setShowInfoSidebar(false)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        {/* Quick Actions */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-neutral-300">
                                    <Zap className="w-4 h-4 text-primary" /> Quick Actions
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {activeQuickActions.map((action) => {
                                    const ActionIcon = action.icon;

                                    return (
                                        <button
                                            key={action.key}
                                            onClick={() => handleLandlordQuickAction(action.key)}
                                            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background/80 p-3 transition-all hover:border-primary/15 hover:bg-muted dark:border-white/5 dark:bg-neutral-800/50 dark:hover:border-white/10 dark:hover:bg-neutral-800"
                                        >
                                            <div className={cn("p-2 rounded-lg group-hover:scale-110 transition-transform", action.iconContainerClassName)}>
                                                <ActionIcon className={cn("w-4 h-4", action.iconClassName)} />
                                            </div>
                                            <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground group-hover:text-foreground dark:text-neutral-400 dark:group-hover:text-white">
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
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-neutral-300">
                                        <History className="w-4 h-4 text-primary" /> Payment History
                                    </h4>
                                    <button
                                        onClick={() => setShowPaymentHistoryModal(true)}
                                        className="cursor-pointer text-[10px] font-bold uppercase text-muted-foreground transition-colors hover:text-foreground dark:text-neutral-500 dark:hover:text-white"
                                    >
                                        View All
                                    </button>
                                </div>
                                {paymentHistoryLoading ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">Loading payment history...</p>
                                ) : paymentHistoryError ? (
                                    <p className="text-xs text-red-300">{paymentHistoryError}</p>
                                ) : paymentHistory.length === 0 ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">No payment history yet.</p>
                                ) : (
                                    <div className="relative flex flex-col gap-3 before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent md:before:mx-auto md:before:translate-x-0 dark:before:via-white/5">
                                        {paymentHistory.slice(0, 3).map((payment) => {
                                            const isPaid = payment.statusTone === "paid";

                                            return (
                                                <div key={payment.id} className="relative flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card dark:bg-neutral-900",
                                                                isPaid
                                                                    ? "border-border dark:border-white/20"
                                                                    : "border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.18)]"
                                                            )}
                                                        >
                                                            {isPaid ? (
                                                                <CheckCircle2 className="w-3 h-3 text-muted-foreground dark:text-neutral-400" />
                                                            ) : (
                                                                <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span
                                                                className={cn(
                                                                    "text-[11px] font-bold",
                                                                    isPaid ? "text-muted-foreground dark:text-neutral-300" : "text-foreground dark:text-white"
                                                                )}
                                                            >
                                                                {payment.monthLabel} {payment.typeLabel}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    "text-[10px]",
                                                                    isPaid ? "text-muted-foreground dark:text-neutral-500" : "text-primary"
                                                                )}
                                                            >
                                                                {isPaid ? payment.dateLabel : payment.statusLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-xs font-bold",
                                                            isPaid ? "text-muted-foreground dark:text-neutral-400" : "text-foreground dark:text-white"
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
                <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm animate-in slide-in-from-right-8 duration-300 dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-2xl">
                    {/* Header */}
                    <div className="relative flex h-20 shrink-0 items-center justify-between overflow-hidden border-b border-border bg-card/80 px-6 dark:border-white/5 dark:bg-neutral-900/40">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Folder size={80} className="-rotate-12" />
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <Folder className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground dark:text-white">Shared Files</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-neutral-500">
                                    {sharedFiles.length} Items • {formatFileSize(totalSharedSize)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilesSidebar(false)}
                            className="relative z-10 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="shrink-0 border-b border-border px-6 py-4 dark:border-white/5">
                        <div className="flex rounded-xl border border-border bg-background/80 p-1 dark:border-white/5 dark:bg-black/40">
                            {['all', 'media', 'docs'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFileFilter(filter)}
                                    className={cn(
                                        "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                                        fileFilter === filter
                                            ? "bg-card text-foreground shadow-sm dark:bg-white/10 dark:text-white"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-white/5"
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
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-neutral-300">
                                        <ImageIcon className="w-4 h-4 text-blue-400" /> Recent Media
                                    </h4>
                                </div>
                                {sharedFiles.filter((item) => item.isMedia).length === 0 ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">No media shared in this conversation yet.</p>
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
                                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-border bg-card dark:border-white/10 dark:bg-neutral-800"
                                                >
                                                    <img src={item.url} alt={item.name} className="h-full w-full object-contain bg-muted/30 opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 dark:bg-black/40" />
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
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-neutral-300">
                                        <FileText className="w-4 h-4 text-primary" /> Shared Documents
                                    </h4>
                                </div>
                                {sharedFiles.filter((item) => !item.isMedia).length === 0 ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">No documents shared in this conversation yet.</p>
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
                                                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background/70 p-3 transition-all hover:border-primary/15 hover:bg-muted dark:border-white/5 dark:bg-black/20 dark:hover:border-white/10 dark:hover:bg-white/[0.05]"
                                                >
                                                    <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                                                        <File className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary dark:text-neutral-200 dark:group-hover:text-white">{item.name}</p>
                                                        <div className="flex items-center gap-2 mt-1 blur-0">
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-neutral-500">{formatFileSize(item.size)}</span>
                                                            <span className="h-1 w-1 rounded-full bg-border dark:bg-white/10"></span>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:text-neutral-500">{item.timestampLabel}</span>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-lg p-2 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-primary/10 hover:text-primary dark:text-neutral-500">
                                                        <Download className="w-4 h-4" />
                                                    </div>
                                                </a>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {sharedFiles.length === 0 && fileFilter === "all" && (
                            <div className="rounded-2xl border border-border bg-background/70 p-4 text-center dark:border-white/5 dark:bg-black/20">
                                <p className="text-xs text-muted-foreground dark:text-neutral-400">No shared files yet.</p>
                                <p className="mt-1 text-[10px] text-muted-foreground/80 dark:text-neutral-600">Use the paperclip button in chat to upload files.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment History Full Modal Overlay */}
            {showPaymentHistoryModal && canShowPaymentHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md animate-in fade-in duration-300 dark:bg-black/80 sm:p-6">
                    <div id="payment-statement" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_28px_70px_-36px_rgba(15,23,42,0.4)] animate-in zoom-in-95 duration-300 dark:border-white/10 dark:bg-neutral-900 dark:shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-border bg-card/80 p-6 dark:border-white/5 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                    <History className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground dark:text-white">Full Payment history</h3>
                                    <p className="mt-1 text-xs text-muted-foreground dark:text-neutral-500">{displayContact.name} • {displayContact.unit}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPaymentHistoryModal(false)}
                                className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Detailed List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-4">
                                {paymentHistoryLoading ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">Loading payment history...</p>
                                ) : paymentHistoryError ? (
                                    <p className="text-xs text-red-300">{paymentHistoryError}</p>
                                ) : paymentHistory.length === 0 ? (
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">No payment history yet.</p>
                                ) : (
                                    paymentHistory.map((payment) => {
                                        const isPaid = payment.statusTone === "paid";

                                        return (
                                            <div key={payment.id} className="group flex items-center justify-between rounded-2xl border border-border bg-background/70 p-4 transition-all hover:bg-muted dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
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
                                                        <span className="text-sm font-bold text-foreground transition-colors group-hover:text-primary dark:text-white">{payment.monthLabel}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-neutral-400">{payment.typeLabel} via {payment.methodLabel}</span>
                                                            <span className="h-1 w-1 rounded-full bg-border dark:bg-neutral-700"></span>
                                                            <span className="text-[10px] text-muted-foreground dark:text-neutral-500">{payment.dateLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-base font-black text-foreground dark:text-white">₱{formatAmount(payment.amount)}</span>
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
                        <div className="flex items-center justify-between border-t border-border bg-card/80 p-6 dark:border-white/5 dark:bg-neutral-900/50">
                            <div className="flex flex-col">
                                <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-neutral-500">Total Paid (Lifetime)</span>
                                <span className="text-lg font-black text-foreground dark:text-white">{paymentHistoryLoading ? "—" : `₱${formatAmount(paymentHistoryTotal)}`}</span>
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
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm dark:bg-black/80">
                    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.32)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-2xl">
                        <h4 className="text-lg font-bold text-foreground dark:text-white">
                            {pendingConfirmAction === "archive" ? "Archive this conversation?" : "Block this contact?"}
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                            {pendingConfirmAction === "archive"
                                ? "Archived chats are hidden from your list but can be restored later by support."
                                : "Blocked contacts are removed from your message list and future direct messaging should be restricted."}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setPendingConfirmAction(null)}
                                disabled={isSubmittingConfirmAction}
                                className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm dark:bg-black/80">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/20 bg-card shadow-[0_24px_60px_-30px_rgba(15,23,42,0.32)] animate-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:shadow-2xl">
                        <div className="bg-red-500/10 p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h4 className="mb-2 text-xl font-black text-foreground dark:text-white">Message Blocked</h4>
                            <p className="text-sm font-semibold leading-relaxed text-muted-foreground dark:text-neutral-300">
                                {moderationMessage || "Your message violated our community guidelines."}
                            </p>
                        </div>
                        <div className="space-y-4 border-t border-border bg-card/80 p-6 dark:border-white/5 dark:bg-[#0a0a0a]">
                            <div className="rounded-lg border border-border bg-background/70 p-3 text-center text-xs leading-relaxed text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                                <strong className="text-foreground dark:text-white">Warning:</strong> Repeated violations of our chat policies—including hate speech, severe profanity, harassment, or spam—may lead to formal account offense or permanent suspension.
                            </div>
                            <button
                                onClick={() => setShowModerationModal(false)}
                                className="w-full rounded-xl bg-card px-3 py-3 font-bold text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-border hover:bg-muted dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus:ring-white/20"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showChatRulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm dark:bg-black/80">
                    <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(15,23,42,0.32)] animate-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-neutral-900 dark:shadow-2xl">
                        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-border bg-card p-6 dark:border-white/5 dark:bg-neutral-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-xl font-black text-foreground dark:text-white">Chat Rules & Policy</h4>
                            </div>
                            <button
                                onClick={() => setShowChatRulesModal(false)}
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-white">1. Professional Conduct</h5>
                                <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                                    All communications must remain professional, respectful, and courteous. Hate speech, discrimination, harassment, and severe profanity are strictly prohibited.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-white">2. Prohibited Content</h5>
                                <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                                    You may not send spam, unauthorized advertisements, explicit media, or any illegal content. Our moderation system actively intercepts and blocks such content.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-white">3. Platform Safety</h5>
                                <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                                    Do not attempt to bypass platform processes. Sharing external payment links, requesting off-platform security deposits, or phishing for sensitive credentials (passwords, bank details) is forbidden.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-white">4. Reporting Violations</h5>
                                <p className="text-sm leading-relaxed text-muted-foreground dark:text-neutral-300">
                                    If you encounter a user violating these rules, please use the &quot;Report User&quot; feature. Repeated violations will result in permanent suspension of the offending account.
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-border bg-card/80 p-6 dark:border-white/5 dark:bg-[#0a0a0a]">
                            <button
                                onClick={() => setShowChatRulesModal(false)}
                                className="rounded-xl bg-card px-6 py-2.5 font-bold text-foreground transition-all focus:outline-none hover:bg-muted dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportWizard && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md animate-in fade-in duration-300 dark:bg-black/80">
                    <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_28px_70px_-36px_rgba(15,23,42,0.4)] animate-in zoom-in-95 duration-200 dark:border-white/10 dark:bg-neutral-900 dark:shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-red-500/5 p-6 dark:border-white/5 dark:bg-red-500/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                    <Flag className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-foreground dark:text-white">Report User</h4>
                                    <p className="text-xs text-muted-foreground dark:text-neutral-500">Your report is anonymous and helps us keep iReside safe.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportWizard(false)}
                                className="rounded-xl p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {/* Category Selection */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 dark:text-neutral-500">
                                    <span className="h-1 w-3 rounded-full bg-red-500" />
                                    Reason for Report
                                </label>
                                <div className="relative group">
                                    <select
                                        value={reportCategory}
                                        onChange={(event) => setReportCategory(event.target.value)}
                                        className="w-full appearance-none rounded-2xl border border-border bg-background/50 px-5 py-4 text-sm font-bold text-foreground transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                                    >
                                        <option value="spam">Spam</option>
                                        <option value="profanity">Inappropriate Language</option>
                                        <option value="harassment">Harassment</option>
                                        <option value="scam_or_fraud">Scam or Fraud</option>
                                        <option value="impersonation">Impersonation</option>
                                        <option value="other">Other Violation</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-red-500 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 dark:text-neutral-500">
                                    <span className="h-1 w-3 rounded-full bg-red-500" />
                                    Reported Message
                                </label>
                                <input
                                    type="text"
                                    value={reportMessageId}
                                    onChange={(event) => setReportMessageId(event.target.value)}
                                    placeholder="Paste message ID here (optional)"
                                    className="w-full rounded-2xl border border-border bg-background/50 px-5 py-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                                <p className="text-[11px] text-muted-foreground/80">
                                    Hover any message, click the menu, then choose <strong>Copy message ID</strong>.
                                </p>
                                {reportMessageId && (
                                    <p className="text-[11px] font-mono text-muted-foreground/80">
                                        Message ID: {reportMessageId}
                                    </p>
                                )}
                            </div>

                            {/* Exact Message (Conditional) */}
                            {reportCategory === "profanity" && (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 dark:text-neutral-500">
                                        <span className="h-1 w-3 rounded-full bg-amber-500" />
                                        Evidence
                                    </label>
                                    <textarea
                                        value={reportExactMessage}
                                        onChange={(event) => setReportExactMessage(event.target.value)}
                                        rows={2}
                                        placeholder="Paste the problematic message here..."
                                        className="w-full resize-none rounded-2xl border border-border bg-background/50 px-5 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                                    />
                                </div>
                            )}

                            {/* Screenshot Evidence */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 dark:text-neutral-500">
                                    <span className="h-1 w-3 rounded-full bg-blue-500" />
                                    Screenshot Proof
                                </label>
                                <input
                                    ref={reportFileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        const selected = Array.from(event.target.files ?? []);
                                        if (selected.length === 0) return;
                                        const merged = [...reportScreenshots, ...selected].slice(0, 4);
                                        setReportScreenshots(merged);
                                        event.currentTarget.value = "";
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => reportFileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-black/20 dark:text-white dark:hover:bg-white/10"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    Attach Screenshots
                                </button>
                                {reportScreenshots.length > 0 && (
                                    <div className="space-y-1">
                                        {reportScreenshots.map((file, index) => (
                                            <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground dark:border-white/10 dark:bg-black/20 dark:text-neutral-300">
                                                <span className="truncate pr-2">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setReportScreenshots((previous) => previous.filter((_, i) => i !== index))}
                                                    className="rounded px-2 py-1 text-red-500 hover:bg-red-500/10"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 dark:text-neutral-500">
                                    <span className="h-1 w-3 rounded-full bg-primary" />
                                    Additional Context
                                </label>
                                <textarea
                                    value={reportDetails}
                                    onChange={(event) => setReportDetails(event.target.value)}
                                    rows={4}
                                    placeholder="Tell us more about what happened..."
                                    className="w-full resize-none rounded-2xl border border-border bg-background/50 px-5 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none dark:border-white/10 dark:bg-black/20 dark:text-white"
                                />
                            </div>

                            {reportWizardError && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                                    <AlertTriangle className="w-4 h-4" />
                                    {reportWizardError}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 p-6 dark:border-white/5 dark:bg-black/20">
                            <button
                                onClick={() => setShowReportWizard(false)}
                                disabled={isSubmittingReport}
                                className="px-6 py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-all hover:bg-muted rounded-xl dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void submitUserReport()}
                                disabled={
                                    isSubmittingReport ||
                                    (reportCategory === "profanity" &&
                                        reportExactMessage.trim().length < 3 &&
                                        !reportMessageId)
                                }
                                className="group relative flex items-center gap-2 overflow-hidden px-8 py-3 bg-red-500 text-white font-black text-sm rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_10px_25px_-10px_rgba(239,44,44,0.4)]"
                            >
                                <span className="relative z-10">{isSubmittingReport ? "Sending Report..." : "Submit Report"}</span>
                                {!isSubmittingReport && <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
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
