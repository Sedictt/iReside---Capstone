"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { m as motion, AnimatePresence } from "framer-motion";
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
    Loader2,
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
    RotateCcw,
    Palette,
    Sun,
    Moon,
    Contrast,
    Sparkles,
    Upload,
    Check,
    ExternalLink,
    Lock,
    RefreshCw,
    SlidersHorizontal,
    Wand2,
    Pipette,
    ChevronLeft,
    ShieldCheck,
    Clock,
    EyeOff,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { AuditLogsSettingsTab } from "@/components/landlord/settings/AuditLogsSettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { ProfileCoverUploader } from "@/components/profile/ProfileCoverUploader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { parseUserAgent } from "@/lib/utils/device-parser";
import { signOut } from "@/lib/supabase/client-auth";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useTheme } from "next-themes";
import { useHighContrast } from "@/hooks/useHighContrast";
import { FontSizeToggle } from "@/components/ui/FontSizeToggle";
import { CURATED_BANNER_PRESETS, DEFAULT_BANNER_URL } from "@/components/landlord/dashboard/BannerCustomizerModal";
import { ColorPickerModal } from "@/components/ui/ColorPickerModal";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import { useBrand } from "@/context/BrandContext";
import { applyBrandCssVariables } from "@/lib/branding/colors";
import Link from "next/link";

// --- Types ---
type SettingsCategory = "Identity" | "Personalization" | "Finance" | "Security" | "Notifications" | "Data" | "AuditLogs";

interface NotificationChannelPreferences {
    email: boolean;
    push: boolean;
}

type NotificationCategoryKey = "lease_applications" | "maintenance" | "payments" | "messages" | "announcements";

type NotificationPreferences = Record<NotificationCategoryKey, NotificationChannelPreferences>;

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    lease_applications: { email: true, push: true },
    maintenance: { email: true, push: true },
    payments: { email: true, push: true },
    messages: { email: true, push: true },
    announcements: { email: true, push: true },
};

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
        id: "Personalization", 
        label: "Personalization", 
        icon: Palette,
        description: "Themes, high contrast, brand colors & banner customization"
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
        id: "AuditLogs", 
        label: "Activity & Audit Logs", 
        icon: ShieldCheck,
        description: "Tamper-proof activity trail & security records"
    },
    { 
        id: "Data", 
        label: "Data & Privacy", 
        icon: Globe,
        description: "Export data and account deletion"
    },
];

// --- Components ---

