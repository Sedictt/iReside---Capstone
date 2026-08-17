/**
 * MaintenanceService — canonical business logic and data access for maintenance requests.
 *
 * Scoped to an injected SupabaseClient instance.
 * Never imports createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MaintenancePriority, MaintenanceStatus } from "@/types/database";
import {
  buildHeuristicMaintenanceTriage,
  computeMaintenanceTriageHash,
  type MaintenanceSentiment,
  type MaintenanceTriageInput,
  type MaintenanceTriageResult,
} from "@/lib/maintenance-triage";
import type {
  CreateLandlordMaintenanceInput,
  CreateTenantMaintenanceInput,
  MaintenanceMetrics,
  MaintenancePriorityLabel,
  MaintenanceRequestItem,
  MaintenanceSentimentLabel,
  MaintenanceStatusLabel,
  UpdateLandlordMaintenanceInput,
  UpdateTenantMaintenanceInput,
} from "./maintenance.types";
import {
  MaintenanceNotFoundError,
  MaintenanceValidationError,
} from "./maintenance.errors";

const LEGACY_SELF_REPAIR_PREFIX = "[TENANT REQUESTED SELF-REPAIR PERMISSION]";
const SELF_REPAIR_CATEGORY_TOKEN = "self_repair_requested";
const TRIAGE_VERSION = "maintenance-triage-v1";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const extractSelfRepairDetails = (
  description: string,
  category: string | null | undefined,
) => {
  let cleanedDescription = description;
  let isSelfRepairRequested = false;

  if (isNonEmptyString(category)) {
    const normalizedTokens = category
      .split("|")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);

    if (normalizedTokens.includes(SELF_REPAIR_CATEGORY_TOKEN)) {
      isSelfRepairRequested = true;
    }
  }

  if (cleanedDescription.startsWith(LEGACY_SELF_REPAIR_PREFIX)) {
    isSelfRepairRequested = true;
    cleanedDescription = cleanedDescription.slice(LEGACY_SELF_REPAIR_PREFIX.length).trimStart();
  }

  return {
    cleanedDescription,
    isSelfRepairRequested,
  };
};

const encodeCategory = (category: string | undefined, isSelfRepairRequested: boolean) => {
  const baseCategory = (category ?? "general").trim() || "general";
  if (!isSelfRepairRequested) {
    return baseCategory;
  }

  const tokens = new Set(
    baseCategory
      .split("|")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean),
  );
  tokens.add(SELF_REPAIR_CATEGORY_TOKEN);

  return Array.from(tokens).join("|");
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

const resolveSentiment = (
  sentiment: MaintenanceSentiment | string | null | undefined,
): MaintenanceSentimentLabel => {
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

const formatRelativeDate = (value: string): string => {
  const date = new Date(value);
  const now = new Date();
  const timeDifferenceMs = now.getTime() - date.getTime();

  if (Number.isNaN(timeDifferenceMs) || timeDifferenceMs < 0) return "Recently";

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (timeDifferenceMs < hourMs) {
    const minutes = Math.max(1, Math.floor(timeDifferenceMs / minuteMs));
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  if (timeDifferenceMs < dayMs) {
    const hours = Math.max(1, Math.floor(timeDifferenceMs / hourMs));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(timeDifferenceMs / dayMs);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export class MaintenanceService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Get all maintenance requests for a landlord with triage and metrics.
   *
   * @param landlordId - Authenticated landlord user ID.
   * @param propertyId - Optional property ID filter.
   */
  async getLandlordMaintenanceRequests(
    landlordId: string,
    propertyId?: string,
  ): Promise<{ requests: MaintenanceRequestItem[]; metrics: MaintenanceMetrics }> {
    const maintenanceTable = this.supabase.from("maintenance_requests") as any;
    let query = maintenanceTable
      .select(
        "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, resolved_at, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence, ai_triage_hash, ai_triage_version, ai_triaged_at",
      )
      .eq("landlord_id", landlordId);

    if (propertyId && propertyId !== "all") {
      const { data: propertyUnits } = await this.supabase
        .from("units")
        .select("id")
        .eq("property_id", propertyId);

      const unitIds = (propertyUnits ?? []).map((unitRecord) => unitRecord.id);
      if (unitIds.length > 0) {
        query = query.in("unit_id", unitIds);
      } else {
        return {
          requests: [],
          metrics: { actionRequired: 0, inProgress: 0, scheduled: 0, resolvedThisMonth: 0 },
        };
      }
    }

    const { data: maintenanceRows, error: requestsError } = await query.order("created_at", {
      ascending: false,
    });

    if (requestsError) {
      throw new Error(`Failed to load maintenance requests: ${requestsError.message}`);
    }

    if (!maintenanceRows || maintenanceRows.length === 0) {
      return {
        requests: [],
        metrics: { actionRequired: 0, inProgress: 0, scheduled: 0, resolvedThisMonth: 0 },
      };
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

      if (
        normalizedPriority &&
        normalizedSentiment &&
        dbReason &&
        dbHash === triageHash &&
        dbVersion === TRIAGE_VERSION
      ) {
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
      const triageUpdates = needsTriage.map(({ id, hash, input }) => {
        const triageResult = buildHeuristicMaintenanceTriage(input);
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
          maintenanceTable
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
            .eq("landlord_id", landlordId),
        ),
      );
    }

    const tenantIds: string[] = Array.from(
      new Set(
        maintenanceRows
          .map((maintenanceRow: any) => maintenanceRow.tenant_id)
          .filter((value: unknown): value is string => typeof value === "string" && value.length > 0),
      ),
    );
    const unitIds: string[] = Array.from(
      new Set(
        maintenanceRows
          .map((maintenanceRow: any) => maintenanceRow.unit_id)
          .filter((value: unknown): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const { data: tenantRows } =
      tenantIds.length > 0
        ? await this.supabase
            .from("profiles")
            .select("id, full_name, avatar_url, avatar_bg_color")
            .in("id", tenantIds)
        : { data: [] };

    const { data: unitRows } =
      unitIds.length > 0
        ? await this.supabase.from("units").select("id, name, property_id").in("id", unitIds)
        : { data: [] };

    const propertyIds = Array.from(
      new Set(
        (unitRows ?? [])
          .map((unitRecord) => unitRecord.property_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const { data: propertyRows } =
      propertyIds.length > 0
        ? await this.supabase.from("properties").select("id, name").in("id", propertyIds)
        : { data: [] };

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
      const priorityLabel = triageData
        ? resolvePriority(triageData.priority)
        : resolvePriority(maintenanceRow.priority);
      const { cleanedDescription, isSelfRepairRequested } = extractSelfRepairDetails(
        maintenanceRow.description,
        maintenanceRow.category,
      );

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
        selfRepairRequested: maintenanceRow.self_repair_requested || isSelfRepairRequested,
        selfRepairDecision: maintenanceRow.self_repair_decision ?? undefined,
        photoRequested: Boolean(maintenanceRow.photo_requested),
        tenantRepairStatus: maintenanceRow.tenant_repair_status ?? undefined,
        tenantProvidedPhotos: Array.isArray(maintenanceRow.tenant_provided_photos)
          ? maintenanceRow.tenant_provided_photos.filter(isNonEmptyString)
          : [],
        repairMethod: maintenanceRow.repair_method ?? undefined,
        thirdPartyName: isNonEmptyString(maintenanceRow.third_party_name)
          ? maintenanceRow.third_party_name
          : null,
        property: propertyRecord?.name ?? "Property",
        unit: unitRecord?.name ?? "Unit",
        tenant: tenantRecord?.full_name ?? "Unknown tenant",
        tenantAvatar: isNonEmptyString(tenantRecord?.avatar_url) ? tenantRecord.avatar_url : null,
        tenantAvatarBgColor: isNonEmptyString(tenantRecord?.avatar_bg_color)
          ? tenantRecord.avatar_bg_color
          : null,
        priority: priorityLabel,
        status: statusLabel,
        reportedAt: formatRelativeDate(maintenanceRow.created_at),
        images: Array.isArray(maintenanceRow.images)
          ? maintenanceRow.images.filter(isNonEmptyString)
          : [],
        sentiment: triageData ? resolveSentiment(triageData.sentiment) : undefined,
        triageReason: triageData?.reason,
        triageConfidence: triageData?.confidence,
        triageSource: triageData?.source ?? (maintenanceRow.ai_triage_priority ? "database" : undefined),
        triagedAt:
          triageData?.triagedAt ??
          (typeof maintenanceRow.ai_triaged_at === "string" ? maintenanceRow.ai_triaged_at : null),
      };
    });

    return {
      requests: maintenanceRequests,
      metrics: {
        actionRequired,
        inProgress,
        scheduled: 0,
        resolvedThisMonth,
      },
    };
  }

  /**
   * Get all maintenance requests for a tenant.
   *
   * @param tenantId - Authenticated tenant user ID.
   */
  async getTenantMaintenanceRequests(tenantId: string): Promise<MaintenanceRequestItem[]> {
    const { data: requestRows, error: requestsError } = await this.supabase
      .from("maintenance_requests")
      .select(
        "id, unit_id, landlord_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, resolved_at, created_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (requestsError) {
      throw new Error(`Failed to load maintenance requests: ${requestsError.message}`);
    }

    if (!requestRows || requestRows.length === 0) {
      return [];
    }

    const landlordIds = Array.from(
      new Set(
        requestRows
          .map((row) => row.landlord_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const unitIds = Array.from(
      new Set(
        requestRows
          .map((row) => row.unit_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const [{ data: landlordRows }, { data: unitRows }] = await Promise.all([
      landlordIds.length > 0
        ? this.supabase.from("profiles").select("id, full_name").in("id", landlordIds)
        : Promise.resolve({ data: [] }),
      unitIds.length > 0
        ? this.supabase.from("units").select("id, name, property_id").in("id", unitIds)
        : Promise.resolve({ data: [] }),
    ]);

    const propertyIds = Array.from(
      new Set(
        (unitRows ?? [])
          .map((row) => row.property_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const { data: propertyRows } =
      propertyIds.length > 0
        ? await this.supabase.from("properties").select("id, name").in("id", propertyIds)
        : { data: [] };

    const landlordMap = new Map((landlordRows ?? []).map((row) => [row.id, row]));
    const unitMap = new Map((unitRows ?? []).map((row) => [row.id, row]));
    const propertyMap = new Map((propertyRows ?? []).map((row) => [row.id, row]));

    return requestRows.map((row) => {
      const landlord = landlordMap.get(row.landlord_id);
      const unit = unitMap.get(row.unit_id);
      const property = unit ? propertyMap.get(unit.property_id) : null;
      const { cleanedDescription, isSelfRepairRequested } = extractSelfRepairDetails(
        row.description,
        row.category,
      );

      return {
        id: row.id,
        title: row.title,
        description: cleanedDescription,
        selfRepairRequested: row.self_repair_requested || isSelfRepairRequested,
        selfRepairDecision: (row.self_repair_decision as any) ?? undefined,
        photoRequested: Boolean(row.photo_requested),
        tenantRepairStatus: (row.tenant_repair_status as any) ?? undefined,
        tenantProvidedPhotos: Array.isArray(row.tenant_provided_photos)
          ? row.tenant_provided_photos.filter(isNonEmptyString)
          : [],
        repairMethod: (row.repair_method as any) ?? undefined,
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
  }

  /**
   * Create a maintenance request as a landlord.
   *
   * @param landlordId - Authenticated landlord user ID.
   * @param input - Landlord maintenance creation input.
   */
  async createLandlordMaintenance(
    landlordId: string,
    input: CreateLandlordMaintenanceInput,
  ): Promise<MaintenanceRequestItem> {
    if (!isNonEmptyString(input.unitId)) {
      throw new MaintenanceValidationError("Unit ID is required.");
    }
    if (!isNonEmptyString(input.title)) {
      throw new MaintenanceValidationError("Title is required.");
    }
    if (!isNonEmptyString(input.description)) {
      throw new MaintenanceValidationError("Description is required.");
    }

    const { data: activeLease } = await this.supabase
      .from("leases")
      .select("tenant_id")
      .eq("unit_id", input.unitId)
      .eq("status", "active")
      .maybeSingle();

    if (!activeLease) {
      throw new MaintenanceValidationError(
        "No active tenant found for this unit. Maintenance requests must be linked to a tenant.",
      );
    }

    const { data: newRequest, error: createError } = await this.supabase
      .from("maintenance_requests")
      .insert({
        landlord_id: landlordId,
        unit_id: input.unitId,
        tenant_id: activeLease.tenant_id,
        title: input.title.trim(),
        description: input.description.trim(),
        priority: toDbPriority(input.priority),
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
      .select()
      .single();

    if (createError || !newRequest) {
      throw new Error(`Failed to create maintenance request: ${createError?.message}`);
    }

    const { data: unitRecord } = await this.supabase
      .from("units")
      .select("name, property_id")
      .eq("id", newRequest.unit_id)
      .maybeSingle();

    const { data: propertyRecord } = unitRecord?.property_id
      ? await this.supabase
          .from("properties")
          .select("name")
          .eq("id", unitRecord.property_id)
          .maybeSingle()
      : { data: null };

    const { cleanedDescription } = extractSelfRepairDetails(
      newRequest.description,
      newRequest.category,
    );

    return {
      id: newRequest.id,
      title: newRequest.title,
      description: cleanedDescription,
      selfRepairRequested: false,
      selfRepairDecision: undefined,
      photoRequested: false,
      tenantRepairStatus: undefined,
      tenantProvidedPhotos: [],
      repairMethod: undefined,
      thirdPartyName: null,
      property: propertyRecord?.name ?? "Property",
      unit: unitRecord?.name ?? "Unit",
      tenant: "",
      tenantAvatar: null,
      tenantAvatarBgColor: null,
      priority: resolvePriority(newRequest.priority),
      status: resolveStatus(newRequest.status),
      reportedAt: formatRelativeDate(newRequest.created_at),
      images: [],
      sentiment: undefined,
      triageReason: undefined,
      triageConfidence: undefined,
      triageSource: undefined,
    };
  }

  /**
   * Create a maintenance request as a tenant.
   *
   * @param tenantId - Authenticated tenant user ID.
   * @param input - Tenant maintenance creation input.
   */
  async createTenantMaintenance(
    tenantId: string,
    input: CreateTenantMaintenanceInput,
  ): Promise<MaintenanceRequestItem> {
    if (!isNonEmptyString(input.title) || !isNonEmptyString(input.description)) {
      throw new MaintenanceValidationError("Title and description are required.");
    }

    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select("unit_id, landlord_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .maybeSingle();

    if (leaseError || !lease) {
      throw new MaintenanceValidationError(
        "No active lease found. You must have an active lease to create maintenance requests.",
      );
    }

    const { data: newRequest, error: createError } = await this.supabase
      .from("maintenance_requests")
      .insert({
        tenant_id: tenantId,
        unit_id: lease.unit_id,
        landlord_id: lease.landlord_id,
        title: input.title.trim(),
        description: input.description.trim(),
        priority: input.priority || "medium",
        category: encodeCategory(input.category, Boolean(input.fixItMyself)),
        images: input.images || [],
        self_repair_requested: Boolean(input.fixItMyself),
        self_repair_decision: input.fixItMyself ? "pending" : null,
        photo_requested: false,
        tenant_repair_status: null,
        tenant_provided_photos: [],
        repair_method: null,
        third_party_name: null,
        status: "open",
      })
      .select()
      .single();

    if (createError || !newRequest) {
      throw new Error(`Failed to create maintenance request: ${createError?.message}`);
    }

    const { cleanedDescription, isSelfRepairRequested } = extractSelfRepairDetails(
      newRequest.description,
      newRequest.category,
    );

    return {
      id: newRequest.id,
      title: newRequest.title,
      description: cleanedDescription,
      selfRepairRequested: newRequest.self_repair_requested || isSelfRepairRequested,
      selfRepairDecision: (newRequest.self_repair_decision as any) ?? undefined,
      photoRequested: false,
      tenantRepairStatus: undefined,
      tenantProvidedPhotos: [],
      repairMethod: undefined,
      thirdPartyName: null,
      property: "Property",
      unit: "Unit",
      priority: resolvePriority(newRequest.priority),
      status: resolveStatus(newRequest.status),
      reportedAt: formatRelativeDate(newRequest.created_at),
      images: Array.isArray(newRequest.images) ? newRequest.images : [],
    };
  }

  /**
   * Update a maintenance request as a landlord.
   *
   * @param landlordId - Authenticated landlord user ID.
   * @param input - Update payload.
   */
  async updateLandlordMaintenance(
    landlordId: string,
    input: UpdateLandlordMaintenanceInput,
  ): Promise<MaintenanceRequestItem> {
    if (!isNonEmptyString(input.requestId)) {
      throw new MaintenanceValidationError("Request ID is required.");
    }

    const updates: Record<string, unknown> = {};
    if (input.status) {
      updates.status = input.status;
      updates.resolved_at = input.status === "resolved" ? new Date().toISOString() : null;
    }
    if (input.selfRepairDecision !== undefined) {
      updates.self_repair_decision = input.selfRepairDecision;
    }
    if (input.repairMethod !== undefined) {
      updates.repair_method = input.repairMethod;
    }
    if (input.thirdPartyName !== undefined) {
      updates.third_party_name = isNonEmptyString(input.thirdPartyName)
        ? input.thirdPartyName.trim()
        : null;
    }
    if (input.photoRequested !== undefined) {
      updates.photo_requested = input.photoRequested;
    }

    if (Object.keys(updates).length === 0) {
      throw new MaintenanceValidationError("No update payload was provided.");
    }

    const { error: updateError } = await this.supabase
      .from("maintenance_requests")
      .update(updates as any)
      .eq("id", input.requestId)
      .eq("landlord_id", landlordId);

    if (updateError) {
      throw new Error(`Failed to update maintenance request: ${updateError.message}`);
    }

    const { data: refreshedRequest } = await (this.supabase
      .from("maintenance_requests") as any)
      .select(
        "id, unit_id, tenant_id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at, ai_triage_priority, ai_triage_sentiment, ai_triage_reason, ai_triage_confidence",
      )
      .eq("id", input.requestId)
      .eq("landlord_id", landlordId)
      .maybeSingle();

    if (!refreshedRequest) {
      throw new MaintenanceNotFoundError(input.requestId);
    }

    const { data: tenantRecord } = refreshedRequest.tenant_id
      ? await this.supabase
          .from("profiles")
          .select("full_name, avatar_url, avatar_bg_color")
          .eq("id", refreshedRequest.tenant_id)
          .maybeSingle()
      : { data: null };

    const { data: unitRecord } = refreshedRequest.unit_id
      ? await this.supabase
          .from("units")
          .select("name, property_id")
          .eq("id", refreshedRequest.unit_id)
          .maybeSingle()
      : { data: null };

    const { data: propertyRecord } = unitRecord?.property_id
      ? await this.supabase
          .from("properties")
          .select("name")
          .eq("id", unitRecord.property_id)
          .maybeSingle()
      : { data: null };

    const { cleanedDescription, isSelfRepairRequested } = extractSelfRepairDetails(
      refreshedRequest.description,
      refreshedRequest.category,
    );

    return {
      id: refreshedRequest.id,
      title: refreshedRequest.title,
      description: cleanedDescription,
      selfRepairRequested: refreshedRequest.self_repair_requested || isSelfRepairRequested,
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
      tenantAvatarBgColor: isNonEmptyString(tenantRecord?.avatar_bg_color)
        ? tenantRecord.avatar_bg_color
        : null,
      status: resolveStatus(refreshedRequest.status),
      priority: resolvePriority(refreshedRequest.priority),
      reportedAt: formatRelativeDate(refreshedRequest.created_at),
      images: Array.isArray(refreshedRequest.images)
        ? refreshedRequest.images.filter(isNonEmptyString)
        : [],
      sentiment: resolveSentiment(refreshedRequest.ai_triage_sentiment),
      triageReason: refreshedRequest.ai_triage_reason,
      triageConfidence: refreshedRequest.ai_triage_confidence,
      triageSource: "database",
    };
  }

  /**
   * Update a maintenance request as a tenant.
   *
   * @param tenantId - Authenticated tenant user ID.
   * @param input - Update payload.
   */
  async updateTenantMaintenance(
    tenantId: string,
    input: UpdateTenantMaintenanceInput,
  ): Promise<MaintenanceRequestItem> {
    if (!isNonEmptyString(input.requestId)) {
      throw new MaintenanceValidationError("Request ID is required.");
    }

    const updates: Record<string, unknown> = {};
    if (input.tenantRepairStatus) {
      updates.tenant_repair_status = input.tenantRepairStatus;
      updates.status = "in_progress";
    }
    if (Array.isArray(input.tenantProvidedPhotos)) {
      updates.tenant_provided_photos = input.tenantProvidedPhotos.filter(isNonEmptyString);
    }

    if (Object.keys(updates).length === 0) {
      throw new MaintenanceValidationError("No update payload was provided.");
    }

    const { error: updateError } = await this.supabase
      .from("maintenance_requests")
      .update(updates as any)
      .eq("id", input.requestId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      throw new Error(`Failed to update maintenance request: ${updateError.message}`);
    }

    const { data: refreshedRequest } = await this.supabase
      .from("maintenance_requests")
      .select(
        "id, title, description, status, priority, category, images, self_repair_requested, self_repair_decision, photo_requested, tenant_repair_status, tenant_provided_photos, repair_method, third_party_name, created_at",
      )
      .eq("id", input.requestId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!refreshedRequest) {
      throw new MaintenanceNotFoundError(input.requestId);
    }

    const { cleanedDescription, isSelfRepairRequested } = extractSelfRepairDetails(
      refreshedRequest.description,
      refreshedRequest.category,
    );

    return {
      id: refreshedRequest.id,
      title: refreshedRequest.title,
      description: cleanedDescription,
      selfRepairRequested: refreshedRequest.self_repair_requested || isSelfRepairRequested,
      selfRepairDecision: (refreshedRequest.self_repair_decision as any) ?? undefined,
      photoRequested: refreshedRequest.photo_requested ?? false,
      tenantRepairStatus: (refreshedRequest.tenant_repair_status as any) ?? undefined,
      tenantProvidedPhotos: Array.isArray(refreshedRequest.tenant_provided_photos)
        ? refreshedRequest.tenant_provided_photos.filter(isNonEmptyString)
        : [],
      repairMethod: (refreshedRequest.repair_method as any) ?? undefined,
      thirdPartyName: refreshedRequest.third_party_name,
      property: "Property",
      unit: "Unit",
      status: resolveStatus(refreshedRequest.status),
      priority: resolvePriority(refreshedRequest.priority),
      reportedAt: formatRelativeDate(refreshedRequest.created_at),
      images: Array.isArray(refreshedRequest.images)
        ? refreshedRequest.images.filter(isNonEmptyString)
        : [],
    };
  }
}
