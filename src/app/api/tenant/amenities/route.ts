/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get tenant's active lease to find their unit_ids
        const { data: leases, error: leaseError } = await supabase
            .from('leases')
            .select('unit_id')
            .eq('tenant_id', user.id)
            .eq('status', 'active');

        if (leaseError) throw leaseError;
        if (!leases || leases.length === 0) {
            return NextResponse.json({ amenities: [] });
        }

        const unitIds = leases.map(l => l.unit_id);

        // Get units to find their property_ids
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('property_id')
            .in('id', unitIds);

        if (unitsError) throw unitsError;
        if (!units || units.length === 0) {
            return NextResponse.json({ amenities: [] });
        }

        const propertyIds = [...new Set(units.map(u => u.property_id).filter(Boolean))];

        // Get amenities for these properties
        const { data: amenities, error: amenitiesError } = await supabase
            .from('amenities')
            .select(`
                *,
                property:properties(name)
            `)
            .in('property_id', propertyIds)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (amenitiesError) throw amenitiesError;

        return NextResponse.json({ amenities });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}