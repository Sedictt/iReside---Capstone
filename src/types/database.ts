export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'tenant' | 'landlord' | 'admin'
export type PropertyType = 'apartment' | 'dormitory' | 'boarding_house'
type UtilitySplitMethod = 'equal_per_head' | 'equal_per_unit' | 'fixed_charge' | 'individual_meter'
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance'
export type LeaseStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'pending_tenant_signature' | 'pending_landlord_signature'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'gcash' | 'maya' | 'bank_transfer' | 'cash'
export type PaymentWorkflowStatus = 'pending' | 'reminder_sent' | 'intent_submitted' | 'under_review' | 'awaiting_in_person' | 'confirmed' | 'rejected' | 'receipted'
type PaymentIntentMethod = 'gcash' | 'in_person'
type PaymentAmountTag = 'exact' | 'partial' | 'overpaid' | 'short_paid'
type PaymentReviewAction = 'accept_partial' | 'request_completion' | 'reject' | 'confirm_received'
export type UtilityType = 'water' | 'electricity'
export type UtilityBillingMode = 'included_in_rent' | 'tenant_paid'
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'withdrawn' | 'payment_pending'
export type MaintenanceStatus = 'pending' | 'in_progress' | 'resolved' | 'cancelled'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MoveOutStatus = 'pending' | 'approved' | 'denied' | 'completed'
type UnitTransferStatus = 'pending' | 'approved' | 'denied' | 'cancelled'
export type MessageType = 'text' | 'system' | 'image' | 'file'
export type NotificationType = 'payment' | 'lease' | 'maintenance' | 'announcement' | 'message' | 'application' | 'lease_renewal_request' | 'lease_renewal_approved' | 'lease_renewal_rejected' | 'move_out_approved' | 'move_out_denied' | 'move_out_inspection_completed' | 'move_out_finalized'

type TenantInviteMode = 'property' | 'unit'
type TenantInviteStatus = 'active' | 'revoked' | 'expired' | 'consumed'
type TenantInviteApplicationType = 'online' | 'face_to_face' | 'existing_tenant'
type ApplicationSource = 'walk_in_application' | 'invite_link'
export type RenewalStatus = 'pending' | 'approved' | 'rejected' | 'signed'

