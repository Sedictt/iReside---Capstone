export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'tenant' | 'landlord' | 'admin'
export type PropertyType = 'apartment' | 'dormitory' | 'boarding_house'
export type UtilitySplitMethod = 'equal_per_head' | 'equal_per_unit' | 'fixed_charge' | 'individual_meter'
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance'
export type LeaseStatus = 'draft' | 'pending_signature' | 'pending_tenant_signature' | 'pending_landlord_signature' | 'active' | 'expired' | 'terminated'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'gcash' | 'maya' | 'bank_transfer' | 'cash'
export type PaymentWorkflowStatus = 'pending' | 'reminder_sent' | 'intent_submitted' | 'under_review' | 'awaiting_in_person' | 'confirmed' | 'rejected' | 'receipted'
export type PaymentIntentMethod = 'gcash' | 'in_person'
export type PaymentAmountTag = 'exact' | 'partial' | 'overpaid' | 'short_paid'
export type PaymentReviewAction = 'accept_partial' | 'request_completion' | 'reject' | 'confirm_received'
export type UtilityType = 'water' | 'electricity'
export type UtilityBillingMode = 'included_in_rent' | 'tenant_paid'
export type ApplicationStatus = 'pending' | 'reviewing' | 'payment_pending' | 'approved' | 'rejected' | 'withdrawn'
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MoveOutStatus = 'pending' | 'approved' | 'denied' | 'completed'
export type UnitTransferStatus = 'pending' | 'approved' | 'denied' | 'cancelled'
export type MessageType = 'text' | 'system' | 'image' | 'file'
export type NotificationType = 'payment' | 'lease' | 'maintenance' | 'announcement' | 'message' | 'application'
export type ListingScope = 'property' | 'unit'
export type ListingStatus = 'draft' | 'published' | 'paused'
export type LocationType = 'city' | 'barangay' | 'street'
export type TenantInviteMode = 'property' | 'unit'
export type TenantInviteStatus = 'active' | 'revoked' | 'expired' | 'consumed'
export type TenantInviteApplicationType = 'online' | 'face_to_face' | 'existing_tenant'
export type ApplicationSource = 'walk_in_application' | 'invite_link'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string
                    role: UserRole
                    avatar_url: string | null
                    avatar_bg_color: string | null
                    phone: string | null
                    bio: string | null
                    website: string | null
                    address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    role: UserRole
                    avatar_url?: string | null
                    avatar_bg_color?: string | null
                    phone?: string | null
                    bio?: string | null
                    website?: string | null
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    role?: UserRole
                    avatar_url?: string | null
                    avatar_bg_color?: string | null
                    phone?: string | null
                    bio?: string | null
                    website?: string | null
                    address?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            geo_locations: {
                Row: {
                    id: string
                    name: string
                    type: LocationType
                    city_name: string | null
                    barangay_name: string | null
                    full_label: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: LocationType
                    city_name?: string | null
                    barangay_name?: string | null
                    full_label: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: LocationType
                    city_name?: string | null
                    barangay_name?: string | null
                    full_label?: string
                    created_at?: string
                }
                Relationships: any[]
            }
            landlord_applications: {
                Row: {
                    id: string
                    profile_id: string
                    phone: string
                    identity_document_url: string | null
                    ownership_document_url: string | null
                    liveness_document_url: string | null
                    status: ApplicationStatus
                    admin_notes: string | null
                    business_name: string | null
                    business_address: string | null
                    verification_status: 'not_verified' | 'verified' | 'not_found' | 'error' | null
                    verification_data: Json | null
                    verification_checked_at: string | null
                    verification_notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    phone: string
                    identity_document_url?: string | null
                    ownership_document_url?: string | null
                    liveness_document_url?: string | null
                    status?: ApplicationStatus
                    admin_notes?: string | null
                    business_name?: string | null
                    business_address?: string | null
                    verification_status?: 'not_verified' | 'verified' | 'not_found' | 'error' | null
                    verification_data?: Json | null
                    verification_checked_at?: string | null
                    verification_notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    profile_id?: string
                    phone?: string
                    identity_document_url?: string | null
                    ownership_document_url?: string | null
                    liveness_document_url?: string | null
                    status?: ApplicationStatus
                    admin_notes?: string | null
                    business_name?: string | null
                    business_address?: string | null
                    verification_status?: 'not_verified' | 'verified' | 'not_found' | 'error' | null
                    verification_data?: Json | null
                    verification_checked_at?: string | null
                    verification_notes?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            landlord_statistics_exports: {
                Row: {
                    id: string
                    landlord_id: string
                    format: 'csv' | 'pdf'
                    report_range: string
                    mode: 'Simplified' | 'Detailed'
                    include_expanded_kpis: boolean
                    row_count: number
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    format: 'csv' | 'pdf'
                    report_range: string
                    mode: 'Simplified' | 'Detailed'
                    include_expanded_kpis?: boolean
                    row_count?: number
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    landlord_id?: string
                    format?: 'csv' | 'pdf'
                    report_range?: string
                    mode?: 'Simplified' | 'Detailed'
                    include_expanded_kpis?: boolean
                    row_count?: number
                    metadata?: Json
                    created_at?: string
                }
                Relationships: any[]
            }
            listings: {
                Row: {
                    id: string
                    landlord_id: string
                    property_id: string
                    unit_id: string | null
                    scope: ListingScope
                    title: string
                    rent_amount: number
                    status: ListingStatus
                    views: number
                    leads: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    property_id: string
                    unit_id?: string | null
                    scope: ListingScope
                    title: string
                    rent_amount: number
                    status?: ListingStatus
                    views?: number
                    leads?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    property_id?: string
                    unit_id?: string | null
                    scope?: ListingScope
                    title?: string
                    rent_amount?: number
                    status?: ListingStatus
                    views?: number
                    leads?: number
                    updated_at?: string
                }
                Relationships: any[]
            }
            tenant_intake_invites: {
                Row: {
                    id: string
                    landlord_id: string
                    property_id: string
                    unit_id: string | null
                    mode: TenantInviteMode
                    application_type: TenantInviteApplicationType
                    required_requirements: Json
                    public_token: string
                    token_hash: string
                    status: TenantInviteStatus
                    max_uses: number
                    use_count: number
                    expires_at: string | null
                    last_used_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    property_id: string
                    unit_id?: string | null
                    mode: TenantInviteMode
                    application_type?: TenantInviteApplicationType
                    required_requirements?: Json
                    public_token: string
                    token_hash: string
                    status?: TenantInviteStatus
                    max_uses?: number
                    use_count?: number
                    expires_at?: string | null
                    last_used_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    property_id?: string
                    unit_id?: string | null
                    mode?: TenantInviteMode
                    application_type?: TenantInviteApplicationType
                    required_requirements?: Json
                    public_token?: string
                    token_hash?: string
                    status?: TenantInviteStatus
                    max_uses?: number
                    use_count?: number
                    expires_at?: string | null
                    last_used_at?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            tenant_intake_invite_events: {
                Row: {
                    id: string
                    invite_id: string
                    event_type: 'created' | 'opened' | 'submitted' | 'revoked' | 'expired' | 'consumed'
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    invite_id: string
                    event_type: 'created' | 'opened' | 'submitted' | 'revoked' | 'expired' | 'consumed'
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    invite_id?: string
                    event_type?: 'created' | 'opened' | 'submitted' | 'revoked' | 'expired' | 'consumed'
                    metadata?: Json
                }
                Relationships: any[]
            }
            properties: {
                Row: {
                    id: string
                    landlord_id: string
                    name: string
                    address: string
                    city: string
                    description: string | null
                    type: PropertyType
                    lat: number | null
                    lng: number | null
                    amenities: string[]
                    house_rules: string[]
                    contract_template: Json | null
                    images: string[]
                    is_featured: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    name: string
                    address: string
                    city?: string
                    description?: string | null
                    type?: PropertyType
                    lat?: number | null
                    lng?: number | null
                    amenities?: string[]
                    house_rules?: string[]
                    contract_template?: Json | null
                    images?: string[]
                    is_featured?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    name?: string
                    address?: string
                    city?: string
                    description?: string | null
                    type?: PropertyType
                    lat?: number | null
                    lng?: number | null
                    amenities?: string[]
                    house_rules?: string[]
                    contract_template?: Json | null
                    images?: string[]
                    is_featured?: boolean
                    updated_at?: string
                }
                Relationships: any[]
            }
            units: {
                Row: {
                    id: string
                    property_id: string
                    name: string
                    floor: number
                    status: UnitStatus
                    rent_amount: number
                    sqft: number | null
                    beds: number
                    baths: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    name: string
                    floor?: number
                    status?: UnitStatus
                    rent_amount: number
                    sqft?: number | null
                    beds?: number
                    baths?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    property_id?: string
                    name?: string
                    floor?: number
                    status?: UnitStatus
                    rent_amount?: number
                    sqft?: number | null
                    beds?: number
                    baths?: number
                    updated_at?: string
                }
                Relationships: any[]
            }
            leases: {
                Row: {
                    id: string
                    unit_id: string
                    tenant_id: string
                    landlord_id: string
                    status: LeaseStatus
                    start_date: string
                    end_date: string
                    monthly_rent: number
                    security_deposit: number
                    terms: Json | null
                    tenant_signature: string | null
                    landlord_signature: string | null
                    signed_at: string | null
                    signing_mode: 'in_person' | 'remote' | null
                    tenant_signed_at: string | null
                    landlord_signed_at: string | null
                    signing_link_token_hash: string | null
                    signature_lock_version: number
                    signed_document_url: string | null
                    signed_document_path: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    tenant_id: string
                    landlord_id: string
                    status?: LeaseStatus
                    start_date: string
                    end_date: string
                    monthly_rent: number
                    security_deposit?: number
                    terms?: Json | null
                    tenant_signature?: string | null
                    landlord_signature?: string | null
                    signed_at?: string | null
                    signing_mode?: 'in_person' | 'remote' | null
                    tenant_signed_at?: string | null
                    landlord_signed_at?: string | null
                    signing_link_token_hash?: string | null
                    signature_lock_version?: number
                    signed_document_url?: string | null
                    signed_document_path?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    unit_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    status?: LeaseStatus
                    start_date?: string
                    end_date?: string
                    monthly_rent?: number
                    security_deposit?: number
                    terms?: Json | null
                    tenant_signature?: string | null
                    landlord_signature?: string | null
                    signed_at?: string | null
                    signing_mode?: 'in_person' | 'remote' | null
                    tenant_signed_at?: string | null
                    landlord_signed_at?: string | null
                    signing_link_token_hash?: string | null
                    signature_lock_version?: number
                    signed_document_url?: string | null
                    signed_document_path?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            landlord_reviews: {
                Row: {
                    id: string
                    lease_id: string
                    landlord_id: string
                    tenant_id: string
                    rating: number
                    comment: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lease_id: string
                    landlord_id: string
                    tenant_id: string
                    rating: number
                    comment?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    lease_id?: string
                    landlord_id?: string
                    tenant_id?: string
                    rating?: number
                    comment?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            payments: {
                Row: {
                    id: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    amount: number
                    status: PaymentStatus
                    method: PaymentMethod | null
                    description: string | null
                    due_date: string
                    paid_at: string | null
                    reference_number: string | null
                    landlord_confirmed: boolean
                    invoice_number: string | null
                    billing_cycle: string | null
                    invoice_period_start: string | null
                    invoice_period_end: string | null
                    subtotal: number
                    paid_amount: number
                    balance_remaining: number
                    late_fee_amount: number
                    late_fee_applied_at: string | null
                    allow_partial_payments: boolean
                    due_day_snapshot: number | null
                    payment_submitted_at: string | null
                    payment_proof_path: string | null
                    payment_proof_url: string | null
                    payment_note: string | null
                    reminder_sent_at: string | null
                    receipt_number: string | null
                    workflow_status: PaymentWorkflowStatus
                    intent_method: PaymentIntentMethod | null
                    amount_tag: PaymentAmountTag | null
                    review_action: PaymentReviewAction | null
                    in_person_intent_expires_at: string | null
                    rejection_reason: string | null
                    last_action_at: string | null
                    last_action_by: string | null
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    amount: number
                    status?: PaymentStatus
                    method?: PaymentMethod | null
                    description?: string | null
                    due_date: string
                    paid_at?: string | null
                    reference_number?: string | null
                    landlord_confirmed?: boolean
                    invoice_number?: string | null
                    billing_cycle?: string | null
                    invoice_period_start?: string | null
                    invoice_period_end?: string | null
                    subtotal?: number
                    paid_amount?: number
                    balance_remaining?: number
                    late_fee_amount?: number
                    late_fee_applied_at?: string | null
                    allow_partial_payments?: boolean
                    due_day_snapshot?: number | null
                    payment_submitted_at?: string | null
                    payment_proof_path?: string | null
                    payment_proof_url?: string | null
                    payment_note?: string | null
                    reminder_sent_at?: string | null
                    receipt_number?: string | null
                    workflow_status?: PaymentWorkflowStatus
                    intent_method?: PaymentIntentMethod | null
                    amount_tag?: PaymentAmountTag | null
                    review_action?: PaymentReviewAction | null
                    in_person_intent_expires_at?: string | null
                    rejection_reason?: string | null
                    last_action_at?: string | null
                    last_action_by?: string | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    lease_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    amount?: number
                    status?: PaymentStatus
                    method?: PaymentMethod | null
                    description?: string | null
                    due_date?: string
                    paid_at?: string | null
                    reference_number?: string | null
                    landlord_confirmed?: boolean
                    invoice_number?: string | null
                    billing_cycle?: string | null
                    invoice_period_start?: string | null
                    invoice_period_end?: string | null
                    subtotal?: number
                    paid_amount?: number
                    balance_remaining?: number
                    late_fee_amount?: number
                    late_fee_applied_at?: string | null
                    allow_partial_payments?: boolean
                    due_day_snapshot?: number | null
                    payment_submitted_at?: string | null
                    payment_proof_path?: string | null
                    payment_proof_url?: string | null
                    payment_note?: string | null
                    reminder_sent_at?: string | null
                    receipt_number?: string | null
                    workflow_status?: PaymentWorkflowStatus
                    intent_method?: PaymentIntentMethod | null
                    amount_tag?: PaymentAmountTag | null
                    review_action?: PaymentReviewAction | null
                    in_person_intent_expires_at?: string | null
                    rejection_reason?: string | null
                    last_action_at?: string | null
                    last_action_by?: string | null
                    metadata?: Json
                    updated_at?: string
                }
                Relationships: any[]
            }
            payment_items: {
                Row: {
                    id: string
                    payment_id: string
                    label: string
                    amount: number
                    category: string
                    sort_order: number
                    utility_type: UtilityType | null
                    billing_mode: UtilityBillingMode | null
                    reading_id: string | null
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_id: string
                    label: string
                    amount: number
                    category?: string
                    sort_order?: number
                    utility_type?: UtilityType | null
                    billing_mode?: UtilityBillingMode | null
                    reading_id?: string | null
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    payment_id?: string
                    label?: string
                    amount?: number
                    category?: string
                    sort_order?: number
                    utility_type?: UtilityType | null
                    billing_mode?: UtilityBillingMode | null
                    reading_id?: string | null
                    metadata?: Json
                }
                Relationships: any[]
            }
            landlord_payment_destinations: {
                Row: {
                    id: string
                    landlord_id: string
                    provider: 'gcash'
                    account_name: string
                    account_number: string
                    qr_image_path: string | null
                    qr_image_url: string | null
                    is_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    provider?: 'gcash'
                    account_name: string
                    account_number: string
                    qr_image_path?: string | null
                    qr_image_url?: string | null
                    is_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    provider?: 'gcash'
                    account_name?: string
                    account_number?: string
                    qr_image_path?: string | null
                    qr_image_url?: string | null
                    is_enabled?: boolean
                    updated_at?: string
                }
                Relationships: any[]
            }
            utility_configs: {
                Row: {
                    id: string
                    landlord_id: string
                    property_id: string
                    unit_id: string | null
                    utility_type: UtilityType
                    billing_mode: UtilityBillingMode
                    rate_per_unit: number
                    unit_label: 'kwh' | 'cubic_meter'
                    is_active: boolean
                    effective_from: string
                    effective_to: string | null
                    note: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    property_id: string
                    unit_id?: string | null
                    utility_type: UtilityType
                    billing_mode?: UtilityBillingMode
                    rate_per_unit?: number
                    unit_label: 'kwh' | 'cubic_meter'
                    is_active?: boolean
                    effective_from?: string
                    effective_to?: string | null
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    property_id?: string
                    unit_id?: string | null
                    utility_type?: UtilityType
                    billing_mode?: UtilityBillingMode
                    rate_per_unit?: number
                    unit_label?: 'kwh' | 'cubic_meter'
                    is_active?: boolean
                    effective_from?: string
                    effective_to?: string | null
                    note?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            utility_readings: {
                Row: {
                    id: string
                    landlord_id: string
                    lease_id: string
                    property_id: string
                    unit_id: string
                    utility_type: UtilityType
                    billing_mode: UtilityBillingMode
                    billing_period_start: string
                    billing_period_end: string
                    previous_reading: number
                    current_reading: number
                    usage: number
                    billed_rate: number
                    computed_charge: number
                    entered_at: string
                    note: string | null
                    proof_image_path: string | null
                    proof_image_url: string | null
                    payment_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    lease_id: string
                    property_id: string
                    unit_id: string
                    utility_type: UtilityType
                    billing_mode: UtilityBillingMode
                    billing_period_start: string
                    billing_period_end: string
                    previous_reading?: number
                    current_reading?: number
                    usage?: number
                    billed_rate?: number
                    computed_charge?: number
                    entered_at?: string
                    note?: string | null
                    proof_image_path?: string | null
                    proof_image_url?: string | null
                    payment_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    landlord_id?: string
                    lease_id?: string
                    property_id?: string
                    unit_id?: string
                    utility_type?: UtilityType
                    billing_mode?: UtilityBillingMode
                    billing_period_start?: string
                    billing_period_end?: string
                    previous_reading?: number
                    current_reading?: number
                    usage?: number
                    billed_rate?: number
                    computed_charge?: number
                    entered_at?: string
                    note?: string | null
                    proof_image_path?: string | null
                    proof_image_url?: string | null
                    payment_id?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            payment_receipts: {
                Row: {
                    id: string
                    payment_id: string
                    landlord_id: string
                    tenant_id: string
                    receipt_number: string
                    amount: number
                    issued_at: string
                    issued_by: string | null
                    notes: string | null
                    method: PaymentMethod | null
                    amount_breakdown: Json
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_id: string
                    landlord_id: string
                    tenant_id: string
                    receipt_number: string
                    amount: number
                    issued_at?: string
                    issued_by?: string | null
                    notes?: string | null
                    method?: PaymentMethod | null
                    amount_breakdown?: Json
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    payment_id?: string
                    landlord_id?: string
                    tenant_id?: string
                    receipt_number?: string
                    amount?: number
                    issued_at?: string
                    issued_by?: string | null
                    notes?: string | null
                    method?: PaymentMethod | null
                    amount_breakdown?: Json
                    metadata?: Json
                }
                Relationships: any[]
            }
            payment_workflow_audit_events: {
                Row: {
                    id: string
                    payment_id: string
                    actor_id: string | null
                    action: string
                    source: 'api' | 'chat_button' | 'system_expiry'
                    idempotency_key: string | null
                    before_state: Json
                    after_state: Json
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_id: string
                    actor_id?: string | null
                    action: string
                    source: 'api' | 'chat_button' | 'system_expiry'
                    idempotency_key?: string | null
                    before_state?: Json
                    after_state?: Json
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    payment_id?: string
                    actor_id?: string | null
                    action?: string
                    source?: 'api' | 'chat_button' | 'system_expiry'
                    idempotency_key?: string | null
                    before_state?: Json
                    after_state?: Json
                    metadata?: Json
                    created_at?: string
                }
                Relationships: any[]
            }
            property_environment_policies: {
                Row: {
                    property_id: string
                    environment_mode: string
                    max_occupants_per_unit: number | null
                    curfew_enabled: boolean
                    curfew_time: string | null
                    visitor_cutoff_enabled: boolean
                    visitor_cutoff_time: string | null
                    quiet_hours_start: string | null
                    quiet_hours_end: string | null
                    gender_restriction_mode: string
                    utility_policy_mode: string
                    utility_split_method: UtilitySplitMethod | null
                    utility_fixed_charge_amount: number | null
                    payment_profile_defaults: Json | null
                    needs_review: boolean
                    reviewed_at: string | null
                    reviewed_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    property_id: string
                    environment_mode: string
                    max_occupants_per_unit?: number | null
                    curfew_enabled?: boolean
                    curfew_time?: string | null
                    visitor_cutoff_enabled?: boolean
                    visitor_cutoff_time?: string | null
                    quiet_hours_start?: string | null
                    quiet_hours_end?: string | null
                    gender_restriction_mode?: string
                    utility_policy_mode?: string
                    utility_split_method?: UtilitySplitMethod | null
                    utility_fixed_charge_amount?: number | null
                    payment_profile_defaults?: Json | null
                    needs_review?: boolean
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    environment_mode?: string
                    max_occupants_per_unit?: number | null
                    curfew_enabled?: boolean
                    curfew_time?: string | null
                    visitor_cutoff_enabled?: boolean
                    visitor_cutoff_time?: string | null
                    quiet_hours_start?: string | null
                    quiet_hours_end?: string | null
                    gender_restriction_mode?: string
                    utility_policy_mode?: string
                    utility_split_method?: UtilitySplitMethod | null
                    utility_fixed_charge_amount?: number | null
                    payment_profile_defaults?: Json | null
                    needs_review?: boolean
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            application_payment_requests: {
                Row: {
                    id: string
                    application_id: string
                    landlord_id: string
                    requirement_type: 'advance_rent' | 'security_deposit'
                    amount: number
                    due_at: string | null
                    status: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired'
                    method: PaymentMethod | null
                    reference_number: string | null
                    payment_note: string | null
                    payment_proof_path: string | null
                    payment_proof_url: string | null
                    submitted_at: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    review_note: string | null
                    bypassed: boolean
                    linked_payment_id: string | null
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    application_id: string
                    landlord_id: string
                    requirement_type: 'advance_rent' | 'security_deposit'
                    amount: number
                    due_at?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired'
                    method?: PaymentMethod | null
                    reference_number?: string | null
                    payment_note?: string | null
                    payment_proof_path?: string | null
                    payment_proof_url?: string | null
                    submitted_at?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    review_note?: string | null
                    bypassed?: boolean
                    linked_payment_id?: string | null
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    application_id?: string
                    landlord_id?: string
                    requirement_type?: 'advance_rent' | 'security_deposit'
                    amount?: number
                    due_at?: string | null
                    status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired'
                    method?: PaymentMethod | null
                    reference_number?: string | null
                    payment_note?: string | null
                    payment_proof_path?: string | null
                    payment_proof_url?: string | null
                    submitted_at?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    review_note?: string | null
                    bypassed?: boolean
                    linked_payment_id?: string | null
                    metadata?: Json
                    updated_at?: string
                }
                Relationships: any[]
            }
            application_payment_audit_events: {
                Row: {
                    id: string
                    application_id: string
                    payment_request_id: string | null
                    actor_id: string | null
                    actor_role: 'system' | 'landlord' | 'prospect'
                    event_type:
                        | 'request_generated'
                        | 'portal_opened'
                        | 'proof_submitted'
                        | 'payment_confirmed'
                        | 'payment_rejected'
                        | 'payment_needs_correction'
                        | 'bypass_used'
                        | 'expired'
                        | 'finalized'
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    application_id: string
                    payment_request_id?: string | null
                    actor_id?: string | null
                    actor_role: 'system' | 'landlord' | 'prospect'
                    event_type:
                        | 'request_generated'
                        | 'portal_opened'
                        | 'proof_submitted'
                        | 'payment_confirmed'
                        | 'payment_rejected'
                        | 'payment_needs_correction'
                        | 'bypass_used'
                        | 'expired'
                        | 'finalized'
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    application_id?: string
                    payment_request_id?: string | null
                    actor_id?: string | null
                    actor_role?: 'system' | 'landlord' | 'prospect'
                    event_type?:
                        | 'request_generated'
                        | 'portal_opened'
                        | 'proof_submitted'
                        | 'payment_confirmed'
                        | 'payment_rejected'
                        | 'payment_needs_correction'
                        | 'bypass_used'
                        | 'expired'
                        | 'finalized'
                    metadata?: Json
                }
                Relationships: any[]
            }
            applications: {
                Row: {
                    id: string
                    unit_id: string
                    applicant_id: string | null
                    lease_id: string | null
                    landlord_id: string
                    status: ApplicationStatus
                    message: string | null
                    monthly_income: number | null
                    employment_status: string | null
                    move_in_date: string | null
                    documents: string[]
                    emergency_contact_name: string | null
                    emergency_contact_phone: string | null
                    reference_name: string | null
                    reference_phone: string | null
                    compliance_checklist: Json | null
                    reviewed_at: string | null
                    payment_pending_started_at: string | null
                    payment_pending_expires_at: string | null
                    payment_portal_token_hash: string | null
                    payment_portal_token_expires_at: string | null
                    created_at: string
                    updated_at: string
                    invite_id: string | null
                    application_source: ApplicationSource
                    // Walk-in application fields
                    created_by: string | null
                    applicant_name: string | null
                    applicant_email: string | null
                    applicant_phone: string | null
                    employment_info: Json | null
                    requirements_checklist: Json | null
                }
                Insert: {
                    id?: string
                    unit_id: string
                    applicant_id?: string | null
                    lease_id?: string | null
                    landlord_id: string
                    status?: ApplicationStatus
                    message?: string | null
                    monthly_income?: number | null
                    employment_status?: string | null
                    move_in_date?: string | null
                    documents?: string[]
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    reference_name?: string | null
                    reference_phone?: string | null
                    compliance_checklist?: Json | null
                    reviewed_at?: string | null
                    payment_pending_started_at?: string | null
                    payment_pending_expires_at?: string | null
                    payment_portal_token_hash?: string | null
                    payment_portal_token_expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                    invite_id?: string | null
                    application_source?: ApplicationSource
                    // Walk-in application fields
                    created_by?: string | null
                    applicant_name?: string | null
                    applicant_email?: string | null
                    applicant_phone?: string | null
                    employment_info?: Json | null
                    requirements_checklist?: Json | null
                }
                Update: {
                    unit_id?: string
                    applicant_id?: string | null
                    lease_id?: string | null
                    landlord_id?: string
                    status?: ApplicationStatus
                    message?: string | null
                    monthly_income?: number | null
                    employment_status?: string | null
                    move_in_date?: string | null
                    documents?: string[]
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    reference_name?: string | null
                    reference_phone?: string | null
                    compliance_checklist?: Json | null
                    reviewed_at?: string | null
                    payment_pending_started_at?: string | null
                    payment_pending_expires_at?: string | null
                    payment_portal_token_hash?: string | null
                    payment_portal_token_expires_at?: string | null
                    updated_at?: string
                    invite_id?: string | null
                    application_source?: ApplicationSource
                    // Walk-in application fields
                    created_by?: string | null
                    applicant_name?: string | null
                    applicant_email?: string | null
                    applicant_phone?: string | null
                    employment_info?: Json | null
                    requirements_checklist?: Json | null
                }
                Relationships: any[]
            }
            landlord_inquiry_actions: {
                Row: {
                    id: string
                    inquiry_id: string
                    landlord_id: string
                    is_read: boolean
                    is_archived: boolean
                    deleted_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    inquiry_id: string
                    landlord_id: string
                    is_read?: boolean
                    is_archived?: boolean
                    deleted_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    inquiry_id?: string
                    landlord_id?: string
                    is_read?: boolean
                    is_archived?: boolean
                    deleted_at?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            maintenance_requests: {
                Row: {
                    id: string
                    unit_id: string
                    tenant_id: string
                    landlord_id: string
                    title: string
                    description: string
                    status: MaintenanceStatus
                    priority: MaintenancePriority
                    category: string | null
                    images: string[]
                    self_repair_requested: boolean
                    self_repair_decision: 'pending' | 'approved' | 'rejected' | null
                    repair_method: 'landlord' | 'third_party' | 'self_repair' | null
                    third_party_name: string | null
                    photo_requested: boolean
                    tenant_repair_status: 'not_started' | 'personnel_arrived' | 'repairing' | 'done' | null
                    tenant_provided_photos: string[]
                    resolved_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    tenant_id: string
                    landlord_id: string
                    title: string
                    description: string
                    status?: MaintenanceStatus
                    priority?: MaintenancePriority
                    category?: string | null
                    images?: string[]
                    self_repair_requested?: boolean
                    self_repair_decision?: 'pending' | 'approved' | 'rejected' | null
                    repair_method?: 'landlord' | 'third_party' | 'self_repair' | null
                    third_party_name?: string | null
                    photo_requested?: boolean
                    tenant_repair_status?: 'not_started' | 'personnel_arrived' | 'repairing' | 'done' | null
                    tenant_provided_photos?: string[]
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    unit_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    title?: string
                    description?: string
                    status?: MaintenanceStatus
                    priority?: MaintenancePriority
                    category?: string | null
                    images?: string[]
                    self_repair_requested?: boolean
                    self_repair_decision?: 'pending' | 'approved' | 'rejected' | null
                    repair_method?: 'landlord' | 'third_party' | 'self_repair' | null
                    third_party_name?: string | null
                    photo_requested?: boolean
                    tenant_repair_status?: 'not_started' | 'personnel_arrived' | 'repairing' | 'done' | null
                    tenant_provided_photos?: string[]
                    resolved_at?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            move_out_requests: {
                Row: {
                    id: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    reason: string | null
                    requested_date: string
                    status: MoveOutStatus
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    reason?: string | null
                    requested_date: string
                    status?: MoveOutStatus
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    lease_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    reason?: string | null
                    requested_date?: string
                    status?: MoveOutStatus
                    notes?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            unit_transfer_requests: {
                Row: {
                    id: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    property_id: string
                    current_unit_id: string
                    requested_unit_id: string
                    reason: string | null
                    status: UnitTransferStatus
                    landlord_note: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lease_id: string
                    tenant_id: string
                    landlord_id: string
                    property_id: string
                    current_unit_id: string
                    requested_unit_id: string
                    reason?: string | null
                    status?: UnitTransferStatus
                    landlord_note?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    lease_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    property_id?: string
                    current_unit_id?: string
                    requested_unit_id?: string
                    reason?: string | null
                    status?: UnitTransferStatus
                    landlord_note?: string | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            conversations: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    updated_at?: string
                }
                Relationships: any[]
            }
            conversation_participants: {
                Row: {
                    id: string
                    conversation_id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    conversation_id?: string
                    user_id?: string
                }
                Relationships: any[]
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    type: MessageType
                    content: string
                    metadata: Json | null
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    type?: MessageType
                    content: string
                    metadata?: Json | null
                    read_at?: string | null
                    created_at?: string
                }
                Update: {
                    conversation_id?: string
                    sender_id?: string
                    type?: MessageType
                    content?: string
                    metadata?: Json | null
                    read_at?: string | null
                }
                Relationships: any[]
            }
            message_user_actions: {
                Row: {
                    id: string
                    actor_user_id: string
                    target_user_id: string
                    archived: boolean
                    blocked: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    actor_user_id: string
                    target_user_id: string
                    archived?: boolean
                    blocked?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    actor_user_id?: string
                    target_user_id?: string
                    archived?: boolean
                    blocked?: boolean
                    updated_at?: string
                }
                Relationships: any[]
            }
            message_user_reports: {
                Row: {
                    id: string
                    reporter_user_id: string
                    target_user_id: string
                    conversation_id: string | null
                    category: string
                    details: string
                    status: string
                    metadata: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    reporter_user_id: string
                    target_user_id: string
                    conversation_id?: string | null
                    category: string
                    details: string
                    status?: string
                    metadata?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    reporter_user_id?: string
                    target_user_id?: string
                    conversation_id?: string | null
                    category?: string
                    details?: string
                    status?: string
                    metadata?: Json | null
                    updated_at?: string
                }
                Relationships: any[]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: NotificationType
                    title: string
                    message: string
                    data: Json | null
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: NotificationType
                    title: string
                    message: string
                    data?: Json | null
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    type?: NotificationType
                    title?: string
                    message?: string
                    data?: Json | null
                    read?: boolean
                }
                Relationships: any[]
            }
            saved_properties: {
                Row: {
                    id: string
                    user_id: string
                    property_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    property_id: string
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    property_id?: string
                }
                Relationships: any[]
            }
            consultation_documents: {
                Row: {
                    id: string
                    file_name: string
                    file_url: string
                    status: 'pending' | 'signed'
                    signed_file_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    file_name: string
                    file_url: string
                    status?: 'pending' | 'signed'
                    signed_file_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    file_name?: string
                    file_url?: string
                    status?: 'pending' | 'signed'
                    signed_file_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: any[]
            }
            lease_signing_audit: {
                Row: {
                    id: string
                    lease_id: string
                    event_type: 'signing_link_generated' | 'signing_link_accessed' | 'signing_link_expired' | 'signing_link_regenerated' | 'tenant_signed' | 'landlord_signed' | 'lease_activated' | 'signing_failed'
                    actor_id: string | null
                    ip_address: string | null
                    user_agent: string | null
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    lease_id: string
                    event_type: 'signing_link_generated' | 'signing_link_accessed' | 'signing_link_expired' | 'signing_link_regenerated' | 'tenant_signed' | 'landlord_signed' | 'lease_activated' | 'signing_failed'
                    actor_id?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    lease_id?: string
                    event_type?: 'signing_link_generated' | 'signing_link_accessed' | 'signing_link_expired' | 'signing_link_regenerated' | 'tenant_signed' | 'landlord_signed' | 'lease_activated' | 'signing_failed'
                    actor_id?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    metadata?: Json | null
                }
                Relationships: any[]
            }
            unit_map_positions: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string
                    floor_key: string
                    x: number
                    y: number
                    w: number
                    h: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_id: string
                    floor_key: string
                    x: number
                    y: number
                    w: number
                    h: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    property_id?: string
                    unit_id?: string
                    floor_key?: string
                    x?: number
                    y?: number
                    w?: number
                    h?: number
                    updated_at?: string
                }
                Relationships: any[]
            }
            property_floor_configs: {
                Row: {
                    id: string
                    property_id: string
                    floor_number: number
                    floor_key: string
                    display_name: string
                    sort_order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    floor_number: number
                    floor_key: string
                    display_name: string
                    sort_order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    property_id?: string
                    floor_number?: number
                    floor_key?: string
                    display_name?: string
                    sort_order?: number
                    updated_at?: string
                }
                Relationships: any[]
            }
            amenities: {
                Row: {
                    id: string
                    property_id: string
                    landlord_id: string
                    name: string
                    type: string
                    image_url: string | null
                    description: string | null
                    price_per_unit: number
                    unit_type: string
                    status: string
                    capacity: number | null
                    icon_name: string | null
                    location_details: string | null
                    tags: string[]
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    landlord_id: string
                    name: string
                    type: string
                    image_url?: string | null
                    description?: string | null
                    price_per_unit?: number
                    unit_type?: string
                    status?: string
                    capacity?: number | null
                    icon_name?: string | null
                    location_details?: string | null
                    tags?: string[]
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    landlord_id?: string
                    name?: string
                    type?: string
                    image_url?: string | null
                    description?: string | null
                    price_per_unit?: number
                    unit_type?: string
                    status?: string
                    capacity?: number | null
                    icon_name?: string | null
                    location_details?: string | null
                    tags?: string[]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "amenities_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "amenities_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    }
                ]
            }
            amenity_bookings: {
                Row: {
                    id: string
                    amenity_id: string
                    tenant_id: string
                    landlord_id: string
                    booking_date: string
                    start_time: string
                    end_time: string
                    total_price: number
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    amenity_id: string
                    tenant_id: string
                    landlord_id: string
                    booking_date: string
                    start_time: string
                    end_time: string
                    total_price?: number
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    amenity_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    booking_date?: string
                    start_time?: string
                    end_time?: string
                    total_price?: number
                    status?: string
                    notes?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "amenity_bookings_amenity_id_fkey"
                        columns: ["amenity_id"]
                        referencedRelation: "amenities"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "amenity_bookings_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "amenity_bookings_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            property_type: PropertyType
            unit_status: UnitStatus
            lease_status: LeaseStatus
            payment_status: PaymentStatus
            payment_method: PaymentMethod
            payment_workflow_status: PaymentWorkflowStatus
            payment_intent_method: PaymentIntentMethod
            payment_amount_tag: PaymentAmountTag
            payment_review_action: PaymentReviewAction
            application_status: ApplicationStatus
            maintenance_status: MaintenanceStatus
            maintenance_priority: MaintenancePriority
            move_out_status: MoveOutStatus
            unit_transfer_status: UnitTransferStatus
            message_type: MessageType
            notification_type: NotificationType
            utility_type: UtilityType
            utility_billing_mode: UtilityBillingMode
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// ---------- Convenience row types ----------
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Property = Database['public']['Tables']['properties']['Row']
export type Unit = Database['public']['Tables']['units']['Row']
export type Lease = Database['public']['Tables']['leases']['Row']
export type LandlordReview = Database['public']['Tables']['landlord_reviews']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentItem = Database['public']['Tables']['payment_items']['Row']
export type LandlordPaymentDestination = Database['public']['Tables']['landlord_payment_destinations']['Row']
export type UtilityConfig = Database['public']['Tables']['utility_configs']['Row']
export type UtilityReading = Database['public']['Tables']['utility_readings']['Row']
export type PaymentReceipt = Database['public']['Tables']['payment_receipts']['Row']
export type PaymentWorkflowAuditEvent = Database['public']['Tables']['payment_workflow_audit_events']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type LandlordInquiryAction = Database['public']['Tables']['landlord_inquiry_actions']['Row']
export type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row']
export type MoveOutRequest = Database['public']['Tables']['move_out_requests']['Row']
export type UnitTransferRequest = Database['public']['Tables']['unit_transfer_requests']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageUserAction = Database['public']['Tables']['message_user_actions']['Row']
export type MessageUserReport = Database['public']['Tables']['message_user_reports']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type SavedProperty = Database['public']['Tables']['saved_properties']['Row']
export type ConsultationDocument = Database['public']['Tables']['consultation_documents']['Row']
export type LandlordStatisticsExport = Database['public']['Tables']['landlord_statistics_exports']['Row']
export type Amenity = Database['public']['Tables']['amenities']['Row']
export type AmenityBooking = Database['public']['Tables']['amenity_bookings']['Row']

// ---------- Joined / view types for common queries ----------
export type UnitWithProperty = Unit & {
    property: Property
}

export type LeaseWithDetails = Lease & {
    unit: UnitWithProperty
    tenant: Profile
    landlord: Profile
}

export type PaymentWithDetails = Payment & {
    lease: Lease
    tenant: Profile
    items: PaymentItem[]
    readings?: UtilityReading[]
    payment_destination?: LandlordPaymentDestination | null
    receipts?: PaymentReceipt[]
}

export type ApplicationWithDetails = Application & {
    unit: UnitWithProperty
    applicant: Profile
}

export type MaintenanceRequestWithDetails = MaintenanceRequest & {
    unit: UnitWithProperty
    tenant: Profile
}

export type ConversationWithParticipants = Conversation & {
    participants: (ConversationParticipant & { profile: Profile })[]
    last_message?: Message
}

export type AmenityWithProperty = Amenity & {
    property: { name: string } | null
}

export type AmenityBookingWithDetails = AmenityBooking & {
    amenity: { name: string; type: string; icon_name: string | null; property_id: string } | null
    tenant: { full_name: string | null; email: string; avatar_url: string | null } | null
}

