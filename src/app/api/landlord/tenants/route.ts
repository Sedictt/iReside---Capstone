import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeaseStatus, PaymentStatus } from "@/types/database";

type TenantStatus = "Active" | "Moving Out" | "Evicted";
type TenantPaymentStatus = "paid" | "late" | "pending";

type TenantItem = {
    id: string;
    name: string;
    property: string;
    unit: string;
    status: TenantStatus;
    rentAmount: number | null;
    leaseEnd: string | null;
    phone: string;
    email: string;
    avatar: string;
    avatarUrl: string | null;
    paymentStatus: TenantPaymentStatus;
};

const resolveTenantStatus = (leaseStatus: LeaseStatus, hasMoveOut: boolean): TenantStatus => {
    if (leaseStatus === "terminated") return "Evicted";
    if (hasMoveOut || leaseStatus === "expired") return "Moving Out";
    return "Active";
};

const resolvePaymentStatus = (
    payment: { status: PaymentStatus; due_date: string } | null
): TenantPaymentStatus => {
    if (!payment) return "pending";
    if (payment.status === "completed") return "paid";

    const dueDate = new Date(payment.due_date);
    if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
        return "late";
    }

    return "pending";
};

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: leaseRows, error: leasesError } = await supabase
        .from("leases")
        .select("id, tenant_id, unit_id, status, end_date, monthly_rent")
        .eq("landlord_id", user.id)
        .in("status", ["active", "expired", "terminated"]);

    if (leasesError) {
        return NextResponse.json({ error: "Failed to load tenants." }, { status: 500 });
    }

    if (!leaseRows || leaseRows.length === 0) {
        return NextResponse.json({ tenants: [] satisfies TenantItem[] });
    }

    const tenantIds = Array.from(
        new Set(leaseRows.map((row) => row.tenant_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set(leaseRows.map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );
    const leaseIds = leaseRows.map((row) => row.id);

    const { data: tenantRows, error: tenantsError } =
        tenantIds.length > 0
            ? await supabase
                  .from("profiles")
                  .select("id, full_name, email, phone, avatar_url")
                  .in("id", tenantIds)
            : { data: [], error: null };

    if (tenantsError) {
        return NextResponse.json({ error: "Failed to load tenant profiles." }, { status: 500 });
    }

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

    const { data: moveOutRows, error: moveOutError } =
        leaseIds.length > 0
            ? await supabase.from("move_out_requests").select("lease_id, status").in("lease_id", leaseIds)
            : { data: [], error: null };

    if (moveOutError) {
        return NextResponse.json({ error: "Failed to load move-out requests." }, { status: 500 });
    }

    const { data: paymentRows, error: paymentsError } =
        leaseIds.length > 0
            ? await supabase
                  .from("payments")
                  .select("lease_id, status, due_date")
                  .in("lease_id", leaseIds)
                  .order("due_date", { ascending: false })
            : { data: [], error: null };

    if (paymentsError) {
        return NextResponse.json({ error: "Failed to load payments." }, { status: 500 });
    }

    const tenantMap = new Map((tenantRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const movingOutLeaseIds = new Set<string>();
    (moveOutRows ?? []).forEach((row) => {
        if (row.status === "pending" || row.status === "approved") {
            movingOutLeaseIds.add(row.lease_id);
        }
    });

    const latestPaymentMap = new Map<string, { status: PaymentStatus; due_date: string }>();
    (paymentRows ?? []).forEach((row) => {
        if (!latestPaymentMap.has(row.lease_id)) {
            latestPaymentMap.set(row.lease_id, {
                status: row.status,
                due_date: row.due_date,
            });
        }
    });

    const tenants: TenantItem[] = leaseRows.map((lease) => {
        const tenant = tenantMap.get(lease.tenant_id);
        const unit = unitMap.get(lease.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const hasMoveOut = movingOutLeaseIds.has(lease.id);
        const paymentStatus = resolvePaymentStatus(latestPaymentMap.get(lease.id) ?? null);

        const name = tenant?.full_name ?? "Unknown tenant";
        const initials = name
            .split(" ")
            .filter((part) => part.trim().length > 0)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");

        return {
            id: lease.id,
            name,
            property: property?.name ?? "Property",
            unit: unit?.name ?? "Unit",
            status: resolveTenantStatus(lease.status, hasMoveOut),
            rentAmount: typeof lease.monthly_rent === "number" ? lease.monthly_rent : null,
            leaseEnd: lease.end_date ?? null,
            phone: isNonEmptyString(tenant?.phone) ? tenant.phone : "Not provided",
            email: isNonEmptyString(tenant?.email) ? tenant.email : "Not provided",
            avatar: initials || "NA",
            avatarUrl: tenant?.avatar_url ?? null,
            paymentStatus,
        };
    });

    return NextResponse.json({ tenants });
}
