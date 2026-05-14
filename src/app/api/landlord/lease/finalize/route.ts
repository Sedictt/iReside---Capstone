import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/auth";
import { generateMonthlyInvoices } from "@/lib/billing/server";

function generateTempPassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const body = await request.json();
    const {
        application_id,
        unit_id,
        lease_start,
        lease_end,
        monthly_rent,
        security_deposit,
        landlord_signature,
        tenant_signature,
    } = body;

    if (!application_id || !unit_id || !lease_start || !lease_end || !monthly_rent) {
        return NextResponse.json(
            { error: "application_id, unit_id, lease_start, lease_end, and monthly_rent are required." },
            { status: 400 }
        );
    }

    if (!landlord_signature || !tenant_signature) {
        return NextResponse.json(
            { error: "Both landlord and tenant signatures are required." },
            { status: 400 }
        );
    }

    // Fetch the application to get tenant info
    const { data: application, error: appError } = await (supabase
        .from("applications")
        .select("id, applicant_name, applicant_email, applicant_phone, landlord_id, status") as any)
        .eq("id", application_id)
        .single();

    if (appError || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // --- Environment Validations ---
    // Fetch unit to get property_id
    const { data: unit, error: unitError } = await adminClient
        .from("units")
        .select("property_id")
        .eq("id", unit_id)
        .single();

    if (unitError || !unit) {
        return NextResponse.json({ error: "Unit not found." }, { status: 404 });
    }

    // Fetch property environment policy
    const policyQuery = adminClient
        .from("property_environment_policies" as any)
        .select("needs_review, max_occupants_per_unit");
    const { data: policy } = await policyQuery
        .eq("property_id", unit.property_id)
        .single() as any;
    
    if (policy?.needs_review) {
        return NextResponse.json(
            { error: "Action Blocked: Property environment profile needs your review. Please review policy configurations in the dashboard." },
            { status: 400 }
        );
    }

    // Fetch unit environment override (if any)
    const { data: override } = await (adminClient as any)
        .from("unit_environment_overrides")
        .select("max_occupants_per_unit")
        .eq("unit_id", unit_id)
        .single();

    const maxOccupants = override?.max_occupants_per_unit ?? policy?.max_occupants_per_unit;
    const projectedOccupants = body.occupant_count || 1;

    if (maxOccupants && projectedOccupants > maxOccupants) {
        return NextResponse.json(
            { error: `Projected occupants (${projectedOccupants}) exceeds the defined capacity limit for this unit (${maxOccupants}).` },
            { status: 400 }
        );
    }
    // --------------------------------

    if (application.landlord_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (application.status !== "approved") {
        return NextResponse.json(
            { error: "Application must be approved before creating a lease." },
            { status: 400 }
        );
    }

    const tenantEmail = application.applicant_email;
    const tenantName = application.applicant_name || "Tenant";

    if (!tenantEmail) {
        return NextResponse.json(
            { error: "Applicant email is required to create a tenant account." },
            { status: 400 }
        );
    }

    // 1. Create tenant auth account via admin SDK
    const tempPassword = generateTempPassword();

    const { data: newUser, error: createUserError } = await adminClient.auth.admin.createUser({
        email: tenantEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: tenantName,
            role: "tenant",
        },
    });

    if (createUserError) {
        // If user already exists, try to fetch them
        if (createUserError.message?.includes("already been registered")) {
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const existingUser = existingUsers?.users?.find(
                (u) => u.email === tenantEmail
            );
            if (existingUser) {
                // Use existing user instead
                return await finalizeLease({
                    supabase,
                    tenantId: existingUser.id,
                    tenantName,
                    tenantEmail,
                    tenantPhone: application.applicant_phone,
                    unitId: unit_id,
                    applicationId: application_id,
                    leaseStart: lease_start,
                    leaseEnd: lease_end,
                    monthlyRent: monthly_rent,
                    securityDeposit: security_deposit,
                    landlordSignature: landlord_signature,
                    tenantSignature: tenant_signature,
                    landlordId: user.id,
                    tempPassword: null,
                });
            }
        }
        console.error("Create tenant user error:", createUserError);
        return NextResponse.json(
            { error: "Failed to create tenant account: " + createUserError.message },
            { status: 500 }
        );
    }

    // 2. Create profile for the new tenant
    const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
            id: newUser.user.id,
            email: tenantEmail,
            full_name: tenantName,
            phone: application.applicant_phone || null,
            role: "tenant",
        });

    if (profileError) {
        console.error("Create tenant profile error:", profileError);
    }

    return await finalizeLease({
        supabase,
        tenantId: newUser.user.id,
        tenantName,
        tenantEmail,
        tenantPhone: application.applicant_phone,
        unitId: unit_id,
        applicationId: application_id,
        leaseStart: lease_start,
        leaseEnd: lease_end,
        monthlyRent: monthly_rent,
        securityDeposit: security_deposit,
        landlordSignature: landlord_signature,
        tenantSignature: tenant_signature,
        landlordId: user.id,
        tempPassword,
    });
}

interface FinalizeLeaseParams {
    supabase: Awaited<ReturnType<typeof createClient>>;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone: string | null;
    unitId: string;
    applicationId: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    securityDeposit?: number;
    landlordSignature: string;
    tenantSignature: string;
    landlordId: string;
    tempPassword: string | null;
}

async function finalizeLease(params: FinalizeLeaseParams) {
    const adminClient = createAdminClient();

    // 3. Create the lease
    const { data: lease, error: leaseError } = await adminClient
        .from("leases")
        .insert({
            unit_id: params.unitId,
            tenant_id: params.tenantId,
            landlord_id: params.landlordId,
            start_date: params.leaseStart,
            end_date: params.leaseEnd,
            monthly_rent: params.monthlyRent,
            security_deposit: params.securityDeposit || 0,
            status: "active",
        } as any)
        .select("id, status")
        .single();

    if (leaseError) {
        console.error("Create lease error:", leaseError);
        return NextResponse.json(
            { error: "Failed to create lease." },
            { status: 500 }
        );
    }

    // 4. Update application: link tenant, set status to approved, mark lease_signed
    await adminClient
        .from("applications")
        .update({
            applicant_id: params.tenantId,
            status: "approved",
            compliance_checklist: {
                valid_id: true,
                income_verified: true,
                application_completed: true,
                background_checked: true,
                payment_received: true,
                lease_signed: true,
                inspection_done: true,
            },
        } as any)
        .eq("id", params.applicationId);

    // 5. Update unit status to occupied
    await adminClient
        .from("units")
        .update({ status: "occupied" })
        .eq("id", params.unitId);

    // 6. Auto-generate first month's payment for the new lease
    try {
        const billingMonth = new Date(params.leaseStart).toISOString().slice(0, 7); // "2026-05"
        await generateMonthlyInvoices(
            adminClient,
            params.landlordId,
            billingMonth,
            [lease.id]
        );
    } catch (autoGenError) {
        console.error("Auto-generate payment error:", autoGenError);
    }

    return NextResponse.json({
        success: true,
        lease,
        tenant: {
            id: params.tenantId,
            name: params.tenantName,
            email: params.tenantEmail,
            tempPassword: params.tempPassword,
        },
        message: params.tempPassword
            ? `Tenant account created. Temporary password: ${params.tempPassword}. Please share these credentials with the tenant.`
            : `Lease created for existing tenant account (${params.tenantEmail}).`,
    });
}
