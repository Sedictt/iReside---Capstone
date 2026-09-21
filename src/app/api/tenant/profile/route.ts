import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { tenantProfilePatchSchema } from "@/lib/validation/profile";
import type { Database } from "@/types/database";

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
 * Used to update personal details, security settings, and normalized profile contacts.
 */
export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    try {
        const body = await request.json();

        // 0. Server-side Input Validation
        const validation = tenantProfilePatchSchema.safeParse(body);
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid input data";
            return NextResponse.json({
                error: firstError,
                details: validation.error.flatten().fieldErrors,
            }, { status: 400 });
        }

        const validData = validation.data;
        const shouldUpdateClaimState = typeof validData.has_changed_password === "boolean";

        // Build update payload - only allow validated fields
        const updates: Database["public"]["Tables"]["profiles"]["Update"] = {
            updated_at: new Date().toISOString(),
        };

        if (validData.full_name !== undefined) updates.full_name = validData.full_name;
        if (validData.bio !== undefined) updates.bio = validData.bio;

        // Merge socials and emergency contacts if provided
        if (validData.socials || validData.emergency_contact_name !== undefined || validData.emergency_contact_phone !== undefined) {
            const { data: currentProfile } = await supabase
                .from("profiles")
                .select("socials")
                .eq("id", userId)
                .maybeSingle();

            const currentSocials = (currentProfile?.socials && typeof currentProfile.socials === "object")
                ? (currentProfile.socials as Record<string, any>)
                : {};

            updates.socials = {
                ...currentSocials,
                ...(validData.socials || {}),
                emergency_contact_name: validData.emergency_contact_name !== undefined
                    ? validData.emergency_contact_name
                    : (currentSocials.emergency_contact_name || ""),
                emergency_contact_phone: validData.emergency_contact_phone !== undefined
                    ? validData.emergency_contact_phone
                    : (currentSocials.emergency_contact_phone || ""),
            };
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
                        has_changed_password: validData.has_changed_password,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (securityError) {
                console.error("[tenant/profile PATCH] Error updating security settings:", securityError);
                return NextResponse.json({ error: "Failed to update account security state" }, { status: 500 });
            }
        }

        const shouldUpdatePrivateProfile = validData.phone !== undefined || validData.address !== undefined;
        if (shouldUpdatePrivateProfile) {
            const { error: privateError } = await (supabase as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: userId,
                        phone: validData.phone !== undefined ? validData.phone : updatedProfile.phone,
                        address: validData.address !== undefined ? validData.address : updatedProfile.address,
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

