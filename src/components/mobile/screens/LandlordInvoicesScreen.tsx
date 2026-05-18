"use client";

import { useState } from "react";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { useNavigation } from "../navigation";
import { usePayments } from "@/lib/hooks/usePayments";
import styles from "./LandlordInvoicesScreen.module.css";

export default function LandlordInvoicesScreen({ isSubView = false }: { isSubView?: boolean }) {
    const { navigate } = useNavigation();
    const { upcoming, history, loading } = usePayments("landlord");
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "overdue">("all");

    const allInvoices = [...upcoming, ...history];
    const filteredInvoices = allInvoices.filter((inv) => {
        if (activeTab === "all") return true;
        if (activeTab === "unpaid") return inv.status === "pending" || inv.status === "processing";
        if (activeTab === "overdue") return inv.status === "failed";
        return true;
    });

    return (
        <div className={styles.container}>
            {!isSubView && (
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.headerTitle}>Invoices</h1>
                    </div>
                </div>
            )}

            <div style={{ padding: '0 16px', display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button className={`${styles.tab} ${activeTab === "all" ? styles.activeTab : ""}`} onClick={() => setActiveTab("all")}>All</button>
                <button className={`${styles.tab} ${activeTab === "unpaid" ? styles.activeTab : ""}`} onClick={() => setActiveTab("unpaid")}>Unpaid</button>
                <button className={`${styles.tab} ${activeTab === "overdue" ? styles.activeTab : ""}`} onClick={() => setActiveTab("overdue")}>Overdue</button>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373", fontSize: "14px" }}>
                    Loading invoices...
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373", fontSize: "14px" }}>
                    <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                    <p>No invoices found.</p>
                </div>
            ) : (
                <div className={styles.invoiceList}>
                    {filteredInvoices.map((inv) => (
                        <div
                            key={inv.id}
                            className={styles.invoiceCard}
                            onClick={() => navigate("landlordInvoiceDetail", { invoiceId: inv.id })}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.invoiceCardTop}>
                                <div className={styles.invoiceIcon}>
                                    {inv.status === "completed" ? <CheckCircle2 size={20} color="#22c55e" /> : <Clock size={20} color="#f59e0b" />}
                                </div>
                                <div className={styles.invoiceInfo}>
                                    <div className={styles.invoiceTitle}>{inv.description ?? "Rent Payment"}</div>
                                    <div className={styles.invoiceMeta}>
                                        Due: {new Date(inv.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </div>
                                </div>
                                <div className={styles.invoiceAmount}>₱{inv.amount.toLocaleString()}</div>
                            </div>
                            <div className={styles.invoiceStatus}>
                                <span className={`${styles.statusDot} ${styles[inv.status]}`} />
                                {inv.status}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
