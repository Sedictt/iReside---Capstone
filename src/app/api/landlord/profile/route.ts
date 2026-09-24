import { NextResponse } from "next/server";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { landlordProfilePatchSchema } from "@/lib/validation/landlord-settings";
import { DISALLOWED_PRESEEDED_DATA, isPreseededPhone } from "@/lib/validation/brand-setup";

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

    const { userId, userEmail } = authContext;
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

        // Self-heal: ensure profiles.email reflects authentic claimed login email
        const authenticatedEmail = (userEmail || "").toLowerCase().trim();
        const currentProfileEmail = (profile.email || "").toLowerCase().trim();
        const isCurrentEmailDisallowed = !currentProfileEmail || 
            DISALLOWED_PRESEEDED_DATA.emails.includes(currentProfileEmail) || 
            currentProfileEmail.includes("turnkey.local");

        if (authenticatedEmail && authenticatedEmail.includes("@")) {
            const isAuthenticatedValid = !DISALLOWED_PRESEEDED_DATA.emails.includes(authenticatedEmail) && !authenticatedEmail.includes("turnkey.local");
            
            if (isCurrentEmailDisallowed || (isAuthenticatedValid && currentProfileEmail !== authenticatedEmail)) {
                try {
                    await admin
                        .from("profiles")
                        .update({
                            email: authenticatedEmail,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", userId);
                    profile.email = authenticatedEmail;
                } catch (syncErr) {
                    console.warn("[landlord/profile GET] Self-healing profile email sync note:", syncErr);
                    profile.email = authenticatedEmail;
                }
            }
        }

        const { data: privateProfile } = await (admin as any)
            .from("profile_private")
            .select("phone, address")
            .eq("profile_id", userId)
            .maybeSingle();

        // Self-heal: ensure pre-seeded starter phone numbers are removed from database
        const isProfilePhonePreseeded = isPreseededPhone(profile.phone);
        const isPrivatePhonePreseeded = isPreseededPhone(privateProfile?.phone);

        if (isProfilePhonePreseeded) {
            try {
                await admin
                    .from("profiles")
                    .update({ phone: null, updated_at: new Date().toISOString() })
                    .eq("id", userId);
                profile.phone = null;
            } catch (err) {
                console.warn("[landlord/profile GET] Self-healing profile phone note:", err);
                profile.phone = null;
            }
        }

        if (isPrivatePhonePreseeded) {
            try {
                await (admin as any)
                    .from("profile_private")
                    .update({ phone: null, updated_at: new Date().toISOString() })
                    .eq("profile_id", userId);
                if (privateProfile) privateProfile.phone = null;
            } catch (err) {
                console.warn("[landlord/profile GET] Self-healing private profile phone note:", err);
                if (privateProfile) privateProfile.phone = null;
            }
        }

        const rawPhone = privateProfile?.phone ?? profile.phone;
        const resolvedPhone = isPreseededPhone(rawPhone) ? null : rawPhone;

        const { data: businessProfile } = await (admin as any)
            .from("landlord_business_profiles")
            .select("business_name, business_permit_url, business_permit_number, business_permits")
            .eq("profile_id", userId)
            .maybeSingle();

        const socialsRecord = (profile.socials && typeof profile.socials === "object") 
            ? (profile.socials as Record<string, any>) 
            : {};

        // Self-heal: ensure business_name reflects authentic white-label brand name if empty or preseeded
        const rawBusinessName = (businessProfile?.business_name ?? profile.business_name ?? "").trim();
        const isBusinessNameDisallowed = !rawBusinessName || DISALLOWED_PRESEEDED_DATA.propertyNames.includes(rawBusinessName.toLowerCase());

        let resolvedBusinessName = !isBusinessNameDisallowed ? rawBusinessName : null;

        if (!resolvedBusinessName) {
            const whiteLabelBrandName = ((socialsRecord?.branding as any)?.propertyName || "").trim();
            if (whiteLabelBrandName && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(whiteLabelBrandName.toLowerCase())) {
                resolvedBusinessName = whiteLabelBrandName;
            } else {
                try {
                    const { data: landlordProp } = await admin
                        .from("properties")
                        .select("name")
                        .eq("landlord_id", userId)
                        .order("created_at", { ascending: true })
                        .limit(1)
                        .maybeSingle();
                    if (landlordProp?.name && !DISALLOWED_PRESEEDED_DATA.propertyNames.includes(landlordProp.name.toLowerCase().trim())) {
                        resolvedBusinessName = landlordProp.name.trim();
                    }
                } catch {
                    // Non-critical property lookup fallback
                }
            }

            if (resolvedBusinessName && resolvedBusinessName !== profile.business_name) {
                try {
                    await admin
                        .from("profiles")
                        .update({ business_name: resolvedBusinessName, updated_at: new Date().toISOString() })
                        .eq("id", userId);
                    profile.business_name = resolvedBusinessName;
                } catch (bizSyncErr) {
                    console.warn("[landlord/profile GET] Self-healing business_name sync note:", bizSyncErr);
                }
            }
        }

        const fullProfile = {
            ...profile,
            emergency_contact_name: socialsRecord.emergency_contact_name || (profile as any).emergency_contact_name || null,
            emergency_contact_phone: socialsRecord.emergency_contact_phone || (profile as any).emergency_contact_phone || null,
            phone: resolvedPhone,
            address: privateProfile?.address ?? profile.address,
            business_name: resolvedBusinessName,
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

        // 0. Server-side Input Validation
        const validation = landlordProfilePatchSchema.safeParse(body);
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid input data";
            return NextResponse.json({ 
                error: firstError, 
                details: validation.error.flatten().fieldErrors 
            }, { status: 400 });
        }

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
        if (body.email !== undefined && body.email.trim()) {
            profileUpdates.email = body.email.toLowerCase().trim();
        }
        if (body.phone !== undefined) {
            const cleanPhone = body.phone ? body.phone.trim() : null;
            profileUpdates.phone = cleanPhone && !isPreseededPhone(cleanPhone) ? cleanPhone : null;
        }
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
            const cleanPhone = body.phone !== undefined ? (body.phone && !isPreseededPhone(body.phone.trim()) ? body.phone.trim() : null) : undefined;
            const finalPhone = cleanPhone !== undefined ? cleanPhone : (isPreseededPhone(updatedProfile.phone) ? null : updatedProfile.phone);
            const { error: privateError } = await (admin as any)
                .from("profile_private")
                .upsert(
                    {
                        profile_id: userId,
                        phone: finalPhone,
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

        // 6. Update user metadata and email in auth.users
        try {
            const authUpdates: Record<string, any> = {
                user_metadata: {
                    emergency_contact_name: body.emergency_contact_name,
                    emergency_contact_phone: body.emergency_contact_phone,
                    notification_preferences: body.notification_preferences,
                }
            };
            if (body.email !== undefined && body.email.trim()) {
                authUpdates.email = body.email.toLowerCase().trim();
                authUpdates.email_confirm = true;
            }
            await admin.auth.admin.updateUserById(userId, authUpdates);
        } catch (metaErr) {
            console.warn("[landlord/profile PATCH] auth update note:", metaErr);
        }

        const consolidated = {
            ...updatedProfile,
            email: profileUpdates.email ?? updatedProfile.email,
            emergency_contact_name: mergedSocials.emergency_contact_name,
            emergency_contact_phone: mergedSocials.emergency_contact_phone,
            phone: profileUpdates.phone !== undefined ? profileUpdates.phone : (isPreseededPhone(updatedProfile.phone) ? null : updatedProfile.phone),
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
