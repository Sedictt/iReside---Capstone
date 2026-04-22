import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MaintenancePriority, MaintenanceStatus } from "@/types/database";

type MaintenanceStatusLabel = "Pending" | "Assigned" | "In Progress" | "Resolved";
type MaintenancePriorityLabel = "Critical" | "High" | "Medium" | "Low";

type MaintenanceRequestItem = {
    id: string;
    title: string;
    description: string;
    selfRepairRequested: boolean;
    selfRepairDecision?: "approved" | "rejected" | "pending";
    photoRequested?: boolean;
    tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
    tenantProvidedPhotos?: string[];
    repairMethod?: "landlord" | "third_party" | "self_repair";
    thirdPartyName?: string | null;
    property: string;
    unit: string;
    landlord: string;
    priority: MaintenancePriorityLabel;
    status: MaintenanceStatusLabel;
    reportedAt: string;
    assignee?: string | null;
    scheduledFor?: string | null;
    images: string[];
};
const LEGACY_SELF_REPAIR_PREFIX = "[TENANT REQUESTED SELF-REPAIR PERMISSION]";
const SELF_REPAIR_CATEGORY_TOKEN = "self_repair_requested";

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const parseSelfRepairDetails = (description: string, category: string | null | undefined) => {
    let cleanedDescription = description;
    let selfRepairRequested = false;

    if (isNonEmptyString(category)) {
        const tokens = category
            .split("|")
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);

        if (tokens.includes(SELF_REPAIR_CATEGORY_TOKEN)) {
            selfRepairRequested = true;
        }
    }

    if (cleanedDescription.startsWith(LEGACY_SELF_REPAIR_PREFIX)) {
        selfRepairRequested = true;
        cleanedDescription = cleanedDescription.slice(LEGACY_SELF_REPAIR_PREFIX.length).trimStart();
    }

    return {
        cleanedDescription,
        selfRepairRequested,
    };
};

