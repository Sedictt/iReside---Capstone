"use client";

import { useNavigation } from "../navigation";
import { Users, Building2, TrendingUp, Shield, ChevronRight, Clock, CheckCircle } from "lucide-react";
import styles from "./AdminHomeScreen.module.css";

const METRICS = [
    { id: "landlords",   label: "Landlords",  value: "14",   icon: Users,      trend: "+2 this month" },
    { id: "properties",  label: "Properties", value: "45",   icon: Building2,  trend: "+5 this month" },
    { id: "uptime",      label: "Uptime",      value: "100%", icon: TrendingUp, trend: "All systems go" },
];

const PENDING_APPROVALS = [
    { id: "app1", name: "Maria Clara",      type: "Landlord Application", date: "2 hrs ago" },
    { id: "app2", name: "Skyline Holdings", type: "Entity Verification",  date: "5 hrs ago" },
];

const QUICK_LINKS = [
    { id: "landlords", label: "Manage Landlords", desc: "View, approve or suspend accounts", icon: Users,         screen: "adminLandlords" as const },
    { id: "settings",  label: "System Settings",  desc: "Configure platform behaviour",     icon: Shield,        screen: "adminSettings"  as const },
];

export default function AdminHomeScreen() {
    const { navigate } = useNavigation();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Shield className={styles.shieldIcon} size={22} />
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
                                <div className={styles.metricIcon}><Icon size={15} /></div>
                                <div className={styles.metricValue}>{metric.value}</div>
                                <div className={styles.metricLabel}>{metric.label}</div>
                                <div className={styles.metricTrend}>{metric.trend}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                </div>
                <div className={styles.quickLinks}>
                    {QUICK_LINKS.map((link) => {
                        const Icon = link.icon;
                        return (
                            <button
                                key={link.id}
                                className={styles.quickLinkCard}
                                onClick={() => navigate(link.screen)}
                            >
                                <div className={styles.quickLinkIcon}><Icon size={20} /></div>
                                <div className={styles.quickLinkContent}>
                                    <div className={styles.quickLinkLabel}>{link.label}</div>
                                    <div className={styles.quickLinkDesc}>{link.desc}</div>
                                </div>
                                <ChevronRight size={18} className={styles.quickLinkChevron} />
                            </button>
                        );
                    })}
                </div>

                {/* Pending Approvals */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Pending Approvals</h2>
                    <span className={styles.badge}>{PENDING_APPROVALS.length}</span>
                </div>
                <div className={styles.actionList}>
                    {PENDING_APPROVALS.length === 0 ? (
                        <div className={styles.emptyState}>
                            <CheckCircle size={28} />
                            <p>All caught up!</p>
                        </div>
                    ) : (
                        PENDING_APPROVALS.map((item) => (
                            <div key={item.id} className={styles.actionItem}>
                                <div className={styles.actionIconWrap}><Clock size={18} /></div>
                                <div className={styles.actionContent}>
                                    <div className={styles.actionTitle}>{item.name}</div>
                                    <div className={styles.actionDesc}>{item.type} · {item.date}</div>
                                </div>
                                <ChevronRight size={18} className={styles.actionChevron} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

