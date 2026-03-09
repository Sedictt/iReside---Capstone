"use client";

import {
    TrendingUp,
    FileText,
    Clock,
    Wrench,
    AlertCircle,
    Users,
    Building2,
    CheckCircle2,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordHomeScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const REVENUE_DATA = {
    total: "₱245,000",
    trend: "+12.5%",
    collected: "18 / 20",
    occupancy: "95%",
};

const PENDING_ACTIONS = [
    {
        id: "apps",
        label: "New Apps",
        count: 3,
        icon: FileText,
        color: "Purple",
        screen: "applicationTracker" as const, // We'll reuse tracker or build a new one
    },
    {
        id: "maintenance",
        label: "Repairs",
        count: 2,
        icon: Wrench,
        color: "Amber",
        screen: "notifications" as const,
    },
    {
        id: "overdue",
        label: "Overdue",
        count: 1,
        icon: AlertCircle,
        color: "Red",
        screen: "payments" as const,
    },
    {
        id: "leases",
        label: "Expiring",
        count: 4,
        icon: Clock,
        color: "Blue",
        screen: "leaseList" as const,
    },
];

const RECENT_ACTIVITY = [
    {
        id: 1,
        title: "Payment Received",
        desc: "₱15,000 from Unit 12A (Skyline Lofts)",
        time: "2 hours ago",
        icon: CheckCircle2,
    },
    {
        id: 2,
        title: "Maintenance Request",
        desc: "Leaking faucet in Unit 4B (Dalandanan)",
        time: "5 hours ago",
        icon: Wrench,
    },
    {
        id: 3,
        title: "New Application",
        desc: "Maria Santos applied for Metro Studio C",
        time: "Yesterday",
        icon: FileText,
    },
    {
        id: 4,
        title: "Lease Signed",
        desc: "John Doe signed lease for Unit 8C",
        time: "Yesterday",
        icon: FileText,
    },
];

export default function LandlordHomeScreen() {
    const { navigate } = useNavigation();
    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.greeting}>Overview</h1>
                <p className={styles.date}>{currentDate}</p>
            </div>

            <div className={styles.scrollArea}>
                {/* Revenue Card */}
                <div className={styles.revenueCard}>
                    <div className={styles.revenueRow}>
                        <div>
                            <div className={styles.revenueLabel}>Monthly Revenue</div>
                            <div className={styles.revenueAmount}>{REVENUE_DATA.total}</div>
                        </div>
                        <div className={styles.revenueTrend}>
                            <TrendingUp /> {REVENUE_DATA.trend}
                        </div>
                    </div>

                    <div className={styles.revenueDivider} />

                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statItemLabel}>Rent Collected</span>
                            <span className={styles.statItemValue}>{REVENUE_DATA.collected}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statItemLabel}>Occupancy</span>
                            <span className={styles.statItemValue}>{REVENUE_DATA.occupancy}</span>
                        </div>
                    </div>
                </div>

                {/* Pending Actions */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Requires Attention</h2>
                </div>
                <div className={styles.actionsScroll}>
                    {PENDING_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        const colorClass = styles[`action${action.color}` as keyof typeof styles];

                        return (
                            <div
                                key={action.id}
                                className={styles.actionCard}
                                onClick={() => navigate(action.screen as any)}
                            >
                                <div>
                                    <div className={`${styles.actionIcon} ${colorClass}`}>
                                        <Icon />
                                    </div>
                                    <div className={styles.actionCount}>{action.count}</div>
                                    <div className={styles.actionLabel}>{action.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Activity */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                    <span className={styles.sectionLink}>View All</span>
                </div>
                <div className={styles.activityList}>
                    {RECENT_ACTIVITY.map((activity) => {
                        const Icon = activity.icon;
                        return (
                            <div key={activity.id} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    <Icon />
                                </div>
                                <div className={styles.activityInfo}>
                                    <div className={styles.activityTitle}>{activity.title}</div>
                                    <div className={styles.activityDesc}>{activity.desc}</div>
                                    <div className={styles.activityTime}>{activity.time}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
