/**
 * Lease service domain types.
 *
 * Public surface types for the LeaseService. Row shapes reuse the generated
 * database types where possible; nested views (unit/property/tenant/landlord
 * joined shapes) are declared explicitly because PostgREST returns flat-joined
 * objects that do not map cleanly onto the normalized Table Rows.
 */
import type { Database } from "@/types/database";

type LeaseRow = Database["public"]["Tables"]["leases"]["Row"];

/** Filters accepted by `listLeasesForLandlord`. */
export interface LandlordLeaseFilters {
  /** Filter to leases on a single property (pass "all" to skip). */
  propertyId?: string;
  /** Single status, or comma-separated list of statuses. */
  status?: string;
}

/** Joined unit + property view used in landlord lease list. */
export interface LeaseUnitSummary {
  id: string;
  name: string;
  beds: number | null;
  baths: number | null;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
}

/** Joined tenant profile view used in landlord lease list. */
export interface LeaseTenantSummary {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  avatar_bg_color: string | null;
}

/** One row of the landlord lease list. */
export type LeaseListItem = Omit<LeaseRow, "unit" | "tenant"> & {
  unit: LeaseUnitSummary | null;
  tenant: LeaseTenantSummary | null;
};

/** Joined unit + property view used in the single-lease detail endpoint. */
export interface LeaseDetailUnit {
  name: string;
  property: {
    name: string;
    address: string;
    contract_template: string | null;
  } | null;
}

/** Joined landlord/tenant profile view used in the detail endpoint. */
export interface LeasePartyView {
  full_name: string | null;
  email: string | null;
}

/** Full lease detail shape returned by `getLeaseDetail`. */
export type LeaseDetail = Omit<LeaseRow, "unit" | "landlord" | "tenant"> & {
  unit: LeaseDetailUnit | null;
  landlord: LeasePartyView | null;
  tenant: LeasePartyView | null;
};