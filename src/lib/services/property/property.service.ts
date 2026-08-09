/**
 * PropertyService — canonical data-access layer for properties and units.
 *
 * Scoped to an injected SupabaseClient instance.
 * Never calls createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  PropertyDetail,
  PropertyOverviewItem,
  PropertySummary,
  PropertyWithUnits,
  UnitSummary,
  UpdateRenewalSettingsInput,
} from "./property.types";
import {
  PropertyAccessError,
  PropertyNotFoundError,
  PropertyValidationError,
  UnitNotFoundError,
} from "./property.errors";

const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80";

const formatCompactCurrency = (value: number): string => {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
  return `₱${Math.round(value)}`;
};

const getPortfolioStatus = (
  occupied: number,
  total: number,
  maintenanceCount: number,
): "Performing" | "Stable" | "Attention Required" => {
  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
  if (maintenanceCount >= 5 || occupancyRate < 70) return "Attention Required";
  if (occupancyRate >= 90 && maintenanceCount <= 2) return "Performing";
  return "Stable";
};

export class PropertyService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ─── Property Queries ────────────────────────────────────────────────────────

  /**
   * Get all properties belonging to a landlord.
   *
   * @param landlordId - Authenticated landlord user ID.
   * @returns Array of PropertySummary items.
   */
  async getPropertiesForLandlord(landlordId: string): Promise<PropertySummary[]> {
    const { data, error } = await this.supabase
      .from("properties")
      .select("id, name, address, type, images, contract_template")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load properties: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      type: row.type,
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
      contractTemplate:
        row.contract_template &&
        typeof row.contract_template === "object" &&
        !Array.isArray(row.contract_template)
          ? (row.contract_template as Record<string, unknown>)
          : null,
    }));
  }

  /**
   * Get property IDs for a landlord (lightweight — for cross-service filtering).
   *
   * @param landlordId - Authenticated landlord user ID.
   * @returns Array of property ID strings.
   */
  async getPropertyIdsForLandlord(landlordId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("properties")
      .select("id")
      .eq("landlord_id", landlordId);

    if (error) {
      throw new Error(`Failed to load property IDs: ${error.message}`);
    }

    return (data ?? []).map((row) => row.id);
  }

  /**
   * Get a single property's full detail (access-checked for landlord).
   *
   * @param propertyId - Property record ID.
   * @param landlordId - Authenticated landlord user ID.
   * @returns PropertyDetail.
   */
  async getPropertyDetail(propertyId: string, landlordId: string): Promise<PropertyDetail> {
    const { data: property, error } = await this.supabase
      .from("properties")
      .select(
        "id, name, type, address, description, amenities, house_rules, images, contract_template, total_units, total_floors, base_rent_amount",
      )
      .eq("id", propertyId)
      .eq("landlord_id", landlordId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load property: ${error.message}`);
    }

    if (!property) {
      throw new PropertyNotFoundError(propertyId);
    }

    const { count: unitCount } = await this.supabase
      .from("units")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId);

    const { data: envPolicy } = await (this.supabase as any)
      .from("property_environment_policies")
      .select("utility_split_method, utility_fixed_charge_amount, max_occupants_per_unit")
      .eq("property_id", propertyId)
      .maybeSingle();

    return {
      id: property.id,
      name: property.name,
      address: property.address,
      type: property.type,
      description: property.description ?? null,
      images: Array.isArray(property.images) ? (property.images as string[]) : [],
      amenities: Array.isArray(property.amenities) ? (property.amenities as string[]) : [],
      houseRules: Array.isArray(property.house_rules) ? (property.house_rules as string[]) : [],

      contractTemplate:
        property.contract_template &&
        typeof property.contract_template === "object" &&
        !Array.isArray(property.contract_template)
          ? (property.contract_template as Record<string, unknown>)
          : null,
      totalUnits: property.total_units ?? null,
      totalFloors: property.total_floors ?? null,
      baseRentAmount: property.base_rent_amount ? Number(property.base_rent_amount) : null,
      unitCount: unitCount ?? 0,
      envPolicy: envPolicy
        ? {
            utilitySplitMethod: envPolicy.utility_split_method ?? null,
            utilityFixedChargeAmount: envPolicy.utility_fixed_charge_amount
              ? Number(envPolicy.utility_fixed_charge_amount)
              : null,
            maxOccupantsPerUnit: envPolicy.max_occupants_per_unit ?? null,
          }
        : null,
    };
  }

  /**
   * Get all properties with their nested units (for dashboard/walk-in selection).
   *
   * @param landlordId - Authenticated landlord user ID.
   * @returns Array of PropertyWithUnits items.
   */
  async getPropertiesWithUnits(landlordId: string): Promise<PropertyWithUnits[]> {
    const properties = await this.getPropertiesForLandlord(landlordId);
    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) return [];

    const { data: units, error: unitsError } = await this.supabase
      .from("units")
      .select("id, property_id, name, status, rent_amount")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: true });

    if (unitsError) {
      throw new Error(`Failed to load units: ${unitsError.message}`);
    }

    const unitsByPropertyId = new Map<string, UnitSummary[]>();
    for (const unit of units ?? []) {
      const existing = unitsByPropertyId.get(unit.property_id) ?? [];
      existing.push({
        id: unit.id,
        propertyId: unit.property_id,
        name: unit.name,
        status: unit.status,
        rentAmount: Number(unit.rent_amount ?? 0),
      });
      unitsByPropertyId.set(unit.property_id, existing);
    }

    return properties.map((property) => ({
      ...property,
      units: unitsByPropertyId.get(property.id) ?? [],
    }));
  }

  /**
   * Get portfolio overview with occupancy stats, revenue, and status.
   *
   * @param landlordId - Authenticated landlord user ID.
   * @returns Array of PropertyOverviewItem records.
   */
  async getPortfolioOverview(landlordId: string): Promise<PropertyOverviewItem[]> {
    const { data: properties, error: propertiesError } = await this.supabase
      .from("properties")
      .select("id, name, address, type, images")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (propertiesError) {
      throw new Error(`Failed to fetch properties: ${propertiesError.message}`);
    }

    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p) => p.id);

    const [{ data: units }, { data: maintenanceItems }] = await Promise.all([
      this.supabase
        .from("units")
        .select("id, property_id, status, rent_amount")
        .in("property_id", propertyIds),
      this.supabase
        .from("maintenance_requests")
        .select("id, unit_id, units!inner(property_id)")
        .in("units.property_id", propertyIds)
        .in("status", ["pending", "in_progress"]) as any,
    ]);

    const maintenanceCountByProperty = new Map<string, number>();
    for (const item of (maintenanceItems as any[]) ?? []) {
      const propId = item.units?.property_id;
      if (propId) {
        maintenanceCountByProperty.set(propId, (maintenanceCountByProperty.get(propId) ?? 0) + 1);
      }
    }

    return properties.map((property) => {
      const propertyUnits = (units ?? []).filter((u) => u.property_id === property.id);
      const occupiedUnits = propertyUnits.filter((u) => u.status === "occupied").length;
      const totalUnits = propertyUnits.length;
      const monthlyRevenue = propertyUnits
        .filter((u) => u.status === "occupied")
        .reduce((sum, u) => sum + Number(u.rent_amount ?? 0), 0);
      const maintenanceCount = maintenanceCountByProperty.get(property.id) ?? 0;
      const imageList = Array.isArray(property.images)
        ? (property.images as string[])
        : [];

      return {
        id: property.id,
        name: property.name,
        address: property.address,
        type: property.type,
        image: imageList[0] ?? FALLBACK_PROPERTY_IMAGE,
        totalUnits,
        occupiedUnits,
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
        monthlyRevenue,
        formattedRevenue: formatCompactCurrency(monthlyRevenue),
        status: getPortfolioStatus(occupiedUnits, totalUnits, maintenanceCount),
        maintenanceCount,
      };
    });
  }

  // ─── Unit Queries ─────────────────────────────────────────────────────────────

  /**
   * Get a single unit by ID (verifies it belongs to a property owned by landlord).
   *
   * @param unitId - Unit record ID.
   * @param landlordId - Authenticated landlord user ID.
   * @returns Unit row if found.
   */
  async getUnitForLandlord(
    unitId: string,
    landlordId: string,
  ): Promise<UnitSummary> {
    const { data: unit, error } = await this.supabase
      .from("units")
      .select("id, property_id, name, status, rent_amount, properties!inner(landlord_id)")
      .eq("id", unitId)
      .eq("properties.landlord_id", landlordId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load unit: ${error.message}`);
    }

    if (!unit) {
      throw new UnitNotFoundError(unitId);
    }

    return {
      id: unit.id,
      propertyId: unit.property_id,
      name: unit.name,
      status: unit.status,
      rentAmount: Number(unit.rent_amount ?? 0),
    };
  }

  /**
   * Update renewal settings for a property.
   *
   * @param input - Renewal settings update payload.
   */
  async updateRenewalSettings(input: UpdateRenewalSettingsInput): Promise<void> {
    if (input.renewalNoticeDays < 0 || input.defaultRenewalTermMonths < 1) {
      throw new PropertyValidationError("Invalid renewal settings values.");
    }

    // Verify ownership first
    const { data: property } = await this.supabase
      .from("properties")
      .select("id")
      .eq("id", input.propertyId)
      .eq("landlord_id", input.landlordId)
      .maybeSingle();

    if (!property) {
      throw new PropertyAccessError("Property not found or access denied.");
    }

    const { error } = await this.supabase
      .from("properties")
      .update({
        auto_renewal_enabled: input.autoRenewalEnabled,
        renewal_notice_days: input.renewalNoticeDays,
        default_renewal_term_months: input.defaultRenewalTermMonths,
        default_rent_increase_percent: input.defaultRentIncreasePercent,
      } as any)
      .eq("id", input.propertyId);

    if (error) {
      throw new Error(`Failed to update renewal settings: ${error.message}`);
    }
  }
}
