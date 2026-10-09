import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { ExpenseService } from "@/lib/services/payment";
import { PaymentError } from "@/lib/services/payment/payment.errors";
import { parseJsonBody, parseSearchParams } from "@/lib/validation/server";
import { expenseSchema, propertyFilterQuerySchema } from "@/lib/validation/schemas/billing.schema";

export async function POST(request: Request) {
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  const parsed = await parseJsonBody(request, expenseSchema);
  if (!parsed.ok) return parsed.response;
  const { category, amount, date_incurred, description, propertyId } = parsed.data;

  try {
    // The referenced property must belong to this landlord.
    if (propertyId) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", userId)
        .maybeSingle();

      if (propertyError || !property) {
        return NextResponse.json(
          { error: "Property not found.", fieldErrors: { propertyId: "Property not found." } },
          { status: 404 },
        );
      }
    }

    const expenseService = new ExpenseService(supabase);
    await expenseService.createExpense({
      landlordId: userId,
      propertyId: propertyId ?? null,
      category,
      amount,
      dateIncurred: date_incurred,
      description,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record expense:", error);
    if (error instanceof PaymentError && error.httpStatus < 500) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus });
    }
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
    const query = parseSearchParams(searchParams, propertyFilterQuerySchema);
    if (!query.ok) return query.response;
    const propertyId = query.data.propertyId;

    const expenseService = new ExpenseService(supabase);
    const expenses = await expenseService.getExpenses(userId, propertyId || undefined);

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
