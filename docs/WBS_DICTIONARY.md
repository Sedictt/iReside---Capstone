# iReside System — Work Breakdown Dictionary (WBS)

**Version:** 1.0
**Date:** 2026-05-14
**Project:** iReside Property Management System
**Scope:** Complete property management platform for landlords and tenants with deployment-based delivery model

---

## Legend

| Symbol | Meaning |
|--------|---------|
| N/A | Not Applicable |
| TBD | To Be Determined |

---

## Level 1 — Project

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | 1.0 | iReside System | Complete property management platform for landlords and tenants, following a deployment-based delivery model where each landlord receives an independently operated instance. | N/A | TBD | Proponents |

---

## Level 2 — Major Deliverables

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 2 | 1.1 | Account Management | Users must be able to create, secure, recover, and maintain their accounts with role-based access control. | N/A | TBD | Proponents |
| 2 | 1.2 | Core Platform Setup | Establish the application shell, routing, shared UI foundation, and design system. | N/A | TBD | Proponents |
| 2 | 1.3 | Applications and Lease Management | Manage rental applications, approvals, enhanced lease signing workflows, and document storage. | N/A | TBD | Proponents |
| 2 | 1.4 | Property and Unit Management | Let landlords create, configure, and maintain properties and units with visual floor planning. | N/A | TBD | Proponents |
| 2 | 1.5 | Financial Operations | Track rent, utilities, invoices, receipts, payment history, and generate audit reports. | N/A | TBD | Proponents |
| 2 | 1.6 | Maintenance, Messaging, and AI | Coordinate repair requests, real-time conversations, and AI-assisted tenant support. | N/A | TBD | Proponents |
| 2 | 1.7 | Admin Governance | Provide administrative tools for platform oversight, user management, and registration review. | N/A | TBD | Proponents |
| 2 | 1.8 | Community Hub | Centralized building-wide engagement with posts, polls, announcements, and moderation. | N/A | TBD | Proponents |
| 2 | 1.9 | Testing and Deployment | Verify quality, prepare release artifacts, and deploy the system to landlords. | N/A | TBD | Proponents |

---

## Level 3 — Specific Work Packages

### 1.1 Account Management

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.1.1 | Sign Up | Allow new users to register using email, password, and role selection (Tenant, Landlord). | N/A | TBD | Frontend and Backend Team |
| 3 | 1.1.2 | Sign In | Authenticate returning users via Supabase Auth and create role-aware sessions. | 1.1.1 | TBD | Frontend and Backend Team |
| 3 | 1.1.3 | Account Recovery | Let users recover access through password reset and account verification via email. | 1.1.2 | TBD | Backend Team |
| 3 | 1.1.4 | Profile Management | Allow users to update profile details, avatars, and account settings. | 1.1.2 | TBD | Frontend Team |
| 3 | 1.1.5 | Session Management | Maintain user sessions until sign-out or expiration with secure token handling. | 1.1.2 | TBD | Backend Team |
| 3 | 1.1.6 | Role-Based Access Control | Enforce RBAC ensuring users access only pages and actions permitted for their role. | 1.1.2 | TBD | Backend Team |

### 1.2 Core Platform Setup

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.2.1 | Application Layout and Navigation | Build responsive shell with header, sidebar, and role-based routing for Admin, Landlord, and Tenant portals. | N/A | TBD | Frontend Team |
| 3 | 1.2.2 | Design System and Styling | Configure Tailwind CSS 4, global styles, design tokens, Geist + Rethink Sans typography, and component patterns. | 1.2.1 | TBD | Frontend Team |
| 3 | 1.2.3 | State and Data Utilities | Implement reusable React hooks, fetch utilities, Supabase client helpers, and shared TypeScript types. | 1.2.1 | TBD | Full-Stack Team |
| 3 | 1.2.4 | Supabase Integration | Configure PostgreSQL database, Row-Level Security policies, real-time subscriptions, and storage buckets. | 1.2.1 | TBD | Backend Team |

