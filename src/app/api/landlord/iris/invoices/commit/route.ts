import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  buildDraftInvoiceItems,
  validateReadingDelta,
  type InvoiceBuildContext,
  type CustomItem,
  type UtilityReadingState,
} from "@/lib/services/iris";
import { recordUtilityReading } from "@/lib/billing/server";
import { getOrCreateDirectConversation } from "@/lib/billing/workflow";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
  getMonthStart,
  getMonthEnd,
  toIsoDate,
  formatDateLong,
  makeInvoiceNumber,
  parseLeaseBillingTerms,
} from "@/lib/billing/utils";

export const dynamic = "force-dynamic";

function getWriteClient(authSupabase: any) {
  if (process.env.VITEST) {
    return authSupabase;
  }
  try {
    return createServiceRoleSupabaseClient();
  } catch {
    return authSupabase;
  }
}

interface CommitInvoiceRequestBody {
  context?: InvoiceBuildContext;
  leaseId?: string;
  billingMonth?: string;
  dueDate?: string;
  water?: UtilityReadingState;
  electricity?: UtilityReadingState;
  customItems?: CustomItem[];
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if (!("userId" in auth)) {
      return auth as Response;
    }

    if (auth.userRole !== "landlord") {
      return NextResponse.json(
        { error: "Forbidden: Landlord role required" },
        { status: 403 }
      );
    }

