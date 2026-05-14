import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: May 13, 2026
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              iReside ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              property management platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-foreground mt-4">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, and contact information</li>
              <li>Phone number and mailing address</li>
              <li>Date of birth and identification documents</li>
              <li>Financial information (bank details, payment history)</li>
              <li>Employment and income verification data</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-foreground mt-4">2.2 Property Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Property address and description</li>
              <li>Lease agreements and terms</li>
              <li>Maintenance records and communications</li>
              <li>Payment and transaction history</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-4">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information and browser type</li>
              <li>Usage patterns and feature interactions</li>
              <li>IP address and location data</li>
              <li>Cookies and tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage your account</li>
              <li>Process rental applications and verify eligibility</li>
              <li>Facilitate communication between landlords and tenants</li>
              <li>Process rent payments and security deposits</li>
              <li>Send notifications and important updates</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to operate our platform, analyze usage, and personalize 
              your experience. Our cookie categories are:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Essential:</strong> Required for authentication, security, and core functionality</li>
              <li><strong>Analytics:</strong> Help us understand how you use the platform to improve it</li>
              <li><strong>Personalization:</strong> Enable tailored features and recommendations</li>
            </ul>
            <p className="mt-4">
              You can manage your cookie preferences through our cookie consent banner or your account settings.
              Disabling non-essential cookies may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">5. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Landlords:</strong> Tenant application and verification data</li>
              <li><strong>Tenants:</strong> Property information and landlord contact details</li>
              <li><strong>Service Providers:</strong> Payment processors, cloud hosting, and analytics</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect rights</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, including 
              encryption, secure servers, and access controls. However, no method of transmission over the 
              Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your personal information</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:privacy@ireside.com" className="text-primary hover:underline">
                privacy@ireside.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">8. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide 
              services. We may retain certain information for longer periods for legal compliance, dispute 
              resolution, or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">9. Children&apos;s Privacy</h2>
            <p>
              iReside is not intended for users under 18 years of age. We do not knowingly collect 
              personal information from minors. If we learn that we have collected data from a minor, 
              we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">10. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes 
              via email or platform notifications. Continued use of iReside after changes constitutes 
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">12. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or to exercise your rights, contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@ireside.com" className="text-primary hover:underline">
                privacy@ireside.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">13. Cookie Preferences</h2>
            <p>
              You can review and update your cookie preferences at any time through our{" "}
              <Link href="/terms" className="text-primary hover:underline">cookie consent banner</Link> 
              {" "}or by managing your browser settings. Note that disabling certain cookies may affect platform functionality.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}