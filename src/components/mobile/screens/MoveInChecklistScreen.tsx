"use client";

import { useState } from "react";
import { 
    ChevronLeft, 
    Camera, 
    CheckCircle2, 
    Home, 
    Bath, 
    UtensilsCrossed, 
    Lightbulb, 
    ClipboardCheck,
    AlertCircle
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./MoveInChecklistScreen.module.css";

// ─── Types & Mock Data ─────────────────────────────────────
type ItemStatus = "Excellent" | "Good" | "Needs Repair";

interface ChecklistItemProps {
    name: string;
}

function ChecklistItem({ name }: ChecklistItemProps) {
    const [status, setStatus] = useState<ItemStatus>("Good");
    const [hasPhoto, setHasPhoto] = useState(false);
    const [note, setNote] = useState("");

    return (
        <div className={styles.checkItem}>
            <div className={styles.itemHeader}>
                <span className={styles.itemName}>{name}</span>
                <button 
                    className={`${styles.photoBtn} ${hasPhoto ? styles.photoBtnActive : ""}`}
                    onClick={() => setHasPhoto(!hasPhoto)}
                >
                    <Camera size={18} />
                </button>
            </div>

            <div className={styles.statusToggle}>
                {(["Excellent", "Good", "Needs Repair"] as ItemStatus[]).map((s) => (
                    <button
                        key={s}
                        className={`${styles.statusOption} ${status === s ? styles.statusOptionActive : ""}`}
                        onClick={() => setStatus(s)}
                        data-status={s}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {status === "Needs Repair" && (
                <textarea 
                    className={styles.notesInput}
                    placeholder="Describe the issue (e.g., crack in sink, loose hinge)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            )}
        </div>
    );
}

const CATEGORIES = [
    { name: "Living / Bedroom", icon: Home, items: ["Floor & Tiles", "Wall Paint", "Windows & Locks", "Electrical Outlets"] },
    { name: "Kitchen", icon: UtensilsCrossed, items: ["Countertops", "Cabinets", "Sink & Faucet", "Stove / Range Hood"] },
    { name: "Bathroom", icon: Bath, items: ["Toilet & Flush", "Shower & Drain", "Mirror & Vanity", "Ventilation"] },
];

export default function MoveInChecklistScreen() {
    const { goBack, navigate } = useNavigation();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
        }, 2000);
    };

    if (submitted) {
        return (
            <div className={styles.successOverlay}>
                <div className={styles.successIcon}>
                    <CheckCircle2 size={40} />
                </div>
                <h2 className={styles.successTitle}>Checklist Submitted</h2>
                <p className={styles.successSub}>
                    Thank you! Your move-in report has been shared with the landlord. 
                    A copy has been saved to your lease documents.
                </p>
                <button 
                    className={styles.submitBtn} 
                    style={{ marginTop: '32px' }}
                    onClick={() => navigate("tenantHome")}
                >
                    Go back Home
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={goBack}>
                    <ChevronLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Move-in Report</h1>
            </div>

            {/* Content */}
            <div className={styles.scrollArea}>
                <h2 className={styles.stepTitle}>Unit Inspection</h2>
                <p className={styles.stepSub}>
                    Please inspect your unit thoroughly. Report any damages or repairs needed 
                    to ensure your security deposit is protected.
                </p>

                {CATEGORIES.map((cat) => (
                    <div key={cat.name} className={styles.categorySection}>
                        <div className={styles.categoryHeader}>
                            <cat.icon size={16} color="#6d9838" />
                            <h3 className={styles.categoryTitle}>{cat.name}</h3>
                        </div>
                        {cat.items.map((item) => (
                            <ChecklistItem key={item} name={item} />
                        ))}
                    </div>
                ))}

                <div className={styles.secureHint} style={{ 
                    marginTop: '24px', 
                    padding: '16px', 
                    background: '#141414', 
                    borderRadius: '16px',
                    border: '1px solid #1e1e1e',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                }}>
                    <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: '#a3a3a3', lineHeight: '1.4' }}>
                        <strong>Important:</strong> If there are major structural issues or safety hazards, 
                        please contact the landlord immediately via chat.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Finalizing report..." : "Submit Inspection Report"}
                    {!submitting && <ClipboardCheck size={20} />}
                </button>
            </div>
        </div>
    );
}
