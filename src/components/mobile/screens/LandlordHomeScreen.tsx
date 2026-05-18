"use client";

import {
  Calendar, Building2, Users, TrendingUp, Bell, ChevronRight,
  AlertCircle, Clock, Wrench,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { useLandlordData } from "@/lib/hooks/useLandlordData";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useUser } from "@/lib/hooks/useUser";
import styles from "./LandlordHomeScreen.module.css";
import AnimatedCounter from "../ui/AnimatedCounter";
import Skeleton from "../ui/Skeleton";
import { useState, useEffect } from "react";

export default function LandlordHomeScreen() {
  const { navigate } = useNavigation();
  const { user } = useUser();
  const { revenue, metrics, actionItems, loading: dataLoading } = useLandlordData();
  const { unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const hasUnread = unreadCount > 0;
  const totalUnits = parseInt(metrics.find((m) => m.label === "Total Units")?.value ?? "0");
  const occupancyRate = metrics.find((m) => m.label === "Occupancy Rate")?.value ?? "0%";
  const hasData = totalUnits > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.full_name?.split(" ")[0] ?? "Landlord"}</p>
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
        {hasData ? (
          <>
            {/* Revenue Widget */}
            {revenue && (
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
                      <AnimatedCounter value={revenue.totalExpected} prefix="₱" />
                  )}
                </div>

                <div className={styles.revenueStats}>
                  <div className={styles.revStatBox}>
                    <span className={styles.revStatLabel}>Collected</span>
                    <span className={`${styles.revStatValue} ${styles.collected}`}>
                      {isLoading ? <Skeleton height="20px" width="80px" /> : <AnimatedCounter value={revenue.collected} prefix="₱" />}
                    </span>
                  </div>
                  <div className={styles.revStatBox}>
                    <span className={styles.revStatLabel}>Pending</span>
                    <span className={`${styles.revStatValue} ${styles.pending}`}>
                      {isLoading ? <Skeleton height="20px" width="80px" /> : <AnimatedCounter value={revenue.pending} prefix="₱" />}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div
                className={`${styles.metricCard} ${styles.metricCardClickable}`}
                onClick={() => navigate("landlordProperties")}
              >
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Building2 size={16} />
                  </div>
                  <div className={styles.metricHeaderRight}>
                    <ChevronRight size={16} />
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {isLoading ? <Skeleton height="28px" width="40px" /> : <AnimatedCounter value={totalUnits} />}
                </div>
                <div className={styles.metricLabel}>Total Units</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Users size={16} />
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {isLoading ? <Skeleton height="28px" width="40px" /> : occupancyRate}
                </div>
                <div className={styles.metricLabel}>Occupancy Rate</div>
              </div>
            </div>

            {/* Action Needed Section */}
            {actionItems.length > 0 && (
              <>
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
                  {actionItems.map((item) => {
                    const Icon = item.type === "urgent" ? AlertCircle : item.type === "warning" ? Clock : AlertCircle;
                    const styleColor = styles[item.type as keyof typeof styles];

                    return (
                      <div
                        key={item.id}
                        className={styles.actionItem}
                        onClick={() => navigate(item.screen as any, item.params as any)}
                      >
                        <div className={`${styles.actionIcon} ${styleColor}`}>
                          <Icon size={20} />
                        </div>
                        <div className={styles.actionContent}>
                          <div className={styles.actionTitle}>{item.title}</div>
                          <div className={styles.actionDesc}>{item.description}</div>
                        </div>
                        <div className={styles.actionRight}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}