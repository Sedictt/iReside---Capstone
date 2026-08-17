/**
 * Payment and Invoice test factory.
 *
 * @module __tests__/factories/payment.factory
 */
import type { Database } from "@/types/database";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export function buildPayment(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    id: "payment-123",
    lease_id: "lease-123",
    tenant_id: "tenant-123",
    amount: 15000,
    status: "completed",
    payment_method: "gcash",
    reference_number: "REF-2026-0001",
    receipt_url: "https://storage.example.com/receipts/receipt-1.pdf",
    notes: "Monthly rent payment",
    billing_period_start: "2026-01-01",
    billing_period_end: "2026-01-31",
    created_at: new Date("2026-01-05T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-05T00:00:00Z").toISOString(),
    ...overrides,
  };
}

export function buildInvoice(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: "invoice-123",
    lease_id: "lease-123",
    landlord_id: "landlord-123",
    invoice_number: "INV-2026-001",
    amount: 15000,
    status: "paid",
    due_date: "2026-01-05",
    paid_at: new Date("2026-01-05T00:00:00Z").toISOString(),
    created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2026-01-05T00:00:00Z").toISOString(),
    ...overrides,
  };
}
