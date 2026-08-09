import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
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

