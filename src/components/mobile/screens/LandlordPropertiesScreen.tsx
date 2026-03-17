"use client";

import { Search, MapPin, Filter, Plus } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertiesScreen.module.css";

// ─── Mock Data ──────────────────────────────────────────────
const PROPERTIES = [
  {
    id: "prop1",
    name: "Skyline Lofts",
    address: "Maysan, Valenzuela",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
    units: 12,
    occupied: 12,
    revenue: "₱180k/mo",
  },
  {
    id: "prop2",
    name: "Dalandanan Residences",
    address: "Dalandanan, Valenzuela",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
    units: 8,
    occupied: 6,
    revenue: "₱90k/mo",
  },
  {
    id: "prop3",
    name: "Metro Studio B",
    address: "Marulas, Valenzuela",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=80",
    units: 4,
    occupied: 4,
    revenue: "₱34k/mo",
  },
];

export default function LandlordPropertiesScreen() {
  const { navigate } = useNavigation();

  return (
    <div className={styles.container}>
      {/* Header & Search */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.headerTitle}>Properties</h1>
          <button className={styles.headerFilterBtn}>
            <Filter />
          </button>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Search size={18} />
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search properties or addresses..."
          />
        </div>
      </div>

      {/* Property List */}
      <div className={styles.scrollArea}>
        {PROPERTIES.map((prop) => {
          const occupancyRate = Math.round((prop.occupied / prop.units) * 100);
          const isFull = occupancyRate === 100;

          return (
            <div
              key={prop.id}
              className={styles.propertyCard}
              onClick={() =>
                navigate("landlordPropertyDetail", { propertyId: prop.id })
              }
            >
              {/* Image & Status Badge */}
              <div className={styles.cardImageWrapper}>
                <img src={prop.image} alt={prop.name} />
                <div className={styles.cardImageOverlay} />
                <div
                  className={`${styles.statusBadge} ${
                    isFull ? styles.full : ""
                  }`}
                >
                  {isFull ? "100% Full" : `${occupancyRate}% Occupied`}
                </div>
              </div>

              {/* Card Info */}
              <div className={styles.cardBody}>
                <h2 className={styles.propertyName}>{prop.name}</h2>
                <div className={styles.propertyAddress}>
                  <MapPin size={14} />
                  {prop.address}
                </div>

                {/* Quick Stats Grid */}
                <div className={styles.statsRow}>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>
                      {prop.occupied}/{prop.units}
                    </div>
                    <div className={styles.statLabel}>Units Rented</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={`${styles.statValue} ${styles.revenueText}`}>
                      {prop.revenue}
                    </div>
                    <div className={styles.statLabel}>Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button (FAB) for adding new property */}
      <button 
        className={styles.fab}
        onClick={() => alert("Add New Property flow...")}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
