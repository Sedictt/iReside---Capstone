import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  buildDraftInvoiceItems,
  validateReadingDelta,
  type CustomItem,
} from "@/lib/services/iris";

export const dynamic = "force-dynamic";

interface InvoiceDraftRequestBody {
  leaseId: string;
  billingMonth?: string;
  dueDate?: string;
  water?: {
    currentReading?: number;
    skipped?: boolean;
    hasRollover?: boolean;
    allowMeterReset?: boolean;
  };
  electricity?: {
    currentReading?: number;
    skipped?: boolean;
    hasRollover?: boolean;
    allowMeterReset?: boolean;
  };
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

    let body: InvoiceDraftRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!body || !body.leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    const ownsLease = await IrisOperationsService.verifyLandlordLeaseOwnership(
      auth.supabase,
      auth.userId,
      body.leaseId
    );

    if (!ownsLease) {
      return NextResponse.json(
        { error: "Lease not found or unauthorized" },
        { status: 404 }
      );
    }

    const baseContext = await IrisOperationsService.getLeaseInvoiceContext(
      auth.supabase,
      auth.userId,
      body.leaseId
    );

    if (!baseContext) {
      return NextResponse.json(
        { error: "Failed to load lease context" },
        { status: 404 }
      );
    }

    // Merge inputs into context
    const mergedContext = {
      ...baseContext,
      billingMonth: body.billingMonth ?? baseContext.billingMonth,
      dueDate: body.dueDate ?? baseContext.dueDate,
      notes: body.notes ?? baseContext.notes,
      customItems: body.customItems ?? baseContext.customItems ?? [],
      water: baseContext.water
        ? {
            ...baseContext.water,
            ...body.water,
          }
        : undefined,
      electricity: baseContext.electricity
        ? {
            ...baseContext.electricity,
            ...body.electricity,
          }
        : undefined,
    };

    // Validate meter readings if provided
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

    // Build draft line items and calculate totals
    const draft = buildDraftInvoiceItems(mergedContext);

    return NextResponse.json({
      success: true,
      draft,
      context: mergedContext,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
