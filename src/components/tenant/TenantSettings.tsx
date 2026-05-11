"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import {
    User,
    Shield,
    Bell,
    CreditCard,
    Globe,
    Download,
    Mail,
    Phone,
    FileText,
    Save,
    CheckCircle,
    Key,
    Smartphone,
    Monitor,
    LogOut,
    Eye,
    AlertTriangle,
    Layout,
    ShieldCheck,
    Home,
    Wallet,
    Receipt,
    EyeOff,
    Plus,
    Info,
    X,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { updateTenantPassword } from "@/lib/supabase/client-auth";
import { UAParser } from "ua-parser-js";
import { ClientOnlyDate } from "@/components/ui/client-only-date";

// --- Types ---
type SettingsCategory = "Identity" | "Security" | "Notifications" | "Billing" | "Data";

interface SidebarItem {
    id: SettingsCategory;
    label: string;
    icon: any;
    description: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { 
        id: "Identity", 
        label: "Profile", 
        icon: User,
        description: "Manage your personal information"
    },
    { 
        id: "Security", 
        label: "Security & Login", 
        icon: Shield,
        description: "Password, 2FA and active sessions"
    },
    { 
        id: "Notifications", 
        label: "Notifications", 
        icon: Bell,
        description: "Communication and alert preferences"
    },
    { 
        id: "Billing", 
        label: "Billing & Payments", 
        icon: CreditCard,
        description: "Payment methods and transaction history"
    },
    { 
        id: "Data", 
        label: "Data & Privacy", 
        icon: Globe,
        description: "Export data and account management"
    },
];

// --- Components ---

function GlassCard({ children, className, title, description }: { children: React.ReactNode; className?: string; title?: string; description?: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.05]", className)}>
            {(title || description) && (
                <div className="border-b border-white/5 px-8 py-6">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {description && <p className="text-sm text-neutral-400">{description}</p>}
                </div>
            )}
            <div className="p-8">{children}</div>
        </div>
    );
}

function SettingField({ label, children, description, icon: Icon }: { label: string; children: React.ReactNode; description?: string; icon?: any }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
                {Icon && <Icon className="size-3.5 text-neutral-500" />}
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</label>
            </div>
            {children}
            {description && <p className="px-1 text-xs text-neutral-500">{description}</p>}
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle, size = "default" }: { enabled: boolean; onToggle: () => void; size?: "default" | "small" }) {
    const isSmall = size === "small";
    return (
        <button
            onClick={onToggle}
            className={cn(
                "relative inline-flex items-center rounded-full transition-all duration-300",
                enabled ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]" : "bg-white/10",
                isSmall ? "h-5 w-9" : "h-6 w-11"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full bg-white shadow-sm transition-all duration-300",
                    isSmall ? "size-3" : "size-4",
                    enabled
                        ? isSmall ? "translate-x-5" : "translate-x-6"
                        : "translate-x-1"
                )}
            />
        </button>
    );
}

