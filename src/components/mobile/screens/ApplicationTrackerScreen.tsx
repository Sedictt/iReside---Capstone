"use client";

import { useState, useMemo } from "react";
import { Calendar, ClipboardList } from "lucide-react";
import { useNavigation } from "../navigation";
import { useApplications } from "@/lib/hooks/useApplications";
import styles from "./ApplicationTrackerScreen.module.css";

const FILTERS = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "reviewing", label: "Reviewing" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
] as const;

const STATUS_CLASSES: Record<string, string> = {
    pending: "statusPending",
    reviewing: "statusReviewing",
    approved: "statusApproved",
    rejected: "statusRejected",
};

const PROGRESS_CLASSES: Record<string, string> = {
    pending: "progressPending",
    reviewing: "progressReviewing",
    approved: "progressApproved",
    rejected: "progressRejected",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    reviewing: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
};

function getStatusClass(status: string) { return styles[STATUS_CLASSES[status] ?? "statusPending"]; }
function getProgressClass(status: string) { return styles[PROGRESS_CLASSES[status] ?? "progressPending"]; }
function getStatusLabel(status: string) { return STATUS_LABELS[status] ?? status; }

export default function ApplicationTrackerScreen() {
    const { navigate } = useNavigation();
    const { applications, loading } = useApplications("tenant");
    const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]["id"]>("all");

    const filteredApps = useMemo(() => {
        if (activeFilter === "all") return applications;
        return applications.filter((a) => a.status === activeFilter);
    }, [applications, activeFilter]);

    const getFilterCount = (filterId: string) => {
        if (filterId === "all") return applications.length;
        return applications.filter((a) => a.status === filterId).length;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>My Applications</h1>
                <p className={styles.headerSub}>
                    {loading ? "Loading..." : <span>{applications.length}</span>} total applications
                </p>
            </div>

            <div className={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        className={`${styles.filterChip} ${activeFilter === filter.id ? styles.filterChipActive : ""}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        {filter.label}
                        <span className={styles.chipCount}>{getFilterCount(filter.id)}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.emptyState}>
                    <h2 className={styles.emptyTitle}>Loading...</h2>
                </div>
            ) : filteredApps.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><ClipboardList /></div>
                    <h2 className={styles.emptyTitle}>No Applications</h2>
                    <p className={styles.emptySub}>
                        {activeFilter === "all"
                            ? "You haven't applied to any properties yet."
                            : "No applications match this filter. Try selecting a different category."
                        }
                    </p>
                </div>
            ) : (
                <div className={styles.applicationList}>
                    {filteredApps.map((app) => {
                        const unitData = (app.unit as any);
                        const propertyName = unitData?.property?.name ?? "Property";
                        const propertyImage = unitData?.property?.images?.[0] ?? "";
                        const address = unitData?.property?.address ?? "";
                        const price = unitData?.rent_amount ? `₱${unitData.rent_amount.toLocaleString()}` : "";

                        return (
                            <div key={app.id} className={styles.applicationCard} onClick={() => navigate("applicationDetail", { applicationId: app.id })}>
                                <div className={styles.cardProgress}>
                                    <div className={`${styles.cardProgressFill} ${getProgressClass(app.status)}`} />
                                </div>
                                <div className={styles.cardTop}>
                                    {propertyImage ? (
                                        <img className={styles.cardImage} src={propertyImage} alt={propertyName} loading="lazy" />
                                    ) : (
                                        <div className={styles.cardImage} style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252' }}>
                                            <ClipboardList size={24} />
                                        </div>
                                    )}
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardPropertyName}>{propertyName}</h3>
                                        <p className={styles.cardAddress}>{address}</p>
                                        {price && <span className={styles.cardPrice}>{price}/mo</span>}
                                    </div>
                                </div>
                                <div className={styles.cardBottom}>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardDate}>
                                            <Calendar />
                                            {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <span className={`${styles.statusBadge} ${getStatusClass(app.status)}`}>
                                        {getStatusLabel(app.status)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
