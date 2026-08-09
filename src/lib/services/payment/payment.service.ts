/**
 * PaymentService — data access and business logic for payments and invoices.
 *
 * Scoped to an injected SupabaseClient instance. NEVER imports createClient() internally.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  LandlordPaymentFilters,
  LandlordPaymentItem,
  PaymentDetail,
  PaymentRow,
  PaymentStats,
  RecordPaymentInput,
  SubmitPaymentProofInput,
  TenantPaymentItem,
} from "./payment.types";
import {
  InvalidPaymentStateError,
  PaymentAccessError,
  PaymentNotFoundError,
  PaymentValidationError,
} from "./payment.errors";

const TENANT_PAYMENTS_QUERY = `
  *,
  items:payment_items (*),
  lease:leases (
    id,
    unit:units (
      id,
      name,
      property:properties (id, name)
    )
  )
`;

const LANDLORD_PAYMENTS_QUERY = `
  *,
  items:payment_items (*),
  tenant:profiles!payments_tenant_id_fkey (
    id,
    full_name,
    avatar_url,
    email
  ),
  lease:leases (
    id,
    unit:units (
      id,
      name,
      property:properties (id, name)
    )
  )
`;

const FULL_PAYMENT_DETAIL_QUERY = `
  *,
  items:payment_items (*),
  tenant:profiles!payments_tenant_id_fkey (*),
  landlord:profiles!payments_landlord_id_fkey (*),
  lease:leases (
    *,
    unit:units (
      *,
      property:properties (*)
    )
  )
`;

export class PaymentService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch all payments for a specific tenant, ordered by due date descending.
   *
   * @param tenantId - Tenant user ID.
   * @returns Array of tenant payments with joined items and lease info.
   */
  async getTenantPayments(tenantId: string): Promise<TenantPaymentItem[]> {
    const { data: paymentsData, error: paymentsError } = await this.supabase
      .from("payments")
      .select(TENANT_PAYMENTS_QUERY)
      .eq("tenant_id", tenantId)
      .order("due_date", { ascending: false });

    if (paymentsError) {
      throw new Error(`Failed to fetch tenant payments: ${paymentsError.message}`);
    }

    return (paymentsData as unknown as TenantPaymentItem[]) ?? [];
  }

  /**
   * Fetch all payments for a specific landlord with optional filtering.
   *
   * @param landlordId - Landlord user ID.
   * @param filters - Optional filters by property, status, or workflowStatus.
   * @returns Array of landlord payments with joined items, tenant profile, and lease.
   */
  async getLandlordPayments(
    landlordId: string,
    filters?: LandlordPaymentFilters,
  ): Promise<LandlordPaymentItem[]> {
    let query = this.supabase
      .from("payments")
      .select(LANDLORD_PAYMENTS_QUERY)
      .eq("landlord_id", landlordId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.workflowStatus) {
      query = query.eq("workflow_status", filters.workflowStatus);
    }

    const { data: paymentsData, error: paymentsError } = await query.order("due_date", {
      ascending: false,
    });

    if (paymentsError) {
      throw new Error(`Failed to fetch landlord payments: ${paymentsError.message}`);
    }

    return (paymentsData as unknown as LandlordPaymentItem[]) ?? [];
  }

  /**
   * Get the next pending payment due for a tenant.
   *
   * @param tenantId - Tenant user ID.
   * @returns Next pending payment or null if no pending payments.
   */
  async getPendingPayment(tenantId: string): Promise<TenantPaymentItem | null> {
    const { data: paymentData, error: paymentError } = await this.supabase
      .from("payments")
      .select(TENANT_PAYMENTS_QUERY)
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      throw new Error(`Failed to fetch pending payment: ${paymentError.message}`);
    }

    return (paymentData as unknown as TenantPaymentItem) ?? null;
  }

  /**
   * Fetch full payment details by ID including items, tenant, landlord, and unit info.
   *
   * @param paymentId - Unique payment record ID.
   * @returns Full payment detail object.
   * @throws {PaymentNotFoundError} If payment does not exist.
   */
  async getPaymentById(paymentId: string): Promise<PaymentDetail> {
    const { data: paymentData, error: paymentError } = await this.supabase
      .from("payments")
      .select(FULL_PAYMENT_DETAIL_QUERY)
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError) {
      throw new Error(`Failed to fetch payment by id: ${paymentError.message}`);
    }

    if (!paymentData) {
      throw new PaymentNotFoundError(paymentId);
    }

    return paymentData as unknown as PaymentDetail;
  }

  /**
   * Calculate dashboard payment statistics for a landlord.
   *
   * @param landlordId - Landlord user ID.
   * @returns Aggregated statistics (totalCollected, totalPending, thisMonthCollected, overdueCount).
   */
  async getPaymentStats(landlordId: string): Promise<PaymentStats> {
    const { data: paymentsData, error: paymentsError } = await this.supabase
      .from("payments")
      .select("amount, status, due_date, paid_at")
      .eq("landlord_id", landlordId);

    if (paymentsError) {
      throw new Error(`Failed to fetch payment stats: ${paymentsError.message}`);
    }

    const currentTimestamp = new Date();
    const currentMonthPrefix = currentTimestamp.toISOString().slice(0, 7); // YYYY-MM

    const stats: PaymentStats = {
      totalCollected: 0,
      totalPending: 0,
      thisMonthCollected: 0,
      overdueCount: 0,
    };

    paymentsData?.forEach(
      (payment: { amount: number; status: string; due_date: string; paid_at: string | null }) => {
        const paymentAmount = Number(payment.amount) || 0;

        if (payment.status === "completed") {
          stats.totalCollected += paymentAmount;
          if (payment.paid_at?.startsWith(currentMonthPrefix)) {
            stats.thisMonthCollected += paymentAmount;
          }
        } else if (payment.status === "pending") {
          stats.totalPending += paymentAmount;
          if (new Date(payment.due_date) < currentTimestamp) {
            stats.overdueCount += 1;
          }
        }
      },
    );

    return stats;
  }

  /**
   * Record a manual payment directly as a landlord.
   *
   * @param input - Payment details (leaseId, tenantId, amount, method, dueDate, etc.).
   * @returns Newly created payment row.
   */
  async recordManualPayment(input: RecordPaymentInput): Promise<PaymentRow> {
    if (input.amount <= 0) {
      throw new PaymentValidationError("Payment amount must be greater than zero.");
    }

    const currentTimestamp = new Date().toISOString();
    const isPaid = Boolean(input.paidAt);

    const { data: createdPayment, error: createError } = await this.supabase
      .from("payments")
      .insert({
        lease_id: input.leaseId,
        tenant_id: input.tenantId,
        landlord_id: input.landlordId,
        amount: input.amount,
        subtotal: input.amount,
        paid_amount: isPaid ? input.amount : 0,
        balance_remaining: isPaid ? 0 : input.amount,
        status: isPaid ? "completed" : "pending",
        workflow_status: isPaid ? "confirmed" : "pending",
        method: input.method,
        due_date: input.dueDate,
        paid_at: input.paidAt ?? null,
        reference_number: input.referenceNumber ?? null,
        description: input.description ?? "Manual Payment",
        landlord_confirmed: isPaid,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      })
      .select()
      .single();

    if (createError || !createdPayment) {
      throw new Error(`Failed to record payment: ${createError?.message}`);
    }

    // Insert associated line items if provided
    if (input.items && input.items.length > 0) {
      const itemsToInsert = input.items.map((item, index) => ({
        payment_id: createdPayment.id,
        label: item.label,
        amount: item.amount,
        category: item.category ?? "rent",
        sort_order: index + 1,
      }));

      await this.supabase.from("payment_items").insert(itemsToInsert as any);
    }


    return createdPayment;
  }

  /**
   * Submit payment proof as a tenant.
   *
   * @param input - Proof URL, amount paid, and optional notes.
   * @returns Updated payment row.
   */
  async submitPaymentProof(input: SubmitPaymentProofInput): Promise<PaymentRow> {
    const payment = await this.getPaymentById(input.paymentId);

    if (payment.tenant_id !== input.tenantId) {
      throw new PaymentAccessError("Unauthorized: You do not own this payment record.");
    }

    if (payment.status === "completed") {
      throw new InvalidPaymentStateError("Payment is already completed.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: updatedPayment, error: updateError } = await this.supabase
      .from("payments")
      .update({
        workflow_status: "under_review",
        payment_submitted_at: currentTimestamp,
        payment_proof_url: input.paymentProofUrl ?? null,
        payment_proof_path: input.paymentProofPath ?? null,
        payment_note: input.paymentNote ?? null,
        intent_method: input.intentMethod ?? null,
        paid_amount: input.amountPaid,
        updated_at: currentTimestamp,
      })
      .eq("id", input.paymentId)
      .select()
      .single();

    if (updateError || !updatedPayment) {
      throw new Error(`Failed to submit payment proof: ${updateError?.message}`);
    }

    return updatedPayment;
  }

  /**
   * Confirm an under-review payment as a landlord.
   *
   * @param paymentId - Payment record ID.
   * @param landlordId - Landlord user ID.
   * @returns Confirmed payment row with status 'completed'.
   */
  async confirmPaymentAsLandlord(paymentId: string, landlordId: string): Promise<PaymentRow> {
    const payment = await this.getPaymentById(paymentId);

    if (payment.landlord_id !== landlordId) {
      throw new PaymentAccessError("Unauthorized: You are not the landlord for this payment.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: confirmedPayment, error: confirmError } = await this.supabase
      .from("payments")
      .update({
        status: "completed",
        workflow_status: "confirmed",
        landlord_confirmed: true,
        paid_at: currentTimestamp,
        balance_remaining: 0,
        paid_amount: payment.amount,
        updated_at: currentTimestamp,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (confirmError || !confirmedPayment) {
      throw new Error(`Failed to confirm payment: ${confirmError?.message}`);
    }

    return confirmedPayment;
  }

  /**
   * Reject an under-review payment as a landlord.
   *
   * @param paymentId - Payment record ID.
   * @param landlordId - Landlord user ID.
   * @param rejectionReason - Rejection explanation.
   * @returns Updated payment row with status 'rejected'.
   */
  async rejectPaymentAsLandlord(
    paymentId: string,
    landlordId: string,
    rejectionReason: string,
  ): Promise<PaymentRow> {
    const payment = await this.getPaymentById(paymentId);

    if (payment.landlord_id !== landlordId) {
      throw new PaymentAccessError("Unauthorized: You are not the landlord for this payment.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: rejectedPayment, error: rejectError } = await this.supabase
      .from("payments")
      .update({
        workflow_status: "rejected",
        rejection_reason: rejectionReason,
        updated_at: currentTimestamp,
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (rejectError || !rejectedPayment) {
      throw new Error(`Failed to reject payment: ${rejectError?.message}`);
    }

    return rejectedPayment;
  }
}
