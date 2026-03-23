import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
        unit_id,
        applicant_name,
        applicant_phone,
        applicant_email,
        employment_info,
        requirements_checklist,
        message,
    } = body;

    if (!unit_id || !applicant_name || !applicant_email) {
        return NextResponse.json(
            { error: "unit_id, applicant_name, and applicant_email are required." },
            { status: 400 }
        );
    }

    // Verify landlord owns this unit
    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, property_id, properties!inner(owner_id)")
        .eq("id", unit_id)
        .single();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    const property = unit.properties as unknown as { owner_id: string };
    if (property.owner_id !== user.id) {
        return NextResponse.json({ error: "You do not own this unit." }, { status: 403 });
    }

    // Determine status from requirements checklist
    const checklist = requirements_checklist || {};
    const allComplete = Object.values(checklist).length > 0 &&
        Object.values(checklist).every((v) => v === true);
    const status = allComplete ? "approved" : "pending";

    const { data: application, error: insertError } = await supabase
        .from("applications")
        .insert({
            unit_id,
            landlord_id: user.id,
            created_by: user.id,
            applicant_name,
            applicant_phone: applicant_phone || null,
            applicant_email,
            employment_info: employment_info || {},
            requirements_checklist: checklist,
            status,
            message: message || null,
            employment_status: employment_info?.occupation || null,
            monthly_income: employment_info?.monthly_income || null,
        } as any)
        .select("id, status, created_at")
        .single();

    if (insertError) {
        console.error("Walk-in application insert error:", insertError);
        return NextResponse.json(
            { error: "Failed to create application." },
            { status: 500 }
        );
    }

    return NextResponse.json({ application }, { status: 201 });
}

export async function PATCH(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { application_id, requirements_checklist, employment_info, status } = body;

    if (!application_id) {
        return NextResponse.json({ error: "application_id is required." }, { status: 400 });
    }

    // Verify the landlord owns this application
    const { data: existing, error: fetchError } = await (supabase
        .from("applications")
        .select("id, created_by, landlord_id") as any)
        .eq("id", application_id)
        .single();

    if (fetchError || !existing) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (existing.created_by !== user.id && existing.landlord_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized to update this application." }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (requirements_checklist) updates.requirements_checklist = requirements_checklist;
    if (employment_info) {
        updates.employment_info = employment_info;
        if (employment_info.occupation) updates.employment_status = employment_info.occupation;
        if (employment_info.monthly_income) updates.monthly_income = employment_info.monthly_income;
    }
    if (status) updates.status = status;

    const { data: updated, error: updateError } = await supabase
        .from("applications")
        .update(updates as any)
        .eq("id", application_id)
        .select("id, status, requirements_checklist, updated_at")
        .single();

    if (updateError) {
        console.error("Walk-in application update error:", updateError);
        return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
    }

    return NextResponse.json({ application: updated });
}
