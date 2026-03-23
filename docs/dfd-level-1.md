# iReside Level 1 DFD (Gane and Sarson)

This Level 1 DFD decomposes the iReside system into its main business processes based on the current application structure and database schema.

Note: Mermaid does not natively support every Gane and Sarson symbol, so this uses a close visual approximation:
- External entities: rectangles
- Processes: rounded rectangles with `1.0`, `2.0`, etc.
- Data stores: labeled store nodes `D1`, `D2`, etc.

```mermaid
flowchart LR
    %% External Entities
    T[Tenant]
    L[Landlord]
    A[Admin / Verifier]
    M[Map / Location Service]
    AI[Groq AI Service]

    %% Processes - All 12 from detailed DFD
    P1([1.0 User Reg & Auth])
    P2([2.0 Property & Unit Mgmt])
    P3([3.0 Listing Mgmt])
    P4([4.0 Application Processing])
    P5([5.0 Lease Mgmt])
    P6([6.0 Payment Processing])
    P7([7.0 Maintenance Mgmt])
    P8([8.0 Messaging System])
    P9([9.0 Notification System])
    P10([10.0 IRIS AI Chat])
    P11([11.0 Statistics & Reporting])
    P12([12.0 Review Mgmt])

    %% Data Stores - All 17 from detailed DFD
    D1[(D1 Profiles)]
    D2[(D2 Properties)]
    D3[(D3 Units)]
    D4[(D4 Listings)]
    D5[(D5 Applications)]
    D6[(D6 Leases)]
    D7[(D7 Payments)]
    D8[(D8 Maintenance Req.)]
    D9[(D9 Messages)]
    D10[(D10 Notifications)]
    D11[(D11 IRIS Chat Hist.)]
    D12[(D12 Reviews)]
    D13[(D13 Landlord Verif.)]
    D14[(D14 Geo Locations)]
    D15[(D15 Saved Properties)]
    D16[(D16 Move-Out Req.)]
    D17[(D17 Statistics Exp.)]

    %% === Process 1: User Reg & Auth ===
    T -->|Registration & Login| P1
    L -->|Registration & Login| P1
    P1 -->|Account Status, Session| T
    P1 -->|Account Status, Session| L
    P1 <--> D1
    P1 <--> D13
    P1 -->|Verification Result| L
    A -->|Verification Decision| P1

    %% === Process 2: Property & Unit Mgmt ===
    L -->|Property/Unit Details| P2
    A -->|Verification Documents| P2
    P2 -->|Property/Unit Overview| L
    P2 <--> D2
    P2 <--> D3
    P2 <--> D14
    P2 -->|Documents for Review| A

    %% === Process 3: Listing Mgmt ===
    L -->|Listing Details| P3
    P3 -->|Property List, Map Results| T
    P3 <--> D2
    P3 <--> D3
    P3 <--> D4
    T -->|Search & Save Action| P3
    M -->|Geocoding Results| P3
    P3 <--> D15

    %% === Process 4: Application Processing ===
    T -->|Rental Application| P4
    L -->|Application Review| P4
    P4 -->|Status Update (App)| T
    P4 -->|Application List| L
    P4 <--> D2
    P4 <--> D5
    P4 -->|Trigger App Event| P9
    P4 <--> D4

    %% === Process 5: Lease Mgmt ===
    L -->|Lease Terms & Signature| P5
    T -->|Tenant Signature & Move-Out| P5
    P5 -->|Lease Agreement (Tenant)| T
    P5 -->|Lease Agreement (Landlord)| L
    P5 <--> D6
    P5 <--> D16
    P5 <--> D3
    P5 -->|Trigger Lease Event| P9

    %% === Process 6: Payment Processing ===
    L -->|Invoice Creation| P6
    T -->|Proof of Payment| P6
    P6 -->|Payment Instructions & QR| T
    P6 -->|Payment Receipt & Status| T
    P6 -->|Proof of Payment (Review)| L
    P6 <--> D7
    P6 -->|Trigger Payment Event| P9
    L -->|Payment Confirmation| P6

    %% === Process 7: Maintenance Mgmt ===
    T -->|Maintenance Request| P7
    L -->|Maintenance Update| P7
    P7 -->|Status Update (Tenant)| T
    P7 -->|Request List| L
    P7 <--> D8
    P7 -->|Trigger Maintenance Event| P9

    %% === Process 8: Messaging System ===
    T -->|Message| P8
    L -->|Message| P8
    P8 -->|Messages to Tenant| T
    P8 -->|Messages to Landlord| L
    P8 <--> D9
    P8 -->|Trigger Message Event| P9
    P8 -->|Message Content for Moderation| AI
    AI -->|Moderation Decision| P8

    %% === Process 9: Notification System ===
    P4 -->|Trigger App Event| P9
    P5 -->|Trigger Lease Event| P9
    P6 -->|Trigger Payment Event| P9
    P7 -->|Trigger Maintenance Event| P9
    P8 -->|Trigger Message Event| P9
    P9 <--> D10
    P9 -->|Alerts (Tenant)| T
    P9 -->|Alerts (Landlord)| L

    %% === Process 10: IRIS AI Chat ===
    T -->|Chat Query| P10
    L -->|Chat Query| P10
    P10 -->|Response (Tenant)| T
    P10 -->|Response (Landlord)| L
    P10 <--> D11
    P10 -->|Context + Query| AI
    AI -->|AI Response| P10

    %% === Process 11: Statistics & Reporting ===
    D7 -->|Payment History| P11
    D6 -->|Lease History| P11
    D5 -->|App Metrics| P11
    D8 -->|Maintenance Metrics| P11
    P11 -->|Dashboard & Reports| L
    P11 -->|Export Request| L
    P11 <--> D17
    L -->|AI Insights (from AI)| P11

    %% === Process 12: Review Mgmt ===
    T -->|Review Submission| P12
    P12 -->|Review Summary| L
    P12 <--> D12
    P12 <--> D6
```

