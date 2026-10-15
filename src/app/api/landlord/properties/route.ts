import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { generateUnitList } from "@/lib/unit-naming";
import { databaseErrorResponse, parseJsonBody } from "@/lib/validation/server";
import { propertyCreateSchema } from "@/lib/validation/schemas/properties.schema";

const normalizeKey = (value: string | null | undefined) => (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        requireRole(authContext, "landlord", "admin");
    } catch (e) {
        return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseJsonBody(request, propertyCreateSchema);
    if (!parsed.ok) return parsed.response;
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
    } = parsed.data;

    try {
        // Duplicate-submission guard: the same landlord registering the same name at the same address.
        const { data: ownedProperties, error: ownedError } = await supabase
            .from("properties")
            .select("id, name, address")
            .eq("landlord_id", userId);
        if (ownedError) return databaseErrorResponse(ownedError, "Failed to create property.");
        const duplicate = (ownedProperties ?? []).find(
            (property) => normalizeKey(property.name) === normalizeKey(name) && normalizeKey(property.address) === normalizeKey(address)
        );
        if (duplicate) {
            const message = "You already have a property with this name and address.";
            return NextResponse.json({ error: message, fieldErrors: { name: message } }, { status: 409 });
        }

        const admin = createServiceRoleSupabaseClient();
        const { data: landlordProf } = await admin
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .maybeSingle();

        const landlordBranding = (landlordProf?.socials as Record<string, unknown>)?.branding;

        const insertPayload: Record<string, any> = {
            name,
            address,
            type,
            total_units,
            total_floors,
            base_rent_amount,
            description: description ?? "",
            amenities,
            house_rules,
            landlord_id: userId,
            city: city || "Valenzuela",
            images,
            ...(landlordBranding ? { map_decorations: { branding: landlordBranding } } : {}),
        };

        if (contract_mode === "generate") {
            insertPayload.contract_template = {
                answers: {
                    rent: String(base_rent_amount),
                    occupancy_limit: String(occupancy_limit),
                    utility_split_method: utility_billing,
                    utilities: amenities,
                },
                customClauses: house_rules.map((rule: string, idx: number) => ({
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
            console.error("Failed to create property:", insertError);
            return databaseErrorResponse(insertError, "Failed to create property.");
        }

        const propertyId = newProp.id;

        // Sync Environment Policy
        const policyMapping: Record<string, { mode: string; split: string }> = {
            fixed_charge: { mode: "included_in_rent", split: "fixed_charge" },
            individual_meter: { mode: "separate_metered", split: "individual_meter" },
            equal_per_head: { mode: "mixed", split: "equal_per_head" },
        };
        const mapping = policyMapping[utility_billing] || policyMapping.fixed_charge;
        await (admin as any).from("property_environment_policies").upsert(
            {
                property_id: propertyId,
                environment_mode: type,
                max_occupants_per_unit: occupancy_limit,
                utility_policy_mode: mapping.mode,
                utility_split_method: mapping.split,
                needs_review: false,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "property_id" }
        );

        // Sync Units & Floor Configs
        const targetUnits = total_units;
        const targetFloors = total_floors;
        const targetRent = base_rent_amount;
        const propType = type;

        const prefix = unit_prefix || (propType === "dormitory" ? "Room" : propType === "boarding_house" ? "Room" : "Unit");
        const generatedList = generateUnitList(targetUnits, targetFloors, {
            prefix,
            numberingStyle: numbering_style,
            startingNumber: starting_number,
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
            { error: "Failed to create property." },
            { status: 500 }
        );
    }
}
