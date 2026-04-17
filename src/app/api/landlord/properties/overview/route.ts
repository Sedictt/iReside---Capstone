import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PortfolioStatus = "Performing" | "Stable" | "Attention Required";

const FALLBACK_PROPERTY_IMAGE =
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80";

const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000) {
        return `₱${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `₱${(value / 1_000).toFixed(1)}K`;
    }
    return `₱${Math.round(value)}`;
};

const getStatus = (occupied: number, total: number, maintenanceCount: number): PortfolioStatus => {
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    if (maintenanceCount >= 5 || occupancyRate < 70) {
        return "Attention Required";
    }

    if (occupancyRate >= 90 && maintenanceCount <= 2) {
        return "Performing";
    }

    return "Stable";
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

    const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, address, type, images")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (propertiesError) {
        return NextResponse.json({ error: "Failed to fetch properties." }, { status: 500 });
    }

    const propertyIds = (properties ?? []).map((property) => property.id);

    if (propertyIds.length === 0) {
        return NextResponse.json({ properties: [] });
    }

    const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id, property_id, status, rent_amount")
        .in("property_id", propertyIds);

    const { data: policies, error: policiesError } = await supabase
        .from("property_environment_policies")
        .select("property_id, environment_mode, needs_review")
        .in("property_id", propertyIds);

    if (unitsError) {
        return NextResponse.json({ error: "Failed to fetch units." }, { status: 500 });
    }

    const unitIds = (units ?? []).map((unit) => unit.id);

    const { data: maintenanceRows, error: maintenanceError } =
        unitIds.length > 0
            ? await supabase
                  .from("maintenance_requests")
                  .select("unit_id, status")
                  .in("unit_id", unitIds)
            : { data: [], error: null };

    if (maintenanceError) {
        return NextResponse.json({ error: "Failed to fetch maintenance data." }, { status: 500 });
    }

    const { data: leases, error: leasesError } =
        unitIds.length > 0
            ? await supabase
                  .from("leases")
                  .select("id, unit_id")
                  .eq("landlord_id", user.id)
                  .in("unit_id", unitIds)
            : { data: [], error: null };

    if (leasesError) {
        return NextResponse.json({ error: "Failed to fetch leases." }, { status: 500 });
    }

    const leaseIds = (leases ?? []).map((lease) => lease.id);

    const { data: payments, error: paymentsError } =
        leaseIds.length > 0
            ? await supabase
                  .from("payments")
                  .select("lease_id, amount, status")
                  .in("lease_id", leaseIds)
            : { data: [], error: null };

    if (paymentsError) {
        return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
    }

    const unitsByProperty = new Map<string, typeof units>();
    for (const propertyId of propertyIds) {
        unitsByProperty.set(
            propertyId,
            (units ?? []).filter((unit) => unit.property_id === propertyId)
        );
    }

    const policiesByProperty = new Map<string, any>();
    for (const policy of policies ?? []) {
        policiesByProperty.set(policy.property_id, policy);
    }

    const leasesByUnit = new Map<string, string[]>();
    for (const lease of leases ?? []) {
        const existing = leasesByUnit.get(lease.unit_id) ?? [];
        existing.push(lease.id);
        leasesByUnit.set(lease.unit_id, existing);
    }

    const paymentsByLease = new Map<string, number>();
    for (const payment of payments ?? []) {
        if (payment.status !== "completed") continue;
        const current = paymentsByLease.get(payment.lease_id) ?? 0;
        paymentsByLease.set(payment.lease_id, current + Number(payment.amount ?? 0));
    }

    const result = (properties ?? []).map((property) => {
        const propertyUnits = unitsByProperty.get(property.id) ?? [];
        const occupied = propertyUnits.filter((unit) => unit.status === "occupied").length;
        const total = propertyUnits.length;

        const propertyUnitIds = new Set(propertyUnits.map((unit) => unit.id));
        const activeMaintenance = (maintenanceRows ?? []).filter(
            (request) =>
                propertyUnitIds.has(request.unit_id) &&
                (request.status === "open" || request.status === "in_progress")
        ).length;

        const propertyLeaseIds = propertyUnits.flatMap((unit) => leasesByUnit.get(unit.id) ?? []);
        const noiValue = propertyLeaseIds.reduce((sum, leaseId) => sum + (paymentsByLease.get(leaseId) ?? 0), 0);

        const annualPotential = propertyUnits.reduce((sum, unit) => sum + Number(unit.rent_amount ?? 0), 0) * 12;
        const valuationValue = annualPotential * 14;
        const capRate = valuationValue > 0 ? (noiValue / valuationValue) * 100 : 0;
        const status = getStatus(occupied, total, activeMaintenance);

        let recentActivity = "No recent activity";
        if (activeMaintenance > 0) {
            recentActivity = `${activeMaintenance} active maintenance request${activeMaintenance === 1 ? "" : "s"}`;
        } else if (total > occupied) {
            const vacant = total - occupied;
            recentActivity = `${vacant} vacant unit${vacant === 1 ? "" : "s"} available`;
        } else if (total > 0) {
            recentActivity = "All units currently occupied";
        }

        const policy = policiesByProperty.get(property.id);

        return {
            id: property.id,
            name: property.name,
            address: property.address,
            type: policy?.environment_mode || property.type,
            needsReview: policy?.needs_review || false,
            capRate: `${capRate.toFixed(1)}%`,
            noi: formatCompactCurrency(noiValue),
            valuation: formatCompactCurrency(valuationValue),
            metrics: {
                occupied,
                total,
                maintenance: activeMaintenance,
            },
            recentActivity,
            status,
            image:
                Array.isArray(property.images) &&
                typeof property.images[0] === "string" &&
                property.images[0].trim().length > 0
                    ? property.images[0]
                    : FALLBACK_PROPERTY_IMAGE,
        };
    });

    return NextResponse.json({ properties: result });
}
