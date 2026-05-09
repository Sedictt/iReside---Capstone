import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/landlord/property-units
 * Returns the landlord's properties with their units.
 * Used by the Landlord Dashboard for Walk-ins, Invites, and context selection.
 * Replaces the retired /api/landlord/listings endpoint.
 */
export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all properties for this landlord
    const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, address, images, contract_template")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (propertiesError) {
        console.error("[property-units GET] Properties query error:", propertiesError);
        return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
    }

    const propertyIds = (properties ?? []).map((property) => property.id);

    // 2. Fetch all units for these properties
    const { data: units, error: unitsError } = propertyIds.length
        ? await supabase
              .from("units")
              .select("id, property_id, name, status, rent_amount")
              .in("property_id", propertyIds)
              .order("created_at", { ascending: true })
        : { data: [], error: null };

    if (unitsError) {
        console.error("[property-units GET] Units query error:", unitsError);
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const unitsByProperty = new Map<string, Array<{ id: string; name: string; status: string; rent_amount: number }>>();

    for (const unit of units ?? []) {
        const existing = unitsByProperty.get(unit.property_id) ?? [];
        existing.push(unit);
        unitsByProperty.set(unit.property_id, existing);
    }

    // 3. Format as properties with nested units
    const propertyUnits = (properties ?? []).map((property) => ({
        id: property.id,
        name: property.name,
        address: property.address,
        contractTemplate:
            property.contract_template &&
            typeof property.contract_template === "object" &&
            !Array.isArray(property.contract_template)
                ? property.contract_template
                : null,
        image:
            Array.isArray(property.images) && typeof property.images[0] === "string"
                ? property.images[0]
                : null,
        units: (unitsByProperty.get(property.id) ?? []).map((unit) => ({
            id: unit.id,
            name: unit.name,
            status: unit.status,
            rentAmount: Number(unit.rent_amount ?? 0),
        })),
    }));

    return NextResponse.json({ properties: propertyUnits });
}