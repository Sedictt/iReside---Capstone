import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { PropertyService } from "@/lib/services/property";
import { PropertyNotFoundError } from "@/lib/services/property/property.errors";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authContext = await requireAuthenticatedUser(_request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;
    if (!propertyId) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }

    try {
        const propertyService = new PropertyService(supabase);
        const propertyDetail = await propertyService.getPropertyDetail(propertyId, userId);

        return NextResponse.json({
            property: {
                id: propertyDetail.id,
                name: propertyDetail.name,
                type: propertyDetail.type,
                address: propertyDetail.address,
                description: propertyDetail.description,
                amenities: propertyDetail.amenities,
                house_rules: propertyDetail.houseRules,
                images: propertyDetail.images,
                contract_template: propertyDetail.contractTemplate,
                total_units: propertyDetail.totalUnits,
                total_floors: propertyDetail.totalFloors,
                base_rent_amount: propertyDetail.baseRentAmount,
                unitCount: propertyDetail.unitCount,
                env_policy: propertyDetail.envPolicy
                    ? {
                          utility_split_method: propertyDetail.envPolicy.utilitySplitMethod,
                          utility_fixed_charge_amount: propertyDetail.envPolicy.utilityFixedChargeAmount,
                          max_occupants_per_unit: propertyDetail.envPolicy.maxOccupantsPerUnit,
                      }
                    : null,
            },
        });
    } catch (error) {
        if (error instanceof PropertyNotFoundError) {
            return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to load property details." }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const resolvedParams = await params;
    const propertyId = resolvedParams?.id;
    if (!propertyId) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }

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
        } = body;

        // Verify property belongs to landlord
        const { data: existingProp, error: checkError } = await supabase
            .from("properties")
            .select("id")
            .eq("id", propertyId)
            .eq("landlord_id", userId)
            .maybeSingle();

        if (checkError || !existingProp) {
            return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
        }

        const updatePayload: Record<string, any> = {
            type: type || "apartment",
            total_units: parseInt(String(total_units || 1), 10) || 1,
            total_floors: parseInt(String(total_floors || 1), 10) || 1,
            base_rent_amount: parseFloat(String(base_rent_amount || 0)) || 0,
            description: description ?? "",
            amenities: Array.isArray(amenities) ? amenities : [],
            house_rules: Array.isArray(house_rules) ? house_rules : [],
            images: Array.isArray(images) ? images : [],
            updated_at: new Date().toISOString(),
        };

        if (name && typeof name === "string" && name.trim()) {
            updatePayload.name = name.trim();
        }
        if (address && typeof address === "string" && address.trim()) {
            updatePayload.address = address.trim();
        }

        if (contract_mode === "generate") {
            updatePayload.contract_template = {
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
            updatePayload.contract_template = {
                contract_mode: "upload",
                file_name: contract_file || null,
                last_updated: new Date().toISOString(),
            };
        }

        const { error: updateError } = await (supabase as any)
            .from("properties")
            .update(updatePayload)
            .eq("id", propertyId)
            .eq("landlord_id", userId);

        if (updateError) {
            console.error("Failed to update property:", updateError);
            return NextResponse.json({ error: `Failed to update property: ${updateError.message}` }, { status: 500 });
        }

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
                environment_mode: "residential",
                max_occupants_per_unit: parseInt(String(occupancy_limit || 5), 10) || 5,
                utility_policy_mode: mapping.mode,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "property_id" }
        );

        return NextResponse.json({ success: true, propertyId });
    } catch (error) {
        console.error("Failed to update property:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update property." },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    return PUT(request, context);
}


