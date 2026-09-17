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
    Clock,
    AlertCircle,
    ChevronRight,
    Inbox,
    CheckCircle2,
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
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
    const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

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

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || isClearingAll) return;
        setIsClearingAll(true);
        try {
            await markAllAsRead();
        } finally {
            setIsClearingAll(false);
            setShowMarkAllConfirm(false);
        }
    };

    const handleNotificationClick = async (item: Notification) => {
        if (!item.read) {
            try { await markAsRead(item.id); } catch { /* non-blocking */ }
        }

        const data = (item.data || {}) as Record<string, any>;
        const type = item.type;
        const targetId = data.paymentId || data.invoiceId || data.applicationId || data.maintenanceId || data.ticketId || data.conversationId || data.leaseId || data.id;

        // 1. Direct signing URL (e.g. for lease countersigning)
        if (data.signingUrl) {
            window.location.href = data.signingUrl;
            return;
        }

        // 2. Explicit href or url in notification payload
        if (data.href || data.url) {
            const dest = (data.href || data.url) as string;
            if (dest.startsWith('http://') || dest.startsWith('https://')) {
                window.location.href = dest;
            } else {
                router.push(dest);
            }
            return;
        }

        // 3. Role-based routing
        if (role === 'landlord') {
            switch (type) {
                case 'payment': {
                    const searchParam = data.paymentId || data.invoiceId || data.invoiceNumber || data.transactionReference || data.referenceNumber;
                    if (searchParam) {
                        router.push(`/mobile/landlord/payments?search=${encodeURIComponent(searchParam)}`);
                    } else if (data.workflowStatus === 'review_needed' || data.reviewAction || data.hasProof) {
                        router.push('/mobile/landlord/payments?tab=proofs');
                    } else {
                        router.push('/mobile/landlord/payments');
                    }
                    break;
                }
                case 'maintenance': {
                    if (targetId) {
                        router.push(`/mobile/landlord/tickets?id=${encodeURIComponent(targetId)}`);
                    } else {
                        router.push('/mobile/landlord/tickets');
                    }
                    break;
                }
                case 'message': {
                    if (targetId) {
                        router.push(`/mobile/landlord/messages?conversation=${encodeURIComponent(targetId)}`);
                    } else {
                        router.push('/mobile/landlord/messages');
                    }
                    break;
                }
                case 'application': {
                    const appId = data.applicationId || targetId;
                    if (appId) {
                        router.push(`/landlord/applications?id=${encodeURIComponent(appId)}`);
                    } else {
                        router.push('/landlord/applications');
                    }
                    break;
                }
                case 'lease':
                case 'lease_renewal_request':
                case 'lease_renewal_approved':
                case 'lease_renewal_rejected':
                case 'move_out_approved':
                case 'move_out_denied':
                case 'move_out_inspection_completed':
                case 'move_out_finalized': {
                    // If the notification carries a signing URL, open it directly
                    if (data.signingUrl) {
                        window.location.href = data.signingUrl;
                    } else {
                        // Redirect to Profile page which surfaces the lease details
                        router.push('/mobile/landlord/profile');
                    }
                    break;
                }
                default: {
                    router.push('/mobile/landlord/overview');
                    break;
                }
            }
        } else {
            // Tenant (or default fallback)
            switch (type) {
                case 'payment': {
                    const pId = data.paymentId || data.invoiceId || targetId;
                    if (pId) {
                        router.push(`/mobile/tenant/pay?id=${encodeURIComponent(pId)}`);
                    } else {
                        router.push('/mobile/tenant/pay');
                    }
                    break;
                }
                case 'maintenance': {
                    if (targetId) {
                        router.push(`/mobile/tenant/maintenance?id=${encodeURIComponent(targetId)}`);
                    } else {
                        router.push('/mobile/tenant/maintenance');
                    }
                    break;
                }
                case 'message': {
                    if (targetId) {
                        router.push(`/mobile/tenant/messages?conversation=${encodeURIComponent(targetId)}`);
                    } else {
                        router.push('/mobile/tenant/messages');
                    }
                    break;
                }
                case 'application': {
                    const appId = data.applicationId || targetId;
                    if (appId) {
                        router.push(`/tenant/applications/${encodeURIComponent(appId)}`);
                    } else {
                        router.push('/tenant/applications');
                    }
                    break;
                }
                case 'lease':
                case 'lease_renewal_request':
                case 'lease_renewal_approved':
                case 'lease_renewal_rejected':
                case 'move_out_approved':
                case 'move_out_denied':
                case 'move_out_inspection_completed':
                case 'move_out_finalized': {
                    // If the notification carries a signing URL, open it directly
                    if (data.signingUrl) {
                        window.location.href = data.signingUrl;
                    } else {
                        // Redirect to Profile page which has the Active Lease Details section
                        router.push('/mobile/tenant/profile');
                    }
                    break;
                }
                default: {
                    router.push('/mobile/tenant/home');
                    break;
                }
            }
        }
    };

    const getNotificationVisuals = (type: NotificationType) => {
        switch (type) {
            case 'payment':
                return {
                    icon: CreditCard,
                    iconColor: 'text-emerald-500',
                    badgeStyle: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    badge: 'Payment',
                };
            case 'maintenance':
                return {
                    icon: Wrench,
                    iconColor: 'text-blue-500',
                    badgeStyle: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
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
                    iconColor: 'text-amber-500',
                    badgeStyle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    badge: 'Lease',
                };
            case 'application':
                return {
                    icon: FileCheck,
                    iconColor: 'text-purple-500',
                    badgeStyle: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    badge: 'Application',
                };
            case 'message':
                return {
                    icon: MessageCircle,
                    iconColor: 'text-indigo-500',
                    badgeStyle: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                    badge: 'Message',
                };
            default:
                return {
                    icon: Bell,
                    iconColor: 'text-primary',
                    badgeStyle: 'bg-primary/15 text-primary border-primary/20',
                    badge: 'Notice',
                };
        }
    };

    return (
        <PullToRefresh onRefresh={refresh} className="min-h-full pb-10">
            <div className="px-4 pt-2.5 pb-6 flex flex-col gap-3.5">
                {/* Tabs & Filter Section */}
                <div className="flex flex-col gap-2">
                    {/* Segmented Neumorphic Tab Pills */}
                    <div className="grid grid-cols-3 gap-2 py-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={cn(
                                'py-2.5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer',
                                activeTab === 'all'
                                    ? 'neumorphic-primary text-white shadow-xs'
                                    : 'neumorphic-extruded text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span>All</span>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                                activeTab === 'all' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            )}>
                                {notifications.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unread')}
                            className={cn(
                                'py-2.5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer',
                                activeTab === 'unread'
                                    ? 'neumorphic-primary text-white shadow-xs'
                                    : 'neumorphic-extruded text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span>Unread</span>
                            {unreadCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                                    activeTab === 'unread' ? "bg-white/20 text-white" : "bg-red-500/15 text-red-500"
                                )}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('urgent')}
                            className={cn(
                                'py-2.5 px-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer',
                                activeTab === 'urgent'
                                    ? 'neumorphic-primary text-white shadow-xs'
                                    : 'neumorphic-extruded text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span>Urgent</span>
                            {urgentCount > 0 && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
                                    activeTab === 'urgent' ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-500"
                                )}>
                                    {urgentCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Sub-action bar: Unread indicator & Mark All As Read */}
                    {unreadCount > 0 && (
                        <div className="flex items-center justify-between px-1 pt-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMarkAllConfirm(true)}
                                disabled={isClearingAll}
                                className="neumorphic-extruded flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all cursor-pointer hover:bg-emerald-500/5"
                                title="Mark all notifications as read"
                            >
                                <CheckCheck className="size-3.5 shrink-0" />
                                <span>Mark all as read</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold">
                        <AlertCircle className="size-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            onClick={() => refresh()}
                            className="underline font-bold hover:opacity-80 cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Notifications List */}
                {loading && notifications.length === 0 ? (
                    <div className="space-y-3 pt-1">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="p-4 rounded-[1.75rem] neumorphic-extruded animate-pulse space-y-2.5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-20 bg-muted/60 rounded-lg" />
                                    <div className="h-3 w-12 bg-muted/60 rounded-lg" />
                                </div>
                                <div className="h-4 w-3/4 bg-muted/60 rounded-lg" />
                                <div className="h-3 w-5/6 bg-muted/60 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="neumorphic-panel rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-3.5 shadow-sm my-4">
                        <div className="neumorphic-inset-card flex size-14 items-center justify-center rounded-2xl text-primary shrink-0">
                            {activeTab === 'unread' ? (
                                <CheckCircle2 className="size-7" strokeWidth={1.8} />
                            ) : activeTab === 'urgent' ? (
                                <Sparkles className="size-7" strokeWidth={1.8} />
                            ) : (
                                <Inbox className="size-7" strokeWidth={1.8} />
                            )}
                        </div>
                        <div className="space-y-1 max-w-[250px]">
                            <h3 className="text-sm font-black text-foreground">
                                {activeTab === 'unread'
                                    ? 'All caught up!'
                                    : activeTab === 'urgent'
                                    ? 'No urgent notices'
                                    : 'No notifications yet'}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {activeTab === 'unread'
                                    ? 'You have read all your notifications.'
                                    : activeTab === 'urgent'
                                    ? 'There are no high-priority alerts needing your attention.'
                                    : 'New updates, payment alerts, and announcements will appear here.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((item) => {
                            const visuals = getNotificationVisuals(item.type);
                            const Icon = visuals.icon;
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleNotificationClick(item)}
                                    className={cn(
                                        'group relative p-4 rounded-[1.75rem] transition-all cursor-pointer',
                                        !item.read
                                            ? 'neumorphic-extruded active:scale-[0.99]'
                                            : 'neumorphic-inset-card opacity-85 active:scale-[0.99] hover:opacity-100'
                                    )}
                                >
                                    <div className="flex items-start gap-3.5">
                                        {/* Type Icon with Neumorphic Inset */}
                                        <div className="neumorphic-inset-card flex size-11 items-center justify-center rounded-2xl shrink-0 text-primary">
                                            <Icon className={cn("size-5", visuals.iconColor)} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <span className={cn(
                                                        'text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border',
                                                        visuals.badgeStyle
                                                    )}>
                                                        {visuals.badge}
                                                    </span>
                                                    {!item.read && (
                                                        <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0 animate-pulse" />
                                                    )}
                                                </div>

                                                <span className="text-[10px] font-bold text-muted-foreground/70 flex items-center gap-1 shrink-0 font-mono">
                                                    <Clock className="size-3" />
                                                    {formatTimeAgo(item.created_at)}
                                                </span>
                                            </div>

                                            <h4 className={cn(
                                                'text-xs tracking-tight truncate mb-0.5',
                                                !item.read ? 'font-black text-foreground' : 'font-bold text-foreground/80'
                                            )}>
                                                {item.title}
                                            </h4>

                                            <p className="text-[11px] text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Actions: Delete button & Chevron */}
                                        <div className="flex flex-col items-center justify-between self-stretch shrink-0 -mr-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void deleteNotification(item.id);
                                                }}
                                                className="neumorphic-inset-card flex size-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                                                title="Delete notification"
                                                aria-label="Delete"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                            <ChevronRight className="size-4 text-primary shrink-0 stroke-[2.5] mt-auto transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mark All as Read Confirmation Modal */}
            <MobileConfirmModal
                isOpen={showMarkAllConfirm}
                title="Mark All as Read?"
                description={`Are you sure you want to mark all ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} as read?`}
                confirmLabel="Mark All Read"
                cancelLabel="Cancel"
                variant="success"
                isLoading={isClearingAll}
                icon={<CheckCheck className="size-5" />}
                onConfirm={handleMarkAllRead}
                onCancel={() => !isClearingAll && setShowMarkAllConfirm(false)}
            />
        </PullToRefresh>
    );
}
