# iReside: System Feature Specification

This document provides a comprehensive overview of the current features and technical capabilities implemented within the iReside platform. iReside operates as an exclusive, private property management system for landlords — each property functions as an isolated, private ecosystem where tenants are provisioned through approved onboarding workflows. There is no public listing, searching, or marketplace functionality.

---

## I. AI & Intelligence Engine

### 1. iRis AI Assistant (RAG-Powered)

- **Contextual Intelligence:** Leverages Retrieval-Augmented Generation (RAG) to provide tenants with accurate answers about building rules, property amenities, lease details, and local recommendations.
- **Tenant Data Awareness:** Integrates directly with tenant profiles, active leases, unit information, recent maintenance requests, and recent payments via the Groq Llama 3.1 8B API for personalized assistance.
- **Natural Language Processing:** Allows tenants to ask questions in plain English or Tagalog and receive immediate, context-aware responses.
- **Multi-Access Interface:** Available as both a full-page chat interface and a floating chat widget with conversation history support.
- **Fallback Behavior:** Returns a graceful fallback response when AI services are unavailable.

### 2. AI-Driven Landlord Analytics

- **KPI Insights:** Analyzes financial and operational metrics (Net Income, Occupancy, Maintenance Volume, Lease Renewals, Portfolio Value) using Groq Llama 3.1 8B.
- **Strategic Recommendations:** Provides landlords with concrete next actions based on metric trends and historical performance.
- **Simplified Mode Toggle:** Landlords can switch between "Simplified Mode" and "Detailed Analytics" for dashboard reading.
- **Intelligent Fallbacks:** Seamlessly transitions to rule-based insights if AI processing is unavailable, ensuring continuous intelligence.

### 3. Real-Time Message Moderation

- **Toxic Content Filtering:** Instant real-time filtering of messages using Groq's Llama 3.1 API to block toxic content, hate speech, and spam before delivery.
- **Safety Enforcement:** Ensures a safe communication environment across Landlord–Tenant messaging and Community Hub channels.

---

## II. Property & Asset Management

### 4. Visual Property Management (Modular Floor Planner)

- **Drag-and-Drop Builder:** Structural engine for designing property layouts with interactive manipulation of corridors, units, and room spaces.
- **Grid Snapping:** Precise 20px grid alignment system for accurate floor plan creation.
- **Real-Time Persistence:** All structural changes are saved in real time to the Supabase backend.
- **Read-Only Tenant View:** Tenants can view the building layout as a read-only unit map within their portal.

### 5. Property & Unit Configuration

- **Property Records Management:** Landlords create and manage property records including attributes, amenities, and availability.
- **Unit Definition & Pricing:** Landlords define units within a property with pricing, advance rent requirements, security deposits, and customized monthly rates.
- **Media Management:** Support for uploading high-quality photos and custom descriptions per unit.
- **Amenity Tagging:** Granular tagging of specific unit features for internal management and tenant reference.

---

## III. Applications & Onboarding

### 6. Walk-in Application Processing

- **Landlord-Initiated Applications:** Landlords record walk-in applications for prospective tenants by opening a unit showcase and capturing applicant details.
- **Document & Checklist Management:** Storage of applicant details, supporting documents, and checklist progress for each walk-in application.
- **Status Workflow:** Landlords can save applications as pending or approved and update their status as the process progresses.
- **Lease Finalization:** Approved applications are finalized into lease records with automatic provisioning of a tenant account and credentials.

### 7. Tenant Application Tracking

- **Live Status Monitoring:** Real-time integration with the Supabase backend to track application progress (Reviewing, Approved, etc.).
- **Dynamic Progress Indicators:** Interactive UI components that translate database states into user-friendly progress steps.
- **Application Timeline:** A chronological view of events, including submission dates, status changes, and required actions.

---

## IV. Lease & Document Management

### 8. Digital Lease Management

- **Live Lease Progress Tracking:** Dynamic visualization of active lease progress, start/end dates, and remaining days.
- **Lease Overview:** Both landlords and tenants can view lease details, terms, status, and renewal eligibility.
- **Renewal Eligibility Engine:** Dynamically calculates and displays renewal windows based on database records.
- **Smart Document Vault:** Centralized access to signed master agreements, verified reports, amendments, and related lease files for both parties.

### 9. Enhanced Lease Signing Workflow

- **Dual Signing Modes:** Supports both in-person (dual) and remote (async) signing modes with tenant-first signing order enforcement.
- **Secure Remote Signing:** Generates JWT-based signing links with 30-day expiration for remote tenant signing.
- **Lease Status State Machine:** Implements validated lease status transitions (draft → pending_tenant_signature → pending_landlord_signature → active).
- **Comprehensive Audit Trail:** Logs all signing events with timestamps, IP addresses, and user agents for full auditability.
- **Wizard State Persistence:** Preserves wizard state in localStorage when navigating to external management tools (Contract Templates, Property Policies, Amenities).
- **Signature Validation:** Validates signature data format, size, and dimensions before storage and prevents concurrent signing conflicts.

---

