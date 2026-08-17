/**
 * Domain types for Property Service.
 */
import type { Database } from "@/types/database";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type UnitRow = Database["public"]["Tables"]["units"]["Row"];

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type UnitStatus = Database["public"]["Enums"]["unit_status"];

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  images: string[];
  contractTemplate: Record<string, unknown> | null;
}

export interface PropertyDetail extends PropertySummary {
  description: string | null;
  amenities: string[];
  houseRules: string[];
  totalUnits: number | null;
  totalFloors: number | null;
  baseRentAmount: number | null;
  unitCount: number;
  envPolicy: {
    utilitySplitMethod: string | null;
    utilityFixedChargeAmount: number | null;
    maxOccupantsPerUnit: number | null;
  } | null;
}

export interface PropertyWithUnits extends PropertySummary {
  units: UnitSummary[];
}

export interface UnitSummary {
  id: string;
  propertyId: string;
  name: string;
  status: UnitStatus;
  rentAmount: number;
}

export interface PropertyOverviewItem {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  image: string | null;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  formattedRevenue: string;
  status: "Performing" | "Stable" | "Attention Required";
  maintenanceCount: number;
}

export interface UpdateRenewalSettingsInput {
  propertyId: string;
  landlordId: string;
  autoRenewalEnabled: boolean;
  renewalNoticeDays: number;
  defaultRenewalTermMonths: number;
  defaultRentIncreasePercent: number;
}
