"use client";

import React, { useState, useRef, useEffect } from "react";
import { m as motion, AnimatePresence, useDragControls } from "framer-motion";
import { HexColorPicker } from "react-colorful";
import {
  QrCode,
  Printer,
  X,
  Smartphone,
  Globe,
  Wifi,
  Phone,
  ShieldCheck,
  Edit3,
  RotateCcw,
  Save,
  Cloud,
  Check,
  WifiOff,
  Loader2,
  Palette,
  Download,
  Upload,
  Trash2,
  Building2,
  Sun,
  Moon,
  Grid,
  LayoutGrid,
  FileText,
  ListOrdered,
  Megaphone,
  Sliders,
  CaseSensitive,
  GripVertical,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useProperty } from "@/context/PropertyContext";
import { useBrand } from "@/context/BrandContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LobbyFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BackgroundPreset =
  | "solid_white"
  | "solid_dark"
  | "dot_pattern"
  | "grid_blueprint"
  | "warm_ivory"
  | "custom_photo";

type FontFamilyChoice = "modern_sans" | "luxury_serif" | "geometric_grotesk" | "tech_mono";
type TextTransformChoice = "uppercase" | "none";
type LetterSpacingChoice = "tight" | "normal" | "wide";
type FloatingToolType = "colors" | "background" | "typography" | "sections";

const BG_PRESETS = [
  { id: "solid_white" as BackgroundPreset, label: "Clean White", icon: Sun },
  { id: "solid_dark" as BackgroundPreset, label: "Obsidian Dark", icon: Moon },
  { id: "dot_pattern" as BackgroundPreset, label: "Dot Matrix", icon: Grid },
  { id: "grid_blueprint" as BackgroundPreset, label: "Blueprint Grid", icon: LayoutGrid },
  { id: "warm_ivory" as BackgroundPreset, label: "Warm Ivory", icon: FileText },
];

