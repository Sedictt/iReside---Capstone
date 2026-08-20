import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const normalizedQuery = query.toLowerCase();
    const results: { id: string; type: string; title: string; subtitle: string; href: string }[] = [];

    // Parallel searches across properties, units, and maintenance requests
    const [propertiesRes, unitsRes, maintenanceRes] = await Promise.allSettled([
        supabase
            .from("properties")
            .select("id, name, address")
            .eq("landlord_id", userId)
            .or(`name.ilike.%${normalizedQuery}%,address.ilike.%${normalizedQuery}%`)
            .limit(4),
        supabase
            .from("units")
            .select("id, name, rent_amount, status, property:properties!inner(id, name, landlord_id)")
            .eq("property.landlord_id", userId)
            .ilike("name", `%${normalizedQuery}%`)
            .limit(4),
        supabase
            .from("maintenance_requests")
            .select("id, title, status, priority, property:properties!inner(id, name, landlord_id)")
            .eq("property.landlord_id", userId)
            .or(`title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
            .limit(4),
    ]);

    if (propertiesRes.status === "fulfilled" && propertiesRes.value.data) {
        propertiesRes.value.data.forEach((p: any) => {
            results.push({
                id: `prop-${p.id}`,
                type: "property",
                title: p.name,
                subtitle: p.address || "Property",
                href: `/landlord/properties?id=${p.id}`,
            });
        });
    }

    if (unitsRes.status === "fulfilled" && unitsRes.value.data) {
        unitsRes.value.data.forEach((u: any) => {
            results.push({
                id: `unit-${u.id}`,
                type: "unit",
                title: `Unit ${u.name}`,
                subtitle: `${u.property?.name || "Property"} • ₱${Number(u.rent_amount || 0).toLocaleString()}/mo • ${u.status}`,
                href: `/landlord/unit-map?unitId=${u.id}`,
            });
        });
    }

    if (maintenanceRes.status === "fulfilled" && maintenanceRes.value.data) {
        maintenanceRes.value.data.forEach((m: any) => {
            results.push({
                id: `maint-${m.id}`,
                type: "maintenance",
                title: m.title,
                subtitle: `Maintenance • ${m.priority} (${m.status}) - ${m.property?.name || ""}`,
                href: `/landlord/maintenance?id=${m.id}`,
            });
        });
    }

    return NextResponse.json({ results });
}