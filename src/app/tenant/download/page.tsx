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
  HardDrive,
  HelpCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export default function TenantDownloadPage() {
  const [activeModal, setActiveModal] = useState<"qr" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isWindowsDownloading, setIsWindowsDownloading] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      toast.success("Portal link copied to clipboard", {
        description: "You can open this URL directly on your phone browser or share it with household members.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
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
        description: `${release.filename} has started downloading.`,
      });
    } catch (error) {
      toast.error("Windows installer is not ready", {
        description: error instanceof Error ? error.message : "Please try again shortly.",
      });
    } finally {
      setIsWindowsDownloading(false);
    }
  };

  const handleDownloadAndroid = () => {
    toast.success("Downloading Android Package", {
      description: "iReside-Mobile-v2.1.0.apk (Android Native Client)",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 neumorphic-inset px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
            <Package className="size-3.5 text-primary" />
            <span>Dedicated Resident Clients</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            App Download Hub
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Install the native Android APK on your phone for direct receipt capture and push notifications, or grab the Windows desktop client for your PC.
          </p>
        </div>
      </div>

      {/* 2-Column Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full">
        {/* Card 1: Android Mobile App */}
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
                Installable APK package for Android smartphones and tablets.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Camera hardware access for instant GCash receipt capture</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Instant notifications for rent dues, invoices, and notices</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Touch-friendly maintenance chat and repair updates</span>
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
              <span>Scan QR</span>
            </button>
          </div>
        </div>

        {/* Card 2: Windows Desktop App */}
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
                Native desktop client for Windows 10 & 11 (64-bit).
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-muted-foreground pt-2">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Runs as a standalone desktop application with Start Menu icon</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Fast local caching with automatic cloud database sync</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Direct PDF export for signed leases and official receipts</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadWindows}
            disabled={isWindowsDownloading}
            className="w-full py-3.5 px-4 rounded-2xl neumorphic-primary active:scale-95 disabled:cursor-wait disabled:opacity-70 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Download className="size-4" />
            <span>{isWindowsDownloading ? "Preparing download..." : "Download for Windows (.exe)"}</span>
          </button>
        </div>
      </div>

      {/* Universal Web Access Banner */}
      <div className="neumorphic-inset rounded-2xl p-4 flex items-center justify-between gap-4 w-full text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <Globe className="size-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Universal Web Access:</strong> You can always access your tenant portal directly in any standard mobile or desktop web browser without installing an app.
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

      {/* Cloud Architecture & Safety Banner */}
      <section className="neumorphic-extruded rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-border/50 w-full">
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
              Your rental data is never confined to a single device. All leases, payment receipts, maintenance history, and chat records stay protected in your secure cloud account. Switching devices requires no data transfer.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-4 w-full">
        <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
          Frequently Asked Questions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
              <HelpCircle className="size-3.5 text-primary" />
              How do I install the Android APK?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download the APK file directly or scan the QR code with your Android phone. Tap the downloaded file in your browser downloads and allow &apos;Install from this source&apos; when prompted.
            </p>
          </div>

          <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
              <HelpCircle className="size-3.5 text-primary" />
              Can I be signed in on multiple devices?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Yes. You can use the web portal on your laptop while having the Android app on your phone. Both devices stay synchronized in real time.
            </p>
          </div>

          <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
              <HelpCircle className="size-3.5 text-primary" />
              What are the system requirements?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Android app requires Android 8.0 or newer. The desktop client supports Windows 10 (64-bit) and Windows 11.
            </p>
          </div>

          <div className="neumorphic-panel rounded-2xl p-5 border border-border/40 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wide text-foreground flex items-center gap-2">
              <HelpCircle className="size-3.5 text-primary" />
              Do I need the app to pay rent?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No. You can also view bills and submit GCash payment reference numbers directly via your standard web browser at any time.
            </p>
          </div>
        </div>
      </section>

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
