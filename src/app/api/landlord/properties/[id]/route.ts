import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const propertyId = resolvedParams?.id;
    if (!propertyId) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, name, type, address, description, amenities, images, contract_template")
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

    return NextResponse.json({
        property: {
            ...property,
            unitCount: unitCount ?? 1,
        },
    });
}
