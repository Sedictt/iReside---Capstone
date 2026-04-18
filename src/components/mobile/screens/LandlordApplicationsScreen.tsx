"use client";

import { useState } from "react";
import { Filter, Building2, MapPin, Plus } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordApplicationsScreen.module.css";

// ─── Mock Data ───────────────
const APPLICATIONS = [
  { id: "app1", name: "Maria Santos", date: "Mar 15, 2026", property: "Metro Studio B", unit: "Unit 102", status: "pending", avatar: "M" },
  { id: "app2", name: "Jose Rizal", date: "Mar 12, 2026", property: "Skyline Lofts", unit: "Unit 201", status: "approved", avatar: "J" },
  { id: "app3", name: "Andres Bonifacio", date: "Mar 10, 2026", property: "Skyline Lofts", unit: "Unit 305", status: "rejected", avatar: "A" },
  { id: "app4", name: "Emilio Aguinaldo", date: "Mar 08, 2026", property: "Dalandanan Residences", unit: "Unit B", status: "pending", avatar: "E" },
];

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function LandlordApplicationsScreen() {
  const { navigate } = useNavigation();
  const [activeFilter, setActiveFilter] = useState<typeof TABS[number]["id"]>("pending");

  const filteredApps = APPLICATIONS.filter(app => {
    if (activeFilter === "all") return true;
    return app.status === activeFilter;
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Needs Review";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.headerTitle}>Applications</h1>
          <div className={styles.headerActions}>
            <button 
              className={styles.addWalkInBtn}
              onClick={() => navigate("landlordWalkInApp")}
            >
              <Plus size={20} />
            </button>
            <button className={styles.headerFilterBtn}>
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {TABS.map((tab) => {
            const count = tab.id === "all" 
              ? APPLICATIONS.length 
              : APPLICATIONS.filter(a => a.status === tab.id).length;
              
            return (
              <button
                key={tab.id}
                className={`${styles.tabChip} ${activeFilter === tab.id ? styles.active : ""}`}
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              >
                {tab.label}
                <span className={styles.tabBadge}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.scrollArea}>
        {filteredApps.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373", fontSize: "14px" }}>
            No applications found matching "{activeFilter}".
          </div>
        ) : (
          filteredApps.map((app) => (
            <div 
              key={app.id} 
              className={styles.applicationCard}
              onClick={() => navigate("landlordApplicationReview", { appId: app.id })}
            >
              <div className={styles.cardTop}>
                <div className={styles.applicantInfo}>
                  <div className={styles.applicantAvatar}>{app.avatar}</div>
                  <div>
                    <div className={styles.applicantName}>{app.name}</div>
                    <div className={styles.applyDate}>Applied: {app.date}</div>
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${styles[app.status]}`}>
                  {getStatusText(app.status)}
                </div>
              </div>
              <div className={styles.cardDivider} />
              <div className={styles.propertyInfo}>
                <Building2 size={16} />
                {app.property} • {app.unit}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
