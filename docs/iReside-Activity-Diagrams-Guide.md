# iReside — System Process Activity Diagrams Specification
**Standard:** UML 2.5 Activity Diagram Standards  
**Modeling Scope:** 10 Dedicated Activity Diagrams (Processes P1.0 to P10.0)  
**Partitioning:** Role-Based Swimlanes (*Landlord*, *Tenant / Applicant*, *iReside System*)  
**Structural Rules:** Strictly **One Terminal Activity Final Node** per diagram; All core UML symbols present (Initial, Action, Decision, Merge, Fork, Join, Final, Swimlanes)  
**Source of Truth:** Live Verified Codebase (`src/`, `source-of-truth-db.sql`) & DFD Level 1  
**Associated Draw.io File:** [`docs/iReside-activity-diagrams.drawio`](./iReside-activity-diagrams.drawio)

---

## 1. Executive Summary & Complete UML Symbol Catalog

This document establishes the official **UML 2.5 Activity Diagrams** for all 10 core operational processes of the **iReside Turnkey Residential Management System**. Every process is modeled as an independent, well-formed activity diagram with strict adherence to the **Single Final Node Invariant** and **Full UML Symbol Coverage**.

### 1.1 Complete UML Activity Diagram Symbols Present in All 10 Models

| UML Symbol | Graphic Representation | Notation Standard | Function in iReside Activity Models |
| :--- | :--- | :--- | :--- |
| **Initial Node** | Solid filled circle (`●`) | `((●))` | Marks the initial trigger and inception point of the process. |
| **Action Node** | Rectangle with rounded corners | `[Action Text]` | Discrete, atomic execution step labeled with an active verb phrase (e.g., *Validate Credentials*, *Generate OR*). |
| **Control Flow** | Directed solid arrow (`→`) | `-->` | Defines sequential progression and transfer of control between activity nodes. |
| **Decision Node** | Diamond shape (`◇`) with $\ge 2$ exits | `{Condition?}` | Evaluates a condition; exit edges carry mutually exclusive bracketed guards (e.g., `[Valid]`, `[Invalid]`). |
| **Merge Node** | Diamond shape (`◇`) with $\ge 2$ entries | `{ }` | Unifies multiple alternate control branches into a single flow without concurrency synchronization. |
| **Fork Node** | Thick solid synchronization bar | `=== FORK ===` | Splits a single control path into two or more concurrent, parallel execution threads. |
| **Join Node** | Thick solid synchronization bar | `=== JOIN ===` | Synchronizes multiple parallel execution threads back into a single subsequent path. |
| **Activity Final Node** | Concentric bullseye circle (`◉`) | `(((◉)))` | **Strictly ONE per diagram.** Designates the universal terminal completion of the process. |
| **Swimlanes (Partitions)** | Partition columns | `subgraph LANE` | Organizes nodes by responsible role (*Landlord*, *Tenant / Applicant*, *iReside System / Database*). |

### 1.2 Architectural Invariants & Excluded Retired Features

In strict accordance with project architectural constraints:
1. **Strict Single Final Node per Process:** Every execution path—whether an approved flow, rejected flow, timeout, cancellation, or role branch—merges through formal UML Merge Nodes into **exactly one terminal Activity Final Node** (`◉`).
2. **Strict Landlord & Tenant Model (No Admin):** Operations are consolidated within the sovereign Landlord workspace. The legacy Super Admin portal (`/admin/*`), admin-only consultation tools, and external LGU scrapers are retired and completely excluded.
3. **Turnkey & Private Invite Onboarding:** Public self-serve landlord registration (`/signup`) is decommissioned; landlord accounts are pre-provisioned via the turnkey setup wizard (`/setup`). Tenants enter exclusively through private tokenized invite links (`/apply/[token]`) or manual walk-in entry; open public registration is excluded.
4. **Manual Peer-to-Peer Financial Settlement:** Automated third-party payment gateways (Stripe, PayMongo, automated webhooks) are decommissioned in favor of direct Philippine GCash QR screenshot proofs and in-person cash collections verified directly by the Landlord with digital Official Receipts (OR).
5. **Local Cryptographic Document Engine:** Client-side HTML5 biometric canvas signing and SHA-256 sealed contract PDFs.

---

## 2. Process Index & DFD Level-1 Cross-Reference

| Process ID | Process Name | Primary DFD Data Store | External Actors Involved | Key Database Tables | Single End Point Name |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1.0** | **Authenticate & Auth** | D1: User & Account | Landlord, Tenant | `profiles`, `user_security_settings`, `sessions` | User Session & Workspace Initialized |
| **P2.0** | **Manage Properties** | D2: Property & Unit | Landlord | `properties`, `units`, `property_environment_policies` | Property Configuration Saved |
| **P3.0** | **Unit Map & Layout** | D3: Blueprint & Layout, D2 | Landlord | `property_floor_configs`, `unit_map_positions`, `units` | Spatial Layout Finalized |
| **P4.0** | **Process Intake** | D4: Rental Application, D1, D2 | Applicant, Landlord | `tenant_intake_invites`, `applications`, `profiles` | Tenant Intake Lifecycle Concluded |
| **P5.0** | **Manage Leases** | D5: Lease & Contract, D2 | Tenant, Landlord | `leases`, `lease_signing_audit`, `renewal_requests`, `move_out_requests` | Lease Contract Lifecycle Finalized |
| **P6.0** | **Process Billing** | D6: Billing & Financial | Landlord, Tenant | `payments`, `payment_items`, `utility_readings`, `payment_receipts` | Billing & Payment Lifecycle Concluded |
| **P7.0** | **Stage Maintenance** | D7: Maintenance & Incident, D6 | Tenant, Landlord | `maintenance_requests`, `expenses` | Maintenance Ticket Concluded |
| **P8.0** | **Facilitate Messaging** | D8: Communication & Messaging | Tenant, Landlord | `conversations`, `messages`, `message_moderation_banned_terms` | Message Exchange Concluded |
| **P9.0** | **Manage Community** | D9: Community & Amenity | Tenant, Landlord | `community_posts`, `community_comments`, `amenities`, `amenity_bookings` | Community Interaction Completed |
| **P10.0** | **Dashboard & iRis AI** | D1, D2, D4, D5, D6 | Landlord, Tenant | `iris_chat_messages`, `landlord_statistics_exports` | Dashboard Oversight Concluded |

