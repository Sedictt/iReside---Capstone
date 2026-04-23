"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Building2, 
  MapPin, 
  Download, 
  FileText, 
  Briefcase, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordApplicationsScreen.module.css";

interface Document {
  id: string;
  name: string;
  status: "verified" | "pending" | "rejected";
  type: string;
}

export default function LandlordApplicationReviewScreen() {
  const { goBack } = useNavigation();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Employment Certificate", status: "verified", type: "work" },
    { id: "2", name: "Valid ID (Passport)", status: "pending", type: "id" },
    { id: "3", name: "Bank Statement (3mo)", status: "verified", type: "finance" },
  ]);

  const updateDocStatus = (status: "verified" | "rejected") => {
    if (!selectedDoc) return;
    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDoc.id ? { ...doc, status } : doc
    ));
    setSelectedDoc(null);
  };

  const allVerified = documents.every(d => d.status === "verified");

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

      <div className={styles.scrollArea} style={{ paddingBottom: '120px' }}>
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
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Documents Review</h2>
          {allVerified && <div className={styles.verifiedTag}><ShieldCheck size={12}/> All Verified</div>}
        </div>
        
        <div className={styles.docList}>
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className={styles.docItem}
              onClick={() => setSelectedDoc(doc)}
            >
              <div className={`${styles.docIcon} ${doc.status === 'pending' ? styles.pending : doc.status === 'rejected' ? styles.rejected : ''}`}>
                {doc.type === 'work' ? <Briefcase size={18} /> : <FileText size={18} />}
              </div>
              <div className={styles.docInfo}>
                <div className={styles.docName}>{doc.name}</div>
                <div className={`${styles.docStatus} ${styles[doc.status]}`}>
                   {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </div>
              </div>
              <div className={styles.actionPrompt}>Review <ChevronRight size={16}/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Approve/Reject Sticky Footer */}
      <div className={styles.actionFooter}>
        <button className={styles.rejectBtn} onClick={() => alert("Application Rejected")}>
          <X size={20} /> Reject
        </button>
        <button 
          className={`${styles.approveBtn} ${!allVerified ? styles.disabled : ''}`} 
          onClick={() => allVerified ? alert("Application Approved!") : alert("Verify all documents first.")}
          disabled={!allVerified}
        >
          <Check size={20} /> {allVerified ? "Approve All" : "Pending Verification"}
        </button>
      </div>

      {/* Document Viewer Modal (Simplified Simulation) */}
      {selectedDoc && (
        <div className={styles.docViewerOverlay}>
           <div className={styles.docViewerContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{selectedDoc.name}</h3>
                <button onClick={() => setSelectedDoc(null)} className={styles.closeBtn}><X size={24}/></button>
              </div>
              
              <div className={styles.docPreviewPlaceholder}>
                <div className={styles.previewGraphic}>
                   <FileText size={48} strokeWidth={1} />
                   <p>Scanned Document Preview</p>
                   <span className={styles.previewMeta}>ID_SCAN_V12.PNG (2.4MB)</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.modalRejectBtn} onClick={() => updateDocStatus("rejected")}>
                  <X size={18}/> Reject Document
                </button>
                <button className={styles.modalVerifyBtn} onClick={() => updateDocStatus("verified")}>
                  <Check size={18}/> Verify & Mark Ready
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
