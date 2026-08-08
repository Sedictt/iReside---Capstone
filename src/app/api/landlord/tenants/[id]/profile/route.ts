import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/landlord/tenants/[tenantId]/profile
 *
 * Fetches a tenant's full profile with their active lease info.
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: tenantId } = await context.params;
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    // Fetch tenant profile
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            email,
            role,
            avatar_url,
            avatar_bg_color,
            bio,
            website,
            cover_url,
            socials,
            created_at
        `)
        .eq("id", tenantId)
        .maybeSingle();

    if (profileError) {
        console.error("[tenant-profile] Failed to load profile:", profileError);
        return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch active lease for this tenant (belonging to this landlord)
    const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
            id,
            status,
            start_date,
            end_date,
            monthly_rent,
            unit:units!inner (
                id,
                name,
                property:properties!inner (
                    id,
                    name,
                    address,
                    city
                )
            )
        `)
        .eq("tenant_id", tenantId)
        .eq("landlord_id", userId)
        .in("status", ["active", "expired"])
        .maybeSingle();

    if (leaseError) {
        console.error("[tenant-profile] Failed to load lease:", leaseError);
        return NextResponse.json({ error: "Failed to load lease" }, { status: 500 });
    }

    const activeLease = lease
        ? {
              id: lease.id,
              status: lease.status,
              start_date: lease.start_date,
              end_date: lease.end_date,
              monthly_rent: lease.monthly_rent,
              unit: lease.unit
                  ? {
                        id: lease.unit.id,
                        name: lease.unit.name,
                        property: lease.unit.property,
                    }
                  : null,
          }
        : null;

    let privateProfile: { phone: string | null; address: string | null } | null = null;
    if (activeLease) {
        const { data, error } = await (createAdminClient() as any)
            .from("profile_private")
            .select("phone, address")
            .eq("profile_id", tenantId)
            .maybeSingle();

        if (error) {
            console.error("[tenant-profile] Failed to load private profile:", error);
            return NextResponse.json({ error: "Failed to load private profile" }, { status: 500 });
        }

        privateProfile = data;
    }

    const responseProfile = {
        ...profile,
        phone: privateProfile?.phone ?? null,
        address: privateProfile?.address ?? null,
    };

    return NextResponse.json({ profile: responseProfile, activeLease });
}
