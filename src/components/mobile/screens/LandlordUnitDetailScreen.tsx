"use client";

import { ArrowLeft, User, Phone, MessageSquare, Wrench, MoreHorizontal, FileText, Download } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertyDetailScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
const UNIT_DATA = {
  id: "u1",
  name: "Unit 101",
  status: "occupied",
  rent: "₱15,000",
  deposit: "₱30,000",
  leaseStart: "Jan 1, 2026",
  leaseEnd: "Dec 31, 2026",
  tenant: {
    name: "Juan Dela Cruz",
    phone: "+63 917 123 4567",
    email: "juan.delacruz@email.com"
  }
};

export default function LandlordUnitDetailScreen() {
  const { goBack, navigate } = useNavigation();

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={goBack}>
          <ArrowLeft />
        </button>
        <span className={styles.topBarTitle}>Unit Detail</span>
        <button className={styles.actionButton}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className={styles.scrollArea}>
        {/* Title Header */}
        <div className={styles.sectionHeader} style={{ marginTop: '16px' }}>
          <div>
            <h1 className={styles.sectionTitle}>{UNIT_DATA.name}</h1>
            <div style={{color: '#a3a3a3', fontSize: '13px', marginTop: '4px'}}>
              Skyline Lofts
            </div>
          </div>
          <div className={`${styles.unitStatus} ${styles.occupied}`}>
            {UNIT_DATA.status}
          </div>
        </div>

        {/* Tenant Information Card */}
        <div className={styles.tenantCard}>
          <div className={styles.tenantAvatar}>
            {UNIT_DATA.tenant.name.charAt(0)}
          </div>
          <div className={styles.tenantName}>{UNIT_DATA.tenant.name}</div>
          <div className={styles.tenantContact}>{UNIT_DATA.tenant.phone} • {UNIT_DATA.tenant.email}</div>
          
          <div className={styles.contactActions}>
            <button 
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={() => navigate("chatConversation", { conversationId: "tenant1", conversationName: UNIT_DATA.tenant.name, roleCheck: "landlord" })}
            >
              <MessageSquare size={16} /> Message
            </button>
            <button className={styles.actionBtn}>
              <Phone size={16} /> Call
            </button>
          </div>
        </div>

        {/* Lease Summary */}
        <h2 className={styles.sectionTitle} style={{ marginBottom: '16px', fontSize: '15px' }}>Lease Agreement</h2>
        <div className={styles.leaseInfoBox}>
          <div className={styles.leaseRow}>
            <span className={styles.leaseLabel}>Monthly Rent</span>
            <span className={styles.leaseValue} style={{ color: '#6d9838', fontSize: '15px' }}>{UNIT_DATA.rent}</span>
          </div>
          <div className={styles.leaseRow}>
            <span className={styles.leaseLabel}>Security Deposit</span>
            <span className={styles.leaseValue}>{UNIT_DATA.deposit}</span>
          </div>
          <div className={styles.leaseRow}>
            <span className={styles.leaseLabel}>Start Date</span>
            <span className={styles.leaseValue}>{UNIT_DATA.leaseStart}</span>
          </div>
          <div className={styles.leaseRow}>
            <span className={styles.leaseLabel}>End Date</span>
            <span className={styles.leaseValue}>{UNIT_DATA.leaseEnd}</span>
          </div>
          
          {/* Action Row */}
          <div className={styles.leaseRow} style={{ borderBottom: 'none', paddingTop: '16px', marginTop: '4px' }}>
             <button style={{
               background: 'transparent', border: 'none', color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer'
             }}>
               <FileText size={16} /> Options
             </button>
             <button style={{
               background: 'transparent', border: 'none', color: '#6d9838', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
             }}>
               <Download size={16} /> Download Copy
             </button>
          </div>
        </div>
        
        {/* Maintenance History */}
        <h2 className={styles.sectionTitle} style={{ marginBottom: '16px', fontSize: '15px' }}>Recent Maintenance</h2>
        <div className={styles.unitList}>
            <div className={styles.unitCard}>
                <div className={styles.unitLeft}>
                  <div className={styles.unitIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className={styles.unitName} style={{fontSize: '14px'}}>Plumbing Issue</div>
                    <div className={styles.unitTenant}>Reported Mar 12, 2026</div>
                  </div>
                </div>
                <div className={`${styles.unitStatus}`} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  Pending
                </div>
            </div>
            
            <div className={styles.unitCard}>
                <div className={styles.unitLeft}>
                  <div className={styles.unitIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className={styles.unitName} style={{fontSize: '14px'}}>AC Cleaning</div>
                    <div className={styles.unitTenant}>Fixed Jan 10, 2026</div>
                  </div>
                </div>
                <div className={`${styles.unitStatus}`} style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                  Resolved
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
