"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Calendar, 
    MapPin, 
    User,
    CheckCircle2,
    XCircle,
    Banknote,
    MessageSquare,
    AlertCircle
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMoveOutReviewScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_REQUEST = {
    id: "req_123",
    tenantName: "Juan Dela Cruz",
    property: "Skyline Lofts",
    unit: "Unit 12A",
    requestedDate: "March 31, 2026",
    reason: "Relocation for Work/Study",
    depositAmount: 30000,
    status: "pending" // pending, approved, rejected
};

export default function LandlordMoveOutReviewScreen() {
    const { goBack } = useNavigation();
    const [status, setStatus] = useState(MOCK_REQUEST.status);
    const [deductions, setDeductions] = useState("0");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = (action: "approve" | "reject") => {
        setIsSubmitting(true);
        setTimeout(() => {
            setStatus(action === "approve" ? "approved" : "rejected");
            setIsSubmitting(false);
        }, 1500);
    };

    const parsedDeductions = parseFloat(deductions.replace(/,/g, "")) || 0;
    const finalReturn = MOCK_REQUEST.depositAmount - parsedDeductions;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Review Move-Out</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                {status !== "pending" && (
                    <div className={`${styles.statusBanner} ${status === 'approved' ? styles.bannerApproved : styles.bannerRejected}`}>
                        {status === 'approved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        <span>Request {status.toUpperCase()}</span>
                    </div>
                )}

                {/* Tenant & Lease Info */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Request Details</h2>
                    
                    <div className={styles.detailRow}>
                        <User size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Tenant</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.tenantName}</div>
                        </div>
                    </div>

                    <div className={styles.detailRow}>
                        <MapPin size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Property & Unit</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.property} — {MOCK_REQUEST.unit}</div>
                        </div>
                    </div>

                    <div className={styles.detailRow}>
                        <Calendar size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Proposed Move-Out Date</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.requestedDate}</div>
                        </div>
                    </div>

                    <div className={styles.detailRow}>
                        <AlertCircle size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Reason</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.reason}</div>
                        </div>
                    </div>
                </div>

                {/* Financial Settlement */}
                <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>Deposit Settlement</h2>
                    
                    <div className={styles.financeRow}>
                        <span className={styles.financeLabel}>Original Deposit</span>
                        <span className={styles.financeValue}>₱{MOCK_REQUEST.depositAmount.toLocaleString()}</span>
                    </div>

                    <div className={styles.financeInputRow}>
                        <span className={styles.financeLabel}>Damages/Deductions</span>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currency}>₱</span>
                            <input 
                                type="number"
                                className={styles.amountInput}
                                value={deductions}
                                onChange={(e) => setDeductions(e.target.value)}
                                disabled={status !== "pending"}
                            />
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.financeRow}>
                        <span className={styles.financeTotalLabel}>Final Amount to Return</span>
                        <span className={`${styles.financeTotalValue} ${finalReturn < 0 ? styles.negative : ''}`}>
                            ₱{finalReturn.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Notes */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Notes / Final Inspection Remarks</label>
                    <textarea 
                        className={styles.textarea}
                        placeholder="Add notes for the tenant..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={status !== "pending"}
                    />
                </div>
            </div>

            {/* Actions */}
            {status === "pending" && (
                <div className={styles.footer}>
                    <button 
                        className={styles.rejectBtn}
                        onClick={() => handleAction("reject")}
                        disabled={isSubmitting}
                    >
                        Reject
                    </button>
                    <button 
                        className={styles.approveBtn}
                        onClick={() => handleAction("approve")}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : "Approve & Settle"}
                    </button>
                </div>
            )}
        </div>
    );
}
