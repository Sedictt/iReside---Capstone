'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { 
    MessageSquare, 
    Send, 
    Megaphone, 
    RefreshCw, 
    Search,
    ArrowLeft,
    Calendar,
    CheckCheck,
    Clock,
    Building2,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    fetchConversations, 
    fetchConversationMessages, 
    sendConversationMessage, 
    type ConversationSummary, 
    type ConversationMessage 
} from '@/lib/messages/client';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

export function TenantMessagesView() {
    const { profile } = useAuth();
    const [viewMode, setViewMode] = useState<'chat' | 'broadcasts'>('chat');
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadConversationsAndBroadcasts = async () => {
        try {
            const [convRes, dashRes] = await Promise.all([
                fetchConversations(),
                fetch('/api/tenant/dashboard').then(r => r.ok ? r.json() : null).catch(() => null),
            ]);

            const convList = convRes.data || [];
            setConversations(convList);

            if (dashRes?.announcements) {
                setAnnouncements(dashRes.announcements);
            }
        } catch (err) {
            console.error('[TenantMessages] Error loading data:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    useEffect(() => {
        loadConversationsAndBroadcasts();
    }, []);

    const handleOpenChat = async (conv: ConversationSummary) => {
        setActiveConversation(conv);
        setLoadingMessages(true);
        try {
            const { data } = await fetchConversationMessages(conv.id);
            setMessages(data || []);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            console.error('[TenantMessages] Error loading messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || sending || !activeConversation) return;

        const text = messageInput.trim();
        setMessageInput('');
        setSending(true);

        try {
            const newMsg = await sendConversationMessage(activeConversation.id, text);
            if (newMsg) {
                setMessages((prev) => [
                    ...prev,
                    {
                        ...newMsg,
                        sender: {
                            id: profile?.id || '',
                            fullName: `${profile?.first_name || 'Tenant'} ${profile?.last_name || ''}`.trim(),
                            avatarUrl: profile?.avatar_url || null,
                            avatarBgColor: null,
                            role: 'tenant',
                        }
                    } as ConversationMessage
                ]);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            }
        } catch (err) {
            console.error('[TenantMessages] Send failed:', err);
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter((c) => {
            const p = c.otherParticipants?.[0];
            const name = (p?.fullName || '').toLowerCase();
            const lastMsg = (c.lastMessage?.content || '').toLowerCase();
            return name.includes(q) || lastMsg.includes(q);
        });
    }, [conversations, searchQuery]);

    // If an active chat thread is opened
    if (activeConversation && mounted) {
        const otherParticipant = activeConversation.otherParticipants?.[0];
        const landlordName = otherParticipant?.fullName || 'Property Manager';
        const landlordAvatar = otherParticipant?.avatarUrl || FALLBACK_AVATAR;

        return createPortal(
            <div className="fixed inset-0 z-[120] bg-background flex flex-col max-w-md mx-auto h-[100dvh]">
                {/* Active Chat Header */}
                <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-card/95 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            type="button"
                            onClick={() => setActiveConversation(null)}
                            className="p-1.5 -ml-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
                            aria-label="Back to conversations"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div className="relative size-9 rounded-full overflow-hidden border border-primary/30 bg-muted shrink-0">
                            <Image src={landlordAvatar} alt={landlordName} fill sizes="36px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground truncate">{landlordName}</h3>
                            <span className="text-[10px] text-muted-foreground capitalize truncate block">
                                {otherParticipant?.role || 'Property Management'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 mobile-scroll">
                    {loadingMessages ? (
                        <div className="py-12 flex justify-center">
                            <div className="size-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center shadow-xs my-6">
                            <MessageSquare className="size-7 text-muted-foreground/50 mx-auto mb-1.5" />
                            <h4 className="text-xs font-bold text-foreground">Direct Message Thread</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Send a message below to contact your landlord directly.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.senderId === profile?.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        'flex flex-col max-w-[82%]',
                                        isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
                                            isMine
                                                ? 'bg-primary text-primary-foreground rounded-br-xs shadow-xs'
                                                : 'bg-white dark:bg-card border border-slate-200/90 dark:border-white/10 text-foreground rounded-bl-xs shadow-xs'
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

                {/* Message Input Bar */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-3 border-t border-slate-200/90 dark:border-white/10 bg-card/95 backdrop-blur-md flex items-center gap-2 shrink-0"
                >
                    <input
                        type="text"
                        placeholder="Message your landlord…"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim() || sending}
                        className="p-2 rounded-xl bg-primary text-primary-foreground hover:brightness-105 active:scale-95 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
                        aria-label="Send message"
                    >
                        <Send className="size-4" />
                    </button>
                </form>
            </div>,
            document.body
        );
    }

    // Default: Inbox List view
    return (
        <div className="flex flex-col gap-3 pb-3">
            {/* View Mode Switcher */}
            <div className="px-4 flex gap-2 shrink-0">
                <button
                    onClick={() => setViewMode('chat')}
                    className={cn(
                        "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5",
                        viewMode === 'chat'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                    )}
                >
                    <MessageSquare className="size-3.5" />
                    <span>Direct Chats</span>
                </button>

                <button
                    onClick={() => setViewMode('broadcasts')}
                    className={cn(
                        "flex-1 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-1.5",
                        viewMode === 'broadcasts'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                    )}
                >
                    <Megaphone className="size-3.5" />
                    <span>Noticeboard</span>
                </button>
            </div>

            {viewMode === 'chat' ? (
                <PullToRefresh onRefresh={loadConversationsAndBroadcasts}>
                    <div className="flex flex-col gap-2.5 px-4 pb-3">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search conversations…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                            />
                        </div>

                        {/* Conversations List */}
                        {loadingConversations ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-2">
                                <div className="size-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
                                <span className="text-xs text-muted-foreground">Loading conversations…</span>
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-8 text-center flex flex-col items-center justify-center shadow-xs my-2">
                                <MessageSquare className="size-8 text-muted-foreground/50 mb-2" />
                                <h4 className="text-xs font-bold text-foreground">No message threads yet</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                                    When your landlord or property management contacts you, your conversations will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {filteredConversations.map((conv) => {
                                    const otherParticipant = conv.otherParticipants?.[0];
                                    const name = otherParticipant?.fullName || 'Property Manager';
                                    const avatar = otherParticipant?.avatarUrl || FALLBACK_AVATAR;
                                    const lastMsg = conv.lastMessage?.content || 'No messages yet';
                                    const time = conv.lastMessage?.createdAt 
                                        ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                        : '';

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => handleOpenChat(conv)}
                                            className="p-3 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all hover:border-primary/40"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="relative size-11 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 bg-muted shrink-0">
                                                    <Image src={avatar} alt={name} fill sizes="44px" className="object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className="text-xs font-bold text-foreground truncate">{name}</h4>
                                                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-tight bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                                            {otherParticipant?.role || 'Landlord'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5 max-w-[210px]">
                                                        {lastMsg}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                                                <span className="text-[10px] text-muted-foreground">{time}</span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black min-w-[16px] text-center">
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
                </PullToRefresh>
            ) : (
                /* Broadcast Notices Tab */
                <PullToRefresh onRefresh={loadConversationsAndBroadcasts}>
                    <div className="flex flex-col gap-2.5 px-4 pb-3">
                        {announcements.length === 0 ? (
                            <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center shadow-xs">
                                <Megaphone className="size-8 text-muted-foreground/50 mx-auto mb-2" />
                                <h4 className="text-xs font-bold text-foreground">No Building Notices</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Announcements from your landlord will appear here.
                                </p>
                            </div>
                        ) : (
                            announcements.map((ann) => (
                                <div
                                    key={ann.id}
                                    className="p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-xs font-bold text-foreground truncate">{ann.title}</h4>
                                        <span className="text-[9px] text-muted-foreground flex items-center gap-1 shrink-0">
                                            <Calendar className="size-3" />
                                            {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {ann.message}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </PullToRefresh>
            )}
        </div>
    );
}
