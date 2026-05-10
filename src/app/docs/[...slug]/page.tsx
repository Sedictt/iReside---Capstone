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
    prev: "getting-started/account-setup",
  },
  "tenant/applications": {
    title: "Submitting Your Application",
    subtitle: "How to complete your rental application and get one step closer to your new home.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>When you find a place you like, the landlord will have you complete an application. There are two main ways this can happen. Either the landlord sends you an invitation link to apply online from home, or you meet with them in person where they may fill out the form themselves or you fill it out and then present your documents. In either case, you&apos;ll fill out information about yourself and provide documents to prove what you&apos;ve said. Let&apos;s walk you through both methods so you know what to expect.</p>
        
        <h3 id="two-ways-to-apply">Two Ways to Apply</h3>
        <p>Here are the main differences between the two application methods:</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Method 1: Online Application (No Meeting)</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">The landlord sends you an invitation link. You fill out all your information online, upload your documents, and submit everything remotely. Everything is done from home at your own pace, and you never need to meet the landlord in person.</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Method 2: Face-to-Face Application (In Person)</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Either the landlord fills out the application form with you in person, or you fill it out online and then meet them to show your physical documents. Documents are verified in person by the landlord before the application can move forward.</p>
        </div>

        <h3 id="before-applying">Before You Start Your Application</h3>
        <p>Have these things ready so you can fill out your application smoothly without stopping:</p>
        <ul>
          <li>Your full legal name exactly as it appears on your ID</li>
          <li>Your email address and phone number</li>
          <li>Information about your current or most recent job like your job title, employer name, and how much you make each month</li>
          <li>The name and phone number of someone to contact in case of emergency</li>
          <li>The date when you plan to move in</li>
          <li>Any documents the landlord asked for like pay stubs, ID, or letters from previous landlords</li>
        </ul>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Document Checklist</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Most landlords ask for proof of income (like a pay stub), a valid ID, and references from previous landlords. Check with your landlord to see what they need. If you&apos;re meeting in person, bring original documents or clear copies. If you&apos;re applying online, you&apos;ll scan or photograph them before uploading.</p>
        </div>

        <h3 id="method-1-online">Method 1: Online Application (Remote)</h3>
        
        <h4 id="online-step-1">Step 1: Find Your Invitation Link</h4>
        <p>The landlord will send you an email with a special link to their application form. This link is unique to you and the property you&apos;re interested in. Check your email inbox and look for a message from the landlord. If you don&apos;t see it right away, check your spam or junk folder. The email should have clear instructions on how to proceed. If you can&apos;t find it, ask the landlord to send it again.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">What is an Invitation Link?</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">This is a special link that the landlord creates just for you. It takes you directly to the application form for that specific property. Don&apos;t share this link with anyone else because it&apos;s meant just for you.</p>
        </div>

        <h4 id="online-step-2">Step 2: Fill Out Your Information</h4>
        <p>Click the link to start your application. You don&apos;t need to create a new account or password yet. Just start answering the questions. Take your time and answer everything honestly and completely. Being thorough now helps the landlord make a decision faster.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Tip: Be Accurate</p>
          <p className="m-0 text-text-medium text-sm">Make sure all the information you enter is correct, especially your name, contact details, and income. Mistakes here can cause delays or problems later on.</p>
        </div>

        <h4 id="online-step-3">Step 3: Upload Your Documents</h4>
        <p>The landlord will ask you to provide documents to back up what you said in your application. You&apos;ll upload clear, readable copies of your documents right through the form. This might include a recent pay stub to show your income, a valid ID like a driver&apos;s license, and letters or contact information for previous landlords as references. Make sure each document is clear and easy to read. If something is blurry or cut off, the landlord might ask you to upload it again.</p>

        <h4 id="online-step-4">Step 4: Review and Submit</h4>
        <p>Before you submit, look everything over carefully. Check that your information is spelled correctly, all required fields are filled in, and your documents are clear. Once you&apos;re satisfied, click submit. You&apos;ll see a confirmation that your application was received, and you can usually print or save this as proof.</p>

        <h3 id="method-2-factoface">Method 2: Face-to-Face Application (In Person)</h3>
        
        <h4 id="factoface-option-a">Option A: Landlord Fills Out the Form</h4>
        <p>The landlord will meet with you and fill out the application form themselves. You&apos;ll tell them your information, and they&apos;ll enter it into the system. During this meeting, if you&apos;re bringing documents like pay stubs or references, the landlord will verify them in person. This way, everything is recorded right away, and you don&apos;t have to worry about uploading documents digitally. The landlord will typically mark off a checklist showing which documents they&apos;ve seen and verified.</p>

        <h4 id="factoface-option-b">Option B: You Fill Out, Then Meet</h4>
        <p>The landlord sends you an invitation link just like the online method. You fill out your information and submit the form online. Then you schedule a time to meet the landlord in person to show your documents. During the meeting, the landlord will look at your actual documents (not just scanned copies), verify them, and mark them off in the checklist. This approach combines the convenience of online form-filling with the security of in-person document verification.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">What to Bring to Your In-Person Meeting</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Bring original documents or clear, readable copies. For income proof, bring recent pay stubs or bank statements. For ID, bring your actual driver&apos;s license, passport, or national ID. If you have letters from previous landlords, bring those too. The landlord will look at the originals to make sure they&apos;re real, then record that they&apos;ve been verified in the system.</p>
        </div>

        <h3 id="what-information">What Information the Landlord Will Ask For</h3>
        <p>Regardless of which method you use, the landlord will collect similar information about you:</p>
        
        <h4>Your Basic Information</h4>
        <p>Your full legal name, email address, and phone number. Make sure these are correct because the landlord will use this information to contact you with their decision.</p>
        
        <h4>Your Move-In Date</h4>
        <p>When you plan to move in. Be realistic and honest about the date. If you&apos;re flexible, let the landlord know.</p>
        
        <h4>Your Job and Income</h4>
        <p>Your job title, who you work for, and how much you make each month before taxes. This helps the landlord understand if you can afford the rent.</p>
        
        <h4>Your Emergency Contact</h4>
        <p>A name and phone number for someone the landlord can reach if needed. This is usually a family member or close friend, not your employer.</p>
        
        <h4>Optional Notes</h4>
        <p>Some landlords give you space to write a short message about yourself. You can use this to explain your situation or share anything that would help your application. Keep it short and professional, and focus on being a good tenant.</p>

        <h3 id="documents-explained">Understanding the Documents</h3>
        
        <h4>Proof of Income</h4>
        <p>Usually a recent pay stub from your job showing your earnings. If you&apos;re self-employed, you might provide bank statements or tax records instead. Make sure it&apos;s recent (from the last month or two) so the landlord can see you&apos;re currently earning that income.</p>
        
        <h4>Valid ID</h4>
        <p>A government-issued ID like a driver&apos;s license, passport, or national ID card. This confirms you are who you say you are. Make sure the copy or original is clear and easy to read.</p>
        
        <h4>References</h4>
        <p>Letters from previous landlords or employers confirming that you&apos;re a good tenant or employee. If you don&apos;t have written letters, you can provide contact information for people who can vouch for you, and the landlord might call them directly.</p>
        
        <h4>Additional Documents</h4>
        <p>Depending on what the landlord needs, they might ask for other things. Whatever they ask for, do your best to provide it. Showing you&apos;re willing to cooperate and provide proof of what you&apos;ve said makes your application stronger.</p>

        <h3 id="after-submitting">After You Submit Your Application</h3>
        <p>Now comes the waiting part. Different landlords take different amounts of time to review applications. Some might get back to you in a day or two, while others might take a week or longer.</p>
        
        <h4>What Happens Next</h4>
        <p>The landlord will review all the information and documents you provided. They&apos;ll look at your income to see if you can afford the rent, check your job history, and possibly call or contact your previous landlords to ask about you. You might get updates through the iReside app or by email as the landlord reviews your application.</p>
        
        <h4>If the Landlord Needs More Information</h4>
        <p>Sometimes the landlord might ask for something else. Maybe they want a clearer copy of a document or have a question about something you wrote. They&apos;ll contact you and let you know what they need. Try to provide it quickly so there&apos;s no delay.</p>
        
        <h4>If Your Application is Approved</h4>
        <p>Congratulations! The landlord will send you the lease agreement to review. This is the legal document that spells out all the terms of your rental, including the rent amount, start date, how long the lease lasts, what utilities are included, and any rules about pets or guests. Take time to read it carefully before you sign it. If you have questions about anything, ask the landlord before you commit.</p>
        
        <h4>If Your Application is Not Approved</h4>
        <p>If the landlord chooses a different applicant, they&apos;ll let you know. They&apos;re not always required to explain why, but if they do give you feedback, listen to it. It might help you with future applications. Don&apos;t give up. There are many properties and many landlords out there.</p>

        <h3 id="common-questions">Common Questions About Applying</h3>
        <p><strong>Can I apply to multiple properties at once?</strong></p>
        <p>Yes. There&apos;s no rule against applying to multiple places. This actually makes sense because you never know which landlord will accept your application. Just be realistic about managing multiple applications if several landlords accept you at the same time.</p>
        
        <p><strong>What if I don&apos;t have all the documents the landlord asked for?</strong></p>
        <p>Provide what you have and explain what&apos;s missing if possible. A landlord might be flexible, especially if you have a good reason. For example, if you&apos;re new to the job or just moved to the country, the landlord might understand that you don&apos;t have all the typical documents yet.</p>
        
        <p><strong>How long does it take to hear back?</strong></p>
        <p>This varies a lot. Some landlords review applications within a day or two. Others might take a week or more. If you haven&apos;t heard anything after a week, it&apos;s okay to politely ask for a status update.</p>
        
        <p><strong>Can I edit my application after I submit it?</strong></p>
        <p>Once you submit, you usually can&apos;t change it. That&apos;s why it&apos;s important to review everything before clicking submit. If you need to correct something or provide new information, contact the landlord directly and explain what happened.</p>
        
        <p><strong>Is it okay to ask someone to help me fill out the application?</strong></p>
        <p>Yes. If you need help understanding the questions or filling out the form, it&apos;s fine to ask someone you trust to help. Just make sure all the information you provide is true. Never lie on an application.</p>
        
        <p><strong>What&apos;s the difference between the two application methods?</strong></p>
        <p>The main difference is timing and who enters the information. With online applications, you fill everything out yourself and upload documents digitally. With face-to-face applications, either the landlord fills it out while you&apos;re there, or you fill it out online and then meet in person with the physical documents. Both methods cover the same information, so just follow whatever the landlord asks for.</p>

        <h3 id="tips-for-success">Tips to Help Your Application Stand Out</h3>
        <ul>
          <li>Answer every question the landlord asks. Leaving things blank makes it look like you&apos;re not interested or not paying attention.</li>
          <li>Be honest about everything. Landlords often respect honesty more than if they find out you lied later.</li>
          <li>Provide all the documents you can, even if the landlord didn&apos;t ask for them. Extra proof of income or a character reference can help your chances.</li>
          <li>Use the notes section to tell your story. Explain any gaps in your work history or anything else that stands out. Give context so the landlord understands your situation.</li>
          <li>Make sure your contact information is correct. Check your phone and email often during the application process so you don&apos;t miss messages from the landlord.</li>
          <li>Apply early. The sooner you apply, the sooner the landlord can consider you.</li>
          <li>Respect the landlord&apos;s timeline. Give them reasonable time to review applications. After about a week, it&apos;s fine to politely check in.</li>
        </ul>
      </div>
    ),
    next: "tenant/payments",
    prev: "getting-started/quick-start",
  },
  "tenant/payments": {
    title: "Paying Your Rent",
    subtitle: "How to settle your invoices via GCash or Cash and track your payment history.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>iReside simplifies rent collection by providing a direct channel between you and your landlord. All payments are handled manually through the platform to ensure security and transparency. Currently, iReside supports two primary payment methods: GCash and Cash/In-Person settlement.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">No Automatic Deductions</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">iReside does not automatically deduct money from your bank account or wallet. You must manually initiate each payment and provide proof of the transaction for your landlord to verify.</p>
        </div>

        <h3 id="gcash">1. Paying via GCash (E-Wallet)</h3>
        <p>GCash is the most common way to pay rent on iReside. It involves an indirect integration where you send money directly to your landlord&apos;s GCash account and then record the transaction in the system.</p>
        
        <h4>How it works:</h4>
        <ol>
          <li><strong>Access the Checkout Hub:</strong> Go to your Payments dashboard and click &quot;Pay Now&quot; on a pending invoice.</li>
          <li><strong>View Landlord Details:</strong> Select &quot;GCash Wallet&quot; as your method. You will see your landlord&apos;s GCash Account Name, Mobile Number, and often a QR Code.</li>
          <li><strong>Transfer Funds:</strong> Open your GCash app and send the exact amount due to the landlord&apos;s number or scan their QR code.</li>
          <li><strong>Save Your Receipt:</strong> Take a screenshot of the successful transaction receipt in the GCash app.</li>
          <li><strong>Submit Proof:</strong> Back in iReside, enter the <strong>13-digit GCash Reference Number</strong> and upload the screenshot you just took.</li>
        </ol>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Why the Reference Number Matters</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">The 13-digit reference number allows your landlord to quickly reconcile the payment in their own GCash transaction history. Always double-check this number before submitting.</p>
        </div>

        <h3 id="cash">2. Paying via Cash (In-Person)</h3>
        <p>If you prefer to pay in person, you can use the &quot;Cash / In-Person&quot; option. This is common for tenants who live in the same building as their landlord or building manager.</p>

        <h4>How it works:</h4>
        <ol>
          <li><strong>Trigger Intent:</strong> In the Checkout Hub, select &quot;Cash / In-Person&quot;. Click the &quot;Notify Landlord of Payment&quot; button. This lets your landlord know you are ready to pay.</li>
          <li><strong>Meet and Pay:</strong> Meet your landlord or manager in person to hand over the cash payment.</li>
          <li><strong>Landlord Confirmation:</strong> After receiving the cash, your landlord will log into their dashboard and manually confirm the receipt.</li>
          <li><strong>Instant Receipt:</strong> Once the landlord confirms, the invoice status will instantly change to &quot;Paid&quot; and you will receive a digital receipt in the app.</li>
        </ol>

        <h3 id="verification">Payment Verification Process</h3>
        <p>Once you submit a payment (either GCash proof or Cash intent), the invoice status will move to <strong>&quot;Under Review&quot;</strong> or <strong>&quot;Awaiting Confirmation&quot;</strong>.</p>
        <ul>
          <li><strong>GCash Review:</strong> Your landlord will check the uploaded screenshot and reference number against their GCash records.</li>
          <li><strong>Cash Review:</strong> The status remains pending until the physical exchange of money is confirmed by the landlord.</li>
        </ul>
        <p>If there is an issue (e.g., wrong amount or unreadable receipt), your landlord may reject the proof. You will receive a notification explaining the reason and can resubmit the correct information.</p>

        <h3 id="partial-payments">Partial Payments</h3>
        <p>If your landlord allows it, you can make partial payments toward an invoice. This is helpful for splitting rent into multiple installments. You will follow the same proof-of-payment workflow for each installment until the balance reaches zero.</p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-green-700 dark:text-green-300 m-0">Payment History & Receipts</p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm">Every confirmed payment generates a professional digital receipt that you can view or download at any time from your Payment History. These serve as your official proof of payment for the duration of your lease.</p>
        </div>

        <h3 id="audit-trail">The Audit Trail & Platform Verification</h3>
        <p>Every interaction related to your payment is logged and stored securely within iReside. This creates a centralized, platform-verified history that helps eliminate the record-keeping gaps or misunderstandings that can occur with off-platform transfers.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Verified Record Keeping</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">By using iReside to record your GCash or Cash payments, both you and your landlord benefit from a synchronized ledger. Every status change is timestamped and linked to the specific account that performed the action, ensuring your payment history is always clear and accessible.</p>
        </div>

        <p>The audit trail captures the following events:</p>
        <ul>
          <li><strong>Exact Time of Submission:</strong> When you uploaded your proof or triggered your cash intent.</li>
          <li><strong>Landlord Review Logs:</strong> When the landlord opened your proof and whether they confirmed or rejected it.</li>
          <li><strong>Digital Receipt Issuance:</strong> The moment your payment was officially receipted by the platform.</li>
          <li><strong>Modification History:</strong> Any adjustments made to the balance (e.g., in the case of overpayments or partial payments).</li>
        </ul>

        <h3 id="security">Security Reminders</h3>
        <ul>
          <li><strong>Only pay to verified accounts:</strong> Only use the GCash details provided within the secure iReside Checkout Hub.</li>
          <li><strong>Always keep screenshots:</strong> Even after the landlord confirms, it&apos;s good practice to keep your GCash receipts for a few months.</li>
          <li><strong>Communicate:</strong> If a payment will be late, use the built-in Messaging system to inform your landlord ahead of time.</li>
        </ul>
      </div>
    ),
    next: "tenant/maintenance",
    prev: "tenant/applications",
  },
  "tenant/maintenance": {
    title: "Maintenance Requests",
    subtitle: "How to report issues, track repairs, and work with your landlord to keep your home in good condition.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Living in a rental property means things sometimes need fixing. A leaky faucet, a broken appliance, or an issue with the heating system - whatever the problem, iReside makes it simple to report maintenance issues and track their progress from start to finish. You can submit requests, upload photos as proof, and even handle minor repairs yourself if your landlord approves.</p>

        <h3 id="overview">What is a Maintenance Request?</h3>
        <p>A maintenance request is your way of telling your landlord that something in your home needs attention. Instead of calling, texting, or trying to catch your landlord in person, you can submit a request through iReside. Your landlord will see it right away, and both of you can track what's being done about it. This creates a clear record that both of you can access anytime.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Why Use Maintenance Requests?</p>
          <p className="m-0 text-text-medium text-sm">Using iReside to report maintenance keeps everything organized. Your landlord gets your request immediately, you both have a record of what was reported and when, and you can see the status of repairs in real time. This helps prevent misunderstandings and makes sure problems get addressed promptly.</p>
        </div>

        <h3 id="types-of-issues">What Issues Should You Report?</h3>
        <p>Report any problem in your home that your landlord is responsible for fixing. This includes:</p>
        <ul>
          <li><strong>Plumbing issues:</strong> Leaks, dripping faucets, running toilets, clogged drains, or no water pressure</li>
          <li><strong>Electrical problems:</strong> Outlets not working, flickering lights, or tripped breakers</li>
          <li><strong>Heating and cooling:</strong> Air conditioning not working, heat not turning on, or temperature control problems</li>
          <li><strong>Appliance breakdowns:</strong> Stove, refrigerator, oven, or other built-in appliances not working</li>
          <li><strong>Structural issues:</strong> Cracks in walls, roof leaks, broken windows, or door problems</li>
          <li><strong>Pest problems:</strong> Bugs, rodents, or other unwanted creatures</li>
          <li><strong>Other repairs:</strong> Anything else that needs professional attention</li>
        </ul>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Important: Emergency Issues</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">If you have an emergency - like a gas leak, fire, electrical hazard, burst pipe, or break-in - don't wait to use iReside. Call emergency services immediately (911 in most places). Report the issue in the app after you've ensured your safety. Include emergency details in your description so your landlord knows what happened.</p>
        </div>

        <h3 id="when-not-to-report">When NOT to Submit a Request</h3>
        <p>Some things are your responsibility as a tenant, not the landlord's. Don't submit maintenance requests for:</p>
        <ul>
          <li>Regular cleaning or tidying up</li>
          <li>Issues caused by your own actions or negligence</li>
          <li>Personal items or furniture you brought into the home</li>
          <li>Damage you caused intentionally</li>
        </ul>
        <p>If you're unsure whether something is your responsibility, it's okay to ask your landlord. It's better to ask than to assume.</p>

        <h3 id="how-to-submit">How to Submit a Maintenance Request</h3>
        <p>The process is straightforward and takes just a few minutes.</p>

        <h4 id="step-1">Step 1: Access the Maintenance Section</h4>
        <p>Log into your iReside account and go to the <strong>Maintenance</strong> section of your dashboard. This is usually in the main menu. You'll see a list of any previous maintenance requests you've submitted, along with their current status.</p>

        <h4 id="step-2">Step 2: Create a New Request</h4>
        <p>Click the <strong>New Request</strong> or <strong>+</strong> button to start creating a new maintenance request. This will open a form where you'll provide details about the problem.</p>

        <h4 id="step-3">Step 3: Describe the Issue</h4>
        <p>Give your request a clear, short title that describes the problem. For example: "Leaky kitchen faucet," "Air conditioner not cooling," or "Broken bathroom door lock." Keep the title simple so your landlord knows immediately what the issue is.</p>
        <p>Then write a more detailed description explaining what's wrong. Be specific. Instead of just saying "Something is broken," explain: Where is the problem? When did you first notice it? What exactly is happening? Is it getting worse? For example: "The kitchen sink faucet has been dripping constantly for three days. It drips about once per second even when turned off completely."</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Pro Tip: Be Detailed</p>
          <p className="m-0 text-text-medium text-sm">The more details you provide, the faster your landlord can respond. Include information like when the problem started, whether it's getting worse, and how it's affecting you. If you've already tried any fixes, mention that too.</p>
        </div>

        <h4 id="step-4">Step 4: Select a Category</h4>
        <p>Choose which type of issue you're reporting from the available categories. The system offers options like Plumbing, Electrical, HVAC, Appliances, Structural, Pest, and Other. Selecting the right category helps your landlord prioritize and route the request to the right person if they use a contractor.</p>

        <h4 id="step-5">Step 5: Add Photos or Videos</h4>
        <p>This is optional but highly recommended. If you can safely photograph or video the problem, do it. A picture is worth a thousand words and helps your landlord understand exactly what's happening. You can take multiple photos (up to 5) to show different angles or details.</p>
        <p>To add photos, click the upload area and select images from your phone or computer. You can drag and drop images, or click to browse your files. Make sure the images are clear and show the problem well. If a photo is blurry or too dark, try retaking it.</p>

        <h4 id="step-6">Step 6: Set a Priority Level</h4>
        <p>Indicate how urgent the issue is. Your options are typically Low, Medium, High, or Urgent. Be honest about the priority:</p>
        <ul>
          <li><strong>Low:</strong> Minor issues that don't affect daily life - like a small scratch on a wall or a cabinet that doesn't close perfectly</li>
          <li><strong>Medium:</strong> Issues that are inconvenient but not urgent - like a bathroom light that flickers occasionally</li>
          <li><strong>High:</strong> Issues that seriously affect your comfort or safety - like heating not working in winter or multiple outlets not working</li>
          <li><strong>Urgent:</strong> Critical issues that need immediate attention - like no water, gas smell, electrical hazard, or roof leak</li>
        </ul>

        <h4 id="step-7">Step 7: Submit Your Request</h4>
        <p>Once you've filled in all the details, click <strong>Submit Request</strong>. The system will confirm that your request has been sent to your landlord. You'll see a confirmation message, and you can now track the status of your request.</p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-green-700 dark:text-green-300 m-0">Confirmation & Notifications</p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm">After you submit, you'll receive a confirmation in the app. Your landlord will be notified right away. You can check your notification settings to decide whether you want email or app alerts about your request's progress.</p>
        </div>

        <h3 id="self-repair-option">Handling Minor Repairs Yourself</h3>
        <p>Sometimes the best solution for a small problem is to fix it yourself. iReside allows you to ask your landlord for permission to handle minor repairs on your own. This can be faster than waiting for someone else to come out, and it shows initiative.</p>

        <h4 id="self-repair-when">When Might Self-Repair Work?</h4>
        <p>Self-repair is best for simple, low-risk issues like:</p>
        <ul>
          <li>Fixing a leaky faucet or toilet by replacing a part</li>
          <li>Resetting a circuit breaker</li>
          <li>Patching a small hole in drywall</li>
          <li>Cleaning out a clogged drain</li>
          <li>Replacing a light bulb or battery in a smoke detector</li>
        </ul>
        <p>However, you should NOT attempt self-repair for complex issues like major plumbing, electrical work, roof repairs, or structural problems. These need professional expertise.</p>

        <h4 id="how-to-request-self-repair">How to Request Permission for Self-Repair</h4>
        <p>When you submit your maintenance request, there's an option to say "I'd like to fix this myself if you approve." Toggle this option on. In your description, explain what you plan to do and why you think it's something you can handle safely. For example: "The bathroom sink drain is clogged. I have a drain snake and think I can clear it myself."</p>
        <p>Your landlord will review your request and either approve or decline. If they approve, you'll get instructions on what to do. If they decline, they'll arrange for a professional to handle it instead.</p>

        <h4 id="self-repair-process">What Happens if Your Landlord Approves?</h4>
        <p>Once approved, you can proceed with the repair. As you're working, the status will show your progress (repairing, done). When you've finished, you'll update the status to "Done" and potentially upload photos showing the completed repair so your landlord can verify everything is fixed.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Self-Repair Responsibility</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">If you attempt a repair and make it worse, you may be responsible for the damage. Only try repairs you're confident you can do safely. If something goes wrong during a landlord-approved self-repair, let your landlord know immediately and submit a new request to have a professional fix it.</p>
        </div>

        <h3 id="tracking-status">Tracking Your Maintenance Request</h3>
        <p>After you submit your request, you can always check its status in the Maintenance section.</p>

        <h4 id="status-meanings">Understanding Status Updates</h4>
        <p>Your request will move through different statuses as it's handled:</p>
        <ul>
          <li><strong>Submitted:</strong> Your request has been received and sent to your landlord. They'll review it soon.</li>
          <li><strong>Under Review:</strong> Your landlord is looking at your request and deciding how to proceed.</li>
          <li><strong>Assigned:</strong> Your landlord has decided how the repair will be handled - either they'll do it, a contractor will handle it, or you'll fix it yourself.</li>
          <li><strong>In Progress:</strong> The repair work is currently being done. Either a professional is working on it or you're handling it yourself.</li>
          <li><strong>Resolved:</strong> The repair is complete. Your landlord has confirmed that the problem has been fixed.</li>
          <li><strong>Closed:</strong> The request is fully done and archived in your history.</li>
        </ul>

        <h4 id="when-to-expect-updates">How Long Does It Take?</h4>
        <p>Response times vary depending on the issue and your landlord's availability:</p>
        <ul>
          <li><strong>Emergency issues (unsafe):</strong> Usually addressed within 24 hours</li>
          <li><strong>Important issues (affects comfort):</strong> Usually addressed within 2-7 days</li>
          <li><strong>Minor issues:</strong> May take 1-2 weeks</li>
        </ul>
        <p>Your lease agreement might specify response times, so check that if you want to know what's expected. If a significant amount of time has passed and you haven't heard anything, you can check in with your landlord through the messaging feature in iReside.</p>

        <h4 id="photo-requests">Photo Verification</h4>
        <p>Sometimes your landlord might ask you to provide photos showing that the repair is complete. For example, if you do a self-repair or if a contractor completes work, your landlord might ask for photos to verify the job was done well. You'll upload these right in the app, and your landlord will review them to confirm everything is satisfactory.</p>

        <h3 id="communication">Communicating About Your Requests</h3>
        <p>Throughout the maintenance process, you might need to share information or ask questions. iReside has built-in messaging so you can communicate directly with your landlord right within the app.</p>
        <ul>
          <li>If your landlord needs more details, they might message you asking clarifying questions</li>
          <li>If you think of additional information after submitting, you can add it through messages</li>
          <li>If something changes about your availability (you can't be home during repairs, for example), let your landlord know through messages</li>
          <li>All messages are tied to your specific maintenance request, so everything is organized together</li>
        </ul>

        <h3 id="request-history">Viewing Your Request History</h3>
        <p>All your maintenance requests - past and present - are stored in your Maintenance section. You can view details of any request anytime: what was reported, when, what the issue was, and how it was resolved. This is helpful if you need to remember when something was fixed (useful for your own records) or if a similar problem comes up again.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Complete Record</p>
          <p className="m-0 text-text-medium text-sm">Your maintenance history in iReside serves as a documented record of what repairs have been done to the property. This is useful if there are ever disputes about the condition of your home when you move out.</p>
        </div>

        <h3 id="common-questions">Common Questions About Maintenance Requests</h3>
        
        <p><strong>What if my landlord ignores my maintenance request?</strong></p>
        <p>If your landlord doesn't respond within a reasonable timeframe (check your lease for specifics), you can try messaging them through the app as a reminder. If the issue is urgent or affects your health and safety, you may have legal rights to have it repaired yourself and deduct costs from rent, depending on your location's rental laws. Contact your local tenant rights organization or legal advice if you're in this situation.</p>
        
        <p><strong>Can I submit multiple maintenance requests at once?</strong></p>
        <p>Yes, you can submit multiple requests if you have multiple issues. However, it's often better to group related issues into one request if possible (for example, "Multiple outlets not working in the kitchen"). This helps your landlord prioritize their work.</p>
        
        <p><strong>What if I take a photo and the issue isn't visible?</strong></p>
        <p>That's okay. Some problems (like strange noises, water pressure issues, or intermittent problems) aren't easy to photograph. Just describe what you're experiencing in detail, and your landlord will understand. Take a photo of the area if you can, or include anything that might help - like a photo of a control panel or a specific fixture.</p>
        
        <p><strong>Can I request repairs after I move out?</strong></p>
        <p>Once you've moved out, maintenance requests won't be necessary - those become the responsibility of the new tenant or the landlord. However, if the damage existed while you lived there and wasn't fixed, you might need documentation. This is why keeping a record of your maintenance requests is important.</p>
        
        <p><strong>What if I accidentally submit a request for something that's actually my responsibility?</strong></p>
        <p>Just let your landlord know through a message or by contacting them directly. There's no penalty for asking. It's better to ask and be told it's your responsibility than to let something deteriorate because you weren't sure.</p>
        
        <p><strong>Can I cancel a maintenance request after submitting it?</strong></p>
        <p>Contact your landlord through messages and explain that you'd like to cancel the request. Most landlords are understanding about this, especially if you catch it quickly before they've started arranging repairs.</p>

        <h3 id="tips-for-success">Tips for Getting Your Issues Fixed Quickly</h3>
        <ul>
          <li><strong>Report issues promptly:</strong> Don't wait until something gets worse. The sooner you report it, the sooner it can be fixed.</li>
          <li><strong>Be specific:</strong> The more details you provide, the faster your landlord can respond. Don't just say something is "broken" - explain what it's doing that's wrong.</li>
          <li><strong>Include photos:</strong> A clear photo helps your landlord assess the situation without needing to come investigate first.</li>
          <li><strong>Set the right priority:</strong> Be honest about how urgent the issue is. This helps your landlord manage their time and respond to the most critical issues first.</li>
          <li><strong>Respond quickly to landlord questions:</strong> If your landlord needs more information or wants to schedule repairs, respond promptly so things can move forward.</li>
          <li><strong>Keep communication in the app:</strong> Use iReside messaging for discussions about the request so there's a record of everything.</li>
          <li><strong>Accept reasonable response times:</strong> Understanding that your landlord might not be available immediately helps set realistic expectations.</li>
        </ul>
      </div>
    ),
    next: "tenant/lease",
    prev: "tenant/payments",
  },
  "tenant/lease": {
    title: "Lease & Documents",
    subtitle: "Access your rental agreements and important documents anytime.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Your lease agreement is the foundation of your rental relationship with your landlord. It outlines your rights and responsibilities, the monthly rent amount, when the lease begins and ends, house rules, and any special agreements between you and your landlord. iReside keeps your lease and all related documents organized in one secure place so you can always find and reference them whenever you need.</p>

        <h3 id="what-is-a-lease">What is a Lease?</h3>
        <p>A lease is a legal contract between you (the tenant) and your landlord. It specifies the terms under which you rent the property. Think of it as an agreement that protects both you and your landlord. Your lease typically includes:</p>
        <ul>
          <li><strong>Property address:</strong> The exact location you are renting</li>
          <li><strong>Lease dates:</strong> When your lease starts and when it ends</li>
          <li><strong>Monthly rent amount:</strong> How much you pay each month</li>
          <li><strong>Rent due date:</strong> What day of the month rent is due</li>
          <li><strong>Security deposit amount:</strong> Money you provide upfront as protection for the landlord</li>
          <li><strong>Utilities and services:</strong> Which utilities you pay for and which the landlord covers</li>
          <li><strong>House rules:</strong> Rules about noise, guests, pets, smoking, and other conduct</li>
          <li><strong>Maintenance responsibilities:</strong> Who is responsible for what repairs</li>
          <li><strong>Lease termination conditions:</strong> How and when either party can end the lease</li>
          <li><strong>Special agreements:</strong> Any unique arrangements between you and your landlord</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Legally Binding Agreement</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Your lease is a legally binding contract. Both you and your landlord are expected to follow all terms. If either party violates the lease, there can be legal consequences. Make sure you understand and agree with all terms before signing.</p>
        </div>

        <h3 id="accessing-documents">Accessing Your Documents</h3>
        <p>All your rental documents are stored in the Lease & Documents section of iReside. To access them:</p>
        <ol>
          <li>Log into your iReside account</li>
          <li>Navigate to the Lease & Documents section from your dashboard</li>
          <li>You will see a list of all documents related to your rental, organized by type</li>
          <li>Click on any document to view, download, or print it</li>
        </ol>
        <p>Documents typically include your lease agreement, house rules, move-in inspection reports, amendment agreements, and any other files your landlord has shared with you.</p>

        <h4 id="viewing-documents">Viewing Your Lease</h4>
        <p>When you click on a document, it opens in a preview window. From there, you can:</p>
        <ul>
          <li><strong>Read the full text:</strong> Scroll through the document to read all terms and conditions</li>
          <li><strong>Download:</strong> Save the document to your device for your personal records</li>
          <li><strong>Print:</strong> Print a physical copy to keep in a folder or file</li>
          <li><strong>Share:</strong> Send a copy to a family member, lawyer, or anyone else who needs to see it</li>
          <li><strong>Search:</strong> Use the search function to find specific terms or sections quickly</li>
        </ul>

        <h4 id="downloading-printing">Downloading and Printing</h4>
        <p>It is a good idea to keep a physical copy and a digital backup of your lease. You can download it as a PDF file to your computer or phone, making it accessible even if you are offline. Many tenants also print a copy and keep it in a safe place at home. This is especially important if you ever have disputes with your landlord - having a signed copy proves what you both agreed to.</p>

        <h3 id="lease-signing">Understanding the Lease Signing Process</h3>
        <p>Before your lease becomes active, both you and your landlord need to sign it. iReside makes this process simple and secure by allowing digital signatures.</p>

        <h4 id="receiving-lease">Step 1: Receiving Your Lease</h4>
        <p>After you and your landlord have agreed on the rental terms, your landlord will prepare the lease in iReside and send it to you. You will receive a notification that a lease is waiting for your review. The lease will appear in your Lease & Documents section with a status showing Pending Your Signature.</p>

        <h4 id="reviewing-lease">Step 2: Reviewing Your Lease</h4>
        <p>Take time to carefully read through the entire lease. Pay special attention to:</p>
        <ul>
          <li><strong>Dates:</strong> Make sure the start and end dates match what you agreed to</li>
          <li><strong>Rent amount:</strong> Verify the monthly rent is correct</li>
          <li><strong>Special terms:</strong> Check for any agreements you made with your landlord</li>
          <li><strong>House rules:</strong> Make sure the rules are clear and something you can follow</li>
          <li><strong>Responsibilities:</strong> Confirm who is responsible for repairs and maintenance</li>
        </ul>
        <p>If you notice any errors or disagree with something in the lease, do not sign it yet. Contact your landlord through the iReside messaging system and discuss the issue before proceeding.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Read Before You Sign</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Never sign a lease without reading it carefully. If you do not understand something, ask your landlord or consider consulting with a lawyer. Once you sign, you are legally bound to follow all the terms.</p>
        </div>

        <h4 id="signing-lease">Step 3: Signing Your Lease</h4>
        <p>When you are ready to sign, click the Review and Sign button on the lease. iReside will guide you through the signing process:</p>
        <ol>
          <li>You will review the final lease document one more time</li>
          <li>You will be asked to confirm your agreement to the terms</li>
          <li>You will digitally sign the lease using your mouse, trackpad, or touchscreen</li>
          <li>Your signature, full name, and the date will be recorded automatically</li>
          <li>A confirmation message will appear showing your signature was received</li>
        </ol>
        <p>Your digital signature is legally valid and serves the same purpose as a handwritten signature. It proves that you reviewed and agreed to the lease terms.</p>

        <h4 id="landlord-signs">Step 4: Waiting for Landlord Signature</h4>
        <p>After you sign, the lease goes to your landlord for their signature. During this time, the lease status will show Pending Landlord Signature. You can continue to view and download the lease, but you will not be able to make changes. Wait for your landlord to sign before the lease becomes officially active.</p>
        <p>Most landlords sign quickly, usually within a day or two. If your landlord takes longer than a week, you can send them a friendly reminder through iReside messaging.</p>

        <h4 id="lease-active">Step 5: Lease Becomes Active</h4>
        <p>Once your landlord signs, the lease status changes to Active. This is the official start of your tenancy. Both of you are now bound by all the terms in the lease. You can no longer make changes to an active lease - if either party wants to modify terms, you will need to create a lease amendment (see below).</p>

        <h3 id="document-types">Types of Documents in Your Lease & Documents Section</h3>
        <p>Beyond your main lease agreement, your Lease & Documents section may include other important files:</p>

        <h4 id="house-rules">House Rules</h4>
        <p>These detail the specific rules for your rental property. Common house rules include policies on noise levels, quiet hours, pets, smoking, guests, parking, and use of common areas. House rules help create a respectful living environment for all residents.</p>

        <h4 id="move-in-inspection">Move-In Inspection Report</h4>
        <p>This document is completed when you first move in. It describes the condition of the property - what is working, what is damaged, what is clean, etc. Both you and your landlord sign this report. It is important because it establishes the baseline condition of the property. When you move out, this report is compared to a move-out inspection to determine if damage is normal wear and tear (landlord responsibility) or tenant-caused damage (your responsibility).</p>

        <h4 id="amendments">Lease Amendments</h4>
        <p>Sometimes you and your landlord might want to change something in the lease after it is already signed. For example, you might want to add a pet, or your landlord might adjust the rent if you renew your lease. Instead of creating an entirely new lease, you create an amendment - a document that modifies specific terms of the original lease. Amendments must be signed by both parties, just like the original lease.</p>

        <h4 id="other-documents">Other Documents</h4>
        <p>Your landlord may also share other important documents such as utility information, parking permits, security system instructions, keys and access information, or community guidelines if you are renting in a multi-unit building.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Keep Everything Organized</p>
          <p className="m-0 text-text-medium text-sm">Your Lease & Documents section automatically keeps all your rental documents organized and searchable. But it is still a good idea to download and save important documents like your lease and move-in inspection to your own computer or cloud storage, just in case.</p>
        </div>

        <h3 id="lease-amendments">Making Changes: Lease Amendments</h3>
        <p>Your lease is a living document. If you and your landlord agree to change something, you do not need to create a brand new lease. Instead, you create an amendment.</p>

        <h4 id="when-amend">When Might You Need an Amendment?</h4>
        <p>Common reasons for lease amendments include:</p>
        <ul>
          <li><strong>Rent increase:</strong> Your landlord wants to raise your rent (usually happens at lease renewal)</li>
          <li><strong>Adding a roommate:</strong> You want to add another person to the lease</li>
          <li><strong>Pet policy change:</strong> You want to add a pet, or your landlord approves a pet exception</li>
          <li><strong>Lease term extension:</strong> You are renewing your lease for another year or longer</li>
          <li><strong>Early termination:</strong> Both you and your landlord agree to end the lease early</li>
          <li><strong>Service changes:</strong> Who pays for certain utilities or services is changing</li>
          <li><strong>Maintenance responsibility changes:</strong> The landlord is taking over or you are taking over a particular responsibility</li>
        </ul>

        <h4 id="amendment-process">How the Amendment Process Works</h4>
        <p>When an amendment is needed:</p>
        <ol>
          <li><strong>Your landlord proposes the change:</strong> They create an amendment in iReside describing what will change</li>
          <li><strong>You review it:</strong> You receive a notification and can view the proposed amendment</li>
          <li><strong>You discuss if needed:</strong> If you have questions or disagree, use iReside messaging to discuss before signing</li>
          <li><strong>You sign:</strong> If you agree, you digitally sign the amendment</li>
          <li><strong>Your landlord signs:</strong> They review and sign to finalize the amendment</li>
          <li><strong>Amendment becomes effective:</strong> Once signed by both parties, the changes take effect on the date specified in the amendment</li>
        </ol>
        <p>The original lease stays in your records, and the amendment is stored alongside it. Together, they represent your current rental agreement.</p>

        <h3 id="security">Document Security and Privacy</h3>
        <p>Your lease and documents contain sensitive personal information. iReside takes your privacy seriously:</p>
        <ul>
          <li><strong>Encrypted storage:</strong> Your documents are stored securely on encrypted servers</li>
          <li><strong>Limited access:</strong> Only you and your landlord can access your lease and documents</li>
          <li><strong>No third-party sharing:</strong> We do not share your documents with anyone without your explicit permission</li>
          <li><strong>Download for backup:</strong> You can download your documents anytime for your personal backup copies</li>
          <li><strong>Retention:</strong> Your documents stay in your account even after your lease ends, so you have a permanent record</li>
        </ul>

        <h3 id="common-questions">Common Questions About Leases and Documents</h3>

        <p><strong>What if I disagree with something in the lease?</strong></p>
        <p>Do not sign it. Instead, contact your landlord through iReside messaging to discuss your concerns. You can propose changes, and if you both agree, the landlord can revise the lease and send you the updated version. Negotiating before signing is much easier than trying to change things after you have already signed.</p>

        <p><strong>Can I print my lease?</strong></p>
        <p>Yes. You can download the lease as a PDF and print it on your home printer, or use your device is print function. Having a physical copy is recommended.</p>

        <p><strong>What if my landlord loses their copy of the lease?</strong></p>
        <p>Not a problem. Both of you have access to the signed lease in iReside anytime. It is stored permanently in your account history.</p>

        <p><strong>Can I share my lease with someone else (like a lawyer)?</strong></p>
        <p>You can download your lease and share the PDF with anyone you want. You might want to share it with a lawyer for review, a family member for advice, or someone else for any reason. It is your document.</p>

        <p><strong>What if I sign the lease and then change my mind?</strong></p>
        <p>Once you sign, the lease is legally binding. Changing your mind after signing has serious consequences. That is why it is so important to carefully review before you sign. If you truly need to back out, you would need to contact your landlord and negotiate, but they are under no obligation to let you out of the lease.</p>

        <p><strong>Will my digital signature hold up in court?</strong></p>
        <p>Yes. Digital signatures are legally recognized and enforceable in most jurisdictions. iReside is signing system records your signature, your name, and the exact timestamp, making it a secure and legally valid signature.</p>

        <p><strong>How long do my documents stay in iReside?</strong></p>
        <p>Permanently. Even after your lease ends and you move out, your documents remain in your account. This is valuable because you have a complete record of your tenancy.</p>

        <p><strong>What if there is a dispute about what the lease says?</strong></p>
        <p>The signed lease in your iReside account is the official record. Both you and your landlord have access to the exact same document with your signatures and timestamps. This makes disputes easier to resolve because there is no ambiguity about what was agreed to.</p>

        <h3 id="best-practices">Best Practices for Managing Your Lease</h3>
        <ul>
          <li><strong>Read carefully:</strong> Before signing, take time to read every word of your lease.</li>
          <li><strong>Ask questions:</strong> If something is unclear, ask your landlord for clarification before signing.</li>
          <li><strong>Keep backup copies:</strong> Download and save your lease to your personal computer or cloud storage.</li>
          <li><strong>Document everything:</strong> If you and your landlord make any verbal agreements, request that they be added to the lease as an amendment.</li>
          <li><strong>Reference your lease:</strong> When issues come up, refer back to the lease to understand what was agreed.</li>
          <li><strong>Maintain the property:</strong> Follow the lease terms regarding maintenance and care of the property.</li>
          <li><strong>Communicate changes:</strong> If either you or your landlord want to change lease terms, handle it through official amendments rather than verbal agreements.</li>
          <li><strong>Keep receipts:</strong> Maintain records of rent payments and any expenses related to your lease obligations.</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Legal Disclaimer</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">The information provided here is for general educational purposes and should not be considered legal advice. Rental laws vary by location, and your specific situation may have unique considerations. If you have legal questions about your lease or rental rights, please consult with a qualified attorney in your jurisdiction.</p>
        </div>
      </div>
    ),
    next: "tenant/moving",
    prev: "tenant/maintenance",
  },
  "tenant/moving": {
    title: "Moving In & Out",
    subtitle: "Smooth transitions for the start and end of your tenancy.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Moving is one of the most significant events in your rental journey. Whether you are moving into your first rental home or preparing to leave your current place, iReside helps make this transition as smooth as possible. This section walks you through everything you need to know about the moving process, from the moment you get your keys to the day you hand them back.</p>

        <h3 id="moving-in">Moving In</h3>
        <p>When your application is approved and your lease is signed, you will be ready to move in. The move-in process involves several important steps that set the foundation for your tenancy.</p>

        <h4 id="move-in-date">Your Move-In Date</h4>
        <p>During the application process, you provided your intended move-in date. This date becomes part of your lease agreement and marks when your tenancy officially begins. Your landlord will prepare the property for you by this date, ensuring everything is clean and ready for your arrival.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Coordinate with Your Landlord</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Contact your landlord a day or two before your move-in date to confirm the exact time you can pick up the keys. This helps you plan your moving schedule and ensures someone will be available to hand over the keys.</p>
        </div>

        <h4 id="move-in-inspection">The Move-In Inspection</h4>
        <p>When you move in, you and your landlord will walk through the property together to document its condition. This is called a move-in inspection, and it serves as a record of the property condition on the day you take possession.</p>
        <p>During this inspection, you will go room by room and note any existing issues. This might include scratches on walls, stains on carpet, fixtures that do not work, or any damage that is already present. Both you and your landlord will sign off on this inspection report, which becomes part of your tenancy records.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Why This Matters</p>
          <p className="m-0 text-text-medium text-sm">The move-in inspection protects you from being charged for damage that existed before you moved in. When you eventually move out, the landlord will compare the property condition to this baseline. Any new damage beyond normal wear and tear may come from your security deposit.</p>
        </div>

        <h4 id="getting-keys">Getting Your Keys and Access</h4>
        <p>Once the inspection is complete, your landlord will give you the keys to your new home. Depending on the property, you might receive door keys for the main entrance, mailbox key if your building has individual mailboxes, garage or parking keys if parking is included with your rental, or access cards or fobs for buildings with electronic entry systems.</p>
        <p>Keep these keys safe throughout your tenancy. If you lose them, report it to your landlord immediately so they can help you get replacements or change the locks if necessary.</p>

        <h4 id="first-rent-payment">Your First Rent Payment</h4>
        <p>After moving in, you will need to pay your first month rent. Your lease will specify when rent is due each month. Most leases require rent to be paid at the beginning of the month, but some may allow payment by a specific date. Refer to your lease agreement for the exact due date and payment amount.</p>
        <p>To make payments, you can use GCash or pay in person with cash. Make sure to keep records of all your payments for your personal files.</p>

        <h4 id="setting-up-utilities">Setting Up Utilities</h4>
        <p>Depending on what is included with your rental, you may need to set up some utilities in your name. Your lease will specify which utilities are the landlord responsibility and which are yours. Commonly, tenants are responsible for electricity, water, internet and cable, and gas if the property uses it.</p>
        <p>It is a good idea to set up utilities a few days before you move in so everything is ready when you arrive.</p>

        <h3 id="moving-out">Moving Out</h3>
        <p>When it is time to move out, iReside helps you navigate the process smoothly. Whether your lease is ending, you need to relocate for work, or you have decided to move to a different place, understanding the move-out process ensures you leave on good terms and get your security deposit back.</p>

        <h4 id="giving-notice">Giving Notice</h4>
        <p>Before you can move out, you must notify your landlord. This is called giving notice, and it is typically required by your lease. Most leases require 30 days notice, but some may require 60 days or more. Check your lease agreement for the specific notice period required.</p>
        <p>When you are ready to move out, submit a move-out request through iReside. This formal notice tells your landlord that you plan to leave and provides them with your intended move-out date.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Give Notice in Writing</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Always give written notice of your intention to move out. Even if you speak with your landlord in person, follow up with a written notice through iReside. This protects you if there is any dispute about when you gave notice or when your move-out date is.</p>
        </div>

        <h4 id="landlord-approval">Landlord Approval Process</h4>
        <p>After you submit your move-out request, your landlord will review it and decide whether to approve it. Once your landlord approves your request, your lease end date is automatically updated to match your requested move-out date, you receive a notification confirming the approval, and a move-out inspection is scheduled to assess the property condition.</p>

        <h4 id="pre-moveout-checklist">Pre-Move-Out Checklist</h4>
        <p>Before the inspection, take time to prepare the property. A thorough cleaning and minor repairs can help you get more of your security deposit back. Clean thoroughly, repair any damage you caused, clear all appliances, remove all personal items, check walls and floors for any issues, and document everything with photos.</p>

        <h4 id="moveout-inspection">The Move-Out Inspection</h4>
        <p>When you move out, you and your landlord will do another inspection, similar to the one when you moved in. The landlord will compare the property current condition to the move-in inspection report to determine if any damage goes beyond normal wear and tear.</p>
        <p>During the inspection, the landlord will check walls, ceilings, and floors for damage, all appliances to ensure they are working properly, plumbing and fixtures for any issues, light bulbs and other replaceable items, and cleanliness of the entire property.</p>

        <h4 id="clearing-bills">Clearing Bills and Payments</h4>
        <p>Before you fully move out, make sure all your rent and utility bills are paid. The system automatically checks for outstanding rent balance and pending utility payments. Review your payment history in the app and ensure everything is current before your move-out date.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Final Bill Review</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Check your payment history a week before your move-out date. This gives you time to address any issues or disputed charges before the final inspection.</p>
        </div>

        <h4 id="security-deposit-return">Security Deposit Return</h4>
        <p>After the inspection and verification that all bills are paid, your landlord will process the return of your security deposit.</p>

        <h5 id="normal-wear">Normal Wear and Tear</h5>
        <p>You are not responsible for normal wear and tear, which is the natural deterioration that happens over time from everyday use. This includes faded paint from sunlight, worn carpet in high-traffic areas, faded curtains or blinds, slightly worn kitchen countertops, and minor scuffs on walls from furniture.</p>

        <h5 id="tenant-damage">Tenant Damage</h5>
        <p>You are responsible for damage beyond normal wear and tear. This includes holes in walls from hanging pictures or nails, broken windows or doors, stained or burned carpets, broken fixtures or appliances, excessive dirt or grime left behind, and items left in the property that require removal.</p>

        <h5 id="deposit-deductions">How Deductions Are Calculated</h5>
        <p>If there is damage beyond normal wear and tear, your landlord may deduct the cost of repairs or cleaning from your security deposit. The deposit refund amount is calculated based on the cost to repair or replace damaged items, professional cleaning fees if the property requires more than normal cleaning, any unpaid rent or utility bills, and other charges outlined in your lease.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Timeline for Deposit Return</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Your landlord typically has 30 days after you move out to return your security deposit or provide an itemized list of any deductions.</p>
        </div>

        <h4 id="returning-keys">Returning Your Keys</h4>
        <p>On your final day, return all keys to your landlord. This includes door keys, mailbox keys, parking keys, and any access cards or fobs. Do not leave keys in the property or give them to someone other than your landlord without permission.</p>

        <h3 id="common-questions">Common Questions About Moving</h3>

        <p><strong>What if I want to move out before my lease ends?</strong></p>
        <p>Breaking a lease early can have consequences. You may be responsible for paying rent until a new tenant is found, or you may forfeit your security deposit. Check your lease agreement and discuss your situation with your landlord as early as possible.</p>

        <p><strong>Can my landlord keep my deposit for normal wear and tear?</strong></p>
        <p>No. Normal wear and tear is expected and cannot be deducted from your deposit. However, if the property is damaged beyond normal use, your landlord may make deductions.</p>

        <p><strong>What happens if I leave belongings behind?</strong></p>
        <p>If you leave personal belongings in the property, your landlord may charge you for the cost of removing and storing them.</p>

        <p><strong>How long does it take to get my security deposit back?</strong></p>
        <p>This varies by landlord, but most return deposits within 14 to 30 days after you move out.</p>

        <p><strong>What if I disagree with the deposit deductions?</strong></p>
        <p>If you believe the deductions are unfair, communicate with your landlord through iReside. Provide evidence such as photos you took during the move-out inspection.</p>

        <h3 id="best-practices">Best Practices for a Smooth Move</h3>
        <ul>
          <li><strong>Document everything:</strong> Take photos and videos of the property when you move in and when you move out.</li>
          <li><strong>Give proper notice:</strong> Know your lease requirements and give notice well before the deadline.</li>
          <li><strong>Communicate openly:</strong> Keep your landlord informed about your moving timeline.</li>
          <li><strong>Clean thoroughly:</strong> A deep clean before you leave can help you get more of your deposit back.</li>
          <li><strong>Do a final walk-through:</strong> Before handing over the keys, go through every room.</li>
          <li><strong>Keep records:</strong> Save copies of your inspection reports, notice letters, and any communication.</li>
          <li><strong>Update your address:</strong> Remember to update your address with the postal service and banks.</li>
          <li><strong>Cancel utilities in your name:</strong> Contact utility companies to cancel service as of your move-out date.</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Leaving on Good Terms</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">How you leave a property can affect your rental history and future references.</p>
        </div>
      </div>
    ),
    next: "landlord/properties",
    prev: "tenant/lease",
  },
  "landlord/properties": {
    title: "Property Management",
    subtitle: "Organize and monitor your real estate portfolio.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Managing your properties effectively is key to running a successful rental business. iReside provides you with all the tools you need to organize your buildings, track your units, and monitor occupancy from a single, easy-to-use dashboard.</p>

        <h3 id="overview">What is Property Management in iReside?</h3>
        <p>Property management in iReside refers to the tools and features that help you oversee your rental properties. This includes adding new properties to your account, managing individual units within each property, creating and editing property listings, and tracking the occupancy status of your spaces. Everything is designed to save you time and keep your information organized.</p>
        <p>Instead of using spreadsheets or paper records, iReside lets you manage everything digitally. You can access your property information from your computer or phone, making it easy to stay on top of your portfolio whether you are at home or on the go.</p>

        <h3 id="adding-properties">Adding a New Property</h3>
        <p>When you are ready to list a new property, you will use the property creation form to enter all the details. This information helps potential tenants understand what you are offering and helps you keep track of your inventory.</p>
        
        <h4 id="basic-details">Basic Property Details</h4>
        <p>Start by entering the fundamental information about your property. This includes the complete address, the type of property whether it is an apartment, house, dormitory, or commercial space, and the total number of units available for rent. For dormitories or multi-unit buildings, you will also enter the number of floors.</p>
        <p>Make sure the address is accurate and complete because this is how tenants will find your property on a map and verify its location.</p>

        <h4 id="property-description">Property Description</h4>
        <p>Write a clear description of your property that highlights its best features. Mention what makes it unique, the neighborhood, nearby amenities, and what types of tenants you are looking for. A good description helps attract the right tenants and sets clear expectations from the start.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Tip for Landlords</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Be honest and detailed in your description. Tenants appreciate knowing exactly what to expect, and this helps reduce questions and misunderstandings later.</p>
        </div>

        <h4 id="photos">Adding Photos</h4>
        <p>Photos are one of the most important parts of your listing. They give potential tenants a visual sense of the property and help your listing stand out. Upload clear, well-lit photos that show each part of the property including bedrooms, bathrooms, the kitchen, living areas, and any outdoor spaces. If the building has common areas like a lobby, elevator, or parking, include those too.</p>
        <p>Make sure your photos accurately represent the property. Using old photos or photos that do not match the actual space can lead to confusion and disappointment when tenants come to view it.</p>

        <h3 id="managing-units">Managing Units</h3>
        <p>Each property can contain one or more units. A unit is a separate rental space within your property. For example, if you own an apartment building with 10 apartments, each apartment is a separate unit. If you own a dormitory with multiple rooms, each room or floor could be a unit depending on how you set it up.</p>

        <h4 id="unit-details">Unit Information</h4>
        <p>For each unit, you will need to provide specific details including the unit name or number, the monthly rent amount, the number of bedrooms and bathrooms, the maximum occupancy limit, and any amenities that come with that specific unit like a private bathroom or balcony.</p>

        <h4 id="unit-status">Unit Status</h4>
        <p>Each unit has a status that tells you its current condition in the rental process:</p>
        <ul>
          <li><strong>Vacant:</strong> The unit is available for rent and has no active tenant.</li>
          <li><strong>Occupied:</strong> The unit has an active tenant and is currently being rented.</li>
          <li><strong>Pending:</strong> The unit has a pending application or lease that has not been finalized yet.</li>
          <li><strong>Under Maintenance:</strong> The unit is not available for rent because it is being repaired or renovated.</li>
        </ul>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Keep Status Updated</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Make sure to update the status of your units as they change. An accurate status helps you track availability and ensures tenants see correct information when browsing listings.</p>
        </div>

        <h3 id="unit-map">Using the Unit Map</h3>
        <p>The Unit Map is one of iReside's most powerful features for property managers. It gives you a visual representation of your properties and units, making it easy to see at a glance which units are occupied, vacant, or under maintenance.</p>

        <h4 id="map-overview">Visual Overview</h4>
        <p>Instead of looking through a list of units, you can view your property as a map. Each unit is shown as a separate block on the map, and the color of the block indicates its status. This makes it much faster to scan and understand the occupancy situation of your entire property.</p>
        <p>The map view is especially helpful if you have multiple properties or many units because it puts all the information into a simple visual format.</p>

        <h4 id="floor-plans">Floor Plans</h4>
        <p>For buildings with multiple floors, you can view each floor separately. This lets you see which units are on which floor and understand the layout of your building. You can also configure the floor plan to show the actual arrangement of units, which helps with tenant placement and planning.</p>

        <h3 id="listing-details">Unit Details</h3>
        <p>Keeping your unit information clear and accurate helps you manage your properties effectively. Make sure the details for each unit are complete and up to date.</p>

        <h4 id="rental-rates">Rental Rates</h4>
        <p>Set your rental rates carefully for each unit. Consider the location, the condition of the property, the amenities included, and the current rates in your area. You can set different rates for different units based on their features and size.</p>
        <p>You can also indicate which utilities are included in the rent and which ones the tenant will need to pay for separately. This transparency helps tenants understand their financial obligations.</p>

        <h4 id="availability">Availability and Move-In Dates</h4>
        <p>Always keep your unit information updated with accurate availability information. If a unit will be available on a specific date, make sure that date is shown. If a unit is not yet available, do not mark it as vacant. This prevents confusion and ensures you only receive applications for units that are truly ready.</p>

        <h3 id="renewal-settings">Renewal Settings</h3>
        <p>For each property, you can configure settings related to lease renewals. This includes the default lease duration, whether automatic renewals are offered, and the notice period required before a tenant must confirm if they are renewing or moving out.</p>
        <p>These settings help you plan ahead and reduce gaps between tenants. When a tenant is approaching the end of their lease, the system can automatically send reminders and prompts to help with the renewal process.</p>

        <h3 id="property-settings">Property Settings</h3>
        <p>Each property has settings you can adjust to fit your management style. These include notification preferences so you know when new applications come in, the approval workflow for applications, and default templates for documents and communications.</p>
        <p>Taking time to configure these settings correctly when you first add a property saves time later and ensures your workflow runs smoothly.</p>

        <h3 id="monitoring">Monitoring Your Portfolio</h3>
        <p>iReside gives you tools to monitor the health of your property portfolio. You can see occupancy rates, average rental income, and trends over time. This information helps you make smart decisions about pricing, when to schedule maintenance, and whether to expand your portfolio.</p>

        <h3 id="common-questions">Common Questions About Property Management</h3>
        <p><strong>Can I manage multiple properties under one account?</strong></p>
        <p>Yes. You can add as many properties as you need to your account. Each property can have its own set of units and settings. The dashboard gives you an overview of all your properties so you can manage them from a single place.</p>

        <p><strong>What happens if I need to temporarily make a unit unavailable?</strong></p>
        <p>You can change the unit status to Under Maintenance or mark it as unavailable. This prevents new applications from being submitted for a space that is not ready for occupancy.</p>

        <p><strong>Can I export my property and unit information?</strong></p>
        <p>Yes. You can view and export details about your properties and units for your records. This is useful for financial planning and reporting.</p>

        <p><strong>How do I handle different property types?</strong></p>
        <p>iReside supports various property types including apartments, houses, dormitories, and commercial spaces. When you add a property, you select its type, and the system adjusts the available fields and options accordingly.</p>
      </div>
    ),
    next: "landlord/screening",
    prev: "tenant/moving",
  },
  "landlord/screening": {
    title: "Tenant Screening",
    subtitle: "Find the right tenants for your properties.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Finding the right tenant is one of the most important decisions you will make as a property owner. A good tenant pays rent on time, takes care of the property, and follows the lease agreement. A bad tenant can cause headaches, financial losses, and property damage. iReside gives you the tools to screen applicants thoroughly and make informed decisions.</p>

        <h3 id="overview">What is Tenant Screening?</h3>
        <p>Tenant screening is the process of evaluating potential tenants before you approve their application. This involves reviewing the information they provide, checking their documents, verifying their identity and income, and communicating with them directly. The goal is to understand who is applying and whether they are likely to be a responsible tenant.</p>
        <p>On iReside, you can manage the entire screening process digitally. Applications come to you through the platform, documents are uploaded and stored securely, and you can communicate with applicants without revealing your personal contact information until you are ready.</p>

        <h3 id="receiving-applications">Receiving Applications</h3>
        <p>When prospective tenants are interested in your property, they will submit applications through iReside. There are two main ways this can happen.</p>
        
        <h4 id="online-applications">Online Applications</h4>
        <p>When you have an open unit and receive inquiries, interested applicants can submit applications through iReside. They will fill out the application form you have set up, provide their personal information, employment details, references, and upload any required documents. All of this comes to you through the platform in an organized format.</p>

        <h4 id="walk-in-applications">Walk-In Applications</h4>
        <p>If you meet prospective tenants in person, you can create a walk-in application directly in the system. This lets you enter their information on the spot or send them a link to apply later. Walk-in applications are useful when you meet someone at a property viewing or through a referral.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Application Invitation</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">You can also proactively send application invitations to people you know are interested. Just create an invitation link and send it to them via email or messaging apps.</p>
        </div>

        <h3 id="reviewing-applications">Reviewing Applications</h3>
        <p>When applications come in, you will see them in your Applications dashboard. Each application shows the applicant is basic information, their employment and income details, the references they have provided, and any documents they have uploaded.</p>

        <h4 id="basic-information">Basic Information Review</h4>
        <p>Start by reviewing the basic information. Check their full name, contact details, and the date they applied. Make sure the information is complete and consistent. Incomplete applications can be a red flag, so note if anything is missing or seems incomplete.</p>

        <h4 id="income-verification">Income and Employment</h4>
        <p>One of the most important factors in tenant screening is whether the applicant can afford the rent. Look at their stated income and employment information. Most landlords look for applicants whose monthly income is at least three times the monthly rent, though this can vary based on your criteria and local practices.</p>
        <p>Check if they have a stable job history and if their employer is verifiable. If you have concerns about the income they have declared, you can request additional proof such as recent pay stubs or bank statements.</p>

        <h4 id="references">Checking References</h4>
        <p>References from previous landlords can be very valuable. They tell you how the applicant behaved as a tenant in the past. Did they pay rent on time? Did they take care of the property? Were there any issues or complaints?</p>
        <p>If references are provided, take time to contact them. A quick call can reveal a lot about the applicant. If you cannot reach a reference, note this down. Multiple unsuccessful reference attempts might warrant further investigation.</p>

        <h3 id="document-verification">Verifying Documents</h3>
        <p>Applicants may be asked to provide documents to support their application. These can include proof of income such as pay stubs or bank statements, a valid government-issued ID such as a driver license or passport, and reference letters from previous landlords.</p>

        <h4 id="id-verification">Identity Verification</h4>
        <p>Check that the ID provided matches the name on the application. Look at the photo to confirm it resembles the applicant. Make sure the ID is not expired. This simple step helps ensure you are dealing with a real person and prevents fraud.</p>

        <h4 id="document-storage">Secure Document Storage</h4>
        <p>All documents uploaded through iReside are stored securely. You can view them anytime from your dashboard, and they are linked to the specific application. This creates a clear record of what you verified and when. Proper document storage also protects you if there are ever disputes about what was agreed to or verified.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Document Handling Reminder</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Handle all applicant documents with care. Do not share them with unauthorized people. Only use them for the purpose of evaluating the application. This protects both you and the applicant.</p>
        </div>

        <h3 id="communicating">Communicating with Applicants</h3>
        <p>Clear communication helps the screening process go smoothly. iReside has built-in messaging that lets you communicate with applicants without revealing your personal phone number or email address until you choose to share it.</p>

        <h4 id="status-updates">Application Status Updates</h4>
        <p>Keep applicants informed about the status of their application. If you are still reviewing, let them know. If you need more information, contact them through the platform. If you have made a decision, communicate it clearly and promptly.</p>

        <h4 id="questions">Asking Follow-Up Questions</h4>
        <p>If you have questions about something in the application, you can message the applicant directly through iReside. Ask for clarification, request additional documents, or set up a call or meeting to learn more. This direct communication helps you make a more informed decision.</p>

        <h3 id="approval-process">Approving or Declining</h3>
        <p>Once you have reviewed the application and completed your screening, you will need to make a decision. You can either approve the application or decline it.</p>

        <h4 id="approving">Approving an Applicant</h4>
        <p>If you decide to approve the applicant, you will send them a lease agreement to review and sign. iReside makes this easy by generating the lease based on the property and unit details you have already entered. You can customize the terms as needed before sending.</p>
        <p>Once the lease is signed by both parties, the tenant is officially confirmed and the unit status will update to reflect that it is no longer available.</p>

        <h4 id="declining">Declining an Applicant</h4>
        <p>If you decide not to proceed with an applicant, you can decline their application through the platform. It is good practice to notify them of your decision, though you are not always required to explain why. Being polite and professional in your decline message reflects well on you as a landlord.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Fair Housing Reminder</p>
          <p className="m-0 text-text-medium text-sm">When screening tenants, apply consistent criteria to all applicants. Do not discriminate based on race, religion, gender, age, disability, family status, or other protected characteristics. Treat every applicant fairly and equally.</p>
        </div>

        <h3 id="screening-criteria">Setting Your Screening Criteria</h3>
        <p>Before you start receiving applications, decide on your screening criteria. Having clear criteria helps you make consistent decisions and reduces the chance of accidentally discriminating against any group.</p>
        <p>Consider what factors are most important to you such as minimum income requirements, credit history if accessible, rental history, employment status, and references. Write these down and apply them consistently to every applicant.</p>

        <h3 id="common-questions">Common Questions About Tenant Screening</h3>
        <p><strong>Can I charge applicants a fee for screening?</strong></p>
        <p>This depends on local laws and regulations. Some areas allow landlords to charge application fees to cover the cost of background checks, while others prohibit or limit such fees. Check your local regulations to understand what is allowed in your area.</p>

        <p><strong>What if an applicant has no rental history?</strong></p>
        <p>Some applicants, especially younger people or those moving from abroad, may not have a previous rental history. In these cases, look at other factors such as employment stability, income, personal references, and character. You might also consider a shorter initial lease term to start.</p>

        <p><strong>How long should I take to review applications?</strong></p>
        <p>Try to review applications within a few days of receiving them. Prospective tenants are often applying to multiple properties and appreciate a quick response. If you need more time, send a brief message to let them know you are still reviewing.</p>

        <p><strong>Can I accept multiple applications for the same unit?</strong></p>
        <p>You can receive multiple applications, but be careful about accepting deposits or fees from more than one applicant for the same unit. This can lead to legal issues if you have to refund multiple people. Once you approve an applicant and they sign the lease, you should notify any other applicants that the unit is no longer available.</p>
      </div>
    ),
    next: "landlord/finance",
    prev: "landlord/properties",
  },
  "landlord/finance": {
    title: "Financial Overview",
    subtitle: "Track rent collection and property expenses.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Managing the financial side of rental property can be one of the most time-consuming parts of being a landlord. iReside simplifies this by providing tools to track rent payments, manage invoices, monitor cash flow, and keep clear financial records. Everything is in one place, so you do not have to juggle multiple spreadsheets or apps.</p>

        <h3 id="overview">Financial Management Overview</h3>
        <p>The Financial Hub in iReside gives you a complete picture of your property finances. You can see how much money is coming in from rent, what is owed, what has been paid, and track your property-related expenses. This helps you stay organized and ensures nothing slips through the cracks.</p>
        <p>Whether you have one property or dozens, the financial dashboard makes it easy to understand your rental business performance at a glance.</p>

        <h3 id="invoices">Managing Invoices</h3>
        <p>Invoices are the core of rent collection in iReside. An invoice represents the amount a tenant owes for a specific period, typically monthly rent. You can create invoices manually or have them generated automatically based on the lease terms.</p>

        <h4 id="creating-invoices">Creating Invoices</h4>
        <p>When you have an active lease, you can create an invoice for the upcoming rent period. The invoice will include the amount due, the due date, and any other charges or credits that apply. Make sure the amount matches what was agreed to in the lease.</p>
        <p>If you have set up recurring invoices, the system can generate them automatically each month, saving you time and ensuring consistency.</p>

        <h4 id="invoice-status">Invoice Status Types</h4>
        <p>Each invoice has a status that tells you where it stands in the payment process:</p>
        <ul>
          <li><strong>Pending:</strong> The invoice has been created but the tenant has not yet taken action to pay it.</li>
          <li><strong>Under Review:</strong> The tenant has submitted proof of payment and you are verifying it.</li>
          <li><strong>Paid:</strong> You have confirmed the payment and the invoice is settled.</li>
          <li><strong>Overdue:</strong> The due date has passed and the invoice has not been paid.</li>
          <li><strong>Partial:</strong> The tenant has paid part of the amount owed.</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Invoice Tracking</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Keep an eye on the status of your invoices. If you see many overdue invoices, consider reaching out to tenants proactively to avoid payment delays.</p>
        </div>

        <h3 id="payment-methods">Payment Methods</h3>
        <p>iReside currently supports two payment methods for rent collection. Understanding both helps you set correct expectations with your tenants.</p>

        <h4 id="gcash-payments">GCash Payments</h4>
        <p>Many tenants prefer to pay through GCash because it is fast and convenient. When a tenant chooses this method, they will transfer the rent amount directly to your GCash account using the details shown in the Checkout Hub. After making the transfer, they will upload proof of payment including the 13-digit reference number.</p>
        <p>When you receive proof of payment, you will verify it by checking your GCash app or account history. If the reference number matches and the amount is correct, you confirm the payment in iReside. This updates the invoice status to Paid and creates a digital receipt for the tenant.</p>

        <h4 id="cash-payments">Cash Payments</h4>
        <p>Some tenants prefer to pay in cash, especially if they live in the same building or near your office. When a tenant selects this method, they will notify you through the platform that they intend to pay in cash. You will then meet them in person to receive the payment.</p>
        <p>After you receive the cash, you confirm the payment in iReside. The invoice status will immediately update to Paid, and the tenant receives a digital receipt. This creates a clear record that the payment was received.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Cash Handling Reminder</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">When receiving cash payments, always provide a receipt and count the money in front of the tenant. Document the transaction in iReside right away to maintain accurate records.</p>
        </div>

        <h3 id="payment-reconciliation">Payment Reconciliation</h3>
        <p>Payment reconciliation means matching the payments you receive with the invoices you have issued. This is important for keeping your books accurate and knowing exactly where you stand financially.</p>

        <h4 id="verifying-payments">Verifying GCash Payments</h4>
        <p>When a tenant submits proof of GCash payment, open your GCash app and look for the transaction using the reference number they provided. Check that the amount matches what is on the invoice and that the transaction was made on or around the expected date. If everything looks correct, confirm the payment in iReside.</p>

        <h4 id="handling-disputes">Handling Payment Disputes</h4>
        <p>Sometimes there may be a discrepancy. Maybe the tenant paid the wrong amount, the reference number does not match, or you do not see the transaction. If this happens, do not confirm the payment yet. Instead, contact the tenant through the messaging system and ask them to clarify or resubmit proof. This protects both parties and prevents misunderstandings.</p>

        <h3 id="expenses">Tracking Expenses</h3>
        <p>As a landlord, you will have expenses related to your properties. These can include repairs and maintenance, property taxes, insurance, utilities that you cover, management fees, and any other costs associated with running your properties.</p>

        <h4 id="recording-expenses">Recording Expenses</h4>
        <p>Keep a record of all your property-related expenses. Note the date, the amount, the category, and what it was for. This helps you track where your money is going and makes it easier to prepare for tax time or analyze the profitability of your properties.</p>

        <h4 id="expense-categories">Expense Categories</h4>
        <p>Organize your expenses into categories to make reporting easier. Common categories include Maintenance and Repairs, Utilities, Taxes and Insurance, Management Fees, Marketing and Advertising, and Legal and Professional Services.</p>

        <h3 id="financial-reports">Financial Reports and Analytics</h3>
        <p>iReside provides tools to help you understand your financial performance over time. You can see reports on rent collection rates, total income and expenses, outstanding balances, and trends across different periods.</p>

        <h4 id="collection-rate">Collection Rate</h4>
        <p>This tells you what percentage of rent due has been collected. A high collection rate means tenants are paying on time. A low rate might indicate problems that need attention, such as tenants struggling to pay or underlying issues with your payment process.</p>

        <h4 id="income-summary">Income Summary</h4>
        <p>See a breakdown of all money coming in, organized by property, by unit, or by time period. This helps you understand which properties are performing best and whether your income is growing over time.</p>

        <h4 id="profit-loss">Profit and Loss Overview</h4>
        <p>By comparing your income against your expenses, you can see the net profit or loss for each property. This is essential for understanding whether your rental business is sustainable and where you might be able to cut costs or improve efficiency.</p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-green-700 dark:text-green-300 m-0">Record Keeping</p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm">Maintaining accurate financial records protects you and makes your life easier at tax time. iReside keeps a digital record of all transactions that you can access anytime, so you never have to worry about losing receipts or forgetting about a payment.</p>
        </div>

        <h3 id="common-questions">Common Questions About Finances</h3>
        <p><strong>Can I issue refunds through iReside?</strong></p>
        <p>If you need to refund a tenant for any reason, you can do so by initiating a refund through the platform. Refunds can be issued for overpayments, security deposits, or any other reason you and the tenant agree on.</p>

        <p><strong>What if a tenant pays the wrong amount?</strong></p>
        <p>If a tenant pays less than the invoice amount, you can mark the invoice as Partial and the system will track what is still owed. If they pay more, you can issue a refund for the difference or credit it toward future rent.</p>

        <p><strong>How do I handle late payments?</strong></p>
        <p>iReside will mark invoices as overdue after the due date passes. You can follow up with tenants through the messaging system to remind them. You can also set up automatic reminders to be sent to tenants when their payment is due or overdue.</p>

        <p><strong>Can I export my financial data?</strong></p>
        <p>Yes. You can export your financial reports and transaction history for your records or for your accountant. This makes it easier to prepare tax returns or analyze your business performance.</p>
      </div>
    ),
    next: "landlord/maintenance",
    prev: "landlord/screening",
  },
  "landlord/maintenance": {
    title: "Maintenance Control",
    subtitle: "Stay on top of repairs and property upkeep.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Keeping your properties well-maintained is key to preserving their value and keeping tenants happy. iReside's maintenance management tools help you receive repair requests from tenants, track the status of each issue, assign tasks to the right people, and maintain a complete history of all work done on your properties.</p>

        <h3 id="overview">Maintenance Management Overview</h3>
        <p>When something breaks or needs fixing in a rental property, tenants submit maintenance requests through iReside. You receive these requests in your dashboard, review them, and take appropriate action. Whether you handle repairs yourself, hire a contractor, or guide the tenant through a self-repair, everything is tracked and recorded in the system.</p>
        <p>Having a clear maintenance process benefits everyone. Tenants get their issues addressed promptly. You maintain the value of your property and prevent small problems from becoming big ones. And both parties have a record of what was reported and what was done about it.</p>

        <h3 id="receiving-requests">Receiving Maintenance Requests</h3>
        <p>When a tenant submits a maintenance request, you will see it appear in your maintenance dashboard. Each request includes details about the issue, photos the tenant may have uploaded, the priority level the tenant has assigned, and when it was submitted.</p>

        <h4 id="request-notifications">Notifications</h4>
        <p>You will receive a notification whenever a new maintenance request comes in. This ensures you can respond promptly, even if you are not checking the dashboard constantly. You can configure how you receive these notifications based on your preferences.</p>

        <h4 id="reviewing-requests">Reviewing a Request</h4>
        <p>When you open a maintenance request, take time to read the description carefully. Look at the photos provided. Check the priority level the tenant has selected. This gives you a good initial understanding of the issue before deciding on next steps.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Quick Response Matters</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Tenants appreciate when landlords respond quickly to maintenance requests. Even if you cannot fix the issue immediately, acknowledging the request promptly lets the tenant know you are aware and working on it.</p>
        </div>

        <h3 id="issue-categories">Issue Categories</h3>
        <p>Maintenance requests are organized by category to help you prioritize and route them appropriately. Common categories include:</p>
        <ul>
          <li><strong>Plumbing:</strong> Leaks, drips, clogs, water heater issues, or any water-related problems.</li>
          <li><strong>Electrical:</strong> Outlets not working, lights flickering, circuit breaker issues, or any electrical hazards.</li>
          <li><strong>HVAC:</strong> Air conditioning, heating, ventilation, or temperature control problems.</li>
          <li><strong>Appliances:</strong> Problems with built-in appliances like stoves, ovens, refrigerators, or washing machines.</li>
          <li><strong>Structural:</strong> Issues with walls, floors, ceilings, doors, windows, or the building structure.</li>
          <li><strong>Pest Control:</strong> Insects, rodents, or other pest problems.</li>
          <li><strong>General Repairs:</strong> Anything that does not fit neatly into the other categories.</li>
        </ul>

        <h3 id="priority-levels">Understanding Priority Levels</h3>
        <p>Tenants assign a priority level to their request based on how urgent they believe it is. As a landlord, you can review this and adjust if needed based on your assessment of the situation.</p>

        <h4 id="low-priority">Low Priority</h4>
        <p>Minor issues that do not significantly affect daily life. Examples include a small scratch on a wall, a cabinet door that does not close properly, or a faucet that has a very slow drip. These can typically be addressed during routine maintenance or scheduled repairs.</p>

        <h4 id="medium-priority">Medium Priority</h4>
        <p>Issues that are inconvenient but not urgent. Examples include a bathroom light that sometimes flickers, a toilet that runs occasionally, or a window that is hard to open. These should be addressed in a timely manner, typically within a week or two.</p>

        <h4 id="high-priority">High Priority</h4>
        <p>Issues that seriously affect comfort or safety. Examples include heating not working in cold weather, multiple outlets not working, a significant leak that could cause water damage, or a door lock that is broken. These should be addressed as soon as possible.</p>

        <h4 id="urgent-priority">Urgent Priority</h4>
        <p>Critical issues that require immediate attention. Examples include no water supply, gas smell or leak, major water leak or flooding, electrical hazards, or security concerns like a broken main door. These require immediate action, and you should contact a professional right away.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Emergency Protocol</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">For truly emergency situations like gas leaks, electrical hazards, or major flooding, tell the tenant to contact emergency services immediately. Then focus on getting a professional to address the issue as quickly as possible.</p>
        </div>

        <h3 id="managing-requests">Managing Maintenance Requests</h3>
        <p>Once you have reviewed a request, you will decide how to handle it. iReside gives you several options depending on the nature of the issue.</p>

        <h4 id="approving-requests">Approving a Request</h4>
        <p>If you decide the request is valid and needs to be addressed, you can approve it. This acknowledges the issue and moves it into your active maintenance queue. You can then assign it to yourself, a staff member, or an external contractor.</p>

        <h4 id="assigning-tasks">Assigning Tasks</h4>
        <p>For each approved request, you can assign it to the appropriate person. This might be a maintenance staff member you employ, a trusted contractor you work with, or even yourself if you plan to handle it. Assignment creates a clear chain of responsibility so everyone knows who is supposed to do what.</p>

        <h4 id="self-repair-option">Self-Repair Option</h4>
        <p>In some cases, you might guide the tenant to handle a minor repair themselves. This could be appropriate for simple tasks like changing a light bulb, unclogging a drain that is not completely blocked, or replacing batteries in a smoke detector. If you approve a self-repair, provide clear instructions to the tenant on what to do.</p>

        <h4 id="requesting-more-info">Requesting More Information</h4>
        <p>If a request is unclear or you need more details before deciding, you can message the tenant directly through iReside. Ask specific questions or request additional photos. This helps you make a better decision and ensures the right resources are dispatched.</p>

        <h4 id="declining-requests">Declining a Request</h4>
        <p>Not all requests are legitimate maintenance issues. A request might be for something that is the tenant is responsibility, something that was caused by tenant damage, or something outside the scope of what you agreed to handle. If you decline a request, explain your reasoning politely to the tenant so they understand why.</p>

        <h3 id="tracking-status">Tracking Status Changes</h3>
        <p>Maintenance requests go through different stages from submission to resolution. Tracking these stages helps both you and the tenant know where things stand.</p>
        <ul>
          <li><strong>Submitted:</strong> The tenant has reported the issue.</li>
          <li><strong>Under Review:</strong> You are reviewing the request and deciding how to handle it.</li>
          <li><strong>Approved:</strong> You have accepted the request and it is being worked on.</li>
          <li><strong>In Progress:</strong> Work is actively being done to address the issue.</li>
          <li><strong>Pending Confirmation:</strong> The work has been completed and is awaiting tenant confirmation.</li>
          <li><strong>Completed:</strong> The issue has been resolved and closed.</li>
          <li><strong>Declined:</strong> The request was not accepted and the reason has been communicated.</li>
        </ul>

        <h3 id="maintenance-history">Maintenance History</h3>
        <p>Every maintenance request that is completed creates a record in the property history. This history is valuable for several reasons.</p>

        <h4 id="track-patterns">Tracking Patterns</h4>
        <p>If a particular unit or piece of equipment has frequent issues, the maintenance history will show this. This can help you identify when something needs to be replaced entirely rather than constantly repaired.</p>

        <h4 id="move-out-inspections">Move-Out Inspections</h4>
        <p>When a tenant moves out, you can reference the maintenance history to see what issues were reported during their tenancy and how they were addressed. This helps with security deposit decisions and understanding the condition of the property.</p>

        <h4 id="contractor-records">Contractor Records</h4>
        <p>If you hire contractors for repairs, the maintenance history keeps a record of who did what work and when. This is helpful for warranty purposes and for evaluating whether a contractor is doing good work.</p>

        <h3 id="common-questions">Common Questions About Maintenance</h3>
        <p><strong>Who is responsible for what repairs?</strong></p>
        <p>Generally, landlords are responsible for keeping the property in a livable condition and addressing major systems like plumbing, electrical, and structural issues. Tenants are typically responsible for minor issues they cause and for keeping the property clean. Your lease agreement should spell out specific responsibilities.</p>

        <p><strong>How quickly should I respond to maintenance requests?</strong></p>
        <p>This depends on the priority. Urgent issues should be addressed immediately or within hours. High priority issues should be addressed within a day or two. Medium priority issues can wait a week or two. Low priority issues can be scheduled during routine maintenance.</p>

        <p><strong>Can I require tenants to handle minor repairs themselves?</strong></p>
        <p>If a repair is simple and safe for the tenant to do, you can offer them the option to handle it. However, you cannot force them to do repairs that are your responsibility or that require professional skills. Always document any agreements about repairs in writing.</p>

        <p><strong>What if a tenant reports the same issue repeatedly?</strong></p>
        <p>Check the maintenance history to see how many times this has been reported. If it is a recurring problem, it might need a more permanent fix. Consider getting a professional assessment to identify the root cause rather than just treating the symptoms.</p>
      </div>
    ),
    next: "landlord/documents",
    prev: "landlord/finance",
  },
  "landlord/documents": {
    title: "Lease Management",
    subtitle: "Create and manage digital lease agreements.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Leases are the foundation of the landlord-tenant relationship. They define the terms of the rental, establish the rights and responsibilities of both parties, and create a legally binding agreement. iReside makes it easy to create leases, collect digital signatures, and manage all your property documents in one secure place.</p>

        <h3 id="overview">What is Lease Management?</h3>
        <p>Lease management on iReside covers everything related to the lease agreement from creation to expiration. This includes generating the initial lease document based on the terms you set, collecting signatures from both you and your tenant, storing the signed document securely, and handling any amendments or renewals that come up during the tenancy.</p>
        <p>Instead of dealing with paper documents, scanning, and physical filing, iReside keeps everything digital and organized. You can access any lease document from your dashboard whenever you need it.</p>

        <h3 id="lease-basics">Lease Agreement Basics</h3>
        <p>A lease agreement is a legal contract between you and your tenant. It outlines the terms under which the tenant is allowed to occupy your property. Key elements typically include:</p>
        <ul>
          <li><strong>Parties:</strong> The names of the landlord and tenant.</li>
          <li><strong>Property:</strong> The address and specific unit being rented.</li>
          <li><strong>Lease Term:</strong> The start and end dates of the rental agreement.</li>
          <li><strong>Rent:</strong> The monthly amount, due date, and accepted payment methods.</li>
          <li><strong>Deposits:</strong> The security deposit amount and conditions for its return.</li>
          <li><strong>Utilities:</strong> Which utilities are included and which are the tenant responsibility.</li>
          <li><strong>Rules:</strong> Any specific policies about pets, guests, noise, or modifications.</li>
          <li><strong>Maintenance:</strong> Who is responsible for what types of repairs and upkeep.</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Legal Disclaimer</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">While iReside provides tools to help you create and manage leases, it is not a substitute for professional legal advice. Consider consulting with a lawyer to ensure your lease agreements comply with local laws and adequately protect your interests.</p>
        </div>

        <h3 id="creating-leases">Creating a Lease</h3>
        <p>When you approve a tenant application, you can move on to creating the lease. The process starts with generating the lease document in iReside.</p>

        <h4 id="lease-generation">Automatic Lease Generation</h4>
        <p>iReside can automatically generate a lease document based on the information already in the system. This includes the property details, unit information, the rent amount you have set, and the terms you have configured. This saves time because you do not have to enter the same information multiple times.</p>

        <h4 id="customizing-terms">Customizing Terms</h4>
        <p>While the auto-generated lease provides a starting point, you should review it carefully and customize any terms as needed for your specific situation. You can adjust the rent amount, change the lease duration, add special conditions, or modify any other terms to fit your agreement with the tenant.</p>

        <h4 id="addendum">Adding Addendums</h4>
        <p>If you have special terms that are not covered in the standard lease, you can add addendums. These are additional documents that become part of the overall lease agreement. Common addendums include pet policies, parking arrangements, or specific rules for your property.</p>

        <h3 id="digital-signatures">Digital Signature Process</h3>
        <p>One of the most convenient features of iReside is the ability to collect signatures digitally. This eliminates the need for printing, scanning, and physical document handling.</p>

        <h4 id="sending-for-signature">Sending the Lease</h4>
        <p>Once you are satisfied with the lease document, you send it to the tenant for review and signature through iReside. The tenant will receive a notification and can view the complete lease in the app.</p>

        <h4 id="tenant-review">Tenant Review</h4>
        <p>The tenant has the opportunity to read through the entire lease before signing. If they have questions, they can message you through the platform. This dialogue before signing helps ensure both parties understand and agree to the terms.</p>

        <h4 id="signing-process">Signing the Lease</h4>
        <p>When the tenant is ready, they sign the lease digitally using their device. The signature is captured securely and linked to their account. After the tenant signs, the lease goes to you for your signature as well. Once both parties have signed, the lease is considered complete and legally binding.</p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Signature Reminder</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Both signatures are required before the lease is finalized. If either party has not signed, the lease is not yet complete and the tenant should not move in until it is.</p>
        </div>

        <h3 id="lease-status">Lease Status Types</h3>
        <p>Throughout its lifecycle, a lease goes through different statuses:</p>
        <ul>
          <li><strong>Draft:</strong> The lease has been started but not yet sent to the tenant.</li>
          <li><strong>Pending Tenant Signature:</strong> The lease has been sent and is waiting for the tenant to sign.</li>
          <li><strong>Pending Landlord Signature:</strong> The tenant has signed and the lease is waiting for your signature.</li>
          <li><strong>Active:</strong> Both parties have signed and the lease is currently in effect.</li>
          <li><strong>Expired:</strong> The lease term has ended and the lease is no longer active.</li>
          <li><strong>Terminated:</strong> The lease was ended early before its scheduled end date.</li>
        </ul>

        <h3 id="document-storage">Secure Document Storage</h3>
        <p>All lease documents and related files are stored securely in iReside. You can access them anytime from your dashboard, download them for your records, or share them when needed.</p>

        <h4 id="organized-files">Organized File Management</h4>
        <p>Documents are organized by property and unit, making it easy to find what you need. Instead of searching through emails or physical files, you can quickly locate the exact lease document you are looking for.</p>

        <h4 id="version-history">Version History</h4>
        <p>If a lease is amended or renewed, the system keeps track of previous versions. You can always access the original lease and any subsequent amendments, creating a complete audit trail of the tenancy.</p>

        <h3 id="lease-amendments">Lease Amendments</h3>
        <p>Sometimes the terms of a lease need to change during the tenancy. This could be for a rent adjustment, extending the lease term, or modifying other conditions. iReside allows you to create amendments to an existing lease.</p>

        <h4 id="creating-amendment">Creating an Amendment</h4>
        <p>An amendment is a separate document that modifies specific terms of the original lease while keeping the rest of the agreement intact. To create one, you start from the existing lease, specify which terms are changing, and set the effective date of the amendment.</p>

        <h4 id="amendment-signatures">Signing Amendments</h4>
        <p>Like the original lease, amendments require signatures from both parties. The amendment process is the same as signing the original lease, with both tenant and landlord signing off on the changes digitally.</p>

        <h3 id="renewals">Lease Renewals</h3>
        <p>When a lease term is approaching its end, you may want to renew it with the same tenant. iReside can help you manage this process.</p>

        <h4 id="renewal-notifications">Renewal Reminders</h4>
        <p>You can set up automatic reminders to notify you when a lease is approaching its expiration date. This gives you time to decide whether you want to renew and to start conversations with your tenant well in advance.</p>

        <h4 id="renewal-process">Renewal Process</h4>
        <p>To renew a lease, you create a new lease document based on the current one, make any adjustments needed for the new term such as a rent increase, and send it to the tenant for signature. The old lease expires and the new one takes effect.</p>

        <h3 id="common-questions">Common Questions About Leases</h3>
        <p><strong>Can I use my own lease template?</strong></p>
        <p>iReside provides standard lease templates, but you can customize them to fit your needs. If you have an existing lease template from a lawyer, you can work with the iReside team to integrate it into the platform.</p>

        <p><strong>What happens if a tenant refuses to sign?</strong></p>
        <p>If a tenant has concerns about the lease terms, encourage them to voice those concerns before signing. You can discuss and potentially modify terms to reach an agreement. However, if a tenant ultimately refuses to sign, the lease is not valid and you should not allow them to move in.</p>

        <p><strong>Can I terminate a lease early?</strong></p>
        <p>Sometimes situations arise where either party wants to end the lease before its scheduled end. This could be due to a breach of contract, mutual agreement, or other circumstances. iReside supports early termination through the lease termination process, which creates the necessary documentation for both parties.</p>

        <p><strong>How long should I keep lease documents?</strong></p>
        <p>It is generally recommended to keep lease documents for several years after the lease ends, especially for tax and legal purposes. With iReside, your documents are stored securely as long as you need them, and you can download copies for your records anytime.</p>
      </div>
    ),
    next: "support/faq",
    prev: "landlord/maintenance",
  },
  "support/faq": {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers to common questions.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Here you will find answers to the most common questions about using iReside. Whether you are a tenant trying to understand how payments work or a landlord setting up your properties for the first time, this section covers the essentials. If you do not find what you are looking for here, check the Troubleshooting page or Contact Us.</p>

        <h3 id="general">General Questions</h3>
        
        <h4 id="what-is-ireside">What is iReside?</h4>
        <p>iReside is a property management platform that helps landlords and tenants manage the rental process digitally. For landlords, it provides tools to manage properties, screen tenants, collect rent, and handle maintenance. For tenants, it offers a simple way to apply for rentals, pay rent, submit maintenance requests, and communicate with landlords. Everything happens in one place, reducing the need for paperwork and multiple apps.</p>

        <h4 id="is-free">Is iReside free to use?</h4>
        <p>Yes, iReside is completely free for both tenants and landlords to use. There are no subscription fees, no monthly charges, and no hidden costs. Some optional services like background checks may involve fees if your landlord chooses to use them, but these are separate from the iReside platform itself.</p>

        <h4 id="who-uses">Who can use iReside?</h4>
        <p>iReside is designed for anyone involved in private property rentals. This includes landlords who own residential properties, dormitory operators, and property managers, as well as tenants who are looking for a place to rent. The platform is flexible and can accommodate different rental scenarios.</p>

        <h4 id="security">Is my data secure?</h4>
        <p>Yes, keeping your information safe is a top priority for iReside. Your personal and financial data is protected using industry-standard security measures. This includes encrypted data transmission, secure storage, and strict access controls. You can also add extra protection to your account by enabling two-factor authentication in your security settings.</p>

        <h3 id="account">Account Questions</h3>

        <h4 id="create-account">How do I create an account?</h4>
        <p>Landlords can create an account by visiting the iReside website and clicking the sign up button. You will be asked to provide your email address, create a password, and enter some basic information about yourself. You can also sign up using your Google account for faster registration. After signing up, you will go through a verification process to confirm your identity.</p>
        <p>Tenants do not typically create accounts in advance. Instead, your landlord will send you an application link when you express interest in a property. Once your application is approved and you sign the lease, your account is created automatically using the information you provided.</p>

        <h4 id="forgot-password">I forgot my password. What do I do?</h4>
        <p>If you forget your password, click the Forgot Password link on the login page. Enter the email address associated with your account, and we will send you instructions to reset your password. Follow the link in the email to create a new password. If you do not receive the email within a few minutes, check your spam folder.</p>

        <h4 id="two-factor">What is two-factor authentication?</h4>
        <p>Two-factor authentication, also known as 2FA, is an extra security layer for your account. When enabled, you will need to enter a verification code from your phone in addition to your password when logging in. This means even if someone discovers your password, they still cannot access your account without also having your phone. You can enable two-factor authentication in your account security settings.</p>

        <h4 id="change-email">How do I change my email address?</h4>
        <p>To change your email address, go to your account settings and look for the option to update your contact information. You will need to verify your new email address by clicking a link sent to it. Until the new email is verified, your old email remains the primary contact method for account notifications.</p>

        <h3 id="payments">Payment Questions</h3>

        <h4 id="pay-rent">How do I pay rent?</h4>
        <p>Tenants can pay rent through the Payments section of their dashboard. iReside currently supports two payment methods. The first is GCash, where you transfer the rent amount to your landlord's GCash account and then upload proof of payment including the reference number. The second is Cash or In-Person, where you notify your landlord of your intent to pay in cash and meet them to complete the payment. Your landlord will then confirm the payment in the system.</p>

        <h4 id="gcash-steps">What are the steps for GCash payment?</h4>
        <p>Here is the step-by-step process for paying via GCash. First, go to your Payments dashboard and select the invoice you want to pay. Choose GCash as your payment method. You will see your landlord's GCash details including their mobile number and sometimes a QR code. Open your GCash app and transfer the exact amount shown on the invoice. Take a screenshot of the confirmation screen in GCash. Back in iReside, enter the 13-digit reference number from your GCash confirmation and upload the screenshot. Submit the payment proof. Your landlord will verify the payment and confirm it in the system.</p>

        <h4 id="payment-timing">When is rent due?</h4>
        <p>Rent is due on the date specified in your lease agreement. This is typically the first day of each month, but some landlords prefer different due dates. Check your lease or ask your landlord to confirm the exact due date for your rent payments.</p>

        <h4 id="late-payments">What happens if I pay late?</h4>
        <p>The consequences for late payments depend on what your lease says and how your landlord handles the situation. Some landlords may charge a late fee after a grace period, while others may be more flexible. If you know you will be late, communicate with your landlord as soon as possible through the iReside messaging system. Most landlords appreciate being informed and are willing to work out a solution.</p>

        <h4 id="receipts">Can I get a receipt for my payment?</h4>
        <p>Yes. Once your landlord confirms your payment in iReside, a digital receipt is automatically generated. You can view and download receipts from your Payment History at any time. These receipts serve as official proof of payment and are useful for record keeping.</p>

        <h3 id="applications">Application Questions</h3>

        <h4 id="apply-online">How do I apply for a property online?</h4>
        <p>When you find a property you are interested in, ask the landlord for an application link. They will send you a unique link that takes you directly to the application form for that property. Fill out all the required information honestly and completely, upload any requested documents, and submit the application. The landlord will review it and get back to you with their decision.</p>

        <h4 id="documents-needed">What documents do I need to provide?</h4>
        <p>The documents required vary depending on what the landlord asks for. Common documents include proof of income such as recent pay stubs or bank statements, a valid government-issued ID like a driver license or passport, and reference letters from previous landlords if available. Check with the specific landlord to see exactly what they require from you.</p>

        <h4 id="application-status">How will I know if my application is approved?</h4>
        <p>You will receive a notification through the iReside app when the landlord makes a decision on your application. If approved, you will typically receive the lease agreement to review and sign. If not approved, the landlord may or may not provide a reason, depending on their preference.</p>

        <h3 id="maintenance">Maintenance Questions</h3>

        <h4 id="report-issue">How do I report a maintenance issue?</h4>
        <p>To report a maintenance issue, go to the Maintenance section of your dashboard and click the New Request or plus button. Fill out the form with details about the problem, including a clear title, a description of what is wrong, the category it falls under, and the priority level. You can also upload photos to help illustrate the issue. Once you submit the request, your landlord will be notified and can take action.</p>

        <h4 id="emergency-maintenance">What counts as a maintenance emergency?</h4>
        <p>Emergencies include situations that pose a safety hazard or risk of significant property damage. Examples are gas leaks, electrical hazards, major water leaks or flooding, broken locks that compromise security, and loss of essential services like water or electricity. For emergencies, contact emergency services first if needed, then report the issue through iReside so your landlord is aware and can respond.</p>

        <h4 id="maintenance-tracking">How do I track my maintenance request?</h4>
        <p>You can see the status of your maintenance requests in the Maintenance section of your dashboard. Each request shows its current status such as Submitted, Under Review, Approved, In Progress, or Completed. You will receive notifications when the status changes. You can also message your landlord directly if you have questions about a specific request.</p>

        <h3 id="leases">Lease and Document Questions</h3>

        <h4 id="view-lease">How do I view my lease agreement?</h4>
        <p>Your lease agreement and other documents are available in the Lease and Documents section of your dashboard. You can view, download, and print these documents anytime for your records. Having everything stored digitally means you never have to worry about losing important paperwork.</p>

        <h4 id="sign-digitally">How does digital signing work?</h4>
        <p>When you need to sign a document, you will receive a notification in the app. Open the document, read through it carefully, and if you agree to the terms, click the Sign button. Your signature is captured digitally and linked to your account. There is no need to print, scan, or upload anything. The process typically takes just a few minutes.</p>

        <h4 id="amend-lease">Can the lease be changed after signing?</h4>
        <p>Changes to a lease after it has been signed are called amendments. If both the landlord and tenant agree to modify certain terms, an amendment can be created and signed by both parties. The amendment becomes part of the overall lease agreement. To propose a change, contact your landlord through the messaging system and discuss what modification you would like to make.</p>

        <h3 id="landlord-questions">Questions for Landlords</h3>

        <h4 id="add-property">How do I add a new property?</h4>
        <p>To add a new property, go to your Properties section and click Add Property. Enter the property details including the address, property type, and description. Add photos to showcase the property. Save the property, and it will appear in your management dashboard. You can then add individual units and configure them for tenants.</p>

        <h4 id="invite-tenant">How do I invite a tenant to apply?</h4>
        <p>There are a few ways to invite tenants. You can send a direct application link to a specific person, or you can create a walk-in application if you meet someone in person who is interested. For online invites, go to your Applications section and create an invitation. Enter the applicant is basic information and send them the link via email or messaging apps.</p>

        <h4 id="verify-payment">How do I verify a GCash payment?</h4>
        <p>When a tenant submits proof of GCash payment, open your GCash app and look for the transaction using the reference number they provided. Confirm that the amount matches your invoice and that the transaction was made recently. If everything looks correct, go to the payment in your dashboard and click Confirm. This updates the invoice status to Paid and generates a receipt for the tenant.</p>
      </div>
    ),
    next: "support/troubleshooting",
    prev: "landlord/documents",
  },
  "support/troubleshooting": {
    title: "Troubleshooting",
    subtitle: "Solutions to common technical issues.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>Sometimes things do not work as expected, and that is okay. This page covers common issues that users encounter and how to resolve them. Try these solutions before contacting support, as they often fix the problem quickly. If you have tried these steps and still need help, scroll down to the Contact Us section at the bottom of this page.</p>

        <h3 id="login-issues">Login and Access Issues</h3>

        <h4 id="cant-login">I cannot log into my account</h4>
        <p>If you are having trouble logging in, here are some things to check. First, make sure you are using the correct email address associated with your account. Double-check for typos. Second, verify that your password is correct by looking at what you have typed. Passwords are case-sensitive, so check that caps lock is not accidentally on. Third, try clearing your browser cache or using a different browser. Sometimes old cached data causes login problems.</p>
        <p>If none of these work, click the Forgot Password link on the login page to reset your password. If you still cannot log in after resetting, you may need to contact support for further assistance.</p>

        <h4 id="account-locked">My account is locked</h4>
        <p>Account locking can happen if there are too many failed login attempts. This is a security feature to protect your account from unauthorized access. If your account is locked, wait about 15 minutes and try again. In the meantime, use the Forgot Password option to reset your password, which should unlock your account immediately.</p>

        <h4 id="two-factor-issues">I am having trouble with two-factor authentication</h4>
        <p>If you are not receiving the verification code, check that your phone has a good signal and that you can receive text messages. Make sure the time on your phone is set correctly, as incorrect time can cause authentication codes to be out of sync. If you have set up an authentication app, ensure the code has not expired. The code changes every few seconds, so wait for a new one if the current one does not work.</p>
        <p>If you have lost access to your two-factor method, use your backup codes if you saved them during setup. If you do not have backup codes, contact support with verification of your identity so they can help you regain access.</p>

        <h3 id="payment-issues">Payment Issues</h3>

        <h4 id="payment-not-confirmed">I submitted my payment proof but it is not confirmed</h4>
        <p>If your payment is showing as pending for a long time, first check that you submitted the proof correctly. Verify that you entered the correct 13-digit GCash reference number and that your screenshot clearly shows the transaction. If the reference number is wrong, you can resubmit with the correct information.</p>
        <p>Also make sure the amount you paid matches the invoice amount exactly. If there is a discrepancy, contact your landlord to clarify. If you paid in cash, make sure your landlord has confirmed receipt. You can send them a message through the platform to remind them to verify the payment.</p>

        <h4 id="wrong-amount">I paid the wrong amount</h4>
        <p>If you accidentally paid more than the invoice amount, contact your landlord through the messaging system. They can issue a refund for the difference or credit it toward your next rent. If you paid less than the invoice amount, the invoice will remain partially unpaid. You will need to pay the remaining balance to bring it to full payment.</p>
        <p>For GCash transactions, you can only receive refunds if the sender initiated the transaction as a refund. Work with your landlord to resolve any payment discrepancies.</p>

        <h4 id="gcash-error">GCash is not working or I cannot transfer</h4>
        <p>If GCash is not working for you, first check that the GCash app is updated to the latest version. Make sure you have sufficient balance in your GCash wallet to cover the transfer amount plus any fees. Check that you have not exceeded your transaction limits for the day or week.</p>
        <p>If GCash is down or experiencing issues, you may need to wait until the service is restored. Check GCash is official social media channels for status updates. In the meantime, if your landlord agrees, you can arrange an alternative payment method.</p>

        <h3 id="document-issues">Document Issues</h3>

        <h4 id="cant-upload">I cannot upload my documents</h4>
        <p>If you are having trouble uploading documents, first check the file format. Supported formats are typically JPG, PNG, and PDF. Make sure the file is not too large. If a file is very large, try compressing it or taking a lower resolution photo. Check your internet connection and try again. If the issue persists, try a different browser or device.</p>

        <h4 id="document-unclear">My uploaded document is blurry or hard to read</h4>
        <p>Clear, readable documents are important for verification. If your upload is blurry, try retaking the photo in better lighting. Hold your phone steady and make sure the document is flat. For IDs, avoid reflections or shadows that obscure the text. You can delete and reupload a new photo if needed.</p>

        <h4 id="missing-document">I cannot find my uploaded document</h4>
        <p>All your uploaded documents should appear in the Documents section of your account. If a document you uploaded is missing, first check if it is still being processed. Large files may take a moment to fully upload. Try refreshing the page. If the document still does not appear, try uploading it again.</p>

        <h3 id="notification-issues">Notification Issues</h3>

        <h4 id="not-receiving-notifications">I am not receiving notifications</h4>
        <p>If you are not getting notifications, first check your notification settings in your account profile. Make sure notifications are enabled for the types of alerts you want to receive. Next, check your phone is notification settings to ensure the iReside app is allowed to send notifications.</p>
        <p>If notifications are enabled but you still are not receiving them, check if your phone has a poor internet connection. Notifications require an active connection to be delivered. Also check if you have accidentally blocked notifications from iReside in your phone settings.</p>

        <h4 id="too-many-notifications">I am getting too many notifications</h4>
        <p>You can adjust which notifications you receive in your account settings. Go to Notifications and toggle off the types of alerts you do not want. For example, you might want payment reminders but not marketing updates. Customize your preferences to reduce noise while staying informed about what matters.</p>

        <h3 id="app-issues">App Performance Issues</h3>

        <h4 id="app-slow">The app is running slowly</h4>
        <p>If the app feels sluggish, try closing other apps running in the background to free up memory on your device. Clear your browser cache if you are using the web version. Make sure you have a stable internet connection. Restarting your browser or app can also help refresh its performance.</p>

        <h4 id="app-crashing">The app keeps crashing</h4>
        <p>If the app crashes frequently, first make sure you are using the latest version of the app or your browser. Updates often include fixes for stability issues. Try clearing your browser cache or app data and logging in again. If the problem continues, try using a different browser or device to see if the issue is specific to one setup.</p>

        <h4 id="page-not-loading">A page is not loading properly</h4>
        <p>If a specific page will not load, try refreshing your browser. Make sure you have a good internet connection. Sometimes specific pages can get stuck, and a refresh solves the issue. If the page still will not load, try clearing your browser cache and cookies, then reload the page.</p>

        <h3 id="maintenance-issues">Maintenance Request Issues</h3>

        <h4 id="request-not-received">My landlord did not receive my maintenance request</h4>
        <p>After you submit a maintenance request, your landlord should receive a notification. If they have not responded or acknowledged the request, first check that you submitted it correctly and received confirmation. Then consider sending your landlord a message through the platform to let them know you have submitted a request. They may have missed the notification.</p>

        <h4 id="status-wrong">The status of my maintenance request seems wrong</h4>
        <p>If you believe the status of your request is incorrect, message your landlord through the platform to clarify. The status should update as the request progresses through stages like Under Review, Approved, In Progress, and Completed. If there is a discrepancy between what you see and what your landlord has told you, a quick message can resolve the confusion.</p>

        <h3 id="data-issues">Data and Sync Issues</h3>

        <h4 id="data-not-saving">My changes are not saving</h4>
        <p>If you made changes to your profile or settings and they did not seem to save, first make sure you clicked the Save button if one was required. Check your internet connection, as changes need an active connection to sync. Wait a moment and refresh the page to see if the changes appear. If the problem persists, try logging out and back in before attempting again.</p>

        <h4 id="outdated-info">I am seeing outdated information</h4>
        <p>If you are seeing old data, try refreshing your browser or app. In most cases, a refresh will load the latest information. If the problem continues, clear your browser cache and try again. For data that involves others like your landlord, such as invoice status, there may be a delay while they update their side.</p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Before Contacting Support</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Try these troubleshooting steps first. Many issues can be resolved on your own without needing to contact support. This saves you time and lets our team focus on the cases that really need attention.</p>
        </div>

        <h3 id="contact-support">Still Need Help?</h3>
        <p>If you have tried the steps above and are still experiencing issues, please reach out to our support team. Provide as much detail as possible about the problem you are facing, including any error messages you have seen, what steps you have already tried, and screenshots if relevant. The more information you provide, the faster we can help you.</p>
        <p>Visit the Contact Us page to learn how to reach our support team.</p>
      </div>
    ),
    next: "support/contact",
    prev: "support/faq",
  },
