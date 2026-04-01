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



## 9. Landlord Property and Unit Management

### 9.1 Description and Priority

This feature allows landlords to create and manage properties and units.

**Priority:** High

### 9.2 Stimulus / Response

#### 9.2.1 Positive Flow

The landlord creates or updates a property or unit.

**Response:** The system saves and updates the records.

#### 9.2.2 Negative Flow

Invalid or incomplete data is submitted.

**Response:** The system rejects the update and identifies errors.

### 9.3 Functional Requirements

**REQ-33:** The system shall allow landlords to create and edit properties and units.

**REQ-34:** The system shall support pricing, deposits, and amenities.

**REQ-35:** The system shall allow media uploads.

**REQ-36:** The system shall persist structural changes.



## 10. Administration and Governance

### 10.1 Description and Priority

This feature allows administrators to manage platform governance.

**Priority:** Medium

### 10.2 Stimulus / Response

#### 10.2.1 Positive Flow

The administrator accesses the dashboard.

**Response:** The system displays metrics and controls.

#### 10.2.2 Negative Flow

Unauthorized access is attempted.

**Response:** The system blocks access.

### 10.3 Functional Requirements

**REQ-37:** The system shall display platform metrics.

**REQ-38:** The system shall allow review of landlord registrations.

**REQ-39:** The system shall store admin notes and decisions.

**REQ-40:** The system shall restrict admin features to authorized users.



## 11. Security and Data Protection

### 11.1 Description and Priority

Ensures data privacy and protection.

**Priority:** High

### 11.2 Stimulus / Response

#### 11.2.1 Positive Flow

Authenticated request is processed.

**Response:** Access control is enforced.

#### 11.2.2 Negative Flow

Unauthorized request is detected.

**Response:** Request is rejected.

### 11.3 Functional Requirements

**REQ-41:** The system shall enforce role-based access control.

**REQ-42:** The system shall prevent unauthorized data access.

**REQ-43:** The system shall maintain secure sign-out.

**REQ-44:** The system shall protect sensitive data.



## 12. Landlord Analytics, Reporting, and Auditing

### 12.1 Description and Priority

This feature provides landlords with a comprehensive view of portfolio performance through real-time analytics, AI-driven insights, and formal reporting tools. It supports decision-making and auditability.

**Priority:** Medium

### 12.2 Stimulus / Response

#### 12.2.1 Positive Flow

The landlord views analytics or generates a report.

**Response:** The system displays KPIs, AI insights, and generates downloadable reports while logging activity.

#### 12.2.2 Negative Flow

AI or report generation fails.

**Response:** The system provides fallback insights or error messages.

### 12.3 Functional Requirements

**REQ-45:** The system shall display KPI summaries such as income, occupancy, delinquency, and maintenance volume.

**REQ-46:** The system shall generate AI-driven insights and recommendations.

**REQ-47:** The system shall provide fallback insights when AI is unavailable.

**REQ-48:** The system shall generate downloadable reports (CSV/PDF).

**REQ-49:** The system shall log report activity and maintain audit snapshots.

## 13. Enhanced Lease Signing Workflow

### 13.1 Description and Priority

This feature provides a flexible lease signing workflow supporting both in-person (dual) and remote (async) signing modes with tenant-first signing order, secure JWT-based signing links, comprehensive audit trails, and wizard state persistence for external tool access.

**Priority:** High

### 13.2 Stimulus / Response

#### 13.2.1 Positive Flow

The landlord selects a signing mode and completes the signing workflow (in-person with both parties present, or remote by sending a signing link to the tenant).

**Response:** The system captures signatures in the correct order (tenant-first, then landlord), updates lease status through a state machine, logs all signing events for audit, and preserves wizard state when accessing external management tools.

#### 13.2.2 Negative Flow

Invalid signing mode selection, expired signing links, concurrent signature attempts, or unauthorized access to audit trails.

**Response:** The system prevents invalid operations, displays appropriate error messages, and maintains data integrity through validation and locking mechanisms.

### 13.3 Functional Requirements

**REQ-50:** The system shall support dual signing modes (in-person and remote) with tenant-first signing order enforcement.

**REQ-51:** The system shall generate secure JWT-based signing links with 30-day expiration for remote tenant signing.

**REQ-52:** The system shall maintain a comprehensive audit trail for all signing events with timestamps, IP addresses, and user agents.

**REQ-53:** The system shall preserve wizard state in localStorage when navigating to external management tools (Contract Templates, Property Policies, Amenities).

**REQ-54:** The system shall implement a lease status state machine with validated transitions (draft → pending_tenant_signature → pending_landlord_signature → active).

**REQ-55:** The system shall validate signature data format, size, and dimensions before storage and prevent concurrent signing conflicts.
