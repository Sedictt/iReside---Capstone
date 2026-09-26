"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Check,
  RefreshCw,
  Eye,
  Award,
  Upload,
  Trash2,
  CreditCard,
  Edit3,
  KeyRound,
  Copy,
  Download,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";
import {
  hexToHsl,
  hslToHex,
  getContrastRatio,
  getContrastTextColor,
  applyBrandCssVariables,
} from "@/lib/branding/colors";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import {
  DISALLOWED_PRESEEDED_DATA,
  validatePropertyTradeName,
  validatePropertyTagline,
  validateBrandColor,
  validateStep1Identity,
  validateStep2Theme,
} from "@/lib/validation/brand-setup";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation/media-validation";

// Curated accessible brand palette presets
interface PalettePreset {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
}

const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "sage-slate",
    name: "Sage & Slate",
    description: "Calm & Trustworthy",
    primary: "#10b981",
    secondary: "#6366f1",
  },
  {
    id: "oceanic-royal",
    name: "Oceanic Navy",
    description: "Corporate & Reliable",
    primary: "#2563eb",
    secondary: "#06b6d4",
  },
  {
    id: "forest-amber",
    name: "Forest & Amber",
    description: "Residential & Natural",
    primary: "#059669",
    secondary: "#d97706",
  },
  {
    id: "modern-violet",
    name: "Modern Violet",
    description: "Contemporary & Boutique",
    primary: "#7c3aed",
    secondary: "#f43f5e",
  },
  {
    id: "slate-sky",
    name: "Slate & Sky",
    description: "Architectural & Clean",
    primary: "#0284c7",
    secondary: "#64748b",
  },
];

