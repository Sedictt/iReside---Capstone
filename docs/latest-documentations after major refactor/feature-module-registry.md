# iReside Feature & Module Registry

> Master inventory of all features, modules, portals, and their relationships.
> Generated from codebase audit + documentation cross-reference.
> Date: 2026-06-02

---

## Registry Summary

| Metric | Count |
|--------|-------|
| Feature sections (functional-requirements.md) | 22 |
| Functional requirements (REQ-1 through REQ-103) | 103 |
| Portal page routes | 38 |
| API route groups | 23 |
| UI Components (approx) | 110+ |
| User roles | 3 (Super Admin, Landlord, Tenant) |
| Documentation files | 10 |

---

## 1. Portal Route Map

### Super Admin Portal (`/admin/`)

| Route | Page | Status |
|-------|------|--------|
| /admin | Admin dashboard landing | ✅ Implemented |
| /admin/dashboard | System monitoring dashboard | ✅ Implemented |
| /admin/registrations | Landlord registration pipeline | ✅ Implemented |
| /admin/users | User management & moderation | ✅ Implemented |
| /admin/chat-moderation | Message moderation console | ✅ Implemented |
| /admin/consultation-tool | Consultation dashboard | ✅ Implemented |
| /admin/test-verification | Test verification panel | ✅ Implemented |

### Landlord Portal (`/landlord/`)

| Route | Page | Status |
|-------|------|--------|
| /landlord | Layout (shared shell) | ✅ Implemented |
| /landlord/dashboard | Main dashboard w/ KPIs & AI insights | ✅ Implemented |
| /landlord/properties | Property list | ✅ Implemented |
| /landlord/properties/new | Create property | ✅ Implemented |
| /landlord/properties/[id] | Property detail (incl. Floor Planner) | ✅ Implemented |
| /landlord/applications | Walk-in applications | ✅ Implemented |
| /landlord/leases | Lease management | ✅ Implemented |
| /landlord/tenants | Tenant list & management | ✅ Implemented |
| /landlord/maintenance | Maintenance ticket dashboard | ✅ Implemented |
| /landlord/messages | Messaging center | ✅ Implemented |
| /landlord/community | Community hub management | ✅ Implemented |
| /landlord/analytics | Portfolio analytics & reporting | ✅ Implemented |
| /landlord/calendar | Calendar & events | ✅ Implemented |
| /landlord/move-out | Move-out request dashboard | ✅ Implemented |
| /landlord/invoices | Invoice management | ✅ Implemented |
| /landlord/utilities | Utility records | ✅ Implemented |
| /landlord/utility-billing | Utility billing management | ✅ Implemented |
| /landlord/unit-map | Unit map (read-only view) | ✅ Implemented |
| /landlord/documents | Document vault | ✅ Implemented |
| /landlord/settings | Account settings (incl. 2FA) | ✅ Implemented |
| /landlord/profile | Landlord profile | ✅ Implemented |
| /landlord/onboarding/[token] | Onboarding flow | ✅ Implemented |

### Tenant Portal (`/tenant/`)

| Route | Page | Status |
|-------|------|--------|
| /tenant | Layout (shared shell) | ✅ Implemented |
| /tenant/dashboard | Tenant dashboard | ✅ Implemented |
| /tenant/applications | Application tracking | ✅ Implemented |
| /tenant/applications/[id] | Application detail | ✅ Implemented |
| /tenant/lease | Lease overview | ✅ Implemented |
| /tenant/lease/[id] | Lease detail | ✅ Implemented |
| /tenant/sign-lease/[leaseId] | Lease signing | ✅ Implemented |
| /tenant/payments | Payments & billing | ✅ Implemented |
| /tenant/payments/[id] | Payment detail | ✅ Implemented |
| /tenant/payments/[id]/checkout | Payment checkout UI | ✅ Implemented |
| /tenant/maintenance | Maintenance requests | ✅ Implemented |
| /tenant/maintenance/new | Submit new request | ✅ Implemented |
| /tenant/messages | Messaging center | ✅ Implemented |
| /tenant/community | Community hub | ✅ Implemented |
| /tenant/profile | Tenant profile | ✅ Implemented |
| /tenant/settings | Account settings | ✅ Implemented |
| /tenant/unit-map | Unit map (read-only) | ✅ Implemented |
| /tenant/tour | Product tour replay | ✅ Implemented |
| /tenant/utilities | Utility records | ✅ Implemented |

