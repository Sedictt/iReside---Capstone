"use client";

import { useState } from "react";
import { Home, Building2, CheckCircle2 } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./RoleSelectionScreen.module.css";

export default function RoleSelectionScreen() {
    const { navigate } = useNavigation();
    const [selectedRole, setSelectedRole] = useState<"tenant" | "landlord" | null>(null);

    const handleConfirm = () => {
        if (selectedRole) {
            navigate("login", { initialRole: selectedRole });
        }
    };

    return (
        <div className={styles.container}>
            {/* Background elements */}
            <div className={styles.ambientGlow} />
            
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to <span className={styles.brandName}>iReside</span></h1>
                    <p className={styles.subtitle}>Choose your login type to continue</p>
                </div>

                <div className={styles.roleGrid}>
                    {/* Tenant Layout */}
                    <div className={styles.roleWrapper}>
                        <button 
                            className={`${styles.roleBox} ${selectedRole === "tenant" ? styles.selectedTenantBox : ""}`}
                            onClick={() => setSelectedRole("tenant")}
                        >
                            <div className={`${styles.iconContainer} ${selectedRole === "tenant" ? styles.activeTenantIcon : styles.inactiveIcon}`}>
                                <Home size={48} />
                            </div>
                            {selectedRole === "tenant" && (
                                <div className={styles.checkBadge}>
                                    <CheckCircle2 size={24} color="#84cc16" fill="#141414" />
                                </div>
                            )}
                        </button>
                        <div className={styles.roleDetails}>
                            <h2 className={styles.roleName}>Tenant Login</h2>
                            <p className={styles.roleDesc}>Find and manage your next home</p>
                        </div>
                    </div>

                    {/* Landlord Layout */}
                    <div className={styles.roleWrapper}>
                        <button 
                            className={`${styles.roleBox} ${selectedRole === "landlord" ? styles.selectedLandlordBox : ""}`}
                            onClick={() => setSelectedRole("landlord")}
                        >
                            <div className={`${styles.iconContainer} ${selectedRole === "landlord" ? styles.activeLandlordIcon : styles.inactiveIcon}`}>
                                <Building2 size={48} />
                            </div>
                            {selectedRole === "landlord" && (
                                <div className={styles.checkBadge}>
                                    <CheckCircle2 size={24} color="#3b82f6" fill="#141414" />
                                </div>
                            )}
                        </button>
                        <div className={styles.roleDetails}>
                            <h2 className={styles.roleName}>Landlord Login</h2>
                            <p className={styles.roleDesc}>Manage properties and tenants</p>
                        </div>
                    </div>
                </div>

                {/* Confirm Button */}
                <div className={styles.footer}>
                    <button 
                        className={`${styles.confirmButton} ${!selectedRole ? styles.disabledButton : ""}`}
                        onClick={handleConfirm}
                        disabled={!selectedRole}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