"support/contact": {
    title: "Contact Us",
    subtitle: "We are here to help.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p>We want to make sure you have the best experience possible with iReside. If you have questions, encounter issues, or need assistance with anything, our support team is ready to help. This page explains how to reach us and what to expect when you do.</p>

        <h3 id="how-to-reach">How to Contact Support</h3>
        <p>The easiest way to reach our support team is through the contact form in the app or on our website. Fill out the form with your name, email address, and a detailed description of your question or issue. The more information you provide, the better equipped we will be to help you quickly.</p>
        <p>You can also message us through the help section in your dashboard if you need assistance with something specific to your account. This allows us to see your account details and provide more targeted help.</p>

        <h3 id="what-to-include">What to Include in Your Request</h3>
        <p>To get the fastest and most helpful response, please include the following information in your request:</p>
        <ul>
          <li><strong>Your account email:</strong> The email address associated with your iReside account.</li>
          <li><strong>A clear subject:</strong> Briefly summarize what your request is about, such as Payment Issue, Login Problem, or Maintenance Request Help.</li>
          <li><strong>Detailed description:</strong> Explain what you are experiencing, what you have already tried, and any error messages you have seen.</li>
          <li><strong>Screenshots:</strong> If applicable, attach screenshots that show the issue. This helps us understand the problem more clearly.</li>
          <li><strong>Your role:</strong> Let us know if you are a tenant or a landlord, and which property or unit your request relates to if applicable.</li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">Good Communication Gets Faster Results</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">Well-structured requests with clear details help our team understand and address your issue much faster than vague messages like Help or It is not working.</p>
        </div>

        <h3 id="response-time">Response Time Expectations</h3>
        <p>We aim to respond to all support requests as quickly as possible. Here is what you can generally expect:</p>
        <ul>
          <li><strong>General questions:</strong> We typically respond within 1 to 2 business days.</li>
          <li><strong>Technical issues:</strong> We typically respond within 1 to 2 business days and work to resolve issues as quickly as possible.</li>
          <li><strong>Urgent issues:</strong> If you have a genuine emergency related to your account security or a critical system failure, please indicate this in your subject line and we will prioritize your request.</li>
        </ul>
        <p>Business days are Monday through Friday, excluding public holidays. Requests submitted on weekends will be responded to on the next business day.</p>

        <h3 id="types-of-help">What We Can Help With</h3>
        <p>Our support team can assist you with a wide range of issues including:</p>
        <ul>
          <li>Account access problems and password resets</li>
          <li>Technical issues with the iReside platform</li>
          <li>Questions about features and how to use them</li>
          <li>Payment and invoice discrepancies</li>
          <li>Maintenance request status questions</li>
          <li>Document upload and signing issues</li>
          <li>Bug reports and feature suggestions</li>
        </ul>

        <h3 id="limitations">What We Cannot Help With</h3>
        <p>While we want to help with everything, there are some things outside the scope of iReside support. We cannot provide legal advice, so questions about lease terms, tenant rights, or local rental laws should be directed to a legal professional. We also cannot intervene in disputes between landlords and tenants, though we can help with technical issues related to platform usage.</p>

        <h3 id="feedback">Feedback and Suggestions</h3>
        <p>We are always looking to improve iReside. If you have feedback about features you would like to see, improvements to existing functionality, or ideas for how we can serve you better, we would love to hear from you. Send your suggestions through the same contact form and mark it as feedback. Your ideas help shape the future of the platform.</p>

        <h3 id="contact-info">Other Ways to Reach Us</h3>
        <p>For general inquiries, you can also reach us through our social media channels. However, for specific account issues, the in-app or website contact form is the fastest route since it routes your request directly to the appropriate team member.</p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">We Value Your Patience</p>
          <p className="m-0 text-text-medium text-sm">During busy periods, response times may be slightly longer than usual. We appreciate your patience and assure you that every request is important to us and will be addressed.</p>
        </div>

        <h3 id="escalation">Need to Escalate?</h3>
        <p>If you have submitted a request and feel it has not been addressed adequately, you can request an escalation. Reply to the support thread you have already started and explain why you feel the issue needs further attention. Please include your original ticket number if you have one. We will review your case and get back to you with an update.</p>

        <h3 id="self-help">Before You Contact Us</h3>
        <p>If you are experiencing a common issue, check our FAQ and Troubleshooting pages first. Many questions can be answered quickly by browsing these resources, and you may find a solution faster than waiting for a response. Visit the FAQ page or the Troubleshooting page to see if your question is already answered there.</p>
      </div>
    ),
    next: undefined,
    prev: "support/troubleshooting",
  },
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
        <h1 className="text-4xl font-semibold tracking-tight text-text-high">
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
          <p className="text-sm text-text-medium">Help us improve our documentation by providing feedback.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-divider hover:border-primary hover:text-primary">
            <ThumbsUp className="size-4" /> Yes, it was
          </Button>
          <Button variant="outline" className="gap-2 border-divider hover:border-red-500 hover:text-red-500">
            <ThumbsDown className="size-4" /> Not really
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
                <ArrowLeft className="size-4 mr-2" /> Previous
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
                Next <ArrowRight className="size-4 ml-2" />
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
