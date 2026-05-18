"use client";

import { useState, useEffect } from "react";
import {
    Bell, FileText, CreditCard, Wrench, MessageSquare, Heart,
    ArrowRight, CheckCircle2, Clock, AlertCircle, Megaphone,
    ChevronRight, Search,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { useTenantData } from "@/lib/hooks/useTenantData";
import { useUser } from "@/lib/hooks/useUser";
import { useNotifications } from "@/lib/hooks/useNotifications";
import styles from "./TenantHomeScreen.module.css";
import AnimatedCounter from "../ui/AnimatedCounter";
import Skeleton from "../ui/Skeleton";

const QUICK_ACTIONS = [
    { id: "pay", label: "Pay Rent", icon: CreditCard, color: "Green", screen: "payments" as const },
    { id: "lease", label: "View Lease", icon: FileText, color: "Blue", screen: "leaseList" as const },
    { id: "saved", label: "Saved", icon: Heart, color: "Amber", screen: "savedProperties" as const },
    { id: "maintenance", label: "Request Fix", icon: Wrench, color: "Purple", screen: "tenantMaintenance" as const },
];

export default function TenantHomeScreen() {
    const { navigate } = useNavigation();
    const { user, loading: userLoading } = useUser();
    const { lease, rent, loading: dataLoading } = useTenantData();
    const { notifications, unreadCount } = useNotifications();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const firstName = user?.full_name?.split(" ")[0] ?? "Tenant";
    const hasUnread = unreadCount > 0;
    const loading = userLoading || dataLoading;

    const statusBadgeClass =
        rent?.status === "paid"
            ? styles.badgePaid
            : rent?.status === "overdue"
                ? styles.badgeOverdue
                : styles.badgeDue;

    const statusLabel =
        rent?.status === "paid"
            ? "Paid"
            : rent?.status === "overdue"
                ? "Overdue"
                : "Due Soon";

    const announcementNotif = notifications.find((n) => n.type === "announcement" || n.type === "payment");

    return (
        <div className={styles.container}>
            {/* Greeting */}
            <div className={styles.greeting}>
                <div className={styles.greetingRow}>
                    <div className={styles.greetingText}>
                        <span className={styles.greetingHello}>{getGreeting()}</span>
                        <h1 className={styles.greetingName}>
                            {loading ? "..." : firstName} <span className={styles.greetingEmoji}>👋</span>
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

            {lease && rent ? (
                <>
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
                                <AnimatedCounter value={rent.amount} prefix="₱" />
                            )}
                        </div>
                        <p className={styles.rentDueDate}>
                            Due on{" "}
                            <span className={styles.rentDueDateValue}>{rent.dueDate}</span>
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
                        <h3 className={styles.leaseProperty}>
                            {(lease.unit as any)?.property?.name ?? "Property"}
                        </h3>
                        <p className={styles.leaseUnit}>
                            {(lease.unit as any)?.name ?? lease.id}
                        </p>
                        <div className={styles.leaseStats}>
                            <div className={styles.leaseStat}>
                                <div className={styles.leaseStatValue}>
                                    {isLoading ? (
                                        <Skeleton height="24px" width="40px" />
                                    ) : (
                                        <AnimatedCounter
                                            value={Math.max(0, Math.floor(
                                                (new Date(lease.end_date).getTime() - Date.now()) / 86400000
                                            ))}
                                        />
                                    )}
                                </div>
                                <div className={styles.leaseStatLabel}>Days Left</div>
                            </div>
                            <div className={styles.leaseStat}>
                                <div className={styles.leaseStatValue}>
                                    {isLoading ? (
                                        <Skeleton height="24px" width="30px" />
                                    ) : (
                                        <AnimatedCounter
                                            value={Math.max(0, Math.floor(
                                                (new Date(lease.end_date).getTime() - Date.now()) / 2592000000
                                            ))}
                                        />
                                    )}
                                </div>
                                <div className={styles.leaseStatLabel}>Months Left</div>
                            </div>
                            <div className={styles.leaseStat}>
                                <div className={styles.leaseStatValue}>
                                    {new Date(lease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                    {announcementNotif && (
                        <>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Announcements</h2>
                            </div>
                            <div className={styles.announcementCard}>
                                <div className={styles.announcementLabel}>
                                    <Megaphone />
                                    From Management
                                </div>
                                <p className={styles.announcementText}>{announcementNotif.message}</p>
                                <p className={styles.announcementMeta}>
                                    {new Date(announcementNotif.created_at).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    {/* Quick Actions (always shown) */}
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
                                    onClick={() => navigate(action.screen as any)}
                                >
                                    <div className={`${styles.actionIcon} ${colorClass}`}>
                                        <Icon />
                                    </div>
                                    <span className={styles.actionLabel}>{action.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}