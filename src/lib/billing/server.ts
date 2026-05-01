import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

import {
    computeUtilityCharge,
    computeUsage,
    formatDateLong,
    getInvoiceStatus,
    getMonthEnd,
    getMonthStart,
    makeInvoiceNumber,
    makeReceiptNumber,
    parseLeaseBillingTerms,
    toIsoDate,
} from "@/lib/billing/utils";
import type {
    Database,
    Json,
    LandlordPaymentDestination,
    Payment,
    PaymentItem,
    PaymentReceipt,
    Profile,
    Property,
    Unit,
    UtilityConfig,
    UtilityReading,
} from "@/types/database";

type AppSupabaseClient = SupabaseClient<Database>;

type PaymentRelationRow = Payment & {
    payment_items?: PaymentItem[];
    lease?: {
        id: string;
        terms: Json | null;
        start_date: string;
        end_date: string;
        monthly_rent: number;
        unit?: Unit & {
            property?: Property;
        };
    } | null;
    tenant?: Profile | null;
    landlord?: Profile | null;
};

type BillingLeaseRow = {
    id: string;
    tenant_id: string;
    unit_id: string;
    landlord_id: string;
    monthly_rent: number;
    terms: Json | null;
    unit?: {
        id: string;
        property_id: string;
        name?: string;
        rent_amount?: number;
    } | null;
};

type ActiveLeaseWorkspaceRow = {
    id: string;
    unit_id: string;
    tenant_id: string;
    monthly_rent: number;
    terms: Json | null;
    tenant?: Pick<Profile, "id" | "full_name" | "email"> | null;
    unit?: (Unit & { property?: Property | null }) | null;
};

export type InvoiceListItem = {
    id: string;
    invoiceNumber: string;
    tenant: string;
    property: string;
    unit: string;
    amount: number;
    subtotal: number;
    balanceRemaining: number;
    dueDate: string;
    issuedDate: string;
    status: ReturnType<typeof getInvoiceStatus>;
    workflowStatus: Payment["workflow_status"];
    type: string;
    proofStatus: "none" | "submitted" | "confirmed";
    paymentMethod: string | null;
    itemCount: number;
    hasReceipt: boolean;
    amountTag: Payment["amount_tag"] | null;
    reviewAction: Payment["review_action"] | null;
    inPersonIntentExpiresAt: string | null;
    hasRefundRequest: boolean;
};

export type InvoiceReadingDetail = Pick<
    UtilityReading,
    | "id"
    | "utility_type"
    | "billing_mode"
    | "billing_period_start"
    | "billing_period_end"
    | "previous_reading"
    | "current_reading"
    | "usage"
    | "billed_rate"
    | "computed_charge"
    | "note"
    | "proof_image_url"
    | "entered_at"
>;

export type InvoiceDetail = {
    id: string;
    invoiceNumber: string;
    status: ReturnType<typeof getInvoiceStatus>;
    workflowStatus: Payment["workflow_status"];
    tenant: Profile | null;
    landlord: Profile | null;
    property: Property | null;
    unit: Unit | null;
    dueDate: string;
    issuedDate: string;
    billingCycle: string | null;
    invoicePeriodStart: string | null;
    invoicePeriodEnd: string | null;
    subtotal: number;
    totalAmount: number;
    paidAmount: number;
    balanceRemaining: number;
    lateFeeAmount: number;
    allowPartialPayments: boolean;
    description: string | null;
    paymentMethod: string | null;
    referenceNumber: string | null;
    paymentSubmittedAt: string | null;
    paymentProofUrl: string | null;
    paymentNote: string | null;
    receiptNumber: string | null;
    amountTag: Payment["amount_tag"] | null;
    reviewAction: Payment["review_action"] | null;
    rejectionReason: string | null;
    intentMethod: Payment["intent_method"] | null;
    inPersonIntentExpiresAt: string | null;
    landlordConfirmed: boolean;
    metadata: Json;
    lineItems: PaymentItem[];
    readings: InvoiceReadingDetail[];
    receipts: PaymentReceipt[];
    paymentDestination: LandlordPaymentDestination | null;
    leaseTermsSummary: {
        dueDay: number;
        lateFeeAmount: number;
        allowPartialPayments: boolean;
        utilitiesDescription: string | null;
    };
};

