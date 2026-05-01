import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendPaymentNotifications } from "@/lib/billing/workflow";

type RouteContext = {
    params: Promise<{ id: string }>;
};

/**
 * POST /api/landlord/invoices/[id]/mark-refunded
 *
 * Dedicated endpoint for the "Mark as Refunded" action in the overpayment
 * reconciliation flow. Landlord uploads proof of GCash refund; this endpoint:
 *  1. Uploads the proof image to Supabase storage
 *  2. Updates the payment metadata with the refund proof URL
 *  3. Finds and updates the existing overpayment system message to the
 *     "Reconciliation Complete" / isResolved=true state
 *  4. Sends notifications to both landlord and tenant
 *
 * This is intentionally separate from the /review endpoint so there is zero
 * ambiguity about the intent – calling this endpoint ALWAYS means the landlord
 * has sent the refund and wants to close out the reconciliation.
 */
export async function POST(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const refundProofFile = formData.get("refundProofFile") as File | null;

        // ── 1. Verify payment ownership ─────────────────────────────────────
        const { data: payment, error: paymentError } = await adminClient
            .from("payments")
            .select(
                "id, tenant_id, landlord_id, invoice_number, metadata, amount, paid_amount"
            )
            .eq("id", id)
            .eq("landlord_id", user.id)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json(
                { error: "Invoice not found." },
                { status: 404 }
            );
        }

        const currentMetadata = (payment.metadata as any) || {};

        // Guard: only allow if tenant has submitted refund preference
        if (!currentMetadata.refund_preference) {
            return NextResponse.json(
                {
                    error:
                        "Tenant has not submitted refund details yet. Cannot mark as refunded.",
                },
                { status: 400 }
            );
        }

        // Guard: idempotency – already refunded
        if (currentMetadata.refund_proof_url) {
            return NextResponse.json({
                ok: true,
                idempotent: true,
                refundProofUrl: currentMetadata.refund_proof_url,
            });
        }

        // ── 2. Upload refund proof image ─────────────────────────────────────
        let refundProofUrl: string | null = null;

        if (refundProofFile && refundProofFile.size > 0) {
            const fileExt = refundProofFile.name.split(".").pop();
            const fileName = `refund-proof-${id}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } =
                await adminClient.storage
                    .from("payment-proofs")
                    .upload(fileName, refundProofFile);

            if (uploadError) {
                console.error("[mark-refunded] Upload error:", uploadError);
                throw uploadError;
            }

            const {
                data: { publicUrl },
            } = adminClient.storage
                .from("payment-proofs")
                .getPublicUrl(uploadData.path);

            refundProofUrl = publicUrl;
        }

        // ── 3. Update payment metadata ────────────────────────────────────────
        const nowIso = new Date().toISOString();

        const { error: metadataUpdateError } = await adminClient
            .from("payments")
            .update({
                metadata: {
                    ...currentMetadata,
                    refund_proof_url: refundProofUrl,
                    refund_settled_at: nowIso,
                    refund_settled_by: user.id,
                },
                last_action_at: nowIso,
                last_action_by: user.id,
            })
            .eq("id", id);

        if (metadataUpdateError) throw metadataUpdateError;

        // ── 4. Find and update the overpayment system message ─────────────────
        // We do a broad search: look for system messages that contain this
        // paymentId and issueType=excessive_amount in their metadata.
        // We also try a fallback search without issueType constraint.
        let overpaymentMsgId: string | null = null;
        let overpaymentMsgMeta: Record<string, any> = {};

        // Primary search: exact match on both paymentId and issueType
        const { data: primaryMatch } = await adminClient
            .from("messages")
            .select("id, metadata")
            .eq("type", "system")
            .contains("metadata", {
                paymentId: payment.id,
                issueType: "excessive_amount",
            })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (primaryMatch) {
            overpaymentMsgId = primaryMatch.id;
            overpaymentMsgMeta = (primaryMatch.metadata as any) || {};
        } else {
            // Fallback: search by paymentId only – takes the most recent one
            const { data: fallbackMatch } = await adminClient
                .from("messages")
                .select("id, metadata")
                .eq("type", "system")
                .contains("metadata", { paymentId: payment.id })
                .order("created_at", { ascending: false })
                .limit(5);

            // Find the one that is most likely the overpayment message
            const candidate = (fallbackMatch ?? []).find((m) => {
                const meta = (m.metadata as any) || {};
                return (
                    meta.issueType === "excessive_amount" ||
                    meta.systemType === "landlord_review" ||
                    meta.hasRefundDetails === true
                );
            });

            if (candidate) {
                overpaymentMsgId = candidate.id;
                overpaymentMsgMeta = (candidate.metadata as any) || {};
            }
        }

        if (overpaymentMsgId) {
            console.log(
                "[mark-refunded] Updating system message to resolved state:",
                overpaymentMsgId
            );

            const { error: msgUpdateError } = await adminClient
                .from("messages")
                .update({
                    content:
                        "The refund has been processed and reconciliation is complete.",
                    metadata: {
                        ...overpaymentMsgMeta,
                        systemType: "landlord_review",
                        issueType: "excessive_amount",
                        isResolved: true,
                        refundProofUrl: refundProofUrl,
                        workflowStatus: "confirmed",
                        hasRefundDetails: true,
                        paymentId: payment.id,
                    },
                })
                .eq("id", overpaymentMsgId);

            if (msgUpdateError) {
                console.error(
                    "[mark-refunded] Failed to update system message:",
                    msgUpdateError
                );
                // Non-fatal: payment metadata is already updated
            }
        } else {
            // Create a new resolved message if no existing one was found
            console.log(
                "[mark-refunded] No existing overpayment message found – creating new resolved message."
            );
            const { sendPaymentSystemMessage } = await import(
                "@/lib/billing/workflow"
            );
            await sendPaymentSystemMessage(
                adminClient,
                {
                    id: payment.id,
                    tenant_id: payment.tenant_id,
                    landlord_id: payment.landlord_id,
                    invoice_number: payment.invoice_number,
                },
                {
                    actorId: user.id,
                    actorName: "Landlord",
                    content:
                        "The refund has been processed and reconciliation is complete.",
                    metadata: {
                        systemType: "landlord_review",
                        issueType: "excessive_amount",
                        isResolved: true,
                        refundProofUrl: refundProofUrl,
                        workflowStatus: "confirmed",
                        hasRefundDetails: true,
                        paymentId: payment.id,
                    },
                }
            );
        }

        // ── 5. Notify both parties ─────────────────────────────────────────────
        await sendPaymentNotifications(
            adminClient,
            [payment.tenant_id, payment.landlord_id],
            {
                title: "Refund Processed",
                message: `Refund for invoice ${payment.invoice_number ?? payment.id} has been processed. Reconciliation is complete.`,
                data: {
                    paymentId: payment.id,
                    isRefundReconciliation: true,
                    refundProofUrl,
                },
            }
        );

        return NextResponse.json({
            ok: true,
            refundProofUrl,
            message: "Refund marked as processed successfully.",
        });
    } catch (error) {
        console.error("[mark-refunded] Error:", error);
        return NextResponse.json(
            { error: "Failed to process refund marking." },
            { status: 500 }
        );
    }
}
