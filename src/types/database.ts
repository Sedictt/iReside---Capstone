export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'tenant' | 'landlord'
export type PropertyType = 'apartment' | 'condo' | 'house' | 'townhouse' | 'studio'
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance'
export type LeaseStatus = 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'gcash' | 'maya' | 'bank_transfer' | 'cash'
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'withdrawn'
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent'
export type MoveOutStatus = 'pending' | 'approved' | 'denied' | 'completed'
export type MessageType = 'text' | 'system' | 'image' | 'file'
export type NotificationType = 'payment' | 'lease' | 'maintenance' | 'announcement' | 'message' | 'application'

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
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name: string
                    role: UserRole
                    avatar_url?: string | null
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string
                    role?: UserRole
                    avatar_url?: string | null
                    phone?: string | null
                    updated_at?: string
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
                    created_at: string
                }
                Insert: {
                    id?: string
                    payment_id: string
                    label: string
                    amount: number
                    category?: string
                    created_at?: string
                }
                Update: {
                    payment_id?: string
                    label?: string
                    amount?: number
                    category?: string
                }
                Relationships: any[]
            }
            applications: {
                Row: {
                    id: string
                    unit_id: string
                    applicant_id: string
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
                }
                Insert: {
                    id?: string
                    unit_id: string
                    applicant_id: string
                    landlord_id: string
                    status?: ApplicationStatus
                    message?: string | null
                    monthly_income?: number | null
                    employment_status?: string | null
                    move_in_date?: string | null
                    documents?: string[]
                    reviewed_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    unit_id?: string
                    applicant_id?: string
                    landlord_id?: string
                    status?: ApplicationStatus
                    message?: string | null
                    monthly_income?: number | null
                    employment_status?: string | null
                    move_in_date?: string | null
                    documents?: string[]
                    reviewed_at?: string | null
                    updated_at?: string
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
            application_status: ApplicationStatus
            maintenance_status: MaintenanceStatus
            maintenance_priority: MaintenancePriority
            move_out_status: MoveOutStatus
            message_type: MessageType
            notification_type: NotificationType
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
export type Application = Database['public']['Tables']['applications']['Row']
export type LandlordInquiryAction = Database['public']['Tables']['landlord_inquiry_actions']['Row']
export type MaintenanceRequest = Database['public']['Tables']['maintenance_requests']['Row']
export type MoveOutRequest = Database['public']['Tables']['move_out_requests']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageUserAction = Database['public']['Tables']['message_user_actions']['Row']
export type MessageUserReport = Database['public']['Tables']['message_user_reports']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type SavedProperty = Database['public']['Tables']['saved_properties']['Row']
export type LandlordStatisticsExport = Database['public']['Tables']['landlord_statistics_exports']['Row']

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

