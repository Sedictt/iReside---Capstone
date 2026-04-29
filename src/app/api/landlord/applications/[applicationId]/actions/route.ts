import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationStatus, PaymentMethod, Json } from "@/types/database";
import { sendTenantCredentials, sendLandlordCredentialsCopy } from "@/lib/email";
import { generateSigningLink } from "@/lib/jwt";

type ActionBody = {
    status?: ApplicationStatus;
    lease_data?: {
        start_date: string;
        end_date: string;
        monthly_rent: number;
        security_deposit: number;
        terms: Record<string, any>;
        landlord_signature: string;
        signed_document_url?: string;
        signed_document_path?: string;
    };
    advance_payment?: {
        method: PaymentMethod;
        reference_number: string;
        paid_at: string;
        status: 'pending' | 'completed';
    };
    security_deposit_payment?: {
        method: PaymentMethod;
        reference_number: string;
        paid_at: string;
        status: 'pending' | 'completed';
    };
};

const ALLOWED_STATUSES: ApplicationStatus[] = ["reviewing", "approved", "rejected"];

const isAllowedStatus = (value: unknown): value is ApplicationStatus =>
    typeof value === "string" && ALLOWED_STATUSES.includes(value as ApplicationStatus);

/** Generate a random temporary password */
function generateTempPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Create lease record with calculated end_date and lease agreement terms */
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
        signed_document_url?: string;
        signed_document_path?: string;
        terms: Record<string, any>;
    }
) {
    // Calculate end_date as start_date + 12 months
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
            signed_document_url: data.signed_document_url || null,
            signed_document_path: data.signed_document_path || null,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Lease creation failed: ${error.message}`);
    }

    return lease;
}

/** Validation result type */
type ValidationResult = {
    valid: boolean;
    errors: string[];
};

/** Validate payment data before creating payment records */
async function validatePaymentData(
    supabase: any,
    payment: {
        lease_id: string;
        tenant_id: string;
        landlord_id: string;
        amount: number;
    }
): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate payment amount is greater than zero
    if (payment.amount <= 0) {
        errors.push('Payment amount must be greater than zero');
    }

    // Validate lease_id exists and fetch lease details
    const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .select('id, tenant_id, landlord_id')
        .eq('id', payment.lease_id)
        .maybeSingle();

    if (leaseError || !lease) {
        errors.push('Lease not found. Please ensure the lease exists before creating payments.');
        return { valid: false, errors };
    }

    // Validate tenant_id matches lease tenant_id
    if (payment.tenant_id !== lease.tenant_id) {
        errors.push('Payment tenant does not match the lease tenant');
    }

    // Validate landlord_id matches lease landlord_id
    if (payment.landlord_id !== lease.landlord_id) {
        errors.push('Payment landlord does not match the lease landlord');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/** Create payment records for advance rent and security deposit */
async function createPaymentRecords(
    supabase: any,
    data: {
        lease_id: string;
        tenant_id: string;
        landlord_id: string;
        start_date: string;
        advance_payment: {
            amount: number;
            method: PaymentMethod;
            reference_number: string;
            paid_at: string;
            status: 'pending' | 'completed';
        };
        security_deposit_payment: {
            amount: number;
            method: PaymentMethod;
            reference_number: string;
            paid_at: string;
            status: 'pending' | 'completed';
        };
    }
) {
    // Validate advance payment data
    const advanceValidation = await validatePaymentData(supabase, {
        lease_id: data.lease_id,
        tenant_id: data.tenant_id,
        landlord_id: data.landlord_id,
        amount: data.advance_payment.amount,
    });

    if (!advanceValidation.valid) {
        throw new Error(`Advance payment validation failed: ${advanceValidation.errors.join(', ')}`);
    }

    // Validate security deposit payment data
    const depositValidation = await validatePaymentData(supabase, {
        lease_id: data.lease_id,
        tenant_id: data.tenant_id,
        landlord_id: data.landlord_id,
        amount: data.security_deposit_payment.amount,
    });

    if (!depositValidation.valid) {
        throw new Error(`Security deposit validation failed: ${depositValidation.errors.join(', ')}`);
    }

    const paymentIds: { advance: string; deposit: string } = { advance: '', deposit: '' };

    // Create advance payment record
    const { data: advancePayment, error: advanceError } = await supabase
        .from("payments")
        .insert({
            lease_id: data.lease_id,
            tenant_id: data.tenant_id,
            landlord_id: data.landlord_id,
            amount: data.advance_payment.amount,
            status: data.advance_payment.status,
            method: data.advance_payment.method,
            description: "Advance Rent - First Month",
            due_date: data.start_date,
            paid_at: data.advance_payment.status === 'completed' ? data.advance_payment.paid_at : null,
            reference_number: data.advance_payment.reference_number,
            landlord_confirmed: true,
        })
        .select()
        .single();

    if (advanceError) {
        throw new Error(`Advance payment creation failed: ${advanceError.message}`);
    }

    paymentIds.advance = advancePayment.id;

    // Create payment item for advance rent
    const { error: advanceItemError } = await supabase
        .from("payment_items")
        .insert({
            payment_id: advancePayment.id,
            label: "Advance Rent",
            amount: data.advance_payment.amount,
            category: "rent",
        });

    if (advanceItemError) {
        throw new Error(`Advance payment item creation failed: ${advanceItemError.message}`);
    }

    // Create security deposit payment record
    const { data: depositPayment, error: depositError } = await supabase
        .from("payments")
        .insert({
            lease_id: data.lease_id,
            tenant_id: data.tenant_id,
            landlord_id: data.landlord_id,
            amount: data.security_deposit_payment.amount,
            status: data.security_deposit_payment.status,
            method: data.security_deposit_payment.method,
            description: "Security Deposit",
            due_date: data.start_date,
            paid_at: data.security_deposit_payment.status === 'completed' ? data.security_deposit_payment.paid_at : null,
            reference_number: data.security_deposit_payment.reference_number,
            landlord_confirmed: true,
        })
        .select()
        .single();

    if (depositError) {
        throw new Error(`Security deposit payment creation failed: ${depositError.message}`);
    }

    paymentIds.deposit = depositPayment.id;

    // Create payment item for security deposit
    const { error: depositItemError } = await supabase
        .from("payment_items")
        .insert({
            payment_id: depositPayment.id,
            label: "Security Deposit",
            amount: data.security_deposit_payment.amount,
            category: "security_deposit",
        });

    if (depositItemError) {
        throw new Error(`Security deposit payment item creation failed: ${depositItemError.message}`);
    }

    return paymentIds;
}

/** Rollback tenant account on lease creation failure */
async function rollbackTenantAccount(adminClient: any, tenantId: string) {
    try {
        await adminClient.from('profiles').delete().eq('id', tenantId);
        await adminClient.auth.admin.deleteUser(tenantId);
        console.log('[actions] Tenant account rollback successful:', tenantId);
    } catch (error: any) {
        console.error('[actions] Tenant account rollback failed:', {
            tenantId,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/** Rollback lease and tenant account on payment creation failure */
async function rollbackLeaseAndAccount(adminClient: any, leaseId: string, tenantId: string) {
    try {
        await adminClient.from('leases').delete().eq('id', leaseId);
        await rollbackTenantAccount(adminClient, tenantId);
        console.log('[actions] Lease and account rollback successful');
    } catch (error: any) {
        console.error('[actions] Lease and account rollback failed:', {
            leaseId,
            tenantId,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ applicationId: string }> }
) {
    const { applicationId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: ActionBody = {};
    try {
        body = (await request.json()) as ActionBody;
    } catch {
        body = {};
    }

    if (!isAllowedStatus(body.status)) {
        return NextResponse.json({ error: "Invalid application status." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await supabase
        .from("applications")
        .select(`
            id, 
            status, 
            applicant_name, 
            applicant_email, 
            applicant_phone,
            unit_id,
            move_in_date,
            unit:units (
                id,
                name,
                rent_amount,
                property:properties (
                    id,
                    name,
                    contract_template
                )
            )
        `)
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError) {
        return NextResponse.json({ error: "Failed to load application." }, { status: 500 });
    }

    if (!application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status === "withdrawn") {
        return NextResponse.json({ error: "Application has been withdrawn." }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase
        .from("applications")
        .update({
            status: body.status,
            reviewed_at: reviewedAt,
        })
        .eq("id", applicationId)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update application status." }, { status: 500 });
    }

    // ── Auto-provision tenant account on approval ──────────────────────
    let tenantAccountInfo: {
        email: string;
        tempPassword: string;
        inviteUrl?: string;
        landlordNotified: boolean;
        signing_link?: string;
    } | null = null;

    let leaseId: string | null = null;
    let paymentIds: { advance: string; deposit: string } | null = null;

    if (body.status === "approved") {
        const tenantEmail = application.applicant_email?.trim();
        const tenantName = application.applicant_name?.trim() ?? "Tenant";

        if (!tenantEmail) {
            return NextResponse.json({ error: "Applicant email is required for approval." }, { status: 400 });
        }

        // Validate required lease and payment data
        if (!body.lease_data || !body.advance_payment || !body.security_deposit_payment) {
            return NextResponse.json({ 
                error: "Lease data and payment information are required for approval." 
            }, { status: 400 });
        }

        try {
            // Check if user already exists
            const { data: existingUsers } = await adminClient.auth.admin.listUsers();
            const alreadyExists = existingUsers?.users?.some(
                (u) => u.email?.toLowerCase() === tenantEmail.toLowerCase()
            );

            if (alreadyExists) {
                return NextResponse.json({ 
                    error: "A user with this email already exists." 
                }, { status: 409 });
            }

            const tempPassword = generateTempPassword();

            // Step 1: Create tenant account
            const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
                email: tenantEmail,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: tenantName,
                    role: "tenant",
                    onboarding_source: "walk_in_application",
                    application_id: applicationId,
                },
            });

            if (createError || !newUser?.user) {
                console.error('[actions] Tenant account creation failed:', {
                    applicationId,
                    error: createError?.message,
                    timestamp: new Date().toISOString()
                });
                return NextResponse.json({ 
                    error: "Failed to create tenant account. Please try again." 
                }, { status: 500 });
            }

            const tenantId = newUser.user.id;

            try {
                // Create profile
                await adminClient.from("profiles").upsert({
                    id: tenantId,
                    full_name: tenantName,
                    email: tenantEmail,
                    role: "tenant",
                }, { onConflict: "id" });

                // Onboarding state initialization removed.

                // Step 2: Create lease record
                const unit = application.unit as any;
                const property = unit?.property as any;
                
                // Retrieve contract template from property or use defaults
                const contractTemplate = property?.contract_template || {};
                const leaseTerms = {
                    ...contractTemplate,
                    ...body.lease_data.terms,
                };

                const lease = await createLeaseRecord(adminClient, {
                    unit_id: application.unit_id,
                    tenant_id: tenantId,
                    landlord_id: user.id,
                    start_date: body.lease_data.start_date,
                    monthly_rent: body.lease_data.monthly_rent,
                    security_deposit: body.lease_data.security_deposit,
                    landlord_signature: body.lease_data.landlord_signature,
                    signed_document_url: body.lease_data.signed_document_url,
                    signed_document_path: body.lease_data.signed_document_path,
                    terms: leaseTerms,
                });

                leaseId = lease.id;

                try {
                    // Step 3: Create payment records
                    paymentIds = await createPaymentRecords(adminClient, {
                        lease_id: lease.id,
                        tenant_id: tenantId,
                        landlord_id: user.id,
                        start_date: body.lease_data.start_date,
                        advance_payment: {
                            amount: body.lease_data.monthly_rent,
                            method: body.advance_payment.method,
                            reference_number: body.advance_payment.reference_number,
                            paid_at: body.advance_payment.paid_at,
                            status: body.advance_payment.status,
                        },
                        security_deposit_payment: {
                            amount: body.lease_data.security_deposit,
                            method: body.security_deposit_payment.method,
                            reference_number: body.security_deposit_payment.reference_number,
                            paid_at: body.security_deposit_payment.paid_at,
                            status: body.security_deposit_payment.status,
                        },
                    });

                    // Step 4: Generate signing link
                    const signingLink = generateSigningLink(lease.id, tenantId);

                    // Generate password reset link
                    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
                        type: "recovery",
                        email: tenantEmail,
                    });
                    if (linkError) {
                        console.error("[actions] generateLink error:", linkError);
                    }

                    const inviteUrl = linkData?.properties?.action_link ?? undefined;

                    // Fetch landlord profile
                    const { data: landlordProfile } = await adminClient
                        .from("profiles")
                        .select("email, full_name")
                        .eq("id", user.id)
                        .maybeSingle();

                    tenantAccountInfo = {
                        email: tenantEmail,
                        tempPassword,
                        inviteUrl,
                        signing_link: signingLink,
                        landlordNotified: !!landlordProfile?.email,
                    };

                    // Prepare lease details for email
                    const leaseDetails = {
                        property_name: property?.name || 'Property',
                        unit_name: unit?.name || 'Unit',
                        move_in_date: body.lease_data.start_date,
                        monthly_rent: body.lease_data.monthly_rent,
                    };

                    // Send email to tenant via nodemailer (non-blocking)
                    try {
                        await sendTenantCredentials({ 
                            to: tenantEmail, 
                            tenantName, 
                            tempPassword, 
                            inviteUrl,
                            leaseDetails,
                            signingLink,
                        });
                    } catch (emailError: any) {
                        console.error("[actions] sendTenantCredentials error:", {
                            tenantEmail,
                            error: emailError.message,
                            timestamp: new Date().toISOString()
                        });
                        // Email failure should not prevent approval - credentials will be shown in UI
                    }

                    // Send copy to landlord (non-blocking)
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
                        } catch (emailError: any) {
                            console.error("[actions] sendLandlordCredentialsCopy error:", {
                                landlordEmail: landlordProfile.email,
                                error: emailError.message,
                                timestamp: new Date().toISOString()
                            });
                            // Email failure should not prevent approval
                        }
                    }

                } catch (paymentError: any) {
                    // Rollback lease and tenant account
                    console.error('[actions] Payment creation failed:', {
                        applicationId,
                        leaseId: lease.id,
                        tenantId,
                        error: paymentError.message,
                        stack: paymentError.stack,
                        timestamp: new Date().toISOString()
                    });
                    await rollbackLeaseAndAccount(adminClient, lease.id, tenantId);
                    return NextResponse.json({ 
                        error: "Failed to create payment records. Please try again." 
                    }, { status: 500 });
                }

            } catch (leaseError: any) {
                // Rollback tenant account
                console.error('[actions] Lease creation failed:', {
                    applicationId,
                    tenantId,
                    error: leaseError.message,
                    stack: leaseError.stack,
                    timestamp: new Date().toISOString()
                });
                await rollbackTenantAccount(adminClient, tenantId);
                return NextResponse.json({ 
                    error: "Failed to create lease record. Please try again." 
                }, { status: 500 });
            }

        } catch (error: any) {
            console.error('[actions] Application approval failed:', {
                applicationId,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({ 
                error: "Failed to approve application. Please try again." 
            }, { status: 500 });
        }
    }

    return NextResponse.json({
        success: true,
        status: body.status,
        reviewedAt,
        ...(leaseId ? { lease_id: leaseId } : {}),
        ...(paymentIds ? { payment_ids: paymentIds } : {}),
        ...(tenantAccountInfo ? { tenant_account: tenantAccountInfo } : {}),
    });
}
