# iReside: Integrated System Design, Database Design, & API Documentation

**A Unified Engineering & Reference Guide for the iReside Rental Management Platform**  
*Version 1.0 | May 2026*

---

## Table of Contents

1. [SYSTEM DESIGN & ARCHITECTURE](#1-system-design--architecture)
   - 1.1 [Platform Vision & Core Objectives](#11-platform-vision--core-objectives)
   - 1.2 [Ecosystem Architecture](#12-ecosystem-architecture)
   - 1.3 [User Roles & RBAC Matrix](#13-user-roles--rbac-matrix)
   - 1.4 [Core Component Modules](#14-core-component-modules)
   - 1.5 [Security & Multi-Tenant Data Isolation Model](#15-security--multi-tenant-data-isolation-model)
   - 1.6 [Technology Stack System Components](#16-technology-stack-system-components)
     - 1.6.1 [Frontend Technology](#161-frontend-technology)
     - 1.6.2 [Backend Technology](#162-backend-technology)
     - 1.6.3 [Database](#163-database)
     - 1.6.4 [API or Third-Party Integration](#164-api-or-third-party-integration)
     - 1.6.5 [Security or Authentication](#165-security-or-authentication)
     - 1.6.6 [Cloud or Deployment Platform](#166-cloud-or-deployment-platform)
   - 1.7 [Key Architectural Paradigms](#17-key-architectural-paradigms)
2. [DATABASE DESIGN & SCHEMA REFERENCE](#2-database-design--schema-reference)
   - 2.1 [Database Architecture & Strategy](#21-database-architecture--strategy)
   - 2.2 [Entity-Relationship Diagram (ERD)](#22-entity-relationship-diagram-erd)
   - 2.3 [PostgreSQL Enum Reference](#23-postgresql-enum-reference)
   - 2.4 [Exhaustive Data Dictionary](#24-exhaustive-data-dictionary)
3. [API SPECIFICATION & DOCUMENTATION](#3-api-specification--documentation)
   - 3.1 [API Architecture & Request Standards](#31-api-architecture--request-standards)
   - 3.2 [API Routes Directory Map](#32-api-routes-directory-map)
   - 3.3 [Authentication & Session Endpoints](#33-authentication--session-endpoints)
   - 3.4 [AI Assistant (iRis) Endpoints](#34-ai-assistant-iris-endpoints)
   - 3.5 [Landlord Analytics & Insights Endpoints](#35-landlord-analytics--insights-endpoints)
   - 3.6 [Direct Messaging & Chat Endpoints](#36-direct-messaging--chat-endpoints)
   - 3.7 [Community Hub Endpoints](#37-community-hub-endpoints)
   - 3.8 [Maintenance Operations Endpoints](#38-maintenance-operations-endpoints)
   - 3.9 [Billing & Payment Processing Endpoints](#39-billing--payment-processing-endpoints)
   - 3.10 [Lease Management Endpoints](#310-lease-management-endpoints)
   - 3.11 [Standardized Error Handling Framework](#311-standardized-error-handling-framework)
   - 3.12 [Rate Limiting Policies](#312-rate-limiting-policies)
4. [SYSTEM GLOSSARY & REFERENCE](#4-system-glossary--reference)

---

# 1. SYSTEM DESIGN & ARCHITECTURE

## 1.1 Platform Vision & Core Objectives

**iReside** is an enterprise-grade **Integrated Rental Management System** designed to bridge structural operational gaps in rental property administration, specifically engineered to support multi-tenant properties (such as in Barangay Marulas, Valenzuela City). By replacing fragmented legacy methods (manual paper logs, scattered messaging apps, and local offline spreadsheets) with a highly secure, real-time reactive web application, iReside establishes an authoritative, single source of truth for both landlords and tenants.

### Strategic Problems Addressed

| Legacy Operational Issues | iReside Core Architectural Solutions |
| :--- | :--- |
| **Fragile Payment Records** | Immutable Ledger with Itemized Line-Item Invoicing. |
| **Latency in Maintenance Response** | Digital Maintenance Lifecycle Tracker with AI Triage Support. |
| **Ambiguity in Lease Clauses** | Secure Remote Document Vault containing Electronically Signed Agreements. |
| **Support Overhead for Property Rules** | 24/7 AI Tenant Concierge (`iRis`) trained on specific Property Context. |
| **Static & Disconnected Property Mapping** | Dynamic "Digital Twin" Grid-Mapped Floor Plans updating automatically on lease change. |
| **Disjointed Tenant Communication** | Moderated Property Announcement Board & Encrypted Real-Time Messaging. |

---

## 1.2 Ecosystem Architecture

iReside is structured as a decoupled modern single-page application (SPA) backed by a secure Serverless BaaS (Supabase/PostgreSQL) and a dedicated AI Inference layer (Groq/Llama 3.1).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              iReside Ecosystem                              │
└─────────────────────────────────────────────────────────────────────────────┘

                           ┌───────────────────────┐
                           │    SUPER ADMIN        │
                           │   (System Manager)    │
                           └───────────┬───────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
               ▼                       ▼                       ▼
     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
     │    LANDLORD     │    │     TENANT      │    │    COMMUNITY    │
     │   (Property     │    │    (Resident)   │    │   (Social Hub)   │
     │    Manager)     │    │                 │    │                 │
     └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
              │                      │                      │
              │    ┌────────────────┼────────────────┐     │
              │    │                │                │     │
              ▼    ▼                ▼                ▼     ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                    SHARED DATA LAYER                        │
     │                                                             │
     │   • Properties    • Units    • Leases    • Payments         │
     │   • Maintenance   • Messages • Documents • Notifications    │
     │                                                             │
     │                    SUPABASE DATABASE                         │
     │              (PostgreSQL with Row-Level Security)            │
     └─────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │    AI LAYER (iRis)      │
                     │    Groq Llama 3.1       │
                     │    + RAG Context        │
                     └─────────────────────────┘
```

---

## 1.3 User Roles & RBAC Matrix

To enforce strict boundary control, the system applies **Role-Based Access Control (RBAC)** at the client application level and **Row-Level Security (RLS)** policies at the relational database level.

```
                  ┌────────────────────────────────────────┐
                  │          AUTHENTICATED SESSION         │
                  └──────────────────┬─────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   SUPER ADMIN   │         │    LANDLORD     │         │     TENANT      │
│  Full Platform  │         │ Scope: Managed  │         │  Scope: Leased  │
│    Oversight    │         │   Properties    │         │    Unit Only    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Authorization Permissions Detail

1. **Super Administrator**:
   - Access to platform-wide monitoring panels.
   - Ability to review and approve/reject Landlord verification registrations.
   - View global system performance audit metrics and logs.

2. **Landlord**:
   - Full CRUD permissions on owned `properties` and child `units`.
   - Complete control over `leases` creation, remote signing invitations, and walk-in application tracking.
   - Management and assignment of `maintenance_requests` related to units under their portfolio.
   - Receipt reconciliation, utility fee logging, and financial ledger exports.
   - Moderation of all `community_posts` and `comments` created within their property scopes.

3. **Tenant**:
   - Read access to their active `lease` record, itemized ledger entries, and historical rent `payments`.
   - Access to submit `maintenance_requests` for their assigned unit and follow the status lifecycle.
   - Two-way real-time direct messaging with their landlord.
   - Full participation in `community_posts` (creation of discussions, poll voting, photo-viewing, and commenting).
   - Infinite conversation history with the `iRis AI Assistant` scoped strictly to their unit rules.

---

## 1.4 Core Component Modules

### 1.4.1 Unit Map (Digital Twin Floor Planning)
Landlords design building layout grids directly in the application using a drag-and-drop 20px snapped canvas. This digital twin reflects property status dynamically:
*   🟢 **Vacant**: Unit contains no active, signed leases.
*   🔵 **Occupied (Paid)**: Lease is active and current billing balance is zero.
*   🟡 **Due Soon**: Dynamic threshold calculation indicating payment deadline is within a 5-day window.
*   🔴 **Overdue**: Current timestamp exceeds lease billing due date without confirmed payment.
*   🟠 **Active Maintenance (Pulsing)**: Linked to an unresolved maintenance ticket categorized with a High or Urgent priority status.

### 1.4.2 Landlord Analytics Dashboard
A real-time command deck tracking portfolio health metrics:
*   **Portfolio Earned Revenue**: Calculated sum of completed payments within the active billing cycle.
*   **Occupancy Rate Formula**: $\frac{\text{Occupied Units}}{\text{Total Configured Units}} \times 100$.
*   **Simplified vs. Detailed Metrics Toggle**: Simplifies KPI charts for immediate updates, or deep-dives into multi-variant historical cost comparisons.
*   **Report Generation Engine**: Compiles database logs into audit-ready PDF/CSV files with automated timestamp tracking.

### 1.4.3 Tenant Portal
An all-in-one personal dashboard facilitating resident independence:
*   **Document Vault**: Provides permanent access to signed, timestamped PDF lease covenants.
*   **Payment Ledger**: Lists itemized historical receipts, current utility balances, and GCash/Maya reference submission tools.
*   **Direct Support Actions**: Submits maintenance claims, starts instant messaging threads with landlords, or activates the `iRis` conversational assistant.

### 1.4.4 Financial Ledger
Eliminates bulk payment ambiguity by recording utility consumption and base rent individually. Invoice items store independent descriptions, prices, and categories (e.g., base rent, electrical surcharge, municipal water fees), allowing itemized tracking and partial payment reconciliation.

### 1.4.5 AI Assistant (iRis)
A RAG-powered chatbot leveraging Groq Llama 3.1 to answer tenant queries 24/7. When a tenant sends a prompt:
1.  The middleware identifies the tenant's authenticated session context (Property, Unit, Active Lease rules, Utility balances).
2.  It queries PostgreSQL using vector embeddings (via `pgvector`) to pull localized rules (e.g., quiet hours, garbage collection schedules).
3.  It constructs an augmented LLM prompt providing context-rich answers, blocking unauthorized leakage of other tenants' data.

### 1.4.6 Community Hub
A secure social utility for properties, enabling four structural post types: Announcements, Polls, Photo Albums, and Discussions. The landlord retains administrative control, supporting pre-moderation settings to approve tenant posts before they publish onto the property feed.

### 1.4.7 Lease Management Lifecycle
Ensures legal compliance via a robust digital signing flow (In-person signature drawing pad or secure Remote signing link). Leases track state progression through:
`Draft` $\rightarrow$ `Pending Tenant Signature` $\rightarrow$ `Pending Landlord Signature` $\rightarrow$ `Active` $\rightarrow$ `Expired` or `Terminated`.

### 1.4.8 Payment Processing & Ledger Verification
Integrates native Philippine financial channels (GCash, Maya, Bank Transfer) alongside offline cash payment collection. The landlord acts as the verifying authority, marking submissions as `Completed` upon manual or automated invoice reference matching.

### 1.4.9 Maintenance System & AI Triage
Enables tenants to submit maintenance issues with photo payloads. An AI engine processes descriptions upon receipt, extracting structural categories (e.g., Electrical, Plumbing, HVAC) and proposing priority levels (Low, Medium, High, Urgent) to optimize property maintenance schedules.

---

## 1.5 Security & Multi-Tenant Data Isolation Model

To guarantee strict tenant isolation, iReside leverages PostgreSQL **Row-Level Security (RLS)** in Supabase. All select, insert, update, and delete actions are evaluated at the database query execution layer, bypassing application logic dependencies for access control.

```
  ┌────────────────────────────────────────────────────────┐
  │                   CLIENT DATA REQUEST                  │
  │            (Authorization: Bearer JWT Token)           │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 SUPABASE AUTHENTICATION                │
  │        (Extracts authenticated user metadata)          │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │            POSTGRESQL ROW-LEVEL SECURITY (RLS)         │
  │   Checks user role and applies filter expressions:     │
  │   - Landlords: Scoped to matching property_id          │
  │   - Tenants: Scoped to matching profile_id             │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │             FILTERED RECORD RESULT RETURNED            │
  └────────────────────────────────────────────────────────┘
```

### Crucial Security Mechanisms
*   **JWT Bearer Tokens**: All Next.js client requests append the secure Supabase auth token in the request header.
*   **LLM Content Moderation**: Outgoing direct messages and community posts pass through a Llama-based toxicity check, filtering out hostile text, offensive speech, and contact spam.

---

## 1.6 Technology Stack System Components

iReside is built on a highly performant, type-safe, and secure stack engineered to provide a visual, reliable, and intelligent rental management experience.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                             iReside Tech Stack                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FRONTEND                   BACKEND & SERVICES            DATABASE          │
│ ┌────────────────────────┐ ┌─────────────────────────────┐ ┌───────────────┐ │
│ │ • Next.js 16           │ │ • Node.js Serverless        │ │ • PostgreSQL  │ │
│ │ • React 19             │ │ • Next.js API Routes        │ │ • Supabase    │ │
│ │ • TypeScript           │ │ • Puppeteer Scraper         │ │ • RLS Policies│ │
│ │ • Tailwind CSS v4      │ │ • Groq Cloud (Llama 3.1)    │ │ • pgvector    │ │
│ │ • GSAP / Framer Motion │ │ • Edge Functions            │ │ • Core Indexes│ │
│ │ • Progressive Web App  │ │ • Vercel Cron-Jobs          │ │ • Triggers    │ │
│ └────────────────────────┘ └─────────────────────────────┘ └───────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.6.1 Frontend Technology
*   **Next.js 16 & React 19**: Leverages the Next.js App Router for optimized server-side rendering (SSR), incremental static regeneration (ISR) for property catalogs, and React Server Components (RSC) to minimize client-side JavaScript payloads.
*   **TypeScript (Strict Mode)**: Enforces end-to-end type safety, preventing structural runtime bugs across complex forms, state management hooks, and database schemas.
*   **Tailwind CSS v4**: Houses the visual design tokens, dynamic gradients, responsive grids, and standard visual utilities. Avoids ad-hoc UI styles to enforce consistency.
*   **Framer Motion & GSAP (GreenSock)**: Orchestrates hardware-accelerated layouts, smooth micro-animations, loading shimmers, slide-out portal panels, and grid snaps.
*   **PWA (Progressive Web Application)**: Implements offline caching, service workers, and standalone application installation on desktop and mobile.

### 1.6.2 Backend Technology
*   **Next.js API Handlers**: Built using TypeScript to run under Node.js Serverless and Vercel Edge Runtimes. Provides high-throughput processing with minimal cold start latency.
*   **Supabase Client Infrastructure**: Interacts securely with the database from server endpoints using service-role instances, and directly from the client using public keys bounded by active user tokens.
*   **Puppeteer Integration**: Deploys a headless browser engine in serverless environments to scrape local validation indices for automated business verification.

### 1.6.3 Database
*   **Supabase PostgreSQL**: A production-grade relational database running PostgreSQL 15+. Supports native JSONB formats for complex metadata (e.g. lease terms details or compliance checklists).
*   **pgvector**: Handles multi-dimensional vector embeddings, empowering semantic similarity searches during iRis AI context retrieval phases.
*   **Database Triggers & Custom Functions**: Automatically registers `profiles` upon auth signup, manages `unit_status` transitions based on lease lifecycle triggers, and records timestamps via custom database procedures.

### 1.6.4 API or Third-Party Integration
*   **Groq Cloud Inference API**: Interfaces with Groq's high-speed hardware to run Llama 3.1 LLM models. Powers the 24/7 `iRis` tenant chatbot and landlord analytical summaries.
*   **Philippine Financial Rails Integration**: Configures webhook integration endpoints to process GCash, Maya, and Bank Transfer references. 
*   **Vercel Cron-Jobs**: Automates scheduled billing cycles (configured in `vercel.json` pointing to `/api/cron/monthly-invoices` running monthly).
*   **Supabase Storage Bucket API**: Stores PDF lease contracts, user avatars, community albums, and maintenance photo attachments under secure paths protected by storage access policies.

### 1.6.5 Security or Authentication
*   **Supabase Auth**: Implements secure JWT Bearer tokens alongside HTTP-only cookies to handle user registration, logins, session updates, and sign-outs.
*   **Row-Level Security (RLS)**: PostgreSQL-native filter rules applied directly to tables, verifying `auth.uid()` against target parameters to prevent cross-tenant exposure.
*   **AI Message Toxicity Filter**: Intercepts chat and community bulletin submissions, utilizing LLM-based categorization to block harassment, spam, and malicious inputs.

### 1.6.6 Cloud or Deployment Platform
*   **Vercel Cloud Platform**: Hosts the frontend application, Next.js API Routes, and Edge/Serverless runtimes. Integrates with GitHub to support continuous integration and automatic branch previews.
*   **Supabase Cloud**: Manages database instances, user tables, and storage buckets. Runs geographically adjacent to Vercel instances to ensure minimal query latency.

---

## 1.7 Key Architectural Paradigms

*   **Retrieval-Augmented Generation (RAG)**: Extends standard AI capabilities by dynamically fetching active lease clauses and local property rule vector embeddings prior to generation.
*   **PostgreSQL RLS**: Secures databases against direct exposure by evaluating authorization parameters at the data layer.
*   **Progressive Web Application (PWA)**: Compiles properties for instant access on mobile devices, deploying web workers to store service caches for offline review.
*   **Digital Twin Mapping**: Synchronizes database states (Lease agreements, billing structures, maintenance priorities) directly onto the Unit Map.
*   **Zero-Latency Sync**: Harnesses real-time websocket listeners in Supabase to sync client layouts instantaneously upon database mutation events.

---

# 2. DATABASE DESIGN & SCHEMA REFERENCE

## 2.1 Database Architecture & Strategy

iReside utilizes a relational **Supabase PostgreSQL** instance optimized with secondary indexes and table triggers. 
*   **Integrity**: Foreign keys define cascading behaviors (`ON DELETE CASCADE` or `ON DELETE SET NULL`) ensuring no orphaned entries in properties or units.
*   **Optimized Performance**: Searchable fields (`property_id`, `unit_id`, `tenant_id`, `landlord_id`) implement indexing to reduce query retrieval latency under load.
*   **Auto-Trigger Actions**: Custom PostgreSQL database functions automate operational sequences:
    - Signing profiles automatically upon Auth user registration.
    - Updating unit status to `occupied` or `vacant` based on active lease status.
    - Calculating timestamps and tracking modifications in an audit ledger.

---

## 2.2 Entity-Relationship Diagram (ERD)

The following schema maps the relational structure of the active iReside database.

```mermaid
erDiagram
    profiles {
        uuid id PK
        uuid user_id UK
        text email
        text full_name
        text phone
        text role
        text avatar_url
        timestamp created_at
        timestamp updated_at
    }

    landlord_applications {
        uuid id PK
        uuid user_id
        text business_name
        text business_type
        text address
        text documents
        text status
        timestamp reviewed_at
        timestamp created_at
    }

    landlord_reviews {
        uuid id PK
        uuid landlord_id FK
        uuid tenant_id FK
        uuid lease_id FK
        integer rating
        text comment
        timestamp created_at
    }

    properties {
        uuid id PK
        uuid landlord_id FK
        text name
        text address
        text city
        text district
        text property_type
        text status
        text description
        jsonb amenities
        jsonb photos
        numeric latitude
        numeric longitude
        timestamp created_at
        timestamp updated_at
    }

    listings {
        uuid id PK
        uuid property_id FK
        uuid landlord_id FK
        text title
        text description
        numeric price
        text status
        integer views
        integer leads
        timestamp created_at
    }

    saved_properties {
        uuid id PK
        uuid user_id FK
        uuid property_id FK
        timestamp created_at
    }

    geo_locations {
        uuid id PK
        uuid property_id FK
        text place_id
        text name
        text address
        numeric latitude
        numeric longitude
        jsonb bounds
    }

    units {
        uuid id PK
        uuid property_id FK
        text unit_number
        text floor
        text unit_type
        text status
        numeric rent_amount
        numeric deposit_amount
        integer bedroom_count
        integer bathroom_count
        numeric floor_area
        text description
        jsonb amenities
        timestamp created_at
        timestamp updated_at
    }

    applications {
        uuid id PK
        uuid unit_id FK
        uuid applicant_id FK
        uuid landlord_id FK
        text status
        text message
        numeric monthly_income
        text employment_status
        date move_in_date
        text[] documents
        text applicant_name
        text applicant_phone
        text applicant_email
        jsonb employment_info
        uuid lease_id FK
        timestamp created_at
    }

    leases {
        uuid id PK
        uuid unit_id FK
        uuid tenant_id FK
        uuid landlord_id FK
        text status
        date start_date
        date end_date
        numeric monthly_rent
        numeric security_deposit
        jsonb terms
        text tenant_signature
        text landlord_signature
        timestamp signed_at
        text signing_mode
        timestamp tenant_signed_at
        timestamp landlord_signed_at
        timestamp created_at
    }

    lease_signing_audit {
        uuid id PK
        uuid lease_id FK
        uuid actor_id
        text actor_role
        text action
        jsonb metadata
        timestamp created_at
    }

    move_out_requests {
        uuid id PK
        uuid lease_id FK
        uuid tenant_id FK
        uuid landlord_id FK
        text status
        text reason
        date requested_move_out_date
        date actual_move_out_date
        timestamp reviewed_at
        timestamp created_at
    }

    unit_transfer_requests {
        uuid id PK
        uuid from_unit_id FK
        uuid to_unit_id FK
        uuid tenant_id FK
        uuid approved_by FK
        text status
        text reason
        timestamp created_at
        timestamp reviewed_at
    }

    maintenance_requests {
        uuid id PK
        uuid unit_id FK
        uuid tenant_id FK
        uuid assignee_id FK
        text priority
        text status
        text category
        text subject
        text description
        text[] photo_urls
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    payments {
        uuid id PK
        uuid lease_id FK
        uuid tenant_id FK
        uuid landlord_id FK
        numeric amount
        text currency
        text payment_type
        text status
        text payment_method
        text reference_number
        timestamp paid_at
        timestamp created_at
    }

    payment_items {
        uuid id PK
        uuid payment_id FK
        uuid lease_id FK
        text description
        numeric amount
        text status
    }

    conversations {
        uuid id PK
        text type
        text subject
        timestamp last_message_at
        timestamp created_at
    }

    conversation_participants {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        timestamp joined_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text content
        text message_type
        timestamp sent_at
        timestamp created_at
    }

    community_posts {
        uuid id PK
        uuid author_id FK
        uuid property_id FK
        text content
        text post_type
        integer view_count
        timestamp created_at
        timestamp updated_at
    }

    community_comments {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        text content
        uuid parent_comment_id
        timestamp created_at
        timestamp updated_at
    }

    community_reactions {
        uuid id PK
        uuid post_id FK
        uuid comment_id FK
        uuid user_id FK
        text reaction_type
        timestamp created_at
    }

    community_photos {
        uuid id PK
        uuid post_id FK
        uuid uploader_id FK
        text photo_url
        text caption
        timestamp created_at
    }

    community_albums {
        uuid id PK
        uuid post_id UK FK
        uuid property_id FK
        text cover_photo_url
        integer photo_count
        timestamp created_at
    }

    community_poll_votes {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text vote_choice
        timestamp created_at
    }

    post_views {
        uuid id PK
        uuid post_id FK
        uuid viewer_id FK
        timestamp viewed_at
    }

    content_reports {
        uuid id PK
        uuid reporter_id FK
        uuid content_type
        uuid content_id
        text reason
        text status
        timestamp created_at
    }

    iris_chat_messages {
        uuid id PK
        uuid user_id FK
        text role
        text content
        jsonb metadata
        timestamp created_at
    }

    message_user_actions {
        uuid id PK
        uuid user_id FK
        uuid message_id FK
        text action_type
        timestamp created_at
    }

    message_user_reports {
        uuid id PK
        uuid reporter_id FK
        uuid message_id FK
        text reason
        timestamp created_at
    }

    tenant_product_tour_states {
        uuid id PK
        uuid user_id UK
        jsonb completed_steps
        jsonb skipped_steps
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    tenant_product_tour_events {
        uuid id PK
        uuid user_id FK
        text event_type
        jsonb metadata
        timestamp created_at
    }

    landlord_statistics_exports {
        uuid id PK
        uuid landlord_id FK
        text export_type
        text file_url
        text status
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text type
        text title
        text body
        jsonb data
        boolean is_read
        timestamp created_at
    }

    landlord_inquiry_actions {
        uuid id PK
        uuid inquiry_id FK
        uuid landlord_id FK
        text action
        text notes
        timestamp created_at
    }

    profiles ||--o{ landlord_applications : "registers"
    profiles ||--o{ landlord_reviews : "receives"
    profiles ||--o{ leases : "signs_as_landlord"
    profiles ||--o{ leases : "signs_as_tenant"

    properties ||--o{ listings : "has"
    properties ||--o{ units : "contains"
    properties ||--o{ community_posts : "has"
    properties ||--o{ community_albums : "has"
    properties ||--o{ geo_locations : "has"

    units ||--o{ applications : "receives"
    units ||--o{ leases : "covered_by"
    units ||--o{ maintenance_requests : "has"
    units ||--o{ unit_transfer_requests : "transfer_source"
    units ||--o{ unit_transfer_requests : "transfer_destination"

    applications ||--o{ leases : "creates"
    leases ||--o{ move_out_requests : "triggers"
    leases ||--o{ payments : "generates"
    leases ||--o{ landlord_reviews : "references"

    conversations ||--o{ conversation_participants : "includes"
    conversations ||--o{ messages : "contains"
    messages ||--o{ message_user_actions : "received"
    messages ||--o{ message_user_reports : "reported"

    community_posts ||--o{ community_comments : "receives"
    community_posts ||--o{ community_reactions : "receives"
    community_posts ||--o{ community_photos : "has"
    community_posts ||--o{ community_albums : "has_one"
    community_posts ||--o{ community_poll_votes : "receives"
    community_posts ||--o{ post_views : "received"

    iris_chat_messages ||--o{ tenant_product_tour_events : "triggers"

    payments ||--o{ payment_items : "contains"
```

---

## 2.3 PostgreSQL Enum Reference

| Enum Name | Allowed Values | Description |
| :--- | :--- | :--- |
| `user_role` | `tenant`, `landlord`, `admin` | Application access privilege scope |
| `property_type` | `apartment`, `condo`, `house`, `townhouse`, `studio` | Property architectural classifications |
| `unit_status` | `vacant`, `occupied`, `maintenance` | Physical availability state of real estate |
| `lease_status` | `draft`, `pending_signature`, `pending_tenant_signature`, `pending_landlord_signature`, `active`, `expired`, `terminated` | Agreement execution lifecycle state |
| `payment_status` | `pending`, `processing`, `completed`, `failed`, `refunded` | Ledger verification transaction state |
| `payment_method` | `credit_card`, `debit_card`, `gcash`, `maya`, `bank_transfer`, `cash` | Billed amount remittance medium |
| `application_status` | `pending`, `reviewing`, `approved`, `rejected`, `withdrawn` | Onboarding lifecycle checkpoint |
| `maintenance_status` | `open`, `in_progress`, `resolved`, `closed` | Facility support lifecycle checkpoint |
| `maintenance_priority`| `low`, `medium`, `high`, `urgent` | Severity prioritization level |
| `move_out_status` | `pending`, `approved`, `denied`, `completed` | Tenant departure request state |
| `message_type` | `text`, `system`, `image`, `file` | Real-time chat media type |
| `notification_type` | `payment`, `lease`, `maintenance`, `announcement`, `message`, `application`| System event message classification |
| `location_type` | `city`, `barangay`, `street` | Geographic index classification |
| `listing_scope` | `property`, `unit` | Marketing scale boundaries |
| `listing_status` | `draft`, `published`, `paused` | Public visibility configuration |
| `post_type_enum` | `announcement`, `poll`, `photo_album`, `discussion` | Social hub post classification |
| `post_status_enum` | `draft`, `published`, `archived` | Visibility index of post |
| `reaction_type_enum` | `like`, `heart`, `thumbs_up`, `clap`, `celebration` | Interaction metrics classification |
| `report_status_enum` | `pending`, `reviewed`, `dismissed`, `escalated` | Content abuse review state |
| `unit_transfer_status`| `pending`, `approved`, `denied`, `cancelled` | Unit rearrangement request state |

---

## 2.4 Exhaustive Data Dictionary

### 2.4.1 Identity & User Management

#### `profiles` Table
Stores user accounts extending default Supabase auth metadata.
*   **Indices**: Unique index on `user_id`.
*   **Foreign Keys**: `id` references `auth.users.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique system user ID | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | `TEXT` | Legal verified email address | `tenant1@ireside.app` |
| `full_name` | `TEXT` | Complete name (given and surname) | `Maria Santos` |
| `role` | `user_role` | Assigned system role | `tenant` |
| `avatar_url` | `TEXT (Nullable)`| Cloud storage URL to user portrait | `https://cdn.ireside.app/avatars/maria.jpg` |
| `phone` | `TEXT (Nullable)`| Mobile number index | `+63-917-555-1200` |
| `business_name` | `TEXT (Nullable)`| Managed business name (Landlord only) | `Santos Property Rentals` |
| `business_permits`| `TEXT[]` | Paths to local regulatory licenses | `{"permit-2026.pdf"}` |
| `created_at` | `TIMESTAMPTZ` | Profile creation timestamp | `2026-03-10T08:30:00Z` |
| `updated_at` | `TIMESTAMPTZ` | Last profile update timestamp | `2026-03-28T14:22:15Z` |

#### `landlord_applications` Table
Collects applications for verifying new Landlords.
*   **Foreign Keys**: `profile_id` references `profiles.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Application unique ID | `8a61eb2a-f8d9-4b6a-90df-548dc67a7b32` |
| `profile_id` | `UUID (FK)` | Registering profile identifier | `550e8400-e29b-41d4-a716-446655440010` |
| `phone` | `TEXT` | Verification contact index | `+63-917-800-4411` |
| `identity_document_url` | `TEXT` | Path to valid identification scan | `https://cdn.ireside.app/docs/id-4411.png` |
| `ownership_document_url`| `TEXT` | Path to certified Title scan | `https://cdn.ireside.app/docs/title-4411.pdf` |
| `status` | `application_status`| Status of verification | `reviewing` |
| `admin_notes` | `TEXT (Nullable)`| Internal administrator audit notations | `Verified tax declaration and ID.` |
| `created_at` | `TIMESTAMPTZ` | Submission timestamp | `2026-03-12T03:05:00Z` |
| `updated_at` | `TIMESTAMPTZ` | Last evaluation timestamp | `2026-03-13T07:42:00Z` |

---

### 2.4.2 Property & Listing Management

#### `properties` Table
Stores real-estate portfolios.
*   **Foreign Keys**: `landlord_id` references `profiles.id` with `ON DELETE RESTRICT`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Property unique ID | `16a0db58-91d8-447f-9f82-f2ef2485531f` |
| `landlord_id` | `UUID (FK)` | Owner/Manager identifier | `550e8400-e29b-41d4-a716-446655440020` |
| `name` | `TEXT` | Marketing/Complex title | `Sunset Residences` |
| `address` | `TEXT` | Full street location | `123 Maysan Road, Valenzuela City` |
| `city` | `TEXT` | Managed metropolitan city | `Valenzuela` |
| `type` | `property_type` | Property structural style | `apartment` |
| `lat` | `DOUBLE PRECISION`| Latitudinal coordinate value | `14.7001` |
| `lng` | `DOUBLE PRECISION`| Longitudinal coordinate value | `120.9834` |
| `amenities` | `TEXT[]` | Property shared structures | `{"wifi","parking"}` |
| `house_rules` | `TEXT[]` | Complex behavior requirements | `{"No pets","Quiet hours after 10 PM"}` |
| `images` | `TEXT[]` | Property catalog URLs | `{"front.jpg","lobby.jpg"}` |
| `contract_template`| `JSONB` | Base document used for leases | `{"title":"Standard Lease v2"}` |
| `created_at` | `TIMESTAMPTZ` | Property creation timestamp | `2026-03-09T05:15:00Z` |
| `updated_at` | `TIMESTAMPTZ` | Property modification timestamp | `2026-03-29T09:10:00Z` |

#### `units` Table
Individual habitable spaces within a property.
*   **Indices**: Index on `property_id` for fast layout rendering.
*   **Foreign Keys**: `property_id` references `properties.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unit unique ID | `2613d503-0639-46ca-b88d-73e16ecce8ba` |
| `property_id` | `UUID (FK)` | Parent property identifier | `16a0db58-91d8-447f-9f82-f2ef2485531f` |
| `name` | `TEXT` | Door designation code | `Unit 2B` |
| `floor` | `INT` | Level elevation count | `2` |
| `status` | `unit_status` | Operational availability state | `occupied` |
| `rent_amount` | `NUMERIC(12,2)` | Contract monthly charge | `12500.00` |
| `beds` | `INT` | Sleeping spaces count | `2` |
| `baths` | `INT` | Bathrooms spaces count | `1` |
| `created_at` | `TIMESTAMPTZ` | Unit creation timestamp | `2026-03-09T06:30:00Z` |
| `updated_at` | `TIMESTAMPTZ` | Unit modification timestamp | `2026-03-25T10:20:00Z` |

---

### 2.4.3 Leasing & Applications

#### `applications` Table
Prospective tenant applications for vacant units.
*   **Foreign Keys**: 
    - `unit_id` references `units.id` with `ON DELETE CASCADE`.
    - `applicant_id` references `profiles.id` with `ON DELETE SET NULL`.
    - `landlord_id` references `profiles.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Application unique ID | `c4b58526-f33e-4718-b964-6e70d1ebfd62` |
| `unit_id` | `UUID (FK)` | Desired unit identifier | `2613d503-0639-46ca-b88d-73e16ecce8ba` |
| `applicant_id` | `UUID (FK, Nullable)`| Associated portal user ID | `550e8400-e29b-41d4-a716-446655440030` |
| `applicant_name` | `TEXT` | Raw name string (Walk-in fallback) | `John dela Cruz` |
| `applicant_phone`| `TEXT` | Raw phone string (Walk-in fallback) | `+63-917-444-8899` |
| `applicant_email`| `TEXT` | Raw email string (Walk-in fallback) | `john.dc@example.com` |
| `monthly_income` | `NUMERIC(12,2)` | Declared salary sum | `35000.00` |
| `status` | `application_status`| Review workflow state | `approved` |
| `compliance_checklist`| `JSONB` | Verification checklist | `{"valid_id":true,"lease_signed":false}` |
| `created_at` | `TIMESTAMPTZ` | Submission timestamp | `2026-03-24T08:00:00Z` |

#### `leases` Table
Binding legal agreements.
*   **Indices**: Index on `tenant_id`, `unit_id`.
*   **Foreign Keys**:
    - `unit_id` references `units.id` with `ON DELETE RESTRICT`.
    - `tenant_id` references `profiles.id` with `ON DELETE RESTRICT`.
    - `landlord_id` references `profiles.id` with `ON DELETE RESTRICT`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Lease unique ID | `01f91dad-5e2e-42df-b248-477dc1490acb` |
| `unit_id` | `UUID (FK)` | Linked property unit | `2613d503-0639-46ca-b88d-73e16ecce8ba` |
| `tenant_id` | `UUID (FK)` | Occupying tenant profile | `550e8400-e29b-41d4-a716-446655440030` |
| `status` | `lease_status` | Lease state progression | `active` |
| `start_date` | `DATE` | Execution start day | `2026-04-15` |
| `end_date` | `DATE` | Execution conclusion day | `2027-04-14` |
| `monthly_rent` | `NUMERIC(12,2)` | Rate due every month | `12500.00` |
| `security_deposit`| `NUMERIC(12,2)`| Security deposit amount | `12500.00` |
| `tenant_signature`| `TEXT (Nullable)`| Tenant signature drawn payload | `data:image/png;base64,iVBOR...` |
| `landlord_signature`| `TEXT (Nullable)`| Landlord signature countersigned payload| `data:image/png;base64,iVBOR...` |
| `signed_at` | `TIMESTAMPTZ` | Date agreement was fully signed | `2026-04-10T10:22:00Z` |
| `created_at` | `TIMESTAMPTZ` | Covenant draft timestamp | `2026-03-28T02:15:00Z` |

---

### 2.4.4 Financials & Billing

#### `payments` Table
Invoice and billing ledger tracking.
*   **Foreign Keys**:
    - `lease_id` references `leases.id` with `ON DELETE SET NULL`.
    - `tenant_id` references `profiles.id` with `ON DELETE SET NULL`.
    - `landlord_id` references `profiles.id` with `ON DELETE RESTRICT`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Payment unique ID | `7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa` |
| `lease_id` | `UUID (FK)` | Active lease contract | `01f91dad-5e2e-42df-b248-477dc1490acb` |
| `tenant_id` | `UUID (FK)` | Billed tenant profile | `550e8400-e29b-41d4-a716-446655440030` |
| `amount` | `NUMERIC(12,2)` | Billed amount | `13250.00` |
| `status` | `payment_status` | Transaction status | `completed` |
| `method` | `payment_method` | Selected payment method | `gcash` |
| `due_date` | `DATE` | Payment due date | `2026-04-05` |
| `paid_at` | `TIMESTAMPTZ` | Date payment was settled | `2026-04-04T11:40:00Z` |
| `reference_number`| `TEXT` | Transaction reference code | `GCASH-20260404-9912` |
| `landlord_confirmed`| `BOOLEAN` | True if manual ledger audit completed | `true` |
| `created_at` | `TIMESTAMPTZ` | Billing invoice timestamp | `2026-04-01T00:00:00Z` |

#### `payment_items` Table
Line-item breakdown of invoices (e.g. utilities).
*   **Foreign Keys**:
    - `payment_id` references `payments.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Line-item unique ID | `19d3d916-c014-4fd5-b68e-aa6023595728` |
| `payment_id` | `UUID (FK)` | Parent invoice header ID | `7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa` |
| `label` | `TEXT` | Line item description | `Electricity Consumption` |
| `amount` | `NUMERIC(12,2)` | Amount charged | `750.00` |
| `category` | `TEXT` | Charge categorization classification | `electricity` |

---

### 2.4.5 Operations & Maintenance

#### `maintenance_requests` Table
Repair issues filed by tenants.
*   **Foreign Keys**:
    - `unit_id` references `units.id` with `ON DELETE CASCADE`.
    - `tenant_id` references `profiles.id` with `ON DELETE SET NULL`.
    - `assignee_id` references `profiles.id` with `ON DELETE SET NULL` (Worker account).

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Request unique ID | `d82861a7-96ba-437e-a98b-d46720fd40f0` |
| `unit_id` | `UUID (FK)` | Target room requiring repair | `2613d503-0639-46ca-b88d-73e16ecce8ba` |
| `tenant_id` | `UUID (FK)` | Reporter profile ID | `550e8400-e29b-41d4-a716-446655440030` |
| `title` | `TEXT` | Brief issue summary | `Leaking kitchen faucet` |
| `description` | `TEXT` | Complete issue description | `Dripping continuously since yesterday.` |
| `status` | `maintenance_status`| Status of resolution | `in_progress` |
| `priority` | `maintenance_priority`| Urgency level | `high` |
| `category` | `TEXT` | Problem category proposal | `plumbing` |
| `images` | `TEXT[]` | Evidence photo URLs | `{"leak-1.jpg"}` |
| `created_at` | `TIMESTAMPTZ` | Submission timestamp | `2026-04-02T06:30:00Z` |

---

### 2.4.6 Messaging, Community, & Onboarding

#### `conversations` Table
Direct Messaging thread groups.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Conversation unique ID | `cd6c5a79-74fa-41b9-b826-497549091f88` |
| `created_at` | `TIMESTAMPTZ` | Conversation creation timestamp | `2026-03-10T09:00:00Z` |
| `updated_at` | `TIMESTAMPTZ` | Last activity timestamp | `2026-03-10T09:05:00Z` |

#### `conversation_participants` Table
Associates users to conversations.
*   **Foreign Keys**:
    - `conversation_id` references `conversations.id` with `ON DELETE CASCADE`.
    - `user_id` references `profiles.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Association unique ID | `6404d726-46ab-4d5e-8c69-b1971474df27` |
| `conversation_id` | `UUID (FK)` | Target thread index | `cd6c5a79-74fa-41b9-b826-497549091f88` |
| `user_id` | `UUID (FK)` | Linked member user ID | `550e8400-e29b-41d4-a716-446655440020` |

#### `messages` Table
Direct messages in a conversation.
*   **Foreign Keys**:
    - `conversation_id` references `conversations.id` with `ON DELETE CASCADE`.
    - `sender_id` references `profiles.id` with `ON DELETE SET NULL`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Message unique ID | `2b271804-8c4b-4c2a-b508-f7f352ff5e35` |
| `conversation_id` | `UUID (FK)` | Parent conversation index | `cd6c5a79-74fa-41b9-b826-497549091f88` |
| `sender_id` | `UUID (FK)` | Author user profile | `550e8400-e29b-41d4-a716-446655440020` |
| `content` | `TEXT` | Message text content | `Please check the kitchen faucet.` |
| `type` | `message_type` | Payload media categorization | `text` |
| `read_at` | `TIMESTAMPTZ` | Timestamp when recipient read message | `2026-03-10T09:07:00Z` |
| `created_at` | `TIMESTAMPTZ` | Message sent timestamp | `2026-03-10T09:05:00Z` |

#### `community_posts` Table
Property bulletin boards posts.
*   **Foreign Keys**:
    - `property_id` references `properties.id` with `ON DELETE CASCADE`.
    - `author_id` references `profiles.id` with `ON DELETE CASCADE`.

| Attribute Name | Data Type | Description / Constraints | Sample Value |
| :--- | :--- | :--- | :--- |
| `id` | `UUID (PK)` | Post unique ID | `54671462-20f8-4c2f-a3ef-a1efb0cfb3ec` |
| `property_id` | `UUID (FK)` | Property bulletin space index | `16a0db58-91d8-447f-9f82-f2ef2485531f` |
| `author_id` | `UUID (FK)` | Creator profile index | `550e8400-e29b-41d4-a716-446655440030` |
| `type` | `post_type_enum` | Content taxonomy type | `discussion` |
| `title` | `TEXT` | Post subject headline | `Suggestions for laundry schedule` |
| `content` | `TEXT` | Primary post body content | `Would weekends work better?` |
| `metadata` | `JSONB` | Structured poll/album metadata options | `{"poll_options":["Morning","Evening"]}` |
| `is_pinned` | `BOOLEAN` | Pins post to top of feed if true | `false` |
| `is_approved` | `BOOLEAN` | False if awaiting landlord approval | `true` |
| `created_at` | `TIMESTAMPTZ` | Post creation timestamp | `2026-03-24T04:30:00Z` |

---

# 3. API SPECIFICATION & DOCUMENTATION

## 3.1 API Architecture & Request Standards

The iReside API conforms to **RESTful** paradigms, utilizing JSON payloads for request and response structures. Next.js App Router API handlers perform validation checks and check permissions before executing database operations.

*   **Endpoint Prefix**: `/api`
*   **Auth Flow**: Set standard Bearer JWT authorizations generated by Supabase inside headers:
    ```http
    Authorization: Bearer <supabase_jwt_session_token>
    ```

---

## 3.2 API Routes Directory Map

The local development API is mapped within the App Router configuration as follows:

```
/api/
├── auth/                       # Credentials, Session, & Logout Actions
├── admin/                      # Global Verification Review Scopes
├── iris/                       # AI Assistant Interface (iRis RAG Chat)
├── landlord/                   # Landlord-scoped Operations
│   ├── dashboard/             # Core KPI Metrics & CSV/PDF Data compilation
│   ├── properties/            # Portfolio Assets Management
│   ├── units/                  # Room Layout Grids Config
│   ├── payments/              # Payment Status Ledger Verification
│   └── maintenance/            # Multi-unit Maintenance Routing
├── tenant/                     # Tenant-scoped Portals
│   ├── lease/                 # Agreement view and remote signature draws
│   ├── payments/              # Utility/rent balances and receipts lookup
│   └── maintenance/            # Maintenance requests filing
├── community/                  # Social posts, Comment trees, Reaction triggers
└── messages/                   # Direct Messaging conversations & notifications
```

---

## 3.3 Authentication & Session Endpoints

### 3.3.1 Session Authorization
`POST /api/auth/login`
Authenticates user credentials against Supabase Auth.

*   **Request Headers**: `Content-Type: application/json`
*   **Request JSON Payload**:
    ```json
    {
      "email": "tenant1@ireside.app",
      "password": "strongPassword123"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "session": {
        "access_token": "eyJhbGciOi...",
        "refresh_token": "fD4kS...",
        "expires_in": 3600,
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440030",
          "email": "tenant1@ireside.app",
          "role": "tenant"
        }
      }
    }
    ```

### 3.3.2 Revoke Active Session
`POST /api/auth/logout`
Destroys active session cookies.

*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

## 3.4 AI Assistant (iRis) Endpoints

### 3.4.1 Conversational RAG Support
`POST /api/iris/chat`
Queries the virtual concierge (`iRis`). Resolves tenant-scoped rules (e.g. lease terms or property rules) using vector database contexts before returning the AI response.

*   **Request JSON Payload**:
    ```json
    {
      "message": "When is my rent payment due, and what is the wifi pass?",
      "conversationHistory": [
        { "role": "user", "content": "Hello iRis." },
        { "role": "assistant", "content": "Greetings! I am iRis. Ask me anything." }
      ]
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "response": "Your rent is due on June 5. The guest Wi-Fi password for Sunset Residences is 'SunsetLobby2026'. Let me know if you need anything else!",
      "hasDataCard": true,
      "dataCard": {
        "type": "property_info",
        "due_date": "2026-06-05",
        "monthly_rent": 12500.00,
        "wifi_ssid": "Sunset_Residences_Guest"
      },
      "metadata": {
        "model": "llama-3.1-8b-instant",
        "tokensUsed": 1150
      }
    }
    ```

---

## 3.5 Landlord Analytics & Insights Endpoints

### 3.5.1 Automated Portfolio Insights
`POST /api/landlord/statistics/insights`
Analyzes raw KPI data and generates operational recommendations using the AI model.

*   **Request JSON Payload**:
    ```json
    {
      "propertyId": "16a0db58-91d8-447f-9f82-f2ef2485531f",
      "period": "30d",
      "kpis": {
        "occupancyRate": 85.00,
        "revenueCollected": 125000.00,
        "revenueExpected": 150000.00,
        "maintenanceOpen": 3,
        "maintenanceResolved": 12
      }
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "insights": {
        "summary": "Property performance is strong with an 85% occupancy rate. However, there is a 16.6% revenue collection gap.",
        "recommendations": [
          "Set up automatic GCash billing reminders to address the ₱25,000 late payment gap.",
          "Resolve the 3 open maintenance requests that have been pending for more than 7 days."
        ],
        "alerts": [
          "3 open maintenance requests exceed target SLAs (7 days)."
        ]
      },
      "generatedAt": "2026-05-15T10:30:00Z"
    }
    ```

---

## 3.6 Direct Messaging & Chat Endpoints

### 3.6.1 List Active Conversations
`GET /api/messages/conversations`
Lists all active chat threads for the logged-in user.

*   **Success Response (200 OK)**:
    ```json
    {
      "conversations": [
        {
          "id": "cd6c5a79-74fa-41b9-b826-497549091f88",
          "participants": [
            { "id": "550e8400-e29b-41d4-a716-446655440020", "name": "Admin Landlord", "role": "landlord" },
            { "id": "550e8400-e29b-41d4-a716-446655440030", "name": "Maria Santos", "role": "tenant" }
          ],
          "lastMessage": {
            "content": "Perfect, checking the ledger now.",
            "senderId": "550e8400-e29b-41d4-a716-446655440020",
            "createdAt": "2026-05-22T08:12:00Z"
          },
          "unreadCount": 0
        }
      ],
      "total": 1
    }
    ```

### 3.6.2 Retrieve Chat Message Logs
`GET /api/messages/conversations/{conversationId}`
Retrieves historical message logs in a specific conversation. Supports pagination.

*   **Query Parameters**:
    - `limit` (integer, default: `50`): Max messages to return.
    - `before` (timestamp, optional): Get messages sent before this date.
*   **Success Response (200 OK)**:
    ```json
    {
      "messages": [
        {
          "id": "2b271804-8c4b-4c2a-b508-f7f352ff5e35",
          "conversationId": "cd6c5a79-74fa-41b9-b826-497549091f88",
          "senderId": "550e8400-e29b-41d4-a716-446655440030",
          "content": "I have uploaded the payment receipt reference.",
          "type": "text",
          "readAt": "2026-05-22T08:10:00Z",
          "createdAt": "2026-05-22T08:05:00Z"
        }
      ],
      "hasMore": false
    }
    ```

### 3.6.3 Send Chat Message
`POST /api/messages/conversations/{conversationId}`
Sends a message to an active conversation.

*   **Request JSON Payload**:
    ```json
    {
      "content": "Perfect, checking the ledger now.",
      "type": "text"
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "id": "9a38f322-a9b8-4c7b-b8c9-d9e0f1234567",
      "conversationId": "cd6c5a79-74fa-41b9-b826-497549091f88",
      "senderId": "550e8400-e29b-41d4-a716-446655440020",
      "content": "Perfect, checking the ledger now.",
      "type": "text",
      "createdAt": "2026-05-22T08:12:00Z"
    }
    ```

---

## 3.7 Community Hub Endpoints

### 3.7.1 Retrieve Community Bulletin Board Feed
`GET /api/community/posts`
Retrieves a list of posts published to the property's community feed.

*   **Query Parameters**:
    - `propertyId` (string UUID, Required): Target property space ID.
    - `type` (enum `all`/`announcement`/`poll`/`discussion`, default: `all`): Filter posts by type.
*   **Success Response (200 OK)**:
    ```json
    {
      "posts": [
        {
          "id": "54671462-20f8-4c2f-a3ef-a1efb0cfb3ec",
          "type": "announcement",
          "title": "Scheduled Water Interruption",
          "content": "Water service will be temporarily shut off on May 28 from 9:00 AM to 12:00 PM for building pipe maintenance.",
          "author": {
            "id": "550e8400-e29b-41d4-a716-446655440020",
            "name": "Property Manager",
            "role": "landlord"
          },
          "isPinned": true,
          "reactions": {
            "like": 12,
            "thumbs_up": 8
          },
          "commentCount": 3,
          "createdAt": "2026-05-20T08:00:00Z"
        }
      ],
      "total": 1
    }
    ```

### 3.7.2 Add Reaction to Post
`POST /api/community/posts/{postId}/reactions`
Adds an emoji reaction to a community post.

*   **Request JSON Payload**:
    ```json
    {
      "type": "heart"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "message": "Reaction updated successfully",
      "reactions": {
        "like": 12,
        "thumbs_up": 8,
        "heart": 1
      }
    }
    ```

---

## 3.8 Maintenance Operations Endpoints

### 3.8.1 Submit Repair Claim
`POST /api/tenant/maintenance`
Files a maintenance request with the landlord. Supports photo attachments.

*   **Request JSON Payload**:
    ```json
    {
      "title": "Bathroom Sink Drain Leak",
      "description": "Pipe joint under sink leaks when running tap.",
      "priority": "medium",
      "category": "plumbing",
      "photos": ["data:image/jpeg;base64,..."]
    }
    ```
*   **Success Response (201 Created)**:
    ```json
    {
      "id": "d82861a7-96ba-437e-a98b-d46720fd40f0",
      "unit_id": "2613d503-0639-46ca-b88d-73e16ecce8ba",
      "title": "Bathroom Sink Drain Leak",
      "description": "Pipe joint under sink leaks when running tap.",
      "status": "open",
      "priority": "medium",
      "category": "plumbing",
      "photo_urls": ["https://supabase.storage/maintenance/sink_leak.jpg"],
      "createdAt": "2026-05-22T08:30:00Z"
    }
    ```

### 3.8.2 Update Ticket Status
`PATCH /api/landlord/maintenance/{requestId}`
Updates the status, assigned contractor, or notes of a maintenance request.

*   **Request JSON Payload**:
    ```json
    {
      "status": "in_progress",
      "assignedTo": "44917a1c-901d-4c8e-a98b-d9d10eef4109",
      "notes": "Contractor scheduled to visit on May 24."
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "id": "d82861a7-96ba-437e-a98b-d46720fd40f0",
      "status": "in_progress",
      "notes": "Contractor scheduled to visit on May 24.",
      "updatedAt": "2026-05-22T08:45:00Z"
    }
    ```

---

## 3.9 Billing & Payment Processing Endpoints

### 3.9.1 Retrieve Tenant Ledger Records
`GET /api/tenant/payments`
Returns the billing and payment history for the logged-in tenant.

*   **Success Response (200 OK)**:
    ```json
    {
      "payments": [
        {
          "id": "7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa",
          "period": "2026-05",
          "amount": 13250.00,
          "status": "completed",
          "dueDate": "2026-05-05",
          "paidAt": "2026-05-04T10:00:00Z",
          "referenceNumber": "GCASH-9912881",
          "breakdown": {
            "baseRent": 12500.00,
            "electricity": 550.00,
            "water": 200.00
          }
        }
      ],
      "summary": {
        "totalPaid": 13250.00,
        "totalOutstanding": 0.00
      }
    }
    ```

### 3.9.2 Submit Payment Reference Proof
`POST /api/application-payments`
Submits transaction reference proof (e.g. GCash receipt) for ledger verification.

*   **Request JSON Payload**:
    ```json
    {
      "paymentId": "7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa",
      "method": "gcash",
      "amount": 13250.00,
      "referenceNumber": "GCASH-9912881"
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "transactionId": "7b4ef97a-95cf-47d3-8ae3-b39aa3e8c7aa",
      "status": "processing",
      "message": "Payment receipt submitted successfully and is awaiting landlord verification."
    }
    ```

---

## 3.10 Lease Management Endpoints

### 3.10.1 Retrieve Active Tenant Lease
`GET /api/tenant/lease`
Returns active lease terms and associated documents for the logged-in tenant.

*   **Success Response (200 OK)**:
    ```json
    {
      "id": "01f91dad-5e2e-42df-b248-477dc1490acb",
      "status": "active",
      "startDate": "2026-04-15",
      "endDate": "2027-04-14",
      "monthlyRent": 12500.00,
      "securityDeposit": 12500.00,
      "property": {
        "name": "Sunset Residences",
        "address": "123 Maysan Road, Valenzuela City"
      },
      "unit": {
        "name": "Unit 2B",
        "floor": 2
      },
      "documents": [
        {
          "name": "Standard Lease Covenant v2.pdf",
          "url": "https://supabase.storage/leases/SunsetRes_Unit2B_2026.pdf",
          "signedAt": "2026-04-10T10:22:00Z"
        }
      ]
    }
    ```

### 3.10.2 Sign Lease Agreement Digitally
`POST /api/tenant/lease/{leaseId}/sign`
Signs a lease agreement digitally.

*   **Request JSON Payload**:
    ```json
    {
      "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
      "agreedToTerms": true
    }
    ```
*   **Success Response (200 OK)**:
    ```json
    {
      "leaseId": "01f91dad-5e2e-42df-b248-477dc1490acb",
      "status": "active",
      "signedAt": "2026-05-22T09:00:00Z",
      "message": "Lease digitally signed. The lease is now active."
    }
    ```

---

## 3.11 Standardized Error Handling Framework

To ensure consistent responses, iReside APIs implement a standardized error payload format.

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "The request body validation failed.",
    "details": [
      {
        "field": "referenceNumber",
        "message": "Reference number is required for GCash transactions."
      }
    ]
  },
  "requestId": "a021f92e-33b8-4c8d-8a9b-e0f1a23b4c5d"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| **400 Bad Request** | `INVALID_PARAMETERS` | Payload failed structural JSON schema validation checks. |
| **401 Unauthorized** | `MISSING_TOKEN` | Auth header token is invalid, expired, or missing. |
| **403 Forbidden** | `INSUFFICIENT_PRIVILEGES`| Authenticated session lacks permission to view resource. |
| **404 Not Found** | `RESOURCE_MISSING` | Target database row or endpoint does not exist. |
| **409 Conflict** | `STATE_CONFLICT` | Action conflicts with system state (e.g. signing an already active lease). |
| **429 Too Many Requests**| `RATE_LIMIT_EXCEEDED` | Request rate exceeds configuration limit. |
| **500 Server Error** | `INTERNAL_SERVER_ERROR` | An unhandled exception occurred within system code. |

---

## 3.12 Rate Limiting Policies

To ensure platform stability and protect downstream APIs (such as Groq AI), the system enforces standard rate limits.

| Endpoint Route Pattern | Requests Scoped Limit | Reset Duration |
| :--- | :--- | :--- |
| `/api/iris/*` (iRis AI Concierge) | `30 requests` | `1 minute` |
| `/api/messages/*` (Direct Messages) | `60 requests` | `1 minute` |
| Other Endpoints (`/api/landlord/*`, `/api/tenant/*`) | `100 requests` | `1 minute` |

### Rate Limit Response Headers
Rate limited responses include standard header details to guide clients:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1715767200
```

---

# 4. SYSTEM GLOSSARY & REFERENCE

*   **AI Triage**: Automated classification system analyzing maintenance descriptions to proposal categories and priority levels.
*   **Digital Twin**: The programmatic replication of building layouts on a web canvas, mirroring the database state in real-time.
*   **Double-Signature Signoff**: Digital validation requiring both Tenant and Landlord counter-signatures before activating a lease.
*   **Dynamic Overlay Grid**: Visually indicates unit availability, maintenance priority, or late billing states using HSL color indicators on the Unit Map.
*   **iRis**: The conversational AI interface leveraging Llama 3.1 and RAG context retrieval to answer resident queries.
*   **Itemized Invoice Split**: Billing structure detailing base rent, electricity, and water consumption charges separately.
*   **Row-Level Security (RLS)**: Row-level security filtering evaluated directly within the PostgreSQL database layer based on authenticated JWT credentials.
*   **Zero-Latency Synchronization**: Real-time websocket propagation refreshing layout views instantly upon database update events.

---
