# iReside System Architecture

This document provides a comprehensive overview of the iReside architecture, including high-level system components, data flows, and the database schema.

---

## 🏗️ System Overview (Container Diagram)

iReside follows a modern serverless-first architecture, leveraging **Next.js** for the application layer and **Supabase** for the backend infrastructure.

```mermaid
graph TD
    User([User: Tenant / Landlord])
    
    subgraph Frontend_App [Next.js Application]
        UI[React UI Components]
        API_Routes[Next.js API Routes]
        Auth_Client[Supabase Auth Client]
    end

    subgraph Backend_Cloud [Supabase Cloud]
        Auth[Supabase Auth]
        DB[(PostgreSQL DB + RLS)]
        Storage[Supabase Storage]
    end

    subgraph AI_Engine [AI & External Services]
        Groq[Groq LPU - Llama 3.1]
        MapSvc[Leaflet / OSM]
    end

    User <-->|HTTPS / JSON| UI
    UI <-->|Auth Session| Auth_Client
    Auth_Client <--> Auth
    
    UI <-->|Fetch / Subscriptions| DB
    UI <-->|File Uploads| Storage
    UI <--> MapSvc
    
    UI <-->|Request| API_Routes
    API_Routes <-->|RAG Context| DB
    API_Routes <-->|Inference| Groq
```

### Key Components:
- **Next.js App Router**: Handles routing, server-side rendering (SSR), and server-side logic in API routes.
- **Supabase**: 
    - **PostgreSQL**: Stores all relational data with Row Level Security (RLS) ensuring data privacy.
    - **GoTrue (Auth)**: Manages JWT-based authentication and user sessions.
    - **Storage**: Hosts property images, tenant documents, and signatures.
- **Groq Llama 3.1**: Powers the iRis Assistant and Landlord Insights using a high-performance LPU inference engine.

---

## 🗄️ Database Schema (ER Diagram)

The following diagram illustrates the relationships between the core entities in the iReside database.

```mermaid
erDiagram
    PROFILES ||--o{ PROPERTIES : "owns"
    PROFILES ||--o{ LEASES : "is tenant/landlord"
    PROFILES ||--o{ MESSAGES : "sends"
    PROFILES ||--o{ APPLICATIONS : "applies/reviews"
    PROFILES ||--o{ MAINTENANCE_REQUESTS : "submits/manages"
    
    PROPERTIES ||--|{ UNITS : "contains"
    UNITS ||--o{ LEASES : "leased in"
    UNITS ||--o{ APPLICATIONS : "targeted by"
    UNITS ||--o{ MAINTENANCE_REQUESTS : "related to"
    
    LEASES ||--o{ PAYMENTS : "generates"
    LEASES ||--o{ MOVE_OUT_REQUESTS : "subject of"
    
    PAYMENTS ||--|{ PAYMENT_ITEMS : "has"
    
    CONVERSATIONS ||--|{ CONVERSATION_PARTICIPANTS : "includes"
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    CONVERSATION_PARTICIPANTS }|--|| PROFILES : "links to"
    
    PROFILES {
        uuid id PK
        string email
        string full_name
        enum role
    }
    
    PROPERTIES {
        uuid id PK
        uuid landlord_id FK
        string name
        string address
        text[] amenities
    }
    
    UNITS {
        uuid id PK
        uuid property_id FK
        string name
        numeric rent_amount
        enum status
    }
    
    LEASES {
        uuid id PK
        uuid unit_id FK
        uuid tenant_id FK
        date start_date
        date end_date
        enum status
    }
    
    PAYMENTS {
        uuid id PK
        uuid lease_id FK
        numeric amount
        enum status
        date due_date
    }
```

---

## 🔄 Core Data Flows

### 1. iRis AI Chat Flow (RAG)
1.  **User** sends a message to `/api/iris/chat`.
2.  **API Route** authenticates the user via Supabase.
3.  **Context Engine** fetches relevant data (Lease, Property, Profile) from Postgres.
4.  **Prompt Builder** formats the system prompt with retrieved context.
5.  **Groq API** processes the prompt and returns a response.
6.  **Next.js** returns the AI response to the UI.

### 2. Tenant Application Flow
1.  **Tenant** browses a property and clicks "Apply".
2.  **Application** record is created in `applications` table.
3.  **Supabase Realtime** or a **Trigger** notifies the Landlord.
4.  **Landlord** reviews documents and updates status.
5.  On **Approval**, a **Lease** draft is automatically generated.

---

## 🛡️ Security Architecture
- **Row Level Security (RLS)**: The database is locked down by default. Policies ensure that a tenant can only see *their own* lease, and a landlord can only see applications for *their own* properties.
- **JWT Authorization**: Frontend and API routes verify identity using Supabase-issued tokens.
- **Server-Side Validation**: Critical logic (like payment confirmation or lease signing) is handled in Next.js Server Actions or API routes to prevent client-side tampering.
