import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import { unitConfigSchema } from "@/lib/validation/schemas/properties.schema";

export const dynamic = "force-dynamic";

/** POST /api/landlord/unit-map/config
 *  Body: {
 *    propertyId: string;
 *    unitId?: string;
 *    applyToAll: boolean;
 *    beds?: number;
 *    baths?: number;
 *    sqft?: number | null;
 *    areaSqm?: number;
 *  }
 */
export async function POST(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, unitConfigSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, unitId, applyToAll, beds, baths, sqft, areaSqm } = parsed.data;

    try {
        // Verify property ownership
        const { data: property, error: propError } = await supabase
            .from("properties")
            .select("id")
            .eq("id", propertyId)
            .eq("landlord_id", userId)
            .maybeSingle();

        if (propError || !property) {
            return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
        }

        // Calculate sqft if areaSqm was supplied and sqft is undefined
        let resolvedSqft = sqft;
        if (resolvedSqft === undefined && typeof areaSqm === "number") {
            resolvedSqft = areaSqm > 0 ? Math.round(areaSqm / 0.092903) : null;
        }

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (typeof beds === "number") {
            updateData.beds = beds;
        }

        // units.baths is an integer column; decimals are rejected by the schema instead of failing in the DB.
        if (typeof baths === "number") {
            updateData.baths = baths;
        }

        if (resolvedSqft !== undefined) {
            updateData.sqft = resolvedSqft;
        }

        const admin = createServiceRoleSupabaseClient();

        if (applyToAll) {
            const { error: updateError, count } = await (admin
                .from("units")
                .update(updateData as any, { count: "exact" }) as any)
                .eq("property_id", propertyId);

            if (updateError) {
                console.error("Failed to update unit configuration:", updateError);
                return databaseErrorResponse(updateError, "Failed to update units.");
            }

            return NextResponse.json({
                success: true,
                applyToAll: true,
                count: count ?? 0,
                config: { beds: updateData.beds, baths: updateData.baths, sqft: updateData.sqft },
            });
        } else {
            const { error: updateError, count } = await (admin
                .from("units")
                .update(updateData as any, { count: "exact" }) as any)
                .eq("id", unitId as string)
                .eq("property_id", propertyId);

            if (updateError) {
                console.error("Failed to update unit configuration:", updateError);
                return databaseErrorResponse(updateError, "Failed to update unit.");
            }

            // The unit must belong to the (owned) property named in the request.
            if (count === 0) {
                return NextResponse.json({ error: "Unit not found in this property." }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                applyToAll: false,
                unitId,
                config: { beds: updateData.beds, baths: updateData.baths, sqft: updateData.sqft },
            });
        }
    } catch (err) {
        console.error("Unit configuration error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
