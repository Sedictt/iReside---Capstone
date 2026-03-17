"use client";

import { useState } from "react";
import { ArrowLeft, Bell, CreditCard, Wrench, MessageSquare, ClipboardCheck, Info, BellOff } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./NotificationsScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
interface Notification {
    id: string;
    type: "payment" | "maintenance" | "message" | "application" | "system";
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "n1",
        type: "payment",
        title: "Payment Received",
        message: "Your rent payment of ₱15,000 for Unit 101 has been confirmed.",
        time: "15 min ago",
        read: false,
    },
    {
        id: "n2",
        type: "message",
        title: "New Message",
        message: "Juan Dela Cruz sent you a message regarding the sink repair.",
        time: "1 hour ago",
        read: false,
    },
    {
        id: "n3",
        type: "maintenance",
        title: "Maintenance Scheduled",
        message: "A technician is scheduled to visit Unit 201 tomorrow at 10:00 AM.",
        time: "3 hours ago",
        read: true,
    },
    {
        id: "n4",
        type: "application",
        title: "Application Updated",
        message: "Maria Santos's application for Metro Studio B has been approved.",
        time: "5 hours ago",
        read: true,
    },
    {
        id: "n5",
        type: "system",
        title: "System Update",
        message: "iReside has been updated to version 1.2.0. Check out the new features!",
        time: "Yesterday",
        read: true,
    }
];

export default function NotificationsScreen() {
    const { goBack } = useNavigation();
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === "all") return true;
        return !n.read;
    });

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

            {/* Scroll Area */}
            <div className={styles.scrollArea}>
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((n) => (
                        <div key={n.id} className={`${styles.notificationItem} ${!n.read ? styles.unread : ""}`}>
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
