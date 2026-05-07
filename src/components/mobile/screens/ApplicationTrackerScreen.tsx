"use client";

import { useState, useMemo } from "react";
import { Calendar, ClipboardList, Search } from "lucide-react";
import { useNavigation } from "../navigation";
import { properties } from "@/lib/data";
import styles from "./ApplicationTrackerScreen.module.css";

// ─── Types ─────────────────────────────────────────────────
type ApplicationStatus = "pending" | "reviewing" | "approved" | "rejected";

interface Application {
    id: string;
    propertyId: string;
    propertyName: string;
    propertyImage: string;
    address: string;
    price: string;
    status: ApplicationStatus;
    appliedDate: string;
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_APPLICATIONS: Application[] = [
    {
        id: "app1",
        propertyId: "1",
        propertyName: properties[0]?.name || "Skyline Lofts",
        propertyImage: properties[0]?.images[0] || "",
        address: properties[0]?.address || "Maysan, Valenzuela",
        price: properties[0]?.price || "₱15,000",
        status: "reviewing",
        appliedDate: "Mar 2, 2026",
    },
    {
        id: "app2",
        propertyId: "4",
        propertyName: properties[3]?.name || "Lakeside Villa",
        propertyImage: properties[3]?.images[0] || "",
        address: properties[3]?.address || "Dalandanan, Valenzuela",
        price: properties[3]?.price || "₱25,000",
        status: "approved",
        appliedDate: "Feb 20, 2026",
    },
    {
        id: "app3",
        propertyId: "3",
        propertyName: properties[2]?.name || "Metro Studio B",
        propertyImage: properties[2]?.images[0] || "",
        address: properties[2]?.address || "Marulas, Valenzuela",
        price: properties[2]?.price || "₱8,500",
        status: "pending",
        appliedDate: "Mar 3, 2026",
    },
    {
        id: "app4",
        propertyId: "5",
        propertyName: properties[4]?.name || "Downtown Apartment",
        propertyImage: properties[4]?.images[0] || "",
        address: properties[4]?.address || "Karuhatan, Valenzuela",
        price: properties[4]?.price || "₱10,000",
        status: "rejected",
        appliedDate: "Feb 10, 2026",
    },
];

// ─── Filters ───────────────────────────────────────────────
const FILTERS = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "reviewing", label: "Reviewing" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
] as const;

// ─── Component ─────────────────────────────────────────────
export default function ApplicationTrackerScreen() {
    const { navigate } = useNavigation();
    const [activeFilter, setActiveFilter] =
        useState<(typeof FILTERS)[number]["id"]>("all");

    const filteredApps = useMemo(() => {
        if (activeFilter === "all") return MOCK_APPLICATIONS;
        return MOCK_APPLICATIONS.filter((a) => a.status === activeFilter);
    }, [activeFilter]);

    const getStatusClass = (status: ApplicationStatus) => {
        switch (status) {
            case "pending":
                return styles.statusPending;
            case "reviewing":
                return styles.statusReviewing;
            case "approved":
                return styles.statusApproved;
            case "rejected":
                return styles.statusRejected;
        }
    };

    const getProgressClass = (status: ApplicationStatus) => {
        switch (status) {
            case "pending":
                return styles.progressPending;
            case "reviewing":
                return styles.progressReviewing;
            case "approved":
                return styles.progressApproved;
            case "rejected":
                return styles.progressRejected;
        }
    };

    const getStatusLabel = (status: ApplicationStatus) => {
        switch (status) {
            case "pending":
                return "Pending";
            case "reviewing":
                return "Under Review";
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
        }
    };

    const getFilterCount = (filterId: string) => {
        if (filterId === "all") return MOCK_APPLICATIONS.length;
        return MOCK_APPLICATIONS.filter((a) => a.status === filterId).length;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>My Applications</h1>
                <p className={styles.headerSub}>
                    <span>{MOCK_APPLICATIONS.length}</span> total applications
                </p>
            </div>

            {/* Filter Chips */}
            <div className={styles.filterRow}>
                {FILTERS.map((filter) => {
                    const count = getFilterCount(filter.id);
                    return (
                        <button
                            key={filter.id}
                            className={`${styles.filterChip} ${activeFilter === filter.id ? styles.filterChipActive : ""
                                }`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            {filter.label}
                            <span className={styles.chipCount}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Application List */}
            {filteredApps.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <ClipboardList />
                    </div>
                    <h2 className={styles.emptyTitle}>No Applications</h2>
                    <p className={styles.emptySub}>
                        No applications match this filter. Try selecting a different
                        category.
                    </p>
                </div>
            ) : (
                <div className={styles.applicationList}>
                    {filteredApps.map((app) => (
                        <div
                            key={app.id}
                            className={styles.applicationCard}
                            onClick={() =>
                                navigate("applicationDetail", { applicationId: app.id })
                            }
                        >
                            {/* Progress Bar */}
                            <div className={styles.cardProgress}>
                                <div
                                    className={`${styles.cardProgressFill} ${getProgressClass(
                                        app.status
                                    )}`}
                                />
                            </div>

                            {/* Card Content */}
                            <div className={styles.cardTop}>
                                <img
                                    className={styles.cardImage}
                                    src={app.propertyImage}
                                    alt={app.propertyName}
                                    loading="lazy"
                                />
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.cardPropertyName}>
                                        {app.propertyName}
                                    </h3>
                                    <p className={styles.cardAddress}>{app.address}</p>
                                    <span className={styles.cardPrice}>{app.price}/mo</span>
                                </div>
                            </div>

                            {/* Bottom */}
                            <div className={styles.cardBottom}>
                                <div className={styles.cardMeta}>
                                    <span className={styles.cardDate}>
                                        <Calendar />
                                        {app.appliedDate}
                                    </span>
                                </div>
                                <span
                                    className={`${styles.statusBadge} ${getStatusClass(
                                        app.status
                                    )}`}
                                >
                                    {getStatusLabel(app.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
