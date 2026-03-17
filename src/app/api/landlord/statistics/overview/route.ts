import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ChangeType = "positive" | "negative" | "neutral";

type KpiApiItem = {
    title: string;
    value: string;
    change: string;
    simplifiedChange: string;
    trendData: number[];
    changeType: ChangeType;
};

type FinancialWindow = {
    labels: string[];
    earnings: number[];
    expenses: number[];
    netIncome: number[];
};

type OverviewPayload = {
    primaryKpis: KpiApiItem[];
    extendedKpis: KpiApiItem[];
    financialChart: {
        week: FinancialWindow;
        month: FinancialWindow;
        year: FinancialWindow;
    };
    featuredProperty: {
        propertyName: string;
        totalSales: string;
        totalViews: string;
        image: string;
        momGrowth: string;
        occupancyRate: string;
    };
};

type LeaseRow = {
    id: string;
    unit_id: string;
    tenant_id: string;
    status: string;
    start_date: string;
    end_date: string;
    monthly_rent: number;
};

type UnitRow = {
    id: string;
    property_id: string;
    rent_amount: number;
};

type PropertyRow = {
    id: string;
    name: string;
    images: string[] | null;
};

type PaymentRow = {
    amount: number;
    status: string;
    paid_at: string | null;
    due_date: string;
    description: string | null;
    lease_id: string;
};

type MaintenanceRow = {
    created_at: string;
    resolved_at: string | null;
    priority: string;
};

type ApplicationRow = {
    unit_id: string;
    created_at: string;
};

const CURRENCY = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
});

const CURRENCY_NO_CENTS = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
});

const CURRENCY_COMPACT = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 1,
    notation: "compact",
});

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

const parseDateOnly = (value: string) => new Date(`${value}T00:00:00`);
const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const endOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
const addDays = (value: Date, days: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
};

const dateKey = (value: Date) => value.toISOString().slice(0, 10);

const toSafeNumber = (value: number | null | undefined) => Number(value ?? 0);

const clampTrend = (input: number[]) => input.map((item) => Number(item.toFixed(2)));

const formatDelta = (delta: number, valueType: "currency" | "count" | "percent" | "years") => {
    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const absolute = Math.abs(delta);

    if (valueType === "currency") {
        return `${sign}${CURRENCY_NO_CENTS.format(absolute)}`;
    }

    if (valueType === "percent") {
        return `${sign}${absolute.toFixed(1)}%`;
    }

    if (valueType === "years") {
        return `${sign}${absolute.toFixed(1)} yrs`;
    }

    return `${sign}${NUMBER_FORMAT.format(Math.round(absolute))}`;
};

const formatPctDelta = (current: number, previous: number) => {
    if (previous === 0) {
        if (current === 0) return "0.0%";
        return "100.0%";
    }

    const pct = ((current - previous) / Math.abs(previous)) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};

const buildSnapshotPoints = (start: Date, end: Date, count: number) => {
    if (count <= 1) return [startOfDay(end)];

    const totalMs = end.getTime() - start.getTime();
    return Array.from({ length: count }, (_, index) => {
        const ratio = index / (count - 1);
        return new Date(start.getTime() + totalMs * ratio);
    });
};

const isLeaseActiveOn = (lease: LeaseRow, referenceDate: Date) => {
    if (lease.status !== "active") return false;
    const leaseStart = startOfDay(parseDateOnly(lease.start_date));
    const leaseEnd = endOfDay(parseDateOnly(lease.end_date));
    const ref = endOfDay(referenceDate);

    return leaseStart <= ref && leaseEnd >= ref;
};

const activeLeaseSnapshot = (leases: LeaseRow[], referenceDate: Date) => leases.filter((lease) => isLeaseActiveOn(lease, referenceDate));

const pendingIssuesSnapshot = (maintenance: MaintenanceRow[], referenceDate: Date) => {
    const ref = endOfDay(referenceDate);

    return maintenance.filter((item) => {
        const createdAt = new Date(item.created_at);
        if (Number.isNaN(createdAt.getTime()) || createdAt > ref) {
            return false;
        }

        if (!item.resolved_at) {
            return true;
        }

        const resolvedAt = new Date(item.resolved_at);
        if (Number.isNaN(resolvedAt.getTime())) {
            return true;
        }

        return resolvedAt > ref;
    });
};

