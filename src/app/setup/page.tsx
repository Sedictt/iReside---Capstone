"use client";

import React, { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Palette,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Lock,
  Mail,
  User,
  Phone,
  Bed,
  Home,
  DoorClosed,
  Sliders,
  RefreshCw,
  CreditCard,
  Sun,
  Moon,
  Award,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

// HSL to Hex Helper
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
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

// Hex to HSL Helper
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity & Archetype
  const [propertyName, setPropertyName] = useState("Reyes Residences");
  const [tagline, setTagline] = useState("Premier Student & Residential Living in Valenzuela");
  const [propertyArchetype, setPropertyArchetype] = useState<"apartment" | "dormitory" | "boarding_house">(
    "apartment"
  );
  const [totalUnits, setTotalUnits] = useState("16");
  const [propertyAddress, setPropertyAddress] = useState("Karuhatan, Valenzuela City");

  // Step 2: Light / Dark Mode & Modern HSL Palette
  const { theme, setTheme, resolvedTheme } = useTheme();
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

  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState("#c084fc");

  // Calculate Color Theory Harmonies based on Primary Hue
  const primaryHsl = hexToHsl(primaryColor);
  const harmonyAnalogous = hslToHex(
    (primaryHsl.h + 30) % 360,
    Math.max(75, primaryHsl.s),
    modePreference === "dark" ? 68 : 48
  );
  const harmonyComplementary = hslToHex(
    (primaryHsl.h + 180) % 360,
    88,
    modePreference === "dark" ? 65 : 46
  );
  const harmonySplit = hslToHex(
    (primaryHsl.h + 150) % 360,
    85,
    modePreference === "dark" ? 66 : 46
  );
  const harmonyMonochrome = hslToHex(
    primaryHsl.h,
    Math.max(40, primaryHsl.s - 35),
    modePreference === "dark" ? 75 : 42
  );

  // Contrast Calculation vs Selected Surface Mode
  const currentBg = modePreference === "dark" ? "#121212" : "#fcfcf7";
  const primaryContrast = getContrastRatio(primaryColor, currentBg);
  const secondaryContrast = getContrastRatio(secondaryColor, currentBg);

  // Helper to compute secondary from harmony rule
  const getSecondaryFromRule = (
    rule: "analogous" | "complementary" | "split" | "monochrome",
    h: number,
    s: number,
    mode: "dark" | "light"
  ) => {
    let secHue = h;
    let secSat = s;

    switch (rule) {
      case "analogous":
        secHue = (h + 30) % 360;
        secSat = Math.max(75, s);
        break;
      case "complementary":
        secHue = (h + 180) % 360;
        secSat = Math.max(80, s);
        break;
      case "split":
        secHue = (h + 150) % 360;
        secSat = Math.max(80, s);
        break;
      case "monochrome":
        secHue = h;
        secSat = Math.max(40, s - 35);
        break;
    }

    const secL = mode === "dark" ? 68 : 48;
    return hslToHex(secHue, secSat, secL);
  };

  const handleModeToggle = (mode: "dark" | "light") => {
    setModePreference(mode);
    setTheme(mode);
  };

  // Update Hex when HSL changes
  const updateCurrentTargetFromHsl = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    if (colorTarget === "primary") {
      setPrimaryColor(hex);
      const optSec = getSecondaryFromRule(selectedHarmonyRule, h, s, modePreference);
      setSecondaryColor(optSec);
    }
    if (colorTarget === "secondary") {
      setSecondaryColor(hex);
    }
  };

  // Sync sliders when switching targets
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
    color: string,
    label: string
  ) => {
    setSelectedHarmonyRule(rule);
    setSecondaryColor(color);
    if (colorTarget === "secondary") {
      const hsl = hexToHsl(color);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
    toast.success(`${label} Selected`, {
      description: `Secondary accent updated to ${color.toUpperCase()}.`,
    });
  };

  // Step 3: Master Admin Account
  const [adminName, setAdminName] = useState("Engr. Roberto Reyes");
  const [adminEmail, setAdminEmail] = useState("admin@reyesresidences.com");
  const [adminPhone, setAdminPhone] = useState("0917-890-1234");
  const [adminPassword, setAdminPassword] = useState("••••••••••••");
  const [confirmPassword, setConfirmPassword] = useState("••••••••••••");

  // Launch State
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  const handleLaunchPortal = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setIsLaunched(true);
      toast.success("Portal Personalized Successfully!", {
        description: `${propertyName} is live with custom branding.`,
      });
    }, 1000);
  };

  const stepsList = [
    { num: 1, label: "Identity & Archetype", icon: Building2 },
    { num: 2, label: "Theme & Palette", icon: Palette },
    { num: 3, label: "Master Admin", icon: UserCheck },
    { num: 4, label: "Review & Launch", icon: ShieldCheck },
  ];

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

  const getInitials = (text: string) => {
    return (
      text
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "RR"
    );
  };

  const activeHex = colorTarget === "primary" ? primaryColor : secondaryColor;
  const isDark = (resolvedTheme || modePreference) === "dark";

  // Dynamic Contrast-Aware Tokens
  const primaryTextColor = getContrastTextColor(primaryColor);
  const secondaryTextColor = getContrastTextColor(secondaryColor);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-200">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 flex h-[4.5rem] items-center justify-between bg-background px-4 sm:px-8 text-foreground neumorphic-panel">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 shrink-0"
          >
            <Logo variant="primary" className="h-9 w-28 sm:h-10 sm:w-32" />
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <span
              className="neumorphic-inset px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
              style={{ color: primaryColor }}
            >
              <Sliders className="size-3.5" />
              Business Setup
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Layer 2: Personalization Wizard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Light/Dark Toggle */}
          <button
            type="button"
            onClick={() => handleModeToggle(isDark ? "light" : "dark")}
            className="neumorphic-extruded px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-foreground active:scale-95 transition-all"
            title="Toggle Light / Dark Experience"
          >
            {isDark ? (
              <>
                <Sun className="size-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="size-3.5" style={{ color: primaryColor }} />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          <div className="neumorphic-inset px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-muted-foreground">
            <span style={{ color: primaryColor }} className="mr-1 font-mono">{currentStep}</span> / 4
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-8">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 neumorphic-inset px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2.5">
            <Building2 className="size-3" style={{ color: primaryColor }} />
            <span>Complete White-Label Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
            Personalize Your Entire Portal
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
            Choose your default theme mode, fine-tune HSL colors, and preview your live resident portal in real-time.
          </p>
        </div>

        {/* Step Indicator Bar */}
        <div className="w-full neumorphic-inset rounded-2xl p-1.5 flex gap-1.5" role="tablist">
          {stepsList.map((step) => {
            const isActive = currentStep === step.num;
            const isDone = currentStep > step.num || isLaunched;
            const Icon = step.icon;

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
                  "flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:outline-none",
                  isActive
                    ? "neumorphic-panel text-foreground shadow-sm font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={isActive ? { color: primaryColor } : undefined}
              >
                <div
                  className={cn(
                    "size-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                    isDone
                      ? "bg-emerald-500 text-zinc-950"
                      : isActive
                      ? "neumorphic-inset"
                      : "neumorphic-inset text-muted-foreground"
                  )}
                  style={isActive && !isDone ? { color: primaryColor } : undefined}
                >
                  {isDone ? <Check className="size-3.5 stroke-[3]" /> : step.num}
                </div>
                <span className="hidden sm:inline text-[11px] truncate">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Settings Panels (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: IDENTITY & ARCHETYPE */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                          Step 1: Property Identity & Classification
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Define your commercial trade name and rental archetype
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                        Property Trade Name
                      </label>
                      <div className="neumorphic-inset rounded-2xl px-4 py-3">
                        <input
                          type="text"
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          placeholder="e.g. Reyes Residences, Malinta Dorm Hub"
                          className="bg-transparent border-none outline-none w-full text-xs font-bold text-foreground focus:ring-0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                        Tagline / Subtitle
                      </label>
                      <div className="neumorphic-inset rounded-2xl px-4 py-3">
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="e.g. Premium Residential & Student Living in Valenzuela"
                          className="bg-transparent border-none outline-none w-full text-xs text-foreground focus:ring-0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                        Property Archetype
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setPropertyArchetype("apartment")}
                          className={cn(
                            "p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between gap-2 border-2",
                            propertyArchetype === "apartment"
                              ? "neumorphic-extruded text-foreground shadow-md"
                              : "neumorphic-inset border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                          )}
                          style={
                            propertyArchetype === "apartment"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <Home
                              className="size-5"
                              style={propertyArchetype === "apartment" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "apartment" && (
                              <span
                                className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide">Apartment Complex</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              Whole-unit leasing, independent submeters
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPropertyArchetype("dormitory")}
                          className={cn(
                            "p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between gap-2 border-2",
                            propertyArchetype === "dormitory"
                              ? "neumorphic-extruded text-foreground shadow-md"
                              : "neumorphic-inset border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                          )}
                          style={
                            propertyArchetype === "dormitory"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <Bed
                              className="size-5"
                              style={propertyArchetype === "dormitory" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "dormitory" && (
                              <span
                                className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide">Student Dormitory</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              Bedspace leasing, per-head utility billing
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPropertyArchetype("boarding_house")}
                          className={cn(
                            "p-3.5 rounded-2xl text-left transition-all flex flex-col justify-between gap-2 border-2",
                            propertyArchetype === "boarding_house"
                              ? "neumorphic-extruded text-foreground shadow-md"
                              : "neumorphic-inset border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                          )}
                          style={
                            propertyArchetype === "boarding_house"
                              ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between">
                            <DoorClosed
                              className="size-5"
                              style={propertyArchetype === "boarding_house" ? { color: primaryColor } : undefined}
                            />
                            {propertyArchetype === "boarding_house" && (
                              <span
                                className="size-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                              >
                                <Check className="size-2.5 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide">Boarding House</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              Room leasing, flat monthly utility fee
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Total Units
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3">
                          <input
                            type="number"
                            value={totalUnits}
                            onChange={(e) => setTotalUnits(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono font-bold text-foreground focus:ring-0"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Location / Barangay
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3">
                          <input
                            type="text"
                            value={propertyAddress}
                            onChange={(e) => setPropertyAddress(e.target.value)}
                            placeholder="Barangay, City"
                            className="bg-transparent border-none outline-none w-full text-xs text-foreground focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Continue to Color Studio</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: THEME & COLOR STUDIO */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <Palette className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                          Step 2: Theme Experience & Color Studio
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Fine-tune brand colors with real-time WCAG contrast feedback
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1. Theme Experience Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block">
                      Default Theme Experience
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleModeToggle("dark")}
                        className={cn(
                          "p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border-2",
                          isDark
                            ? "neumorphic-extruded text-foreground shadow-md"
                            : "neumorphic-inset border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                        )}
                        style={
                          isDark
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-8 rounded-xl flex items-center justify-center",
                              isDark ? "shadow-sm" : "neumorphic-inset text-muted-foreground"
                            )}
                            style={isDark ? { backgroundColor: primaryColor, color: primaryTextColor } : undefined}
                          >
                            <Moon className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide">Dark Mode (Default)</p>
                            <p className="text-[10px] text-muted-foreground">Sleek, low-glare obsidian surfaces</p>
                          </div>
                        </div>
                        {isDark && (
                          <span
                            className="size-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                          >
                            <Check className="size-3 stroke-[3]" />
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleModeToggle("light")}
                        className={cn(
                          "p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border-2",
                          !isDark
                            ? "neumorphic-extruded text-foreground shadow-md"
                            : "neumorphic-inset border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                        )}
                        style={
                          !isDark
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-8 rounded-xl flex items-center justify-center",
                              !isDark ? "shadow-sm" : "neumorphic-inset text-muted-foreground"
                            )}
                            style={!isDark ? { backgroundColor: primaryColor, color: primaryTextColor } : undefined}
                          >
                            <Sun className="size-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide">Light Mode</p>
                            <p className="text-[10px] text-muted-foreground">Clean, high-clarity ivory surfaces</p>
                          </div>
                        </div>
                        {!isDark && (
                          <span
                            className="size-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                          >
                            <Check className="size-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Color Target Switcher Tabs */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block">
                      Select Target Color
                    </label>
                    <div className="neumorphic-inset rounded-2xl p-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTargetTabChange("primary")}
                        className={cn(
                          "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2",
                          colorTarget === "primary"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                        )}
                        style={
                          colorTarget === "primary"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <span
                          className="size-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <span>Primary Brand (Buttons & Logo)</span>
                        {colorTarget === "primary" && (
                          <Check className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTargetTabChange("secondary")}
                        className={cn(
                          "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2",
                          colorTarget === "secondary"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "border-transparent opacity-60 text-muted-foreground hover:opacity-100"
                        )}
                        style={
                          colorTarget === "secondary"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <span
                          className="size-3.5 rounded-full shrink-0 shadow-sm border border-white/20"
                          style={{ backgroundColor: secondaryColor }}
                        />
                        <span>Secondary Glow & Accents</span>
                        {colorTarget === "secondary" && (
                          <Check className="size-3.5 stroke-[3]" style={{ color: primaryColor }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 3. Modern HSL Sliders with Live WCAG Pill */}
                  <div className="neumorphic-inset-card rounded-2xl p-5 space-y-4 border border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-xl shadow-md border border-white/20 transition-all duration-150 shrink-0"
                          style={{ backgroundColor: activeHex }}
                        />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Active {colorTarget.toUpperCase()} Hex
                          </p>
                          <p className="text-sm font-mono font-black text-foreground uppercase">
                            {activeHex}
                          </p>
                        </div>
                      </div>

                      {/* WCAG Contrast Ratio Live Pill */}
                      <div className="neumorphic-inset px-3 py-1.5 rounded-xl text-right flex items-center gap-2">
                        <Award className="size-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                            WCAG Contrast Ratio
                          </p>
                          <p className="text-xs font-mono font-black text-emerald-500">
                            {colorTarget === "primary" ? primaryContrast : secondaryContrast}:1 (
                            {(colorTarget === "primary" ? primaryContrast : secondaryContrast) >= 7
                              ? "AAA Optimal"
                              : (colorTarget === "primary" ? primaryContrast : secondaryContrast) >= 4.5
                              ? "AA Pass"
                              : "Low Contrast"}
                            )
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rainbow Hue Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Hue Spectrum (0° – 360°)</span>
                        <span className="font-mono text-foreground">{hue}°</span>
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
                        className="w-full h-3.5 rounded-xl appearance-none cursor-pointer shadow-inner"
                        style={{
                          background:
                            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                        }}
                      />
                    </div>

                    {/* Saturation Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Saturation ({saturation}%)</span>
                        <span className="font-mono text-foreground">{saturation}%</span>
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
                        className="w-full h-3 rounded-xl appearance-none cursor-pointer shadow-inner"
                        style={{
                          background: `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`,
                        }}
                      />
                    </div>

                    {/* Lightness Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span>Lightness ({lightness}%)</span>
                        <span className="font-mono text-foreground">{lightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={lightness}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setLightness(val);
                          updateCurrentTargetFromHsl(hue, saturation, val);
                        }}
                        className="w-full h-3 rounded-xl appearance-none cursor-pointer shadow-inner"
                        style={{
                          background: `linear-gradient(to right, #000000, hsl(${hue}, ${saturation}%, 50%), #ffffff)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 4. Color Theory Harmonies */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Eye className="size-3.5" style={{ color: primaryColor }} />
                        <span>Recommended Secondary Accents (Color Theory)</span>
                      </label>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        Auto-paired from Primary
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Analogous */}
                      <button
                        type="button"
                        onClick={() =>
                          applySecondaryHarmony("analogous", harmonyAnalogous, "Analogous")
                        }
                        className={cn(
                          "p-2.5 rounded-2xl text-left flex flex-col gap-2 transition-all active:scale-95 border-2",
                          selectedHarmonyRule === "analogous"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "neumorphic-extruded border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        style={
                          selectedHarmonyRule === "analogous"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="size-5 rounded-lg shadow-sm"
                            style={{ backgroundColor: harmonyAnalogous }}
                          />
                          <span className="text-[9px] font-mono uppercase text-foreground font-bold">
                            {harmonyAnalogous}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide">Analogous</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Harmonious adjacent</p>
                        </div>
                      </button>

                      {/* Complementary */}
                      <button
                        type="button"
                        onClick={() =>
                          applySecondaryHarmony("complementary", harmonyComplementary, "Complementary")
                        }
                        className={cn(
                          "p-2.5 rounded-2xl text-left flex flex-col gap-2 transition-all active:scale-95 border-2",
                          selectedHarmonyRule === "complementary"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "neumorphic-extruded border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        style={
                          selectedHarmonyRule === "complementary"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="size-5 rounded-lg shadow-sm"
                            style={{ backgroundColor: harmonyComplementary }}
                          />
                          <span className="text-[9px] font-mono uppercase text-foreground font-bold">
                            {harmonyComplementary}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide">Complementary</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">High contrast opposite</p>
                        </div>
                      </button>

                      {/* Split-Complementary */}
                      <button
                        type="button"
                        onClick={() =>
                          applySecondaryHarmony("split", harmonySplit, "Split-Complementary")
                        }
                        className={cn(
                          "p-2.5 rounded-2xl text-left flex flex-col gap-2 transition-all active:scale-95 border-2",
                          selectedHarmonyRule === "split"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "neumorphic-extruded border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        style={
                          selectedHarmonyRule === "split"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="size-5 rounded-lg shadow-sm"
                            style={{ backgroundColor: harmonySplit }}
                          />
                          <span className="text-[9px] font-mono uppercase text-foreground font-bold">
                            {harmonySplit}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide">Split Harmony</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Tri-balance dynamic</p>
                        </div>
                      </button>

                      {/* Monochromatic */}
                      <button
                        type="button"
                        onClick={() =>
                          applySecondaryHarmony("monochrome", harmonyMonochrome, "Monochrome")
                        }
                        className={cn(
                          "p-2.5 rounded-2xl text-left flex flex-col gap-2 transition-all active:scale-95 border-2",
                          selectedHarmonyRule === "monochrome"
                            ? "neumorphic-panel text-foreground shadow-md"
                            : "neumorphic-extruded border-transparent text-muted-foreground hover:text-foreground"
                        )}
                        style={
                          selectedHarmonyRule === "monochrome"
                            ? { borderColor: primaryColor, backgroundColor: `${primaryColor}15` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="size-5 rounded-lg shadow-sm"
                            style={{ backgroundColor: harmonyMonochrome }}
                          />
                          <span className="text-[9px] font-mono uppercase text-foreground font-bold">
                            {harmonyMonochrome}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide">Monochrome</p>
                          <p className="text-[9px] text-muted-foreground leading-tight">Clean pastel tint</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-3 px-5 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 text-foreground"
                    >
                      <ArrowLeft className="size-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-md"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Next: Master Account</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: MASTER ADMIN ACCOUNT */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <UserCheck className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                          Step 3: Master Admin Account
                        </h2>
                        <p className="text-xs text-muted-foreground">The primary owner login for managing the property</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                        Owner / Property Manager Full Name
                      </label>
                      <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-foreground">
                        <User className="size-4 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          placeholder="e.g. Roberto Reyes"
                          className="bg-transparent border-none outline-none w-full text-xs font-bold text-foreground focus:ring-0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Master Login Email
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-foreground">
                          <Mail className="size-4 text-muted-foreground shrink-0" />
                          <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@property.com"
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Contact Phone Number
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-foreground">
                          <Phone className="size-4 text-muted-foreground shrink-0" />
                          <input
                            type="tel"
                            value={adminPhone}
                            onChange={(e) => setAdminPhone(e.target.value)}
                            placeholder="0917-000-0000"
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Master Password
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-foreground">
                          <Lock className="size-4 text-muted-foreground shrink-0" />
                          <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">
                          Confirm Master Password
                        </label>
                        <div className="neumorphic-inset rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-foreground">
                          <Lock className="size-4 text-muted-foreground shrink-0" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-transparent border-none outline-none w-full text-xs font-mono text-foreground focus:ring-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="py-3 px-5 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 text-foreground"
                    >
                      <ArrowLeft className="size-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-md"
                      style={{
                        backgroundColor: primaryColor,
                        color: primaryTextColor,
                      }}
                    >
                      <span>Next: Review & Launch</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: REVIEW & LAUNCH */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-border/50"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-2xl neumorphic-inset flex items-center justify-center transition-colors"
                        style={{ color: primaryColor }}
                      >
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                          Step 4: Ready to Launch
                        </h2>
                        <p className="text-xs text-muted-foreground">Review configuration and finalize portal setup</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="neumorphic-inset rounded-2xl p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-border/30 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Property Brand
                        </span>
                        <h3 className="text-base font-black text-foreground">{propertyName}</h3>
                        <p className="text-xs text-muted-foreground">{tagline}</p>
                      </div>
                      <span
                        className="neumorphic-panel px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-border/40"
                        style={{ color: primaryColor }}
                      >
                        {getArchetypeLabel()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                          Theme & Harmonies
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="size-4 rounded-lg shadow-sm border border-white/20"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span
                            className="size-4 rounded-lg shadow-sm border border-white/20"
                            style={{ backgroundColor: secondaryColor }}
                          />
                          <span className="font-bold text-foreground capitalize">
                            {modePreference} Mode · {primaryColor}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                          Master Administrator
                        </span>
                        <span className="font-bold text-foreground truncate block mt-0.5">{adminName}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                          Admin Login Email
                        </span>
                        <span className="font-mono text-[11px] text-foreground truncate block mt-0.5">
                          {adminEmail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isLaunched ? (
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="py-3 px-5 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 text-foreground"
                      >
                        <ArrowLeft className="size-4" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLaunchPortal}
                        disabled={isLaunching}
                        className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        {isLaunching ? (
                          <>
                            <RefreshCw className="size-4 animate-spin" />
                            <span>Activating System...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-4" />
                            <span>Save & Launch Property Portal</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-2xl neumorphic-extruded border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-500" />
                          <h4 className="text-sm font-black uppercase tracking-wide text-foreground">
                            Portal Live & Personalized!
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your personalized property workspace is live and ready for operations.
                        </p>
                      </div>

                      <Link
                        href="/landlord/dashboard"
                        className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 shadow-md"
                        style={{
                          backgroundColor: primaryColor,
                          color: primaryTextColor,
                        }}
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight className="size-4" />
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Live Mockup Frame (5 Cols) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="neumorphic-panel rounded-3xl p-6 sm:p-7 flex flex-col gap-5 transition-all duration-300 border border-border/50">
              {/* Window Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-400" />
                  <div className="size-2.5 rounded-full bg-amber-400" />
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-bold text-muted-foreground ml-2">
                    Resident Portal Preview
                  </span>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {modePreference} mode
                </span>
              </div>

              {/* Portal Header */}
              <div className="neumorphic-inset rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center font-black text-xs shadow-md shrink-0"
                    style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                  >
                    {getInitials(propertyName)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black tracking-tight text-foreground truncate">
                      {propertyName || "Property Name"}
                    </h4>
                    <p className="text-[9px] text-muted-foreground truncate">
                      {tagline || "Residential Living"}
                    </p>
                  </div>
                </div>

                <div
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm"
                  style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                >
                  Portal
                </div>
              </div>

              {/* Archetype & Inventory Pills */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="neumorphic-inset rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Archetype
                  </span>
                  <span className="text-xs font-black text-foreground truncate">
                    {getArchetypeLabel()}
                  </span>
                </div>

                <div className="neumorphic-inset rounded-xl p-3 flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Inventory
                  </span>
                  <span className="text-xs font-black font-mono text-foreground">
                    {totalUnits} Units
                  </span>
                </div>
              </div>

              {/* Resident Ledger Widget */}
              <div className="neumorphic-inset rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="size-3.5" style={{ color: primaryColor }} />
                    <span>Resident Ledger View</span>
                  </div>
                  <span className="text-emerald-500 font-bold">● Active Lease</span>
                </div>

                <div className="neumorphic-panel rounded-xl p-3 flex items-center justify-between border border-border/40">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Unit 204 · Rent & Water
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Due on 1st of next month
                    </p>
                  </div>
                  <span
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm cursor-pointer"
                    style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                  >
                    Pay GCash
                  </span>
                </div>
              </div>

              {/* Owner Profile Card */}
              <div className="neumorphic-inset p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: secondaryColor, color: secondaryTextColor }}
                  >
                    {adminName.slice(0, 1) || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground truncate">
                      {adminName || "Administrator"}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate font-mono">
                      {adminEmail || "admin@property.com"}
                    </p>
                  </div>
                </div>

                <span
                  className="text-[9px] font-black uppercase tracking-widest shrink-0 ml-2"
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
