# iReside Functional Requirements (Updated)

This document describes the functional requirements of the iReside property management system.



## 1. Authentication and Role-Based Access

### 1.1 Description and Priority

This feature allows authorized users to sign in and access the correct portal based on their assigned role, while landlords and system administrators provision tenant accounts through approved onboarding or lease workflows.

**Priority:** High

### 1.2 Stimulus / Response

#### 1.2.1 Positive Flow

##### 1.2.1.1

The user submits valid sign-in credentials, or a landlord or system administrator creates a tenant account during an approved onboarding process.

**Response:** The system authenticates the user or provisions the new tenant account, creates or restores the session, and routes the user to the appropriate dashboard for their role.

#### 1.2.2 Negative Flow

##### 1.2.2.1

The user submits invalid credentials, or an unauthorized user attempts to create or access an account outside the approved workflow.

**Response:** The system denies access, displays an error message, and prevents the user from viewing restricted data.

### 1.3 Functional Requirements

**REQ-1:** The system shall allow authorized users to log in using authenticated credentials, and shall allow landlords or system administrators to provision tenant accounts through approved onboarding or lease-finalization workflows.

**REQ-2:** The system shall identify the user's role and route the user to the correct interface after authentication.

**REQ-3:** The system shall restrict access to pages, records, and actions based on role permissions.

**REQ-4:** The system shall maintain user sessions until the user signs out or the session expires.



## 2. Property and Unit Management

### 2.1 Description and Priority

This feature allows landlords to create, configure, and maintain properties and units that serve as the foundation for applications, leases, and tenant occupancy.

**Priority:** High

### 2.2 Stimulus / Response

#### 2.2.1 Positive Flow

The landlord creates or updates a property or unit.

**Response:** The system saves the data, updates availability, and makes the unit ready for application and lease assignment.

#### 2.2.2 Negative Flow

Invalid or incomplete property or unit data is submitted.

**Response:** The system rejects the submission and highlights missing or invalid fields.

### 2.3 Functional Requirements

**REQ-5:** The system shall allow landlords to create and manage property records.

**REQ-6:** The system shall allow landlords to define and manage units within a property.

**REQ-7:** The system shall store unit attributes such as pricing, amenities, and availability.

**REQ-8:** The system shall persist property and unit data for use in applications and lease workflows.



## 3. Walk-in Applications and Lease Finalization

### 3.1 Description and Priority

This feature allows landlords to record walk-in applications, manage their status, and finalize leases for approved applicants.

**Priority:** High

### 3.2 Stimulus / Response

#### 3.2.1 Positive Flow

##### 3.2.1.1

The landlord opens a unit showcase, records applicant details, and submits the walk-in application with the required documents.

**Response:** The system stores the application as pending or approved, notifies the relevant parties, and keeps the application timeline updated.

#### 3.2.2 Negative Flow

##### 3.2.2.1

The walk-in application is incomplete, required documents are missing, or the selected unit is unavailable.

**Response:** The system prevents final submission, shows the missing requirements or availability issue, and prompts the landlord to correct the request.

### 3.3 Functional Requirements

**REQ-9:** The system shall allow landlords to create walk-in applications for prospective tenants.

**REQ-10:** The system shall store applicant details, supporting documents, and checklist progress for each walk-in application.

**REQ-11:** The system shall allow landlords to save walk-in applications as pending or approved and update their status later.

**REQ-12:** The system shall finalize approved applications into lease records and provision a tenant account with credentials.



## 4. Lease Management

### 4.1 Description and Priority

This feature allows landlords and tenants to create, review, sign, and monitor lease agreements digitally.

**Priority:** High

### 4.2 Stimulus / Response

#### 4.2.1 Positive Flow

##### 4.2.1.1

The landlord generates a lease from an approved application and both parties complete the signing flow.

**Response:** The system displays the lease details, supports signing, stores the signed documents, and updates the lease status when the agreement is completed.

#### 4.2.2 Negative Flow

##### 4.2.2.1

The lease is incomplete, required signatures are missing, or the user attempts to access a lease that does not belong to them.

**Response:** The system blocks the action and shows an access or validation error.

### 4.3 Functional Requirements

