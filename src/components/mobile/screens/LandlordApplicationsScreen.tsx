"use client";

import { useState } from "react";
import { Filter, Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordApplicationsScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function LandlordApplicationsScreen({ isSubView = false }: { isSubView?: boolean }) {
  const { navigate } = useNavigation();
  const [activeFilter, setActiveFilter] = useState<typeof TABS[number]["id"]>("pending");

  return (
    <div className={styles.container}>
      {!isSubView && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.headerTitle}>Applications</h1>
            <div className={styles.headerActions}>
              <button className={styles.headerFilterBtn}>
                <Filter size={20} />
              </button>
            </div>
          </div>

          <div className={styles.filterTabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabChip} ${activeFilter === tab.id ? styles.active : ""}`}
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              >
                {tab.label}
                <span className={styles.tabBadge}>0</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isSubView && (
        <div className={styles.filterTabs} style={{ padding: '0 16px 12px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabChip} ${activeFilter === tab.id ? styles.active : ""}`}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            >
              {tab.label}
              <span className={styles.tabBadge}>0</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.scrollArea}>
        <EmptyState
          icon={Building2}
          title="No applications yet"
          subtitle="When prospective tenants apply to your properties, their applications will show up here."
        />
      </div>
    </div>
  );
}