---

## 3. Dedicated UML Activity Diagrams (Single End Point & All Symbols)

---

### Process 1.0: Authenticate & Auth (Authentication & Account Management)

#### Context & Purpose
Governs user identity verification, Supabase Auth credential resolution, two-factor authentication (2FA) via time-sensitive OTP, parallel JWT issuance and session telemetry logging (Fork/Join), role-based portal routing, and convergence into a single terminal state.

* **Preconditions:** User possesses registered credentials or pre-provisioned landlord deployment access.
* **Postconditions:** Authenticated session established; user portal initialized; terminated at a single end node.
* **Data Stores Touched:** `D1 (User & Account)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_USER ["USER (Landlord or Tenant)"]
        S1((●)):::startEnd
        A1_NAV["Navigate to /login or App Entry"]:::action
        A1_INPUT["Enter Email & Password"]:::action
        A1_FAIL["View Error Alert & Retry"]:::action
        A1_OTP["Enter 6-Digit OTP Code"]:::action
        A1_SETUP["Mount /setup Wizard"]:::action
        A1_LANDLORD["Mount /landlord/dashboard"]:::action
        A1_TENANT["Mount /tenant/dashboard"]:::action
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A1_VAL["Validate Credentials with Auth API"]:::action
        D1_CRED{"Valid Credentials?"}:::decision
        A1_CHECK2FA["Check user_security_settings"]:::action
        D1_2FA{"2FA Enabled?"}:::decision
        A1_GENOTP["Generate OTP & Send Email/SMS"]:::action
        D1_OTP{"Valid OTP?"}:::decision
        M1_AUTH{" "}:::decision
        A1_ROLE["Fetch Profile & Account Role (D1)"]:::action
        F1_AUTH["═══ FORK: Parallel Session Logging ═══"]:::barStyle
        A1_ISSUE_JWT["Issue Cryptographic JWT Session Cookie"]:::action
        A1_LOG_SESS["Insert Session Record into sessions (D1)"]:::action
        J1_AUTH["═══ JOIN: Synchronize Session State ═══"]:::barStyle
        D1_ROLE{"Role?"}:::decision
        A1_CHECKSETUP["Check Setup State (ireside_setup_completed)"]:::action
        D1_SETUP{"Setup Done?"}:::decision
        M1_FINAL{" "}:::decision
        E1(((◉))):::startEnd
    end

    subgraph LANE_DB ["DATABASE & AUTH SERVICE (D1)"]
        A1_SQL_USER["Query auth.users & profiles"]:::action
    end

    S1 --> A1_NAV
    A1_NAV --> A1_INPUT
    A1_INPUT --> A1_VAL
    A1_VAL --> A1_SQL_USER
    A1_SQL_USER --> D1_CRED
    D1_CRED -- "[Invalid Credentials]" --> A1_FAIL
    A1_FAIL --> A1_INPUT
    D1_CRED -- "[Valid Credentials]" --> A1_CHECK2FA
    A1_CHECK2FA --> D1_2FA
    D1_2FA -- "[2FA Enabled]" --> A1_GENOTP
    A1_GENOTP --> A1_OTP
    A1_OTP --> D1_OTP
    D1_OTP -- "[Invalid/Expired OTP]" --> A1_OTP
    D1_OTP -- "[OTP Verified]" --> M1_AUTH
    D1_2FA -- "[2FA Disabled]" --> M1_AUTH
    M1_AUTH --> A1_ROLE
    A1_ROLE --> F1_AUTH
    F1_AUTH --> A1_ISSUE_JWT
    F1_AUTH --> A1_LOG_SESS
    A1_ISSUE_JWT --> J1_AUTH
    A1_LOG_SESS --> J1_AUTH
    J1_AUTH --> D1_ROLE
    D1_ROLE -- "[Role = Landlord]" --> A1_CHECKSETUP
    A1_CHECKSETUP --> D1_SETUP
    D1_SETUP -- "[Setup Incomplete]" --> A1_SETUP
    D1_SETUP -- "[Setup Complete]" --> A1_LANDLORD
    A1_SETUP --> M1_FINAL
    A1_LANDLORD --> M1_FINAL
    D1_ROLE -- "[Role = Tenant]" --> A1_TENANT
    A1_TENANT --> M1_FINAL
    M1_FINAL --> E1
```

---

### Process 2.0: Manage Properties (Property & Unit Management)

#### Context & Purpose
Handles multi-property registration, rentable unit inventory creation, environmental house rules, parallel database persistence and cache invalidation (Fork/Join), terminating in a single final node.

