import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { parseJsonBody } from "@/lib/validation/server";
import { tenantProfilePatchSchema } from "@/lib/validation/schemas/account.schema";

/**
 * GET /api/tenant/profile
 * Get the current tenant's profile
 */
export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
        console.error("[tenant/profile GET] Error fetching profile:", profileError);
        return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    return NextResponse.json({ profile });
}

/**
 * PATCH /api/tenant/profile
 * Update the current tenant's profile
 * Used to mark account as claimed in user_security_settings.
 */
export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        // Only these fields are accepted; values are type/length/format checked.
        const parsed = await parseJsonBody(request, tenantProfilePatchSchema);
        if (!parsed.ok) return parsed.response;
        const { has_changed_password, ...otherFields } = parsed.data;

        // Build update payload - only allow certain fields to be updated
        const updates: Database["public"]["Tables"]["profiles"]["Update"] = {
            updated_at: new Date().toISOString(),
        };

        const shouldUpdateClaimState = typeof has_changed_password === "boolean";

        // Allow other safe public profile fields to be updated
        const allowedFields = ["full_name", "bio"] as const;
        for (const field of allowedFields) {
            if (otherFields[field] !== undefined) {
                updates[field] = otherFields[field];
            }
        }

        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId)
            .select()
            .single();

        if (updateError) {
            console.error("[tenant/profile PATCH] Error updating profile:", updateError);
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        if (shouldUpdateClaimState) {
            const admin = createServiceRoleSupabaseClient();
            const { error: securityError } = await (admin as any)
                .from("user_security_settings")
                .upsert(
                    {
                        profile_id: userId,
                        has_changed_password,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (securityError) {
                console.error("[tenant/profile PATCH] Error updating security settings:", securityError);
                return NextResponse.json({ error: "Failed to update account security state" }, { status: 500 });
            }
        }

        const shouldUpdatePrivateProfile = otherFields.phone !== undefined || otherFields.address !== undefined;
        if (shouldUpdatePrivateProfile) {
            const { error: privateError } = await (supabase as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: userId,
                        phone: otherFields.phone !== undefined ? otherFields.phone : updatedProfile.phone,
                        address: otherFields.address !== undefined ? otherFields.address : updatedProfile.address,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (privateError) {
                console.error("[tenant/profile PATCH] Error updating private profile:", privateError);
                return NextResponse.json({ error: "Failed to update private profile" }, { status: 500 });
            }
        }

        return NextResponse.json({ profile: updatedProfile });
    } catch (error) {
        console.error("[tenant/profile PATCH] Error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}

