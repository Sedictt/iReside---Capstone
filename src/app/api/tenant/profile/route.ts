import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

/**
 * GET /api/tenant/profile
 * Get the current tenant's profile
 */
export async function GET() {
    const { user, supabase } = await requireUser();

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
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
    const { user, supabase } = await requireUser();

    try {
        const body = await request.json();
        const { has_changed_password, ...otherFields } = body;

        // Build update payload - only allow certain fields to be updated
        const updates: Database["public"]["Tables"]["profiles"]["Update"] = {
            updated_at: new Date().toISOString(),
        };

        const shouldUpdateClaimState = typeof has_changed_password === "boolean";

        // Allow other safe public profile fields to be updated
        const allowedFields = ["full_name", "bio"] as const;
        for (const field of allowedFields) {
            if (field in otherFields) {
                updates[field] = otherFields[field];
            }
        }

        const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id)
            .select()
            .single();

        if (updateError) {
            console.error("[tenant/profile PATCH] Error updating profile:", updateError);
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        if (shouldUpdateClaimState) {
            const { error: securityError } = await (createAdminClient() as any)
                .from("user_security_settings")
                .upsert(
                    {
                        profile_id: user.id,
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

        const shouldUpdatePrivateProfile = "phone" in otherFields || "address" in otherFields;
        if (shouldUpdatePrivateProfile) {
            const { error: privateError } = await (supabase as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: user.id,
                        phone: "phone" in otherFields ? otherFields.phone : updatedProfile.phone,
                        address: "address" in otherFields ? otherFields.address : updatedProfile.address,
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
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
