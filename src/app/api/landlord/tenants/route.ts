import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
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
    avatarBgColor: string | null;
    paymentStatus: TenantPaymentStatus;
    onboardingStatus: "pending" | "in_progress" | "completed" | "not_started";
    lastOnboardingReminderAt: string | null;
    productTourStatus: "not_started" | "in_progress" | "skipped" | "completed";
    productTourStartedAt: string | null;
    productTourCompletedAt: string | null;
    productTourLastEventAt: string | null;
};

type TenantOnboardingStateRow = {
    tenant_id: string;
    status: "pending" | "in_progress" | "completed";
    last_reminder_sent_at: string | null;
};

type TenantProductTourStateRow = {
    tenant_id: string;
    status: "not_started" | "in_progress" | "skipped" | "completed" | null;
    started_at: string | null;
    completed_at: string | null;
    last_event_at: string | null;
};

type OptionalTenantStateClient = {
    from: (table: string) => {
        select: (columns: string) => {
            in: (
                column: string,
                values: string[]
            ) => Promise<{ data: any[] | null; error: unknown }>;
        };
    };
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

const logOptionalQueryFailure = (scope: string, error: unknown) => {
    console.warn(`[api/landlord/tenants] ${scope}`, error);
};

export async function GET(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();

    const optionalStateClient = supabase as unknown as OptionalTenantStateClient;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    let leaseQuery = supabase
        .from("leases")
        .select("id, tenant_id, unit_id, status, end_date, monthly_rent")
        .eq("landlord_id", user.id)
        .in("status", ["active", "expired", "terminated"]);

    if (propertyId && propertyId !== "all") {
        const { data: propertyRow, error: propertyError } = await supabase
            .from("properties")
            .select("id")
            .eq("id", propertyId)
            .eq("landlord_id", user.id)
            .maybeSingle();

        if (propertyError) {
            return NextResponse.json({ error: "Failed to load tenants." }, { status: 500 });
        }

        if (!propertyRow) {
            return NextResponse.json({ tenants: [] satisfies TenantItem[] });
        }

        const { data: propertyUnits, error: propertyUnitsError } = await supabase
            .from("units")
            .select("id")
            .eq("property_id", propertyRow.id);

        if (propertyUnitsError) {
            return NextResponse.json({ error: "Failed to load tenants." }, { status: 500 });
        }

        const propertyUnitIds = (propertyUnits ?? [])
            .map((row) => row.id)
            .filter((value): value is string => Boolean(value));

        if (propertyUnitIds.length === 0) {
            return NextResponse.json({ tenants: [] satisfies TenantItem[] });
        }

        leaseQuery = leaseQuery.in("unit_id", propertyUnitIds);
    }

    const { data: leaseRows, error: leasesError } = await leaseQuery;

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
                  .select("id, full_name, email, phone, avatar_url, avatar_bg_color")
                  .in("id", tenantIds)
            : { data: [], error: null };

    if (tenantsError) {
        logOptionalQueryFailure("Failed to load tenant profiles.", tenantsError);
    }

    const { data: onboardingRows, error: onboardingError } =
        tenantIds.length > 0
            ? await optionalStateClient
                  .from("tenant_product_tour_states")
                  .select("tenant_id, status, last_reminder_sent_at")
                  .in("tenant_id", tenantIds)
            : { data: [], error: null };

    if (onboardingError) {
        logOptionalQueryFailure("Failed to load tenant onboarding states.", onboardingError);
    }

    const { data: tourRows, error: tourError } =
        tenantIds.length > 0
            ? await optionalStateClient
                  .from("tenant_product_tour_states")
                  .select("tenant_id, status, started_at, completed_at, last_event_at")
                  .in("tenant_id", tenantIds)
            : { data: [], error: null };

    if (tourError) {
        logOptionalQueryFailure("Failed to load tenant product tour states.", tourError);
    }

    const { data: unitRows, error: unitsError } =
        unitIds.length > 0
            ? await supabase.from("units").select("id, name, property_id").in("id", unitIds)
            : { data: [], error: null };

    if (unitsError) {
        logOptionalQueryFailure("Failed to load units.", unitsError);
    }

    const propertyIds = Array.from(
        new Set((unitRows ?? []).map((row) => row.property_id).filter((value): value is string => Boolean(value)))
    );

    const { data: propertyRows, error: propertiesError } =
        propertyIds.length > 0
            ? await supabase.from("properties").select("id, name").in("id", propertyIds)
            : { data: [], error: null };

    if (propertiesError) {
        logOptionalQueryFailure("Failed to load properties.", propertiesError);
    }

    const { data: moveOutRows, error: moveOutError } =
        leaseIds.length > 0
            ? ((await (supabase as any)
                  .from("move_out_requests")
                  .select("lease_id, status")
                  .in("lease_id", leaseIds)) as {
                  data: Array<{ lease_id: string; status: string }> | null;
                  error: any;
              })
            : { data: [], error: null };

    if (moveOutError) {
        logOptionalQueryFailure("Failed to load move-out requests.", moveOutError);
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
        logOptionalQueryFailure("Failed to load payments.", paymentsError);
    }

    const tenantMap = new Map((tenantRows ?? []).map((row) => [row.id, row]));
    const onboardingMap = new Map(
        (onboardingRows ?? []).map((row) => [
            row.tenant_id,
            {
                status: row.status,
                lastReminderSentAt: row.last_reminder_sent_at ?? null,
            },
        ])
    );
    const tourMap = new Map(
        (tourRows ?? []).map((row) => [
            row.tenant_id,
            {
                status: row.status ?? "not_started",
                startedAt: row.started_at ?? null,
                completedAt: row.completed_at ?? null,
                lastEventAt: row.last_event_at ?? null,
            },
        ])
    );
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
        const onboarding = onboardingMap.get(lease.tenant_id);
        const tour = tourMap.get(lease.tenant_id);

        const name = tenant?.full_name ?? "Unknown tenant";
        const initials = name
            .split(" ")
            .filter((part) => part.trim().length > 0)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");

        return {
            id: lease.tenant_id,
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
            avatarBgColor: tenant?.avatar_bg_color ?? null,
            paymentStatus,
            onboardingStatus: onboarding?.status ?? "not_started",
            lastOnboardingReminderAt: onboarding?.lastReminderSentAt ?? null,
            productTourStatus: tour?.status ?? "not_started",
            productTourStartedAt: tour?.startedAt ?? null,
            productTourCompletedAt: tour?.completedAt ?? null,
            productTourLastEventAt: tour?.lastEventAt ?? null,
        };
    });

    return NextResponse.json({ tenants });
}
