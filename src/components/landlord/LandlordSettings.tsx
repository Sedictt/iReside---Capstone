"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Shield,
    Bell,
    CreditCard,
    Globe,
    Download,
    Trash2,
    Building2,
    Mail,
    Phone,
    MapPin,
    FileText,
    Camera,
    Save,
    ChevronRight,
    CheckCircle,
    Key,
    Smartphone,
    Monitor,
    LogOut,
    Eye,
    Info,
    AlertTriangle,
    Zap,
    Droplets,
    Layout,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    UploadCloud,
    ArrowLeft,
    RotateCcw
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { ProfileCoverUploader } from "@/components/profile/ProfileCoverUploader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { UAParser } from "ua-parser-js";

// --- Types ---
type SettingsCategory = "Identity" | "Finance" | "Security" | "Notifications" | "Data";

interface SidebarItem {
    id: SettingsCategory;
    label: string;
    icon: any;
    description: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
    { 
        id: "Identity", 
        label: "Identity", 
        icon: User,
        description: "Manage your profile"
    },
    { 
        id: "Finance", 
        label: "Finance & Utilities", 
        icon: CreditCard,
        description: "Payment methods and utility rates"
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
        id: "Data", 
        label: "Data & Privacy", 
        icon: Globe,
        description: "Export data and account deletion"
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
                {Icon && <Icon className="h-3.5 w-3.5 text-neutral-500" />}
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</label>
            </div>
            {children}
            {description && <p className="px-1 text-xs text-neutral-500">{description}</p>}
        </div>
    );
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300",
                enabled ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]" : "bg-white/10"
            )}
        >
            <span
                className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300",
                    enabled ? "translate-x-6" : "translate-x-1"
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

