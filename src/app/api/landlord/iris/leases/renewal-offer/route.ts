import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  renderTemplate,
  formatPhpCurrency,
  type TemplateContext,
} from "@/lib/services/iris";
import { findDirectConversation } from "@/lib/messages/engine";

export const dynamic = "force-dynamic";

const RenewalOfferSchema = z.object({
  leaseId: z.string().min(1, "Lease ID is required"),
  proposedRent: z
    .number()
    .positive("Proposed rent must be greater than zero")
    .max(9999999.99, "Proposed rent exceeds maximum allowed"),
  renewalTermMonths: z
    .number()
    .int("Term months must be an integer")
    .positive("Term months must be positive"),
  customMessage: z
    .string()
    .max(250, "Custom message cannot exceed 250 characters")
    .optional(),
});

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

    const parseResult = RenewalOfferSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { leaseId, proposedRent, renewalTermMonths, customMessage } =
      parseResult.data;

    // 4. Verify lease ownership
    const ownsLease = await IrisOperationsService.verifyLandlordLeaseOwnership(
      auth.supabase,
      auth.userId,
      leaseId
    );

    if (!ownsLease) {
      return NextResponse.json(
        { error: "Forbidden: Lease does not belong to landlord." },
        { status: 403 }
      );
    }

    // 5. Fetch lease details
    const { data: lease, error: leaseError } = await auth.supabase
      .from("leases")
      .select("id, unit_id, tenant_id, monthly_rent, start_date, end_date, status")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json(
        { error: "Lease not found" },
        { status: 404 }
      );
    }

    // 6. Fetch unit, property, and tenant info
    let unitName = "your unit";
    let propertyName = "the property";
    if (lease.unit_id) {
      const { data: unit } = await auth.supabase
        .from("units")
        .select("name, property_id")
        .eq("id", lease.unit_id)
        .maybeSingle();
      if (unit) {
        unitName = unit.name;
        if (unit.property_id) {
          const { data: prop } = await auth.supabase
            .from("properties")
            .select("name")
            .eq("id", unit.property_id)
            .maybeSingle();
          if (prop?.name) {
            propertyName = prop.name;
          }
        }
      }
    }

    let tenantName = "Valued Resident";
    if (lease.tenant_id) {
      const { data: profile } = await auth.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", lease.tenant_id)
        .maybeSingle();
      if (profile?.full_name) {
        tenantName = profile.full_name;
      }
    }

    // 7. Render pre-vetted renewal template
    const templateContext: TemplateContext = {
      tenant_name: tenantName,
      unit: unitName,
      property_name: propertyName,
      amount: formatPhpCurrency(proposedRent),
      lease_end_date: lease.end_date || "the end of your lease term",
      custom_message: customMessage || "",
    };

    let baseMessage = renderTemplate("lease_renewal", templateContext);
    const offerDetails = ` Proposed renewal: ${renewalTermMonths} months at ${formatPhpCurrency(proposedRent)}/month.${customMessage ? ` Message from landlord: "${customMessage}"` : ""}`;
    const renderedMessage = `${baseMessage}${offerDetails}`;

    // 8. Dispatch notification in notifications table
    if (lease.tenant_id) {
      try {
        await auth.supabase.from("notifications").insert({
          user_id: lease.tenant_id,
          type: "lease",
          title: "Lease Renewal Offer",
          message: renderedMessage,
          data: {
            leaseId: lease.id,
            proposedRent,
            renewalTermMonths,
            customMessage: customMessage || null,
          },
          read: false,
        });
      } catch (notifErr) {
        console.warn("Failed to create renewal notification:", notifErr);
      }
    }

    // 9. Dispatch system message to direct chat thread
    if (lease.tenant_id) {
      try {
        const conversationId = await getOrCreateDirectConversation(
          auth.supabase,
          auth.userId,
          lease.tenant_id
        );

        await auth.supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: auth.userId,
          type: "system",
          content: renderedMessage,
          metadata: {
            systemType: "lease_renewal",
            leaseId: lease.id,
            proposedRent,
            renewalTermMonths,
            customMessage: customMessage || null,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (chatErr) {
        console.warn("Failed to dispatch lease renewal direct chat message:", chatErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: renderedMessage,
      leaseId: lease.id,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
