"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback, forwardRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
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
  ExternalLink,
  Search,
  LayoutGrid,
  Download,
  Server,
  RotateCcw,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  ClipboardList,
  X,
} from "lucide-react";
import {
  DOCS_ARTICLES,
  DOCS_EDITION,
  MANUAL_TITLES,
  type DocAudience,
  type ManualAudience,
} from "@/lib/docs/docsData";
import { generateDocsPdf } from "@/lib/docs/generateDocsPdf";
import { searchDocs } from "@/lib/docs/searchEngine";
import { resolveDocsBackLink } from "@/lib/docs/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBrand } from "@/context/BrandContext";
import { useAuth } from "@/hooks/useAuth";

// Dynamically import HTMLFlipBook to ensure SSR compatibility
const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
});

const ALL_AUDIENCES: ManualAudience[] = ["tenant", "landlord", "it"];

const AUDIENCE_TABS: Record<ManualAudience, { label: string; shortLabel: string; icon: React.ElementType }> = {
  tenant: { label: "Tenant", shortLabel: "Tenant", icon: Home },
  landlord: { label: "Landlord", shortLabel: "Owner", icon: Building2 },
  it: { label: "Technical", shortLabel: "IT", icon: Server },
};

interface EBookReaderProps {
  audience: DocAudience;
  onAudienceChange: (audience: DocAudience) => void;
  /** Which manuals the reader may switch between. A single entry hides the switcher. */
  allowedAudiences?: ManualAudience[];
  className?: string;
  defaultBackHref?: string;
  hideBackLink?: boolean;
  /** Link to the long-form documentation site. Hidden for readers who cannot access it. */
  showWrittenGuidesLink?: boolean;
  /** Opens the search dialog with this query on mount (for example from a ?q= parameter). */
  initialSearchQuery?: string;
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
>(({ children, className, isLeftPage, isRightPage }, ref) => {
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

const toManualAudience = (audience: DocAudience, allowed: ManualAudience[]): ManualAudience => {
  const candidate: ManualAudience = audience === "user" || audience === "all" ? "landlord" : audience;
  return allowed.includes(candidate) ? candidate : allowed[0];
};

export function EBookReader({
  audience,
  onAudienceChange,
  allowedAudiences = ALL_AUDIENCES,
  className,
  defaultBackHref,
  hideBackLink = false,
  showWrittenGuidesLink = true,
  initialSearchQuery = "",
}: EBookReaderProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const brand = useBrand();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentPage, setCurrentPage] = useState(0);
  const [flipAnimationMode, setFlipAnimationMode] = useState<"realistic" | "fast">("realistic");
  const [isMuted, setIsMuted] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(Boolean(initialSearchQuery));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const flipBookRef = useRef<any>(null);
  const isFlippingRef = useRef(false);

  const allowed = allowedAudiences.length > 0 ? allowedAudiences : ALL_AUDIENCES;
  const targetAudience = useMemo(() => toManualAudience(audience, allowed), [audience, allowed]);
  const canSwitchAudience = allowed.length > 1;
  const manual = MANUAL_TITLES[targetAudience];

  const backLink = useMemo(
    () => resolveDocsBackLink({ defaultBackHref, pathname, userRole: profile?.role ?? null }),
    [defaultBackHref, pathname, profile?.role]
  );

  const propertyBackgroundImage = useMemo(() => {
    if (brand.bannerUrl) return brand.bannerUrl;
    if (brand.logoUrl && !brand.logoUrl.endsWith(".svg")) return brand.logoUrl;

    if (typeof window !== "undefined") {
      try {
        const customBanner = localStorage.getItem("ireside_landlord_custom_banner_url");
        if (customBanner) return customBanner;

        const cachedProps = localStorage.getItem("iReside_cached_properties");
        if (cachedProps) {
          const parsed = JSON.parse(cachedProps);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const firstProp = parsed[0];
            if (firstProp.image) return firstProp.image;
            if (Array.isArray(firstProp.images) && firstProp.images.length > 0) return firstProp.images[0];
          }
        }
      } catch {
        // ignore
      }
    }

    return "/images/ebook_workspace_bg.jpg";
  }, [brand.bannerUrl, brand.logoUrl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the parent's audience in sync when it is outside the allowed set.
  useEffect(() => {
    if (targetAudience !== audience) {
      onAudienceChange(targetAudience);
    }
  }, [audience, onAudienceChange, targetAudience]);

  const articles = useMemo(
    () => DOCS_ARTICLES.filter((article) => article.audience === targetAudience),
    [targetAudience]
  );

  // Total pages = Cover (0) + TOC (1) + Articles (N) + Support (1) + Quick Reference (1) + Back Cover (1)
  const totalBookPages = articles.length + 5;

  const searchResponse = useMemo(
    () => searchDocs(searchQuery, { audience: targetAudience }),
    [searchQuery, targetAudience]
  );

  const handleTurnNext = useCallback(() => {
    if (isFlippingRef.current || !flipBookRef.current) return;
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
  }, [totalBookPages]);

  const handleTurnPrev = useCallback(() => {
    if (isFlippingRef.current || !flipBookRef.current) return;
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
  }, []);

  const handleJumpToPage = useCallback((pageIndex: number) => {
    if (flipBookRef.current) {
      try {
        flipBookRef.current.pageFlip().turnToPage(pageIndex);
      } catch {
        setCurrentPage(pageIndex);
      }
    } else {
      setCurrentPage(pageIndex);
    }
    setShowTOC(false);
    setShowSearchModal(false);
  }, []);

  const handleJumpToArticle = useCallback((articleId: string) => {
    const index = articles.findIndex((article) => article.id === articleId);
    if (index === -1) return;
    handleJumpToPage(index + 2);
  }, [articles, handleJumpToPage]);

  const switchAudience = (next: ManualAudience) => {
    if (next === targetAudience) return;
    onAudienceChange(next);
    setSearchQuery("");
    handleJumpToPage(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        handleTurnNext();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        handleTurnPrev();
      } else if (event.key === "Escape") {
        setShowTOC(false);
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTurnNext, handleTurnPrev]);

  // Keep fullscreen state in sync when the user exits with the system shortcut.
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedCodeId(null), 2500);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading("Preparing the PDF…", { id: "docs-pdf" });
      await generateDocsPdf(targetAudience);
      toast.success(`${manual.short} downloaded`, { id: "docs-pdf" });
    } catch {
      toast.error("The PDF could not be generated.", { id: "docs-pdf" });
    }
  };

