import React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { T } from "@/context/LanguageContext";

// Mock content database
const DOCS_CONTENT: Record<string, { title: string; subtitle?: string; content: React.ReactNode; next?: string; prev?: string }> = {
  "getting-started/account-setup": {
    title: "Account Setup",
    subtitle: "Everything you need to know about setting up your iReside account in just a few minutes.",
    content: (
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p><T>The account creation process on iReside depends on your role. Landlords create accounts upfront to manage their properties and list units. Tenants, however, have a different workflow. Their accounts are created automatically once their application is approved and they reach an agreement with a landlord.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Are You a Tenant?</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>{"If you're applying for a place to rent, you don't need to complete this account setup. Your landlord will provide you with an application form or invitation link to fill out. Once your application is accepted and you've agreed to the lease, your account will be created for you automatically. You can skip directly to the Quick Start guide to learn about the tenant application process."}</T></p>
        </div>

        <h3 id="roles"><T>Getting Started as a Landlord</T></h3>
        <p><T>{"This page walks you through setting up a landlord account so you can manage your properties and invite tenants. If you're a landlord ready to get started, read on. The setup process is straightforward and takes just a few minutes."}</T></p>

        <h3 id="registration"><T>1. Start Your Registration</T></h3>
        <p><T>{"Next, you'll provide your basic information. Enter your first and last name along with your email address."}</T></p>
        <p><T>{"Make sure you use an email address that you check regularly because we'll send important confirmations and updates there."}</T></p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Pro Tip</T></p>
          <p className="m-0 text-text-medium italic text-sm"><T>{"Choose an email address you use often. This is where we'll send payment confirmations, lease updates, and any important notifications about your account."}</T></p>
        </div>

        <h3 id="email-verification"><T>2. Verify Your Email</T></h3>
        <p><T>{"After you submit your registration, we'll send a verification email to the address you provided. Check your inbox (and your spam folder just in case) and click the confirmation link. This step ensures that you actually own the email address and helps keep your account secure."}</T></p>
        <p><T>{"The verification link will expire after 24 hours, so if you don't see it right away, just go back and request a new one."}</T></p>

        <h3 id="password"><T>3. Create a Strong Password</T></h3>
        <p><T>{"Next, you'll create a password that protects your account. Make sure it's something unique that you don't use on other websites. A good password includes a mix of uppercase and lowercase letters, numbers, and special characters like exclamation points or dashes."}</T></p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Security Reminder</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"Keep your password private. We'll never ask you for it in an email or message. If anyone requests your password, it's a scam."}</T></p>
        </div>

        <h3 id="profile"><T>4. Complete Your Profile</T></h3>
        <p><T>{"Now it's time to fill in more details about yourself. The information you provide here helps build credibility and trust within the platform. Be honest and thorough in this section."}</T></p>
        
        <h4><T>For Landlords:</T></h4>
        <p><T>Provide details about your property management experience and any relevant certifications. This builds trust with potential tenants and shows that you run a legitimate operation. You may also need to verify your business details and identity during this step.</T></p>

        <h3 id="photo"><T>5. Add a Profile Photo (Optional)</T></h3>
        <p><T>Adding a photo helps personalize your account and builds trust with others on the platform. For landlords, this makes your profile more professional. You can use a professional headshot or a casual photo, whatever you feel comfortable sharing. You can skip this step if you prefer to add it later.</T></p>

        <h3 id="contact"><T>6. Contact Information</T></h3>
        <p><T>Enter your phone number so that other users can reach you if needed. This is particularly important for resolving questions quickly or handling time-sensitive matters.</T></p>
        <p><T>{"You'll also confirm your preferred method of communication, whether that's through the iReside app, email, or SMS notifications."}</T></p>

        <h3 id="notifications"><T>7. Set Your Notification Preferences</T></h3>
        <p><T>{"Choose how you'd like iReside to keep you updated. You can decide whether you want email notifications, app notifications, or both. You can always adjust these settings later from your account preferences if your needs change."}</T></p>
        <ul>
          <li><strong><T>Payment reminders:</T></strong> <T>Get notified when rent is due</T></li>
          <li><strong><T>Messages:</T></strong> <T>See alerts when a tenant or landlord sends you a message</T></li>
          <li><strong><T>Lease updates:</T></strong> <T>Receive notifications about important lease changes or documents</T></li>
          <li><strong><T>Maintenance requests:</T></strong> <T>Stay in the loop about repairs and property issues</T></li>
        </ul>

        <h3 id="security"><T>8. Optional Security Settings</T></h3>
        <p><T>For extra protection, you can enable two-factor authentication on your account. This adds an additional security layer by requiring a second form of verification (like a code from your phone) whenever you log in from a new device.</T></p>
        <p><T>{"While this is optional, we recommend it, especially if you're managing properties or handling sensitive documents."}</T></p>

        <h3 id="terms"><T>9. Review and Accept Terms</T></h3>
        <p><T>{"Take a moment to read through our Terms of Service and Privacy Policy. These documents explain how we protect your data and what you can expect from the platform. Once you're comfortable with everything, check the box to confirm you accept our terms and continue."}</T></p>

        <h3 id="confirmation"><T>10. Confirm and Complete</T></h3>
        <p><T>{"Review your account information one final time to make sure everything looks correct. Once you're satisfied, click the finish button to activate your account. You're now officially part of the iReside community."}</T></p>

        <h3 id="next-steps"><T>What Happens Next?</T></h3>
        <p><T>After you complete your setup, the next steps depend on your role.</T></p>
        <p><strong><T>{"If you're a tenant:"}</T></strong> <T>{"Note that as a tenant, you don't create an account upfront through this process. Instead, a landlord will provide you with a form to fill out, either through an invitation link or based on a face-to-face conversation. You'll submit your information through that form, go through the application process, and once you reach an agreement with the landlord, they'll accept you as a tenant. At that point, your account will be created automatically by the system using the information you provided."}</T></p>
        <p><strong><T>{"If you're a landlord:"}</T></strong> <T>{"You'll go through business verification (this protects everyone on the platform). After that, you can start adding your properties to the system and creating tenant application forms to send to prospective renters."}</T></p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Important Note for Tenants</T></p>
          <p className="m-0 text-text-medium italic text-sm"><T>{"If you're a tenant, you may not need to manually sign up here. Wait for your landlord to send you an application form or invitation link. Your account will be created for you once your application is approved and you've agreed to the lease terms."}</T></p>
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
        <p><T>{"Welcome to iReside. Whether you're renting an apartment or managing properties, this guide will walk you through the basics so you can start using the platform right away. The steps are different depending on whether you're a tenant or a landlord, so pick the one that applies to you."}</T></p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>{"What's the Difference?"}</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>{"A tenant is someone renting a space. A landlord is someone who owns the property and is renting it out. You'll see different options in the app based on which one you are."}</T></p>
        </div>

        <h3 id="before-you-start"><T>Before You Start</T></h3>
        <p><T>Here are a few things that will make the process smoother:</T></p>
        <ul>
          <li><T>Have an email address ready that you check regularly</T></li>
          <li><T>Keep your phone number handy in case you need to verify your identity</T></li>
          <li><T>If you have documents like your ID or lease, have them nearby</T></li>
          <li><T>{"Make sure you're in a place with a stable internet connection"}</T></li>
        </ul>

        <h3 id="how-long"><T>How Long Does This Take?</T></h3>
        <p><T>For most people, the entire process takes between 5 to 15 minutes. If you have all your information ready, you can be done even faster.</T></p>
        
        <h3 id="tenants"><T>Getting Started as a Tenant</T></h3>
        <p><T>{"If you're looking for a place to rent, here's what you need to know. The good news is that you don't have to create an account before you can apply. Your landlord will handle most of the setup for you."}</T></p>

        <h4 id="tenant-step-1"><T>{"Step 1: Wait for Your Landlord's Invitation"}</T></h4>
        <p><T>{"When you've found a place you're interested in, ask the landlord for an application form or invitation link. This is what starts the process. The landlord will send this to you through email or another contact method you've arranged with them."}</T></p>

        <h4 id="tenant-step-2"><T>Step 2: Fill Out Your Application</T></h4>
        <p><T>{"Once you get the invitation link or form, click it and you'll see an application. Fill out everything honestly and completely. This usually includes things like your employment information, how much money you make, references from past landlords or employers, and personal details about yourself."}</T></p>
        <p><T>{"Don't worry if you're not sure about something. Most landlords are happy to answer questions about what they're looking for."}</T></p>

        <h4 id="tenant-step-3"><T>Step 3: Submit Any Required Documents</T></h4>
        <p><T>{"The landlord might ask you to upload documents to prove things you've written in your application. This could be a pay stub to show your income, a letter from a previous landlord as a reference, or a copy of your ID. The app will let you know exactly what's needed."}</T></p>

        <h4 id="tenant-step-4"><T>Step 4: Wait for a Response</T></h4>
        <p><T>{"After you submit your application, the landlord will review it. You'll get notifications in the app as they review your information. Some landlords move quickly, while others might take a few days. Be patient and keep checking your notifications."}</T></p>

        <h4 id="tenant-step-5"><T>Step 5: If Approved, Sign Your Lease</T></h4>
        <p><T>{"If the landlord likes your application, they'll send you the lease agreement to review. Take time to read through it and make sure you understand all the terms. The rent amount, how long you're renting, what utilities are included, and rules about pets or guests should all be clear. Once you're happy with everything, you'll sign it digitally right in the app."}</T></p>

        <h4 id="tenant-step-6"><T>Step 6: Your Account is Ready</T></h4>
        <p><T>{"After you sign the lease, your account will be created automatically. We'll send your login credentials to the email address you provided. Check your inbox and any spam folders for a message that contains your temporary username and password."}</T></p>
        <p><T>{"You can now log in and access all the tools you need to manage your rental. This is where you'll pay rent, request repairs if something breaks, message your landlord, view your lease agreement, and access any other important documents."}</T></p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Important: Change Your Password Right Away</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"The password we send you is temporary and only meant for your first login. As soon as you log in, go to your account settings and create a new password that only you know. This keeps your account secure and protects your personal information. Choose a password that's different from ones you use elsewhere and includes a mix of letters, numbers, and special characters."}</T></p>
        </div>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Quick Tip for Tenants</T></p>
          <p className="m-0 text-text-medium text-sm"><T>{"Don't create an account on your own before your landlord invites you. Wait for them to send the invitation link. This makes sure everything is set up correctly and your information is stored safely."}</T></p>
        </div>

        <h3 id="landlords"><T>Getting Started as a Landlord</T></h3>
        <p><T>{"If you own properties and want to rent them out through iReside, here's how to get your account ready and start finding tenants."}</T></p>

        <h4 id="landlord-step-1"><T>Step 1: Sign Up for Your Account</T></h4>
        <p><T>{"Go to the iReside website and click the sign up button. Choose \"I'm a landlord\" when asked what role you play. You'll enter your email address, create a password, and give us some basic information about yourself."}</T></p>

        <h4 id="landlord-step-2"><T>Step 2: Verify Your Identity</T></h4>
        <p><T>{"For security and trust, we need to confirm who you are. This is a standard process that protects everyone on the platform. You'll be asked to provide some identifying information and documents. This might include things like a government ID or proof of your business. Don't worry, we keep everything secure and private."}</T></p>

        <h4 id="landlord-step-3"><T>Step 3: Add Your Properties</T></h4>
        <p><T>{"Next, you'll add the properties you want to rent out. For each property, you'll enter details like the address, how many bedrooms and bathrooms it has, the monthly rent amount, and any special features. You can also add photos and a description to make it more appealing to tenants. If you have multiple units or properties, add them all here."}</T></p>

        <h4 id="landlord-step-4"><T>Step 4: Create Your Application Form</T></h4>
        <p><T>{"Decide what information you need from potential tenants. Do you want to know about their employment? Do you require references from past landlords? The app lets you customize your application form based on what's important to you. This form is what tenants will fill out when they apply."}</T></p>

        <h4 id="landlord-step-5"><T>Step 5: Find and Invite Tenants</T></h4>
        <p><T>{"When you're ready to rent out a property, send out application links to people who are interested. You can do this through email or by sharing a link directly. When someone receives your invitation, they'll fill out your application form."}</T></p>

        <h4 id="landlord-step-6"><T>Step 6: Review Applications and Make Your Decisions</T></h4>
        <p><T>{"As applications come in, you'll see all the information tenants have provided. You can review their employment details, references, and any documents they've uploaded. If you want to do background checks or verify their income, you can do that through iReside. Once you've decided on a tenant, you'll send them the lease to sign."}</T></p>

        <h4 id="landlord-step-7"><T>Step 7: Both Tenants and Landlords Can Manage Everything</T></h4>
        <p><T>{"After the lease is signed, you and your tenant can both use iReside to handle everything going forward. You'll collect rent payments, your tenant can request repairs or maintenance, you can both communicate through messaging, and all documents stay organized in one place."}</T></p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-green-700 dark:text-green-300 m-0"><T>{"You're in Control"}</T></p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm"><T>As a landlord, you set the rules. You decide what questions are on your application, who you rent to, and how you want to communicate with your tenants. iReside just gives you the tools to manage it all in one place.</T></p>
        </div>

        <h3 id="what-comes-next"><T>What Comes Next?</T></h3>
        <p><T>{"Now that you understand the basics, you're ready to dive deeper. Here are the next steps based on your role:"}</T></p>
        <ul>
          <li><strong><T>Tenants:</T></strong> <T>Check out the section on submitting your application and what to expect as a renter</T></li>
          <li><strong><T>Landlords:</T></strong> <T>Learn about managing your properties, handling tenant applications, and collecting rent payments</T></li>
          <li><strong><T>Everyone:</T></strong> <T>Explore the platform features to get the most out of iReside</T></li>
        </ul>

        <h3 id="common-questions"><T>Common Questions to Get Started</T></h3>
        <p><strong><T>Do I need to pay anything to use iReside?</T></strong></p>
        <p><T>{"No, iReside is completely free to use for both tenants and landlords right now. Some landlords might charge a small fee for background checks, but that's between you and them."}</T></p>
        
        <p><strong><T>Is my information safe?</T></strong></p>
        <p><T>Yes. Your information is protected like a locked mailbox. When you send information to iReside, it travels through a secure connection so no one can peek at it in transit. Your account is password-protected, and we store your data on secure servers. We also have safeguards to make sure only you can access your account. If you want extra protection, you can turn on two-factor authentication, which is like having a second lock on your account.</T></p>
        
        <p><strong><T>What if I have a problem or get stuck?</T></strong></p>
        <p><T>{"We're here to help. You can reach out to our support team through the app, and we'll answer your questions or fix any issues as quickly as possible. Check the support section for more help options and answers to other common questions."}</T></p>

        <p><strong><T>Can I change my mind after signing?</T></strong></p>
        <p><T>That depends on your lease agreement and local laws. We recommend reading your lease carefully before you sign it. If you have questions about your rights or the terms, reach out to our support team or speak with a local housing organization.</T></p>
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
        <p><T>{"When you find a place you like, the landlord will have you complete an application. There are two main ways this can happen. Either the landlord sends you an invitation link to apply online from home, or you meet with them in person where they may fill out the form themselves or you fill it out and then present your documents. In either case, you'll fill out information about yourself and provide documents to prove what you've said. Let's walk you through both methods so you know what to expect."}</T></p>
        
        <h3 id="two-ways-to-apply"><T>Two Ways to Apply</T></h3>
        <p><T>Here are the main differences between the two application methods:</T></p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Method 1: Online Application (No Meeting)</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>The landlord sends you an invitation link. You fill out all your information online, upload your documents, and submit everything remotely. Everything is done from home at your own pace, and you never need to meet the landlord in person.</T></p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Method 2: Face-to-Face Application (In Person)</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Either the landlord fills out the application form with you in person, or you fill it out online and then meet them to show your physical documents. Documents are verified in person by the landlord before the application can move forward.</T></p>
        </div>

        <h3 id="before-applying"><T>Before You Start Your Application</T></h3>
        <p><T>Have these things ready so you can fill out your application smoothly without stopping:</T></p>
        <ul>
          <li><T>Your full legal name exactly as it appears on your ID</T></li>
          <li><T>Your email address and phone number</T></li>
          <li><T>Information about your current or most recent job like your job title, employer name, and how much you make each month</T></li>
          <li><T>The name and phone number of someone to contact in case of emergency</T></li>
          <li><T>The date when you plan to move in</T></li>
          <li><T>Any documents the landlord asked for like pay stubs, ID, or letters from previous landlords</T></li>
        </ul>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Document Checklist</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"Most landlords ask for proof of income (like a pay stub), a valid ID, and references from previous landlords. Check with your landlord to see what they need. If you're meeting in person, bring original documents or clear copies. If you're applying online, you'll scan or photograph them before uploading."}</T></p>
        </div>

        <h3 id="method-1-online"><T>Method 1: Online Application (Remote)</T></h3>
        
        <h4 id="online-step-1"><T>Step 1: Find Your Invitation Link</T></h4>
        <p><T>{"The landlord will send you an email with a special link to their application form. This link is unique to you and the property you're interested in. Check your email inbox and look for a message from the landlord. If you don't see it right away, check your spam or junk folder. The email should have clear instructions on how to proceed. If you can't find it, ask the landlord to send it again."}</T></p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>What is an Invitation Link?</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>{"This is a special link that the landlord creates just for you. It takes you directly to the application form for that specific property. Don't share this link with anyone else because it's meant just for you."}</T></p>
        </div>

        <h4 id="online-step-2"><T>Step 2: Fill Out Your Information</T></h4>
        <p><T>{"Click the link to start your application. You don't need to create a new account or password yet. Just start answering the questions. Take your time and answer everything honestly and completely. Being thorough now helps the landlord make a decision faster."}</T></p>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Tip: Be Accurate</T></p>
          <p className="m-0 text-text-medium text-sm"><T>Make sure all the information you enter is correct, especially your name, contact details, and income. Mistakes here can cause delays or problems later on.</T></p>
        </div>

        <h4 id="online-step-3"><T>Step 3: Upload Your Documents</T></h4>
        <p><T>{"The landlord will ask you to provide documents to back up what you said in your application. You'll upload clear, readable copies of your documents right through the form. This might include a recent pay stub to show your income, a valid ID like a driver's license, and letters or contact information for previous landlords as references. Make sure each document is clear and easy to read. If something is blurry or cut off, the landlord might ask you to upload it again."}</T></p>

        <h4 id="online-step-4"><T>Step 4: Review and Submit</T></h4>
        <p><T>{"Before you submit, look everything over carefully. Check that your information is spelled correctly, all required fields are filled in, and your documents are clear. Once you're satisfied, click submit. You'll see a confirmation that your application was received, and you can usually print or save this as proof."}</T></p>

        <h3 id="method-2-factoface"><T>Method 2: Face-to-Face Application (In Person)</T></h3>
        
        <h4 id="factoface-option-a"><T>Option A: Landlord Fills Out the Form</T></h4>
        <p><T>{"The landlord will meet with you and fill out the application form themselves. You'll tell them your information, and they'll enter it into the system. During this meeting, if you're bringing documents like pay stubs or references, the landlord will verify them in person. This way, everything is recorded right away, and you don't have to worry about uploading documents digitally. The landlord will typically mark off a checklist showing which documents they've seen and verified."}</T></p>

        <h4 id="factoface-option-b"><T>Option B: You Fill Out, Then Meet</T></h4>
        <p><T>The landlord sends you an invitation link just like the online method. You fill out your information and submit the form online. Then you schedule a time to meet the landlord in person to show your documents. During the meeting, the landlord will look at your actual documents (not just scanned copies), verify them, and mark them off in the checklist. This approach combines the convenience of online form-filling with the security of in-person document verification.</T></p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>What to Bring to Your In-Person Meeting</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"Bring original documents or clear, readable copies. For income proof, bring recent pay stubs or bank statements. For ID, bring your actual driver's license, passport, or national ID. If you have letters from previous landlords, bring those too. The landlord will look at the originals to make sure they're real, then record that they've been verified in the system."}</T></p>
        </div>

        <h3 id="what-information"><T>What Information the Landlord Will Ask For</T></h3>
        <p><T>Regardless of which method you use, the landlord will collect similar information about you:</T></p>
        
        <h4><T>Your Basic Information</T></h4>
        <p><T>Your full legal name, email address, and phone number. Make sure these are correct because the landlord will use this information to contact you with their decision.</T></p>
        
        <h4><T>Your Move-In Date</T></h4>
        <p><T>{"When you plan to move in. Be realistic and honest about the date. If you're flexible, let the landlord know."}</T></p>
        
        <h4><T>Your Job and Income</T></h4>
        <p><T>Your job title, who you work for, and how much you make each month before taxes. This helps the landlord understand if you can afford the rent.</T></p>
        
        <h4><T>Your Emergency Contact</T></h4>
        <p><T>A name and phone number for someone the landlord can reach if needed. This is usually a family member or close friend, not your employer.</T></p>
        
        <h4><T>Optional Notes</T></h4>
        <p><T>Some landlords give you space to write a short message about yourself. You can use this to explain your situation or share anything that would help your application. Keep it short and professional, and focus on being a good tenant.</T></p>

        <h3 id="documents-explained"><T>Understanding the Documents</T></h3>
        
        <h4><T>Proof of Income</T></h4>
        <p><T>{"Usually a recent pay stub from your job showing your earnings. If you're self-employed, you might provide bank statements or tax records instead. Make sure it's recent (from the last month or two) so the landlord can see you're currently earning that income."}</T></p>
        
        <h4><T>Valid ID</T></h4>
        <p><T>{"A government-issued ID like a driver's license, passport, or national ID card. This confirms you are who you say you are. Make sure the copy or original is clear and easy to read."}</T></p>
        
        <h4><T>References</T></h4>
        <p><T>{"Letters from previous landlords or employers confirming that you're a good tenant or employee. If you don't have written letters, you can provide contact information for people who can vouch for you, and the landlord might call them directly."}</T></p>
        
        <h4><T>Additional Documents</T></h4>
        <p><T>{"Depending on what the landlord needs, they might ask for other things. Whatever they ask for, do your best to provide it. Showing you're willing to cooperate and provide proof of what you've said makes your application stronger."}</T></p>

        <h3 id="after-submitting"><T>After You Submit Your Application</T></h3>
        <p><T>Now comes the waiting part. Different landlords take different amounts of time to review applications. Some might get back to you in a day or two, while others might take a week or longer.</T></p>
        
        <h4><T>What Happens Next</T></h4>
        <p><T>{"The landlord will review all the information and documents you provided. They'll look at your income to see if you can afford the rent, check your job history, and possibly call or contact your previous landlords to ask about you. You might get updates through the iReside app or by email as the landlord reviews your application."}</T></p>
        
        <h4><T>If the Landlord Needs More Information</T></h4>
        <p><T>{"Sometimes the landlord might ask for something else. Maybe they want a clearer copy of a document or have a question about something you wrote. They'll contact you and let you know what they need. Try to provide it quickly so there's no delay."}</T></p>
        
        <h4><T>If Your Application is Approved</T></h4>
        <p><T>Congratulations! The landlord will send you the lease agreement to review. This is the legal document that spells out all the terms of your rental, including the rent amount, start date, how long the lease lasts, what utilities are included, and any rules about pets or guests. Take time to read it carefully before you sign it. If you have questions about anything, ask the landlord before you commit.</T></p>
        
        <h4><T>If Your Application is Not Approved</T></h4>
        <p><T>{"If the landlord chooses a different applicant, they'll let you know. They're not always required to explain why, but if they do give you feedback, listen to it. It might help you with future applications. Don't give up. There are many properties and many landlords out there."}</T></p>

        <h3 id="common-questions"><T>Common Questions About Applying</T></h3>
        <p><strong><T>Can I apply to multiple properties at once?</T></strong></p>
        <p><T>{"Yes. There's no rule against applying to multiple places. This actually makes sense because you never know which landlord will accept your application. Just be realistic about managing multiple applications if several landlords accept you at the same time."}</T></p>
        
        <p><strong><T>{"What if I don't have all the documents the landlord asked for?"}</T></strong></p>
        <p><T>{"Provide what you have and explain what's missing if possible. A landlord might be flexible, especially if you have a good reason. For example, if you're new to the job or just moved to the country, the landlord might understand that you don't have all the typical documents yet."}</T></p>
        
        <p><strong><T>How long does it take to hear back?</T></strong></p>
        <p><T>{"This varies a lot. Some landlords review applications within a day or two. Others might take a week or more. If you haven't heard anything after a week, it's okay to politely ask for a status update."}</T></p>
        
        <p><strong><T>Can I edit my application after I submit it?</T></strong></p>
        <p><T>{"Once you submit, you usually can't change it. That's why it's important to review everything before clicking submit. If you need to correct something or provide new information, contact the landlord directly and explain what happened."}</T></p>
        
        <p><strong><T>Is it okay to ask someone to help me fill out the application?</T></strong></p>
        <p><T>{"Yes. If you need help understanding the questions or filling out the form, it's fine to ask someone you trust to help. Just make sure all the information you provide is true. Never lie on an application."}</T></p>
        
        <p><strong><T>{"What's the difference between the two application methods?"}</T></strong></p>
        <p><T>{"The main difference is timing and who enters the information. With online applications, you fill everything out yourself and upload documents digitally. With face-to-face applications, either the landlord fills it out while you're there, or you fill it out online and then meet in person with the physical documents. Both methods cover the same information, so just follow whatever the landlord asks for."}</T></p>

        <h3 id="tips-for-success"><T>Tips to Help Your Application Stand Out</T></h3>
        <ul>
          <li><T>{"Answer every question the landlord asks. Leaving things blank makes it look like you're not interested or not paying attention."}</T></li>
          <li><T>Be honest about everything. Landlords often respect honesty more than if they find out you lied later.</T></li>
          <li><T>{"Provide all the documents you can, even if the landlord didn't ask for them. Extra proof of income or a character reference can help your chances."}</T></li>
          <li><T>Use the notes section to tell your story. Explain any gaps in your work history or anything else that stands out. Give context so the landlord understands your situation.</T></li>
          <li><T>{"Make sure your contact information is correct. Check your phone and email often during the application process so you don't miss messages from the landlord."}</T></li>
          <li><T>Apply early. The sooner you apply, the sooner the landlord can consider you.</T></li>
          <li><T>{"Respect the landlord's timeline. Give them reasonable time to review applications. After about a week, it's fine to politely check in."}</T></li>
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
        <p><T>iReside simplifies rent collection by providing a direct channel between you and your landlord. All payments are handled manually through the platform to ensure security and transparency. Currently, iReside supports two primary payment methods: GCash and Cash/In-Person settlement.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>No Automatic Deductions</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>iReside does not automatically deduct money from your bank account or wallet. You must manually initiate each payment and provide proof of the transaction for your landlord to verify.</T></p>
        </div>

        <h3 id="gcash"><T>1. Paying via GCash (E-Wallet)</T></h3>
        <p><T>{"GCash is the most common way to pay rent on iReside. It involves an indirect integration where you send money directly to your landlord's GCash account and then record the transaction in the system."}</T></p>
        
        <h4><T>How it works:</T></h4>
        <ol>
          <li><strong><T>Access the Checkout Hub:</T></strong> <T>{"Go to your Payments dashboard and click \"Pay Now\" on a pending invoice."}</T></li>
          <li><strong><T>View Landlord Details:</T></strong> <T>{"Select \"GCash Wallet\" as your method. You will see your landlord's GCash Account Name, Mobile Number, and often a QR Code."}</T></li>
          <li><strong><T>Transfer Funds:</T></strong> <T>{"Open your GCash app and send the exact amount due to the landlord's number or scan their QR code."}</T></li>
          <li><strong><T>Save Your Receipt:</T></strong> <T>Take a screenshot of the successful transaction receipt in the GCash app.</T></li>
          <li><strong><T>Submit Proof:</T></strong> <T>Back in iReside, enter the</T> <strong><T>13-digit GCash Reference Number</T></strong> <T>and upload the screenshot you just took.</T></li>
        </ol>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Why the Reference Number Matters</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>The 13-digit reference number allows your landlord to quickly reconcile the payment in their own GCash transaction history. Always double-check this number before submitting.</T></p>
        </div>

        <h3 id="cash"><T>2. Paying via Cash (In-Person)</T></h3>
        <p><T>{"If you prefer to pay in person, you can use the \"Cash / In-Person\" option. This is common for tenants who live in the same building as their landlord or building manager."}</T></p>

        <h4><T>How it works:</T></h4>
        <ol>
          <li><strong><T>Trigger Intent:</T></strong> <T>{"In the Checkout Hub, select \"Cash / In-Person\". Click the \"Notify Landlord of Payment\" button. This lets your landlord know you are ready to pay."}</T></li>
          <li><strong><T>Meet and Pay:</T></strong> <T>Meet your landlord or manager in person to hand over the cash payment.</T></li>
          <li><strong><T>Landlord Confirmation:</T></strong> <T>After receiving the cash, your landlord will log into their dashboard and manually confirm the receipt.</T></li>
          <li><strong><T>Instant Receipt:</T></strong> <T>{"Once the landlord confirms, the invoice status will instantly change to \"Paid\" and you will receive a digital receipt in the app."}</T></li>
        </ol>

        <h3 id="verification"><T>Payment Verification Process</T></h3>
        <p><T>Once you submit a payment (either GCash proof or Cash intent), the invoice status will move to</T> <strong><T>{"\"Under Review\""}</T></strong> <T>or</T> <strong><T>{"\"Awaiting Confirmation\""}</T></strong>.</p>
        <ul>
          <li><strong><T>GCash Review:</T></strong> <T>Your landlord will check the uploaded screenshot and reference number against their GCash records.</T></li>
          <li><strong><T>Cash Review:</T></strong> <T>The status remains pending until the physical exchange of money is confirmed by the landlord.</T></li>
        </ul>
        <p><T>If there is an issue (e.g., wrong amount or unreadable receipt), your landlord may reject the proof. You will receive a notification explaining the reason and can resubmit the correct information.</T></p>

        <h3 id="partial-payments"><T>Partial Payments</T></h3>
        <p><T>If your landlord allows it, you can make partial payments toward an invoice. This is helpful for splitting rent into multiple installments. You will follow the same proof-of-payment workflow for each installment until the balance reaches zero.</T></p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-green-700 dark:text-green-300 m-0"><T>Payment History & Receipts</T></p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm"><T>Every confirmed payment generates a professional digital receipt that you can view or download at any time from your Payment History. These serve as your official proof of payment for the duration of your lease.</T></p>
        </div>

        <h3 id="audit-trail"><T>The Audit Trail & Platform Verification</T></h3>
        <p><T>Every interaction related to your payment is logged and stored securely within iReside. This creates a centralized, platform-verified history that helps eliminate the record-keeping gaps or misunderstandings that can occur with off-platform transfers.</T></p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Verified Record Keeping</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>By using iReside to record your GCash or Cash payments, both you and your landlord benefit from a synchronized ledger. Every status change is timestamped and linked to the specific account that performed the action, ensuring your payment history is always clear and accessible.</T></p>
        </div>

        <p><T>The audit trail captures the following events:</T></p>
        <ul>
          <li><strong><T>Exact Time of Submission:</T></strong> <T>When you uploaded your proof or triggered your cash intent.</T></li>
          <li><strong><T>Landlord Review Logs:</T></strong> <T>When the landlord opened your proof and whether they confirmed or rejected it.</T></li>
          <li><strong><T>Digital Receipt Issuance:</T></strong> <T>The moment your payment was officially receipted by the platform.</T></li>
          <li><strong><T>Modification History:</T></strong> <T>Any adjustments made to the balance (e.g., in the case of overpayments or partial payments).</T></li>
        </ul>

        <h3 id="security"><T>Security Reminders</T></h3>
        <ul>
          <li><strong><T>Only pay to verified accounts:</T></strong> <T>Only use the GCash details provided within the secure iReside Checkout Hub.</T></li>
          <li><strong><T>Always keep screenshots:</T></strong> <T>{"Even after the landlord confirms, it's good practice to keep your GCash receipts for a few months."}</T></li>
          <li><strong><T>Communicate:</T></strong> <T>If a payment will be late, use the built-in Messaging system to inform your landlord ahead of time.</T></li>
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
        <p><T>Living in a rental property means things sometimes need fixing. A leaky faucet, a broken appliance, or an issue with the heating system - whatever the problem, iReside makes it simple to report maintenance issues and track their progress from start to finish. You can submit requests, upload photos as proof, and even handle minor repairs yourself if your landlord approves.</T></p>

        <h3 id="overview"><T>What is a Maintenance Request?</T></h3>
        <p><T>{"A maintenance request is your way of telling your landlord that something in your home needs attention. Instead of calling, texting, or trying to catch your landlord in person, you can submit a request through iReside. Your landlord will see it right away, and both of you can track what's being done about it. This creates a clear record that both of you can access anytime."}</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Why Use Maintenance Requests?</T></p>
          <p className="m-0 text-text-medium text-sm"><T>Using iReside to report maintenance keeps everything organized. Your landlord gets your request immediately, you both have a record of what was reported and when, and you can see the status of repairs in real time. This helps prevent misunderstandings and makes sure problems get addressed promptly.</T></p>
        </div>

        <h3 id="types-of-issues"><T>What Issues Should You Report?</T></h3>
        <p><T>Report any problem in your home that your landlord is responsible for fixing. This includes:</T></p>
        <ul>
          <li><strong><T>Plumbing issues:</T></strong> <T>Leaks, dripping faucets, running toilets, clogged drains, or no water pressure</T></li>
          <li><strong><T>Electrical problems:</T></strong> <T>Outlets not working, flickering lights, or tripped breakers</T></li>
          <li><strong><T>Heating and cooling:</T></strong> <T>Air conditioning not working, heat not turning on, or temperature control problems</T></li>
          <li><strong><T>Appliance breakdowns:</T></strong> <T>Stove, refrigerator, oven, or other built-in appliances not working</T></li>
          <li><strong><T>Structural issues:</T></strong> <T>Cracks in walls, roof leaks, broken windows, or door problems</T></li>
          <li><strong><T>Pest problems:</T></strong> <T>Bugs, rodents, or other unwanted creatures</T></li>
          <li><strong><T>Other repairs:</T></strong> <T>Anything else that needs professional attention</T></li>
        </ul>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Important: Emergency Issues</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"If you have an emergency - like a gas leak, fire, electrical hazard, burst pipe, or break-in - don't wait to use iReside. Call emergency services immediately (911 in most places). Report the issue in the app after you've ensured your safety. Include emergency details in your description so your landlord knows what happened."}</T></p>
        </div>

        <h3 id="when-not-to-report"><T>When NOT to Submit a Request</T></h3>
        <p><T>{"Some things are your responsibility as a tenant, not the landlord's. Don't submit maintenance requests for:"}</T></p>
        <ul>
          <li><T>Regular cleaning or tidying up</T></li>
          <li><T>Issues caused by your own actions or negligence</T></li>
          <li><T>Personal items or furniture you brought into the home</T></li>
          <li><T>Damage you caused intentionally</T></li>
        </ul>
        <p><T>{"If you're unsure whether something is your responsibility, it's okay to ask your landlord. It's better to ask than to assume."}</T></p>

        <h3 id="how-to-submit"><T>How to Submit a Maintenance Request</T></h3>
        <p><T>The process is straightforward and takes just a few minutes.</T></p>

        <h4 id="step-1"><T>Step 1: Access the Maintenance Section</T></h4>
        <p><T>Log into your iReside account and go to the</T> <strong><T>Maintenance</T></strong> <T>{"section of your dashboard. This is usually in the main menu. You'll see a list of any previous maintenance requests you've submitted, along with their current status."}</T></p>

        <h4 id="step-2"><T>Step 2: Create a New Request</T></h4>
        <p><T>Click the</T> <strong><T>New Request</T></strong> <T>or</T> <strong>+</strong> <T>{"button to start creating a new maintenance request. This will open a form where you'll provide details about the problem."}</T></p>

        <h4 id="step-3"><T>Step 3: Describe the Issue</T></h4>
        <p><T>{"Give your request a clear, short title that describes the problem. For example: \"Leaky kitchen faucet,\" \"Air conditioner not cooling,\" or \"Broken bathroom door lock.\" Keep the title simple so your landlord knows immediately what the issue is."}</T></p>
        <p><T>{"Then write a more detailed description explaining what's wrong. Be specific. Instead of just saying \"Something is broken,\" explain: Where is the problem? When did you first notice it? What exactly is happening? Is it getting worse? For example: \"The kitchen sink faucet has been dripping constantly for three days. It drips about once per second even when turned off completely.\""}</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Pro Tip: Be Detailed</T></p>
          <p className="m-0 text-text-medium text-sm"><T>{"The more details you provide, the faster your landlord can respond. Include information like when the problem started, whether it's getting worse, and how it's affecting you. If you've already tried any fixes, mention that too."}</T></p>
        </div>

        <h4 id="step-4"><T>Step 4: Select a Category</T></h4>
        <p><T>{"Choose which type of issue you're reporting from the available categories. The system offers options like Plumbing, Electrical, HVAC, Appliances, Structural, Pest, and Other. Selecting the right category helps your landlord prioritize and route the request to the right person if they use a contractor."}</T></p>

        <h4 id="step-5"><T>Step 5: Add Photos or Videos</T></h4>
        <p><T>{"This is optional but highly recommended. If you can safely photograph or video the problem, do it. A picture is worth a thousand words and helps your landlord understand exactly what's happening. You can take multiple photos (up to 5) to show different angles or details."}</T></p>
        <p><T>To add photos, click the upload area and select images from your phone or computer. You can drag and drop images, or click to browse your files. Make sure the images are clear and show the problem well. If a photo is blurry or too dark, try retaking it.</T></p>

        <h4 id="step-6"><T>Step 6: Set a Priority Level</T></h4>
        <p><T>Indicate how urgent the issue is. Your options are typically Low, Medium, High, or Urgent. Be honest about the priority:</T></p>
        <ul>
          <li><strong><T>Low:</T></strong> <T>{"Minor issues that don't affect daily life - like a small scratch on a wall or a cabinet that doesn't close perfectly"}</T></li>
          <li><strong><T>Medium:</T></strong> <T>Issues that are inconvenient but not urgent - like a bathroom light that flickers occasionally</T></li>
          <li><strong><T>High:</T></strong> <T>Issues that seriously affect your comfort or safety - like heating not working in winter or multiple outlets not working</T></li>
          <li><strong><T>Urgent:</T></strong> <T>Critical issues that need immediate attention - like no water, gas smell, electrical hazard, or roof leak</T></li>
        </ul>

        <h4 id="step-7"><T>Step 7: Submit Your Request</T></h4>
        <p><T>{"Once you've filled in all the details, click"}</T> <strong><T>Submit Request</T></strong><T>{". The system will confirm that your request has been sent to your landlord. You'll see a confirmation message, and you can now track the status of your request."}</T></p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-green-700 dark:text-green-300 m-0"><T>Confirmation & Notifications</T></p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm"><T>{"After you submit, you'll receive a confirmation in the app. Your landlord will be notified right away. You can check your notification settings to decide whether you want email or app alerts about your request's progress."}</T></p>
        </div>

        <h3 id="self-repair-option"><T>Handling Minor Repairs Yourself</T></h3>
        <p><T>Sometimes the best solution for a small problem is to fix it yourself. iReside allows you to ask your landlord for permission to handle minor repairs on your own. This can be faster than waiting for someone else to come out, and it shows initiative.</T></p>

        <h4 id="self-repair-when"><T>When Might Self-Repair Work?</T></h4>
        <p><T>Self-repair is best for simple, low-risk issues like:</T></p>
        <ul>
          <li><T>Fixing a leaky faucet or toilet by replacing a part</T></li>
          <li><T>Resetting a circuit breaker</T></li>
          <li><T>Patching a small hole in drywall</T></li>
          <li><T>Cleaning out a clogged drain</T></li>
          <li><T>Replacing a light bulb or battery in a smoke detector</T></li>
        </ul>
        <p><T>However, you should NOT attempt self-repair for complex issues like major plumbing, electrical work, roof repairs, or structural problems. These need professional expertise.</T></p>

        <h4 id="how-to-request-self-repair"><T>How to Request Permission for Self-Repair</T></h4>
        <p><T>{"When you submit your maintenance request, there's an option to say \"I'd like to fix this myself if you approve.\" Toggle this option on. In your description, explain what you plan to do and why you think it's something you can handle safely. For example: \"The bathroom sink drain is clogged. I have a drain snake and think I can clear it myself.\""}</T></p>
        <p><T>{"Your landlord will review your request and either approve or decline. If they approve, you'll get instructions on what to do. If they decline, they'll arrange for a professional to handle it instead."}</T></p>

        <h4 id="self-repair-process"><T>What Happens if Your Landlord Approves?</T></h4>
        <p><T>{"Once approved, you can proceed with the repair. As you're working, the status will show your progress (repairing, done). When you've finished, you'll update the status to \"Done\" and potentially upload photos showing the completed repair so your landlord can verify everything is fixed."}</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Self-Repair Responsibility</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>{"If you attempt a repair and make it worse, you may be responsible for the damage. Only try repairs you're confident you can do safely. If something goes wrong during a landlord-approved self-repair, let your landlord know immediately and submit a new request to have a professional fix it."}</T></p>
        </div>

        <h3 id="tracking-status"><T>Tracking Your Maintenance Request</T></h3>
        <p><T>After you submit your request, you can always check its status in the Maintenance section.</T></p>

        <h4 id="status-meanings"><T>Understanding Status Updates</T></h4>
        <p><T>{"Your request will move through different statuses as it's handled:"}</T></p>
        <ul>
          <li><strong><T>Submitted:</T></strong> <T>{"Your request has been received and sent to your landlord. They'll review it soon."}</T></li>
          <li><strong><T>Under Review:</T></strong> <T>Your landlord is looking at your request and deciding how to proceed.</T></li>
          <li><strong><T>Assigned:</T></strong> <T>{"Your landlord has decided how the repair will be handled - either they'll do it, a contractor will handle it, or you'll fix it yourself."}</T></li>
          <li><strong><T>In Progress:</T></strong> <T>{"The repair work is currently being done. Either a professional is working on it or you're handling it yourself."}</T></li>
          <li><strong><T>Resolved:</T></strong> <T>The repair is complete. Your landlord has confirmed that the problem has been fixed.</T></li>
          <li><strong><T>Closed:</T></strong> <T>The request is fully done and archived in your history.</T></li>
        </ul>

        <h4 id="when-to-expect-updates"><T>How Long Does It Take?</T></h4>
        <p><T>{"Response times vary depending on the issue and your landlord's availability:"}</T></p>
        <ul>
          <li><strong><T>Emergency issues (unsafe):</T></strong> <T>Usually addressed within 24 hours</T></li>
          <li><strong><T>Important issues (affects comfort):</T></strong> <T>Usually addressed within 2-7 days</T></li>
          <li><strong><T>Minor issues:</T></strong> <T>May take 1-2 weeks</T></li>
        </ul>
        <p><T>{"Your lease agreement might specify response times, so check that if you want to know what's expected. If a significant amount of time has passed and you haven't heard anything, you can check in with your landlord through the messaging feature in iReside."}</T></p>

        <h4 id="photo-requests"><T>Photo Verification</T></h4>
        <p><T>{"Sometimes your landlord might ask you to provide photos showing that the repair is complete. For example, if you do a self-repair or if a contractor completes work, your landlord might ask for photos to verify the job was done well. You'll upload these right in the app, and your landlord will review them to confirm everything is satisfactory."}</T></p>

        <h3 id="communication"><T>Communicating About Your Requests</T></h3>
        <p><T>Throughout the maintenance process, you might need to share information or ask questions. iReside has built-in messaging so you can communicate directly with your landlord right within the app.</T></p>
        <ul>
          <li><T>If your landlord needs more details, they might message you asking clarifying questions</T></li>
          <li><T>If you think of additional information after submitting, you can add it through messages</T></li>
          <li><T>{"If something changes about your availability (you can't be home during repairs, for example), let your landlord know through messages"}</T></li>
          <li><T>All messages are tied to your specific maintenance request, so everything is organized together</T></li>
        </ul>

        <h3 id="request-history"><T>Viewing Your Request History</T></h3>
        <p><T>All your maintenance requests - past and present - are stored in your Maintenance section. You can view details of any request anytime: what was reported, when, what the issue was, and how it was resolved. This is helpful if you need to remember when something was fixed (useful for your own records) or if a similar problem comes up again.</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Complete Record</T></p>
          <p className="m-0 text-text-medium text-sm"><T>Your maintenance history in iReside serves as a documented record of what repairs have been done to the property. This is useful if there are ever disputes about the condition of your home when you move out.</T></p>
        </div>

        <h3 id="common-questions"><T>Common Questions About Maintenance Requests</T></h3>
        
        <p><strong><T>What if my landlord ignores my maintenance request?</T></strong></p>
        <p><T>{"If your landlord doesn't respond within a reasonable timeframe (check your lease for specifics), you can try messaging them through the app as a reminder. If the issue is urgent or affects your health and safety, you may have legal rights to have it repaired yourself and deduct costs from rent, depending on your location's rental laws. Contact your local tenant rights organization or legal advice if you're in this situation."}</T></p>
        
        <p><strong><T>Can I submit multiple maintenance requests at once?</T></strong></p>
        <p><T>{"Yes, you can submit multiple requests if you have multiple issues. However, it's often better to group related issues into one request if possible (for example, \"Multiple outlets not working in the kitchen\"). This helps your landlord prioritize their work."}</T></p>
        
        <p><strong><T>{"What if I take a photo and the issue isn't visible?"}</T></strong></p>
        <p><T>{"That's okay. Some problems (like strange noises, water pressure issues, or intermittent problems) aren't easy to photograph. Just describe what you're experiencing in detail, and your landlord will understand. Take a photo of the area if you can, or include anything that might help - like a photo of a control panel or a specific fixture."}</T></p>
        
        <p><strong><T>Can I request repairs after I move out?</T></strong></p>
        <p><T>{"Once you've moved out, maintenance requests won't be necessary - those become the responsibility of the new tenant or the landlord. However, if the damage existed while you lived there and wasn't fixed, you might need documentation. This is why keeping a record of your maintenance requests is important."}</T></p>
        
        <p><strong><T>{"What if I accidentally submit a request for something that's actually my responsibility?"}</T></strong></p>
        <p><T>{"Just let your landlord know through a message or by contacting them directly. There's no penalty for asking. It's better to ask and be told it's your responsibility than to let something deteriorate because you weren't sure."}</T></p>
        
        <p><strong><T>Can I cancel a maintenance request after submitting it?</T></strong></p>
        <p><T>{"Contact your landlord through messages and explain that you'd like to cancel the request. Most landlords are understanding about this, especially if you catch it quickly before they've started arranging repairs."}</T></p>

        <h3 id="tips-for-success"><T>Tips for Getting Your Issues Fixed Quickly</T></h3>
        <ul>
          <li><strong><T>Report issues promptly:</T></strong> <T>{"Don't wait until something gets worse. The sooner you report it, the sooner it can be fixed."}</T></li>
          <li><strong><T>Be specific:</T></strong> <T>{"The more details you provide, the faster your landlord can respond. Don't just say something is \"broken\" - explain what it's doing that's wrong."}</T></li>
          <li><strong><T>Include photos:</T></strong> <T>A clear photo helps your landlord assess the situation without needing to come investigate first.</T></li>
          <li><strong><T>Set the right priority:</T></strong> <T>Be honest about how urgent the issue is. This helps your landlord manage their time and respond to the most critical issues first.</T></li>
          <li><strong><T>Respond quickly to landlord questions:</T></strong> <T>If your landlord needs more information or wants to schedule repairs, respond promptly so things can move forward.</T></li>
          <li><strong><T>Keep communication in the app:</T></strong> <T>{"Use iReside messaging for discussions about the request so there's a record of everything."}</T></li>
          <li><strong><T>Accept reasonable response times:</T></strong> <T>Understanding that your landlord might not be available immediately helps set realistic expectations.</T></li>
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
        <p><T>Your lease agreement is the foundation of your rental relationship with your landlord. It outlines your rights and responsibilities, the monthly rent amount, when the lease begins and ends, house rules, and any special agreements between you and your landlord. iReside keeps your lease and all related documents organized in one secure place so you can always find and reference them whenever you need.</T></p>

        <h3 id="what-is-a-lease"><T>What is a Lease?</T></h3>
        <p><T>A lease is a legal contract between you (the tenant) and your landlord. It specifies the terms under which you rent the property. Think of it as an agreement that protects both you and your landlord. Your lease typically includes:</T></p>
        <ul>
          <li><strong><T>Property address:</T></strong> <T>The exact location you are renting</T></li>
          <li><strong><T>Lease dates:</T></strong> <T>When your lease starts and when it ends</T></li>
          <li><strong><T>Monthly rent amount:</T></strong> <T>How much you pay each month</T></li>
          <li><strong><T>Rent due date:</T></strong> <T>What day of the month rent is due</T></li>
          <li><strong><T>Security deposit amount:</T></strong> <T>Money you provide upfront as protection for the landlord</T></li>
          <li><strong><T>Utilities and services:</T></strong> <T>Which utilities you pay for and which the landlord covers</T></li>
          <li><strong><T>House rules:</T></strong> <T>Rules about noise, guests, pets, smoking, and other conduct</T></li>
          <li><strong><T>Maintenance responsibilities:</T></strong> <T>Who is responsible for what repairs</T></li>
          <li><strong><T>Lease termination conditions:</T></strong> <T>How and when either party can end the lease</T></li>
          <li><strong><T>Special agreements:</T></strong> <T>Any unique arrangements between you and your landlord</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Legally Binding Agreement</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Your lease is a legally binding contract. Both you and your landlord are expected to follow all terms. If either party violates the lease, there can be legal consequences. Make sure you understand and agree with all terms before signing.</T></p>
        </div>

        <h3 id="accessing-documents"><T>Accessing Your Documents</T></h3>
        <p><T>All your rental documents are stored in the Lease & Documents section of iReside. To access them:</T></p>
        <ol>
          <li><T>Log into your iReside account</T></li>
          <li><T>Navigate to the Lease & Documents section from your dashboard</T></li>
          <li><T>You will see a list of all documents related to your rental, organized by type</T></li>
          <li><T>Click on any document to view, download, or print it</T></li>
        </ol>
        <p><T>Documents typically include your lease agreement, house rules, move-in inspection reports, amendment agreements, and any other files your landlord has shared with you.</T></p>

        <h4 id="viewing-documents"><T>Viewing Your Lease</T></h4>
        <p><T>When you click on a document, it opens in a preview window. From there, you can:</T></p>
        <ul>
          <li><strong><T>Read the full text:</T></strong> <T>Scroll through the document to read all terms and conditions</T></li>
          <li><strong><T>Download:</T></strong> <T>Save the document to your device for your personal records</T></li>
          <li><strong><T>Print:</T></strong> <T>Print a physical copy to keep in a folder or file</T></li>
          <li><strong><T>Share:</T></strong> <T>Send a copy to a family member, lawyer, or anyone else who needs to see it</T></li>
          <li><strong><T>Search:</T></strong> <T>Use the search function to find specific terms or sections quickly</T></li>
        </ul>

        <h4 id="downloading-printing"><T>Downloading and Printing</T></h4>
        <p><T>It is a good idea to keep a physical copy and a digital backup of your lease. You can download it as a PDF file to your computer or phone, making it accessible even if you are offline. Many tenants also print a copy and keep it in a safe place at home. This is especially important if you ever have disputes with your landlord - having a signed copy proves what you both agreed to.</T></p>

        <h3 id="lease-signing"><T>Understanding the Lease Signing Process</T></h3>
        <p><T>Before your lease becomes active, both you and your landlord need to sign it. iReside makes this process simple and secure by allowing digital signatures.</T></p>

        <h4 id="receiving-lease"><T>Step 1: Receiving Your Lease</T></h4>
        <p><T>After you and your landlord have agreed on the rental terms, your landlord will prepare the lease in iReside and send it to you. You will receive a notification that a lease is waiting for your review. The lease will appear in your Lease & Documents section with a status showing Pending Your Signature.</T></p>

        <h4 id="reviewing-lease"><T>Step 2: Reviewing Your Lease</T></h4>
        <p><T>Take time to carefully read through the entire lease. Pay special attention to:</T></p>
        <ul>
          <li><strong><T>Dates:</T></strong> <T>Make sure the start and end dates match what you agreed to</T></li>
          <li><strong><T>Rent amount:</T></strong> <T>Verify the monthly rent is correct</T></li>
          <li><strong><T>Special terms:</T></strong> <T>Check for any agreements you made with your landlord</T></li>
          <li><strong><T>House rules:</T></strong> <T>Make sure the rules are clear and something you can follow</T></li>
          <li><strong><T>Responsibilities:</T></strong> <T>Confirm who is responsible for repairs and maintenance</T></li>
        </ul>
        <p><T>If you notice any errors or disagree with something in the lease, do not sign it yet. Contact your landlord through the iReside messaging system and discuss the issue before proceeding.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Read Before You Sign</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Never sign a lease without reading it carefully. If you do not understand something, ask your landlord or consider consulting with a lawyer. Once you sign, you are legally bound to follow all the terms.</T></p>
        </div>

        <h4 id="signing-lease"><T>Step 3: Signing Your Lease</T></h4>
        <p><T>When you are ready to sign, click the Review and Sign button on the lease. iReside will guide you through the signing process:</T></p>
        <ol>
          <li><T>You will review the final lease document one more time</T></li>
          <li><T>You will be asked to confirm your agreement to the terms</T></li>
          <li><T>You will digitally sign the lease using your mouse, trackpad, or touchscreen</T></li>
          <li><T>Your signature, full name, and the date will be recorded automatically</T></li>
          <li><T>A confirmation message will appear showing your signature was received</T></li>
        </ol>
        <p><T>Your digital signature is legally valid and serves the same purpose as a handwritten signature. It proves that you reviewed and agreed to the lease terms.</T></p>

        <h4 id="landlord-signs"><T>Step 4: Waiting for Landlord Signature</T></h4>
        <p><T>After you sign, the lease goes to your landlord for their signature. During this time, the lease status will show Pending Landlord Signature. You can continue to view and download the lease, but you will not be able to make changes. Wait for your landlord to sign before the lease becomes officially active.</T></p>
        <p><T>Most landlords sign quickly, usually within a day or two. If your landlord takes longer than a week, you can send them a friendly reminder through iReside messaging.</T></p>

        <h4 id="lease-active"><T>Step 5: Lease Becomes Active</T></h4>
        <p><T>Once your landlord signs, the lease status changes to Active. This is the official start of your tenancy. Both of you are now bound by all the terms in the lease. You can no longer make changes to an active lease - if either party wants to modify terms, you will need to create a lease amendment (see below).</T></p>

        <h3 id="document-types"><T>Types of Documents in Your Lease & Documents Section</T></h3>
        <p><T>Beyond your main lease agreement, your Lease & Documents section may include other important files:</T></p>

        <h4 id="house-rules"><T>House Rules</T></h4>
        <p><T>These detail the specific rules for your rental property. Common house rules include policies on noise levels, quiet hours, pets, smoking, guests, parking, and use of common areas. House rules help create a respectful living environment for all residents.</T></p>

        <h4 id="move-in-inspection"><T>Move-In Inspection Report</T></h4>
        <p><T>This document is completed when you first move in. It describes the condition of the property - what is working, what is damaged, what is clean, etc. Both you and your landlord sign this report. It is important because it establishes the baseline condition of the property. When you move out, this report is compared to a move-out inspection to determine if damage is normal wear and tear (landlord responsibility) or tenant-caused damage (your responsibility).</T></p>

        <h4 id="amendments"><T>Lease Amendments</T></h4>
        <p><T>Sometimes you and your landlord might want to change something in the lease after it is already signed. For example, you might want to add a pet, or your landlord might adjust the rent if you renew your lease. Instead of creating an entirely new lease, you create an amendment - a document that modifies specific terms of the original lease. Amendments must be signed by both parties, just like the original lease.</T></p>

        <h4 id="other-documents"><T>Other Documents</T></h4>
        <p><T>Your landlord may also share other important documents such as utility information, parking permits, security system instructions, keys and access information, or community guidelines if you are renting in a multi-unit building.</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Keep Everything Organized</T></p>
          <p className="m-0 text-text-medium text-sm"><T>Your Lease & Documents section automatically keeps all your rental documents organized and searchable. But it is still a good idea to download and save important documents like your lease and move-in inspection to your own computer or cloud storage, just in case.</T></p>
        </div>

        <h3 id="lease-amendments"><T>Making Changes: Lease Amendments</T></h3>
        <p><T>Your lease is a living document. If you and your landlord agree to change something, you do not need to create a brand new lease. Instead, you create an amendment.</T></p>

        <h4 id="when-amend"><T>When Might You Need an Amendment?</T></h4>
        <p><T>Common reasons for lease amendments include:</T></p>
        <ul>
          <li><strong><T>Rent increase:</T></strong> <T>Your landlord wants to raise your rent (usually happens at lease renewal)</T></li>
          <li><strong><T>Adding a roommate:</T></strong> <T>You want to add another person to the lease</T></li>
          <li><strong><T>Pet policy change:</T></strong> <T>You want to add a pet, or your landlord approves a pet exception</T></li>
          <li><strong><T>Lease term extension:</T></strong> <T>You are renewing your lease for another year or longer</T></li>
          <li><strong><T>Early termination:</T></strong> <T>Both you and your landlord agree to end the lease early</T></li>
          <li><strong><T>Service changes:</T></strong> <T>Who pays for certain utilities or services is changing</T></li>
          <li><strong><T>Maintenance responsibility changes:</T></strong> <T>The landlord is taking over or you are taking over a particular responsibility</T></li>
        </ul>

        <h4 id="amendment-process"><T>How the Amendment Process Works</T></h4>
        <p><T>When an amendment is needed:</T></p>
        <ol>
          <li><strong><T>Your landlord proposes the change:</T></strong> <T>They create an amendment in iReside describing what will change</T></li>
          <li><strong><T>You review it:</T></strong> <T>You receive a notification and can view the proposed amendment</T></li>
          <li><strong><T>You discuss if needed:</T></strong> <T>If you have questions or disagree, use iReside messaging to discuss before signing</T></li>
          <li><strong><T>You sign:</T></strong> <T>If you agree, you digitally sign the amendment</T></li>
          <li><strong><T>Your landlord signs:</T></strong> <T>They review and sign to finalize the amendment</T></li>
          <li><strong><T>Amendment becomes effective:</T></strong> <T>Once signed by both parties, the changes take effect on the date specified in the amendment</T></li>
        </ol>
        <p><T>The original lease stays in your records, and the amendment is stored alongside it. Together, they represent your current rental agreement.</T></p>

        <h3 id="security"><T>Document Security and Privacy</T></h3>
        <p><T>Your lease and documents contain sensitive personal information. iReside takes your privacy seriously:</T></p>
        <ul>
          <li><strong><T>Encrypted storage:</T></strong> <T>Your documents are stored securely on encrypted servers</T></li>
          <li><strong><T>Limited access:</T></strong> <T>Only you and your landlord can access your lease and documents</T></li>
          <li><strong><T>No third-party sharing:</T></strong> <T>We do not share your documents with anyone without your explicit permission</T></li>
          <li><strong><T>Download for backup:</T></strong> <T>You can download your documents anytime for your personal backup copies</T></li>
          <li><strong><T>Retention:</T></strong> <T>Your documents stay in your account even after your lease ends, so you have a permanent record</T></li>
        </ul>

        <h3 id="common-questions"><T>Common Questions About Leases and Documents</T></h3>

        <p><strong><T>What if I disagree with something in the lease?</T></strong></p>
        <p><T>Do not sign it. Instead, contact your landlord through iReside messaging to discuss your concerns. You can propose changes, and if you both agree, the landlord can revise the lease and send you the updated version. Negotiating before signing is much easier than trying to change things after you have already signed.</T></p>

        <p><strong><T>Can I print my lease?</T></strong></p>
        <p><T>Yes. You can download the lease as a PDF and print it on your home printer, or use your device is print function. Having a physical copy is recommended.</T></p>

        <p><strong><T>What if my landlord loses their copy of the lease?</T></strong></p>
        <p><T>Not a problem. Both of you have access to the signed lease in iReside anytime. It is stored permanently in your account history.</T></p>

        <p><strong><T>Can I share my lease with someone else (like a lawyer)?</T></strong></p>
        <p><T>You can download your lease and share the PDF with anyone you want. You might want to share it with a lawyer for review, a family member for advice, or someone else for any reason. It is your document.</T></p>

        <p><strong><T>What if I sign the lease and then change my mind?</T></strong></p>
        <p><T>Once you sign, the lease is legally binding. Changing your mind after signing has serious consequences. That is why it is so important to carefully review before you sign. If you truly need to back out, you would need to contact your landlord and negotiate, but they are under no obligation to let you out of the lease.</T></p>

        <p><strong><T>Will my digital signature hold up in court?</T></strong></p>
        <p><T>Yes. Digital signatures are legally recognized and enforceable in most jurisdictions. iReside is signing system records your signature, your name, and the exact timestamp, making it a secure and legally valid signature.</T></p>

        <p><strong><T>How long do my documents stay in iReside?</T></strong></p>
        <p><T>Permanently. Even after your lease ends and you move out, your documents remain in your account. This is valuable because you have a complete record of your tenancy.</T></p>

        <p><strong><T>What if there is a dispute about what the lease says?</T></strong></p>
        <p><T>The signed lease in your iReside account is the official record. Both you and your landlord have access to the exact same document with your signatures and timestamps. This makes disputes easier to resolve because there is no ambiguity about what was agreed to.</T></p>

        <h3 id="best-practices"><T>Best Practices for Managing Your Lease</T></h3>
        <ul>
          <li><strong><T>Read carefully:</T></strong> <T>Before signing, take time to read every word of your lease.</T></li>
          <li><strong><T>Ask questions:</T></strong> <T>If something is unclear, ask your landlord for clarification before signing.</T></li>
          <li><strong><T>Keep backup copies:</T></strong> <T>Download and save your lease to your personal computer or cloud storage.</T></li>
          <li><strong><T>Document everything:</T></strong> <T>If you and your landlord make any verbal agreements, request that they be added to the lease as an amendment.</T></li>
          <li><strong><T>Reference your lease:</T></strong> <T>When issues come up, refer back to the lease to understand what was agreed.</T></li>
          <li><strong><T>Maintain the property:</T></strong> <T>Follow the lease terms regarding maintenance and care of the property.</T></li>
          <li><strong><T>Communicate changes:</T></strong> <T>If either you or your landlord want to change lease terms, handle it through official amendments rather than verbal agreements.</T></li>
          <li><strong><T>Keep receipts:</T></strong> <T>Maintain records of rent payments and any expenses related to your lease obligations.</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Legal Disclaimer</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>The information provided here is for general educational purposes and should not be considered legal advice. Rental laws vary by location, and your specific situation may have unique considerations. If you have legal questions about your lease or rental rights, please consult with a qualified attorney in your jurisdiction.</T></p>
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
        <p><T>Moving is one of the most significant events in your rental journey. Whether you are moving into your first rental home or preparing to leave your current place, iReside helps make this transition as smooth as possible. This section walks you through everything you need to know about the moving process, from the moment you get your keys to the day you hand them back.</T></p>

        <h3 id="moving-in"><T>Moving In</T></h3>
        <p><T>When your application is approved and your lease is signed, you will be ready to move in. The move-in process involves several important steps that set the foundation for your tenancy.</T></p>

        <h4 id="move-in-date"><T>Your Move-In Date</T></h4>
        <p><T>During the application process, you provided your intended move-in date. This date becomes part of your lease agreement and marks when your tenancy officially begins. Your landlord will prepare the property for you by this date, ensuring everything is clean and ready for your arrival.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Coordinate with Your Landlord</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Contact your landlord a day or two before your move-in date to confirm the exact time you can pick up the keys. This helps you plan your moving schedule and ensures someone will be available to hand over the keys.</T></p>
        </div>

        <h4 id="move-in-inspection"><T>The Move-In Inspection</T></h4>
        <p><T>When you move in, you and your landlord will walk through the property together to document its condition. This is called a move-in inspection, and it serves as a record of the property condition on the day you take possession.</T></p>
        <p><T>During this inspection, you will go room by room and note any existing issues. This might include scratches on walls, stains on carpet, fixtures that do not work, or any damage that is already present. Both you and your landlord will sign off on this inspection report, which becomes part of your tenancy records.</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Why This Matters</T></p>
          <p className="m-0 text-text-medium text-sm"><T>The move-in inspection protects you from being charged for damage that existed before you moved in. When you eventually move out, the landlord will compare the property condition to this baseline. Any new damage beyond normal wear and tear may come from your security deposit.</T></p>
        </div>

        <h4 id="getting-keys"><T>Getting Your Keys and Access</T></h4>
        <p><T>Once the inspection is complete, your landlord will give you the keys to your new home. Depending on the property, you might receive door keys for the main entrance, mailbox key if your building has individual mailboxes, garage or parking keys if parking is included with your rental, or access cards or fobs for buildings with electronic entry systems.</T></p>
        <p><T>Keep these keys safe throughout your tenancy. If you lose them, report it to your landlord immediately so they can help you get replacements or change the locks if necessary.</T></p>

        <h4 id="first-rent-payment"><T>Your First Rent Payment</T></h4>
        <p><T>After moving in, you will need to pay your first month rent. Your lease will specify when rent is due each month. Most leases require rent to be paid at the beginning of the month, but some may allow payment by a specific date. Refer to your lease agreement for the exact due date and payment amount.</T></p>
        <p><T>To make payments, you can use GCash or pay in person with cash. Make sure to keep records of all your payments for your personal files.</T></p>

        <h4 id="setting-up-utilities"><T>Setting Up Utilities</T></h4>
        <p><T>Depending on what is included with your rental, you may need to set up some utilities in your name. Your lease will specify which utilities are the landlord responsibility and which are yours. Commonly, tenants are responsible for electricity, water, internet and cable, and gas if the property uses it.</T></p>
        <p><T>It is a good idea to set up utilities a few days before you move in so everything is ready when you arrive.</T></p>

        <h3 id="moving-out"><T>Moving Out</T></h3>
        <p><T>When it is time to move out, iReside helps you navigate the process smoothly. Whether your lease is ending, you need to relocate for work, or you have decided to move to a different place, understanding the move-out process ensures you leave on good terms and get your security deposit back.</T></p>

        <h4 id="giving-notice"><T>Giving Notice</T></h4>
        <p><T>Before you can move out, you must notify your landlord. This is called giving notice, and it is typically required by your lease. Most leases require 30 days notice, but some may require 60 days or more. Check your lease agreement for the specific notice period required.</T></p>
        <p><T>When you are ready to move out, submit a move-out request through iReside. This formal notice tells your landlord that you plan to leave and provides them with your intended move-out date.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Give Notice in Writing</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Always give written notice of your intention to move out. Even if you speak with your landlord in person, follow up with a written notice through iReside. This protects you if there is any dispute about when you gave notice or when your move-out date is.</T></p>
        </div>

        <h4 id="landlord-approval"><T>Landlord Approval Process</T></h4>
        <p><T>After you submit your move-out request, your landlord will review it and decide whether to approve it. Once your landlord approves your request, your lease end date is automatically updated to match your requested move-out date, you receive a notification confirming the approval, and a move-out inspection is scheduled to assess the property condition.</T></p>

        <h4 id="pre-moveout-checklist"><T>Pre-Move-Out Checklist</T></h4>
        <p><T>Before the inspection, take time to prepare the property. A thorough cleaning and minor repairs can help you get more of your security deposit back. Clean thoroughly, repair any damage you caused, clear all appliances, remove all personal items, check walls and floors for any issues, and document everything with photos.</T></p>

        <h4 id="moveout-inspection"><T>The Move-Out Inspection</T></h4>
        <p><T>When you move out, you and your landlord will do another inspection, similar to the one when you moved in. The landlord will compare the property current condition to the move-in inspection report to determine if any damage goes beyond normal wear and tear.</T></p>
        <p><T>During the inspection, the landlord will check walls, ceilings, and floors for damage, all appliances to ensure they are working properly, plumbing and fixtures for any issues, light bulbs and other replaceable items, and cleanliness of the entire property.</T></p>

        <h4 id="clearing-bills"><T>Clearing Bills and Payments</T></h4>
        <p><T>Before you fully move out, make sure all your rent and utility bills are paid. The system automatically checks for outstanding rent balance and pending utility payments. Review your payment history in the app and ensure everything is current before your move-out date.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Final Bill Review</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Check your payment history a week before your move-out date. This gives you time to address any issues or disputed charges before the final inspection.</T></p>
        </div>

        <h4 id="security-deposit-return"><T>Security Deposit Return</T></h4>
        <p><T>After the inspection and verification that all bills are paid, your landlord will process the return of your security deposit.</T></p>

        <h5 id="normal-wear"><T>Normal Wear and Tear</T></h5>
        <p><T>You are not responsible for normal wear and tear, which is the natural deterioration that happens over time from everyday use. This includes faded paint from sunlight, worn carpet in high-traffic areas, faded curtains or blinds, slightly worn kitchen countertops, and minor scuffs on walls from furniture.</T></p>

        <h5 id="tenant-damage"><T>Tenant Damage</T></h5>
        <p><T>You are responsible for damage beyond normal wear and tear. This includes holes in walls from hanging pictures or nails, broken windows or doors, stained or burned carpets, broken fixtures or appliances, excessive dirt or grime left behind, and items left in the property that require removal.</T></p>

        <h5 id="deposit-deductions"><T>How Deductions Are Calculated</T></h5>
        <p><T>If there is damage beyond normal wear and tear, your landlord may deduct the cost of repairs or cleaning from your security deposit. The deposit refund amount is calculated based on the cost to repair or replace damaged items, professional cleaning fees if the property requires more than normal cleaning, any unpaid rent or utility bills, and other charges outlined in your lease.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Timeline for Deposit Return</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Your landlord typically has 30 days after you move out to return your security deposit or provide an itemized list of any deductions.</T></p>
        </div>

        <h4 id="returning-keys"><T>Returning Your Keys</T></h4>
        <p><T>On your final day, return all keys to your landlord. This includes door keys, mailbox keys, parking keys, and any access cards or fobs. Do not leave keys in the property or give them to someone other than your landlord without permission.</T></p>

        <h3 id="common-questions"><T>Common Questions About Moving</T></h3>

        <p><strong><T>What if I want to move out before my lease ends?</T></strong></p>
        <p><T>Breaking a lease early can have consequences. You may be responsible for paying rent until a new tenant is found, or you may forfeit your security deposit. Check your lease agreement and discuss your situation with your landlord as early as possible.</T></p>

        <p><strong><T>Can my landlord keep my deposit for normal wear and tear?</T></strong></p>
        <p><T>No. Normal wear and tear is expected and cannot be deducted from your deposit. However, if the property is damaged beyond normal use, your landlord may make deductions.</T></p>

        <p><strong><T>What happens if I leave belongings behind?</T></strong></p>
        <p><T>If you leave personal belongings in the property, your landlord may charge you for the cost of removing and storing them.</T></p>

        <p><strong><T>How long does it take to get my security deposit back?</T></strong></p>
        <p><T>This varies by landlord, but most return deposits within 14 to 30 days after you move out.</T></p>

        <p><strong><T>What if I disagree with the deposit deductions?</T></strong></p>
        <p><T>If you believe the deductions are unfair, communicate with your landlord through iReside. Provide evidence such as photos you took during the move-out inspection.</T></p>

        <h3 id="best-practices"><T>Best Practices for a Smooth Move</T></h3>
        <ul>
          <li><strong><T>Document everything:</T></strong> <T>Take photos and videos of the property when you move in and when you move out.</T></li>
          <li><strong><T>Give proper notice:</T></strong> <T>Know your lease requirements and give notice well before the deadline.</T></li>
          <li><strong><T>Communicate openly:</T></strong> <T>Keep your landlord informed about your moving timeline.</T></li>
          <li><strong><T>Clean thoroughly:</T></strong> <T>A deep clean before you leave can help you get more of your deposit back.</T></li>
          <li><strong><T>Do a final walk-through:</T></strong> <T>Before handing over the keys, go through every room.</T></li>
          <li><strong><T>Keep records:</T></strong> <T>Save copies of your inspection reports, notice letters, and any communication.</T></li>
          <li><strong><T>Update your address:</T></strong> <T>Remember to update your address with the postal service and banks.</T></li>
          <li><strong><T>Cancel utilities in your name:</T></strong> <T>Contact utility companies to cancel service as of your move-out date.</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Leaving on Good Terms</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>How you leave a property can affect your rental history and future references.</T></p>
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
        <p><T>Managing your properties effectively is key to running a successful rental business. iReside provides you with all the tools you need to organize your buildings, track your units, and monitor occupancy from a single, easy-to-use dashboard.</T></p>

        <h3 id="overview"><T>What is Property Management in iReside?</T></h3>
        <p><T>Property management in iReside refers to the tools and features that help you oversee your rental properties. This includes adding new properties to your account, managing individual units within each property, creating and editing property listings, and tracking the occupancy status of your spaces. Everything is designed to save you time and keep your information organized.</T></p>
        <p><T>Instead of using spreadsheets or paper records, iReside lets you manage everything digitally. You can access your property information from your computer or phone, making it easy to stay on top of your portfolio whether you are at home or on the go.</T></p>

        <h3 id="adding-properties"><T>Adding a New Property</T></h3>
        <p><T>When you are ready to list a new property, you will use the property creation form to enter all the details. This information helps potential tenants understand what you are offering and helps you keep track of your inventory.</T></p>
        
        <h4 id="basic-details"><T>Basic Property Details</T></h4>
        <p><T>Start by entering the fundamental information about your property. This includes the complete address, the type of property whether it is an apartment, house, dormitory, or commercial space, and the total number of units available for rent. For dormitories or multi-unit buildings, you will also enter the number of floors.</T></p>
        <p><T>Make sure the address is accurate and complete because this is how tenants will find your property on a map and verify its location.</T></p>

        <h4 id="property-description"><T>Property Description</T></h4>
        <p><T>Write a clear description of your property that highlights its best features. Mention what makes it unique, the neighborhood, nearby amenities, and what types of tenants you are looking for. A good description helps attract the right tenants and sets clear expectations from the start.</T></p>
        
        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Tip for Landlords</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Be honest and detailed in your description. Tenants appreciate knowing exactly what to expect, and this helps reduce questions and misunderstandings later.</T></p>
        </div>

        <h4 id="photos"><T>Adding Photos</T></h4>
        <p><T>Photos are one of the most important parts of your listing. They give potential tenants a visual sense of the property and help your listing stand out. Upload clear, well-lit photos that show each part of the property including bedrooms, bathrooms, the kitchen, living areas, and any outdoor spaces. If the building has common areas like a lobby, elevator, or parking, include those too.</T></p>
        <p><T>Make sure your photos accurately represent the property. Using old photos or photos that do not match the actual space can lead to confusion and disappointment when tenants come to view it.</T></p>

        <h3 id="managing-units"><T>Managing Units</T></h3>
        <p><T>Each property can contain one or more units. A unit is a separate rental space within your property. For example, if you own an apartment building with 10 apartments, each apartment is a separate unit. If you own a dormitory with multiple rooms, each room or floor could be a unit depending on how you set it up.</T></p>

        <h4 id="unit-details"><T>Unit Information</T></h4>
        <p><T>For each unit, you will need to provide specific details including the unit name or number, the monthly rent amount, the number of bedrooms and bathrooms, the maximum occupancy limit, and any amenities that come with that specific unit like a private bathroom or balcony.</T></p>

        <h4 id="unit-status"><T>Unit Status</T></h4>
        <p><T>Each unit has a status that tells you its current condition in the rental process:</T></p>
        <ul>
          <li><strong><T>Vacant:</T></strong> <T>The unit is available for rent and has no active tenant.</T></li>
          <li><strong><T>Occupied:</T></strong> <T>The unit has an active tenant and is currently being rented.</T></li>
          <li><strong><T>Pending:</T></strong> <T>The unit has a pending application or lease that has not been finalized yet.</T></li>
          <li><strong><T>Under Maintenance:</T></strong> <T>The unit is not available for rent because it is being repaired or renovated.</T></li>
        </ul>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Keep Status Updated</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Make sure to update the status of your units as they change. An accurate status helps you track availability and ensures tenants see correct information when browsing listings.</T></p>
        </div>

        <h3 id="unit-map"><T>Using the Unit Map</T></h3>
        <p><T>{"The Unit Map is one of iReside's most powerful features for property managers. It gives you a visual representation of your properties and units, making it easy to see at a glance which units are occupied, vacant, or under maintenance."}</T></p>

        <h4 id="map-overview"><T>Visual Overview</T></h4>
        <p><T>Instead of looking through a list of units, you can view your property as a map. Each unit is shown as a separate block on the map, and the color of the block indicates its status. This makes it much faster to scan and understand the occupancy situation of your entire property.</T></p>
        <p><T>The map view is especially helpful if you have multiple properties or many units because it puts all the information into a simple visual format.</T></p>

        <h4 id="floor-plans"><T>Floor Plans</T></h4>
        <p><T>For buildings with multiple floors, you can view each floor separately. This lets you see which units are on which floor and understand the layout of your building. You can also configure the floor plan to show the actual arrangement of units, which helps with tenant placement and planning.</T></p>

        <h3 id="listing-details"><T>Unit Details</T></h3>
        <p><T>Keeping your unit information clear and accurate helps you manage your properties effectively. Make sure the details for each unit are complete and up to date.</T></p>

        <h4 id="rental-rates"><T>Rental Rates</T></h4>
        <p><T>Set your rental rates carefully for each unit. Consider the location, the condition of the property, the amenities included, and the current rates in your area. You can set different rates for different units based on their features and size.</T></p>
        <p><T>You can also indicate which utilities are included in the rent and which ones the tenant will need to pay for separately. This transparency helps tenants understand their financial obligations.</T></p>

        <h4 id="availability"><T>Availability and Move-In Dates</T></h4>
        <p><T>Always keep your unit information updated with accurate availability information. If a unit will be available on a specific date, make sure that date is shown. If a unit is not yet available, do not mark it as vacant. This prevents confusion and ensures you only receive applications for units that are truly ready.</T></p>

        <h3 id="renewal-settings"><T>Renewal Settings</T></h3>
        <p><T>For each property, you can configure settings related to lease renewals. This includes the default lease duration, whether automatic renewals are offered, and the notice period required before a tenant must confirm if they are renewing or moving out.</T></p>
        <p><T>These settings help you plan ahead and reduce gaps between tenants. When a tenant is approaching the end of their lease, the system can automatically send reminders and prompts to help with the renewal process.</T></p>

        <h3 id="property-settings"><T>Property Settings</T></h3>
        <p><T>Each property has settings you can adjust to fit your management style. These include notification preferences so you know when new applications come in, the approval workflow for applications, and default templates for documents and communications.</T></p>
        <p><T>Taking time to configure these settings correctly when you first add a property saves time later and ensures your workflow runs smoothly.</T></p>

        <h3 id="monitoring"><T>Monitoring Your Portfolio</T></h3>
        <p><T>iReside gives you tools to monitor the health of your property portfolio. You can see occupancy rates, average rental income, and trends over time. This information helps you make smart decisions about pricing, when to schedule maintenance, and whether to expand your portfolio.</T></p>

        <h3 id="common-questions"><T>Common Questions About Property Management</T></h3>
        <p><strong><T>Can I manage multiple properties under one account?</T></strong></p>
        <p><T>Yes. You can add as many properties as you need to your account. Each property can have its own set of units and settings. The dashboard gives you an overview of all your properties so you can manage them from a single place.</T></p>

        <p><strong><T>What happens if I need to temporarily make a unit unavailable?</T></strong></p>
        <p><T>You can change the unit status to Under Maintenance or mark it as unavailable. This prevents new applications from being submitted for a space that is not ready for occupancy.</T></p>

        <p><strong><T>Can I export my property and unit information?</T></strong></p>
        <p><T>Yes. You can view and export details about your properties and units for your records. This is useful for financial planning and reporting.</T></p>

        <p><strong><T>How do I handle different property types?</T></strong></p>
        <p><T>iReside supports various property types including apartments, houses, dormitories, and commercial spaces. When you add a property, you select its type, and the system adjusts the available fields and options accordingly.</T></p>
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
        <p><T>Finding the right tenant is one of the most important decisions you will make as a property owner. A good tenant pays rent on time, takes care of the property, and follows the lease agreement. A bad tenant can cause headaches, financial losses, and property damage. iReside gives you the tools to screen applicants thoroughly and make informed decisions.</T></p>

        <h3 id="overview"><T>What is Tenant Screening?</T></h3>
        <p><T>Tenant screening is the process of evaluating potential tenants before you approve their application. This involves reviewing the information they provide, checking their documents, verifying their identity and income, and communicating with them directly. The goal is to understand who is applying and whether they are likely to be a responsible tenant.</T></p>
        <p><T>On iReside, you can manage the entire screening process digitally. Applications come to you through the platform, documents are uploaded and stored securely, and you can communicate with applicants without revealing your personal contact information until you are ready.</T></p>

        <h3 id="receiving-applications"><T>Receiving Applications</T></h3>
        <p><T>When prospective tenants are interested in your property, they will submit applications through iReside. There are two main ways this can happen.</T></p>
        
        <h4 id="online-applications"><T>Online Applications</T></h4>
        <p><T>When you have an open unit and receive inquiries, interested applicants can submit applications through iReside. They will fill out the application form you have set up, provide their personal information, employment details, references, and upload any required documents. All of this comes to you through the platform in an organized format.</T></p>

        <h4 id="walk-in-applications"><T>Walk-In Applications</T></h4>
        <p><T>If you meet prospective tenants in person, you can create a walk-in application directly in the system. This lets you enter their information on the spot or send them a link to apply later. Walk-in applications are useful when you meet someone at a property viewing or through a referral.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Application Invitation</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>You can also proactively send application invitations to people you know are interested. Just create an invitation link and send it to them via email or messaging apps.</T></p>
        </div>

        <h3 id="reviewing-applications"><T>Reviewing Applications</T></h3>
        <p><T>When applications come in, you will see them in your Applications dashboard. Each application shows the applicant is basic information, their employment and income details, the references they have provided, and any documents they have uploaded.</T></p>

        <h4 id="basic-information"><T>Basic Information Review</T></h4>
        <p><T>Start by reviewing the basic information. Check their full name, contact details, and the date they applied. Make sure the information is complete and consistent. Incomplete applications can be a red flag, so note if anything is missing or seems incomplete.</T></p>

        <h4 id="income-verification"><T>Income and Employment</T></h4>
        <p><T>One of the most important factors in tenant screening is whether the applicant can afford the rent. Look at their stated income and employment information. Most landlords look for applicants whose monthly income is at least three times the monthly rent, though this can vary based on your criteria and local practices.</T></p>
        <p><T>Check if they have a stable job history and if their employer is verifiable. If you have concerns about the income they have declared, you can request additional proof such as recent pay stubs or bank statements.</T></p>

        <h4 id="references"><T>Checking References</T></h4>
        <p><T>References from previous landlords can be very valuable. They tell you how the applicant behaved as a tenant in the past. Did they pay rent on time? Did they take care of the property? Were there any issues or complaints?</T></p>
        <p><T>If references are provided, take time to contact them. A quick call can reveal a lot about the applicant. If you cannot reach a reference, note this down. Multiple unsuccessful reference attempts might warrant further investigation.</T></p>

        <h3 id="document-verification"><T>Verifying Documents</T></h3>
        <p><T>Applicants may be asked to provide documents to support their application. These can include proof of income such as pay stubs or bank statements, a valid government-issued ID such as a driver license or passport, and reference letters from previous landlords.</T></p>

        <h4 id="id-verification"><T>Identity Verification</T></h4>
        <p><T>Check that the ID provided matches the name on the application. Look at the photo to confirm it resembles the applicant. Make sure the ID is not expired. This simple step helps ensure you are dealing with a real person and prevents fraud.</T></p>

        <h4 id="document-storage"><T>Secure Document Storage</T></h4>
        <p><T>All documents uploaded through iReside are stored securely. You can view them anytime from your dashboard, and they are linked to the specific application. This creates a clear record of what you verified and when. Proper document storage also protects you if there are ever disputes about what was agreed to or verified.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Document Handling Reminder</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Handle all applicant documents with care. Do not share them with unauthorized people. Only use them for the purpose of evaluating the application. This protects both you and the applicant.</T></p>
        </div>

        <h3 id="communicating"><T>Communicating with Applicants</T></h3>
        <p><T>Clear communication helps the screening process go smoothly. iReside has built-in messaging that lets you communicate with applicants without revealing your personal phone number or email address until you choose to share it.</T></p>

        <h4 id="status-updates"><T>Application Status Updates</T></h4>
        <p><T>Keep applicants informed about the status of their application. If you are still reviewing, let them know. If you need more information, contact them through the platform. If you have made a decision, communicate it clearly and promptly.</T></p>

        <h4 id="questions"><T>Asking Follow-Up Questions</T></h4>
        <p><T>If you have questions about something in the application, you can message the applicant directly through iReside. Ask for clarification, request additional documents, or set up a call or meeting to learn more. This direct communication helps you make a more informed decision.</T></p>

        <h3 id="approval-process"><T>Approving or Declining</T></h3>
        <p><T>Once you have reviewed the application and completed your screening, you will need to make a decision. You can either approve the application or decline it.</T></p>

        <h4 id="approving"><T>Approving an Applicant</T></h4>
        <p><T>If you decide to approve the applicant, you will send them a lease agreement to review and sign. iReside makes this easy by generating the lease based on the property and unit details you have already entered. You can customize the terms as needed before sending.</T></p>
        <p><T>Once the lease is signed by both parties, the tenant is officially confirmed and the unit status will update to reflect that it is no longer available.</T></p>

        <h4 id="declining"><T>Declining an Applicant</T></h4>
        <p><T>If you decide not to proceed with an applicant, you can decline their application through the platform. It is good practice to notify them of your decision, though you are not always required to explain why. Being polite and professional in your decline message reflects well on you as a landlord.</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>Fair Housing Reminder</T></p>
          <p className="m-0 text-text-medium text-sm"><T>When screening tenants, apply consistent criteria to all applicants. Do not discriminate based on race, religion, gender, age, disability, family status, or other protected characteristics. Treat every applicant fairly and equally.</T></p>
        </div>

        <h3 id="screening-criteria"><T>Setting Your Screening Criteria</T></h3>
        <p><T>Before you start receiving applications, decide on your screening criteria. Having clear criteria helps you make consistent decisions and reduces the chance of accidentally discriminating against any group.</T></p>
        <p><T>Consider what factors are most important to you such as minimum income requirements, credit history if accessible, rental history, employment status, and references. Write these down and apply them consistently to every applicant.</T></p>

        <h3 id="common-questions"><T>Common Questions About Tenant Screening</T></h3>
        <p><strong><T>Can I charge applicants a fee for screening?</T></strong></p>
        <p><T>This depends on local laws and regulations. Some areas allow landlords to charge application fees to cover the cost of background checks, while others prohibit or limit such fees. Check your local regulations to understand what is allowed in your area.</T></p>

        <p><strong><T>What if an applicant has no rental history?</T></strong></p>
        <p><T>Some applicants, especially younger people or those moving from abroad, may not have a previous rental history. In these cases, look at other factors such as employment stability, income, personal references, and character. You might also consider a shorter initial lease term to start.</T></p>

        <p><strong><T>How long should I take to review applications?</T></strong></p>
        <p><T>Try to review applications within a few days of receiving them. Prospective tenants are often applying to multiple properties and appreciate a quick response. If you need more time, send a brief message to let them know you are still reviewing.</T></p>

        <p><strong><T>Can I accept multiple applications for the same unit?</T></strong></p>
        <p><T>You can receive multiple applications, but be careful about accepting deposits or fees from more than one applicant for the same unit. This can lead to legal issues if you have to refund multiple people. Once you approve an applicant and they sign the lease, you should notify any other applicants that the unit is no longer available.</T></p>
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
        <p><T>Managing the financial side of rental property can be one of the most time-consuming parts of being a landlord. iReside simplifies this by providing tools to track rent payments, manage invoices, monitor cash flow, and keep clear financial records. Everything is in one place, so you do not have to juggle multiple spreadsheets or apps.</T></p>

        <h3 id="overview"><T>Financial Management Overview</T></h3>
        <p><T>The Financial Hub in iReside gives you a complete picture of your property finances. You can see how much money is coming in from rent, what is owed, what has been paid, and track your property-related expenses. This helps you stay organized and ensures nothing slips through the cracks.</T></p>
        <p><T>Whether you have one property or dozens, the financial dashboard makes it easy to understand your rental business performance at a glance.</T></p>

        <h3 id="invoices"><T>Managing Invoices</T></h3>
        <p><T>Invoices are the core of rent collection in iReside. An invoice represents the amount a tenant owes for a specific period, typically monthly rent. You can create invoices manually or have them generated automatically based on the lease terms.</T></p>

        <h4 id="creating-invoices"><T>Creating Invoices</T></h4>
        <p><T>When you have an active lease, you can create an invoice for the upcoming rent period. The invoice will include the amount due, the due date, and any other charges or credits that apply. Make sure the amount matches what was agreed to in the lease.</T></p>
        <p><T>If you have set up recurring invoices, the system can generate them automatically each month, saving you time and ensuring consistency.</T></p>

        <h4 id="invoice-status"><T>Invoice Status Types</T></h4>
        <p><T>Each invoice has a status that tells you where it stands in the payment process:</T></p>
        <ul>
          <li><strong><T>Pending:</T></strong> <T>The invoice has been created but the tenant has not yet taken action to pay it.</T></li>
          <li><strong><T>Under Review:</T></strong> <T>The tenant has submitted proof of payment and you are verifying it.</T></li>
          <li><strong><T>Paid:</T></strong> <T>You have confirmed the payment and the invoice is settled.</T></li>
          <li><strong><T>Overdue:</T></strong> <T>The due date has passed and the invoice has not been paid.</T></li>
          <li><strong><T>Partial:</T></strong> <T>The tenant has paid part of the amount owed.</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Invoice Tracking</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Keep an eye on the status of your invoices. If you see many overdue invoices, consider reaching out to tenants proactively to avoid payment delays.</T></p>
        </div>

        <h3 id="payment-methods"><T>Payment Methods</T></h3>
        <p><T>iReside currently supports two payment methods for rent collection. Understanding both helps you set correct expectations with your tenants.</T></p>

        <h4 id="gcash-payments"><T>GCash Payments</T></h4>
        <p><T>Many tenants prefer to pay through GCash because it is fast and convenient. When a tenant chooses this method, they will transfer the rent amount directly to your GCash account using the details shown in the Checkout Hub. After making the transfer, they will upload proof of payment including the 13-digit reference number.</T></p>
        <p><T>When you receive proof of payment, you will verify it by checking your GCash app or account history. If the reference number matches and the amount is correct, you confirm the payment in iReside. This updates the invoice status to Paid and creates a digital receipt for the tenant.</T></p>

        <h4 id="cash-payments"><T>Cash Payments</T></h4>
        <p><T>Some tenants prefer to pay in cash, especially if they live in the same building or near your office. When a tenant selects this method, they will notify you through the platform that they intend to pay in cash. You will then meet them in person to receive the payment.</T></p>
        <p><T>After you receive the cash, you confirm the payment in iReside. The invoice status will immediately update to Paid, and the tenant receives a digital receipt. This creates a clear record that the payment was received.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Cash Handling Reminder</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>When receiving cash payments, always provide a receipt and count the money in front of the tenant. Document the transaction in iReside right away to maintain accurate records.</T></p>
        </div>

        <h3 id="payment-reconciliation"><T>Payment Reconciliation</T></h3>
        <p><T>Payment reconciliation means matching the payments you receive with the invoices you have issued. This is important for keeping your books accurate and knowing exactly where you stand financially.</T></p>

        <h4 id="verifying-payments"><T>Verifying GCash Payments</T></h4>
        <p><T>When a tenant submits proof of GCash payment, open your GCash app and look for the transaction using the reference number they provided. Check that the amount matches what is on the invoice and that the transaction was made on or around the expected date. If everything looks correct, confirm the payment in iReside.</T></p>

        <h4 id="handling-disputes"><T>Handling Payment Disputes</T></h4>
        <p><T>Sometimes there may be a discrepancy. Maybe the tenant paid the wrong amount, the reference number does not match, or you do not see the transaction. If this happens, do not confirm the payment yet. Instead, contact the tenant through the messaging system and ask them to clarify or resubmit proof. This protects both parties and prevents misunderstandings.</T></p>

        <h3 id="expenses"><T>Tracking Expenses</T></h3>
        <p><T>As a landlord, you will have expenses related to your properties. These can include repairs and maintenance, property taxes, insurance, utilities that you cover, management fees, and any other costs associated with running your properties.</T></p>

        <h4 id="recording-expenses"><T>Recording Expenses</T></h4>
        <p><T>Keep a record of all your property-related expenses. Note the date, the amount, the category, and what it was for. This helps you track where your money is going and makes it easier to prepare for tax time or analyze the profitability of your properties.</T></p>

        <h4 id="expense-categories"><T>Expense Categories</T></h4>
        <p><T>Organize your expenses into categories to make reporting easier. Common categories include Maintenance and Repairs, Utilities, Taxes and Insurance, Management Fees, Marketing and Advertising, and Legal and Professional Services.</T></p>

        <h3 id="financial-reports"><T>Financial Reports and Analytics</T></h3>
        <p><T>iReside provides tools to help you understand your financial performance over time. You can see reports on rent collection rates, total income and expenses, outstanding balances, and trends across different periods.</T></p>

        <h4 id="collection-rate"><T>Collection Rate</T></h4>
        <p><T>This tells you what percentage of rent due has been collected. A high collection rate means tenants are paying on time. A low rate might indicate problems that need attention, such as tenants struggling to pay or underlying issues with your payment process.</T></p>

        <h4 id="income-summary"><T>Income Summary</T></h4>
        <p><T>See a breakdown of all money coming in, organized by property, by unit, or by time period. This helps you understand which properties are performing best and whether your income is growing over time.</T></p>

        <h4 id="profit-loss"><T>Profit and Loss Overview</T></h4>
        <p><T>By comparing your income against your expenses, you can see the net profit or loss for each property. This is essential for understanding whether your rental business is sustainable and where you might be able to cut costs or improve efficiency.</T></p>

        <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-green-700 dark:text-green-300 m-0"><T>Record Keeping</T></p>
          <p className="m-0 text-green-600 dark:text-green-200 text-sm"><T>Maintaining accurate financial records protects you and makes your life easier at tax time. iReside keeps a digital record of all transactions that you can access anytime, so you never have to worry about losing receipts or forgetting about a payment.</T></p>
        </div>

        <h3 id="common-questions"><T>Common Questions About Finances</T></h3>
        <p><strong><T>Can I issue refunds through iReside?</T></strong></p>
        <p><T>If you need to refund a tenant for any reason, you can do so by initiating a refund through the platform. Refunds can be issued for overpayments, security deposits, or any other reason you and the tenant agree on.</T></p>

        <p><strong><T>What if a tenant pays the wrong amount?</T></strong></p>
        <p><T>If a tenant pays less than the invoice amount, you can mark the invoice as Partial and the system will track what is still owed. If they pay more, you can issue a refund for the difference or credit it toward future rent.</T></p>

        <p><strong><T>How do I handle late payments?</T></strong></p>
        <p><T>iReside will mark invoices as overdue after the due date passes. You can follow up with tenants through the messaging system to remind them. You can also set up automatic reminders to be sent to tenants when their payment is due or overdue.</T></p>

        <p><strong><T>Can I export my financial data?</T></strong></p>
        <p><T>Yes. You can export your financial reports and transaction history for your records or for your accountant. This makes it easier to prepare tax returns or analyze your business performance.</T></p>
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
        <p><T>{"Keeping your properties well-maintained is key to preserving their value and keeping tenants happy. iReside's maintenance management tools help you receive repair requests from tenants, track the status of each issue, assign tasks to the right people, and maintain a complete history of all work done on your properties."}</T></p>

        <h3 id="overview"><T>Maintenance Management Overview</T></h3>
        <p><T>When something breaks or needs fixing in a rental property, tenants submit maintenance requests through iReside. You receive these requests in your dashboard, review them, and take appropriate action. Whether you handle repairs yourself, hire a contractor, or guide the tenant through a self-repair, everything is tracked and recorded in the system.</T></p>
        <p><T>Having a clear maintenance process benefits everyone. Tenants get their issues addressed promptly. You maintain the value of your property and prevent small problems from becoming big ones. And both parties have a record of what was reported and what was done about it.</T></p>

        <h3 id="receiving-requests"><T>Receiving Maintenance Requests</T></h3>
        <p><T>When a tenant submits a maintenance request, you will see it appear in your maintenance dashboard. Each request includes details about the issue, photos the tenant may have uploaded, the priority level the tenant has assigned, and when it was submitted.</T></p>

        <h4 id="request-notifications"><T>Notifications</T></h4>
        <p><T>You will receive a notification whenever a new maintenance request comes in. This ensures you can respond promptly, even if you are not checking the dashboard constantly. You can configure how you receive these notifications based on your preferences.</T></p>

        <h4 id="reviewing-requests"><T>Reviewing a Request</T></h4>
        <p><T>When you open a maintenance request, take time to read the description carefully. Look at the photos provided. Check the priority level the tenant has selected. This gives you a good initial understanding of the issue before deciding on next steps.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Quick Response Matters</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Tenants appreciate when landlords respond quickly to maintenance requests. Even if you cannot fix the issue immediately, acknowledging the request promptly lets the tenant know you are aware and working on it.</T></p>
        </div>

        <h3 id="issue-categories"><T>Issue Categories</T></h3>
        <p><T>Maintenance requests are organized by category to help you prioritize and route them appropriately. Common categories include:</T></p>
        <ul>
          <li><strong><T>Plumbing:</T></strong> <T>Leaks, drips, clogs, water heater issues, or any water-related problems.</T></li>
          <li><strong><T>Electrical:</T></strong> <T>Outlets not working, lights flickering, circuit breaker issues, or any electrical hazards.</T></li>
          <li><strong><T>HVAC:</T></strong> <T>Air conditioning, heating, ventilation, or temperature control problems.</T></li>
          <li><strong><T>Appliances:</T></strong> <T>Problems with built-in appliances like stoves, ovens, refrigerators, or washing machines.</T></li>
          <li><strong><T>Structural:</T></strong> <T>Issues with walls, floors, ceilings, doors, windows, or the building structure.</T></li>
          <li><strong><T>Pest Control:</T></strong> <T>Insects, rodents, or other pest problems.</T></li>
          <li><strong><T>General Repairs:</T></strong> <T>Anything that does not fit neatly into the other categories.</T></li>
        </ul>

        <h3 id="priority-levels"><T>Understanding Priority Levels</T></h3>
        <p><T>Tenants assign a priority level to their request based on how urgent they believe it is. As a landlord, you can review this and adjust if needed based on your assessment of the situation.</T></p>

        <h4 id="low-priority"><T>Low Priority</T></h4>
        <p><T>Minor issues that do not significantly affect daily life. Examples include a small scratch on a wall, a cabinet door that does not close properly, or a faucet that has a very slow drip. These can typically be addressed during routine maintenance or scheduled repairs.</T></p>

        <h4 id="medium-priority"><T>Medium Priority</T></h4>
        <p><T>Issues that are inconvenient but not urgent. Examples include a bathroom light that sometimes flickers, a toilet that runs occasionally, or a window that is hard to open. These should be addressed in a timely manner, typically within a week or two.</T></p>

        <h4 id="high-priority"><T>High Priority</T></h4>
        <p><T>Issues that seriously affect comfort or safety. Examples include heating not working in cold weather, multiple outlets not working, a significant leak that could cause water damage, or a door lock that is broken. These should be addressed as soon as possible.</T></p>

        <h4 id="urgent-priority"><T>Urgent Priority</T></h4>
        <p><T>Critical issues that require immediate attention. Examples include no water supply, gas smell or leak, major water leak or flooding, electrical hazards, or security concerns like a broken main door. These require immediate action, and you should contact a professional right away.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Emergency Protocol</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>For truly emergency situations like gas leaks, electrical hazards, or major flooding, tell the tenant to contact emergency services immediately. Then focus on getting a professional to address the issue as quickly as possible.</T></p>
        </div>

        <h3 id="managing-requests"><T>Managing Maintenance Requests</T></h3>
        <p><T>Once you have reviewed a request, you will decide how to handle it. iReside gives you several options depending on the nature of the issue.</T></p>

        <h4 id="approving-requests"><T>Approving a Request</T></h4>
        <p><T>If you decide the request is valid and needs to be addressed, you can approve it. This acknowledges the issue and moves it into your active maintenance queue. You can then assign it to yourself, a staff member, or an external contractor.</T></p>

        <h4 id="assigning-tasks"><T>Assigning Tasks</T></h4>
        <p><T>For each approved request, you can assign it to the appropriate person. This might be a maintenance staff member you employ, a trusted contractor you work with, or even yourself if you plan to handle it. Assignment creates a clear chain of responsibility so everyone knows who is supposed to do what.</T></p>

        <h4 id="self-repair-option"><T>Self-Repair Option</T></h4>
        <p><T>In some cases, you might guide the tenant to handle a minor repair themselves. This could be appropriate for simple tasks like changing a light bulb, unclogging a drain that is not completely blocked, or replacing batteries in a smoke detector. If you approve a self-repair, provide clear instructions to the tenant on what to do.</T></p>

        <h4 id="requesting-more-info"><T>Requesting More Information</T></h4>
        <p><T>If a request is unclear or you need more details before deciding, you can message the tenant directly through iReside. Ask specific questions or request additional photos. This helps you make a better decision and ensures the right resources are dispatched.</T></p>

        <h4 id="declining-requests"><T>Declining a Request</T></h4>
        <p><T>Not all requests are legitimate maintenance issues. A request might be for something that is the tenant is responsibility, something that was caused by tenant damage, or something outside the scope of what you agreed to handle. If you decline a request, explain your reasoning politely to the tenant so they understand why.</T></p>

        <h3 id="tracking-status"><T>Tracking Status Changes</T></h3>
        <p><T>Maintenance requests go through different stages from submission to resolution. Tracking these stages helps both you and the tenant know where things stand.</T></p>
        <ul>
          <li><strong><T>Submitted:</T></strong> <T>The tenant has reported the issue.</T></li>
          <li><strong><T>Under Review:</T></strong> <T>You are reviewing the request and deciding how to handle it.</T></li>
          <li><strong><T>Approved:</T></strong> <T>You have accepted the request and it is being worked on.</T></li>
          <li><strong><T>In Progress:</T></strong> <T>Work is actively being done to address the issue.</T></li>
          <li><strong><T>Pending Confirmation:</T></strong> <T>The work has been completed and is awaiting tenant confirmation.</T></li>
          <li><strong><T>Completed:</T></strong> <T>The issue has been resolved and closed.</T></li>
          <li><strong><T>Declined:</T></strong> <T>The request was not accepted and the reason has been communicated.</T></li>
        </ul>

        <h3 id="maintenance-history"><T>Maintenance History</T></h3>
        <p><T>Every maintenance request that is completed creates a record in the property history. This history is valuable for several reasons.</T></p>

        <h4 id="track-patterns"><T>Tracking Patterns</T></h4>
        <p><T>If a particular unit or piece of equipment has frequent issues, the maintenance history will show this. This can help you identify when something needs to be replaced entirely rather than constantly repaired.</T></p>

        <h4 id="move-out-inspections"><T>Move-Out Inspections</T></h4>
        <p><T>When a tenant moves out, you can reference the maintenance history to see what issues were reported during their tenancy and how they were addressed. This helps with security deposit decisions and understanding the condition of the property.</T></p>

        <h4 id="contractor-records"><T>Contractor Records</T></h4>
        <p><T>If you hire contractors for repairs, the maintenance history keeps a record of who did what work and when. This is helpful for warranty purposes and for evaluating whether a contractor is doing good work.</T></p>

        <h3 id="common-questions"><T>Common Questions About Maintenance</T></h3>
        <p><strong><T>Who is responsible for what repairs?</T></strong></p>
        <p><T>Generally, landlords are responsible for keeping the property in a livable condition and addressing major systems like plumbing, electrical, and structural issues. Tenants are typically responsible for minor issues they cause and for keeping the property clean. Your lease agreement should spell out specific responsibilities.</T></p>

        <p><strong><T>How quickly should I respond to maintenance requests?</T></strong></p>
        <p><T>This depends on the priority. Urgent issues should be addressed immediately or within hours. High priority issues should be addressed within a day or two. Medium priority issues can wait a week or two. Low priority issues can be scheduled during routine maintenance.</T></p>

        <p><strong><T>Can I require tenants to handle minor repairs themselves?</T></strong></p>
        <p><T>If a repair is simple and safe for the tenant to do, you can offer them the option to handle it. However, you cannot force them to do repairs that are your responsibility or that require professional skills. Always document any agreements about repairs in writing.</T></p>

        <p><strong><T>What if a tenant reports the same issue repeatedly?</T></strong></p>
        <p><T>Check the maintenance history to see how many times this has been reported. If it is a recurring problem, it might need a more permanent fix. Consider getting a professional assessment to identify the root cause rather than just treating the symptoms.</T></p>
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
        <p><T>Leases are the foundation of the landlord-tenant relationship. They define the terms of the rental, establish the rights and responsibilities of both parties, and create a legally binding agreement. iReside makes it easy to create leases, collect digital signatures, and manage all your property documents in one secure place.</T></p>

        <h3 id="overview"><T>What is Lease Management?</T></h3>
        <p><T>Lease management on iReside covers everything related to the lease agreement from creation to expiration. This includes generating the initial lease document based on the terms you set, collecting signatures from both you and your tenant, storing the signed document securely, and handling any amendments or renewals that come up during the tenancy.</T></p>
        <p><T>Instead of dealing with paper documents, scanning, and physical filing, iReside keeps everything digital and organized. You can access any lease document from your dashboard whenever you need it.</T></p>

        <h3 id="lease-basics"><T>Lease Agreement Basics</T></h3>
        <p><T>A lease agreement is a legal contract between you and your tenant. It outlines the terms under which the tenant is allowed to occupy your property. Key elements typically include:</T></p>
        <ul>
          <li><strong><T>Parties:</T></strong> <T>The names of the landlord and tenant.</T></li>
          <li><strong><T>Property:</T></strong> <T>The address and specific unit being rented.</T></li>
          <li><strong><T>Lease Term:</T></strong> <T>The start and end dates of the rental agreement.</T></li>
          <li><strong><T>Rent:</T></strong> <T>The monthly amount, due date, and accepted payment methods.</T></li>
          <li><strong><T>Deposits:</T></strong> <T>The security deposit amount and conditions for its return.</T></li>
          <li><strong><T>Utilities:</T></strong> <T>Which utilities are included and which are the tenant responsibility.</T></li>
          <li><strong><T>Rules:</T></strong> <T>Any specific policies about pets, guests, noise, or modifications.</T></li>
          <li><strong><T>Maintenance:</T></strong> <T>Who is responsible for what types of repairs and upkeep.</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Legal Disclaimer</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>While iReside provides tools to help you create and manage leases, it is not a substitute for professional legal advice. Consider consulting with a lawyer to ensure your lease agreements comply with local laws and adequately protect your interests.</T></p>
        </div>

        <h3 id="creating-leases"><T>Creating a Lease</T></h3>
        <p><T>When you approve a tenant application, you can move on to creating the lease. The process starts with generating the lease document in iReside.</T></p>

        <h4 id="lease-generation"><T>Automatic Lease Generation</T></h4>
        <p><T>iReside can automatically generate a lease document based on the information already in the system. This includes the property details, unit information, the rent amount you have set, and the terms you have configured. This saves time because you do not have to enter the same information multiple times.</T></p>

        <h4 id="customizing-terms"><T>Customizing Terms</T></h4>
        <p><T>While the auto-generated lease provides a starting point, you should review it carefully and customize any terms as needed for your specific situation. You can adjust the rent amount, change the lease duration, add special conditions, or modify any other terms to fit your agreement with the tenant.</T></p>

        <h4 id="addendum"><T>Adding Addendums</T></h4>
        <p><T>If you have special terms that are not covered in the standard lease, you can add addendums. These are additional documents that become part of the overall lease agreement. Common addendums include pet policies, parking arrangements, or specific rules for your property.</T></p>

        <h3 id="digital-signatures"><T>Digital Signature Process</T></h3>
        <p><T>One of the most convenient features of iReside is the ability to collect signatures digitally. This eliminates the need for printing, scanning, and physical document handling.</T></p>

        <h4 id="sending-for-signature"><T>Sending the Lease</T></h4>
        <p><T>Once you are satisfied with the lease document, you send it to the tenant for review and signature through iReside. The tenant will receive a notification and can view the complete lease in the app.</T></p>

        <h4 id="tenant-review"><T>Tenant Review</T></h4>
        <p><T>The tenant has the opportunity to read through the entire lease before signing. If they have questions, they can message you through the platform. This dialogue before signing helps ensure both parties understand and agree to the terms.</T></p>

        <h4 id="signing-process"><T>Signing the Lease</T></h4>
        <p><T>When the tenant is ready, they sign the lease digitally using their device. The signature is captured securely and linked to their account. After the tenant signs, the lease goes to you for your signature as well. Once both parties have signed, the lease is considered complete and legally binding.</T></p>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-yellow-700 dark:text-yellow-300 m-0"><T>Signature Reminder</T></p>
          <p className="m-0 text-yellow-600 dark:text-yellow-200 text-sm"><T>Both signatures are required before the lease is finalized. If either party has not signed, the lease is not yet complete and the tenant should not move in until it is.</T></p>
        </div>

        <h3 id="lease-status"><T>Lease Status Types</T></h3>
        <p><T>Throughout its lifecycle, a lease goes through different statuses:</T></p>
        <ul>
          <li><strong><T>Draft:</T></strong> <T>The lease has been started but not yet sent to the tenant.</T></li>
          <li><strong><T>Pending Tenant Signature:</T></strong> <T>The lease has been sent and is waiting for the tenant to sign.</T></li>
          <li><strong><T>Pending Landlord Signature:</T></strong> <T>The tenant has signed and the lease is waiting for your signature.</T></li>
          <li><strong><T>Active:</T></strong> <T>Both parties have signed and the lease is currently in effect.</T></li>
          <li><strong><T>Expired:</T></strong> <T>The lease term has ended and the lease is no longer active.</T></li>
          <li><strong><T>Terminated:</T></strong> <T>The lease was ended early before its scheduled end date.</T></li>
        </ul>

        <h3 id="document-storage"><T>Secure Document Storage</T></h3>
        <p><T>All lease documents and related files are stored securely in iReside. You can access them anytime from your dashboard, download them for your records, or share them when needed.</T></p>

        <h4 id="organized-files"><T>Organized File Management</T></h4>
        <p><T>Documents are organized by property and unit, making it easy to find what you need. Instead of searching through emails or physical files, you can quickly locate the exact lease document you are looking for.</T></p>

        <h4 id="version-history"><T>Version History</T></h4>
        <p><T>If a lease is amended or renewed, the system keeps track of previous versions. You can always access the original lease and any subsequent amendments, creating a complete audit trail of the tenancy.</T></p>

        <h3 id="lease-amendments"><T>Lease Amendments</T></h3>
        <p><T>Sometimes the terms of a lease need to change during the tenancy. This could be for a rent adjustment, extending the lease term, or modifying other conditions. iReside allows you to create amendments to an existing lease.</T></p>

        <h4 id="creating-amendment"><T>Creating an Amendment</T></h4>
        <p><T>An amendment is a separate document that modifies specific terms of the original lease while keeping the rest of the agreement intact. To create one, you start from the existing lease, specify which terms are changing, and set the effective date of the amendment.</T></p>

        <h4 id="amendment-signatures"><T>Signing Amendments</T></h4>
        <p><T>Like the original lease, amendments require signatures from both parties. The amendment process is the same as signing the original lease, with both tenant and landlord signing off on the changes digitally.</T></p>

        <h3 id="renewals"><T>Lease Renewals</T></h3>
        <p><T>When a lease term is approaching its end, you may want to renew it with the same tenant. iReside can help you manage this process.</T></p>

        <h4 id="renewal-notifications"><T>Renewal Reminders</T></h4>
        <p><T>You can set up automatic reminders to notify you when a lease is approaching its expiration date. This gives you time to decide whether you want to renew and to start conversations with your tenant well in advance.</T></p>

        <h4 id="renewal-process"><T>Renewal Process</T></h4>
        <p><T>To renew a lease, you create a new lease document based on the current one, make any adjustments needed for the new term such as a rent increase, and send it to the tenant for signature. The old lease expires and the new one takes effect.</T></p>

        <h3 id="common-questions"><T>Common Questions About Leases</T></h3>
        <p><strong><T>Can I use my own lease template?</T></strong></p>
        <p><T>iReside provides standard lease templates, but you can customize them to fit your needs. If you have an existing lease template from a lawyer, you can work with the iReside team to integrate it into the platform.</T></p>

        <p><strong><T>What happens if a tenant refuses to sign?</T></strong></p>
        <p><T>If a tenant has concerns about the lease terms, encourage them to voice those concerns before signing. You can discuss and potentially modify terms to reach an agreement. However, if a tenant ultimately refuses to sign, the lease is not valid and you should not allow them to move in.</T></p>

        <p><strong><T>Can I terminate a lease early?</T></strong></p>
        <p><T>Sometimes situations arise where either party wants to end the lease before its scheduled end. This could be due to a breach of contract, mutual agreement, or other circumstances. iReside supports early termination through the lease termination process, which creates the necessary documentation for both parties.</T></p>

        <p><strong><T>How long should I keep lease documents?</T></strong></p>
        <p><T>It is generally recommended to keep lease documents for several years after the lease ends, especially for tax and legal purposes. With iReside, your documents are stored securely as long as you need them, and you can download copies for your records anytime.</T></p>
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
        <p><T>Here you will find answers to the most common questions about using iReside. Whether you are a tenant trying to understand how payments work or a landlord setting up your properties for the first time, this section covers the essentials. If you do not find what you are looking for here, check the Troubleshooting page or Contact Us.</T></p>

        <h3 id="general"><T>General Questions</T></h3>
        
        <h4 id="what-is-ireside"><T>What is iReside?</T></h4>
        <p><T>iReside is a property management platform that helps landlords and tenants manage the rental process digitally. For landlords, it provides tools to manage properties, screen tenants, collect rent, and handle maintenance. For tenants, it offers a simple way to apply for rentals, pay rent, submit maintenance requests, and communicate with landlords. Everything happens in one place, reducing the need for paperwork and multiple apps.</T></p>

        <h4 id="is-free"><T>Is iReside free to use?</T></h4>
        <p><T>Yes, iReside is completely free for both tenants and landlords to use. There are no subscription fees, no monthly charges, and no hidden costs. Some optional services like background checks may involve fees if your landlord chooses to use them, but these are separate from the iReside platform itself.</T></p>

        <h4 id="who-uses"><T>Who can use iReside?</T></h4>
        <p><T>iReside is designed for anyone involved in private property rentals. This includes landlords who own residential properties, dormitory operators, and property managers, as well as tenants who are looking for a place to rent. The platform is flexible and can accommodate different rental scenarios.</T></p>

        <h4 id="security"><T>Is my data secure?</T></h4>
        <p><T>Yes, keeping your information safe is a top priority for iReside. Your personal and financial data is protected using industry-standard security measures. This includes encrypted data transmission, secure storage, and strict access controls. You can also add extra protection to your account by enabling two-factor authentication in your security settings.</T></p>

        <h3 id="account"><T>Account Questions</T></h3>

        <h4 id="create-account"><T>How do I create an account?</T></h4>
        <p><T>Landlords can create an account by visiting the iReside website and clicking the sign up button. You will be asked to provide your email address, create a password, and enter some basic information about yourself. After signing up, you will go through a verification process to confirm your identity.</T></p>
        <p><T>Tenants do not typically create accounts in advance. Instead, your landlord will send you an application link when you express interest in a property. Once your application is approved and you sign the lease, your account is created automatically using the information you provided.</T></p>

        <h4 id="forgot-password"><T>I forgot my password. What do I do?</T></h4>
        <p><T>If you forget your password, click the Forgot Password link on the login page. Enter the email address associated with your account, and we will send you instructions to reset your password. Follow the link in the email to create a new password. If you do not receive the email within a few minutes, check your spam folder.</T></p>

        <h4 id="two-factor"><T>What is two-factor authentication?</T></h4>
        <p><T>Two-factor authentication, also known as 2FA, is an extra security layer for your account. When enabled, you will need to enter a verification code from your phone in addition to your password when logging in. This means even if someone discovers your password, they still cannot access your account without also having your phone. You can enable two-factor authentication in your account security settings.</T></p>

        <h4 id="change-email"><T>How do I change my email address?</T></h4>
        <p><T>To change your email address, go to your account settings and look for the option to update your contact information. You will need to verify your new email address by clicking a link sent to it. Until the new email is verified, your old email remains the primary contact method for account notifications.</T></p>

        <h3 id="payments"><T>Payment Questions</T></h3>

        <h4 id="pay-rent"><T>How do I pay rent?</T></h4>
        <p><T>{"Tenants can pay rent through the Payments section of their dashboard. iReside currently supports two payment methods. The first is GCash, where you transfer the rent amount to your landlord's GCash account and then upload proof of payment including the reference number. The second is Cash or In-Person, where you notify your landlord of your intent to pay in cash and meet them to complete the payment. Your landlord will then confirm the payment in the system."}</T></p>

        <h4 id="gcash-steps"><T>What are the steps for GCash payment?</T></h4>
        <p><T>{"Here is the step-by-step process for paying via GCash. First, go to your Payments dashboard and select the invoice you want to pay. Choose GCash as your payment method. You will see your landlord's GCash details including their mobile number and sometimes a QR code. Open your GCash app and transfer the exact amount shown on the invoice. Take a screenshot of the confirmation screen in GCash. Back in iReside, enter the 13-digit reference number from your GCash confirmation and upload the screenshot. Submit the payment proof. Your landlord will verify the payment and confirm it in the system."}</T></p>

        <h4 id="payment-timing"><T>When is rent due?</T></h4>
        <p><T>Rent is due on the date specified in your lease agreement. This is typically the first day of each month, but some landlords prefer different due dates. Check your lease or ask your landlord to confirm the exact due date for your rent payments.</T></p>

        <h4 id="late-payments"><T>What happens if I pay late?</T></h4>
        <p><T>The consequences for late payments depend on what your lease says and how your landlord handles the situation. Some landlords may charge a late fee after a grace period, while others may be more flexible. If you know you will be late, communicate with your landlord as soon as possible through the iReside messaging system. Most landlords appreciate being informed and are willing to work out a solution.</T></p>

        <h4 id="receipts"><T>Can I get a receipt for my payment?</T></h4>
        <p><T>Yes. Once your landlord confirms your payment in iReside, a digital receipt is automatically generated. You can view and download receipts from your Payment History at any time. These receipts serve as official proof of payment and are useful for record keeping.</T></p>

        <h3 id="applications"><T>Application Questions</T></h3>

        <h4 id="apply-online"><T>How do I apply for a property online?</T></h4>
        <p><T>When you find a property you are interested in, ask the landlord for an application link. They will send you a unique link that takes you directly to the application form for that property. Fill out all the required information honestly and completely, upload any requested documents, and submit the application. The landlord will review it and get back to you with their decision.</T></p>

        <h4 id="documents-needed"><T>What documents do I need to provide?</T></h4>
        <p><T>The documents required vary depending on what the landlord asks for. Common documents include proof of income such as recent pay stubs or bank statements, a valid government-issued ID like a driver license or passport, and reference letters from previous landlords if available. Check with the specific landlord to see exactly what they require from you.</T></p>

        <h4 id="application-status"><T>How will I know if my application is approved?</T></h4>
        <p><T>You will receive a notification through the iReside app when the landlord makes a decision on your application. If approved, you will typically receive the lease agreement to review and sign. If not approved, the landlord may or may not provide a reason, depending on their preference.</T></p>

        <h3 id="maintenance"><T>Maintenance Questions</T></h3>

        <h4 id="report-issue"><T>How do I report a maintenance issue?</T></h4>
        <p><T>To report a maintenance issue, go to the Maintenance section of your dashboard and click the New Request or plus button. Fill out the form with details about the problem, including a clear title, a description of what is wrong, the category it falls under, and the priority level. You can also upload photos to help illustrate the issue. Once you submit the request, your landlord will be notified and can take action.</T></p>

        <h4 id="emergency-maintenance"><T>What counts as a maintenance emergency?</T></h4>
        <p><T>Emergencies include situations that pose a safety hazard or risk of significant property damage. Examples are gas leaks, electrical hazards, major water leaks or flooding, broken locks that compromise security, and loss of essential services like water or electricity. For emergencies, contact emergency services first if needed, then report the issue through iReside so your landlord is aware and can respond.</T></p>

        <h4 id="maintenance-tracking"><T>How do I track my maintenance request?</T></h4>
        <p><T>You can see the status of your maintenance requests in the Maintenance section of your dashboard. Each request shows its current status such as Submitted, Under Review, Approved, In Progress, or Completed. You will receive notifications when the status changes. You can also message your landlord directly if you have questions about a specific request.</T></p>

        <h3 id="leases"><T>Lease and Document Questions</T></h3>

        <h4 id="view-lease"><T>How do I view my lease agreement?</T></h4>
        <p><T>Your lease agreement and other documents are available in the Lease and Documents section of your dashboard. You can view, download, and print these documents anytime for your records. Having everything stored digitally means you never have to worry about losing important paperwork.</T></p>

        <h4 id="sign-digitally"><T>How does digital signing work?</T></h4>
        <p><T>When you need to sign a document, you will receive a notification in the app. Open the document, read through it carefully, and if you agree to the terms, click the Sign button. Your signature is captured digitally and linked to your account. There is no need to print, scan, or upload anything. The process typically takes just a few minutes.</T></p>

        <h4 id="amend-lease"><T>Can the lease be changed after signing?</T></h4>
        <p><T>Changes to a lease after it has been signed are called amendments. If both the landlord and tenant agree to modify certain terms, an amendment can be created and signed by both parties. The amendment becomes part of the overall lease agreement. To propose a change, contact your landlord through the messaging system and discuss what modification you would like to make.</T></p>

        <h3 id="landlord-questions"><T>Questions for Landlords</T></h3>

        <h4 id="add-property"><T>How do I add a new property?</T></h4>
        <p><T>To add a new property, go to your Properties section and click Add Property. Enter the property details including the address, property type, and description. Add photos to showcase the property. Save the property, and it will appear in your management dashboard. You can then add individual units and configure them for tenants.</T></p>

        <h4 id="invite-tenant"><T>How do I invite a tenant to apply?</T></h4>
        <p><T>There are a few ways to invite tenants. You can send a direct application link to a specific person, or you can create a walk-in application if you meet someone in person who is interested. For online invites, go to your Applications section and create an invitation. Enter the applicant is basic information and send them the link via email or messaging apps.</T></p>

        <h4 id="verify-payment"><T>How do I verify a GCash payment?</T></h4>
        <p><T>When a tenant submits proof of GCash payment, open your GCash app and look for the transaction using the reference number they provided. Confirm that the amount matches your invoice and that the transaction was made recently. If everything looks correct, go to the payment in your dashboard and click Confirm. This updates the invoice status to Paid and generates a receipt for the tenant.</T></p>
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
        <p><T>Sometimes things do not work as expected, and that is okay. This page covers common issues that users encounter and how to resolve them. Try these solutions before contacting support, as they often fix the problem quickly. If you have tried these steps and still need help, scroll down to the Contact Us section at the bottom of this page.</T></p>

        <h3 id="login-issues"><T>Login and Access Issues</T></h3>

        <h4 id="cant-login"><T>I cannot log into my account</T></h4>
        <p><T>If you are having trouble logging in, here are some things to check. First, make sure you are using the correct email address associated with your account. Double-check for typos. Second, verify that your password is correct by looking at what you have typed. Passwords are case-sensitive, so check that caps lock is not accidentally on. Third, try clearing your browser cache or using a different browser. Sometimes old cached data causes login problems.</T></p>
        <p><T>If none of these work, click the Forgot Password link on the login page to reset your password. If you still cannot log in after resetting, you may need to contact support for further assistance.</T></p>

        <h4 id="account-locked"><T>My account is locked</T></h4>
        <p><T>Account locking can happen if there are too many failed login attempts. This is a security feature to protect your account from unauthorized access. If your account is locked, wait about 15 minutes and try again. In the meantime, use the Forgot Password option to reset your password, which should unlock your account immediately.</T></p>

        <h4 id="two-factor-issues"><T>I am having trouble with two-factor authentication</T></h4>
        <p><T>If you are not receiving the verification code, check that your phone has a good signal and that you can receive text messages. Make sure the time on your phone is set correctly, as incorrect time can cause authentication codes to be out of sync. If you have set up an authentication app, ensure the code has not expired. The code changes every few seconds, so wait for a new one if the current one does not work.</T></p>
        <p><T>If you have lost access to your two-factor method, use your backup codes if you saved them during setup. If you do not have backup codes, contact support with verification of your identity so they can help you regain access.</T></p>

        <h3 id="payment-issues"><T>Payment Issues</T></h3>

        <h4 id="payment-not-confirmed"><T>I submitted my payment proof but it is not confirmed</T></h4>
        <p><T>If your payment is showing as pending for a long time, first check that you submitted the proof correctly. Verify that you entered the correct 13-digit GCash reference number and that your screenshot clearly shows the transaction. If the reference number is wrong, you can resubmit with the correct information.</T></p>
        <p><T>Also make sure the amount you paid matches the invoice amount exactly. If there is a discrepancy, contact your landlord to clarify. If you paid in cash, make sure your landlord has confirmed receipt. You can send them a message through the platform to remind them to verify the payment.</T></p>

        <h4 id="wrong-amount"><T>I paid the wrong amount</T></h4>
        <p><T>If you accidentally paid more than the invoice amount, contact your landlord through the messaging system. They can issue a refund for the difference or credit it toward your next rent. If you paid less than the invoice amount, the invoice will remain partially unpaid. You will need to pay the remaining balance to bring it to full payment.</T></p>
        <p><T>For GCash transactions, you can only receive refunds if the sender initiated the transaction as a refund. Work with your landlord to resolve any payment discrepancies.</T></p>

        <h4 id="gcash-error"><T>GCash is not working or I cannot transfer</T></h4>
        <p><T>If GCash is not working for you, first check that the GCash app is updated to the latest version. Make sure you have sufficient balance in your GCash wallet to cover the transfer amount plus any fees. Check that you have not exceeded your transaction limits for the day or week.</T></p>
        <p><T>If GCash is down or experiencing issues, you may need to wait until the service is restored. Check GCash is official social media channels for status updates. In the meantime, if your landlord agrees, you can arrange an alternative payment method.</T></p>

        <h3 id="document-issues"><T>Document Issues</T></h3>

        <h4 id="cant-upload"><T>I cannot upload my documents</T></h4>
        <p><T>If you are having trouble uploading documents, first check the file format. Supported formats are typically JPG, PNG, and PDF. Make sure the file is not too large. If a file is very large, try compressing it or taking a lower resolution photo. Check your internet connection and try again. If the issue persists, try a different browser or device.</T></p>

        <h4 id="document-unclear"><T>My uploaded document is blurry or hard to read</T></h4>
        <p><T>Clear, readable documents are important for verification. If your upload is blurry, try retaking the photo in better lighting. Hold your phone steady and make sure the document is flat. For IDs, avoid reflections or shadows that obscure the text. You can delete and reupload a new photo if needed.</T></p>

        <h4 id="missing-document"><T>I cannot find my uploaded document</T></h4>
        <p><T>All your uploaded documents should appear in the Documents section of your account. If a document you uploaded is missing, first check if it is still being processed. Large files may take a moment to fully upload. Try refreshing the page. If the document still does not appear, try uploading it again.</T></p>

        <h3 id="notification-issues"><T>Notification Issues</T></h3>

        <h4 id="not-receiving-notifications"><T>I am not receiving notifications</T></h4>
        <p><T>If you are not getting notifications, first check your notification settings in your account profile. Make sure notifications are enabled for the types of alerts you want to receive. Next, check your phone is notification settings to ensure the iReside app is allowed to send notifications.</T></p>
        <p><T>If notifications are enabled but you still are not receiving them, check if your phone has a poor internet connection. Notifications require an active connection to be delivered. Also check if you have accidentally blocked notifications from iReside in your phone settings.</T></p>

        <h4 id="too-many-notifications"><T>I am getting too many notifications</T></h4>
        <p><T>You can adjust which notifications you receive in your account settings. Go to Notifications and toggle off the types of alerts you do not want. For example, you might want payment reminders but not marketing updates. Customize your preferences to reduce noise while staying informed about what matters.</T></p>

        <h3 id="app-issues"><T>App Performance Issues</T></h3>

        <h4 id="app-slow"><T>The app is running slowly</T></h4>
        <p><T>If the app feels sluggish, try closing other apps running in the background to free up memory on your device. Clear your browser cache if you are using the web version. Make sure you have a stable internet connection. Restarting your browser or app can also help refresh its performance.</T></p>

        <h4 id="app-crashing"><T>The app keeps crashing</T></h4>
        <p><T>If the app crashes frequently, first make sure you are using the latest version of the app or your browser. Updates often include fixes for stability issues. Try clearing your browser cache or app data and logging in again. If the problem continues, try using a different browser or device to see if the issue is specific to one setup.</T></p>

        <h4 id="page-not-loading"><T>A page is not loading properly</T></h4>
        <p><T>If a specific page will not load, try refreshing your browser. Make sure you have a good internet connection. Sometimes specific pages can get stuck, and a refresh solves the issue. If the page still will not load, try clearing your browser cache and cookies, then reload the page.</T></p>

        <h3 id="maintenance-issues"><T>Maintenance Request Issues</T></h3>

        <h4 id="request-not-received"><T>My landlord did not receive my maintenance request</T></h4>
        <p><T>After you submit a maintenance request, your landlord should receive a notification. If they have not responded or acknowledged the request, first check that you submitted it correctly and received confirmation. Then consider sending your landlord a message through the platform to let them know you have submitted a request. They may have missed the notification.</T></p>

        <h4 id="status-wrong"><T>The status of my maintenance request seems wrong</T></h4>
        <p><T>If you believe the status of your request is incorrect, message your landlord through the platform to clarify. The status should update as the request progresses through stages like Under Review, Approved, In Progress, and Completed. If there is a discrepancy between what you see and what your landlord has told you, a quick message can resolve the confusion.</T></p>

        <h3 id="data-issues"><T>Data and Sync Issues</T></h3>

        <h4 id="data-not-saving"><T>My changes are not saving</T></h4>
        <p><T>If you made changes to your profile or settings and they did not seem to save, first make sure you clicked the Save button if one was required. Check your internet connection, as changes need an active connection to sync. Wait a moment and refresh the page to see if the changes appear. If the problem persists, try logging out and back in before attempting again.</T></p>

        <h4 id="outdated-info"><T>I am seeing outdated information</T></h4>
        <p><T>If you are seeing old data, try refreshing your browser or app. In most cases, a refresh will load the latest information. If the problem continues, clear your browser cache and try again. For data that involves others like your landlord, such as invoice status, there may be a delay while they update their side.</T></p>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Before Contacting Support</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Try these troubleshooting steps first. Many issues can be resolved on your own without needing to contact support. This saves you time and lets our team focus on the cases that really need attention.</T></p>
        </div>

        <h3 id="contact-support"><T>Still Need Help?</T></h3>
        <p><T>If you have tried the steps above and are still experiencing issues, please reach out to our support team. Provide as much detail as possible about the problem you are facing, including any error messages you have seen, what steps you have already tried, and screenshots if relevant. The more information you provide, the faster we can help you.</T></p>
        <p><T>Visit the Contact Us page to learn how to reach our support team.</T></p>
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
        <p><T>We want to make sure you have the best experience possible with iReside. If you have questions, encounter issues, or need assistance with anything, our support team is ready to help. This page explains how to reach us and what to expect when you do.</T></p>

        <h3 id="how-to-reach"><T>How to Contact Support</T></h3>
        <p><T>The easiest way to reach our support team is through the contact form in the app or on our website. Fill out the form with your name, email address, and a detailed description of your question or issue. The more information you provide, the better equipped we will be to help you quickly.</T></p>
        <p><T>You can also message us through the help section in your dashboard if you need assistance with something specific to your account. This allows us to see your account details and provide more targeted help.</T></p>

        <h3 id="what-to-include"><T>What to Include in Your Request</T></h3>
        <p><T>To get the fastest and most helpful response, please include the following information in your request:</T></p>
        <ul>
          <li><strong><T>Your account email:</T></strong> <T>The email address associated with your iReside account.</T></li>
          <li><strong><T>A clear subject:</T></strong> <T>Briefly summarize what your request is about, such as Payment Issue, Login Problem, or Maintenance Request Help.</T></li>
          <li><strong><T>Detailed description:</T></strong> <T>Explain what you are experiencing, what you have already tried, and any error messages you have seen.</T></li>
          <li><strong><T>Screenshots:</T></strong> <T>If applicable, attach screenshots that show the issue. This helps us understand the problem more clearly.</T></li>
          <li><strong><T>Your role:</T></strong> <T>Let us know if you are a tenant or a landlord, and which property or unit your request relates to if applicable.</T></li>
        </ul>

        <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
          <p className="font-black text-blue-700 dark:text-blue-300 m-0"><T>Good Communication Gets Faster Results</T></p>
          <p className="m-0 text-blue-600 dark:text-blue-200 text-sm"><T>Well-structured requests with clear details help our team understand and address your issue much faster than vague messages like Help or It is not working.</T></p>
        </div>

        <h3 id="response-time"><T>Response Time Expectations</T></h3>
        <p><T>We aim to respond to all support requests as quickly as possible. Here is what you can generally expect:</T></p>
        <ul>
          <li><strong><T>General questions:</T></strong> <T>We typically respond within 1 to 2 business days.</T></li>
          <li><strong><T>Technical issues:</T></strong> <T>We typically respond within 1 to 2 business days and work to resolve issues as quickly as possible.</T></li>
          <li><strong><T>Urgent issues:</T></strong> <T>If you have a genuine emergency related to your account security or a critical system failure, please indicate this in your subject line and we will prioritize your request.</T></li>
        </ul>
        <p><T>Business days are Monday through Friday, excluding public holidays. Requests submitted on weekends will be responded to on the next business day.</T></p>

        <h3 id="types-of-help"><T>What We Can Help With</T></h3>
        <p><T>Our support team can assist you with a wide range of issues including:</T></p>
        <ul>
          <li><T>Account access problems and password resets</T></li>
          <li><T>Technical issues with the iReside platform</T></li>
          <li><T>Questions about features and how to use them</T></li>
          <li><T>Payment and invoice discrepancies</T></li>
          <li><T>Maintenance request status questions</T></li>
          <li><T>Document upload and signing issues</T></li>
          <li><T>Bug reports and feature suggestions</T></li>
        </ul>

        <h3 id="limitations"><T>What We Cannot Help With</T></h3>
        <p><T>While we want to help with everything, there are some things outside the scope of iReside support. We cannot provide legal advice, so questions about lease terms, tenant rights, or local rental laws should be directed to a legal professional. We also cannot intervene in disputes between landlords and tenants, though we can help with technical issues related to platform usage.</T></p>

        <h3 id="feedback"><T>Feedback and Suggestions</T></h3>
        <p><T>We are always looking to improve iReside. If you have feedback about features you would like to see, improvements to existing functionality, or ideas for how we can serve you better, we would love to hear from you. Send your suggestions through the same contact form and mark it as feedback. Your ideas help shape the future of the platform.</T></p>

        <h3 id="contact-info"><T>Other Ways to Reach Us</T></h3>
        <p><T>For general inquiries, you can also reach us through our social media channels. However, for specific account issues, the in-app or website contact form is the fastest route since it routes your request directly to the appropriate team member.</T></p>

        <div className="bg-primary/5 border-l-4 border-primary p-4 my-6 rounded-r-lg">
          <p className="font-black text-primary m-0"><T>We Value Your Patience</T></p>
          <p className="m-0 text-text-medium text-sm"><T>During busy periods, response times may be slightly longer than usual. We appreciate your patience and assure you that every request is important to us and will be addressed.</T></p>
        </div>

        <h3 id="escalation"><T>Need to Escalate?</T></h3>
        <p><T>If you have submitted a request and feel it has not been addressed adequately, you can request an escalation. Reply to the support thread you have already started and explain why you feel the issue needs further attention. Please include your original ticket number if you have one. We will review your case and get back to you with an update.</T></p>

        <h3 id="self-help"><T>Before You Contact Us</T></h3>
        <p><T>If you are experiencing a common issue, check our FAQ and Troubleshooting pages first. Many questions can be answered quickly by browsing these resources, and you may find a solution faster than waiting for a response. Visit the FAQ page or the Troubleshooting page to see if your question is already answered there.</T></p>
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
        <h1 className="text-4xl font-black tracking-tight text-text-high">
          <T>{doc.title}</T>
        </h1>
        {doc.subtitle && (
          <p className="text-xl text-text-medium leading-relaxed max-w-3xl">
            <T>{doc.subtitle}</T>
          </p>
        )}
      </header>

      <div className="border-t border-divider pt-10">
        {doc.content}
      </div>

      {/* Feedback Section */}
      <div className="mt-20 flex flex-col items-center gap-6 rounded-2xl border border-divider bg-surface-1 p-8 text-center">
        <div className="space-y-2">
          <p className="text-sm text-text-medium"><T>Help us improve our documentation by providing feedback.</T></p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-divider hover:border-primary hover:text-primary">
            <ThumbsUp className="size-4" /> <T>Yes, it was</T>
          </Button>
          <Button variant="outline" className="gap-2 border-divider hover:border-red-500 hover:text-red-500">
            <ThumbsDown className="size-4" /> <T>Not really</T>
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
                <ArrowLeft className="size-4 mr-2" /> <T>Previous</T>
              </span>
              <span className="text-lg font-black text-text-high group-hover:text-primary">
                <T>{getDocTitle(doc.prev)}</T>
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
                <T>Next</T> <ArrowRight className="size-4 ml-2" />
              </span>
              <span className="text-lg font-black text-text-high group-hover:text-primary">
                <T>{getDocTitle(doc.next)}</T>
              </span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
