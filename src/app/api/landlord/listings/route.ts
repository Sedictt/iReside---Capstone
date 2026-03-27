import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ListingScope, ListingStatus } from "@/types/database";

type CreateListingBody = {
    scope?: ListingScope;
    propertyId?: string;
    unitId?: string | null;
    title?: string;
    rentAmount?: number;
    status?: ListingStatus;
};

export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, address, images")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (propertiesError) {
        console.error("[listings GET] Properties query error:", propertiesError);
        return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
    }

    const propertyIds = (properties ?? []).map((property) => property.id);

    const { data: units, error: unitsError } = propertyIds.length
        ? await supabase
              .from("units")
              .select("id, property_id, name, status, rent_amount")
              .in("property_id", propertyIds)
              .order("created_at", { ascending: true })
        : { data: [], error: null };

    if (unitsError) {
        console.error("[listings GET] Units query error:", unitsError);
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const { data: listings, error: listingsError } = await supabase
        .from("listings")
        .select("id, property_id, unit_id, scope, title, rent_amount, status, views, leads, updated_at")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (listingsError) {
        console.error("[listings GET] Listings query error:", listingsError);
        return NextResponse.json({ error: "Failed to load listings." }, { status: 500 });
    }

    const propertyById = new Map((properties ?? []).map((property) => [property.id, property]));
    const unitsByProperty = new Map<string, Array<{ id: string; name: string; status: string; rent_amount: number }>>();
    const unitById = new Map((units ?? []).map((unit) => [unit.id, unit]));

    for (const unit of units ?? []) {
        const existing = unitsByProperty.get(unit.property_id) ?? [];
        existing.push(unit);
        unitsByProperty.set(unit.property_id, existing);
    }

    const listingItems = (listings ?? []).map((listing) => {
        const property = propertyById.get(listing.property_id);
        const unit = listing.unit_id ? unitById.get(listing.unit_id) : null;
        const image =
            Array.isArray(property?.images) && typeof property.images[0] === "string"
                ? property.images[0]
                : "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

        const statusColor =
            listing.status === "published"
                ? "from-emerald-500/20 to-emerald-500/0"
                : listing.status === "paused"
                ? "from-slate-500/20 to-slate-500/0"
                : "from-amber-500/20 to-amber-500/0";

        return {
            id: listing.id,
            propertyId: listing.property_id,
            unitId: listing.unit_id,
            title: listing.title,
            property: property?.name ?? "Unknown Property",
            unit: listing.scope === "property" ? "Apartment Listing" : unit?.name ?? "Unknown Unit",
            type: listing.scope,
            rent: Number(listing.rent_amount ?? 0),
            status: listing.status,
            views: listing.views ?? 0,
            leads: listing.leads ?? 0,
            updatedAt: listing.updated_at,
            image,
            address: property?.address ?? "Address unavailable",
            color: statusColor,
        };
    });

    const listingOptions = (properties ?? []).map((property) => ({
        id: property.id,
        name: property.name,
        address: property.address,
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

    return NextResponse.json({ listings: listingItems, options: listingOptions });
}

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateListingBody;
    const scope = body.scope;
    const propertyId = body.propertyId;
    const unitId = body.unitId ?? null;
    const rentAmount = Number(body.rentAmount ?? 0);
    const status = body.status ?? "draft";

    if (scope !== "property" && scope !== "unit") {
        return NextResponse.json({ error: "Invalid listing scope." }, { status: 400 });
    }

    if (!propertyId) {
        return NextResponse.json({ error: "Property is required." }, { status: 400 });
    }

    if (scope === "unit" && !unitId) {
        return NextResponse.json({ error: "Unit is required for a unit listing." }, { status: 400 });
    }

    if (!["draft", "published", "paused"].includes(status)) {
        return NextResponse.json({ error: "Invalid listing status." }, { status: 400 });
    }

    if (!Number.isFinite(rentAmount) || rentAmount < 0) {
        return NextResponse.json({ error: "Rent amount must be a valid non-negative number." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, name")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propertyError) {
        return NextResponse.json({ error: "Failed to validate property." }, { status: 500 });
    }

    if (!property) {
        return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
    }

    let resolvedUnitName: string | null = null;

    if (scope === "unit" && unitId) {
        const { data: unit, error: unitError } = await supabase
            .from("units")
            .select("id, name, status")
            .eq("id", unitId)
            .eq("property_id", property.id)
            .maybeSingle();

        if (unitError) {
            return NextResponse.json({ error: "Failed to validate unit." }, { status: 500 });
        }

        if (!unit) {
            return NextResponse.json({ error: "Unit not found for this property." }, { status: 404 });
        }

        if (unit.status !== "vacant") {
            return NextResponse.json({ error: "Only vacant units can be listed." }, { status: 400 });
        }

        resolvedUnitName = unit.name;
    }

    const title =
        body.title?.trim() ||
        (scope === "property"
            ? `${property.name} - Apartment Listing`
            : `${property.name} - ${resolvedUnitName ?? "Unit Listing"}`);

    const { data: insertedListing, error: insertError } = await supabase
        .from("listings")
        .insert({
            landlord_id: user.id,
            property_id: property.id,
            unit_id: scope === "unit" ? unitId : null,
            scope,
            title,
            rent_amount: rentAmount,
            status,
        })
        .select("id")
        .single();

    if (insertError) {
        return NextResponse.json({ error: `Failed to create listing: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ listingId: insertedListing.id });
}
