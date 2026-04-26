import { useState, useMemo } from "react";
import { Search, MapPin, Filter, Plus, X, Check } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "full" | "available">("all");
  const [tempFilterStatus, setTempFilterStatus] = useState<"all" | "full" | "available">("all");

  const openFilters = () => {
    setTempFilterStatus(filterStatus);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilterStatus(tempFilterStatus);
    setShowFilters(false);
  };

  const filteredProperties = useMemo(() => {
    return PROPERTIES.filter((prop) => {
      const matchesSearch = 
        prop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isFull = prop.occupied === prop.units;
      const matchesStatus = 
        filterStatus === "all" || 
        (filterStatus === "full" && isFull) || 
        (filterStatus === "available" && !isFull);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filterStatus]);

  return (
    <div className={styles.container}>
      {/* Header & Search */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.headerTitle}>Properties</h1>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.headerActionBtn} ${filterStatus !== 'all' ? styles.activeFilter : ''}`}
              onClick={openFilters}
            >
              <Filter size={18} />
              {filterStatus !== 'all' && <div className={styles.filterDot} />}
            </button>
            <button 
              className={styles.headerActionBtn}
              onClick={() => navigate("addProperty")}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Search size={18} />
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search properties or addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.scrollArea}>
        {filteredProperties.length > 0 ? (
          filteredProperties.map((prop) => {
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
          })
        ) : (
          <div className={styles.emptyResults}>
            <Search size={40} />
            <p>No properties match your search</p>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <div className={styles.modalOverlay} onClick={() => setShowFilters(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Filter Properties</h2>
              <button className={styles.closeBtn} onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.filterSection}>
              <h3 className={styles.filterLabel}>Occupancy Status</h3>
              <div className={styles.filterOptions}>
                {[
                  { id: "all", label: "All Properties" },
                  { id: "full", label: "100% Full" },
                  { id: "available", label: "Has Vacancies" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.filterOption} ${
                      tempFilterStatus === opt.id ? styles.filterOptionActive : ""
                    }`}
                    onClick={() => {
                      setTempFilterStatus(opt.id as any);
                    }}
                  >
                    {opt.label}
                    {tempFilterStatus === opt.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className={styles.applyBtn}
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
