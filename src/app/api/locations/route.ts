import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ locations: [] });
    }

    const supabase = await createClient();

    // 1. Fetch from Master Geo Locations (Cities, Barangays, Streets)
    const geoPromise = supabase
        .from("geo_locations")
        .select("id, name, type, full_label")
        .ilike("full_label", `%${query}%`)
        .limit(6);

    // 2. Fetch from Historical Property Data (Landlord's previous listings)
    // We search for properties that match the query and return their address/name
    const propertyPromise = supabase
        .from("properties")
        .select("id, name, address, city")
        .or(`name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(6);

    const [geoResult, propertyResult] = await Promise.all([geoPromise, propertyPromise]);

    if (geoResult.error) {
        console.error("Geo search error:", geoResult.error);
        return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
    }

    if (propertyResult.error) {
        console.error("Property search error:", propertyResult.error);
    }

    // Combine results
    const combined = [
        ...(geoResult.data ?? []).map((loc) => ({
            id: `geo-${loc.id}`,
            label: loc.full_label,
            subLabel: loc.type.charAt(0).toUpperCase() + loc.type.slice(1),
            kind: "place" as const,
        })),
        ...(propertyResult.data ?? []).map((prop) => ({
            id: `prop-${prop.id}`,
            label: prop.name,
            subLabel: `${prop.address}${prop.city ? `, ${prop.city}` : ""}`,
            kind: "listing" as const,
        })),
    ];

    // De-duplicate by label to keep the list clean
    const seen = new Set();
    const unique = combined.filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return NextResponse.json({ locations: unique.slice(0, 10) });
}
