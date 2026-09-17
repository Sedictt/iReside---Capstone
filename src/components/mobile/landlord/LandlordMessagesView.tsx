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
    Check
} from 'lucide-react';
import { 
    fetchConversations, 
    fetchConversationMessages, 
    fetchConversationPaymentHistory,
    sendConversationMessage,
    uploadConversationFile,
    markConversationAsRead,
    type ConversationSummary, 
    type ConversationMessage,
    type PaymentHistoryEntry 
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
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

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
    const { properties, selectedPropertyId, setSelectedPropertyId } = useProperty();
    
    const [viewMode, setViewMode] = useState<'chats' | 'broadcasts'>('chats');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Active Chat state
    const [activeChat, setActiveChat] = useState<ConversationSummary | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

    // Sidebar Sheets state
    const [showInfoSidebar, setShowInfoSidebar] = useState(false);
    const [showFilesSidebar, setShowFilesSidebar] = useState(false);
    const [fileFilter, setFileFilter] = useState<'media' | 'files'>('media');

    // Modals state
    const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
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

    // Broadcast composer state
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

    // Load conversations
    const loadConversations = async () => {
        try {
            const { data } = await fetchConversations();
            setConversations(data || []);
        } catch (err) {
            console.error('[MobileMessages] Failed to load conversations:', err);
        } finally {
            setLoadingChats(false);
            setRefreshing(false);
        }
    };

    // Load announcements
    const loadBroadcasts = async () => {
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
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        loadBroadcasts();
    }, [selectedPropertyId, properties]);

    const handleRefresh = () => {
        setRefreshing(true);
        if (viewMode === 'chats') {
            loadConversations();
        } else {
            loadBroadcasts();
        }
    };

    // Load payment history
    const loadPaymentHistory = useCallback(async (conversationId: string) => {
        setPaymentHistoryLoading(true);
        try {
            const { data, error } = await fetchConversationPaymentHistory(conversationId, 50);
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

    // Realtime changes for open conversation
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

    // Shared Files
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
            // Upload pending attachments if any
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

    // File input change
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newAttachments: PendingAttachment[] = files.map(file => ({
            id: `att-${Date.now()}-${Math.random()}`,
            file,
            isImage: file.type.startsWith('image/'),
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            status: 'idle',
        }));

        setPendingAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setPendingAttachments(prev => prev.filter(a => a.id !== id));
    };

    // Submit a broadcast announcement
    const handlePublishBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastTitle.trim() || !broadcastContent.trim() || submittingBroadcast) return;

        setSubmittingBroadcast(true);
        try {
            if (broadcastPropertyId === 'all') {
                if (properties.length > 0) {
                    await Promise.all(
                        properties.map((p) =>
                            createAnnouncementPost({
                                title: broadcastTitle.trim(),
                                content: broadcastContent.trim(),
                                propertyId: p.id,
                            })
                        )
                    );
                } else {
                    await createAnnouncementPost({
                        title: broadcastTitle.trim(),
                        content: broadcastContent.trim(),
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

    // IF in active chat view, render the dedicated mobile chat room matching Desktop Styling
    if (activeChat && mounted) {
        return createPortal(
            <div className="fixed inset-0 z-[120] bg-surface-0 flex flex-col max-w-md mx-auto h-[100dvh] overflow-hidden text-high">
                {/* Chat Top Bar - Adapted from Desktop ChatHeader without Report button */}
                <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-surface-1/95 backdrop-blur-md shrink-0 shadow-xs z-20">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveChat(null);
                                setShowInfoSidebar(false);
                                setShowFilesSidebar(false);
                            }}
                            className="p-1.5 -ml-1 rounded-full hover:bg-surface-2 text-medium hover:text-high active:scale-95 transition-all cursor-pointer shrink-0"
                            aria-label="Back to conversations"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        
                        {/* Avatar with Neumorphic Ring */}
                        <div 
                            onClick={() => setShowInfoSidebar(true)}
                            className="relative size-10 rounded-full overflow-hidden neumorphic-inset-card shrink-0 cursor-pointer active:scale-95 transition-transform"
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

                        {/* Name & Unit / Online Status */}
                        <div 
                            onClick={() => setShowInfoSidebar(true)}
                            className="flex flex-col min-w-0 cursor-pointer"
                        >
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-black text-high truncate">{activeContact?.name}</h4>
                                <RoleBadge role={activeContact?.role || 'tenant'} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-medium">
                                <span className="truncate">{activeContact?.unit || 'Resident'}</span>
                                <span className="size-1 rounded-full bg-disabled shrink-0" />
                                <span className="text-disabled shrink-0">Offline</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons: Shared Files (📁) and 3-Dot (⋮) Menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setShowFilesSidebar(!showFilesSidebar);
                                setShowInfoSidebar(false);
                            }}
                            className={cn(
                                "p-2 rounded-xl transition-all active:scale-95",
                                showFilesSidebar 
                                    ? "neumorphic-primary text-white" 
                                    : "text-medium hover:text-high hover:bg-surface-2"
                            )}
                            title="Shared Files"
                            aria-label="Shared Files"
                        >
                            <Folder className="size-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowInfoSidebar(!showInfoSidebar);
                                setShowFilesSidebar(false);
                            }}
                            className={cn(
                                "p-2 rounded-xl transition-all active:scale-95",
                                showInfoSidebar 
                                    ? "neumorphic-primary text-white" 
                                    : "text-medium hover:text-high hover:bg-surface-2"
                            )}
                            title="Conversation Info"
                            aria-label="Conversation Info"
                        >
                            <MoreVertical className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Feed using Desktop MessageList & Neumorphic Cards */}
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

                {/* Pending Attachments Strip */}
                {pendingAttachments.length > 0 && (
                    <div className="px-4 py-2 border-t border-divider bg-surface-1 flex items-center gap-2 overflow-x-auto">
                        {pendingAttachments.map((att) => (
                            <div key={att.id} className="relative size-12 rounded-xl overflow-hidden neumorphic-panel shrink-0 group">
                                {att.isImage && att.previewUrl ? (
                                    <Image src={att.previewUrl} alt="" fill sizes="48px" className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface-2 text-medium">
                                        <FileText className="size-5" />
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                                >
                                    <X className="size-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Input Composer - Exact format from Desktop screenshot */}
                <div className="p-3 border-t border-divider bg-surface-0/95 backdrop-blur-md flex flex-col gap-1.5 shrink-0">
                    <form
                        onSubmit={handleSendMessage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-[2rem] neumorphic-inset-card"
                    >
                        {/* Paperclip Button */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xlsx"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded-full text-medium hover:text-high hover:bg-surface-2 active:scale-95 transition-all cursor-pointer"
                            title="Attach File"
                        >
                            <Paperclip className="size-4" />
                        </button>

                        {/* Textarea */}
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="flex-1 bg-transparent border-none py-2 text-xs text-high placeholder:text-disabled focus:outline-none"
                        />

                        {/* Emoji Button */}
                        <button
                            type="button"
                            onClick={() => setMessageInput(prev => prev + ' 😊')}
                            className="p-1.5 rounded-full text-medium hover:text-high hover:bg-surface-2 active:scale-95 transition-all cursor-pointer"
                            title="Add Emoji"
                        >
                            <Smile className="size-4" />
                        </button>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={(!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage}
                            className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                            aria-label="Send message"
                        >
                            <Send className="size-3.5" />
                        </button>
                    </form>

                    {/* Subtitle Hint */}
                    <div className="text-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-disabled flex items-center justify-center gap-1">
                            <span>✨ Shift+Enter for newline</span>
                        </span>
                    </div>
                </div>

                {/* Conversation Info Mobile Bottom Sheet (Toggled via 3-Dot Button) */}
                {showInfoSidebar && (
                    <div 
                        onClick={() => setShowInfoSidebar(false)}
                        className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 cursor-pointer"
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md mx-auto bg-surface-1 rounded-t-[2.5rem] border-t border-divider shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 cursor-default"
                        >
                            {/* Sheet Header */}
                            <div className="p-4 pb-2 border-b border-divider flex items-center justify-between">
                                <h3 className="text-sm font-black text-high">Conversation Info</h3>
                                <button 
                                    onClick={() => setShowInfoSidebar(false)}
                                    className="p-1.5 rounded-full hover:bg-surface-2 text-medium hover:text-high cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar-premium">
                                {/* Profile Card */}
                                <div className="flex flex-col items-center text-center pt-2">
                                    <div className="relative size-20 rounded-full neumorphic-inset-card overflow-hidden mb-3">
                                        {activeContact?.avatarUrl ? (
                                            <Image src={activeContact.avatarUrl} alt={activeContact.name} fill sizes="80px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-high">
                                                {activeContact?.initials || 'T'}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-base font-black text-high">{activeContact?.name}</h4>
                                    <div className="mt-1"><RoleBadge role={activeContact?.role || 'tenant'} /></div>
                                    <p className="mt-1 text-xs font-medium text-medium">{activeContact?.unit || 'Resident'}</p>
                                </div>

                                {/* Quick Actions 2x2 Grid */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.key}
                                            onClick={() => {
                                                setShowInfoSidebar(false);
                                                setSelectedQuickAction(action.key);
                                            }}
                                            className="flex flex-col items-center gap-2 rounded-2xl neumorphic-inset-card p-3.5 transition-all hover:scale-[1.02] active:scale-95 group text-center"
                                        >
                                            <div className={cn("p-2 rounded-xl transition-colors", action.iconContainerClassName)}>
                                                <action.icon className={cn("size-5", action.iconClassName)} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-high">{action.labelTop}</p>
                                                <p className="text-[10px] font-medium text-medium">{action.labelBottom}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Payment History Section */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Payment History</h5>
                                        <span className="text-[11px] font-black text-primary">Total: ₱{paymentHistoryTotal.toLocaleString()}</span>
                                    </div>

                                    <div className="space-y-2">
                                        {paymentHistoryLoading ? (
                                            <div className="h-16 w-full animate-pulse rounded-2xl bg-surface-2" />
                                        ) : paymentHistory.length === 0 ? (
                                            <p className="text-xs text-disabled text-center py-5 border border-dashed border-divider rounded-2xl italic">
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
                                                        className="flex items-center justify-between p-2.5 rounded-2xl neumorphic-inset-card hover:border-primary/30 transition-all cursor-pointer shadow-xs"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/10 shrink-0">
                                                                <Wallet className="size-3.5 text-emerald-500" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-black text-high truncate max-w-[130px]">
                                                                    {payment.typeLabel || 'Payment'}
                                                                </span>
                                                                <span className="text-[9px] font-medium text-disabled">
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
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl neumorphic-inset-card text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface-3 transition-all active:scale-95"
                                                >
                                                    <span>View Ledger</span>
                                                    <ArrowUpRight className="size-3" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="pt-2 space-y-2 pb-4">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-disabled">Actions</h5>
                                    <button 
                                        onClick={() => {
                                            setShowInfoSidebar(false);
                                            setPendingConfirmAction('archive');
                                        }} 
                                        className="w-full flex items-center justify-between p-3 rounded-2xl neumorphic-inset-card transition-all text-left"
                                    >
                                        <span className="text-xs font-bold text-high">Archive Conversation</span>
                                        <ChevronRight className="size-4 text-disabled" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowInfoSidebar(false);
                                            setPendingConfirmAction('block');
                                        }} 
                                        className="w-full flex items-center justify-between p-3 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all text-left"
                                    >
                                        <span className="text-xs font-bold text-red-500">Block Contact</span>
                                        <AlertTriangle className="size-4 text-red-500/50" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shared Files Mobile Bottom Sheet (Toggled via 📁 Button) */}
                {showFilesSidebar && (
                    <div 
                        onClick={() => setShowFilesSidebar(false)}
                        className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 cursor-pointer"
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md mx-auto bg-surface-1 rounded-t-[2.5rem] border-t border-divider shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 cursor-default"
                        >
                            {/* Header */}
                            <div className="p-4 pb-2 border-b border-divider flex items-center justify-between">
                                <h3 className="text-sm font-black text-high">Shared Files</h3>
                                <button 
                                    onClick={() => setShowFilesSidebar(false)}
                                    className="p-1.5 rounded-full hover:bg-surface-2 text-medium hover:text-high cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="px-4 pt-3 pb-2 flex gap-2">
                                {(['media', 'files'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setFileFilter(tab)}
                                        className={cn(
                                            "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                            fileFilter === tab
                                                ? "neumorphic-primary text-white"
                                                : "text-disabled hover:text-medium bg-surface-2"
                                        )}
                                    >
                                        {tab === 'media' ? 'Photos & Media' : 'Documents'}
                                    </button>
                                ))}
                            </div>

                            {/* Content List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-premium">
                                {sharedFiles.length > 0 ? (
                                    <div className={cn(
                                        "grid gap-2.5",
                                        fileFilter === 'media' ? "grid-cols-3" : "grid-cols-1"
                                    )}>
                                        {sharedFiles.map((file, idx) => (
                                            file.isMedia && fileFilter !== 'files' ? (
                                                <div
                                                    key={file.id || `sm-${idx}`}
                                                    className="aspect-square rounded-xl overflow-hidden neumorphic-panel relative group cursor-pointer bg-surface-2"
                                                    onClick={() => {
                                                        const mediaFiles = sharedFiles.filter(f => f.isMedia).map(f => ({ url: f.url, id: f.id }));
                                                        const index = mediaFiles.findIndex(f => f.id === file.id);
                                                        setPreviewImages(mediaFiles);
                                                        setPreviewImageIndex(index >= 0 ? index : 0);
                                                    }}
                                                >
                                                    <Image src={file.url} fill sizes="33vw" className="object-cover" alt={file.name} />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadFile(file.url, file.name);
                                                            }}
                                                            className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    key={file.id || `sf-${idx}`}
                                                    className="flex items-center gap-3 p-3 rounded-2xl neumorphic-inset-card shadow-xs"
                                                >
                                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                                        <FileText className="size-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black text-high truncate">{file.name}</p>
                                                        <p className="text-[10px] font-medium text-disabled mt-0.5">
                                                            {formatFileSize(file.size)} • {file.timestampLabel}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadFile(file.url, file.name)}
                                                        className="p-2 rounded-xl text-disabled hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                                                        title="Download"
                                                    >
                                                        <Download className="size-4" />
                                                    </button>
                                                </div>
                                            )
                                        ))}
                                    </div>
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

                {/* Modals */}
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
                            className="absolute top-5 right-5 p-2 rounded-full bg-white/20 text-white hover:bg-white/40"
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
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setPendingConfirmAction(null)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-medium hover:bg-surface-2"
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
                                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-primary shadow-sm active:scale-95"
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

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Global Property Selector */}
                <div className="px-4 pt-2.5">
                    <MobilePropertySelector />
                </div>

                {/* Sticky Search & Tabs Bar (Matching Maintenance and Payments Pages) */}
                <div className="sticky top-[calc(var(--mobile-header-height,56px)+env(safe-area-inset-top,0px))] z-30 bg-background/95 backdrop-blur-md pb-2.5 pt-1 flex flex-col gap-2.5 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
                    {/* Search Bar with Neumorphic Inset */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={viewMode === 'chats' ? "SEARCH RESIDENT CONVERSATIONS…" : "SEARCH ANNOUNCEMENTS…"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 w-full rounded-2xl border-none text-[11px] font-black uppercase tracking-wider pl-11 pr-8 focus:outline-none neumorphic-inset placeholder:text-muted-foreground/40 text-foreground"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* View Mode Tabs (Neumorphic Buttons matching Payments & Maintenance tabs) */}
                    <div className="px-4 flex gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('chats')}
                            className={cn(
                                "flex-1 py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                viewMode === 'chats'
                                    ? "neumorphic-primary text-white shadow-xs"
                                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <MessageCircle className="size-3.5" />
                            <span>Direct Chats</span>
                            {totalUnreadCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none flex items-center justify-center",
                                    viewMode === 'chats' ? "bg-white text-primary" : "bg-primary/15 text-primary"
                                )}>
                                    {totalUnreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setViewMode('broadcasts')}
                            className={cn(
                                "flex-1 py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer",
                                viewMode === 'broadcasts'
                                    ? "neumorphic-primary text-white shadow-xs"
                                    : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Megaphone className="size-3.5" />
                            <span>Community Hub</span>
                            {broadcastsList.length > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none flex items-center justify-center",
                                    viewMode === 'broadcasts' ? "bg-white text-primary" : "bg-primary/15 text-primary"
                                )}>
                                    {broadcastsList.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 1. DIRECT CHATS VIEW */}
                {viewMode === 'chats' && (
                    <div className="px-4 flex flex-col gap-3">
                        {loadingChats ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                <span className="text-xs text-muted-foreground font-medium">Loading conversations…</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="rounded-[2rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center shadow-sm my-2">
                                <div className="neumorphic-inset-card flex size-12 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                                    <MessageCircle className="size-6" />
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">No active chats</h4>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {searchQuery ? 'No conversations match your search query.' : 'Direct messages with your residents will appear here.'}
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const other = conv.otherParticipants[0];
                                const name = other?.fullName || 'Tenant';
                                const avatar = other?.avatarUrl || FALLBACK_AVATAR;
                                const hasUnread = conv.unreadCount > 0;

                                return (
                                    <button
                                        key={conv.id}
                                        type="button"
                                        onClick={() => handleOpenChat(conv)}
                                        className="neumorphic-extruded rounded-[1.75rem] p-4 flex items-center gap-3.5 transition-all hover:scale-[1.01] active:scale-[0.98] text-left cursor-pointer w-full"
                                    >
                                        <div className="relative size-12 rounded-2xl overflow-hidden shrink-0 neumorphic-inset-card p-0.5">
                                            <div className="relative w-full h-full rounded-[0.85rem] overflow-hidden">
                                                <Image src={avatar} alt={name} fill sizes="48px" className="object-cover" />
                                            </div>
                                            {hasUnread && (
                                                <span className="absolute top-1 right-1 size-2.5 rounded-full bg-primary ring-2 ring-card" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1.5 mb-1">
                                                <h4 className="text-xs font-black text-foreground tracking-tight truncate">{name}</h4>
                                                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                                                    {conv.lastMessage?.createdAt
                                                        ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                        : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn(
                                                    "text-[11px] truncate leading-tight",
                                                    hasUnread ? "font-bold text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {conv.lastMessage?.content || 'Tap to chat…'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black shrink-0 shadow-xs">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ChevronRight className="size-4 text-muted-foreground/40 shrink-0" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 2. BROADCASTS / COMMUNITY HUB VIEW */}
                {viewMode === 'broadcasts' && (
                    <div className="px-4 flex flex-col gap-3">
                        {/* Compose CTA Button */}
                        <button
                            type="button"
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="w-full py-3 px-4 rounded-2xl neumorphic-primary text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:brightness-105 cursor-pointer"
                        >
                            <Megaphone className="size-4" />
                            <span>Broadcast New Announcement</span>
                        </button>

                        {/* Announcement Feed */}
                        <div className="flex flex-col gap-3 mt-1">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                    Active Announcements
                                </h3>
                                <span className="text-[10px] font-medium text-muted-foreground">Visible to residents</span>
                            </div>

                            {loadingBroadcasts ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                </div>
                            ) : filteredBroadcasts.length === 0 ? (
                                <div className="rounded-[2rem] neumorphic-panel p-8 text-center flex flex-col items-center justify-center shadow-sm my-2">
                                    <div className="neumorphic-inset-card flex size-12 items-center justify-center rounded-2xl text-muted-foreground/50 mb-3">
                                        <Megaphone className="size-6" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-foreground">No announcements found</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        {searchQuery ? 'No announcements match your search query.' : 'Broadcast notices and announcements posted to residents will appear here.'}
                                    </p>
                                </div>
                            ) : (
                                filteredBroadcasts.map((ann) => (
                                    <div
                                        key={ann.id}
                                        className="neumorphic-extruded rounded-[1.75rem] p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col gap-1.5 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="neumorphic-inset-card flex size-6 items-center justify-center rounded-lg text-primary shrink-0">
                                                        <Pin className="size-3" />
                                                    </div>
                                                    <h4 className="text-sm font-black text-foreground tracking-tight truncate">{ann.title}</h4>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                                        <Building2 className="size-2.5 shrink-0" />
                                                        <span>{ann.propertyName}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                                                {ann.created_at ? new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <div className="neumorphic-inset-card p-3.5 rounded-2xl">
                                            <p className="text-[11px] text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal">
                                                {ann.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Broadcast Composer Modal Sheet */}
                {isBroadcastModalOpen && (
                    <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm rounded-[2rem] neumorphic-panel p-5 shadow-2xl border border-white/10">
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
                                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                                    {/* Property Selector */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Target Property
                                        </label>
                                        <select
                                            value={broadcastPropertyId}
                                            onChange={(e) => setBroadcastPropertyId(e.target.value)}
                                            className="w-full bg-background border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
                                        >
                                            <option value="all">All Managed Properties</option>
                                            {properties.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Announcement Title */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Announcement Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Scheduled Water Maintenance"
                                            value={broadcastTitle}
                                            onChange={(e) => setBroadcastTitle(e.target.value)}
                                            required
                                            className="w-full bg-background border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs font-medium"
                                        />
                                    </div>

                                    {/* Announcement Body */}
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                            Message Details
                                        </label>
                                        <textarea
                                            rows={4}
                                            placeholder="Write details for all residents…"
                                            value={broadcastContent}
                                            onChange={(e) => setBroadcastContent(e.target.value)}
                                            required
                                            className="w-full bg-background border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none shadow-xs font-medium"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submittingBroadcast || !broadcastTitle.trim() || !broadcastContent.trim()}
                                        className="w-full py-3 rounded-xl neumorphic-primary text-white font-black text-xs uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 mt-1 cursor-pointer"
                                    >
                                        {submittingBroadcast ? 'Publishing…' : 'Send Broadcast to Residents'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
