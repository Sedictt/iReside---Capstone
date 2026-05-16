import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { LeaseData } from "@/types/lease";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, supabase } = await requireUser();
    const { id } = await params;

    try {
        const { data: lease, error: leaseError } = await supabase
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
                        city,
                        images,
                        house_rules,
                        amenities:amenities (*),
                        renewal_settings,
                        renewal_window_days
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
            .eq("id", id)
            .eq("tenant_id", user.id)
            .maybeSingle();

        if (leaseError) throw leaseError;

        if (!lease) {
            return NextResponse.json(
                { error: "Lease not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            lease: lease as unknown as LeaseData
        });
    } catch (e: unknown) {
        const error = e as Error;
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
