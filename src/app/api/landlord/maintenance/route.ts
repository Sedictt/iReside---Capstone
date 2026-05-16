import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
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
        case "open":
            return "Pending";
        case "assigned":
            return "Assigned";
        case "in_progress":
            return "In Progress";
        case "resolved":
            return "Resolved";
        case "closed":
            return "Resolved";
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
    const { user } = await requireUser();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const supabase = await createClient();

    const maintenanceRequestsTable = supabase.from("maintenance_requests") as any;
    let maintenanceQuery = maintenanceRequestsTable
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, resolved_at, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence, ai_triage_hash, ai_triage_version, ai_triaged_at"
        )
        .eq("landlord_id", user.id);

    if (propertyId && propertyId !== "all") {
        const { data: propertyUnits } = await supabase
            .from("units")
            .select("id")
            .eq("property_id", propertyId);
        
        const unitIds = (propertyUnits ?? []).map(unitRecord => unitRecord.id);
        if (unitIds.length > 0) {
            maintenanceQuery = maintenanceQuery.in("unit_id", unitIds);
        } else {
            return NextResponse.json({
                requests: [],
                metrics: { actionRequired: 0, inProgress: 0, scheduled: 0, resolvedThisMonth: 0 }
            });
        }
    }

    const { data: maintenanceRows, error: requestsError } = await maintenanceQuery.order("created_at", { ascending: false });

    if (requestsError) {
        return NextResponse.json({ error: "Failed to load maintenance requests." }, { status: 500 });
    }

    if (!maintenanceRows || maintenanceRows.length === 0) {
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

    maintenanceRows.forEach((maintenanceRow: any) => {
        const rowData = maintenanceRow as Record<string, unknown>;
        const title = isNonEmptyString(rowData.title) ? rowData.title : "";
        const description = isNonEmptyString(rowData.description) ? rowData.description : "";
        const category = isNonEmptyString(rowData.category) ? rowData.category : null;
        const images = Array.isArray(rowData.images) ? rowData.images.filter(isNonEmptyString) : [];
        const triageInput: MaintenanceTriageInput = {
            id: String(rowData.id),
            title,
            description,
            category,
            selfRepairRequested: Boolean(rowData.self_repair_requested),
            imageCount: images.length,
        };

        const triageHash = computeMaintenanceTriageHash(triageInput);
        const dbPriority = typeof rowData.ai_triage_priority === "string" ? rowData.ai_triage_priority : "";
        const dbSentiment = typeof rowData.ai_triage_sentiment === "string" ? rowData.ai_triage_sentiment : "";
        const dbReason = typeof rowData.ai_triage_reason === "string" ? rowData.ai_triage_reason.trim() : "";
        const dbConfidence =
            typeof rowData.ai_triage_confidence === "number"
                ? rowData.ai_triage_confidence
                : Number(rowData.ai_triage_confidence ?? 0.65);
        const dbHash = typeof rowData.ai_triage_hash === "string" ? rowData.ai_triage_hash : "";
        const dbVersion = typeof rowData.ai_triage_version === "string" ? rowData.ai_triage_version : "";
        const dbTriagedAt = typeof rowData.ai_triaged_at === "string" ? rowData.ai_triaged_at : null;

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

        if (normalizedPriority && normalizedSentiment && dbReason && dbHash === triageHash && dbVersion === TRIAGE_VERSION) {
            triageMap.set(triageInput.id, {
                priority: normalizedPriority,
                sentiment: normalizedSentiment,
                reason: dbReason,
                confidence: Number.isFinite(dbConfidence) ? Math.max(0, Math.min(1, dbConfidence)) : 0.65,
                source: "cache",
                triagedAt: dbTriagedAt,
            });
            return;
        }

        needsTriage.push({ id: triageInput.id, hash: triageHash, input: triageInput });
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

        const triageUpdates = needsTriage.map(({ id, hash, input }) => {
            const triageResult = aiParsedResults.get(id) ?? buildHeuristicMaintenanceTriage(input);
            triageMap.set(id, { ...triageResult, triagedAt: nowIso });
            return {
                id,
                ai_triage_priority: triageResult.priority,
                ai_triage_sentiment: triageResult.sentiment,
                ai_triage_reason: triageResult.reason,
                ai_triage_confidence: triageResult.confidence,
                ai_triage_hash: hash,
                ai_triage_version: TRIAGE_VERSION,
                ai_triaged_at: nowIso,
            };
        });

        await Promise.allSettled(
            triageUpdates.map((maintenanceUpdate) =>
                maintenanceRequestsTable
                    .update({
                        ai_triage_priority: maintenanceUpdate.ai_triage_priority,
                        ai_triage_sentiment: maintenanceUpdate.ai_triage_sentiment,
                        ai_triage_reason: maintenanceUpdate.ai_triage_reason,
                        ai_triage_confidence: maintenanceUpdate.ai_triage_confidence,
                        ai_triage_hash: maintenanceUpdate.ai_triage_hash,
                        ai_triage_version: maintenanceUpdate.ai_triage_version,
                        ai_triaged_at: maintenanceUpdate.ai_triaged_at,
                    })
                    .eq("id", maintenanceUpdate.id)
                    .eq("landlord_id", user.id)
            )
        );
    }

    const tenantIds: string[] = Array.from(
        new Set(
            maintenanceRows
                .map((maintenanceRow: any) => maintenanceRow.tenant_id)
                .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        )
    );
    const unitIds: string[] = Array.from(
        new Set(
            maintenanceRows
                .map((maintenanceRow: any) => maintenanceRow.unit_id)
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
        new Set((unitRows ?? []).map((unitRecord) => unitRecord.property_id).filter((value): value is string => Boolean(value)))
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

    const maintenanceRequests: MaintenanceRequestItem[] = maintenanceRows.map((maintenanceRow: any) => {
        const tenantRecord = tenantMap.get(maintenanceRow.tenant_id);
        const unitRecord = unitMap.get(maintenanceRow.unit_id);
        const propertyRecord = unitRecord ? propertyMap.get(unitRecord.property_id) : null;
        const statusLabel = resolveStatus(maintenanceRow.status);
        const triageData = triageMap.get(maintenanceRow.id);
        const priorityLabel = triageData ? toMaintenancePriorityLabel(triageData.priority) : resolvePriority(maintenanceRow.priority);
        const { cleanedDescription, selfRepairRequested } = extractSelfRepairDetails(maintenanceRow.description, maintenanceRow.category);
        const dbSelfRepairDecision = maintenanceRow.self_repair_decision as "pending" | "approved" | "rejected" | null;
        const dbRepairMethod = maintenanceRow.repair_method as "landlord" | "third_party" | "self_repair" | null;
        const dbTenantRepairStatus = maintenanceRow.tenant_repair_status as
            | "not_started"
            | "personnel_arrived"
            | "repairing"
            | "done"
            | null;

        if (statusLabel === "Pending") {
            actionRequired += 1;
        } else if (statusLabel === "In Progress" || statusLabel === "Assigned") {
            inProgress += 1;
        }

        if (maintenanceRow.resolved_at) {
            const resolvedAt = new Date(maintenanceRow.resolved_at);
            if (!Number.isNaN(resolvedAt.getTime()) && resolvedAt >= monthStart) {
                resolvedThisMonth += 1;
            }
        }

        return {
            id: maintenanceRow.id,
            title: maintenanceRow.title,
            description: cleanedDescription,
            selfRepairRequested: maintenanceRow.self_repair_requested || selfRepairRequested,
            selfRepairDecision: dbSelfRepairDecision ?? undefined,
            photoRequested: Boolean(maintenanceRow.photo_requested),
            tenantRepairStatus: dbTenantRepairStatus ?? undefined,
            tenantProvidedPhotos: Array.isArray(maintenanceRow.tenant_provided_photos)
                ? maintenanceRow.tenant_provided_photos.filter(isNonEmptyString)
                : [],
            repairMethod: dbRepairMethod ?? undefined,
            thirdPartyName: isNonEmptyString(maintenanceRow.third_party_name) ? maintenanceRow.third_party_name : null,
            property: propertyRecord?.name ?? "Property",
            unit: unitRecord?.name ?? "Unit",
            tenant: tenantRecord?.full_name ?? "Unknown tenant",
            tenantAvatar: isNonEmptyString(tenantRecord?.avatar_url) ? tenantRecord.avatar_url : null,
            tenantAvatarBgColor: isNonEmptyString(tenantRecord?.avatar_bg_color) ? tenantRecord.avatar_bg_color : null,
            priority: priorityLabel,
            status: statusLabel,
            reportedAt: formatRelativeDate(maintenanceRow.created_at),
            images: Array.isArray(maintenanceRow.images) ? maintenanceRow.images.filter(isNonEmptyString) : [],
            sentiment: triageData ? resolveSentiment(triageData.sentiment) : undefined,
            triageReason: triageData?.reason,
            triageConfidence: triageData?.confidence,
            triageSource: triageData?.source ?? (maintenanceRow.ai_triage_priority ? "database" : undefined),
            triagedAt: triageData?.triagedAt ?? (typeof maintenanceRow.ai_triaged_at === "string" ? maintenanceRow.ai_triaged_at : null),
        };
    });

    return NextResponse.json({
        requests: maintenanceRequests,
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
    const { user } = await requireUser();
    const supabase = await createClient();

    const patchData = (await request.json()) as LandlordMaintenancePatchBody;
    if (!isNonEmptyString(patchData.requestId)) {
        return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const maintenanceUpdates: any = {};
    if (patchData.status) {
        maintenanceUpdates.status = patchData.status;
        maintenanceUpdates.resolved_at = patchData.status === "resolved" ? new Date().toISOString() : null;
    }

    if (patchData.selfRepairDecision !== undefined) {
        maintenanceUpdates.self_repair_decision = patchData.selfRepairDecision;
    }

    if (patchData.repairMethod !== undefined) {
        maintenanceUpdates.repair_method = patchData.repairMethod;
    }

    if (patchData.thirdPartyName !== undefined) {
        maintenanceUpdates.third_party_name = isNonEmptyString(patchData.thirdPartyName) ? patchData.thirdPartyName.trim() : null;
    }

    if (patchData.photoRequested !== undefined) {
        maintenanceUpdates.photo_requested = patchData.photoRequested;
    }

    if (Object.keys(maintenanceUpdates).length === 0) {
        return NextResponse.json({ error: "No update payload was provided." }, { status: 400 });
    }

    const { error: updateError } = await supabase
        .from("maintenance_requests")
        .update(maintenanceUpdates)
        .eq("id", patchData.requestId)
        .eq("landlord_id", user.id);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update maintenance request." }, { status: 500 });
    }

    const { data: refreshedRequest, error: refreshedError } = await (supabase
        .from("maintenance_requests") as any)
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence"
        )
        .eq("id", patchData.requestId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (refreshedError || !refreshedRequest) {
        return NextResponse.json({ success: true });
    }

    const { data: tenantRecord } = refreshedRequest.tenant_id 
        ? await supabase.from("profiles").select("full_name, avatar_url, avatar_bg_color").eq("id", refreshedRequest.tenant_id).maybeSingle()
        : { data: null };
    
    const { data: unitRecord } = refreshedRequest.unit_id
        ? await supabase.from("units").select("name, property_id").eq("id", refreshedRequest.unit_id).maybeSingle()
        : { data: null };
    
    const { data: propertyRecord } = unitRecord?.property_id
        ? await supabase.from("properties").select("name").eq("id", unitRecord.property_id).maybeSingle()
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
            property: propertyRecord?.name ?? "Property",
            unit: unitRecord?.name ?? "Unit",
            tenant: tenantRecord?.full_name ?? "Unknown tenant",
            tenantAvatar: isNonEmptyString(tenantRecord?.avatar_url) ? tenantRecord.avatar_url : null,
            tenantAvatarBgColor: isNonEmptyString(tenantRecord?.avatar_bg_color) ? tenantRecord.avatar_bg_color : null,
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

const toDbPriority = (priority: MaintenancePriorityLabel): MaintenancePriority => {
    switch (priority) {
        case "Critical":
            return "urgent";
        case "High":
            return "high";
        case "Medium":
            return "medium";
        case "Low":
        default:
            return "low";
    }
};

type LandlordMaintenancePostBody = {
    propertyId: string;
    unitId: string;
    title: string;
    description: string;
    priority: MaintenancePriorityLabel;
};

export async function POST(request: Request) {
    const { user } = await requireUser();
    const supabase = await createClient();

    const postData = (await request.json()) as LandlordMaintenancePostBody;

    if (!isNonEmptyString(postData.unitId)) {
        return NextResponse.json({ error: "Unit ID is required." }, { status: 400 });
    }
    if (!isNonEmptyString(postData.title)) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (!isNonEmptyString(postData.description)) {
        return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    if (!postData.priority) {
        return NextResponse.json({ error: "Priority is required." }, { status: 400 });
    }

    // Fetch the active tenant for the unit
    const { data: activeLease } = await supabase
        .from("leases")
        .select("tenant_id")
        .eq("unit_id", postData.unitId)
        .eq("status", "active")
        .maybeSingle();

    if (!activeLease) {
        return NextResponse.json({ error: "No active tenant found for this unit. Maintenance requests must be linked to a tenant." }, { status: 400 });
    }

    const { data: newRequest, error: createError } = await supabase
        .from("maintenance_requests")
        .insert({
            landlord_id: user.id,
            unit_id: postData.unitId,
            tenant_id: activeLease.tenant_id,
            title: postData.title.trim(),
            description: postData.description.trim(),
            priority: toDbPriority(postData.priority),
            status: "open",
            category: null,
            images: [],
            self_repair_requested: false,
            self_repair_decision: null,
            photo_requested: false,
            tenant_repair_status: null,
            tenant_provided_photos: [],
            repair_method: null,
            third_party_name: null,
        })
        .select(
            "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence, ai_triage_hash, ai_triage_version, ai_triaged_at"
        )
        .single();

    if (createError) {
        return NextResponse.json({ error: "Failed to create maintenance request." }, { status: 500 });
    }

    const { data: unitRecord } = newRequest.unit_id
        ? await supabase.from("units").select("name, property_id").eq("id", newRequest.unit_id).maybeSingle()
        : { data: null };

    const { data: propertyRecord } = unitRecord?.property_id
        ? await supabase.from("properties").select("name").eq("id", unitRecord.property_id).maybeSingle()
        : { data: null };

    const { cleanedDescription } = extractSelfRepairDetails(newRequest.description, newRequest.category);

    return NextResponse.json(
        {
            request: {
                id: newRequest.id,
                title: newRequest.title,
                description: cleanedDescription,
                selfRepairRequested: newRequest.self_repair_requested || false,
                selfRepairDecision: newRequest.self_repair_decision,
                photoRequested: newRequest.photo_requested,
                tenantRepairStatus: newRequest.tenant_repair_status,
                tenantProvidedPhotos: Array.isArray(newRequest.tenant_provided_photos)
                    ? newRequest.tenant_provided_photos.filter(isNonEmptyString)
                    : [],
                repairMethod: newRequest.repair_method,
                thirdPartyName: newRequest.third_party_name,
                property: propertyRecord?.name ?? "Property",
                unit: unitRecord?.name ?? "Unit",
                tenant: "",
                tenantAvatar: null,
                tenantAvatarBgColor: null,
                priority: resolvePriority(newRequest.priority),
                status: resolveStatus(newRequest.status),
                reportedAt: formatRelativeDate(newRequest.created_at),
                images: Array.isArray(newRequest.images) ? newRequest.images.filter(isNonEmptyString) : [],
                sentiment: resolveSentiment(newRequest.ai_triage_sentiment),
                triageReason: newRequest.ai_triage_reason,
                triageConfidence: newRequest.ai_triage_confidence,
                triageSource: "database",
            },
        },
        { status: 201 }
    );
}

