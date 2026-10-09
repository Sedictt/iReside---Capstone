import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseJsonBody } from "@/lib/validation/server";
import { manualTenantSchema } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { generateTemporaryPassword } from "@/lib/security/passwords";


/** Temporary password from a CSPRNG (see lib/security/passwords). */
function generateTempPassword(length = 12): string {
    return generateTemporaryPassword(length);
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId } = authContext;
    const adminClient = createAdminClient();

    const parsed = await parseJsonBody(request, manualTenantSchema);
    if (!parsed.ok) return parsed.response;
    const {
        fullName: normalizedName,
        email: normalizedEmail,
        phone,
        propertyId: normalizedPropertyId,
        unitId: normalizedUnitId,
        startDate,
        endDate,
        monthlyRent: numMonthlyRent,
        securityDeposit: numSecurityDeposit,
        advancePayment: numAdvancePayment,
        advanceMonths: numAdvanceMonths,
        advancePaid,
        securityDepositMonths: numDepositMonths,
        securityDepositPaid,
    } = parsed.data;
    const normalizedPhone = phone ?? "";
    // Exact (case-insensitive) match: escape LIKE wildcards so "a_b@x.com" cannot match "axb@x.com".
    const emailLikePattern = normalizedEmail.replace(/[\\%_]/g, (c) => `\\${c}`);

    try {
        // --- Verify Unit Ownership & Availability ---
        const { data: unit, error: unitError } = await adminClient
            .from("units")
            .select("id, property_id, status, properties!inner(landlord_id)")
            .eq("id", normalizedUnitId)
            .maybeSingle();

        if (unitError || !unit) {
            return NextResponse.json({ error: "Selected unit was not found." }, { status: 404 });
        }

        // Ownership must be proven, not assumed when the join is missing.
        const propertyLandlordId = (unit as any)?.properties?.landlord_id;
        if (propertyLandlordId !== userId) {
            return NextResponse.json({ error: "Unauthorized access to this property unit." }, { status: 403 });
        }

        if ((unit as any).property_id !== normalizedPropertyId) {
            return NextResponse.json(
                { error: "Selected unit does not belong to the selected property.", fieldErrors: { unitId: "Selected unit does not belong to the selected property." } },
                { status: 400 }
            );
        }

        if ((unit as any).status === "occupied") {
            return NextResponse.json(
                { error: "Selected unit is currently occupied.", fieldErrors: { unitId: "Selected unit is currently occupied." } },
                { status: 409 }
            );
        }

        // A unit can only carry one live lease at a time.
        const { data: liveLease } = await adminClient
            .from("leases")
            .select("id")
            .eq("unit_id", normalizedUnitId)
            .in("status", ["active", "pending_signature", "pending_tenant_signature", "pending_landlord_signature"])
            .limit(1)
            .maybeSingle();

        if (liveLease) {
            return NextResponse.json(
                { error: "This unit already has an active or pending lease.", fieldErrors: { unitId: "This unit already has an active or pending lease." } },
                { status: 409 }
            );
        }

        let tenantId: string;
        let tempPassword: string | null = null;

        // 1. Check if user already exists
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        let existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
        );

        if (!existingUser) {
            // Also check profiles table in case listUsers was paginated
            const { data: existingProfile } = await adminClient
                .from("profiles")
                .select("id, role")
                .ilike("email", emailLikePattern)
                .maybeSingle();

            if (existingProfile?.id) {
                if ((existingProfile as any).role === "landlord") {
                    return NextResponse.json(
                        { error: "This email belongs to a landlord account and cannot be added as a tenant.", fieldErrors: { email: "This email belongs to a landlord account." } },
                        { status: 409 }
                    );
                }
                tenantId = existingProfile.id;
            } else {
                // 2. Create tenant auth account
                tempPassword = generateTempPassword();
                const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                    email: normalizedEmail,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: normalizedName,
                        role: "tenant",
                        onboarding_source: "manual_quick_add",
                    },
                });

                if (createError) {
                    if (createError.message?.toLowerCase().includes("already registered") || (createError as any).code === "email_exists") {
                        const { data: fallbackUser } = await adminClient.from("profiles").select("id").ilike("email", emailLikePattern).maybeSingle();
                        if (fallbackUser?.id) {
                            tenantId = fallbackUser.id;
                        } else {
                            throw createError;
                        }
                    } else {
                        throw createError;
                    }
                } else {
                    tenantId = newUser.user.id;
                }
            }
        } else {
            const existingRole = (existingUser.user_metadata as Record<string, unknown> | undefined)?.role;
            if (existingRole === "landlord") {
                return NextResponse.json(
                    { error: "This email belongs to a landlord account and cannot be added as a tenant.", fieldErrors: { email: "This email belongs to a landlord account." } },
                    { status: 409 }
                );
            }
            tenantId = existingUser.id;
        }

        // 3. Create / Upsert profile
        const { error: profileError } = await adminClient.from("profiles").upsert({
            id: tenantId,
            email: normalizedEmail,
            full_name: normalizedName,
            phone: normalizedPhone || null,
            role: "tenant",
        });

        if (profileError) throw profileError;

        // 4. Create active lease with full payment terms
        const leaseTerms = {
            advance_rent_months: numAdvanceMonths,
            advance_payment: numAdvancePayment,
            advance_paid: Boolean(advancePaid),
            security_deposit_months: numDepositMonths,
            security_deposit: numSecurityDeposit,
            security_deposit_paid: Boolean(securityDepositPaid),
            onboarding_source: "manual_quick_add",
        };

        const { data: lease, error: leaseError } = await adminClient
            .from("leases")
            .insert({
                unit_id: normalizedUnitId,
                tenant_id: tenantId,
                landlord_id: userId,
                start_date: startDate,
                end_date: endDate,
                monthly_rent: numMonthlyRent,
                security_deposit: numSecurityDeposit,
                terms: leaseTerms as any,
                status: "active",
            })
            .select()
            .single();

        if (leaseError) throw leaseError;

        // 5. Update unit status
        await adminClient
            .from("units")
            .update({ status: "occupied" })
            .eq("id", normalizedUnitId);

        // 6. Record upfront payments if marked as already collected
        const nowIso = new Date().toISOString();
        const billingCycle = `${startDate.slice(0, 7)}-01`;

        if (advancePaid && numAdvancePayment > 0) {
            const advanceId = crypto.randomUUID();
            await adminClient.from("payments").insert({
                id: advanceId,
                lease_id: lease.id,
                tenant_id: tenantId,
                landlord_id: userId,
                amount: numAdvancePayment,
                subtotal: numAdvancePayment,
                paid_amount: numAdvancePayment,
                balance_remaining: 0,
                status: "completed",
                workflow_status: "receipted",
                landlord_confirmed: true,
                method: "in_person",
                description: "Advance Rent Payment",
                billing_cycle: billingCycle,
                due_date: startDate,
                paid_at: nowIso,
                receipt_number: `REC-ADV-${advanceId.slice(0, 8).toUpperCase()}`,
                metadata: { payment_type: "advance_rent", manual_entry: true },
            } as any);
        }

        if (securityDepositPaid && numSecurityDeposit > 0) {
            const depositId = crypto.randomUUID();
            await adminClient.from("payments").insert({
                id: depositId,
                lease_id: lease.id,
                tenant_id: tenantId,
                landlord_id: userId,
                amount: numSecurityDeposit,
                subtotal: numSecurityDeposit,
                paid_amount: numSecurityDeposit,
                balance_remaining: 0,
                status: "completed",
                workflow_status: "receipted",
                landlord_confirmed: true,
                method: "in_person",
                description: "Security Deposit Payment",
                billing_cycle: billingCycle,
                due_date: startDate,
                paid_at: nowIso,
                receipt_number: `REC-DEP-${depositId.slice(0, 8).toUpperCase()}`,
                metadata: { payment_type: "security_deposit", manual_entry: true },
            } as any);
        }

        return NextResponse.json({
            success: true,
            tenantId,
            tempPassword,
            leaseId: lease.id,
            message: tempPassword 
                ? "Tenant added and credentials generated." 
                : "Tenant linked to existing resident account.",
        });

    } catch (error: any) {
        console.error("[manual-tenant] Error:", error);
        
        const message = error?.message || (error instanceof Error ? error.message : "Failed to add tenant manually.");
        const code = error?.code;

        if (code === "23514" || message?.includes("lease_dates_valid")) {
            return NextResponse.json(
                { error: "Lease end date must be after start date." },
                { status: 400 }
            );
        }

        if (code === "23505" || message?.includes("duplicate")) {
            return NextResponse.json(
                { error: "A lease already exists for this unit or tenant." },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to add tenant manually." },
            { status: 500 }
        );
    }
}
