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
    Search,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantHomeScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";
import AnimatedCounter from "../ui/AnimatedCounter";
import Skeleton from "../ui/Skeleton";
import { useState, useEffect } from "react";

// ─── Component ─────────────────────────────────────────────

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
                        onClick={() => navigate("inbox", { tab: "notifications" })}
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
