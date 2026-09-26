'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import Image from 'next/image';
import { 
    MessageCircle, 
    Megaphone, 
    Search, 
    Send, 
    X, 
    ArrowLeft, 
    CheckCheck, 
    Clock, 
    RefreshCw, 
    Plus, 
    Building2,
    Pin,
    AlertCircle,
    Folder,
    MoreVertical,
    FileText,
    CreditCard,
    Hammer,
    Bell,
    Wallet,
    ChevronRight,
    AlertTriangle,
    Download,
    Paperclip,
    Smile,
    ShieldCheck,
    ArrowUpRight,
    Check,
    Receipt,
    UserPlus,
    User,
    ExternalLink
} from 'lucide-react';
import { 
    fetchConversations, 
    fetchConversationMessages, 
    fetchConversationPaymentHistory,
    sendConversationMessage,
    uploadConversationFile,
    markConversationAsRead,
    searchMessageUsers,
    createOrGetDirectConversation,
    type ConversationSummary, 
    type ConversationMessage,
    type PaymentHistoryEntry,
    type MessageUserSearchResult
} from '@/lib/messages/client';
import { createAnnouncementPost, getCurrentCommunityPosts } from '@/lib/community/actions';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { cn } from '@/lib/utils';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { MessageList } from '@/components/landlord/messages/MessageList';
import { RoleBadge, type BadgeRole } from '@/components/profile/RoleBadge';
import { 
    ContactItem, 
    UiMessage, 
    SharedFileItem, 
    QuickAction, 
    PendingAttachment 
} from '@/components/landlord/messages/types';
import { QuickActionSummaryModal } from '@/components/messaging/QuickActionSummaryModal';
import { PaymentHistoryModal } from '@/components/messaging/PaymentHistoryModal';
import { InvoiceModal } from '@/components/landlord/invoices/InvoiceModal';
import { AttachInvoiceModal } from '@/components/landlord/messages/AttachInvoiceModal';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';

const QUICK_ACTIONS: QuickAction[] = [
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
        iconClassName: "text-blue-500",
        iconContainerClassName: "bg-blue-500/10",
    },
    {
        key: "send-notice",
        icon: Bell,
        labelTop: "Send",
        labelBottom: "Notice",
        iconClassName: "text-purple-500",
        iconContainerClassName: "bg-purple-500/10",
    },
];

