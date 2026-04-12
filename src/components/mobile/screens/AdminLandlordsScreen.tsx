"use client";

import { useState } from "react";
import { Users, Search, CheckCircle, XCircle, Clock, ChevronRight, Building2 } from "lucide-react";
import styles from "./AdminLandlordsScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
type LandlordStatus = "active" | "pending" | "suspended";

interface Landlord {
    id: string;
    name: string;
    email: string;
    properties: number;
    status: LandlordStatus;
    joinedDate: string;
}

const MOCK_LANDLORDS: Landlord[] = [
    { id: "l1", name: "Roberto Santos",   email: "roberto@example.com",  properties: 8,  status: "active",    joinedDate: "Jan 2025" },
    { id: "l2", name: "Maria Clara",      email: "mclara@example.com",   properties: 0,  status: "pending",   joinedDate: "Apr 2026" },
    { id: "l3", name: "Skyline Holdings", email: "info@skyline.ph",      properties: 23, status: "active",    joinedDate: "Mar 2024" },
    { id: "l4", name: "Jose Reyes",       email: "jose.r@example.com",   properties: 3,  status: "suspended", joinedDate: "Jun 2024" },
    { id: "l5", name: "Ana Lim",          email: "ana.lim@example.com",  properties: 5,  status: "active",    joinedDate: "Aug 2024" },
    { id: "l6", name: "PrimeCo Rentals",  email: "admin@primeco.ph",     properties: 12, status: "active",    joinedDate: "Nov 2023" },
];

const STATUS_CONFIG: Record<LandlordStatus, { label: string; icon: typeof CheckCircle; className: string }> = {
    active:    { label: "Active",    icon: CheckCircle, className: "statusActive" },
    pending:   { label: "Pending",   icon: Clock,       className: "statusPending" },
    suspended: { label: "Suspended", icon: XCircle,     className: "statusSuspended" },
};

// ─── Component ─────────────────────────────────────────────
export default function AdminLandlordsScreen() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<LandlordStatus | "all">("all");

    const filtered = MOCK_LANDLORDS.filter((l) => {
        const matchesSearch =
            l.name.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === "all" || l.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Landlords</h1>
                <p className={styles.headerSub}>{MOCK_LANDLORDS.length} registered</p>
            </div>

            {/* Search */}
            <div className={styles.searchRow}>
                <div className={styles.searchBox}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Search landlords..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div className={styles.filterRow}>
                {(["all", "active", "pending", "suspended"] as const).map((f) => (
                    <button
                        key={f}
                        className={`${styles.filterPill} ${filter === f ? styles.filterPillActive : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className={styles.list}>
                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Users size={32} />
                        <p>No landlords found.</p>
                    </div>
                ) : (
                    filtered.map((landlord) => {
                        const { label, icon: StatusIcon, className } = STATUS_CONFIG[landlord.status];
                        return (
                            <div key={landlord.id} className={styles.card}>
                                <div className={styles.cardAvatar}>
                                    {landlord.name.charAt(0)}
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.cardName}>{landlord.name}</div>
                                    <div className={styles.cardEmail}>{landlord.email}</div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardProperties}>
                                            <Building2 size={12} /> {landlord.properties} properties
                                        </span>
                                        <span className={`${styles.statusBadge} ${styles[className]}`}>
                                            <StatusIcon size={11} /> {label}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className={styles.cardChevron} />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
