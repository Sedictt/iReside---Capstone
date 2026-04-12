"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNavigation } from "../navigation";
import { Shield, Bell, Globe, LogOut, ChevronRight, Info } from "lucide-react";
import styles from "./AdminSettingsScreen.module.css";

function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
    return (
        <div className={`${styles.toggle} ${isOn ? styles.toggleActive : ""}`} onClick={onToggle}>
            <div className={styles.toggleCircle} />
        </div>
    );
}

export default function AdminSettingsScreen() {
    const { navigate, setRole } = useNavigation();
    const [toggles, setToggles] = useState({
        maintenanceMode: false,
        emailNotifications: true,
        autoApprove: false,
    });

    const handleToggle = (key: keyof typeof toggles) =>
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleSignOut = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch (_) {}
        setRole(null as any);
        navigate("login");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>System Settings</h1>
                <p className={styles.headerSub}>Admin configuration</p>
            </div>

            <div className={styles.scrollArea}>
                {/* System Section */}
                <div className={styles.sectionLabel}>System</div>
                <div className={styles.group}>
                    <div className={styles.row}>
                        <div className={styles.rowLeft}>
                            <div className={styles.rowIcon} style={{ background: "rgba(234,179,8,0.12)", color: "#eab308" }}>
                                <Globe size={16} />
                            </div>
                            <div>
                                <div className={styles.rowTitle}>Maintenance Mode</div>
                                <div className={styles.rowDesc}>Disable public access temporarily</div>
                            </div>
                        </div>
                        <Toggle isOn={toggles.maintenanceMode} onToggle={() => handleToggle("maintenanceMode")} />
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.row}>
                        <div className={styles.rowLeft}>
                            <div className={styles.rowIcon} style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                                <Shield size={16} />
                            </div>
                            <div>
                                <div className={styles.rowTitle}>Auto-Approve Landlords</div>
                                <div className={styles.rowDesc}>Skip manual verification</div>
                            </div>
                        </div>
                        <Toggle isOn={toggles.autoApprove} onToggle={() => handleToggle("autoApprove")} />
                    </div>
                </div>

                {/* Notifications Section */}
                <div className={styles.sectionLabel}>Notifications</div>
                <div className={styles.group}>
                    <div className={styles.row}>
                        <div className={styles.rowLeft}>
                            <div className={styles.rowIcon} style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
                                <Bell size={16} />
                            </div>
                            <div>
                                <div className={styles.rowTitle}>Email Notifications</div>
                                <div className={styles.rowDesc}>System alerts via email</div>
                            </div>
                        </div>
                        <Toggle isOn={toggles.emailNotifications} onToggle={() => handleToggle("emailNotifications")} />
                    </div>
                </div>

                {/* About Section */}
                <div className={styles.sectionLabel}>About</div>
                <div className={styles.group}>
                    <div className={styles.row}>
                        <div className={styles.rowLeft}>
                            <div className={styles.rowIcon} style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                                <Info size={16} />
                            </div>
                            <div>
                                <div className={styles.rowTitle}>App Version</div>
                                <div className={styles.rowDesc}>v0.7.0 — Phase 7 Build</div>
                            </div>
                        </div>
                        <ChevronRight size={18} className={styles.chevron} />
                    </div>
                </div>

                {/* Sign Out */}
                <button className={styles.signOutButton} onClick={handleSignOut}>
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
