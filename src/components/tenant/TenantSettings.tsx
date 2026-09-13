"use client";

import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    Palette,
    Contrast,
    Camera,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { updateTenantPassword, signOut } from "@/lib/supabase/client-auth";
import { parseUserAgent } from "@/lib/utils/device-parser";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useHighContrast } from "@/hooks/useHighContrast";
import { FontSizeToggle } from "@/components/ui/FontSizeToggle";

// --- Types ---
type SettingsCategory = "Identity" | "Accessibility" | "Security" | "Notifications" | "Billing" | "Data";

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
        id: "Accessibility", 
        label: "Display & A11y", 
        icon: Palette,
        description: "Text size, contrast and readability"
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

function GlassCard({
    children,
    className,
    title,
    description,
    headerExtra,
}: {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    headerExtra?: React.ReactNode;
}) {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl sm:rounded-[2rem] neumorphic-panel transition-all duration-500", className)}>
            {(title || description || headerExtra) && (
                <div className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-5 md:px-8 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        {title && <h3 className="text-base sm:text-lg font-black text-foreground">{title}</h3>}
                        {description && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{description}</p>}
                    </div>
                    {headerExtra && <div className="shrink-0">{headerExtra}</div>}
                </div>
            )}
            <div className="p-4 sm:p-6 md:p-8 text-foreground">{children}</div>
        </div>
    );
}

function SettingField({ label, children, description, icon: Icon }: { label: string; children: React.ReactNode; description?: string; icon?: any }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
                {Icon && <Icon className="size-3.5 text-primary" />}
                <label className="text-xs font-black uppercase tracking-wider text-foreground/80">{label}</label>
            </div>
            {children}
            {description && <p className="px-1 text-xs text-muted-foreground">{description}</p>}
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle, size = "default" }: { enabled: boolean; onToggle: () => void; size?: "default" | "small" }) {
    const isSmall = size === "small";
    return (
        <button
            type="button"
            onClick={() => onToggle()}
            className={cn(
                "relative inline-flex items-center rounded-full transition-all duration-300 cursor-pointer",
                enabled ? "neumorphic-primary" : "neumorphic-inset",
                isSmall ? "h-5 w-9" : "h-6 w-11"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full transition-all duration-300",
                    isSmall ? "size-3" : "size-4",
                    enabled
                        ? isSmall ? "translate-x-5 bg-white" : "translate-x-6 bg-white"
                        : "translate-x-1 bg-neutral-400"
                )}
            />
        </button>
    );
}

