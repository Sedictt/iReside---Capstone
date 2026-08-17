/**
 * ExpenseService — data access and operations for landlord property expenses.
 *
 * Scoped to an injected SupabaseClient instance.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreateExpenseInput, ExpenseRow } from "./payment.types";
import { PaymentAccessError, PaymentNotFoundError, PaymentValidationError } from "./payment.errors";

export class ExpenseService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Fetch all operational expenses for a landlord, optionally filtered by property.
   *
   * @param landlordId - Landlord user ID.
   * @param propertyId - Optional property ID to filter by ("all" or undefined returns all).
   * @returns Array of expense rows ordered by date_incurred descending.
   */
  async getExpenses(landlordId: string, propertyId?: string): Promise<ExpenseRow[]> {
    let query = this.supabase
      .from("expenses")
      .select("*")
      .eq("landlord_id", landlordId);

    if (propertyId && propertyId !== "all") {
      query = query.eq("property_id", propertyId);
    }

    const { data: expensesData, error: expensesError } = await query.order("date_incurred", {
      ascending: false,
    });


    if (expensesError) {
      throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
    }

    return expensesData ?? [];
  }

  /**
   * Create and record a new operational expense.
   *
   * @param input - Expense details (category, amount, dateIncurred, description, etc.).
   * @returns Newly created expense row.
   */
  async createExpense(input: CreateExpenseInput): Promise<ExpenseRow> {
    if (input.amount <= 0) {
      throw new PaymentValidationError("Expense amount must be greater than zero.");
    }

    if (!input.category || !input.description || !input.dateIncurred) {
      throw new PaymentValidationError("Missing required expense fields.");
    }

    const currentTimestamp = new Date().toISOString();

    const { data: createdExpense, error: createError } = await this.supabase
      .from("expenses")
      .insert({
        landlord_id: input.landlordId,
        property_id: input.propertyId || null,
        unit_id: input.unitId || null,
        category: input.category,
        amount: input.amount,
        date_incurred: input.dateIncurred,
        description: input.description,
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      })
      .select()
      .single();

    if (createError || !createdExpense) {
      throw new Error(`Failed to record expense: ${createError?.message}`);
    }

    return createdExpense;
  }

  /**
   * Delete an existing expense record.
   *
   * @param expenseId - Expense record ID.
   * @param landlordId - Landlord user ID for ownership validation.
   */
  async deleteExpense(expenseId: string, landlordId: string): Promise<void> {
    const { data: existingExpense, error: fetchError } = await this.supabase
      .from("expenses")
      .select("id, landlord_id")
      .eq("id", expenseId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch expense: ${fetchError.message}`);
    }

    if (!existingExpense) {
      throw new PaymentNotFoundError(expenseId);
    }

    if (existingExpense.landlord_id !== landlordId) {
      throw new PaymentAccessError("Unauthorized: You do not own this expense record.");
    }

    const { error: deleteError } = await this.supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (deleteError) {
      throw new Error(`Failed to delete expense: ${deleteError.message}`);
    }
  }

  /**
   * Calculate aggregated expense summaries for a landlord.
   *
   * @param landlordId - Landlord user ID.
   * @param propertyId - Optional property filter.
   * @returns Summary object with total expense amount, count, and category breakdown.
   */
  async getExpenseSummary(
    landlordId: string,
    propertyId?: string,
  ): Promise<{ total: number; count: number; byCategory: Record<string, number> }> {
    const expenses = await this.getExpenses(landlordId, propertyId);

    let total = 0;
    const byCategory: Record<string, number> = {};

    for (const expense of expenses) {
      const expenseAmount = Number(expense.amount) || 0;
      total += expenseAmount;
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expenseAmount;
    }

    return {
      total,
      count: expenses.length,
      byCategory,
    };
  }
}
