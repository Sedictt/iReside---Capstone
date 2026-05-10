import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { getTenantAmenities } from "@/lib/queries/amenities";

export async function GET() {
    const { user } = await requireUser();

    try {
        const amenities = await getTenantAmenities(user.id);

        // Extract unique categories from amenities
        const categories = ["All", ...new Set(amenities?.map((a) => a.type).filter(Boolean) || [])];

        return NextResponse.json({ amenities: amenities || [], categories });
    } catch (error) {
        console.error("[GET /api/tenant/amenities] Error:", error);
        const message = error instanceof Error ? error.message : "Failed to fetch amenities";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}