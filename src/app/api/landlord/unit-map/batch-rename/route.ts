import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { generateUnitName, NumberingStyle } from "@/lib/unit-naming";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    try {
        const body = await request.json();
        const {
            propertyId,
            prefix = "Unit",
            numberingStyle = "floor_based",
            startingNumber = 101,
        } = body as {
            propertyId: string;
            prefix?: string;
            numberingStyle?: NumberingStyle;
            startingNumber?: number;
        };

        if (!propertyId) {
            return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
        }

        // Verify property ownership
        const { data: property, error: propError } = await supabase
            .from("properties")
            .select("id, total_floors, total_units")
            .eq("id", propertyId)
            .eq("landlord_id", userId)
            .maybeSingle();

        if (propError || !property) {
            return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
        }

        const admin = createServiceRoleSupabaseClient();

        // Fetch all units for this property
        const { data: units, error: unitsError } = await supabase
            .from("units")
            .select("id, name, floor")
            .eq("property_id", propertyId)
            .order("floor", { ascending: true })
            .order("name", { ascending: true });

        if (unitsError || !units || units.length === 0) {
            return NextResponse.json({ error: "No units found for this property." }, { status: 400 });
        }

        // Group units by floor to number them sequentially within floors or across floors
        const floorGroups = new Map<number, typeof units>();
        for (const u of units) {
            const f = u.floor || 1;
            const existing = floorGroups.get(f) ?? [];
            existing.push(u);
            floorGroups.set(f, existing);
        }

        const sortedFloors = Array.from(floorGroups.keys()).sort((a, b) => a - b);
        let overallIndex = 0;

        const updatePromises: Promise<any>[] = [];

        for (const floorNum of sortedFloors) {
            const unitsOnFloor = floorGroups.get(floorNum) || [];
            let unitIndexOnFloor = 1;

            for (const unit of unitsOnFloor) {
                const newName = generateUnitName(overallIndex, floorNum, unitIndexOnFloor, {
                    prefix,
                    numberingStyle,
                    startingNumber,
                });

                updatePromises.push(
                    (admin as any)
                        .from("units")
                        .update({ name: newName })
                        .eq("id", unit.id)
                );

                unitIndexOnFloor++;
                overallIndex++;
            }
        }

        await Promise.all(updatePromises);

        // Fetch updated units
        const { data: updatedUnits } = await supabase
            .from("units")
            .select("id, name, floor, status, rent_amount, beds, baths, sqft")
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });

        return NextResponse.json({
            success: true,
            units: updatedUnits ?? [],
        });
    } catch (error) {
        console.error("Batch rename units error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to rename units." },
            { status: 500 }
        );
    }
}
