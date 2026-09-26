import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ALLOWED_REGEX = /^[+()\-\s\d]+$/;

function generateTempPassword(length = 12): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function hasValidPhoneFormat(value: string) {
    const digits = value.replace(/\D/g, "");
    return PHONE_ALLOWED_REGEX.test(value) && digits.length >= 10 && digits.length <= 15;
}

export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as any;
    const { userId } = authContext;
    const adminClient = createAdminClient();

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

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
        advancePayment,
        advanceMonths,
        advancePaid,
        securityDepositMonths,
        securityDepositPaid,
    } = body;

    // --- Input Normalization ---
    const normalizedName = typeof fullName === "string" ? fullName.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const normalizedPropertyId = typeof propertyId === "string" ? propertyId.trim() : "";
    const normalizedUnitId = typeof unitId === "string" ? unitId.trim() : "";

    // --- Validation: Basic Required Fields ---
    if (!normalizedName || !normalizedEmail || !normalizedPropertyId || !normalizedUnitId || !startDate || !endDate) {
        return NextResponse.json(
            { error: "Full name, email, property, unit, start date, and end date are required." },
            { status: 400 }
        );
    }

    // Full name length
    if (normalizedName.length < 2 || normalizedName.length > 100) {
        return NextResponse.json(
            { error: "Resident full name must be between 2 and 100 characters." },
            { status: 400 }
        );
    }

    // Email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return NextResponse.json(
            { error: "Please enter a valid email address." },
            { status: 400 }
        );
    }

    // Phone format
    if (normalizedPhone && !hasValidPhoneFormat(normalizedPhone)) {
        return NextResponse.json(
            { error: "Please enter a valid phone number (10 to 15 digits)." },
            { status: 400 }
        );
    }

    // --- Validation: Dates ---
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
        return NextResponse.json(
            { error: "Please provide valid lease start and end dates." },
            { status: 400 }
        );
    }

    const startYear = parsedStart.getFullYear();
    const endYear = parsedEnd.getFullYear();

    if (startYear < 1990 || startYear > 2100 || endYear < 1990 || endYear > 2100) {
        return NextResponse.json(
            { error: "Dates must include a valid 4-digit year (e.g., 2026)." },
            { status: 400 }
        );
    }

    if (parsedEnd.getTime() <= parsedStart.getTime()) {
        return NextResponse.json(
            { error: "Lease end date must be after start date." },
            { status: 400 }
        );
    }

    // --- Validation: Numbers & Payment Configuration ---
    const numMonthlyRent = Number(monthlyRent);
    if (!Number.isFinite(numMonthlyRent) || numMonthlyRent <= 0) {
        return NextResponse.json(
            { error: "Monthly rent must be greater than zero." },
            { status: 400 }
        );
    }

    const numSecurityDeposit = securityDeposit !== undefined && securityDeposit !== "" ? Number(securityDeposit) : 0;
    if (!Number.isFinite(numSecurityDeposit) || numSecurityDeposit < 0) {
        return NextResponse.json(
            { error: "Security deposit cannot be negative." },
            { status: 400 }
        );
    }

    const numAdvancePayment = advancePayment !== undefined && advancePayment !== "" ? Number(advancePayment) : 0;
    if (!Number.isFinite(numAdvancePayment) || numAdvancePayment < 0) {
        return NextResponse.json(
            { error: "Advance payment cannot be negative." },
            { status: 400 }
        );
    }

    const numAdvanceMonths = typeof advanceMonths === "number" ? advanceMonths : 1;
    const numDepositMonths = typeof securityDepositMonths === "number" ? securityDepositMonths : 1;

    try {
        // --- Verify Unit Ownership & Availability ---
        const { data: unit, error: unitError } = await adminClient
            .from("units")
            .select("id, property_id, properties!inner(landlord_id)")
            .eq("id", normalizedUnitId)
            .maybeSingle();

        if (unitError || !unit) {
            return NextResponse.json({ error: "Selected unit was not found." }, { status: 404 });
        }

        const propertyLandlordId = (unit as any)?.properties?.landlord_id;
        if (propertyLandlordId && propertyLandlordId !== userId) {
            return NextResponse.json({ error: "Unauthorized access to this property unit." }, { status: 403 });
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
                .select("id")
                .ilike("email", normalizedEmail)
                .maybeSingle();

            if (existingProfile?.id) {
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
                        const { data: fallbackUser } = await adminClient.from("profiles").select("id").ilike("email", normalizedEmail).maybeSingle();
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
            { error: message || "Failed to add tenant manually." },
            { status: 500 }
        );
    }
}
