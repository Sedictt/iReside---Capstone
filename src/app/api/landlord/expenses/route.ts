import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { ExpenseService } from "@/lib/services/payment";

export async function POST(request: Request) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const body = await request.json();
    const { category, amount, date_incurred, description, propertyId } = body;

    if (!category || !amount || !date_incurred || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expenseService = new ExpenseService(supabase);
    await expenseService.createExpense({
      landlordId: userId,
      propertyId: propertyId || null,
      category,
      amount,
      dateIncurred: date_incurred,
      description,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record expense:", error);
    return NextResponse.json(
      { error: "Failed to record expense" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const expenseService = new ExpenseService(supabase);
    const expenses = await expenseService.getExpenses(userId, propertyId ?? undefined);

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

