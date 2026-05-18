"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Search, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  Settings, 
  UserCheck, 
  ClipboardCheck, 
  CreditCard, 
  ShieldCheck, 
  Cookie, 
  AlertTriangle, 
  Ban, 
  RefreshCw, 
  Mail,
  Home,
  ChevronRight,
  BookOpen
} from "lucide-react"

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState<string>("acceptance")
  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

  const SECTIONS: Section[] = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: FileText,
      content: (
        <p className="leading-relaxed">
          By accessing and using iReside, you agree to be bound by these Terms of Service. 
          If you do not agree to these terms, please do not use our platform.
        </p>
      )
    },
    {
      id: "description",
      title: "2. Description of Service",
      icon: Settings,
      content: (
        <p className="leading-relaxed">
          iReside is a property management platform that enables landlords to manage properties, 
          list units, and communicate with tenants. The platform also allows tenants to view 
          listings, submit applications, and manage their rental experience.
        </p>
      )
    },
    {
      id: "accounts",
      title: "3. User Accounts",
      icon: UserCheck,
      content: (
        <p className="leading-relaxed">
          Landlords must create an account to list properties and manage tenant relationships. 
          Tenants receive accounts automatically upon approved application and lease agreement. 
          You are responsible for maintaining the confidentiality of your account credentials.
        </p>
      )
    },
    {
      id: "landlord",
      title: "4. Landlord Responsibilities",
      icon: ClipboardCheck,
      content: (
        <ul className="list-disc pl-6 space-y-3">
          <li>Provide accurate property information and listings</li>
          <li>Maintain properties in safe and habitable condition</li>
          <li>Comply with all applicable housing laws and regulations</li>
          <li>Handle tenant data and personal information responsibly</li>
          <li>Process security deposits and rent payments through approved methods</li>
        </ul>
      )
    },
    {
      id: "tenant",
      title: "5. Tenant Responsibilities",
      icon: Home,
      content: (
        <ul className="list-disc pl-6 space-y-3">
          <li>Provide accurate personal and financial information</li>
          <li>Pay rent on time through the platform or agreed method</li>
          <li>Maintain the property in good condition</li>
          <li>Comply with lease terms and community guidelines</li>
          <li>Report maintenance issues promptly</li>
        </ul>
      )
    },
    {
      id: "fees",
      title: "6. Fees and Payments",
      icon: CreditCard,
      content: (
        <p className="leading-relaxed">
          iReside is self-hosted with no ongoing central SaaS fees. All transactions are settled directly with the landlord.
          iReside is delivered via a one-time deployment model and handed over as an independent, isolated property management instance. The development team does not charge ongoing central SaaS subscription fees, central commission percentages, or platform transaction processing fees. Each deployment is autonomously managed by the landlord, and all financial transactions (such as rent payments or utility dues) are settled directly between landlords and tenants under their lease agreements. Any request for optional maintenance support, custom feature enhancements, or additional system integrations is outside the default deployment scope and handled on an individual case-by-case basis under separate service agreements.
        </p>
      )
    },
    {
      id: "privacy",
      title: "7. Data Privacy",
      icon: ShieldCheck,
      content: (
        <p className="leading-relaxed">
          Your use of iReside is also governed by our Privacy Policy. We collect, store, and process 
          personal data in accordance with applicable privacy laws including GDPR and CCPA. 
          See our <Link href="/privacy" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">Privacy Policy</Link> for details.
        </p>
      )
    },
    {
      id: "cookies",
      title: "8. Cookie Usage",
      icon: Cookie,
      content: (
        <p className="leading-relaxed">
          We use cookies and similar technologies to power our platform, analyze usage, and personalize 
          your experience. You can manage your cookie preferences through our cookie consent banner.
          Essential cookies are required for platform functionality.
        </p>
      )
    },
    {
      id: "liability",
      title: "9. Limitation of Liability",
      icon: AlertTriangle,
      content: (
        <p className="leading-relaxed">
          iReside is not responsible for the actions of users, the condition of properties, or disputes 
          between landlords and tenants. Our platform serves as a communication and management tool only. 
          We recommend conducting due diligence and seeking professional advice for rental decisions.
        </p>
      )
    },
    {
      id: "termination",
      title: "10. Termination",
      icon: Ban,
      content: (
        <p className="leading-relaxed">
          We reserve the right to suspend or terminate accounts that violate these terms, 
          engage in illegal activity, or harm other users. Users may delete their accounts at any time.
        </p>
      )
    },
    {
      id: "changes",
      title: "11. Changes to Terms",
      icon: RefreshCw,
      content: (
        <p className="leading-relaxed">
          We may update these terms from time to time. We will notify users of significant changes 
          via email or platform notifications. Continued use of iReside after changes constitutes 
          acceptance of the updated terms.
        </p>
      )
    },
    {
      id: "contact",
      title: "12. Contact",
      icon: Mail,
      content: (
        <p className="leading-relaxed">
          For questions about these Terms of Service, please contact us at{" "}
          <a href="mailto:ireside.official.mail@gmail.com" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">
            ireside.official.mail@gmail.com
          </a>
          .
        </p>
      )
    }
  ]

  // Update scroll progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-scroll to hash-linked section if present
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.substring(1)
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 300)
      }
    }
  }, [])

  // Highlight active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1
      }
    )

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopySection = (id: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${window.location.pathname}#${id}`
      navigator.clipboard.writeText(url)
      setCopiedSectionId(id)
      setTimeout(() => setCopiedSectionId(null), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  // Filter sections by search query
  const filteredSections = SECTIONS.filter((sec) => {
    const query = searchQuery.toLowerCase()
    return (
      sec.title.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border/40 z-50">
        <div 
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Decorative Radial Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Panel */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2 border-border shadow-xs hover:border-primary/30">
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Back to iReside</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-foreground font-display font-black text-lg tracking-tight select-none">
              <span className="text-primary font-black">i</span>Reside
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">Legal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon-sm" 
              onClick={handlePrint}
              title="Print Document"
              className="rounded-xl border-border shadow-xs hover:border-primary/30 text-muted-foreground hover:text-foreground"
            >
              <Printer className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="rounded-xl border-border shadow-xs hover:border-primary/30 text-muted-foreground hover:text-foreground gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span className="text-xs">Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight font-display text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            Please read these terms carefully before accessing or using the platform. Last updated on <span className="text-foreground font-semibold">May 18, 2026</span>.
          </p>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search terms (e.g. rent, liability, landlords)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Contents Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sticky Sidebar Navigation (TOC) */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start bg-card border border-border rounded-3xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <BookOpen className="size-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground font-display">Table of Contents</h2>
            </div>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon
                const isActive = activeSection === sec.id
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      const el = document.getElementById(sec.id)
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" })
                        setActiveSection(sec.id)
                      }
                    }}
                    className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl text-xs font-medium transition-all group ${
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                      }`}>
                        <Icon className="size-3.5" />
                      </div>
                      <span className="truncate">{sec.title.split(". ")[1]}</span>
                    </div>
                    <ChevronRight className={`size-3 transition-transform ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'}`} />
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Detailed Content */}
          <div className="flex-1 max-w-4xl space-y-6">
            
            {/* Empty state when filtering */}
            {filteredSections.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                  <Search className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 font-display">No matches found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  We couldn&apos;t find any terms matching &ldquo;{searchQuery}&rdquo;. Try typing terms like &ldquo;rent&rdquo;, &ldquo;landlord&rdquo;, or &ldquo;privacy&rdquo;.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border-border"
                >
                  Clear Search Filter
                </Button>
              </div>
            )}

            {filteredSections.map((sec) => {
              const Icon = sec.icon
              const isActive = activeSection === sec.id
              return (
                <section 
                  key={sec.id}
                  id={sec.id}
                  className={`group/card relative rounded-3xl border bg-card p-6 md:p-8 shadow-xs transition-all duration-300 scroll-mt-24 ${
                    isActive 
                      ? 'border-primary/50 ring-1 ring-primary/20 shadow-md' 
                      : 'border-border hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  {/* Decorative corner tag when active */}
                  {isActive && (
                    <div className="absolute top-0 right-0 h-12 w-12 overflow-hidden rounded-tr-3xl">
                      <div className="absolute top-0 right-0 h-4 w-4 bg-primary rotate-45 translate-x-2 -translate-y-2" />
                    </div>
                  )}

                  {/* Section Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center size-10 rounded-xl transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover/card:scale-105'
                      }`}>
                        <Icon className="size-5" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
                        {sec.title}
                      </h2>
                    </div>

                    {/* Copy specific section URL */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySection(sec.id)}
                      className="rounded-lg border-border text-muted-foreground hover:text-foreground self-start sm:self-auto gap-1.5 h-7 px-2"
                      title="Copy link to this section"
                    >
                      {copiedSectionId === sec.id ? (
                        <>
                          <Check className="size-3.5 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span className="text-[10px]">Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* detailed legal text */}
                  <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/80 dark:text-foreground/75 leading-relaxed text-sm md:text-base">
                    {sec.content}
                  </div>
                </section>
              )
            })}
          </div>

        </div>
      </main>

      {/* Dynamic Floating Action Back to Top */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => typeof window !== "undefined" && window.scrollTo({ top: 0, behavior: "smooth" })}
          className="rounded-full shadow-lg border-border bg-card/85 backdrop-blur-md h-9 px-3 gap-1 hover:border-primary text-xs font-semibold"
        >
          Back to Top
        </Button>
      </div>
    </div>
  )
}