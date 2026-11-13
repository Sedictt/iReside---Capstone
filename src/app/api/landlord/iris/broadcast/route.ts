import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import {
  IrisOperationsService,
  renderTemplate,
  formatPhpCurrency,
  type IrisTemplateKey,
  type TemplateContext,
} from "@/lib/services/iris";
import { findDirectConversation } from "@/lib/messages/engine";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types/database";

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

export const dynamic = "force-dynamic";

export const BroadcastRequestSchema = z.object({
  filterType: z.enum([
    "all_active_tenants",
    "overdue_5d",
    "due_soon",
    "expiring_leases_60d",
  ]),
  propertyId: z.string().optional(),
  templateKey: z.enum([
    "payment_gentle",
    "payment_overdue",
    "lease_renewal",
    "maintenance_advisory",
    "general_notice",
  ]),
  customMessage: z
    .string()
    .max(500, "Custom message cannot exceed 500 characters")
    .optional(),
  maintenanceDate: z.string().optional(),
  selectedLeaseIds: z.array(z.string()).optional(),
  channels: z
    .object({
      inAppNotification: z.boolean().optional(),
      directMessage: z.boolean().optional(),
    })
    .refine(
      (c) => c.inAppNotification === true || c.directMessage === true,
      {
        message:
          "At least one delivery channel (inAppNotification or directMessage) must be selected",
      }
    ),
});

export type BroadcastRequestBody = z.infer<typeof BroadcastRequestSchema>;

function getNotificationTitle(templateKey: IrisTemplateKey): string {
  switch (templateKey) {
    case "payment_gentle":
      return "Rent Payment Reminder";
    case "payment_overdue":
      return "Urgent: Unpaid Rent Notice";
    case "lease_renewal":
      return "Lease Renewal Notice";
    case "maintenance_advisory":
      return "Maintenance Advisory";
    case "general_notice":
      return "Building Announcement";
    default:
      return "Notice from Landlord";
  }
}

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
  const { error: convError } = await supabase.from("conversations").insert({ id: newId });
  if (convError) {
    throw new Error(`Failed to create conversation: ${convError.message}`);
  }
  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: newId, user_id: landlordId },
    { conversation_id: newId, user_id: tenantId },
  ]);
  if (partError) {
    throw new Error(`Failed to add conversation participants: ${partError.message}`);
  }
  return newId;
}

