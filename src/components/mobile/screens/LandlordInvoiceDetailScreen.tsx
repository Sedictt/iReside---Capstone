"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    FileText, 
    Download,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Building2,
    Share2
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordInvoiceDetailScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_INVOICE = {
    id: "INV-2026-03-15",
    tenant: "Jane Doe",
    property: "Skyline Lofts",
    unit: "Unit 12A",
    amountDue: 18500,
    dueDate: "March 15, 2026",
    status: "paid", // unpaid, paid, overdue
    paidDate: "March 12, 2026",
    paymentMethod: "GCash",
    items: [
        { desc: "Monthly Rent", amount: 18000 },
        { desc: "Water Utility", amount: 500 }
    ]
};

export default function LandlordInvoiceDetailScreen() {
    const { goBack } = useNavigation();
    
    const getStatusDisplay = (status: string) => {
        switch(status) {
            case 'paid': return { text: "Paid", color: "textGreen", icon: CheckCircle2 };
            case 'overdue': return { text: "Overdue", color: "textRed", icon: AlertCircle };
            default: return { text: "Pending", color: "textAmber", icon: Clock };
        }
    };

    const statusDisplay = getStatusDisplay(MOCK_INVOICE.status);
    const StatusIcon = statusDisplay.icon;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Invoice Details</h1>
                <button className={styles.actionBtn}>
                    <Share2 size={20} />
                </button>
            </div>

            <div className={styles.scrollArea}>
                {/* Invoice Header */}
                <div className={styles.invoiceHeaderCard}>
                    <div className={styles.invoiceMeta}>
                        <span className={styles.invoiceId}>{MOCK_INVOICE.id}</span>
                        <div className={`${styles.statusBadge} ${styles[statusDisplay.color]}`}>
                            <StatusIcon size={14} />
                            {statusDisplay.text}
                        </div>
                    </div>
                    
                    <div className={styles.amountWrapper}>
                        <span className={styles.currency}>₱</span>
                        <span className={styles.amountTotal}>{MOCK_INVOICE.amountDue.toLocaleString()}</span>
                    </div>

                    {MOCK_INVOICE.status === 'paid' && (
                        <div className={styles.paidMeta}>
                            Paid on {MOCK_INVOICE.paidDate} via {MOCK_INVOICE.paymentMethod}
                        </div>
                    )}
                </div>

                {/* Details Card */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Billed To</h3>
                    <div className={styles.detailRow}>
                        <User size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Tenant</div>
                            <div className={styles.detailValue}>{MOCK_INVOICE.tenant}</div>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <Building2 size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Property & Unit</div>
                            <div className={styles.detailValue}>{MOCK_INVOICE.property} — {MOCK_INVOICE.unit}</div>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.detailRow}>
                        <Clock size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Due Date</div>
                            <div className={styles.detailValue}>{MOCK_INVOICE.dueDate}</div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Breakdown</h3>
                    <div className={styles.itemsList}>
                        {MOCK_INVOICE.items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <span className={styles.itemDesc}>{item.desc}</span>
                                <span className={styles.itemAmount}>₱{item.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>Total Due</span>
                        <span className={styles.totalValue}>₱{MOCK_INVOICE.amountDue.toLocaleString()}</span>
                    </div>
                </div>

                {/* Document Action */}
                <div className={styles.documentAction}>
                    <div className={styles.docInfo}>
                        <FileText size={20} className={styles.docIcon} />
                        <div>
                            <div className={styles.docTitle}>Original Invoice (PDF)</div>
                            <div className={styles.docSize}>Auto-generated by iReside</div>
                        </div>
                    </div>
                    <button className={styles.downloadBtn}>
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Remind Button for Unpaid */}
            {MOCK_INVOICE.status !== 'paid' && (
                <div className={styles.footer}>
                    <button className={styles.primaryBtn}>
                        <AlertCircle size={18} /> Send Payment Reminder
                    </button>
                </div>
            )}
        </div>
    );
}
