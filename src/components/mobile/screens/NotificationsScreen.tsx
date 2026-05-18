"use client";

import { useState } from "react";
import { ArrowLeft, Bell, CreditCard, Wrench, MessageSquare, ClipboardCheck, Info, BellOff } from "lucide-react";
import { useGlobalNotification } from "../NotificationContext";
import { useNavigation } from "../navigation";
import styles from "./NotificationsScreen.module.css";

// ─── Types ──────────────────────────────────────────────────
interface Notification {
    id: string;
    type: "payment" | "maintenance" | "message" | "application" | "system";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

export default function NotificationsScreen({ isSubView = false }: { isSubView?: boolean }) {
    const { goBack, navigate, role } = useNavigation();
    const { showNotification } = useGlobalNotification();
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === "all") return true;
        return !n.read;
    });

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.read) {
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        }

        // Route to specific areas based on role and notification type
        if (role === "landlord") {
            switch (n.type) {
                case "payment": navigate("activity", { tab: "invoices" }); break;
                case "maintenance": navigate("activity", { tab: "maintenance" }); break;
                case "message": navigate("inbox", { tab: "messages" }); break;
                case "application": navigate("activity", { tab: "applications" }); break;
            }
        } else {
            switch (n.type) {
                case "payment": navigate("payments"); break;
                case "maintenance": navigate("inbox", { tab: "messages" }); break;
                case "message": navigate("inbox", { tab: "messages" }); break;
                case "application": navigate("applicationTracker"); break;
            }
        }
    };

    const getIcon = (type: Notification["type"]) => {
        switch (type) {
            case "payment": return <CreditCard size={20} />;
            case "maintenance": return <Wrench size={20} />;
            case "message": return <MessageSquare size={20} />;
            case "application": return <ClipboardCheck size={20} />;
            case "system": return <Info size={20} />;
        }
    };

    const getIconClass = (type: Notification["type"]) => {
        switch (type) {
            case "payment": return styles.iconPayment;
            case "maintenance": return styles.iconMaintenance;
            case "message": return styles.iconMessage;
            case "application": return styles.iconApplication;
            case "system": return styles.iconSystem;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            {!isSubView && (
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <button className={styles.backButton} onClick={goBack}>
                            <ArrowLeft />
                        </button>
                        <h1 className={styles.headerTitle}>Notifications</h1>
                        <button className={styles.markAllRead} onClick={markAllRead}>
                            Mark all read
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button 
                            className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                            onClick={() => setActiveTab("all")}
                        > All </button>
                        <button 
                            className={`${styles.tab} ${activeTab === "unread" ? styles.active : ""}`}
                            onClick={() => setActiveTab("unread")}
                        > Unread {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`} </button>
                    </div>
                </div>
            )}

            {/* Sub-view Header (Alternative) */}
            {isSubView && (
                <div className={styles.tabs} style={{ padding: '0 20px 12px', borderBottom: '1px solid #1a1a1a', marginBottom: '16px' }}>
                     <button 
                        className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                        onClick={() => setActiveTab("all")}
                    > All </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "unread" ? styles.active : ""}`}
                        onClick={() => setActiveTab("unread")}
                    > Unread {notifications.filter(n => !n.read).length > 0 && `(${notifications.filter(n => !n.read).length})`} </button>
                </div>
            )}

            {/* Scroll Area */}
            <div className={styles.scrollArea}>
                {/* Simulation Trigger */}
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

                {filteredNotifications.length > 0 ? (
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
                                <div className={styles.time}>{n.time}</div>
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
