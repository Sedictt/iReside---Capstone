"use client";

import { useState, useMemo } from "react";
import { Filter, Building2, Plus } from "lucide-react";
import { useNavigation } from "../navigation";
import { useApplications } from "@/lib/hooks/useApplications";
import styles from "./LandlordApplicationsScreen.module.css";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "reviewing", label: "Reviewing" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

const STATUS_TEXT: Record<string, string> = {
  pending: "Needs Review",
  reviewing: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

export default function LandlordApplicationsScreen({ isSubView = false }: { isSubView?: boolean }) {
  const { navigate } = useNavigation();
  const { applications, loading } = useApplications("landlord");
  const [activeFilter, setActiveFilter] = useState<typeof TABS[number]["id"]>("pending");

  const filteredApps = useMemo(() => {
    if (activeFilter === "all") return applications;
    return applications.filter((a) => a.status === activeFilter);
  }, [applications, activeFilter]);

  return (
    <div className={styles.container}>
      {!isSubView && (
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.headerTitle}>Applications</h1>
            <div className={styles.headerActions}>
              <button className={styles.addWalkInBtn} onClick={() => navigate("landlordWalkInApp")}>
                <Plus size={20} />
              </button>
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
                <span className={styles.tabBadge}>
                  {tab.id === "all" ? applications.length : applications.filter(a => a.status === tab.id).length}
                </span>
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
              <span className={styles.tabBadge}>
                {tab.id === "all" ? applications.length : applications.filter(a => a.status === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.scrollArea}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373", fontSize: "14px" }}>
            Loading applications...
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373", fontSize: "14px" }}>
            No applications found.
          </div>
        ) : (
          filteredApps.map((app) => {
            const applicantName = app.applicant_name ?? "Applicant";
            const unitData = (app.unit as any);
            const propertyName = unitData?.property?.name ?? "Property";
            const unitName = unitData?.name ?? "";

            return (
              <div
                key={app.id}
                className={styles.applicationCard}
                onClick={() => navigate("landlordApplicationReview", { appId: app.id })}
              >
                <div className={styles.cardTop}>
                  <div className={styles.applicantInfo}>
                    <div className={styles.applicantAvatar}>{applicantName.charAt(0)}</div>
                    <div>
                      <div className={styles.applicantName}>{applicantName}</div>
                      <div className={styles.applyDate}>
                        Applied: {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.statusBadge} ${styles[app.status]}`}>
                    {STATUS_TEXT[app.status] ?? app.status}
                  </div>
                </div>
                <div className={styles.cardDivider} />
                <div className={styles.propertyInfo}>
                  <Building2 size={16} />
                  {propertyName}{unitName ? ` • ${unitName}` : ""}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
