"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Globe,
  X,
  Check,
  HardDrive,
  HelpCircle,
  Package,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppDownloadPage() {
  const { user, loading } = useAuth();

  const [activeModal, setActiveModal] = useState<"qr" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);
  const [isWindowsDownloading, setIsWindowsDownloading] = useState(false);
  const [isAndroidDownloading, setIsAndroidDownloading] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const apkDirectDownloadUrl = origin
    ? `${origin}/api/mobile-release?download=1`
    : "/api/mobile-release?download=1";

  const qrCodeApiUrl = origin
    ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(apkDirectDownloadUrl)}`
    : "";

  // Handle Escape key to dismiss active modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModal) {
        setActiveModal(null);
      }
    },
    [activeModal]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      toast.success("Web portal URL copied to clipboard", {
        description: "You can open this link in any browser or share it with residents.",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyApkLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(apkDirectDownloadUrl);
      setCopiedApkUrl(true);
      toast.success("APK download URL copied to clipboard", {
        description: "Share this direct download link to install on Android devices.",
      });
      setTimeout(() => setCopiedApkUrl(false), 2500);
    }
  };

  const handleDownloadWindows = async () => {
    try {
      setIsWindowsDownloading(true);
      const response = await fetch("/api/desktop-release", { cache: "no-store" });
      const release = (await response.json()) as {
        downloadUrl?: string;
        filename?: string;
        propertyName?: string;
        error?: string;
      };

      if (!response.ok || !release.downloadUrl || !release.filename) {
        throw new Error(release.error || "The Windows installer is not available yet.");
      }

      const link = document.createElement("a");
      link.href = release.downloadUrl;
      link.download = release.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Windows installer", {
        description: `${release.filename} for ${release.propertyName || "iReside"} has started downloading.`,
      });
    } catch (error) {
      toast.error("Windows installer is not ready", {
        description: error instanceof Error ? error.message : "Please try again shortly or check back later.",
      });
    } finally {
      setIsWindowsDownloading(false);
    }
  };

  const handleDownloadAndroid = async () => {
    try {
      setIsAndroidDownloading(true);
      const response = await fetch("/api/mobile-release", { cache: "no-store" });
      const release = (await response.json()) as {
        downloadUrl?: string;
        filename?: string;
        error?: string;
      };

      const downloadUrl = release?.downloadUrl || "/downloads/iReside-v1.0.0-release.apk";
      const filename = release?.filename || "iReside-v1.0.0-release.apk";

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Android Package", {
        description: `${filename} has started downloading.`,
      });
    } catch {
      const link = document.createElement("a");
      link.href = "/downloads/iReside-v1.0.0-release.apk";
      link.download = "iReside-v1.0.0-release.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Android Package", {
        description: "iReside-v1.0.0-release.apk has started downloading.",
      });
    } finally {
      setIsAndroidDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-16 sm:h-[4.5rem] items-center justify-between bg-background/95 backdrop-blur-md px-4 sm:px-8 border-b border-border/40 text-foreground neumorphic-panel">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="iReside Home"
          >
            <Logo className="h-8 w-28 sm:h-9 sm:w-32" />
          </Link>
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="h-4 w-px bg-border/60" aria-hidden="true" />
            <span className="neumorphic-inset px-2.5 py-1 rounded-xl text-xs font-semibold text-primary flex items-center gap-1.5">
              <Download className="size-3.5" />
              App Hub
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Windows & Android Clients
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hidden sm:inline-flex items-center gap-1"
          >
            Documentation
          </Link>

          {!loading && !user && (
            <Link
              href="/login"
              className="neumorphic-extruded hover:text-primary active:scale-95 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Sign In
            </Link>
          )}

          <ThemeToggle
            className="rounded-xl border border-border/60 bg-background shadow-xs focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle theme"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-14 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 neumorphic-inset px-3.5 py-1.5 rounded-full text-xs font-semibold text-muted-foreground">
            <Package className="size-3.5 text-primary shrink-0" />
            <span>Official Client Releases · Windows & Android</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight [text-wrap:balance]">
            Download the iReside Apps
          </h1>
          <p className="text-sm sm:text-base font-normal text-muted-foreground max-w-xl mx-auto leading-relaxed [text-wrap:pretty]">
            Experience the full speed and hardware capabilities of iReside with dedicated native applications for desktop landlords and mobile residents.
          </p>
        </section>

        {/* 2-Column Platform Cards Grid */}
        <section aria-label="Available download platforms" className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-4xl mx-auto w-full">
          {/* Card 1: Windows Desktop App */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border border-border/50 transition-all hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                  <Monitor className="size-6" />
                </div>
                <span className="neumorphic-inset px-3 py-1 rounded-xl text-xs font-semibold text-primary">
                  Windows 10 / 11 · 64-bit
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Windows Desktop Client
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Native desktop software engineered for landlords and property management teams.
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">.exe Installer</span>
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">x64 / ARM64</span>
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">Real-time Cloud Sync</span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Runs as a standalone desktop app with Windows Start Menu and Taskbar integration</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Hardware-accelerated floor planner and multi-window workspace</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>High-speed local caching with automatic cloud database synchronization</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadWindows}
                disabled={isWindowsDownloading}
                aria-label="Download Windows desktop installer"
                className="w-full py-3.5 px-4 rounded-2xl neumorphic-primary active:scale-95 disabled:cursor-wait disabled:opacity-70 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isWindowsDownloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Preparing installer...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    <span>Download for Windows (.exe)</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Windows 10 / 11 · Free Automatic Updates
              </p>
            </div>
          </div>

          {/* Card 2: Android Mobile App */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border border-border/50 transition-all hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl neumorphic-inset flex items-center justify-center text-emerald-500">
                  <Smartphone className="size-6" />
                </div>
                <span className="neumorphic-inset px-3 py-1 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Android 8.0+ · APK
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Android Mobile Client
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Direct installable APK package optimized for tenant portals and on-the-go access.
                </p>
              </div>

              {/* Specs Pills */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground font-medium">
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">Direct APK Package</span>
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">Phones & Tablets</span>
                <span className="neumorphic-inset px-2.5 py-1 rounded-lg">Push Notifications</span>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Native camera hardware access for instant payment receipt and document capture</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Real-time push notifications for rent dues, invoices, and notices</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Full-screen touch interface for maintenance ticketing and real-time chat</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleDownloadAndroid}
                  disabled={isAndroidDownloading}
                  aria-label="Download Android APK file"
                  className="flex-1 py-3.5 px-4 rounded-2xl neumorphic-primary active:scale-95 disabled:cursor-wait disabled:opacity-70 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isAndroidDownloading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Preparing APK...</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      <span>Download APK (.apk)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveModal("qr")}
                  aria-label="Open QR code to scan on Android phone"
                  className="py-3.5 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <QrCode className="size-4" />
                  <span>Scan QR</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Version 1.0.0 · Direct APK Package
              </p>
            </div>
          </div>
        </section>

        {/* Universal Web Access Banner */}
        <section aria-label="Web portal fallback" className="neumorphic-inset rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-4xl mx-auto w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-primary shrink-0" />
            <div>
              <strong className="text-foreground font-semibold">Universal Web Access: </strong>
              <span>
                Prefer not to install an application? You can sign in and access the full portal directly in any standard desktop or mobile web browser.
              </span>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            aria-label="Copy web portal URL to clipboard"
            className="neumorphic-extruded hover:text-primary active:scale-95 px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground transition-all shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {copiedLink ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5" />
                <span>Copy Portal URL</span>
              </>
            )}
          </button>
        </section>

        {/* Cloud Architecture & Safety Banner */}
        <section aria-label="Cloud synchronization architecture" className="neumorphic-extruded rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-border/50 max-w-4xl mx-auto w-full">
          <div className="flex items-start gap-4">
            <div className="size-12 sm:size-14 rounded-2xl neumorphic-inset flex items-center justify-center text-primary shrink-0">
              <HardDrive className="size-6 sm:size-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  Zero Local Data Risk · 100% Cloud Synchronized
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Your properties, leases, ledger entries, and photos are encrypted and stored safely in the cloud. Reinstalling the app or switching to another device requires zero manual backup or file migration.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-6 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about installing and running the iReside applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-primary shrink-0" />
                How do I install the Android APK?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download the APK file directly or scan the QR code with your phone. Once downloaded, tap the notification. When Android prompts &apos;Install unknown apps&apos;, enable permissions for your browser or file manager, then tap &apos;Install&apos;.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-primary shrink-0" />
                What if Windows SmartScreen shows a warning?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Because new application versions may still be building automated cloud reputation with Microsoft Defender, Windows may show a prompt. Click &apos;More info&apos; and select &apos;Run anyway&apos; to finish setup.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-primary shrink-0" />
                Can I be signed in on multiple devices?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. Landlords can operate the Master Dashboard on their desktop PC while receiving payment alerts on their phone. All changes synchronize instantly across all active sessions.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-2">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-primary shrink-0" />
                What are the minimum system requirements?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The desktop client supports Windows 10 (64-bit) and Windows 11. The Android client requires Android 8.0 (Oreo) or higher with camera permissions for payment receipts.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-6 px-4 sm:px-8 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} iReside. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Documentation & Handover
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Portal Home
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL: QR CODE SCANNER MODAL FOR ANDROID APK DOWNLOAD */}
      <AnimatePresence>
        {activeModal === "qr" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm neumorphic-panel rounded-3xl p-6 sm:p-7 border border-border shadow-2xl flex flex-col items-center gap-5 text-center"
            >
              <div className="flex items-center justify-between w-full pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-primary shrink-0" />
                  <h3 id="qr-modal-title" className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Android APK Download QR
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="size-7 rounded-xl neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close QR code dialog"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* QR Image Container */}
              <div className="size-52 rounded-2xl neumorphic-inset p-3 flex items-center justify-center bg-white shadow-inner">
                {qrCodeApiUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeApiUrl}
                    alt="QR code to download Android APK"
                    className="size-full object-contain rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-zinc-400">
                    <Loader2 className="size-6 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold tracking-tight text-foreground">
                  Scan to Download APK Directly
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Open your Android camera or QR scanner to download the installation package directly to your phone.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={() => {
                    handleDownloadAndroid();
                    setActiveModal(null);
                  }}
                  className="neumorphic-primary px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all w-full flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Download className="size-3.5" />
                  <span>Download APK to this Device</span>
                </button>

                <button
                  onClick={handleCopyApkLink}
                  className="neumorphic-extruded px-4 py-2 rounded-2xl text-xs font-semibold active:scale-95 transition-all w-full flex items-center justify-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {copiedApkUrl ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Download Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Download Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
