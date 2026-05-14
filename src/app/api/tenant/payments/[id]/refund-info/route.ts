import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await request.formData();
        const action = formData.get("action") as "credit" | "refund";
        const gcashNumber = formData.get("gcashNumber") as string;
        const qrFile = formData.get("qrFile") as File | null;

        const { data: payment, error: fetchError } = await supabase
            .from("payments")
            .select("id, metadata, tenant_id, landlord_id, invoice_number")
            .eq("id", id)
            .single();

        if (fetchError || !payment) {
            return new NextResponse("Payment not found", { status: 404 });
        }

        if (payment.tenant_id !== user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        let qrUrl = null;
        if (qrFile) {
            const fileExt = qrFile.name.split(".").pop();
            const fileName = `refund-qr-${payment.id}-${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("payment-proofs")
                .upload(fileName, qrFile);

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
        const [{ data: tenantProfile }, { sendPaymentSystemMessage }, { createAdminClient }] = await Promise.all([
            supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single(),
            import("@/lib/billing/workflow"),
            import("@/lib/supabase/admin"),
        ]);
        
        const adminClient = createAdminClient();

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
                actorId: user.id,
                actorName: tenantProfile?.full_name || "Tenant",
                content,
                metadata
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Refund info submission error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
