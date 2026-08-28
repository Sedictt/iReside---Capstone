/**
 * LeaseService — read-side data access for leases.
 *
 * Extracted from the landlord lease GET route handlers so the query logic is
 * testable and reusable. The service NEVER imports a Supabase client; it
 * receives one via the constructor and scopes every query to it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RenewalStatus } from "@/types/database";
import type {
  LandlordLeaseFilters,
  LandlordRenewalRequestItem,
  LeaseDetail,
  LeaseListItem,
  RenewalRequestDetail,
  SignLeaseAsLandlordInput,
  SignLeaseResult,
  TenantLeaseItem,
  TenantRenewalRequestItem,
} from "./lease.types";
import type { LeaseData } from "@/types/lease";
import {
  InvalidLeaseTransitionError,
  LeaseAccessError,
  LeaseNotFoundError,
  LeaseSigningEligibilityError,
} from "./lease.errors";
import { generateLandlordSigningLink as createLandlordSigningUrl } from "@/lib/jwt";
import {
  validateSignature,
  sanitizeSignatureDataURL,
  retryWithBackoff,
} from "@/lib/signature-validation";
import {
  isValidLeaseStatusTransition,
  getTransitionErrorMessage,
} from "./lease-status-machine";




/** Columns selected for the landlord lease list. */
const LANDLORD_LIST_QUERY = `
  id,
  status,
  start_date,
  end_date,
  monthly_rent,
  security_deposit,
  signed_at,
  created_at,
  unit:units!inner (
    id,
    name,
    beds,
    baths,
    property:properties!inner (
      id,
      name,
      address
    )
  ),
  tenant:profiles!leases_tenant_id_fkey (
    id,
    full_name,
    email,
    phone,
    avatar_url,
    avatar_bg_color
  )
`;

/** Columns selected for the single-lease detail endpoint. */
const LEASE_DETAIL_QUERY = `
  id,
  status,
  landlord_id,
  start_date,
  end_date,
  monthly_rent,
  security_deposit,
  terms,
  tenant_signature,
  tenant_signed_at,
  signed_document_url,
  signed_at,
  landlord_signed_at,
  unit:units!inner (
    name,
    property:properties!inner (
      name,
      address,
      contract_template
    )
  ),
  landlord:profiles!leases_landlord_id_fkey (
    full_name,
    email
  ),
  tenant:profiles!leases_tenant_id_fkey (
    full_name,
    email
  )
`;

/** Columns selected for tenant leases. */
const TENANT_LEASES_QUERY = `
  *,
  unit:units (
    *,
    property:properties (*)
  ),
  landlord:profiles!leases_landlord_id_fkey (
    id,
    full_name,
    avatar_url,
    email,
    phone
  )
`;

/** Columns selected for landlord full joined leases. */
const LANDLORD_FULL_LEASES_QUERY = `
  *,
  unit:units (
    *,
    property:properties (*)
  ),
  tenant:profiles!leases_tenant_id_fkey (
    id,
    full_name,
    avatar_url,
    email,
    phone
  )
`;

/** Columns selected for general lease by ID. */
const LEASE_BY_ID_QUERY = `
  *,
  unit:units (
    *,
    property:properties (*)
  ),
  tenant:profiles!leases_tenant_id_fkey (*),
  landlord:profiles!leases_landlord_id_fkey (*)
`;

/** Columns selected for tenant renewal requests. */
const TENANT_RENEWAL_REQUESTS_QUERY = `
  *,
  current_lease:leases!renewal_requests_current_lease_id_fkey (
    id, start_date, end_date, monthly_rent
  ),
  new_lease:leases!renewal_requests_new_lease_id_fkey (*)
`;

/** Columns selected for landlord renewal requests. */
const LANDLORD_RENEWAL_REQUESTS_QUERY = `
  *,
  current_lease:leases!renewal_requests_current_lease_id_fkey (
    *,
    unit:units!inner (*),
    tenant:profiles!leases_tenant_id_fkey (*)
  )
`;

/** Columns selected for renewal request by ID. */
const RENEWAL_REQUEST_BY_ID_QUERY = `
  *,
  current_lease:leases!renewal_requests_current_lease_id_fkey (*),
  new_lease:leases!renewal_requests_new_lease_id_fkey (*)
`;

