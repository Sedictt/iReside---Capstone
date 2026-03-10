# iReside Level 1 DFD (Gane and Sarson)

This Level 1 DFD decomposes the iReside system into its main business processes based on the current application structure and database schema.

Note: Mermaid does not natively support every Gane and Sarson symbol, so this uses a close visual approximation:
- External entities: rectangles
- Processes: rounded rectangles with `1.0`, `2.0`, etc.
- Data stores: labeled store nodes `D1`, `D2`, etc.

```mermaid
flowchart LR
    T[Tenant]
    L[Landlord]
    A[Admin / Verifier]
    M[Map / Location Service]

    P1([1.0 Account and Profile Management])
    P2([2.0 Property and Unit Management])
    P3([3.0 Search and Saved Listings Management])
    P4([4.0 Applications and Lease Management])
    P5([5.0 Payments and Billing Management])
    P6([6.0 Maintenance, Messaging, and Notifications])

    D1[(D1 User Profiles)]
    D2[(D2 Properties and Units)]
    D3[(D3 Rental Applications)]
    D4[(D4 Leases and Move-Out Requests)]
    D5[(D5 Payments and Payment Items)]
    D6[(D6 Maintenance Requests)]
    D7[(D7 Conversations and Messages)]
    D8[(D8 Notifications)]
    D9[(D9 Saved Properties)]

    T -->|sign up, sign in, profile updates| P1
    L -->|sign up, sign in, profile updates| P1
    P1 -->|account status, session, profile data| T
    P1 -->|account status, session, profile data| L
    P1 <--> D1

    L -->|property details, unit details, media, permits| P2
    A -->|verification decision| P2
    P2 -->|property status, listing records| L
    P2 <--> D2
    P2 -->|documents for review| A

    T -->|search filters, saved-property requests| P3
    M -->|geocoded location results| P3
    P3 -->|property list, map results, saved list| T
    P3 <--> D2
    P3 <--> D9

    T -->|rental application, lease signing, move-out request| P4
    L -->|application review, lease creation, lease approval| P4
    P4 -->|application status, lease copy, move-out status| T
    P4 -->|application records, signed lease status| L
    P4 <--> D2
    P4 <--> D3
    P4 <--> D4
    P4 <--> D8

    T -->|payment details, proof of payment| P5
    L -->|billing setup, payment confirmation| P5
    P5 -->|invoice, receipt, payment status| T
    P5 -->|payment summary, collection status| L
    P5 <--> D4
    P5 <--> D5
    P5 <--> D8

    T -->|maintenance request, chat messages| P6
    L -->|maintenance update, chat replies, announcements| P6
    P6 -->|request status, messages, alerts| T
    P6 -->|request details, messages, alerts| L
    P6 <--> D6
    P6 <--> D7
    P6 <--> D8
```

## Process Decomposition

### 1.0 Account and Profile Management
- Handles registration, login, logout, and role-based profile access.
- Reads and updates `profiles`.

### 2.0 Property and Unit Management
- Handles landlord property onboarding, unit setup, media upload, and verification workflow.
- Uses `properties` and `units`.

### 3.0 Search and Saved Listings Management
- Handles rental browsing, map-based search, filters, and bookmarked properties.
- Uses `properties`, `units`, and `saved_properties`.

### 4.0 Applications and Lease Management
- Handles tenant applications, landlord review, lease creation, lease signing, and move-out workflow.
- Uses `applications`, `leases`, and `move_out_requests`.

### 5.0 Payments and Billing Management
- Handles rent/bill records, payment submission, landlord confirmation, and receipt/invoice status.
- Uses `payments` and `payment_items`.

### 6.0 Maintenance, Messaging, and Notifications
- Handles maintenance requests, tenant-landlord conversations, system messages, and alerts.
- Uses `maintenance_requests`, `conversations`, `messages`, and `notifications`.

## Data Store Key

- `D1` User Profiles
- `D2` Properties and Units
- `D3` Rental Applications
- `D4` Leases and Move-Out Requests
- `D5` Payments and Payment Items
- `D6` Maintenance Requests
- `D7` Conversations and Messages
- `D8` Notifications
- `D9` Saved Properties
