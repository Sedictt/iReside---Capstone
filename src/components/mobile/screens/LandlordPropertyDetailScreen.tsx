"use client";

import { ArrowLeft, Edit2, MapPin, Building2, Plus, Users, LayoutDashboard } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertyDetailScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
const PROPERTY_INFO = {
  id: "prop1",
  name: "Skyline Lofts",
  address: "Maysan, Valenzuela",
  image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
  revenue: "₱180,000",
  occupancy: "100%",
  totalUnits: 12,
  occupiedUnits: 12,
};

const UNITS = [
  { id: "u1", name: "Unit 101", status: "occupied", tenant: "Juan Dela Cruz", rent: "₱15,000" },
  { id: "u2", name: "Unit 102", status: "vacant", tenant: null, rent: "₱15,000" },
  { id: "u3", name: "Unit 103", status: "occupied", tenant: "Maria Santos", rent: "₱15,000" },
  { id: "u4", name: "Unit 201", status: "occupied", tenant: "Jose Rizal", rent: "₱18,000" },
];

export default function LandlordPropertyDetailScreen() {
  const { goBack, navigate } = useNavigation();

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={goBack}>
          <ArrowLeft />
        </button>
        <span className={styles.topBarTitle}>Property Detail</span>
        <button className={styles.actionButton}>
          <Edit2 size={18} />
        </button>
      </div>

      <div className={styles.scrollArea}>
        {/* Header Image */}
        <div className={styles.imageHeader}>
          <img src={PROPERTY_INFO.image} alt={PROPERTY_INFO.name} />
          <div className={styles.imageOverlay}>
            <h1 className={styles.propertyTitle}>{PROPERTY_INFO.name}</h1>
            <div className={styles.propertyAddress}>
              <MapPin size={14} />
              {PROPERTY_INFO.address}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.highlight}`}>
            <div className={styles.statValue}>{PROPERTY_INFO.revenue}</div>
            <div className={styles.statLabel}>Monthly Rev</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{PROPERTY_INFO.occupancy}</div>
            <div className={styles.statLabel}>Occupancy</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{PROPERTY_INFO.totalUnits}</div>
            <div className={styles.statLabel}>Total Units</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{PROPERTY_INFO.occupiedUnits}</div>
            <div className={styles.statLabel}>Occupied</div>
          </div>
        </div>

        {/* Units Section */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Manage Units</h2>
          <button className={styles.addUnitBtn}>
            <Plus size={16} /> Add Unit
          </button>
        </div>

        <div className={styles.unitList}>
          {UNITS.map((unit) => {
            const isOccupied = unit.status === "occupied";
            const Icon = isOccupied ? Users : LayoutDashboard;
            
            return (
              <div 
                key={unit.id} 
                className={styles.unitCard}
                onClick={() => navigate("landlordUnitDetail", { unitId: unit.id })}
              >
                <div className={styles.unitLeft}>
                  <div className={`${styles.unitIcon} ${isOccupied ? styles.occupied : styles.vacant}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className={styles.unitName}>{unit.name}</div>
                    <div className={styles.unitTenant}>
                      {isOccupied ? unit.tenant : "No Tenant"}
                    </div>
                  </div>
                </div>
                <div className={`${styles.unitStatus} ${isOccupied ? styles.occupied : styles.vacant}`}>
                  {unit.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
