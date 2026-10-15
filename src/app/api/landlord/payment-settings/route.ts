import { NextResponse } from "next/server";

import { getBillingWorkspace } from "@/lib/billing/server";
import { BILLING_BUCKETS, removeBillingFile, uploadBillingFile } from "@/lib/billing/storage";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import type { z } from "zod";
import { databaseErrorResponse, parseWithSchema } from "@/lib/validation/server";
import {
    deletedConfigIdsSchema,
    gcashSettingsSchema,
    inspectImageUpload,
    utilityConfigListSchema,
} from "@/lib/validation/schemas/properties.schema";

/** Matches the landlord-payment-qr bucket limit and the billing panel picker. */
const QR_MAX_BYTES = 5 * 1024 * 1024;

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
        return NextResponse.json({ error: "Failed to load billing settings." }, { status: 500 });
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
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json({ error: "Settings must be sent as form data." }, { status: 400 });
        }
        const rawSaveType = formData.get("saveType");
        const saveType = (typeof rawSaveType === "string" && rawSaveType) || (formData.has("accountName") ? "gcash" : "rates");
        if (!["gcash", "rates", "all"].includes(saveType)) {
            return NextResponse.json({ error: "Unknown settings section.", fieldErrors: { saveType: "Unknown settings section." } }, { status: 400 });
        }

        const shouldSaveGcash = saveType === "gcash" || (saveType === "all" && formData.has("accountName"));
        const shouldSaveUtilities = saveType === "rates" || saveType === "all" || (!formData.has("accountName") && formData.has("utilityConfigs"));

        const formString = (key: string) => {
            const value = formData.get(key);
            return typeof value === "string" ? value : undefined;
        };

        // ---- Validate everything before writing anything --------------------------------
        let gcash: z.output<typeof gcashSettingsSchema> | null = null;
        let qrUpload: File | null = null;
        if (shouldSaveGcash) {
            const parsedGcash = parseWithSchema(gcashSettingsSchema, {
                accountName: formString("accountName") ?? "",
                accountNumber: formString("accountNumber") ?? "",
                isEnabled: formString("isEnabled"),
                removeQr: formString("removeQr"),
            });
            if (!parsedGcash.ok) return parsedGcash.response;
            gcash = parsedGcash.data;

            const qrFile = formData.get("qr");
            if (qrFile instanceof File && qrFile.size > 0) {
                const inspected = await inspectImageUpload(qrFile, { maxBytes: QR_MAX_BYTES, label: "QR code image" });
                if (!inspected.ok) {
                    return NextResponse.json({ error: inspected.error, fieldErrors: { qr: inspected.error } }, { status: 400 });
                }
                qrUpload = new File([inspected.bytes], `gcash-qr.${inspected.extension}`, { type: inspected.contentType });
            }
        }

        let utilityConfigs: z.output<typeof utilityConfigListSchema> = [];
        let deletedConfigIds: string[] = [];
        if (shouldSaveUtilities) {
            const parseJsonField = (key: string): { ok: true; value: unknown } | { ok: false } => {
                const raw = formString(key);
                if (raw === undefined || raw.trim().length === 0) return { ok: true, value: [] };
                try {
                    return { ok: true, value: JSON.parse(raw) };
                } catch {
                    return { ok: false };
                }
            };

            const deletedRaw = parseJsonField("deletedConfigIds");
            if (!deletedRaw.ok) {
                return NextResponse.json({ error: "Deleted utility settings are malformed.", fieldErrors: {} }, { status: 400 });
            }
            const parsedDeleted = parseWithSchema(deletedConfigIdsSchema, deletedRaw.value);
            if (!parsedDeleted.ok) return parsedDeleted.response;
            deletedConfigIds = parsedDeleted.data;

            const configsRaw = parseJsonField("utilityConfigs");
            if (!configsRaw.ok) {
                return NextResponse.json({ error: "Utility settings are malformed.", fieldErrors: {} }, { status: 400 });
            }
            const parsedConfigs = parseWithSchema(utilityConfigListSchema, configsRaw.value);
            if (!parsedConfigs.ok) return parsedConfigs.response;
            utilityConfigs = parsedConfigs.data.filter((item) => item.property_id !== "all");

            // Every referenced property / unit / existing config must belong to this landlord.
            const propertyIds = Array.from(new Set(utilityConfigs.map((item) => item.property_id)));
            if (propertyIds.length > 0) {
                const { data: ownedProperties, error: ownedError } = await admin
                    .from("properties")
                    .select("id")
                    .eq("landlord_id", userId)
                    .in("id", propertyIds);
                if (ownedError) throw ownedError;
                const owned = new Set((ownedProperties ?? []).map((row: { id: string }) => row.id));
                if (propertyIds.some((id) => !owned.has(id))) {
                    return NextResponse.json({ error: "Property not found or access denied." }, { status: 403 });
                }
            }

            const unitIds = Array.from(new Set(utilityConfigs.map((item) => item.unit_id).filter((id): id is string => Boolean(id))));
            if (unitIds.length > 0) {
                const { data: unitRows, error: unitError } = await admin
                    .from("units")
                    .select("id, property_id")
                    .in("id", unitIds);
                if (unitError) throw unitError;
                const unitProperty = new Map((unitRows ?? []).map((row: { id: string; property_id: string }) => [row.id, row.property_id]));
                if (utilityConfigs.some((item) => item.unit_id && unitProperty.get(item.unit_id) !== item.property_id)) {
                    return NextResponse.json({ error: "A unit does not belong to the selected property." }, { status: 403 });
                }
            }

            const updateIds = Array.from(new Set(utilityConfigs.map((item) => item.id).filter((id): id is string => Boolean(id))));
            if (updateIds.length > 0) {
                const { data: ownedConfigs, error: configError } = await admin
                    .from("utility_configs")
                    .select("id")
                    .eq("landlord_id", userId)
                    .in("id", updateIds);
                if (configError) throw configError;
                const ownedConfigIds = new Set((ownedConfigs ?? []).map((row: { id: string }) => row.id));
                // Previously an upsert by id could overwrite (and re-own) another landlord's row.
                if (updateIds.some((id) => !ownedConfigIds.has(id))) {
                    return NextResponse.json({ error: "Utility setting not found or access denied." }, { status: 403 });
                }
            }
        }

        // ---- Persist ------------------------------------------------------------------
        if (gcash) {
            const { data: existingDestination } = await admin
                .from("landlord_payment_destinations")
                .select("*")
                .eq("landlord_id", userId)
                .eq("provider", "gcash")
                .maybeSingle();

            let qrPath = existingDestination?.qr_image_path ?? null;
            let qrUrl = existingDestination?.qr_image_url ?? null;

            if (gcash.removeQr && qrPath) {
                await removeBillingFile(BILLING_BUCKETS.landlordQr, qrPath);
                qrPath = null;
                qrUrl = null;
            }

            if (qrUpload) {
                const uploaded = await uploadBillingFile({
                    bucketName: BILLING_BUCKETS.landlordQr,
                    ownerId: userId,
                    scope: "gcash",
                    file: qrUpload,
                });
                qrPath = uploaded.path;
                qrUrl = uploaded.publicUrl;
            }

            const upsertPayload = {
                landlord_id: userId,
                provider: "gcash",
                account_name: gcash.accountName,
                account_number: gcash.accountNumber,
                qr_image_path: qrPath,
                qr_image_url: qrUrl,
                is_enabled: gcash.isEnabled,
                updated_at: new Date().toISOString(),
            };

            const { error: destinationError } = await admin
                .from("landlord_payment_destinations")
                .upsert(upsertPayload, { onConflict: "landlord_id,provider" });

            if (destinationError) {
                console.error("Failed to upsert landlord payment destination:", destinationError);
                return databaseErrorResponse(destinationError, "Failed to save billing settings.");
            }
        }

        if (shouldSaveUtilities) {
            if (deletedConfigIds.length > 0) {
                const { error: deleteError } = await admin
                    .from("utility_configs")
                    .delete()
                    .in("id", deletedConfigIds)
                    .eq("landlord_id", userId);
                if (deleteError) {
                    console.error("Failed to delete utility configs:", deleteError);
                    return databaseErrorResponse(deleteError, "Failed to save billing settings.");
                }
            }

            for (const item of utilityConfigs) {
                const unitId = item.unit_id;

                const row: Record<string, unknown> = {
                    landlord_id: userId,
                    property_id: item.property_id,
                    unit_id: unitId,
                    utility_type: item.utility_type,
                    billing_mode: item.billing_mode,
                    rate_per_unit: item.rate_per_unit,
                    unit_label: item.unit_label,
                    is_active: item.is_active,
                    effective_from: item.effective_from,
                    effective_to: item.effective_to,
                    note: item.note,
                    updated_at: new Date().toISOString(),
                };

                if (item.id) {
                    // Ownership of item.id was verified above; keep the write scoped to this landlord too.
                    const { error: updateError } = await admin
                        .from("utility_configs")
                        .update(row as any)
                        .eq("id", item.id)
                        .eq("landlord_id", userId);
                    if (updateError) return databaseErrorResponse(updateError, "Failed to save billing settings.");
                } else {
                    // Check if a configuration exists for this property/unit/utility/effective_from scope
                    let matchQuery = admin
                        .from("utility_configs")
                        .select("id")
                        .eq("landlord_id", userId)
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
                        if (updateError) return databaseErrorResponse(updateError, "Failed to save billing settings.");
                    } else {
                        const { error: insertError } = await admin
                            .from("utility_configs")
                            .insert(row as any);
                        if (insertError) return databaseErrorResponse(insertError, "Failed to save billing settings.");
                    }
                }
            }
        }

        const workspace = await getBillingWorkspace(admin, userId);
        return NextResponse.json(workspace);
    } catch (error: any) {
        console.error("Failed to save billing workspace:", error);
        return NextResponse.json({ error: "Failed to save billing settings." }, { status: 500 });
    }
}
