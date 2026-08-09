/**
 * LeaseService — read-side data access for leases.
 *
 * Extracted from the landlord lease GET route handlers so the query logic is
 * testable and reusable. The service NEVER imports a Supabase client; it
 * receives one via the constructor and scopes every query to it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  LandlordLeaseFilters,
  LeaseDetail,
  LeaseListItem,
} from "./lease.types";
import { LeaseNotFoundError } from "./lease.errors";

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
}