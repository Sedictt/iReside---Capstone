"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  AlertCircle,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Home,
  Bed,
  DoorClosed,
  Check,
  User,
  Mail,
  Lock,
  Phone,
  RefreshCw,
  Eye,
  Award,
  Upload,
  Image as ImageIcon,
  Trash2,
  CreditCard,
  Contrast,
  Edit3,
  KeyRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useHighContrast } from "@/hooks/useHighContrast";
import { HighContrastToggle } from "@/components/ui/HighContrastToggle";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";
import { applyBrandCssVariables } from "@/lib/branding/colors";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { SecurityKeyDisplayCard } from "@/components/auth/SecurityKeyDisplayCard";
import {
  validatePropertyTradeName,
  validatePropertyTagline,
  validateRentalArchetype,
  validateTotalUnits,
  validatePropertyAddress,
  validateBrandColor,
  validateLogoFile,
  validateAdminFullName,
  validateAdminEmail,
  validateAdminPhone,
  validateAdminPassword,
  validateConfirmPassword,
  validateStep1Identity,
  validateStep2Theme,
  validateStep3Admin,
  validateAllBrandSetup,
} from "@/lib/validation/brand-setup";
import { evaluatePasswordStrength } from "@/lib/validation/landlord-settings";


// HSL to HEX helper
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// HEX to HSL helper
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Relative Luminance & WCAG Contrast Ratio
function getLuminance(hex: string): number {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const rgb = [
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255,
  ].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(1));
}

