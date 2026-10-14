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
import { useLanguageContext } from "@/context/LanguageContext"

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
}

export default function TermsPage() {
  const { t, isFilipino } = useLanguageContext()
  const [activeSection, setActiveSection] = useState<string>("acceptance")
  const [scrollProgress, setScrollProgress] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null)

  const SECTIONS_EN: Section[] = [
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
          personal data in accordance with applicable privacy laws, principally the Philippine Data
          Privacy Act of 2012 (Republic Act No. 10173).
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
          We use first-party cookies and browser storage to keep you signed in and remember your
          settings. We do not use advertising or third-party tracking cookies. You can review your cookie
          preferences at any time from the Privacy Policy. Essential cookies are required for platform functionality.
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
          engage in illegal activity, or harm other users. You may request deletion of your account
          and personal data at any time by contacting us or your landlord, as described in our Privacy Policy.
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

  // Filipino courtesy translation; the English version above prevails in case of conflict.
  const SECTIONS_FIL: Section[] = [
    {
      id: "acceptance",
      title: "1. Pagtanggap sa mga Tuntunin",
      icon: FileText,
      content: (
        <p className="leading-relaxed">
          Sa pag-access at paggamit ng iReside, sumasang-ayon kang sumunod sa mga Tuntunin ng
          Serbisyong ito. Kung hindi ka sumasang-ayon sa mga tuntuning ito, mangyaring huwag
          gamitin ang aming platform.
        </p>
      )
    },
    {
      id: "description",
      title: "2. Paglalarawan ng Serbisyo",
      icon: Settings,
      content: (
        <p className="leading-relaxed">
          Ang iReside ay isang property management platform na nagbibigay-daan sa mga landlord na
          pamahalaan ang kanilang mga ari-arian, maglista ng mga unit, at makipag-ugnayan sa mga
          tenant. Pinapayagan din ng platform ang mga tenant na tumingin ng mga listing, magsumite
          ng mga aplikasyon, at pamahalaan ang kanilang karanasan sa pag-upa.
        </p>
      )
    },
    {
      id: "accounts",
      title: "3. Mga Account ng User",
      icon: UserCheck,
      content: (
        <p className="leading-relaxed">
          Kailangang gumawa ng account ang mga landlord para maglista ng mga ari-arian at
          pamahalaan ang kaugnayan sa mga tenant. Awtomatikong nakakatanggap ng account ang mga
          tenant kapag naaprubahan ang aplikasyon at ang kasunduan sa pag-upa (lease). Ikaw ang
          may pananagutan sa pagpapanatiling kumpidensyal ng iyong mga credential sa account.
        </p>
      )
    },
    {
      id: "landlord",
      title: "4. Mga Responsibilidad ng Landlord",
      icon: ClipboardCheck,
      content: (
        <ul className="list-disc pl-6 space-y-3">
          <li>Magbigay ng tumpak na impormasyon at listing ng ari-arian</li>
          <li>Panatilihing ligtas at matitirahan ang mga ari-arian</li>
          <li>Sumunod sa lahat ng naaangkop na batas at regulasyon sa pabahay</li>
          <li>Hawakan nang responsable ang datos at personal na impormasyon ng mga tenant</li>
          <li>Iproseso ang mga security deposit at bayad sa upa sa pamamagitan ng mga aprubadong paraan</li>
        </ul>
      )
    },
    {
      id: "tenant",
      title: "5. Mga Responsibilidad ng Tenant",
      icon: Home,
      content: (
        <ul className="list-disc pl-6 space-y-3">
          <li>Magbigay ng tumpak na personal at pinansyal na impormasyon</li>
          <li>Magbayad ng upa sa tamang oras sa pamamagitan ng platform o ng napagkasunduang paraan</li>
          <li>Panatilihin sa maayos na kondisyon ang ari-arian</li>
          <li>Sumunod sa mga tuntunin ng kontrata (lease) at sa mga alituntunin ng komunidad</li>
          <li>Agad na i-report ang mga problemang kailangang ipaayos</li>
        </ul>
      )
    },
    {
      id: "fees",
      title: "6. Mga Bayarin at Pagbabayad",
      icon: CreditCard,
      content: (
        <p className="leading-relaxed">
          Ang iReside ay self-hosted at walang tuloy-tuloy na sentral na SaaS fee. Lahat ng
          transaksyon ay direktang binabayaran sa landlord.
          Ibinibigay ang iReside sa pamamagitan ng isang beses na deployment model at ibinibigay
          bilang isang independiyente at hiwalay na property management instance. Hindi
          naniningil ang development team ng tuloy-tuloy na sentral na SaaS subscription fee,
          sentral na porsyento ng komisyon, o fee sa pagproseso ng transaksyon sa platform. Ang
          bawat deployment ay pinamamahalaan nang nagsasarili ng landlord, at lahat ng
          transaksyong pinansyal (gaya ng bayad sa upa o singil sa utilities) ay direktang
          binabayaran sa pagitan ng mga landlord at tenant sa ilalim ng kanilang mga kasunduan sa
          pag-upa. Ang anumang kahilingan para sa opsyonal na maintenance support, custom na
          pagpapahusay ng feature, o karagdagang integrasyon ng sistema ay labas sa default na
          saklaw ng deployment at inaasikaso nang isa-isa, batay sa bawat kaso, sa ilalim ng
          hiwalay na mga kasunduan sa serbisyo.
        </p>
      )
    },
    {
      id: "privacy",
      title: "7. Privacy ng Datos",
      icon: ShieldCheck,
      content: (
        <p className="leading-relaxed">
          Ang paggamit mo ng iReside ay saklaw din ng aming Patakaran sa Privacy. Kinokolekta,
          iniimbak, at pinoproseso namin ang personal na datos alinsunod sa mga naaangkop na batas
          sa privacy, pangunahin na ang Data Privacy Act of 2012 ng Pilipinas (Republic Act No.
          10173). Tingnan ang aming <Link href="/privacy" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">Patakaran sa Privacy</Link> para sa mga detalye.
        </p>
      )
    },
    {
      id: "cookies",
      title: "8. Paggamit ng Cookie",
      icon: Cookie,
      content: (
        <p className="leading-relaxed">
          Gumagamit kami ng first-party cookies at browser storage para panatilihin kang naka-sign
          in at tandaan ang iyong mga setting. Hindi kami gumagamit ng advertising o third-party
          tracking cookies. Maaari mong suriin ang iyong mga kagustuhan sa cookie anumang oras mula
          sa Patakaran sa Privacy. Kailangan ang mga essential cookie para gumana ang platform.
        </p>
      )
    },
    {
      id: "liability",
      title: "9. Limitasyon ng Pananagutan",
      icon: AlertTriangle,
      content: (
        <p className="leading-relaxed">
          Walang pananagutan ang iReside sa mga kilos ng mga user, sa kondisyon ng mga ari-arian,
          o sa mga alitan sa pagitan ng mga landlord at tenant. Ang aming platform ay nagsisilbi
          lamang bilang kasangkapan sa komunikasyon at pamamahala. Inirerekomenda naming
          magsagawa ng due diligence at humingi ng propesyonal na payo para sa mga desisyon sa
          pag-upa.
        </p>
      )
    },
    {
      id: "termination",
      title: "10. Pagwawakas",
      icon: Ban,
      content: (
        <p className="leading-relaxed">
          May karapatan kaming suspindihin o wakasan ang mga account na lumalabag sa mga
          tuntuning ito, sangkot sa ilegal na gawain, o nakapipinsala sa ibang user. Maaari mong
          hilingin ang pagbura ng iyong account at personal na datos anumang oras sa
          pakikipag-ugnayan sa amin o sa iyong landlord, gaya ng inilalarawan sa aming Patakaran
          sa Privacy.
        </p>
      )
    },
    {
      id: "changes",
      title: "11. Mga Pagbabago sa mga Tuntunin",
      icon: RefreshCw,
      content: (
        <p className="leading-relaxed">
          Maaari naming i-update ang mga tuntuning ito paminsan-minsan. Aabisuhan namin ang mga
          user tungkol sa mahahalagang pagbabago sa pamamagitan ng email o notipikasyon sa
          platform. Ang patuloy na paggamit ng iReside pagkatapos ng mga pagbabago ay
          nangangahulugan ng pagtanggap sa mga na-update na tuntunin.
        </p>
      )
    },
    {
      id: "contact",
      title: "12. Pakikipag-ugnayan",
      icon: Mail,
      content: (
        <p className="leading-relaxed">
          Para sa mga tanong tungkol sa mga Tuntunin ng Serbisyong ito, makipag-ugnayan sa amin
          sa{" "}
          <a href="mailto:ireside.official.mail@gmail.com" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">
            ireside.official.mail@gmail.com
          </a>
          .
        </p>
      )
    }
  ]

  const SECTIONS = isFilipino ? SECTIONS_FIL : SECTIONS_EN

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
                <span className="hidden sm:inline">{t("Back to iReside")}</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2 text-foreground font-display font-black text-lg tracking-tight select-none">
              <span className="text-primary font-black">i</span>Reside
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">{t("Legal")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon-sm" 
              onClick={handlePrint}
              title={t("Print Document")}
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
                  <span className="text-emerald-500 font-medium text-xs">{t("Copied")}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span className="text-xs">{t("Copy Link")}</span>
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
            {t("Terms of Service")}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
            {t("Please read these terms carefully before accessing or using the platform. Last updated on")} <span className="text-foreground font-semibold">{t("October 8, 2026")}</span>.
          </p>
          {isFilipino && (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90">
              Ang bersyong Filipino na ito ay salin para sa inyong kaginhawahan lamang. Kung may
              pagkakaiba o salungatan sa pagitan ng bersyong Filipino at ng bersyong English, ang
              bersyong English ang masusunod.
            </p>
          )}
        </div>

        {/* Dynamic Controls Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card border border-border p-4 rounded-2xl shadow-xs">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input maxLength={60} 
              type="text" 
              placeholder={t("Search terms (e.g. rent, liability, landlords)...")}
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground font-display">{t("Table of Contents")}</h2>
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
                <h3 className="text-lg font-bold text-foreground mb-1 font-display">{t("No matches found")}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  {t("We couldn't find any terms matching “{query}”. Try typing terms like “rent”, “landlord”, or “privacy”.", { query: searchQuery })}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border-border"
                >
                  {t("Clear Search Filter")}
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
                      title={t("Copy link to this section")}
                    >
                      {copiedSectionId === sec.id ? (
                        <>
                          <Check className="size-3.5 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-medium">{t("Copied!")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          <span className="text-[10px]">{t("Copy Link")}</span>
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
          {t("Back to Top")}
        </Button>
      </div>
    </div>
  )
}