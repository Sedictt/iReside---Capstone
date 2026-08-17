/**
 * Domain types for Application Service.
 */
import type { ApplicationStatus, Database, Json, LeaseStatus } from "@/types/database";

export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

export type ApplicationSource = "walk_in_application" | "invite_link";

export interface ApplicantSummary {
  name: string;
  email: string;
  phone: string;
  occupation: string;
  monthlyIncome: number | null;
  creditScore: number | null;
  avatar: string | null;
  avatarBgColor: string | null;
}

export interface ComplianceChecklist {
  valid_id: boolean;
  income_verified: boolean;
  application_completed: boolean;
  background_checked: boolean;
  payment_received: boolean;
  lease_signed: boolean;
  inspection_done: boolean;
}

export interface ApplicationLeaseSummary {
  id: string;
  status: LeaseStatus;
  signing_mode: "in_person" | "remote" | null;
  tenant_signature: string | null;
  landlord_signature: string | null;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  signing_link_token_hash: string | null;
  signing_link_expires_at: string | null;
}

export interface LeaseAuditEventSummary {
  id: string;
  created_at: string;
  event_type: string;
  actor_label?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PreApprovalPaymentSummary {
  id: string;
  requirementType: "advance_rent" | "security_deposit";
  amount: number;
  dueAt: string | null;
  status: "pending" | "processing" | "completed" | "rejected" | "expired";
  method: "gcash" | "cash" | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  proofUrl: string | null;
  reviewNote: string | null;
  bypassed: boolean;
}

export interface LandlordApplicationItem {
  id: string;
  source: ApplicationSource;
  applicant: ApplicantSummary;
  propertyName: string;
  propertyId?: string | null;
  propertyContractTemplate: Record<string, unknown> | null;
  unitNumber: string;
  propertyImage: string;
  requestedMoveIn: string | null;
  monthlyRent: number | null;
  status: ApplicationStatus;
  paymentPendingStartedAt?: string | null;
  paymentPendingExpiresAt?: string | null;
  submittedDate: string;
  notes: string | null;
  documents: string[];
  emergencyContact?: {
    name: string | null;
    phone: string | null;
  };
  reference?: {
    name: string | null;
    contact: string | null;
  };
  complianceChecklist?: ComplianceChecklist | null;
  lease?: ApplicationLeaseSummary | null;
  leaseAuditEvents?: LeaseAuditEventSummary[];
  preApprovalPayments?: PreApprovalPaymentSummary[];
}

export interface TenantApplicationItem {
  id: string;
  status: ApplicationStatus;
  documents: string[];
  created_at: string;
  unit: {
    id: string;
    name: string;
    rent_amount: number;
    property: {
      id: string;
      name: string;
      address: string;
      city: string;
      type: string;
      images: string[] | null;
    };
  } | null;
}

export interface ApplicationFilterOptions {
  propertyId?: string;
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}

export interface CreateWalkInApplicationInput {
  unitId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  moveInDate?: string | null;
  monthlyIncome?: number | null;
  employmentStatus?: string | null;
  employer?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  referenceName?: string | null;
  referencePhone?: string | null;
  message?: string | null;
  documents?: string[];
  requirementsChecklist?: Record<string, boolean> | null;
  complianceChecklist?: Record<string, boolean> | null;
}
