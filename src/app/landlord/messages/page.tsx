"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Paperclip,
    ShieldCheck,
    CheckCircle2,
    CalendarClock,
    Wrench,
    FileText,
    AlertTriangle,
    Receipt,
    HandCoins,
    Wallet,
    X,
    Folder,
    ArrowLeft,
    Hammer,
    Bell,
    Check,
    CheckCheck,
    Clock3,
    ChevronRight,
    ChevronLeft,
    Search,
    CreditCard,
    File,
    Download,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { ContactList } from "@/components/landlord/messages/ContactList";
import { ChatHeader } from "@/components/landlord/messages/ChatHeader";
import { MessageList } from "@/components/landlord/messages/MessageList";
import { MessageComposer } from "@/components/landlord/messages/MessageComposer";
import { 
    ContactItem as ContactItemType, 
    UiMessage as UiMessageType, 
    PendingAttachment as PendingAttachmentType,
    ConfirmActionType,
    SharedFileItem,
    QuickAction
} from "@/components/landlord/messages/types";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";
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
} from "../../../lib/messages/client";
import { CashPaymentInterface } from "../../../components/landlord/CashPaymentInterface";
import { InvoiceModal } from "../../../components/landlord/invoices/InvoiceModal";
import { redactMessageForSend } from "../../../lib/messages/redaction-client";

const MESSAGE_CACHE_KEY_PREFIX = "ireside:landlord:messages-cache";
const CONVERSATIONS_CACHE_KEY_PREFIX = "ireside:landlord:conversations-cache";
const CONVERSATIONS_CACHE_TTL_MS = 60_000;

