import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateTempPassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user: landlord },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !landlord) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
        fullName,
        email,
        phone,
        propertyId,
        unitId,
        startDate,
        endDate,
        monthlyRent,
        securityDeposit,
    } = body;

    if (!fullName || !email || !propertyId || !unitId || !startDate || !endDate || !monthlyRent) {
        return NextResponse.json(
            { error: "Missing required fields." },
            { status: 400 }
        );
    }

    try {
        let tenantId: string;
        let tempPassword: string | null = null;

        // 1. Check if user already exists
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
            tenantId = existingUser.id;
        } else {
            // 2. Create tenant auth account
            tempPassword = generateTempPassword();
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    role: "tenant",
                },
            });

            if (createError) throw createError;
            tenantId = newUser.user.id;
        }

        // 3. Create/Upsert profile
        const { error: profileError } = await adminClient.from("profiles").upsert({
            id: tenantId,
            email,
            full_name: fullName,
            phone: phone || null,
            role: "tenant",
        });

        if (profileError) throw profileError;

        // 4. Create active lease
        const { data: lease, error: leaseError } = await adminClient
            .from("leases")
            .insert({
                unit_id: unitId,
                tenant_id: tenantId,
                landlord_id: landlord.id,
                start_date: startDate,
                end_date: endDate,
                monthly_rent: monthlyRent,
                security_deposit: securityDeposit || 0,
                status: "active",
            })
            .select()
            .single();

        if (leaseError) throw leaseError;

        // 5. Update unit status
        await adminClient
            .from("units")
            .update({ status: "occupied" })
            .eq("id", unitId);

        return NextResponse.json({
            success: true,
            tenantId,
            tempPassword,
            leaseId: lease.id,
            message: tempPassword 
                ? "Tenant added and account created." 
                : "Tenant added to existing account.",
        });

    } catch (error) {
        console.error("[manual-tenant] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add tenant manually." },
            { status: 500 }
        );
    }
}
