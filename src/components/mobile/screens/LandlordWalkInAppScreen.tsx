"use client";

import { ChevronLeft, Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordWalkInAppScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordWalkInAppScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={goBack} style={{ padding: '16px', background: 'none', border: 'none', color: '#a3a3a3' }}>
                <ChevronLeft size={24} />
            </button>

            <EmptyState
                icon={Building2}
                title="No properties available"
                description="Add properties first to be able to submit walk-in applications for prospective tenants."
            />
        </div>
    );
}
