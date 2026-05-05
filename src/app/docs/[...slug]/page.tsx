import React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock content database
const DOCS_CONTENT: Record<string, { title: string; subtitle?: string; content: React.ReactNode; next?: string; prev?: string }> = {
  "getting-started/account-setup": {
    title: "Account Setup",
    subtitle: "Everything you need to know about setting up your iReside account.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Setting up your account on iReside is a straightforward process designed to get you up and running in minutes. Depending on your role, the experience will vary slightly.</p>
        
        <h3>1. Registration</h3>
        <p>Visit the <Link href="/signup">Signup</Link> page and provide your basic information. You can sign up using your email address or through Google SSO.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Pro Tip</p>
          <p className="m-0 text-text-medium italic text-sm">Use your primary email address as it will be used for all critical notifications and official receipts.</p>
        </div>

        <h3>2. Choose Your Role</h3>
        <p>After verifying your email, you&apos;ll be asked to choose between two primary roles:</p>
        <ul>
          <li><strong>Tenant:</strong> Typically joins via a secure invitation link sent by a landlord.</li>
          <li><strong>Landlord:</strong> For property owners and managers looking to digitize their existing portfolio and manage tenancies.</li>
        </ul>

        <h3>3. Profile Completion</h3>
        <p>For tenants, completing your profile is essential to respond to invitations. For landlords, it establishes credibility for your business.</p>
      </div>
    ),
    next: "getting-started/quick-start",
    prev: "",
  },
  "getting-started/quick-start": {
    title: "Quick Start Guide",
    subtitle: "Jump straight into the action with iReside.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Ready to explore iReside? Follow these quick steps to get the most out of the platform from day one.</p>
        
        <h3>If you&apos;re a Tenant:</h3>
        <ol>
          <li><strong>Accept Invite:</strong> Check your email for a secure invitation link from your landlord.</li>
          <li><strong>Verify Identity:</strong> Complete the onboarding to verify your profile.</li>
          <li><strong>Review & Apply:</strong> Review the property details provided in the invite and submit your digital application.</li>
        </ol>

        <h3>If you&apos;re a Landlord:</h3>
        <ol>
          <li><strong>Business Verification:</strong> Complete the mandatory verification to access management tools.</li>
          <li><strong>Add Property:</strong> Setup your property and unit details internally.</li>
          <li><strong>Invite Tenant:</strong> Generate a secure invite link or send an email directly to your prospective tenant.</li>
        </ol>
      </div>
    ),
    next: "tenant/applications",
    prev: "getting-started/account-setup",
  },
  "tenant/applications": {
    title: "Submitting Applications",
    subtitle: "The digital way to apply for your next home.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Applications in iReside are initiated through a landlord invitation. Once you receive an invitation, the application process is entirely digital and secure.</p>
        
        <h3>1. Review Invitation</h3>
        <p>Access the property details through the link provided by your landlord. You can review the unit specifications, rent terms, and house rules.</p>

        <h3>2. Digital Submission</h3>
        <p>Confirm your profile details and submit your application. This includes any necessary background checks or income verifications required for that specific property.</p>

        <h3>3. Real-time Tracking</h3>
        <p>Stay informed as the landlord reviews your application. You&apos;ll receive instant notifications upon approval or requests for further information.</p>
      </div>
    ),
    next: "tenant/payments",
    prev: "getting-started/quick-start",
  },
  "support/faq": {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers to common questions.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h3>Is iReside free to use?</h3>
        <p>For tenants, the platform is free to use when invited by a landlord. Some background check fees may apply depending on the landlord&apos;s requirements. For landlords, we offer various plans tailored to your portfolio size.</p>

        <h3>How do I pay rent?</h3>
        <p>Rent can be paid via bank transfer, credit card, or digital wallets. You can set up recurring payments to ensure you never miss a deadline.</p>

        <h3>Is my data secure?</h3>
        <p>Yes. iReside uses industry-standard encryption and secure verification partners (like Stripe and Plaid) to ensure your sensitive information remains private.</p>
      </div>
    ),
    next: "support/troubleshooting",
    prev: "/docs",
  },
  // Add more pages as needed...
};

export default async function DocDetailPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const doc = DOCS_CONTENT[slugPath];

  if (!doc) {
    notFound();
  }

  // Helper to get titles from slug for navigation
  const getDocTitle = (slug: string) => {
    return DOCS_CONTENT[slug]?.title || "Next Page";
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-high">
          {doc.title}
        </h1>
        {doc.subtitle && (
          <p className="text-xl text-text-medium leading-relaxed max-w-3xl">
            {doc.subtitle}
          </p>
        )}
      </header>

      <div className="border-t border-divider pt-10">
        {doc.content}
      </div>

      {/* Feedback Section */}
      <div className="mt-20 flex flex-col items-center gap-6 rounded-2xl border border-divider bg-surface-1 p-8 text-center">
        <div className="space-y-2">
          <h4 className="text-lg font-bold text-text-high">Was this page helpful?</h4>
          <p className="text-sm text-text-medium">Help us improve our documentation by providing feedback.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-divider hover:border-primary hover:text-primary">
            <ThumbsUp className="h-4 w-4" /> Yes, it was
          </Button>
          <Button variant="outline" className="gap-2 border-divider hover:border-red-500 hover:text-red-500">
            <ThumbsDown className="h-4 w-4" /> Not really
          </Button>
        </div>
      </div>

      {/* Navigation Footer */}
      <footer className="mt-12 flex items-center justify-between border-t border-divider pt-8">
        <div>
          {doc.prev && (
            <Link 
              href={`/docs/${doc.prev}`} 
              className="group flex flex-col items-start gap-1 text-sm transition-colors hover:text-primary"
            >
              <span className="flex items-center gap-1 text-text-disabled group-hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Previous
              </span>
              <span className="text-lg font-bold text-text-high group-hover:text-primary">
                {getDocTitle(doc.prev)}
              </span>
            </Link>
          )}
        </div>
        <div className="text-right">
          {doc.next && (
            <Link 
              href={`/docs/${doc.next}`} 
              className="group flex flex-col items-end gap-1 text-sm transition-colors hover:text-primary"
            >
              <span className="flex items-center gap-1 text-text-disabled group-hover:text-primary">
                Next <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold text-text-high group-hover:text-primary">
                {getDocTitle(doc.next)}
              </span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
