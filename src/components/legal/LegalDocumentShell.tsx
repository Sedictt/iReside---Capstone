"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Cookie,
  Copy,
  Cpu,
  Globe,
  Info,
  Lock,
  Mail,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react"

const ICONS = {
  info: Info,
  collect: ClipboardCheck,
  purpose: Settings,
  sensitive: ShieldAlert,
  sharing: Share2,
  ai: Cpu,
  cookies: Cookie,
  security: Lock,
  retention: Clock,
  rights: Scale,
  children: Users,
  transfers: Globe,
  changes: RefreshCw,
  contact: Mail,
  shield: ShieldCheck,
} as const

export type LegalIconName = keyof typeof ICONS

export interface LegalSection {
  id: string
  title: string
  icon: LegalIconName
  content: ReactNode
}

interface LegalDocumentShellProps {
  title: string
  intro: ReactNode
  /** Human-readable date, e.g. "October 8, 2026". */
  lastUpdated: string
  /** Machine-readable ISO date for the <time> element. */
  lastUpdatedIso: string
  version: string
  searchPlaceholder: string
  /** Optional "at a glance" block shown above the sections (hidden while searching). */
  summary?: ReactNode
  sections: LegalSection[]
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function LegalDocumentShell({
  title,
  intro,
  lastUpdated,
  lastUpdatedIso,
  version,
  searchPlaceholder,
  summary,
  sections,
}: LegalDocumentShellProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "")
  const [scrollProgress, setScrollProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchIndex, setSearchIndex] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

