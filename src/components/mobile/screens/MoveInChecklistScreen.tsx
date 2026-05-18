"use client";

import { ClipboardCheck } from "lucide-react";
import styles from "./MoveInChecklistScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function MoveInChecklistScreen() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Move-In Checklist</h1>
                <p className={styles.headerSub}>
                    Document the condition of your unit before moving in.
                </p>
            </div>

            <EmptyState
                icon={ClipboardCheck}
                title="No active lease"
                description="A move-in checklist will be available once your lease is active."
            />
        </div>
    );
}
