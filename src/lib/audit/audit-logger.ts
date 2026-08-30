import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export type AuditCategory = "billing" | "security" | "settings" | "properties" | "maintenance" | "general";
export type AuditSeverity = "info" | "warning" | "critical";

export interface LogUserActivityParams {
    userId: string;
    userRole?: "landlord" | "tenant" | "admin" | "system";
    action: string;
    category: AuditCategory;
    title: string;
    description: string;
    severity?: AuditSeverity;
    targetId?: string | null;
    targetType?: string | null;
    metadata?: Record<string, any>;
    ipAddress?: string | null;
    userAgent?: string | null;
}

// Ethical PII and Secret Sanitizer
const SENSITIVE_KEYS = [
    "password", "secret", "token", "authorization", "cookie", 
    "api_key", "apikey", "pin", "cvv", "card_number", "ssn"
];

function sanitizeMetadata(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== "object") return {};
    
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Strip sensitive keys completely
        if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
            sanitized[key] = "[REDACTED]";
            continue;
        }

        // Mask phone/GCash numbers
        if (typeof value === "string" && (lowerKey.includes("phone") || lowerKey.includes("gcash") || lowerKey.includes("mobile"))) {
            sanitized[key] = value.replace(/^(\+?\d{2,4})?(\d{3})\d{4}(\d{3,4})$/, "$1$2****$3");
            continue;
        }

        // Mask emails
        if (typeof value === "string" && lowerKey.includes("email") && value.includes("@")) {
            const [user, domain] = value.split("@");
            sanitized[key] = `${user.slice(0, 2)}***@${domain}`;
            continue;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeMetadata(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Device & User Agent Simplifier (non-invasive)
export function simplifyUserAgent(ua?: string | null): string {
    if (!ua) return "Web Browser";
    
    let browser = "Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "Desktop";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return `${browser} on ${os}`;
}

/**
 * Centrally log user activities with data minimization and non-blocking resilience.
 */
export async function logUserActivity(params: LogUserActivityParams, customClient?: SupabaseClient<any, any, any>): Promise<void> {
    try {
        const client = customClient || createServiceRoleSupabaseClient();
        const sanitizedData = sanitizeMetadata(params.metadata || {});
        const simplifiedDevice = simplifyUserAgent(params.userAgent);

        // Attempt insert into user_audit_logs
        const { error } = await (client as any)
            .from("user_audit_logs")
            .insert({
                user_id: params.userId,
                user_role: params.userRole || "landlord",
                action: params.action,
                category: params.category,
                title: params.title,
                description: params.description,
                severity: params.severity || "info",
                target_id: params.targetId || null,
                target_type: params.targetType || null,
                metadata: {
                    ...sanitizedData,
                    device: simplifiedDevice,
                },
                ip_address: params.ipAddress ? "[MASKED]" : null,
                user_agent: simplifiedDevice,
            });

        if (error) {
            // If table doesn't exist yet, gracefully log in development
            if (error.code === "42P01" || error.message?.includes("does not exist")) {
                console.info("[Audit Log Fallback]", {
                    action: params.action,
                    category: params.category,
                    title: params.title,
                    userId: params.userId,
                    time: new Date().toISOString()
                });
                return;
            }
            console.warn("[Audit Logger Warning]", error.message);
        }
    } catch (err) {
        // Non-blocking: never fail user transaction if audit fails
        console.error("[Audit Logger Exception]", err);
    }
}
