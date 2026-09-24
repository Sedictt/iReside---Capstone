import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

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

    try {
        const body = await request.json();
        const {
            propertyId,
            unitId,
            applyToAll = false,
            beds,
            baths,
            sqft,
            areaSqm,
        } = body as {
            propertyId: string;
            unitId?: string;
            applyToAll?: boolean;
            beds?: number;
            baths?: number;
            sqft?: number | null;
            areaSqm?: number;
        };

        if (!propertyId) {
            return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
        }

        if (!applyToAll && !unitId) {
            return NextResponse.json({ error: "unitId is required when not applying to all units" }, { status: 400 });
        }

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
            updateData.beds = Math.max(0, Math.round(beds));
        }

        if (typeof baths === "number") {
            updateData.baths = Math.max(0, baths);
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
                return NextResponse.json(
                    { error: `Failed to update units: ${updateError.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                applyToAll: true,
                count: count ?? 0,
                config: { beds: updateData.beds, baths: updateData.baths, sqft: updateData.sqft },
            });
        } else {
            const { error: updateError } = await (admin
                .from("units")
                .update(updateData as any) as any)
                .eq("id", unitId as string)
                .eq("property_id", propertyId);

            if (updateError) {
                return NextResponse.json(
                    { error: `Failed to update unit: ${updateError.message}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                applyToAll: false,
                unitId,
                config: { beds: updateData.beds, baths: updateData.baths, sqft: updateData.sqft },
            });
        }
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
