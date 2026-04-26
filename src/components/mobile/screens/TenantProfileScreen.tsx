"use client";

import {
    User,
    Settings,
    Bell,
    CreditCard,
    Shield,
    HelpCircle,
    LogOut,
    ChevronRight,
    Camera,
    Building2,
    FileText,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantProfileScreen.module.css";

export default function TenantProfileScreen() {
    const { navigate, setRole } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.scrollArea}>
                {/* Profile Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            <span className={styles.avatarPlaceholder}>J</span>
                        </div>
                        <button className={styles.editAvatarBtn}>
                            <Camera size={14} />
                        </button>
                    </div>
                    <h1 className={styles.userName}>Juan Dela Cruz</h1>
                    <p className={styles.userEmail}>juan.delacruz@gmail.com</p>
                </div>



                {/* Quick Stats */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>1</div>
                        <div className={styles.statLabel}>Active Lease</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>2</div>
                        <div className={styles.statLabel}>Saved Places</div>
                    </div>
                </div>

                {/* Account Menu Section */}
                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>Account settings</h2>
                    <div className={styles.menuBlock}>
                        <button
                            className={styles.menuItem}
                            onClick={() => navigate("tenantSettings")}
                        >
                            <div className={styles.menuItemIcon}>
                                <User />
                            </div>
                            <span className={styles.menuItemLabel}>Personal Information</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem} onClick={() => navigate("payments")}>
                            <div className={styles.menuItemIcon}>
                                <CreditCard />
                            </div>
                            <span className={styles.menuItemLabel}>Payment Methods</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem} onClick={() => navigate("inbox", { tab: "notifications" })}>
                            <div className={styles.menuItemIcon}>
                                <Bell />
                            </div>
                            <span className={styles.menuItemLabel}>Notifications</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                    </div>
                </div>

                {/* App & Preferences Section */}
                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>Preferences</h2>
                    <div className={styles.menuBlock}>
                        <button className={styles.menuItem}>
                            <div className={styles.menuItemIcon}>
                                <Settings />
                            </div>
                            <span className={styles.menuItemLabel}>App Settings</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem}>
                            <div className={styles.menuItemIcon}>
                                <Shield />
                            </div>
                            <span className={styles.menuItemLabel}>Privacy & Security</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Support Section */}
                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>Support</h2>
                    <div className={styles.menuBlock}>
                        <button className={styles.menuItem}>
                            <div className={styles.menuItemIcon}>
                                <HelpCircle />
                            </div>
                            <span className={styles.menuItemLabel}>Help Center</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem}>
                            <div className={styles.menuItemIcon}>
                                <FileText />
                            </div>
                            <span className={styles.menuItemLabel}>Terms of Service</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className={styles.menuSection}>
                    <div className={styles.menuBlock}>
                        <button
                            className={`${styles.menuItem} ${styles.dangerItem}`}
                            onClick={() => navigate("splash")}
                        >
                            <div className={styles.menuItemIcon}>
                                <LogOut />
                            </div>
                            <span className={styles.menuItemLabel}>Log Out</span>
                            <div className={styles.menuItemRight}></div>
                        </button>
                    </div>
                </div>

                <div className={styles.appVersion}>iReside v1.0.0 (Beta)</div>
            </div>
        </div>
    );
}
