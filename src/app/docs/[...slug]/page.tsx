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
    subtitle: "Get up and running with iReside in just a few minutes.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Welcome to iReside. Whether you&apos;re renting an apartment or managing properties, this guide will walk you through the basics so you can start using the platform right away. The steps are different depending on whether you&apos;re a tenant or a landlord, so pick the one that applies to you.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">What&apos;s the Difference?</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">A tenant is someone renting a space. A landlord is someone who owns the property and is renting it out. You&apos;ll see different options in the app based on which one you are.</p>
        </div>

        <h3 id="before-you-start">Before You Start</h3>
        <p>Here are a few things that will make the process smoother:</p>
        <ul>
          <li>Have an email address ready that you check regularly</li>
          <li>Keep your phone number handy in case you need to verify your identity</li>
          <li>If you have documents like your ID or lease, have them nearby</li>
          <li>Make sure you&apos;re in a place with a stable internet connection</li>
        </ul>

        <h3 id="how-long">How Long Does This Take?</h3>
        <p>For most people, the entire process takes between 5 to 15 minutes. If you have all your information ready, you can be done even faster.</p>
        
        <h3 id="tenants">Getting Started as a Tenant</h3>
        <p>If you&apos;re looking for a place to rent, here&apos;s what you need to know. The good news is that you don&apos;t have to create an account before you can apply. Your landlord will handle most of the setup for you.</p>

        <h4 id="tenant-step-1">Step 1: Wait for Your Landlord&apos;s Invitation</h4>
        <p>When you&apos;ve found a place you&apos;re interested in, ask the landlord for an application form or invitation link. This is what starts the process. The landlord will send this to you through email or another contact method you&apos;ve arranged with them.</p>

        <h4 id="tenant-step-2">Step 2: Fill Out Your Application</h4>
        <p>Once you get the invitation link or form, click it and you&apos;ll see an application. Fill out everything honestly and completely. This usually includes things like your employment information, how much money you make, references from past landlords or employers, and personal details about yourself.</p>
        <p>Don&apos;t worry if you&apos;re not sure about something. Most landlords are happy to answer questions about what they&apos;re looking for.</p>

        <h4 id="tenant-step-3">Step 3: Submit Any Required Documents</h4>
        <p>The landlord might ask you to upload documents to prove things you&apos;ve written in your application. This could be a pay stub to show your income, a letter from a previous landlord as a reference, or a copy of your ID. The app will let you know exactly what&apos;s needed.</p>

        <h4 id="tenant-step-4">Step 4: Wait for a Response</h4>
        <p>After you submit your application, the landlord will review it. You&apos;ll get notifications in the app as they review your information. Some landlords move quickly, while others might take a few days. Be patient and keep checking your notifications.</p>

        <h4 id="tenant-step-5">Step 5: If Approved, Sign Your Lease</h4>
        <p>If the landlord likes your application, they&apos;ll send you the lease agreement to review. Take time to read through it and make sure you understand all the terms. The rent amount, how long you&apos;re renting, what utilities are included, and rules about pets or guests should all be clear. Once you&apos;re happy with everything, you&apos;ll sign it digitally right in the app.</p>

        <h4 id="tenant-step-6">Step 6: Your Account is Ready</h4>
        <p>After you sign the lease, your account will be created automatically. We&apos;ll send your login credentials to the email address you provided. Check your inbox and any spam folders for a message that contains your temporary username and password.</p>
        <p>You can now log in and access all the tools you need to manage your rental. This is where you&apos;ll pay rent, request repairs if something breaks, message your landlord, view your lease agreement, and access any other important documents.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Important: Change Your Password Right Away</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">The password we send you is temporary and only meant for your first login. As soon as you log in, go to your account settings and create a new password that only you know. This keeps your account secure and protects your personal information. Choose a password that&apos;s different from ones you use elsewhere and includes a mix of letters, numbers, and special characters.</p>
        </div>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Quick Tip for Tenants</p>
          <p className="m-0 text-text-medium text-sm">Don&apos;t create an account on your own before your landlord invites you. Wait for them to send the invitation link. This makes sure everything is set up correctly and your information is stored safely.</p>
        </div>

        <h3 id="landlords">Getting Started as a Landlord</h3>
        <p>If you own properties and want to rent them out through iReside, here&apos;s how to get your account ready and start finding tenants.</p>

        <h4 id="landlord-step-1">Step 1: Sign Up for Your Account</h4>
        <p>Go to the iReside website and click the sign up button. Choose &quot;I&apos;m a landlord&quot; when asked what role you play. You&apos;ll enter your email address, create a password, and give us some basic information about yourself. You can also sign up using your Google account if that&apos;s easier.</p>

        <h4 id="landlord-step-2">Step 2: Verify Your Identity</h4>
        <p>For security and trust, we need to confirm who you are. This is a standard process that protects everyone on the platform. You&apos;ll be asked to provide some identifying information and documents. This might include things like a government ID or proof of your business. Don&apos;t worry, we keep everything secure and private.</p>

        <h4 id="landlord-step-3">Step 3: Add Your Properties</h4>
        <p>Next, you&apos;ll add the properties you want to rent out. For each property, you&apos;ll enter details like the address, how many bedrooms and bathrooms it has, the monthly rent amount, and any special features. You can also add photos and a description to make it more appealing to tenants. If you have multiple units or properties, add them all here.</p>

        <h4 id="landlord-step-4">Step 4: Create Your Application Form</h4>
        <p>Decide what information you need from potential tenants. Do you want to know about their employment? Do you require references from past landlords? The app lets you customize your application form based on what&apos;s important to you. This form is what tenants will fill out when they apply.</p>

        <h4 id="landlord-step-5">Step 5: Find and Invite Tenants</h4>
        <p>When you&apos;re ready to rent out a property, send out application links to people who are interested. You can do this through email or by sharing a link directly. When someone receives your invitation, they&apos;ll fill out your application form.</p>

        <h4 id="landlord-step-6">Step 6: Review Applications and Make Your Decisions</h4>
        <p>As applications come in, you&apos;ll see all the information tenants have provided. You can review their employment details, references, and any documents they&apos;ve uploaded. If you want to do background checks or verify their income, you can do that through iReside. Once you&apos;ve decided on a tenant, you&apos;ll send them the lease to sign.</p>

        <h4 id="landlord-step-7">Step 7: Both Tenants and Landlords Can Manage Everything</h4>
        <p>After the lease is signed, you and your tenant can both use iReside to handle everything going forward. You&apos;ll collect rent payments, your tenant can request repairs or maintenance, you can both communicate through messaging, and all documents stay organized in one place.</p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-green-700 dark:text-green-300 m-0">You&apos;re in Control</p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm">As a landlord, you set the rules. You decide what questions are on your application, who you rent to, and how you want to communicate with your tenants. iReside just gives you the tools to manage it all in one place.</p>
        </div>

        <h3 id="what-comes-next">What Comes Next?</h3>
        <p>Now that you understand the basics, you&apos;re ready to dive deeper. Here are the next steps based on your role:</p>
        <ul>
          <li><strong>Tenants:</strong> Check out the section on submitting your application and what to expect as a renter</li>
          <li><strong>Landlords:</strong> Learn about managing your properties, handling tenant applications, and collecting rent payments</li>
          <li><strong>Everyone:</strong> Explore the platform features to get the most out of iReside</li>
        </ul>

        <h3 id="common-questions">Common Questions to Get Started</h3>
        <p><strong>Do I need to pay anything to use iReside?</strong></p>
        <p>No, iReside is completely free to use for both tenants and landlords right now. Some landlords might charge a small fee for background checks, but that&apos;s between you and them.</p>
        
        <p><strong>Is my information safe?</strong></p>
        <p>Yes. Your information is protected like a locked mailbox. When you send information to iReside, it travels through a secure connection so no one can peek at it in transit. Your account is password-protected, and we store your data on secure servers. We also have safeguards to make sure only you can access your account. If you want extra protection, you can turn on two-factor authentication, which is like having a second lock on your account.</p>
        
        <p><strong>What if I have a problem or get stuck?</strong></p>
        <p>We&apos;re here to help. You can reach out to our support team through the app, and we&apos;ll answer your questions or fix any issues as quickly as possible. Check the support section for more help options and answers to other common questions.</p>

        <p><strong>Can I change my mind after signing?</strong></p>
        <p>That depends on your lease agreement and local laws. We recommend reading your lease carefully before you sign it. If you have questions about your rights or the terms, reach out to our support team or speak with a local housing organization.</p>
      </div>
    ),
    next: "tenant/applications",
    prev: "getting-started/quick-start",
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
        <p>Yes, iReside is completely free for both tenants and landlords. Some background check fees may apply depending on the landlord&apos;s requirements, but those are optional.</p>
 
        <h3>How do I pay rent?</h3>
        <p>Rent can be paid via bank transfer, credit card, or digital wallets. You can set up recurring payments to ensure you never miss a deadline.</p>
 
        <h3>Is my data secure?</h3>
        <p>Yes. Think of iReside like a bank for your rental information. Your data is protected by locks and safeguards so only you can see it. Your password keeps your account private, and we make sure your information stays safe on our servers. You can also add an extra layer of protection by turning on two-factor authentication if you&apos;d like.</p>
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
