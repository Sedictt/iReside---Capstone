"use client";

import { ArrowLeft, Check, X, Building2, MapPin, Download, FileText, Briefcase, ChevronRight } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordApplicationsScreen.module.css";

export default function LandlordApplicationReviewScreen() {
  const { goBack } = useNavigation();

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.reviewTopBar}>
        <button className={styles.reviewBackButton} onClick={goBack}>
          <ArrowLeft />
        </button>
        <span className={styles.reviewTopBarTitle}>Review</span>
        <div style={{ width: 36 }} /> {/* spacer */}
      </div>

      <div className={styles.scrollArea} style={{ paddingBottom: '100px' }}>
        {/* Applicant Profile */}
        <div className={styles.reviewHeader}>
          <div className={styles.reviewAvatar}>M</div>
          <h1 className={styles.reviewName}>Maria Santos</h1>
          <div className={styles.reviewTarget}>
            <Building2 size={16} /> Metro Studio B - Unit 102
          </div>
        </div>

        {/* Basic Info Data Grid */}
        <h2 className={styles.sectionTitle}>Overview</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItemBox}>
            <span className={styles.infoLabel}>Monthly Income</span>
            <span className={`${styles.infoValue} ${styles.highlight}`}>₱45,000</span>
          </div>
          <div className={styles.infoItemBox}>
            <span className={styles.infoLabel}>Credit Score</span>
            <span className={`${styles.infoValue} ${styles.highlight}`}>720</span>
          </div>
          <div className={styles.infoItemBox}>
            <span className={styles.infoLabel}>Date Applied</span>
            <span className={styles.infoValue}>Mar 15, 2026</span>
          </div>
          <div className={styles.infoItemBox}>
            <span className={styles.infoLabel}>Pets</span>
            <span className={styles.infoValue}>1 Cat</span>
          </div>
        </div>

        {/* Documents Included */}
        <h2 className={styles.sectionTitle}>Provided Documents</h2>
        <div className={styles.docList}>
          <div className={styles.docItem}>
            <div className={styles.docIcon}>
              <Briefcase size={18} />
            </div>
            <div className={styles.docInfo}>
              <div className={styles.docName}>Employment Certificate</div>
              <div className={styles.docStatus}>Verified</div>
            </div>
            <ChevronRight className={styles.docAction} size={20} />
          </div>
          
          <div className={styles.docItem}>
            <div className={`${styles.docIcon} ${styles.pending}`}>
               <FileText size={18} />
            </div>
            <div className={styles.docInfo}>
              <div className={styles.docName}>Valid ID (Passport)</div>
              <div className={styles.docStatus}>Pending Verification</div>
            </div>
            <ChevronRight className={styles.docAction} size={20} />
          </div>

          <div className={styles.docItem}>
            <div className={styles.docIcon}>
               <FileText size={18} />
            </div>
            <div className={styles.docInfo}>
              <div className={styles.docName}>Bank Statement (3mo)</div>
              <div className={styles.docStatus}>Verified</div>
            </div>
            <ChevronRight className={styles.docAction} size={20} />
          </div>
        </div>
      </div>

      {/* Approve/Reject Sticky Footer */}
      <div className={styles.actionFooter}>
        <button className={styles.rejectBtn} onClick={() => alert("Application Rejected")}>
          <X size={20} /> Reject
        </button>
        <button className={styles.approveBtn} onClick={() => alert("Application Approved!")}>
          <Check size={20} /> Approve
        </button>
      </div>

    </div>
  );
}
