"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    CreditCard, 
    CheckCircle2, 
    Lock,
    Wallet
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./CheckoutScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_INVOICE = {
    id: "inv_0326",
    title: "March 2026 Rent",
    amount: 15000,
    convenienceFee: 150,
    dueDate: "March 15, 2026"
};

export default function CheckoutScreen() {
    const { goBack, navigate } = useNavigation();
    const [selectedMethod, setSelectedMethod] = useState("card");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const totalAmount = MOCK_INVOICE.amount + MOCK_INVOICE.convenienceFee;

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    if (isSuccess) {
        return (
            <div className={styles.container}>
                <div className={styles.successState}>
                    <div className={styles.successIcon}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className={styles.successTitle}>Payment Successful!</h2>
                    <p className={styles.successDesc}>
                        Your payment of ₱{totalAmount.toLocaleString()} for {MOCK_INVOICE.title} has been processed successfully.
                    </p>
                    <button className={styles.primaryBtn} onClick={() => navigate("tenantHome")}>
                        Return Home
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => navigate("payments")}>
                        View Receipt
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Checkout</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                {/* Summary Card */}
                <div className={styles.summaryCard}>
                    <h2 className={styles.invoiceTitle}>{MOCK_INVOICE.title}</h2>
                    <div className={styles.amountDisplay}>
                        <span className={styles.currency}>₱</span>
                        <span className={styles.amount}>{MOCK_INVOICE.amount.toLocaleString()}</span>
                    </div>

                    <div className={styles.breakdown}>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>Rent Amount</span>
                            <span className={styles.breakdownValue}>₱{MOCK_INVOICE.amount.toLocaleString()}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span className={styles.breakdownLabel}>Convenience Fee</span>
                            <span className={styles.breakdownValue}>₱{MOCK_INVOICE.convenienceFee.toLocaleString()}</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.breakdownRow}>
                            <span className={styles.totalLabel}>Total Due</span>
                            <span className={styles.totalValue}>₱{totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <h3 className={styles.sectionTitle}>Select Payment Method</h3>
                <div className={styles.methodsList}>
                    {/* GCash */}
                    <div 
                        className={`${styles.methodCard} ${selectedMethod === 'gcash' ? styles.methodActive : ''}`}
                        onClick={() => setSelectedMethod('gcash')}
                    >
                        <div className={styles.methodIconWrapper} style={{ background: '#005CE6', color: '#fff' }}>
                            <Wallet size={20} />
                        </div>
                        <div className={styles.methodInfo}>
                            <div className={styles.methodName}>GCash</div>
                            <div className={styles.methodDesc}>Instant transfer via E-Wallet</div>
                        </div>
                        <div className={styles.radio}>
                            {selectedMethod === 'gcash' && <div className={styles.radioInner} />}
                        </div>
                    </div>

                    {/* Credit/Debit Card */}
                    <div 
                        className={`${styles.methodCard} ${selectedMethod === 'card' ? styles.methodActive : ''}`}
                        onClick={() => setSelectedMethod('card')}
                    >
                        <div className={styles.methodIconWrapper} style={{ background: '#3b82f6', color: '#fff' }}>
                            <CreditCard size={20} />
                        </div>
                        <div className={styles.methodInfo}>
                            <div className={styles.methodName}>Credit / Debit Card</div>
                            <div className={styles.methodDesc}>Visa, Mastercard, JCB</div>
                        </div>
                        <div className={styles.radio}>
                            {selectedMethod === 'card' && <div className={styles.radioInner} />}
                        </div>
                    </div>

                    {/* Bank Transfer */}
                    <div 
                        className={`${styles.methodCard} ${selectedMethod === 'bank' ? styles.methodActive : ''}`}
                        onClick={() => setSelectedMethod('bank')}
                    >
                        <div className={styles.methodIconWrapper} style={{ background: '#6d9838', color: '#fff' }}>
                            <Wallet size={20} />
                        </div>
                        <div className={styles.methodInfo}>
                            <div className={styles.methodName}>Bank Transfer</div>
                            <div className={styles.methodDesc}>BPI, BDO, UnionBank</div>
                        </div>
                        <div className={styles.radio}>
                            {selectedMethod === 'bank' && <div className={styles.radioInner} />}
                        </div>
                    </div>
                </div>

                <div className={styles.securityNote}>
                    <Lock size={12} className={styles.securityIcon} />
                    Payments are secure and encrypted by PayMongo.
                </div>
            </div>

            {/* Pay Button Footer */}
            <div className={styles.footer}>
                <button 
                    className={`${styles.payBtn} ${isProcessing ? styles.loading : ''}`}
                    onClick={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? "Processing..." : `Pay ₱${totalAmount.toLocaleString()}`}
                </button>
            </div>
        </div>
    );
}
