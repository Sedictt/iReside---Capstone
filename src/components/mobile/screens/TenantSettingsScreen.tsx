"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Smartphone, Mail, Moon } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantSettingsScreen.module.css";

// ─── Custom Toggle Component ─────────────────────────────
function Toggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
    return (
        <div
            className={`${styles.toggle} ${isOn ? styles.toggleActive : ""}`}
            onClick={onToggle}
        >
            <div className={styles.toggleCircle} />
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────
export default function TenantSettingsScreen() {
    const { goBack } = useNavigation();

    // Settings State
    const [form, setForm] = useState({
        firstName: "Juan",
        lastName: "Dela Cruz",
        email: "juan.delacruz@gmail.com",
        phone: "+63 917 123 4567",
    });

    const [toggles, setToggles] = useState({
        pushNotifications: true,
        emailAlerts: true,
        smsAlerts: false,
        darkMode: true,
    });

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        goBack(); // In a real app, this would save to global state or DB
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <span className={styles.topBarTitle}>Settings</span>
                <div className={styles.actionButton}></div> {/* empty spacer for centering */}
            </div>

            <div className={styles.scrollArea}>
                {/* Personal Details */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Personal Details</div>
                    <div className={styles.formGroup}>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>First Name</label>
                            <input
                                className={styles.input}
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                className={styles.input}
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Contact Info</div>
                    <div className={styles.formGroup}>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Email Address</label>
                            <input
                                className={styles.input}
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>Phone Number</label>
                            <input
                                className={styles.input}
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications & Alerts */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Notifications</div>
                    <div className={styles.listGroup}>
                        <div className={styles.listItem}>
                            <div>
                                <div className={styles.itemLabel}>Push Notifications</div>
                                <div className={styles.itemDesc}>Receive alerts on your device</div>
                            </div>
                            <Toggle
                                isOn={toggles.pushNotifications}
                                onToggle={() => handleToggle("pushNotifications")}
                            />
                        </div>
                        <div className={styles.listItem}>
                            <div>
                                <div className={styles.itemLabel}>Email Alerts</div>
                                <div className={styles.itemDesc}>Monthly statements and receipts</div>
                            </div>
                            <Toggle
                                isOn={toggles.emailAlerts}
                                onToggle={() => handleToggle("emailAlerts")}
                            />
                        </div>
                        <div className={styles.listItem}>
                            <div>
                                <div className={styles.itemLabel}>SMS Alerts</div>
                                <div className={styles.itemDesc}>Important urgent reminders</div>
                            </div>
                            <Toggle
                                isOn={toggles.smsAlerts}
                                onToggle={() => handleToggle("smsAlerts")}
                            />
                        </div>
                    </div>
                </div>

                {/* App Preferences */}
                <div className={styles.section}>
                    <div className={styles.sectionTitle}>Preferences</div>
                    <div className={styles.listGroup}>
                        <div className={styles.listItem}>
                            <div>
                                <div className={styles.itemLabel}>Dark Mode</div>
                                <div className={styles.itemDesc}>Use dark theme everywhere</div>
                            </div>
                            <Toggle
                                isOn={toggles.darkMode}
                                onToggle={() => handleToggle("darkMode")}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Save */}
            <div className={styles.saveContainer}>
                <button className={styles.saveButton} onClick={handleSave}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}