const averageTenantDurationYears = (activeLeases: LeaseRow[], referenceDate: Date) => {
    if (activeLeases.length === 0) return 0;

    const totalYears = activeLeases.reduce((sum, lease) => {
        const leaseStart = parseDateOnly(lease.start_date);
        const diffDays = Math.max(0, (endOfDay(referenceDate).getTime() - startOfDay(leaseStart).getTime()) / (1000 * 60 * 60 * 24));
        return sum + diffDays / 365;
    }, 0);

    return totalYears / activeLeases.length;
};

const monthlyRentRoll = (activeLeases: LeaseRow[]) => activeLeases.reduce((sum, lease) => sum + toSafeNumber(lease.monthly_rent), 0);

const sumPaymentsInRange = (payments: PaymentRow[], start: Date, end: Date, predicate?: (payment: PaymentRow) => boolean) => {
    const from = startOfDay(start);
    const to = endOfDay(end);

    return payments.reduce((sum, payment) => {
        if (payment.status !== "completed" || !payment.paid_at) {
            return sum;
        }

        const paidAt = new Date(payment.paid_at);
        if (Number.isNaN(paidAt.getTime()) || paidAt < from || paidAt > to) {
            return sum;
        }

        if (predicate && !predicate(payment)) {
            return sum;
        }

        return sum + toSafeNumber(payment.amount);
    }, 0);
};

const countRenewalsWithin = (leases: LeaseRow[], referenceDate: Date, windowDays: number) => {
    const from = startOfDay(referenceDate);
    const to = endOfDay(addDays(referenceDate, windowDays));

    return leases.filter((lease) => {
        if (lease.status !== "active") return false;
        const leaseEnd = parseDateOnly(lease.end_date);
        return leaseEnd >= from && leaseEnd <= to;
    }).length;
};

const maybeMaintenancePayment = (payment: PaymentRow) => {
    const text = (payment.description ?? "").toLowerCase();
    return text.includes("maintenance") || text.includes("repair") || text.includes("plumbing") || text.includes("electrical") || text.includes("fix");
};

const buildFinancialWindows = (payments: PaymentRow[]) => {
    const now = new Date();

    const weekStart = addDays(startOfDay(now), -6);
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    const weekLabels = weekDays.map((day) => day.toLocaleDateString("en-US", { weekday: "short" }));
    const weekEarnings = new Array(7).fill(0);
    const weekExpenses = new Array(7).fill(0);

    const weekIndexByKey = new Map<string, number>();
    weekDays.forEach((day, index) => {
        weekIndexByKey.set(dateKey(day), index);
    });

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    const monthEarnings = new Array(5).fill(0);
    const monthExpenses = new Array(5).fill(0);

    const yearLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearEarnings = new Array(12).fill(0);
    const yearExpenses = new Array(12).fill(0);

    payments.forEach((payment) => {
        if (payment.status === "completed" && payment.paid_at) {
            const paidAt = new Date(payment.paid_at);
            if (!Number.isNaN(paidAt.getTime())) {
                const paidDay = startOfDay(paidAt);
                const paidKey = dateKey(paidDay);

                const weekIndex = weekIndexByKey.get(paidKey);
                if (weekIndex !== undefined) {
                    weekEarnings[weekIndex] += toSafeNumber(payment.amount);
                }

                if (paidAt >= monthStart && paidAt <= endOfDay(monthEnd)) {
                    const monthWeekIndex = Math.min(4, Math.ceil(paidAt.getDate() / 7) - 1);
                    monthEarnings[monthWeekIndex] += toSafeNumber(payment.amount);
                }

                if (paidAt.getFullYear() === now.getFullYear()) {
                    yearEarnings[paidAt.getMonth()] += toSafeNumber(payment.amount);
                }
            }
        }

        if (payment.status === "pending" || payment.status === "processing") {
            const dueDate = parseDateOnly(payment.due_date);
            if (!Number.isNaN(dueDate.getTime())) {
                const dueDay = startOfDay(dueDate);
                const dueKey = dateKey(dueDay);

                const weekIndex = weekIndexByKey.get(dueKey);
                if (weekIndex !== undefined) {
                    weekExpenses[weekIndex] += toSafeNumber(payment.amount);
                }

                if (dueDate >= monthStart && dueDate <= endOfDay(monthEnd)) {
                    const monthWeekIndex = Math.min(4, Math.ceil(dueDate.getDate() / 7) - 1);
                    monthExpenses[monthWeekIndex] += toSafeNumber(payment.amount);
                }

                if (dueDate.getFullYear() === now.getFullYear()) {
                    yearExpenses[dueDate.getMonth()] += toSafeNumber(payment.amount);
                }
            }
        }
    });

    return {
        week: {
            labels: weekLabels,
            earnings: clampTrend(weekEarnings),
            expenses: clampTrend(weekExpenses),
            netIncome: clampTrend(weekEarnings.map((amount, index) => amount - weekExpenses[index])),
        },
        month: {
            labels: monthLabels,
            earnings: clampTrend(monthEarnings),
            expenses: clampTrend(monthExpenses),
            netIncome: clampTrend(monthEarnings.map((amount, index) => amount - monthExpenses[index])),
        },
        year: {
            labels: yearLabels,
            earnings: clampTrend(yearEarnings),
            expenses: clampTrend(yearExpenses),
            netIncome: clampTrend(yearEarnings.map((amount, index) => amount - yearExpenses[index])),
        },
    };
};

