import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="size-4" />
              Back to iReside
            </Button>
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: May 13, 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using iReside, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Description of Service</h2>
            <p>
              iReside is a property management platform that enables landlords to manage properties, 
              list units, and communicate with tenants. The platform also allows tenants to view 
              listings, submit applications, and manage their rental experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. User Accounts</h2>
            <p>
              Landlords must create an account to list properties and manage tenant relationships. 
              Tenants receive accounts automatically upon approved application and lease agreement. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Landlord Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate property information and listings</li>
              <li>Maintain properties in safe and habitable condition</li>
              <li>Comply with all applicable housing laws and regulations</li>
              <li>Handle tenant data and personal information responsibly</li>
              <li>Process security deposits and rent payments through approved methods</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Tenant Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate personal and financial information</li>
              <li>Pay rent on time through the platform or agreed method</li>
              <li>Maintain the property in good condition</li>
              <li>Comply with lease terms and community guidelines</li>
              <li>Report maintenance issues promptly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Fees and Payments</h2>
            <p>
              iReside may charge fees for premium features, transaction processing, or subscription plans. 
              All fees are clearly disclosed before purchase. Refund policies are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Data Privacy</h2>
            <p>
              Your use of iReside is also governed by our Privacy Policy. We collect, store, and process 
              personal data in accordance with applicable privacy laws including GDPR and CCPA. 
              See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Cookie Usage</h2>
            <p>
              We use cookies and similar technologies to power our platform, analyze usage, and personalize 
              your experience. You can manage your cookie preferences through our cookie consent banner.
              Essential cookies are required for platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Limitation of Liability</h2>
            <p>
              iReside is not responsible for the actions of users, the condition of properties, or disputes 
              between landlords and tenants. Our platform serves as a communication and management tool only. 
              We recommend conducting due diligence and seeking professional advice for rental decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, 
              engage in illegal activity, or harm other users. Users may delete their accounts at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">11. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify users of significant changes 
              via email or platform notifications. Continued use of iReside after changes constitutes 
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">12. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@ireside.com" className="text-primary hover:underline">
                legal@ireside.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}