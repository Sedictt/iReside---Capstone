import type { Metadata } from "next"
import Link from "next/link"
import { LegalDocumentShell, type LegalSection } from "@/components/legal/LegalDocumentShell"
import {
  LegalLink,
  LegalList,
  LegalSubheading,
  LegalTable,
} from "@/components/legal/legal-content"
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton"

export const metadata: Metadata = {
  title: "Privacy Policy | iReside",
  description:
    "How iReside collects, uses, shares and protects personal data, and the rights you have under the Philippine Data Privacy Act of 2012.",
}

const PRIVACY_EMAIL = "ireside.official.mail@gmail.com"
const LAST_UPDATED = "October 8, 2026"
const LAST_UPDATED_ISO = "2026-10-08"
const VERSION = "2.0"

const SUMMARY = (
  <section
    aria-labelledby="privacy-summary-heading"
    className="rounded-3xl border border-primary/30 bg-primary/5 p-6 md:p-8 print:border-border print:bg-transparent"
  >
    <h2 id="privacy-summary-heading" className="text-xl font-bold font-display text-foreground mb-3">
      Privacy at a glance
    </h2>
    <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-foreground/80">
      <li>
        We collect what is needed to run a rental: your account, applications, leases, payment
        records, maintenance requests and messages.
      </li>
      <li>
        <strong>We do not sell personal data</strong>, and iReside runs no advertising or
        third-party analytics trackers.
      </li>
      <li>
        Your landlord sees the information needed to manage your tenancy. Other users only see
        what the feature they are using requires.
      </li>
      <li>
        The iRis assistant and landlord analytics send data to an AI provider (Groq) to produce
        answers. <a href="#ai" className="text-primary underline underline-offset-4">See what is sent</a>.
      </li>
      <li>
        You can ask to access, correct, delete or take a copy of your data, and you may complain
        to the National Privacy Commission.{" "}
        <a href="#rights" className="text-primary underline underline-offset-4">Your rights</a>.
      </li>
    </ul>
  </section>
)

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    title: "Scope and who is responsible",
    icon: "info",
    content: (
      <>
        <p>
          This policy explains how personal data is handled when you use iReside through the web
          app, the Windows desktop app or the Android app. All of them connect to the same
          service. It is written to follow the Philippine{" "}
          <strong>Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, its Implementing
          Rules and Regulations, and the issuances of the National Privacy Commission (NPC).
        </p>

        <LegalSubheading>Who decides how your data is used</LegalSubheading>
        <p>
          iReside is delivered as a separate, independent instance for each landlord or property
          business (see our <Link href="/terms#fees" className="text-primary hover:text-primary-dark font-medium underline underline-offset-4">Terms of Service</Link>).
          That affects who is responsible for your data:
        </p>
        <LegalList>
          <li>
            <strong>The Operator</strong> is the landlord or organization that runs the instance
            you use. The Operator decides what tenant, applicant, lease, billing, maintenance and
            community data is collected and why, and is the{" "}
            <em>personal information controller</em> for that data. Your landlord&apos;s contact
            details are shown in the app.
          </li>
          <li>
            <strong>The iReside development team</strong> builds and maintains the software. We
            handle personal data in an instance only as needed to deploy, support or troubleshoot
            it on the Operator&apos;s instructions. We are the controller of messages you send to
            the contact address below and of this public website.
          </li>
        </LegalList>
        <p>
          Unless stated otherwise, “we” and “us” in this policy mean the Operator and the
          iReside development team acting in those roles.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    icon: "collect",
    content: (
      <>
        <p>
          What we collect depends on how you use iReside. Some of it you give us directly, some
          is created while you use the service, and some is entered about you by your landlord
          (for example a walk-in applicant or a manually added tenant).
        </p>
        <LegalTable
          caption="Categories of personal data collected by iReside"
          columns={["Category", "What it includes"]}
          rows={[
            [
              "Account and profile",
              "Full name, email address, role (landlord or tenant), profile photo, bio, phone number and address. Your password is handled by our authentication provider and stored only as a hash; we cannot read it.",
            ],
            [
              "Landlord business details",
              "Business name, business permit number and uploaded permit documents, and the payment-receiving details a landlord chooses to show tenants (bank account details, GCash or Maya QR codes).",
            ],
            [
              "Rental applications and onboarding",
              "Name, email, phone, employment status and details, monthly income, emergency contact and reference names and phone numbers, desired move-in date, your message, uploaded supporting documents (which may include valid IDs and proof of income, depending on the landlord’s requirements) and application-fee payment proof.",
            ],
            [
              "Lease and tenancy",
              "Lease terms, rent, deposit and dates; electronic signatures; renewal, move-out and unit-transfer requests; and a signing audit trail that records time, IP address and device.",
            ],
            [
              "Billing and payments",
              "Invoices and line items, utility meter readings and rates, uploaded proof-of-payment images, official receipts and (for landlords) expense records and exports. iReside does not process card payments or store card numbers; rent is settled directly between landlord and tenant.",
            ],
            [
              "Maintenance requests",
              "Request description, category, urgency, photos, scheduling and resolution notes.",
            ],
            [
              "Messages and community",
              "Chat messages and attachments, mute, block and report actions, community posts, comments, reactions, poll votes, photo albums and amenity bookings.",
            ],
            [
              "iRis assistant",
              "The questions you ask iRis and its replies, which are kept as your chat history.",
            ],
            [
              "Security and device data",
              "Login sessions (IP address, browser and device), security audit-log entries, one-time passcodes and their expiry, two-factor settings, the Google account email linked for verification, an encrypted account-recovery key and failed-attempt counters.",
            ],
            [
              "Preferences and usage",
              "In-app notifications, onboarding product-tour progress, and your theme, language, text-size, contrast and cookie choices.",
            ],
            [
              "Device permissions (Android app)",
              "Camera and photo access, used only when you choose to take or attach a photo.",
            ],
          ]}
        />

        <LegalSubheading>What we do not collect</LegalSubheading>
        <p>
          iReside does not request GPS or precise location, your contacts, microphone access,
          biometric data or payment card numbers, and it does not use advertising identifiers.
          Addresses in the system are text entered by users, not tracked locations.
        </p>

        <LegalSubheading>Information about other people</LegalSubheading>
        <p>
          If you give us someone else&apos;s details, such as an emergency contact or a
          reference, you confirm that you are allowed to share them and that they know you did.
        </p>
      </>
    ),
  },
  {
    id: "purposes",
    title: "How and why we use your data",
    icon: "purpose",
    content: (
      <>
        <p>
          We use personal data only for the purposes below, which are declared, specific and
          legitimate under Section 11 of the Data Privacy Act. We rely on the lawful criteria in
          Sections 12 and 13 of the Act.
        </p>
        <LegalTable
          caption="Purposes of processing and the lawful basis for each"
          columns={["Purpose", "Examples", "Lawful basis"]}
          rows={[
            [
              "Provide the service",
              "Creating and securing your account, signing you in, showing you your dashboard.",
              "Contract, or steps you request before a contract.",
            ],
            [
              "Handle the tenancy",
              "Processing applications, preparing and signing leases, invoicing, recording payments, handling maintenance and move-outs.",
              "Contract, and the Operator’s legitimate interests in managing its property.",
            ],
            [
              "Communicate with you",
              "Notifications, invitations, one-time passcodes, payment reminders and service notices by email or in-app.",
              "Contract and legitimate interests.",
            ],
            [
              "Keep the platform safe",
              "Session management, audit logs, abuse and spam filtering, handling user reports.",
              "Legitimate interests and legal obligations.",
            ],
            [
              "Assistant and analytics features",
              "Answering your iRis questions; giving landlords plain-language summaries of their own figures.",
              "Your request when you use the feature, and legitimate interests.",
            ],
            [
              "Improve iReside",
              "Fixing errors and checking whether the onboarding tour is understandable.",
              "Legitimate interests.",
            ],
            [
              "Comply with the law",
              "Responding to lawful orders; keeping records the law requires.",
              "Legal obligation.",
            ],
          ]}
        />
        <p>
          We do not use your data for advertising or marketing, and we will not use it for a
          different purpose without telling you and, where required, asking for your consent.
        </p>
      </>
    ),
  },
  {
    id: "sensitive",
    title: "Sensitive personal information",
    icon: "sensitive",
    content: (
      <>
        <p>
          Under the Data Privacy Act, government-issued identifiers such as passport, driver&apos;s
          license, SSS, UMID or tax numbers are <strong>sensitive personal information</strong>.
          iReside does not ask for them itself. A landlord may, however, require valid IDs as part
          of a rental application, and you upload them to the application.
        </p>
        <LegalList>
          <li>We process sensitive personal information only with your consent or where the law allows it.</li>
          <li>Uploaded IDs are meant for the landlord reviewing your application. Do not upload more than the landlord asks for.</li>
          <li>Operators should request only what is necessary and proportionate to screen an applicant, and should not keep IDs longer than needed.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share data with",
    icon: "sharing",
    content: (
      <>
        <LegalSubheading>Inside your iReside instance</LegalSubheading>
        <LegalList>
          <li>
            <strong>Landlord (Operator):</strong> your profile, application, lease, billing,
            maintenance requests and messages with them.
          </li>
          <li>
            <strong>Tenants:</strong> your landlord&apos;s name, business and contact details, and
            property information. Community posts are shared with other residents of that property
            and its management; some resident posts are held for approval first.
          </li>
          <li>
            <strong>Instance administrators:</strong> reports of abusive messages or posts, and
            aggregate onboarding-tour usage metrics.
          </li>
          <li>
            <strong>Other participants:</strong> private messages are visible only to the people
            in that conversation.
          </li>
        </LegalList>

        <LegalSubheading>Service providers</LegalSubheading>
        <p>
          We use the providers below to run iReside. They process data on our behalf, under their
          own terms and privacy policies.
        </p>
        <LegalTable
          caption="Third-party service providers used by iReside"
          columns={["Provider", "What it does for iReside", "Data involved"]}
          rows={[
            [
              "Supabase",
              "Database, user authentication, file storage and real-time updates.",
              "All data stored in the platform, including uploaded files.",
            ],
            [
              "Vercel",
              "Web hosting, server functions, the monthly invoice schedule and hosting of app download files.",
              "Request data such as IP address in server logs.",
            ],
            [
              "Groq",
              "AI model that powers iRis and landlord analytics summaries.",
              "See “AI features” below.",
            ],
            [
              "Google",
              "Optional “Sign in with Google” verification for two-factor authentication, and Google Fonts for page typography.",
              "For verification: your Google email, name and profile. For fonts: your IP address and browser details are sent to Google when a page loads.",
            ],
            [
              "Email delivery (SMTP)",
              "Sends passcodes, invitations, reminders and notices. Gmail by default; an Operator may configure another provider.",
              "Your email address and the content of the message.",
            ],
          ]}
        />

        <LegalSubheading>Legal and regulatory disclosures</LegalSubheading>
        <p>
          We may disclose personal data when required by law, a court order or a lawful request
          from a government authority, or to establish, exercise or defend legal claims.
        </p>

        <LegalSubheading>No sale of personal data</LegalSubheading>
        <p>We do not sell or rent personal data, and we do not share it with advertisers.</p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI features (iRis)",
    icon: "ai",
    content: (
      <>
        <p>
          iReside includes two AI-powered features. Both send data to Groq, a third-party AI
          provider, to generate a response.
        </p>
        <LegalList>
          <li>
            <strong>iRis tenant assistant.</strong> When you ask a question, we send Groq your
            message, up to 80 of your earlier iRis messages, and background about your
            tenancy so the answer is accurate: your name and contact details, lease and rent
            information, recent payment status, the property address, your landlord&apos;s
            contact details, and the building Wi-Fi network name if your landlord has added it. The
            Wi-Fi password is never sent to Groq; the app adds it to the reply card itself.
          </li>
          <li>
            <strong>Landlord analytics.</strong> When a landlord requests an AI summary, we send
            aggregated indicators, such as occupancy, earnings, expenses and pending issues. We
            do not send individual tenant records for this feature.
          </li>
        </LegalList>
        <p>
          AI replies can be wrong or incomplete and are not legal or financial advice. We do not
          use AI to approve or reject applications, set rent or make other decisions about you;
          people make those decisions. Please avoid typing information you would not want
          processed by a third party into iRis. If the AI service is unavailable, analytics fall
          back to built-in summaries that do not use Groq.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    icon: "cookies",
    content: (
      <>
        <p>
          iReside uses only first-party cookies and browser storage that the service needs to work
          or to remember your settings. We do not use advertising cookies, third-party analytics
          or cross-site tracking.
        </p>
        <LegalTable
          caption="Cookies and browser storage used by iReside"
          columns={["Name", "Purpose", "Type"]}
          rows={[
            [
              "Authentication cookies (names begin with “sb-”)",
              "Keep you signed in and protect your session. Without them you cannot log in.",
              "Strictly necessary",
            ],
            [
              "ireside-theme",
              "Remembers light or dark mode.",
              "Preference (local storage)",
            ],
            [
              "ireside_font_scale, ireside_font_size, ireside_high_contrast",
              "Remember your text-size and high-contrast settings.",
              "Preference (local storage)",
            ],
            [
              "ireside_language",
              "Remembers English or Filipino.",
              "Preference (local storage)",
            ],
            [
              "ireside-consent-v1",
              "Remembers your choice in the cookie banner.",
              "Preference (local storage)",
            ],
            [
              "Offline cache",
              "A service worker stores static app files so iReside can open offline. It does not store your personal records.",
              "Strictly necessary",
            ],
          ]}
        />
        <p>
          The cookie banner offers optional “Performance Metrics” and “Personalization” switches.
          iReside currently has no features that depend on them, so your choice does not change
          what runs today. We store it on your device and will honor it, and update this policy
          first, if such features are ever added.
        </p>
        <p>
          Preference items stay on your device until you clear your browser data. Blocking
          strictly necessary cookies will prevent you from signing in.
        </p>
        <div className="not-prose mt-4">
          <CookiePreferencesButton />
        </div>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect your data",
    icon: "security",
    content: (
      <>
        <p>
          We apply organizational, physical and technical safeguards in line with Section 20 of
          the Data Privacy Act. The measures currently in place include:
        </p>
        <LegalList>
          <li>Encryption in transit: iReside is served over HTTPS.</li>
          <li>Password hashing handled by our authentication provider, so we never see or store your password in plain text.</li>
          <li>Row-level security in the database, which restricts each record to the users who are entitled to see it (for example, a tenant&apos;s own lease and the landlord who owns it).</li>
          <li>Phone number and home address are kept in a separate, more restricted profile record.</li>
          <li>Optional two-factor authentication using an email passcode, with Google account verification also available to landlords.</li>
          <li>An account-recovery security key stored with AES-256-GCM encryption, with progressive lockout after failed attempts.</li>
          <li>A list of your signed-in devices in Settings, where you can end any session you do not recognize.</li>
          <li>Security audit logs for sensitive account actions, in which the IP address is masked.</li>
          <li>Automated filtering and reporting tools for abusive or spam content in chat.</li>
        </LegalList>
        <p>
          Property photos and branding images are publicly viewable by design, so listings can
          display them. Do not put personal information in them.
        </p>

        <LegalSubheading>What you can do</LegalSubheading>
        <p>
          Use a strong, unique password, turn on two-factor authentication, keep your recovery
          key somewhere safe, sign out on shared devices, and review your active sessions
          regularly.
        </p>

        <LegalSubheading>If something goes wrong</LegalSubheading>
        <p>
          No system is completely secure. If a personal data breach occurs that requires
          notification, we will notify the NPC and affected individuals within seventy-two (72)
          hours of becoming aware of it, as required by NPC Circular 16-03, and tell you what
          happened and what you can do.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    icon: "retention",
    content: (
      <>
        <p>
          We keep personal data only as long as needed for the purposes in this policy or as the
          law requires.
        </p>
        <LegalTable
          caption="Retention periods by type of data"
          columns={["Data", "How long we keep it"]}
          rows={[
            ["Account and profile", "While your account is active, then until you ask for deletion."],
            ["Applications", "While needed to decide the application and handle any dispute. Deleted or anonymized on request, unless needed for a legal claim."],
            ["Leases, invoices, receipts, payment proofs and signing audit trails", "For the tenancy and afterwards for as long as Philippine tax, accounting and civil-law requirements call for."],
            ["Chat messages and community content", "Until you or a moderator delete them, or your account is removed."],
            ["iRis chat history", "Until your account is removed or you ask us to delete it."],
            ["Sessions, passcodes and invitation links", "Sessions last until sign-out or expiry. Passcodes and invitation links expire after a short time."],
            ["Provider backups", "Copies in provider backups are overwritten on the provider’s normal backup cycle after deletion."],
          ]}
        />
        <p>
          iReside does not currently delete records automatically on a schedule. Deletion is
          carried out by the Operator or the iReside team when you make a verified request (see
          “Your rights”).
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    icon: "rights",
    content: (
      <>
        <p>As a data subject under the Data Privacy Act you have the right to:</p>
        <LegalList>
          <li><strong>Be informed</strong> about how your data is processed, which this policy aims to do.</li>
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Object</strong> to processing, including withdrawing consent at any time where we rely on it.</li>
          <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
          <li><strong>Erase or block</strong> your data from our system where it is unlawfully obtained, no longer necessary or you withdraw consent, subject to records we must keep by law.</li>
          <li><strong>Data portability</strong>: receive your data in a structured, commonly used format.</li>
          <li><strong>Claim damages</strong> for inaccurate, incomplete, outdated, false or unlawfully obtained data, or unauthorized use of it.</li>
          <li><strong>Complain</strong> to the National Privacy Commission.</li>
        </LegalList>
        <p>
          Your lawful heirs and assigns may exercise these rights for you after your death or if
          you become incapacitated. If you are in a country where other privacy laws give you
          additional rights, contact us and we will handle your request under the law that
          applies to you.
        </p>

        <LegalSubheading>How to use your rights</LegalSubheading>
        <p>
          You can correct most profile details and review your active sessions directly in
          Settings. For anything else, including access, copies, deletion or withdrawing consent,
          email{" "}
          <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink> from the address
          registered to your account, or ask your landlord. We may need to verify your identity
          first. We will answer within a reasonable time and tell you if we cannot fully act on
          a request and why.
        </p>

        <LegalSubheading>Complaints</LegalSubheading>
        <p>
          If you think your data was mishandled, please contact us first so we can try to fix it.
          You may also file a complaint with the{" "}
          <LegalLink href="https://privacy.gov.ph" external>
            National Privacy Commission (privacy.gov.ph)
          </LegalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children’s privacy",
    icon: "children",
    content: (
      <p>
        iReside is meant for adults aged 18 and over and is not directed at children. We do not
        knowingly collect personal data from anyone under 18. If you believe a minor has given us
        personal data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "Where data is stored",
    icon: "transfers",
    content: (
      <p>
        Our providers (Supabase, Vercel, Groq and Google) may store or process data on servers
        outside the Philippines, including in the United States. The region used by an instance
        depends on how it was set up; the Operator can tell you. We remain responsible for
        personal data we place with providers and choose providers that offer data-protection
        terms.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    icon: "changes",
    content: (
      <>
        <p>
          We will update this policy when our practices or the law change. The date and version
          at the top show the latest revision. We will tell you about material changes through an
          in-app notification or email before they take effect. Where the law requires your
          consent for a new use of your data, we will ask for it again instead of treating
          continued use as agreement.
        </p>
        <p>
          <strong>Version 2.0 (October 8, 2026):</strong> rewritten to describe the data iReside
          actually handles, its service providers and AI features, and your rights under the Data
          Privacy Act.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    icon: "contact",
    content: (
      <>
        <p>
          For questions about this policy or to exercise your rights, contact our Data Protection
          Officer at{" "}
          <LegalLink href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</LegalLink>. For matters
          about a specific property or tenancy, you can also contact your landlord, who is the
          Operator of your instance.
        </p>
        <p>
          See also our{" "}
          <Link
            href="/terms"
            className="text-primary hover:text-primary-dark font-medium underline underline-offset-4"
          >
            Terms of Service
          </Link>
          .
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalDocumentShell
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data iReside handles, why, who it is shared with, and
          the choices and rights you have.
        </p>
      }
      lastUpdated={LAST_UPDATED}
      lastUpdatedIso={LAST_UPDATED_ISO}
      version={VERSION}
      searchPlaceholder="Search this policy (e.g. cookies, AI, retention)…"
      summary={SUMMARY}
      sections={SECTIONS}
    />
  )
}