export async function GET(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const requestedEnd = searchParams.get("end");
    const requestedStart = searchParams.get("start");

    const defaultEnd = startOfDay(new Date());
    const defaultStart = addDays(defaultEnd, -29);

    const selectedStart = requestedStart ? parseDateOnly(requestedStart) : defaultStart;
    const selectedEnd = requestedEnd ? parseDateOnly(requestedEnd) : defaultEnd;

    if (Number.isNaN(selectedStart.getTime()) || Number.isNaN(selectedEnd.getTime())) {
        return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }

    const rangeStart = selectedStart <= selectedEnd ? selectedStart : selectedEnd;
    const rangeEnd = selectedStart <= selectedEnd ? selectedEnd : selectedStart;

    const spanDays = Math.max(1, Math.floor((endOfDay(rangeEnd).getTime() - startOfDay(rangeStart).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const previousEnd = addDays(rangeStart, -1);
    const previousStart = addDays(previousEnd, -(spanDays - 1));

    const [leasesRes, propertiesRes, paymentsRes, maintenanceRes, applicationsRes] = await Promise.all([
        supabase
            .from("leases")
            .select("id, unit_id, tenant_id, status, start_date, end_date, monthly_rent")
            .eq("landlord_id", user.id),
        supabase
            .from("properties")
            .select("id, name, images")
            .eq("landlord_id", user.id),
        supabase
            .from("payments")
            .select("amount, status, paid_at, due_date, description, lease_id")
            .eq("landlord_id", user.id),
        supabase
            .from("maintenance_requests")
            .select("created_at, resolved_at, priority")
            .eq("landlord_id", user.id),
        supabase
            .from("applications")
            .select("unit_id, created_at")
            .eq("landlord_id", user.id),
    ]);

    if (leasesRes.error || propertiesRes.error || paymentsRes.error || maintenanceRes.error || applicationsRes.error) {
        return NextResponse.json({ error: "Failed to load statistics overview." }, { status: 500 });
    }

    const propertyIds = (propertiesRes.data ?? []).map((row) => row.id);

    const { data: unitsData, error: unitsError } =
        propertyIds.length > 0
            ? await supabase.from("units").select("id, property_id, rent_amount").in("property_id", propertyIds)
            : { data: [], error: null };

    if (unitsError) {
        return NextResponse.json({ error: "Failed to load statistics overview." }, { status: 500 });
    }

    const leases = (leasesRes.data ?? []) as LeaseRow[];
    const units = (unitsData ?? []) as UnitRow[];
    const properties = (propertiesRes.data ?? []) as PropertyRow[];
    const payments = (paymentsRes.data ?? []) as PaymentRow[];
    const maintenance = (maintenanceRes.data ?? []) as MaintenanceRow[];
    const applications = (applicationsRes.data ?? []) as ApplicationRow[];

    const currentActiveLeases = activeLeaseSnapshot(leases, rangeEnd);
    const previousActiveLeases = activeLeaseSnapshot(leases, previousEnd);

    const currentTenantCount = new Set(currentActiveLeases.map((lease) => lease.tenant_id)).size;
    const previousTenantCount = new Set(previousActiveLeases.map((lease) => lease.tenant_id)).size;

    const unitCount = units.length;
    const currentOccupiedUnits = new Set(currentActiveLeases.map((lease) => lease.unit_id)).size;
    const previousOccupiedUnits = new Set(previousActiveLeases.map((lease) => lease.unit_id)).size;

    const occupancyCurrent = unitCount > 0 ? (currentOccupiedUnits / unitCount) * 100 : 0;
    const occupancyPrevious = unitCount > 0 ? (previousOccupiedUnits / unitCount) * 100 : 0;

    const currentPendingIssues = pendingIssuesSnapshot(maintenance, rangeEnd);
    const previousPendingIssues = pendingIssuesSnapshot(maintenance, previousEnd);
    const criticalPendingNow = currentPendingIssues.filter((item) => item.priority === "urgent").length;

    const currentEarnings = sumPaymentsInRange(payments, rangeStart, rangeEnd);
    const previousEarnings = sumPaymentsInRange(payments, previousStart, previousEnd);

    const directMaintenanceCostCurrent = sumPaymentsInRange(payments, rangeStart, rangeEnd, maybeMaintenancePayment);
    const directMaintenanceCostPrevious = sumPaymentsInRange(payments, previousStart, previousEnd, maybeMaintenancePayment);
    const resolvedCurrentCount = maintenance.filter((item) => {
        if (!item.resolved_at) return false;
        const resolved = new Date(item.resolved_at);
        return !Number.isNaN(resolved.getTime()) && resolved >= startOfDay(rangeStart) && resolved <= endOfDay(rangeEnd);
    }).length;
    const resolvedPreviousCount = maintenance.filter((item) => {
        if (!item.resolved_at) return false;
        const resolved = new Date(item.resolved_at);
        return !Number.isNaN(resolved.getTime()) && resolved >= startOfDay(previousStart) && resolved <= endOfDay(previousEnd);
    }).length;

    const maintenanceCostCurrent = directMaintenanceCostCurrent > 0 ? directMaintenanceCostCurrent : resolvedCurrentCount * 1500;
    const maintenanceCostPrevious = directMaintenanceCostPrevious > 0 ? directMaintenanceCostPrevious : resolvedPreviousCount * 1500;

    const renewalsCurrent = countRenewalsWithin(leases, rangeEnd, 30);
    const renewalsPrevious = countRenewalsWithin(leases, previousEnd, 30);

    const tenantDurationCurrent = averageTenantDurationYears(currentActiveLeases, rangeEnd);
    const tenantDurationPrevious = averageTenantDurationYears(previousActiveLeases, previousEnd);

    const portfolioValueCurrent = monthlyRentRoll(currentActiveLeases) * 12;
    const portfolioValuePrevious = monthlyRentRoll(previousActiveLeases) * 12;

    const trendPoints = buildSnapshotPoints(rangeStart, rangeEnd, 7);

    const earningsTrend = trendPoints.map((_, index) => {
        const segmentStart = index === 0 ? startOfDay(rangeStart) : trendPoints[index - 1];
        const segmentEnd = endOfDay(trendPoints[index]);
        return sumPaymentsInRange(payments, segmentStart, segmentEnd);
    });

    const tenantTrend = trendPoints.map((point) => new Set(activeLeaseSnapshot(leases, point).map((lease) => lease.tenant_id)).size);
    const occupancyTrend = trendPoints.map((point) => {
        const occupied = new Set(activeLeaseSnapshot(leases, point).map((lease) => lease.unit_id)).size;
        return unitCount > 0 ? (occupied / unitCount) * 100 : 0;
    });
    const pendingIssuesTrend = trendPoints.map((point) => pendingIssuesSnapshot(maintenance, point).length);
    const maintenanceCostTrend = trendPoints.map((point) => {
        const from = addDays(startOfDay(point), -6);
        const direct = sumPaymentsInRange(payments, from, point, maybeMaintenancePayment);
        if (direct > 0) return direct;

        const resolved = maintenance.filter((item) => {
            if (!item.resolved_at) return false;
            const resolvedAt = new Date(item.resolved_at);
            return !Number.isNaN(resolvedAt.getTime()) && resolvedAt >= startOfDay(from) && resolvedAt <= endOfDay(point);
        }).length;

        return resolved * 1500;
    });
    const renewalsTrend = trendPoints.map((point) => countRenewalsWithin(leases, point, 30));
    const tenantDurationTrend = trendPoints.map((point) => averageTenantDurationYears(activeLeaseSnapshot(leases, point), point));
    const portfolioTrend = trendPoints.map((point) => monthlyRentRoll(activeLeaseSnapshot(leases, point)) * 12);

    const primaryKpis: KpiApiItem[] = [
        {
            title: "Estimated Earnings",
            value: CURRENCY.format(currentEarnings),
            change: `${formatDelta(currentEarnings - previousEarnings, "currency")} (${formatPctDelta(currentEarnings, previousEarnings)})`,
            simplifiedChange: `${formatDelta(currentEarnings - previousEarnings, "currency")} since previous period`,
            trendData: clampTrend(earningsTrend),
            changeType: currentEarnings > previousEarnings ? "positive" : currentEarnings < previousEarnings ? "negative" : "neutral",
        },
        {
            title: "Active Tenants",
            value: NUMBER_FORMAT.format(currentTenantCount),
            change: `${formatDelta(currentTenantCount - previousTenantCount, "count")} vs previous period`,
            simplifiedChange: `${formatDelta(currentTenantCount - previousTenantCount, "count")} active tenants`,
            trendData: clampTrend(tenantTrend),
            changeType: currentTenantCount > previousTenantCount ? "positive" : currentTenantCount < previousTenantCount ? "negative" : "neutral",
        },
        {
            title: "Occupancy Rate",
            value: `${Math.round(occupancyCurrent)}%`,
            change: `${formatDelta(occupancyCurrent - occupancyPrevious, "percent")} vs previous period`,
            simplifiedChange: `${formatDelta(occupancyCurrent - occupancyPrevious, "percent")} occupancy change`,
            trendData: clampTrend(occupancyTrend),
            changeType: occupancyCurrent > occupancyPrevious ? "positive" : occupancyCurrent < occupancyPrevious ? "negative" : "neutral",
        },
        {
            title: "Pending Issues",
            value: NUMBER_FORMAT.format(currentPendingIssues.length),
            change: `${formatDelta(currentPendingIssues.length - previousPendingIssues.length, "count")} pending (${criticalPendingNow} urgent)`,
            simplifiedChange: `${criticalPendingNow} urgent issue${criticalPendingNow === 1 ? "" : "s"} right now`,
            trendData: clampTrend(pendingIssuesTrend),
            changeType: currentPendingIssues.length < previousPendingIssues.length ? "positive" : currentPendingIssues.length > previousPendingIssues.length ? "negative" : "neutral",
        },
    ];

    const extendedKpis: KpiApiItem[] = [
        {
            title: "Maintenance Cost",
            value: CURRENCY_NO_CENTS.format(maintenanceCostCurrent),
            change: `${formatDelta(maintenanceCostCurrent - maintenanceCostPrevious, "currency")} vs previous period`,
            simplifiedChange: `${formatDelta(maintenanceCostCurrent - maintenanceCostPrevious, "currency")} maintenance spend`,
            trendData: clampTrend(maintenanceCostTrend),
            changeType: maintenanceCostCurrent <= maintenanceCostPrevious ? "positive" : "negative",
        },
        {
            title: "Lease Renewals",
            value: NUMBER_FORMAT.format(renewalsCurrent),
            change: `${formatDelta(renewalsCurrent - renewalsPrevious, "count")} due in next 30 days`,
            simplifiedChange: `${NUMBER_FORMAT.format(renewalsCurrent)} contracts ending soon`,
            trendData: clampTrend(renewalsTrend),
            changeType: "neutral",
        },
        {
            title: "Avg. Tenant Duration",
            value: `${tenantDurationCurrent.toFixed(1)} Years`,
            change: `${formatDelta(tenantDurationCurrent - tenantDurationPrevious, "years")} vs previous period`,
            simplifiedChange: `${formatDelta(tenantDurationCurrent - tenantDurationPrevious, "years")} average stay`,
            trendData: clampTrend(tenantDurationTrend),
            changeType: tenantDurationCurrent >= tenantDurationPrevious ? "positive" : "negative",
        },
        {
            title: "Portfolio Value",
            value: CURRENCY_COMPACT.format(portfolioValueCurrent),
            change: `${formatPctDelta(portfolioValueCurrent, portfolioValuePrevious)} annualized rent value`,
            simplifiedChange: `${formatPctDelta(portfolioValueCurrent, portfolioValuePrevious)} total value trend`,
            trendData: clampTrend(portfolioTrend),
            changeType: portfolioValueCurrent >= portfolioValuePrevious ? "positive" : "negative",
        },
    ];

    const financialChart = buildFinancialWindows(payments);

    const leaseById = new Map(leases.map((lease) => [lease.id, lease]));
    const unitById = new Map(units.map((unit) => [unit.id, unit]));
    const propertyById = new Map(properties.map((property) => [property.id, property]));

    const propertyRevenueMap = new Map<string, number>();
    const propertyPreviousRevenueMap = new Map<string, number>();

    payments.forEach((payment) => {
        if (payment.status !== "completed" || !payment.paid_at) return;

        const lease = leaseById.get(payment.lease_id);
        const unit = lease ? unitById.get(lease.unit_id) : null;
        if (!unit) return;

        const paidAt = new Date(payment.paid_at);
        if (Number.isNaN(paidAt.getTime())) return;

        const amount = toSafeNumber(payment.amount);
        const propertyId = unit.property_id;

        if (paidAt >= startOfDay(rangeStart) && paidAt <= endOfDay(rangeEnd)) {
            propertyRevenueMap.set(propertyId, (propertyRevenueMap.get(propertyId) ?? 0) + amount);
        }

        if (paidAt >= startOfDay(previousStart) && paidAt <= endOfDay(previousEnd)) {
            propertyPreviousRevenueMap.set(propertyId, (propertyPreviousRevenueMap.get(propertyId) ?? 0) + amount);
        }
    });

    const topPropertyId =
        [...propertyRevenueMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
        properties[0]?.id ??
        null;

    const fallbackImage = "/hero-images/apartment-03.png";
    let featuredProperty: OverviewPayload["featuredProperty"] = {
        propertyName: "No Property Data Yet",
        totalSales: CURRENCY_NO_CENTS.format(0),
        totalViews: "0 inquiries",
        image: fallbackImage,
        momGrowth: "0.0%",
        occupancyRate: "0%",
    };

    if (topPropertyId) {
        const property = propertyById.get(topPropertyId);
        const totalSales = propertyRevenueMap.get(topPropertyId) ?? 0;
        const previousSales = propertyPreviousRevenueMap.get(topPropertyId) ?? 0;

        const propertyUnitIds = units.filter((unit) => unit.property_id === topPropertyId).map((unit) => unit.id);
        const propertyUnitSet = new Set(propertyUnitIds);

        const propertyOccupiedUnits = new Set(
            currentActiveLeases
                .filter((lease) => propertyUnitSet.has(lease.unit_id))
                .map((lease) => lease.unit_id)
        ).size;

        const occupancyRate = propertyUnitIds.length > 0 ? Math.round((propertyOccupiedUnits / propertyUnitIds.length) * 100) : 0;

        const propertyInquiries = applications.filter((item) => {
            const createdAt = new Date(item.created_at);
            return (
                propertyUnitSet.has(item.unit_id) &&
                !Number.isNaN(createdAt.getTime()) &&
                createdAt >= startOfDay(rangeStart) &&
                createdAt <= endOfDay(rangeEnd)
            );
        }).length;

        featuredProperty = {
            propertyName: property?.name ?? "Top Property",
            totalSales: CURRENCY_NO_CENTS.format(totalSales),
            totalViews: `${NUMBER_FORMAT.format(propertyInquiries)} inquiries`,
            image: property?.images?.[0] || fallbackImage,
            momGrowth: formatPctDelta(totalSales, previousSales),
            occupancyRate: `${occupancyRate}%`,
        };
    }

    return NextResponse.json({
        primaryKpis,
        extendedKpis,
        financialChart,
        featuredProperty,
    } satisfies OverviewPayload);
}
