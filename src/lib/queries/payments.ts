import { createClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/payment";

/**
 * Fetch all payments for a tenant.
 *
 * @deprecated Prefer instantiating `new PaymentService(supabase)` directly.
 */
export async function getTenantPayments(tenantId: string) {
  const supabase = await createClient();
  const paymentService = new PaymentService(supabase);
  return paymentService.getTenantPayments(tenantId);
}

/**
 * Fetch all payments for a landlord.
 *
 * @deprecated Prefer instantiating `new PaymentService(supabase)` directly.
 */
export async function getLandlordPayments(landlordId: string) {
  const supabase = await createClient();
  const paymentService = new PaymentService(supabase);
  return paymentService.getLandlordPayments(landlordId);
}

/**
 * Get pending payment for a tenant (next due).
 *
 * @deprecated Prefer instantiating `new PaymentService(supabase)` directly.
 */
export async function getPendingPayment(tenantId: string) {
  const supabase = await createClient();
  const paymentService = new PaymentService(supabase);
  return paymentService.getPendingPayment(tenantId);
}

/**
 * Fetch a single payment by ID with full details.
 *
 * @deprecated Prefer instantiating `new PaymentService(supabase)` directly.
 */
export async function getPaymentById(paymentId: string) {
  const supabase = await createClient();
  const paymentService = new PaymentService(supabase);
  return paymentService.getPaymentById(paymentId);
}

/**
 * Get payment statistics for a landlord dashboard.
 *
 * @deprecated Prefer instantiating `new PaymentService(supabase)` directly.
 */
export async function getPaymentStats(landlordId: string) {
  const supabase = await createClient();
  const paymentService = new PaymentService(supabase);
  return paymentService.getPaymentStats(landlordId);
}

