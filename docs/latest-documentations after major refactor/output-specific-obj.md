# iReside — Specific Objectives (Updated)

The following specific objectives define the measurable, actionable goals of the iReside property and tenant management system. Each objective is mapped to the corresponding functional requirements and aligned with the post-refactor system philosophy — a **private, landlord-centric management ecosystem** with no public discovery, listing, or marketplace functionality.

---

## 1. To develop a role-based authentication and access control module that provisions user accounts through approved onboarding workflows and restricts system access based on assigned roles.

This objective ensures that only authorized users — Super Administrators, Landlords, and Tenants — can access the system, with each role routed to its appropriate portal upon authentication. Tenant accounts are provisioned exclusively through landlord-initiated or administrator-approved onboarding processes, not through self-registration. The system maintains secure sessions, enforces role-based permissions on all pages, records, and actions, and provides secure sign-out functionality.

**Mapped Requirements:** REQ-1, REQ-2, REQ-3, REQ-4

---

## 2. To develop a property and unit management module that enables landlords to create, configure, and maintain properties and their associated units as the foundation for applications, leases, and tenant occupancy.

This objective provides landlords with the tools to define property records and manage individual units within each property, including attributes such as pricing, deposits, amenities, and availability status. Property and unit data persists across the system and serves as the structural foundation for walk-in applications, lease assignments, and tenant residency. The module includes a Modular Floor Planner (2D Spatial Canvas) with drag-and-drop layout design, grid-snapping alignment, and real-time state persistence to the backend, as well as support for media uploads and structural modifications.

**Mapped Requirements:** REQ-5, REQ-6, REQ-7, REQ-8, REQ-33, REQ-34, REQ-35, REQ-36

---

## 3. To develop a walk-in application and lease finalization module that allows landlords to record prospective tenant applications, manage their approval status, and finalize approved applications into active lease records with provisioned tenant accounts.

This objective supports the landlord-driven onboarding workflow where landlords record applicant details through a walk-in application interface, attach required documents and checklist items, and manage application status from pending through approval. Upon approval, the system finalizes the application into a lease record and automatically provisions a tenant account with credentials for system access.

**Mapped Requirements:** REQ-9, REQ-10, REQ-11, REQ-12

---

## 4. To develop a digital lease management module that supports lease creation, digital signing with dual signing modes, document storage, and lifecycle tracking from draft through active status.

This objective enables landlords and tenants to create, review, sign, and monitor lease agreements digitally. The module supports both in-person (dual) and remote (asynchronous) signing modes with tenant-first signing order enforcement, secure JWT-based signing links for remote tenant signing, and a comprehensive audit trail capturing timestamps, IP addresses, and user agents for all signing events. The system implements a lease status state machine with validated transitions (draft → pending_tenant_signature → pending_landlord_signature → active), preserves wizard state when navigating to external management tools, and provides a document vault for signed agreements, verified move-in condition reports, and lease amendments. Lease progress, start and end dates, remaining days, and renewal eligibility are displayed for both landlords and tenants.

**Mapped Requirements:** REQ-13, REQ-14, REQ-15, REQ-16, REQ-50, REQ-51, REQ-52, REQ-53, REQ-54, REQ-55

---

## 5. To develop a payments and billing module that displays rent and utility charges, tracks payment status, records transaction history, and provides landlords with a live financial ledger for monitoring billing activity.

This objective enables tenants to view outstanding amounts, payment breakdowns (base rent, water, electricity), and completed transactions, while landlords can monitor overdue, pending, and completed invoices through a real-time financial ledger. The system records and displays payment history and chronological transaction logs, and provides invoice management capabilities for landlords.

**Mapped Requirements:** REQ-17, REQ-18, REQ-19, REQ-20

---

## 6. To develop a maintenance request management module that allows tenants to submit repair tickets with supporting details and images, and enables landlords to track, update, and resolve maintenance requests through a centralized dashboard.

This objective provides tenants with the ability to submit maintenance requests for their unit or property with image attachments and descriptions. Landlords can monitor all repair tickets through a maintenance dashboard, update request status from pending to in-progress to completed, and review maintenance request history. The system validates submission requirements and notifies relevant parties of new and updated requests.

**Mapped Requirements:** REQ-21, REQ-22, REQ-23, REQ-24

