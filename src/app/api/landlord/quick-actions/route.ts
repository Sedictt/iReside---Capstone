import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser, requireRole } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import {
    sanitizeQuickActionsConfig,
    type QuickActionsConfig,
} from "@/lib/landlord/quick-actions";
import { parseJsonBody } from "@/lib/validation/server";

const actionId = z.string({ error: "Action ID must be text." }).trim().min(1, "Action ID is required.").max(64, "Action ID is too long.");

interface CachedQuickActions {
    config: QuickActionsConfig;
    expiresAt: number;
}
const quickActionsMemoryCache = new Map<string, CachedQuickActions>();

const quickActionsPatchSchema = z.object({
    order: z.array(actionId).max(100, "Too many actions.").optional(),
    hidden: z.array(actionId).max(100, "Too many actions.").optional(),
    sortMode: z.enum(["custom", "frequently_used"], { error: "Select a valid sort mode." }).optional(),
    usageCounts: z
        .record(actionId, z.number({ error: "Usage count must be a number." }).int("Usage count must be a whole number.").min(0, "Usage count cannot be negative.").max(1_000_000_000, "Usage count is too large."))
        .refine((counts) => Object.keys(counts).length <= 100, "Too many actions.")
        .optional(),
});

/**
 * GET /api/landlord/quick-actions
 * Retrieves the landlord's quick actions layout, visibility, and sorting preferences.
 */
export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;

    try {
        requireRole(authContext, "landlord", "admin");
    } catch (e: unknown) {
        return e instanceof Response
            ? e
            : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = authContext;

    // Check memory cache (30s TTL)
    const cached = quickActionsMemoryCache.get(userId);
    if (cached && Date.now() < cached.expiresAt) {
        return NextResponse.json({ success: true, config: cached.config }, {
            headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" }
        });
    }

    const admin = createServiceRoleSupabaseClient();

    try {
        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const socialsRecord =
            profile.socials && typeof profile.socials === "object"
                ? (profile.socials as Record<string, any>)
                : {};

        const config: QuickActionsConfig = sanitizeQuickActionsConfig(socialsRecord.quick_actions);

        quickActionsMemoryCache.set(userId, {
            config,
            expiresAt: Date.now() + 30_000,
        });

        return NextResponse.json({ success: true, config }, {
            headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" }
        });
    } catch (err: unknown) {
        console.error("[GET /api/landlord/quick-actions] Error:", err);
        return NextResponse.json(
            { error: "Failed to load quick actions configuration" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/landlord/quick-actions
 * Updates order, hidden items, sort strategy, and/or usage statistics.
 */
export async function PATCH(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;

    try {
        requireRole(authContext, "landlord", "admin");
    } catch (e: unknown) {
        return e instanceof Response
            ? e
            : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = authContext;
    const admin = createServiceRoleSupabaseClient();

    const validation = await parseJsonBody(request, quickActionsPatchSchema);
    if (!validation.ok) return validation.response;

    try {

        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .select("socials")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const currentSocials =
            profile.socials && typeof profile.socials === "object"
                ? (profile.socials as Record<string, any>)
                : {};

        const currentConfig = sanitizeQuickActionsConfig(currentSocials.quick_actions);

        const mergedConfig: QuickActionsConfig = sanitizeQuickActionsConfig({
            ...currentConfig,
            ...(validation.data.order ? { order: validation.data.order } : {}),
            ...(validation.data.hidden ? { hidden: validation.data.hidden } : {}),
            ...(validation.data.sortMode ? { sortMode: validation.data.sortMode } : {}),
            ...(validation.data.usageCounts
                ? {
                      usageCounts: {
                          ...currentConfig.usageCounts,
                          ...validation.data.usageCounts,
                      },
                  }
                : {}),
            lastUpdated: new Date().toISOString(),
        });

        const updatedSocials: Record<string, any> = {
            ...currentSocials,
            quick_actions: mergedConfig,
        };

        const { error: updateError } = await (admin as any)
            .from("profiles")
            .update({
                socials: updatedSocials,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            config: mergedConfig,
        });
    } catch (err: unknown) {
        console.error("[PATCH /api/landlord/quick-actions] Error:", err);
        return NextResponse.json(
            { error: "Failed to update quick actions configuration" },
            { status: 500 }
        );
    }
}