* **Preconditions:** Landlord is authenticated with active workspace permissions.
* **Postconditions:** Property metadata, units, and environmental rules committed to D2; single end point reached.
* **Data Stores Touched:** `D2 (Property & Unit Data Store)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_LANDLORD ["LANDLORD"]
        S2((●)):::startEnd
        A2_OPEN["Open Property Manager (/landlord/properties)"]:::action
        D2_MODE{"Configuration Action?"}:::decision
        A2_PROP["Enter Property Profile & Branding"]:::action
        A2_UNIT["Input Unit Number, Floor & Rent"]:::action
        A2_RULES["Set Curfew, Quiet Hours & House Rules"]:::action
        M2_INPUTS{" "}:::decision
        A2_ERR["View Validation Feedback & Correct"]:::action
        A2_VIEW["View Updated Portfolio & Unit Roster"]:::action
        E2(((◉))):::startEnd
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A2_VAL["Validate Zod Schema Constraints & Limits"]:::action
        D2_VAL{"Valid Input?"}:::decision
        F2_PROP["═══ FORK: Parallel Persistence & Cache ═══"]:::barStyle
        A2_CACHE["Invalidate PropertyContext State Cache"]:::action
        J2_PROP["═══ JOIN: Synchronize Property State ═══"]:::barStyle
    end

    subgraph LANE_DB ["DATABASE (D2)"]
        A2_SQL["Persist in properties, units, & policies"]:::action
    end

    S2 --> A2_OPEN
    A2_OPEN --> D2_MODE
    D2_MODE -- "[Add/Edit Property]" --> A2_PROP
    D2_MODE -- "[Add/Edit Unit]" --> A2_UNIT
    D2_MODE -- "[House Rules]" --> A2_RULES
    A2_PROP --> M2_INPUTS
    A2_UNIT --> M2_INPUTS
    A2_RULES --> M2_INPUTS
    M2_INPUTS --> A2_VAL
    A2_VAL --> D2_VAL
    D2_VAL -- "[Validation Failed]" --> A2_ERR
    A2_ERR --> D2_MODE
    D2_VAL -- "[Valid Data]" --> F2_PROP
    F2_PROP --> A2_SQL
    F2_PROP --> A2_CACHE
    A2_SQL --> J2_PROP
    A2_CACHE --> J2_PROP
    J2_PROP --> A2_VIEW
    A2_VIEW --> E2
```

---

### Process 3.0: Unit Map & Layout (Interactive Spatial Blueprint)

#### Context & Purpose
Facilitates building floor level configuration, 2D floorplan grid rendering, collision detection, parallel coordinate batch upsert and event signaling (Fork/Join), terminating in a single final node.

* **Preconditions:** Properties and units exist; landlord launches the floor planner.
* **Postconditions:** Bounding box coordinates and floor configs saved to D3; single end point reached.
* **Data Stores Touched:** `D3 (Blueprint & Layout)`, `D2 (Property & Unit)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_LANDLORD ["LANDLORD"]
        S3((●)):::startEnd
        A3_OPEN["Open 2D Visual Unit Map (/landlord/unit-map)"]:::action
        D3_ACTION{"Canvas Tool?"}:::decision
        A3_ADD_FLR["Add/Configure Floor Level (Key & Title)"]:::action
        A3_DRAG["Drag & Drop Unit Card on Grid Canvas"]:::action
        A3_WARN["Observe Collision Rebound Alert"]:::action
        M3_STAGE{" "}:::decision
        A3_SAVE["Click 'Save Floor Plan' Action Button"]:::action
        A3_CHOICE["Choose: Next Step, Explore, or Dashboard"]:::action
        E3(((◉))):::startEnd
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A3_LOAD["Query Floor Levels & Spatial Positions"]:::action
        A3_RENDER["Render 2D Grid with Status Pins (Vacant/Occupied)"]:::action
        A3_DETECT["Evaluate Grid Snapping & Collision Bounds"]:::action
        D3_COL{"Collision Overlap?"}:::decision
        A3_UPDATE_STAGE["Update Reactive Stage State (x, y, w, h)"]:::action
        F3_MAP["═══ FORK: Parallel Batch Save & Event ═══"]:::barStyle
        A3_EVENT["Dispatch unit-map-saved Window Event"]:::action
        J3_MAP["═══ JOIN: Synchronize Layout State ═══"]:::barStyle
    end

    subgraph LANE_DB ["DATABASE (D3 & D2)"]
        A3_SQL_LOAD["Read property_floor_configs & unit_map_positions"]:::action
        A3_SQL_SAVE["Batch Upsert unit_map_positions & floor_configs"]:::action
    end

    S3 --> A3_OPEN
    A3_OPEN --> A3_LOAD
    A3_LOAD --> A3_SQL_LOAD
    A3_SQL_LOAD --> A3_RENDER
    A3_RENDER --> D3_ACTION
    D3_ACTION -- "[Configure Floor]" --> A3_ADD_FLR
    D3_ACTION -- "[Position Unit]" --> A3_DRAG
    A3_DRAG --> A3_DETECT
    A3_DETECT --> D3_COL
    D3_COL -- "[Collision Detected]" --> A3_WARN
    A3_WARN --> A3_DRAG
    D3_COL -- "[Position Valid]" --> M3_STAGE
    A3_ADD_FLR --> M3_STAGE
    M3_STAGE --> A3_UPDATE_STAGE
    A3_UPDATE_STAGE --> A3_SAVE
    A3_SAVE --> F3_MAP
    F3_MAP --> A3_SQL_SAVE
    F3_MAP --> A3_EVENT
    A3_SQL_SAVE --> J3_MAP
    A3_EVENT --> J3_MAP
    J3_MAP --> A3_CHOICE
    A3_CHOICE --> E3
```

---

### Process 4.0: Process Intake (Tenant Application & Intake Management)

#### Context & Purpose
Handles prospective tenant entry via private tokenized invite links or offline walk-ins, applicant KYC submission, screening, decision processing (approval with parallel provisioning vs rejection), unified through a single merge node into one final node.

