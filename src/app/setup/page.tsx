"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Check,
  RefreshCw,
  Upload,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Pipette,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";
import {
  getContrastTextColor,
  applyBrandCssVariables,
  hexToHsl,
  hslToHex,
} from "@/lib/branding/colors";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import {
  DISALLOWED_PRESEEDED_DATA,
  validatePropertyTradeName,
  validatePropertyTagline,
  validateStep1Identity,
  validateStep2Theme,
} from "@/lib/validation/brand-setup";
import { handleMediaSelection, MEDIA_ACCEPT_STRINGS } from "@/lib/validation/media-validation";
import { WizardShell } from "@/components/setup/WizardShell";
import { WizardStepper, StepItem } from "@/components/setup/WizardStepper";
import { setupDictionary } from "@/lib/i18n/setup-translations";

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
    name: "Sage Green & Slate",
    description: "Calm, clean, and gentle",
    primary: "#10b981",
    secondary: "#6366f1",
  },
  {
    id: "oceanic-royal",
    name: "Oceanic Navy & Cyan",
    description: "Professional, neat, and reliable",
    primary: "#2563eb",
    secondary: "#06b6d4",
  },
  {
    id: "forest-amber",
    name: "Forest Green & Warm Amber",
    description: "Natural, welcoming, and warm",
    primary: "#059669",
    secondary: "#d97706",
  },
  {
    id: "modern-violet",
    name: "Royal Violet & Rose",
    description: "Friendly, modern, and distinct",
    primary: "#7c3aed",
    secondary: "#f43f5e",
  },
  {
    id: "slate-sky",
    name: "Slate Gray & Sky Blue",
    description: "Simple, architectural, and cool",
    primary: "#0284c7",
    secondary: "#64748b",
  },
  {
    id: "ruby-gold",
    name: "Ruby Red & Gold",
    description: "Bold, energetic, and warm",
    primary: "#e11d48",
    secondary: "#f59e0b",
  },
];

const QUICK_COLOR_SWATCHES = [
  "#7c3aed",
  "#2563eb",
  "#0284c7",
  "#059669",
  "#10b981",
  "#d97706",
  "#ea580c",
  "#e11d48",
];

const WIZARD_STEPS: StepItem[] = [
  { id: 1, label: setupDictionary.step1PropertyName.stepLabel },
  { id: 2, label: setupDictionary.step2ThemeColor.stepLabel },
  { id: 3, label: setupDictionary.step4Logo.stepLabel },
];

