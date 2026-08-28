"use client";

import React, { useState, useEffect, useMemo, useRef, forwardRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  BookOpen,
  Building2,
  Home,
  Sparkles,
  ExternalLink,
  Search,
  LayoutGrid,
  Download,
  Copy,
  Check,
  Server,
  RotateCcw,
  Zap,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  DocArticle,
  DocAudience,
  DOCS_ARTICLES,
} from "@/lib/docs/docsData";
import { generateDocsPdf } from "@/lib/docs/generateDocsPdf";
import { searchDocs } from "@/lib/docs/searchEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// Dynamically import HTMLFlipBook to ensure SSR compatibility
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
});

interface EBookReaderProps {
  audience: DocAudience;
  onAudienceChange: (aud: DocAudience) => void;
  onNavigateTab?: (tabId: string) => void;
  className?: string;
  defaultBackHref?: string;
}

// Preloaded Web Audio Context & In-Memory Buffer for Zero-Latency Sound
let audioCtx: AudioContext | null = null;
let pageTurnBuffer: AudioBuffer | null = null;

if (typeof window !== "undefined") {
  const initAudio = async () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      const res = await fetch("/audios/pageturn.mp3");
      const arrayBuffer = await res.arrayBuffer();
      pageTurnBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      // Audio preloading fallback
    }
  };
  initAudio();
}

let lastAudioPlayTime = 0;

// 0ms Zero-Latency Page Turn Audio (Single-Shot Throttle Guard)
function playPageFlipSound(isMuted: boolean, mode: "realistic" | "fast" = "realistic") {
  try {
    if (isMuted || mode === "fast" || typeof window === "undefined") return;

    const now = Date.now();
    if (now - lastAudioPlayTime < 450) {
      return;
    }
    lastAudioPlayTime = now;

    if (audioCtx && pageTurnBuffer) {
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const source = audioCtx.createBufferSource();
      source.buffer = pageTurnBuffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.6;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      source.start(0);
      return;
    }

    const audio = new Audio("/audios/pageturn.mp3");
    audio.volume = 0.6;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // Audio playback not supported
  }
}

// Clean White Book Page Wrapper
const BookPage = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    className?: string;
    density?: "hard" | "soft";
    isLeftPage?: boolean;
    isRightPage?: boolean;
    isCover?: boolean;
  }
