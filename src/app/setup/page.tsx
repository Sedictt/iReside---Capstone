"use client";

import React, { useState, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useHighContrast } from "@/hooks/useHighContrast";
import { HighContrastToggle } from "@/components/ui/HighContrastToggle";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";
import { applyBrandCssVariables } from "@/lib/branding/colors";

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

export default function BusinessPersonalizationWizardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const brand = useBrand();

  // Step 1: Identity, Archetype & Logo
  const [propertyName, setPropertyName] = useState(brand.propertyName || "Reyes Residences");
  const [tagline, setTagline] = useState(brand.propertyTagline || "Premier Student & Residential Living in Valenzuela");
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logoUrl);
  const [propertyArchetype, setPropertyArchetype] = useState<"apartment" | "dormitory" | "boarding_house">(
    brand.rentalArchetype || "apartment"
  );
  const [totalUnits, setTotalUnits] = useState("16");
  const [propertyAddress, setPropertyAddress] = useState("Karuhatan, Valenzuela City");

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

  // Step 3: Master Admin Account
  const [adminName, setAdminName] = useState("Roberto Reyes");
  const [adminEmail, setAdminEmail] = useState("admin@reyesresidences.com");
  const [adminPassword, setAdminPassword] = useState("••••••••••••");
  const [confirmPassword, setConfirmPassword] = useState("••••••••••••");
  const [adminPhone, setAdminPhone] = useState("0917-882-9912");

  // Step 4: Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

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
      applyBrandCssVariables(hex, secondaryColor);
    } else {
      setSecondaryColor(hex);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum logo size is 5MB.");
      return;
    }

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
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Logo reset to auto-generated monogram badge.");
  };

  const handleLaunchPortal = async () => {
    setIsLaunching(true);
    try {
      await brand.updateBranding(
        {
          propertyName,
          propertyTagline: tagline,
          rentalArchetype: propertyArchetype,
          primaryColor,
          secondaryColor,
          logoUrl,
        },
        true
      );
      setIsLaunched(true);
      toast.success("Property Portal White-Labeled & Initialized!", {
        description: `Branded as ${propertyName}. Master Admin configuration saved.`,
      });
    } catch (err: any) {
      toast.error("Failed to save branding: " + (err?.message || "Unknown error"));
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
    { num: 3, label: "Master Admin", icon: UserCheck },
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
              <Sparkles className="size-3.5" style={{ color: primaryColor }} />
              Business Setup
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Layer 2: Personalization Wizard
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
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-2.5 sm:py-3 flex flex-col justify-center gap-2.5">
        {/* Minimal Toned-down Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
            Business Personalization Setup
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure your property branding, logo, custom palette, and master owner credentials.
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
                  if (step.num <= currentStep || isDone) {
                    setCurrentStep(step.num as 1 | 2 | 3 | 4);
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

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* Left Column: Interactive Settings (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Property Trade Name
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
                          <input
                            type="text"
                            value={propertyName}
                            onChange={(e) => setPropertyName(e.target.value)}
                            placeholder="e.g. Reyes Residences"
                            className="bg-transparent border-none outline-none w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Tagline / Subtitle
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
                          <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            placeholder="e.g. Premier Student Living"
                            className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
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

                    {/* Archetype Selector */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                        Property Archetype
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPropertyArchetype("apartment")}
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
                          onClick={() => setPropertyArchetype("dormitory")}
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
                          onClick={() => setPropertyArchetype("boarding_house")}
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
                    </div>

                    {/* Inventory & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Units
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
                          <input
                            type="number"
                            value={totalUnits}
                            onChange={(e) => setTotalUnits(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Location / Barangay
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
                          <input
                            type="text"
                            value={propertyAddress}
                            onChange={(e) => setPropertyAddress(e.target.value)}
                            placeholder="Barangay, City"
                            className="bg-transparent border-none outline-none w-full text-xs text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
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

                  {/* 3. Modern HSL Sliders */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-3 space-y-2.5 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-6 rounded-lg shadow-xs border border-white/20 shrink-0"
                          style={{ backgroundColor: activeHex }}
                        />
                        <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                          {activeHex}
                        </span>
                      </div>

                      {/* WCAG Contrast Ratio */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <Award className="size-3.5" />
                        <span>{colorTarget === "primary" ? primaryContrast : secondaryContrast}:1 (WCAG Pass)</span>
                      </div>
                    </div>

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
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Next: Master Admin</span>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: MASTER ADMIN ACCOUNT */}
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
                          Step 3: Master Admin Account
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Primary owner login for managing the property</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                        Owner Full Name
                      </label>
                      <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100">
                        <User className="size-3.5 text-zinc-400 shrink-0" />
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. Roberto Reyes"
                          className="bg-transparent border-none outline-none w-full text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Master Login Email
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100">
                          <Mail className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@property.com"
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Phone Number
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100">
                          <Phone className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="tel"
                            value={adminPhone}
                            onChange={(e) => setAdminPhone(e.target.value)}
                            placeholder="0917-000-0000"
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Master Password
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100">
                          <Lock className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 block">
                          Confirm Password
                        </label>
                        <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs text-zinc-900 dark:text-zinc-100">
                          <Lock className="size-3.5 text-zinc-400 shrink-0" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:ring-0"
                          />
                        </div>
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
                      onClick={() => setCurrentStep(4)}
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
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <ShieldCheck className="size-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                          Step 4: Ready to Launch
                        </h2>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Review configuration and finalize portal setup</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={logoUrl}
                            alt="Brand Logo"
                            className="size-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div
                            className="size-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
                            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                          >
                            {getInitials(propertyName)}
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            Property Brand
                          </span>
                          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">{propertyName}</h3>
                          <p className="text-[10px] text-zinc-500">{tagline}</p>
                        </div>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        style={{ color: primaryColor }}
                      >
                        {getArchetypeLabel()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                          Theme & Palette
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="size-3.5 rounded shadow-xs"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span
                            className="size-3.5 rounded shadow-xs"
                            style={{ backgroundColor: secondaryColor }}
                          />
                          <span className="text-[11px] font-bold capitalize text-zinc-800 dark:text-zinc-200">
                            {modePreference} · {primaryColor}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
                          Master Admin
                        </span>
                        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">{adminName}</span>
                      </div>
                    </div>
                  </div>

                  {!isLaunched ? (
                    <div className="pt-1 flex items-center justify-between">
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
                        className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
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
                      className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="size-5 text-emerald-600" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-950 dark:text-white">
                            Portal Live & Personalized!
                          </h4>
                          <p className="text-[10px] text-zinc-500">
                            Your workspace is ready for operations.
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/landlord/dashboard"
                        className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Live Mockup Frame (5 Cols) */}
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
                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {getArchetypeLabel()}
                  </span>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 flex flex-col gap-0.5">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                    Inventory
                  </span>
                  <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {totalUnits} Units
                  </span>
                </div>
              </div>

              {/* Resident Ledger Widget */}
              <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  <div className="flex items-center gap-1">
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
                    {adminName.slice(0, 1) || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {adminName || "Administrator"}
                    </p>
                    <p className="text-[9px] text-zinc-500 truncate font-mono">
                      {adminEmail || "admin@property.com"}
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
        </div>
      </main>
    </div>
  );
}
