/**
 * Property and Unit test factory.
 *
 * @module __tests__/factories/property.factory
 */
import type { Database } from "@/types/database";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type UnitRow = Database["public"]["Tables"]["units"]["Row"];

export function buildProperty(overrides: Partial<PropertyRow> = {}): PropertyRow {
  return {
    id: "property-123",
    landlord_id: "landlord-123",
    name: "Sunset Residences",
    address: "123 Coastal Ave",
    city: "Valenzuela",
    state: "Metro Manila",
    zip: "1440",
    type: "apartment",
    description: "Modern apartment complex",
    amenities: ["WiFi", "Swimming Pool", "Gym"],
    house_rules: ["No smoking", "Quiet hours after 10PM"],
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"],
    contract_template: null,
    total_units: 10,
    total_floors: 3,
    base_rent_amount: 15000,
    auto_renewal_enabled: false,
    renewal_notice_days: 60,
    default_renewal_term_months: 12,
    default_rent_increase_percent: 5,
    renewal_settings: null,
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}

export function buildUnit(overrides: Partial<UnitRow> = {}): UnitRow {
  return {
    id: "unit-123",
    property_id: "property-123",
    name: "Unit 101",
    floor: 1,
    beds: 2,
    baths: 1,
    sqft: 45,
    rent_amount: 15000,
    deposit_amount: 30000,
    status: "vacant",
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    ...overrides,
  };
}
