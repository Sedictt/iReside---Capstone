"use client";

import { useState } from "react";
import { 
    ArrowLeft, 
    Wrench, 
    MessageSquare,
    Phone,
    MapPin,
    Calendar,
    Clock,
    AlertTriangle,
    Image as ImageIcon
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordMaintenanceDetailScreen.module.css";

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_REQUEST = {
    id: "REQ-0023",
    title: "Leaking AC Unit",
    desc: "The AC unit in the master bedroom has been leaking water since yesterday. It's pooling on the floor.",
    tenantName: "Juan Dela Cruz",
    tenantPhone: "+63 917 123 4567",
    property: "Skyline Lofts",
    unit: "Unit 12A",
    status: "in_progress", // pending, in_progress, resolved
    urgency: "high", // low, medium, high, emergency
    submittedDate: "March 10, 2026",
    hasAccess: true,
    photos: [
        "https://images.unsplash.com/photo-1585052201416-f36eb10f27dd?w=400&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80"
    ]
};

export default function LandlordMaintenanceDetailScreen() {
    const { goBack } = useNavigation();
    const [status, setStatus] = useState(MOCK_REQUEST.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdateStatus = (newStatus: string) => {
        setIsUpdating(true);
        setTimeout(() => {
            setStatus(newStatus);
            setIsUpdating(false);
        }, 1000);
    };

    const urgencyColors = {
        low: { bg: 'bgGreen', text: 'textGreen' },
        medium: { bg: 'bgAmber', text: 'textAmber' },
        high: { bg: 'bgOrange', text: 'textOrange' },
        emergency: { bg: 'bgRed', text: 'textRed' }
    };

    const currentUrgency = urgencyColors[MOCK_REQUEST.urgency as keyof typeof urgencyColors];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className={styles.headerTitle}>Request Details</h1>
                <div className={styles.headerSpacer} />
            </div>

            <div className={styles.scrollArea}>
                {/* Meta Header */}
                <div className={styles.metaHeader}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.issueTitle}>{MOCK_REQUEST.title}</h2>
                        <div className={`${styles.urgencyBadge} ${styles[currentUrgency.bg]} ${styles[currentUrgency.text]}`}>
                            {MOCK_REQUEST.urgency.toUpperCase()}
                        </div>
                    </div>
                    <div className={styles.requestId}>ID: {MOCK_REQUEST.id}</div>
                </div>

                {/* Status Selector */}
                <div className={styles.statusSection}>
                    <h3 className={styles.sectionTitle}>Current Status</h3>
                    <div className={styles.statusGrid}>
                        <button 
                            className={`${styles.statusBtn} ${status === 'pending' ? styles.activePending : ''}`}
                            onClick={() => handleUpdateStatus('pending')}
                        >
                            Pending
                        </button>
                        <button 
                            className={`${styles.statusBtn} ${status === 'in_progress' ? styles.activeProgress : ''}`}
                            onClick={() => handleUpdateStatus('in_progress')}
                        >
                            In Progress
                        </button>
                        <button 
                            className={`${styles.statusBtn} ${status === 'resolved' ? styles.activeResolved : ''}`}
                            onClick={() => handleUpdateStatus('resolved')}
                        >
                            Resolved
                        </button>
                    </div>
                    {isUpdating && <div className={styles.updatingText}>Updating status...</div>}
                </div>

                {/* Description */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Description</h3>
                    <p className={styles.descText}>{MOCK_REQUEST.desc}</p>

                    {/* Photos */}
                    <div className={styles.photoGrid}>
                        {MOCK_REQUEST.photos.map((url, idx) => (
                            <img key={idx} src={url} alt={`Issue ${idx}`} className={styles.photo} />
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Details</h3>
                    
                    <div className={styles.detailRow}>
                        <MapPin size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Location</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.property} — {MOCK_REQUEST.unit}</div>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    
                    <div className={styles.detailRow}>
                        <Calendar size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Submitted</div>
                            <div className={styles.detailValue}>{MOCK_REQUEST.submittedDate}</div>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    
                    <div className={styles.detailRow}>
                        <AlertTriangle size={16} className={styles.icon} />
                        <div>
                            <div className={styles.detailLabel}>Entry Permission</div>
                            <div className={`${styles.detailValue} ${MOCK_REQUEST.hasAccess ? styles.textGreen : styles.textAmber}`}>
                                {MOCK_REQUEST.hasAccess ? "Granted (Can use master key)" : "Tenant must be present"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenant Contact */}
                <div className={styles.card}>
                    <h3 className={styles.sectionTitle}>Tenant Contact</h3>
                    <div className={styles.contactRow}>
                        <div className={styles.avatar}>{MOCK_REQUEST.tenantName.charAt(0)}</div>
                        <div className={styles.contactInfo}>
                            <div className={styles.contactName}>{MOCK_REQUEST.tenantName}</div>
                            <div className={styles.contactPhone}>{MOCK_REQUEST.tenantPhone}</div>
                        </div>
                    </div>
                    <div className={styles.contactActions}>
                        <button className={styles.actionBtn}>
                            <Phone size={18} /> Call
                        </button>
                        <button className={styles.actionBtn}>
                            <MessageSquare size={18} /> Message
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
