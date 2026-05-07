"use client";

import {
  Calendar,
  Wallet,
  Building2,
  Users,
  AlertCircle,
  Clock,
  Wrench,
  ChevronRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordHomeScreen.module.css";
import { MOCK_NOTIFICATIONS } from "./NotificationsScreen";
import AnimatedCounter from "../ui/AnimatedCounter";
import Skeleton from "../ui/Skeleton";
import { useState, useEffect } from "react";

// ─── Mock Data ──────────────────────────────────────────────
const REVENUE_DATA = {
  totalExpected: "₱145,000",
  collected: "₱110,000",
  pending: "₱35,000",
  month: "March",
};

const METRICS = [
  { id: "units", label: "Total Units", value: "24", icon: Building2 },
  { id: "occupancy", label: "Occupancy Rate", value: "92%", icon: Users },
];

const ACTION_ITEMS = [
  {
    id: "a1",
    title: "2 Pending Applications",
    desc: "Metro Studio B needs review",
    type: "warning",
    icon: Clock,
    screen: "activity" as const,
    params: { tab: "applications" },
  },
  {
    id: "a2",
    title: "1 Maintenance Request",
    desc: "Unit 12A Plumbing Issue",
    type: "urgent",
    icon: Wrench,
    screen: "activity" as const,
    params: { tab: "maintenance" },
  },
  {
    id: "a3",
    title: "3 Overdue Payments",
    desc: "Totaling ₱45,000",
    type: "info",
    icon: AlertCircle,
    screen: "activity" as const,
    params: { tab: "invoices" },
  },
  {
    id: "a4",
    title: "1 Move-Out Request",
    desc: "Unit 12A final inspection pending",
    type: "warning",
    icon: Clock,
    screen: "landlordMoveOutReview" as const,
  },
];

// ─── Component ──────────────────────────────────────────────
export default function LandlordHomeScreen() {
  const { navigate } = useNavigation();
  const hasUnread = MOCK_NOTIFICATIONS.some(n => !n.read);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>Welcome back, Landlord</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.headerDate}>
            <Calendar />
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <button 
            style={{ background: 'none', border: 'none', color: '#a3a3a3', position: 'relative' }}
            onClick={() => navigate("notifications")}
          >
            <Bell size={24} />
            {hasUnread && <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#6d9838', borderRadius: 4, border: '2px solid #0a0a0a' }} />}
          </button>
        </div>
      </div>

      <div className={styles.scrollArea}>
        {/* Revenue Widget */}
        <div 
          className={styles.revenueWidget}
          onClick={() => navigate("revenueDashboard")}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.revenueHeaderRow}>
            <div className={styles.revenueLabel}>
              Expected Revenue <TrendingUp size={14} />
            </div>
            <ChevronRight size={18} color="#525252" />
          </div>
          <div className={styles.revenueAmount}>
            {isLoading ? (
                <Skeleton height="36px" width="50%" borderRadius="4px" />
            ) : (
                <AnimatedCounter value={145000} prefix="₱" />
            )}
          </div>

          <div className={styles.revenueStats}>
            <div className={styles.revStatBox}>
              <span className={styles.revStatLabel}>Collected</span>
              <span className={`${styles.revStatValue} ${styles.collected}`}>
                {isLoading ? <Skeleton height="20px" width="80px" /> : <AnimatedCounter value={110000} prefix="₱" />}
              </span>
            </div>
            <div className={styles.revStatBox}>
              <span className={styles.revStatLabel}>Pending</span>
              <span className={`${styles.revStatValue} ${styles.pending}`}>
                {isLoading ? <Skeleton height="20px" width="80px" /> : <AnimatedCounter value={35000} prefix="₱" />}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.id}
                className={`${styles.metricCard} ${metric.id === "units" ? styles.metricCardClickable + " clickable" : ""}`}
                onClick={() => {
                  if (metric.id === "units") navigate("landlordProperties");
                }}
              >
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Icon size={16} />
                  </div>
                  {metric.id === "units" && (
                    <div className={styles.metricHeaderRight}>
                      <ChevronRight size={16} />
                    </div>
                  )}
                </div>
                <div className={styles.metricValue}>
                  {isLoading ? (
                      <Skeleton height="28px" width="40px" />
                  ) : metric.id === "units" ? (
                      <AnimatedCounter value={parseInt(metric.value)} />
                  ) : (
                      metric.value
                  )}
                </div>
                <div className={styles.metricLabel}>{metric.label}</div>
              </div>
            );
          })}
        </div>

        {/* Action Needed Section */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Action Needed</h2>
          <span 
            className={`${styles.sectionLink} clickable`}
            onClick={() => navigate("inbox", { tab: "notifications" })}
          >
            View All
          </span>
        </div>
        <div className={styles.actionList}>
          {ACTION_ITEMS.map((item) => {
            const Icon = item.icon;
            const styleColor = styles[item.type as keyof typeof styles];

            return (
              <div
                key={item.id}
                className={styles.actionItem}
                onClick={() => navigate(item.screen, (item as any).params)}
              >
                <div className={`${styles.actionIcon} ${styleColor}`}>
                  <Icon size={20} />
                </div>
                <div className={styles.actionContent}>
                  <div className={styles.actionTitle}>{item.title}</div>
                  <div className={styles.actionDesc}>{item.desc}</div>
                </div>
                <div className={styles.actionRight}>
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
