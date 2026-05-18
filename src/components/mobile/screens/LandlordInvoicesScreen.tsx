"use client";

import { FileText } from "lucide-react";
import styles from "./LandlordInvoicesScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordInvoicesScreen({ isSubView = false }: { isSubView?: boolean }) {
    return (
        <div className={styles.container}>
            {!isSubView && (
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h1 className={styles.headerTitle}>Invoices</h1>
                    </div>
                </div>
            )}

            <EmptyState
                icon={FileText}
                title="No invoices yet"
                description="When tenants are assigned and rent is due, invoices will appear here."
            />
        </div>
    );
}
