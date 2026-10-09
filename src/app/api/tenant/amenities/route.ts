import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { getTenantAmenities } from "@/lib/queries/amenities";

export async function GET() {
    const { user, supabase } = await requireUser();

    try {
        const amenities = await getTenantAmenities(user.id, supabase);

        // Extract unique categories from amenities
        const categories = ["All", ...new Set(amenities?.map((a) => a.type).filter(Boolean) || [])];

        return NextResponse.json({ amenities: amenities || [], categories });
    } catch (error) {
        console.error("[GET /api/tenant/amenities] Error:", error);
        return NextResponse.json({ error: "Failed to fetch amenities" }, { status: 500 });
    }
}