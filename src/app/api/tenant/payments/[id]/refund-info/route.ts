import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseWithSchema } from "@/lib/validation/server";
import {
  PROOF_LIMITS,
  REFUND_DETAILS_REQUIRED,
  isUuid,
  proofFileExtension,
  proofFileRule, proofContentRule,
  refundInfoSchema,
} from "@/lib/validation/schemas/billing.schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authContext = await requireAuthenticatedUser(request);
  if (!("userId" in authContext)) return authContext as Response;
  const { userId, supabase } = authContext;

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request body is invalid.", fieldErrors: {} }, { status: 400 });
  }

  const parsed = parseWithSchema(refundInfoSchema, {
    action: formData.get("action") ?? undefined,
    gcashNumber: formData.get("gcashNumber"),
  });
  if (!parsed.ok) return parsed.response;
  const { action, gcashNumber } = parsed.data;

  const qrEntry = formData.get("qrFile");
  const qrFile = qrEntry instanceof File && qrEntry.size > 0 ? qrEntry : null;
  const qrError = proofFileRule(qrFile, { label: "GCash QR code", maxBytes: PROOF_LIMITS.refundQrMaxBytes }) ?? (await proofContentRule(qrFile, { label: "GCash QR code" }));
  if (qrError) {
    return NextResponse.json({ error: qrError, fieldErrors: { qrFile: qrError } }, { status: 400 });
  }

  if (action === "refund" && !gcashNumber && !qrFile) {
    return NextResponse.json({ error: REFUND_DETAILS_REQUIRED, fieldErrors: { gcashNumber: REFUND_DETAILS_REQUIRED } }, { status: 400 });
  }

  try {
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, metadata, tenant_id, landlord_id, invoice_number")
      .eq("id", id)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.tenant_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Once the landlord has settled the refund the preference is locked.
    if ((payment.metadata as any)?.refund_proof_url) {
      return NextResponse.json({ error: "This refund has already been processed." }, { status: 409 });
    }


        let qrUrl = null;
        if (qrFile) {
            const fileName = `refund-qr-${payment.id}-${Date.now()}.${proofFileExtension(qrFile)}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("payment-proofs")
                .upload(fileName, qrFile, { contentType: qrFile.type });

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from("payment-proofs")
                .getPublicUrl(uploadData.path);
            
            qrUrl = publicUrl;
        }

        const newMetadata = {
            ...(payment.metadata as any || {}),
            refund_preference: {
                action,
                gcash_number: gcashNumber || null,
                qr_url: qrUrl,
                submitted_at: new Date().toISOString(),
            }
        };

        const { error: updateError } = await supabase
            .from("payments")
            .update({ metadata: newMetadata })
            .eq("id", id);

        if (updateError) throw updateError;

        // Notify Landlord via Dynamic System Message Update
        const [{ data: tenantProfile }, { sendPaymentSystemMessage }] = await Promise.all([
            supabase
                .from("profiles")
                .select("full_name")
                .eq("id", userId)
                .single(),
            import("@/lib/billing/workflow"),
        ]);
        
        const adminClient = createServiceRoleSupabaseClient();


        // Try to find an existing overpayment message to update dynamically
        // Primary: exact match on paymentId + issueType
        let existingMessageId: string | null = null;
        let existingMessageMeta: Record<string, any> = {};

        const { data: primaryMsg } = await adminClient
            .from("messages")
            .select("id, metadata, content")
            .eq("type", "system")
            .contains("metadata", { paymentId: payment.id, issueType: "excessive_amount" })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (primaryMsg) {
            existingMessageId = primaryMsg.id;
            existingMessageMeta = (primaryMsg.metadata as any) || {};
        } else {
            // Fallback: search by paymentId only, then filter on issueType in code
            const { data: candidates } = await adminClient
                .from("messages")
                .select("id, metadata, content")
                .eq("type", "system")
                .contains("metadata", { paymentId: payment.id })
                .order("created_at", { ascending: false })
                .limit(10);

            const candidate = (candidates ?? []).find((m) => {
                const meta = (m.metadata as any) || {};
                return (
                    meta.issueType === "excessive_amount" ||
                    meta.systemType === "landlord_review"
                );
            });

            if (candidate) {
                existingMessageId = candidate.id;
                existingMessageMeta = (candidate.metadata as any) || {};
            }
        }

        const metadata = {
            systemType: "landlord_review",
            workflowStatus: "under_review",
            issueType: "excessive_amount",
            refundAction: action,
            hasRefundDetails: true,
            // Preserve shortfall amount from previous metadata or payment if updating
            shortfallAmount: existingMessageMeta?.shortfallAmount || (payment.metadata as any)?.shortfallAmount || 0,
            paymentId: payment.id,
            actorName: tenantProfile?.full_name || "Tenant",
        };

        const content = action === "refund" 
            ? "Tenant has submitted refund details for the excess payment." 
            : "Tenant has opted to credit the excess payment to the next billing cycle.";

        if (existingMessageId) {
            // Update the existing message dynamically
            const { error: updateMsgError } = await adminClient
                .from("messages")
                .update({ 
                    content,
                    metadata: {
                        ...existingMessageMeta,
                        ...metadata
                    }
                })
                .eq("id", existingMessageId);
            
            if (updateMsgError) console.error("Failed to update existing message:", updateMsgError);
        } else {
            // Fallback: create new message if none found
            await sendPaymentSystemMessage(adminClient, {
                id: payment.id,
                tenant_id: payment.tenant_id,
                landlord_id: (payment as any).landlord_id,
                invoice_number: (payment as any).invoice_number || "INV-" + payment.id.slice(0, 8),
            }, {
                actorId: userId,
                actorName: tenantProfile?.full_name || "Tenant",
                content,
                metadata
            });

        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Refund info submission error:", error);
        return NextResponse.json({ error: "Failed to submit refund details." }, { status: 500 });
    }
}