const LANDLORD_QUICK_ACTIONS_BY_RELATIONSHIP: Record<"tenant_landlord" | "prospective" | "stranger", QuickAction[]> = {
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

const redactionStrength = (message: UiMessageType) => {
    const text = (message.redactedContent ?? message.content ?? "").toString();
    return (text.match(/\*{5}/g) ?? []).length;
};

const redactionCategoryRank = (category: UiMessageType["redactionCategory"]) => {
    switch (category) {
        case "phishing": return 4;
        case "spam": return 3;
        case "profanity": return 2;
        case "credentials": return 1;
        default: return 0;
    }
};

const resolveStrictCategory = (
    previous?: UiMessageType["redactionCategory"],
    incoming?: UiMessageType["redactionCategory"]
): UiMessageType["redactionCategory"] => {
    const prev = previous ?? "none";
    const next = incoming ?? "none";
    return redactionCategoryRank(prev) >= redactionCategoryRank(next) ? prev : next;
};

const resolveDisclosureAllowed = (
    category: UiMessageType["redactionCategory"],
    previous?: boolean,
    incoming?: boolean
) => {
    if (category !== "credentials") return false;
    const prev = typeof previous === "boolean" ? previous : true;
    const next = typeof incoming === "boolean" ? incoming : true;
    return prev && next;
};

const mergeCensorshipState = (incoming: UiMessageType, previous?: UiMessageType): UiMessageType => {
    if (!previous) return incoming;
    const strictCategory = resolveStrictCategory(previous.redactionCategory, incoming.redactionCategory);
    const strictDisclosureAllowed = resolveDisclosureAllowed(strictCategory, previous.disclosureAllowed, incoming.disclosureAllowed);

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

export default function MessagesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const supabase = useMemo(() => createSupabaseClient(), []);
    const conversationFromUrl = searchParams.get("conversation")?.trim() || null;
    const panelFromUrl = searchParams.get("panel")?.trim() || null;

    const [contacts, setContacts] = useState<ContactItemType[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(() => conversationFromUrl);
    const [messagesState, setMessagesState] = useState<UiMessageType[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState("media");
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
    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachmentType[]>([]);
    const isUploadingFile = pendingAttachments.some(a => a.status === 'uploading');
    const [fileUploadError, setFileUploadError] = useState<string | null>(null);
    const [isComposerDragOver, setIsComposerDragOver] = useState(false);
    const [isGlobalFileDrag, setIsGlobalFileDrag] = useState(false);
    const [previewImages, setPreviewImages] = useState<{ url: string; id: string }[]>([]);
    const [previewImageIndex, setPreviewImageIndex] = useState(0);
    const [pendingConfirmAction, setPendingConfirmAction] = useState<ConfirmActionType | null>(null);
    const [isSubmittingConfirmAction, setIsSubmittingConfirmAction] = useState(false);
    const [showReportWizard, setShowReportWizard] = useState(false);
    const [reportCategory, setReportCategory] = useState("spam");
    const [reportDetails, setReportDetails] = useState("");
    const [reportExactMessage, setReportExactMessage] = useState("");
    const [reportMessageId, setReportMessageId] = useState("");
    const [reportScreenshots, setReportScreenshots] = useState<File[]>([]);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportWizardError, setReportWizardError] = useState<string | null>(null);
    const [activeF2FPayment, setActiveF2FPayment] = useState<UiMessageType | null>(null);
    const [isF2FInterfaceOpen, setIsF2FInterfaceOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    const activeChannelRef = useRef<RealtimeChannel | null>(null);
    const handleDownloadFile = async (url: string, fileName: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    const typingStopTimeoutRef = useRef<number | null>(null);
    
    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Derived Shared Files
    const sharedFiles = useMemo(() => {
        const files: SharedFileItem[] = [];
        messagesState.forEach(msg => {
            if (msg.fileUrl) {
                const isMedia = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/i.test(msg.fileUrl) || 
                                msg.fileMimeType?.startsWith('image/') || 
                                msg.fileMimeType?.startsWith('video/');
                files.push({
                    id: msg.id,
                    url: msg.fileUrl,
                    name: msg.fileName || "Unnamed file",
                    size: msg.fileSize || 0,
                    mimeType: msg.fileMimeType || "application/octet-stream",
                    createdAt: msg.createdAt || msg.timestamp,
                    timestampLabel: new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                    isMedia: Boolean(isMedia)
                });
            }
            if (msg.attachments) {
                msg.attachments.forEach(att => {
                    if (att.fileUrl) {
                        const isMedia = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/i.test(att.fileUrl) || 
                                        att.fileMimeType?.startsWith('image/') || 
                                        att.fileMimeType?.startsWith('video/');
                        files.push({
                            id: att.id,
                            url: att.fileUrl,
                            name: att.fileName || "Unnamed file",
                            size: att.fileSize || 0,
                            mimeType: att.fileMimeType || "application/octet-stream",
                            createdAt: att.createdAt || att.timestamp,
                            timestampLabel: new Date(att.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                            isMedia: Boolean(isMedia)
                        });
                    }
                });
            }
        });

        return files
            .filter(f => {
                if (fileFilter === 'all') return true;
                if (fileFilter === 'media') return f.isMedia;
                if (fileFilter === 'files') return !f.isMedia;
                return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [messagesState, fileFilter]);

    const remoteTypingTimeoutRef = useRef<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const reportFileInputRef = useRef<HTMLInputElement | null>(null);
    const copiedMessageTimeoutRef = useRef<number | null>(null);
    const dragDepthRef = useRef(0);
    const messagesCacheRef = useRef<Map<string, UiMessageType[]>>(new Map());
    const paymentHistoryCacheRef = useRef<Map<string, { payments: PaymentHistoryEntry[]; totalPaid: number }>>(new Map());
    const activeConversationIdRef = useRef<string | null>(conversationFromUrl);
    const conversationFromUrlRef = useRef<string | null>(conversationFromUrl);
    const previousConversationFromUrlRef = useRef<string | null>(conversationFromUrl);
    const shouldStickToBottomRef = useRef(true);
    const shouldScrollOnConversationOpenRef = useRef(true);

    useEffect(() => {
        return () => {
            pendingAttachments.forEach(att => {
                if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
            });
        };
    }, [pendingAttachments]);

    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    useEffect(() => {
        conversationFromUrlRef.current = conversationFromUrl;
    }, [conversationFromUrl]);

    useEffect(() => {
        shouldStickToBottomRef.current = true;
        shouldScrollOnConversationOpenRef.current = true;
    }, [activeConversationId]);

    useEffect(() => {
        const previousConversationFromUrl = previousConversationFromUrlRef.current;
        previousConversationFromUrlRef.current = conversationFromUrl;
        if (previousConversationFromUrl === conversationFromUrl) return;
        if (!conversationFromUrl || conversationFromUrl === activeConversationId) return;
        if (!contacts.some((contact) => contact.id === conversationFromUrl)) return;
        setActiveConversationId(conversationFromUrl);
    }, [activeConversationId, contacts, conversationFromUrl]);

    useEffect(() => {
        if (panelFromUrl !== "files") return;
        if (!conversationFromUrl || activeConversationId !== conversationFromUrl) return;
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
        if (currentConversationInUrl === nextConversationForUrl) return;
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
            const parsed = JSON.parse(raw) as Record<string, UiMessageType[]>;
            const entries = Object.entries(parsed).filter((entry): entry is [string, UiMessageType[]] => Array.isArray(entry[1]));
            messagesCacheRef.current = new Map(entries);
        } catch {
            messagesCacheRef.current.clear();
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        try {
            const raw = sessionStorage.getItem(`${CONVERSATIONS_CACHE_KEY_PREFIX}:${user.id}`);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { cachedAt?: number; contacts?: ContactItemType[] };
            if (!Array.isArray(parsed.contacts)) return;
            if (typeof parsed.cachedAt === "number" && Date.now() - parsed.cachedAt > CONVERSATIONS_CACHE_TTL_MS) return;
            const cachedConversations = parsed.contacts.filter((contact): contact is ContactItemType => Boolean(contact && typeof contact === "object" && typeof contact.id === "string"));
            setContacts(cachedConversations);
            setIsSidebarLoading(false);
            setActiveConversationId((current) => {
                if (current && cachedConversations.some((contact) => contact.id === current)) return current;
                if (conversationFromUrl && cachedConversations.some((contact) => contact.id === conversationFromUrl)) return conversationFromUrl;
                return cachedConversations[0]?.id ?? null;
            });
        } catch { }
    }, [conversationFromUrl, user?.id]);

    const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
        if (!messagesEndRef.current) return;
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }, []);

    const updateShouldStickToBottom = useCallback(() => {
        const container = messagesScrollRef.current;
        if (!container) return;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottomRef.current = distanceFromBottom <= 96;
    }, []);

    const visibleContacts = useMemo(() => contacts.filter((contact) => !contact.isArchived && !contact.isBlocked), [contacts]);
    const activeContact = useMemo(() => visibleContacts.find((contact) => contact.id === activeConversationId) ?? null, [visibleContacts, activeConversationId]);
    const handleStartConversation = async (targetUserId: string) => {
        try {
            const conversationId = await createOrGetDirectConversation(targetUserId);
            await refreshConversations();
            setActiveConversationId(conversationId);
            setSearchQuery("");
            setUserSearchResults([]);
            setUserSearchError(null);
        } catch (error) {
            setUserSearchError(error instanceof Error ? error.message : "Failed to start conversation.");
        }
    };

    const handleMessageInputChange = (val: string) => {
        setMessageInput(val);
        if (activeChannelRef.current && user?.id && activeConversationId) {
            activeChannelRef.current.send({
                type: "broadcast",
                event: "typing",
                payload: { conversationId: activeConversationId, userId: user.id, isTyping: val.length > 0 }
            });

            if (typingStopTimeoutRef.current) window.clearTimeout(typingStopTimeoutRef.current);
            typingStopTimeoutRef.current = window.setTimeout(() => {
                if (activeChannelRef.current) {
                    activeChannelRef.current.send({
                        type: "broadcast",
                        event: "typing",
                        payload: { conversationId: activeConversationId, userId: user.id, isTyping: false }
                    });
                }
                typingStopTimeoutRef.current = null;
            }, 2000);
        }
    };

    const activeRelationshipStatus = activeContact?.relationshipStatus ?? "stranger";
    const activeQuickActions = LANDLORD_QUICK_ACTIONS_BY_RELATIONSHIP[activeRelationshipStatus];
    const canShowPaymentHistory = activeRelationshipStatus === "tenant_landlord" && (activeContact?.hasPaymentHistory ?? false);

    const displayContact = activeContact ?? {
        id: "",
        participantUserId: null,
        name: "No conversation selected",
        role: null,
        unit: "",
        unread: 0,
        lastContact: "",
        avatarUrl: null,
        initials: "C",
        avatarBgColor: null,
        relationshipStatus: "stranger",
        hasPaymentHistory: false,
        isArchived: false,
        isBlocked: false,
    };

    const mapConversationToContact = (conversation: ConversationSummary): ContactItemType => {
        const other = conversation.otherParticipants[0];
        return {
            id: conversation.id,
            participantUserId: other?.id ?? null,
            name: other?.fullName ?? "Conversation",
            role: other?.role ?? null,
            unit: other?.role === "tenant" ? "Tenant" : other?.role === "landlord" ? "Landlord" : "Participant",
            unread: conversation.unreadCount,
            lastContact: conversation.lastMessage ? new Date(conversation.lastMessage.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No messages yet",
            avatarUrl: other?.avatarUrl || null,
            initials: (other?.fullName ?? "C").split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join(""),
            avatarBgColor: other?.avatarBgColor || null,
            relationshipStatus: conversation.relationshipStatus,
            hasPaymentHistory: conversation.hasPaymentHistory,
            isArchived: conversation.isArchived,
            isBlocked: conversation.isBlocked,
        };
    };

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
            if (error) setPaymentHistoryError(error);
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
        if (!showInfoSidebar && !showPaymentHistoryModal) return;
        void loadPaymentHistory(activeConversationId);
    }, [activeConversationId, canShowPaymentHistory, loadPaymentHistory, showInfoSidebar, showPaymentHistoryModal]);

    useEffect(() => {
        if (!activeConversationId || isSidebarLoading) return;
        const stillVisible = visibleContacts.some((contact) => contact.id === activeConversationId);
        if (stillVisible) return;
        setShowInfoSidebar(false);
        setShowFilesSidebar(false);
        setActiveConversationId(visibleContacts[0]?.id ?? null);
    }, [activeConversationId, isSidebarLoading, visibleContacts]);

    const updateActiveContactActionState = useCallback((nextState: { archived?: boolean; blocked?: boolean }) => {
        if (!activeConversationId) return;
        setContacts((prev) => prev.map((contact) => contact.id === activeConversationId ? { ...contact, isArchived: nextState.archived ?? contact.isArchived, isBlocked: nextState.blocked ?? contact.isBlocked } : contact));
    }, [activeConversationId]);

    const submitMessageUserAction = useCallback(async (action: "archive" | "block") => {
        if (!activeContact?.participantUserId) return;
        setIsSubmittingConfirmAction(true);
        setUserSearchError(null);
        try {
            const response = await fetch(`/api/messages/users/${activeContact.participantUserId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string; state?: { archived?: boolean; blocked?: boolean } } | null;
            if (!response.ok) throw new Error(payload?.error ?? "Failed to update action.");
            updateActiveContactActionState({ archived: Boolean(payload?.state?.archived), blocked: Boolean(payload?.state?.blocked) });
            await refreshConversations();
            setPendingConfirmAction(null);
        } catch (error) {
            setUserSearchError(error instanceof Error ? error.message : "Failed to update action.");
        } finally {
            setIsSubmittingConfirmAction(false);
        }
    }, [activeContact?.participantUserId, refreshConversations, updateActiveContactActionState]);

    const submitUserReport = useCallback(async () => {
        if (!activeContact?.participantUserId || !activeConversationId) return;
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
            const response = await fetch(`/api/messages/users/${activeContact.participantUserId}/reports`, { method: "POST", body: formData });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(payload?.error ?? "Failed to submit report.");
            setShowReportWizard(false);
            setReportCategory("spam");
            setReportDetails("");
            setReportExactMessage("");
            setReportMessageId("");
            setReportScreenshots([]);
        } catch (error) {
            setReportWizardError(error instanceof Error ? error.message : "Failed to submit report.");
        } finally {
            setIsSubmittingReport(false);
        }
    }, [activeContact?.participantUserId, activeConversationId, reportCategory, reportDetails, reportExactMessage, reportMessageId, reportScreenshots]);

    const openReportWizard = useCallback(() => {
        setReportWizardError(null);
        setReportMessageId("");
        setShowReportWizard(true);
    }, []);

    const mapMessageToUi = (message: ConversationMessage): UiMessageType => {
        const metadata = (message.metadata && typeof message.metadata === "object") ? (message.metadata as Record<string, unknown>) : null;
        const isOwn = user?.id === message.senderId;
        const redactedContent = typeof metadata?.redactedContent === "string" ? metadata.redactedContent : message.content;
        const isRedacted = Boolean(metadata?.isRedacted);
        const isConfirmedDisclosed = metadata?.isConfirmedDisclosed === true;
        const isPhishing = Boolean(metadata?.isPhishing);
        const explicitCategory = metadata?.redactionCategory as UiMessageType["redactionCategory"];
        const metadataDisclosureAllowed = typeof metadata?.disclosureAllowed === "boolean" ? metadata.disclosureAllowed : undefined;
        const redactionCategory = explicitCategory ?? (isPhishing ? "phishing" : isRedacted ? (metadataDisclosureAllowed ? "credentials" : "profanity") : "none");
        const disclosureAllowed = typeof metadata?.disclosureAllowed === "boolean" ? metadata.disclosureAllowed : redactionCategory === "credentials";
        const systemType = typeof metadata?.systemType === "string" ? metadata.systemType : (typeof metadata?.event === "string" ? metadata.event : undefined);
        const workflowStatus = typeof metadata?.workflowStatus === "string" ? metadata.workflowStatus : (typeof metadata?.event === "string" ? metadata.event : undefined);

        let content = message.content;
        if (message.type === "system") {
            if (systemType === "awaiting_in_person") content = "A face-to-face cash payment has been initiated. The landlord can now verify and confirm the receipt of funds using the interface below.";
            else if (systemType === "reminder_sent") content = "A payment reminder has been sent for this invoice. You can settle it quickly using the button below.";
            else if (systemType === "in_person_intent_expired") content = "The face-to-face payment request has expired. The invoice status has been reverted to pending.";
            else if (systemType === "landlord_review") {
                if (workflowStatus === "rejected") content = `The payment request has been rejected. Reason: ${typeof metadata?.rejectionReason === "string" ? metadata.rejectionReason : "No reason provided."}`;
                else if (workflowStatus === "confirmed" || workflowStatus === "receipted") content = "The payment has been confirmed.";
            }
        }

        return {
            id: message.id,
            type: message.type === "system" ? "system" : (isOwn ? "landlord" : "tenant"),
            messageType: message.type as "text" | "system" | "image" | "file",
            content,
            redactedContent,
            timestamp: new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
            createdAt: message.createdAt,
            isRedacted,
            isConfirmedDisclosed,
            systemType,
            paymentAmount: typeof metadata?.paymentAmount === "string" ? metadata.paymentAmount : undefined,
            receiptImg: typeof metadata?.receiptImg === "string" ? metadata.receiptImg : undefined,
            fileUrl: typeof metadata?.fileUrl === "string" ? metadata.fileUrl : undefined,
            fileName: typeof metadata?.fileName === "string" ? metadata.fileName : undefined,
            filePath: typeof metadata?.filePath === "string" ? metadata.filePath : undefined,
            fileMimeType: typeof metadata?.mimeType === "string" ? metadata.mimeType : undefined,
            fileSize: typeof metadata?.fileSize === "number" ? metadata.fileSize : undefined,
            isPhishing,
            redactionCategory,
            disclosureAllowed,
            status: isOwn ? (message.readAt ? "seen" : "delivered") : undefined,
            workflowStatus,
            expiresAt: typeof metadata?.expiresAt === "string" ? metadata.expiresAt : undefined,
            landlordTransactionPath: typeof metadata?.landlordTransactionPath === "string" ? metadata.landlordTransactionPath : undefined,
            paymentId: typeof metadata?.paymentId === "string" ? metadata.paymentId : undefined,
            invoiceId: (typeof metadata?.invoiceId === "string" ? metadata.invoiceId : (typeof metadata?.paymentId === "string" ? metadata.paymentId : undefined)),
            invoiceNumber: typeof metadata?.invoiceNumber === "string" ? metadata.invoiceNumber : undefined,
            tenantName: typeof metadata?.tenantName === "string" ? metadata.tenantName : undefined,
            landlordName: typeof metadata?.landlordName === "string" ? metadata.landlordName : undefined,
            propertyName: typeof metadata?.propertyName === "string" ? metadata.propertyName : undefined,
            unit: typeof metadata?.unit === "string" ? metadata.unit : undefined,
            amount: typeof metadata?.amount === "string" ? metadata.amount : (typeof metadata?.paymentAmount === "string" ? metadata.paymentAmount : undefined),
            description: typeof metadata?.description === "string" ? metadata.description : undefined,
        };
    };

    async function refreshConversations() {
        if (!user) return;
        try {
            const { data: list, error } = await fetchConversations();
            setConversationsError(error);
            const mapped = list.map(mapConversationToContact);
            setContacts(mapped);
            if (user.id) {
                try { sessionStorage.setItem(`${CONVERSATIONS_CACHE_KEY_PREFIX}:${user.id}`, JSON.stringify({ cachedAt: Date.now(), contacts: mapped })); } catch { }
            }
            setActiveConversationId((current) => {
                if (current && mapped.some((contact) => contact.id === current)) return current;
                if (conversationFromUrlRef.current && mapped.some((contact) => contact.id === conversationFromUrlRef.current)) return conversationFromUrlRef.current;
                return mapped[0]?.id ?? null;
            });
        } finally { setIsSidebarLoading(false); }
    }

    const refreshMessages = async (conversationId: string) => {
        const { data: list, error } = await fetchConversationMessages(conversationId, 200);
        setMessagesError(error);
        const mapped: UiMessageType[] = list.map(mapMessageToUi);
        messagesCacheRef.current.set(conversationId, mapped);
        if (user?.id) {
            try { sessionStorage.setItem(`${MESSAGE_CACHE_KEY_PREFIX}:${user.id}`, JSON.stringify(Object.fromEntries(messagesCacheRef.current.entries()))); } catch { }
        }
        if (activeConversationIdRef.current === conversationId) {
            setMessagesState((prev) => {
                const previousById = new Map(prev.map((m) => [m.id, m]));
                const stabilized = mapped.map((sm) => mergeCensorshipState(sm, previousById.get(sm.id)));
                const optimistic = prev.filter((msg) => msg.type === "landlord" && (msg.status === "sending" || msg.status === "sent") && !stabilized.some((sm) => sm.id === msg.id));
                return [...stabilized, ...optimistic];
            });
        }
        if (!error) await markConversationAsRead(conversationId);
    };

    const handleConfirmF2FPayment = async (paymentId: string) => {
        setIsF2FInterfaceOpen(false);
        setSelectedInvoiceId(paymentId);
    };

    const handleDownloadImage = async (elementId: string, filename: string) => {
        try {
            setIsDownloading(true);
            const domtoimage = (await import('dom-to-image')).default;
            const element = document.getElementById(elementId);
            if (!element) return;
            await new Promise(resolve => setTimeout(resolve, 100));
            const isReceipt = elementId.startsWith('receipt-');
            const dataUrl = await domtoimage.toPng(element, { 
                bgcolor: isReceipt ? '#ffffff' : '#0a0a0a', 
                height: element.offsetHeight, 
                width: element.offsetWidth,
                filter: (node: Node) => {
                    if (node instanceof HTMLElement && node.id?.startsWith('receipt-actions-')) {
                        return false;
                    }
                    return true;
                }
            });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) { console.error("Failed to generate image", error); } finally { setIsDownloading(false); }
    };

    const clearPendingAttachments = () => {
        setPendingAttachments((current) => {
            current.forEach((att) => { if (att.previewUrl) URL.revokeObjectURL(att.previewUrl); });
            return [];
        });
    };

    const removePendingAttachment = (id: string) => {
        setPendingAttachments((current) => {
            const match = current.find((a) => a.id === id);
            if (match?.previewUrl) URL.revokeObjectURL(match.previewUrl);
            return current.filter((a) => a.id !== id);
        });
    };

    const queueSelectedFiles = (files: File[]) => {
        if (!activeConversationId) { setFileUploadError("Select a conversation first."); return; }
        setFileUploadError(null);
        
        files.forEach(file => {
            const id = `pending-${Date.now()}-${Math.random()}`;
            const isImage = file.type.startsWith("image/");
            const previewUrl = isImage ? URL.createObjectURL(file) : null;
            
            const newAttachment: PendingAttachmentType = { 
                id, 
                file, 
                isImage, 
                previewUrl, 
                status: 'uploading',
                progress: 0
            };
            
            setPendingAttachments(current => [...current, newAttachment]);
            
            // Start upload immediately
            void (async () => {
                try {
                    const result = await uploadConversationFile(
                        activeConversationId, 
                        file, 
                        (p) => {
                            setPendingAttachments(curr => curr.map(a => a.id === id ? { ...a, progress: p } : a));
                        },
                        true // noMessage = true
                    );
                    
                    setPendingAttachments(curr => curr.map(a => a.id === id ? { 
                        ...a, 
                        status: 'uploaded', 
                        url: result.file.url, 
                        path: result.file.path,
                        progress: 100 
                    } : a));
                } catch (err) {
                    setPendingAttachments(curr => curr.map(a => a.id === id ? { ...a, status: 'error' } : a));
                    setFileUploadError(err instanceof Error ? err.message : "Upload failed");
                }
            })();
        });
    };

    const handleSendMessage = async () => {
        const textMessage = messageInput.trim();
        const hasText = textMessage.length > 0;
        const hasAttachment = pendingAttachments.length > 0;
        if ((!hasText && !hasAttachment) || !activeConversationId) return;
        shouldStickToBottomRef.current = true;

        if (activeChannelRef.current && user?.id) {
            void activeChannelRef.current.send({ type: "broadcast", event: "typing", payload: { conversationId: activeConversationId, userId: user.id, isTyping: false } });
        }

        if (hasText) {
            const optimisticId = `local-${Date.now()}`;
            const optimisticTimestamp = new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
            setMessageInput("");
            setMessagesState((prev) => [...prev, { id: optimisticId, type: "landlord", messageType: "text", content: textMessage, redactedContent: textMessage, timestamp: optimisticTimestamp, createdAt: new Date().toISOString(), isRedacted: false, isConfirmedDisclosed: false, status: "sending" }]);
            const moderation = await redactMessageForSend(textMessage);
            try {
                const created = await sendConversationMessage(activeConversationId, textMessage, { isRedacted: moderation.isSensitive, redactedContent: moderation.redactedMessage, isConfirmedDisclosed: false, isPhishing: moderation.isPhishing, redactionCategory: moderation.redactionCategory, disclosureAllowed: moderation.disclosureAllowed });
                const mapped = mapMessageToUi({ ...created, sender: null });
                setMessagesState((prev) => prev.map((msg) => msg.id === optimisticId ? { ...mapped, status: "sent" } : msg));
                window.setTimeout(() => setMessagesState((prev) => prev.map((msg) => msg.id === created.id && msg.status === "sent" ? { ...msg, status: "delivered" } : msg)), 350);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to send.";
                setMessagesError(message);
                setMessagesState((prev) => prev.map((msg) => msg.id === optimisticId ? { ...msg, status: "failed" } : msg));
            }
        }

        const uploaded = pendingAttachments.filter(a => a.status === 'uploaded');
        const isStillUploading = pendingAttachments.some(a => a.status === 'uploading');
        
        if (isStillUploading) {
            setMessagesError("Please wait for files to finish uploading.");
            return;
        }

        if (uploaded.length > 0) {
            const images = uploaded.filter(a => a.isImage);
            const otherFiles = uploaded.filter(a => !a.isImage);
            
            // Send images as album if 3+, or individual
            if (images.length >= 3) {
                const attachments = images.map(a => ({
                    id: a.id,
                    type: "landlord",
                    messageType: "image",
                    fileUrl: a.url,
                    filePath: a.path,
                    fileName: a.file.name,
                    fileSize: a.file.size,
                    fileMimeType: a.file.type,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: new Date().toISOString()
                }));

                try {
                    const created = await sendConversationMessage(
                        activeConversationId, 
                        messageInput.trim(), // Use input as caption
                        { attachments, isAlbum: true },
                        "image"
                    );
                    const mapped = mapMessageToUi({ ...created, sender: null });
                    setMessagesState((prev) => [...prev, { ...mapped, status: "sent" }]);
                    setMessageInput("");
                    clearPendingAttachments();
                } catch (error) { setMessagesError("Failed to send album."); }
            } else {
                // Individual uploads already happened? No, we used noMessage=true.
                // We need to send messages for these files now.
                for (const att of uploaded) {
                    try {
                        const created = await sendConversationMessage(
                            activeConversationId,
                            att.file.name,
                            { 
                                fileName: att.file.name, 
                                fileSize: att.file.size, 
                                mimeType: att.file.type, 
                                filePath: att.path,
                                fileUrl: att.url 
                            },
                            att.isImage ? "image" : "file"
                        );
                        const mapped = mapMessageToUi({ ...created, sender: null });
                        setMessagesState((prev) => [...prev, { ...mapped, status: "sent" }]);
                    } catch (err) { setMessagesError(`Failed to send ${att.file.name}`); }
                }
                clearPendingAttachments();
                if (hasText) {
                    // Send text message separately if not already sent
                    // (Actually we might want to skip text if it was used as caption, 
                    // but here text is separate from individual images in current logic)
                }
            }
        }
        void refreshConversations();
        void refreshMessages(activeConversationId);
    };

    const handleFileUpload = (files: File[]) => queueSelectedFiles(files);

    const handleQuickAction = (key: string) => {
        switch (key) {
            case "request-payment": setMessageInput("Friendly reminder: please settle your outstanding rent balance."); break;
            case "schedule-repair": router.push("/landlord/maintenance"); break;
            case "view-lease": router.push("/landlord/tenants"); break;
            case "send-notice": setMessageInput("Notice: "); break;
            case "review-application": router.push("/landlord/applications"); break;
            case "schedule-viewing": setMessageInput("Share your preferred dates for viewing."); break;
            case "share-requirements": setMessageInput("Please submit required documents for screening."); break;
            case "share-listing": router.push("/landlord/listings"); break;
            case "view-profile": if (activeContact?.participantUserId) router.push(`/visitor/${activeContact.participantUserId}`); break;
            case "archive-chat": setPendingConfirmAction("archive"); break;
            case "report-user": openReportWizard(); break;
            case "block-contact": setPendingConfirmAction("block"); break;
        }
    };

    useEffect(() => { if (!user) return; refreshConversations(); }, [user]);

    useEffect(() => {
        if (!activeConversationId) { setMessagesState([]); setIsOtherUserTyping(false); setIsMessagesLoading(false); return; }
        if (!user?.id) { setIsMessagesLoading(true); return; }
        const cached = messagesCacheRef.current.get(activeConversationId);
        if (cached) { setMessagesState(cached); setIsOtherUserTyping(false); setIsMessagesLoading(false); return; }
        setMessagesState([]); setIsOtherUserTyping(false); setIsMessagesLoading(true);
        let cancelled = false;
        void (async () => { await refreshMessages(activeConversationId); if (!cancelled) setIsMessagesLoading(false); })();
        return () => { cancelled = true; };
    }, [activeConversationId, user?.id]);

    useEffect(() => {
        if (!activeConversationId) return;
        const channel = supabase.channel(`messages-${activeConversationId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversationId}` }, async () => { await refreshMessages(activeConversationId); await refreshConversations(); })
            .on("broadcast", { event: "typing" }, ({ payload }) => {
                const candidate = payload as { conversationId?: string; userId?: string; isTyping?: boolean };
                if (candidate.conversationId !== activeConversationId || !candidate.userId || candidate.userId === user?.id) return;
                setIsOtherUserTyping(Boolean(candidate.isTyping));
                if (remoteTypingTimeoutRef.current) window.clearTimeout(remoteTypingTimeoutRef.current);
                if (candidate.isTyping) remoteTypingTimeoutRef.current = window.setTimeout(() => { setIsOtherUserTyping(false); remoteTypingTimeoutRef.current = null; }, 1800);
            })
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const otherUserId = activeContact?.participantUserId;
                if (!otherUserId) return;
                
                const isOnline = (Object.values(state).flat() as any[]).some((p: { userId?: string }) => p.userId === otherUserId);
                setContacts(prev => {
                    const current = prev.find(c => c.id === activeConversationId);
                    if (current && current.isOnline === isOnline) return prev;
                    return prev.map(c => 
                        c.id === activeConversationId ? { ...c, isOnline } : c
                    );
                });
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED" && user?.id) {
                    await channel.track({ userId: user.id, onlineAt: new Date().toISOString() });
                }
            });
        activeChannelRef.current = channel;
        return () => { activeChannelRef.current = null; supabase.removeChannel(channel); };
    }, [activeConversationId, supabase, user?.id, activeContact?.participantUserId]);

    useEffect(() => {
        if (!shouldStickToBottomRef.current && !shouldScrollOnConversationOpenRef.current) return;
        const behavior: ScrollBehavior = shouldScrollOnConversationOpenRef.current ? "auto" : "smooth";
        window.requestAnimationFrame(() => scrollToLatest(behavior));
        window.setTimeout(() => { scrollToLatest(behavior); shouldScrollOnConversationOpenRef.current = false; }, 80);
    }, [messagesState, isOtherUserTyping, activeConversationId, isMessagesLoading, scrollToLatest]);

    useEffect(() => {
        if (!user) return;
        const intervalId = window.setInterval(() => {
            if (document.visibilityState !== "visible") return;
            void refreshConversations();
            if (activeConversationId) void refreshMessages(activeConversationId);
        }, 5000);
        return () => window.clearInterval(intervalId);
    }, [user, activeConversationId]);

    useEffect(() => {
        const query = searchQuery.trim();
        if (query.length < 2) { setUserSearchResults([]); setUserSearchError(null); setIsSearchingUsers(false); return; }
        let cancelled = false;
        const timeout = setTimeout(async () => {
            setIsSearchingUsers(true);
            const { data, error } = await searchMessageUsers(query, 8);
            if (cancelled) return;
            setUserSearchResults(data); setUserSearchError(error); setIsSearchingUsers(false);
        }, 250);
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [searchQuery]);

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

            <ContactList 
                contacts={visibleContacts}
                activeConversationId={activeConversationId}
                setActiveConversationId={setActiveConversationId}
                isSidebarLoading={isSidebarLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userSearchResults={userSearchResults}
                isSearchingUsers={isSearchingUsers}
                userSearchError={userSearchError}
                handleStartConversation={handleStartConversation}
                conversationsError={conversationsError}
                setConversationsError={setConversationsError}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-[2.5rem] border border-border bg-surface-1 shadow-sm">
                <ChatHeader 
                    contact={displayContact}
                    showFilesSidebar={showFilesSidebar}
                    setShowFilesSidebar={setShowFilesSidebar}
                    showInfoSidebar={showInfoSidebar}
                    setShowInfoSidebar={setShowInfoSidebar}
                    openReportWizard={openReportWizard}
                />

                <MessageList 
                    messages={messagesState}
                    isMessagesLoading={isMessagesLoading}
                    onConfirmPayment={handleConfirmF2FPayment}
                    onDownloadImage={handleDownloadImage}
                    onOpenF2F={(msg) => { setActiveF2FPayment(msg); setIsF2FInterfaceOpen(true); }}
                    onImageClick={(images, index) => { setPreviewImages(images); setPreviewImageIndex(index); }}
                    isDownloading={isDownloading}
                    updateShouldStickToBottom={updateShouldStickToBottom}
                    messagesScrollRef={messagesScrollRef}
                    messagesEndRef={messagesEndRef}
                />

                <MessageComposer 
                    messageInput={messageInput}
                    setMessageInput={handleMessageInputChange}
                    onSendMessage={handleSendMessage}
                    onFileUpload={handleFileUpload}
                    pendingAttachments={pendingAttachments}
                    removePendingAttachment={removePendingAttachment}
                    isUploadingFile={isUploadingFile}
                    isOtherUserTyping={isOtherUserTyping}
                    otherUserName={displayContact.name}
                />
            </div>

            <AnimatePresence>
                {(showInfoSidebar || showFilesSidebar) && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-80 shrink-0 overflow-hidden rounded-[2rem] border border-border bg-surface-1 shadow-sm lg:w-96">
                        {showInfoSidebar ? (
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between border-b border-divider p-6">
                                    <h3 className="text-lg font-bold text-high">Conversation Info</h3>
                                    <button onClick={() => setShowInfoSidebar(false)} className="rounded-lg p-2 hover:bg-surface-2 transition-colors"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar-premium">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-24 w-24 rounded-full border-4 border-surface-2 overflow-hidden mb-4 shadow-xl" style={{ backgroundColor: displayContact.avatarBgColor || 'var(--surface-3)' }}>
                                            {displayContact.avatarUrl ? <img src={displayContact.avatarUrl} alt={displayContact.name} className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-high">{displayContact.initials}</span>}
                                        </div>
                                        <h4 className="text-xl font-bold text-high">{displayContact.name}</h4>
                                        <div className="mt-2"><RoleBadge role={displayContact.role as BadgeRole} /></div>
                                        <p className="mt-2 text-sm font-medium text-medium">{displayContact.unit}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {activeQuickActions.map((action) => (
                                            <button key={action.key} onClick={() => handleQuickAction(action.key)} className="flex flex-col items-center gap-2 rounded-2xl border border-divider bg-surface-2 p-4 transition-all hover:bg-surface-3 hover:scale-[1.02] active:scale-95 group">
                                                <div className={cn("p-2.5 rounded-xl transition-colors", action.iconContainerClassName)}><action.icon className={cn("h-5 w-5", action.iconClassName)} /></div>
                                                <div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest text-high">{action.labelTop}</p><p className="text-[10px] font-medium text-medium">{action.labelBottom}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                    {canShowPaymentHistory && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between"><h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Payment History</h5><span className="text-[10px] font-bold text-primary">Total: ₱{paymentHistoryTotal}</span></div>
                                            <div className="space-y-2">{paymentHistoryLoading ? <div className="h-20 w-full animate-pulse rounded-2xl bg-surface-2" /> : paymentHistory.length === 0 ? <p className="text-xs text-disabled text-center py-6 bg-surface-2/50 rounded-2xl italic border border-dashed border-divider">No payments found</p> : paymentHistory.slice(0, 5).map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-3 rounded-2xl border border-divider bg-surface-2/30 hover:bg-surface-2 transition-colors">
                                                    <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10"><Wallet className="h-3.5 w-3.5 text-emerald-500" /></div><div className="flex flex-col"><span className="text-xs font-bold text-high truncate max-w-[100px]">{payment.typeLabel || 'Payment'}</span><span className="text-[9px] font-medium text-disabled">{payment.dateLabel}</span></div></div><span className="text-xs font-black text-emerald-500">₱{payment.amount}</span>
                                                </div>
                                            ))}</div>
                                        </div>
                                    )}
                                    <div className="pt-4 space-y-3">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Actions</h5>
                                        <div className="space-y-2">
                                            <button onClick={() => setPendingConfirmAction("archive")} className="w-full flex items-center justify-between p-3 rounded-2xl border border-divider bg-surface-2/30 hover:bg-surface-2 transition-all group"><span className="text-xs font-bold text-medium group-hover:text-high">Archive Chat</span><ChevronRight className="h-4 w-4 text-disabled" /></button>
                                            <button onClick={() => setPendingConfirmAction("block")} className="w-full flex items-center justify-between p-3 rounded-2xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-all group"><span className="text-xs font-bold text-red-500">Block Contact</span><AlertTriangle className="h-4 w-4 text-red-500/50" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between border-b border-divider p-6">
                                    <h3 className="text-lg font-bold text-high">Shared Files</h3>
                                    <button onClick={() => setShowFilesSidebar(false)} className="rounded-lg p-2 hover:bg-surface-2 transition-colors"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-premium">
                                    <div className="flex gap-2 mb-6 p-1 bg-surface-2 rounded-2xl">
                                        {['media', 'files'].map((f) => (<button key={f} onClick={() => setFileFilter(f)} className={cn("flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", fileFilter === f ? "bg-surface-1 text-primary shadow-sm" : "text-disabled hover:text-medium")}>{f}</button>))}
                                    </div>
                                    
                                    {sharedFiles.length > 0 ? (
                                        <div className={cn(
                                            "grid gap-3",
                                            fileFilter === 'media' ? "grid-cols-3" : "grid-cols-1"
                                        )}>
                                            {sharedFiles.map((file) => (
                                                file.isMedia && fileFilter !== 'files' ? (
                                                    <div 
                                                        key={file.id} 
                                                        className="aspect-square rounded-xl overflow-hidden border border-divider bg-surface-2 relative group cursor-pointer"
                                                        onClick={() => {
                                                            const mediaFiles = sharedFiles.filter(f => f.isMedia).map(f => ({ url: f.url, id: f.id }));
                                                            const index = mediaFiles.findIndex(f => f.id === file.id);
                                                            setPreviewImages(mediaFiles);
                                                            setPreviewImageIndex(index >= 0 ? index : 0);
                                                        }}
                                                    >
                                                        <img src={file.url} className="w-full h-full object-cover" alt="" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(file.url, file.name); }}
                                                                className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={file.id} className="flex items-center gap-3 p-3 rounded-2xl border border-divider bg-surface-2/30 hover:bg-surface-2 transition-all group">
                                                        <div className="p-2.5 rounded-xl bg-surface-2 text-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-high truncate">{file.name}</p>
                                                            <p className="text-[10px] font-medium text-disabled mt-0.5">{formatFileSize(file.size)} • {file.timestampLabel}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDownloadFile(file.url, file.name)}
                                                            className="p-2 rounded-lg text-disabled hover:text-primary hover:bg-primary/10 transition-all"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-surface-2/30 rounded-[2rem] border border-dashed border-divider">
                                            <div className="p-4 rounded-full bg-surface-2 mb-4"><Folder className="h-8 w-8 text-disabled" /></div>
                                            <p className="text-sm font-bold text-medium">No files shared yet</p>
                                            <p className="text-[10px] font-medium text-disabled mt-1">Shared documents and media will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {pendingConfirmAction && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6"><div className={cn("p-3 rounded-2xl", pendingConfirmAction === "block" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>{pendingConfirmAction === "block" ? <ShieldCheck className="h-6 w-6" /> : <Folder className="h-6 w-6" />}</div><h3 className="text-xl font-black tracking-tight text-high">{pendingConfirmAction === "block" ? "Block Contact?" : "Archive Conversation?"}</h3></div>
                            <p className="text-sm text-medium leading-relaxed mb-8">{pendingConfirmAction === "block" ? "This user will no longer be able to message you. You can unblock them later in settings." : "This conversation will be moved to archives. You can still access it later from your archived messages."}</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setPendingConfirmAction(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-medium hover:bg-surface-2 transition-all">Cancel</button>
                                <button onClick={() => submitMessageUserAction(pendingConfirmAction)} disabled={isSubmittingConfirmAction} className={cn("px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg active:scale-95", pendingConfirmAction === "block" ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary hover:bg-primary-dark shadow-primary/20")}>{isSubmittingConfirmAction ? "Processing..." : "Confirm"}</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showReportWizard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xl rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between border-b border-divider p-6 bg-surface-1">
                                <div className="flex items-center gap-3"><div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500"><AlertTriangle className="h-5 w-5" /></div><h3 className="text-lg font-black tracking-tight text-high">Report Security Issue</h3></div>
                                <button onClick={() => setShowReportWizard(false)} className="rounded-xl p-2 hover:bg-surface-2 transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-disabled mb-2 ml-1">Report Category</label><select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} className="w-full rounded-2xl border border-border bg-surface-2 p-3.5 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"><option value="spam">Spam or Solicitation</option><option value="phishing">Phishing or Scam</option><option value="harassment">Harassment</option><option value="other">Other</option></select></div>
                                <div><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-disabled mb-2 ml-1">Additional Details</label><textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Please provide more information..." className="w-full rounded-2xl border border-border bg-surface-2 p-4 text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all h-32 resize-none" /></div>
                                <div className="pt-2"><button onClick={submitUserReport} disabled={isSubmittingReport || !reportDetails.trim()} className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] disabled:opacity-50">{isSubmittingReport ? "Submitting..." : "Submit Security Report"}</button></div>
                            </div>
                        </motion.div>
                    </div>
                )}
                
                {previewImages.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
                        onClick={() => setPreviewImages([])}
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewImages([]); }} 
                            className="absolute top-6 right-6 z-10 p-3 rounded-2xl border border-border bg-surface-1/80 text-high hover:bg-surface-2 transition-all active:scale-95 backdrop-blur-md"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {previewImages.length > 1 && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewImageIndex((prev) => (prev === 0 ? previewImages.length - 1 : prev - 1)); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full border border-border bg-surface-1/80 text-high hover:bg-surface-2 transition-all active:scale-95 backdrop-blur-md"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPreviewImageIndex((prev) => (prev === previewImages.length - 1 ? 0 : prev + 1)); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full border border-border bg-surface-1/80 text-high hover:bg-surface-2 transition-all active:scale-95 backdrop-blur-md"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <div 
                            className="relative max-w-full max-h-[70vh] flex items-center" 
                            onClick={(event) => event.stopPropagation()}
                        >
                            <img 
                                src={previewImages[previewImageIndex].url} 
                                alt={`Photo ${previewImageIndex + 1} of ${previewImages.length}`} 
                                className="max-w-[90vw] max-h-[70vh] object-contain rounded-3xl shadow-2xl border border-border" 
                            />
                        </div>

                        {previewImages.length > 1 && (
                            <div 
                                className="mt-6 flex gap-2 max-w-[90vw] overflow-x-auto py-2 px-1"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {previewImages.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setPreviewImageIndex(idx)}
                                        className={cn(
                                            "flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                                            idx === previewImageIndex 
                                                ? "border-primary ring-2 ring-primary/30" 
                                                : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img 
                                            src={img.url} 
                                            alt={`Thumbnail ${idx + 1}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <CashPaymentInterface 
                isOpen={isF2FInterfaceOpen} 
                onClose={() => setIsF2FInterfaceOpen(false)} 
                payment={activeF2FPayment ? {
                    id: activeF2FPayment.id,
                    tenantName: activeF2FPayment.tenantName || 'Unknown Tenant',
                    unit: activeF2FPayment.unit || 'Unknown Unit',
                    amount: activeF2FPayment.amount || '0',
                    invoiceNumber: activeF2FPayment.invoiceNumber || 'N/A',
                    description: activeF2FPayment.description || ''
                } : null} 
                onConfirm={handleConfirmF2FPayment}
            />

            <InvoiceModal 
                invoiceId={selectedInvoiceId} 
                onClose={() => setSelectedInvoiceId(null)} 
                onUpdated={async () => { if (activeConversationId) { await refreshMessages(activeConversationId); await refreshConversations(); } }} 
            />
        </div>
    );
}
