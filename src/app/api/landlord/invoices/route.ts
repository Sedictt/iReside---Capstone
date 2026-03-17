import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus } from "@/types/database";

type InvoiceStatus = "paid" | "pending" | "overdue";

type InvoiceItem = {
    id: string;
    tenant: string;
    property: string;
    unit: string;
    amount: number;
    dueDate: string;
    status: InvoiceStatus;
    type: string;
    issuedDate: string;
};

const resolveInvoiceStatus = (status: PaymentStatus, dueDateValue: string) => {
    if (status === "completed") return "paid";

    const dueDate = new Date(dueDateValue);
    if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
        return "overdue";
    }

    return "pending";
};

const resolveInvoiceType = (description: string | null) => {
    if (!description) return "Rent";
    const normalized = description.toLowerCase();
    if (normalized.includes("maintenance") || normalized.includes("repair")) {
        return "Maintenance";
    }
    if (normalized.includes("utility")) {
        return "Utilities";
    }
    return "Rent";
};

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: paymentRows, error: paymentsError } = await supabase
        .from("payments")
        .select("id, amount, status, description, due_date, paid_at, created_at, lease_id, tenant_id")
        .eq("landlord_id", user.id)
        .order("due_date", { ascending: false })
        .limit(500);

    if (paymentsError) {
        return NextResponse.json({ error: "Failed to load invoices." }, { status: 500 });
    }

    if (!paymentRows || paymentRows.length === 0) {
        return NextResponse.json({
            invoices: [] satisfies InvoiceItem[],
            metrics: {
                totalOutstanding: 0,
                overdueAmount: 0,
                collectedLast30Days: 0,
                totalInvoices: 0,
            },
        });
    }

    const tenantIds = Array.from(
        new Set(paymentRows.map((row) => row.tenant_id).filter((value): value is string => Boolean(value)))
    );
    const leaseIds = Array.from(
        new Set(paymentRows.map((row) => row.lease_id).filter((value): value is string => Boolean(value)))
    );

    const { data: tenantRows, error: tenantsError } =
        tenantIds.length > 0
            ? await supabase.from("profiles").select("id, full_name").in("id", tenantIds)
            : { data: [], error: null };

    if (tenantsError) {
        return NextResponse.json({ error: "Failed to load tenants." }, { status: 500 });
    }

    const { data: leaseRows, error: leasesError } =
        leaseIds.length > 0
            ? await supabase.from("leases").select("id, unit_id").in("id", leaseIds)
            : { data: [], error: null };

    if (leasesError) {
        return NextResponse.json({ error: "Failed to load leases." }, { status: 500 });
    }

    const unitIds = Array.from(
        new Set((leaseRows ?? []).map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase.from("units").select("id, name, property_id").in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to load units." }, { status: 500 });
    }

    const propertyIds = Array.from(
        new Set((unitRows ?? []).map((row) => row.property_id).filter((value): value is string => Boolean(value)))
    );

    const { data: propertyRows, error: propertiesError } =
        propertyIds.length > 0
            ? await supabase.from("properties").select("id, name").in("id", propertyIds)
            : { data: [], error: null };

    if (propertiesError) {
        return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
    }

    const tenantMap = new Map((tenantRows ?? []).map((row) => [row.id, row]));
    const leaseMap = new Map((leaseRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    let totalOutstanding = 0;
    let overdueAmount = 0;
    let collectedLast30Days = 0;

    const invoices: InvoiceItem[] = paymentRows.map((row) => {
        const invoiceStatus = resolveInvoiceStatus(row.status, row.due_date);
        const lease = leaseMap.get(row.lease_id);
        const unit = lease ? unitMap.get(lease.unit_id) : null;
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const tenant = tenantMap.get(row.tenant_id);

        if (invoiceStatus === "pending" || invoiceStatus === "overdue") {
            totalOutstanding += Number(row.amount ?? 0);
        }

        if (invoiceStatus === "overdue") {
            overdueAmount += Number(row.amount ?? 0);
        }

        if (row.status === "completed" && row.paid_at) {
            const paidAt = new Date(row.paid_at);
            if (!Number.isNaN(paidAt.getTime()) && paidAt >= last30Days) {
                collectedLast30Days += Number(row.amount ?? 0);
            }
        }

        return {
            id: row.id,
            tenant: tenant?.full_name ?? "Unknown tenant",
            property: property?.name ?? "Property",
            unit: unit?.name ?? "Unit",
            amount: Number(row.amount ?? 0),
            dueDate: row.due_date,
            status: invoiceStatus,
            type: resolveInvoiceType(row.description),
            issuedDate: row.created_at ?? row.due_date,
        };
    });

    return NextResponse.json({
        invoices,
        metrics: {
            totalOutstanding,
            overdueAmount,
            collectedLast30Days,
            totalInvoices: invoices.length,
        },
    });
}
