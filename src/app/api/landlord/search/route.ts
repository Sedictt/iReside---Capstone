import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results: { id: string; type: string; title: string; subtitle: string; href: string }[] = [];

    if (query.trim()) {
        const q = query.toLowerCase();

        const { data: properties, error } = await supabase
            .from("properties")
            .select("id, name, address")
            .eq("landlord_id", user.id)
            .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
            .limit(5);

        if (!error && properties) {
            properties.forEach((p) => {
                results.push({
                    id: `prop-${p.id}`,
                    type: "property",
                    title: p.name,
                    subtitle: p.address,
                    href: `/landlord/properties?id=${p.id}`,
                });
            });
        }
    }

    return NextResponse.json({ results });
}