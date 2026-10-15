import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { PropertyService } from "@/lib/services/property";

/**
 * GET /api/landlord/property-units
 * Returns the landlord's properties with their units.
 * Used by the Landlord Dashboard for Walk-ins, Invites, and context selection.
 * Replaces the retired /api/landlord/listings endpoint.
 */
interface CachedPropertyUnits {
    data: any;
    expiresAt: number;
}
const propertyUnitsMemoryCache = new Map<string, CachedPropertyUnits>();

export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const cached = propertyUnitsMemoryCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json(
            { properties: cached.data },
            { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" } }
        );
    }

    try {
        const propertyService = new PropertyService(supabase);
        const propertyUnits = await propertyService.getPropertiesWithUnits(userId);

        const formatted = propertyUnits.map((property) => ({
            id: property.id,
            name: property.name,
            address: property.address,
            contractTemplate: property.contractTemplate,
            image: property.images?.[0] ?? null,
            isMapSetupComplete: property.isMapSetupComplete ?? false,
            placedCount: property.placedCount ?? 0,
            hasTenants: property.hasTenants ?? false,
            units: property.units.map((unit) => ({
                id: unit.id,
                name: unit.name,
                status: unit.status,
                rentAmount: unit.rentAmount,
                hasOngoingApplication: unit.hasOngoingApplication ?? false,
                ongoingApplicationStatus: unit.ongoingApplicationStatus ?? null,
            })),
        }));

        propertyUnitsMemoryCache.set(userId, {
            data: formatted,
            expiresAt: Date.now() + 20_000,
        });

        return NextResponse.json(
            { properties: formatted },
            { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" } }
        );
    } catch (error: any) {
        console.error("[property-units GET] Error:", error);
        return NextResponse.json(
            { error: "Failed to load properties." },
            { status: 500 }
        );
    }
}