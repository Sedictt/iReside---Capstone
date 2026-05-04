import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: leasesData, error: leaseError } = await supabase
            .from("leases")
            .select(`
                id,
                status,
                start_date,
                end_date,
                monthly_rent,
                security_deposit,
                terms,
                signed_at,
                signed_document_url,
                unit:units!inner (
                    id,
                    name,
                    floor,
                    sqft,
                    beds,
                    baths,
                    property:properties!inner (
                        id,
                        name,
                        address,
                        images,
                        house_rules,
                        amenities:amenities (*),
                        renewal_settings
                    )
                ),
                landlord:profiles!leases_landlord_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    avatar_bg_color,
                    phone
                ),
                tenant:profiles!leases_tenant_id_fkey (
                    full_name
                )
            `)
            .eq("tenant_id", user.id)
            .order("start_date", { ascending: false });

        if (leaseError) throw leaseError;

        if (!leasesData || leasesData.length === 0) {
            return NextResponse.json({ lease: null });
        }

        // Prefer active lease
        const activeLease = leasesData.find((l) => l.status === "active") || leasesData[0];

        return NextResponse.json({
            lease: activeLease
        });
    } catch (e: unknown) {
        const error = e as Error;
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
