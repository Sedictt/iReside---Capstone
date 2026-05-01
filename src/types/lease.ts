export interface LeaseData {
    id: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    security_deposit: number;
    signed_at: string | null;
    signed_document_url: string | null;
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
    };
    tenant: {
        full_name: string;
    };
}
