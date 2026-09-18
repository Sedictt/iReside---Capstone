import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { DEFAULT_PROPERTY_AMENITIES, normalizeAmenityName, isAmenityDuplicate } from "@/lib/constants/amenities";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        // 1. Gather all amenities ever used in landlord's properties
        const { data: propertiesData, error: propError } = await (supabase as any)
            .from("properties")
            .select("amenities")
            .eq("landlord_id", userId);

        if (propError) {
            console.error("[GET /api/landlord/amenities/custom] Error fetching properties:", propError);
        }

        // 2. Gather any amenities registered directly in the amenities table
        const { data: amenitiesTableData, error: amenError } = await (supabase as any)
            .from("amenities")
            .select("name")
            .eq("landlord_id", userId);

        if (amenError) {
            console.error("[GET /api/landlord/amenities/custom] Error fetching amenities table:", amenError);
        }

        const customAmenitiesSet: string[] = [];

        const addCandidate = (raw: string | null | undefined) => {
            if (!raw || typeof raw !== "string") return;
            const normalized = normalizeAmenityName(raw);
            if (
                normalized &&
                !isAmenityDuplicate(normalized, DEFAULT_PROPERTY_AMENITIES) &&
                !isAmenityDuplicate(normalized, customAmenitiesSet)
            ) {
                customAmenitiesSet.push(normalized);
            }
        };

        if (Array.isArray(propertiesData)) {
            for (const prop of propertiesData) {
                if (Array.isArray(prop.amenities)) {
                    for (const item of prop.amenities) {
                        addCandidate(typeof item === "string" ? item : item?.name);
                    }
                }
            }
        }

        if (Array.isArray(amenitiesTableData)) {
            for (const row of amenitiesTableData) {
                addCandidate(row.name);
            }
        }

        return NextResponse.json(
            { customAmenities: customAmenitiesSet },
            { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
    } catch (error) {
        console.error("[GET /api/landlord/amenities/custom] Unexpected error:", error);
        return NextResponse.json(
            { error: "Failed to fetch custom amenities", customAmenities: [] },
            { status: 500 }
        );
    }
}
