import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import { sendTenantCredentials, sendLandlordCredentialsCopy } from "@/lib/email";
import { generateSigningLink } from "@/lib/jwt";

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function createLeaseRecord(
    supabase: any,
    data: {
        unit_id: string;
        tenant_id: string;
        landlord_id: string;
        start_date: string;
        monthly_rent: number;
        security_deposit: number;
        landlord_signature: string;
        terms: Record<string, any>;
    }
) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 12);

    const { data: lease, error } = await supabase
        .from("leases")
        .insert({
            unit_id: data.unit_id,
            tenant_id: data.tenant_id,
            landlord_id: data.landlord_id,
            status: "pending_signature",
            start_date: data.start_date,
            end_date: endDate.toISOString().split('T')[0],
            monthly_rent: data.monthly_rent,
            security_deposit: data.security_deposit,
            terms: data.terms as Json,
            landlord_signature: data.landlord_signature,
        })
        .select()
        .single();

    if (error) throw new Error(`Lease creation failed: ${error.message}`);
    return lease;
}

export async function POST(
    request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: app, error: appError } = await supabase
        .from("applications")
        .select("id, status, applicant_name, applicant_email, applicant_phone, unit_id, move_in_date, landlord_id")
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (appError || !app) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (app.status === "approved") {
        return NextResponse.json({ error: "Already approved." }, { status: 400 });
    }

    const tenantEmail = app.applicant_email?.trim();
    const tenantName = app.applicant_name?.trim() || "Tenant";

    if (!tenantEmail) {
        return NextResponse.json({ error: "Applicant email required." }, { status: 400 });
    }

    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === tenantEmail.toLowerCase()
    );

    if (alreadyExists) {
        return NextResponse.json({ error: "User email already exists." }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: tenantEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: tenantName, role: "tenant" },
    });

    if (createError || !newUser?.user) {
        return NextResponse.json({ error: "Failed to create tenant account." }, { status: 500 });
    }

    const tenantId = newUser.user.id;

    try {
        await adminClient.from("profiles").upsert({
            id: tenantId,
            full_name: tenantName,
            email: tenantEmail,
            role: "tenant",
        }, { onConflict: "id" });

        const lease = await createLeaseRecord(adminClient, {
            unit_id: app.unit_id,
            tenant_id: tenantId,
            landlord_id: user.id,
            start_date: app.move_in_date || new Date().toISOString().split('T')[0],
            monthly_rent: 0,
            security_deposit: 0,
            landlord_signature: `bypass-${Date.now()}`,
            terms: {},
        });

        const signingLink = generateSigningLink(lease.id, tenantId);

        let inviteUrl: string | undefined;
        try {
            const linkResult = await adminClient.auth.admin.generateLink({
                type: "recovery",
                email: tenantEmail,
            });
            inviteUrl = (linkResult as any)?.properties?.action_link;
        } catch {
            // ignore
        }

        await supabase
            .from("applications")
            .update({ status: "approved", reviewed_at: new Date().toISOString() })
            .eq("id", applicationId);

        const { data: landlordProfile } = await adminClient
            .from("profiles")
            .select("email, full_name")
            .eq("id", user.id)
            .maybeSingle();

        try {
            await sendTenantCredentials({
                to: tenantEmail,
                tenantName,
                tempPassword,
                inviteUrl,
                leaseDetails: { property_name: "Property", unit_name: "Unit", move_in_date: app.move_in_date || "", monthly_rent: 0 },
                signingLink,
            });
        } catch (e) {
            console.error("Email failed:", e);
        }

        if (landlordProfile?.email) {
            try {
                await sendLandlordCredentialsCopy({
                    to: landlordProfile.email,
                    landlordName: landlordProfile.full_name ?? "Landlord",
                    tenantName,
                    tenantEmail,
                    tempPassword,
                    inviteUrl,
                });
            } catch (e) {
                console.error("Landlord email failed:", e);
            }
        }

        return NextResponse.json({
            success: true,
            lease_id: lease.id,
            tenant_account: { email: tenantEmail, tempPassword, inviteUrl },
        });
    } catch (err: any) {
        try {
            await adminClient.auth.admin.deleteUser(tenantId);
        } catch {}
        return NextResponse.json({ error: err.message || "Bypass failed." }, { status: 500 });
    }
}