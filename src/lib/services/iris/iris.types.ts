/**
 * Domain types for iRis AI Service.
 */
import type { Lease, MaintenanceRequest, Payment, Profile, Property, Unit } from "@/types/database";

export interface TenantLandlordInfo {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  business_name?: string | null;
  address?: string | null;
}

export interface BuildingWifiInfo {
  ssid: string;
  password: string;
  notes?: string | null;
}

export type IrisCardData =
  | {
      type: "wifi";
      ssid: string;
      password: string;
      notes?: string;
    }
  | {
      type: "landlord";
      name: string;
      businessName?: string | null;
      phone?: string | null;
      email?: string | null;
    }
  | {
      type: "rent";
      monthlyRent: number;
      securityDeposit?: number;
      status: string;
      dueDate?: string;
      lastPaymentDate?: string;
    };

export interface TenantAiContext {
  profile: Profile | null;
  landlord?: TenantLandlordInfo | null;
  lease: (Lease & { unit?: Unit & { property?: Property } }) | null;
  unit: (Unit & { property?: Property }) | null;
  property: Property | null;
  maintenanceRequests: MaintenanceRequest[];
  payments: Payment[];
  wifiInfo?: BuildingWifiInfo | null;
}

export interface IrisChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface IrisHistoryItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface IrisChatResponse {
  response: string;
  hasDataCard: boolean;
  card?: IrisCardData | null;
  metadata: {
    model: string;
    tokens: number;
  };
}
