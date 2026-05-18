"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertyDetailScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordUnitDetailScreen() {
  const { goBack } = useNavigation();

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={goBack}>
          <ArrowLeft />
        </button>
        <span className={styles.topBarTitle}>Unit Detail</span>
        <div className={styles.actionButton} />
      </div>

      <EmptyState
        icon={Home}
        title="No unit selected"
        description="Select a unit to view its details, tenant info, and lease terms."
      />
    </div>
  );
}