**REQ-13:** The system shall create and store lease records for approved walk-in applications and assigned units.

**REQ-14:** The system shall support digital lease signing, move-in condition reports, and lease amendments.

**REQ-15:** The system shall provide a document vault for signed agreements, verified reports, and related lease files.

**REQ-16:** The system shall display lease progress, start and end dates, remaining days, and renewal eligibility.



## 5. Payments and Billing

### 5.1 Description and Priority

This feature allows tenants to view charges, monitor payment status, and review payment history.

**Priority:** High

### 5.2 Stimulus / Response

#### 5.2.1 Positive Flow

##### 5.2.1.1

The tenant opens the billing or payments page.

**Response:** The system displays outstanding amounts, payment breakdowns, and completed transactions.

#### 5.2.2 Negative Flow

##### 5.2.2.1

Payment information cannot be retrieved or an invoice is unavailable.

**Response:** The system shows an error or fallback state and keeps previously recorded payment data intact.

### 5.3 Functional Requirements

**REQ-17:** The system shall display rent and utility charges associated with a lease.

**REQ-18:** The system shall show the status of payments as overdue, pending, or completed.

**REQ-19:** The system shall record and display payment history and transaction logs.

**REQ-20:** The system shall provide landlords with a live financial ledger for monitoring billing activity.



## 6. Maintenance Request Management

### 6.1 Description and Priority

This feature allows tenants to submit repair requests and allows landlords to monitor and resolve them.

**Priority:** High

### 6.2 Stimulus / Response

#### 6.2.1 Positive Flow

##### 6.2.1.1

The tenant creates a maintenance request and attaches supporting details or images.

**Response:** The system stores the request, notifies the landlord, and updates the request in the maintenance dashboard.

#### 6.2.2 Negative Flow

##### 6.2.2.1

The request is missing required details or violates upload constraints.

**Response:** The system rejects the submission and prompts the tenant to correct the entry.

### 6.3 Functional Requirements

**REQ-21:** The system shall allow tenants to submit maintenance requests for their unit or property.

**REQ-22:** The system shall allow users to attach images and descriptions to maintenance requests.

**REQ-23:** The system shall allow landlords to update maintenance request status from pending to in-progress to completed.

**REQ-24:** The system shall show maintenance request history and status tracking.



## 7. Real-Time Messaging

### 7.1 Description and Priority

This feature allows tenants, landlords, and administrators to exchange messages in real time while filtering unsafe content before delivery.

**Priority:** High

### 7.2 Stimulus / Response

#### 7.2.1 Positive Flow

##### 7.2.1.1

The user opens a conversation and sends a message.

**Response:** The system delivers the message, updates the conversation thread, and reflects presence or read state changes.

#### 7.2.2 Negative Flow

##### 7.2.2.1

The message contains unsafe or spam content.

**Response:** The system prevents delivery and informs the sender.

### 7.3 Functional Requirements

**REQ-25:** The system shall support real-time messaging between authorized users.

**REQ-26:** The system shall allow users to send text, image, and file-based messages.

**REQ-27:** The system shall display conversation history, timestamps, delivery state, and presence indicators.

**REQ-28:** The system shall filter unsafe or spam content before delivery.



## 8. iRis AI Assistant

### 8.1 Description and Priority

This feature allows tenants to ask natural-language questions and receive contextual assistance.

**Priority:** Medium

### 8.2 Stimulus / Response

#### 8.2.1 Positive Flow

The tenant submits a question.

**Response:** The system generates and returns an answer using relevant context.

#### 8.2.2 Negative Flow

The AI service is unavailable.

**Response:** The system returns a fallback response.

### 8.3 Functional Requirements

**REQ-29:** The system shall allow tenants to submit free-form questions.

**REQ-30:** The system shall use relevant system data when generating AI responses.

**REQ-31:** The system shall return AI responses with necessary metadata.

**REQ-32:** The system shall provide fallback behavior when AI is unavailable.



## 9. Administration and Governance

### 9.1 Description and Priority

This feature allows administrators to manage platform governance including system monitoring, user management, and registration oversight.

**Priority:** Medium

### 9.2 Stimulus / Response