export type BillingWorkspace = {
    paymentDestination: LandlordPaymentDestination | null;
    properties: Array<
        Property & {
            units: Unit[];
        }
    >;
    activeLeases: Array<{
        id: string;
        tenant: Pick<Profile, "id" | "full_name" | "email"> | null;
        unit: Unit | null;
        property: Property | null;
        monthly_rent: number;
        terms: Json | null;
    }>;
    utilityConfigs: UtilityConfig[];
};

const PAYMENT_RELATION_SELECT = `
    id,
    lease_id,
    tenant_id,
    landlord_id,
    amount,
    subtotal,
    paid_amount,
    balance_remaining,
    status,
    method,
    description,
    due_date,
    paid_at,
    reference_number,
    landlord_confirmed,
    invoice_number,
    billing_cycle,
    invoice_period_start,
    invoice_period_end,
    late_fee_amount,
    late_fee_applied_at,
    allow_partial_payments,
    due_day_snapshot,
    payment_submitted_at,
    payment_proof_url,
    payment_proof_path,
    payment_note,
    reminder_sent_at,
    receipt_number,
    workflow_status,
    intent_method,
    amount_tag,
    review_action,
    in_person_intent_expires_at,
    rejection_reason,
    last_action_at,
    last_action_by,
    metadata,
    created_at,
    updated_at,
    payment_items (
        id,
        payment_id,
        label,
        amount,
        category,
        sort_order,
        utility_type,
        billing_mode,
        reading_id,
        metadata,
        created_at
    ),
    lease:leases (
        id,
        start_date,
        end_date,
        monthly_rent,
        terms,
        unit:units (
            id,
            property_id,
            name,
            floor,
            status,
            rent_amount,
            sqft,
            beds,
            baths,
            created_at,
            updated_at,
            property:properties (
                id,
                landlord_id,
                name,
                address,
                city,
                description,
                type,
                lat,
                lng,
                amenities,
                house_rules,
                contract_template,
                images,
                is_featured,
                created_at,
                updated_at
            )
        )
    ),
    tenant:profiles!payments_tenant_id_fkey (
        id,
        email,
        full_name,
        role,
        avatar_url,
        phone,
        created_at,
        updated_at
    ),
    landlord:profiles!payments_landlord_id_fkey (
        id,
        email,
        full_name,
        role,
        avatar_url,
        phone,
        created_at,
        updated_at
    )
`;

const paymentTypeLabel = (items: PaymentItem[], description: string | null) => {
    const categories = new Set(items.map((item) => item.category));
    if (categories.has("adjustment")) return "Adjusted Invoice";
    if (categories.has("electricity") || categories.has("water")) return "Rent + Utilities";
    if (description?.toLowerCase().includes("utility")) return "Utility Invoice";
    return "Monthly Rent";
};

async function getReadingMap(supabase: AppSupabaseClient, paymentIds: string[]) {
    if (paymentIds.length === 0) return new Map<string, InvoiceReadingDetail[]>();

    const { data, error } = await supabase
        .from("utility_readings")
        .select(`
            id,
            payment_id,
            utility_type,
            billing_mode,
            billing_period_start,
            billing_period_end,
            previous_reading,
            current_reading,
            usage,
            billed_rate,
            computed_charge,
            note,
            proof_image_url,
            entered_at
        `)
        .in("payment_id", paymentIds);

    if (error) throw error;

    const map = new Map<string, InvoiceReadingDetail[]>();
    for (const row of data ?? []) {
        const group = map.get(row.payment_id ?? "");
        if (group) {
            group.push(row);
        } else if (row.payment_id) {
            map.set(row.payment_id, [row]);
        }
    }
    return map;
}

async function getReceiptMap(supabase: AppSupabaseClient, paymentIds: string[]) {
    if (paymentIds.length === 0) return new Map<string, PaymentReceipt[]>();

    const { data, error } = await supabase
        .from("payment_receipts")
        .select("*")
        .in("payment_id", paymentIds)
        .order("issued_at", { ascending: false });

    if (error) throw error;

    const map = new Map<string, PaymentReceipt[]>();
    for (const row of data ?? []) {
        const group = map.get(row.payment_id);
        if (group) {
            group.push(row);
        } else {
            map.set(row.payment_id, [row]);
        }
    }
    return map;
}

