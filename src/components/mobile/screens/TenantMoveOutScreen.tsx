"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Calendar, 
    CheckCircle2, 
    AlertTriangle,
    UploadCloud,
    Banknote
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantMoveOutScreen.module.css";

export default function TenantMoveOutScreen() {
    const { goBack } = useNavigation();
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [bankDetails, setBankDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = () => {
        if (!date || !reason || !bankDetails) {
            alert("Please fill in all required fields.");
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className={styles.container}>
                <div className={styles.successState}>
                    <div className={styles.successIcon}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className={styles.successTitle}>Request Submitted</h2>
                    <p className={styles.successDesc}>
                        Your move-out request has been sent to the landlord. You will be notified once the final inspection is scheduled and your deposit return is processed.
                    </p>
                    <button className={styles.primaryBtn} onClick={goBack}>
                        Return to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Request Move-Out</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                <div className={styles.infoBanner}>
                    <AlertTriangle size={20} className={styles.infoIcon} />
                    <div className={styles.infoText}>
                        <p><strong>Notice Period Required</strong></p>
                        <p>Per your lease agreement, a 30-day notice is required before moving out. Breaking the lease early may incur penalties.</p>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Proposed Move-Out Date</label>
                    <div className={styles.inputWrapper}>
                        <Calendar size={18} className={styles.inputIcon} />
                        <input 
                            type="date"
                            className={styles.input} 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Reason for Leaving</label>
                    <select 
                        className={styles.select}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    >
                        <option value="">Select a reason...</option>
                        <option value="end_of_lease">End of Lease Term</option>
                        <option value="relocation">Relocation for Work/Study</option>
                        <option value="upsizing">Need more space</option>
                        <option value="downsizing">Need less space</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Deposit Return Bank Details</label>
                    <div className={styles.inputWrapper}>
                        <Banknote size={18} className={styles.inputIcon} />
                        <input 
                            className={styles.input} 
                            placeholder="Bank Name, Account Name, Account Number"
                            value={bankDetails}
                            onChange={(e) => setBankDetails(e.target.value)}
                        />
                    </div>
                    <p className={styles.helpText}>
                        Your security deposit (minus any applicable deductions) will be transferred here within 15 days of move-out.
                    </p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Upload Photos (Optional)</label>
                    <div className={styles.uploadArea}>
                        <UploadCloud size={24} className={styles.uploadIcon} />
                        <p>Upload current photos of the unit</p>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button 
                    className={`${styles.primaryBtn} ${isSubmitting ? styles.loading : ''}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
            </div>
        </div>
    );
}