>(({ children, className, isLeftPage, isRightPage, isCover }, ref) => {
  return (
    <div
      ref={ref}
      data-density="soft"
      className={cn(
        "w-full h-full shadow-2xl overflow-hidden select-none bg-white text-zinc-900",
        isLeftPage && "shadow-[inset_-25px_0_30px_-20px_rgba(0,0,0,0.14)] border-r border-zinc-200",
        isRightPage && "shadow-[inset_25px_0_30px_-20px_rgba(0,0,0,0.14)] border-l border-zinc-200",
        className
      )}
    >
      <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#00000004_1px,transparent_1px)] [background-size:10px_10px] pointer-events-none" />
        <div className="relative z-10 w-full h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
});
BookPage.displayName = "BookPage";

export function EBookReader({
  audience,
  onAudienceChange,
  onNavigateTab,
  className,
  defaultBackHref,
}: EBookReaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [flipAnimationMode, setFlipAnimationMode] = useState<"realistic" | "fast">("realistic");
  const [isMuted, setIsMuted] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const flipBookRef = useRef<any>(null);
  const isFlippingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const targetAudience: "tenant" | "landlord" | "it" = useMemo(() => {
    if (audience === "user") return "landlord";
    return audience as "tenant" | "landlord" | "it";
  }, [audience]);

  // Filter articles pool for current audience
  const articles = useMemo(() => {
    return DOCS_ARTICLES.filter((a) => a.audience === targetAudience);
  }, [targetAudience]);

  // Total pages = Cover (0) + TOC (1) + Articles (N) + Support (1) + Quick Reference (1) + Back Cover (1)
  const totalBookPages = useMemo(() => {
    return articles.length + 5;
  }, [articles.length]);

  // Search Results
  const searchResponse = useMemo(() => {
    return searchDocs(searchQuery, { audience: targetAudience });
  }, [searchQuery, targetAudience]);

  // Back href calculation
  const backHref = useMemo(() => {
    if (defaultBackHref) return defaultBackHref;
    if (pathname?.startsWith("/tenant") || targetAudience === "tenant") {
      return "/tenant/dashboard";
    }
    return "/landlord/dashboard";
  }, [defaultBackHref, pathname, targetAudience]);

  const backLabel = useMemo(() => {
    if (pathname?.startsWith("/tenant") || targetAudience === "tenant") {
      return "Back to Resident Portal";
    }
    return "Back to Dashboard";
  }, [pathname, targetAudience]);

  // Turn Next with Anti-Spam Animation Guard
  const handleTurnNext = () => {
    if (isFlippingRef.current) return;
    if (flipBookRef.current) {
      try {
        isFlippingRef.current = true;
        setTimeout(() => {
          isFlippingRef.current = false;
        }, 400);
        flipBookRef.current.pageFlip().flipNext();
      } catch {
        isFlippingRef.current = false;
        setCurrentPage((prev) => Math.min(prev + 1, totalBookPages - 1));
      }
    }
  };

  // Turn Prev with Anti-Spam Animation Guard
  const handleTurnPrev = () => {
    if (isFlippingRef.current) return;
    if (flipBookRef.current) {
      try {
        isFlippingRef.current = true;
        setTimeout(() => {
          isFlippingRef.current = false;
        }, 400);
        flipBookRef.current.pageFlip().flipPrev();
      } catch {
        isFlippingRef.current = false;
        setCurrentPage((prev) => Math.max(prev - 1, 0));
      }
    }
  };

  const handleJumpToPage = (pageIndex: number) => {
    if (flipBookRef.current) {
      try {
        flipBookRef.current.pageFlip().turnToPage(pageIndex);
      } catch {
        setCurrentPage(pageIndex);
      }
    }
    setShowTOC(false);
    setShowSearchModal(false);
  };

  const handleJumpToArticle = (articleId: string) => {
    const artIndex = articles.findIndex((a) => a.id === articleId);
    if (artIndex === -1) return;
    handleJumpToPage(artIndex + 2);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleTurnNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handleTurnPrev();
      } else if (e.key === "Escape") {
        setShowTOC(false);
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMuted, totalBookPages]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Copy Code Snippet
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Export Full Guide as Formatted PDF
  const handleDownloadHandoverKit = async () => {
    try {
      toast.loading("Generating printable PDF guide...", {
        id: "handover-kit",
      });

      await generateDocsPdf(targetAudience);

      toast.success("PDF Guide downloaded successfully!", { id: "handover-kit" });
    } catch {
      toast.error("Failed to generate PDF guide.", { id: "handover-kit" });
    }
  };

  // Centering transform calculations
  const isFrontCover = currentPage === 0;
  const isBackCover = currentPage >= totalBookPages - 1;

  // Format Page Indicator label
  const pageLabel = useMemo(() => {
    if (currentPage === 0) return `Cover / ${totalBookPages}`;
    if (currentPage >= totalBookPages - 1) return `Back / ${totalBookPages}`;
    const leftNum = currentPage;
    const rightNum = Math.min(currentPage + 1, totalBookPages - 1);
    return `${leftNum} – ${rightNum} of ${totalBookPages}`;
  }, [currentPage, totalBookPages]);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between w-full h-screen max-h-screen text-zinc-900 select-none overflow-hidden bg-zinc-100",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* 1. Background Visual Accent */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/images/ebook_workspace_bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.60)_45%,rgba(255,255,255,0.25)_75%,rgba(255,255,255,0.08)_100%)] backdrop-blur-[1.5px]" />
      </div>

      {/* =================================================================== */}
      {/* 1. TOP HEADER                                                       */}
      {/* =================================================================== */}
      <header className="shrink-0 relative w-full h-14 px-4 sm:px-6 flex items-center justify-between z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 shadow-xs">
        {/* Left: Back Link */}
        <div className="flex items-center">
          <Link
            href={backHref}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 border border-zinc-200/80 transition-all shadow-xs"
          >
            <ArrowLeft className="size-3.5 text-zinc-600" />
            <span className="hidden md:inline">{backLabel}</span>
            <span className="md:hidden">Back</span>
          </Link>
        </div>

        {/* Center: Dedicated Audience Tabs (Tenant vs Landlord vs IT) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center shadow-xs">
          {/* Tenant Manual Tab */}
          <button
            type="button"
            onClick={() => {
              onAudienceChange("tenant");
              handleJumpToPage(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              targetAudience === "tenant"
                ? "bg-zinc-900 text-white shadow-xs font-bold"
                : "text-zinc-600 hover:text-zinc-950"
            )}
          >
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Tenant</span>
            <span className="sm:hidden">Tenant</span>
          </button>

          {/* Landlord Manual Tab */}
          <button
            type="button"
            onClick={() => {
              onAudienceChange("landlord");
              handleJumpToPage(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              targetAudience === "landlord"
                ? "bg-zinc-900 text-white shadow-xs font-bold"
                : "text-zinc-600 hover:text-zinc-950"
            )}
          >
            <Building2 className="size-3.5" />
            <span className="hidden sm:inline">Landlord</span>
            <span className="sm:hidden">Owner</span>
          </button>

          {/* Technical Guide Tab */}
          <button
            type="button"
            onClick={() => {
              onAudienceChange("it");
              handleJumpToPage(0);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
              targetAudience === "it"
                ? "bg-zinc-900 text-white shadow-xs font-bold"
                : "text-zinc-600 hover:text-zinc-950"
            )}
          >
            <Server className="size-3.5" />
            <span className="hidden sm:inline">Technical</span>
            <span className="sm:hidden">IT</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="h-8 px-3 rounded-lg bg-zinc-100/90 hover:bg-zinc-200 text-xs text-zinc-700 border border-zinc-200/80 flex items-center gap-2 transition-all shadow-xs"
          >
            <Search className="size-3.5 text-zinc-500" />
            <span className="hidden lg:inline">Search (e.g. GCash, rent)...</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHandoverKit}
            title="Download full guide as PDF"
            className="h-8 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. FLOATING SIDE BUTTONS                                            */}
      {/* =================================================================== */}
      <button
        type="button"
        onClick={handleTurnPrev}
        title="Previous Page"
        className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-30 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white active:scale-95 text-zinc-700 hover:text-zinc-950 backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-zinc-200 group"
      >
        <ChevronLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={handleTurnNext}
        title="Next Page"
        className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-30 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white active:scale-95 text-zinc-700 hover:text-zinc-950 backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-zinc-200 group"
      >
        <ChevronRight className="size-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* =================================================================== */}
      {/* 3. FLIPBOOK CENTER STAGE                                            */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-1 sm:py-2">
        {mounted && (
          <div
            className="relative w-full max-w-5xl flex items-center justify-center transition-transform duration-500 ease-out"
            style={{
              transform: `scale(${zoomLevel}) ${
                isFrontCover
                  ? "translateX(-25%)"
                  : isBackCover
                  ? "translateX(25%)"
                  : "translateX(0%)"
              }`,
            }}
          >
            {/* @ts-ignore */}
            <HTMLFlipBook
              key={`${targetAudience}-${flipAnimationMode}`}
              ref={flipBookRef}
              width={440}
              height={580}
              size="stretch"
              minWidth={280}
              maxWidth={540}
              minHeight={400}
              maxHeight={660}
              maxShadowOpacity={0.25}
              showCover={true}
              usePortrait={false}
              drawShadow={true}
              mobileScrollSupport={true}
              flippingTime={flipAnimationMode === "realistic" ? 320 : 1}
              useMouseEvents={true}
              onChangeState={(e: { data: string }) => {
                if (e.data === "flipping") {
                  playPageFlipSound(isMuted, flipAnimationMode);
                } else if (e.data === "read" || e.data === "user_fold") {
                  isFlippingRef.current = false;
                }
              }}
              onFlip={(e: { data: number }) => {
                setCurrentPage(e.data);
                setTimeout(() => {
                  isFlippingRef.current = false;
                }, 400);
              }}
              className="drop-shadow-[0_25px_50px_rgba(0,0,0,0.18)]"
              style={{ margin: "0 auto" }}
            >
              {/* ============================================================ */}
              {/* PAGE 0: FRONT COVER                                          */}
              {/* ============================================================ */}
              <BookPage isCover className="p-8 sm:p-12 flex flex-col justify-between bg-white border-r-2 border-zinc-300">
                {/* Header Spine */}
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="size-6 bg-zinc-900 text-white font-black text-[10px] flex items-center justify-center">
                      iR
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">
                      iReside
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                    {targetAudience === "tenant"
                      ? "Resident User Manual"
                      : targetAudience === "landlord"
                      ? "Landlord Operations Guide"
                      : "Technical Manual"}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-5 my-auto">
                  <div className="space-y-2">
                    <div className="inline-block px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wide">
                      {targetAudience === "tenant"
                        ? "Resident Living Guide"
                        : targetAudience === "landlord"
                        ? "Property Manager Guide"
                        : "Technical Documentation"}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight font-serif">
                      {targetAudience === "tenant"
                        ? "How to Live Seamlessly with iReside"
                        : targetAudience === "landlord"
                        ? "How to Manage Your Property with iReside"
                        : "Technical Setup & Developer Guide"}
                    </h1>
                  </div>

                  <div className="h-0.5 w-12 bg-zinc-950" />

                  <p className="text-xs text-zinc-600 leading-relaxed font-normal max-w-sm">
                    {targetAudience === "tenant"
                      ? "A simple, step-by-step guide to paying rent online via GCash/Card, signing digital leases, reporting maintenance issues, and connecting with your community."
                      : targetAudience === "landlord"
                      ? "A complete guide to adding rental units, collecting GCash payments, inviting tenants, submeter billing, and handling repairs."
                      : "Clear instructions for setting up the database, security rules, email sending, serverless crons, and maintenance tools."}
                  </p>
                </div>

                {/* Footer Button */}
                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase text-zinc-400 block font-semibold">Official Manual</span>
                      <span className="text-xs font-bold text-zinc-900">iReside System</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTurnNext}
                      className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <span>Open Guide</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </BookPage>

              {/* ============================================================ */}
              {/* PAGE 1: TABLE OF CONTENTS                                    */}
              {/* ============================================================ */}
              <BookPage density="soft" isLeftPage className="p-7 sm:p-9 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                      Table of Contents
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Page 1</span>
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-zinc-950 font-serif">
                      {targetAudience === "tenant"
                        ? "Resident Chapters"
                        : targetAudience === "landlord"
                        ? "Landlord Operations"
                        : "Technical Topics"}
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Click any topic below to turn directly to that page.
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {articles.map((art, idx) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => handleJumpToArticle(art.id)}
                        className="w-full py-1.5 px-2 hover:bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-left group transition-colors"
                      >
                        <div className="flex items-baseline gap-2.5 min-w-0 pr-2">
                          <span className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-950">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          <span className="text-xs font-semibold text-zinc-800 group-hover:text-zinc-950 truncate">
                            {art.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-mono text-zinc-400 group-hover:text-zinc-950 font-bold">
                            p.{(idx + 2).toString().padStart(2, "0")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>iReside Guide</span>
                  <span>Contents</span>
                </div>
              </BookPage>

              {/* ============================================================ */}
              {/* PAGES 2+: ARTICLE CHAPTERS                                   */}
              {/* ============================================================ */}
              {articles.map((article, idx) => {
                const isLeft = idx % 2 === 1;
                const isRight = idx % 2 === 0;

                return (
                  <BookPage
                    key={article.id}
                    density="soft"
                    isLeftPage={isLeft}
                    isRightPage={isRight}
                    className="p-7 sm:p-9 flex flex-col justify-between bg-white"
                  >
                    <div className="space-y-3.5">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[9px] uppercase tracking-wider text-zinc-400">
                        <span className="font-bold text-zinc-900">
                          {article.categoryLabel}
                        </span>
                        <span>
                          Page {(idx + 2).toString().padStart(2, "0")}
                        </span>
                      </div>

                      {/* Title & Simple Summary */}
                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-serif leading-snug tracking-tight">
                          {article.title}
                        </h3>
                        <p className="text-[11px] text-zinc-600 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>

                      {/* Step-by-Step Instructions */}
                      {article.steps && article.steps.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {article.steps.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2.5 bg-zinc-50 border border-zinc-200/80 space-y-1 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="size-4 bg-zinc-900 text-white font-mono text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {sIdx + 1}
                                </span>
                                <h5 className="font-bold text-zinc-900 text-[11px] tracking-tight">{step.title}</h5>
                              </div>
                              <p className="text-[10.5px] text-zinc-600 pl-6 leading-relaxed">
                                {step.description}
                              </p>
                              {step.codeSnippet && (
                                <div className="ml-6 mt-1 relative group bg-zinc-950 text-zinc-200 p-2 text-[9.5px] font-mono overflow-x-auto border border-zinc-800">
                                  <code>{step.codeSnippet}</code>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyCode(step.codeSnippet!, `${article.id}-${sIdx}`)
                                    }
                                    className="absolute right-1.5 top-1 px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[8px] font-bold uppercase transition-colors"
                                  >
                                    {copiedCodeId === `${article.id}-${sIdx}` ? "Copied" : "Copy"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Technical Markdown Block */}
                      {article.contentMarkdown && (
                        <div className="bg-zinc-950 text-zinc-300 p-3 border border-zinc-800 text-[10px] font-mono whitespace-pre overflow-x-auto">
                          {article.contentMarkdown.trim()}
                        </div>
                      )}
                    </div>

                    {/* Footer Button */}
                    <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                      {article.actionShortcut?.href ? (
                        <Link
                          href={article.actionShortcut.href}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <span>{article.actionShortcut.label}</span>
                          <ExternalLink className="size-2.5" />
                        </Link>
                      ) : article.actionShortcut?.tabId && onNavigateTab ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (article.actionShortcut?.tabId && onNavigateTab) {
                              onNavigateTab(article.actionShortcut.tabId);
                            }
                          }}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[9.5px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                        >
                          <span>{article.actionShortcut.label}</span>
                          <ExternalLink className="size-2.5" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-zinc-400">iReside Guide</span>
                      )}

                      <span className="font-mono text-[9px] text-zinc-400 font-bold">
                        {(idx + 2).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </BookPage>
                );
              })}

              {/* ============================================================ */}
              {/* CLOSING NOTES & SUPPORT PAGE                                 */}
              {/* ============================================================ */}
              <BookPage density="soft" isLeftPage className="p-7 sm:p-9 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2 text-[9px] uppercase tracking-wider text-zinc-400">
                    <span className="font-bold text-zinc-900">Help & Support</span>
                    <span>Quick Tips</span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-serif leading-snug">
                      Need More Help or Have Questions?
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Here are common troubleshooting tools and tips to keep your property running smoothly.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-1">
                      <span className="text-[10px] uppercase text-zinc-900 font-bold block">1. 24/7 Digital Assistant</span>
                      <p className="text-[10.5px] text-zinc-600">
                        {targetAudience === "tenant"
                          ? "Use the floating iRis assistant widget in the bottom right corner for instant answers about house rules and lease dates."
                          : "Verify system connections and test email mailers via the Technical Commissioning Doctor."}
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-50 border border-zinc-200 space-y-1">
                      <span className="text-[10px] uppercase text-zinc-900 font-bold block">2. Privacy & Record Protection</span>
                      <p className="text-[10.5px] text-zinc-600">
                        All official payment receipts, signed lease contracts, and resident records are encrypted and securely stored.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>iReside Guide</span>
                  <span>End of Guide</span>
                </div>
              </BookPage>

              {/* PAGE N+3: QUICK KEYBOARD CONTROLS */}
              <BookPage
                density="soft"
                isRightPage
                className="p-7 sm:p-9 flex flex-col justify-between bg-white"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[9px] uppercase tracking-wider text-zinc-400">
                    <span className="font-bold text-zinc-900">Quick Reference</span>
                    <span>Key Controls</span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-serif leading-snug">
                      Quick Keyboard Controls
                    </h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">
                      Turn pages effortlessly using your keyboard or the on-screen buttons.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-800">Next Page</span>
                      <kbd className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono text-[10px]">Right Arrow / Space</kbd>
                    </div>
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-800">Previous Page</span>
                      <kbd className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono text-[10px]">Left Arrow</kbd>
                    </div>
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-800">Search Help</span>
                      <kbd className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono text-[10px]">Search Bar in Header</kbd>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>iReside Guide</span>
                  <span>Reference</span>
                </div>
              </BookPage>

              {/* ============================================================ */}
              {/* LAST PAGE: BACK COVER                                        */}
              {/* ============================================================ */}
              <BookPage isCover className="p-8 sm:p-12 flex flex-col justify-between bg-white border-l-2 border-zinc-300">
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    iReside
                  </span>
                  <span className="text-[10px] text-zinc-900 font-bold">
                    Official Guide
                  </span>
                </div>

                <div className="space-y-4 my-auto text-center">
                  <div className="size-12 bg-zinc-900 text-white font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
                    iR
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-zinc-950 font-serif">
                      iReside System
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {targetAudience === "tenant"
                        ? "Seamless residential living and rent management."
                        : "Simple property management made easy."}
                    </p>
                  </div>

                  <p className="text-[11px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
                    {targetAudience === "tenant"
                      ? "Designed for tenants and resident communities."
                      : "Designed for property owners, landlords, and managers."}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleJumpToPage(0)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Back to Front</span>
                  </button>

                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                    2026 Edition
                  </span>
                </div>
              </BookPage>
            </HTMLFlipBook>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* 4. BOTTOM CONTROL DOCK                                              */}
      {/* =================================================================== */}
      <footer className="shrink-0 relative w-full h-12 bg-white/85 backdrop-blur-xl border-t border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between z-30 text-xs text-zinc-700 shadow-xs">
        {/* Left Tools: Zoom & TOC */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.12 : 1))}
            title={zoomLevel === 1 ? "Zoom In" : "Zoom Out"}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {zoomLevel === 1 ? <ZoomIn className="size-4" /> : <ZoomOut className="size-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowTOC(!showTOC)}
            title="Table of Contents"
            className={cn(
              "size-8 rounded-lg flex items-center justify-center transition-colors",
              showTOC
                ? "bg-zinc-900 text-white"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>

        {/* Center: Flip Controls & Page Label */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => handleJumpToPage(0)}
            title="Front Cover"
            className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 transition-all"
          >
            <ChevronsLeft className="size-4" />
          </button>

          <button
            type="button"
            onClick={handleTurnPrev}
            title="Previous Page"
            className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-95 transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="px-2.5 sm:px-3 py-0.5 rounded-md bg-zinc-100 font-mono text-[11px] sm:text-xs font-semibold text-zinc-800 select-none border border-zinc-200/80">
            {pageLabel}
          </div>

          <button
            type="button"
            onClick={handleTurnNext}
            title="Next Page"
            className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-95 transition-all"
          >
            <ChevronRight className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => handleJumpToPage(totalBookPages - 1)}
            title="Back Cover"
            className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 transition-all"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>

        {/* Right Tools: Mode, Audio & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = flipAnimationMode === "realistic" ? "fast" : "realistic";
              setFlipAnimationMode(next);
              toast.success(
                next === "realistic"
                  ? "Page turn animation enabled"
                  : "Page turn animation disabled"
              );
            }}
            title={flipAnimationMode === "realistic" ? "Turn animation off" : "Turn animation on"}
            className={cn(
              "hidden sm:flex px-2.5 py-1 rounded-lg border text-xs font-semibold items-center transition-all shadow-xs",
              flipAnimationMode === "realistic"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
            )}
          >
            <span>{flipAnimationMode === "realistic" ? "Anim: ON" : "Anim: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute paper sound" : "Mute paper sound"}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-zinc-800" />}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </footer>

      {/* =================================================================== */}
      {/* 5. SEARCH MODAL POPUP                                               */}
      {/* =================================================================== */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white border border-zinc-200 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <Search className="size-4 text-zinc-700" />
                <span>Search Help Topics</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="text-zinc-400 hover:text-zinc-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. GCash, rent, lease, maintenance)..."
                className="w-full h-10 pl-4 pr-10 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar-premium">
                {searchResponse.results.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => handleJumpToArticle(art.id)}
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-left transition-all flex items-center justify-between text-xs group border border-zinc-100"
                  >
                    <div>
                      <h5 className="font-bold text-zinc-900 group-hover:text-zinc-950">{art.title}</h5>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">{art.summary}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-900 ml-2 shrink-0 font-bold">Open →</span>
                  </button>
                ))}

                {searchResponse.results.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">No matching topics found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. TABLE OF CONTENTS POPUP DRAWER                                   */}
      {/* =================================================================== */}
      {showTOC && (
        <div className="absolute bottom-14 left-4 sm:left-8 z-50 w-80 max-h-[460px] rounded-xl bg-white border border-zinc-200 p-4 shadow-2xl backdrop-blur-xl overflow-y-auto custom-scrollbar-premium space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-zinc-700" />
              <span>Table of Contents</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowTOC(false)}
              className="text-zinc-400 hover:text-zinc-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleJumpToPage(0)}
              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all"
            >
              📖 Front Cover
            </button>
            <button
              type="button"
              onClick={() => handleJumpToPage(1)}
              className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all"
            >
              📑 Table of Contents
            </button>
            {articles.map((art, idx) => (
              <button
                key={art.id}
                type="button"
                onClick={() => handleJumpToArticle(art.id)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between text-zinc-700 hover:bg-zinc-100"
              >
                <span className="truncate max-w-[190px]">{art.title}</span>
                <span className="font-mono text-[9px] text-zinc-400 font-bold">p.{idx + 2}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
