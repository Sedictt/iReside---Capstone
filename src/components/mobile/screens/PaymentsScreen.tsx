"use client";

import { useState } from "react";
import {
    ArrowLeft, CreditCard, Clock, CheckCircle2, ReceiptText,
} from "lucide-react";
import { useNavigation } from "../navigation";
import { usePayments } from "@/lib/hooks/usePayments";
import styles from "./PaymentsScreen.module.css";

export default function PaymentsScreen() {
    const { goBack, navigate } = useNavigation();
    const { upcoming, history, totalDue, loading } = usePayments("tenant");
    const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

    const displayedPayments = activeTab === "upcoming" ? upcoming : history;

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Payments</span>
                <div className={styles.actionButton}></div>
            </div>

            <div className={styles.scrollArea}>
                {upcoming.length > 0 && (
                    <div className={styles.balanceCard}>
                        <span className={styles.balanceLabel}>Total Balance Due</span>
                        <span className={styles.balanceAmount}>₱{totalDue.toLocaleString()}</span>
                        {upcoming.filter(p => p.status === "failed").length > 0 && (
                            <span className={styles.balanceDue}>Overdue Invoices Detected</span>
                        )}
                        <button className={styles.payButton} onClick={() => navigate("checkout")}>
                            <CreditCard /> Pay Now
                        </button>
                        <button className={styles.changeMethodBtn} onClick={() => alert("Change Payment Method flow...")}>
                            Change Payment Method
                        </button>
                    </div>
                )}

                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${activeTab === "upcoming" ? styles.filterTabActive : ""}`}
                        onClick={() => setActiveTab("upcoming")}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`${styles.filterTab} ${activeTab === "history" ? styles.filterTabActive : ""}`}
                        onClick={() => setActiveTab("history")}
                    >
                        History
                    </button>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><Clock /></div>
                        <h3 className={styles.emptyTitle}>Loading...</h3>
                    </div>
                ) : displayedPayments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><ReceiptText /></div>
                        <h3 className={styles.emptyTitle}>No Payments Found</h3>
                        <p className={styles.emptySub}>You don't have any {activeTab} payments right now.</p>
                    </div>
                ) : (
                    <div className={styles.invoiceList}>
                        {displayedPayments.map((payment) => {
                            const isPending = payment.status === "pending" || payment.status === "processing";
                            const isFailed = payment.status === "failed";
                            return (
                                <div key={payment.id} className={styles.invoiceItem}>
                                    <div className={`${styles.invoiceIcon} ${isPending ? styles.invoiceIconPending : isFailed ? styles.invoiceIconOverdue : styles.invoiceIconCompleted}`}>
                                        {isPending || isFailed ? <Clock /> : <CheckCircle2 />}
                                    </div>
                                    <div className={styles.invoiceDetails}>
                                        <div className={styles.invoiceTitle}>{payment.description ?? "Rent Payment"}</div>
                                        <div className={styles.invoiceDate}>
                                            {payment.status === "completed"
                                                ? `Paid ${new Date(payment.paid_at ?? payment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                                : `Due ${new Date(payment.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                                            }
                                        </div>
                                    </div>
                                    <div className={styles.invoiceRight}>
                                        <span className={styles.invoiceAmount}>₱{payment.amount.toLocaleString()}</span>
                                        <span className={`${styles.statusBadge} ${isPending ? styles.statusPending : isFailed ? styles.statusOverdue : styles.statusCompleted}`}>
                                            {payment.status === "completed" ? "paid" : payment.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