#### 9.2.1 Positive Flow

The administrator accesses the dashboard.

**Response:** The system displays live enterprise metrics (Total Users, Active Properties, Active Leases, Pending Reviews), registration pipeline visualization, and role breakdown analytics.

#### 9.2.2 Positive Flow

The administrator reviews and processes a landlord registration.

**Response:** The system presents applicant details, uploaded documents, and profile photos for evaluation. The admin can add internal notes, update application status with icon-coded badges (Approved, Rejected, Reviewing), and track pipeline progress.

#### 9.2.3 Negative Flow

Unauthorized access is attempted.

**Response:** The system blocks access and denies the request.

### 9.3 Functional Requirements

**REQ-33:** The system shall display platform metrics including Total Users, Active Properties, Active Leases, and Pending Reviews.

**REQ-34:** The system shall allow review of landlord registrations with detailed evaluation modals.

**REQ-35:** The system shall store admin notes and decisions on registration applications.

**REQ-36:** The system shall restrict admin features to authorized users.

**REQ-37:** The system shall support role-specific user search and filtering (All, Tenant, Landlord, Admin).

**REQ-38:** The system shall allow registration status filtering with icon-coded badges.

---

## 10. Security and Data Protection

### 10.1 Description and Priority

Ensures data privacy and protection through role-based access control, database-level row-level security (RLS), and secure session management.

**Priority:** High

### 10.2 Stimulus / Response

#### 10.2.1 Positive Flow

Authenticated request is processed.

**Response:** Access control is enforced at the PostgreSQL level via Row-Level Security (RLS), Supabase Auth-powered session validation, and role-aware navigation guards.

#### 10.2.2 Positive Flow

The user signs out.

**Response:** The system performs a destructive sign-out with audit-safe session termination.

#### 10.2.3 Negative Flow

Unauthorized request is detected.

**Response:** The request is rejected with appropriate error messaging.

### 10.3 Functional Requirements

**REQ-39:** The system shall enforce role-based access control at the database, API, and UI levels.

**REQ-40:** The system shall prevent unauthorized data access through PostgreSQL Row-Level Security (RLS).

**REQ-41:** The system shall maintain secure sign-out with complete session termination.

**REQ-42:** The system shall protect sensitive data across all layers of the application stack.

---

## 11. Landlord Analytics, Reporting, and Auditing

### 11.1 Description and Priority

This feature provides landlords with a comprehensive view of portfolio performance through real-time analytics, AI-driven insights, and formal reporting tools. It supports decision-making and auditability.

**Priority:** Medium

### 11.2 Stimulus / Response

#### 11.2.1 Positive Flow

The landlord views analytics or generates a report.

**Response:** The system displays KPI summaries (Net Income, Occupancy, Maintenance Volume, Lease Renewals, Portfolio Value), AI-driven strategic recommendations, and generates downloadable reports while logging activity.

#### 11.2.2 Positive Flow

The landlord toggles dashboard reading mode.

**Response:** The system switches between "Simplified Mode" and "Detailed Analytics" for flexible consumption of performance data.

#### 11.2.3 Negative Flow

AI or report generation fails.

**Response:** The system provides fallback insights or error messages, transitioning to rule-based insights if AI processing is unavailable.

### 11.3 Functional Requirements

**REQ-43:** The system shall display KPI summaries such as income, occupancy, delinquency, and maintenance volume.

**REQ-44:** The system shall generate AI-driven insights and recommendations.

**REQ-45:** The system shall provide fallback insights when AI is unavailable.

**REQ-46:** The system shall generate downloadable reports (CSV/PDF).

**REQ-47:** The system shall log report activity and maintain audit snapshots.

**REQ-48:** The system shall support preset date ranges (7D, 30D, 90D, 1Y) and custom date pickers.

**REQ-49:** The system shall allow landlords to toggle between Simplified Mode and Detailed Analytics.

---

## 12. Enhanced Lease Signing Workflow

### 12.1 Description and Priority

This feature provides a flexible lease signing workflow supporting both in-person (dual) and remote (async) signing modes with tenant-first signing order, secure JWT-based signing links, comprehensive audit trails, and wizard state persistence for external tool access.

