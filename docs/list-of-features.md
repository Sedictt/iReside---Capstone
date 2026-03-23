# iReside: System Feature Specification

This document provides a comprehensive overview of the current features and technical capabilities implemented within the iReside platform, reflecting the full scope of the integrated property and tenant services ecosystem.

## I. AI & Intelligence Engine

### 1. iRis AI Assistant (RAG-Powered)
*   **Contextual Intelligence:** Leverages Retrieval-Augmented Generation (RAG) to provide tenants with accurate answers about building rules, specific property amenities, and local recommendations.
*   **Tenant Data Awareness:** Integrates directly with tenant profiles and lease data via the Groq Llama 3 API for personalized assistance.
*   **Natural Language Processing:** Allows tenants to ask questions in plain English/Tagalog and receive immediate, context-aware responses.

### 2. AI-Driven Landlord Analytics
*   **KPI Insights:** Automagically analyzes financial and operational metrics (Net Income, Occupancy, Maintenance Volume) using Llama 3.1.
*   **Strategic Recommendations:** Provides landlords with concrete next actions based on metric trends and historical performance.
*   **Simplified Mode Toggle:** Landlords can switch between "Simplified Mode" and "Detailed Analytics" for dashboard reading.
*   **Intelligent Fallbacks:** Seamlessly transitions to rule-based insights if AI processing is unavailable, ensuring continuous intelligence.

### 3. Real-Time Message Moderation
*   **Toxic Content Filtering:** Instant real-time filtering of messages using Groq's Llama 3 API to block toxic content, hate speech, and spam before delivery.
*   **Security & Safety:** Ensures a safe communication environment across Landlord-Tenant channels.

## II. Property & Asset Management

### 4. Visual Property Management (Modular Builder)
*   **Blueprint Creation:** Drag-and-drop interface for designing floor plans with 20px grid-snapping for precise alignment.
*   **Interactive Structural Engine:** Ability to manipulate and position units, corridors, and room structures within a modular canvas.
*   **State-Persistence:** Real-time saving of all structural changes to the Supabase backend.

### 5. Unit Listing Wizard
*   **Multi-Step Configuration Workflow:** A simplified multi-step process for defining rent, deposits, and property details for internal management.
*   **Dynamic Pricing & Deposit Engine:** Landlords define advance rent requirements, security deposits, and customized monthly rates.
*   **Media Management Vault:** Specialized slots for high-quality photos (Bedroom, Bathroom, Kitchen, Living Area) and custom room descriptions.
*   **Amenity Tagging:** Granular tagging of specific unit features for enhanced discovery.

## III. Operations, Reports & Financials

### 6. Walk-in Applications & Unit Showcasing
*   **Interactive Unit Showcase:** A visually rich presentation modal displaying unit details, photos, and amenities to prospective walk-in clients directly from the landlord's dashboard.
*   **Multi-Step Walk-in Modal:** Landlords can dynamically record applications for prospective tenants, capturing personal information, employment details, and required documents.
*   **Pending & Approved States:** Applications with incomplete requirements are saved as 'pending' to be resumed later, while fully compliant ones are 'approved'.
*   **Automated Tenant Provisioning:** Finalizing a lease for an approved walk-in automatically creates a tenant account and emails them their credentials.

### 7. Portfolio Reporting & Auditing
*   **Branded PDF Reports:** Generate professional, iReside-branded PDF performance reports for property portfolios.
*   **CSV Data Exports:** Downloadable CSV reports for detailed financial audits and external record-keeping.
*   **Export History & Audit Logs:** A chronological repository of all generated reports and historical performance snapshots.
*   **Custom Date Ranges:** Preset filters (7D, 30D, 90D, 1Y) and custom date pickers for tailored reporting windows.

### 8. Landlord Maintenance Operations
*   **Centralized Ticket Dashboard:** Real-time tracking of maintenance requests with priority-based status (Pending, In-Progress, Completed).
*   **Rich Media Documentation:** Support for multi-image galleries and detailed tenant descriptions in maintenance tickets to provide context for repairs.

### 9. Digital Lease & Document Management
*   **Live Lease Progress Tracking:** Dynamic visualization of active lease progress, start/end dates, and remaining days.
*   **Signature-Ready Agreements:** Digital lease contracts with support for move-in condition reports and amendments.
*   **Smart Document Vault:** Centralized access to verified/signed master agreements and reports for both parties.
*   **Renewal Eligibility Engine:** Dynamically calculates and displays renewal windows based on database records.

