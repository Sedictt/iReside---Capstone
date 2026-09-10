'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
    AlertCircle
} from 'lucide-react';
import { 
    fetchConversations, 
    fetchConversationMessages, 
    sendConversationMessage,
    type ConversationSummary, 
    type ConversationMessage 
} from '@/lib/messages/client';
import { createAnnouncementPost } from '@/lib/community/actions';
import { cn } from '@/lib/utils';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

export function LandlordMessagesView() {
    const { profile } = useAuth();
    const { properties, selectedPropertyId } = useProperty();
    
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Broadcast composer state
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastContent, setBroadcastContent] = useState('');
    const [broadcastPropertyId, setBroadcastPropertyId] = useState(selectedPropertyId || 'all');
    const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);
    const [broadcastsList, setBroadcastsList] = useState<Array<{ id: string; title: string; content: string; created_at: string; is_pinned?: boolean }>>([]);
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
            const res = await fetch(`/api/community?type=announcement`);
            if (res.ok) {
                const data = await res.json();
                setBroadcastsList(data.posts || []);
            }
        } catch {
            // fallback
        } finally {
            setLoadingBroadcasts(false);
        }
    };

    useEffect(() => {
        loadConversations();
        loadBroadcasts();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        if (viewMode === 'chats') {
            loadConversations();
        } else {
            loadBroadcasts();
            setRefreshing(false);
        }
    };

    // Open chat and load messages
    const handleOpenChat = async (conv: ConversationSummary) => {
        setActiveChat(conv);
        setLoadingMessages(true);
        try {
            const { data } = await fetchConversationMessages(conv.id);
            setMessages(data || []);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Send a message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChat || !messageInput.trim() || sendingMessage) return;

        const text = messageInput.trim();
        setMessageInput('');
        setSendingMessage(true);

        try {
            const newMsg = await sendConversationMessage(activeChat.id, text);
            if (newMsg) {
                setMessages((prev) => [
                    ...prev,
                    {
                        ...newMsg,
                        sender: {
                            id: profile?.id || '',
                            fullName: `${profile?.first_name || 'Landlord'} ${profile?.last_name || ''}`.trim(),
                            avatarUrl: profile?.avatar_url || null,
                            avatarBgColor: null,
                            role: 'landlord',
                        },
                    } as ConversationMessage,
                ]);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    // Submit a broadcast announcement
    const handlePublishBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastTitle.trim() || !broadcastContent.trim() || submittingBroadcast) return;

        setSubmittingBroadcast(true);
        try {
            const propId = broadcastPropertyId === 'all' 
                ? (properties[0]?.id || undefined)
                : broadcastPropertyId;

            await createAnnouncementPost({
                title: broadcastTitle.trim(),
                content: broadcastContent.trim(),
                propertyId: propId,
            });

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
        return conversations.filter((c) => {
            const other = c.otherParticipants[0];
            const name = other?.fullName || 'Tenant';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery]);

    // IF in active chat view, render the dedicated mobile chat room
    if (activeChat && mounted) {
        const otherParticipant = activeChat.otherParticipants[0];
        const participantName = otherParticipant?.fullName || 'Tenant';
        const avatarUrl = otherParticipant?.avatarUrl || FALLBACK_AVATAR;

        return createPortal(
            <div className="fixed inset-0 z-[120] bg-background flex flex-col max-w-md mx-auto h-[100dvh]">
                {/* Chat Top Bar */}
                <div className="px-4 py-3 border-b border-slate-200/90 dark:border-white/10 flex items-center justify-between bg-card/95 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveChat(null)}
                            className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
                            aria-label="Back to conversations"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div className="relative size-9 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-muted shrink-0">
                            <Image src={avatarUrl} alt={participantName} fill sizes="36px" className="object-cover" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-foreground">{participantName}</h3>
                            <span className="text-[10px] text-muted-foreground capitalize">{otherParticipant?.role || 'Tenant'}</span>
                        </div>
                    </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 mobile-scroll">
                    {loadingMessages ? (
                        <div className="py-12 flex justify-center">
                            <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground text-xs">
                            No messages yet. Send a greeting to start the conversation.
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.senderId === profile?.id || msg.sender?.role === 'landlord';

                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        'flex flex-col max-w-[80%]',
                                        isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
                                            isMine
                                                ? 'bg-primary text-primary-foreground rounded-br-xs shadow-xs'
                                                : 'bg-card border border-slate-200/90 dark:border-white/10 text-foreground rounded-bl-xs shadow-xs'
                                        )}
                                    >
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                                        {msg.createdAt
                                            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : ''}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-slate-200/90 dark:border-white/10 bg-card/90 backdrop-blur-md flex items-center gap-2"
                >
                    <input
                        type="text"
                        placeholder="Type a message…"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 bg-background/80 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim() || sendingMessage}
                        className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 active:scale-95 transition-all shadow-xs"
                        aria-label="Send message"
                    >
                        <Send className="size-4" />
                    </button>
                </form>
            </div>,
            document.body
        );
    }

    return (
        <div className="flex flex-col gap-3 pb-3">
            {/* View Mode Tabs */}
            <div className="px-4 pt-1 flex gap-2">
                <button
                    onClick={() => setViewMode('chats')}
                    className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5",
                        viewMode === 'chats'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                    )}
                >
                    <MessageCircle className="size-3.5" />
                    <span>Direct Chats</span>
                </button>

                <button
                    onClick={() => setViewMode('broadcasts')}
                    className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5",
                        viewMode === 'broadcasts'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                    )}
                >
                    <Megaphone className="size-3.5" />
                    <span>Broadcasts</span>
                </button>
            </div>

            {/* DIRECT CHATS VIEW */}
            {viewMode === 'chats' && (
                <>
                    {/* Search Bar */}
                    <div className="px-4 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search tenant conversations…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="px-4 flex flex-col gap-2">
                        {loadingChats ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                <span className="text-xs text-muted-foreground">Loading conversations…</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-8 text-center flex flex-col items-center justify-center shadow-xs">
                                <MessageCircle className="size-8 text-muted-foreground/50 mb-2" />
                                <h4 className="text-xs font-bold text-foreground">No active chats</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Direct messages with your residents will appear here.
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
                                        onClick={() => handleOpenChat(conv)}
                                        className="w-full p-3 rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 hover:bg-card active:scale-[0.98] transition-all flex items-center gap-3 text-left shadow-xs"
                                    >
                                        <div className="relative size-11 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-muted shrink-0">
                                            <Image src={avatar} alt={name} fill sizes="44px" className="object-cover" />
                                            {hasUnread && (
                                                <div className="absolute bottom-0 right-0 size-3 rounded-full bg-primary border-2 border-card" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <h4 className="text-xs font-bold text-foreground truncate">{name}</h4>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {conv.lastMessage?.createdAt
                                                        ? new Date(conv.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                        : ''}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-[11px] truncate",
                                                hasUnread ? "font-bold text-foreground" : "text-muted-foreground"
                                            )}>
                                                {conv.lastMessage?.content || 'Tap to chat…'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* BROADCASTS VIEW */}
            {viewMode === 'broadcasts' && (
                <div className="px-4 flex flex-col gap-3">
                    {/* Compose CTA Button */}
                    <button
                        onClick={() => setIsBroadcastModalOpen(true)}
                        className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-tight flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all hover:brightness-105"
                    >
                        <Megaphone className="size-4" />
                        <span>Broadcast New Announcement</span>
                    </button>

                    {/* Announcement Feed */}
                    <div className="flex flex-col gap-2.5 mt-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                Active Announcements
                            </h3>
                            <span className="text-[10px] text-muted-foreground">Visible to all residents</span>
                        </div>

                        {loadingBroadcasts ? (
                            <div className="py-8 flex justify-center">
                                <div className="w-6 h-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            </div>
                        ) : broadcastsList.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-card/70 dark:bg-card/50 p-6 text-center">
                                <p className="text-xs text-muted-foreground">No broadcast announcements posted yet.</p>
                            </div>
                        ) : (
                            broadcastsList.map((ann) => (
                                <div
                                    key={ann.id}
                                    className="p-3.5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col gap-1.5 relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <Pin className="size-3 text-primary" />
                                            <h4 className="text-xs font-black text-foreground">{ann.title}</h4>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">
                                        {ann.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Broadcast Composer Modal Sheet */}
            {isBroadcastModalOpen && (
                <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-[1.75rem] border border-slate-200 dark:border-white/10 bg-card/95 backdrop-blur-xl p-5 shadow-2xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-white/10 mb-3.5">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
                                    <Megaphone className="size-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
                                    Broadcast Notice
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsBroadcastModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {broadcastSuccess ? (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <CheckCheck className="size-5" />
                                </div>
                                <h4 className="text-xs font-bold text-foreground">Announcement Broadcasted!</h4>
                                <p className="text-[11px] text-muted-foreground">All tenants will receive this notice.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePublishBroadcast} className="flex flex-col gap-3">
                                {/* Property Selector */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                                        Target Property
                                    </label>
                                    <select
                                        value={broadcastPropertyId}
                                        onChange={(e) => setBroadcastPropertyId(e.target.value)}
                                        className="w-full bg-background border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                    >
                                        <option value="all">All Managed Properties</option>
                                        {properties.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Announcement Title */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                                        Announcement Title
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Scheduled Water Maintenance"
                                        value={broadcastTitle}
                                        onChange={(e) => setBroadcastTitle(e.target.value)}
                                        required
                                        className="w-full bg-background border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                    />
                                </div>

                                {/* Announcement Body */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                                        Message Details
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Write details for all residents…"
                                        value={broadcastContent}
                                        onChange={(e) => setBroadcastContent(e.target.value)}
                                        required
                                        className="w-full bg-background border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none shadow-xs"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingBroadcast || !broadcastTitle.trim() || !broadcastContent.trim()}
                                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-tight shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 mt-1"
                                >
                                    {submittingBroadcast ? 'Publishing…' : 'Send Broadcast to Residents'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