* **Preconditions:** Vacant unit designated; landlord initiates invitation or walk-in intake.
* **Postconditions:** Application evaluated; tenant account provisioned or rejection recorded; single end point reached.
* **Data Stores Touched:** `D4 (Rental Application & Intake)`, `D1 (User & Account)`, `D2 (Property & Unit)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_APPLICANT ["PROSPECTIVE APPLICANT"]
        A4_OPEN["Open Private /apply/[token] Link"]:::action
        A4_KYC["Fill Personal & KYC Form, Upload ID Documents"]:::action
        A4_SUBMIT["Submit Rental Application"]:::action
        A4_RECV_REJECT["Receive Rejection Alert"]:::action
        A4_RECV_CREDS["Receive Approval Notice & Account Credentials"]:::action
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A4_VAL_TOK["Verify Token Validity & Expiration"]:::action
        A4_STORE["Store Uploaded IDs in Storage Bucket"]:::action
        M4_APPS{" "}:::decision
        A4_PERSIST_APP["Insert applications / landlord_applications (D4)"]:::action
        A4_NOTIFY_LL["Dispatch Pending Application Notification (D10)"]:::action
        A4_NOTIFY_REJ["Update D4 Status = rejected"]:::action
        F4_INTAKE["═══ FORK: Parallel Account & Unit Lock ═══"]:::barStyle
        A4_PROVISION["Auto-Provision profiles & Supabase Auth User (D1)"]:::action
        A4_HOLD_UNIT["Set units.status = pending_lease (D2)"]:::action
        J4_INTAKE["═══ JOIN: Synchronize Renter Onboarding ═══"]:::barStyle
        A4_TRIGGER_LEASE["Trigger Lease Drafting Workflow (P5.0)"]:::action
        M4_FINAL_INTAKE{" "}:::decision
        E4(((◉))):::startEnd
    end

    subgraph LANE_LANDLORD ["LANDLORD"]
        S4((●)):::startEnd
        D4_CHANNEL{"Intake Mode?"}:::decision
        A4_GEN_INVITE["Generate Private Tokenized Invite Link"]:::action
        A4_WALKIN["Enter Walk-in Lead via /landlord/applications"]:::action
        A4_REVIEW["Screen Applicant Dossier, KYC Proofs & Income"]:::action
        D4_DEC{"Review Decision?"}:::decision
        A4_DEC_REJ["Reject Application & Input Reason"]:::action
        A4_DEC_APP["Approve Application & Confirm Terms"]:::action
    end

    S4 --> D4_CHANNEL
    D4_CHANNEL -- "[Tokenized Link]" --> A4_GEN_INVITE
    D4_CHANNEL -- "[Walk-In Entry]" --> A4_WALKIN
    A4_GEN_INVITE --> A4_OPEN
    A4_OPEN --> A4_VAL_TOK
    A4_VAL_TOK --> A4_KYC
    A4_KYC --> A4_SUBMIT
    A4_SUBMIT --> A4_STORE
    A4_STORE --> M4_APPS
    A4_WALKIN --> M4_APPS
    M4_APPS --> A4_PERSIST_APP
    A4_PERSIST_APP --> A4_NOTIFY_LL
    A4_NOTIFY_LL --> A4_REVIEW
    A4_REVIEW --> D4_DEC
    D4_DEC -- "[Rejected]" --> A4_DEC_REJ
    A4_DEC_REJ --> A4_NOTIFY_REJ
    A4_NOTIFY_REJ --> A4_RECV_REJECT
    A4_RECV_REJECT --> M4_FINAL_INTAKE
    D4_DEC -- "[Approved]" --> A4_DEC_APP
    A4_DEC_APP --> F4_INTAKE
    F4_INTAKE --> A4_PROVISION
    F4_INTAKE --> A4_HOLD_UNIT
    A4_PROVISION --> J4_INTAKE
    A4_HOLD_UNIT --> J4_INTAKE
    J4_INTAKE --> A4_TRIGGER_LEASE
    A4_TRIGGER_LEASE --> A4_RECV_CREDS
    A4_RECV_CREDS --> M4_FINAL_INTAKE
    M4_FINAL_INTAKE --> E4
```

---

### Process 5.0: Manage Leases (Lease & Contract Lifecycle Management)

#### Context & Purpose
Oversees digital lease agreement generation, tenant HTML5 biometric canvas signing, landlord countersigning, parallel contract PDF compilation and unit occupancy update (Fork/Join), renewals, and move-outs, unifying into a single final node.

