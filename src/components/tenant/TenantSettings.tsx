"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CheckCircle,
    ChevronRight,
    CreditCard,
    Edit2,
    Lock,
    Plus,
    ShieldCheck,
    User,
    Download,
    Trash2,
    Mail,
    AlertTriangle,
    Eye,
    EyeOff,
    Smartphone,
    Globe,
    Camera,
    MapPin,
    Phone,
    FileText,
    Clock,
    Monitor,
    LogOut,
    Key,
    Shield,
    Save,
    X,
    ChevronDown,
    ExternalLink,
    Archive,
    HardDrive,
    Calendar,
    Receipt,
    Wallet,
    Info,
    AlertCircle,
    Home,
    CreditCard as CardIcon,
} from "lucide-react";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Types
type Section = "My Profile" | "Security" | "Privacy" | "Notifications" | "Billing" | "Data Export" | "Delete Account";

const SIDEBAR_ITEMS: { icon: any; label: Section; className?: string }[] = [
    { icon: User, label: "My Profile" },
    { icon: ShieldCheck, label: "Security" },
    { icon: Eye, label: "Privacy" },
    { icon: Bell, label: "Notifications" },
    { icon: CreditCard, label: "Billing" },
    { icon: Download, label: "Data Export" },
    { icon: Trash2, label: "Delete Account", className: "text-red-500 hover:text-red-400 hover:bg-red-500/10" },
];

// Reusable Toggle Switch Component
function ToggleSwitch({ enabled, onToggle, size = "default" }: { enabled: boolean; onToggle: () => void; size?: "default" | "small" }) {
    const isSmall = size === "small";
    return (
        <button
            onClick={onToggle}
            className={cn(
                "relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                enabled ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-muted",
                isSmall ? "h-5 w-9" : "h-6 w-11"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full bg-background shadow-sm transition-all duration-300",
                    isSmall ? "h-3 w-3" : "h-4 w-4",
                    enabled
                        ? isSmall ? "translate-x-5" : "translate-x-6"
                        : "translate-x-1"
                )}
            />
        </button>
    );
}

// Reusable Setting Row Component
function SettingRow({ title, description, children, border = true }: { title: string; description: string; children: React.ReactNode; border?: boolean }) {
    return (
        <div className={cn("py-5", border && "border-b border-border")}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
                <div className="flex-shrink-0">{children}</div>
            </div>
        </div>
    );
}

// Section Header Component
function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground ml-12">{description}</p>
        </div>
    );
}

