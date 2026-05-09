import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tenant/profile
 * Get the current tenant's profile
 */
export async function GET() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
 * Used to mark account as claimed (has_changed_password = true)
 */
export async function PATCH(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { has_changed_password, ...otherFields } = body;

        // Build update payload - only allow certain fields to be updated
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Handle has_changed_password specifically
        if (typeof has_changed_password === "boolean") {
            updates.has_changed_password = has_changed_password;
        }

        // Allow other safe profile fields to be updated
        const allowedFields = ["full_name", "phone", "bio", "address"];
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

        return NextResponse.json({ profile: updatedProfile });
    } catch (error) {
        console.error("[tenant/profile PATCH] Error:", error);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}