async function getDestinationMap(supabase: AppSupabaseClient, landlordIds: string[]) {
    if (landlordIds.length === 0) return new Map<string, LandlordPaymentDestination>();

    const { data, error } = await supabase
        .from("landlord_payment_destinations")
        .select("*")
        .in("landlord_id", landlordIds)
        .eq("provider", "gcash");

    if (error) throw error;

    return new Map((data ?? []).map((item) => [item.landlord_id, item]));
}

function buildInvoiceListItem(
    payment: PaymentRelationRow,
    readings: InvoiceReadingDetail[],
    receipts: PaymentReceipt[],
): InvoiceListItem {
    const items = (payment.payment_items ?? []).toSorted((a, b) => a.sort_order - b.sort_order);
    const status = getInvoiceStatus({
        status: payment.status,
        workflowStatus: payment.workflow_status,
        dueDate: payment.due_date,
        balanceRemaining: payment.balance_remaining,
    });
    const proofStatus = payment.payment_submitted_at
        ? payment.landlord_confirmed || status === "paid"
            ? "confirmed"
            : "submitted"
        : "none";

    return {
        id: payment.id,
        invoiceNumber: payment.invoice_number ?? makeInvoiceNumber(payment.id, payment.billing_cycle ?? payment.due_date),
        tenant: payment.tenant?.full_name ?? "Unknown tenant",
        property: payment.lease?.unit?.property?.name ?? "Unknown property",
        unit: payment.lease?.unit?.name ?? "Unknown unit",
        amount: Number(payment.amount ?? 0),
        subtotal: Number(payment.subtotal ?? payment.amount ?? 0),
        balanceRemaining: Number(payment.balance_remaining ?? payment.amount ?? 0),
        dueDate: payment.due_date,
        issuedDate: payment.created_at,
        status,
        workflowStatus: payment.workflow_status,
        type: paymentTypeLabel(items, payment.description),
        proofStatus,
        paymentMethod: payment.method,
        itemCount: items.length + readings.length,
        hasReceipt: receipts.length > 0,
        amountTag: payment.amount_tag,
        reviewAction: payment.review_action,
        inPersonIntentExpiresAt: payment.in_person_intent_expires_at,
        hasRefundRequest: !!(payment.metadata as any)?.refund_preference,
    };
}

export async function listLandlordInvoices(
    supabase: AppSupabaseClient,
    landlordId: string,
    propertyId?: string
) {
    const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_RELATION_SELECT)
        .eq("landlord_id", landlordId)
        .order("due_date", { ascending: false });

    if (error) throw error;

    const allPayments = (data ?? []) as unknown as PaymentRelationRow[];
    const payments = propertyId
        ? allPayments.filter((payment) => payment.lease?.unit?.property_id === propertyId)
        : allPayments;
    const paymentIds = payments.map((item) => item.id);
    const [readingMap, receiptMap] = await Promise.all([
        getReadingMap(supabase, paymentIds),
        getReceiptMap(supabase, paymentIds),
    ]);

    const invoices = payments.map((payment) =>
        buildInvoiceListItem(payment, readingMap.get(payment.id) ?? [], receiptMap.get(payment.id) ?? []),
    );

    const metrics = invoices.reduce(
        (acc, invoice) => {
            if (
                invoice.status === "pending" ||
                invoice.status === "processing" ||
                invoice.status === "overdue" ||
                invoice.status === "reminder_sent" ||
                invoice.status === "intent_submitted" ||
                invoice.status === "under_review" ||
                invoice.status === "awaiting_in_person" ||
                invoice.status === "confirmed"
            ) {
                acc.totalOutstanding += invoice.balanceRemaining;
            }
            if (invoice.status === "overdue") {
                acc.overdueAmount += invoice.balanceRemaining;
            }
            if (invoice.status === "paid" || invoice.status === "receipted") {
                acc.collectedLast30Days += invoice.amount;
            }
            acc.totalInvoices += 1;
            return acc;
        },
        {
            totalOutstanding: 0,
            overdueAmount: 0,
            collectedLast30Days: 0,
            totalInvoices: 0,
        },
    );

    return { invoices, metrics };
}