**Priority:** High

### 12.2 Stimulus / Response

#### 12.2.1 Positive Flow

The landlord selects a signing mode and completes the signing workflow (in-person with both parties present, or remote by sending a signing link to the tenant).

**Response:** The system captures signatures in the correct order (tenant-first, then landlord), updates lease status through a state machine, logs all signing events for audit, and preserves wizard state when accessing external management tools.

#### 12.2.2 Negative Flow

Invalid signing mode selection, expired signing links, concurrent signature attempts, or unauthorized access to audit trails.

**Response:** The system prevents invalid operations, displays appropriate error messages, and maintains data integrity through validation and locking mechanisms.

### 12.3 Functional Requirements

**REQ-50:** The system shall support dual signing modes (in-person and remote) with tenant-first signing order enforcement.

**REQ-51:** The system shall generate secure JWT-based signing links with 30-day expiration for remote tenant signing.

**REQ-52:** The system shall maintain a comprehensive audit trail for all signing events with timestamps, IP addresses, and user agents.

**REQ-53:** The system shall preserve wizard state in localStorage when navigating to external management tools (Contract Templates, Property Policies, Amenities).

**REQ-54:** The system shall implement a lease status state machine with validated transitions (draft → pending_tenant_signature → pending_landlord_signature → active).

**REQ-55:** The system shall validate signature data format, size, and dimensions before storage and prevent concurrent signing conflicts.

---

## 13. Community Hub

### 13.1 Description and Priority

This feature provides a shared communication space within each property where tenants and landlords can post discussions, share photo albums, participate in polls, and receive management announcements in real time.

**Priority:** Medium

### 13.2 Stimulus / Response

#### 13.2.1 Positive Flow

A tenant creates a discussion post, photo album, or poll.

**Response:** The system creates the post and makes it visible to all members of the property community (pending landlord approval if moderation is enabled).

#### 13.2.2 Positive Flow

A landlord publishes a management notice or utility alert.

**Response:** The system pins the announcement and auto-styles utility alerts (water, power, maintenance outages) for prominent visibility.

#### 13.2.3 Negative Flow

A user attempts to post spam or harassing content.

**Response:** The system allows reporting and hides the content pending moderation review.

### 13.3 Functional Requirements

**REQ-56:** The system shall support text-based discussion posts, image galleries (up to 4 photos), and resident polls.

**REQ-57:** The system shall allow tenants to react to posts with multi-reactions (Like, Heart, Thumbs Up, Clap, Celebration).

**REQ-58:** The system shall support threaded comments on community posts with real-time updates.

**REQ-59:** The system shall allow tenants to bookmark and save important discussions.

**REQ-60:** The system shall provide content reporting for spam or harassment.

**REQ-61:** The system shall provide landlords with an approval queue to review and approve/resident posts before publication.

**REQ-62:** The system shall include a landlord moderation dashboard with property filtering for managing pending content.

**REQ-63:** The system shall support pinned management notices and auto-styled utility alerts.

---

## 14. Modular Floor Planner (Visual Property Management)

### 14.1 Description and Priority

This feature provides landlords with a drag-and-drop structural engine for designing property layouts, enabling interactive manipulation of corridors, units, and room spaces with precise grid snapping.

**Priority:** Medium

### 14.2 Stimulus / Response

#### 14.2.1 Positive Flow

The landlord opens the floor planner for a property.

**Response:** The system displays a visual canvas with the current property layout, a sidebar block library of unit types, and controls for adding, moving, and resizing structural elements.

#### 14.2.2 Positive Flow

The landlord drags a new unit block onto the canvas.

**Response:** The system places the unit on a 20px grid, checks for collisions with existing elements, and persists the change in real time to the backend.

#### 14.2.3 Negative Flow

The landlord attempts to place a unit that overlaps with existing structures.

**Response:** The system prevents placement and shows a collision warning.

### 14.3 Functional Requirements

**REQ-64:** The system shall provide a drag-and-drop structural engine for designing property layouts.

**REQ-65:** The system shall enforce a 20px grid-snapping system for precise alignment.

**REQ-66:** The system shall support real-time persistence of all structural changes to the Supabase backend.

