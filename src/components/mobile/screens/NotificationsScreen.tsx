"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Bell, CreditCard, Wrench, MessageSquare, ClipboardCheck, Info, BellOff } from "lucide-react";
import { useGlobalNotification } from "../NotificationContext";
import { useNavigation } from "../navigation";
import { useNotifications } from "@/lib/hooks/useNotifications";
import type { Notification as DbNotification } from "@/types/database";
import styles from "./NotificationsScreen.module.css";

type NotificationType = "payment" | "maintenance" | "message" | "application" | "system";

const typeToRoute: Record<string, { landlord: string; tenant: string; landlordParams?: Record<string, string> }> = {
    payment: { landlord: "activity", tenant: "payments", landlordParams: { tab: "invoices" } },
    maintenance: { landlord: "activity", tenant: "inbox", landlordParams: { tab: "maintenance" } },
    message: { landlord: "inbox", tenant: "inbox", landlordParams: { tab: "messages" } },
    application: { landlord: "activity", tenant: "applicationTracker", landlordParams: { tab: "applications" } },
    announcement: { landlord: "inbox", tenant: "inbox", landlordParams: { tab: "community" } },
};

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getIcon(type: string) {
    switch (type) {
        case "payment": return <CreditCard size={20} />;
        case "maintenance": return <Wrench size={20} />;
        case "message": return <MessageSquare size={20} />;
        case "application": return <ClipboardCheck size={20} />;
        default: return <Info size={20} />;
    }
}

function getIconClass(type: string) {
    switch (type) {
        case "payment": return styles.iconPayment;
        case "maintenance": return styles.iconMaintenance;
        case "message": return styles.iconMessage;
        case "application": return styles.iconApplication;
        default: return styles.iconSystem;
    }
}

export default function NotificationsScreen({ isSubView = false }: { isSubView?: boolean }) {
    const { goBack, navigate, role } = useNavigation();
    const { showNotification } = useGlobalNotification();
    const { notifications: dbNotifications, loading, markAsRead, markAllAsRead } = useNotifications();
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    const filteredNotifications = useMemo(() => {
        if (activeTab === "all") return dbNotifications;
        return dbNotifications.filter((n) => !n.read);
    }, [dbNotifications, activeTab]);

    const handleNotificationClick = (n: DbNotification) => {
        if (!n.read) {
            markAsRead(n.id);
        }

        const route = typeToRoute[n.type];
        if (route) {
            if (role === "landlord") {
                navigate(route.landlord as any, route.landlordParams as any);
            } else {
                navigate(route.tenant as any);
            }
        }
    };

    return (
        <div className={styles.container}>
            {!isSubView && (
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backButton} onClick={goBack}>
                            <ArrowLeft />
                        </button>
                        <h1 className={styles.headerTitle}>Notifications</h1>
                        <button className={styles.markAllRead} onClick={markAllAsRead}>
                            Mark all read
                        </button>
                    </div>

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                            onClick={() => setActiveTab("all")}
                        > All </button>
                        <button
                            className={`${styles.tab} ${activeTab === "unread" ? styles.active : ""}`}
                            onClick={() => setActiveTab("unread")}
                        > Unread {dbNotifications.filter(n => !n.read).length > 0 && `(${dbNotifications.filter(n => !n.read).length})`} </button>
                    </div>
                </div>
            )}

            {isSubView && (
                <div className={styles.tabs} style={{ padding: '0 20px 12px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px' }}>
                     <button
                        className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                        onClick={() => setActiveTab("all")}
                    > All </button>
                    <button
                        className={`${styles.tab} ${activeTab === "unread" ? styles.active : ""}`}
                        onClick={() => setActiveTab("unread")}
                    > Unread {dbNotifications.filter(n => !n.read).length > 0 && `(${dbNotifications.filter(n => !n.read).length})`} </button>
                </div>
            )}

            <div className={styles.scrollArea}>
                <button
                   onClick={() => showNotification({
                       title: "New Maintenance Alert",
                       message: "The repairman is on the way to Unit 4B. Please ensure access is provided.",
                       type: "success"
                   })}
                   style={{
                       width: '100%',
                       padding: '12px',
                       background: 'rgba(109, 152, 56, 0.1)',
                       border: '1px dashed #6d9838',
                       borderRadius: '16px',
                       color: '#6d9838',
                       fontSize: '13px',
                       fontWeight: 800,
                       marginBottom: '20px',
                       cursor: 'pointer'
                   }}
                >
                    ⚡ Simulate Push Notification
                </button>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Bell size={64} />
                        </div>
                        <h2 className={styles.emptyText}>Loading...</h2>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((n) => (
                        <div
                            key={n.id}
                            className={`${styles.notificationItem} ${!n.read ? styles.unread : ""}`}
                            onClick={() => handleNotificationClick(n)}
                        >
                            <div className={`${styles.iconContainer} ${getIconClass(n.type)}`}>
                                {getIcon(n.type)}
                            </div>
                            <div className={styles.content}>
                                <div className={styles.title}>{n.title}</div>
                                <div className={styles.message}>{n.message}</div>
                                <div className={styles.time}>{formatTime(n.created_at)}</div>
                            </div>
                            {!n.read && <div className={styles.unreadDot} />}
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <BellOff size={64} />
                        </div>
                        <h2 className={styles.emptyText}>All caught up!</h2>
                        <p className={styles.emptySub}>No new notifications at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}