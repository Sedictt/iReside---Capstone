import type { SupabaseClient } from "@supabase/supabase-js";
import type { UnitHoldInfo } from "./application-intake";
import type { HoldDurationPreset } from "./validation/schemas/tenant-lifecycle.schema";

export function resolveHoldExpiryIso(preset: HoldDurationPreset, from: Date = new Date()): string | null {
    switch (preset) {
        case "24h":
            return new Date(from.getTime() + 24 * 60 * 60 * 1000).toISOString();
        case "48h":
            return new Date(from.getTime() + 48 * 60 * 60 * 1000).toISOString();
        case "72h":
            return new Date(from.getTime() + 72 * 60 * 60 * 1000).toISOString();
        case "manual":
            return null;
    }
}

export function isHoldExpired(hold: UnitHoldInfo | null | undefined, now: Date = new Date()): boolean {
    if (!hold) return true;
    if (!hold.hold_expires_at) return false;
    const expiresMs = new Date(hold.hold_expires_at).getTime();
    if (Number.isNaN(expiresMs)) return false;
    return expiresMs <= now.getTime();
}

export function parseUnitHoldMapFromTemplate(
    contractTemplate: unknown,
    now: Date = new Date()
): Record<string, UnitHoldInfo> {
    if (!contractTemplate || typeof contractTemplate !== "object" || Array.isArray(contractTemplate)) {
        return {};
    }
    const rawMap = (contractTemplate as Record<string, unknown>).unit_holds;
    if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
        return {};
    }

    const activeMap: Record<string, UnitHoldInfo> = {};
    for (const [unitId, entry] of Object.entries(rawMap as Record<string, unknown>)) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
        const record = entry as Record<string, unknown>;
        const heldForName = typeof record.held_for_name === "string" ? record.held_for_name.trim() : "";
        if (!heldForName) continue;

        const holdInfo: UnitHoldInfo = {
            held_for_name: heldForName,
            held_by_application_id:
                typeof record.held_by_application_id === "string" ? record.held_by_application_id : null,
            hold_expires_at: typeof record.hold_expires_at === "string" ? record.hold_expires_at : null,
            hold_note: typeof record.hold_note === "string" ? record.hold_note : null,
            created_at: typeof record.created_at === "string" ? record.created_at : undefined,
        };

        if (!isHoldExpired(holdInfo, now)) {
            activeMap[unitId] = holdInfo;
        }
    }
    return activeMap;
}

export function getActiveUnitHold(
    contractTemplate: unknown,
    unitId: string,
    now: Date = new Date()
): UnitHoldInfo | null {
    const map = parseUnitHoldMapFromTemplate(contractTemplate, now);
    return map[unitId] ?? null;
}

export function setUnitHoldInTemplate(
    contractTemplate: unknown,
    unitId: string,
    holdInfo: UnitHoldInfo | null,
    now: Date = new Date()
): Record<string, unknown> {
    const base: Record<string, unknown> =
        contractTemplate && typeof contractTemplate === "object" && !Array.isArray(contractTemplate)
            ? { ...(contractTemplate as Record<string, unknown>) }
            : {};

    const currentHolds = parseUnitHoldMapFromTemplate(base, now);
    if (holdInfo) {
        currentHolds[unitId] = holdInfo;
    } else {
        delete currentHolds[unitId];
    }

    base.unit_holds = currentHolds;
    return base;
}

export async function clearUnitHoldForProperty(
    supabase: SupabaseClient<any, any, any>,
    propertyId: string,
    unitId: string
): Promise<void> {
    try {
        const { data: property } = await supabase
            .from("properties")
            .select("id, contract_template")
            .eq("id", propertyId)
            .maybeSingle();

        if (!property) return;
        const activeHold = getActiveUnitHold(property.contract_template, unitId);
        if (!activeHold) return;

        const updatedTemplate = setUnitHoldInTemplate(property.contract_template, unitId, null);
        await supabase
            .from("properties")
            .update({ contract_template: updatedTemplate as any, updated_at: new Date().toISOString() })
            .eq("id", propertyId);
    } catch (err) {
        console.error("[unit-hold] Failed to clear unit hold:", err);
    }
}