const encodeCategory = (category: string | undefined, selfRepairRequested: boolean) => {
    const baseCategory = (category ?? "general").trim() || "general";
    if (!selfRepairRequested) {
        return baseCategory;
    }

    const tokens = new Set(
        baseCategory
            .split("|")
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean)
    );
    tokens.add(SELF_REPAIR_CATEGORY_TOKEN);

    return Array.from(tokens).join("|");
};

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
            "id, unit_id, landlord_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, resolved_at, created_at"
        )
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

    if (requestsError) {
        return NextResponse.json({ error: "Failed to load maintenance requests." }, { status: 500 });
    }

    if (!requestRows || requestRows.length === 0) {
        return NextResponse.json({ requests: [] });
    }

    const landlordIds = Array.from(
        new Set(requestRows.map((row) => row.landlord_id).filter((value): value is string => Boolean(value)))
    );
    const unitIds = Array.from(
        new Set(requestRows.map((row) => row.unit_id).filter((value): value is string => Boolean(value)))
    );

    const { data: landlordRows, error: landlordsError } =
        landlordIds.length > 0
            ? await supabase.from("profiles").select("id, full_name").in("id", landlordIds)
            : { data: [], error: null };
    if (landlordsError) {
        return NextResponse.json({ error: "Failed to load landlord profiles." }, { status: 500 });
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

    const landlordMap = new Map((landlordRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    const requests: MaintenanceRequestItem[] = requestRows.map((row) => {
        const landlord = landlordMap.get(row.landlord_id);
        const unit = unitMap.get(row.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const { cleanedDescription, selfRepairRequested } = parseSelfRepairDetails(row.description, row.category);
        const dbSelfRepairDecision = row.self_repair_decision as "pending" | "approved" | "rejected" | null;
        const dbRepairMethod = row.repair_method as "landlord" | "third_party" | "self_repair" | null;
        const dbTenantRepairStatus = row.tenant_repair_status as
            | "not_started"
            | "personnel_arrived"
            | "repairing"
            | "done"
            | null;

        return {
            id: row.id,
            title: row.title,
            description: cleanedDescription,
            selfRepairRequested: row.self_repair_requested || selfRepairRequested,
            selfRepairDecision: dbSelfRepairDecision ?? undefined,
            photoRequested: Boolean(row.photo_requested),
            tenantRepairStatus: dbTenantRepairStatus ?? undefined,
            tenantProvidedPhotos: Array.isArray(row.tenant_provided_photos)
                ? row.tenant_provided_photos.filter(isNonEmptyString)
                : [],
            repairMethod: dbRepairMethod ?? undefined,
            thirdPartyName: isNonEmptyString(row.third_party_name) ? row.third_party_name : null,
            property: property?.name ?? "Property",
            unit: unit?.name ?? "Unit",
            landlord: landlord?.full_name ?? "Landlord",
            priority: resolvePriority(row.priority),
            status: resolveStatus(row.status),
            reportedAt: formatRelativeDate(row.created_at),
            images: Array.isArray(row.images) ? row.images : [],
        };
    });

    return NextResponse.json({ requests });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, priority, category, images, fixItMyself } = body;

    if (!title || !description) {
        return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    // Find the tenant's active lease to get unit_id and landlord_id
    const { data: lease, error: leaseError } = await supabase
        .from("leases")
        .select("unit_id, landlord_id")
        .eq("tenant_id", user.id)
        .eq("status", "active")
        .maybeSingle();

    if (leaseError || !lease) {
        return NextResponse.json(
            { error: "No active lease found. You must have an active lease to create maintenance requests." },
            { status: 400 }
        );
    }

    const { data: newRequest, error: createError } = await supabase
        .from("maintenance_requests")
        .insert({
            tenant_id: user.id,
            unit_id: lease.unit_id,
            landlord_id: lease.landlord_id,
            title,
            description,
            priority: (priority as MaintenancePriority) || "medium",
            category: encodeCategory(category, Boolean(fixItMyself)),
            images: images || [],
            self_repair_requested: Boolean(fixItMyself),
            self_repair_decision: fixItMyself ? "pending" : null,
            photo_requested: false,
            tenant_repair_status: null,
            tenant_provided_photos: [],
            repair_method: null,
            third_party_name: null,
            status: "open" as MaintenanceStatus,
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create maintenance request:", createError);
        return NextResponse.json({ error: "Failed to create maintenance request." }, { status: 500 });
    }

    return NextResponse.json({ request: newRequest });
}

type TenantMaintenancePatchBody = {
    requestId?: string;
    tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
    tenantProvidedPhotos?: string[];
};

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as TenantMaintenancePatchBody;
    if (!isNonEmptyString(body.requestId)) {
        return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.tenantRepairStatus) {
        updates.tenant_repair_status = body.tenantRepairStatus;
        updates.status = "in_progress";
    }

    if (Array.isArray(body.tenantProvidedPhotos)) {
        updates.tenant_provided_photos = body.tenantProvidedPhotos.filter(isNonEmptyString);
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No update payload was provided." }, { status: 400 });
    }

    const { error: updateError } = await supabase
        .from("maintenance_requests")
        .update(updates)
        .eq("id", body.requestId)
        .eq("tenant_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update maintenance request." }, { status: 500 });
    }

    const { data: refreshedRequest, error: refreshedError } = await supabase
        .from("maintenance_requests")
        .select(
            "id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at"
        )
        .eq("id", body.requestId)
        .eq("tenant_id", user.id)
        .maybeSingle();

    if (refreshedError || !refreshedRequest) {
        return NextResponse.json({ success: true });
    }

    const { cleanedDescription, selfRepairRequested } = parseSelfRepairDetails(
        refreshedRequest.description,
        refreshedRequest.category
    );

    return NextResponse.json({
        request: {
            id: refreshedRequest.id,
            title: refreshedRequest.title,
            description: cleanedDescription,
            selfRepairRequested: refreshedRequest.self_repair_requested || selfRepairRequested,
            selfRepairDecision: refreshedRequest.self_repair_decision,
            photoRequested: refreshedRequest.photo_requested,
            tenantRepairStatus: refreshedRequest.tenant_repair_status,
            tenantProvidedPhotos: Array.isArray(refreshedRequest.tenant_provided_photos)
                ? refreshedRequest.tenant_provided_photos.filter(isNonEmptyString)
                : [],
            repairMethod: refreshedRequest.repair_method,
            thirdPartyName: refreshedRequest.third_party_name,
            status: resolveStatus(refreshedRequest.status),
            priority: resolvePriority(refreshedRequest.priority),
            reportedAt: formatRelativeDate(refreshedRequest.created_at),
            images: Array.isArray(refreshedRequest.images)
                ? refreshedRequest.images.filter(isNonEmptyString)
                : [],
        },
    });
}