* **Preconditions:** Approved applicant or active tenant requesting lifecycle adjustment.
* **Postconditions:** Contract status updated in D5; unit occupancy state synchronized in D2; single end point reached.
* **Data Stores Touched:** `D5 (Lease & Contract)`, `D2 (Property & Unit)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_TENANT ["TENANT"]
        A5_SIGN_VIEW["Review Draft Contract (/tenant/sign-lease/[id])"]:::action
        A5_SIGN_DRAW["Draw Digital Signature on Biometric Canvas"]:::action
        A5_RECV_DOC["Download Countersigned Sealed Lease PDF"]:::action
        A5_REQ_REN["Submit Renewal Request (/tenant/lease)"]:::action
        A5_REQ_MOV["Submit 30-Day Move-Out Notice"]:::action
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        S5((●)):::startEnd
        D5_EVENT{"Lifecycle Action?"}:::decision
        A5_GEN_DRAFT["Generate Lease Draft with Payment Terms & Rules"]:::action
        A5_HASH["Record Audit Hash in lease_signing_audit (D5)"]:::action
        F5_LEASE["═══ FORK: Parallel PDF Sealing & Unit Occupancy ═══"]:::barStyle
        A5_SEAL["Merge Signatures & Compile SHA-256 PDF"]:::action
        A5_ACTIVATE["Set leases.status = active & units = occupied (D5, D2)"]:::action
        J5_LEASE["═══ JOIN: Synchronize Active Tenancy ═══"]:::barStyle
        A5_EXTEND["Extend Lease Period in leases & renewal_requests (D5)"]:::action
        A5_TERMINATE["Set leases.status = terminated & units = vacant (D5, D2)"]:::action
        M5_OUTCOMES{" "}:::decision
        A5_NOTIFY["Dispatch Notifications & Update Tenancy Records (D10)"]:::action
        E5(((◉))):::startEnd
    end

    subgraph LANE_LANDLORD ["LANDLORD"]
        A5_COUNTERSIGN["Review Tenant Signature & Countersign"]:::action
        A5_REVIEW_REN["Evaluate Renewal Proposal & Rent Terms"]:::action
        D5_REN_DEC{"Approve Renewal?"}:::decision
        A5_INSPECT["Conduct Room Inspection Walkthrough"]:::action
        A5_SETTLE["Input Deductions & Settle Deposit Balance"]:::action
    end

    S5 --> D5_EVENT
    D5_EVENT -- "[New Lease]" --> A5_GEN_DRAFT
    A5_GEN_DRAFT --> A5_SIGN_VIEW
    A5_SIGN_VIEW --> A5_SIGN_DRAW
    A5_SIGN_DRAW --> A5_HASH
    A5_HASH --> A5_COUNTERSIGN
    A5_COUNTERSIGN --> F5_LEASE
    F5_LEASE --> A5_SEAL
    F5_LEASE --> A5_ACTIVATE
    A5_SEAL --> J5_LEASE
    A5_ACTIVATE --> J5_LEASE
    J5_LEASE --> A5_RECV_DOC
    A5_RECV_DOC --> M5_OUTCOMES
    D5_EVENT -- "[Renewal Request]" --> A5_REQ_REN
    A5_REQ_REN --> A5_REVIEW_REN
    A5_REVIEW_REN --> D5_REN_DEC
    D5_REN_DEC -- "[Renewal Approved]" --> A5_EXTEND
    A5_EXTEND --> M5_OUTCOMES
    D5_REN_DEC -- "[Renewal Rejected]" --> M5_OUTCOMES
    D5_EVENT -- "[Move-Out Notice]" --> A5_REQ_MOV
    A5_REQ_MOV --> A5_INSPECT
    A5_INSPECT --> A5_SETTLE
    A5_SETTLE --> A5_TERMINATE
    A5_TERMINATE --> M5_OUTCOMES
    M5_OUTCOMES --> A5_NOTIFY
    A5_NOTIFY --> E5
```

---

### Process 6.0: Process Billing (Billing & Payment Management)

#### Context & Purpose
Orchestrates submeter utility reading logs, tariff calculations, batch invoicing, tenant peer-to-peer GCash QR proof upload or cash intent, landlord review drawer, parallel Official Receipt issuance and audit logging (Fork/Join), concluding at a single final node.

* **Preconditions:** Active leases exist; utility rates configured in system.
* **Postconditions:** Payments recorded in D6; digital Official Receipts issued; single end point reached.
* **Data Stores Touched:** `D6 (Billing & Financial)`, `D5 (Lease & Contract)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_LANDLORD ["LANDLORD"]
        S6((●)):::startEnd
        A6_METER["Log Submeter Readings (Water & Electric)"]:::action
        A6_DRAWER["Open Review Drawer & Inspect Proof / Cash"]:::action
        D6_VERIFY{"Payment Valid?"}:::decision
        A6_REJ["Reject Payment with Explanation"]:::action
        A6_CONFIRM["Confirm Payment & Verify Tag (Exact/Partial)"]:::action
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A6_CHECK_READING["Validate current >= previous Readings"]:::action
        A6_CALC["Compute Consumption & Apply Utility Tariffs"]:::action
        A6_GEN_INV["Generate payments & itemized payment_items (D6)"]:::action
        A6_NOTIFY_BILL["Dispatch In-App Bill Alert & Due Date (D10)"]:::action
        M6_PROOFS{" "}:::decision
        A6_STATUS_REV["Set workflow_status = under_review"]:::action
        F6_BILLING["═══ FORK: Parallel OR Issuance & Audit ═══"]:::barStyle
        A6_ISSUE_OR["Generate Digital Official Receipt (OR) in D6"]:::action
        A6_AUDIT["Log Event in payment_workflow_audit_events"]:::action
        J6_BILLING["═══ JOIN: Synchronize Financial Ledger ═══"]:::barStyle
        M6_FINAL_BILLING{" "}:::decision
        E6(((◉))):::startEnd
    end

    subgraph LANE_TENANT ["TENANT"]
        A6_VIEW_INV["View Invoice Breakdown (/tenant/payments)"]:::action
        D6_METHOD{"Payment Channel?"}:::decision
        A6_GCASH["Scan GCash QR & Upload Proof Screenshot"]:::action
        A6_CASH["Submit In-Person Cash Settlement Intent"]:::action
        A6_DOWNLOAD_OR["Download Official Receipt & View Settled Ledger"]:::action
    end

    S6 --> A6_METER
    A6_METER --> A6_CHECK_READING
    A6_CHECK_READING --> A6_CALC
    A6_CALC --> A6_GEN_INV
    A6_GEN_INV --> A6_NOTIFY_BILL
    A6_NOTIFY_BILL --> A6_VIEW_INV
    A6_VIEW_INV --> D6_METHOD
    D6_METHOD -- "[GCash QR Upload]" --> A6_GCASH
    D6_METHOD -- "[Cash In-Person]" --> A6_CASH
    A6_GCASH --> M6_PROOFS
    A6_CASH --> M6_PROOFS
    M6_PROOFS --> A6_STATUS_REV
    A6_STATUS_REV --> A6_DRAWER
    A6_DRAWER --> D6_VERIFY
    D6_VERIFY -- "[Unverified / Invalid]" --> A6_REJ
    A6_REJ --> M6_FINAL_BILLING
    D6_VERIFY -- "[Verified]" --> A6_CONFIRM
    A6_CONFIRM --> F6_BILLING
    F6_BILLING --> A6_ISSUE_OR
    F6_BILLING --> A6_AUDIT
    A6_ISSUE_OR --> J6_BILLING
    A6_AUDIT --> J6_BILLING
    J6_BILLING --> A6_DOWNLOAD_OR
    A6_DOWNLOAD_OR --> M6_FINAL_BILLING
    M6_FINAL_BILLING --> E6
```

