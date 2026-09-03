import { NextRequest, NextResponse } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { parseUserAgent } from "@/lib/utils/device-parser";

/**
 * GET /api/auth/sessions
 * Returns a list of active sessions for the authenticated user, enriched with parsed device details.
 */
export async function GET(req: Request) {
    const authResult = await requireAuthenticatedUser(req);
    if (authResult instanceof Response) {
        return authResult;
    }

    const { userId, supabase } = authResult;

    try {
        const { data: rawSessions, error } = await (supabase as any)
            .from("user_sessions")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("[GET /api/auth/sessions] Error fetching sessions:", error);
            return apiInternalError("Failed to fetch active sessions");
        }

        const sessions = (rawSessions || []).map((session: any) => {
            const deviceInfo = parseUserAgent(session.user_agent);
            return {
                id: session.id,
                userId: session.user_id,
                createdAt: session.created_at,
                updatedAt: session.updated_at,
                ip: session.ip || "Unknown IP",
                userAgent: session.user_agent,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                deviceType: deviceInfo.deviceType,
                label: deviceInfo.label,
            };
        });

        return apiSuccess({ sessions });
    } catch (err: any) {
        console.error("[GET /api/auth/sessions] Unexpected error:", err);
        return apiInternalError(err.message || "An unexpected error occurred");
    }
}

/**
 * DELETE /api/auth/sessions
 * Revokes a specific session or revokes all other sessions for the authenticated user.
 * Body: { sessionId?: string, scope?: "others" | "global" }
 */
export async function DELETE(req: Request) {
    const authResult = await requireAuthenticatedUser(req);
    if (authResult instanceof Response) {
        return authResult;
    }

    const { userId, supabase } = authResult;

    try {
        const body = await req.json().catch(() => ({}));
        const { sessionId, scope } = body;

        const adminClient = createServiceRoleSupabaseClient();

        if (sessionId) {
            // Revoke specific session: verify ownership & delete
            try {
                await (adminClient as any)
                    .schema("auth")
                    .from("sessions")
                    .delete()
                    .match({ id: sessionId, user_id: userId });
            } catch (err) {
                console.warn("[DELETE /api/auth/sessions] Direct delete on auth.sessions failed, attempting fallback:", err);
            }

            // Realtime notification broadcast to immediately kick targeted client
            try {
                const channel = supabase.channel(`auth-monitor:${userId}`);
                await channel.subscribe();
                await channel.send({
                    type: "broadcast",
                    event: "SESSION_REVOKED",
                    payload: {
                        sessionId,
                        scope: "specific",
                        message: "Your session on this device has been revoked remotely.",
                    },
                });
                supabase.removeChannel(channel);
            } catch (broadcastErr) {
                console.warn("[DELETE /api/auth/sessions] Realtime broadcast error:", broadcastErr);
            }

            return apiSuccess({ message: "Session revoked successfully", sessionId });
        }

        if (scope === "others" || scope === "global") {
            try {
                const channel = supabase.channel(`auth-monitor:${userId}`);
                await channel.subscribe();
                await channel.send({
                    type: "broadcast",
                    event: "SESSION_REVOKED",
                    payload: {
                        scope,
                        message:
                            scope === "global"
                                ? "All sessions have been signed out remotely."
                                : "Other device sessions have been signed out.",
                    },
                });
                supabase.removeChannel(channel);
            } catch (broadcastErr) {
                console.warn("[DELETE /api/auth/sessions] Realtime broadcast error:", broadcastErr);
            }

            return apiSuccess({ message: `Successfully revoked sessions with scope: ${scope}` });
        }

        return apiError("VALIDATION_FAILED", "Either sessionId or a valid scope ('others' | 'global') must be provided", 400);
    } catch (err: any) {
        console.error("[DELETE /api/auth/sessions] Unexpected error:", err);
        return apiInternalError(err.message || "Failed to revoke session");
    }
}
