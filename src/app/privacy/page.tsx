import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck, Eye, Database, Share2, UserCheck, Trash2, Key, Info } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Decorative Gradients for Premium Aesthetics */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

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
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data Privacy Act (R.A. 10173) Compliance Statement · Last updated: May 18, 2026
            </p>
          </div>
        </div>

        {/* Academic Prototype Callout */}
        <div className="mb-12 p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex gap-4 items-start">
            <Info className="size-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                Academic Evaluation & Testing Disclosure
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                This Privacy Policy outlines how the iReside development team collects, processes, and protects user data in full compliance with **Republic Act No. 10173 (Data Privacy Act of 2012)**. 
                Please note that all registered landlord and tenant credentials, lease documentation, mock financial transactions, 
                and verification files are captured <strong>strictly for academic testing, defense evaluation, and UX analysis purposes</strong>. 
                No data is sold, commercialized, or shared with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Structured Privacy Content */}
        <div className="space-y-12">
          
          {/* Section 1 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Eye className="size-6 text-primary shrink-0" />
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information to facilitate the simulated property ecosystem and to ensure secure role-based access. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Credentials:</strong> Full name, mock email addresses, hashed passwords, and profile metadata used to differentiate user roles (Landlords, Tenants, and Admins) handled securely via Supabase Auth.</li>
              <li><strong>Simulated Residency Data:</strong> Mock tenant details, lease duration structures, unit specifications, base rent, and utility rules.</li>
              <li><strong>Landlord Verification Assets:</strong> Uploaded business permits, tax declaration documents, or government-issued IDs. **(See Section 3 for strict data minimization rules regarding these assets).**</li>
              <li><strong>Manual Payment Evidence:</strong> Uploaded transaction screenshots (e.g. GCash receipts) used exclusively for manual ledger audit simulation.</li>
              <li><strong>System Interactions:</strong> In-app messages, notices, and dynamic feedback forms stored securely to refine chatbot responses and system performance.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Database className="size-6 text-primary shrink-0" />
              2. Data Processing & Technical Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-grade technical, physical, and organizational security measures to protect captured records:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Database Protection:</strong> Row Level Security (RLS) policies are active on PostgreSQL tables to ensure strict logical separation between properties. Landlords can only query their specific unit/tenant data, and tenants are limited solely to their respective rental accounts.</li>
              <li><strong>Data Encryption:</strong> All passwords and sensitive credentials are encrypted both in transit (using SSL/HTTPS protocols) and at rest within our cloud hosting infrastructure.</li>
              <li><strong>Access Control:</strong> Database and server environment credentials are strictly limited to the development team, our Capstone Advisor, and authorized panel evaluators.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Trash2 className="size-6 text-primary shrink-0" />
              3. Strict Data Minimization Policy (RA 10173)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To guarantee absolute privacy and uphold the core principles of data minimization specified in the Data Privacy Act of 2012:
            </p>
            <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 text-sm text-muted-foreground space-y-2">
              <p className="font-extrabold text-foreground flex items-center gap-2">
                <UserCheck className="size-4 text-warning" /> Immediate Onboarding Deletion
              </p>
              <p>
                All business permits, corporate registration assets, and government IDs uploaded during the Landlord verification/onboarding phase are inspected visually by System Administrators. 
                <strong> Once a landlord's registration is approved or denied, these visual ID/permit files are deleted permanently and immediately from the Supabase Storage Bucket.</strong> No database records or visual images of these credentials are retained.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Share2 className="size-6 text-primary shrink-0" />
              4. Third-Party Sharing & Commercialization
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              iReside operates as an exclusive, academic prototype. 
              <strong> We do not sell, rent, trade, or share any of the information collected with third-party advertising companies, government registries, or commercial organizations.</strong> 
              No tracking cookies or analytics pixels from advertising platforms are embedded anywhere on this website.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Key className="size-6 text-primary shrink-0" />
              5. Your Rights as a Data Subject
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Under the Philippine Data Privacy Act of 2012 (R.A. 10173), all users of iReside are recognized as data subjects and possess the following rights:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Access</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to request a digital copy of all personal credentials and simulated transaction data stored in your active profile.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Correction</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to edit or request updates to any inaccurate or incomplete details inside your portal at any time.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Erasure</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to delete your landlord or tenant profile completely, removing all related records from our databases.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary shrink-0" />
              6. Data Retention & Archival
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Information collected in this prototype will be securely retained for the duration of the Capstone project presentation and defense timeline. 
              Upon official completion of the academic evaluation and research defense, all database tables, user records, storage bucket assets, and server backups will be destroyed permanently and securely by the development team.
            </p>
          </section>
        </div>

        {/* Footer Contact Details */}
        <div className="mt-16 pt-8 border-t border-border/40 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            To exercise your data privacy rights, request account deletion, or contact the Data Protection Officer of this research project:
          </p>
          <div className="flex justify-center gap-6 text-sm text-foreground font-bold">
            <a href="mailto:privacy@ireside.com" className="hover:text-primary hover:underline transition-all">
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