---

### Process 7.0: Stage Maintenance (Maintenance & Incident Management)

#### Context & Purpose
Handles maintenance trouble ticket reporting, parallel database insertion and urgent alert dispatch (Fork/Join), landlord ticket triage, contractor dispatch, satisfaction verification loop through an explicit Merge Node, expense logging in D6, terminating in a single final node.

* **Preconditions:** Resident tenant discovers defect in unit or common area.
* **Postconditions:** Issue resolved; repair expenses recorded in property ledger; single end point reached.
* **Data Stores Touched:** `D7 (Maintenance & Incident)`, `D6 (Billing & Financial)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_TENANT ["TENANT"]
        S7((●)):::startEnd
        A7_OPEN["Open Maintenance Form (/tenant/maintenance/new)"]:::action
        A7_FILL["Select Category, Priority & Attach Photos"]:::action
        A7_INSPECT["Inspect Repaired Defect in Unit"]:::action
        D7_SATISFIED{"Satisfied with Repair?"}:::decision
        A7_REOPEN["Request Rework with Follow-up Photos"]:::action
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A7_SUBMIT["Submit Maintenance Ticket to Controller"]:::action
        F7_MAINT["═══ FORK: Parallel Ticket Save & Alert ═══"]:::barStyle
        A7_INSERT_TICKET["Insert Record into maintenance_requests (D7)"]:::action
        A7_ALERT_LL["Dispatch Urgent Ticket Alert to Landlord (D10)"]:::action
        J7_MAINT["═══ JOIN: Synchronize Incident Pipeline ═══"]:::barStyle
        A7_UPDATE_SCHED["Update status = in_progress & Scheduled Date (D7)"]:::action
        A7_ALERT_T["Send Contractor Arrival Window Alert to Tenant"]:::action
        A7_RESOLVE["Update Ticket status = resolved in maintenance_requests"]:::action
        A7_CLOSE["Mark Ticket status = closed & Archive Record"]:::action
        E7(((◉))):::startEnd
    end

    subgraph LANE_LANDLORD ["LANDLORD & VENDOR"]
        M7_TRIAGE{" "}:::decision
        A7_TRIAGE["Review Issue Details, Category & Photos"]:::action
        A7_DISPATCH["Assign Technician/Vendor & Set Service Date"]:::action
        A7_WORK["Execute Physical Maintenance Repairs"]:::action
        A7_EXPENSE["Input Resolution Notes & Log Repair Expense in D6"]:::action
    end

    S7 --> A7_OPEN
    A7_OPEN --> A7_FILL
    A7_FILL --> A7_SUBMIT
    A7_SUBMIT --> F7_MAINT
    F7_MAINT --> A7_INSERT_TICKET
    F7_MAINT --> A7_ALERT_LL
    A7_INSERT_TICKET --> J7_MAINT
    A7_ALERT_LL --> J7_MAINT
    J7_MAINT --> M7_TRIAGE
    M7_TRIAGE --> A7_TRIAGE
    A7_TRIAGE --> A7_DISPATCH
    A7_DISPATCH --> A7_UPDATE_SCHED
    A7_UPDATE_SCHED --> A7_ALERT_T
    A7_ALERT_T --> A7_WORK
    A7_WORK --> A7_EXPENSE
    A7_EXPENSE --> A7_RESOLVE
    A7_RESOLVE --> A7_INSPECT
    A7_INSPECT --> D7_SATISFIED
    D7_SATISFIED -- "[Unresolved Defect]" --> A7_REOPEN
    A7_REOPEN --> M7_TRIAGE
    D7_SATISFIED -- "[Satisfied]" --> A7_CLOSE
    A7_CLOSE --> E7
```

---

### Process 8.0: Facilitate Messaging (Real-Time Communication & Moderation)

#### Context & Purpose
Facilitates direct 1-on-1 real-time messaging, automated keyword moderation, parallel database persistence and WebSocket broadcast (Fork/Join), online/offline delivery, and read receipts, merging into a single final node.