function SubNav({ tabs, activeTab, onTabChange }: { tabs: string[]; activeTab: string; onTabChange: (tab: string) => void }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={cn(
                        "whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-bold transition-all",
                        activeTab === tab
                            ? "bg-white/10 text-white shadow-xl shadow-white/5 border border-white/10"
                            : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}

// --- Main Component ---

export function TenantSettings() {
    const router = useRouter();
    const { profile, loading, refreshProfile } = useAuth();
    const supabase = createClient();

    // UI State
    const [activeTab, setActiveTab] = useState<SettingsCategory>("Identity");
    const [activeSubTab, setActiveSubTab] = useState<string>("Profile");
    const [isSaving, setIsSaving] = useState(false);

    // Mapping of Sub-tabs
    const SUB_TABS: Record<SettingsCategory, string[]> = {
        Identity: ["Profile", "Emergency Contact"],
        Security: ["Account", "Protection", "Sessions"],
        Notifications: ["Alerts"],
        Billing: ["Payment Methods", "History"],
        Data: ["Export", "Danger"],
    };

    // Reset sub-tab when main tab changes
    const isRestoringFromUrl = useRef(false);
    useEffect(() => {
        if (!isRestoringFromUrl.current) {
            setActiveSubTab(SUB_TABS[activeTab][0]);
        }
        isRestoringFromUrl.current = false;
    }, [activeTab]);

    // Read URL params on mount
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const category = searchParams.get("category");
        const subtab = searchParams.get("subtab");

        if (category && SUB_TABS[category as SettingsCategory]) {
            isRestoringFromUrl.current = true;
            setActiveTab(category as SettingsCategory);
            if (subtab && SUB_TABS[category as SettingsCategory].includes(subtab)) {
                setActiveSubTab(subtab);
            }
        }
    }, []);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        bio: "",
        emergency_name: "",
        emergency_phone: "",
    });

    // Security States
    const [twoFAStatus, setTwoFAStatus] = useState<'loading' | 'disabled' | 'enabled'>('loading');
    const [otpInput, setOtpInput] = useState("");
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [isDisabling, setIsDisabling] = useState(false);

    // Sessions States
    const [sessions, setSessions] = useState<any[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Notification States
    const [notifications, setNotifications] = useState({
        rentEmail: true,
        rentPush: true,
        rentSms: true,
        maintenanceEmail: true,
        maintenancePush: true,
        maintenanceSms: false,
        leaseEmail: true,
        leasePush: true,
        leaseSms: false,
        communityPush: true,
        offersPush: false,
    });

    // Data/Export States
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Avatar picker
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                address: profile.address || "",
                bio: profile.bio || "",
                emergency_name: (profile as any).emergency_contact_name || "",
                emergency_phone: (profile as any).emergency_contact_phone || "",
            });
        }
    }, [profile]);

    // Fetch sessions when Security > Sessions tab is active
    useEffect(() => {
        if (activeTab === "Security" && activeSubTab === "Sessions") {
            const fetchSessions = async () => {
                setIsSessionsLoading(true);
                try {
                    const { data, error } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
                    if (error) throw error;
                    if (data) setSessions(data);
                    
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) setCurrentSessionId((session as any).id);
                } catch (err) {
                    console.error("[Sessions] Failed to fetch sessions:", err);
                } finally {
                    setIsSessionsLoading(false);
                }
            };
            fetchSessions();
        }
    }, [activeTab, activeSubTab, supabase]);

    // Fetch 2FA status when Security > Protection is active
    useEffect(() => {
        if (activeTab === "Security" && activeSubTab === "Protection") {
            const fetchTwoFAStatus = async () => {
                try {
                    const res = await fetch("/api/tenant/2fa?action=status");
                    const data = await res.json();
                    
                    if (data.enabled) {
                        setTwoFAStatus('enabled');
                    } else {
                        setTwoFAStatus('disabled');
                    }
                } catch (err) {
                    console.error("[2FA] Failed to fetch status:", err);
                    setTwoFAStatus('disabled');
                }
            };
            fetchTwoFAStatus();
        }
    }, [activeTab, activeSubTab]);

    // Early return AFTER all hooks
    if (loading) {
        return <PageLoader message="Loading your settings..." />;
    }

    const handleSaveProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    address: formData.address,
                    bio: formData.bio,
                    emergency_contact_name: formData.emergency_name,
                    emergency_contact_phone: formData.emergency_phone,
                } as any)
                .eq("id", profile.id);

            if (error) throw error;
            await refreshProfile();
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        setPasswordError(null);
        setPasswordSuccess(false);

        if (!currentPassword) {
            setPasswordError("Please enter your current password.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setPasswordUpdating(true);
        try {
            const result = await updateTenantPassword(newPassword);
            if (result.success) {
                setPasswordSuccess(true);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setPasswordError(result.error || "Failed to update password.");
            }
        } catch {
            setPasswordError("An unexpected error occurred.");
        } finally {
            setPasswordUpdating(false);
        }
    };

    const handleSignOutOthers = async () => {
        setIsSessionsLoading(true);
        const loadingToast = toast.loading("Signing out other devices...");
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;
            toast.success("Signed out of all other devices successfully", { id: loadingToast });
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) setSessions(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out other devices", { id: loadingToast });
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "DELETE") return;
        
        toast.error("Account deletion is not yet implemented. Please contact support.");
        setShowDeleteConfirm(false);
        setDeleteConfirmText("");
    };

    const renderIdentity = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Profile":
                    return (
                        <GlassCard title="Profile Information" description="Basic details about you.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Full Name" icon={User} description="Your verified name.">
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Email" icon={Mail} description="Your verified email.">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-neutral-500"
                                    />
                                </SettingField>
                                <SettingField label="Phone Number" icon={Phone}>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Address" icon={Home}>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <div className="md:col-span-2">
                                    <SettingField label="Bio" icon={FileText} description="Tell landlords a bit about yourself.">
                                        <textarea
                                            rows={4}
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </SettingField>
                                </div>
                            </div>
                        </GlassCard>
                    );
                case "Emergency Contact":
                    return (
                        <GlassCard title="Emergency Contact" description="Someone we can contact in case of emergency.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Contact Name" icon={User}>
                                    <input
                                        type="text"
                                        value={formData.emergency_name}
                                        onChange={(e) => setFormData({ ...formData, emergency_name: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Contact Phone" icon={Phone}>
                                    <input
                                        type="tel"
                                        value={formData.emergency_phone}
                                        onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                            </div>
                        </GlassCard>
                    );
                default: return null;
            }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-semibold text-white">Profile</h2>
                        <p className="text-neutral-400">Control your personal information.</p>
                    </div>
                    <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : <><Save className="size-5" /> Save Changes</>}
                    </button>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Identity} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderSecurity = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Account":
                    return (
                        <GlassCard title="Change Password" description="Ensure your account is using a long, random password to stay secure.">
                            <div className="space-y-6 max-w-lg">
                                <SettingField label="Current Password" icon={Key}>
                                    <div className="relative">
                                        <input 
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                                        />
                                        <button
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                        >
                                            {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </SettingField>
                                <SettingField label="New Password" icon={Key}>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                                        />
                                        <button
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                        >
                                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </SettingField>
                                <SettingField label="Confirm New Password" icon={Key}>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                
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
                                                            : "bg-white/10"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-neutral-500">
                                            {newPassword.length < 6 ? "Weak" : newPassword.length < 10 ? "Fair" : "Strong"} password
                                        </p>
                                    </div>
                                )}
                                
                                {passwordSuccess && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-emerald-400 font-medium">Password updated successfully!</p>
                                    </div>
                                )}
                                {passwordError && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <p className="text-sm text-red-400 font-medium">{passwordError}</p>
                                    </div>
                                )}
                                <button 
                                    onClick={handlePasswordUpdate}
                                    disabled={passwordUpdating}
                                    className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {passwordUpdating ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </GlassCard>
                    );
                case "Protection":
                    return (
                        <GlassCard title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
                            {twoFAStatus === 'loading' ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute size-12 animate-ping rounded-full bg-primary/20"></div>
                                        <div className="relative size-12 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    </div>
                                </div>
                            ) : twoFAStatus === 'enabled' ? (
                                <div className="space-y-6 max-w-lg">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                            <ShieldCheck className="size-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">2FA is Active</p>
                                            <p className="text-xs text-neutral-400">Your account is protected with two-factor authentication.</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-xs text-neutral-500 mb-4">To disable 2FA, please contact support.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-lg">
                                    <p className="text-sm text-neutral-400">Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.</p>
                                    <button 
                                        className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition-all hover:bg-primary/90"
                                        onClick={() => toast.info("2FA setup is not yet available. Contact support to enable.")}
                                    >
                                        Enable Two-Factor Authentication
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    );
                case "Sessions":
                    return (
                        <GlassCard title="Active Sessions" description="Devices currently logged into your account.">
                            <div className="space-y-4 max-w-lg">
                                {isSessionsLoading && sessions.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-neutral-500 uppercase tracking-widest font-bold">Loading sessions...</div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-neutral-500 uppercase tracking-widest font-bold">No sessions found</div>
                                ) : (
                                    sessions.map((sess) => {
                                        const parser = new UAParser(sess.user_agent);
                                        const browser = parser.getBrowser().name || "Unknown Browser";
                                        const os = parser.getOS().name || "Unknown OS";
                                        const deviceType = parser.getDevice().type;
                                        
                                        const isCurrent = sess.id === currentSessionId;
                                        const isMobile = deviceType === "mobile" || deviceType === "tablet";
                                        const Icon = isMobile ? Smartphone : Monitor;

                                        
                                        return (
                                            <div key={sess.id} className={cn(
                                                "flex items-center justify-between rounded-2xl border p-4 transition-colors",
                                                isCurrent 
                                                    ? "border-primary/20 bg-primary/5" 
                                                    : "border-white/5 bg-white/5 hover:bg-white/10"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <Icon className={cn("size-5", isCurrent ? "text-primary" : "text-neutral-400")} />
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white">{browser} on {os}</h4>
                                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                            {isCurrent ? "Current Session" : <>Last seen <ClientOnlyDate date={sess.updated_at} format={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></>} • IP: {sess.ip}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isCurrent && (
                                                    <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-semibold text-primary">ACTIVE</span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                
                                {sessions.length > 1 && (
                                    <button 
                                        onClick={handleSignOutOthers}
                                        disabled={isSessionsLoading}
                                        className="mt-2 flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                    >
                                        <LogOut className="size-3.5" /> Sign out all other devices
                                    </button>
                                )}
                            </div>
                        </GlassCard>
                    );
                default: return null;
            }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h2 className="text-3xl font-semibold text-white">Security & Login</h2>
                    <p className="text-neutral-400">Protect your account and manage active sessions.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Security} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderNotifications = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h2 className="text-3xl font-semibold text-white">Notifications</h2>
                <p className="text-neutral-400">Choose how and when you want to be alerted.</p>
            </div>

            <SubNav 
                tabs={SUB_TABS.Notifications} 
                activeTab={activeSubTab} 
                onTabChange={setActiveSubTab} 
            />

            <div className="mt-8">
                <GlassCard className="!p-0 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-5 text-xs font-semibold uppercase tracking-widest text-neutral-500">Activity Type</th>
                                <th className="px-4 py-5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">Email</th>
                                <th className="px-4 py-5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">Push</th>
                                <th className="px-4 py-5 text-center text-xs font-semibold uppercase tracking-widest text-neutral-500">SMS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { key: "rent", label: "Rent Reminders", desc: "When rent is due and payment confirmations." },
                                { key: "maintenance", label: "Maintenance Updates", desc: "Status changes for your maintenance requests." },
                                { key: "lease", label: "Lease Updates", desc: "Renewals, expirations and document signing." },
                                { key: "community", label: "Community Announcements", desc: "News and updates from your property." },
                                { key: "offers", label: "Special Offers", desc: "Exclusive deals and recommendations." },
                            ].map((item) => (
                                <tr key={item.key} className="transition-colors hover:bg-white/[0.01]">
                                    <td className="px-8 py-6">
                                        <h4 className="text-sm font-semibold text-white">{item.label}</h4>
                                        <p className="text-xs text-neutral-500">{item.desc}</p>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <ToggleSwitch 
                                            size="small"
                                            enabled={notifications[`${item.key}Email` as keyof typeof notifications] ?? false} 
                                            onToggle={() => setNotifications(prev => ({ ...prev, [`${item.key}Email`]: !prev[`${item.key}Email` as keyof typeof notifications] }))} 
                                        />
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <ToggleSwitch 
                                            size="small"
                                            enabled={notifications[`${item.key}Push` as keyof typeof notifications] ?? false} 
                                            onToggle={() => setNotifications(prev => ({ ...prev, [`${item.key}Push`]: !prev[`${item.key}Push` as keyof typeof notifications] }))} 
                                        />
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <ToggleSwitch 
                                            size="small"
                                            enabled={notifications[`${item.key}Sms` as keyof typeof notifications] ?? false} 
                                            onToggle={() => setNotifications(prev => ({ ...prev, [`${item.key}Sms`]: !prev[`${item.key}Sms` as keyof typeof notifications] }))} 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-3 border-t border-white/5 p-6 bg-white/[0.02]">
                        <button className="text-xs font-bold text-neutral-400 hover:text-white transition-colors">Reset to Defaults</button>
                        <button 
                            onClick={() => toast.success("Notification preferences saved")}
                            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                        >
                            Save Preferences
                        </button>
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );

    const renderBilling = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Payment Methods":
                    return (
                        <div className="space-y-6">
                            <GlassCard title="Payment Methods" description="Manage your payment options.">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Wallet className="size-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">GCash (E-Wallet)</p>
                                                <p className="text-xs text-neutral-500">Connected</p>
                                            </div>
                                        </div>
                                        <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-semibold text-primary">DEFAULT</span>
                                    </div>
                                    
                                    <button className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-white/10 text-sm text-neutral-500 hover:text-white hover:border-white/20 transition-all">
                                        <Plus className="size-4" /> Add Payment Method
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    );
                case "History":
                    return (
                        <GlassCard title="Payment History" description="Your recent transactions.">
                            <div className="space-y-3">
                                {[
                                    { date: "Feb 1, 2026", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2026-02" },
                                    { date: "Jan 1, 2026", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2026-01" },
                                    { date: "Dec 1, 2025", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2025-12" },
                                    { date: "Nov 1, 2025", amount: "₱2,450.00", status: "Paid", receipt: "#REC-2025-11" },
                                ].map((item) => (
                                    <div key={item.receipt} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="size-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{item.receipt}</p>
                                                <p className="text-xs text-neutral-500">{item.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-white">{item.amount}</span>
                                            <button className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:text-primary/80 font-medium transition-all">
                                                <Download className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    );
                default: return null;
            }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h2 className="text-3xl font-semibold text-white">Billing & Payments</h2>
                    <p className="text-neutral-400">Manage your payment methods and view transaction history.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Billing} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderData = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Export":
                    return (
                        <GlassCard title="Data Export" description="Download a copy of your data from iReside.">
                            <div className="space-y-6 max-w-lg">
                                <p className="text-sm text-neutral-400">Request a copy of your personal data including profile, lease history, payment records, and communications.</p>
                                
                                <div className="grid gap-3">
                                    {[
                                        { icon: User, label: "Profile Information", desc: "Personal details and preferences" },
                                        { icon: FileText, label: "Lease Documents", desc: "Agreements and records" },
                                        { icon: Receipt, label: "Payment History", desc: "Transaction records" },
                                        { icon: Mail, label: "Communications", desc: "Messages and requests" },
                                    ].map((item) => (
                                        <label key={item.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-colors group">
                                            <input type="checkbox" defaultChecked className="accent-primary size-4" />
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <item.icon className="size-4 text-neutral-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{item.label}</p>
                                                    <p className="text-xs text-neutral-500">{item.desc}</p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <p className="text-xs text-neutral-500 flex items-center gap-1">
                                        <Info className="size-3" /> Export may take up to 24 hours to process.
                                    </p>
                                    <button className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90">
                                        <Download className="size-4" /> Request Export
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    );
                case "Danger":
                    return (
                        <GlassCard className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10" title="Danger Zone" description="Irreversible account actions.">
                            <div className="space-y-6 max-w-lg">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="size-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-semibold text-red-400">Delete Account</h4>
                                        <p className="text-sm text-neutral-400 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                                    <h5 className="text-sm font-semibold text-white mb-3">What will be deleted:</h5>
                                    <ul className="space-y-2">
                                        {[
                                            "Your profile and personal information",
                                            "Lease history and documents",
                                            "Payment records and receipts",
                                            "Communication history",
                                            "Saved preferences",
                                        ].map((text) => (
                                            <li key={text} className="flex items-center gap-2 text-sm text-neutral-400">
                                                <X className="size-3 text-red-500 flex-shrink-0" />
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg shadow-red-600/20"
                                >
                                    I understand, delete my account
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="space-y-4 border-t border-red-500/10 pt-4"
                                >
                                    <p className="text-sm text-neutral-400">
                                        Please type <span className="text-red-500 font-mono font-bold">DELETE</span> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full max-w-xs rounded-xl bg-white/5 border border-red-500/20 px-4 py-3 text-sm text-white placeholder-neutral-700 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== "DELETE"}
                                            className={cn(
                                                "px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                                                deleteConfirmText === "DELETE"
                                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                                                    : "bg-white/5 text-neutral-500 cursor-not-allowed"
                                            )}
                                        >
                                            Permanently Delete
                                        </button>
                                        <button
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                            className="px-4 py-3 rounded-2xl border border-white/10 text-sm font-bold text-neutral-400 hover:text-white transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                            </div>
                        </GlassCard>
                    );
                default: return null;
            }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h2 className="text-3xl font-semibold text-white">Data & Privacy</h2>
                    <p className="text-neutral-400">Manage your data and account longevity.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Data} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "Identity": return renderIdentity();
            case "Security": return renderSecurity();
            case "Notifications": return renderNotifications();
            case "Billing": return renderBilling();
            case "Data": return renderData();
            default: return null;
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                <div className="flex items-center gap-4 px-4">
                    <div className="flex size-12 items-center justify-center rounded-[1.2rem] bg-primary/20 text-primary border border-primary/20">
                        <Layout className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-white">Settings</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Control Center</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {SIDEBAR_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "group relative flex w-full flex-col items-start rounded-[1.5rem] border px-6 py-5 transition-all duration-500",
                                    isActive 
                                        ? "border-primary/20 bg-primary/10 text-primary shadow-2xl shadow-primary/10" 
                                        : "border-transparent text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
                                )}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <Icon className={cn("size-5 transition-transform duration-500", isActive && "scale-110")} />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-indicator"
                                            className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" 
                                        />
                                    )}
                                </div>
                                <span className="mt-3 text-sm font-bold">{item.label}</span>
                                <span className="text-[10px] font-medium opacity-60">{item.description}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <main className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <AvatarPicker 
                isOpen={isAvatarPickerOpen}
                onClose={() => setIsAvatarPickerOpen(false)}
                currentAvatarUrl={profile?.avatar_url || null}
                currentBgColor={profile?.avatar_bg_color || null}
                onProfileUpdate={() => router.refresh()}
            />
        </div>
    );
}