### Shared / Public Routes

| Route | Page | Status |
|-------|------|--------|
| / | Landing/home page | ✅ Implemented |
| /login | Authentication | ✅ Implemented |
| /signup | Registration | ✅ Implemented |
| /signup/tenant | Tenant signup via invite | ✅ Implemented |
| /auth/callback | Auth callback handler | ✅ Implemented |
| /auth/logout | Logout handler | ✅ Implemented |
| /apply | Public application | ✅ Implemented |
| /apply/[token] | Application by token | ✅ Implemented |
| /apply/payments | Application payments | ✅ Implemented |
| /sign/[id] | Remote lease signing | ✅ Implemented |
| /dashboard | Role-aware dashboard | ✅ Implemented |
| /docs | Documentation center | ✅ Implemented |
| /about | About page | ✅ Implemented |
| /privacy | Privacy policy | ✅ Implemented |
| /terms | Terms of service | ✅ Implemented |

---

## 2. API Route Groups

| API Group | Endpoints | Purpose |
|-----------|-----------|---------|
| /api/auth/* | 3 routes | Auth (sign-in, callback, session) |
| /api/admin/* | 13 routes | Admin operations |
| /api/landlord/* | 78+ routes | All landlord operations |
| /api/landlord/2fa/* | 2 routes | 2FA setup & callback |
| /api/landlord/inquiries/* | 2 routes | Inquiry actions & recent |
| /api/landlord/calendar/* | 1 route | Calendar events |
| /api/landlord/analytics/iris-analysis | 1 route | AI-driven analytics |
| /api/tenant/* | 32+ routes | All tenant operations |
| /api/tenant/amenities/bookings/* | 1 route | Amenity booking CRUD |
| /api/messages/* | 10 routes | Real-time messaging |
| /api/community/* | 1 route | Community media uploads |
| /api/iris/* | 4 routes | iRis AI assistant |
| /api/invites/* | 2 routes | Tenant invite management |
| /api/application-payments/* | 1 route | Tokenized payment links |
| /api/profile/* | 3 routes | Profile CRUD |
| /api/cron/* | 1 route | Scheduled tasks |

---

## 3. Feature Inventory (All 22 Sections)

### Core & Cross-Cutting

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 1 | Authentication & Role-Based Access | REQ-1–4 | All | High | ✅ Documented | ✅ Implemented |
| 10 | Security & Data Protection | REQ-39–42 | All | High | ✅ Documented | ✅ Implemented (Supabase Auth + RLS) |
| 9 | Administration & Governance | REQ-33–38 | Admin | Medium | ✅ Enhanced | ✅ Implemented |

### Property & Asset Management

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 2 | Property & Unit Management | REQ-5–8 | Landlord | High | ✅ Documented | ✅ Implemented |
| 14 | Modular Floor Planner | REQ-64–73 | Landlord + Tenant (read) | Medium | ✅ Added | ✅ Implemented (5325-line VisualBuilder) |
| 20 | Landlord Calendar & Events | REQ-95–97 | Landlord | Low | ✅ Added | ✅ Implemented |
| 19 | Amenity Bookings | REQ-91–94 | Tenant | Low | ✅ Added | ✅ Implemented |

### Applications & Onboarding

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 3 | Walk-in Applications & Lease Finalization | REQ-9–12 | Landlord + Tenant | High | ✅ Documented | ✅ Implemented |
| 22 | Application Payments | REQ-101–103 | Public | Medium | ✅ Added | ✅ Implemented |
| 17 | Product Tours & Onboarding | REQ-83–86 | Tenant | Low | ✅ Added | ✅ Implemented (5 tour components) |

### Lease & Document Management

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 4 | Lease Management | REQ-13–16 | Landlord + Tenant | High | ✅ Documented | ✅ Implemented |
| 12 | Enhanced Lease Signing Workflow | REQ-50–55 | Landlord + Tenant | High | ✅ Documented | ✅ Implemented (dual-mode, JWT links) |
| 16 | Unit Transfer Management | REQ-79–82 | Tenant + Landlord | Low | ✅ Added | ✅ Implemented |
| 15 | Move-Out Processing | REQ-74–78 | Tenant + Landlord | Medium | ✅ Added | ✅ Implemented |

### Payments & Billing

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 5 | Payments & Billing | REQ-17–20 | Landlord + Tenant | High | ✅ Documented | ✅ Implemented (manual receipt flow) |

### Maintenance

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 6 | Maintenance Request Management | REQ-21–24 | Landlord + Tenant | High | ✅ Documented | ✅ Implemented |

### Communication & Community

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 7 | Real-Time Messaging | REQ-25–28 | All | High | ✅ Documented | ✅ Implemented (Supabase Realtime) |
| 13 | Community Hub | REQ-56–63 | Landlord + Tenant | Medium | ✅ Added | ✅ Implemented |
| 21 | Inquiry Management | REQ-98–100 | Landlord | Low | ✅ Added | ✅ Implemented |

### AI & Intelligence

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 8 | iRis AI Assistant | REQ-29–32 | Tenant | Medium | ✅ Documented | ✅ Implemented (Groq Llama 3.1 8B RAG) |
| 11 | Landlord Analytics, Reporting & Auditing | REQ-43–49 | Landlord | Medium | ✅ Enhanced | ✅ Implemented (AI insights + CSV/PDF) |

### Security

| # | Feature | REQs | Portal | Priority | Doc Status | Codebase Status |
|---|---------|------|--------|----------|------------|-----------------|
| 18 | Landlord Two-Factor Authentication | REQ-87–90 | Landlord | Medium | ✅ Added | ✅ Implemented (Gmail OTP) |

---

## 4. Codebase Component Map

### Key Components by Module

#### Landlord Components (src/components/landlord/ — ~110 files)

| Sub-module | Key Components | Status |
|------------|---------------|--------|
| Dashboard (24 files) | KPI cards, charts, analytics, RecentInquiries.tsx, DashboardHeaderActions.tsx | ✅ Complete |
| Visual Planner (19 files) | VisualBuilder.tsx, MapSetupWizard.tsx, UnitListingWizard.tsx, 11 sub-components | ✅ Complete |
| Applications (10 files) | Walk-in application forms, status tracking | ✅ Complete |
| Leases (14 files across 2 dirs) | Lease forms, documents, status views | ✅ Complete |
| Tenants (7 files) | Tenant list, details, management | ✅ Complete |
| Maintenance (4 files) | Ticket dashboard, status controls | ✅ Complete |
| Move-Out (4 files) | Move-out request processing | ✅ Complete |
| Messages (7 files) | Message threads, notifications | ✅ Complete |
| Invoices (2 files) | InvoiceModal.tsx, invoice view | ✅ Complete |
| Community (2 files) | Moderation dashboard, approval queue | ✅ Complete |

#### Tenant Components (src/components/tenant/ — ~21 files)

| Sub-module | Key Components | Status |
|------------|---------------|--------|
| Chat | ChatWidget.tsx | ✅ Complete |
| Tours | CommunityTour.tsx, DashboardTour.tsx, LeasTour.tsx, MessagesTour.tsx, TenantProductTourOverlay.tsx | ✅ Complete |
| Lease | LeaseModal.tsx, LeaseRenewalReminder.tsx, LeaseRenewalRequest.tsx | ✅ Complete |
| Move-Out | MoveOutChecklist.tsx, MoveOutRequest.tsx | ✅ Complete |
| Transfer | UnitTransferRequest.tsx | ✅ Complete |
| Community | PropertyAmenities.tsx, TenantContactsSidebar.tsx | ✅ Complete |
| AI | TenantIrisChat.tsx | ✅ Complete |
| Invite | invite/ components | ✅ Complete |
| Settings | TenantSettings.tsx (incl. 2FA toggle) | ✅ Complete |

#### Community Components (src/components/community/ — 6 files)

| Component | Purpose |
|-----------|---------|
| CommunityAnnouncement.tsx | Announcement display |
| CommunityComposer.tsx | Post creation |
| CommunityHeader.tsx | Community header |
| CommunityPhotoLightbox.tsx | Image gallery viewer |
| CommunityPostCard.tsx | Post display card |
| CommunityRules.tsx | Community rules display |

#### Shared Components (src/components/shared/)

| Component | Purpose |
|-----------|---------|
| DigitalSigner/ | Digital signature capture & validation |
| IResideLoading.tsx | Loading state component |
| ViewToggle.tsx | View mode toggle |

#### UI Components (src/components/ui/ — 13 files)

| Component | Purpose |
|-----------|---------|
| ClickSpark.tsx, ClickSparkWrapper.tsx | Click interaction effects |
| LoadingSpinner.tsx | Loading indicator |
| Skeleton.tsx | Skeleton loading states |
| badge.tsx, button.tsx, input.tsx | Base UI primitives (Radix-based) |
| dropdown-menu.tsx, tooltip.tsx | Radix UI primitives |
| Logo.tsx | iReside logo |
| ProfileCard.tsx, ProfileCardTrigger.tsx | Profile display |
| client-only-date.tsx | Client-side date rendering |

---

## 5. Documentation Cross-Reference

| Document | Content | Status |
|----------|---------|--------|
| functional-requirements.md | 22 sections, 103 REQs | ✅ Updated (2026-06-02) |
| output-system-features-specification.md | 20 detailed feature specs | ✅ Comprehensive |
| output-specific-obj.md | 104 specific objectives by role | ✅ Most detailed |
| output-use-case-scenarios-3.5.5.md | 25 use case scenarios | ✅ Comprehensive |
| output-scope&delims.md | 14 scope/delimitation categories | ✅ Complete |
| output-conceptual-framework.md | Conceptual framework diagram | ✅ Complete |
| activity-diagram-documentation.md | 10 UML activity diagrams | ✅ Complete |
| work-breakdown-structure.md | WBS for 70-day project | ✅ Complete |
| ireside_system_overview.md | System philosophy & deployment model | ✅ Complete |
| considerations.md | Future considerations | ✅ Complete |

---

## 6. Feature Coverage Matrix

Legend:
  ✅ = Fully documented & implemented
  🔧 = Implemented in codebase, now in documentation (gap resolved)

| # | Feature | FR | Spec | Obj | Code | Status |
|---|---------|----|------|-----|------|--------|
| 1 | Auth & RBAC | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 2 | Property & Unit Mgmt | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 3 | Walk-in Apps | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 4 | Lease Management | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 5 | Payments & Billing | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 6 | Maintenance | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 7 | Messaging | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 8 | iRis AI Assistant | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 9 | Admin & Governance | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 10 | Security & Data | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 11 | Analytics & Reporting | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 12 | Lease Signing | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 13 | Community Hub | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 14 | Floor Planner | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 15 | Move-Out | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 16 | Unit Transfer | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 17 | Product Tours | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
| 18 | Landlord 2FA | ✅ | — | — | ✅ | 🔧 Resolved |
| 19 | Amenity Bookings | ✅ | — | — | ✅ | 🔧 Resolved |
| 20 | Landlord Calendar | ✅ | — | — | ✅ | 🔧 Resolved |
| 21 | Inquiry Management | ✅ | — | — | ✅ | 🔧 Resolved |
| 22 | Application Payments | ✅ | — | — | ✅ | 🔧 Resolved |

### Resolved Documentation Gaps (this session)

| Former Gap | Resolution |
|------------|-----------|
| 9 duplicate (Landlord Property & Unit Mgmt) | Removed — merged into 2 |
| Missing: Community Hub | Added as 13 (8 REQs) |
| Missing: Modular Floor Planner | Added as 14 (10 REQs) |
| Missing: Move-Out Processing | Added as 15 (5 REQs) |
| Missing: Unit Transfer | Added as 16 (4 REQs) |
| Missing: Product Tours | Added as 17 (4 REQs) |
| Missing: Landlord 2FA | Added as 18 (4 REQs) |
| Missing: Amenity Bookings | Added as 19 (4 REQs) |
| Missing: Landlord Calendar | Added as 20 (3 REQs) |
| Missing: Inquiry Management | Added as 21 (3 REQs) |
| Missing: Application Payments | Added as 22 (3 REQs) |
| Thin: Admin & Governance (9) | Enhanced: 2 more REQs, richer descriptions |
| Thin: Security (10) | Enhanced: RLS, Supabase Auth, destructive sign-out |
| Thin: Analytics (11) | Enhanced: 2 more REQs, mode toggle, date ranges |

---

## 7. Technology Stack Inventory

| Layer | Technology | Usage |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Full application shell |
| Language | TypeScript | All source code |
| UI Library | React 19 | Component layer |
| Styling | Tailwind CSS 4 | Utility-first styling |
| UI Primitives | Radix UI | Accessible components |
| Animation | Framer Motion | Page/UI transitions |
| Drag & Drop | @dnd-kit/core + @dnd-kit/utilities | Floor Planner |
| Backend/Database | Supabase (PostgreSQL) | Data, Auth, Storage, Realtime |
| Auth | Supabase Auth | Authentication + RLS |
| AI/ML | Groq Llama 3.1 8B (via OpenAI SDK) | iRis AI, moderation, analytics |
| Maps | Leaflet | Map features |
| Charts | Chart.js | Analytics |
| Forms | React Hook Form + Zod | Form validation |
| Fonts | Geist + Rethink Sans | Typography |

---

## 8. REQ Number Reference (REQ-1 to REQ-103)

| Range | Section | Feature |
|-------|---------|---------|
| REQ-1 to REQ-4 | 1 | Authentication & Role-Based Access |
| REQ-5 to REQ-8 | 2 | Property & Unit Management |
| REQ-9 to REQ-12 | 3 | Walk-in Applications & Lease Finalization |
| REQ-13 to REQ-16 | 4 | Lease Management |
| REQ-17 to REQ-20 | 5 | Payments & Billing |
| REQ-21 to REQ-24 | 6 | Maintenance Request Management |
| REQ-25 to REQ-28 | 7 | Real-Time Messaging |
| REQ-29 to REQ-32 | 8 | iRis AI Assistant |
| REQ-33 to REQ-38 | 9 | Administration & Governance |
| REQ-39 to REQ-42 | 10 | Security & Data Protection |
| REQ-43 to REQ-49 | 11 | Landlord Analytics, Reporting & Auditing |
| REQ-50 to REQ-55 | 12 | Enhanced Lease Signing Workflow |
| REQ-56 to REQ-63 | 13 | Community Hub |
| REQ-64 to REQ-73 | 14 | Modular Floor Planner |
| REQ-74 to REQ-78 | 15 | Move-Out Processing |
| REQ-79 to REQ-82 | 16 | Unit Transfer Management |
| REQ-83 to REQ-86 | 17 | Product Tours & Onboarding |
| REQ-87 to REQ-90 | 18 | Landlord Two-Factor Authentication |
| REQ-91 to REQ-94 | 19 | Amenity Bookings |
| REQ-95 to REQ-97 | 20 | Landlord Calendar & Event Management |
| REQ-98 to REQ-100 | 21 | Inquiry Management |
| REQ-101 to REQ-103 | 22 | Application Payments |

---

## 9. Remaining Open Items

| Issue | Details | Needs |
|-------|---------|-------|
| Payment gateway status | Checkout UI exists (/tenant/payments/[id]/checkout/) but scope&delims.md marks payment processing as out-of-scope. Current flow appears manual receipt-based. | Decision: keep manual-receipt flow or remove checkout page |
| Admin Metrics Dashboard | Features spec 19 describes live enterprise metrics, but no dedicated /admin/metrics route found. Dashboard lives at /admin/dashboard. | Verify route or update docs |
| Floor Planner parity | Features spec implies richer functionality than VisualBuilder delivers (4 presets vs possibly more documented) | Audit VisualBuilder capabilities vs documentation claims |
