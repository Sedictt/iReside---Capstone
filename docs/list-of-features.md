# iReside: System Feature Specification

This document provides a comprehensive overview of the current features and technical capabilities implemented within the iReside platform.

## I. AI & Intelligence Engine

### 1. iRis AI Assistant (RAG-Powered)
*   **Contextual Intelligence:** Leverages Retrieval-Augmented Generation (RAG) to provide tenants with accurate answers about building rules, specific property amenities, and local recommendations.
*   **Tenant Data Awareness:** Integrates directly with tenant profiles and lease data via the Groq Llama 3 API for personalized assistance.
*   **Real-time Interaction:** Integrated chat interface within the tenant dashboard and messaging portal.

### 2. AI-Driven Landlord Analytics
*   **KPI Insights:** Automagically analyzes financial and operational metrics (Net Income, Occupancy, Maintenance Volume) using Llama 3.1.
*   **Strategic Recommendations:** Provides landlords with concrete next actions based on metric trends and historical performance.
*   **Intelligent Fallbacks:** Seamlessly transitions to rule-based insights if AI processing is unavailable, ensuring continuous intelligence.

## II. Property & Asset Management

### 3. Visual Property Management (Modular Builder)
*   **Blueprint Creation:** Drag-and-drop interface for designing floor plans with 20px grid snapping and interactive manipulation of units, corridors, and structures.
*   **Interactive Unit Map:** A high-level visual representation of property layouts, allowing landlords to see occupancy status at a glance.
*   **State-Persistence:** Real-time saving of structural changes to the Supabase backend.

### 4. Unit Listing Wizard
*   **Simplified Publishing:** A multi-step workflow for moving internal units to the public marketplace.
*   **Dynamic Pricing Engine:** Landlords can define multi-month advance rent, security deposits, and customized monthly rates.
*   **Media Management:** Built-in photo slots for bedroom, bathroom, kitchen, and living areas with support for custom room views.

## III. Operations & Financials

### 5. Smart Discovery Portal
*   **Map-Based Search:** Leaflet-integrated discovery allowing users to search properties within specific map radii.
*   **Dynamic Location Suggestions:** Real-time city, barangay, and street suggestions powered by master geo-data and historical property listings.
*   **Advanced Filtering:** Granular search controls for price range, property type (Apartment, Condo, etc.), and specific amenities.

### 6. Landlord Maintenance Operations
*   **Centralized Dashboard:** Real-time tracking of maintenance requests with priority status (Pending, In-Progress, Completed).
*   **Rich Media Requests:** Support for multi-image galleries and detailed tenant descriptions in maintenance tickets.
*   **Direct Management:** One-click assignment and status updates for handling facility repairs.

### 7. Digital Lease Management
*   **Live Dashboard-Centric Tracking:** Real-time monitoring of active lease progress, visually charting days remaining, start/end dates, and calculating renewal eligibility windows dynamically from the database.
*   **Smart Document Vault:** Centralized access to master agreements, move-in condition reports, and amendments with accurate verified/signed status tracking mapped directly to backend records.
*   **Integrated Landlord Connectivity:** One-click capabilities to message or directly call the assigned property manager associated with the active lease.

### 8. Financial Operations & Real-Time Payments
*   **Live Financial Ledger:** Real-time synchronization of overdue, pending, and completed rent/utility invoices straight from the Supabase payments database.
*   **Dynamic Payment Breakdown:** Automatically visualizes individual expense items categorized by base rent, water, and electricity with their corresponding dynamically fetched values.
*   **Integrated Payment History:** Chronological log of paid invoices accurately denoting payment method, time, and transaction status directly inside the Tenant Portal.

## IV. Communication & Core Infrastructure

### 9. Real-Time Messaging Engine
*   **Supabase Realtime:** Instant message delivery with typing indicators and read status tracking.
*   **AI Chat Moderation:** Instant real-time filtering of messages using Groq's Llama 3 API to block toxic content, hate speech, and spam before delivery.
*   **Media & File Sharing:** Direct upload and retrieval of documents and photos within conversations.
*   **Role-Based Channels:** Automated participant identification to categorize conversations between tenants and landlords.

### 10. Security & Role-Based Access (RBAC)
*   **Granular Permissions:** Strict data isolation between Landlord and Tenant roles enforced at the database level via Row Level Security (RLS).
*   **Secure Authentication:** Integrated Supabase Auth with session persistence and role-aware navigation guards.

---

## V. Admin Portal

### 11. Admin Sidebar & Navigation
*   **Contextual Nav Items:** Each sidebar link includes a description subtitle and an icon container, with an active-state gradient highlight and chevron indicator.
*   **Role-Branded Header:** iReside Admin Portal branding with a rose gradient shield icon and ambient glow.
*   **Destructive Sign-Out:** Logout button with red hover state isolated at the bottom of the sidebar.

### 12. Admin Portal Dashboard
*   **Live Metrics Overview:** Real-time stat cards displaying Total Users, Total Properties, Active Leases, and Pending Reviews — each with per-card accent colors and skeleton loading states.
*   **Registration Pipeline Panel:** Visual progress bar breaking down landlord applications by Pending, Reviewing, and Approved states with proportional width segments.
*   **User Breakdown Panel:** Side-by-side tenant vs. landlord count cards with role-specific accent colors.
*   **Quick Actions Row:** Contextual shortcut links to high-priority admin tasks (pending reviews, user management) with live counts.

### 13. Admin Users Management
*   **Role Filter Pills:** One-click filter tabs for All, Tenant, Landlord, and Admin roles with live counts per category.
*   **Avatar Component:** Displays user profile photos with initials-based fallback for users without avatars.
*   **Combined Search + Filter:** Name/email search combined with role filtering for fast user lookup.

### 14. Admin Registrations Review
*   **Status Filter Tabs:** Filter tabs with live counts for all application states (Pending, Reviewing, Approved, Rejected).
*   **Review Modal:** Full-screen backdrop modal with applicant avatar, document links, admin notes textarea, and one-click status action buttons.
*   **Status Badges:** Color-coded badges with icons for each application state across the table and modal.

---

## VI. Intelligent Tenant Lifecycle & Discovery

### 15. Tenant Application Tracking
*   **Live Backend Integration:** Fetch real-time application status directly from the Supabase database via dedicated REST endpoints.
*   **Dynamic Status Mapping:** Transforms internal database states (e.g., 'reviewing', 'approved') into rich UI progress indicators and informative UX prompts.
*   **Vaulted Properties & Timeline:** Provides prospective tenants with a unified view of saved properties and a chronological timeline of application events.

---

## VII. Technical Stack
*   **Core:** Next.js (App Router), TypeScript, Tailwind CSS
*   **Database & Realtime:** Supabase (PostgreSQL, RLS)
*   **AI Engine:** Groq (Llama 3 / 3.1)
*   **Mapping:** Leaflet.js
*   **Components:** Radix UI, Framer Motion, Lucide React