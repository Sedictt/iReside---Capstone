"use client";

import { ArrowLeft, ClipboardList } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./ApplicationDetailScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function ApplicationDetailScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Application Detail</span>
                <div className={styles.actionButton} />
            </div>

            <EmptyState
                icon={ClipboardList}
                title="No application selected"
                description="Select an application to view its details and status."
            />
        </div>
    );
}