### 1.3 Applications and Lease Management

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.3.1 | Walk-in Application Submission | Let landlords record applicant details, documents, and submit walk-in applications for units. | 1.2.2 | TBD | Frontend and Backend Team |
| 3 | 1.3.2 | Application Review Workflow | Allow landlords to review, save as pending/approved, and update application status with notes. | 1.3.1 | TBD | Backend Team |
| 3 | 1.3.3 | Enhanced Lease Signing Workflow | Implement dual signing modes (in-person and remote), tenant-first signing order, JWT-based signing links, comprehensive audit trails, and wizard state persistence. | 1.3.2 | TBD | Full-Stack Team |
| 3 | 1.3.4 | Lease Document Vault | Provide secure storage and access to signed agreements, verified reports, and related lease files. | 1.3.3 | TBD | Backend Team |
| 3 | 1.3.5 | Lease Status State Machine | Implement validated status transitions (draft → pending_tenant_signature → pending_landlord_signature → active → expired). | 1.3.3 | TBD | Backend Team |
| 3 | 1.3.6 | Renewal and Move-Out Tracking | Track lease renewals, expirations, and process tenant move-out requests. | 1.3.3 | TBD | Backend Team |

### 1.4 Property and Unit Management

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.4.1 | Property Registration | Capture property metadata, address data, verification details, and manage property-level settings. | 1.2.2 | TBD | Backend Team |
| 3 | 1.4.2 | Unit Management | Create and manage units with pricing, deposits, amenities, availability status, and media uploads. | 1.4.1 | TBD | Frontend and Backend Team |
| 3 | 1.4.3 | Modular Floor Planner | Build drag-and-drop unit layout designer with 20px grid snapping for visualizing property structures. | 1.4.1 | TBD | Frontend Team |
| 3 | 1.4.4 | Unit Map Visualization | Provide read-only visual representation of building layout for tenants to view and request transfers. | 1.4.3 | TBD | Frontend Team |

### 1.5 Financial Operations

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.5.1 | Invoice Management | Create, track, and manage invoices with Base Rent, Water, Electricity components. | 1.3.3 | TBD | Backend Team |
| 3 | 1.5.2 | Payment Tracking | Display payment status (overdue, pending, completed) and breakdown of charges per invoice. | 1.5.1 | TBD | Frontend and Backend Team |
| 3 | 1.5.3 | Financial Ledger | Provide landlords with live financial overview of billing activity and tenant balances. | 1.5.1 | TBD | Frontend and Backend Team |
| 3 | 1.5.4 | Receipt Upload and Verification | Support manual proof-of-payment submission, review, and approval workflow. | 1.5.2 | TBD | Frontend and Backend Team |
| 3 | 1.5.5 | Report Exporting | Generate iReside-branded PDF reports and CSV data exports for auditing. | 1.5.3 | TBD | Full-Stack Team |
| 3 | 1.5.6 | Payment History Views | Display chronological transaction logs and detailed payment records for tenants. | 1.5.2 | TBD | Frontend Team |

### 1.6 Maintenance, Messaging, and AI

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.6.1 | Maintenance Request Submission | Allow tenants to submit repair requests with image uploads and descriptions. | 1.2.2 | TBD | Frontend and Backend Team |
| 3 | 1.6.2 | Maintenance Dashboard | Track all repair tickets with priority status, galleries, and resolution progress. | 1.6.1 | TBD | Frontend and Backend Team |
| 3 | 1.6.3 | Real-Time Messaging | Implement in-app chat with typing indicators, read receipts, presence, and file/media sharing. | 1.2.2 | TBD | Full-Stack Team |
| 3 | 1.6.4 | Message Moderation | Filter toxic content and spam before message delivery using AI analysis. | 1.6.3 | TBD | Backend Team |
| 3 | 1.6.5 | AI Assistant Integration | Integrate Groq Llama 3.1 8B with RAG for contextual tenant support via full-page chat and floating widget. | 1.6.3 | TBD | Backend Team |
| 3 | 1.6.6 | RAG Context Pipeline | Build retrieval-augmented generation context from tenant profile, property, unit, lease, maintenance, and payment data. | 1.6.5 | TBD | Backend Team |

