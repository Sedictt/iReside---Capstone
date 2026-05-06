import React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock content database
const DOCS_CONTENT: Record<string, { title: string; subtitle?: string; content: React.ReactNode; next?: string; prev?: string }> = {
  "getting-started/account-setup": {
    title: "Account Setup",
    subtitle: "Everything you need to know about setting up your iReside account in just a few minutes.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>The account creation process on iReside depends on your role. Landlords create accounts upfront to manage their properties and list units. Tenants, however, have a different workflow. Their accounts are created automatically once their application is approved and they reach an agreement with a landlord.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Are You a Tenant?</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">If you&apos;re applying for a place to rent, you don&apos;t need to complete this account setup. Your landlord will provide you with an application form or invitation link to fill out. Once your application is accepted and you&apos;ve agreed to the lease, your account will be created for you automatically. You can skip directly to the Quick Start guide to learn about the tenant application process.</p>
        </div>

        <h3 id="roles">Getting Started as a Landlord</h3>
        <p>This page walks you through setting up a landlord account so you can manage your properties and invite tenants. If you&apos;re a landlord ready to get started, read on. The setup process is straightforward and takes just a few minutes.</p>

        <h3 id="registration">1. Start Your Registration</h3>
        <p>Next, you&apos;ll provide your basic information. Enter your first and last name along with your email address. You can also sign up through your Google account if you prefer a faster setup.</p>
        <p>Make sure you use an email address that you check regularly because we&apos;ll send important confirmations and updates there.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Pro Tip</p>
          <p className="m-0 text-text-medium italic text-sm">Choose an email address you use often. This is where we&apos;ll send payment confirmations, lease updates, and any important notifications about your account.</p>
        </div>

        <h3 id="email-verification">2. Verify Your Email</h3>
        <p>After you submit your registration, we&apos;ll send a verification email to the address you provided. Check your inbox (and your spam folder just in case) and click the confirmation link. This step ensures that you actually own the email address and helps keep your account secure.</p>
        <p>The verification link will expire after 24 hours, so if you don&apos;t see it right away, just go back and request a new one.</p>

        <h3 id="password">3. Create a Strong Password</h3>
        <p>Next, you&apos;ll create a password that protects your account. Make sure it&apos;s something unique that you don&apos;t use on other websites. A good password includes a mix of uppercase and lowercase letters, numbers, and special characters like exclamation points or dashes.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Security Reminder</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Keep your password private. We&apos;ll never ask you for it in an email or message. If anyone requests your password, it&apos;s a scam.</p>
        </div>

        <h3 id="profile">4. Complete Your Profile</h3>
        <p>Now it&apos;s time to fill in more details about yourself. The information you provide here helps build credibility and trust within the platform. Be honest and thorough in this section.</p>
        
        <h4>For Landlords:</h4>
        <p>Provide details about your property management experience and any relevant certifications. This builds trust with potential tenants and shows that you run a legitimate operation. You may also need to verify your business details and identity during this step.</p>

        <h3 id="photo">5. Add a Profile Photo (Optional)</h3>
        <p>Adding a photo helps personalize your account and builds trust with others on the platform. For landlords, this makes your profile more professional. You can use a professional headshot or a casual photo, whatever you feel comfortable sharing. You can skip this step if you prefer to add it later.</p>

        <h3 id="contact">6. Contact Information</h3>
        <p>Enter your phone number so that other users can reach you if needed. This is particularly important for resolving questions quickly or handling time-sensitive matters.</p>
        <p>You&apos;ll also confirm your preferred method of communication, whether that&apos;s through the iReside app, email, or SMS notifications.</p>

        <h3 id="notifications">7. Set Your Notification Preferences</h3>
        <p>Choose how you&apos;d like iReside to keep you updated. You can decide whether you want email notifications, app notifications, or both. You can always adjust these settings later from your account preferences if your needs change.</p>
        <ul>
          <li><strong>Payment reminders:</strong> Get notified when rent is due</li>
          <li><strong>Messages:</strong> See alerts when a tenant or landlord sends you a message</li>
          <li><strong>Lease updates:</strong> Receive notifications about important lease changes or documents</li>
          <li><strong>Maintenance requests:</strong> Stay in the loop about repairs and property issues</li>
        </ul>

        <h3 id="security">8. Optional Security Settings</h3>
        <p>For extra protection, you can enable two-factor authentication on your account. This adds an additional security layer by requiring a second form of verification (like a code from your phone) whenever you log in from a new device.</p>
        <p>While this is optional, we recommend it, especially if you&apos;re managing properties or handling sensitive documents.</p>

        <h3 id="terms">9. Review and Accept Terms</h3>
        <p>Take a moment to read through our Terms of Service and Privacy Policy. These documents explain how we protect your data and what you can expect from the platform. Once you&apos;re comfortable with everything, check the box to confirm you accept our terms and continue.</p>

        <h3 id="confirmation">10. Confirm and Complete</h3>
        <p>Review your account information one final time to make sure everything looks correct. Once you&apos;re satisfied, click the finish button to activate your account. You&apos;re now officially part of the iReside community.</p>

        <h3 id="next-steps">What Happens Next?</h3>
        <p>After you complete your setup, the next steps depend on your role.</p>
        <p><strong>If you&apos;re a tenant:</strong> Note that as a tenant, you don&apos;t create an account upfront through this process. Instead, a landlord will provide you with a form to fill out, either through an invitation link or based on a face-to-face conversation. You&apos;ll submit your information through that form, go through the application process, and once you reach an agreement with the landlord, they&apos;ll accept you as a tenant. At that point, your account will be created automatically by the system using the information you provided.</p>
        <p><strong>If you&apos;re a landlord:</strong> You&apos;ll go through business verification (this protects everyone on the platform). After that, you can start adding your properties to the system and creating tenant application forms to send to prospective renters.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Important Note for Tenants</p>
          <p className="m-0 text-text-medium italic text-sm">If you&apos;re a tenant, you may not need to manually sign up here. Wait for your landlord to send you an application form or invitation link. Your account will be created for you once your application is approved and you&apos;ve agreed to the lease terms.</p>
        </div>
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
        <p>Ready to explore iReside? Follow these quick steps to get the most out of the platform from day one. The process differs based on whether you&apos;re a tenant or landlord.</p>
        
        <h3 id="tenants">If you&apos;re a Tenant:</h3>
        <p>As a tenant, you don&apos;t need to create an account upfront. Your landlord will guide you through the application process. Here&apos;s what to expect:</p>
        <ol>
          <li><strong>Receive Application Form:</strong> Your landlord will provide you with an application form. This can come through an invitation link they send you, or they may fill it out based on your face-to-face conversation with them.</li>
          <li><strong>Submit Your Information:</strong> Fill out the required information about yourself, including employment status, income, references, and any other details the landlord requests.</li>
          <li><strong>Complete the Application Process:</strong> Follow any additional steps the landlord requires, such as background checks or financial verification.</li>
          <li><strong>Reach an Agreement:</strong> Once your application is reviewed and approved, you&apos;ll negotiate the lease terms with the landlord and reach an agreement.</li>
          <li><strong>Account Created:</strong> Once the landlord accepts you and you&apos;ve agreed to the lease, your account will be automatically created in the system. You can then log in and start using iReside to manage your tenancy.</li>
        </ol>

        <h3 id="landlords">If you&apos;re a Landlord:</h3>
        <p>If you&apos;re a landlord, follow these steps to get your properties set up and start managing tenants:</p>
        <ol>
          <li><strong>Create Your Account:</strong> Sign up on iReside using the account setup process. Choose &quot;Landlord&quot; as your role.</li>
          <li><strong>Business Verification:</strong> Complete the mandatory verification to access all management tools. This protects everyone on the platform and establishes trust.</li>
          <li><strong>Add Your Properties:</strong> Input details about each of your properties and units, including floor plans, rent amounts, and house rules.</li>
          <li><strong>Create Application Forms:</strong> Set up application forms for prospective tenants. You can customize these to request the information you need.</li>
          <li><strong>Invite Tenants:</strong> Send invitation links or application forms to prospective tenants. They&apos;ll complete the form, and you&apos;ll review their applications.</li>
          <li><strong>Review &amp; Accept:</strong> Review submitted applications, conduct any background or financial checks you require, and accept tenants you want to move forward with.</li>
          <li><strong>Manage Your Tenants:</strong> Once you&apos;ve accepted a tenant, their account is created automatically, and you can both use iReside to manage payments, communication, documents, maintenance requests, and more.</li>
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
        
        <h3 id="review">1. Review Invitation</h3>
        <p>Access the property details through the link provided by your landlord. You can review the unit specifications, rent terms, and house rules.</p>

        <h3 id="submission">2. Digital Submission</h3>
        <p>Confirm your profile details and submit your application. This includes any necessary background checks or income verifications required for that specific property.</p>

        <h3 id="tracking">3. Real-time Tracking</h3>
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
