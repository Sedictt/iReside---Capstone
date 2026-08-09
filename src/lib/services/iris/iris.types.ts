/**
 * Domain types for iRis AI Service.
 */
import type { Lease, MaintenanceRequest, Payment, Profile, Property, Unit } from "@/types/database";

export interface TenantAiContext {
  profile: Profile | null;
  lease: (Lease & { unit?: Unit & { property?: Property } }) | null;
  unit: (Unit & { property?: Property }) | null;
  property: Property | null;
  maintenanceRequests: MaintenanceRequest[];
  payments: Payment[];
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
  metadata: {
    model: string;
    tokens: number;
  };
}
