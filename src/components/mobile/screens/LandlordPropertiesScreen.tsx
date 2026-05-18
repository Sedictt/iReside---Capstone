import { Search, Plus } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordPropertiesScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

export default function LandlordPropertiesScreen({ isSubView = false }: { isSubView?: boolean }) {
  const { navigate } = useNavigation();

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

      <EmptyState
        icon={Search}
        title="No properties yet"
        subtitle="Add your first property to start managing tenants, invoices, and maintenance."
      />
    </div>
  );
}