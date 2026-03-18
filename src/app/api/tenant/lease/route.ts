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
                unit:units!inner (
                    id,
                    name,
                    property:properties!inner (
                        id,
                        name,
                        address,
                        images,
                        house_rules
                    )
                ),
                landlord:profiles!leases_landlord_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    phone
                )
            `)
            .eq("tenant_id", user.id)
            .order("start_date", { ascending: false });

        if (leaseError) throw leaseError;

        if (!leasesData || leasesData.length === 0) {
            return NextResponse.json({ lease: null });
        }

        // Prefer active lease
        const activeLease = leasesData.find((l: any) => l.status === "active") || leasesData[0];

        return NextResponse.json({
            lease: activeLease
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