export async function getInvoiceDetailForActor(
    supabase: AppSupabaseClient,
    paymentId: string,
    actor: { tenantId?: string; landlordId?: string },
): Promise<InvoiceDetail | null> {
    let query = supabase.from("payments").select(PAYMENT_RELATION_SELECT).eq("id", paymentId);

    if (actor.tenantId) {
        query = query.eq("tenant_id", actor.tenantId);
    }

    if (actor.landlordId) {
        query = query.eq("landlord_id", actor.landlordId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const payment = data as unknown as PaymentRelationRow;
    const [readingMap, receiptMap, destinationMap] = await Promise.all([
        getReadingMap(supabase, [payment.id]),
        getReceiptMap(supabase, [payment.id]),
        getDestinationMap(supabase, [payment.landlord_id]),
    ]);

    const items = (payment.payment_items ?? []).toSorted((a, b) => a.sort_order - b.sort_order);
    const receipts = receiptMap.get(payment.id) ?? [];
    const terms = parseLeaseBillingTerms(payment.lease?.terms ?? null);
    const lateFeeAmount = Number(payment.late_fee_amount ?? terms.lateFeeAmount ?? 0);
    const status = getInvoiceStatus({
        status: payment.status,
        workflowStatus: payment.workflow_status,
        dueDate: payment.due_date,
        balanceRemaining: payment.balance_remaining,
    });

    return {
        id: payment.id,
        invoiceNumber: payment.invoice_number ?? makeInvoiceNumber(payment.id, payment.billing_cycle ?? payment.due_date),
        status,
        workflowStatus: payment.workflow_status,
        tenant: payment.tenant ?? null,
        landlord: payment.landlord ?? null,
        property: payment.lease?.unit?.property ?? null,
        unit: payment.lease?.unit ?? null,
        dueDate: payment.due_date,
        issuedDate: payment.created_at,
        billingCycle: payment.billing_cycle,
        invoicePeriodStart: payment.invoice_period_start,
        invoicePeriodEnd: payment.invoice_period_end,
        subtotal: Number(payment.subtotal ?? payment.amount ?? 0),
        totalAmount: Number(payment.amount ?? 0),
        paidAmount: Number(payment.paid_amount ?? 0),
        balanceRemaining: Number(payment.balance_remaining ?? payment.amount ?? 0),
        lateFeeAmount,
        allowPartialPayments: payment.allow_partial_payments,
        description: payment.description,
        paymentMethod: payment.method,
        referenceNumber: payment.reference_number,
        paymentSubmittedAt: payment.payment_submitted_at,
        paymentProofUrl: payment.payment_proof_url,
        paymentNote: payment.payment_note,
        receiptNumber: payment.receipt_number,
        amountTag: payment.amount_tag,
        reviewAction: payment.review_action,
        rejectionReason: payment.rejection_reason,
        intentMethod: payment.intent_method,
        inPersonIntentExpiresAt: payment.in_person_intent_expires_at,
        landlordConfirmed: payment.landlord_confirmed,
        lineItems: items,
        readings: readingMap.get(payment.id) ?? [],
        receipts,
        paymentDestination: destinationMap.get(payment.landlord_id) ?? null,
        metadata: payment.metadata || {},
        leaseTermsSummary: terms,
    };
}

export async function getTenantPaymentOverview(supabase: AppSupabaseClient, tenantId: string) {
    const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_RELATION_SELECT)
        .eq("tenant_id", tenantId)
        .order("due_date", { ascending: true });

    if (error) throw error;

    const payments = (data ?? []) as unknown as PaymentRelationRow[];
    const paymentIds = payments.map((item) => item.id);
    const [readingMap, receiptMap] = await Promise.all([
        getReadingMap(supabase, paymentIds),
        getReceiptMap(supabase, paymentIds),
    ]);

    const mapped = payments.map((payment) => {
        const readings = readingMap.get(payment.id) ?? [];
        return {
            ...buildInvoiceListItem(payment, readings, receiptMap.get(payment.id) ?? []),
            paymentItems: (payment.payment_items ?? []).toSorted((a, b) => a.sort_order - b.sort_order),
            readings,
            dueDateLabel: formatDateLong(payment.due_date),
        };
    });

    const actionable = mapped.filter((payment) =>
        payment.status === "pending" ||
        payment.status === "processing" ||
        payment.status === "overdue" ||
        payment.status === "reminder_sent" ||
        payment.status === "intent_submitted" ||
        payment.status === "rejected",
    );
    const nextPayment = actionable[0] ?? null;
    const history = mapped.filter((payment) => payment.id !== nextPayment?.id);

    // Get basic lease info for projections
    const { data: leaseData } = await supabase
        .from("leases")
        .select(`
            id,
            monthly_rent,
            status,
            unit:units (name, property:properties (name))
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .maybeSingle();

    return { 
        nextPayment, 
        history,
        lease: leaseData ? {
            id: leaseData.id,
            monthlyRent: leaseData.monthly_rent,
            propertyName: (leaseData.unit as any)?.property?.name,
            unitName: (leaseData.unit as any)?.name
        } : null
    };
}

export async function getBillingWorkspace(supabase: AppSupabaseClient, landlordId: string): Promise<BillingWorkspace> {
    const [
        { data: destinationRows, error: destinationError },
        { data: propertyRows, error: propertyError },
        { data: unitRows, error: unitError },
        { data: leaseRows, error: leaseError },
        { data: utilityRows, error: utilityError },
    ] = await Promise.all([
        supabase
            .from("landlord_payment_destinations")
            .select("*")
            .eq("landlord_id", landlordId)
            .eq("provider", "gcash")
            .maybeSingle(),
        supabase
            .from("properties")
            .select("*")
            .eq("landlord_id", landlordId)
            .order("name", { ascending: true }),
        supabase
            .from("units")
            .select("*")
            .in(
                "property_id",
                (
                    await supabase
                        .from("properties")
                        .select("id")
                        .eq("landlord_id", landlordId)
                ).data?.map((item) => item.id) ?? [],
            ),
        supabase
            .from("leases")
            .select(`
                id,
                unit_id,
                tenant_id,
                monthly_rent,
                terms,
                status,
                unit:units (*, property:properties (*)),
                tenant:profiles!leases_tenant_id_fkey (id, full_name, email)
            `)
            .eq("landlord_id", landlordId)
            .eq("status", "active"),
        supabase
            .from("utility_configs")
            .select("*")
            .eq("landlord_id", landlordId)
            .order("created_at", { ascending: false }),
    ]);

    if (destinationError) throw destinationError;
    if (propertyError) throw propertyError;
    if (unitError) throw unitError;
    if (leaseError) throw leaseError;
    if (utilityError) throw utilityError;

    const unitsByProperty = new Map<string, Unit[]>();
    for (const unit of unitRows ?? []) {
        const group = unitsByProperty.get(unit.property_id);
        if (group) {
            group.push(unit);
        } else {
            unitsByProperty.set(unit.property_id, [unit]);
        }
    }

    return {
        paymentDestination: destinationRows ?? null,
        properties: (propertyRows ?? []).map((property) => ({
            ...property,
            units: (unitsByProperty.get(property.id) ?? []).toSorted((a, b) => a.name.localeCompare(b.name)),
        })),
        activeLeases: ((leaseRows ?? []) as unknown as ActiveLeaseWorkspaceRow[]).map((lease) => ({
            id: lease.id,
            tenant: lease.tenant ?? null,
            unit: lease.unit ?? null,
            property: lease.unit?.property ?? null,
            monthly_rent: Number(lease.monthly_rent ?? lease.unit?.rent_amount ?? 0),
            terms: lease.terms ?? null,
        })),
        utilityConfigs: utilityRows ?? [],
    };
}

export async function upsertPaymentReceipt(
    supabase: AppSupabaseClient,
    payment: Pick<Payment, "id" | "landlord_id" | "tenant_id" | "paid_amount" | "amount" | "receipt_number" | "method">,
    issuedBy: string,
    notes?: string | null,
    amountBreakdown?: Record<string, unknown>,
) {
    const existing = await supabase
        .from("payment_receipts")
        .select("*")
        .eq("payment_id", payment.id)
        .maybeSingle();

    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;

    const issuedAt = new Date().toISOString();
    const receiptNumber = payment.receipt_number ?? makeReceiptNumber(payment.id, issuedAt);

    const { data, error } = await supabase
        .from("payment_receipts")
        .insert({
            payment_id: payment.id,
            landlord_id: payment.landlord_id,
            tenant_id: payment.tenant_id,
            receipt_number: receiptNumber,
            amount: Number(payment.paid_amount || payment.amount),
            issued_at: issuedAt,
            issued_by: issuedBy,
            notes: notes ?? null,
            method: payment.method ?? null,
            amount_breakdown: (amountBreakdown ?? {}) as Json,
        })
        .select("*")
        .single();

    if (error) throw error;
    return data;
}

export async function generateMonthlyInvoices(
    supabase: AppSupabaseClient,
    landlordId: string,
    billingMonth?: string,
    leaseIds?: string[],
) {
    const cycleStart = getMonthStart(billingMonth);
    const cycleEnd = getMonthEnd(billingMonth);
    const cycleKey = toIsoDate(cycleStart);

    let leaseQuery = supabase
        .from("leases")
        .select(`
            id,
            unit_id,
            tenant_id,
            landlord_id,
            monthly_rent,
            terms,
            status,
            unit:units (
                id,
                property_id,
                name,
                rent_amount
            )
        `)
        .eq("landlord_id", landlordId)
        .eq("status", "active");

    if (leaseIds && leaseIds.length > 0) {
        leaseQuery = leaseQuery.in("id", leaseIds);
    }

    const { data: leases, error: leaseError } = await leaseQuery;
    if (leaseError) throw leaseError;

    if (!leases || leases.length === 0) {
        return { created: 0, skipped: 0, billingCycle: cycleKey };
    }

    const existingPaymentIds = await supabase
        .from("payments")
        .select("lease_id")
        .eq("landlord_id", landlordId)
        .eq("billing_cycle", cycleKey);

    if (existingPaymentIds.error) throw existingPaymentIds.error;
    const existingLeaseIds = new Set((existingPaymentIds.data ?? []).map((row) => row.lease_id));

    const typedLeases = leases as unknown as BillingLeaseRow[];
    const unitIds = typedLeases.map((lease) => lease.unit_id);
    const propertyIds = typedLeases.map((lease) => lease.unit?.property_id).filter((value): value is string => Boolean(value));

    const [{ data: configs, error: configError }, { data: readings, error: readingError }] = await Promise.all([
        supabase
            .from("utility_configs")
            .select("*")
            .eq("landlord_id", landlordId)
            .eq("is_active", true)
            .in("property_id", propertyIds),
        supabase
            .from("utility_readings")
            .select("*")
            .eq("landlord_id", landlordId)
            .gte("billing_period_start", toIsoDate(cycleStart))
            .lte("billing_period_end", toIsoDate(cycleEnd))
            .in("unit_id", unitIds),
    ]);

    if (configError) throw configError;
    if (readingError) throw readingError;

    const configMap = new Map<string, UtilityConfig>();
    for (const config of configs ?? []) {
        const key = `${config.property_id}:${config.unit_id ?? "property"}:${config.utility_type}`;
        if (!configMap.has(key)) configMap.set(key, config);
    }

    const readingsByLease = new Map<string, UtilityReading[]>();
    for (const reading of readings ?? []) {
        const group = readingsByLease.get(reading.lease_id);
        if (group) {
            group.push(reading);
        } else {
            readingsByLease.set(reading.lease_id, [reading]);
        }
    }

    let created = 0;
    let skipped = 0;

    for (const lease of typedLeases) {
        if (existingLeaseIds.has(lease.id)) {
            skipped += 1;
            continue;
        }

        const terms = parseLeaseBillingTerms(lease.terms ?? null);
        const dueDate = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), Math.max(1, Math.min(terms.dueDay, 28)));
        const itemRows: Omit<PaymentItem, "id" | "created_at">[] = [];
        const leaseReadings = readingsByLease.get(lease.id) ?? [];

        itemRows.push({
            payment_id: "",
            label: "Base rent",
            amount: Number(lease.monthly_rent ?? lease.unit?.rent_amount ?? 0),
            category: "rent",
            sort_order: 0,
            utility_type: null,
            billing_mode: null,
            reading_id: null,
            metadata: {},
        });

        for (const utilityType of ["water", "electricity"] as const) {
            const config =
                configMap.get(`${lease.unit?.property_id}:${lease.unit_id}:${utilityType}`) ??
                configMap.get(`${lease.unit?.property_id}:property:${utilityType}`);

            if (!config) continue;

            const reading = leaseReadings.find((row) => row.utility_type === utilityType);
            const billedRate = Number(reading?.billed_rate ?? config.rate_per_unit ?? 0);
            const usage = Number(reading?.usage ?? 0);
            const charge = Number(reading?.computed_charge ?? computeUtilityCharge({
                mode: config.billing_mode,
                ratePerUnit: billedRate,
                usage,
            }));

            itemRows.push({
                payment_id: "",
                label: utilityType === "water" ? "Water service" : "Electricity service",
                amount: charge,
                category: utilityType,
                sort_order: utilityType === "water" ? 10 : 20,
                utility_type: utilityType,
                billing_mode: config.billing_mode,
                reading_id: reading?.id ?? null,
                metadata: {
                    included: config.billing_mode === "included_in_rent",
                    usage,
                    rate: billedRate,
                },
            });
        }

        const subtotal = itemRows.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
        const totalAmount = subtotal;

        const { data: paymentRow, error: paymentError } = await supabase
            .from("payments")
            .insert({
                lease_id: lease.id,
                tenant_id: lease.tenant_id,
                landlord_id: landlordId,
                amount: totalAmount,
                subtotal,
                paid_amount: 0,
                balance_remaining: totalAmount,
                status: "pending",
                description: `${formatDateLong(cycleKey)} monthly invoice`,
                due_date: toIsoDate(dueDate),
                billing_cycle: cycleKey,
                invoice_period_start: toIsoDate(cycleStart),
                invoice_period_end: toIsoDate(cycleEnd),
                allow_partial_payments: terms.allowPartialPayments,
                due_day_snapshot: terms.dueDay,
                late_fee_amount: terms.lateFeeAmount,
                invoice_number: makeInvoiceNumber(crypto.randomUUID(), cycleKey),
            })
            .select("id")
            .single();

        if (paymentError) throw paymentError;

        const paymentId = paymentRow.id;
        const itemInsertRows = itemRows.map((item) => ({
            ...item,
            payment_id: paymentId,
        }));

        const { error: itemError } = await supabase.from("payment_items").insert(itemInsertRows);
        if (itemError) throw itemError;

        if (leaseReadings.length > 0) {
            const { error: readingUpdateError } = await supabase
                .from("utility_readings")
                .update({ payment_id: paymentId })
                .in("id", leaseReadings.map((reading) => reading.id));

            if (readingUpdateError) throw readingUpdateError;
        }

        created += 1;
    }

    return { created, skipped, billingCycle: cycleKey };
}

export async function recordUtilityReading(
    supabase: AppSupabaseClient,
    landlordId: string,
    payload: {
        leaseId: string;
        utilityType: UtilityReading["utility_type"];
        billingPeriodStart: string;
        billingPeriodEnd: string;
        previousReading: number;
        currentReading: number;
        note?: string | null;
        proofImagePath?: string | null;
        proofImageUrl?: string | null;
    },
) {
    if (payload.currentReading < payload.previousReading) {
        throw new Error("Current reading cannot be lower than the previous reading.");
    }

    const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("id, unit_id, landlord_id")
        .eq("id", payload.leaseId)
        .eq("landlord_id", landlordId)
        .single();

    if (leaseError) throw leaseError;

    const { data: unit, error: unitError } = await supabase
        .from("units")
        .select("id, property_id")
        .eq("id", lease.unit_id)
        .single();

    if (unitError) throw unitError;

    const { data: configs, error: configError } = await supabase
        .from("utility_configs")
        .select("*")
        .eq("landlord_id", landlordId)
        .eq("property_id", unit.property_id)
        .eq("utility_type", payload.utilityType)
        .eq("is_active", true)
        .order("unit_id", { ascending: false });

    if (configError) throw configError;

    const config =
        (configs ?? []).find((item) => item.unit_id === lease.unit_id) ??
        (configs ?? []).find((item) => item.unit_id === null);

    if (!config) {
        throw new Error("No utility configuration found for this lease.");
    }

    const usage = computeUsage(payload.previousReading, payload.currentReading);
    const computedCharge = computeUtilityCharge({
        mode: config.billing_mode,
        ratePerUnit: Number(config.rate_per_unit ?? 0),
        usage,
    });

    const { data, error } = await supabase
        .from("utility_readings")
        .insert({
            landlord_id: landlordId,
            lease_id: payload.leaseId,
            property_id: unit.property_id,
            unit_id: lease.unit_id,
            utility_type: payload.utilityType,
            billing_mode: config.billing_mode,
            billing_period_start: payload.billingPeriodStart,
            billing_period_end: payload.billingPeriodEnd,
            previous_reading: payload.previousReading,
            current_reading: payload.currentReading,
            usage,
            billed_rate: Number(config.rate_per_unit ?? 0),
            computed_charge: computedCharge,
            note: payload.note ?? null,
            proof_image_path: payload.proofImagePath ?? null,
            proof_image_url: payload.proofImageUrl ?? null,
        })
        .select("*")
        .single();

    if (error) throw error;

    return data;
}
export async function createAdvancePayment(supabase: AppSupabaseClient, tenantId: string) {
    // 1. Get active lease
    const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select(`
            *,
            unit:units (id, property_id, rent_amount)
        `)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

    if (leaseError || !lease) throw new Error("No active lease found for advance payment.");

    // 2. Determine next cycle
    const now = new Date();
    const nextCycle = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const cycleKey = toIsoDate(nextCycle); // Full date YYYY-MM-01

    // 3. Check if an invoice already exists for this cycle
    const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("lease_id", lease.id)
        .eq("billing_cycle", cycleKey)
        .maybeSingle();

    if (existing) return { id: existing.id, exists: true };

    // 4. Create the advance payment (Rent Only)
    const terms = parseLeaseBillingTerms(lease.terms ?? null);
    const dueDate = new Date(nextCycle.getFullYear(), nextCycle.getMonth(), Math.max(1, Math.min(terms.dueDay, 28)));
    const rentAmount = Number(lease.monthly_rent ?? (lease.unit as any)?.rent_amount ?? 0);

    const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert([{
            lease_id: lease.id,
            tenant_id: tenantId,
            landlord_id: lease.landlord_id,
            amount: rentAmount,
            subtotal: rentAmount,
            paid_amount: 0,
            balance_remaining: rentAmount,
            status: "pending",
            description: `${getNextMonthName(nextCycle)} Monthly Rent (Advance Payment)`,
            due_date: toIsoDate(dueDate),
            billing_cycle: cycleKey,
            invoice_period_start: toIsoDate(nextCycle),
            invoice_period_end: toIsoDate(new Date(nextCycle.getFullYear(), nextCycle.getMonth() + 1, 0)),
            allow_partial_payments: terms.allowPartialPayments,
            due_day_snapshot: terms.dueDay,
            late_fee_amount: terms.lateFeeAmount,
            invoice_number: makeInvoiceNumber(crypto.randomUUID(), cycleKey),
            metadata: { 
                type: "advance_rent_payment",
                generated_at: new Date().toISOString(),
                tag: "advance_rent"
            }
        }])
        .select("id")
        .single();

    if (paymentError) throw paymentError;

    // 5. Add the rent item
    const { error: itemError } = await supabase.from("payment_items").insert({
        payment_id: payment.id,
        label: "Monthly Rent (Advance)",
        amount: rentAmount,
        category: "rent",
        sort_order: 0,
        metadata: { is_advance: true }
    });

    if (itemError) throw itemError;

    return { id: payment.id, exists: false };
}

function getNextMonthName(date: Date) {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}
