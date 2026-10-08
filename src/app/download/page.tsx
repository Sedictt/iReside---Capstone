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
  HelpCircle,
  Loader2,
  Copy,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppDownloadPage() {
  const [activeModal, setActiveModal] = useState<"qr" | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);
  const [isWindowsDownloading, setIsWindowsDownloading] = useState(false);
  const [isAndroidDownloading, setIsAndroidDownloading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
      toast.success("Website address copied", {
        description: "You can now paste and send this link to anyone.",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyApkLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(apkDirectDownloadUrl);
      setCopiedApkUrl(true);
      toast.success("Download link copied", {
        description: "Paste and send this link to install on any Android phone.",
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
        throw new Error(release.error || "The Windows installer is being prepared. Please try again shortly.");
      }

      const link = document.createElement("a");
      link.href = release.downloadUrl;
      link.download = release.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Windows app", {
        description: "Check your computer's Downloads folder to start installing.",
      });
    } catch (error) {
      toast.error("Download temporarily unavailable", {
        description: error instanceof Error ? error.message : "Please try again shortly or use the web browser version below.",
      });
    } finally {
      setIsWindowsDownloading(false);
    }
  };

  const handleDownloadAndroid = async (variant: "release" | "debug" = "release") => {
    try {
      setIsAndroidDownloading(true);
      const response = await fetch(`/api/mobile-release?variant=${variant}`, { cache: "no-store" });
      const release = (await response.json()) as {
        downloadUrl?: string;
        filename?: string;
        error?: string;
      };

      const fallbackFilename = variant === "debug" ? "iReside-v1.0.0-debug.apk" : "iReside-v1.0.0-release.apk";
      const downloadUrl = release?.downloadUrl || `/downloads/${fallbackFilename}`;
      const filename = release?.filename || fallbackFilename;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Android app", {
        description: "When the download finishes, tap the notification to install.",
      });
    } catch {
      const fallbackFilename = variant === "debug" ? "iReside-v1.0.0-debug.apk" : "iReside-v1.0.0-release.apk";
      const link = document.createElement("a");
      link.href = `/downloads/${fallbackFilename}`;
      link.download = fallbackFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Downloading Android app", {
        description: "When the download finishes, tap the notification to install.",
      });
    } finally {
      setIsAndroidDownloading(false);
    }
  };

  const faqs = [
    {
      question: "What if Windows says \"Windows protected your PC\"?",
      answer: "Don't worry! This is completely normal for newly downloaded software. Simply click \"More info\", then click the \"Run anyway\" button. iReside is safe, verified, and will install right away.",
    },
    {
      question: "How do I install the app on my Android phone?",
      answer: "Scan the QR code with your phone camera, or click \"Download Android App\". Once downloaded, tap the download notification. If your phone asks permission to install, tap \"Settings\", turn on \"Allow from this source\", and tap \"Install\".",
    },
    {
      question: "Do I need to download both the computer and phone apps?",
      answer: "No, only download what you need! Most landlords prefer using a computer or laptop for managing rooms and printing receipts, while tenants love using their phone to pay rent and view bills.",
    },
    {
      question: "Can I use both my computer and my phone?",
      answer: "Yes! Everything connects together in real time. If you update something on your computer, it will automatically show up on your phone.",
    },
    {
      question: "Will my data be lost if I get a new phone or computer?",
      answer: "No, never! All your properties, tenant records, and payment receipts are safely stored in the cloud. Just log in with your email and password on your new device.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 flex h-16 sm:h-20 items-center justify-between bg-background/95 backdrop-blur-md px-4 sm:px-8 border-b border-border/40 text-foreground neumorphic-panel">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex items-center transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="iReside Home"
          >
            <Logo className="h-8 w-28 sm:h-9 sm:w-32" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle
            className="rounded-xl border border-border/60 bg-background shadow-xs focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Toggle theme"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14">
        {/* Hero Section */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Download className="size-3.5 shrink-0" />
            <span>Official iReside Apps</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight [text-wrap:balance]">
            Get iReside on Your Device
          </h1>
          <p className="text-base sm:text-lg font-normal text-muted-foreground max-w-xl mx-auto leading-relaxed [text-wrap:pretty]">
            Choose your device below to get started. Everything connects together automatically so your records are always up to date.
          </p>
        </section>

        {/* 2-Column Platform Cards Grid */}
        <section
          aria-label="Download options"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-4xl mx-auto w-full"
        >
          {/* Card 1: Windows Computer */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border-2 border-blue-500/20 bg-card/60 hover:border-blue-500/40 transition-all shadow-sm">
            <div className="space-y-5">
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Monitor className="size-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Best for Landlords
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Windows Computer
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Best for managing rental properties, room layouts, and monthly billing on a desktop PC or laptop.
                </p>
              </div>

              {/* Benefits Checklist in Layman's Terms */}
              <ul className="space-y-3 text-sm text-foreground/90 pt-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Large, easy-to-read screen layout for comfortable typing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Interactive room map layout and 1-click printable receipts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>Automatically backs up all your records safely to the cloud</span>
                </li>
              </ul>
            </div>

            {/* Action Area */}
            <div className="space-y-2.5 pt-3">
              <button
                onClick={handleDownloadWindows}
                disabled={isWindowsDownloading}
                aria-label="Download for Windows Computer"
                className="w-full h-13 min-h-[52px] sm:min-h-[54px] px-6 rounded-2xl neumorphic-primary active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-md"
              >
                {isWindowsDownloading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Preparing download...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                    <span>Download for Windows PC</span>
                  </>
                )}
              </button>

              <Link
                href="/"
                className="w-full h-12 min-h-[48px] px-5 rounded-2xl neumorphic-extruded hover:text-primary active:scale-[0.98] text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Globe className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Open in Web Browser Instead</span>
              </Link>

              <div className="text-center pt-0.5">
                <p className="text-xs text-muted-foreground">
                  Works on Windows 10 & 11 · Free & safe to install
                </p>
              </div>

              {/* Reassuring 3-step hint for non-tech users */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">3 simple steps: </span>
                <span>1. Click Download → 2. Open file → 3. Sign in</span>
              </div>
            </div>
          </div>

          {/* Card 2: Android Phone & Tablet */}
          <div className="neumorphic-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 border-2 border-emerald-500/20 bg-card/60 hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="space-y-5">
              {/* Header with Icon and Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Smartphone className="size-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Best for Tenants & Mobile
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Android Phone & Tablet
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Take iReside with you anywhere. Best for paying rent, sending receipt photos, and receiving urgent alerts.
                </p>
              </div>

              {/* Benefits Checklist in Layman's Terms */}
              <ul className="space-y-3 text-sm text-foreground/90 pt-1">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Snap and upload payment receipt photos with your phone camera</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Receive reminder alerts when rent or utility bills are due</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Send direct repair requests and chat without leaving the app</span>
                </li>
              </ul>
            </div>

            {/* Action Area */}
            <div className="space-y-2.5 pt-3">
              <button
                onClick={() => handleDownloadAndroid("release")}
                disabled={isAndroidDownloading}
                aria-label="Download Android App directly"
                className="w-full h-13 min-h-[52px] sm:min-h-[54px] px-6 rounded-2xl neumorphic-primary active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-md"
              >
                {isAndroidDownloading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Preparing download...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-5" />
                    <span>Download Android App</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveModal("qr")}
                aria-label="Scan QR code with phone camera"
                className="w-full h-12 min-h-[48px] px-5 rounded-2xl neumorphic-extruded hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98] text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <QrCode className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Scan QR with Phone Camera</span>
              </button>

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-0.5">
                <span>Works on all Android phones</span>
                <button
                  type="button"
                  onClick={() => handleDownloadAndroid("debug")}
                  className="text-primary hover:underline font-medium focus-visible:outline-none"
                >
                  Trouble installing? Tap here
                </button>
              </div>

              {/* Reassuring 3-step hint for non-tech users */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">3 simple steps: </span>
                <span>1. Scan QR or Download → 2. Tap install → 3. Sign in</span>
              </div>
            </div>
          </div>
        </section>

        {/* Universal Web Access Banner */}
        <section
          aria-label="Web portal access"
          className="neumorphic-panel rounded-3xl p-6 sm:p-7 border border-border/60 bg-muted/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 max-w-4xl mx-auto w-full"
        >
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Globe className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Using an iPhone, iPad, Mac, or Chromebook?
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                You can access the full iReside web portal directly in Safari, Chrome, or any browser without installing anything.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/"
              className="flex-1 md:flex-initial min-h-[44px] px-5 rounded-xl neumorphic-primary active:scale-95 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
            >
              <span>Open Web Portal</span>
              <ExternalLink className="size-3.5" />
            </Link>

            <button
              onClick={handleCopyLink}
              aria-label="Copy website address to clipboard"
              className="min-h-[44px] px-4 rounded-xl neumorphic-extruded hover:text-primary active:scale-95 text-xs font-semibold text-foreground transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copiedLink ? (
                <>
                  <Check className="size-4 text-emerald-500" />
                  <span className="text-emerald-500 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Safety & Cloud Backup Reassurance */}
        <section
          aria-label="Data safety reassurance"
          className="neumorphic-extruded rounded-3xl p-6 sm:p-8 border border-border/50 max-w-4xl mx-auto w-full flex items-start gap-4 sm:gap-5"
        >
          <div className="size-12 sm:size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="size-6 sm:size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Your Data is Always Safe and Backed Up
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              All your properties, tenant records, payments, and photos are safely stored in the cloud. Even if you switch phones or get a new computer, simply sign in and everything is right there waiting for you.
            </p>
          </div>
        </section>

        {/* Simple Layman's Help & FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-6 max-w-4xl mx-auto w-full">
          <div className="text-center space-y-1.5">
            <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-foreground">
              Common Questions & Quick Help
            </h2>
            <p className="text-sm text-muted-foreground">
              Simple answers to help you get started without any confusion.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="neumorphic-panel rounded-2xl border border-border/50 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="size-5 text-primary shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-6 px-4 sm:px-8 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} iReside. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Web Portal Home
            </Link>
            <span aria-hidden="true">&middot;</span>
            <Link href="/docs" className="hover:text-foreground transition-colors">
              User Guide
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL: SIMPLE PHONE CAMERA QR SCANNER */}
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
              {/* Header */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <QrCode className="size-5 text-primary shrink-0" />
                  <h3 id="qr-modal-title" className="text-sm font-bold text-foreground">
                    Scan with Your Phone Camera
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="size-8 rounded-xl neumorphic-inset flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close dialog"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* QR Image Container */}
              <div className="size-60 rounded-2xl p-4 flex items-center justify-center bg-white shadow-md border-2 border-emerald-500/20">
                {qrCodeApiUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeApiUrl}
                    alt="QR code to install Android app"
                    className="size-full object-contain rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-zinc-400">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* 3 Simple Instructions */}
              <div className="w-full bg-muted/30 border border-border/50 rounded-2xl p-3.5 text-left text-xs text-foreground/90 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                    1
                  </span>
                  <span>Open the <strong>Camera</strong> on your Android phone</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                    2
                  </span>
                  <span>Point it at this QR code</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="size-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[11px] shrink-0">
                    3
                  </span>
                  <span>Tap the link that appears on your screen to install</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5 w-full pt-1">
                <button
                  onClick={handleCopyApkLink}
                  className="min-h-[46px] neumorphic-extruded px-4 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-all w-full flex items-center justify-center gap-2 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {copiedApkUrl ? (
                    <>
                      <Check className="size-4 text-emerald-500" />
                      <span className="text-emerald-500 font-bold">Download Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      <span>Copy Download Link (to send via Chat/SMS)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveModal(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