export function TenantSettings() {
    const [activeTab, setActiveTab] = useState<Section>("My Profile");

    // Profile State
    const [profileName, setProfileName] = useState("Alex Thompson");
    const [profileEmail, setProfileEmail] = useState("alex.t@example.com");
    const [profilePhone, setProfilePhone] = useState("+1 555 0123 4567");
    const [profileAddress, setProfileAddress] = useState("Unit 402, Skyline Towers, Los Angeles, CA");
    const [profileBio, setProfileBio] = useState("Design enthusiast and tech professional. Love discovering new neighborhoods and well-designed living spaces.");
    const [emergencyName, setEmergencyName] = useState("Sarah Thompson");
    const [emergencyPhone, setEmergencyPhone] = useState("+1 987 654 3210");
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Security State
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Privacy State
    const [privacyLandlordSearch, setPrivacyLandlordSearch] = useState(true);
    const [privacyRentalHistory, setPrivacyRentalHistory] = useState(true);
    const [privacyOnlineStatus, setPrivacyOnlineStatus] = useState(true);
    const [privacyDataSharing, setPrivacyDataSharing] = useState(false);

    // Notification State
    const [notifRentEmail, setNotifRentEmail] = useState(true);
    const [notifRentSms, setNotifRentSms] = useState(true);
    const [notifRentPush, setNotifRentPush] = useState(true);
    const [notifMaintenanceEmail, setNotifMaintenanceEmail] = useState(true);
    const [notifMaintenanceSms, setNotifMaintenanceSms] = useState(false);
    const [notifMaintenancePush, setNotifMaintenancePush] = useState(true);
    const [notifLeaseEmail, setNotifLeaseEmail] = useState(true);
    const [notifLeaseSms, setNotifLeaseSms] = useState(false);
    const [notifLeasePush, setNotifLeasePush] = useState(true);
    const [notifCommunityEmail, setNotifCommunityEmail] = useState(false);
    const [notifCommunitySms, setNotifCommunitySms] = useState(false);
    const [notifCommunityPush, setNotifCommunityPush] = useState(true);
    const [notifOffersEmail, setNotifOffersEmail] = useState(false);
    const [notifOffersSms, setNotifOffersSms] = useState(false);
    const [notifOffersPush, setNotifOffersPush] = useState(false);

    // Delete Account State
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case "My Profile":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={User} title="My Profile" description="Manage your personal information and preferences." />

                        {/* Profile Card */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            {/* Cover */}
                            <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
                            </div>

                            <div className="px-8 pb-8">
                                {/* Avatar & Name */}
                                <div className="flex flex-col md:flex-row md:items-end justify-between -mt-12 mb-8 gap-4">
                                    <div className="flex items-end gap-5">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-2xl bg-primary/10 p-0.5 shadow-xl ring-4 ring-card overflow-hidden">
                                                <div className="h-full w-full rounded-[14px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                    <User className="h-12 w-12 text-primary" />
                                                </div>
                                            </div>
                                            <button className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                                            </button>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-foreground">{profileName}</h3>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary border border-primary/20">
                                                    <CheckCircle className="h-3 w-3" /> Verified
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Tenant ID: #IR-992034</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-sm",
                                            isEditingProfile
                                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                : "border border-border bg-background text-foreground hover:bg-muted"
                                        )}
                                    >
                                        {isEditingProfile ? <><Save className="h-4 w-4" /> Save Changes</> : <><Edit2 className="h-4 w-4" /> Edit Profile</>}
                                    </button>
                                </div>

                                {/* Profile Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <User className="h-3 w-3" /> Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                isEditingProfile
                                                    ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-3 w-3" /> Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                isEditingProfile
                                                    ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profilePhone}
                                            onChange={(e) => setProfilePhone(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                isEditingProfile
                                                    ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Home className="h-3 w-3" /> Current Address
                                        </label>
                                        <input
                                            type="text"
                                            value={profileAddress}
                                            onChange={(e) => setProfileAddress(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                isEditingProfile
                                                    ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <FileText className="h-3 w-3" /> Bio
                                        </label>
                                        <textarea
                                            value={profileBio}
                                            onChange={(e) => setProfileBio(e.target.value)}
                                            disabled={!isEditingProfile}
                                            rows={3}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all resize-none",
                                                isEditingProfile
                                                    ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Emergency Contact Section */}
                                <div className="mt-8 pt-6 border-t border-border">
                                    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-rose-400" />
                                        Emergency Contact
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Name</label>
                                            <input
                                                type="text"
                                                value={emergencyName}
                                                onChange={(e) => setEmergencyName(e.target.value)}
                                                disabled={!isEditingProfile}
                                                className={cn(
                                                    "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                    isEditingProfile
                                                        ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                        : "bg-transparent border-transparent cursor-default"
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={emergencyPhone}
                                                onChange={(e) => setEmergencyPhone(e.target.value)}
                                                disabled={!isEditingProfile}
                                                className={cn(
                                                    "w-full rounded-lg border px-4 py-2.5 text-sm text-foreground transition-all",
                                                    isEditingProfile
                                                        ? "bg-muted/50 border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                        : "bg-transparent border-transparent cursor-default"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Security":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={ShieldCheck} title="Security" description="Keep your account safe with these security settings." />

                        {/* Email Address */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{profileEmail}</p>
                                        <p className="text-xs text-emerald-500 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Verified
                                        </p>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                                    Change <Edit2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" /> Password
                            </h3>
                            <div className="grid gap-4 max-w-lg">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10"
                                        />
                                        <button
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full rounded-lg bg-muted/50 border border-border px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                                    />
                                </div>
                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-1 flex-1 rounded-full transition-colors",
                                                        newPassword.length >= i * 3
                                                            ? newPassword.length >= 12 ? "bg-emerald-500" : newPassword.length >= 8 ? "bg-amber-500" : "bg-red-500"
                                                            : "bg-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {newPassword.length < 6 ? "Weak" : newPassword.length < 10 ? "Fair" : "Strong"} password
                                        </p>
                                    </div>
                                )}
                                <button className="mt-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 w-fit">
                                    Update Password
                                </button>
                            </div>
                        </div>

                        {/* Two-Factor Auth */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Shield className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h3>
                                        <p className="text-sm text-muted-foreground">Add an extra layer of security. You'll need to enter a verification code in addition to your password.</p>
                                        {isTwoFactorEnabled && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-500 mt-2">
                                                <CheckCircle className="h-3 w-3" /> Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ToggleSwitch enabled={isTwoFactorEnabled} onToggle={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)} />
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-muted-foreground" /> Active Sessions
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-primary/20">
                                    <div className="flex items-center gap-3">
                                        <Monitor className="h-4 w-4 text-primary" />
                                        <div>
                                            <p className="text-sm text-foreground">Chrome on Windows</p>
                                            <p className="text-xs text-muted-foreground">Los Angeles, CA · Current session</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold tracking-wider text-primary uppercase bg-primary/10 px-2 py-1 rounded">Current</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-foreground">Safari on iPhone</p>
                                            <p className="text-xs text-muted-foreground">Los Angeles, CA · 5 hours ago</p>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors">Revoke</button>
                                </div>
                            </div>
                            <button className="mt-4 text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1 transition-colors">
                                <LogOut className="h-3 w-3" /> Sign out all other sessions
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
                            <h3 className="text-sm font-semibold text-red-500 mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Danger Zone
                            </h3>
                            <SettingRow title="Deactivate Account" description="Temporarily disable your account. You can reactivate it later by signing in." border>
                                <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                                    Deactivate
                                </button>
                            </SettingRow>
                            <SettingRow title="Delete Account" description="Permanently delete your account and all associated data. This action cannot be undone." border={false}>
                                <button className="px-4 py-2 rounded-lg border border-red-500/30 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                                    Delete Account
                                </button>
                            </SettingRow>
                        </div>
                    </div>
                );

            case "Privacy":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Eye} title="Privacy" description="Manage your privacy and visibility settings." />

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" /> Visibility
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Landlord Discovery</p>
                                        <p className="text-sm text-muted-foreground">Allow landlords to find your profile when searching for tenants.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyLandlordSearch} onToggle={() => setPrivacyLandlordSearch(!privacyLandlordSearch)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Share Rental History</p>
                                        <p className="text-sm text-muted-foreground">Automatically share your verified rental history with landlords you apply to.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyRentalHistory} onToggle={() => setPrivacyRentalHistory(!privacyRentalHistory)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Online Status</p>
                                        <p className="text-sm text-muted-foreground">Show when you are active on the platform.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyOnlineStatus} onToggle={() => setPrivacyOnlineStatus(!privacyOnlineStatus)} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-muted-foreground" /> Data & Usage
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Data Usage for Improvements</p>
                                        <p className="text-sm text-muted-foreground">Allow iReside to use your anonymous usage data to improve the platform.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyDataSharing} onToggle={() => setPrivacyDataSharing(!privacyDataSharing)} />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Notifications":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Bell} title="Notifications" description="Choose how and when you want to be notified about activity." />

                        {/* Notification Matrix */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-border bg-muted/30">
                                <div className="flex items-center justify-end gap-8 pr-1">
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase w-12 text-center">Email</span>
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase w-12 text-center">SMS</span>
                                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase w-12 text-center">Push</span>
                                </div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-border">
                                {/* Rent Reminders */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Rent Reminders</p>
                                        <p className="text-xs text-muted-foreground">Get notified before rent is due and when payments are confirmed.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifRentEmail} onToggle={() => setNotifRentEmail(!notifRentEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifRentSms} onToggle={() => setNotifRentSms(!notifRentSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifRentPush} onToggle={() => setNotifRentPush(!notifRentPush)} /></div>
                                    </div>
                                </div>

                                {/* Maintenance Updates */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Maintenance Updates</p>
                                        <p className="text-xs text-muted-foreground">Notifications about your maintenance request status changes.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenanceEmail} onToggle={() => setNotifMaintenanceEmail(!notifMaintenanceEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenanceSms} onToggle={() => setNotifMaintenanceSms(!notifMaintenanceSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenancePush} onToggle={() => setNotifMaintenancePush(!notifMaintenancePush)} /></div>
                                    </div>
                                </div>

                                {/* Lease Updates */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Lease Updates</p>
                                        <p className="text-xs text-muted-foreground">Reminders for lease renewals, expirations and document signing.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeaseEmail} onToggle={() => setNotifLeaseEmail(!notifLeaseEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeaseSms} onToggle={() => setNotifLeaseSms(!notifLeaseSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeasePush} onToggle={() => setNotifLeasePush(!notifLeasePush)} /></div>
                                    </div>
                                </div>

                                {/* Community Announcements */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Community Announcements</p>
                                        <p className="text-xs text-muted-foreground">News and updates from your property management.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifCommunityEmail} onToggle={() => setNotifCommunityEmail(!notifCommunityEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifCommunitySms} onToggle={() => setNotifCommunitySms(!notifCommunitySms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifCommunityPush} onToggle={() => setNotifCommunityPush(!notifCommunityPush)} /></div>
                                    </div>
                                </div>

                                {/* Curated Offers */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">Curated Offers & Deals</p>
                                        <p className="text-xs text-muted-foreground">Exclusive offers and property recommendations from iReside.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifOffersEmail} onToggle={() => setNotifOffersEmail(!notifOffersEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifOffersSms} onToggle={() => setNotifOffersSms(!notifOffersSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifOffersPush} onToggle={() => setNotifOffersPush(!notifOffersPush)} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-3">
                            <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                                Enable All
                            </button>
                            <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                                Disable All
                            </button>
                        </div>
                    </div>
                );

            case "Billing":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={CreditCard} title="Billing & Payments" description="Manage your payment methods and view your payment history." />

                        {/* Current Lease Summary */}
                        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Home className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">Skyline Loft — Unit 402</h3>
                                        <p className="text-xs text-muted-foreground">Active Lease · Jan 2024 - Jan 2025</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-foreground">₱2,450<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next due: Mar 1, 2026</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-lg shadow-primary/20">
                                Pay Now
                            </button>
                        </div>

                        {/* Payment Methods */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" /> Payment Methods
                            </h3>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">GCash (E-Wallet)</p>
                                            <p className="text-xs text-muted-foreground">+1 555 *** 4567</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold tracking-wider text-primary uppercase bg-primary/10 px-2 py-1 rounded">Default</span>
                                        <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Edit</button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                                            <p className="text-xs text-muted-foreground">Expires 12/2027</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Set Default</button>
                                        <button className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors">Remove</button>
                                    </div>
                                </div>

                                <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
                                    <Plus className="h-4 w-4" /> Add New Payment Method
                                </button>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-muted-foreground" /> Payment History
                                </h3>
                                <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
                                    Download All <Download className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { date: "Feb 1, 2026", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2026-02" },
                                    { date: "Jan 1, 2026", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2026-01" },
                                    { date: "Dec 1, 2025", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2025-12" },
                                    { date: "Nov 1, 2025", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2025-11" },
                                ].map((item) => (
                                    <div key={item.receipt} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-foreground">{item.receipt}</p>
                                                <p className="text-xs text-muted-foreground">{item.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-foreground">{item.amount}</span>
                                            <button className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:text-primary/80 font-medium transition-all">
                                                <Download className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case "Data Export":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Download} title="Data Export" description="Download a copy of your data from iReside." />

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <HardDrive className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1">Export Your Data</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Request a copy of your personal data. This includes your profile, lease history,
                                        payment records, and communication logs.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 mb-6">
                                {[
                                    { icon: User, label: "Profile Information", desc: "Personal details, preferences, settings" },
                                    { icon: FileText, label: "Lease Documents", desc: "Agreements, addendums, move-in/out records" },
                                    { icon: Receipt, label: "Payment History", desc: "Rent receipts, transaction records" },
                                    { icon: Mail, label: "Communications", desc: "Messages with landlord, maintenance requests" },
                                ].map((item) => (
                                    <label key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/20 cursor-pointer transition-colors group">
                                        <input type="checkbox" defaultChecked className="accent-primary h-4 w-4" />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Export may take up to 24 hours to process.
                                </p>
                                <button className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Request Export
                                </button>
                            </div>
                        </div>

                        {/* Previous Exports */}
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Archive className="h-4 w-4 text-muted-foreground" /> Previous Exports
                            </h3>
                            <div className="text-sm text-muted-foreground text-center py-8">
                                <HardDrive className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                                <p>No previous exports found</p>
                                <p className="text-xs mt-1">Request your first export above</p>
                            </div>
                        </div>
                    </div>
                );

            case "Delete Account":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Trash2} title="Delete Account" description="Permanently remove your account and all associated data." />

                        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-500 mb-2">This action is irreversible</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Deleting your account will permanently remove all your data including lease history,
                                        payment records, and personal information. This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl bg-card border border-red-500/10 p-4 mb-6">
                                <h4 className="text-sm font-medium text-foreground mb-3">What will be deleted:</h4>
                                <ul className="space-y-2">
                                    {[
                                        "Your profile and personal information",
                                        "Lease history and documents",
                                        "Payment records and receipts",
                                        "Communication history with landlords",
                                        "Saved searches and preferences",
                                    ].map((text) => (
                                        <li key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <X className="h-3 w-3 text-red-500 flex-shrink-0" />
                                            {text}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-600/20"
                                >
                                    I understand, delete my account
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="space-y-4 border-t border-red-500/10 pt-4"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Please type <span className="text-red-500 font-mono font-bold">DELETE</span> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full max-w-xs rounded-lg bg-card border border-red-500/20 px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            disabled={deleteConfirmText !== "DELETE"}
                                            className={cn(
                                                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                deleteConfirmText === "DELETE"
                                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                            )}
                                        >
                                            Permanently Delete
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                            className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl text-muted-foreground">
                        Content for {activeTab} coming soon
                    </div>
                );
        }
    };

    return (
        <div className="flex w-full flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-1 px-3">Settings</h2>
                        <p className="text-xs text-muted-foreground px-3 mb-4">Manage your account preferences</p>
                        <nav className="space-y-1">
                            {SIDEBAR_ITEMS.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveTab(item.label)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        activeTab === item.label
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : item.label === "Delete Account"
                                                ? "text-red-500 hover:bg-red-500/10"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                    {activeTab === item.label && (
                                        <ChevronRight className="h-3 w-3 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
