"use client";

import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./SplashScreen.module.css";

export default function SplashScreen() {
    const { navigate } = useNavigation();

    // Auto-navigate to the welcome screen after the loading animation
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate("welcome");
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className={styles.container}>
            {/* Ambient Background Glows */}
            <div className={`${styles.ambientGlow} ${styles.glowPrimary}`} />
            <div className={`${styles.ambientGlow} ${styles.glowBlue}`} />
            <div className={`${styles.ambientGlow} ${styles.glowAccent}`} />

            {/* Logo + Brand */}
            <div className={styles.logoArea}>
                <div className={styles.brandMark}>
                    <Building2 className={styles.brandIcon} />
                </div>

                <div className={styles.brandText}>
                    <h1 className={styles.brandName}>iReside</h1>
                    <p className={styles.brandTagline}>Find Your Home</p>
                </div>
            </div>

            {/* Loading Bar */}
            <div className={styles.loadingArea}>
                <div className={styles.loadingBar}>
                    <div className={styles.loadingFill} />
                </div>
                <span className={styles.loadingText}>Loading</span>
            </div>
        </div>
    );
}
