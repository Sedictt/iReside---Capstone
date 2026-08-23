"use client";

import React, { useState } from "react";
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
  Laptop,
  Check,
  Building2,
  HardDrive,
  HelpCircle,
  Package,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";

export default function AppDownloadPage() {
  const [activeModal, setActiveModal] = useState<"qr" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      toast.success("Portal link copied to clipboard!", {
        description: "You can now share this URL with residents or open it on your Android phone.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadWindows = () => {
    toast.success("Downloading Windows Installer", {
      description: "iReside-Setup-v2.1.0-x64.exe (Tauri/Electron Native Client)",
    });
  };

  const handleDownloadAndroid = () => {
    toast.success("Downloading Android Package", {
      description: "iReside-Mobile-v2.1.0.apk (Android Native Client)",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 flex h-[4.5rem] items-center justify-between bg-background px-4 sm:px-8 text-foreground neumorphic-panel">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 shrink-0"
          >
            <Logo className="h-9 w-28 sm:h-10 sm:w-32" />
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <span className="neumorphic-inset px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Download className="size-3.5" />
              App Hub
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Windows & Android Clients
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="neumorphic-extruded hover:text-primary active:scale-95 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-14 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 neumorphic-inset px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            <Package className="size-3.5 text-primary" />
            <span>Native Clients · Windows Executable & Android APK</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-foreground leading-tight">
            Download the Dedicated Apps
          </h1>
          <p className="text-sm sm:text-base font-medium text-muted-foreground mt-3 leading-relaxed">
            Install the dedicated Windows desktop software for landlords, or grab the Android APK for mobile resident access with direct camera capture and push notifications.
          </p>
        </div>

        {/* 2-Column Platform Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto w-full">
          {/* Card 1: Windows Desktop App */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border border-border/50 transition-all hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl neumorphic-inset flex items-center justify-center text-primary">
                  <Monitor className="size-6" />
                </div>
                <span className="neumorphic-inset px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary">
                  Windows Installer (.exe)
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase tracking-wide text-foreground">
                  Windows Desktop Client
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Native desktop client packaged for Windows 10 & 11 (x64 / ARM64).
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Runs as a standalone desktop application with Start Menu icon</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Hardware-accelerated floor planner & multi-monitor support</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Fast local caching with seamless cloud database synchronization</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleDownloadWindows}
              className="w-full py-3.5 px-4 rounded-2xl neumorphic-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Download className="size-4" />
              <span>Download for Windows (.exe)</span>
            </button>
          </div>

          {/* Card 2: Android Mobile App */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border border-border/50 transition-all hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-12 rounded-2xl neumorphic-inset flex items-center justify-center text-emerald-500">
                  <Smartphone className="size-6" />
                </div>
                <span className="neumorphic-inset px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500">
                  Android Package (.apk)
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase tracking-wide text-foreground">
                  Android Mobile Client
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Direct installable APK package for Android smartphones and tablets.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Native camera hardware access for instant receipt capture</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Real-time push notifications for rent dues & announcements</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Full-screen touch interface & maintenance chat</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleDownloadAndroid}
                className="flex-1 py-3.5 px-4 rounded-2xl neumorphic-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Download className="size-4" />
                <span>Download APK</span>
              </button>

              <button
                onClick={() => setActiveModal("qr")}
                className="py-3.5 px-4 rounded-2xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-foreground"
                title="Show QR Code"
              >
                <QrCode className="size-4" />
                <span className="sm:hidden">Scan QR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Universal Web Access Banner */}
        <div className="neumorphic-inset rounded-2xl p-4 flex items-center justify-between gap-4 max-w-4xl mx-auto w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Globe className="size-4 text-primary shrink-0" />
            <span>
              <strong className="text-foreground">Universal Web Access:</strong> Users without the app installed can always access their portal directly in any standard browser.
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="neumorphic-extruded hover:text-primary active:scale-95 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground transition-all shrink-0 flex items-center gap-1.5"
          >
            <Share2 className="size-3" />
            <span>{copiedLink ? "Copied!" : "Copy Portal URL"}</span>
          </button>
        </div>

        {/* Disaster Recovery & Cloud Architecture Banner */}
        <section className="neumorphic-extruded rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-border/50 max-w-4xl mx-auto w-full">
          <div className="flex items-start gap-4">
            <div className="size-12 sm:size-14 rounded-2xl neumorphic-inset flex items-center justify-center text-primary shrink-0">
              <HardDrive className="size-6 sm:size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                <h3 className="text-base font-black uppercase tracking-wide text-foreground">
                  Zero Local Data Risk · 100% Cloud Synced
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Your database does not live on individual laptops or phones. All signed leases, ledger entries, and photos reside safely in your private cloud instance. Reinstalling or switching devices requires zero data migrations.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-4 max-w-4xl mx-auto w-full">
          <h2 className="text-center text-lg font-black uppercase tracking-wider text-foreground">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                <HelpCircle className="size-3.5 text-primary" />
                How do I install the Android APK?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download the APK file directly or scan the QR code on your Android device. Tap the downloaded file and allow &apos;Install from this source&apos; when prompted.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                <HelpCircle className="size-3.5 text-primary" />
                Can I be logged in on multiple devices?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! Landlords can operate the Master Dashboard on their Windows PC while monitoring payments on their Android smartphone simultaneously.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                <HelpCircle className="size-3.5 text-primary" />
                What are the system requirements?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The desktop client supports Windows 10 (64-bit) and Windows 11. The Android client requires Android 8.0 (Oreo) or newer with camera permissions.
              </p>
            </div>

            <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
                <HelpCircle className="size-3.5 text-primary" />
                How do tenants receive their mobile download link?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The landlord generates and prints a QR code poster from their Dashboard. Residents scan the QR code with their phone to download the APK or open the web client immediately.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL: QR CODE SCANNER MODAL FOR ANDROID APK DOWNLOAD */}
      <AnimatePresence>
        {activeModal === "qr" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-sm neumorphic-panel rounded-3xl p-6 sm:p-8 border border-border shadow-2xl flex flex-col items-center gap-5 text-center"
            >
              <div className="flex items-center justify-between w-full pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                    Android APK Download QR
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="size-7 rounded-xl neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* QR Box */}
              <div className="size-48 rounded-2xl neumorphic-inset p-4 flex items-center justify-center bg-white">
                <svg
                  viewBox="0 0 100 100"
                  className="size-full text-zinc-950"
                  fill="currentColor"
                >
                  <rect width="25" height="25" />
                  <rect x="75" width="25" height="25" />
                  <rect y="75" width="25" height="25" />
                  <rect x="5" y="5" width="15" height="15" fill="white" />
                  <rect x="80" y="5" width="15" height="15" fill="white" />
                  <rect x="5" y="80" width="15" height="15" fill="white" />
                  <rect x="8" y="8" width="9" height="9" fill="black" />
                  <rect x="83" y="8" width="9" height="9" fill="black" />
                  <rect x="8" y="83" width="9" height="9" fill="black" />
                  <rect x="35" y="10" width="10" height="20" />
                  <rect x="55" y="10" width="10" height="10" />
                  <rect x="35" y="40" width="30" height="10" />
                  <rect x="10" y="40" width="15" height="10" />
                  <rect x="75" y="40" width="15" height="20" />
                  <rect x="40" y="60" width="15" height="15" />
                  <rect x="65" y="70" width="20" height="15" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-foreground">
                  Scan to Download APK Directly
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Point your Android camera at this code to download the APK installer directly to your phone.
                </p>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="neumorphic-primary px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all w-full"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
