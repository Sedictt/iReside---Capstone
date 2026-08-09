/**
 * Domain types for Maintenance Service.
 */
import type { Database, MaintenancePriority, MaintenanceStatus } from "@/types/database";
import type { MaintenanceSentiment } from "@/lib/maintenance-triage";

export type MaintenanceRequestRow = Database["public"]["Tables"]["maintenance_requests"]["Row"];

export type MaintenanceStatusLabel = "Pending" | "Assigned" | "In Progress" | "Resolved";
export type MaintenancePriorityLabel = "Critical" | "High" | "Medium" | "Low";
export type MaintenanceSentimentLabel = "Distressed" | "Negative" | "Neutral" | "Positive";

export interface MaintenanceRequestItem {
  id: string;
  title: string;
  description: string;
  selfRepairRequested: boolean;
  selfRepairDecision?: "approved" | "rejected" | "pending";
  photoRequested?: boolean;
  tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
  tenantProvidedPhotos?: string[];
  repairMethod?: "landlord" | "third_party" | "self_repair";
  thirdPartyName?: string | null;
  property: string;
  unit: string;
  tenant?: string;
  tenantAvatar?: string | null;
  tenantAvatarBgColor?: string | null;
  landlord?: string;
  priority: MaintenancePriorityLabel;
  status: MaintenanceStatusLabel;
  reportedAt: string;
  assignee?: string | null;
  scheduledFor?: string | null;
  images: string[];
  sentiment?: MaintenanceSentimentLabel;
  triageReason?: string;
  triageConfidence?: number;
  triageSource?: "ai" | "heuristic" | "cache" | "database";
  triagedAt?: string | null;
}

export interface MaintenanceMetrics {
  actionRequired: number;
  inProgress: number;
  scheduled: number;
  resolvedThisMonth: number;
}

export interface CreateLandlordMaintenanceInput {
  propertyId?: string;
  unitId: string;
  title: string;
  description: string;
  priority: MaintenancePriorityLabel;
}

export interface CreateTenantMaintenanceInput {
  title: string;
  description: string;
  priority?: MaintenancePriority;
  category?: string;
  images?: string[];
  fixItMyself?: boolean;
}

export interface UpdateLandlordMaintenanceInput {
  requestId: string;
  status?: MaintenanceStatus;
  selfRepairDecision?: "pending" | "approved" | "rejected" | null;
  repairMethod?: "landlord" | "third_party" | "self_repair" | null;
  thirdPartyName?: string | null;
  photoRequested?: boolean;
}

export interface UpdateTenantMaintenanceInput {
  requestId: string;
  tenantRepairStatus?: "not_started" | "personnel_arrived" | "repairing" | "done";
  tenantProvidedPhotos?: string[];
}