  // Build a full-text index from the rendered content once, before any filtering.
  useEffect(() => {
    const index: Record<string, string> = {}
    sections.forEach((section) => {
      index[section.id] = (document.getElementById(section.id)?.textContent ?? "").toLowerCase()
    })
    setSearchIndex(index)
  }, [sections])

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const filteredSections = useMemo(() => {
    if (!trimmedQuery) return sections
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(trimmedQuery) ||
        (searchIndex[section.id] ?? "").includes(trimmedQuery),
    )
  }, [sections, searchIndex, trimmedQuery])
  const visibleKey = filteredSections.map((s) => s.id).join(",")

  // Reading progress bar.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  // Jump to a hash-linked section on first load.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const element = document.getElementById(id)
    if (!element) return
    const timer = window.setTimeout(() => {
      element.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      })
      setActiveSection(id)
    }, 150)
    return () => window.clearTimeout(timer)
  }, [])

  // Highlight the section currently being read.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 },
    )
    visibleKey
      .split(",")
      .filter(Boolean)
      .forEach((id) => {
        const element = document.getElementById(id)
        if (element) observer.observe(element)
      })
    return () => observer.disconnect()
  }, [visibleKey])

  const handleCopyLink = useCallback(async () => {
    if (await copyToClipboard(window.location.href.split("#")[0])) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const handleCopySection = useCallback(async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    if (await copyToClipboard(url)) {
      setCopiedSectionId(id)
      window.setTimeout(() => setCopiedSectionId(null), 2000)
    }
  }, [])

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })

  const numberOf = (id: string) => sections.findIndex((section) => section.id === id) + 1

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Reading progress */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-1 bg-border/40 z-50 print:hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-75 motion-reduce:transition-none"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Decorative gradients */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none print:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute top-[20%] right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] pointer-events-none print:hidden"
      />

      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 print:static print:border-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl flex items-center gap-2 border-border shadow-xs hover:border-primary/30 print:hidden"
            >
              <Link href="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Back to iReside</span>
                <span className="sr-only sm:hidden">Back to iReside</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block print:hidden" aria-hidden="true" />
            <div className="flex items-center gap-2 text-foreground font-display font-black text-lg tracking-tight select-none">
              <span className="text-primary font-black">i</span>Reside
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">
                Legal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => window.print()}
              aria-label={`Print ${title}`}
              title={`Print ${title}`}
              className="rounded-xl border-border shadow-xs hover:border-primary/30 text-muted-foreground hover:text-foreground"
            >
              <Printer className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl border-border shadow-xs hover:border-primary/30 text-muted-foreground hover:text-foreground gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span className="text-emerald-600 font-medium text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  <span className="text-xs">Copy link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display text-foreground mb-4">
            {title}
          </h1>
          <div className="text-muted-foreground text-base leading-relaxed md:text-lg space-y-3">
            {intro}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated{" "}
            <time dateTime={lastUpdatedIso} className="text-foreground font-semibold">
              {lastUpdated}
            </time>
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            Version {version}
          </p>
        </div>

        <div className="mt-8 bg-card border border-border p-4 rounded-2xl shadow-xs print:hidden">
          <div className="relative max-w-md">
            <label htmlFor="legal-search" className="sr-only">
              Search this document
            </label>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="legal-search"
              type="search"
              maxLength={60}
              autoComplete="off"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
          <p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground min-h-4">
            {trimmedQuery
              ? `${filteredSections.length} of ${sections.length} sections match “${searchQuery.trim()}”`
              : ""}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop table of contents */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start bg-card border border-border rounded-3xl p-5 shadow-xs print:hidden">
            <nav aria-labelledby="legal-toc-heading">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <BookOpen className="size-4 text-primary" aria-hidden="true" />
                <h2
                  id="legal-toc-heading"
                  className="text-xs font-bold uppercase tracking-wider text-foreground font-display"
                >
                  Contents
                </h2>
              </div>
              <ol className="space-y-1">
                {sections.map((section) => {
                  const Icon = ICONS[section.icon]
                  const isActive = activeSection === section.id
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        aria-current={isActive ? "location" : undefined}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-medium transition-colors group ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="truncate">{section.title}</span>
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className={`size-3 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                      </a>
                    </li>
                  )
                })}
              </ol>
            </nav>
          </aside>

          <div className="flex-1 min-w-0 max-w-4xl space-y-6">
            {/* Mobile table of contents */}
            <details className="lg:hidden rounded-2xl border border-border bg-card p-4 print:hidden">
              <summary className="cursor-pointer text-sm font-bold text-foreground font-display">
                Contents
              </summary>
              <nav aria-label={`${title} contents`} className="mt-3">
                <ol className="space-y-1 text-sm">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {numberOf(section.id)}. {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>

            {!trimmedQuery && summary}

            {filteredSections.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-amber-500/10 text-amber-600 mb-4">
                  <Search className="size-6" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1 font-display">
                  No matches found
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Nothing in this document matches “{searchQuery.trim()}”. Try a different word,
                  such as “cookies”, “retention”, or “AI”.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border-border"
                >
                  Clear search
                </Button>
              </div>
            )}

            {filteredSections.map((section) => {
              const Icon = ICONS[section.icon]
              const isActive = activeSection === section.id
              const headingId = `${section.id}-heading`
              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={headingId}
                  className={`group/card relative rounded-3xl border bg-card p-6 md:p-8 shadow-xs transition-colors duration-300 scroll-mt-24 print:rounded-none print:border-0 print:p-0 print:shadow-none ${
                    isActive
                      ? "border-primary/50 ring-1 ring-primary/20 shadow-md"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-4">
                      <div
                        aria-hidden="true"
                        className={`flex shrink-0 items-center justify-center size-10 rounded-xl transition-colors print:hidden ${
                          isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <h2
                        id={headingId}
                        className="text-xl md:text-2xl font-bold font-display text-foreground"
                      >
                        {numberOf(section.id)}. {section.title}
                      </h2>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySection(section.id)}
                      className="rounded-lg border-border text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1.5 h-8 px-2.5 print:hidden"
                      aria-label={`Copy link to section ${numberOf(section.id)}, ${section.title}`}
                    >
                      {copiedSectionId === section.id ? (
                        <>
                          <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                          <span className="text-xs text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden="true" />
                          <span className="text-xs">Copy link</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/80 dark:text-foreground/75 leading-relaxed text-sm md:text-base">
                    {section.content}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToTop}
          className="rounded-full shadow-lg border-border bg-card/85 backdrop-blur-md h-10 px-3 gap-1 hover:border-primary text-xs font-semibold"
        >
          <ArrowUp className="size-3.5" aria-hidden="true" />
          Back to top
        </Button>
      </div>
    </div>
  )
}