function formatFileSize(bytes: number) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function LandlordMessagesView() {
    const { profile } = useAuth();
    const { properties, selectedPropertyId } = useProperty();
    
    // View state: 'chats' | 'broadcasts'
    const [viewMode, setViewMode] = useState<'chats' | 'broadcasts'>('chats');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Directory Search state (Live tenant lookup)
    const [userSearchResults, setUserSearchResults] = useState<MessageUserSearchResult[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [userSearchError, setUserSearchError] = useState<string | null>(null);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
    const [newChatResults, setNewChatResults] = useState<MessageUserSearchResult[]>([]);
    const [isSearchingNewChat, setIsSearchingNewChat] = useState(false);

    // Active Chat state (Mobile Screen 2 - Full Viewport)
    const [activeChat, setActiveChat] = useState<ConversationSummary | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

    // Slide-up Sheets (Mobile Screen 3)
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState<'media' | 'files'>('media');

    // Modals state
    const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
    const [showAttachInvoiceModal, setShowAttachInvoiceModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [activeRefundMessage, setActiveRefundMessage] = useState<UiMessage | null>(null);
    const [pendingConfirmAction, setPendingConfirmAction] = useState<'archive' | 'block' | null>(null);
    const [previewImages, setPreviewImages] = useState<{ url: string; id: string }[]>([]);
    const [previewImageIndex, setPreviewImageIndex] = useState(0);

    // Payment history in sheet
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
    const [paymentHistoryTotal, setPaymentHistoryTotal] = useState<number>(0);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Broadcasts / Announcements state
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastContent, setBroadcastContent] = useState('');
    const [broadcastPropertyId, setBroadcastPropertyId] = useState(selectedPropertyId || 'all');
    const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);
    const [broadcastsList, setBroadcastsList] = useState<Array<{ 
        id: string; 
        title: string; 
        content: string; 
        created_at: string; 
        is_pinned?: boolean;
        property_id?: string;
        propertyName?: string;
    }>>([]);
    const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load active conversations
    const loadConversations = useCallback(async () => {
        try {
            const { data } = await fetchConversations();
            setConversations(data || []);
        } catch (err) {
            console.error('[MobileMessages] Failed to load conversations:', err);
        } finally {
            setLoadingChats(false);
            setRefreshing(false);
        }
    }, []);

    // Load announcements
    const loadBroadcasts = useCallback(async () => {
        setLoadingBroadcasts(true);
        try {
            const targetProp = selectedPropertyId && selectedPropertyId !== 'all' ? selectedPropertyId : undefined;
            const res = await getCurrentCommunityPosts(50, undefined, targetProp);
            const posts = res?.posts || [];
            const formatted = posts
                .filter((p: any) => p.type === 'announcement' || p.title)
                .map((p: any) => {
                    const matchedProp = properties.find((prop) => prop.id === p.property_id);
                    return {
                        id: p.id,
                        title: p.title,
                        content: p.content || '',
                        created_at: p.created_at,
                        is_pinned: Boolean(p.is_pinned),
                        property_id: p.property_id,
                        propertyName: matchedProp?.name || (p.property_id ? 'Assigned Property' : 'All Properties'),
                    };
                });
            setBroadcastsList(formatted);
        } catch (err) {
            console.error('[MobileMessages] Failed to load announcements:', err);
        } finally {
            setLoadingBroadcasts(false);
            setRefreshing(false);
        }
    }, [selectedPropertyId, properties]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        loadBroadcasts();
    }, [loadBroadcasts]);

    const handleRefresh = () => {
        setRefreshing(true);
        if (viewMode === 'chats') {
            loadConversations();
        } else {
            loadBroadcasts();
        }
    };

    // Live directory search across active chats query
    useEffect(() => {
        const q = searchQuery.trim();
        if (q.length < 2) {
            setUserSearchResults([]);
            setUserSearchError(null);
            setIsSearchingUsers(false);
            return;
        }
        let cancelled = false;
        setIsSearchingUsers(true);
        const timer = setTimeout(async () => {
            const { data, error } = await searchMessageUsers(q, 8);
            if (cancelled) return;
            setUserSearchResults(data || []);
            setUserSearchError(error);
            setIsSearchingUsers(false);
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery]);

    // Live directory search in New Chat modal
    useEffect(() => {
        const q = newChatSearchQuery.trim();
        if (q.length < 2) {
            setNewChatResults([]);
            setIsSearchingNewChat(false);
            return;
        }
        let cancelled = false;
        setIsSearchingNewChat(true);
        const timer = setTimeout(async () => {
            const { data } = await searchMessageUsers(q, 10);
            if (cancelled) return;
            setNewChatResults(data || []);
            setIsSearchingNewChat(false);
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [newChatSearchQuery]);

    // Load payment history for active contact
    const loadPaymentHistory = useCallback(async (conversationId: string) => {
        setPaymentHistoryLoading(true);
        try {
            const { data } = await fetchConversationPaymentHistory(conversationId, 50);
            if (data) {
                setPaymentHistory(data.payments || []);
                setPaymentHistoryTotal(data.totalPaid || 0);
            }
        } catch (err) {
            console.error('Failed to load payment history:', err);
        } finally {
            setPaymentHistoryLoading(false);
        }
    }, []);

    // Open chat and load messages
    const handleOpenChat = async (conv: ConversationSummary) => {
        setActiveChat(conv);
        setLoadingMessages(true);
        setShowInfoSidebar(false);
        setShowFilesSidebar(false);
        setShowAttachInvoiceModal(false);
        try {
            const { data } = await fetchConversationMessages(conv.id);
            setMessages(data || []);
            void loadPaymentHistory(conv.id);
            void markConversationAsRead(conv.id);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Start a conversation with a directory user
    const handleStartConversationWithUser = async (user: MessageUserSearchResult) => {
        try {
            setLoadingChats(true);
            const convId = await createOrGetDirectConversation(user.id);
            const { data: convs } = await fetchConversations();
            setConversations(convs || []);
            setIsNewChatModalOpen(false);
            setSearchQuery('');
            const found = (convs || []).find((c) => c.id === convId);
            if (found) {
                handleOpenChat(found);
            } else {
                const fallbackConv: ConversationSummary = {
                    id: convId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    unreadCount: 0,
                    relationshipStatus: "tenant_landlord",
                    hasPaymentHistory: false,
                    isArchived: false,
                    isBlocked: false,
                    lastMessage: null,
                    otherParticipants: [{
                        id: user.id,
                        fullName: user.fullName,
                        role: user.role,
                        avatarUrl: user.avatarUrl,
                        avatarBgColor: user.avatarBgColor,
                    }],
                };
                handleOpenChat(fallbackConv);
            }
        } catch (err) {
            console.error('Failed to start conversation:', err);
        } finally {
            setLoadingChats(false);
        }
    };

    // Realtime Supabase changes for open conversation
    useEffect(() => {
        if (!activeChat?.id) return;
        const supabase = createSupabaseClient();
        const channel = supabase.channel(`mobile-messages-${activeChat.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeChat.id}` }, async () => {
                const { data } = await fetchConversationMessages(activeChat.id);
                if (data) setMessages(data);
                void markConversationAsRead(activeChat.id);
            })
            .subscribe();

        return () => {
            void channel.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [activeChat?.id]);

    // Map conversation message to UI message
    const mapMessageToUi = useCallback((message: ConversationMessage): UiMessage => {
        let metadata: Record<string, unknown> | null = null;
        if (typeof message.metadata === "string") {
            try { metadata = JSON.parse(message.metadata); } catch { metadata = null; }
        } else if (message.metadata && typeof message.metadata === "object") {
            metadata = message.metadata as Record<string, unknown>;
        }
        const isOwn = profile?.id === message.senderId;
        const redactedContent = typeof metadata?.redactedContent === "string" ? metadata.redactedContent : message.content;
        const isRedacted = Boolean(metadata?.isRedacted);
        const isConfirmedDisclosed = metadata?.isConfirmedDisclosed === true;
        const isPhishing = Boolean(metadata?.isPhishing);
        const explicitCategory = metadata?.redactionCategory as UiMessage["redactionCategory"];
        const metadataDisclosureAllowed = typeof metadata?.disclosureAllowed === "boolean" ? metadata.disclosureAllowed : undefined;
        const redactionCategory = explicitCategory ?? (isPhishing ? "phishing" : isRedacted ? (metadataDisclosureAllowed ? "credentials" : "profanity") : "none");
        const disclosureAllowed = typeof metadata?.disclosureAllowed === "boolean" ? metadata.disclosureAllowed : redactionCategory === "credentials";
        const systemType = typeof metadata?.systemType === "string" ? metadata.systemType : (typeof metadata?.event === "string" ? metadata.event : undefined);
        const workflowStatus = typeof metadata?.workflowStatus === "string" ? metadata.workflowStatus : (typeof metadata?.event === "string" ? metadata.event : undefined);

        let formattedContent = message.content;
        if (message.type === "system") {
            if (systemType === "awaiting_in_person") formattedContent = "A face-to-face cash payment has been initiated. The landlord can now verify and confirm the receipt of funds using the interface below.";
            else if (systemType === "reminder_sent") formattedContent = "A payment reminder has been sent for this invoice. You can settle it quickly using the button below.";
            else if (systemType === "in_person_intent_expired") formattedContent = "The face-to-face payment request has expired. The invoice status has been reverted to pending.";
            else if (systemType === "landlord_review") {
                if (workflowStatus === "rejected") formattedContent = `The payment request has been rejected. Reason: ${typeof metadata?.rejectionReason === "string" ? metadata.rejectionReason : "No reason provided."}`;
                else if (workflowStatus === "confirmed" || workflowStatus === "receipted") formattedContent = "The payment has been confirmed.";
            }
        }

        return {
            id: message.id,
            type: message.type === "system" ? "system" : (isOwn ? "landlord" : "tenant"),
            messageType: message.type as "text" | "system" | "image" | "file",
            content: formattedContent,
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
            invoiceId: (() => { const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i; const raw = typeof metadata?.invoiceId === "string" ? metadata.invoiceId : (typeof metadata?.paymentId === "string" ? metadata.paymentId : undefined); return raw && UUID_RE.test(raw) ? raw : undefined; })(),
            invoiceNumber: typeof metadata?.invoiceNumber === "string" ? metadata.invoiceNumber : undefined,
            tenantName: typeof metadata?.tenantName === "string" ? metadata.tenantName : undefined,
            landlordName: typeof metadata?.landlordName === "string" ? metadata.landlordName : undefined,
            propertyName: typeof metadata?.propertyName === "string" ? metadata.propertyName : undefined,
            unit: typeof metadata?.unit === "string" ? metadata.unit : undefined,
            issueType: metadata?.issueType as UiMessage["issueType"],
            shortfallAmount: typeof metadata?.shortfallAmount === "number" ? metadata.shortfallAmount : undefined,
            hasRefundDetails: Boolean(metadata?.hasRefundDetails),
            metadata: metadata || undefined,
            amount: typeof metadata?.amount === "string" ? metadata.amount : (typeof metadata?.paymentAmount === "string" ? metadata.paymentAmount : undefined),
            description: typeof metadata?.description === "string" ? metadata.description : undefined,
            attachments: Array.isArray(message.attachments || metadata?.attachments) ? (message.attachments || metadata!.attachments as any[]).map((att: any) => ({
                id: att.id,
                type: att.type || (isOwn ? "landlord" : "tenant"),
                messageType: att.messageType || "image",
                content: "",
                fileUrl: att.fileUrl,
                fileName: att.fileName,
                fileSize: att.fileSize,
                fileMimeType: att.fileMimeType || att.mimeType,
                timestamp: att.timestamp,
                createdAt: att.createdAt
            })) : undefined,
            isAlbum: Boolean(message.isAlbum ?? metadata?.isAlbum),
            rejectionReason: typeof metadata?.rejectionReason === "string" ? metadata.rejectionReason : undefined,
        };
    }, [profile?.id]);

    const uiMessages: UiMessage[] = useMemo(() => {
        return messages.map(mapMessageToUi);
    }, [messages, mapMessageToUi]);

    // Active Contact Details
    const activeContact: ContactItem | null = useMemo(() => {
        if (!activeChat) return null;
        const other = activeChat.otherParticipants?.[0];
        return {
            id: activeChat.id,
            participantUserId: other?.id ?? null,
            name: other?.fullName ?? "Tenant",
            role: (other?.role as BadgeRole) ?? "tenant",
            unit: (other as any)?.unit || (other?.role === "tenant" ? "Resident" : "Participant"),
            unread: activeChat.unreadCount,
            lastContact: activeChat.lastMessage ? new Date(activeChat.lastMessage.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "No messages yet",
            avatarUrl: other?.avatarUrl || null,
            initials: (other?.fullName ?? "T").split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join(""),
            avatarBgColor: other?.avatarBgColor || null,
            relationshipStatus: activeChat.relationshipStatus || "tenant_landlord",
            hasPaymentHistory: activeChat.hasPaymentHistory ?? true,
            isArchived: activeChat.isArchived ?? false,
            isBlocked: activeChat.isBlocked ?? false,
            isOnline: false,
        };
    }, [activeChat]);

    // Shared Files list
    const sharedFiles: SharedFileItem[] = useMemo(() => {
        const files: SharedFileItem[] = [];
        uiMessages.forEach((msg) => {
            if (msg.fileUrl) {
                const urlPath = msg.fileUrl.split('?')[0];
                const isMedia = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/i.test(urlPath) || 
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
                msg.attachments.forEach((att) => {
                    if (att.fileUrl) {
                        const urlPath = att.fileUrl.split('?')[0];
                        const isMedia = /\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm)$/i.test(urlPath) || 
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

        const seen = new Set<string>();
        return files
            .reduce((acc, file) => {
                if (seen.has(file.id)) return acc;
                seen.add(file.id);
                if (fileFilter === 'media' && file.isMedia) acc.push(file);
                else if (fileFilter === 'files' && !file.isMedia) acc.push(file);
                return acc;
            }, [] as SharedFileItem[])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [uiMessages, fileFilter]);

    // Handle File Download
    const handleDownloadFile = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Send a message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!activeChat || (!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage) return;

        const text = messageInput.trim();
        setMessageInput('');
        setSendingMessage(true);

        try {
            if (pendingAttachments.length > 0) {
                for (const att of pendingAttachments) {
                    await uploadConversationFile(activeChat.id, att.file);
                }
                setPendingAttachments([]);
            }

            if (text) {
                const newMsg = await sendConversationMessage(activeChat.id, text);
                if (newMsg) {
                    setMessages((prev) => [...prev, { ...newMsg, sender: null } as ConversationMessage]);
                }
            } else {
                const { data } = await fetchConversationMessages(activeChat.id);
                if (data) setMessages(data);
            }

            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    // Handle File Select
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newAttachments: PendingAttachment[] = [];
        Array.from(files).forEach((file) => {
            const isImage = file.type.startsWith('image/');
            newAttachments.push({
                id: Math.random().toString(36).substring(7),
                file,
                isImage,
                previewUrl: isImage ? URL.createObjectURL(file) : null,
                status: 'idle',
            });
        });

        setPendingAttachments((prev) => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setPendingAttachments((prev) => {
            const match = prev.find((a) => a.id === id);
            if (match?.previewUrl) URL.revokeObjectURL(match.previewUrl);
            return prev.filter((a) => a.id !== id);
        });
    };

    // Publish Broadcast Announcement
    const handlePublishBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastTitle.trim() || !broadcastContent.trim() || submittingBroadcast) return;

        setSubmittingBroadcast(true);
        try {
            if (broadcastPropertyId === 'all') {
                for (const prop of properties) {
                    await createAnnouncementPost({
                        title: broadcastTitle.trim(),
                        content: broadcastContent.trim(),
                        propertyId: prop.id,
                    });
                }
            } else {
                await createAnnouncementPost({
                    title: broadcastTitle.trim(),
                    content: broadcastContent.trim(),
                    propertyId: broadcastPropertyId,
                });
            }

            setBroadcastSuccess(true);
            setBroadcastTitle('');
            setBroadcastContent('');
            setTimeout(() => {
                setBroadcastSuccess(false);
                setIsBroadcastModalOpen(false);
                loadBroadcasts();
            }, 1200);
        } catch (err: any) {
            console.error('Broadcast failed:', err);
            alert(err?.message || 'Failed to post announcement.');
        } finally {
            setSubmittingBroadcast(false);
        }
    };

    const filteredConversations = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return conversations;
        return conversations.filter((c) => {
            const other = c.otherParticipants?.[0];
            const name = (other?.fullName || 'Tenant').toLowerCase();
            const lastMsg = (c.lastMessage?.content || '').toLowerCase();
            return name.includes(q) || lastMsg.includes(q);
        });
    }, [conversations, searchQuery]);

    const totalUnreadCount = useMemo(() => {
        return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    }, [conversations]);

    const filteredBroadcasts = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return broadcastsList;
        return broadcastsList.filter((b) => {
            return (b.title || '').toLowerCase().includes(q) || 
                   (b.content || '').toLowerCase().includes(q) || 
                   (b.propertyName || '').toLowerCase().includes(q);
        });
    }, [broadcastsList, searchQuery]);

    /* =========================================================================
       SCREEN 2: DEDICATED FULL-SCREEN CHAT ROOM (Mobile Messenger Paradigm)
       ========================================================================= */
    if (activeChat && mounted) {
        return createPortal(
            <div className="fixed inset-0 z-[120] bg-surface-0 flex flex-col max-w-md mx-auto h-[100dvh] overflow-hidden text-high">
                {/* 1. Chat Top Bar with 44px Back Button and Contact Header */}
                <div className="px-3 py-2 border-b border-divider flex items-center justify-between bg-surface-1/95 backdrop-blur-md shrink-0 shadow-xs z-20">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* 44px Back Button returning to Inbox */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveChat(null);
                                setShowInfoSidebar(false);
                                setShowFilesSidebar(false);
                                setShowAttachInvoiceModal(false);
                            }}
                            className="size-11 rounded-full hover:bg-surface-2 text-medium hover:text-high active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                            aria-label="Back to messages"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        
                        {/* Contact Avatar & Header (Tapping slides up Screen 3 Details Sheet) */}
                        <div 
                            onClick={() => setShowInfoSidebar(true)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer active:opacity-80 transition-opacity"
                        >
                            <div 
                                className="relative size-10 rounded-full overflow-hidden neumorphic-inset-card shrink-0"
                                style={{ backgroundColor: activeContact?.avatarBgColor || 'var(--surface-3)' }}
                            >
                                {activeContact?.avatarUrl ? (
                                    <Image src={activeContact.avatarUrl} alt={activeContact.name} fill sizes="40px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-black text-xs text-high">
                                        {activeContact?.initials || 'T'}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-black text-high truncate">{activeContact?.name}</h4>
                                    <RoleBadge role={activeContact?.role || 'tenant'} />
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-medium">
                                    <span className="truncate">{activeContact?.unit || 'Resident'}</span>
                                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-emerald-500 font-medium shrink-0 text-[10px]">Connected</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 44px Action Buttons: Shared Files (Folder) and 3-Dot (Details) Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setShowFilesSidebar(!showFilesSidebar);
                                setShowInfoSidebar(false);
                            }}
                            className={cn(
                                "size-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer",
                                showFilesSidebar 
                                    ? "neumorphic-primary text-white shadow-sm" 
                                    : "text-medium hover:text-high hover:bg-surface-2"
                            )}
                            title="Shared Files"
                            aria-label="Shared Files"
                        >
                            <Folder className="size-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowInfoSidebar(!showInfoSidebar);
                                setShowFilesSidebar(false);
                            }}
                            className={cn(
                                "size-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer",
                                showInfoSidebar 
                                    ? "neumorphic-primary text-white shadow-sm" 
                                    : "text-medium hover:text-high hover:bg-surface-2"
                            )}
                            title="Conversation Info"
                            aria-label="Conversation Info"
                        >
                            <MoreVertical className="size-5" />
                        </button>
                    </div>
                </div>

                {/* 2. Messages Stream */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <MessageList 
                        messages={uiMessages}
                        viewerRole="landlord"
                        isMessagesLoading={loadingMessages}
                        onDownloadImage={(id, name) => handleDownloadFile(id, name)}
                        onOpenF2F={(msg) => {
                            const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            const candidateId = msg.invoiceId || msg.paymentId || null;
                            const resolvedId = candidateId && UUID_RE.test(candidateId) ? candidateId : null;
                            setSelectedInvoiceId(resolvedId);
                            setActiveRefundMessage(msg);
                        }}
                        onImageClick={(images, index) => {
                            setPreviewImages(images);
                            setPreviewImageIndex(index);
                        }}
                        isDownloading={false}
                        updateShouldStickToBottom={() => {}}
                        messagesScrollRef={messagesScrollRef}
                        messagesEndRef={messagesEndRef}
                    />
                </div>

                {/* 3. Pending Attachments Strip */}
                {pendingAttachments.length > 0 && (
                    <div className="px-4 py-2 border-t border-divider bg-surface-1 flex items-center gap-2 overflow-x-auto shrink-0">
                        {pendingAttachments.map((att) => (
                            <div key={att.id} className="relative size-14 rounded-xl overflow-hidden neumorphic-panel shrink-0 group">
                                {att.isImage && att.previewUrl ? (
                                    <Image src={att.previewUrl} alt="" fill sizes="56px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface-2 text-medium">
                                        <FileText className="size-6" />
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute top-1 right-1 size-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
                                    aria-label="Remove attachment"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Ergonomic Bottom Composer (Thumb Zone) */}
                <div className="p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-divider bg-surface-0/95 backdrop-blur-md flex flex-col gap-1 shrink-0 shadow-lg">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-[2.5rem] neumorphic-inset-card"
                    >
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xlsx"
                        />
                        
                        {/* 44px Paperclip Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="size-11 rounded-full text-medium hover:text-high hover:bg-surface-2 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                            title="Attach File"
                            aria-label="Attach File"
                        >
                            <Paperclip className="size-5" />
                        </button>

                        {/* 44px Attach Invoice Button (Inherited from Desktop) */}
                        <button
                            type="button"
                            onClick={() => setShowAttachInvoiceModal(true)}
                            className="size-11 rounded-full text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                            title="Attach Invoice"
                            aria-label="Attach Invoice"
                        >
                            <Receipt className="size-5" />
                        </button>

                        {/* Message Input */}
                        <input
                            type="text"
                            placeholder="Message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="flex-1 bg-transparent border-none py-2 text-sm text-high placeholder:text-disabled focus:outline-none min-w-0"
                        />

                        {/* 44px Send Button */}
                        <button
                            type="submit"
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage}
                            className="size-11 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                            aria-label="Send message"
                        >
                            <Send className="size-5" />
                        </button>
                    </form>
                </div>

                {/* =========================================================================
                   SCREEN 3A: SLIDE-UP CONTACT DETAILS & ACTIONS SHEET
                   ========================================================================= */}
                {showInfoSidebar && (
                    <div 
                        className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
                        onClick={() => setShowInfoSidebar(false)}
                    >
                        <div 
                            className="bg-surface-1 border-t border-divider rounded-t-[2.5rem] p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sheet Handle */}
                            <div className="w-12 h-1.5 bg-disabled/40 rounded-full mx-auto shrink-0 mb-1" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-divider">
                                <h3 className="text-xs font-black uppercase tracking-wider text-disabled">Contact Hub</h3>
                                <button
                                    onClick={() => setShowInfoSidebar(false)}
                                    className="size-11 rounded-full flex items-center justify-center text-medium hover:text-high hover:bg-surface-2 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Contact Profile Card */}
                            <div className="flex flex-col items-center text-center p-4 rounded-3xl neumorphic-inset-card">
                                <div 
                                    className="relative size-16 rounded-full overflow-hidden neumorphic-panel mb-2.5"
                                    style={{ backgroundColor: activeContact?.avatarBgColor || 'var(--surface-3)' }}
                                >
                                    {activeContact?.avatarUrl ? (
                                        <Image src={activeContact.avatarUrl} alt="" fill sizes="64px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-black text-lg text-high">
                                            {activeContact?.initials || 'T'}
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-base font-black text-high">{activeContact?.name}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <RoleBadge role={activeContact?.role || 'tenant'} />
                                    <span className="text-xs font-medium text-medium">({activeContact?.unit || 'Resident'})</span>
                                </div>
                            </div>

                            {/* Quick Action Buttons (48px+ Touch Targets with Distinct Color Harmony) */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Quick Actions</h5>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.key}
                                            type="button"
                                            onClick={() => {
                                                setShowInfoSidebar(false);
                                                setSelectedQuickAction(action.key);
                                            }}
                                            className="flex items-center gap-3 rounded-2xl neumorphic-inset-card p-3 min-h-[56px] transition-all hover:scale-[1.02] active:scale-95 group text-left cursor-pointer"
                                        >
                                            <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", action.iconContainerClassName)}>
                                                <action.icon className={cn("size-5", action.iconClassName)} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-black uppercase tracking-wider text-high truncate">{action.labelTop}</span>
                                                <span className="text-[11px] font-medium text-medium truncate">{action.labelBottom}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment History Section */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Payment History</h5>
                                    <span className="text-xs font-black text-primary">Total: ₱{paymentHistoryTotal.toLocaleString()}</span>
                                </div>

                                <div className="space-y-2">
                                    {paymentHistoryLoading ? (
                                        <div className="h-16 w-full animate-pulse rounded-2xl bg-surface-2" />
                                    ) : paymentHistory.length === 0 ? (
                                        <p className="text-xs text-disabled text-center py-4 border border-dashed border-divider rounded-2xl italic">
                                            No payments recorded yet
                                        </p>
                                    ) : (
                                        <>
                                            {paymentHistory.slice(0, 3).map((payment, idx) => (
                                                <div
                                                    key={payment.id || `ph-${idx}`}
                                                    onClick={() => {
                                                        setShowInfoSidebar(false);
                                                        setShowPaymentHistoryModal(true);
                                                    }}
                                                    className="flex items-center justify-between p-3 rounded-2xl neumorphic-inset-card hover:border-primary/30 transition-all cursor-pointer shadow-xs"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10 shrink-0">
                                                            <Wallet className="size-4 text-emerald-500" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-black text-high truncate max-w-[140px]">
                                                                {payment.typeLabel || 'Payment'}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-disabled">
                                                                {payment.dateLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-emerald-500 shrink-0">
                                                        ₱{payment.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowInfoSidebar(false);
                                                    setShowPaymentHistoryModal(true);
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl neumorphic-inset-card text-xs font-black uppercase tracking-wider text-primary hover:bg-surface-3 transition-all active:scale-95 cursor-pointer"
                                            >
                                                <span>View Full Payment Ledger</span>
                                                <ArrowUpRight className="size-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="pt-1 space-y-2 pb-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Privacy & Actions</h5>
                                <button 
                                    onClick={() => {
                                        setShowInfoSidebar(false);
                                        setPendingConfirmAction('archive');
                                    }} 
                                    className="w-full flex items-center justify-between h-12 px-4 rounded-2xl neumorphic-inset-card transition-all text-left cursor-pointer"
                                >
                                    <span className="text-xs font-bold text-high">Archive Conversation</span>
                                    <ChevronRight className="size-4 text-disabled" />
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowInfoSidebar(false);
                                        setPendingConfirmAction('block');
                                    }} 
                                    className="w-full flex items-center justify-between h-12 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left cursor-pointer"
                                >
                                    <span className="text-xs font-bold text-red-500">Block Contact</span>
                                    <AlertTriangle className="size-4 text-red-500/50" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                   SCREEN 3B: SLIDE-UP SHARED FILES & MEDIA SHEET
                   ========================================================================= */}
                {showFilesSidebar && (
                    <div 
                        className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
                        onClick={() => setShowFilesSidebar(false)}
                    >
                        <div 
                            className="bg-surface-1 border-t border-divider rounded-t-[2.5rem] p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sheet Handle */}
                            <div className="w-12 h-1.5 bg-disabled/40 rounded-full mx-auto shrink-0 mb-1" />

                            <div className="flex items-center justify-between pb-3 border-b border-divider">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Folder className="size-4" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-high">Shared Files</h3>
                                </div>
                                <button
                                    onClick={() => setShowFilesSidebar(false)}
                                    className="size-11 rounded-full flex items-center justify-center text-medium hover:text-high hover:bg-surface-2 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* 44px Media vs Files Segmented Tabs */}
                            <div className="grid grid-cols-2 p-1 rounded-2xl neumorphic-inset-card h-12">
                                <button
                                    onClick={() => setFileFilter('media')}
                                    className={cn(
                                        "h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
                                        fileFilter === 'media' 
                                            ? "neumorphic-primary text-white shadow-xs" 
                                            : "text-medium hover:text-high"
                                    )}
                                >
                                    Media
                                </button>
                                <button
                                    onClick={() => setFileFilter('files')}
                                    className={cn(
                                        "h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95",
                                        fileFilter === 'files' 
                                            ? "neumorphic-primary text-white shadow-xs" 
                                            : "text-medium hover:text-high"
                                    )}
                                >
                                    Documents
                                </button>
                            </div>

                            {/* Files Feed */}
                            <div className="space-y-2 pb-2">
                                {sharedFiles.length > 0 ? (
                                    fileFilter === 'media' ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {sharedFiles.map((file) => (
                                                <div 
                                                    key={file.id} 
                                                    onClick={() => {
                                                        setPreviewImages([{ url: file.url, id: file.id }]);
                                                        setPreviewImageIndex(0);
                                                    }}
                                                    className="relative aspect-square rounded-2xl overflow-hidden neumorphic-inset-card group cursor-pointer"
                                                >
                                                    <Image src={file.url} alt={file.name} fill sizes="100px" className="object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        sharedFiles.map((file) => (
                                            <div 
                                                key={file.id} 
                                                className="flex items-center justify-between p-3 rounded-2xl neumorphic-inset-card hover:border-primary/30 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2.5 rounded-xl bg-surface-2 text-primary shrink-0">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <p className="text-xs font-bold text-high truncate max-w-[160px]">{file.name}</p>
                                                        <p className="text-[10px] text-disabled">{formatFileSize(file.size)} • {file.timestampLabel}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadFile(file.url, file.name)}
                                                    className="size-11 rounded-xl flex items-center justify-center text-medium hover:text-high hover:bg-surface-2 active:scale-95 transition-all cursor-pointer shrink-0"
                                                    title="Download File"
                                                    aria-label="Download File"
                                                >
                                                    <Download className="size-4" />
                                                </button>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-divider rounded-2xl">
                                        <div className="p-3 rounded-full bg-surface-2 mb-3">
                                            <Folder className="size-6 text-disabled" />
                                        </div>
                                        <p className="text-xs font-bold text-high">No files shared yet</p>
                                        <p className="text-[10px] text-disabled mt-0.5">
                                            Shared documents and media from this conversation will appear here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modals & Sub-Flows */}
                <QuickActionSummaryModal
                    isOpen={Boolean(selectedQuickAction)}
                    onClose={() => {
                        setSelectedQuickAction(null);
                        if (activeChat?.id) {
                            fetchConversationMessages(activeChat.id).then(r => r.data && setMessages(r.data));
                        }
                    }}
                    actionKey={selectedQuickAction}
                    contact={activeContact}
                    currentUserRole="landlord"
                    onInsertMessage={(text) => setMessageInput(text)}
                />

                <PaymentHistoryModal
                    isOpen={showPaymentHistoryModal}
                    onClose={() => setShowPaymentHistoryModal(false)}
                    contact={activeContact}
                    payments={paymentHistory}
                    totalPaid={paymentHistoryTotal}
                    isLoading={paymentHistoryLoading}
                    role="landlord"
                />

                <AttachInvoiceModal
                    isOpen={showAttachInvoiceModal}
                    onClose={() => setShowAttachInvoiceModal(false)}
                    conversationId={activeChat.id}
                    contact={activeContact}
                    onSuccess={() => {
                        void fetchConversationMessages(activeChat.id).then(r => r.data && setMessages(r.data));
                        void loadPaymentHistory(activeChat.id);
                        void loadConversations();
                    }}
                />

                <InvoiceModal
                    invoiceId={selectedInvoiceId}
                    onClose={() => {
                        setSelectedInvoiceId(null);
                        setActiveRefundMessage(null);
                    }}
                    onUpdated={() => {
                        if (activeChat?.id) {
                            fetchConversationMessages(activeChat.id).then(r => r.data && setMessages(r.data));
                            loadPaymentHistory(activeChat.id);
                        }
                    }}
                    role="landlord"
                    refundMessage={activeRefundMessage}
                />

                {/* Image Lightbox Preview */}
                {previewImages.length > 0 && (
                    <div 
                        className="fixed inset-0 z-[140] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
                        onClick={() => setPreviewImages([])}
                    >
                        <button 
                            onClick={(e) => { e.stopPropagation(); setPreviewImages([]); }} 
                            className="absolute top-5 right-5 size-11 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 cursor-pointer"
                        >
                            <X className="size-6" />
                        </button>
                        <div className="relative max-w-full max-h-[80vh] aspect-auto">
                            <Image
                                src={previewImages[previewImageIndex]?.url || ''}
                                alt="Full preview"
                                width={800}
                                height={800}
                                className="max-h-[80vh] w-auto object-contain rounded-xl"
                            />
                        </div>
                    </div>
                )}

                {/* Confirm Action Dialog */}
                {pendingConfirmAction && (
                    <div 
                        onClick={() => setPendingConfirmAction(null)}
                        className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 cursor-pointer"
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl border border-divider bg-surface-1 p-6 shadow-2xl cursor-default"
                        >
                            <h3 className="text-base font-black text-high mb-2">
                                {pendingConfirmAction === 'block' ? 'Block Contact?' : 'Archive Conversation?'}
                            </h3>
                            <p className="text-xs text-medium leading-relaxed mb-6">
                                {pendingConfirmAction === 'block' 
                                    ? 'This user will not be able to message you.' 
                                    : 'This conversation will be archived.'}
                            </p>
                            <div className="flex justify-end gap-2.5">
                                <button 
                                    onClick={() => setPendingConfirmAction(null)}
                                    className="h-11 px-4 rounded-xl text-xs font-bold text-medium hover:bg-surface-2 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (activeContact?.participantUserId) {
                                            await fetch(`/api/messages/users/${activeContact.participantUserId}/actions`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ action: pendingConfirmAction }),
                                            });
                                            await loadConversations();
                                            setActiveChat(null);
                                        }
                                        setPendingConfirmAction(null);
                                    }}
                                    className="h-11 px-5 rounded-xl text-xs font-black text-white bg-primary shadow-sm active:scale-95 cursor-pointer"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>,
            document.body
        );
    }

    /* =========================================================================
       SCREEN 1: INBOX / CONVERSATIONS & BROADCASTS HUB (Mobile Messenger Paradigm)
       ========================================================================= */
    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex flex-col gap-3 pb-24">
                {/* Global Property Selector */}
                <div className="px-4 pt-2.5">
                    <MobilePropertySelector />
                </div>

                {/* Sticky Search & Mode Switcher Bar */}
                <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pb-2.5 pt-1 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                    {/* 48px Search Bar */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={viewMode === 'chats' ? "Search conversations or directory..." : "Search announcements..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-12 pl-11 pr-11 text-xs font-medium text-foreground bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 rounded-2xl placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 48px Dual-Segmented Mode Switcher */}
                    <div className="px-4">
                        <div className="grid grid-cols-2 p-1 rounded-2xl neumorphic-inset-card h-12">
                            <button
                                type="button"
                                onClick={() => setViewMode('chats')}
                                className={cn(
                                    "h-10 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95",
                                    viewMode === 'chats'
                                        ? "neumorphic-primary text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <MessageCircle className="size-4" />
                                <span>Direct Chats</span>
                                {totalUnreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                                        {totalUnreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('broadcasts')}
                                className={cn(
                                    "h-10 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95",
                                    viewMode === 'broadcasts'
                                        ? "neumorphic-primary text-white shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Megaphone className="size-4" />
                                <span>Announcements</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mode 1: Direct Chats List */}
                {viewMode === 'chats' && (
                    <div className="flex flex-col gap-3 px-4">
                        {/* Directory Contacts Match (When typing a search query) */}
                        {searchQuery.trim().length >= 2 && userSearchResults.length > 0 && (
                            <div className="flex flex-col gap-2 p-3 rounded-3xl bg-primary/5 border border-primary/20">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                        <UserPlus className="size-3" />
                                        <span>Property Directory Matches</span>
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground">{userSearchResults.length} found</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {userSearchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleStartConversationWithUser(user)}
                                            className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-1 border border-divider hover:border-primary/40 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div 
                                                    className="size-9 rounded-full overflow-hidden neumorphic-panel shrink-0 flex items-center justify-center"
                                                    style={{ backgroundColor: user.avatarBgColor || 'var(--surface-3)' }}
                                                >
                                                    {user.avatarUrl ? (
                                                        <Image src={user.avatarUrl} alt="" width={36} height={36} className="object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-high">
                                                            {user.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold text-foreground truncate">{user.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize">{user.role}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 shrink-0"
                                            >
                                                <MessageCircle className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Conversations List */}
                        <div className="flex items-center justify-between px-1 pt-1">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Active Conversations
                            </h3>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                {filteredConversations.length} {filteredConversations.length === 1 ? 'chat' : 'chats'}
                            </span>
                        </div>

                        {loadingChats ? (
                            <div className="flex flex-col gap-2.5 pt-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-20 rounded-3xl neumorphic-panel animate-pulse bg-muted/20" />
                                ))}
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="rounded-[2.5rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center my-4">
                                <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                                    <MessageCircle className="size-7" />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">No conversations found</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                                    {searchQuery ? 'No active conversations match your query.' : 'Connect and chat directly with your residents.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsNewChatModalOpen(true)}
                                    className="mt-4 h-11 px-5 rounded-full neumorphic-primary text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                                >
                                    Start New Chat
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {filteredConversations.map((conv) => {
                                    const other = conv.otherParticipants?.[0];
                                    const name = other?.fullName || 'Resident';
                                    const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
                                    const lastMsg = conv.lastMessage?.content || 'No messages yet';
                                    const hasUnread = (conv.unreadCount || 0) > 0;
                                    const timeLabel = conv.lastMessage?.createdAt 
                                        ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                        : '';

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => handleOpenChat(conv)}
                                            className={cn(
                                                "p-3.5 rounded-3xl neumorphic-panel transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between gap-3",
                                                hasUnread ? "border border-primary/30" : "hover:border-primary/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {/* 48px Contact Avatar */}
                                                <div 
                                                    className="relative size-12 rounded-full overflow-hidden neumorphic-inset-card shrink-0 flex items-center justify-center"
                                                    style={{ backgroundColor: other?.avatarBgColor || 'var(--surface-3)' }}
                                                >
                                                    {other?.avatarUrl ? (
                                                        <Image src={other.avatarUrl} alt={name} fill sizes="48px" className="object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-foreground">
                                                            {initials || 'R'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Text Info */}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-sm font-black text-foreground truncate">{name}</h4>
                                                        <RoleBadge role={(other?.role as BadgeRole) || 'tenant'} />
                                                    </div>
                                                    <p className={cn(
                                                        "text-xs truncate mt-0.5",
                                                        hasUnread ? "font-bold text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {lastMsg}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Meta & Unread Badge */}
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className="text-[10px] font-medium text-muted-foreground">
                                                    {timeLabel}
                                                </span>
                                                {hasUnread && (
                                                    <span className="size-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Mode 2: Announcements / Broadcasts List */}
                {viewMode === 'broadcasts' && (
                    <div className="flex flex-col gap-3 px-4">
                        <div className="flex items-center justify-between px-1 pt-1">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Property Announcements
                            </h3>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                Visible to residents
                            </span>
                        </div>

                        {loadingBroadcasts ? (
                            <div className="flex flex-col gap-2.5 pt-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-28 rounded-3xl neumorphic-panel animate-pulse bg-muted/20" />
                                ))}
                            </div>
                        ) : filteredBroadcasts.length === 0 ? (
                            <div className="rounded-[2.5rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center my-4">
                                <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                                    <Megaphone className="size-7" />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-wider text-foreground">No announcements found</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                                    {searchQuery ? 'No announcements match your search query.' : 'Broadcast urgent notices and updates to your residents.'}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsBroadcastModalOpen(true)}
                                    className="mt-4 h-11 px-5 rounded-full neumorphic-primary text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                                >
                                    Broadcast Notice
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredBroadcasts.map((ann) => (
                                    <div
                                        key={ann.id}
                                        className="neumorphic-extruded rounded-[2rem] p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="neumorphic-inset-card flex size-7 items-center justify-center rounded-xl text-primary shrink-0">
                                                        <Pin className="size-3.5" />
                                                    </div>
                                                    <h4 className="text-sm font-black text-foreground tracking-tight truncate">{ann.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                                        <Building2 className="size-3 shrink-0" />
                                                        <span>{ann.propertyName}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                                                {ann.created_at ? new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <div className="neumorphic-inset-card p-3.5 rounded-2xl">
                                            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal">
                                                {ann.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Floating Action Button (FAB) */}
                <div className="fixed bottom-20 right-4 z-40 max-w-md mx-auto pointer-events-none">
                    {viewMode === 'chats' ? (
                        <button
                            type="button"
                            onClick={() => setIsNewChatModalOpen(true)}
                            className="pointer-events-auto h-12 px-5 rounded-full neumorphic-primary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl active:scale-95 transition-all hover:brightness-105 cursor-pointer"
                        >
                            <UserPlus className="size-4" />
                            <span>New Chat</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="pointer-events-auto h-12 px-5 rounded-full neumorphic-primary text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl active:scale-95 transition-all hover:brightness-105 cursor-pointer"
                        >
                            <Megaphone className="size-4" />
                            <span>Broadcast</span>
                        </button>
                    )}
                </div>

                {/* New Chat Directory Modal Sheet */}
                {isNewChatModalOpen && (
                    <div 
                        className="fixed inset-0 z-[125] bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
                        onClick={() => setIsNewChatModalOpen(false)}
                    >
                        <div 
                            className="bg-surface-1 border-t border-divider rounded-t-[2.5rem] p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-12 h-1.5 bg-disabled/40 rounded-full mx-auto shrink-0 mb-1" />

                            <div className="flex items-center justify-between pb-3 border-b border-divider">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <UserPlus className="size-4" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                                        Start Conversation
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsNewChatModalOpen(false)}
                                    className="size-11 rounded-full flex items-center justify-center text-medium hover:text-high hover:bg-surface-2 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Search input in modal */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search residents by name or role..."
                                    value={newChatSearchQuery}
                                    onChange={(e) => setNewChatSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-11 pr-11 text-xs font-medium text-foreground bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 rounded-2xl placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                />
                                {newChatSearchQuery && (
                                    <button
                                        onClick={() => setNewChatSearchQuery('')}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 size-11 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* Directory Results */}
                            <div className="flex flex-col gap-2 pt-1 pb-4">
                                {isSearchingNewChat ? (
                                    <div className="py-8 flex justify-center">
                                        <div className="size-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                    </div>
                                ) : newChatResults.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">
                                        {newChatSearchQuery.trim().length >= 2 
                                            ? 'No matching users found in directory.' 
                                            : 'Type at least 2 characters to search across properties.'}
                                    </p>
                                ) : (
                                    newChatResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleStartConversationWithUser(user)}
                                            className="flex items-center justify-between p-3 rounded-2xl neumorphic-panel hover:border-primary/40 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div 
                                                    className="size-10 rounded-full overflow-hidden neumorphic-inset-card shrink-0 flex items-center justify-center"
                                                    style={{ backgroundColor: user.avatarBgColor || 'var(--surface-3)' }}
                                                >
                                                    {user.avatarUrl ? (
                                                        <Image src={user.avatarUrl} alt="" width={40} height={40} className="object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-high">
                                                            {user.fullName.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-foreground truncate">{user.fullName}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs active:scale-95 shrink-0"
                                            >
                                                <span>Chat</span>
                                                <MessageCircle className="size-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Broadcast Composer Modal Sheet */}
                {isBroadcastModalOpen && (
                    <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm rounded-[2.5rem] neumorphic-panel p-5 shadow-2xl border border-white/10">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="neumorphic-inset-card flex size-8 items-center justify-center rounded-xl text-primary shrink-0">
                                        <Megaphone className="size-4" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                        Broadcast Notice
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsBroadcastModalOpen(false)}
                                    className="size-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {broadcastSuccess ? (
                                <div className="py-8 text-center flex flex-col items-center gap-2">
                                    <div className="size-12 rounded-2xl neumorphic-inset-card flex items-center justify-center text-emerald-500 mb-1">
                                        <CheckCheck className="size-6" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Announcement Broadcasted!</h4>
                                    <p className="text-[11px] text-muted-foreground">All tenants in the target property will receive this notice.</p>
                                </div>
                            ) : (
                                <form onSubmit={handlePublishBroadcast} className="flex flex-col gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Target Property
                                        </label>
                                        <select
                                            value={broadcastPropertyId}
                                            onChange={(e) => setBroadcastPropertyId(e.target.value)}
                                            className="w-full h-11 px-3.5 text-xs text-foreground bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                        >
                                            <option value="all">All Properties</option>
                                            {properties.map((prop) => (
                                                <option key={prop.id} value={prop.id}>
                                                    {prop.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Announcement Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Scheduled Water Interruption"
                                            value={broadcastTitle}
                                            onChange={(e) => setBroadcastTitle(e.target.value)}
                                            className="w-full h-11 px-3.5 text-xs text-foreground bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Notice Content
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Provide details about the announcement..."
                                            value={broadcastContent}
                                            onChange={(e) => setBroadcastContent(e.target.value)}
                                            className="w-full p-3.5 text-xs text-foreground bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none resize-none leading-relaxed"
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsBroadcastModalOpen(false)}
                                            className="flex-1 h-11 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submittingBroadcast || !broadcastTitle.trim() || !broadcastContent.trim()}
                                            className="flex-1 h-11 rounded-xl neumorphic-primary text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                                        >
                                            {submittingBroadcast ? 'Publishing...' : 'Publish'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