## V. Operations, Reports & Financials

### 10. Portfolio Reporting & Auditing

- **Branded PDF Reports:** Generate professional, iReside-branded PDF performance reports for property portfolios.
- **CSV Data Exports:** Downloadable CSV reports for detailed financial audits and external record-keeping.
- **Export History & Audit Logs:** A chronological repository of all generated reports and historical performance snapshots.
- **Custom Date Ranges:** Preset filters (7D, 30D, 90D, 1Y) and custom date pickers for tailored reporting windows.

### 11. Landlord Maintenance Operations

- **Centralized Ticket Dashboard:** Real-time tracking of maintenance requests with priority-based status (Pending, In-Progress, Completed).
- **Rich Media Documentation:** Support for multi-image galleries and detailed tenant descriptions in maintenance tickets to provide context for repairs.
- **Tenant Submission:** Tenants can submit maintenance requests with image uploads and detailed descriptions for their unit or property.
- **Status Tracking:** Full maintenance request history and real-time status tracking visible to both landlords and tenants.

### 12. Real-Time Financial Operations

- **Live Financial Ledger:** Real-time sync of overdue, pending, and completed rent/utility invoices from the Supabase payments database.
- **Dynamic Invoice Breakdown:** Automatic categorization of base rent, water, and electricity with dynamically fetched values.
- **Invoice Management:** Landlords can create and track invoices for their tenants.
- **Payment History & Logs:** Chronological log of transaction status, payment methods, and timestamps within both the Landlord and Tenant Portals.

---

## VI. Communication & Community

### 13. Real-Time Messaging Engine

- **Instant Delivery:** Powered by Supabase Realtime for lag-free messaging between landlords and tenants.
- **Presence Indicators:** Real-time typing indicators, read receipts, and status tracking for improved user engagement.
- **Media & File Sharing:** Direct upload of documents and photos within conversation threads.
- **Contacts Sidebar:** Conversation management with a contacts list for quick access.

### 14. Community Hub

- **Discussion Posts:** Text-based community threads for building-wide engagement.
- **Photo Albums:** Image galleries (up to 4 photos) for visual updates and announcements.
- **Resident Polls:** Interactive community polls for gathering resident feedback.
- **Management Notices:** Pinned announcements for building-wide updates from landlords.
- **Utility Alerts:** Auto-styled notifications for water, power, and maintenance outages.
- **Threaded Comments:** Real-time discussion threads on any community post.
- **Post Saving & Reporting:** Bookmark important discussions and report spam or harassment.
- **Approval Queue (Landlord):** Review and approve/reject resident posts before they go live.
- **Moderation Dashboard (Landlord):** Centralized tab for handling pending resident content with property filtering.

---

## VII. Tenant Experience & Onboarding

### 15. Tenant Residency Tools

- **Unit Map (Read-Only):** Visual representation of building layout for tenant orientation.
- **Unit Transfer Requests:** Tenants can request transfer to vacant units directly from the unit map.
- **Move-Out Requests:** Digital submission of move-out requests through the tenant portal.

### 16. Product Tours & Onboarding

- **Interactive Guided Tours:** Step-by-step product tours for Dashboard, Messages, Lease, and Community modules.
- **Onboarding Flow:** Structured introduction for new tenants to familiarize them with the platform's capabilities.

---

## VIII. Security & Infrastructure

### 17. Security & Role-Based Access Control (RBAC)

- **Database Isolation (RLS):** Strict data isolation between Super Admin, Landlord, and Tenant roles enforced at the PostgreSQL level via Row-Level Security.
- **Secure Authentication:** Supabase Auth-powered session persistence with role-aware navigation guards.
- **Destructive Sign-Out:** Secure logout functionality with audit-safe session termination.
- **Sensitive Data Protection:** System-wide enforcement of data access restrictions based on authenticated role.

### 18. Cross-Cutting Platform Concerns

- **UI Transitions:** Framer Motion animations for polished user experience.
- **Loading States:** Skeleton loaders for data-heavy views to maintain responsiveness.
- **Typography:** Geist + Rethink Sans fonts for consistent visual identity.
- **Responsive Design:** Mobile-responsive layouts across all modules and portals.

---

## IX. Admin Portal (Super Administrator)

### 19. System Monitoring Dashboard

- **Live Enterprise Metrics:** Real-time monitoring of Total Users, Active Properties, Active Leases, and Pending Reviews.
- **Registration Pipeline Visualization:** Visual progress tracking for landlord applications (Pending → Reviewing → Approved).
- **Role Breakdown Analytics:** Comparative visualization of user roles across the platform.

### 20. Registration & User Governance

- **Advanced Applicant Review:** Detailed Review Modals for evaluating applicant-uploaded documents and profile photos.
- **Internal Administrative Notes:** Capability for admins to leave internal notes and evaluation remarks on registration cases.
- **User Management & Moderation:** Role-specific filter pills (All, Tenant, Landlord, Admin) and combined name/email search for governance.
- **Status Filter Tabs:** Icon-coded status badges for streamlined application processing.
