"use client";

import { useNavigation } from "../navigation";
import { Users, Building2, TrendingUp, Shield, ChevronRight } from "lucide-react";
import styles from "./AdminHomeScreen.module.css";

const METRICS = [
    { id: "landlords", label: "Landlords", value: "14", icon: Users },
    { id: "properties", label: "Properties", value: "45", icon: Building2 },
    { id: "system", label: "System Health", value: "100%", icon: TrendingUp },
];

const PENDING_APPROVALS = [
    { id: "app1", name: "Maria Clara", type: "Landlord Application", date: "2 hrs ago" },
    { id: "app2", name: "Skyline Holdings", type: "Entity Verification", date: "5 hrs ago" }
];

export default function AdminHomeScreen() {
    const { navigate } = useNavigation();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield className={styles.shieldIcon} size={24} />
                    <div>
                        <h1>Admin Hub</h1>
                        <p>System Overview</p>
                    </div>
                </div>
            </div>

            <div className={styles.scrollArea}>
                {/* Metrics Grid */}
                <div className={styles.metricsGrid}>
                    {METRICS.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <div key={metric.id} className={styles.metricCard}>
                                <div className={styles.metricHeader}>
                                    <div className={styles.metricIcon}>
                                        <Icon size={16} />
                                    </div>
                                </div>
                                <div className={styles.metricValue}>{metric.value}</div>
                                <div className={styles.metricLabel}>{metric.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Pending Actions Section */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Pending Approvals</h2>
                    <span className={styles.sectionLink}>View All</span>
                </div>
                <div className={styles.actionList}>
                    {PENDING_APPROVALS.length === 0 ? (
                        <div className={styles.emptyState}>No pending approvals.</div>
                    ) : (
                        PENDING_APPROVALS.map((item) => (
                            <div key={item.id} className={styles.actionItem}>
                                <div className={styles.actionIcon}>
                                    <Users size={20} />
                                </div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{item.name}</div>
                                    <div className={styles.actionDesc}>{item.type} • {item.date}</div>
                                </div>
                                <div className={styles.actionRight}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