const SETUP_STORAGE_KEY = "ireside_setup_inputs_draft";

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReconfigure =
    searchParams.get("reconfigure") === "true" || searchParams.get("troubleshoot") === "true";
  const { profile, user, loading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brand = useBrand();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepReached, setMaxStepReached] = useState<number>(1);
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  // Form Fields
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

  // Theme & Appearance
  const { resolvedTheme, setTheme } = useTheme();
  const [modePreference, setModePreference] = useState<"dark" | "light">("light");

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setModePreference(resolvedTheme);
    }
  }, [resolvedTheme]);

  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor || "#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor || "#f43f5e");

  // Field Validation & Interaction State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  // System Lock: prevent navigating away during mandatory setup
  const isSystemLocked = !isReconfigure && !isLaunched && !brand?.setupCompleted;

  useEffect(() => {
    if (!isSystemLocked) return;

    const trapHistory = () => {
      window.history.pushState(null, "", window.location.href);
    };
    trapHistory();

    const handlePopState = () => {
      trapHistory();
      toast.warning("Setup Required", {
        description: setupDictionary.wizardHeader.lockNotice,
        id: "setup-lock-popstate",
      });
    };
    window.addEventListener("popstate", handlePopState);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isSystemLocked]);

  // Initial setup check
  const hasCheckedSetupRef = useRef(false);
  useEffect(() => {
    if (loading || brand.isLoading) return;

    if (profile && profile.role === "tenant") {
      router.replace("/tenant/dashboard");
      return;
    }

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
        description: "Your property portal is already operational. You can update your brand in Settings.",
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

  // 1. Restore setup inputs draft from localStorage (exactly once on mount)
  const hasRestoredDraftRef = useRef(false);
  useEffect(() => {
    if (isReconfigure) return;
    if (hasRestoredDraftRef.current) return;
    hasRestoredDraftRef.current = true;

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
      const safePrimary =
        typeof draft.primaryColor === "string" && draft.primaryColor.startsWith("#")
          ? draft.primaryColor
          : undefined;
      const safeSecondary =
        typeof draft.secondaryColor === "string" && draft.secondaryColor.startsWith("#")
          ? draft.secondaryColor
          : undefined;
      if (safePrimary) {
        setPrimaryColor(safePrimary);
      }
      if (safeSecondary) {
        setSecondaryColor(safeSecondary);
      }
      if (safePrimary || safeSecondary) {
        applyBrandCssVariables(safePrimary, safeSecondary);
      }
      if (typeof draft.currentStep === "number" && draft.currentStep >= 1 && draft.currentStep <= 3) {
        setCurrentStep(draft.currentStep);
      }
      if (typeof draft.maxStepReached === "number" && draft.maxStepReached >= 1) {
        setMaxStepReached(Math.min(3, draft.maxStepReached));
      }
    } catch {
      // Storage unavailable or invalid JSON
    }
  }, [isReconfigure]);

  // 2. Persist setup inputs draft to localStorage
  useEffect(() => {
    if (isReconfigure || isLaunched || brand?.setupCompleted || !hasRestoredDraftRef.current) return;
    try {
      if (propertyName || tagline || logoUrl || primaryColor !== "#7c3aed" || currentStep > 1) {
        const draft = {
          propertyName,
          tagline,
          logoUrl,
          modePreference,
          primaryColor,
          secondaryColor,
          currentStep,
          maxStepReached: Math.max(maxStepReached, currentStep),
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
    maxStepReached,
    isReconfigure,
    isLaunched,
    brand?.setupCompleted,
  ]);

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

  const [customPrimaryInput, setCustomPrimaryInput] = useState(primaryColor);
  const [customSecondaryInput, setCustomSecondaryInput] = useState(secondaryColor);

  const isCustomSelected = !PALETTE_PRESETS.some(
    (p) => p.primary.toLowerCase() === primaryColor.toLowerCase()
  );

  const applyPalettePreset = (preset: PalettePreset) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setCustomPrimaryInput(preset.primary);
    setCustomSecondaryInput(preset.secondary);
    setFieldError("primaryColor", undefined);
    setFieldError("secondaryColor", undefined);
    applyBrandCssVariables(preset.primary, preset.secondary);
  };

  const handleCustomPrimaryChange = (val: string) => {
    let clean = val.trim();
    if (!clean.startsWith("#")) clean = `#${clean}`;
    setCustomPrimaryInput(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setPrimaryColor(clean);
      const hsl = hexToHsl(clean);
      const autoSec = hslToHex((hsl.h + 35) % 360, Math.min(hsl.s, 85), Math.max(hsl.l, 45));
      setSecondaryColor(autoSec);
      setCustomSecondaryInput(autoSec);
      setFieldError("primaryColor", undefined);
      setFieldError("secondaryColor", undefined);
      applyBrandCssVariables(clean, autoSec);
    }
  };

  const handleCustomSecondaryChange = (val: string) => {
    let clean = val.trim();
    if (!clean.startsWith("#")) clean = `#${clean}`;
    setCustomSecondaryInput(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setSecondaryColor(clean);
      setFieldError("secondaryColor", undefined);
      applyBrandCssVariables(primaryColor, clean);
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

  // Escape key closes confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConfirmationModal && !isLaunching) {
        setShowConfirmationModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showConfirmationModal, isLaunching]);

  // Step Navigation Handlers
  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
    setMaxStepReached((prev) => Math.min(3, Math.max(prev, stepNumber)));
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // ignore in test
      }
    }
  };

  const handleContinueFromStep1 = () => {
    markFieldTouched("propertyName");
    const check = validatePropertyTradeName(propertyName);
    if (!check.isValid) {
      setFieldError("propertyName", check.error);
      const el = document.getElementById("property-name-input");
      el?.focus();
      return;
    }
    if (tagline) {
      const tagCheck = validatePropertyTagline(tagline);
      if (!tagCheck.isValid) {
        setFieldError("tagline", tagCheck.error);
        const el = document.getElementById("tagline-input");
        el?.focus();
        return;
      }
    }
    setFieldError("propertyName", undefined);
    setFieldError("tagline", undefined);
    goToStep(2);
  };

  const handleContinueFromStep2 = () => {
    goToStep(3);
  };

  const handleContinueFromStep3 = () => {
    setShowConfirmationModal(true);
  };

  const handleLaunchPortal = async () => {
    const s1 = validateStep1Identity({
      propertyName,
      tagline,
    });
    const s2 = validateStep2Theme({ primaryColor, secondaryColor, modePreference });
    if (!s1.isValid) {
      setShowConfirmationModal(false);
      setFieldErrors((prev) => ({ ...prev, ...s1.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        propertyName: true,
        tagline: true,
      }));
      toast.error(Object.values(s1.errors)[0] || "Please enter a valid property name.");
      goToStep(1);
      return;
    }

    if (!s2.isValid) {
      setShowConfirmationModal(false);
      setFieldErrors((prev) => ({ ...prev, ...s2.errors }));
      toast.error(Object.values(s2.errors)[0] || "Please select a valid theme palette.");
      goToStep(2);
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
        false
      );

      applyBrandCssVariables(primaryColor, secondaryColor);

      try {
        localStorage.removeItem(SETUP_STORAGE_KEY);
      } catch {
        // best effort
      }

      if (typeof document !== "undefined") {
        document.cookie = "ireside_setup_completed=true; path=/; max-age=31536000; SameSite=Lax";
      }

      try {
        if (refreshProfile) {
          const res = refreshProfile();
          if (res && typeof res.catch === "function") {
            void res.catch(() => {});
          }
        }
      } catch {
        // non-blocking
      }

      try {
        const supabase = createClient();
        const sessionRes = supabase?.auth?.refreshSession?.();
        if (sessionRes && typeof sessionRes.catch === "function") {
          void sessionRes.catch(() => {});
        }
      } catch {
        // non-blocking
      }

      setShowConfirmationModal(false);
      setIsLaunched(true);
      toast.success("Property Portal Initialized", {
        description: `Branded as ${propertyName}. Opening your dashboard...`,
      });

      const navigateToDashboard = () => {
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
          window.location.replace("/landlord/dashboard");
        } else {
          router.push("/landlord/dashboard");
        }
      };

      setTimeout(navigateToDashboard, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to save setup: " + message);
    } finally {
      setIsLaunching(false);
    }
  };

  const primaryTextColor = getContrastTextColor(primaryColor);

  // Time estimate text
  const timeEstimates: Record<number, string> = {
    1: "About 1 minute left",
    2: "About 1 minute left",
    3: "Almost done!",
  };

  return (
    <WizardShell
      modePreference={modePreference}
      onToggleMode={handleModeToggle}
      isSystemLocked={isSystemLocked}
      onLockedLogoClick={() => {
        toast.warning("Setup Required", {
          description: setupDictionary.wizardHeader.lockNotice,
          id: "setup-lock-logo",
        });
      }}
    >
      {/* Hidden file input for logo */}
      <input
        id="logo-file-input"
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept={MEDIA_ACCEPT_STRINGS.branding_logo}
        aria-label="Upload property logo"
        className="hidden"
      />

      {/* Stepper with progress and clickable jump-back */}
      {!isLaunched && (
        <WizardStepper
          currentStep={currentStep}
          totalSteps={3}
          steps={WIZARD_STEPS}
          maxStepReached={maxStepReached}
          onStepClick={(id) => goToStep(id)}
          timeEstimate={timeEstimates[currentStep]}
        />
      )}

      {/* Main Single-Column Step Cards */}
      <div className="w-full">
        {isLaunched ? (
          <div
            className="bg-card rounded-3xl p-8 sm:p-12 border-2 border-emerald-500/40 text-center space-y-6 shadow-xl max-w-xl mx-auto"
          >
            <div className="size-20 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="size-12 stroke-[2.5]" />
            </div>

            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                {setupDictionary.celebration.badge}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {setupDictionary.celebration.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Branded as <span className="font-bold text-foreground">{propertyName}</span>. {setupDictionary.celebration.message}
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.replace("/landlord/dashboard");
                  } else {
                    router.push("/landlord/dashboard");
                  }
                }}
                className="w-full min-h-[56px] px-8 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer active:scale-95 text-white bg-emerald-600 hover:bg-emerald-700"
              >
                <span>{setupDictionary.celebration.cta}</span>
                <ArrowRight className="size-6 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
            /* STEP 1: PROPERTY NAME */
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-5"
            >
              {/* Step Header */}
              <div className="space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {setupDictionary.step1PropertyName.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {setupDictionary.step1PropertyName.instruction}
                </p>
              </div>

              {/* Form Input */}
              <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-xs space-y-4">
                {/* 1. Property Name (Required) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="property-name-input"
                      className="text-base sm:text-lg font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{setupDictionary.step1PropertyName.label}</span>
                      <span className="text-rose-600 font-bold" aria-hidden="true">*</span>
                    </label>
                    <span className="text-xs sm:text-sm font-mono text-muted-foreground">
                      {propertyName.length} / 80
                    </span>
                  </div>

                  <input
                    id="property-name-input"
                    type="text"
                    autoFocus
                    required
                    maxLength={80}
                    value={propertyName}
                    autoComplete="organization"
                    placeholder={setupDictionary.step1PropertyName.placeholder}
                    aria-required="true"
                    aria-invalid={!!(touchedFields.propertyName && fieldErrors.propertyName)}
                    aria-describedby={
                      touchedFields.propertyName && fieldErrors.propertyName
                        ? "property-name-error"
                        : "property-name-helper"
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleContinueFromStep1();
                      }
                    }}
                    className={cn(
                      "w-full min-h-[50px] px-4 rounded-xl border text-base font-semibold text-foreground bg-background transition-all focus:outline-none focus:ring-3",
                      touchedFields.propertyName && fieldErrors.propertyName
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-border/90 focus:border-primary focus:ring-primary/20"
                    )}
                  />

                  {touchedFields.propertyName && fieldErrors.propertyName ? (
                    <p
                      id="property-name-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 pt-0.5"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{fieldErrors.propertyName}</span>
                    </p>
                  ) : (
                    <p id="property-name-helper" className="text-xs sm:text-sm text-muted-foreground pt-0.5">
                      {setupDictionary.step1PropertyName.helper}
                    </p>
                  )}
                </div>

                {/* 2. Short Tagline (Optional) */}
                <div className="space-y-2 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="tagline-input"
                      className="text-base font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{setupDictionary.step3Tagline.label}</span>
                      <span className="text-muted-foreground font-normal text-xs sm:text-sm">
                        ({setupDictionary.common.optional})
                      </span>
                    </label>
                    <span className="text-xs sm:text-sm font-mono text-muted-foreground">
                      {tagline.length} / 120
                    </span>
                  </div>

                  <input
                    id="tagline-input"
                    type="text"
                    maxLength={120}
                    value={tagline}
                    placeholder={setupDictionary.step3Tagline.placeholder}
                    aria-invalid={!!(touchedFields.tagline && fieldErrors.tagline)}
                    aria-describedby={
                      touchedFields.tagline && fieldErrors.tagline
                        ? "tagline-error"
                        : "tagline-helper"
                    }
                    onChange={(e) => {
                      setTagline(e.target.value);
                      if (touchedFields.tagline) {
                        setFieldError("tagline", validatePropertyTagline(e.target.value).error);
                      }
                    }}
                    onBlur={() => {
                      markFieldTouched("tagline");
                      setFieldError("tagline", validatePropertyTagline(tagline).error);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleContinueFromStep1();
                      }
                    }}
                    className={cn(
                      "w-full min-h-[50px] px-4 rounded-xl border text-base font-medium text-foreground bg-background transition-all focus:outline-none focus:ring-3",
                      touchedFields.tagline && fieldErrors.tagline
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-border/90 focus:border-primary focus:ring-primary/20"
                    )}
                  />

                  {touchedFields.tagline && fieldErrors.tagline ? (
                    <p
                      id="tagline-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 pt-0.5"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{fieldErrors.tagline}</span>
                    </p>
                  ) : (
                    <p id="tagline-helper" className="text-xs sm:text-sm text-muted-foreground pt-0.5">
                      {setupDictionary.step3Tagline.helper}
                    </p>
                  )}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="space-y-4 pt-1">
                <button
                  type="button"
                  onClick={handleContinueFromStep1}
                  className="w-full min-h-[54px] rounded-2xl bg-primary text-primary-foreground font-black text-lg transition-all hover:bg-primary/95 active:scale-[0.99] flex items-center justify-center gap-3 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>{setupDictionary.common.continue}</span>
                  <ArrowRight className="size-6 stroke-[3]" />
                </button>
              </div>
            </motion.div>
          ) : currentStep === 2 ? (
            /* STEP 2: THEME COLOR */
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {setupDictionary.step2ThemeColor.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {setupDictionary.step2ThemeColor.instruction}
                </p>
              </div>

              {/* 2-Column Responsive Preset Grid (Compact, no tall scrolling) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Theme Color Styles">
                {PALETTE_PRESETS.map((preset) => {
                  const isSelected =
                    primaryColor.toLowerCase() === preset.primary.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => applyPalettePreset(preset)}
                      className={cn(
                        "p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                          : "border-border/80 hover:border-border bg-card hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="flex -space-x-1.5 shrink-0">
                          <span
                            className="size-6 sm:size-7 rounded-full border-2 border-background shadow-xs"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span
                            className="size-6 sm:size-7 rounded-full border-2 border-background shadow-xs"
                            style={{ backgroundColor: preset.secondary }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-bold text-foreground truncate">
                            {preset.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Prominent Custom Color Picker Section */}
              <div
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-3 bg-card",
                  isCustomSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                    : "border-border/80"
                )}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <Pipette className="size-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-foreground">
                        {setupDictionary.step2ThemeColor.customColor?.title || "Pick Your Own Color"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {setupDictionary.step2ThemeColor.customColor?.description || "Tap the color circle or type your HEX code"}
                      </p>
                    </div>
                  </div>

                  {isCustomSelected && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      Custom Color Active
                    </span>
                  )}
                </div>

                {/* Color Picker Controls & Quick Swatches */}
                <div className="flex items-center gap-4 flex-wrap pt-1">
                  {/* Primary Color Picker Input */}
                  <div className="flex items-center gap-2 bg-muted/50 p-1.5 sm:p-2 rounded-xl border border-border/70">
                    <label
                      htmlFor="custom-primary-color-input"
                      className="size-8 sm:size-9 rounded-lg border-2 border-border shadow-xs cursor-pointer relative shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: primaryColor }}
                      title="Tap to open color wheel"
                    >
                      <input
                        id="custom-primary-color-input"
                        type="color"
                        value={primaryColor.startsWith("#") && primaryColor.length === 7 ? primaryColor : "#7c3aed"}
                        onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        aria-label="Pick custom primary color"
                      />
                    </label>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Main Color
                      </span>
                      <input
                        type="text"
                        maxLength={7}
                        value={customPrimaryInput}
                        onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                        className="w-20 font-mono text-xs font-bold bg-background text-foreground px-1.5 py-0.5 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                        placeholder="#7C3AED"
                        aria-label="Custom primary hex code"
                      />
                    </div>
                  </div>

                  {/* Secondary Color Picker Input */}
                  <div className="flex items-center gap-2 bg-muted/50 p-1.5 sm:p-2 rounded-xl border border-border/70">
                    <label
                      htmlFor="custom-secondary-color-input"
                      className="size-8 sm:size-9 rounded-lg border-2 border-border shadow-xs cursor-pointer relative shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ backgroundColor: secondaryColor }}
                      title="Tap to open accent color wheel"
                    >
                      <input
                        id="custom-secondary-color-input"
                        type="color"
                        value={secondaryColor.startsWith("#") && secondaryColor.length === 7 ? secondaryColor : "#f43f5e"}
                        onChange={(e) => handleCustomSecondaryChange(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        aria-label="Pick custom accent color"
                      />
                    </label>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Accent Color
                      </span>
                      <input
                        type="text"
                        maxLength={7}
                        value={customSecondaryInput}
                        onChange={(e) => handleCustomSecondaryChange(e.target.value)}
                        className="w-20 font-mono text-xs font-bold bg-background text-foreground px-1.5 py-0.5 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                        placeholder="#F43F5E"
                        aria-label="Custom accent hex code"
                      />
                    </div>
                  </div>

                  {/* Quick Color Dots */}
                  <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                    {QUICK_COLOR_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleCustomPrimaryChange(hex)}
                        title={`Select ${hex}`}
                        aria-label={`Select color ${hex}`}
                        className={cn(
                          "size-6 sm:size-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-xs",
                          primaryColor.toLowerCase() === hex.toLowerCase()
                            ? "border-primary ring-2 ring-primary/40 scale-105"
                            : "border-background"
                        )}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleContinueFromStep2}
                  className="w-full min-h-[54px] rounded-2xl bg-primary text-primary-foreground font-black text-lg transition-all hover:bg-primary/95 active:scale-[0.99] flex items-center justify-center gap-3 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>{setupDictionary.common.continue}</span>
                  <ArrowRight className="size-6 stroke-[3]" />
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="min-h-[44px] px-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    <span>{setupDictionary.common.back}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* STEP 3: PROPERTY LOGO (OPTIONAL) */
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {setupDictionary.step4Logo.title}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {setupDictionary.step4Logo.instruction}
                </p>
              </div>

              {/* Logo Preview & Action Box */}
              <div className="bg-card rounded-2xl p-5 sm:p-6 border border-border/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Uploaded Property Logo"
                      className="size-20 rounded-2xl object-cover border-2 border-border shadow-md bg-background shrink-0"
                    />
                  ) : (
                    <div className="size-20 rounded-2xl border-2 border-dashed border-border/80 bg-muted/30 flex flex-col items-center justify-center text-muted-foreground shrink-0 shadow-inner">
                      <ImageIcon className="size-7 stroke-[1.5] mb-1" />
                      <span className="text-[10px] font-bold">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <p className="text-base sm:text-lg font-bold text-foreground">
                        {logoUrl
                          ? setupDictionary.step4Logo.currentLogo
                          : setupDictionary.step4Logo.defaultLogoActive}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {setupDictionary.step4Logo.fileLimits}
                      </p>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[42px] px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Upload className="size-4" />
                        <span>
                          {logoUrl
                            ? setupDictionary.step4Logo.changeButton
                            : setupDictionary.step4Logo.uploadButton}
                        </span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="min-h-[42px] px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Trash2 className="size-4" />
                          <span>{setupDictionary.step4Logo.removeButton}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleContinueFromStep3}
                  className="w-full min-h-[54px] rounded-2xl bg-primary text-primary-foreground font-black text-lg transition-all hover:bg-primary/95 active:scale-[0.99] flex items-center justify-center gap-3 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span>{setupDictionary.step4Logo.reviewAction}</span>
                  <ArrowRight className="size-6 stroke-[3]" />
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="min-h-[44px] px-4 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="size-4" />
                    <span>{setupDictionary.common.back}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </div>

      {/* CONFIRMATION / REVIEW MODAL */}
      <AnimatePresence>
        {showConfirmationModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isLaunching) {
                setShowConfirmationModal(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-card rounded-3xl border border-border/80 shadow-2xl p-5 sm:p-7 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <h2 id="review-modal-title" className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {setupDictionary.step6Review.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {setupDictionary.step6Review.instruction}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => setShowConfirmationModal(false)}
                  aria-label="Close review modal"
                  className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Review Details Table */}
              <div className="bg-muted/30 rounded-2xl border border-border/70 divide-y divide-border/60 overflow-hidden">
                {/* 1. Property Name */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {setupDictionary.step6Review.fields.propertyName}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-foreground truncate block">
                      {propertyName || "Not specified"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => {
                      setShowConfirmationModal(false);
                      goToStep(1);
                    }}
                    className="min-h-[36px] px-3 rounded-lg hover:bg-muted text-primary font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    aria-label={`Edit ${setupDictionary.step6Review.fields.propertyName}`}
                  >
                    <Edit2 className="size-3.5" />
                    <span>{setupDictionary.common.edit}</span>
                  </button>
                </div>

                {/* 2. Theme Color */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {setupDictionary.step6Review.fields.themeColor}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="size-4.5 rounded-full border border-background shadow-xs shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-sm sm:text-base font-bold text-foreground truncate">
                        {PALETTE_PRESETS.find(
                          (p) => p.primary.toLowerCase() === primaryColor.toLowerCase()
                        )?.name || primaryColor}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => {
                      setShowConfirmationModal(false);
                      goToStep(2);
                    }}
                    className="min-h-[36px] px-3 rounded-lg hover:bg-muted text-primary font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    aria-label={`Edit ${setupDictionary.step6Review.fields.themeColor}`}
                  >
                    <Edit2 className="size-3.5" />
                    <span>{setupDictionary.common.edit}</span>
                  </button>
                </div>

                {/* 3. Tagline */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {setupDictionary.step6Review.fields.tagline}
                    </span>
                    <span className="text-sm sm:text-base font-medium text-foreground truncate block">
                      {tagline || setupDictionary.step6Review.fields.taglineEmpty}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => {
                      setShowConfirmationModal(false);
                      goToStep(1);
                    }}
                    className="min-h-[36px] px-3 rounded-lg hover:bg-muted text-primary font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    aria-label={`Edit ${setupDictionary.step6Review.fields.tagline}`}
                  >
                    <Edit2 className="size-3.5" />
                    <span>{setupDictionary.common.edit}</span>
                  </button>
                </div>

                {/* 4. Logo */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-muted-foreground block">
                      {setupDictionary.step6Review.fields.logo}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo thumbnail"
                          className="size-6 rounded-md object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          <ImageIcon className="size-3.5" />
                        </div>
                      )}
                      <span className="text-sm sm:text-base font-medium text-foreground truncate">
                        {logoUrl
                          ? setupDictionary.step6Review.fields.logoCustom
                          : setupDictionary.step6Review.fields.logoDefault}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => {
                      setShowConfirmationModal(false);
                      goToStep(3);
                    }}
                    className="min-h-[36px] px-3 rounded-lg hover:bg-muted text-primary font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                    aria-label={`Edit ${setupDictionary.step6Review.fields.logo}`}
                  >
                    <Edit2 className="size-3.5" />
                    <span>{setupDictionary.common.edit}</span>
                  </button>
                </div>
              </div>

              {/* Final Submit Primary Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  data-testid="submit-setup-btn"
                  type="button"
                  disabled={isLaunching}
                  onClick={handleLaunchPortal}
                  className={cn(
                    "w-full min-h-[54px] rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2",
                    isLaunching
                      ? "opacity-75 cursor-wait"
                      : "cursor-pointer hover:shadow-xl"
                  )}
                  style={{
                    backgroundColor: primaryColor,
                    color: primaryTextColor,
                  }}
                >
                  {isLaunching ? (
                    <>
                      <RefreshCw className="size-5 animate-spin" />
                      <span>{setupDictionary.step6Review.submitting}</span>
                    </>
                  ) : (
                    <>
                      <span>{setupDictionary.step6Review.submitButton}</span>
                      <ArrowRight className="size-5 sm:size-6 stroke-[3]" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => setShowConfirmationModal(false)}
                  className="w-full min-h-[44px] rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {setupDictionary.step6Review.closeModal || "Go Back & Edit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </WizardShell>
  );
}

export default function BusinessPersonalizationWizardPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading Setup Wizard..." />}>
      <WizardContent />
    </Suspense>
  );
}
