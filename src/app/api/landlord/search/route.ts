import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const results: { id: string; type: string; title: string; subtitle: string; href: string }[] = [];

    if (query.trim()) {
        const normalizedQuery = query.toLowerCase();

        const { data: properties, error } = await supabase
            .from("properties")
            .select("id, name, address")
            .eq("landlord_id", userId)
            .or(`name.ilike.%${normalizedQuery}%,address.ilike.%${normalizedQuery}%`)
            .limit(5);

        if (!error && properties) {
            properties.forEach((propertyItem) => {
                results.push({
                    id: `prop-${propertyItem.id}`,
                    type: "property",
                    title: propertyItem.name,
                    subtitle: propertyItem.address,
                    href: `/landlord/properties?id=${propertyItem.id}`,
                });
            });
        }
    }

    return NextResponse.json({ results });
}