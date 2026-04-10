"use client";

import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useNavigation } from "../navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./SplashScreen.module.css";

export default function SplashScreen() {
    const { navigate, setRole } = useNavigation();

    useEffect(() => {
        const initSession = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                
                // Wait for the nice animation to run slightly
                await new Promise((resolve) => setTimeout(resolve, 2000));
                
                if (session && session.user) {
                    const role = session.user.user_metadata?.role || "tenant";
                    setRole(role as "tenant" | "landlord" | "admin");
                    
                    if (role === "admin") {
                        navigate("adminHome");
                    } else if (role === "landlord") {
                        navigate("landlordHome");
                    } else {
                        navigate("tenantHome");
                    }
                } else {
                    navigate("welcome");
                }
            } catch (error) {
                console.error("Session check failed", error);
                navigate("welcome");
            }
        };

        initSession();
    }, [navigate, setRole]);

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
