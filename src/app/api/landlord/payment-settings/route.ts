import { NextResponse } from "next/server";

import { getBillingWorkspace } from "@/lib/billing/server";
import { BILLING_BUCKETS, removeBillingFile, uploadBillingFile } from "@/lib/billing/storage";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId } = authContext;

        try {
            requireRole(authContext, "landlord", "admin");
        } catch (e: any) {
            return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const admin = createServiceRoleSupabaseClient();
        const workspace = await getBillingWorkspace(admin, userId);
        return NextResponse.json(workspace);
    } catch (error: any) {
        console.error("Failed to load billing workspace:", error);
        return NextResponse.json({ error: error?.message || "Failed to load billing settings." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId } = authContext;

        try {
            requireRole(authContext, "landlord", "admin");
        } catch (e: any) {
            return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const admin = createServiceRoleSupabaseClient();
        const formData = await request.formData();
        const saveType = (formData.get("saveType") as string | null) || (formData.has("accountName") ? "gcash" : "rates");

        const shouldSaveGcash = saveType === "gcash" || (saveType === "all" && formData.has("accountName"));
        const shouldSaveUtilities = saveType === "rates" || saveType === "all" || (!formData.has("accountName") && formData.has("utilityConfigs"));

        if (shouldSaveGcash) {
            const accountName = String(formData.get("accountName") ?? "").trim();
            const rawAccountNumber = String(formData.get("accountNumber") ?? "").trim();
            const cleanAccountNumber = rawAccountNumber.replace(/\D/g, "");
            const isEnabled = String(formData.get("isEnabled") ?? "true") !== "false";
            const removeQr = String(formData.get("removeQr") ?? "false") === "true";
            const qrFile = formData.get("qr");

            if (!accountName || accountName.length < 2) {
                return NextResponse.json({ error: "GCash account name must be at least 2 characters." }, { status: 400 });
            }

            if (!/^09\d{9}$/.test(cleanAccountNumber)) {
                return NextResponse.json({ 
                    error: "GCash mobile number must be an 11-digit Philippine mobile number starting with 09 (e.g. 09171234567)." 
                }, { status: 400 });
            }

            const { data: existingDestination } = await admin
                .from("landlord_payment_destinations")
                .select("*")
                .eq("landlord_id", userId)
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
                    ownerId: userId,
                    scope: "gcash",
                    file: qrFile,
                });
                qrPath = uploaded.path;
                qrUrl = uploaded.publicUrl;
            }

            const upsertPayload = {
                landlord_id: userId,
                provider: "gcash",
                account_name: accountName,
                account_number: cleanAccountNumber,
                qr_image_path: qrPath,
                qr_image_url: qrUrl,
                is_enabled: isEnabled,
                updated_at: new Date().toISOString(),
            };

            const { error: destinationError } = await admin
                .from("landlord_payment_destinations")
                .upsert(upsertPayload, { onConflict: "landlord_id,provider" });

            if (destinationError) {
                console.error("Failed to upsert landlord payment destination:", destinationError);
                throw destinationError;
            }
        }

        if (shouldSaveUtilities) {
            const utilityPayloadRaw = formData.get("utilityConfigs");
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

                for (const item of utilityConfigs) {
                    if (!item.property_id || item.property_id === "all") continue;

                    const unitId = item.unit_id && typeof item.unit_id === "string" && item.unit_id.trim().length > 0
                        ? item.unit_id.trim()
                        : null;

                    const row: Record<string, unknown> = {
                        landlord_id: userId,
                        property_id: item.property_id,
                        unit_id: unitId,
                        utility_type: item.utility_type,
                        billing_mode: item.billing_mode,
                        rate_per_unit: Number(item.rate_per_unit) || 0,
                        unit_label: item.unit_label,
                        is_active: item.is_active,
                        effective_from: item.effective_from,
                        effective_to: item.effective_to ? item.effective_to : null,
                        note: item.note ? item.note : null,
                        updated_at: new Date().toISOString(),
                    };

                    if (item.id && typeof item.id === "string" && item.id.length > 0) {
                        row.id = item.id;
                        const { error: updateError } = await admin
                            .from("utility_configs")
                            .upsert(row as any, { onConflict: "id" });
                        if (updateError) throw updateError;
                    } else {
                        // Check if a configuration exists for this property/unit/utility/effective_from scope
                        let matchQuery = admin
                            .from("utility_configs")
                            .select("id")
                            .eq("property_id", item.property_id)
                            .eq("utility_type", item.utility_type)
                            .eq("effective_from", item.effective_from);

                        if (unitId) {
                            matchQuery = matchQuery.eq("unit_id", unitId);
                        } else {
                            matchQuery = matchQuery.is("unit_id", null);
                        }

                        const { data: existingConfig } = await matchQuery.maybeSingle();

                        if (existingConfig?.id) {
                            const { error: updateError } = await admin
                                .from("utility_configs")
                                .update(row as any)
                                .eq("id", existingConfig.id);
                            if (updateError) throw updateError;
                        } else {
                            const { error: insertError } = await admin
                                .from("utility_configs")
                                .insert(row as any);
                            if (insertError) throw insertError;
                        }
                    }
                }
            }
        }

        const workspace = await getBillingWorkspace(admin, userId);
        return NextResponse.json(workspace);
    } catch (error: any) {
        console.error("Failed to save billing workspace:", error);
        return NextResponse.json({ 
            error: error?.message || error?.details || "Failed to save billing settings." 
        }, { status: 500 });
    }
}