  const isFrontCover = currentPage === 0;
  const isBackCover = currentPage >= totalBookPages - 1;

  const pageLabel = useMemo(() => {
    if (currentPage === 0) return `Cover / ${totalBookPages}`;
    if (currentPage >= totalBookPages - 1) return `Back / ${totalBookPages}`;
    const leftNum = currentPage;
    const rightNum = Math.min(currentPage + 1, totalBookPages - 1);
    return `${leftNum} – ${rightNum} of ${totalBookPages}`;
  }, [currentPage, totalBookPages]);

  const isCrossPortalLink = (href: string) =>
    (pathname?.startsWith("/landlord") && href.startsWith("/tenant")) ||
    (pathname?.startsWith("/tenant") && href.startsWith("/landlord"));

  const supportTips = useMemo(() => {
    switch (targetAudience) {
      case "tenant":
        return [
          { title: "Ask your landlord", body: "Open \"Messages\" to ask about bills, rules, or repairs. The thread is kept as a record for both of you." },
          { title: "Ask iRis", body: "The \"Chat with iRis\" button at the bottom-left of your dashboard answers questions about your lease, dues, and house rules from your own records." },
          { title: "Your records are protected", body: "Receipts, signed leases, and messages are stored securely and are visible only to you and your landlord." },
        ];
      case "landlord":
        return [
          { title: "Check the installation", body: "Open /setup/technical to verify the database connection and mail transport when emails or logins fail." },
          { title: "Search this manual", body: "Use the search button in the header to find a topic by keyword, such as \"receipt\" or \"tariff\"." },
          { title: "Written guides", body: "Longer walkthroughs for each feature are on the documentation site linked from the header." },
        ];
      default:
        return [
          { title: "Health endpoint", body: "/api/health reports database and mail transport status. Point your uptime monitor at it." },
          { title: "Commissioning page", body: "/setup/technical lists required environment variables and runs connectivity checks from the browser." },
          { title: "Source of truth", body: "source-of-truth-db.sql and supabase/migrations define the schema; vercel.json defines scheduled jobs." },
        ];
    }
  }, [targetAudience]);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between w-full h-screen max-h-screen text-zinc-900 select-none overflow-hidden bg-zinc-100",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-all duration-700"
          style={{ backgroundImage: `url('${propertyBackgroundImage}')` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.60)_45%,rgba(255,255,255,0.25)_75%,rgba(255,255,255,0.08)_100%)] backdrop-blur-[1.5px]" />
      </div>

      {/* Header */}
      <header className="shrink-0 relative w-full h-14 px-3 sm:px-6 flex items-center justify-between gap-2 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 shadow-xs">
        <div className="flex items-center min-w-[36px]">
          {!hideBackLink && (
            <Link
              href={backLink.href}
              className="h-8 px-2.5 rounded-lg hover:bg-zinc-100 text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span className="hidden md:inline">{backLink.label}</span>
              <span className="md:hidden">Back</span>
            </Link>
          )}
        </div>

        {canSwitchAudience ? (
          <div
            role="tablist"
            aria-label="Choose a manual"
            className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center shadow-xs"
          >
            {allowed.map((entry) => {
              const tab = AUDIENCE_TABS[entry];
              const Icon = tab.icon;
              const isActive = targetAudience === entry;
              return (
                <button
                  key={entry}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchAudience(entry)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                    isActive ? "bg-zinc-900 text-white shadow-xs font-bold" : "text-zinc-600 hover:text-zinc-950"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200/80 text-xs font-bold text-zinc-800 flex items-center gap-1.5 shadow-xs">
            {React.createElement(AUDIENCE_TABS[targetAudience].icon, { className: "size-3.5", "aria-hidden": true })}
            <span>{manual.short}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            aria-label="Search this manual"
            className="h-8 px-3 rounded-lg bg-zinc-100/90 hover:bg-zinc-200 text-xs text-zinc-700 border border-zinc-200/80 flex items-center gap-2 transition-all shadow-xs"
          >
            <Search className="size-3.5 text-zinc-500" aria-hidden="true" />
            <span className="hidden lg:inline">Search topics…</span>
          </button>

          {showWrittenGuidesLink && (
            <Link
              href="/docs/introduction"
              className="hidden md:flex h-8 px-3 rounded-lg hover:bg-zinc-100 text-xs font-semibold text-zinc-700 hover:text-zinc-950 items-center gap-1.5 transition-colors"
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              Written guides
            </Link>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            aria-label={`Download the ${manual.short} as PDF`}
            className="h-8 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </header>

      {/* Floating page turners */}
      <button
        type="button"
        onClick={handleTurnPrev}
        aria-label="Previous page"
        className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 z-30 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white active:scale-95 text-zinc-700 hover:text-zinc-950 backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-zinc-200 group"
      >
        <ChevronLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handleTurnNext}
        aria-label="Next page"
        className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-30 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white active:scale-95 text-zinc-700 hover:text-zinc-950 backdrop-blur-md flex items-center justify-center transition-all shadow-xl border border-zinc-200 group"
      >
        <ChevronRight className="size-6 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </button>

      {/* Flipbook */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-1 sm:py-2" aria-label={manual.cover}>
        {mounted && (
          <div
            className="relative w-full max-w-5xl flex items-center justify-center transition-transform duration-500 ease-out"
            style={{
              transform: `scale(${zoomLevel}) ${isFrontCover ? "translateX(-25%)" : isBackCover ? "translateX(25%)" : "translateX(0%)"}`,
            }}
          >
            {/* @ts-ignore react-pageflip types do not model the dynamic import */}
            <HTMLFlipBook
              key={`${targetAudience}-${flipAnimationMode}`}
              ref={flipBookRef}
              width={470}
              height={610}
              size="stretch"
              minWidth={280}
              maxWidth={560}
              minHeight={440}
              maxHeight={700}
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
              {/* Front cover */}
              <BookPage isCover className="p-7 sm:p-10 flex flex-col justify-between bg-white border-r-2 border-zinc-300">
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-6 bg-zinc-900 text-white font-black text-[10px] flex items-center justify-center">
                      {brand.monogramInitials || "iR"}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900 truncate max-w-[200px]">
                      {brand.propertyName || "iReside"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">{manual.cover}</span>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="space-y-1.5">
                    <div className="inline-block px-2 py-0.5 bg-zinc-900 text-white text-[9.5px] font-bold uppercase tracking-wide">
                      {manual.short}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight leading-tight font-serif">
                      {manual.cover}
                    </h1>
                  </div>
                  <div className="h-0.5 w-12 bg-zinc-950" />
                  <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">{manual.tagline}</p>
                  <p className="text-[10px] text-zinc-500">
                    {articles.length} topics · Edition {DOCS_EDITION}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase text-zinc-400 block font-semibold">Official manual</span>
                      <span className="text-xs font-bold text-zinc-900">{brand.propertyName || "iReside"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTurnNext}
                      className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <span>Open</span>
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </BookPage>

              {/* Table of contents */}
              <BookPage density="soft" isLeftPage className="p-6 sm:p-7 flex flex-col justify-between bg-white">
                <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-1.5 mb-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-900">Contents</span>
                      <span className="text-[9.5px] font-mono text-zinc-400">Page 1</span>
                    </div>
                    <h2 className="text-lg font-black text-zinc-950 font-serif leading-tight">{manual.short}</h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Select a topic to turn to its page.</p>
                  </div>

                  <nav className="space-y-0.5 py-1 flex-1 overflow-y-auto max-h-[390px] pr-1" aria-label="Table of contents">
                    {articles.map((article, idx) => (
                      <button
                        key={article.id}
                        type="button"
                        onClick={() => handleJumpToArticle(article.id)}
                        className="w-full py-0.5 px-1 hover:bg-zinc-100/70 border-b border-zinc-100 flex items-center justify-between text-left group transition-colors rounded"
                      >
                        <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
                          <span className="font-mono text-[9px] font-bold text-zinc-400 group-hover:text-zinc-950 shrink-0">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-800 group-hover:text-zinc-950 truncate">
                            {article.title}
                          </span>
                        </div>
                        <span className="text-[8.5px] font-mono text-zinc-400 group-hover:text-zinc-950 font-bold shrink-0">
                          p.{(idx + 2).toString().padStart(2, "0")}
                        </span>
                      </button>
                    ))}
                  </nav>

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                    <span>{manual.short}</span>
                    <span>Contents</span>
                  </div>
                </div>
              </BookPage>

              {/* Articles */}
              {articles.map((article, idx) => {
                const isLeft = idx % 2 === 1;
                const isRight = idx % 2 === 0;
                const pageNumber = (idx + 2).toString().padStart(2, "0");

                return (
                  <BookPage
                    key={article.id}
                    density="soft"
                    isLeftPage={isLeft}
                    isRightPage={isRight}
                    className="p-6 sm:p-7 flex flex-col justify-between bg-white"
                  >
                    <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2.5">
                      <article className="space-y-2.5 flex-1 overflow-y-auto max-h-[470px] pr-1" aria-labelledby={`docs-${article.id}-title`}>
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5 text-[8.5px] uppercase tracking-wider text-zinc-400">
                          <span className="font-bold text-zinc-900">{article.categoryLabel}</span>
                          <span>Page {pageNumber} · {article.readTime}</span>
                        </div>

                        <div className="space-y-0.5">
                          <h3 id={`docs-${article.id}-title`} className="text-base sm:text-lg font-black text-zinc-950 font-serif leading-snug tracking-tight">
                            {article.title}
                          </h3>
                          <p className="text-[10.5px] text-zinc-600 leading-relaxed">{article.summary}</p>
                        </div>

                        {article.prerequisites && article.prerequisites.length > 0 && (
                          <div className="p-2 bg-zinc-50 border border-zinc-200/80 rounded-sm">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-700">
                              <ClipboardList className="size-3" aria-hidden="true" />
                              Before you start
                            </div>
                            <ul className="mt-1 space-y-0.5 pl-4 list-disc text-[10px] text-zinc-600">
                              {article.prerequisites.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {article.steps && article.steps.length > 0 && (
                          <ol className="space-y-1.5 pt-0.5" aria-label="Steps">
                            {article.steps.map((step, stepIdx) => {
                              const codeId = `${article.id}-${stepIdx}`;
                              return (
                                <li key={codeId} className="p-2 bg-zinc-50 border border-zinc-200/80 space-y-0.5 text-xs rounded-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="size-3.5 bg-zinc-900 text-white font-mono text-[8.5px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                                      {stepIdx + 1}
                                    </span>
                                    <h4 className="font-bold text-zinc-900 text-[10.5px] tracking-tight">{step.title}</h4>
                                  </div>
                                  <p className="text-[10px] text-zinc-600 pl-5.5 leading-relaxed">{step.description}</p>
                                  {step.tip && (
                                    <p className="ml-5.5 mt-0.5 flex items-start gap-1 p-1 bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-800 rounded leading-snug">
                                      <span className="font-bold shrink-0">Tip:</span>
                                      <span>{step.tip}</span>
                                    </p>
                                  )}
                                  {step.codeSnippet && (
                                    <div className="ml-5.5 mt-1 relative bg-zinc-950 text-zinc-200 p-1.5 pr-14 text-[9px] font-mono overflow-x-auto border border-zinc-800">
                                      <pre className="whitespace-pre"><code>{step.codeSnippet}</code></pre>
                                      <button
                                        type="button"
                                        onClick={() => void handleCopyCode(step.codeSnippet!, codeId)}
                                        aria-label="Copy command"
                                        className="absolute right-1 top-1 px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[7.5px] font-bold uppercase transition-colors"
                                      >
                                        {copiedCodeId === codeId ? "Copied" : "Copy"}
                                      </button>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        )}

                        {article.result && (
                          <div className="flex items-start gap-1.5 p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-sm text-[10px] text-emerald-900 leading-snug">
                            <CheckCircle2 className="size-3.5 shrink-0 mt-px text-emerald-600" aria-hidden="true" />
                            <p><span className="font-bold">Result:</span> {article.result}</p>
                          </div>
                        )}

                        {article.contentMarkdown && (
                          <pre className="bg-zinc-950 text-zinc-300 p-2.5 border border-zinc-800 text-[9px] font-mono whitespace-pre overflow-x-auto">
                            {article.contentMarkdown.trim()}
                          </pre>
                        )}
                      </article>

                      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs shrink-0">
                        {article.actionShortcut ? (
                          isCrossPortalLink(article.actionShortcut.href) ? (
                            <span
                              className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-500 text-[9px] font-semibold tracking-wide border border-zinc-200"
                              title={`Available in the ${article.audience === "tenant" ? "tenant" : "landlord"} portal.`}
                            >
                              {article.actionShortcut.label} ({article.audience === "tenant" ? "tenant" : "landlord"} portal)
                            </span>
                          ) : (
                            <Link
                              href={article.actionShortcut.href}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                            >
                              <span>{article.actionShortcut.label}</span>
                              <ExternalLink className="size-2.5" aria-hidden="true" />
                            </Link>
                          )
                        ) : (
                          <span className="text-[9px] text-zinc-400">{manual.short}</span>
                        )}
                        <span className="font-mono text-[9px] text-zinc-400 font-bold">{pageNumber}</span>
                      </div>
                    </div>
                  </BookPage>
                );
              })}

              {/* Help & support */}
              <BookPage density="soft" isLeftPage className="p-7 sm:p-9 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2 text-[9px] uppercase tracking-wider text-zinc-400">
                    <span className="font-bold text-zinc-900">Help &amp; support</span>
                    <span>Page {(articles.length + 2).toString().padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-serif leading-snug">Need more help?</h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">Where to go when this manual does not answer your question.</p>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    {supportTips.map((tip, idx) => (
                      <div key={tip.title} className="p-3 bg-zinc-50 border border-zinc-200 space-y-1">
                        <span className="text-[10px] uppercase text-zinc-900 font-bold block">{idx + 1}. {tip.title}</span>
                        <p className="text-[10.5px] text-zinc-600">{tip.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>{manual.short}</span>
                  <span>Help</span>
                </div>
              </BookPage>

              {/* Quick reference */}
              <BookPage density="soft" isRightPage className="p-7 sm:p-9 flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[9px] uppercase tracking-wider text-zinc-400">
                    <span className="font-bold text-zinc-900">Quick reference</span>
                    <span>Reader controls</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-serif leading-snug">Keyboard controls</h3>
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">Turn pages with the keyboard or the on-screen buttons.</p>
                  </div>
                  <dl className="space-y-2 pt-2">
                    {[
                      ["Next page", "Right arrow, Page Down, or Space"],
                      ["Previous page", "Left arrow or Page Up"],
                      ["Close search or contents", "Esc"],
                      ["Search", "Search button in the header"],
                    ].map(([label, keys]) => (
                      <div key={label} className="p-2.5 bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs gap-3">
                        <dt className="font-medium text-zinc-800">{label}</dt>
                        <dd><kbd className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono text-[10px]">{keys}</kbd></dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>{manual.short}</span>
                  <span>Reference</span>
                </div>
              </BookPage>

              {/* Back cover */}
              <BookPage isCover className="p-8 sm:p-12 flex flex-col justify-between bg-white border-l-2 border-zinc-300">
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">iReside</span>
                  <span className="text-[10px] text-zinc-900 font-bold">{manual.cover}</span>
                </div>
                <div className="space-y-4 my-auto text-center">
                  <div className="size-12 bg-zinc-900 text-white font-serif font-bold text-lg flex items-center justify-center mx-auto shadow-sm">
                    {brand.monogramInitials || "iR"}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-zinc-950 font-serif">{brand.propertyName || "iReside"}</h2>
                    <p className="text-xs text-zinc-500">{manual.tagline}</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-zinc-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleJumpToPage(0)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    <span>Back to front</span>
                  </button>
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Edition {DOCS_EDITION}</span>
                </div>
              </BookPage>
            </HTMLFlipBook>
          </div>
        )}
      </main>

      {/* Bottom dock */}
      <footer className="shrink-0 relative w-full h-12 bg-white/85 backdrop-blur-xl border-t border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between z-30 text-xs text-zinc-700 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.12 : 1))}
            aria-label={zoomLevel === 1 ? "Zoom in" : "Zoom out"}
            aria-pressed={zoomLevel !== 1}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {zoomLevel === 1 ? <ZoomIn className="size-4" aria-hidden="true" /> : <ZoomOut className="size-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => setShowTOC((value) => !value)}
            aria-label="Table of contents"
            aria-expanded={showTOC}
            className={cn(
              "size-8 rounded-lg flex items-center justify-center transition-colors",
              showTOC ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
            )}
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button type="button" onClick={() => handleJumpToPage(0)} aria-label="Front cover" className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 transition-all">
            <ChevronsLeft className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={handleTurnPrev} aria-label="Previous page" className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-95 transition-all">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <div className="px-2.5 sm:px-3 py-0.5 rounded-md bg-zinc-100 font-mono text-[11px] sm:text-xs font-semibold text-zinc-800 select-none border border-zinc-200/80" aria-live="polite">
            {pageLabel}
          </div>
          <button type="button" onClick={handleTurnNext} aria-label="Next page" className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-700 hover:text-zinc-950 active:scale-95 transition-all">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => handleJumpToPage(totalBookPages - 1)} aria-label="Back cover" className="size-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 transition-all">
            <ChevronsRight className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = flipAnimationMode === "realistic" ? "fast" : "realistic";
              setFlipAnimationMode(next);
              toast.success(next === "realistic" ? "Page turn animation on" : "Page turn animation off");
            }}
            aria-pressed={flipAnimationMode === "realistic"}
            className={cn(
              "hidden sm:flex px-2.5 py-1 rounded-lg border text-xs font-semibold items-center transition-all shadow-xs",
              flipAnimationMode === "realistic" ? "bg-zinc-900 text-white border-zinc-900" : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
            )}
          >
            Animation {flipAnimationMode === "realistic" ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={() => setIsMuted((value) => !value)}
            aria-label={isMuted ? "Unmute page sound" : "Mute page sound"}
            aria-pressed={isMuted}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isMuted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4 text-zinc-800" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            aria-pressed={isFullscreen}
            className="size-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </footer>

      {/* Search dialog */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowSearchModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="docs-search-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-white border border-zinc-200 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 id="docs-search-title" className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <Search className="size-4 text-zinc-700" aria-hidden="true" />
                Search the {manual.short}
              </h2>
              <button type="button" onClick={() => setShowSearchModal(false)} aria-label="Close search" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="relative">
              <input
                type="search"
                maxLength={60}
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search topics (for example GCash, lease, repair)…"
                aria-label="Search topics"
                className="w-full h-10 pl-4 pr-10 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800">
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar-premium" aria-live="polite">
                {searchResponse.results.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleJumpToArticle(article.id)}
                    className="w-full p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-left transition-all flex items-center justify-between text-xs group border border-zinc-100"
                  >
                    <div className="min-w-0">
                      <h5 className="font-bold text-zinc-900 group-hover:text-zinc-950">{article.title}</h5>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">{article.summary}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-900 ml-2 shrink-0 font-bold">Open →</span>
                  </button>
                ))}

                {searchResponse.results.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">
                    No matching topics.
                    {searchResponse.didYouMean && (
                      <>
                        {" "}Did you mean{" "}
                        <button type="button" onClick={() => setSearchQuery(searchResponse.didYouMean!)} className="font-bold text-zinc-900 underline">
                          {searchResponse.didYouMean}
                        </button>
                        ?
                      </>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table of contents drawer */}
      {showTOC && (
        <nav
          aria-label="Table of contents"
          className="absolute bottom-14 left-4 sm:left-8 z-50 w-80 max-h-[460px] rounded-xl bg-white border border-zinc-200 p-4 shadow-2xl backdrop-blur-xl overflow-y-auto custom-scrollbar-premium space-y-2"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-zinc-700" aria-hidden="true" />
              Contents
            </h4>
            <button type="button" onClick={() => setShowTOC(false)} aria-label="Close contents" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-1">
            <button type="button" onClick={() => handleJumpToPage(0)} className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all">
              Front cover
            </button>
            <button type="button" onClick={() => handleJumpToPage(1)} className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-all">
              Contents
            </button>
            {articles.map((article, idx) => (
              <button
                key={article.id}
                type="button"
                onClick={() => handleJumpToArticle(article.id)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between text-zinc-700 hover:bg-zinc-100"
              >
                <span className="truncate max-w-[190px]">{article.title}</span>
                <span className="font-mono text-[9px] text-zinc-400 font-bold">p.{idx + 2}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