### 1.7 Admin Governance

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.7.1 | Registration Review Dashboard | Let admins inspect landlord applications, documents, photos, and status updates with badge coding. | 1.2.1 | TBD | Frontend and Backend Team |
| 3 | 1.7.2 | User Management Tools | Support filtering, searching, and role management for platform users with combined search and filter. | 1.7.1 | TBD | Frontend Team |
| 3 | 1.7.3 | Platform Metrics Dashboard | Display live KPIs (Total Users, Properties, Leases, Pending Reviews) with real-time updates. | 1.7.1 | TBD | Frontend Team |
| 3 | 1.7.4 | Registration Pipeline Monitoring | Monitor application flow from Pending → Reviewing → Approved with status filter tabs. | 1.7.1 | TBD | Frontend Team |
| 3 | 1.7.5 | Admin Notes and Decisions | Store internal admin notes and track decision history for audit purposes. | 1.7.1 | TBD | Backend Team |

### 1.8 Community Hub

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.8.1 | Post Creation | Support discussion posts, photo albums (up to 4 photos), resident polls, management notices, and utility alerts. | 1.2.2 | TBD | Frontend and Backend Team |
| 3 | 1.8.2 | Engagement System | Implement multi-reactions (Like, Heart, Thumbs Up, Clap, Celebration), threaded comments, and post saving. | 1.8.1 | TBD | Frontend and Backend Team |
| 3 | 1.8.3 | Content Moderation | Handle approval queue, property filtering, and user-driven spam/harassment reporting. | 1.8.1 | TBD | Frontend and Backend Team |
| 3 | 1.8.4 | Community Board Management | Allow landlords to manage building community posts and view moderation dashboard. | 1.8.3 | TBD | Frontend Team |

### 1.9 Testing and Deployment

| Level | Code | Name | Description | Predecessors | Duration (Days) | Owner |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 3 | 1.9.1 | Unit and Integration Testing | Validate critical workflows and service interactions across all modules. | 1.2.3 | TBD | QA Team |
| 3 | 1.9.2 | Bug Fixing and Refinement | Resolve defects found during testing and review cycles. | 1.9.1 | TBD | Full-Stack Team |
| 3 | 1.9.3 | Documentation and Handoff | Prepare thesis documents, user guides, deployment manuals, and final handoff files. | 1.9.2 | TBD | Documentation Team |
| 3 | 1.9.4 | Deployment to Landlords | Provision and set up independent property instances for landlord handover. | 1.9.3 | TBD | Backend Team |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Level 1 (Project) | 1 |
| Level 2 (Major Deliverables) | 9 |
| Level 3 (Work Packages) | 46 |
| **Total Work Packages** | **56** |

---

## Critical Path Notes

Based on the dependency structure, the longest path is estimated as:

```
1.0 → 1.1 → 1.2 → 1.3 → 1.5 → 1.9
```

Key dependencies:
- **1.3 (Applications and Lease Management)** depends on **1.2 (Core Platform Setup)**
- **1.5 (Financial Operations)** depends on **1.3 (Applications and Lease Management)**
- **1.9 (Testing and Deployment)** is the final phase after all preceding work

---

## Owner Assignments

| Owner | Level 3 Packages |
|-------|-----------------|
| Frontend Team | 1.1.1, 1.1.4, 1.2.1, 1.2.2, 1.4.2, 1.4.3, 1.4.4, 1.5.2, 1.5.6, 1.6.1, 1.6.2, 1.6.3, 1.7.2, 1.7.3, 1.7.4, 1.8.1, 1.8.2, 1.8.3, 1.8.4 |
| Backend Team | 1.1.2, 1.1.3, 1.1.5, 1.1.6, 1.2.3, 1.2.4, 1.3.2, 1.3.3, 1.3.4, 1.3.5, 1.3.6, 1.4.1, 1.5.1, 1.5.3, 1.5.4, 1.6.4, 1.6.5, 1.6.6, 1.7.1, 1.7.5, 1.9.4 |
| Full-Stack Team | 1.3.1, 1.5.5, 1.9.2 |
| QA Team | 1.9.1 |
| Documentation Team | 1.9.3 |

---

**Document Status:** Draft for Review