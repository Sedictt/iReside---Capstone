import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import type { MaintenancePriority, MaintenanceStatus } from "@/types/database";
import {
    buildHeuristicMaintenanceTriage,
    computeMaintenanceTriageHash,
    parseMaintenanceTriageBatch,
    type MaintenanceSentiment,
    type MaintenanceTriageInput,
    type MaintenanceTriageResult,
} from "@/lib/maintenance-triage";

type MaintenanceStatusLabel = "Pending" | "Assigned" | "In Progress" | "Resolved";
type MaintenancePriorityLabel = "Critical" | "High" | "Medium" | "Low";
type MaintenanceSentimentLabel = "Distressed" | "Negative" | "Neutral" | "Positive";

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
    tenant: string;
    tenantAvatar: string | null;
    tenantAvatarBgColor: string | null;
    priority: MaintenancePriorityLabel;
    status: MaintenanceStatusLabel;
    reportedAt: string;
    assignee?: string | null;
    scheduledFor?: string | null;
    images: string[];
    sentiment?: MaintenanceSentimentLabel;
    triageReason?: string;
    triageConfidence?: number;
    triageSource?: "ai" | "heuristic" | "cache" | "database";
    triagedAt?: string | null;
};

type MaintenanceMetrics = {
    actionRequired: number;
    inProgress: number;
    scheduled: number;
    resolvedThisMonth: number;
};