/** Columns selected for rich tenant lease views with full property and unit amenities. */
const TENANT_RICH_LEASE_QUERY = `
  id,
  status,
  start_date,
  end_date,
  monthly_rent,
  security_deposit,
  terms,
  signed_at,
  signed_document_url,
  unit:units!inner (
    id,
    name,
    floor,
    sqft,
    beds,
    baths,
    property:properties!inner (
      id,
      name,
      address,
      city,
      images,
      house_rules,
      amenities:amenities (*),
      renewal_settings,
      renewal_window_days
    )
  ),
  landlord:profiles!leases_landlord_id_fkey (
    id,
    full_name,
    avatar_url,
    avatar_bg_color,
    phone
  ),
  tenant:profiles!leases_tenant_id_fkey (
    full_name
  )
`;


export class LeaseService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * List leases for a given landlord.
   *
   * @param landlordId - The landlord's user id.
   * @param filters - Optional property / status filters.
   * @returns Array of leases, newest first. Empty array when none exist.
   */
  async listLeasesForLandlord(
    landlordId: string,
    filters: LandlordLeaseFilters = {},
  ): Promise<LeaseListItem[]> {
    let query = this.supabase
      .from("leases")
      .select(LANDLORD_LIST_QUERY)
      .eq("landlord_id", landlordId);

    // Apply property filter if provided (skip if "all")
    if (filters.propertyId && filters.propertyId !== "all") {
      query = query.eq("unit.property_id", filters.propertyId);
    }

    // Apply unit filter if provided
    if (filters.unitId) {
      query = query.eq("unit_id", filters.unitId);
    }

    // Apply status filter (supports comma-separated values)
    if (filters.status) {
      const statuses = filters.status
        .split(",")
        .map((status) => status.trim())
        .filter(Boolean);
      if (statuses.length === 1) {
        query = query.eq("status", statuses[0] as Database["public"]["Tables"]["leases"]["Row"]["status"]);
      } else if (statuses.length > 1) {
        query = query.in("status", statuses as Database["public"]["Tables"]["leases"]["Row"]["status"][]);
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch leases: ${error.message}`);
    }

    return (data ?? []) as unknown as LeaseListItem[];
  }

  /**
   * Fetch a single lease by id with related unit/party data.
   *
   * @param leaseId - The lease id.
   * @returns The lease detail row.
   * @throws {LeaseNotFoundError} When no lease exists for the id.
   */
  async getLeaseDetail(leaseId: string): Promise<LeaseDetail> {
    const { data, error } = await this.supabase
      .from("leases")
      .select(LEASE_DETAIL_QUERY)
      .eq("id", leaseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lease: ${error.message}`);
    }

    if (!data) {
      throw new LeaseNotFoundError(leaseId);
    }

    return data as unknown as LeaseDetail;
  }

  /**
   * Fetch all leases for a tenant.
   *
   * @param tenantId - The tenant's user id.
   * @returns Array of tenant leases, newest first.
   */
  async getTenantLeases(tenantId: string): Promise<TenantLeaseItem[]> {
    const { data, error } = await this.supabase
      .from("leases")
      .select(TENANT_LEASES_QUERY)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tenant leases: ${error.message}`);
    }

    return (data ?? []) as unknown as TenantLeaseItem[];
  }

  /**
   * Fetch all leases for a landlord with full joined data.
   *
   * @param landlordId - The landlord's user id.
   * @returns Array of landlord leases, newest first.
   */
  async getLandlordLeases(landlordId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase
      .from("leases")
      .select(LANDLORD_FULL_LEASES_QUERY)
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch landlord leases: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Fetch a single lease by ID with all related data.
   *
   * @param leaseId - The lease id.
   * @returns The joined lease row.
   */
  async getLeaseById(leaseId: string): Promise<unknown> {
    const { data, error } = await this.supabase
      .from("leases")
      .select(LEASE_BY_ID_QUERY)
      .eq("id", leaseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lease: ${error.message}`);
    }

    if (!data) {
      throw new LeaseNotFoundError(leaseId);
    }

    return data;
  }

  /**
   * Get the active lease for a specific tenant.
   *
   * @param tenantId - The tenant's user id.
   * @returns The active lease or null if none exists.
   */
  async getActiveLease(tenantId: string): Promise<TenantLeaseItem | null> {
    const { data, error } = await this.supabase
      .from("leases")
      .select(TENANT_LEASES_QUERY)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch active lease: ${error.message}`);
    }

    return (data as unknown as TenantLeaseItem) ?? null;
  }

  /**
   * Fetch renewal requests for a tenant.
   *
   * @param tenantId - The tenant's user id.
   * @returns Array of renewal requests, newest first.
   */
  async getTenantRenewalRequests(tenantId: string): Promise<TenantRenewalRequestItem[]> {
    const { data, error } = await this.supabase
      .from("renewal_requests")
      .select(TENANT_RENEWAL_REQUESTS_QUERY)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tenant renewal requests: ${error.message}`);
    }

    return (data ?? []) as unknown as TenantRenewalRequestItem[];
  }

  /**
   * Fetch renewal requests for a landlord.
   *
   * @param landlordId - The landlord's user id.
   * @param status - Optional renewal status filter.
   * @returns Array of renewal requests, newest first.
   */
  async getLandlordRenewalRequests(
    landlordId: string,
    status?: RenewalStatus,
  ): Promise<LandlordRenewalRequestItem[]> {
    let query = this.supabase
      .from("renewal_requests")
      .select(LANDLORD_RENEWAL_REQUESTS_QUERY)
      .eq("landlord_id", landlordId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch landlord renewal requests: ${error.message}`);
    }

    return (data ?? []) as unknown as LandlordRenewalRequestItem[];
  }

  /**
   * Get a single renewal request by ID.
   *
   * @param requestId - The renewal request id.
   * @returns The renewal request row or null if not found.
   */
  async getRenewalRequestById(requestId: string): Promise<RenewalRequestDetail | null> {
    const { data, error } = await this.supabase
      .from("renewal_requests")
      .select(RENEWAL_REQUEST_BY_ID_QUERY)
      .eq("id", requestId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch renewal request: ${error.message}`);
    }

    return (data as unknown as RenewalRequestDetail) ?? null;
  }

  /**
   * Get the primary active or most recent lease for a tenant with rich property details.
   *
   * @param tenantId - The tenant's user id.
   * @returns The active or newest lease with full amenities, or null if no lease exists.
   */
  async getTenantActiveLease(tenantId: string): Promise<LeaseData | null> {
    const { data: leasesData, error: leaseError } = await this.supabase
      .from("leases")
      .select(TENANT_RICH_LEASE_QUERY)
      .eq("tenant_id", tenantId)
      .order("start_date", { ascending: false });

    if (leaseError) {
      throw new Error(`Failed to fetch tenant active lease: ${leaseError.message}`);
    }

    if (!leasesData || leasesData.length === 0) {
      return null;
    }

    const activeLease = leasesData.find((lease) => lease.status === "active") ?? leasesData[0];
    return activeLease as unknown as LeaseData;
  }

  /**
   * Fetch a single tenant lease by ID with rich property details, verifying tenant ownership.
   *
   * @param tenantId - The tenant's user id.
   * @param leaseId - The lease id.
   * @returns The full lease detail with property & amenities.
   * @throws {LeaseNotFoundError} If the lease does not exist or does not belong to the tenant.
   */
  async getTenantLeaseById(tenantId: string, leaseId: string): Promise<LeaseData> {
    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select(TENANT_RICH_LEASE_QUERY)
      .eq("id", leaseId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (leaseError) {
      throw new Error(`Failed to fetch tenant lease: ${leaseError.message}`);
    }

    if (!lease) {
      throw new LeaseNotFoundError(leaseId);
    }

    return lease as unknown as LeaseData;
  }

  /**
   * Validate eligibility and generate a secure signing link for a landlord to countersign a lease.
   *
   * @param landlordId - The landlord user id.
   * @param leaseId - The lease id.
   * @returns Object containing the signing URL, lease ID, and current lease status.
   * @throws {LeaseNotFoundError} If lease does not exist.
   * @throws {LeaseAccessError} If the user is not the landlord of this lease.
   * @throws {LeaseSigningEligibilityError} If the lease is not pending landlord signature or tenant hasn't signed.
   */
  async generateLandlordSigningLink(
    landlordId: string,
    leaseId: string,
  ): Promise<{ signingUrl: string; leaseId: string; status: Database["public"]["Tables"]["leases"]["Row"]["status"] }> {
    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select("id, status, landlord_id, tenant_signature, tenant_signed_at")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError) {
      throw new Error(`Failed to fetch lease: ${leaseError.message}`);
    }

    if (!lease) {
      throw new LeaseNotFoundError(leaseId);
    }

    if (lease.landlord_id !== landlordId) {
      throw new LeaseAccessError("Unauthorized: You are not the landlord for this lease");
    }

    if (lease.status !== "pending_landlord_signature") {
      throw new LeaseSigningEligibilityError(
        `Cannot generate signing link. Lease status is: ${lease.status}. Expected: pending_landlord_signature`,
      );
    }

    if (!lease.tenant_signature || !lease.tenant_signed_at) {
      throw new LeaseSigningEligibilityError("Tenant has not signed this lease yet");
    }

    const signingUrl = createLandlordSigningUrl(leaseId, landlordId);

    return {
      signingUrl,
      leaseId,
      status: lease.status,
    };
  }

  /**
   * Countersign a lease agreement as a landlord.
   * Validates signature format, verifies lease status & tenant signature,
   * and atomically updates the lease and linked application with optimistic locking.
   *
   * @param input - Lease ID, landlord ID, and base64 signature string.
   * @param adminClientOverride - Optional admin client for testing or custom execution context.
   * @returns Signing result containing status, timestamp, and sanitized signature.
   */
  async signLeaseAsLandlord(
    input: SignLeaseAsLandlordInput,
    adminClientOverride?: SupabaseClient<Database>,
  ): Promise<SignLeaseResult> {
    const { leaseId, landlordId, signature } = input;

    // 1. Fetch and validate lease
    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select("id, status, landlord_id, tenant_signature, tenant_signed_at")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError) {
      throw new Error(`Failed to fetch lease: ${leaseError.message}`);
    }

    if (!lease) {
      throw new LeaseNotFoundError(leaseId);
    }

    if (lease.landlord_id !== landlordId) {
      throw new LeaseAccessError("Unauthorized: You are not the landlord for this lease");
    }

    if (lease.status !== "pending_landlord_signature") {
      throw new LeaseSigningEligibilityError(
        `Cannot sign lease with status: ${lease.status}. Lease must be in 'pending_landlord_signature' status.`,
      );
    }

    const newStatus = "active" as const;
    if (!isValidLeaseStatusTransition(lease.status, newStatus)) {
      throw new InvalidLeaseTransitionError(getTransitionErrorMessage(lease.status, newStatus));
    }

    if (!lease.tenant_signature || !lease.tenant_signed_at) {
      throw new LeaseSigningEligibilityError("Tenant has not signed this lease yet");
    }

    // 2. Validate and sanitize signature
    const validation = await validateSignature(signature);
    if (!validation.valid) {
      throw new LeaseSigningEligibilityError(validation.error ?? "Invalid signature format");
    }

    const sanitizedSignature = sanitizeSignatureDataURL(signature);
    const signedAt = new Date().toISOString();

    // 3. Perform optimistic lock update via service-role / admin client
    const updateLeaseAndApplication = async () => {
      const adminClient =
        adminClientOverride ??
        (await import("@/lib/supabase/admin")).createServiceRoleSupabaseClient();

      const { data: currentLease, error: fetchError } = await adminClient
        .from("leases")
        .select("signature_lock_version")
        .eq("id", leaseId)
        .single();

      if (fetchError || !currentLease) {
        throw new Error(`Failed to fetch lease for optimistic locking: ${fetchError?.message}`);
      }

      const currentLockVersion = currentLease.signature_lock_version;

      const { error: updateLeaseError, data: updatedRows } = await adminClient
        .from("leases")
        .update({
          landlord_signature: sanitizedSignature,
          status: newStatus,
          landlord_signed_at: signedAt,
          signed_at: signedAt,
          updated_at: signedAt,
          signature_lock_version: currentLockVersion + 1,
        })
        .eq("id", leaseId)
        .eq("signature_lock_version", currentLockVersion)
        .select("id");

      if (updateLeaseError) {
        throw new Error(`Failed to update lease: ${updateLeaseError.message}`);
      }

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error("Optimistic lock failure: lease was updated by another process.");
      }

      // Update associated application
      const { data: application, error: appFetchError } = await adminClient
        .from("applications")
        .select("id, compliance_checklist")
        .eq("lease_id", leaseId)
        .maybeSingle();

      if (!appFetchError && application) {
        const updatedChecklist = {
          ...((application.compliance_checklist as Record<string, unknown> | null) || {}),
          lease_signed: true,
          application_completed: true,
        };

        await adminClient
          .from("applications")
          .update({
            status: "approved",
            compliance_checklist: updatedChecklist,
            updated_at: signedAt,
          } as any)
          .eq("id", application.id);
      }
    };

    await retryWithBackoff(updateLeaseAndApplication, 3, 1000);

    return {
      leaseId,
      status: "active",
      signedAt,
      sanitizedSignature,
    };
  }
}