"use client";

import { useState, useMemo } from "react";
import { Search, Wrench, Clock, User, AlertCircle } from "lucide-react";
import { useNavigation } from "../navigation";
import { useMaintenanceRequests } from "@/lib/hooks/useMaintenanceRequests";
import styles from "./LandlordMaintenanceScreen.module.css";

const MAINTENANCE_STATUS_MAP: Record<string, string> = {
  open: "pending",
  in_progress: "active",
  resolved: "resolved",
  closed: "resolved",
};

export default function LandlordMaintenanceScreen({ isSubView = false }: { isSubView?: boolean }) {
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "resolved">("all");
    const { navigate } = useNavigation();
    const { requests, loading } = useMaintenanceRequests("landlord");

    const filteredRequests = useMemo(() => {
      if (activeTab === "all") return requests;
      return requests.filter((r) => MAINTENANCE_STATUS_MAP[r.status] === activeTab);
    }, [requests, activeTab]);

    const pendingCount = requests.filter((r) => r.status === "open").length;
    const activeCount = requests.filter((r) => r.status === "in_progress").length;
    const resolvedCount = requests.filter((r) => r.status === "resolved" || r.status === "closed").length;

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
                            <span className={`${styles.statValue} ${styles.pending}`}>{pendingCount}</span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.active}`}>{activeCount}</span>
                            <span className={styles.statLabel}>In Progress</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.resolved}`}>{resolvedCount}</span>
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
                {loading ? (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                        <p>Loading maintenance requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                        <p>No maintenance tickets found.</p>
                    </div>
                ) : (
                    filteredRequests.map((ticket) => {
                        const unitName = (ticket.unit as any)?.name ?? "";
                        const propertyName = (ticket.unit as any)?.property?.name ?? "";

                        return (
                            <div
                                key={ticket.id}
                                className={styles.ticketCard}
                                onClick={() => navigate("landlordMaintenanceDetail", { ticketId: ticket.id })}
                            >
                                <div className={styles.ticketTop}>
                                    <div className={styles.categoryInfo}>
                                        <div className={`${styles.iconBox} ${styles[ticket.category ?? "other"]}`}>
                                            <Wrench size={18} />
                                        </div>
                                        <div>
                                            <div className={styles.subject}>{ticket.title}</div>
                                            <div className={styles.unitInfo}>{propertyName}{unitName ? ` - ${unitName}` : ""}</div>
                                        </div>
                                    </div>
                                    <div className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                                        {ticket.status === "in_progress" ? "In Progress" : ticket.status}
                                    </div>
                                </div>

                                <div className={styles.ticketBody}>
                                    <p className={styles.description}>{ticket.description}</p>
                                </div>

                                <div className={styles.ticketFooter}>
                                    <div className={styles.timestamp}>
                                        <Clock size={12} />
                                        {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </div>
                                    <div className={styles.assignment} style={{ color: ticket.priority === "urgent" ? '#ef4444' : '#a3a3a3' }}>
                                        {ticket.priority === "urgent" ? <AlertCircle size={12} /> : <User size={12} />}
                                        {ticket.priority === "urgent" ? "Urgent" : ticket.priority}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