const SETUP_STORAGE_KEY = "ireside_setup_inputs_draft";

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReconfigure =
    searchParams.get("reconfigure") === "true" || searchParams.get("troubleshoot") === "true";
  const { profile, user, loading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const brand = useBrand();

  // Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  // ── System Lock: prevent navigating away from mandatory setup ──
  // Active only during first-time setup (not reconfigure/troubleshoot).
  // Blocks: browser back/forward, tab/window close, and in-page logo link.
  // Unlocked once setup is launched (setup completion reached).
  const isSystemLocked = !isReconfigure && !isLaunched && !brand?.setupCompleted;

  useEffect(() => {
    if (!isSystemLocked) return;

    // 1. Trap browser back/forward buttons
    const trapHistory = () => {
      window.history.pushState(null, "", window.location.href);
    };
    // Push an extra history entry so the back button pops back to here
    trapHistory();

    const handlePopState = () => {
      trapHistory();
      toast.warning("Setup Required", {
        description: "Please complete your property setup before navigating away.",
        id: "setup-lock-popstate", // deduplicate
      });
    };
    window.addEventListener("popstate", handlePopState);

    // 2. Warn on tab/window close or hard refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSystemLocked]);

  // Track whether the initial setup-completion check has already run.
  // This prevents async BrandContext refreshes (window focus, realtime broadcast,
  // background /api/branding fetch) from redirecting the user away from the wizard
  // while they are actively typing. Only the first evaluation after auth loading
  // completes is allowed to redirect.
  const hasCheckedSetupRef = useRef(false);

  useEffect(() => {
    if (loading || brand.isLoading) return; // Wait for auth and live brand context to resolve

    if (profile && profile.role === "tenant") {
      router.replace("/tenant/dashboard");
      return;
    }

    // Only check setup completion once on initial load after loading completes.
    // Subsequent brand context updates (from refreshBranding on focus, realtime
    // broadcasts, etc.) must NOT trigger a redirect — the user may be mid-typing.
    if (hasCheckedSetupRef.current) return;
    hasCheckedSetupRef.current = true;

    const isMetadataUnfinished =
      user?.user_metadata?.is_setup_completed === false ||
      user?.user_metadata?.is_account_claimed === false;

    if (
      brand &&
      brand.setupCompleted &&
      !isMetadataUnfinished &&
      !isReconfigure &&
      !isLaunched
    ) {
      if (typeof document !== "undefined") {
        document.cookie = "ireside_setup_completed=true; path=/; max-age=31536000; SameSite=Lax";
      }
      toast.info("Setup already finalized", {
        description:
          "Your property portal is already operational. You can update your brand in Settings.",
      });
      if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
        window.location.href = "/landlord/dashboard";
      } else {
        router.replace("/landlord/dashboard");
      }
    }
  }, [
    loading,
    brand.isLoading,
    user,
    profile,
    brand,
    brand.setupCompleted,
    isReconfigure,
    isLaunched,
    router,
  ]);

  // Step 1: Identity & Landlord Details
  const [propertyName, setPropertyName] = useState(() => {
    if (!isReconfigure) return "";
    const raw = brand.propertyName?.trim() || "";
    return raw && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(raw.toLowerCase()) ? raw : "";
  });
  const [tagline, setTagline] = useState(() => {
    if (!isReconfigure) return "";
    const raw = brand.propertyTagline?.trim() || "";
    return raw && !DISALLOWED_PRESEEDED_DATA.taglines.includes(raw.toLowerCase()) ? raw : "";
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logoUrl);

  // Step 2: Light / Dark Mode & Modern HSL Palette
  const { resolvedTheme, setTheme } = useTheme();
  const [modePreference, setModePreference] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setModePreference(resolvedTheme);
    }
  }, [resolvedTheme]);

  const [colorTarget, setColorTarget] = useState<"primary" | "secondary">("primary");

  // HSL Component States
  const [hue, setHue] = useState(264);
  const [saturation, setSaturation] = useState(90);
  const [lightness, setLightness] = useState(62);

  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor || "#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor || "#06b6d4");

  // Sync initial HSL with primary color
  useEffect(() => {
    const hsl = hexToHsl(brand.primaryColor || "#8b5cf6");
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  }, [brand.primaryColor]);

  // ── 1. Restore setup inputs draft from localStorage (for connection loss or page refresh) ──
  useEffect(() => {
    if (isReconfigure) return;
    try {
      const raw = localStorage.getItem(SETUP_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.propertyName === "string" && draft.propertyName.trim()) {
        setPropertyName(draft.propertyName);
      }
      if (typeof draft.tagline === "string") {
        setTagline(draft.tagline);
      }
      if (draft.logoUrl !== undefined) {
        setLogoUrl(draft.logoUrl);
      }
      if (draft.modePreference === "dark" || draft.modePreference === "light") {
        setModePreference(draft.modePreference);
      }
      if (typeof draft.primaryColor === "string" && draft.primaryColor.startsWith("#")) {
        setPrimaryColor(draft.primaryColor);
        const hsl = hexToHsl(draft.primaryColor);
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        applyBrandCssVariables(draft.primaryColor, draft.secondaryColor || secondaryColor);
      }
      if (typeof draft.secondaryColor === "string" && draft.secondaryColor.startsWith("#")) {
        setSecondaryColor(draft.secondaryColor);
      }
      if (draft.currentStep && [1, 2, 3].includes(draft.currentStep)) {
        setCurrentStep(draft.currentStep);
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
  }, [isReconfigure]);

  // ── 2. Persist setup inputs draft to localStorage on any change ──
  useEffect(() => {
    if (isReconfigure || isLaunched || brand?.setupCompleted) return;
    try {
      // Only persist if user has started editing
      if (propertyName || tagline || logoUrl || primaryColor !== "#8b5cf6") {
        const draft = {
          propertyName,
          tagline,
          logoUrl,
          modePreference,
          primaryColor,
          secondaryColor,
          currentStep,
        };
        localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(draft));
      }
    } catch {
      // Storage quota or disabled
    }
  }, [
    propertyName,
    tagline,
    logoUrl,
    modePreference,
    primaryColor,
    secondaryColor,
    currentStep,
    isReconfigure,
    isLaunched,
    brand?.setupCompleted,
  ]);

  // Field Validation & Interaction State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markFieldTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const setFieldError = (field: string, error?: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!error) {
        delete next[field];
      } else {
        next[field] = error;
      }
      return next;
    });
  };

  const handleContinueToStep2 = () => {
    const check = validateStep1Identity({
      propertyName,
      tagline,
    });

    if (!check.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...check.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        propertyName: true,
        tagline: true,
      }));
      const firstMsg = Object.values(check.errors)[0];
      toast.error(firstMsg || "Please fix the errors in Step 1 before continuing.");
      return;
    }

    setCurrentStep(2);
  };

  const handleContinueToStep3 = () => {
    const check = validateStep2Theme({
      primaryColor,
      secondaryColor,
      modePreference,
    });

    if (!check.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...check.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        primaryColor: true,
        secondaryColor: true,
      }));
      const firstMsg = Object.values(check.errors)[0];
      toast.error(firstMsg || "Please fix color selection before continuing.");
      return;
    }

    setCurrentStep(3);
  };

  // Contrast calculations against active surface
  const surfaceHex = modePreference === "dark" ? "#09090b" : "#ffffff";
  const primaryContrast = getContrastRatio(primaryColor, surfaceHex);
  const secondaryContrast = getContrastRatio(secondaryColor, surfaceHex);
  const primaryTextColor = getContrastTextColor(primaryColor);
  const secondaryTextColor = getContrastTextColor(secondaryColor);

  const activeHex = colorTarget === "primary" ? primaryColor : secondaryColor;

  const updateCurrentTargetFromHsl = (newH: number, newS: number, newL: number) => {
    const hex = hslToHex(newH, newS, newL);
    if (colorTarget === "primary") {
      setPrimaryColor(hex);
      setFieldError("primaryColor", undefined);
      applyBrandCssVariables(hex, secondaryColor);
    } else {
      setSecondaryColor(hex);
      setFieldError("secondaryColor", undefined);
      applyBrandCssVariables(primaryColor, hex);
    }
  };

  const handleTargetTabChange = (target: "primary" | "secondary") => {
    setColorTarget(target);
    const hex = target === "primary" ? primaryColor : secondaryColor;
    const hsl = hexToHsl(hex);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  const applyPalettePreset = (preset: PalettePreset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setFieldError("primaryColor", undefined);
    setFieldError("secondaryColor", undefined);
    applyBrandCssVariables(preset.primary, preset.secondary);

    const activeSelected = colorTarget === "primary" ? preset.primary : preset.secondary;
    const hsl = hexToHsl(activeSelected);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);

    toast.success(`Applied ${preset.name} palette`);
  };

  // Harmonized secondary color calculation from primary hue
  const applyHarmonizedSecondary = (
    rule: "analogous" | "complementary" | "split" | "monochrome",
    label: string
  ) => {
    const primaryHsl = hexToHsl(primaryColor);
    let newHex = "#06b6d4";

    if (rule === "analogous") {
      newHex = hslToHex((primaryHsl.h + 35) % 360, 80, 56);
    } else if (rule === "complementary") {
      newHex = hslToHex((primaryHsl.h + 180) % 360, 80, 56);
    } else if (rule === "split") {
      newHex = hslToHex((primaryHsl.h + 150) % 360, 80, 56);
    } else if (rule === "monochrome") {
      newHex = hslToHex(
        primaryHsl.h,
        Math.max(25, primaryHsl.s - 35),
        Math.min(82, primaryHsl.l + 14)
      );
    }

    setSecondaryColor(newHex);
    setFieldError("secondaryColor", undefined);
    applyBrandCssVariables(primaryColor, newHex);

    if (colorTarget === "secondary") {
      const hsl = hexToHsl(newHex);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }

    toast.success(`Applied ${label} Accent: ${newHex.toUpperCase()}`);
  };

  const handleModeToggle = (mode: "light" | "dark") => {
    setModePreference(mode);
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(
        () => {
          setTheme(mode);
        }
      );
    } else {
      setTheme(mode);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = handleMediaSelection(e, {
      preset: "branding_logo",
      notify: (msg, desc) => {
        toast.error(msg, { description: desc });
        setFieldError("logoUrl", `${msg}: ${desc}`);
      },
    });
    if (!file) return;

    setFieldError("logoUrl", undefined);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      toast.success("Property logo uploaded successfully.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setFieldError("logoUrl", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Logo reset to default wordmark.");
  };

  const handleLaunchPortal = async () => {
    const s1 = validateStep1Identity({
      propertyName,
      tagline,
    });
    if (!s1.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...s1.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        propertyName: true,
        tagline: true,
      }));
      toast.error(Object.values(s1.errors)[0] || "Please correct errors in Step 1.");
      setCurrentStep(1);
      return;
    }

    const s2 = validateStep2Theme({ primaryColor, secondaryColor, modePreference });
    if (!s2.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...s2.errors }));
      setTouchedFields((prev) => ({ ...prev, primaryColor: true, secondaryColor: true }));
      toast.error(Object.values(s2.errors)[0] || "Please correct errors in Step 2.");
      setCurrentStep(2);
      return;
    }

    setIsLaunching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("/api/setup/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          branding: {
            propertyName: propertyName.trim(),
            propertyTagline: tagline.trim() || undefined,
            primaryColor,
            secondaryColor,
            logoUrl,
          },
        }),
      });
      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok) {
        if (json.details) {
          setFieldErrors((prev) => ({ ...prev, ...json.details }));
        }
        throw new Error(json.error || "Failed to launch workspace");
      }

      // Update client brand context locally without redundant backend POST
      await brand.updateBranding(
        {
          propertyName: propertyName.trim(),
          propertyTagline: tagline.trim(),
          primaryColor,
          secondaryColor,
          logoUrl,
          setupCompleted: true,
          setupCompletedAt: new Date().toISOString(),
        },
        false // false: /api/setup/launch already persisted all data to database
      );

      applyBrandCssVariables(primaryColor, secondaryColor);

      try {
        localStorage.removeItem(SETUP_STORAGE_KEY);
      } catch {
        // Storage cleanup is best-effort
      }

      if (typeof document !== "undefined") {
        document.cookie = "ireside_setup_completed=true; path=/; max-age=31536000; SameSite=Lax";
      }

      // Non-blocking background sync - do not block portal launch navigation
      if (refreshProfile) {
        void refreshProfile().catch(() => {});
      }

      try {
        const supabase = createClient();
        void supabase.auth.refreshSession().catch(() => {});
      } catch {
        // ignore
      }

      setIsLaunched(true);
      toast.success("Property Portal Initialized", {
        description: `Branded as ${propertyName}. Opening your dashboard...`,
      });

      // Smoothly navigate to dashboard
      const navigateToDashboard = () => {
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
          window.location.href = "/landlord/dashboard";
        } else {
          router.push("/landlord/dashboard");
        }
      };

      // Brief delay so user sees the success state card before page unload
      setTimeout(navigateToDashboard, 400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save setup: " + message);
    } finally {
      setIsLaunching(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Property Details", icon: Building2 },
    { num: 2, label: "Theme & Colors", icon: Palette },
    { num: 3, label: "Review & Launch", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans transition-colors duration-200">
      {/* Hidden Accessible File Input */}
      <input
        id="logo-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept={MEDIA_ACCEPT_STRINGS.branding_logo}
        aria-label="Upload property logo"
        className="hidden"
      />

      {/* Top Navigation Bar */}
      <nav
        aria-label="Wizard header navigation"
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-card/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 shadow-xs"
      >
        <div className="flex items-center gap-3">
          {isSystemLocked ? (
            <button
              type="button"
              onClick={() => {
                toast.warning("Setup Required", {
                  description: "Please complete your property setup before navigating away.",
                  id: "setup-lock-logo",
                });
              }}
              aria-label="Setup must be completed first"
              className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md cursor-not-allowed"
            >
              <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go to iReside home"
              className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md"
            >
              <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
            </Link>
          )}
          <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Setup Wizard
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleModeToggle(modePreference === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${modePreference === "dark" ? "light" : "dark"} appearance`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/60 border border-border hover:bg-muted transition-all flex items-center gap-1.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              {modePreference === "dark" ? (
                <motion.span
                  key="light-mode"
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-foreground"
                >
                  <Sun className="size-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Light</span>
                </motion.span>
              ) : (
                <motion.span
                  key="dark-mode"
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-foreground"
                >
                  <Moon className="size-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Dark</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div
            aria-live="polite"
            className="bg-muted/60 border border-border px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground"
          >
            <span>Step </span>
            <span style={{ color: primaryColor }} className="font-bold">
              {isLaunched ? "3" : currentStep}
            </span>
            <span> of 3</span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main
        className={cn(
          "w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-5 transition-all",
          currentStep === 3 ? "max-w-4xl" : "max-w-5xl"
        )}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Property Branding & Setup
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Configure your property identity, logo, and color theme for your resident portal.
          </p>
        </div>

        {/* Connected Wizard Stepper */}
        <nav
          aria-label="Setup steps"
          className="w-full bg-card/90 backdrop-blur-xs border border-border/80 rounded-2xl p-3.5 sm:px-8 shadow-xs"
        >
          <ol className="relative flex items-center justify-between">
            {/* Background connecting track */}
            <div
              className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-border -z-0 hidden sm:block"
              aria-hidden="true"
            />

            {/* Completed connector progress lines */}
            <div
              className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 transition-all duration-300 -z-0 hidden sm:block"
              aria-hidden="true"
              style={{
                width:
                  currentStep === 1
                    ? "0%"
                    : currentStep === 2
                    ? "50%"
                    : "calc(100% - 64px)",
                backgroundColor: primaryColor,
              }}
            />

            {stepsList.map((step) => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num || isLaunched;

              return (
                <li key={step.num} className="relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (step.num === currentStep) return;
                      if (step.num < currentStep || isDone) {
                        setCurrentStep(step.num as 1 | 2 | 3);
                        return;
                      }
                      if (step.num === 2) {
                        handleContinueToStep2();
                      } else if (step.num === 3) {
                        const s1 = validateStep1Identity({
                          propertyName,
                          tagline,
                        });
                        if (!s1.isValid) {
                          setFieldErrors((prev) => ({ ...prev, ...s1.errors }));
                          setTouchedFields((prev) => ({
                            ...prev,
                            propertyName: true,
                            tagline: true,
                          }));
                          toast.error(
                            Object.values(s1.errors)[0] || "Please complete Step 1 first."
                          );
                          setCurrentStep(1);
                          return;
                        }
                        handleContinueToStep3();
                      }
                    }}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${step.num}: ${step.label}${
                      isDone ? " (Completed)" : isActive ? " (Active)" : ""
                    }`}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 py-1.5 px-2 rounded-xl transition-all group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer",
                      isActive
                        ? "text-foreground"
                        : isDone
                        ? "text-foreground/90 hover:text-foreground"
                        : "text-muted-foreground hover:text-foreground/80"
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all border",
                        isDone
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : isActive
                          ? "shadow-sm ring-4 ring-primary/20 border-transparent font-extrabold"
                          : "bg-muted border-border text-muted-foreground group-hover:border-border/80 group-hover:bg-muted/80"
                      )}
                      style={
                        isActive && !isDone
                          ? { backgroundColor: primaryColor, color: primaryTextColor }
                          : undefined
                      }
                    >
                      {isDone ? <Check className="size-4 stroke-[3]" /> : step.num}
                    </div>

                    <div className="text-left hidden xs:block">
                      <span className="text-[10px] font-medium text-muted-foreground block uppercase tracking-wider leading-tight">
                        Step {step.num}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold block leading-tight",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Main Workspace Layout */}
        <div
          className={cn(
            "grid gap-5 items-start",
            currentStep === 3 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
          )}
        >
          {/* Main Form Column */}
          <div
            className={cn(
              "flex flex-col gap-4",
              currentStep === 3 ? "w-full" : "lg:col-span-7"
            )}
          >
            <AnimatePresence mode="wait">
              {/* STEP 1: IDENTITY & LOGO */}
              {currentStep === 1 && (
                <motion.section
                  key="step1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  aria-labelledby="step1-heading"
                  className="bg-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 border border-border/80 shadow-xs"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div
                      className="size-8 rounded-xl bg-muted/70 border border-border flex items-center justify-center shrink-0"
                      style={{ color: primaryColor }}
                    >
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h2 id="step1-heading" className="text-sm font-semibold text-foreground">
                        Property Details
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Set your property name, brand tagline, and official logo
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Property Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="property-name-input"
                          className="text-xs font-medium text-foreground cursor-pointer"
                        >
                          Property Name <span className="text-rose-500" aria-hidden="true">*</span>
                        </label>
                        {propertyName.length > 50 && (
                          <span
                            className={cn(
                              "text-[9px] font-mono",
                              propertyName.length > 80
                                ? "text-rose-500 font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {propertyName.length}/80
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "bg-background border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20",
                          touchedFields.propertyName && fieldErrors.propertyName
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-border hover:border-border/80"
                        )}
                      >
                        <input
                          id="property-name-input"
                          type="text"
                          value={propertyName}
                          maxLength={80}
                          autoComplete="organization"
                          aria-required="true"
                          aria-invalid={
                            !!(touchedFields.propertyName && fieldErrors.propertyName)
                          }
                          aria-describedby={
                            touchedFields.propertyName && fieldErrors.propertyName
                              ? "property-name-error"
                              : undefined
                          }
                          onChange={(e) => {
                            setPropertyName(e.target.value);
                            if (touchedFields.propertyName) {
                              setFieldError(
                                "propertyName",
                                validatePropertyTradeName(e.target.value).error
                              );
                            }
                          }}
                          onBlur={() => {
                            markFieldTouched("propertyName");
                            setFieldError(
                              "propertyName",
                              validatePropertyTradeName(propertyName).error
                            );
                          }}
                          placeholder="e.g. Pinecrest Residences"
                          className="bg-transparent border-none outline-none w-full text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:ring-0"
                        />
                      </div>
                      {touchedFields.propertyName && fieldErrors.propertyName && (
                        <p
                          id="property-name-error"
                          role="alert"
                          className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3 shrink-0" />
                          <span>{fieldErrors.propertyName}</span>
                        </p>
                      )}
                    </div>

                    {/* Tagline */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="tagline-input"
                          className="text-xs font-medium text-foreground cursor-pointer"
                        >
                          Tagline{" "}
                          <span className="text-muted-foreground font-normal text-[11px]">
                            (Optional)
                          </span>
                        </label>
                        {tagline.length > 80 && (
                          <span
                            className={cn(
                              "text-[9px] font-mono",
                              tagline.length > 120
                                ? "text-rose-500 font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {tagline.length}/120
                          </span>
                        )}
                      </div>
                      <div
                        className={cn(
                          "bg-background border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-primary/20",
                          touchedFields.tagline && fieldErrors.tagline
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-border hover:border-border/80"
                        )}
                      >
                        <input
                          id="tagline-input"
                          type="text"
                          value={tagline}
                          maxLength={120}
                          aria-invalid={!!(touchedFields.tagline && fieldErrors.tagline)}
                          aria-describedby={
                            touchedFields.tagline && fieldErrors.tagline
                              ? "tagline-error"
                              : undefined
                          }
                          onChange={(e) => {
                            setTagline(e.target.value);
                            if (touchedFields.tagline) {
                              setFieldError(
                                "tagline",
                                validatePropertyTagline(e.target.value).error
                              );
                            }
                          }}
                          onBlur={() => {
                            markFieldTouched("tagline");
                            setFieldError("tagline", validatePropertyTagline(tagline).error);
                          }}
                          placeholder="e.g. Modern apartments & student living"
                          className="bg-transparent border-none outline-none w-full text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:ring-0"
                        />
                      </div>
                      {touchedFields.tagline && fieldErrors.tagline && (
                        <p
                          id="tagline-error"
                          role="alert"
                          className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1"
                        >
                          <AlertCircle className="size-3 shrink-0" />
                          <span>{fieldErrors.tagline}</span>
                        </p>
                      )}
                    </div>

                    {/* Logo Customizer Component */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={logoUrl}
                            alt="Uploaded property logo"
                            className="size-11 rounded-xl object-cover border border-border shadow-xs shrink-0 bg-background"
                          />
                        ) : (
                          <div className="h-11 px-3 rounded-xl border border-border/80 bg-background flex items-center justify-center shadow-xs shrink-0">
                            <Logo className="h-6 w-20" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {logoUrl ? "Custom Logo Active" : "Default Wordmark Active"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {logoUrl
                              ? "Applied across resident portal and billing receipts"
                              : "PNG, JPG, or SVG up to 5MB (wordmark used if not uploaded)"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label={logoUrl ? "Change property logo" : "Upload property logo"}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-muted text-foreground border border-border transition-all flex items-center gap-1.5 shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                        >
                          <Upload className="size-3.5" />
                          <span>{logoUrl ? "Change" : "Upload Logo"}</span>
                        </button>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            aria-label="Remove uploaded logo"
                            title="Remove logo"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {fieldErrors.logoUrl && (
                      <p
                        id="logo-error"
                        role="alert"
                        className="text-[11px] font-medium text-rose-500 flex items-center gap-1 px-1"
                      >
                        <AlertCircle className="size-3 shrink-0" />
                        <span>{fieldErrors.logoUrl}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinueToStep2}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Continue to Theme & Colors</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.section>
              )}

              {/* STEP 2: THEME & COLOR STUDIO */}
              {currentStep === 2 && (
                <motion.section
                  key="step2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  aria-labelledby="step2-heading"
                  className="bg-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 border border-border/80 shadow-xs"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div
                      className="size-8 rounded-xl bg-muted/70 border border-border flex items-center justify-center shrink-0"
                      style={{ color: primaryColor }}
                    >
                      <Palette className="size-4" />
                    </div>
                    <div>
                      <h2 id="step2-heading" className="text-sm font-semibold text-foreground">
                        Theme & Colors
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Select default appearance mode and configure brand colors
                      </p>
                    </div>
                  </div>

                  {/* 1. Theme Experience Selector */}
                  <div
                    role="radiogroup"
                    aria-label="Default appearance mode"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={modePreference === "dark"}
                      onClick={() => handleModeToggle("dark")}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        modePreference === "dark"
                          ? "bg-muted/70 border-border shadow-xs"
                          : "bg-background border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        modePreference === "dark"
                          ? { borderColor: primaryColor, backgroundColor: `${primaryColor}14` }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Moon
                          className="size-4"
                          style={modePreference === "dark" ? { color: primaryColor } : undefined}
                        />
                        <span className="text-xs font-semibold text-foreground">Dark Mode</span>
                      </div>
                      {modePreference === "dark" && (
                        <Check className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                      )}
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={modePreference === "light"}
                      onClick={() => handleModeToggle("light")}
                      className={cn(
                        "p-3 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        modePreference === "light"
                          ? "bg-muted/70 border-border shadow-xs"
                          : "bg-background border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                      style={
                        modePreference === "light"
                          ? { borderColor: primaryColor, backgroundColor: `${primaryColor}14` }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Sun
                          className="size-4"
                          style={modePreference === "light" ? { color: primaryColor } : undefined}
                        />
                        <span className="text-xs font-semibold text-foreground">Light Mode</span>
                      </div>
                      {modePreference === "light" && (
                        <Check className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                      )}
                    </button>
                  </div>

                  {/* 2. Curated Brand Palette Presets */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-foreground block">
                      Curated Palettes
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PALETTE_PRESETS.map((preset) => {
                        const isPresetActive =
                          primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                          secondaryColor.toLowerCase() === preset.secondary.toLowerCase();

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPalettePreset(preset)}
                            aria-label={`Apply ${preset.name} palette`}
                            className={cn(
                              "p-2 rounded-xl border text-left transition-all flex flex-col gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer",
                              isPresetActive
                                ? "bg-muted border-border ring-2 ring-primary/40 shadow-xs"
                                : "bg-card/70 border-border/70 hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-3 rounded-full border border-border shadow-2xs"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <span
                                className="size-3 rounded-full border border-border shadow-2xs"
                                style={{ backgroundColor: preset.secondary }}
                              />
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-foreground block truncate">
                                {preset.name}
                              </span>
                              <span className="text-[9px] text-muted-foreground block truncate">
                                {preset.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Color Target Switcher Tabs */}
                  <div
                    role="tablist"
                    aria-label="Color configuration target"
                    className="bg-muted/50 border border-border/80 rounded-xl p-1 flex gap-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={colorTarget === "primary"}
                      onClick={() => handleTargetTabChange("primary")}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        colorTarget === "primary"
                          ? "bg-card text-foreground shadow-xs border-border font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span>Primary Brand</span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={colorTarget === "secondary"}
                      onClick={() => handleTargetTabChange("secondary")}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 border cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        colorTarget === "secondary"
                          ? "bg-card text-foreground shadow-xs border-border font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span>Secondary Accent</span>
                    </button>
                  </div>

                  {/* 4. Harmonized Secondary Quick-Picks */}
                  {colorTarget === "secondary" && (
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/70 space-y-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground block">
                        Harmonize with Primary Brand
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyHarmonizedSecondary("analogous", "Analogous")}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer"
                        >
                          Analogous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            applyHarmonizedSecondary("complementary", "Complementary")
                          }
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer"
                        >
                          Complementary
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHarmonizedSecondary("split", "Split-Complementary")}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer"
                        >
                          Split
                        </button>
                        <button
                          type="button"
                          onClick={() => applyHarmonizedSecondary("monochrome", "Monochromatic")}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-card border border-border hover:bg-muted transition-all cursor-pointer"
                        >
                          Monochrome
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Complete HSL Sliders & Direct HEX Input */}
                  <div className="bg-muted/30 rounded-xl p-3.5 space-y-3 border border-border/80">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-6 rounded-lg shadow-xs border border-white/20 shrink-0"
                          style={{ backgroundColor: activeHex }}
                        />
                        <div className="relative">
                          <label htmlFor="hex-color-input" className="sr-only">
                            HEX Color Code
                          </label>
                          <input
                            id="hex-color-input"
                            type="text"
                            value={colorTarget === "primary" ? primaryColor : secondaryColor}
                            maxLength={7}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (colorTarget === "primary") {
                                setPrimaryColor(val);
                                const check = validateBrandColor(val, "Primary brand");
                                if (check.isValid) {
                                  setFieldError("primaryColor", undefined);
                                  const hsl = hexToHsl(check.formatted);
                                  setHue(hsl.h);
                                  setSaturation(hsl.s);
                                  setLightness(hsl.l);
                                  applyBrandCssVariables(check.formatted, secondaryColor);
                                } else if (touchedFields.primaryColor) {
                                  setFieldError("primaryColor", check.error);
                                }
                              } else {
                                setSecondaryColor(val);
                                const check = validateBrandColor(val, "Secondary accent");
                                if (check.isValid) {
                                  setFieldError("secondaryColor", undefined);
                                  const hsl = hexToHsl(check.formatted);
                                  setHue(hsl.h);
                                  setSaturation(hsl.s);
                                  setLightness(hsl.l);
                                  applyBrandCssVariables(primaryColor, check.formatted);
                                } else if (touchedFields.secondaryColor) {
                                  setFieldError("secondaryColor", check.error);
                                }
                              }
                            }}
                            onBlur={() => {
                              if (colorTarget === "primary") {
                                markFieldTouched("primaryColor");
                                const check = validateBrandColor(primaryColor, "Primary brand");
                                if (!check.isValid) {
                                  setFieldError("primaryColor", check.error);
                                } else {
                                  setPrimaryColor(check.formatted);
                                  setFieldError("primaryColor", undefined);
                                }
                              } else {
                                markFieldTouched("secondaryColor");
                                const check = validateBrandColor(secondaryColor, "Secondary accent");
                                if (!check.isValid) {
                                  setFieldError("secondaryColor", check.error);
                                } else {
                                  setSecondaryColor(check.formatted);
                                  setFieldError("secondaryColor", undefined);
                                }
                              }
                            }}
                            placeholder="#8B5CF6"
                            className={cn(
                              "w-24 uppercase font-mono text-xs font-semibold rounded-lg px-2.5 py-1 bg-background border transition-all text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                              (colorTarget === "primary" &&
                                touchedFields.primaryColor &&
                                fieldErrors.primaryColor) ||
                                (colorTarget === "secondary" &&
                                  touchedFields.secondaryColor &&
                                  fieldErrors.secondaryColor)
                                ? "border-rose-500 ring-1 ring-rose-500"
                                : "border-border"
                            )}
                            aria-invalid={
                              !!(
                                (colorTarget === "primary" &&
                                  touchedFields.primaryColor &&
                                  fieldErrors.primaryColor) ||
                                (colorTarget === "secondary" &&
                                  touchedFields.secondaryColor &&
                                  fieldErrors.secondaryColor)
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* WCAG Contrast Ratio Indicator */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-mono font-medium",
                          (colorTarget === "primary" ? primaryContrast : secondaryContrast) >= 3.0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        <Award className="size-3.5" />
                        <span>
                          {colorTarget === "primary" ? primaryContrast : secondaryContrast}:1 (
                          {(colorTarget === "primary" ? primaryContrast : secondaryContrast) >= 4.5
                            ? "WCAG AAA"
                            : (colorTarget === "primary" ? primaryContrast : secondaryContrast) >= 3.0
                            ? "WCAG AA"
                            : "Low Contrast"}
                          )
                        </span>
                      </div>
                    </div>

                    {((colorTarget === "primary" &&
                      touchedFields.primaryColor &&
                      fieldErrors.primaryColor) ||
                      (colorTarget === "secondary" &&
                        touchedFields.secondaryColor &&
                        fieldErrors.secondaryColor)) && (
                      <p
                        role="alert"
                        className="text-[11px] font-medium text-rose-500 flex items-center gap-1"
                      >
                        <AlertCircle className="size-3 shrink-0" />
                        <span>
                          {colorTarget === "primary"
                            ? fieldErrors.primaryColor
                            : fieldErrors.secondaryColor}
                        </span>
                      </p>
                    )}

                    {/* Rainbow Hue Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <label htmlFor="hue-slider" className="cursor-pointer">
                          Hue
                        </label>
                        <span className="font-mono text-xs">{hue}°</span>
                      </div>
                      <input
                        id="hue-slider"
                        type="range"
                        min="0"
                        max="360"
                        value={hue}
                        aria-label="Color hue degree"
                        aria-valuemin={0}
                        aria-valuemax={360}
                        aria-valuenow={hue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHue(val);
                          updateCurrentTargetFromHsl(val, saturation, lightness);
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background:
                            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                        }}
                      />
                    </div>

                    {/* Saturation Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <label htmlFor="saturation-slider" className="cursor-pointer">
                          Saturation
                        </label>
                        <span className="font-mono text-xs">{saturation}%</span>
                      </div>
                      <input
                        id="saturation-slider"
                        type="range"
                        min="0"
                        max="100"
                        value={saturation}
                        aria-label="Color saturation percentage"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={saturation}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSaturation(val);
                          updateCurrentTargetFromHsl(hue, val, lightness);
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
                        }}
                      />
                    </div>

                    {/* Lightness Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <label htmlFor="lightness-slider" className="cursor-pointer">
                          Lightness
                        </label>
                        <span className="font-mono text-xs">{lightness}%</span>
                      </div>
                      <input
                        id="lightness-slider"
                        type="range"
                        min="15"
                        max="85"
                        value={lightness}
                        aria-label="Color lightness percentage"
                        aria-valuemin={15}
                        aria-valuemax={85}
                        aria-valuenow={lightness}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLightness(val);
                          updateCurrentTargetFromHsl(hue, saturation, val);
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #000000, hsl(${hue}, ${saturation}%, 50%), #ffffff)`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-2 px-4 rounded-xl bg-card hover:bg-muted border border-border active:scale-95 text-xs font-medium transition-all flex items-center gap-1.5 text-foreground shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back to Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueToStep3}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Continue to Review & Launch</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.section>
              )}

              {/* STEP 3: REVIEW & LAUNCH */}
              {currentStep === 3 && (
                <motion.section
                  key="step3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  aria-labelledby="step3-heading"
                  className="bg-card rounded-2xl p-5 sm:p-7 flex flex-col gap-5 border border-border/80 shadow-xs"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                    <div
                      className="size-8 rounded-xl bg-muted/70 border border-border flex items-center justify-center shrink-0"
                      style={{ color: primaryColor }}
                    >
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h2 id="step3-heading" className="text-sm font-semibold text-foreground">
                        Review & Launch
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Review your details and visual identity before launching the portal
                      </p>
                    </div>
                  </div>

                  {/* 3 Summary Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* 1. Brand Identity Card */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                            <Building2 className="size-3.5" />
                            <span>Brand Identity</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            aria-label="Edit property details"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded cursor-pointer"
                          >
                            <Edit3 className="size-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        <div className="mt-3 flex items-start gap-3">
                          {logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={logoUrl}
                              alt="Brand Logo"
                              className="size-10 rounded-lg object-cover border border-border shrink-0 shadow-xs bg-background"
                            />
                          ) : (
                            <div className="h-10 px-2.5 rounded-lg border border-border/80 bg-background flex items-center justify-center shadow-xs shrink-0">
                              <Logo className="h-5 w-18" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xs font-semibold text-foreground truncate">
                              {propertyName || "Untitled Property"}
                            </h3>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {tagline || "No tagline configured"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Visual Theme & Palette Card */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                            <Palette className="size-3.5" />
                            <span>Theme & Colors</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            aria-label="Edit theme and colors"
                            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded cursor-pointer"
                          >
                            <Edit3 className="size-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">Primary Brand</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-3.5 rounded shadow-2xs border border-border"
                                style={{ backgroundColor: primaryColor }}
                              />
                              <span className="font-mono text-xs font-medium text-foreground">
                                {primaryColor.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">Secondary Accent</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-3.5 rounded shadow-2xs border border-border"
                                style={{ backgroundColor: secondaryColor }}
                              />
                              <span className="font-mono text-xs font-medium text-foreground">
                                {secondaryColor.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Default Mode</span>
                        <span className="font-medium capitalize text-foreground">
                          {modePreference} Mode
                        </span>
                      </div>
                    </div>

                    {/* 3. Landlord Profile Card */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                            <UserCheck className="size-3.5" />
                            <span>Landlord Profile</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Check className="size-3 stroke-[3]" />
                              <span>Active</span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">Name</span>
                            <span
                              className="text-xs font-medium text-foreground truncate max-w-[180px]"
                              title={
                                (profile?.full_name &&
                                !DISALLOWED_PRESEEDED_DATA.adminNames.includes(
                                  profile.full_name.toLowerCase()
                                )
                                  ? profile.full_name
                                  : "") ||
                                (user?.user_metadata?.full_name &&
                                !DISALLOWED_PRESEEDED_DATA.adminNames.includes(
                                  String(user.user_metadata.full_name).toLowerCase()
                                )
                                  ? user.user_metadata.full_name
                                  : "") ||
                                "Landlord"
                              }
                            >
                              {(profile?.full_name &&
                              !DISALLOWED_PRESEEDED_DATA.adminNames.includes(
                                profile.full_name.toLowerCase()
                              )
                                ? profile.full_name
                                : "") ||
                                (user?.user_metadata?.full_name &&
                                !DISALLOWED_PRESEEDED_DATA.adminNames.includes(
                                  String(user.user_metadata.full_name).toLowerCase()
                                )
                                  ? user.user_metadata.full_name
                                  : "") ||
                                "Landlord"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">Email</span>
                            <span
                              className="text-xs font-medium text-foreground truncate max-w-[180px]"
                              title={profile?.email || user?.email || ""}
                            >
                              {profile?.email || user?.email || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] text-muted-foreground">Role</span>
                            <span className="text-xs font-medium text-foreground">
                              Landlord
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Security</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          Permanent Credentials Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isLaunched ? (
                    <div className="pt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        disabled={isLaunching}
                        onClick={handleLaunchPortal}
                        className={cn(
                          "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none cursor-pointer",
                          isLaunching && "opacity-80 cursor-wait"
                        )}
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        {isLaunching ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Initializing Workspace...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3.5" />
                            <span>Launch Property Portal</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">
                            Portal Activated Successfully
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Your workspace is ready. Redirecting to your dashboard...
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          router.push("/landlord/dashboard");
                          if (typeof window !== "undefined") {
                            window.location.href = "/landlord/dashboard";
                          }
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    </motion.div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Live Preview Panel - Hidden on Step 3 */}
          {currentStep !== 3 && (
            <aside
              aria-label="Portal Live Preview"
              className="lg:col-span-5 lg:sticky lg:top-20"
            >
              <div className="bg-card rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border border-border/80 shadow-xs">
                {/* Preview Header Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Preview
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-muted-foreground capitalize">
                    {modePreference} mode
                  </span>
                </div>

                {/* Simulated Resident Portal UI Shell */}
                <div className="rounded-xl border border-border/70 bg-background/60 p-3 sm:p-3.5 space-y-3 shadow-2xs">
                  {/* Portal Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={logoUrl}
                          alt="Property Logo"
                          className="size-8 rounded-lg object-cover border border-border shrink-0 bg-background"
                        />
                      ) : (
                        <div className="h-7 px-2 rounded-md border border-border/60 bg-background flex items-center justify-center shadow-2xs shrink-0">
                          <Logo className="h-4.5 w-16" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {propertyName || "Property Name"}
                        </h4>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tagline || "Resident Portal"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resident Welcome & Payment Card */}
                  <div
                    className="rounded-xl p-3 border border-border/60 space-y-2.5 transition-colors"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 60%, ${secondaryColor}12 100%)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Welcome back
                        </span>
                        <span className="text-xs font-semibold text-foreground">Alex Rivera</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active Lease
                      </span>
                    </div>

                    <div className="bg-card/90 backdrop-blur-xs border border-border/80 rounded-lg p-2.5 flex items-center justify-between shadow-2xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Monthly Rent · Unit 204</p>
                        <p className="text-xs font-bold text-foreground">₱14,500.00</p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-md text-[10px] font-semibold shadow-2xs shrink-0"
                        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                      >
                        Pay Rent
                      </span>
                    </div>
                  </div>

                  {/* Quick Services Row */}
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center gap-2">
                      <div
                        className="size-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                      >
                        <CreditCard className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-foreground block truncate">
                          Payment History
                        </span>
                        <span className="text-[9px] text-muted-foreground block">
                          All up to date
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center gap-2">
                      <div
                        className="size-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                      >
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-foreground block truncate">
                          Lease Agreement
                        </span>
                        <span className="text-[9px] text-muted-foreground block">
                          Expires Dec 2026
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Color Swatch Summary */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="text-[10px] font-medium text-muted-foreground">Active Palette</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className="size-2.5 rounded-full border border-border shadow-2xs shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-foreground">{primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className="size-2.5 rounded-full border border-border shadow-2xs shrink-0"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span className="text-foreground">{secondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

    </div>
  );
}

export default function BusinessPersonalizationWizardPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading Setup Wizard..." />}>
      <WizardContent />
    </Suspense>
  );
}
