import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { generateUnitName } from "@/lib/unit-naming";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import { batchRenameSchema, findDuplicateName } from "@/lib/validation/schemas/properties.schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId, supabase } = authContext;

    const parsed = await parseJsonBody(request, batchRenameSchema);
    if (!parsed.ok) return parsed.response;
    const { propertyId, prefix, numberingStyle, startingNumber } = parsed.data;

    try {

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
            // `?? 1`, not `|| 1`: floor 0 is the ground floor and must keep its "G01" numbering.
            const f = u.floor ?? 1;
            const existing = floorGroups.get(f) ?? [];
            existing.push(u);
            floorGroups.set(f, existing);
        }

        const sortedFloors = Array.from(floorGroups.keys()).sort((a, b) => a - b);
        let overallIndex = 0;

        const renames: Array<{ id: string; name: string }> = [];

        for (const floorNum of sortedFloors) {
            const unitsOnFloor = floorGroups.get(floorNum) || [];
            let unitIndexOnFloor = 1;

            for (const unit of unitsOnFloor) {
                const newName = generateUnitName(overallIndex, floorNum, unitIndexOnFloor, {
                    prefix,
                    numberingStyle,
                    startingNumber,
                });

                renames.push({ id: unit.id, name: newName });

                unitIndexOnFloor++;
                overallIndex++;
            }
        }

        // Unit names are unique within a property: refuse a batch that would produce duplicates.
        const duplicateName = findDuplicateName(renames.map((r) => r.name));
        if (duplicateName) {
            return NextResponse.json(
                { error: `This numbering would give more than one unit the name "${duplicateName}". Choose a different style or starting number.` },
                { status: 409 }
            );
        }

        const results = await Promise.all(
            renames.map((r) =>
                (admin as any)
                    .from("units")
                    .update({ name: r.name })
                    .eq("id", r.id)
                    .eq("property_id", propertyId)
            )
        );
        const failed = results.find((result: { error?: { code?: string } | null }) => result?.error);
        if (failed) {
            console.error("Batch rename units error:", failed.error);
            return databaseErrorResponse(failed.error, "Failed to rename units.");
        }

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
            { error: "Failed to rename units." },
            { status: 500 }
        );
    }
}
