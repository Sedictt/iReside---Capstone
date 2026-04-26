"use client";

import {
    Bell,
    CreditCard,
    FileText,
    Wrench,
    MessageSquare,
    Heart,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    Megaphone,
    ChevronRight,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantHomeScreen.module.css";
import { MOCK_NOTIFICATIONS } from "./NotificationsScreen";
import AnimatedCounter from "../ui/AnimatedCounter";
import Skeleton from "../ui/Skeleton";
import { useState, useEffect } from "react";

// ─── Mock Data ─────────────────────────────────────────────
const RENT_DATA = {
    amount: "18,500",
    dueDate: "March 15, 2026",
    status: "due" as "due" | "paid" | "overdue",
};

const LEASE_DATA = {
    property: "Green Residences",
    unit: "Unit 4B · 2nd Floor",
    startDate: "Jan 1, 2026",
    endDate: "Dec 31, 2026",
    daysRemaining: 303,
    monthsLeft: 10,
};

const QUICK_ACTIONS = [
    { id: "pay", label: "Pay Rent", icon: CreditCard, color: "Green", screen: "payments" as const },
    { id: "lease", label: "View Lease", icon: FileText, color: "Blue", screen: "leaseList" as const },
    { id: "saved", label: "Saved", icon: Heart, color: "Amber", screen: "savedProperties" as const },
    { id: "maintenance", label: "Request Fix", icon: Wrench, color: "Purple", screen: "notifications" as const },
];

const NOTIFICATIONS = [
    {
        id: 1,
        title: "Rent Due Soon",
        desc: "Your rent of ₱18,500 is due in 12 days",
        time: "2h ago",
        icon: Clock,
        color: "Amber",
    },
    {
        id: 2,
        title: "Payment Confirmed",
        desc: "February rent payment has been confirmed",
        time: "3d ago",
        icon: CheckCircle2,
        color: "Green",
    },
    {
        id: 3,
        title: "Maintenance Update",
        desc: "Your plumbing request has been resolved",
        time: "5d ago",
        icon: Wrench,
        color: "Blue",
    },
];

const ANNOUNCEMENT = {
    text: "Building maintenance scheduled for March 10, 2026. Water supply will be temporarily interrupted from 8AM to 12PM.",
    from: "Property Management",
    date: "March 1, 2026",
};

// ─── Component ─────────────────────────────────────────────
export default function TenantHomeScreen() {
    const { navigate } = useNavigation();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const hasUnread = MOCK_NOTIFICATIONS.some(n => !n.read);

    const statusBadgeClass =
        RENT_DATA.status === "paid"
            ? styles.badgePaid
            : RENT_DATA.status === "overdue"
                ? styles.badgeOverdue
                : styles.badgeDue;

    const statusLabel =
        RENT_DATA.status === "paid"
            ? "Paid"
            : RENT_DATA.status === "overdue"
                ? "Overdue"
                : "Due Soon";

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.container}>
            {/* Greeting */}
            <div className={styles.greeting}>
                <div className={styles.greetingRow}>
                    <div className={styles.greetingText}>
                        <span className={styles.greetingHello}>{getGreeting()}</span>
                        <h1 className={styles.greetingName}>
                            Jane <span className={styles.greetingEmoji}>👋</span>
                        </h1>
                    </div>
                    <button
                        className={styles.notifButton}
                        onClick={() => navigate("notifications")}
                    >
                        <Bell />
                        {hasUnread && <div className={styles.notifBadge} />}
                    </button>
                </div>
            </div>

            {/* Rent Status Card */}
            <div className={styles.rentCard}>
                <div className={styles.rentCardGlow} />
                <div className={styles.rentHeader}>
                    <span className={styles.rentLabel}>Monthly Rent</span>
                    <span className={`${styles.rentBadge} ${statusBadgeClass}`}>
                        {statusLabel}
                    </span>
                </div>
                <div className={styles.rentAmount}>
                    {isLoading ? (
                        <Skeleton height="42px" width="140px" borderRadius="8px" />
                    ) : (
                        <AnimatedCounter value={18500} prefix="₱" />
                    )}
                </div>
                <p className={styles.rentDueDate}>
                    Due on{" "}
                    <span className={styles.rentDueDateValue}>{RENT_DATA.dueDate}</span>
                </p>
                <button
                    className={styles.payButton}
                    onClick={() => navigate("payments")}
                >
                    Pay Now
                    <ArrowRight />
                </button>
            </div>

            {/* Lease Summary */}
            <div className={styles.leaseCard}>
                <div className={styles.leaseHeader}>
                    <span className={styles.leaseTitle}>Active Lease</span>
                    <button
                        className={styles.leaseViewLink}
                        onClick={() => navigate("leaseList")}
                    >
                        View →
                    </button>
                </div>
                <h3 className={styles.leaseProperty}>{LEASE_DATA.property}</h3>
                <p className={styles.leaseUnit}>{LEASE_DATA.unit}</p>
                <div className={styles.leaseStats}>
                    <div className={styles.leaseStat}>
                        <div className={styles.leaseStatValue}>
                            {isLoading ? <Skeleton height="24px" width="40px" /> : <AnimatedCounter value={LEASE_DATA.daysRemaining} />}
                        </div>
                        <div className={styles.leaseStatLabel}>Days Left</div>
                    </div>
                    <div className={styles.leaseStat}>
                        <div className={styles.leaseStatValue}>
                            {isLoading ? <Skeleton height="24px" width="30px" /> : <AnimatedCounter value={LEASE_DATA.monthsLeft} />}
                        </div>
                        <div className={styles.leaseStatLabel}>Months Left</div>
                    </div>
                    <div className={styles.leaseStat}>
                        <div className={styles.leaseStatValue}>
                            {LEASE_DATA.startDate.split(",")[0]}
                        </div>
                        <div className={styles.leaseStatLabel}>Start Date</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
            </div>
            <div className={styles.quickActions}>
                {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    const colorClass =
                        styles[`action${action.color}` as keyof typeof styles];
                    return (
                        <div
                            key={action.id}
                            className={styles.actionCard}
                            onClick={() => navigate(action.screen)}
                        >
                            <div className={`${styles.actionIcon} ${colorClass}`}>
                                <Icon />
                            </div>
                            <span className={styles.actionLabel}>{action.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Notifications */}
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                <button
                    className={styles.sectionLink}
                    onClick={() => navigate("notifications")}
                >
                    See All
                </button>
            </div>
            <div className={styles.notifList}>
                {NOTIFICATIONS.map((notif) => {
                    const Icon = notif.icon;
                    const colorClass =
                        styles[`notif${notif.color}` as keyof typeof styles];
                    return (
                        <div key={notif.id} className={styles.notifItem}>
                            <div className={`${styles.notifIcon} ${colorClass}`}>
                                <Icon />
                            </div>
                            <div className={styles.notifContent}>
                                <p className={styles.notifTitle}>{notif.title}</p>
                                <p className={styles.notifDesc}>{notif.desc}</p>
                            </div>
                            <span className={styles.notifTime}>{notif.time}</span>
                        </div>
                    );
                })}
            </div>

            {/* Announcement */}
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Announcements</h2>
            </div>
            <div className={styles.announcementCard}>
                <div className={styles.announcementLabel}>
                    <Megaphone />
                    From {ANNOUNCEMENT.from}
                </div>
                <p className={styles.announcementText}>{ANNOUNCEMENT.text}</p>
                <p className={styles.announcementMeta}>{ANNOUNCEMENT.date}</p>
            </div>
        </div>
    );
}
