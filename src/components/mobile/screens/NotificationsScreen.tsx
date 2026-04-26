"use client";

import { useState } from "react";
import { ArrowLeft, Bell, CreditCard, Wrench, MessageSquare, ClipboardCheck, Info, BellOff } from "lucide-react";
import { useGlobalNotification } from "../NotificationContext";
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

export let MOCK_NOTIFICATIONS: Notification[] = [
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
    const { goBack, navigate, role } = useNavigation();
    const { showNotification } = useGlobalNotification();
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === "all") return true;
        return !n.read;
    });

    const markAllRead = () => {
        MOCK_NOTIFICATIONS.forEach(n => n.read = true);
        setNotifications([...MOCK_NOTIFICATIONS]);
    };

    const handleNotificationClick = (n: Notification) => {
        // Mark as read globally so it persists
        if (!n.read) {
            const index = MOCK_NOTIFICATIONS.findIndex(x => x.id === n.id);
            if (index !== -1) MOCK_NOTIFICATIONS[index].read = true;
            setNotifications([...MOCK_NOTIFICATIONS]);
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
