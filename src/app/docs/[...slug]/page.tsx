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
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">If you're applying for a place to rent, you don't need to complete this account setup. Your landlord will provide you with an application form or invitation link to fill out. Once your application is accepted and you've agreed to the lease, your account will be created for you automatically. You can skip directly to the Quick Start guide to learn about the tenant application process.</p>
        </div>

        <h3 id="roles">Getting Started as a Landlord</h3>
        <p>This page walks you through setting up a landlord account so you can manage your properties and invite tenants. If you're a landlord ready to get started, read on. The setup process is straightforward and takes just a few minutes.</p>

        <h3 id="registration">1. Start Your Registration</h3>
        <p>Next, you'll provide your basic information. Enter your first and last name along with your email address. You can also sign up through your Google account if you prefer a faster setup.</p>
        <p>Make sure you use an email address that you check regularly because we'll send important confirmations and updates there.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Pro Tip</p>
          <p className="m-0 text-text-medium italic text-sm">Choose an email address you use often. This is where we'll send payment confirmations, lease updates, and any important notifications about your account.</p>
        </div>

        <h3 id="email-verification">2. Verify Your Email</h3>
        <p>After you submit your registration, we'll send a verification email to the address you provided. Check your inbox (and your spam folder just in case) and click the confirmation link. This step ensures that you actually own the email address and helps keep your account secure.</p>
        <p>The verification link will expire after 24 hours, so if you don't see it right away, just go back and request a new one.</p>

        <h3 id="password">3. Create a Strong Password</h3>
        <p>Next, you'll create a password that protects your account. Make sure it's something unique that you don't use on other websites. A good password includes a mix of uppercase and lowercase letters, numbers, and special characters like exclamation points or dashes.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Security Reminder</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Keep your password private. We'll never ask you for it in an email or message. If anyone requests your password, it's a scam.</p>
        </div>

        <h3 id="profile">4. Complete Your Profile</h3>
        <p>Now it's time to fill in more details about yourself. The information you provide here helps build credibility and trust within the platform. Be honest and thorough in this section.</p>
        
        <h4>For Landlords:</h4>
        <p>Provide details about your property management experience and any relevant certifications. This builds trust with potential tenants and shows that you run a legitimate operation. You may also need to verify your business details and identity during this step.</p>

        <h3 id="photo">5. Add a Profile Photo (Optional)</h3>
        <p>Adding a photo helps personalize your account and builds trust with others on the platform. For landlords, this makes your profile more professional. You can use a professional headshot or a casual photo, whatever you feel comfortable sharing. You can skip this step if you prefer to add it later.</p>

        <h3 id="contact">6. Contact Information</h3>
        <p>Enter your phone number so that other users can reach you if needed. This is particularly important for resolving questions quickly or handling time-sensitive matters.</p>
        <p>You'll also confirm your preferred method of communication, whether that's through the iReside app, email, or SMS notifications.</p>

        <h3 id="notifications">7. Set Your Notification Preferences</h3>
        <p>Choose how you'd like iReside to keep you updated. You can decide whether you want email notifications, app notifications, or both. You can always adjust these settings later from your account preferences if your needs change.</p>
        <ul>
          <li><strong>Payment reminders:</strong> Get notified when rent is due</li>
          <li><strong>Messages:</strong> See alerts when a tenant or landlord sends you a message</li>
          <li><strong>Lease updates:</strong> Receive notifications about important lease changes or documents</li>
          <li><strong>Maintenance requests:</strong> Stay in the loop about repairs and property issues</li>
        </ul>

        <h3 id="security">8. Optional Security Settings</h3>
        <p>For extra protection, you can enable two-factor authentication on your account. This adds an additional security layer by requiring a second form of verification (like a code from your phone) whenever you log in from a new device.</p>
        <p>While this is optional, we recommend it, especially if you're managing properties or handling sensitive documents.</p>

        <h3 id="terms">9. Review and Accept Terms</h3>
        <p>Take a moment to read through our Terms of Service and Privacy Policy. These documents explain how we protect your data and what you can expect from the platform. Once you're comfortable with everything, check the box to confirm you accept our terms and continue.</p>

        <h3 id="confirmation">10. Confirm and Complete</h3>
        <p>Review your account information one final time to make sure everything looks correct. Once you're satisfied, click the finish button to activate your account. You're now officially part of the iReside community.</p>

        <h3 id="next-steps">What Happens Next?</h3>
        <p>After you complete your setup, the next steps depend on your role.</p>
        <p><strong>If you're a tenant:</strong> Note that as a tenant, you don't create an account upfront through this process. Instead, a landlord will provide you with a form to fill out, either through an invitation link or based on a face-to-face conversation. You'll submit your information through that form, go through the application process, and once you reach an agreement with the landlord, they'll accept you as a tenant. At that point, your account will be created automatically by the system using the information you provided.</p>
        <p><strong>If you're a landlord:</strong> You'll go through business verification (this protects everyone on the platform). After that, you can start adding your properties to the system and creating tenant application forms to send to prospective renters.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Important Note for Tenants</p>
          <p className="m-0 text-text-medium italic text-sm">If you're a tenant, you may not need to manually sign up here. Wait for your landlord to send you an application form or invitation link. Your account will be created for you once your application is approved and you've agreed to the lease terms.</p>
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
        <p>Welcome to iReside. Whether you're renting an apartment or managing properties, this guide will walk you through the basics so you can start using the platform right away. The steps are different depending on whether you're a tenant or a landlord, so pick the one that applies to you.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">What's the Difference?</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">A tenant is someone renting a space. A landlord is someone who owns the property and is renting it out. You'll see different options in the app based on which one you are.</p>
        </div>

        <h3 id="before-you-start">Before You Start</h3>
        <p>Here are a few things that will make the process smoother:</p>
        <ul>
          <li>Have an email address ready that you check regularly</li>
          <li>Keep your phone number handy in case you need to verify your identity</li>
          <li>If you have documents like your ID or lease, have them nearby</li>
          <li>Make sure you're in a place with a stable internet connection</li>
        </ul>

        <h3 id="how-long">How Long Does This Take?</h3>
        <p>For most people, the entire process takes between 5 to 15 minutes. If you have all your information ready, you can be done even faster.</p>
        
        <h3 id="tenants">Getting Started as a Tenant</h3>
        <p>If you're looking for a place to rent, here's what you need to know. The good news is that you don't have to create an account before you can apply. Your landlord will handle most of the setup for you.</p>

        <h4 id="tenant-step-1">Step 1: Wait for Your Landlord's Invitation</h4>
        <p>When you've found a place you're interested in, ask the landlord for an application form or invitation link. This is what starts the process. The landlord will send this to you through email or another contact method you've arranged with them.</p>

        <h4 id="tenant-step-2">Step 2: Fill Out Your Application</h4>
        <p>Once you get the invitation link or form, click it and you'll see an application. Fill out everything honestly and completely. This usually includes things like your employment information, how much money you make, references from past landlords or employers, and personal details about yourself.</p>
        <p>Don't worry if you're not sure about something. Most landlords are happy to answer questions about what they're looking for.</p>

        <h4 id="tenant-step-3">Step 3: Submit Any Required Documents</h4>
        <p>The landlord might ask you to upload documents to prove things you've written in your application. This could be a pay stub to show your income, a letter from a previous landlord as a reference, or a copy of your ID. The app will let you know exactly what's needed.</p>

        <h4 id="tenant-step-4">Step 4: Wait for a Response</h4>
        <p>After you submit your application, the landlord will review it. You'll get notifications in the app as they review your information. Some landlords move quickly, while others might take a few days. Be patient and keep checking your notifications.</p>

        <h4 id="tenant-step-5">Step 5: If Approved, Sign Your Lease</h4>
        <p>If the landlord likes your application, they'll send you the lease agreement to review. Take time to read through it and make sure you understand all the terms. The rent amount, how long you're renting, what utilities are included, and rules about pets or guests should all be clear. Once you're happy with everything, you'll sign it digitally right in the app.</p>

        <h4 id="tenant-step-6">Step 6: Your Account is Ready</h4>
        <p>After you sign the lease, your account will be created automatically. We'll send your login credentials to the email address you provided. Check your inbox and any spam folders for a message that contains your temporary username and password.</p>
        <p>You can now log in and access all the tools you need to manage your rental. This is where you'll pay rent, request repairs if something breaks, message your landlord, view your lease agreement, and access any other important documents.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">Important: Change Your Password Right Away</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">The password we send you is temporary and only meant for your first login. As soon as you log in, go to your account settings and create a new password that only you know. This keeps your account secure and protects your personal information. Choose a password that's different from ones you use elsewhere and includes a mix of letters, numbers, and special characters.</p>
        </div>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Quick Tip for Tenants</p>
          <p className="m-0 text-text-medium text-sm">Don't create an account on your own before your landlord invites you. Wait for them to send the invitation link. This makes sure everything is set up correctly and your information is stored safely.</p>
        </div>

        <h3 id="landlords">Getting Started as a Landlord</h3>
        <p>If you own properties and want to rent them out through iReside, here's how to get your account ready and start finding tenants.</p>

        <h4 id="landlord-step-1">Step 1: Sign Up for Your Account</h4>
        <p>Go to the iReside website and click the sign up button. Choose "I'm a landlord" when asked what role you play. You'll enter your email address, create a password, and give us some basic information about yourself. You can also sign up using your Google account if that's easier.</p>

        <h4 id="landlord-step-2">Step 2: Verify Your Identity</h4>
        <p>For security and trust, we need to confirm who you are. This is a standard process that protects everyone on the platform. You'll be asked to provide some identifying information and documents. This might include things like a government ID or proof of your business. Don't worry, we keep everything secure and private.</p>

        <h4 id="landlord-step-3">Step 3: Add Your Properties</h4>
        <p>Next, you'll add the properties you want to rent out. For each property, you'll enter details like the address, how many bedrooms and bathrooms it has, the monthly rent amount, and any special features. You can also add photos and a description to make it more appealing to tenants. If you have multiple units or properties, add them all here.</p>

        <h4 id="landlord-step-4">Step 4: Create Your Application Form</h4>
        <p>Decide what information you need from potential tenants. Do you want to know about their employment? Do you require references from past landlords? The app lets you customize your application form based on what's important to you. This form is what tenants will fill out when they apply.</p>

        <h4 id="landlord-step-5">Step 5: Find and Invite Tenants</h4>
        <p>When you're ready to rent out a property, send out application links to people who are interested. You can do this through email or by sharing a link directly. When someone receives your invitation, they'll fill out your application form.</p>

        <h4 id="landlord-step-6">Step 6: Review Applications and Make Your Decisions</h4>
        <p>As applications come in, you'll see all the information tenants have provided. You can review their employment details, references, and any documents they've uploaded. If you want to do background checks or verify their income, you can do that through iReside. Once you've decided on a tenant, you'll send them the lease to sign.</p>

        <h4 id="landlord-step-7">Step 7: Both Tenants and Landlords Can Manage Everything</h4>
        <p>After the lease is signed, you and your tenant can both use iReside to handle everything going forward. You'll collect rent payments, your tenant can request repairs or maintenance, you can both communicate through messaging, and all documents stay organized in one place.</p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-green-700 dark:text-green-300 m-0">You're in Control</p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm">As a landlord, you set the rules. You decide what questions are on your application, who you rent to, and how you want to communicate with your tenants. iReside just gives you the tools to manage it all in one place.</p>
        </div>

        <h3 id="what-comes-next">What Comes Next?</h3>
        <p>Now that you understand the basics, you're ready to dive deeper. Here are the next steps based on your role:</p>
        <ul>
          <li><strong>Tenants:</strong> Check out the section on submitting your application and what to expect as a renter</li>
          <li><strong>Landlords:</strong> Learn about managing your properties, handling tenant applications, and collecting rent payments</li>
          <li><strong>Everyone:</strong> Explore the platform features to get the most out of iReside</li>
        </ul>

        <h3 id="common-questions">Common Questions to Get Started</h3>
        <p><strong>Do I need to pay anything to use iReside?</strong></p>
        <p>No, iReside is completely free to use for both tenants and landlords right now. Some landlords might charge a small fee for background checks, but that's between you and them.</p>
        
        <p><strong>Is my information safe?</strong></p>
        <p>Yes. Your information is protected like a locked mailbox. When you send information to iReside, it travels through a secure connection so no one can peek at it in transit. Your account is password-protected, and we store your data on secure servers. We also have safeguards to make sure only you can access your account. If you want extra protection, you can turn on two-factor authentication, which is like having a second lock on your account.</p>
        
        <p><strong>What if I have a problem or get stuck?</strong></p>
        <p>We're here to help. You can reach out to our support team through the app, and we'll answer your questions or fix any issues as quickly as possible. Check the support section for more help options and answers to other common questions.</p>

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
        <p>When you find a place you like, the landlord will have you complete an application. There are two main ways this can happen. Either the landlord sends you an invitation link to apply online from home, or you meet with them in person where they may fill out the form themselves or you fill it out and then present your documents. In either case, you'll fill out information about yourself and provide documents to prove what you've said. Let's walk you through both methods so you know what to expect.</p>
        
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
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Most landlords ask for proof of income (like a pay stub), a valid ID, and references from previous landlords. Check with your landlord to see what they need. If you're meeting in person, bring original documents or clear copies. If you're applying online, you'll scan or photograph them before uploading.</p>
        </div>

        <h3 id="method-1-online">Method 1: Online Application (Remote)</h3>
        
        <h4 id="online-step-1">Step 1: Find Your Invitation Link</h4>
        <p>The landlord will send you an email with a special link to their application form. This link is unique to you and the property you're interested in. Check your email inbox and look for a message from the landlord. If you don't see it right away, check your spam or junk folder. The email should have clear instructions on how to proceed. If you can't find it, ask the landlord to send it again.</p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-blue-700 dark:text-blue-300 m-0">What is an Invitation Link?</p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm">This is a special link that the landlord creates just for you. It takes you directly to the application form for that specific property. Don't share this link with anyone else because it's meant just for you.</p>
        </div>

        <h4 id="online-step-2">Step 2: Fill Out Your Information</h4>
        <p>Click the link to start your application. You don't need to create a new account or password yet. Just start answering the questions. Take your time and answer everything honestly and completely. Being thorough now helps the landlord make a decision faster.</p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-bold text-primary m-0">Tip: Be Accurate</p>
          <p className="m-0 text-text-medium text-sm">Make sure all the information you enter is correct, especially your name, contact details, and income. Mistakes here can cause delays or problems later on.</p>
        </div>

        <h4 id="online-step-3">Step 3: Upload Your Documents</h4>
        <p>The landlord will ask you to provide documents to back up what you said in your application. You'll upload clear, readable copies of your documents right through the form. This might include a recent pay stub to show your income, a valid ID like a driver's license, and letters or contact information for previous landlords as references. Make sure each document is clear and easy to read. If something is blurry or cut off, the landlord might ask you to upload it again.</p>

        <h4 id="online-step-4">Step 4: Review and Submit</h4>
        <p>Before you submit, look everything over carefully. Check that your information is spelled correctly, all required fields are filled in, and your documents are clear. Once you're satisfied, click submit. You'll see a confirmation that your application was received, and you can usually print or save this as proof.</p>

        <h3 id="method-2-factoface">Method 2: Face-to-Face Application (In Person)</h3>
        
        <h4 id="factoface-option-a">Option A: Landlord Fills Out the Form</h4>
        <p>The landlord will meet with you and fill out the application form themselves. You'll tell them your information, and they'll enter it into the system. During this meeting, if you're bringing documents like pay stubs or references, the landlord will verify them in person. This way, everything is recorded right away, and you don't have to worry about uploading documents digitally. The landlord will typically mark off a checklist showing which documents they've seen and verified.</p>

        <h4 id="factoface-option-b">Option B: You Fill Out, Then Meet</h4>
        <p>The landlord sends you an invitation link just like the online method. You fill out your information and submit the form online. Then you schedule a time to meet the landlord in person to show your documents. During the meeting, the landlord will look at your actual documents (not just scanned copies), verify them, and mark them off in the checklist. This approach combines the convenience of online form-filling with the security of in-person document verification.</p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-bold text-yellow-700 dark:text-yellow-300 m-0">What to Bring to Your In-Person Meeting</p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm">Bring original documents or clear, readable copies. For income proof, bring recent pay stubs or bank statements. For ID, bring your actual driver's license, passport, or national ID. If you have letters from previous landlords, bring those too. The landlord will look at the originals to make sure they're real, then record that they've been verified in the system.</p>
        </div>

        <h3 id="what-information">What Information the Landlord Will Ask For</h3>
        <p>Regardless of which method you use, the landlord will collect similar information about you:</p>
        
        <h4>Your Basic Information</h4>
        <p>Your full legal name, email address, and phone number. Make sure these are correct because the landlord will use this information to contact you with their decision.</p>
        
        <h4>Your Move-In Date</h4>
        <p>When you plan to move in. Be realistic and honest about the date. If you're flexible, let the landlord know.</p>
        
        <h4>Your Job and Income</h4>
        <p>Your job title, who you work for, and how much you make each month before taxes. This helps the landlord understand if you can afford the rent.</p>
        
        <h4>Your Emergency Contact</h4>
        <p>A name and phone number for someone the landlord can reach if needed. This is usually a family member or close friend, not your employer.</p>
        
        <h4>Optional Notes</h4>
        <p>Some landlords give you space to write a short message about yourself. You can use this to explain your situation or share anything that would help your application. Keep it short and professional, and focus on being a good tenant.</p>

        <h3 id="documents-explained">Understanding the Documents</h3>
        
        <h4>Proof of Income</h4>
        <p>Usually a recent pay stub from your job showing your earnings. If you're self-employed, you might provide bank statements or tax records instead. Make sure it's recent (from the last month or two) so the landlord can see you're currently earning that income.</p>
        
        <h4>Valid ID</h4>
        <p>A government-issued ID like a driver's license, passport, or national ID card. This confirms you are who you say you are. Make sure the copy or original is clear and easy to read.</p>
        
        <h4>References</h4>
        <p>Letters from previous landlords or employers confirming that you're a good tenant or employee. If you don't have written letters, you can provide contact information for people who can vouch for you, and the landlord might call them directly.</p>
        
        <h4>Additional Documents</h4>
        <p>Depending on what the landlord needs, they might ask for other things. Whatever they ask for, do your best to provide it. Showing you're willing to cooperate and provide proof of what you've said makes your application stronger.</p>

        <h3 id="after-submitting">After You Submit Your Application</h3>
        <p>Now comes the waiting part. Different landlords take different amounts of time to review applications. Some might get back to you in a day or two, while others might take a week or longer.</p>
        
        <h4>What Happens Next</h4>
        <p>The landlord will review all the information and documents you provided. They'll look at your income to see if you can afford the rent, check your job history, and possibly call or contact your previous landlords to ask about you. You might get updates through the iReside app or by email as the landlord reviews your application.</p>
        
        <h4>If the Landlord Needs More Information</h4>
        <p>Sometimes the landlord might ask for something else. Maybe they want a clearer copy of a document or have a question about something you wrote. They'll contact you and let you know what they need. Try to provide it quickly so there's no delay.</p>
        
        <h4>If Your Application is Approved</h4>
        <p>Congratulations! The landlord will send you the lease agreement to review. This is the legal document that spells out all the terms of your rental, including the rent amount, start date, how long the lease lasts, what utilities are included, and any rules about pets or guests. Take time to read it carefully before you sign it. If you have questions about anything, ask the landlord before you commit.</p>
        
        <h4>If Your Application is Not Approved</h4>
        <p>If the landlord chooses a different applicant, they'll let you know. They're not always required to explain why, but if they do give you feedback, listen to it. It might help you with future applications. Don't give up. There are many properties and many landlords out there.</p>

        <h3 id="common-questions">Common Questions About Applying</h3>
        <p><strong>Can I apply to multiple properties at once?</strong></p>
        <p>Yes. There's no rule against applying to multiple places. This actually makes sense because you never know which landlord will accept your application. Just be realistic about managing multiple applications if several landlords accept you at the same time.</p>
        
        <p><strong>What if I don't have all the documents the landlord asked for?</strong></p>
        <p>Provide what you have and explain what's missing if possible. A landlord might be flexible, especially if you have a good reason. For example, if you're new to the job or just moved to the country, the landlord might understand that you don't have all the typical documents yet.</p>
        
        <p><strong>How long does it take to hear back?</strong></p>
        <p>This varies a lot. Some landlords review applications within a day or two. Others might take a week or more. If you haven't heard anything after a week, it's okay to politely ask for a status update.</p>
        
        <p><strong>Can I edit my application after I submit it?</strong></p>
        <p>Once you submit, you usually can't change it. That's why it's important to review everything before clicking submit. If you need to correct something or provide new information, contact the landlord directly and explain what happened.</p>
        
        <p><strong>Is it okay to ask someone to help me fill out the application?</strong></p>
        <p>Yes. If you need help understanding the questions or filling out the form, it's fine to ask someone you trust to help. Just make sure all the information you provide is true. Never lie on an application.</p>
        
        <p><strong>What's the difference between the two application methods?</strong></p>
        <p>The main difference is timing and who enters the information. With online applications, you fill everything out yourself and upload documents digitally. With face-to-face applications, either the landlord fills it out while you're there, or you fill it out online and then meet in person with the physical documents. Both methods cover the same information, so just follow whatever the landlord asks for.</p>

        <h3 id="tips-for-success">Tips to Help Your Application Stand Out</h3>
        <ul>
          <li>Answer every question the landlord asks. Leaving things blank makes it look like you're not interested or not paying attention.</li>
          <li>Be honest about everything. Landlords often respect honesty more than if they find out you lied later.</li>
          <li>Provide all the documents you can, even if the landlord didn't ask for them. Extra proof of income or a character reference can help your chances.</li>
          <li>Use the notes section to tell your story. Explain any gaps in your work history or anything else that stands out. Give context so the landlord understands your situation.</li>
          <li>Make sure your contact information is correct. Check your phone and email often during the application process so you don't miss messages from the landlord.</li>
          <li>Apply early. The sooner you apply, the sooner the landlord can consider you.</li>
          <li>Respect the landlord's timeline. Give them reasonable time to review applications. After about a week, it's fine to politely check in.</li>
        </ul>
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
        <p>Yes, iReside is completely free for both tenants and landlords. Some background check fees may apply depending on the landlord's requirements, but those are optional.</p>

        <h3>How do I pay rent?</h3>
        <p>Rent can be paid via bank transfer, credit card, or digital wallets. You can set up recurring payments to ensure you never miss a deadline.</p>

        <h3>Is my data secure?</h3>
        <p>Yes. Think of iReside like a bank for your rental information. Your data is protected by locks and safeguards so only you can see it. Your password keeps your account private, and we make sure your information stays safe on our servers. You can also add an extra layer of protection by turning on two-factor authentication if you'd like.</p>
      </div>
    ),
    next: "support/troubleshooting",
    prev: "/docs",
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
