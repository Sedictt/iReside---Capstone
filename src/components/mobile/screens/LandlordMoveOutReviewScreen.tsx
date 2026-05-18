"use client";

import { ArrowLeft, User } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMoveOutReviewScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordMoveOutReviewScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Move-Out Review</span>
                <div className={styles.actionButton} />
            </div>

            <EmptyState
                icon={User}
                title="No move-out requests"
                description="When tenants request to move out, their review details will appear here."
            />
        </div>
    );
}
