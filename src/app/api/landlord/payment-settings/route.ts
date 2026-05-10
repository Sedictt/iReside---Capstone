import { NextResponse } from "next/server";

import { getBillingWorkspace } from "@/lib/billing/server";
import { BILLING_BUCKETS, removeBillingFile, uploadBillingFile } from "@/lib/billing/storage";
import { requireUser } from "@/lib/supabase/auth";

export async function GET() {
    try {
        const { user, supabase } = await requireUser();
        const workspace = await getBillingWorkspace(supabase, user.id);
        return NextResponse.json(workspace);
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Failed to load billing workspace:", error);
        return NextResponse.json({ error: "Failed to load billing settings." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user, supabase } = await requireUser();
        const formData = await request.formData();
        const accountName = String(formData.get("accountName") ?? "").trim();
        const accountNumber = String(formData.get("accountNumber") ?? "").trim();
        const isEnabled = String(formData.get("isEnabled") ?? "true") !== "false";
        const removeQr = String(formData.get("removeQr") ?? "false") === "true";
        const qrFile = formData.get("qr");
        const utilityPayloadRaw = formData.get("utilityConfigs");

        if (!accountName || !accountNumber) {
            return NextResponse.json({ error: "GCash account name and number are required." }, { status: 400 });
        }

        const { data: existingDestination } = await supabase
            .from("landlord_payment_destinations")
            .select("*")
            .eq("landlord_id", user.id)
            .eq("provider", "gcash")
            .maybeSingle();

        let qrPath = existingDestination?.qr_image_path ?? null;
        let qrUrl = existingDestination?.qr_image_url ?? null;

        if (removeQr && qrPath) {
            await removeBillingFile(BILLING_BUCKETS.landlordQr, qrPath);
            qrPath = null;
            qrUrl = null;
        }

        if (qrFile instanceof File && qrFile.size > 0) {
            const uploaded = await uploadBillingFile({
                bucketName: BILLING_BUCKETS.landlordQr,
                ownerId: user.id,
                scope: "gcash",
                file: qrFile,
            });
            qrPath = uploaded.path;
            qrUrl = uploaded.publicUrl;
        }

        const { error: destinationError } = await supabase
            .from("landlord_payment_destinations")
            .upsert(
                {
                    landlord_id: user.id,
                    provider: "gcash",
                    account_name: accountName,
                    account_number: accountNumber,
                    qr_image_path: qrPath,
                    qr_image_url: qrUrl,
                    is_enabled: isEnabled,
                },
                { onConflict: "landlord_id,provider" },
            );

        if (destinationError) throw destinationError;

        if (typeof utilityPayloadRaw === "string" && utilityPayloadRaw.trim().length > 0) {
            const utilityConfigs = JSON.parse(utilityPayloadRaw) as Array<{
                id?: string;
                property_id: string;
                unit_id?: string | null;
                utility_type: "water" | "electricity";
                billing_mode: "included_in_rent" | "tenant_paid";
                rate_per_unit: number;
                unit_label: "kwh" | "cubic_meter";
                is_active: boolean;
                effective_from: string;
                effective_to?: string | null;
                note?: string | null;
            }>;

            const rows = utilityConfigs.map((item) => {
                const row: Record<string, unknown> = {
                    landlord_id: user.id,
                    property_id: item.property_id,
                    unit_id: item.unit_id ?? null,
                    utility_type: item.utility_type,
                    billing_mode: item.billing_mode,
                    rate_per_unit: item.rate_per_unit,
                    unit_label: item.unit_label,
                    is_active: item.is_active,
                    effective_from: item.effective_from,
                    effective_to: item.effective_to ?? null,
                    note: item.note ?? null,
                };

                if (item.id && typeof item.id === "string" && item.id.length > 0) {
                    row.id = item.id;
                }

                return row;
            });

            if (rows.length > 0) {
                const { error: utilityError } = await supabase.from("utility_configs").upsert(rows as any);
                if (utilityError) throw utilityError;
            }
        }

        const workspace = await getBillingWorkspace(supabase, user.id);
        return NextResponse.json(workspace);
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Failed to save billing workspace:", error);
        return NextResponse.json({ error: "Failed to save billing settings." }, { status: 500 });
    }
}