export function LandlordSettings() {
    const router = useRouter();
    const { profile, loading, refreshProfile } = useAuth();
    // UI State
    const [activeTab, setActiveTab] = useState<SettingsCategory>("Identity");
    const [activeSubTab, setActiveSubTab] = useState<string>("Profile");
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();

    // Mapping of Sub-tabs
    const SUB_TABS: Record<SettingsCategory, string[]> = {
        Identity: ["Profile", "Branding", "Socials", "Verification"],
        Finance: ["GCash", "Utilities"],
        Security: ["Account", "Protection", "Sessions"],
        Notifications: ["Alerts"],
        Data: ["Export", "Tour", "Danger"],
    };

    // Reset sub-tab when main tab changes (skip if restoring from URL)
    const isRestoringFromUrl = useRef(false);
    useEffect(() => {
        if (!isRestoringFromUrl.current) {
            setActiveSubTab(SUB_TABS[activeTab][0]);
        }
        isRestoringFromUrl.current = false;
    }, [activeTab]);

    // Read URL params on mount to restore tab state from OAuth callback
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
        business_name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        bio: "",
        business_permit_number: "",
        socials: {
            facebook: "",
            instagram: "",
            twitter: "",
            linkedin: "",
        },
    });

    const [tourState, setTourState] = useState<any>(null);

    const fetchTourState = useCallback(async () => {
        try {
            const res = await fetch("/api/landlord/tour?start=0");
            if (res.ok) {
                const data = await res.json();
                setTourState(data.state);
            }
        } catch (err) {
            console.error("Failed to fetch tour state", err);
        }
    }, []);

    useEffect(() => {
        fetchTourState();
    }, [fetchTourState]);

    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [avatarPickerKey, setAvatarPickerKey] = useState(0);
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    // Security States
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);

    // 2FA States
    const [twoFAStatus, setTwoFAStatus] = useState<'loading' | 'disabled' | 'gmail_connected' | 'pending_otp' | 'enabled'>('loading');
    const [twoFAEmail, setTwoFAEmail] = useState<string | null>(null);
    const [otpInput, setOtpInput] = useState("");
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [isDisabling, setIsDisabling] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                business_name: profile.business_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                website: profile.website || "",
                address: profile.address || "",
                bio: profile.bio || "",
                business_permit_number: profile.business_permit_number || "",
                socials: typeof profile.socials === 'object' && profile.socials !== null 
                    ? {
                        facebook: (profile.socials as any).facebook || "",
                        instagram: (profile.socials as any).instagram || "",
                        twitter: (profile.socials as any).twitter || "",
                        linkedin: (profile.socials as any).linkedin || "",
                      }
                    : {
                        facebook: "",
                        instagram: "",
                        twitter: "",
                        linkedin: "",
                      },
            });
            fetchProperties();
        }
    }, [profile]);

    // Remaining hooks that were scattered below — hoisted here for Rules of Hooks
    const [isUploadingPermit, setIsUploadingPermit] = useState(false);
    const permitInputRef = useRef<HTMLInputElement>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [activeFinanceTab, setActiveFinanceTab] = useState<"GCash" | "Water" | "Electricity">("GCash");

    const [sessions, setSessions] = useState<any[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === "Security" && activeSubTab === "Sessions") {
            const fetchSessions = async () => {
                setIsSessionsLoading(true);
                try {
                    const { data, error } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
                    console.log("[Sessions] Fetch result:", { data, error });
                    if (error) throw error;
                    if (data) setSessions(data);
                    
                    const { data: { session } } = await supabase.auth.getSession();
                    console.log("[Sessions] Current auth session:", (session as any)?.id);
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

    // Handle OAuth callback params on mount (independent of tab state)
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const gmailConnected = searchParams.get("gmail_connected");
        const error = searchParams.get("error");
        const autoSendOtp = searchParams.get("auto_send_otp") === "true";

        if (gmailConnected === "true") {
            toast.success("Google account connected! Sending OTP...");

            if (autoSendOtp) {
                const sendOtpAsync = async () => {
                    try {
                        const res = await fetch("/api/landlord/2fa", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "send-otp" }),
                        });
                        const data = await res.json();
                        if (data.error) {
                            toast.error(data.error);
                        } else {
                            setTwoFAStatus('pending_otp');
                            toast.success(`OTP sent to ${data.email}`);
                        }
                    } catch (err) {
                        toast.error("Failed to send OTP");
                    }
                };
                sendOtpAsync();
            }

            window.history.replaceState({}, "", window.location.pathname + "?category=Security&subtab=Protection");
        }

        if (error) {
            const errorMessages: Record<string, string> = {
                oauth_failed: "Google OAuth failed. Please try again.",
                missing_code: "Authorization code missing.",
                token_exchange_failed: "Failed to exchange token.",
                save_failed: "Failed to save credentials.",
                callback_failed: "Something went wrong.",
            };
            toast.error(errorMessages[error] || "An error occurred.");
            window.history.replaceState({}, "", window.location.pathname + "?category=Security&subtab=Protection");
        }
    }, []);

    useEffect(() => {
        if (activeTab === "Security" && activeSubTab === "Protection") {
            const fetchTwoFAStatus = async () => {
                try {
                    const res = await fetch("/api/landlord/2fa?action=status");
                    const data = await res.json();
                    
                    if (data.enabled) {
                        setTwoFAStatus('enabled');
                        setTwoFAEmail(data.email);
                    } else if (data.hasGmailConnected) {
                        setTwoFAStatus('gmail_connected');
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

    const handleSignOutOthers = async () => {
        setIsSessionsLoading(true);
        const loadingToast = toast.loading("Signing out other devices...");
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;
            toast.success("Signed out of all other devices successfully", { id: loadingToast });
            // Refresh sessions list
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) setSessions(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out other devices", { id: loadingToast });
        } finally {
            setIsSessionsLoading(false);
        }
    };

    // Early return AFTER all hooks to satisfy Rules of Hooks
    if (loading) {
        return <PageLoader message="Loading your settings..." />;
    }

    const fetchProperties = async () => {
        if (!profile?.id) return;
        
        const { data, error } = await supabase
            .from("properties")
            .select("id, name")
            .eq("landlord_id", profile.id);
        
        if (data) setProperties(data);
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    business_name: formData.business_name,
                    phone: formData.phone,
                    website: formData.website,
                    address: formData.address,
                    bio: formData.bio,
                    business_permit_number: formData.business_permit_number,
                    socials: formData.socials,
                })
                .eq("id", profile.id);

            if (error) throw error;
            await refreshProfile();
            toast.success("Settings updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarPickerUpdate = async () => {
        await refreshProfile();
        setAvatarPickerKey(k => k + 1);
        router.refresh();
    };

    const handlePermitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File too large", {
                description: `The file "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
            });
            if (permitInputRef.current) permitInputRef.current.value = "";
            return;
        }

        setIsUploadingPermit(true);
        const loadingToast = toast.loading("Uploading permit...");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/profile/permit", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to upload permit");
            }

            toast.success("Permit uploaded successfully", { id: loadingToast });
            await refreshProfile();
        } catch (error: any) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsUploadingPermit(false);
            if (permitInputRef.current) permitInputRef.current.value = "";
        }
    };


    const handleHardResetTour = async () => {
        if (!confirm("Are you sure you want to reset all tour progress? This cannot be undone.")) return;
        
        setIsResetting(true);
        const loadingToast = toast.loading("Resetting tour progress...");

        try {
            const response = await fetch("/api/landlord/tour", {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to reset tour");
            }

            toast.success("Tour progress has been completely reset", { id: loadingToast });
            await refreshProfile();
        } catch (error: any) {
            toast.error(error.message, { id: loadingToast });
        } finally {
            setIsResetting(false);
        }
    };

    const handleToggleCompletedQuests = async () => {
        try {
            const nextValue = !tourState?.metadata?.show_completed_quests;
            
            // Optimistic update
            setTourState((prev: any) => ({
                ...prev,
                metadata: { ...prev?.metadata, show_completed_quests: nextValue }
            }));

            const res = await fetch("/api/landlord/tour/metadata", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ show_completed_quests: nextValue, quest_board_hidden: false }),
            });
            if (res.ok) {
                toast.success(nextValue ? "Quests will now remain visible" : "Completed quests will be hidden");
                await fetchTourState();
            }
        } catch (err) {
            toast.error("Failed to update preferences");
        }
    };
    const renderIdentity = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Profile":
                    return (
                        <GlassCard title="Profile Information" description="Basic details about you and your business.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Full Name" icon={User} description="Verified by admin. Contact support to change.">
                                    <input
                                        type="text"
                                        value={profile?.full_name || ""}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-neutral-500"
                                    />
                                </SettingField>
                                <SettingField label="Business Name" icon={Building2} description="Verified by admin. Contact support to change.">
                                    <input
                                        type="text"
                                        value={profile?.business_name || ""}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-neutral-500"
                                    />
                                </SettingField>
                                <SettingField label="Contact Email" icon={Mail} description="This email is used for inquiries.">
                                    <input
                                        type="email"
                                        value={profile?.email || ""}
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
                                <SettingField label="Website" icon={Globe}>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <div className="md:col-span-2">
                                    <SettingField label="Office Address" icon={MapPin}>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </SettingField>
                                </div>
                                <div className="md:col-span-2">
                                    <SettingField label="Short Bio" icon={FileText} description="Briefly describe your property management style.">
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
                case "Branding":
                    return (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <GlassCard title="Cover Photo" description="A cinematic background for your public page.">
                                <div className="relative h-64 w-full overflow-hidden rounded-[1.5rem] border border-white/5 bg-white/5">
                                    <ProfileCoverUploader 
                                        initialCoverUrl={profile?.cover_url || null} 
                                        fullName={profile?.full_name || "Landlord"} 
                                    />
                                </div>
                            </GlassCard>
                            <GlassCard title="Avatar & Identity" description="Your primary identification photo.">
                                <div className="flex flex-col items-center py-4">
                                    <div 
                                        className="group relative flex h-40 w-40 items-center justify-center rounded-[3rem] border-4 border-white/10 shadow-2xl transition-transform hover:scale-105"
                                        style={{ backgroundColor: profile?.avatar_bg_color || "#22C55E" }}
                                    >
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-[2.8rem] object-cover" />
                                        ) : (
                                            <span className="text-5xl font-black text-white">
                                                {profile?.full_name?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => setIsAvatarPickerOpen(true)}
                                            className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Camera className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <h4 className="mt-6 text-xl font-semibold text-white">{profile?.full_name}</h4>
                                    <p className="text-sm text-neutral-500">Verified Landlord</p>
                                </div>
                            </GlassCard>
                        </div>
                    );
                case "Socials":
                    return (
                        <GlassCard title="Social Media Links" description="Connect your social profiles to build more trust.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Facebook" icon={Facebook}>
                                    <input
                                        type="url"
                                        placeholder="https://facebook.com/your-page"
                                        value={formData.socials.facebook}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, facebook: e.target.value } })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Instagram" icon={Instagram}>
                                    <input
                                        type="url"
                                        placeholder="https://instagram.com/your-profile"
                                        value={formData.socials.instagram}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="Twitter / X" icon={Twitter}>
                                    <input
                                        type="url"
                                        placeholder="https://twitter.com/your-handle"
                                        value={formData.socials.twitter}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                <SettingField label="LinkedIn" icon={Linkedin}>
                                    <input
                                        type="url"
                                        placeholder="https://linkedin.com/in/your-profile"
                                        value={formData.socials.linkedin}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, linkedin: e.target.value } })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                            </div>
                        </GlassCard>
                    );
                case "Verification":
                    return (
                        <GlassCard title="Business Verification" description="Upload your business permit to receive a 'Verified' badge.">
                            <div className="space-y-6">
                                <SettingField label="Business Permit Number" icon={FileText}>
                                    <input
                                        type="text"
                                        value={formData.business_permit_number}
                                        onChange={(e) => setFormData({ ...formData, business_permit_number: e.target.value })}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </SettingField>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Permit Document (Photo)</label>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className="relative h-48 w-full md:w-80 overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/5 transition-all hover:bg-white/[0.08]">
                                            {profile?.business_permit_url ? (
                                                <img src={profile.business_permit_url} alt="Business Permit" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
                                                    <UploadCloud className="h-8 w-8" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Document</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <p className="text-sm text-neutral-500 leading-relaxed">
                                                Upload a clear photo of your current business permit. Supported formats: JPG, PNG. Max size: 15MB.
                                            </p>
                                            <button 
                                                onClick={() => permitInputRef.current?.click()}
                                                disabled={isUploadingPermit}
                                                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                                            >
                                                <UploadCloud className="h-5 w-5" /> 
                                                {isUploadingPermit ? "Uploading..." : profile?.business_permit_url ? "Replace Document" : "Upload Document"}
                                            </button>
                                            <input 
                                                ref={permitInputRef}
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handlePermitUpload}
                                            />
                                        </div>
                                    </div>
                                </div>
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
                        <h2 className="text-3xl font-black text-white">Identity</h2>
                        <p className="text-neutral-400">Control how you appear to others.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : <><Save className="h-5 w-5" /> Save Changes</>}
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

    const renderFinance = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "GCash":
                    return (
                        <GlassCard className="!p-0">
                            <div className="p-8">
                                <BillingOperationsPanel 
                                    viewMode="gcash"
                                    propertyId={selectedPropertyId}
                                />
                            </div>
                        </GlassCard>
                    );
                case "Utilities":
                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {["Water", "Electricity"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl border px-6 py-4 text-sm font-bold transition-all",
                                            activeFinanceTab === tab 
                                                ? "border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5" 
                                                : "border-white/5 bg-white/5 text-neutral-400 hover:bg-white/[0.08]"
                                        )}
                                        onClick={() => setActiveFinanceTab(tab as any)}
                                    >
                                        {tab === "Water" && <Droplets className="h-4 w-4" />}
                                        {tab === "Electricity" && <Zap className="h-4 w-4" />}
                                        {tab} Configuration
                                    </button>
                                ))}
                            </div>
                            <GlassCard className="!p-0">
                                <div className="p-8">
                                    <BillingOperationsPanel 
                                        viewMode="rates"
                                        utilityType={activeFinanceTab === "Water" ? "water" : "electricity"}
                                        propertyId={selectedPropertyId}
                                    />
                                </div>
                            </GlassCard>
                        </div>
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
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black text-white">Finance & Utilities</h2>
                        <p className="text-neutral-400">Configure how you receive payments and manage utility rates.</p>
                    </div>
                    
                    {/* Property Selector */}
                    {activeSubTab !== "GCash" && (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-1">
                            <div className="flex items-center gap-2 px-3 py-1">
                                <Building2 className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-white whitespace-nowrap">Property:</span>
                            </div>
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none pr-8 py-2 cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                            >
                                <option value="all" className="bg-[#171717]">All Properties</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id} className="bg-[#171717]">{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <SubNav 
                    tabs={SUB_TABS.Finance} 
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
                                    <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                </SettingField>
                                <SettingField label="New Password" icon={Key}>
                                    <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                                </SettingField>
                                
                                {otpEnabled && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <SettingField label="OTP Verification" icon={Smartphone} description="Check your mobile for the 6-digit code.">
                                            <input type="text" maxLength={6} placeholder="000000" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white tracking-[0.5em] text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                                        </SettingField>
                                    </motion.div>
                                )}

                                <button className="w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-white transition-all hover:bg-white/20">
                                    {otpEnabled ? "Verify & Update" : "Update Password"}
                                </button>
                            </div>
                        </GlassCard>
                    );
                case "Protection":
                    const handleConnectGmail = async () => {
                        try {
                            const res = await fetch("/api/landlord/2fa?action=google-auth");
                            const data = await res.json();
                            if (data.authUrl) {
                                window.location.href = data.authUrl;
                            }
                        } catch (err) {
                            toast.error("Failed to initiate Google OAuth");
                        }
                    };

                    const handleSendOTP = async () => {
                        const loadingToast = toast.loading("Sending OTP...");
                        try {
                            const res = await fetch("/api/landlord/2fa", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "send-otp" }),
                            });
                            const data = await res.json();
                            if (data.error) {
                                toast.error(data.error, { id: loadingToast });
                            } else {
                                setTwoFAStatus('pending_otp');
                                toast.success(`OTP sent to ${data.email}`, { id: loadingToast });
                            }
                        } catch (err) {
                            toast.error("Failed to send OTP", { id: loadingToast });
                        }
                    };

                    const handleVerifyOTP = async () => {
                        if (otpInput.length !== 6) {
                            toast.error("Please enter a 6-digit code");
                            return;
                        }
                        setIsVerifyingOTP(true);
                        const loadingToast = toast.loading("Verifying OTP...");
                        try {
                            const res = await fetch("/api/landlord/2fa", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "verify-otp", otp: otpInput }),
                            });
                            const data = await res.json();
                            if (data.error) {
                                toast.error(data.error, { id: loadingToast });
                            } else {
                                setTwoFAStatus('enabled');
                                setTwoFAEmail(data.email);
                                setOtpInput("");
                                toast.success("2FA enabled successfully!", { id: loadingToast });
                            }
                        } catch (err) {
                            toast.error("Failed to verify OTP", { id: loadingToast });
                        } finally {
                            setIsVerifyingOTP(false);
                        }
                    };

                    const handleDisable2FA = async () => {
                        if (!disablePassword) {
                            toast.error("Please enter your password");
                            return;
                        }
                        setIsDisabling(true);
                        const loadingToast = toast.loading("Disabling 2FA...");
                        try {
                            const res = await fetch("/api/landlord/2fa", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "disable", password: disablePassword }),
                            });
                            const data = await res.json();
                            if (data.error) {
                                toast.error(data.error, { id: loadingToast });
                            } else {
                                setTwoFAStatus('disabled');
                                setTwoFAEmail(null);
                                setDisablePassword("");
                                toast.success("2FA disabled successfully", { id: loadingToast });
                            }
                        } catch (err) {
                            toast.error("Failed to disable 2FA", { id: loadingToast });
                        } finally {
                            setIsDisabling(false);
                        }
                    };

                    return (
    <GlassCard title="Two-Factor Authentication" description="Add an extra layer of security using your Google account.">
        {twoFAStatus === 'loading' ? (
            <div className="flex items-center justify-center py-12">
                <div className="relative flex items-center justify-center">
                    <div className="absolute h-12 w-12 animate-ping rounded-full bg-primary/20"></div>
                    <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </div>
        ) : twoFAStatus === 'disabled' ? (
            <div className="space-y-8 max-w-lg">
                <div className="flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04]">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                        <Smartphone className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-base font-semibold text-white">Email OTP Protection</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed">Connect your Gmail account to receive secure one-time passwords for account verification.</p>
                    </div>
                </div>
                <button 
                    onClick={handleConnectGmail}
                    className="group relative w-full overflow-hidden rounded-2xl bg-primary py-4 text-sm font-black text-black transition-all hover:scale-[1.02] active:scale-95"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="relative flex items-center justify-center gap-2">
                        Connect with Google
                    </span>
                </button>
            </div>
        ) : twoFAStatus === 'gmail_connected' ? (
            <div className="space-y-8 max-w-lg">
                <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">Google Account Linked</span>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Your Google account is successfully connected. The final step is to verify your identity.
                        </p>
                        <div className="pt-4">
                            <button 
                                onClick={handleSendOTP}
                                className="w-full rounded-2xl bg-primary py-4 text-sm font-black text-black transition-all hover:bg-primary/90 shadow-lg shadow-primary/20"
                            >
                                Send Verification Code
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : twoFAStatus === 'pending_otp' ? (
            <div className="space-y-8 max-w-lg">
                <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                        <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">Verification Required</span>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-sm text-neutral-400 text-center mb-4">Enter the 6-digit code sent to your email</p>
                            <input 
                                type="text" 
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000" 
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-2xl text-white tracking-[0.7em] text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all placeholder:text-neutral-700 placeholder:tracking-normal"
                            />
                        </div>
                        <button 
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOTP || otpInput.length !== 6}
                            className="w-full rounded-2xl bg-primary py-4 text-sm font-black text-black transition-all hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {isVerifyingOTP ? "Verifying..." : "Verify & Enable 2FA"}
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-8 max-w-lg">
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">2FA Active</span>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400 leading-relaxed">Your account is now protected with high-security email authentication.</p>
                        <div className="flex items-center gap-3 text-sm font-mono text-neutral-300 bg-white/5 rounded-xl px-4 py-3 border border-white/5 w-fit">
                            <Mail className="h-4 w-4 text-primary" />
                            {twoFAEmail?.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                        </div>
                    </div>
                </div>
                <div className="pt-6 border-t border-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">Disable Protection</h4>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        <p className="text-xs text-neutral-500">To disable two-factor authentication, please provide your current account password.</p>
                        <div className="grid grid-cols-1 gap-3">
                            <input 
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Your password"
                                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            />
                            <button 
                                onClick={handleDisable2FA}
                                disabled={isDisabling || !disablePassword}
                                className="w-full rounded-2xl bg-red-500/10 border border-red-500/20 py-4 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isDisabling ? "Disabling..." : "Disable 2FA"}
                            </button>
                        </div>
                    </div>
                </div>
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

                                        // Try to format relative time or just use the date
                                        const updatedDate = new Date(sess.updated_at);
                                        const timeString = updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                        
                                        return (
                                            <div key={sess.id} className={cn(
                                                "flex items-center justify-between rounded-2xl border p-4 transition-colors",
                                                isCurrent 
                                                    ? "border-primary/20 bg-primary/5" 
                                                    : "border-white/5 bg-white/5 hover:bg-white/10"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-neutral-400")} />
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white">{browser} on {os}</h4>
                                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                            {isCurrent ? "Current Session" : `Last seen ${timeString}`} • IP: {sess.ip}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isCurrent && (
                                                    <span className="rounded-lg bg-primary/20 px-2 py-1 text-[10px] font-black text-primary">ACTIVE</span>
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
                                        <LogOut className="h-3.5 w-3.5" /> Sign out all other devices
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
                    <h2 className="text-3xl font-black text-white">Security & Login</h2>
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
                <h2 className="text-3xl font-black text-white">Notifications</h2>
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
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-neutral-500">Activity Type</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-neutral-500">Email</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-neutral-500">Push</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-neutral-500">SMS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { label: "New Lease Applications", desc: "When a prospective tenant submits an application." },
                                { label: "Maintenance Requests", desc: "Urgent notifications for unit repairs." },
                                { label: "Payment Confirmations", desc: "When rent is successfully received." },
                                { label: "Direct Messages", desc: "Messages from active or prospective tenants." },
                                { label: "System Announcements", desc: "Product updates and platform news." },
                            ].map((item) => (
                                <tr key={item.label} className="transition-colors hover:bg-white/[0.01]">
                                    <td className="px-8 py-6">
                                        <h4 className="text-sm font-semibold text-white">{item.label}</h4>
                                        <p className="text-xs text-neutral-500">{item.desc}</p>
                                    </td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={true} onToggle={() => {}} /></td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={true} onToggle={() => {}} /></td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={false} onToggle={() => {}} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-3 border-t border-white/5 p-6 bg-white/[0.02]">
                        <button className="text-xs font-bold text-neutral-400 hover:text-white transition-colors">Reset to Defaults</button>
                        <button className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all">Save Preferences</button>
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );

    const renderData = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
                case "Export":
                    return (
                        <GlassCard title="Data Export" description="Download a copy of your records in JSON or CSV format.">
                            <div className="space-y-4 max-w-lg">
                                <p className="text-xs text-neutral-400">This includes your properties, tenant history, and financial ledgers.</p>
                                <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10">
                                    <Download className="h-4 w-4" /> Request Data Export
                                </button>
                            </div>
                        </GlassCard>
                    );
                case "Tour":
                    return (
                        <GlassCard title="Product Mastery Quests" description="Reset your progress or manage your learning experience.">
                            <div className="space-y-6 max-w-lg">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-semibold text-white">Show Completed Quests</h4>
                                        <p className="text-xs text-neutral-400">Keep the mastery board visible even after completion.</p>
                                    </div>
                                    <ToggleSwitch 
                                        enabled={!!tourState?.metadata?.show_completed_quests} 
                                        onToggle={handleToggleCompletedQuests} 
                                    />
                                </div>
                                
                                <div className="pt-6 border-t border-white/5">
                                    <h4 className="text-sm font-semibold text-white">Hard Reset</h4>
                                    <p className="mt-1 text-xs text-neutral-400">This will wipe all tour progress and event logs, allowing you to start all quests from zero.</p>
                                    <button 
                                        onClick={handleHardResetTour}
                                        disabled={isResetting}
                                        className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                        <RotateCcw className="h-4 w-4" /> 
                                        {isResetting ? "Resetting..." : "Reset All Quests"}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    );
                case "Danger":
                    return (
                        <GlassCard className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10" title="Danger Zone" description="Irreversible account actions.">
                            <div className="space-y-4 max-w-lg">
                                <p className="text-xs text-red-400/80">Permanently delete your account and all associated data. This cannot be undone.</p>
                                <button className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                    <Trash2 className="h-4 w-4" /> Delete Account
                                </button>
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
                    <h2 className="text-3xl font-black text-white">Data & Privacy</h2>
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
            case "Finance": return renderFinance();
            case "Security": return renderSecurity();
            case "Notifications": return renderNotifications();
            case "Data": return renderData();
            default: return null;
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                <div className="flex items-center gap-4 px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-primary/20 text-primary border border-primary/20">
                        <Layout className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">Settings</h1>
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
                                    <Icon className={cn("h-5 w-5 transition-transform duration-500", isActive && "scale-110")} />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-indicator"
                                            className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),1)]" 
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

            {isAvatarPickerOpen && (
                <AvatarPicker 
                    key={avatarPickerKey}
                    isOpen={isAvatarPickerOpen}
                    onClose={() => setIsAvatarPickerOpen(false)}
                    currentAvatarUrl={profile?.avatar_url || null}
                    currentBgColor={profile?.avatar_bg_color || null}
                    onProfileUpdate={handleAvatarPickerUpdate}
                />
            )}
        </div>
    );
}
