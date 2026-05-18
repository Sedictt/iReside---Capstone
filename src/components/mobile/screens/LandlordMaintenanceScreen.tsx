"use client";

import { useState } from "react";
import { Search, Wrench } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMaintenanceScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordMaintenanceScreen({ isSubView = false }: { isSubView?: boolean }) {
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "resolved">("all");
    const { navigate } = useNavigation();

    return (
        <div className={styles.container}>
            {!isSubView && (
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.headerTitle}>Maintenance</h1>
                        <button className={styles.searchBtn} style={{ background: 'none', border: 'none', color: '#a3a3a3' }}>
                            <Search size={20} />
                        </button>
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.pending}`}>0</span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.active}`}>0</span>
                            <span className={styles.statLabel}>In Progress</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.resolved}`}>0</span>
                            <span className={styles.statLabel}>Resolved</span>
                        </div>
                    </div>

                    <div className={styles.tabs}>
                        <button className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`} onClick={() => setActiveTab("all")}> All </button>
                        <button className={`${styles.tab} ${activeTab === "pending" ? styles.active : ""}`} onClick={() => setActiveTab("pending")}> Pending </button>
                        <button className={`${styles.tab} ${activeTab === "active" ? styles.active : ""}`} onClick={() => setActiveTab("active")}> Active </button>
                        <button className={`${styles.tab} ${activeTab === "resolved" ? styles.active : ""}`} onClick={() => setActiveTab("resolved")}> Resolved </button>
                    </div>
                </div>
            )}

            {isSubView && (
                <div className={styles.tabs} style={{ padding: '0 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
                    <button className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`} onClick={() => setActiveTab("all")}> All </button>
                    <button className={`${styles.tab} ${activeTab === "pending" ? styles.active : ""}`} onClick={() => setActiveTab("pending")}> Pending </button>
                    <button className={`${styles.tab} ${activeTab === "active" ? styles.active : ""}`} onClick={() => setActiveTab("active")}> Active </button>
                    <button className={`${styles.tab} ${activeTab === "resolved" ? styles.active : ""}`} onClick={() => setActiveTab("resolved")}> Resolved </button>
                </div>
            )}

            <div className={styles.scrollArea}>
                <EmptyState
                    icon={Wrench}
                    title="No maintenance requests"
                    subtitle="When tenants submit maintenance tickets, they will show up here."
                />
            </div>
        </div>
    );
}