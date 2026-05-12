# iReside Database Schema ERD

> Generated from `docs/latest-documentations after major refactor/databse-context.sql`
> Tool: Mermaid ERD (render in GitHub, VS Code, or mermaid.live)

```mermaid
erDiagram
    %% =============================================================================
    %% CORE USER & AUTH
    %% =============================================================================
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

    %% =============================================================================
    %% PROPERTY & LISTINGS
    %% =============================================================================
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

    %% =============================================================================
    %% UNITS & LEASES
    %% =============================================================================
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

    %% =============================================================================
    %% MAINTENANCE
    %% =============================================================================
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

    %% =============================================================================
    %% PAYMENTS
    %% =============================================================================
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

    %% =============================================================================
    %% MESSAGING & COMMUNITY
    %% =============================================================================
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

    %% =============================================================================
    %% CHAT & AI ASSISTANT
    %% =============================================================================
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

    %% =============================================================================
    %% PRODUCT TOUR / ONBOARDING
    %% =============================================================================
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

    %% =============================================================================
    %% STATISTICS & EXPORTS
    %% =============================================================================
    landlord_statistics_exports {
        uuid id PK
        uuid landlord_id FK
        text export_type
        text file_url
        text status
        timestamp created_at
    }

    %% =============================================================================
    %% NOTIFICATIONS
    %% =============================================================================
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

    %% =============================================================================
    %% LANDLORD ACTIONS
    %% =============================================================================
    landlord_inquiry_actions {
        uuid id PK
        uuid inquiry_id FK
        uuid landlord_id FK
        text action
        text notes
        timestamp created_at
    }

    %% =============================================================================
    %% RELATIONSHIPS
    %% =============================================================================
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