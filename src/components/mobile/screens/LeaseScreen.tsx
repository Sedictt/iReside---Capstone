"use client";

import { useState } from "react";
import {
    ArrowLeft, FileText, Building2, MapPin, Calendar, Wallet,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { useLeases } from "@/lib/hooks/useLeases";
import styles from "./LeaseScreen.module.css";

const STATUS_CLASSES: Record<string, string> = {
    active: "statusActive",
    pending_signature: "statusPending",
    pending_tenant_signature: "statusPending",
    pending_landlord_signature: "statusPending",
    expired: "statusExpired",
    terminated: "statusExpired",
    draft: "statusPending",
};

const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    pending_signature: "Pending",
    pending_tenant_signature: "Awaiting Your Signature",
    pending_landlord_signature: "Awaiting Landlord",
    expired: "Expired",
    terminated: "Terminated",
    draft: "Draft",
};

function LeaseListScreen({ onSelectLease }: { onSelectLease: (id: string) => void }) {
    const { switchTab } = useNavigation();
    const { leases, loading } = useLeases();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={() => switchTab("home")}>
                    <ArrowLeft />
                </button>
                <div className={styles.actionButton}></div>
            </div>

            <div className={styles.header} style={{ paddingTop: 0 }}>
                <h1 className={styles.headerTitle}>My Leases</h1>
                <p className={styles.headerSub}>View your active and past lease agreements.</p>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                    <p>Loading leases...</p>
                </div>
            ) : leases.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><FileText /></div>
                    <h2 className={styles.emptyTitle}>No Leases Found</h2>
                    <p className={styles.emptySub}>You don't have any formal lease agreements yet.</p>
                </div>
            ) : (
                <div className={styles.scrollArea}>
                    {leases.map((lease) => {
                        const statusClass = styles[STATUS_CLASSES[lease.status] ?? "statusPending"];
                        const statusLabel = STATUS_LABELS[lease.status] ?? lease.status;
                        const unitName = (lease.unit as any)?.name ?? "";
                        const propertyName = (lease.unit as any)?.property?.name ?? "";
                        return (
                            <div key={lease.id} className={styles.leaseCard} onClick={() => onSelectLease(lease.id)}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.propertyName}>{propertyName || "Lease Agreement"}</h3>
                                        {unitName && (
                                            <div className={styles.unitName}><Building2 />{unitName}</div>
                                        )}
                                    </div>
                                    <div className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Term</span>
                                        <span className={styles.detailValue}>
                                            {new Date(lease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - {new Date(lease.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Monthly Rent</span>
                                        <span className={`${styles.detailValue} ${styles.priceValue}`}>₱{lease.monthly_rent.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function LeaseDetailsScreen({ leaseId, onBack }: { leaseId: string; onBack: () => void }) {
    const { navigate } = useNavigation();
    const { leases } = useLeases();
    const lease = leases.find((l) => l.id === leaseId);

    if (!lease) {
        return (
            <div className={styles.container}>
                <div className={styles.topBar}>
                    <button className={styles.backButton} onClick={onBack}>
                        <ArrowLeft />
                    </button>
                    <span className={styles.topBarTitle}>Lease Agreement</span>
                    <div className={styles.actionButton}></div>
                </div>
                <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                    <p>Lease not found.</p>
                </div>
            </div>
        );
    }

    const statusClass = styles[STATUS_CLASSES[lease.status] ?? "statusPending"];
    const statusLabel = STATUS_LABELS[lease.status] ?? lease.status;
    const propertyName = (lease.unit as any)?.property?.name ?? "";
    const propertyAddress = (lease.unit as any)?.property?.address ?? "";
    const unitName = (lease.unit as any)?.name ?? "";
    const isPending = lease.status === "pending_signature" || lease.status === "pending_tenant_signature";
    const isActive = lease.status === "active";

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Lease Agreement</span>
                <div className={styles.actionButton}></div>
            </div>

            <div className={styles.scrollArea}>
                <div className={styles.detailHeader}>
                    <div className={`${styles.statusBadge} ${statusClass}`} style={{ display: "inline-block", marginBottom: "12px" }}>
                        {statusLabel}
                    </div>
                    <h2 className={styles.detailPropertyName}>{propertyName || "Lease Agreement"}</h2>
                    <div className={styles.detailAddress}>
                        <MapPin />{propertyAddress || unitName}
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionTitle}><Wallet /> Financial Terms</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Monthly Rent</span>
                        <span className={`${styles.detailValue} ${styles.priceValue}`}>₱{lease.monthly_rent.toLocaleString()}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Security Deposit</span>
                        <span className={styles.detailValue}>₱{lease.security_deposit?.toLocaleString() ?? "N/A"}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Payment Due</span>
                        <span className={styles.detailValue}>1st of each month</span>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionTitle}><Calendar /> Lease Period</div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Start Date</span>
                        <span className={styles.detailValue}>
                            {new Date(lease.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>End Date</span>
                        <span className={styles.detailValue}>
                            {new Date(lease.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                    </div>
                </div>

                {isPending && (
                    <button className={styles.signCTA} onClick={() => navigate("leaseSigning", { leaseId: lease.id })}>
                        Sign Lease Agreement
                    </button>
                )}

                {isActive && (
                    <button className={styles.moveInCTA} onClick={() => navigate("moveInChecklist", { leaseId: lease.id })}>
                        Perform Move-in Checklist
                    </button>
                )}
            </div>
        </div>
    );
}

export default function LeaseScreen() {
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
    if (selectedLeaseId) {
        return <LeaseDetailsScreen leaseId={selectedLeaseId} onBack={() => setSelectedLeaseId(null)} />;
    }
    return <LeaseListScreen onSelectLease={setSelectedLeaseId} />;
}