export async function POST(request: Request) {
  try {
    // 1. Authentication Guard
    const auth = await requireAuthenticatedUser(request);
    if (!("userId" in auth)) {
      return auth as Response;
    }

    // 2. Landlord Role Guard
    if (auth.userRole !== "landlord") {
      return NextResponse.json(
        { error: "Forbidden: Landlord role required" },
        { status: 403 }
      );
    }

    // 3. Request Body Validation
    let rawJson: unknown;
    try {
      rawJson = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parseResult = BroadcastRequestSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      filterType,
      propertyId,
      templateKey,
      customMessage,
      maintenanceDate,
      selectedLeaseIds,
      channels,
    } = parseResult.data;

    // 4. Property Ownership Verification (if propertyId provided)
    if (propertyId) {
      const owns = await IrisOperationsService.verifyLandlordPropertyOwnership(
        auth.supabase,
        auth.userId,
        propertyId
      );
      if (!owns) {
        return NextResponse.json(
          { error: "Property not found or unauthorized" },
          { status: 403 }
        );
      }
    }

    // 5. Operational Context & Audience Resolution
    const context = await IrisOperationsService.getLandlordOperationalContext(
      auth.supabase,
      auth.userId,
      propertyId
    );

    const audience = IrisOperationsService.filterAudience(
      context.activeLeases,
      filterType,
      { propertyId }
    );

    // Filter to selected leases, also verifying that every selected lease belongs to this landlord's audience
    let targetLeases = audience;
    if (selectedLeaseIds && selectedLeaseIds.length > 0) {
      const selectedSet = new Set(selectedLeaseIds);
      targetLeases = audience.filter((lease) => selectedSet.has(lease.id));
    }

    if (targetLeases.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        sentCount: 0,
        recipients: [],
        channelsDelivered: [],
        message: "No matching recipients to send to",
      });
    }

    const writeSupabase = getWriteClient(auth.supabase);

    const channelsDelivered: string[] = [];
    if (channels.inAppNotification) channelsDelivered.push("in_app_notification");
    if (channels.directMessage) channelsDelivered.push("direct_message");

    // 6. Dual-Channel Delivery

    // Channel 1: In-App Notification (Batch insert)
    if (channels.inAppNotification) {
      const notificationType: NotificationType = templateKey.startsWith("payment")
        ? "payment"
        : templateKey === "lease_renewal"
        ? "lease"
        : templateKey === "maintenance_advisory"
        ? "maintenance"
        : "announcement";

      const title = getNotificationTitle(templateKey);

      const notificationInserts = targetLeases.map((lease) => {
        const templateContext: TemplateContext = {
          tenant_name: lease.tenantName,
          unit: lease.unitName,
          property_name: lease.propertyName,
          amount: formatPhpCurrency(
            lease.outstandingBalance > 0 ? lease.outstandingBalance : lease.monthlyRent
          ),
          due_date: lease.dueDate || "the due date",
          days_overdue: String(lease.daysOverdue || 0),
          lease_end_date: lease.endDate || "the end of your lease",
          maintenance_date: maintenanceDate || "the scheduled date",
          custom_message: customMessage || "",
        };

        const messageContent = renderTemplate(templateKey, templateContext);

        return {
          user_id: lease.tenantId,
          type: notificationType,
          title,
          message: messageContent,
          data: {
            leaseId: lease.id,
            propertyId: lease.propertyId,
            unitId: lease.unitId,
            templateKey,
          },
          read: false,
        };
      });

      const { error: notifError } = await writeSupabase
        .from("notifications")
        .insert(notificationInserts);

      if (notifError) {
        console.error("Batch notification insert error:", notifError);
        return NextResponse.json(
          { error: `Failed to insert notifications: ${notifError.message}` },
          { status: 500 }
        );
      }
    }

    // Channel 2: Direct Chat Message (1-on-1 DM system message)
    let dmSentCount = 0;
    let dmFailedCount = 0;
    let lastDmError: string | null = null;

    if (channels.directMessage) {
      const conversationCache = new Map<string, string>();

      for (const lease of targetLeases) {
        try {
          let conversationId = conversationCache.get(lease.tenantId);
          if (!conversationId) {
            conversationId = await getOrCreateDirectConversation(
              writeSupabase,
              auth.userId,
              lease.tenantId
            );
            conversationCache.set(lease.tenantId, conversationId);
          }

          const templateContext: TemplateContext = {
            tenant_name: lease.tenantName,
            unit: lease.unitName,
            property_name: lease.propertyName,
            amount: formatPhpCurrency(
              lease.outstandingBalance > 0 ? lease.outstandingBalance : lease.monthlyRent
            ),
            due_date: lease.dueDate || "the due date",
            days_overdue: String(lease.daysOverdue || 0),
            lease_end_date: lease.endDate || "the end of your lease",
            maintenance_date: maintenanceDate || "the scheduled date",
            custom_message: customMessage || "",
          };

          const messageContent = renderTemplate(templateKey, templateContext);

          // Insert message
          const { error: msgError } = await writeSupabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: auth.userId,
            type: "system",
            content: messageContent,
            metadata: {
              systemType: "reminder_sent",
              templateKey,
              leaseId: lease.id,
              propertyId: lease.propertyId,
              unitId: lease.unitId,
              timestamp: new Date().toISOString(),
            },
          });

          if (msgError) {
            console.error("Direct message insert error:", msgError);
            dmFailedCount += 1;
            lastDmError = msgError.message;
            continue;
          }

          dmSentCount += 1;

          // Update conversation timestamp to bump inbox position
          await writeSupabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        } catch (dmErr) {
          console.error("Direct message delivery error:", dmErr);
          dmFailedCount += 1;
          lastDmError = dmErr instanceof Error ? dmErr.message : "Failed to send direct message";
        }
      }

      if (dmSentCount === 0 && dmFailedCount > 0) {
        return NextResponse.json(
          { error: `Failed to send direct messages: ${lastDmError || "Unknown error"}` },
          { status: 500 }
        );
      }
    }

    // 7. Success Response
    const recipientsSummary = targetLeases.map((l) => ({
      leaseId: l.id,
      tenantId: l.tenantId,
      tenantName: l.tenantName,
      unitName: l.unitName,
      propertyName: l.propertyName,
    }));

    return NextResponse.json({
      success: true,
      count: targetLeases.length,
      sentCount: targetLeases.length,
      directMessagesSent: dmSentCount,
      directMessagesFailed: dmFailedCount,
      recipients: recipientsSummary,
      channelsDelivered,
    });
  } catch (error) {
    console.error("Iris broadcast error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
