"use client";

import { ArrowLeft, FileText } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordInvoiceDetailScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordInvoiceDetailScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Invoice Detail</span>
                <div className={styles.actionButton} />
            </div>

            <EmptyState
                icon={FileText}
                title="No invoice selected"
                description="Select an invoice to view its details and payment status."
            />
        </div>
    );
}
