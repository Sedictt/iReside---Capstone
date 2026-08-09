/**
 * Maintenance test factory.
 *
 * @module __tests__/factories/maintenance.factory
 */
import type { Database } from "@/types/database";

export type MaintenanceRequestRow = Database["public"]["Tables"]["maintenance_requests"]["Row"];

export function buildMaintenanceRequest(
  overrides: Partial<MaintenanceRequestRow> = {},
): MaintenanceRequestRow {
  return {
    id: "maint-123",
    tenant_id: "tenant-123",
    unit_id: "unit-123",
    landlord_id: "landlord-123",
    title: "Leaking faucet",
    description: "Bathroom sink faucet is dripping continuously",
    category: "plumbing",
    priority: "medium",
    status: "open",
    images: [],
    self_repair_requested: false,
    self_repair_decision: null,
    photo_requested: false,
    tenant_repair_status: null,
    tenant_provided_photos: [],
    repair_method: null,
    third_party_name: null,
    resolved_at: null,
    ai_triage_priority: null,
    ai_triage_sentiment: null,
    ai_triage_reason: null,
    ai_triage_confidence: null,
    ai_triage_hash: null,
    ai_triage_version: null,
    ai_triaged_at: null,
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}
