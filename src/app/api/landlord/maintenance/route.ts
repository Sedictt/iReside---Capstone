import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MaintenancePriority, MaintenanceStatus } from "@/types/database";

type MaintenanceStatusLabel = "Pending" | "Assigned" | "In Progress" | "Resolved";
type MaintenancePriorityLabel = "Critical" | "High" | "Medium" | "Low";

type MaintenanceRequestItem = {
    id: string;
    title: string;
    description: string;
    property: string;
    unit: string;
    tenant: string;
    tenantAvatar: string | null;
    priority: MaintenancePriorityLabel;
    status: MaintenanceStatusLabel;
    reportedAt: string;
    assignee?: string | null;
    scheduledFor?: string | null;
    images: string[];
};

type MaintenanceMetrics = {
    actionRequired: number;
    inProgress: number;
    scheduled: number;
    resolvedThisMonth: number;
};

const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const resolveStatus = (status: MaintenanceStatus | null | undefined): MaintenanceStatusLabel => {
    switch (status) {
        case "in_progress":
            return "In Progress";
        case "resolved":
        case "closed":
            return "Resolved";
        case "open":
        default:
            return "Pending";
    }
};

const resolvePriority = (priority: MaintenancePriority | null | undefined): MaintenancePriorityLabel => {
    switch (priority) {
        case "urgent":
            return "Critical";
        case "high":
            return "High";
        case "medium":
            return "Medium";
        case "low":
        default:
            return "Low";
    }
};

const formatRelativeDate = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) return "Recently";

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const minutes = Math.max(1, Math.floor(diffMs / minute));
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    if (diffMs < day) {
        const hours = Math.max(1, Math.floor(diffMs / hour));
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
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

    const { data: requestRows, error: requestsError } = await supabase
        .from("maintenance_requests")
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, resolved_at, created_at"
        )
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

    if (requestsError) {
        return NextResponse.json({ error: "Failed to load maintenance requests." }, { status: 500 });
    }

    if (!requestRows || requestRows.length === 0) {
        return NextResponse.json({
            requests: [] satisfies MaintenanceRequestItem[],
            metrics: {
                actionRequired: 0,
                inProgress: 0,
                scheduled: 0,
                resolvedThisMonth: 0,
            } satisfies MaintenanceMetrics,
        });
    }

    const tenantIds = Array.from(
        new Set(requestRows.map((row) => row.tenant_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set(requestRows.map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: tenantRows, error: tenantsError } =
        tenantIds.length > 0
            ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", tenantIds)
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

    const tenantMap = new Map((tenantRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let actionRequired = 0;
    let inProgress = 0;
    let resolvedThisMonth = 0;

    const requests: MaintenanceRequestItem[] = requestRows.map((row) => {
        const tenant = tenantMap.get(row.tenant_id);
        const unit = unitMap.get(row.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const status = resolveStatus(row.status);
        const priority = resolvePriority(row.priority);

        if (status === "Pending") {
            actionRequired += 1;
        } else if (status === "In Progress" || status === "Assigned") {
            inProgress += 1;
        }

        if (row.resolved_at) {
            const resolvedAt = new Date(row.resolved_at);
            if (!Number.isNaN(resolvedAt.getTime()) && resolvedAt >= monthStart) {
                resolvedThisMonth += 1;
            }
        }

        return {
            id: row.id,
            title: row.title,
            description: row.description,
            property: property?.name ?? "Property",
            unit: unit?.name ?? "Unit",
            tenant: tenant?.full_name ?? "Unknown tenant",
            tenantAvatar: isNonEmptyString(tenant?.avatar_url) ? tenant.avatar_url : FALLBACK_AVATAR,
            priority,
            status,
            reportedAt: formatRelativeDate(row.created_at),
            images: Array.isArray(row.images) ? row.images.filter(isNonEmptyString) : [],
        };
    });

    return NextResponse.json({
        requests,
        metrics: {
            actionRequired,
            inProgress,
            scheduled: 0,
            resolvedThisMonth,
        },
    });
}
