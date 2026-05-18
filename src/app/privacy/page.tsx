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
              Data Privacy Act (R.A. 10173) Compliance Policy · Last updated: May 18, 2026
            </p>
          </div>
        </div>

        {/* Professional Compliance Callout */}
        <div className="mb-12 p-6 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex gap-4 items-start">
            <Info className="size-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                Data Privacy & Security Standard
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                iReside is committed to safeguarding the personal and sensitive data of our landlords and tenants in strict accordance with the **Republic Act No. 10173 (Data Privacy Act of 2012)** of the Philippines. This Privacy Policy details our operational practices regarding data collection, database isolation, structural security, and your legal rights as a data subject.
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
              1. Personal & Sensitive Information Collected
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect only the minimum necessary data to maintain a secure property ecosystem and ensure reliable role-based portal access:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Credentials:</strong> Full name, verified email addresses, contact details, hashed passwords, and system roles (Landlord, Tenant, Admin) managed securely through Supabase Auth.</li>
              <li><strong>Residency Profiles:</strong> Tenant leasing data, active contract timelines, designated unit specifications, base rent, and utility rules.</li>
              <li><strong>Landlord Verification Assets:</strong> Uploaded business permits and government identification submitted solely for visual onboarding verification. **(See Section 3 for strict deletion rules).**</li>
              <li><strong>Manual Payment Assets:</strong> Uploaded transaction screenshot receipts (e.g. GCash receipts) supplied voluntarily to verify monthly billing statements in the ledger.</li>
              <li><strong>System Logs:</strong> In-app messaging exchanges, Community Hub notice board posts, resident polls, and maintenance tickets stored to verify system health.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Database className="size-6 text-primary shrink-0" />
              2. Technical Security & Database Isolation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We enforce high-standard technical and organizational measures to defend user records against unauthorized access:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Row Level Security (RLS):</strong> PostgreSQL database schemas enforce strict logical separation between properties. Landlords can only query their specific property/tenant tables, and tenants are strictly restricted to their own designated tenant profile.</li>
              <li><strong>Secure Transport & Encryption:</strong> All information is transmitted over encrypted HTTPS/SSL layers. Hashed passwords and session tokens are encrypted at rest using validated cloud encryption protocols.</li>
              <li><strong>Limited Administrative Access:</strong> Technical access to databases and storage bucket configurations is restricted strictly to authorized support personnel.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Trash2 className="size-6 text-primary shrink-0" />
              3. Strict Data Minimization Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In adherence to the core principles of data minimization specified in the Data Privacy Act of 2012:
            </p>
            <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 text-sm text-muted-foreground space-y-2">
              <p className="font-extrabold text-foreground flex items-center gap-2">
                <UserCheck className="size-4 text-warning" /> Immediate Onboarding ID Deletion
              </p>
              <p>
                All physical business permits, corporate registration assets, and government IDs uploaded during the Landlord verification/onboarding phase are checked manually by System Administrators. 
                <strong> Once a landlord's registration request is formally approved or denied, these uploaded document files are immediately and permanently deleted from the Supabase Storage Buckets.</strong> No local backups, copies, or database images of these verification assets are retained.
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
              We respect your right to privacy. 
              <strong> iReside does not sell, lease, trade, or share any personal information, transaction receipts, or contact details with third-party marketing firms, commercial brokers, or external analytics networks.</strong> 
              No third-party behavioral tracking or advertising cookies are integrated within our platform.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Key className="size-6 text-primary shrink-0" />
              5. Legal Rights of Data Subjects
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Under R.A. 10173 (Data Privacy Act of 2012), you are recognized as a data subject and hold full legal rights regarding the data you provide to iReside:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Access</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to request a complete record of all personal information and billing histories stored in your active profile.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Rectify</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to update or correct any inaccurate, incomplete, or out-of-date information in your active portal.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/30 bg-muted/20">
                <h4 className="font-bold text-foreground text-sm mb-1">Right to Erasure</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have the right to delete your landlord or tenant profile completely, which will trigger permanent erasure of your personal data from active databases.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm space-y-4 hover:border-border transition-all">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary shrink-0" />
              6. Data Retention Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain account data and operational logs only for the duration that your landlord or tenant account remains active on the platform. If you close your account or request data deletion, all related data will be permanently and securely purged from our active databases and backup files in accordance with DPA 2012 compliance standards.
            </p>
          </section>
        </div>

        {/* Footer Contact Details */}
        <div className="mt-16 pt-8 border-t border-border/40 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            To exercise your data subject rights, report any privacy issues, or contact our Data Protection Officer (DPO):
          </p>
          <div className="flex justify-center gap-6 text-sm text-foreground font-bold">
            <a href="mailto:privacy@ireside.com" className="hover:text-primary hover:underline transition-all">
              privacy@ireside.com
            </a>
            <span>·</span>
            <span>Valenzuela City, Metro Manila</span>
          </div>
        </div>

      </div>
    </div>
  )
}