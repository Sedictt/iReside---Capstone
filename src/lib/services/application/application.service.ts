/**
 * ApplicationService — core business logic and database access for rental applications.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStatus, Database, Json, LeaseStatus } from "@/types/database";
import type {
  ApplicantSummary,
  ApplicationFilterOptions,
  ApplicationLeaseSummary,
  ComplianceChecklist,
  CreateWalkInApplicationInput,
  LandlordApplicationItem,
  LeaseAuditEventSummary,
  PreApprovalPaymentSummary,
  TenantApplicationItem,
} from "./application.types";
import {
  ApplicationAccessError,
  ApplicationNotFoundError,
  ApplicationValidationError,
} from "./application.errors";
import { validateApplicationTransition } from "./application-state-machine";

const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&auto=format&fit=crop&q=80";

function buildComplianceChecklist(
  complianceChecklist: Record<string, boolean> | null,
  requirementsChecklist: Record<string, boolean> | null,
): ComplianceChecklist {
  const merged = {
    ...(complianceChecklist ?? {}),
    ...(requirementsChecklist ?? {}),
  };

  return {
    valid_id: Boolean(merged.valid_id),
    income_verified: Boolean(merged.income_verified),
    application_completed: Boolean(merged.application_completed),
    background_checked: Boolean(merged.background_checked),
    payment_received: Boolean(merged.payment_received),
    lease_signed: Boolean(merged.lease_signed),
    inspection_done: Boolean(merged.inspection_done),
  };
}

export class ApplicationService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch all applications for a landlord with optional property or status filters.
   *
   * @param landlordId - Landlord user ID.
   * @param options - Optional filters (propertyId, status, limit, offset).
   * @returns Array of enriched landlord application items.
   */
  async getLandlordApplications(
    landlordId: string,
    options?: ApplicationFilterOptions,
  ): Promise<LandlordApplicationItem[]> {
    let query = this.supabase
      .from("applications")
      .select("*")
      .eq("landlord_id", landlordId);

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: rawApplications, error: appError } = await query.order("created_at", {
      ascending: false,
    });

    if (appError) {
      throw new Error(`Failed to load applications: ${appError.message}`);
    }

    const applicationRows = rawApplications ?? [];
    if (applicationRows.length === 0) {
      return [];
    }

    // 1. Fetch related units & properties
    const unitIds = Array.from(
      new Set(applicationRows.map((r) => r.unit_id).filter((id): id is string => Boolean(id))),
    );

    const { data: unitsData } = unitIds.length
      ? await this.supabase
          .from("units")
          .select("id, name, rent_amount, property_id, property:properties(id, name, contract_template, images)")
          .in("id", unitIds)
      : { data: [] };

    const unitMap = new Map((unitsData ?? []).map((u) => [u.id, u]));

    // 2. Fetch applicant profiles
    const applicantIds = Array.from(
      new Set(applicationRows.map((r) => r.applicant_id).filter((id): id is string => Boolean(id))),
    );

    const { data: profilesData } = applicantIds.length
      ? await this.supabase
          .from("profiles")
          .select("id, full_name, email, phone, avatar_url, avatar_bg_color")
          .in("id", applicantIds)
      : { data: [] };

    const profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));

    // 3. Fetch associated leases
    const leaseIds = Array.from(
      new Set(applicationRows.map((r) => r.lease_id).filter((id): id is string => Boolean(id))),
    );

    const { data: leasesData } = leaseIds.length
      ? await this.supabase
          .from("leases")
          .select(
            "id, status, signing_mode, tenant_signature, landlord_signature, tenant_signed_at, landlord_signed_at, signing_link_token_hash, updated_at",
          )
          .in("id", leaseIds)
      : { data: [] };

    const leaseMap = new Map((leasesData ?? []).map((l) => [l.id, l]));

    // 4. Map into enriched LandlordApplicationItem array
    const mappedApplications: LandlordApplicationItem[] = applicationRows.map((row) => {
      const applicantProfile = row.applicant_id ? profileMap.get(row.applicant_id) : undefined;
      const unit = row.unit_id ? unitMap.get(row.unit_id) : undefined;
      const property = unit?.property as
        | { id: string; name: string; contract_template: Json | null; images: Json | null }
        | undefined;

      const propertyImages = Array.isArray(property?.images) ? property.images : [];
      const propertyImage =
        typeof propertyImages[0] === "string" && propertyImages[0].length > 0
          ? propertyImages[0]
          : FALLBACK_PROPERTY_IMAGE;

      const walkInName = row.applicant_name ?? null;
      const walkInEmail = row.applicant_email ?? null;
      const walkInPhone = row.applicant_phone ?? null;

      const lease = row.lease_id ? leaseMap.get(row.lease_id) : undefined;
      const leaseExpiryDate =
        lease?.updated_at && lease?.signing_link_token_hash
          ? new Date(new Date(lease.updated_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null;

      return {
        id: row.id,
        source: row.application_source === "invite_link" ? "invite_link" : "walk_in_application",
        applicant: {
          name: walkInName ?? applicantProfile?.full_name ?? "Unknown applicant",
          email: walkInEmail ?? applicantProfile?.email ?? "Not provided",
          phone: walkInPhone ?? applicantProfile?.phone ?? "Not provided",
          occupation: row.employment_status ?? "Not provided",
          monthlyIncome: row.monthly_income ?? null,
          creditScore: null,
          avatar: applicantProfile?.avatar_url ?? null,
          avatarBgColor: applicantProfile?.avatar_bg_color ?? null,
        },
        propertyName: property?.name ?? unit?.name ?? "Property",
        propertyId: property?.id ?? null,
        propertyContractTemplate:
          property?.contract_template &&
          typeof property.contract_template === "object" &&
          !Array.isArray(property.contract_template)
            ? (property.contract_template as Record<string, unknown>)
            : null,
        unitNumber: unit?.name ?? "Unit",
        propertyImage,
        requestedMoveIn: row.move_in_date ?? null,
        monthlyRent: unit?.rent_amount ?? null,
        status: row.status,
        paymentPendingStartedAt: row.payment_pending_started_at ?? null,
        paymentPendingExpiresAt: row.payment_pending_expires_at ?? null,
        submittedDate: row.created_at,
        notes: row.message ?? null,
        documents: Array.isArray(row.documents) ? (row.documents as string[]) : [],
        emergencyContact: {
          name: row.emergency_contact_name ?? null,
          phone: row.emergency_contact_phone ?? null,
        },
        reference: {
          name: row.reference_name ?? null,
          contact: row.reference_phone ?? null,
        },
        complianceChecklist: buildComplianceChecklist(
          row.compliance_checklist as Record<string, boolean> | null,
          row.requirements_checklist as Record<string, boolean> | null,
        ),
        lease: lease
          ? {
              id: lease.id,
              status: lease.status as LeaseStatus,
              signing_mode: lease.signing_mode as "in_person" | "remote" | null,
              tenant_signature: lease.tenant_signature,
              landlord_signature: lease.landlord_signature,
              tenant_signed_at: lease.tenant_signed_at,
              landlord_signed_at: lease.landlord_signed_at,
              signing_link_token_hash: lease.signing_link_token_hash,
              signing_link_expires_at: leaseExpiryDate,
            }
          : null,
      };
    });

    if (options?.propertyId && options.propertyId !== "all") {
      return mappedApplications.filter((app) => app.propertyId === options.propertyId);
    }

    return mappedApplications;
  }

  /**
   * Fetch all applications submitted by a specific tenant applicant.
   *
   * @param tenantId - Tenant user ID.
   * @returns Array of tenant application items.
   */
  async getTenantApplications(tenantId: string): Promise<TenantApplicationItem[]> {
    const { data: applicationsData, error: appError } = await this.supabase
      .from("applications")
      .select(`
        id,
        status,
        documents,
        created_at,
        unit:units (
          id,
          name,
          rent_amount,
          property:properties (
            id,
            name,
            address,
            city,
            type,
            images
          )
        )
      `)
      .eq("applicant_id", tenantId)
      .order("created_at", { ascending: false });

    if (appError) {
      throw new Error(`Failed to fetch tenant applications: ${appError.message}`);
    }

    return (applicationsData ?? []) as unknown as TenantApplicationItem[];
  }

  /**
   * Fetch a single application by ID with ownership verification.
   *
   * @param applicationId - Application record ID.
   * @param landlordId - Optional landlord ID for ownership check.
   * @returns Enriched LandlordApplicationItem or null.
   */
  async getApplicationById(
    applicationId: string,
    landlordId?: string,
  ): Promise<LandlordApplicationItem | null> {
    let query = this.supabase.from("applications").select("*").eq("id", applicationId);

    if (landlordId) {
      query = query.eq("landlord_id", landlordId);
    }

    const { data: applicationRow, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to load application: ${error.message}`);
    }

    if (!applicationRow) {
      return null;
    }

    const applications = await this.getLandlordApplications(applicationRow.landlord_id);
    return applications.find((app) => app.id === applicationId) ?? null;
  }

  /**
   * Create a walk-in application directly as a landlord.
   *
   * @param landlordId - Landlord user ID.
   * @param input - Walk-in application input data.
   * @returns Object containing the created application ID.
   */
  async createWalkInApplication(
    landlordId: string,
    input: CreateWalkInApplicationInput,
  ): Promise<{ id: string }> {
    if (!input.applicantName?.trim() || !input.applicantEmail?.trim()) {
      throw new ApplicationValidationError("Applicant name and email are required.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: createdApp, error: insertError } = await this.supabase
      .from("applications")
      .insert({
        landlord_id: landlordId,
        unit_id: input.unitId,
        applicant_id: null,
        applicant_name: input.applicantName.trim(),
        applicant_email: input.applicantEmail.trim().toLowerCase(),
        applicant_phone: input.applicantPhone?.trim() ?? null,
        monthly_income: input.monthlyIncome ?? null,
        employment_status: input.employmentStatus ?? null,
        move_in_date: input.moveInDate ?? null,
        message: input.message ?? null,
        emergency_contact_name: input.emergencyContactName ?? null,
        emergency_contact_phone: input.emergencyContactPhone ?? null,
        reference_name: input.referenceName ?? null,
        reference_phone: input.referencePhone ?? null,
        documents: input.documents ?? [],
        compliance_checklist: input.complianceChecklist as unknown as Json,
        requirements_checklist: input.requirementsChecklist as unknown as Json,
        application_source: "walk_in_application",
        status: "pending",
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      } as any)
      .select("id")
      .single();


    if (insertError || !createdApp) {
      throw new Error(`Failed to create walk-in application: ${insertError?.message}`);
    }

    return { id: createdApp.id };
  }

  /**
   * Transition an application to a new status with validation against the state machine.
   *
   * @param applicationId - Application ID to transition.
   * @param targetStatus - New status to assign.
   * @param actorId - Actor ID triggering the transition.
   * @param reason - Optional rejection or transition reason.
   */
  async updateApplicationStatus(
    applicationId: string,
    targetStatus: ApplicationStatus,
    actorId: string,
    reason?: string,
  ): Promise<void> {
    const { data: application, error: fetchError } = await this.supabase
      .from("applications")
      .select("id, status, landlord_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch application: ${fetchError.message}`);
    }

    if (!application) {
      throw new ApplicationNotFoundError(applicationId);
    }

    validateApplicationTransition(application.status, targetStatus);

    const currentTimestamp = new Date().toISOString();

    const { error: updateError } = await this.supabase
      .from("applications")
      .update({
        status: targetStatus,
        reviewed_at: currentTimestamp,
        updated_at: currentTimestamp,
      })
      .eq("id", applicationId);

    if (updateError) {
      throw new Error(`Failed to update application status: ${updateError.message}`);
    }
  }
}
