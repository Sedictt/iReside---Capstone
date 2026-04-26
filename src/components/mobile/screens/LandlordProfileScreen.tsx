"use client";

import {
    User,
    Settings,
    Bell,
    Shield,
    HelpCircle,
    LogOut,
    ChevronRight,
    Camera,
    Smartphone,
    Building2,
    Briefcase,
    FileText,
    CreditCard,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./LandlordProfileScreen.module.css";

export default function LandlordProfileScreen() {
    const { navigate, setRole } = useNavigation();

    return (
        <div className={styles.container}>
            <div className={styles.scrollArea}>
                {/* Profile Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            <span className={styles.avatarPlaceholder}>L</span>
                        </div>
                        <button className={styles.editAvatarBtn}>
                            <Camera size={14} />
                        </button>
                    </div>
                    <h1 className={styles.userName}>Landlord Juan</h1>
                    <p className={styles.userEmail}>juan.landlord@gmail.com</p>
                </div>



                {/* Quick Stats */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>3</div>
                        <div className={styles.statLabel}>Properties</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>24</div>
                        <div className={styles.statLabel}>Units</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>22</div>
                        <div className={styles.statLabel}>Tenants</div>
                    </div>
                </div>

                {/* Account Menu Section */}
                <div className={styles.menuSection}>
                    <h2 className={styles.sectionTitle}>Business settings</h2>
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
                        <button className={styles.menuItem} onClick={() => navigate("landlordInvoices")}>
                            <div className={styles.menuItemIcon}>
                                <CreditCard />
                            </div>
                            <span className={styles.menuItemLabel}>Payout Methods</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem} onClick={() => navigate("notifications")}>
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
                    <h2 className={styles.sectionTitle}>Management</h2>
                    <div className={styles.menuBlock}>
                        <button className={styles.menuItem} onClick={() => navigate("landlordProperties")}>
                            <div className={styles.menuItemIcon}>
                                <Building2 />
                            </div>
                            <span className={styles.menuItemLabel}>Manage Listings</span>
                            <div className={styles.menuItemRight}>
                                <ChevronRight />
                            </div>
                        </button>
                        <button className={styles.menuItem}>
                            <div className={styles.menuItemIcon}>
                                <Briefcase />
                            </div>
                            <span className={styles.menuItemLabel}>Service Providers</span>
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

                <div className={styles.appVersion}>iReside Landlord v1.0.0 (Beta)</div>
            </div>
        </div>
    );
}
