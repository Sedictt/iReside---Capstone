'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    CreditCard,
    Wrench,
    FileText,
    MessageCircle,
    FileCheck,
    CheckCheck,
    Trash2,
    Sparkles,
    RefreshCw,
    Clock,
    AlertCircle,
    ChevronRight,
    Inbox,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types/database';

function formatTimeAgo(value: string) {
    const timestamp = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
        return 'Recently';
    }

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.floor(diffMs / minute));
        return `${minutes}m ago`;
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour));
        return `${hours}h ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days === 1) {
        return 'Yesterday';
    }

    if (days < 7) {
        return `${days}d ago`;
    }

    return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

const IMPORTANT_TYPES: NotificationType[] = [
    'lease',
    'lease_renewal_request',
    'payment',
    'maintenance',
    'application',
];

export function MobileNotificationsView() {
    const {
        notifications,
        unreadCount,
        urgentCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    } = useNotifications();

    const { profile } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'urgent'>('all');
    const [isClearingAll, setIsClearingAll] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const role = profile?.role as 'tenant' | 'landlord' | undefined;

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        if (activeTab === 'unread') {
            return notifications.filter((n) => !n.read);
        }
        if (activeTab === 'urgent') {
            return notifications.filter((n) => IMPORTANT_TYPES.includes(n.type) && !n.read);
        }
        return notifications;
    }, [notifications, activeTab]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || isClearingAll) return;
        setIsClearingAll(true);
        try {
            await markAllAsRead();
        } finally {
            setIsClearingAll(false);
        }
    };

    const handleNotificationClick = async (item: Notification) => {
        if (!item.read) {
            await markAsRead(item.id);
        }

        const data = (item.data || {}) as Record<string, any>;
        const type = item.type;

        if (role === 'tenant') {
            switch (type) {
                case 'payment':
                    router.push('/mobile/tenant/pay');
                    break;
                case 'maintenance':
                    router.push('/mobile/tenant/maintenance');
                    break;
                case 'message':
                    router.push('/mobile/tenant/messages');
                    break;
                default:
                    router.push('/mobile/tenant/home');
                    break;
            }
        } else if (role === 'landlord') {
            switch (type) {
                case 'payment':
                    router.push('/mobile/landlord/payments');
                    break;
                case 'maintenance':
                    router.push('/mobile/landlord/tickets');
                    break;
                case 'message':
                    router.push('/mobile/landlord/messages');
                    break;
                default:
                    router.push('/mobile/landlord/overview');
                    break;
            }
        }
    };

    const getNotificationVisuals = (type: NotificationType) => {
        switch (type) {
            case 'payment':
                return {
                    icon: CreditCard,
                    bgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    badge: 'Payment',
                };
            case 'maintenance':
                return {
                    icon: Wrench,
                    bgClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    badge: 'Maintenance',
                };
            case 'lease':
            case 'lease_renewal_request':
            case 'lease_renewal_approved':
            case 'lease_renewal_rejected':
            case 'move_out_approved':
            case 'move_out_denied':
            case 'move_out_inspection_completed':
            case 'move_out_finalized':
                return {
                    icon: FileText,
                    bgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    badge: 'Lease',
                };
            case 'application':
                return {
                    icon: FileCheck,
                    bgClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    badge: 'Application',
                };
            case 'message':
                return {
                    icon: MessageCircle,
                    bgClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                    badge: 'Message',
                };
            default:
                return {
                    icon: Bell,
                    bgClass: 'bg-[#5e9a7a]/10 text-[#5e9a7a] border-[#5e9a7a]/20',
                    badge: 'Notice',
                };
        }
    };

    return (
        <PullToRefresh onRefresh={refresh} className="min-h-full pb-10">
            <div className="px-4 py-3 space-y-4">
                {/* Tabs & Controls */}
                <div className="flex items-center justify-between gap-2">
                    {/* Tab pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-medium">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg transition-all',
                                activeTab === 'all'
                                    ? 'bg-background text-foreground shadow-sm font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                                activeTab === 'unread'
                                    ? 'bg-background text-foreground shadow-sm font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span>Unread</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('urgent')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                                activeTab === 'urgent'
                                    ? 'bg-background text-foreground shadow-sm font-semibold'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span>Urgent</span>
                            {urgentCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    {urgentCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Actions: Mark all read & manual refresh */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing || loading}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Refresh notifications"
                            aria-label="Refresh"
                        >
                            <RefreshCw
                                size={16}
                                className={cn((isRefreshing || loading) && 'animate-spin')}
                            />
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={isClearingAll}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#5e9a7a] hover:bg-[#5e9a7a]/10 transition-colors"
                                title="Mark all notifications as read"
                            >
                                <CheckCheck size={15} />
                                <span className="hidden sm:inline">Mark all read</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs">
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            onClick={() => refresh()}
                            className="underline font-semibold hover:opacity-80"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Notifications List */}
                {loading && notifications.length === 0 ? (
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="p-3.5 rounded-2xl border border-slate-300 dark:border-white/15 bg-card/50 animate-pulse space-y-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-muted rounded" />
                                    <div className="h-3 w-12 bg-muted rounded" />
                                </div>
                                <div className="h-4 w-3/4 bg-muted rounded" />
                                <div className="h-3 w-5/6 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#5e9a7a]/10 border border-[#5e9a7a]/20 flex items-center justify-center text-[#5e9a7a]">
                            {activeTab === 'unread' ? (
                                <CheckCircle2 size={26} strokeWidth={1.8} />
                            ) : activeTab === 'urgent' ? (
                                <Sparkles size={26} strokeWidth={1.8} />
                            ) : (
                                <Inbox size={26} strokeWidth={1.8} />
                            )}
                        </div>
                        <div className="space-y-1 max-w-[240px]">
                            <h3 className="text-sm font-semibold text-foreground">
                                {activeTab === 'unread'
                                    ? 'All caught up!'
                                    : activeTab === 'urgent'
                                    ? 'No urgent notices'
                                    : 'No notifications yet'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {activeTab === 'unread'
                                    ? 'You have read all your notifications.'
                                    : activeTab === 'urgent'
                                    ? 'There are no high-priority alerts needing your attention.'
                                    : 'New updates, payment alerts, and announcements will appear here.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredNotifications.map((item) => {
                            const visuals = getNotificationVisuals(item.type);
                            const Icon = visuals.icon;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={cn(
                                        'group relative p-3.5 rounded-2xl border transition-all cursor-pointer',
                                        'border-slate-300 dark:border-white/15',
                                        !item.read
                                            ? 'bg-card shadow-sm hover:border-[#5e9a7a]/40'
                                            : 'bg-card/60 opacity-85 hover:opacity-100 hover:bg-card'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Type Icon Badge */}
                                        <div
                                            className={cn(
                                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5',
                                                visuals.bgClass
                                            )}
                                        >
                                            <Icon size={18} strokeWidth={2} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex items-center justify-between gap-1.5 mb-1">
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span
                                                        className={cn(
                                                            'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border',
                                                            visuals.bgClass
                                                        )}
                                                    >
                                                        {visuals.badge}
                                                    </span>
                                                    {!item.read && (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                    )}
                                                </div>

                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0 font-mono">
                                                    <Clock size={11} />
                                                    {formatTimeAgo(item.created_at)}
                                                </span>
                                            </div>

                                            <h4
                                                className={cn(
                                                    'text-xs tracking-tight truncate mb-0.5',
                                                    !item.read
                                                        ? 'font-bold text-foreground'
                                                        : 'font-medium text-foreground/90'
                                                )}
                                            >
                                                {item.title}
                                            </h4>

                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Actions: Delete button & Chevron */}
                                        <div className="flex flex-col items-center justify-between self-stretch shrink-0 -mr-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void deleteNotification(item.id);
                                                }}
                                                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                title="Delete notification"
                                                aria-label="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ChevronRight
                                                size={14}
                                                className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