* **Preconditions:** Sender and recipient are verified members of the same residential property.
* **Postconditions:** Message transmitted or blocked; single end point reached.
* **Data Stores Touched:** `D8 (Communication & Messaging)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_SENDER ["SENDER (Landlord or Tenant)"]
        S8((●)):::startEnd
        A8_SELECT["Select Direct Conversation Thread"]:::action
        A8_TYPE["Compose Message & Attach File/Photo"]:::action
        A8_SEND["Click Send Action Button"]:::action
        A8_BLOCKED["Display Moderation Violation Warning"]:::action
        A8_RECEIPT["Observe 'Read' Timestamp Badge"]:::action
        M8_FINAL_MSG{" "}:::decision
        E8(((◉))):::startEnd
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A8_SCREEN["Filter Text against message_moderation_banned_terms"]:::action
        D8_FILTER{"Contains Banned Words?"}:::decision
        F8_MSG["═══ FORK: Parallel Save & Socket Broadcast ═══"]:::barStyle
        A8_INSERT["Insert Record in messages & Update conversations (D8)"]:::action
        A8_SOCKET["Broadcast Message via Supabase Realtime Socket"]:::action
        J8_MSG["═══ JOIN: Synchronize Dispatch Pipeline ═══"]:::barStyle
        D8_ONLINE{"Recipient Active Online?"}:::decision
        A8_PUSH["Write Alert to notifications Table (D10)"]:::action
        M8_RECV{" "}:::decision
        A8_ACK_READ["Update last_read_at in conversation_participants (D8)"]:::action
    end

    subgraph LANE_RECIPIENT ["RECIPIENT (Tenant or Landlord)"]
        A8_STREAM["Receive Message in Live Viewport Stream"]:::action
        A8_READ["Open Chat Thread & Read Message"]:::action
    end

    S8 --> A8_SELECT
    A8_SELECT --> A8_TYPE
    A8_TYPE --> A8_SEND
    A8_SEND --> A8_SCREEN
    A8_SCREEN --> D8_FILTER
    D8_FILTER -- "[Prohibited Language]" --> A8_BLOCKED
    A8_BLOCKED --> M8_FINAL_MSG
    D8_FILTER -- "[Clean Content]" --> F8_MSG
    F8_MSG --> A8_INSERT
    F8_MSG --> A8_SOCKET
    A8_INSERT --> J8_MSG
    A8_SOCKET --> J8_MSG
    J8_MSG --> D8_ONLINE
    D8_ONLINE -- "[Recipient Online]" --> M8_RECV
    D8_ONLINE -- "[Recipient Offline]" --> A8_PUSH
    A8_PUSH --> M8_RECV
    M8_RECV --> A8_STREAM
    A8_STREAM --> A8_READ
    A8_READ --> A8_ACK_READ
    A8_ACK_READ --> A8_RECEIPT
    A8_RECEIPT --> M8_FINAL_MSG
    M8_FINAL_MSG --> E8
```

---

### Process 9.0: Manage Community (Community Hub & Amenity Management)

#### Context & Purpose
Coordinates property announcements, resident social bulletin posts, threaded comments, emoji reactions, poll voting, shared amenity catalog discovery, and facility reservation booking with conflict checks, parallel pass issuance (Fork/Join), terminating in a single final node.

* **Preconditions:** User is an authenticated resident or managing landlord.
* **Postconditions:** Community engagement logged or amenity pass confirmed; single end point reached.
* **Data Stores Touched:** `D9 (Community & Amenity)`, `D10 (Notification)`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_RESIDENT ["RESIDENT (Tenant or Landlord)"]
        S9((●)):::startEnd
        A9_OPEN["Open Community Hub (/community)"]:::action
        D9_MODE{"Community Activity?"}:::decision
        A9_ANNOUNCE["Draft Official Announcement & Pin to Feed"]:::action
        A9_SOCIAL["Post Discussion, Reply, React, or Vote in Poll"]:::action
        A9_AMENITY["Select Amenity (Study Lounge, Gym) & Desired Slot"]:::action
        A9_CONFLICT["View Overlap Alert & Pick Alternate Time"]:::action
        M9_COMM_FINAL{" "}:::decision
        A9_FEED_UPD["Render Real-Time Bulletin Update or Confirmed Pass"]:::action
        E9(((◉))):::startEnd
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        F9_POSTS["═══ FORK: Parallel Post Save & Feed Broadcast ═══"]:::barStyle
        A9_SAVE_POSTS["Persist in community_* Tables in D9"]:::action
        A9_BROADCAST_FEED["Broadcast Real-Time Feed Update to Residents"]:::action
        J9_POSTS["═══ JOIN: Synchronize Social Stream ═══"]:::barStyle
        A9_CHECK_SLOT["Query amenity_bookings for Overlapping Intervals (D9)"]:::action
        D9_AVAIL{"Slot Available?"}:::decision
        A9_PENDING["Insert amenity_bookings with status = pending"]:::action
        F9_BOOKING["═══ FORK: Parallel Booking Confirm & Pass ═══"]:::barStyle
        A9_CONFIRM["Update booking status = confirmed in D9"]:::action
        A9_ISSUE_PASS["Issue Digital Facility Pass & Dispatch Alert (D10)"]:::action
        J9_BOOKING["═══ JOIN: Synchronize Facility Schedule ═══"]:::barStyle
    end

    subgraph LANE_LANDLORD ["LANDLORD APPROVER"]
        A9_REVIEW_RES["Review Reservation Request & Capacity"]:::action
        D9_MGR_DEC{"Approval Decision?"}:::decision
        A9_REJECT["Decline Booking & Provide Reason"]:::action
    end

    S9 --> A9_OPEN
    A9_OPEN --> D9_MODE
    D9_MODE -- "[Landlord Announcement]" --> A9_ANNOUNCE
    D9_MODE -- "[Social Engagement]" --> A9_SOCIAL
    D9_MODE -- "[Amenity Booking]" --> A9_AMENITY
    A9_ANNOUNCE --> F9_POSTS
    A9_SOCIAL --> F9_POSTS
    F9_POSTS --> A9_SAVE_POSTS
    F9_POSTS --> A9_BROADCAST_FEED
    A9_SAVE_POSTS --> J9_POSTS
    A9_BROADCAST_FEED --> J9_POSTS
    J9_POSTS --> M9_COMM_FINAL
    A9_AMENITY --> A9_CHECK_SLOT
    A9_CHECK_SLOT --> D9_AVAIL
    D9_AVAIL -- "[Slot Conflict]" --> A9_CONFLICT
    A9_CONFLICT --> A9_AMENITY
    D9_AVAIL -- "[Slot Open]" --> A9_PENDING
    A9_PENDING --> A9_REVIEW_RES
    A9_REVIEW_RES --> D9_MGR_DEC
    D9_MGR_DEC -- "[Declined]" --> A9_REJECT
    A9_REJECT --> A9_CONFLICT
    D9_MGR_DEC -- "[Approved]" --> F9_BOOKING
    F9_BOOKING --> A9_CONFIRM
    F9_BOOKING --> A9_ISSUE_PASS
    A9_CONFIRM --> J9_BOOKING
    A9_ISSUE_PASS --> J9_BOOKING
    J9_BOOKING --> M9_COMM_FINAL
    M9_COMM_FINAL --> A9_FEED_UPD
    A9_FEED_UPD --> E9
