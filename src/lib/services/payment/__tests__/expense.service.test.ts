import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpenseService } from "../expense.service";
import { PaymentAccessError, PaymentNotFoundError, PaymentValidationError } from "../payment.errors";

function createMockSupabase() {
  const chainRef: Record<string, any> = {};

  chainRef.select = vi.fn().mockReturnValue(chainRef);
  chainRef.insert = vi.fn().mockReturnValue(chainRef);
  chainRef.delete = vi.fn().mockReturnValue(chainRef);
  chainRef.eq = vi.fn().mockReturnValue(chainRef);
  chainRef.order = vi.fn().mockReturnValue(chainRef);
  chainRef.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chainRef.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockSupabase = {
    from: vi.fn(() => chainRef),
  };

  return { mockSupabase: mockSupabase as any, chain: chainRef };
}

describe("ExpenseService", () => {
  let service: ExpenseService;
  let mockSupabase: any;
  let chain: any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    chain = mocks.chain;
    service = new ExpenseService(mockSupabase);
  });

  describe("getExpenses", () => {
    it("returns expenses list ordered by date_incurred descending", async () => {
      const mockExpenses = [{ id: "exp-1", amount: 500, category: "Repairs" }];
      // chain.order returns promise
      chain.order.mockResolvedValue({ data: mockExpenses, error: null });

      const result = await service.getExpenses("landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
      expect(chain.eq).toHaveBeenCalledWith("landlord_id", "landlord-1");
      expect(result).toEqual(mockExpenses);
    });

    it("applies property filter when provided", async () => {
      chain.order.mockResolvedValue({ data: [], error: null });

      await service.getExpenses("landlord-1", "prop-1");

      expect(chain.eq).toHaveBeenCalledWith("property_id", "prop-1");
    });
  });

  describe("createExpense", () => {
    it("creates and returns a new expense record", async () => {
      const mockCreated = { id: "exp-new", amount: 1200, category: "Utilities" };
      chain.single.mockResolvedValue({ data: mockCreated, error: null });

      const result = await service.createExpense({
        landlordId: "landlord-1",
        category: "Utilities",
        amount: 1200,
        dateIncurred: "2026-08-01",
        description: "Water repair",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
      expect(chain.insert).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("throws PaymentValidationError when amount is non-positive", async () => {
      await expect(
        service.createExpense({
          landlordId: "landlord-1",
          category: "Utilities",
          amount: 0,
          dateIncurred: "2026-08-01",
          description: "Water repair",
        }),
      ).rejects.toBeInstanceOf(PaymentValidationError);
    });
  });

  describe("deleteExpense", () => {
    it("deletes expense on valid landlord ownership", async () => {
      chain.maybeSingle.mockResolvedValue({ data: { id: "exp-1", landlord_id: "landlord-1" }, error: null });

      await service.deleteExpense("exp-1", "landlord-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
      expect(chain.delete).toHaveBeenCalled();
    });


    it("throws PaymentNotFoundError when expense not found", async () => {
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(service.deleteExpense("missing-exp", "landlord-1")).rejects.toBeInstanceOf(
        PaymentNotFoundError,
      );
    });

    it("throws PaymentAccessError when landlord id does not match", async () => {
      chain.maybeSingle.mockResolvedValue({ data: { id: "exp-1", landlord_id: "wrong-owner" }, error: null });

      await expect(service.deleteExpense("exp-1", "landlord-1")).rejects.toBeInstanceOf(
        PaymentAccessError,
      );
    });
  });

  describe("getExpenseSummary", () => {
    it("computes total amount and category breakdown accurately", async () => {
      const mockExpenses = [
        { id: "exp-1", amount: 1000, category: "Repairs" },
        { id: "exp-2", amount: 500, category: "Repairs" },
        { id: "exp-3", amount: 2000, category: "Tax" },
      ];
      chain.order.mockResolvedValue({ data: mockExpenses, error: null });

      const summary = await service.getExpenseSummary("landlord-1");

      expect(summary.total).toBe(3500);
      expect(summary.count).toBe(3);
      expect(summary.byCategory).toEqual({
        Repairs: 1500,
        Tax: 2000,
      });
    });
  });
});
