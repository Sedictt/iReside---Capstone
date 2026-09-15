# iReside Technical Documentation

**A Comprehensive Guide to the Integrated Rental Management System**

*Version 1.0 | May 2026*

---

## Table of Contents

1. [What is iReside?](#1-what-is-ireside)
2. [The Big Picture: How Everything Connects](#2-the-big-picture-how-everything-connects)
3. [User Roles & Access](#3-user-roles--access)
4. [Core Modules](#4-core-modules)
   - 4.1 [Unit Map - Visual Floor Planning](#41-unit-map---visual-floor-planning)
   - 4.2 [Landlord Dashboard](#42-landlord-dashboard)
   - 4.3 [Tenant Portal](#43-tenant-portal)
   - 4.4 [Financial Ledger](#44-financial-ledger)
   - 4.5 [AI Assistant (iRis)](#45-ai-assistant-iris)
   - 4.6 [Community Hub](#46-community-hub)
   - 4.7 [Lease Management](#47-lease-management)
   - 4.8 [Payment Processing](#48-payment-processing)
   - 4.9 [Maintenance System](#49-maintenance-system)
5. [Database Architecture](#5-database-architecture)
6. [Security Model](#6-security-model)
7. [Technology Stack](#7-technology-stack)
8. [Key Technical Concepts](#8-key-technical-concepts)
9. [Comprehensive API Reference](#9-comprehensive-api-reference)
   - 9.1 [API Architecture](#91-api-architecture)
   - 9.2 [API Routes Structure](#92-api-routes-structure)
   - 9.3 [Authentication Endpoints](#93-authentication-endpoints)
   - 9.4 [AI Assistant (iRis) API](#94-ai-assistant-iris-api)
   - 9.5 [Landlord Statistics API](#95-landlord-statistics-api)
   - 9.6 [Messaging API](#96-messaging-api)
   - 9.7 [Community Hub API](#97-community-hub-api)
   - 9.8 [Maintenance Request API](#98-maintenance-request-api)
   - 9.9 [Payment API](#99-payment-api)
   - 9.10 [Lease API](#910-lease-api)
   - 9.11 [Error Handling](#911-error-handling)
   - 9.12 [Rate Limiting](#912-rate-limiting)
   - 9.13 [OpenAPI Specification](#913-openapi-specification)
10. [Glossary](#10-glossary)

---

## 1. What is iReside?

**iReside** (pronounced "eye-REZ-ide") is an **Integrated Rental Management System** — a software platform that helps property owners (landlords) manage their rental properties more efficiently while giving tenants better access to information about their homes.

Think of iReside as a **digital command center for rental property management**. Instead of using paper ledgers, WhatsApp messages, and scattered spreadsheets, everything is consolidated into one organized system.

### Why Does iReside Exist?

Property management in the Philippines — especially in areas like Barangay Marulas, Valenzuela City — often involves:

- **Communication gaps** between landlords and tenants
- **Manual tracking** of payments, leases, and maintenance requests
- **Lack of transparency** in billing and financial records
- **Time-consuming administrative tasks** that could be automated

iReside addresses these challenges by providing:

| Problem | iReside's Solution |
|---------|-------------------|
| Lost payment records | Digital ledger with itemized billing |
| Slow maintenance response | Digital request system with status tracking |
| Lease confusion | Centralized document storage with digital signing |
| Tenant questions about rules | AI assistant available 24/7 |
| Property status confusion | Visual unit map with color-coded status |
| Scattered communication | Built-in messaging with history |

---

## 2. The Big Picture: How Everything Connects

Before diving into individual features, it helps to understand how the pieces fit together.

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
    │                                                              │
    │   • Properties    • Units    • Leases    • Payments         │
    │   • Maintenance   • Messages • Documents • Notifications    │
    │                                                              │
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

### How Data Flows

When a tenant makes a payment:

1. **Tenant** submits payment through the portal
2. **System** records the transaction in the database
3. **Landlord** sees the updated status on their dashboard immediately
4. **Unit status** automatically changes color on the Unit Map
5. **Receipt** is generated and stored
6. **Notification** is sent to both parties

This "zero-latency sync" means everyone sees the same truth at the same time — no more "I already paid!" disputes.

---

## 3. User Roles & Access

iReside has three distinct user roles, each with specific permissions:

### 3.1 Super Administrator

**Who they are:** The development team that maintains and oversees the system.

**Access level:** Full system access

| Capability | Access |
|------------|--------|
| All properties | View & manage |
| All tenant data | View |
| System settings | Configure |
| Admin tools | Full access |
| Audit logs | View all |

### 3.2 Landlord

**Who they are:** Property owners or property managers responsible for one or more rental properties.

**Access level:** Property-scoped (can only see their own properties and tenants)

| Capability | Access |
|------------|--------|
| Properties | Full CRUD (create, read, update, delete) |
| Units | Manage (assign, vacate, transfer) |
| Tenants | View & communicate |
| Leases | Create, sign, manage |
| Payments | View, confirm, issue receipts |
| Maintenance | Assign, update status |
| Financial Reports | Generate & export |
| Community posts | Moderate |

**Key Feature:** The **Visual Command Center** — a dashboard showing all properties, units, and real-time status at a glance.

### 3.3 Tenant

**Who they are:** Residents renting a unit in a property managed through iReside.

**Access level:** Unit-scoped (can only see their own unit, lease, and property information)

| Capability | Access |
|------------|--------|
| My Unit | View details |
| My Lease | View & download |
| My Payments | View history & make payments |
| Maintenance Requests | Submit & track |
| Messages | Communicate with landlord |
| Community | Participate in discussions |
| AI Assistant (iRis) | Ask questions 24/7 |

**Key Feature:** The **Tenant Dashboard** — a single page showing everything about their residency.

### 3.4 Role-Based Access Control (RBAC)

iReside enforces role permissions at two levels:

1. **Application Level:** Navigation menus and pages adjust based on role
2. **Database Level:** Row-Level Security (RLS) prevents unauthorized data access

This means even if someone tries to access data they shouldn't see, the database itself blocks the request.

---

## 4. Core Modules

This section covers each major module of iReside. Each module is explained with both **what it does** (for everyone) and **how it works** (for those interested in technical details).

---

### 4.1 Unit Map - Visual Floor Planning

#### What It Does

The Unit Map is a **visual floor planning tool** that lets landlords design and manage their building layouts directly in the system. Instead of maintaining separate floor plans and records, the map IS the record.

#### How It Feels to Use

Imagine opening a blank canvas where you can:

1. **Place units** by dragging pre-made blocks onto a grid
2. **Name each unit** (e.g., "Unit 101", "Studio A")
3. **Assign attributes** — floor number, bedrooms, bathrooms, monthly rent
4. **Color-code status** automatically (more on this below)
5. **See real-time updates** when tenants move in or out

#### Color-Coded Status System

Each unit block on the map displays a color that represents its current status:

| Color | Meaning | When It Appears |
|-------|---------|-----------------|
| 🟢 **Green** | Vacant | Unit has no active tenant |
| 🔵 **Blue** | Occupied (Paid) | Active lease, payment current |
| 🟡 **Yellow** | Due Soon | Payment deadline approaching |
| 🔴 **Red** | Overdue | Payment is late |
| 🟠 **Orange (Pulsing)** | Active Maintenance | Work in progress |

This system gives landlords **instant situational awareness** — they can glance at the map and immediately know which units need attention.

#### Technical Highlights

- **Drag-and-drop interface** with 20-pixel grid snapping for precise alignment
- **Real-time database sync** — every change persists immediately
- **Multi-floor support** — organize units by floor or wing
- **Read-only view for tenants** — tenants can see the map to understand their building's layout
- **Unit transfer requests** — tenants can request to move to a vacant unit directly from the map

---

### 4.2 Landlord Dashboard

#### What It Does

The Landlord Dashboard is the **command center** for property management. It consolidates real-time data from all modules into a single view with key performance indicators (KPIs) and analytics.

#### Dashboard Metrics

At a glance, landlords see:

| Metric | What It Shows |
|--------|---------------|
| **Total Earnings** | Revenue from rent collections (current period) |
| **Active Tenants** | Number of currently occupied units |
| **Occupancy Rate** | Percentage of units that are occupied |
| **Pending Maintenance** | Tickets awaiting action |

#### Viewing Modes

The dashboard supports two viewing modes:

1. **Simplified Mode** — Essential metrics in a clean, uncluttered view. Perfect for quick daily check-ins.

2. **Detailed Analytics** — Deeper insights including:
   - Maintenance cost trends
   - Lease renewal predictions
   - Portfolio value over time
   - Payment behavior analysis

#### Reporting & Exports

Landlords can generate reports in two formats:

| Format | Use Case |
|--------|----------|
| **PDF** | Stakeholder presentations, formal reports with branding |
| **CSV** | Data analysis in Excel, external auditing systems |

**Report History:** Every exported report is logged with timestamp and criteria, creating an audit trail for compliance.

#### Date Range Flexibility

Reports can cover:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range selection

---

### 4.3 Tenant Portal

#### What It Does

The Tenant Portal is the **single hub** where tenants manage everything about their residency — from viewing their lease to submitting maintenance requests.

#### What's Inside

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT PORTAL                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   MY LEASE  │  │  PAYMENTS   │  │MAINTENANCE │         │
│  │             │  │             │  │  REQUESTS   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │DOCUMENT VAULT│  │  MESSAGES   │  │   iRis AI   │         │
│  │             │  │             │  │  ASSISTANT  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features

**My Lease**
- View current lease terms (dates, rent amount, deposit)
- See renewal eligibility window
- Download lease documents

**Document Vault**
- All signed agreements stored digitally
- Accessible anytime without requesting from landlord
- Amendment history tracked

**Payment Tracking**
- Current balance and due dates
- Payment history with receipts
- Multiple payment method support

**Maintenance Requests**
- Submit issues with description and photos
- Track status through lifecycle
- Receive notifications on updates

**Messages**
- Direct communication with landlord
- Typing indicators and read receipts
- Complete conversation history

---

### 4.4 Financial Ledger

#### What It Does

The Financial Ledger maintains **itemized financial records** for each tenancy, ensuring complete transparency in billing.

#### Why Itemized?

Instead of showing just "₱15,000 due," iReside breaks down charges:

```
┌────────────────────────────────────────┐
│         MAY 2026 BILL                  │
├────────────────────────────────────────┤
│ Base Rent                 ₱12,000.00   │
│ Water Charges                ₱800.00   │
│ Electricity Charges        ₱2,200.00   │
├────────────────────────────────────────┤
│ TOTAL DUE                 ₱15,000.00   │
│ Due Date                   May 31, 2026 │
└────────────────────────────────────────┘
```

This transparency:
- Reduces billing disputes
- Helps tenants understand their consumption
- Creates an authoritative record for both parties

#### Landlord View

Landlords see:
- Outstanding balances across all tenants
- Overdue accounts flagged for attention
- Payment tracking per billing period

#### Tenant View

Tenants see:
- Current balance and due dates
- Complete payment history
- Receipts for completed payments

---

### 4.5 AI Assistant (iRis)

#### What It Does

**iRis** (pronounced "eye-RIS") is an **AI-powered conversational assistant** that provides instant, accurate responses to tenant questions — 24 hours a day, 7 days a week.

#### What Makes iRis Special

Unlike a simple chatbot that gives generic answers, iRis is powered by **Retrieval-Augmented Generation (RAG)**:

1. **Retrieval** — When a tenant asks a question, iRis first finds information specific to that tenant
2. **Augmentation** — The retrieved information is added to the AI's context
3. **Generation** — The AI generates a response based on real data

#### What Can iRis Answer?

| Question Type | Example |
|---------------|---------|
| Building amenities | "What facilities are available?" |
| Lease information | "When is my rent due?" |
| House rules | "What are the guest policies?" |
| Maintenance | "How do I report a leaky faucet?" |
| Building info | "What's the WiFi password?" |

#### How It Works (Technical)

```
Tenant: "What amenities are available?"

    │
    ▼
┌─────────────┐
│  iRis API   │  ← Receives the question
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ RAG Context │  ← Retrieves tenant's property, unit, lease data
│  Retrieval  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Groq      │  ← Llama 3.1 model processes the question
│  Llama 3.1  │
└──────┬──────┘
       │
       ▼
Response: "Your property offers: Swimming Pool, Gym, Parking..."
```

#### Privacy & Security

- iRis only has access to the asking tenant's own data
- No cross-tenant data leakage
- User authentication required for every conversation

#### Cost

The system uses **Groq's free tier** — so it's completely free to operate, with generous daily limits.

---

### 4.6 Community Hub

#### What It Does

The Community Hub is a **social space** within iReside where tenants and landlords can share announcements, start discussions, and build community.

#### Post Types

| Type | Purpose |
|------|---------|
| **Announcements** | Official notices from landlords (utility schedules, events) |
| **Discussions** | Open conversations for tenants |
| **Polls** | Gather community opinions |
| **Photo Albums** | Share photos (events, common areas) |

#### Moderation

Landlords have **approval authority** — posts from tenants can be set to require landlord approval before publishing. This ensures appropriate content and reduces spam.

#### Features

- **Reactions** — Express appreciation (like, heart, thumbs up, clap, celebration)
- **Comments** — Engage in discussions
- **View counts** — See how many people read a post
- **Save posts** — Mark important announcements for later

---

### 4.7 Lease Management

#### What It Does

The Lease Management module handles the **complete lifecycle of a lease agreement** — from creation to expiration or termination.

#### Lease Status State Machine

Leases follow a strict workflow to ensure proper authorization:

```
   ┌─────────┐
   │  DRAFT  │ ← Initial creation
   └────┬────┘
        │
        ▼
┌─────────────────────────┐
│ PENDING_TENANT_SIGNATURE │ ← Awaiting tenant signature
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ PENDING_LANDLORD_SIGNATURE │ ← Awaiting landlord signature
└────────────┬────────────┘
             │
             ▼
        ┌─────────┐
        │ ACTIVE  │ ← Lease is in effect
        └────┬────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌─────────┐    ┌────────────┐
│ EXPIRED │    │ TERMINATED │
└─────────┘    └────────────┘
```

This state machine **enforces the approval sequence** — a lease cannot become active without both signatures.

#### Digital Lease Signing

iReside supports **dual-signature workflows**:

- **In-person signing** — Both parties sign on the same device
- **Remote signing** — Tenant signs online, landlord countersigns later

#### Lease Documents

- Generated as PDFs
- Stored in the Document Vault
- Timestamp and signature validation

---

### 4.8 Payment Processing

#### What It Does

The payment system handles **collecting rent and utilities** from tenants, with support for multiple payment methods and a complete audit trail.

#### Supported Payment Methods

| Method | Description |
|--------|-------------|
| GCash | Popular Philippine e-wallet |
| Maya | Another major e-wallet |
| Bank Transfer | Direct to property account |
| Cash | In-person payments (recorded manually) |
| Card | Credit/Debit (if configured) |

#### Payment Workflow

```
┌──────────────┐
│   PENDING    │ ← Payment initiated
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PROCESSING   │ ← Being verified
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  COMPLETED   │ ← Payment confirmed
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  RECEIPTED   │ ← Receipt issued
└──────────────┘
```

#### In-Person Payment Flow

For cash payments or when digital proof isn't immediately available:

1. Landlord marks payment as "awaiting in-person confirmation"
2. System creates a **payment intent** with unique reference
3. When payment is physically received, landlord confirms
4. Receipt is generated and both parties notified

#### Payment Receipts

Every completed payment generates a **receipt** that:
- Includes amount, date, method, and parties involved
- Is immutable (cannot be modified once issued)
- Is stored permanently for record-keeping

---

### 4.9 Maintenance System

#### What It Does

The Maintenance System provides a **structured workflow** for tenants to report issues and landlords to track resolutions.

#### Request Submission

Tenants submit maintenance requests with:

| Field | Description |
|-------|-------------|
| Description | What's the problem? |
| Priority | How urgent? (Low, Medium, High, Urgent) |
| Photos | Visual evidence (optional but recommended) |

#### AI-Powered Triage

When a tenant submits a request in plain language, **AI Maintenance Triage** automatically:

1. **Categorizes** the issue (Plumbing, Electrical, Appliance, etc.)
2. **Assesses severity** based on keywords and description
3. **Suggests priority** level
4. **Flags** potential urgency (e.g., "flooding" triggers urgent)

This helps landlords prioritize without reading every request in detail.

#### Status Lifecycle

```
    ┌───────┐
    │  OPEN │ ← Newly submitted
    └───┬───┘
        │
        ▼
┌──────────────┐
│  ASSIGNED    │ ← Landlord assigned to a worker/vendor
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ IN_PROGRESS  │ ← Work is underway
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  RESOLVED    │ ← Issue fixed, awaiting confirmation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   CLOSED     │ ← Confirmed resolved
└──────────────┘
```

#### Notification Triggers

Both tenants and landlords receive notifications at each status change, keeping everyone informed.

---

## 5. Database Architecture

### Overview

iReside uses **Supabase** (PostgreSQL) as its database. Think of it as a highly organized digital filing cabinet where every piece of data has a specific place and strict rules about who can access what.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase Auth) |
| `properties` | Rental properties managed by landlords |
| `units` | Individual rental units within properties |
| `leases` | Rental agreements between landlords and tenants |
| `payments` | Rent and utility transactions |
| `applications` | Tenant application submissions |
| `maintenance_requests` | Issue reports from tenants |
| `conversations` | Message threads between users |
| `messages` | Individual messages within conversations |
| `community_posts` | Announcements, discussions, polls, albums |
| `community_comments` | Reactions and comments on posts |
| `notifications` | System notifications to users |
| `invoices` | Billing statements sent to tenants |
| `payment_receipts` | Proof of completed payments |

### Entity Relationships

```
SUPER ADMIN
    │
    ▼
PROPERTIES ──────► LANDLORDS (via profiles)
    │
    ▼
UNITS ──────────► LEASES ──────► TENANTS (via profiles)
    │                           │
    │                           │
    └────► MAINTENANCE ◄───────┘
    │
    │
    └────► PAYMENTS ◄───────────┘
    │
    │
    └────► MESSAGES ◄───────────┘
    │
    │
    └────► COMMUNITY POSTS ◄───► COMMENTS
```

### Automatic Triggers

The database has **automated triggers** that run when certain events occur:

| Trigger | Action |
|---------|--------|
| Lease becomes active | Unit status changes to "occupied" |
| Lease expires/terminates | Unit status changes to "vacant" |
| New user signs up | Profile automatically created |
| Record updated | Timestamp automatically refreshed |

---

## 6. Security Model

### Multi-Tenant Data Isolation

iReside uses **Row-Level Security (RLS)** to ensure complete data isolation between properties. This means:

- **Landlord A** cannot see **Landlord B's** properties
- **Tenant X** cannot see **Tenant Y's** payments
- Even if someone hacks the application, the database blocks unauthorized access

### Authentication

| Method | Details |
|--------|---------|
| Supabase Auth | Email/password authentication |
| Session management | Secure, time-limited sessions |
| Profile auto-creation | New users get profiles automatically |

### Permission Layers

```
┌────────────────────────────────────────────┐
│           APPLICATION LAYER                 │
│   (Pages, components, navigation adjust    │
│    based on role)                          │
├────────────────────────────────────────────┤
│           API LAYER                         │
│   (Endpoints verify user identity and      │
│    role before processing)                 │
├────────────────────────────────────────────┤
│           DATABASE LAYER (RLS)              │
│   (Queries are filtered at the database    │
│    level to enforce access control)        │
└────────────────────────────────────────────┘
```

### Real-Time Message Moderation

All messages in the Community Hub and direct messages are processed through **AI content filtering** before delivery, blocking:
- Toxic language
- Hate speech
- Spam content

---

## 7. Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Web framework with app router |
| **React 19** | User interface library |
| **TypeScript** | Type-safe code |
| **Tailwind CSS v4** | Styling and design system |
| **Framer Motion** | Animations and transitions |
| **GSAP** | Advanced animations |
| **Lucide React** | Icon library |
| **next-themes** | Dark/light mode support |
| **PWA** | Mobile app experience |

### Backend & Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, Auth, real-time |
| **PostgreSQL** | Relational database |
| **Row-Level Security** | Multi-tenant data isolation |
| **pgvector** | AI knowledge base storage |

### AI & Integrations

| Technology | Purpose |
|-----------|---------|
| **Groq Llama 3.1** | AI language model |
| **RAG (Retrieval-Augmented Generation)** | Context-aware AI responses |
| **Puppeteer** | Web scraping for business verification |

### Development & Quality

| Technology | Purpose |
|-----------|---------|
| **ESLint** | Code linting |
| **TypeScript strict mode** | Type checking |
| **Vitest** | Unit testing |
| **Playwright** | End-to-end testing |

---

## 8. Key Technical Concepts

### 8.1 What is RAG?

**Retrieval-Augmented Generation (RAG)** is an AI architecture that improves response accuracy by first finding relevant information, then using that information to generate a response.

Without RAG: AI gives generic answers based on training data
With RAG: AI gives specific answers based on your actual data

### 8.2 What is Row-Level Security?

**Row-Level Security (RLS)** is a database feature that filters data at the database level based on who is accessing it.

Instead of: "Get all payments" → Filter in code → "Get only mine"
With RLS: "Get all payments" → Database automatically filters → "You only see yours"

### 8.3 What is a PWA?

A **Progressive Web App (PWA)** is a web application that works like a mobile app. Users can:
- Install it on their home screen
- Use it offline (partially)
- Receive push notifications

This gives tenants an "app-like" experience without requiring app store downloads.

### 8.4 Digital Twin

iReside's **Digital Twin** concept means the digital representation of the property always matches reality. When a tenant pays rent, the Unit Map updates. When a lease ends, the unit becomes vacant. There is no drift between physical and digital.

### 8.5 Zero-Latency Sync

Real-time synchronization means changes appear instantly across all views. When a landlord updates a maintenance ticket, the tenant sees it immediately. No page refresh needed.

---

## 9. Comprehensive API Reference

This section provides a complete reference for the iReside API. All endpoints require authentication via Supabase JWT tokens unless otherwise noted.

### 9.1 API Architecture

The iReside API follows RESTful principles with JSON request/response bodies. All endpoints are prefixed with `/api/` and are served from the Next.js application server.

**Base URL:** `http://localhost:3000` (development)

**Authentication:** Supabase JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <supabase_jwt_token>
```

---

### 9.2 API Routes Structure

```
/api/
├── admin/                    # Admin-only operations
├── application-payments/     # Payment processing
├── auth/                     # Authentication (login, logout, session)
├── community/                # Community Hub (posts, announcements, polls)
├── cron/                     # Scheduled/automated tasks
├── invites/                  # Tenant onboarding invitations
├── iris/                     # AI Assistant (iRis)
├── landlord/                 # Landlord-specific operations
│   ├── dashboard/           # Dashboard data & KPIs
│   ├── maintenance/          # Maintenance request management
│   ├── payments/            # Payment tracking & reconciliation
│   ├── properties/          # Property management
│   ├── statistics/           # Analytics & AI insights
│   └── units/                # Unit management
├── messages/                 # Real-time messaging
│   ├── conversations/       # Conversation CRUD
│   └── users/                # User search for messaging
├── profile/                  # User profile management
├── properties/               # Property-level operations
├── tenant/                   # Tenant-specific operations
│   ├── maintenance/          # Submit & track maintenance requests
│   ├── payments/            # View payments & billing
│   └── lease/               # Lease viewing
└── units/                    # Unit-level operations
```

---

### 9.3 Authentication Endpoints

#### POST /api/auth/login
Initiates a Supabase authentication session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "landlord|tenant|admin"
    }
  }
}
```

#### POST /api/auth/logout
Ends the current session.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 9.4 AI Assistant (iRis) API

#### POST /api/iris/chat

Interacts with the iRis AI concierge with tenant-specific context. Uses RAG (Retrieval-Augmented Generation) to provide personalized responses based on the tenant's property, unit, and lease data.

**Request:**
```json
{
  "message": "What amenities are available?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you today?" }
  ]
}
```

**Response (200):**
```json
{
  "response": "Your property offers: Swimming Pool (6AM-10PM), Gym (24/7), Covered Parking, and Rooftop Garden. The pool is currently open for the summer season!",
  "hasDataCard": true,
  "dataCard": {
    "type": "amenity_list",
    "items": ["Swimming Pool", "Gym", "Parking", "Rooftop Garden"],
    "hours": {
      "pool": "6AM-10PM",
      "gym": "24/7"
    }
  },
  "metadata": {
    "model": "llama-3.1-8b-instant",
    "tokens": 245,
    "tokensUsed": 1240
  }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or missing token)
- `429` - Rate limit exceeded (max 30 requests/minute)

---

### 9.5 Landlord Statistics API

#### POST /api/landlord/statistics/insights

Generates AI-powered insights from KPI data using Groq's Llama model.

**Request:**
```json
{
  "propertyId": "uuid",
  "period": "30d",
  "kpis": {
    "occupancyRate": 0.85,
    "revenueCollected": 125000,
    "revenueExpected": 150000,
    "maintenanceOpen": 3,
    "maintenanceResolved": 12
  }
}
```

**Response (200):**
```json
{
  "insights": {
    "summary": "Property performance is strong with 85% occupancy.",
    "recommendations": [
      "Consider adjusting rent pricing to reduce the 17% collection gap",
      "Maintenance response time improved by 20% this month"
    ],
    "alerts": [
      "3 open maintenance tickets older than 7 days"
    ]
  },
  "source": "ai",
  "generatedAt": "2026-05-15T10:30:00Z"
}
```

---

### 9.6 Messaging API

#### GET /api/messages/conversations

Lists all conversations for the authenticated user.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Max results to return |
| `offset` | integer | 0 | Pagination offset |

**Response (200):**
```json
{
  "conversations": [
    {
      "id": "conv_uuid",
      "participants": [
        { "id": "user1", "name": "Juan dela Cruz", "role": "landlord" },
        { "id": "user2", "name": "Maria Santos", "role": "tenant" }
      ],
      "lastMessage": {
        "content": "Your maintenance request has been resolved.",
        "senderId": "user1",
        "createdAt": "2026-05-15T09:00:00Z"
      },
      "unreadCount": 1
    }
  ],
  "total": 15
}
```

#### POST /api/messages/conversations

Creates a new conversation or returns existing one between participants.

**Request:**
```json
{
  "participantIds": ["user_uuid_1", "user_uuid_2"],
  "initialMessage": "Hello, I wanted to discuss..."
}
```

**Response (201 - Created) or (200 - Existing):**
```json
{
  "id": "conv_uuid",
  "participants": [...],
  "createdAt": "2026-05-15T10:00:00Z"
}
```

#### GET /api/messages/conversations/{conversationId}

Retrieves messages in a conversation with pagination.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | string (UUID) | Conversation identifier |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 100 | Max messages to return |
| `before` | string (timestamp) | null | Get messages before this time |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "msg_uuid",
      "conversationId": "conv_uuid",
      "senderId": "user_uuid",
      "content": "Your rent is due on the 1st.",
      "type": "text",
      "readAt": null,
      "createdAt": "2026-05-14T08:00:00Z"
    }
  ],
  "hasMore": false
}
```

#### POST /api/messages/conversations/{conversationId}

Sends a message to an existing conversation.

**Request:**
```json
{
  "content": "Thank you for the reminder!",
  "type": "text",
  "metadata": {
    "replyTo": "msg_uuid"
  }
}
```

**Response (201):**
```json
{
  "id": "new_msg_uuid",
  "conversationId": "conv_uuid",
  "senderId": "current_user_uuid",
  "content": "Thank you for the reminder!",
  "type": "text",
  "createdAt": "2026-05-14T08:05:00Z"
}
```

#### GET /api/messages/users

Searches for users to start a conversation with.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 characters) |
| `limit` | integer | No | Max results (default: 8) |

**Response (200):**
```json
{
  "users": [
    {
      "id": "user_uuid",
      "name": "Juan dela Cruz",
      "email": "juan@email.com",
      "role": "landlord",
      "avatarUrl": null
    }
  ]
}
```

---

### 9.7 Community Hub API

#### GET /api/community/posts

Retrieves community posts with filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | all | Filter by type: announcement, discussion, poll, album |
| `propertyId` | string (UUID) | required | Property identifier |
| `limit` | integer | 20 | Max results |
| `offset` | integer | 0 | Pagination offset |

**Response (200):**
```json
{
  "posts": [
    {
      "id": "post_uuid",
      "type": "announcement",
      "title": "Scheduled Water Interruption",
      "content": "Water will be cut off on May 20 from 9AM-12PM for pipe repairs.",
      "author": {
        "id": "user_uuid",
        "name": "Juan dela Cruz",
        "role": "landlord"
      },
      "requiresApproval": false,
      "isPinned": true,
      "reactions": {
        "like": 5,
        "heart": 2
      },
      "commentCount": 3,
      "viewCount": 45,
      "createdAt": "2026-05-15T07:00:00Z"
    }
  ],
  "total": 25
}
```

#### POST /api/community/posts

Creates a new community post.

**Request:**
```json
{
  "type": "announcement",
  "title": "Holiday Schedule",
  "content": "Office will be closed on May 25 for national holiday.",
  "requiresApproval": true,
  "isPinned": false
}
```

#### POST /api/community/posts/{postId}/reactions

Adds a reaction to a post.

**Request:**
```json
{
  "type": "heart"
}
```

---

### 9.8 Maintenance Request API

#### GET /api/landlord/maintenance

Lists all maintenance requests (landlord view).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: open, in_progress, resolved, closed |
| `priority` | string | Filter: low, medium, high, urgent |
| `propertyId` | string (UUID) | Property filter |

#### POST /api/landlord/maintenance

Creates a maintenance request on behalf of a tenant (landlord only).

#### PATCH /api/landlord/maintenance/{requestId}

Updates a maintenance request status or details.

**Request:**
```json
{
  "status": "in_progress",
  "assignedTo": "contractor_uuid",
  "notes": "Scheduled for May 18"
}
```

#### GET /api/tenant/maintenance

Lists maintenance requests for the authenticated tenant.

#### POST /api/tenant/maintenance

Submits a new maintenance request.

**Request:**
```json
{
  "title": "Leaking faucet in bathroom",
  "description": "The faucet has been dripping for 2 days...",
  "priority": "medium",
  "category": "plumbing",
  "photos": ["base64_encoded_image..."]
}
```

---

### 9.9 Payment API

#### GET /api/tenant/payments

Lists payment history for the authenticated tenant.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: pending, paid, overdue, partial |
| `from` | date | Start date filter |
| `to` | date | End date filter |

**Response (200):**
```json
{
  "payments": [
    {
      "id": "pay_uuid",
      "period": "2026-05",
      "amount": 15000,
      "status": "paid",
      "dueDate": "2026-05-01",
      "paidAt": "2026-05-02T14:30:00Z",
      "breakdown": {
        "baseRent": 12000,
        "electricity": 2000,
        "water": 500,
        "other": 500
      }
    }
  ],
  "summary": {
    "totalPaid": 45000,
    "totalPending": 15000,
    "totalOverdue": 0
  }
}
```

#### POST /api/application-payments

Initiates a payment transaction.

**Request:**
```json
{
  "paymentId": "pay_uuid",
  "method": "gcash",
  "amount": 15000,
  "referenceNumber": "GCASH123456"
}
```

---

### 9.10 Lease API

#### GET /api/tenant/lease

Retrieves the authenticated tenant's current lease agreement.

**Response (200):**
```json
{
  "id": "lease_uuid",
  "property": {
    "id": "prop_uuid",
    "name": "Marulas Residence"
  },
  "unit": {
    "id": "unit_uuid",
    "number": "201",
    "floor": 2
  },
  "status": "active",
  "startDate": "2026-01-01",
  "endDate": "2027-01-01",
  "monthlyRent": 12000,
  "deposit": 24000,
  "terms": [...],
  "documents": [
    {
      "id": "doc_uuid",
      "name": "Lease Agreement",
      "url": "https://storage.supabase.co/...",
      "signedAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/tenant/lease/{leaseId}/sign

Digitally signs a lease agreement.

**Request:**
```json
{
  "signature": "base64_encoded_signature_image",
  "AgreedToTerms": true
}
```

---

### 9.11 Error Handling

All API errors follow a consistent format:

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid fields.",
    "details": [
      {
        "field": "message",
        "message": "Message is required"
      }
    ]
  },
  "requestId": "req_uuid"
}
```

**Common Error Codes:**

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request body failed validation |
| 400 | INVALID_REQUEST | Malformed request |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Resource state conflict |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

### 9.12 Rate Limiting

API endpoints are rate-limited to ensure system stability:

| Endpoint Pattern | Limit |
|------------------|-------|
| `/api/iris/*` | 30 requests/minute |
| `/api/messages/*` | 60 requests/minute |
| All other endpoints | 100 requests/minute |

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1715767200
```

---

### 9.13 OpenAPI Specification

The complete API is documented in OpenAPI 3.1 format at:
- **Local:** `/openapi.json`
- **Interactive docs:** Coming soon (Swagger UI)

This specification can be imported into tools like Postman, Insomnia, or Bruno for API testing and exploration.

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **AI Triage** | Automated categorization of maintenance requests using AI |
| **Digital Handbook** | Online repository of building rules and policies |
| **Digital Twin** | Real-time digital representation of physical property |
| **Dynamic Status Overlay** | Color-coded visualization on Unit Map |
| **Lease Status State Machine** | Valid workflow states for lease lifecycle |
| **Multi-Tenant Isolation** | Architecture that keeps each property's data separate |
| **Progressive Web App (PWA)** | Mobile-installable web application |
| **RAG** | Retrieval-Augmented Generation — AI architecture |
| **RBAC** | Role-Based Access Control — permissions system |
| **RLS** | Row-Level Security — database-level access control |
| **Unit Map** | Visual floor planning interface |
| **Visual Command Center** | Landlord dashboard with real-time overview |
| **Zero-Latency Sync** | Instant data synchronization across views |

---

## Quick Reference: Module Overview

| Module | Primary User | Key Function |
|--------|-------------|--------------|
| Unit Map | Landlord | Visual floor planning |
| Dashboard | Landlord | KPIs, analytics, reports |
| Tenant Portal | Tenant | Centralized access hub |
| Financial Ledger | Both | Itemized billing |
| iRis AI | Tenant | 24/7 assistance |
| Community Hub | Both | Social features |
| Lease Management | Both | Digital lease signing |
| Payments | Tenant → Landlord | Rent collection |
| Maintenance | Tenant → Landlord | Issue tracking |

---

## Contact & Support

For technical questions about iReside:
- **Project:** iReside - Integrated Rental Management System
- **Location:** Barangay Marulas, Valenzuela City
- **Institution:** Pamantasang ng Lungsod ng Valenzuela - College of Engineering and Information Technology

---

*This documentation is intended to be accessible to both technical and non-technical readers. For deeper technical details, refer to the source code documentation and database schema files.*