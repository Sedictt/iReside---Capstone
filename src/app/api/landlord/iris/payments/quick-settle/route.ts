import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  QuickSettlementInputSchema,
  formatPhpCurrency,
} from "@/lib/services/iris";
import { findDirectConversation } from "@/lib/messages/engine";

export const dynamic = "force-dynamic";

async function getOrCreateDirectConversation(
  supabase: any,
  landlordId: string,
  tenantId: string
): Promise<string> {
  let existingId: string | null = null;
  try {
    existingId = await findDirectConversation(supabase, landlordId, tenantId);
  } catch {
    const { data: mine } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", landlordId);
    const myIds = (mine ?? []).map((m: any) => m.conversation_id);
    if (myIds.length > 0) {
      const { data: theirs } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", tenantId)
        .in("conversation_id", myIds)
        .maybeSingle();
      if (theirs) {
        existingId = theirs.conversation_id;
      }
    }
  }

  if (existingId) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  await supabase.from("conversations").insert({ id: newId });
  await supabase.from("conversation_participants").insert([
    { conversation_id: newId, user_id: landlordId },
    { conversation_id: newId, user_id: tenantId },
  ]);
  return newId;
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const auth = await requireAuthenticatedUser(request);
    if (!("userId" in auth)) {
      return auth as Response;
    }

    // 2. Validate landlord role
    if (auth.userRole !== "landlord") {
      return NextResponse.json(
        { error: "Forbidden: Landlord role required" },
        { status: 403 }
      );
    }

    // 3. Parse and validate JSON request body
    let rawJson: unknown;
    try {
      rawJson = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parseResult = QuickSettlementInputSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parseResult.data;

    // 4. Fetch invoice from payments table
    const { data: invoice, error: invoiceError } = await auth.supabase
      .from("payments")
      .select("id, lease_id, tenant_id, landlord_id, amount, paid_amount, balance_remaining, status, workflow_status, metadata, receipt_number, due_date")
      .eq("id", input.invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or unauthorized." },
        { status: 404 }
      );
    }

    // 5. Verify lease belongs to landlord
    const ownsLease = await IrisOperationsService.verifyLandlordLeaseOwnership(
      auth.supabase,
      auth.userId,
      invoice.lease_id
    );

    if (!ownsLease) {
      return NextResponse.json(
        { error: "Forbidden: Lease does not belong to landlord." },
        { status: 403 }
      );
    }

    // 6. Compute balances and execute settlement logic
    const currentBalance =
      typeof invoice.balance_remaining === "number"
        ? invoice.balance_remaining
        : Number(invoice.amount) - Number(invoice.paid_amount || 0);

    const settlementResult = IrisOperationsService.recordQuickSettlement(
      input,
      {
        id: invoice.id,
        totalAmount: Number(invoice.amount),
        currentBalance,
      }
    );

    const newPaidAmount =
      Math.round(
        (Number(invoice.paid_amount || 0) + settlementResult.amountPaid) * 100
      ) / 100;

    const existingMetadata =
      typeof invoice.metadata === "object" && invoice.metadata !== null
        ? invoice.metadata
        : {};

    const updatedMetadata = {
      ...existingMetadata,
      settlement_method: input.method,
      receipt_number: settlementResult.receiptNumber,
      settled_at: new Date().toISOString(),
      settled_by: auth.userId,
      settlement_note: input.note || null,
      quick_settled: true,
    };

    // 7. Update payment record
    const { error: updateError } = await auth.supabase
      .from("payments")
      .update({
        status: settlementResult.status === "completed" ? "completed" : "pending",
        workflow_status: "receipted",
        receipt_number: settlementResult.receiptNumber,
        paid_amount: newPaidAmount,
        balance_remaining: settlementResult.remainingBalance,
        method: input.method === "in_person" ? "cash" : input.method,
        reference_number: input.referenceNumber || null,
        paid_at: new Date(input.paymentDate).toISOString(),
        payment_note: input.note || null,
        amount_tag: settlementResult.status === "completed" ? "exact" : "partial",
        review_action: "confirm_received",
        landlord_confirmed: true,
        last_action_at: new Date().toISOString(),
        last_action_by: auth.userId,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      return NextResponse.json(
        { error: `Failed to record settlement: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 8. Dispatch notification to tenant
    if (invoice.tenant_id) {
      try {
        const formattedAmount = formatPhpCurrency(settlementResult.amountPaid);
        const formattedRemaining = formatPhpCurrency(settlementResult.remainingBalance);
        const notifMsg = `Official Receipt #${settlementResult.receiptNumber}: Payment of ${formattedAmount} received (${input.method.replace("_", " ")}). Remaining balance: ${formattedRemaining}.`;

        await auth.supabase.from("notifications").insert({
          user_id: invoice.tenant_id,
          type: "payment",
          title: "Payment Receipt Issued",
          message: notifMsg,
          data: {
            payment_id: invoice.id,
            receipt_number: settlementResult.receiptNumber,
            amount_paid: settlementResult.amountPaid,
            remaining_balance: settlementResult.remainingBalance,
            status: settlementResult.status,
            method: input.method,
          },
          read: false,
        });
      } catch (notifErr) {
        console.warn("Failed to create tenant settlement notification:", notifErr);
      }
    }

    // 9. Dispatch system message to tenant direct chat thread
    if (invoice.tenant_id) {
      try {
        const conversationId = await getOrCreateDirectConversation(
          auth.supabase,
          auth.userId,
          invoice.tenant_id
        );

        const formattedAmount = formatPhpCurrency(settlementResult.amountPaid);
        const formattedRemaining = formatPhpCurrency(settlementResult.remainingBalance);
        const chatContent = `Official Receipt #${settlementResult.receiptNumber}: Payment of ${formattedAmount} confirmed via ${input.method.replace("_", " ")}. Remaining balance: ${formattedRemaining}.`;

        await auth.supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: auth.userId,
          type: "system",
          content: chatContent,
          metadata: {
            systemType: "receipt",
            receiptNumber: settlementResult.receiptNumber,
            invoiceId: invoice.id,
            amountPaid: settlementResult.amountPaid,
            remainingBalance: settlementResult.remainingBalance,
            paymentDate: settlementResult.paymentDate,
            method: input.method,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (chatErr) {
        console.warn("Failed to dispatch settlement direct chat message:", chatErr);
      }
    }

    // 10. Return settlement result
    return NextResponse.json(settlementResult);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
