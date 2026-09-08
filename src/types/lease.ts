interface RenewalSettings {
  enabled?: boolean;
  min_notice_days?: number;
  auto_renew?: boolean;
}

export interface LeaseData {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    signed_at: string | null;
    signed_document_url: string | null;
    status?: string;
    tenant_signature?: string | null;
    tenant_signed_at?: string | null;
    landlord_signature?: string | null;
    landlord_signed_at?: string | null;
    terms?: {
        due_day?: number;
        rent_due_day?: number;
        late_fee?: number;
        late_fee_day?: number;
        grace_period_days?: number;
        allow_partial?: boolean;
        [key: string]: any;
    };
    unit: {
        id: string;
        name: string;
        floor: number;
        sqft: number | null;
        beds: number;
        baths: number;
        property: {
            id: string;
            name: string;
            address: string;
            city: string;
            images: string[];
            house_rules: string[];
            renewal_settings?: RenewalSettings;
            renewal_window_days?: number;
            amenities: Array<{
                id: string;
                name: string;
                type: string;
                description: string;
                price_per_unit: number;
                unit_type: string;
                capacity: number;
                icon_name: string;
                location_details: string;
                image_url?: string;
                status: string;
            }>;
        }
    };
    landlord: {
        id: string;
        full_name: string;
        avatar_url: string;
        avatar_bg_color: string;
        phone: string;
        email?: string;
    };
    tenant: {
        full_name: string;
        email?: string;
    };
}