**REQ-67:** The system shall include a sidebar block library with unit type presets (studio, 1BR, 2BR, 3BR, corridors, common areas).

**REQ-68:** The system shall support layout presets (double-loaded, U-shape, L-shape, single-loaded) for rapid floor planning.

**REQ-69:** The system shall detect and prevent collisions between placed elements.

**REQ-70:** The system shall support multi-floor management with individual floor canvases.

**REQ-71:** The system shall provide zoom, pan, and minimap navigation for the canvas.

**REQ-72:** The system shall provide tenants with a read-only unit map view of the building layout.

**REQ-73:** The system shall support undo operations for structural changes.

---

## 15. Move-Out Processing

### 15.1 Description and Priority

This feature allows tenants to submit digital move-out requests and enables landlords to manage and process move-outs through a dedicated dashboard.

**Priority:** Medium

### 15.2 Stimulus / Response

#### 15.2.1 Positive Flow

The tenant submits a move-out request through their portal.

**Response:** The system records the request, notifies the landlord, and updates the move-out dashboard with the new request.

#### 15.2.2 Positive Flow

The landlord reviews and processes a move-out request.

**Response:** The system displays move-out details, associated lease information, and allows the landlord to update the request status and schedule move-out inspection.

#### 15.2.3 Negative Flow

The tenant attempts to submit a move-out request without an active lease.

**Response:** The system blocks the submission and displays an appropriate message.

### 15.3 Functional Requirements

**REQ-74:** The system shall allow tenants to submit digital move-out requests.

**REQ-75:** The system shall provide landlords with a move-out request dashboard for tracking and processing.

**REQ-76:** The system shall notify the landlord when a new move-out request is submitted.

**REQ-77:** The system shall link move-out requests to the associated lease and unit records.

**REQ-78:** The system shall provide a move-out checklist for tenants to track required steps before vacating.

---

## 16. Unit Transfer Management

### 16.1 Description and Priority

This feature allows tenants to request transfers to vacant units within their property and enables landlords to review and process transfer requests.

**Priority:** Low

### 16.2 Stimulus / Response

#### 16.2.1 Positive Flow

The tenant selects a vacant unit from the unit map and submits a transfer request.

**Response:** The system records the transfer request and notifies the landlord.

#### 16.2.2 Positive Flow

The landlord reviews and approves the transfer request.

**Response:** The system updates the unit assignments, adjusts lease records, and notifies the tenant of the approved transfer.

#### 16.2.3 Negative Flow

The tenant requests a transfer to an already-occupied unit.

**Response:** The system prevents the request and indicates the unit is unavailable.

### 16.3 Functional Requirements

**REQ-79:** The system shall allow tenants to view vacant units and request transfers.

**REQ-80:** The system shall notify the landlord when a transfer request is submitted.

**REQ-81:** The system shall allow landlords to review, approve, or reject transfer requests.

**REQ-82:** The system shall update unit assignments and lease records upon approved transfer.

---

## 17. Product Tours and Onboarding

### 17.1 Description and Priority

This feature provides interactive guided tours for new tenants to familiarize themselves with the platform's key modules, including Dashboard, Messages, Lease, and Community.

**Priority:** Low

### 17.2 Stimulus / Response

#### 17.2.1 Positive Flow

A new tenant logs in for the first time.

**Response:** The system presents a step-by-step onboarding tour highlighting key features and navigation paths.

#### 17.2.2 Positive Flow

The tenant completes a module tour.

**Response:** The system marks the tour as completed and does not show it again.

#### 17.2.3 Negative Flow

The tenant skips or dismisses the tour.

**Response:** The system hides the tour but allows the tenant to replay it later from the settings or help menu.

### 17.3 Functional Requirements

**REQ-83:** The system shall provide interactive guided tours for Dashboard, Messages, Lease, and Community modules.

**REQ-84:** The system shall display tours on first-time login for new tenants.

**REQ-85:** The system shall allow users to skip, dismiss, or replay tours.

**REQ-86:** The system shall track completed tours per user and suppress completed tours on subsequent visits.

---

## 18. Landlord Two-Factor Authentication (2FA)

