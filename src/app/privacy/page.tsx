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
  Info, 
  ClipboardCheck, 
  Settings, 
  Cookie, 
  Lock, 
  ShieldCheck, 
  Scale, 
  Clock, 
  Globe, 
  RefreshCw, 
  Mail,
  Sliders,
  ChevronRight,
  BookOpen
} from "lucide-react"

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState<string>("intro")
  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

  const SECTIONS: Section[] = [
    {
      id: "intro",
      title: "1. Introduction",
      icon: Info,
      content: (
        <p className="leading-relaxed">
          iReside (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy 
          explains how we collect, use, disclose, and safeguard your information when you use our 
          property management platform.
        </p>
      )
    },
    {
      id: "collect",
      title: "2. Information We Collect",
      icon: ClipboardCheck,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground mb-1">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Name, email address, and contact information</li>
              <li>Phone number and mailing address</li>
              <li>Date of birth and identification documents</li>
              <li>Financial information (bank details, payment history)</li>
              <li>Employment and income verification data</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mb-1">2.2 Property Information</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Property address and description</li>
              <li>Lease agreements and terms</li>
              <li>Maintenance records and communications</li>
              <li>Payment and transaction history</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground mb-1">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Device information and browser type</li>
              <li>Usage patterns and feature interactions</li>
              <li>IP address and location data</li>
              <li>Cookies and tracking technologies</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "use",
      title: "3. How We Use Your Information",
      icon: Settings,
      content: (
        <ul className="list-disc pl-6 space-y-2">
          <li>Create and manage your account</li>
          <li>Process rental applications and verify eligibility</li>
          <li>Facilitate communication between landlords and tenants</li>
          <li>Process rent payments and security deposits</li>
          <li>Send notifications and important updates</li>
          <li>Improve our platform and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>
      )
    },
    {
      id: "cookies",
      title: "4. Cookies and Tracking",
      icon: Cookie,
      content: (
        <div className="space-y-3">
          <p>
            We use cookies and similar technologies to operate our platform, analyze usage, and personalize 
            your experience. Our cookie categories are:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Essential:</strong> Required for authentication, security, and core functionality</li>
            <li><strong>Analytics:</strong> Help us understand how you use the platform to improve it</li>
            <li><strong>Personalization:</strong> Enable tailored features and recommendations</li>
          </ul>
          <p className="mt-3">
            You can manage your cookie preferences through our cookie consent banner or your account settings.
            Disabling non-essential cookies may affect platform functionality.
          </p>
        </div>
      )
    },
    {
      id: "sharing",
      title: "5. Information Sharing",
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Landlords:</strong> Tenant application and verification data</li>
            <li><strong>Tenants:</strong> Property information and landlord contact details</li>
            <li><strong>Service Providers:</strong> Payment processors, cloud hosting, and analytics</li>
            <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information to third parties.
          </p>
        </div>
      )
    },
    {
      id: "security",
      title: "6. Data Security",
      icon: Lock,
      content: (
        <p className="leading-relaxed">
          We implement appropriate technical and organizational measures to protect your data, including 
          encryption, secure servers, and access controls. However, no method of transmission over the 
          Internet is 100% secure.
        </p>
      )
    },
    {
      id: "rights",
      title: "7. Your Rights",
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Delete your personal information</li>
            <li>Restrict or object to processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us at{" "}
            <a href="mailto:ireside.official.mail@gmail.com" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">
              ireside.official.mail@gmail.com
            </a>
            .
          </p>
        </div>
      )
    },
    {
      id: "retention",
      title: "8. Data Retention",
      icon: Clock,
      content: (
        <p className="leading-relaxed">
          We retain your information for as long as your account is active or as needed to provide 
          services. We may retain certain information for longer periods for legal compliance, dispute 
          resolution, or legitimate business purposes.
        </p>
      )
    },
    {
      id: "children",
      title: "9. Children's Privacy",
      icon: ShieldCheck,
      content: (
        <p className="leading-relaxed">
          iReside is not intended for users under 18 years of age. We do not knowingly collect 
          personal information from minors. If we learn that we have collected data from a minor, 
          we will take steps to delete it.
        </p>
      )
    },
    {
      id: "transfers",
      title: "10. International Transfers",
      icon: Globe,
      content: (
        <p className="leading-relaxed">
          Your information may be transferred to and processed in countries other than your own. 
          We ensure appropriate safeguards are in place for such transfers.
        </p>
      )
    },
    {
      id: "changes",
      title: "11. Changes to This Policy",
      icon: RefreshCw,
      content: (
        <p className="leading-relaxed">
          We may update this Privacy Policy periodically. We will notify you of significant changes 
          via email or platform notifications. Continued use of iReside after changes constitutes 
          acceptance of the updated policy.
        </p>
      )
    },
    {
      id: "contact",
      title: "12. Contact Us",
      icon: Mail,
      content: (
        <p className="leading-relaxed">
          For questions about this Privacy Policy or to exercise your rights, contact our Data Protection Officer at{" "}
          <a href="mailto:ireside.official.mail@gmail.com" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">
            ireside.official.mail@gmail.com
          </a>
          .
        </p>
      )
    },
    {
      id: "preferences",
      title: "13. Cookie Preferences",
      icon: Sliders,
      content: (
        <p className="leading-relaxed">
          You can review and update your cookie preferences at any time through our{" "}
          <Link href="/terms" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">cookie consent banner</Link> 
          {" "}or by managing your browser settings. Note that disabling certain cookies may affect platform functionality.
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            Please read this policy carefully to understand our data processing and security commitments. Last updated on <span className="text-foreground font-semibold">May 18, 2026</span>.
          </p>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search privacy topics (e.g. cookies, GDPR, encryption)..."
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
                  We couldn&apos;t find any privacy topics matching &ldquo;{searchQuery}&rdquo;. Try typing terms like &ldquo;cookies&rdquo;, &ldquo;GDPR&rdquo;, or &ldquo;retention&rdquo;.
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