// Dynamic Contrast Aware Text Helper
function getContrastTextColor(bgHex: string): string {
  const lum = getLuminance(bgHex);
  return lum > 0.38 ? "#09090b" : "#ffffff";
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReconfigure = searchParams.get("reconfigure") === "true" || searchParams.get("troubleshoot") === "true";
  const { profile, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const brand = useBrand();

  useEffect(() => {
    if (!loading && profile && profile.role === "tenant") {
      router.replace("/tenant/dashboard");
      return;
    }

    // Completion Lock: Redirect to dashboard if setup is already finalized unless in reconfigure mode
    if (!loading && brand && brand.setupCompleted && !isReconfigure) {
      toast.info("Setup already finalized", {
        description: "Your property portal is already operational. You can update your brand in Settings.",
      });
      router.replace("/landlord/dashboard");
    }
  }, [loading, profile, brand, brand.setupCompleted, isReconfigure, router]);

  // Pre-fill profile info from authenticated user if available
  useEffect(() => {
    if (profile) {
      if (profile.full_name && profile.full_name !== "Default Admin") {
        setAdminName(profile.full_name);
      }
      if (profile.email && !profile.email.includes("turnkey.local")) {
        setAdminEmail(profile.email);
        setInitialEmail(profile.email);
        setIsEmailVerified(true);
      }
      if (profile.phone) {
        setAdminPhone(profile.phone);
      }
    }
  }, [profile]);

  // Step 1: Identity, Archetype & Logo
  const [propertyName, setPropertyName] = useState(brand.propertyName || "Reyes Residences");
  const [tagline, setTagline] = useState(brand.propertyTagline || "Premier Student & Residential Living in Valenzuela");
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logoUrl);
  const [propertyArchetype, setPropertyArchetype] = useState<"apartment" | "dormitory" | "boarding_house">(
    brand.rentalArchetype || "apartment"
  );

  // Step 2: Light / Dark Mode & Modern HSL Palette
  const { resolvedTheme, setTheme } = useTheme();
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  const [modePreference, setModePreference] = useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setModePreference(resolvedTheme);
    }
  }, [resolvedTheme]);

  const [colorTarget, setColorTarget] = useState<"primary" | "secondary">("primary");
  const [selectedHarmonyRule, setSelectedHarmonyRule] = useState<
    "analogous" | "complementary" | "split" | "monochrome"
  >("analogous");

  // HSL Component States
  const [hue, setHue] = useState(264);
  const [saturation, setSaturation] = useState(90);
  const [lightness, setLightness] = useState(62);

  const [primaryColor, setPrimaryColor] = useState(brand.primaryColor || "#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState(brand.secondaryColor || "#06b6d4");

  // Step 3: Landlord Account & Email OTP State
  const [adminName, setAdminName] = useState("Roberto Reyes");
  const [adminEmail, setAdminEmail] = useState("landlord@reyesresidences.com");
  const [initialEmail, setInitialEmail] = useState("landlord@reyesresidences.com");
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [adminPassword, setAdminPassword] = useState("••••••••••••");
  const [confirmPassword, setConfirmPassword] = useState("••••••••••••");
  const [adminPhone, setAdminPhone] = useState("0917-882-9912");

  // OTP Resend Cooldown Timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  // Step 4: Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);
  const [launchedSecurityKey, setLaunchedSecurityKey] = useState<string | null>(null);
  const [isSecurityKeyAcknowledged, setIsSecurityKeyAcknowledged] = useState(false);

  // Field Validation & Interaction State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const isExistingPasswordPlaceholder = adminPassword === "••••••••••••";
  const passwordStrength = useMemo(() => {
    if (isExistingPasswordPlaceholder || !adminPassword) {
      return null;
    }
    return evaluatePasswordStrength(adminPassword);
  }, [adminPassword, isExistingPasswordPlaceholder]);

  const handleEmailChange = (newVal: string) => {
    setAdminEmail(newVal);
    const normalizedNew = newVal.trim().toLowerCase();
    const normalizedInit = initialEmail.trim().toLowerCase();
    if (normalizedInit && normalizedNew === normalizedInit) {
      setIsEmailVerified(true);
      setOtpSent(false);
    } else {
      setIsEmailVerified(false);
      setOtpSent(false);
    }
    if (touchedFields.adminEmail) {
      setFieldError("adminEmail", validateAdminEmail(newVal).error);
    }
  };

  const handleSendEmailOtp = async () => {
    const check = validateAdminEmail(adminEmail);
    if (!check.isValid) {
      setFieldError("adminEmail", check.error);
      toast.error(check.error || "Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/setup/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: adminEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }
      setOtpSent(true);
      setOtpCooldown(60);
      toast.success(data.message || `Verification code sent to ${adminEmail.trim()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/setup/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: adminEmail.trim(),
          otp: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code.");
      }
      setInitialEmail(adminEmail.trim());
      setIsEmailVerified(true);
      setOtpSent(false);
      setOtpCode("");
      toast.success("Email verified and successfully linked!");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleContinueToStep2 = () => {
    const check = validateStep1Identity({
      propertyName,
      tagline,
      propertyArchetype,
    });

    if (!check.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...check.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        propertyName: true,
        tagline: true,
        propertyArchetype: true,
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

  const handleContinueToStep4 = () => {
    if (!isEmailVerified) {
      toast.error("Please verify your new email address with the 6-digit code before continuing.");
      return;
    }

    const check = validateStep3Admin({
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      confirmPassword,
      isExistingPlaceholder: isExistingPasswordPlaceholder,
    });

    if (!check.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...check.errors }));
      setTouchedFields((prev) => ({
        ...prev,
        adminName: true,
        adminEmail: true,
        adminPhone: true,
        adminPassword: true,
        confirmPassword: true,
      }));
      const firstMsg = Object.values(check.errors)[0];
      toast.error(firstMsg || "Please fix the errors in Step 3 before continuing.");
      return;
    }

    setCurrentStep(4);
  };

  // Contrast calculations
  const surfaceHex = modePreference === "dark" ? "#09090b" : "#ffffff";
  const primaryContrast = getContrastRatio(primaryColor, surfaceHex);
  const secondaryContrast = getContrastRatio(secondaryColor, surfaceHex);
  const primaryTextColor = getContrastTextColor(primaryColor);
  const secondaryTextColor = getContrastTextColor(secondaryColor);

  const activeHex = colorTarget === "primary" ? primaryColor : secondaryColor;

  // Harmonized palette generator
  const getHarmonies = (baseHue: number) => {
    return {
      analogous: hslToHex((baseHue + 35) % 360, 85, 58),
      complementary: hslToHex((baseHue + 180) % 360, 85, 58),
      split: hslToHex((baseHue + 150) % 360, 85, 58),
      monochrome: hslToHex(baseHue, Math.max(20, saturation - 40), Math.min(85, lightness + 15)),
    };
  };

  const currentHarmonies = getHarmonies(colorTarget === "primary" ? hue : hexToHsl(primaryColor).h);
  const harmonyAnalogous = currentHarmonies.analogous;
  const harmonyComplementary = currentHarmonies.complementary;
  const harmonySplit = currentHarmonies.split;
  const harmonyMonochrome = currentHarmonies.monochrome;

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

  const applySecondaryHarmony = (
    rule: "analogous" | "complementary" | "split" | "monochrome",
    hex: string,
    label: string
  ) => {
    setSelectedHarmonyRule(rule);
    setSecondaryColor(hex);
    setFieldError("secondaryColor", undefined);
    applyBrandCssVariables(primaryColor, hex);
    if (colorTarget === "secondary") {
      const hsl = hexToHsl(hex);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
    toast.success(`Applied ${label} Accent: ${hex}`);
  };

  const handleModeToggle = (mode: "light" | "dark") => {
    setModePreference(mode);
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setTheme(mode);
      });
    } else {
      setTheme(mode);
    }
    toast.info(`Switched default to ${mode.toUpperCase()} mode`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateLogoFile({ size: file.size, type: file.type, name: file.name });
    if (!check.isValid) {
      toast.error(check.error || "Please upload a valid image file (PNG, JPG, WebP, SVG) under 5MB.");
      setFieldError("logoUrl", check.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFieldError("logoUrl", undefined);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      toast.success("Property logo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setFieldError("logoUrl", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Logo reset to auto-generated monogram badge.");
  };

  const handleLaunchPortal = async () => {
    if (!isEmailVerified) {
      toast.error("Please verify your email address before launching.");
      setCurrentStep(3);
      return;
    }

    // 0. Full comprehensive validation across all fields
    const fullCheck = validateAllBrandSetup(
      { propertyName, tagline, propertyArchetype },
      { primaryColor, secondaryColor, modePreference },
      { adminName, adminEmail, adminPhone, adminPassword, confirmPassword, isExistingPlaceholder: isExistingPasswordPlaceholder }
    );

    if (!fullCheck.isValid) {
      setFieldErrors(fullCheck.errors);
      const allTouched: Record<string, boolean> = {};
      for (const k of Object.keys(fullCheck.errors)) {
        allTouched[k] = true;
      }
      setTouchedFields((prev) => ({ ...prev, ...allTouched }));

      if (fullCheck.firstErrorStep) {
        setCurrentStep(fullCheck.firstErrorStep);
      }
      const firstErr = Object.values(fullCheck.errors)[0];
      toast.error(`Please correct errors in Step ${fullCheck.firstErrorStep || 1}: ${firstErr}`);
      return;
    }

    setIsLaunching(true);
    try {
      // 1. Call atomic setup launch API to claim credentials & save setup state
      const res = await fetch("/api/setup/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branding: {
            propertyName: propertyName.trim(),
            propertyTagline: tagline.trim() || undefined,
            rentalArchetype: propertyArchetype,
            primaryColor,
            secondaryColor,
            logoUrl,
          },
          admin: {
            fullName: adminName.trim(),
            email: adminEmail.trim(),
            password: adminPassword !== "••••••••••••" ? adminPassword : undefined,
            phone: adminPhone.trim(),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.details) {
          setFieldErrors((prev) => ({ ...prev, ...json.details }));
        }
        throw new Error(json.error || "Failed to launch workspace");
      }

      // 2. Update local BrandContext state with setup_completed: true
      await brand.updateBranding(
        {
          propertyName: propertyName.trim(),
          propertyTagline: tagline.trim(),
          rentalArchetype: propertyArchetype,
          primaryColor,
          secondaryColor,
          logoUrl,
          setupCompleted: true,
          setupCompletedAt: new Date().toISOString(),
        },
        false // already saved in database by /api/setup/launch
      );
      if (json.securityKey) {
        setLaunchedSecurityKey(json.securityKey);
      }
      setIsLaunched(true);
      toast.success("Property Portal Initialized!", {
        description: `Branded as ${propertyName}. Landlord Account operational.`,
      });
    } catch (err: any) {
      toast.error("Failed to save setup: " + (err?.message || "Unknown error"));
    } finally {
      setIsLaunching(false);
    }
  };


  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getArchetypeLabel = () => {
    switch (propertyArchetype) {
      case "apartment":
        return "Apartment Complex";
      case "dormitory":
        return "Student Dormitory";
      case "boarding_house":
        return "Boarding House";
    }
  };

  const stepsList = [
    { num: 1, label: "Identity & Archetype", icon: Building2 },
    { num: 2, label: "Theme & Palette", icon: Palette },
    { num: 3, label: "Landlord Account", icon: UserCheck },
    { num: 4, label: "Review & Launch", icon: ShieldCheck },
  ];

  return (
    <div className="h-screen max-h-screen overflow-y-auto lg:overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col justify-between transition-colors duration-200">
      {/* Hidden Logo Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        className="hidden"
      />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:opacity-85 active:scale-95 shrink-0"
          >
            <Logo className="h-8 w-26 sm:h-9 sm:w-28" />
          </Link>
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5" style={{ color: primaryColor }} />
              Workspace Setup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <HighContrastToggle />

          <button
            type="button"
            onClick={() => handleModeToggle(modePreference === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 active:scale-95 overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {modePreference === "dark" ? (
                <motion.span
                  key="light-mode"
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200"
                >
                  <Sun className="size-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </motion.span>
              ) : (
                <motion.span
                  key="dark-mode"
                  initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200"
                >
                  <Moon className="size-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span className="hidden sm:inline">Dark</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-md text-xs font-bold font-mono text-zinc-600 dark:text-zinc-300">
            <span style={{ color: primaryColor }} className="font-black">{isLaunched ? "✓" : currentStep}</span> / 4
          </div>
        </div>
      </nav>

      {/* Main Workspace (Fitted & Proportionate) */}
      <main
        className={cn(
          "flex-1 w-full mx-auto px-4 py-2.5 sm:py-3 flex flex-col justify-center gap-2.5 transition-all",
          currentStep === 4 ? "max-w-4xl" : "max-w-5xl"
        )}
      >
        {/* Minimal Toned-down Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            Business Personalization Setup
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure your property branding, logo, custom palette, and landlord account credentials.
          </p>
        </div>

        {/* Clean Segmented Step Bar */}
        <div className="w-full bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/70 dark:border-zinc-800 rounded-xl p-1 flex gap-1" role="tablist">
          {stepsList.map((step) => {
            const isActive = currentStep === step.num;
            const isDone = currentStep > step.num || isLaunched;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (step.num === currentStep) return;
                  if (step.num < currentStep || isDone) {
                    setCurrentStep(step.num as 1 | 2 | 3 | 4);
                    return;
                  }
                  if (step.num === 2) {
                    handleContinueToStep2();
                  } else if (step.num === 3) {
                    const s1 = validateStep1Identity({ propertyName, tagline, propertyArchetype });
                    if (!s1.isValid) {
                      setFieldErrors((prev) => ({ ...prev, ...s1.errors }));
                      setTouchedFields((prev) => ({ ...prev, propertyName: true, tagline: true, propertyArchetype: true }));
                      toast.error(Object.values(s1.errors)[0] || "Please complete Step 1 first.");
                      setCurrentStep(1);
                      return;
                    }
                    handleContinueToStep3();
                  } else if (step.num === 4) {
                    const s1 = validateStep1Identity({ propertyName, tagline, propertyArchetype });
                    if (!s1.isValid) {
                      setFieldErrors((prev) => ({ ...prev, ...s1.errors }));
                      setTouchedFields((prev) => ({ ...prev, propertyName: true, tagline: true, propertyArchetype: true }));
                      toast.error(Object.values(s1.errors)[0] || "Please complete Step 1 first.");
                      setCurrentStep(1);
                      return;
                    }
                    const s2 = validateStep2Theme({ primaryColor, secondaryColor, modePreference });
                    if (!s2.isValid) {
                      setFieldErrors((prev) => ({ ...prev, ...s2.errors }));
                      setTouchedFields((prev) => ({ ...prev, primaryColor: true, secondaryColor: true }));
                      toast.error(Object.values(s2.errors)[0] || "Please complete Step 2 first.");
                      setCurrentStep(2);
                      return;
                    }
                    handleContinueToStep4();
                  }
                }}

                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700"
                    : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
                style={isActive ? { color: primaryColor } : undefined}
              >
                <div
                  className={cn(
                    "size-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isActive
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "bg-zinc-300/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  )}
                  style={isActive && !isDone ? { backgroundColor: primaryColor, color: primaryTextColor } : undefined}
                >
                  {isDone ? <Check className="size-3 stroke-[3]" /> : step.num}
                </div>
                <span className="hidden sm:inline text-[11px] truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace Layout */}
        <div
          className={cn(
            "grid gap-3.5 items-start",
            currentStep === 4 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"
          )}
        >
          {/* Main Form Column */}
          <div
            className={cn(
              "flex flex-col gap-3",
              currentStep === 4 ? "w-full" : "lg:col-span-7"
            )}
          >
            <AnimatePresence mode="wait">
              {/* STEP 1: IDENTITY, ARCHETYPE & LOGO */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                          Step 1: Property Identity & Logo
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Set your property brand name, custom logo, and rental archetype
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Brand Name & Tagline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Property Trade Name <span className="text-rose-500">*</span>
                          </label>
                          <span
                            className={cn(
                              "text-[9px] font-mono",
                              propertyName.length > 80 ? "text-rose-500 font-bold" : "text-zinc-400"
                            )}
                          >
                            {propertyName.length}/80
                          </span>
                        </div>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 transition-all",
                            touchedFields.propertyName && fieldErrors.propertyName
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <input
                            type="text"
                            value={propertyName}
                            maxLength={80}
                            onChange={(e) => {
                              setPropertyName(e.target.value);
                              if (touchedFields.propertyName) {
                                setFieldError("propertyName", validatePropertyTradeName(e.target.value).error);
                              }
                            }}
                            onBlur={() => {
                              markFieldTouched("propertyName");
                              setFieldError("propertyName", validatePropertyTradeName(propertyName).error);
                            }}
                            placeholder="e.g. Reyes Residences"
                            className="bg-transparent border-none outline-none w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.propertyName && fieldErrors.propertyName)}
                          />
                        </div>
                        {touchedFields.propertyName && fieldErrors.propertyName && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.propertyName}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Tagline / Subtitle
                          </label>
                          <span
                            className={cn(
                              "text-[9px] font-mono",
                              tagline.length > 120 ? "text-rose-500 font-bold" : "text-zinc-400"
                            )}
                          >
                            {tagline.length}/120
                          </span>
                        </div>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 transition-all",
                            touchedFields.tagline && fieldErrors.tagline
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <input
                            type="text"
                            value={tagline}
                            maxLength={120}
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
                            placeholder="e.g. Premier Student Living"
                            className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.tagline && fieldErrors.tagline)}
                          />
                        </div>
                        {touchedFields.tagline && fieldErrors.tagline && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.tagline}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Logo Customizer Component */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={logoUrl}
                            alt="Property Logo"
                            className="size-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
                          />
                        ) : (
                          <div
                            className="size-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                          >
                            {getInitials(propertyName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 truncate">
                            {logoUrl ? "Custom Logo Active" : "Auto Monogram Badge"}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {logoUrl ? "Image applied across portals & receipts" : "Upload your PNG/SVG logo or keep monogram"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-all flex items-center gap-1 text-zinc-800 dark:text-zinc-200 shadow-xs active:scale-95"
                        >
                          <Upload className="size-3" />
                          <span>{logoUrl ? "Change" : "Upload Logo"}</span>
                        </button>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            title="Reset to monogram"
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {fieldErrors.logoUrl && (
                      <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 px-1">
                        <AlertCircle className="size-3 shrink-0" />
                        <span>{fieldErrors.logoUrl}</span>
                      </p>
                    )}

                    {/* Archetype Selector */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                        Property Archetype <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPropertyArchetype("apartment");
                            setFieldError("propertyArchetype", undefined);
                          }}
                          className={cn(
                            "p-2 rounded-xl text-left transition-all flex flex-col justify-between gap-1 border",
                            propertyArchetype === "apartment"
                              ? "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600 shadow-xs"
                              : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          )}
                          style={
                            propertyArchetype === "apartment"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <Home
                              className="size-3.5"
                              style={propertyArchetype === "apartment" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "apartment" && (
                              <span
                                className="size-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Apartment</p>
                            <p className="text-[8px] text-zinc-500 leading-tight">Whole units</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPropertyArchetype("dormitory");
                            setFieldError("propertyArchetype", undefined);
                          }}
                          className={cn(
                            "p-2 rounded-xl text-left transition-all flex flex-col justify-between gap-1 border",
                            propertyArchetype === "dormitory"
                              ? "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600 shadow-xs"
                              : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          )}
                          style={
                            propertyArchetype === "dormitory"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <Bed
                              className="size-3.5"
                              style={propertyArchetype === "dormitory" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "dormitory" && (
                              <span
                                className="size-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Dormitory</p>
                            <p className="text-[8px] text-zinc-500 leading-tight">Bedspaces</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPropertyArchetype("boarding_house");
                            setFieldError("propertyArchetype", undefined);
                          }}
                          className={cn(
                            "p-2 rounded-xl text-left transition-all flex flex-col justify-between gap-1 border",
                            propertyArchetype === "boarding_house"
                              ? "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600 shadow-xs"
                              : "bg-zinc-50/50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          )}
                          style={
                            propertyArchetype === "boarding_house"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <DoorClosed
                              className="size-3.5"
                              style={propertyArchetype === "boarding_house" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "boarding_house" && (
                              <span
                                className="size-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Boarding</p>
                            <p className="text-[8px] text-zinc-500 leading-tight">Room lease</p>
                          </div>
                        </button>
                      </div>
                      {fieldErrors.propertyArchetype && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          <AlertCircle className="size-3 shrink-0" />
                          <span>{fieldErrors.propertyArchetype}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinueToStep2}
                      className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Continue to Color Studio</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>

              )}

              {/* STEP 2: THEME & COLOR STUDIO */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Palette className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                          Step 2: Theme & Color Studio
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Fine-tune brand colors with real-time WCAG contrast feedback
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Theme Experience & Accessibility Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleModeToggle("dark")}
                      className={cn(
                        "p-2 rounded-xl text-left transition-all flex items-center justify-between border",
                        modePreference === "dark" && !isHighContrast
                          ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                      style={
                        modePreference === "dark" && !isHighContrast
                          ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="size-3.5" style={modePreference === "dark" && !isHighContrast ? { color: primaryColor } : undefined} />
                        <span className="text-xs font-bold">Dark Mode</span>
                      </div>
                      {modePreference === "dark" && !isHighContrast && <Check className="size-3 stroke-[3]" style={{ color: primaryColor }} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModeToggle("light")}
                      className={cn(
                        "p-2 rounded-xl text-left transition-all flex items-center justify-between border",
                        modePreference === "light" && !isHighContrast
                          ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                      style={
                        modePreference === "light" && !isHighContrast
                          ? { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="size-3.5" style={modePreference === "light" && !isHighContrast ? { color: primaryColor } : undefined} />
                        <span className="text-xs font-bold">Light Mode</span>
                      </div>
                      {modePreference === "light" && !isHighContrast && <Check className="size-3 stroke-[3]" style={{ color: primaryColor }} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleHighContrast()}
                      className={cn(
                        "p-2 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer",
                        isHighContrast
                          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-black dark:border-white shadow-xs ring-2 ring-primary/40"
                          : "bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Contrast className="size-3.5 text-primary" />
                        <span className="text-xs font-bold">High Contrast</span>
                      </div>
                      {isHighContrast && <Check className="size-3 stroke-[3]" />}
                    </button>
                  </div>

                  {/* 2. Color Target Switcher Tabs */}
                  <div className="bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleTargetTabChange("primary")}
                      className={cn(
                        "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border",
                        colorTarget === "primary"
                          ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border-zinc-300 dark:border-zinc-700"
                          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span>Primary Brand</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTargetTabChange("secondary")}
                      className={cn(
                        "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border",
                        colorTarget === "secondary"
                          ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs border-zinc-300 dark:border-zinc-700"
                          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span>Secondary Accent</span>
                    </button>
                  </div>

                  {/* 3. Modern HSL Sliders & Direct HEX Input */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-3 space-y-2.5 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="size-6 rounded-lg shadow-xs border border-white/20 shrink-0"
                          style={{ backgroundColor: activeHex }}
                        />
                        <div className="relative">
                          <input
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
                              "w-24 uppercase font-mono text-xs font-bold rounded-lg px-2.5 py-1 bg-white dark:bg-zinc-900 border transition-all text-zinc-900 dark:text-zinc-100",
                              ((colorTarget === "primary" && touchedFields.primaryColor && fieldErrors.primaryColor) ||
                               (colorTarget === "secondary" && touchedFields.secondaryColor && fieldErrors.secondaryColor))
                                ? "border-rose-500 ring-1 ring-rose-500"
                                : "border-zinc-300 dark:border-zinc-700"
                            )}
                            aria-invalid={
                              !!(
                                (colorTarget === "primary" && touchedFields.primaryColor && fieldErrors.primaryColor) ||
                                (colorTarget === "secondary" && touchedFields.secondaryColor && fieldErrors.secondaryColor)
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* WCAG Contrast Ratio */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] font-mono font-bold",
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

                    {((colorTarget === "primary" && touchedFields.primaryColor && fieldErrors.primaryColor) ||
                      (colorTarget === "secondary" && touchedFields.secondaryColor && fieldErrors.secondaryColor)) && (
                      <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
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
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500">
                        <span>Hue</span>
                        <span className="font-mono">{hue}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hue}
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
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-500">
                        <span>Saturation</span>
                        <span className="font-mono">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={saturation}
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
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueToStep3}
                      className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Next: Landlord Account</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>

              )}

              {/* STEP 3: LANDLORD ACCOUNT */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <UserCheck className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                          Step 3: Landlord Account
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Primary landlord login for managing your properties</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Owner Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Owner Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100 transition-all",
                            touchedFields.adminName && fieldErrors.adminName
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <User className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="text"
                            value={adminName}
                            onChange={(e) => {
                              setAdminName(e.target.value);
                              if (touchedFields.adminName) {
                                setFieldError("adminName", validateAdminFullName(e.target.value).error);
                              }
                            }}
                            onBlur={() => {
                              markFieldTouched("adminName");
                              setFieldError("adminName", validateAdminFullName(adminName).error);
                            }}
                            placeholder="e.g. Roberto Reyes"
                            className="bg-transparent border-none outline-none w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.adminName && fieldErrors.adminName)}
                          />
                        </div>
                        {touchedFields.adminName && fieldErrors.adminName && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.adminName}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100 transition-all",
                            touchedFields.adminPhone && fieldErrors.adminPhone
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <Phone className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="tel"
                            value={adminPhone}
                            onChange={(e) => {
                              setAdminPhone(e.target.value);
                              if (touchedFields.adminPhone) {
                                setFieldError("adminPhone", validateAdminPhone(e.target.value).error);
                              }
                            }}
                            onBlur={() => {
                              markFieldTouched("adminPhone");
                              setFieldError("adminPhone", validateAdminPhone(adminPhone).error);
                            }}
                            placeholder="0917-000-0000"
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.adminPhone && fieldErrors.adminPhone)}
                          />
                        </div>
                        {touchedFields.adminPhone && fieldErrors.adminPhone && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.adminPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email Address with Verification Badge & Inline OTP */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        {isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                            <Check className="size-2.5 stroke-[3]" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                            Verification Required
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100 transition-all",
                          touchedFields.adminEmail && fieldErrors.adminEmail
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-zinc-200 dark:border-zinc-800"
                        )}
                      >
                        <Mail className="size-3.5 text-zinc-400 shrink-0" />
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          onBlur={() => {
                            markFieldTouched("adminEmail");
                            setFieldError("adminEmail", validateAdminEmail(adminEmail).error);
                          }}
                          placeholder="landlord@property.com"
                          className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          aria-invalid={!!(touchedFields.adminEmail && fieldErrors.adminEmail)}
                        />
                      </div>
                      {touchedFields.adminEmail && fieldErrors.adminEmail && (
                        <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                          <AlertCircle className="size-3 shrink-0" />
                          <span>{fieldErrors.adminEmail}</span>
                        </p>
                      )}

                      {/* Inline OTP Verification Box when linking a new / unverified email */}
                      {!isEmailVerified && (
                        <div className="mt-2 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
                              <KeyRound className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                              <span className="text-[11px] font-medium">
                                {otpSent
                                  ? `Enter the 6-digit code sent to ${adminEmail}`
                                  : "Link this new email address with a 6-digit confirmation code"}
                              </span>
                            </div>
                            {!otpSent && (
                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                disabled={isSendingOtp || !adminEmail.trim()}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs active:scale-95 shrink-0"
                              >
                                {isSendingOtp ? (
                                  <>
                                    <RefreshCw className="size-3 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <span>Send Code</span>
                                )}
                              </button>
                            )}
                          </div>

                          {otpSent && (
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/15">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="123456"
                                className="w-28 px-2.5 py-1 text-center font-mono text-xs font-bold tracking-widest bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-zinc-900 dark:text-zinc-100 placeholder:tracking-normal placeholder:font-sans placeholder:text-zinc-400"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyEmailOtp}
                                disabled={isVerifyingOtp || otpCode.trim().length !== 6}
                                className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs active:scale-95 shrink-0"
                              >
                                {isVerifyingOtp ? (
                                  <>
                                    <RefreshCw className="size-3 animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="size-3 stroke-[3]" />
                                    <span>Verify & Link</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                disabled={isSendingOtp || otpCooldown > 0}
                                className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium ml-auto disabled:opacity-50 transition-colors"
                              >
                                {otpCooldown > 0 ? `Resend (${otpCooldown}s)` : "Resend code"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Account Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Account Password <span className="text-rose-500">*</span>
                        </label>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100 transition-all",
                            touchedFields.adminPassword && fieldErrors.adminPassword
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <Lock className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={(e) => {
                              setAdminPassword(e.target.value);
                              if (touchedFields.adminPassword) {
                                setFieldError("adminPassword", validateAdminPassword(e.target.value, false).error);
                              }
                              if (touchedFields.confirmPassword) {
                                setFieldError("confirmPassword", validateConfirmPassword(e.target.value, confirmPassword, false).error);
                              }
                            }}
                            onBlur={() => {
                              markFieldTouched("adminPassword");
                              setFieldError(
                                "adminPassword",
                                validateAdminPassword(adminPassword, isExistingPasswordPlaceholder).error
                              );
                            }}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.adminPassword && fieldErrors.adminPassword)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5"
                            tabIndex={-1}
                            title={showAdminPassword ? "Hide password" : "Show password"}
                          >
                            {showAdminPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                        {touchedFields.adminPassword && fieldErrors.adminPassword && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.adminPassword}</span>
                          </p>
                        )}
                        {passwordStrength && !fieldErrors.adminPassword && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                              {[1, 2, 3, 4].map((level) => (
                                <div
                                  key={level}
                                  className={cn(
                                    "h-full flex-1 transition-all rounded-full",
                                    passwordStrength.score >= level ? passwordStrength.color : "bg-transparent"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                              {passwordStrength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div
                          className={cn(
                            "bg-zinc-50 dark:bg-zinc-950/60 border rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100 transition-all",
                            touchedFields.confirmPassword && fieldErrors.confirmPassword
                              ? "border-rose-500 ring-1 ring-rose-500"
                              : "border-zinc-200 dark:border-zinc-800"
                          )}
                        >
                          <Lock className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (touchedFields.confirmPassword) {
                                setFieldError("confirmPassword", validateConfirmPassword(adminPassword, e.target.value, false).error);
                              }
                            }}
                            onBlur={() => {
                              markFieldTouched("confirmPassword");
                              setFieldError(
                                "confirmPassword",
                                validateConfirmPassword(adminPassword, confirmPassword, isExistingPasswordPlaceholder).error
                              );
                            }}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                            aria-invalid={!!(touchedFields.confirmPassword && fieldErrors.confirmPassword)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-0.5"
                            tabIndex={-1}
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                        {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <AlertCircle className="size-3 shrink-0" />
                            <span>{fieldErrors.confirmPassword}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleContinueToStep4}
                      className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Next: Review & Launch</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>

              )}

              {/* STEP 4: REVIEW & LAUNCH */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 flex flex-col gap-4 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                          Step 4: Review & Launch
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Review your property workspace configuration before launching
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Review Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 1. Brand Identity Card */}
                    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/70 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            <Building2 className="size-3.5" />
                            <span>Brand Identity</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
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
                              className="size-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div
                              className="size-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                            >
                              {getInitials(propertyName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                              {propertyName || "Untitled Property"}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                              {tagline || "No tagline configured"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-medium">Archetype</span>
                        <span
                          className="font-bold px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          style={{ color: primaryColor }}
                        >
                          {getArchetypeLabel()}
                        </span>
                      </div>
                    </div>

                    {/* 2. Visual Theme & Palette Card */}
                    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/70 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            <Palette className="size-3.5" />
                            <span>Theme & Colors</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="size-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-medium">Primary Brand</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-3.5 rounded shadow-xs border border-black/10"
                                style={{ backgroundColor: primaryColor }}
                              />
                              <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                                {primaryColor.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-medium">Secondary Accent</span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-3.5 rounded shadow-xs border border-black/10"
                                style={{ backgroundColor: secondaryColor }}
                              />
                              <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                                {secondaryColor.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-medium">Default Mode</span>
                        <span className="font-bold capitalize text-zinc-800 dark:text-zinc-200">
                          {modePreference} Mode
                        </span>
                      </div>
                    </div>

                    {/* 3. Landlord Account Card */}
                    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/70 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            <UserCheck className="size-3.5" />
                            <span>Landlord Account</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="size-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-medium">Owner</span>
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                              {adminName || "Landlord"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-medium">Email</span>
                            <div className="flex items-center gap-1 max-w-[140px] truncate">
                              <span className="text-[11px] font-mono font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {adminEmail}
                              </span>
                              {isEmailVerified && (
                                <Check className="size-2.5 text-emerald-600 stroke-[3] shrink-0" />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-zinc-500 font-medium">Phone</span>
                            <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
                              {adminPhone || "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400 font-medium">Password</span>
                        <span className="font-mono text-zinc-500 font-semibold">••••••••••••</span>
                      </div>
                    </div>
                  </div>

                  {!isLaunched ? (
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="py-2 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLaunchPortal}
                        disabled={isLaunching}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-xs"
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        {isLaunching ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" />
                            <span>Activating System...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3.5" />
                            <span>Save & Launch Property Portal</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      {launchedSecurityKey && (
                        <SecurityKeyDisplayCard
                          securityKey={launchedSecurityKey}
                          isAcknowledged={isSecurityKeyAcknowledged}
                          onToggleAcknowledge={setIsSecurityKeyAcknowledged}
                          title="Landlord Security Recovery Key"
                          description="Your workspace is initialized. Save your single-use recovery key now in case you ever lose access to your email."
                          accountEmail={adminEmail}
                        />
                      )}

                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-950 dark:text-white">
                              Portal Live & Personalized!
                            </h4>
                            <p className="text-[10px] text-zinc-500">
                              {launchedSecurityKey && !isSecurityKeyAcknowledged
                                ? "Confirm saving your security key above to open your dashboard."
                                : "Your workspace is ready for operational management."}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={!launchedSecurityKey || isSecurityKeyAcknowledged ? "/landlord/dashboard" : "#"}
                          onClick={(e) => {
                            if (launchedSecurityKey && !isSecurityKeyAcknowledged) {
                              e.preventDefault();
                              toast.error("Please confirm that you have saved your security recovery key before proceeding.");
                            }
                          }}
                          aria-disabled={launchedSecurityKey ? !isSecurityKeyAcknowledged : false}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs",
                            !launchedSecurityKey || isSecurityKeyAcknowledged
                              ? "cursor-pointer active:scale-95"
                              : "opacity-40 cursor-not-allowed"
                          )}
                          style={{
                            backgroundColor: primaryColor,
                            color: primaryTextColor,
                          }}
                        >
                          <span>Open Dashboard</span>
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Live Mockup Frame (5 Cols) - Hidden on Step 4 */}
          {currentStep !== 4 && (
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col gap-3 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                {/* Window Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-amber-400" />
                    <div className="size-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-zinc-500 ml-1.5">
                      Resident Portal Preview
                    </span>
                  </div>

                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    {modePreference} mode
                  </span>
                </div>

                {/* Portal Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={logoUrl}
                        alt="Property Logo"
                        className="size-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
                      />
                    ) : (
                      <div
                        className="size-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                      >
                        {getInitials(propertyName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                        {propertyName || "Property Name"}
                      </h4>
                      <p className="text-[9px] text-zinc-500 truncate">
                        {tagline || "Residential Living"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 shadow-xs"
                    style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                  >
                    Portal
                  </div>
                </div>

                {/* Archetype & Inventory Pills */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                      Archetype
                    </span>
                    <span
                      className="text-[10px] font-bold truncate"
                      style={{ color: primaryColor }}
                    >
                      {getArchetypeLabel()}
                    </span>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 flex flex-col gap-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                      Primary Theme
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate uppercase">
                        {primaryColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mock Card: Resident Quick Action */}
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="size-3" style={{ color: primaryColor }} />
                      <span>Resident Ledger</span>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400">● Active Lease</span>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-2.5 flex items-center justify-between border border-zinc-200 dark:border-zinc-800 shadow-xs">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                        Unit 204 · Rent & Water
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        Due on 1st of next month
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded text-[9px] font-bold shadow-xs cursor-pointer"
                      style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                    >
                      Pay GCash
                    </span>
                  </div>
                </div>

                {/* Owner Profile Card */}
                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: secondaryColor, color: secondaryTextColor }}
                    >
                      {adminName.slice(0, 1) || "L"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {adminName || "Landlord"}
                      </p>
                      <p className="text-[9px] text-zinc-500 truncate font-mono">
                        {adminEmail || "landlord@property.com"}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[9px] font-bold uppercase tracking-wider shrink-0 ml-2"
                    style={{ color: primaryColor }}
                  >
                    Owner
                  </span>
                </div>
              </div>
            </div>
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
