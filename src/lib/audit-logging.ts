import { createClient } from "./supabase/server";

export interface AuditEvent {
  leaseId: string;
  eventType: "signing_link_generated" | "signing_link_accessed" | "signing_link_expired" | "signing_link_regenerated" | "tenant_signed" | "landlord_signed" | "lease_activated" | "signing_failed";
  actorId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event for lease signing workflow
 * Captures all signing-related events for compliance and debugging
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("lease_signing_audit").insert({
    lease_id: event.leaseId,
    event_type: event.eventType,
    actor_id: event.actorId || null,
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
    metadata: event.metadata || {},
  });

  if (error) {
    console.error("[audit-logging] Failed to log audit event:", error);
    throw new Error(`Failed to log audit event: ${error.message}`);
  }
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Get the first IP in the chain (original client)
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}
