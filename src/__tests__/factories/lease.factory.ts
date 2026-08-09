/**
 * Lease test factory.
 *
 * @module __tests__/factories/lease.factory
 */
import type { Database } from "@/types/database";

export type LeaseRow = Database["public"]["Tables"]["leases"]["Row"];

export function buildLease(overrides: Partial<LeaseRow> = {}): LeaseRow {
  return {
    id: "lease-123",
    tenant_id: "tenant-123",
    landlord_id: "landlord-123",
    unit_id: "unit-123",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    monthly_rent: 15000,
    security_deposit: 30000,
    terms: { paymentDueDay: 5, lateFeePercent: 3 },
    contract_url: null,
    signing_token: null,
    signing_token_expires_at: null,
    tenant_signed_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    landlord_signed_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}
