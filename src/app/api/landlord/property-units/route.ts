import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { PropertyService } from "@/lib/services/property";

/**
 * GET /api/landlord/property-units
 * Returns the landlord's properties with their units.
 * Used by the Landlord Dashboard for Walk-ins, Invites, and context selection.
 * Replaces the retired /api/landlord/listings endpoint.
 */
export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const propertyService = new PropertyService(supabase);
        const propertyUnits = await propertyService.getPropertiesWithUnits(userId);

        const formatted = propertyUnits.map((property) => ({
            id: property.id,
            name: property.name,
            address: property.address,
            contractTemplate: property.contractTemplate,
            image: property.images?.[0] ?? null,
            units: property.units.map((unit) => ({
                id: unit.id,
                name: unit.name,
                status: unit.status,
                rentAmount: unit.rentAmount,
            })),
        }));

        return NextResponse.json(
            { properties: formatted },
            { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" } }
        );
    } catch (error: any) {
        console.error("[property-units GET] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to load properties." },
            { status: 500 }
        );
    }
}