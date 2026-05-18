import { Search, Plus, Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import { useProperties } from "@/lib/hooks/useProperties";
import styles from "./LandlordPropertiesScreen.module.css";

export default function LandlordPropertiesScreen({ isSubView = false }: { isSubView?: boolean }) {
  const { navigate } = useNavigation();
  const { properties, loading } = useProperties();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.headerTitle}>Properties</h1>
          <div className={styles.headerActions}>
            <button className={styles.searchBtn}>
              <Search size={20} />
            </button>
            <button className={styles.addBtn} onClick={() => navigate("addProperty")}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
          Loading properties...
        </div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: "40px", color: "#737373" }}>
          <p>No properties yet. Add your first property to get started.</p>
        </div>
      ) : (
        <div className={styles.propertyList}>
          {properties.map((prop) => {
            const totalUnits = prop.units?.length ?? 0;
            const occupiedUnits = prop.units?.filter(u => u.status === "occupied").length ?? 0;
            return (
              <div
                key={prop.id}
                className={styles.propertyCard}
                onClick={() => navigate("landlordPropertyDetail", { propertyId: prop.id })}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.propertyImageWrapper}>
                  {prop.images?.[0] ? (
                    <img src={prop.images[0]} alt={prop.name} className={styles.propertyImage} />
                  ) : (
                    <div className={styles.propertyImage} style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={40} color="#525252" />
                    </div>
                  )}
                </div>
                <div className={styles.propertyInfo}>
                  <h3 className={styles.propertyName}>{prop.name}</h3>
                  <p className={styles.propertyAddress}>{prop.address}</p>
                  <div className={styles.propertyStats}>
                    <span>{totalUnits} units</span>
                    <span>•</span>
                    <span>{occupiedUnits} occupied</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
