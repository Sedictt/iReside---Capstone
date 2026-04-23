"use client";

import { useState } from "react";
import {
    ArrowLeft,
    FileText,
    Calendar,
    Wallet,
    Building2,
    MapPin,
    MessageSquare,
    Phone,
    Download,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LeaseScreen.module.css";
import LeaseSigningScreen from "./LeaseSigningScreen";

// ─── Types and Data ─────────────────────────────────────────
type LeaseStatus = "active" | "pending" | "expired";

interface Lease {
    id: string;
    propertyName: string;
    unitName: string;
    address: string;
    status: LeaseStatus;
    startDate: string;
    endDate: string;
    rentAmount: string;
    deposit: string;
    landlord: {
        name: string;
        phone: string;
    };
}

const MOCK_LEASES: Lease[] = [
    {
        id: "lease1",
        propertyName: "Skyline Lofts",
        unitName: "Unit 12A",
        address: "Maysan, Valenzuela",
        status: "active",
        startDate: "Jan 1, 2026",
        endDate: "Dec 31, 2026",
        rentAmount: "₱15,000",
        deposit: "₱30,000",
        landlord: {
            name: "Mr. Santos",
            phone: "+63 917 123 4567",
        },
    },
    {
        id: "lease2",
        propertyName: "Dalandanan Residences",
        unitName: "Suite 4B",
        address: "Dalandanan, Valenzuela",
        status: "expired",
        startDate: "Jan 1, 2024",
        endDate: "Dec 31, 2024",
        rentAmount: "₱12,000",
        deposit: "₱24,000",
        landlord: {
            name: "Maria Reyes",
            phone: "+63 918 888 7777",
        },
    },
    {
        id: "lease3",
        propertyName: "Metro Studio B",
        unitName: "Unit 205",
        address: "Quezon City, Manila",
        status: "pending",
        startDate: "May 1, 2026",
        endDate: "Apr 30, 2027",
        rentAmount: "₱18,500",
        deposit: "₱37,000",
        landlord: {
            name: "Roberto Santos",
            phone: "+63 915 222 3333",
        },
    },
];

const getStatusBadgeClass = (status: LeaseStatus) => {
    switch (status) {
        case "active":
            return styles.statusActive;
        case "pending":
            return styles.statusPending;
        case "expired":
            return styles.statusExpired;
    }
};

const getStatusLabel = (status: LeaseStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

// ─── Sub-Component: Lease List ─────────────────────────────
function LeaseListScreen({
    onSelectLease,
}: {
    onSelectLease: (id: string) => void;
}) {
    const { switchTab } = useNavigation();

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
                <p className={styles.headerSub}>
                    View your active and past lease agreements.
                </p>
            </div>

            {MOCK_LEASES.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <FileText />
                    </div>
                    <h2 className={styles.emptyTitle}>No Leases Found</h2>
                    <p className={styles.emptySub}>
                        You don't have any formal lease agreements yet.
                    </p>
                </div>
            ) : (
                <div className={styles.scrollArea}>
                    {MOCK_LEASES.map((lease) => (
                        <div
                            key={lease.id}
                            className={styles.leaseCard}
                            onClick={() => onSelectLease(lease.id)}
                        >
                            {/* Header */}
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.propertyName}>{lease.propertyName}</h3>
                                    <div className={styles.unitName}>
                                        <Building2 />
                                        {lease.unitName}
                                    </div>
                                </div>
                                <div
                                    className={`${styles.statusBadge} ${getStatusBadgeClass(
                                        lease.status
                                    )}`}
                                >
                                    {getStatusLabel(lease.status)}
                                </div>
                            </div>

                            {/* Body */}
                            <div className={styles.cardBody}>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Term</span>
                                    <span className={styles.detailValue}>
                                        {lease.startDate} - {lease.endDate}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Monthly Rent</span>
                                    <span className={`${styles.detailValue} ${styles.priceValue}`}>
                                        {lease.rentAmount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Sub-Component: Lease Details ──────────────────────────
function LeaseDetailsScreen({
    lease,
    onBack,
}: {
    lease: Lease;
    onBack: () => void;
}) {
    const { navigate } = useNavigation();

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Lease Agreement</span>
                <div className={styles.actionButton}></div> {/* Empty space for centering */}
            </div>

            <div className={styles.scrollArea}>
                {/* Header Info */}
                <div className={styles.detailHeader}>
                    <div
                        className={`${styles.statusBadge} ${getStatusBadgeClass(
                            lease.status
                        )}`}
                        style={{ display: "inline-block", marginBottom: "12px" }}
                    >
                        {getStatusLabel(lease.status)}
                    </div>
                    <h2 className={styles.detailPropertyName}>{lease.propertyName}</h2>
                    <div className={styles.detailAddress}>
                        <MapPin />
                        {lease.address} — {lease.unitName}
                    </div>
                </div>

                {/* Financial Terms */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Wallet /> Financial Terms
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Monthly Rent</span>
                        <span className={`${styles.detailValue} ${styles.priceValue}`}>
                            {lease.rentAmount}
                        </span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Security Deposit</span>
                        <span className={styles.detailValue}>{lease.deposit}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Payment Due</span>
                        <span className={styles.detailValue}>1st of each month</span>
                    </div>
                </div>

                {/* Dates */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Calendar /> Lease Period
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Start Date</span>
                        <span className={styles.detailValue}>{lease.startDate}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>End Date</span>
                        <span className={styles.detailValue}>{lease.endDate}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Duration</span>
                        <span className={styles.detailValue}>12 Months</span>
                    </div>
                </div>

                {/* Landlord Info */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>
                        <Building2 /> Landlord / Property Manager
                    </div>
                    <div className={styles.landlordCard}>
                        <div className={styles.landlordAvatar}>
                            {lease.landlord.name.charAt(0)}
                        </div>
                        <div className={styles.landlordDetails}>
                            <div className={styles.landlordName}>{lease.landlord.name}</div>
                            <div className={styles.landlordRole}>Owner & Manager</div>
                        </div>
                        <div className={styles.contactButtons}>
                            <button
                                className={styles.contactBtn}
                                onClick={() =>
                                    navigate("chatConversation", {
                                        conversationId: "landlord1",
                                        conversationName: lease.landlord.name,
                                    })
                                }
                            >
                                <MessageSquare size={16} />
                            </button>
                            <button className={styles.contactBtn}>
                                <Phone size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Download PDF Button */}
                <button className={styles.docButton}>
                    <div className={styles.docIcon}>
                        <FileText />
                    </div>
                    <div className={styles.docText}>
                        <div>Full Lease Agreement</div>
                        <div className={styles.docDownload}>PDF Document (2.4MB)</div>
                    </div>
                    <Download size={20} className={styles.docDownload} />
                </button>

                {/* Sign Lease Button (Conditional) */}
                {lease.status === "pending" && (
                    <button 
                        className={styles.signCTA}
                        onClick={() => navigate("leaseSigning", { leaseId: lease.id })}
                    >
                        Sign Lease Agreement
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main Controller Component ─────────────────────────────
export default function LeaseScreen() {
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

    if (selectedLeaseId) {
        const activeLease = MOCK_LEASES.find((l) => l.id === selectedLeaseId)!;
        return (
            <LeaseDetailsScreen
                lease={activeLease}
                onBack={() => setSelectedLeaseId(null)}
            />
        );
    }

    return <LeaseListScreen onSelectLease={setSelectedLeaseId} />;
}