---

## 7. To develop a real-time messaging module that facilitates communication between tenants, landlords, and administrators with message delivery tracking, media sharing, and content moderation.

This objective enables authorized users to exchange messages in real time through a messaging portal with typing indicators, read receipts, presence indicators, and conversation history with timestamps. The system supports text, image, and file-based messages within conversation threads, and filters unsafe or spam content before delivery using AI-powered moderation to ensure a safe communication environment.

**Mapped Requirements:** REQ-25, REQ-26, REQ-27, REQ-28

---

## 8. To develop an AI-powered tenant assistant (iRis) that provides context-aware, natural-language support using Retrieval-Augmented Generation (RAG) for tenant inquiries about building rules, amenities, lease details, and property information.

This objective allows tenants to submit free-form, natural-language questions and receive contextual AI-generated responses. The iRis assistant retrieves relevant system data — including tenant profile, property details, unit information, active lease details, recent maintenance requests, and recent payments — to generate context-aware responses. The system provides both a full-page chat interface and a floating chat widget, supports conversation history, and returns fallback responses when the AI service is unavailable.

**Mapped Requirements:** REQ-29, REQ-30, REQ-31, REQ-32

---

## 9. To develop an administration and governance module that provides system administrators with platform-wide metrics, registration pipeline management, user governance tools, and landlord registration review capabilities.

This objective equips Super Administrators with a live metrics dashboard displaying real-time KPIs (total users, properties, leases, pending reviews), a registration pipeline for monitoring application flow, user management with role-specific filtering and search, and a detailed registration review interface for vetting landlord applications including document and photo inspection. The system stores administrative notes and decisions, restricts admin features to authorized users, and provides secure sign-out from the administrator portal.

**Mapped Requirements:** REQ-37, REQ-38, REQ-39, REQ-40

---

## 10. To implement security and data protection measures that enforce role-based access control, prevent unauthorized data access, and protect sensitive information across all system modules.

This objective ensures that the system enforces role-based access control at both the application and database levels (via Supabase Auth and PostgreSQL Row-Level Security), prevents unauthorized data access across all modules, maintains secure sign-out functionality, and protects sensitive data including personal information, lease documents, and financial records. Each property operates as an isolated ecosystem, ensuring strict data isolation between properties and between user roles.

**Mapped Requirements:** REQ-41, REQ-42, REQ-43, REQ-44

---

## 11. To develop a landlord analytics, reporting, and auditing module that provides portfolio performance insights through real-time KPI dashboards, AI-driven recommendations, downloadable reports, and activity logging.

This objective provides landlords with a comprehensive view of portfolio performance, including primary KPIs (earnings, active tenants, occupancy rate, pending issues) and extended KPIs (maintenance cost, lease renewals, portfolio value). The module supports simplified and detailed analytics modes, date range filtering with presets and custom ranges, AI-driven performance summaries and strategic recommendations, and featured property analytics. Landlords can generate branded PDF reports and CSV exports for auditing, and the system maintains an export history log. Fallback insights are provided when the AI service is unavailable, and all report generation activity is logged for audit purposes.

**Mapped Requirements:** REQ-45, REQ-46, REQ-47, REQ-48, REQ-49

---

## 12. To develop a community hub module that enables building-wide engagement through discussion posts, photo albums, resident polls, management notices, and utility alerts, with role-based moderation and approval workflows.

This objective provides a shared community space for landlords and tenants within each property. Tenants can create discussion posts, share photo albums, and participate in polls, while landlords can publish management notices and utility alerts. The module supports multi-reaction engagement (like, heart, thumbs up, clap, celebration), threaded comments, post saving, and content reporting. Landlords and administrators have access to an approval queue and moderation dashboard for reviewing and managing resident-submitted content before publication.

**Mapped Requirements:** Derived from system overview — Community Hub module

---

## 13. To develop interactive product tours and onboarding flows that guide new tenants through key system features across the dashboard, messaging, lease management, and community modules.

This objective ensures that new tenants receive a structured, interactive introduction to the platform through step-by-step product tours anchored to key UI elements. Tours cover the tenant dashboard, messaging portal, lease management interface, and community hub, reducing the learning curve and improving initial user engagement with the system.

**Mapped Requirements:** Derived from system overview — Onboarding & Tours module
