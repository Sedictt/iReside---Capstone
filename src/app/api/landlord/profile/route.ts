import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

/**
 * GET /api/landlord/profile
 * Get current authenticated landlord profile with normalized fields
 */
export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    
    try {
        requireRole(authContext, "landlord", "admin");
    } catch (e: any) {
        return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = authContext;
    const admin = createServiceRoleSupabaseClient();

    try {
        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const { data: privateProfile } = await (admin as any)
            .from("profile_private")
            .select("phone, address")
            .eq("profile_id", userId)
            .maybeSingle();

        const { data: businessProfile } = await (admin as any)
            .from("landlord_business_profiles")
            .select("business_name, business_permit_url, business_permit_number, business_permits")
            .eq("profile_id", userId)
            .maybeSingle();

        const socialsRecord = (profile.socials && typeof profile.socials === "object") 
            ? (profile.socials as Record<string, any>) 
            : {};

        const fullProfile = {
            ...profile,
            emergency_contact_name: socialsRecord.emergency_contact_name || (profile as any).emergency_contact_name || null,
            emergency_contact_phone: socialsRecord.emergency_contact_phone || (profile as any).emergency_contact_phone || null,
            phone: privateProfile?.phone ?? profile.phone,
            address: privateProfile?.address ?? profile.address,
            business_name: businessProfile?.business_name ?? profile.business_name,
            business_permit_url: businessProfile?.business_permit_url ?? profile.business_permit_url,
            business_permit_number: businessProfile?.business_permit_number ?? profile.business_permit_number,
            business_permits: businessProfile?.business_permits ?? profile.business_permits,
        };

        return NextResponse.json({ profile: fullProfile });
    } catch (err: any) {
        console.error("[landlord/profile GET] Error:", err);
        return NextResponse.json({ error: "Failed to load landlord profile" }, { status: 500 });
    }
}

/**
 * PATCH /api/landlord/profile
 * Authoritatively save all landlord profile, contact, emergency contact,
 * and business identity fields across profiles, profile_private,
 * and landlord_business_profiles tables.
 */
export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;

    try {
        requireRole(authContext, "landlord", "admin");
    } catch (e: any) {
        return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = authContext;
    const admin = createServiceRoleSupabaseClient();

    try {
        const body = await request.json();

        // 1. Fetch current profile state
        const { data: currentProfile, error: fetchErr } = await admin
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (fetchErr || !currentProfile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const currentSocials = (currentProfile.socials && typeof currentProfile.socials === "object")
            ? (currentProfile.socials as Record<string, any>)
            : {};

        // Merge socials and emergency contact
        const mergedSocials = {
            ...currentSocials,
            ...(body.socials || {}),
            emergency_contact_name: body.emergency_contact_name !== undefined 
                ? body.emergency_contact_name 
                : (currentSocials.emergency_contact_name || ""),
            emergency_contact_phone: body.emergency_contact_phone !== undefined 
                ? body.emergency_contact_phone 
                : (currentSocials.emergency_contact_phone || ""),
            notification_preferences: body.notification_preferences !== undefined
                ? body.notification_preferences
                : (currentSocials.notification_preferences || {}),
        };

        // 2. Prepare profile updates
        const profileUpdates: Record<string, any> = {
            updated_at: new Date().toISOString(),
            socials: mergedSocials,
        };

        if (body.full_name !== undefined) profileUpdates.full_name = body.full_name;
        if (body.business_name !== undefined) profileUpdates.business_name = body.business_name;
        if (body.phone !== undefined) profileUpdates.phone = body.phone;
        if (body.address !== undefined) profileUpdates.address = body.address;
        if (body.website !== undefined) profileUpdates.website = body.website;
        if (body.bio !== undefined) profileUpdates.bio = body.bio;
        if (body.business_permit_number !== undefined) profileUpdates.business_permit_number = body.business_permit_number;

        // 3. Update public.profiles
        const { data: updatedProfile, error: updateError } = await (admin as any)
            .from("profiles")
            .update(profileUpdates)
            .eq("id", userId)
            .select()
            .single();

        if (updateError) {
            console.error("[landlord/profile PATCH] profiles update error:", updateError);
            return NextResponse.json({ error: updateError.message || "Failed to update profile" }, { status: 500 });
        }

        // 4. Update profile_private (phone, address)
        if (body.phone !== undefined || body.address !== undefined) {
            const { error: privateError } = await (admin as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: userId,
                        phone: body.phone ?? updatedProfile.phone,
                        address: body.address ?? updatedProfile.address,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (privateError) {
                console.warn("[landlord/profile PATCH] profile_private upsert warning:", privateError);
            }
        }

        // 5. Update landlord_business_profiles (business_name, business_permit_number)
        if (body.business_name !== undefined || body.business_permit_number !== undefined) {
            const { error: busError } = await (admin as any)
                .from("landlord_business_profiles")
                .upsert(
                    {
                        profile_id: userId,
                        business_name: body.business_name ?? updatedProfile.business_name,
                        business_permit_number: body.business_permit_number ?? (updatedProfile as any).business_permit_number,
                        business_permit_url: (updatedProfile as any).business_permit_url,
                        business_permits: (updatedProfile as any).business_permits ?? [],
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "profile_id" }
                );

            if (busError) {
                console.warn("[landlord/profile PATCH] landlord_business_profiles upsert warning:", busError);
            }
        }

        // 6. Update user metadata in auth.users
        try {
            await admin.auth.admin.updateUserById(userId, {
                user_metadata: {
                    emergency_contact_name: body.emergency_contact_name,
                    emergency_contact_phone: body.emergency_contact_phone,
                    notification_preferences: body.notification_preferences,
                }
            });
        } catch (metaErr) {
            console.warn("[landlord/profile PATCH] auth metadata update note:", metaErr);
        }

        const consolidated = {
            ...updatedProfile,
            emergency_contact_name: mergedSocials.emergency_contact_name,
            emergency_contact_phone: mergedSocials.emergency_contact_phone,
            phone: body.phone ?? updatedProfile.phone,
            address: body.address ?? updatedProfile.address,
            business_name: body.business_name ?? updatedProfile.business_name,
            business_permit_number: body.business_permit_number ?? (updatedProfile as any).business_permit_number,
        };

        return NextResponse.json({ success: true, profile: consolidated });
    } catch (err: any) {
        console.error("[landlord/profile PATCH] Unhandled error:", err);
        return NextResponse.json({ error: err?.message || "Internal server error saving landlord profile" }, { status: 500 });
    }
}