### 10. Real-Time Financial Operations
*   **Live Financial Ledger:** Real-time sync of overdue, pending, and completed rent/utility invoices from the Supabase payments database.
*   **Dynamic Invoice Breakdown:** Automatic categorization of base rent, water, and electricity with dynamically fetched values.
*   **Payment History & Logs:** Chronological log of transaction status, payment methods, and timestamps within the Tenant Portal.

### 11. Walk-in Application Tracking
*   **Live Status Monitoring:** Real-time integration with the Supabase backend to track walk-in application progress (Pending, Approved).
*   **Dynamic Progress Indicators:** Interactive UI components that translate database states into user-friendly progress steps.
*   **Application Timeline:** A chronological view of events, including submission dates, checklist completions, and required actions.

## IV. Communication & Core Infrastructure

### 12. Real-Time Messaging Engine
*   **Instant Delivery:** Powered by Supabase Realtime for lag-free messaging between roles.
*   **Presence Indicators:** Real-time typing indicators and read status tracking for improved user engagement.
*   **Media & File Sharing:** Direct upload of documents and photos within conversation threads.

### 13. Security & Role-Based Access (RBAC)
*   **Database Isolation (RLS):** Strict data isolation between Super Admin, Landlord, and Tenant roles enforced at the PostgreSQL level via Row Level Security.
*   **Secure Authentication:** Supabase Auth-powered session persistence with role-aware navigation guards.
*   **Destructive Sign-Out:** Secure logout functionality with audit-safe session termination.

## V. Admin Portal (Super Administrator)

### 14. System Monitoring Dashboard
*   **Live Enterprise Metrics:** Real-time monitoring of Total Users, Active Properties, Active Leases, and Pending Reviews.
*   **Registration Pipeline Visualization:** Visual progress tracking for landlord applications (Pending, Reviewing, Approved).
*   **Role Breakdown Analytics:** Comparative visualization of user roles across the platform.

### 15. Registration & User Governance
*   **Advanced Applicant Review:** Detailed Review Modals for evaluating applicant-uploaded documents and profile photos.
*   **Internal Administrative Notes:** Capability for admins to leave internal notes and evaluation remarks on registration cases.
*   **User Management & Moderation:** Role-specific filtering (All, Tenant, Landlord, Admin) and name/email search for governance.

## VI. Technical Stack

*   **Runtime:** Next.js 16 (App Router)
*   **Core Framework:** React 19
*   **Logic:** TypeScript
*   **Styling:** Tailwind CSS 4
*   **Database & Realtime:** Supabase (Postgres, RLS, Auth)
*   **AI Engine:** Groq (Llama 3.1) via OpenAI SDK
*   **Mapping:** Leaflet.js / React Leaflet
*   **Interactivity:** @dnd-kit (Core & Sortable), Framer Motion
*   **UI Components:** Radix UI, Lucide React
*   **Typography:** Geist, Rethink Sans

## VII. ISO/IEC 25010 Compliance Goals

The system is engineered to assess the applicable ISO/IEC 25010 quality characteristics:
1.  **Functional Suitability:** Functional completeness, correctness, and appropriateness of property and account operations.
2.  **Performance Efficiency:** Responsive time behavior for search, mapping, and AI-assisted workflows.
3.  **Compatibility:** Co-existence with common browsers and interoperability with Supabase and AI services.
4.  **Usability:** Appropriateness recognizability, learnability, operability, user error protection, user interface aesthetics, and accessibility.
5.  **Reliability:** Maturity, availability, fault tolerance, and recoverability supported by the backend infrastructure.
6.  **Security:** Confidentiality, integrity, non-repudiation, accountability, and authenticity through role-based access control.
7.  **Maintainability:** Modularity, reusability, analyzability, modifiability, and testability through the Next.js architecture.
8.  **Flexibility:** Adaptability, scalability, installability, and replaceability across device sizes and deployment environments.
9.  **Safety:** Operational constraint, risk identification, fail-safe behavior, hazard warnings, and safe integration where applicable.

The terms User engagement, Inclusivity, User assistance, and Self-descriptiveness are not official ISO/IEC 25010 subcharacteristics and will only be used as descriptive usability considerations if needed.

Only the subcharacteristics applicable to iReside will be used in the evaluation.