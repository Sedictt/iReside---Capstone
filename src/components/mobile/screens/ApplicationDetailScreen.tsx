"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Building2,
    MapPin,
    Calendar,
    Download
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./ApplicationDetailScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_APP = {
    id: "app_123",
    property: "Skyline Lofts",
    unit: "Unit 12A",
    address: "Maysan, Valenzuela",
    status: "approved", // pending, under_review, approved, rejected
    submittedDate: "March 15, 2026",
    moveInDate: "April 1, 2026",
    monthlyRent: "₱15,000",
    deposit: "₱30,000",
};

export default function ApplicationDetailScreen() {
    const { goBack, navigate } = useNavigation();

    const getStatusDisplay = (status: string) => {
        switch(status) {
            case 'approved': return { text: "Approved", color: "textGreen", bg: "bgGreen", icon: CheckCircle2 };
            case 'pending': return { text: "Pending Review", color: "textAmber", bg: "bgAmber", icon: Clock };
            case 'under_review': return { text: "Under Review", color: "textBlue", bg: "bgBlue", icon: FileText };
            default: return { text: "Status Unknown", color: "textGray", bg: "bgGray", icon: Clock };
        }
    };

    const statusDisplay = getStatusDisplay(MOCK_APP.status);
    const StatusIcon = statusDisplay.icon;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Application Details</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                {/* Status Banner */}
                <div className={`${styles.statusBanner} ${styles[statusDisplay.bg]}`}>
                    <StatusIcon size={24} className={styles[statusDisplay.color]} />
                    <div className={styles.statusTextWrapper}>
                        <h2 className={styles.statusTitle}>{statusDisplay.text}</h2>
                        <p className={styles.statusDesc}>
                            {MOCK_APP.status === 'approved' 
                                ? "Congratulations! Your application has been approved. Please proceed to sign the lease."
                                : "Your application is currently being processed by the property manager."}
                        </p>
                    </div>
                </div>

                {/* Property Info */}
                <div className={styles.card}>
                    <div className={styles.propertyHeader}>
                        <div className={styles.propertyIconWrapper}>
                            <Building2 size={20} className={styles.propertyIcon} />
                        </div>
                        <div>
                            <h3 className={styles.propertyTitle}>{MOCK_APP.property}</h3>
                            <p className={styles.propertyUnit}>{MOCK_APP.unit}</p>
                        </div>
                    </div>
                    <div className={styles.addressRow}>
                        <MapPin size={14} />
                        {MOCK_APP.address}
                    </div>
                </div>

                {/* Application Details */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Application Summary</h3>
                    
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Submitted On</span>
                        <span className={styles.detailValue}>{MOCK_APP.submittedDate}</span>
                    </div>
                    <div className={styles.divider} />
                    
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Proposed Move-in</span>
                        <span className={styles.detailValue}>{MOCK_APP.moveInDate}</span>
                    </div>
                    <div className={styles.divider} />

                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Monthly Rent</span>
                        <span className={styles.detailValueBold}>{MOCK_APP.monthlyRent}</span>
                    </div>
                    <div className={styles.divider} />

                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Security Deposit</span>
                        <span className={styles.detailValue}>{MOCK_APP.deposit}</span>
                    </div>
                </div>

                {/* Documents */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Submitted Documents</h3>
                    
                    <div className={styles.documentItem}>
                        <FileText size={20} className={styles.docIcon} />
                        <div className={styles.docInfo}>
                            <div className={styles.docName}>Valid ID (Front & Back)</div>
                            <div className={styles.docSize}>1.2 MB • PDF</div>
                        </div>
                        <button className={styles.downloadBtn}>
                            <Download size={16} />
                        </button>
                    </div>

                    <div className={styles.documentItem}>
                        <FileText size={20} className={styles.docIcon} />
                        <div className={styles.docInfo}>
                            <div className={styles.docName}>Proof of Income</div>
                            <div className={styles.docSize}>2.4 MB • PDF</div>
                        </div>
                        <button className={styles.downloadBtn}>
                            <Download size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Next Steps CTA */}
            {MOCK_APP.status === 'approved' && (
                <div className={styles.footer}>
                    <button 
                        className={styles.primaryBtn}
                        onClick={() => navigate("leaseSigning", { leaseId: "new_lease_123" })}
                    >
                        Sign Lease Agreement
                    </button>
                </div>
            )}
        </div>
    );
}
