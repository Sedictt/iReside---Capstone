"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertyDetailScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordPropertyDetailScreen() {
  const { goBack } = useNavigation();

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={goBack}>
          <ArrowLeft />
        </button>
        <span className={styles.topBarTitle}>Property Detail</span>
        <div className={styles.actionButton} />
      </div>

      <EmptyState
        icon={Building2}
        title="No property selected"
        description="Select a property to view its details, units, and performance."
      />
    </div>
  );
}
