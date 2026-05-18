import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, Scale, Building, Coins, Brain, MessageSquare, AlertTriangle } from "lucide-react"

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
              Standard User & Licensing Agreement · Last updated: May 18, 2026
            </p>
          </div>
        </div>

        {/* Professional Gated Platform Notice */}
        <div className="mb-12 p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex gap-4 items-start">
            <ShieldCheck className="size-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                Platform License & Gated Service Terms
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                iReside provides a private, landlord-centric property and tenant management ecosystem designed for multi-unit rental property operations. Access is gated and strictly provisioned via official landlord invitations. Please read these Terms of Service carefully before utilizing our portals, interfaces, or integrated operational services.
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
              1. Acceptance of Terms & Gated Access
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing, registering, or using the iReside platform (including the Landlord Portal or Tenant Portal), you agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and iReside. If you do not agree to these terms, you must not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Building className="size-6 text-primary shrink-0" />
              2. Private Onboarding & Gated Access Model
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside operates as an exclusive, private ecosystem. 
              <strong> There is no public listing marketplace, unit discovery portal, or self-service tenant registration.</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Landlord Provisioning:</strong> Landlord accounts are provisioned exclusively through authorized backend workflows after uploading valid business permits and government identification for verification.</li>
              <li><strong>Tenant Provisioning:</strong> Tenant accounts cannot be created publicly. Tenants are invited and provisioned strictly by their landlords through authorized digital onboarding links ("Online Invite" workflow) or manual offline verification registrations ("Walk-in Application" workflow).</li>
              <li><strong>Isolated Property Ecosystems:</strong> Each property operates as a separate, logically partitioned space. Landlords cannot view other landlords' operations, and tenants can only access the portal of their approved property.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <AlertTriangle className="size-6 text-primary shrink-0" />
              3. Visual Unit Map Constraints & Disclaimers
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The 2D Unit Map canvas is a digital visualization and spatial planning tool designed to represent unit locations, occupancy states, and active maintenance statuses in real-time.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>It does <strong>not</strong> produce engineering-grade floor measurements, structural load metrics, or architectural plan certifications.</li>
              <li>Unit status overlays are strictly informational and do not automate contractor dispatches, penalizations, or legal processes.</li>
              <li>The system does not issue automated eviction notices. Legal eviction is a strictly judicial process under Philippine tenancy laws (including Batas Pambansa Blg. 25).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Coins className="size-6 text-primary shrink-0" />
              4. Financial Tracking & Manual Payment Audit Boundaries
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The Real-Time Financial Ledger manages digital statements, billing schedules, and invoices for Base Rent, Water, and Electricity.
            </p>
            <div className="p-4 rounded-xl border border-border bg-muted/40 text-sm text-muted-foreground space-y-2">
              <p className="font-extrabold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Out-of-Band Payment & Manual Validation
              </p>
              <p>
                iReside is a record-keeping and operational tracking platform. <strong>It does not execute or process actual fund transfers directly, nor does it integrate with payment gateways or banking/GCash APIs.</strong>
              </p>
              <p>
                All financial transfers must occur out-of-band. Payment verification is done <strong>manually</strong> by landlords auditing uploaded transaction screenshots (such as GCash receipts). The ledger is strictly for operational record-keeping and does not serve as a substitute for formal corporate accounting or BIR-compliant tax computation.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Brain className="size-6 text-primary shrink-0" />
              5. Advisory AI & Context Intelligence
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The platform integrates smart operational features powered by a local <strong>Groq Llama 3.1 8B</strong> RAG (Retrieval-Augmented Generation) pipeline for building rule queries, maintenance severity categorization, analytics support, and message moderation.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Strictly Advisory:</strong> All AI outputs and analytics recommendations are purely supportive. Landlords and tenants must visually verify and manually approve any recommendation before taking actions.</li>
              <li><strong>No Automated Decisions:</strong> The AI does not autonomously approve budgets, draft legally binding clauses, make automated tenant denial decisions, or process credit scoring.</li>
              <li><strong>Background Vetting Limitations:</strong> To ensure compliance with the Data Privacy Act (RA 10173), the AI does not perform credit ratings or automated tenant background screening.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <MessageSquare className="size-6 text-primary shrink-0" />
              6. Communication, Community, & Content Moderation
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

          {/* Section 7 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary shrink-0" />
              7. Deployment & Operational Support Model
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside operates as a <strong>semi-managed, isolated deployment model</strong>. 
              The technical support team is responsible solely for provisioning, server setup, and system initialization. Post-onboarding, the landlord assumes independent management of their respective property ecosystem. 
              Continuous operational support, live helpline assistance, and post-deployment custom feature additions are treated as separate service engagements.
            </p>
          </section>

          {/* Section 8 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Scale className="size-6 text-primary shrink-0" />
              8. Document & Lease Signing Boundaries
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The digital lease signing workflow supports canvas-based electronic signatures under the Philippine Electronic Commerce Act of 2000 (R.A. 8792) for operational convenience. 
              It does <strong>not</strong> provide remote or automated third-party notarization, which requires physical appearance before a licensed notary public under the Philippine 2004 Rules on Notarial Practice. 
              Landlords are strongly advised to consult legal counsel to ensure that their custom contract templates comply with Batas Pambansa Blg. 25 and local regulations.
            </p>
          </section>
        </div>

        {/* Footer Contact Details */}
        <div className="mt-16 pt-8 border-t border-border/40 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            For operational queries, license verification, or technical support, please contact:
          </p>
          <div className="flex justify-center gap-6 text-sm text-foreground font-bold">
            <a href="mailto:support@ireside.com" className="hover:text-primary hover:underline transition-all">
              support@ireside.com
            </a>
            <span>·</span>
            <span>Valenzuela City, Metro Manila</span>
          </div>
        </div>

      </div>
    </div>
  )
}