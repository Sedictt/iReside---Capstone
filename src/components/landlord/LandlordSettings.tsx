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
    Users,
    UserPlus,
    Download,
    Trash2,
    Building2,
    Mail,
    AlertTriangle,
    Eye,
    EyeOff,
    Smartphone,
    QrCode,
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
                "relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                enabled ? "bg-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "bg-slate-700",
                isSmall ? "h-5 w-9" : "h-6 w-11"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full bg-white shadow-sm transition-all duration-300",
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
        <div className={cn("py-5", border && "border-b border-white/5")}>
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-medium text-white">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
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
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <p className="text-sm text-slate-400 ml-12">{description}</p>
        </div>
    );
}

export function LandlordSettings() {
    const [activeTab, setActiveTab] = useState<Section>("My Profile");

    // Profile State
    const [profileName, setProfileName] = useState("Elite Property Management Group");
    const [profileEmail, setProfileEmail] = useState("contact@eliteproperty.ph");
    const [profilePhone, setProfilePhone] = useState("+63 917 123 4567");
    const [profileAddress, setProfileAddress] = useState("123 Business Avenue, Suite 400, Manila, Philippines");
    const [profileBio, setProfileBio] = useState("Premium property management company specializing in residential and commercial properties across Metro Manila since 2015.");
    const [profileWebsite, setProfileWebsite] = useState("https://eliteproperty.ph");
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Security State
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Privacy State
    const [privacyProfileVisible, setPrivacyProfileVisible] = useState(true);
    const [privacySearchIndexing, setPrivacySearchIndexing] = useState(true);
    const [privacyDataSharing, setPrivacyDataSharing] = useState(false);

    // Notification State
    const [notifInquiryEmail, setNotifInquiryEmail] = useState(true);
    const [notifInquirySms, setNotifInquirySms] = useState(false);
    const [notifInquiryPush, setNotifInquiryPush] = useState(true);
    const [notifMaintenanceEmail, setNotifMaintenanceEmail] = useState(true);
    const [notifMaintenanceSms, setNotifMaintenanceSms] = useState(true);
    const [notifMaintenancePush, setNotifMaintenancePush] = useState(true);
    const [notifPaymentEmail, setNotifPaymentEmail] = useState(true);
    const [notifPaymentSms, setNotifPaymentSms] = useState(false);
    const [notifPaymentPush, setNotifPaymentPush] = useState(true);
    const [notifLeaseEmail, setNotifLeaseEmail] = useState(true);
    const [notifLeaseSms, setNotifLeaseSms] = useState(false);
    const [notifLeasePush, setNotifLeasePush] = useState(false);
    const [notifMarketingEmail, setNotifMarketingEmail] = useState(false);
    const [notifMarketingSms, setNotifMarketingSms] = useState(false);
    const [notifMarketingPush, setNotifMarketingPush] = useState(false);

    // Billing State
    const [selectedPayoutMethod, setSelectedPayoutMethod] = useState("gcash");

    // Delete Account State
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case "My Profile":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={User} title="My Profile" description="Manage your company profile information visible to tenants." />

                        {/* Profile Card */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
                            {/* Cover */}
                            <div className="relative h-32 bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-blue-600/30">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
                            </div>

                            <div className="px-8 pb-8">
                                {/* Avatar & Name */}
                                <div className="flex flex-col md:flex-row md:items-end justify-between -mt-12 mb-8 gap-4">
                                    <div className="flex items-end gap-5">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center ring-4 ring-[#1e293b]">
                                                <Building2 className="h-12 w-12 text-blue-600" />
                                            </div>
                                            <button className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <Camera className="h-3.5 w-3.5 text-white" />
                                            </button>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-white">{profileName}</h3>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400 border border-blue-500/20">
                                                    <CheckCircle className="h-3 w-3" /> Verified
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">Landlord ID: #EPG-99291</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-sm",
                                            isEditingProfile
                                                ? "bg-blue-600 text-white hover:bg-blue-500"
                                                : "border border-white/10 bg-[#0f172a] text-slate-300 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        {isEditingProfile ? <><Save className="h-4 w-4" /> Save Changes</> : <><Edit2 className="h-4 w-4" /> Edit Profile</>}
                                    </button>
                                </div>

                                {/* Profile Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Company Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <Mail className="h-3 w-3" /> Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileEmail}
                                            onChange={(e) => setProfileEmail(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <Phone className="h-3 w-3" /> Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profilePhone}
                                            onChange={(e) => setProfilePhone(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> Website
                                        </label>
                                        <input
                                            type="url"
                                            value={profileWebsite}
                                            onChange={(e) => setProfileWebsite(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <MapPin className="h-3 w-3" /> Address
                                        </label>
                                        <input
                                            type="text"
                                            value={profileAddress}
                                            onChange={(e) => setProfileAddress(e.target.value)}
                                            disabled={!isEditingProfile}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                            <FileText className="h-3 w-3" /> Bio
                                        </label>
                                        <textarea
                                            value={profileBio}
                                            onChange={(e) => setProfileBio(e.target.value)}
                                            disabled={!isEditingProfile}
                                            rows={3}
                                            className={cn(
                                                "w-full rounded-lg border px-4 py-2.5 text-sm text-white transition-all resize-none",
                                                isEditingProfile
                                                    ? "bg-[#0f172a] border-white/10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    : "bg-transparent border-transparent cursor-default"
                                            )}
                                        />
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
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-slate-400" /> Email Address
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{profileEmail}</p>
                                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Verified
                                        </p>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                    Change <Edit2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Key className="h-4 w-4 text-slate-400" /> Password
                            </h3>
                            <div className="grid gap-4 max-w-lg">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full rounded-lg bg-[#0f172a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
                                        />
                                        <button
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full rounded-lg bg-[#0f172a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full rounded-lg bg-[#0f172a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
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
                                                            : "bg-slate-700"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {newPassword.length < 6 ? "Weak" : newPassword.length < 10 ? "Fair" : "Strong"} password
                                        </p>
                                    </div>
                                )}
                                <button className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20 w-fit">
                                    Update Password
                                </button>
                            </div>
                        </div>

                        {/* Two-Factor Auth */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Shield className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
                                        <p className="text-sm text-slate-400">Add an extra layer of security. You'll need to enter a verification code in addition to your password.</p>
                                        {isTwoFactorEnabled && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400 mt-2">
                                                <CheckCircle className="h-3 w-3" /> Active
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ToggleSwitch enabled={isTwoFactorEnabled} onToggle={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)} />
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Monitor className="h-4 w-4 text-slate-400" /> Active Sessions
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] border border-blue-500/20">
                                    <div className="flex items-center gap-3">
                                        <Monitor className="h-4 w-4 text-blue-400" />
                                        <div>
                                            <p className="text-sm text-white">Chrome on Windows</p>
                                            <p className="text-xs text-slate-500">Manila, Philippines · Current session</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2 py-1 rounded">Current</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a]">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-4 w-4 text-slate-500" />
                                        <div>
                                            <p className="text-sm text-white">Safari on iPhone</p>
                                            <p className="text-xs text-slate-500">Manila, Philippines · 2 hours ago</p>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">Revoke</button>
                                </div>
                            </div>
                            <button className="mt-4 text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
                                <LogOut className="h-3 w-3" /> Sign out all other sessions
                            </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6">
                            <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Danger Zone
                            </h3>
                            <SettingRow title="Deactivate Account" description="Temporarily disable your account. You can reactivate it later by signing in." border>
                                <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                    Deactivate
                                </button>
                            </SettingRow>
                            <SettingRow title="Delete Account" description="Permanently delete your account and all associated data. This action cannot be undone." border={false}>
                                <button className="px-4 py-2 rounded-lg border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                                    Delete Account
                                </button>
                            </SettingRow>
                        </div>
                    </div>
                );

            case "Privacy":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Eye} title="Privacy" description="Manage how your information is seen and used." />

                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-400" /> Public Visibility
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Public Profile</p>
                                        <p className="text-sm text-slate-400">Allow potential tenants to find your profile in public search.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyProfileVisible} onToggle={() => setPrivacyProfileVisible(!privacyProfileVisible)} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Search Engine Indexing</p>
                                        <p className="text-sm text-slate-400">Allow search engines like Google to show your profile.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacySearchIndexing} onToggle={() => setPrivacySearchIndexing(!privacySearchIndexing)} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-slate-400" /> Data & Usage
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Data Usage for Improvements</p>
                                        <p className="text-sm text-slate-400">Allow iReside to use your anonymous usage data to improve the platform.</p>
                                    </div>
                                    <ToggleSwitch enabled={privacyDataSharing} onToggle={() => setPrivacyDataSharing(!privacyDataSharing)} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" /> Blocked Users
                            </h3>
                            <p className="text-sm text-slate-400 mb-4">Manage tenants and users you have blocked.</p>
                            <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                View Blocked List
                            </button>
                        </div>
                    </div>
                );

            case "Notifications":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={Bell} title="Notifications" description="Choose how and when you want to be notified about activity." />

                        {/* Notification Matrix */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-end gap-8 pr-1">
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase w-12 text-center">Email</span>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase w-12 text-center">SMS</span>
                                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase w-12 text-center">Push</span>
                                </div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-white/5">
                                {/* New Inquiries */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">New Inquiries</p>
                                        <p className="text-xs text-slate-400">When potential tenants message you about listings.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifInquiryEmail} onToggle={() => setNotifInquiryEmail(!notifInquiryEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifInquirySms} onToggle={() => setNotifInquirySms(!notifInquirySms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifInquiryPush} onToggle={() => setNotifInquiryPush(!notifInquiryPush)} /></div>
                                    </div>
                                </div>

                                {/* Maintenance Requests */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Maintenance Requests</p>
                                        <p className="text-xs text-slate-400">Urgent notifications for repairs and tenant issues.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenanceEmail} onToggle={() => setNotifMaintenanceEmail(!notifMaintenanceEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenanceSms} onToggle={() => setNotifMaintenanceSms(!notifMaintenanceSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMaintenancePush} onToggle={() => setNotifMaintenancePush(!notifMaintenancePush)} /></div>
                                    </div>
                                </div>

                                {/* Payment Updates */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Payment Updates</p>
                                        <p className="text-xs text-slate-400">Notifications about rent payments, receipts and payouts.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifPaymentEmail} onToggle={() => setNotifPaymentEmail(!notifPaymentEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifPaymentSms} onToggle={() => setNotifPaymentSms(!notifPaymentSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifPaymentPush} onToggle={() => setNotifPaymentPush(!notifPaymentPush)} /></div>
                                    </div>
                                </div>

                                {/* Lease Updates */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Lease Updates</p>
                                        <p className="text-xs text-slate-400">Reminders for lease renewals, expirations and signatures.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeaseEmail} onToggle={() => setNotifLeaseEmail(!notifLeaseEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeaseSms} onToggle={() => setNotifLeaseSms(!notifLeaseSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifLeasePush} onToggle={() => setNotifLeasePush(!notifLeasePush)} /></div>
                                    </div>
                                </div>

                                {/* Marketing */}
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium text-white">Marketing & Promotions</p>
                                        <p className="text-xs text-slate-400">Tips, product updates and promotional offers from iReside.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMarketingEmail} onToggle={() => setNotifMarketingEmail(!notifMarketingEmail)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMarketingSms} onToggle={() => setNotifMarketingSms(!notifMarketingSms)} /></div>
                                        <div className="w-12 flex justify-center"><ToggleSwitch size="small" enabled={notifMarketingPush} onToggle={() => setNotifMarketingPush(!notifMarketingPush)} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-3">
                            <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                Enable All
                            </button>
                            <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                Disable All
                            </button>
                        </div>
                    </div>
                );

            case "Billing":
                return (
                    <div className="space-y-6 max-w-4xl">
                        <SectionHeader icon={CreditCard} title="Billing & Payments" description="Manage how you receive rental payments from tenants." />

                        {/* Current Plan */}
                        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/5 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Wallet className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Professional Plan</h3>
                                        <p className="text-xs text-slate-400">Unlimited properties · Priority support</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">₱2,500<span className="text-sm font-normal text-slate-400">/mo</span></p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Next billing: Mar 1, 2026</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors shadow-lg shadow-blue-600/20">
                                    Upgrade Plan
                                </button>
                                <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                    View Plans
                                </button>
                            </div>
                        </div>

                        {/* Payout Method */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-slate-400" /> Payout Method
                            </h3>
                            <div className="grid gap-3">
                                <label
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                                        selectedPayoutMethod === "gcash"
                                            ? "border-blue-500/30 bg-blue-500/5"
                                            : "border-white/5 bg-[#0f172a] hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="radio"
                                            name="payout"
                                            value="gcash"
                                            checked={selectedPayoutMethod === "gcash"}
                                            onChange={() => setSelectedPayoutMethod("gcash")}
                                            className="accent-blue-500"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Smartphone className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">GCash (E-Wallet)</p>
                                                <p className="text-xs text-slate-400">+63 917 *** 4567</p>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedPayoutMethod === "gcash" && (
                                        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" /> Verified
                                        </span>
                                    )}
                                </label>

                                <label
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                                        selectedPayoutMethod === "bank"
                                            ? "border-blue-500/30 bg-blue-500/5"
                                            : "border-white/5 bg-[#0f172a] hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="radio"
                                            name="payout"
                                            value="bank"
                                            checked={selectedPayoutMethod === "bank"}
                                            onChange={() => setSelectedPayoutMethod("bank")}
                                            className="accent-blue-500"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">Bank Transfer (BDO)</p>
                                                <p className="text-xs text-slate-400">**** **** **** 8921</p>
                                            </div>
                                        </div>
                                    </div>
                                </label>

                                <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all">
                                    <Plus className="h-4 w-4" /> Add New Payment Method
                                </button>
                            </div>
                        </div>

                        {/* Billing History */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-slate-400" /> Billing History
                                </h3>
                                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                                    Download All <Download className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { date: "Feb 1, 2026", amount: "₱2,500.00", status: "Paid", invoice: "#INV-2026-02" },
                                    { date: "Jan 1, 2026", amount: "₱2,500.00", status: "Paid", invoice: "#INV-2026-01" },
                                    { date: "Dec 1, 2025", amount: "₱2,500.00", status: "Paid", invoice: "#INV-2025-12" },
                                ].map((item) => (
                                    <div key={item.invoice} className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-white">{item.invoice}</p>
                                                <p className="text-xs text-slate-500">{item.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-white">{item.amount}</span>
                                            <button className="opacity-0 group-hover:opacity-100 text-xs text-blue-400 hover:text-blue-300 font-medium transition-all">
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

                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <HardDrive className="h-6 w-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-1">Export Your Data</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Request a copy of all your data stored on iReside. This includes your profile information,
                                        property listings, tenant records, financial transactions, and communication history.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 mb-6">
                                {[
                                    { icon: User, label: "Profile Information", desc: "Personal details, preferences, settings" },
                                    { icon: Building2, label: "Property Data", desc: "Listings, unit details, photos, amenities" },
                                    { icon: Users, label: "Tenant Records", desc: "Lease agreements, contacts, payment history" },
                                    { icon: Receipt, label: "Financial Records", desc: "Invoices, payouts, transaction logs" },
                                ].map((item) => (
                                    <label key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-[#0f172a] border border-white/5 hover:border-white/10 cursor-pointer transition-colors group">
                                        <input type="checkbox" defaultChecked className="accent-blue-500 h-4 w-4" />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <item.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{item.label}</p>
                                                <p className="text-xs text-slate-500">{item.desc}</p>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Export may take up to 24 hours to process.
                                </p>
                                <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Request Export
                                </button>
                            </div>
                        </div>

                        {/* Previous Exports */}
                        <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Archive className="h-4 w-4 text-slate-400" /> Previous Exports
                            </h3>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a]">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white">Full Data Export</p>
                                        <p className="text-xs text-slate-500">Jan 15, 2026 · 12.4 MB</p>
                                    </div>
                                </div>
                                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                                    <Download className="h-3 w-3" /> Download
                                </button>
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
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-red-400 mb-2">This action is irreversible</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Deleting your account will permanently remove all your data including properties, tenant records,
                                        financial history, and communication logs. This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#0f172a] border border-red-500/10 p-4 mb-6">
                                <h4 className="text-sm font-medium text-white mb-3">What will be deleted:</h4>
                                <ul className="space-y-2">
                                    {[
                                        "All property listings and unit data",
                                        "Tenant records and lease agreements",
                                        "Financial records and transaction history",
                                        "Communication history with tenants",
                                        "Your profile and account settings",
                                    ].map((text) => (
                                        <li key={text} className="flex items-center gap-2 text-sm text-slate-400">
                                            <X className="h-3 w-3 text-red-400 flex-shrink-0" />
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
                                    <p className="text-sm text-slate-400">
                                        Please type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full max-w-xs rounded-lg bg-[#0f172a] border border-red-500/20 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            disabled={deleteConfirmText !== "DELETE"}
                                            className={cn(
                                                "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                deleteConfirmText === "DELETE"
                                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                                                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                            )}
                                        >
                                            Permanently Delete
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                            className="px-4 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
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
                    <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-xl text-slate-500">
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
                        <h2 className="text-lg font-bold text-white mb-1 px-3">Settings</h2>
                        <p className="text-xs text-slate-500 px-3 mb-4">Manage your account preferences</p>
                        <nav className="space-y-1">
                            {SIDEBAR_ITEMS.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveTab(item.label)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        activeTab === item.label
                                            ? "bg-blue-600/10 text-blue-400 shadow-sm shadow-blue-500/5"
                                            : item.label === "Delete Account"
                                                ? "text-red-500 hover:bg-red-500/10"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
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
