"use client";

import { useState } from "react";
import { Plus, Search, Calendar, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordInvoicesScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
const INVOICES = [
    { id: "inv1", tenant: "Juan Dela Cruz", unit: "Skyline Lofts - 101", amount: "₱15,000", date: "Mar 01, 2026", status: "paid" },
    { id: "inv2", tenant: "Maria Santos", unit: "Metro Studio B - 102", amount: "₱12,500", date: "Mar 05, 2026", status: "unpaid" },
    { id: "inv3", tenant: "Jose Rizal", unit: "Skyline Lofts - 201", amount: "₱18,000", date: "Feb 28, 2026", status: "overdue" },
    { id: "inv4", tenant: "Emilio Aguinaldo", unit: "Dalandanan Res - B", amount: "₱9,000", date: "Mar 10, 2026", status: "unpaid" },
];

export default function LandlordInvoicesScreen() {
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "overdue">("all");
    const { navigate } = useNavigation();

    const filteredInvoices = INVOICES.filter((inv) => {
        if (activeTab === "all") return true;
        return inv.status === activeTab;
    });

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.headerTitle}>Invoices</h1>
                    <button className={styles.createInvoiceBtn} onClick={() => alert("Create Invoice flow...")}>
                        <Plus size={18} /> New
                    </button>
                </div>

                {/* Financial Summary */}
                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Collected</span>
                        <span className={`${styles.summaryValue} ${styles.collected}`}>₱110k</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Outstanding</span>
                        <span className={`${styles.summaryValue} ${styles.overdue}`}>₱45k</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
                        onClick={() => setActiveTab("all")}
                    > All </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "unpaid" ? styles.active : ""}`}
                        onClick={() => setActiveTab("unpaid")}
                    > Unpaid </button>
                    <button 
                        className={`${styles.tab} ${activeTab === "overdue" ? styles.active : ""}`}
                        onClick={() => setActiveTab("overdue")}
                    > Overdue </button>
                </div>
            </div>

            {/* Scrollable List */}
            <div className={styles.scrollArea}>
                {filteredInvoices.map((inv) => (
                    <div 
                        key={inv.id} 
                        className={styles.invoiceCard}
                        onClick={() => navigate("landlordInvoiceDetail", { invoiceId: inv.id })}
                    >
                        <div className={styles.invoiceTop}>
                            <div className={styles.tenantInfo}>
                                <span className={styles.tenantName}>{inv.tenant}</span>
                                <span className={styles.unitName}>{inv.unit}</span>
                            </div>
                            <span className={styles.amount}>{inv.amount}</span>
                        </div>
                        <div className={styles.invoiceBottom}>
                            <div className={`${styles.dueDate} ${inv.status === "overdue" ? styles.overdue : ""}`}>
                                <Calendar size={14} />
                                {inv.date}
                            </div>
                            <div className={`${styles.statusBadge} ${styles[inv.status as keyof typeof styles]}`}>
                                {inv.status}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredInvoices.length === 0 && (
                    <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
                        <AlertCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                        <p>No invoices found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
