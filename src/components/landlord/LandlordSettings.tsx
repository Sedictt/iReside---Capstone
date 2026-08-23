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
    ChevronLeft
} from "lucide-react";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import { useTheme } from "next-themes";
import { useHighContrast } from "@/hooks/useHighContrast";
import { CURATED_BANNER_PRESETS, DEFAULT_BANNER_URL } from "@/components/landlord/dashboard/BannerCustomizerModal";
import { ColorPickerModal } from "@/components/ui/ColorPickerModal";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import Link from "next/link";

// --- Types ---
type SettingsCategory = "Identity" | "Personalization" | "Finance" | "Security" | "Notifications" | "Data";

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
        id: "Data", 
        label: "Data & Privacy", 
        icon: Globe,
        description: "Export data and account deletion"
    },
];

// --- Components ---

function GlassCard({ children, className, title, description }: { children: React.ReactNode; className?: string; title?: string; description?: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-[2rem] neumorphic-panel transition-all duration-500", className)}>
            {(title || description) && (
                <div className="border-b border-border/60 px-8 py-6">
                    {title && <h3 className="text-lg font-black text-foreground">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                </div>
            )}
            <div className="p-8 text-foreground">{children}</div>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onTabChange(tab)}
                    className={cn(
                        "whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-black transition-all",
                        activeTab === tab
                            ? "neumorphic-primary text-primary-foreground font-black shadow-md"
                            : "neumorphic-extruded text-muted-foreground hover:text-foreground font-bold"
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
    const supabase = useMemo(() => createClient(), []);

    // Mapping of Sub-tabs
    const SUB_TABS: Record<SettingsCategory, string[]> = {
        Identity: ["Profile", "Socials", "Verification"],
        Personalization: ["Themes & Contrast", "Branding & Logo", "Dashboard Banner"],
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

    // Theme & High Contrast
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { isHighContrast, toggleHighContrast } = useHighContrast();

    // Personalization & Branding State
    const [bannerUrl, setBannerUrl] = useState<string>(DEFAULT_BANNER_URL);
    const [customBannerInput, setCustomBannerInput] = useState<string>("");
    const [propertyTradeName, setPropertyTradeName] = useState<string>("Skyline Lofts");
    const [propertyTagline, setPropertyTagline] = useState<string>("Modern Urban Residences & Studios");
    const [propertyLogoUrl, setPropertyLogoUrl] = useState<string | null>(null);
    const [rentalArchetype, setRentalArchetype] = useState<string>("apartments");
    const [brandPrimaryHex, setBrandPrimaryHex] = useState<string>("#c4b0ff");
    const [brandSecondaryHex, setBrandSecondaryHex] = useState<string>("#06b6d4");
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

    const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
                setPropertyLogoUrl(dataUrl);
                toast.info("Logo preview updated. Save all changes to apply permanently.");
            }
        };
        reader.readAsDataURL(file);
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

    const [initialSnapshot, setInitialSnapshot] = useState<{
        formData: typeof formData;
        propertyTradeName: string;
        propertyTagline: string;
        rentalArchetype: string;
        brandPrimaryHex: string;
        brandSecondaryHex: string;
        bannerUrl: string;
        propertyLogoUrl: string | null;
    } | null>(null);

    const fetchProperties = useCallback(async () => {
        if (!profile?.id) return;
        
        const { data, error } = await supabase
            .from("properties")
            .select("id, name")
            .eq("landlord_id", profile.id);
        
        if (data) setProperties(data);
    }, [profile?.id, supabase]);

    useEffect(() => {
        if (profile) {
            const initialForm = {
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
            };
            setFormData(initialForm);

            const savedBanner = typeof window !== "undefined" ? (localStorage.getItem("ireside_landlord_custom_banner_url") || DEFAULT_BANNER_URL) : DEFAULT_BANNER_URL;
            const savedLogo = typeof window !== "undefined" ? localStorage.getItem("ireside_property_logo") : null;
            const savedName = typeof window !== "undefined" ? (localStorage.getItem("ireside_property_name") || "Skyline Lofts") : "Skyline Lofts";
            const savedTagline = typeof window !== "undefined" ? (localStorage.getItem("ireside_property_tagline") || "Modern Urban Residences & Studios") : "Modern Urban Residences & Studios";
            const savedArchetype = typeof window !== "undefined" ? (localStorage.getItem("ireside_rental_archetype") || "apartments") : "apartments";
            const savedPrimary = typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_primary") || "#c4b0ff") : "#c4b0ff";
            const savedSecondary = typeof window !== "undefined" ? (localStorage.getItem("ireside_brand_secondary") || "#06b6d4") : "#06b6d4";

            setBannerUrl(savedBanner);
            setPropertyLogoUrl(savedLogo);
            setPropertyTradeName(savedName);
            setPropertyTagline(savedTagline);
            setRentalArchetype(savedArchetype);
            setBrandPrimaryHex(savedPrimary);
            setBrandSecondaryHex(savedSecondary);

            if (!initialSnapshot) {
                setInitialSnapshot({
                    formData: JSON.parse(JSON.stringify(initialForm)),
                    propertyTradeName: savedName,
                    propertyTagline: savedTagline,
                    rentalArchetype: savedArchetype,
                    brandPrimaryHex: savedPrimary,
                    brandSecondaryHex: savedSecondary,
                    bannerUrl: savedBanner,
                    propertyLogoUrl: savedLogo,
                });
            }
            fetchProperties();
        }
    }, [profile]);

    const isDirty = useMemo(() => {
        if (!initialSnapshot) return false;
        return (
            JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData) ||
            propertyTradeName !== initialSnapshot.propertyTradeName ||
            propertyTagline !== initialSnapshot.propertyTagline ||
            rentalArchetype !== initialSnapshot.rentalArchetype ||
            brandPrimaryHex !== initialSnapshot.brandPrimaryHex ||
            brandSecondaryHex !== initialSnapshot.brandSecondaryHex ||
            bannerUrl !== initialSnapshot.bannerUrl ||
            propertyLogoUrl !== initialSnapshot.propertyLogoUrl
        );
    }, [formData, propertyTradeName, propertyTagline, rentalArchetype, brandPrimaryHex, brandSecondaryHex, bannerUrl, propertyLogoUrl, initialSnapshot]);

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
            const { data } = await (supabase as any).from('user_sessions').select('*').order('updated_at', { ascending: false });
            if (data) setSessions(data);
        } catch (error: any) {
            toast.error(error.message || "Failed to sign out other devices", { id: loadingToast });
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const handleSaveAll = async (): Promise<boolean> => {
        if (!profile) return false;
        setIsSaving(true);
        const loadingToast = toast.loading("Saving all changes across settings…");
        try {
            const hasFormChanged = !initialSnapshot || JSON.stringify(formData) !== JSON.stringify(initialSnapshot.formData);

            if (hasFormChanged) {
                // Perform DB updates with a safety timeout so it never hangs
                const dbSavePromise = (async () => {
                    const { error } = await supabase
                        .from("profiles")
                        .update({
                            full_name: formData.full_name,
                            website: formData.website,
                            bio: formData.bio,
                            socials: formData.socials,
                            phone: formData.phone,
                            address: formData.address,
                            business_name: formData.business_name,
                            business_permit_number: formData.business_permit_number,
                        })
                        .eq("id", profile.id);

                    if (error) {
                        console.warn("[LandlordSettings] Profile update warning:", error);
                    }

                    await Promise.allSettled([
                        (supabase as any)
                            .from("profile_private")
                            .upsert(
                                {
                                    profile_id: profile.id,
                                    phone: formData.phone,
                                    address: formData.address,
                                    updated_at: new Date().toISOString(),
                                },
                                { onConflict: "profile_id" }
                            ),
                        (supabase as any)
                            .from("landlord_business_profiles")
                            .upsert(
                                {
                                    profile_id: profile.id,
                                    business_name: formData.business_name,
                                    business_permit_number: formData.business_permit_number,
                                    business_permit_url: profile.business_permit_url,
                                    business_permits: profile.business_permits ?? [],
                                    updated_at: new Date().toISOString(),
                                },
                                { onConflict: "profile_id" }
                            ),
                    ]);
                })();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Database save timed out")), 5000)
                );

                try {
                    await Promise.race([dbSavePromise, timeoutPromise]);
                } catch (timeoutErr: any) {
                    console.warn("[LandlordSettings] DB Save warning:", timeoutErr?.message);
                }
            }

            // 2. Personalization & Branding (LocalStorage & Events)
            if (typeof window !== "undefined") {
                localStorage.setItem("ireside_property_name", propertyTradeName);
                localStorage.setItem("ireside_property_tagline", propertyTagline);
                localStorage.setItem("ireside_rental_archetype", rentalArchetype);
                localStorage.setItem("ireside_brand_primary", brandPrimaryHex);
                localStorage.setItem("ireside_brand_secondary", brandSecondaryHex);
                if (propertyLogoUrl) {
                    localStorage.setItem("ireside_property_logo", propertyLogoUrl);
                } else {
                    localStorage.removeItem("ireside_property_logo");
                }
                if (bannerUrl) {
                    localStorage.setItem("ireside_landlord_custom_banner_url", bannerUrl);
                }
                window.dispatchEvent(new CustomEvent("property-branding-updated"));
                window.dispatchEvent(new CustomEvent("banner-updated", { detail: bannerUrl }));
            }

            // 3. Update Snapshot to clear isDirty immediately
            setInitialSnapshot({
                formData: JSON.parse(JSON.stringify(formData)),
                propertyTradeName,
                propertyTagline,
                rentalArchetype,
                brandPrimaryHex,
                brandSecondaryHex,
                bannerUrl,
                propertyLogoUrl,
            });

            // Refresh profile in background
            refreshProfile().catch((err) => console.warn("[LandlordSettings] Profile refresh error:", err));

            toast.dismiss(loadingToast);
            toast.success("All settings saved successfully!");
            return true;
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error(error?.message || "Failed to save settings");
            return false;
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
                                        className="w-full cursor-not-allowed rounded-xl neumorphic-inset px-4 py-3 text-sm opacity-50"
                                    />
                                </SettingField>
                                <SettingField label="Business Name" icon={Building2} description="Verified by admin. Contact support to change.">
                                    <input
                                        type="text"
                                        value={profile?.business_name || ""}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl neumorphic-inset px-4 py-3 text-sm opacity-50"
                                    />
                                </SettingField>
                                <SettingField label="Contact Email" icon={Mail} description="This email is used for inquiries.">
                                    <input
                                        type="email"
                                        value={profile?.email || ""}
                                        disabled
                                        className="w-full cursor-not-allowed rounded-xl neumorphic-inset px-4 py-3 text-sm opacity-50"
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
                case "Branding":
                    return (
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <GlassCard title="Cover Photo" description="A cinematic background for your public page.">
                                <div className="relative h-64 w-full overflow-hidden rounded-[1.5rem] neumorphic-inset">
                                    <ProfileCoverUploader 
                                        initialCoverUrl={profile?.cover_url || null} 
                                        fullName={profile?.full_name || "Landlord"} 
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
                                                {profile?.full_name?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <button 
                                            onClick={() => setIsAvatarPickerOpen(true)}
                                            className="absolute -bottom-2 -right-2 flex size-12 items-center justify-center rounded-2xl neumorphic-primary transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Camera className="size-6" />
                                        </button>
                                    </div>
                                    <h4 className="mt-6 text-xl font-black text-white">{profile?.full_name}</h4>
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
                    activeTab={activeSubTab} 
                    onTabChange={setActiveSubTab} 
                />

                <div className="mt-8">
                    {renderSubContent()}
                </div>
            </motion.div>
        );
    };

    const renderPersonalization = () => {
        const renderSubContent = () => {
            switch (activeSubTab) {
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
                                title="Brand Accent Colors Studio" 
                                description="Tune the primary and secondary signature tones used in buttons, active states & metrics."
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <SettingField label="Primary Brand Accent" icon={Palette} description="Used for primary buttons, active tabs, and key badges.">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsPrimaryColorPickerOpen(true)}
                                                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl neumorphic-extruded border border-border/80 hover:border-primary/80 transition-all group cursor-pointer"
                                                title="Open modern color picker"
                                            >
                                                <span 
                                                    className="size-6 rounded-lg shadow-sm border border-white/20 shrink-0 transition-transform group-hover:scale-105" 
                                                    style={{ backgroundColor: brandPrimaryHex }} 
                                                />
                                                <span className="font-mono text-xs font-black uppercase text-foreground">
                                                    {brandPrimaryHex}
                                                </span>
                                                <Pipette className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                                            </button>
                                            <input
                                                type="text"
                                                value={brandPrimaryHex}
                                                onChange={(e) => setBrandPrimaryHex(e.target.value)}
                                                placeholder="#C4B0FF"
                                                className="w-28 uppercase font-mono text-xs font-bold rounded-xl neumorphic-inset px-3 py-3 text-foreground"
                                            />
                                            <div 
                                                className="size-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center text-xs font-black"
                                                style={{ backgroundColor: brandPrimaryHex, color: "#000" }}
                                            >
                                                Aa
                                            </div>
                                        </div>
                                    </SettingField>

                                    <SettingField label="Secondary Ambient Accent" icon={SlidersHorizontal} description="Used for gradients, glowing highlights, and secondary tags.">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsSecondaryColorPickerOpen(true)}
                                                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl neumorphic-extruded border border-border/80 hover:border-primary/80 transition-all group cursor-pointer"
                                                title="Open modern color picker"
                                            >
                                                <span 
                                                    className="size-6 rounded-lg shadow-sm border border-white/20 shrink-0 transition-transform group-hover:scale-105" 
                                                    style={{ backgroundColor: brandSecondaryHex }} 
                                                />
                                                <span className="font-mono text-xs font-black uppercase text-foreground">
                                                    {brandSecondaryHex}
                                                </span>
                                                <Pipette className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors ml-1" />
                                            </button>
                                            <input
                                                type="text"
                                                value={brandSecondaryHex}
                                                onChange={(e) => setBrandSecondaryHex(e.target.value)}
                                                placeholder="#06B6D4"
                                                className="w-28 uppercase font-mono text-xs font-bold rounded-xl neumorphic-inset px-3 py-3 text-foreground"
                                            />
                                            <div 
                                                className="size-10 rounded-xl border border-white/20 shadow-md flex items-center justify-center text-xs font-black text-white"
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
                                    <input type="password" placeholder="••••••••" className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none" />
                                </SettingField>
                                <SettingField label="New Password" icon={Key}>
                                    <input type="password" placeholder="••••••••" className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm focus:outline-none" />
                                </SettingField>
                                
                                {otpEnabled && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="space-y-2 overflow-hidden"
                                    >
                                        <SettingField label="OTP Verification" icon={Smartphone} description="Check your mobile for the 6-digit code.">
                                            <input type="text" maxLength={6} placeholder="000000" className="w-full rounded-xl neumorphic-inset px-4 py-3 text-sm tracking-[0.5em] text-center focus:outline-none font-mono" />
                                        </SettingField>
                                    </motion.div>
                                )}

                                <button className="w-full rounded-2xl neumorphic-extruded py-3 text-sm font-black transition-all hover:text-primary">
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
                        <GlassCard title="Active Sessions" description="Devices currently logged into your account.">
                            <div className="space-y-4 max-w-lg">
                                {isSessionsLoading && sessions.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-neutral-500 uppercase tracking-widest font-black">Loading sessions…</div>
                                ) : sessions.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-neutral-500 uppercase tracking-widest font-black">No sessions found</div>
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
                                        
                                        return (
                                            <div key={sess.id} className={cn(
                                                "flex items-center justify-between rounded-2xl p-4 transition-colors",
                                                isCurrent 
                                                    ? "neumorphic-inset" 
                                                    : "neumorphic-panel opacity-70"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <Icon className={cn("size-5", isCurrent ? "text-primary" : "text-neutral-400")} />
                                                    <div>
                                                        <h4 className="text-sm font-black text-white">{browser} on {os}</h4>
                                                        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                                                            {isCurrent ? "Current Session" : <>Last seen <ClientOnlyDate date={sess.updated_at} format={{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></>} • IP: {sess.ip}
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
                                        className="mt-2 flex items-center gap-2 text-xs font-black text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
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
                    <h2 className="text-3xl font-black text-foreground">Security & Login</h2>
                    <p className="text-muted-foreground">Protect your account and manage active sessions.</p>
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
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Push</th>
                                <th className="px-4 py-5 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">SMS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {[
                                { label: "New Lease Applications", desc: "When a prospective tenant submits an application." },
                                { label: "Maintenance Requests", desc: "Urgent notifications for unit repairs." },
                                { label: "Payment Confirmations", desc: "When rent is successfully received." },
                                { label: "Direct Messages", desc: "Messages from active or prospective tenants." },
                                { label: "System Announcements", desc: "Product updates and platform news." },
                            ].map((item) => (
                                <tr key={item.label} className="transition-colors hover:bg-surface-2/50">
                                    <td className="px-8 py-6">
                                        <h4 className="text-sm font-black text-foreground">{item.label}</h4>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={true} onToggle={() => {}} /></td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={true} onToggle={() => {}} /></td>
                                    <td className="px-4 py-6 text-center"><ToggleSwitch enabled={false} onToggle={() => {}} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end gap-3 border-t border-border/60 p-6 bg-surface-2/30">
                        <button className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors">Reset to Defaults</button>
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
            case "Personalization": return renderPersonalization();
            case "Finance": return renderFinance();
            case "Security": return renderSecurity();
            case "Notifications": return renderNotifications();
            case "Data": return renderData();
            default: return null;
        }
    };

    return (
        <div className="space-y-10">
            {/* Top Navigation & Unified Global Save Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
                <button
                    type="button"
                    onClick={handleRequestExit}
                    className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors group cursor-pointer w-fit"
                >
                    <div className="size-8 rounded-full neumorphic-extruded flex items-center justify-center transition-all group-hover:scale-105 group-hover:text-primary">
                        <ChevronLeft className="size-4" />
                    </div>
                    <span className="text-sm font-black tracking-wide">Back to Dashboard</span>
                </button>

                {/* Global Unified Save Button with Dirty Indicator */}
                <div className="flex items-center gap-3">
                    {isDirty && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-black animate-pulse">
                            <span className="size-2 rounded-full bg-amber-500" />
                            <span>Unsaved Changes</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={isSaving || !isDirty}
                        className={cn(
                            "flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-md",
                            isDirty 
                                ? "neumorphic-primary text-primary-foreground hover:scale-[1.02] active:scale-95 shadow-primary/20 cursor-pointer"
                                : "neumorphic-extruded text-muted-foreground opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Save className="size-4" />
                        <span>{isSaving ? "Saving All…" : isDirty ? "Save All Changes" : "All Changes Saved"}</span>
                    </button>
                </div>
            </div>

            <div className="min-h-[80vh] flex flex-col lg:flex-row gap-12">
                {/* Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    <div className="flex items-center gap-4 px-4">
                        <div className="flex size-12 items-center justify-center rounded-[1.2rem] bg-primary/20 text-primary border border-primary/20">
                            <Layout className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-foreground">Settings</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Control Center</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {SIDEBAR_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.id)}
                                    className={cn(
                                        "group relative flex w-full flex-col items-start rounded-[1.5rem] px-6 py-5 transition-all duration-300 text-left cursor-pointer",
                                        isActive 
                                            ? "neumorphic-panel text-primary font-black shadow-md border-primary/30" 
                                            : "neumorphic-extruded text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <Icon className={cn("size-5 transition-transform duration-300", isActive ? "scale-110 text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-indicator"
                                                className="size-1.5 rounded-full bg-primary" 
                                            />
                                        )}
                                    </div>
                                    <span className={cn("mt-3 text-sm font-black transition-colors", isActive ? "text-primary" : "text-foreground group-hover:text-primary")}>
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                        {item.description}
                                    </span>
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
                    title="Primary Brand Accent"
                    subtitle="Used for primary buttons, active tabs, and key interactive elements"
                    color={brandPrimaryHex}
                    onChange={(newColor) => {
                        setBrandPrimaryHex(newColor);
                    }}
                />

                <ColorPickerModal
                    isOpen={isSecondaryColorPickerOpen}
                    onClose={() => setIsSecondaryColorPickerOpen(false)}
                    title="Secondary Ambient Tone"
                    subtitle="Used for gradients, glowing highlights, and secondary tags"
                    color={brandSecondaryHex}
                    onChange={(newColor) => {
                        setBrandSecondaryHex(newColor);
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
            </div>
        </div>
    );
}