const FALLBACK_AVATAR =
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80";
const LEGACY_SELF_REPAIR_PREFIX = "[TENANT REQUESTED SELF-REPAIR PERMISSION]";
const SELF_REPAIR_CATEGORY_TOKEN = "self_repair_requested";
const TRIAGE_VERSION = "maintenance-triage-v1";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const extractSelfRepairDetails = (description: string, category: string | null | undefined) => {
    let cleanedDescription = description;
    let selfRepairRequested = false;

    if (isNonEmptyString(category)) {
        const normalizedTokens = category
            .split("|")
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);

        if (normalizedTokens.includes(SELF_REPAIR_CATEGORY_TOKEN)) {
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

const resolveStatus = (status: MaintenanceStatus | null | undefined): MaintenanceStatusLabel => {
    switch (status) {
        case "assigned":
            return "Assigned";
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

const toMaintenancePriorityLabel = (priority: MaintenancePriority): MaintenancePriorityLabel => {
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

const resolveSentiment = (sentiment: MaintenanceSentiment | string | null | undefined): MaintenanceSentimentLabel => {
    switch ((sentiment ?? "").toString().trim().toLowerCase()) {
        case "distressed":
            return "Distressed";
        case "negative":
            return "Negative";
        case "positive":
            return "Positive";
        case "neutral":
        default:
            return "Neutral";
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const supabase = await createClient();
    const maintenanceRequests = supabase.from("maintenance_requests") as any;
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = maintenanceRequests
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, resolved_at, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence, ai_triage_hash, ai_triage_version, ai_triaged_at"
        )
        .eq("landlord_id", user.id);

    if (propertyId && propertyId !== "all") {
        // Filter by propertyId by getting unit IDs for that property
        const { data: propertyUnits } = await supabase
            .from("units")
            .select("id")
            .eq("property_id", propertyId);
        
        const unitIds = (propertyUnits ?? []).map(u => u.id);
        if (unitIds.length > 0) {
            query = query.in("unit_id", unitIds);
        } else {
            // No units for this property, return empty
            return NextResponse.json({
                requests: [],
                metrics: { actionRequired: 0, inProgress: 0, scheduled: 0, resolvedThisMonth: 0 }
            });
        }
    }

    const { data: requestRows, error: requestsError } = await query.order("created_at", { ascending: false });

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

    const triageMap = new Map<string, MaintenanceTriageResult & { triagedAt: string | null }>();
    const needsTriage: Array<{ id: string; hash: string; input: MaintenanceTriageInput }> = [];

    requestRows.forEach((rawRow: any) => {
        const row = rawRow as Record<string, unknown>;
        const title = isNonEmptyString(row.title) ? row.title : "";
        const description = isNonEmptyString(row.description) ? row.description : "";
        const category = isNonEmptyString(row.category) ? row.category : null;
        const images = Array.isArray(row.images) ? row.images.filter(isNonEmptyString) : [];
        const input: MaintenanceTriageInput = {
            id: String(row.id),
            title,
            description,
            category,
            selfRepairRequested: Boolean(row.self_repair_requested),
            imageCount: images.length,
        };

        const hash = computeMaintenanceTriageHash(input);
        const dbPriority = typeof row.ai_triage_priority === "string" ? row.ai_triage_priority : "";
        const dbSentiment = typeof row.ai_triage_sentiment === "string" ? row.ai_triage_sentiment : "";
        const dbReason = typeof row.ai_triage_reason === "string" ? row.ai_triage_reason.trim() : "";
        const dbConfidence =
            typeof row.ai_triage_confidence === "number"
                ? row.ai_triage_confidence
                : Number(row.ai_triage_confidence ?? 0.65);
        const dbHash = typeof row.ai_triage_hash === "string" ? row.ai_triage_hash : "";
        const dbVersion = typeof row.ai_triage_version === "string" ? row.ai_triage_version : "";
        const dbTriagedAt = typeof row.ai_triaged_at === "string" ? row.ai_triaged_at : null;

        const normalizedPriority =
            dbPriority === "urgent" || dbPriority === "high" || dbPriority === "medium" || dbPriority === "low"
                ? dbPriority
                : null;
        const normalizedSentiment =
            dbSentiment === "distressed" ||
            dbSentiment === "negative" ||
            dbSentiment === "neutral" ||
            dbSentiment === "positive"
                ? dbSentiment
                : null;

        if (normalizedPriority && normalizedSentiment && dbReason && dbHash === hash && dbVersion === TRIAGE_VERSION) {
            triageMap.set(input.id, {
                priority: normalizedPriority,
                sentiment: normalizedSentiment,
                reason: dbReason,
                confidence: Number.isFinite(dbConfidence) ? Math.max(0, Math.min(1, dbConfidence)) : 0.65,
                source: "cache",
                triagedAt: dbTriagedAt,
            });
            return;
        }

        needsTriage.push({ id: input.id, hash, input });
    });

    if (needsTriage.length > 0) {
        const nowIso = new Date().toISOString();
        let aiParsedResults = new Map<string, MaintenanceTriageResult>();

        if (process.env.GROQ_API_KEY) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "llama-3.1-8b-instant",
                    temperature: 0.2,
                    max_tokens: 1800,
                    messages: [
                        {
                            role: "system",
                            content: [
                                "You triage maintenance requests for landlords.",
                                "Return strict JSON only: an array of objects.",
                                "Each object must include: id, priority, sentiment, reason, confidence.",
                                "Allowed priority values: urgent, high, medium, low.",
                                "Allowed sentiment values: distressed, negative, neutral, positive.",
                                "Confidence must be a number between 0 and 1.",
                                "Reason must be one short sentence focused on urgency and tenant tone.",
                            ].join("\n"),
                        },
                        {
                            role: "user",
                            content: JSON.stringify(
                                needsTriage.map(({ input }) => ({
                                    id: input.id,
                                    title: input.title,
                                    description: input.description,
                                    category: input.category,
                                    selfRepairRequested: input.selfRepairRequested,
                                    imageCount: input.imageCount,
                                }))
                            ),
                        },
                    ],
                });

                const aiContent = completion.choices[0]?.message?.content ?? "";
                aiParsedResults = parseMaintenanceTriageBatch(aiContent);
            } catch (error) {
                console.error("[landlord maintenance] AI triage failed:", error);
            }
        }

        const updates = needsTriage.map(({ id, hash, input }) => {
            const triage = aiParsedResults.get(id) ?? buildHeuristicMaintenanceTriage(input);
            triageMap.set(id, { ...triage, triagedAt: nowIso });
            return {
                id,
                ai_triage_priority: triage.priority,
                ai_triage_sentiment: triage.sentiment,
                ai_triage_reason: triage.reason,
                ai_triage_confidence: triage.confidence,
                ai_triage_hash: hash,
                ai_triage_version: TRIAGE_VERSION,
                ai_triaged_at: nowIso,
            };
        });

        await Promise.allSettled(
            updates.map((update) =>
                maintenanceRequests
                    .update({
                        ai_triage_priority: update.ai_triage_priority,
                        ai_triage_sentiment: update.ai_triage_sentiment,
                        ai_triage_reason: update.ai_triage_reason,
                        ai_triage_confidence: update.ai_triage_confidence,
                        ai_triage_hash: update.ai_triage_hash,
                        ai_triage_version: update.ai_triage_version,
                        ai_triaged_at: update.ai_triaged_at,
                    })
                    .eq("id", update.id)
                    .eq("landlord_id", user.id)
            )
        );
    }

    const tenantIds: string[] = Array.from(
        new Set(
            requestRows
                .map((row: any) => row.tenant_id)
                .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        )
    );
    const unitIds: string[] = Array.from(
        new Set(
            requestRows
                .map((row: any) => row.unit_id)
                .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        )
    );

    const { data: tenantRows, error: tenantsError } =
        tenantIds.length > 0
            ? await supabase.from("profiles").select("id, full_name, avatar_url, avatar_bg_color").in("id", tenantIds)
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

    const requests: MaintenanceRequestItem[] = requestRows.map((row: any) => {
        const tenant = tenantMap.get(row.tenant_id);
        const unit = unitMap.get(row.unit_id);
        const property = unit ? propertyMap.get(unit.property_id) : null;
        const status = resolveStatus(row.status);
        const triage = triageMap.get(row.id);
        const priority = triage ? toMaintenancePriorityLabel(triage.priority) : resolvePriority(row.priority);
        const { cleanedDescription, selfRepairRequested } = extractSelfRepairDetails(row.description, row.category);
        const dbSelfRepairDecision = row.self_repair_decision as "pending" | "approved" | "rejected" | null;
        const dbRepairMethod = row.repair_method as "landlord" | "third_party" | "self_repair" | null;
        const dbTenantRepairStatus = row.tenant_repair_status as
            | "not_started"
            | "personnel_arrived"
            | "repairing"
            | "done"
            | null;

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
            tenant: tenant?.full_name ?? "Unknown tenant",
            tenantAvatar: isNonEmptyString(tenant?.avatar_url) ? tenant.avatar_url : null,
            tenantAvatarBgColor: isNonEmptyString(tenant?.avatar_bg_color) ? tenant.avatar_bg_color : null,
            priority,
            status,
            reportedAt: formatRelativeDate(row.created_at),
            images: Array.isArray(row.images) ? row.images.filter(isNonEmptyString) : [],
            sentiment: triage ? resolveSentiment(triage.sentiment) : undefined,
            triageReason: triage?.reason,
            triageConfidence: triage?.confidence,
            triageSource: triage?.source ?? (row.ai_triage_priority ? "database" : undefined),
            triagedAt: triage?.triagedAt ?? (typeof row.ai_triaged_at === "string" ? row.ai_triaged_at : null),
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

type LandlordMaintenancePatchBody = {
    requestId?: string;
    status?: MaintenanceStatus;
    selfRepairDecision?: "pending" | "approved" | "rejected" | null;
    repairMethod?: "landlord" | "third_party" | "self_repair" | null;
    thirdPartyName?: string | null;
    photoRequested?: boolean;
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

    const body = (await request.json()) as LandlordMaintenancePatchBody;
    if (!isNonEmptyString(body.requestId)) {
        return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const updates: any = {};
    if (body.status) {
        updates.status = body.status;
        updates.resolved_at = body.status === "resolved" || body.status === "closed" ? new Date().toISOString() : null;
    }

    if (body.selfRepairDecision !== undefined) {
        updates.self_repair_decision = body.selfRepairDecision;
    }

    if (body.repairMethod !== undefined) {
        updates.repair_method = body.repairMethod;
    }

    if (body.thirdPartyName !== undefined) {
        updates.third_party_name = isNonEmptyString(body.thirdPartyName) ? body.thirdPartyName.trim() : null;
    }

    if (body.photoRequested !== undefined) {
        updates.photo_requested = body.photoRequested;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No update payload was provided." }, { status: 400 });
    }

    const { error: updateError } = await supabase
        .from("maintenance_requests")
        .update(updates)
        .eq("id", body.requestId)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update maintenance request." }, { status: 500 });
    }

    const { data: refreshedRequest, error: refreshedError } = await (supabase
        .from("maintenance_requests") as any)
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence"
        )
        .eq("id", body.requestId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (refreshedError || !refreshedRequest) {
        return NextResponse.json({ success: true });
    }

    // Fetch associated data for the single request
    const { data: tenant } = refreshedRequest.tenant_id 
        ? await supabase.from("profiles").select("full_name, avatar_url, avatar_bg_color").eq("id", refreshedRequest.tenant_id).maybeSingle()
        : { data: null };
    
    const { data: unit } = refreshedRequest.unit_id
        ? await supabase.from("units").select("name, property_id").eq("id", refreshedRequest.unit_id).maybeSingle()
        : { data: null };
    
    const { data: property } = unit?.property_id
        ? await supabase.from("properties").select("name").eq("id", unit.property_id).maybeSingle()
        : { data: null };

    const { cleanedDescription, selfRepairRequested } = extractSelfRepairDetails(
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
            property: property?.name ?? "Property",
            unit: unit?.name ?? "Unit",
            tenant: tenant?.full_name ?? "Unknown tenant",
            tenantAvatar: isNonEmptyString(tenant?.avatar_url) ? tenant.avatar_url : null,
            tenantAvatarBgColor: isNonEmptyString(tenant?.avatar_bg_color) ? tenant.avatar_bg_color : null,
            status: resolveStatus(refreshedRequest.status),
            priority: resolvePriority(refreshedRequest.priority),
            reportedAt: formatRelativeDate(refreshedRequest.created_at),
            images: Array.isArray(refreshedRequest.images) ? refreshedRequest.images.filter(isNonEmptyString) : [],
            sentiment: resolveSentiment(refreshedRequest.ai_triage_sentiment),
            triageReason: refreshedRequest.ai_triage_reason,
            triageConfidence: refreshedRequest.ai_triage_confidence,
            triageSource: "database"
        },
    });
}

