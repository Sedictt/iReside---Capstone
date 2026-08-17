import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "../payment.service";
import {
  InvalidPaymentStateError,
  PaymentAccessError,
  PaymentNotFoundError,
  PaymentValidationError,
} from "../payment.errors";

function createMockSupabase() {
  const chainRef: Record<string, any> = {};

  chainRef.select = vi.fn().mockReturnValue(chainRef);
  chainRef.insert = vi.fn().mockReturnValue(chainRef);
  chainRef.update = vi.fn().mockReturnValue(chainRef);
  chainRef.eq = vi.fn().mockReturnValue(chainRef);
  chainRef.order = vi.fn().mockReturnValue(chainRef);
  chainRef.limit = vi.fn().mockReturnValue(chainRef);
  chainRef.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chainRef.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockSupabase = {
    from: vi.fn(() => chainRef),
  };

  return { mockSupabase: mockSupabase as any, chain: chainRef };
}

describe("PaymentService", () => {
  let service: PaymentService;
  let mockSupabase: any;
  let chain: any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    chain = mocks.chain;
    service = new PaymentService(mockSupabase);
  });

  describe("getTenantPayments", () => {
    it("fetches tenant payments ordered by due_date descending", async () => {
      const mockPayments = [{ id: "pay-1", amount: 15000, tenant_id: "tenant-1" }];
      chain.order.mockResolvedValue({ data: mockPayments, error: null });

      const result = await service.getTenantPayments("tenant-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("payments");
      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(chain.order).toHaveBeenCalledWith("due_date", { ascending: false });
      expect(result).toEqual(mockPayments);
    });

    it("throws error when query fails", async () => {
      chain.order.mockResolvedValue({ data: null, error: { message: "database error" } });

      await expect(service.getTenantPayments("tenant-1")).rejects.toThrow(
        "Failed to fetch tenant payments: database error",
      );
    });
  });

  describe("getLandlordPayments", () => {
    it("fetches landlord payments without filters", async () => {
      const mockPayments = [{ id: "pay-1", amount: 15000, landlord_id: "landlord-1" }];
      chain.order.mockResolvedValue({ data: mockPayments, error: null });

      const result = await service.getLandlordPayments("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("payments");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual(mockPayments);
    });

    it("applies status and workflowStatus filters when provided", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.getLandlordPayments("landlord-1", {
        status: "pending",
        workflowStatus: "under_review",
      });

      expect(chain.eq).toHaveBeenCalledWith("status", "pending");
      expect(chain.eq).toHaveBeenCalledWith("workflow_status", "under_review");
    });
  });

  describe("getPendingPayment", () => {
    it("returns next pending payment", async () => {
      const mockPending = { id: "pay-pending", amount: 12000, status: "pending" };
      chain.maybeSingle.mockResolvedValue({ data: mockPending, error: null });

      const result = await service.getPendingPayment("tenant-1");

      expect(chain.eq).toHaveBeenCalledWith("tenant_id", "tenant-1");
      expect(chain.eq).toHaveBeenCalledWith("status", "pending");
      expect(result).toEqual(mockPending);
    });

    it("returns null when no pending payment exists", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await service.getPendingPayment("tenant-1");
      expect(result).toBeNull();
    });
  });

  describe("getPaymentById", () => {
    it("returns full payment detail", async () => {
      const mockDetail = { id: "pay-100", amount: 20000 };
      chain.maybeSingle.mockResolvedValue({ data: mockDetail, error: null });

      const result = await service.getPaymentById("pay-100");

      expect(chain.eq).toHaveBeenCalledWith("id", "pay-100");
      expect(result).toEqual(mockDetail);
    });

    it("throws PaymentNotFoundError when payment does not exist", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.getPaymentById("missing-pay")).rejects.toBeInstanceOf(
        PaymentNotFoundError,
      );
    });
  });

  describe("getPaymentStats", () => {
    it("aggregates dashboard statistics accurately", async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const mockPayments = [
        { amount: 10000, status: "completed", due_date: "2026-06-01", paid_at: `${currentMonth}-05` },
        { amount: 5000, status: "completed", due_date: "2026-05-01", paid_at: "2026-05-05" },
        { amount: 8000, status: "pending", due_date: "2020-01-01", paid_at: null }, // overdue
        { amount: 12000, status: "pending", due_date: "2099-01-01", paid_at: null }, // future
      ];

      // chain.select returns chain, which in this case is awaited as { data, error }
      chain.eq.mockResolvedValue({ data: mockPayments, error: null });

      const stats = await service.getPaymentStats("landlord-1");

      expect(stats.totalCollected).toBe(15000);
      expect(stats.thisMonthCollected).toBe(10000);
      expect(stats.totalPending).toBe(20000);
      expect(stats.overdueCount).toBe(1);
    });
  });

  describe("recordManualPayment", () => {
    it("creates payment with line items", async () => {
      const createdRow = { id: "new-pay-1", amount: 15000, status: "completed" };
      chain.single.mockResolvedValue({ data: createdRow, error: null });

      const result = await service.recordManualPayment({
        leaseId: "lease-1",
        tenantId: "tenant-1",
        landlordId: "landlord-1",
        amount: 15000,
        method: "cash",
        dueDate: "2026-08-01",
        paidAt: "2026-08-01T10:00:00Z",
        items: [{ label: "Rent", amount: 15000 }],
      });


      expect(mockSupabase.from).toHaveBeenCalledWith("payments");
      expect(chain.insert).toHaveBeenCalled();
      expect(result).toEqual(createdRow);
    });

    it("throws PaymentValidationError when amount is non-positive", async () => {
      await expect(
        service.recordManualPayment({
          leaseId: "lease-1",
          tenantId: "tenant-1",
          landlordId: "landlord-1",
          amount: 0,
          method: "cash",
          dueDate: "2026-08-01",
        }),
      ).rejects.toBeInstanceOf(PaymentValidationError);
    });
  });

  describe("submitPaymentProof", () => {
    const existingPayment = {
      id: "pay-1",
      tenant_id: "tenant-1",
      status: "pending",
      amount: 15000,
    };

    it("updates workflow_status to under_review on proof submission", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: existingPayment, error: null });
      const updatedPayment = { ...existingPayment, workflow_status: "under_review" };
      chain.single.mockResolvedValueOnce({ data: updatedPayment, error: null });

      const result = await service.submitPaymentProof({
        paymentId: "pay-1",
        tenantId: "tenant-1",
        amountPaid: 15000,
        paymentProofUrl: "https://example.com/proof.jpg",
      });

      expect(chain.update).toHaveBeenCalled();
      expect(result.workflow_status).toBe("under_review");
    });

    it("throws PaymentAccessError on tenant mismatch", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: existingPayment, error: null });

      await expect(
        service.submitPaymentProof({
          paymentId: "pay-1",
          tenantId: "wrong-tenant",
          amountPaid: 15000,
        }),
      ).rejects.toBeInstanceOf(PaymentAccessError);
    });

    it("throws InvalidPaymentStateError when payment already completed", async () => {
      chain.maybeSingle.mockResolvedValueOnce({
        data: { ...existingPayment, status: "completed" },
        error: null,
      });

      await expect(
        service.submitPaymentProof({
          paymentId: "pay-1",
          tenantId: "tenant-1",
          amountPaid: 15000,
        }),
      ).rejects.toBeInstanceOf(InvalidPaymentStateError);
    });
  });

  describe("confirmPaymentAsLandlord", () => {
    const pendingPayment = {
      id: "pay-1",
      landlord_id: "landlord-1",
      amount: 10000,
      status: "pending",
    };

    it("confirms payment and marks completed", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: pendingPayment, error: null });
      const confirmedPayment = { ...pendingPayment, status: "completed", workflow_status: "confirmed" };
      chain.single.mockResolvedValueOnce({ data: confirmedPayment, error: null });

      const result = await service.confirmPaymentAsLandlord("pay-1", "landlord-1");

      expect(chain.update).toHaveBeenCalled();
      expect(result.status).toBe("completed");
    });

    it("throws PaymentAccessError on landlord mismatch", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: pendingPayment, error: null });

      await expect(
        service.confirmPaymentAsLandlord("pay-1", "wrong-landlord"),
      ).rejects.toBeInstanceOf(PaymentAccessError);
    });
  });

  describe("rejectPaymentAsLandlord", () => {
    const pendingPayment = {
      id: "pay-1",
      landlord_id: "landlord-1",
      amount: 10000,
    };

    it("marks payment as rejected with reason", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: pendingPayment, error: null });
      const rejectedPayment = { ...pendingPayment, workflow_status: "rejected" };
      chain.single.mockResolvedValueOnce({ data: rejectedPayment, error: null });

      const result = await service.rejectPaymentAsLandlord(
        "pay-1",
        "landlord-1",
        "Invalid receipt attached",
      );

      expect(chain.update).toHaveBeenCalled();
      expect(result.workflow_status).toBe("rejected");
    });

    it("throws PaymentAccessError on landlord mismatch", async () => {
      chain.maybeSingle.mockResolvedValueOnce({ data: pendingPayment, error: null });

      await expect(
        service.rejectPaymentAsLandlord("pay-1", "wrong-landlord", "Reason"),
      ).rejects.toBeInstanceOf(PaymentAccessError);
    });
  });
});
