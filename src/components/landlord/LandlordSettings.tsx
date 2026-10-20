"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Bell,
    Building2,
    Camera,
    Check,
    CreditCard,
    Download,
    Droplets,
    FileText,
    HelpCircle,
    History,
    ImageIcon,
    KeyRound,
    Megaphone,
    MessageSquare,
    Palette,
    RotateCcw,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    Type,
    Upload,
    UploadCloud,
    User,
    Wallet,
    Wrench,
    Zap,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BillingOperationsPanel } from "@/components/landlord/BillingOperationsPanel";
import { AuditLogsSettingsTab } from "@/components/landlord/settings/AuditLogsSettingsTab";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { signOut } from "@/lib/supabase/client-auth";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useLanguageContext } from "@/context/LanguageContext";
import { CURATED_BANNER_PRESETS, DEFAULT_BANNER_URL } from "@/components/landlord/dashboard/BannerCustomizerModal";
import { resolveBannerUrl } from "@/lib/art/abstract-art";
import { ColorPickerModal } from "@/components/ui/ColorPickerModal";
import { useBrand, DEFAULT_BRANDING } from "@/context/BrandContext";
import { applyBrandCssVariables } from "@/lib/branding/colors";
import { SecurityKeyManagementCard } from "@/components/auth/SecurityKeyManagementCard";
import { TwoFactorManagementCard } from "@/components/auth/TwoFactorManagementCard";
import {
    validateFullName,
    validateBusinessName,
    validateEmail,
    validatePhoneNumber,
    validateWebsiteUrl,
    validateAddress,
    validateBio,
    validateBusinessPermitNumber,
    validateSocialHandleOrUrl,
    validateHexColor,
    validatePropertyTradeName,
    validatePropertyTagline,
    evaluatePasswordStrength,
    validatePasswordPair,
    validateAllLandlordSettings,
    REGEX_NAME,
} from "@/lib/validation/landlord-settings";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation";
import { DISALLOWED_PRESEEDED_DATA, isPreseededPhone } from "@/lib/validation/brand-setup";
import { tr } from "@/hooks/useLanguage";
import { PhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { isPhMobileEmpty } from "@/lib/phone";
import {
    SettingsButton,
    SettingsCard,
    SettingsChoiceGroup,
    SettingsField,
    SettingsHub,
    SettingsLeaveDialog,
    SettingsLinkRow,
    SettingsNotice,
    SettingsPasswordInput,
    SettingsSaveBar,
    SettingsSectionLayout,
    SettingsSwitchRow,
    settingsButtonClass,
    settingsInputClass,
    useSettingsNavigation,
    type SettingsGroupDef,
    type SettingsQuickTask,
    type SettingsSectionDef,
} from "@/components/settings/settings-ui";
import {
    CloseAccountCard,
    DisplaySettingsSection,
    NotificationTopicsList,
    SignedInDevicesCard,
} from "@/components/settings/settings-shared-sections";

export function normalizeRentalArchetype(val?: string | null): "apartment" | "dormitory" | "boarding_house" {
    if (!val) return "apartment";
    const lower = val.toLowerCase().trim();
    if (lower === "dormitory" || lower === "dorm") return "dormitory";
    if (lower === "boarding" || lower === "boarding_house") return "boarding_house";
    return "apartment";
}

// --- Pages ---

const SECTION_IDS = [
    "profile",
    "security",
    "business",
    "branding",
    "payments",
    "utilities",
    "display",
    "notifications",
    "activity",
    "help",
    "data",
] as const;
type SectionId = (typeof SECTION_IDS)[number];

type PendingNavigation = { kind: "section"; id: SectionId | null } | { kind: "url"; href: string } | { kind: "back" };

/** Old links used ?category=...&subtab=...; keep them working (dashboard search, docs, 2FA callback). */
function resolveLegacyLink(category: string, subtab: string | null): SectionId | null {
    switch (category) {
        case "Identity":
            return subtab === "Socials" || subtab === "Business Permit" ? "business" : "profile";
        case "Personalization":
            return subtab === "Themes & Contrast" ? "display" : "branding";
        case "Finance":
            return subtab === "Utilities" ? "utilities" : "payments";
        case "Security":
            return "security";
        case "Notifications":
            return "notifications";
        case "AuditLogs":
            return "activity";
        case "Data":
            return subtab === "Tour" ? "help" : "data";
        default:
            return null;
    }
}

/** Which page each validated field lives on, so a failed save can take people straight to it. */
const FIELD_SECTIONS: Record<string, SectionId> = {
    full_name: "profile",
    email: "profile",
    phone: "profile",
    address: "profile",
    bio: "profile",
    emergency_contact_name: "profile",
    emergency_contact_phone: "profile",
    business_name: "business",
    website: "business",
    business_permit_number: "business",
    socials_facebook: "business",
    socials_instagram: "business",
    socials_twitter: "business",
    socials_linkedin: "business",
    propertyTradeName: "branding",
    propertyTagline: "branding",
    brandPrimaryHex: "branding",
    brandSecondaryHex: "branding",
};

const fieldId = (name: string) => `landlord-setting-${name.replace(/_/g, "-")}`;

const COLOR_PALETTES = [
    { name: "Royal Lavender", primary: "#c4b0ff", secondary: "#8b5cf6" },
    { name: "Emerald Oasis", primary: "#10b981", secondary: "#065f46" },
    { name: "Amber Sunset", primary: "#f59e0b", secondary: "#ea580c" },
    { name: "Electric Indigo", primary: "#6366f1", secondary: "#3b82f6" },
    { name: "Ruby Crimson", primary: "#f43f5e", secondary: "#9f1239" },
];

// --- Types ---

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
        rentalArchetype?: string | null;
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
export function LandlordSettings({ embedded = false }: { embedded?: boolean } = {}) {
    const router = useRouter();
    const { user, profile, loading, refreshProfile } = useAuth();
    const { t, locale } = useLanguageContext();
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const supabase = useMemo(() => createClient(), []);


    // Sync & Cache States
    const [isSyncing, setIsSyncing] = useState(true);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
        const cached = getCachedSettings();
        return cached?.timestamp ? new Date(cached.timestamp) : null;
    });
    const [hasLoadedOnce, setHasLoadedOnce] = useState(() => !!getCachedSettings());

    useEffect(() => {
        if (!loading && profile && profile.role !== "landlord" && profile.role !== "admin") {
            router.replace("/tenant/dashboard");
        }
    }, [loading, profile, router]);

    // Scoped Data Export State
    type ExportCategory = "financials" | "properties" | "rent_roll";
    type ExportRange = "ytd" | "12m" | "all";
    type ExportFormat = "csv" | "json";

    const [exportCategory, setExportCategory] = useState<ExportCategory>("financials");
    const [exportRange, setExportRange] = useState<ExportRange>("ytd");
    const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
    const [isExporting, setIsExporting] = useState(false);

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const queryParams = new URLSearchParams({
                category: exportCategory,
                range: exportRange,
            });
            const res = await fetch(`/api/landlord/export?${queryParams.toString()}`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || t("Failed to generate export"));
            }
            const result = await res.json();
            const records: Record<string, unknown>[] = result.data || [];
            const filename = result.filename || `iReside_Export_${new Date().toISOString().split("T")[0]}`;

            if (records.length === 0) {
                toast.info(t("No records found for the selected export criteria."));
                return;
            }

            if (exportFormat === "json") {
                const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${filename}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(t("Exported {count} records as JSON!", { count: records.length }));
            } else {
                const headers = Object.keys(records[0]);
                const escapeCSV = (val: unknown) => {
                    const str = String(val ?? "");
                    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

                const rows = records.map((row) =>
                    headers.map((h) => escapeCSV(row[h])).join(",")
                );

                // Prefix with UTF-8 BOM (\uFEFF) so Excel displays currency and UTF-8 characters properly
                const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${filename}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(t("Exported {count} records to CSV!", { count: records.length }));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t("Failed to export data.");
            console.error("Export error:", err);
            toast.error(tr(message));
        } finally {
            setIsExporting(false);
        }
    };

    const brand = useBrand();

    // Personalization & Branding State
    const [bannerUrl, setBannerUrl] = useState<string>(() => {
        const cached = getCachedSettings();
        return resolveBannerUrl(cached?.personalization?.bannerUrl) || (typeof window !== "undefined" ? (resolveBannerUrl(localStorage.getItem("ireside_landlord_custom_banner_url")) || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL);
    });

    const [propertyTradeName, setPropertyTradeName] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyTradeName || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || brand.propertyName || DEFAULT_BRANDING.propertyName) : (brand.propertyName || DEFAULT_BRANDING.propertyName));
    });
    const [propertyTagline, setPropertyTagline] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyTagline || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || brand.propertyTagline || DEFAULT_BRANDING.propertyTagline) : (brand.propertyTagline || DEFAULT_BRANDING.propertyTagline));
    });
    const [propertyLogoUrl, setPropertyLogoUrl] = useState<string | null>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.propertyLogoUrl ?? (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_logo") || brand.logoUrl || null) : (brand.logoUrl || null));
    });
    const [brandPrimaryHex, setBrandPrimaryHex] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.brandPrimaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || brand.primaryColor || DEFAULT_BRANDING.primaryColor) : (brand.primaryColor || DEFAULT_BRANDING.primaryColor));
    });
    const [brandSecondaryHex, setBrandSecondaryHex] = useState<string>(() => {
        const cached = getCachedSettings();
        return cached?.personalization?.brandSecondaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || brand.secondaryColor || DEFAULT_BRANDING.secondaryColor) : (brand.secondaryColor || DEFAULT_BRANDING.secondaryColor));
    });
    const [isPrimaryColorPickerOpen, setIsPrimaryColorPickerOpen] = useState(false);
    const [isSecondaryColorPickerOpen, setIsSecondaryColorPickerOpen] = useState(false);
    const [hasUserEdited, setHasUserEdited] = useState(false);
    const [isFinanceDirty, setIsFinanceDirty] = useState(false);
    const financeSaveRef = useRef<(() => Promise<boolean>) | null>(null);
    const financeDiscardRef = useRef<(() => void) | null>(null);

    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const bannerFileInputRef = useRef<HTMLInputElement>(null);

    const handleSelectBannerPreset = (presetUrl: string) => {
        setHasUserEdited(true);
        setBannerUrl(presetUrl);
        toast.info(t("Banner preview updated. Save all changes to apply permanently."));
    };

    const handleResetBanner = () => {
        setHasUserEdited(true);
        setBannerUrl(DEFAULT_BANNER_URL);
        toast.info(t("Banner reset to default preview. Save all changes to apply permanently."));
    };



    const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = handleMediaSelection(e, {
            preset: "image",
            maxSizeBytes: 8 * 1024 * 1024,
            notify: (message, description) => toast.error(tr(message), { description }),
        });
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setHasUserEdited(true);
                setBannerUrl(dataUrl);
                toast.info(t("Banner preview uploaded. Save all changes to apply permanently."));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = handleMediaSelection(e, {
            preset: "branding_logo",
            maxSizeBytes: 5 * 1024 * 1024,
            notify: (message, description) => toast.error(tr(message), { description }),
        });
        if (!file) return;

        // 1. Instant local preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setHasUserEdited(true);
                setPropertyLogoUrl(dataUrl);
            }
        };
        reader.readAsDataURL(file);

        // 2. Upload to Supabase Storage in cloud
        const uploadToast = toast.loading(t("Uploading logo to cloud storage..."));
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
                    setHasUserEdited(true);
                    setPropertyLogoUrl(data.logoUrl);
                    toast.dismiss(uploadToast);
                    toast.success(t("Logo uploaded to cloud! Save changes to apply across all devices."));
                    return;
                }
            } else if (res.status === 400) {
                // The server rejected the file itself (content/type/size): don't keep a local preview of it.
                const data = await res.json().catch(() => ({}));
                setPropertyLogoUrl(initialSnapshot?.propertyLogoUrl ?? null);
                toast.dismiss(uploadToast);
                toast.error(tr(data.error || t("This logo file could not be uploaded.")));
                return;
            }
            toast.dismiss(uploadToast);
            toast.info(t("Logo preview updated locally. Save all changes to apply."));
        } catch {
            toast.dismiss(uploadToast);
            toast.info(t("Logo preview updated. Save all changes to apply."));
        }
    };

    const handleRemoveLogo = () => {
        setHasUserEdited(true);
        setPropertyLogoUrl(null);
        toast.info(t("Logo removed in preview. Save all changes to apply permanently."));
    };

    const [formData, setFormData] = useState(() => {
        const cached = getCachedSettings();
        const storedPropName = typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || "") : "";
        const whiteLabelFallback = (
            (storedPropName.trim() && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(storedPropName.toLowerCase().trim()) && storedPropName.trim()) ||
            (brand.propertyName?.trim() && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(brand.propertyName.toLowerCase().trim()) && brand.propertyName.trim()) ||
            ""
        );

        if (cached?.formData) {
            const cachedEmail = (cached.formData.email || "").toLowerCase().trim();
            const isDisallowed = !cachedEmail || 
                DISALLOWED_PRESEEDED_DATA.emails.includes(cachedEmail) || 
                cachedEmail.includes("turnkey.local");
            const cachedPhone = cached.formData.phone || "";
            const isPhoneDisallowed = isPreseededPhone(cachedPhone);
            const rawCachedBiz = (cached.formData.business_name || "").trim();
            const isCachedBizDisallowed = !rawCachedBiz || DISALLOWED_PRESEEDED_DATA.propertyNames.includes(rawCachedBiz.toLowerCase());

            return {
                ...cached.formData,
                business_name: !isCachedBizDisallowed ? rawCachedBiz : whiteLabelFallback,
                email: isDisallowed ? "" : cached.formData.email,
                phone: isPhoneDisallowed ? "" : cachedPhone,
            };
        }
        return {
            full_name: "",
            business_name: whiteLabelFallback,
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

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    const setFieldError = useCallback((field: string, error?: string) => {
        setFieldErrors((prev) => {
            if (!error && !prev[field]) return prev;
            const next = { ...prev };
            if (error) next[field] = error;
            else delete next[field];
            return next;
        });
    }, []);

    const markFieldTouched = useCallback((field: string) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    }, []);

    const updateFormData = useCallback((patch: Partial<typeof formData>) => {
        setHasUserEdited(true);
        setFormData((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleToggleNotification = (category: NotificationCategoryKey, channel: "email" | "push") => {
        setHasUserEdited(true);
        setNotificationPreferences((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [channel]: !prev[category][channel],
            },
        }));
    };

    const handleResetNotificationDefaults = () => {
        setHasUserEdited(true);
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        toast.info(t("Notification preferences reset to defaults. Save changes to apply."));
    };

    const [initialSnapshot, setInitialSnapshot] = useState<{
        formData: typeof formData;
        notificationPreferences: NotificationPreferences;
        propertyTradeName: string;
        propertyTagline: string;
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
                propertyTradeName: cached.personalization?.propertyTradeName || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || brand.propertyName || DEFAULT_BRANDING.propertyName) : DEFAULT_BRANDING.propertyName),
                propertyTagline: cached.personalization?.propertyTagline || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || brand.propertyTagline || DEFAULT_BRANDING.propertyTagline) : DEFAULT_BRANDING.propertyTagline),
                brandPrimaryHex: cached.personalization?.brandPrimaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || brand.primaryColor || DEFAULT_BRANDING.primaryColor) : DEFAULT_BRANDING.primaryColor),
                brandSecondaryHex: cached.personalization?.brandSecondaryHex || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || brand.secondaryColor || DEFAULT_BRANDING.secondaryColor) : DEFAULT_BRANDING.secondaryColor),
                bannerUrl: resolveBannerUrl(cached.personalization?.bannerUrl) || (typeof window !== "undefined" ? (resolveBannerUrl(localStorage.getItem("ireside_landlord_custom_banner_url")) || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL),
                propertyLogoUrl: cached.personalization?.propertyLogoUrl ?? (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_logo") || brand.logoUrl || null) : (brand.logoUrl || null)),
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
                throw new Error(t("Unable to sync profile settings with the server."));
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

            const rawFreshEmail = (freshProfile?.email || "").toLowerCase().trim();
            const rawUserEmail = (user?.email || "").toLowerCase().trim();
            const isFreshEmailDisallowed = !rawFreshEmail || 
                DISALLOWED_PRESEEDED_DATA.emails.includes(rawFreshEmail) || 
                rawFreshEmail.includes("turnkey.local");
            const isUserEmailDisallowed = !rawUserEmail || 
                DISALLOWED_PRESEEDED_DATA.emails.includes(rawUserEmail) || 
                rawUserEmail.includes("turnkey.local");

            let resolvedEmail = "";
            if (!isFreshEmailDisallowed) {
                resolvedEmail = freshProfile?.email || "";
            } else if (!isUserEmailDisallowed) {
                resolvedEmail = user?.email || "";
            } else {
                resolvedEmail = freshProfile?.email || user?.email || "";
            }

            const rawProfileBiz = (freshProfile?.business_name || businessProfile?.business_name || "").trim();
            const isProfileBizDisallowed = !rawProfileBiz || DISALLOWED_PRESEEDED_DATA.propertyNames.includes(rawProfileBiz.toLowerCase());

            const whiteLabelCandidates = [
                serverBranding?.propertyName,
                typeof window !== "undefined" ? localStorage.getItem("ireside_property_name") : null,
                brand.propertyName,
                propertyTradeName,
            ];
            const resolvedWhiteLabel = whiteLabelCandidates.find(
                (c) => c && typeof c === "string" && c.trim() && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(c.toLowerCase().trim())
            )?.trim() || "";

            const resolvedBizName = !isProfileBizDisallowed ? rawProfileBiz : resolvedWhiteLabel;

            const syncedForm = {
                full_name: freshProfile?.full_name || "",
                business_name: resolvedBizName,
                email: resolvedEmail,
                phone: isPreseededPhone(freshProfile?.phone) ? "" : (freshProfile?.phone || ""),
                website: freshProfile?.website || businessProfile?.website || "",
                address: freshProfile?.address || businessProfile?.address || "",
                bio: freshProfile?.bio || "",
                emergency_contact_name: freshProfile?.emergency_contact_name || privateProfile?.emergency_contact_name || (freshProfile?.socials as any)?.emergency_contact_name || "",
                emergency_contact_phone: isPreseededPhone(freshProfile?.emergency_contact_phone || privateProfile?.emergency_contact_phone || (freshProfile?.socials as any)?.emergency_contact_phone)
                    ? ""
                    : (freshProfile?.emergency_contact_phone || privateProfile?.emergency_contact_phone || (freshProfile?.socials as any)?.emergency_contact_phone || ""),
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

            const savedBanner = resolveBannerUrl(serverBranding?.bannerUrl) || (typeof window !== "undefined" ? (resolveBannerUrl(localStorage.getItem("ireside_landlord_custom_banner_url")) || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL);
            const savedLogo = serverBranding?.logoUrl ?? (typeof window !== "undefined" ? localStorage.getItem("ireside_property_logo") : null);
            const savedName = serverBranding?.propertyName || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || DEFAULT_BRANDING.propertyName) : DEFAULT_BRANDING.propertyName);
            const savedTagline = serverBranding?.propertyTagline || (typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || DEFAULT_BRANDING.propertyTagline) : DEFAULT_BRANDING.propertyTagline);
            const savedArchetype = normalizeRentalArchetype(serverBranding?.rentalArchetype || (typeof window !== "undefined" ? (localStorage.getItem("ireside_rental_archetype") || DEFAULT_BRANDING.rentalArchetype) : DEFAULT_BRANDING.rentalArchetype));
            const savedPrimary = serverBranding?.primaryColor || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || DEFAULT_BRANDING.primaryColor) : DEFAULT_BRANDING.primaryColor);
            const savedSecondary = serverBranding?.secondaryColor || (typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || DEFAULT_BRANDING.secondaryColor) : DEFAULT_BRANDING.secondaryColor);

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
            if (!hasUserEdited) {
                setFormData(syncedForm);
                setNotificationPreferences(syncedNotifs);
                setBannerUrl(savedBanner);
                setPropertyLogoUrl(savedLogo);
                setPropertyTradeName(savedName);
                setPropertyTagline(savedTagline);
                setBrandPrimaryHex(savedPrimary);
                setBrandSecondaryHex(savedSecondary);

                setInitialSnapshot({
                    formData: JSON.parse(JSON.stringify(syncedForm)),
                    notificationPreferences: JSON.parse(JSON.stringify(syncedNotifs)),
                    propertyTradeName: savedName,
                    propertyTagline: savedTagline,
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
                toast.success(t("Settings synced with cloud database!"));
            }
        } catch (err: any) {
            console.error("[LandlordSettings] Background sync error:", err);
            setSyncError(tr(err?.message || t("Failed to sync settings with the database.")));
            if (isManualRetry) {
                toast.error(tr(err?.message || t("Failed to sync settings with the database")));
            }
        } finally {
            clearTimeout(timeoutId);
            setIsSyncing(false);
            setHasLoadedOnce(true);
        }
    }, [profile?.id, user?.id, supabase]);

    // Background sync on mount & when user identity resolves
    useEffect(() => {
        syncSettingsWithDatabase();
    }, [syncSettingsWithDatabase]);

    // Reconcile pre-seeded placeholder emails and phone numbers with authenticated identity
    useEffect(() => {
        if (!user?.email) return;
        const currentEmail = (formData.email || "").toLowerCase().trim();
        const userEmail = user.email.toLowerCase().trim();
        const isCurrentDisallowed = !currentEmail || 
            DISALLOWED_PRESEEDED_DATA.emails.includes(currentEmail) || 
            currentEmail.includes("turnkey.local");
        const isUserValid = !DISALLOWED_PRESEEDED_DATA.emails.includes(userEmail) && !userEmail.includes("turnkey.local");
        if (isCurrentDisallowed && isUserValid) {
            setFormData(prev => ({ ...prev, email: user.email! }));
        }
        if (formData.phone && isPreseededPhone(formData.phone)) {
            setFormData(prev => ({ ...prev, phone: "" }));
        }
        if (formData.emergency_contact_phone && isPreseededPhone(formData.emergency_contact_phone)) {
            setFormData(prev => ({ ...prev, emergency_contact_phone: "" }));
        }
    }, [user?.email, formData.email, formData.phone, formData.emergency_contact_phone]);

    const isDirty = useMemo(() => {
        if (isFinanceDirty) return true;
        if (!hasUserEdited || !initialSnapshot) return false;
        return (
            JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData) ||
            JSON.stringify(notificationPreferences) !== JSON.stringify(initialSnapshot.notificationPreferences) ||
            propertyTradeName !== initialSnapshot.propertyTradeName ||
            propertyTagline !== initialSnapshot.propertyTagline ||
            brandPrimaryHex.toLowerCase() !== initialSnapshot.brandPrimaryHex.toLowerCase() ||
            brandSecondaryHex.toLowerCase() !== initialSnapshot.brandSecondaryHex.toLowerCase() ||
            bannerUrl !== initialSnapshot.bannerUrl ||
            propertyLogoUrl !== initialSnapshot.propertyLogoUrl
        );
    }, [isFinanceDirty, hasUserEdited, formData, notificationPreferences, propertyTradeName, propertyTagline, brandPrimaryHex, brandSecondaryHex, bannerUrl, propertyLogoUrl, initialSnapshot]);

    const isDirtyRef = useRef(false);
    isDirtyRef.current = isDirty;

    // Page navigation (URL-backed). Leaving a page with unsaved changes asks first, including
    // leaving Settings with the browser Back button.
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
    const { section, ready: isNavReady, open: openSection, leave: leaveSettings } = useSettingsNavigation<SectionId>({
        sectionIds: SECTION_IDS,
        resolveLegacy: resolveLegacyLink,
        shouldBlock: () => isDirtyRef.current,
        onBlocked: (target) => setPendingNavigation({ kind: "section", id: target }),
        isDirty,
        onLeaveBlocked: () => setPendingNavigation({ kind: "back" }),
    });

    // Sync brand fields when BrandContext updates from server or realtime broadcast
    useEffect(() => {
        if (!hasUserEdited && brand && !brand.isLoading) {
            const nextPrimary = brand.primaryColor || DEFAULT_BRANDING.primaryColor;
            const nextSecondary = brand.secondaryColor || DEFAULT_BRANDING.secondaryColor;
            const nextName = brand.propertyName || DEFAULT_BRANDING.propertyName;
            const nextTagline = brand.propertyTagline || DEFAULT_BRANDING.propertyTagline;
            const nextLogo = brand.logoUrl !== undefined ? brand.logoUrl : null;
            const nextBanner = brand.bannerUrl || DEFAULT_BANNER_URL;

            setBrandPrimaryHex(nextPrimary);
            setBrandSecondaryHex(nextSecondary);
            setPropertyTradeName(nextName);
            setPropertyTagline(nextTagline);
            if (brand.logoUrl !== undefined) setPropertyLogoUrl(nextLogo);
            if (brand.bannerUrl) setBannerUrl(nextBanner);

            // Keep business_name populated from white labeling if currently empty or disallowed
            if (nextName && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(nextName.toLowerCase().trim())) {
                setFormData((prev) => {
                    const currentBiz = (prev.business_name || "").trim();
                    if (!currentBiz || DISALLOWED_PRESEEDED_DATA.propertyNames.includes(currentBiz.toLowerCase())) {
                        return { ...prev, business_name: nextName };
                    }
                    return prev;
                });
            }

            setInitialSnapshot((prev) => prev ? {
                ...prev,
                brandPrimaryHex: nextPrimary,
                brandSecondaryHex: nextSecondary,
                propertyTradeName: nextName,
                propertyTagline: nextTagline,
                propertyLogoUrl: nextLogo,
                bannerUrl: nextBanner,
            } : null);
        }
    }, [brand.primaryColor, brand.secondaryColor, brand.propertyName, brand.propertyTagline, brand.logoUrl, brand.bannerUrl, brand.isLoading, hasUserEdited]);

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

    // Intercept client-side link navigation when there are unsaved changes
    useEffect(() => {
        const handleClickCapture = (e: MouseEvent) => {
            if (!isDirtyRef.current) return;
            const target = (e.target as HTMLElement)?.closest("a");
            if (!target) return;
            const href = target.getAttribute("href");
            if (href && !href.startsWith("#") && !href.startsWith("javascript:") && href !== window.location.pathname) {
                e.preventDefault();
                e.stopPropagation();
                setPendingNavigation({ kind: "url", href });
            }
        };

        document.addEventListener("click", handleClickCapture, true);
        return () => document.removeEventListener("click", handleClickCapture, true);
    }, []);

    const goToDashboard = () => {
        if (isDirtyRef.current) setPendingNavigation({ kind: "url", href: "/landlord/dashboard" });
        else router.push("/landlord/dashboard");
    };

    const handleDiscardChanges = () => {
        if (isFinanceDirty && financeDiscardRef.current) {
            financeDiscardRef.current();
            setIsFinanceDirty(false);
        }
        if (!initialSnapshot) return;
        setFormData(JSON.parse(JSON.stringify(initialSnapshot.formData)));
        setNotificationPreferences(JSON.parse(JSON.stringify(initialSnapshot.notificationPreferences)));
        setPropertyTradeName(initialSnapshot.propertyTradeName);
        setPropertyTagline(initialSnapshot.propertyTagline);
        setBrandPrimaryHex(initialSnapshot.brandPrimaryHex);
        setBrandSecondaryHex(initialSnapshot.brandSecondaryHex);
        setBannerUrl(initialSnapshot.bannerUrl);
        setPropertyLogoUrl(initialSnapshot.propertyLogoUrl);
        applyBrandCssVariables(initialSnapshot.brandPrimaryHex, initialSnapshot.brandSecondaryHex);
        setHasUserEdited(false);
        toast.info(t("Unsaved changes discarded"));
    };

    const [isUploadingPermit, setIsUploadingPermit] = useState(false);
    const permitInputRef = useRef<HTMLInputElement>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [activeFinanceTab, setActiveFinanceTab] = useState<"GCash" | "Water" | "Electricity">("GCash");

    const [sessions, setSessions] = useState<any[]>([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    useEffect(() => {
        if (section === "security") {
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
    }, [section, supabase]);

    // Handle OAuth callback params on mount (independent of tab state)
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const gmailConnected = searchParams.get("gmail_connected");
        const error = searchParams.get("error");
        const autoSendOtp = searchParams.get("auto_send_otp") === "true";

        if (gmailConnected === "true") {
            toast.success(t("Google account connected! Sending OTP..."));

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
                            toast.error(tr(data.error));
                        } else {
                            setTwoFAStatus('pending_otp');
                            toast.success(t("OTP sent to {email}", { email: data.email }));
                        }
                    } catch (err) {
                        toast.error(t("Failed to send OTP"));
                    }
                };
                sendOtpAsync();
            }

            window.history.replaceState(window.history.state, "", window.location.pathname + "?section=security");
        }

        if (error) {
            const errorMessages: Record<string, string> = {
                oauth_failed: "Google OAuth failed. Please try again.",
                missing_code: "Authorization code missing.",
                token_exchange_failed: "Failed to exchange token.",
                save_failed: "Failed to save credentials.",
                callback_failed: "Something went wrong.",
            };
            toast.error(t(errorMessages[error] || "An error occurred."));
            window.history.replaceState(window.history.state, "", window.location.pathname + "?section=security");
        }
    }, []);

    useEffect(() => {
        if (section === "security") {
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
    }, [section]);

    const passwordContext = {
        name: formData.full_name || profile?.full_name,
        email: user?.email || profile?.email,
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        markFieldTouched("newPassword");
        markFieldTouched("confirmNewPassword");
        const pairCheck = validatePasswordPair(newPassword, confirmNewPassword, passwordContext);
        if (!pairCheck.isValid) {
            setFieldError("newPassword", pairCheck.newPasswordError);
            setFieldError("confirmNewPassword", pairCheck.confirmPasswordError);
            if (pairCheck.newPasswordError) toast.error(tr(pairCheck.newPasswordError));
            else if (pairCheck.confirmPasswordError) toast.error(tr(pairCheck.confirmPasswordError));
            return;
        }

        setIsUpdatingPassword(true);
        const loadingToast = toast.loading(t("Updating password..."));
        try {
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (authError) {
                throw new Error(authError.message || t("Failed to update password"));
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
            setFieldError("newPassword", undefined);
            setFieldError("confirmNewPassword", undefined);
            toast.success(t("Password updated successfully!"), { id: loadingToast });
        } catch (err: any) {
            console.error("[Settings] Password update error:", err);
            toast.error(tr(err.message || t("Failed to update password")), { id: loadingToast });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        const loadingToast = toast.loading(t("Revoking session..."));
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t("Failed to revoke session"));
            
            toast.success(t("Session revoked successfully"), { id: loadingToast });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to revoke session")), { id: loadingToast });
        }
    };

    const handleSignOutOthers = async () => {
        setIsSessionsLoading(true);
        const loadingToast = toast.loading(t("Signing out other devices..."));
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;

            // Broadcast remote invalidation event
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "others" }),
            }).catch(() => null);

            toast.success(t("Signed out of all other devices successfully"), { id: loadingToast });
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) setSessions(data);
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to sign out other devices")), { id: loadingToast });
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleSignOutAll = async () => {
        const loadingToast = toast.loading(t("Signing out everywhere..."));
        try {
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "global" }),
            }).catch(() => null);

            await signOut({ scope: "global" });
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to sign out globally")), { id: loadingToast });
        }
    };

    const handleSaveAll = async (): Promise<boolean> => {
        const currentUserId = profile?.id || user?.id;
        if (!currentUserId) {
            toast.error(t("Please wait for your account session to load before saving."));
            return false;
        }

        // 0. Comprehensive Client-side Input Validation
        const validation = validateAllLandlordSettings(formData, {
            propertyTradeName,
            propertyTagline,
            brandPrimaryHex,
            brandSecondaryHex,
        });

        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            const touchedUpdates = Object.keys(validation.errors).reduce((acc, key) => {
                acc[key] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setTouchedFields((prev) => ({ ...prev, ...touchedUpdates }));

            const firstField = validation.firstErrorTab?.fieldName ?? Object.keys(validation.errors)[0];
            const targetSection = firstField ? FIELD_SECTIONS[firstField] : undefined;
            if (targetSection) {
                openSection(targetSection, { force: true, anchor: fieldId(firstField) });
                const pageTitle = sections.find((s) => s.id === targetSection)?.title ?? "";
                toast.error(t("Some details need fixing on the \"{page}\" page. Look for the red messages.", { page: pageTitle }));
            } else {
                toast.error(t("Some details need fixing. Look for the red messages."));
            }
                        return false;
        }

        setIsSaving(true);
        const loadingToast = toast.loading(t("Saving your changes…"));

        // Failsafe timer so save button can never be trapped in perpetual saving state
        const safetyTimer = setTimeout(() => {
            setIsSaving(false);
            toast.dismiss(loadingToast);
            toast.error(t("Saving took longer than expected. Changes were saved locally."));
        }, 25000);

        try {
            // 0. Save finance changes if dirty
            if (isFinanceDirty && financeSaveRef.current) {
                const financeSuccess = await financeSaveRef.current();
                if (!financeSuccess) {
                    clearTimeout(safetyTimer);
                    setIsSaving(false);
                    toast.dismiss(loadingToast);
                    return false;
                }
                setIsFinanceDirty(false);
            }

            const hasProfileChanged = Boolean(
                initialSnapshot &&
                JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData)
            );
            const hasNotifsChanged = Boolean(
                initialSnapshot &&
                JSON.stringify(notificationPreferences) !== JSON.stringify(initialSnapshot.notificationPreferences)
            );
            const hasBrandingChanged = Boolean(
                !initialSnapshot ||
                propertyTradeName !== initialSnapshot.propertyTradeName ||
                propertyTagline !== initialSnapshot.propertyTagline ||
                brandPrimaryHex.toLowerCase() !== initialSnapshot.brandPrimaryHex.toLowerCase() ||
                brandSecondaryHex.toLowerCase() !== initialSnapshot.brandSecondaryHex.toLowerCase() ||
                bannerUrl !== initialSnapshot.bannerUrl ||
                propertyLogoUrl !== initialSnapshot.propertyLogoUrl
            );

            // 1. Save Profile & Contact changes only if profile or notifications actually changed
            if (hasProfileChanged || hasNotifsChanged) {
                const res = await fetch("/api/landlord/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        business_name: formData.business_name || (!DISALLOWED_PRESEEDED_DATA.propertyNames.includes((propertyTradeName || "").toLowerCase().trim()) ? propertyTradeName : "") || brand.propertyName || "",
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
                    // Attach server-side field errors to the matching inputs
                    // (API paths use "socials.facebook"; the form uses "socials_facebook").
                    if (data.fieldErrors && typeof data.fieldErrors === "object") {
                        for (const [path, message] of Object.entries(data.fieldErrors as Record<string, string>)) {
                            setFieldError(path.replace(/^socials\./, "socials_"), message);
                        }
                    }
                    throw new Error(data.error || t("Failed to save profile changes"));
                }

                if (typeof window !== "undefined") {
                    localStorage.setItem("ireside_landlord_notification_preferences", JSON.stringify(notificationPreferences));
                }

                if (hasProfileChanged && formData.email && profile?.email && formData.email !== profile.email) {
                    try {
                        await supabase.auth.updateUser({ email: formData.email });
                    } catch (emailErr: any) {
                        console.warn("[LandlordSettings] Auth email update note:", emailErr?.message);
                    }
                }
            }

            // 2. Personalization & Branding (API, LocalStorage & CSS Variables)
            if (hasBrandingChanged) {
                const brandSuccess = await brand.updateBranding({
                    propertyName: propertyTradeName,
                    propertyTagline,
                    rentalArchetype: brand.rentalArchetype,
                    primaryColor: brandPrimaryHex,
                    secondaryColor: brandSecondaryHex,
                    logoUrl: propertyLogoUrl,
                    bannerUrl,
                }, true);

                if (!brandSuccess) {
                    console.warn("[LandlordSettings] Branding saved locally, server sync reported warning.");
                }
            }

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("banner-updated", { detail: bannerUrl }));
            }

            // 3. Non-blocking profile refresh if profile fields were touched
            if (hasProfileChanged) {
                refreshProfile().catch((pErr) => {
                    console.warn("[LandlordSettings] Non-critical refreshProfile note:", pErr);
                });
            }

            // 4. Update Snapshot to clear isDirty immediately
            setInitialSnapshot({
                formData: JSON.parse(JSON.stringify(formData)),
                notificationPreferences: JSON.parse(JSON.stringify(notificationPreferences)),
                propertyTradeName,
                propertyTagline,
                brandPrimaryHex,
                brandSecondaryHex,
                bannerUrl,
                propertyLogoUrl,
            });
            setHasUserEdited(false);

            // 5. Update local cache immediately with latest persisted data
            const updatedCache: CachedLandlordSettings = {
                timestamp: Date.now(),
                formData,
                notificationPreferences,
                personalization: {
                    propertyTradeName,
                    propertyTagline,
                    rentalArchetype: brand.rentalArchetype,
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
            toast.success(t("Your changes are saved."));
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2500);
            return true;
        } catch (error: any) {
            clearTimeout(safetyTimer);
            toast.dismiss(loadingToast);
            toast.error(tr(error?.message || t("Failed to save settings")));
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
        const file = handleMediaSelection(e, {
            preset: "image",
            notify: (message, description) => toast.error(tr(message), { description }),
        });
        if (!file) return;

        setIsUploadingPermit(true);
        const loadingToast = toast.loading(t("Uploading permit..."));

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/profile/permit", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t("Failed to upload permit"));
            }

            toast.success(t("Permit uploaded successfully"), { id: loadingToast });
            await refreshProfile();
        } catch (error: any) {
            toast.error(tr(error.message), { id: loadingToast });
        } finally {
            setIsUploadingPermit(false);
            if (permitInputRef.current) permitInputRef.current.value = "";
        }
    };

    const handlePermitRemove = async () => {
        if (!confirm(t("Are you sure you want to remove your uploaded business permit?"))) return;
        
        setIsUploadingPermit(true);
        const loadingToast = toast.loading(t("Removing permit..."));

        try {
            const response = await fetch("/api/profile/permit", {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || t("Failed to remove permit"));
            }

            toast.success(t("Business permit removed successfully"), { id: loadingToast });
            await refreshProfile();
            window.dispatchEvent(new CustomEvent("profile-updated"));
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to remove permit")), { id: loadingToast });
        } finally {
            setIsUploadingPermit(false);
        }
    };


    const handleHardResetTour = async () => {
        if (!confirm(t("Are you sure you want to reset all tour progress? This cannot be undone."))) return;
        
        setIsResetting(true);
        const loadingToast = toast.loading(t("Resetting tour progress..."));

        try {
            const response = await fetch("/api/landlord/tour", {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || t("Failed to reset tour"));
            }

            toast.success(t("Tour progress has been completely reset"), { id: loadingToast });
            await refreshProfile();
        } catch (error: any) {
            toast.error(tr(error.message), { id: loadingToast });
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
                toast.success(nextValue ? t("Quests will now remain visible") : t("Completed quests will be hidden"));
                await fetchTourState();
            }
        } catch (err) {
            toast.error(t("Failed to update preferences"));
        }
    };

    // ------------------------------------------------------------------
    // Page definitions
    // ------------------------------------------------------------------

    const groups: SettingsGroupDef[] = [
        { id: "account", title: t("Your account") },
        { id: "business", title: t("Your business") },
        { id: "comfort", title: t("Your screen and alerts") },
        { id: "records", title: t("Records and help") },
    ];

    const sections: SettingsSectionDef<SectionId>[] = [
        { id: "profile", group: "account", icon: User, title: t("My profile"), description: t("Your name, photo, contact details and emergency contact.") },
        { id: "security", group: "account", icon: KeyRound, title: t("Password and sign-in"), description: t("Change your password, add extra protection, and see where you are signed in.") },
        { id: "business", group: "business", icon: Building2, title: t("Business details"), description: t("Business name, website, business permit and social media.") },
        { id: "branding", group: "business", icon: Palette, title: t("Logo, colors and banner"), description: t("How your business looks to tenants: name, logo, colors and dashboard picture.") },
        { id: "payments", group: "business", icon: Wallet, title: t("Payment methods"), description: t("Your GCash and bank account, where tenants send rent and deposits.") },
        { id: "utilities", group: "business", icon: Zap, title: t("Water and electricity rates"), description: t("How much you charge tenants for water and electricity.") },
        { id: "display", group: "comfort", icon: Type, title: t("Text size and display"), description: t("Make the words bigger, change the language, use a dark screen, and more.") },
        { id: "notifications", group: "comfort", icon: Bell, title: t("Notifications"), description: t("Choose which alerts you get, by email or in the app.") },
        { id: "activity", group: "records", icon: History, title: t("Activity history"), description: t("A record of important changes made in your account.") },
        { id: "help", group: "records", icon: HelpCircle, title: t("Help and lessons"), description: t("Open the help guide and manage the step-by-step lessons.") },
        { id: "data", group: "records", icon: ShieldCheck, title: t("My records and account"), description: t("Download your records, or ask to close your account.") },
    ];

    const quickTasks: SettingsQuickTask<SectionId>[] = [
        { label: t("Make the text bigger"), section: "display", icon: Type, anchor: "settings-text-size" },
        { label: t("Change my password"), section: "security", icon: KeyRound, anchor: "settings-password" },
        { label: t("Set up how tenants pay you"), section: "payments", icon: Wallet },
        { label: t("Change water or electricity rates"), section: "utilities", icon: Zap },
    ];

    // ------------------------------------------------------------------
    // Field helpers
    // ------------------------------------------------------------------

    type TextFieldName =
        | "full_name"
        | "business_name"
        | "email"
        | "phone"
        | "website"
        | "address"
        | "bio"
        | "emergency_contact_name"
        | "emergency_contact_phone"
        | "business_permit_number";

    const validateTextField = (name: TextFieldName, value: string): string | undefined => {
        switch (name) {
            case "full_name": return validateFullName(value).error;
            case "business_name": return validateBusinessName(value).error;
            case "email": return validateEmail(value).error;
            case "phone": return validatePhoneNumber(value).error;
            case "website": return validateWebsiteUrl(value).error;
            case "address": return validateAddress(value).error;
            case "bio": return validateBio(value).error;
            case "business_permit_number": return validateBusinessPermitNumber(value).error;
            case "emergency_contact_name":
                if (value && value.trim().length < 2) return "Emergency contact name must be at least 2 characters.";
                if (value && !REGEX_NAME.test(value.trim())) return "Name can only contain letters, spaces, hyphens, and periods.";
                return undefined;
            case "emergency_contact_phone": {
                const phoneError = validatePhoneNumber(value).error;
                if (phoneError) return phoneError;
                if (formData.emergency_contact_name.trim() && isPhMobileEmpty(value)) return "Please also type their mobile number, or clear their name.";
                return undefined;
            }
        }
    };

    const errorFor = (name: string) => (fieldErrors[name] ? t(fieldErrors[name]) : undefined);

    const describedBy = (id: string, hasHelp: boolean, hasError: boolean) =>
        [hasHelp ? `${id}-help` : null, hasError ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

    /** Props for an input bound to a top-level profile field. */
    const bindText = (name: TextFieldName, hasHelp = false) => {
        const id = fieldId(name);
        const error = errorFor(name);
        return {
            id,
            value: formData[name],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                updateFormData({ [name]: e.target.value } as Partial<typeof formData>);
                if (touchedFields[name] || fieldErrors[name]) setFieldError(name, validateTextField(name, e.target.value));
            },
            onBlur: () => {
                markFieldTouched(name);
                setFieldError(name, validateTextField(name, formData[name]));
            },
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy(id, hasHelp, Boolean(error)),
            className: settingsInputClass(Boolean(error)),
        };
    };

    /** Phone fields use the shared +63 input, which reports the number instead of an event. */
    const bindPhone = (name: "phone" | "emergency_contact_phone", hasHelp = false) => {
        const { onChange: _textOnChange, ...rest } = bindText(name, hasHelp);
        return {
            ...rest,
            onValueChange: (next: string) => {
                updateFormData({ [name]: next } as Partial<typeof formData>);
                if (touchedFields[name] || fieldErrors[name]) setFieldError(name, validateTextField(name, next));
            },
        };
    };

    type SocialKey = "facebook" | "instagram" | "twitter" | "linkedin";
    const bindSocial = (key: SocialKey) => {
        const name = `socials_${key}`;
        const id = fieldId(name);
        const error = errorFor(name);
        return {
            id,
            value: formData.socials[key],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setHasUserEdited(true);
                const value = e.target.value;
                setFormData((prev) => ({ ...prev, socials: { ...prev.socials, [key]: value } }));
                if (touchedFields[name] || fieldErrors[name]) setFieldError(name, validateSocialHandleOrUrl(key, value).error);
            },
            onBlur: () => {
                markFieldTouched(name);
                setFieldError(name, validateSocialHandleOrUrl(key, formData.socials[key]).error);
            },
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy(id, true, Boolean(error)),
            className: settingsInputClass(Boolean(error)),
        };
    };

    const setBrandColors = (primary: string, secondary: string) => {
        setHasUserEdited(true);
        setBrandPrimaryHex(primary);
        setBrandSecondaryHex(secondary);
        setFieldError("brandPrimaryHex", undefined);
        setFieldError("brandSecondaryHex", undefined);
        applyBrandCssVariables(primary, secondary);
    };

    const bindHex = (which: "primary" | "secondary") => {
        const name = which === "primary" ? "brandPrimaryHex" : "brandSecondaryHex";
        const value = which === "primary" ? brandPrimaryHex : brandSecondaryHex;
        const setValue = which === "primary" ? setBrandPrimaryHex : setBrandSecondaryHex;
        const id = fieldId(name);
        const error = errorFor(name);
        const apply = (hex: string) =>
            which === "primary" ? applyBrandCssVariables(hex, brandSecondaryHex) : applyBrandCssVariables(brandPrimaryHex, hex);
        return {
            id,
            value,
            maxLength: 7,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                setHasUserEdited(true);
                setValue(e.target.value);
                const check = validateHexColor(e.target.value);
                if (touchedFields[name] || fieldErrors[name]) setFieldError(name, check.error);
                if (check.isValid) apply(check.formatted);
            },
            onBlur: () => {
                markFieldTouched(name);
                const check = validateHexColor(value);
                if (!check.isValid) {
                    setFieldError(name, check.error);
                } else {
                    setValue(check.formatted);
                    setFieldError(name, undefined);
                    apply(check.formatted);
                }
            },
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy(id, false, Boolean(error)),
            className: settingsInputClass(Boolean(error), "w-40 font-mono uppercase"),
        };
    };

    // ------------------------------------------------------------------
    // Pages
    // ------------------------------------------------------------------

    const renderProfile = () => {
        const displayName = formData.full_name || profile?.full_name || t("Landlord");
        return (
            <>
                <SettingsCard id="settings-photo" title={t("Your photo")} description={t("Tenants see this photo next to your name.")}>
                    <div className="flex flex-col items-center gap-5 sm:flex-row">
                        <div
                            className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground/15"
                            style={{ backgroundColor: profile?.avatar_bg_color || "#22C55E" }}
                        >
                            {profile?.avatar_url ? (
                                <Image src={profile.avatar_url} alt={t("Your photo")} fill sizes="112px" className="object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-white" aria-hidden>
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="space-y-3 text-center sm:text-left">
                            <p className="text-xl font-bold text-foreground">{displayName}</p>
                            <SettingsButton variant="secondary" icon={Camera} onClick={() => setIsAvatarPickerOpen(true)}>
                                {t("Change my photo")}
                            </SettingsButton>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-about-you" title={t("About you")} description={t("Press Save changes at the bottom of the screen when you are done.")}>
                    <div className="space-y-6">
                        <SettingsField label={t("Full name")} htmlFor={fieldId("full_name")} error={errorFor("full_name")}>
                            <input type="text" autoComplete="name" maxLength={70} {...bindText("full_name")} />
                        </SettingsField>
                        <SettingsField
                            label={t("Email address")}
                            htmlFor={fieldId("email")}
                            help={t("We send important messages to this email.")}
                            error={errorFor("email")}
                        >
                            <input type="email" autoComplete="email" maxLength={254} {...bindText("email", true)} />
                        </SettingsField>
                        <SettingsField
                            label={t("Phone number")}
                            htmlFor={fieldId("phone")}
                            optional
                            help={t("A mobile number. Example: +63 917 123 4567")}
                            error={errorFor("phone")}
                        >
                            <PhoneNumberInput {...bindPhone("phone", true)} />
                        </SettingsField>
                        <SettingsField label={t("Office address")} htmlFor={fieldId("address")} optional error={errorFor("address")}>
                            <input type="text" autoComplete="street-address" maxLength={250} {...bindText("address")} />
                        </SettingsField>
                        <SettingsField
                            label={t("A few words about you")}
                            htmlFor={fieldId("bio")}
                            optional
                            help={t("Tell tenants about your place and how you manage it.")}
                            counter={{ current: formData.bio?.length || 0, max: 500 }}
                            error={errorFor("bio")}
                        >
                            <textarea rows={4} maxLength={500} {...bindText("bio", true)} className={settingsInputClass(Boolean(errorFor("bio")), "resize-y")} />
                        </SettingsField>
                    </div>
                </SettingsCard>

                <SettingsCard
                    id="settings-emergency"
                    title={t("Emergency contact")}
                    description={t("A person tenants can call in an emergency if they cannot reach you. For example, a caretaker or family member.")}
                >
                    <div className="space-y-6">
                        <SettingsField label={t("Their name")} htmlFor={fieldId("emergency_contact_name")} optional error={errorFor("emergency_contact_name")}>
                            <input type="text" maxLength={70} {...bindText("emergency_contact_name")} />
                        </SettingsField>
                        <SettingsField
                            label={t("Their mobile number")}
                            htmlFor={fieldId("emergency_contact_phone")}
                            optional={!formData.emergency_contact_name.trim()}
                            help={t("A number that can be reached any time.")}
                            error={errorFor("emergency_contact_phone")}
                        >
                            <PhoneNumberInput {...bindPhone("emergency_contact_phone", true)} autoComplete="off" />
                        </SettingsField>
                    </div>
                </SettingsCard>
            </>
        );
    };

    const renderBusiness = () => {
        const whiteLabelName = (propertyTradeName || brand.propertyName || "").trim();
        const hasWhiteLabel = Boolean(whiteLabelName && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(whiteLabelName.toLowerCase()));
        const canUseWhiteLabel = hasWhiteLabel && formData.business_name.trim() !== whiteLabelName;

        return (
            <>
                <SettingsCard id="settings-business-name" title={t("Business name and website")} description={t("Press Save changes at the bottom of the screen when you are done.")}>
                    <div className="space-y-6">
                        <SettingsField
                            label={t("Business name")}
                            htmlFor={fieldId("business_name")}
                            optional
                            help={t("The registered name of your business, if you have one.")}
                            error={errorFor("business_name")}
                        >
                            <input type="text" maxLength={100} {...bindText("business_name", true)} />
                            {canUseWhiteLabel && (
                                <SettingsButton
                                    variant="ghost"
                                    className="mt-2"
                                    onClick={() => {
                                        updateFormData({ business_name: whiteLabelName });
                                        setFieldError("business_name", undefined);
                                    }}
                                >
                                    {t("Use my property name: {name}", { name: whiteLabelName })}
                                </SettingsButton>
                            )}
                        </SettingsField>
                        <SettingsField
                            label={t("Website")}
                            htmlFor={fieldId("website")}
                            optional
                            help={t("Example: https://myresidence.ph")}
                            error={errorFor("website")}
                        >
                            <input type="url" inputMode="url" maxLength={255} {...bindText("website", true)} />
                        </SettingsField>
                    </div>
                </SettingsCard>

                <SettingsCard
                    id="settings-permit"
                    title={t("Business permit (optional)")}
                    description={t("Adding your permit helps tenants trust you. You can skip this.")}
                >
                    <div className="space-y-6">
                        <SettingsField
                            label={t("Permit number")}
                            htmlFor={fieldId("business_permit_number")}
                            optional
                            help={t("Example: BP-2026-VAL-09124")}
                            error={errorFor("business_permit_number")}
                        >
                            <input type="text" maxLength={50} {...bindText("business_permit_number", true)} />
                        </SettingsField>

                        <div className="space-y-3">
                            <p className="text-lg font-bold text-foreground">
                                {t("Photo of your permit")} <span className="text-base font-semibold text-muted-foreground">({t("optional")})</span>
                            </p>
                            <div className="flex flex-col gap-5 md:flex-row md:items-center">
                                <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-foreground/25 bg-muted/40 md:w-72">
                                    {profile?.business_permit_url ? (
                                        <Image src={profile.business_permit_url} alt={t("Your business permit")} fill sizes="(max-width: 768px) 100vw, 288px" className="object-cover" />
                                    ) : (
                                        <span className="flex flex-col items-center gap-2 text-base text-muted-foreground">
                                            <UploadCloud className="size-8" aria-hidden />
                                            {t("No photo added yet")}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-base text-muted-foreground">{t("Take a clear photo of the permit. JPG or PNG, up to 15 MB. This uploads right away.")}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <SettingsButton variant="secondary" icon={UploadCloud} loading={isUploadingPermit} onClick={() => permitInputRef.current?.click()}>
                                            {profile?.business_permit_url ? t("Replace the photo") : t("Add a photo")}
                                        </SettingsButton>
                                        {profile?.business_permit_url && (
                                            <SettingsButton variant="ghost" icon={Trash2} disabled={isUploadingPermit} onClick={handlePermitRemove} className="text-rose-700 dark:text-rose-400">
                                                {t("Remove the photo")}
                                            </SettingsButton>
                                        )}
                                    </div>
                                    <input ref={permitInputRef} type="file" accept={MEDIA_ACCEPT_STRINGS.image} className="hidden" onChange={handlePermitUpload} aria-hidden tabIndex={-1} />
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-socials" title={t("Social media (optional)")} description={t("Links to your pages so tenants can learn more about you. Leave blank if you do not use them.")}>
                    <div className="space-y-6">
                        <SettingsField label="Facebook" htmlFor={fieldId("socials_facebook")} optional help={t("Your page link or name, for example facebook.com/mypage")} error={errorFor("socials_facebook")}>
                            <input type="text" maxLength={120} {...bindSocial("facebook")} />
                        </SettingsField>
                        <SettingsField label="Instagram" htmlFor={fieldId("socials_instagram")} optional help={t("Your profile link or @name")} error={errorFor("socials_instagram")}>
                            <input type="text" maxLength={120} {...bindSocial("instagram")} />
                        </SettingsField>
                        <SettingsField label="X (Twitter)" htmlFor={fieldId("socials_twitter")} optional help={t("Your profile link or @name")} error={errorFor("socials_twitter")}>
                            <input type="text" maxLength={120} {...bindSocial("twitter")} />
                        </SettingsField>
                        <SettingsField label="LinkedIn" htmlFor={fieldId("socials_linkedin")} optional help={t("Your profile link or user name")} error={errorFor("socials_linkedin")}>
                            <input type="text" maxLength={120} {...bindSocial("linkedin")} />
                        </SettingsField>
                    </div>
                </SettingsCard>
            </>
        );
    };

    const renderBranding = () => {
        const matchingPalette = COLOR_PALETTES.find(
            (p) => p.primary.toLowerCase() === brandPrimaryHex.toLowerCase() && p.secondary.toLowerCase() === brandSecondaryHex.toLowerCase(),
        );
        const tradeNameError = errorFor("propertyTradeName");
        const taglineError = errorFor("propertyTagline");

        return (
            <>
                <SettingsNotice tone="info">
                    {t("You will see changes on this page right away. Press Save changes at the bottom to keep them.")}
                </SettingsNotice>

                <SettingsCard id="settings-property-name" title={t("Your property name")} description={t("Shown at the top of the tenant app, on receipts and on invitations.")}>
                    <div className="space-y-6">
                        <SettingsField label={t("Property name")} htmlFor={fieldId("propertyTradeName")} help={t("Example: Skyline Lofts")} error={tradeNameError}>
                            <input
                                id={fieldId("propertyTradeName")}
                                type="text"
                                maxLength={80}
                                value={propertyTradeName}
                                aria-invalid={tradeNameError ? true : undefined}
                                aria-describedby={describedBy(fieldId("propertyTradeName"), true, Boolean(tradeNameError))}
                                onBlur={() => {
                                    markFieldTouched("propertyTradeName");
                                    setFieldError("propertyTradeName", validatePropertyTradeName(propertyTradeName).error);
                                }}
                                onChange={(e) => {
                                    setHasUserEdited(true);
                                    const newTradeName = e.target.value;
                                    const previousTradeName = propertyTradeName;
                                    setPropertyTradeName(newTradeName);
                                    if (touchedFields.propertyTradeName || fieldErrors.propertyTradeName) {
                                        setFieldError("propertyTradeName", validatePropertyTradeName(newTradeName).error);
                                    }
                                    // Keep the business name in step if it was empty, preseeded or matched the old name.
                                    setFormData((prev) => {
                                        const currentBiz = (prev.business_name || "").trim();
                                        if (!currentBiz || DISALLOWED_PRESEEDED_DATA.propertyNames.includes(currentBiz.toLowerCase()) || currentBiz === previousTradeName.trim()) {
                                            return { ...prev, business_name: newTradeName };
                                        }
                                        return prev;
                                    });
                                }}
                                className={settingsInputClass(Boolean(tradeNameError))}
                            />
                        </SettingsField>
                        <SettingsField
                            label={t("Short tagline")}
                            htmlFor={fieldId("propertyTagline")}
                            optional
                            help={t("A short line under the name. Example: Modern studios near the university")}
                            counter={{ current: propertyTagline?.length || 0, max: 120 }}
                            error={taglineError}
                        >
                            <input
                                id={fieldId("propertyTagline")}
                                type="text"
                                maxLength={120}
                                value={propertyTagline}
                                aria-invalid={taglineError ? true : undefined}
                                aria-describedby={describedBy(fieldId("propertyTagline"), true, Boolean(taglineError))}
                                onBlur={() => {
                                    markFieldTouched("propertyTagline");
                                    setFieldError("propertyTagline", validatePropertyTagline(propertyTagline).error);
                                }}
                                onChange={(e) => {
                                    setHasUserEdited(true);
                                    setPropertyTagline(e.target.value);
                                    if (touchedFields.propertyTagline || fieldErrors.propertyTagline) {
                                        setFieldError("propertyTagline", validatePropertyTagline(e.target.value).error);
                                    }
                                }}
                                className={settingsInputClass(Boolean(taglineError))}
                            />
                        </SettingsField>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-logo" title={t("Your logo")} description={t("Shown in menus, on receipts and on tenant invitations. If you have no logo, we show the first letters of your property name.")}>
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                        <div className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-foreground/15 bg-muted">
                            {propertyLogoUrl ? (
                                <Image src={propertyLogoUrl} alt={t("Your logo")} fill sizes="128px" className="object-cover" />
                            ) : (
                                <span className="text-3xl font-black text-foreground" aria-hidden>
                                    {propertyTradeName ? propertyTradeName.slice(0, 2).toUpperCase() : "IR"}
                                </span>
                            )}
                        </div>
                        <div className="space-y-4 text-center sm:text-left">
                            <p className="text-base text-muted-foreground">{t("PNG, JPG, SVG or WebP, up to 5 MB.")}</p>
                            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                                <SettingsButton variant="secondary" icon={Upload} onClick={() => logoFileInputRef.current?.click()}>
                                    {propertyLogoUrl ? t("Choose a different logo") : t("Add my logo")}
                                </SettingsButton>
                                {propertyLogoUrl && (
                                    <SettingsButton variant="ghost" icon={Trash2} onClick={handleRemoveLogo} className="text-rose-700 dark:text-rose-400">
                                        {t("Remove logo")}
                                    </SettingsButton>
                                )}
                            </div>
                            <input ref={logoFileInputRef} type="file" accept={MEDIA_ACCEPT_STRINGS.branding_logo} onChange={handleLogoFileUpload} className="hidden" aria-hidden tabIndex={-1} />
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-colors" title={t("Colors")} description={t("Pick a color set for buttons and highlights. The whole app changes color so you can see it.")}>
                    <div className="space-y-8">
                        <SettingsChoiceGroup
                            legend={t("Color sets")}
                            hideLegend
                            value={matchingPalette?.name ?? "custom"}
                            onChange={(name) => {
                                const palette = COLOR_PALETTES.find((p) => p.name === name);
                                if (palette) setBrandColors(palette.primary, palette.secondary);
                            }}
                            options={[
                                // When the colors were picked by hand, show them first so people can see what is active.
                                ...(matchingPalette ? [] : [{ name: "custom", label: t("Your current colors"), primary: brandPrimaryHex, secondary: brandSecondaryHex }]),
                                ...COLOR_PALETTES.map((palette) => ({ ...palette, label: t(palette.name) })),
                            ].map((palette) => ({
                                value: palette.name,
                                label: palette.label,
                                preview: (
                                    <span className="flex gap-2" aria-hidden>
                                        <span className="h-8 w-14 rounded-lg border-2 border-foreground/15" style={{ backgroundColor: palette.primary }} />
                                        <span className="h-8 w-14 rounded-lg border-2 border-foreground/15" style={{ backgroundColor: palette.secondary }} />
                                    </span>
                                ),
                            }))}
                        />

                        <details className="group rounded-2xl border-2 border-foreground/15 p-4 open:pb-6">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-lg font-bold text-foreground">
                                <span>{t("Pick my own colors (advanced)")}</span>
                                <span className="text-base font-semibold text-muted-foreground group-open:hidden">{t("Show")}</span>
                                <span className="hidden text-base font-semibold text-muted-foreground group-open:inline">{t("Hide")}</span>
                            </summary>
                            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {(["primary", "secondary"] as const).map((which) => {
                                    const name = which === "primary" ? "brandPrimaryHex" : "brandSecondaryHex";
                                    const value = which === "primary" ? brandPrimaryHex : brandSecondaryHex;
                                    return (
                                        <SettingsField
                                            key={which}
                                            label={which === "primary" ? t("Main color") : t("Second color")}
                                            htmlFor={fieldId(name)}
                                            error={errorFor(name)}
                                        >
                                            <div className="flex flex-wrap items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => (which === "primary" ? setIsPrimaryColorPickerOpen(true) : setIsSecondaryColorPickerOpen(true))}
                                                    className={settingsButtonClass("secondary", "md")}
                                                >
                                                    <span className="size-6 rounded-md border-2 border-foreground/20" style={{ backgroundColor: value }} aria-hidden />
                                                    <span>{t("Choose color")}</span>
                                                </button>
                                                <input type="text" {...bindHex(which)} aria-label={which === "primary" ? t("Main color code") : t("Second color code")} />
                                            </div>
                                        </SettingsField>
                                    );
                                })}
                            </div>
                        </details>

                        <SettingsButton
                            variant="ghost"
                            icon={RotateCcw}
                            onClick={() => setBrandColors(DEFAULT_BRANDING.primaryColor, DEFAULT_BRANDING.secondaryColor)}
                        >
                            {t("Go back to the original iReside colors")}
                        </SettingsButton>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-banner" title={t("Dashboard picture")} description={t("The large picture at the top of your dashboard.")}>
                    <div className="space-y-6">
                        <div className="relative h-48 w-full overflow-hidden rounded-2xl border-2 border-foreground/15 sm:h-56">
                            <Image src={bannerUrl} alt={t("Your current dashboard picture")} fill sizes="(max-width: 1024px) 100vw, 768px" className="object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                                <p className="text-xl font-black text-white">{propertyTradeName || t("Your property")}</p>
                                {propertyTagline && <p className="text-base text-white/90">{propertyTagline}</p>}
                            </div>
                        </div>

                        <fieldset className="space-y-3">
                            <legend className="text-lg font-bold text-foreground">{t("Choose a design")}</legend>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {CURATED_BANNER_PRESETS.map((preset) => {
                                    const isSelected = bannerUrl === preset.url;
                                    return (
                                        <label
                                            key={preset.id}
                                            className={cn(
                                                "cursor-pointer overflow-hidden rounded-2xl border-2 transition-colors",
                                                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/50",
                                                isSelected ? "border-foreground/70" : "border-foreground/15 hover:border-foreground/40",
                                            )}
                                        >
                                            <input type="radio" name="dashboard-banner" className="sr-only" checked={isSelected} onChange={() => handleSelectBannerPreset(preset.url)} />
                                            <span className="relative block h-28 w-full">
                                                <Image src={preset.url} alt="" fill sizes="(max-width: 768px) 100vw, 300px" className="object-cover" />
                                            </span>
                                            <span className={cn("flex items-center gap-2 px-3 py-3 text-base font-bold", isSelected ? "bg-primary/20 text-foreground" : "bg-card text-foreground")}>
                                                {isSelected && <Check className="size-5 shrink-0" aria-hidden />}
                                                <span>{t(preset.name)}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="flex flex-wrap gap-3">
                            <SettingsButton variant="secondary" icon={ImageIcon} onClick={() => bannerFileInputRef.current?.click()}>
                                {t("Use my own photo")}
                            </SettingsButton>
                            {bannerUrl !== DEFAULT_BANNER_URL && (
                                <SettingsButton variant="ghost" icon={RotateCcw} onClick={handleResetBanner}>
                                    {t("Use the original design")}
                                </SettingsButton>
                            )}
                            <input ref={bannerFileInputRef} type="file" accept={MEDIA_ACCEPT_STRINGS.image} onChange={handleBannerFileUpload} className="hidden" aria-hidden tabIndex={-1} />
                        </div>
                        <p className="text-base text-muted-foreground">{t("PNG, JPG or WebP, up to 8 MB.")}</p>
                    </div>
                </SettingsCard>

                <SettingsLinkRow
                    title={t("Set everything up again with the helper")}
                    description={t("A short 3-step helper for your name, colors and look. Your leases and units are not changed.")}
                    action={
                        <Link href="/setup?reconfigure=true" className={settingsButtonClass("secondary", "md")}>
                            <SlidersHorizontal className="size-5" aria-hidden />
                            <span>{t("Open the setup helper")}</span>
                        </Link>
                    }
                />
            </>
        );
    };

    const financePanelProps = {
        propertyId: selectedPropertyId,
        embedded: true,
        onDirtyChange: setIsFinanceDirty,
        onRegisterSave: (fn: () => Promise<boolean>) => { financeSaveRef.current = fn; },
        onRegisterDiscard: (fn: () => void) => { financeDiscardRef.current = fn; },
    };

    const renderPayments = () => (
        <>
            <SettingsNotice tone="info">{t("Press Save changes at the bottom of the screen when you are done.")}</SettingsNotice>
            <BillingOperationsPanel viewMode="gcash" {...financePanelProps} />
        </>
    );

    const renderUtilities = () => (
        <>
            <SettingsCard title={t("Which rates do you want to change?")}>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="landlord-utilities-property" className="block text-lg font-bold text-foreground">
                            {t("Property")}
                        </label>
                        <select
                            id="landlord-utilities-property"
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className={settingsInputClass(false, "cursor-pointer")}
                        >
                            <option value="all">{t("All my properties")}</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <SettingsChoiceGroup
                        legend={t("Utility")}
                        value={activeFinanceTab === "Electricity" ? "Electricity" : "Water"}
                        onChange={(v) => {
                            if (isFinanceDirty) {
                                toast.info(t("Please save or undo your changes first."));
                                return;
                            }
                            setActiveFinanceTab(v);
                        }}
                        options={[
                            { value: "Water", label: t("Water"), preview: <Droplets className="size-7 text-foreground" aria-hidden /> },
                            { value: "Electricity", label: t("Electricity"), preview: <Zap className="size-7 text-foreground" aria-hidden /> },
                        ]}
                    />
                </div>
            </SettingsCard>
            <BillingOperationsPanel
                viewMode="rates"
                utilityType={activeFinanceTab === "Electricity" ? "electricity" : "water"}
                {...financePanelProps}
            />
        </>
    );

    const renderSecurity = () => {
        const strength = newPassword.length > 0 ? evaluatePasswordStrength(newPassword, passwordContext) : null;
        const checks = strength
            ? [
                  { ok: strength.checks.hasMinLength, label: t("At least 8 characters") },
                  { ok: strength.checks.hasUppercase, label: t("A capital letter (A–Z)") },
                  { ok: strength.checks.hasNumberOrSymbol, label: t("A number or symbol (1, 2, !, ?)") },
                  { ok: strength.checks.isNotCommon && strength.checks.isNotRepetitive && strength.checks.isNotPersonal, label: t("Not your name, email or an easy guess") },
              ]
            : [];

        return (
            <>
                <SettingsCard id="settings-password" title={t("Change your password")} description={t("Use at least 8 characters. A short sentence you can remember works well.")}>
                    <form onSubmit={handleUpdatePassword} className="space-y-6" noValidate>
                        <p className="text-base text-muted-foreground">
                            {passwordLastUpdated ? (
                                <>
                                    {t("Last changed on")}{" "}
                                    <span className="font-bold text-foreground">
                                        <ClientOnlyDate date={passwordLastUpdated} locale={locale} format={{ month: "long", day: "numeric", year: "numeric" }} />
                                    </span>
                                    .{" "}
                                    <Link
                                        href={`/forgot-password?email=${encodeURIComponent(user?.email || profile?.email || "")}`}
                                        className="font-semibold text-foreground underline underline-offset-4"
                                    >
                                        {t("Was this not you? Reset your password")}
                                    </Link>
                                </>
                            ) : (
                                t("You have not changed your password here yet.")
                            )}
                        </p>

                        <SettingsField label={t("New password")} htmlFor={fieldId("newPassword")} error={errorFor("newPassword")}>
                            <SettingsPasswordInput
                                id={fieldId("newPassword")}
                                autoComplete="new-password"
                                maxLength={72}
                                value={newPassword}
                                hasError={Boolean(errorFor("newPassword"))}
                                aria-invalid={errorFor("newPassword") ? true : undefined}
                                aria-describedby={describedBy(fieldId("newPassword"), false, Boolean(errorFor("newPassword")))}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setNewPassword(val);
                                    if (fieldErrors["newPassword"]) setFieldError("newPassword", validatePasswordPair(val, confirmNewPassword, passwordContext).newPasswordError);
                                    if (confirmNewPassword && fieldErrors["confirmNewPassword"]) {
                                        setFieldError("confirmNewPassword", validatePasswordPair(val, confirmNewPassword, passwordContext).confirmPasswordError);
                                    }
                                }}
                                onBlur={() => {
                                    markFieldTouched("newPassword");
                                    if (newPassword) setFieldError("newPassword", validatePasswordPair(newPassword, confirmNewPassword, passwordContext).newPasswordError);
                                }}
                            />
                        </SettingsField>

                        {strength && (
                            <div className="rounded-2xl border-2 border-foreground/15 p-4" aria-live="polite">
                                <p className="text-lg font-bold text-foreground">
                                    {t("Password strength:")} <span className={strength.color}>{t(strength.label)}</span>
                                </p>
                                <ul className="mt-3 space-y-2">
                                    {checks.map((check) => (
                                        <li key={check.label} className="flex items-center gap-3 text-base">
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                                                    check.ok ? "border-emerald-600 bg-emerald-600 text-white" : "border-foreground/30",
                                                )}
                                            >
                                                {check.ok && <Check className="size-4" strokeWidth={3} />}
                                            </span>
                                            <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>
                                                {check.label}
                                                <span className="sr-only">{check.ok ? ` — ${t("done")}` : ` — ${t("not yet")}`}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <SettingsField label={t("Type the new password again")} htmlFor={fieldId("confirmNewPassword")} error={errorFor("confirmNewPassword")}>
                            <SettingsPasswordInput
                                id={fieldId("confirmNewPassword")}
                                autoComplete="new-password"
                                maxLength={72}
                                value={confirmNewPassword}
                                hasError={Boolean(errorFor("confirmNewPassword"))}
                                aria-invalid={errorFor("confirmNewPassword") ? true : undefined}
                                aria-describedby={describedBy(fieldId("confirmNewPassword"), false, Boolean(errorFor("confirmNewPassword")))}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setConfirmNewPassword(val);
                                    if (fieldErrors["confirmNewPassword"]) setFieldError("confirmNewPassword", validatePasswordPair(newPassword, val, passwordContext).confirmPasswordError);
                                }}
                                onBlur={() => {
                                    markFieldTouched("confirmNewPassword");
                                    if (confirmNewPassword) setFieldError("confirmNewPassword", validatePasswordPair(newPassword, confirmNewPassword, passwordContext).confirmPasswordError);
                                }}
                            />
                            {confirmNewPassword && !fieldErrors["confirmNewPassword"] && newPassword === confirmNewPassword && (
                                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-emerald-700 dark:text-emerald-400">
                                    <Check className="size-5" aria-hidden /> {t("The two passwords match.")}
                                </p>
                            )}
                        </SettingsField>

                        <SettingsButton type="submit" size="lg" icon={KeyRound} loading={isUpdatingPassword} disabled={!newPassword || !confirmNewPassword} className="w-full sm:w-auto">
                            {isUpdatingPassword ? t("Changing your password…") : t("Change my password")}
                        </SettingsButton>
                    </form>
                </SettingsCard>

                <SettingsCard
                    id="settings-extra-protection"
                    title={t("Extra protection (optional)")}
                    description={t("These add a second check when you sign in, so no one else can get in even if they learn your password.")}
                >
                    <div className="space-y-6">
                        <TwoFactorManagementCard
                            apiEndpoint="/api/landlord/2fa"
                            accountEmail={user?.email || profile?.email || undefined}
                            onStatusChange={(enabled) => setTwoFAStatus(enabled ? "enabled" : "disabled")}
                        />
                        <SecurityKeyManagementCard accountEmail={user?.email || profile?.email || undefined} />
                    </div>
                </SettingsCard>

                <SignedInDevicesCard
                    sessions={sessions}
                    loading={isSessionsLoading}
                    currentSessionId={currentSessionId}
                    onSignOutDevice={handleRevokeSession}
                    onSignOutOthers={handleSignOutOthers}
                    onSignOutEverywhere={handleSignOutAll}
                />
            </>
        );
    };

    const renderNotifications = () => (
        <SettingsCard title={t("What should we tell you about?")} description={t("Tap a button to turn it on or off. Then press Save changes at the bottom.")}>
            <NotificationTopicsList<NotificationCategoryKey, "email" | "push">
                topics={[
                    { key: "lease_applications", icon: FileText, label: t("Rental applications"), description: t("When someone applies to rent one of your units.") },
                    { key: "maintenance", icon: Wrench, label: t("Repair requests"), description: t("When a tenant reports something that needs fixing.") },
                    { key: "payments", icon: CreditCard, label: t("Payments received"), description: t("When a tenant's rent payment comes in.") },
                    { key: "messages", icon: MessageSquare, label: t("Messages"), description: t("When a tenant or applicant sends you a message.") },
                    { key: "announcements", icon: Megaphone, label: t("News from iReside"), description: t("New features and important notices.") },
                ]}
                channels={[
                    { key: "email", label: t("Email") },
                    { key: "push", label: t("Alert in the app") },
                ]}
                isOn={(topic, channel) => notificationPreferences[topic][channel]}
                onToggle={(topic, channel) => handleToggleNotification(topic, channel)}
            />
            <div className="mt-6 border-t-2 border-border pt-6">
                <SettingsButton variant="ghost" icon={RotateCcw} onClick={handleResetNotificationDefaults}>
                    {t("Turn everything back on")}
                </SettingsButton>
            </div>
        </SettingsCard>
    );

    const renderHelp = () => (
        <>
            <SettingsCard title={t("Help guide")} description={t("Simple, step-by-step instructions for every part of iReside.")}>
                <Link href="/landlord/docs" className={settingsButtonClass("primary", "lg")}>
                    <HelpCircle className="size-5" aria-hidden />
                    <span>{t("Open the help guide")}</span>
                </Link>
            </SettingsCard>

            <SettingsCard title={t("Step-by-step lessons")} description={t("Short lessons on your dashboard that teach you how to use iReside. Changes here save right away.")}>
                <div className="space-y-6">
                    <SettingsSwitchRow
                        label={t("Keep finished lessons on my dashboard")}
                        description={t("Turn this on to keep seeing lessons you have already finished.")}
                        checked={Boolean(tourState?.metadata?.show_completed_quests)}
                        onChange={() => handleToggleCompletedQuests()}
                    />
                    <div className="space-y-3 border-t-2 border-border pt-6">
                        <p className="text-lg font-bold text-foreground">{t("Start all lessons over")}</p>
                        <p className="text-base text-muted-foreground">{t("This clears your lesson progress so you can do them again from the beginning.")}</p>
                        <SettingsButton variant="secondary" icon={RotateCcw} loading={isResetting} onClick={handleHardResetTour}>
                            {isResetting ? t("Starting over…") : t("Start lessons over")}
                        </SettingsButton>
                    </div>
                </div>
            </SettingsCard>
        </>
    );

    const renderData = () => (
        <>
            <SettingsCard id="settings-export" title={t("Download your records")} description={t("Save a copy of your records to your computer. You can open it in Excel.")}>
                <div className="space-y-8">
                    <SettingsChoiceGroup
                        legend={t("1. What do you want to download?")}
                        columns={1}
                        value={exportCategory}
                        onChange={(v) => setExportCategory(v)}
                        options={[
                            { value: "financials", label: t("Money records"), description: t("Bills, payments, balances and utility charges.") },
                            { value: "properties", label: t("My properties"), description: t("Buildings, units and which ones are rented.") },
                            { value: "rent_roll", label: t("My tenants and leases"), description: t("Who rents each unit, their contact details and lease terms.") },
                        ]}
                    />

                    {exportCategory === "financials" && (
                        <SettingsChoiceGroup
                            legend={t("2. Which dates?")}
                            columns={3}
                            value={exportRange}
                            onChange={(v) => setExportRange(v)}
                            options={[
                                { value: "ytd", label: t("This year") },
                                { value: "12m", label: t("Last 12 months") },
                                { value: "all", label: t("Everything") },
                            ]}
                        />
                    )}

                    <SettingsChoiceGroup
                        legend={exportCategory === "financials" ? t("3. What kind of file?") : t("2. What kind of file?")}
                        value={exportFormat}
                        onChange={(v) => setExportFormat(v)}
                        options={[
                            { value: "csv", label: t("Spreadsheet (CSV)"), description: t("Opens in Excel or Google Sheets. Choose this if unsure.") },
                            { value: "json", label: "JSON", description: t("For technical use only.") },
                        ]}
                    />

                    {exportCategory === "financials" && exportRange === "all" && (
                        <SettingsNotice tone="warning" title={t("This may take a little while")}>
                            {t("Downloading everything collects all your past bills and payments, so the file may be large.")}
                        </SettingsNotice>
                    )}

                    <SettingsButton size="lg" icon={Download} loading={isExporting} onClick={handleExportData} className="w-full sm:w-auto">
                        {isExporting ? t("Preparing your file…") : t("Download my file")}
                    </SettingsButton>
                </div>
            </SettingsCard>

            <CloseAccountCard
                accountEmail={user?.email || profile?.email}
                extraNote={t("Before closing, make sure your tenants have been told and all leases are finished.")}
            />
        </>
    );

    const renderSection = (id: SectionId) => {
        switch (id) {
            case "profile": return renderProfile();
            case "security": return renderSecurity();
            case "business": return renderBusiness();
            case "branding": return renderBranding();
            case "payments": return renderPayments();
            case "utilities": return renderUtilities();
            case "display": return <DisplaySettingsSection showTheme />;
            case "notifications": return renderNotifications();
            case "activity": return <AuditLogsSettingsTab />;
            case "help": return renderHelp();
            case "data": return renderData();
        }
    };

    if (!isNavReady) return <PageLoader message={t("Loading your settings...")} />;

    const syncBanner = syncError ? (
        <SettingsNotice
            tone="warning"
            title={t("We could not load your latest settings")}
            action={
                <SettingsButton variant="secondary" icon={RotateCcw} loading={isSyncing} onClick={() => syncSettingsWithDatabase(true)}>
                    {t("Try again")}
                </SettingsButton>
            }
            className="mb-8"
        >
            {t("You may be seeing older details. Check your internet connection, then press Try again.")}
        </SettingsNotice>
    ) : null;

    const helpFooter = (
        <SettingsNotice
            tone="info"
            title={t("Need help?")}
            action={
                <Link href="/landlord/docs" className={settingsButtonClass("secondary", "md")}>
                    <HelpCircle className="size-5" aria-hidden />
                    <span>{t("Open the help guide")}</span>
                </Link>
            }
        >
            {t("The help guide explains each part of iReside with simple steps.")}
        </SettingsNotice>
    );

    return (
        <div className="pb-40">
            {syncBanner}

            {section === null ? (
                <SettingsHub
                    title={t("Settings")}
                    intro={t("Choose what you want to change. You can come back to this page at any time.")}
                    groups={groups}
                    sections={sections}
                    quickTasks={quickTasks}
                    onOpen={(id, opts) => openSection(id, opts)}
                    topSlot={
                        embedded ? undefined : (
                            <button type="button" onClick={goToDashboard} className={settingsButtonClass("secondary", "md")}>
                                <ArrowLeft className="size-5" aria-hidden />
                                <span>{t("Back to Dashboard")}</span>
                            </button>
                        )
                    }
                    footer={helpFooter}
                />
            ) : (
                <SettingsSectionLayout groups={groups} sections={sections} activeId={section} onOpen={(id) => openSection(id)} onHome={() => openSection(null)}>
                    {renderSection(section)}
                </SettingsSectionLayout>
            )}

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

            <ColorPickerModal
                isOpen={isPrimaryColorPickerOpen}
                onClose={() => setIsPrimaryColorPickerOpen(false)}
                color={brandPrimaryHex}
                title={t("Main color")}
                onChange={(newColor) => {
                    setHasUserEdited(true);
                    setBrandPrimaryHex(newColor);
                    applyBrandCssVariables(newColor, brandSecondaryHex);
                }}
            />

            <ColorPickerModal
                isOpen={isSecondaryColorPickerOpen}
                onClose={() => setIsSecondaryColorPickerOpen(false)}
                color={brandSecondaryHex}
                title={t("Second color")}
                onChange={(newColor) => {
                    setHasUserEdited(true);
                    setBrandSecondaryHex(newColor);
                    applyBrandCssVariables(brandPrimaryHex, newColor);
                }}
            />

            <SettingsSaveBar
                visible={isDirty}
                saving={isSaving}
                justSaved={justSaved}
                onSave={() => { void handleSaveAll(); }}
                onDiscard={handleDiscardChanges}
                raised={embedded}
            />

            <SettingsLeaveDialog
                open={pendingNavigation !== null}
                saving={isSaving}
                onStay={() => setPendingNavigation(null)}
                onDiscard={() => {
                    const nav = pendingNavigation;
                    handleDiscardChanges();
                    setPendingNavigation(null);
                    if (nav?.kind === "url") router.push(nav.href);
                    else if (nav?.kind === "back") leaveSettings();
                    else if (nav) openSection(nav.id, { force: true });
                }}
                onSave={async () => {
                    const nav = pendingNavigation;
                    const ok = await handleSaveAll();
                    setPendingNavigation(null);
                    if (!ok || !nav) return;
                    if (nav.kind === "url") router.push(nav.href);
                    else if (nav.kind === "back") leaveSettings();
                    else openSection(nav.id, { force: true });
                }}
            />
        </div>
    );
}
