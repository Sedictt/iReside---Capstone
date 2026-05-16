"use client";

import { Home, Building2, ArrowRight } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./RoleSelectionScreen.module.css";

export default function RoleSelectionScreen() {
    const { navigate } = useNavigation();

    const handleRoleSelect = (role: "tenant" | "landlord") => {
        navigate("login", { initialRole: role });
    };

    return (
        <div className={styles.container}>
            {/* Background elements */}
            <div className={styles.ambientGlow} />
            
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome to iReside</h1>
                    <p className={styles.subtitle}>Choose your login type to continue</p>
                </div>

                <div className={styles.roleGrid}>
                    {/* Tenant Card */}
                    <button 
                        className={styles.roleCard}
                        onClick={() => handleRoleSelect("tenant")}
                    >
                        <div className={`${styles.iconBox} ${styles.tenantIcon}`}>
                            <Home size={32} />
                        </div>
                        <div className={styles.cardText}>
                            <h2 className={styles.roleName}>Tenant Login</h2>
                            <p className={styles.roleDesc}>Find and manage your next home</p>
                        </div>
                        <ArrowRight className={styles.arrow} size={20} />
                    </button>

                    {/* Landlord Card */}
                    <button 
                        className={styles.roleCard}
                        onClick={() => handleRoleSelect("landlord")}
                    >
                        <div className={`${styles.iconBox} ${styles.landlordIcon}`}>
                            <Building2 size={32} />
                        </div>
                        <div className={styles.cardText}>
                            <h2 className={styles.roleName}>Landlord Login</h2>
                            <p className={styles.roleDesc}>Manage properties and tenants</p>
                        </div>
                        <ArrowRight className={styles.arrow} size={20} />
                    </button>
                </div>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        Don't have an account?{" "}
                        <button className={styles.link} onClick={() => navigate("signup")}>
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