### 18.1 Description and Priority

This feature provides an additional layer of security for landlord accounts through email-based two-factor authentication using Gmail integration.

**Priority:** Medium

### 18.2 Stimulus / Response

#### 18.2.1 Positive Flow

The landlord enables 2FA in account settings.

**Response:** The system generates a one-time password (OTP), sends it to the landlord's verified email via Gmail SMTP, and stores encrypted 2FA settings.

#### 18.2.2 Positive Flow

The landlord logs in with 2FA enabled and provides a valid OTP.

**Response:** The system verifies the OTP and grants access.

#### 18.2.3 Negative Flow

An invalid or expired OTP is provided.

**Response:** The system denies access and displays an error message.

### 18.3 Functional Requirements

**REQ-87:** The system shall allow landlords to enable or disable 2FA in account settings.

**REQ-88:** The system shall generate and send OTP codes via Gmail SMTP integration.

**REQ-89:** The system shall verify OTP codes at login when 2FA is enabled.

**REQ-90:** The system shall store 2FA settings and Gmail tokens securely.

---

## 19. Amenity Bookings

### 19.1 Description and Priority

This feature allows tenants to view and book property amenities through the tenant portal.

**Priority:** Low

### 19.2 Stimulus / Response

#### 19.2.1 Positive Flow

The tenant browses available amenities and books a time slot.

**Response:** The system records the booking and updates availability.

#### 19.2.2 Negative Flow

The tenant attempts to book an amenity during an already-booked time slot.

**Response:** The system shows the conflict and suggests alternative available slots.

### 19.3 Functional Requirements

**REQ-91:** The system shall display property amenities with availability information.

**REQ-92:** The system shall allow tenants to book amenity time slots.

**REQ-93:** The system shall prevent double-booking of the same amenity during overlapping time slots.

**REQ-94:** The system shall persist amenity booking data to the backend.

---

## 20. Landlord Calendar and Event Management

### 20.1 Description and Priority

This feature provides landlords with a calendar view for managing property-related events, tasks, and schedules.

**Priority:** Low

### 20.2 Stimulus / Response

#### 20.2.1 Positive Flow

The landlord opens the calendar page.

**Response:** The system displays a monthly calendar with events and tasks.

#### 20.2.2 Positive Flow

The landlord applies event type filters.

**Response:** The system filters the calendar to show only the selected event categories.

#### 20.2.3 Negative Flow

Calendar data cannot be loaded.

**Response:** The system shows an empty or error state.

### 20.3 Functional Requirements

**REQ-95:** The system shall provide a monthly calendar view for landlords.

**REQ-96:** The system shall support navigation between months (previous, next, today).

**REQ-97:** The system shall filter events by type/category.

---

## 21. Inquiry Management

### 21.1 Description and Priority

This feature allows landlords to manage and respond to tenant inquiries through a dedicated dashboard with action tracking.

**Priority:** Low

### 21.2 Stimulus / Response

#### 21.2.1 Positive Flow

The landlord views recent inquiries.

**Response:** The system displays a list of recent inquiries with status and action options.

#### 21.2.2 Positive Flow

The landlord takes action on an inquiry.

**Response:** The system records the action and updates the inquiry status.

### 21.3 Functional Requirements

**REQ-98:** The system shall display recent inquiries on the landlord dashboard.

**REQ-99:** The system shall allow landlords to take actions on inquiries (resolve, escalate, respond).

**REQ-100:** The system shall track inquiry status and action history.

---

## 22. Application Payments

### 22.1 Description and Priority

This feature handles secure payment collection during the tenant application process through tokenized payment links.

**Priority:** Medium

### 22.2 Stimulus / Response

#### 22.2.1 Positive Flow

An applicant accesses a payment link for their application.

**Response:** The system displays the payment details and processes the payment.

#### 22.2.2 Negative Flow

An invalid or expired payment token is used.

**Response:** The system rejects the request with an appropriate error message.

### 22.3 Functional Requirements

**REQ-101:** The system shall generate tokenized payment links for application-related payments.

**REQ-102:** The system shall validate payment tokens before processing.

**REQ-103:** The system shall record payment transactions against the associated application record.
