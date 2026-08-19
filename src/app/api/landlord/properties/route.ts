import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { generateUnitList } from "@/lib/unit-naming";

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const body = await request.json();
        const {
            name,
            address,
            type,
            total_units,
            total_floors,
            base_rent_amount,
            description,
            amenities,
            house_rules,
            images,
            contract_mode,
            contract_file,
            occupancy_limit,
            utility_billing,
            city,
            unit_prefix,
            numbering_style,
            starting_number,
        } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Property name is required." }, { status: 400 });
        }
        if (!address || typeof address !== "string" || !address.trim()) {
            return NextResponse.json({ error: "Property address is required." }, { status: 400 });
        }

        const insertPayload: Record<string, any> = {
            name: name.trim(),
            address: address.trim(),
            type: type || "apartment",
            total_units: parseInt(String(total_units || 1), 10) || 1,
            total_floors: parseInt(String(total_floors || 1), 10) || 1,
            base_rent_amount: parseFloat(String(base_rent_amount || 0)) || 0,
            description: description ?? "",
            amenities: Array.isArray(amenities) ? amenities : [],
            house_rules: Array.isArray(house_rules) ? house_rules : [],
            landlord_id: userId,
            city: city || "Valenzuela",
            images: Array.isArray(images) ? images : [],
        };

        if (contract_mode === "generate") {
            insertPayload.contract_template = {
                answers: {
                    rent: String(base_rent_amount || 0),
                    occupancy_limit: String(occupancy_limit || 5),
                    utility_split_method: utility_billing || "fixed_charge",
                    utilities: Array.isArray(amenities) ? amenities : [],
                },
                customClauses: (Array.isArray(house_rules) ? house_rules : []).map((rule: string, idx: number) => ({
                    id: idx,
                    title: "Building Rule",
                    description: rule,
                })),
                contract_mode: "generate",
                last_updated: new Date().toISOString(),
            };
        } else if (contract_mode === "upload") {
            insertPayload.contract_template = {
                contract_mode: "upload",
                file_name: contract_file || null,
                last_updated: new Date().toISOString(),
            };
        }

        const { data: newProp, error: insertError } = await (supabase as any)
            .from("properties")
            .insert(insertPayload)
            .select("id")
            .single();

        if (insertError || !newProp) {
            return NextResponse.json({ error: `Failed to create property: ${insertError?.message}` }, { status: 500 });
        }

        const propertyId = newProp.id;

        // Sync Environment Policy
        const policyMapping: Record<string, { mode: string; split: string }> = {
            fixed_charge: { mode: "included_in_rent", split: "fixed_charge" },
            individual_meter: { mode: "separate_metered", split: "individual_meter" },
            equal_per_head: { mode: "mixed", split: "equal_per_head" },
        };
        const mapping = policyMapping[utility_billing] || policyMapping.fixed_charge;

        const admin = createServiceRoleSupabaseClient();
        await (admin as any).from("property_environment_policies").upsert(
            {
                property_id: propertyId,
                environment_mode: type || "apartment",
                max_occupants_per_unit: parseInt(String(occupancy_limit || 5), 10) || 5,
                utility_policy_mode: mapping.mode,
                utility_split_method: mapping.split,
                needs_review: false,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "property_id" }
        );

        // Sync Units & Floor Configs
        const targetUnits = parseInt(String(total_units || 1), 10) || 1;
        const targetFloors = parseInt(String(total_floors || 1), 10) || 1;
        const targetRent = parseFloat(String(base_rent_amount || 0)) || 0;
        const propType = type || "apartment";

        const prefix = unit_prefix || (propType === "dormitory" ? "Room" : propType === "boarding_house" ? "Room" : "Unit");
        const generatedList = generateUnitList(targetUnits, targetFloors, {
            prefix,
            numberingStyle: numbering_style || "floor_based",
            startingNumber: starting_number || 101,
        });

        const unitsToCreate = generatedList.map((item) => ({
            property_id: propertyId,
            name: item.name,
            floor: item.floor,
            status: "vacant",
            rent_amount: targetRent,
            beds: 1,
            baths: 1,
        }));
        await (admin as any).from("units").insert(unitsToCreate);

        const floorConfigs = [];
        for (let i = 1; i <= targetFloors; i++) {
            floorConfigs.push({
                property_id: propertyId,
                floor_number: i,
                floor_key: `floor${i}`,
                display_name: `Floor ${i}`,
                sort_order: i,
            });
        }
        await (admin as any)
            .from("property_floor_configs")
            .upsert(floorConfigs, { onConflict: "property_id,floor_key" });

        return NextResponse.json({ success: true, propertyId });
    } catch (error) {
        console.error("Failed to create property:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create property." },
            { status: 500 }
        );
    }
}