```

---

### Process 10.0: Dashboard (Operations Overview, KPIs & iRis AI Concierge)

#### Context & Purpose
Powers the Landlord Intelligence Hub, Tenant Resident Portal, and contextual natural-language inquiries processed via Groq Cloud by iRis AI with parallel dialogue logging and response streaming (Fork/Join), terminating in a single final node.

* **Preconditions:** Authenticated user session.
* **Postconditions:** Operational metrics rendered or AI residential advice synthesized; single end point reached.
* **Data Stores Touched:** `D1`, `D2`, `D4`, `D5`, `D6`, `D8`.

```mermaid
flowchart TD
    classDef startEnd fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold;
    classDef action fill:#ffffff,stroke:#2563eb,stroke-width:1.5px,color:#0f172a;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e;
    classDef barStyle fill:#0f172a,stroke:#0f172a,color:#ffffff,font-weight:bold,min-height:8px;

    subgraph LANE_USER ["USER (Landlord or Tenant)"]
        S10((●)):::startEnd
        A10_MOUNT["Mount Dashboard View (/landlord or /tenant)"]:::action
        D10_ROLE{"User Role / Action?"}:::decision
        A10_LL_VIEW["Explore KPIs, Cash Flow Ledger & Tour Replay"]:::action
        A10_T_VIEW["Review Due Balance, Announcements & Services"]:::action
        A10_AI_PROMPT["Ask Question to iRis AI Concierge Widget"]:::action
        A10_AI_REPLY["Render iRis Interactive Answer Card with Links"]:::action
        M10_DASH{" "}:::decision
        A10_UPDATE_VIEWPORT["Update Viewport State & Maintain Liveness"]:::action
        E10(((◉))):::startEnd
    end

    subgraph LANE_SYS ["iRESIDE SYSTEM / CONTROLLER"]
        A10_FETCH_KPIS["Aggregate Real-Time KPIs (Occupancy %, Cash Flow)"]:::action
        A10_FETCH_TENANT["Fetch Active Balance & Roommate Info"]:::action
        A10_CONTEXT["Assemble Context: House Rules (D2), Lease (D5), Payments (D6)"]:::action
        F10_IRIS["═══ FORK: Parallel Logging & Stream ═══"]:::barStyle
        A10_LOG["Log Dialogue Entry in iris_chat_messages (D8)"]:::action
        J10_IRIS["═══ JOIN: Synchronize AI Concierge Stream ═══"]:::barStyle
    end

    subgraph LANE_AI ["iRis AI SERVICE (Groq Cloud)"]
        A10_LLM["Dispatch Sanitized Prompt to groq/compound-mini"]:::action
        A10_SYNTH["Synthesize Polite Answer in English / Taglish"]:::action
    end

    S10 --> A10_MOUNT
    A10_MOUNT --> D10_ROLE
    D10_ROLE -- "[Landlord Overview]" --> A10_FETCH_KPIS
    A10_FETCH_KPIS --> A10_LL_VIEW
    A10_LL_VIEW --> M10_DASH
    D10_ROLE -- "[Tenant Overview]" --> A10_FETCH_TENANT
    A10_FETCH_TENANT --> A10_T_VIEW
    A10_T_VIEW --> M10_DASH
    D10_ROLE -- "[iRis AI Inquiry]" --> A10_AI_PROMPT
    A10_AI_PROMPT --> A10_CONTEXT
    A10_CONTEXT --> A10_LLM
    A10_LLM --> A10_SYNTH
    A10_SYNTH --> F10_IRIS
    F10_IRIS --> A10_LOG
    F10_IRIS --> A10_AI_REPLY
    A10_LOG --> J10_IRIS
    A10_AI_REPLY --> J10_IRIS
    J10_IRIS --> M10_DASH
    M10_DASH --> A10_UPDATE_VIEWPORT
    A10_UPDATE_VIEWPORT --> E10
```

---

## 4. Verification & Quality Checklist

- [x] **Strictly ONE Final Node per Diagram:** 10 out of 10 diagrams possess exactly 1 Activity Final Node (`◉`).
- [x] **Full UML 2.5 Symbol Set:** Initial nodes, Action states, Decision diamonds, Merge diamonds, Fork synchronization bars, Join synchronization bars, Final nodes, and Swimlanes present in 100% of diagrams.
- [x] **Role-Based Swimlanes:** Fully partitioned across *Landlord*, *Tenant / Applicant*, and *iReside System / Database*.
- [x] **Zero Retired Feature Contamination:** No Super Admin, no open public self-signup, no automated payment gateways, no LGU scrapers.
- [x] **Draw.io Multi-Page Verification:** Validated via XML parser; all 10 diagram tabs load seamlessly in [diagrams.net](https://app.diagrams.net).
