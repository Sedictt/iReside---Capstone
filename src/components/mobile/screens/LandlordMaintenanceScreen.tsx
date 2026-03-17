"use client";

import { useState } from "react";
import { 
    Wrench, 
    Droplets, 
    Zap, 
    Thermometer, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    User,
    Calendar,
    ChevronRight,
    Search
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMaintenanceScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
const TICKETS = [
    { 
        id: "t1", 
        subject: "Kitchen Sink Leak", 
        unit: "Skyline Lofts - 101", 
        category: "plumbing", 
        status: "pending", 
        date: "2h ago", 
        desc: "Water is dripping from the pipe underneath the sink. It's starting to pool on the floor.",
        assigned: null
    },
    { 
        id: "t2", 
        subject: "Living Room AC Not Cooling", 
        unit: "Metro Studio B - 102", 
        category: "hvac", 
        status: "active", 
        date: "1d ago", 
        desc: "The AC unit runs but doesn't blow cold air. Filter has been cleaned but no change.",
        assigned: "Robert P. (Technician)"
    },
    { 
        id: "t3", 
        subject: "Flickering Lights", 
        unit: "Dalandanan Res - B", 
        category: "electrical", 
        status: "resolved", 
        date: "3d ago", 
        desc: "The main light in the bedroom flashes intermittently when the AC is on.",
        assigned: "Electric Pro Sub"
    },
    { 
        id: "t4", 
        subject: "Broken Door Handle", 
        unit: "Skyline Lofts - 201", 
        category: "other", 
        status: "pending", 
        date: "5h ago", 
        desc: "The handle for the bathroom door has come loose and won't turn anymore.",
        assigned: null
    }
];

const CATEGORY_ICONS = {
    plumbing: Droplets,
    electrical: Zap,
    hvac: Thermometer,
    other: Wrench
};

export default function LandlordMaintenanceScreen() {
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "resolved">("all");
    const { navigate } = useNavigation();

    const filteredTickets = TICKETS.filter(t => {
        if (activeTab === "all") return true;
        return t.status === activeTab;
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.headerTitle}>Maintenance</h1>
                    <button className={styles.searchBtn} style={{ background: 'none', border: 'none', color: '#a3a3a3' }}>
                        <Search size={20} />
                    </button>
                </div>

                {/* Stats Summary */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={`${styles.statValue} ${styles.pending}`}>2</span>
                        <span className={styles.statLabel}>Pending</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statValue} ${styles.active}`}>1</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={`${styles.statValue} ${styles.resolved}`}>12</span>
                        <span className={styles.statLabel}>Resolved</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                        onClick={() => setActiveTab("all")}
                    > All </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "pending" ? styles.active : ""}`}
                        onClick={() => setActiveTab("pending")}
                    > Pending </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "active" ? styles.active : ""}`}
                        onClick={() => setActiveTab("active")}
                    > Active </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "resolved" ? styles.active : ""}`}
                        onClick={() => setActiveTab("resolved")}
                    > Resolved </button>
                </div>
            </div>

            {/* List Area */}
            <div className={styles.scrollArea}>
                {filteredTickets.map((ticket) => {
                    const CategoryIcon = CATEGORY_ICONS[ticket.category as keyof typeof CATEGORY_ICONS];
                    return (
                        <div 
                            key={ticket.id} 
                            className={styles.ticketCard}
                            onClick={() => navigate("landlordMaintenanceDetail", { ticketId: ticket.id })}
                        >
                            <div className={styles.ticketTop}>
                                <div className={styles.categoryInfo}>
                                    <div className={`${styles.iconBox} ${styles[ticket.category]}`}>
                                        <CategoryIcon size={18} />
                                    </div>
                                    <div>
                                        <div className={styles.subject}>{ticket.subject}</div>
                                        <div className={styles.unitInfo}>{ticket.unit}</div>
                                    </div>
                                </div>
                                <div className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                                    {ticket.status === "active" ? "In Progress" : ticket.status}
                                </div>
                            </div>

                            <div className={styles.ticketBody}>
                                <p className={styles.description}>{ticket.desc}</p>
                            </div>

                            <div className={styles.ticketFooter}>
                                <div className={styles.timestamp}>
                                    <Clock size={12} />
                                    {ticket.date}
                                </div>
                                {ticket.assigned ? (
                                    <div className={styles.assignment}>
                                        <User size={12} />
                                        {ticket.assigned}
                                    </div>
                                ) : (
                                    <div className={styles.assignment} style={{ color: '#ef4444' }}>
                                        <AlertCircle size={12} />
                                        Unassigned
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredTickets.length === 0 && (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                        <p>No maintenance tickets found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