    let body: CommitInvoiceRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const leaseId = body.context?.leaseId ?? body.leaseId;
    if (!leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    // 1. Verify lease ownership
    const ownsLease = await IrisOperationsService.verifyLandlordLeaseOwnership(
      auth.supabase,
      auth.userId,
      leaseId
    );

    if (!ownsLease) {
      return NextResponse.json(
        { error: "Lease not found or unauthorized" },
        { status: 404 }
      );
    }

    // 2. Fetch base context from database
    const baseContext = await IrisOperationsService.getLeaseInvoiceContext(
      auth.supabase,
      auth.userId,
      leaseId
    );

    if (!baseContext) {
      return NextResponse.json(
        { error: "Active lease not found or unauthorized" },
        { status: 404 }
      );
    }

    // 3. Merge request context
    const mergedContext: InvoiceBuildContext = {
      ...baseContext,
      billingMonth: body.context?.billingMonth ?? body.billingMonth ?? baseContext.billingMonth,
      dueDate: body.context?.dueDate ?? body.dueDate ?? baseContext.dueDate,
      notes: body.context?.notes ?? body.notes ?? baseContext.notes ?? "",
      customItems: body.context?.customItems ?? body.customItems ?? baseContext.customItems ?? [],
      water: baseContext.water
        ? {
            ...baseContext.water,
            ...(body.context?.water ?? body.water),
          }
        : undefined,
      electricity: baseContext.electricity
        ? {
            ...baseContext.electricity,
            ...(body.context?.electricity ?? body.electricity),
          }
        : undefined,
    };

    // 4. Validate meter readings if present
    if (
      mergedContext.water &&
      !mergedContext.water.skipped &&
      mergedContext.water.billingMode === "tenant_paid" &&
      mergedContext.water.currentReading !== undefined
    ) {
      const waterCheck = validateReadingDelta(
        mergedContext.water.previousReading,
        mergedContext.water.currentReading,
        {
          allowMeterReset: mergedContext.water.allowMeterReset,
          hasRollover: mergedContext.water.hasRollover,
        }
      );
      if (!waterCheck.valid) {
        return NextResponse.json(
          { error: `Water reading error: ${waterCheck.error}` },
          { status: 400 }
        );
      }
      mergedContext.water.usage = waterCheck.usage;
    }

    if (
      mergedContext.electricity &&
      !mergedContext.electricity.skipped &&
      mergedContext.electricity.billingMode === "tenant_paid" &&
      mergedContext.electricity.currentReading !== undefined
    ) {
      const elecCheck = validateReadingDelta(
        mergedContext.electricity.previousReading,
        mergedContext.electricity.currentReading,
        {
          allowMeterReset: mergedContext.electricity.allowMeterReset,
          hasRollover: mergedContext.electricity.hasRollover,
        }
      );
      if (!elecCheck.valid) {
        return NextResponse.json(
          { error: `Electricity reading error: ${elecCheck.error}` },
          { status: 400 }
        );
      }
      mergedContext.electricity.usage = elecCheck.usage;
    }

    // 5. Billing cycle dates (use UTC for YYYY-MM inputs to avoid local timezone day-shift)
    const billingMonthMatch = /^(\d{4})-(\d{2})/.exec(mergedContext.billingMonth);
    const cycleStart = billingMonthMatch
      ? new Date(Date.UTC(Number(billingMonthMatch[1]), Number(billingMonthMatch[2]) - 1, 1))
      : getMonthStart(mergedContext.billingMonth);
    const cycleEnd = billingMonthMatch
      ? new Date(Date.UTC(Number(billingMonthMatch[1]), Number(billingMonthMatch[2]), 0))
      : getMonthEnd(mergedContext.billingMonth);
    const cycleKey = toIsoDate(cycleStart);
    const dueDateIso = mergedContext.dueDate;

    // 6. Check for duplicate invoice for lease & billing month
    const { data: existingPayment } = await auth.supabase
      .from("payments")
      .select("id")
      .eq("lease_id", leaseId)
      .eq("billing_cycle", cycleKey)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        { error: "An invoice for this lease and billing month already exists." },
        { status: 409 }
      );
    }

    // 7. Calculate draft line items and totals
    const draft = buildDraftInvoiceItems(mergedContext);
    const invoiceNum = makeInvoiceNumber(crypto.randomUUID(), cycleKey);

    // Fetch lease terms for partial payments and late fees snapshot
    const { data: leaseRow } = await auth.supabase
      .from("leases")
      .select("terms")
      .eq("id", leaseId)
      .maybeSingle();
    const terms = parseLeaseBillingTerms(leaseRow?.terms ?? null);

    // 8. Insert invoice into payments table
    const { data: paymentRow, error: paymentError } = await auth.supabase
      .from("payments")
      .insert({
        lease_id: leaseId,
        tenant_id: mergedContext.tenantId,
        landlord_id: auth.userId,
        amount: draft.totalAmount,
        subtotal: draft.subtotal,
        paid_amount: 0,
        balance_remaining: draft.totalAmount,
        status: "pending",
        workflow_status: "pending",
        description: mergedContext.notes?.trim() || `${formatDateLong(cycleKey)} monthly invoice`,
        due_date: dueDateIso,
        billing_cycle: cycleKey,
        invoice_period_start: toIsoDate(cycleStart),
        invoice_period_end: toIsoDate(cycleEnd),
        allow_partial_payments: terms.allowPartialPayments,
        due_day_snapshot: terms.dueDay,
        late_fee_amount: terms.lateFeeAmount,
        invoice_number: invoiceNum,
      })
      .select("id, invoice_number")
      .single();

    if (paymentError || !paymentRow) {
      console.error("Failed to insert payment record:", paymentError);
      return NextResponse.json(
        { error: paymentError?.message || "Failed to create invoice." },
        { status: 500 }
      );
    }

    // 9. Insert line items into payment_items
    const itemInsertRows = draft.items.map((it, idx) => ({
      payment_id: paymentRow.id,
      label: it.label,
      amount: it.amount,
      category: it.category,
      sort_order: it.sortOrder ?? idx * 10,
      metadata: it.metadata ?? {},
    }));

    const { error: itemsError } = await auth.supabase
      .from("payment_items")
      .insert(itemInsertRows);

    if (itemsError) {
      console.error("Failed to insert payment items:", itemsError);
      await auth.supabase.from("payments").delete().eq("id", paymentRow.id);
      return NextResponse.json(
        { error: "Failed to insert invoice line items." },
        { status: 500 }
      );
    }

    // 10. Record meter readings in utility_readings
    const recordUtility = async (
      utilityType: "water" | "electricity",
      readingState?: UtilityReadingState
    ) => {
      if (!readingState || readingState.skipped || readingState.currentReading === undefined) {
        return;
      }

      try {
        if (!readingState.allowMeterReset && readingState.currentReading >= readingState.previousReading) {
          const rec = await recordUtilityReading(auth.supabase, auth.userId, {
            leaseId,
            utilityType,
            billingPeriodStart: toIsoDate(cycleStart),
            billingPeriodEnd: toIsoDate(cycleEnd),
            previousReading: readingState.previousReading,
            currentReading: readingState.currentReading,
            note: "Recorded via iRis guided invoice",
          });
          if (rec?.id) {
            await auth.supabase
              .from("utility_readings")
              .update({ payment_id: paymentRow.id })
              .eq("id", rec.id);
          }
        } else {
          // Direct insert for meter reset / rollover
          const usage = readingState.allowMeterReset
            ? readingState.currentReading
            : Math.max(0, readingState.currentReading - readingState.previousReading);

          await auth.supabase.from("utility_readings").insert({
            landlord_id: auth.userId,
            lease_id: leaseId,
            payment_id: paymentRow.id,
            property_id: mergedContext.propertyId,
            unit_id: mergedContext.unitId,
            utility_type: utilityType,
            billing_mode: readingState.billingMode,
            billing_period_start: toIsoDate(cycleStart),
            billing_period_end: toIsoDate(cycleEnd),
            previous_reading: readingState.previousReading,
            current_reading: readingState.currentReading,
            usage,
            billed_rate: readingState.ratePerUnit,
            computed_charge: Math.round(usage * readingState.ratePerUnit * 100) / 100,
            note: readingState.allowMeterReset ? "Meter replaced / reset" : null,
            entered_at: new Date().toISOString(),
          });
        }
      } catch (utilErr) {
        console.warn(`Failed to record ${utilityType} reading:`, utilErr);
      }
    };

    await recordUtility("water", mergedContext.water);
    await recordUtility("electricity", mergedContext.electricity);

    const writeClient = getWriteClient(auth.supabase);

    // 11. Insert notification in notifications table for tenant
    if (mergedContext.tenantId) {
      try {
        const { error: notifError } = await writeClient.from("notifications").insert({
          user_id: mergedContext.tenantId,
          type: "payment",
          title: "New Invoice Issued",
          message: `Official Invoice #${invoiceNum} for ₱${draft.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been issued for Unit ${mergedContext.unitName}. Due date: ${dueDateIso}.`,
          data: {
            invoice_id: paymentRow.id,
            invoice_number: invoiceNum,
            amount: draft.totalAmount,
            due_date: dueDateIso,
          },
        });
        if (notifError) {
          console.warn("Failed to create tenant notification:", notifError);
        }
      } catch (notifErr) {
        console.warn("Failed to create tenant notification:", notifErr);
      }
    }

    // 12. Dispatch official system message to direct chat thread
    let conversationId: string | null = null;
    let messageId: string | null = null;

    if (mergedContext.tenantId) {
      try {
        conversationId = await getOrCreateDirectConversation(
          writeClient,
          auth.userId,
          mergedContext.tenantId
        );

        const formattedAmount = draft.totalAmount.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        const chatContent = `Official Invoice #${invoiceNum} issued for ₱${formattedAmount}. Due Date: ${dueDateIso}.`;

        const { data: msgRow, error: msgError } = await writeClient
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: auth.userId,
            type: "system",
            content: chatContent,
            metadata: {
              systemType: "invoice",
              invoiceId: paymentRow.id,
              invoiceNumber: invoiceNum,
              amount: draft.totalAmount,
              dueDate: dueDateIso,
              unitName: mergedContext.unitName,
            },
          })
          .select("id")
          .single();

        if (msgError) {
          console.warn("Failed to dispatch chat message:", msgError);
        } else if (msgRow) {
          messageId = msgRow.id;
        }
      } catch (chatErr) {
        console.warn("Failed to dispatch chat message:", chatErr);
      }
    }

    // 13. Return success response
    return NextResponse.json({
      success: true,
      invoiceId: paymentRow.id,
      invoiceNumber: invoiceNum,
      billingCycle: cycleKey,
      totalAmount: draft.totalAmount,
      conversationId,
      messageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