function SubNav({ tabs, activeTab, onTabChange }: { tabs: string[]; activeTab: string; onTabChange: (tab: string) => void }) {
    return (
        <div className="relative">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-hide px-0.5">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "whitespace-nowrap rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-black transition-all cursor-pointer shrink-0",
                            activeTab === tab
                                ? "neumorphic-primary text-primary-foreground font-black shadow-md"
                                : "neumorphic-extruded text-muted-foreground hover:text-foreground font-bold"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Mobile Tab Rail Horizontal Scroll State & Affordance
    const mobileTabRailRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateScrollIndicators = useCallback(() => {
        const el = mobileTabRailRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 6);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }, []);

    useEffect(() => {
        const el = mobileTabRailRef.current;
        if (!el) return;
        updateScrollIndicators();
        el.addEventListener("scroll", updateScrollIndicators, { passive: true });
        window.addEventListener("resize", updateScrollIndicators);
        return () => {
            el.removeEventListener("scroll", updateScrollIndicators);
            window.removeEventListener("resize", updateScrollIndicators);
        };
    }, [updateScrollIndicators]);

    const scrollMobileTabs = useCallback((direction: "left" | "right") => {
        const el = mobileTabRailRef.current;
        if (!el) return;
        const delta = direction === "left" ? -200 : 200;
        el.scrollBy({ left: delta, behavior: "smooth" });
    }, []);

    const handleMobileTabClick = useCallback((tabId: SettingsCategory) => {
        if (tabId === activeTab) return;
        setActiveTab(tabId);
        const el = mobileTabRailRef.current;
        if (el) {
            const btn = el.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement | null;
            btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, [activeTab]);

    // Mapping of Sub-tabs
    const SUB_TABS: Record<SettingsCategory, string[]> = {
        Identity: ["Profile", "Emergency Contact"],
        Accessibility: ["Readability"],
        Security: ["Account", "Protection", "Sessions"],
        Notifications: ["Alerts"],
        Billing: ["Payment Methods", "History"],
        Data: ["Export", "Danger"],
    };

    const { isHighContrast, toggleHighContrast } = useHighContrast();

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
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Sessions States
    type SessionsState = { sessions: any[]; isSessionsLoading: boolean; currentSessionId: string | null };
    type SessionsAction =
        | { type: 'FETCH_SESSIONS_START' }
        | { type: 'FETCH_SESSIONS_SUCCESS'; payload: { sessions: any[]; currentSessionId: string | null } }
        | { type: 'FETCH_SESSIONS_ERROR' };

    const sessionsReducer = (state: SessionsState, action: SessionsAction): SessionsState => {
        switch (action.type) {
            case 'FETCH_SESSIONS_START':
                return { ...state, isSessionsLoading: true };
            case 'FETCH_SESSIONS_SUCCESS':
                return { ...state, isSessionsLoading: false, sessions: action.payload.sessions, currentSessionId: action.payload.currentSessionId };
            case 'FETCH_SESSIONS_ERROR':
                return { ...state, isSessionsLoading: false };
            default:
                return state;
        }
    };

    const [sessionsState, dispatchSessions] = useReducer(sessionsReducer, {
        sessions: [], isSessionsLoading: false, currentSessionId: null
    });
    const { sessions, isSessionsLoading, currentSessionId } = sessionsState;

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
                dispatchSessions({ type: 'FETCH_SESSIONS_START' });
                try {
                    const { data, error } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
                    if (error) throw error;

                    const { data: { session } } = await supabase.auth.getSession();
                    dispatchSessions({
                        type: 'FETCH_SESSIONS_SUCCESS',
                        payload: { sessions: data || [], currentSessionId: session ? (session as any).id : null }
                    });
                } catch (err) {
                    console.error("[Sessions] Failed to fetch sessions:", err);
                    dispatchSessions({ type: 'FETCH_SESSIONS_ERROR' });
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

    const handleSaveProfile = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const socialsWithEmergency = {
                ...((profile.socials as any) || {}),
                emergency_contact_name: formData.emergency_name,
                emergency_contact_phone: formData.emergency_phone,
            };

            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    bio: formData.bio,
                    socials: socialsWithEmergency,
                } as any)
                .eq("id", profile.id);

            if (error) throw error;

            try {
                await supabase.auth.updateUser({
                    data: {
                        emergency_contact_name: formData.emergency_name,
                        emergency_contact_phone: formData.emergency_phone,
                    }
                });
            } catch {
                // non-blocking
            }

            const { error: privateError } = await (supabase as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: profile.id,
                        phone: formData.phone,
                        address: formData.address,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (privateError) throw privateError;

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

    const handleRevokeSession = async (sessionId: string) => {
        const loadingToast = toast.loading("Revoking session...");
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to revoke session");

            toast.success("Session revoked successfully", { id: loadingToast });
            dispatchSessions({
                type: 'FETCH_SESSIONS_SUCCESS',
                payload: {
                    sessions: sessions.filter(s => s.id !== sessionId),
                    currentSessionId,
                },
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to revoke session", { id: loadingToast });
        }
    };

    const handleSignOutOthers = async () => {
        dispatchSessions({ type: 'FETCH_SESSIONS_START' });
        const loadingToast = toast.loading("Signing out other devices...");
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;

            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "others" }),
            }).catch(() => null);

            toast.success("Signed out of all other devices successfully", { id: loadingToast });
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) {
                dispatchSessions({ 
                    type: 'FETCH_SESSIONS_SUCCESS', 
                    payload: { sessions: data, currentSessionId: currentSessionId } 
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out other devices", { id: loadingToast });
            dispatchSessions({ type: 'FETCH_SESSIONS_ERROR' });
        }
    };

    const handleSignOutAll = async () => {
        const loadingToast = toast.loading("Signing out everywhere...");
        try {
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "global" }),
            }).catch(() => null);

            await signOut({ scope: "global" });
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out globally", { id: loadingToast });
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
                        <div className="space-y-6 sm:space-y-8">
                            <GlassCard title="Avatar & Identity" description="Your primary identification photo.">
                                <div className="flex flex-col items-center py-4">
                                    <div 
                                        className="group relative flex size-32 sm:size-40 items-center justify-center rounded-[2.5rem] sm:rounded-[3rem] neumorphic-inset shadow-xl transition-transform hover:scale-105"
                                        style={{ backgroundColor: profile?.avatar_bg_color || "#3B82F6" }}
                                    >
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt="Avatar" fill sizes="160px" className="rounded-[2.3rem] sm:rounded-[2.8rem] object-cover" />
                                        ) : (
                                            <span className="text-4xl sm:text-5xl font-black text-white">
                                                {(formData.full_name || profile?.full_name || "T").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => setIsAvatarPickerOpen(true)}
                                            className="absolute -bottom-2 -right-2 flex size-10 sm:size-12 items-center justify-center rounded-2xl neumorphic-primary text-primary-foreground transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md"
                                            title="Change avatar"
                                        >
                                            <Camera className="size-5 sm:size-6" />
                                        </button>
                                    </div>
                                    <h4 className="mt-5 sm:mt-6 text-lg sm:text-xl font-black text-foreground">{formData.full_name || profile?.full_name || "Resident"}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Verified Resident</p>
                                </div>
                            </GlassCard>

                            <GlassCard title="Profile Information" description="Basic details about you.">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <SettingField label="Full Name" icon={User} description="Your verified name.">
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </SettingField>
                                    <SettingField label="Email" icon={Mail} description="Your verified email.">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl neumorphic-inset opacity-60 px-4 py-3 text-sm text-muted-foreground"
                                        />
                                    </SettingField>
                                    <SettingField label="Phone Number" icon={Phone}>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </SettingField>
                                    <SettingField label="Address" icon={Home}>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </SettingField>
                                    <div className="md:col-span-2">
                                        <SettingField label="Bio" icon={FileText} description="Tell landlords a bit about yourself.">
                                            <textarea
                                                rows={4}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                className="w-full resize-none rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </SettingField>
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
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
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Contact Phone" icon={Phone}>
                                    <input
                                        type="tel"
                                        value={formData.emergency_phone}
                                        onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="space-y-6 sm:space-y-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground">Profile</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">Control your personal information.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl sm:rounded-2xl neumorphic-primary px-6 sm:px-8 py-2.5 sm:py-3.5 text-xs sm:text-sm font-black text-primary-foreground shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer w-fit"
                    >
                        {isSaving ? "Saving..." : <><Save className="size-4 sm:size-5" /> Save Changes</>}
                    </button>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Identity} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-6 sm:mt-8">
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
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                
                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="space-y-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={`strength-${i}`}
                                                    className={cn(
                                                        "h-1.5 flex-1 rounded-full transition-colors",
                                                        newPassword.length >= i * 3
                                                            ? newPassword.length >= 12 ? "bg-emerald-500" : newPassword.length >= 8 ? "bg-amber-500" : "bg-rose-500"
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
                                
                                {passwordSuccess && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Password updated successfully!</p>
                                    </div>
                                )}
                                {passwordError && (
                                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{passwordError}</p>
                                    </div>
                                )}
                                <button 
                                    type="button"
                                    onClick={handlePasswordUpdate}
                                    disabled={passwordUpdating}
                                    className="w-full rounded-xl sm:rounded-2xl neumorphic-primary py-3 text-sm font-black text-primary-foreground transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
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
                                            <p className="text-sm font-black text-foreground">2FA is Active</p>
                                            <p className="text-xs text-muted-foreground">Your account is protected with two-factor authentication.</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground mb-4">To disable 2FA, please contact support.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-lg">
                                    <p className="text-sm text-muted-foreground">Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.</p>
                                    <button 
                                        type="button"
                                        className="w-full rounded-xl sm:rounded-2xl neumorphic-primary py-3 text-sm font-black text-primary-foreground transition-all shadow-md active:scale-95 cursor-pointer"
                                        onClick={() => toast.info("2FA setup is managed by your administrator.")}
                                    >
                                        Enable Two-Factor Authentication
                                    </button>
                                </div>
                            )}
                        </GlassCard>
                    );
                case "Sessions":
                    return (
                        <GlassCard title="Active Sessions" description="Devices and browsers currently logged into your tenant account.">
                            <div className="space-y-4 max-w-xl">
                                {isSessionsLoading && sessions.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground uppercase tracking-widest font-black">Loading sessions...</div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground uppercase tracking-widest font-black">No active sessions found</div>
                                ) : (
                                    sessions.map((sess) => {
                                        const deviceInfo = parseUserAgent(sess.user_agent);
                                        const isCurrent = sess.id === currentSessionId;
                                        const isMobile = deviceInfo.deviceType === "mobile" || deviceInfo.deviceType === "tablet";
                                        const Icon = isMobile ? Smartphone : Monitor;

                                        return (
                                            <div key={sess.id} className={cn(
                                                "flex items-center justify-between rounded-2xl border p-4 transition-all gap-4",
                                                isCurrent 
                                                    ? "border-primary/40 bg-primary/5 neumorphic-panel" 
                                                    : "border-border/60 neumorphic-extruded hover:border-border"
                                            )}>
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={cn(
                                                        "flex size-10 items-center justify-center rounded-xl shrink-0",
                                                        isCurrent ? "bg-primary/20 text-primary" : "neumorphic-inset text-muted-foreground"
                                                    )}>
                                                        <Icon className="size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-black text-foreground truncate">{deviceInfo.label}</h4>
                                                            {isCurrent && (
                                                                <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0">
                                                                    This Device
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground truncate">
                                                            {isCurrent ? "Active now" : <>Last active <ClientOnlyDate date={sess.updated_at} format={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></>} • IP: {sess.ip || "Unknown IP"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!isCurrent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeSession(sess.id)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                                                        title="Revoke this device"
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                
                                {sessions.length > 1 && (
                                    <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-border/60">
                                        <button 
                                            type="button"
                                            onClick={handleSignOutOthers}
                                            disabled={isSessionsLoading}
                                            className="flex items-center gap-2 text-xs font-black text-amber-600 dark:text-amber-400 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <LogOut className="size-3.5" /> Sign out all other devices
                                        </button>

                                        <button 
                                            type="button"
                                            onClick={handleSignOutAll}
                                            disabled={isSessionsLoading}
                                            className="flex items-center gap-2 text-xs font-black text-rose-600 dark:text-rose-400 hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            <ShieldCheck className="size-3.5" /> Sign out of all devices (Global Reset)
                                        </button>
                                    </div>
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
                className="space-y-6 sm:space-y-8"
            >
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">Security & Login</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Protect your account and manage active sessions.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Security} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-6 sm:mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderNotifications = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">Notifications</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Choose how and when you want to be alerted.</p>
            </div>

            <SubNav 
                tabs={SUB_TABS.Notifications} 
                activeTab={activeSubTab} 
                onTabChange={setActiveSubTab} 
            />

            <div className="mt-6 sm:mt-8">
                <GlassCard className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-6 sm:px-8 py-4 sm:py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Activity Type</th>
                                    <th className="px-4 py-4 sm:py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                    <th className="px-4 py-4 sm:py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Push</th>
                                    <th className="px-4 py-4 sm:py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">SMS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {[
                                    { key: "rent", label: "Rent Reminders", desc: "When rent is due and payment confirmations." },
                                    { key: "maintenance", label: "Maintenance Updates", desc: "Status changes for your maintenance requests." },
                                    { key: "lease", label: "Lease Updates", desc: "Renewals, expirations and document signing." },
                                    { key: "community", label: "Community Announcements", desc: "News and updates from your property." },
                                    { key: "offers", label: "Special Offers", desc: "Exclusive deals and recommendations." },
                                ].map((item) => (
                                    <tr key={item.key} className="transition-colors hover:bg-muted/10">
                                        <td className="px-6 sm:px-8 py-5 sm:py-6">
                                            <h4 className="text-sm font-black text-foreground">{item.label}</h4>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </td>
                                        <td className="px-4 py-5 sm:py-6 text-center">
                                            <ToggleSwitch 
                                                size="small"
                                                enabled={notifications[`${item.key}Email` as keyof typeof notifications] ?? false} 
                                                onToggle={() => setNotifications(prev => ({ ...prev, [`${item.key}Email`]: !prev[`${item.key}Email` as keyof typeof notifications] }))} 
                                            />
                                        </td>
                                        <td className="px-4 py-5 sm:py-6 text-center">
                                            <ToggleSwitch 
                                                size="small"
                                                enabled={notifications[`${item.key}Push` as keyof typeof notifications] ?? false} 
                                                onToggle={() => setNotifications(prev => ({ ...prev, [`${item.key}Push`]: !prev[`${item.key}Push` as keyof typeof notifications] }))} 
                                            />
                                        </td>
                                        <td className="px-4 py-5 sm:py-6 text-center">
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
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-border/60 p-4 sm:p-6 bg-muted/20">
                        <button 
                            type="button"
                            onClick={() => {
                                setNotifications({
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
                                toast.info("Reset to default preferences");
                            }}
                            className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            Reset to Defaults
                        </button>
                        <button 
                            type="button"
                            onClick={() => toast.success("Notification preferences saved")}
                            className="rounded-xl neumorphic-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md transition-all active:scale-95 cursor-pointer"
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
                                    <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5 neumorphic-panel">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Wallet className="size-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">GCash (E-Wallet)</p>
                                                <p className="text-xs text-muted-foreground">Connected</p>
                                            </div>
                                        </div>
                                        <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-black text-primary">DEFAULT</span>
                                    </div>
                                    
                                    <button 
                                        type="button"
                                        onClick={() => toast.info("Additional payment methods can be configured during checkout.")}
                                        className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border border-dashed border-border/80 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
                                    >
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
                                    <div key={item.receipt} className="flex items-center justify-between p-4 rounded-2xl neumorphic-extruded hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                <CheckCircle className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{item.receipt}</p>
                                                <p className="text-xs text-muted-foreground">{item.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-foreground">{item.amount}</span>
                                            <button 
                                                type="button"
                                                onClick={() => toast.success(`Downloading ${item.receipt}`)}
                                                className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:text-primary/80 font-medium transition-all cursor-pointer"
                                            >
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
                className="space-y-6 sm:space-y-8"
            >
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">Billing & Payments</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Manage your payment methods and view transaction history.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Billing} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-6 sm:mt-8">
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
                                <p className="text-sm text-muted-foreground">Request a copy of your personal data including profile, lease history, payment records, and communications.</p>
                                
                                <div className="grid gap-3">
                                    {[
                                        { icon: User, label: "Profile Information", desc: "Personal details and preferences" },
                                        { icon: FileText, label: "Lease Documents", desc: "Agreements and records" },
                                        { icon: Receipt, label: "Payment History", desc: "Transaction records" },
                                        { icon: Mail, label: "Communications", desc: "Messages and requests" },
                                    ].map((item) => (
                                        <label key={item.label} className="flex items-center gap-4 p-4 rounded-2xl neumorphic-extruded border border-border/40 hover:border-border cursor-pointer transition-all group">
                                            <input type="checkbox" defaultChecked className="accent-primary size-4" />
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="size-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                                    <item.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="size-3" /> Export may take up to 24 hours.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => toast.success("Export request submitted. You will receive an email once ready.")}
                                        className="flex items-center gap-2 rounded-xl sm:rounded-2xl neumorphic-primary px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-primary-foreground transition-all active:scale-95 shadow-md cursor-pointer"
                                    >
                                        <Download className="size-4" /> Request Export
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    );
                case "Danger":
                    return (
                        <GlassCard className="border border-rose-500/30 bg-rose-500/5" title="Danger Zone" description="Irreversible account actions.">
                            <div className="space-y-6 max-w-lg">
                                <div className="flex items-start gap-4">
                                    <div className="size-12 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0 text-rose-500">
                                        <AlertTriangle className="size-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-rose-600 dark:text-rose-400">Delete Account</h4>
                                        <p className="text-sm text-muted-foreground mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl neumorphic-inset p-4">
                                    <h5 className="text-sm font-black text-foreground mb-3">What will be deleted:</h5>
                                    <ul className="space-y-2">
                                        {[
                                            "Your profile and personal information",
                                            "Lease history and documents",
                                            "Payment records and receipts",
                                            "Communication history",
                                            "Saved preferences",
                                        ].map((text) => (
                                            <li key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <X className="size-3 text-rose-500 flex-shrink-0" />
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-3 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black transition-all shadow-md cursor-pointer"
                                >
                                    I understand, delete my account
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="space-y-4 border-t border-rose-500/20 pt-4"
                                >
                                    <p className="text-sm text-muted-foreground">
                                        Please type <span className="text-rose-600 dark:text-rose-400 font-mono font-black">DELETE</span> to confirm:
                                    </p>
                                    <input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type DELETE"
                                        className="w-full max-w-xs rounded-xl neumorphic-inset border border-rose-500/30 px-4 py-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleDeleteAccount}
                                            disabled={deleteConfirmText !== "DELETE"}
                                            className={cn(
                                                "px-6 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                                                deleteConfirmText === "DELETE"
                                                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md"
                                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                                            )}
                                        >
                                            Permanently Delete
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                                            className="px-4 py-3 rounded-xl sm:rounded-2xl border border-border text-xs sm:text-sm font-black text-muted-foreground hover:text-foreground transition-all cursor-pointer"
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
                className="space-y-6 sm:space-y-8"
            >
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">Data & Privacy</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Manage your data and account longevity.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Data} 
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-6 sm:mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderAccessibility = () => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-8"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground">Display &amp; Accessibility</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Customize text readability, contrast, and visual appearance for optimal comfort.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <GlassCard 
                        title="Text Size & Readability" 
                        description="Adjust the interface typography scale without distorting card layouts or button heights."
                    >
                        <FontSizeToggle variant="slider" showPreview={true} />
                    </GlassCard>

                    <GlassCard 
                        title="Universal High Contrast" 
                        description="Reinforces borders, sharpens text outlines, and improves visibility across all tenant pages per WCAG 2.1 AAA standards."
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "size-12 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                    isHighContrast 
                                        ? "bg-foreground text-background border-foreground font-black" 
                                        : "neumorphic-inset text-muted-foreground border-border/40"
                                )}>
                                    <Contrast className="size-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-foreground">Universal High Contrast</h4>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                            isHighContrast ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isHighContrast ? "Active (WCAG AAA)" : "Off"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Replaces soft shadows with solid high-contrast borders and high-visibility text.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => toggleHighContrast()}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border",
                                    isHighContrast
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-muted text-foreground border-border hover:bg-muted/80"
                                )}
                            >
                                {isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </motion.div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "Identity": return renderIdentity();
            case "Accessibility": return renderAccessibility();
            case "Security": return renderSecurity();
            case "Notifications": return renderNotifications();
            case "Billing": return renderBilling();
            case "Data": return renderData();
            default: return null;
        }
    };

    return loading ? (
        <PageLoader message="Loading your settings..." />
    ) : (
        <div className="space-y-6 sm:space-y-10">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-border/40">
                <button
                    type="button"
                    onClick={() => router.push("/tenant/dashboard")}
                    className="flex items-center gap-2 sm:gap-2.5 text-muted-foreground hover:text-primary transition-colors group cursor-pointer w-fit shrink-0"
                >
                    <div className="size-8 rounded-full neumorphic-extruded flex items-center justify-center transition-all group-hover:scale-105 group-hover:text-primary">
                        <ChevronLeft className="size-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black tracking-wide hidden sm:inline">Back to Dashboard</span>
                    <span className="text-xs font-black tracking-wide sm:hidden">Dashboard</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Background Sync Status Indicator */}
                    <div
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        title="Synced with cloud database"
                    >
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Synced with cloud</span>
                        <span className="sm:hidden">Synced</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/40 border border-border/40 text-xs font-bold text-muted-foreground">
                        <span>Control Center</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-foreground font-black">{activeTab}</span>
                    </div>
                </div>
            </div>

            <div className="min-h-[80vh] flex flex-col lg:flex-row gap-6 lg:gap-12">
                {/* Mobile / Tablet Horizontal Navigation (< lg) */}
                <div className="block lg:hidden space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20">
                                <Layout className="size-4.5" />
                            </div>
                            <div>
                                <h1 className="text-base font-black text-foreground leading-tight">Settings</h1>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label}
                                </p>
                            </div>
                        </div>

                        {/* Swipe / Slide affordance hint */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/40 select-none">
                            <SlidersHorizontal className="size-3 text-primary/70" />
                            <span>Swipe to reveal</span>
                            <ChevronRight className="size-3 text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className="relative group/rail">
                        {/* Left Fade Gradient & Scroll Arrow */}
                        <AnimatePresence>
                            {canScrollLeft && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-3 pl-0.5 bg-gradient-to-r from-background via-background/95 to-transparent pointer-events-none"
                                >
                                    <button
                                        type="button"
                                        onClick={() => scrollMobileTabs("left")}
                                        aria-label="Scroll tabs left"
                                        className="size-7 rounded-full neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-md active:scale-90 cursor-pointer pointer-events-auto"
                                    >
                                        <ChevronLeft className="size-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scrollable Pills Container */}
                        <div 
                            ref={mobileTabRailRef}
                            className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 scrollbar-hide -mx-1 px-1 scroll-smooth"
                        >
                            {SIDEBAR_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        data-tab-id={item.id}
                                        type="button"
                                        onClick={() => handleMobileTabClick(item.id)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0",
                                            isActive
                                                ? "neumorphic-panel text-primary font-black shadow-sm border-primary/30 ring-1 ring-primary/20"
                                                : "neumorphic-extruded text-muted-foreground hover:text-foreground font-bold"
                                        )}
                                    >
                                        <Icon className={cn("size-4 transition-transform", isActive ? "scale-110 text-primary" : "text-muted-foreground")} />
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <span className="size-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Fade Gradient & Scroll Arrow */}
                        <AnimatePresence>
                            {canScrollRight && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-0.5 bg-gradient-to-l from-background via-background/95 to-transparent pointer-events-none"
                                >
                                    <button
                                        type="button"
                                        onClick={() => scrollMobileTabs("right")}
                                        aria-label="Scroll tabs right"
                                        title="Slide to view more tabs"
                                        className="size-7 rounded-full neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-md active:scale-90 cursor-pointer pointer-events-auto animate-pulse hover:animate-none"
                                    >
                                        <ChevronRight className="size-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Desktop Collapsible Sidebar (lg+) */}
                <div className={cn(
                    "hidden lg:block flex-shrink-0 space-y-6 transition-all duration-300",
                    isSidebarCollapsed ? "w-20" : "w-80"
                )}>
                    <div className="flex items-center justify-between px-2">
                        <div className={cn("flex items-center gap-4 transition-opacity", isSidebarCollapsed && "justify-center w-full")}>
                            <div className="flex size-12 items-center justify-center rounded-[1.2rem] bg-primary/20 text-primary border border-primary/20 shrink-0">
                                <Layout className="size-6" />
                            </div>
                            {!isSidebarCollapsed && (
                                <div>
                                    <h1 className="text-xl font-black text-foreground">Settings</h1>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Control Center</p>
                                </div>
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed(true)}
                                className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                        )}
                    </div>

                    {isSidebarCollapsed && (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="size-8 rounded-xl neumorphic-extruded flex items-center justify-center text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                title="Expand sidebar"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    )}

                    <nav className="space-y-2">
                        {SIDEBAR_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.id)}
                                    title={isSidebarCollapsed ? `${item.label} — ${item.description}` : undefined}
                                    className={cn(
                                        "group relative flex flex-col transition-all duration-300 text-left cursor-pointer",
                                        isSidebarCollapsed
                                            ? "w-full items-center justify-center rounded-2xl p-3.5"
                                            : "w-full items-start rounded-[1.5rem] px-6 py-5",
                                        isActive 
                                            ? "neumorphic-panel text-primary font-black shadow-md border-primary/30 ring-1 ring-primary/20" 
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center" : "w-full justify-between")}>
                                        <Icon className={cn("size-5 transition-transform duration-300", isActive ? "scale-110 text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-indicator"
                                                className={cn("rounded-full bg-primary", isSidebarCollapsed ? "hidden" : "size-1.5")} 
                                            />
                                        )}
                                    </div>
                                    {!isSidebarCollapsed && (
                                        <>
                                            <span className={cn("mt-3 text-sm font-black transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] font-medium text-muted-foreground mt-0.5 line-clamp-1">
                                                {item.description}
                                            </span>
                                        </>
                                    )}
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
            </div>

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
