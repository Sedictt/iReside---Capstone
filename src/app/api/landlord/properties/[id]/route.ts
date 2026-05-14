import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user } = await requireUser();
    const supabase = await createClient();

    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;
    if (!propertyId) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, name, type, address, description, amenities, house_rules, images, contract_template, total_units, total_floors, base_rent_amount")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propertyError) {
        return NextResponse.json({ error: "Failed to load property details." }, { status: 500 });
    }

    if (!property) {
        return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
    }

    const { count: unitCount, error: unitCountError } = await supabase
        .from("units")
        .select("id", { count: "exact", head: true })
        .eq("property_id", property.id);

    if (unitCountError) {
        return NextResponse.json({ error: "Failed to load property units." }, { status: 500 });
    }

    // Load environment policy fields for wizard hydration (best-effort)
    const { data: envPolicy } = await supabase
        .from("property_environment_policies" as any)
        .select("utility_split_method, utility_fixed_charge_amount, max_occupants_per_unit")
        .eq("property_id", propertyId)
        .maybeSingle();

    return NextResponse.json({
        property: {
            ...property,
            unitCount: unitCount ?? 1,
            env_policy: envPolicy ?? null,
        },
    });
}
