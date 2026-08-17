import { createClient } from "@/lib/supabase/server";
import { LeaseService } from "@/lib/services/lease";
import type { RenewalStatus } from "@/types/database";

/**
 * Fetch all leases for a tenant.
 *
 * @param tenantId - The tenant's user id.
 */
export async function getTenantLeases(tenantId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getTenantLeases(tenantId);
}

/**
 * Fetch all leases for a landlord.
 *
 * @param landlordId - The landlord's user id.
 */
export async function getLandlordLeases(landlordId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getLandlordLeases(landlordId);
}

/**
 * Fetch a single lease by ID with all related data.
 *
 * @param leaseId - The lease id.
 */
export async function getLeaseById(leaseId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getLeaseById(leaseId);
}

/**
 * Get the active lease for a specific tenant.
 *
 * @param tenantId - The tenant's user id.
 */
export async function getActiveLease(tenantId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getActiveLease(tenantId);
}

/**
 * Fetch renewal requests for a tenant.
 *
 * @param tenantId - The tenant's user id.
 */
export async function getTenantRenewalRequests(tenantId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getTenantRenewalRequests(tenantId);
}

/**
 * Fetch renewal requests for a landlord.
 *
 * @param landlordId - The landlord's user id.
 * @param status - Optional renewal status filter.
 */
export async function getLandlordRenewalRequests(landlordId: string, status?: RenewalStatus) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getLandlordRenewalRequests(landlordId, status);
}

/**
 * Get a single renewal request by ID.
 *
 * @param requestId - The renewal request id.
 */
export async function getRenewalRequestById(requestId: string) {
  const supabase = await createClient();
  const leaseService = new LeaseService(supabase);
  return leaseService.getRenewalRequestById(requestId);
}