function GlassCard({ children, className, title, description, headerExtra }: { children: React.ReactNode; className?: string; title?: string; description?: string; headerExtra?: React.ReactNode }) {
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

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={() => onToggle()}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 cursor-pointer",
                enabled ? "neumorphic-primary" : "neumorphic-inset"
            )}
        >
            <span
                className={cn(
                    "inline-block size-4 transform rounded-full transition-all duration-300",
                    enabled ? "translate-x-6 bg-white" : "translate-x-1 bg-neutral-400"
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

// --- Cache Persistence Types & Helpers ---
export interface CachedLandlordSettings {
    timestamp: number;
    formData: {
        full_name: string;
        business_name: string;
        email: string;
        phone: string;
        website: string;
        address: string;
        bio: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
        business_permit_number: string;
        socials: {
            facebook: string;
            instagram: string;
            twitter: string;
            linkedin: string;
        };
    };
    notificationPreferences: NotificationPreferences;
    personalization: {
        propertyTradeName: string;
        propertyTagline: string;
        rentalArchetype: string;
        brandPrimaryHex: string;
        brandSecondaryHex: string;
        bannerUrl: string;
        propertyLogoUrl: string | null;
    };
    security?: {
        twoFAStatus: 'loading' | 'disabled' | 'gmail_connected' | 'pending_otp' | 'enabled';
        twoFAEmail: string | null;
        passwordLastUpdated: string | null;
        hasChangedPassword: boolean;
    };
    properties?: Array<{ id: string; name: string }>;
    tourState?: any;
}

const SETTINGS_CACHE_KEY_PREFIX = "ireside_landlord_settings_cache_";

export function getCachedSettings(userId?: string): CachedLandlordSettings | null {
    if (typeof window === "undefined") return null;
    try {
        const userKey = userId ? `${SETTINGS_CACHE_KEY_PREFIX}${userId}` : null;
        const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem(`${SETTINGS_CACHE_KEY_PREFIX}current`);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function saveCachedSettings(settings: CachedLandlordSettings, userId?: string): void {
    if (typeof window === "undefined") return;
    try {
        const payload = JSON.stringify(settings);
        if (userId) {
            localStorage.setItem(`${SETTINGS_CACHE_KEY_PREFIX}${userId}`, payload);
        }
        localStorage.setItem(`${SETTINGS_CACHE_KEY_PREFIX}current`, payload);
    } catch (err) {
        console.warn("[LandlordSettings] Failed to cache settings:", err);
    }
}

// --- Main Component ---

export function LandlordSettings() {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();
    // UI State
    const [activeTab, setActiveTab] = useState<SettingsCategory>("Identity");
    const [activeSubTab, setActiveSubTab] = useState<string>("Profile");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const supabase = useMemo(() => createClient(), []);

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
        setActiveTab(tabId);
        const el = mobileTabRailRef.current;
        if (el) {
            const btn = el.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement | null;
            btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
    }, []);

    // Sync & Cache States
    const [isSyncing, setIsSyncing] = useState(true);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
        const cached = getCachedSettings();
        return cached?.timestamp ? new Date(cached.timestamp) : null;
    });
    const [hasLoadedOnce, setHasLoadedOnce] = useState(() => !!getCachedSettings());

    // Mapping of Sub-tabs
    const SUB_TABS: Record<SettingsCategory, string[]> = {
        Identity: ["Profile", "Emergency Contact", "Socials", "Verification"],
        Personalization: ["Themes & Contrast", "Branding & Logo", "Dashboard Banner"],
        Finance: ["GCash", "Utilities"],
        Security: ["Account", "Protection", "Sessions"],
        Notifications: ["Alerts"],
        AuditLogs: ["Activity Logs"],
        Data: ["Export", "Tour", "Danger"],
    };

    // Reset sub-tab when main tab changes (skip if restoring from URL)
    const isRestoringFromUrl = useRef(false);
    useEffect(() => {
        if (!loading && profile && profile.role !== "landlord" && profile.role !== "admin") {
            router.replace("/tenant/dashboard");
        }
    }, [loading, profile, router]);

    useEffect(() => {
        if (!isRestoringFromUrl.current) {
            setActiveSubTab(SUB_TABS[activeTab][0]);
        } else if (!SUB_TABS[activeTab].includes(activeSubTab)) {
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
            } else {
                setActiveSubTab(SUB_TABS[category as SettingsCategory][0]);
            }
        }
    }, []);

    // Theme & High Contrast
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { isHighContrast, toggleHighContrast } = useHighContrast();
    const brand = useBrand();

    // Personalization & Branding State
    const [bannerUrl, setBannerUrl] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.bannerUrl || (typeof window !== "undefined" ? (localStorage.getItem("ireside_landlord_custom_banner_url") || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL);
    });
    const [customBannerInput, setCustomBannerInput] = useState<string>("");
    const [propertyTradeName, setPropertyTradeName] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyTradeName || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || brand.propertyName || "Skyline Lofts") : (brand.propertyName || "Skyline Lofts"));
    });
    const [propertyTagline, setPropertyTagline] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyTagline || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || brand.propertyTagline || "Modern Urban Residences & Studios") : (brand.propertyTagline || "Modern Urban Residences & Studios"));
    });
    const [propertyLogoUrl, setPropertyLogoUrl] = useState<string | null>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyLogoUrl ?? (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_logo") || brand.logoUrl || null) : (brand.logoUrl || null));
    });
    const [rentalArchetype, setRentalArchetype] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.rentalArchetype || (typeof window !== "undefined" ? (localStorage.getItem("ireside_rental_archetype") || brand.rentalArchetype || "apartments") : (brand.rentalArchetype || "apartments"));
    });
    const [brandPrimaryHex, setBrandPrimaryHex] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.brandPrimaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || brand.primaryColor || "#c4b0ff") : (brand.primaryColor || "#c4b0ff"));
    });
    const [brandSecondaryHex, setBrandSecondaryHex] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.brandSecondaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || brand.secondaryColor || "#06b6d4") : (brand.secondaryColor || "#06b6d4"));
    });
    const [isPrimaryColorPickerOpen, setIsPrimaryColorPickerOpen] = useState(false);
    const [isSecondaryColorPickerOpen, setIsSecondaryColorPickerOpen] = useState(false);
    const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const handleSelectBannerPreset = (presetUrl: string) => {
        setBannerUrl(presetUrl);
        toast.info("Banner preview updated. Save all changes to apply permanently.");
    };

    const handleResetBanner = () => {
        setBannerUrl(DEFAULT_BANNER_URL);
        toast.info("Banner reset to default preview. Save all changes to apply permanently.");
    };

    const handleApplyCustomBannerUrl = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = customBannerInput.trim();
        if (!trimmed) {
            toast.error("Please enter an image URL");
            return;
        }
        setBannerUrl(trimmed);
        setCustomBannerInput("");
        toast.info("Custom banner preview applied. Save all changes to apply permanently.");
    };

    const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload a valid image file");
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            toast.error("Image file size must be less than 8MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setBannerUrl(dataUrl);
                toast.info("Banner preview uploaded. Save all changes to apply permanently.");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload a valid image file (PNG, JPG, SVG, WebP)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Logo file size must be less than 5MB");
            return;
        }

        // 1. Instant local preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setPropertyLogoUrl(dataUrl);
            }
        };
        reader.readAsDataURL(file);

        // 2. Upload to Supabase Storage in cloud
        const uploadToast = toast.loading("Uploading logo to cloud storage...");
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/branding/logo", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.logoUrl) {
                    setPropertyLogoUrl(data.logoUrl);
                    toast.dismiss(uploadToast);
                    toast.success("Logo uploaded to cloud! Save changes to apply across all devices.");
                    return;
                }
            }
            toast.dismiss(uploadToast);
            toast.info("Logo preview updated locally. Save all changes to apply.");
        } catch {
            toast.dismiss(uploadToast);
            toast.info("Logo preview updated. Save all changes to apply.");
        }
    };

    const handleRemoveLogo = () => {
        setPropertyLogoUrl(null);
        toast.info("Logo removed in preview. Save all changes to apply permanently.");
    };

    const toggleThemeWithTransition = (newTheme: string) => {
        if (typeof document !== "undefined" && "startViewTransition" in document) {
            (document as any).startViewTransition(() => {
                setTheme(newTheme);
            });
        } else {
            setTheme(newTheme);
        }
    };


    const [formData, setFormData] = useState(() => {
        const cached = getCachedSettings();
        if (cached?.formData) return cached.formData;
        return {
            full_name: "",
            business_name: "",
            email: "",
            phone: "",
            website: "",
            address: "",
            bio: "",
            emergency_contact_name: "",
            emergency_contact_phone: "",
            business_permit_number: "",
            socials: {
                facebook: "",
                instagram: "",
                twitter: "",
                linkedin: "",
            },
        };
    });

    const [tourState, setTourState] = useState<any>(() => {
        const cached = getCachedSettings();
        return cached?.tourState || null;
    });

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

    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [avatarPickerKey, setAvatarPickerKey] = useState(0);
    const [properties, setProperties] = useState<any[]>(() => {
        const cached = getCachedSettings();
        return cached?.properties || [];
    });
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

    // Security States
    const [otpEnabled, setOtpEnabled] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);
    const [passwordLastUpdated, setPasswordLastUpdated] = useState<string | null>(() => {
        const cached = getCachedSettings();
        return cached?.security?.passwordLastUpdated || null;
    });
    const [hasChangedPassword, setHasChangedPassword] = useState<boolean>(() => {
        const cached = getCachedSettings();
        return cached?.security?.hasChangedPassword || false;
    });
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // 2FA States
    const [twoFAStatus, setTwoFAStatus] = useState<'loading' | 'disabled' | 'gmail_connected' | 'pending_otp' | 'enabled'>(() => {
        const cached = getCachedSettings();
        return cached?.security?.twoFAStatus || 'loading';
    });
    const [twoFAEmail, setTwoFAEmail] = useState<string | null>(() => {
        const cached = getCachedSettings();
        return cached?.security?.twoFAEmail || null;
    });
    const [otpInput, setOtpInput] = useState("");
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [isDisabling, setIsDisabling] = useState(false);

    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => {
        const cached = getCachedSettings();
        if (cached?.notificationPreferences) {
            return {
                lease_applications: { ...DEFAULT_NOTIFICATION_PREFERENCES.lease_applications, ...(cached.notificationPreferences.lease_applications || {}) },
                maintenance: { ...DEFAULT_NOTIFICATION_PREFERENCES.maintenance, ...(cached.notificationPreferences.maintenance || {}) },
                payments: { ...DEFAULT_NOTIFICATION_PREFERENCES.payments, ...(cached.notificationPreferences.payments || {}) },
                messages: { ...DEFAULT_NOTIFICATION_PREFERENCES.messages, ...(cached.notificationPreferences.messages || {}) },
                announcements: { ...DEFAULT_NOTIFICATION_PREFERENCES.announcements, ...(cached.notificationPreferences.announcements || {}) },
            };
        }
        return DEFAULT_NOTIFICATION_PREFERENCES;
    });

    const handleToggleNotification = (category: NotificationCategoryKey, channel: "email" | "push") => {
        setNotificationPreferences((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [channel]: !prev[category][channel],
            },
        }));
    };

    const handleResetNotificationDefaults = () => {
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        toast.info("Notification preferences reset to defaults. Save changes to apply.");
    };

    const [initialSnapshot, setInitialSnapshot] = useState<{
        formData: typeof formData;
        notificationPreferences: NotificationPreferences;
        propertyTradeName: string;
        propertyTagline: string;
        rentalArchetype: string;
        brandPrimaryHex: string;
        brandSecondaryHex: string;
        bannerUrl: string;
        propertyLogoUrl: string | null;
    } | null>(() => {
        const cached = getCachedSettings();
        if (cached) {
            return {
                formData: JSON.parse(JSON.stringify(cached.formData)),
                notificationPreferences: JSON.parse(JSON.stringify(cached.notificationPreferences)),
                propertyTradeName: cached.personalization?.propertyTradeName || "Skyline Lofts",
                propertyTagline: cached.personalization?.propertyTagline || "Modern Urban Residences & Studios",
                rentalArchetype: cached.personalization?.rentalArchetype || "apartments",
                brandPrimaryHex: cached.personalization?.brandPrimaryHex || "#c4b0ff",
                brandSecondaryHex: cached.personalization?.brandSecondaryHex || "#06b6d4",
                bannerUrl: cached.personalization?.bannerUrl || DEFAULT_BANNER_URL,
                propertyLogoUrl: cached.personalization?.propertyLogoUrl ?? null,
            };
        }
        return null;
    });

    const fetchProperties = useCallback(async () => {
        const landlordId = profile?.id || user?.id;
        if (!landlordId) return;
        
        const { data } = await supabase
            .from("properties")
            .select("id, name")
            .eq("landlord_id", landlordId);
        
        if (data) setProperties(data);
    }, [profile?.id, user?.id, supabase]);

    // Comprehensive Background Synchronization with Server/DB
    const syncSettingsWithDatabase = useCallback(async (isManualRetry = false) => {
        setIsSyncing(true);
        setSyncError(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const [profileRes, secRes, tourRes, brandRes] = await Promise.all([
                fetch("/api/landlord/profile", { signal: controller.signal }).catch((err) => ({ ok: false, statusText: err.message })),
                fetch("/api/landlord/2fa?action=status", { signal: controller.signal }).catch((err) => ({ ok: false, statusText: err.message })),
                fetch("/api/landlord/tour?start=0", { signal: controller.signal }).catch((err) => ({ ok: false, statusText: err.message })),
                fetch("/api/branding", { cache: "no-store", signal: controller.signal }).catch((err) => ({ ok: false, statusText: err.message })),
            ]);
            clearTimeout(timeoutId);

            let profileData: any = null;
            if ('ok' in profileRes && profileRes.ok) {
                profileData = await (profileRes as Response).json();
            } else if (profile) {
                profileData = { profile };
            } else {
                throw new Error("Unable to sync profile settings with the server.");
            }

            const freshProfile = profileData.profile || profileData;
            const privateProfile = profileData.profile_private || {};
            const businessProfile = profileData.business_profile || {};

            let serverBranding: any = null;
            if ('ok' in brandRes && brandRes.ok) {
                try {
                    serverBranding = await (brandRes as Response).json();
                } catch {
                    // ignore JSON parse error
                }
            }

            const syncedForm = {
                full_name: freshProfile?.full_name || "",
                business_name: freshProfile?.business_name || businessProfile?.business_name || "",
                email: freshProfile?.email || "",
                phone: freshProfile?.phone || "",
                website: freshProfile?.website || businessProfile?.website || "",
                address: freshProfile?.address || businessProfile?.address || "",
                bio: freshProfile?.bio || "",
                emergency_contact_name: freshProfile?.emergency_contact_name || privateProfile?.emergency_contact_name || (freshProfile?.socials as any)?.emergency_contact_name || "",
                emergency_contact_phone: freshProfile?.emergency_contact_phone || privateProfile?.emergency_contact_phone || (freshProfile?.socials as any)?.emergency_contact_phone || "",
                business_permit_number: freshProfile?.business_permit_number || businessProfile?.business_permit_number || "",
                socials: typeof freshProfile?.socials === 'object' && freshProfile?.socials !== null 
                    ? {
                        facebook: (freshProfile.socials as any).facebook || "",
                        instagram: (freshProfile.socials as any).instagram || "",
                        twitter: (freshProfile.socials as any).twitter || "",
                        linkedin: (freshProfile.socials as any).linkedin || "",
                      }
                    : {
                        facebook: "",
                        instagram: "",
                        twitter: "",
                        linkedin: "",
                      },
            };

            const savedNotifs = (freshProfile?.socials as any)?.notification_preferences 
                || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("ireside_landlord_notification_preferences") || "null") : null) 
                || DEFAULT_NOTIFICATION_PREFERENCES;

            const syncedNotifs: NotificationPreferences = {
                lease_applications: { ...DEFAULT_NOTIFICATION_PREFERENCES.lease_applications, ...(savedNotifs?.lease_applications || {}) },
                maintenance: { ...DEFAULT_NOTIFICATION_PREFERENCES.maintenance, ...(savedNotifs?.maintenance || {}) },
                payments: { ...DEFAULT_NOTIFICATION_PREFERENCES.payments, ...(savedNotifs?.payments || {}) },
                messages: { ...DEFAULT_NOTIFICATION_PREFERENCES.messages, ...(savedNotifs?.messages || {}) },
                announcements: { ...DEFAULT_NOTIFICATION_PREFERENCES.announcements, ...(savedNotifs?.announcements || {}) },
            };

            const savedBanner = serverBranding?.bannerUrl || (typeof window !== "undefined" ? (localStorage.getItem("ireside_landlord_custom_banner_url") || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL);
            const savedLogo = serverBranding?.logoUrl ?? (typeof window !== "undefined" ? localStorage.getItem("ireside_property_logo") : null);
            const savedName = serverBranding?.propertyName || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || "Skyline Lofts") : "Skyline Lofts");
            const savedTagline = serverBranding?.propertyTagline || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || "Modern Urban Residences & Studios") : "Modern Urban Residences & Studios");
            const savedArchetype = serverBranding?.rentalArchetype || (typeof window !== "undefined" ? (localStorage.getItem("ireside_rental_archetype") || "apartments") : "apartments");
            const savedPrimary = serverBranding?.primaryColor || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || "#c4b0ff") : "#c4b0ff");
            const savedSecondary = serverBranding?.secondaryColor || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || "#06b6d4") : "#06b6d4");

            if (serverBranding && typeof window !== "undefined") {
                localStorage.setItem("ireside_property_name", savedName);
                localStorage.setItem("ireside_property_tagline", savedTagline);
                localStorage.setItem("ireside_rental_archetype", savedArchetype);
                localStorage.setItem("ireside_brand_primary", savedPrimary);
                localStorage.setItem("ireside_brand_secondary", savedSecondary);
                if (savedLogo) localStorage.setItem("ireside_property_logo", savedLogo);
                if (savedBanner) localStorage.setItem("ireside_landlord_custom_banner_url", savedBanner);
            }

            let syncedSecurity: any = {
                twoFAStatus: 'disabled',
                twoFAEmail: null,
                passwordLastUpdated: null,
                hasChangedPassword: false,
            };

            if ('ok' in secRes && secRes.ok) {
                const secData = await (secRes as Response).json();
                if (secData.enabled) {
                    syncedSecurity.twoFAStatus = 'enabled';
                    syncedSecurity.twoFAEmail = secData.email;
                } else if (secData.hasGmailConnected) {
                    syncedSecurity.twoFAStatus = 'gmail_connected';
                } else {
                    syncedSecurity.twoFAStatus = 'disabled';
                }
                if (secData.passwordLastUpdated) {
                    syncedSecurity.passwordLastUpdated = secData.passwordLastUpdated;
                }
                if (typeof secData.hasChangedPassword === 'boolean') {
                    syncedSecurity.hasChangedPassword = secData.hasChangedPassword;
                }
                setTwoFAStatus(syncedSecurity.twoFAStatus);
                if (syncedSecurity.twoFAEmail) setTwoFAEmail(syncedSecurity.twoFAEmail);
                if (syncedSecurity.passwordLastUpdated) setPasswordLastUpdated(syncedSecurity.passwordLastUpdated);
                setHasChangedPassword(syncedSecurity.hasChangedPassword);
            }

            let syncedTourState = null;
            if ('ok' in tourRes && tourRes.ok) {
                const tourData = await (tourRes as Response).json();
                syncedTourState = tourData.state;
                setTourState(syncedTourState);
            }

            const landlordId = freshProfile?.id || profile?.id || user?.id;
            let syncedProperties: any[] = [];
            if (landlordId) {
                const { data: propData } = await supabase
                    .from("properties")
                    .select("id, name")
                    .eq("landlord_id", landlordId);
                if (propData) {
                    syncedProperties = propData;
                    setProperties(propData);
                }
            }

            // Only overwrite active form inputs if user is not in the middle of editing
            if (!isDirtyRef.current) {
                setFormData(syncedForm);
                setNotificationPreferences(syncedNotifs);
                setBannerUrl(savedBanner);
                setPropertyLogoUrl(savedLogo);
                setPropertyTradeName(savedName);
                setPropertyTagline(savedTagline);
                setRentalArchetype(savedArchetype);
                setBrandPrimaryHex(savedPrimary);
                setBrandSecondaryHex(savedSecondary);

                setInitialSnapshot({
                    formData: JSON.parse(JSON.stringify(syncedForm)),
                    notificationPreferences: JSON.parse(JSON.stringify(syncedNotifs)),
                    propertyTradeName: savedName,
                    propertyTagline: savedTagline,
                    rentalArchetype: savedArchetype,
                    brandPrimaryHex: savedPrimary,
                    brandSecondaryHex: savedSecondary,
                    bannerUrl: savedBanner,
                    propertyLogoUrl: savedLogo,
                });
            }

            // Persist synced data to local cache
            const cachePayload: CachedLandlordSettings = {
                timestamp: Date.now(),
                formData: syncedForm,
                notificationPreferences: syncedNotifs,
                personalization: {
                    propertyTradeName: savedName,
                    propertyTagline: savedTagline,
                    rentalArchetype: savedArchetype,
                    brandPrimaryHex: savedPrimary,
                    brandSecondaryHex: savedSecondary,
                    bannerUrl: savedBanner,
                    propertyLogoUrl: savedLogo,
                },
                security: syncedSecurity,
                properties: syncedProperties,
                tourState: syncedTourState,
            };
            saveCachedSettings(cachePayload, landlordId);

            setLastSyncedAt(new Date());
            setHasLoadedOnce(true);
            if (isManualRetry) {
                toast.success("Settings synced with cloud database!");
            }
        } catch (err: any) {
            console.error("[LandlordSettings] Background sync error:", err);
            setSyncError(err?.message || "Failed to sync settings with the database.");
            if (isManualRetry) {
                toast.error(err?.message || "Failed to sync settings with the database");
            }
        } finally {
            clearTimeout(timeoutId);
            setIsSyncing(false);
            setHasLoadedOnce(true);
        }
    }, [profile, user?.id, supabase]);

    // Background sync on mount & when user identity resolves
    useEffect(() => {
        syncSettingsWithDatabase();
    }, [syncSettingsWithDatabase]);

    const isDirty = useMemo(() => {
        if (!initialSnapshot) return false;
        return (
            JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData) ||
            JSON.stringify(notificationPreferences) !== JSON.stringify(initialSnapshot.notificationPreferences) ||
            propertyTradeName !== initialSnapshot.propertyTradeName ||
            propertyTagline !== initialSnapshot.propertyTagline ||
            rentalArchetype !== initialSnapshot.rentalArchetype ||
            brandPrimaryHex !== initialSnapshot.brandPrimaryHex ||
            brandSecondaryHex !== initialSnapshot.brandSecondaryHex ||
            bannerUrl !== initialSnapshot.bannerUrl ||
            propertyLogoUrl !== initialSnapshot.propertyLogoUrl
        );
    }, [formData, notificationPreferences, propertyTradeName, propertyTagline, rentalArchetype, brandPrimaryHex, brandSecondaryHex, bannerUrl, propertyLogoUrl, initialSnapshot]);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    // Sync brand fields when BrandContext updates from server or realtime broadcast
    useEffect(() => {
        if (!isDirtyRef.current && brand && !brand.isLoading) {
            if (brand.primaryColor) setBrandPrimaryHex(brand.primaryColor);
            if (brand.secondaryColor) setBrandSecondaryHex(brand.secondaryColor);
            if (brand.propertyName) setPropertyTradeName(brand.propertyName);
            if (brand.propertyTagline) setPropertyTagline(brand.propertyTagline);
            if (brand.rentalArchetype) setRentalArchetype(brand.rentalArchetype);
            if (brand.logoUrl !== undefined) setPropertyLogoUrl(brand.logoUrl);
            if (brand.bannerUrl) setBannerUrl(brand.bannerUrl);
        }
    }, [brand.primaryColor, brand.secondaryColor, brand.propertyName, brand.propertyTagline, brand.rentalArchetype, brand.logoUrl, brand.bannerUrl, brand.isLoading]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    const handleRequestExit = () => {
        if (isDirty) {
            setIsUnsavedModalOpen(true);
        } else {
            router.push("/landlord/dashboard");
        }
    };

    const handleDiscardChanges = () => {
        if (!initialSnapshot) return;
        setFormData(JSON.parse(JSON.stringify(initialSnapshot.formData)));
        setNotificationPreferences(JSON.parse(JSON.stringify(initialSnapshot.notificationPreferences)));
        setPropertyTradeName(initialSnapshot.propertyTradeName);
        setPropertyTagline(initialSnapshot.propertyTagline);
        setRentalArchetype(initialSnapshot.rentalArchetype);
        setBrandPrimaryHex(initialSnapshot.brandPrimaryHex);
        setBrandSecondaryHex(initialSnapshot.brandSecondaryHex);
        setBannerUrl(initialSnapshot.bannerUrl);
        setPropertyLogoUrl(initialSnapshot.propertyLogoUrl);
        applyBrandCssVariables(initialSnapshot.brandPrimaryHex, initialSnapshot.brandSecondaryHex);
        toast.info("Unsaved changes discarded");
    };

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
                    if (error) throw error;
                    
                    const { data: { session } } = await supabase.auth.getSession();
                    setSessions(data || []);
                    setCurrentSessionId(session ? (session as any).id : null);
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
        if (activeTab === "Security") {
            const fetchSecurityStatus = async () => {
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

                    if (data.passwordLastUpdated) {
                        setPasswordLastUpdated(data.passwordLastUpdated);
                    }
                    if (typeof data.hasChangedPassword === 'boolean') {
                        setHasChangedPassword(data.hasChangedPassword);
                    }
                } catch (err) {
                    console.error("[Security] Failed to fetch status:", err);
                    setTwoFAStatus('disabled');
                }
            };
            fetchSecurityStatus();
        }
    }, [activeTab, activeSubTab]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) {
            toast.error("Please enter a new password");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return;
        }
        if (confirmNewPassword && newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsUpdatingPassword(true);
        const loadingToast = toast.loading("Updating password...");
        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (authError) {
                throw new Error(authError.message || "Failed to update password");
            }

            const nowIso = new Date().toISOString();

            if (user?.id) {
                await (supabase as any)
                    .from("user_security_settings")
                    .upsert({
                        profile_id: user.id,
                        has_changed_password: true,
                        updated_at: nowIso,
                    }, { onConflict: "profile_id" });

                await supabase
                    .from("profiles")
                    .update({
                        has_changed_password: true,
                        updated_at: nowIso,
                    } as any)
                    .eq("id", user.id);

                await supabase.from("notifications").insert({
                    user_id: user.id,
                    type: "announcement",
                    title: "Password Updated",
                    message: "Your password was successfully changed from your security settings.",
                    read: false,
                    data: {
                        category: "security",
                        action: "password_reset",
                    },
                } as any);
            }

            setPasswordLastUpdated(nowIso);
            setHasChangedPassword(true);
            setNewPassword("");
            setConfirmNewPassword("");
            toast.success("Password updated successfully!", { id: loadingToast });
        } catch (err: any) {
            console.error("[Settings] Password update error:", err);
            toast.error(err.message || "Failed to update password", { id: loadingToast });
        } finally {
            setIsUpdatingPassword(false);
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
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error: any) {
            toast.error(error.message || "Failed to revoke session", { id: loadingToast });
        }
    };

    const handleSignOutOthers = async () => {
        setIsSessionsLoading(true);
        const loadingToast = toast.loading("Signing out other devices...");
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;

            // Broadcast remote invalidation event
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "others" }),
            }).catch(() => null);

            toast.success("Signed out of all other devices successfully", { id: loadingToast });
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) setSessions(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out other devices", { id: loadingToast });
        } finally {
            setIsSessionsLoading(false);
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

    const handleSaveAll = async (): Promise<boolean> => {
        const currentUserId = profile?.id || user?.id;
        if (!currentUserId) {
            toast.error("Please wait for your account session to load before saving.");
            return false;
        }
        setIsSaving(true);
        const loadingToast = toast.loading("Saving all changes across settings…");

        // Failsafe timer so save button can never be trapped in perpetual saving state
        const safetyTimer = setTimeout(() => {
            setIsSaving(false);
            toast.dismiss(loadingToast);
            toast.error("Saving took longer than expected. Changes were saved locally.");
        }, 12000);

        try {
            const hasFormChanged = !initialSnapshot || JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData);
            const hasNotifsChanged = !initialSnapshot || JSON.stringify(notificationPreferences) !== JSON.stringify(initialSnapshot.notificationPreferences);

            if (hasFormChanged || hasNotifsChanged) {
                const res = await fetch("/api/landlord/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        business_name: formData.business_name,
                        email: formData.email,
                        phone: formData.phone,
                        website: formData.website,
                        address: formData.address,
                        bio: formData.bio,
                        emergency_contact_name: formData.emergency_contact_name,
                        emergency_contact_phone: formData.emergency_contact_phone,
                        business_permit_number: formData.business_permit_number,
                        socials: formData.socials,
                        notification_preferences: notificationPreferences,
                    }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to save profile changes");
                }

                if (typeof window !== "undefined") {
                    localStorage.setItem("ireside_landlord_notification_preferences", JSON.stringify(notificationPreferences));
                }

                if (formData.email && formData.email !== profile?.email) {
                    try {
                        await supabase.auth.updateUser({ email: formData.email });
                    } catch (emailErr: any) {
                        console.warn("[LandlordSettings] Auth email update note:", emailErr?.message);
                    }
                }
            }

            // 2. Personalization & Branding (API, LocalStorage & CSS Variables)
            await brand.updateBranding({
                propertyName: propertyTradeName,
                propertyTagline,
                rentalArchetype: (rentalArchetype === "boarding_house" ? "boarding_house" : rentalArchetype === "dormitory" ? "dormitory" : "apartment"),
                primaryColor: brandPrimaryHex,
                secondaryColor: brandSecondaryHex,
                logoUrl: propertyLogoUrl,
                bannerUrl,
            }, true);

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("banner-updated", { detail: bannerUrl }));
            }

            // 3. Await profile refresh so state has fresh data from DB
            try {
                await refreshProfile();
            } catch (pErr) {
                console.warn("[LandlordSettings] Non-critical refreshProfile note:", pErr);
            }

            // 4. Update Snapshot to clear isDirty immediately
            setInitialSnapshot({
                formData: JSON.parse(JSON.stringify(formData)),
                notificationPreferences: JSON.parse(JSON.stringify(notificationPreferences)),
                propertyTradeName,
                propertyTagline,
                rentalArchetype,
                brandPrimaryHex,
                brandSecondaryHex,
                bannerUrl,
                propertyLogoUrl,
            });

            // 5. Update local cache immediately with latest persisted data
            const updatedCache: CachedLandlordSettings = {
                timestamp: Date.now(),
                formData,
                notificationPreferences,
                personalization: {
                    propertyTradeName,
                    propertyTagline,
                    rentalArchetype,
                    brandPrimaryHex,
                    brandSecondaryHex,
                    bannerUrl,
                    propertyLogoUrl,
                },
                security: {
                    twoFAStatus,
                    twoFAEmail,
                    passwordLastUpdated,
                    hasChangedPassword,
                },
                properties,
                tourState,
            };
            saveCachedSettings(updatedCache, currentUserId);
            setLastSyncedAt(new Date());

            clearTimeout(safetyTimer);
            toast.dismiss(loadingToast);
            toast.success("All settings saved successfully!");
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2500);
            return true;
        } catch (error: any) {
            clearTimeout(safetyTimer);
            toast.dismiss(loadingToast);
            toast.error(error?.message || "Failed to save settings");
            return false;
        } finally {
            clearTimeout(safetyTimer);
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
        const currentSubTab = SUB_TABS.Identity.includes(activeSubTab) ? activeSubTab : SUB_TABS.Identity[0];
        const renderSubContent = () => {
            switch (currentSubTab) {
                case "Profile":
                    return (
                        <GlassCard title="Profile Information" description="Basic details about you and your business.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Full Name" icon={User} description="Your legal or preferred display name.">
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="e.g. John Doe"
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Business Name" icon={Building2} description="Registered entity or enterprise business name.">
                                    <input
                                        type="text"
                                        value={formData.business_name}
                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                        placeholder="e.g. Acme Residences LLC"
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Contact Email" icon={Mail} description="Primary contact email used for inquiries and notifications.">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="name@example.com"
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Phone Number" icon={Phone}>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Website" icon={Globe}>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <div className="md:col-span-2">
                                    <SettingField label="Office Address" icon={MapPin}>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                        />
                                    </SettingField>
                                </div>
                                <div className="md:col-span-2">
                                    <SettingField label="Short Bio" icon={FileText} description="Briefly describe your property management style.">
                                        <textarea
                                            rows={4}
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full resize-none rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                        />
                                    </SettingField>
                                </div>
                            </div>
                        </GlassCard>
                    );
                case "Emergency Contact":
                    return (
                        <GlassCard title="Emergency Contact" description="Designated emergency contact person and 24/7 phone number for urgent property escalations and tenant emergencies.">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <SettingField label="Emergency Contact Name" icon={User} description="Designated manager, partner, or emergency kin.">
                                    <input
                                        type="text"
                                        value={formData.emergency_contact_name}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                        placeholder="e.g. Jane Doe (Property Manager)"
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Emergency Contact Phone" icon={Phone} description="Direct phone line reachable 24/7.">
                                    <input
                                        type="tel"
                                        value={formData.emergency_contact_phone}
                                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                        placeholder="e.g. +63 917 123 4567"
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                            </div>
                        </GlassCard>
                    );
                case "Branding":
                    return (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <GlassCard title="Cover Photo" description="A cinematic background for your public page.">
                                <div className="relative h-64 w-full overflow-hidden rounded-[1.5rem] neumorphic-inset">
                                    <ProfileCoverUploader 
                                        initialCoverUrl={profile?.cover_url || null} 
                                        fullName={formData.full_name || profile?.full_name || "Landlord"} 
                                    />
                                </div>
                            </GlassCard>
                            <GlassCard title="Avatar & Identity" description="Your primary identification photo.">
                                <div className="flex flex-col items-center py-4">
                                    <div 
                                        className="group relative flex size-40 items-center justify-center rounded-[3rem] border-4 border-white/10 shadow-2xl transition-transform hover:scale-105"
                                        style={{ backgroundColor: profile?.avatar_bg_color || "#22C55E" }}
                                    >
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt="Avatar" fill sizes="160px" className="rounded-[2.8rem] object-cover" />
                                        ) : (
                                            <span className="text-5xl font-black text-white">
                                                {(formData.full_name || profile?.full_name || "L").charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => setIsAvatarPickerOpen(true)}
                                            className="absolute -bottom-2 -right-2 flex size-12 items-center justify-center rounded-2xl neumorphic-primary transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Camera className="size-6" />
                                        </button>
                                    </div>
                                    <h4 className="mt-6 text-xl font-black text-white">{formData.full_name || profile?.full_name}</h4>
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
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Instagram" icon={Instagram}>
                                    <input
                                        type="url"
                                        placeholder="https://instagram.com/your-profile"
                                        value={formData.socials.instagram}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="Twitter / X" icon={Twitter}>
                                    <input
                                        type="url"
                                        placeholder="https://twitter.com/your-handle"
                                        value={formData.socials.twitter}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                <SettingField label="LinkedIn" icon={Linkedin}>
                                    <input
                                        type="url"
                                        placeholder="https://linkedin.com/in/your-profile"
                                        value={formData.socials.linkedin}
                                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, linkedin: e.target.value } })}
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
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
                                        className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                    />
                                </SettingField>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-neutral-400">Permit Document (Photo)</label>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                        <div className="relative h-48 w-full md:w-80 overflow-hidden rounded-2xl neumorphic-inset border-dashed border-white/10 transition-all hover:opacity-80">
                                            {profile?.business_permit_url ? (
                                                <Image src={profile.business_permit_url} alt="Business Permit" fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
                                            ) : (
                                                <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
                                                    <UploadCloud className="size-8" />
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                        No document uploaded
                                                    </p>
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
                                                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-6 py-3 text-sm font-black text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
                                            >
                                                <UploadCloud className="size-5" /> 
                                                {isUploadingPermit ? "Uploading…" : profile?.business_permit_url ? "Replace Document" : "Upload Document"}
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
                <div>
                    <h2 className="text-3xl font-black text-foreground">Identity</h2>
                    <p className="text-muted-foreground">Control how you appear to others.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Identity} 
                    activeTab={currentSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderPersonalization = () => {
        const currentSubTab = SUB_TABS.Personalization.includes(activeSubTab) ? activeSubTab : SUB_TABS.Personalization[0];
        const renderSubContent = () => {
            switch (currentSubTab) {
                case "Themes & Contrast":
                    return (
                        <div className="space-y-8">
                            <GlassCard title="Visual Theme" description="Choose how iReside renders across all screens.">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleThemeWithTransition("light")}
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                                            resolvedTheme === "light"
                                                ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-foreground"
                                                : "border-border/60 hover:border-border hover:bg-surface-2 text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                                <Sun className="size-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-foreground">Light Mode</div>
                                                <div className="text-xs text-muted-foreground">Clean, high-brightness daylight aesthetic</div>
                                            </div>
                                        </div>
                                        {resolvedTheme === "light" && <Check className="size-5 text-primary" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleThemeWithTransition("dark")}
                                        className={cn(
                                            "flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                                            resolvedTheme === "dark"
                                                ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-foreground"
                                                : "border-border/60 hover:border-border hover:bg-surface-2 text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                                <Moon className="size-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-foreground">Dark Mode</div>
                                                <div className="text-xs text-muted-foreground">Sleek, eye-friendly low-light atmosphere</div>
                                            </div>
                                        </div>
                                        {resolvedTheme === "dark" && <Check className="size-5 text-primary" />}
                                    </button>
                                </div>
                            </GlassCard>

                            <GlassCard 
                                title="Accessibility: High Contrast Mode" 
                                description="Engineered per WCAG 2.1 AAA standards for maximum legibility and visibility."
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-4 rounded-2xl bg-surface-2 border border-border/60">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "size-12 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                            isHighContrast 
                                                ? "bg-foreground text-background border-foreground font-black" 
                                                : "bg-surface-3 text-muted-foreground border-border"
                                        )}>
                                            <Contrast className="size-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-foreground">Universal High Contrast</h4>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                    isHighContrast ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-surface-3 text-muted-foreground"
                                                )}>
                                                    {isHighContrast ? "Active (WCAG AAA)" : "Off"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                                                Replaces all soft neumorphic shadows with crisp 2.5px solid borders, pure black/white contrasts, and reinforced bold text across the landlord & tenant portals.
                                            </p>
                                        </div>
                                    </div>
                                    <ToggleSwitch 
                                        enabled={isHighContrast} 
                                        onToggle={toggleHighContrast} 
                                    />
                                </div>
                            </GlassCard>

                            <GlassCard 
                                title="Accessibility: Text Size & Readability" 
                                description="Adjust interface font scaling for maximum comfort without compromising card structures or layout symmetry."
                            >
                                <FontSizeToggle variant="slider" showPreview={true} />
                            </GlassCard>

                            <GlassCard 
                                title="Brand Accent Colors Studio" 
                                description="Tune the primary and secondary signature tones used in buttons, active states & metrics."
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <SettingField label="Primary Brand Accent" icon={Palette} description="Used for primary buttons, active tabs, and key badges.">
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsPrimaryColorPickerOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl neumorphic-extruded border border-border/80 hover:border-primary/80 transition-all group cursor-pointer shrink-0"
                                                title="Open modern color picker"
                                            >
                                                <span 
                                                    className="size-5 sm:size-6 rounded-lg shadow-sm border border-white/20 shrink-0 transition-transform group-hover:scale-105" 
                                                    style={{ backgroundColor: brandPrimaryHex }} 
                                                />
                                                <span className="font-mono text-xs font-black uppercase text-foreground">
                                                    {brandPrimaryHex}
                                                </span>
                                                <Pipette className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-0.5 sm:ml-1" />
                                            </button>
                                            <input
                                                type="text"
                                                value={brandPrimaryHex}
                                                onChange={(e) => setBrandPrimaryHex(e.target.value)}
                                                placeholder="#C4B0FF"
                                                className="w-24 sm:w-28 uppercase font-mono text-xs font-bold rounded-xl neumorphic-inset px-3 py-2.5 sm:py-3 text-foreground"
                                            />
                                            <div 
                                                className="size-9 sm:size-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center text-xs font-black shrink-0"
                                                style={{ backgroundColor: brandPrimaryHex, color: "#000" }}
                                            >
                                                Aa
                                            </div>
                                        </div>
                                    </SettingField>

                                    <SettingField label="Secondary Ambient Accent" icon={SlidersHorizontal} description="Used for gradients, glowing highlights, and secondary tags.">
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsSecondaryColorPickerOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl neumorphic-extruded border border-border/80 hover:border-primary/80 transition-all group cursor-pointer shrink-0"
                                                title="Open modern color picker"
                                            >
                                                <span 
                                                    className="size-5 sm:size-6 rounded-lg shadow-sm border border-white/20 shrink-0 transition-transform group-hover:scale-105" 
                                                    style={{ backgroundColor: brandSecondaryHex }} 
                                                />
                                                <span className="font-mono text-xs font-black uppercase text-foreground">
                                                    {brandSecondaryHex}
                                                </span>
                                                <Pipette className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-0.5 sm:ml-1" />
                                            </button>
                                            <input
                                                type="text"
                                                value={brandSecondaryHex}
                                                onChange={(e) => setBrandSecondaryHex(e.target.value)}
                                                placeholder="#06B6D4"
                                                className="w-24 sm:w-28 uppercase font-mono text-xs font-bold rounded-xl neumorphic-inset px-3 py-2.5 sm:py-3 text-foreground"
                                            />
                                            <div 
                                                className="size-9 sm:size-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center text-xs font-black text-white shrink-0"
                                                style={{ backgroundColor: brandSecondaryHex }}
                                            >
                                                Aa
                                            </div>
                                        </div>
                                    </SettingField>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2 items-center pt-4 border-t border-border/40">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mr-2">Curated Palettes:</span>
                                    {[
                                        { name: "Royal Lavender", primary: "#c4b0ff", secondary: "#06b6d4" },
                                        { name: "Emerald Oasis", primary: "#10b981", secondary: "#065f46" },
                                        { name: "Amber Sunset", primary: "#f59e0b", secondary: "#ea580c" },
                                        { name: "Electric Indigo", primary: "#6366f1", secondary: "#3b82f6" },
                                        { name: "Ruby Crimson", primary: "#f43f5e", secondary: "#9f1239" },
                                    ].map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => {
                                                setBrandPrimaryHex(preset.primary);
                                                setBrandSecondaryHex(preset.secondary);
                                                applyBrandCssVariables(preset.primary, preset.secondary);
                                                toast.success(`Applied ${preset.name} palette`);
                                            }}
                                            className="px-3 py-1.5 rounded-xl border border-border/60 hover:border-primary/60 bg-surface-2 text-xs font-bold text-foreground flex items-center gap-2 transition-all active:scale-95"
                                        >
                                            <span className="size-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                                            <span>{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    );

                case "Branding & Logo":
                    return (
                        <div className="space-y-8">
                            <GlassCard title="Property Identity" description="Configure how your business is branded on leases, receipts & the tenant portal.">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <SettingField label="Property Trade Name" icon={Building2} description="Appears on dashboard banner, top navbars, and invoice headers.">
                                        <input
                                            type="text"
                                            value={propertyTradeName}
                                            onChange={(e) => setPropertyTradeName(e.target.value)}
                                            placeholder="e.g., Skyline Lofts"
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none font-bold"
                                        />
                                    </SettingField>

                                    <SettingField label="Property Tagline / Subtitle" icon={FileText} description="Displayed below your property name.">
                                        <input
                                            type="text"
                                            value={propertyTagline}
                                            onChange={(e) => setPropertyTagline(e.target.value)}
                                            placeholder="e.g., Modern Urban Residences & Studios"
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none"
                                        />
                                    </SettingField>
                                </div>
                            </GlassCard>

                            <GlassCard title="Property Logo & Monogram" description="Upload a custom logo or customize your dynamic monogram badge.">
                                <div className="flex flex-col md:flex-row items-center gap-8 p-4">
                                    <div className="relative flex size-32 items-center justify-center rounded-[2rem] border-4 border-border/80 neumorphic-extruded overflow-hidden shrink-0 bg-surface-2 shadow-xl">
                                        {propertyLogoUrl ? (
                                            <Image 
                                                src={propertyLogoUrl} 
                                                alt="Property Logo" 
                                                fill 
                                                sizes="128px" 
                                                className="object-cover" 
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-2">
                                                <Building2 className="size-8 text-primary mb-1" />
                                                <span className="text-sm font-black text-foreground uppercase tracking-wider">
                                                    {propertyTradeName ? propertyTradeName.slice(0, 2).toUpperCase() : "SL"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div>
                                            <h4 className="text-base font-black text-foreground">
                                                {propertyLogoUrl ? "Custom Brand Logo Active" : "Dynamic Monogram Badge Active"}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Supports PNG, JPG, SVG or WebP (up to 5MB). Automatically rendered across navigation bars, PDF invoices, and tenant invitation links.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                            <input
                                                ref={logoFileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                                onChange={handleLogoFileUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => logoFileInputRef.current?.click()}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                <Upload className="size-4" />
                                                Upload Logo
                                            </button>

                                            {propertyLogoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
                                                >
                                                    <Trash2 className="size-4" />
                                                    Reset to Monogram
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard title="Rental Business Archetype" description="Adapts terminology and automated billing cadences to match your operation.">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { id: "apartments", label: "Apartment Complex", desc: "Per-unit monthly leases with submeter utilities" },
                                        { id: "dormitory", label: "Student Dormitory", desc: "Per-bed contracts with shared utility billing" },
                                        { id: "boarding", label: "Boarding House", desc: "Flexible short/long-term room lodging" },
                                    ].map((arch) => (
                                        <button
                                            key={arch.id}
                                            type="button"
                                            onClick={() => {
                                                setRentalArchetype(arch.id);
                                                toast.success(`Archetype set to ${arch.label}`);
                                            }}
                                            className={cn(
                                                "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between",
                                                rentalArchetype === arch.id
                                                    ? "border-primary bg-primary/10 ring-2 ring-primary/40 text-foreground"
                                                    : "border-border/60 hover:border-border hover:bg-surface-2 text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-black text-foreground">{arch.label}</span>
                                                {rentalArchetype === arch.id && <Check className="size-4 text-primary" />}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{arch.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>
                    );

                case "Dashboard Banner":
                    return (
                        <div className="space-y-8">
                            <GlassCard title="Active Dashboard Banner Preview" description="This photo serves as the panoramic hero header of your landlord dashboard.">
                                <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-border/80 shadow-2xl group">
                                    <Image
                                        src={bannerUrl}
                                        alt="Banner Preview"
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 800px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                        <div>
                                            <span className="px-2.5 py-1 rounded-lg bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                                                Active Hero Header
                                            </span>
                                            <h3 className="text-xl font-black text-white mt-2 drop-shadow-md">
                                                {propertyTradeName || "Skyline Lofts"}
                                            </h3>
                                            <p className="text-xs text-white/80 font-medium">
                                                {propertyTagline || "Modern Urban Residences & Studios"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleResetBanner}
                                            className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all"
                                        >
                                            <RotateCcw className="size-3.5" />
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard title="Architectural Preset Library" description="Select from 6 hand-curated ultra high-resolution architectural hero photos.">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {CURATED_BANNER_PRESETS.map((preset) => {
                                        const isSelected = bannerUrl === preset.url;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => handleSelectBannerPreset(preset.url)}
                                                className={cn(
                                                    "group relative overflow-hidden rounded-2xl border text-left transition-all duration-300",
                                                    isSelected 
                                                        ? "border-primary ring-2 ring-primary/50 shadow-lg" 
                                                        : "border-border/60 hover:border-border hover:shadow-md"
                                                )}
                                            >
                                                <div className="relative h-28 w-full">
                                                    <Image
                                                        src={preset.url}
                                                        alt={preset.name}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 300px"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                                                            <Check className="size-3.5 stroke-[3]" />
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-2 left-3 right-3">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                            {preset.category}
                                                        </span>
                                                        <h4 className="text-xs font-bold text-white truncate">
                                                            {preset.name}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </GlassCard>

                            <GlassCard title="Custom Photo Upload or URL" description="Provide your property's real exterior or interior photography.">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center gap-3">
                                        <div className="size-12 rounded-2xl bg-surface-2 flex items-center justify-center text-primary border border-border">
                                            <Upload className="size-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-foreground">Upload Photo File</h4>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WebP up to 8MB</p>
                                        </div>
                                        <input
                                            ref={bannerFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => bannerFileInputRef.current?.click()}
                                            className="mt-2 px-5 py-2.5 rounded-xl neumorphic-primary text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                            Browse Device
                                        </button>
                                    </div>

                                    <form onSubmit={handleApplyCustomBannerUrl} className="flex flex-col justify-between p-6 rounded-2xl bg-surface-2 border border-border/60">
                                        <div>
                                            <h4 className="text-sm font-black text-foreground">Direct Image Link</h4>
                                            <p className="text-xs text-muted-foreground mt-1">Paste a public Unsplash, Cloudinary, or CDN URL</p>
                                            <input
                                                type="url"
                                                value={customBannerInput}
                                                onChange={(e) => setCustomBannerInput(e.target.value)}
                                                placeholder="https://images.unsplash.com/..."
                                                className="mt-4 w-full rounded-xl neumorphic-inset px-4 py-3 text-xs font-medium focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="mt-4 w-full py-2.5 rounded-xl neumorphic-extruded hover:text-primary text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                            Apply Image URL
                                        </button>
                                    </form>
                                </div>
                            </GlassCard>
                        </div>
                    );

                default:
                    return null;
            }
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div>
                    <h2 className="text-3xl font-black text-foreground">Personalization</h2>
                    <p className="text-muted-foreground">Customize branding, themes, banner imagery & accessibility.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Personalization} 
                    activeTab={currentSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderFinance = () => {
        const currentSubTab = SUB_TABS.Finance.includes(activeSubTab) ? activeSubTab : SUB_TABS.Finance[0];
        const renderSubContent = () => {
            switch (currentSubTab) {
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
                                            "flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-black transition-all",
                                            activeFinanceTab === tab 
                                                ? "neumorphic-panel text-primary" 
                                                : "neumorphic-extruded opacity-70 hover:opacity-100"
                                        )}
                                        onClick={() => setActiveFinanceTab(tab as any)}
                                    >
                                        {tab === "Water" && <Droplets className="size-4" />}
                                        {tab === "Electricity" && <Zap className="size-4" />}
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
                        <h2 className="text-3xl font-black text-foreground">Finance & Utilities</h2>
                        <p className="text-muted-foreground">Configure how you receive payments and manage utility rates.</p>
                    </div>
                    
                    {/* Property Selector */}
                    {activeSubTab !== "GCash" && (
                        <div className="flex items-center gap-3 rounded-2xl neumorphic-panel p-1">
                            <div className="flex items-center gap-2 px-3 py-1">
                                <Building2 className="size-4 text-primary" />
                                <span className="text-xs font-black text-foreground whitespace-nowrap">Property:</span>
                            </div>
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="bg-transparent text-sm font-black text-foreground outline-none pr-8 py-2 cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                            >
                                <option value="all" className="bg-surface-1 text-foreground">All Properties</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id} className="bg-surface-1 text-foreground">{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <SubNav 
                    tabs={SUB_TABS.Finance} 
                    activeTab={currentSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };



    const renderSecurity = () => {
        const currentSubTab = SUB_TABS.Security.includes(activeSubTab) ? activeSubTab : SUB_TABS.Security[0];
        const renderSubContent = () => {
            switch (currentSubTab) {
                case "Account":
                    return (
                        <GlassCard 
                            title="Change Password" 
                            description="Ensure your account is using a long, random password to stay secure."
                            headerExtra={
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                                    <Clock className="size-3.5 shrink-0 text-primary" />
                                    <span>
                                        Last updated:{" "}
                                        <span className="font-bold text-foreground">
                                            {passwordLastUpdated ? (
                                                <ClientOnlyDate 
                                                    date={passwordLastUpdated} 
                                                    format={{ 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        year: 'numeric' 
                                                    }} 
                                                />
                                            ) : (
                                                "Never"
                                            )}
                                        </span>
                                    </span>
                                </div>
                            }
                        >
                            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-lg">
                                {passwordLastUpdated && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                                                <span>Password last modified</span>
                                            </div>
                                            <span className="font-mono font-medium text-foreground">
                                                <ClientOnlyDate 
                                                    date={passwordLastUpdated} 
                                                    format={{ 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        year: 'numeric', 
                                                        hour: 'numeric', 
                                                        minute: '2-digit' 
                                                    }} 
                                                />
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 text-xs">
                                            <div className="flex items-center gap-2 text-red-500 font-medium">
                                                <AlertTriangle className="size-4 shrink-0" />
                                                <span>Is this not you? Someone may have accessed your account.</span>
                                            </div>
                                            <Link 
                                                href={`/forgot-password?email=${encodeURIComponent(user?.email || profile?.email || "")}`}
                                                className="inline-flex items-center gap-1 font-bold text-red-500 hover:text-red-400 hover:underline transition-colors shrink-0 cursor-pointer"
                                            >
                                                <span>Reset password now &rarr;</span>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <SettingField label="New Password" icon={Key}>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            required
                                            minLength={6}
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 pr-11 text-sm focus:outline-none" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                </SettingField>

                                <SettingField label="Confirm New Password" icon={Key}>
                                    <div className="relative">
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="w-full rounded-xl neumorphic-inset px-4 py-3 pr-11 text-sm focus:outline-none" 
                                        />
                                    </div>
                                </SettingField>

                                <button 
                                    type="submit"
                                    disabled={isUpdatingPassword || !newPassword}
                                    className="w-full rounded-2xl neumorphic-extruded py-3 text-sm font-black transition-all hover:text-primary disabled:opacity-50 cursor-pointer"
                                >
                                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                                </button>
                            </form>
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
                        const loadingToast = toast.loading("Sending OTP…");
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
                        const loadingToast = toast.loading("Verifying OTP…");
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
                        const loadingToast = toast.loading("Disabling 2FA…");
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
                    <div className="absolute size-12 animate-ping rounded-full bg-primary/20"></div>
                    <div className="relative size-12 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
            </div>
        ) : twoFAStatus === 'disabled' ? (
            <div className="space-y-8 max-w-lg">
                <div className="flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.02] transition-all hover:bg-white/[0.04]">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                        <Smartphone className="size-8" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-base font-black text-white">Email OTP Protection</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed">Connect your Gmail account to receive secure one-time passwords for account verification.</p>
                    </div>
                </div>
                <button 
                    onClick={handleConnectGmail}
                    className="group relative w-full overflow-hidden rounded-2xl neumorphic-primary py-4 text-sm font-black transition-all hover:scale-[1.02] active:scale-95"
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
                        <div className="flex size-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="size-3 text-emerald-500" />
                            </div>
                            <span className="text-xs font-black text-neutral-300 uppercase tracking-widest">Google Account Linked</span>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Your Google account is successfully connected. The final step is to verify your identity.
                        </p>
                        <div className="pt-4">
                            <button 
                                onClick={handleSendOTP}
                                className="w-full rounded-2xl neumorphic-primary py-4 text-sm font-black transition-all hover:scale-[1.02] active:scale-95"
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
                        <div className="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                        <span className="text-xs font-black text-neutral-300 uppercase tracking-widest">Verification Required</span>
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
                                className="w-full rounded-2xl neumorphic-inset px-4 py-4 text-2xl tracking-[0.7em] text-center focus:outline-none font-mono transition-all placeholder:opacity-50 placeholder:tracking-normal"
                            />
                        </div>
                        <button 
                            onClick={handleVerifyOTP}
                            disabled={isVerifyingOTP || otpInput.length !== 6}
                            className="w-full rounded-2xl neumorphic-primary py-4 text-sm font-black transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                        >
                            {isVerifyingOTP ? "Verifying…" : "Verify & Enable 2FA"}
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-8 max-w-lg">
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <span className="text-xs font-black text-primary uppercase tracking-widest">2FA Active</span>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400 leading-relaxed">Your account is now protected with high-security email authentication.</p>
                        <div className="flex items-center gap-3 text-sm font-mono rounded-xl neumorphic-panel px-4 py-3 w-fit">
                            <Mail className="size-4 text-primary" />
                            {twoFAEmail?.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                        </div>
                    </div>
                </div>
                <div className="pt-6 border-t border-white/5">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">Disable Protection</h4>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        <p className="text-xs text-neutral-500">To disable two-factor authentication, please provide your current account password.</p>
                        <div className="grid grid-cols-1 gap-3">
                            <input 
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Your password"
                                className="w-full rounded-2xl neumorphic-inset px-4 py-4 text-sm focus:outline-none transition-all"
                            />
                            <button 
                                onClick={handleDisable2FA}
                                disabled={isDisabling || !disablePassword}
                                className="w-full rounded-2xl bg-red-500/10 border border-red-500/20 py-4 text-sm font-black text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {isDisabling ? "Disabling…" : "Disable 2FA"}
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
                        <GlassCard title="Active Sessions" description="Devices and browsers currently logged into your landlord account.">
                            <div className="space-y-4 max-w-xl">
                                {isSessionsLoading && sessions.length === 0 ? (
                                    <div className="text-center py-6 text-xs text-muted-foreground uppercase tracking-widest font-black flex items-center justify-center gap-2">
                                        <RefreshCw className="size-4 animate-spin text-primary" /> Loading active sessions…
                                    </div>
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
                                                "flex items-center justify-between rounded-2xl p-4 transition-all gap-4",
                                                isCurrent 
                                                    ? "neumorphic-inset border border-primary/30" 
                                                    : "neumorphic-panel hover:border-border/80"
                                            )}>
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={cn(
                                                        "flex size-10 items-center justify-center rounded-xl shrink-0",
                                                        isCurrent ? "bg-primary/20 text-primary" : "bg-surface-2 text-muted-foreground"
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
                                                        onClick={() => handleRevokeSession(sess.id)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors shrink-0"
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
                                    <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-border/40">
                                        <button 
                                            onClick={handleSignOutOthers}
                                            disabled={isSessionsLoading}
                                            className="flex items-center gap-2 text-xs font-black text-amber-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                                        >
                                            <LogOut className="size-3.5" /> Sign out all other devices
                                        </button>

                                        <button 
                                            onClick={handleSignOutAll}
                                            disabled={isSessionsLoading}
                                            className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
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
                className="space-y-8"
            >
                <div>
                    <h2 className="text-3xl font-black text-foreground">Security & Login</h2>
                    <p className="text-muted-foreground">Protect your account and manage active sessions.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Security} 
                    activeTab={currentSubTab} 
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
                <h2 className="text-3xl font-black text-foreground">Notifications</h2>
                <p className="text-muted-foreground">Choose how and when you want to be alerted.</p>
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
                            <tr className="border-b border-border/60 bg-surface-2/50">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Activity Type</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground w-32">Email</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground w-32">Push</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {[
                                { key: "lease_applications" as const, label: "New Lease Applications", desc: "When a prospective tenant submits an application." },
                                { key: "maintenance" as const, label: "Maintenance Requests", desc: "Urgent notifications for unit repairs." },
                                { key: "payments" as const, label: "Payment Confirmations", desc: "When rent is successfully received." },
                                { key: "messages" as const, label: "Direct Messages", desc: "Messages from active or prospective tenants." },
                                { key: "announcements" as const, label: "System Announcements", desc: "Product updates and platform news." },
                            ].map((item) => (
                                <tr key={item.key} className="transition-colors hover:bg-surface-2/50">
                                    <td className="px-8 py-6">
                                        <h4 className="text-sm font-black text-foreground">{item.label}</h4>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <div className="flex justify-center">
                                            <ToggleSwitch 
                                                enabled={notificationPreferences[item.key].email} 
                                                onToggle={() => handleToggleNotification(item.key, "email")} 
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <div className="flex justify-center">
                                            <ToggleSwitch 
                                                enabled={notificationPreferences[item.key].push} 
                                                onToggle={() => handleToggleNotification(item.key, "push")} 
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-3 border-t border-border/60 p-6 bg-surface-2/30">
                        <button 
                            type="button"
                            onClick={handleResetNotificationDefaults}
                            className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );

    const renderData = () => {
        const currentSubTab = SUB_TABS.Data.includes(activeSubTab) ? activeSubTab : SUB_TABS.Data[0];
        const renderSubContent = () => {
            switch (currentSubTab) {
                case "Export":
                    return (
                        <GlassCard title="Data Export" description="Download a copy of your records in JSON or CSV format.">
                            <div className="space-y-4 max-w-lg">
                                <p className="text-xs text-muted-foreground">This includes your properties, tenant history, and financial ledgers.</p>
                                <button className="flex items-center gap-2 rounded-2xl neumorphic-extruded px-6 py-3 text-sm font-black transition-all text-foreground hover:text-primary">
                                    <Download className="size-4" /> Request Data Export
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
                                        <h4 className="text-sm font-black text-foreground">Show Completed Quests</h4>
                                        <p className="text-xs text-muted-foreground">Keep the mastery board visible even after completion.</p>
                                    </div>
                                    <ToggleSwitch 
                                        enabled={!!tourState?.metadata?.show_completed_quests} 
                                        onToggle={handleToggleCompletedQuests} 
                                    />
                                </div>
                                
                                <div className="pt-6 border-t border-border/60">
                                    <h4 className="text-sm font-black text-foreground">Hard Reset</h4>
                                    <p className="mt-1 text-xs text-muted-foreground">This will wipe all tour progress and event logs, allowing you to start all quests from zero.</p>
                                    <button 
                                        onClick={handleHardResetTour}
                                        disabled={isResetting}
                                        className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-3 text-sm font-black text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50"
                                    >
                                        <RotateCcw className="size-4" /> 
                                        {isResetting ? "Resetting…" : "Reset All Quests"}
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
                                <button className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 text-sm font-black text-white shadow-xl shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-95">
                                    <Trash2 className="size-4" /> Delete Account
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
                    <h2 className="text-3xl font-black text-foreground">Data & Privacy</h2>
                    <p className="text-muted-foreground">Manage your data and account longevity.</p>
                </div>

                <SubNav 
                    tabs={SUB_TABS.Data} 
                    activeTab={currentSubTab} 
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
            case "Personalization": return renderPersonalization();
            case "Finance": return renderFinance();
            case "Security": return renderSecurity();
            case "Notifications": return renderNotifications();
            case "AuditLogs": return <AuditLogsSettingsTab />;
            case "Data": return renderData();
            default: return null;
        }
    };

    return (
        <div className="space-y-6 sm:space-y-10">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-border/40">
                <button
                    type="button"
                    onClick={handleRequestExit}
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
                        className={cn(
                            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                            isSyncing
                                ? "bg-primary/10 border-primary/20 text-primary animate-pulse"
                                : syncError
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}
                        title={
                            isSyncing
                                ? "Syncing settings with database in the background..."
                                : syncError
                                ? `Sync failed: ${syncError}`
                                : lastSyncedAt
                                ? `Synced with cloud database (Last synced: ${lastSyncedAt.toLocaleTimeString()})`
                                : "Synced with cloud database"
                        }
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw className="size-3.5 animate-spin text-primary" />
                                <span className="hidden sm:inline">Syncing with database…</span>
                                <span className="sm:hidden">Syncing…</span>
                            </>
                        ) : syncError ? (
                            <>
                                <AlertCircle className="size-3.5 text-rose-500" />
                                <span className="hidden sm:inline">Sync Error</span>
                                <span className="sm:hidden">Error</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                <span className="hidden sm:inline">Synced with cloud</span>
                                <span className="sm:hidden">Synced</span>
                            </>
                        )}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/40 border border-border/40 text-xs font-bold text-muted-foreground">
                        <span>Control Center</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-foreground font-black">{activeTab}</span>
                    </div>
                </div>
            </div>

            {/* Sync Error Banner (Shown if background sync fails) */}
            {syncError && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-sm animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0">
                            <AlertCircle className="size-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                                Unable to sync latest settings with the database
                            </h4>
                            <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                                Showing cached data. Background synchronization encountered an error ({syncError}).
                                We recommend refreshing the page or retrying the sync.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                            type="button"
                            onClick={() => syncSettingsWithDatabase(true)}
                            disabled={isSyncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
                            <span>Retry Sync</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Refresh Page</span>
                        </button>
                    </div>
                </div>
            )}

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
                                        "group relative flex transition-all duration-300 text-left cursor-pointer",
                                        isSidebarCollapsed
                                            ? "neumorphic-panel text-primary font-black shadow-md border-primary/30" 
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

                {/* Modern Color Picker Modals */}
                <ColorPickerModal
                    isOpen={isPrimaryColorPickerOpen}
                    onClose={() => setIsPrimaryColorPickerOpen(false)}
                    color={brandPrimaryHex}
                    title="Primary Brand Accent"
                    onChange={(newColor) => {
                        setBrandPrimaryHex(newColor);
                        applyBrandCssVariables(newColor, brandSecondaryHex);
                    }}
                />

                <ColorPickerModal
                    isOpen={isSecondaryColorPickerOpen}
                    onClose={() => setIsSecondaryColorPickerOpen(false)}
                    color={brandSecondaryHex}
                    title="Secondary Ambient Accent"
                    onChange={(newColor) => {
                        setBrandSecondaryHex(newColor);
                        applyBrandCssVariables(brandPrimaryHex, newColor);
                    }}
                />

                {/* Unsaved Changes Exit Protection Modal */}
                <UnsavedChangesModal
                    isOpen={isUnsavedModalOpen}
                    onClose={() => setIsUnsavedModalOpen(false)}
                    isSaving={isSaving}
                    onConfirmDiscard={() => {
                        setIsUnsavedModalOpen(false);
                        router.push("/landlord/dashboard");
                    }}
                    onSaveAndExit={async () => {
                        const success = await handleSaveAll();
                        if (success) {
                            setIsUnsavedModalOpen(false);
                            router.push("/landlord/dashboard");
                        }
                    }}
                />

                {/* Floating Save Action Bar (Appears when changes are pending or recently saved) */}
                <AnimatePresence>
                    {(isDirty || isSaving || justSaved) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 30 }}
                            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3.5 p-2 sm:p-2.5 pl-3 sm:pl-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl shadow-black/25 dark:shadow-primary/10 max-w-[calc(100vw-1.5rem)] ring-1 ring-border/20 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-2.5"
                        >
                            {justSaved && !isDirty && !isSaving ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="size-4 text-emerald-500" />
                                    <span>All Changes Saved</span>
                                </div>
                            ) : (
                                <>
                                    {/* Unsaved status badge */}
                                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[11px] sm:text-xs font-black shrink-0">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="hidden sm:inline">Unsaved Changes</span>
                                        <span className="sm:hidden">Unsaved</span>
                                    </div>

                                    {/* Discard button */}
                                    <button
                                        type="button"
                                        onClick={handleDiscardChanges}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                        title="Discard all pending changes"
                                    >
                                        <RotateCcw className="size-3.5" />
                                        <span className="hidden sm:inline">Discard</span>
                                    </button>

                                    {/* Save All Changes Button */}
                                    <button
                                        type="button"
                                        onClick={handleSaveAll}
                                        disabled={isSaving}
                                        className="flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-md neumorphic-primary text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>Saving…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="size-4" />
                                                <span className="hidden sm:inline">Save All Changes</span>
                                                <span className="sm:hidden">Save</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