const COLOR_PRESETS = [
  { name: "Royal Purple", hex: "#8b5cf6" },
  { name: "Electric Blue", hex: "#2563eb" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Sunset Amber", hex: "#d97706" },
  { name: "Crimson Rose", hex: "#e11d48" },
  { name: "Obsidian Slate", hex: "#18181b" },
];

const CARD_PRESETS = [
  { label: "White Card", hex: "#ffffff" },
  { label: "Obsidian Dark Card", hex: "#18181f" },
  { label: "Slate Card", hex: "#334155" },
  { label: "Ivory Card", hex: "#fafaf6" },
];

const FONT_FAMILIES: { id: FontFamilyChoice; label: string; css: string }[] = [
  { id: "modern_sans", label: "Modern Sans", css: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: "luxury_serif", label: "Luxury Serif", css: "Georgia, 'Times New Roman', Times, serif" },
  { id: "geometric_grotesk", label: "Geometric", css: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif" },
  { id: "tech_mono", label: "Tech Mono", css: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
];

// Helper: Convert hex and opacity (10-100) to rgba string
function hexToRgba(hexColor: string, opacityPercent: number): string {
  try {
    const cleanHex = hexColor.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const alpha = Math.max(0.1, Math.min(1, opacityPercent / 100));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hexColor;
  }
}

// Helper: Calculate high-contrast text color based on luminance
function getContrastColor(hexColor: string): { text: string; muted: string; border: string; isLight: boolean } {
  try {
    const cleanHex = hexColor.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    const isLight = yiq >= 135;

    return {
      isLight,
      text: isLight ? "#09090b" : "#ffffff",
      muted: isLight ? "#71717a" : "#a1a1aa",
      border: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)",
    };
  } catch {
    return {
      isLight: true,
      text: "#09090b",
      muted: "#71717a",
      border: "rgba(0, 0, 0, 0.1)",
    };
  }
}

export function LobbyFlyerModal({ isOpen, onClose }: LobbyFlyerModalProps) {
  const { selectedProperty } = useProperty();
  const brand = useBrand();
  const posterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Header Card Texts
  const [propertyName, setPropertyName] = useState(
    selectedProperty?.name || brand.propertyName || "Skyline Lofts"
  );
  const [address, setAddress] = useState(
    selectedProperty?.address || "456 Gen. T. de Leon Road, Paso de Blas, Valenzuela City"
  );
  const [portalSubheading, setPortalSubheading] = useState("Resident Portal");

  // 2. Banner Texts
  const [bannerHeading, setBannerHeading] = useState("Resident Notice & Access");
  const [tagline, setTagline] = useState(
    brand.propertyTagline || "Official resident portal for GCash payments, utility tracking, and maintenance."
  );

  // 3. Android APK Card Texts
  const [apkCardTitle, setApkCardTitle] = useState("Android Mobile App");
  const [apkCardBadge, setApkCardBadge] = useState("Download APK");
  const [apkCardSubtitle, setApkCardSubtitle] = useState("Track bills & get push alerts");

  // 4. Web Portal Card Texts
  const [webCardTitle, setWebCardTitle] = useState("Instant Web Portal");
  const [webCardBadge, setWebCardBadge] = useState("Open in Browser");
  const [webCardSubtitle, setWebCardSubtitle] = useState("Instant access on any device");

  // 5. 3-Step Guide Texts
  const [stepsHeading, setStepsHeading] = useState("Get Started in 3 Easy Steps");
  const [step1Title, setStep1Title] = useState("Scan QR");
  const [step1Desc, setStep1Desc] = useState("Open with camera or browser");
  const [step2Title, setStep2Title] = useState("Create Account");
  const [step2Desc, setStep2Desc] = useState("Sign up & connect to your unit");
  const [step3Title, setStep3Title] = useState("Pay & Request");
  const [step3Desc, setStep3Desc] = useState("GCash rent & maintenance tickets");

  // 6. Wi-Fi & Office Info Texts
  const [wifiHeader, setWifiHeader] = useState("Lobby Wi-Fi");
  const [wifiSsid, setWifiSsid] = useState("SkylineLofts_Resident");
  const [wifiPassword, setWifiPassword] = useState("Skyline@2026");
  const [officeHeader, setOfficeHeader] = useState("Property Office");
  const [contactPhone, setContactPhone] = useState("0917-890-1234");
  const [officeHours, setOfficeHours] = useState("Daily 8:00 AM – 7:00 PM");

  // 7. Footer Stamp Texts
  const [footerBadge, setFooterBadge] = useState("Official Notice");

  // Direct Edit Mode Toggle
  const [isDirectEditMode, setIsDirectEditMode] = useState(true);

  // Active Floating Tool Window (Persistent Draggable Shell)
  const [activeFloatingTool, setActiveFloatingTool] = useState<FloatingToolType | null>(null);
  const [activeColorTab, setActiveColorTab] = useState<"card" | "brand">("card");

  // Visual Customization States
  const [bgPreset, setBgPreset] = useState<BackgroundPreset>("solid_white");
  const [cardColor, setCardColor] = useState<string>("#ffffff");
  const [cardOpacity, setCardOpacity] = useState<number>(95);
  const [brandColor, setBrandColor] = useState(brand.primaryColor || "#8b5cf6");

  // Typography Customization States
  const [fontFamily, setFontFamily] = useState<FontFamilyChoice>("modern_sans");
  const [titleTransform, setTitleTransform] = useState<TextTransformChoice>("uppercase");
  const [letterSpacing, setLetterSpacing] = useState<LetterSpacingChoice>("tight");

  // Custom Background Photo Adjustments
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [photoBrightness, setPhotoBrightness] = useState<number>(100);
  const [photoSaturation, setPhotoSaturation] = useState<number>(100);
  const [photoOpacity, setPhotoOpacity] = useState<number>(100);

  // Section Visibility Toggles
  const [showBanner, setShowBanner] = useState(true);
  const [showSteps, setShowSteps] = useState(true);
  const [showWifi, setShowWifi] = useState(true);
  const [showOffice, setShowOffice] = useState(true);

  // Single Persistent Drag Control for Floating Inspector
  const inspectorDragControls = useDragControls();

  // Custom QR URLs
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://ireside.ph";
  const [apkUrl, setApkUrl] = useState(`${origin}/download`);
  const [portalUrl, setPortalUrl] = useState(`${origin}/signup/tenant`);

  // High-Resolution Scannable QR Codes
  const apkQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&data=${encodeURIComponent(
    apkUrl
  )}`;
  const portalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&data=${encodeURIComponent(
    portalUrl
  )}`;

  // Ultra High-Res Download URLs for Standalone Artwork (1000x1000 PNG)
  const downloadApkQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=10&format=png&data=${encodeURIComponent(
    apkUrl
  )}`;
  const downloadPortalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=10&format=png&data=${encodeURIComponent(
    portalUrl
  )}`;

  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [hasSavedTemplate, setHasSavedTemplate] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? window.navigator.onLine : true
  );
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const isInitialMount = useRef(true);

  const applyTemplate = (tpl: any) => {
    if (!tpl) return;
    if (tpl.propertyName) setPropertyName(tpl.propertyName);
    if (tpl.address) setAddress(tpl.address);
    if (tpl.portalSubheading) setPortalSubheading(tpl.portalSubheading);
    if (tpl.bannerHeading) setBannerHeading(tpl.bannerHeading);
    if (tpl.tagline) setTagline(tpl.tagline);
    if (tpl.apkCardTitle) setApkCardTitle(tpl.apkCardTitle);
    if (tpl.apkCardBadge) setApkCardBadge(tpl.apkCardBadge);
    if (tpl.apkCardSubtitle) setApkCardSubtitle(tpl.apkCardSubtitle);
    if (tpl.webCardTitle) setWebCardTitle(tpl.webCardTitle);
    if (tpl.webCardBadge) setWebCardBadge(tpl.webCardBadge);
    if (tpl.webCardSubtitle) setWebCardSubtitle(tpl.webCardSubtitle);
    if (tpl.stepsHeading) setStepsHeading(tpl.stepsHeading);
    if (tpl.step1Title) setStep1Title(tpl.step1Title);
    if (tpl.step1Desc) setStep1Desc(tpl.step1Desc);
    if (tpl.step2Title) setStep2Title(tpl.step2Title);
    if (tpl.step2Desc) setStep2Desc(tpl.step2Desc);
    if (tpl.step3Title) setStep3Title(tpl.step3Title);
    if (tpl.step3Desc) setStep3Desc(tpl.step3Desc);
    if (tpl.wifiHeader) setWifiHeader(tpl.wifiHeader);
    if (tpl.wifiSsid) setWifiSsid(tpl.wifiSsid);
    if (tpl.wifiPassword) setWifiPassword(tpl.wifiPassword);
    if (tpl.officeHeader) setOfficeHeader(tpl.officeHeader);
    if (tpl.contactPhone) setContactPhone(tpl.contactPhone);
    if (tpl.officeHours) setOfficeHours(tpl.officeHours);
    if (tpl.footerBadge) setFooterBadge(tpl.footerBadge);
    if (tpl.brandColor) setBrandColor(tpl.brandColor);
    if (tpl.cardColor) setCardColor(tpl.cardColor);
    if (tpl.cardOpacity !== undefined) setCardOpacity(tpl.cardOpacity);
    if (tpl.bgPreset) setBgPreset(tpl.bgPreset);
    if (tpl.fontFamily) setFontFamily(tpl.fontFamily);
    if (tpl.titleTransform) setTitleTransform(tpl.titleTransform);
    if (tpl.letterSpacing) setLetterSpacing(tpl.letterSpacing);
    if (tpl.customBgImage !== undefined) setCustomBgImage(tpl.customBgImage);
    if (tpl.photoBrightness !== undefined) setPhotoBrightness(tpl.photoBrightness);
    if (tpl.photoSaturation !== undefined) setPhotoSaturation(tpl.photoSaturation);
    if (tpl.photoOpacity !== undefined) setPhotoOpacity(tpl.photoOpacity);
    if (tpl.showBanner !== undefined) setShowBanner(tpl.showBanner);
    if (tpl.showSteps !== undefined) setShowSteps(tpl.showSteps);
    if (tpl.showWifi !== undefined) setShowWifi(tpl.showWifi);
    if (tpl.showOffice !== undefined) setShowOffice(tpl.showOffice);
  };

  // 1. Connection Monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus("saving");
      toast.success("Online: Syncing your design with the cloud...");
      handleSaveTemplate(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
      toast.warning("You are offline. Design changes are saved locally to this device.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Load saved template from local cache & cloud on mount / property switch
  useEffect(() => {
    const propKey = selectedProperty?.id || "default";
    
    // Instant local cache hydration
    try {
      const localData = localStorage.getItem(`ireside_flyer_tpl_${propKey}`);
      if (localData) {
        applyTemplate(JSON.parse(localData));
      }
    } catch {}

    // Cloud template synchronization
    if (navigator.onLine) {
      fetch(`/api/landlord/flyer-template?propertyId=${propKey}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.template) {
            applyTemplate(data.template);
            try {
              localStorage.setItem(`ireside_flyer_tpl_${propKey}`, JSON.stringify(data.template));
            } catch {}
          }
        })
        .catch((err) => {
          console.warn("Could not sync cloud flyer template:", err);
        });
    }
  }, [selectedProperty?.id]);

  useEffect(() => {
    if (selectedProperty?.name && !localStorage.getItem(`ireside_flyer_tpl_${selectedProperty?.id || "default"}`)) {
      setPropertyName(selectedProperty.name);
    }
    if (selectedProperty?.address && !localStorage.getItem(`ireside_flyer_tpl_${selectedProperty?.id || "default"}`)) {
      setAddress(selectedProperty.address);
    }
  }, [selectedProperty]);

  // 3. Debounced Real-Time Autosave
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const propKey = selectedProperty?.id || "default";
    const templateData = {
      propertyName,
      address,
      portalSubheading,
      bannerHeading,
      tagline,
      apkCardTitle,
      apkCardBadge,
      apkCardSubtitle,
      webCardTitle,
      webCardBadge,
      webCardSubtitle,
      stepsHeading,
      step1Title,
      step1Desc,
      step2Title,
      step2Desc,
      step3Title,
      step3Desc,
      wifiHeader,
      wifiSsid,
      wifiPassword,
      officeHeader,
      contactPhone,
      officeHours,
      footerBadge,
      brandColor,
      cardColor,
      cardOpacity,
      bgPreset,
      fontFamily,
      titleTransform,
      letterSpacing,
      customBgImage,
      photoBrightness,
      photoSaturation,
      photoOpacity,
      showBanner,
      showSteps,
      showWifi,
      showOffice,
    };

    // Always immediately persist locally
    try {
      localStorage.setItem(`ireside_flyer_tpl_${propKey}`, JSON.stringify(templateData));
    } catch {}

    if (!navigator.onLine) {
      setSaveStatus("offline");
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/landlord/flyer-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: propKey,
            template: templateData,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        }
      } catch {
        setSaveStatus("offline");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [
    propertyName,
    address,
    portalSubheading,
    bannerHeading,
    tagline,
    apkCardTitle,
    apkCardBadge,
    apkCardSubtitle,
    webCardTitle,
    webCardBadge,
    webCardSubtitle,
    stepsHeading,
    step1Title,
    step1Desc,
    step2Title,
    step2Desc,
    step3Title,
    step3Desc,
    wifiHeader,
    wifiSsid,
    wifiPassword,
    officeHeader,
    contactPhone,
    officeHours,
    footerBadge,
    brandColor,
    cardColor,
    cardOpacity,
    bgPreset,
    fontFamily,
    titleTransform,
    letterSpacing,
    customBgImage,
    photoBrightness,
    photoSaturation,
    photoOpacity,
    showBanner,
    showSteps,
    showWifi,
    showOffice,
    selectedProperty?.id,
  ]);

  // Save template manual trigger
  const handleSaveTemplate = async (isAutoSync = false) => {
    try {
      setIsSavingTemplate(true);
      const templateData = {
        propertyName,
        address,
        portalSubheading,
        bannerHeading,
        tagline,
        apkCardTitle,
        apkCardBadge,
        apkCardSubtitle,
        webCardTitle,
        webCardBadge,
        webCardSubtitle,
        stepsHeading,
        step1Title,
        step1Desc,
        step2Title,
        step2Desc,
        step3Title,
        step3Desc,
        wifiHeader,
        wifiSsid,
        wifiPassword,
        officeHeader,
        contactPhone,
        officeHours,
        footerBadge,
        brandColor,
        cardColor,
        cardOpacity,
        bgPreset,
        fontFamily,
        titleTransform,
        letterSpacing,
        customBgImage,
        photoBrightness,
        photoSaturation,
        photoOpacity,
        showBanner,
        showSteps,
        showWifi,
        showOffice,
      };

      const propKey = selectedProperty?.id || "default";

      // 1. Save to local storage
      try {
        localStorage.setItem(`ireside_flyer_tpl_${propKey}`, JSON.stringify(templateData));
      } catch {}

      if (!navigator.onLine) {
        setSaveStatus("offline");
        if (!isAutoSync) {
          toast.warning("Saved locally. Will sync to the cloud when connection returns.");
        }
        return;
      }

      // 2. Save to Supabase cloud
      const res = await fetch("/api/landlord/flyer-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propKey,
          template: templateData,
        }),
      });

      if (!res.ok) {
        throw new Error("Cloud sync failed");
      }

      setSaveStatus("saved");
      setHasSavedTemplate(true);
      setTimeout(() => setHasSavedTemplate(false), 3000);
      if (!isAutoSync) {
        toast.success("Design saved! Synced across all your devices.");
      }
    } catch (err) {
      console.error("Error saving flyer template:", err);
      if (!isAutoSync) toast.success("Saved to local browser cache.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDownloadPoster = async () => {
    const posterNode = posterRef.current || document.getElementById("lobby-poster-canvas");
    if (!posterNode) {
      toast.error("Poster canvas not found");
      return;
    }

    try {
      setIsExportingPoster(true);
      toast.loading("Capturing high-resolution poster...", { id: "poster-export" });

      // Blur active elements to remove edit focus rings
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Allow React state to settle (disables contentEditable & edit bounding outlines)
      await new Promise((r) => setTimeout(r, 200));

      const { domToPng } = await import("modern-screenshot");

      const dataUrl = await domToPng(posterNode, {
        scale: 3, // Ultra-sharp 300 DPI print quality
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains("print:hidden") || node.tagName === "BUTTON") {
              return false;
            }
          }
          return true;
        },
      });

      const cleanFilename = propertyName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Lobby_Poster";

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${cleanFilename}_Lobby_Poster.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("High-res poster saved!", { id: "poster-export" });
    } catch (err) {
      console.error("Error exporting poster with modern-screenshot:", err);
      toast.error("Failed to export poster. Please try again.", { id: "poster-export" });
    } finally {
      setIsExportingPoster(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image (.jpg, .png, .webp)");
      return;
    }

    // 1. Instant local preview
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBgImage(reader.result as string);
      setBgPreset("custom_photo");
      setCardColor("#ffffff");
      setActiveFloatingTool("background");
      toast.success("Building photo applied!");
    };
    reader.readAsDataURL(file);

    // 2. Upload to Supabase Storage in background for cloud synchronization
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/landlord/flyer-template/upload-bg", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.url) {
        setCustomBgImage(data.url);
      }
    } catch (uploadErr) {
      console.warn("Background photo cloud upload deferred to template save:", uploadErr);
    }
  };

  const handleDownloadQrImage = async (url: string, filename: string) => {
    try {
      toast.loading("Downloading high-res QR code...", { id: "qr-dl" });
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success(`${filename} saved!`, { id: "qr-dl" });
    } catch {
      window.open(url, "_blank");
      toast.success("Opened QR code in new tab.", { id: "qr-dl" });
    }
  };

  const handleResetDefaults = () => {
    setPropertyName(selectedProperty?.name || "Skyline Lofts");
    setAddress(selectedProperty?.address || "456 Gen. T. de Leon Road, Paso de Blas, Valenzuela City");
    setPortalSubheading("Resident Portal");
    setBannerHeading("Resident Notice & Access");
    setTagline("Official resident portal for GCash payments, utility tracking, and maintenance.");
    setApkCardTitle("Android Mobile App");
    setApkCardBadge("Download APK");
    setApkCardSubtitle("Track bills & get push alerts");
    setWebCardTitle("Instant Web Portal");
    setWebCardBadge("Open in Browser");
    setWebCardSubtitle("Instant access on any device");
    setStepsHeading("Get Started in 3 Easy Steps");
    setStep1Title("Scan QR");
    setStep1Desc("Open with camera or browser");
    setStep2Title("Create Account");
    setStep2Desc("Sign up & connect to your unit");
    setStep3Title("Pay & Request");
    setStep3Desc("GCash rent & maintenance tickets");
    setWifiHeader("Lobby Wi-Fi");
    setWifiSsid("SkylineLofts_Resident");
    setWifiPassword("Skyline@2026");
    setOfficeHeader("Property Office");
    setContactPhone("0917-890-1234");
    setOfficeHours("Daily 8:00 AM – 7:00 PM");
    setFooterBadge("Official Notice");
    setBrandColor("#8b5cf6");
    setBgPreset("solid_white");
    setCardColor("#ffffff");
    setCardOpacity(95);
    setFontFamily("modern_sans");
    setTitleTransform("uppercase");
    setLetterSpacing("tight");
    setCustomBgImage(null);
    setPhotoBrightness(100);
    setPhotoSaturation(100);
    setPhotoOpacity(100);
    setShowBanner(true);
    setShowSteps(true);
    setShowWifi(true);
    setShowOffice(true);
    setActiveFloatingTool(null);
    toast.success("Poster reset to defaults");
  };

  if (!isOpen) return null;

  // Background Theme Resolver
  const isDarkCanvas = bgPreset === "solid_dark";

  const getPosterBgClass = () => {
    switch (bgPreset) {
      case "solid_dark":
        return "bg-[#111115] text-white border-zinc-800";
      case "warm_ivory":
        return "bg-[#fafaf6] text-zinc-950 border-stone-200";
      case "dot_pattern":
        return "bg-white text-zinc-950 border-zinc-200 [background-image:radial-gradient(#9ca3af_1.2px,transparent_1.2px)] [background-size:16px_16px]";
      case "grid_blueprint":
        return "bg-white text-zinc-950 border-zinc-200 [background-image:linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]";
      case "custom_photo":
        return "text-white border-zinc-800";
      case "solid_white":
      default:
        return "bg-white text-zinc-950 border-zinc-200";
    }
  };

  // Typography Helpers
  const selectedFontCss = FONT_FAMILIES.find((f) => f.id === fontFamily)?.css || FONT_FAMILIES[0].css;

  const trackingClass =
    letterSpacing === "wide"
      ? "tracking-widest"
      : letterSpacing === "normal"
      ? "tracking-normal"
      : "tracking-tight";

  // Dynamic Contrast Colors calculated from user's Card Color Picker
  const cardContrast = getContrastColor(cardColor);
  const cardRgbaBackground = hexToRgba(cardColor, cardOpacity);

  // Editable Field Styling - Cleaned automatically during exports
  const isEditingActive = isDirectEditMode && !isExportingPoster;
  const editableClass = isEditingActive
    ? "outline-dashed outline-1 outline-primary/50 hover:outline-primary hover:bg-primary/5 focus:outline-solid focus:outline-1 focus:outline-primary focus:bg-primary/5 rounded-[inherit] transition-all cursor-text"
    : "outline-none";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 print:hidden"
        />

        {/* Hidden Input for Background Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* ========================================================================= */}
        {/* UNIFIED PERSISTENT DRAGGABLE FLOATING INSPECTOR (Never resets position) */}
        {/* ========================================================================= */}
        {activeFloatingTool && (
          <motion.div
            drag
            dragListener={false}
            dragControls={inspectorDragControls}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-6 sm:left-24 top-20 z-[160] w-72 neumorphic-panel rounded-2xl border border-border/60 shadow-2xl p-3.5 bg-background/95 backdrop-blur-xl flex flex-col gap-3 print:hidden select-none"
          >
            {/* Drag Handle Header with Mini Tool Switcher */}
            <div
              onPointerDown={(e) => inspectorDragControls.start(e)}
              className="flex items-center justify-between pb-2 border-b border-border/40 cursor-grab active:cursor-grabbing hover:bg-muted/20 rounded-t-lg -mx-1 px-1 py-0.5 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground">
                <GripVertical className="size-3.5 text-muted-foreground" />
                {activeFloatingTool === "colors" && (
                  <>
                    <Palette className="size-3.5 text-primary" />
                    <span>Colors & Opacity</span>
                  </>
                )}
                {activeFloatingTool === "background" && (
                  <>
                    <ImageIcon className="size-3.5 text-primary" />
                    <span>Canvas & Photos</span>
                  </>
                )}
                {activeFloatingTool === "typography" && (
                  <>
                    <CaseSensitive className="size-3.5 text-primary" />
                    <span>Typography</span>
                  </>
                )}
                {activeFloatingTool === "sections" && (
                  <>
                    <Layers className="size-3.5 text-primary" />
                    <span>Sections</span>
                  </>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setActiveFloatingTool(null)}
                className="size-6 rounded-lg neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Quick In-Window Tool Switcher */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center justify-between neumorphic-inset rounded-xl p-1 gap-1"
            >
              <button
                type="button"
                title="Colors & Card Opacity"
                onClick={() => setActiveFloatingTool("colors")}
                className={cn(
                  "flex-1 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                  activeFloatingTool === "colors" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Palette className="size-3" />
                <span className="hidden sm:inline">Colors</span>
              </button>
              <button
                type="button"
                title="Canvas Background & Photos"
                onClick={() => setActiveFloatingTool("background")}
                className={cn(
                  "flex-1 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                  activeFloatingTool === "background" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ImageIcon className="size-3" />
                <span className="hidden sm:inline">Canvas</span>
              </button>
              <button
                type="button"
                title="Typography & Letter Spacing"
                onClick={() => setActiveFloatingTool("typography")}
                className={cn(
                  "flex-1 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                  activeFloatingTool === "typography" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CaseSensitive className="size-3" />
                <span className="hidden sm:inline">Type</span>
              </button>
              <button
                type="button"
                title="Visible Sections"
                onClick={() => setActiveFloatingTool("sections")}
                className={cn(
                  "flex-1 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1",
                  activeFloatingTool === "sections" ? "bg-primary text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="size-3" />
                <span className="hidden sm:inline">Sections</span>
              </button>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: COLOR & OPACITY */}
            {/* ======================================================== */}
            {activeFloatingTool === "colors" && (
              <div className="flex flex-col gap-3">
                {/* Sub Tabs: Card vs Brand Accent */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex items-center neumorphic-inset rounded-xl p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setActiveColorTab("card")}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      activeColorTab === "card" ? "bg-primary text-white shadow-xs" : "text-muted-foreground"
                    )}
                  >
                    Card Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveColorTab("brand")}
                    className={cn(
                      "flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      activeColorTab === "brand" ? "bg-primary text-white shadow-xs" : "text-muted-foreground"
                    )}
                  >
                    Brand Accent
                  </button>
                </div>

                {/* Compact Color Picker */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="mini-colorful-container rounded-xl overflow-hidden border border-border/40 p-1 bg-muted/20"
                >
                  <HexColorPicker
                    color={activeColorTab === "card" ? cardColor : brandColor}
                    onChange={(hex) => {
                      if (activeColorTab === "card") {
                        setCardColor(hex);
                      } else {
                        setBrandColor(hex);
                      }
                    }}
                  />
                </div>

                {/* Hex Input */}
                <div onPointerDown={(e) => e.stopPropagation()} className="flex items-center gap-2">
                  <div
                    className="size-6 rounded-md shadow-xs border border-white/20 shrink-0"
                    style={{ backgroundColor: activeColorTab === "card" ? cardColor : brandColor }}
                  />
                  <div className="flex-1 neumorphic-inset rounded-lg h-7 px-2 flex items-center justify-between border border-border/40">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground">HEX</span>
                    <input
                      type="text"
                      value={(activeColorTab === "card" ? cardColor : brandColor).toUpperCase()}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith("#")) val = "#" + val;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          if (activeColorTab === "card") setCardColor(val);
                          else setBrandColor(val);
                        }
                      }}
                      className="bg-transparent text-right font-mono font-black text-[11px] text-foreground uppercase outline-none w-20"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Card Opacity Slider */}
                {activeColorTab === "card" && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex flex-col gap-1 neumorphic-inset rounded-xl p-2"
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sliders className="size-2.5" />
                        <span>Card Opacity</span>
                      </span>
                      <span className="font-mono font-bold text-foreground w-9 text-right tabular-nums inline-block shrink-0">
                        {cardOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={cardOpacity}
                      onChange={(e) => setCardOpacity(Number(e.target.value))}
                      className="w-full h-1 rounded appearance-none cursor-pointer bg-muted"
                    />
                  </div>
                )}

                {/* Quick Swatches */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="grid grid-cols-6 gap-1 pt-1 border-t border-border/30"
                >
                  {(activeColorTab === "card" ? CARD_PRESETS : COLOR_PRESETS).map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      title={"label" in p ? p.label : p.name}
                      onClick={() => {
                        if (activeColorTab === "card") setCardColor(p.hex);
                        else setBrandColor(p.hex);
                      }}
                      className={cn(
                        "h-6 rounded-md border border-white/20 transition-transform active:scale-95 relative flex items-center justify-center",
                        (activeColorTab === "card" ? cardColor : brandColor).toLowerCase() ===
                          p.hex.toLowerCase() && "ring-2 ring-primary ring-offset-1 scale-105"
                      )}
                      style={{ backgroundColor: p.hex }}
                    >
                      {(activeColorTab === "card" ? cardColor : brandColor).toLowerCase() ===
                        p.hex.toLowerCase() && (
                        <Check className="size-2.5 text-zinc-900 stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: CANVAS & BACKGROUND PHOTOS */}
            {/* ======================================================== */}
            {activeFloatingTool === "background" && (
              <div className="flex flex-col gap-3">
                {/* Preset Textures */}
                <div onPointerDown={(e) => e.stopPropagation()} className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Canvas Texture
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {BG_PRESETS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBgPreset(b.id);
                          setCustomBgImage(null);
                        }}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-1",
                          bgPreset === b.id && !customBgImage
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "neumorphic-inset text-muted-foreground hover:text-foreground border-transparent"
                        )}
                      >
                        <b.icon className="size-3.5" />
                        <span className="truncate">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Photo Upload & Filters */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="space-y-2 pt-2 border-t border-border/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Custom Photo
                    </span>
                    {customBgImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBgImage(null);
                          setBgPreset("solid_white");
                        }}
                        className="text-[9px] font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <Trash2 className="size-2.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border active:scale-95",
                      customBgImage
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "neumorphic-extruded text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    <Upload className="size-3.5" />
                    <span>{customBgImage ? "Replace Background Photo" : "Upload Building Photo"}</span>
                  </button>

                  {/* Photo Filter Sliders */}
                  {customBgImage && (
                    <div className="space-y-1.5 pt-1">
                      {/* Brightness */}
                      <div className="flex flex-col gap-1 neumorphic-inset rounded-xl p-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                          <span>Brightness</span>
                          <span className="font-mono font-bold text-foreground w-9 text-right tabular-nums inline-block shrink-0">
                            {photoBrightness}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="180"
                          value={photoBrightness}
                          onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                          className="w-full h-1 rounded appearance-none cursor-pointer bg-muted"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="flex flex-col gap-1 neumorphic-inset rounded-xl p-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                          <span>Saturation</span>
                          <span className="font-mono font-bold text-foreground w-9 text-right tabular-nums inline-block shrink-0">
                            {photoSaturation}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={photoSaturation}
                          onChange={(e) => setPhotoSaturation(Number(e.target.value))}
                          className="w-full h-1 rounded appearance-none cursor-pointer bg-muted"
                        />
                      </div>

                      {/* Photo Opacity */}
                      <div className="flex flex-col gap-1 neumorphic-inset rounded-xl p-2">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                          <span>Photo Opacity</span>
                          <span className="font-mono font-bold text-foreground w-9 text-right tabular-nums inline-block shrink-0">
                            {photoOpacity}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={photoOpacity}
                          onChange={(e) => setPhotoOpacity(Number(e.target.value))}
                          className="w-full h-1 rounded appearance-none cursor-pointer bg-muted"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 3: TYPOGRAPHY & SPACING */}
            {/* ======================================================== */}
            {activeFloatingTool === "typography" && (
              <div className="flex flex-col gap-3">
                {/* Font Pairing */}
                <div onPointerDown={(e) => e.stopPropagation()} className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Font Pairing
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_FAMILIES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFontFamily(f.id)}
                        className={cn(
                          "py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center",
                          fontFamily === f.id
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "neumorphic-inset text-muted-foreground hover:text-foreground border-transparent"
                        )}
                        style={{ fontFamily: f.css }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Casing */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="space-y-1.5 pt-2 border-t border-border/30"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Title Case
                  </span>
                  <div className="grid grid-cols-2 gap-1 neumorphic-inset rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setTitleTransform("uppercase")}
                      className={cn(
                        "py-1 text-[10px] font-bold rounded-lg transition-all uppercase",
                        titleTransform === "uppercase"
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      UPPERCASE
                    </button>
                    <button
                      type="button"
                      onClick={() => setTitleTransform("none")}
                      className={cn(
                        "py-1 text-[10px] font-bold rounded-lg transition-all capitalize",
                        titleTransform === "none"
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground"
                      )}
                    >
                      Title Case
                    </button>
                  </div>
                </div>

                {/* Letter Spacing */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="space-y-1.5 pt-2 border-t border-border/30"
                >
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    Letter Spacing
                  </span>
                  <div className="grid grid-cols-3 gap-1 neumorphic-inset rounded-xl p-0.5">
                    {[
                      { id: "tight", label: "Tight" },
                      { id: "normal", label: "Normal" },
                      { id: "wide", label: "Wide" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setLetterSpacing(s.id as LetterSpacingChoice)}
                        className={cn(
                          "py-1 text-[10px] font-bold rounded-lg transition-all",
                          letterSpacing === s.id
                            ? "bg-primary text-white shadow-xs"
                            : "text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 4: VISIBLE SECTIONS */}
            {/* ======================================================== */}
            {activeFloatingTool === "sections" && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  Toggle Visibility
                </span>
                <div onPointerDown={(e) => e.stopPropagation()} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowBanner(!showBanner)}
                    className={cn(
                      "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border",
                      showBanner
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "neumorphic-inset text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Megaphone className="size-3.5" />
                      <span>Welcome Notice</span>
                    </div>
                    {showBanner && <Check className="size-3 stroke-[3]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSteps(!showSteps)}
                    className={cn(
                      "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border",
                      showSteps
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "neumorphic-inset text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <ListOrdered className="size-3.5" />
                      <span>3-Step Guide</span>
                    </div>
                    {showSteps && <Check className="size-3 stroke-[3]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWifi(!showWifi)}
                    className={cn(
                      "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border",
                      showWifi
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "neumorphic-inset text-muted-foreground hover:text-foreground border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Wifi className="size-3.5" />
                      <span>Wi-Fi Details</span>
                    </div>
                    {showWifi && <Check className="size-3 stroke-[3]" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Studio Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-4xl max-h-[96vh] neumorphic-panel rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:rounded-none print:w-full print:max-h-none print:m-0"
        >
          {/* Main Top Navigation Header - Premium & Modern */}
          <div className="h-13 px-3.5 sm:px-5 border-b border-border/50 flex items-center justify-between bg-background/95 backdrop-blur-md shrink-0 print:hidden">
            {/* Left: Studio Branding & Property Context */}
            <div className="flex items-center gap-2.5">
              <div
                className="size-7 rounded-lg flex items-center justify-center font-bold shadow-xs"
                style={{ backgroundColor: `${brandColor}18`, color: brandColor }}
              >
                <QrCode className="size-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-foreground">
                  Lobby Poster Studio
                </span>
                {propertyName && (
                  <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40 hidden md:inline truncate max-w-[140px]">
                    {propertyName}
                  </span>
                )}
              </div>

              {/* Segmented Mode Switcher */}
              <div className="flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/40 ml-2">
                <button
                  type="button"
                  onClick={() => setIsDirectEditMode(false)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1",
                    !isDirectEditMode
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDirectEditMode(true)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1",
                    isDirectEditMode
                      ? "bg-primary text-white shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Edit3 className="size-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Right Action Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Subtle Autosave Dot */}
              <div className="items-center gap-1.5 text-muted-foreground mr-1 hidden lg:flex">
                {saveStatus === "saving" ? (
                  <>
                    <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[10px] font-medium">Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">Synced</span>
                  </>
                )}
              </div>

              {/* Reset to Defaults */}
              <button
                type="button"
                onClick={handleResetDefaults}
                title="Reset to defaults"
                className="size-8 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all flex items-center justify-center"
              >
                <RotateCcw className="size-3.5" />
              </button>

              {/* Save Template Button */}
              <button
                type="button"
                disabled={isSavingTemplate}
                onClick={() => handleSaveTemplate(false)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50",
                  hasSavedTemplate
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold"
                    : "border-border/60 hover:bg-muted/40 text-foreground"
                )}
                title="Save this design as a cloud template"
              >
                {hasSavedTemplate ? (
                  <Check className="size-3.5 text-emerald-500 stroke-[2.5]" />
                ) : (
                  <Cloud className="size-3.5 text-muted-foreground" />
                )}
                <span>{hasSavedTemplate ? "Saved" : isSavingTemplate ? "Saving..." : "Save Template"}</span>
              </button>

              {/* Download Poster Button */}
              <button
                type="button"
                disabled={isExportingPoster}
                onClick={handleDownloadPoster}
                className="h-8 px-3.5 rounded-lg text-xs font-bold text-white shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                <Download className="size-3.5" />
                <span>Download</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all flex items-center justify-center ml-0.5"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Main Poster Canvas Viewport + Floating Tool Dock */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar-premium flex items-center justify-center bg-muted/20 relative print:p-0 print:bg-white print:overflow-visible">
            {/* PERSISTENT FLOATING OFFLINE NOTIFICATION BADGE */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-amber-500 text-amber-950 shadow-2xl backdrop-blur-xl border border-amber-300 flex items-center gap-2.5 select-none print:hidden pointer-events-auto"
                >
                  <div className="size-6 rounded-xl bg-amber-950/20 flex items-center justify-center shrink-0">
                    <WifiOff className="size-3.5 text-amber-950 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-tight">
                      You are Offline
                    </span>
                    <span className="text-[10px] font-semibold text-amber-950/90 leading-tight">
                      Changes are safe on this device and will auto-sync once reconnected.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING FIGMA-STYLE TOOL DOCK (Left Side) */}
            <div className="absolute left-4 top-6 z-30 flex flex-col gap-2 neumorphic-panel rounded-2xl p-1.5 border border-border/50 shadow-xl bg-background/90 backdrop-blur-md print:hidden">
              {/* Tool 1: Colors & Card Opacity */}
              <button
                type="button"
                title="Colors & Card Opacity"
                onClick={() =>
                  setActiveFloatingTool(activeFloatingTool === "colors" ? null : "colors")
                }
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
                  activeFloatingTool === "colors"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Palette className="size-4" />
              </button>

              {/* Tool 2: Canvas Background & Photo Adjustments */}
              <button
                type="button"
                title="Canvas Background & Photo Adjustments"
                onClick={() =>
                  setActiveFloatingTool(activeFloatingTool === "background" ? null : "background")
                }
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
                  activeFloatingTool === "background"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <ImageIcon className="size-4" />
              </button>

              {/* Tool 3: Typography & Spacing */}
              <button
                type="button"
                title="Typography & Letter Spacing"
                onClick={() =>
                  setActiveFloatingTool(activeFloatingTool === "typography" ? null : "typography")
                }
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
                  activeFloatingTool === "typography"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <CaseSensitive className="size-4" />
              </button>

              {/* Tool 4: Section Toggles */}
              <button
                type="button"
                title="Visible Sections"
                onClick={() =>
                  setActiveFloatingTool(activeFloatingTool === "sections" ? null : "sections")
                }
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-all active:scale-95",
                  activeFloatingTool === "sections"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Layers className="size-4" />
              </button>
            </div>

            {/* AUTHENTIC A4 CANVAS SHEET (Spacious & Clean) */}
            <div
              ref={posterRef}
              id="lobby-poster-canvas"
              className={cn(
                "w-full max-w-[500px] shadow-[0_15px_40px_rgba(0,0,0,0.35)] p-5 sm:p-6 flex flex-col justify-between gap-3.5 border rounded-2xl transition-all duration-200 relative overflow-hidden print:shadow-none print:border-none print:rounded-none print:p-6 print:w-full print:max-w-none print:h-auto",
                getPosterBgClass()
              )}
              style={{
                fontFamily: selectedFontCss,
                backgroundColor: customBgImage ? "#09090b" : undefined,
              }}
            >
              {/* Custom Photo Layer with Real-Time CSS Filters */}
              {customBgImage && (
                <div
                  className="absolute inset-0 pointer-events-none transition-all"
                  style={{
                    backgroundImage: `url(${customBgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: photoOpacity / 100,
                    filter: `brightness(${photoBrightness}%) saturate(${photoSaturation}%)`,
                  }}
                />
              )}

              {/* Poster Content Layers */}
              <div className="relative z-10 flex flex-col justify-between gap-3.5 h-full">
                {/* 1. Header Card (Uses Custom Card Color & Opacity + Auto-Contrast Text) */}
                <div
                  className="p-3 rounded-xl flex items-center justify-between shadow-sm backdrop-blur-md transition-colors"
                  style={{
                    backgroundColor: cardRgbaBackground,
                    borderColor: cardContrast.border,
                    borderWidth: "1px",
                    color: cardContrast.text,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                    <div
                      className="size-9 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Building2 className="size-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setPropertyName(e.currentTarget.textContent || "")}
                        className={cn(
                          "text-base font-black leading-tight block transition-all",
                          titleTransform === "uppercase" ? "uppercase" : "normal-case",
                          trackingClass,
                          editableClass
                        )}
                        style={{ color: cardContrast.text }}
                      >
                        {propertyName}
                      </h1>
                      <p
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setAddress(e.currentTarget.textContent || "")}
                        className={cn(
                          "text-[10px] font-medium leading-tight block truncate",
                          editableClass
                        )}
                        style={{ color: cardContrast.muted }}
                      >
                        {address}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <BrandLogo
                      size="sm"
                      showText={false}
                      theme={cardContrast.isLight ? "light" : "dark"}
                      className="h-5 w-16"
                    />
                    <span
                      contentEditable={isEditingActive}
                      suppressContentEditableWarning
                      onBlur={(e) => setPortalSubheading(e.currentTarget.textContent || "")}
                      className={cn(
                        "text-[8px] font-bold uppercase tracking-widest mt-0.5",
                        editableClass
                      )}
                      style={{ color: cardContrast.muted }}
                    >
                      {portalSubheading}
                    </span>
                  </div>
                </div>

                {/* 2. Welcome Banner (Clean Announcement) */}
                {showBanner && (
                  <div
                    className="p-2.5 rounded-xl text-center text-white relative overflow-hidden shadow-sm"
                    style={{
                      backgroundColor: brandColor,
                    }}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wider mb-0.5">
                      <Megaphone className="size-2.5" />
                      <span
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setBannerHeading(e.currentTarget.textContent || "")}
                        className={cn(editableClass)}
                      >
                        {bannerHeading}
                      </span>
                    </div>
                    <p
                      contentEditable={isEditingActive}
                      suppressContentEditableWarning
                      onBlur={(e) => setTagline(e.currentTarget.textContent || "")}
                      className={cn(
                        "text-[10px] text-white/95 leading-tight block max-w-sm mx-auto",
                        isEditingActive
                          ? "outline-dashed outline-1 outline-white/50 hover:outline-white hover:bg-white/10 rounded px-1 transition-all cursor-text"
                          : "outline-none"
                      )}
                    >
                      {tagline}
                    </p>
                  </div>
                )}

                {/* 3. Dual High-Resolution QR Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left: Android App */}
                  <div
                    className="p-3 rounded-xl flex flex-col items-center text-center gap-2 relative group shadow-sm backdrop-blur-md transition-colors"
                    style={{
                      backgroundColor: cardRgbaBackground,
                      borderColor: cardContrast.border,
                      borderWidth: "1px",
                      color: cardContrast.text,
                    }}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                      <Smartphone className="size-3" style={{ color: brandColor }} />
                      <span
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setApkCardTitle(e.currentTarget.textContent || "")}
                        className={cn(editableClass)}
                        style={{ color: cardContrast.text }}
                      >
                        {apkCardTitle}
                      </span>
                    </div>

                    <div className="size-24 sm:size-26 rounded-lg bg-white p-1 border border-zinc-200 shadow-inner flex items-center justify-center relative">
                      <img
                        src={apkQrUrl}
                        crossOrigin="anonymous"
                        alt="Android APK QR Code"
                        className="size-full object-contain"
                      />

                      {/* Hover Download PNG Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadQrImage(
                            downloadApkQrUrl,
                            `${propertyName.replace(/\s+/g, "_")}_Android_APK_QR.png`
                          )
                        }
                        title="Download high-res PNG (1000px)"
                        className="absolute inset-0 bg-black/75 rounded-lg text-white text-[9px] font-bold flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs print:hidden"
                      >
                        <Download className="size-4 text-emerald-400" />
                        <span>Save PNG</span>
                      </button>
                    </div>

                    <div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white shadow-xs inline-flex items-center justify-center transition-all",
                          isEditingActive && "ring-1 ring-dashed ring-white/80 cursor-text"
                        )}
                        style={{ backgroundColor: brandColor }}
                      >
                        <span
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setApkCardBadge(e.currentTarget.textContent || "")}
                          className="outline-none"
                        >
                          {apkCardBadge}
                        </span>
                      </span>
                      <p
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setApkCardSubtitle(e.currentTarget.textContent || "")}
                        className={cn("text-[8px] mt-0.5 font-medium", editableClass)}
                        style={{ color: cardContrast.muted }}
                      >
                        {apkCardSubtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right: Instant Web Portal */}
                  <div
                    className="p-3 rounded-xl flex flex-col items-center text-center gap-2 relative group shadow-sm backdrop-blur-md transition-colors"
                    style={{
                      backgroundColor: cardRgbaBackground,
                      borderColor: cardContrast.border,
                      borderWidth: "1px",
                      color: cardContrast.text,
                    }}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
                      <Globe className="size-3" style={{ color: brandColor }} />
                      <span
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setWebCardTitle(e.currentTarget.textContent || "")}
                        className={cn(editableClass)}
                        style={{ color: cardContrast.text }}
                      >
                        {webCardTitle}
                      </span>
                    </div>

                    <div className="size-24 sm:size-26 rounded-lg bg-white p-1 border border-zinc-200 shadow-inner flex items-center justify-center relative">
                      <img
                        src={portalQrUrl}
                        crossOrigin="anonymous"
                        alt="Web Resident Portal QR Code"
                        className="size-full object-contain"
                      />

                      {/* Hover Download PNG Button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadQrImage(
                            downloadPortalQrUrl,
                            `${propertyName.replace(/\s+/g, "_")}_Web_Portal_QR.png`
                          )
                        }
                        title="Download high-res PNG (1000px)"
                        className="absolute inset-0 bg-black/75 rounded-lg text-white text-[9px] font-bold flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs print:hidden"
                      >
                        <Download className="size-4 text-emerald-400" />
                        <span>Save PNG</span>
                      </button>
                    </div>

                    <div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-xs inline-flex items-center justify-center transition-all",
                          cardContrast.isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950",
                          isEditingActive && "ring-1 ring-dashed ring-primary/80 cursor-text"
                        )}
                      >
                        <span
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setWebCardBadge(e.currentTarget.textContent || "")}
                          className="outline-none"
                        >
                          {webCardBadge}
                        </span>
                      </span>
                      <p
                        contentEditable={isEditingActive}
                        suppressContentEditableWarning
                        onBlur={(e) => setWebCardSubtitle(e.currentTarget.textContent || "")}
                        className={cn("text-[8px] mt-0.5 font-medium", editableClass)}
                        style={{ color: cardContrast.muted }}
                      >
                        {webCardSubtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. 3-Step Guided Instructions */}
                {showSteps && (
                  <div
                    className="p-2.5 rounded-xl shadow-sm backdrop-blur-md transition-colors"
                    style={{
                      backgroundColor: cardRgbaBackground,
                      borderColor: cardContrast.border,
                      borderWidth: "1px",
                      color: cardContrast.text,
                    }}
                  >
                    <p
                      contentEditable={isEditingActive}
                      suppressContentEditableWarning
                      onBlur={(e) => setStepsHeading(e.currentTarget.textContent || "")}
                      className={cn(
                        "text-[8px] font-black uppercase tracking-widest text-center mb-1.5",
                        editableClass
                      )}
                      style={{ color: cardContrast.muted }}
                    >
                      {stepsHeading}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          className="size-5 rounded-md flex items-center justify-center text-white text-[9px] font-black shadow-xs"
                          style={{ backgroundColor: brandColor }}
                        >
                          1
                        </div>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep1Title(e.currentTarget.textContent || "")}
                          className={cn("text-[10px] font-bold leading-tight", editableClass)}
                          style={{ color: cardContrast.text }}
                        >
                          {step1Title}
                        </p>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep1Desc(e.currentTarget.textContent || "")}
                          className={cn("text-[8px] leading-tight", editableClass)}
                          style={{ color: cardContrast.muted }}
                        >
                          {step1Desc}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          className="size-5 rounded-md flex items-center justify-center text-white text-[9px] font-black shadow-xs"
                          style={{ backgroundColor: brandColor }}
                        >
                          2
                        </div>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep2Title(e.currentTarget.textContent || "")}
                          className={cn("text-[10px] font-bold leading-tight", editableClass)}
                          style={{ color: cardContrast.text }}
                        >
                          {step2Title}
                        </p>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep2Desc(e.currentTarget.textContent || "")}
                          className={cn("text-[8px] leading-tight", editableClass)}
                          style={{ color: cardContrast.muted }}
                        >
                          {step2Desc}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        <div
                          className="size-5 rounded-md flex items-center justify-center text-white text-[9px] font-black shadow-xs"
                          style={{ backgroundColor: brandColor }}
                        >
                          3
                        </div>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep3Title(e.currentTarget.textContent || "")}
                          className={cn("text-[10px] font-bold leading-tight", editableClass)}
                          style={{ color: cardContrast.text }}
                        >
                          {step3Title}
                        </p>
                        <p
                          contentEditable={isEditingActive}
                          suppressContentEditableWarning
                          onBlur={(e) => setStep3Desc(e.currentTarget.textContent || "")}
                          className={cn("text-[8px] leading-tight", editableClass)}
                          style={{ color: cardContrast.muted }}
                        >
                          {step3Desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Wi-Fi & Management Info */}
                {(showWifi || showOffice) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {showWifi && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl shadow-sm backdrop-blur-md transition-colors"
                        style={{
                          backgroundColor: cardRgbaBackground,
                          borderColor: cardContrast.border,
                          borderWidth: "1px",
                          color: cardContrast.text,
                        }}
                      >
                        <Wifi className="size-3.5 text-emerald-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            contentEditable={isEditingActive}
                            suppressContentEditableWarning
                            onBlur={(e) => setWifiHeader(e.currentTarget.textContent || "")}
                            className={cn(
                              "text-[8px] font-black uppercase tracking-wider leading-none",
                              editableClass
                            )}
                            style={{ color: cardContrast.muted }}
                          >
                            {wifiHeader}
                          </p>
                          <p
                            contentEditable={isEditingActive}
                            suppressContentEditableWarning
                            onBlur={(e) => setWifiSsid(e.currentTarget.textContent || "")}
                            className={cn(
                              "text-[10px] font-bold truncate mt-0.5 block",
                              editableClass
                            )}
                            style={{ color: cardContrast.text }}
                          >
                            {wifiSsid}
                          </p>
                          <p
                            className="text-[8px] font-mono flex items-center gap-1"
                            style={{ color: cardContrast.muted }}
                          >
                            <span>Pass:</span>
                            <span
                              contentEditable={isEditingActive}
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                setWifiPassword(e.currentTarget.textContent || "")
                              }
                              className={cn("font-bold", editableClass)}
                              style={{ color: cardContrast.text }}
                            >
                              {wifiPassword}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {showOffice && (
                      <div
                        className="flex items-center gap-2 p-2 rounded-xl shadow-sm backdrop-blur-md transition-colors"
                        style={{
                          backgroundColor: cardRgbaBackground,
                          borderColor: cardContrast.border,
                          borderWidth: "1px",
                          color: cardContrast.text,
                        }}
                      >
                        <Phone className="size-3.5 text-indigo-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            contentEditable={isEditingActive}
                            suppressContentEditableWarning
                            onBlur={(e) => setOfficeHeader(e.currentTarget.textContent || "")}
                            className={cn(
                              "text-[8px] font-black uppercase tracking-wider leading-none",
                              editableClass
                            )}
                            style={{ color: cardContrast.muted }}
                          >
                            {officeHeader}
                          </p>
                          <p
                            contentEditable={isEditingActive}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              setContactPhone(e.currentTarget.textContent || "")
                            }
                            className={cn(
                              "text-[10px] font-bold font-mono truncate mt-0.5 block",
                              editableClass
                            )}
                            style={{ color: cardContrast.text }}
                          >
                            {contactPhone}
                          </p>
                          <p
                            contentEditable={isEditingActive}
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              setOfficeHours(e.currentTarget.textContent || "")
                            }
                            className={cn(
                              "text-[8px] truncate block",
                              editableClass
                            )}
                            style={{ color: cardContrast.muted }}
                          >
                            {officeHours}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Footer Stamp */}
                <div
                  className={cn(
                    "flex items-center justify-between text-[8px] font-medium pt-0.5",
                    customBgImage ? "text-white/80" : isDarkCanvas ? "text-zinc-400" : "text-zinc-500"
                  )}
                >
                  <span
                    contentEditable={isEditingActive}
                    suppressContentEditableWarning
                    className={cn(editableClass)}
                  >
                    © {new Date().getFullYear()} {propertyName} · Resident Portal
                  </span>
                  <span className="flex items-center gap-1 font-mono font-bold">
                    <ShieldCheck className="size-2.5 text-emerald-500" />
                    <span
                      contentEditable={isEditingActive}
                      suppressContentEditableWarning
                      onBlur={(e) => setFooterBadge(e.currentTarget.textContent || "")}
                      className={cn(editableClass)}
                    >
                      {footerBadge}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
