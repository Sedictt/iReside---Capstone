"use client";

import { ArrowLeft, Wrench } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMaintenanceDetailScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordMaintenanceDetailScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Maintenance Request</span>
                <div className={styles.actionButton} />
            </div>

            <EmptyState
                icon={Wrench}
                title="No request selected"
                description="Select a maintenance request to view its details and status."
            />
        </div>
    );
}
