"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Wrench, 
    Camera, 
    Image as ImageIcon,
    AlertTriangle,
    Clock,
    Check
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantMaintenanceScreen.module.css";

type Urgency = "low" | "medium" | "high" | "emergency";

export default function TenantMaintenanceScreen() {
    const { goBack } = useNavigation();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState<Urgency>("medium");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = () => {
        if (!title || !description) {
            alert("Please provide a title and description.");
            return;
        }
        
        setIsSubmitting(true);
        // Mock API call
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
                        <Check size={40} />
                    </div>
                    <h2 className={styles.successTitle}>Request Submitted</h2>
                    <p className={styles.successDesc}>
                        Your maintenance request has been sent to the property manager. We will notify you once it is reviewed.
                    </p>
                    <button className={styles.primaryBtn} onClick={goBack}>
                        Return Home
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
                <h1 className={styles.headerTitle}>Request Fix</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                <div className={styles.infoBanner}>
                    <AlertTriangle size={18} className={styles.infoIcon} />
                    <p>For emergencies (e.g., active leak, fire), please contact the property manager directly at <strong>+63 917 123 4567</strong>.</p>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Issue Title</label>
                    <input 
                        className={styles.input} 
                        placeholder="e.g., Leaking kitchen sink" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Urgency</label>
                    <div className={styles.urgencyGrid}>
                        <button 
                            className={`${styles.urgencyBtn} ${urgency === 'low' ? styles.activeLow : ''}`}
                            onClick={() => setUrgency('low')}
                        >
                            Low
                        </button>
                        <button 
                            className={`${styles.urgencyBtn} ${urgency === 'medium' ? styles.activeMedium : ''}`}
                            onClick={() => setUrgency('medium')}
                        >
                            Medium
                        </button>
                        <button 
                            className={`${styles.urgencyBtn} ${urgency === 'high' ? styles.activeHigh : ''}`}
                            onClick={() => setUrgency('high')}
                        >
                            High
                        </button>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea 
                        className={styles.textarea} 
                        placeholder="Please describe the issue in detail. When did it start? Where exactly is it located?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Attach Photos</label>
                    <div className={styles.photoUploadArea}>
                        <div className={styles.uploadOption}>
                            <Camera size={24} />
                            <span>Take Photo</span>
                        </div>
                        <div className={styles.uploadDivider} />
                        <div className={styles.uploadOption}>
                            <ImageIcon size={24} />
                            <span>Choose Library</span>
                        </div>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Preferred Access Times</label>
                    <div className={styles.accessOption}>
                        <Clock size={16} className={styles.accessIcon} />
                        <span className={styles.accessText}>I grant permission to enter with a master key.</span>
                        <input type="checkbox" className={styles.checkbox} defaultChecked />
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