export type MaintenanceSentiment = 'distressed' | 'negative' | 'neutral' | 'positive'
export type MaintenanceRepairMethod = 'landlord' | 'third_party' | 'self_repair'
export type MaintenanceSelfRepairDecision = 'pending' | 'approved' | 'rejected'
export type MaintenanceTenantRepairStatus = 'not_started' | 'personnel_arrived' | 'repairing' | 'done'


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
                    cover_url: string | null
                    socials: Json | null
                    business_name: string | null
                    business_permits: string[]
                    business_permit_url: string | null
                    business_permit_number: string | null
                    two_factor_enabled: boolean | null
                    two_factor_email: string | null
                    gmail_access_token: string | null
                    gmail_refresh_token: string | null
                    gmail_token_expiry: string | null
                    otp_code: string | null
                    otp_expiry: string | null
                    has_changed_password: boolean
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
                    cover_url?: string | null
                    socials?: Json | null
                    business_name?: string | null
                    business_permits?: string[]
                    business_permit_url?: string | null
                    business_permit_number?: string | null
                    two_factor_enabled?: boolean | null
                    two_factor_email?: string | null
                    gmail_access_token?: string | null
                    gmail_refresh_token?: string | null
                    gmail_token_expiry?: string | null
                    otp_code?: string | null
                    otp_expiry?: string | null
                    has_changed_password?: boolean
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
                    cover_url?: string | null
                    socials?: Json | null
                    business_name?: string | null
                    business_permits?: string[]
                    business_permit_url?: string | null
                    business_permit_number?: string | null
                    two_factor_enabled?: boolean | null
                    two_factor_email?: string | null
                    gmail_access_token?: string | null
                    gmail_refresh_token?: string | null
                    gmail_token_expiry?: string | null
                    otp_code?: string | null
                    otp_expiry?: string | null
                    has_changed_password?: boolean
                    created_at?: string
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
                    price_per_unit: number | null
                    unit_type: string | null
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
                    price_per_unit?: number | null
                    unit_type?: string | null
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
                    price_per_unit?: number | null
                    unit_type?: string | null
                    status?: string
                    capacity?: number | null
                    icon_name?: string | null
                    location_details?: string | null
                    tags?: string[]
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "amenities_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "amenities_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
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
            expenses: {
                Row: {
                    id: string
                    landlord_id: string
                    property_id: string | null
                    unit_id: string | null
                    category: string
                    amount: number
                    date_incurred: string
                    description: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    property_id?: string | null
                    unit_id?: string | null
                    category: string
                    amount: number
                    date_incurred: string
                    description: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    property_id?: string | null
                    unit_id?: string | null
                    category?: string
                    amount?: number
                    date_incurred?: string
                    description?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "expenses_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "expenses_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "expenses_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
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
                    updated_at?: string
                }
                Relationships: []
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
                    created_at: string
                    updated_at: string
                    signing_mode: string | null
                    tenant_signed_at: string | null
                    landlord_signed_at: string | null
                    signing_link_token_hash: string | null
                    signature_lock_version: number
                    signed_document_url: string | null
                    signed_document_path: string | null
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
                    created_at?: string
                    updated_at?: string
                    signing_mode?: string | null
                    tenant_signed_at?: string | null
                    landlord_signed_at?: string | null
                    signing_link_token_hash?: string | null
                    signature_lock_version?: number
                    signed_document_url?: string | null
                    signed_document_path?: string | null
                }
                Update: {
                    id?: string
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
                    created_at?: string
                    updated_at?: string
                    signing_mode?: string | null
                    tenant_signed_at?: string | null
                    landlord_signed_at?: string | null
                    signing_link_token_hash?: string | null
                    signature_lock_version?: number
                    signed_document_url?: string | null
                    signed_document_path?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leases_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leases_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leases_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    updated_at: string
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
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: NotificationType
                    title?: string
                    message?: string
                    data?: Json | null
                    read?: boolean
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    amenities: string[]
                    house_rules: string[]
                    images: string[]
                    is_featured: boolean
                    created_at: string
                    updated_at: string
                    contract_template: Json | null
                    total_units: number | null
                    total_floors: number | null
                    base_rent_amount: number | null
                    renewal_window_days: number
                    renewal_settings: Json | null
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    name: string
                    address: string
                    city?: string
                    description?: string | null
                    type?: PropertyType
                    amenities?: string[]
                    house_rules?: string[]
                    images?: string[]
                    is_featured?: boolean
                    created_at?: string
                    updated_at?: string
                    contract_template?: Json | null
                    total_units?: number | null
                    total_floors?: number | null
                    base_rent_amount?: number | null
                    renewal_window_days?: number
                    renewal_settings?: Json | null
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    name?: string
                    address?: string
                    city?: string
                    description?: string | null
                    type?: PropertyType
                    amenities?: string[]
                    house_rules?: string[]
                    images?: string[]
                    is_featured?: boolean
                    created_at?: string
                    updated_at?: string
                    contract_template?: Json | null
                    total_units?: number | null
                    total_floors?: number | null
                    base_rent_amount?: number | null
                    renewal_window_days?: number
                    renewal_settings?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "properties_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    id?: string
                    property_id?: string
                    name?: string
                    floor?: number
                    status?: UnitStatus
                    rent_amount?: number
                    sqft?: number | null
                    beds?: number
                    baths?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "units_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    }
                ]
            }
            applications: {
                Row: {
                    id: string
                    unit_id: string
                    applicant_id: string | null
                    landlord_id: string
                    status: ApplicationStatus
                    message: string | null
                    monthly_income: number | null
                    employment_status: string | null
                    move_in_date: string | null
                    documents: string[]
                    reviewed_at: string | null
                    created_at: string
                    updated_at: string
                    emergency_contact_name: string | null
                    emergency_contact_phone: string | null
                    reference_name: string | null
                    reference_phone: string | null
                    compliance_checklist: Json | null
                    created_by: string | null
                    applicant_name: string | null
                    applicant_phone: string | null
                    applicant_email: string | null
                    employment_info: Json | null
                    requirements_checklist: Json | null
                    lease_id: string | null
                    invite_id: string | null
                    application_source: string
                    payment_pending_started_at: string | null
                    payment_pending_expires_at: string | null
                    payment_portal_token_hash: string | null
                    payment_portal_token_expires_at: string | null
                }
                Insert: {
                    id?: string
                    unit_id: string
                    applicant_id: string
                    status?: ApplicationStatus
                    submitted_at?: string
                    reviewed_at?: string | null
                    approved_at?: string | null
                    rejected_at?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    applicant_id?: string
                    status?: ApplicationStatus
                    submitted_at?: string
                    reviewed_at?: string | null
                    approved_at?: string | null
                    rejected_at?: string | null
                    notes?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "applications_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "applications_applicant_id_fkey"
                        columns: ["applicant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    metadata: Json
                    workflow_status: PaymentWorkflowStatus
                    intent_method: PaymentIntentMethod | null
                    amount_tag: PaymentAmountTag | null
                    review_action: PaymentReviewAction | null
                    in_person_intent_expires_at: string | null
                    rejection_reason: string | null
                    last_action_at: string | null
                    last_action_by: string | null
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
                    metadata?: Json
                    workflow_status?: PaymentWorkflowStatus
                    intent_method?: PaymentIntentMethod | null
                    amount_tag?: PaymentAmountTag | null
                    review_action?: PaymentReviewAction | null
                    in_person_intent_expires_at?: string | null
                    rejection_reason?: string | null
                    last_action_at?: string | null
                    last_action_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
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
                    metadata?: Json
                    workflow_status?: PaymentWorkflowStatus
                    intent_method?: PaymentIntentMethod | null
                    amount_tag?: PaymentAmountTag | null
                    review_action?: PaymentReviewAction | null
                    in_person_intent_expires_at?: string | null
                    rejection_reason?: string | null
                    last_action_at?: string | null
                    last_action_by?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payments_lease_id_fkey"
                        columns: ["lease_id"]
                        referencedRelation: "leases"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payments_last_action_by_fkey"
                        columns: ["last_action_by"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payment_items: {
                Row: {
                    id: string
                    payment_id: string
                    label: string
                    amount: number
                    category: string
                    created_at: string
                    sort_order: number
                    utility_type: UtilityType | null
                    billing_mode: UtilityBillingMode | null
                    reading_id: string | null
                    metadata: Json
                }
                Insert: {
                    id?: string
                    payment_id: string
                    label: string
                    amount: number
                    category?: string
                    created_at?: string
                    sort_order?: number
                    utility_type?: UtilityType | null
                    billing_mode?: UtilityBillingMode | null
                    reading_id?: string | null
                    metadata?: Json
                }
                Update: {
                    id?: string
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
                Relationships: [
                    {
                        foreignKeyName: "payment_items_payment_id_fkey"
                        columns: ["payment_id"]
                        referencedRelation: "payments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payment_items_reading_id_fkey"
                        columns: ["reading_id"]
                        referencedRelation: "utility_readings"
                        referencedColumns: ["id"]
                    }
                ]
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
                    resolved_at: string | null
                    created_at: string
                    updated_at: string
                    self_repair_requested: boolean
                    self_repair_decision: MaintenanceSelfRepairDecision | null
                    repair_method: MaintenanceRepairMethod | null
                    third_party_name: string | null
                    photo_requested: boolean
                    tenant_repair_status: MaintenanceTenantRepairStatus | null
                    tenant_provided_photos: string[]
                    ai_triage_priority: MaintenancePriority | null
                    ai_triage_sentiment: MaintenanceSentiment | null
                    ai_triage_reason: string | null
                    ai_triage_confidence: number | null
                    ai_triage_hash: string | null
                    ai_triage_version: string | null
                    ai_triaged_at: string | null
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
                    resolved_at?: string | null
                    created_at?: string
                    updated_at?: string
                    self_repair_requested?: boolean
                    self_repair_decision?: MaintenanceSelfRepairDecision | null
                    repair_method?: MaintenanceRepairMethod | null
                    third_party_name?: string | null
                    photo_requested?: boolean
                    tenant_repair_status?: MaintenanceTenantRepairStatus | null
                    tenant_provided_photos?: string[]
                    ai_triage_priority?: MaintenancePriority | null
                    ai_triage_sentiment?: MaintenanceSentiment | null
                    ai_triage_reason?: string | null
                    ai_triage_confidence?: number | null
                    ai_triage_hash?: string | null
                    ai_triage_version?: string | null
                    ai_triaged_at?: string | null
                }
                Update: {
                    id?: string
                    unit_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    title?: string
                    description?: string
                    status?: MaintenanceStatus
                    priority?: MaintenancePriority
                    category?: string | null
                    images?: string[]
                    resolved_at?: string | null
                    updated_at?: string
                    self_repair_requested?: boolean
                    self_repair_decision?: MaintenanceSelfRepairDecision | null
                    repair_method?: MaintenanceRepairMethod | null
                    third_party_name?: string | null
                    photo_requested?: boolean
                    tenant_repair_status?: MaintenanceTenantRepairStatus | null
                    tenant_provided_photos?: string[]
                    ai_triage_priority?: MaintenancePriority | null
                    ai_triage_sentiment?: MaintenanceSentiment | null
                    ai_triage_reason?: string | null
                    ai_triage_confidence?: number | null
                    ai_triage_hash?: string | null
                    ai_triage_version?: string | null
                    ai_triaged_at?: string | null
                }

                Relationships: [
                    {
                        foreignKeyName: "maintenance_requests_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "maintenance_requests_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
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
                    id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
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
                    id?: string
                    conversation_id?: string
                    user_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "conversation_participants_conversation_id_fkey"
                        columns: ["conversation_id"]
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "conversation_participants_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    type: MessageType
                    metadata: Json | null
                    read_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    type?: MessageType
                    metadata?: Json | null
                    read_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    type?: MessageType
                    metadata?: Json | null
                    read_at?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_conversation_id_fkey"
                        columns: ["conversation_id"]
                        referencedRelation: "conversations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_sender_id_fkey"
                        columns: ["sender_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    id?: string
                    actor_user_id?: string
                    target_user_id?: string
                    archived?: boolean
                    blocked?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "message_user_actions_actor_user_id_fkey"
                        columns: ["actor_user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "message_user_actions_target_user_id_fkey"
                        columns: ["target_user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            message_user_reports: {
                Row: {
                    id: string
                    message_id: string
                    reporter_id: string
                    reason: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    message_id: string
                    reporter_id: string
                    reason: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    message_id?: string
                    reporter_id?: string
                    reason?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "message_user_reports_message_id_fkey"
                        columns: ["message_id"]
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "message_user_reports_reporter_id_fkey"
                        columns: ["reporter_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            landlord_reviews: {
                Row: {
                    id: string
                    landlord_id: string
                    tenant_id: string
                    rating: number
                    review: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    tenant_id: string
                    rating: number
                    review: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    tenant_id?: string
                    rating?: number
                    review?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "landlord_reviews_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "landlord_reviews_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            landlord_payment_destinations: {
                Row: {
                    id: string
                    landlord_id: string
                    type: string
                    destination: string
                    is_default: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    type: string
                    destination: string
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    type?: string
                    destination?: string
                    is_default?: boolean
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "landlord_payment_destinations_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    unit_label: string
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
                    unit_label: string
                    is_active?: boolean
                    effective_from?: string
                    effective_to?: string | null
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    property_id?: string
                    unit_id?: string | null
                    utility_type?: UtilityType
                    billing_mode?: UtilityBillingMode
                    rate_per_unit?: number
                    unit_label?: string
                    is_active?: boolean
                    effective_from?: string
                    effective_to?: string | null
                    note?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "utility_configs_property_id_fkey"
                        columns: ["property_id"]
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "utility_configs_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "utility_configs_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    status: string
                    invoice_id: string | null
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
                    status?: string
                    invoice_id?: string | null
                }
                Update: {
                    id?: string
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
                    status?: string
                    invoice_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "utility_readings_utility_config_id_fkey"
                        columns: ["utility_config_id"]
                        referencedRelation: "utility_configs"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "utility_readings_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payment_receipts: {
                Row: {
                    id: string
                    payment_id: string
                    receipt_url: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_id: string
                    receipt_url: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    payment_id?: string
                    receipt_url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_receipts_payment_id_fkey"
                        columns: ["payment_id"]
                        referencedRelation: "payments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payment_workflow_audit_events: {
                Row: {
                    id: string
                    payment_id: string
                    actor_id: string | null
                    action: string
                    source: string
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
                    source: string
                    idempotency_key?: string | null
                    before_state?: Json
                    after_state?: Json
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    payment_id?: string
                    event?: string
                    data?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_workflow_audit_events_payment_id_fkey"
                        columns: ["payment_id"]
                        referencedRelation: "payments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            landlord_inquiry_actions: {
                Row: {
                    id: string
                    landlord_id: string
                    inquiry_id: string
                    action_type: string
                    metadata: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    inquiry_id: string
                    action_type: string
                    metadata?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    inquiry_id?: string
                    action_type?: string
                    metadata?: Json | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "landlord_inquiry_actions_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
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
                    created_at: string
                    updated_at: string
                    business_name: string | null
                    business_address: string | null
                    verification_status: string | null
                    verification_data: Json | null
                    verification_checked_at: string | null
                    verification_notes: string | null
                    email: string | null
                    full_name: string | null
                    onboarding_token: string | null
                    onboarding_token_expires_at: string | null
                    onboarding_completed_at: string | null
                    business_permit_url: string | null
                    business_permit_card_url: string | null
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
                    created_at?: string
                    updated_at?: string
                    business_name?: string | null
                    business_address?: string | null
                    verification_status?: string | null
                    verification_data?: Json | null
                    verification_checked_at?: string | null
                    verification_notes?: string | null
                    email?: string | null
                    full_name?: string | null
                    onboarding_token?: string | null
                    onboarding_token_expires_at?: string | null
                    onboarding_completed_at?: string | null
                    business_permit_url?: string | null
                    business_permit_card_url?: string | null
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
                    created_at?: string
                    updated_at?: string
                    business_name?: string | null
                    business_address?: string | null
                    verification_status?: string | null
                    verification_data?: Json | null
                    verification_checked_at?: string | null
                    verification_notes?: string | null
                    email?: string | null
                    full_name?: string | null
                    onboarding_token?: string | null
                    onboarding_token_expires_at?: string | null
                    onboarding_completed_at?: string | null
                    business_permit_url?: string | null
                    business_permit_card_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "landlord_applications_profile_id_fkey"
                        columns: ["profile_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            move_out_requests: {
                Row: {
                    id: string
                    unit_id: string
                    tenant_id: string
                    status: MoveOutStatus
                    requested_date: string
                    approved_date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    unit_id: string
                    tenant_id: string
                    status?: MoveOutStatus
                    requested_date: string
                    approved_date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    unit_id?: string
                    tenant_id?: string
                    status?: MoveOutStatus
                    requested_date?: string
                    approved_date?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "move_out_requests_unit_id_fkey"
                        columns: ["unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "move_out_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            unit_transfer_requests: {
                Row: {
                    id: string
                    from_unit_id: string
                    to_unit_id: string
                    tenant_id: string
                    status: UnitTransferStatus
                    requested_date: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    from_unit_id: string
                    to_unit_id: string
                    tenant_id: string
                    status?: UnitTransferStatus
                    requested_date: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    from_unit_id?: string
                    to_unit_id?: string
                    tenant_id?: string
                    status?: UnitTransferStatus
                    requested_date?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "unit_transfer_requests_from_unit_id_fkey"
                        columns: ["from_unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "unit_transfer_requests_to_unit_id_fkey"
                        columns: ["to_unit_id"]
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "unit_transfer_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            landlord_statistics_exports: {
                Row: {
                    id: string
                    landlord_id: string
                    export_type: string
                    file_url: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    landlord_id: string
                    export_type: string
                    file_url: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    landlord_id?: string
                    export_type?: string
                    file_url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "landlord_statistics_exports_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            renewal_requests: {
                Row: {
                    id: string
                    current_lease_id: string
                    tenant_id: string
                    landlord_id: string
                    proposed_start_date: string | null
                    proposed_end_date: string | null
                    proposed_monthly_rent: number | null
                    proposed_security_deposit: number | null
                    terms_json: Json | null
                    status: RenewalStatus
                    landlord_notes: string | null
                    new_lease_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    current_lease_id: string
                    tenant_id: string
                    landlord_id: string
                    proposed_start_date?: string | null
                    proposed_end_date?: string | null
                    proposed_monthly_rent?: number | null
                    proposed_security_deposit?: number | null
                    terms_json?: Json | null
                    status?: RenewalStatus
                    landlord_notes?: string | null
                    new_lease_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    current_lease_id?: string
                    tenant_id?: string
                    landlord_id?: string
                    proposed_start_date?: string | null
                    proposed_end_date?: string | null
                    proposed_monthly_rent?: number | null
                    proposed_security_deposit?: number | null
                    terms_json?: Json | null
                    status?: RenewalStatus
                    landlord_notes?: string | null
                    new_lease_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "renewal_requests_current_lease_id_fkey"
                        columns: ["current_lease_id"]
                        referencedRelation: "leases"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "renewal_requests_tenant_id_fkey"
                        columns: ["tenant_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "renewal_requests_landlord_id_fkey"
                        columns: ["landlord_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "renewal_requests_new_lease_id_fkey"
                        columns: ["new_lease_id"]
                        referencedRelation: "leases"
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
            maintenance_repair_method: MaintenanceRepairMethod
            maintenance_self_repair_decision: MaintenanceSelfRepairDecision
            maintenance_tenant_repair_status: MaintenanceTenantRepairStatus
            maintenance_sentiment: MaintenanceSentiment
            renewal_status: RenewalStatus
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
type LandlordReview = Database['public']['Tables']['landlord_reviews']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentItem = Database['public']['Tables']['payment_items']['Row']
export type LandlordPaymentDestination = Database['public']['Tables']['landlord_payment_destinations']['Row']
export type UtilityConfig = Database['public']['Tables']['utility_configs']['Row']
export type UtilityReading = Database['public']['Tables']['utility_readings']['Row']
export type PaymentReceipt = Database['public']['Tables']['payment_receipts']['Row']
type PaymentWorkflowAuditEvent = Database['public']['Tables']['payment_workflow_audit_events']['Row']
type Application = Database['public']['Tables']['applications']['Row']
type LandlordInquiryAction = Database['public']['Tables']['landlord_inquiry_actions']['Row']
export type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row']
type MoveOutRequest = Database['public']['Tables']['move_out_requests']['Row']
type UnitTransferRequest = Database['public']['Tables']['unit_transfer_requests']['Row']
type Conversation = Database['public']['Tables']['conversations']['Row']
type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
type Message = Database['public']['Tables']['messages']['Row']
type MessageUserAction = Database['public']['Tables']['message_user_actions']['Row']
type MessageUserReport = Database['public']['Tables']['message_user_reports']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

type ConsultationDocument = Database['public']['Tables']['consultation_documents']['Row']
type LandlordStatisticsExport = Database['public']['Tables']['landlord_statistics_exports']['Row']
type Amenity = Database['public']['Tables']['amenities']['Row']
type AmenityBooking = Database['public']['Tables']['amenity_bookings']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']

// ---------- Joined / view types for common queries ----------
type UnitWithProperty = Unit & {
    property: Property
}

type LeaseWithDetails = Lease & {
    unit: UnitWithProperty
    tenant: Profile
    landlord: Profile
}

type PaymentWithDetails = Payment & {
    lease: Lease
    tenant: Profile
    items: PaymentItem[]
    readings?: UtilityReading[]
    payment_destination?: LandlordPaymentDestination | null
    receipts?: PaymentReceipt[]
}

type ApplicationWithDetails = Application & {
    unit: UnitWithProperty
    applicant: Profile
}

type MaintenanceRequestWithDetails = MaintenanceRequest & {
    unit: UnitWithProperty
    tenant: Profile
}

type ConversationWithParticipants = Conversation & {
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


type UserSession = { id: string; user_id: string; created_at: string; updated_at: string; ip: string; user_agent: string; not_after: string; }

