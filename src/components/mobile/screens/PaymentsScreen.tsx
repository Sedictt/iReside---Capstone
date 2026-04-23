"use client";

import { useState } from "react";
import {
    ArrowLeft,
    Settings,
    CreditCard,
    Briefcase,
    Smartphone,
    Wallet,
    ReceiptText,
    Clock,
    CheckCircle2,
    X,
    ChevronRight,
    FileDown
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./PaymentsScreen.module.css";

// ─── Interfaces & Mock Data ─────────────────────────────────
interface Payment {
    id: string;
    title: string;
    dueDate: string;
    amount: string;
    status: "pending" | "completed" | "overdue";
    lateFee?: string;
}

const UPCOMING_PAYMENTS: Payment[] = [
    {
        id: "p0",
        title: "February Utilities",
        dueDate: "OVERDUE (Feb 5)",
        amount: "₱850",
        status: "overdue",
        lateFee: "₱50",
    },
    {
        id: "p1",
        title: "March Rent",
        dueDate: "Due Mar 1, 2026",
        amount: "₱15,000",
        status: "pending",
    },
    {
        id: "p2",
        title: "Water Utility",
        dueDate: "Due Mar 5, 2026",
        amount: "₱450",
        status: "pending",
    },
];

const PAST_PAYMENTS: Payment[] = [
    {
        id: "p3",
        title: "February Rent",
        dueDate: "Paid Feb 1, 2026",
        amount: "₱15,000",
        status: "completed",
    },
    {
        id: "p4",
        title: "Security Deposit",
        dueDate: "Paid Jan 15, 2026",
        amount: "₱30,000",
        status: "completed",
    },
];

// ─── Component ──────────────────────────────────────────────
export default function PaymentsScreen() {
    const { goBack } = useNavigation();
    const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<"gcash" | "maya" | "card" | "bank">("gcash");

    const displayedPayments =
        activeTab === "upcoming" ? UPCOMING_PAYMENTS : PAST_PAYMENTS;

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Payments</span>
                <div className={styles.actionButton}></div>
            </div>

            <div className={styles.scrollArea}>
                {/* Balance Card */}
                <div className={styles.balanceCard}>
                    <span className={styles.balanceLabel}>Total Balance Due</span>
                    <span className={styles.balanceAmount}>₱16,300</span>
                    <span className={styles.balanceDue}>Overdue Invoices Detected</span>

                    {UPCOMING_PAYMENTS.length > 0 && (
                        <button
                            className={styles.payButton}
                            onClick={() => setShowPayModal(true)}
                        >
                            <CreditCard /> Pay Now
                        </button>
                    )}
                    
                    <button 
                        className={styles.changeMethodBtn}
                        onClick={() => alert("Change Payment Method flow...")}
                    >
                        Change Payment Method
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${activeTab === "upcoming" ? styles.filterTabActive : ""
                            }`}
                        onClick={() => setActiveTab("upcoming")}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`${styles.filterTab} ${activeTab === "history" ? styles.filterTabActive : ""
                            }`}
                        onClick={() => setActiveTab("history")}
                    >
                        History
                    </button>
                </div>

                {/* History Header Action */}
                {activeTab === "history" && (
                    <div className={styles.historyActions} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end', paddingRight: '4px' }}>
                        <button className={styles.textActionButton} onClick={() => alert("Generating CSV Export...")}>
                            <FileDown size={14} /> Export History
                        </button>
                    </div>
                )}


                {/* Payments List */}
                {displayedPayments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <ReceiptText />
                        </div>
                        <h3 className={styles.emptyTitle}>No Payments Found</h3>
                        <p className={styles.emptySub}>
                            You don't have any {activeTab} payments right now.
                        </p>
                    </div>
                ) : (
                    <div className={styles.invoiceList}>
                        {displayedPayments.map((payment) => (
                            <div key={payment.id} className={styles.invoiceItem}>
                                <div
                                    className={`${styles.invoiceIcon} ${
                                        payment.status === "pending" ? styles.invoiceIconPending : 
                                        payment.status === "overdue" ? styles.invoiceIconOverdue : 
                                        styles.invoiceIconCompleted
                                    }`}
                                >
                                    {payment.status === "pending" || payment.status === "overdue" ? <Clock /> : <CheckCircle2 />}
                                </div>

                                <div className={styles.invoiceDetails}>
                                    <div className={styles.invoiceTitle}>{payment.title}</div>
                                    <div className={styles.invoiceDate}>{payment.dueDate}</div>
                                </div>

                                <div className={styles.invoiceRight}>
                                    <span className={styles.invoiceAmount}>{payment.amount}</span>
                                    <span
                                        className={`${styles.statusBadge} ${
                                            payment.status === "pending" ? styles.statusPending : 
                                            payment.status === "overdue" ? styles.statusOverdue : 
                                            styles.statusCompleted
                                        }`}
                                    >
                                        {payment.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pay Now Modal Bottom Sheet */}
            {showPayModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalSheet}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Make a Payment</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowPayModal(false)}
                            >
                                <X />
                            </button>
                        </div>

                        {/* Breakdown */}
                        <div className={styles.paymentBreakdown}>
                            {UPCOMING_PAYMENTS.map(p => (
                                <div key={p.id} className={styles.breakdownItemBlock}>
                                    <div className={styles.breakdownRow}>
                                        <span className={styles.breakdownLabel}>{p.title}</span>
                                        <span className={styles.breakdownValue}>{p.amount}</span>
                                    </div>
                                    {p.lateFee && (
                                        <div className={styles.breakdownRow} style={{ marginTop: '-4px' }}>
                                            <span className={styles.lateFeeLabel}>+ Auto Late Fee</span>
                                            <span className={styles.lateFeeValue}>{p.lateFee}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className={styles.breakdownTotal}>
                                <span className={styles.breakdownLabel}>Total Amount</span>
                                <span className={styles.breakdownValue}>₱16,300.00</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <h3 className={styles.methodTitle}>Payment Method</h3>
                        <div className={styles.methodsGrid}>
                            <div
                                className={`${styles.methodCard} ${selectedMethod === "gcash" ? styles.methodCardActive : ""
                                    }`}
                                onClick={() => setSelectedMethod("gcash")}
                            >
                                <div className={styles.methodIcon}><Smartphone /></div>
                                <div className={styles.methodName}>GCash</div>
                            </div>
                            <div
                                className={`${styles.methodCard} ${selectedMethod === "maya" ? styles.methodCardActive : ""
                                    }`}
                                onClick={() => setSelectedMethod("maya")}
                            >
                                <div className={styles.methodIcon}><Wallet /></div>
                                <div className={styles.methodName}>Maya</div>
                            </div>
                            <div
                                className={`${styles.methodCard} ${selectedMethod === "card" ? styles.methodCardActive : ""
                                    }`}
                                onClick={() => setSelectedMethod("card")}
                            >
                                <div className={styles.methodIcon}><CreditCard /></div>
                                <div className={styles.methodName}>Card</div>
                            </div>
                            <div
                                className={`${styles.methodCard} ${selectedMethod === "bank" ? styles.methodCardActive : ""
                                    }`}
                                onClick={() => setSelectedMethod("bank")}
                            >
                                <div className={styles.methodIcon}><Briefcase /></div>
                                <div className={styles.methodName}>Bank Transfer</div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            className={styles.submitPaymentBtn}
                            onClick={() => {
                                alert(`Redirecting to ${selectedMethod} payment gateway...`);
                                setShowPayModal(false);
                            }}
                        >
                            Continue to Payment <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
