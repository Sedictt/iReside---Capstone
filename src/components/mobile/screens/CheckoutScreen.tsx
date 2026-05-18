"use client";

import { ArrowLeft, CreditCard } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./CheckoutScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function CheckoutScreen() {
    const { goBack } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Checkout</span>
                <div className={styles.actionButton} />
            </div>

            <EmptyState
                icon={CreditCard}
                title="Nothing to pay"
                description="Select an invoice or payment to proceed with checkout."
            />
        </div>
    );
}
