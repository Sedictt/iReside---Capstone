"use client";

import { useState } from "react";
import { ClipboardList, Wrench, FileText } from "lucide-react";
import LandlordApplicationsScreen from "./LandlordApplicationsScreen";
import LandlordMaintenanceScreen from "./LandlordMaintenanceScreen";
import LandlordInvoicesScreen from "./LandlordInvoicesScreen";
import styles from "./ActivityScreen.module.css";

type ActivityTab = "applications" | "maintenance" | "invoices";

export default function ActivityScreen() {
    const [activeTab, setActiveTab] = useState<ActivityTab>("applications");

    // Mock unread/alert counts
    const pendingApplications = 2;
    const pendingMaintenance = 2;
    const overdueInvoices = 1;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Activity</h1>
            </div>

            {/* Segment Control */}
            <div className={styles.segmentContainer}>
                <div className={styles.segmentTrack}>
                    <button
                        className={`${styles.segmentButton} ${activeTab === "applications" ? styles.segmentButtonActive : ""}`}
                        onClick={() => setActiveTab("applications")}
                    >
                        <ClipboardList size={13} />
                        Applications
                        {pendingApplications > 0 && (
                            <span className={styles.segmentBadge}>{pendingApplications}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.segmentButton} ${activeTab === "maintenance" ? styles.segmentButtonActive : ""}`}
                        onClick={() => setActiveTab("maintenance")}
                    >
                        <Wrench size={13} />
                        Repairs
                        {pendingMaintenance > 0 && (
                            <span className={`${styles.segmentBadge} ${styles.segmentBadgeWarning}`}>{pendingMaintenance}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.segmentButton} ${activeTab === "invoices" ? styles.segmentButtonActive : ""}`}
                        onClick={() => setActiveTab("invoices")}
                    >
                        <FileText size={13} />
                        Invoices
                        {overdueInvoices > 0 && (
                            <span className={`${styles.segmentBadge} ${styles.segmentBadgeWarning}`}>{overdueInvoices}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content} key={activeTab}>
                {activeTab === "applications" && <LandlordApplicationsScreen isSubView />}
                {activeTab === "maintenance" && <LandlordMaintenanceScreen isSubView />}
                {activeTab === "invoices" && <LandlordInvoicesScreen isSubView />}
            </div>
        </div>
    );
}