## Process Decomposition

### 1.0 User Reg & Auth
- Handles registration, login, logout, and role-based profile access.
- Integrates with Supabase Auth for authentication tokens.
- Manages landlord verification workflows via D13.

### 2.0 Property & Unit Mgmt
- Handles landlord property onboarding, unit setup, and geo-location mapping.
- Uses D2 (Properties), D3 (Units), D14 (Geo Locations).
-Triggers admin verification workflow.

### 3.0 Listing Mgmt
- Handles rental browsing, map-based search, filters, and bookmarked properties.
- Uses D2/D3 for property data, D4 for listings, D15 for saved properties.
- Integrates with Map/Location service for geocoding.

### 4.0 Application Processing
- Handles tenant applications, landlord review workflows, and application status tracking.
- Uses D5 (Applications), cross-references D2/D4 for property data.
- Triggers notification events on status changes.

### 5.0 Lease Mgmt
- Handles lease creation, digital signing, move-out requests, and occupancy updates.
- Uses D6 (Leases), D16 (Move-Out Requests), updates D3 (Units) occupancy.
- Triggers notification events on lease milestones.

### 6.0 Payment Processing
- Handles rent/bill records, payment submission, landlord confirmation, and receipt generation.
- Uses D7 (Payments), provides payment instructions and receipts.
- Triggers payment-related notifications.

### 7.0 Maintenance Mgmt
- Handles maintenance requests, status tracking, and landlord updates.
- Uses D8 (Maintenance Requests), provides real-time status to both parties.
- Triggers maintenance notifications.

### 8.0 Messaging System
- Handles real-time messaging between tenants and landlords.
- Uses D9 (Messages), supports media/file sharing.
- Triggers message notifications and moderates content via AI.

### 9.0 Notification System
- Centralized notification dispatcher for all system events.
- Uses D10 (Notifications), delivers alerts to both tenants and landlords.
- Receives triggers from P4, P5, P6, P7, P8.

### 10.0 IRIS AI Chat
- Provides AI-assisted support and conversational interface.
- Uses D11 (IRIS Chat History), integrates with external Groq AI (E5).
- Available to both tenants (support) and landlords (analytics queries).

### 11.0 Statistics & Reporting
- Generates portfolio performance reports and analytics dashboards.
- Aggregates data from D5, D6, D7, D8, D17.
- Exports PDF/CSV reports, maintains export history.

### 12.0 Review Mgmt
- Handles tenant review submissions and lease validation.
- Uses D12 (Reviews), cross-references D6 (Leases) for validation.
- Provides review summaries to landlords.

## Data Store Key

- `D1` User Profiles
- `D2` Properties
- `D3` Units
- `D4` Listings
- `D5` Applications
- `D6` Leases
- `D7` Payments
- `D8` Maintenance Requests
- `D9` Messages
- `D10` Notifications
- `D11` IRIS Chat History
- `D12` Reviews
- `D13` Landlord Verification Records
- `D14` Geo Locations
- `D15` Saved Properties
- `D16` Move-Out Requests
- `D17` Statistics Exports

## Cross-Cutting Concerns

### Security & Access Control
- Role-based access enforced through Supabase Auth (E4) and RLS policies.
- All processes respect user roles: Tenant, Landlord, Admin.

### AI Integration
- IRIS AI (E5) supports both tenant assistance (P10) and landlord analytics (P11).
- Real-time message moderation integrated into messaging flow (P8 → E5 → P8).

### Real-Time Updates
- Supabase Realtime powers instant updates across all user-facing processes.
- Notification system (P9) coordinates event-driven alerts.
