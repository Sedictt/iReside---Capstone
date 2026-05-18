import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldAlert, Scale, Building, Coins, Brain, MessageSquare, AlertTriangle, ShieldCheck, MapPin } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Decorative Gradients for Rich Aesthetics */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10">
        
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6 hover:bg-muted/80 transition-colors">
              <ArrowLeft className="size-4" />
              Back to iReside
            </Button>
          </Link>

          {/* Page Header */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold tracking-wider text-primary uppercase">Legal & Compliance Documentation</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80 bg-clip-text">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Academic Research & Capstone Prototype License · Last updated: May 18, 2026
            </p>
          </div>
        </div>

        {/* Academic Prototype Callout (WOW factor, fully transparent) */}
        <div className="mb-12 p-6 rounded-2xl border border-warning/30 bg-warning/5 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex gap-4 items-start">
            <ShieldAlert className="size-8 text-warning shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                Important Capstone Academic Disclaimer
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                iReside is an exclusive, private property and tenant management platform developed strictly as an <strong>academic Capstone research prototype</strong>. 
                All operations within this platform—including landlord registrations, tenant onboarding, visual unit plans, dynamic invoicing, 
                supportive AI analysis, and digital signature workflows—are developed for demonstration, evaluation, and UX/UI research purposes. 
                <strong>There are no legally binding contracts, real-world utility billings, or actual financial transactions executed through this system.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Structured Terms Content */}
        <div className="space-y-12">
          
          {/* Section 1 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Scale className="size-6 text-primary shrink-0" />
              1. Acceptance of Terms & Research Participation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing, registering, or using the iReside platform as either an administrator, landlord, or tenant, you acknowledge that you are participating in a controlled Capstone evaluation study. You agree to use the platform in accordance with these Terms of Service. If you do not agree to these terms or cannot fulfill the participation requirements, please discontinue use immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <MapPin className="size-6 text-primary shrink-0" />
              2. Geographic & Property Scope Boundaries
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside is customized and optimized exclusively for the multi-unit rental market (apartments, dormitories, and boarding houses) situated within the geographic boundaries of the following barangays in <strong>Valenzuela City, Philippines</strong>:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {["Barangay Marulas", "Barangay Canumay", "Barangay Malinta", "Barangay Maysan"].map((barangay) => (
                <div key={barangay} className="p-3 rounded-xl border border-border/40 bg-muted/30 text-center font-bold text-sm text-foreground/95">
                  {barangay}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm pt-2">
              Single-family homes, transient hotels, commercial leasing ecosystems, and properties outside these four specified barangays are explicitly outside the system's operational scope and limits.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Building className="size-6 text-primary shrink-0" />
              3. Private Onboarding & Gated Access Model
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside functions as an exclusive, private property-management ecosystem. 
              <strong> There is no public listing marketplace, unit discovery portal, or self-service tenant registration.</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Landlord Provisioning:</strong> Landlord accounts are provisioned exclusively through authorized backend administrator workflows after uploading valid business permits and government identification for visual inspection.</li>
              <li><strong>Tenant Provisioning:</strong> Tenant accounts cannot be created publicly. Tenants are invited and provisioned strictly by their landlords through the "Walk-in Application" workflow following offline vetting.</li>
              <li><strong>Isolated Property Ecosystems:</strong> Each property operates as a separate, logically partitioned space. Landlords cannot view other landlords' operations, and tenants can only access the portal of their approved property.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <AlertTriangle className="size-6 text-primary shrink-0" />
              4. Visual Unit Map Constraints
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The 2D Unit Map canvas is purely a digital visualization and organizational tool designed to represent unit locations, occupancy states, and active maintenance statuses in real-time.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>It does <strong>not</strong> generate engineering-grade floor measurements, structural load metrics, or architectural plan certifications.</li>
              <li>Unit status overlays are strictly informational and do not automate contractor dispatches, penalizations, or legal processes.</li>
              <li>The system does not issue automated eviction notices, as eviction is a strictly judicial process under Philippine tenancy laws (including Batas Pambansa Blg. 25).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Coins className="size-6 text-primary shrink-0" />
              5. Financial Tracking & Payment Delimitations
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Real-Time Financial Ledger manages digital statements, billing schedules, and invoices for Base Rent, Water, and Electricity.
            </p>
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-muted-foreground space-y-2">
              <p className="font-extrabold text-foreground flex items-center gap-2">
                <ShieldAlert className="size-4 text-destructive" /> Crucial Payment Gateway Exclusion
              </p>
              <p>
                iReside **does not execute or process actual fund transfers**, nor does it integrate directly with payment gateways, banking APIs, or the GCash API. Operating as a licensed payment intermediary would require BSP circular 649 compliance, AMLA audits, and PCI-DSS certification which are outside the scope of this Capstone research project.
              </p>
              <p>
                Payment verification is done <strong>manually</strong> by landlords auditing uploaded transaction screenshots (e.g., GCash receipts). The ledger is strictly for record-keeping and is not a substitute for formal BIR accounting logs.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Brain className="size-6 text-primary shrink-0" />
              6. Advisory Supportive AI & Groq Llama 3.1 8B Utilities
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The platform integrates local AI services powered by <strong>Groq Llama 3.1 8B</strong> using RAG architecture for context intelligence (building rules, maintenance severity categorizations, analytics overlays, and communication moderation).
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Strictly Advisory:</strong> All AI outputs are informational. Landlords and tenants must visually verify and manually approve any recommendation before action is taken.</li>
              <li><strong>Zero Autonomy:</strong> The AI does not autonomously approve budgets, draft legally binding clauses, make automated tenant denial decisions, or process credit scoring.</li>
              <li><strong>Background Vetting Limitations:</strong> To avoid discrimination, algorithmic bias, and to comply with the Data Privacy Act (RA 10173), the AI does not perform credit ratings or automated tenant background screening.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="size-6 text-primary shrink-0" />
              7. Communication, Community, & Content Moderation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In-app chat and the Community Hub (discussion boards, notices, resident polls, and utility alerts) are facilitated via Supabase Realtime protocols.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Communication is limited to text exchange and media/file sharing within the app (no voice/video calls).</li>
              <li>All chat and community posts are stored for day-to-day operational reference and administrative review; they are not intended or archived for legal discovery purposes.</li>
              <li>Content moderation is enforced via real-time automated filters and landlord-managed moderation queues. Landlords have ultimate discretion over property community guidelines.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary shrink-0" />
              8. Deployment & Operational Support Model
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside operates as a <strong>semi-managed, isolated deployment model</strong>. 
              The development team acts solely as the technical supplier responsible for initial provisioning, server setup, and database initialization. After handover, the landlord assumes full independent management of their respective ecosystem. 
              Continuous operational support, live helpline assistance, and post-deployment custom feature additions are treated as optional service engagements outside the core system boundaries.
            </p>
          </section>

          {/* Section 9 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Scale className="size-6 text-primary shrink-0" />
              9. Document & Lease Signing Exclusions
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The digital lease signing workflow supports canvas-based electronic signatures for operational convenience only. 
              It does <strong>not</strong> provide remote or automated third-party notarization, which requires physical appearance before a licensed notary public under the Philippine 2004 Rules on Notarial Practice. 
              Landlords are strongly advised to consult legal counsel to ensure that their custom contract templates comply with Batas Pambansa Blg. 25 and local regulations.
            </p>
          </section>
        </div>

        {/* Footer Contact Details */}
        <div className="mt-16 pt-8 border-t border-border/40 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            For academic queries, feedback, or verification regarding this Capstone study, please contact the development team:
          </p>
          <div className="flex justify-center gap-6 text-sm text-foreground font-bold">
            <a href="mailto:support@ireside.com" className="hover:text-primary hover:underline transition-all">
              academic-board@ireside.com
            </a>
            <span>·</span>
            <span>Valenzuela City, Metro Manila</span>
          </div>
        </div>

      </div>
    </div>
  )
}