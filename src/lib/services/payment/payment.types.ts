/**
 * Payment & Billing domain types.
 *
 * Public surface types for PaymentService, BillingService, and ExpenseService.
 */
import type { Database, Json } from "@/types/database";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentItemRow = Database["public"]["Tables"]["payment_items"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type UtilityReadingRow = Database["public"]["Tables"]["utility_readings"]["Row"];

export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentWorkflowStatus = Database["public"]["Enums"]["payment_workflow_status"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type PaymentIntentMethod = Database["public"]["Enums"]["payment_intent_method"];
export type PaymentAmountTag = Database["public"]["Enums"]["payment_amount_tag"];
export type PaymentReviewAction = Database["public"]["Enums"]["payment_review_action"];

/** Filters for listing landlord payments. */
export interface LandlordPaymentFilters {
  propertyId?: string;
  status?: PaymentStatus;
  workflowStatus?: PaymentWorkflowStatus;
  month?: string; // YYYY-MM
}

/** Joined tenant profile summary for landlord payment views. */
export interface PaymentTenantSummary {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

/** Joined property and unit summary for payment views. */
export interface PaymentLeaseSummary {
  id: string;
  unit: {
    id: string;
    name: string;
    property: {
      id: string;
      name: string;
    } | null;
  } | null;
}

/** Tenant payment list item with joined items and lease info. */
export type TenantPaymentItem = PaymentRow & {
  items: PaymentItemRow[];
  lease: PaymentLeaseSummary | null;
};

/** Landlord payment list item with joined items, tenant profile, and lease. */
export type LandlordPaymentItem = PaymentRow & {
  items: PaymentItemRow[];
  tenant: PaymentTenantSummary | null;
  lease: PaymentLeaseSummary | null;
};

/** Full payment detail with all joined profiles and lease properties. */
export type PaymentDetail = PaymentRow & {
  items: PaymentItemRow[];
  tenant: Database["public"]["Tables"]["profiles"]["Row"] | null;
  landlord: Database["public"]["Tables"]["profiles"]["Row"] | null;
  lease: (Database["public"]["Tables"]["leases"]["Row"] & {
    unit: (Database["public"]["Tables"]["units"]["Row"] & {
      property: Database["public"]["Tables"]["properties"]["Row"] | null;
    }) | null;
  }) | null;
};

/** Dashboard summary statistics for landlord payments. */
export interface PaymentStats {
  totalCollected: number;
  totalPending: number;
  thisMonthCollected: number;
  overdueCount: number;
}

/** Input for recording a manual/offline payment as landlord. */
export interface RecordPaymentInput {
  leaseId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  method: PaymentMethod;
  dueDate: string;
  paidAt?: string;
  referenceNumber?: string;
  description?: string;
  items?: Array<{
    label: string;
    amount: number;
    category?: string;
  }>;
}


/** Input for submitting proof of payment by tenant. */
export interface SubmitPaymentProofInput {
  paymentId: string;
  tenantId: string;
  amountPaid: number;
  paymentProofUrl?: string;
  paymentProofPath?: string;
  paymentNote?: string;
  intentMethod?: PaymentIntentMethod;
}

/** Input for recording an operational property expense. */
export interface CreateExpenseInput {
  landlordId: string;
  propertyId?: string | null;
  unitId?: string | null;
  category: string;
  amount: number;
  dateIncurred: string;
  description: string;
}

/** Input for recording a utility meter reading. */
export interface RecordUtilityReadingInput {
  leaseId: string;
  utilityType: Database["public"]["Enums"]["utility_type"];
  billingPeriodStart: string;
  billingPeriodEnd: string;
  previousReading: number;
  currentReading: number;
  note?: string | null;
  proofImageUrl?: string | null;
  proofImagePath?: string | null;
}

